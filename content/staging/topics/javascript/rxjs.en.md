---
title: RxJS Reactive Programming
description: Master RxJS for reactive programming and async data stream handling
track: javascript
section: patterns-tooling
difficulty: advanced
tags:
  - RxJS
  - reactive programming
  - Observable
  - async
status: imported
origin: old/src/content/docs/frontend/rxjs.en.md
divergence: 0.213
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: Libraries
  order: 34
  lastUpdated: 2026-01-07
---

## What is Reactive Programming

### Understanding Reactive Programming

Reactive programming is a programming paradigm that focuses on data streams and the propagation of change. Instead of writing code that explicitly handles individual events or values, you define relationships between data sources and transformations that automatically update when the underlying data changes.

```javascript
// Traditional imperative approach
let a = 1;
let b = 2;
let c = a + b; // c = 3

a = 5;
console.log(c); // Still 3 - c doesn't automatically update

// Reactive approach (conceptual)
// When a or b changes, c automatically recalculates
```

### Why Use RxJS

RxJS (Reactive Extensions for JavaScript) provides a powerful way to handle asynchronous operations and event-based programs using observable sequences. Key benefits include:

1. **Unified API**: Handle clicks, HTTP requests, WebSocket messages, and timers with the same patterns
2. **Composability**: Chain operations together to create complex data flows
3. **Cancellation**: Built-in support for canceling async operations
4. **Error Handling**: Comprehensive error handling across async streams
5. **Backpressure**: Control how fast data flows through your application

```javascript
import { fromEvent, interval } from 'rxjs';
import { map, filter, throttleTime, takeUntil } from 'rxjs/operators';

// Handle mouse clicks with throttling
const clicks$ = fromEvent(document, 'click').pipe(
  throttleTime(1000),
  map(event => ({ x: event.clientX, y: event.clientY }))
);

clicks$.subscribe(pos => console.log('Click at:', pos));
```

## Core Concepts

### Observables

An Observable is a lazy collection of values over time. Unlike Promises that handle single values, Observables can emit multiple values. They are "lazy" because they don't start emitting values until someone subscribes.

```javascript
import { Observable } from 'rxjs';

// Creating an Observable from scratch
const numbers$ = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);

  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

// The Observable doesn't execute until subscribed
console.log('Before subscription');

numbers$.subscribe({
  next: value => console.log('Received:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete!')
});

// Output:
// Before subscription
// Received: 1
// Received: 2
// Received: 3
// (after 1 second)
// Received: 4
// Complete!
```

### Observers

An Observer is a consumer of values delivered by an Observable. It's an object with three optional callback methods:

```javascript
// Full Observer object
const observer = {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete')
};

observable$.subscribe(observer);

// Shorthand - passing callbacks directly
observable$.subscribe(
  value => console.log('Next:', value),
  err => console.error('Error:', err),
  () => console.log('Complete')
);

// Most common - just the next handler
observable$.subscribe(value => console.log('Value:', value));
```

### Subscriptions

A Subscription represents the execution of an Observable. It's primarily used for canceling the execution.

```javascript
import { interval } from 'rxjs';

const numbers$ = interval(1000);

const subscription = numbers$.subscribe(n => console.log('Number:', n));

// Cancel after 5 seconds
setTimeout(() => {
  subscription.unsubscribe();
  console.log('Unsubscribed!');
}, 5000);

// Managing multiple subscriptions
import { Subscription } from 'rxjs';

const parentSubscription = new Subscription();

parentSubscription.add(
  interval(1000).subscribe(n => console.log('First:', n))
);

parentSubscription.add(
  interval(2000).subscribe(n => console.log('Second:', n))
);

// Unsubscribe from all at once
setTimeout(() => {
  parentSubscription.unsubscribe();
}, 5000);
```

### Operators

Operators are pure functions that transform, filter, or combine Observables. They take an Observable as input and return a new Observable.

```javascript
import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const numbers$ = of(1, 2, 3, 4, 5);

const result$ = numbers$.pipe(
  filter(n => n % 2 === 0),
  map(n => n * 10)
);

result$.subscribe(console.log);
// Output: 20, 40
```

## Creating Observables

### Creation Operators

RxJS provides many ways to create Observables from different sources:

```javascript
import {
  of,
  from,
  interval,
  timer,
  fromEvent,
  range,
  generate,
  defer
} from 'rxjs';

// of - emit provided values synchronously
const values$ = of(1, 2, 3, 'a', 'b', 'c');
values$.subscribe(console.log); // 1, 2, 3, 'a', 'b', 'c'

// from - convert arrays, promises, iterables to Observable
const array$ = from([1, 2, 3]);
const promise$ = from(fetch('/api/data'));
const iterable$ = from('Hello'); // H, e, l, l, o

// interval - emit sequential numbers at specified interval
const everySecond$ = interval(1000);
// 0, 1, 2, 3, ... (every second)

// timer - emit after delay, then optionally at intervals
const afterDelay$ = timer(3000); // Emit 0 after 3 seconds
const delayThenInterval$ = timer(3000, 1000); // After 3s, emit every 1s

// fromEvent - create Observable from DOM events
const clicks$ = fromEvent(document, 'click');
const keyups$ = fromEvent(document, 'keyup');

// range - emit a sequence of numbers
const range$ = range(1, 10); // 1, 2, 3, ..., 10

// generate - like a for loop
const generated$ = generate(
  0,              // initial state
  x => x < 10,   // condition
  x => x + 1,    // iterate
  x => x * 2     // result selector
);
// 0, 2, 4, 6, 8, 10, 12, 14, 16, 18

// defer - create Observable lazily on subscription
const deferred$ = defer(() => {
  return of(new Date().getTime());
});
// Each subscription gets current timestamp
```

