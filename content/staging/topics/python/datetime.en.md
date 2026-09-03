---
title: Python datetime 日期时间处理
description: 全面学习 Python datetime 模块，包括日期时间创建、格式化、时区处理和计算
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - datetime
  - 日期
  - 时间
  - 时区
status: imported
origin: old/src/content/docs/python/datetime.en.md
divergence: 0.207
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 标准库
  order: 33
  lastUpdated: 2026-01-07
---

The `datetime` module is the core module in Python's standard library for handling dates and times. Whether you need to record log timestamps, calculate time differences, handle timezone conversions, or format date displays, the datetime module provides powerful and flexible support.

## Module Overview

```python
from datetime import (
    date,           # Date class (year, month, day)
    time,           # Time class (hour, minute, second, microsecond)
    datetime,       # DateTime class (date + time)
    timedelta,      # Time difference class
    timezone,       # Timezone class
    tzinfo,         # Timezone info abstract base class
)
import calendar      # Calendar-related functionality
```

---

## date - Date Class

The `date` class is used to handle dates containing only year, month, and day, without time information.

### Creating Date Objects

```python
from datetime import date

# Create by specifying year, month, day
d = date(2026, 1, 7)
print(d)  # 2026-01-07

# Get today's date
today = date.today()
print(today)  # 2026-01-07

# Create from timestamp (Unix timestamp)
d_from_timestamp = date.fromtimestamp(1736236800)
print(d_from_timestamp)  # 2025-01-07

# Create from ISO format string
d_from_iso = date.fromisoformat('2026-01-07')
print(d_from_iso)  # 2026-01-07

# Create from ordinal (days since January 1, year 1)
d_from_ordinal = date.fromordinal(738892)
print(d_from_ordinal)  # 2023-01-01
```

### Accessing Date Attributes

```python
from datetime import date

d = date(2026, 1, 7)

# Basic attributes
print(d.year)   # 2026
print(d.month)  # 1
print(d.day)    # 7

# Day of week (0=Monday, 6=Sunday)
print(d.weekday())  # 2 (Wednesday)

# Day of week (1=Monday, 7=Sunday)
print(d.isoweekday())  # 3 (Wednesday)

# ISO calendar (year, week number, day of week)
print(d.isocalendar())  # (2026, 2, 3)

# Convert to ordinal
print(d.toordinal())  # 739462
```

### Date Methods

```python
from datetime import date

d = date(2026, 1, 7)

# Convert to ISO format string
print(d.isoformat())  # '2026-01-07'

# Formatted output
print(d.strftime('%Y年%m月%d日'))  # '2026年01月07日'
print(d.strftime('%A, %B %d, %Y'))  # 'Wednesday, January 07, 2026'

# Replace date parts
new_date = d.replace(year=2027, month=6)
print(new_date)  # 2027-06-07

# Return time.struct_time
print(d.timetuple())
```

---

## time - Time Class

The `time` class is used to handle time containing only hour, minute, second, and microsecond, without date information.

### Creating Time Objects

```python
from datetime import time

# Basic creation
t = time(14, 30, 45)
print(t)  # 14:30:45

# Including microseconds
t_micro = time(14, 30, 45, 123456)
print(t_micro)  # 14:30:45.123456

# Create from ISO format string
t_from_iso = time.fromisoformat('14:30:45')
print(t_from_iso)  # 14:30:45

# Minimum and maximum time
print(time.min)  # 00:00:00
print(time.max)  # 23:59:59.999999
```

### Accessing Time Attributes

```python
from datetime import time

t = time(14, 30, 45, 123456)

print(t.hour)        # 14
print(t.minute)      # 30
print(t.second)      # 45
print(t.microsecond) # 123456

# Timezone info (None when no timezone)
print(t.tzinfo)      # None
```

### Time Methods

```python
from datetime import time

t = time(14, 30, 45)

# Convert to ISO format
print(t.isoformat())  # '14:30:45'

# Formatted output
print(t.strftime('%H:%M:%S'))    # '14:30:45'
print(t.strftime('%I:%M %p'))    # '02:30 PM'

# Replace time parts
new_time = t.replace(hour=16, minute=0)
print(new_time)  # 16:00:45
```

---

## datetime - DateTime Class

The `datetime` class is a combination of `date` and `time`, containing complete date and time information. This is the most commonly used class.

### Creating datetime Objects

```python
from datetime import datetime

# Specify year, month, day, hour, minute, second
dt = datetime(2026, 1, 7, 14, 30, 45)
print(dt)  # 2026-01-07 14:30:45

# Including microseconds
dt_micro = datetime(2026, 1, 7, 14, 30, 45, 123456)
print(dt_micro)  # 2026-01-07 14:30:45.123456

# Get current datetime
now = datetime.now()
print(now)  # 2026-01-07 15:30:00.123456

# Get current UTC time (recommended using timezone.utc)
from datetime import timezone
utc_now = datetime.now(timezone.utc)
print(utc_now)  # 2026-01-07 07:30:00.123456+00:00

# Create from timestamp
dt_from_ts = datetime.fromtimestamp(1736236800)
print(dt_from_ts)  # 2025-01-07 08:00:00

# UTC timestamp
dt_utc = datetime.fromtimestamp(1736236800, tz=timezone.utc)
print(dt_utc)  # 2025-01-07 08:00:00+00:00

# Create from ISO format string
dt_from_iso = datetime.fromisoformat('2026-01-07T14:30:45')
print(dt_from_iso)  # 2026-01-07 14:30:45

# Combine date and time
from datetime import date, time
d = date(2026, 1, 7)
t = time(14, 30, 45)
dt_combined = datetime.combine(d, t)
print(dt_combined)  # 2026-01-07 14:30:45
```

