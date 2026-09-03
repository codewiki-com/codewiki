---
title: Java Date Time API
description: Master Java 8+ DateTime API including LocalDate, LocalTime, ZonedDateTime and timezone handling
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - datetime
  - LocalDate
  - timezone
status: imported
origin: old/src/content/docs/java/datetime.en.md
divergence: 0.158
issues: []
legacy:
  category: Java
  subcategory: API
  order: 25
  lastUpdated: 2026-01-07
---

The Java Date Time API, introduced in Java 8 as part of the `java.time` package, provides a comprehensive and intuitive framework for working with dates, times, and time zones. It addresses the shortcomings of the legacy `java.util.Date` and `java.util.Calendar` classes by offering immutable, thread-safe classes with a fluent API design.

## Overview

The `java.time` package was designed based on the Joda-Time library and follows these key principles:

- **Immutability**: All classes are immutable and thread-safe
- **Fluent API**: Methods return new instances, enabling method chaining
- **Separation of Concerns**: Different classes for different use cases (date only, time only, date-time, etc.)
- **Null Safety**: Methods are designed to handle edge cases gracefully

### Package Structure

```
java.time
├── LocalDate         - Date without time or timezone
├── LocalTime         - Time without date or timezone
├── LocalDateTime     - Date and time without timezone
├── ZonedDateTime     - Date and time with timezone
├── OffsetDateTime    - Date and time with UTC offset
├── Instant           - Machine timestamp (epoch seconds)
├── Duration          - Time-based amount (seconds, nanoseconds)
├── Period            - Date-based amount (years, months, days)
├── ZoneId            - Timezone identifier
├── ZoneOffset        - Timezone offset from UTC
└── DateTimeFormatter - Formatting and parsing

java.time.temporal
├── TemporalAdjuster  - Strategy for adjusting dates
├── ChronoField       - Standard fields (year, month, day, etc.)
└── ChronoUnit        - Standard units (days, hours, minutes, etc.)

java.time.format
└── DateTimeFormatter - Formatting and parsing utilities
```

### Why Use java.time Instead of Date/Calendar?

```java
import java.util.Date;
import java.util.Calendar;
import java.time.LocalDate;

public class WhyJavaTime {
    public static void main(String[] args) {
        // Legacy problems with java.util.Date
        Date oldDate = new Date();
        oldDate.setYear(2024 - 1900);  // Year offset by 1900
        oldDate.setMonth(0);           // Month is 0-indexed
        // Date is mutable - can cause bugs in multi-threaded code

        // Legacy problems with Calendar
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, 0);  // January is 0
        // Not intuitive, verbose API

        // java.time solution
        LocalDate newDate = LocalDate.of(2024, 1, 15);  // Clear and intuitive
        // Immutable - thread-safe
        // Month is 1-indexed (January = 1)

        System.out.println("Modern date: " + newDate);
    }
}
```

## Core Classes

The Date Time API provides several core classes, each designed for specific use cases:

| Class | Description | Example |
|-------|-------------|---------|
| `LocalDate` | Date only (year, month, day) | 2024-01-15 |
| `LocalTime` | Time only (hour, minute, second, nano) | 14:30:45.123456789 |
| `LocalDateTime` | Date and time combined | 2024-01-15T14:30:45 |
| `Instant` | Machine timestamp | Epoch seconds |
| `ZonedDateTime` | Date-time with timezone | 2024-01-15T14:30:45+09:00[Asia/Tokyo] |
| `OffsetDateTime` | Date-time with UTC offset | 2024-01-15T14:30:45+09:00 |
| `OffsetTime` | Time with UTC offset | 14:30:45+09:00 |
| `Year` | Year only | 2024 |
| `YearMonth` | Year and month | 2024-01 |
| `MonthDay` | Month and day | --01-15 |

### Choosing the Right Class

```java
import java.time.*;

public class ChoosingRightClass {
    public static void main(String[] args) {
        // Use LocalDate for birthdays, holidays, etc.
        LocalDate birthday = LocalDate.of(1990, 5, 15);

        // Use LocalTime for daily schedules (alarm, meeting times)
        LocalTime alarmTime = LocalTime.of(7, 30);

        // Use LocalDateTime for local events without timezone
        LocalDateTime meetingTime = LocalDateTime.of(2024, 3, 15, 14, 0);

        // Use ZonedDateTime for international events
        ZonedDateTime flightDeparture = ZonedDateTime.of(
            2024, 3, 15, 10, 30, 0, 0,
            ZoneId.of("America/New_York")
        );

        // Use Instant for timestamps (logging, auditing)
        Instant timestamp = Instant.now();

        // Use Duration for time-based intervals
        Duration timeout = Duration.ofMinutes(30);

        // Use Period for date-based intervals
        Period subscription = Period.ofMonths(12);
    }
}
```

## LocalDate

`LocalDate` represents a date without time or timezone information. It is ideal for birthdays, holidays, and other calendar-based data.

### Creating LocalDate

```java
import java.time.LocalDate;
import java.time.Month;
import java.time.DayOfWeek;

public class LocalDateCreation {
    public static void main(String[] args) {
        // Current date
        LocalDate today = LocalDate.now();
        System.out.println("Today: " + today);

        // Specific date
        LocalDate specific = LocalDate.of(2024, 3, 15);
        System.out.println("Specific: " + specific);

        // Using Month enum (more readable)
        LocalDate withMonth = LocalDate.of(2024, Month.MARCH, 15);
        System.out.println("With Month enum: " + withMonth);

        // Parse from string
        LocalDate parsed = LocalDate.parse("2024-03-15");
        System.out.println("Parsed: " + parsed);

        // From year and day of year
        LocalDate dayOfYear = LocalDate.ofYearDay(2024, 75);  // 75th day of 2024
        System.out.println("Day 75 of 2024: " + dayOfYear);

        // From epoch day (days since 1970-01-01)
        LocalDate epochDay = LocalDate.ofEpochDay(18000);
        System.out.println("Epoch day 18000: " + epochDay);
    }
}
```

### Accessing Date Components

```java
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.Month;

public class LocalDateComponents {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);

        // Basic components
        int year = date.getYear();               // 2024
        Month month = date.getMonth();           // MARCH
        int monthValue = date.getMonthValue();   // 3
        int dayOfMonth = date.getDayOfMonth();   // 15
        DayOfWeek dayOfWeek = date.getDayOfWeek(); // FRIDAY
        int dayOfYear = date.getDayOfYear();     // 75

        System.out.println("Year: " + year);
        System.out.println("Month: " + month);
        System.out.println("Month value: " + monthValue);
        System.out.println("Day of month: " + dayOfMonth);
        System.out.println("Day of week: " + dayOfWeek);
        System.out.println("Day of year: " + dayOfYear);

        // Additional information
        int lengthOfMonth = date.lengthOfMonth();  // 31
        int lengthOfYear = date.lengthOfYear();    // 366 (leap year)
        boolean isLeapYear = date.isLeapYear();    // true

        System.out.println("Days in month: " + lengthOfMonth);
        System.out.println("Days in year: " + lengthOfYear);
        System.out.println("Is leap year: " + isLeapYear);

        // Epoch day
        long epochDay = date.toEpochDay();
        System.out.println("Epoch day: " + epochDay);
    }
}
```

### Modifying LocalDate

```java
import java.time.LocalDate;
import java.time.Month;

public class LocalDateModification {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);

        // Adding/subtracting
        LocalDate plusDays = date.plusDays(10);      // 2024-03-25
        LocalDate plusWeeks = date.plusWeeks(2);     // 2024-03-29
        LocalDate plusMonths = date.plusMonths(3);   // 2024-06-15
        LocalDate plusYears = date.plusYears(1);     // 2025-03-15

        LocalDate minusDays = date.minusDays(5);     // 2024-03-10
        LocalDate minusMonths = date.minusMonths(1); // 2024-02-15

        System.out.println("Original: " + date);
        System.out.println("Plus 10 days: " + plusDays);
        System.out.println("Plus 2 weeks: " + plusWeeks);
        System.out.println("Plus 3 months: " + plusMonths);
        System.out.println("Plus 1 year: " + plusYears);
        System.out.println("Minus 5 days: " + minusDays);

        // Setting specific components
        LocalDate withYear = date.withYear(2025);        // 2025-03-15
        LocalDate withMonth = date.withMonth(12);        // 2024-12-15
        LocalDate withDayOfMonth = date.withDayOfMonth(1);  // 2024-03-01
        LocalDate withDayOfYear = date.withDayOfYear(1);    // 2024-01-01

        System.out.println("With year 2025: " + withYear);
        System.out.println("With month 12: " + withMonth);
        System.out.println("With day 1: " + withDayOfMonth);

        // Note: Original date is unchanged (immutable)
        System.out.println("Original (unchanged): " + date);
    }
}
```

