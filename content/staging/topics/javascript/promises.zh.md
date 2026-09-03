---
title: JavaScript Promise 详解
description: 深入理解 Promise：状态、链式调用、错误处理与组合方法
track: javascript
section: async
difficulty: intermediate
tags:
  - JavaScript
  - Promise
  - 异步
  - 并发
status: imported
origin: old/src/content/docs/javascript/promises.zh.md
divergence: 0.067
issues: []
legacy:
  category: JavaScript
  subcategory: 异步编程
  order: 5
  lastUpdated: 2026-01-07
---

Promise 是 JavaScript 中处理异步操作的强大工具。它代表了一个异步操作的最终完成或失败，以及其结果值。Promise 提供了一种更优雅的方式来处理异步代码，避免了传统回调函数的"回调地狱"问题。

## Promise 的三种状态

Promise 对象有三种互斥的状态：

1. **Pending（进行中）**：初始状态，既没有被完成，也没有被拒绝
2. **Fulfilled（已完成）**：操作成功完成
3. **Rejected（已拒绝）**：操作失败

```javascript
// 创建一个 Promise
const promise = new Promise((resolve, reject) => {
  // 异步操作
  const success = Math.random() > 0.5;

  setTimeout(() => {
    if (success) {
      resolve('操作成功！'); // 状态变为 fulfilled
    } else {
      reject('操作失败！'); // 状态变为 rejected
    }
  }, 1000);
});

console.log(promise); // Promise { <pending> }
```

**重要特性**：

- Promise 的状态只能从 `pending` 转变为 `fulfilled` 或 `rejected`
- 状态一旦改变，就不会再变，这个状态会被永久保持
- 状态改变后，任何时候都可以获得这个结果

## 基本用法

### 创建 Promise

```javascript
// 方式 1：使用 Promise 构造函数
const fetchData = new Promise((resolve, reject) => {
  // 模拟异步操作
  setTimeout(() => {
    const data = { id: 1, name: '用户数据' };
    resolve(data);
  }, 1000);
});

// 方式 2：使用静态方法
const resolvedPromise = Promise.resolve('立即解决');
const rejectedPromise = Promise.reject(new Error('立即拒绝'));
```

### then() 方法

`then()` 方法用于指定 Promise 状态改变时的回调函数。

```javascript
fetchData.then(
  // 成功回调
  (result) => {
    console.log('成功：', result);
  },
  // 失败回调（可选）
  (error) => {
    console.log('失败：', error);
  }
);

// 更常见的写法：只处理成功情况
fetchData.then((result) => {
  console.log('获取到数据：', result);
});
```

### catch() 方法

`catch()` 方法用于指定发生错误时的回调函数，是 `.then(null, rejection)` 的别名。

```javascript
const riskyOperation = new Promise((resolve, reject) => {
  const random = Math.random();
  if (random > 0.5) {
    resolve('成功');
  } else {
    reject(new Error('操作失败'));
  }
});

riskyOperation
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error('捕获错误：', error.message);
  });
```

### finally() 方法

`finally()` 方法用于指定不管 Promise 最后状态如何都会执行的操作。

```javascript
let isLoading = true;

fetchData
  .then((data) => {
    console.log('数据：', data);
  })
  .catch((error) => {
    console.error('错误：', error);
  })
  .finally(() => {
    isLoading = false;
    console.log('请求完成，停止加载动画');
  });
```

## Promise 链式调用

Promise 的强大之处在于可以链式调用，每个 `then()` 方法都返回一个新的 Promise。

### 基础链式调用

```javascript
// 顺序执行多个异步操作
function step1() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('步骤 1 完成');
      resolve(1);
    }, 1000);
  });
}

function step2(value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('步骤 2 完成');
      resolve(value + 1);
    }, 1000);
  });
}

function step3(value) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('步骤 3 完成');
      resolve(value + 1);
    }, 1000);
  });
}

// 链式调用
step1()
  .then((result) => {
    console.log('第一步结果：', result);
    return step2(result);
  })
  .then((result) => {
    console.log('第二步结果：', result);
    return step3(result);
  })
  .then((result) => {
    console.log('最终结果：', result); // 3
  })
  .catch((error) => {
    console.error('出错了：', error);
  });
```

### 返回值的传递

```javascript
Promise.resolve(5)
  .then((num) => {
    console.log(num); // 5
    return num * 2; // 返回普通值
  })
  .then((num) => {
    console.log(num); // 10
    return Promise.resolve(num + 10); // 返回 Promise
  })
  .then((num) => {
    console.log(num); // 20
    // 不返回任何值，下一个 then 会收到 undefined
  })
  .then((num) => {
    console.log(num); // undefined
  });
```

