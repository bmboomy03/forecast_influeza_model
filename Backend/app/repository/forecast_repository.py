from sqlalchemy.orm import Session
from app.models import InfluenzaForecast


def get_forecast_data(db: Session):
    return (
        db.query(InfluenzaForecast)
        .order_by(InfluenzaForecast.forecast_date.asc())
        .all()
    )
