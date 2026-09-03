---
title: Comprehensive Guide to Python time Module
description: Master the Python time module comprehensively, including time retrieval, sleep, formatting, high-precision timers, and timezone handling
track: python
section: stdlib
difficulty: intermediate
tags:
  - Python
  - time
  - timing
  - performance measurement
  - timezone
status: imported
origin: old/src/content/docs/python/time-module.en.md
divergence: 0.208
issues:
  - category-casing
legacy:
  category: python
  subcategory: standard library
  order: 34
  lastUpdated: 2026-01-07
---

The `time` module is a low-level module in the Python standard library for handling time-related operations. It provides various functions that interact with system time. Unlike the `datetime` module which focuses on date and time object manipulation, the `time` module operates closer to the operating system level, offering core functionality such as timestamp retrieval, program sleep, high-precision timing, and time formatting.

## Concept Explanation

### Position of the time Module

The `time` module acts as a bridge between Python and operating system time functionality. It primarily handles:

- **Unix Timestamps**: The number of seconds since 1970-01-01 00:00:00 UTC
- **Structured Time**: Breaking down time into year, month, day, hour, minute, second components
- **Program Sleep**: Pausing program execution for a specified duration
- **High-Precision Timing**: For performance measurement and benchmarking
- **Timezone Information**: Obtaining local timezone offsets

```python
import time

# Overview of module's main functions
print(time.time())        # Current timestamp
print(time.localtime())   # Local structured time
print(time.gmtime())      # UTC structured time
print(time.strftime('%Y-%m-%d %H:%M:%S'))  # Formatted time
```

### Differences from datetime Module

| Feature | time Module | datetime Module |
|---------|-------------|-----------------|
| Abstraction Level | Low, close to OS | High, object-oriented |
| Time Representation | Timestamps (floats), struct_time | date, time, datetime objects |
| Primary Use | Performance timing, sleep, low-level operations | Date calculations, formatting, business logic |
| Timezone Support | Basic support | More comprehensive timezone handling |
| Date Arithmetic | Not supported | Supports timedelta operations |

---

## Core Principles

### Unix Timestamp

The Unix timestamp (Unix Epoch) is an international standard for time calculation, defined as the number of seconds elapsed since **1970-01-01 00:00:00 UTC**.

```python
import time

# Get current timestamp
timestamp = time.time()
print(f"Current timestamp: {timestamp}")  # e.g., 1736234445.123456

# Timestamp is a float; the decimal part represents microseconds
print(f"Integer part (seconds): {int(timestamp)}")
print(f"Decimal part (microseconds): {timestamp - int(timestamp)}")

# Timestamp range
# 32-bit systems: 1970-01-01 to 2038-01-19 (Year 2038 Problem)
# 64-bit systems: Practically unlimited
```

### struct_time Structure

`struct_time` is a named tuple that breaks down time into 9 components:

```python
import time

# Get current local time as struct_time
st = time.localtime()
print(st)
# time.struct_time(tm_year=2026, tm_mon=1, tm_mday=7,
#                  tm_hour=14, tm_min=30, tm_sec=45,
#                  tm_wday=2, tm_yday=7, tm_isdst=0)

# Fields of struct_time
print(f"Year (tm_year): {st.tm_year}")      # 2026
print(f"Month (tm_mon): {st.tm_mon}")        # 1-12
print(f"Day (tm_mday): {st.tm_mday}")        # 1-31
print(f"Hour (tm_hour): {st.tm_hour}")       # 0-23
print(f"Minute (tm_min): {st.tm_min}")       # 0-59
print(f"Second (tm_sec): {st.tm_sec}")       # 0-61 (allows leap seconds)
print(f"Weekday (tm_wday): {st.tm_wday}")    # 0-6 (Monday=0)
print(f"Day of year (tm_yday): {st.tm_yday}")  # 1-366
print(f"DST (tm_isdst): {st.tm_isdst}")      # 0/1/-1

# Access like a tuple using indices
print(st[0])  # Year
print(st[1])  # Month
```

### Clock Types

Python provides multiple clock types suitable for different scenarios:

```python
import time

# time.time() - System clock
# Returns seconds since epoch, may be affected by system time adjustments
print(f"time(): {time.time()}")

# time.monotonic() - Monotonic clock
# Only moves forward, unaffected by system time adjustments, suitable for measuring intervals
print(f"monotonic(): {time.monotonic()}")

# time.perf_counter() - Performance counter
# Highest precision clock, suitable for performance benchmarking
print(f"perf_counter(): {time.perf_counter()}")

# time.process_time() - Process time
# Excludes sleep time, only counts CPU time
print(f"process_time(): {time.process_time()}")

# time.thread_time() - Thread time (Python 3.7+)
# CPU time for the current thread
print(f"thread_time(): {time.thread_time()}")

# Get detailed clock information
print(time.get_clock_info('time'))
print(time.get_clock_info('monotonic'))
print(time.get_clock_info('perf_counter'))
```

---

## Core Concepts

### Time Retrieval Functions

