import os

import joblib
import pandas as pd

from app.database import fetch_daily_data, save_predictions_to_db
from app.preprocessing import preprocess_to_weekly

from app.train import train_models, train_models_weekcase
from app.predict import predict_latest, predict_latest_weekcase

from app.model_weather_selftrain.train import train_models_weather
from app.model_weather_selftrain.predict import predict_latest_weather

from app.evaluation_model.confidece import train_confidence

# ==========================================
# CONFIG
# ==========================================
DATA_SOURCE = "db"  # "csv" หรือ "db"
DATA_PATH = "data/Final_falseV2.csv"


# ==========================================
# LOAD DATA
# ==========================================
def load_data():

    if DATA_SOURCE == "csv":
        df = pd.read_csv(DATA_PATH, index_col=0, parse_dates=True)

    else:
        query = """
                WITH cleaned_influenza AS (
                    -- ขั้นตอนที่ 1: เลือกข้อมูลที่ Unique ตาม lab_result_id และเอาค่าล่าสุด
                    SELECT DISTINCT ON (fi.lab_result_id)
                        fi.finish_date::DATE AS report_date,
                        fi.influenza
                    FROM clinical.fact_influenza fi
                    INNER JOIN raw.patient p ON p.hncode = fi.hn
                    WHERE CAST(fi.visit_date AS TEXT) >= '2022-05-30'
                    ORDER BY fi.lab_result_id, fi.finish_date ASC
                ),
                daily_influenza AS (
                    -- ขั้นตอนที่ 2: นับรวมรายวัน
                    SELECT
                        report_date,
                        COUNT(*) AS total_cases,
                        COUNT(*) FILTER (WHERE influenza ILIKE '%p%') AS positive_cases,
                        ROUND(
                            (COUNT(*) FILTER (WHERE influenza ILIKE '%p%')::NUMERIC / COUNT(*)::NUMERIC),
                            4
                        ) AS infection_rate
                    FROM cleaned_influenza
                    GROUP BY report_date
                ),
                daily_weather AS (
                    -- ขั้นตอนที่ 3: สรุปข้อมูลสภาพอากาศรายวัน
                    SELECT
                        DATE(fw.get_dt) AS weather_date,
                        AVG(fw.temperature_2m) AS avg_temp,
                        AVG(fw.relative_humidity_2m) AS avg_humidity
                    FROM clinical.forecast_weather fw
                    WHERE fw.get_dt >= '2022-05-30'
                    GROUP BY DATE(fw.get_dt)
                )
                select * from (
                SELECT
                    i.report_date AS finish_date,
                    null as weekly_cases,
                    ROUND(w.avg_temp::NUMERIC, 2) AS temperature_2m_mean,
                    ROUND(w.avg_humidity::NUMERIC, 2) AS relative_humidity_2m_mean,
                    i.infection_rate,
                    i.positive_cases as daily_cases,
                    i.total_cases as population
                FROM daily_influenza i
                LEFT JOIN daily_weather w ON i.report_date = w.weather_date
                
                union
                
                select 
                finish_date, weekly_cases, temperature_2m_mean, 
                relative_humidity_2m_mean, infection_rate, daily_cases, population 
                from clinical.influenza_model
                ) as u
                order by u.finish_date asc
        """

        df = fetch_daily_data(query)

        # ---- rename columns ให้ตรงกับ model เดิม ----
        df.rename(
            columns={
                "daily_cases": "Daily_Cases",
                "weekly_cases": "Weekly_Cases",
                "infection_rate": "Infection_Rate",
            },
            inplace=True,
        )

        # ---- set datetime index ----
        if "finish_date" in df.columns:
            df["finish_date"] = pd.to_datetime(df["finish_date"])
            df.set_index("finish_date", inplace=True)

    # ---- ensure datetime index ----
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    return df


