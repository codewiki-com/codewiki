---
title: WSGI 与 ASGI
description: 深入理解Python Web服务器网关接口，掌握WSGI和ASGI协议原理、主流服务器配置与生产环境部署最佳实践
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - WSGI
  - ASGI
  - Gunicorn
  - Uvicorn
  - 部署
status: imported
origin: old/src/content/docs/python/wsgi-asgi.zh.md
divergence: 0.188
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Python
  subcategory: Web开发
  order: 26
  lastUpdated: 2026-01-07
---

WSGI（Web Server Gateway Interface）和 ASGI（Asynchronous Server Gateway Interface）是 Python Web 应用与 Web 服务器之间通信的标准协议。理解这两个协议对于构建高性能、可扩展的 Python Web 应用至关重要。

## 概念解释

### 什么是 WSGI

WSGI（Web Server Gateway Interface）是 Python 应用程序与 Web 服务器之间的标准接口，由 PEP 3333 定义。它解决了 Python Web 框架与 Web 服务器之间的兼容性问题，使得任何符合 WSGI 规范的框架都能运行在任何符合 WSGI 规范的服务器上。

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP 请求流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   客户端 ──► Nginx/Apache ──► Gunicorn ──► Flask/Django    │
│     │              │              │              │          │
│   浏览器       反向代理      WSGI 服务器    Web 框架        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 什么是 ASGI

ASGI（Asynchronous Server Gateway Interface）是 WSGI 的精神继承者，专为异步 Python Web 应用设计。它支持 HTTP、WebSocket、HTTP/2 等多种协议，是构建现代异步 Web 应用的基础。

```
┌─────────────────────────────────────────────────────────────┐
│                     ASGI 协议支持                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ┌─────────────┐                                │
│              │   HTTP/1.1  │                                │
│              └──────┬──────┘                                │
│                     │                                       │
│   ┌─────────────────┼─────────────────┐                    │
│   │                 │                 │                    │
│   ▼                 ▼                 ▼                    │
│ ┌───────┐     ┌──────────┐     ┌──────────┐              │
│ │HTTP/2 │     │WebSocket │     │  其他协议 │              │
│ └───────┘     └──────────┘     └──────────┘              │
│                     │                                       │
│                     ▼                                       │
│              ┌─────────────┐                                │
│              │ ASGI 应用   │                                │
│              │ FastAPI等   │                                │
│              └─────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### WSGI vs ASGI 对比

| 特性 | WSGI | ASGI |
|------|------|------|
| **定义规范** | PEP 3333 | ASGI Spec |
| **同步/异步** | 同步阻塞 | 异步非阻塞 |
| **协议支持** | HTTP/1.1 | HTTP/1.1, HTTP/2, WebSocket |
| **并发模型** | 多进程/多线程 | 协程 + 事件循环 |
| **典型框架** | Flask, Django | FastAPI, Starlette, Django 3.0+ |
| **典型服务器** | Gunicorn, uWSGI | Uvicorn, Hypercorn, Daphne |
| **适用场景** | 传统 Web 应用 | 实时应用、高并发场景 |

### 历史背景

```
┌────────────────────────────────────────────────────────────┐
│                    Python Web 发展历程                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  2003年: PEP 333 提出 WSGI 规范                            │
│    │                                                       │
│  2010年: PEP 3333 更新支持 Python 3                        │
│    │                                                       │
│  2016年: Django Channels 提出 ASGI 概念                    │
│    │                                                       │
│  2018年: ASGI 3.0 规范正式发布                             │
│    │                                                       │
│  2019年: FastAPI 发布，ASGI 生态爆发                       │
│    │                                                       │
│  2020年: Django 3.0 原生支持 ASGI                          │
│    │                                                       │
│  现在: WSGI 与 ASGI 并存，各有适用场景                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 核心原理

### WSGI 工作原理

WSGI 定义了一个简单的可调用对象接口：

```python
def application(environ, start_response):
    """
    WSGI 应用程序接口

    参数:
        environ: 包含请求信息的字典
        start_response: 用于发送响应状态和头部的回调函数

    返回:
        可迭代的响应体
    """
    # environ 包含的关键信息
    # REQUEST_METHOD: 请求方法 (GET, POST 等)
    # PATH_INFO: 请求路径
    # QUERY_STRING: 查询字符串
    # CONTENT_TYPE: 请求内容类型
    # CONTENT_LENGTH: 请求体长度
    # HTTP_*: HTTP 头部信息
    # wsgi.input: 请求体的文件对象
    # wsgi.errors: 错误输出流

    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)

    return [b'Hello, World!']
```

### WSGI 请求处理流程

```
┌─────────────────────────────────────────────────────────────┐
│                   WSGI 请求处理流程                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Web 服务器接收 HTTP 请求                                │
│     │                                                       │
│     ▼                                                       │
│  2. 构建 environ 字典                                       │
│     │  - 解析 HTTP 头部                                     │
│     │  - 设置 WSGI 变量                                     │
│     │  - 包装请求体                                         │
│     ▼                                                       │
│  3. 调用 WSGI 应用                                          │
│     │  application(environ, start_response)                 │
│     ▼                                                       │
│  4. 应用处理请求                                            │
│     │  - 路由匹配                                           │
│     │  - 业务逻辑处理                                       │
│     │  - 调用 start_response                                │
│     ▼                                                       │
│  5. 返回响应体迭代器                                        │
│     │                                                       │
│     ▼                                                       │
│  6. 服务器发送 HTTP 响应                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### ASGI 工作原理

ASGI 使用异步协程处理请求：

```python
async def application(scope, receive, send):
    """
    ASGI 应用程序接口

    参数:
        scope: 连接元数据字典
        receive: 接收消息的异步函数
        send: 发送消息的异步函数
    """
    # scope 包含的关键信息
    # type: 连接类型 ('http', 'websocket', 'lifespan')
    # asgi: ASGI 版本信息
    # http_version: HTTP 版本
    # method: 请求方法
    # path: 请求路径
    # query_string: 查询字符串 (bytes)
    # headers: 头部列表 [(name, value), ...]

    if scope['type'] == 'http':
        # 接收请求体
        body = b''
        while True:
            message = await receive()
            body += message.get('body', b'')
            if not message.get('more_body', False):
                break

        # 发送响应
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [(b'content-type', b'text/plain')],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Hello, World!',
        })
```

### ASGI 消息类型

```
┌─────────────────────────────────────────────────────────────┐
│                    ASGI 消息类型                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP 连接 (scope['type'] == 'http')                        │
│  ├── http.request        # 请求体数据                       │
│  ├── http.response.start # 响应开始 (状态码, 头部)          │
│  ├── http.response.body  # 响应体数据                       │
│  └── http.disconnect     # 客户端断开                       │
│                                                             │
│  WebSocket 连接 (scope['type'] == 'websocket')              │
│  ├── websocket.connect   # 连接请求                         │
│  ├── websocket.accept    # 接受连接                         │
│  ├── websocket.receive   # 接收消息                         │
│  ├── websocket.send      # 发送消息                         │
│  └── websocket.close     # 关闭连接                         │
│                                                             │
│  生命周期 (scope['type'] == 'lifespan')                     │
│  ├── lifespan.startup    # 应用启动                         │
│  ├── lifespan.shutdown   # 应用关闭                         │
│  └── lifespan.startup.complete # 启动完成                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 同步 vs 异步处理模型

```
┌─────────────────────────────────────────────────────────────┐
│                 WSGI 同步模型 (阻塞式)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Worker 1: [请求1处理中...等待数据库...完成] ───► 空闲       │
│  Worker 2: [空闲] ───► [请求2处理中...等待API...完成]       │
│  Worker 3: [空闲...空闲...空闲] ───► [请求3]                │
│                                                             │
│  特点: 每个请求占用一个 worker，I/O 等待时 worker 阻塞      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 ASGI 异步模型 (非阻塞式)                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  事件循环:                                                  │
│    t1: [请求1开始] [请求2开始] [请求3开始]                  │
│    t2: [请求1等待DB] [处理请求2] [处理请求3]                │
│    t3: [DB返回,继续1] [请求2等待API] [完成请求3]            │
│    t4: [完成请求1] [API返回,完成2]                          │
│                                                             │
│  特点: 单线程处理多个请求，I/O 等待时切换处理其他请求       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 核心要点

### 主流 WSGI 服务器

#### Gunicorn (Green Unicorn)

Gunicorn 是最流行的 Python WSGI HTTP 服务器，以稳定性和易用性著称。

```bash
# 安装
pip install gunicorn

