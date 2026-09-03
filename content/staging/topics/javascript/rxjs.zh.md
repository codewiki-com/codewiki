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
origin: old/src/content/docs/frontend/rxjs.zh.md
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

## 什么是响应式编程

### 理解响应式编程

响应式编程是一种专注于数据流和变化传播的编程范式。你不需要编写显式处理单个事件或值的代码，而是定义数据源和转换之间的关系，当底层数据发生变化时会自动更新。

```javascript
// 传统命令式方法
let a = 1;
let b = 2;
let c = a + b; // c = 3

a = 5;
console.log(c); // 仍然是 3 - c 不会自动更新

// 响应式方法（概念性）
// 当 a 或 b 变化时，c 会自动重新计算
```

### 为什么使用 RxJS

RxJS（JavaScript 的响应式扩展）提供了一种强大的方式来使用可观察序列处理异步操作和基于事件的程序。主要优势包括：

1. **统一的 API**：使用相同的模式处理点击、HTTP 请求、WebSocket 消息和定时器
2. **可组合性**：将操作链接在一起创建复杂的数据流
3. **可取消**：内置支持取消异步操作
4. **错误处理**：跨异步流的全面错误处理
5. **背压控制**：控制数据在应用程序中流动的速度

```javascript
import { fromEvent, interval } from 'rxjs';
import { map, filter, throttleTime, takeUntil } from 'rxjs/operators';

// 使用节流处理鼠标点击
const clicks$ = fromEvent(document, 'click').pipe(
  throttleTime(1000),
  map(event => ({ x: event.clientX, y: event.clientY }))
);

clicks$.subscribe(pos => console.log('点击位置:', pos));
```

## 核心概念

### Observable（可观察对象）

Observable 是一个随时间延迟收集值的惰性集合。与处理单个值的 Promise 不同，Observable 可以发出多个值。它们是"惰性的"，因为在有人订阅之前不会开始发出值。

```javascript
import { Observable } from 'rxjs';

// 从头创建一个 Observable
const numbers$ = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);

  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

// Observable 在订阅之前不会执行
console.log('订阅之前');

numbers$.subscribe({
  next: value => console.log('接收到:', value),
  error: err => console.error('错误:', err),
  complete: () => console.log('完成!')
});

// 输出:
// 订阅之前
// 接收到: 1
// 接收到: 2
// 接收到: 3
// (1秒后)
// 接收到: 4
// 完成!
```

### Observer（观察者）

Observer 是 Observable 传递值的消费者。它是一个包含三个可选回调方法的对象：

```javascript
// 完整的 Observer 对象
const observer = {
  next: value => console.log('Next:', value),
  error: err => console.error('Error:', err),
  complete: () => console.log('Complete')
};

observable$.subscribe(observer);

// 简写 - 直接传递回调函数
observable$.subscribe(
  value => console.log('Next:', value),
  err => console.error('Error:', err),
  () => console.log('Complete')
);

// 最常见 - 只传递 next 处理器
observable$.subscribe(value => console.log('Value:', value));
```

### Subscription（订阅）

Subscription 代表 Observable 的执行。它主要用于取消执行。

```javascript
import { interval } from 'rxjs';

const numbers$ = interval(1000);

const subscription = numbers$.subscribe(n => console.log('Number:', n));

// 5秒后取消
setTimeout(() => {
  subscription.unsubscribe();
  console.log('已取消订阅!');
}, 5000);

// 管理多个订阅
import { Subscription } from 'rxjs';

const parentSubscription = new Subscription();

parentSubscription.add(
  interval(1000).subscribe(n => console.log('First:', n))
);

parentSubscription.add(
  interval(2000).subscribe(n => console.log('Second:', n))
);

// 一次性取消所有订阅
setTimeout(() => {
  parentSubscription.unsubscribe();
}, 5000);
```

### Operator（操作符）

操作符是转换、过滤或组合 Observable 的纯函数。它们接收一个 Observable 作为输入并返回一个新的 Observable。

```javascript
import { of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const numbers$ = of(1, 2, 3, 4, 5);

const result$ = numbers$.pipe(
  filter(n => n % 2 === 0),
  map(n => n * 10)
);

result$.subscribe(console.log);
// 输出: 20, 40
```

## 创建 Observable

### 创建操作符

RxJS 提供了多种从不同来源创建 Observable 的方法：

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

// of - 同步发出提供的值
const values$ = of(1, 2, 3, 'a', 'b', 'c');
values$.subscribe(console.log); // 1, 2, 3, 'a', 'b', 'c'

