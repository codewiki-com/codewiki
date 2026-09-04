---
title: JavaScript Date Object and Date Manipulation
description: Comprehensive guide to JavaScript Date object, date manipulation techniques, timezone handling, formatting, and best practices for working with dates in modern JavaScript applications.
track: javascript
section: core
difficulty: intermediate
tags:
  - Date
  - Time
  - Timezone
  - Formatting
  - Manipulation
  - Temporal
  - Date Arithmetic
status: imported
origin: old/src/content/docs/javascript/date-object.en.md
divergence: 0.161
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Explanation

The JavaScript `Date` object is the built-in mechanism for handling dates and times in JavaScript. Introduced since the early days of the language, `Date` represents a single moment in time, typically expressed as milliseconds elapsed since January 1, 1970, 00:00:00 UTC (Unix Epoch).

### Historical Context

JavaScript's `Date` object was based on Java's `Date` class and inherits some of its design choices, both good and problematic. While the `Date` object has served as the primary date/time tool for decades, its limitations have led to the creation of numerous third-party libraries (Moment.js, date-fns, Day.js) and eventually the Stage 3 TC39 Temporal API proposal to replace it.

### Problems it Solves

- Capturing current time and specific moments in time
- Converting between different date/time representations
- Date arithmetic and calculations
- Time zone handling (with limitations)
- Scheduling and timing operations

## Core Principles

### Unix Epoch and Internal Representation

Internally, `Date` stores time as milliseconds since January 1, 1970, 00:00:00 UTC. This approach:
- Allows simple arithmetic operations
- Enables efficient comparison between dates
- Provides a standardized reference point

```javascript
// Get internal millisecond value
const date = new Date('2024-01-01');
console.log(date.getTime()); // 1704067200000
```

### Dual Nature: Local vs UTC

The `Date` object operates in two contexts:
- **UTC Methods**: `getUTCFullYear()`, `getUTCMonth()`, etc. - return values in UTC
- **Local Methods**: `getFullYear()`, `getMonth()`, etc. - return values in the browser's local timezone

This dual nature can be confusing but is essential for proper timezone handling.

### Month Index (0-based)

Months are zero-indexed (0 = January, 11 = December), which is a common source of bugs:

```javascript
// January is month 0, not 1
new Date(2024, 0, 1); // January 1, 2024
new Date(2024, 11, 25); // December 25, 2024
```

### Timezone Limitations

JavaScript's `Date` object has significant limitations:
- Cannot explicitly set timezone for a date
- Cannot properly handle daylight saving time transitions
- Time zone information is not part of the Date object
- All operations that return components use the **browser's local timezone**

### Immutability Approach

While `Date` objects are mutable (you can call setter methods), it's best practice to treat them as immutable. Libraries like date-fns and Temporal encourage immutable patterns.

## Key Points

### Date Creation Methods

| Method | Description | Example |
|--------|-------------|---------|
| `new Date()` | Current date and time | `new Date()` |
| `new Date(ms)` | From milliseconds since epoch | `new Date(1704067200000)` |
| `new Date(dateString)` | From ISO string or other formats | `new Date('2024-01-01T12:00:00Z')` |
| `new Date(year, month, day, ...)` | From components | `new Date(2024, 0, 1, 12, 30, 0)` |
| `Date.parse()` | Parse string, return milliseconds | `Date.parse('2024-01-01')` |
| `Date.now()` | Current timestamp in ms | `Date.now()` |

### Getting Date Components

- `getFullYear()` / `getUTCFullYear()` - Year (4 digits)
- `getMonth()` / `getUTCMonth()` - Month (0-11)
- `getDate()` / `getUTCDate()` - Day of month (1-31)
- `getDay()` / `getUTCDay()` - Day of week (0-6, 0 = Sunday)
- `getHours()` / `getUTCHours()` - Hour (0-23)
- `getMinutes()` / `getUTCMinutes()` - Minute (0-59)
- `getSeconds()` / `getUTCSeconds()` - Second (0-59)
- `getMilliseconds()` / `getUTCMilliseconds()` - Millisecond (0-999)
- `getTime()` - Milliseconds since epoch
- `getTimezoneOffset()` - Offset in minutes from UTC

### Common Pitfalls at a Glance