### Creating Custom Observables

```javascript
import { Observable } from 'rxjs';

// WebSocket Observable
function createWebSocket(url) {
  return new Observable(subscriber => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onmessage = event => {
      subscriber.next(JSON.parse(event.data));
    };

    socket.onerror = error => {
      subscriber.error(error);
    };

    socket.onclose = () => {
      subscriber.complete();
    };

    // Cleanup function - called on unsubscribe
    return () => {
      socket.close();
    };
  });
}

const messages$ = createWebSocket('wss://api.example.com/ws');

const subscription = messages$.subscribe({
  next: msg => console.log('Message:', msg),
  error: err => console.error('Error:', err),
  complete: () => console.log('Connection closed')
});

// Later: close connection
subscription.unsubscribe();
```

### From Promises and Callbacks

```javascript
import { from, bindCallback, bindNodeCallback } from 'rxjs';

// Converting Promises
const fetchUser$ = from(fetch('/api/user').then(r => r.json()));

// Converting callback-based functions
// Standard callback (result as last argument)
const boundFn = bindCallback(someCallbackFunction);
boundFn(arg1, arg2).subscribe(result => console.log(result));

// Node.js style callback (error, result)
const readFile$ = bindNodeCallback(fs.readFile);
readFile$('file.txt', 'utf8').subscribe({
  next: content => console.log(content),
  error: err => console.error(err)
});
```

## Subjects

### What are Subjects

A Subject is both an Observable and an Observer. It can multicast values to multiple subscribers and allows you to push values into the stream programmatically.

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

// Subscribe multiple observers
subject.subscribe(value => console.log('Observer A:', value));
subject.subscribe(value => console.log('Observer B:', value));

// Push values
subject.next(1);
subject.next(2);

// Output:
// Observer A: 1
// Observer B: 1
// Observer A: 2
// Observer B: 2
```

### BehaviorSubject

BehaviorSubject stores the current value and emits it immediately to new subscribers.

```javascript
import { BehaviorSubject } from 'rxjs';

// Requires an initial value
const subject = new BehaviorSubject('Initial Value');

subject.subscribe(value => console.log('Observer A:', value));
// Immediately logs: Observer A: Initial Value

subject.next('Second Value');
// Observer A: Second Value

// New subscriber gets current value immediately
subject.subscribe(value => console.log('Observer B:', value));
// Immediately logs: Observer B: Second Value

// Get current value synchronously
console.log('Current:', subject.getValue());
// Current: Second Value
```

### ReplaySubject

ReplaySubject records multiple values and replays them to new subscribers.

```javascript
import { ReplaySubject } from 'rxjs';

// Replay last 3 values
const subject = new ReplaySubject(3);

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

// New subscriber receives last 3 values
subject.subscribe(value => console.log('Observer:', value));
// Observer: 2
// Observer: 3
// Observer: 4

// With time window - replay values from last 500ms
const timedSubject = new ReplaySubject(100, 500);
```

### AsyncSubject

AsyncSubject only emits the last value, and only when the Observable completes.

```javascript
import { AsyncSubject } from 'rxjs';

const subject = new AsyncSubject();

subject.subscribe(value => console.log('Observer A:', value));

subject.next(1);
subject.next(2);
subject.next(3);

// Nothing logged yet

subject.complete();
// Now logs: Observer A: 3

// New subscriber after complete also gets last value
subject.subscribe(value => console.log('Observer B:', value));
// Observer B: 3
```

### Practical Subject Examples

```javascript
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// State management with BehaviorSubject
class Store {
  private state$ = new BehaviorSubject({
    user: null,
    isLoading: false,
    items: []
  });

  // Select specific state slice
  select(selector) {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // Update state
  setState(partial) {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial
    });
  }

  // Get current state
  getState() {
    return this.state$.getValue();
  }
}

const store = new Store();

// Subscribe to specific state changes
store.select(state => state.user).subscribe(user => {
  console.log('User changed:', user);
});

store.select(state => state.isLoading).subscribe(loading => {
  console.log('Loading:', loading);
});

// Update state
store.setState({ isLoading: true });
store.setState({ user: { name: 'John' } });
store.setState({ isLoading: false });
```

## Essential Operators

### Transformation Operators

```javascript
import { of, from, interval } from 'rxjs';
import {
  map,
  pluck,
  mapTo,
  scan,
  reduce,
  buffer,
  bufferTime
} from 'rxjs/operators';

// map - transform each value
of(1, 2, 3).pipe(
  map(x => x * 10)
).subscribe(console.log); // 10, 20, 30

