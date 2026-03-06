import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from datetime import datetime
from app.config import BEST_PARAMS
from app.features import (
    create_features,
    create_feature_weeklycase,
    create_seasonal_table,
)
from app.evaluation_model.features import features_ir, features_case
from app.database import fetch_daily_data


# -------------------------------------------------
# Shape correlation metric
# -------------------------------------------------
def shape_correlation(y_true, y_pred):
    """
    วัด shape similarity ระหว่างเส้นจริงกับเส้นพยากรณ์
    return ค่า 0–1
    """
    mask = (~np.isnan(y_true)) & (~np.isnan(y_pred))

    if mask.sum() < 3:
        return np.nan

    corr = np.corrcoef(y_true[mask], y_pred[mask])[0, 1]
    return max(corr, 0)


def add_sample_weights(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["sample_weight"] = 1.0
    df.loc["2021-01-01":"2022-06-01", "sample_weight"] = 0.3
    return df


# -------------------------------------------------
# Confidence training + evaluation
# -------------------------------------------------


def train_confidence(
    df: pd.DataFrame,
    seasonal_cutoff: pd.Timestamp,
    save_path: str = r"app\evaluation_model\model_eva",
):

    df = df.copy()
    df.index = pd.to_datetime(df.index)

    # ----------------------------
    # 1️⃣ Prevent leakage
    # ----------------------------
    os.makedirs(save_path, exist_ok=True)

    current_year = datetime.now().year - 2
    seasonal_cutoff_e1 = pd.Timestamp(f"{current_year}-12-31")

    seasonal_table = create_seasonal_table(df, seasonal_cutoff_e1)
    seasonal_table.to_csv(os.path.join(save_path, "seasonal_table_backyear.csv"))

    # df_for_seasonal = df.loc[df.index <= seasonal_cutoff]

    # ----------------------------
    # 2️⃣ Feature engineering
    # ----------------------------
    df_feat_ir = create_features(df, seasonal_table=seasonal_table)
    df_feat_case = create_feature_weeklycase(df)
    df_feat_ir = add_sample_weights(df_feat_ir)
    df_feat_case = add_sample_weights(df_feat_case)

    df_feat_ir = df_feat_ir.dropna(subset=["Infection_Rate"])
    df_feat_case = df_feat_case.dropna(subset=["Weekly_Cases"])

    df_train_ir = df_feat_ir.loc[df_feat_ir.index <= seasonal_cutoff_e1]
    df_train_case = df_feat_case.loc[df_feat_case.index <= seasonal_cutoff_e1]

    df_test_ir = df_feat_ir.loc[df_feat_ir.index > seasonal_cutoff_e1]
    df_test_case = df_feat_case.loc[df_feat_case.index > seasonal_cutoff_e1]

    # ----------------------------
    # 3️⃣ Train
    # ----------------------------
    X_train_ir = df_train_ir[features_ir]
    X_train_ca = df_train_case[features_case]
    w_train_ir = df_train_ir["sample_weight"]
    w_train_ca = df_train_case["sample_weight"]

    model_ir = xgb.XGBRegressor(**BEST_PARAMS, random_state=42)
    model_ir.fit(X_train_ir, df_train_ir["Infection_Rate"], sample_weight=w_train_ir)

    model_ca = xgb.XGBRegressor(**BEST_PARAMS, random_state=42)
    model_ca.fit(X_train_ca, df_train_case["Weekly_Cases"], sample_weight=w_train_ca)

    # ----------------------------
    # 4️⃣ Predict test
    # ----------------------------
    X_test_ir = df_test_ir[features_ir]
    X_test_ca = df_test_case[features_case]

    y_pred_ir = model_ir.predict(X_test_ir)
    y_pred_ca = model_ca.predict(X_test_ca)

    shape_ir = shape_correlation(df_test_ir["Infection_Rate"], y_pred_ir)

    shape_ca = shape_correlation(df_test_case["Weekly_Cases"], y_pred_ca)

    return {
        "confidence_ir_percent": (
            None if np.isnan(shape_ir) else round(shape_ir * 100, 2)
        ),
        "confidence_case_percent": (
            None if np.isnan(shape_ca) else round(shape_ca * 100, 2)
        ),
    }
