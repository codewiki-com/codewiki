---
title: HTMX：简化现代 Web 开发
description: 使用 HTMX 构建交互式 Web 应用程序，无需复杂的前端框架
track: javascript
section: patterns-tooling
difficulty: beginner
tags:
  - HTMX
  - HTML
  - AJAX
  - Hypermedia
status: imported
origin: old/src/content/docs/frontend/htmx.zh.md
divergence: 0.228
issues: []
legacy:
  category: Frontend
  subcategory: Libraries
  order: 29
  lastUpdated: 2026-01-07
---

HTMX 是一个轻量级 JavaScript 库，它通过强大的属性扩展 HTML，用于构建动态、交互式的 Web 应用程序。HTMX 让你无需编写复杂的 JavaScript 代码或采用重型前端框架，而是直接通过 HTML 使用声明式属性来访问 AJAX、CSS 过渡、WebSocket 和服务器发送事件。

## HTMX 的理念

### 回归超媒体

HTMX 建立在一个根本性的洞察之上：HTML 本质上是强大的，但被人为地限制了。标准 HTML 将 HTTP 请求限制在 `<a>` 标签和 `<form>` 元素上，只支持 GET 和 POST 方法，并且只能替换整个页面。HTMX 移除了这些任意的限制，同时保持了使 HTML 易于接近的声明式简洁性。

核心理念围绕几个关键原则：

1. **以 HTML 为中心的开发**：不是构建操作 DOM 的 JavaScript 应用程序，而是让服务器返回 HTML 片段，由 HTMX 交换到位
2. **超媒体作为应用程序状态引擎（HATEOAS）**：服务器通过超媒体响应驱动应用程序行为
3. **简洁优于复杂**：无需构建步骤、打包工具或复杂的状态管理即可实现丰富的交互性
4. **渐进增强**：从可工作的 HTML 开始，使用 HTMX 属性增强它

### 为什么选择 HTMX？

HTMX 在许多 Web 开发场景中提供了令人信服的优势：

- **零生产依赖**：大约 14KB 压缩后的小体积
- **无需构建步骤**：包含 script 标签即可立即开始使用属性
- **服务器无关**：与任何能够返回 HTML 的后端技术兼容
- **学习曲线平缓**：如果你了解 HTML，今天就可以开始使用 HTMX
- **降低复杂性**：无需客户端路由、状态管理库或组件框架
- **SEO 友好**：服务器渲染的 HTML 天然可被搜索引擎索引

## 入门

### 安装

有几种方式可以在项目中引入 HTMX：

```html
<!-- 通过 CDN（最简单的方式） -->
<script src="https://unpkg.com/htmx.org@2.0.0"></script>

<!-- 或通过 npm 用于打包项目 -->
<!-- npm install htmx.org -->
```

### 你的第一个 HTMX 请求

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>HTMX 演示</title>
    <script src="https://unpkg.com/htmx.org@2.0.0"></script>
</head>
<body>
    <button hx-get="/api/greeting" hx-target="#result">
        点击我
    </button>
    <div id="result">响应将显示在这里</div>
</body>
</html>
```

当点击按钮时，HTMX 向 `/api/greeting` 发起 GET 请求，并用服务器的 HTML 响应替换 `#result` 的内容。

## 核心属性

HTMX 为所有标准 HTTP 方法提供属性，允许任何元素发起 AJAX 请求。

### AJAX 请求属性

```html
<!-- GET 请求 -->
<button hx-get="/api/users">加载用户</button>

<!-- POST 请求 -->
<form hx-post="/api/users">
    <input name="username" type="text" required />
    <input name="email" type="email" required />
    <button type="submit">创建用户</button>
</form>

<!-- 带确认的 PUT 请求 -->
<button
    hx-put="/api/users/123"
    hx-confirm="更新此用户？"
    hx-target="#user-123">
    更新用户
</button>

<!-- 用于部分更新的 PATCH 请求 -->
<input
    type="checkbox"
    hx-patch="/api/tasks/456"
    hx-vals='{"completed": true}'
    hx-target="#task-456" />

<!-- 带元素移除的 DELETE 请求 -->
<button
    hx-delete="/api/users/123"
    hx-target="#user-123"
    hx-swap="delete"
    hx-confirm="永久删除此用户？">
    删除用户
</button>
```

