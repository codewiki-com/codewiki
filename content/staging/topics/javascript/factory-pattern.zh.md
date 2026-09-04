---
title: 工厂模式
description: JavaScript工厂模式深度解析：简单工厂、工厂方法、抽象工厂的原理与实战应用
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - 设计模式
  - 工厂模式
  - 创建型模式
  - OOP
status: imported
origin: old/src/content/docs/javascript/factory-pattern.zh.md
divergence: 0.149
issues: []
legacy:
  category: JavaScript
  subcategory: 设计模式
  order: 18
  lastUpdated: 2026-01-07
---

工厂模式是软件开发中最常用的创建型设计模式之一。它提供了一种创建对象的最佳方式，将对象的创建逻辑与使用逻辑分离，使代码更加灵活、可维护和可扩展。

## 概念解释

### 什么是工厂模式？

工厂模式（Factory Pattern）是一种创建型设计模式，它提供了一种创建对象的接口，但允许子类或具体实现决定实例化哪个类。工厂模式的核心思想是**将对象的创建过程封装起来**，客户端代码不需要知道具体的创建细节。

### 历史背景

工厂模式的概念源于经典的《设计模式：可复用面向对象软件的基础》（GoF 四人帮，1994年）。该书将工厂相关的模式分为两种：

- **工厂方法模式（Factory Method）**：定义一个创建对象的接口，让子类决定实例化哪个类
- **抽象工厂模式（Abstract Factory）**：提供一个创建一系列相关对象的接口

在 JavaScript 社区中，由于语言的动态特性，还衍生出了更简单的**简单工厂模式（Simple Factory）**。

### 解决什么问题？

工厂模式主要解决以下问题：

| 问题 | 工厂模式的解决方案 |
|------|-------------------|
| 对象创建逻辑复杂 | 将复杂的创建逻辑封装在工厂中 |
| 创建逻辑分散在多处 | 集中管理对象创建 |
| 客户端与具体类耦合 | 客户端只依赖接口，不依赖具体实现 |
| 需要根据条件创建不同对象 | 工厂根据参数返回不同类型的对象 |
| 对象创建需要复杂配置 | 工厂封装配置逻辑 |

---

## 核心原理

### 工厂模式的三种变体

```
┌─────────────────────────────────────────────────────────────────┐
│                        工厂模式家族                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐   │
│  │  简单工厂    │   │  工厂方法   │   │     抽象工厂        │   │
│  │  Simple     │   │  Factory    │   │     Abstract        │   │
│  │  Factory    │   │  Method     │   │     Factory         │   │
│  └─────────────┘   └─────────────┘   └─────────────────────┘   │
│        │                 │                     │                │
│        ▼                 ▼                     ▼                │
│   一个工厂类        每个产品一个        创建产品族               │
│   创建所有产品      对应的工厂         的工厂                    │
│                                                                 │
│   复杂度: ★☆☆      复杂度: ★★☆      复杂度: ★★★             │
│   灵活度: ★☆☆      灵活度: ★★☆      灵活度: ★★★             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 简单工厂原理

简单工厂不属于 GoF 的 23 种设计模式，但在实际开发中应用广泛。

```javascript
// 简单工厂的基本结构
class SimpleFactory {
  static create(type, ...args) {
    switch (type) {
      case 'A':
        return new ProductA(...args);
      case 'B':
        return new ProductB(...args);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}
```

**工作原理：**
1. 客户端调用工厂的静态方法，传入类型标识
2. 工厂内部根据类型判断应该创建哪种产品
3. 返回创建好的产品实例

### 工厂方法原理

工厂方法将实例化推迟到子类：

```javascript
// 工厂方法的基本结构
class Creator {
  // 工厂方法（抽象）
  createProduct() {
    throw new Error('Must implement createProduct()');
  }

  // 使用产品的业务逻辑
  operation() {
    const product = this.createProduct();
    return product.doSomething();
  }
}

class ConcreteCreatorA extends Creator {
  createProduct() {
    return new ProductA();
  }
}
```

**工作原理：**
1. 定义抽象的工厂方法
2. 子类实现具体的创建逻辑
3. 客户端使用具体的工厂子类

### 抽象工厂原理

抽象工厂创建相关对象的家族：

```javascript
// 抽象工厂的基本结构
class AbstractFactory {
  createProductA() { throw new Error('Abstract method'); }
  createProductB() { throw new Error('Abstract method'); }
}

class ConcreteFactory1 extends AbstractFactory {
  createProductA() { return new ProductA1(); }
  createProductB() { return new ProductB1(); }
}
```

**工作原理：**
1. 定义创建产品族的接口
2. 每个具体工厂创建一组相关的产品
3. 确保产品之间的兼容性

---

## 核心要点

### 模式对比

| 特性 | 简单工厂 | 工厂方法 | 抽象工厂 |
|------|----------|----------|----------|
| **结构** | 一个工厂类 | 工厂类层次结构 | 工厂类层次 + 产品族 |
| **扩展方式** | 修改工厂类 | 添加新的工厂子类 | 添加新的工厂子类 |
| **适用场景** | 产品类型少且稳定 | 产品类型可扩展 | 多个相关产品需要一起创建 |
| **开闭原则** | 违反 | 遵循 | 遵循 |
| **复杂度** | 低 | 中 | 高 |

### 何时使用工厂模式？

**使用简单工厂的场景：**
- 产品种类较少且相对固定
- 客户端不需要知道具体创建逻辑
- 创建逻辑简单

**使用工厂方法的场景：**
- 事先不知道需要创建哪个类的实例
- 希望让子类决定创建什么
- 需要遵循开闭原则

**使用抽象工厂的场景：**
- 需要创建一系列相关的产品对象
- 系统需要独立于产品的创建、组合和表示
- 需要确保产品的兼容性

### 工厂模式的优缺点

**优点：**
- 将创建逻辑集中管理
- 降低客户端与具体类的耦合
- 便于扩展新的产品类型
- 符合单一职责原则

**缺点：**
- 增加代码复杂度
- 可能导致类的数量增加
- 简单工厂违反开闭原则

---

## 代码示例

### 简单工厂模式

```javascript
// ========================
// 简单工厂模式完整示例
// ========================

// 产品基类
class Notification {
  constructor(message) {
    this.message = message;
    this.createdAt = new Date();
  }

  send() {
    throw new Error('send() must be implemented');
  }

  getInfo() {
    return `[${this.constructor.name}] ${this.message}`;
  }
}

// 具体产品类
class EmailNotification extends Notification {
  constructor(message, email) {
    super(message);
    this.email = email;
  }

  send() {
    console.log(`Sending email to ${this.email}: ${this.message}`);
    return { success: true, type: 'email', recipient: this.email };
  }
}

class SMSNotification extends Notification {
  constructor(message, phone) {
    super(message);
    this.phone = phone;
  }

  send() {
    console.log(`Sending SMS to ${this.phone}: ${this.message}`);
    return { success: true, type: 'sms', recipient: this.phone };
  }
}

class PushNotification extends Notification {
  constructor(message, deviceId) {
    super(message);
    this.deviceId = deviceId;
  }

  send() {
    console.log(`Sending push to device ${this.deviceId}: ${this.message}`);
    return { success: true, type: 'push', recipient: this.deviceId };
  }
}

class SlackNotification extends Notification {
  constructor(message, channel) {
    super(message);
    this.channel = channel;
  }

  send() {
    console.log(`Sending to Slack channel #${this.channel}: ${this.message}`);
    return { success: true, type: 'slack', recipient: this.channel };
  }
}

// 简单工厂
class NotificationFactory {
  // 注册表存储可创建的通知类型
  static #registry = new Map([
    ['email', EmailNotification],
    ['sms', SMSNotification],
    ['push', PushNotification],
    ['slack', SlackNotification]
  ]);

