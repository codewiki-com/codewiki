---
title: DOM 操作
description: JavaScript DOM 操作完整指南，包括元素选择、事件处理和性能优化
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - DOM
  - 浏览器
  - 事件
status: imported
origin: old/src/content/docs/javascript/dom.zh.md
divergence: 0.219
issues: []
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 15
  lastUpdated: 2026-01-07
---

文档对象模型（DOM）是一个编程接口，将 HTML 和 XML 文档表示为树形结构。JavaScript 可以与这个树形结构交互，动态地读取、修改、添加或删除元素和内容。本指南涵盖了基本的 DOM 操作技术和实际示例。

## 理解 DOM 树

DOM 将 HTML 文档表示为节点的层次树。每个元素、属性和文本片段都成为这棵树中的一个节点。

### 节点类型

```javascript
// 常见节点类型
const element = document.createElement('div');
const text = document.createTextNode('Hello');
const comment = document.createComment('这是一个注释');

// 节点类型常量
console.log(Node.ELEMENT_NODE);   // 1
console.log(Node.TEXT_NODE);      // 3
console.log(Node.COMMENT_NODE);   // 8
console.log(Node.DOCUMENT_NODE);  // 9

// 检查节点类型
console.log(element.nodeType);     // 1
console.log(element.nodeName);     // 'DIV'
console.log(text.nodeType);        // 3
console.log(text.nodeValue);       // 'Hello'

// document 对象
console.log(document.nodeType);           // 9
console.log(document.documentElement);    // <html> 元素
console.log(document.head);               // <head> 元素
console.log(document.body);               // <body> 元素
```

### DOM 树结构

```html
<!-- 示例 HTML 结构 -->
<!DOCTYPE html>
<html>
  <head>
    <title>我的页面</title>
  </head>
  <body>
    <div id="container">
      <h1>欢迎</h1>
      <p class="intro">你好，世界！</p>
    </div>
  </body>
</html>
```

```javascript
// 可视化树结构
const container = document.getElementById('container');

// childNodes 包括文本节点（空白）
console.log(container.childNodes.length);  // 可能包含文本节点

// children 只包括元素节点
console.log(container.children.length);    // 2 (h1 和 p)

// 父级关系
const heading = document.querySelector('h1');
console.log(heading.parentElement);        // <div id="container">
console.log(heading.parentNode);           // <div id="container">
```

## 选择元素

JavaScript 提供了多种选择 DOM 元素的方法，每种方法都适用于不同的用例。

### getElementById

```javascript
// 通过唯一 ID 选择（最快的方法）
const header = document.getElementById('header');

// 找不到时返回 null
const notFound = document.getElementById('nonexistent');
console.log(notFound); // null

// ID 应该是唯一的 - 只返回第一个匹配
const element = document.getElementById('myId');
```

### getElementsByClassName

```javascript
// 返回实时 HTMLCollection
const items = document.getElementsByClassName('item');

console.log(items.length);      // 匹配元素的数量
console.log(items[0]);          // 第一个元素
console.log(items.item(0));     // 也是第一个元素

// 多个类（空格分隔）
const activeButtons = document.getElementsByClassName('btn active');

// 实时集合 - 自动更新
const container = document.getElementById('list');
console.log(items.length);  // 3

// 添加新元素会更新集合
const newItem = document.createElement('div');
newItem.className = 'item';
container.appendChild(newItem);
console.log(items.length);  // 4（自动更新）

// 转换为数组以使用数组方法
const itemsArray = Array.from(items);
itemsArray.forEach(item => console.log(item));

// 或使用展开运算符
const itemsArray2 = [...items];
```

### getElementsByTagName

```javascript
// 返回实时 HTMLCollection
const paragraphs = document.getElementsByTagName('p');
const divs = document.getElementsByTagName('div');

// 获取所有元素
const allElements = document.getElementsByTagName('*');

// 在元素内搜索
const container = document.getElementById('container');
const containerDivs = container.getElementsByTagName('div');

// 不区分大小写
const inputs = document.getElementsByTagName('INPUT');
```

### querySelector 和 querySelectorAll

```javascript
// querySelector - 返回第一个匹配（或 null）
const firstButton = document.querySelector('button');
const submitBtn = document.querySelector('#submit-btn');
const activeItem = document.querySelector('.item.active');
const dataAttr = document.querySelector('[data-id="123"]');

// 复杂选择器
const nestedLink = document.querySelector('nav ul li a.active');
const directChild = document.querySelector('div > p');
const sibling = document.querySelector('h1 + p');

// querySelectorAll - 返回静态 NodeList
const allButtons = document.querySelectorAll('button');
const allItems = document.querySelectorAll('.item');

// NodeList 直接支持 forEach
allItems.forEach(item => {
  console.log(item.textContent);
});

// 静态集合 - 不会自动更新
const items = document.querySelectorAll('.item');
console.log(items.length);  // 3

// 添加新元素不会更新静态 NodeList
const newItem = document.createElement('div');
newItem.className = 'item';
document.body.appendChild(newItem);
console.log(items.length);  // 仍然是 3（静态）

// 重新查询以获取更新的列表
const updatedItems = document.querySelectorAll('.item');
console.log(updatedItems.length);  // 4

// 伪选择器可用
const checked = document.querySelectorAll('input:checked');
const firstChild = document.querySelectorAll('li:first-child');
const nthChild = document.querySelectorAll('tr:nth-child(odd)');
const notDisabled = document.querySelectorAll('button:not(:disabled)');
```

