from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.repository.forecast_repository import get_forecast_data

router = APIRouter()


@router.get("/forecast")
def read_forecast(db: Session = Depends(get_db)):
    data = get_forecast_data(db)
    return data