# 基本启动
gunicorn myapp:app

# 常用配置
gunicorn myapp:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --worker-class sync \
    --timeout 30 \
    --keepalive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
```

**Gunicorn Worker 类型:**

| Worker 类型 | 说明 | 适用场景 |
|------------|------|---------|
| `sync` | 同步 worker (默认) | 一般 Web 应用 |
| `gthread` | 线程 worker | I/O 密集型应用 |
| `gevent` | gevent 协程 | 高并发 I/O |
| `eventlet` | eventlet 协程 | 高并发 I/O |
| `uvicorn.workers.UvicornWorker` | ASGI worker | 异步应用 |

#### uWSGI

uWSGI 是功能强大的应用服务器，支持多种协议和语言。

```bash
# 安装
pip install uwsgi

# 基本启动
uwsgi --http :8000 --wsgi-file myapp.py --callable app

# INI 配置文件 (uwsgi.ini)
```

```ini
[uwsgi]
# 基本配置
module = myapp:app
master = true
processes = 4
threads = 2

# Socket 配置
socket = /tmp/uwsgi.sock
chmod-socket = 660

# 性能调优
enable-threads = true
single-interpreter = true
lazy-apps = true

# 内存管理
max-requests = 1000
reload-on-rss = 256

# 日志
logto = /var/log/uwsgi/myapp.log
log-maxsize = 10000000
```

### 主流 ASGI 服务器

#### Uvicorn

Uvicorn 是基于 uvloop 和 httptools 的高性能 ASGI 服务器。

```bash
# 安装
pip install uvicorn[standard]

# 基本启动
uvicorn myapp:app

# 生产环境配置
uvicorn myapp:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --loop uvloop \
    --http httptools \
    --timeout-keep-alive 30 \
    --access-log \
    --log-level info
```

**Uvicorn 配置选项:**

```python
# 程序化启动
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "myapp:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools",
        reload=False,  # 生产环境关闭
        access_log=True,
        log_level="info",
        timeout_keep_alive=30,
        limit_concurrency=1000,
        limit_max_requests=10000,
    )
```

#### Hypercorn

Hypercorn 支持 HTTP/1, HTTP/2 和 HTTP/3，是功能最全面的 ASGI 服务器。

```bash
# 安装
pip install hypercorn

# 基本启动
hypercorn myapp:app

# 启用 HTTP/2
hypercorn myapp:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --keep-alive 30 \
    --access-log - \
    --error-log -
```

**Hypercorn 配置文件 (hypercorn.toml):**

```toml
bind = ["0.0.0.0:8000"]
workers = 4
worker_class = "asyncio"
keep_alive_timeout = 30
graceful_timeout = 30

# HTTP/2 配置
h2_max_concurrent_streams = 100
h2_max_header_list_size = 65536

# TLS 配置
# certfile = "/path/to/cert.pem"
# keyfile = "/path/to/key.pem"

# 日志
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

#### Daphne

Daphne 是 Django Channels 的官方 ASGI 服务器。

```bash
# 安装
pip install daphne

# 启动 Django ASGI 应用
daphne -b 0.0.0.0 -p 8000 myproject.asgi:application

# 启动 WebSocket 支持
daphne -b 0.0.0.0 -p 8000 --websocket_timeout 60 myproject.asgi:application
```

### 服务器选择指南

```
┌─────────────────────────────────────────────────────────────┐
│                    服务器选择决策树                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  你的应用是异步的吗？                                       │
│  │                                                          │
│  ├── 是 (FastAPI, Starlette, async Django)                 │
│  │   │                                                      │
│  │   ├── 需要 HTTP/2 或 HTTP/3？                           │
│  │   │   │                                                  │
│  │   │   ├── 是 ──► Hypercorn                              │
│  │   │   │                                                  │
│  │   │   └── 否 ──► Uvicorn (推荐)                         │
│  │   │                                                      │
│  │   └── 使用 Django Channels？                            │
│  │       │                                                  │
│  │       └── 是 ──► Daphne                                 │
│  │                                                          │
│  └── 否 (Flask, 同步 Django)                               │
│      │                                                      │
│      ├── 需要复杂配置和协议支持？                          │
│      │   │                                                  │
│      │   ├── 是 ──► uWSGI                                  │
│      │   │                                                  │
│      │   └── 否 ──► Gunicorn (推荐)                        │
│      │                                                      │
│      └── 需要在 Gunicorn 中运行异步代码？                  │
│          │                                                  │
│          └── 是 ──► Gunicorn + UvicornWorker               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 代码示例

### 从零实现 WSGI 应用

```python
"""
minimal_wsgi.py - 最小化 WSGI 应用实现
"""

def simple_app(environ, start_response):
    """最简单的 WSGI 应用"""
    status = '200 OK'
    headers = [('Content-Type', 'text/html; charset=utf-8')]
    start_response(status, headers)
    return [b'<h1>Hello, WSGI!</h1>']


class WSGIApplication:
    """带路由的 WSGI 应用类"""

    def __init__(self):
        self.routes = {}

    def route(self, path):
        """路由装饰器"""
        def decorator(func):
            self.routes[path] = func
            return func
        return decorator

    def __call__(self, environ, start_response):
        """WSGI 入口点"""
        path = environ.get('PATH_INFO', '/')
        method = environ.get('REQUEST_METHOD', 'GET')

        # 查找路由
        handler = self.routes.get(path)

        if handler:
            try:
                response = handler(environ)
                status = '200 OK'
                headers = [('Content-Type', 'text/html; charset=utf-8')]
                start_response(status, headers)
                return [response.encode('utf-8')]
            except Exception as e:
                status = '500 Internal Server Error'
                headers = [('Content-Type', 'text/plain')]
                start_response(status, headers)
                return [f'Error: {str(e)}'.encode('utf-8')]
        else:
            status = '404 Not Found'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Not Found']


# 创建应用实例
app = WSGIApplication()


@app.route('/')
def index(environ):
    return '<h1>Welcome to My WSGI App!</h1>'


@app.route('/hello')
def hello(environ):
    # 获取查询参数
    query_string = environ.get('QUERY_STRING', '')
    params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
    name = params.get('name', 'World')
    return f'<h1>Hello, {name}!</h1>'


@app.route('/info')
def info(environ):
    """显示请求信息"""
    info_items = [
        f"<li>Method: {environ.get('REQUEST_METHOD')}</li>",
        f"<li>Path: {environ.get('PATH_INFO')}</li>",
        f"<li>Query: {environ.get('QUERY_STRING')}</li>",
        f"<li>Server: {environ.get('SERVER_NAME')}:{environ.get('SERVER_PORT')}</li>",
        f"<li>User-Agent: {environ.get('HTTP_USER_AGENT', 'Unknown')}</li>",
    ]
    return f'<h1>Request Info</h1><ul>{"".join(info_items)}</ul>'


# 使用 wsgiref 测试服务器
if __name__ == '__main__':
    from wsgiref.simple_server import make_server

    print("Starting WSGI server on http://localhost:8000")
    server = make_server('localhost', 8000, app)
    server.serve_forever()
```

### 从零实现 ASGI 应用

```python
"""
minimal_asgi.py - 最小化 ASGI 应用实现
"""

import json
from urllib.parse import parse_qs


async def simple_app(scope, receive, send):
    """最简单的 ASGI 应用"""
    assert scope['type'] == 'http'

    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [(b'content-type', b'text/html; charset=utf-8')],
    })
    await send({
        'type': 'http.response.body',
        'body': b'<h1>Hello, ASGI!</h1>',
    })