// from - 将数组、Promise、可迭代对象转换为 Observable
const array$ = from([1, 2, 3]);
const promise$ = from(fetch('/api/data'));
const iterable$ = from('Hello'); // H, e, l, l, o

// interval - 按指定间隔发出连续数字
const everySecond$ = interval(1000);
// 0, 1, 2, 3, ... (每秒)

// timer - 延迟后发出，然后可选地按间隔发出
const afterDelay$ = timer(3000); // 3秒后发出 0
const delayThenInterval$ = timer(3000, 1000); // 3秒后，每1秒发出一次

// fromEvent - 从 DOM 事件创建 Observable
const clicks$ = fromEvent(document, 'click');
const keyups$ = fromEvent(document, 'keyup');

// range - 发出一系列数字
const range$ = range(1, 10); // 1, 2, 3, ..., 10

// generate - 类似 for 循环
const generated$ = generate(
  0,              // 初始状态
  x => x < 10,   // 条件
  x => x + 1,    // 迭代
  x => x * 2     // 结果选择器
);
// 0, 2, 4, 6, 8, 10, 12, 14, 16, 18

// defer - 在订阅时惰性创建 Observable
const deferred$ = defer(() => {
  return of(new Date().getTime());
});
// 每次订阅获取当前时间戳
```

### 创建自定义 Observable

```javascript
import { Observable } from 'rxjs';

// WebSocket Observable
function createWebSocket(url) {
  return new Observable(subscriber => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket 已连接');
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

    // 清理函数 - 在取消订阅时调用
    return () => {
      socket.close();
    };
  });
}

const messages$ = createWebSocket('wss://api.example.com/ws');

const subscription = messages$.subscribe({
  next: msg => console.log('消息:', msg),
  error: err => console.error('错误:', err),
  complete: () => console.log('连接已关闭')
});

// 稍后：关闭连接
subscription.unsubscribe();
```

### 从 Promise 和回调函数创建

```javascript
import { from, bindCallback, bindNodeCallback } from 'rxjs';

// 转换 Promise
const fetchUser$ = from(fetch('/api/user').then(r => r.json()));

// 转换基于回调的函数
// 标准回调（结果作为最后一个参数）
const boundFn = bindCallback(someCallbackFunction);
boundFn(arg1, arg2).subscribe(result => console.log(result));

// Node.js 风格回调（error, result）
const readFile$ = bindNodeCallback(fs.readFile);
readFile$('file.txt', 'utf8').subscribe({
  next: content => console.log(content),
  error: err => console.error(err)
});
```

## Subject

### 什么是 Subject

Subject 既是 Observable 也是 Observer。它可以将值多播给多个订阅者，并允许你以编程方式将值推入流中。

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

// 订阅多个观察者
subject.subscribe(value => console.log('观察者 A:', value));
subject.subscribe(value => console.log('观察者 B:', value));

// 推送值
subject.next(1);
subject.next(2);

// 输出:
// 观察者 A: 1
// 观察者 B: 1
// 观察者 A: 2
// 观察者 B: 2
```

### BehaviorSubject

BehaviorSubject 存储当前值并立即将其发送给新订阅者。

```javascript
import { BehaviorSubject } from 'rxjs';

// 需要一个初始值
const subject = new BehaviorSubject('初始值');

subject.subscribe(value => console.log('观察者 A:', value));
// 立即输出: 观察者 A: 初始值

subject.next('第二个值');
// 观察者 A: 第二个值

// 新订阅者立即获取当前值
subject.subscribe(value => console.log('观察者 B:', value));
// 立即输出: 观察者 B: 第二个值

// 同步获取当前值
console.log('当前值:', subject.getValue());
// 当前值: 第二个值
```

### ReplaySubject

ReplaySubject 记录多个值并将其重放给新订阅者。

```javascript
import { ReplaySubject } from 'rxjs';

// 重放最后 3 个值
const subject = new ReplaySubject(3);

subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);

// 新订阅者接收最后 3 个值
subject.subscribe(value => console.log('观察者:', value));
// 观察者: 2
// 观察者: 3
// 观察者: 4

// 带时间窗口 - 重放最近 500 毫秒内的值
const timedSubject = new ReplaySubject(100, 500);
```

### AsyncSubject

AsyncSubject 只发出最后一个值，并且只在 Observable 完成时发出。

