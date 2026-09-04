---
title: Design Patterns
description: Complete guide to JavaScript design patterns, creational, structural and behavioral patterns
track: javascript
section: patterns-tooling
difficulty: advanced
tags:
  - JavaScript
  - Design Patterns
  - OOP
  - Architecture
status: imported
origin: old/src/content/docs/javascript/design-patterns.zh.md
divergence: 0.243
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Design Patterns
  order: 17
  lastUpdated: 2026-01-07
---

设计模式是软件设计中常见问题的可重用解决方案。它们代表了经过时间验证的最佳实践，并为开发者提供了一套共享的词汇表，以便高效地交流复杂的架构概念。在 JavaScript 中，设计模式有助于创建可维护、可扩展且健壮的应用程序，同时充分利用该语言的独特特性，如一等函数、原型继承和闭包。

   - [单例模式](#单例模式)
   - [工厂模式](#工厂模式)
   - [模块模式](#模块模式)
2. [结构型模式](#结构型模式)
   - [装饰器模式](#装饰器模式)
   - [代理模式](#代理模式)
3. [行为型模式](#行为型模式)
   - [观察者模式](#观察者模式)
   - [策略模式](#策略模式)
4. [模式组合](#模式组合)
5. [最佳实践](#最佳实践)

---

## 创建型模式

创建型模式处理对象创建机制，在为客户端代码隐藏创建逻辑的同时，提供了灵活的对象创建方式。

### 单例模式

单例模式确保一个类只有一个实例，并提供一个全局访问点。这对于管理共享资源（如配置对象、数据库连接、日志服务或应用状态）特别有用。

#### 基于类的单例

```javascript
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }

    this.host = 'localhost';
    this.port = 5432;
    this.connected = false;
    this.connectionPool = [];

    DatabaseConnection.instance = this;
  }

  connect() {
    if (this.connected) {
      console.log('Already connected to database');
      return this;
    }

    console.log(`Connecting to ${this.host}:${this.port}...`);
    this.connected = true;
    return this;
  }

  disconnect() {
    if (!this.connected) {
      console.log('Not connected');
      return this;
    }

    console.log('Disconnecting from database...');
    this.connected = false;
    return this;
  }

  query(sql) {
    if (!this.connected) {
      throw new Error('Must connect before querying');
    }
    console.log(`Executing: ${sql}`);
    return { rows: [], rowCount: 0 };
  }
}

// 使用示例
const db1 = new DatabaseConnection();
const db2 = new DatabaseConnection();

console.log(db1 === db2); // true - 相同实例

db1.connect();
db2.query('SELECT * FROM users'); // 正常工作，因为 db1 和 db2 是同一个实例
```

#### 模块模式单例（IIFE）

使用立即调用函数表达式（IIFE）可以为内部状态提供真正的私有性：

```javascript
const Logger = (function() {
  let instance;

  function createInstance() {
    const logs = [];
    const maxLogs = 1000;

    return {
      log(message, level = 'info') {
        const entry = {
          timestamp: new Date().toISOString(),
          level,
          message
        };

        logs.push(entry);

        // 防止内存泄漏
        if (logs.length > maxLogs) {
          logs.shift();
        }

        console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
      },

      info(message) {
        this.log(message, 'info');
      },

      warn(message) {
        this.log(message, 'warn');
      },

      error(message) {
        this.log(message, 'error');
      },

      debug(message) {
        this.log(message, 'debug');
      },

      getLogs(level = null) {
        if (level) {
          return logs.filter(log => log.level === level);
        }
        return [...logs];
      },

      clear() {
        logs.length = 0;
      }
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

// 使用示例
const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();

console.log(logger1 === logger2); // true

logger1.info('Application started');
logger1.warn('Low memory warning');
logger2.error('Connection failed'); // 与 logger1 是同一个实例

console.log(logger1.getLogs('error'));
// [{ timestamp: '...', level: 'error', message: 'Connection failed' }]
```

#### ES6 模块单例

在 ES6 模块中，模块本身就充当单例，因为模块会被缓存：

```javascript
// configManager.js
class ConfigManager {
  constructor() {
    this.config = {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retryAttempts: 3,
      debug: false
    };
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
  }

  getAll() {
    return { ...this.config };
  }

  load(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// 导出单一实例
export default new ConfigManager();

// 在其他文件中使用：
// import config from './configManager.js';
// config.get('apiUrl'); // 'https://api.example.com'
```

#### 实际示例：应用状态管理器

```javascript
class StateManager {
  constructor() {
    if (StateManager.instance) {
      return StateManager.instance;
    }

    this.state = {};
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = 50;

    StateManager.instance = this;
  }

  getState(path = null) {
    if (!path) {
      return { ...this.state };
    }

    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  setState(path, value) {
    const previousState = JSON.parse(JSON.stringify(this.state));

    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);

    target[lastKey] = value;

    // 保存到历史记录
    this.history.push(previousState);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // 通知监听器
    this.notify(path, value);
  }

  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, []);
    }
    this.listeners.get(path).push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(path);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  notify(path, value) {
    // 通知精确路径的监听器
    if (this.listeners.has(path)) {
      this.listeners.get(path).forEach(cb => cb(value, path));
    }

    // 通知父路径的监听器
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      if (this.listeners.has(parentPath)) {
        this.listeners.get(parentPath).forEach(cb => {
          cb(this.getState(parentPath), parentPath);
        });
      }
    }
  }

  undo() {
    if (this.history.length === 0) {
      console.log('No history to undo');
      return;
    }

    this.state = this.history.pop();
    console.log('State reverted');
  }
}

// 使用示例
const state = new StateManager();

// 订阅变更
const unsubscribe = state.subscribe('user.profile', (value, path) => {
  console.log(`${path} changed:`, value);
});

state.setState('user.profile.name', 'John Doe');
// 输出: user.profile changed: { name: 'John Doe' }

state.setState('user.profile.email', 'john@example.com');
// 输出: user.profile changed: { name: 'John Doe', email: 'john@example.com' }

console.log(state.getState('user.profile.name')); // 'John Doe'

state.undo();
console.log(state.getState('user.profile')); // { name: 'John Doe' }

unsubscribe(); // 停止监听变更
```

#### 何时使用单例模式

- 数据库连接池
- 应用配置管理器
- 日志服务
- 缓存管理器
- 用户会话管理
- 应用状态（需谨慎使用）

#### 注意事项

- 由于全局状态的存在，可能会使单元测试变得困难
- 可能隐藏依赖关系，使代码更难理解
- 考虑使用依赖注入作为替代方案

---

### 工厂模式

工厂模式提供了一个创建对象的接口，而无需指定其确切的类。它封装了对象创建逻辑，使代码更加灵活、可测试且易于维护。

#### 简单工厂

```javascript
class Car {
  constructor(options) {
    this.type = 'car';
    this.doors = options.doors || 4;
    this.color = options.color || 'white';
    this.engine = options.engine || 'gasoline';
  }

  describe() {
    return `${this.color} ${this.type} with ${this.doors} doors and ${this.engine} engine`;
  }
}

class Motorcycle {
  constructor(options) {
    this.type = 'motorcycle';
    this.wheels = 2;
    this.color = options.color || 'black';
    this.engineCC = options.engineCC || 600;
  }

  describe() {
    return `${this.color} ${this.type} with ${this.engineCC}cc engine`;
  }
}

class Truck {
  constructor(options) {
    this.type = 'truck';
    this.doors = options.doors || 2;
    this.color = options.color || 'red';
    this.payload = options.payload || 5000;
  }

  describe() {
    return `${this.color} ${this.type} with ${this.payload}kg payload capacity`;
  }
}

class VehicleFactory {
  createVehicle(type, options = {}) {
    switch (type.toLowerCase()) {
      case 'car':
        return new Car(options);
      case 'motorcycle':
        return new Motorcycle(options);
      case 'truck':
        return new Truck(options);
      default:
        throw new Error(`Unknown vehicle type: ${type}`);
    }
  }
}

// 使用示例
const factory = new VehicleFactory();

const sedan = factory.createVehicle('car', { doors: 4, color: 'blue' });
const sportBike = factory.createVehicle('motorcycle', { color: 'red', engineCC: 1000 });
const pickup = factory.createVehicle('truck', { payload: 3000 });

console.log(sedan.describe());
// blue car with 4 doors and gasoline engine

console.log(sportBike.describe());
// red motorcycle with 1000cc engine

console.log(pickup.describe());
// red truck with 3000kg payload capacity
```

#### 带注册功能的工厂

这种方法允许动态注册新类型：

```javascript
class ShapeFactory {
  constructor() {
    this.shapes = new Map();
  }

  register(type, shapeClass) {
    this.shapes.set(type, shapeClass);
    return this;
  }

  create(type, ...args) {
    const ShapeClass = this.shapes.get(type);

    if (!ShapeClass) {
      throw new Error(`Shape type '${type}' not registered`);
    }

    return new ShapeClass(...args);
  }

  getRegisteredTypes() {
    return Array.from(this.shapes.keys());
  }
}

// 图形类
class Circle {
  constructor(radius) {
    this.radius = radius;
  }

  area() {
    return Math.PI * this.radius ** 2;
  }

  perimeter() {
    return 2 * Math.PI * this.radius;
  }
}

class Rectangle {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }

  perimeter() {
    return 2 * (this.width + this.height);
  }
}

class Triangle {
  constructor(base, height, side1, side2, side3) {
    this.base = base;
    this.height = height;
    this.sides = [side1, side2, side3];
  }

  area() {
    return 0.5 * this.base * this.height;
  }

  perimeter() {
    return this.sides.reduce((sum, side) => sum + side, 0);
  }
}

// 使用示例
const factory = new ShapeFactory();

factory
  .register('circle', Circle)
  .register('rectangle', Rectangle)
  .register('triangle', Triangle);

const circle = factory.create('circle', 5);
const rectangle = factory.create('rectangle', 4, 6);
const triangle = factory.create('triangle', 3, 4, 3, 4, 5);

console.log('Circle area:', circle.area().toFixed(2)); // 78.54
console.log('Rectangle area:', rectangle.area()); // 24
console.log('Triangle perimeter:', triangle.perimeter()); // 12

// 扩展新图形
class Hexagon {
  constructor(side) {
    this.side = side;
  }

  area() {
    return (3 * Math.sqrt(3) / 2) * this.side ** 2;
  }

  perimeter() {
    return 6 * this.side;
  }
}

factory.register('hexagon', Hexagon);
const hexagon = factory.create('hexagon', 5);
console.log('Hexagon area:', hexagon.area().toFixed(2)); // 64.95
```

#### 抽象工厂

抽象工厂模式提供了一个创建相关对象族的接口：

```javascript
// 抽象产品
class Button {
  render() {
    throw new Error('render() must be implemented');
  }

  onClick(handler) {
    throw new Error('onClick() must be implemented');
  }
}

class Input {
  render() {
    throw new Error('render() must be implemented');
  }

  getValue() {
    throw new Error('getValue() must be implemented');
  }
}

class Modal {
  render() {
    throw new Error('render() must be implemented');
  }

  open() {
    throw new Error('open() must be implemented');
  }

  close() {
    throw new Error('close() must be implemented');
  }
}

// 具体产品 - Material Design
class MaterialButton extends Button {
  constructor(text) {
    super();
    this.text = text;
  }

  render() {
    return `<button class="md-button md-ripple">${this.text}</button>`;
  }

  onClick(handler) {
    console.log(`Material button '${this.text}' clicked`);
    handler();
  }
}

class MaterialInput extends Input {
  constructor(placeholder) {
    super();
    this.placeholder = placeholder;
    this.value = '';
  }

  render() {
    return `<input class="md-input md-floating-label" placeholder="${this.placeholder}" />`;
  }

  getValue() {
    return this.value;
  }
}

class MaterialModal extends Modal {
  constructor(title) {
    super();
    this.title = title;
    this.isOpen = false;
  }

  render() {
    return `<div class="md-modal md-elevation-24"><h2>${this.title}</h2></div>`;
  }

  open() {
    this.isOpen = true;
    console.log(`Material modal '${this.title}' opened with slide animation`);
  }

  close() {
    this.isOpen = false;
    console.log(`Material modal '${this.title}' closed`);
  }
}

// 具体产品 - Bootstrap
class BootstrapButton extends Button {
  constructor(text) {
    super();
    this.text = text;
  }

  render() {
    return `<button class="btn btn-primary">${this.text}</button>`;
  }

  onClick(handler) {
    console.log(`Bootstrap button '${this.text}' clicked`);
    handler();
  }
}

class BootstrapInput extends Input {
  constructor(placeholder) {
    super();
    this.placeholder = placeholder;
    this.value = '';
  }

  render() {
    return `<input class="form-control" placeholder="${this.placeholder}" />`;
  }

  getValue() {
    return this.value;
  }
}

class BootstrapModal extends Modal {
  constructor(title) {
    super();
    this.title = title;
    this.isOpen = false;
  }

  render() {
    return `<div class="modal fade"><div class="modal-dialog"><h5 class="modal-title">${this.title}</h5></div></div>`;
  }

  open() {
    this.isOpen = true;
    console.log(`Bootstrap modal '${this.title}' opened with fade animation`);
  }

  close() {
    this.isOpen = false;
    console.log(`Bootstrap modal '${this.title}' closed`);
  }
}

// 抽象工厂
class UIFactory {
  createButton(text) {
    throw new Error('createButton() must be implemented');
  }

  createInput(placeholder) {
    throw new Error('createInput() must be implemented');
  }

  createModal(title) {
    throw new Error('createModal() must be implemented');
  }
}

// 具体工厂
class MaterialUIFactory extends UIFactory {
  createButton(text) {
    return new MaterialButton(text);
  }

  createInput(placeholder) {
    return new MaterialInput(placeholder);
  }

  createModal(title) {
    return new MaterialModal(title);
  }
}

class BootstrapUIFactory extends UIFactory {
  createButton(text) {
    return new BootstrapButton(text);
  }

  createInput(placeholder) {
    return new BootstrapInput(placeholder);
  }

  createModal(title) {
    return new BootstrapModal(title);
  }
}

// 客户端代码 - 可与任何工厂配合使用
function createLoginForm(factory) {
  const emailInput = factory.createInput('Enter your email');
  const passwordInput = factory.createInput('Enter your password');
  const submitButton = factory.createButton('Login');
  const modal = factory.createModal('Login Required');

  return {
    render() {
      return `
        ${modal.render()}
        <form>
          ${emailInput.render()}
          ${passwordInput.render()}
          ${submitButton.render()}
        </form>
      `;
    },
    showModal() {
      modal.open();
    }
  };
}

// 使用示例
const theme = 'material'; // 可以来自用户偏好设置

const factory = theme === 'material'
  ? new MaterialUIFactory()
  : new BootstrapUIFactory();

const loginForm = createLoginForm(factory);
console.log(loginForm.render());
loginForm.showModal();
```

#### 实际示例：API 响应解析器工厂

```javascript
class JSONParser {
  parse(data) {
    return JSON.parse(data);
  }

  stringify(data) {
    return JSON.stringify(data, null, 2);
  }

  getContentType() {
    return 'application/json';
  }
}

class XMLParser {
  parse(data) {
    // 简化的 XML 解析演示
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/xml');
    return this.xmlToObject(doc.documentElement);
  }

  xmlToObject(node) {
    const obj = {};

    for (const child of node.children) {
      if (child.children.length > 0) {
        obj[child.nodeName] = this.xmlToObject(child);
      } else {
        obj[child.nodeName] = child.textContent;
      }
    }

    return obj;
  }

  stringify(data) {
    return this.objectToXml(data, 'root');
  }

  objectToXml(obj, rootName) {
    let xml = `<${rootName}>`;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object') {
        xml += this.objectToXml(value, key);
      } else {
        xml += `<${key}>${value}</${key}>`;
      }
    }

    xml += `</${rootName}>`;
    return xml;
  }

  getContentType() {
    return 'application/xml';
  }
}

class CSVParser {
  constructor(delimiter = ',') {
    this.delimiter = delimiter;
  }

  parse(data) {
    const lines = data.trim().split('\n');
    const headers = lines[0].split(this.delimiter);

    return lines.slice(1).map(line => {
      const values = line.split(this.delimiter);
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim();
        return obj;
      }, {});
    });
  }

  stringify(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const headerLine = headers.join(this.delimiter);

    const dataLines = data.map(item =>
      headers.map(header => item[header]).join(this.delimiter)
    );

    return [headerLine, ...dataLines].join('\n');
  }

  getContentType() {
    return 'text/csv';
  }
}

class ParserFactory {
  static create(format) {
    switch (format.toLowerCase()) {
      case 'json':
        return new JSONParser();
      case 'xml':
        return new XMLParser();
      case 'csv':
        return new CSVParser();
      case 'tsv':
        return new CSVParser('\t');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  static getSupportedFormats() {
    return ['json', 'xml', 'csv', 'tsv'];
  }
}

// 使用示例
const jsonData = '{"name": "John", "age": 30}';
const csvData = 'name,age\nJohn,30\nJane,25';

const jsonParser = ParserFactory.create('json');
console.log(jsonParser.parse(jsonData));
// { name: 'John', age: 30 }

const csvParser = ParserFactory.create('csv');
console.log(csvParser.parse(csvData));
// [{ name: 'John', age: '30' }, { name: 'Jane', age: '25' }]

// 格式转换
const data = csvParser.parse(csvData);
const jsonOutput = jsonParser.stringify(data);
console.log(jsonOutput);
// [{ "name": "John", "age": "30" }, ...]
```

#### 何时使用工厂模式

- 为不同平台创建 UI 组件
- 为不同数据库系统创建数据库连接对象
- 为不同文件格式创建文档解析器
- 支付网关集成
- 通知服务（电子邮件、短信、推送）

---

### 模块模式

模块模式将相关代码封装成一个单元，为内部实现提供私有性的同时暴露公共 API。它利用 JavaScript 闭包来创建私有作用域。

#### 经典模块模式（IIFE）

```javascript
const ShoppingCart = (function() {
  // 私有变量
  let items = [];
  let discountCode = null;

  // 私有函数
  function calculateSubtotal() {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function applyDiscount(subtotal) {
    const discounts = {
      'SAVE10': 0.10,
      'SAVE20': 0.20,
      'HALF': 0.50
    };

    if (discountCode && discounts[discountCode]) {
      return subtotal * (1 - discounts[discountCode]);
    }

    return subtotal;
  }

  function findItem(productId) {
    return items.find(item => item.productId === productId);
  }

  // 公共 API
  return {
    addItem(productId, name, price, quantity = 1) {
      const existingItem = findItem(productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.push({ productId, name, price, quantity });
      }

      console.log(`Added ${quantity} x ${name} to cart`);
      return this;
    },

    removeItem(productId) {
      const index = items.findIndex(item => item.productId === productId);

      if (index > -1) {
        const removed = items.splice(index, 1)[0];
        console.log(`Removed ${removed.name} from cart`);
      }

      return this;
    },

    updateQuantity(productId, quantity) {
      const item = findItem(productId);

      if (item) {
        if (quantity <= 0) {
          return this.removeItem(productId);
        }
        item.quantity = quantity;
      }

      return this;
    },

    setDiscountCode(code) {
      discountCode = code.toUpperCase();
      console.log(`Discount code '${discountCode}' applied`);
      return this;
    },

    getItems() {
      return items.map(item => ({ ...item }));
    },

    getItemCount() {
      return items.reduce((count, item) => count + item.quantity, 0);
    },

    getSubtotal() {
      return calculateSubtotal();
    },

    getTotal() {
      return applyDiscount(calculateSubtotal());
    },

    clear() {
      items = [];
      discountCode = null;
      console.log('Cart cleared');
      return this;
    },

    checkout() {
      const order = {
        items: this.getItems(),
        subtotal: this.getSubtotal(),
        discount: discountCode,
        total: this.getTotal(),
        timestamp: new Date().toISOString()
      };

      this.clear();
      return order;
    }
  };
})();

// 使用示例
ShoppingCart
  .addItem('SKU001', 'Laptop', 999.99)
  .addItem('SKU002', 'Mouse', 29.99, 2)
  .addItem('SKU003', 'Keyboard', 79.99);

console.log('Item count:', ShoppingCart.getItemCount()); // 4
console.log('Subtotal:', ShoppingCart.getSubtotal()); // 1139.96

ShoppingCart.setDiscountCode('SAVE20');
console.log('Total with discount:', ShoppingCart.getTotal()); // 911.97

const order = ShoppingCart.checkout();
console.log('Order:', order);

// 私有变量无法访问
// console.log(ShoppingCart.items); // undefined
// console.log(ShoppingCart.discountCode); // undefined
```

#### 揭示模块模式

揭示模块模式是一种变体，所有函数都在私有作用域中定义，只暴露引用：

```javascript
const Calculator = (function() {
  // 私有状态
  let result = 0;
  let history = [];

  // 私有函数
  function addToHistory(operation, value, newResult) {
    history.push({
      operation,
      value,
      previousResult: result,
      newResult,
      timestamp: Date.now()
    });
  }

  function add(value) {
    const newResult = result + value;
    addToHistory('add', value, newResult);
    result = newResult;
    return this;
  }

  function subtract(value) {
    const newResult = result - value;
    addToHistory('subtract', value, newResult);
    result = newResult;
    return this;
  }

  function multiply(value) {
    const newResult = result * value;
    addToHistory('multiply', value, newResult);
    result = newResult;
    return this;
  }

  function divide(value) {
    if (value === 0) {
      throw new Error('Cannot divide by zero');
    }
    const newResult = result / value;
    addToHistory('divide', value, newResult);
    result = newResult;
    return this;
  }

  function getResult() {
    return result;
  }

  function getHistory() {
    return [...history];
  }

  function clear() {
    result = 0;
    console.log('Calculator cleared');
    return this;
  }

  function clearHistory() {
    history = [];
    console.log('History cleared');
    return this;
  }

  function undo() {
    if (history.length === 0) {
      console.log('Nothing to undo');
      return this;
    }

    const lastOperation = history.pop();
    result = lastOperation.previousResult;
    console.log(`Undid ${lastOperation.operation} ${lastOperation.value}`);
    return this;
  }

  // 揭示公共 API
  return {
    add,
    subtract,
    multiply,
    divide,
    getResult,
    getHistory,
    clear,
    clearHistory,
    undo
  };
})();

// 链式调用使用示例
Calculator
  .add(10)
  .multiply(2)
  .subtract(5)
  .divide(3);

console.log(Calculator.getResult()); // 5

Calculator.undo();
console.log(Calculator.getResult()); // 15

console.log(Calculator.getHistory());
// 显示所有带时间戳的操作
```

#### 带依赖的模块模式

```javascript
const APIClient = (function(config, logger) {
  // 私有状态
  let token = null;
  let requestCount = 0;

  // 私有方法
  async function request(method, endpoint, data = null) {
    requestCount++;

    const url = `${config.get('apiUrl')}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    logger.info(`[${method}] ${endpoint}`);

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      logger.debug(`Response received for ${endpoint}`);
      return result;
    } catch (error) {
      logger.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  // 公共 API
  return {
    setToken(newToken) {
      token = newToken;
      logger.info('Auth token set');
    },

    clearToken() {
      token = null;
      logger.info('Auth token cleared');
    },

    get(endpoint) {
      return request('GET', endpoint);
    },

    post(endpoint, data) {
      return request('POST', endpoint, data);
    },

    put(endpoint, data) {
      return request('PUT', endpoint, data);
    },

    delete(endpoint) {
      return request('DELETE', endpoint);
    },

    getRequestCount() {
      return requestCount;
    }
  };
})(ConfigManager, Logger.getInstance()); // 注入依赖

// 使用示例
// APIClient.setToken('jwt-token-here');
// const users = await APIClient.get('/users');
// const newUser = await APIClient.post('/users', { name: 'John' });
```

#### ES6 模块模式

现代 JavaScript 模块原生支持模块模式：

```javascript
// userService.js
let users = new Map();
let nextId = 1;

function generateId() {
  return nextId++;
}

function validateUser(userData) {
  const errors = [];

  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!userData.email || !userData.email.includes('@')) {
    errors.push('Valid email is required');
  }

  return errors;
}

export function createUser(userData) {
  const errors = validateUser(userData);

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const user = {
    id: generateId(),
    ...userData,
    createdAt: new Date().toISOString()
  };

  users.set(user.id, user);
  return { ...user };
}

export function getUser(id) {
  const user = users.get(id);
  return user ? { ...user } : null;
}

export function getAllUsers() {
  return Array.from(users.values()).map(user => ({ ...user }));
}

export function updateUser(id, updates) {
  const user = users.get(id);

  if (!user) {
    throw new Error(`User ${id} not found`);
  }

  const updatedUser = {
    ...user,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  users.set(id, updatedUser);
  return { ...updatedUser };
}

export function deleteUser(id) {
  return users.delete(id);
}

// 导出计数函数但保持 users map 私有
export function getUserCount() {
  return users.size;
}
```

#### 何时使用模块模式

- 组织相关功能
- 创建命名空间以避免全局污染
- 封装私有状态和实现
- 构建可重用库
- 管理复杂的应用功能

---

## 结构型模式

结构型模式处理对象组合，创建对象之间的关系以形成更大的结构，同时保持结构的灵活性和高效性。

### 装饰器模式

装饰器模式允许动态地向单个对象添加行为，而不影响同一类的其他对象。它为扩展功能提供了一种灵活的替代子类化的方法。

#### 基于类的装饰器

```javascript
// 基础组件
class Coffee {
  constructor() {
    this.description = 'Simple Coffee';
  }

  getDescription() {
    return this.description;
  }

  getCost() {
    return 2.00;
  }
}

// 基础装饰器
class CoffeeDecorator {
  constructor(coffee) {
    this.coffee = coffee;
  }

  getDescription() {
    return this.coffee.getDescription();
  }

  getCost() {
    return this.coffee.getCost();
  }
}

// 具体装饰器
class MilkDecorator extends CoffeeDecorator {
  getDescription() {
    return `${this.coffee.getDescription()}, Milk`;
  }

  getCost() {
    return this.coffee.getCost() + 0.50;
  }
}

class SugarDecorator extends CoffeeDecorator {
  getDescription() {
    return `${this.coffee.getDescription()}, Sugar`;
  }

  getCost() {
    return this.coffee.getCost() + 0.25;
  }
}

class VanillaDecorator extends CoffeeDecorator {
  getDescription() {
    return `${this.coffee.getDescription()}, Vanilla`;
  }

  getCost() {
    return this.coffee.getCost() + 0.75;
  }
}

class WhippedCreamDecorator extends CoffeeDecorator {
  getDescription() {
    return `${this.coffee.getDescription()}, Whipped Cream`;
  }

  getCost() {
    return this.coffee.getCost() + 1.00;
  }
}

class CaramelDecorator extends CoffeeDecorator {
  getDescription() {
    return `${this.coffee.getDescription()}, Caramel Drizzle`;
  }

  getCost() {
    return this.coffee.getCost() + 0.60;
  }
}

// 使用示例
let myCoffee = new Coffee();
console.log(`${myCoffee.getDescription()}: $${myCoffee.getCost().toFixed(2)}`);
// Simple Coffee: $2.00

myCoffee = new MilkDecorator(myCoffee);
console.log(`${myCoffee.getDescription()}: $${myCoffee.getCost().toFixed(2)}`);
// Simple Coffee, Milk: $2.50

myCoffee = new VanillaDecorator(myCoffee);
console.log(`${myCoffee.getDescription()}: $${myCoffee.getCost().toFixed(2)}`);
// Simple Coffee, Milk, Vanilla: $3.25

myCoffee = new WhippedCreamDecorator(myCoffee);
console.log(`${myCoffee.getDescription()}: $${myCoffee.getCost().toFixed(2)}`);
// Simple Coffee, Milk, Vanilla, Whipped Cream: $4.25

// 创建不同组合
let fancyCoffee = new CaramelDecorator(
  new WhippedCreamDecorator(
    new VanillaDecorator(
      new MilkDecorator(
        new Coffee()
      )
    )
  )
);

console.log(`${fancyCoffee.getDescription()}: $${fancyCoffee.getCost().toFixed(2)}`);
// Simple Coffee, Milk, Vanilla, Whipped Cream, Caramel Drizzle: $4.85
```

#### 函数装饰器

JavaScript 的一等函数特性使得创建函数装饰器变得非常自然：

```javascript
// 计时装饰器
function withTiming(fn) {
  return function(...args) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    console.log(`${fn.name} took ${(end - start).toFixed(2)}ms`);
    return result;
  };
}

// 日志装饰器
function withLogging(fn) {
  return function(...args) {
    console.log(`Calling ${fn.name} with:`, args);
    const result = fn.apply(this, args);
    console.log(`${fn.name} returned:`, result);
    return result;
  };
}

// 记忆化装饰器
function withMemoization(fn) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`Cache hit for ${fn.name}`);
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 重试装饰器
function withRetry(fn, maxRetries = 3, delay = 1000) {
  return async function(...args) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        lastError = error;
        console.log(`Attempt ${attempt} failed: ${error.message}`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  };
}

// 防抖装饰器
function withDebounce(fn, wait = 300) {
  let timeout;

  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// 节流装饰器
function withThrottle(fn, limit = 300) {
  let inThrottle;

  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 使用示例
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function add(a, b) {
  return a + b;
}

// 应用装饰器
const timedAdd = withTiming(withLogging(add));
timedAdd(5, 3);
// Calling add with: [5, 3]
// add returned: 8
// add took 0.12ms

// 性能优化的记忆化斐波那契
const memoFib = withMemoization(function fibonacci(n) {
  if (n <= 1) return n;
  return memoFib(n - 1) + memoFib(n - 2);
});

console.log(memoFib(40)); // 使用记忆化快速计算
console.log(memoFib(40)); // 缓存命中

// 防抖搜索
const search = withDebounce((query) => {
  console.log(`Searching for: ${query}`);
}, 300);

// 只有最后一次调用会在 300ms 后执行
search('h');
search('he');
search('hel');
search('hell');
search('hello');
```

#### 异步函数装饰器

```javascript
// 限流装饰器
function withRateLimit(fn, requestsPerSecond = 10) {
  const queue = [];
  let processing = false;

  async function processQueue() {
    if (processing || queue.length === 0) return;

    processing = true;

    while (queue.length > 0) {
      const { args, resolve, reject } = queue.shift();

      try {
        const result = await fn(...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }

      await new Promise(r => setTimeout(r, 1000 / requestsPerSecond));
    }

    processing = false;
  }

  return function(...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      processQueue();
    });
  };
}

// 带 TTL 的缓存装饰器
function withCache(fn, ttlMs = 60000) {
  const cache = new Map();

  return async function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.value;
    }

    const result = await fn.apply(this, args);
    cache.set(key, { value: result, timestamp: Date.now() });

    return result;
  };
}

// 熔断器装饰器
function withCircuitBreaker(fn, options = {}) {
  const {
    failureThreshold = 5,
    resetTimeout = 30000
  } = options;

  let failures = 0;
  let lastFailure = null;
  let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  return async function(...args) {
    if (state === 'OPEN') {
      if (Date.now() - lastFailure >= resetTimeout) {
        state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn.apply(this, args);

      if (state === 'HALF_OPEN') {
        state = 'CLOSED';
        failures = 0;
      }

      return result;
    } catch (error) {
      failures++;
      lastFailure = Date.now();

      if (failures >= failureThreshold) {
        state = 'OPEN';
        console.log('Circuit breaker OPENED');
      }

      throw error;
    }
  };
}

// 使用示例
async function fetchUser(id) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

const safeFetchUser = withCircuitBreaker(
  withCache(
    withRateLimit(fetchUser, 5),
    30000
  ),
  { failureThreshold: 3, resetTimeout: 60000 }
);
```

#### 实际示例：请求/响应管道

```javascript
class HTTPRequest {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
    this.body = options.body || null;
    this.metadata = {};
  }
}

class HTTPResponse {
  constructor(status, data, headers = {}) {
    this.status = status;
    this.data = data;
    this.headers = headers;
    this.metadata = {};
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }
}

// 请求装饰器
class AuthDecorator {
  constructor(handler, getToken) {
    this.handler = handler;
    this.getToken = getToken;
  }

  async handle(request) {
    const token = await this.getToken();
    request.headers['Authorization'] = `Bearer ${token}`;
    return this.handler.handle(request);
  }
}

class LoggingDecorator {
  constructor(handler, logger) {
    this.handler = handler;
    this.logger = logger;
  }

  async handle(request) {
    const start = Date.now();
    this.logger.info(`[${request.method}] ${request.url}`);

    try {
      const response = await this.handler.handle(request);
      const duration = Date.now() - start;
      this.logger.info(`[${response.status}] ${request.url} (${duration}ms)`);
      return response;
    } catch (error) {
      this.logger.error(`[ERROR] ${request.url}: ${error.message}`);
      throw error;
    }
  }
}

class CacheDecorator {
  constructor(handler, cache, ttl = 60000) {
    this.handler = handler;
    this.cache = cache;
    this.ttl = ttl;
  }

  async handle(request) {
    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return this.handler.handle(request);
    }

    const cacheKey = `${request.method}:${request.url}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      cached.metadata.fromCache = true;
      return cached;
    }

    const response = await this.handler.handle(request);

    if (response.ok) {
      await this.cache.set(cacheKey, response, this.ttl);
    }

    return response;
  }
}

class RetryDecorator {
  constructor(handler, maxRetries = 3, delay = 1000) {
    this.handler = handler;
    this.maxRetries = maxRetries;
    this.delay = delay;
  }

  async handle(request) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.handler.handle(request);

        // 服务器错误时重试
        if (response.status >= 500 && attempt < this.maxRetries) {
          await this.wait(this.delay * Math.pow(2, attempt));
          continue;
        }

        response.metadata.attempts = attempt + 1;
        return response;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          await this.wait(this.delay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 基础处理器
class FetchHandler {
  async handle(request) {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : null
    });

    const data = await response.json();
    return new HTTPResponse(response.status, data, Object.fromEntries(response.headers));
  }
}

// 构建装饰后的处理器
function createHTTPClient(options = {}) {
  let handler = new FetchHandler();

  // 按相反顺序应用装饰器（最后应用的最先执行）
  if (options.retry) {
    handler = new RetryDecorator(handler, options.retry.maxRetries, options.retry.delay);
  }

  if (options.cache) {
    handler = new CacheDecorator(handler, options.cache.store, options.cache.ttl);
  }

  if (options.logging) {
    handler = new LoggingDecorator(handler, options.logging.logger);
  }

  if (options.auth) {
    handler = new AuthDecorator(handler, options.auth.getToken);
  }

  return {
    async get(url) {
      return handler.handle(new HTTPRequest(url));
    },
    async post(url, data) {
      return handler.handle(new HTTPRequest(url, { method: 'POST', body: data }));
    },
    async put(url, data) {
      return handler.handle(new HTTPRequest(url, { method: 'PUT', body: data }));
    },
    async delete(url) {
      return handler.handle(new HTTPRequest(url, { method: 'DELETE' }));
    }
  };
}

// 使用示例
const client = createHTTPClient({
  auth: {
    getToken: async () => 'my-jwt-token'
  },
  logging: {
    logger: console
  },
  cache: {
    store: new Map(), // 简单缓存，生产环境使用 Redis
    ttl: 60000
  },
  retry: {
    maxRetries: 3,
    delay: 1000
  }
});

// const users = await client.get('/api/users');
```

#### 何时使用装饰器模式

- 在不修改对象结构的情况下为对象添加功能
- Web 框架中的中间件
- 日志、缓存、认证包装器
- UI 组件增强
- 横切关注点（指标、追踪）

---

### 代理模式

代理模式为另一个对象提供一个替代者或占位符以控制对它的访问。代理可以添加延迟初始化、访问控制、日志记录、缓存或验证等功能。

#### 虚拟代理（延迟加载）

```javascript
class HeavyImage {
  constructor(filename) {
    this.filename = filename;
    this.loadImage(); // 开销大的操作
  }

  loadImage() {
    console.log(`Loading heavy image: ${this.filename}...`);
    // 模拟昂贵的加载操作
    this.data = `Image data for ${this.filename}`;
  }

  display() {
    console.log(`Displaying: ${this.filename}`);
    return this.data;
  }

  getInfo() {
    return {
      filename: this.filename,
      size: this.data?.length || 0
    };
  }
}

class ImageProxy {
  constructor(filename) {
    this.filename = filename;
    this.realImage = null;
  }

  loadImage() {
    if (!this.realImage) {
      this.realImage = new HeavyImage(this.filename);
    }
  }

  display() {
    this.loadImage(); // 只在需要时加载
    return this.realImage.display();
  }

  getInfo() {
    // 可以返回基本信息而无需加载
    if (this.realImage) {
      return this.realImage.getInfo();
    }
    return { filename: this.filename, size: 'unknown (not loaded)' };
  }
}

// 使用示例
const images = [
  new ImageProxy('photo1.jpg'),
  new ImageProxy('photo2.jpg'),
  new ImageProxy('photo3.jpg')
];

// 图片尚未加载
console.log(images[0].getInfo()); // { filename: 'photo1.jpg', size: 'unknown (not loaded)' }

// 只有在显示时才加载
images[1].display();
// Loading heavy image: photo2.jpg...
// Displaying: photo2.jpg
```

#### 保护代理（访问控制）

```javascript
class BankAccount {
  constructor(balance) {
    this.balance = balance;
    this.transactions = [];
  }

  deposit(amount) {
    this.balance += amount;
    this.transactions.push({ type: 'deposit', amount, date: new Date() });
    return this.balance;
  }

  withdraw(amount) {
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
    this.transactions.push({ type: 'withdraw', amount, date: new Date() });
    return this.balance;
  }

  getBalance() {
    return this.balance;
  }

  getTransactions() {
    return [...this.transactions];
  }
}

class SecureBankAccountProxy {
  constructor(account, user) {
    this.account = account;
    this.user = user;
    this.accessLog = [];
  }

  logAccess(action, success) {
    this.accessLog.push({
      user: this.user.id,
      action,
      success,
      timestamp: new Date()
    });
  }

  checkPermission(action) {
    const permissions = {
      admin: ['deposit', 'withdraw', 'getBalance', 'getTransactions'],
      manager: ['deposit', 'withdraw', 'getBalance', 'getTransactions'],
      teller: ['deposit', 'getBalance'],
      viewer: ['getBalance']
    };

    return permissions[this.user.role]?.includes(action) || false;
  }

  deposit(amount) {
    if (!this.checkPermission('deposit')) {
      this.logAccess('deposit', false);
      throw new Error('Access denied: insufficient permissions');
    }

    if (amount > 10000 && this.user.role !== 'admin') {
      this.logAccess('deposit', false);
      throw new Error('Access denied: large deposits require admin approval');
    }

    this.logAccess('deposit', true);
    return this.account.deposit(amount);
  }

  withdraw(amount) {
    if (!this.checkPermission('withdraw')) {
      this.logAccess('withdraw', false);
      throw new Error('Access denied: insufficient permissions');
    }

    if (amount > 5000 && this.user.role !== 'admin') {
      this.logAccess('withdraw', false);
      throw new Error('Access denied: large withdrawals require admin approval');
    }

    this.logAccess('withdraw', true);
    return this.account.withdraw(amount);
  }

  getBalance() {
    if (!this.checkPermission('getBalance')) {
      this.logAccess('getBalance', false);
      throw new Error('Access denied: insufficient permissions');
    }

    this.logAccess('getBalance', true);
    return this.account.getBalance();
  }

  getTransactions() {
    if (!this.checkPermission('getTransactions')) {
      this.logAccess('getTransactions', false);
      throw new Error('Access denied: insufficient permissions');
    }

    this.logAccess('getTransactions', true);
    return this.account.getTransactions();
  }

  getAccessLog() {
    if (this.user.role !== 'admin') {
      throw new Error('Access denied: admin only');
    }
    return [...this.accessLog];
  }
}

// 使用示例
const account = new BankAccount(1000);

const adminUser = { id: 1, role: 'admin' };
const tellerUser = { id: 2, role: 'teller' };
const viewerUser = { id: 3, role: 'viewer' };

const adminProxy = new SecureBankAccountProxy(account, adminUser);
const tellerProxy = new SecureBankAccountProxy(account, tellerUser);
const viewerProxy = new SecureBankAccountProxy(account, viewerUser);

// 管理员可以执行所有操作
adminProxy.deposit(15000);
adminProxy.withdraw(500);
console.log(adminProxy.getBalance()); // 15500

// 柜员可以存款但不能取款
tellerProxy.deposit(100);
// tellerProxy.withdraw(50); // Error: Access denied

// 查看者只能查看余额
console.log(viewerProxy.getBalance()); // 15600
// viewerProxy.deposit(100); // Error: Access denied
```

#### ES6 Proxy 对象

JavaScript 内置的 Proxy 支持强大的元编程：

```javascript
// 验证代理
function createValidatedObject(target, schema) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const validator = schema[prop];

      if (!validator) {
        obj[prop] = value;
        return true;
      }

      const { validate, message } = validator;

      if (!validate(value)) {
        throw new TypeError(message || `Invalid value for ${prop}`);
      }

      obj[prop] = value;
      return true;
    }
  });
}

const userSchema = {
  name: {
    validate: (v) => typeof v === 'string' && v.length >= 2,
    message: 'Name must be a string with at least 2 characters'
  },
  age: {
    validate: (v) => typeof v === 'number' && v >= 0 && v <= 150,
    message: 'Age must be a number between 0 and 150'
  },
  email: {
    validate: (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    message: 'Email must be a valid email address'
  }
};

const user = createValidatedObject({}, userSchema);

user.name = 'John Doe'; // OK
user.age = 30; // OK
user.email = 'john@example.com'; // OK

// user.name = 'J'; // TypeError: Name must be a string with at least 2 characters
// user.age = -5; // TypeError: Age must be a number between 0 and 150
// user.email = 'invalid'; // TypeError: Email must be a valid email address

console.log(user); // { name: 'John Doe', age: 30, email: 'john@example.com' }
```

#### 可观察代理（变更追踪）

```javascript
function createObservable(target, onChange) {
  const handler = {
    get(obj, prop) {
      const value = obj[prop];

      if (typeof value === 'object' && value !== null) {
        return createObservable(value, (path, oldVal, newVal) => {
          onChange(`${prop}.${path}`, oldVal, newVal);
        });
      }

      return value;
    },

    set(obj, prop, value) {
      const oldValue = obj[prop];

      if (oldValue !== value) {
        obj[prop] = value;
        onChange(prop, oldValue, value);
      }

      return true;
    },

    deleteProperty(obj, prop) {
      if (prop in obj) {
        const oldValue = obj[prop];
        delete obj[prop];
        onChange(prop, oldValue, undefined);
      }
      return true;
    }
  };

  return new Proxy(target, handler);
}

// 使用示例
const state = createObservable(
  {
    user: {
      name: 'John',
      preferences: {
        theme: 'light'
      }
    },
    count: 0
  },
  (path, oldValue, newValue) => {
    console.log(`Change detected: ${path}`);
    console.log(`  Old: ${JSON.stringify(oldValue)}`);
    console.log(`  New: ${JSON.stringify(newValue)}`);
  }
);

state.count = 1;
// Change detected: count
//   Old: 0
//   New: 1

state.user.name = 'Jane';
// Change detected: user.name
//   Old: "John"
//   New: "Jane"

state.user.preferences.theme = 'dark';
// Change detected: user.preferences.theme
//   Old: "light"
//   New: "dark"
```

#### 缓存代理

```javascript
function createCachingProxy(target, options = {}) {
  const cache = new Map();
  const { ttl = Infinity, maxSize = 1000 } = options;

  return new Proxy(target, {
    apply(fn, thisArg, args) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached) {
        if (Date.now() - cached.timestamp < ttl) {
          console.log('Cache hit');
          return cached.value;
        }
        cache.delete(key);
      }

      console.log('Cache miss - computing...');
      const result = fn.apply(thisArg, args);

      // 强制最大大小（类似 LRU 行为）
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    }
  });
}

// 开销大的函数
function computeExpensive(n) {
  let result = 0;
  for (let i = 0; i < n * 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

const cachedCompute = createCachingProxy(computeExpensive, { ttl: 5000 });

console.log(cachedCompute(10)); // Cache miss - computing...
console.log(cachedCompute(10)); // Cache hit
console.log(cachedCompute(20)); // Cache miss - computing...
console.log(cachedCompute(10)); // Cache hit (still within TTL)
```

#### 实际示例：API 响应缓存

```javascript
class APIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

class CachingAPIProxy {
  constructor(client, options = {}) {
    this.client = client;
    this.cache = new Map();
    this.ttl = options.ttl || 60000;
    this.invalidatePatterns = options.invalidatePatterns || {};
  }

  getCacheKey(method, endpoint) {
    return `${method}:${endpoint}`;
  }

  async get(endpoint) {
    const cacheKey = this.getCacheKey('GET', endpoint);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`[CACHE HIT] GET ${endpoint}`);
      return cached.data;
    }

    console.log(`[CACHE MISS] GET ${endpoint}`);
    const data = await this.client.get(endpoint);

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async post(endpoint, data) {
    const result = await this.client.post(endpoint, data);

    // 使相关缓存条目失效
    this.invalidateCache(endpoint);

    return result;
  }

  invalidateCache(endpoint) {
    // 查找匹配此端点的模式
    for (const [pattern, relatedEndpoints] of Object.entries(this.invalidatePatterns)) {
      if (endpoint.includes(pattern)) {
        relatedEndpoints.forEach(related => {
          // 删除所有匹配相关模式的缓存条目
          for (const key of this.cache.keys()) {
            if (key.includes(related)) {
              console.log(`[CACHE INVALIDATE] ${key}`);
              this.cache.delete(key);
            }
          }
        });
      }
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('[CACHE CLEARED]');
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// 使用示例
const api = new CachingAPIProxy(
  new APIClient('https://api.example.com'),
  {
    ttl: 30000, // 30 秒
    invalidatePatterns: {
      '/users': ['/users'], // POST 到 /users 会使 /users 缓存失效
      '/posts': ['/posts', '/feed'] // POST 到 /posts 会使两者都失效
    }
  }
);

// 第一次调用 - 缓存未命中
// await api.get('/users');

// 第二次调用 - 缓存命中
// await api.get('/users');

// 创建用户 - 使 /users 缓存失效
// await api.post('/users', { name: 'John' });

// 下一次调用 - 再次缓存未命中
// await api.get('/users');
```

#### 何时使用代理模式

- 延迟初始化（虚拟代理）
- 访问控制（保护代理）
- 缓存（缓存代理）
- 日志记录和监控
- 验证
- 远程对象访问（远程代理）

---

## 行为型模式

行为型模式关注对象之间的通信，定义对象如何交互和分配责任。

### 观察者模式

观察者模式定义了对象之间的一对多依赖关系。当一个对象（主题）状态改变时，它的所有依赖者（观察者）都会被自动通知并更新。

#### 基本实现

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);

    // 返回取消订阅函数
    return () => this.off(event, listener);
  }

  once(event, listener) {
    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, onceWrapper);
    };

    return this.on(event, onceWrapper);
  }

  off(event, listener) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);

    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return;

    this.events.get(event).forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }

  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  listenerCount(event) {
    return this.events.get(event)?.length || 0;
  }
}

