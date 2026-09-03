---
title: Proxy与Reflect
description: JavaScript Proxy与Reflect完全指南，元编程与对象拦截
track: javascript
section: core
difficulty: advanced
tags:
  - JavaScript
  - Proxy
  - Reflect
  - 元编程
status: imported
origin: old/src/content/docs/javascript/proxy-reflect.zh.md
divergence: 0.331
issues: []
legacy:
  category: JavaScript
  subcategory: 高级特性
  order: 18
  lastUpdated: 2026-01-07
---

Proxy和Reflect是ES6引入的两个强大特性，它们为JavaScript带来了真正的元编程能力。通过Proxy，我们可以拦截和自定义对象的基本操作；而Reflect则提供了一套与Proxy陷阱一一对应的方法，使得元编程更加优雅和规范。

## 什么是元编程

元编程（Metaprogramming）是指编写能够操作程序本身的程序。在JavaScript中，这意味着我们可以：

- 拦截并修改对象的基本操作（读取、写入、删除属性等）
- 自定义对象的行为
- 创建具有特殊能力的"魔法"对象

```javascript
// 元编程示例：创建一个"不可能"的对象
const impossible = new Proxy({}, {
  get(target, prop) {
    return `你试图访问 ${prop}，但这个属性并不存在于目标对象中`;
  }
});

console.log(impossible.anyProperty);
// 输出: 你试图访问 anyProperty，但这个属性并不存在于目标对象中
console.log(impossible.whatever);
// 输出: 你试图访问 whatever，但这个属性并不存在于目标对象中
```

## Proxy基础

### 创建Proxy

Proxy构造函数接收两个参数：

```javascript
const proxy = new Proxy(target, handler);
```

- **target**：要代理的目标对象（可以是任何类型的对象，包括数组、函数，甚至另一个Proxy）
- **handler**：定义拦截行为的对象，包含各种"陷阱"（trap）方法

```javascript
// 基础示例
const target = {
  name: '张三',
  age: 25
};

const handler = {
  get(target, property, receiver) {
    console.log(`正在读取属性: ${property}`);
    return target[property];
  },
  set(target, property, value, receiver) {
    console.log(`正在设置属性: ${property} = ${value}`);
    target[property] = value;
    return true;
  }
};

const proxy = new Proxy(target, handler);

proxy.name;        // 输出: 正在读取属性: name
proxy.age = 26;    // 输出: 正在设置属性: age = 26
```

### 空Handler

如果handler是空对象，Proxy将透明地转发所有操作到目标对象：

```javascript
const target = { x: 10, y: 20 };
const proxy = new Proxy(target, {});

console.log(proxy.x);  // 10
proxy.z = 30;
console.log(target.z); // 30 - 操作直接影响目标对象
```

## Proxy陷阱（Traps）详解

Proxy支持13种陷阱，每种陷阱对应一种基本操作：

### get - 属性读取拦截

```javascript
const handler = {
  /**
   * @param target - 目标对象
   * @param property - 被访问的属性名（字符串或Symbol）
   * @param receiver - Proxy实例本身或继承自Proxy的对象
   */
  get(target, property, receiver) {
    if (property in target) {
      return target[property];
    }
    throw new ReferenceError(`属性 "${property}" 不存在`);
  }
};

const obj = new Proxy({ a: 1, b: 2 }, handler);
console.log(obj.a);  // 1
console.log(obj.c);  // ReferenceError: 属性 "c" 不存在
```

### set - 属性写入拦截

```javascript
const handler = {
  /**
   * @param target - 目标对象
   * @param property - 被设置的属性名
   * @param value - 新值
   * @param receiver - Proxy实例
   * @returns {boolean} - 必须返回布尔值，表示设置是否成功
   */
  set(target, property, value, receiver) {
    if (property === 'age' && typeof value !== 'number') {
      throw new TypeError('age必须是数字');
    }
    if (property === 'age' && (value < 0 || value > 150)) {
      throw new RangeError('age必须在0-150之间');
    }
    target[property] = value;
    return true;
  }
};

const person = new Proxy({}, handler);
person.age = 25;      // 成功
person.age = -5;      // RangeError: age必须在0-150之间
person.age = '二十';  // TypeError: age必须是数字
```

### has - in操作符拦截