```javascript
import { AsyncSubject } from 'rxjs';

const subject = new AsyncSubject();

subject.subscribe(value => console.log('观察者 A:', value));

subject.next(1);
subject.next(2);
subject.next(3);

// 还没有输出任何内容

subject.complete();
// 现在输出: 观察者 A: 3

// 完成后的新订阅者也会获取最后一个值
subject.subscribe(value => console.log('观察者 B:', value));
// 观察者 B: 3
```

### Subject 实际应用示例

```javascript
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// 使用 BehaviorSubject 进行状态管理
class Store {
  private state$ = new BehaviorSubject({
    user: null,
    isLoading: false,
    items: []
  });

  // 选择特定的状态切片
  select(selector) {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // 更新状态
  setState(partial) {
    this.state$.next({
      ...this.state$.getValue(),
      ...partial
    });
  }

  // 获取当前状态
  getState() {
    return this.state$.getValue();
  }
}

const store = new Store();

// 订阅特定状态变化
store.select(state => state.user).subscribe(user => {
  console.log('用户变化:', user);
});

store.select(state => state.isLoading).subscribe(loading => {
  console.log('加载中:', loading);
});

// 更新状态
store.setState({ isLoading: true });
store.setState({ user: { name: 'John' } });
store.setState({ isLoading: false });
```

## 常用操作符

### 转换操作符

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

// map - 转换每个值
of(1, 2, 3).pipe(
  map(x => x * 10)
).subscribe(console.log); // 10, 20, 30

// pluck - 提取嵌套属性
const users$ = of(
  { name: 'John', address: { city: 'NYC' } },
  { name: 'Jane', address: { city: 'LA' } }
);
users$.pipe(
  pluck('address', 'city')
).subscribe(console.log); // NYC, LA

// scan - 累加器，发出每个中间结果
of(1, 2, 3, 4, 5).pipe(
  scan((acc, value) => acc + value, 0)
).subscribe(console.log); // 1, 3, 6, 10, 15

// reduce - 类似 scan 但只发出最终结果
of(1, 2, 3, 4, 5).pipe(
  reduce((acc, value) => acc + value, 0)
).subscribe(console.log); // 15

// buffer - 收集值直到信号发出
const clicks$ = fromEvent(document, 'click');
clicks$.pipe(
  buffer(interval(1000)) // 每秒收集一次点击
).subscribe(clicksArray => {
  console.log(`过去一秒有 ${clicksArray.length} 次点击`);
});

// bufferTime - 在指定时间内收集值
interval(100).pipe(
  bufferTime(1000)
).subscribe(values => {
  console.log('过去一秒的值:', values);
});
```

### 过滤操作符

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

// filter - 发出通过谓词的值
of(1, 2, 3, 4, 5).pipe(
  filter(x => x % 2 === 0)
).subscribe(console.log); // 2, 4

// take - 只发出前 n 个值
interval(1000).pipe(
  take(3)
).subscribe(console.log); // 0, 1, 2

// takeUntil - 发出值直到通知者发出
const stop$ = fromEvent(document, 'click');
interval(1000).pipe(
  takeUntil(stop$)
).subscribe(console.log); // 第一次点击时停止

// takeWhile - 条件为真时发出
of(1, 2, 3, 4, 5, 1, 2).pipe(
  takeWhile(x => x < 4)
).subscribe(console.log); // 1, 2, 3

// skip - 跳过前 n 个值
of(1, 2, 3, 4, 5).pipe(
  skip(2)
).subscribe(console.log); // 3, 4, 5

// first - 发出第一个值（或第一个匹配谓词的值）
of(1, 2, 3).pipe(first()).subscribe(console.log); // 1
of(1, 2, 3).pipe(first(x => x > 1)).subscribe(console.log); // 2

// last - 发出最后一个值
of(1, 2, 3).pipe(last()).subscribe(console.log); // 3

// distinct - 只发出唯一值
of(1, 2, 2, 3, 1, 3, 4).pipe(
  distinct()
).subscribe(console.log); // 1, 2, 3, 4

// distinctUntilChanged - 当值与前一个不同时发出
of(1, 1, 2, 2, 3, 1, 1).pipe(
  distinctUntilChanged()
).subscribe(console.log); // 1, 2, 3, 1

// debounceTime - 在指定静默期后发出
const input$ = fromEvent(inputElement, 'input');
input$.pipe(
  debounceTime(300),
  map(e => e.target.value)
).subscribe(value => {
  console.log('搜索:', value);
});

// throttleTime - 发出第一个值，然后在持续时间内忽略
fromEvent(document, 'scroll').pipe(
  throttleTime(100)
).subscribe(() => {
  console.log('滚动事件（已节流）');
});
```

### 组合操作符