// 使用示例
const emitter = new EventEmitter();

// 订阅事件
const unsubscribe = emitter.on('userLoggedIn', (user) => {
  console.log(`Welcome, ${user.name}!`);
});

emitter.on('userLoggedIn', (user) => {
  console.log(`Logging user activity for ${user.id}`);
});

emitter.once('userLoggedIn', (user) => {
  console.log(`First login bonus for ${user.name}!`);
});

// 触发事件
emitter.emit('userLoggedIn', { id: 1, name: 'John' });
// Welcome, John!
// Logging user activity for 1
// First login bonus for John!

emitter.emit('userLoggedIn', { id: 1, name: 'John' });
// Welcome, John!
// Logging user activity for 1
// （没有首次登录奖励 - 它是 once 监听器）

// 取消订阅
unsubscribe();

emitter.emit('userLoggedIn', { id: 2, name: 'Jane' });
// Logging user activity for 2
// （没有欢迎消息 - 该监听器已被移除）
```

#### 主题-观察者模式

```javascript
class Subject {
  constructor() {
    this.observers = new Set();
    this.state = null;
  }

  attach(observer) {
    this.observers.add(observer);
    console.log(`Observer attached. Total: ${this.observers.size}`);
  }

  detach(observer) {
    this.observers.delete(observer);
    console.log(`Observer detached. Total: ${this.observers.size}`);
  }