```javascript
const handler = {
  /**
   * 拦截 `property in proxy` 操作
   */
  has(target, property) {
    // 隐藏以下划线开头的私有属性
    if (property.startsWith('_')) {
      return false;
    }
    return property in target;
  }
};

const obj = new Proxy({ _secret: '机密', public: '公开' }, handler);
console.log('_secret' in obj);  // false
console.log('public' in obj);   // true
```

### deleteProperty - delete操作拦截

```javascript
const handler = {
  deleteProperty(target, property) {
    if (property.startsWith('_')) {
      throw new Error(`不能删除私有属性 ${property}`);
    }
    delete target[property];
    return true;
  }
};

const obj = new Proxy({ _id: 1, name: '测试' }, handler);
delete obj.name;    // 成功
delete obj._id;     // Error: 不能删除私有属性 _id
```

### ownKeys - 属性枚举拦截

```javascript
const handler = {
  /**
   * 拦截以下操作：
   * - Object.keys()
   * - Object.getOwnPropertyNames()
   * - Object.getOwnPropertySymbols()
   * - for...in循环
   */
  ownKeys(target) {
    // 过滤掉以下划线开头的属性
    return Object.keys(target).filter(key => !key.startsWith('_'));
  }
};

const obj = new Proxy(
  { _private: 1, public: 2, _hidden: 3, visible: 4 },
  handler
);

console.log(Object.keys(obj));  // ['public', 'visible']
```

### getOwnPropertyDescriptor - 属性描述符拦截

```javascript
const handler = {
  getOwnPropertyDescriptor(target, property) {
    // 对所有属性返回可枚举
    const descriptor = Object.getOwnPropertyDescriptor(target, property);
    if (descriptor) {
      descriptor.enumerable = true;
    }
    return descriptor;
  }
};
```

### defineProperty - 属性定义拦截

```javascript
const handler = {
  defineProperty(target, property, descriptor) {
    // 阻止定义不可配置的属性
    if (descriptor.configurable === false) {
      throw new Error('不允许定义不可配置的属性');
    }
    return Object.defineProperty(target, property, descriptor);
  }
};
```

### preventExtensions - 阻止扩展拦截

```javascript
const handler = {
  preventExtensions(target) {
    console.log('有人试图阻止对象扩展');
    return Object.preventExtensions(target);
  }
};
```

### getPrototypeOf - 原型读取拦截

```javascript
const handler = {
  /**
   * 拦截以下操作：
   * - Object.getPrototypeOf()
   * - Reflect.getPrototypeOf()
   * - __proto__
   * - instanceof
   */
  getPrototypeOf(target) {
    return Object.getPrototypeOf(target);
  }
};
```

### setPrototypeOf - 原型设置拦截

```javascript
const handler = {
  setPrototypeOf(target, prototype) {
    throw new Error('禁止修改原型');
  }
};

const obj = new Proxy({}, handler);
Object.setPrototypeOf(obj, {});  // Error: 禁止修改原型
```

### isExtensible - 可扩展性检查拦截

```javascript
const handler = {
  isExtensible(target) {
    console.log('正在检查可扩展性');
    return Object.isExtensible(target);
  }
};
```

### apply - 函数调用拦截

```javascript
const handler = {
  /**
   * @param target - 目标函数
   * @param thisArg - 调用时的this
   * @param argumentsList - 参数数组
   */
  apply(target, thisArg, argumentsList) {
    console.log(`调用函数，参数: ${argumentsList}`);
    return target.apply(thisArg, argumentsList);
  }
};

function sum(a, b) {
  return a + b;
}

const proxySum = new Proxy(sum, handler);
console.log(proxySum(1, 2));
// 输出: 调用函数，参数: 1,2
// 输出: 3
```

### construct - new操作符拦截

```javascript
const handler = {
  /**
   * @param target - 目标构造函数
   * @param argumentsList - 参数数组
   * @param newTarget - 最初被调用的构造函数
   */
  construct(target, argumentsList, newTarget) {
    console.log(`创建新实例，参数: ${argumentsList}`);
    return new target(...argumentsList);
  }
};

class Person {
  constructor(name) {
    this.name = name;
  }
}

const ProxyPerson = new Proxy(Person, handler);
const p = new ProxyPerson('李四');
// 输出: 创建新实例，参数: 李四
```

## Reflect API

Reflect是一个内置对象，提供了与Proxy陷阱一一对应的静态方法。它的设计目的是：

