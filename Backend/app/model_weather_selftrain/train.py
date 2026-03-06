import os
import joblib
import pandas as pd
import xgboost as xgb
from app.model_weather_selftrain.feature import (
    feature_weather,
    weather_features,
    params,
)
from typing import Dict


def train_models_weather(
    df: pd.DataFrame,
    save_path: str = r"app\model_weather_selftrain\weather_model",
) -> Dict[int, xgb.XGBRegressor]:

    # -------------------------------------------------
    # 0) Safety: ensure datetime index
    # -------------------------------------------------
    df = df.copy()

    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)

    # -------------------------------------------------
    # 1) Create seasonal table (NO LEAKAGE)
    # -------------------------------------------------
    os.makedirs(save_path, exist_ok=True)
    # -------------------------------------------------
    # 2) Create features
    # -------------------------------------------------
    df_feat = feature_weather(df)
    # -------------------------------------------------
    # 4) Cut training range
    # -------------------------------------------------
    model_cutoff = df_feat.index.max()
    df_train = df_feat.loc[df_feat.index <= model_cutoff].copy()

    models_weather: Dict[int, xgb.XGBRegressor] = {}

    # -------------------------------------------------
    # 5) Train
    # -------------------------------------------------
    y_temp = df_train["temperature_2m_mean"]
    y_hum = df_train["relative_humidity_2m_mean"]
    X_w = df_train[weather_features]

    model_temp = xgb.XGBRegressor(**params)
    model_hum = xgb.XGBRegressor(**params)
    model_temp.fit(X_w, y_temp)
    model_hum.fit(X_w, y_hum)

    joblib.dump(model_temp, os.path.join(save_path, f"weather_models_temp.pkl"))
    joblib.dump(model_hum, os.path.join(save_path, f"weather_models_hum.pkl"))

    models_weather["temp"] = model_temp
    models_weather["hum"] = model_hum

    return models_weather