  /**
   * 创建通知实例
   * @param {string} type - 通知类型
   * @param {string} message - 消息内容
   * @param {string} recipient - 接收者
   * @returns {Notification}
   */
  static create(type, message, recipient) {
    const NotificationClass = this.#registry.get(type.toLowerCase());

    if (!NotificationClass) {
      throw new Error(`Unknown notification type: ${type}. Available types: ${[...this.#registry.keys()].join(', ')}`);
    }

    return new NotificationClass(message, recipient);
  }

  // 动态注册新的通知类型
  static register(type, NotificationClass) {
    if (!(NotificationClass.prototype instanceof Notification)) {
      throw new Error('NotificationClass must extend Notification');
    }
    this.#registry.set(type.toLowerCase(), NotificationClass);
  }

  // 获取所有可用类型
  static getAvailableTypes() {
    return [...this.#registry.keys()];
  }
}

// 使用示例
console.log('=== 简单工厂模式示例 ===\n');

// 创建不同类型的通知
const emailNotif = NotificationFactory.create('email', 'Welcome!', 'user@example.com');
const smsNotif = NotificationFactory.create('sms', 'Your code is 123456', '+1234567890');
const pushNotif = NotificationFactory.create('push', 'New message received', 'device-abc-123');
const slackNotif = NotificationFactory.create('slack', 'Deploy completed', 'deployments');

// 发送通知
emailNotif.send();   // Sending email to user@example.com: Welcome!
smsNotif.send();     // Sending SMS to +1234567890: Your code is 123456
pushNotif.send();    // Sending push to device device-abc-123: New message received
slackNotif.send();   // Sending to Slack channel #deployments: Deploy completed

console.log('\nAvailable types:', NotificationFactory.getAvailableTypes());

// 动态添加新类型
class WebhookNotification extends Notification {
  constructor(message, url) {
    super(message);
    this.url = url;
  }

  send() {
    console.log(`Sending webhook to ${this.url}: ${this.message}`);
    return { success: true, type: 'webhook', recipient: this.url };
  }
}

NotificationFactory.register('webhook', WebhookNotification);
const webhookNotif = NotificationFactory.create('webhook', 'Event triggered', 'https://api.example.com/webhook');
webhookNotif.send(); // Sending webhook to https://api.example.com/webhook: Event triggered
```

### 工厂方法模式

```javascript
// ========================
// 工厂方法模式完整示例
// ========================

// 抽象产品
class Document {
  constructor(name) {
    this.name = name;
    this.content = '';
    this.metadata = {
      createdAt: new Date(),
      modifiedAt: new Date()
    };
  }

  open() {
    throw new Error('open() must be implemented');
  }

  save() {
    throw new Error('save() must be implemented');
  }

  close() {
    console.log(`Closing document: ${this.name}`);
  }

  setContent(content) {
    this.content = content;
    this.metadata.modifiedAt = new Date();
  }
}

// 具体产品
class PDFDocument extends Document {
  constructor(name) {
    super(name);
    this.type = 'pdf';
    this.pages = [];
  }

  open() {
    console.log(`Opening PDF document: ${this.name}`);
    return this;
  }

  save() {
    console.log(`Saving PDF document: ${this.name} (${this.pages.length} pages)`);
    return { success: true, type: 'pdf', name: this.name };
  }

  addPage(content) {
    this.pages.push(content);
  }

  export() {
    console.log(`Exporting PDF: ${this.name}`);
    return { format: 'pdf', data: this.pages };
  }
}

class WordDocument extends Document {
  constructor(name) {
    super(name);
    this.type = 'docx';
    this.paragraphs = [];
    this.styles = {};
  }

  open() {
    console.log(`Opening Word document: ${this.name}`);
    return this;
  }

  save() {
    console.log(`Saving Word document: ${this.name}`);
    return { success: true, type: 'docx', name: this.name };
  }

  addParagraph(text, style = 'normal') {
    this.paragraphs.push({ text, style });
  }

  applyStyle(styleName, styleConfig) {
    this.styles[styleName] = styleConfig;
  }
}

class SpreadsheetDocument extends Document {
  constructor(name) {
    super(name);
    this.type = 'xlsx';
    this.sheets = [{ name: 'Sheet1', data: [] }];
  }

  open() {
    console.log(`Opening Spreadsheet: ${this.name}`);
    return this;
  }

  save() {
    console.log(`Saving Spreadsheet: ${this.name} (${this.sheets.length} sheets)`);
    return { success: true, type: 'xlsx', name: this.name };
  }

  addSheet(name) {
    this.sheets.push({ name, data: [] });
  }

  setCell(sheetIndex, row, col, value) {
    if (!this.sheets[sheetIndex].data[row]) {
      this.sheets[sheetIndex].data[row] = [];
    }
    this.sheets[sheetIndex].data[row][col] = value;
  }
}

// 抽象工厂（Creator）
class Application {
  constructor() {
    this.documents = [];
  }

  // 工厂方法 - 由子类实现
  createDocument(name) {
    throw new Error('createDocument() must be implemented');
  }

  // 模板方法 - 使用工厂方法
  newDocument(name) {
    const doc = this.createDocument(name);
    doc.open();
    this.documents.push(doc);
    return doc;
  }