```javascript
import { of, interval, forkJoin, combineLatest, merge, concat, zip, race } from 'rxjs';
import { take, delay } from 'rxjs/operators';

// merge - 合并多个 Observable，按值到达顺序发出
const a$ = interval(1000).pipe(take(3), map(x => `A${x}`));
const b$ = interval(1500).pipe(take(3), map(x => `B${x}`));

merge(a$, b$).subscribe(console.log);
// A0, B0, A1, A2, B1, B2（根据时序交错）

// concat - 顺序合并
concat(
  of(1, 2, 3),
  of(4, 5, 6)
).subscribe(console.log); // 1, 2, 3, 4, 5, 6

// combineLatest - 当任何源发出时发出最新值数组
const x$ = interval(1000).pipe(take(3));
const y$ = interval(1500).pipe(take(3));

combineLatest([x$, y$]).subscribe(([x, y]) => {
  console.log(`x: ${x}, y: ${y}`);
});
// 随着每个更新发出组合

// forkJoin - 当所有完成时发出数组（类似 Promise.all）
forkJoin({
  user: fetch('/api/user').then(r => r.json()),
  posts: fetch('/api/posts').then(r => r.json()),
  comments: fetch('/api/comments').then(r => r.json())
}).subscribe(({ user, posts, comments }) => {
  console.log('所有数据已加载:', { user, posts, comments });
});

// zip - 组合对应的值
const name$ = of('John', 'Jane', 'Bob');
const age$ = of(25, 30, 35);

zip(name$, age$).subscribe(([name, age]) => {
  console.log(`${name} 今年 ${age} 岁`);
});
// John 今年 25 岁
// Jane 今年 30 岁
// Bob 今年 35 岁

// race - 从第一个发出的 Observable 发出
const fast$ = of('快').pipe(delay(100));
const slow$ = of('慢').pipe(delay(500));

race(fast$, slow$).subscribe(console.log); // 快
```

### 扁平化操作符

这些操作符处理发出 Observable 的 Observable（高阶 Observable）：

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

// mergeMap - 映射到 Observable，合并结果（并行）
// 当顺序无关紧要且需要所有结果时使用
of(1, 2, 3).pipe(
  mergeMap(x => of(x * 10).pipe(delay(1000)))
).subscribe(console.log);
// 1秒后: 10, 20, 30（同时）

// concatMap - 映射到 Observable，等待每个完成（顺序）
// 当顺序重要时使用
of(1, 2, 3).pipe(
  concatMap(x => of(x * 10).pipe(delay(1000)))
).subscribe(console.log);
// 10（1秒时），20（2秒时），30（3秒时）

// switchMap - 映射到 Observable，新发出时取消前一个
// 用于自动完成，只关心最新请求
const searchInput$ = fromEvent(inputElement, 'input');

searchInput$.pipe(
  debounceTime(300),
  map(e => e.target.value),
  switchMap(query => fetch(`/api/search?q=${query}`).then(r => r.json()))
).subscribe(results => {
  console.log('搜索结果:', results);
});

// exhaustMap - 当前 Observable 活动时忽略新值
// 用于按钮点击，防止重复提交
const submitButton$ = fromEvent(submitButton, 'click');

submitButton$.pipe(
  exhaustMap(() => fetch('/api/submit', { method: 'POST' }))
).subscribe(response => {
  console.log('已提交:', response);
});
```

### 扁平化操作符比较

```javascript
// 可视化比较
// 源:        --1--2--3--4--5--|
// 内部 obs:  ----x----|

// mergeMap:  ----1----2----3----4----5----|
// （所有内部 Observable 并行运行）

// concatMap: ----1---------2---------3---------4---------5----|
// （等待每个内部 Observable 完成）

// switchMap: ----1--2--3--4----5----|
// （新源发出时取消前一个内部 Observable）

// exhaustMap: ----1---------3---------5----|
// （内部 Observable 活动时忽略新源发出）

// 实际示例：HTTP 请求
function makeRequest(id) {
  return from(fetch(`/api/item/${id}`)).pipe(
    mergeMap(r => r.json())
  );
}

// mergeMap - 所有请求并行运行
// 适用于：加载多个独立资源
ids$.pipe(mergeMap(id => makeRequest(id)));

// concatMap - 请求一个接一个运行，按顺序
// 适用于：依赖顺序的顺序操作
ids$.pipe(concatMap(id => makeRequest(id)));

// switchMap - 只有最新请求重要，前一个被取消
// 适用于：搜索自动完成、路由变化
searchTerm$.pipe(switchMap(term => search(term)));