```python
import time

# time() - Get current timestamp
timestamp = time.time()
print(f"Timestamp: {timestamp}")

# time_ns() - Get nanosecond-level timestamp (Python 3.7+)
timestamp_ns = time.time_ns()
print(f"Nanosecond timestamp: {timestamp_ns}")

# localtime() - Convert to local time struct_time
local = time.localtime()
local_from_ts = time.localtime(timestamp)

# gmtime() - Convert to UTC time struct_time
utc = time.gmtime()
utc_from_ts = time.gmtime(timestamp)

# mktime() - Convert struct_time to timestamp
st = time.localtime()
ts = time.mktime(st)
print(f"struct_time -> timestamp: {ts}")
```

### Sleep Functions

```python
import time

# sleep() - Sleep for specified seconds
print("Starting sleep...")
time.sleep(1)          # Sleep 1 second
time.sleep(0.5)        # Sleep 0.5 seconds
time.sleep(0.001)      # Sleep 1 millisecond
print("Sleep ended")

# Sleep precision depends on operating system
# Windows: Typically 10-15ms precision
# Linux/macOS: Typically 1ms or higher precision

# Note: sleep may be interrupted by signals
import signal

def handler(signum, frame):
    print("Signal received")

signal.signal(signal.SIGALRM, handler)

try:
    time.sleep(10)  # May return early
except InterruptedError:
    print("Sleep was interrupted")
```

### Formatting Functions

```python
import time

# strftime() - Format struct_time as string
st = time.localtime()
formatted = time.strftime('%Y-%m-%d %H:%M:%S', st)
print(formatted)  # 2026-01-07 14:30:45

# Without struct_time, uses current local time
print(time.strftime('%Y-%m-%d'))

# strptime() - Parse string as struct_time
st = time.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(st)

# asctime() - Convert struct_time to readable string
print(time.asctime(st))  # Tue Jan  7 14:30:45 2026

# ctime() - Convert timestamp to readable string
print(time.ctime(time.time()))  # Tue Jan  7 14:30:45 2026
```

### High-Precision Timers

```python
import time

# perf_counter() - Performance counter (highest precision)
start = time.perf_counter()
# Execute code
result = sum(range(1000000))
end = time.perf_counter()
print(f"Elapsed: {end - start:.6f} seconds")

# perf_counter_ns() - Nanosecond-level performance counter
start_ns = time.perf_counter_ns()
result = sum(range(1000000))
end_ns = time.perf_counter_ns()
print(f"Elapsed: {end_ns - start_ns} nanoseconds")

# monotonic() - Monotonic clock (unaffected by system time adjustment)
start = time.monotonic()
time.sleep(0.1)
end = time.monotonic()
print(f"Actual sleep: {end - start:.6f} seconds")

# monotonic_ns() - Nanosecond-level monotonic clock
start_ns = time.monotonic_ns()
time.sleep(0.1)
end_ns = time.monotonic_ns()
print(f"Actual sleep: {end_ns - start_ns} nanoseconds")
```

### Timezone Related

```python
import time

# timezone - UTC offset in seconds
# Note: Western timezones are positive, eastern are negative (opposite of common understanding)
print(f"Timezone offset: {time.timezone} seconds")
print(f"Timezone offset: {time.timezone // 3600} hours")

# altzone - UTC offset during daylight saving time
print(f"DST offset: {time.altzone} seconds")

# daylight - Whether daylight saving time is observed
print(f"Has daylight saving time: {time.daylight}")

# tzname - Timezone name tuple (standard name, DST name)
print(f"Timezone names: {time.tzname}")

# Set timezone environment variable
import os
os.environ['TZ'] = 'Asia/Shanghai'
time.tzset()  # Reread timezone settings (Unix only)
```

---

## Code Examples

### time() - Get Current Timestamp

```python
import time

# Basic usage
timestamp = time.time()
print(f"Current timestamp: {timestamp}")
# Output: Current timestamp: 1736234445.123456

# Timestamp precision
print(f"Seconds: {int(timestamp)}")
print(f"Milliseconds: {int(timestamp * 1000)}")
print(f"Microseconds: {int(timestamp * 1000000)}")

# Use time_ns() for nanosecond precision
timestamp_ns = time.time_ns()
print(f"Nanosecond timestamp: {timestamp_ns}")

# Measure code execution time (basic approach)
start = time.time()
# Perform some operations
total = sum(range(1000000))
end = time.time()
print(f"Execution time: {end - start:.4f} seconds")

# Convert between timestamp and datetime
from datetime import datetime

# timestamp -> datetime
dt = datetime.fromtimestamp(timestamp)
print(f"datetime: {dt}")

# datetime -> timestamp
new_ts = dt.timestamp()
print(f"timestamp: {new_ts}")
```

### sleep() - Program Sleep