// pluck - extract nested property
const users$ = of(
  { name: 'John', address: { city: 'NYC' } },
  { name: 'Jane', address: { city: 'LA' } }
);
users$.pipe(
  pluck('address', 'city')
).subscribe(console.log); // NYC, LA

// scan - accumulator that emits each intermediate result
of(1, 2, 3, 4, 5).pipe(
  scan((acc, value) => acc + value, 0)
).subscribe(console.log); // 1, 3, 6, 10, 15

// reduce - like scan but only emits final result
of(1, 2, 3, 4, 5).pipe(
  reduce((acc, value) => acc + value, 0)
).subscribe(console.log); // 15

// buffer - collect values until signal emits
const clicks$ = fromEvent(document, 'click');
clicks$.pipe(
  buffer(interval(1000)) // Collect clicks every second
).subscribe(clicksArray => {
  console.log(`${clicksArray.length} clicks in last second`);
});

// bufferTime - collect values for specified duration
interval(100).pipe(
  bufferTime(1000)
).subscribe(values => {
  console.log('Values in last second:', values);
});
```

### Filtering Operators

```javascript
import { of, interval, fromEvent } from 'rxjs';
import {
  filter,
  take,
  takeUntil,
  takeWhile,
  skip,
  skipUntil,
  first,
  last,
  distinct,
  distinctUntilChanged,
  debounceTime,
  throttleTime
} from 'rxjs/operators';

// filter - emit values that pass predicate
of(1, 2, 3, 4, 5).pipe(
  filter(x => x % 2 === 0)
).subscribe(console.log); // 2, 4

// take - emit only first n values
interval(1000).pipe(
  take(3)
).subscribe(console.log); // 0, 1, 2

// takeUntil - emit until notifier emits
const stop$ = fromEvent(document, 'click');
interval(1000).pipe(
  takeUntil(stop$)
).subscribe(console.log); // Stops on first click

// takeWhile - emit while condition is true
of(1, 2, 3, 4, 5, 1, 2).pipe(
  takeWhile(x => x < 4)
).subscribe(console.log); // 1, 2, 3

// skip - skip first n values
of(1, 2, 3, 4, 5).pipe(
  skip(2)
).subscribe(console.log); // 3, 4, 5

// first - emit first value (or first matching predicate)
of(1, 2, 3).pipe(first()).subscribe(console.log); // 1
of(1, 2, 3).pipe(first(x => x > 1)).subscribe(console.log); // 2

// last - emit last value
of(1, 2, 3).pipe(last()).subscribe(console.log); // 3

// distinct - emit only unique values
of(1, 2, 2, 3, 1, 3, 4).pipe(
  distinct()
).subscribe(console.log); // 1, 2, 3, 4

// distinctUntilChanged - emit when value changes from previous
of(1, 1, 2, 2, 3, 1, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log); // 1, 2, 3, 1

// debounceTime - emit after specified silence
const input$ = fromEvent(inputElement, 'input');
input$.pipe(
  debounceTime(300),
  map(e => e.target.value)
).subscribe(value => {
  console.log('Search:', value);
});

// throttleTime - emit first value, then ignore for duration
fromEvent(document, 'scroll').pipe(
  throttleTime(100)
).subscribe(() => {
  console.log('Scroll event (throttled)');
});
```

### Combination Operators

```javascript
import { of, interval, forkJoin, combineLatest, merge, concat, zip, race } from 'rxjs';
import { take, delay } from 'rxjs/operators';

// merge - combine multiple observables, emit as values arrive
const a$ = interval(1000).pipe(take(3), map(x => `A${x}`));
const b$ = interval(1500).pipe(take(3), map(x => `B${x}`));

merge(a$, b$).subscribe(console.log);
// A0, B0, A1, A2, B1, B2 (interleaved based on timing)

// concat - combine sequentially
concat(
  of(1, 2, 3),
  of(4, 5, 6)
).subscribe(console.log); // 1, 2, 3, 4, 5, 6

// combineLatest - emit array of latest values when any source emits
const x$ = interval(1000).pipe(take(3));
const y$ = interval(1500).pipe(take(3));

combineLatest([x$, y$]).subscribe(([x, y]) => {
  console.log(`x: ${x}, y: ${y}`);
});
// Emits combinations as each updates

// forkJoin - emit array when all complete (like Promise.all)
forkJoin({
  user: fetch('/api/user').then(r => r.json()),
  posts: fetch('/api/posts').then(r => r.json()),
  comments: fetch('/api/comments').then(r => r.json())
}).subscribe(({ user, posts, comments }) => {
  console.log('All data loaded:', { user, posts, comments });
});

// zip - combine corresponding values
const name$ = of('John', 'Jane', 'Bob');
const age$ = of(25, 30, 35);

zip(name$, age$).subscribe(([name, age]) => {
  console.log(`${name} is ${age} years old`);
});
// John is 25 years old
// Jane is 30 years old
// Bob is 35 years old

// race - emit from first Observable to emit
const fast$ = of('fast').pipe(delay(100));
const slow$ = of('slow').pipe(delay(500));