### Comparing LocalDates

```java
import java.time.LocalDate;

public class LocalDateComparison {
    public static void main(String[] args) {
        LocalDate date1 = LocalDate.of(2024, 3, 15);
        LocalDate date2 = LocalDate.of(2024, 3, 20);
        LocalDate date3 = LocalDate.of(2024, 3, 15);

        // Comparison methods
        boolean isBefore = date1.isBefore(date2);   // true
        boolean isAfter = date1.isAfter(date2);     // false
        boolean isEqual = date1.isEqual(date3);     // true
        boolean equals = date1.equals(date3);       // true
        int compare = date1.compareTo(date2);       // negative

        System.out.println("date1.isBefore(date2): " + isBefore);
        System.out.println("date1.isAfter(date2): " + isAfter);
        System.out.println("date1.isEqual(date3): " + isEqual);
        System.out.println("date1.compareTo(date2): " + compare);

        // Check if date is in range
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end = LocalDate.of(2024, 12, 31);
        LocalDate check = LocalDate.of(2024, 6, 15);

        boolean inRange = !check.isBefore(start) && !check.isAfter(end);
        System.out.println("Is in range: " + inRange);
    }
}
```

## LocalTime

`LocalTime` represents a time without date or timezone. It is useful for representing daily schedules, opening hours, or alarm times.

### Creating and Using LocalTime

```java
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

public class LocalTimeExamples {
    public static void main(String[] args) {
        // Creating LocalTime
        LocalTime now = LocalTime.now();
        LocalTime specific = LocalTime.of(14, 30);           // 14:30
        LocalTime withSeconds = LocalTime.of(14, 30, 45);    // 14:30:45
        LocalTime withNanos = LocalTime.of(14, 30, 45, 123456789);
        LocalTime parsed = LocalTime.parse("14:30:45");

        System.out.println("Now: " + now);
        System.out.println("Specific: " + specific);
        System.out.println("With seconds: " + withSeconds);
        System.out.println("Parsed: " + parsed);

        // Constants
        LocalTime midnight = LocalTime.MIDNIGHT;  // 00:00
        LocalTime noon = LocalTime.NOON;          // 12:00
        LocalTime min = LocalTime.MIN;            // 00:00
        LocalTime max = LocalTime.MAX;            // 23:59:59.999999999

        System.out.println("Midnight: " + midnight);
        System.out.println("Noon: " + noon);
        System.out.println("Max: " + max);

        // Accessing components
        LocalTime time = LocalTime.of(14, 30, 45, 123456789);
        int hour = time.getHour();           // 14
        int minute = time.getMinute();       // 30
        int second = time.getSecond();       // 45
        int nano = time.getNano();           // 123456789

        System.out.println("\nTime: " + time);
        System.out.println("Hour: " + hour);
        System.out.println("Minute: " + minute);
        System.out.println("Second: " + second);
        System.out.println("Nano: " + nano);

        // Modifying time
        LocalTime plusHours = time.plusHours(2);      // 16:30:45
        LocalTime plusMinutes = time.plusMinutes(45); // 15:15:45
        LocalTime minusSeconds = time.minusSeconds(30);

        System.out.println("\nPlus 2 hours: " + plusHours);
        System.out.println("Plus 45 minutes: " + plusMinutes);

        // Setting specific components
        LocalTime withHour = time.withHour(10);
        LocalTime withMinute = time.withMinute(0);

        System.out.println("With hour 10: " + withHour);
        System.out.println("With minute 0: " + withMinute);

        // Truncation
        LocalTime truncated = time.truncatedTo(ChronoUnit.MINUTES);
        System.out.println("Truncated to minutes: " + truncated);  // 14:30

        // Conversion to seconds/nanos
        int secondOfDay = time.toSecondOfDay();
        long nanoOfDay = time.toNanoOfDay();
        System.out.println("Second of day: " + secondOfDay);

        // Comparison
        LocalTime t1 = LocalTime.of(10, 0);
        LocalTime t2 = LocalTime.of(14, 0);
        System.out.println("\n10:00 is before 14:00: " + t1.isBefore(t2));
        System.out.println("10:00 is after 14:00: " + t1.isAfter(t2));
    }
}
```

### Time Range Checking

```java
import java.time.LocalTime;

public class TimeRangeExample {
    public static void main(String[] args) {
        LocalTime openTime = LocalTime.of(9, 0);
        LocalTime closeTime = LocalTime.of(18, 0);
        LocalTime currentTime = LocalTime.now();

        boolean isOpen = isWithinBusinessHours(currentTime, openTime, closeTime);
        System.out.println("Current time: " + currentTime);
        System.out.println("Is business open: " + isOpen);

        // Handling overnight ranges (e.g., night shift)
        LocalTime nightStart = LocalTime.of(22, 0);
        LocalTime nightEnd = LocalTime.of(6, 0);
        LocalTime check = LocalTime.of(2, 0);

        boolean isNightShift = isWithinOvernightRange(check, nightStart, nightEnd);
        System.out.println("Is during night shift: " + isNightShift);
    }

    static boolean isWithinBusinessHours(LocalTime time, LocalTime start, LocalTime end) {
        return !time.isBefore(start) && time.isBefore(end);
    }

    static boolean isWithinOvernightRange(LocalTime time, LocalTime start, LocalTime end) {
        // Handles cases where end time is before start time (overnight)
        if (start.isAfter(end)) {
            return !time.isBefore(start) || time.isBefore(end);
        }
        return !time.isBefore(start) && time.isBefore(end);
    }
}
```

## LocalDateTime

`LocalDateTime` combines date and time without timezone information. It is suitable for representing timestamps in a local context.

### Creating and Using LocalDateTime

```java
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.Month;

public class LocalDateTimeExamples {
    public static void main(String[] args) {
        // Creating LocalDateTime
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime specific = LocalDateTime.of(2024, 3, 15, 14, 30);
        LocalDateTime withMonth = LocalDateTime.of(2024, Month.MARCH, 15, 14, 30, 45);
        LocalDateTime parsed = LocalDateTime.parse("2024-03-15T14:30:45");

        System.out.println("Now: " + now);
        System.out.println("Specific: " + specific);
        System.out.println("Parsed: " + parsed);

        // Combining LocalDate and LocalTime
        LocalDate date = LocalDate.of(2024, 3, 15);
        LocalTime time = LocalTime.of(14, 30);
        LocalDateTime combined = LocalDateTime.of(date, time);
        LocalDateTime atTime = date.atTime(time);
        LocalDateTime atDate = time.atDate(date);

        System.out.println("Combined: " + combined);
        System.out.println("At time: " + atTime);
        System.out.println("At date: " + atDate);

        // Extracting date and time
        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 15, 14, 30, 45);
        LocalDate extractedDate = dateTime.toLocalDate();
        LocalTime extractedTime = dateTime.toLocalTime();

        System.out.println("\nExtracted date: " + extractedDate);
        System.out.println("Extracted time: " + extractedTime);

        // Accessing all components
        System.out.println("\nComponents:");
        System.out.println("Year: " + dateTime.getYear());
        System.out.println("Month: " + dateTime.getMonth());
        System.out.println("Day: " + dateTime.getDayOfMonth());
        System.out.println("Hour: " + dateTime.getHour());
        System.out.println("Minute: " + dateTime.getMinute());
        System.out.println("Second: " + dateTime.getSecond());

        // Modifying
        LocalDateTime plusDays = dateTime.plusDays(7);
        LocalDateTime plusHours = dateTime.plusHours(3);
        LocalDateTime withYear = dateTime.withYear(2025);
        LocalDateTime withHour = dateTime.withHour(10);

        System.out.println("\nPlus 7 days: " + plusDays);
        System.out.println("Plus 3 hours: " + plusHours);
        System.out.println("With year 2025: " + withYear);
        System.out.println("With hour 10: " + withHour);
    }
}
```

