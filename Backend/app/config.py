import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()


class Config:
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = int(os.getenv("DB_PORT", 5432))
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    @classmethod
    def get_database_url(cls):
        if not all(
            [cls.DB_HOST, cls.DB_PORT, cls.DB_NAME, cls.DB_USER, cls.DB_PASSWORD]
        ):
            raise ValueError("Database environment variables are not fully set.")

        return URL.create(
            drivername="postgresql+psycopg2",
            username=cls.DB_USER,
            password=cls.DB_PASSWORD,
            host=cls.DB_HOST,
            port=cls.DB_PORT,
            database=cls.DB_NAME,
        )


HORIZONS = [1, 2, 3, 4]
FEATURES = {
    1: [
        "lag_1",
        "lag_2",
        "lag_3",
        "roll_2",
        "roll_3",
        "roll_4",
        "growth_1",
        "growth_2",
        "g_accel",
        "g_accel_abs",
        "cv_3",
        "g_roll_2",
        "sign_flip",
        "g_strength",
        "week_sin",
        "week_cos",
        "seasonal_avg",
        "season_progress",
        "trend_cross",
        "trend_cross_slope",
        "seasonal_slope",
    ],
    2: [
        "lag_1",
        "lag_2",
        "lag_3",
        "roll_2",
        "roll_3",
        "roll_4",
        "growth_2",
        "g_accel",
        "g_accel_abs",
        "cv_3",
        "g_roll_2",
        "sign_flip",
        "g_strength",
        "week_sin",
        "week_cos",
        "seasonal_avg",
        "season_progress",
    ],
    3: [
        "lag_1",
        "lag_2",
        "lag_3",
        "roll_2",
        "roll_3",
        "roll_4",
        "growth_1",
        "growth_2",
        "g_accel",
        "g_accel_abs",
        "cv_3",
        "g_roll_2",
        "sign_flip",
        "g_strength",
        "week_sin",
        "week_cos",
        "seasonal_avg",
        "season_progress",
        "trend_cross",
        "seasonal_slope",
    ],
    4: [
        "lag_1",
        "lag_2",
        "lag_3",
        "roll_2",
        "roll_3",
        "roll_4",
        "growth_1",
        "growth_2",
        "g_accel_abs",
        "cv_3",
        "g_roll_2",
        "sign_flip",
        "g_strength",
        "week_sin",
        "week_cos",
        "seasonal_avg",
        "season_progress",
        "trend_cross",
        "trend_cross_slope",
        "seasonal_slope",
    ],
}
# =============================================================================
FEATURES_Weekcase = {
    1: [
        "temperature_2m_mean",
        "relative_humidity_2m_mean",
        "lag_1",
        "lag_2",
        "lag_3",
        "vol_3",
        "roll_3",
        "intensity_ratio",
        "slope_1",
        "accel",
        "norm_slope",
        "norm_accel",
        "local_peak",
        "weeks_since_peak",
        "phase_index",
        "week_sin",
        "week_cos",
        "momentum_3w",
    ],
    2: [
        "temperature_2m_mean",
        "relative_humidity_2m_mean",
        "lag_1",
        "lag_2",
        "lag_3",
        "vol_3",
        "roll_3",
        "roll_7",
        "intensity_ratio",
        "slope_1",
        "week_sin",
        "week_cos",
        "phase_index",
        "momentum_3w",
        "early_wave_signal",
    ],
    3: [
        "temperature_2m_mean",
        "relative_humidity_2m_mean",
        "lag_2",
        "lag_3",
        "vol_3",
        "roll_3",
        "roll_7",
        "dev_long",
        "intensity_ratio",
        "local_peak",
        "weeks_since_peak",
        "week_sin",
        "week_cos",
        "phase_index",
        "momentum_3w",
        "early_wave_signal",
    ],
    4: [
        "vol_3",
        "roll_3",
        "roll_7",
        "roll_13",
        "dev_long",
        "intensity_ratio",
        "local_peak",
        "week_sin",
        "week_cos",
        "phase_index",
        "momentum_3w",
        "early_wave_signal",
    ],
}


BEST_PARAMS = {
    "max_depth": 10,
    "learning_rate": 0.28944730844197414,
    "n_estimators": 209,
    "subsample": 0.6381500232548477,
    "colsample_bytree": 0.7916292198537086,
    "min_child_weight": 2,
    "reg_lambda": 4.059315104043169,
    "reg_alpha": 1.3575928924513256,
}
