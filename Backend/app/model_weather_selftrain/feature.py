import numpy as np
import pandas as pd


def feature_weather(df):
    # lag
    df["temp_lag_1"] = df["temperature_2m_mean"].shift(1)
    df["hum_lag_1"] = df["relative_humidity_2m_mean"].shift(1)

    # rolling
    df["temp_roll_2"] = df["temperature_2m_mean"].rolling(2).mean()

    df["hum_roll_2"] = df["relative_humidity_2m_mean"].rolling(2).mean()

    df["temp_diff_1"] = df["temperature_2m_mean"].diff()
    df["hum_diff_1"] = df["relative_humidity_2m_mean"].diff()

    df["weekofyear"] = df.index.isocalendar().week.astype(int)
    df["week_sin"] = np.sin(2 * np.pi * df["weekofyear"] / 52)
    df["week_cos"] = np.cos(2 * np.pi * df["weekofyear"] / 52)

    df = df.dropna()

    return df


weather_features = [
    # autoregressive
    "temp_lag_1",
    "temp_roll_2",
    "hum_lag_1",
    "hum_roll_2",
    "temp_diff_1",
    "hum_diff_1",
    # calendar
    "week_sin",
    "week_cos",
]


params = dict(
    n_estimators=300,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)


# ============================================================================
# ================Functions for forecasting weather ============================
# ============================================================================
def forecast_weather_weekly(
    model_temp,
    model_hum,
    df,
    features,
    start_date,
    horizon=4,
    noise_scale_temp=0.24,
    noise_scale_hum=1.0,
    seed=None,
):

    # ---------- deterministic random ----------
    if seed is None:
        # ผูก seed กับ start_date → วันเดียวกัน = ผลเหมือนเดิม
        seed = int(pd.to_datetime(start_date).strftime("%Y%m%d"))
    rng = np.random.RandomState(seed)

    history = df.loc[:start_date].copy()
    preds = []

    for step in range(1, horizon + 1):

        last = history.iloc[-1].copy()
        next_date = history.index[-1] + pd.Timedelta(weeks=1)

        # ---------- calendar ----------
        week = next_date.isocalendar().week
        last["week_sin"] = np.sin(2 * np.pi * week / 52)
        last["week_cos"] = np.cos(2 * np.pi * week / 52)

        # ---------- lags ----------
        last["temp_lag_1"] = history["temperature_2m_mean"].iloc[-1]
        last["hum_lag_1"] = history["relative_humidity_2m_mean"].iloc[-1]

        # ---------- rolling ----------
        last["temp_roll_2"] = history["temperature_2m_mean"].iloc[-2:].mean()
        last["hum_roll_2"] = history["relative_humidity_2m_mean"].iloc[-2:].mean()

        # ---------- diff ----------
        if len(history) >= 2:
            last["temp_diff_1"] = (
                history["temperature_2m_mean"].iloc[-1]
                - history["temperature_2m_mean"].iloc[-2]
            )
            last["hum_diff_1"] = (
                history["relative_humidity_2m_mean"].iloc[-1]
                - history["relative_humidity_2m_mean"].iloc[-2]
            )
        else:
            last["temp_diff_1"] = 0
            last["hum_diff_1"] = 0

        # ---------- predict ----------
        temp_pred = model_temp.predict(last[features].values.reshape(1, -1))[0]
        hum_pred = model_hum.predict(last[features].values.reshape(1, -1))[0]

        # ---------- deterministic noise ----------
        temp_pred += rng.normal(0, noise_scale_temp)
        hum_pred += rng.normal(0, noise_scale_hum)

        preds.append([temp_pred, hum_pred])

        # ---------- append ----------
        new_row = last.copy()
        new_row["temperature_2m_mean"] = temp_pred
        new_row["relative_humidity_2m_mean"] = hum_pred
        history.loc[next_date] = new_row

    idx = pd.date_range(
        start=start_date + pd.Timedelta(weeks=1), periods=horizon, freq="W-SUN"
    )

    return pd.DataFrame(preds, index=idx, columns=["temp_trend", "hum_trend"])
