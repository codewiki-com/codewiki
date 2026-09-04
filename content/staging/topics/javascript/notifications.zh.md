---
title: Web Notifications API
description: JavaScript Web Notifications API完全指南，浏览器通知权限管理、消息提示与实战应用
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Notifications
  - Web API
  - 浏览器
  - 权限管理
status: imported
origin: old/src/content/docs/javascript/notifications.zh.md
divergence: 0.222
issues:
  - title-lang-zh
  - missing-subcategory-en
  - order-mismatch
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 1
  lastUpdated: 2026-01-07
---

Web Notifications API 是现代浏览器提供的用于向用户显示系统级通知的接口，允许 Web 应用程序以非干扰的方式向用户传达重要信息。它可以在浏览器标签页之外显示通知，即使用户不在浏览器窗口中也能接收通知。

## 概念解释

### 什么是 Web Notifications API

Web Notifications API 是一组接口，用于与操作系统的通知系统交互。它主要包含以下核心组件：

- **Notification**: 核心接口，用于创建和管理通知对象
- **NotificationOptions**: 通知配置选项对象
- **ServiceWorkerRegistration**: 与 Service Worker 结合使用，处理通知点击事件
- **NotificationEvent**: 通知相关的事件对象

### 历史背景

在 Web Notifications API 出现之前，Web 开发者主要依赖以下方式来提醒用户：

```javascript
// 浏览器标题栏闪烁（已过时）
document.title = '● 您有新消息';

// 浏览器警告框（简陋且打扰）
alert('通知来了');

// 页面内浮层提示（受限于浏览器窗口）
showFloatingNotification('通知内容');
```

这些方式存在的问题：

1. **视觉冲击**: alert 过于打扰，容易激怒用户
2. **限制范围**: 只能在浏览器窗口内显示
3. **易被忽视**: 用户切换标签页时容易错过
4. **缺乏控制**: 用户无法自由管理通知

### 解决的问题

Web Notifications API 解决了以下关键问题：

| 问题 | 传统方式 | Web Notifications |
|------|---------|------------------|
| 显示范围 | 仅限浏览器窗口 | 系统级别，窗口外可见 |
| 用户体验 | 打扰性强 | 不打扰，用户可控 |
| 权限管理 | 无 | 明确的权限模型 |
| 交互能力 | 有限 | 支持点击、关闭、按钮等 |
| 持久化 | 无法保留 | 支持用户交互后处理 |

## 核心原理

### 通知生命周期

Web Notifications 的生命周期遵循以下流程：

```
创建 → 请求权限 → 显示 → 用户交互 → 关闭
  ↓         ↓        ↓         ↓        ↓
new      checkPermission  show  click/close  cleanup
Notification  →  requestPermission  handlers  events
```

### 权限模型

Web Notifications API 使用严格的权限模型：

```javascript
// 权限三种状态
// 'default' - 用户未做选择，显示权限提示
// 'granted' - 用户授予权限
// 'denied' - 用户拒绝权限

console.log(Notification.permission); // 获取当前权限状态
```

权限流程：

1. **初始状态**: permission 为 'default'，首次使用时弹出权限提示
2. **用户选择**: 用户点击允许或拒绝
3. **权限保存**: 浏览器记住用户选择，后续使用无需再问

### 安全考虑

Web Notifications API 的安全机制：

1. **安全上下文**: 需要在 HTTPS 环境或 localhost 下使用
2. **明确的权限**: 用户必须主动授予权限，网站无法强制启用
3. **用户控制**: 用户可随时撤销权限或禁用通知
4. **系统隔离**: 通知由操作系统渲染，网站无法修改其外观

## 核心要点

### Notification 对象

`Notification` 是创建和管理通知的核心接口：

```javascript
// 检查 API 是否可用
if ('Notification' in window) {
  console.log('Web Notifications API 可用');
} else {
  console.log('Web Notifications API 不可用');
}

// 基本通知创建
const notification = new Notification('标题', {
  body: '通知内容',
  icon: '/image/icon.png'
});
```

### 权限检查和请求

```javascript
// 检查权限状态
const permission = Notification.permission;
// 'default' | 'granted' | 'denied'

// 请求权限（只能在用户交互时调用）
if (Notification.permission === 'default') {
  Notification.requestPermission().then(permission => {
    console.log('权限状态:', permission);
  });
}
```

### NotificationOptions 常用选项

| 选项 | 类型 | 描述 |
|------|------|------|
| `body` | string | 通知正文 |
| `icon` | string | 通知图标 URL |
| `badge` | string | 小角标图标 URL |
| `image` | string | 通知图像 URL |
| `tag` | string | 通知分组标签，相同 tag 的通知会相互替换 |
| `requireInteraction` | boolean | 是否需要用户交互才能关闭 |
| `silent` | boolean | 是否静音（不播放声音） |
| `vibrate` | number[] | 振动模式 |
| `data` | any | 关联的自定义数据 |
| `actions` | NotificationAction[] | 通知操作按钮 |
| `timestamp` | number | 通知发送时间戳 |