race(fast$, slow$).subscribe(console.log); // fast
```

### Flattening Operators

These operators handle Observables that emit Observables (higher-order Observables):

```javascript
import { of, interval, fromEvent } from 'rxjs';
import {
  mergeMap,
  switchMap,
  concatMap,
  exhaustMap,
  delay,
  take
} from 'rxjs/operators';

// mergeMap - map to Observable, merge results (parallel)
// Use when order doesn't matter and you want all results
of(1, 2, 3).pipe(
  mergeMap(x => of(x * 10).pipe(delay(1000)))
).subscribe(console.log);
// After 1 second: 10, 20, 30 (all at once)

// concatMap - map to Observable, wait for each to complete (sequential)
// Use when order matters
of(1, 2, 3).pipe(
  concatMap(x => of(x * 10).pipe(delay(1000)))
).subscribe(console.log);
// 10 (at 1s), 20 (at 2s), 30 (at 3s)

// switchMap - map to Observable, cancel previous on new emission
// Use for autocomplete, where only latest request matters
const searchInput$ = fromEvent(inputElement, 'input');

searchInput$.pipe(
  debounceTime(300),
  map(e => e.target.value),
  switchMap(query => fetch(`/api/search?q=${query}`).then(r => r.json()))
).subscribe(results => {
  console.log('Search results:', results);
});

// exhaustMap - ignore new values while current Observable is active
// Use for button clicks where you want to prevent double-submission
const submitButton$ = fromEvent(submitButton, 'click');

submitButton$.pipe(
  exhaustMap(() => fetch('/api/submit', { method: 'POST' }))
).subscribe(response => {
  console.log('Submitted:', response);
});
```

### Comparison of Flattening Operators

```javascript
// Visual comparison
// Source:    --1--2--3--4--5--|
// Inner obs: ----x----|

// mergeMap:  ----1----2----3----4----5----|
// (all inner observables run in parallel)

// concatMap: ----1---------2---------3---------4---------5----|
// (waits for each inner observable to complete)

// switchMap: ----1--2--3--4----5----|
// (cancels previous inner observable on new source emission)

// exhaustMap: ----1---------3---------5----|
// (ignores new source emissions while inner observable is active)

// Practical example: HTTP requests
function makeRequest(id) {
  return from(fetch(`/api/item/${id}`)).pipe(
    mergeMap(r => r.json())
  );
}

// mergeMap - all requests run in parallel
// Good for: loading multiple independent resources
ids$.pipe(mergeMap(id => makeRequest(id)));

// concatMap - requests run one at a time, in order
// Good for: sequential operations that depend on order
ids$.pipe(concatMap(id => makeRequest(id)));

// switchMap - only latest request matters, previous canceled
// Good for: search autocomplete, route changes
searchTerm$.pipe(switchMap(term => search(term)));

// exhaustMap - ignore new requests while one is in progress
// Good for: form submission, preventing double-clicks
submitClicks$.pipe(exhaustMap(() => submitForm()));
```

## Error Handling

### catchError Operator

```javascript
import { of, throwError } from 'rxjs';
import { catchError, retry, retryWhen, delay } from 'rxjs/operators';

// catchError - handle errors and optionally recover
fetch$.pipe(
  catchError(error => {
    console.error('Error occurred:', error);
    // Return a fallback Observable
    return of({ data: [], error: true });
  })
).subscribe(result => {
  console.log('Result:', result);
});

// Re-throwing errors
fetch$.pipe(
  catchError(error => {
    logError(error);
    return throwError(() => new Error('Failed to fetch data'));
  })
).subscribe({
  next: data => console.log(data),
  error: err => console.error('Caught:', err.message)
});

// Different fallbacks based on error type
fetch$.pipe(
  catchError(error => {
    if (error.status === 404) {
      return of(null); // Return null for not found
    }
    if (error.status === 401) {
      return throwError(() => new Error('Unauthorized'));
    }
    return of({ error: 'Unknown error' });
  })
);
```

### Retry Strategies

```javascript
import { timer, throwError } from 'rxjs';
import { retry, retryWhen, delay, take, mergeMap } from 'rxjs/operators';

// Simple retry - retry n times immediately
failingRequest$.pipe(
  retry(3) // Retry up to 3 times
).subscribe({
  next: data => console.log('Success:', data),
  error: err => console.error('Failed after 3 retries')
});

// retry with config
failingRequest$.pipe(
  retry({
    count: 3,
    delay: 1000 // Wait 1 second between retries
  })
);

// Exponential backoff retry
function retryWithBackoff(maxRetries, initialDelay = 1000) {
  return retryWhen(errors =>
    errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;
        if (retryAttempt > maxRetries) {
          return throwError(() => error);
        }
        const delayTime = initialDelay * Math.pow(2, index);
        console.log(`Retry attempt ${retryAttempt} after ${delayTime}ms`);
        return timer(delayTime);
      })
    )
  );
}

failingRequest$.pipe(
  retryWithBackoff(3, 1000)
).subscribe({
  next: data => console.log('Success:', data),
  error: err => console.error('Failed after retries:', err)
});
```

### finalize Operator

```javascript
import { of, throwError } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