1. 将Object对象上的一些明显属于语言内部的方法放到Reflect上
2. 让某些操作的返回值更合理
3. 让操作变成函数式的调用方式
4. 与Proxy陷阱配合使用

### Reflect方法一览

```javascript
// 与Proxy陷阱对应的13个方法
Reflect.get(target, property, receiver)
Reflect.set(target, property, value, receiver)
Reflect.has(target, property)
Reflect.deleteProperty(target, property)
Reflect.ownKeys(target)
Reflect.getOwnPropertyDescriptor(target, property)
Reflect.defineProperty(target, property, descriptor)
Reflect.preventExtensions(target)
Reflect.getPrototypeOf(target)
Reflect.setPrototypeOf(target, prototype)
Reflect.isExtensible(target)
Reflect.apply(target, thisArg, argumentsList)
Reflect.construct(target, argumentsList, newTarget)
```

### 使用Reflect的优势

#### 返回值更合理

```javascript
// 旧方式 - Object.defineProperty在失败时抛出异常
try {
  Object.defineProperty(obj, 'prop', { value: 1 });
  // 成功
} catch (e) {
  // 失败
}

// 新方式 - Reflect.defineProperty返回布尔值
if (Reflect.defineProperty(obj, 'prop', { value: 1 })) {
  // 成功
} else {
  // 失败
}
```

#### 函数式操作

```javascript
// 旧方式
'prop' in obj
delete obj.prop

// 新方式 - 函数式调用
Reflect.has(obj, 'prop')
Reflect.deleteProperty(obj, 'prop')
```

#### 与Proxy完美配合

```javascript
const handler = {
  get(target, property, receiver) {
    console.log(`GET: ${property}`);
    // 使用Reflect确保正确的默认行为
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    console.log(`SET: ${property} = ${value}`);
    // Reflect.set返回布尔值，正好满足set陷阱的返回值要求
    return Reflect.set(target, property, value, receiver);
  }
};
```

### receiver参数的重要性

receiver参数确保了正确的this绑定，这在处理getter/setter和继承时尤为重要：

```javascript
const parent = {
  _name: '父对象',
  get name() {
    return this._name;
  }
};

const handler = {
  get(target, property, receiver) {
    // 使用receiver确保getter中的this指向正确
    return Reflect.get(target, property, receiver);
  }
};

const parentProxy = new Proxy(parent, handler);

const child = {
  __proto__: parentProxy,
  _name: '子对象'
};

console.log(child.name);  // '子对象' - 正确！
// 如果不使用receiver，将返回'父对象'
```

## 可撤销代理（Revocable Proxy）

`Proxy.revocable()`创建一个可撤销的Proxy，一旦撤销，该Proxy将无法再使用：

```javascript
const { proxy, revoke } = Proxy.revocable(
  { name: '可撤销的代理' },
  {
    get(target, property) {
      return target[property];
    }
  }
);

console.log(proxy.name);  // '可撤销的代理'

// 撤销代理
revoke();

// 尝试访问已撤销的代理会抛出TypeError
try {
  console.log(proxy.name);
} catch (e) {
  console.log(e);  // TypeError: Cannot perform 'get' on a proxy that has been revoked
}
```

### 可撤销代理的应用场景

```javascript
// 创建临时访问权限
function createTemporaryAccess(data, duration) {
  const { proxy, revoke } = Proxy.revocable(data, {
    get(target, prop) {
      return target[prop];
    },
    set() {
      throw new Error('只读访问');
    }
  });

  // 在指定时间后自动撤销
  setTimeout(revoke, duration);

  return proxy;
}

const sensitiveData = { password: '123456', token: 'abc' };
const tempAccess = createTemporaryAccess(sensitiveData, 5000);

console.log(tempAccess.password);  // '123456'

// 5秒后访问将失败
setTimeout(() => {
  try {
    console.log(tempAccess.password);
  } catch (e) {
    console.log('访问已过期');
  }
}, 6000);
```

## 实战应用案例

### 案例1：数据验证

```javascript
function createValidator(target, validationRules) {
  return new Proxy(target, {
    set(target, property, value, receiver) {
      const rule = validationRules[property];

      if (rule) {
        // 类型检查
        if (rule.type && typeof value !== rule.type) {
          throw new TypeError(
            `${property}必须是${rule.type}类型，收到${typeof value}`
          );
        }

        // 范围检查
        if (rule.min !== undefined && value < rule.min) {
          throw new RangeError(`${property}不能小于${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          throw new RangeError(`${property}不能大于${rule.max}`);
        }

        // 自定义验证
        if (rule.validator && !rule.validator(value)) {
          throw new Error(rule.message || `${property}验证失败`);
        }
      }

      return Reflect.set(target, property, value, receiver);
    }
  });
}