### Accessing datetime Attributes

```python
from datetime import datetime

dt = datetime(2026, 1, 7, 14, 30, 45, 123456)

# Date attributes
print(dt.year)        # 2026
print(dt.month)       # 1
print(dt.day)         # 7

# Time attributes
print(dt.hour)        # 14
print(dt.minute)      # 30
print(dt.second)      # 45
print(dt.microsecond) # 123456

# Get date part
print(dt.date())  # 2026-01-07

# Get time part
print(dt.time())  # 14:30:45.123456

# Day of week
print(dt.weekday())     # 2 (Wednesday)
print(dt.isoweekday())  # 3 (Wednesday)
```

### datetime Methods

```python
from datetime import datetime, timezone

dt = datetime(2026, 1, 7, 14, 30, 45)

# Convert to ISO format
print(dt.isoformat())        # '2026-01-07T14:30:45'
print(dt.isoformat(' '))     # '2026-01-07 14:30:45'
print(dt.isoformat(sep='T', timespec='seconds'))  # '2026-01-07T14:30:45'

# Convert to timestamp
print(dt.timestamp())  # 1736234445.0

# Replace partial values
new_dt = dt.replace(year=2027, hour=10)
print(new_dt)  # 2027-01-07 10:30:45

# Formatted output
print(dt.strftime('%Y-%m-%d %H:%M:%S'))  # '2026-01-07 14:30:45'
print(dt.strftime('%Y年%m月%d日 %H时%M分%S秒'))  # '2026年01月07日 14时30分45秒'
```

---

## timedelta - Time Difference

`timedelta` represents the difference between two dates or times, used for date and time arithmetic.

### Creating timedelta Objects

```python
from datetime import timedelta

# Various time units
delta1 = timedelta(days=5)
delta2 = timedelta(hours=12)
delta3 = timedelta(minutes=30)
delta4 = timedelta(seconds=45)
delta5 = timedelta(milliseconds=500)
delta6 = timedelta(microseconds=1000)
delta7 = timedelta(weeks=2)

# Combining multiple units
delta = timedelta(days=5, hours=3, minutes=30, seconds=45)
print(delta)  # 5 days, 3:30:45

# Negative time difference
negative_delta = timedelta(days=-1)
print(negative_delta)  # -1 day, 0:00:00
```

### timedelta Attributes and Methods

```python
from datetime import timedelta

delta = timedelta(days=5, hours=3, minutes=30, seconds=45)

# Attributes (only these three)
print(delta.days)         # 5
print(delta.seconds)      # 12645 (3 hours 30 minutes 45 seconds = 12645 seconds)
print(delta.microseconds) # 0

# Total seconds
print(delta.total_seconds())  # 444645.0

# Minimum and maximum values
print(timedelta.min)  # -999999999 days, 0:00:00
print(timedelta.max)  # 999999999 days, 23:59:59.999999
print(timedelta.resolution)  # 0:00:00.000001
```

### Date and Time Arithmetic

```python
from datetime import datetime, timedelta, date

# datetime add/subtract timedelta
now = datetime(2026, 1, 7, 14, 30)
future = now + timedelta(days=7, hours=5)
print(future)  # 2026-01-14 19:30:00

past = now - timedelta(weeks=2)
print(past)  # 2025-12-24 14:30:00

# date add/subtract timedelta
today = date(2026, 1, 7)
next_week = today + timedelta(weeks=1)
print(next_week)  # 2026-01-14

# Subtracting two datetimes yields a timedelta
dt1 = datetime(2026, 1, 7, 14, 30)
dt2 = datetime(2026, 1, 1, 10, 0)
diff = dt1 - dt2
print(diff)  # 6 days, 4:30:00
print(diff.total_seconds())  # 536100.0

# timedelta arithmetic
delta1 = timedelta(days=5)
delta2 = timedelta(days=3)

print(delta1 + delta2)  # 8 days, 0:00:00
print(delta1 - delta2)  # 2 days, 0:00:00
print(delta1 * 2)       # 10 days, 0:00:00
print(delta1 / 2)       # 2 days, 12:00:00
print(delta1 // 2)      # 2 days, 12:00:00
print(delta1 / delta2)  # 1.6666666666666667
print(abs(timedelta(days=-5)))  # 5 days, 0:00:00
```

### Practical Calculation Examples

```python
from datetime import datetime, timedelta, date

# Calculate age
def calculate_age(birth_date):
    today = date.today()
    age = today.year - birth_date.year
    # Check if birthday has passed this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

birth = date(1990, 6, 15)
print(f"Age: {calculate_age(birth)} years")

# Calculate business days
def add_business_days(start_date, num_days):
    current = start_date
    added = 0
    while added < num_days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Monday to Friday
            added += 1
    return current

start = date(2026, 1, 7)  # Wednesday
result = add_business_days(start, 5)
print(f"5 business days later: {result}")  # 2026-01-14

# Calculate days between two dates
def days_between(date1, date2):
    return abs((date2 - date1).days)

d1 = date(2026, 1, 1)
d2 = date(2026, 12, 31)
print(f"2026 has {days_between(d1, d2)} days")  # 364

# Get first and last day of the month
def get_month_range(dt):
    first_day = dt.replace(day=1)
    # First day of next month minus one day
    if dt.month == 12:
        last_day = dt.replace(year=dt.year+1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = dt.replace(month=dt.month+1, day=1) - timedelta(days=1)
    return first_day, last_day

first, last = get_month_range(date(2026, 2, 15))
print(f"February 2026: {first} to {last}")  # 2026-02-01 to 2026-02-28
```

