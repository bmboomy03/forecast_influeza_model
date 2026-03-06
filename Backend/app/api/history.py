from fastapi import APIRouter
from app.repository.history_repository import get_historical_data

router = APIRouter()


@router.get("/history")
def read_history():
    df = get_historical_data()
    return df.to_dict(orient="records")