// 使用示例
const user = createValidator({}, {
  name: {
    type: 'string',
    validator: v => v.length >= 2 && v.length <= 20,
    message: '名称长度必须在2-20个字符之间'
  },
  age: {
    type: 'number',
    min: 0,
    max: 150
  },
  email: {
    type: 'string',
    validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: '邮箱格式不正确'
  }
});

user.name = '张三';        // 成功
user.age = 25;             // 成功
user.email = 'test@example.com';  // 成功

// user.age = -5;          // RangeError: age不能小于0
// user.email = 'invalid'; // Error: 邮箱格式不正确
```

### 案例2：日志记录与调试

```javascript
function createLogger(target, name = 'Object') {
  return new Proxy(target, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      console.log(`[GET] ${name}.${String(property)} => ${JSON.stringify(value)}`);
      return value;
    },

    set(target, property, value, receiver) {
      console.log(`[SET] ${name}.${String(property)} = ${JSON.stringify(value)}`);
      return Reflect.set(target, property, value, receiver);
    },

    deleteProperty(target, property) {
      console.log(`[DELETE] ${name}.${String(property)}`);
      return Reflect.deleteProperty(target, property);
    },

    apply(target, thisArg, args) {
      console.log(`[CALL] ${name}(${args.map(a => JSON.stringify(a)).join(', ')})`);
      const result = Reflect.apply(target, thisArg, args);
      console.log(`[RETURN] ${JSON.stringify(result)}`);
      return result;
    }
  });
}

// 使用示例
const obj = createLogger({ x: 1, y: 2 }, 'myObj');
obj.x;        // [GET] myObj.x => 1
obj.z = 3;    // [SET] myObj.z = 3
delete obj.y; // [DELETE] myObj.y