### LocalDateTime Operations

```java
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class LocalDateTimeOperations {
    public static void main(String[] args) {
        LocalDateTime start = LocalDateTime.of(2024, 3, 15, 10, 0);
        LocalDateTime end = LocalDateTime.of(2024, 3, 15, 14, 30);

        // Calculate duration between two date-times
        long hours = ChronoUnit.HOURS.between(start, end);
        long minutes = ChronoUnit.MINUTES.between(start, end);

        System.out.println("Start: " + start);
        System.out.println("End: " + end);
        System.out.println("Hours between: " + hours);
        System.out.println("Minutes between: " + minutes);

        // Check if date-time is within a range
        LocalDateTime check = LocalDateTime.of(2024, 3, 15, 12, 0);
        boolean inRange = !check.isBefore(start) && !check.isAfter(end);
        System.out.println("\n" + check + " is in range: " + inRange);

        // Start and end of day
        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 15, 14, 30);
        LocalDateTime startOfDay = dateTime.toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = dateTime.toLocalDate().atTime(23, 59, 59);

        System.out.println("\nStart of day: " + startOfDay);
        System.out.println("End of day: " + endOfDay);
    }
}
```

## Instant

`Instant` represents a specific moment on the timeline, measured in nanoseconds from the Unix epoch (January 1, 1970, 00:00:00 UTC). It is ideal for timestamps, logging, and machine time.

### Working with Instant

```java
import java.time.Instant;
import java.time.Duration;
import java.time.temporal.ChronoUnit;

public class InstantExamples {
    public static void main(String[] args) {
        // Creating Instant
        Instant now = Instant.now();
        Instant epoch = Instant.EPOCH;  // 1970-01-01T00:00:00Z
        Instant fromEpochSecond = Instant.ofEpochSecond(1710500000);
        Instant fromEpochMilli = Instant.ofEpochMilli(1710500000000L);
        Instant parsed = Instant.parse("2024-03-15T10:30:00Z");

        System.out.println("Now: " + now);
        System.out.println("Epoch: " + epoch);
        System.out.println("From epoch second: " + fromEpochSecond);
        System.out.println("Parsed: " + parsed);

        // Accessing epoch values
        long epochSecond = now.getEpochSecond();
        int nano = now.getNano();
        long epochMilli = now.toEpochMilli();

        System.out.println("\nEpoch second: " + epochSecond);
        System.out.println("Nano: " + nano);
        System.out.println("Epoch milli: " + epochMilli);

        // Modifying Instant
        Instant plusSeconds = now.plusSeconds(3600);     // +1 hour
        Instant plusMillis = now.plusMillis(1000);       // +1 second
        Instant plusNanos = now.plusNanos(1000000000);   // +1 second
        Instant minusSeconds = now.minusSeconds(86400);  // -1 day

        System.out.println("\nPlus 1 hour: " + plusSeconds);
        System.out.println("Minus 1 day: " + minusSeconds);

        // Using ChronoUnit
        Instant plus1Hour = now.plus(1, ChronoUnit.HOURS);
        Instant plus1Day = now.plus(1, ChronoUnit.DAYS);

        System.out.println("Plus 1 hour (ChronoUnit): " + plus1Hour);
        System.out.println("Plus 1 day (ChronoUnit): " + plus1Day);

        // Comparison
        Instant past = Instant.now().minusSeconds(60);
        Instant future = Instant.now().plusSeconds(60);
        Instant current = Instant.now();

        System.out.println("\nPast is before current: " + past.isBefore(current));
        System.out.println("Future is after current: " + future.isAfter(current));

        // Calculate duration between instants
        Duration duration = Duration.between(past, future);
        System.out.println("Duration: " + duration);
    }
}
```

### Instant for Performance Measurement

```java
import java.time.Instant;
import java.time.Duration;

public class PerformanceMeasurement {
    public static void main(String[] args) {
        Instant start = Instant.now();

        // Simulate some work
        performWork();

        Instant end = Instant.now();
        Duration duration = Duration.between(start, end);

        System.out.println("Start: " + start);
        System.out.println("End: " + end);
        System.out.println("Duration: " + duration.toMillis() + " ms");
        System.out.println("Duration: " + duration.toNanos() + " ns");
    }

    static void performWork() {
        try {
            Thread.sleep(1500);  // Simulate 1.5 seconds of work
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## ZonedDateTime and Time Zones

`ZonedDateTime` represents a date-time with timezone information, essential for handling international date/time operations.

### Working with ZonedDateTime

```java
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.time.Month;

public class ZonedDateTimeExamples {
    public static void main(String[] args) {
        // Creating ZonedDateTime
        ZonedDateTime now = ZonedDateTime.now();
        ZonedDateTime nowInTokyo = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
        ZonedDateTime nowInNY = ZonedDateTime.now(ZoneId.of("America/New_York"));

        System.out.println("Now (system): " + now);
        System.out.println("Now (Tokyo): " + nowInTokyo);
        System.out.println("Now (New York): " + nowInNY);

        // Specific date-time with timezone
        ZonedDateTime specific = ZonedDateTime.of(
            2024, 3, 15, 14, 30, 0, 0,
            ZoneId.of("Europe/London")
        );
        System.out.println("\nSpecific: " + specific);

        // From LocalDateTime
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 14, 30);
        ZonedDateTime zoned = local.atZone(ZoneId.of("Asia/Tokyo"));
        System.out.println("From local: " + zoned);

        // Parse with timezone
        ZonedDateTime parsed = ZonedDateTime.parse("2024-03-15T14:30:00+09:00[Asia/Tokyo]");
        System.out.println("Parsed: " + parsed);

        // Access components
        System.out.println("\nComponents:");
        System.out.println("Zone: " + specific.getZone());
        System.out.println("Offset: " + specific.getOffset());
        System.out.println("LocalDateTime: " + specific.toLocalDateTime());
        System.out.println("LocalDate: " + specific.toLocalDate());
        System.out.println("LocalTime: " + specific.toLocalTime());
    }
}
```

### Timezone Conversion

```java
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class TimezoneConversion {
    public static void main(String[] args) {
        // Original time in Tokyo
        ZonedDateTime tokyoTime = ZonedDateTime.of(
            2024, 3, 15, 14, 30, 0, 0,
            ZoneId.of("Asia/Tokyo")
        );

        System.out.println("Tokyo: " + tokyoTime);

        // Convert to other timezones
        ZonedDateTime newYorkTime = tokyoTime.withZoneSameInstant(ZoneId.of("America/New_York"));
        ZonedDateTime londonTime = tokyoTime.withZoneSameInstant(ZoneId.of("Europe/London"));
        ZonedDateTime sydneyTime = tokyoTime.withZoneSameInstant(ZoneId.of("Australia/Sydney"));
        ZonedDateTime utcTime = tokyoTime.withZoneSameInstant(ZoneId.of("UTC"));

        System.out.println("New York: " + newYorkTime);
        System.out.println("London: " + londonTime);
        System.out.println("Sydney: " + sydneyTime);
        System.out.println("UTC: " + utcTime);

        // Same local time, different zone (changes instant)
        ZonedDateTime sameLocalDifferentZone = tokyoTime.withZoneSameLocal(ZoneId.of("America/New_York"));
        System.out.println("\nSame local, New York zone: " + sameLocalDifferentZone);

        // Format for display
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        System.out.println("\nFormatted times:");
        System.out.println("Tokyo: " + tokyoTime.format(formatter));
        System.out.println("New York: " + newYorkTime.format(formatter));
        System.out.println("London: " + londonTime.format(formatter));
    }
}
```

### Available Timezones

```java
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Set;