// exhaustMap - 有请求进行中时忽略新请求
// 适用于：表单提交、防止重复点击
submitClicks$.pipe(exhaustMap(() => submitForm()));
```

## 错误处理

### catchError 操作符

```javascript
import { of, throwError } from 'rxjs';
import { catchError, retry, retryWhen, delay } from 'rxjs/operators';

// catchError - 处理错误并可选地恢复
fetch$.pipe(
  catchError(error => {
    console.error('发生错误:', error);
    // 返回一个后备 Observable
    return of({ data: [], error: true });
  })
).subscribe(result => {
  console.log('结果:', result);
});

// 重新抛出错误
fetch$.pipe(
  catchError(error => {
    logError(error);
    return throwError(() => new Error('获取数据失败'));
  })
).subscribe({
  next: data => console.log(data),
  error: err => console.error('捕获:', err.message)
});

// 根据错误类型使用不同的后备
fetch$.pipe(
  catchError(error => {
    if (error.status === 404) {
      return of(null); // 未找到时返回 null
    }
    if (error.status === 401) {
      return throwError(() => new Error('未授权'));
    }
    return of({ error: '未知错误' });
  })
);
```

### 重试策略

```javascript
import { timer, throwError } from 'rxjs';
import { retry, retryWhen, delay, take, mergeMap } from 'rxjs/operators';

// 简单重试 - 立即重试 n 次
failingRequest$.pipe(
  retry(3) // 最多重试 3 次
).subscribe({
  next: data => console.log('成功:', data),
  error: err => console.error('3 次重试后失败')
});

// 带配置的重试
failingRequest$.pipe(
  retry({
    count: 3,
    delay: 1000 // 重试之间等待 1 秒
  })
);

// 指数退避重试
function retryWithBackoff(maxRetries, initialDelay = 1000) {
  return retryWhen(errors =>
    errors.pipe(
      mergeMap((error, index) => {
        const retryAttempt = index + 1;
        if (retryAttempt > maxRetries) {
          return throwError(() => error);
        }
        const delayTime = initialDelay * Math.pow(2, index);
        console.log(`第 ${retryAttempt} 次重试，等待 ${delayTime}ms`);
        return timer(delayTime);
      })
    )
  );
}

failingRequest$.pipe(
  retryWithBackoff(3, 1000)
).subscribe({
  next: data => console.log('成功:', data),
  error: err => console.error('重试后失败:', err)
});
```

### finalize 操作符

```javascript
import { of, throwError } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

// finalize - 无论成功或错误都执行清理
let isLoading = true;

fetch$.pipe(
  tap(() => isLoading = true),
  finalize(() => {
    isLoading = false;
    console.log('清理完成');
  })
).subscribe({
  next: data => console.log('数据:', data),
  error: err => console.error('错误:', err)
});

// 组合错误处理模式
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
      console.error('请求失败:', error);
      return of({ error: error.message, data: null });
    }),
    finalize(() => {
      console.log('请求完成');
    })
  );
}
```

## 订阅管理

### 防止内存泄漏

未管理的订阅是 RxJS 应用程序中最常见的内存泄漏源之一。

```javascript
// 错误 - 订阅从未清理
class BadComponent {
  data = [];

  ngOnInit() {
    interval(1000).subscribe(n => {
      this.data.push(n);
    });
    // 这个订阅永远存在，即使组件销毁后
  }
}

// 正确 - 手动清理
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

### takeUntil 模式

在基于组件的框架中管理订阅的最常见模式：

```javascript
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

class Component {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // 当 destroy$ 发出时，所有订阅自动完成
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(n => console.log(n));

    fromEvent(document, 'click').pipe(
      takeUntil(this.destroy$)
    ).subscribe(e => console.log('点击:', e));

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

### 订阅容器

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

### Async Pipe（Angular）

在 Angular 中，async pipe 自动处理订阅管理：

```typescript
// 组件
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
  // 不需要手动管理订阅
}
```

## 实际应用示例

### 自动完成搜索

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
    // 提取输入值
    map(event => event.target.value.trim()),

    // 如果少于 2 个字符则忽略
    filter(query => query.length >= 2),

    // 等待用户停止输入
    debounceTime(300),

    // 只有值变化时才搜索
    distinctUntilChanged(),

    // 显示加载状态
    tap(() => showLoadingIndicator()),

    // 取消前一个请求，发起新请求
    switchMap(query =>
      searchFn(query).pipe(
        catchError(error => {
          console.error('搜索失败:', error);
          return of([]);
        })
      )
    ),

    // 隐藏加载状态
    tap(() => hideLoadingIndicator())
  );
}

// 使用
const searchInput = document.getElementById('search');
const searchFn = query => from(fetch(`/api/search?q=${query}`).then(r => r.json()));

createAutocomplete(searchInput, searchFn).subscribe(results => {
  renderResults(results);
});
```