const fn = createLogger(function add(a, b) { return a + b; }, 'add');
fn(1, 2);
// [CALL] add(1, 2)
// [RETURN] 3
```

### 案例3：虚拟属性与计算属性

```javascript
function createWithVirtualProps(target, virtualProps) {
  return new Proxy(target, {
    get(target, property, receiver) {
      // 检查是否是虚拟属性
      if (property in virtualProps) {
        const virtual = virtualProps[property];
        if (typeof virtual === 'function') {
          return virtual.call(receiver);
        }
        return virtual;
      }
      return Reflect.get(target, property, receiver);
    },

    has(target, property) {
      return property in virtualProps || Reflect.has(target, property);
    },

    ownKeys(target) {
      return [...Reflect.ownKeys(target), ...Object.keys(virtualProps)];
    },

    getOwnPropertyDescriptor(target, property) {
      if (property in virtualProps) {
        return {
          enumerable: true,
          configurable: true,
          value: this.get(target, property, target)
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    }
  });
}

// 使用示例
const person = createWithVirtualProps(
  { firstName: '三', lastName: '张', birthYear: 1990 },
  {
    fullName() {
      return this.lastName + this.firstName;
    },
    age() {
      return new Date().getFullYear() - this.birthYear;
    },
    greeting() {
      return `你好，我是${this.fullName}，今年${this.age}岁`;
    }
  }
);

console.log(person.fullName);   // '张三'
console.log(person.age);        // 36 (假设当前是2026年)
console.log(person.greeting);   // '你好，我是张三，今年36岁'
console.log(Object.keys(person)); // ['firstName', 'lastName', 'birthYear', 'fullName', 'age', 'greeting']
```

### 案例4：私有属性保护

```javascript
function createPrivate(target, privateProps = []) {
  const privateSet = new Set(
    privateProps.length ? privateProps :
    Object.keys(target).filter(k => k.startsWith('_'))
  );

  return new Proxy(target, {
    get(target, property, receiver) {
      if (privateSet.has(property)) {
        throw new Error(`无法访问私有属性 ${String(property)}`);
      }
      return Reflect.get(target, property, receiver);
    },

    set(target, property, value, receiver) {
      if (privateSet.has(property)) {
        throw new Error(`无法修改私有属性 ${String(property)}`);
      }
      return Reflect.set(target, property, value, receiver);
    },

    deleteProperty(target, property) {
      if (privateSet.has(property)) {
        throw new Error(`无法删除私有属性 ${String(property)}`);
      }
      return Reflect.deleteProperty(target, property);
    },

    has(target, property) {
      if (privateSet.has(property)) {
        return false;
      }
      return Reflect.has(target, property);
    },

    ownKeys(target) {
      return Reflect.ownKeys(target).filter(k => !privateSet.has(k));
    }
  });
}

// 使用示例
const account = createPrivate({
  _balance: 10000,
  _password: '123456',
  owner: '张三',
  accountNumber: 'CN1234567890'
});

console.log(account.owner);           // '张三'
console.log(account._balance);        // Error: 无法访问私有属性 _balance
console.log('_password' in account);  // false
console.log(Object.keys(account));    // ['owner', 'accountNumber']
```

### 案例5：观察者模式

```javascript
function createObservable(target) {
  const listeners = new Map();

  const proxy = new Proxy(target, {
    set(target, property, value, receiver) {
      const oldValue = target[property];
      const result = Reflect.set(target, property, value, receiver);

      if (result && oldValue !== value) {
        // 触发属性特定的监听器
        if (listeners.has(property)) {
          listeners.get(property).forEach(callback => {
            callback(value, oldValue, property);
          });
        }

        // 触发通配符监听器
        if (listeners.has('*')) {
          listeners.get('*').forEach(callback => {
            callback(value, oldValue, property);
          });
        }
      }

      return result;
    }
  });

  // 添加观察方法
  proxy.$watch = function(prop, callback) {
    if (!listeners.has(prop)) {
      listeners.set(prop, new Set());
    }
    listeners.get(prop).add(callback);

    // 返回取消观察的函数
    return () => {
      listeners.get(prop).delete(callback);
    };
  };

  return proxy;
}

// 使用示例
const state = createObservable({
  count: 0,
  message: 'Hello'
});

// 观察特定属性
const unwatch = state.$watch('count', (newVal, oldVal) => {
  console.log(`count变化: ${oldVal} => ${newVal}`);
});

// 观察所有变化
state.$watch('*', (newVal, oldVal, prop) => {
  console.log(`属性 ${prop} 发生变化`);
});

state.count = 1;    // count变化: 0 => 1 / 属性 count 发生变化
state.count = 2;    // count变化: 1 => 2 / 属性 count 发生变化
state.message = 'World';  // 属性 message 发生变化

unwatch();  // 取消count的观察
state.count = 3;    // 只输出: 属性 count 发生变化
```

### 案例6：负索引数组

```javascript
function createNegativeArray(array) {
  return new Proxy(array, {
    get(target, property, receiver) {
      let index = Number(property);

      // 处理负索引
      if (Number.isInteger(index) && index < 0) {
        index = target.length + index;
      }

      return Reflect.get(target, index >= 0 ? index : property, receiver);
    },

    set(target, property, value, receiver) {
      let index = Number(property);

      if (Number.isInteger(index) && index < 0) {
        index = target.length + index;
        if (index < 0) {
          throw new RangeError('负索引越界');
        }
      }

      return Reflect.set(target, index >= 0 ? index : property, value, receiver);
    }
  });
}

// 使用示例
const arr = createNegativeArray([1, 2, 3, 4, 5]);

console.log(arr[-1]);   // 5 (最后一个元素)
console.log(arr[-2]);   // 4 (倒数第二个)
console.log(arr[-5]);   // 1 (第一个元素)

arr[-1] = 100;
console.log(arr);       // [1, 2, 3, 4, 100]
```

### 案例7：不可变对象

```javascript
function createImmutable(target) {
  // 递归处理嵌套对象
  const handler = {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);

      // 如果值是对象，返回其不可变版本
      if (value !== null && typeof value === 'object') {
        return createImmutable(value);
      }

      return value;
    },

    set() {
      throw new TypeError('无法修改不可变对象');
    },

    deleteProperty() {
      throw new TypeError('无法从不可变对象中删除属性');
    },

    defineProperty() {
      throw new TypeError('无法在不可变对象上定义属性');
    },

    setPrototypeOf() {
      throw new TypeError('无法修改不可变对象的原型');
    }
  };

  return new Proxy(target, handler);
}

// 使用示例
const config = createImmutable({
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000
  },
  features: ['auth', 'logging']
});

console.log(config.api.baseUrl);  // 'https://api.example.com'