public class TimezoneInfo {
    public static void main(String[] args) {
        // Get all available zone IDs
        Set<String> zoneIds = ZoneId.getAvailableZoneIds();
        System.out.println("Total zones: " + zoneIds.size());

        // Print some common zones
        System.out.println("\nCommon zones:");
        zoneIds.stream()
            .filter(z -> z.startsWith("America/") || z.startsWith("Europe/") || z.startsWith("Asia/"))
            .sorted()
            .limit(20)
            .forEach(System.out::println);

        // System default zone
        ZoneId defaultZone = ZoneId.systemDefault();
        System.out.println("\nSystem default: " + defaultZone);

        // Zone from offset
        ZoneId fromOffset = ZoneId.ofOffset("UTC", ZoneOffset.ofHours(9));
        System.out.println("From offset (+9): " + fromOffset);

        // Short IDs
        ZoneId est = ZoneId.of("EST", ZoneId.SHORT_IDS);
        System.out.println("EST: " + est);
    }
}
```

### Daylight Saving Time Handling

```java
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.LocalDateTime;

public class DaylightSavingExample {
    public static void main(String[] args) {
        ZoneId newYork = ZoneId.of("America/New_York");

        // Spring forward (2nd Sunday of March)
        // At 2:00 AM, clocks move forward to 3:00 AM
        LocalDateTime beforeDST = LocalDateTime.of(2024, 3, 10, 1, 30);
        LocalDateTime duringDST = LocalDateTime.of(2024, 3, 10, 2, 30);  // This time doesn't exist!
        LocalDateTime afterDST = LocalDateTime.of(2024, 3, 10, 3, 30);

        ZonedDateTime before = beforeDST.atZone(newYork);
        ZonedDateTime during = duringDST.atZone(newYork);  // Adjusted automatically
        ZonedDateTime after = afterDST.atZone(newYork);

        System.out.println("Before DST (1:30 AM): " + before);
        System.out.println("During DST (2:30 AM): " + during + " (adjusted)");
        System.out.println("After DST (3:30 AM): " + after);

        // Fall back (1st Sunday of November)
        // At 2:00 AM, clocks move back to 1:00 AM
        LocalDateTime fallBack = LocalDateTime.of(2024, 11, 3, 1, 30);

        // This time occurs twice - use ofStrict for control
        ZonedDateTime firstOccurrence = ZonedDateTime.of(
            fallBack, newYork
        );
        System.out.println("\nFall back (1:30 AM): " + firstOccurrence);

        // One hour later (still 1:30 AM but different offset)
        ZonedDateTime afterFallBack = firstOccurrence.plusHours(1);
        System.out.println("After 1 hour: " + afterFallBack);

        // Check offset changes
        System.out.println("\nOffset before: " + before.getOffset());
        System.out.println("Offset after: " + after.getOffset());
    }
}
```

### OffsetDateTime

`OffsetDateTime` represents a date-time with an offset from UTC, without the full timezone rules.

```java
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.LocalDateTime;
import java.time.Instant;