### 无限滚动

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
    // 检查是否滚动到底部附近
    map(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      return scrollTop + clientHeight >= scrollHeight - 100;
    }),

    // 只在接近底部时发出
    filter(nearBottom => nearBottom),

    // 防止同时加载多次
    exhaustMap(() => loadMore()),

    // 累积已加载的项目
    scan((allItems, newItems) => [...allItems, ...newItems], []),

    // 没有更多项目时停止
    takeWhile(items => items.length > 0, true)
  );
}

// 使用
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

### 实时仪表板

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

// 创建共享的 WebSocket 连接
const messages$ = webSocket('wss://api.example.com/ws').pipe(
  retry({ delay: 5000 }), // 断开时重连
  share() // 在订阅者之间共享单个连接
);

// 过滤和转换不同的消息类型
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

// 按符号聚合交易
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

// 订阅流
trades$.subscribe(trade => updateTickerDisplay(trade));
alerts$.subscribe(alert => showAlert(alert));
aggregatedTrades$.subscribe(data => updateDashboard(data));
```

### 带验证的表单处理

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
      error: email ? '邮箱格式无效' : '邮箱是必填项'
    })),
    startWith({ value: '', valid: false, error: '邮箱是必填项' }),
    shareReplay(1)
  );

  const password$ = fromEvent(form.password, 'input').pipe(
    map(e => e.target.value),
    debounceTime(300),
    distinctUntilChanged(),
    map(password => ({
      value: password,
      valid: password.length >= 8,
      error: password ? '密码至少需要 8 个字符' : '密码是必填项'
    })),
    startWith({ value: '', valid: false, error: '密码是必填项' }),
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

// 使用
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
  console.log('登录结果:', result);
});
```

### 拖放

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

// 使用
const draggable = document.getElementById('draggable');

makeDraggable(draggable).subscribe(pos => {
  draggable.style.left = `${pos.x}px`;
  draggable.style.top = `${pos.y}px`;
});
```

## 测试 RxJS 代码

### 使用 Marble 测试

```javascript
import { TestScheduler } from 'rxjs/testing';
import { map, filter, delay } from 'rxjs/operators';

describe('RxJS 操作符', () => {
  let scheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('应该过滤偶数', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-c-d-|', { a: 1, b: 2, c: 3, d: 4 });
      const expected = '      ---b---d-|';

      const result$ = source$.pipe(filter(x => x % 2 === 0));

      expectObservable(result$).toBe(expected, { b: 2, d: 4 });
    });
  });

  it('应该映射值', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-c-|', { a: 1, b: 2, c: 3 });
      const expected = '      -x-y-z-|';

      const result$ = source$.pipe(map(x => x * 10));

      expectObservable(result$).toBe(expected, { x: 10, y: 20, z: 30 });
    });
  });

  it('应该处理错误', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source$ = cold('  -a-b-#', { a: 1, b: 2 }, new Error('test'));
      const expected = '      -a-b-#';

      expectObservable(source$).toBe(expected, { a: 1, b: 2 }, new Error('test'));
    });
  });
});
```

### Marble 图语法

```javascript
// Marble 语法参考：
// '-'  : 时间帧（默认 10ms）
// 'a'  : 值发出
// '|'  : 完成
// '#'  : 错误
// '()' : 同步分组
// '^'  : 订阅点（用于热 Observable）