  openDocument(name) {
    const doc = this.createDocument(name);
    doc.open();
    this.documents.push(doc);
    return doc;
  }

  saveAll() {
    console.log(`Saving ${this.documents.length} documents...`);
    return this.documents.map(doc => doc.save());
  }

  closeAll() {
    this.documents.forEach(doc => doc.close());
    this.documents = [];
  }
}

// 具体工厂
class PDFApplication extends Application {
  createDocument(name) {
    return new PDFDocument(name);
  }
}

class WordApplication extends Application {
  createDocument(name) {
    return new WordDocument(name);
  }
}

class SpreadsheetApplication extends Application {
  createDocument(name) {
    return new SpreadsheetDocument(name);
  }
}

// 多态工厂 - 根据文件扩展名选择正确的应用
class DocumentApplicationFactory {
  static #applications = {
    '.pdf': PDFApplication,
    '.docx': WordApplication,
    '.doc': WordApplication,
    '.xlsx': SpreadsheetApplication,
    '.xls': SpreadsheetApplication
  };

  static getApplication(filename) {
    const ext = filename.substring(filename.lastIndexOf('.'));
    const AppClass = this.#applications[ext.toLowerCase()];

    if (!AppClass) {
      throw new Error(`No application available for: ${ext}`);
    }

    return new AppClass();
  }
}

// 使用示例
console.log('\n=== 工厂方法模式示例 ===\n');

// 使用 PDF 应用
const pdfApp = new PDFApplication();
const pdfDoc = pdfApp.newDocument('Report.pdf');
pdfDoc.addPage('Page 1 content');
pdfDoc.addPage('Page 2 content');
pdfDoc.save();

// 使用 Word 应用
const wordApp = new WordApplication();
const wordDoc = wordApp.newDocument('Letter.docx');
wordDoc.addParagraph('Dear Sir/Madam,', 'greeting');
wordDoc.addParagraph('This is the body of the letter.', 'body');
wordDoc.save();

// 使用多态工厂
console.log('\n--- 使用多态工厂 ---');
const app1 = DocumentApplicationFactory.getApplication('invoice.pdf');
const app2 = DocumentApplicationFactory.getApplication('budget.xlsx');

const invoice = app1.newDocument('invoice.pdf');
const budget = app2.newDocument('budget.xlsx');

budget.addSheet('Q1');
budget.setCell(0, 0, 0, 'Revenue');
budget.setCell(0, 0, 1, 100000);

app1.saveAll();
app2.saveAll();
```

### 抽象工厂模式

```javascript
// ========================
// 抽象工厂模式完整示例
// ========================

// 抽象产品：按钮
class Button {
  render() { throw new Error('render() must be implemented'); }
  onClick(handler) { throw new Error('onClick() must be implemented'); }
}

// 抽象产品：输入框
class Input {
  render() { throw new Error('render() must be implemented'); }
  getValue() { throw new Error('getValue() must be implemented'); }
  setValue(value) { throw new Error('setValue() must be implemented'); }
}

// 抽象产品：对话框
class Dialog {
  render() { throw new Error('render() must be implemented'); }
  show() { throw new Error('show() must be implemented'); }
  hide() { throw new Error('hide() must be implemented'); }
}

// 抽象产品：主题
class Theme {
  getColors() { throw new Error('getColors() must be implemented'); }
  getFonts() { throw new Error('getFonts() must be implemented'); }
}

// ========== Material Design 产品族 ==========

class MaterialButton extends Button {
  constructor() {
    super();
    this.rippleEffect = true;
    this.elevation = 2;
  }

  render() {
    return `<button class="mdc-button mdc-button--raised" style="box-shadow: 0 ${this.elevation}px 4px rgba(0,0,0,0.2)">
      <span class="mdc-button__ripple"></span>
      <span class="mdc-button__label">Material Button</span>
    </button>`;
  }

  onClick(handler) {
    console.log('Material Button: Adding click handler with ripple effect');
    return { handler, ripple: this.rippleEffect };
  }
}

class MaterialInput extends Input {
  constructor() {
    super();
    this.value = '';
    this.outlined = true;
  }

  render() {
    return `<div class="mdc-text-field mdc-text-field--outlined">
      <input type="text" class="mdc-text-field__input" />
      <div class="mdc-notched-outline">
        <div class="mdc-notched-outline__leading"></div>
        <div class="mdc-notched-outline__notch">
          <label class="mdc-floating-label">Label</label>
        </div>
        <div class="mdc-notched-outline__trailing"></div>
      </div>
    </div>`;
  }

  getValue() { return this.value; }
  setValue(value) { this.value = value; }
}

class MaterialDialog extends Dialog {
  constructor() {
    super();
    this.open = false;
  }

  render() {
    return `<div class="mdc-dialog">
      <div class="mdc-dialog__container">
        <div class="mdc-dialog__surface">
          <h2 class="mdc-dialog__title">Material Dialog</h2>
          <div class="mdc-dialog__content"></div>
          <div class="mdc-dialog__actions"></div>
        </div>
      </div>
      <div class="mdc-dialog__scrim"></div>
    </div>`;
  }

  show() {
    this.open = true;
    console.log('Material Dialog: Opening with fade animation');
  }

  hide() {
    this.open = false;
    console.log('Material Dialog: Closing with fade animation');
  }
}

class MaterialTheme extends Theme {
  getColors() {
    return {
      primary: '#6200EE',
      secondary: '#03DAC6',
      background: '#FFFFFF',
      surface: '#FFFFFF',
      error: '#B00020',
      onPrimary: '#FFFFFF',
      onSecondary: '#000000'
    };
  }

  getFonts() {
    return {
      fontFamily: 'Roboto, sans-serif',
      h1: '96px',
      h2: '60px',
      body1: '16px',
      button: '14px'
    };
  }
}

// ========== iOS 产品族 ==========

class IOSButton extends Button {
  constructor() {
    super();
    this.style = 'filled';
  }

  render() {
    return `<button class="ios-button ios-button--${this.style}" style="border-radius: 10px; padding: 12px 24px;">
      iOS Button
    </button>`;
  }

  onClick(handler) {
    console.log('iOS Button: Adding click handler with haptic feedback');
    return { handler, haptic: true };
  }
}

class IOSInput extends Input {
  constructor() {
    super();
    this.value = '';
  }

  render() {
    return `<div class="ios-text-field" style="border-radius: 10px; border: 1px solid #C6C6C8; padding: 12px;">
      <input type="text" placeholder="Placeholder" />
    </div>`;
  }

