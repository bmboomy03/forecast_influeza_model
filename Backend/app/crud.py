from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from . import models


def get_stats(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    query = db.query(models.DiseaseData)

    # กรองวันที่เริ่มต้น
    if start_date is not None:
        query = query.filter(models.DiseaseData.finish_date >= start_date)

    # กรองวันที่สิ้นสุด
    if end_date is not None:
        query = query.filter(models.DiseaseData.finish_date <= end_date)

    # เรียงตามวันที่เสมอ
    return (
        query
        .order_by(models.DiseaseData.finish_date)
        .all()
    )
    
def get_forecasts(db: Session):
    # ดึงข้อมูลพยากรณ์ทั้งหมด เรียงตามวันที่พยากรณ์
    return (
        db.query(models.InfluenzaForecast)
        .order_by(models.InfluenzaForecast.forecast_date)
        .all()
    )