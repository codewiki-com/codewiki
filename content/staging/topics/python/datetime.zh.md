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
origin: old/src/content/docs/python/datetime.zh.md
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

`datetime` 模块是 Python 标准库中处理日期和时间的核心模块。无论是记录日志时间戳、计算时间差、处理时区转换，还是格式化日期显示，datetime 模块都能提供强大而灵活的支持。

## 模块概览

```python
from datetime import (
    date,           # 日期类（年、月、日）
    time,           # 时间类（时、分、秒、微秒）
    datetime,       # 日期时间类（日期 + 时间）
    timedelta,      # 时间差类
    timezone,       # 时区类
    tzinfo,         # 时区信息抽象基类
)
import calendar      # 日历相关功能
```

---

## date - 日期类

`date` 类用于处理只包含年、月、日的日期，不涉及时间信息。

### 创建日期对象

```python
from datetime import date

# 通过指定年月日创建
d = date(2026, 1, 7)
print(d)  # 2026-01-07

# 获取今天的日期
today = date.today()
print(today)  # 2026-01-07

# 从时间戳创建（Unix 时间戳）
d_from_timestamp = date.fromtimestamp(1736236800)
print(d_from_timestamp)  # 2025-01-07

# 从 ISO 格式字符串创建
d_from_iso = date.fromisoformat('2026-01-07')
print(d_from_iso)  # 2026-01-07

# 从序数创建（从公元1年1月1日算起的天数）
d_from_ordinal = date.fromordinal(738892)
print(d_from_ordinal)  # 2023-01-01
```

### 访问日期属性

```python
from datetime import date

d = date(2026, 1, 7)

# 基本属性
print(d.year)   # 2026
print(d.month)  # 1
print(d.day)    # 7

# 星期几（0=周一，6=周日）
print(d.weekday())  # 2（周三）

# 星期几（1=周一，7=周日）
print(d.isoweekday())  # 3（周三）

# ISO 日历（年、周数、星期几）
print(d.isocalendar())  # (2026, 2, 3)

# 转换为序数
print(d.toordinal())  # 739462
```

### 日期方法

```python
from datetime import date

d = date(2026, 1, 7)

# 转换为 ISO 格式字符串
print(d.isoformat())  # '2026-01-07'

# 格式化输出
print(d.strftime('%Y年%m月%d日'))  # '2026年01月07日'
print(d.strftime('%A, %B %d, %Y'))  # 'Wednesday, January 07, 2026'

# 替换日期部分
new_date = d.replace(year=2027, month=6)
print(new_date)  # 2027-06-07

# 返回 time.struct_time
print(d.timetuple())
```

---

## time - 时间类

`time` 类用于处理只包含时、分、秒、微秒的时间，不涉及日期信息。

### 创建时间对象

```python
from datetime import time

# 基本创建
t = time(14, 30, 45)
print(t)  # 14:30:45

# 包含微秒
t_micro = time(14, 30, 45, 123456)
print(t_micro)  # 14:30:45.123456

# 从 ISO 格式字符串创建
t_from_iso = time.fromisoformat('14:30:45')
print(t_from_iso)  # 14:30:45

# 最小和最大时间
print(time.min)  # 00:00:00
print(time.max)  # 23:59:59.999999
```

### 访问时间属性

```python
from datetime import time

t = time(14, 30, 45, 123456)

print(t.hour)        # 14
print(t.minute)      # 30
print(t.second)      # 45
print(t.microsecond) # 123456

# 时区信息（无时区时为 None）
print(t.tzinfo)      # None
```

### 时间方法

```python
from datetime import time

t = time(14, 30, 45)

# 转换为 ISO 格式
print(t.isoformat())  # '14:30:45'

# 格式化输出
print(t.strftime('%H:%M:%S'))    # '14:30:45'
print(t.strftime('%I:%M %p'))    # '02:30 PM'

# 替换时间部分
new_time = t.replace(hour=16, minute=0)
print(new_time)  # 16:00:45
```

---

## datetime - 日期时间类

`datetime` 类是 `date` 和 `time` 的组合，包含完整的日期和时间信息。这是最常用的类。

### 创建 datetime 对象

```python
from datetime import datetime

# 指定年月日时分秒
dt = datetime(2026, 1, 7, 14, 30, 45)
print(dt)  # 2026-01-07 14:30:45

# 包含微秒
dt_micro = datetime(2026, 1, 7, 14, 30, 45, 123456)
print(dt_micro)  # 2026-01-07 14:30:45.123456

# 获取当前日期时间
now = datetime.now()
print(now)  # 2026-01-07 15:30:00.123456

# 获取 UTC 当前时间（推荐使用 timezone.utc）
from datetime import timezone
utc_now = datetime.now(timezone.utc)
print(utc_now)  # 2026-01-07 07:30:00.123456+00:00

# 从时间戳创建
dt_from_ts = datetime.fromtimestamp(1736236800)
print(dt_from_ts)  # 2025-01-07 08:00:00

# UTC 时间戳
dt_utc = datetime.fromtimestamp(1736236800, tz=timezone.utc)
print(dt_utc)  # 2025-01-07 08:00:00+00:00

# 从 ISO 格式字符串创建
dt_from_iso = datetime.fromisoformat('2026-01-07T14:30:45')
print(dt_from_iso)  # 2026-01-07 14:30:45

# 组合 date 和 time
from datetime import date, time
d = date(2026, 1, 7)
t = time(14, 30, 45)
dt_combined = datetime.combine(d, t)
print(dt_combined)  # 2026-01-07 14:30:45
```

