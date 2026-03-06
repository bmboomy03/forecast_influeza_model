from calendar import week

import numpy as np
import pandas as pd
from typing import Optional


def create_seasonal_table(df, seasonal_cutoff):

    train_mask = df.index <= seasonal_cutoff

    seasonal_mean = (
        df.loc[train_mask]
        .groupby(df.loc[train_mask].index.isocalendar().week)["Infection_Rate"]
        .mean()
    )

    seasonal_table = seasonal_mean.sort_index().to_frame(name="seasonal_avg")
    seasonal_table["seasonal_slope"] = seasonal_table["seasonal_avg"].diff()

    return seasonal_table


# =======================================================================================
# ============================= INFECTION RATE FEATURES ===============================
# =======================================================================================
def create_features(df, seasonal_table=None):
    """
    Create forecasting features for multi-horizon infection rate prediction.

    Parameters
    ----------
    df : pd.DataFrame
        Must contain:
            - datetime index
            - column 'Infection_Rate'
    seasonal_train_end : pd.Timestamp, optional
        Cutoff date used to compute seasonal baseline.
        If None, uses entire dataset (use carefully in training).

    Returns
    -------
    pd.DataFrame
        DataFrame with features + targets added.
    """

    df = df.copy()

    # -------------------------------------------------
    # 0) Ensure datetime index
    # -------------------------------------------------
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    # -------------------------------------------------
    # 1) Multi-horizon targets
    # -------------------------------------------------
    for h in [1, 2, 3, 4]:
        df[f"y_h{h}"] = df["Infection_Rate"].shift(-h)

    # -------------------------------------------------
    # 2) Lag features
    # -------------------------------------------------
    df["lag_1"] = df["Infection_Rate"].shift(1)
    df["lag_2"] = df["Infection_Rate"].shift(2)
    df["lag_3"] = df["Infection_Rate"].shift(3)

    # -------------------------------------------------
    # 3) Rolling statistics (shift BEFORE rolling!)
    # -------------------------------------------------
    df["roll_2"] = df["Infection_Rate"].shift(1).rolling(2).mean()
    df["roll_3"] = df["Infection_Rate"].shift(1).rolling(3).mean()
    df["roll_4"] = df["Infection_Rate"].shift(1).rolling(4).mean()

    # -------------------------------------------------
    # 4) Growth & acceleration
    # -------------------------------------------------
    df["growth_1"] = (df["lag_1"] - df["lag_2"]) / (df["lag_2"] + 1e-6)
    df["growth_2"] = (df["lag_2"] - df["lag_3"]) / (df["lag_3"] + 1e-6)

    df["g_accel"] = df["growth_1"] - df["growth_2"]
    df["g_accel_abs"] = df["g_accel"].abs()

    df["g_roll_2"] = (df["growth_1"] + df["growth_2"]) / 2
    df["g_strength"] = df["growth_1"].abs()
    df["sign_flip"] = (df["growth_1"] * df["growth_2"]) < 0

    # -------------------------------------------------
    # 5) Volatility (Coefficient of Variation)
    # -------------------------------------------------
    lags_df = df[["lag_1", "lag_2", "lag_3"]]
    vol_3 = lags_df.std(axis=1)
    mean_3 = lags_df.mean(axis=1)
    df["cv_3"] = vol_3 / (mean_3 + 1e-6)

    # -------------------------------------------------
    # 6) Seasonality encoding
    # -------------------------------------------------
    weekofyear = df.index.isocalendar().week.astype(int)

    df["week_sin"] = np.sin(2 * np.pi * weekofyear / 52)
    df["week_cos"] = np.cos(2 * np.pi * weekofyear / 52)

    df["season_progress"] = weekofyear / 52

    # -------------------------------------------------
    # 7) Seasonal baseline (NO HARDCODED DATE)
    # -------------------------------------------------
    if seasonal_table is not None:
        df["seasonal_avg"] = weekofyear.map(seasonal_table["seasonal_avg"])
    df["seasonal_slope"] = weekofyear.map(seasonal_table["seasonal_slope"])
    # -------------------------------------------------
    # 8) Trend interaction
    # -------------------------------------------------
    df["trend_cross"] = df["roll_2"] - df["roll_4"]
    df["trend_cross_slope"] = df["trend_cross"].diff()

    return df