### 特殊选择方法

```javascript
// 表单
const form = document.forms['loginForm'];
const formByIndex = document.forms[0];

// 表单元素
const username = form.elements['username'];
const allFormElements = form.elements;

// 图片
const images = document.images;

// 链接
const links = document.links;

// 带 name 属性的锚点
const anchors = document.anchors;

// 使用 name 属性
const namedElements = document.getElementsByName('email');
```

### 选择性能比较

```javascript
// 性能排名（从快到慢）：
// 1. getElementById - O(1) 哈希查找
// 2. getElementsByClassName - 快，实时集合
// 3. getElementsByTagName - 快，实时集合
// 4. querySelector - 解析选择器，返回第一个
// 5. querySelectorAll - 解析选择器，返回全部

// 对于重复使用缓存选择
// 不好 - 每次迭代都查询 DOM
const container = document.querySelector('.container');
for (let i = 0; i < 1000; i++) {
  document.querySelector('.container').style.opacity = i / 1000;
}

// 好 - 缓存选择
const cachedContainer = document.querySelector('.container');
for (let i = 0; i < 1000; i++) {
  cachedContainer.style.opacity = i / 1000;
}
```

## 遍历 DOM

使用父级、子级和兄弟关系在节点之间导航。

### 父级遍历

```javascript
const child = document.querySelector('.child');

// 直接父级
const parent = child.parentElement;
console.log(parent);

// parentNode vs parentElement
// 如果父级不是元素，parentElement 返回 null
console.log(document.documentElement.parentNode);    // #document
console.log(document.documentElement.parentElement); // null

// 查找匹配选择器的最近祖先
const closestDiv = child.closest('div');
const closestWithClass = child.closest('.container');
const closestById = child.closest('#main');

// closest() 包括元素本身
const container = document.querySelector('.container');
console.log(container.closest('.container') === container); // true

// 没有匹配时返回 null
const notFound = child.closest('.nonexistent');
console.log(notFound); // null
```

### 子级遍历

```javascript
const parent = document.querySelector('.parent');

// 所有子节点（包括文本、注释）
const allNodes = parent.childNodes;  // NodeList

// 只有元素子级
const elements = parent.children;    // HTMLCollection

// 第一个和最后一个
const firstChild = parent.firstElementChild;
const lastChild = parent.lastElementChild;

// 包括文本节点
const firstNode = parent.firstChild;  // 可能是文本节点
const lastNode = parent.lastChild;    // 可能是文本节点

// 检查是否有子级
console.log(parent.hasChildNodes());    // true/false
console.log(parent.childElementCount);  // 元素子级数量

// 遍历子级
for (const child of parent.children) {
  console.log(child.tagName);
}

// 使用 forEach 与 childNodes
parent.childNodes.forEach(node => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    console.log(node.tagName);
  }
});
```

### 兄弟遍历

```javascript
const middle = document.querySelector('.middle');

// 下一个兄弟元素
const next = middle.nextElementSibling;

// 上一个兄弟元素
const prev = middle.previousElementSibling;

// 包括文本节点
const nextNode = middle.nextSibling;
const prevNode = middle.previousSibling;

// 获取所有兄弟
function getSiblings(element) {
  const siblings = [];
  let sibling = element.parentElement.firstElementChild;

  while (sibling) {
    if (sibling !== element) {
      siblings.push(sibling);
    }
    sibling = sibling.nextElementSibling;
  }

  return siblings;
}

// 获取所有后续兄弟
function getNextSiblings(element) {
  const siblings = [];
  let sibling = element.nextElementSibling;

  while (sibling) {
    siblings.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  return siblings;
}
```

### 遍历工具

```javascript
// 遍历所有后代
function walkDOM(node, callback) {
  callback(node);

  node = node.firstElementChild;
  while (node) {
    walkDOM(node, callback);
    node = node.nextElementSibling;
  }
}

// 使用
walkDOM(document.body, element => {
  console.log(element.tagName);
});

// 查找所有祖先
function getAncestors(element) {
  const ancestors = [];

  while (element.parentElement) {
    ancestors.push(element.parentElement);
    element = element.parentElement;
  }

  return ancestors;
}

// 检查元素是否是后代
function isDescendant(parent, child) {
  return parent.contains(child);
}
```

## 创建和修改元素

创建新元素、修改现有元素并操作 DOM 结构。

### 创建元素

