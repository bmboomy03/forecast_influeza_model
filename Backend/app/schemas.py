from pydantic import BaseModel
from datetime import date
from typing import Optional


# เปลี่ยนชื่อคลาสเป็น DashboardData (หรือชื่ออะไรก็ได้ที่คุณถนัด) เพื่อให้ครอบคลุมทั้ง Actual และ Forecast
class DashboardData(BaseModel):
    finish_date: date
    weekly_cases: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    infection_rate: Optional[float] = None
    daily_cases: Optional[float] = None
    population: Optional[float] = None

    # เพิ่ม 3 ตัวนี้เข้ามาเพื่อให้หน้าบ้านรู้ว่าเป็นข้อมูลจริงหรือข้อมูลทำนาย
    type: str  # ใส่ค่า 'actual' หรือ 'forecast'
    confidence_rate: Optional[str] = None
    confidence_case: Optional[str] = None

    class Config:
        from_attributes = True