public class OffsetDateTimeExamples {
    public static void main(String[] args) {
        // Creating OffsetDateTime
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime withOffset = OffsetDateTime.of(
            2024, 3, 15, 14, 30, 0, 0,
            ZoneOffset.ofHours(9)
        );
        OffsetDateTime utc = OffsetDateTime.now(ZoneOffset.UTC);

        System.out.println("Now: " + now);
        System.out.println("With +09:00: " + withOffset);
        System.out.println("UTC: " + utc);

        // From LocalDateTime
        LocalDateTime local = LocalDateTime.of(2024, 3, 15, 14, 30);
        OffsetDateTime atOffset = local.atOffset(ZoneOffset.ofHours(-5));
        System.out.println("At offset -5: " + atOffset);

        // Convert to Instant
        Instant instant = withOffset.toInstant();
        System.out.println("\nInstant: " + instant);

        // Convert between offsets
        OffsetDateTime converted = withOffset.withOffsetSameInstant(ZoneOffset.UTC);
        System.out.println("Converted to UTC: " + converted);

        // Access offset
        ZoneOffset offset = withOffset.getOffset();
        System.out.println("Offset: " + offset);
        System.out.println("Offset hours: " + offset.getTotalSeconds() / 3600);
    }
}
```

## Period and Duration

`Period` represents a date-based amount of time (years, months, days), while `Duration` represents a time-based amount (hours, minutes, seconds, nanoseconds).

### Working with Period

```java
import java.time.Period;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class PeriodExamples {
    public static void main(String[] args) {
        // Creating Period
        Period oneYear = Period.ofYears(1);
        Period threeMonths = Period.ofMonths(3);
        Period tenDays = Period.ofDays(10);
        Period combined = Period.of(1, 6, 15);  // 1 year, 6 months, 15 days
        Period parsed = Period.parse("P1Y6M15D");  // ISO-8601 format

        System.out.println("One year: " + oneYear);
        System.out.println("Three months: " + threeMonths);
        System.out.println("Ten days: " + tenDays);
        System.out.println("Combined: " + combined);
        System.out.println("Parsed: " + parsed);

        // Calculate period between dates
        LocalDate startDate = LocalDate.of(2020, 1, 15);
        LocalDate endDate = LocalDate.of(2024, 6, 20);
        Period between = Period.between(startDate, endDate);

        System.out.println("\nPeriod between " + startDate + " and " + endDate + ":");
        System.out.println("Years: " + between.getYears());
        System.out.println("Months: " + between.getMonths());
        System.out.println("Days: " + between.getDays());
        System.out.println("Total months: " + between.toTotalMonths());

        // Applying period to dates
        LocalDate date = LocalDate.of(2024, 3, 15);
        LocalDate plusPeriod = date.plus(combined);
        LocalDate minusPeriod = date.minus(Period.ofMonths(2));

        System.out.println("\nOriginal: " + date);
        System.out.println("Plus 1Y6M15D: " + plusPeriod);
        System.out.println("Minus 2 months: " + minusPeriod);

        // Modifying period
        Period modified = combined.plusYears(1).minusDays(5);
        System.out.println("\nModified: " + modified);

        // Negating
        Period negative = combined.negated();
        System.out.println("Negated: " + negative);

        // Check if zero
        System.out.println("Is zero: " + Period.ZERO.isZero());
        System.out.println("Is negative: " + negative.isNegative());
    }
}
```

### Working with Duration

```java
import java.time.Duration;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class DurationExamples {
    public static void main(String[] args) {
        // Creating Duration
        Duration oneHour = Duration.ofHours(1);
        Duration thirtyMinutes = Duration.ofMinutes(30);
        Duration tenSeconds = Duration.ofSeconds(10);
        Duration hundredMillis = Duration.ofMillis(100);
        Duration parsed = Duration.parse("PT2H30M");  // 2 hours 30 minutes

        System.out.println("One hour: " + oneHour);
        System.out.println("Thirty minutes: " + thirtyMinutes);
        System.out.println("Parsed: " + parsed);

        // From ChronoUnit
        Duration halfDay = Duration.of(12, ChronoUnit.HOURS);
        Duration oneDay = Duration.of(1, ChronoUnit.DAYS);

        System.out.println("Half day: " + halfDay);
        System.out.println("One day: " + oneDay);

        // Calculate duration between times
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(17, 30);
        Duration workDay = Duration.between(startTime, endTime);

        System.out.println("\nWork day duration:");
        System.out.println("Total seconds: " + workDay.getSeconds());
        System.out.println("Hours: " + workDay.toHours());
        System.out.println("Minutes: " + workDay.toMinutes());

        // Duration between Instants
        Instant start = Instant.now();
        Instant end = start.plusSeconds(3661);  // 1 hour, 1 minute, 1 second
        Duration between = Duration.between(start, end);

        System.out.println("\nBetween instants:");
        System.out.println("Hours: " + between.toHoursPart());
        System.out.println("Minutes: " + between.toMinutesPart());
        System.out.println("Seconds: " + between.toSecondsPart());

        // Applying duration
        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 15, 10, 0);
        LocalDateTime plusDuration = dateTime.plus(Duration.ofHours(5).plusMinutes(30));

        System.out.println("\nOriginal: " + dateTime);
        System.out.println("Plus 5h30m: " + plusDuration);

        // Duration arithmetic
        Duration d1 = Duration.ofHours(2);
        Duration d2 = Duration.ofMinutes(30);
        Duration sum = d1.plus(d2);
        Duration diff = d1.minus(d2);
        Duration multiplied = d1.multipliedBy(3);
        Duration divided = d1.dividedBy(2);

        System.out.println("\nArithmetic:");
        System.out.println("2h + 30m = " + sum);
        System.out.println("2h - 30m = " + diff);
        System.out.println("2h * 3 = " + multiplied);
        System.out.println("2h / 2 = " + divided);

        // Comparison
        System.out.println("\n2h > 30m: " + d1.compareTo(d2));
        System.out.println("Is negative: " + d1.isNegative());
        System.out.println("Is zero: " + Duration.ZERO.isZero());
    }
}
```

### Period vs Duration

```java
import java.time.Period;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class PeriodVsDuration {
    public static void main(String[] args) {
        // Period - for calendar-based calculations
        LocalDate date = LocalDate.of(2024, 1, 31);
        LocalDate plusOneMonth = date.plus(Period.ofMonths(1));
        System.out.println("Jan 31 + 1 month = " + plusOneMonth);  // Feb 29 (leap year)

        LocalDate feb29 = LocalDate.of(2024, 2, 29);
        LocalDate plusOneMonthFeb = feb29.plus(Period.ofMonths(1));
        System.out.println("Feb 29 + 1 month = " + plusOneMonthFeb);  // Mar 29

        // Duration - for exact time calculations
        LocalDateTime dateTime = LocalDateTime.of(2024, 1, 31, 12, 0);
        LocalDateTime plus30Days = dateTime.plus(Duration.ofDays(30));
        System.out.println("\nJan 31 12:00 + 30 days = " + plus30Days);  // Mar 1 12:00

        // Key differences
        System.out.println("\nKey differences:");
        System.out.println("Period - calendar-based, considers month lengths");
        System.out.println("Duration - time-based, fixed number of seconds");

        // Use ChronoUnit for total calculation
        LocalDate start = LocalDate.of(2024, 1, 1);
        LocalDate end = LocalDate.of(2024, 3, 15);

        long totalDays = ChronoUnit.DAYS.between(start, end);
        long totalWeeks = ChronoUnit.WEEKS.between(start, end);
        long totalMonths = ChronoUnit.MONTHS.between(start, end);

        System.out.println("\nFrom " + start + " to " + end + ":");
        System.out.println("Total days: " + totalDays);
        System.out.println("Total weeks: " + totalWeeks);
        System.out.println("Total months: " + totalMonths);
    }
}
```

## Formatting and Parsing

`DateTimeFormatter` provides flexible formatting and parsing of date-time objects.

### Predefined Formatters

```java
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class PredefinedFormatters {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);
        LocalTime time = LocalTime.of(14, 30, 45);
        LocalDateTime dateTime = LocalDateTime.of(date, time);
        ZonedDateTime zonedDateTime = dateTime.atZone(java.time.ZoneId.of("America/New_York"));

        // ISO formatters
        System.out.println("ISO_LOCAL_DATE: " + date.format(DateTimeFormatter.ISO_LOCAL_DATE));
        System.out.println("ISO_LOCAL_TIME: " + time.format(DateTimeFormatter.ISO_LOCAL_TIME));
        System.out.println("ISO_LOCAL_DATE_TIME: " + dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        System.out.println("ISO_ZONED_DATE_TIME: " + zonedDateTime.format(DateTimeFormatter.ISO_ZONED_DATE_TIME));

        // Other predefined formatters
        System.out.println("\nOther formats:");
        System.out.println("BASIC_ISO_DATE: " + date.format(DateTimeFormatter.BASIC_ISO_DATE));
        System.out.println("ISO_ORDINAL_DATE: " + date.format(DateTimeFormatter.ISO_ORDINAL_DATE));
        System.out.println("ISO_WEEK_DATE: " + date.format(DateTimeFormatter.ISO_WEEK_DATE));

        // RFC 1123 format (used in HTTP headers)
        System.out.println("RFC_1123_DATE_TIME: " + zonedDateTime.format(DateTimeFormatter.RFC_1123_DATE_TIME));
    }
}
```

### Custom Formatters

```java
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class CustomFormatters {
    public static void main(String[] args) {
        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 15, 14, 30, 45);

        // Common patterns
        DateTimeFormatter f1 = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter f2 = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter f3 = DateTimeFormatter.ofPattern("MM-dd-yyyy");
        DateTimeFormatter f4 = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        DateTimeFormatter f5 = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm");
        DateTimeFormatter f6 = DateTimeFormatter.ofPattern("E, MMM dd yyyy");
        DateTimeFormatter f7 = DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a");

        System.out.println("yyyy-MM-dd: " + dateTime.format(f1));
        System.out.println("dd/MM/yyyy: " + dateTime.format(f2));
        System.out.println("MM-dd-yyyy: " + dateTime.format(f3));
        System.out.println("yyyy-MM-dd HH:mm:ss: " + dateTime.format(f4));
        System.out.println("E, MMM dd yyyy: " + dateTime.format(f6));
        System.out.println("Full format: " + dateTime.format(f7));

        // With locale
        DateTimeFormatter french = DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy", Locale.FRENCH);
        DateTimeFormatter german = DateTimeFormatter.ofPattern("EEEE, dd. MMMM yyyy", Locale.GERMAN);
        DateTimeFormatter japanese = DateTimeFormatter.ofPattern("yyyy年MM月dd日 (E)", Locale.JAPANESE);

        System.out.println("\nLocalized:");
        System.out.println("French: " + dateTime.format(french));
        System.out.println("German: " + dateTime.format(german));
        System.out.println("Japanese: " + dateTime.format(japanese));

        // Pattern letters reference
        System.out.println("\nPattern letter reference:");
        System.out.println("G - Era (AD, BC)");
        System.out.println("y - Year (2024, 24)");
        System.out.println("M - Month (3, 03, Mar, March)");
        System.out.println("d - Day of month (15)");
        System.out.println("E - Day of week (Fri, Friday)");
        System.out.println("H - Hour (0-23)");
        System.out.println("h - Hour (1-12)");
        System.out.println("m - Minute");
        System.out.println("s - Second");
        System.out.println("S - Fraction of second");
        System.out.println("a - AM/PM");
        System.out.println("z - Timezone name");
        System.out.println("Z - Timezone offset");
    }
}
```

### Parsing Date-Time Strings

```java
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class ParsingExamples {
    public static void main(String[] args) {
        // Standard ISO format parsing
        LocalDate date1 = LocalDate.parse("2024-03-15");
        LocalTime time1 = LocalTime.parse("14:30:45");
        LocalDateTime dateTime1 = LocalDateTime.parse("2024-03-15T14:30:45");

        System.out.println("Parsed date: " + date1);
        System.out.println("Parsed time: " + time1);
        System.out.println("Parsed date-time: " + dateTime1);

        // Custom format parsing
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate date2 = LocalDate.parse("15/03/2024", dateFormatter);
        System.out.println("\nParsed with custom format: " + date2);

        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        LocalDateTime dateTime2 = LocalDateTime.parse("2024-03-15 14:30:45", dateTimeFormatter);
        System.out.println("Parsed date-time: " + dateTime2);

        // Parsing with timezone
        DateTimeFormatter zonedFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        ZonedDateTime zoned = ZonedDateTime.parse("2024-03-15 14:30:45 EST", zonedFormatter);
        System.out.println("Parsed zoned: " + zoned);

        // Error handling
        try {
            LocalDate invalid = LocalDate.parse("2024-13-45");  // Invalid date
        } catch (DateTimeParseException e) {
            System.out.println("\nParse error: " + e.getMessage());
        }

        // Safe parsing
        String dateString = "2024-03-15";
        LocalDate safeParsed = parseDate(dateString, "yyyy-MM-dd");
        System.out.println("Safe parsed: " + safeParsed);
    }

    static LocalDate parseDate(String text, String pattern) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(pattern);
            return LocalDate.parse(text, formatter);
        } catch (DateTimeParseException e) {
            System.err.println("Failed to parse: " + text);
            return null;
        }
    }
}
```

### DateTimeFormatterBuilder

```java
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.SignStyle;
import java.time.temporal.ChronoField;
import java.util.Locale;