```javascript
// 创建元素
const div = document.createElement('div');
const span = document.createElement('span');
const button = document.createElement('button');

// 创建文本节点
const text = document.createTextNode('Hello, World!');

// 创建文档片段（用于批处理）
const fragment = document.createDocumentFragment();

// 创建带属性的元素
const input = document.createElement('input');
input.type = 'text';
input.name = 'username';
input.placeholder = '输入用户名';
input.className = 'form-input';

// 使用 DOM 方法创建复杂元素（更安全的方法）
const card = document.createElement('div');
card.className = 'card';

const title = document.createElement('h2');
title.className = 'card-title';
title.textContent = '标题';

const body = document.createElement('p');
body.className = 'card-body';
body.textContent = '内容在这里';

const btn = document.createElement('button');
btn.className = 'card-btn';
btn.textContent = '点击我';

card.appendChild(title);
card.appendChild(body);
card.appendChild(btn);
```

### 插入元素

```javascript
const container = document.querySelector('.container');
const newElement = document.createElement('div');
newElement.textContent = '新元素';

// 作为最后一个子级追加
container.appendChild(newElement);

// 现代 append（多个节点，接受字符串）
const anotherElement = document.createElement('span');
container.append(newElement, ' 一些文本', anotherElement);

// 作为第一个子级前置
container.prepend(newElement);

// 在特定元素之前插入
const reference = document.querySelector('.reference');
container.insertBefore(newElement, reference);

// 在之后插入（没有直接方法，使用 nextSibling）
container.insertBefore(newElement, reference.nextSibling);

// insertAdjacentElement - 精确定位
const target = document.querySelector('.target');

// 在元素之前
target.insertAdjacentElement('beforebegin', newElement);

// 作为第一个子级
target.insertAdjacentElement('afterbegin', newElement);

// 作为最后一个子级
target.insertAdjacentElement('beforeend', newElement);

// 在元素之后
target.insertAdjacentElement('afterend', newElement);

// insertAdjacentText - 安全插入文本
target.insertAdjacentText('beforeend', '纯文本内容');
```

### 安全使用 innerHTML

当需要插入 HTML 内容时，请注意安全考虑：

```javascript
const container = document.querySelector('.container');

// 安全警告：永远不要将 innerHTML 与不受信任的内容一起使用
// 不好 - 容易受到 XSS 攻击
// container.innerHTML = userProvidedContent;

// 安全 - 仅使用受信任的静态内容
const trustedStaticContent = '<strong>粗体</strong>文本';
container.innerHTML = trustedStaticContent;

// 更好的方法用于动态内容 - 使用 textContent
container.textContent = userInput;  // 安全，转义 HTML

// 对于需要 HTML 的用户内容，使用消毒库
// 使用 DOMPurify 的示例（推荐库）：
// container.innerHTML = DOMPurify.sanitize(userContent);

// 仅对受信任内容使用模板字面量
const name = 'World';  // 来自受信任源
container.innerHTML = `<span>Hello, ${name}!</span>`;
```

### 删除元素

```javascript
const element = document.querySelector('.remove-me');

// 现代 remove 方法
element.remove();

// 旧方法（通过父级）
element.parentNode.removeChild(element);

// 删除所有子级
const container = document.querySelector('.container');

// 方法 1：设置 textContent 为空
container.textContent = '';

// 方法 2：循环删除
while (container.firstChild) {
  container.removeChild(container.firstChild);
}

// 方法 3：replaceChildren（现代）
container.replaceChildren();

// 删除并返回元素
const removed = container.removeChild(container.firstChild);
console.log(removed); // 被删除的元素
```

### 替换元素

```javascript
const oldElement = document.querySelector('.old');
const newElement = document.createElement('div');
newElement.textContent = '新内容';

// 现代 replaceWith
oldElement.replaceWith(newElement);

// 旧方法
oldElement.parentNode.replaceChild(newElement, oldElement);

// 替换多个子级
const container = document.querySelector('.container');
const newChildren = [
  document.createElement('div'),
  document.createElement('span')
];
container.replaceChildren(...newChildren);
```

### 克隆元素

```javascript
const original = document.querySelector('.original');

// 浅克隆（仅元素，不包括子级）
const shallowClone = original.cloneNode(false);

// 深克隆（包括所有后代）
const deepClone = original.cloneNode(true);

// 克隆会移除 ID（如果需要应手动处理）
deepClone.id = 'cloned-element';

// 克隆并修改
const template = document.querySelector('.template');
const clone = template.cloneNode(true);
clone.querySelector('.title').textContent = '新标题';
clone.querySelector('.body').textContent = '新内容';
document.body.appendChild(clone);
```

### 修改内容