### 访问 datetime 属性

```python
from datetime import datetime

dt = datetime(2026, 1, 7, 14, 30, 45, 123456)

# 日期属性
print(dt.year)        # 2026
print(dt.month)       # 1
print(dt.day)         # 7

# 时间属性
print(dt.hour)        # 14
print(dt.minute)      # 30
print(dt.second)      # 45
print(dt.microsecond) # 123456

# 获取日期部分
print(dt.date())  # 2026-01-07

# 获取时间部分
print(dt.time())  # 14:30:45.123456

# 星期几
print(dt.weekday())     # 2（周三）
print(dt.isoweekday())  # 3（周三）
```

### datetime 方法

```python
from datetime import datetime, timezone

dt = datetime(2026, 1, 7, 14, 30, 45)

# 转换为 ISO 格式
print(dt.isoformat())        # '2026-01-07T14:30:45'
print(dt.isoformat(' '))     # '2026-01-07 14:30:45'
print(dt.isoformat(sep='T', timespec='seconds'))  # '2026-01-07T14:30:45'

# 转换为时间戳
print(dt.timestamp())  # 1736234445.0

# 替换部分值
new_dt = dt.replace(year=2027, hour=10)
print(new_dt)  # 2027-01-07 10:30:45

# 格式化输出
print(dt.strftime('%Y-%m-%d %H:%M:%S'))  # '2026-01-07 14:30:45'
print(dt.strftime('%Y年%m月%d日 %H时%M分%S秒'))  # '2026年01月07日 14时30分45秒'
```

---

## timedelta - 时间差

`timedelta` 表示两个日期或时间之间的差值，用于日期时间的加减运算。

### 创建 timedelta 对象

```python
from datetime import timedelta

# 各种时间单位
delta1 = timedelta(days=5)
delta2 = timedelta(hours=12)
delta3 = timedelta(minutes=30)
delta4 = timedelta(seconds=45)
delta5 = timedelta(milliseconds=500)
delta6 = timedelta(microseconds=1000)
delta7 = timedelta(weeks=2)

# 组合多个单位
delta = timedelta(days=5, hours=3, minutes=30, seconds=45)
print(delta)  # 5 days, 3:30:45

# 负时间差
negative_delta = timedelta(days=-1)
print(negative_delta)  # -1 day, 0:00:00
```

### timedelta 属性和方法

```python
from datetime import timedelta

delta = timedelta(days=5, hours=3, minutes=30, seconds=45)

# 属性（只有这三个）
print(delta.days)         # 5
print(delta.seconds)      # 12645（3小时30分45秒 = 12645秒）
print(delta.microseconds) # 0

# 总秒数
print(delta.total_seconds())  # 444645.0

# 最大最小值
print(timedelta.min)  # -999999999 days, 0:00:00
print(timedelta.max)  # 999999999 days, 23:59:59.999999
print(timedelta.resolution)  # 0:00:00.000001
```

### 日期时间运算

```python
from datetime import datetime, timedelta, date

# datetime 加减 timedelta
now = datetime(2026, 1, 7, 14, 30)
future = now + timedelta(days=7, hours=5)
print(future)  # 2026-01-14 19:30:00

past = now - timedelta(weeks=2)
print(past)  # 2025-12-24 14:30:00

# date 加减 timedelta
today = date(2026, 1, 7)
next_week = today + timedelta(weeks=1)
print(next_week)  # 2026-01-14

# 两个 datetime 相减得到 timedelta
dt1 = datetime(2026, 1, 7, 14, 30)
dt2 = datetime(2026, 1, 1, 10, 0)
diff = dt1 - dt2
print(diff)  # 6 days, 4:30:00
print(diff.total_seconds())  # 536100.0

# timedelta 运算
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

### 实用计算示例

```python
from datetime import datetime, timedelta, date

# 计算年龄
def calculate_age(birth_date):
    today = date.today()
    age = today.year - birth_date.year
    # 检查今年是否已过生日
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

birth = date(1990, 6, 15)
print(f"年龄: {calculate_age(birth)} 岁")

# 计算工作日
def add_business_days(start_date, num_days):
    current = start_date
    added = 0
    while added < num_days:
        current += timedelta(days=1)
        if current.weekday() < 5:  # 周一到周五
            added += 1
    return current

start = date(2026, 1, 7)  # 周三
result = add_business_days(start, 5)
print(f"5个工作日后: {result}")  # 2026-01-14

# 计算两个日期之间的天数
def days_between(date1, date2):
    return abs((date2 - date1).days)

d1 = date(2026, 1, 1)
d2 = date(2026, 12, 31)
print(f"2026年共有 {days_between(d1, d2)} 天")  # 364