  getValue() { return this.value; }
  setValue(value) { this.value = value; }
}

class IOSDialog extends Dialog {
  constructor() {
    super();
    this.open = false;
  }

  render() {
    return `<div class="ios-alert" style="border-radius: 14px; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px);">
      <div class="ios-alert__title">Alert</div>
      <div class="ios-alert__message"></div>
      <div class="ios-alert__actions"></div>
    </div>`;
  }

  show() {
    this.open = true;
    console.log('iOS Dialog: Opening with scale animation');
  }

  hide() {
    this.open = false;
    console.log('iOS Dialog: Closing with scale animation');
  }
}

class IOSTheme extends Theme {
  getColors() {
    return {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500'
    };
  }

  getFonts() {
    return {
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      largeTitle: '34px',
      title1: '28px',
      body: '17px',
      caption: '12px'
    };
  }
}

// ========== Windows Fluent 产品族 ==========

class FluentButton extends Button {
  constructor() {
    super();
    this.accentColor = '#0078D4';
  }

  render() {
    return `<button class="fluent-button" style="background: ${this.accentColor}; border-radius: 4px; padding: 8px 16px;">
      Fluent Button
    </button>`;
  }

  onClick(handler) {
    console.log('Fluent Button: Adding click handler with reveal effect');
    return { handler, reveal: true };
  }
}

class FluentInput extends Input {
  constructor() {
    super();
    this.value = '';
  }

  render() {
    return `<div class="fluent-text-field" style="border-bottom: 2px solid #0078D4;">
      <input type="text" style="border: none; padding: 8px;" />
    </div>`;
  }

  getValue() { return this.value; }
  setValue(value) { this.value = value; }
}

class FluentDialog extends Dialog {
  constructor() {
    super();
    this.open = false;
  }

  render() {
    return `<div class="fluent-dialog" style="background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border-radius: 8px;">
      <div class="fluent-dialog__header"></div>
      <div class="fluent-dialog__body"></div>
      <div class="fluent-dialog__footer"></div>
    </div>`;
  }

  show() {
    this.open = true;
    console.log('Fluent Dialog: Opening with slide animation');
  }

  hide() {
    this.open = false;
    console.log('Fluent Dialog: Closing with slide animation');
  }
}

class FluentTheme extends Theme {
  getColors() {
    return {
      primary: '#0078D4',
      secondary: '#2B88D8',
      background: '#F3F3F3',
      surface: '#FFFFFF',
      error: '#A80000',
      success: '#107C10'
    };
  }

  getFonts() {
    return {
      fontFamily: 'Segoe UI, sans-serif',
      display: '42px',
      title: '28px',
      body: '14px',
      caption: '12px'
    };
  }
}

// ========== 抽象工厂 ==========

class UIFactory {
  createButton() { throw new Error('createButton() must be implemented'); }
  createInput() { throw new Error('createInput() must be implemented'); }
  createDialog() { throw new Error('createDialog() must be implemented'); }
  createTheme() { throw new Error('createTheme() must be implemented'); }
}

// 具体工厂
class MaterialUIFactory extends UIFactory {
  createButton() { return new MaterialButton(); }
  createInput() { return new MaterialInput(); }
  createDialog() { return new MaterialDialog(); }
  createTheme() { return new MaterialTheme(); }
}

class IOSUIFactory extends UIFactory {
  createButton() { return new IOSButton(); }
  createInput() { return new IOSInput(); }
  createDialog() { return new IOSDialog(); }
  createTheme() { return new IOSTheme(); }
}

class FluentUIFactory extends UIFactory {
  createButton() { return new FluentButton(); }
  createInput() { return new FluentInput(); }
  createDialog() { return new FluentDialog(); }
  createTheme() { return new FluentTheme(); }
}

// 工厂选择器
class UIFactoryProvider {
  static #factories = {
    material: MaterialUIFactory,
    ios: IOSUIFactory,
    fluent: FluentUIFactory,
    windows: FluentUIFactory,
    android: MaterialUIFactory,
    macos: IOSUIFactory
  };

  static getFactory(platform) {
    const FactoryClass = this.#factories[platform.toLowerCase()];

    if (!FactoryClass) {
      console.warn(`Unknown platform: ${platform}, falling back to Material`);
      return new MaterialUIFactory();
    }

    return new FactoryClass();
  }

  static detectPlatformFactory() {
    // 在浏览器环境中检测平台
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('mac')) {
        return new IOSUIFactory();
      }
      if (ua.includes('windows')) {
        return new FluentUIFactory();
      }
    }
    return new MaterialUIFactory();
  }
}

// 客户端代码 - 完全解耦于具体实现
class LoginForm {
  constructor(uiFactory) {
    this.factory = uiFactory;
    this.theme = uiFactory.createTheme();
    this.components = {};
  }

  render() {
    const usernameInput = this.factory.createInput();
    const passwordInput = this.factory.createInput();
    const loginButton = this.factory.createButton();
    const errorDialog = this.factory.createDialog();

    this.components = { usernameInput, passwordInput, loginButton, errorDialog };

    console.log('\n--- Rendering Login Form ---');
    console.log('Theme Colors:', this.theme.getColors());
    console.log('Theme Fonts:', this.theme.getFonts());
    console.log('\nUsername Input:', usernameInput.render());
    console.log('Password Input:', passwordInput.render());
    console.log('Login Button:', loginButton.render());
    console.log('Error Dialog:', errorDialog.render());

    return this.components;
  }

  handleLogin() {
    const { loginButton, errorDialog } = this.components;
    loginButton.onClick(() => {
      console.log('Processing login...');
      // 模拟登录失败
      errorDialog.show();
    });
  }
}

// 使用示例
console.log('\n=== 抽象工厂模式示例 ===\n');

// 使用不同的 UI 工厂创建登录表单
console.log('>>> Material Design UI <<<');
const materialFactory = UIFactoryProvider.getFactory('android');
const materialLogin = new LoginForm(materialFactory);
materialLogin.render();

console.log('\n>>> iOS UI <<<');
const iosFactory = UIFactoryProvider.getFactory('ios');
const iosLogin = new LoginForm(iosFactory);
iosLogin.render();

console.log('\n>>> Windows Fluent UI <<<');
const fluentFactory = UIFactoryProvider.getFactory('windows');
const fluentLogin = new LoginForm(fluentFactory);
fluentLogin.render();
```

### 函数式工厂模式

```javascript
// ========================
// 函数式工厂模式
// ========================