```javascript
const element = document.querySelector('.content');

// 文本内容（不解析 HTML，更安全）
element.textContent = '纯文本内容';
console.log(element.textContent); // 获取文本

// innerText（遵循 CSS，触发重排）
element.innerText = '仅可见文本';
console.log(element.innerText); // 返回可见文本

// textContent vs innerText
// textContent：更快，返回包括隐藏的所有文本
// innerText：更慢，仅返回可见文本

const hidden = document.createElement('div');
const visibleSpan = document.createElement('span');
visibleSpan.textContent = '可见 ';

const hiddenSpan = document.createElement('span');
hiddenSpan.style.display = 'none';
hiddenSpan.textContent = '隐藏';

hidden.appendChild(visibleSpan);
hidden.appendChild(hiddenSpan);
document.body.appendChild(hidden);

console.log(hidden.textContent); // '可见 隐藏'
console.log(hidden.innerText);   // '可见'
```

## 操作属性和类

操作元素属性、类和样式。

### 属性方法

```javascript
const element = document.querySelector('.my-element');

// 获取属性
const id = element.getAttribute('id');
const href = element.getAttribute('href');
const dataValue = element.getAttribute('data-value');

// 设置属性
element.setAttribute('id', 'new-id');
element.setAttribute('title', '提示文本');
element.setAttribute('data-id', '123');

// 检查属性是否存在
const hasId = element.hasAttribute('id');
const hasDisabled = element.hasAttribute('disabled');

// 删除属性
element.removeAttribute('title');
element.removeAttribute('disabled');

// 切换属性
element.toggleAttribute('disabled');        // 切换
element.toggleAttribute('hidden', true);    // 强制添加
element.toggleAttribute('hidden', false);   // 强制删除

// 获取所有属性
const attrs = element.attributes;
for (const attr of attrs) {
  console.log(`${attr.name}: ${attr.value}`);
}

// 直接属性访问（用于标准属性）
const input = document.querySelector('input');
input.value = '新值';
input.disabled = true;
input.checked = true;
console.log(input.type);
```

### Data 属性

```javascript
// HTML: <div id="user" data-user-id="123" data-role="admin">
const user = document.getElementById('user');

// 通过 dataset 访问
console.log(user.dataset.userId);  // '123'（驼峰命名）
console.log(user.dataset.role);    // 'admin'

// 设置 data 属性
user.dataset.status = 'active';    // 创建 data-status
user.dataset.lastLogin = '2024-01-15';  // data-last-login

// 删除 data 属性
delete user.dataset.status;

// 检查 data 属性
if ('userId' in user.dataset) {
  console.log('有用户 ID');
}

// 遍历所有 data 属性
for (const [key, value] of Object.entries(user.dataset)) {
  console.log(`${key}: ${value}`);
}

// 使用 getAttribute/setAttribute
user.setAttribute('data-custom', 'value');
console.log(user.getAttribute('data-custom'));
```

### 类操作

```javascript
const element = document.querySelector('.box');

// classList API
element.classList.add('active');
element.classList.add('highlight', 'visible');  // 多个类

element.classList.remove('inactive');
element.classList.remove('old', 'deprecated');  // 多个类

// 切换类
element.classList.toggle('active');              // 切换
element.classList.toggle('disabled', true);      // 强制添加
element.classList.toggle('disabled', false);     // 强制删除

// 检查类
const isActive = element.classList.contains('active');

// 替换类
element.classList.replace('old-class', 'new-class');

// 获取所有类
console.log(element.classList.length);
console.log(element.classList.item(0));   // 第一个类
console.log([...element.classList]);      // 类数组

// 遍历类
element.classList.forEach(className => {
  console.log(className);
});

// className 属性（完整字符串）
console.log(element.className);           // 'box active highlight'
element.className = 'new-class';          // 替换全部
element.className += ' another-class';    // 追加（注意空格）

// 条件类应用
function setActiveState(element, isActive) {
  element.classList.toggle('active', isActive);
  element.classList.toggle('inactive', !isActive);
}
```

### 样式操作

```javascript
const element = document.querySelector('.styled');

// 内联样式（驼峰命名）
element.style.backgroundColor = 'blue';
element.style.fontSize = '16px';
element.style.marginTop = '20px';
element.style.display = 'flex';

// CSS 自定义属性
element.style.setProperty('--main-color', 'red');
element.style.getPropertyValue('--main-color');
element.style.removeProperty('--main-color');

// 删除内联样式
element.style.backgroundColor = '';  // 删除属性
element.style.removeProperty('background-color');

// 设置多个样式
Object.assign(element.style, {
  color: 'white',
  padding: '10px',
  border: '1px solid black'
});

// 获取计算样式（CSS 级联后的最终样式）
const computed = window.getComputedStyle(element);
console.log(computed.backgroundColor);  // rgb(0, 0, 255)
console.log(computed.fontSize);         // '16px'
console.log(computed.getPropertyValue('margin-top'));

// 获取伪元素样式
const beforeStyles = window.getComputedStyle(element, '::before');
console.log(beforeStyles.content);

// 检查是否设置了内联样式
console.log(element.style.cssText);  // 所有内联样式

// 设置整个 style 属性
element.style.cssText = 'color: red; font-size: 20px;';
element.setAttribute('style', 'color: red; font-size: 20px;');
```

### 尺寸和位置