## 代码示例

### 基本通知

#### 创建简单通知

```javascript
// 检查权限并创建通知
async function showSimpleNotification() {
  // 检查 API 支持
  if (!('Notification' in window)) {
    console.error('浏览器不支持 Notifications API');
    return;
  }

  // 检查权限
  if (Notification.permission === 'granted') {
    createNotification();
  } else if (Notification.permission !== 'denied') {
    // 请求权限
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      createNotification();
    }
  }
}

function createNotification() {
  const notification = new Notification('你有一条新消息', {
    body: '这是通知的具体内容',
    icon: '/images/icon.png'
  });

  // 监听通知点击事件
  notification.addEventListener('click', () => {
    console.log('用户点击了通知');
    window.focus(); // 让浏览器窗口获得焦点
    notification.close(); // 关闭通知
  });
}

// 在用户交互时调用（如点击按钮）
document.getElementById('notifyBtn').addEventListener('click', showSimpleNotification);
```

#### 创建带图像的通知

```javascript
function showImageNotification() {
  const notification = new Notification('您有一条新评论', {
    body: '用户 John 评论了您的文章',
    icon: '/images/app-icon.png',
    image: '/images/comment-image.jpg', // 大图像显示在通知中
    badge: '/images/badge.png' // 小角标
  });

  notification.addEventListener('click', () => {
    window.open('/comments/article-123');
    notification.close();
  });
}
```

### 权限管理

#### 检查和请求权限

```javascript
class NotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window;
  }

  // 获取当前权限状态
  getPermission() {
    if (!this.isSupported) return null;
    return Notification.permission;
  }

  // 检查权限是否被授予
  isGranted() {
    return this.getPermission() === 'granted';
  }

  // 请求权限
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('浏览器不支持 Notifications API');
    }

    if (this.isGranted()) {
      return 'granted';
    }

    if (this.getPermission() === 'denied') {
      console.error('用户已拒绝通知权限');
      return 'denied';
    }

    // 'default' 状态，请求权限
    const permission = await Notification.requestPermission();
    return permission;
  }

  // 为通知监听权限变化（某些浏览器支持）
  async checkPermissionStatus() {
    try {
      const status = await navigator.permissions.query({
        name: 'notifications'
      });

      console.log('权限状态:', status.state);

      // 监听权限变化
      status.addEventListener('change', () => {
        console.log('权限已变更为:', status.state);
      });

      return status.state;
    } catch (error) {
      console.log('权限查询不支持，使用 Notification.permission');
      return Notification.permission;
    }
  }
}

// 使用示例
const notificationMgr = new NotificationManager();

document.getElementById('requestPermBtn').addEventListener('click', async () => {
  const permission = await notificationMgr.requestPermission();
  console.log('权限请求结果:', permission);
});
```

#### 权限提示最佳实践

```javascript
// 获取用户明确同意后再请求权限（UX 最佳实践）
function showPermissionPrompt() {
  const dialog = document.createElement('div');
  dialog.className = 'notification-prompt';

  const title = document.createElement('h3');
  title.textContent = '启用通知？';

  const text = document.createElement('p');
  text.textContent = '我们需要您的许可来发送重要的通知更新。';

  const allowBtn = document.createElement('button');
  allowBtn.id = 'allowBtn';
  allowBtn.textContent = '允许';

  const denyBtn = document.createElement('button');
  denyBtn.id = 'denyBtn';
  denyBtn.textContent = '拒绝';

  dialog.appendChild(title);
  dialog.appendChild(text);
  dialog.appendChild(allowBtn);
  dialog.appendChild(denyBtn);
  document.body.appendChild(dialog);

  allowBtn.addEventListener('click', async () => {
    if (Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    dialog.remove();
  });

  denyBtn.addEventListener('click', () => {
    dialog.remove();
  });
}

// 仅在用户首次访问时显示提示
if (localStorage.getItem('notificationPromptShown') === null) {
  showPermissionPrompt();
  localStorage.setItem('notificationPromptShown', 'true');
}
```

### 通知与交互

#### 通知事件处理