class ASGIApplication:
    """带路由和中间件的 ASGI 应用类"""

    def __init__(self):
        self.routes = {}
        self.middlewares = []

    def route(self, path, methods=None):
        """路由装饰器"""
        methods = methods or ['GET']
        def decorator(func):
            self.routes[(path, tuple(methods))] = func
            return func
        return decorator

    def middleware(self, func):
        """中间件装饰器"""
        self.middlewares.append(func)
        return func

    async def __call__(self, scope, receive, send):
        """ASGI 入口点"""
        if scope['type'] == 'lifespan':
            await self._handle_lifespan(scope, receive, send)
        elif scope['type'] == 'http':
            await self._handle_http(scope, receive, send)
        elif scope['type'] == 'websocket':
            await self._handle_websocket(scope, receive, send)

    async def _handle_lifespan(self, scope, receive, send):
        """处理应用生命周期事件"""
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                print("Application starting up...")
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                print("Application shutting down...")
                await send({'type': 'lifespan.shutdown.complete'})
                return

    async def _handle_http(self, scope, receive, send):
        """处理 HTTP 请求"""
        path = scope['path']
        method = scope['method']

        # 查找路由
        handler = None
        for (route_path, route_methods), route_handler in self.routes.items():
            if route_path == path and method in route_methods:
                handler = route_handler
                break

        if handler:
            # 读取请求体
            body = b''
            while True:
                message = await receive()
                body += message.get('body', b'')
                if not message.get('more_body', False):
                    break

            # 构建请求上下文
            request = Request(scope, body)

            try:
                response = await handler(request)
                await self._send_response(send, response)
            except Exception as e:
                await self._send_error(send, 500, str(e))
        else:
            await self._send_error(send, 404, 'Not Found')

    async def _handle_websocket(self, scope, receive, send):
        """处理 WebSocket 连接"""
        await send({'type': 'websocket.close', 'code': 1000})

    async def _send_response(self, send, response):
        """发送响应"""
        if isinstance(response, dict):
            body = json.dumps(response).encode('utf-8')
            content_type = b'application/json'
        elif isinstance(response, str):
            body = response.encode('utf-8')
            content_type = b'text/html; charset=utf-8'
        else:
            body = response
            content_type = b'text/plain'

        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [(b'content-type', content_type)],
        })
        await send({
            'type': 'http.response.body',
            'body': body,
        })

    async def _send_error(self, send, status, message):
        """发送错误响应"""
        await send({
            'type': 'http.response.start',
            'status': status,
            'headers': [(b'content-type', b'application/json')],
        })
        await send({
            'type': 'http.response.body',
            'body': json.dumps({'error': message}).encode('utf-8'),
        })


class Request:
    """请求对象封装"""

    def __init__(self, scope, body):
        self.scope = scope
        self._body = body

    @property
    def method(self):
        return self.scope['method']

    @property
    def path(self):
        return self.scope['path']

    @property
    def query_params(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        return parse_qs(query_string)

    @property
    def headers(self):
        return dict(self.scope.get('headers', []))

    @property
    def body(self):
        return self._body

    def json(self):
        return json.loads(self._body.decode('utf-8'))


# 创建应用实例
app = ASGIApplication()


@app.route('/')
async def index(request):
    return '<h1>Welcome to My ASGI App!</h1>'


@app.route('/hello')
async def hello(request):
    name = request.query_params.get('name', ['World'])[0]
    return f'<h1>Hello, {name}!</h1>'


@app.route('/api/info', methods=['GET'])
async def api_info(request):
    """返回 JSON 格式的请求信息"""
    return {
        'method': request.method,
        'path': request.path,
        'query_params': request.query_params,
    }


@app.route('/api/echo', methods=['POST'])
async def api_echo(request):
    """回显 POST 数据"""
    try:
        data = request.json()
        return {'received': data}
    except json.JSONDecodeError:
        return {'error': 'Invalid JSON'}


# 使用 uvicorn 运行
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='localhost', port=8000)
```

### WSGI 中间件实现

```python
"""
wsgi_middleware.py - WSGI 中间件示例
"""

import time
import logging
from functools import wraps


class LoggingMiddleware:
    """日志中间件"""

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger(__name__)

    def __call__(self, environ, start_response):
        start_time = time.time()

        # 记录请求
        method = environ.get('REQUEST_METHOD', 'GET')
        path = environ.get('PATH_INFO', '/')

        # 捕获响应状态
        response_status = []

        def custom_start_response(status, headers, exc_info=None):
            response_status.append(status)
            return start_response(status, headers, exc_info)

        # 调用下一个中间件或应用
        response = self.app(environ, custom_start_response)

        # 记录响应
        duration = time.time() - start_time
        status = response_status[0] if response_status else 'Unknown'
        self.logger.info(f'{method} {path} - {status} - {duration:.3f}s')

        return response


class CORSMiddleware:
    """CORS 中间件"""

    def __init__(self, app, allow_origins=None, allow_methods=None, allow_headers=None):
        self.app = app
        self.allow_origins = allow_origins or ['*']
        self.allow_methods = allow_methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        self.allow_headers = allow_headers or ['Content-Type', 'Authorization']

    def __call__(self, environ, start_response):
        method = environ.get('REQUEST_METHOD', 'GET')

        # 处理预检请求
        if method == 'OPTIONS':
            response_headers = [
                ('Access-Control-Allow-Origin', ', '.join(self.allow_origins)),
                ('Access-Control-Allow-Methods', ', '.join(self.allow_methods)),
                ('Access-Control-Allow-Headers', ', '.join(self.allow_headers)),
                ('Access-Control-Max-Age', '86400'),
                ('Content-Length', '0'),
            ]
            start_response('204 No Content', response_headers)
            return [b'']

        # 包装 start_response 添加 CORS 头
        def cors_start_response(status, headers, exc_info=None):
            cors_headers = [
                ('Access-Control-Allow-Origin', ', '.join(self.allow_origins)),
            ]
            return start_response(status, headers + cors_headers, exc_info)

        return self.app(environ, cors_start_response)


class GZipMiddleware:
    """GZip 压缩中间件"""

    def __init__(self, app, minimum_size=500):
        self.app = app
        self.minimum_size = minimum_size

    def __call__(self, environ, start_response):
        # 检查客户端是否支持 gzip
        accept_encoding = environ.get('HTTP_ACCEPT_ENCODING', '')
        if 'gzip' not in accept_encoding:
            return self.app(environ, start_response)

        response_started = []
        response_headers = []

        def buffering_start_response(status, headers, exc_info=None):
            response_started.append(status)
            response_headers.extend(headers)
            # 返回一个空的 write 函数
            return lambda data: None

        # 收集响应体
        response_body = b''.join(self.app(environ, buffering_start_response))

        # 如果响应体足够大，进行压缩
        if len(response_body) >= self.minimum_size:
            import gzip
            compressed = gzip.compress(response_body)

            # 更新头部
            new_headers = [(k, v) for k, v in response_headers if k.lower() != 'content-length']
            new_headers.append(('Content-Length', str(len(compressed))))
            new_headers.append(('Content-Encoding', 'gzip'))

            start_response(response_started[0], new_headers)
            return [compressed]
        else:
            start_response(response_started[0], response_headers)
            return [response_body]


class ErrorHandlerMiddleware:
    """错误处理中间件"""

    def __init__(self, app, debug=False):
        self.app = app
        self.debug = debug

    def __call__(self, environ, start_response):
        try:
            return self.app(environ, start_response)
        except Exception as e:
            if self.debug:
                import traceback
                error_body = traceback.format_exc()
                content_type = 'text/plain'
            else:
                error_body = 'Internal Server Error'
                content_type = 'text/plain'

            status = '500 Internal Server Error'
            headers = [
                ('Content-Type', content_type),
                ('Content-Length', str(len(error_body))),
            ]
            start_response(status, headers)
            return [error_body.encode('utf-8')]


# 使用中间件包装应用
def create_app():
    """创建带中间件的应用"""

    def app(environ, start_response):
        start_response('200 OK', [('Content-Type', 'text/plain')])
        return [b'Hello, World!']

    # 按顺序包装中间件（最后添加的最先执行）
    app = ErrorHandlerMiddleware(app, debug=True)
    app = GZipMiddleware(app)
    app = CORSMiddleware(app)
    app = LoggingMiddleware(app)

    return app


application = create_app()
```

### ASGI 中间件实现

```python
"""
asgi_middleware.py - ASGI 中间件示例
"""

import time
import logging
import json
from typing import Callable, Awaitable


class LoggingMiddleware:
    """日志中间件"""

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger(__name__)

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        method = scope['method']
        path = scope['path']

        # 捕获响应状态
        status_code = None

        async def send_wrapper(message):
            nonlocal status_code
            if message['type'] == 'http.response.start':
                status_code = message['status']
            await send(message)

        await self.app(scope, receive, send_wrapper)

        duration = time.time() - start_time
        self.logger.info(f'{method} {path} - {status_code} - {duration:.3f}s')