```javascript
const element = document.querySelector('.box');

// offset 尺寸（包括边框）
console.log(element.offsetWidth);   // 宽度 + 内边距 + 边框
console.log(element.offsetHeight);  // 高度 + 内边距 + 边框
console.log(element.offsetTop);     // 到偏移父级的距离
console.log(element.offsetLeft);    // 到偏移父级的距离
console.log(element.offsetParent);  // 最近的定位祖先

// client 尺寸（不包括滚动条）
console.log(element.clientWidth);   // 宽度 + 内边距（无边框/滚动条）
console.log(element.clientHeight);  // 高度 + 内边距
console.log(element.clientTop);     // 上边框宽度
console.log(element.clientLeft);    // 左边框宽度

// scroll 尺寸
console.log(element.scrollWidth);   // 完整可滚动宽度
console.log(element.scrollHeight);  // 完整可滚动高度
console.log(element.scrollTop);     // 从顶部滚动的距离
console.log(element.scrollLeft);    // 从左侧滚动的距离

// 设置滚动位置
element.scrollTop = 100;
element.scrollTo(0, 100);
element.scrollBy(0, 50);  // 相对滚动

// getBoundingClientRect（相对于视口）
const rect = element.getBoundingClientRect();
console.log(rect.top);      // 到视口顶部的距离
console.log(rect.left);     // 到视口左侧的距离
console.log(rect.bottom);   // 到视口顶部到元素底部的距离
console.log(rect.right);    // 到视口左侧到元素右侧的距离
console.log(rect.width);    // 元素宽度
console.log(rect.height);   // 元素高度
console.log(rect.x);        // 同 left
console.log(rect.y);        // 同 top

// 获取相对于文档的位置
function getDocumentPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}
```

## 事件处理

JavaScript 事件通过响应用户操作和浏览器事件来实现交互式 Web 应用程序。

### 添加事件监听器

```javascript
const button = document.querySelector('.btn');

// addEventListener（推荐）
button.addEventListener('click', function(event) {
  console.log('按钮被点击！');
  console.log(event.target);  // 被点击的元素
});

// 命名函数（允许移除）
function handleClick(event) {
  console.log('点击:', event.type);
}

button.addEventListener('click', handleClick);

// 箭头函数
button.addEventListener('click', (e) => {
  console.log('箭头函数处理器');
});

// 选项对象
button.addEventListener('click', handleClick, {
  once: true,      // 第一次调用后移除
  passive: true,   // 永不调用 preventDefault
  capture: true    // 使用捕获阶段
});

// 同一元素上的多个事件
button.addEventListener('mouseenter', () => console.log('鼠标进入'));
button.addEventListener('mouseleave', () => console.log('鼠标离开'));

// 同一处理器用于多个事件
['click', 'touchstart'].forEach(eventType => {
  button.addEventListener(eventType, handleClick);
});
```

### 移除事件监听器

```javascript
const button = document.querySelector('.btn');

function handleClick(event) {
  console.log('点击了！');
}

// 添加监听器
button.addEventListener('click', handleClick);

// 移除监听器（必须使用相同的函数引用）
button.removeEventListener('click', handleClick);

// 这不会工作（不同的函数引用）
button.addEventListener('click', function() { console.log('Hi'); });
button.removeEventListener('click', function() { console.log('Hi'); }); // 无效

// 使用 AbortController 进行清理
const controller = new AbortController();

button.addEventListener('click', handleClick, {
  signal: controller.signal
});

// 移除使用此信号的所有监听器
controller.abort();

// 实用清理模式
class Component {
  constructor(element) {
    this.element = element;
    this.controller = new AbortController();
    this.init();
  }

  init() {
    this.element.addEventListener('click', this.handleClick.bind(this), {
      signal: this.controller.signal
    });
  }

  handleClick(e) {
    console.log('点击了');
  }

  destroy() {
    this.controller.abort();  // 移除所有监听器
  }
}
```

### 事件对象

```javascript
document.addEventListener('click', function(event) {
  // 事件类型
  console.log(event.type);  // 'click'

  // 目标元素
  console.log(event.target);         // 触发事件的元素
  console.log(event.currentTarget);  // 附加监听器的元素
  console.log(event.relatedTarget);  // 相关元素（用于鼠标事件）

  // 位置信息
  console.log(event.clientX, event.clientY);  // 视口坐标
  console.log(event.pageX, event.pageY);      // 文档坐标
  console.log(event.screenX, event.screenY);  // 屏幕坐标
  console.log(event.offsetX, event.offsetY);  // 目标元素内的坐标

  // 修饰键
  console.log(event.altKey);    // Alt 键是否按下
  console.log(event.ctrlKey);   // Ctrl 键是否按下
  console.log(event.shiftKey);  // Shift 键是否按下
  console.log(event.metaKey);   // Meta/Cmd 键是否按下

  // 鼠标按钮
  console.log(event.button);   // 0=左键, 1=中键, 2=右键
  console.log(event.buttons);  // 按钮位掩码

  // 事件时间
  console.log(event.timeStamp);  // 页面加载后的时间

  // 冒泡控制
  console.log(event.bubbles);          // 事件是否冒泡
  console.log(event.cancelable);       // 是否可取消
  console.log(event.defaultPrevented); // 是否调用了 preventDefault
  console.log(event.eventPhase);       // 1=捕获, 2=目标, 3=冒泡
});
```