```javascript
function createInteractiveNotification() {
  const notification = new Notification('下载完成', {
    body: '您的文件已准备就绪',
    icon: '/images/icon.png'
  });

  // click 事件 - 用户点击通知
  notification.addEventListener('click', () => {
    console.log('通知被点击');
    window.focus(); // 获得浏览器焦点
    // 打开相关页面或执行操作
    window.open('/downloads');
    notification.close();
  });

  // close 事件 - 通知被关闭
  notification.addEventListener('close', () => {
    console.log('通知已关闭');
    // 记录关闭事件、更新 UI 等
  });

  // error 事件 - 创建通知出错
  notification.addEventListener('error', (event) => {
    console.error('通知创建失败:', event);
  });

  // show 事件 - 通知显示
  notification.addEventListener('show', () => {
    console.log('通知已显示');
    // 可以在此记录分析数据
  });
}
```

#### 带操作按钮的通知（需要 Service Worker）

```javascript
// 主线程代码
async function showNotificationWithActions() {
  if (Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }

  // 需要 Service Worker 支持 actions
  const registration = await navigator.serviceWorker.ready;

  registration.showNotification('收到消息', {
    body: '用户 Alice 发送了一条消息',
    icon: '/images/icon.png',
    badge: '/images/badge.png',
    actions: [
      {
        action: 'reply',
        title: '回复',
        icon: '/images/reply-icon.png'
      },
      {
        action: 'dismiss',
        title: '忽略',
        icon: '/images/dismiss-icon.png'
      }
    ],
    requireInteraction: true // 用户必须交互才能关闭
  });
}

// Service Worker 代码（在 sw.js 中）
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'reply') {
    // 处理回复操作
    console.log('用户点击了回复按钮');
    // 打开回复窗口或页面
    event.waitUntil(clients.matchAll().then(clientList => {
      // 在现有窗口中打开或创建新窗口
      return clients.openWindow('/messages');
    }));
  } else if (event.action === 'dismiss') {
    console.log('用户点击了忽略按钮');
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('通知被关闭');
});
```

### 通知分组和替换

#### 使用 tag 实现通知替换

```javascript
// 使用相同的 tag，新通知会替换旧通知
function showUpdatingNotification(count) {
  new Notification('未读消息', {
    body: `您有 ${count} 条未读消息`,
    icon: '/images/icon.png',
    tag: 'unread-messages', // 关键：相同 tag 会相互替换
    badge: '/images/badge.png'
  });
}

// 调用多次，只显示最新的通知
showUpdatingNotification(1);
setTimeout(() => showUpdatingNotification(2), 1000);
setTimeout(() => showUpdatingNotification(3), 2000);
// 结果：只有最后一个通知显示，之前的被替换
```

### 自定义数据和处理

#### 通知绑定自定义数据

```javascript
function showNotificationWithData() {
  const userId = 'user-123';
  const messageId = 'msg-456';

  const notification = new Notification('新评论通知', {
    body: '用户 Bob 评论了您的文章',
    icon: '/images/icon.png',
    data: {
      userId: userId,
      messageId: messageId,
      timestamp: Date.now(),
      url: '/article/my-article?comment=' + messageId
    }
  });

  notification.addEventListener('click', () => {
    const data = notification.data;
    console.log('通知关联数据:', data);

    // 使用数据进行导航或处理
    window.open(data.url);

    // 可以向服务器报告通知被点击
    fetch('/api/notification-clicked', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: data.messageId,
        timestamp: data.timestamp
      })
    });

    notification.close();
  });
}
```

### 与 Service Worker 集成

#### Service Worker 中的通知处理