// 示例：
'---a---b---|'       // a 在 30ms，b 在 70ms，完成在 110ms
'---(abc)---|'       // a、b、c 在 30ms 同步发出
'---a---#'           // a 在 30ms，错误在 70ms
'--^--a--b--|'       // 订阅在 20ms，a 在 50ms，b 在 80ms
```

### 测试异步代码

```javascript
import { of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';

describe('异步服务', () => {
  it('应该处理异步数据', (done) => {
    const service$ = of('data').pipe(delay(100));

    service$.subscribe({
      next: value => {
        expect(value).toBe('data');
      },
      complete: () => done()
    });
  });

  it('应该处理错误', (done) => {
    const error$ = throwError(() => new Error('测试错误'));

    error$.pipe(
      catchError(err => {
        expect(err.message).toBe('测试错误');
        done();
        return of(null);
      })
    ).subscribe();
  });

  // 使用 fakeAsync（Angular）
  it('应该与 fakeAsync 一起工作', fakeAsync(() => {
    let result;

    of('data').pipe(delay(1000)).subscribe(v => result = v);

    tick(1000);

    expect(result).toBe('data');
  }));
});
```

## 性能优化

### 共享订阅

```javascript
import { share, shareReplay, publish, refCount } from 'rxjs/operators';

// 问题：多个订阅导致多次执行
const expensive$ = of(1).pipe(
  tap(() => console.log('昂贵操作')),
  delay(1000)
);

expensive$.subscribe(v => console.log('Sub 1:', v));
expensive$.subscribe(v => console.log('Sub 2:', v));
// "昂贵操作"被记录两次

// 解决方案：共享订阅
const shared$ = expensive$.pipe(share());

shared$.subscribe(v => console.log('Sub 1:', v));
shared$.subscribe(v => console.log('Sub 2:', v));
// "昂贵操作"只被记录一次

// shareReplay - 向后来的订阅者重放最后 n 个值
const replayed$ = expensive$.pipe(
  shareReplay(1) // 缓存并重放最后一个值
);

replayed$.subscribe(v => console.log('Sub 1:', v));
// 稍后...
setTimeout(() => {
  replayed$.subscribe(v => console.log('Sub 2:', v));
  // 立即获取缓存的值
}, 2000);
```

### 避免内存泄漏

```javascript
// 使用 takeUntil 管理组件生命周期
const destroy$ = new Subject<void>();

longRunning$.pipe(
  takeUntil(destroy$)
).subscribe();

// 清理时
destroy$.next();
destroy$.complete();

// 使用 take 限制订阅
interval(1000).pipe(
  take(10) // 只取前 10 个值
).subscribe();

// 使用 first 获取单个值
someObservable$.pipe(
  first()
).subscribe();
```

### 优化操作符

```javascript
// 使用 distinctUntilChanged 防止不必要的发出
state$.pipe(
  distinctUntilChanged((prev, curr) => prev.id === curr.id)
).subscribe();

// 尽早使用 filter 减少下游工作
source$.pipe(
  filter(x => x.isValid), // 先过滤
  map(x => expensiveTransform(x)) // 再转换
);

// 对高频事件使用 auditTime
scroll$.pipe(
  auditTime(100) // 每 100ms 采样一次
).subscribe();

// 使用 bufferTime 批量更新
updates$.pipe(
  bufferTime(50),
  filter(batch => batch.length > 0)
).subscribe(batch => applyBatchUpdate(batch));
```

## 常见错误和最佳实践

### 常见错误

```javascript
// 错误 1：不取消订阅
// 错误
ngOnInit() {
  this.data$.subscribe(data => this.data = data);
}

// 正确
ngOnInit() {
  this.subscription = this.data$.subscribe(data => this.data = data);
}
ngOnDestroy() {
  this.subscription.unsubscribe();
}

// 错误 2：嵌套订阅
// 错误
user$.subscribe(user => {
  posts$.subscribe(posts => {
    // 嵌套订阅 - 难以管理
  });
});

// 正确
user$.pipe(
  switchMap(user => posts$)
).subscribe(posts => {
  // 扁平订阅
});

// 错误 3：不处理错误
// 错误
http.get('/api/data').subscribe(data => {
  // 如果请求失败怎么办？
});

// 正确
http.get('/api/data').pipe(
  catchError(error => {
    handleError(error);
    return of(defaultValue);
  })
).subscribe(data => {
  // 可以安全使用数据
});

// 错误 4：在 Observable 内创建 Observable 而不扁平化
// 错误
source$.pipe(
  map(x => http.get(`/api/${x}`)) // 创建 Observable，不执行
).subscribe(obs$ => {
  obs$.subscribe(data => {}); // 嵌套订阅
});

// 正确
source$.pipe(
  switchMap(x => http.get(`/api/${x}`))
).subscribe(data => {});
```

### 最佳实践

```javascript
// 1. 使用操作符而不是在 subscribe 中使用副作用
// 错误
source$.subscribe(value => {
  this.data = transform(value);
  this.updateUI();
});

// 正确
source$.pipe(
  map(value => transform(value)),
  tap(data => this.data = data)
).subscribe(() => this.updateUI());

// 2. 保持 subscribe 回调最小化
// 错误
source$.subscribe(value => {
  // 50 行逻辑
});

// 正确
source$.pipe(
  // 在这里进行转换逻辑
).subscribe(value => {
  this.handleValue(value);
});

// 3. 对复杂操作符使用类型断言
const typed$ = source$.pipe(
  filter((x): x is NonNullable<typeof x> => x != null)
);

// 4. 创建可重用的操作符函数
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

// 使用
http.get('/api/data').pipe(
  retryWithDelay(3, 1000)
);

// 5. 为复杂流添加文档
/**
 * 自动完成搜索流
 * - 输入防抖 300ms
 * - 取消前一个请求
 * - 错误时返回空数组
 */
const search$ = input$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => searchApi(term).pipe(
    catchError(() => of([]))
  ))
);
```

## 面试重点

### 常见面试问题

#### Observable 和 Promise 的区别

```javascript
// Promise：
// - 急切的：立即执行
// - 单值：只解析一次
// - 不可取消
// - 总是异步