### 阻止默认和传播

```javascript
// 阻止默认浏览器行为
const link = document.querySelector('a');
link.addEventListener('click', function(event) {
  event.preventDefault();  // 不导航
  console.log('链接点击被阻止');
});

const form = document.querySelector('form');
form.addEventListener('submit', function(event) {
  event.preventDefault();  // 不提交表单
  console.log('表单提交被阻止');
});

// 停止传播（冒泡）
const child = document.querySelector('.child');
child.addEventListener('click', function(event) {
  event.stopPropagation();  // 父级处理器不会触发
  console.log('点击在此停止');
});

// 停止立即传播
// 也阻止同一元素上的其他处理器
child.addEventListener('click', function(event) {
  event.stopImmediatePropagation();
  console.log('第一个处理器 - 停止所有其他处理器');
});

child.addEventListener('click', function(event) {
  console.log('这不会运行');
});

// jQuery 中的 return false vs 原生 JS
// 在原生 JS 中，return false 不会阻止默认行为
// 必须显式调用 preventDefault 和/或 stopPropagation
```

### 常见事件类型

```javascript
// 鼠标事件
element.addEventListener('click', handler);
element.addEventListener('dblclick', handler);
element.addEventListener('mousedown', handler);
element.addEventListener('mouseup', handler);
element.addEventListener('mousemove', handler);
element.addEventListener('mouseenter', handler);  // 不冒泡
element.addEventListener('mouseleave', handler);  // 不冒泡
element.addEventListener('mouseover', handler);   // 冒泡
element.addEventListener('mouseout', handler);    // 冒泡
element.addEventListener('contextmenu', handler);

// 键盘事件
document.addEventListener('keydown', (e) => {
  console.log(e.key);       // 'a', 'Enter', 'Escape'
  console.log(e.code);      // 'KeyA', 'Enter', 'Escape'
  console.log(e.keyCode);   // 已弃用，使用 key/code
});
document.addEventListener('keyup', handler);
document.addEventListener('keypress', handler);   // 已弃用

// 焦点事件
input.addEventListener('focus', handler);
input.addEventListener('blur', handler);
input.addEventListener('focusin', handler);   // 冒泡
input.addEventListener('focusout', handler);  // 冒泡

// 表单事件
form.addEventListener('submit', handler);
form.addEventListener('reset', handler);
input.addEventListener('input', handler);     // 任何值变化
input.addEventListener('change', handler);    // 确认的变化

// 窗口事件
window.addEventListener('load', handler);           // 所有资源加载完成
window.addEventListener('DOMContentLoaded', handler); // DOM 就绪
window.addEventListener('beforeunload', handler);   // 离开之前
window.addEventListener('resize', handler);
window.addEventListener('scroll', handler);

// 拖拽事件
element.addEventListener('dragstart', handler);
element.addEventListener('drag', handler);
element.addEventListener('dragend', handler);
element.addEventListener('dragenter', handler);
element.addEventListener('dragover', handler);
element.addEventListener('dragleave', handler);
element.addEventListener('drop', handler);

// 触摸事件
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);
element.addEventListener('touchcancel', handler);

// 剪贴板事件
element.addEventListener('copy', handler);
element.addEventListener('cut', handler);
element.addEventListener('paste', handler);
```

### 自定义事件

```javascript
// 创建自定义事件
const customEvent = new CustomEvent('myEvent', {
  detail: { message: 'Hello!', value: 42 },
  bubbles: true,
  cancelable: true
});

// 分发事件
element.dispatchEvent(customEvent);

// 监听自定义事件
element.addEventListener('myEvent', function(event) {
  console.log(event.detail.message);  // 'Hello!'
  console.log(event.detail.value);    // 42
});

// 实际示例：组件通信
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);

    // 分发自定义事件
    document.dispatchEvent(new CustomEvent('cart:updated', {
      detail: {
        items: this.items,
        total: this.items.length
      }
    }));
  }
}

// 从任何地方监听
document.addEventListener('cart:updated', (e) => {
  updateCartBadge(e.detail.total);
});

// 带类型检查的通用事件
const event = new Event('build');
element.dispatchEvent(event);
```

## 事件委托

事件委托利用事件冒泡，用单个监听器处理多个元素的事件。

### 基本事件委托

```javascript
// 不使用委托（对于很多项目不好）
const items = document.querySelectorAll('.item');
items.forEach(item => {
  item.addEventListener('click', function() {
    console.log('项目被点击');
  });
});

// 使用委托（高效）
const container = document.querySelector('.container');
container.addEventListener('click', function(event) {
  if (event.target.classList.contains('item')) {
    console.log('项目被点击:', event.target);
  }
});

// 对动态添加的元素也有效
const newItem = document.createElement('div');
newItem.className = 'item';
newItem.textContent = '新项目';
container.appendChild(newItem);
// 新项目自动被处理
```