### 实际应用示例

```javascript
// 模拟用户登录流程
function login(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === 'admin' && password === '123456') {
        resolve({ token: 'abc123', userId: 1 });
      } else {
        reject(new Error('用户名或密码错误'));
      }
    }, 1000);
  });
}

function getUserInfo(token) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 1,
        name: '张三',
        email: 'zhangsan@example.com'
      });
    }, 1000);
  });
}

function getPermissions(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(['read', 'write', 'delete']);
    }, 1000);
  });
}

// 完整的登录流程
login('admin', '123456')
  .then((authData) => {
    console.log('登录成功，Token:', authData.token);
    return getUserInfo(authData.token);
  })
  .then((userInfo) => {
    console.log('用户信息：', userInfo);
    return getPermissions(userInfo.id);
  })
  .then((permissions) => {
    console.log('用户权限：', permissions);
  })
  .catch((error) => {
    console.error('流程出错：', error.message);
  })
  .finally(() => {
    console.log('登录流程结束');
  });
```

## Promise 错误处理

### 错误捕获机制

```javascript
// Promise 链中的错误会向下传播，直到被 catch 捕获
Promise.resolve()
  .then(() => {
    console.log('步骤 1');
    throw new Error('步骤 1 出错');
  })
  .then(() => {
    console.log('步骤 2'); // 不会执行
  })
  .then(() => {
    console.log('步骤 3'); // 不会执行
  })
  .catch((error) => {
    console.error('捕获到错误：', error.message);
    return '错误已处理'; // 可以从错误中恢复
  })
  .then((result) => {
    console.log('继续执行：', result); // 会执行
  });
```

### 多个 catch 的使用

```javascript
fetch('/api/data')
  .then((response) => {
    if (!response.ok) {
      throw new Error('HTTP 错误：' + response.status);
    }
    return response.json();
  })
  .catch((error) => {
    console.error('网络错误：', error);
    throw error; // 重新抛出错误
  })
  .then((data) => {
    return processData(data);
  })
  .catch((error) => {
    console.error('数据处理错误：', error);
  });
```

### 错误处理最佳实践

```javascript
// 1. 始终添加 catch 处理
someAsyncOperation()
  .then(handleSuccess)
  .catch(handleError);

// 2. 在 Promise 构造函数中捕获同步错误
const safePromise = new Promise((resolve, reject) => {
  try {
    const result = riskyOperation();
    resolve(result);
  } catch (error) {
    reject(error);
  }
});

// 3. 使用 finally 清理资源
fetchDataFromAPI()
  .then(processData)
  .catch(logError)
  .finally(() => {
    closeConnection();
    hideLoadingSpinner();
  });
```

## Promise 组合方法

### Promise.all()

`Promise.all()` 等待所有 Promise 完成（或任一 Promise 失败）。

```javascript
const promise1 = Promise.resolve(3);
const promise2 = new Promise((resolve) => setTimeout(() => resolve('foo'), 100));
const promise3 = new Promise((resolve) => setTimeout(() => resolve('bar'), 200));

Promise.all([promise1, promise2, promise3])
  .then((values) => {
    console.log(values); // [3, 'foo', 'bar']
  })
  .catch((error) => {
    console.error('有 Promise 失败了：', error);
  });

// 实际应用：并行请求多个 API
async function fetchAllUserData(userId) {
  const promises = [
    fetch(`/api/user/${userId}`).then(r => r.json()),
    fetch(`/api/user/${userId}/posts`).then(r => r.json()),
    fetch(`/api/user/${userId}/comments`).then(r => r.json())
  ];

  try {
    const [user, posts, comments] = await Promise.all(promises);
    return { user, posts, comments };
  } catch (error) {
    console.error('获取用户数据失败：', error);
    throw error;
  }
}
```

**特点**：
- 所有 Promise 都成功时，返回所有结果的数组
- 任一 Promise 失败时，立即返回第一个失败的结果
- 结果顺序与传入顺序一致

### Promise.race()

`Promise.race()` 返回最先完成的 Promise 的结果（无论成功或失败）。

```javascript
const slow = new Promise((resolve) => {
  setTimeout(() => resolve('慢速响应'), 2000);
});

const fast = new Promise((resolve) => {
  setTimeout(() => resolve('快速响应'), 500);
});

Promise.race([slow, fast])
  .then((value) => {
    console.log(value); // '快速响应'
  });

// 实际应用：超时控制
function fetchWithTimeout(url, timeout = 5000) {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

fetchWithTimeout('/api/data', 3000)
  .then((response) => response.json())
  .then((data) => console.log('数据：', data))
  .catch((error) => console.error('错误：', error.message));
```

