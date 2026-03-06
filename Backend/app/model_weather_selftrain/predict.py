import joblib
import pandas as pd

from app.database import fetch_daily_data
from app.model_weather_selftrain.feature import (
    forecast_weather_weekly,
    weather_features,
)
from app.preprocessing import preprocess_to_weekly

FC_MODEL_DIR = r"app\model_weather_selftrain\weather_model"


def load_models_weather():

    model_temp = joblib.load(f"{FC_MODEL_DIR}/weather_models_temp.pkl")
    model_hum = joblib.load(f"{FC_MODEL_DIR}/weather_models_hum.pkl")

    return {
        "temp": model_temp,
        "hum": model_hum,
    }


def predict_latest_weather(df: pd.DataFrame):

    models = load_models_weather()
    model_temp = models["temp"]
    model_hum = models["hum"]

    last_date = df.index[-1]

    fc_weather = forecast_weather_weekly(
        model_temp,
        model_hum,
        df,
        weather_features,
        start_date=pd.to_datetime(last_date),
        horizon=4,
    )

    return fc_weather


# ========================================================================================
def main():
    query = """
                WITH cleaned_influenza AS (
            -- ขั้นตอนที่ 1: เลือกข้อมูลที่ Unique ตาม lab_result_id และเอาค่าล่าสุด
            SELECT DISTINCT ON (fi.lab_result_id)
                fi.finish_date::DATE AS report_date,
                fi.influenza
            FROM clinical.fact_influenza fi
            INNER JOIN raw.patient p ON p.hncode = fi.hn
            WHERE CAST(fi.visit_date AS TEXT) >= '2022-06-01'
            ORDER BY fi.lab_result_id, fi.finish_date DESC
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
            WHERE fw.get_dt >= '2022-06-01'
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
    df = preprocess_to_weekly(df)
    predictions_weather = predict_latest_weather(df)
    print(predictions_weather)
    last_date = df.index[-1]
    print("Latest date in data:", last_date)


if __name__ == "__main__":
    main()