### 高级委托模式

```javascript
const list = document.querySelector('.todo-list');

// 处理多个操作
list.addEventListener('click', function(event) {
  const target = event.target;

  // 删除按钮
  if (target.matches('.delete-btn')) {
    const item = target.closest('.todo-item');
    item.remove();
    return;
  }

  // 编辑按钮
  if (target.matches('.edit-btn')) {
    const item = target.closest('.todo-item');
    enableEditMode(item);
    return;
  }

  // 完成复选框
  if (target.matches('.complete-checkbox')) {
    const item = target.closest('.todo-item');
    item.classList.toggle('completed', target.checked);
    return;
  }
});

// 使用 closest 处理嵌套元素
document.addEventListener('click', function(event) {
  const button = event.target.closest('button');
  if (!button) return;

  // 处理按钮点击
  const action = button.dataset.action;
  if (action === 'save') saveData();
  if (action === 'cancel') cancelAction();
});

// 使用 data 属性的委托
const app = document.getElementById('app');
app.addEventListener('click', function(event) {
  const handler = event.target.dataset.handler;
  if (!handler) return;

  const handlers = {
    openModal() { /* ... */ },
    closeModal() { /* ... */ },
    submitForm() { /* ... */ }
  };

  if (handlers[handler]) {
    handlers[handler](event);
  }
});
```

### 委托工具函数

```javascript
// 可复用的委托助手
function delegate(parent, selector, eventType, handler) {
  parent.addEventListener(eventType, function(event) {
    const target = event.target.closest(selector);

    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

// 使用
const container = document.querySelector('.container');

delegate(container, '.btn', 'click', function(event) {
  console.log('按钮被点击:', this);  // this = 匹配的元素
});

delegate(container, '.card', 'mouseenter', function(event) {
  this.classList.add('hovered');
});

// 带选项的更高级委托
function createDelegation(parent) {
  const handlers = new Map();

  parent.addEventListener('click', (event) => {
    for (const [selector, handler] of handlers) {
      const target = event.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, event);
      }
    }
  });

  return {
    on(selector, handler) {
      handlers.set(selector, handler);
      return this;
    },
    off(selector) {
      handlers.delete(selector);
      return this;
    }
  };
}

// 使用
const delegator = createDelegation(document.body);
delegator
  .on('.btn-save', handleSave)
  .on('.btn-cancel', handleCancel)
  .on('.link', handleLink);
```

## 性能优化

优化 DOM 操作以获得更好的性能。

### DocumentFragment

```javascript
// 不好 - 每次 append 都会导致重排
const list = document.getElementById('list');
for (let i = 0; i < 1000; i++) {
  const item = document.createElement('li');
  item.textContent = `项目 ${i}`;
  list.appendChild(item);  // 每次都重排
}

// 好 - 使用 DocumentFragment 批处理
const listElement = document.getElementById('list');
const fragment = document.createDocumentFragment();

for (let i = 0; i < 1000; i++) {
  const item = document.createElement('li');
  item.textContent = `项目 ${i}`;
  fragment.appendChild(item);  // 不重排
}

listElement.appendChild(fragment);  // 单次重排

// 使用 template 元素处理复杂片段
const template = document.getElementById('item-template');
const fragmentFromTemplate = document.createDocumentFragment();

for (const data of dataArray) {
  const clone = template.content.cloneNode(true);
  clone.querySelector('.title').textContent = data.title;
  clone.querySelector('.description').textContent = data.description;
  fragmentFromTemplate.appendChild(clone);
}

container.appendChild(fragmentFromTemplate);
```

### 批处理 DOM 操作

```javascript
// 不好 - 交错读写导致布局抖动
const elements = document.querySelectorAll('.item');
elements.forEach(el => {
  const height = el.offsetHeight;  // 读取（强制布局）
  el.style.height = height * 2 + 'px';  // 写入（使布局失效）
});

// 好 - 批量读取，然后批量写入
const allElements = document.querySelectorAll('.item');
const heights = [];

// 读取阶段
allElements.forEach(el => {
  heights.push(el.offsetHeight);
});

// 写入阶段
allElements.forEach((el, i) => {
  el.style.height = heights[i] * 2 + 'px';
});

// 使用 requestAnimationFrame 进行批处理
function batchUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

batchUpdates([
  () => element1.style.transform = 'translateX(100px)',
  () => element2.style.opacity = '0.5',
  () => element3.classList.add('active')
]);
```

### 最小化重排