### Promise.allSettled()

`Promise.allSettled()` 等待所有 Promise 完成（无论成功或失败），返回所有结果。

```javascript
const promises = [
  Promise.resolve('成功 1'),
  Promise.reject('失败 1'),
  Promise.resolve('成功 2'),
  Promise.reject('失败 2')
];

Promise.allSettled(promises)
  .then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Promise ${index} 成功：`, result.value);
      } else {
        console.log(`Promise ${index} 失败：`, result.reason);
      }
    });
  });

// 输出：
// Promise 0 成功： 成功 1
// Promise 1 失败： 失败 1
// Promise 2 成功： 成功 2
// Promise 3 失败： 失败 2

// 实际应用：批量操作，需要知道所有结果
async function batchUpdateUsers(userIds) {
  const updatePromises = userIds.map(id =>
    fetch(`/api/user/${id}`, { method: 'PUT', body: JSON.stringify({ active: true }) })
      .then(r => r.json())
  );

  const results = await Promise.allSettled(updatePromises);

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`更新完成：${succeeded} 成功，${failed} 失败`);
  return results;
}
```

### Promise.any()

`Promise.any()` 返回第一个成功的 Promise，所有 Promise 都失败时才失败。

```javascript
const promise1 = Promise.reject('错误 1');
const promise2 = new Promise((resolve) => setTimeout(() => resolve('成功 2'), 100));
const promise3 = new Promise((resolve) => setTimeout(() => resolve('成功 3'), 200));

Promise.any([promise1, promise2, promise3])
  .then((value) => {
    console.log('第一个成功的结果：', value); // '成功 2'
  })
  .catch((error) => {
    console.error('所有 Promise 都失败了：', error);
  });

// 实际应用：从多个源获取数据，只要有一个成功即可
async function fetchFromMultipleSources(endpoints) {
  const promises = endpoints.map(url =>
    fetch(url).then(r => r.json())
  );

  try {
    const data = await Promise.any(promises);
    console.log('从某个源获取到数据：', data);
    return data;
  } catch (error) {
    console.error('所有数据源都失败了');
    throw new Error('无法获取数据');
  }
}

// 使用示例
fetchFromMultipleSources([
  'https://api1.example.com/data',
  'https://api2.example.com/data',
  'https://api3.example.com/data'
]);
```

## Promise 组合方法对比

| 方法 | 成功条件 | 失败条件 | 返回值 | 使用场景 |
|------|---------|---------|--------|---------|
| `Promise.all()` | 所有成功 | 任一失败 | 结果数组 | 所有操作都必须成功 |
| `Promise.race()` | 首个完成 | 首个失败 | 首个结果 | 超时控制、快速响应 |
| `Promise.allSettled()` | 所有完成 | 不会失败 | 状态数组 | 需要所有结果（成功或失败） |
| `Promise.any()` | 任一成功 | 所有失败 | 首个成功结果 | 只需一个成功结果 |

## 高级技巧

### Promise 队列执行

```javascript
// 顺序执行 Promise 数组
function sequentialExecute(tasks) {
  return tasks.reduce((promiseChain, currentTask) => {
    return promiseChain.then(currentTask);
  }, Promise.resolve());
}

// 使用示例
const tasks = [
  () => new Promise(resolve => setTimeout(() => {
    console.log('任务 1');
    resolve();
  }, 1000)),
  () => new Promise(resolve => setTimeout(() => {
    console.log('任务 2');
    resolve();
  }, 1000)),
  () => new Promise(resolve => setTimeout(() => {
    console.log('任务 3');
    resolve();
  }, 1000))
];

sequentialExecute(tasks).then(() => {
  console.log('所有任务完成');
});
```

### Promise 重试机制

```javascript
function retry(fn, maxAttempts = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    function attempt(attemptNumber) {
      fn()
        .then(resolve)
        .catch((error) => {
          if (attemptNumber >= maxAttempts) {
            reject(new Error(`失败 ${maxAttempts} 次：${error.message}`));
          } else {
            console.log(`尝试 ${attemptNumber} 失败，${delay}ms 后重试...`);
            setTimeout(() => {
              attempt(attemptNumber + 1);
            }, delay);
          }
        });
    }
    attempt(1);
  });
}

// 使用示例
retry(
  () => fetch('/api/unreliable-endpoint').then(r => r.json()),
  5,
  2000
)
  .then(data => console.log('成功获取数据：', data))
  .catch(error => console.error('重试失败：', error.message));
