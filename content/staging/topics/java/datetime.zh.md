---
title: Java 日期时间 API
description: 掌握 Java 8+ 日期时间 API，包括 LocalDate、LocalTime、ZonedDateTime 和时区处理
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - 日期时间
  - LocalDate
  - 时区
status: imported
origin: old/src/content/docs/java/datetime.zh.md
divergence: 0.158
issues: []
legacy:
  category: Java
  subcategory: API
  order: 25
  lastUpdated: 2026-01-07
---

## 为什么需要新的日期时间 API

在 Java 8 之前，Java 使用 `java.util.Date` 和 `java.util.Calendar` 处理日期时间，但这些类存在诸多问题：

- **可变性**: `Date` 和 `Calendar` 是可变对象，容易被意外修改
- **线程不安全**: `SimpleDateFormat` 不是线程安全的
- **设计混乱**: 月份从 0 开始，年份从 1900 开始计算
- **时区处理困难**: 时区支持不完善

Java 8 引入了全新的 `java.time` 包，基于 Joda-Time 库设计，解决了这些问题。

### 新 API 的优势

- **不可变性**: 所有日期时间类都是不可变的，线程安全
- **清晰的设计**: 方法命名规范，API 直观易用
- **时区支持**: 完善的时区处理能力
- **流畅的 API**: 支持链式调用

## LocalDate - 本地日期

`LocalDate` 表示不带时间和时区的日期，如 `2026-01-07`。

### 创建 LocalDate

```java
import java.time.LocalDate;
import java.time.Month;
import java.time.DayOfWeek;

public class LocalDateCreation {
    public static void main(String[] args) {
        // 获取当前日期
        LocalDate today = LocalDate.now();
        System.out.println("今天: " + today);

        // 使用指定值创建
        LocalDate date1 = LocalDate.of(2026, 1, 7);
        LocalDate date2 = LocalDate.of(2026, Month.JANUARY, 7);
        System.out.println("指定日期: " + date1);

        // 从字符串解析
        LocalDate date3 = LocalDate.parse("2026-01-07");
        System.out.println("解析日期: " + date3);

        // 从年份的第几天创建
        LocalDate date4 = LocalDate.ofYearDay(2026, 100);
        System.out.println("2026年第100天: " + date4);

        // 从 epoch day 创建（1970-01-01 开始计算的天数）
        LocalDate date5 = LocalDate.ofEpochDay(18634);
        System.out.println("Epoch day 18634: " + date5);
    }
}
```

### 获取日期信息

```java
public class LocalDateInfo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2026, 1, 7);

        // 获取年、月、日
        int year = date.getYear();           // 2026
        Month month = date.getMonth();       // JANUARY
        int monthValue = date.getMonthValue(); // 1
        int dayOfMonth = date.getDayOfMonth(); // 7

        // 获取星期几
        DayOfWeek dayOfWeek = date.getDayOfWeek(); // WEDNESDAY
        System.out.println("星期: " + dayOfWeek);

        // 获取年份中的第几天
        int dayOfYear = date.getDayOfYear(); // 7

        // 获取月份天数和年份天数
        int lengthOfMonth = date.lengthOfMonth(); // 31
        int lengthOfYear = date.lengthOfYear();   // 365

        // 判断是否闰年
        boolean isLeapYear = date.isLeapYear(); // false

        System.out.println("年: " + year + ", 月: " + monthValue + ", 日: " + dayOfMonth);
        System.out.println("是否闰年: " + isLeapYear);
    }
}
```

### 日期操作

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

public class LocalDateOperations {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2026, 1, 7);

        // 增加天数、月数、年数
        LocalDate plusDays = date.plusDays(10);      // 2026-01-17
        LocalDate plusWeeks = date.plusWeeks(2);     // 2026-01-21
        LocalDate plusMonths = date.plusMonths(3);   // 2026-04-07
        LocalDate plusYears = date.plusYears(1);     // 2027-01-07

        // 减少天数、月数、年数
        LocalDate minusDays = date.minusDays(7);     // 2025-12-31
        LocalDate minusMonths = date.minusMonths(1); // 2025-12-07

        // 使用 with 方法修改特定字段
        LocalDate withYear = date.withYear(2030);    // 2030-01-07
        LocalDate withMonth = date.withMonth(6);     // 2026-06-07
        LocalDate withDayOfMonth = date.withDayOfMonth(15); // 2026-01-15

        // 使用 TemporalAdjusters 进行复杂调整
        LocalDate firstDayOfMonth = date.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate lastDayOfMonth = date.with(TemporalAdjusters.lastDayOfMonth());
        LocalDate firstDayOfNextMonth = date.with(TemporalAdjusters.firstDayOfNextMonth());
        LocalDate nextMonday = date.with(TemporalAdjusters.next(DayOfWeek.MONDAY));

        System.out.println("本月第一天: " + firstDayOfMonth);
        System.out.println("本月最后一天: " + lastDayOfMonth);
        System.out.println("下月第一天: " + firstDayOfNextMonth);
        System.out.println("下个周一: " + nextMonday);
    }
}
```

### 日期比较

```java
public class LocalDateComparison {
    public static void main(String[] args) {
        LocalDate date1 = LocalDate.of(2026, 1, 7);
        LocalDate date2 = LocalDate.of(2026, 6, 15);
        LocalDate date3 = LocalDate.of(2026, 1, 7);

        // 比较日期
        boolean isBefore = date1.isBefore(date2); // true
        boolean isAfter = date1.isAfter(date2);   // false
        boolean isEqual = date1.isEqual(date3);   // true

        // 使用 compareTo
        int compare = date1.compareTo(date2); // 负数，表示 date1 < date2

        // 计算两个日期之间的天数
        long daysBetween = ChronoUnit.DAYS.between(date1, date2);
        long monthsBetween = ChronoUnit.MONTHS.between(date1, date2);

        System.out.println("相差天数: " + daysBetween);
        System.out.println("相差月数: " + monthsBetween);
    }
}
```

## LocalTime - 本地时间

`LocalTime` 表示不带日期和时区的时间，如 `14:30:00`。

### 创建 LocalTime

```java
import java.time.LocalTime;