```javascript
// main.js - 主线程代码
async function registerAndShowNotification() {
  // 注册 Service Worker
  const registration = await navigator.serviceWorker.register('/sw.js');

  // 检查权限
  if (Notification.permission === 'granted') {
    // 通过 Service Worker 显示通知
    registration.showNotification('后台通知', {
      body: '这个通知由 Service Worker 发送',
      icon: '/images/icon.png',
      tag: 'background-notification',
      data: {
        url: '/dashboard'
      }
    });
  } else if (Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
}

// sw.js - Service Worker 代码
self.addEventListener('install', (event) => {
  console.log('Service Worker 已安装');
});

// 处理来自服务器的推送消息（需要 Push API）
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('推送消息为空');
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/images/icon.png',
    badge: data.badge || '/images/badge.png',
    data: data.data || {},
    tag: data.tag || 'push-notification',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // 检查是否已有打开相关 URL 的窗口
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // 没有的话，创建新窗口
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

### 通知工具类

#### 完整的通知管理类

```javascript
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.activeNotifications = new Map();
    this.initServiceWorker();
  }

  // 初始化 Service Worker
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Service Worker 注册失败:', error);
      }
    }
  }

  // 检查支持
  checkSupport() {
    if (!this.isSupported) {
      throw new Error('浏览器不支持 Notifications API');
    }
  }

  // 获取权限状态
  getPermission() {
    this.checkSupport();
    return Notification.permission;
  }

  // 请求权限
  async requestPermission() {
    this.checkSupport();

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      console.warn('用户已拒绝通知权限');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // 显示通知
  async show(title, options = {}) {
    this.checkSupport();

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    const notification = new Notification(title, options);

    // 保存通知引用
    const tag = options.tag || `notification-${Date.now()}`;
    this.activeNotifications.set(tag, notification);

    // 处理关闭事件
    notification.addEventListener('close', () => {
      this.activeNotifications.delete(tag);
    });

    return notification;
  }

  // 显示进度通知
  async showProgress(title, current, total, options = {}) {
    const percentage = Math.round((current / total) * 100);
    const body = options.body || `${percentage}% 完成`;

    return this.show(title, {
      ...options,
      body,
      tag: options.tag || 'progress-notification'
    });
  }

  // 显示成功通知
  async showSuccess(title, options = {}) {
    return this.show(title, {
      icon: '/images/success-icon.png',
      ...options,
      tag: options.tag || 'success-notification'
    });
  }

  // 显示错误通知
  async showError(title, options = {}) {
    return this.show(title, {
      icon: '/images/error-icon.png',
      ...options,
      tag: options.tag || 'error-notification'
    });
  }

  // 显示警告通知
  async showWarning(title, options = {}) {
    return this.show(title, {
      icon: '/images/warning-icon.png',
      ...options,
      tag: options.tag || 'warning-notification'
    });
  }

  // 关闭特定通知
  close(tag) {
    const notification = this.activeNotifications.get(tag);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(tag);
    }
  }

  // 关闭所有通知
  closeAll() {
    this.activeNotifications.forEach((notification) => {
      notification.close();
    });
    this.activeNotifications.clear();
  }

  // 获取活跃通知数
  getActiveCount() {
    return this.activeNotifications.size;
  }

  // 通过 Service Worker 显示通知（推荐用于后台）
  async showViaServiceWorker(title, options = {}) {
    if (!this.swRegistration) {
      return this.show(title, options);
    }

    try {
      await this.swRegistration.showNotification(title, options);
    } catch (error) {
      console.error('Service Worker 通知失败，降级为普通通知:', error);
      return this.show(title, options);
    }
  }
}

// 使用示例
const notificationService = new NotificationService();

// 显示基本通知
await notificationService.show('您有一条新消息', {
  body: '这是通知内容',
  icon: '/images/icon.png'
});

// 显示不同类型的通知
await notificationService.showSuccess('操作成功');
await notificationService.showError('发生错误，请重试');
await notificationService.showWarning('请注意此信息');

// 显示进度通知
await notificationService.showProgress('下载进度', 50, 100);

// 关闭特定通知
notificationService.close('success-notification');

// 关闭所有通知
notificationService.closeAll();
```

## 最佳实践

### 获取明确的用户同意

```javascript
// 错误：页面加载时直接请求权限
window.addEventListener('load', async () => {
  await Notification.requestPermission(); // 用户体验差
});

// 正确：在用户明确同意后再请求
function setupNotificationPrompt() {
  const button = document.getElementById('enableNotifications');

  if (button) {
    button.addEventListener('click', async () => {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          button.textContent = '通知已启用';
          button.disabled = true;
        }
      }
    });
  }
}

setupNotificationPrompt();
```

### 提供权限状态反馈

```javascript
function updateNotificationUI() {
  const status = document.getElementById('notificationStatus');

  const permission = Notification.permission;

  switch (permission) {
    case 'granted':
      status.textContent = '✓ 通知已启用';
      status.className = 'status-granted';
      break;
    case 'denied':
      status.textContent = '✗ 通知已禁用';
      status.className = 'status-denied';
      const settingsLink = document.createElement('p');
      settingsLink.textContent = '请在浏览器设置中启用通知';
      status.appendChild(settingsLink);
      break;
    case 'default':
      status.textContent = '○ 需要启用通知';
      status.className = 'status-default';
      break;
  }
}

// 监听权限变化
if ('permissions' in navigator) {
  navigator.permissions.query({ name: 'notifications' }).then((statusObj) => {
    updateNotificationUI();

    statusObj.addEventListener('change', updateNotificationUI);
  });
}
```

### 验证通知内容

```javascript
function validateNotificationContent(title, options) {
  const errors = [];

  // 验证标题
  if (!title || title.trim().length === 0) {
    errors.push('标题不能为空');
  }

  if (title.length > 100) {
    errors.push('标题过长（最多100字符）');
  }

  // 验证正文
  if (options.body && options.body.length > 500) {
    errors.push('正文过长（最多500字符）');
  }

  // 验证图标 URL
  if (options.icon && !isValidUrl(options.icon)) {
    errors.push('图标 URL 无效');
  }

  return errors;
}