// config.api.timeout = 10000;    // TypeError: 无法修改不可变对象
// config.newProp = 'value';      // TypeError: 无法修改不可变对象
// delete config.api;             // TypeError: 无法从不可变对象中删除属性
```

### 案例8：缓存与惰性求值

```javascript
function createLazy(computeFns) {
  const cache = new Map();

  return new Proxy({}, {
    get(target, property) {
      // 如果已缓存，直接返回
      if (cache.has(property)) {
        console.log(`[Cache Hit] ${property}`);
        return cache.get(property);
      }

      // 如果有对应的计算函数
      if (property in computeFns) {
        console.log(`[Computing] ${property}`);
        const value = computeFns[property]();
        cache.set(property, value);
        return value;
      }

      return undefined;
    },

    has(target, property) {
      return property in computeFns;
    },

    ownKeys() {
      return Object.keys(computeFns);
    }
  });
}

// 使用示例 - 惰性加载配置
const config = createLazy({
  databaseConnection() {
    // 模拟耗时操作
    console.log('正在建立数据库连接...');
    return { host: 'localhost', port: 5432 };
  },
  heavyComputation() {
    console.log('正在进行复杂计算...');
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.random();
    }
    return result;
  }
});

// 第一次访问 - 计算
console.log(config.databaseConnection);
// [Computing] databaseConnection
// 正在建立数据库连接...
// { host: 'localhost', port: 5432 }

// 第二次访问 - 使用缓存
console.log(config.databaseConnection);
// [Cache Hit] databaseConnection
// { host: 'localhost', port: 5432 }
```

## Proxy的限制与注意事项

### 不可代理的内置对象

某些内置对象具有内部槽（internal slots），Proxy无法正确代理：

```javascript
// Date对象
const dateProxy = new Proxy(new Date(), {});
// dateProxy.getTime();  // TypeError

// 解决方案：绑定方法
const date = new Date();
const dateProxy2 = new Proxy(date, {
  get(target, property) {
    const value = Reflect.get(target, property);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});
console.log(dateProxy2.getTime());  // 正常工作
```

### Map和Set的处理

```javascript
const map = new Map();
const mapProxy = new Proxy(map, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value === 'function') {
      return value.bind(target);  // 绑定原始对象
    }
    return value;
  }
});

mapProxy.set('key', 'value');  // 正常工作
console.log(mapProxy.get('key'));  // 'value'
```

### 严格模式下的要求

在严格模式下，Proxy陷阱必须遵守一些不变量（invariants）：

```javascript
const obj = {};
Object.defineProperty(obj, 'x', {
  value: 10,
  writable: false,
  configurable: false
});

const proxy = new Proxy(obj, {
  get(target, property) {
    return 20;  // 试图返回不同的值
  }
});

// console.log(proxy.x);  // TypeError: 违反不变量
```

### 性能考量

```javascript
// Proxy会带来一定的性能开销
// 对于性能敏感的代码，需要权衡使用

// 不推荐：在热路径中使用Proxy
function hotPath(proxy) {
  for (let i = 0; i < 1000000; i++) {
    proxy.value;  // 每次访问都会触发get陷阱
  }
}

// 推荐：预先获取值或使用直接访问
function optimizedPath(proxy) {
  const value = proxy.value;  // 只触发一次
  for (let i = 0; i < 1000000; i++) {
    // 使用局部变量
    value;
  }
}
```

### this绑定问题

```javascript
const target = {
  name: '目标对象',
  getName() {
    return this.name;
  }
};

const proxy = new Proxy(target, {});

console.log(target.getName());  // '目标对象'
console.log(proxy.getName());   // '目标对象' - this指向proxy

// 当proxy没有name属性时，需要注意this的指向
```

## Proxy与其他模式的对比

### Proxy vs Object.defineProperty

```javascript
// Object.defineProperty - Vue 2的响应式原理
const data = { count: 0 };

Object.defineProperty(data, 'count', {
  get() {
    console.log('读取count');
    return this._count;
  },
  set(value) {
    console.log('设置count');
    this._count = value;
  }
});

// 局限性：
// 1. 只能监听已存在的属性
// 2. 无法监听数组索引变化
// 3. 需要遍历对象的每个属性

// Proxy - Vue 3的响应式原理
const dataProxy = new Proxy({ count: 0 }, {
  get(target, property) {
    console.log(`读取${property}`);
    return target[property];
  },
  set(target, property, value) {
    console.log(`设置${property}`);
    target[property] = value;
    return true;
  }
});

