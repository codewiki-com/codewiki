---
title: JavaScript 闭包深入理解
description: 深入理解 JavaScript 闭包的原理、作用域链、内存管理和实际应用场景
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 闭包
  - 作用域
  - 内存
status: imported
origin: old/src/content/docs/javascript/closures.zh.md
divergence: 0.166
issues: []
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 20
  lastUpdated: 2026-01-07
---

闭包（Closure）是 JavaScript 中最强大也最容易被误解的概念之一。理解闭包对于编写高质量的 JavaScript 代码至关重要，它是函数式编程、模块化设计和许多设计模式的基础。

## 什么是闭包

### 官方定义

闭包是指一个函数能够记住并访问其词法作用域，即使该函数在其词法作用域之外执行。

简单来说，闭包就是**函数**加上其**周围状态（词法环境）的引用**的组合。

### 通俗理解

```javascript
function outer() {
  const message = '你好，闭包';

  function inner() {
    console.log(message); // inner 可以访问 outer 的变量
  }

  return inner;
}

const myFunc = outer();
myFunc(); // 输出: "你好，闭包"
```

在这个例子中：
- `inner` 函数在 `outer` 函数内部定义
- `inner` 引用了 `outer` 作用域中的变量 `message`
- 即使 `outer` 已经执行完毕，`inner` 仍然可以访问 `message`
- 这个 `inner` 函数连同它所引用的 `message` 变量，就形成了一个闭包

## 词法作用域（Lexical Scope）

理解闭包的前提是理解词法作用域。

### 什么是词法作用域

词法作用域也叫静态作用域，是指变量的作用域在代码编写时就已经确定，而不是在运行时确定。

```javascript
const globalVar = '全局变量';

function outerFunc() {
  const outerVar = '外层变量';

  function innerFunc() {
    const innerVar = '内层变量';

    // 可以访问所有层级的变量
    console.log(globalVar); // "全局变量"
    console.log(outerVar);  // "外层变量"
    console.log(innerVar);  // "内层变量"
  }

  innerFunc();
}

outerFunc();
```

### 词法作用域的特点

1. **静态确定**：作用域在代码编写时确定，与函数调用位置无关
2. **嵌套结构**：内部作用域可以访问外部作用域的变量
3. **单向访问**：外部作用域无法访问内部作用域的变量

```javascript
function createGreeting(greeting) {
  // greeting 在这里被"记住"
  return function(name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHello = createGreeting('你好');
const sayGoodbye = createGreeting('再见');

console.log(sayHello('小明'));   // "你好, 小明!"
console.log(sayGoodbye('小红')); // "再见, 小红!"
```

## 作用域链（Scope Chain）

### 作用域链的形成

当函数被创建时，JavaScript 引擎会创建一个作用域链，用于变量查找。

```javascript
const a = 1;

function first() {
  const b = 2;

  function second() {
    const c = 3;

    function third() {
      const d = 4;
      // 作用域链: third -> second -> first -> global
      console.log(a, b, c, d); // 1, 2, 3, 4
    }

    third();
  }

  second();
}

first();
```

### 变量查找规则

变量查找从当前作用域开始，沿着作用域链向上查找，直到找到变量或到达全局作用域。

```javascript
const value = '全局';

function outer() {
  const value = '外层';

  function inner() {
    const value = '内层';
    console.log(value); // "内层" - 在当前作用域找到
  }

  function another() {
    console.log(value); // "外层" - 在外层作用域找到
  }

  inner();
  another();
}

outer();
```

### 作用域链的图解

```
┌─────────────────────────────────────┐
│           全局作用域                 │
│  ┌─────────────────────────────┐   │
│  │       outer 作用域           │   │
│  │  ┌─────────────────────┐   │   │
│  │  │    inner 作用域      │   │   │
│  │  │                     │   │   │
│  │  │  变量查找方向: ↑     │   │   │
│  │  └─────────────────────┘   │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## 闭包的创建时机

### 每个函数都是闭包

从技术角度来说，JavaScript 中的每个函数都是闭包，因为每个函数都能访问其外部作用域。

```javascript
// 这也是一个闭包，它可以访问全局作用域
function simpleFunction() {
  console.log(window); // 访问全局对象
}
```

### 典型的闭包场景

```javascript
// 1. 函数作为返回值
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}