---

## timezone - Timezone Handling

Python 3.2+ provides the `timezone` class for handling timezones. Understanding timezones is crucial for handling time data across different regions.

### Basic Timezone Operations

```python
from datetime import datetime, timezone, timedelta

# UTC timezone
utc = timezone.utc
utc_now = datetime.now(utc)
print(utc_now)  # 2026-01-07 06:30:00+00:00

# Create fixed offset timezone
# UTC+8 (Beijing time)
beijing_tz = timezone(timedelta(hours=8))
beijing_time = datetime.now(beijing_tz)
print(beijing_time)  # 2026-01-07 14:30:00+08:00

# UTC-5 (US Eastern time)
eastern_tz = timezone(timedelta(hours=-5))
eastern_time = datetime.now(eastern_tz)
print(eastern_time)  # 2026-01-07 01:30:00-05:00

# With timezone name
beijing_tz_named = timezone(timedelta(hours=8), name='CST')
dt_named = datetime.now(beijing_tz_named)
print(dt_named.tzname())  # 'CST'
```

### Naive vs Aware datetime

```python
from datetime import datetime, timezone, timedelta

# Naive datetime (no timezone info)
naive_dt = datetime(2026, 1, 7, 14, 30)
print(naive_dt.tzinfo)  # None
print(naive_dt)  # 2026-01-07 14:30:00

# Aware datetime (has timezone info)
aware_dt = datetime(2026, 1, 7, 14, 30, tzinfo=timezone.utc)
print(aware_dt.tzinfo)  # UTC
print(aware_dt)  # 2026-01-07 14:30:00+00:00

# Check if datetime has timezone info
def is_aware(dt):
    return dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None

print(is_aware(naive_dt))  # False
print(is_aware(aware_dt))  # True
```

### Timezone Conversion

```python
from datetime import datetime, timezone, timedelta

# Create timezone-aware datetime
utc_tz = timezone.utc
beijing_tz = timezone(timedelta(hours=8))
tokyo_tz = timezone(timedelta(hours=9))

# UTC time
utc_time = datetime(2026, 1, 7, 6, 30, tzinfo=utc_tz)
print(f"UTC: {utc_time}")  # UTC: 2026-01-07 06:30:00+00:00

# Convert to Beijing time
beijing_time = utc_time.astimezone(beijing_tz)
print(f"Beijing: {beijing_time}")  # Beijing: 2026-01-07 14:30:00+08:00

# Convert to Tokyo time
tokyo_time = utc_time.astimezone(tokyo_tz)
print(f"Tokyo: {tokyo_time}")  # Tokyo: 2026-01-07 15:30:00+09:00

# Add timezone info to naive datetime (assuming it's local time in some timezone)
naive_dt = datetime(2026, 1, 7, 14, 30)
aware_dt = naive_dt.replace(tzinfo=beijing_tz)
print(aware_dt)  # 2026-01-07 14:30:00+08:00

# Convert to UTC
utc_result = aware_dt.astimezone(utc_tz)
print(utc_result)  # 2026-01-07 06:30:00+00:00
```

---

## strftime and strptime - Formatting

`strftime` formats a datetime object into a string, while `strptime` parses a string into a datetime object.

### Format Code Table

| Code | Meaning | Example |
|------|---------|---------|
| `%Y` | Four-digit year | 2026 |
| `%y` | Two-digit year | 26 |
| `%m` | Month (zero-padded) | 01-12 |
| `%d` | Day (zero-padded) | 01-31 |
| `%H` | Hour (24-hour) | 00-23 |
| `%I` | Hour (12-hour) | 01-12 |
| `%M` | Minute | 00-59 |
| `%S` | Second | 00-59 |
| `%f` | Microsecond | 000000-999999 |
| `%p` | AM/PM | AM, PM |
| `%A` | Full weekday name | Wednesday |
| `%a` | Abbreviated weekday | Wed |
| `%B` | Full month name | January |
| `%b` | Abbreviated month | Jan |
| `%j` | Day of year | 001-366 |
| `%U` | Week of year (Sunday start) | 00-53 |
| `%W` | Week of year (Monday start) | 00-53 |
| `%w` | Day of week (0=Sunday) | 0-6 |
| `%z` | UTC offset | +0800 |
| `%Z` | Timezone name | CST, UTC |
| `%%` | Literal % | % |

### strftime - Formatting Output

```python
from datetime import datetime

dt = datetime(2026, 1, 7, 14, 30, 45)

# Common formats
print(dt.strftime('%Y-%m-%d'))           # '2026-01-07'
print(dt.strftime('%Y/%m/%d'))           # '2026/01/07'
print(dt.strftime('%d/%m/%Y'))           # '07/01/2026'
print(dt.strftime('%Y-%m-%d %H:%M:%S'))  # '2026-01-07 14:30:45'
print(dt.strftime('%H:%M:%S'))           # '14:30:45'
print(dt.strftime('%I:%M %p'))           # '02:30 PM'

# Chinese format
print(dt.strftime('%Y年%m月%d日'))        # '2026年01月07日'
print(dt.strftime('%Y年%m月%d日 %H时%M分%S秒'))  # '2026年01月07日 14时30分45秒'

# English format
print(dt.strftime('%A, %B %d, %Y'))      # 'Wednesday, January 07, 2026'
print(dt.strftime('%b %d, %Y'))          # 'Jan 07, 2026'

# ISO format
print(dt.strftime('%Y-%m-%dT%H:%M:%S'))  # '2026-01-07T14:30:45'

# Log format
print(dt.strftime('[%Y-%m-%d %H:%M:%S]'))  # '[2026-01-07 14:30:45]'
```

