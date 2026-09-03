---
title: WSGI and ASGI
description: "Understand Python web server interfaces: WSGI and ASGI"
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
origin: old/src/content/docs/python/wsgi.en.md
divergence: 0.227
issues: []
legacy:
  category: Python
  subcategory: Web Development
  order: 46
  lastUpdated: 2026-01-07
---

Python web applications require a standardized interface to communicate with web servers. WSGI (Web Server Gateway Interface) and ASGI (Asynchronous Server Gateway Interface) define these contracts. We'll cover both specifications, their implementations, and how to deploy Python web applications.

## Understanding WSGI

### What is WSGI?

WSGI is a specification (PEP 3333) that defines how web applications communicate with application servers in Python. It provides a simple, universal interface for synchronous request-response processing.

**Key characteristics:**
- Synchronous, request-response model
- Mature and widely adopted
- Simple, lightweight specification
- Limited to single-threaded request handling

### WSGI Application Structure

A WSGI application is a callable (function or class) that accepts two arguments: `environ` and `start_response`.

```python
def simple_wsgi_app(environ, start_response):
    """
    A minimal WSGI application.

    Args:
        environ: Dictionary containing request information
        start_response: Callable to set HTTP status and headers

    Returns:
        Iterable yielding response body bytes
    """
    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Hello, WSGI World!']
```

### The environ Dictionary

The `environ` dictionary contains request metadata following CGI conventions:

```python
def inspect_request(environ, start_response):
    """Inspect request details."""
    method = environ.get('REQUEST_METHOD')
    path = environ.get('PATH_INFO')
    query = environ.get('QUERY_STRING', '')

    response = f"Method: {method}\nPath: {path}\nQuery: {query}\n"

    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [response.encode()]
```

### The start_response Callable

`start_response` sets the HTTP status code and response headers:

```python
def wsgi_with_headers(environ, start_response):
    """Set custom headers."""
    status = '200 OK'
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('X-Custom-Header', 'MyValue'),
        ('Cache-Control', 'no-cache')
    ]
    start_response(status, headers)
    return [b'<h1>Hello</h1>']
```

### WSGI Middleware

Middleware wraps WSGI applications to add functionality:

```python
class AuthenticationMiddleware:
    """WSGI middleware for authentication."""

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        """Process request through auth layer."""
        auth_header = environ.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            status = '401 Unauthorized'
            headers = [('Content-Type', 'text/plain')]
            start_response(status, headers)
            return [b'Unauthorized']

        # Token is valid, continue to app
        return self.app(environ, start_response)


def logging_middleware(app):
    """Middleware function to log requests."""
    def middleware(environ, start_response):
        print(f"Request: {environ['REQUEST_METHOD']} {environ['PATH_INFO']}")
        return app(environ, start_response)
    return middleware


# Stack middleware
authenticated_app = AuthenticationMiddleware(simple_wsgi_app)
logged_app = logging_middleware(authenticated_app)
```

### WSGI with Popular Frameworks

Most Python frameworks provide WSGI compatibility:

**Flask Example:**
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
    # The Flask app object is a WSGI application
    app.run()