  notify() {
    this.observers.forEach(observer => {
      observer.update(this.state);
    });
  }

  setState(state) {
    this.state = state;
    this.notify();
  }

  getState() {
    return this.state;
  }
}

class Observer {
  constructor(name) {
    this.name = name;
  }

  update(state) {
    console.log(`${this.name} received update:`, state);
  }
}

// 扩展示例：类型化观察者
class WeatherStation extends Subject {
  constructor() {
    super();
    this.readings = {
      temperature: 0,
      humidity: 0,
      pressure: 0
    };
  }

  setReadings(readings) {
    this.readings = { ...this.readings, ...readings };
    this.setState(this.readings);
  }
}

class TemperatureDisplay extends Observer {
  update(state) {
    console.log(`Temperature Display: ${state.temperature}°C`);
  }
}

class HumidityDisplay extends Observer {
  update(state) {
    console.log(`Humidity Display: ${state.humidity}%`);
  }
}

class WeatherAlert extends Observer {
  update(state) {
    if (state.temperature > 35) {
      console.log('ALERT: High temperature warning!');
    }
    if (state.humidity > 90) {
      console.log('ALERT: High humidity warning!');
    }
  }
}

// 使用示例
const weatherStation = new WeatherStation();

const tempDisplay = new TemperatureDisplay('Main Temp Display');
const humidityDisplay = new HumidityDisplay('Main Humidity Display');
const alerts = new WeatherAlert('Alert System');