### strptime - Parsing Strings

```python
from datetime import datetime

# Basic parsing
dt1 = datetime.strptime('2026-01-07', '%Y-%m-%d')
print(dt1)  # 2026-01-07 00:00:00

dt2 = datetime.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(dt2)  # 2026-01-07 14:30:45

# Parsing various formats
dt3 = datetime.strptime('07/01/2026', '%d/%m/%Y')
print(dt3)  # 2026-01-07 00:00:00

dt4 = datetime.strptime('January 7, 2026', '%B %d, %Y')
print(dt4)  # 2026-01-07 00:00:00

dt5 = datetime.strptime('2026年01月07日', '%Y年%m月%d日')
print(dt5)  # 2026-01-07 00:00:00

dt6 = datetime.strptime('02:30 PM', '%I:%M %p')
print(dt6)  # 1900-01-01 14:30:00

# Parsing with microseconds
dt7 = datetime.strptime('2026-01-07 14:30:45.123456', '%Y-%m-%d %H:%M:%S.%f')
print(dt7)  # 2026-01-07 14:30:45.123456

# Parsing ISO format (recommend using fromisoformat)
dt8 = datetime.fromisoformat('2026-01-07T14:30:45+08:00')
print(dt8)  # 2026-01-07 14:30:45+08:00
```

### Handling Parse Errors

```python
from datetime import datetime

def safe_parse_date(date_string, format_string):
    """Safely parse a date string"""
    try:
        return datetime.strptime(date_string, format_string)
    except ValueError as e:
        print(f"Parse error: {e}")
        return None

# Correct format
result = safe_parse_date('2026-01-07', '%Y-%m-%d')
print(result)  # 2026-01-07 00:00:00

# Wrong format
result = safe_parse_date('01-07-2026', '%Y-%m-%d')
# Parse error: time data '01-07-2026' does not match format '%Y-%m-%d'

# Try multiple formats
def parse_flexible_date(date_string):
    """Try multiple formats to parse a date"""
    formats = [
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%d/%m/%Y',
        '%d-%m-%Y',
        '%Y年%m月%d日',
        '%B %d, %Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_string, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date: {date_string}")

print(parse_flexible_date('2026-01-07'))    # 2026-01-07 00:00:00
print(parse_flexible_date('07/01/2026'))    # 2026-01-07 00:00:00
print(parse_flexible_date('2026年01月07日'))  # 2026-01-07 00:00:00
```

---

## pytz - Third-Party Timezone Library

`pytz` is the standard third-party library for handling timezones, providing complete IANA timezone database support, including historical timezone changes and daylight saving time.

### Installation

```bash
pip install pytz
```

### Basic Usage

```python
import pytz
from datetime import datetime

# View all available timezones
print(len(pytz.all_timezones))  # 500+
print(pytz.all_timezones[:5])
# ['Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', ...]

# Common timezones
print(pytz.timezone('Asia/Shanghai'))    # Beijing time
print(pytz.timezone('Asia/Tokyo'))       # Tokyo time
print(pytz.timezone('America/New_York')) # New York time
print(pytz.timezone('Europe/London'))    # London time
print(pytz.timezone('UTC'))              # UTC

# Get current time with timezone
utc = pytz.UTC
now_utc = datetime.now(utc)
print(now_utc)  # 2026-01-07 06:30:00+00:00

# Create time in specific timezone
beijing_tz = pytz.timezone('Asia/Shanghai')
now_beijing = datetime.now(beijing_tz)
print(now_beijing)  # 2026-01-07 14:30:00.123456+08:00
```

### Timezone Conversion

```python
import pytz
from datetime import datetime

# Define timezones
utc = pytz.UTC
beijing = pytz.timezone('Asia/Shanghai')
new_york = pytz.timezone('America/New_York')
tokyo = pytz.timezone('Asia/Tokyo')

# Create UTC time
utc_time = datetime(2026, 1, 7, 6, 30, tzinfo=utc)
print(f"UTC: {utc_time}")

# Convert to other timezones
beijing_time = utc_time.astimezone(beijing)
print(f"Beijing: {beijing_time}")  # 2026-01-07 14:30:00+08:00

new_york_time = utc_time.astimezone(new_york)
print(f"New York: {new_york_time}")  # 2026-01-07 01:30:00-05:00

tokyo_time = utc_time.astimezone(tokyo)
print(f"Tokyo: {tokyo_time}")  # 2026-01-07 15:30:00+09:00
```

### Localizing Naive datetime

```python
import pytz
from datetime import datetime

beijing = pytz.timezone('Asia/Shanghai')

# Wrong way: using replace directly (doesn't handle DST)
naive_dt = datetime(2026, 1, 7, 14, 30)
wrong_dt = naive_dt.replace(tzinfo=beijing)  # Not recommended!

# Correct way: using localize (recommended)
correct_dt = beijing.localize(naive_dt)
print(correct_dt)  # 2026-01-07 14:30:00+08:00

# Handling daylight saving time (US time as example)
eastern = pytz.timezone('America/New_York')

# During DST
summer_dt = datetime(2026, 7, 15, 14, 0)
summer_aware = eastern.localize(summer_dt)
print(summer_aware)  # 2026-07-15 14:00:00-04:00 (EDT, daylight saving)

# Outside DST
winter_dt = datetime(2026, 1, 15, 14, 0)
winter_aware = eastern.localize(winter_dt)
print(winter_aware)  # 2026-01-15 14:00:00-05:00 (EST, standard time)
```