public class LocalTimeCreation {
    public static void main(String[] args) {
        // 获取当前时间
        LocalTime now = LocalTime.now();
        System.out.println("当前时间: " + now);

        // 使用指定值创建
        LocalTime time1 = LocalTime.of(14, 30);           // 14:30
        LocalTime time2 = LocalTime.of(14, 30, 45);       // 14:30:45
        LocalTime time3 = LocalTime.of(14, 30, 45, 123456789); // 带纳秒

        // 从字符串解析
        LocalTime time4 = LocalTime.parse("14:30:00");
        LocalTime time5 = LocalTime.parse("14:30");

        // 从一天的秒数或纳秒数创建
        LocalTime time6 = LocalTime.ofSecondOfDay(52200);    // 14:30:00
        LocalTime time7 = LocalTime.ofNanoOfDay(52200000000000L);

        // 特殊常量
        LocalTime midnight = LocalTime.MIDNIGHT; // 00:00
        LocalTime noon = LocalTime.NOON;         // 12:00
        LocalTime min = LocalTime.MIN;           // 00:00
        LocalTime max = LocalTime.MAX;           // 23:59:59.999999999

        System.out.println("午夜: " + midnight);
        System.out.println("正午: " + noon);
    }
}
```

### 获取时间信息

```java
public class LocalTimeInfo {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(14, 30, 45, 123456789);

        // 获取各个字段
        int hour = time.getHour();       // 14
        int minute = time.getMinute();   // 30
        int second = time.getSecond();   // 45
        int nano = time.getNano();       // 123456789

        // 转换为一天中的秒数和纳秒数
        int secondOfDay = time.toSecondOfDay();
        long nanoOfDay = time.toNanoOfDay();

        System.out.println("小时: " + hour);
        System.out.println("分钟: " + minute);
        System.out.println("秒: " + second);
        System.out.println("纳秒: " + nano);
    }
}
```

### 时间操作

```java
public class LocalTimeOperations {
    public static void main(String[] args) {
        LocalTime time = LocalTime.of(14, 30, 0);

        // 增加时间
        LocalTime plusHours = time.plusHours(2);      // 16:30:00
        LocalTime plusMinutes = time.plusMinutes(45); // 15:15:00
        LocalTime plusSeconds = time.plusSeconds(30); // 14:30:30
        LocalTime plusNanos = time.plusNanos(1000);   // 加 1000 纳秒

        // 减少时间
        LocalTime minusHours = time.minusHours(3);    // 11:30:00
        LocalTime minusMinutes = time.minusMinutes(15); // 14:15:00

        // 时间会自动回绕（跨越午夜）
        LocalTime wrapAround = time.plusHours(12);    // 02:30:00

        // 修改特定字段
        LocalTime withHour = time.withHour(10);       // 10:30:00
        LocalTime withMinute = time.withMinute(0);    // 14:00:00

        System.out.println("加2小时: " + plusHours);
        System.out.println("时间回绕: " + wrapAround);
    }
}
```

### 时间比较

```java
public class LocalTimeComparison {
    public static void main(String[] args) {
        LocalTime time1 = LocalTime.of(9, 30);
        LocalTime time2 = LocalTime.of(14, 0);
        LocalTime time3 = LocalTime.of(9, 30);

        // 比较时间
        boolean isBefore = time1.isBefore(time2); // true
        boolean isAfter = time1.isAfter(time2);   // false

        // 使用 compareTo
        int compare = time1.compareTo(time2); // 负数

        // 判断是否在指定范围内
        LocalTime openTime = LocalTime.of(9, 0);
        LocalTime closeTime = LocalTime.of(18, 0);
        LocalTime checkTime = LocalTime.of(14, 30);

        boolean isOpen = !checkTime.isBefore(openTime) && checkTime.isBefore(closeTime);
        System.out.println("营业中: " + isOpen);
    }
}
```

## LocalDateTime - 本地日期时间

`LocalDateTime` 是 `LocalDate` 和 `LocalTime` 的组合，表示不带时区的日期时间。

### 创建 LocalDateTime

```java
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Month;

public class LocalDateTimeCreation {
    public static void main(String[] args) {
        // 获取当前日期时间
        LocalDateTime now = LocalDateTime.now();
        System.out.println("当前日期时间: " + now);

        // 使用指定值创建
        LocalDateTime dt1 = LocalDateTime.of(2026, 1, 7, 14, 30);
        LocalDateTime dt2 = LocalDateTime.of(2026, Month.JANUARY, 7, 14, 30, 45);
        LocalDateTime dt3 = LocalDateTime.of(2026, 1, 7, 14, 30, 45, 123456789);

        // 组合 LocalDate 和 LocalTime
        LocalDate date = LocalDate.of(2026, 1, 7);
        LocalTime time = LocalTime.of(14, 30);
        LocalDateTime dt4 = LocalDateTime.of(date, time);
        LocalDateTime dt5 = date.atTime(time);
        LocalDateTime dt6 = time.atDate(date);
        LocalDateTime dt7 = date.atTime(14, 30);

        // 从字符串解析
        LocalDateTime dt8 = LocalDateTime.parse("2026-01-07T14:30:00");

        // 在指定日期的开始和结束
        LocalDateTime startOfDay = date.atStartOfDay(); // 2026-01-07T00:00

        System.out.println("组合日期时间: " + dt4);
        System.out.println("一天的开始: " + startOfDay);
    }
}
```

### 获取日期时间信息

```java
public class LocalDateTimeInfo {
    public static void main(String[] args) {
        LocalDateTime dt = LocalDateTime.of(2026, 1, 7, 14, 30, 45);

        // 获取日期部分
        LocalDate date = dt.toLocalDate();
        int year = dt.getYear();
        Month month = dt.getMonth();
        int dayOfMonth = dt.getDayOfMonth();
        DayOfWeek dayOfWeek = dt.getDayOfWeek();

        // 获取时间部分
        LocalTime time = dt.toLocalTime();
        int hour = dt.getHour();
        int minute = dt.getMinute();
        int second = dt.getSecond();

        System.out.println("日期: " + date);
        System.out.println("时间: " + time);
        System.out.println("年月日: " + year + "-" + month + "-" + dayOfMonth);
        System.out.println("星期: " + dayOfWeek);
    }
}
```

### 日期时间操作

```java
import java.time.temporal.ChronoUnit;