class CORSMiddleware:
    """CORS 中间件"""

    def __init__(
        self,
        app,
        allow_origins=None,
        allow_methods=None,
        allow_headers=None,
        allow_credentials=False,
        max_age=86400,
    ):
        self.app = app
        self.allow_origins = allow_origins or ['*']
        self.allow_methods = allow_methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        self.allow_headers = allow_headers or ['*']
        self.allow_credentials = allow_credentials
        self.max_age = max_age

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        method = scope['method']
        headers = dict(scope.get('headers', []))
        origin = headers.get(b'origin', b'').decode('utf-8')

        # 检查是否允许该来源
        if '*' in self.allow_origins or origin in self.allow_origins:
            allowed_origin = origin if origin else '*'
        else:
            await self.app(scope, receive, send)
            return

        # 处理预检请求
        if method == 'OPTIONS':
            await self._send_preflight_response(send, allowed_origin)
            return

        # 添加 CORS 头到响应
        async def send_wrapper(message):
            if message['type'] == 'http.response.start':
                cors_headers = [
                    (b'access-control-allow-origin', allowed_origin.encode()),
                ]
                if self.allow_credentials:
                    cors_headers.append((b'access-control-allow-credentials', b'true'))

                message['headers'] = list(message.get('headers', [])) + cors_headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

    async def _send_preflight_response(self, send, origin):
        headers = [
            (b'access-control-allow-origin', origin.encode()),
            (b'access-control-allow-methods', ', '.join(self.allow_methods).encode()),
            (b'access-control-allow-headers', ', '.join(self.allow_headers).encode()),
            (b'access-control-max-age', str(self.max_age).encode()),
            (b'content-length', b'0'),
        ]
        if self.allow_credentials:
            headers.append((b'access-control-allow-credentials', b'true'))

        await send({
            'type': 'http.response.start',
            'status': 204,
            'headers': headers,
        })
        await send({
            'type': 'http.response.body',
            'body': b'',
        })


class RateLimitMiddleware:
    """速率限制中间件"""

    def __init__(self, app, max_requests=100, window_seconds=60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts = {}  # 简化的内存存储

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # 获取客户端 IP
        client = scope.get('client')
        client_ip = client[0] if client else 'unknown'

        # 检查速率限制
        current_time = time.time()
        if client_ip in self.request_counts:
            count, window_start = self.request_counts[client_ip]

            if current_time - window_start > self.window_seconds:
                # 窗口过期，重置
                self.request_counts[client_ip] = (1, current_time)
            elif count >= self.max_requests:
                # 超出限制
                await self._send_rate_limit_response(send)
                return
            else:
                self.request_counts[client_ip] = (count + 1, window_start)
        else:
            self.request_counts[client_ip] = (1, current_time)

        await self.app(scope, receive, send)

    async def _send_rate_limit_response(self, send):
        body = json.dumps({'error': 'Rate limit exceeded'}).encode()
        await send({
            'type': 'http.response.start',
            'status': 429,
            'headers': [
                (b'content-type', b'application/json'),
                (b'retry-after', str(self.window_seconds).encode()),
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': body,
        })


class AuthenticationMiddleware:
    """认证中间件"""

    def __init__(self, app, verify_token: Callable[[str], Awaitable[dict]] = None):
        self.app = app
        self.verify_token = verify_token or self._default_verify
        self.public_paths = {'/health', '/docs', '/openapi.json'}

    async def _default_verify(self, token: str) -> dict:
        # 默认的 token 验证逻辑
        if token == 'valid-token':
            return {'user_id': 1, 'username': 'test'}
        return None

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # 公开路径跳过认证
        if scope['path'] in self.public_paths:
            await self.app(scope, receive, send)
            return

        # 获取 Authorization 头
        headers = dict(scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode('utf-8')

        if not auth_header.startswith('Bearer '):
            await self._send_unauthorized(send, 'Missing or invalid Authorization header')
            return

        token = auth_header[7:]  # 移除 'Bearer ' 前缀

        # 验证 token
        user = await self.verify_token(token)
        if not user:
            await self._send_unauthorized(send, 'Invalid token')
            return

        # 将用户信息添加到 scope
        scope['user'] = user

        await self.app(scope, receive, send)

    async def _send_unauthorized(self, send, message):
        body = json.dumps({'error': message}).encode()
        await send({
            'type': 'http.response.start',
            'status': 401,
            'headers': [
                (b'content-type', b'application/json'),
                (b'www-authenticate', b'Bearer'),
            ],
        })
        await send({
            'type': 'http.response.body',
            'body': body,
        })


# 组合中间件
def create_middleware_stack(app):
    """创建中间件栈"""
    app = AuthenticationMiddleware(app)
    app = RateLimitMiddleware(app, max_requests=100, window_seconds=60)
    app = CORSMiddleware(app, allow_origins=['http://localhost:3000'])
    app = LoggingMiddleware(app)
    return app
```

### Flask 应用部署示例

```python
"""
flask_app.py - Flask 应用部署示例
"""

from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route('/')
def index():
    return jsonify({'message': 'Hello from Flask!'})


@app.route('/api/items', methods=['GET', 'POST'])
def items():
    if request.method == 'POST':
        data = request.get_json()
        return jsonify({'created': data}), 201
    return jsonify({'items': ['item1', 'item2', 'item3']})


@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})


# 开发环境
if __name__ == '__main__':
    app.run(debug=True)
```

**Gunicorn 配置文件 (gunicorn.conf.py):**

```python
"""
gunicorn.conf.py - Gunicorn 配置文件
"""

import multiprocessing

# 绑定地址
bind = '0.0.0.0:8000'

# Worker 配置
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'  # 或 'gthread', 'gevent', 'eventlet'
threads = 2  # 仅用于 gthread worker

# 超时设置
timeout = 30
keepalive = 2
graceful_timeout = 30

# 请求限制
max_requests = 1000
max_requests_jitter = 100

# 日志配置
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 进程名
proc_name = 'flask_app'

# 预加载应用
preload_app = True

# 生命周期钩子
def on_starting(server):
    print("Gunicorn is starting...")

def on_reload(server):
    print("Gunicorn is reloading...")

def worker_int(worker):
    print(f"Worker {worker.pid} received INT signal")

def worker_abort(worker):
    print(f"Worker {worker.pid} received SIGABRT signal")
```

**启动命令:**

```bash
# 使用配置文件启动
gunicorn flask_app:app -c gunicorn.conf.py

# 或使用命令行参数
gunicorn flask_app:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --worker-class gthread \
    --timeout 30 \
    --access-logfile - \
    --error-logfile -
```

### FastAPI 应用部署示例

```python
"""
fastapi_app.py - FastAPI 应用部署示例
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio

app = FastAPI(
    title="My FastAPI App",
    description="A sample FastAPI application",
    version="1.0.0",
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 数据模型
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float


class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float


# 模拟数据库
items_db = {}
item_counter = 0


@app.get("/")
async def root():
    return {"message": "Hello from FastAPI!"}


@app.get("/api/items", response_model=List[ItemResponse])
async def list_items():
    return [
        ItemResponse(id=id, **item.dict())
        for id, item in items_db.items()
    ]


@app.post("/api/items", response_model=ItemResponse, status_code=201)
async def create_item(item: Item):
    global item_counter
    item_counter += 1
    items_db[item_counter] = item
    return ItemResponse(id=item_counter, **item.dict())


@app.get("/api/items/{item_id}", response_model=ItemResponse)
async def get_item(item_id: int):
    if item_id not in items_db:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse(id=item_id, **items_db[item_id].dict())


@app.get("/health")
async def health():
    return {"status": "healthy"}


# 异步任务示例
@app.get("/api/slow")
async def slow_endpoint():
    """模拟慢速 I/O 操作"""
    await asyncio.sleep(2)
    return {"message": "This was slow!"}


# 生命周期事件
@app.on_event("startup")
async def startup_event():
    print("Application is starting up...")
    # 初始化数据库连接、缓存等


@app.on_event("shutdown")
async def shutdown_event():
    print("Application is shutting down...")
    # 清理资源


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Uvicorn 程序化配置:**

```python
"""
run_uvicorn.py - Uvicorn 程序化启动配置
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "fastapi_app:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools",
        reload=False,
        access_log=True,
        log_level="info",
        timeout_keep_alive=30,
        limit_concurrency=1000,
        limit_max_requests=10000,
        ssl_keyfile=None,  # 生产环境配置 SSL
        ssl_certfile=None,
    )
```

**使用 Gunicorn + UvicornWorker:**

```bash
# 在 Gunicorn 中运行 ASGI 应用
gunicorn fastapi_app:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 30 \
    --keepalive 5 \
    --access-logfile - \
    --error-logfile -
```

### Django ASGI 部署示例

```python
"""
myproject/asgi.py - Django ASGI 配置
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

# 获取 Django ASGI 应用
django_asgi_app = get_asgi_application()

# 如果使用 Django Channels
from myapp import routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                routing.websocket_urlpatterns
            )
        )
    ),
})
```

```python
"""
myapp/routing.py - WebSocket 路由配置
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