const promise = new Promise(resolve => {
  console.log('Promise 执行中');
  resolve('done');
});
// "Promise 执行中"立即被记录

// Observable：
// - 惰性的：订阅时执行
// - 多值：可以发出多次
// - 可取消：unsubscribe 停止执行
// - 可以是同步或异步

const observable = new Observable(subscriber => {
  console.log('Observable 执行中');
  subscriber.next('value 1');
  subscriber.next('value 2');
  subscriber.complete();
});
// 订阅之前不会记录任何内容
```

#### 热 Observable 与冷 Observable

```javascript
// 冷 Observable：为每个订阅创建新的生产者
const cold$ = new Observable(subscriber => {
  subscriber.next(Math.random());
});

cold$.subscribe(v => console.log('Sub 1:', v)); // 随机值 A
cold$.subscribe(v => console.log('Sub 2:', v)); // 随机值 B（不同）

// 热 Observable：在订阅之间共享生产者
const subject = new Subject();
const hot$ = subject.asObservable();

hot$.subscribe(v => console.log('Sub 1:', v));
hot$.subscribe(v => console.log('Sub 2:', v));

subject.next(Math.random()); // 两个订阅者获得相同的值
```

#### 何时使用各个扁平化操作符

```javascript
// mergeMap：并行执行，需要所有结果
// 用于：保存多个项目，加载独立资源

// concatMap：顺序执行，顺序重要
// 用于：顺序 API 调用，有序处理

// switchMap：取消前一个，只关心最新的
// 用于：搜索自动完成，路由变化

// exhaustMap：处理时忽略新的
// 用于：表单提交，防止重复点击
```

#### 解释 share 操作符

```javascript
// share() 将源 Observable 多播给多个订阅者
// 它等同于 pipe(multicast(() => new Subject()), refCount())

const source$ = interval(1000).pipe(
  tap(x => console.log('Processing:', x)),
  share()
);

// 没有 share：每个订阅者触发单独的 interval
// 有 share：单个 interval 被所有订阅者共享
```

### 关键概念总结

1. **Observable**：惰性、可取消的流，可以发出多个值
2. **Subject**：既是 Observable 又是 Observer，支持多播
3. **操作符**：转换 Observable 的纯函数，不会改变原对象
4. **Subscription**：代表执行，必须清理
5. **热 vs 冷**：冷创建新生产者，热共享生产者
6. **高阶 Observable**：发出 Observable 的 Observable
7. **Scheduler**：控制工作何时何地发生

### 最佳实践总结

1. 始终取消订阅或使用 takeUntil 模式
2. 根据用例使用适当的扁平化操作符
3. 在流的每个层级处理错误
4. 共享昂贵的 Observable 以避免重复工作
5. 保持 subscribe 回调最小化
6. 在 RxJS 中使用强类型
7. 使用 marble 图测试复杂流

## 总结

RxJS 为 JavaScript 应用程序中处理异步数据流提供了强大的范式。掌握 RxJS 的关键在于理解：

- **核心概念**：Observable、Observer、Subscription 和 Subject
- **操作符类别**：创建、转换、过滤、组合和错误处理
- **订阅管理**：通过适当的清理防止内存泄漏
- **实际模式**：自动完成、无限滚动、实时更新

通过一致地应用这些概念，你可以构建使用干净、可维护代码处理复杂异步场景的响应式应用程序。

关键要点：

- Observable 是惰性和可取消的，不同于 Promise
- 选择正确的扁平化操作符（mergeMap、switchMap、concatMap、exhaustMap）
- 始终管理订阅以防止内存泄漏
- 使用 Subject 进行多播和状态管理
- 使用 marble 图测试复杂流
- 共享昂贵的 Observable 以优化性能

通过持续练习和应用响应式思维，你将能够在应用程序中优雅地处理复杂的异步场景。