public class LocalDateTimeOperations {
    public static void main(String[] args) {
        LocalDateTime dt = LocalDateTime.of(2026, 1, 7, 14, 30, 0);

        // 增加各种时间单位
        LocalDateTime plusYears = dt.plusYears(1);
        LocalDateTime plusMonths = dt.plusMonths(3);
        LocalDateTime plusDays = dt.plusDays(10);
        LocalDateTime plusHours = dt.plusHours(5);
        LocalDateTime plusMinutes = dt.plusMinutes(30);
        LocalDateTime plusSeconds = dt.plusSeconds(45);

        // 使用 ChronoUnit
        LocalDateTime plus2Weeks = dt.plus(2, ChronoUnit.WEEKS);
        LocalDateTime plus100Days = dt.plus(100, ChronoUnit.DAYS);

        // 减少时间
        LocalDateTime minus1Month = dt.minusMonths(1);
        LocalDateTime minus2Hours = dt.minusHours(2);

        // 修改特定字段
        LocalDateTime withYear = dt.withYear(2030);
        LocalDateTime withHour = dt.withHour(9);

        // 截断到指定精度
        LocalDateTime truncatedToHours = dt.truncatedTo(ChronoUnit.HOURS);    // 14:00:00
        LocalDateTime truncatedToMinutes = dt.truncatedTo(ChronoUnit.MINUTES); // 14:30:00
        LocalDateTime truncatedToDays = dt.truncatedTo(ChronoUnit.DAYS);      // 00:00:00

        System.out.println("加100天: " + plus100Days);
        System.out.println("截断到小时: " + truncatedToHours);
    }
}
```

## ZonedDateTime - 带时区的日期时间

`ZonedDateTime` 是带有时区信息的日期时间，用于处理跨时区场景。

### 时区概念

```java
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Set;

public class TimeZoneBasics {
    public static void main(String[] args) {
        // 获取系统默认时区
        ZoneId systemZone = ZoneId.systemDefault();
        System.out.println("系统时区: " + systemZone);

        // 获取所有可用时区
        Set<String> availableZones = ZoneId.getAvailableZoneIds();
        System.out.println("可用时区数量: " + availableZones.size());

        // 常用时区
        ZoneId utc = ZoneId.of("UTC");
        ZoneId beijing = ZoneId.of("Asia/Shanghai");
        ZoneId tokyo = ZoneId.of("Asia/Tokyo");
        ZoneId newYork = ZoneId.of("America/New_York");
        ZoneId london = ZoneId.of("Europe/London");

        // 使用偏移量创建时区
        ZoneId offsetZone = ZoneId.of("+08:00");
        ZoneOffset offset = ZoneOffset.of("+08:00");
        ZoneOffset offsetHours = ZoneOffset.ofHours(8);
        ZoneOffset offsetHoursMinutes = ZoneOffset.ofHoursMinutes(5, 30); // 印度时区

        System.out.println("北京时区: " + beijing);
        System.out.println("偏移量: " + offset);
    }
}
```

### 创建 ZonedDateTime

```java
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.Instant;

public class ZonedDateTimeCreation {
    public static void main(String[] args) {
        // 获取当前时区的日期时间
        ZonedDateTime now = ZonedDateTime.now();
        System.out.println("当前时区: " + now);

        // 获取指定时区的当前时间
        ZonedDateTime tokyoNow = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
        ZonedDateTime nyNow = ZonedDateTime.now(ZoneId.of("America/New_York"));
        System.out.println("东京时间: " + tokyoNow);
        System.out.println("纽约时间: " + nyNow);

        // 使用指定值创建
        ZonedDateTime zdt1 = ZonedDateTime.of(2026, 1, 7, 14, 30, 0, 0, ZoneId.of("Asia/Shanghai"));

        // 从 LocalDateTime 创建
        LocalDateTime ldt = LocalDateTime.of(2026, 1, 7, 14, 30);
        ZonedDateTime zdt2 = ZonedDateTime.of(ldt, ZoneId.of("Asia/Shanghai"));
        ZonedDateTime zdt3 = ldt.atZone(ZoneId.of("Asia/Shanghai"));

        // 从 Instant 创建
        Instant instant = Instant.now();
        ZonedDateTime zdt4 = instant.atZone(ZoneId.of("Asia/Shanghai"));

        // 从字符串解析
        ZonedDateTime zdt5 = ZonedDateTime.parse("2026-01-07T14:30:00+08:00[Asia/Shanghai]");

        System.out.println("创建的 ZonedDateTime: " + zdt1);
    }
}
```

### 时区转换

```java
public class TimeZoneConversion {
    public static void main(String[] args) {
        // 北京时间 14:30
        ZonedDateTime beijingTime = ZonedDateTime.of(2026, 1, 7, 14, 30, 0, 0,
            ZoneId.of("Asia/Shanghai"));

        // 转换到东京时区（同一时刻，不同时区表示）
        ZonedDateTime tokyoTime = beijingTime.withZoneSameInstant(ZoneId.of("Asia/Tokyo"));
        System.out.println("北京: " + beijingTime);
        System.out.println("东京: " + tokyoTime); // 15:30

        // 转换到纽约时区
        ZonedDateTime nyTime = beijingTime.withZoneSameInstant(ZoneId.of("America/New_York"));
        System.out.println("纽约: " + nyTime); // 01:30 (前一天或当天，取决于夏令时)

        // 转换到 UTC
        ZonedDateTime utcTime = beijingTime.withZoneSameInstant(ZoneId.of("UTC"));
        System.out.println("UTC: " + utcTime); // 06:30

        // 保持本地时间不变，只更改时区（不同时刻，相同本地表示）
        ZonedDateTime sameLocal = beijingTime.withZoneSameLocal(ZoneId.of("America/New_York"));
        System.out.println("保持本地时间: " + sameLocal); // 14:30（纽约时区）
    }
}
```

### 处理夏令时

```java
public class DaylightSavingTime {
    public static void main(String[] args) {
        ZoneId nyZone = ZoneId.of("America/New_York");

        // 夏令时开始：2026年3月8日 02:00 -> 03:00
        LocalDateTime beforeDst = LocalDateTime.of(2026, 3, 8, 1, 30);
        ZonedDateTime beforeZdt = ZonedDateTime.of(beforeDst, nyZone);
        System.out.println("夏令时开始前: " + beforeZdt);

        // 加一小时后的时间
        ZonedDateTime afterDst = beforeZdt.plusHours(1);
        System.out.println("加一小时后: " + afterDst); // 跳到 03:30

        // 夏令时结束：2026年11月1日 02:00 -> 01:00
        LocalDateTime endDst = LocalDateTime.of(2026, 11, 1, 1, 30);
        ZonedDateTime endZdt = ZonedDateTime.of(endDst, nyZone);
        System.out.println("夏令时结束时: " + endZdt);

        // 获取时区规则
        java.time.zone.ZoneRules rules = nyZone.getRules();
        boolean isDst = rules.isDaylightSavings(beforeZdt.toInstant());
        System.out.println("是否在夏令时期间: " + isDst);
    }
}
```

## Instant - 时间戳

`Instant` 表示时间线上的一个点，即从 1970-01-01T00:00:00Z 开始的纳秒数。

### 创建和使用 Instant

```java
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

