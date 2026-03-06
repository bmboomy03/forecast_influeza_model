import requests
import pandas as pd
from app.model_weather_selftrain.predict import predict_latest_weather

BASE_URL = "https://api.open-meteo.com/v1/forecast"


def get_daily_forecast(lat, lon, days=3):

    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_mean,relative_humidity_2m_mean",
        "timezone": "Asia/Bangkok",
        "forecast_days": days,
    }

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()

    df = pd.DataFrame(
        {
            "date": data["daily"]["time"],
            "temp_trend": data["daily"]["temperature_2m_mean"],
            "hum_trend": data["daily"]["relative_humidity_2m_mean"],
        }
    )

    df["date"] = pd.to_datetime(df["date"])
    df.set_index("date", inplace=True)

    return df


def get_weekly_forecast(lat=7.8804, lon=98.3923, weeks=2):

    max_days = 16  # Open-Meteo limit
    days = min(weeks * 7, max_days)

    daily = get_daily_forecast(lat, lon, days=days)
    # daily = daily[daily.index > last_date]
    weekly = daily.resample("W-SUN").mean()

    return weekly


def get_weather_with_fallback(df, last_date):

    expected_next_week = last_date + pd.Timedelta(weeks=1)

    try:
        fc_weather = get_weekly_forecast(
            lat=7.8804,
            lon=98.3923,
            weeks=3,  # ขอ 3 สัปดาห์เลย
        )

        # ✅ 1) index ต้องเป็น datetime
        if not isinstance(fc_weather.index, pd.DatetimeIndex):
            raise ValueError("API forecast has invalid index")

        # ✅ 2) ต้องมีอย่างน้อย 3 สัปดาห์
        if len(fc_weather) < 3:
            raise ValueError("API forecast less than 3 weeks")

        # ✅ 3) ต้องมีสัปดาห์ถัดไป
        if expected_next_week not in fc_weather.index:
            raise ValueError("API missing next week forecast")

        print("Using API weather forecast")
        return fc_weather.iloc[:3]  # ตัดให้เหลือ 3 สัปดาห์พอดี

    except Exception as e:
        print(f"API weather failed → fallback to backend model ({e})")
        return predict_latest_weather(df)


def main():
    lat = 7.8804
    lon = 98.3923
    weeks = 2

    weekly_forecast = get_weekly_forecast(lat, lon, weeks)
    print(weekly_forecast)


if __name__ == "__main__":
    main()