# =======================================================================================
# Function to build future feature row for infection rate weekly prediction
# =======================================================================================
def build_future_feature_row(df, start_date, target, horizon, seasonal_table):

    start_date = pd.to_datetime(start_date)

    history = df.loc[:start_date].copy()
    y = history[target]

    if len(y) < 4:
        raise ValueError("Need at least 4 weeks of history")

    row = {}

    # ---- lag ----
    lag_1 = y.iloc[-1]
    lag_2 = y.iloc[-2]
    lag_3 = y.iloc[-3]

    row["lag_1"] = lag_1
    row["lag_2"] = lag_2
    row["lag_3"] = lag_3

    roll_2 = y.iloc[-2:].mean()
    roll_3 = y.iloc[-3:].mean()
    roll_4 = y.iloc[-4:].mean()

    row["roll_2"] = roll_2
    row["roll_3"] = roll_3
    row["roll_4"] = roll_4

    # ---- growth ----
    growth_1 = (lag_1 - lag_2) / (lag_2 + 1e-6)
    growth_2 = (lag_2 - lag_3) / (lag_3 + 1e-6)

    row["growth_1"] = growth_1
    row["growth_2"] = growth_2
    row["g_accel"] = growth_1 - growth_2
    row["g_accel_abs"] = abs(row["g_accel"])

    # ---- volatility ----
    lags = np.array([lag_1, lag_2, lag_3])
    row["cv_3"] = lags.std() / (lags.mean() + 1e-6)

    # ---- trend summary ----
    row["g_roll_2"] = (growth_1 + growth_2) / 2
    row["sign_flip"] = (growth_1 * growth_2) < 0
    row["g_strength"] = abs(growth_1)

    # ---- future time ----
    future_date = start_date + pd.Timedelta(weeks=horizon)
    week = future_date.isocalendar().week

    row["week_sin"] = np.sin(2 * np.pi * week / 52)
    row["week_cos"] = np.cos(2 * np.pi * week / 52)

    # ---- seasonal (NO LEAK) ----
    # row["seasonal_avg"] = seasonal_table.loc[week, "seasonal_avg"]
    # row["seasonal_slope"] = seasonal_table.loc[week, "seasonal_slope"]
    row["seasonal_avg"] = seasonal_table["seasonal_avg"].get(week, np.nan)
    row["seasonal_slope"] = seasonal_table["seasonal_slope"].get(week, 0)

    row["season_progress"] = week / 52

    # ---- trend cross ----
    trend_cross_now = roll_2 - roll_4

    # slope ต้องดูจากอดีตจริง
    prev_roll_2 = y.iloc[-3:-1].mean()
    prev_roll_4 = y.iloc[-5:-1].mean() if len(y) >= 5 else roll_4

    trend_cross_prev = prev_roll_2 - prev_roll_4

    row["trend_cross"] = trend_cross_now
    row["trend_cross_slope"] = trend_cross_now - trend_cross_prev

    return pd.DataFrame([row], index=[future_date])


"""--------------------------------------------------------------------------------------"""


# =======================================================================================
# ============================= WEEKLY CASES FEATURES ===============================
# =======================================================================================
def create_feature_weeklycase(df):
    df = df.copy()

    # -------------------------------------------------
    # 0) Ensure datetime index
    # -------------------------------------------------
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    # -------------------------------------------------
    # 1) Multi-horizon targets
    # -------------------------------------------------
    for h in [1, 2, 3, 4]:
        df[f"y_h{h}"] = df["Weekly_Cases"].shift(-h)

    df["lag_1"] = df["Weekly_Cases"].shift(1)
    df["lag_2"] = df["Weekly_Cases"].shift(2)
    df["lag_3"] = df["Weekly_Cases"].shift(3)

    df["vol_3"] = df[["lag_1", "lag_2", "lag_3"]].std(axis=1)

    df["roll_3"] = df["Weekly_Cases"].shift(1).rolling(3).mean()
    df["roll_7"] = df["Weekly_Cases"].shift(1).rolling(7).mean()
    df["roll_13"] = df["Weekly_Cases"].shift(1).rolling(13).mean()

    df["dev_long"] = (df["roll_7"] - df["roll_13"]) / (df["roll_13"] + 1e-6)

    df["intensity_ratio"] = df["roll_3"] / (df["roll_13"] + 1e-6)

    df["slope_1"] = df["Weekly_Cases"].shift(1).diff(1)
    df["norm_slope"] = df["slope_1"] / (df["roll_13"] + 1e-6)

    df["accel"] = df["slope_1"].diff(1)
    df["norm_accel"] = df["accel"] / (df["roll_13"] + 1e-6)

    df["local_peak"] = (
        df["Weekly_Cases"].shift(1) == df["Weekly_Cases"].shift(1).rolling(13).max()
    ).astype(int)

    # Ensure peak_week is explicitly a datetime Series
    df["peak_week"] = pd.Series(
        np.where(df["local_peak"] == 1, df.index, pd.NaT),
        index=df.index,
        dtype="datetime64[ns]",
    ).ffill()

    df["weeks_since_peak"] = (df.index - df["peak_week"]).dt.days / 7

    week = df.index.isocalendar().week.astype(int)

    df["week_sin"] = np.sin(2 * np.pi * week / 52)
    df["week_cos"] = np.cos(2 * np.pi * week / 52)

    df["phase_index"] = (
        df["intensity_ratio"] * (1 + 0.5 * df["week_sin"]) * (1 + df["dev_long"])
    )

    lag_4 = df["Weekly_Cases"].shift(4)
    df["momentum_3w"] = df["lag_1"] - lag_4
    df["early_wave_signal"] = df["intensity_ratio"] * df["norm_slope"]

    return df