public class InstantExample {
    public static void main(String[] args) {
        // 获取当前时间戳
        Instant now = Instant.now();
        System.out.println("当前 Instant: " + now);

        // 从 epoch 秒数创建
        Instant instant1 = Instant.ofEpochSecond(1609459200); // 2021-01-01T00:00:00Z
        Instant instant2 = Instant.ofEpochSecond(1609459200, 123456789); // 带纳秒调整

        // 从毫秒数创建
        Instant instant3 = Instant.ofEpochMilli(System.currentTimeMillis());

        // 从字符串解析
        Instant instant4 = Instant.parse("2026-01-07T06:30:00Z");

        // 特殊常量
        Instant epoch = Instant.EPOCH; // 1970-01-01T00:00:00Z
        Instant min = Instant.MIN;
        Instant max = Instant.MAX;

        // 获取 epoch 秒数和毫秒数
        long epochSecond = now.getEpochSecond();
        long epochMilli = now.toEpochMilli();
        int nano = now.getNano();

        System.out.println("Epoch 秒: " + epochSecond);
        System.out.println("Epoch 毫秒: " + epochMilli);

        // 时间运算
        Instant plus1Hour = now.plus(1, ChronoUnit.HOURS);
        Instant minus1Day = now.minus(1, ChronoUnit.DAYS);

        // 转换为 ZonedDateTime
        ZonedDateTime zdt = now.atZone(ZoneId.of("Asia/Shanghai"));
        System.out.println("转换为北京时间: " + zdt);
    }
}
```

### Instant 比较

```java
public class InstantComparison {
    public static void main(String[] args) {
        Instant instant1 = Instant.parse("2026-01-07T06:30:00Z");
        Instant instant2 = Instant.parse("2026-01-07T14:30:00Z");

        // 比较
        boolean isBefore = instant1.isBefore(instant2); // true
        boolean isAfter = instant1.isAfter(instant2);   // false

        // 计算差异
        long secondsBetween = ChronoUnit.SECONDS.between(instant1, instant2);
        long hoursBetween = ChronoUnit.HOURS.between(instant1, instant2);

        System.out.println("相差秒数: " + secondsBetween);
        System.out.println("相差小时: " + hoursBetween);
    }
}
```

## Duration - 时间间隔

`Duration` 表示两个时间点之间的间隔，以秒和纳秒为单位。

### 创建 Duration

```java
import java.time.Duration;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class DurationCreation {
    public static void main(String[] args) {
        // 使用 of 方法创建
        Duration oneDay = Duration.ofDays(1);
        Duration twoHours = Duration.ofHours(2);
        Duration thirtyMinutes = Duration.ofMinutes(30);
        Duration tenSeconds = Duration.ofSeconds(10);
        Duration fiveMillis = Duration.ofMillis(5);
        Duration oneNano = Duration.ofNanos(1);

        // 组合时间单位
        Duration complex = Duration.ofHours(2).plusMinutes(30).plusSeconds(45);

        // 使用 of 方法和 ChronoUnit
        Duration oneWeek = Duration.of(7, ChronoUnit.DAYS);
        Duration halfDay = Duration.of(12, ChronoUnit.HOURS);

        // 从两个时间点计算
        LocalTime time1 = LocalTime.of(9, 0);
        LocalTime time2 = LocalTime.of(17, 30);
        Duration workDay = Duration.between(time1, time2);
        System.out.println("工作时长: " + workDay); // PT8H30M

        // 从 Instant 计算
        Instant start = Instant.now();
        // ... 执行一些操作
        Instant end = Instant.now();
        Duration elapsed = Duration.between(start, end);

        // 从字符串解析（ISO-8601 格式）
        Duration parsed = Duration.parse("PT2H30M"); // 2小时30分钟
        Duration parsed2 = Duration.parse("P1DT12H"); // 1天12小时

        System.out.println("解析的 Duration: " + parsed);
    }
}
```

### 使用 Duration

```java
public class DurationUsage {
    public static void main(String[] args) {
        Duration duration = Duration.ofHours(2).plusMinutes(30).plusSeconds(45);

        // 获取各个部分
        long seconds = duration.getSeconds(); // 总秒数
        int nanos = duration.getNano();

        // 转换为各种单位
        long toNanos = duration.toNanos();
        long toMillis = duration.toMillis();
        long toSeconds = duration.toSeconds();
        long toMinutes = duration.toMinutes();
        long toHours = duration.toHours();
        long toDays = duration.toDays();

        // Java 9+ 获取各部分
        long daysPart = duration.toDaysPart();      // 0
        int hoursPart = duration.toHoursPart();     // 2
        int minutesPart = duration.toMinutesPart(); // 30
        int secondsPart = duration.toSecondsPart(); // 45

        System.out.println("总分钟数: " + toMinutes);
        System.out.println("小时部分: " + hoursPart + ", 分钟部分: " + minutesPart);

        // 运算
        Duration doubled = duration.multipliedBy(2);
        Duration halved = duration.dividedBy(2);
        Duration negated = duration.negated();
        Duration absolute = negated.abs();

        // 比较
        boolean isNegative = duration.isNegative();
        boolean isZero = duration.isZero();

        // 应用到时间
        LocalTime time = LocalTime.of(9, 0);
        LocalTime endTime = time.plus(duration);
        System.out.println("结束时间: " + endTime);
    }
}
```

## Period - 日期间隔

`Period` 表示两个日期之间的间隔，以年、月、日为单位。

### 创建 Period

```java
import java.time.Period;
import java.time.LocalDate;

public class PeriodCreation {
    public static void main(String[] args) {
        // 使用 of 方法创建
        Period oneYear = Period.ofYears(1);
        Period twoMonths = Period.ofMonths(2);
        Period tenDays = Period.ofDays(10);
        Period complex = Period.of(1, 2, 10); // 1年2月10天

        // 使用 ofWeeks
        Period twoWeeks = Period.ofWeeks(2); // 等于 14 天

        // 从两个日期计算
        LocalDate date1 = LocalDate.of(2026, 1, 1);
        LocalDate date2 = LocalDate.of(2026, 6, 15);
        Period between = Period.between(date1, date2);
        System.out.println("两个日期之间: " + between); // P5M14D

        // 从字符串解析
        Period parsed = Period.parse("P1Y2M10D"); // 1年2月10天

        System.out.println("解析的 Period: " + parsed);
    }
}
```

### 使用 Period

```java
public class PeriodUsage {
    public static void main(String[] args) {
        LocalDate birthDate = LocalDate.of(1990, 6, 15);
        LocalDate today = LocalDate.of(2026, 1, 7);

        // 计算年龄
        Period age = Period.between(birthDate, today);
        System.out.println("年龄: " + age.getYears() + "年" +
                          age.getMonths() + "月" + age.getDays() + "天");

        // 获取各部分
        int years = age.getYears();   // 年
        int months = age.getMonths(); // 月
        int days = age.getDays();     // 天

        // 获取总月数
        long totalMonths = age.toTotalMonths();
        System.out.println("总月数: " + totalMonths);

        // 运算
        Period period = Period.of(1, 6, 15);
        Period doubled = period.multipliedBy(2);    // 3年0月30天
        Period negated = period.negated();          // -1年-6月-15天
        Period normalized = Period.of(1, 15, 0).normalized(); // 2年3月0天

        // 比较
        boolean isNegative = period.isNegative();
        boolean isZero = period.isZero();

        // 应用到日期
        LocalDate futureDate = today.plus(period);
        LocalDate pastDate = today.minus(period);
        System.out.println("未来日期: " + futureDate);
        System.out.println("过去日期: " + pastDate);
    }
}
```

## Duration vs Period

```java
import java.time.*;