// 使用函数和组合实现工厂模式
const createLogger = (config = {}) => {
  const {
    prefix = '',
    level = 'info',
    timestamp = true,
    colorize = true
  } = config;

  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const colors = {
    debug: '\x1b[36m',  // cyan
    info: '\x1b[32m',   // green
    warn: '\x1b[33m',   // yellow
    error: '\x1b[31m',  // red
    reset: '\x1b[0m'
  };

  const formatMessage = (logLevel, message) => {
    const parts = [];
    if (timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    if (prefix) {
      parts.push(`[${prefix}]`);
    }
    parts.push(`[${logLevel.toUpperCase()}]`);
    parts.push(message);

    let formatted = parts.join(' ');

    if (colorize && colors[logLevel]) {
      formatted = `${colors[logLevel]}${formatted}${colors.reset}`;
    }

    return formatted;
  };

  const shouldLog = (logLevel) => levels[logLevel] >= levels[level];

  return {
    debug(message) {
      if (shouldLog('debug')) {
        console.log(formatMessage('debug', message));
      }
    },
    info(message) {
      if (shouldLog('info')) {
        console.log(formatMessage('info', message));
      }
    },
    warn(message) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', message));
      }
    },
    error(message) {
      if (shouldLog('error')) {
        console.error(formatMessage('error', message));
      }
    },
    child(childConfig) {
      return createLogger({
        ...config,
        ...childConfig,
        prefix: prefix ? `${prefix}:${childConfig.prefix || ''}` : childConfig.prefix
      });
    }
  };
};

// HTTP 客户端工厂
const createHttpClient = (baseConfig = {}) => {
  const {
    baseURL = '',
    timeout = 5000,
    headers = {},
    interceptors = {}
  } = baseConfig;

  const applyInterceptors = async (type, data) => {
    const interceptorList = interceptors[type] || [];
    let result = data;
    for (const interceptor of interceptorList) {
      result = await interceptor(result);
    }
    return result;
  };

  const request = async (method, url, options = {}) => {
    const fullURL = `${baseURL}${url}`;
    const requestConfig = {
      method,
      url: fullURL,
      headers: { ...headers, ...options.headers },
      timeout: options.timeout || timeout,
      body: options.body
    };

    // 应用请求拦截器
    const interceptedConfig = await applyInterceptors('request', requestConfig);

    console.log(`[HTTP] ${method.toUpperCase()} ${fullURL}`);

    // 模拟 HTTP 请求
    const response = {
      status: 200,
      data: { message: 'Success' },
      headers: {},
      config: interceptedConfig
    };

    // 应用响应拦截器
    return applyInterceptors('response', response);
  };

  return {
    get: (url, options) => request('GET', url, options),
    post: (url, body, options) => request('POST', url, { ...options, body }),
    put: (url, body, options) => request('PUT', url, { ...options, body }),
    delete: (url, options) => request('DELETE', url, options),
    patch: (url, body, options) => request('PATCH', url, { ...options, body }),

    // 创建子实例
    create(config) {
      return createHttpClient({
        ...baseConfig,
        ...config,
        headers: { ...headers, ...config.headers }
      });
    }
  };
};

// 验证器工厂
const createValidator = (rules) => {
  const validators = {
    required: (value) => ({
      valid: value !== null && value !== undefined && value !== '',
      message: 'This field is required'
    }),

    email: (value) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Invalid email format'
    }),

    minLength: (min) => (value) => ({
      valid: String(value).length >= min,
      message: `Minimum ${min} characters required`
    }),

    maxLength: (max) => (value) => ({
      valid: String(value).length <= max,
      message: `Maximum ${max} characters allowed`
    }),

    pattern: (regex, message) => (value) => ({
      valid: regex.test(value),
      message: message || 'Invalid format'
    }),

    range: (min, max) => (value) => ({
      valid: Number(value) >= min && Number(value) <= max,
      message: `Value must be between ${min} and ${max}`
    }),

    custom: (fn, message) => (value) => ({
      valid: fn(value),
      message
    })
  };

  const parseRule = (rule) => {
    if (typeof rule === 'function') {
      return rule;
    }
    if (typeof rule === 'string') {
      return validators[rule];
    }
    if (Array.isArray(rule)) {
      const [name, ...args] = rule;
      return validators[name](...args);
    }
    return () => ({ valid: true });
  };

  return {
    validate(data) {
      const errors = {};
      let isValid = true;

      for (const [field, fieldRules] of Object.entries(rules)) {
        const value = data[field];
        const fieldErrors = [];

        for (const rule of fieldRules) {
          const validator = parseRule(rule);
          const result = validator(value);

          if (!result.valid) {
            fieldErrors.push(result.message);
            isValid = false;
          }
        }

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
        }
      }

      return { isValid, errors, data };
    },

    // 扩展验证器
    extend(name, validatorFn) {
      validators[name] = validatorFn;
      return this;
    }
  };
};

// 使用示例
console.log('\n=== 函数式工厂模式示例 ===\n');

// Logger 工厂
const appLogger = createLogger({ prefix: 'App', level: 'debug' });
const dbLogger = appLogger.child({ prefix: 'DB' });

appLogger.info('Application started');
appLogger.debug('Debug mode enabled');
dbLogger.info('Database connected');

// HTTP 客户端工厂
const apiClient = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: { 'Content-Type': 'application/json' }
});

const authClient = apiClient.create({
  headers: { 'Authorization': 'Bearer token123' }
});

apiClient.get('/users');
authClient.post('/protected/data', { key: 'value' });

// 验证器工厂
const userValidator = createValidator({
  username: ['required', ['minLength', 3], ['maxLength', 20]],
  email: ['required', 'email'],
  age: [['range', 18, 120]],
  password: [
    'required',
    ['minLength', 8],
    ['pattern', /[A-Z]/, 'Must contain uppercase letter'],
    ['pattern', /[0-9]/, 'Must contain number']
  ]
});

const result = userValidator.validate({
  username: 'jo',
  email: 'invalid',
  age: 15,
  password: 'weak'
});

console.log('\nValidation result:', result);
```

---

## 最佳实践

### 使用注册表模式增强灵活性

```javascript
// 使用注册表使工厂更具扩展性
class ExtensibleFactory {
  static #registry = new Map();
  static #defaultType = null;