weatherStation.attach(tempDisplay);
weatherStation.attach(humidityDisplay);
weatherStation.attach(alerts);

weatherStation.setReadings({ temperature: 25, humidity: 60, pressure: 1013 });
// Temperature Display: 25°C
// Humidity Display: 60%

weatherStation.setReadings({ temperature: 38, humidity: 95, pressure: 1010 });
// Temperature Display: 38°C
// Humidity Display: 95%
// ALERT: High temperature warning!
// ALERT: High humidity warning!
```

#### 响应式状态管理

```javascript
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
    this.middleware = [];
  }

  use(middlewareFn) {
    this.middleware.push(middlewareFn);
    return this;
  }

  getState(path = null) {
    if (!path) return { ...this.state };

    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  setState(path, value) {
    const prevState = JSON.parse(JSON.stringify(this.state));

    // 应用中间件
    let shouldUpdate = true;
    for (const mw of this.middleware) {
      const result = mw({
        path,
        prevValue: this.getState(path),
        nextValue: value,
        state: this.state
      });

      if (result === false) {
        shouldUpdate = false;
        break;
      }
    }

    if (!shouldUpdate) return;

    // 更新状态
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (obj[key] === undefined) obj[key] = {};
      return obj[key];
    }, this.state);

    target[lastKey] = value;

    // 通知监听器
    this.notifyListeners(path, prevState);
  }

  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }

    this.listeners.get(path).add(callback);

    // 返回取消订阅函数
    return () => {
      this.listeners.get(path)?.delete(callback);
    };
  }

  notifyListeners(changedPath, prevState) {
    // 通知精确匹配
    if (this.listeners.has(changedPath)) {
      const newValue = this.getState(changedPath);
      const oldValue = changedPath.split('.').reduce((obj, key) => obj?.[key], prevState);

      this.listeners.get(changedPath).forEach(cb => {
        cb(newValue, oldValue, changedPath);
      });
    }

    // 通知父路径
    const parts = changedPath.split('.');
    while (parts.length > 0) {
      const parentPath = parts.join('.');

      if (this.listeners.has(parentPath)) {
        const newValue = this.getState(parentPath);
        const oldValue = parts.reduce((obj, key) => obj?.[key], prevState);

        this.listeners.get(parentPath).forEach(cb => {
          cb(newValue, oldValue, changedPath);
        });
      }

      parts.pop();
    }

    // 通知根订阅者
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => {
        cb(this.state, prevState, changedPath);
      });
    }
  }
}