```python
"""
myapp/consumers.py - WebSocket 消费者
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # 加入房间组
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # 离开房间组
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # 发送消息到房间组
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        # 发送消息到 WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
```

## 最佳实践

### 生产环境部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    推荐的生产环境架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   互联网                                                    │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────┐                                               │
│  │  CDN    │ ◄── 静态资源缓存                              │
│  └────┬────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                       │
│  │  负载均衡器      │ ◄── SSL 终止、负载分发               │
│  │  (Nginx/HAProxy)│                                       │
│  └────────┬────────┘                                       │
│           │                                                 │
│     ┌─────┴─────┐                                          │
│     │           │                                          │
│     ▼           ▼                                          │
│  ┌──────┐   ┌──────┐                                      │
│  │App 1 │   │App 2 │ ◄── 应用服务器 (Gunicorn/Uvicorn)    │
│  └──┬───┘   └──┬───┘                                      │
│     │          │                                           │
│     └────┬─────┘                                           │
│          │                                                  │
│     ┌────┴────┐                                            │
│     │         │                                            │
│     ▼         ▼                                            │
│  ┌──────┐ ┌───────┐                                       │
│  │Redis │ │ 数据库 │ ◄── 数据层                            │
│  └──────┘ └───────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/myapp

upstream wsgi_app {
    # WSGI 应用 (Gunicorn)
    server 127.0.0.1:8000 weight=1;
    server 127.0.0.1:8001 weight=1;
    keepalive 32;
}