public class FormatterBuilderExample {
    public static void main(String[] args) {
        // Building custom formatter
        DateTimeFormatter formatter = new DateTimeFormatterBuilder()
            .appendValue(ChronoField.YEAR, 4, 4, SignStyle.EXCEEDS_PAD)
            .appendLiteral('-')
            .appendValue(ChronoField.MONTH_OF_YEAR, 2)
            .appendLiteral('-')
            .appendValue(ChronoField.DAY_OF_MONTH, 2)
            .appendLiteral(' ')
            .appendValue(ChronoField.HOUR_OF_DAY, 2)
            .appendLiteral(':')
            .appendValue(ChronoField.MINUTE_OF_HOUR, 2)
            .appendLiteral(':')
            .appendValue(ChronoField.SECOND_OF_MINUTE, 2)
            .toFormatter();

        LocalDateTime dateTime = LocalDateTime.of(2024, 3, 15, 14, 30, 45);
        System.out.println("Custom formatted: " + dateTime.format(formatter));

        // Optional sections
        DateTimeFormatter flexibleFormatter = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd")
            .optionalStart()
            .appendPattern(" HH:mm")
            .optionalEnd()
            .optionalStart()
            .appendPattern(":ss")
            .optionalEnd()
            .toFormatter();

        // Can parse multiple formats
        System.out.println("\nFlexible parsing:");
        System.out.println(LocalDateTime.parse("2024-03-15 14:30:45", flexibleFormatter));
        System.out.println(LocalDateTime.parse("2024-03-15 14:30", flexibleFormatter));

        // Case insensitive parsing
        DateTimeFormatter caseInsensitive = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("dd-MMM-yyyy")
            .toFormatter(Locale.ENGLISH);

        System.out.println("\nCase insensitive:");
        System.out.println(LocalDateTime.parse("15-MAR-2024", caseInsensitive).toLocalDate());
        System.out.println(LocalDateTime.parse("15-mar-2024", caseInsensitive).toLocalDate());
    }
}
```

## Temporal Adjusters

Temporal adjusters provide a way to perform complex date calculations, such as finding the next Monday or the last day of the month.

### Built-in Adjusters

```java
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

public class BuiltInAdjusters {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);  // Friday
        System.out.println("Original date: " + date + " (" + date.getDayOfWeek() + ")");

        // Day of month adjusters
        LocalDate firstDay = date.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate lastDay = date.with(TemporalAdjusters.lastDayOfMonth());
        LocalDate firstNextMonth = date.with(TemporalAdjusters.firstDayOfNextMonth());

        System.out.println("\nMonth adjusters:");
        System.out.println("First day of month: " + firstDay);
        System.out.println("Last day of month: " + lastDay);
        System.out.println("First day of next month: " + firstNextMonth);

        // Year adjusters
        LocalDate firstOfYear = date.with(TemporalAdjusters.firstDayOfYear());
        LocalDate lastOfYear = date.with(TemporalAdjusters.lastDayOfYear());
        LocalDate firstNextYear = date.with(TemporalAdjusters.firstDayOfNextYear());

        System.out.println("\nYear adjusters:");
        System.out.println("First day of year: " + firstOfYear);
        System.out.println("Last day of year: " + lastOfYear);
        System.out.println("First day of next year: " + firstNextYear);

        // Day of week adjusters
        LocalDate nextMonday = date.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate previousMonday = date.with(TemporalAdjusters.previous(DayOfWeek.MONDAY));
        LocalDate nextOrSameFriday = date.with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
        LocalDate previousOrSameFriday = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.FRIDAY));

        System.out.println("\nWeekday adjusters:");
        System.out.println("Next Monday: " + nextMonday);
        System.out.println("Previous Monday: " + previousMonday);
        System.out.println("Next or same Friday: " + nextOrSameFriday);
        System.out.println("Previous or same Friday: " + previousOrSameFriday);

        // Ordinal adjusters
        LocalDate firstMonday = date.with(TemporalAdjusters.firstInMonth(DayOfWeek.MONDAY));
        LocalDate lastFriday = date.with(TemporalAdjusters.lastInMonth(DayOfWeek.FRIDAY));
        LocalDate secondTuesday = date.with(TemporalAdjusters.dayOfWeekInMonth(2, DayOfWeek.TUESDAY));
        LocalDate thirdWednesday = date.with(TemporalAdjusters.dayOfWeekInMonth(3, DayOfWeek.WEDNESDAY));

        System.out.println("\nOrdinal adjusters:");
        System.out.println("First Monday of month: " + firstMonday);
        System.out.println("Last Friday of month: " + lastFriday);
        System.out.println("Second Tuesday: " + secondTuesday);
        System.out.println("Third Wednesday: " + thirdWednesday);
    }
}
```

### Custom Adjusters

```java
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.Temporal;
import java.time.temporal.TemporalAdjuster;
import java.time.temporal.TemporalAdjusters;

public class CustomAdjusters {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);

        // Custom adjuster: next working day
        TemporalAdjuster nextWorkingDay = temporal -> {
            LocalDate d = LocalDate.from(temporal);
            DayOfWeek dow = d.getDayOfWeek();

            int daysToAdd = switch (dow) {
                case FRIDAY -> 3;
                case SATURDAY -> 2;
                default -> 1;
            };
            return d.plusDays(daysToAdd);
        };

        System.out.println("Original: " + date + " (" + date.getDayOfWeek() + ")");
        System.out.println("Next working day: " + date.with(nextWorkingDay));

        // Custom adjuster: end of quarter
        TemporalAdjuster endOfQuarter = temporal -> {
            LocalDate d = LocalDate.from(temporal);
            int month = d.getMonthValue();
            int quarterEndMonth = ((month - 1) / 3 + 1) * 3;
            return d.withMonth(quarterEndMonth)
                    .with(TemporalAdjusters.lastDayOfMonth());
        };

        System.out.println("\nEnd of quarter:");
        System.out.println("March 15 -> " + date.with(endOfQuarter));
        System.out.println("May 1 -> " + LocalDate.of(2024, 5, 1).with(endOfQuarter));
        System.out.println("October 20 -> " + LocalDate.of(2024, 10, 20).with(endOfQuarter));

        // Custom adjuster: payday (last Friday of month, or Thursday if Friday is holiday)
        TemporalAdjuster payday = temporal -> {
            LocalDate d = LocalDate.from(temporal);
            LocalDate lastFriday = d.with(TemporalAdjusters.lastInMonth(DayOfWeek.FRIDAY));
            // Simplified - in reality would check for holidays
            return lastFriday;
        };

        System.out.println("\nPayday: " + date.with(payday));

        // Combining adjusters
        LocalDate combined = date
            .with(TemporalAdjusters.firstDayOfNextMonth())
            .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        System.out.println("\nFirst Monday of next month: " + combined);
    }

    // Reusable custom adjuster class
    static class NthDayOfMonthAdjuster implements TemporalAdjuster {
        private final int n;

        public NthDayOfMonthAdjuster(int n) {
            this.n = n;
        }

        @Override
        public Temporal adjustInto(Temporal temporal) {
            LocalDate date = LocalDate.from(temporal);
            int maxDay = date.lengthOfMonth();
            int day = Math.min(n, maxDay);
            return date.withDayOfMonth(day);
        }
    }
}
```

## Date Calculations

Common date calculation patterns for business applications.

### Age Calculation

```java
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;

public class AgeCalculation {
    public static void main(String[] args) {
        LocalDate birthDate = LocalDate.of(1990, 5, 15);
        LocalDate today = LocalDate.now();

        // Using Period
        Period age = Period.between(birthDate, today);
        System.out.println("Age: " + age.getYears() + " years, " +
                          age.getMonths() + " months, " +
                          age.getDays() + " days");

        // Simple year calculation
        long years = ChronoUnit.YEARS.between(birthDate, today);
        System.out.println("Years: " + years);

        // Total days lived
        long daysLived = ChronoUnit.DAYS.between(birthDate, today);
        System.out.println("Days lived: " + daysLived);

        // Next birthday
        LocalDate nextBirthday = birthDate.withYear(today.getYear());
        if (nextBirthday.isBefore(today) || nextBirthday.isEqual(today)) {
            nextBirthday = nextBirthday.plusYears(1);
        }
        long daysUntilBirthday = ChronoUnit.DAYS.between(today, nextBirthday);
        System.out.println("Days until next birthday: " + daysUntilBirthday);
    }
}
```

### Business Day Calculations

```java
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.HashSet;