// 日志中间件
const loggingMiddleware = ({ path, prevValue, nextValue }) => {
  console.log(`[STATE] ${path}: ${JSON.stringify(prevValue)} -> ${JSON.stringify(nextValue)}`);
  return true;
};

// 验证中间件
const validationMiddleware = ({ path, nextValue }) => {
  if (path.includes('age') && (typeof nextValue !== 'number' || nextValue < 0)) {
    console.error('Invalid age value');
    return false;
  }
  return true;
};

// 使用示例
const store = new Store({
  user: {
    name: 'John',
    age: 30,
    preferences: {
      theme: 'light',
      notifications: true
    }
  },
  cart: {
    items: [],
    total: 0
  }
});

store.use(loggingMiddleware);
store.use(validationMiddleware);

// 订阅特定路径
const unsubName = store.subscribe('user.name', (newVal, oldVal) => {
  console.log(`Name changed from "${oldVal}" to "${newVal}"`);
});

store.subscribe('user.preferences', (newVal, oldVal, changedPath) => {
  console.log(`Preferences updated (changed: ${changedPath}):`, newVal);
});

store.subscribe('*', (newState, oldState, changedPath) => {
  console.log(`Global: Something changed at ${changedPath}`);
});

// 触发更新
store.setState('user.name', 'Jane');
// [STATE] user.name: "John" -> "Jane"
// Name changed from "John" to "Jane"
// Global: Something changed at user.name