### hx-target 属性

默认情况下，HTMX 替换触发请求的元素的内容。使用 `hx-target` 指定不同的元素：

```html
<!-- 通过 ID 定位 -->
<button hx-get="/api/users" hx-target="#user-list">
    加载用户
</button>
<div id="user-list"></div>

<!-- 定位匹配选择器的最近祖先 -->
<button hx-delete="/api/item/123" hx-target="closest tr" hx-swap="delete">
    删除行
</button>

<!-- 定位下一个匹配选择器的兄弟元素 -->
<input hx-get="/api/validate" hx-target="next .error-message" />
<span class="error-message"></span>

<!-- 使用 find 定位（搜索后代） -->
<div hx-get="/api/data" hx-target="find .content-area">
    <div class="content-area"></div>
</div>
```

### hx-swap 属性

HTMX 提供八种交换策略来插入服务器响应：

```html
<!-- innerHTML（默认）：替换内部内容 -->
<div hx-get="/api/content" hx-swap="innerHTML">
    内容将被替换
</div>

<!-- outerHTML：替换整个元素 -->
<div hx-get="/api/widget" hx-swap="outerHTML">
    整个元素将被替换
</div>

<!-- beforebegin：在元素之前插入 -->
<div hx-get="/api/item" hx-swap="beforebegin">
    新内容出现在此之前
</div>

<!-- afterbegin：作为第一个子元素插入 -->
<ul hx-get="/api/latest" hx-swap="afterbegin">
    <li>现有项目</li>
</ul>

<!-- beforeend：作为最后一个子元素插入 -->
<ul hx-get="/api/more" hx-swap="beforeend">
    <li>现有项目</li>
</ul>

<!-- afterend：在元素之后插入 -->
<div hx-get="/api/notice" hx-swap="afterend">
    新内容出现在此之后
</div>

<!-- delete：移除目标元素 -->
<div hx-delete="/api/item/123" hx-swap="delete">
    此元素将被移除
</div>

<!-- none：不更新 DOM（用于副作用） -->
<button hx-post="/api/track" hx-swap="none">
    追踪点击（无可见变化）
</button>
```

### 交换修饰符

使用修饰符微调交换行为：

```html
<!-- 控制时机 -->
<button
    hx-get="/api/data"
    hx-swap="innerHTML swap:500ms settle:1s">
    延迟加载
</button>

<!-- 滚动控制 -->
<div hx-get="/api/more" hx-swap="beforeend scroll:bottom">
    交换后自动滚动到底部
</div>

<!-- 在视口位置显示元素 -->
<div hx-get="/api/details" hx-swap="innerHTML show:top">
    交换后滚动到顶部
</div>

<!-- 启用 View Transitions API -->
<div hx-get="/api/page" hx-swap="innerHTML transition:true">
    动画过渡
</div>
```

### hx-trigger 属性

默认情况下，HTMX 根据元素类型触发请求：
- `<input>`、`<textarea>`、`<select>`：在 `change` 时触发
- `<form>`：在 `submit` 时触发
- 其他所有元素：在 `click` 时触发

使用 `hx-trigger` 自定义触发器：

```html
<!-- 不同事件 -->
<div hx-get="/api/data" hx-trigger="mouseenter">
    悬停以加载
</div>

<input hx-get="/api/search" hx-trigger="keyup" />

<!-- 多个触发器 -->
<input
    hx-get="/api/search"
    hx-trigger="keyup, search"
    hx-target="#results" />

<!-- 页面加载时加载 -->
<div hx-get="/api/initial" hx-trigger="load">
    加载中...
</div>

<!-- 使用 revealed 懒加载 -->
<div hx-get="/api/lazy" hx-trigger="revealed">
    滚动到视图中时加载
</div>

<!-- 交叉观察器 -->
<img
    hx-get="/api/image"
    hx-trigger="intersect threshold:0.5"
    hx-swap="outerHTML" />
```

### 触发器修饰符

