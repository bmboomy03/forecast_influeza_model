import os
import joblib
import pandas as pd
import xgboost as xgb

from typing import Dict
from app.config import FEATURES, FEATURES_Weekcase, BEST_PARAMS, HORIZONS
from app.features import (
    create_features,
    create_feature_weeklycase,
    create_seasonal_table,
)


def add_sample_weights(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["sample_weight"] = 1.0
    df.loc["2021-01-01":"2022-06-01", "sample_weight"] = 0.3
    return df


def train_models(
    df: pd.DataFrame,
    seasonal_cutoff: pd.Timestamp,
    save_path: str = "models",
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

    seasonal_table = create_seasonal_table(df, seasonal_cutoff)
    seasonal_table.to_csv(os.path.join(save_path, "seasonal_table.csv"))

    # -------------------------------------------------
    # 2) Create features
    # -------------------------------------------------
    df_feat = create_features(df, seasonal_table=seasonal_table)

    # -------------------------------------------------
    # 3) Add sample weights BEFORE cutting train range
    # -------------------------------------------------
    df_feat = add_sample_weights(df_feat)
    df_feat = df_feat.dropna(subset=["Infection_Rate"])
    # -------------------------------------------------
    # 4) Cut training range
    # -------------------------------------------------
    model_cutoff = df_feat.index.max()
    df_train = df_feat.loc[df_feat.index <= model_cutoff].copy()

    models: Dict[int, xgb.XGBRegressor] = {}

    # -------------------------------------------------
    # 5) Train per horizon
    # -------------------------------------------------
    for h in HORIZONS:

        target_col = f"y_h{h}"
        feature_cols = FEATURES[h]

        if target_col not in df_train.columns:
            raise ValueError(f"{target_col} not found in DataFrame")

        target_series = df_train[target_col]
        valid_idx = target_series.notna()

        X = df_train.loc[valid_idx, feature_cols]
        y = target_series.loc[valid_idx]
        w = df_train.loc[valid_idx, "sample_weight"]

        model = xgb.XGBRegressor(**BEST_PARAMS, random_state=42)
        model.fit(X, y, sample_weight=w)

        models[h] = model

        joblib.dump(model, os.path.join(save_path, f"model_h{h}.pkl"))

    return models


# ============================================================================
def train_models_weekcase(
    df: pd.DataFrame,
    save_path: str = "wc_models",
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
    df_feat = create_feature_weeklycase(df)
    # -------------------------------------------------
    # 3) Add sample weights BEFORE cutting train range
    # -------------------------------------------------
    df_feat = add_sample_weights(df_feat)

    # -------------------------------------------------
    # 4) Cut training range
    # -------------------------------------------------
    model_cutoff = df_feat.index.max()
    df_train = df_feat.loc[df_feat.index <= model_cutoff].copy()

    wc_models: Dict[int, xgb.XGBRegressor] = {}

    # -------------------------------------------------
    # 5) Train per horizon
    # -------------------------------------------------
    for h in HORIZONS:

        target_col = f"y_h{h}"
        feature_cols = FEATURES_Weekcase[h]

        if target_col not in df_train.columns:
            raise ValueError(f"{target_col} not found in DataFrame")

        target_series = df_train[target_col]
        valid_idx = target_series.notna()

        X = df_train.loc[valid_idx, feature_cols]
        y = target_series.loc[valid_idx]
        w = df_train.loc[valid_idx, "sample_weight"]

        model = xgb.XGBRegressor(**BEST_PARAMS, random_state=42)
        model.fit(X, y, sample_weight=w)

        wc_models[h] = model

        joblib.dump(model, os.path.join(save_path, f"wc_model_h{h}.pkl"))

    return wc_models