```python
import time

# Basic sleep
print(f"Start: {time.strftime('%H:%M:%S')}")
time.sleep(2)  # Sleep 2 seconds
print(f"End: {time.strftime('%H:%M:%S')}")

# Millisecond-level sleep
time.sleep(0.1)   # 100 milliseconds
time.sleep(0.01)  # 10 milliseconds
time.sleep(0.001) # 1 millisecond

# Implement simple countdown
def countdown(seconds):
    """Simple countdown"""
    for i in range(seconds, 0, -1):
        print(f"\rCountdown: {i} seconds", end='', flush=True)
        time.sleep(1)
    print("\rCountdown complete!    ")

countdown(5)

# Implement polling mechanism
def poll_until(condition_func, timeout=30, interval=1):
    """Poll until condition is met or timeout"""
    start = time.monotonic()
    while time.monotonic() - start < timeout:
        if condition_func():
            return True
        time.sleep(interval)
    return False

# Usage example
counter = [0]
def check_condition():
    counter[0] += 1
    return counter[0] >= 3

result = poll_until(check_condition, timeout=10, interval=0.5)
print(f"Condition met: {result}")

# Implement retry with backoff
import random

def retry_with_backoff(func, max_retries=5, base_delay=1):
    """Retry with exponential backoff and jitter"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"Retry {attempt + 1}/{max_retries}, waiting {delay:.2f} seconds")
            time.sleep(delay)
```

### strftime() and strptime() - Time Formatting

```python
import time

# strftime - Format output
st = time.localtime()

# Common formats
print(time.strftime('%Y-%m-%d', st))           # 2026-01-07
print(time.strftime('%Y/%m/%d', st))           # 2026/01/07
print(time.strftime('%Y-%m-%d %H:%M:%S', st))  # 2026-01-07 14:30:45
print(time.strftime('%H:%M:%S', st))           # 14:30:45
print(time.strftime('%I:%M %p', st))           # 02:30 PM

# English format
print(time.strftime('%A, %B %d, %Y', st))      # Wednesday, January 07, 2026
print(time.strftime('%a, %b %d', st))          # Wed, Jan 07

# ISO format
print(time.strftime('%Y-%m-%dT%H:%M:%S', st))  # 2026-01-07T14:30:45

# Special formats
print(time.strftime('%j', st))    # Day of year 007
print(time.strftime('%U', st))    # Week of year (Sunday start)
print(time.strftime('%W', st))    # Week of year (Monday start)
print(time.strftime('%Z', st))    # Timezone name

# strptime - Parse string
st1 = time.strptime('2026-01-07', '%Y-%m-%d')
print(st1)

st2 = time.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(st2)

st3 = time.strptime('January 07, 2026', '%B %d, %Y')
print(st3)

# Parse and convert to timestamp
timestamp = time.mktime(st2)
print(f"Timestamp: {timestamp}")
```

### Format Code Reference Table

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
| `%w` | Weekday (0=Sunday) | 0-6 |
| `%z` | UTC offset | +0800 |
| `%Z` | Timezone name | CST |
| `%%` | Literal % | % |

### perf_counter() - High-Precision Performance Timing

```python
import time

# Basic usage - Measure code execution time
start = time.perf_counter()

# Code to measure
result = 0
for i in range(1000000):
    result += i

end = time.perf_counter()
elapsed = end - start
print(f"Execution time: {elapsed:.6f} seconds")
print(f"Execution time: {elapsed * 1000:.3f} milliseconds")

# Use nanosecond version for higher precision
start_ns = time.perf_counter_ns()

result = 0
for i in range(1000000):
    result += i

end_ns = time.perf_counter_ns()
elapsed_ns = end_ns - start_ns
print(f"Execution time: {elapsed_ns} nanoseconds")
print(f"Execution time: {elapsed_ns / 1000000:.3f} milliseconds")

# Create timer context manager
from contextlib import contextmanager

@contextmanager
def timer(name="Code block"):
    """Timer context manager"""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{name} elapsed: {elapsed:.6f} seconds")

# Use the timer
with timer("List comprehension"):
    result = [i ** 2 for i in range(100000)]

with timer("Loop"):
    result = []
    for i in range(100000):
        result.append(i ** 2)

# Create reusable timer class
class Timer:
    """Reusable high-precision timer"""

    def __init__(self):
        self._start = None
        self._elapsed = 0
        self._running = False

    def start(self):
        """Start timing"""
        if not self._running:
            self._start = time.perf_counter()
            self._running = True
        return self

    def stop(self):
        """Stop timing"""
        if self._running:
            self._elapsed += time.perf_counter() - self._start
            self._running = False
        return self

    def reset(self):
        """Reset timer"""
        self._start = None
        self._elapsed = 0
        self._running = False
        return self

    @property
    def elapsed(self):
        """Get elapsed time"""
        if self._running:
            return self._elapsed + (time.perf_counter() - self._start)
        return self._elapsed

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *args):
        self.stop()

# Use timer class
timer = Timer()

# Method 1: Manual control
timer.start()
time.sleep(0.1)
timer.stop()
print(f"Elapsed: {timer.elapsed:.4f} seconds")

# Method 2: Context manager
with Timer() as t:
    time.sleep(0.1)
print(f"Elapsed: {t.elapsed:.4f} seconds")

# Method 3: Cumulative timing
timer = Timer()
for _ in range(3):
    timer.start()
    time.sleep(0.05)
    timer.stop()
print(f"Total elapsed: {timer.elapsed:.4f} seconds")
```

### monotonic() - Monotonic Clock