  // 注册新类型
  static register(type, creator, options = {}) {
    if (typeof creator !== 'function') {
      throw new Error('Creator must be a function or class');
    }

    this.#registry.set(type, {
      creator,
      ...options
    });

    if (options.default) {
      this.#defaultType = type;
    }
  }

  // 批量注册
  static registerAll(registrations) {
    for (const [type, creator, options] of registrations) {
      this.register(type, creator, options);
    }
  }

  // 取消注册
  static unregister(type) {
    this.#registry.delete(type);
  }

  // 创建实例
  static create(type, ...args) {
    let registration = this.#registry.get(type);

    if (!registration && this.#defaultType) {
      console.warn(`Type "${type}" not found, using default`);
      registration = this.#registry.get(this.#defaultType);
    }

    if (!registration) {
      throw new Error(`Unknown type: ${type}`);
    }

    const { creator } = registration;

    // 支持类和工厂函数
    if (creator.prototype && creator.prototype.constructor === creator) {
      return new creator(...args);
    }
    return creator(...args);
  }

  // 检查类型是否存在
  static has(type) {
    return this.#registry.has(type);
  }

  // 获取所有类型
  static getTypes() {
    return [...this.#registry.keys()];
  }
}
```

### 使用依赖注入配合工厂

```javascript
// 依赖注入容器配合工厂模式
class Container {
  #factories = new Map();
  #singletons = new Map();

  // 注册工厂
  register(name, factory, options = {}) {
    this.#factories.set(name, {
      factory,
      singleton: options.singleton || false
    });
  }

  // 解析依赖
  resolve(name) {
    const registration = this.#factories.get(name);

    if (!registration) {
      throw new Error(`Dependency "${name}" not registered`);
    }

    const { factory, singleton } = registration;

    if (singleton) {
      if (!this.#singletons.has(name)) {
        this.#singletons.set(name, factory(this));
      }
      return this.#singletons.get(name);
    }

    return factory(this);
  }
}

// 使用示例
const container = new Container();

container.register('config', () => ({
  apiUrl: 'https://api.example.com',
  timeout: 5000
}), { singleton: true });

container.register('httpClient', (c) => {
  const config = c.resolve('config');
  return createHttpClient({ baseURL: config.apiUrl });
});

container.register('userService', (c) => {
  const http = c.resolve('httpClient');
  return {
    getUser: (id) => http.get(`/users/${id}`),
    createUser: (data) => http.post('/users', data)
  };
});

const userService = container.resolve('userService');
```

### 实现工厂的延迟加载

```javascript
// 延迟加载工厂
class LazyFactory {
  #loaders = new Map();
  #instances = new Map();

  register(type, loader) {
    this.#loaders.set(type, loader);
  }

  async create(type, ...args) {
    if (!this.#loaders.has(type)) {
      throw new Error(`Unknown type: ${type}`);
    }

    // 缓存已加载的模块
    if (!this.#instances.has(type)) {
      const loader = this.#loaders.get(type);
      const module = await loader();
      this.#instances.set(type, module.default || module);
    }

    const Creator = this.#instances.get(type);
    return new Creator(...args);
  }
}

// 使用示例
const factory = new LazyFactory();

// 注册延迟加载器
factory.register('heavy', () => import('./HeavyComponent.js'));
factory.register('chart', () => import('./ChartLibrary.js'));

// 只有在需要时才加载
const component = await factory.create('heavy', { data: [] });
```

### 工厂与构建器结合

```javascript
// 工厂 + 构建器模式组合
class RequestBuilder {
  #config = {
    method: 'GET',
    headers: {},
    body: null,
    timeout: 5000
  };

  method(m) {
    this.#config.method = m;
    return this;
  }

  header(key, value) {
    this.#config.headers[key] = value;
    return this;
  }

  body(data) {
    this.#config.body = data;
    return this;
  }

  timeout(ms) {
    this.#config.timeout = ms;
    return this;
  }

  build() {
    return { ...this.#config };
  }
}

class RequestFactory {
  static createBuilder() {
    return new RequestBuilder();
  }

  static createGet(url) {
    return this.createBuilder()
      .method('GET')
      .build();
  }

  static createPost(url, body) {
    return this.createBuilder()
      .method('POST')
      .header('Content-Type', 'application/json')
      .body(body)
      .build();
  }

  static createAuthenticatedRequest(token) {
    return this.createBuilder()
      .header('Authorization', `Bearer ${token}`);
  }
}

// 使用
const request = RequestFactory
  .createAuthenticatedRequest('token123')
  .method('POST')
  .body({ data: 'test' })
  .build();
```

---

## 常见陷阱

### 过度使用工厂模式

```javascript
// 反模式：简单场景过度使用工厂
class PointFactory {
  static create(x, y) {
    return new Point(x, y);
  }
}

// 直接使用构造函数更简洁
const point = new Point(10, 20);

// 正确使用：当创建逻辑确实复杂时
class ConnectionFactory {
  static create(config) {
    // 复杂的初始化逻辑
    const connection = new Connection();
    connection.setRetryPolicy(config.retries);
    connection.setPoolSize(config.poolSize);
    connection.setTLS(config.tls);
    connection.validate();
    return connection;
  }
}
```

### 工厂方法中的 switch 膨胀

```javascript
// 反模式：巨大的 switch 语句
class BadFactory {
  static create(type) {
    switch (type) {
      case 'a': return new A();
      case 'b': return new B();
      case 'c': return new C();
      // ... 几十个 case
      default: throw new Error('Unknown');
    }
  }
}

// 推荐：使用注册表
class BetterFactory {
  static #registry = new Map();

  static register(type, creator) {
    this.#registry.set(type, creator);
  }

  static create(type, ...args) {
    const creator = this.#registry.get(type);
    if (!creator) throw new Error(`Unknown: ${type}`);
    return new creator(...args);
  }
}
```

### 忽略错误处理

```javascript
// 反模式：没有适当的错误处理
class UnsafeFactory {
  static create(type) {
    return new this.types[type](); // 可能抛出无法理解的错误
  }
}

// 推荐：提供清晰的错误信息
class SafeFactory {
  static #types = new Map();

  static create(type, ...args) {
    if (!this.#types.has(type)) {
      const available = [...this.#types.keys()].join(', ');
      throw new Error(
        `Unknown type: "${type}". Available types: ${available}`
      );
    }

    try {
      const Creator = this.#types.get(type);
      return new Creator(...args);
    } catch (error) {
      throw new Error(
        `Failed to create instance of "${type}": ${error.message}`
      );
    }
  }
}
```

### 违反单一职责原则

```javascript
// 反模式：工厂做太多事情
class OverloadedFactory {
  static create(type, data) {
    const instance = new types[type](data);

    // 工厂不应该做这些
    instance.validate();
    instance.save();
    instance.notify();

    return instance;
  }
}

// 推荐：工厂只负责创建
class FocusedFactory {
  static create(type, data) {
    return new types[type](data);
  }
}

// 其他逻辑在服务层处理
class UserService {
  constructor(factory, validator, repository) {
    this.factory = factory;
    this.validator = validator;
    this.repository = repository;
  }