store.setState('user.preferences.theme', 'dark');
// [STATE] user.preferences.theme: "light" -> "dark"
// Preferences updated (changed: user.preferences.theme): { theme: 'dark', notifications: true }
// Global: Something changed at user.preferences.theme

store.setState('user.age', -5);
// Invalid age value (被验证中间件阻止)
```

#### 实际示例：表单状态管理

```javascript
class FormStore {
  constructor(initialValues = {}) {
    this.values = { ...initialValues };
    this.errors = {};
    this.touched = {};
    this.validators = {};
    this.subscribers = {
      values: new Set(),
      errors: new Set(),
      touched: new Set(),
      submit: new Set()
    };
  }

  setValidator(field, validatorFn) {
    this.validators[field] = validatorFn;
    return this;
  }

  setValue(field, value) {
    const prevValue = this.values[field];
    this.values[field] = value;

    // 变更时验证
    this.validateField(field);

    // 通知订阅者
    this.notify('values', { field, value, prevValue });
  }

  setTouched(field, touched = true) {
    this.touched[field] = touched;

    if (touched) {
      this.validateField(field);
    }

    this.notify('touched', { field, touched });
  }

  validateField(field) {
    const validator = this.validators[field];

    if (!validator) {
      delete this.errors[field];
      return true;
    }

    const error = validator(this.values[field], this.values);

    if (error) {
      this.errors[field] = error;
    } else {
      delete this.errors[field];
    }

    this.notify('errors', { field, error });
    return !error;
  }

  validateAll() {
    let isValid = true;

    Object.keys(this.validators).forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  subscribe(event, callback) {
    this.subscribers[event]?.add(callback);

    return () => {
      this.subscribers[event]?.delete(callback);
    };
  }

  notify(event, data) {
    this.subscribers[event]?.forEach(cb => cb(data, this));
  }

  getFieldProps(field) {
    return {
      value: this.values[field] ?? '',
      onChange: (e) => {
        const value = e.target?.value ?? e;
        this.setValue(field, value);
      },
      onBlur: () => this.setTouched(field, true),
      error: this.touched[field] ? this.errors[field] : null
    };
  }

  handleSubmit(onSubmit) {
    return async (e) => {
      e?.preventDefault();

      // 将所有字段标记为已触碰
      Object.keys(this.validators).forEach(field => {
        this.setTouched(field, true);
      });

      // 验证所有字段
      if (!this.validateAll()) {
        this.notify('submit', { success: false, errors: { ...this.errors } });
        return;
      }

      // 调用提交处理器
      try {
        await onSubmit(this.values);
        this.notify('submit', { success: true, values: { ...this.values } });
      } catch (error) {
        this.notify('submit', { success: false, error });
      }
    };
  }

  reset(newValues = {}) {
    this.values = { ...newValues };
    this.errors = {};
    this.touched = {};
    this.notify('values', { reset: true });
    this.notify('errors', { reset: true });
    this.notify('touched', { reset: true });
  }
}

// 使用示例
const form = new FormStore({
  email: '',
  password: '',
  confirmPassword: ''
});

// 设置验证器
form
  .setValidator('email', (value) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return null;
  })
  .setValidator('password', (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  })
  .setValidator('confirmPassword', (value, allValues) => {
    if (!value) return 'Please confirm your password';
    if (value !== allValues.password) return 'Passwords do not match';
    return null;
  });

// 订阅变更
form.subscribe('values', ({ field, value }) => {
  console.log(`Field "${field}" changed to: ${value}`);
});

form.subscribe('errors', ({ field, error }) => {
  if (error) {
    console.log(`Validation error on "${field}": ${error}`);
  }
});

form.subscribe('submit', (result) => {
  if (result.success) {
    console.log('Form submitted successfully!', result.values);
  } else {
    console.log('Form submission failed:', result.errors || result.error);
  }
});

// 模拟表单交互
form.setValue('email', 'john@example.com');
form.setValue('password', 'securepassword123');
form.setValue('confirmPassword', 'securepassword123');

form.handleSubmit(async (values) => {
  console.log('Submitting:', values);
  // API 调用将在这里进行
})();
```

#### 何时使用观察者模式

- 事件处理系统
- 模型-视图-控制器（MVC）架构
- 实时数据更新
- 表单状态管理
- 股票市场监控
- 聊天应用程序

---

### 策略模式

策略模式定义一系列算法，将每个算法封装起来，并使它们可以相互替换。它让算法可以独立于使用它的客户端而变化。

#### 基本实现

```javascript
// 策略接口
class PaymentStrategy {
  pay(amount) {
    throw new Error('pay() must be implemented');
  }

  validate() {
    throw new Error('validate() must be implemented');
  }
}

// 具体策略
class CreditCardPayment extends PaymentStrategy {
  constructor(cardNumber, cvv, expiryDate) {
    super();
    this.cardNumber = cardNumber;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
  }

  validate() {
    // 简化的验证
    if (!this.cardNumber || this.cardNumber.length !== 16) {
      return { valid: false, error: 'Invalid card number' };
    }
    if (!this.cvv || this.cvv.length < 3) {
      return { valid: false, error: 'Invalid CVV' };
    }
    return { valid: true };
  }

  pay(amount) {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log(`Processing credit card payment of $${amount.toFixed(2)}`);
    console.log(`Card: **** **** **** ${this.cardNumber.slice(-4)}`);
    return { success: true, method: 'credit_card', amount };
  }
}

class PayPalPayment extends PaymentStrategy {
  constructor(email) {
    super();
    this.email = email;
  }

  validate() {
    if (!this.email || !this.email.includes('@')) {
      return { valid: false, error: 'Invalid PayPal email' };
    }
    return { valid: true };
  }

  pay(amount) {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log(`Processing PayPal payment of $${amount.toFixed(2)}`);
    console.log(`PayPal account: ${this.email}`);
    return { success: true, method: 'paypal', amount };
  }
}

class CryptoPayment extends PaymentStrategy {
  constructor(walletAddress, currency = 'BTC') {
    super();
    this.walletAddress = walletAddress;
    this.currency = currency;
    this.exchangeRates = { BTC: 45000, ETH: 3000, USDT: 1 };
  }

  validate() {
    if (!this.walletAddress || this.walletAddress.length < 26) {
      return { valid: false, error: 'Invalid wallet address' };
    }
    if (!this.exchangeRates[this.currency]) {
      return { valid: false, error: 'Unsupported cryptocurrency' };
    }
    return { valid: true };
  }

  pay(amount) {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const cryptoAmount = amount / this.exchangeRates[this.currency];
    console.log(`Processing ${this.currency} payment of $${amount.toFixed(2)}`);
    console.log(`Amount: ${cryptoAmount.toFixed(8)} ${this.currency}`);
    console.log(`Wallet: ${this.walletAddress.slice(0, 10)}...`);
    return { success: true, method: 'crypto', currency: this.currency, amount };
  }
}

class BankTransferPayment extends PaymentStrategy {
  constructor(accountNumber, routingNumber, accountName) {
    super();
    this.accountNumber = accountNumber;
    this.routingNumber = routingNumber;
    this.accountName = accountName;
  }

  validate() {
    if (!this.accountNumber || this.accountNumber.length < 8) {
      return { valid: false, error: 'Invalid account number' };
    }
    if (!this.routingNumber || this.routingNumber.length !== 9) {
      return { valid: false, error: 'Invalid routing number' };
    }
    return { valid: true };
  }