```python
import time

# Characteristics of monotonic:
# Only moves forward, never backward
# Unaffected by system time adjustments
# Suitable for measuring time intervals

# Basic usage
start = time.monotonic()
time.sleep(1)
end = time.monotonic()
print(f"Elapsed time: {end - start:.4f} seconds")

# Difference between monotonic and time
# If system time is adjusted, time() is affected, monotonic() is not

# Implement timeout detection
def wait_with_timeout(condition_func, timeout):
    """Wait for condition to be met or timeout"""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if condition_func():
            return True
        time.sleep(0.01)
    return False

# Implement rate limiter
class RateLimiter:
    """Simple rate limiter"""

    def __init__(self, rate, per=1.0):
        """
        rate: Number of allowed operations
        per: Time window in seconds
        """
        self.rate = rate
        self.per = per
        self.allowance = rate
        self.last_check = time.monotonic()

    def allow(self):
        """Check if operation is allowed"""
        current = time.monotonic()
        elapsed = current - self.last_check
        self.last_check = current

        # Replenish allowance
        self.allowance += elapsed * (self.rate / self.per)
        if self.allowance > self.rate:
            self.allowance = self.rate

        if self.allowance < 1.0:
            return False

        self.allowance -= 1.0
        return True

# Use rate limiter
limiter = RateLimiter(rate=5, per=1.0)  # Max 5 per second

for i in range(10):
    if limiter.allow():
        print(f"Request {i} allowed")
    else:
        print(f"Request {i} rate limited")
    time.sleep(0.1)
```

### timezone - Timezone Handling

```python
import time
import os

# Get current timezone information
print(f"Timezone offset: {time.timezone} seconds ({time.timezone // 3600} hours)")
print(f"DST offset: {time.altzone} seconds")
print(f"Has daylight saving time: {time.daylight}")
print(f"Timezone names: {time.tzname}")

# Check if currently in daylight saving time
st = time.localtime()
if st.tm_isdst > 0:
    print("Currently in daylight saving time")
elif st.tm_isdst == 0:
    print("Not in daylight saving time")
else:
    print("DST information unknown")

# Convert between local and UTC time
timestamp = time.time()

# Local time
local_time = time.localtime(timestamp)
print(f"Local time: {time.strftime('%Y-%m-%d %H:%M:%S', local_time)}")

# UTC time
utc_time = time.gmtime(timestamp)
print(f"UTC time: {time.strftime('%Y-%m-%d %H:%M:%S', utc_time)}")

# Calculate timezone offset
local_ts = time.mktime(local_time)
utc_ts = time.mktime(utc_time)
offset_hours = (local_ts - utc_ts) / 3600
print(f"Timezone offset: {offset_hours:+.0f} hours")

# Set timezone (Unix systems only)
# os.environ['TZ'] = 'America/New_York'
# time.tzset()

# Create timezone conversion function
def convert_timezone(timestamp, from_offset, to_offset):
    """
    Convert timestamp to different timezone
    offset: UTC offset in hours (positive for east)
    """
    # Adjust to UTC
    utc_ts = timestamp - from_offset * 3600
    # Adjust to target timezone
    target_ts = utc_ts + to_offset * 3600
    return target_ts

# Convert Beijing time to New York time
beijing_ts = time.time()  # Assume this is Beijing time timestamp
ny_ts = convert_timezone(beijing_ts, 8, -5)  # +8 -> -5

print(f"Beijing: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(beijing_ts))}")
print(f"New York: {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ny_ts))}")
```

---

## Best Practices

### Choose the Right Clock

```python
import time

# Scenario 1: Need to get current time point (e.g., logging)
# Use time.time()
log_time = time.time()
print(f"[{log_time}] Event occurred")

# Scenario 2: Measure code execution time (performance benchmarking)
# Use time.perf_counter()
start = time.perf_counter()
# Execute code
elapsed = time.perf_counter() - start

# Scenario 3: Implement timeout mechanism
# Use time.monotonic() (unaffected by system time adjustments)
deadline = time.monotonic() + 30  # 30 second timeout

# Scenario 4: Analyze CPU-intensive code performance
# Use time.process_time() (only counts CPU time)
cpu_start = time.process_time()
# CPU-intensive operations
cpu_time = time.process_time() - cpu_start
```

### Avoid sleep Precision Issues

```python
import time

# Problem: sleep actual duration may be longer than requested
def measure_sleep_accuracy(duration, iterations=10):
    """Measure sleep accuracy"""
    errors = []
    for _ in range(iterations):
        start = time.perf_counter()
        time.sleep(duration)
        actual = time.perf_counter() - start
        errors.append(actual - duration)

    avg_error = sum(errors) / len(errors)
    max_error = max(errors)
    return avg_error, max_error

avg, max_err = measure_sleep_accuracy(0.01)  # 10ms
print(f"Average error: {avg * 1000:.3f} ms, Max error: {max_err * 1000:.3f} ms")

# Solution: Use busy-wait for high-precision sleep (CPU intensive)
def precise_sleep(duration):
    """High-precision sleep (using busy-wait)"""
    end = time.perf_counter() + duration
    while time.perf_counter() < end:
        pass

# Hybrid solution: Use sleep for most time, busy-wait for final precision
def hybrid_sleep(duration, precision=0.001):
    """Hybrid sleep: save CPU while maintaining precision"""
    end = time.perf_counter() + duration

    # Use sleep for most of the time
    if duration > precision * 2:
        time.sleep(duration - precision)

    # Final busy-wait for precision
    while time.perf_counter() < end:
        pass
```