// 2. 函数作为参数
function processArray(arr, callback) {
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    results.push(callback(arr[i], i));
  }
  return results;
}

// 3. IIFE（立即执行函数表达式）
const module = (function() {
  const privateVar = '私有变量';
  return {
    getPrivate: function() {
      return privateVar;
    }
  };
})();

// 4. 事件处理器
function setupButton(buttonId, message) {
  document.getElementById(buttonId).addEventListener('click', function() {
    alert(message); // message 被闭包捕获
  });
}
```

## 内存管理与闭包

### 闭包与垃圾回收

闭包会阻止其引用的变量被垃圾回收，这可能导致内存问题。

```javascript
function createHeavyClosure() {
  const hugeArray = new Array(1000000).fill('数据');

  return function() {
    // 只用到了数组的长度，但整个数组都被保留在内存中
    return hugeArray.length;
  };
}

const getLength = createHeavyClosure();
// hugeArray 仍然在内存中，因为闭包引用了它
```

### 优化内存使用

```javascript
function createOptimizedClosure() {
  const hugeArray = new Array(1000000).fill('数据');
  const length = hugeArray.length; // 只保存需要的数据

  // hugeArray 可以被垃圾回收了
  return function() {
    return length;
  };
}
```

### 避免内存泄漏

```javascript
// 错误示例：可能导致内存泄漏
function setupHandler() {
  const element = document.getElementById('myButton');
  const heavyData = loadHeavyData();

  element.addEventListener('click', function() {
    console.log(heavyData);
  });

  // element 和 heavyData 都被闭包引用，无法被回收
}

// 正确示例：清理不需要的引用
function setupHandlerCorrectly() {
  const element = document.getElementById('myButton');
  const heavyData = loadHeavyData();

  function handleClick() {
    console.log(heavyData);
  }

  element.addEventListener('click', handleClick);

  // 返回清理函数
  return function cleanup() {
    element.removeEventListener('click', handleClick);
  };
}
```

## 常见的闭包模式

### 模块模式

使用闭包创建私有变量和方法。

```javascript
const Calculator = (function() {
  // 私有变量
  let result = 0;

  // 私有方法
  function validate(n) {
    return typeof n === 'number' && !isNaN(n);
  }

  // 公共 API
  return {
    add: function(n) {
      if (validate(n)) result += n;
      return this;
    },
    subtract: function(n) {
      if (validate(n)) result -= n;
      return this;
    },
    multiply: function(n) {
      if (validate(n)) result *= n;
      return this;
    },
    divide: function(n) {
      if (validate(n) && n !== 0) result /= n;
      return this;
    },
    getResult: function() {
      return result;
    },
    reset: function() {
      result = 0;
      return this;
    }
  };
})();

Calculator.add(10).multiply(2).subtract(5).getResult(); // 15
```

### 工厂函数

```javascript
function createPerson(name, age) {
  // 私有数据
  let _name = name;
  let _age = age;

  return {
    getName: function() {
      return _name;
    },
    getAge: function() {
      return _age;
    },
    setName: function(newName) {
      if (typeof newName === 'string' && newName.length > 0) {
        _name = newName;
      }
    },
    haveBirthday: function() {
      _age++;
      console.log(`生日快乐！${_name} 现在 ${_age} 岁了`);
    }
  };
}