  pay(amount) {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    console.log(`Processing bank transfer of $${amount.toFixed(2)}`);
    console.log(`Account: ${this.accountName}`);
    console.log(`Account #: ****${this.accountNumber.slice(-4)}`);
    return { success: true, method: 'bank_transfer', amount };
  }
}

// 上下文
class PaymentProcessor {
  constructor() {
    this.strategy = null;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
    return this;
  }

  checkout(amount) {
    if (!this.strategy) {
      throw new Error('Payment strategy not set');
    }

    return this.strategy.pay(amount);
  }
}

// 使用示例
const processor = new PaymentProcessor();

// 信用卡支付
processor.setStrategy(new CreditCardPayment('1234567890123456', '123', '12/25'));
console.log(processor.checkout(99.99));

// 切换到 PayPal
processor.setStrategy(new PayPalPayment('user@example.com'));
console.log(processor.checkout(49.99));

// 切换到加密货币
processor.setStrategy(new CryptoPayment('1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P', 'ETH'));
console.log(processor.checkout(150.00));
```

#### 函数式策略模式

```javascript
// 策略作为函数
const sortStrategies = {
  quickSort: (arr) => {
    if (arr.length <= 1) return arr;

    const pivot = arr[Math.floor(arr.length / 2)];
    const left = arr.filter(x => x < pivot);
    const middle = arr.filter(x => x === pivot);
    const right = arr.filter(x => x > pivot);

    return [...sortStrategies.quickSort(left), ...middle, ...sortStrategies.quickSort(right)];
  },

  mergeSort: (arr) => {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = sortStrategies.mergeSort(arr.slice(0, mid));
    const right = sortStrategies.mergeSort(arr.slice(mid));

    return merge(left, right);

    function merge(left, right) {
      const result = [];
      let i = 0, j = 0;

      while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
          result.push(left[i++]);
        } else {
          result.push(right[j++]);
        }
      }

      return [...result, ...left.slice(i), ...right.slice(j)];
    }
  },

  bubbleSort: (arr) => {
    const result = [...arr];
    const n = result.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (result[j] > result[j + 1]) {
          [result[j], result[j + 1]] = [result[j + 1], result[j]];
        }
      }
    }

    return result;
  },

  insertionSort: (arr) => {
    const result = [...arr];

    for (let i = 1; i < result.length; i++) {
      const key = result[i];
      let j = i - 1;

      while (j >= 0 && result[j] > key) {
        result[j + 1] = result[j];
        j--;
      }

      result[j + 1] = key;
    }

    return result;
  }
};

// 带策略选择的排序器
class Sorter {
  constructor(strategy = 'quickSort') {
    this.setStrategy(strategy);
  }

  setStrategy(strategyName) {
    if (!sortStrategies[strategyName]) {
      throw new Error(`Unknown sorting strategy: ${strategyName}`);
    }
    this.strategy = sortStrategies[strategyName];
    this.strategyName = strategyName;
    return this;
  }

  sort(array) {
    const start = performance.now();
    const result = this.strategy([...array]);
    const duration = performance.now() - start;

    console.log(`${this.strategyName} took ${duration.toFixed(2)}ms for ${array.length} elements`);
    return result;
  }

  // 根据数组大小自动选择最佳策略
  autoSort(array) {
    if (array.length < 10) {
      return this.setStrategy('insertionSort').sort(array);
    } else if (array.length < 1000) {
      return this.setStrategy('quickSort').sort(array);
    } else {
      return this.setStrategy('mergeSort').sort(array);
    }
  }
}

// 使用示例
const sorter = new Sorter();
const smallArray = [5, 2, 8, 1, 9, 3, 7, 4, 6];
const largeArray = Array.from({ length: 10000 }, () => Math.random());

console.log(sorter.sort(smallArray));
// quickSort took 0.05ms for 9 elements

sorter.setStrategy('bubbleSort');
console.log(sorter.sort(smallArray));
// bubbleSort took 0.02ms for 9 elements

console.log(sorter.autoSort(largeArray));
// mergeSort took 15.32ms for 10000 elements
```

#### 实际示例：数据验证

```javascript
// 验证策略
const validators = {
  required: (value) => {
    return value !== undefined && value !== null && value !== ''
      ? null
      : 'This field is required';
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email address';
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    return value.length >= min ? null : `Must be at least ${min} characters`;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    return value.length <= max ? null : `Must be no more than ${max} characters`;
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  numeric: (value) => {
    if (!value) return null;
    return /^\d+$/.test(value) ? null : 'Must contain only numbers';
  },

  range: (min, max) => (value) => {
    if (!value) return null;
    const num = Number(value);
    return num >= min && num <= max ? null : `Must be between ${min} and ${max}`;
  },

  matches: (fieldName) => (value, allValues) => {
    if (!value) return null;
    return value === allValues[fieldName] ? null : `Must match ${fieldName}`;
  },

  custom: (validatorFn, message) => (value, allValues) => {
    return validatorFn(value, allValues) ? null : message;
  }
};

// 验证器组合器
class FormValidator {
  constructor() {
    this.rules = {};
  }

  field(name) {
    this.currentField = name;
    this.rules[name] = [];
    return this;
  }

  required(message = 'This field is required') {
    this.addRule((value) => {
      return validators.required(value) ? message : null;
    });
    return this;
  }

  email(message = 'Invalid email address') {
    this.addRule((value) => {
      return validators.email(value) || message !== 'Invalid email address' ? validators.email(value) || null : null;
    });
    return this;
  }

  minLength(min, message) {
    this.addRule(validators.minLength(min));
    return this;
  }

  maxLength(max, message) {
    this.addRule(validators.maxLength(max));
    return this;
  }

  pattern(regex, message) {
    this.addRule(validators.pattern(regex, message));
    return this;
  }

  matches(fieldName, message) {
    this.addRule((value, allValues) => {
      return value === allValues[fieldName] ? null : message || `Must match ${fieldName}`;
    });
    return this;
  }

  custom(validatorFn, message) {
    this.addRule(validators.custom(validatorFn, message));
    return this;
  }

  addRule(rule) {
    this.rules[this.currentField].push(rule);
  }

  validate(values) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(this.rules)) {
      for (const rule of rules) {
        const error = rule(values[field], values);

        if (error) {
          errors[field] = error;
          isValid = false;
          break; // 在该字段的第一个错误处停止
        }
      }
    }

    return { isValid, errors };
  }

  validateField(fieldName, value, allValues = {}) {
    const rules = this.rules[fieldName];

    if (!rules) {
      return { isValid: true, error: null };
    }

    for (const rule of rules) {
      const error = rule(value, allValues);

      if (error) {
        return { isValid: false, error };
      }
    }

    return { isValid: true, error: null };
  }
}

// 使用示例
const registrationValidator = new FormValidator()
  .field('username')
    .required()
    .minLength(3)
    .maxLength(20)
    .pattern(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed')
  .field('email')
    .required()
    .email()
  .field('password')
    .required()
    .minLength(8)
    .pattern(/(?=.*[A-Z])/, 'Must contain at least one uppercase letter')
    .pattern(/(?=.*[0-9])/, 'Must contain at least one number')
  .field('confirmPassword')
    .required()
    .matches('password', 'Passwords must match')
  .field('age')
    .required()
    .custom(
      (value) => Number(value) >= 18,
      'Must be at least 18 years old'
    );

// 测试验证
const formData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  age: '25'
};

console.log(registrationValidator.validate(formData));
// { isValid: true, errors: {} }

const invalidData = {
  username: 'jd',
  email: 'invalid-email',
  password: 'weak',
  confirmPassword: 'different',
  age: '16'
};

console.log(registrationValidator.validate(invalidData));
// {
//   isValid: false,
//   errors: {
//     username: 'Must be at least 3 characters',
//     email: 'Invalid email address',
//     password: 'Must be at least 8 characters',
//     confirmPassword: 'Passwords must match',
//     age: 'Must be at least 18 years old'
//   }
// }
```

#### 实际示例：文本压缩

```javascript
// 压缩策略
class CompressionStrategy {
  compress(data) {
    throw new Error('compress() must be implemented');
  }

  decompress(data) {
    throw new Error('decompress() must be implemented');
  }

  getName() {
    throw new Error('getName() must be implemented');
  }
}

class RunLengthEncoding extends CompressionStrategy {
  getName() {
    return 'RLE';
  }

  compress(data) {
    let compressed = '';
    let count = 1;

    for (let i = 0; i < data.length; i++) {
      if (data[i] === data[i + 1]) {
        count++;
      } else {
        compressed += count > 1 ? `${count}${data[i]}` : data[i];
        count = 1;
      }
    }

    return compressed;
  }

  decompress(data) {
    let decompressed = '';
    let count = '';

    for (const char of data) {
      if (/\d/.test(char)) {
        count += char;
      } else {
        const repeat = count ? parseInt(count) : 1;
        decompressed += char.repeat(repeat);
        count = '';
      }
    }

    return decompressed;
  }
}

class Base64Compression extends CompressionStrategy {
  getName() {
    return 'Base64';
  }

  compress(data) {
    return btoa(data);
  }

  decompress(data) {
    return atob(data);
  }
}

class HuffmanEncoding extends CompressionStrategy {
  getName() {
    return 'Huffman';
  }

  buildFrequencyTable(data) {
    const freq = {};
    for (const char of data) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }

  buildTree(freq) {
    const nodes = Object.entries(freq).map(([char, count]) => ({
      char,
      count,
      left: null,
      right: null
    }));

    while (nodes.length > 1) {
      nodes.sort((a, b) => a.count - b.count);

      const left = nodes.shift();
      const right = nodes.shift();

      nodes.push({
        char: null,
        count: left.count + right.count,
        left,
        right
      });
    }

    return nodes[0];
  }

  buildCodes(node, prefix = '', codes = {}) {
    if (node.char !== null) {
      codes[node.char] = prefix || '0';
      return codes;
    }

    if (node.left) this.buildCodes(node.left, prefix + '0', codes);
    if (node.right) this.buildCodes(node.right, prefix + '1', codes);

    return codes;
  }

  compress(data) {
    if (!data) return { encoded: '', tree: null };

    const freq = this.buildFrequencyTable(data);
    const tree = this.buildTree(freq);
    const codes = this.buildCodes(tree);

    let encoded = '';
    for (const char of data) {
      encoded += codes[char];
    }

    // 返回编码数据和解压缩所需的树
    return {
      encoded,
      tree: JSON.stringify(tree),
      compressionRatio: ((1 - encoded.length / 8 / data.length) * 100).toFixed(2) + '%'
    };
  }