```

### Promise 缓存

```javascript
const cache = new Map();

function cachedFetch(url) {
  if (cache.has(url)) {
    console.log('从缓存返回：', url);
    return Promise.resolve(cache.get(url));
  }

  return fetch(url)
    .then(response => response.json())
    .then(data => {
      cache.set(url, data);
      console.log('从网络获取并缓存：', url);
      return data;
    });
}

// 使用示例
cachedFetch('/api/user/1').then(console.log); // 从网络获取
cachedFetch('/api/user/1').then(console.log); // 从缓存返回
```

### 并发限制

```javascript
// 限制并发数量的 Promise 执行
function limitConcurrency(tasks, limit) {
  let index = 0;
  const results = [];
  const executing = [];

  function enqueue() {
    if (index === tasks.length) {
      return Promise.resolve();
    }

    const task = tasks[index];
    const taskIndex = index;
    index++;

    const promise = Promise.resolve().then(() => task());
    results[taskIndex] = promise;

    const clean = () => {
      const idx = executing.indexOf(promise);
      if (idx > -1) executing.splice(idx, 1);
    };

    executing.push(promise);
    promise.then(clean).catch(clean);

    let race = Promise.resolve();
    if (executing.length >= limit) {
      race = Promise.race(executing);
    }

    return race.then(() => enqueue());
  }

  return enqueue().then(() => Promise.all(results));
}

// 使用示例：同时最多执行 3 个请求
const urls = Array.from({ length: 10 }, (_, i) => `/api/item/${i}`);
const fetchTasks = urls.map(url => () => fetch(url).then(r => r.json()));

limitConcurrency(fetchTasks, 3)
  .then(results => console.log('所有请求完成：', results))
  .catch(error => console.error('出错：', error));
```

## 常见陷阱与注意事项

### 忘记返回 Promise

```javascript
// 错误示例
doSomething()
  .then(() => {
    doSomethingElse(); // 忘记返回！
  })
  .then(() => {
    // doSomethingElse 可能还没完成
  });

// 正确示例
doSomething()
  .then(() => {
    return doSomethingElse(); // 返回 Promise
  })
  .then(() => {
    // doSomethingElse 已完成
  });
```

### Promise 链断裂

```javascript
// 错误示例
Promise.resolve('开始')
  .then((value) => {
    console.log(value);
    Promise.resolve('中间'); // 新的 Promise 链，不会连接
  })
  .then((value) => {
    console.log(value); // undefined
  });

// 正确示例
Promise.resolve('开始')
  .then((value) => {
    console.log(value);
    return Promise.resolve('中间'); // 返回 Promise
  })
  .then((value) => {
    console.log(value); // '中间'
  });
```

### catch 的位置

```javascript
// catch 会捕获之前所有的错误
promise1
  .then(promise2)
  .then(promise3)
  .catch(handleError); // 捕获所有错误

// 中间的 catch 可以恢复链
promise1
  .then(promise2)
  .catch(handleError) // 只捕获 promise1 和 promise2 的错误
  .then(promise3); // 如果前面恢复了，这里会继续执行
```

### 在循环中创建 Promise

```javascript
// 问题示例
const promises = [];
for (let i = 0; i < 5; i++) {
  promises.push(
    new Promise((resolve) => {
      setTimeout(() => {
        console.log(i); // 全部输出 5
        resolve(i);
      }, 1000);
    })
  );
}

// 解决方案 1：使用 let 块级作用域（已经正确）
// 解决方案 2：使用立即执行函数
for (var i = 0; i < 5; i++) {
  (function(index) {
    promises.push(
      new Promise((resolve) => {
        setTimeout(() => {
          console.log(index); // 输出 0-4
          resolve(index);
        }, 1000);
      })
    );
  })(i);
}
```

## 总结

Promise 是现代 JavaScript 异步编程的基石，掌握 Promise 对于编写高质量的异步代码至关重要。

**关键要点**：

1. **状态管理**：理解 pending、fulfilled、rejected 三种状态及其转换规则
2. **链式调用**：充分利用 then/catch/finally 构建清晰的异步流程
3. **错误处理**：始终添加 catch 处理错误，避免未捕获的 Promise 拒绝
4. **组合方法**：根据场景选择合适的 Promise.all/race/allSettled/any
5. **最佳实践**：避免常见陷阱，使用高级技巧优化代码性能

随着 async/await 的普及，Promise 的使用变得更加简洁和直观，但深入理解 Promise 的工作原理仍然是每个 JavaScript 开发者的必修课。