1. **Month indexing**: Months are 0-based
2. **Mutability**: Calling setter methods modifies the original object
3. **Timezone assumptions**: Can't guarantee timezone handling
4. **DST transitions**: Not properly handled
5. **Parsing inconsistencies**: Different browsers parse date strings differently
6. **Invalid dates**: `new Date('invalid')` creates Invalid Date object (doesn't throw)

## Code Examples

### Basic Date Creation and Display

```javascript
// Creating dates in different ways
const now = new Date();
console.log(now); // Current date and time

// From ISO string (most reliable)
const isoDate = new Date('2024-01-15T10:30:00Z');
console.log(isoDate); // Parsed as UTC

// From components (month is 0-indexed)
const specificDate = new Date(2024, 0, 15, 10, 30, 0, 0);
console.log(specificDate); // January 15, 2024, 10:30:00 local time

// From timestamp
const fromTimestamp = new Date(1705319400000);
console.log(fromTimestamp);

// Utility: Get current timestamp in milliseconds
const timestamp = Date.now();
console.log(timestamp);
```

### Extracting Date Components

```javascript
const date = new Date('2024-01-15T14:30:45.123Z');

// Get components (local timezone)
console.log(date.getFullYear()); // 2024
console.log(date.getMonth()); // 0 (January, remember it's 0-indexed)
console.log(date.getDate()); // 15
console.log(date.getDay()); // 1 (Monday, 0 = Sunday)
console.log(date.getHours()); // Depends on local timezone
console.log(date.getMinutes()); // 30
console.log(date.getSeconds()); // 45
console.log(date.getMilliseconds()); // 123

// Get UTC components (always UTC)
console.log(date.getUTCFullYear()); // 2024
console.log(date.getUTCMonth()); // 0
console.log(date.getUTCDate()); // 15
console.log(date.getUTCHours()); // 14

// Get timezone offset in minutes
console.log(date.getTimezoneOffset()); // e.g., -300 (UTC-5)
```

### Date Arithmetic

```javascript
// Create a date
const date = new Date('2024-01-15');

// Add days by manipulating milliseconds
const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
console.log(tomorrow);

// Add months (be careful with edge cases)
const nextMonth = new Date(date);
nextMonth.setMonth(nextMonth.getMonth() + 1);
console.log(nextMonth);

// Add years
const nextYear = new Date(date);
nextYear.setFullYear(nextYear.getFullYear() + 1);
console.log(nextYear);

// Calculate difference between dates (in milliseconds)
const date1 = new Date('2024-01-15');
const date2 = new Date('2024-01-20');
const diffMs = date2.getTime() - date1.getTime();
const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
console.log(`Difference: ${diffDays} days`); // 5 days

// Calculate age in years
function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

const birthDate = new Date('1990-05-15');
console.log(calculateAge(birthDate)); // Accurate age calculation
```

### Formatting Dates

```javascript
const date = new Date('2024-01-15T14:30:45.123Z');

// Built-in string methods
console.log(date.toString()); // Thu Jan 15 2024 09:30:45 GMT-0500
console.log(date.toUTCString()); // Mon, 15 Jan 2024 14:30:45 GMT
console.log(date.toISOString()); // 2024-01-15T14:30:45.123Z
console.log(date.toLocaleDateString()); // 1/15/2024 (locale-dependent)
console.log(date.toLocaleTimeString()); // 9:30:45 AM (locale-dependent)
console.log(date.toLocaleString()); // 1/15/2024, 9:30:45 AM

// Custom formatting with toLocaleString options
const options = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC'
};
console.log(date.toLocaleString('en-US', options));
// Output: Monday, January 15, 2024, 14:30:45

// Custom formatting function
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const pad = (n) => String(n).padStart(2, '0');

  const replacements = {
    'YYYY': date.getFullYear(),
    'MM': pad(date.getMonth() + 1),
    'DD': pad(date.getDate()),
    'HH': pad(date.getHours()),
    'mm': pad(date.getMinutes()),
    'ss': pad(date.getSeconds())
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
}

console.log(formatDate(date)); // 2024-01-15 14:30:45 (UTC, may vary by timezone)
console.log(formatDate(date, 'DD/MM/YYYY')); // 15/01/2024
```

### Parsing Dates (with caution)

```javascript
// ISO 8601 format (most reliable, always UTC)
const isoDate = new Date('2024-01-15T14:30:45Z');
console.log(isoDate);

// Date string parsing (browser-dependent, varies)
// AVOID THIS - behavior is inconsistent across browsers
const ambiguousDate = new Date('01/15/2024'); // May be interpreted as MM/DD/YYYY or DD/MM/YYYY

// Safe parsing: use Date.parse() with ISO format or provide components
const timestamp = Date.parse('2024-01-15T14:30:45Z');
console.log(new Date(timestamp));

// Parse with explicit components
const [year, month, day] = '2024-01-15'.split('-');
const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
console.log(parsedDate);

// Validate if a date is valid
function isValidDate(date) {
  return date instanceof Date && !isNaN(date);
}

console.log(isValidDate(new Date())); // true
console.log(isValidDate(new Date('invalid'))); // false
console.log(isValidDate('not a date')); // false
```

### Timezone Considerations

```javascript
// JavaScript's timezone handling is limited
// It works with the browser's local timezone

// Get browser's timezone offset
const offset = new Date().getTimezoneOffset();
console.log(`Browser timezone offset: ${offset} minutes`);
// Negative means ahead of UTC, positive means behind

// Approximate timezone name (unreliable)
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(timeZone); // e.g., 'America/New_York'

// Create UTC date and convert to local string
const utcDate = new Date('2024-01-15T14:30:00Z');
console.log(utcDate.getUTCHours()); // 14 (always UTC)
console.log(utcDate.getHours()); // Depends on local timezone

// Manual timezone offset calculation
function addTimezoneOffset(date, offsetHours) {
  return new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
}

const baseDate = new Date('2024-01-15T12:00:00Z');
const tokyoDate = addTimezoneOffset(baseDate, 9); // UTC+9
console.log(tokyoDate); // Shows local time, not Tokyo time (limitation)

// Note: For proper timezone support, use libraries like date-fns-tz or Temporal API
```

### Advanced: Date Ranges and Comparisons

```javascript
// Compare dates
const date1 = new Date('2024-01-15');
const date2 = new Date('2024-01-20');

console.log(date1 < date2); // true
console.log(date1 > date2); // false
console.log(date1.getTime() === date2.getTime()); // false

// Check if date is today
function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

// Check if date is in the past
function isPast(date) {
  return date < new Date();
}

// Check if date is in the future
function isFuture(date) {
  return date > new Date();
}

// Get date range (all dates between two dates)
function getDatesInRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

const start = new Date('2024-01-15');
const end = new Date('2024-01-20');
const range = getDatesInRange(start, end);
console.log(range.length); // 6 dates inclusive

// Get last day of month
function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

console.log(getLastDayOfMonth(new Date('2024-01-15'))); // January 31, 2024

// Get first day of month
function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

console.log(getFirstDayOfMonth(new Date('2024-01-15'))); // January 1, 2024
```

### Practical Example: Event Countdown

```javascript
function createCountdown(targetDate) {
  const target = new Date(targetDate).getTime();

  function update() {
    const now = Date.now();
    const remaining = target - now;

    if (remaining <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        finished: true
      };
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, finished: false };
  }

  return { update };
}

// Usage
const countdown = createCountdown('2025-12-31T23:59:59Z');
console.log(countdown.update()); // { days: 358, hours: 8, minutes: 29, seconds: 15, finished: false }
```

## Best Practices

### Always Use ISO 8601 Format for Date Strings

```javascript
// GOOD - ISO 8601 format is standardized and reliable
const date = new Date('2024-01-15T14:30:00Z');

// AVOID - Ambiguous and browser-dependent
const date = new Date('01/15/2024');
const date = new Date('January 15, 2024');
```

### Remember Month Indexing

```javascript
// GOOD - Be explicit about month indexing
const date = new Date(2024, 0, 15); // Month 0 = January

// BETTER - Use named constant or comment
const JANUARY = 0;
const date = new Date(2024, JANUARY, 15);

// BEST - Use ISO string to avoid confusion
const date = new Date('2024-01-15');
```

### Work with UTC When Possible

```javascript
// GOOD - Work with UTC timestamps for calculations
const date1 = new Date('2024-01-15T14:30:00Z');
const date2 = new Date('2024-01-20T14:30:00Z');
const diffMs = date2.getTime() - date1.getTime();

// Use getUTC* methods when you need specific values
console.log(date1.getUTCHours()); // Always 14, regardless of local timezone
```

### Treat Date Objects as Immutable

```javascript
// GOOD - Create new Date object instead of mutating
const originalDate = new Date('2024-01-15');
const nextDay = new Date(originalDate);
nextDay.setDate(nextDay.getDate() + 1);

// AVOID - Don't mutate the original
originalDate.setDate(originalDate.getDate() + 1);
```

### Validate Date Input

```javascript
function safeParseDate(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return date;
}

try {
  const date = safeParseDate('2024-01-15');
  console.log(date);
} catch (error) {
  console.error(error.message);
}
```

### Use toLocaleString() for User-Facing Dates

```javascript
// GOOD - Automatically formats based on user's locale
const date = new Date();
console.log(date.toLocaleString()); // Formatted for user's location

// For consistent formatting, use options
const options = {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
};
console.log(date.toLocaleString('en-US', options)); // January 15, 2024
```

### Consider Using Date Libraries for Complex Operations

```javascript
// For serious date manipulation, consider:
// - date-fns: Functional, immutable, tree-shakeable
// - Day.js: Lightweight Moment.js alternative
// - Temporal API (future): Native replacement for Date

// Example with date-fns (hypothetical)
// import { addDays, format } from 'date-fns';
// const tomorrow = addDays(new Date(), 1);
// console.log(format(tomorrow, 'yyyy-MM-dd'));
```

## Common Pitfalls

### Month Indexing Confusion

```javascript
// PITFALL - Creating wrong date due to 0-based month
const wrongDate = new Date(2024, 1, 15); // February 15, not January 15
const correctDate = new Date(2024, 0, 15); // January 15

// Better alternative
const betterDate = new Date('2024-01-15');
```

### Assuming Consistent Date String Parsing

```javascript
// PITFALL - This may parse differently in different browsers/engines
new Date('01/15/2024'); // MM/DD/YYYY in US, DD/MM/YYYY elsewhere

// SOLUTION - Use ISO format
new Date('2024-01-15T00:00:00Z');
```

### Invalid Date Objects Don't Throw

```javascript
// PITFALL - No error thrown, just creates Invalid Date
const invalidDate = new Date('not a date');
console.log(invalidDate); // Invalid Date
console.log(invalidDate.getFullYear()); // NaN

// SOLUTION - Always validate
if (isNaN(invalidDate.getTime())) {
  console.error('Invalid date provided');
}
```

### Mutating Date Objects

```javascript
// PITFALL - Unexpected mutations
function addDays(date, days) {
  date.setDate(date.getDate() + days); // Mutates the original!
  return date;
}

const original = new Date('2024-01-15');
const modified = addDays(original, 5);
console.log(original); // Also January 20! (unexpected)

// SOLUTION - Create new date
function addDaysImmutably(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

const original2 = new Date('2024-01-15');
const modified2 = addDaysImmutably(original2, 5);
console.log(original2); // Still January 15 (expected)
console.log(modified2); // January 20
```

### Timezone Assumptions

```javascript
// PITFALL - Assuming timezone behavior
const date = new Date('2024-01-15T14:30:00');
// Is this UTC or local? Answer: Treated as local by most browsers!

// SOLUTION - Be explicit with Z for UTC
const utcDate = new Date('2024-01-15T14:30:00Z');
console.log(utcDate.getUTCHours()); // 14 (definitely UTC)
```

### Month Boundary Errors

```javascript
// PITFALL - Adding months can jump dates unexpectedly
const date = new Date(2024, 0, 31); // January 31
date.setMonth(date.getMonth() + 1);
console.log(date); // March 2, not February 31 (doesn't exist!)

// SOLUTION - Handle month boundaries explicitly
function addMonthsSafely(date, months) {
  const newDate = new Date(date);
  const originalDay = newDate.getDate();

  newDate.setMonth(newDate.getMonth() + months);

  // If day exceeds days in month, it rolls over
  // Go to last day of intended month
  if (newDate.getDate() !== originalDay && originalDay > 28) {
    newDate.setDate(0); // Last day of previous month
  }

  return newDate;
}
```

### Daylight Saving Time Transitions

```javascript
// PITFALL - DST transitions cause unexpected hour differences
// On DST transition days, adding 24 hours may not equal 1 day

const beforeDST = new Date(2024, 2, 10, 12, 0, 0); // Before spring DST
const afterAdding24h = new Date(beforeDST.getTime() + 24 * 60 * 60 * 1000);
const afterAdding1Day = new Date(beforeDST);
afterAdding1Day.setDate(afterAdding1Day.getDate() + 1);

console.log(afterAdding24h.getHours()); // May be 13, not 12
console.log(afterAdding1Day.getHours()); // Likely 12 (correct)

// BEST SOLUTION - Use date libraries that handle DST properly
// Or use Temporal API when available
```

## Performance Considerations

### Date Object Creation Cost

```javascript
// Creating many Date objects can be expensive
// Benchmark: Creating 10,000 Date objects

// SLOW - Creates new Date for each iteration
for (let i = 0; i < 10000; i++) {
  const date = new Date();
  // Use date
}

// FASTER - Store once, reuse
const now = Date.now();
for (let i = 0; i < 10000; i++) {
  // Use now for calculations
}
```

### String Parsing Performance

```javascript
// Date.parse() is relatively slow
// Benchmark: Parsing 10,000 date strings

// SLOWER - Parsing strings repeatedly
for (let i = 0; i < 10000; i++) {
  const date = new Date('2024-01-15T14:30:00Z');
}

// FASTER - Parse once, reuse timestamp
const timestamp = Date.parse('2024-01-15T14:30:00Z');
for (let i = 0; i < 10000; i++) {
  const date = new Date(timestamp);
}
```

### toLocaleString() Performance

```javascript
// toLocaleString() with options can be slow, especially in loops

// SLOWER - Called repeatedly
for (let i = 0; i < 1000; i++) {
  const formatted = date.toLocaleString('en-US', options);
}

// FASTER - Cache formatter
const formatter = new Intl.DateTimeFormat('en-US', options);
for (let i = 0; i < 1000; i++) {
  const formatted = formatter.format(date);
}
```

### Avoid Extensive Date Arithmetic in Loops

```javascript
// SLOW - Repeated object creation and mutation
function getDatesInRange(start, end) {
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current)); // Creates new object each iteration
    current.setDate(current.getDate() + 1); // Mutation
  }

  return dates;
}

// FASTER - Work with timestamps
function getDatesInRangeOptimized(start, end) {
  const dates = [];
  const startMs = start.getTime();
  const endMs = end.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let ms = startMs; ms <= endMs; ms += dayMs) {
    dates.push(new Date(ms));
  }

  return dates;
}
```

## Real-world Scenarios

### User Activity Timestamps

```javascript
class ActivityLog {
  constructor() {
    this.activities = [];
  }

  logActivity(type, data) {
    this.activities.push({
      type,
      data,
      timestamp: Date.now(), // Store as milliseconds for efficiency
      createdAt: new Date()
    });
  }

  getActivitySince(hours) {
    const thresholdMs = Date.now() - (hours * 60 * 60 * 1000);
    return this.activities.filter(a => a.timestamp >= thresholdMs);
  }

  getFormattedActivities() {
    return this.activities.map(a => ({
      ...a,
      displayTime: new Date(a.timestamp).toLocaleString()
    }));
  }
}
```

### Event Scheduling

```javascript
class EventScheduler {
  constructor() {
    this.events = [];
  }

  scheduleEvent(title, dateString, durationMinutes) {
    const startTime = new Date(dateString);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    this.events.push({
      title,
      startTime,
      endTime,
      durationMinutes
    });
  }

  getUpcomingEvents(daysAhead = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.events.filter(e => e.startTime > now && e.startTime <= future);
  }

  hasConflict(newEvent) {
    return this.events.some(e =>
      (newEvent.startTime < e.endTime && newEvent.endTime > e.startTime)
    );
  }
}
```

### Recurring Events (Cron-like)

```javascript
class RecurringEvent {
  constructor(title, startDate, interval, unit) {
    this.title = title;
    this.startDate = new Date(startDate);
    this.interval = interval;
    this.unit = unit; // 'day', 'week', 'month', 'year'
  }

  getNextOccurrence() {
    const next = new Date(this.startDate);

    switch (this.unit) {
      case 'day':
        next.setDate(next.getDate() + this.interval);
        break;
      case 'week':
        next.setDate(next.getDate() + this.interval * 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + this.interval);
        break;
      case 'year':
        next.setFullYear(next.getFullYear() + this.interval);
        break;
    }

    return next;
  }

  getOccurrencesInRange(startDate, endDate) {
    const occurrences = [];
    let current = new Date(this.startDate);

    while (current <= endDate) {
      if (current >= startDate) {
        occurrences.push(new Date(current));
      }
      current = this.getNextOccurrence();
    }

    return occurrences;
  }
}

// Usage
const weeklyMeeting = new RecurringEvent(
  'Team Standup',
  '2024-01-15T10:00:00Z',
  1,
  'week'
);

const meetings = weeklyMeeting.getOccurrencesInRange(
  new Date('2024-01-01'),
  new Date('2024-03-01')
);
```

### Date Range Selection (Date Picker)

```javascript
class DateRangePicker {
  constructor(startDate, endDate) {
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
  }

  getDaysInRange() {
    const days = [];
    const current = new Date(this.startDate);

    while (current <= this.endDate) {
      days.push({
        date: new Date(current),
        isWeekend: [0, 6].includes(current.getDay()),
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: current.getDate()
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  getWeekStarting(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  isValidRange() {
    return this.startDate <= this.endDate;
  }

  getRangeDurationDays() {
    const diff = this.endDate.getTime() - this.startDate.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
  }
}
```

## Interview Points

### Common Interview Questions

1. **"Explain how JavaScript's Date object works internally."**
   - Answer: Date stores time as milliseconds since January 1, 1970 UTC (Unix Epoch). This is stored as a single number internally, allowing efficient arithmetic and comparisons.

2. **"Why are months 0-indexed in JavaScript?"**
   - Answer: This is a legacy design choice inherited from Java's Date class. It's consistently 0-11 (January to December), which was intended to match array indexing but often confuses developers.

3. **"What are the limitations of JavaScript's Date object?"**
   - Answer: Key limitations include:
     - No native timezone support (only browser's local timezone)
     - Poor daylight saving time handling
     - Inconsistent date string parsing across browsers
     - Mutable design
     - No proper date range or duration handling
     - These limitations led to libraries like Moment.js and the Temporal API proposal

4. **"How do you safely parse a date string?"**
   - Answer: Always use ISO 8601 format with explicit Z for UTC: `new Date('2024-01-15T14:30:00Z')`. Avoid ambiguous formats that vary by browser and locale.

5. **"What's the difference between `getMonth()` and `getUTCMonth()`?"**
   - Answer: `getMonth()` returns the month in the browser's local timezone, while `getUTCMonth()` always returns the month in UTC. Both use 0-11 indexing.

6. **"How do you calculate the difference between two dates?"**
   - Answer: Get the timestamp difference using `getTime()` and convert to desired units:
     ```javascript
     const diffMs = date2.getTime() - date1.getTime();
     const diffDays = diffMs / (24 * 60 * 60 * 1000);
     ```

7. **"Explain the pitfall with adding months to a date."**
   - Answer: When adding months to a date like January 31, if you set the month to February, the date rolls over to March 2-3 because February doesn't have 31 days. You must handle month boundary cases.

8. **"Why shouldn't you mutate Date objects?"**
   - Answer: Mutating Date objects with setter methods makes code harder to reason about and can cause bugs when the same Date instance is shared across code. Creating new Date objects maintains immutability.

9. **"What happens with daylight saving time transitions?"**
   - Answer: When DST transitions occur, adding 24 hours in milliseconds may not equal one calendar day. Subtracting hours near DST transitions can give unexpected results. Proper handling requires date libraries.

10. **"How would you implement a countdown timer?"**
    - Answer: Calculate the difference between target time and current time, update every second, and convert milliseconds to days/hours/minutes/seconds.

## Further Reading

### Official Documentation
- [MDN: Date Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [TC39 Temporal Proposal](https://tc39.es/proposal-temporal/)

### Recommended Libraries
- [date-fns](https://date-fns.org/) - Functional, immutable, modular date library
- [Day.js](https://day.js.org/) - Lightweight alternative to Moment.js
- [Moment.js](https://momentjs.com/) - Comprehensive but larger library (consider date-fns or Day.js for new projects)
- [luxon](https://moment.github.io/luxon/) - Modern datetime library with native timezone support
- [js-joda](https://js-joda.github.io/js-joda/) - JavaScript port of Java's date/time library

### Related Topics
- [ECMAScript Date/Time Specifications](https://tc39.es/ecma262/#sec-date-objects)
- [ISO 8601 Standard](https://en.wikipedia.org/wiki/ISO_8601)
- [Unix Time](https://en.wikipedia.org/wiki/Unix_time)
- [IANA Time Zone Database](https://www.iana.org/time-zones)

### Best Practices Guides
- "JavaScript: The Good Parts" by Douglas Crockford - Chapter on working with dates
- "You Don't Know JS" series - Async & Performance book covers timing and scheduling
- [Google Chrome DevTools - Performance](https://developer.chrome.com/docs/devtools/performance/)

### Articles and Tutorials
- "Everything You Need to Know About Date in JavaScript" - Blog posts on date-fns site
- "Understanding JavaScript Timezones" - Various medium articles
- "Temporal Cookbook" - Once Temporal API is standardized (preview available on TC39 site)