  async createUser(data) {
    const user = this.factory.create('user', data);
    await this.validator.validate(user);
    await this.repository.save(user);
    return user;
  }
}
```

---

## 性能考量

### 对象创建开销

```javascript
// 高频创建场景下的优化

// 1. 对象池模式
class ObjectPool {
  #pool = [];
  #factory;
  #maxSize;

  constructor(factory, maxSize = 100) {
    this.#factory = factory;
    this.#maxSize = maxSize;
  }

  acquire(...args) {
    if (this.#pool.length > 0) {
      const obj = this.#pool.pop();
      obj.reset(...args); // 重置对象状态
      return obj;
    }
    return this.#factory(...args);
  }

  release(obj) {
    if (this.#pool.length < this.#maxSize) {
      this.#pool.push(obj);
    }
  }

  get size() {
    return this.#pool.length;
  }
}

// 2. 惰性初始化
class LazyInitFactory {
  static #instance = null;

  static getInstance() {
    if (!this.#instance) {
      this.#instance = this.#createExpensiveObject();
    }
    return this.#instance;
  }

  static #createExpensiveObject() {
    console.log('Creating expensive object...');
    return { /* 复杂对象 */ };
  }
}

// 3. 缓存工厂结果
class CachedFactory {
  static #cache = new Map();

  static create(type, config) {
    const key = `${type}:${JSON.stringify(config)}`;

    if (!this.#cache.has(key)) {
      this.#cache.set(key, this.#doCreate(type, config));
    }

    return this.#cache.get(key);
  }

  static #doCreate(type, config) {
    // 创建逻辑
  }

  static clearCache() {
    this.#cache.clear();
  }
}
```

### 内存考量

```javascript
// 使用 WeakMap 避免内存泄漏
class FactoryWithWeakCache {
  static #cache = new WeakMap();

  static create(context, type) {
    if (!this.#cache.has(context)) {
      this.#cache.set(context, new Map());
    }

    const contextCache = this.#cache.get(context);

    if (!contextCache.has(type)) {
      contextCache.set(type, this.#doCreate(type));
    }

    return contextCache.get(type);
  }

  static #doCreate(type) {
    // 创建逻辑
  }
}

// 当 context 被垃圾回收时，相关缓存也会被回收
```

---

## 实战场景

### 场景一：插件系统

```javascript
// 插件工厂系统
class PluginFactory {
  static #plugins = new Map();
  static #hooks = new Map();

  static register(name, PluginClass, options = {}) {
    this.#plugins.set(name, {
      Plugin: PluginClass,
      options,
      instance: null
    });
  }

  static async load(name, config = {}) {
    const registration = this.#plugins.get(name);

    if (!registration) {
      throw new Error(`Plugin "${name}" not found`);
    }

    if (registration.options.singleton && registration.instance) {
      return registration.instance;
    }

    const { Plugin } = registration;
    const instance = new Plugin(config);

    // 生命周期钩子
    await this.#runHooks('beforeInit', instance);
    await instance.init?.();
    await this.#runHooks('afterInit', instance);

    if (registration.options.singleton) {
      registration.instance = instance;
    }

    return instance;
  }

  static addHook(event, callback) {
    if (!this.#hooks.has(event)) {
      this.#hooks.set(event, []);
    }
    this.#hooks.get(event).push(callback);
  }

  static async #runHooks(event, ...args) {
    const hooks = this.#hooks.get(event) || [];
    for (const hook of hooks) {
      await hook(...args);
    }
  }
}

// 定义插件
class LoggerPlugin {
  constructor(config) {
    this.level = config.level || 'info';
  }

  async init() {
    console.log(`Logger plugin initialized with level: ${this.level}`);
  }

  log(message) {
    console.log(`[${this.level}] ${message}`);
  }
}

class AnalyticsPlugin {
  constructor(config) {
    this.trackingId = config.trackingId;
  }

  async init() {
    console.log(`Analytics initialized with ID: ${this.trackingId}`);
  }

  track(event, data) {
    console.log(`Tracking: ${event}`, data);
  }
}

// 注册插件
PluginFactory.register('logger', LoggerPlugin, { singleton: true });
PluginFactory.register('analytics', AnalyticsPlugin);

// 添加生命周期钩子
PluginFactory.addHook('afterInit', (plugin) => {
  console.log(`Plugin initialized: ${plugin.constructor.name}`);
});

// 使用
async function initApp() {
  const logger = await PluginFactory.load('logger', { level: 'debug' });
  const analytics = await PluginFactory.load('analytics', { trackingId: 'UA-123' });

  logger.log('Application started');
  analytics.track('pageview', { path: '/' });
}

initApp();
```

### 场景二：API 响应处理器

```javascript
// API 响应处理器工厂
class ResponseHandlerFactory {
  static #handlers = new Map();

  static register(contentType, handler) {
    this.#handlers.set(contentType, handler);
  }

  static getHandler(contentType) {
    // 精确匹配
    if (this.#handlers.has(contentType)) {
      return this.#handlers.get(contentType);
    }

    // 模糊匹配
    for (const [type, handler] of this.#handlers) {
      if (contentType.includes(type)) {
        return handler;
      }
    }

    // 默认处理器
    return this.#handlers.get('default');
  }
}

// 注册处理器
ResponseHandlerFactory.register('application/json', {
  parse: (data) => JSON.parse(data),
  serialize: (data) => JSON.stringify(data)
});

ResponseHandlerFactory.register('text/html', {
  parse: (data) => {
    const parser = new DOMParser();
    return parser.parseFromString(data, 'text/html');
  },
  serialize: (doc) => doc.documentElement.outerHTML
});

ResponseHandlerFactory.register('text/plain', {
  parse: (data) => data,
  serialize: (data) => String(data)
});

ResponseHandlerFactory.register('application/xml', {
  parse: (data) => {
    const parser = new DOMParser();
    return parser.parseFromString(data, 'application/xml');
  },
  serialize: (doc) => new XMLSerializer().serializeToString(doc)
});

ResponseHandlerFactory.register('default', {
  parse: (data) => data,
  serialize: (data) => data
});

