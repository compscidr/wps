from datetime import datetime
from app.utils.time import get_utc_datetime, get_days_from_range
import pytz


def test_get_utc_datetime():
    """ A timezone ambiguous datetime is localized and returned as UTC """
    oct_1_2022 = datetime(year=2022, month=10, day=1, hour=8, minute=30, second=30)
    utc_datetime = get_utc_datetime(oct_1_2022)
    assert (utc_datetime.tzname() == "UTC")
    assert (utc_datetime.hour == 15)


def test_time_range_basic():
    "Basic day range test"
    oct_1_2022 = datetime(year=2022, month=10, day=1, hour=8, minute=30, second=30)
    oct_10_2022 = datetime(year=2022, month=10, day=10, hour=8, minute=30, second=30)

    days = get_days_from_range(oct_1_2022, oct_10_2022)
    assert (len(days) == 10)


def test_time_range_same_day():
    "Number of days between the same day just 1, the same day"
    oct_1_2022 = datetime(year=2022, month=10, day=1, hour=8, minute=30, second=30)
    days = get_days_from_range(oct_1_2022, oct_1_2022)
    assert (len(days) == 1)
    assert (days[0] == oct_1_2022)


def test_time_range_different_times():
    "Number of days between the same day different times is 1, the earlier day+time"
    oct_1_2022_8_30 = datetime(year=2022, month=10, day=1, hour=8, minute=30, second=30)
    oct_1_2022_9_30 = datetime(year=2022, month=10, day=1, hour=9, minute=30, second=30)
    days = get_days_from_range(oct_1_2022_8_30, oct_1_2022_9_30)
    assert (len(days) == 1)
    assert (days[0] == oct_1_2022_8_30)


def test_time_range_end_before_start():
    "If end date is before start date there are no days between them"
    oct_1_2022 = datetime(year=2022, month=10, day=1, hour=8, minute=30, second=30)
    oct_10_2022 = datetime(year=2022, month=10, day=10, hour=8, minute=30, second=30)
    days = get_days_from_range(oct_10_2022, oct_1_2022)
    assert (len(days) == 0)

def test_time_range_across_time_change_november():
    "Time change should not impact range."
    vancouver_tz = pytz.timezone("America/Vancouver")
    nov_1_2023 = vancouver_tz.localize(datetime(year=2023, month=11, day=1, hour=0, minute=0, second=0))
    nov_6_2023 = vancouver_tz.localize(datetime(year=2023, month=11, day=6, hour=23, minute=59, second=59))
    days = get_days_from_range(nov_1_2023, nov_6_2023)
    assert (len(days) == 6)

def test_time_range_across_time_change_march():
    "Time change should not impact range."
    vancouver_tz = pytz.timezone("America/Vancouver")
    march_6_2024 = vancouver_tz.localize(datetime(year=2024, month=3, day=6, hour=0, minute=0, second=0))
    march_12_2024 = vancouver_tz.localize(datetime(year=2024, month=3, day=12, hour=23, minute=59, second=59))
    days = get_days_from_range(march_6_2024, march_12_2024)
    assert (len(days) == 7)