```html
<!-- 防抖：等待活动暂停 -->
<input
    type="search"
    hx-get="/api/search"
    hx-trigger="keyup changed delay:500ms"
    hx-target="#results"
    placeholder="搜索..." />

<!-- 节流：限制请求频率 -->
<button
    hx-get="/api/data"
    hx-trigger="click throttle:1s">
    点击（每秒最多一次）
</button>

<!-- 一次：只触发一次 -->
<div hx-get="/api/welcome" hx-trigger="load once">
    页面加载时加载一次
</div>

<!-- changed：只在值改变时触发 -->
<input hx-get="/api/validate" hx-trigger="keyup changed" />

<!-- 轮询 -->
<div hx-get="/api/status" hx-trigger="every 2s">
    每 2 秒更新状态
</div>

<!-- 条件轮询 -->
<div hx-get="/api/updates" hx-trigger="every 1s [isPollingEnabled]">
    基于 JavaScript 变量的条件轮询
</div>
```

### 事件过滤器

```html
<!-- 修饰键 -->
<button
    hx-post="/api/admin"
    hx-trigger="click[ctrlKey]">
    管理员操作（需要 Ctrl+点击）
</button>

<!-- 键盘快捷键 -->
<body hx-trigger="keyup[key=='Escape'] from:body"
      hx-get="/api/close-modal"
      hx-target="#modal">
</body>

<!-- 基于值的条件 -->
<input
    hx-get="/api/search"
    hx-trigger="keyup[target.value.length > 2] delay:300ms"
    hx-target="#results" />
```

## 深入 AJAX 请求

### 包含额外数据

```html
<!-- 使用 hx-vals 的静态值 -->
<button
    hx-post="/api/action"
    hx-vals='{"userId": 123, "action": "approve"}'>
    批准
</button>

<!-- 使用 JavaScript 的动态值 -->
<button
    hx-post="/api/action"
    hx-vals="js:{timestamp: Date.now()}">
    提交带时间戳
</button>

<!-- 包含其他元素的输入 -->
<input type="text" id="search-input" name="query" />
<button hx-get="/api/search" hx-include="#search-input">
    搜索
</button>

<!-- 包含整个表单 -->
<button hx-post="/api/submit" hx-include="closest form">
    提交表单
</button>

<!-- 自定义头部 -->
<button
    hx-post="/api/data"
    hx-headers='{"X-Custom-Header": "value"}'>
    带自定义头部
</button>
```

### 请求指示器

在请求期间显示加载状态：

```html
<style>
    .htmx-indicator {
        display: none;
    }
    .htmx-request .htmx-indicator {
        display: inline-block;
    }
    .htmx-request.htmx-indicator {
        display: inline-block;
    }
</style>

<!-- 外部指示器 -->
<button hx-get="/api/data" hx-indicator="#spinner">
    加载数据
</button>
<img id="spinner" class="htmx-indicator" src="/spinner.gif" alt="加载中" />

<!-- 内联指示器 -->
<button hx-get="/api/data">
    <span class="htmx-indicator">加载中...</span>
    <span>加载数据</span>
</button>
```

### 请求同步

控制如何处理并发请求：

```html
<!-- 中止之前的请求 -->
<input
    hx-get="/api/search"
    hx-trigger="keyup"
    hx-sync="this:abort">

<!-- 队列请求 -->
<button
    hx-post="/api/action"
    hx-sync="this:queue first">
    只有第一个排队
</button>

<!-- 如果请求进行中则丢弃 -->
<button
    hx-post="/api/action"
    hx-sync="this:drop">
    处理中时忽略
</button>

<!-- 替换待处理的请求 -->
<div hx-get="/api/data" hx-sync="this:replace">
    只执行最新的请求
</div>
```

### 带外交换

用单个响应更新多个页面区域：

```html
<!-- 服务器响应 -->
<div id="main-content">
    更新的主内容
</div>

<!-- 这些元素被带外交换 -->
<div id="notification" hx-swap-oob="true">
    新通知出现了！
</div>

<span id="user-count" hx-swap-oob="innerHTML">
    42 位用户在线
</span>

<div id="sidebar" hx-swap-oob="beforeend">
    <p>新侧边栏项目</p>
</div>
```