// finalize - execute cleanup regardless of success or error
let isLoading = true;

fetch$.pipe(
  tap(() => isLoading = true),
  finalize(() => {
    isLoading = false;
    console.log('Cleanup complete');
  })
).subscribe({
  next: data => console.log('Data:', data),
  error: err => console.error('Error:', err)
});

// Combining error handling patterns
function fetchWithHandling(url) {
  return from(fetch(url)).pipe(
    mergeMap(response => {
      if (!response.ok) {
        return throwError(() => new Error(`HTTP ${response.status}`));
      }
      return response.json();
    }),
    retry(2),
    catchError(error => {
      console.error('Request failed:', error);
      return of({ error: error.message, data: null });
    }),
    finalize(() => {
      console.log('Request completed');
    })
  );
}
```

## Subscription Management

### Preventing Memory Leaks

Unmanaged subscriptions are one of the most common sources of memory leaks in RxJS applications.

```javascript
// Bad - subscription never cleaned up
class BadComponent {
  data = [];

  ngOnInit() {
    interval(1000).subscribe(n => {
      this.data.push(n);
    });
    // This subscription lives forever, even after component destruction
  }
}

// Good - manual cleanup
class GoodComponent {
  subscription;
  data = [];

  ngOnInit() {
    this.subscription = interval(1000).subscribe(n => {
      this.data.push(n);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

### takeUntil Pattern

The most common pattern for managing subscriptions in component-based frameworks:

```javascript
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

class Component {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // All subscriptions automatically complete when destroy$ emits
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(n => console.log(n));

    fromEvent(document, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe(e => console.log('Click:', e));

    someService.data$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => this.processData(data));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Subscription Container

```javascript
import { Subscription } from 'rxjs';

class Component {
  private subscriptions = new Subscription();

  ngOnInit() {
    this.subscriptions.add(
      interval(1000).subscribe(n => console.log('Timer:', n))
    );

    this.subscriptions.add(
      fromEvent(document, 'click').subscribe(e => console.log('Click'))
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
```

### Async Pipe (Angular)

In Angular, the async pipe handles subscription management automatically:

```typescript
// Component
@Component({
  template: `
    <div *ngIf="user$ | async as user">
      {{ user.name }}
    </div>
    <ul>
      <li *ngFor="let item of items$ | async">
        {{ item.name }}
      </li>
    </ul>
  `
})
class UserComponent {
  user$ = this.userService.getCurrentUser();
  items$ = this.itemService.getItems();

  constructor(
    private userService: UserService,
    private itemService: ItemService
  ) {}
  // No manual subscription management needed
}
```

## Real-World Examples

### Autocomplete Search

```javascript
import { fromEvent, of } from 'rxjs';
import {
  debounceTime,
  map,
  distinctUntilChanged,
  switchMap,
  catchError,
  filter,
  tap
} from 'rxjs/operators';

function createAutocomplete(inputElement, searchFn) {
  return fromEvent(inputElement, 'input').pipe(
    // Extract input value
    map(event => event.target.value.trim()),

    // Ignore if less than 2 characters
    filter(query => query.length >= 2),

    // Wait for user to stop typing
    debounceTime(300),

    // Only search if value changed
    distinctUntilChanged(),

    // Show loading state
    tap(() => showLoadingIndicator()),

    // Cancel previous request, make new one
    switchMap(query =>
      searchFn(query).pipe(
        catchError(error => {
          console.error('Search failed:', error);
          return of([]);
        })
      )
    ),

    // Hide loading state
    tap(() => hideLoadingIndicator())
  );
}

// Usage
const searchInput = document.getElementById('search');
const searchFn = query => from(fetch(`/api/search?q=${query}`).then(r => r.json()));

createAutocomplete(searchInput, searchFn).subscribe(results => {
  renderResults(results);
});
```

### Infinite Scroll

```javascript
import { fromEvent, merge } from 'rxjs';
import {
  map,
  filter,
  exhaustMap,
  scan,
  startWith,
  takeWhile
} from 'rxjs/operators';

function createInfiniteScroll(container, loadMore) {
  const scroll$ = fromEvent(container, 'scroll');

  return scroll$.pipe(
    // Check if scrolled near bottom
    map(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      return scrollTop + clientHeight >= scrollHeight - 100;
    }),

    // Only emit when near bottom
    filter(nearBottom => nearBottom),

    // Prevent multiple simultaneous loads
    exhaustMap(() => loadMore()),

    // Accumulate loaded items
    scan((allItems, newItems) => [...allItems, ...newItems], []),

    // Stop when no more items
    takeWhile(items => items.length > 0, true)
  );
}

// Usage
let page = 0;
const loadMore = () => {
  page++;
  return from(fetch(`/api/items?page=${page}`).then(r => r.json()));
};

createInfiniteScroll(document.getElementById('list'), loadMore)
  .subscribe(items => {
    renderItems(items);
  });
```

### Real-time Dashboard

```javascript
import { webSocket } from 'rxjs/webSocket';
import {
  retry,
  share,
  filter,
  map,
  scan,
  bufferTime
} from 'rxjs/operators';

// Create shared WebSocket connection
const messages$ = webSocket('wss://api.example.com/ws').pipe(
  retry({ delay: 5000 }), // Reconnect on disconnect
  share() // Share single connection among subscribers
);

// Filter and transform different message types
const trades$ = messages$.pipe(
  filter(msg => msg.type === 'trade'),
  map(msg => ({
    symbol: msg.symbol,
    price: msg.price,
    volume: msg.volume,
    timestamp: new Date(msg.timestamp)
  }))
);

const alerts$ = messages$.pipe(
  filter(msg => msg.type === 'alert'),
  map(msg => msg.alert)
);

// Aggregate trades by symbol
const aggregatedTrades$ = trades$.pipe(
  bufferTime(1000),
  filter(trades => trades.length > 0),
  map(trades => {
    const bySymbol = {};
    trades.forEach(trade => {
      if (!bySymbol[trade.symbol]) {
        bySymbol[trade.symbol] = { volume: 0, lastPrice: 0 };
      }
      bySymbol[trade.symbol].volume += trade.volume;
      bySymbol[trade.symbol].lastPrice = trade.price;
    });
    return bySymbol;
  })
);

// Subscribe to streams
trades$.subscribe(trade => updateTickerDisplay(trade));
alerts$.subscribe(alert => showAlert(alert));
aggregatedTrades$.subscribe(data => updateDashboard(data));
```

### Form Handling with Validation

```javascript
import { fromEvent, combineLatest, merge } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  startWith,
  shareReplay
} from 'rxjs/operators';

function createFormValidation(form) {
  const email$ = fromEvent(form.email, 'input').pipe(
    map(e => e.target.value),
    debounceTime(300),
    distinctUntilChanged(),
    map(email => ({
      value: email,
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      error: email ? 'Invalid email format' : 'Email is required'
    })),
    startWith({ value: '', valid: false, error: 'Email is required' }),
    shareReplay(1)
  );

  const password$ = fromEvent(form.password, 'input').pipe(
    map(e => e.target.value),
    debounceTime(300),
    distinctUntilChanged(),
    map(password => ({
      value: password,
      valid: password.length >= 8,
      error: password ? 'Password must be at least 8 characters' : 'Password is required'
    })),
    startWith({ value: '', valid: false, error: 'Password is required' }),
    shareReplay(1)
  );

  const formValid$ = combineLatest([email$, password$]).pipe(
    map(([email, password]) => email.valid && password.valid)
  );

  return {
    email$,
    password$,
    formValid$,
    submit$: fromEvent(form, 'submit').pipe(
      tap(e => e.preventDefault()),
      withLatestFrom(email$, password$, formValid$),
      filter(([, , , valid]) => valid),
      map(([, email, password]) => ({
        email: email.value,
        password: password.value
      }))
    )
  };
}

// Usage
const form = document.getElementById('login-form');
const validation = createFormValidation(form);

validation.email$.subscribe(state => {
  form.emailError.textContent = state.valid ? '' : state.error;
});

validation.formValid$.subscribe(valid => {
  form.submitButton.disabled = !valid;
});

validation.submit$.pipe(
  exhaustMap(credentials => login(credentials))
).subscribe(result => {
  console.log('Login result:', result);
});
```

### Drag and Drop

```javascript
import { fromEvent, merge } from 'rxjs';
import {
  map,
  switchMap,
  takeUntil,
  tap,
  startWith
} from 'rxjs/operators';

function makeDraggable(element) {
  const mouseDown$ = fromEvent(element, 'mousedown');
  const mouseMove$ = fromEvent(document, 'mousemove');
  const mouseUp$ = fromEvent(document, 'mouseup');

  const drag$ = mouseDown$.pipe(
    tap(e => e.preventDefault()),
    switchMap(startEvent => {
      const startX = startEvent.clientX - element.offsetLeft;
      const startY = startEvent.clientY - element.offsetTop;

      return mouseMove$.pipe(
        map(moveEvent => ({
          x: moveEvent.clientX - startX,
          y: moveEvent.clientY - startY
        })),
        takeUntil(mouseUp$)
      );
    })
  );

  return drag$;
}

// Usage
const draggable = document.getElementById('draggable');

makeDraggable(draggable).subscribe(pos => {
  draggable.style.left = `${pos.x}px`;
  draggable.style.top = `${pos.y}px`;
});
```

## Testing RxJS Code

### Using Marble Testing

```javascript
import { TestScheduler } from 'rxjs/testing';
import { map, filter, delay } from 'rxjs/operators';

describe('RxJS operators', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should filter even numbers', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-c-d-|', { a: 1, b: 2, c: 3, d: 4 });
      const expected = '      ---b---d-|';

      const result$ = source$.pipe(filter(x => x % 2 === 0));

      expectObservable(result$).toBe(expected, { b: 2, d: 4 });
    });
  });

