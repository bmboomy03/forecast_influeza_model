import pandas as pd
from app.database import fetch_daily_data


def get_historical_data():
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
    df["finish_date"] = pd.to_datetime(df["finish_date"])
    return df