## WebSocket

HTMX 通过 WebSocket 扩展支持实时双向通信：

```html
<!-- 包含 WebSocket 扩展 -->
<script src="https://unpkg.com/htmx-ext-ws@2.0.0/ws.js"></script>

<!-- 建立 WebSocket 连接 -->
<div hx-ext="ws" ws-connect="/chat">
    <!-- 从服务器接收的消息显示在这里 -->
    <div id="chat-messages">
        <!-- 服务器发送 HTML 定位此元素 -->
    </div>

    <!-- 表单通过 WebSocket 发送消息 -->
    <form ws-send>
        <input name="message" placeholder="输入消息..." />
        <button type="submit">发送</button>
    </form>
</div>
```

### WebSocket 事件

```javascript
// WebSocket 消息发送前
document.body.addEventListener('htmx:wsBeforeSend', (event) => {
    console.log('正在发送:', event.detail.message);
});

// WebSocket 消息发送后
document.body.addEventListener('htmx:wsAfterSend', (event) => {
    console.log('已发送:', event.detail.message);
});

// WebSocket 连接打开时
document.body.addEventListener('htmx:wsOpen', (event) => {
    console.log('WebSocket 已连接');
});

// WebSocket 连接关闭时
document.body.addEventListener('htmx:wsClose', (event) => {
    console.log('WebSocket 已断开');
});
```

### WebSocket 服务器响应

服务器应该发送 HTMX 可以交换到页面的 HTML：

```html
<!-- 服务器通过 WebSocket 发送此 HTML -->
<div id="chat-messages" hx-swap-oob="beforeend">
    <div class="message">
        <strong>User123:</strong> 大家好！
    </div>
</div>
```

## 服务器发送事件（SSE）

用于从服务器到客户端的单向实时更新：

```html
<!-- 包含 SSE 扩展 -->
<script src="https://unpkg.com/htmx-ext-sse@2.2.1/sse.js"></script>

<!-- 连接到 SSE 端点 -->
<div hx-ext="sse" sse-connect="/events">
    <!-- 收到 'message' 事件时交换内容 -->
    <div sse-swap="message">
        等待消息...
    </div>

    <!-- 不同事件类型 -->
    <div sse-swap="notification">
        通知显示在这里
    </div>

    <!-- SSE 事件时触发 HTMX 请求 -->
    <div hx-get="/api/data" hx-trigger="sse:data-update">
        data-update 事件触发时刷新
    </div>
</div>
```

### SSE 服务器实现（Node.js 示例）

```javascript
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 发送 message 事件
    res.write('event: message\n');
    res.write('data: <div>收到新消息！</div>\n\n');

    // 发送 notification 事件
    res.write('event: notification\n');
    res.write('data: <span class="badge">3</span>\n\n');
});
```

## 与后端框架集成

HTMX 可以与任何返回 HTML 的后端无缝协作。以下是流行框架的模式：

### Express.js (Node.js)

```javascript
const express = require('express');
const app = express();

// 常规页面加载
app.get('/users', (req, res) => {
    const users = getUsers();

    // 检查是否是 HTMX 请求
    if (req.headers['hx-request']) {
        // 为 HTMX 返回部分 HTML
        res.send(renderUserList(users));
    } else {
        // 为普通请求返回完整页面
        res.send(renderFullPage(users));
    }
});

// HTMX 专用端点
app.delete('/users/:id', (req, res) => {
    deleteUser(req.params.id);

    // 为删除交换返回空响应
    res.send('');
});
```

### Django (Python)

```python
from django.http import HttpResponse
from django.shortcuts import render

def user_list(request):
    users = User.objects.all()

    # 检查 HTMX 请求
    if request.headers.get('HX-Request'):
        return render(request, 'partials/user_list.html', {'users': users})

    return render(request, 'users/index.html', {'users': users})

def delete_user(request, user_id):
    User.objects.get(id=user_id).delete()
    return HttpResponse('')
```

### Laravel (PHP)