public class DurationVsPeriod {
    public static void main(String[] args) {
        // Duration: 用于时间（小时、分钟、秒）
        // Period: 用于日期（年、月、日）

        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 7, 10, 0);

        // 使用 Duration
        Duration duration = Duration.ofHours(25);
        LocalDateTime plusDuration = dateTime.plus(duration);
        System.out.println("加25小时: " + plusDuration);

        // 使用 Period
        Period period = Period.ofDays(1);
        LocalDateTime plusPeriod = dateTime.plus(period);
        System.out.println("加1天: " + plusPeriod);

        // 处理夏令时差异示例
        ZoneId nyZone = ZoneId.of("America/New_York");

        // 在夏令时变化日期附近
        ZonedDateTime beforeDst = ZonedDateTime.of(2026, 3, 7, 12, 0, 0, 0, nyZone);

        // 加1天 Period vs 加24小时 Duration
        ZonedDateTime plusPeriodZdt = beforeDst.plus(Period.ofDays(1));
        ZonedDateTime plusDurationZdt = beforeDst.plus(Duration.ofHours(24));

        System.out.println("原始时间: " + beforeDst);
        System.out.println("加1天 Period: " + plusPeriodZdt);   // 仍是 12:00
        System.out.println("加24小时 Duration: " + plusDurationZdt); // 可能是 13:00（跨越夏令时）
    }
}
```

## 日期时间格式化

### 使用 DateTimeFormatter

```java
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;

public class DateTimeFormatting {
    public static void main(String[] args) {
        LocalDateTime dateTime = LocalDateTime.of(2026, 1, 7, 14, 30, 45);

        // 使用预定义格式
        String isoDate = dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String isoTime = dateTime.format(DateTimeFormatter.ISO_LOCAL_TIME);
        String isoDateTime = dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        System.out.println("ISO 日期: " + isoDate);       // 2026-01-07
        System.out.println("ISO 时间: " + isoTime);       // 14:30:45
        System.out.println("ISO 日期时间: " + isoDateTime); // 2026-01-07T14:30:45

        // 使用本地化格式
        DateTimeFormatter shortFormatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.SHORT);
        DateTimeFormatter mediumFormatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.MEDIUM);
        DateTimeFormatter longFormatter = DateTimeFormatter.ofLocalizedDateTime(FormatStyle.LONG)
            .withLocale(Locale.CHINA);

        System.out.println("短格式: " + dateTime.format(shortFormatter));
        System.out.println("中等格式: " + dateTime.format(mediumFormatter));

        // 自定义格式
        DateTimeFormatter customFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");
        String custom = dateTime.format(customFormatter);
        System.out.println("自定义格式: " + custom); // 2026年01月07日 14:30:45

        // 更多自定义格式示例
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("dd-MMM-yyyy", Locale.ENGLISH);
        DateTimeFormatter f3 = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", Locale.CHINA);

        System.out.println("格式1: " + dateTime.format(f1)); // 2026/01/07
        System.out.println("格式2: " + dateTime.format(f2)); // 07-Jan-2026
        System.out.println("格式3: " + dateTime.format(f3)); // 星期三, 一月 7, 2026
    }
}
```

### 常用格式模式

```java
public class FormatPatterns {
    public static void main(String[] args) {
        LocalDateTime dt = LocalDateTime.of(2026, 1, 7, 14, 30, 45, 123456789);

        // 年份
        format(dt, "y");       // 2026
        format(dt, "yy");      // 26
        format(dt, "yyyy");    // 2026

        // 月份
        format(dt, "M");       // 1
        format(dt, "MM");      // 01
        format(dt, "MMM");     // 1月 (或 Jan)
        format(dt, "MMMM");    // 一月 (或 January)

        // 日期
        format(dt, "d");       // 7
        format(dt, "dd");      // 07

        // 星期
        format(dt, "E");       // 周三 (或 Wed)
        format(dt, "EEEE");    // 星期三 (或 Wednesday)

        // 小时
        format(dt, "H");       // 14 (24小时制)
        format(dt, "HH");      // 14
        format(dt, "h");       // 2 (12小时制)
        format(dt, "hh");      // 02
        format(dt, "a");       // 下午 (或 PM)

        // 分钟和秒
        format(dt, "mm");      // 30
        format(dt, "ss");      // 45
        format(dt, "SSS");     // 123 (毫秒)
        format(dt, "n");       // 123456789 (纳秒)

        // 组合示例
        format(dt, "yyyy-MM-dd HH:mm:ss");          // 2026-01-07 14:30:45
        format(dt, "yyyy年MM月dd日 HH时mm分ss秒");    // 2026年01月07日 14时30分45秒
        format(dt, "yy/M/d h:mm a");                // 26/1/7 2:30 下午
    }

    private static void format(LocalDateTime dt, String pattern) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern, Locale.CHINA);
        System.out.println(pattern + " -> " + dt.format(formatter));
    }
}
```

### 带时区的格式化

```java
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class ZonedFormatting {
    public static void main(String[] args) {
        ZonedDateTime zdt = ZonedDateTime.of(2026, 1, 7, 14, 30, 0, 0,
            ZoneId.of("Asia/Shanghai"));

        // 时区相关格式
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss Z");
        DateTimeFormatter f3 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss VV");
        DateTimeFormatter f4 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss O");

        System.out.println("z (时区名): " + zdt.format(f1));   // CST
        System.out.println("Z (偏移量): " + zdt.format(f2));   // +0800
        System.out.println("VV (时区ID): " + zdt.format(f3)); // Asia/Shanghai
        System.out.println("O (本地化偏移): " + zdt.format(f4)); // GMT+8

        // ISO 格式
        String isoZoned = zdt.format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
        System.out.println("ISO Zoned: " + isoZoned);
        // 2026-01-07T14:30:00+08:00[Asia/Shanghai]
    }
}
```

## 日期时间解析

### 基本解析

```java
import java.time.*;
import java.time.format.DateTimeFormatter;