```

**Django Example:**
```python
# Django automatically provides a WSGI application
# wsgi.py is created in new Django projects

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
```

**Pyramid Example:**
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

## Understanding ASGI

### What is ASGI?

ASGI (Asynchronous Server Gateway Interface) extends WSGI with support for asynchronous operations. It's suitable for modern async Python applications and WebSocket support.

**Key characteristics:**
- Asynchronous, event-driven model
- Supports WebSockets and Server-Sent Events
- Better resource utilization for I/O-bound operations
- More complex specification than WSGI

### ASGI Application Structure

An ASGI application is an async callable that accepts three arguments: `scope`, `receive`, and `send`.

```python
async def simple_asgi_app(scope, receive, send):
    """
    A minimal ASGI application.

    Args:
        scope: Dictionary with connection metadata
        receive: Async callable to receive messages
        send: Async callable to send messages
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

### The scope Dictionary

The `scope` dictionary contains connection information:

```python
async def inspect_asgi_scope(scope, receive, send):
    """Inspect connection details."""
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

### Handling Request Body

Read the request body using the `receive` callable:

```python
async def echo_request_body(scope, receive, send):
    """Echo back the request body."""
    if scope['type'] != 'http':
        return

    # Collect request body
    body = b''
    while True:
        message = await receive()
        body += message.get('body', b'')
        if not message.get('more_body', False):
            break

    # Send response
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

### WebSocket Support

ASGI supports WebSockets for bidirectional communication:

```python
async def websocket_app(scope, receive, send):
    """Handle WebSocket connections."""
    assert scope['type'] == 'websocket'

    # Accept the WebSocket connection
    await send({
        'type': 'websocket.accept',
    })

    # Echo messages back to client
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

### ASGI with Popular Frameworks

**Starlette Example:**
```python
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route

async def hello(request):
    return JSONResponse({'message': 'Hello, Starlette!'})

app = Starlette(routes=[
    Route('/', hello),
])

# The Starlette app is an ASGI application
```

**FastAPI Example:**
```python
from fastapi import FastAPI

app = FastAPI()

@app.get('/')
async def read_root():
    return {'message': 'Hello, FastAPI!'}

@app.get('/users/{user_id}')
async def read_user(user_id: int):
    return {'user_id': user_id}

# FastAPI apps are ASGI applications
```

**Django with ASGI:**
```python
# Django 3.1+ supports ASGI
# asgi.py in your Django project

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
application = get_asgi_application()
```

## WSGI Application Servers

### Gunicorn

Gunicorn (Green Unicorn) is the most popular WSGI application server.

**Installation:**
```bash
pip install gunicorn
```

**Basic Usage:**
```bash
# Run a Flask app with Gunicorn
gunicorn app:app

# Specify workers (processes)
gunicorn --workers 4 app:app

# Bind to specific address and port
gunicorn --bind 0.0.0.0:8000 app:app
```

**Configuration File:**
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

**Running with Configuration:**
```bash
gunicorn -c gunicorn_config.py app:app
```

**Common Options:**
```bash
# Logging
gunicorn --access-logfile - --error-logfile - app:app

# Worker types
gunicorn --worker-class gevent app:app
gunicorn --worker-class eventlet app:app

# Reload on code changes (development)
gunicorn --reload app:app

# Run as daemon
gunicorn --daemon --pid /tmp/gunicorn.pid app:app
```

### Other WSGI Servers

**Waitress:**
```bash
pip install waitress
waitress-serve --port=8000 app:app
```

**uWSGI:**
```bash
pip install uwsgi
uwsgi --http :8000 --wsgi-file app.py --callable app
```

**Paste:**
```bash
pip install paste
paster serve development.ini
```

## ASGI Application Servers

### Uvicorn

Uvicorn is the most popular ASGI server, built on ASIO.

**Installation:**
```bash
pip install uvicorn
```

**Basic Usage:**
```bash
# Run a Starlette app with Uvicorn
uvicorn main:app

# Specify host and port
uvicorn main:app --host 0.0.0.0 --port 8000

# Auto-reload on code changes (development)
uvicorn main:app --reload
```

**Configuration with CLI:**
```bash
# Multiple workers
uvicorn main:app --workers 4

# Access and error logging
uvicorn main:app --access-log

# SSL/TLS
uvicorn main:app --ssl-keyfile ./key.pem --ssl-certfile ./cert.pem

# Custom log level
uvicorn main:app --log-level debug
```

**Python Configuration:**
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

### Other ASGI Servers

**Hypercorn:**
```bash
pip install hypercorn
hypercorn main:app --bind 0.0.0.0:8000
```

**Daphne:**
```bash
pip install daphne
daphne -b 0.0.0.0 -p 8000 myproject.asgi:application
```

## WSGI vs ASGI: Comparison

| Feature | WSGI | ASGI |
|---------|------|------|
| **Concurrency** | Synchronous | Asynchronous |
| **Request Handling** | Blocking | Non-blocking |
| **WebSocket Support** | No | Yes |
| **Complexity** | Simple | More complex |
| **Performance** | Good for traditional apps | Better for I/O-heavy apps |
| **Ecosystem** | Mature, extensive | Growing rapidly |
| **Learning Curve** | Easy | Moderate |

**When to use WSGI:**
- Traditional request-response web apps
- Django, Flask, Pyramid applications
- Simple, synchronous logic
- Team familiarity with synchronous Python

**When to use ASGI:**
- Real-time features (chat, notifications)
- WebSocket support needed
- Heavy I/O operations
- Modern async-first frameworks
- High-concurrency requirements

## Deployment Patterns

### Traditional WSGI Deployment

```
Client
  ↓
Nginx (reverse proxy)
  ↓
Gunicorn (4 workers)
  ├─ Flask/Django app
  ├─ Flask/Django app
  ├─ Flask/Django app
  └─ Flask/Django app
  ↓
PostgreSQL (database)
```

**Nginx Configuration:**
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

**Supervisor Configuration:**
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

### Modern ASGI Deployment

```
Client
  ↓
Nginx (reverse proxy)
  ↓
Uvicorn (4 workers)
  ├─ FastAPI/Starlette app
  ├─ FastAPI/Starlette app
  ├─ FastAPI/Starlette app
  └─ FastAPI/Starlette app
  ↓
PostgreSQL (database)
Redis (cache)
```

**Uvicorn with Supervisor:**
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

### Docker Deployment

**Dockerfile for WSGI:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:8000", "app:app"]
```

**Dockerfile for ASGI:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**docker-compose.yml:**
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

## Best Practices

### WSGI Best Practices

1. **Use a reverse proxy** (Nginx, Apache) in front of Gunicorn
2. **Configure appropriate worker count** (CPU count × 2 + 1)
3. **Set reasonable timeouts** to prevent hanging requests
4. **Use a process manager** (Supervisor, systemd) for auto-restart
5. **Monitor worker health** and restart crashed workers
6. **Log access and errors** to files for debugging
7. **Enable keep-alive** to reduce connection overhead

### ASGI Best Practices

1. **Use Uvicorn for async applications** (FastAPI, Starlette)
2. **Configure multiple workers** for production
3. **Implement proper error handling** in async code
4. **Use async context managers** for resource management
5. **Avoid blocking operations** in async code
6. **Monitor event loop performance** for bottlenecks
7. **Use lifespan events** for startup/shutdown logic

**Lifespan Events in FastAPI:**
```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("Application startup")
    yield
    # Shutdown code
    print("Application shutdown")

app = FastAPI(lifespan=lifespan)
```

### Performance Optimization

**For WSGI:**
- Use connection pooling for databases
- Implement caching (Redis)
- Use CDN for static assets
- Optimize database queries
- Profile with tools like py-spy

**For ASGI:**
- Leverage async database drivers (asyncpg)
- Implement request/response compression
- Use streaming responses for large files
- Cache aggressively
- Monitor coroutine execution

## Conclusion

Understanding WSGI and ASGI is fundamental to Python web development and deployment:

- **WSGI** is the mature, synchronous standard suitable for traditional web applications. Gunicorn provides excellent production-ready deployment.

- **ASGI** is the modern, asynchronous standard enabling real-time features and better I/O handling. Uvicorn offers simple, efficient deployment.

- **Choose based on requirements**: Existing Django/Flask projects fit WSGI; new async-first projects benefit from ASGI.

- **Production deployment** requires proper configuration of workers, reverse proxies, process managers, and monitoring.

- **Docker** simplifies deployment consistency across development and production environments.

Both specifications coexist in the Python ecosystem, and understanding both makes you a better Python web developer and DevOps engineer.