### Handle Timestamps Correctly

```python
import time
from datetime import datetime, timezone

# Best practice: Always store UTC timestamps
def get_utc_timestamp():
    """Get UTC timestamp"""
    return time.time()

# Convert to local time when displaying
def timestamp_to_local_string(ts):
    """Convert timestamp to local time string"""
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(ts))

def timestamp_to_utc_string(ts):
    """Convert timestamp to UTC time string"""
    return time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(ts))

# Usage example
ts = get_utc_timestamp()
print(f"Timestamp: {ts}")
print(f"Local time: {timestamp_to_local_string(ts)}")
print(f"UTC time: {timestamp_to_utc_string(ts)}")

# Avoid directly comparing times from different timezones
# Always convert to timestamps for comparison
def is_before(time1_str, time2_str, fmt='%Y-%m-%d %H:%M:%S'):
    """Compare two time strings"""
    st1 = time.strptime(time1_str, fmt)
    st2 = time.strptime(time2_str, fmt)
    return time.mktime(st1) < time.mktime(st2)
```

### Gracefully Handle Formatting Errors

```python
import time

def safe_strptime(date_string, format_string):
    """Safe time parsing"""
    try:
        return time.strptime(date_string, format_string)
    except ValueError as e:
        print(f"Parse error: {e}")
        return None

def parse_flexible(date_string):
    """Try multiple formats for parsing"""
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%d/%m/%Y',
        '%B %d, %Y',
    ]

    for fmt in formats:
        try:
            return time.strptime(date_string, fmt)
        except ValueError:
            continue

    raise ValueError(f"Unable to parse date: {date_string}")

# Usage examples
print(parse_flexible('2026-01-07'))
print(parse_flexible('January 07, 2026'))
```

---

## Common Pitfalls

### time() Affected by System Time

```python
import time

# Problem: System time may be adjusted by NTP, causing time() to jump
start = time.time()
# If system time is adjusted here...
time.sleep(1)
end = time.time()
# end - start may not be 1 second!

# Solution: Use monotonic() to measure time intervals
start = time.monotonic()
time.sleep(1)
end = time.monotonic()
# end - start always approximately equals 1 second
```

### sleep is Not Precise

```python
import time

# Problem: sleep may sleep longer than requested
for i in range(10):
    start = time.perf_counter()
    time.sleep(0.01)  # Request 10ms
    actual = time.perf_counter() - start
    print(f"Requested 10ms, actual {actual * 1000:.2f}ms")

# Solution: For precise timing loops
def precise_loop(interval, iterations):
    """Precise timing loop"""
    next_time = time.perf_counter()
    for i in range(iterations):
        # Execute task
        print(f"Iteration {i}")

        # Calculate next execution time
        next_time += interval
        sleep_time = next_time - time.perf_counter()
        if sleep_time > 0:
            time.sleep(sleep_time)

precise_loop(0.1, 10)  # Execute every 100ms
```

### mktime Timezone Pitfall

```python
import time

# Problem: mktime assumes input is local time
utc_time = time.gmtime()  # This is UTC time
timestamp = time.mktime(utc_time)  # But mktime treats it as local!

# Correct approach: Use calendar.timegm for UTC time
import calendar
timestamp = calendar.timegm(utc_time)

# Or manually compensate for timezone offset
def utc_struct_to_timestamp(utc_struct):
    """Convert UTC struct_time to timestamp"""
    return calendar.timegm(utc_struct)

def local_struct_to_timestamp(local_struct):
    """Convert local struct_time to timestamp"""
    return time.mktime(local_struct)
```

### strptime Year Parsing Issue

```python
import time

# Problem: Two-digit year parsing
st = time.strptime('01-07-26', '%m-%d-%y')
print(st.tm_year)  # 2026 or 1926?

# Python's rules:
# 00-68 -> 2000-2068
# 69-99 -> 1969-1999

# Recommendation: Always use four-digit year
st = time.strptime('01-07-2026', '%m-%d-%Y')
print(st.tm_year)  # 2026
```

### Floating-Point Precision Issues

```python
import time

# Problem: Timestamp is float, may have precision loss
ts1 = 1736234445.123456789
ts2 = time.time()

# Floats can only accurately represent ~15-16 significant digits
# For large timestamps, microsecond precision may be lost

# Solution: Use nanosecond version
ts_ns = time.time_ns()  # Integer, no precision loss
print(f"Nanosecond timestamp: {ts_ns}")

# Or use Decimal for precise calculation
from decimal import Decimal
precise_ts = Decimal(str(time.time()))
```

---

## Performance Considerations

### Performance Comparison of Functions

