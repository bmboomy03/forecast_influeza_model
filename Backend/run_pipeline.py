import argparse
from dateutil import tz
import pandas as pd
from app.pipeline import run_train_pipeline, run_predict_pipeline
import pytz
from datetime import datetime


def run_pipeline(mode: str):

    if mode == "train":

        tz = pytz.timezone("Asia/Bangkok")
        current_year = datetime.now(tz).year
        cutoff_year = current_year - 1

        seasonal_cutoff = pd.Timestamp(f"{cutoff_year}-12-31")

        run_train_pipeline(seasonal_cutoff)
        print(f"Training Seasonal cutoff auto-set to {seasonal_cutoff.date()}")

    elif mode == "predict":

        predictions = run_predict_pipeline()
        print("Prediction completed.")

    elif mode == "weekly":

        tz = pytz.timezone("Asia/Bangkok")
        current_year = datetime.now(tz).year
        cutoff_year = current_year - 1

        seasonal_cutoff = pd.Timestamp(f"{cutoff_year}-12-31")

        run_train_pipeline(seasonal_cutoff)
        print("Training completed.")

        run_predict_pipeline()
        print("Prediction completed.")

        print("=== Weekly Pipeline Finished ===")


def main():
    parser = argparse.ArgumentParser(description="ML Forecast Pipeline")

    parser.add_argument(
        "--mode",
        choices=["train", "predict", "weekly"],
        required=True,
        help="Run training or prediction",
    )

    args = parser.parse_args()
    run_pipeline(args.mode)


if __name__ == "__main__":
    main()