  decompress({ encoded, tree }) {
    if (!encoded || !tree) return '';

    const treeObj = JSON.parse(tree);
    let decoded = '';
    let node = treeObj;

    for (const bit of encoded) {
      node = bit === '0' ? node.left : node.right;

      if (node.char !== null) {
        decoded += node.char;
        node = treeObj;
      }
    }

    return decoded;
  }
}

// 压缩器上下文
class DataCompressor {
  constructor(strategy = null) {
    this.strategy = strategy;
    this.strategies = new Map();
  }

  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
    return this;
  }

  useStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Strategy '${name}' not found`);
    }
    this.strategy = strategy;
    return this;
  }

  compress(data) {
    if (!this.strategy) {
      throw new Error('No compression strategy set');
    }

    const start = performance.now();
    const result = this.strategy.compress(data);
    const duration = performance.now() - start;

    console.log(`${this.strategy.getName()} compression took ${duration.toFixed(2)}ms`);
    return result;
  }

  decompress(data) {
    if (!this.strategy) {
      throw new Error('No compression strategy set');
    }

    return this.strategy.decompress(data);
  }

  // 根据数据特征自动选择最佳策略
  autoCompress(data) {
    // 检查数据是否有很多重复字符
    const uniqueChars = new Set(data).size;
    const repetitionRatio = data.length / uniqueChars;

    if (repetitionRatio > 3) {
      console.log('Auto-selecting RLE for repetitive data');
      return this.useStrategy('rle').compress(data);
    } else if (data.length < 100) {
      console.log('Auto-selecting Base64 for short data');
      return this.useStrategy('base64').compress(data);
    } else {
      console.log('Auto-selecting Huffman for general data');
      return this.useStrategy('huffman').compress(data);
    }
  }
}

// 使用示例
const compressor = new DataCompressor()
  .registerStrategy('rle', new RunLengthEncoding())
  .registerStrategy('base64', new Base64Compression())
  .registerStrategy('huffman', new HuffmanEncoding());

const repetitiveData = 'AAAAABBBBBCCCCCDDDDD';
const normalData = 'Hello, World! This is a test message.';

// RLE 非常适合重复数据
compressor.useStrategy('rle');
const rleCompressed = compressor.compress(repetitiveData);
console.log('RLE compressed:', rleCompressed); // 5A5B5C5D

const rleDecompressed = compressor.decompress(rleCompressed);
console.log('RLE decompressed:', rleDecompressed); // AAAAABBBBBCCCCCDDDDD

// Huffman 适合一般文本
compressor.useStrategy('huffman');
const huffmanResult = compressor.compress(normalData);
console.log('Huffman result:', huffmanResult);

// 自动选择
compressor.autoCompress(repetitiveData);
compressor.autoCompress(normalData);
```

#### 何时使用策略模式

- 多种可互换应用的算法
- 需要在运行时选择算法
- 避免复杂的条件语句
- 算法的不同变体
- 算法行为需要封装

---

## 模式组合

在实际应用中，设计模式经常组合使用以解决复杂问题。以下是组合多种模式的示例。

```javascript
// 组合单例、工厂、观察者和策略模式
// 实现一个通知系统

// 通知策略接口
class NotificationStrategy {
  send(message, recipient) {
    throw new Error('send() must be implemented');
  }
}

// 具体策略
class EmailNotification extends NotificationStrategy {
  send(message, recipient) {
    console.log(`Sending email to ${recipient.email}: ${message}`);
    return { type: 'email', recipient: recipient.email, message, status: 'sent' };
  }
}

class SMSNotification extends NotificationStrategy {
  send(message, recipient) {
    console.log(`Sending SMS to ${recipient.phone}: ${message}`);
    return { type: 'sms', recipient: recipient.phone, message, status: 'sent' };
  }
}

class PushNotification extends NotificationStrategy {
  send(message, recipient) {
    console.log(`Sending push notification to ${recipient.deviceId}: ${message}`);
    return { type: 'push', recipient: recipient.deviceId, message, status: 'sent' };
  }
}

class SlackNotification extends NotificationStrategy {
  send(message, recipient) {
    console.log(`Sending Slack message to ${recipient.slackId}: ${message}`);
    return { type: 'slack', recipient: recipient.slackId, message, status: 'sent' };
  }
}

// 创建通知策略的工厂
class NotificationFactory {
  constructor() {
    this.strategies = new Map();

    // 注册默认策略
    this.register('email', EmailNotification);
    this.register('sms', SMSNotification);
    this.register('push', PushNotification);
    this.register('slack', SlackNotification);
  }

  register(type, strategyClass) {
    this.strategies.set(type, strategyClass);
    return this;
  }

  create(type) {
    const StrategyClass = this.strategies.get(type);

    if (!StrategyClass) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    return new StrategyClass();
  }

  getAvailableTypes() {
    return Array.from(this.strategies.keys());
  }
}

// 带观察者模式的单例通知服务
const NotificationService = (function() {
  let instance;

  function createInstance() {
    const factory = new NotificationFactory();
    const subscribers = new Map();
    const history = [];

    return {
      // 观察者模式 - 订阅通知
      subscribe(event, callback) {
        if (!subscribers.has(event)) {
          subscribers.set(event, []);
        }
        subscribers.get(event).push(callback);

        return () => {
          const callbacks = subscribers.get(event);
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        };
      },

      // 通知所有订阅者
      notify(event, data) {
        if (subscribers.has(event)) {
          subscribers.get(event).forEach(cb => cb(data));
        }
      },

      // 使用策略模式发送通知
      send(type, message, recipient) {
        try {
          const strategy = factory.create(type);
          const result = strategy.send(message, recipient);

          // 记录到历史
          history.push({
            ...result,
            timestamp: new Date().toISOString()
          });

          // 通知观察者
          this.notify('notification:sent', result);

          return result;
        } catch (error) {
          this.notify('notification:error', { type, message, error: error.message });
          throw error;
        }
      },

      // 发送多种类型的通知
      sendMultiple(types, message, recipient) {
        return types.map(type => {
          try {
            return this.send(type, message, recipient);
          } catch (error) {
            return { type, status: 'failed', error: error.message };
          }
        });
      },

      // 工厂模式 - 注册新的通知类型
      registerType(type, strategyClass) {
        factory.register(type, strategyClass);
        this.notify('type:registered', { type });
        return this;
      },

      getAvailableTypes() {
        return factory.getAvailableTypes();
      },

      getHistory(filter = {}) {
        let filtered = [...history];

        if (filter.type) {
          filtered = filtered.filter(n => n.type === filter.type);
        }

        if (filter.status) {
          filtered = filtered.filter(n => n.status === filter.status);
        }

        if (filter.since) {
          filtered = filtered.filter(n => new Date(n.timestamp) >= new Date(filter.since));
        }

        return filtered;
      },

      clearHistory() {
        history.length = 0;
      }
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

// 使用示例
const notifications = NotificationService.getInstance();

// 订阅通知事件
notifications.subscribe('notification:sent', (data) => {
  console.log('Analytics: Notification sent', data);
});

notifications.subscribe('notification:error', (data) => {
  console.error('Alert: Notification failed', data);
});

// 定义接收者
const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  deviceId: 'device-abc-123',
  slackId: '@johndoe'
};

// 发送单个通知
notifications.send('email', 'Welcome to our platform!', user);
notifications.send('sms', 'Your verification code is 123456', user);

// 发送多个通知
notifications.sendMultiple(
  ['email', 'push', 'slack'],
  'Your order has been shipped!',
  user
);

// 注册自定义通知类型
class WebhookNotification extends NotificationStrategy {
  send(message, recipient) {
    console.log(`Sending webhook to ${recipient.webhookUrl}: ${message}`);
    return { type: 'webhook', recipient: recipient.webhookUrl, message, status: 'sent' };
  }
}

notifications.registerType('webhook', WebhookNotification);

// 使用新类型
const apiClient = { ...user, webhookUrl: 'https://api.example.com/webhook' };
notifications.send('webhook', 'Event triggered', apiClient);

// 检查历史
console.log('All sent notifications:', notifications.getHistory({ status: 'sent' }));
console.log('Available types:', notifications.getAvailableTypes());
```

---

## 最佳实践

### 何时使用设计模式

1. **单例模式**：谨慎使用。考虑使用依赖注入作为替代方案以避免全局状态问题。

2. **工厂模式**：当对象创建复杂或需要根据配置创建不同类型时使用。

3. **模块模式**：用于组织代码、创建命名空间和封装实现细节。

4. **装饰器模式**：当需要在不修改对象结构的情况下添加行为时使用。

5. **代理模式**：用于延迟加载、访问控制、缓存或日志记录。

6. **观察者模式**：用于事件驱动架构和组件之间的松耦合。

7. **策略模式**：当有多个可互换使用的算法时使用。

### 模式选择指南

| 问题 | 推荐模式 |
|------|----------|
| 单一共享实例 | 单例模式 |
| 复杂对象创建 | 工厂模式 |
| 代码组织 | 模块模式 |
| 动态添加行为 | 装饰器模式 |
| 控制对象访问 | 代理模式 |
| 一对多通知 | 观察者模式 |
| 可互换算法 | 策略模式 |

### 需要避免的常见反模式

1. **过度工程化**：不要在简单解决方案足够的地方使用模式。

2. **模式执念**：模式是工具，不是目标。用它们来解决实际问题。

3. **忽视 JavaScript 特性**：充分利用闭包、一等函数和原型。

4. **紧耦合**：模式应该促进松耦合，而不是引入依赖。

5. **过早优化**：不要为假设的未来需求增加复杂性。

---

## 总结

设计模式是 JavaScript 开发者工具箱中的强大工具。它们为常见问题提供了经过验证的解决方案，并为讨论软件架构创建了共享的词汇表。

**主要收获：**

- **创建型模式**（单例、工厂、模块）管理对象的创建和初始化
- **结构型模式**（装饰器、代理）组织对象组合和关系
- **行为型模式**（观察者、策略）定义通信和责任分配

请记住，模式是指南，而不是严格的规则。最好的代码通常是有效解决问题的最简单代码。谨慎使用模式，考虑应用程序的具体需求、团队经验和维护要求。

随着经验的积累，你将培养出判断每种模式何时适用的直觉。在项目中练习实现这些模式，你的代码将变得更有组织、更易维护、更加优雅。