### Handling DST Boundaries

```python
import pytz
from datetime import datetime

eastern = pytz.timezone('America/New_York')

# When DST starts (March 8, 2026 at 2:00 AM)
# Clock jumps from 2:00 to 3:00, times in between don't exist

# Handling ambiguous time
try:
    ambiguous_dt = datetime(2026, 11, 1, 1, 30)  # Ambiguous time when DST ends
    # is_dst parameter specifies whether it's daylight saving time
    dst_time = eastern.localize(ambiguous_dt, is_dst=True)
    std_time = eastern.localize(ambiguous_dt, is_dst=False)
    print(f"DST: {dst_time}")  # -04:00
    print(f"Standard: {std_time}")  # -05:00
except pytz.AmbiguousTimeError as e:
    print(f"Ambiguous time: {e}")

# Handling non-existent time
try:
    nonexistent = datetime(2026, 3, 8, 2, 30)
    eastern.localize(nonexistent, is_dst=None)
except pytz.NonExistentTimeError as e:
    print(f"Non-existent time: {e}")
```

---

## dateutil - Powerful Date Handling Library

`python-dateutil` is another popular third-party library that provides more flexible date parsing and relative time calculation features.

### Installation

```bash
pip install python-dateutil
```

### Smart Date Parsing

```python
from dateutil import parser

# Automatically parse various formats (no format string needed)
dt1 = parser.parse('2026-01-07')
print(dt1)  # 2026-01-07 00:00:00

dt2 = parser.parse('January 7, 2026')
print(dt2)  # 2026-01-07 00:00:00

dt3 = parser.parse('7/1/2026')
print(dt3)  # 2026-07-01 00:00:00 (US format)

dt4 = parser.parse('7/1/2026', dayfirst=True)
print(dt4)  # 2026-01-07 00:00:00 (day first)

dt5 = parser.parse('Wed, Jan 7, 2026 2:30 PM')
print(dt5)  # 2026-01-07 14:30:00

dt6 = parser.parse('2026-01-07T14:30:45+08:00')
print(dt6)  # 2026-01-07 14:30:45+08:00

# Parsing fuzzy dates
dt7 = parser.parse('next wednesday')  # Requires additional setup
dt8 = parser.parse('3rd of January 2026')
print(dt8)  # 2026-01-03 00:00:00
```

### relativedelta - Relative Time Difference

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

now = datetime(2026, 1, 7, 14, 30)

# Add/subtract years, months, days
future = now + relativedelta(years=1, months=2, days=15)
print(future)  # 2027-03-22 14:30:00

past = now - relativedelta(years=2, months=6)
print(past)  # 2023-07-07 14:30:00

# Set absolute values
specific = now + relativedelta(day=1, hour=0, minute=0, second=0)
print(specific)  # 2026-01-01 00:00:00 (first day of month at midnight)

# Get same day next month
next_month = now + relativedelta(months=1)
print(next_month)  # 2026-02-07 14:30:00

# Get last day of current month
last_day = now + relativedelta(day=31)  # day=31 auto-adjusts
print(last_day)  # 2026-01-31 14:30:00

# Using weekdays
from dateutil.relativedelta import MO, TU, WE, TH, FR, SA, SU

# Next Friday
next_friday = now + relativedelta(weekday=FR)
print(next_friday)  # 2026-01-09 14:30:00

# Previous Monday
last_monday = now + relativedelta(weekday=MO(-1))
print(last_monday)  # 2026-01-05 14:30:00

# Third Thursday of the month
third_thursday = now + relativedelta(day=1, weekday=TH(3))
print(third_thursday)  # 2026-01-15 14:30:00
```

### Calculating Difference Between Two Dates

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

birth_date = datetime(1990, 6, 15)
today = datetime(2026, 1, 7)

# Calculate exact age
diff = relativedelta(today, birth_date)
print(f"Age: {diff.years} years {diff.months} months {diff.days} days")
# Age: 35 years 6 months 22 days

# Access individual parts of the difference
print(f"Difference: {diff.years} years")
print(f"Difference: {diff.months} months (excluding years)")
print(f"Difference: {diff.days} days (excluding years and months)")
```

### rrule - Recurrence Rules

```python
from datetime import datetime
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, MO, TU, WE, TH, FR

start = datetime(2026, 1, 1)

# Daily, 5 times
daily = list(rrule(DAILY, count=5, dtstart=start))
print(daily)
# [datetime(2026, 1, 1), datetime(2026, 1, 2), ...]

# Every Monday, Wednesday, Friday
weekdays = list(rrule(WEEKLY, count=6, byweekday=(MO, WE, FR), dtstart=start))
for dt in weekdays:
    print(dt.strftime('%Y-%m-%d %A'))

# 15th of every month
monthly = list(rrule(MONTHLY, count=6, bymonthday=15, dtstart=start))
for dt in monthly:
    print(dt.strftime('%Y-%m-%d'))

# Business days (Monday to Friday)
from dateutil.rrule import rruleset, rrule, DAILY

def get_business_days(start, end):
    rr = rrule(DAILY, dtstart=start, until=end, byweekday=(MO, TU, WE, TH, FR))
    return list(rr)

business_days = get_business_days(datetime(2026, 1, 1), datetime(2026, 1, 15))
print(f"Business days count: {len(business_days)}")
```

---

## calendar Module

The `calendar` module provides calendar-related functionality.

### Basic Usage

