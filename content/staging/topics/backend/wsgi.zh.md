---
title: WSGI 和 ASGI
description: 理解 Python 网络服务器接口：WSGI 和 ASGI
track: backend
section: http-apis
difficulty: intermediate
tags:
  - python
  - wsgi
  - asgi
  - web
  - server
status: imported
origin: old/src/content/docs/python/wsgi.zh.md
divergence: 0.227
issues: []
legacy:
  category: Python
  subcategory: Web Development
  order: 46
  lastUpdated: 2026-01-07
---

Python 网络应用程序需要一个标准化接口与网络服务器通信。WSGI（Web Server Gateway Interface，网络服务器网关接口）和 ASGI（Asynchronous Server Gateway Interface，异步服务器网关接口）定义了这些契约。本指南探讨了两种规范、它们的实现方式，以及如何部署 Python 网络应用程序。

## 理解 WSGI

### 什么是 WSGI？

WSGI 是一个规范（PEP 3333），它定义了 Python 网络应用程序如何与应用程序服务器通信。它为同步请求-响应处理提供了一个简单、通用的接口。

**主要特性：**
- 同步的、请求-响应模型
- 成熟且广泛采用
- 简单、轻量级规范
- 限制于单线程请求处理

### WSGI 应用程序结构

WSGI 应用程序是一个可调用对象（函数或类），接受两个参数：`environ` 和 `start_response`。

```python
def simple_wsgi_app(environ, start_response):
    """
    一个最小的 WSGI 应用程序。

    Args:
        environ: 包含请求信息的字典
        start_response: 用于设置 HTTP 状态和头的可调用对象

    Returns:
        产生响应体字节的可迭代对象
    """
    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Hello, WSGI World!']
```

### environ 字典

`environ` 字典包含遵循 CGI 约定的请求元数据：

```python
def inspect_request(environ, start_response):
    """检查请求详情。"""
    method = environ.get('REQUEST_METHOD')
    path = environ.get('PATH_INFO')
    query = environ.get('QUERY_STRING', '')

    response = f"Method: {method}\nPath: {path}\nQuery: {query}\n"

    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [response.encode()]
```

### start_response 可调用对象

`start_response` 设置 HTTP 状态码和响应头：

```python
def wsgi_with_headers(environ, start_response):
    """设置自定义头。"""
    status = '200 OK'
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('X-Custom-Header', 'MyValue'),
        ('Cache-Control', 'no-cache')
    ]
    start_response(status, headers)
    return [b'<h1>Hello</h1>']
```

### WSGI 中间件

中间件包装 WSGI 应用程序来添加功能：

```python
class AuthenticationMiddleware:
    """用于身份验证的 WSGI 中间件。"""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        """通过认证层处理请求。"""
        auth_header = environ.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            status = '401 Unauthorized'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Unauthorized']

        # 令牌有效，继续调用应用程序
        return self.app(environ, start_response)


def logging_middleware(app):
    """用于记录请求的中间件函数。"""
    def middleware(environ, start_response):
        print(f"Request: {environ['REQUEST_METHOD']} {environ['PATH_INFO']}")
        return app(environ, start_response)
    return middleware


# 堆叠中间件
authenticated_app = AuthenticationMiddleware(simple_wsgi_app)
logged_app = logging_middleware(authenticated_app)
```

### WSGI 与流行框架

大多数 Python 框架提供 WSGI 兼容性：

**Flask 示例：**
```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, Flask!'

@app.route('/user/<name>')
def user(name):
    return f'Hello, {name}!'

if __name__ == '__main__':
    # Flask 应用对象是一个 WSGI 应用程序
    app.run()
```

**Django 示例：**
```python
# Django 自动提供一个 WSGI 应用程序
# wsgi.py 在新的 Django 项目中创建

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
```

**Pyramid 示例：**
```python
from wsgiref.simple_server import make_server
from pyramid.config import Configurator

def hello_world(request):
    return 'Hello, Pyramid!'

if __name__ == '__main__':
    config = Configurator()
    config.add_route('hello', '/')
    config.add_view(hello_world, route_name='hello')
    app = config.make_wsgi_app()

    server = make_server('localhost', 6543, app)
    server.serve_forever()
```

## 理解 ASGI

### 什么是 ASGI？

ASGI（异步服务器网关接口）使用异步操作支持扩展 WSGI。它适合现代异步 Python 应用程序和 WebSocket 支持。

**主要特性：**
- 异步的、事件驱动模型
- 支持 WebSocket 和服务器发送事件
- 对 I/O 密集操作有更好的资源利用率
- 比 WSGI 更复杂的规范

### ASGI 应用程序结构

ASGI 应用程序是一个异步可调用对象，接受三个参数：`scope`、`receive` 和 `send`。

