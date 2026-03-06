# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# # import os
# # from dotenv import load_dotenv
# from sqlalchemy import text
# import pandas as pd
# from app.config import Config

# # load_dotenv()

# # SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
# SQLALCHEMY_DATABASE_URL = Config.get_database_url()

# engine = create_engine(SQLALCHEMY_DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()


# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ---------------------------------------------------------
# # เพิ่มฟังก์ชันสำหรับดึงข้อมูลเข้า Pipeline
# # ---------------------------------------------------------


# def fetch_daily_data(query: str, params: dict = None) -> pd.DataFrame:
#     """
#     ดึงข้อมูลจาก PostgreSQL ออกมาเป็น Pandas DataFrame สำหรับงาน AI/Pipeline
#     """
#     # ลบ with engine.connect() ออก และส่ง engine เข้าไปใน con=engine ตรงๆ เลยครับ
#     df = pd.read_sql(query, con=engine, params=params)
#     return df

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import pandas as pd
from sqlalchemy import text
from app.config import Config

# ใช้ URL object จาก Config
SQLALCHEMY_DATABASE_URL = Config.get_database_url()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # ป้องกัน connection หลุด
    pool_recycle=300,  # recycle ทุก 5 นาที
    echo=False,  # เปลี่ยนเป็น True ถ้าจะ debug SQL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# ดึงข้อมูลเข้า Pipeline
# ---------------------------------------------------------
def fetch_daily_data(query: str, params: dict = None) -> pd.DataFrame:
    df = pd.read_sql(text(query), con=engine, params=params)
    return df


# def save_predictions_to_db(df_predictions: pd.DataFrame, table_name: str):
#     """
#     รับผลทำนายที่เป็น DataFrame แล้วเอาไปบันทึกใส่ตารางใน PostgreSQL
#     """
#     # ลบ with engine.connect() ออก
#     # แล้วใช้ con=engine ตรงๆ เพื่อให้ Pandas บังคับ Commit ข้อมูลลง Database ทันที
#     df_predictions.to_sql(table_name, con=engine, if_exists='append', index=False)

#     # เพิ่มบรรทัดนี้เพื่อปริ้นท์บอกว่าเซฟเสร็จแล้ว จะได้ชัวร์ๆ ครับ
#     print(f"บันทึกข้อมูลผลทำนาย {len(df_predictions)} สัปดาห์ ลงตาราง {table_name} สำเร็จ!")


# def save_predictions_to_db(df_predictions: pd.DataFrame, table_name: str):
#     """
#     ลบข้อมูลเก่าทิ้ง (DELETE) แล้วบันทึกผลพยากรณ์ชุดล่าสุดลงไป (APPEND)
#     วิธีนี้ช่วยแก้ปัญหา "Object not found" จากการใช้ replace
#     """
#     try:
#         with engine.begin() as conn:
#             # 1. พยายามลบข้อมูลเก่าออกก่อน
#             # ใช้ try-except เผื่อกรณีรันครั้งแรกแล้วยังไม่มีตารางนี้อยู่ใน DB
#             try:
#                 conn.execute(text(f"DELETE FROM {table_name}"))
#                 print(f" เคลียร์ข้อมูลเก่าในตาราง {table_name} เรียบร้อย")
#             except Exception as e:
#                 print(
#                     f"ยังไม่มีตาราง {table_name} หรือลบไม่ได้ (อาจเป็นการรันครั้งแรก) ข้ามไปขั้นตอนสร้างตาราง"
#                 )

#             # 2. บันทึกข้อมูลใหม่ลงไป (ใช้ append)
#             # ถ้าตารางยังไม่มี Pandas จะสร้างให้เอง
#             # ถ้าตารางมีแล้ว ข้อมูลจะถูกต่อท้าย (ซึ่งเราเพิ่งลบของเก่าไป มันเลยเหมือนใหม่หมด)
#             df_predictions.to_sql(table_name, con=conn, if_exists="append", index=False)

#         print(
#             f" อัปเดตตาราง {table_name}: บันทึกผลพยากรณ์ใหม่ {len(df_predictions)} ชุดเรียบร้อย!"
#         )

#     except Exception as e:
#         print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")

from sqlalchemy import text
import pandas as pd


# def save_predictions_to_db(
#     df_predictions: pd.DataFrame,
#     table_name: str,
#     schema: str = "clinical",
# ):
#     """
#     ลบข้อมูลเก่าแล้ว append ข้อมูลใหม่ลง schema ที่กำหนด
#     """

#     try:
#         with engine.begin() as conn:

#             # 1️⃣ ลบข้อมูลเก่า
#             # try:
#             #     conn.execute(text(f'DELETE FROM "{schema}"."{table_name}"'))
#             #     print(f"เคลียร์ข้อมูลเก่าใน {schema}.{table_name} เรียบร้อย")
#             # except Exception:
#             #     print(f"ยังไม่มีตาราง {schema}.{table_name} หรือยังลบไม่ได้ (อาจรันครั้งแรก)")

#             # 2️⃣ บันทึกข้อมูลใหม่
#             df_predictions.to_sql(
#                 name=table_name,
#                 con=conn,
#                 schema=schema,  # 👈 สำคัญมาก
#                 if_exists="append",
#                 index=False,
#                 method="multi",  # เร็วขึ้น
#             )

#         print(f"อัปเดต {schema}.{table_name} เรียบร้อย ({len(df_predictions)} แถว)")

#     except Exception as e:
#         print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")


# =======================================================================================
def save_predictions_to_db(
    df_predictions: pd.DataFrame,
    table_name: str,
    schema: str = "clinical",
):
    try:
        with engine.begin() as conn:
            # สร้าง column list จาก dataframe
            columns = df_predictions.columns.tolist()
            col_names = ", ".join(columns)
            col_values = ", ".join([f":{c}" for c in columns])
            col_updates = ", ".join(
                [f"{c} = EXCLUDED.{c}" for c in columns if c != "forecast_date"]
            )

            query = text(
                f"""
                INSERT INTO "{schema}"."{table_name}" ({col_names})
                VALUES ({col_values})
                ON CONFLICT (forecast_date) DO UPDATE SET
                    {col_updates}
            """
            )

            conn.execute(query, df_predictions.to_dict(orient="records"))

        print(f"อัปเดต {schema}.{table_name} เรียบร้อย ({len(df_predictions)} แถว)")
    except Exception as e:
        print(f"เกิดข้อผิดพลาดในการบันทึกข้อมูล: {e}")