```php
class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::all();

        if ($request->header('HX-Request')) {
            return view('partials.user-list', compact('users'));
        }

        return view('users.index', compact('users'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response('');
    }
}
```

### Flask (Python)

```python
from flask import Flask, request, render_template

app = Flask(__name__)

@app.route('/users')
def users():
    users = get_users()

    if request.headers.get('HX-Request'):
        return render_template('partials/user_list.html', users=users)

    return render_template('users/index.html', users=users)

@app.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    remove_user(id)
    return ''
```

### Spring Boot (Java)

```java
@Controller
public class UserController {

    @GetMapping("/users")
    public String users(Model model,
                       @RequestHeader(value = "HX-Request", required = false) String hxRequest) {
        model.addAttribute("users", userService.findAll());

        if (hxRequest != null) {
            return "partials/user-list";
        }

        return "users/index";
    }

    @DeleteMapping("/users/{id}")
    @ResponseBody
    public String deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return "";
    }
}
```

## 与 SPA 框架的比较

### HTMX vs React/Vue/Angular

| 方面 | HTMX | SPA 框架 |
|------|------|----------|
| **包大小** | ~14KB | 30KB - 200KB+ |
| **学习曲线** | 低（HTML 知识） | 中等到高 |
| **构建工具** | 可选 | 必需 |
| **状态管理** | 服务器端 | 客户端 |
| **SEO** | 原生支持 | 需要 SSR/SSG |
| **初始加载** | 快 | 较慢 |
| **交互性** | 良好 | 优秀 |
| **离线支持** | 有限 | 更好 |
| **开发者工具** | 浏览器 DevTools | 框架特定 |

### 何时选择 HTMX

HTMX 在这些场景中表现出色：

- **以内容为中心的网站**，带有选择性交互
- **CRUD 应用程序**和管理后台
- **现有服务器渲染应用程序**的渐进增强
- **拥有强大后端专业知识的团队**，希望最小化前端复杂性
- **优先考虑简洁性**和可维护性的项目
- **SEO 关键应用程序**，服务器渲染内容很重要

### 何时选择 SPA 框架

SPA 框架可能更适合：

- **高度交互的应用程序**，如协作编辑器或游戏
- **离线优先应用程序**，需要大量客户端状态
- **复杂的客户端数据操作**和转换
- 通过 React Native 或类似技术的**移动应用程序**
- **拥有强大前端专业知识**和现有组件库的团队

### 混合方法

HTMX 可以与 JavaScript 框架共存：

```html
<!-- Alpine.js 用于本地交互，HTMX 用于服务器通信 -->
<div x-data="{ open: false }">
    <button @click="open = !open">切换</button>

    <div x-show="open">
        <button hx-get="/api/details" hx-target="#details">
            从服务器加载
        </button>
        <div id="details"></div>
    </div>
</div>
```

## 实际示例

### 实时搜索

```html
<input
    type="search"
    name="q"
    placeholder="搜索用户..."
    hx-get="/api/search"
    hx-trigger="input changed delay:300ms, search"
    hx-target="#search-results"
    hx-indicator="#search-spinner" />

<span id="search-spinner" class="htmx-indicator">搜索中...</span>

<div id="search-results">
    <!-- 结果显示在这里 -->
</div>
```

### 无限滚动

```html
<div id="item-list">
    <div class="item">项目 1</div>
    <div class="item">项目 2</div>

    <!-- 用于加载更多的哨兵元素 -->
    <div
        hx-get="/api/items?page=2"
        hx-trigger="revealed"
        hx-swap="outerHTML"
        hx-indicator=".load-indicator">
        <div class="load-indicator htmx-indicator">加载更多...</div>
    </div>
</div>
```

服务器响应包含下一个哨兵：

```html
<div class="item">项目 11</div>
<div class="item">项目 12</div>
<div
    hx-get="/api/items?page=3"
    hx-trigger="revealed"
    hx-swap="outerHTML">
    <div class="htmx-indicator">加载更多...</div>
</div>
```

### 内联编辑

```html
<!-- 显示模式 -->
<div id="user-name-123" class="editable">
    <span>张三</span>
    <button hx-get="/api/users/123/edit" hx-target="#user-name-123">
        编辑
    </button>
</div>
```