# ==========================================
# TRAIN PIPELINE
# ==========================================
def run_train_pipeline(seasonal_cutoff):

    df = load_data()
    df = preprocess_to_weekly(df)

    models = train_models(df, seasonal_cutoff)
    models_weekcase = train_models_weekcase(df)
    models_weather = train_models_weather(df)
    confidence_result = train_confidence(df, seasonal_cutoff)

    artifact_path = "app/evaluation_model/model_artifacts"
    os.makedirs(artifact_path, exist_ok=True)

    joblib.dump(
        confidence_result["confidence_ir_percent"],
        f"{artifact_path}/latest_confidence_infection_rate.pkl",
    )

    joblib.dump(
        confidence_result["confidence_case_percent"],
        f"{artifact_path}/latest_confidence_weekly_cases.pkl",
    )

    print("DEBUG CONF RESULT:", confidence_result)

    return {
        "infection_rate_models": list(models.keys()),
        "weekly_case_models": list(models_weekcase.keys()),
        "weather_models": list(models_weather.keys()),
        "confidence_ir": confidence_result["confidence_ir_percent"],
        "confidence_case": confidence_result["confidence_case_percent"],
    }


# ==========================================
# PREDICT PIPELINE
# ==========================================
def run_predict_pipeline():

    df = load_data()
    df = preprocess_to_weekly(df)

    # ----------------------------
    # 1️⃣ Predict
    # ----------------------------
    predictions = predict_latest(df)
    predictions_weekcase = predict_latest_weekcase(df)
    predictions_weather = predict_latest_weather(df)

    reference_date = df.index.max()
    try:
        confidence_ir = joblib.load(
            "app/evaluation_model/model_artifacts/latest_confidence_infection_rate.pkl"
        )
    except FileNotFoundError:
        confidence_ir = None

    try:
        confidence_case = joblib.load(
            "app/evaluation_model/model_artifacts/latest_confidence_weekly_cases.pkl"
        )
    except FileNotFoundError:
        confidence_case = None
    # ----------------------------
    # 2️⃣ Save infection forecast to DB
    # ----------------------------
    # current_pop = df["population"].iloc[-1] if "population" in df.columns else 100000

    forecast_rows = []

    for horizon, pred_value in predictions.items():

        future_date = reference_date + pd.Timedelta(weeks=horizon)

        # calculated_rate = float(pred_value) / current_pop if current_pop > 0 else 0

        forecast_rows.append(
            {
                "forecast_date": future_date,
                "forecast_case": predictions_weekcase[horizon],
                "forecast_rate": predictions[horizon],
                "reference_date": reference_date,
                "confidence_case": confidence_case,
                "confidence_ir": confidence_ir,
            }
        )

    prediction_df = pd.DataFrame(forecast_rows)

    save_predictions_to_db(prediction_df, "influenza_forecast")

    # ----------------------------
    # 3️⃣ Return result
    # ----------------------------
    return {
        "last_date": reference_date,
        "values_infection_rate": predictions,
        "values_weekcase": predictions_weekcase,
        "values_weather": predictions_weather,
        "confidence_ir": confidence_ir,
        "confidence_case": confidence_case,
    }


# -------------------------------------------------


# def load_data_from_csv(path):
#     df = pd.read_csv(path)
#     return df


# def load_data_from_db():
#     query = ""
#     df = fetch_daily_data(query)
#     return df


# def main():

#     if DATA_SOURCE == "csv":
#         df = load_data_from_csv(DATA_PATH)
#         print("Loaded from CSV")

#     elif DATA_SOURCE == "db":
#         df = load_data_from_db()
#         print("Loaded from DB")

#     else:
#         raise ValueError("Invalid DATA_SOURCE")

#     print("Raw rows:", len(df))

#     df_weekly = preprocess_to_weekly(df)
#     print("Weekly rows:", df_weekly.shape)
#     print(df_weekly.tail(10))


# if __name__ == "__main__":
#     main()
