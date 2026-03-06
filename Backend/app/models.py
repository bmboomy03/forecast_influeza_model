from sqlalchemy import Column, Integer, DateTime, Float, String

from .database import Base


# ======================================================
# ตารางข้อมูลจริง (clinical.influenza_model)
# ======================================================
class DiseaseData(Base):
    __tablename__ = "influenza_model"
    __table_args__ = {"schema": "clinical"}  # 👈 สำคัญมาก

    id = Column(Integer, primary_key=True, index=True)

    finish_date = Column(DateTime, nullable=False, index=True)

    weekly_cases = Column(Float)
    temperature_2m_mean = Column(Float)
    relative_humidity_2m_mean = Column(Float)
    infection_rate = Column(Float)
    daily_cases = Column(Float)
    population = Column(Float)


# ======================================================
# ตารางเก็บผลพยากรณ์ (clinical.influenza_forecast)
# ======================================================
class InfluenzaForecast(Base):
    __tablename__ = "influenza_forecast"
    __table_args__ = {"schema": "clinical"}  # 👈 สำคัญมาก

    forecast_date = Column(DateTime, primary_key=True, index=True)

    forecast_case = Column(Float)

    forecast_rate = Column(Float, nullable=True)

    reference_date = Column(DateTime, nullable=False, index=True)

    confidence_ir = Column(String(255), nullable=True)
    confidence_case = Column(String(255), nullable=True)