// 使用
async function fetchAndParse(url) {
  const response = await fetch(url);
  const contentType = response.headers.get('content-type');
  const handler = ResponseHandlerFactory.getHandler(contentType);
  const text = await response.text();
  return handler.parse(text);
}
```

### 场景三：数据库连接工厂

```javascript
// 数据库连接工厂
class DatabaseConnectionFactory {
  static #drivers = new Map();
  static #pools = new Map();

  static registerDriver(name, Driver) {
    this.#drivers.set(name, Driver);
  }

  static async createConnection(config) {
    const { driver, ...connectionConfig } = config;

    const Driver = this.#drivers.get(driver);
    if (!Driver) {
      throw new Error(`Unknown database driver: ${driver}`);
    }

    const connection = new Driver(connectionConfig);
    await connection.connect();
    return connection;
  }

  static async getPool(name, config) {
    if (!this.#pools.has(name)) {
      const pool = await this.#createPool(config);
      this.#pools.set(name, pool);
    }
    return this.#pools.get(name);
  }

  static async #createPool(config) {
    const { driver, poolSize = 10, ...connectionConfig } = config;
    const connections = [];

    for (let i = 0; i < poolSize; i++) {
      const conn = await this.createConnection({
        driver,
        ...connectionConfig
      });
      connections.push(conn);
    }

    return {
      connections,
      async acquire() {
        const available = this.connections.find(c => !c.inUse);
        if (available) {
          available.inUse = true;
          return available;
        }
        throw new Error('No available connections');
      },
      release(conn) {
        conn.inUse = false;
      },
      async close() {
        await Promise.all(this.connections.map(c => c.disconnect()));
      }
    };
  }
}

// 模拟数据库驱动
class PostgresDriver {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.inUse = false;
  }

  async connect() {
    console.log(`Connecting to PostgreSQL: ${this.config.host}`);
    this.connected = true;
  }

  async query(sql) {
    console.log(`[PostgreSQL] Executing: ${sql}`);
    return [];
  }

  async disconnect() {
    this.connected = false;
  }
}

class MySQLDriver {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.inUse = false;
  }

  async connect() {
    console.log(`Connecting to MySQL: ${this.config.host}`);
    this.connected = true;
  }

  async query(sql) {
    console.log(`[MySQL] Executing: ${sql}`);
    return [];
  }

  async disconnect() {
    this.connected = false;
  }
}

// 注册驱动
DatabaseConnectionFactory.registerDriver('postgres', PostgresDriver);
DatabaseConnectionFactory.registerDriver('mysql', MySQLDriver);

// 使用
async function main() {
  // 单个连接
  const pgConn = await DatabaseConnectionFactory.createConnection({
    driver: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'mydb'
  });

  await pgConn.query('SELECT * FROM users');

  // 连接池
  const pool = await DatabaseConnectionFactory.getPool('main', {
    driver: 'mysql',
    host: 'localhost',
    poolSize: 5
  });

  const conn = await pool.acquire();
  await conn.query('SELECT * FROM orders');
  pool.release(conn);
}

main();
```

---

## 面试要点

### 常见面试问题

**Q1: 简单工厂、工厂方法和抽象工厂有什么区别？**

```javascript
// 答案要点：

// 简单工厂：一个工厂创建所有产品，使用条件判断
class SimpleFactory {
  static create(type) {
    if (type === 'A') return new ProductA();
    if (type === 'B') return new ProductB();
  }
}

// 工厂方法：每个产品对应一个工厂，通过继承扩展
class Factory {
  create() { throw new Error('Abstract'); }
}
class FactoryA extends Factory {
  create() { return new ProductA(); }
}

// 抽象工厂：创建产品族，确保产品兼容性
class AbstractFactory {
  createButton() { throw new Error('Abstract'); }
  createInput() { throw new Error('Abstract'); }
}
class DarkThemeFactory extends AbstractFactory {
  createButton() { return new DarkButton(); }
  createInput() { return new DarkInput(); }
}
```

**Q2: 什么时候应该使用工厂模式？**

答案要点：
1. 对象创建逻辑复杂
2. 需要根据条件创建不同类型的对象
3. 需要解耦对象的创建和使用
4. 需要集中管理对象创建
5. 遵循开闭原则，易于扩展新产品类型

**Q3: 工厂模式如何遵循 SOLID 原则？**

```javascript
// S - 单一职责：工厂只负责创建对象
// O - 开闭原则：工厂方法通过继承扩展，不修改现有代码
// L - 里氏替换：产品类遵循相同接口，可互换
// I - 接口隔离：产品接口精简
// D - 依赖倒置：客户端依赖抽象工厂，不依赖具体实现
```

**Q4: 如何在 JavaScript 中实现抽象工厂？**

```javascript
// JavaScript 没有接口，可以用抛出错误模拟抽象方法
class AbstractFactory {
  createProduct() {
    throw new Error('Must implement createProduct()');
  }
}

// 或使用 Symbol 定义接口契约
const IFactory = {
  createProduct: Symbol('createProduct')
};

// 或使用 TypeScript
interface IFactory {
  createProduct(): IProduct;
}
```

**Q5: 工厂模式和构建器模式有什么区别？**

```javascript
// 工厂模式：一步创建对象
const car = CarFactory.create('sedan');

// 构建器模式：分步骤构建复杂对象
const car = new CarBuilder()
  .setEngine('v8')
  .setColor('red')
  .setSeats(4)
  .build();

// 可以结合使用
const builder = CarFactory.createBuilder('sedan');
const car = builder.setColor('blue').build();
```

---

## 延伸阅读

### 官方文档与规范

- [MDN - JavaScript Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [MDN - Object.create()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

### 经典书籍

- 《设计模式：可复用面向对象软件的基础》- GoF
- 《JavaScript 设计模式与开发实践》- 曾探
- 《Learning JavaScript Design Patterns》- Addy Osmani
- 《Head First 设计模式》

### 优质文章

- [Refactoring Guru - Factory Method](https://refactoring.guru/design-patterns/factory-method)
- [Refactoring Guru - Abstract Factory](https://refactoring.guru/design-patterns/abstract-factory)
- [patterns.dev - Factory Pattern](https://www.patterns.dev/posts/factory-pattern)

### 相关设计模式

- **单例模式**：工厂本身常实现为单例
- **建造者模式**：与工厂配合构建复杂对象
- **原型模式**：通过克隆创建对象
- **依赖注入**：与工厂配合管理依赖