```python
import calendar

# Check leap year
print(calendar.isleap(2024))  # True
print(calendar.isleap(2026))  # False

# Count leap years
print(calendar.leapdays(2000, 2026))  # 7

# Get number of days in a month
print(calendar.monthrange(2026, 2))  # (6, 28)
# Returns (weekday of first day, number of days in month)

# Get calendar for a month
print(calendar.month(2026, 1))
#     January 2026
# Mo Tu We Th Fr Sa Su
#           1  2  3  4
#  5  6  7  8  9 10 11
# ...

# Get calendar for entire year
print(calendar.calendar(2026))
```

### Utility Functions

```python
import calendar
from datetime import date

# Get all days in a month
def get_month_days(year, month):
    _, num_days = calendar.monthrange(year, month)
    return [date(year, month, day) for day in range(1, num_days + 1)]

january_2026 = get_month_days(2026, 1)
print(f"January 2026 has {len(january_2026)} days")

# Get all Mondays in a month
def get_mondays(year, month):
    days = get_month_days(year, month)
    return [d for d in days if d.weekday() == 0]

mondays = get_mondays(2026, 1)
print(f"Mondays in January 2026: {mondays}")

# Check if a day is a business day
def is_business_day(d):
    return d.weekday() < 5

print(is_business_day(date(2026, 1, 7)))  # True (Wednesday)
print(is_business_day(date(2026, 1, 11))) # False (Sunday)
```

### HTMLCalendar and TextCalendar

```python
import calendar

# Text calendar
tc = calendar.TextCalendar(firstweekday=0)  # Monday start
print(tc.formatmonth(2026, 1))

# HTML calendar
hc = calendar.HTMLCalendar(firstweekday=0)
html = hc.formatmonth(2026, 1)
print(html)  # HTML formatted calendar

# Custom calendar
class ChineseCalendar(calendar.TextCalendar):
    def formatweekday(self, day, width):
        days = ['一', '二', '三', '四', '五', '六', '日']
        return days[day].center(width)

    def formatmonthname(self, theyear, themonth, width, withyear=True):
        months = ['一月', '二月', '三月', '四月', '五月', '六月',
                  '七月', '八月', '九月', '十月', '十一月', '十二月']
        if withyear:
            return f"{theyear}年 {months[themonth-1]}".center(width)
        return months[themonth-1].center(width)

cc = ChineseCalendar()
print(cc.formatmonth(2026, 1))
```

---

## Common Patterns and Best Practices

### Various Ways to Get Current Time

```python
from datetime import datetime, date, time, timezone
import time as time_module

# Current local datetime
now = datetime.now()
print(f"Local time: {now}")

# Current UTC time (recommended approach)
utc_now = datetime.now(timezone.utc)
print(f"UTC time: {utc_now}")

# Current date
today = date.today()
print(f"Today: {today}")

# Unix timestamp
timestamp = time_module.time()
print(f"Timestamp: {timestamp}")

# Create from timestamp
dt_from_ts = datetime.fromtimestamp(timestamp)
print(f"From timestamp: {dt_from_ts}")
```

### Datetime Comparison

```python
from datetime import datetime, date, timedelta

dt1 = datetime(2026, 1, 7, 14, 30)
dt2 = datetime(2026, 1, 8, 10, 0)

# Comparison operations
print(dt1 < dt2)   # True
print(dt1 > dt2)   # False
print(dt1 == dt2)  # False
print(dt1 != dt2)  # True
print(dt1 <= dt2)  # True
print(dt1 >= dt2)  # False

# Check date range
start = datetime(2026, 1, 1)
end = datetime(2026, 12, 31)
check = datetime(2026, 6, 15)

if start <= check <= end:
    print("Date is within range")

# Check if it's today
def is_today(dt):
    return dt.date() == date.today()

print(is_today(datetime.now()))  # True

# Check if expired
def is_expired(expiry_date):
    return expiry_date < date.today()

print(is_expired(date(2025, 12, 31)))  # True
```

### Datetime Serialization

```python
from datetime import datetime, timezone
import json

dt = datetime(2026, 1, 7, 14, 30, 45, tzinfo=timezone.utc)

# ISO format (recommended for APIs)
iso_string = dt.isoformat()
print(iso_string)  # '2026-01-07T14:30:45+00:00'

# Parse from ISO format
parsed = datetime.fromisoformat(iso_string)
print(parsed)  # 2026-01-07 14:30:45+00:00

# Timestamp (for storage)
timestamp = dt.timestamp()
print(timestamp)  # 1736260245.0

# JSON serialization
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data = {'created_at': dt, 'name': 'test'}
json_str = json.dumps(data, cls=DateTimeEncoder)
print(json_str)  # '{"created_at": "2026-01-07T14:30:45+00:00", "name": "test"}'

# JSON deserialization
def datetime_decoder(dct):
    for key, value in dct.items():
        if isinstance(value, str):
            try:
                dct[key] = datetime.fromisoformat(value)
            except ValueError:
                pass
    return dct

loaded = json.loads(json_str, object_hook=datetime_decoder)
print(loaded['created_at'])  # 2026-01-07 14:30:45+00:00
```

### Database Date Handling

```python
from datetime import datetime, timezone
import sqlite3

# SQLite datetime storage
conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# Create table
cursor.execute('''
    CREATE TABLE events (
        id INTEGER PRIMARY KEY,
        name TEXT,
        created_at TEXT,
        event_date TEXT
    )
''')

# Store datetime (using ISO format)
now = datetime.now(timezone.utc)
cursor.execute(
    'INSERT INTO events (name, created_at, event_date) VALUES (?, ?, ?)',
    ('Meeting', now.isoformat(), '2026-01-15')
)
conn.commit()

# Query and parse
cursor.execute('SELECT * FROM events')
row = cursor.fetchone()
created_at = datetime.fromisoformat(row[2])
print(f"Created at: {created_at}")

# Date range query
start = '2026-01-01'
end = '2026-01-31'
cursor.execute(
    'SELECT * FROM events WHERE event_date BETWEEN ? AND ?',
    (start, end)
)
```