public class BusinessDayCalculations {
    // Sample holidays
    private static final Set<LocalDate> HOLIDAYS = Set.of(
        LocalDate.of(2024, 1, 1),   // New Year's Day
        LocalDate.of(2024, 12, 25), // Christmas
        LocalDate.of(2024, 12, 26)  // Boxing Day
    );

    public static void main(String[] args) {
        LocalDate startDate = LocalDate.of(2024, 3, 15);  // Friday

        // Add business days
        LocalDate plusBusinessDays = addBusinessDays(startDate, 5);
        System.out.println("Start: " + startDate);
        System.out.println("Plus 5 business days: " + plusBusinessDays);

        // Calculate business days between dates
        LocalDate endDate = LocalDate.of(2024, 3, 29);
        long businessDays = countBusinessDays(startDate, endDate);
        System.out.println("\nBusiness days between " + startDate + " and " + endDate + ": " + businessDays);

        // Check if date is business day
        System.out.println("\nIs " + startDate + " a business day: " + isBusinessDay(startDate));
        System.out.println("Is Saturday a business day: " + isBusinessDay(LocalDate.of(2024, 3, 16)));
    }

    static boolean isBusinessDay(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY &&
               dow != DayOfWeek.SUNDAY &&
               !HOLIDAYS.contains(date);
    }

    static LocalDate addBusinessDays(LocalDate date, int days) {
        LocalDate result = date;
        int addedDays = 0;

        while (addedDays < days) {
            result = result.plusDays(1);
            if (isBusinessDay(result)) {
                addedDays++;
            }
        }
        return result;
    }