```javascript
// 触发布局/重排的属性：
// offsetTop, offsetLeft, offsetWidth, offsetHeight
// scrollTop, scrollLeft, scrollWidth, scrollHeight
// clientTop, clientLeft, clientWidth, clientHeight
// getComputedStyle(), getBoundingClientRect()

// 缓存布局值
const animatedElement = document.querySelector('.animated');

// 不好
for (let i = 0; i < 100; i++) {
  animatedElement.style.left = animatedElement.offsetLeft + 1 + 'px';
}

// 好
let left = animatedElement.offsetLeft;
for (let i = 0; i < 100; i++) {
  left += 1;
  animatedElement.style.left = left + 'px';
}

// 使用 transform 代替位置属性
// transform 不会触发布局
animatedElement.style.transform = 'translateX(100px)';  // 好
animatedElement.style.left = '100px';  // 触发布局

// 在批量更改期间隐藏元素
animatedElement.style.display = 'none';
// 进行多次更改...
animatedElement.style.display = 'block';

// 或使用 visibility（保持布局）
animatedElement.style.visibility = 'hidden';
// 进行更改...
animatedElement.style.visibility = 'visible';
```

### 虚拟滚动模式

```javascript
// 对于非常长的列表，只渲染可见项目
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;

    this.setupContainer();
    this.render();
    this.attachScrollListener();
  }

  setupContainer() {
    this.content = document.createElement('div');
    this.content.style.height = this.items.length * this.itemHeight + 'px';
    this.content.style.position = 'relative';
    this.container.appendChild(this.content);
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.items.length);

    // 清除现有项目
    this.content.querySelectorAll('.virtual-item').forEach(el => el.remove());

    // 渲染可见项目
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'virtual-item';
      item.textContent = this.items[i];
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';
      fragment.appendChild(item);
    }

    this.content.appendChild(fragment);
  }

  attachScrollListener() {
    let ticking = false;

    this.container.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.render();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
}

// 使用
const scrollContainer = document.querySelector('.scroll-container');
const items = Array.from({ length: 10000 }, (_, i) => `项目 ${i}`);
new VirtualScroller(scrollContainer, items, 40);
```

### 事件处理器优化

```javascript
// 防抖 - 等待事件暂停
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 用于 resize/input 事件
window.addEventListener('resize', debounce(() => {
  console.log('调整大小结束');
}, 250));

// 节流 - 限制执行频率
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 用于滚动事件
window.addEventListener('scroll', throttle(() => {
  console.log('滚动处理器');
}, 100));

// requestAnimationFrame 节流用于平滑动画
function rafThrottle(func) {
  let rafId = null;

  return function(...args) {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

// 使用
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', rafThrottle((e) => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
}));

// 被动事件监听器用于滚动性能
window.addEventListener('scroll', handler, { passive: true });
element.addEventListener('touchmove', handler, { passive: true });
```

### Intersection Observer

```javascript
// 高效的可见性检测（替代滚动监听器）
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 元素可见
      entry.target.classList.add('visible');

      // 懒加载图片
      if (entry.target.dataset.src) {
        entry.target.src = entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    }
  });
}, {
  root: null,          // 视口
  rootMargin: '50px',  // 在可见之前 50px 触发
  threshold: 0.1       // 10% 可见
});

// 观察元素
document.querySelectorAll('.lazy-image').forEach(img => {
  observer.observe(img);
});

// 多个阈值
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const ratio = entry.intersectionRatio;
    entry.target.style.opacity = ratio;
  });
}, {
  threshold: [0, 0.25, 0.5, 0.75, 1]
});

// 无限滚动模式
const sentinel = document.querySelector('.sentinel');
const infiniteObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMoreContent();
  }
});
infiniteObserver.observe(sentinel);
```

### Mutation Observer

```javascript
// 高效地监视 DOM 变化
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('子级变化:', mutation.addedNodes, mutation.removedNodes);
    }
    if (mutation.type === 'attributes') {
      console.log('属性变化:', mutation.attributeName);
    }
  });
});

// 配置并开始观察
const config = {
  childList: true,     // 监视子级添加/删除
  attributes: true,    // 监视属性变化
  characterData: true, // 监视文本内容变化
  subtree: true,       // 监视所有后代
  attributeOldValue: true,   // 记录旧属性值
  characterDataOldValue: true // 记录旧文本值
};

mutationObserver.observe(document.body, config);

// 停止观察
mutationObserver.disconnect();

// 获取待处理的变化
const pending = mutationObserver.takeRecords();

// 实际用途：监视动态内容
const contentObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // 初始化新元素
        initializeComponent(node);
      }
    });
  });
});

contentObserver.observe(document.getElementById('app'), {
  childList: true,
  subtree: true
});
```

## 总结

DOM 操作是交互式 Web 开发的基础：

- **DOM 树**：理解 HTML 文档的层次结构
- **选择元素**：使用适当的方法进行高效的元素选择
- **遍历**：在父级、子级和兄弟之间导航
- **创建/修改**：动态构建和更新 DOM 元素
- **属性和类**：操作元素属性和样式
- **事件处理**：通过适当的事件管理响应用户交互
- **事件委托**：使用冒泡高效处理事件
- **性能**：通过批处理、片段和观察者优化 DOM 操作

掌握这些技术使您能够构建响应迅速、性能优良的 Web 应用程序，提供出色的用户体验。