```python
async def simple_asgi_app(scope, receive, send):
    """
    一个最小的 ASGI 应用程序。

    Args:
        scope: 包含连接元数据的字典
        receive: 用于接收消息的异步可调用对象
        send: 用于发送消息的异步可调用对象
    """
    assert scope['type'] == 'http'

    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [[b'content-type', b'text/plain']],
    })

    await send({
        'type': 'http.response.body',
        'body': b'Hello, ASGI World!',
    })
```

### scope 字典

`scope` 字典包含连接信息：

```python
async def inspect_asgi_scope(scope, receive, send):
    """检查连接详情。"""
    method = scope.get('method')
    path = scope.get('path')
    query_string = scope.get('query_string', b'').decode()

    response = f"Method: {method}\nPath: {path}\nQuery: {query_string}\n"

    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [[b'content-type', b'text/plain']],
    })

    await send({
        'type': 'http.response.body',
        'body': response.encode(),
    })
```

### 处理请求体

使用 `receive` 可调用对象读取请求体：

```python
async def echo_request_body(scope, receive, send):
    """回显请求体。"""
    if scope['type'] != 'http':
        return

    # 收集请求体
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
        'headers': [[b'content-type', b'text/plain']],
    })

    await send({
        'type': 'http.response.body',
        'body': b'Received: ' + body,
    })
```

### WebSocket 支持

ASGI 支持 WebSocket 进行双向通信：

```python
async def websocket_app(scope, receive, send):
    """处理 WebSocket 连接。"""
    assert scope['type'] == 'websocket'

    # 接受 WebSocket 连接
    await send({
        'type': 'websocket.accept',
    })

    # 将消息回显给客户端
    while True:
        message = await receive()

        if message['type'] == 'websocket.disconnect':
            break

        if message['type'] == 'websocket.receive':
            text = message.get('text')
            await send({
                'type': 'websocket.send',
                'text': f'Echo: {text}',
            })
```

### ASGI 与流行框架

**Starlette 示例：**
```python
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

async def hello(request):
    return JSONResponse({'message': 'Hello, Starlette!'})

app = Starlette(routes=[
    Route('/', hello),
])

# Starlette 应用是一个 ASGI 应用程序
```

**FastAPI 示例：**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get('/')
async def read_root():
    return {'message': 'Hello, FastAPI!'}

@app.get('/users/{user_id}')
async def read_user(user_id: int):
    return {'user_id': user_id}

# FastAPI 应用是 ASGI 应用程序
```

**Django 与 ASGI：**
```python
# Django 3.1+ 支持 ASGI
# Django 项目中的 asgi.py

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
application = get_asgi_application()
```

## WSGI 应用程序服务器

### Gunicorn

Gunicorn（Green Unicorn）是最流行的 WSGI 应用程序服务器。

**安装：**
```bash
pip install gunicorn
```

**基本用法：**
```bash
# 使用 Gunicorn 运行 Flask 应用
gunicorn app:app

# 指定工作进程数
gunicorn --workers 4 app:app

# 绑定到特定地址和端口
gunicorn --bind 0.0.0.0:8000 app:app
```

**配置文件：**
```python
# gunicorn_config.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
```

**使用配置运行：**
```bash
gunicorn -c gunicorn_config.py app:app
```

**常用选项：**
```bash
# 日志记录
gunicorn --access-logfile - --error-logfile - app:app

# 工作进程类型
gunicorn --worker-class gevent app:app
gunicorn --worker-class eventlet app:app

# 代码更改时自动重新加载（开发）
gunicorn --reload app:app

# 作为守护进程运行
gunicorn --daemon --pid /tmp/gunicorn.pid app:app
```

### 其他 WSGI 服务器

**Waitress：**
```bash
pip install waitress
waitress-serve --port=8000 app:app
```

**uWSGI：**
```bash
pip install uwsgi
uwsgi --http :8000 --wsgi-file app.py --callable app
```

**Paste：**
```bash
pip install paste
paster serve development.ini
```

## ASGI 应用程序服务器

### Uvicorn

Uvicorn 是最流行的 ASGI 服务器，基于 ASIO 构建。

**安装：**
```bash
pip install uvicorn
```

**基本用法：**
```bash
# 使用 Uvicorn 运行 Starlette 应用
uvicorn main:app

# 指定主机和端口
uvicorn main:app --host 0.0.0.0 --port 8000

# 代码更改时自动重新加载（开发）
uvicorn main:app --reload
```

**使用 CLI 配置：**
```bash
# 多个工作进程
uvicorn main:app --workers 4

# 访问和错误日志
uvicorn main:app --access-log

# SSL/TLS
uvicorn main:app --ssl-keyfile ./key.pem --ssl-certfile ./cert.pem

# 自定义日志级别
uvicorn main:app --log-level debug
```

**Python 配置：**
```python
import uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.get('/')
async def root():
    return {'message': 'Hello'}

if __name__ == '__main__':
    uvicorn.run(
        app,
        host='0.0.0.0',
        port=8000,
        workers=4,
        log_level='info'
    )