    static long countBusinessDays(LocalDate start, LocalDate end) {
        long count = 0;
        LocalDate current = start;

        while (!current.isAfter(end)) {
            if (isBusinessDay(current)) {
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }
}
```

### Date Range Iteration

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Stream;

public class DateRangeIteration {
    public static void main(String[] args) {
        LocalDate startDate = LocalDate.of(2024, 3, 10);
        LocalDate endDate = LocalDate.of(2024, 3, 20);

        // Traditional iteration
        System.out.println("Traditional iteration:");
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            System.out.println(current);
            current = current.plusDays(1);
        }

        // Stream-based iteration (Java 9+)
        System.out.println("\nStream iteration:");
        startDate.datesUntil(endDate.plusDays(1))
            .forEach(System.out::println);

        // Collect to list
        List<LocalDate> dateList = startDate.datesUntil(endDate.plusDays(1))
            .toList();
        System.out.println("\nCollected dates: " + dateList.size());

        // Weekly iteration
        System.out.println("\nWeekly iteration:");
        startDate.datesUntil(endDate.plusDays(1), java.time.Period.ofWeeks(1))
            .forEach(System.out::println);

        // Monthly iteration
        LocalDate monthStart = LocalDate.of(2024, 1, 1);
        LocalDate monthEnd = LocalDate.of(2024, 12, 1);

        System.out.println("\nFirst day of each month:");
        monthStart.datesUntil(monthEnd.plusDays(1), java.time.Period.ofMonths(1))
            .forEach(System.out::println);
    }
}
```

## Legacy Date Conversion

Converting between the new `java.time` API and legacy `java.util.Date`/`Calendar` classes.

### Conversion Examples

```java
import java.time.*;
import java.util.Date;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;
import java.sql.Timestamp;

public class LegacyConversion {
    public static void main(String[] args) {
        // java.util.Date <-> Instant
        Date legacyDate = new Date();
        Instant instant = legacyDate.toInstant();
        Date fromInstant = Date.from(instant);

        System.out.println("Date to Instant: " + instant);
        System.out.println("Instant to Date: " + fromInstant);

        // java.util.Date <-> LocalDateTime (via Instant)
        LocalDateTime localDateTime = LocalDateTime.ofInstant(
            legacyDate.toInstant(),
            ZoneId.systemDefault()
        );
        Date fromLocalDateTime = Date.from(
            localDateTime.atZone(ZoneId.systemDefault()).toInstant()
        );

        System.out.println("\nDate to LocalDateTime: " + localDateTime);

        // Calendar <-> ZonedDateTime
        Calendar calendar = Calendar.getInstance();
        ZonedDateTime zonedDateTime = ZonedDateTime.ofInstant(
            calendar.toInstant(),
            calendar.getTimeZone().toZoneId()
        );

        GregorianCalendar gregorianCalendar = GregorianCalendar.from(zonedDateTime);

        System.out.println("\nCalendar to ZonedDateTime: " + zonedDateTime);

        // TimeZone <-> ZoneId
        TimeZone legacyTimeZone = TimeZone.getTimeZone("America/New_York");
        ZoneId zoneId = legacyTimeZone.toZoneId();
        TimeZone fromZoneId = TimeZone.getTimeZone(zoneId);

        System.out.println("\nTimeZone to ZoneId: " + zoneId);

        // java.sql.Date <-> LocalDate
        java.sql.Date sqlDate = java.sql.Date.valueOf(LocalDate.of(2024, 3, 15));
        LocalDate localDate = sqlDate.toLocalDate();

        System.out.println("\nSQL Date to LocalDate: " + localDate);

        // java.sql.Time <-> LocalTime
        java.sql.Time sqlTime = java.sql.Time.valueOf(LocalTime.of(14, 30, 45));
        LocalTime localTime = sqlTime.toLocalTime();

        System.out.println("SQL Time to LocalTime: " + localTime);

        // java.sql.Timestamp <-> LocalDateTime
        Timestamp timestamp = Timestamp.valueOf(LocalDateTime.of(2024, 3, 15, 14, 30, 45));
        LocalDateTime fromTimestamp = timestamp.toLocalDateTime();

        System.out.println("Timestamp to LocalDateTime: " + fromTimestamp);

        // java.sql.Timestamp <-> Instant
        Instant fromTimestampInstant = timestamp.toInstant();
        Timestamp fromInstantTimestamp = Timestamp.from(instant);

        System.out.println("Timestamp to Instant: " + fromTimestampInstant);
    }
}
```

### Utility Class for Conversion

```java
import java.time.*;
import java.util.Date;
import java.util.Calendar;

public class DateTimeConverter {

    // Date to LocalDate
    public static LocalDate toLocalDate(Date date) {
        return date.toInstant()
                   .atZone(ZoneId.systemDefault())
                   .toLocalDate();
    }

    // Date to LocalDateTime
    public static LocalDateTime toLocalDateTime(Date date) {
        return date.toInstant()
                   .atZone(ZoneId.systemDefault())
                   .toLocalDateTime();
    }

    // Date to ZonedDateTime
    public static ZonedDateTime toZonedDateTime(Date date, ZoneId zone) {
        return date.toInstant().atZone(zone);
    }

    // LocalDate to Date
    public static Date toDate(LocalDate localDate) {
        return Date.from(localDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    // LocalDateTime to Date
    public static Date toDate(LocalDateTime localDateTime) {
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }

    // ZonedDateTime to Date
    public static Date toDate(ZonedDateTime zonedDateTime) {
        return Date.from(zonedDateTime.toInstant());
    }

    // Calendar to LocalDateTime
    public static LocalDateTime toLocalDateTime(Calendar calendar) {
        return LocalDateTime.ofInstant(
            calendar.toInstant(),
            calendar.getTimeZone().toZoneId()
        );
    }

    // LocalDateTime to Calendar
    public static Calendar toCalendar(LocalDateTime localDateTime, ZoneId zone) {
        ZonedDateTime zdt = localDateTime.atZone(zone);
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(zdt.toInstant().toEpochMilli());
        return calendar;
    }

    public static void main(String[] args) {
        // Usage examples
        Date now = new Date();
        LocalDate localDate = toLocalDate(now);
        LocalDateTime localDateTime = toLocalDateTime(now);

        System.out.println("Original Date: " + now);
        System.out.println("LocalDate: " + localDate);
        System.out.println("LocalDateTime: " + localDateTime);

        // Convert back
        Date fromLocalDate = toDate(localDate);
        Date fromLocalDateTime = toDate(localDateTime);

        System.out.println("\nConverted back:");
        System.out.println("From LocalDate: " + fromLocalDate);
        System.out.println("From LocalDateTime: " + fromLocalDateTime);
    }
}
```

## Best Practices

### Choose the Right Type

```java
import java.time.*;

public class ChooseRightType {
    // Use LocalDate for dates without time
    private LocalDate birthDate;          // Good
    // private LocalDateTime birthDateTime;  // Unnecessary precision

    // Use LocalTime for time without date
    private LocalTime openingTime;        // Good

    // Use Instant for timestamps
    private Instant createdAt;            // Good
    // private LocalDateTime createdAt;     // Loses timezone info

    // Use ZonedDateTime for user-facing times across timezones
    private ZonedDateTime meetingTime;    // Good

    // Use Duration for time intervals
    private Duration sessionTimeout;      // Good
    // private long timeoutMillis;          // Less expressive

    // Use Period for date intervals
    private Period subscriptionPeriod;    // Good
}
```

### Always Use Immutability

```java
import java.time.LocalDate;

public class ImmutabilityExample {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2024, 3, 15);

        // Wrong: ignoring the return value
        date.plusDays(5);  // Returns new instance, original unchanged
        System.out.println(date);  // Still 2024-03-15

        // Correct: assign to new variable or same variable
        LocalDate newDate = date.plusDays(5);
        System.out.println(newDate);  // 2024-03-20

        date = date.plusDays(5);  // Reassign if you want to update
        System.out.println(date);  // 2024-03-20
    }
}
```

### Store in UTC, Display in Local Time

```java
import java.time.*;
import java.time.format.DateTimeFormatter;

public class UtcStorageExample {
    public static void main(String[] args) {
        // Store timestamps in UTC
        Instant createdAt = Instant.now();
        System.out.println("Stored (UTC): " + createdAt);

        // Display in user's timezone
        ZoneId userZone = ZoneId.of("America/New_York");
        ZonedDateTime userTime = createdAt.atZone(userZone);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");
        System.out.println("Display (user): " + userTime.format(formatter));

        // For database storage
        // Store as: createdAt.toEpochMilli() or createdAt.toString()
        // Retrieve as: Instant.ofEpochMilli(millis) or Instant.parse(string)
    }
}
```

### Use ISO-8601 for Serialization

```java
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class SerializationExample {
    public static void main(String[] args) {
        ZonedDateTime dateTime = ZonedDateTime.now();

        // ISO-8601 format for APIs and storage
        String isoFormat = dateTime.format(DateTimeFormatter.ISO_ZONED_DATE_TIME);
        System.out.println("ISO format: " + isoFormat);

        // Easy to parse back
        ZonedDateTime parsed = ZonedDateTime.parse(isoFormat);
        System.out.println("Parsed: " + parsed);

        // For JSON serialization, use ISO format
        // Jackson and other libraries support this out of the box
    }
}
```

### Handle Null Safely

```java
import java.time.LocalDate;
import java.util.Optional;

public class NullHandling {
    public static void main(String[] args) {
        LocalDate date = null;

        // Using Optional
        Optional<LocalDate> optionalDate = Optional.ofNullable(date);
        String formatted = optionalDate
            .map(d -> d.toString())
            .orElse("N/A");
        System.out.println("Date: " + formatted);

        // Null-safe comparison
        boolean isAfterToday = date != null && date.isAfter(LocalDate.now());

        // Default values
        LocalDate effectiveDate = date != null ? date : LocalDate.now();
    }
}
```

### Avoid Common Pitfalls

```java
import java.time.*;
import java.time.temporal.ChronoUnit;

public class CommonPitfalls {
    public static void main(String[] args) {
        // Pitfall 1: Month is 1-indexed (unlike Calendar)
        LocalDate jan = LocalDate.of(2024, 1, 15);  // January, not February

        // Pitfall 2: LocalDateTime.now() uses system timezone
        LocalDateTime local = LocalDateTime.now();
        // For specific timezone, use ZonedDateTime
        ZonedDateTime zoned = ZonedDateTime.now(ZoneId.of("UTC"));

        // Pitfall 3: Duration vs Period for date calculations
        LocalDate date = LocalDate.of(2024, 1, 31);
        // date.plus(Duration.ofDays(30));  // Works but ignores month boundaries
        LocalDate plusMonth = date.plusMonths(1);  // Correct: 2024-02-29

        // Pitfall 4: Daylight saving time
        ZoneId newYork = ZoneId.of("America/New_York");
        ZonedDateTime beforeDst = ZonedDateTime.of(2024, 3, 10, 1, 30, 0, 0, newYork);
        ZonedDateTime afterDst = beforeDst.plusHours(2);
        // Be aware: 2:00-3:00 AM doesn't exist on DST start

        // Pitfall 5: Comparing dates with different precisions
        LocalDateTime dt1 = LocalDateTime.of(2024, 3, 15, 10, 30, 0);
        LocalDateTime dt2 = LocalDateTime.of(2024, 3, 15, 10, 30, 0, 123);
        System.out.println("Equal: " + dt1.equals(dt2));  // false!
        System.out.println("Same minute: " +
            dt1.truncatedTo(ChronoUnit.MINUTES).equals(dt2.truncatedTo(ChronoUnit.MINUTES)));

        // Pitfall 6: Week starts on Monday in ISO
        LocalDate friday = LocalDate.of(2024, 3, 15);
        System.out.println("Day of week: " + friday.getDayOfWeek().getValue());  // 5 (Friday)
    }
}
```

### Use Clock for Testability

```java
import java.time.*;

public class TestabilityExample {
    private final Clock clock;

    // Constructor injection for testability
    public TestabilityExample(Clock clock) {
        this.clock = clock;
    }

    // Default constructor uses system clock
    public TestabilityExample() {
        this(Clock.systemDefaultZone());
    }

    public LocalDate getCurrentDate() {
        return LocalDate.now(clock);
    }

    public Instant getCurrentInstant() {
        return Instant.now(clock);
    }

    public boolean isExpired(LocalDate expiryDate) {
        return LocalDate.now(clock).isAfter(expiryDate);
    }

    public static void main(String[] args) {
        // Production usage
        TestabilityExample prod = new TestabilityExample();
        System.out.println("Current date: " + prod.getCurrentDate());

        // Testing with fixed clock
        Clock fixedClock = Clock.fixed(
            Instant.parse("2024-03-15T10:00:00Z"),
            ZoneId.of("UTC")
        );
        TestabilityExample test = new TestabilityExample(fixedClock);
        System.out.println("Fixed date: " + test.getCurrentDate());  // Always 2024-03-15

        // Testing expiry
        LocalDate expiryDate = LocalDate.of(2024, 3, 14);
        System.out.println("Is expired: " + test.isExpired(expiryDate));  // true
    }
}
```

## Summary

The Java Date Time API (`java.time`) provides a comprehensive, well-designed framework for handling dates, times, and timezones:

1. **Core Classes**: Choose the right class for your use case:
   - `LocalDate` for dates
   - `LocalTime` for times
   - `LocalDateTime` for date-times without timezone
   - `ZonedDateTime` for date-times with timezone
   - `Instant` for machine timestamps

2. **Immutability**: All classes are immutable and thread-safe. Always capture return values from modification methods.

3. **Formatting**: Use `DateTimeFormatter` for parsing and formatting. Prefer ISO-8601 format for serialization.

4. **Time Zones**: Use `ZoneId` and `ZonedDateTime` for timezone-aware operations. Be mindful of daylight saving time.

5. **Duration and Period**: Use `Duration` for time-based intervals and `Period` for date-based intervals.

6. **Temporal Adjusters**: Leverage built-in and custom adjusters for complex date calculations.

7. **Legacy Conversion**: Use provided conversion methods when working with legacy `Date` and `Calendar` classes.

8. **Best Practices**: Store in UTC, display in local time, use immutability, and design for testability with `Clock`.

The `java.time` API is the modern, preferred approach for all date and time operations in Java. Understanding its design principles and capabilities will help you write more correct, maintainable, and bug-free code.