  it('should map values', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-c-|', { a: 1, b: 2, c: 3 });
      const expected = '      -x-y-z-|';

      const result$ = source$.pipe(map(x => x * 10));

      expectObservable(result$).toBe(expected, { x: 10, y: 20, z: 30 });
    });
  });

  it('should handle errors', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-#', { a: 1, b: 2 }, new Error('test'));
      const expected = '      -a-b-#';

      expectObservable(source$).toBe(expected, { a: 1, b: 2 }, new Error('test'));
    });
  });
});
```

### Marble Diagram Syntax

```javascript
// Marble syntax reference:
// '-'  : time frame (10ms by default)
// 'a'  : value emission
// '|'  : complete
// '#'  : error
// '()' : sync grouping
// '^'  : subscription point (for hot observables)

// Examples:
'---a---b---|'       // a at 30ms, b at 70ms, complete at 110ms
'---(abc)---|'       // a, b, c emitted synchronously at 30ms
'---a---#'           // a at 30ms, error at 70ms
'--^--a--b--|'       // subscription at 20ms, a at 50ms, b at 80ms
```

### Testing Async Code

```javascript
import { of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';

describe('Async service', () => {
  it('should handle async data', (done) => {
    const service$ = of('data').pipe(delay(100));

    service$.subscribe({
      next: value => {
        expect(value).toBe('data');
      },
      complete: () => done()
    });
  });

  it('should handle errors', (done) => {
    const error$ = throwError(() => new Error('test error'));

    error$.pipe(
      catchError(err => {
        expect(err.message).toBe('test error');
        done();
        return of(null);
      })
    ).subscribe();
  });

  // Using fakeAsync (Angular)
  it('should work with fakeAsync', fakeAsync(() => {
    let result;

    of('data').pipe(delay(1000)).subscribe(v => result = v);

    tick(1000);

    expect(result).toBe('data');
  }));
});
```

## Performance Optimization

### Sharing Subscriptions

```javascript
import { share, shareReplay, publish, refCount } from 'rxjs/operators';

// Problem: multiple subscriptions cause multiple executions
const expensive$ = of(1).pipe(
  tap(() => console.log('Expensive operation')),
  delay(1000)
);

expensive$.subscribe(v => console.log('Sub 1:', v));
expensive$.subscribe(v => console.log('Sub 2:', v));
// "Expensive operation" logged twice

// Solution: share the subscription
const shared$ = expensive$.pipe(share());

shared$.subscribe(v => console.log('Sub 1:', v));
shared$.subscribe(v => console.log('Sub 2:', v));
// "Expensive operation" logged once

// shareReplay - replay last n values to late subscribers
const replayed$ = expensive$.pipe(
  shareReplay(1) // Cache and replay last value
);

replayed$.subscribe(v => console.log('Sub 1:', v));
// Later...
setTimeout(() => {
  replayed$.subscribe(v => console.log('Sub 2:', v));
  // Gets cached value immediately
}, 2000);
```

### Avoiding Memory Leaks

```javascript
// Use takeUntil for component lifecycle
const destroy$ = new Subject<void>();

longRunning$.pipe(
  takeUntil(destroy$)
).subscribe();

// On cleanup
destroy$.next();
destroy$.complete();

// Use take for limited subscriptions
interval(1000).pipe(
  take(10) // Only take first 10 values
).subscribe();

// Use first for single value
someObservable$.pipe(
  first()
).subscribe();
```

### Optimizing Operators

```javascript
// Use distinctUntilChanged to prevent unnecessary emissions
state$.pipe(
  distinctUntilChanged((prev, curr) => prev.id === curr.id)
).subscribe();

// Use filter early to reduce downstream work
source$.pipe(
  filter(x => x.isValid), // Filter first
  map(x => expensiveTransform(x)) // Then transform
);

// Use auditTime for high-frequency events
scroll$.pipe(
  auditTime(100) // Sample every 100ms
).subscribe();

// Batch updates with bufferTime
updates$.pipe(
  bufferTime(50),
  filter(batch => batch.length > 0)
).subscribe(batch => applyBatchUpdate(batch));
```

## Common Mistakes and Best Practices

### Common Mistakes

```javascript
// Mistake 1: Not unsubscribing
// Bad
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}