async function showValidatedNotification(title, options = {}) {
  const errors = validateNotificationContent(title, options);

  if (errors.length > 0) {
    console.error('通知验证失败:', errors);
    return null;
  }

  return new Notification(title, options);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### 处理权限拒绝的情况

```javascript
async function showNotificationWithFallback(title, options = {}) {
  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  }

  if (Notification.permission === 'denied') {
    // 权限被拒绝，使用替代方案
    showPageNotification(title, options);
    return null;
  }

  // 默认状态，请求权限
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    return new Notification(title, options);
  } else {
    // 用户拒绝，使用替代方案
    showPageNotification(title, options);
    return null;
  }
}

// 替代方案：页面内通知
function showPageNotification(title, options) {
  const notification = document.createElement('div');
  notification.className = 'page-notification';

  const titleElem = document.createElement('strong');
  titleElem.textContent = title;

  const bodyElem = document.createElement('p');
  bodyElem.textContent = options.body || '';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '✕';

  notification.appendChild(titleElem);
  notification.appendChild(bodyElem);
  notification.appendChild(closeBtn);
  document.body.appendChild(notification);

  closeBtn.addEventListener('click', () => {
    notification.remove();
  });

  // 3 秒后自动关闭
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}
```

### 避免通知泛滥

```javascript
class NotificationRateLimiter {
  constructor(maxPerMinute = 5) {
    this.maxPerMinute = maxPerMinute;
    this.timestamps = [];
  }

  canNotify() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // 清理一分钟前的记录
    this.timestamps = this.timestamps.filter(ts => ts > oneMinuteAgo);

    // 检查是否超过限制
    if (this.timestamps.length >= this.maxPerMinute) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  reset() {
    this.timestamps = [];
  }
}

// 使用示例
const limiter = new NotificationRateLimiter(5); // 每分钟最多 5 条

async function showLimitedNotification(title, options) {
  if (!limiter.canNotify()) {
    console.warn('通知过于频繁，已忽略');
    return;
  }

  return new Notification(title, options);
}
```

### 利用 tag 避免重复通知

```javascript
function showUniqueNotification(title, options) {
  // 使用 tag 确保同一类型的通知不重复
  const tag = options.tag || `notification-${title}`;

  return new Notification(title, {
    ...options,
    tag // 相同 tag 的通知会相互替换
  });
}

// 示例：实时通知应用状态
function notifyAppStatus(status) {
  const notificationMap = {
    'online': { title: '应用在线', icon: '/images/online.png' },
    'offline': { title: '应用离线', icon: '/images/offline.png' },
    'syncing': { title: '正在同步...', icon: '/images/syncing.png' }
  };

  const config = notificationMap[status];
  if (config) {
    showUniqueNotification(config.title, {
      ...config,
      tag: 'app-status' // 所有状态通知使用同一 tag
    });
  }
}

// 调用：每个新状态会替换上一个状态的通知
notifyAppStatus('online');
setTimeout(() => notifyAppStatus('syncing'), 2000);
setTimeout(() => notifyAppStatus('offline'), 4000);
```

## 常见陷阱

### 忽略权限检查

```javascript
// 错误：直接创建通知，没有检查权限
function badNotify() {
  new Notification('标题'); // 可能失败
}

// 正确：检查权限
async function goodNotify() {
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }
  }

  new Notification('标题');
}
```

### 在错误的时机请求权限

```javascript
// 错误：在页面加载时请求，用户还未准备好
window.addEventListener('load', async () => {
  await Notification.requestPermission(); // 用户可能会拒绝
});

// 正确：在用户明确表示需要时请求
button.addEventListener('click', async () => {
  await Notification.requestPermission(); // 用户知道为什么
});
```

### 不处理通知事件

```javascript
// 错误：创建了通知但没有处理用户交互
function poorNotification() {
  new Notification('重要通知', {
    body: '请点击查看详情'
  });
  // 用户点击后没有任何反应
}

// 正确：处理通知事件
function goodNotification() {
  const notification = new Notification('重要通知', {
    body: '请点击查看详情'
  });

  notification.addEventListener('click', () => {
    window.focus();
    window.open('/details');
    notification.close();
  });

  notification.addEventListener('close', () => {
    console.log('用户关闭了通知');
  });
}
```

### 不验证图标和图像 URL

```javascript
// 错误：使用无效 URL，导致通知显示不正确
new Notification('标题', {
  icon: 'not-a-valid-url', // 无效 URL
  image: '/path/with spaces/image.jpg' // 路径有空格
});

// 正确：验证和编码 URL
function createValidNotification(title, options) {
  if (options.icon) {
    options.icon = encodeURI(options.icon);
  }
  if (options.image) {
    options.image = encodeURI(options.image);
  }

  return new Notification(title, options);
}
```

### 忘记关闭通知

```javascript
// 错误：创建多个通知但不管理它们
for (let i = 0; i < 10; i++) {
  new Notification(`通知 ${i}`); // 可能导致通知栏混乱
}

// 正确：使用 tag 管理通知
for (let i = 0; i < 10; i++) {
  new Notification('通知', {
    body: `这是第 ${i} 条`,
    tag: 'batch-notification' // 只显示最后一个
  });
}
```

### 在 Service Worker 中忽略 waitUntil

```javascript
// 错误：没有等待异步操作完成
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clients.openWindow('/page'); // 可能在 SW 关闭前无法完成
});

// 正确：使用 waitUntil
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/page') // 确保操作完成
  );
});
```

## 性能考量

### 异步操作不阻塞主线程

Web Notifications API 不会阻塞主线程：

```javascript
async function demonstrateNonBlocking() {
  console.time('notification-creation');

  // 创建通知不会阻塞 UI
  new Notification('通知标题', {
    body: '这个操作很快'
  });

  console.timeEnd('notification-creation'); // 通常 < 1ms

  // UI 更新等其他操作立即执行
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}
```

### 管理活跃通知数量

```javascript
class NotificationPool {
  constructor(maxNotifications = 3) {
    this.maxNotifications = maxNotifications;
    this.notifications = [];
  }

  show(title, options) {
    // 如果超过限制，移除最旧的通知
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      oldest.close();
    }

    const notification = new Notification(title, options);

    // 监听关闭事件
    notification.addEventListener('close', () => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    });

    this.notifications.push(notification);
    return notification;
  }

  closeAll() {
    this.notifications.forEach(n => n.close());
    this.notifications = [];
  }
}

const pool = new NotificationPool(3); // 最多同时显示 3 个通知

pool.show('通知 1', { body: '内容 1' });
pool.show('通知 2', { body: '内容 2' });
pool.show('通知 3', { body: '内容 3' });
pool.show('通知 4', { body: '内容 4' }); // 通知 1 会被关闭
```

### 内存管理

```javascript
class SmartNotificationManager {
  constructor() {
    this.notifications = new WeakMap();
    this.metadata = new Map();
  }

  show(title, options) {
    const notification = new Notification(title, options);

    // 存储元数据（使用 WeakMap，当 notification 被垃圾回收时自动清理）
    this.notifications.set(notification, {
      createdAt: Date.now(),
      title: title
    });

    // 监听关闭
    notification.addEventListener('close', () => {
      this.metadata.delete(notification);
    });

    return notification;
  }
}
```

### 避免频繁权限检查

```javascript
// 缓存权限状态，避免频繁检查
class CachedPermissionManager {
  constructor() {
    this.permissionCache = null;
    this.cacheTime = 0;
    this.cacheDuration = 60 * 1000; // 1 分钟缓存
  }

  getPermission() {
    const now = Date.now();

    // 使用缓存
    if (this.permissionCache && now - this.cacheTime < this.cacheDuration) {
      return this.permissionCache;
    }

    // 更新缓存
    this.permissionCache = Notification.permission;
    this.cacheTime = now;

    return this.permissionCache;
  }

  async requestPermission() {
    const permission = await Notification.requestPermission();
    this.permissionCache = permission;
    this.cacheTime = Date.now();
    return permission;
  }

  invalidateCache() {
    this.permissionCache = null;
  }
}
```

## 实战场景

### 聊天应用新消息通知

```javascript
class ChatNotificationManager {
  constructor() {
    this.activeChats = new Map(); // 存储当前活跃的聊天
  }

  async notifyNewMessage(chatId, sender, message) {
    // 如果用户已经打开了聊天窗口，不显示通知
    if (this.activeChats.has(chatId) && this.activeChats.get(chatId)) {
      return;
    }

    // 使用聊天 ID 作为 tag，相同聊天的通知会相互替换
    const notification = new Notification(`来自 ${sender}`, {
      body: message.substring(0, 100),
      icon: '/images/app-icon.png',
      badge: '/images/badge.png',
      tag: `chat-${chatId}`,
      requireInteraction: true,
      data: { chatId, sender }
    });

    notification.addEventListener('click', () => {
      window.focus();
      // 打开聊天窗口
      this.openChat(chatId);
      notification.close();
    });
  }

  openChat(chatId) {
    window.open(`/chat/${chatId}`);
    this.activeChats.set(chatId, true);
  }

  closeChat(chatId) {
    this.activeChats.set(chatId, false);
  }
}

// 模拟接收消息
const chatNotifier = new ChatNotificationManager();

// 监听新消息事件
document.addEventListener('new-message', (event) => {
  const { chatId, sender, message } = event.detail;
  chatNotifier.notifyNewMessage(chatId, sender, message);
});
```

### 下载进度通知

```javascript
class DownloadNotificationManager {
  async startDownload(filename) {
    const notification = new Notification(`正在下载: ${filename}`, {
      body: '0% 完成',
      icon: '/images/download-icon.png',
      tag: `download-${filename}`,
      requireInteraction: false
    });

    return notification;
  }

  updateProgress(filename, progress) {
    const percentage = Math.round(progress * 100);

    new Notification(`正在下载: ${filename}`, {
      body: `${percentage}% 完成`,
      icon: '/images/download-icon.png',
      tag: `download-${filename}` // 替换之前的通知
    });
  }

  completeDownload(filename) {
    const notification = new Notification('下载完成', {
      body: filename,
      icon: '/images/success-icon.png',
      tag: `download-${filename}`,
      requireInteraction: true
    });

    notification.addEventListener('click', () => {
      // 打开下载文件夹或文件
      window.open('/downloads');
      notification.close();
    });
  }
}

// 使用示例
const downloadManager = new DownloadNotificationManager();

async function simulateDownload() {
  const filename = 'document.pdf';
  await downloadManager.startDownload(filename);

  // 模拟进度更新
  for (let i = 0; i <= 100; i += 10) {
    await new Promise(resolve => setTimeout(resolve, 200));
    downloadManager.updateProgress(filename, i / 100);
  }

  downloadManager.completeDownload(filename);
}
```

### 系统状态监控通知

```javascript
class SystemStatusNotifier {
  constructor() {
    this.lastStatus = null;
    this.monitorInterval = null;
  }

  start() {
    // 每 30 秒检查一次系统状态
    this.monitorInterval = setInterval(() => {
      this.checkSystemStatus();
    }, 30000);

    // 立即检查一次
    this.checkSystemStatus();
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  async checkSystemStatus() {
    try {
      const response = await fetch('/api/system-status');
      const status = await response.json();

      // 仅在状态变化时显示通知
      if (status.status !== this.lastStatus) {
        this.notifyStatusChange(status);
        this.lastStatus = status.status;
      }
    } catch (error) {
      console.error('系统状态检查失败:', error);
      this.notifyError('无法连接到系统');
    }
  }

  notifyStatusChange(status) {
    const statusMap = {
      'healthy': {
        title: '系统正常',
        body: '所有服务运行正常',
        icon: '/images/healthy.png'
      },
      'warning': {
        title: '系统警告',
        body: `CPU 使用率: ${status.cpu}%, 内存: ${status.memory}%`,
        icon: '/images/warning.png'
      },
      'critical': {
        title: '系统告警',
        body: '系统资源紧张，请采取行动',
        icon: '/images/critical.png',
        requireInteraction: true
      }
    };

    const config = statusMap[status.status] || statusMap['healthy'];

    new Notification(config.title, {
      ...config,
      tag: 'system-status',
      data: { status: status.status }
    });
  }

  notifyError(message) {
    new Notification('系统通知', {
      body: message,
      icon: '/images/error.png',
      tag: 'system-error'
    });
  }
}

// 启动监控
const monitor = new SystemStatusNotifier();
monitor.start();
```

### 协作编辑实时通知

```javascript
class CollaborationNotifier {
  constructor() {
    this.collaborators = new Map();
  }

  notifyUserJoined(username) {
    new Notification(`${username} 加入了协作`, {
      body: '现在有其他用户在编辑此文档',
      icon: '/images/user-joined.png',
      tag: 'collaboration',
      silent: true // 静音，不打扰用户
    });
  }

  notifyUserLeft(username) {
    new Notification(`${username} 离开了协作`, {
      body: '用户已离开此文档',
      icon: '/images/user-left.png',
      tag: 'collaboration',
      silent: true
    });
  }

  notifyChanges(count) {
    new Notification(`有 ${count} 条新的编辑`, {
      body: '其他用户正在编辑此文档',
      icon: '/images/changes.png',
      tag: 'collaboration-changes'
    });
  }

  notifyComment(author, preview) {
    const notification = new Notification(`${author} 添加了评论`, {
      body: preview,
      icon: '/images/comment.png',
      tag: `comment-${author}`,
      data: { author }
    });

    notification.addEventListener('click', () => {
      window.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      notification.close();
    });
  }
}

// 使用示例
const collaborationNotifier = new CollaborationNotifier();

// 监听 WebSocket 事件
socketManager.on('user-joined', (data) => {
  collaborationNotifier.notifyUserJoined(data.username);
});

socketManager.on('changes-received', (data) => {
  collaborationNotifier.notifyChanges(data.count);
});

socketManager.on('comment-added', (data) => {
  collaborationNotifier.notifyComment(data.author, data.preview);
});
```

## 面试要点

### Web Notifications API 的权限模型

**问**: 请解释 Web Notifications API 的权限模型。

**答**: Web Notifications API 使用三态权限模型：

- **'default'**: 用户未做出选择，首次请求时会弹出权限提示
- **'granted'**: 用户已授予权限，可以直接创建通知
- **'denied'**: 用户已拒绝权限，无法创建通知

权限是持久化的，存储在浏览器中。用户可以在浏览器设置中随时修改权限。

```javascript
// 检查权限
const permission = Notification.permission;

// 请求权限（仅在 'default' 状态时生效）
if (permission === 'default') {
  Notification.requestPermission().then(newPermission => {
    if (newPermission === 'granted') {
      new Notification('权限已授予');
    }
  });
}
```

### 为什么通知需要用户交互

**问**: 为什么请求通知权限通常需要在用户交互的上下文中进行？

**答**: 这是安全和用户体验的考量：

1. **安全性**: 防止恶意网站在用户不知情的情况下请求权限
2. **用户体验**: 在用户明确表示需求时请求权限，获得授予的概率更高
3. **防止滥用**: 强制在用户操作时请求，防止权限被随意滥用

因此最佳实践是在用户点击"启用通知"按钮时请求权限。

### tag 的作用

**问**: Notification 选项中 `tag` 参数有什么作用？

**答**: `tag` 用于分组和管理通知：

- 相同 `tag` 的新通知会**替换**旧通知，而不是堆积
- 主要用途：
  1. 实时更新（如进度、状态）
  2. 通知分类管理
  3. 防止通知泛滥

```javascript
// 这三个通知只显示最后一个
new Notification('状态', { body: '0%', tag: 'progress' });
new Notification('状态', { body: '50%', tag: 'progress' });
new Notification('状态', { body: '100%', tag: 'progress' });
```

### Notification 与 Service Worker 的关系

**问**: 为什么推荐通过 Service Worker 显示通知而不是直接在页面中创建？

**答**: Service Worker 具有以下优势：

1. **后台运行**: 即使页面关闭，Service Worker 仍可显示通知
2. **持久性**: 通知由系统管理，用户交互自动路由到 SW
3. **推送集成**: 可以接收服务器推送消息并显示通知
4. **统一处理**: 通知点击事件在 SW 中统一处理

```javascript
// Service Worker 中可以处理来自服务器的推送
self.addEventListener('push', (event) => {
  event.waitUntil(
    self.registration.showNotification('来自服务器的通知')
  );
});
```

### 如何处理权限被拒绝的情况

**问**: 当用户拒绝通知权限时，应该如何处理？

**答**: 应该提供优雅的降级方案：

```javascript
async function showNotificationWithFallback(title, options) {
  // 首先尝试使用 Notifications API
  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  }

  if (Notification.permission === 'denied') {
    // 权限被拒绝，使用替代方案
    showInPageNotification(title, options); // 页面内通知
    return;
  }

  // 请求权限
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    new Notification(title, options);
  } else {
    // 用户拒绝，使用替代方案
    showInPageNotification(title, options);
  }
}
```

### 浏览器兼容性

**问**: Web Notifications API 的浏览器支持情况如何？

**答**:

- **支持**: Chrome、Firefox、Safari、Edge（所有现代版本）
- **不支持**: IE
- **部分支持**: 某些旧版本浏览器可能不支持某些选项（如 badge、image）

最佳实践：

```javascript
// 检查 API 是否可用
if (!('Notification' in window)) {
  console.log('浏览器不支持 Notifications API');
  // 使用替代方案
}
```

## 延伸阅读

### 官方文档

- [MDN - Notifications API](https://developer.mozilla.org/zh-CN/docs/Web/API/Notifications_API)
- [MDN - Notification](https://developer.mozilla.org/zh-CN/docs/Web/API/Notification)
- [W3C Notifications 规范](https://notifications.spec.whatwg.org/)

### 相关 API

- [Service Worker API](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API) - 后台执行和推送处理
- [Push API](https://developer.mozilla.org/zh-CN/docs/Web/API/Push_API) - 服务器推送
- [Permissions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Permissions_API) - 权限管理

### 浏览器兼容性

- [Can I Use - Notifications](https://caniuse.com/notifications)

### 最佳实践文章

- [web.dev - Web Notifications](https://web.dev/articles/push-notifications-overview)
- [Google Chrome Blog - Notifications](https://blog.google/products/chrome/)

### 相关库和工具

- [PWA 通知最佳实践](https://web.dev/articles/notification-best-practices)
- [Push API 示例](https://github.com/mozilla/serviceworker-cookbook)