编辑表单响应：

```html
<form
    hx-put="/api/users/123/name"
    hx-target="#user-name-123"
    hx-swap="outerHTML">
    <input name="name" value="张三" autofocus />
    <button type="submit">保存</button>
    <button type="button"
            hx-get="/api/users/123/name"
            hx-target="#user-name-123">
        取消
    </button>
</form>
```

### 表单验证

```html
<form hx-post="/api/register" hx-target="#form-messages">
    <div class="field">
        <label for="email">邮箱</label>
        <input
            type="email"
            id="email"
            name="email"
            hx-post="/api/validate/email"
            hx-trigger="blur changed"
            hx-target="next .validation" />
        <span class="validation"></span>
    </div>

    <div class="field">
        <label for="username">用户名</label>
        <input
            type="text"
            id="username"
            name="username"
            hx-post="/api/validate/username"
            hx-trigger="keyup changed delay:500ms"
            hx-target="next .validation" />
        <span class="validation"></span>
    </div>

    <button type="submit">注册</button>
</form>

<div id="form-messages"></div>
```

### 模态对话框

```html
<button
    hx-get="/api/modals/confirm-delete"
    hx-target="#modal-container"
    hx-swap="innerHTML">
    删除项目
</button>

<div id="modal-container"></div>
```

模态响应：

```html
<div class="modal-backdrop" hx-on:click="htmx.remove(this.parentElement)">
    <div class="modal" hx-on:click="event.stopPropagation()">
        <h2>确认删除</h2>
        <p>你确定要删除此项目吗？</p>

        <button
            hx-delete="/api/items/123"
            hx-target="#item-123"
            hx-swap="delete"
            hx-on::after-request="htmx.remove(document.getElementById('modal-container').firstChild)">
            确认
        </button>

        <button hx-on:click="htmx.remove(this.closest('.modal-backdrop'))">
            取消
        </button>
    </div>
</div>
```

## 浏览器历史和导航

### 历史管理

```html
<!-- 将 URL 推送到浏览器历史 -->
<a hx-get="/page2" hx-target="#content" hx-push-url="true">
    转到页面 2
</a>

<!-- 与请求路径不同的自定义 URL -->
<button
    hx-get="/api/users/123/profile"
    hx-target="#content"
    hx-push-url="/users/123">
    查看个人资料
</button>

<!-- 替换当前 URL 而不添加历史记录 -->
<a hx-get="/page3" hx-target="#content" hx-replace-url="true">
    替换为页面 3
</a>

<!-- 阻止历史修改 -->
<div hx-get="/api/live-data" hx-trigger="every 5s" hx-history="false">
    不影响历史的轮询
</div>
```

### 增强链接和表单

使用 `hx-boost` 将传统导航转换为 AJAX：

```html
<nav hx-boost="true">
    <!-- 这些链接使用带历史支持的 AJAX -->
    <a href="/about">关于</a>
    <a href="/contact">联系</a>
    <a href="/products">产品</a>
</nav>

<main id="content">
    <!-- 页面内容在这里交换 -->
</main>
```

## 事件和 JavaScript 集成

### HTMX 事件

```javascript
// 请求之前
document.body.addEventListener('htmx:beforeRequest', (event) => {
    console.log('请求开始:', event.detail.pathInfo.requestPath);
});

// 收到响应后
document.body.addEventListener('htmx:afterRequest', (event) => {
    console.log('请求完成');
});

// 内容交换后
document.body.addEventListener('htmx:afterSwap', (event) => {
    console.log('内容已交换到:', event.detail.target);
});

// 处理错误
document.body.addEventListener('htmx:responseError', (event) => {
    console.error('请求失败:', event.detail.xhr.status);
});

// 发送前修改请求
document.body.addEventListener('htmx:configRequest', (event) => {
    event.detail.headers['X-Custom-Header'] = 'value';
});
```

### 程序化控制