public class DateTimeParsing {
    public static void main(String[] args) {
        // 使用默认格式解析
        LocalDate date = LocalDate.parse("2026-01-07");
        LocalTime time = LocalTime.parse("14:30:45");
        LocalDateTime dateTime = LocalDateTime.parse("2026-01-07T14:30:45");
        ZonedDateTime zonedDateTime = ZonedDateTime.parse("2026-01-07T14:30:00+08:00[Asia/Shanghai]");

        System.out.println("解析的日期: " + date);
        System.out.println("解析的时间: " + time);
        System.out.println("解析的日期时间: " + dateTime);
        System.out.println("解析的时区日期时间: " + zonedDateTime);

        // 使用自定义格式解析
        DateTimeFormatter customFormatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm:ss");
        LocalDateTime parsedDateTime = LocalDateTime.parse("2026年01月07日 14:30:45", customFormatter);
        System.out.println("自定义格式解析: " + parsedDateTime);

        // 只解析日期
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
        LocalDate parsedDate = LocalDate.parse("2026/01/07", dateFormatter);
        System.out.println("日期解析: " + parsedDate);

        // 只解析时间
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime parsedTime = LocalTime.parse("14:30", timeFormatter);
        System.out.println("时间解析: " + parsedTime);
    }
}
```

### 宽松解析

```java
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoField;

public class LenientParsing {
    public static void main(String[] args) {
        // 严格模式（默认）
        DateTimeFormatter strictFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withResolverStyle(ResolverStyle.STRICT);

        // 智能模式（默认行为）
        DateTimeFormatter smartFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withResolverStyle(ResolverStyle.SMART);

        // 宽松模式
        DateTimeFormatter lenientFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            .withResolverStyle(ResolverStyle.LENIENT);

        // 智能模式会调整无效日期
        LocalDate smartDate = LocalDate.parse("2026-02-30", smartFormatter);
        System.out.println("智能模式 2026-02-30: " + smartDate); // 调整为 2026-02-28

        // 宽松模式会溢出到下个月
        LocalDate lenientDate = LocalDate.parse("2026-02-30", lenientFormatter);
        System.out.println("宽松模式 2026-02-30: " + lenientDate); // 2026-03-02

        // 使用 DateTimeFormatterBuilder 创建灵活的解析器
        DateTimeFormatter flexibleFormatter = new DateTimeFormatterBuilder()
            .appendPattern("[yyyy-MM-dd]")
            .appendPattern("[yyyy/MM/dd]")
            .appendPattern("[dd-MM-yyyy]")
            .toFormatter();

        LocalDate date1 = LocalDate.parse("2026-01-07", flexibleFormatter);
        LocalDate date2 = LocalDate.parse("2026/01/07", flexibleFormatter);
        LocalDate date3 = LocalDate.parse("07-01-2026", flexibleFormatter);

        System.out.println("解析结果相同: " + (date1.equals(date2) && date2.equals(date3)));
    }
}
```

### 解析带默认值

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;

public class ParseWithDefaults {
    public static void main(String[] args) {
        // 只提供日期，时间使用默认值
        DateTimeFormatter formatter = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd")
            .parseDefaulting(ChronoField.HOUR_OF_DAY, 0)
            .parseDefaulting(ChronoField.MINUTE_OF_HOUR, 0)
            .parseDefaulting(ChronoField.SECOND_OF_MINUTE, 0)
            .toFormatter();

        LocalDateTime dateTime = LocalDateTime.parse("2026-01-07", formatter);
        System.out.println("带默认时间: " + dateTime); // 2026-01-07T00:00

        // 只提供年月，日使用默认值
        DateTimeFormatter yearMonthFormatter = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM")
            .parseDefaulting(ChronoField.DAY_OF_MONTH, 1)
            .toFormatter();

        LocalDate date = LocalDate.parse("2026-01", yearMonthFormatter);
        System.out.println("默认为月初: " + date); // 2026-01-01
    }
}
```

## 与遗留 API 的互操作

### 与 java.util.Date 转换

```java
import java.time.*;
import java.util.Date;

public class LegacyDateConversion {
    public static void main(String[] args) {
        // Date -> Instant
        Date oldDate = new Date();
        Instant instant = oldDate.toInstant();
        System.out.println("Date -> Instant: " + instant);

        // Instant -> Date
        Instant now = Instant.now();
        Date date = Date.from(now);
        System.out.println("Instant -> Date: " + date);

        // Date -> LocalDateTime（需要通过 Instant）
        LocalDateTime localDateTime = oldDate.toInstant()
            .atZone(ZoneId.systemDefault())
            .toLocalDateTime();
        System.out.println("Date -> LocalDateTime: " + localDateTime);

        // LocalDateTime -> Date
        LocalDateTime ldt = LocalDateTime.now();
        Date fromLdt = Date.from(ldt.atZone(ZoneId.systemDefault()).toInstant());
        System.out.println("LocalDateTime -> Date: " + fromLdt);

        // Date -> ZonedDateTime
        ZonedDateTime zdt = oldDate.toInstant().atZone(ZoneId.of("Asia/Shanghai"));
        System.out.println("Date -> ZonedDateTime: " + zdt);
    }
}
```

### 与 java.util.Calendar 转换

```java
import java.time.*;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

public class CalendarConversion {
    public static void main(String[] args) {
        // Calendar -> Instant
        Calendar calendar = Calendar.getInstance();
        Instant instant = calendar.toInstant();

        // Calendar -> ZonedDateTime（GregorianCalendar）
        GregorianCalendar gregorianCalendar = new GregorianCalendar();
        ZonedDateTime zdt = gregorianCalendar.toZonedDateTime();
        System.out.println("Calendar -> ZonedDateTime: " + zdt);

        // ZonedDateTime -> GregorianCalendar
        ZonedDateTime now = ZonedDateTime.now();
        GregorianCalendar fromZdt = GregorianCalendar.from(now);
        System.out.println("ZonedDateTime -> Calendar: " + fromZdt.getTime());

        // TimeZone -> ZoneId
        TimeZone oldTimeZone = TimeZone.getTimeZone("America/New_York");
        ZoneId zoneId = oldTimeZone.toZoneId();
        System.out.println("TimeZone -> ZoneId: " + zoneId);

        // ZoneId -> TimeZone
        ZoneId zone = ZoneId.of("Asia/Tokyo");
        TimeZone timeZone = TimeZone.getTimeZone(zone);
        System.out.println("ZoneId -> TimeZone: " + timeZone.getID());
    }
}
```

