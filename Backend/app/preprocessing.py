import pandas as pd


def preprocess_to_weekly(df: pd.DataFrame) -> pd.DataFrame:

    df = df.copy()
    # If finish_date is index → reset it
    if df.index.name == "finish_date":
        df = df.reset_index()

    # 1) Ensure datetime
    # -------------------------------------------------
    df["finish_date"] = pd.to_datetime(df["finish_date"])

    # -------------------------------------------------
    # 2) Split 2021 (already weekly)
    # -------------------------------------------------
    df_2021 = df[df["finish_date"] < "2022-01-01"].copy()
    df_2021 = df_2021.set_index("finish_date")

    # -------------------------------------------------
    # 3) 2022+ (daily → weekly)
    # -------------------------------------------------
    df_2022 = df[df["finish_date"] >= "2022-01-01"].copy()
    df_2022 = df_2022.set_index("finish_date")

    today = pd.Timestamp.today().normalize()

    # # ล่าสุดที่ควรมี (Sunday ล่าสุดที่ผ่านไปแล้ว)
    days_since_sunday = (today.weekday() + 1) % 7
    last_complete_sunday = today - pd.Timedelta(days=days_since_sunday)

    df_2022_weekly = df_2022.resample("W-SUN").agg(
        {
            "Daily_Cases": "sum",
            "temperature_2m_mean": "mean",
            "relative_humidity_2m_mean": "mean",
            "population": "sum",
        }
    )

    df_2022_weekly = df_2022_weekly.rename(columns={"Daily_Cases": "Weekly_Cases"})

    df_2022_weekly["Infection_Rate"] = (
        df_2022_weekly["Weekly_Cases"] / df_2022_weekly["population"]
    ) * 100

    # ✅ ตัดให้เหลือถึง Sunday ล่าสุดเท่านั้น
    df_2022_weekly = df_2022_weekly[df_2022_weekly.index <= last_complete_sunday]
    # -------------------------------------------------
    # 4) Select same columns for 2021
    # -------------------------------------------------
    df_2021 = df_2021[
        [
            "Weekly_Cases",
            "temperature_2m_mean",
            "relative_humidity_2m_mean",
            "population",
            "Infection_Rate",
        ]
    ]

    # -------------------------------------------------
    # 5) Combine & sort
    # -------------------------------------------------
    df_w = pd.concat([df_2021, df_2022_weekly])
    df_w = df_w.sort_index()

    return df_w


# def main():

#     df = pd.read_csv(
#         "C:\\Users\\Asus\\OneDrive\\Documents\\AI\\ml_forecast_project\\data\\Final_falseV2.csv"
#     )
#     print("Raw rows:", len(df))

#     df_weekly = preprocess_to_weekly(df)
#     print("Weekly rows:", df_weekly.shape)
#     print(df_weekly)


# if __name__ == "__main__":
#     main()