// Good
ngOnInit() {
  this.subscription = this.data$.subscribe(data => this.data = data);
}
ngOnDestroy() {
  this.subscription.unsubscribe();
}

// Mistake 2: Nested subscriptions
// Bad
user$.subscribe(user => {
  posts$.subscribe(posts => {
    // Nested subscription - hard to manage
  });
});

// Good
user$.pipe(
  switchMap(user => posts$)
).subscribe(posts => {
  // Flat subscription
});

// Mistake 3: Not handling errors
// Bad
http.get('/api/data').subscribe(data => {
  // What if request fails?
});

// Good
http.get('/api/data').pipe(
  catchError(error => {
    handleError(error);
    return of(defaultValue);
  })
).subscribe(data => {
  // Safe to use data
});

// Mistake 4: Creating Observables inside Observables without flattening
// Bad
source$.pipe(
  map(x => http.get(`/api/${x}`)) // Creates Observable, doesn't execute
).subscribe(obs$ => {
  obs$.subscribe(data => {}); // Nested subscription
});

// Good
source$.pipe(
  switchMap(x => http.get(`/api/${x}`))
).subscribe(data => {});
```

### Best Practices

```javascript
// 1. Use operators instead of side effects in subscribe
// Bad
source$.subscribe(value => {
  this.data = transform(value);
  this.updateUI();
});

