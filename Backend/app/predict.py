import joblib
import pandas as pd

from app.features import build_future_feature_row, build_future_featureweeklycase_row
from app.config import FEATURES, FEATURES_Weekcase, HORIZONS
from app.weather import get_weather_with_fallback
from app.model_weather_selftrain.predict import predict_latest_weather
from app.preprocessing import preprocess_to_weekly

MODEL_DIR = "models"
WC_MODEL_DIR = "wc_models"


def load_models():
    models = {}
    for h in HORIZONS:
        models[h] = joblib.load(f"{MODEL_DIR}/model_h{h}.pkl")
    return models


def load_models_weekcase():
    models = {}
    for h in HORIZONS:
        models[h] = joblib.load(f"{WC_MODEL_DIR}/wc_model_h{h}.pkl")
    return models


def load_seasonal_table():
    return pd.read_csv(f"{MODEL_DIR}/seasonal_table.csv", index_col=0)


def predict_latest(df: pd.DataFrame):

    models = load_models()
    seasonal_table = load_seasonal_table()

    predictions = {}

    last_date = df.index[-1]

    for h in HORIZONS:

        X_future = build_future_feature_row(
            df=df,
            start_date=last_date,
            target="Infection_Rate",
            horizon=h,
            seasonal_table=seasonal_table,
        )

        X_future = X_future[FEATURES[h]]

        missing = set(FEATURES[h]) - set(X_future.columns)
        if missing:
            raise ValueError(f"Missing features: {missing}")

        pred = models[h].predict(X_future)[0]

        predictions[h] = float(pred)

    return predictions


# =======================================================================================
def predict_latest_weekcase(df: pd.DataFrame):

    models = load_models_weekcase()
    predictions_wc = {}

    last_date = df.index[-1]

    fc_weather = get_weather_with_fallback(df, last_date)

    fc_weather = fc_weather[fc_weather.index > last_date]

    # ensure มีพอสำหรับ horizon
    if len(fc_weather) < 3:
        raise ValueError("Not enough weather forecast weeks available")

    for h in HORIZONS:
        # ถ้า horizon นี้ไม่ได้ใช้ weather → ไม่ต้องส่ง
        if "temperature_2m_mean" not in FEATURES_Weekcase[h]:
            weather_input = None
        else:
            weather_input = fc_weather
        X_future = build_future_featureweeklycase_row(
            df=df,
            start_date=last_date,
            target="Weekly_Cases",
            fc_weather=weather_input,
            horizon=h,
        )

        X_future = X_future[FEATURES_Weekcase[h]]

        missing = set(FEATURES_Weekcase[h]) - set(X_future.columns)
        if missing:
            raise ValueError(f"Missing features: {missing}")

        pred = models[h].predict(X_future)[0]

        predictions_wc[h] = float(pred)
        # print("Last date:", last_date)
    return predictions_wc


# def main():
#     # df = pd.read_csv("data/Final_falseV2.csv")
#     df = preprocess_to_weekly()
#     predic_weekcase = predict_latest_weekcase(df)
#     print(predic_weekcase)


# if __name__ == "__main__":
#     main()