upstream asgi_app {
    # ASGI 应用 (Uvicorn)
    server 127.0.0.1:9000 weight=1;
    server 127.0.0.1:9001 weight=1;
    keepalive 32;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 静态文件
    location /static/ {
        alias /var/www/myapp/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 媒体文件
    location /media/ {
        alias /var/www/myapp/media/;
        expires 7d;
    }

    # WSGI 应用代理
    location /api/sync/ {
        proxy_pass http://wsgi_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # ASGI 应用代理
    location / {
        proxy_pass http://asgi_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 代理
    location /ws/ {
        proxy_pass http://asgi_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

### Systemd 服务配置

```ini
# /etc/systemd/system/gunicorn.service

[Unit]
Description=Gunicorn WSGI Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/myapp
Environment="PATH=/var/www/myapp/venv/bin"
ExecStart=/var/www/myapp/venv/bin/gunicorn \
    --workers 4 \
    --threads 2 \
    --worker-class gthread \
    --bind unix:/run/gunicorn.sock \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log \
    myapp.wsgi:application

ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/uvicorn.service

[Unit]
Description=Uvicorn ASGI Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/myapp
Environment="PATH=/var/www/myapp/venv/bin"
ExecStart=/var/www/myapp/venv/bin/uvicorn \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --loop uvloop \
    --http httptools \
    --access-log \
    --log-level info \
    myapp.asgi:application

ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### Docker 部署配置

```dockerfile
# Dockerfile - 多阶段构建

# 构建阶段
FROM python:3.11-slim as builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 创建虚拟环境并安装依赖
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 运行阶段
FROM python:3.11-slim as runtime

WORKDIR /app

# 复制虚拟环境
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令 (ASGI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# 启动命令 (WSGI)
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "main:app"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./static:/var/www/static:ro
    depends_on:
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Worker 数量计算

```python
"""
worker_calculator.py - Worker 数量计算工具
"""

import multiprocessing
import os


def calculate_workers():
    """
    计算推荐的 worker 数量

    一般规则:
    - CPU 密集型: workers = CPU 核心数
    - I/O 密集型: workers = (2 * CPU 核心数) + 1
    - 混合型: workers = CPU 核心数 + 1
    """
    cpu_count = multiprocessing.cpu_count()

    # 获取可用内存 (Linux)
    try:
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                if line.startswith('MemAvailable'):
                    available_memory_kb = int(line.split()[1])
                    available_memory_gb = available_memory_kb / (1024 * 1024)
                    break
    except:
        available_memory_gb = 4  # 默认假设 4GB

    # 假设每个 worker 使用约 256MB 内存
    memory_based_workers = int(available_memory_gb * 1024 / 256)

    recommendations = {
        'cpu_bound': cpu_count,
        'io_bound': (2 * cpu_count) + 1,
        'mixed': cpu_count + 1,
        'memory_limit': memory_based_workers,
    }

    print(f"CPU 核心数: {cpu_count}")
    print(f"可用内存: {available_memory_gb:.1f} GB")
    print("\n推荐 Worker 数量:")
    print(f"  - CPU 密集型应用: {recommendations['cpu_bound']}")
    print(f"  - I/O 密集型应用: {recommendations['io_bound']}")
    print(f"  - 混合型应用: {recommendations['mixed']}")
    print(f"  - 内存限制: 最多 {recommendations['memory_limit']}")

    # 取最保守的值
    safe_workers = min(
        recommendations['io_bound'],
        recommendations['memory_limit']
    )
    print(f"\n安全推荐值: {safe_workers}")

    return recommendations


if __name__ == '__main__':
    calculate_workers()
```

## 常见陷阱

### 同步代码阻塞事件循环

```python
# 错误示例：在 ASGI 应用中使用同步阻塞代码
import time
from fastapi import FastAPI

app = FastAPI()


@app.get("/bad")
async def bad_endpoint():
    # 这会阻塞整个事件循环！
    time.sleep(5)  # 同步阻塞
    return {"message": "done"}


# 正确示例：使用异步 I/O
import asyncio


@app.get("/good")
async def good_endpoint():
    # 使用异步 sleep，不会阻塞事件循环
    await asyncio.sleep(5)
    return {"message": "done"}


# 如果必须使用同步代码，使用线程池
from concurrent.futures import ThreadPoolExecutor
import asyncio

executor = ThreadPoolExecutor(max_workers=4)


def blocking_operation():
    """同步阻塞操作"""
    time.sleep(5)
    return "result"


@app.get("/sync-in-async")
async def sync_in_async():
    # 在线程池中运行同步代码
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, blocking_operation)
    return {"result": result}
```

### 请求体重复读取问题

```python
# 错误示例：WSGI 中重复读取请求体
def bad_wsgi_app(environ, start_response):
    # 第一次读取
    body1 = environ['wsgi.input'].read()
    # 第二次读取 - 返回空！
    body2 = environ['wsgi.input'].read()

    status = '200 OK'
    start_response(status, [])
    return [body1 + body2]


# 正确示例：缓存请求体
from io import BytesIO


def good_wsgi_app(environ, start_response):
    # 读取并缓存请求体
    content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
    body = environ['wsgi.input'].read(content_length)

    # 如果需要多次读取，替换 wsgi.input
    environ['wsgi.input'] = BytesIO(body)

    # 现在可以安全地多次读取
    data1 = environ['wsgi.input'].read()
    environ['wsgi.input'].seek(0)
    data2 = environ['wsgi.input'].read()

    status = '200 OK'
    start_response(status, [])
    return [data1]


# ASGI 中的正确做法
async def good_asgi_app(scope, receive, send):
    body = b''
    while True:
        message = await receive()
        body += message.get('body', b'')
        if not message.get('more_body', False):
            break

    # body 现在包含完整的请求体，可以多次使用
```

### Worker 预加载陷阱

```python
# gunicorn.conf.py

# 预加载可能导致的问题
preload_app = True  # 在 fork 之前加载应用

# 问题1：数据库连接在子进程间共享
# 解决方案：使用 post_fork 钩子重新初始化连接

def post_fork(server, worker):
    """每个 worker fork 后执行"""
    # 重新初始化数据库连接
    from myapp import db
    db.engine.dispose()

    # 重新初始化其他需要独立连接的资源
    from myapp import cache
    cache.reconnect()


# 问题2：随机数生成器状态共享
def post_fork(server, worker):
    import random
    import os

    # 为每个 worker 重新设置随机种子
    random.seed(os.getpid())
```

### 超时配置不当

```python
# 常见超时问题

# 问题：Nginx 超时 < 应用处理时间
# Nginx: proxy_read_timeout 30s
# Gunicorn: timeout 60s
# 结果：Nginx 提前断开连接，用户看到 504 错误

# 正确配置顺序（从外到内递减）：
# 客户端超时 > Nginx 超时 > Gunicorn 超时

# nginx.conf
"""
proxy_connect_timeout 30s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
"""

# gunicorn.conf.py
timeout = 30  # 小于 Nginx 的 proxy_read_timeout
graceful_timeout = 30

# 对于长时间运行的任务，使用后台任务队列
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/0')


@celery_app.task
def long_running_task():
    """长时间运行的任务"""
    import time
    time.sleep(300)
    return "done"


@app.post("/start-long-task")
async def start_long_task():
    """异步启动长时间任务"""
    task = long_running_task.delay()
    return {"task_id": task.id}
```

### 内存泄漏

```python
# 常见内存泄漏场景

# 问题1：全局变量累积
_cache = {}  # 永远增长！


def bad_handler(environ, start_response):
    key = environ['PATH_INFO']
    _cache[key] = some_large_data  # 内存泄漏
    # ...


# 解决方案：使用 LRU 缓存或外部缓存
from functools import lru_cache


@lru_cache(maxsize=1000)  # 限制缓存大小
def cached_function(key):
    return expensive_computation(key)


# 或使用 Redis
import redis

cache = redis.Redis()


def good_handler(environ, start_response):
    key = environ['PATH_INFO']
    cache.setex(key, 3600, some_large_data)  # 1 小时过期
    # ...


# 问题2：循环引用
class Handler:
    def __init__(self):
        self.callbacks = []

    def add_callback(self, cb):
        # 如果 cb 引用了 self，就会产生循环引用
        self.callbacks.append(cb)


# 解决方案：使用弱引用
import weakref


class Handler:
    def __init__(self):
        self.callbacks = []

    def add_callback(self, cb):
        self.callbacks.append(weakref.ref(cb))


# Gunicorn 内存管理配置
# gunicorn.conf.py
max_requests = 1000  # 每个 worker 处理 1000 个请求后重启
max_requests_jitter = 100  # 添加随机抖动，防止所有 worker 同时重启
```

### 信号处理问题

```python
# 优雅关闭问题

import signal
import sys


class Application:
    def __init__(self):
        self.running = True
        # 注册信号处理器
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum, frame):
        """优雅关闭"""
        print(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
        # 执行清理操作
        self._cleanup()

    def _cleanup(self):
        """清理资源"""
        # 关闭数据库连接
        # 清空队列
        # 保存状态
        pass


# FastAPI 中的优雅关闭
from fastapi import FastAPI
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行
    print("Starting up...")
    # 初始化资源

    yield

    # 关闭时执行
    print("Shutting down...")
    # 清理资源


app = FastAPI(lifespan=lifespan)
```

## 性能考量

### 性能基准测试

```python
"""
benchmark.py - 简单的性能测试脚本
"""

import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
import aiohttp


async def benchmark_endpoint(url: str, num_requests: int = 1000, concurrency: int = 100):
    """
    异步基准测试

    Args:
        url: 测试端点 URL
        num_requests: 总请求数
        concurrency: 并发数
    """
    latencies = []
    errors = 0

    semaphore = asyncio.Semaphore(concurrency)

    async def make_request(session):
        nonlocal errors
        async with semaphore:
            start = time.time()
            try:
                async with session.get(url) as response:
                    await response.text()
                    latencies.append(time.time() - start)
            except Exception as e:
                errors += 1

    start_time = time.time()

    async with aiohttp.ClientSession() as session:
        tasks = [make_request(session) for _ in range(num_requests)]
        await asyncio.gather(*tasks)

    total_time = time.time() - start_time

    # 计算统计数据
    if latencies:
        results = {
            'total_requests': num_requests,
            'successful_requests': len(latencies),
            'failed_requests': errors,
            'total_time': total_time,
            'requests_per_second': num_requests / total_time,
            'avg_latency': statistics.mean(latencies),
            'min_latency': min(latencies),
            'max_latency': max(latencies),
            'p50_latency': statistics.median(latencies),
            'p95_latency': sorted(latencies)[int(len(latencies) * 0.95)],
            'p99_latency': sorted(latencies)[int(len(latencies) * 0.99)],
        }
    else:
        results = {'error': 'All requests failed'}

    return results


def print_results(results):
    """打印测试结果"""
    if 'error' in results:
        print(f"Error: {results['error']}")
        return

    print("\n" + "=" * 50)
    print("性能测试结果")
    print("=" * 50)
    print(f"总请求数: {results['total_requests']}")
    print(f"成功请求: {results['successful_requests']}")
    print(f"失败请求: {results['failed_requests']}")
    print(f"总耗时: {results['total_time']:.2f}s")
    print(f"QPS: {results['requests_per_second']:.2f}")
    print(f"平均延迟: {results['avg_latency']*1000:.2f}ms")
    print(f"最小延迟: {results['min_latency']*1000:.2f}ms")
    print(f"最大延迟: {results['max_latency']*1000:.2f}ms")
    print(f"P50 延迟: {results['p50_latency']*1000:.2f}ms")
    print(f"P95 延迟: {results['p95_latency']*1000:.2f}ms")
    print(f"P99 延迟: {results['p99_latency']*1000:.2f}ms")
    print("=" * 50)


if __name__ == '__main__':
    import sys

    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'

    print(f"Testing: {url}")
    results = asyncio.run(benchmark_endpoint(url, num_requests=5000, concurrency=100))
    print_results(results)
```

### 服务器性能对比

```
┌─────────────────────────────────────────────────────────────┐
│              各服务器性能对比 (相对值)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  简单 JSON 响应 (Hello World):                              │
│                                                             │
│  Uvicorn (uvloop)  ████████████████████████████████ 100%   │
│  Hypercorn         ███████████████████████████      85%    │
│  Gunicorn (sync)   ████████████████████            65%    │
│  uWSGI             ███████████████████████          75%    │
│  Daphne            ██████████████████              58%    │
│                                                             │
│  数据库查询 (I/O 密集):                                     │
│                                                             │
│  Uvicorn (async)   ████████████████████████████████ 100%   │
│  Gunicorn (gevent) ████████████████████████████     90%    │
│  Gunicorn (sync)   ████████████████                50%    │
│  uWSGI             ███████████████████████          75%    │
│                                                             │
│  注意：实际性能取决于具体应用场景                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 性能优化技巧

```python
# 使用 uvloop 替代默认事件循环
import uvloop
import asyncio

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# 或在 uvicorn 中指定
# uvicorn main:app --loop uvloop


# 使用 httptools 替代默认 HTTP 解析器
# uvicorn main:app --http httptools


# 连接池优化
import aiohttp
from contextlib import asynccontextmanager


class HTTPClient:
    """优化的 HTTP 客户端"""

    def __init__(self):
        self._session = None

    async def get_session(self):
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            connector = aiohttp.TCPConnector(
                limit=100,  # 总连接数限制
                limit_per_host=30,  # 每个主机连接数限制
                ttl_dns_cache=300,  # DNS 缓存时间
                enable_cleanup_closed=True,
            )
            self._session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector,
            )
        return self._session

    async def close(self):
        if self._session:
            await self._session.close()


# 数据库连接池
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# 响应压缩
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)


# 缓存常用数据
from functools import lru_cache
from cachetools import TTLCache
import asyncio

# 同步缓存
@lru_cache(maxsize=1000)
def get_config(key: str):
    return load_from_db(key)

# 异步缓存
_async_cache = TTLCache(maxsize=1000, ttl=300)


async def get_cached_data(key: str):
    if key in _async_cache:
        return _async_cache[key]

    data = await fetch_from_db(key)
    _async_cache[key] = data
    return data
```

### 监控指标

```python
"""
metrics.py - 应用监控指标
"""

import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps


# 定义指标
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests'
)

DB_POOL_SIZE = Gauge(
    'db_connection_pool_size',
    'Database connection pool size'
)


class MetricsMiddleware:
    """Prometheus 指标中间件"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # 如果是 metrics 端点，返回指标
        if scope['path'] == '/metrics':
            await self._send_metrics(send)
            return

        method = scope['method']
        path = scope['path']

        ACTIVE_REQUESTS.inc()
        start_time = time.time()
        status_code = 500

        async def send_wrapper(message):
            nonlocal status_code
            if message['type'] == 'http.response.start':
                status_code = message['status']
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            ACTIVE_REQUESTS.dec()
            duration = time.time() - start_time

            REQUEST_COUNT.labels(
                method=method,
                endpoint=path,
                status=status_code
            ).inc()

            REQUEST_LATENCY.labels(
                method=method,
                endpoint=path
            ).observe(duration)

    async def _send_metrics(self, send):
        metrics = generate_latest()
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [(b'content-type', b'text/plain; charset=utf-8')],
        })
        await send({
            'type': 'http.response.body',
            'body': metrics,
        })
```

## 实战场景

### 场景1：高并发 API 服务

```python
"""
高并发 API 服务架构示例
"""

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from contextlib import asynccontextmanager
import json

# 全局资源
redis_client: Redis = None
db_session_factory = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global redis_client, db_session_factory

    # 启动时初始化
    from database import create_session_factory, create_redis_pool

    db_session_factory = await create_session_factory()
    redis_client = await create_redis_pool()

    print("Resources initialized")

    yield

    # 关闭时清理
    await redis_client.close()
    print("Resources cleaned up")


app = FastAPI(lifespan=lifespan)


# 依赖注入
async def get_db():
    async with db_session_factory() as session:
        yield session


async def get_cache():
    return redis_client


# 缓存装饰器
def cached(ttl: int = 60):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # 生成缓存键
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # 尝试从缓存获取
            cached_value = await redis_client.get(cache_key)
            if cached_value:
                return json.loads(cached_value)

            # 执行函数
            result = await func(*args, **kwargs)

            # 存入缓存
            await redis_client.setex(cache_key, ttl, json.dumps(result))

            return result
        return wrapper
    return decorator


@app.get("/api/products/{product_id}")
@cached(ttl=300)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取产品信息（带缓存）"""
    from models import Product
    from sqlalchemy import select

    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": product.id,
        "name": product.name,
        "price": float(product.price),
    }


@app.get("/api/products")
async def list_products(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """产品列表（分页）"""
    from models import Product
    from sqlalchemy import select, func

    # 计算总数
    total = await db.scalar(select(func.count(Product.id)))

    # 分页查询
    result = await db.execute(
        select(Product)
        .offset((page - 1) * size)
        .limit(size)
    )
    products = result.scalars().all()

    return {
        "items": [
            {"id": p.id, "name": p.name, "price": float(p.price)}
            for p in products
        ],
        "total": total,
        "page": page,
        "size": size,
    }
```

### 场景2：WebSocket 实时通信

```python
"""
WebSocket 实时聊天服务示例
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

app = FastAPI()


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # 房间 -> 连接集合
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # 连接 -> 用户信息
        self.connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room: str, user: dict):
        """建立连接"""
        await websocket.accept()

        if room not in self.rooms:
            self.rooms[room] = set()

        self.rooms[room].add(websocket)
        self.connections[websocket] = {"room": room, "user": user}

        # 广播用户加入消息
        await self.broadcast(room, {
            "type": "user_joined",
            "user": user,
            "count": len(self.rooms[room]),
        })

    async def disconnect(self, websocket: WebSocket):
        """断开连接"""
        if websocket not in self.connections:
            return

        info = self.connections[websocket]
        room = info["room"]
        user = info["user"]

        self.rooms[room].discard(websocket)
        del self.connections[websocket]

        # 广播用户离开消息
        if self.rooms[room]:
            await self.broadcast(room, {
                "type": "user_left",
                "user": user,
                "count": len(self.rooms[room]),
            })
        else:
            # 房间为空，删除房间
            del self.rooms[room]

    async def broadcast(self, room: str, message: dict):
        """向房间广播消息"""
        if room not in self.rooms:
            return

        dead_connections = set()
        for connection in self.rooms[room]:
            try:
                await connection.send_json(message)
            except:
                dead_connections.add(connection)

        # 清理死连接
        for conn in dead_connections:
            await self.disconnect(conn)

    async def send_to_user(self, websocket: WebSocket, message: dict):
        """发送消息给特定用户"""
        try:
            await websocket.send_json(message)
        except:
            await self.disconnect(websocket)


manager = ConnectionManager()


@app.websocket("/ws/chat/{room}")
async def websocket_endpoint(
    websocket: WebSocket,
    room: str,
    username: str = "Anonymous",
):
    """WebSocket 聊天端点"""
    user = {"name": username}

    await manager.connect(websocket, room, user)

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "message":
                # 广播聊天消息
                await manager.broadcast(room, {
                    "type": "message",
                    "user": user,
                    "content": data["content"],
                    "timestamp": data.get("timestamp"),
                })

            elif data["type"] == "typing":
                # 广播正在输入状态
                await manager.broadcast(room, {
                    "type": "typing",
                    "user": user,
                })

    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@app.get("/api/rooms/{room}/users")
async def get_room_users(room: str):
    """获取房间用户列表"""
    if room not in manager.rooms:
        return {"users": [], "count": 0}

    users = [
        manager.connections[conn]["user"]
        for conn in manager.rooms[room]
    ]
    return {"users": users, "count": len(users)}
```

### 场景3：文件上传与流式响应

```python
"""
文件处理服务示例
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import aiofiles
import hashlib
import os
from pathlib import Path

app = FastAPI()

UPLOAD_DIR = Path("/var/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """文件上传（流式处理，支持大文件）"""
    # 验证文件类型
    allowed_types = {"image/jpeg", "image/png", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(400, "File type not allowed")

    # 计算文件哈希作为文件名
    hasher = hashlib.sha256()
    file_size = 0

    # 临时文件路径
    temp_path = UPLOAD_DIR / f"temp_{os.urandom(8).hex()}"

    try:
        async with aiofiles.open(temp_path, 'wb') as f:
            while chunk := await file.read(8192):
                hasher.update(chunk)
                file_size += len(chunk)

                # 检查文件大小限制 (100MB)
                if file_size > 100 * 1024 * 1024:
                    raise HTTPException(413, "File too large")

                await f.write(chunk)

        # 生成最终文件名
        file_hash = hasher.hexdigest()
        ext = Path(file.filename).suffix
        final_path = UPLOAD_DIR / f"{file_hash}{ext}"

        # 如果文件已存在，直接返回
        if final_path.exists():
            temp_path.unlink()
        else:
            temp_path.rename(final_path)

        return {
            "filename": f"{file_hash}{ext}",
            "size": file_size,
            "content_type": file.content_type,
        }

    except Exception as e:
        # 清理临时文件
        if temp_path.exists():
            temp_path.unlink()
        raise


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """文件下载（流式响应）"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(404, "File not found")

    # 确保路径在上传目录内（防止路径遍历）
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(400, "Invalid filename")

    async def file_iterator():
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                yield chunk

    # 根据扩展名确定 content-type
    content_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
    }
    content_type = content_types.get(
        file_path.suffix.lower(),
        'application/octet-stream'
    )

    return StreamingResponse(
        file_iterator(),
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(file_path.stat().st_size),
        }
    )


@app.get("/api/stream-data")
async def stream_data():
    """流式响应示例（大量数据）"""
    import asyncio
    import json

    async def generate_data():
        for i in range(1000):
            data = {"id": i, "value": f"item_{i}"}
            yield json.dumps(data) + "\n"
            await asyncio.sleep(0.01)  # 模拟数据生成延迟

    return StreamingResponse(
        generate_data(),
        media_type="application/x-ndjson",
    )
```

### 场景4：微服务网关

```python
"""
API 网关示例
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from typing import Dict
import asyncio

app = FastAPI()


class ServiceRegistry:
    """服务注册表"""

    def __init__(self):
        self.services: Dict[str, list] = {
            "users": ["http://users-service:8000"],
            "products": ["http://products-service:8000"],
            "orders": ["http://orders-service:8000"],
        }
        self.health_status: Dict[str, Dict[str, bool]] = {}

    def get_healthy_instance(self, service: str) -> str:
        """获取健康的服务实例"""
        if service not in self.services:
            raise HTTPException(404, f"Service {service} not found")

        instances = self.services[service]

        # 简单的轮询策略
        for instance in instances:
            if self.health_status.get(service, {}).get(instance, True):
                return instance

        raise HTTPException(503, f"No healthy instances for {service}")

    async def check_health(self, service: str, instance: str) -> bool:
        """检查服务健康状态"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{instance}/health",
                    timeout=5.0
                )
                return response.status_code == 200
        except:
            return False


registry = ServiceRegistry()


# 创建共享的 HTTP 客户端
http_client: httpx.AsyncClient = None


@app.on_event("startup")
async def startup():
    global http_client
    http_client = httpx.AsyncClient(
        timeout=30.0,
        limits=httpx.Limits(
            max_keepalive_connections=100,
            max_connections=200,
        ),
    )


@app.on_event("shutdown")
async def shutdown():
    await http_client.aclose()


@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_request(service: str, path: str, request: Request):
    """代理请求到后端服务"""
    # 获取服务实例
    instance = registry.get_healthy_instance(service)

    # 构建目标 URL
    target_url = f"{instance}/{path}"
    if request.query_params:
        target_url += f"?{request.query_params}"

    # 准备请求头（移除 hop-by-hop 头）
    headers = dict(request.headers)
    hop_by_hop = {'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'host'}
    headers = {k: v for k, v in headers.items() if k.lower() not in hop_by_hop}

    # 添加转发头
    client_ip = request.client.host if request.client else "unknown"
    headers["X-Forwarded-For"] = client_ip
    headers["X-Forwarded-Proto"] = request.url.scheme

    # 读取请求体
    body = await request.body()

    try:
        # 发送请求
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )

        # 流式返回响应
        return StreamingResponse(
            response.aiter_bytes(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    except httpx.TimeoutException:
        raise HTTPException(504, "Gateway timeout")
    except httpx.ConnectError:
        raise HTTPException(503, "Service unavailable")


# 健康检查定时任务
async def health_check_task():
    """定期检查服务健康状态"""
    while True:
        for service, instances in registry.services.items():
            for instance in instances:
                is_healthy = await registry.check_health(service, instance)
                if service not in registry.health_status:
                    registry.health_status[service] = {}
                registry.health_status[service][instance] = is_healthy

        await asyncio.sleep(30)


@app.on_event("startup")
async def start_health_check():
    asyncio.create_task(health_check_task())
```

## 面试要点

### 基础概念题

**Q1: 请解释 WSGI 和 ASGI 的区别？**

```
答案要点:

1. 同步 vs 异步
   - WSGI: 同步接口，每个请求阻塞式处理
   - ASGI: 异步接口，支持协程和事件循环

2. 协议支持
   - WSGI: 仅支持 HTTP/1.1
   - ASGI: 支持 HTTP/1.1, HTTP/2, WebSocket

3. 接口设计
   - WSGI: application(environ, start_response) -> Iterable[bytes]
   - ASGI: async application(scope, receive, send)

4. 并发模型
   - WSGI: 多进程/多线程
   - ASGI: 单线程 + 事件循环，高效处理 I/O 密集型任务

5. 适用场景
   - WSGI: 传统同步 Web 应用，CPU 密集型
   - ASGI: 实时应用，高并发 I/O 密集型
```

**Q2: Gunicorn 的 worker 类型有哪些？各自的适用场景？**

```
答案要点:

1. sync (默认)
   - 同步阻塞 worker
   - 每个 worker 同时只处理一个请求
   - 适用于: 一般 Web 应用，CPU 密集型任务

2. gthread
   - 线程 worker
   - 每个 worker 内有多个线程
   - 适用于: I/O 密集型应用

3. gevent
   - 基于 greenlet 的协程 worker
   - 单个 worker 可处理大量并发
   - 适用于: 高并发 I/O 密集型，需要 patch 三方库

4. eventlet
   - 类似 gevent 的协程 worker
   - 适用于: 高并发场景

5. uvicorn.workers.UvicornWorker
   - ASGI worker
   - 适用于: FastAPI、Starlette 等 ASGI 应用

选择建议:
- 默认用 sync
- 有很多数据库/外部 API 调用用 gthread
- 需要处理大量并发连接用 gevent/eventlet
- 异步应用用 UvicornWorker
```

**Q3: 如何计算 Gunicorn worker 数量？**

```python
"""
Worker 数量计算公式:

1. CPU 密集型应用
   workers = CPU 核心数

2. I/O 密集型应用
   workers = (2 * CPU 核心数) + 1

3. 混合型应用
   workers = CPU 核心数 + 1

4. 内存限制
   workers = 可用内存 / 单个 worker 内存使用量

实际计算示例:
- 4 核 CPU，8GB 内存
- 每个 worker 约 300MB 内存
- I/O 密集型应用

workers = min(
    (2 * 4) + 1,  # CPU 计算 = 9
    8192 / 300     # 内存限制 ≈ 27
) = 9

最终选择: 9 个 workers
"""
```

### 实践问题

**Q4: 在 ASGI 应用中如何正确处理同步阻塞代码？**

```python
"""
错误做法: 直接在 async 函数中调用同步代码
"""

import time

async def bad_handler():
    # 这会阻塞整个事件循环!
    time.sleep(5)
    return {"result": "done"}


"""
正确做法1: 使用 run_in_executor
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

def blocking_operation():
    time.sleep(5)
    return "result"

async def good_handler_1():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, blocking_operation)
    return {"result": result}


"""
正确做法2: 使用 asyncio.to_thread (Python 3.9+)
"""

async def good_handler_2():
    result = await asyncio.to_thread(blocking_operation)
    return {"result": result}


"""
正确做法3: 使用异步库替代
"""

import asyncio

async def good_handler_3():
    await asyncio.sleep(5)  # 异步 sleep
    return {"result": "done"}
```

**Q5: 如何实现优雅关闭 (Graceful Shutdown)？**

```python
"""
WSGI (Gunicorn) 优雅关闭配置
"""

# gunicorn.conf.py
timeout = 30
graceful_timeout = 30  # 优雅关闭等待时间

def worker_exit(server, worker):
    """Worker 退出时清理资源"""
    from myapp import cleanup_resources
    cleanup_resources()


"""
ASGI (FastAPI) 优雅关闭实现
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio

# 跟踪进行中的请求
active_requests = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动
    print("Starting up...")
    yield

    # 关闭 - 等待所有请求完成
    print("Shutting down...")
    if active_requests:
        print(f"Waiting for {len(active_requests)} requests to complete...")
        # 设置最大等待时间
        try:
            await asyncio.wait_for(
                wait_for_requests_to_complete(),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            print("Timeout waiting for requests, forcing shutdown")

    # 清理资源
    await cleanup_resources()


async def wait_for_requests_to_complete():
    while active_requests:
        await asyncio.sleep(0.1)


app = FastAPI(lifespan=lifespan)
```

**Q6: 描述一个生产环境的部署架构？**

```
答案要点:

完整的生产环境架构:

1. 网络层
   - CDN: 静态资源缓存、DDoS 防护
   - 负载均衡器: Nginx/HAProxy，SSL 终止

2. 应用层
   - 反向代理: Nginx
   - 应用服务器:
     - WSGI: Gunicorn + 4-8 workers
     - ASGI: Uvicorn + 4 workers (使用 Gunicorn 管理)
   - 进程管理: Systemd/Supervisor

3. 数据层
   - 数据库: PostgreSQL/MySQL (主从复制)
   - 缓存: Redis Cluster
   - 消息队列: RabbitMQ/Kafka

4. 监控层
   - 指标收集: Prometheus
   - 可视化: Grafana
   - 日志聚合: ELK Stack
   - 告警: Alertmanager

5. 部署方式
   - 容器化: Docker + Kubernetes
   - CI/CD: GitHub Actions / GitLab CI
   - 蓝绿部署或滚动更新

关键配置:
- Worker 数量 = 2 * CPU + 1
- 连接池大小根据数据库限制配置
- 设置合理的超时时间
- 启用 Gzip 压缩
- 配置 Keep-Alive
```

## 延伸阅读

### 官方文档

- [PEP 3333 - WSGI 规范](https://peps.python.org/pep-3333/)
- [ASGI 规范](https://asgi.readthedocs.io/)
- [Gunicorn 文档](https://docs.gunicorn.org/)
- [Uvicorn 文档](https://www.uvicorn.org/)
- [Hypercorn 文档](https://pgjones.gitlab.io/hypercorn/)
- [uWSGI 文档](https://uwsgi-docs.readthedocs.io/)

### 框架文档

- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Django 部署文档](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Flask 部署指南](https://flask.palletsprojects.com/en/latest/deploying/)
- [Django Channels 文档](https://channels.readthedocs.io/)

### 深入学习

- [Real Python - Python WSGI Servers](https://realpython.com/python-wsgi-servers/)
- [Encode - ASGI 介绍](https://www.encode.io/articles/asgi-explained)
- [TestDriven.io - Gunicorn 配置](https://testdriven.io/blog/gunicorn-config/)
- [Python asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)

### 性能优化

- [Uvicorn Performance Tips](https://www.uvicorn.org/#performance)
- [Gunicorn Design](https://docs.gunicorn.org/en/stable/design.html)
- [高性能 Python Web 服务](https://calpaterson.com/async-python-is-not-faster.html)

### 相关工具

- [locust](https://locust.io/) - 负载测试工具
- [wrk](https://github.com/wg/wrk) - HTTP 基准测试
- [Prometheus Python Client](https://github.com/prometheus/client_python)
- [Sentry Python SDK](https://docs.sentry.io/platforms/python/)