// Good
source$.pipe(
  map(value => transform(value)),
  tap(data => this.data = data)
).subscribe(() => this.updateUI());

// 2. Keep subscribe callbacks minimal
// Bad
source$.subscribe(value => {
  // 50 lines of logic
});

// Good
source$.pipe(
  // Transform logic here
).subscribe(value => {
  this.handleValue(value);
});

// 3. Use type assertions for complex operators
const typed$ = source$.pipe(
  filter((x): x is NonNullable<typeof x> => x != null)
);

// 4. Create reusable operator functions
const retryWithDelay = <T>(maxRetries: number, delayMs: number) =>
  (source: Observable<T>) =>
    source.pipe(
      retryWhen(errors =>
        errors.pipe(
          delay(delayMs),
          take(maxRetries)
        )
      )
    );

// Usage
http.get('/api/data').pipe(
  retryWithDelay(3, 1000)
);

// 5. Document complex streams
/**
 * Autocomplete search stream
 * - Debounces input by 300ms
 * - Cancels previous requests
 * - Returns empty array on error
 */
const search$ = input$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => searchApi(term).pipe(
    catchError(() => of([]))
  ))
);
```

## Interview Key Points

### Common Interview Questions

#### Difference Between Observable and Promise

```javascript
// Promise:
// - Eager: executes immediately
// - Single value: resolves once
// - Not cancellable
// - Always async

const promise = new Promise(resolve => {
  console.log('Promise executing');
  resolve('done');
});
// "Promise executing" logged immediately

// Observable:
// - Lazy: executes on subscribe
// - Multiple values: can emit many times
// - Cancellable: unsubscribe stops execution
// - Can be sync or async

const observable = new Observable(subscriber => {
  console.log('Observable executing');
  subscriber.next('value 1');
  subscriber.next('value 2');
  subscriber.complete();
});
// Nothing logged until subscribe()
```

#### Hot vs Cold Observables

```javascript
// Cold Observable: creates new producer for each subscription
const cold$ = new Observable(subscriber => {
  subscriber.next(Math.random());
});

cold$.subscribe(v => console.log('Sub 1:', v)); // Random value A
cold$.subscribe(v => console.log('Sub 2:', v)); // Random value B (different)

// Hot Observable: shares producer among subscriptions
const subject = new Subject();
const hot$ = subject.asObservable();

hot$.subscribe(v => console.log('Sub 1:', v));
hot$.subscribe(v => console.log('Sub 2:', v));

subject.next(Math.random()); // Both subscribers get same value
```

#### When to Use Each Flattening Operator

```javascript
// mergeMap: parallel execution, all results needed
// Use for: saving multiple items, loading independent resources

// concatMap: sequential execution, order matters
// Use for: sequential API calls, ordered processing

// switchMap: cancel previous, only latest matters
// Use for: search autocomplete, route changes

// exhaustMap: ignore new while processing
// Use for: form submission, preventing double-clicks
```

#### Explain the share Operator

```javascript
// share() multicasts the source Observable to multiple subscribers
// It's equivalent to pipe(multicast(() => new Subject()), refCount())

const source$ = interval(1000).pipe(
  tap(x => console.log('Processing:', x)),
  share()
);

// Without share: each subscriber triggers separate interval
// With share: single interval shared by all subscribers
```

### Key Concepts Summary

1. **Observables**: Lazy, cancellable streams that can emit multiple values
2. **Subjects**: Both Observable and Observer, enable multicasting
3. **Operators**: Pure functions that transform Observables without mutation
4. **Subscription**: Represents execution, must be cleaned up
5. **Hot vs Cold**: Cold creates new producer, hot shares producer
6. **Higher-order Observables**: Observables that emit Observables
7. **Schedulers**: Control when and where work happens

### Best Practices Summary

1. Always unsubscribe or use takeUntil pattern
2. Use appropriate flattening operators for your use case
3. Handle errors at every level of your streams
4. Share expensive Observables to avoid duplicate work
5. Keep subscribe callbacks minimal
6. Use strong typing with RxJS
7. Test with marble diagrams for complex streams

## Summary

RxJS provides a powerful paradigm for handling asynchronous data streams in JavaScript applications. The key to mastering RxJS is understanding:

- **Core concepts**: Observables, Observers, Subscriptions, and Subjects
- **Operator categories**: Creation, transformation, filtering, combination, and error handling
- **Subscription management**: Preventing memory leaks with proper cleanup
- **Real-world patterns**: Autocomplete, infinite scroll, real-time updates

By applying these concepts consistently, you can build reactive applications that handle complex async scenarios with clean, maintainable code.

Key takeaways:

- Observables are lazy and cancellable, unlike Promises
- Choose the right flattening operator (mergeMap, switchMap, concatMap, exhaustMap)
- Always manage subscriptions to prevent memory leaks
- Use Subjects for multicasting and state management
- Test complex streams with marble diagrams
- Share expensive Observables to optimize performance

Through continuous practice and applying reactive thinking, you will be able to elegantly handle complex async scenarios in your applications.