# 获取本月第一天和最后一天
def get_month_range(dt):
    first_day = dt.replace(day=1)
    # 下个月第一天减一天
    if dt.month == 12:
        last_day = dt.replace(year=dt.year+1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = dt.replace(month=dt.month+1, day=1) - timedelta(days=1)
    return first_day, last_day

first, last = get_month_range(date(2026, 2, 15))
print(f"2026年2月: {first} 到 {last}")  # 2026-02-01 到 2026-02-28
```

---

## timezone - 时区处理

Python 3.2+ 提供了 `timezone` 类用于处理时区。理解时区对于处理跨地区的时间数据至关重要。

### 基本时区操作

```python
from datetime import datetime, timezone, timedelta

# UTC 时区
utc = timezone.utc
utc_now = datetime.now(utc)
print(utc_now)  # 2026-01-07 06:30:00+00:00

# 创建固定偏移时区
# 东八区（北京时间）
beijing_tz = timezone(timedelta(hours=8))
beijing_time = datetime.now(beijing_tz)
print(beijing_time)  # 2026-01-07 14:30:00+08:00

# 西五区（美东时间）
eastern_tz = timezone(timedelta(hours=-5))
eastern_time = datetime.now(eastern_tz)
print(eastern_time)  # 2026-01-07 01:30:00-05:00

# 带时区名称
beijing_tz_named = timezone(timedelta(hours=8), name='CST')
dt_named = datetime.now(beijing_tz_named)
print(dt_named.tzname())  # 'CST'
```

### Naive 与 Aware datetime

```python
from datetime import datetime, timezone, timedelta

# Naive datetime（无时区信息）
naive_dt = datetime(2026, 1, 7, 14, 30)
print(naive_dt.tzinfo)  # None
print(naive_dt)  # 2026-01-07 14:30:00

# Aware datetime（有时区信息）
aware_dt = datetime(2026, 1, 7, 14, 30, tzinfo=timezone.utc)
print(aware_dt.tzinfo)  # UTC
print(aware_dt)  # 2026-01-07 14:30:00+00:00

# 检查是否有时区信息
def is_aware(dt):
    return dt.tzinfo is not None and dt.tzinfo.utcoffset(dt) is not None

print(is_aware(naive_dt))  # False
print(is_aware(aware_dt))  # True
```

### 时区转换

```python
from datetime import datetime, timezone, timedelta

# 创建带时区的 datetime
utc_tz = timezone.utc
beijing_tz = timezone(timedelta(hours=8))
tokyo_tz = timezone(timedelta(hours=9))

# UTC 时间
utc_time = datetime(2026, 1, 7, 6, 30, tzinfo=utc_tz)
print(f"UTC: {utc_time}")  # UTC: 2026-01-07 06:30:00+00:00

# 转换到北京时间
beijing_time = utc_time.astimezone(beijing_tz)
print(f"北京: {beijing_time}")  # 北京: 2026-01-07 14:30:00+08:00

# 转换到东京时间
tokyo_time = utc_time.astimezone(tokyo_tz)
print(f"东京: {tokyo_time}")  # 东京: 2026-01-07 15:30:00+09:00

# 为 naive datetime 添加时区信息（假设它是某个时区的本地时间）
naive_dt = datetime(2026, 1, 7, 14, 30)
aware_dt = naive_dt.replace(tzinfo=beijing_tz)
print(aware_dt)  # 2026-01-07 14:30:00+08:00

# 转换为 UTC
utc_result = aware_dt.astimezone(utc_tz)
print(utc_result)  # 2026-01-07 06:30:00+00:00
```

---

## strftime 和 strptime - 格式化

`strftime` 将 datetime 对象格式化为字符串，`strptime` 将字符串解析为 datetime 对象。

### 格式化代码表

| 代码 | 含义 | 示例 |
|------|------|------|
| `%Y` | 四位年份 | 2026 |
| `%y` | 两位年份 | 26 |
| `%m` | 月份（补零） | 01-12 |
| `%d` | 日期（补零） | 01-31 |
| `%H` | 小时（24小时制） | 00-23 |
| `%I` | 小时（12小时制） | 01-12 |
| `%M` | 分钟 | 00-59 |
| `%S` | 秒 | 00-59 |
| `%f` | 微秒 | 000000-999999 |
| `%p` | AM/PM | AM, PM |
| `%A` | 星期全名 | Wednesday |
| `%a` | 星期缩写 | Wed |
| `%B` | 月份全名 | January |
| `%b` | 月份缩写 | Jan |
| `%j` | 年中第几天 | 001-366 |
| `%U` | 年中第几周（周日开始） | 00-53 |
| `%W` | 年中第几周（周一开始） | 00-53 |
| `%w` | 星期几（0=周日） | 0-6 |
| `%z` | UTC 偏移 | +0800 |
| `%Z` | 时区名称 | CST, UTC |
| `%%` | 字面 % | % |

### strftime - 格式化输出

```python
from datetime import datetime

dt = datetime(2026, 1, 7, 14, 30, 45)

# 常用格式
print(dt.strftime('%Y-%m-%d'))           # '2026-01-07'
print(dt.strftime('%Y/%m/%d'))           # '2026/01/07'
print(dt.strftime('%d/%m/%Y'))           # '07/01/2026'
print(dt.strftime('%Y-%m-%d %H:%M:%S'))  # '2026-01-07 14:30:45'
print(dt.strftime('%H:%M:%S'))           # '14:30:45'
print(dt.strftime('%I:%M %p'))           # '02:30 PM'

# 中文格式
print(dt.strftime('%Y年%m月%d日'))        # '2026年01月07日'
print(dt.strftime('%Y年%m月%d日 %H时%M分%S秒'))  # '2026年01月07日 14时30分45秒'

# 英文格式
print(dt.strftime('%A, %B %d, %Y'))      # 'Wednesday, January 07, 2026'
print(dt.strftime('%b %d, %Y'))          # 'Jan 07, 2026'

# ISO 格式
print(dt.strftime('%Y-%m-%dT%H:%M:%S'))  # '2026-01-07T14:30:45'

# 日志格式
print(dt.strftime('[%Y-%m-%d %H:%M:%S]'))  # '[2026-01-07 14:30:45]'
```

### strptime - 解析字符串

```python
from datetime import datetime

# 基本解析
dt1 = datetime.strptime('2026-01-07', '%Y-%m-%d')
print(dt1)  # 2026-01-07 00:00:00

dt2 = datetime.strptime('2026-01-07 14:30:45', '%Y-%m-%d %H:%M:%S')
print(dt2)  # 2026-01-07 14:30:45

# 解析各种格式
dt3 = datetime.strptime('07/01/2026', '%d/%m/%Y')
print(dt3)  # 2026-01-07 00:00:00

dt4 = datetime.strptime('January 7, 2026', '%B %d, %Y')
print(dt4)  # 2026-01-07 00:00:00

dt5 = datetime.strptime('2026年01月07日', '%Y年%m月%d日')
print(dt5)  # 2026-01-07 00:00:00

dt6 = datetime.strptime('02:30 PM', '%I:%M %p')
print(dt6)  # 1900-01-01 14:30:00

# 解析带微秒
dt7 = datetime.strptime('2026-01-07 14:30:45.123456', '%Y-%m-%d %H:%M:%S.%f')
print(dt7)  # 2026-01-07 14:30:45.123456

# 解析 ISO 格式（推荐使用 fromisoformat）
dt8 = datetime.fromisoformat('2026-01-07T14:30:45+08:00')
print(dt8)  # 2026-01-07 14:30:45+08:00
```

### 处理解析错误

```python
from datetime import datetime

def safe_parse_date(date_string, format_string):
    """安全解析日期字符串"""
    try:
        return datetime.strptime(date_string, format_string)
    except ValueError as e:
        print(f"解析错误: {e}")
        return None

# 正确格式
result = safe_parse_date('2026-01-07', '%Y-%m-%d')
print(result)  # 2026-01-07 00:00:00

# 错误格式
result = safe_parse_date('01-07-2026', '%Y-%m-%d')
# 解析错误: time data '01-07-2026' does not match format '%Y-%m-%d'

# 尝试多种格式
def parse_flexible_date(date_string):
    """尝试多种格式解析日期"""
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
    raise ValueError(f"无法解析日期: {date_string}")

print(parse_flexible_date('2026-01-07'))    # 2026-01-07 00:00:00
print(parse_flexible_date('07/01/2026'))    # 2026-01-07 00:00:00
print(parse_flexible_date('2026年01月07日'))  # 2026-01-07 00:00:00
```

---

## pytz - 第三方时区库

`pytz` 是处理时区的标准第三方库，提供了完整的 IANA 时区数据库支持，包括历史时区变化和夏令时。

### 安装

```bash
pip install pytz
```

### 基本用法

```python
import pytz
from datetime import datetime

# 查看所有可用时区
print(len(pytz.all_timezones))  # 500+
print(pytz.all_timezones[:5])
# ['Africa/Abidjan', 'Africa/Accra', 'Africa/Addis_Ababa', ...]

# 常用时区
print(pytz.timezone('Asia/Shanghai'))    # 北京时间
print(pytz.timezone('Asia/Tokyo'))       # 东京时间
print(pytz.timezone('America/New_York')) # 纽约时间
print(pytz.timezone('Europe/London'))    # 伦敦时间
print(pytz.timezone('UTC'))              # UTC

# 获取带时区的当前时间
utc = pytz.UTC
now_utc = datetime.now(utc)
print(now_utc)  # 2026-01-07 06:30:00+00:00

# 创建特定时区的时间
beijing_tz = pytz.timezone('Asia/Shanghai')
now_beijing = datetime.now(beijing_tz)
print(now_beijing)  # 2026-01-07 14:30:00.123456+08:00
```

### 时区转换

```python
import pytz
from datetime import datetime

# 定义时区
utc = pytz.UTC
beijing = pytz.timezone('Asia/Shanghai')
new_york = pytz.timezone('America/New_York')
tokyo = pytz.timezone('Asia/Tokyo')

# 创建 UTC 时间
utc_time = datetime(2026, 1, 7, 6, 30, tzinfo=utc)
print(f"UTC: {utc_time}")

# 转换到其他时区
beijing_time = utc_time.astimezone(beijing)
print(f"北京: {beijing_time}")  # 2026-01-07 14:30:00+08:00

new_york_time = utc_time.astimezone(new_york)
print(f"纽约: {new_york_time}")  # 2026-01-07 01:30:00-05:00

tokyo_time = utc_time.astimezone(tokyo)
print(f"东京: {tokyo_time}")  # 2026-01-07 15:30:00+09:00
```

### 本地化 naive datetime

```python
import pytz
from datetime import datetime

beijing = pytz.timezone('Asia/Shanghai')

# 错误方式：直接使用 replace（不处理夏令时）
naive_dt = datetime(2026, 1, 7, 14, 30)
wrong_dt = naive_dt.replace(tzinfo=beijing)  # 不推荐！

# 正确方式：使用 localize（推荐）
correct_dt = beijing.localize(naive_dt)
print(correct_dt)  # 2026-01-07 14:30:00+08:00

# 处理夏令时（美国时间为例）
eastern = pytz.timezone('America/New_York')

# 夏令时期间
summer_dt = datetime(2026, 7, 15, 14, 0)
summer_aware = eastern.localize(summer_dt)
print(summer_aware)  # 2026-07-15 14:00:00-04:00（EDT，夏令时）

# 非夏令时期间
winter_dt = datetime(2026, 1, 15, 14, 0)
winter_aware = eastern.localize(winter_dt)
print(winter_aware)  # 2026-01-15 14:00:00-05:00（EST，标准时）
```

### 处理夏令时边界

```python
import pytz
from datetime import datetime

eastern = pytz.timezone('America/New_York')

# 夏令时开始时（2026年3月8日 2:00 AM）
# 时钟从 2:00 跳到 3:00，中间的时间不存在

# 模糊时间处理
try:
    ambiguous_dt = datetime(2026, 11, 1, 1, 30)  # 夏令时结束时的模糊时间
    # is_dst 参数指定是否为夏令时
    dst_time = eastern.localize(ambiguous_dt, is_dst=True)
    std_time = eastern.localize(ambiguous_dt, is_dst=False)
    print(f"夏令时: {dst_time}")  # -04:00
    print(f"标准时: {std_time}")  # -05:00
except pytz.AmbiguousTimeError as e:
    print(f"模糊时间: {e}")

# 不存在的时间处理
try:
    nonexistent = datetime(2026, 3, 8, 2, 30)
    eastern.localize(nonexistent, is_dst=None)
except pytz.NonExistentTimeError as e:
    print(f"不存在的时间: {e}")
```

---

## dateutil - 强大的日期处理库

`python-dateutil` 是另一个流行的第三方库，提供了更灵活的日期解析和相对时间计算功能。

### 安装

```bash
pip install python-dateutil
```

### 智能日期解析

```python
from dateutil import parser

# 自动解析各种格式（无需指定格式字符串）
dt1 = parser.parse('2026-01-07')
print(dt1)  # 2026-01-07 00:00:00

dt2 = parser.parse('January 7, 2026')
print(dt2)  # 2026-01-07 00:00:00

dt3 = parser.parse('7/1/2026')
print(dt3)  # 2026-07-01 00:00:00（美国格式）

dt4 = parser.parse('7/1/2026', dayfirst=True)
print(dt4)  # 2026-01-07 00:00:00（日在前）

dt5 = parser.parse('Wed, Jan 7, 2026 2:30 PM')
print(dt5)  # 2026-01-07 14:30:00

dt6 = parser.parse('2026-01-07T14:30:45+08:00')
print(dt6)  # 2026-01-07 14:30:45+08:00

# 解析模糊日期
dt7 = parser.parse('next wednesday')  # 需要额外设置
dt8 = parser.parse('3rd of January 2026')
print(dt8)  # 2026-01-03 00:00:00
```

### relativedelta - 相对时间差

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

now = datetime(2026, 1, 7, 14, 30)

# 加减年月日
future = now + relativedelta(years=1, months=2, days=15)
print(future)  # 2027-03-22 14:30:00

past = now - relativedelta(years=2, months=6)
print(past)  # 2023-07-07 14:30:00

# 设置绝对值
specific = now + relativedelta(day=1, hour=0, minute=0, second=0)
print(specific)  # 2026-01-01 00:00:00（本月第一天零点）

# 获取下个月的同一天
next_month = now + relativedelta(months=1)
print(next_month)  # 2026-02-07 14:30:00

# 获取上个月最后一天
last_day = now + relativedelta(day=31)  # day=31 会自动调整
print(last_day)  # 2026-01-31 14:30:00

# 使用星期
from dateutil.relativedelta import MO, TU, WE, TH, FR, SA, SU

# 下一个周五
next_friday = now + relativedelta(weekday=FR)
print(next_friday)  # 2026-01-09 14:30:00

# 上一个周一
last_monday = now + relativedelta(weekday=MO(-1))
print(last_monday)  # 2026-01-05 14:30:00

# 本月第三个周四
third_thursday = now + relativedelta(day=1, weekday=TH(3))
print(third_thursday)  # 2026-01-15 14:30:00
```

### 计算两个日期的差异

```python
from datetime import datetime
from dateutil.relativedelta import relativedelta

birth_date = datetime(1990, 6, 15)
today = datetime(2026, 1, 7)

# 计算精确年龄
diff = relativedelta(today, birth_date)
print(f"年龄: {diff.years}年{diff.months}月{diff.days}天")
# 年龄: 35年6月22天

# 访问差异的各个部分
print(f"相差 {diff.years} 年")
print(f"相差 {diff.months} 月（不计年）")
print(f"相差 {diff.days} 天（不计年月）")
```

### rrule - 循环规则

```python
from datetime import datetime
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, MO, TU, WE, TH, FR

start = datetime(2026, 1, 1)

# 每天，共5次
daily = list(rrule(DAILY, count=5, dtstart=start))
print(daily)
# [datetime(2026, 1, 1), datetime(2026, 1, 2), ...]

# 每周一、三、五
weekdays = list(rrule(WEEKLY, count=6, byweekday=(MO, WE, FR), dtstart=start))
for dt in weekdays:
    print(dt.strftime('%Y-%m-%d %A'))

# 每月15号
monthly = list(rrule(MONTHLY, count=6, bymonthday=15, dtstart=start))
for dt in monthly:
    print(dt.strftime('%Y-%m-%d'))

# 工作日（周一到周五）
from dateutil.rrule import rruleset, rrule, DAILY

def get_business_days(start, end):
    rr = rrule(DAILY, dtstart=start, until=end, byweekday=(MO, TU, WE, TH, FR))
    return list(rr)

business_days = get_business_days(datetime(2026, 1, 1), datetime(2026, 1, 15))
print(f"工作日数量: {len(business_days)}")
```

---

## calendar 模块

`calendar` 模块提供了日历相关的功能。

### 基本用法

```python
import calendar

# 判断闰年
print(calendar.isleap(2024))  # True
print(calendar.isleap(2026))  # False

# 计算闰年数量
print(calendar.leapdays(2000, 2026))  # 7

# 获取某月的天数
print(calendar.monthrange(2026, 2))  # (6, 28)
# 返回 (该月第一天是星期几, 该月天数)

# 获取某月的日历
print(calendar.month(2026, 1))
#     January 2026
# Mo Tu We Th Fr Sa Su
#           1  2  3  4
#  5  6  7  8  9 10 11
# ...

# 获取整年日历
print(calendar.calendar(2026))
```

### 实用函数

```python
import calendar
from datetime import date

# 获取某月所有天
def get_month_days(year, month):
    _, num_days = calendar.monthrange(year, month)
    return [date(year, month, day) for day in range(1, num_days + 1)]

january_2026 = get_month_days(2026, 1)
print(f"2026年1月共 {len(january_2026)} 天")

# 获取某月所有周一
def get_mondays(year, month):
    days = get_month_days(year, month)
    return [d for d in days if d.weekday() == 0]

mondays = get_mondays(2026, 1)
print(f"2026年1月的周一: {mondays}")

# 判断某天是否是工作日
def is_business_day(d):
    return d.weekday() < 5

print(is_business_day(date(2026, 1, 7)))  # True（周三）
print(is_business_day(date(2026, 1, 11))) # False（周日）
```

### HTMLCalendar 和 TextCalendar

```python
import calendar

# 文本日历
tc = calendar.TextCalendar(firstweekday=0)  # 周一开始
print(tc.formatmonth(2026, 1))

# HTML 日历
hc = calendar.HTMLCalendar(firstweekday=0)
html = hc.formatmonth(2026, 1)
print(html)  # HTML 格式的日历

# 自定义日历
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

## 常见模式和最佳实践

### 获取当前时间的各种方式

```python
from datetime import datetime, date, time, timezone
import time as time_module

# 当前本地日期时间
now = datetime.now()
print(f"本地时间: {now}")

# 当前 UTC 时间（推荐方式）
utc_now = datetime.now(timezone.utc)
print(f"UTC时间: {utc_now}")

# 当前日期
today = date.today()
print(f"今天: {today}")

# Unix 时间戳
timestamp = time_module.time()
print(f"时间戳: {timestamp}")

# 从时间戳创建
dt_from_ts = datetime.fromtimestamp(timestamp)
print(f"从时间戳: {dt_from_ts}")
```

### 日期时间比较

```python
from datetime import datetime, date, timedelta

dt1 = datetime(2026, 1, 7, 14, 30)
dt2 = datetime(2026, 1, 8, 10, 0)

# 比较运算
print(dt1 < dt2)   # True
print(dt1 > dt2)   # False
print(dt1 == dt2)  # False
print(dt1 != dt2)  # True
print(dt1 <= dt2)  # True
print(dt1 >= dt2)  # False

# 检查日期范围
start = datetime(2026, 1, 1)
end = datetime(2026, 12, 31)
check = datetime(2026, 6, 15)

if start <= check <= end:
    print("日期在范围内")

# 检查是否是今天
def is_today(dt):
    return dt.date() == date.today()

print(is_today(datetime.now()))  # True

# 检查是否过期
def is_expired(expiry_date):
    return expiry_date < date.today()

print(is_expired(date(2025, 12, 31)))  # True
```

### 日期时间序列化

```python
from datetime import datetime, timezone
import json

dt = datetime(2026, 1, 7, 14, 30, 45, tzinfo=timezone.utc)

# ISO 格式（推荐用于 API）
iso_string = dt.isoformat()
print(iso_string)  # '2026-01-07T14:30:45+00:00'

# 从 ISO 格式解析
parsed = datetime.fromisoformat(iso_string)
print(parsed)  # 2026-01-07 14:30:45+00:00

# 时间戳（用于存储）
timestamp = dt.timestamp()
print(timestamp)  # 1736260245.0

# JSON 序列化
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

data = {'created_at': dt, 'name': 'test'}
json_str = json.dumps(data, cls=DateTimeEncoder)
print(json_str)  # '{"created_at": "2026-01-07T14:30:45+00:00", "name": "test"}'

# JSON 反序列化
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

### 数据库日期处理

```python
from datetime import datetime, timezone
import sqlite3

# SQLite 日期时间存储
conn = sqlite3.connect(':memory:')
cursor = conn.cursor()

# 创建表
cursor.execute('''
    CREATE TABLE events (
        id INTEGER PRIMARY KEY,
        name TEXT,
        created_at TEXT,
        event_date TEXT
    )
''')

# 存储日期时间（使用 ISO 格式）
now = datetime.now(timezone.utc)
cursor.execute(
    'INSERT INTO events (name, created_at, event_date) VALUES (?, ?, ?)',
    ('会议', now.isoformat(), '2026-01-15')
)
conn.commit()

# 查询并解析
cursor.execute('SELECT * FROM events')
row = cursor.fetchone()
created_at = datetime.fromisoformat(row[2])
print(f"创建时间: {created_at}")

# 日期范围查询
start = '2026-01-01'
end = '2026-01-31'
cursor.execute(
    'SELECT * FROM events WHERE event_date BETWEEN ? AND ?',
    (start, end)
)
```

### 性能优化技巧

```python
from datetime import datetime, date, timedelta
import time

# 避免在循环中重复调用 datetime.now()
# 不好的做法
def process_items_slow(items):
    for item in items:
        item['processed_at'] = datetime.now()  # 每次都调用

# 好的做法
def process_items_fast(items):
    now = datetime.now()  # 只调用一次
    for item in items:
        item['processed_at'] = now

# 缓存 strptime 格式
from functools import lru_cache

@lru_cache(maxsize=128)
def cached_strptime(date_string, format_string):
    return datetime.strptime(date_string, format_string)

# 批量日期操作使用生成器
def date_range(start, end):
    """生成日期范围（内存高效）"""
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)

# 使用
for d in date_range(date(2026, 1, 1), date(2026, 1, 31)):
    print(d)
```

---

## 实战案例

### 日志时间戳处理

```python
from datetime import datetime, timezone
import logging

class ISOFormatter(logging.Formatter):
    """使用 ISO 格式时间戳的日志格式化器"""

    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, tz=timezone.utc)
        return dt.isoformat()

# 配置日志
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(ISOFormatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)
logger.setLevel(logging.INFO)

logger.info("应用启动")
# 2026-01-07T06:30:45.123456+00:00 - INFO - 应用启动
```

### 定时任务调度

```python
from datetime import datetime, timedelta
import time
import threading

class SimpleScheduler:
    """简单的定时任务调度器"""

    def __init__(self):
        self.tasks = []
        self.running = False

    def schedule(self, func, run_at):
        """安排任务在指定时间运行"""
        self.tasks.append({'func': func, 'run_at': run_at, 'executed': False})

    def schedule_interval(self, func, interval_seconds, times=None):
        """安排任务按间隔重复运行"""
        def wrapper():
            count = 0
            while self.running and (times is None or count < times):
                func()
                count += 1
                time.sleep(interval_seconds)

        thread = threading.Thread(target=wrapper, daemon=True)
        thread.start()

    def run(self):
        """运行调度器"""
        self.running = True
        while self.running:
            now = datetime.now()
            for task in self.tasks:
                if not task['executed'] and now >= task['run_at']:
                    task['func']()
                    task['executed'] = True
            time.sleep(1)

    def stop(self):
        """停止调度器"""
        self.running = False

# 使用示例
def say_hello():
    print(f"Hello at {datetime.now()}")

scheduler = SimpleScheduler()
scheduler.schedule(say_hello, datetime.now() + timedelta(seconds=5))
# scheduler.run()  # 5秒后执行
```

### 时间段统计

```python
from datetime import datetime, timedelta
from collections import defaultdict

class TimeSeriesAnalyzer:
    """时间序列数据分析器"""

    def __init__(self, data):
        """
        data: [(datetime, value), ...]
        """
        self.data = sorted(data, key=lambda x: x[0])

    def group_by_day(self):
        """按天分组"""
        groups = defaultdict(list)
        for dt, value in self.data:
            key = dt.date()
            groups[key].append(value)
        return dict(groups)

    def group_by_hour(self):
        """按小时分组"""
        groups = defaultdict(list)
        for dt, value in self.data:
            key = dt.replace(minute=0, second=0, microsecond=0)
            groups[key].append(value)
        return dict(groups)

    def get_range(self, start, end):
        """获取时间范围内的数据"""
        return [(dt, v) for dt, v in self.data if start <= dt <= end]

    def daily_average(self):
        """计算每日平均值"""
        groups = self.group_by_day()
        return {day: sum(values) / len(values)
                for day, values in groups.items()}

# 使用示例
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

### 会议时间安排

```python
from datetime import datetime, timedelta
from typing import List, Tuple, Optional

class MeetingScheduler:
    """会议时间安排器"""

    def __init__(self, work_start: int = 9, work_end: int = 18):
        self.work_start = work_start
        self.work_end = work_end
        self.meetings: List[Tuple[datetime, datetime]] = []

    def add_meeting(self, start: datetime, end: datetime) -> bool:
        """添加会议"""
        if not self._is_valid_time(start, end):
            return False
        if self._has_conflict(start, end):
            return False
        self.meetings.append((start, end))
        self.meetings.sort(key=lambda x: x[0])
        return True

    def _is_valid_time(self, start: datetime, end: datetime) -> bool:
        """检查时间是否在工作时间内"""
        if start.weekday() >= 5:  # 周末
            return False
        if start.hour < self.work_start or end.hour > self.work_end:
            return False
        return start < end

    def _has_conflict(self, start: datetime, end: datetime) -> bool:
        """检查是否有时间冲突"""
        for meeting_start, meeting_end in self.meetings:
            if not (end <= meeting_start or start >= meeting_end):
                return True
        return False

    def find_free_slots(self, date: datetime, duration_minutes: int) -> List[datetime]:
        """查找某天的空闲时段"""
        slots = []
        day_start = date.replace(hour=self.work_start, minute=0, second=0)
        day_end = date.replace(hour=self.work_end, minute=0, second=0)
        duration = timedelta(minutes=duration_minutes)

        # 获取当天的会议
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

# 使用示例
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
print("60分钟的空闲时段:")
for slot in free_slots:
    print(f"  {slot.strftime('%H:%M')}")
```

---

## 常见问题和解决方案

### 时区处理陷阱

```python
from datetime import datetime, timezone

# 问题：比较 naive 和 aware datetime
naive = datetime(2026, 1, 7, 14, 0)
aware = datetime(2026, 1, 7, 14, 0, tzinfo=timezone.utc)

# 这会抛出 TypeError
# print(naive == aware)

# 解决方案：统一时区处理
def ensure_aware(dt, tz=timezone.utc):
    """确保 datetime 有时区信息"""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=tz)
    return dt