### Performance Optimization Tips

```python
from datetime import datetime, date, timedelta
import time

# Avoid calling datetime.now() repeatedly in loops
# Bad approach
def process_items_slow(items):
    for item in items:
        item['processed_at'] = datetime.now()  # Called every time

# Good approach
def process_items_fast(items):
    now = datetime.now()  # Called once
    for item in items:
        item['processed_at'] = now

# Cache strptime format
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_strptime(date_string, format_string):
    return datetime.strptime(date_string, format_string)

# Use generators for bulk date operations (memory efficient)
def date_range(start, end):
    """Generate date range (memory efficient)"""
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)

# Usage
for d in date_range(date(2026, 1, 1), date(2026, 1, 31)):
    print(d)
```

---

## Practical Examples

### Log Timestamp Handling

```python
from datetime import datetime, timezone
import logging

class ISOFormatter(logging.Formatter):
    """Log formatter using ISO format timestamps"""

    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc)
        return dt.isoformat()

# Configure logging
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(ISOFormatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("Application started")
# 2026-01-07T06:30:45.123456+00:00 - INFO - Application started
```

### Scheduled Task Scheduler

```python
from datetime import datetime, timedelta
import time
import threading

class SimpleScheduler:
    """Simple scheduled task scheduler"""

    def __init__(self):
        self.tasks = []
        self.running = False

    def schedule(self, func, run_at):
        """Schedule a task to run at specified time"""
        self.tasks.append({'func': func, 'run_at': run_at, 'executed': False})

    def schedule_interval(self, func, interval_seconds, times=None):
        """Schedule a task to run repeatedly at intervals"""
        def wrapper():
            count = 0
            while self.running and (times is None or count < times):
                func()
                count += 1
                time.sleep(interval_seconds)

        thread = threading.Thread(target=wrapper, daemon=True)
        thread.start()

    def run(self):
        """Run the scheduler"""
        self.running = True
        while self.running:
            now = datetime.now()
            for task in self.tasks:
                if not task['executed'] and now >= task['run_at']:
                    task['func']()
                    task['executed'] = True
            time.sleep(1)

    def stop(self):
        """Stop the scheduler"""
        self.running = False

# Usage example
def say_hello():
    print(f"Hello at {datetime.now()}")

scheduler = SimpleScheduler()
scheduler.schedule(say_hello, datetime.now() + timedelta(seconds=5))
# scheduler.run()  # Executes after 5 seconds
```

### Time Period Statistics

```python
from datetime import datetime, timedelta
from collections import defaultdict

class TimeSeriesAnalyzer:
    """Time series data analyzer"""

    def __init__(self, data):
        """
        data: [(datetime, value), ...]
        """
        self.data = sorted(data, key=lambda x: x[0])

    def group_by_day(self):
        """Group by day"""
        groups = defaultdict(list)
        for dt, value in self.data:
            key = dt.date()
            groups[key].append(value)
        return dict(groups)

    def group_by_hour(self):
        """Group by hour"""
        groups = defaultdict(list)
        for dt, value in self.data:
            key = dt.replace(minute=0, second=0, microsecond=0)
            groups[key].append(value)
        return dict(groups)

    def get_range(self, start, end):
        """Get data within time range"""
        return [(dt, v) for dt, v in self.data if start <= dt <= end]

    def daily_average(self):
        """Calculate daily average"""
        groups = self.group_by_day()
        return {day: sum(values) / len(values)
                for day, values in groups.items()}

# Usage example
data = [
    (datetime(2026, 1, 7, 10, 0), 100),
    (datetime(2026, 1, 7, 14, 0), 150),
    (datetime(2026, 1, 7, 18, 0), 120),
    (datetime(2026, 1, 8, 10, 0), 110),
    (datetime(2026, 1, 8, 14, 0), 140),
]

analyzer = TimeSeriesAnalyzer(data)
print(analyzer.daily_average())
# {date(2026, 1, 7): 123.33, date(2026, 1, 8): 125.0}
```

### Meeting Scheduler

```python
from datetime import datetime, timedelta
from typing import List, Tuple, Optional

class MeetingScheduler:
    """Meeting time scheduler"""

    def __init__(self, work_start: int = 9, work_end: int = 18):
        self.work_start = work_start
        self.work_end = work_end
        self.meetings: List[Tuple[datetime, datetime]] = []

    def add_meeting(self, start: datetime, end: datetime) -> bool:
        """Add a meeting"""
        if not self._is_valid_time(start, end):
            return False
        if self._has_conflict(start, end):
            return False
        self.meetings.append((start, end))
        self.meetings.sort(key=lambda x: x[0])
        return True

    def _is_valid_time(self, start: datetime, end: datetime) -> bool:
        """Check if time is within working hours"""
        if start.weekday() >= 5:  # Weekend
            return False
        if start.hour < self.work_start or end.hour > self.work_end:
            return False
        return start < end

    def _has_conflict(self, start: datetime, end: datetime) -> bool:
        """Check for time conflicts"""
        for meeting_start, meeting_end in self.meetings:
            if not (end <= meeting_start or start >= meeting_end):
                return True
        return False

    def find_free_slots(self, date: datetime, duration_minutes: int) -> List[datetime]:
        """Find free time slots for a given day"""
        slots = []
        day_start = date.replace(hour=self.work_start, minute=0, second=0)
        day_end = date.replace(hour=self.work_end, minute=0, second=0)
        duration = timedelta(minutes=duration_minutes)

        # Get meetings for that day
        day_meetings = [
            (s, e) for s, e in self.meetings
            if s.date() == date.date()
        ]
        day_meetings.sort()

        current = day_start
        for meeting_start, meeting_end in day_meetings:
            while current + duration <= meeting_start:
                slots.append(current)
                current += timedelta(minutes=30)
            current = max(current, meeting_end)

        while current + duration <= day_end:
            slots.append(current)
            current += timedelta(minutes=30)

        return slots

# Usage example
scheduler = MeetingScheduler()
scheduler.add_meeting(
    datetime(2026, 1, 7, 10, 0),
    datetime(2026, 1, 7, 11, 0)
)
scheduler.add_meeting(
    datetime(2026, 1, 7, 14, 0),
    datetime(2026, 1, 7, 15, 30)
)

free_slots = scheduler.find_free_slots(datetime(2026, 1, 7), 60)
print("60-minute free slots:")
for slot in free_slots:
    print(f"  {slot.strftime('%H:%M')}")
```