```python
import time

def benchmark(func, iterations=1000000):
    """Benchmark function"""
    start = time.perf_counter()
    for _ in range(iterations):
        func()
    elapsed = time.perf_counter() - start
    return elapsed / iterations * 1e9  # Nanoseconds per call

# Test performance of various time functions
results = {
    'time()': benchmark(time.time),
    'time_ns()': benchmark(time.time_ns),
    'monotonic()': benchmark(time.monotonic),
    'monotonic_ns()': benchmark(time.monotonic_ns),
    'perf_counter()': benchmark(time.perf_counter),
    'perf_counter_ns()': benchmark(time.perf_counter_ns),
    'process_time()': benchmark(time.process_time),
    'localtime()': benchmark(time.localtime),
    'gmtime()': benchmark(time.gmtime),
}

print("Function performance (nanoseconds per call):")
for name, ns in sorted(results.items(), key=lambda x: x[1]):
    print(f"  {name}: {ns:.1f} ns")
```

### strftime/strptime Performance Optimization

```python
import time
from functools import lru_cache

# Problem: strftime/strptime are relatively slow

# Optimization 1: Pre-compile format (use datetime module)
from datetime import datetime

# Optimization 2: Cache results
@lru_cache(maxsize=1024)
def cached_strptime(date_string, format_string):
    return time.strptime(date_string, format_string)

# Optimization 3: For fixed formats, use string operations
def fast_parse_iso_date(date_str):
    """Fast ISO date parsing (YYYY-MM-DD)"""
    # 5-10x faster than strptime
    return int(date_str[:4]), int(date_str[5:7]), int(date_str[8:10])

def fast_format_iso_date(year, month, day):
    """Fast ISO date formatting"""
    # 3-5x faster than strftime
    return f"{year:04d}-{month:02d}-{day:02d}"

# Performance comparison
iterations = 100000

# strptime
start = time.perf_counter()
for _ in range(iterations):
    time.strptime('2026-01-07', '%Y-%m-%d')
strptime_time = time.perf_counter() - start

# fast_parse
start = time.perf_counter()
for _ in range(iterations):
    fast_parse_iso_date('2026-01-07')
fast_time = time.perf_counter() - start

print(f"strptime: {strptime_time:.3f}s")
print(f"fast_parse: {fast_time:.3f}s")
print(f"Speedup: {strptime_time / fast_time:.1f}x")
```

### Reduce time Calls

```python
import time

# Problem: Frequent time function calls have overhead

# Optimization: Get time outside loops
def process_items_slow(items):
    """Slow: Get time on each loop iteration"""
    for item in items:
        item['processed_at'] = time.time()

def process_items_fast(items):
    """Fast: Set same time for all items"""
    now = time.time()
    for item in items:
        item['processed_at'] = now

# For long-running loops, periodically update time
def process_with_periodic_time(items, time_interval=1.0):
    """Periodically update time"""
    last_time_check = time.monotonic()
    current_time = time.time()

    for item in items:
        # Check if time needs updating
        now = time.monotonic()
        if now - last_time_check >= time_interval:
            current_time = time.time()
            last_time_check = now

        item['processed_at'] = current_time
```

---

## Real-World Scenarios

### Scenario 1: Code Performance Profiler

```python
import time
from functools import wraps
from collections import defaultdict

class Profiler:
    """Simple code performance profiler"""

    def __init__(self):
        self.stats = defaultdict(lambda: {'calls': 0, 'total_time': 0, 'min': float('inf'), 'max': 0})

    def profile(self, name=None):
        """Decorator: Profile function performance"""
        def decorator(func):
            func_name = name or func.__name__

            @wraps(func)
            def wrapper(*args, **kwargs):
                start = time.perf_counter()
                try:
                    return func(*args, **kwargs)
                finally:
                    elapsed = time.perf_counter() - start
                    stats = self.stats[func_name]
                    stats['calls'] += 1
                    stats['total_time'] += elapsed
                    stats['min'] = min(stats['min'], elapsed)
                    stats['max'] = max(stats['max'], elapsed)

            return wrapper
        return decorator

    def report(self):
        """Generate performance report"""
        print("\nPerformance Analysis Report")
        print("=" * 70)
        print(f"{'Function':<20} {'Calls':>10} {'Total':>12} {'Average':>12} {'Max':>12}")
        print("-" * 70)

        for name, stats in sorted(self.stats.items(), key=lambda x: x[1]['total_time'], reverse=True):
            avg = stats['total_time'] / stats['calls'] if stats['calls'] > 0 else 0
            print(f"{name:<20} {stats['calls']:>10} {stats['total_time']*1000:>10.3f}ms "
                  f"{avg*1000:>10.3f}ms {stats['max']*1000:>10.3f}ms")

# Usage example
profiler = Profiler()

@profiler.profile()
def slow_function():
    time.sleep(0.1)
    return sum(range(10000))

@profiler.profile()
def fast_function():
    return sum(range(1000))

# Execute functions
for _ in range(5):
    slow_function()
    fast_function()

# Generate report
profiler.report()
```

### Scenario 2: Task Scheduler