naive_aware = ensure_aware(naive)
print(naive_aware == aware)  # True
```

### 月末日期计算

```python
from datetime import datetime, timedelta
import calendar

def get_last_day_of_month(dt):
    """获取月末日期"""
    _, last_day = calendar.monthrange(dt.year, dt.month)
    return dt.replace(day=last_day)

def add_months(dt, months):
    """安全地添加月份（处理月末边界）"""
    month = dt.month + months
    year = dt.year + (month - 1) // 12
    month = (month - 1) % 12 + 1

    # 处理月末边界
    _, max_day = calendar.monthrange(year, month)
    day = min(dt.day, max_day)

    return dt.replace(year=year, month=month, day=day)

# 测试
dt = datetime(2026, 1, 31)
print(add_months(dt, 1))  # 2026-02-28（不是2月31日！）
print(add_months(dt, 12)) # 2027-01-31
```

### 时间戳精度问题

```python
from datetime import datetime, timezone

# Python timestamp 是浮点数，可能有精度问题
dt = datetime(2026, 1, 7, 14, 30, 45, 123456, tzinfo=timezone.utc)
ts = dt.timestamp()
restored = datetime.fromtimestamp(ts, tz=timezone.utc)

print(dt)       # 2026-01-07 14:30:45.123456+00:00
print(restored) # 可能略有不同