// 优势：
// 1. 可以监听任意属性（包括新添加的）
// 2. 可以监听数组变化
// 3. 一次代理整个对象
```

### Proxy vs Decorator模式

```javascript
// 传统装饰器模式
class Logger {
  constructor(obj) {
    this.obj = obj;
  }

  get(prop) {
    console.log(`Getting ${prop}`);
    return this.obj[prop];
  }
}

// Proxy实现的装饰器
function createLoggerProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      console.log(`Getting ${prop}`);
      return target[prop];
    }
  });
}

// Proxy的优势：语法更自然，可以像普通对象一样使用
const logger = createLoggerProxy({ x: 1 });
console.log(logger.x);  // 直接使用属性访问语法
```

## 调试技巧

### 检测对象是否为Proxy

```javascript
// 方法1：使用Symbol
const isProxySymbol = Symbol('isProxy');

function createDetectableProxy(target) {
  return new Proxy(target, {
    get(target, property) {
      if (property === isProxySymbol) {
        return true;
      }
      return Reflect.get(target, property);
    }
  });
}

const proxy = createDetectableProxy({});
console.log(proxy[isProxySymbol]);  // true

// 方法2：Node.js环境使用util.types.isProxy
const util = require('util');
console.log(util.types.isProxy(proxy));  // true (Node.js)
```

### 创建调试友好的Proxy

```javascript
function createDebugProxy(target, name = 'Proxy') {
  return new Proxy(target, {
    get(target, property, receiver) {
      if (property === Symbol.toStringTag) {
        return name;
      }
      if (property === 'toString') {
        return () => `[${name}]`;
      }
      return Reflect.get(target, property, receiver);
    }
  });
}

const debugProxy = createDebugProxy({ x: 1 }, 'MyDebugProxy');
console.log(Object.prototype.toString.call(debugProxy));  // [object MyDebugProxy]
console.log(debugProxy.toString());  // [MyDebugProxy]
```

## 最佳实践

### 始终使用Reflect

```javascript
// 推荐
const handler = {
  get(target, property, receiver) {
    return Reflect.get(target, property, receiver);
  },
  set(target, property, value, receiver) {
    return Reflect.set(target, property, value, receiver);
  }
};

// 不推荐
const badHandler = {
  get(target, property) {
    return target[property];  // 丢失了receiver
  },
  set(target, property, value) {
    target[property] = value;  // 没有返回值
  }
};
```

### 正确处理receiver

```javascript
// 确保继承链正确工作
const handler = {
  get(target, property, receiver) {
    // receiver确保getter中的this指向正确
    return Reflect.get(target, property, receiver);
  }
};
```

### 遵守不变量

```javascript
// 确保代理行为与目标对象一致
const handler = {
  getOwnPropertyDescriptor(target, property) {
    const descriptor = Reflect.getOwnPropertyDescriptor(target, property);
    // 必须返回对象或undefined
    // 对于不可配置的属性，必须返回正确的描述符
    return descriptor;
  }
};
```

### 考虑性能影响

```javascript
// 对于频繁访问的属性，考虑缓存
const handler = {
  get(target, property, receiver) {
    // 避免在每次访问时进行复杂计算
    if (!target._cache) {
      target._cache = {};
    }
    if (!(property in target._cache)) {
      target._cache[property] = Reflect.get(target, property, receiver);
    }
    return target._cache[property];
  }
};
```

## 总结

Proxy和Reflect是JavaScript元编程的核心工具：

1. **Proxy**提供了拦截和自定义对象操作的能力，支持13种不同的陷阱
2. **Reflect**提供了与Proxy陷阱对应的方法，使操作更加规范和函数式
3. **可撤销代理**允许创建可以随时禁用的代理对象
4. **实际应用**包括数据验证、日志记录、虚拟属性、私有属性保护、观察者模式等
5. **注意事项**包括性能开销、内置对象的特殊处理、严格模式下的不变量等

掌握Proxy和Reflect，能够让你编写出更加灵活、强大的JavaScript代码，实现许多以前难以实现的功能。

## 参考资料

- [MDN - Proxy](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [MDN - Reflect](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect)
- [ECMAScript规范 - Proxy Objects](https://tc39.es/ecma262/#sec-proxy-objects)