```python
import time
import threading
from dataclasses import dataclass
from typing import Callable, Optional
import heapq

@dataclass
class ScheduledTask:
    """Scheduled task"""
    run_at: float
    interval: Optional[float]
    func: Callable
    args: tuple
    kwargs: dict

    def __lt__(self, other):
        return self.run_at < other.run_at

class Scheduler:
    """Simple task scheduler"""

    def __init__(self):
        self.tasks = []
        self.running = False
        self._lock = threading.Lock()

    def schedule_at(self, run_at: float, func: Callable, *args, **kwargs):
        """Schedule task at specific time"""
        task = ScheduledTask(run_at, None, func, args, kwargs)
        with self._lock:
            heapq.heappush(self.tasks, task)

    def schedule_after(self, delay: float, func: Callable, *args, **kwargs):
        """Schedule task after delay"""
        run_at = time.time() + delay
        self.schedule_at(run_at, func, *args, **kwargs)

    def schedule_interval(self, interval: float, func: Callable, *args, **kwargs):
        """Schedule periodic task"""
        run_at = time.time() + interval
        task = ScheduledTask(run_at, interval, func, args, kwargs)
        with self._lock:
            heapq.heappush(self.tasks, task)

    def run(self):
        """Run scheduler"""
        self.running = True
        while self.running:
            with self._lock:
                if not self.tasks:
                    continue

                now = time.time()
                task = self.tasks[0]

                if task.run_at <= now:
                    heapq.heappop(self.tasks)

                    # Execute task
                    try:
                        task.func(*task.args, **task.kwargs)
                    except Exception as e:
                        print(f"Task execution error: {e}")

                    # Reschedule if periodic
                    if task.interval:
                        task.run_at = now + task.interval
                        heapq.heappush(self.tasks, task)
                else:
                    # Wait until next task
                    wait_time = min(task.run_at - now, 0.1)
                    time.sleep(wait_time)

            time.sleep(0.01)  # Prevent CPU spinning

    def stop(self):
        """Stop scheduler"""
        self.running = False

# Usage example
def say_hello(name):
    print(f"[{time.strftime('%H:%M:%S')}] Hello, {name}!")

scheduler = Scheduler()
scheduler.schedule_after(1, say_hello, "World")
scheduler.schedule_after(2, say_hello, "Python")
scheduler.schedule_interval(1.5, lambda: print(f"[{time.strftime('%H:%M:%S')}] Tick"))

# Run scheduler in new thread
thread = threading.Thread(target=scheduler.run, daemon=True)
thread.start()

time.sleep(5)
scheduler.stop()
```

### Scenario 3: Rate Limiter

```python
import time
from collections import deque
from threading import Lock

class TokenBucket:
    """Token bucket rate limiter"""

    def __init__(self, rate: float, capacity: float):
        """
        rate: Tokens filled per second
        capacity: Bucket capacity
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_time = time.monotonic()
        self._lock = Lock()

    def acquire(self, tokens: int = 1) -> bool:
        """Try to acquire tokens"""
        with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_time

            # Fill tokens
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_time = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    def wait(self, tokens: int = 1):
        """Wait until tokens are acquired"""
        while not self.acquire(tokens):
            time.sleep(0.01)

class SlidingWindowLimiter:
    """Sliding window rate limiter"""

    def __init__(self, limit: int, window: float):
        """
        limit: Max requests in window
        window: Window size in seconds
        """
        self.limit = limit
        self.window = window
        self.requests = deque()
        self._lock = Lock()

    def allow(self) -> bool:
        """Check if request is allowed"""
        with self._lock:
            now = time.monotonic()

            # Remove requests outside window
            while self.requests and self.requests[0] < now - self.window:
                self.requests.popleft()

            if len(self.requests) < self.limit:
                self.requests.append(now)
                return True
            return False

# Usage examples
bucket = TokenBucket(rate=10, capacity=10)  # 10 requests per second

for i in range(20):
    if bucket.acquire():
        print(f"Request {i} allowed")
    else:
        print(f"Request {i} rate limited")
    time.sleep(0.05)
```

### Scenario 4: Timeout Decorator

```python
import time
import signal
import threading
from functools import wraps

def timeout(seconds):
    """Timeout decorator (Unix systems, signal-based)"""
    def decorator(func):
        def handler(signum, frame):
            raise TimeoutError(f"Function {func.__name__} timed out")

        @wraps(func)
        def wrapper(*args, **kwargs):
            old_handler = signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                return func(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old_handler)

        return wrapper
    return decorator

def timeout_thread(seconds):
    """Timeout decorator (cross-platform, thread-based)"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = [None]
            exception = [None]

            def target():
                try:
                    result[0] = func(*args, **kwargs)
                except Exception as e:
                    exception[0] = e

            thread = threading.Thread(target=target)
            thread.start()
            thread.join(timeout=seconds)

            if thread.is_alive():
                raise TimeoutError(f"Function {func.__name__} timed out")

            if exception[0]:
                raise exception[0]

            return result[0]

        return wrapper
    return decorator

# Usage example
@timeout_thread(2)
def slow_operation():
    time.sleep(5)
    return "Complete"

try:
    result = slow_operation()
except TimeoutError as e:
    print(f"Timeout: {e}")
```

---

## Interview Questions

### Common Interview Questions

**1. What's the difference between time.time() and time.monotonic()?**