# 解决方案：使用整数毫秒时间戳
def to_timestamp_ms(dt):
    return int(dt.timestamp() * 1000)

def from_timestamp_ms(ts_ms, tz=timezone.utc):
    return datetime.fromtimestamp(ts_ms / 1000, tz=tz)

ts_ms = to_timestamp_ms(dt)
print(ts_ms)  # 1736260245123
```

### 跨时区日期变化

```python
from datetime import datetime, timezone, timedelta
import pytz

# 问题：同一时刻在不同时区可能是不同日期
utc = pytz.UTC
tokyo = pytz.timezone('Asia/Tokyo')
new_york = pytz.timezone('America/New_York')

# UTC 时间：2026-01-07 20:00
utc_time = datetime(2026, 1, 7, 20, 0, tzinfo=utc)

tokyo_time = utc_time.astimezone(tokyo)
ny_time = utc_time.astimezone(new_york)

print(f"UTC: {utc_time.date()}")      # 2026-01-07
print(f"东京: {tokyo_time.date()}")    # 2026-01-08
print(f"纽约: {ny_time.date()}")       # 2026-01-07

# 解决方案：始终存储 UTC，显示时转换
def get_local_date(utc_dt, tz):
    """获取特定时区的本地日期"""
    local_dt = utc_dt.astimezone(tz)
    return local_dt.date()