```

### 其他 ASGI 服务器

**Hypercorn：**
```bash
pip install hypercorn
hypercorn main:app --bind 0.0.0.0:8000
```

**Daphne：**
```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 myproject.asgi:application
```

## WSGI vs ASGI：对比

| 功能 | WSGI | ASGI |
|---------|------|------|
| **并发** | 同步 | 异步 |
| **请求处理** | 阻塞 | 非阻塞 |
| **WebSocket 支持** | 否 | 是 |
| **复杂性** | 简单 | 更复杂 |
| **性能** | 适合传统应用 | 更适合 I/O 密集应用 |
| **生态系统** | 成熟、广泛 | 快速增长 |
| **学习曲线** | 容易 | 中等 |

**何时使用 WSGI：**
- 传统的请求-响应网络应用
- Django、Flask、Pyramid 应用
- 简单的同步逻辑
- 团队熟悉同步 Python

**何时使用 ASGI：**
- 实时功能（聊天、通知）
- 需要 WebSocket 支持
- 重型 I/O 操作
- 现代异步优先框架
- 高并发需求

## 部署模式

### 传统 WSGI 部署

```
客户端
  ↓
Nginx（反向代理）
  ↓
Gunicorn（4 个工作进程）
  ├─ Flask/Django 应用
  ├─ Flask/Django 应用
  ├─ Flask/Django 应用
  └─ Flask/Django 应用
  ↓
PostgreSQL（数据库）
```

**Nginx 配置：**
```nginx
upstream gunicorn {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/app/static/;
        expires 30d;
    }
}
```

**Supervisor 配置：**
```ini
[program:gunicorn]
command=/path/to/venv/bin/gunicorn --workers 4 --bind 127.0.0.1:8000 app:app
directory=/path/to/app
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/gunicorn.log
```

### 现代 ASGI 部署

```
客户端
  ↓
Nginx（反向代理）
  ↓
Uvicorn（4 个工作进程）
  ├─ FastAPI/Starlette 应用
  ├─ FastAPI/Starlette 应用
  ├─ FastAPI/Starlette 应用
  └─ FastAPI/Starlette 应用
  ↓
PostgreSQL（数据库）
Redis（缓存）
```

**Uvicorn 与 Supervisor：**
```ini
[program:uvicorn]
command=/path/to/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
directory=/path/to/app
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/uvicorn.log
```

### Docker 部署

**WSGI 的 Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:8000", "app:app"]
```

**ASGI 的 Dockerfile：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**docker-compose.yml：**
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DEBUG=false
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always

volumes:
  postgres_data:
```

## 最佳实践

### WSGI 最佳实践

1. **使用反向代理**（Nginx、Apache）在 Gunicorn 前面
2. **配置适当的工作进程数**（CPU 数 × 2 + 1）
3. **设置合理的超时**以防止请求挂起
4. **使用进程管理器**（Supervisor、systemd）用于自动重启
5. **监控工作进程健康状况**并重启崩溃的工作进程
6. **记录访问和错误日志**到文件用于调试
7. **启用 keep-alive** 以减少连接开销

### ASGI 最佳实践

1. **对异步应用使用 Uvicorn**（FastAPI、Starlette）
2. **为生产环境配置多个工作进程**
3. **在异步代码中实现适当的错误处理**
4. **使用异步上下文管理器**进行资源管理
5. **避免在异步代码中进行阻塞操作**
6. **监控事件循环性能**寻找瓶颈
7. **使用生命周期事件**处理启动/关闭逻辑

**FastAPI 中的生命周期事件：**
```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动代码
    print("Application startup")
    yield
    # 关闭代码
    print("Application shutdown")

app = FastAPI(lifespan=lifespan)
```

### 性能优化

**对于 WSGI：**
- 使用数据库连接池
- 实现缓存（Redis）
- 为静态资源使用 CDN
- 优化数据库查询
- 使用 py-spy 等工具进行性能分析

**对于 ASGI：**
- 利用异步数据库驱动（asyncpg）
- 实现请求/响应压缩
- 对大文件使用流式响应
- 积极缓存
- 监控协程执行

## 结论

理解 WSGI 和 ASGI 是 Python 网络开发和部署的基础：

- **WSGI** 是成熟的、同步的标准，适合传统网络应用。Gunicorn 提供了优秀的生产级部署。

- **ASGI** 是现代的、异步的标准，支持实时功能和更好的 I/O 处理。Uvicorn 提供了简单、高效的部署。

- **根据需求选择**：现有的 Django/Flask 项目适合 WSGI；新的异步优先项目受益于 ASGI。

- **生产部署**需要适当配置工作进程、反向代理、进程管理器和监控。

- **Docker** 简化了开发和生产环境之间的部署一致性。

这两个规范共存于 Python 生态系统中，理解两者都能使你成为更好的 Python 网络开发者和运维工程师。