```python
import time

# time.time():
# - Returns seconds since epoch
# - May be affected by system time adjustments (NTP sync, manual changes)
# - May jump backward
# - Good for getting current time point

# time.monotonic():
# - Returns monotonically increasing counter
# - Unaffected by system time adjustments
# - Only moves forward, never backward
# - Good for measuring time intervals
```

**2. How to implement high-precision performance measurement?**

```python
import time

# Use perf_counter for highest precision
start = time.perf_counter()
# Execute code
elapsed = time.perf_counter() - start

# For nanosecond precision
start_ns = time.perf_counter_ns()
# Execute code
elapsed_ns = time.perf_counter_ns() - start_ns
```

**3. What about time.sleep() precision? Any alternatives?**

```python
import time

# sleep precision depends on OS scheduling
# Windows: ~10-15ms
# Linux/macOS: ~1ms

# High-precision alternative: busy-wait
def precise_sleep(duration):
    end = time.perf_counter() + duration
    while time.perf_counter() < end:
        pass

# Hybrid approach
def hybrid_sleep(duration, precision=0.001):
    end = time.perf_counter() + duration
    if duration > precision * 2:
        time.sleep(duration - precision)
    while time.perf_counter() < end:
        pass
```

**4. How to convert between struct_time and timestamps?**

```python
import time
import calendar

# timestamp -> struct_time
ts = time.time()
local_st = time.localtime(ts)  # Local time
utc_st = time.gmtime(ts)       # UTC time

# struct_time -> timestamp
ts_from_local = time.mktime(local_st)      # Local struct_time
ts_from_utc = calendar.timegm(utc_st)      # UTC struct_time
```

**5. How to handle timezones?**

```python
import time
import os

# Get timezone information
print(time.timezone)   # UTC offset in seconds
print(time.tzname)     # Timezone names

# Set timezone (Unix)
os.environ['TZ'] = 'Asia/Shanghai'
time.tzset()

# Recommendation: Use datetime module or pytz for timezone handling
```

### Coding Exercise

**Implement a simple benchmarking framework**

```python
import time
from functools import wraps
import statistics

def benchmark(iterations=1000, warmup=100):
    """Benchmark decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Warmup
            for _ in range(warmup):
                func(*args, **kwargs)

            # Actual benchmarking
            times = []
            for _ in range(iterations):
                start = time.perf_counter_ns()
                func(*args, **kwargs)
                end = time.perf_counter_ns()
                times.append(end - start)

            # Statistics
            avg = statistics.mean(times)
            median = statistics.median(times)
            stdev = statistics.stdev(times) if len(times) > 1 else 0

            print(f"\n{func.__name__} Benchmark Results:")
            print(f"  Iterations: {iterations}")
            print(f"  Average: {avg:.2f} ns")
            print(f"  Median: {median:.2f} ns")
            print(f"  Std Dev: {stdev:.2f} ns")
            print(f"  Min: {min(times)} ns")
            print(f"  Max: {max(times)} ns")

            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage examples
@benchmark(iterations=10000)
def test_list_append():
    lst = []
    for i in range(100):
        lst.append(i)

@benchmark(iterations=10000)
def test_list_comprehension():
    lst = [i for i in range(100)]

test_list_append()
test_list_comprehension()
```

---

## Further Reading

### Official Documentation

- [time Module Official Documentation](https://docs.python.org/3/library/time.html)
- [datetime Module Official Documentation](https://docs.python.org/3/library/datetime.html)
- [PEP 564 -- Add new time functions with nanosecond precision](https://www.python.org/dev/peps/pep-0564/)

### Related Modules

- **datetime**: Higher-level date and time handling
- **calendar**: Calendar-related functionality
- **timeit**: Code timing utility
- **sched**: Event scheduler
- **pytz**: Third-party timezone library
- **dateutil**: Powerful date parsing library

### Advanced Topics

- **Clock Synchronization**: NTP protocol and clock drift
- **High-Precision Timing**: Hardware counters and HPET
- **Real-Time Systems**: Deterministic latency and jitter
- **Distributed Time**: Lamport clocks and vector clocks

---

## Summary

### Function Selection Guide

| Scenario | Recommended Function |
|----------|---------------------|
| Get current time point | `time.time()` |
| Measure code execution | `time.perf_counter()` |
| Implement timeout | `time.monotonic()` |
| Analyze CPU time | `time.process_time()` |
| Program sleep | `time.sleep()` |
| Format time | `time.strftime()` |
| Parse time | `time.strptime()` |

### Best Practices Summary

1. **Use perf_counter() for performance measurement**: It provides the highest precision
2. **Use monotonic() for timeout mechanisms**: Unaffected by system time adjustments
3. **Store timestamps for persistence**: Universal across timezones and systems
4. **Use strftime() for display**: Supports various formats
5. **Be aware of sleep precision**: Actual sleep time may be longer
6. **Handle timezones carefully**: Consider using datetime + pytz

The `time` module is fundamental to Python's time handling capabilities. Understanding its principles and proper usage patterns is essential for writing high-quality Python code. For everyday business development, it can be combined with the `datetime` module; for performance-sensitive scenarios, you need to understand the characteristics of different clock types.