# =====================================================================================
# Function to build future feature row for weekly cases prediction
# =====================================================================================
def build_future_featureweeklycase_row(df, start_date, target, fc_weather, horizon):

    start_date = pd.to_datetime(start_date)

    # =============================
    # HISTORY
    # =============================
    history = df.loc[:start_date].copy()
    y = history[target]

    if len(y) < 13:
        raise ValueError("Need at least 13 weeks of history")

    row = {}

    # =============================
    # LAGS
    # =============================
    row["lag_1"] = y.iloc[-1]
    row["lag_2"] = y.iloc[-2]
    row["lag_3"] = y.iloc[-3]

    # =============================
    # ROLLING
    # =============================
    roll_3 = y.iloc[-3:].mean()
    roll_7 = y.iloc[-7:].mean()
    roll_13 = y.iloc[-13:].mean()

    row["roll_3"] = roll_3
    row["roll_7"] = roll_7
    row["roll_13"] = roll_13

    # =============================
    # VOLATILITY
    # =============================
    row["vol_3"] = y.iloc[-3:].std()

    # =============================
    # MOMENTUM
    # =============================
    slope_1 = row["lag_1"] - row["lag_2"]
    slope_2 = row["lag_2"] - row["lag_3"]
    accel = slope_1 - slope_2

    row["slope_1"] = slope_1
    row["norm_slope"] = slope_1 / (roll_13 + 1e-6)

    row["accel"] = accel
    row["norm_accel"] = accel / (roll_13 + 1e-6)

    # =============================
    # STRUCTURAL SIGNAL
    # =============================
    row["dev_long"] = (roll_7 - roll_13) / (roll_13 + 1e-6)
    row["intensity_ratio"] = roll_3 / (roll_13 + 1e-6)

    # =============================
    # PEAK MEMORY (NO LEAK)
    # =============================
    rolling_max_13 = y.iloc[-13:].max()
    row["local_peak"] = int(row["lag_1"] == rolling_max_13)

    # หา peak ล่าสุดย้อนหลังแบบปลอดภัย
    rolling_max = history[target].rolling(13).max()
    is_peak = history[target] == rolling_max
    peak_weeks = history.index[is_peak.fillna(False)]

    if len(peak_weeks) > 0:
        last_peak_date = peak_weeks[-1]
    else:
        last_peak_date = history.index[-1]

    row["peak_week"] = last_peak_date

    row["weeks_since_peak"] = (start_date - last_peak_date).days / 7

    # =============================
    # FUTURE CALENDAR (ตาม horizon)
    # =============================
    future_date = start_date + pd.Timedelta(weeks=horizon)

    week = int(future_date.isocalendar().week)

    row["week_sin"] = np.sin(2 * np.pi * week / 52)
    row["week_cos"] = np.cos(2 * np.pi * week / 52)

    # =============================
    # PHASE INDEX
    # =============================
    # row["phase_strength"] = row["roll_3"] / (row["roll_13"] + 1e-6)
    row["phase_index"] = (
        row["intensity_ratio"] * (1 + 0.5 * row["week_sin"]) * (1 + row["dev_long"])
    )

    # =============================
    # WEATHER (MATCH FUTURE DATE)
    # =============================
    if fc_weather is not None:
        if future_date in fc_weather.index:
            fc_weather = fc_weather.loc[future_date]
        else:
            # fallback → ใช้ week ล่าสุดที่มี
            fc_weather = fc_weather.iloc[-1]

        row["temperature_2m_mean"] = fc_weather["temp_trend"]
        row["relative_humidity_2m_mean"] = fc_weather["hum_trend"]
    else:
        row["temperature_2m_mean"] = 0.0
        row["relative_humidity_2m_mean"] = 0.0

    row["momentum_3w"] = y.iloc[-1] - y.iloc[-4]
    row["early_wave_signal"] = row["intensity_ratio"] * row["norm_slope"]
    # =============================
    # RETURN
    # =============================
    return pd.DataFrame([row], index=[future_date])