### 与 java.sql 类型转换

```java
import java.time.*;
import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;

public class SqlTypeConversion {
    public static void main(String[] args) {
        // LocalDate <-> java.sql.Date
        LocalDate localDate = LocalDate.now();
        java.sql.Date sqlDate = java.sql.Date.valueOf(localDate);
        LocalDate backToLocalDate = sqlDate.toLocalDate();

        // LocalTime <-> java.sql.Time
        LocalTime localTime = LocalTime.now();
        java.sql.Time sqlTime = java.sql.Time.valueOf(localTime);
        LocalTime backToLocalTime = sqlTime.toLocalTime();

        // LocalDateTime <-> java.sql.Timestamp
        LocalDateTime localDateTime = LocalDateTime.now();
        Timestamp timestamp = Timestamp.valueOf(localDateTime);
        LocalDateTime backToLocalDateTime = timestamp.toLocalDateTime();

        // Instant <-> java.sql.Timestamp
        Instant instant = Instant.now();
        Timestamp fromInstant = Timestamp.from(instant);
        Instant backToInstant = fromInstant.toInstant();

        System.out.println("sql.Date: " + sqlDate);
        System.out.println("sql.Time: " + sqlTime);
        System.out.println("sql.Timestamp: " + timestamp);
    }
}
```

## 实际应用示例

### 计算年龄

```java
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;

public class AgeCalculator {
    public static void main(String[] args) {
        LocalDate birthDate = LocalDate.of(1990, 6, 15);
        LocalDate today = LocalDate.now();

        // 使用 Period 计算精确年龄
        Period age = Period.between(birthDate, today);
        System.out.println("年龄: " + age.getYears() + "岁" +
                          age.getMonths() + "个月" + age.getDays() + "天");

        // 只计算年数
        long years = ChronoUnit.YEARS.between(birthDate, today);
        System.out.println("周岁: " + years);

        // 计算下一个生日
        LocalDate nextBirthday = birthDate.withYear(today.getYear());
        if (nextBirthday.isBefore(today) || nextBirthday.isEqual(today)) {
            nextBirthday = nextBirthday.plusYears(1);
        }
        long daysUntilBirthday = ChronoUnit.DAYS.between(today, nextBirthday);
        System.out.println("距离下一个生日还有: " + daysUntilBirthday + "天");
    }
}
```

### 工作日计算

```java
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.function.Predicate;
import java.util.stream.Stream;

public class WorkdayCalculator {
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = LocalDate.of(2026, 1, 31);

        // 计算两个日期之间的工作日数量
        long workdays = countWorkdays(start, end);
        System.out.println("工作日数量: " + workdays);

        // 添加指定数量的工作日
        LocalDate after10Workdays = addWorkdays(LocalDate.now(), 10);
        System.out.println("10个工作日后: " + after10Workdays);
    }

    public static long countWorkdays(LocalDate start, LocalDate end) {
        Predicate<LocalDate> isWorkday = date -> {
            DayOfWeek day = date.getDayOfWeek();
            return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
        };

        return Stream.iterate(start, date -> date.plusDays(1))
            .limit(ChronoUnit.DAYS.between(start, end) + 1)
            .filter(isWorkday)
            .count();
    }

    public static LocalDate addWorkdays(LocalDate start, int workdays) {
        LocalDate result = start;
        int addedDays = 0;

        while (addedDays < workdays) {
            result = result.plusDays(1);
            DayOfWeek day = result.getDayOfWeek();
            if (day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY) {
                addedDays++;
            }
        }

        return result;
    }
}
```

### 定时任务调度

```java
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

public class ScheduleCalculator {
    public static void main(String[] args) {
        LocalDateTime now = LocalDateTime.now();

        // 计算到下一个整点的时间
        LocalDateTime nextHour = now.truncatedTo(ChronoUnit.HOURS).plusHours(1);
        Duration untilNextHour = Duration.between(now, nextHour);
        System.out.println("距离下一个整点: " + untilNextHour.toMinutes() + "分钟");

        // 计算到明天凌晨的时间
        LocalDateTime midnight = LocalDate.now().plusDays(1).atStartOfDay();
        Duration untilMidnight = Duration.between(now, midnight);
        System.out.println("距离明天凌晨: " + untilMidnight.toHours() + "小时");

        // 计算下周一上午9点
        LocalDateTime nextMondayMorning = now
            .with(TemporalAdjusters.next(DayOfWeek.MONDAY))
            .with(LocalTime.of(9, 0));
        System.out.println("下周一上午9点: " + nextMondayMorning);

        // 计算每月最后一个工作日
        LocalDate lastWorkdayOfMonth = getLastWorkdayOfMonth(now.toLocalDate());
        System.out.println("本月最后一个工作日: " + lastWorkdayOfMonth);
    }

    public static LocalDate getLastWorkdayOfMonth(LocalDate date) {
        LocalDate lastDay = date.with(TemporalAdjusters.lastDayOfMonth());

        while (lastDay.getDayOfWeek() == DayOfWeek.SATURDAY ||
               lastDay.getDayOfWeek() == DayOfWeek.SUNDAY) {
            lastDay = lastDay.minusDays(1);
        }

        return lastDay;
    }
}
```

### 跨时区会议安排

```java
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;

public class MeetingScheduler {
    public static void main(String[] args) {
        // 安排一个北京时间上午10点的会议
        ZonedDateTime meetingTime = ZonedDateTime.of(
            2026, 1, 8, 10, 0, 0, 0,
            ZoneId.of("Asia/Shanghai")
        );

        // 显示各个时区的会议时间
        List<String> cities = Arrays.asList(
            "Asia/Shanghai",    // 北京
            "Asia/Tokyo",       // 东京
            "America/New_York", // 纽约
            "Europe/London",    // 伦敦
            "America/Los_Angeles" // 洛杉矶
        );

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z");

        System.out.println("会议时间安排:");
        for (String city : cities) {
            ZonedDateTime localTime = meetingTime.withZoneSameInstant(ZoneId.of(city));
            System.out.println(city + ": " + localTime.format(formatter));
        }

        // 找出对所有人都合适的时间（工作时间 9:00-18:00）
        System.out.println("\n寻找合适的会议时间...");
        findSuitableMeetingTime(cities);
    }

    public static void findSuitableMeetingTime(List<String> cities) {
        ZoneId baseZone = ZoneId.of("Asia/Shanghai");
        LocalDate meetingDate = LocalDate.of(2026, 1, 8);

        for (int hour = 0; hour < 24; hour++) {
            ZonedDateTime proposedTime = ZonedDateTime.of(
                meetingDate, LocalTime.of(hour, 0), baseZone
            );

            boolean suitableForAll = cities.stream().allMatch(city -> {
                ZonedDateTime localTime = proposedTime.withZoneSameInstant(ZoneId.of(city));
                int localHour = localTime.getHour();
                return localHour >= 9 && localHour <= 18;
            });

            if (suitableForAll) {
                System.out.println("合适的时间 (北京时间): " + proposedTime.format(
                    DateTimeFormatter.ofPattern("HH:mm")
                ));
            }
        }
    }
}
```

