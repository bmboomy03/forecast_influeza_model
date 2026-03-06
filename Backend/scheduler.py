import time
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR
from run_pipeline import run_pipeline  # 👈 import ของคุณ

# ==================== Logging ====================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ==================== Job ====================


def weekly_job():
    """รัน IEFS weekly pipeline"""
    logger.info("🚀 Starting weekly IEFS pipeline...")
    run_pipeline(mode="weekly")
    logger.info("✅ Weekly IEFS pipeline finished.")


# ==================== Event Listener ====================


def job_listener(event):
    if event.exception:
        logger.error(f"❌ Job '{event.job_id}' failed.")
    else:
        logger.info(f"✅ Job '{event.job_id}' completed successfully")


# ==================== Scheduler Setup ====================


def create_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()

    # ⏰ รันทุกวันจันทร์ เวลา 02:00
    scheduler.add_job(
        weekly_job,
        trigger="cron",
        day_of_week="mon",
        hour=2,
        minute=0,
        id="weekly_iefs_job",
        replace_existing=True,
    )

    scheduler.add_listener(job_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

    return scheduler


# ==================== Main ====================


def main():
    logger.info("🚀 Starting IEFS Scheduler...")
    scheduler = create_scheduler()
    scheduler.start()

    logger.info("⏳ Scheduler is running...")

    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Shutting down scheduler...")
        scheduler.shutdown()
        logger.info("👋 Scheduler stopped.")


if __name__ == "__main__":
    main()
