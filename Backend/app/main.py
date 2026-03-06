import pandas as pd
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from pydantic import BaseModel
from . import models, schemas, crud, database

from .repository.history_repository import get_historical_data
from .api import history, forecast

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(history.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Influenza Forecast API is running!"}


@app.get("/api/dashboard", response_model=List[schemas.DashboardData])
def get_dashboard_data(db: Session = Depends(database.get_db)):
    results = []

    # --- 1. ดึงข้อมูลจริง (Actual) จากตารางหลัก ---
    df = get_historical_data()
    # ให้แน่ใจว่าเป็น datetime
    df["finish_date"] = pd.to_datetime(df["finish_date"])

    # สร้าง column year + week
    df["year"] = df["finish_date"].dt.isocalendar().year
    df["week"] = df["finish_date"].dt.isocalendar().week

    # group รายสัปดาห์
    weekly_df = (
        df.groupby(["year", "week"])
        .agg(
            finish_date=("finish_date", "max"),  # วันสุดท้ายของสัปดาห์
            weekly_cases=("daily_cases", "sum"),
            temperature=("temperature_2m_mean", "mean"),
            humidity=("relative_humidity_2m_mean", "mean"),
            population=("population", "sum"),
        )
        .reset_index()
    )

    # คำนวณ weighted infection rate
    weekly_df["infection_rate"] = 0.0
    mask = weekly_df["population"] > 0
    weekly_df.loc[mask, "infection_rate"] = (
        weekly_df.loc[mask, "weekly_cases"] / weekly_df.loc[mask, "population"]
    ) * 100

    # เรียงตาม finish_date จากใหม่ไปเก่า
    weekly_df = weekly_df.sort_values("finish_date", ascending=True)

    # ✅ เอาเฉพาะสัปดาห์ที่จบวันอาทิตย์ (Sunday = 6 ใน pandas weekday)
    weekly_df = weekly_df[weekly_df["finish_date"].dt.weekday == 6]
    for _, row in weekly_df.iterrows():
        results.append(
            {
                "finish_date": row.finish_date,
                "weekly_cases": float(row.weekly_cases or 0),
                "temperature": float(row.temperature or 0),
                "humidity": float(row.humidity or 0),
                "infection_rate": float(row.infection_rate or 0),
                "daily_cases": None,
                "population": float(row.population or 0),
                "type": "actual",
                "confidence_rate": None,
                "confidence_case": None,
            }
        )
    # --- 2. ดึงข้อมูลทำนาย (Forecast) จากตารางโคลน/ทำนาย ---
    forecast_data = crud.get_forecasts(db)
    for row in forecast_data:
        results.append(
            {
                "finish_date": row.forecast_date,  # แมป forecast_date ให้หน้าบ้านมองเห็นเป็น finish_date
                "weekly_cases": (
                    float(row.forecast_case) if row.forecast_case is not None else 0.0
                ),
                "temperature": None,
                "humidity": None,
                "infection_rate": (
                    float(row.forecast_rate) if row.forecast_rate is not None else 0.0
                ),
                "daily_cases": None,
                "population": None,
                "type": "forecast",
                "confidence_rate": (
                    row.confidence_ir if row.confidence_ir is not None else None
                ),
                "confidence_case": (
                    row.confidence_case if row.confidence_case is not None else None
                ),
                # "confidence_rate": None,
                # "confidence_case": None,
            }
        )

    # ส่ง result ก้อนเดียวที่มีทั้งอดีตและอนาคต ให้หน้าเว็บเลย

    return results


@app.get("/api/daily-recent", response_model=List[schemas.DashboardData])
def get_daily_recent(limit: int = 60):
    df = get_historical_data()

    # เรียงจากใหม่ไปเก่า
    df = df.sort_values("finish_date", ascending=False)

    # เอาแค่ limit ล่าสุด
    df = df.head(limit)

    # กลับลำดับให้เก่า → ใหม่ (เพื่อวาดกราฟ)
    df = df.sort_values("finish_date", ascending=True)

    results = []

    for _, row in df.iterrows():

        daily_pop = float(row.population or 0)
        daily_case = float(row.daily_cases or 0)

        rate = 0.0
        if daily_pop > 0:
            rate = (daily_case / daily_pop) * 100

        results.append(
            {
                "finish_date": row.finish_date,
                "weekly_cases": None,
                "temperature": float(row.temperature_2m_mean or 0),
                "humidity": float(row.relative_humidity_2m_mean or 0),
                "infection_rate": rate,
                "daily_cases": daily_case,
                "population": daily_pop,
                "type": "actual",
            }
        )

    return results