---

## Common Issues and Solutions

### Timezone Handling Pitfalls

```python
from datetime import datetime, timezone

# Problem: Comparing naive and aware datetime
naive = datetime(2026, 1, 7, 14, 0)
aware = datetime(2026, 1, 7, 14, 0, tzinfo=timezone.utc)

# This will raise TypeError
# print(naive == aware)

# Solution: Standardize timezone handling
def ensure_aware(dt, tz=timezone.utc):
    """Ensure datetime has timezone info"""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt

naive_aware = ensure_aware(naive)
print(naive_aware == aware)  # True
```

### End-of-Month Date Calculation

```python
from datetime import datetime, timedelta
import calendar

def get_last_day_of_month(dt):
    """Get the last day of the month"""
    _, last_day = calendar.monthrange(dt.year, dt.month)
    return dt.replace(day=last_day)

def add_months(dt, months):
    """Safely add months (handling end-of-month boundary)"""
    month = dt.month + months
    year = dt.year + (month - 1) // 12
    month = (month - 1) % 12 + 1

    # Handle end-of-month boundary
    _, max_day = calendar.monthrange(year, month)
    day = min(dt.day, max_day)

    return dt.replace(year=year, month=month, day=day)

# Test
dt = datetime(2026, 1, 31)
print(add_months(dt, 1))  # 2026-02-28 (not February 31st!)
print(add_months(dt, 12)) # 2027-01-31
```

### Timestamp Precision Issues

```python
from datetime import datetime, timezone

# Python timestamp is a float, may have precision issues
dt = datetime(2026, 1, 7, 14, 30, 45, 123456, tzinfo=timezone.utc)
ts = dt.timestamp()
restored = datetime.fromtimestamp(ts, tz=timezone.utc)

print(dt)       # 2026-01-07 14:30:45.123456+00:00
print(restored) # May differ slightly

# Solution: Use integer millisecond timestamps
def to_timestamp_ms(dt):
    return int(dt.timestamp() * 1000)

def from_timestamp_ms(ts_ms, tz=timezone.utc):
    return datetime.fromtimestamp(ts_ms / 1000, tz=tz)

ts_ms = to_timestamp_ms(dt)
print(ts_ms)  # 1736260245123
```

### Cross-Timezone Date Changes

```python
from datetime import datetime, timezone, timedelta
import pytz

# Problem: Same moment can be different dates in different timezones
utc = pytz.UTC
tokyo = pytz.timezone('Asia/Tokyo')
new_york = pytz.timezone('America/New_York')

# UTC time: 2026-01-07 20:00
utc_time = datetime(2026, 1, 7, 20, 0, tzinfo=utc)

tokyo_time = utc_time.astimezone(tokyo)
ny_time = utc_time.astimezone(new_york)

print(f"UTC: {utc_time.date()}")      # 2026-01-07
print(f"Tokyo: {tokyo_time.date()}")    # 2026-01-08
print(f"New York: {ny_time.date()}")       # 2026-01-07

# Solution: Always store UTC, convert when displaying
def get_local_date(utc_dt, tz):
    """Get local date for a specific timezone"""
    local_dt = utc_dt.astimezone(tz)
    return local_dt.date()
```

---

## Summary

### Core Class Selection Guide

| Scenario | Recommended Class |
|----------|-------------------|
| Date only | `date` |
| Time only | `time` |
| Date and time | `datetime` |
| Time difference calculation | `timedelta` |
| Fixed offset timezone | `timezone` |
| Complex timezone handling | `pytz` |
| Flexible date parsing | `dateutil.parser` |
| Relative time calculation | `dateutil.relativedelta` |

### Best Practices Summary

1. **Always use aware datetime**: Avoid timezone confusion from naive datetime
2. **Store internally as UTC**: Standardize to avoid timezone conversion issues
3. **Use ISO format**: `isoformat()` and `fromisoformat()` are the most standard methods
4. **Watch out for end-of-month boundaries**: Be careful of date overflow when adding months
5. **In performance-sensitive scenarios**: Cache results of `datetime.now()`
6. **Handle daylight saving time**: Use pytz's `localize()` method
7. **JSON serialization**: Use ISO format strings or timestamps

Python's datetime module provides basic functionality for handling dates and times. Combined with third-party libraries like `pytz` and `dateutil`, you can elegantly handle various complex date and time scenarios. Mastering these tools will enable you to confidently handle any time-related programming tasks.