### 日期时间工具类

```java
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

public final class DateTimeUtils {

    private DateTimeUtils() {}

    // 常用格式化器
    public static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final DateTimeFormatter TIME_FORMATTER =
        DateTimeFormatter.ofPattern("HH:mm:ss");
    public static final DateTimeFormatter DATETIME_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    public static final DateTimeFormatter CHINESE_DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy年MM月dd日");

    /**
     * 获取今天的开始时间
     */
    public static LocalDateTime getStartOfDay() {
        return LocalDate.now().atStartOfDay();
    }

    /**
     * 获取今天的结束时间
     */
    public static LocalDateTime getEndOfDay() {
        return LocalDate.now().atTime(LocalTime.MAX);
    }

    /**
     * 获取本周的第一天（周一）
     */
    public static LocalDate getFirstDayOfWeek() {
        return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    /**
     * 获取本月的第一天
     */
    public static LocalDate getFirstDayOfMonth() {
        return LocalDate.now().with(TemporalAdjusters.firstDayOfMonth());
    }

    /**
     * 获取本月的最后一天
     */
    public static LocalDate getLastDayOfMonth() {
        return LocalDate.now().with(TemporalAdjusters.lastDayOfMonth());
    }

    /**
     * 获取本年的第一天
     */
    public static LocalDate getFirstDayOfYear() {
        return LocalDate.now().with(TemporalAdjusters.firstDayOfYear());
    }

    /**
     * 判断是否为闰年
     */
    public static boolean isLeapYear(int year) {
        return Year.of(year).isLeap();
    }

    /**
     * 判断两个日期是否是同一天
     */
    public static boolean isSameDay(LocalDate date1, LocalDate date2) {
        return date1.isEqual(date2);
    }

    /**
     * 计算两个日期之间的天数
     */
    public static long daysBetween(LocalDate start, LocalDate end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    /**
     * 判断日期是否在指定范围内
     */
    public static boolean isDateInRange(LocalDate date, LocalDate start, LocalDate end) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    /**
     * 将时间戳转换为 LocalDateTime
     */
    public static LocalDateTime fromTimestamp(long timestamp) {
        return LocalDateTime.ofInstant(
            Instant.ofEpochMilli(timestamp),
            ZoneId.systemDefault()
        );
    }

    /**
     * 将 LocalDateTime 转换为时间戳
     */
    public static long toTimestamp(LocalDateTime dateTime) {
        return dateTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    /**
     * 格式化日期
     */
    public static String formatDate(LocalDate date) {
        return date.format(DATE_FORMATTER);
    }

    /**
     * 格式化日期时间
     */
    public static String formatDateTime(LocalDateTime dateTime) {
        return dateTime.format(DATETIME_FORMATTER);
    }

    /**
     * 解析日期字符串
     */
    public static LocalDate parseDate(String dateStr) {
        return LocalDate.parse(dateStr, DATE_FORMATTER);
    }

    /**
     * 解析日期时间字符串
     */
    public static LocalDateTime parseDateTime(String dateTimeStr) {
        return LocalDateTime.parse(dateTimeStr, DATETIME_FORMATTER);
    }

    // 使用示例
    public static void main(String[] args) {
        System.out.println("今天开始: " + getStartOfDay());
        System.out.println("今天结束: " + getEndOfDay());
        System.out.println("本周第一天: " + getFirstDayOfWeek());
        System.out.println("本月第一天: " + getFirstDayOfMonth());
        System.out.println("本月最后一天: " + getLastDayOfMonth());
        System.out.println("2026是闰年: " + isLeapYear(2026));

        LocalDateTime now = LocalDateTime.now();
        long timestamp = toTimestamp(now);
        System.out.println("当前时间戳: " + timestamp);
        System.out.println("转换回来: " + fromTimestamp(timestamp));
    }
}
```

## 总结

### 核心类对比

| 类名 | 描述 | 包含信息 | 示例 |
|------|------|----------|------|
| `LocalDate` | 本地日期 | 年、月、日 | 2026-01-07 |
| `LocalTime` | 本地时间 | 时、分、秒、纳秒 | 14:30:45 |
| `LocalDateTime` | 本地日期时间 | 日期 + 时间 | 2026-01-07T14:30:45 |
| `ZonedDateTime` | 带时区的日期时间 | 日期 + 时间 + 时区 | 2026-01-07T14:30:45+08:00[Asia/Shanghai] |
| `Instant` | 时间戳 | 自 epoch 以来的纳秒 | 2026-01-07T06:30:45Z |
| `Duration` | 时间间隔 | 秒、纳秒 | PT2H30M |
| `Period` | 日期间隔 | 年、月、日 | P1Y2M10D |

### 最佳实践

1. **选择合适的类型**
   - 只需要日期使用 `LocalDate`
   - 只需要时间使用 `LocalTime`
   - 需要日期时间但不关心时区使用 `LocalDateTime`
   - 需要处理时区使用 `ZonedDateTime`
   - 需要精确时间点使用 `Instant`

2. **存储和传输**
   - 数据库存储优先使用 `Instant` 或 UTC 时间
   - API 传输使用 ISO-8601 格式字符串

3. **时区处理**
   - 始终明确时区，不要依赖系统默认时区
   - 用户界面显示时转换为用户本地时区

4. **避免的做法**
   - 不要使用 `java.util.Date` 和 `Calendar`
   - 不要忽略时区问题
   - 不要在多线程中共享 `DateTimeFormatter`（虽然它是线程安全的，但为了代码清晰建议使用常量）

5. **格式化和解析**
   - 使用 `DateTimeFormatter` 而不是 `SimpleDateFormat`
   - 将常用格式定义为常量

Java 8 的日期时间 API 设计优雅、功能强大，解决了旧 API 的诸多问题。掌握这些 API 可以让日期时间处理变得简单而可靠。