```

---

## 总结

### 核心类选择指南

| 场景 | 推荐类 |
|------|--------|
| 只需要日期 | `date` |
| 只需要时间 | `time` |
| 日期和时间 | `datetime` |
| 时间差计算 | `timedelta` |
| 固定偏移时区 | `timezone` |
| 复杂时区处理 | `pytz` |
| 灵活日期解析 | `dateutil.parser` |
| 相对时间计算 | `dateutil.relativedelta` |

### 最佳实践总结

1. **始终使用 aware datetime**：避免 naive datetime 带来的时区混乱
2. **内部存储使用 UTC**：统一标准，避免时区转换问题
3. **使用 ISO 格式**：`isoformat()` 和 `fromisoformat()` 是最标准的方式
4. **小心月末边界**：添加月份时注意日期溢出
5. **性能敏感场景**：缓存 `datetime.now()` 的结果
6. **处理夏令时**：使用 `pytz` 的 `localize()` 方法
7. **JSON 序列化**：使用 ISO 格式字符串或时间戳

Python 的 datetime 模块提供了处理日期时间的基础功能，配合 `pytz` 和 `dateutil` 等第三方库，可以优雅地处理各种复杂的日期时间场景。掌握这些工具将使你能够自如地处理任何与时间相关的编程任务。