const person = createPerson('小明', 25);
person.getName();      // "小明"
person.haveBirthday(); // "生日快乐！小明 现在 26 岁了"
```

### 函数柯里化

```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...moreArgs) {
      return curried.apply(this, args.concat(moreArgs));
    };
  };
}

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));    // 6
console.log(curriedAdd(1, 2)(3));    // 6
console.log(curriedAdd(1)(2, 3));    // 6
console.log(curriedAdd(1, 2, 3));    // 6
```

### 函数记忆化（Memoization）

```javascript
function memoize(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('从缓存获取');
      return cache.get(key);
    }

    console.log('计算新结果');
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 使用示例：斐波那契数列
const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

console.log(fibonacci(40)); // 快速计算，得益于缓存
```

### 单例模式

```javascript
const Singleton = (function() {
  let instance;

  function createInstance() {
    return {
      name: '单例对象',
      timestamp: Date.now(),
      getData: function() {
        return `${this.name} 创建于 ${this.timestamp}`;
      }
    };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const obj1 = Singleton.getInstance();
const obj2 = Singleton.getInstance();
console.log(obj1 === obj2); // true
```

### 防抖与节流

```javascript
// 防抖：延迟执行，重复触发会重置计时器
function debounce(fn, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流：固定时间间隔执行
function throttle(fn, interval) {
  let lastTime = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 使用示例
const debouncedSearch = debounce(function(query) {
  console.log('搜索:', query);
}, 300);

const throttledScroll = throttle(function() {
  console.log('滚动位置:', window.scrollY);
}, 100);
```

## 闭包的常见陷阱

### 循环中的闭包问题

这是最经典的闭包陷阱之一。

```javascript
// 问题代码
function createFunctions() {
  const functions = [];

  for (var i = 0; i < 3; i++) {
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

const funcs = createFunctions();
funcs[0](); // 3（不是预期的 0）
funcs[1](); // 3（不是预期的 1）
funcs[2](); // 3（不是预期的 2）
```

**原因分析**：`var` 声明的变量没有块级作用域，所有函数共享同一个 `i`。当循环结束时，`i` 的值是 3。

**解决方案一：使用 `let`**

```javascript
function createFunctions() {
  const functions = [];

  for (let i = 0; i < 3; i++) {
    functions.push(function() {
      console.log(i);
    });
  }

  return functions;
}

const funcs = createFunctions();
funcs[0](); // 0
funcs[1](); // 1
funcs[2](); // 2
```

**解决方案二：使用 IIFE**

```javascript
function createFunctions() {
  const functions = [];

  for (var i = 0; i < 3; i++) {
    functions.push((function(j) {
      return function() {
        console.log(j);
      };
    })(i));
  }

  return functions;
}
```

**解决方案三：使用 `forEach`**

```javascript
function createFunctions() {
  const functions = [];

  [0, 1, 2].forEach(function(i) {
    functions.push(function() {
      console.log(i);
    });
  });

  return functions;
}
```

### 意外的变量共享

```javascript
// 问题代码
function createActions(actions) {
  const handlers = {};

  for (var i = 0; i < actions.length; i++) {
    var action = actions[i];
    handlers[action] = function() {
      console.log('执行:', action);
    };
  }

  return handlers;
}

const handlers = createActions(['save', 'load', 'delete']);
handlers.save();   // "执行: delete"（错误）
handlers.load();   // "执行: delete"（错误）
handlers.delete(); // "执行: delete"
```

**解决方案**

```javascript
function createActions(actions) {
  const handlers = {};

  for (const action of actions) {
    handlers[action] = function() {
      console.log('执行:', action);
    };
  }

  return handlers;
}

// 或者使用更现代的方式
function createActions(actions) {
  return actions.reduce((handlers, action) => {
    handlers[action] = () => console.log('执行:', action);
    return handlers;
  }, {});
}
```

### this 绑定问题

```javascript
const obj = {
  name: '对象',
  greet: function() {
    setTimeout(function() {
      // this 指向 window/global，不是 obj
      console.log('你好，' + this.name);
    }, 100);
  }
};

obj.greet(); // "你好，undefined"
```

**解决方案一：保存 this 引用**

```javascript
const obj = {
  name: '对象',
  greet: function() {
    const self = this;
    setTimeout(function() {
      console.log('你好，' + self.name);
    }, 100);
  }
};
```

**解决方案二：使用箭头函数**

```javascript
const obj = {
  name: '对象',
  greet: function() {
    setTimeout(() => {
      // 箭头函数继承外层 this
      console.log('你好，' + this.name);
    }, 100);
  }
};
```

**解决方案三：使用 bind**

```javascript
const obj = {
  name: '对象',
  greet: function() {
    setTimeout(function() {
      console.log('你好，' + this.name);
    }.bind(this), 100);
  }
};
```

### 闭包与性能

```javascript
// 不推荐：每次调用都创建新函数
function processItems(items) {
  return items.map(function(item) {
    // 这个函数被创建了 items.length 次
    return item * 2;
  });
}

// 推荐：复用函数
function double(item) {
  return item * 2;
}

function processItems(items) {
  return items.map(double);
}
```

## 实际应用场景

### 数据封装与私有变量

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance;
  const transactions = [];

  function recordTransaction(type, amount) {
    transactions.push({
      type,
      amount,
      balance,
      timestamp: new Date()
    });
  }

  return {
    deposit: function(amount) {
      if (amount > 0) {
        balance += amount;
        recordTransaction('存款', amount);
        return true;
      }
      return false;
    },
    withdraw: function(amount) {
      if (amount > 0 && amount <= balance) {
        balance -= amount;
        recordTransaction('取款', amount);
        return true;
      }
      return false;
    },
    getBalance: function() {
      return balance;
    },
    getTransactionHistory: function() {
      return [...transactions]; // 返回副本，保护原数据
    }
  };
}

const account = createBankAccount(1000);
account.deposit(500);
account.withdraw(200);
console.log(account.getBalance()); // 1300
```

### 事件处理器中的状态管理

```javascript
function createToggle(element) {
  let isActive = false;

  element.addEventListener('click', function() {
    isActive = !isActive;
    element.classList.toggle('active', isActive);
    element.textContent = isActive ? '开启' : '关闭';
  });

  return {
    getState: function() {
      return isActive;
    },
    setState: function(state) {
      if (isActive !== state) {
        isActive = state;
        element.classList.toggle('active', isActive);
        element.textContent = isActive ? '开启' : '关闭';
      }
    }
  };
}
```

### 配置函数

```javascript
function createApiClient(baseUrl, defaultHeaders = {}) {
  async function request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...defaultHeaders
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, config);
    return response.json();
  }

  return {
    get: (endpoint) => request('GET', endpoint),
    post: (endpoint, data) => request('POST', endpoint, data),
    put: (endpoint, data) => request('PUT', endpoint, data),
    delete: (endpoint) => request('DELETE', endpoint)
  };
}

const api = createApiClient('https://api.example.com', {
  'Authorization': 'Bearer token123'
});

// 使用
api.get('/users');
api.post('/users', { name: '新用户' });
```

### 状态机

```javascript
function createStateMachine(initialState, transitions) {
  let currentState = initialState;
  const listeners = [];

  function notify() {
    listeners.forEach(listener => listener(currentState));
  }

  return {
    getState: function() {
      return currentState;
    },
    transition: function(action) {
      const nextState = transitions[currentState]?.[action];
      if (nextState) {
        console.log(`${currentState} -> ${nextState} (${action})`);
        currentState = nextState;
        notify();
        return true;
      }
      console.log(`无效的转换: ${currentState} + ${action}`);
      return false;
    },
    subscribe: function(listener) {
      listeners.push(listener);
      return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    }
  };
}

// 使用示例：订单状态机
const orderMachine = createStateMachine('pending', {
  pending: { pay: 'paid', cancel: 'cancelled' },
  paid: { ship: 'shipped', refund: 'refunded' },
  shipped: { deliver: 'delivered', return: 'returned' },
  delivered: { return: 'returned' },
  cancelled: {},
  refunded: {},
  returned: { refund: 'refunded' }
});

orderMachine.subscribe(state => console.log('当前状态:', state));
orderMachine.transition('pay');     // pending -> paid
orderMachine.transition('ship');    // paid -> shipped
orderMachine.transition('deliver'); // shipped -> delivered
```

### 延迟初始化

```javascript
function createLazyLoader(initFn) {
  let value;
  let initialized = false;

  return function() {
    if (!initialized) {
      value = initFn();
      initialized = true;
      console.log('已初始化');
    }
    return value;
  };
}

// 使用示例
const getExpensiveResource = createLazyLoader(function() {
  console.log('加载昂贵资源...');
  return { data: '大量数据', timestamp: Date.now() };
});

// 第一次调用会初始化
const resource1 = getExpensiveResource(); // "加载昂贵资源..." "已初始化"

// 后续调用直接返回缓存的值
const resource2 = getExpensiveResource(); // 无输出
console.log(resource1 === resource2); // true
```

## 闭包与现代 JavaScript

### 与 ES6+ 特性结合

```javascript
// 箭头函数与闭包
const createMultiplier = (factor) => (number) => number * factor;

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// 解构与闭包
function createPoint(x, y) {
  return {
    getCoordinates: () => ({ x, y }),
    distanceTo: ({ x: x2, y: y2 }) => {
      return Math.sqrt((x2 - x) ** 2 + (y2 - y) ** 2);
    }
  };
}

const point1 = createPoint(0, 0);
const point2 = createPoint(3, 4);
console.log(point1.distanceTo(point2.getCoordinates())); // 5
```

### 与 async/await 结合

```javascript
function createRateLimiter(maxRequests, timeWindow) {
  const requests = [];

  return async function rateLimitedFetch(url, options) {
    const now = Date.now();

    // 清理过期的请求记录
    while (requests.length && requests[0] < now - timeWindow) {
      requests.shift();
    }

    // 检查是否超过限制
    if (requests.length >= maxRequests) {
      const waitTime = requests[0] + timeWindow - now;
      console.log(`等待 ${waitTime}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return rateLimitedFetch(url, options);
    }

    requests.push(now);
    return fetch(url, options);
  };
}

const limitedFetch = createRateLimiter(5, 1000); // 每秒最多 5 个请求
```

## 调试闭包

### 使用开发者工具

在 Chrome DevTools 中，可以通过以下方式调试闭包：

1. **设置断点**：在闭包函数内部设置断点
2. **查看 Scope 面板**：观察 Closure 作用域中的变量
3. **使用 `console.dir`**：查看函数的 `[[Scopes]]` 属性

```javascript
function outer() {
  const secret = '秘密数据';

  return function inner() {
    debugger; // 在此处暂停，查看 Scope 面板
    return secret;
  };
}

const fn = outer();
console.dir(fn); // 可以看到 [[Scopes]] 包含 secret
```

### 命名闭包函数

给闭包函数命名有助于调试：

```javascript
// 不推荐：匿名函数难以在调用栈中追踪
element.addEventListener('click', function() {
  // ...
});

// 推荐：命名函数便于调试
element.addEventListener('click', function handleClick() {
  // ...
});
```

## 总结

闭包是 JavaScript 中的核心概念，它的本质是：

1. **函数可以记住创建时的词法环境**
2. **内部函数可以访问外部函数的变量**
3. **这些变量在外部函数执行完后仍然存在**

### 闭包的优点

- 实现数据封装和私有变量
- 保持函数状态
- 创建工厂函数和高阶函数
- 实现模块化设计

### 闭包的注意事项

- 注意内存管理，避免不必要的内存占用
- 小心循环中的闭包陷阱
- 注意 `this` 绑定问题
- 合理使用，不要过度复杂化代码

掌握闭包，就掌握了 JavaScript 函数式编程的核心，这将帮助你写出更优雅、更健壮的代码。