```javascript
// 触发元素的 HTMX 行为
htmx.trigger('#my-element', 'click');

// 直接发起 AJAX 请求
htmx.ajax('GET', '/api/data', {
    target: '#result',
    swap: 'innerHTML'
});

// 处理新内容的 HTMX 属性
htmx.process(document.getElementById('new-content'));

// 从元素移除 HTMX
htmx.remove(document.getElementById('old-element'));
```

### 内联事件处理器

```html
<!-- 使用 hx-on 进行内联处理 -->
<button
    hx-post="/api/action"
    hx-on::before-request="console.log('开始请求')"
    hx-on::after-request="console.log('请求完成')">
    操作
</button>

<!-- htmx 事件的简写 -->
<div hx-get="/api/data" hx-on:htmx:after-swap="initializeComponent(this)">
    内容
</div>
```

## 安全最佳实践

### CSRF 保护

```html
<!-- 在 meta 标签中包含 CSRF 令牌 -->
<meta name="csrf-token" content="{{ csrf_token }}">

<script>
    document.body.addEventListener('htmx:configRequest', (event) => {
        event.detail.headers['X-CSRF-Token'] =
            document.querySelector('meta[name="csrf-token"]').content;
    });
</script>
```

### 输入验证

始终在服务器端验证。永远不要信任 `hx-vals` 或任何客户端数据：

```javascript
// 服务器端验证（Express 示例）
app.post('/api/users', (req, res) => {
    const { username, email } = req.body;

    // 始终在服务器端验证
    if (!isValidUsername(username)) {
        return res.status(400).send('<div class="error">无效的用户名</div>');
    }

    if (!isValidEmail(email)) {
        return res.status(400).send('<div class="error">无效的邮箱</div>');
    }

    // 处理有效数据
});
```

### 内容安全策略

如果使用严格的 CSP，你可能需要配置 HTMX：

```javascript
// 如果 CSP 阻止内联事件处理器，禁用它们
htmx.config.allowScriptTags = false;
htmx.config.allowEval = false;
```

## 配置

### 全局配置

```javascript
htmx.config.historyCacheSize = 20;     // 历史缓存条目
htmx.config.defaultSwapStyle = 'innerHTML';
htmx.config.defaultSwapDelay = 0;
htmx.config.defaultSettleDelay = 20;
htmx.config.includeIndicatorStyles = true;
htmx.config.timeout = 0;               // 请求超时（0 = 无）
htmx.config.wsReconnectDelay = 'full-jitter';
htmx.config.scrollBehavior = 'smooth';
```

### 属性继承

HTMX 属性沿 DOM 树向下继承：

```html
<div hx-target="#results" hx-swap="innerHTML">
    <!-- 所有子元素继承 target 和 swap -->
    <button hx-get="/api/users">用户</button>
    <button hx-get="/api/products">产品</button>
    <button hx-get="/api/orders">订单</button>
</div>
```

使用 `hx-disinherit` 禁用继承：

```html
<div hx-target="#results">
    <button hx-get="/api/data" hx-disinherit="hx-target">
        使用默认目标
    </button>
</div>
```

## 总结

HTMX 提供了一种令人耳目一新的 Web 开发方法，它拥抱 HTML 和 HTTP 的优势，而不是试图绕过它们。通过用强大的属性扩展 HTML，HTMX 使开发者能够构建动态、交互式的应用程序，而无需现代 JavaScript 框架的复杂性。

关键要点：

- **简洁性**：使用 HTML 属性添加交互性，无需 JavaScript
- **以服务器为中心**：服务器返回 HTML，保持状态管理简单
- **渐进式**：增强现有应用程序而无需重写
- **轻量级**：小体积，无需构建步骤
- **灵活性**：与任何后端技术兼容

无论是构建新应用程序还是增强现有应用程序，HTMX 都提供了一条通往现代、交互式 Web 体验的务实之路，同时控制复杂性。

## 延伸资源

- [HTMX 官方文档](https://htmx.org/docs/)
- [HTMX 示例](https://htmx.org/examples/)
- [Hypermedia Systems](https://hypermedia.systems/) - HTMX 创作者的免费在线书籍
- [HTMX Discord 社区](https://htmx.org/discord)
- [HTMX GitHub 仓库](https://github.com/bigskysoftware/htmx)
