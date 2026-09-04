---
title: WSGI and ASGI Complete Guide
description: "Master Python Web Server Gateway Interfaces: understand WSGI and ASGI protocols, configure mainstream servers, and learn production deployment best practices"
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - WSGI
  - ASGI
  - Gunicorn
  - Uvicorn
  - Deployment
status: imported
origin: old/src/content/docs/python/wsgi-asgi.en.md
divergence: 0.188
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: python
  subcategory: ""
  order: 26
  lastUpdated: 2026-01-07
---

WSGI (Web Server Gateway Interface) and ASGI (Asynchronous Server Gateway Interface) are standard protocols for communication between Python Web applications and Web servers. Understanding these two protocols is crucial for building high-performance, scalable Python Web applications.

## Concepts Explained

### What is WSGI

WSGI (Web Server Gateway Interface) is a standard interface between Python applications and Web servers, defined by PEP 3333. It solves compatibility issues between Python Web frameworks and Web servers, allowing any WSGI-compliant framework to run on any WSGI-compliant server.

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Request Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client ──► Nginx/Apache ──► Gunicorn ──► Flask/Django    │
│     │              │              │              │          │
│   Browser    Reverse Proxy   WSGI Server   Web Framework    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What is ASGI

ASGI (Asynchronous Server Gateway Interface) is the spiritual successor to WSGI, designed specifically for asynchronous Python Web applications. It supports HTTP, WebSocket, HTTP/2 and other protocols, serving as the foundation for building modern asynchronous Web applications.

```
┌─────────────────────────────────────────────────────────────┐
│                  ASGI Protocol Support                      │
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
│ │HTTP/2 │     │WebSocket │     │ Other    │              │
│ └───────┘     └──────────┘     │Protocols │              │
│                     │           └──────────┘              │
│                     ▼                                       │
│              ┌─────────────┐                                │
│              │ASGI App     │                                │
│              │FastAPI etc  │                                │
│              └─────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### WSGI vs ASGI Comparison

| Feature | WSGI | ASGI |
|---------|------|------|
| **Specification** | PEP 3333 | ASGI Spec |
| **Sync/Async** | Synchronous blocking | Asynchronous non-blocking |
| **Protocol Support** | HTTP/1.1 | HTTP/1.1, HTTP/2, WebSocket |
| **Concurrency Model** | Multi-process/Multi-thread | Coroutine + Event loop |
| **Typical Frameworks** | Flask, Django | FastAPI, Starlette, Django 3.0+ |
| **Typical Servers** | Gunicorn, uWSGI | Uvicorn, Hypercorn, Daphne |
| **Use Cases** | Traditional Web apps | Real-time apps, High concurrency |

### Historical Context

```
┌────────────────────────────────────────────────────────────┐
│            Python Web Development Timeline                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  2003: PEP 333 proposes WSGI specification                │
│    │                                                       │
│  2010: PEP 3333 updated to support Python 3                │
│    │                                                       │
│  2016: Django Channels introduces ASGI concept            │
│    │                                                       │
│  2018: ASGI 3.0 specification officially released          │
│    │                                                       │
│  2019: FastAPI released, ASGI ecosystem flourishes        │
│    │                                                       │
│  2020: Django 3.0 natively supports ASGI                  │
│    │                                                       │
│  Today: WSGI and ASGI coexist, each with suitable use cases│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Core Principles

### WSGI Working Principle

WSGI defines a simple callable object interface:

```python
def application(environ, start_response):
    """
    WSGI Application Interface

    Parameters:
        environ: Dictionary containing request information
        start_response: Callback function for sending response status and headers

    Returns:
        Iterable response body
    """
    # Key information in environ
    # REQUEST_METHOD: Request method (GET, POST, etc)
    # PATH_INFO: Request path
    # QUERY_STRING: Query string
    # CONTENT_TYPE: Request content type
    # CONTENT_LENGTH: Request body length
    # HTTP_*: HTTP header information
    # wsgi.input: File object of request body
    # wsgi.errors: Error output stream

    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)

    return [b'Hello, World!']
```

### WSGI Request Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                WSGI Request Processing Flow                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Web server receives HTTP request                        │
│     │                                                       │
│     ▼                                                       │
│  2. Build environ dictionary                               │
│     │  - Parse HTTP headers                                │
│     │  - Set WSGI variables                                │
│     │  - Wrap request body                                 │
│     ▼                                                       │
│  3. Call WSGI application                                  │
│     │  application(environ, start_response)                │
│     ▼                                                       │
│  4. Application handles request                            │
│     │  - Route matching                                    │
│     │  - Business logic processing                         │
│     │  - Call start_response                               │
│     ▼                                                       │
│  5. Return response body iterator                          │
│     │                                                       │
│     ▼                                                       │
│  6. Server sends HTTP response                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### ASGI Working Principle

ASGI uses asynchronous coroutines to handle requests:

```python
async def application(scope, receive, send):
    """
    ASGI Application Interface

    Parameters:
        scope: Connection metadata dictionary
        receive: Async function to receive messages
        send: Async function to send messages
    """
    # Key information in scope
    # type: Connection type ('http', 'websocket', 'lifespan')
    # asgi: ASGI version information
    # http_version: HTTP version
    # method: Request method
    # path: Request path
    # query_string: Query string (bytes)
    # headers: Header list [(name, value), ...]

    if scope['type'] == 'http':
        # Receive request body
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
            'headers': [(b'content-type', b'text/plain')],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Hello, World!',
        })
```

### ASGI Message Types

```
┌─────────────────────────────────────────────────────────────┐
│                     ASGI Message Types                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP Connection (scope['type'] == 'http')                 │
│  ├── http.request        # Request body data                │
│  ├── http.response.start # Response start (status, headers) │
│  ├── http.response.body  # Response body data               │
│  └── http.disconnect     # Client disconnected              │
│                                                             │
│  WebSocket Connection (scope['type'] == 'websocket')       │
│  ├── websocket.connect   # Connection request               │
│  ├── websocket.accept    # Accept connection                │
│  ├── websocket.receive   # Receive message                  │
│  ├── websocket.send      # Send message                     │
│  └── websocket.close     # Close connection                 │
│                                                             │
│  Lifespan (scope['type'] == 'lifespan')                    │
│  ├── lifespan.startup    # Application startup              │
│  ├── lifespan.shutdown   # Application shutdown             │
│  └── lifespan.startup.complete # Startup complete          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Synchronous vs Asynchronous Processing Models

```
┌─────────────────────────────────────────────────────────────┐
│              WSGI Synchronous Model (Blocking)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Worker 1: [Request 1 processing...waiting for DB...done]  │
│  Worker 2: [Idle] ───► [Request 2 processing...wait API]   │
│  Worker 3: [Idle...Idle...Idle] ───► [Request 3]           │
│                                                             │
│  Characteristic: Each request occupies one worker           │
│                 Worker blocks during I/O wait              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│            ASGI Asynchronous Model (Non-blocking)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Event loop:                                               │
│    t1: [Request 1 starts] [Request 2 starts] [Request 3]  │
│    t2: [Request 1 waits DB] [Process request 2] [Proc 3]  │
│    t3: [DB returns, resume 1] [Request 2 waits API] [done] │
│    t4: [Complete request 1] [API returns, complete 2]     │
│                                                             │
│  Characteristic: Single thread handles multiple requests   │
│                 Switches to other requests during I/O wait │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

### Popular WSGI Servers

#### Gunicorn (Green Unicorn)

Gunicorn is the most popular Python WSGI HTTP server, renowned for its stability and ease of use.

```bash
# Installation
pip install gunicorn

# Basic startup
gunicorn myapp:app

# Common configuration
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

**Gunicorn Worker Types:**

| Worker Type | Description | Use Cases |
|------------|-------------|-----------|
| `sync` | Synchronous worker (default) | General Web applications |
| `gthread` | Thread worker | I/O-intensive applications |
| `gevent` | gevent coroutine | High concurrency I/O |
| `eventlet` | eventlet coroutine | High concurrency I/O |
| `uvicorn.workers.UvicornWorker` | ASGI worker | Async applications |

#### uWSGI

uWSGI is a powerful application server supporting multiple protocols and languages.

```bash
# Installation
pip install uwsgi

# Basic startup
uwsgi --http :8000 --wsgi-file myapp.py --callable app

# INI configuration file (uwsgi.ini)
```

```ini
[uwsgi]
# Basic configuration
module = myapp:app
master = true
processes = 4
threads = 2

# Socket configuration
socket = /tmp/uwsgi.sock
chmod-socket = 660

# Performance tuning
enable-threads = true
single-interpreter = true
lazy-apps = true

# Memory management
max-requests = 1000
reload-on-rss = 256

# Logging
logto = /var/log/uwsgi/myapp.log
log-maxsize = 10000000
```

### Popular ASGI Servers

#### Uvicorn

Uvicorn is a high-performance ASGI server based on uvloop and httptools.

```bash
# Installation
pip install uvicorn[standard]

# Basic startup
uvicorn myapp:app

# Production configuration
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

**Uvicorn Configuration Options:**

```python
# Programmatic startup
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "myapp:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools",
        reload=False,  # Disable in production
        access_log=True,
        log_level="info",
        timeout_keep_alive=30,
        limit_concurrency=1000,
        limit_max_requests=10000,
    )
```

#### Hypercorn

Hypercorn supports HTTP/1, HTTP/2, and HTTP/3, making it the most comprehensive ASGI server.

```bash
# Installation
pip install hypercorn

# Basic startup
hypercorn myapp:app

# Enable HTTP/2
hypercorn myapp:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --keep-alive 30 \
    --access-log - \
    --error-log -
```

**Hypercorn Configuration File (hypercorn.toml):**

```toml
bind = ["0.0.0.0:8000"]
workers = 4
worker_class = "asyncio"
keep_alive_timeout = 30
graceful_timeout = 30

# HTTP/2 configuration
h2_max_concurrent_streams = 100
h2_max_header_list_size = 65536

# TLS configuration
# certfile = "/path/to/cert.pem"
# keyfile = "/path/to/key.pem"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

#### Daphne

Daphne is the official ASGI server for Django Channels.

```bash
# Installation
pip install daphne

# Start Django ASGI application
daphne -b 0.0.0.0 -p 8000 myproject.asgi:application

# Start with WebSocket support
daphne -b 0.0.0.0 -p 8000 --websocket_timeout 60 myproject.asgi:application
```

### Server Selection Guide

```
┌─────────────────────────────────────────────────────────────┐
│                 Server Selection Decision Tree              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Is your application async?                                │
│  │                                                          │
│  ├── Yes (FastAPI, Starlette, async Django)               │
│  │   │                                                      │
│  │   ├── Need HTTP/2 or HTTP/3?                           │
│  │   │   │                                                  │
│  │   │   ├── Yes ──► Hypercorn                              │
│  │   │   │                                                  │
│  │   │   └── No ──► Uvicorn (recommended)                  │
│  │   │                                                      │
│  │   └── Using Django Channels?                            │
│  │       │                                                  │
│  │       └── Yes ──► Daphne                                 │
│  │                                                          │
│  └── No (Flask, synchronous Django)                        │
│      │                                                      │
│      ├── Need complex config and protocol support?         │
│      │   │                                                  │
│      │   ├── Yes ──► uWSGI                                  │
│      │   │                                                  │
│      │   └── No ──► Gunicorn (recommended)                 │
│      │                                                      │
│      └── Need to run async code in Gunicorn?               │
│          │                                                  │
│          └── Yes ──► Gunicorn + UvicornWorker              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Code Examples

### Implementing a WSGI Application from Scratch

```python
"""
minimal_wsgi.py - Minimal WSGI application implementation
"""

def simple_app(environ, start_response):
    """Simplest WSGI application"""
    status = '200 OK'
    headers = [('Content-Type', 'text/html; charset=utf-8')]
    start_response(status, headers)
    return [b'<h1>Hello, WSGI!</h1>']


class WSGIApplication:
    """WSGI application class with routing"""

    def __init__(self):
        self.routes = {}

    def route(self, path):
        """Route decorator"""
        def decorator(func):
            self.routes[path] = func
            return func
        return decorator

    def __call__(self, environ, start_response):
        """WSGI entry point"""
        path = environ.get('PATH_INFO', '/')
        method = environ.get('REQUEST_METHOD', 'GET')

        # Find route
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


# Create application instance
app = WSGIApplication()


@app.route('/')
def index(environ):
    return '<h1>Welcome to My WSGI App!</h1>'


@app.route('/hello')
def hello(environ):
    # Get query parameters
    query_string = environ.get('QUERY_STRING', '')
    params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
    name = params.get('name', 'World')
    return f'<h1>Hello, {name}!</h1>'


@app.route('/info')
def info(environ):
    """Display request information"""
    info_items = [
        f"<li>Method: {environ.get('REQUEST_METHOD')}</li>",
        f"<li>Path: {environ.get('PATH_INFO')}</li>",
        f"<li>Query: {environ.get('QUERY_STRING')}</li>",
        f"<li>Server: {environ.get('SERVER_NAME')}:{environ.get('SERVER_PORT')}</li>",
        f"<li>User-Agent: {environ.get('HTTP_USER_AGENT', 'Unknown')}</li>",
    ]
    return f'<h1>Request Info</h1><ul>{"".join(info_items)}</ul>'


# Test with wsgiref test server
if __name__ == '__main__':
    from wsgiref.simple_server import make_server

    print("Starting WSGI server on http://localhost:8000")
    server = make_server('localhost', 8000, app)
    server.serve_forever()
```

### Implementing an ASGI Application from Scratch

```python
"""
minimal_asgi.py - Minimal ASGI application implementation
"""

import json
from urllib.parse import parse_qs


async def simple_app(scope, receive, send):
    """Simplest ASGI application"""
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
    """ASGI application class with routing and middleware"""

    def __init__(self):
        self.routes = {}
        self.middlewares = []

    def route(self, path, methods=None):
        """Route decorator"""
        methods = methods or ['GET']
        def decorator(func):
            self.routes[(path, tuple(methods))] = func
            return func
        return decorator

    def middleware(self, func):
        """Middleware decorator"""
        self.middlewares.append(func)
        return func

    async def __call__(self, scope, receive, send):
        """ASGI entry point"""
        if scope['type'] == 'lifespan':
            await self._handle_lifespan(scope, receive, send)
        elif scope['type'] == 'http':
            await self._handle_http(scope, receive, send)
        elif scope['type'] == 'websocket':
            await self._handle_websocket(scope, receive, send)

    async def _handle_lifespan(self, scope, receive, send):
        """Handle application lifecycle events"""
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
        """Handle HTTP requests"""
        path = scope['path']
        method = scope['method']

        # Find route
        handler = None
        for (route_path, route_methods), route_handler in self.routes.items():
            if route_path == path and method in route_methods:
                handler = route_handler
                break

        if handler:
            # Read request body
            body = b''
            while True:
                message = await receive()
                body += message.get('body', b'')
                if not message.get('more_body', False):
                    break

            # Build request context
            request = Request(scope, body)

            try:
                response = await handler(request)
                await self._send_response(send, response)
            except Exception as e:
                await self._send_error(send, 500, str(e))
        else:
            await self._send_error(send, 404, 'Not Found')

    async def _handle_websocket(self, scope, receive, send):
        """Handle WebSocket connections"""
        await send({'type': 'websocket.close', 'code': 1000})

    async def _send_response(self, send, response):
        """Send response"""
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
        """Send error response"""
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
    """Request object wrapper"""

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


# Create application instance
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
    """Return request information in JSON format"""
    return {
        'method': request.method,
        'path': request.path,
        'query_params': request.query_params,
    }


@app.route('/api/echo', methods=['POST'])
async def api_echo(request):
    """Echo POST data"""
    try:
        data = request.json()
        return {'received': data}
    except json.JSONDecodeError:
        return {'error': 'Invalid JSON'}


# Run with uvicorn
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='localhost', port=8000)
```

### WSGI Middleware Implementation

```python
"""
wsgi_middleware.py - WSGI middleware examples
"""

import time
import logging
from functools import wraps


class LoggingMiddleware:
    """Logging middleware"""

    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger(__name__)

    def __call__(self, environ, start_response):
        start_time = time.time()

        # Log request
        method = environ.get('REQUEST_METHOD', 'GET')
        path = environ.get('PATH_INFO', '/')

        # Capture response status
        response_status = []

        def custom_start_response(status, headers, exc_info=None):
            response_status.append(status)
            return start_response(status, headers, exc_info)

        # Call next middleware or application
        response = self.app(environ, custom_start_response)

        # Log response
        duration = time.time() - start_time
        status = response_status[0] if response_status else 'Unknown'
        self.logger.info(f'{method} {path} - {status} - {duration:.3f}s')

        return response


class CORSMiddleware:
    """CORS middleware"""

    def __init__(self, app, allow_origins=None, allow_methods=None, allow_headers=None):
        self.app = app
        self.allow_origins = allow_origins or ['*']
        self.allow_methods = allow_methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        self.allow_headers = allow_headers or ['Content-Type', 'Authorization']

    def __call__(self, environ, start_response):
        method = environ.get('REQUEST_METHOD', 'GET')

        # Handle preflight request
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

        # Wrap start_response to add CORS headers
        def cors_start_response(status, headers, exc_info=None):
            cors_headers = [
                ('Access-Control-Allow-Origin', ', '.join(self.allow_origins)),
            ]
            return start_response(status, headers + cors_headers, exc_info)

        return self.app(environ, cors_start_response)


class GZipMiddleware:
    """GZip compression middleware"""

    def __init__(self, app, minimum_size=500):
        self.app = app
        self.minimum_size = minimum_size

    def __call__(self, environ, start_response):
        # Check if client supports gzip
        accept_encoding = environ.get('HTTP_ACCEPT_ENCODING', '')
        if 'gzip' not in accept_encoding:
            return self.app(environ, start_response)

        response_started = []
        response_headers = []

        def buffering_start_response(status, headers, exc_info=None):
            response_started.append(status)
            response_headers.extend(headers)
            # Return empty write function
            return lambda data: None

        # Collect response body
        response_body = b''.join(self.app(environ, buffering_start_response))

        # If response is large enough, compress it
        if len(response_body) >= self.minimum_size:
            import gzip
            compressed = gzip.compress(response_body)

            # Update headers
            new_headers = [(k, v) for k, v in response_headers if k.lower() != 'content-length']
            new_headers.append(('Content-Length', str(len(compressed))))
            new_headers.append(('Content-Encoding', 'gzip'))

            start_response(response_started[0], new_headers)
            return [compressed]
        else:
            start_response(response_started[0], response_headers)
            return [response_body]


class ErrorHandlerMiddleware:
    """Error handling middleware"""

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


# Use middleware to wrap application
def create_app():
    """Create application with middleware"""

    def app(environ, start_response):
        start_response('200 OK', [('Content-Type', 'text/plain')])
        return [b'Hello, World!']

    # Wrap middleware in order (last added runs first)
    app = ErrorHandlerMiddleware(app, debug=True)
    app = GZipMiddleware(app)
    app = CORSMiddleware(app)
    app = LoggingMiddleware(app)

    return app


application = create_app()
```

### ASGI Middleware Implementation

```python
"""
asgi_middleware.py - ASGI middleware examples
"""

import time
import logging
import json
from typing import Callable, Awaitable


class LoggingMiddleware:
    """Logging middleware"""

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

        # Capture response status
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
    """CORS middleware"""

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

        # Check if origin is allowed
        if '*' in self.allow_origins or origin in self.allow_origins:
            allowed_origin = origin if origin else '*'
        else:
            await self.app(scope, receive, send)
            return

        # Handle preflight request
        if method == 'OPTIONS':
            await self._send_preflight_response(send, allowed_origin)
            return

        # Add CORS headers to response
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
    """Rate limiting middleware"""

    def __init__(self, app, max_requests=100, window_seconds=60):
        self.app = app
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.request_counts = {}  # Simplified in-memory storage

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # Get client IP
        client = scope.get('client')
        client_ip = client[0] if client else 'unknown'

        # Check rate limit
        current_time = time.time()
        if client_ip in self.request_counts:
            count, window_start = self.request_counts[client_ip]

            if current_time - window_start > self.window_seconds:
                # Window expired, reset
                self.request_counts[client_ip] = (1, current_time)
            elif count >= self.max_requests:
                # Limit exceeded
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
    """Authentication middleware"""

    def __init__(self, app, verify_token: Callable[[str], Awaitable[dict]] = None):
        self.app = app
        self.verify_token = verify_token or self._default_verify
        self.public_paths = {'/health', '/docs', '/openapi.json'}

    async def _default_verify(self, token: str) -> dict:
        # Default token verification logic
        if token == 'valid-token':
            return {'user_id': 1, 'username': 'test'}
        return None

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # Skip authentication for public paths
        if scope['path'] in self.public_paths:
            await self.app(scope, receive, send)
            return

        # Get Authorization header
        headers = dict(scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode('utf-8')

        if not auth_header.startswith('Bearer '):
            await self._send_unauthorized(send, 'Missing or invalid Authorization header')
            return

        token = auth_header[7:]  # Remove 'Bearer ' prefix

        # Verify token
        user = await self.verify_token(token)
        if not user:
            await self._send_unauthorized(send, 'Invalid token')
            return

        # Add user info to scope
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


# Combine middleware
def create_middleware_stack(app):
    """Create middleware stack"""
    app = AuthenticationMiddleware(app)
    app = RateLimitMiddleware(app, max_requests=100, window_seconds=60)
    app = CORSMiddleware(app, allow_origins=['http://localhost:3000'])
    app = LoggingMiddleware(app)
    return app
```

### Flask Application Deployment Example

```python
"""
flask_app.py - Flask application deployment example
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


# Development environment
if __name__ == '__main__':
    app.run(debug=True)
```

**Gunicorn Configuration File (gunicorn.conf.py):**

```python
"""
gunicorn.conf.py - Gunicorn configuration file
"""

import multiprocessing

# Bind address
bind = '0.0.0.0:8000'

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'  # or 'gthread', 'gevent', 'eventlet'
threads = 2  # Only for gthread worker

# Timeout settings
timeout = 30
keepalive = 2
graceful_timeout = 30

# Request limits
max_requests = 1000
max_requests_jitter = 100

# Logging configuration
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process name
proc_name = 'flask_app'

# Preload application
preload_app = True

# Lifecycle hooks
def on_starting(server):
    print("Gunicorn is starting...")

def on_reload(server):
    print("Gunicorn is reloading...")

def worker_int(worker):
    print(f"Worker {worker.pid} received INT signal")

def worker_abort(worker):
    print(f"Worker {worker.pid} received SIGABRT signal")
```

**Startup Command:**

```bash
# Start with configuration file
gunicorn flask_app:app -c gunicorn.conf.py

# Or with command line arguments
gunicorn flask_app:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 2 \
    --worker-class gthread \
    --timeout 30 \
    --access-logfile - \
    --error-logfile -
```

### FastAPI Application Deployment Example

```python
"""
fastapi_app.py - FastAPI application deployment example
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Data models
class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float


class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float


# Simulated database
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


# Async task example
@app.get("/api/slow")
async def slow_endpoint():
    """Simulate slow I/O operation"""
    await asyncio.sleep(2)
    return {"message": "This was slow!"}


# Lifecycle events
@app.on_event("startup")
async def startup_event():
    print("Application is starting up...")
    # Initialize database connections, caching, etc


@app.on_event("shutdown")
async def shutdown_event():
    print("Application is shutting down...")
    # Clean up resources


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Uvicorn Programmatic Configuration:**

```python
"""
run_uvicorn.py - Uvicorn programmatic startup configuration
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
        ssl_keyfile=None,  # Configure SSL in production
        ssl_certfile=None,
    )
```

**Using Gunicorn + UvicornWorker:**

```bash
# Run ASGI application in Gunicorn
gunicorn fastapi_app:app \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout 30 \
    --keepalive 5 \
    --access-logfile - \
    --error-logfile -
```

### Django ASGI Deployment Example

```python
"""
myproject/asgi.py - Django ASGI configuration
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

# Get Django ASGI application
django_asgi_app = get_asgi_application()

# If using Django Channels
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
myapp/routing.py - WebSocket routing configuration
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]
```

```python
"""
myapp/consumers.py - WebSocket consumer
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
```

## Best Practices

### Production Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│            Recommended Production Architecture              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Internet                                                  │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────┐                                               │
│  │  CDN    │ ◄── Static resource caching                   │
│  └────┬────┘                                               │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────────┐                                       │
│  │Load Balancer    │ ◄── SSL termination, load distribution│
│  │(Nginx/HAProxy)  │                                       │
│  └────────┬────────┘                                       │
│           │                                                 │
│     ┌─────┴─────┐                                          │
│     │           │                                          │
│     ▼           ▼                                          │
│  ┌──────┐   ┌──────┐                                      │
│  │App 1 │   │App 2 │ ◄── App Servers (Gunicorn/Uvicorn)  │
│  └──┬───┘   └──┬───┘                                      │
│     │          │                                           │
│     └────┬─────┘                                           │
│          │                                                  │
│     ┌────┴────┐                                            │
│     │         │                                            │
│     ▼         ▼                                            │
│  ┌──────┐ ┌───────┐                                       │
│  │Redis │ │Database│ ◄── Data Layer                        │
│  └──────┘ └───────┘                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Nginx Reverse Proxy Configuration

```nginx
# /etc/nginx/sites-available/myapp

upstream wsgi_app {
    # WSGI Application (Gunicorn)
    server 127.0.0.1:8000 weight=1;
    server 127.0.0.1:8001 weight=1;
    keepalive 32;
}

upstream asgi_app {
    # ASGI Application (Uvicorn)
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

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Static files
    location /static/ {
        alias /var/www/myapp/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/myapp/media/;
        expires 7d;
    }

    # WSGI application proxy
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

    # ASGI application proxy
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

    # WebSocket proxy
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

### Systemd Service Configuration

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

### Docker Deployment Configuration

```dockerfile
# Dockerfile - Multi-stage build

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim as runtime

WORKDIR /app

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Startup command (ASGI)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Startup command (WSGI)
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

### Worker Count Calculation

```python
"""
worker_calculator.py - Worker count calculation utility
"""

import multiprocessing
import os


def calculate_workers():
    """
    Calculate recommended worker count

    General rules:
    - CPU-bound: workers = CPU core count
    - I/O-bound: workers = (2 * CPU core count) + 1
    - Mixed: workers = CPU core count + 1
    """
    cpu_count = multiprocessing.cpu_count()

    # Get available memory (Linux)
    try:
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                if line.startswith('MemAvailable'):
                    available_memory_kb = int(line.split()[1])
                    available_memory_gb = available_memory_kb / (1024 * 1024)
                    break
    except:
        available_memory_gb = 4  # Default assumption: 4GB

    # Assume each worker uses approximately 256MB
    memory_based_workers = int(available_memory_gb * 1024 / 256)

    recommendations = {
        'cpu_bound': cpu_count,
        'io_bound': (2 * cpu_count) + 1,
        'mixed': cpu_count + 1,
        'memory_limit': memory_based_workers,
    }

    print(f"CPU Core Count: {cpu_count}")
    print(f"Available Memory: {available_memory_gb:.1f} GB")
    print("\nRecommended Worker Count:")
    print(f"  - CPU-bound applications: {recommendations['cpu_bound']}")
    print(f"  - I/O-bound applications: {recommendations['io_bound']}")
    print(f"  - Mixed applications: {recommendations['mixed']}")
    print(f"  - Memory limit: Maximum {recommendations['memory_limit']}")

    # Take the most conservative value
    safe_workers = min(
        recommendations['io_bound'],
        recommendations['memory_limit']
    )
    print(f"\nSafe Recommended Value: {safe_workers}")

    return recommendations


if __name__ == '__main__':
    calculate_workers()
```

## Common Pitfalls

### Blocking the Event Loop with Synchronous Code

```python
# Bad example: Using synchronous blocking code in ASGI application
import time
from fastapi import FastAPI

app = FastAPI()


@app.get("/bad")
async def bad_endpoint():
    # This will block the entire event loop!
    time.sleep(5)  # Synchronous blocking
    return {"message": "done"}


# Correct example: Using asynchronous I/O
import asyncio


@app.get("/good")
async def good_endpoint():
    # Using async sleep, doesn't block event loop
    await asyncio.sleep(5)
    return {"message": "done"}


# If you must use synchronous code, use thread pool
from concurrent.futures import ThreadPoolExecutor
import asyncio

executor = ThreadPoolExecutor(max_workers=4)


def blocking_operation():
    """Synchronous blocking operation"""
    time.sleep(5)
    return "result"


@app.get("/sync-in-async")
async def sync_in_async():
    # Run synchronous code in thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, blocking_operation)
    return {"result": result}
```

### Request Body Multiple Read Issue

```python
# Bad example: Reading request body multiple times in WSGI
def bad_wsgi_app(environ, start_response):
    # First read
    body1 = environ['wsgi.input'].read()
    # Second read - returns empty!
    body2 = environ['wsgi.input'].read()

    status = '200 OK'
    start_response(status, [])
    return [body1 + body2]


# Correct example: Cache request body
from io import BytesIO


def good_wsgi_app(environ, start_response):
    # Read and cache request body
    content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
    body = environ['wsgi.input'].read(content_length)

    # If multiple reads needed, replace wsgi.input
    environ['wsgi.input'] = BytesIO(body)

    # Now can safely read multiple times
    data1 = environ['wsgi.input'].read()
    environ['wsgi.input'].seek(0)
    data2 = environ['wsgi.input'].read()

    status = '200 OK'
    start_response(status, [])
    return [data1]


# Correct approach in ASGI
async def good_asgi_app(scope, receive, send):
    body = b''
    while True:
        message = await receive()
        body += message.get('body', b'')
        if not message.get('more_body', False):
            break

    # body now contains complete request body, can be used multiple times
```

### Worker Preload Pitfall

```python
# gunicorn.conf.py

# Preload can cause issues
preload_app = True  # Load application before fork

# Problem 1: Database connections shared between child processes
# Solution: Reinitialize connections using post_fork hook

def post_fork(server, worker):
    """Execute after each worker fork"""
    # Reinitialize database connections
    from myapp import db
    db.engine.dispose()

    # Reinitialize other resources requiring independent connections
    from myapp import cache
    cache.reconnect()


# Problem 2: Random number generator state shared
def post_fork(server, worker):
    import random
    import os

    # Reseed random number generator for each worker
    random.seed(os.getpid())
```

### Improper Timeout Configuration

```python
# Common timeout issues

# Problem: Nginx timeout < Application processing time
# Nginx: proxy_read_timeout 30s
# Gunicorn: timeout 60s
# Result: Nginx disconnects early, user sees 504 error

# Correct configuration order (decreasing from outside to inside):
# Client timeout > Nginx timeout > Gunicorn timeout

# nginx.conf
"""
proxy_connect_timeout 30s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
"""

# gunicorn.conf.py
timeout = 30  # Less than Nginx proxy_read_timeout
graceful_timeout = 30

# For long-running tasks, use background task queue
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/0')


@celery_app.task
def long_running_task():
    """Long-running task"""
    import time
    time.sleep(300)
    return "done"


@app.post("/start-long-task")
async def start_long_task():
    """Asynchronously start long-running task"""
    task = long_running_task.delay()
    return {"task_id": task.id}
```

### Memory Leaks

```python
# Common memory leak scenarios

# Problem 1: Global variables accumulating
_cache = {}  # Grows forever!


def bad_handler(environ, start_response):
    key = environ['PATH_INFO']
    _cache[key] = some_large_data  # Memory leak
    # ...


# Solution: Use LRU cache or external cache
from functools import lru_cache


@lru_cache(maxsize=1000)  # Limit cache size
def cached_function(key):
    return expensive_computation(key)


# Or use Redis
import redis

cache = redis.Redis()


def good_handler(environ, start_response):
    key = environ['PATH_INFO']
    cache.setex(key, 3600, some_large_data)  # Expires in 1 hour
    # ...


# Problem 2: Circular references
class Handler:
    def __init__(self):
        self.callbacks = []

    def add_callback(self, cb):
        # If cb references self, creates circular reference
        self.callbacks.append(cb)


# Solution: Use weak references
import weakref


class Handler:
    def __init__(self):
        self.callbacks = []

    def add_callback(self, cb):
        self.callbacks.append(weakref.ref(cb))


# Gunicorn memory management configuration
# gunicorn.conf.py
max_requests = 1000  # Restart worker after 1000 requests
max_requests_jitter = 100  # Add randomness to prevent all workers restarting simultaneously
```

### Signal Handling Issues

```python
# Graceful shutdown issues

import signal
import sys


class Application:
    def __init__(self):
        self.running = True
        # Register signal handlers
        signal.signal(signal.SIGTERM, self._handle_signal)
        signal.signal(signal.SIGINT, self._handle_signal)

    def _handle_signal(self, signum, frame):
        """Graceful shutdown"""
        print(f"Received signal {signum}, shutting down gracefully...")
        self.running = False
        # Perform cleanup operations
        self._cleanup()

    def _cleanup(self):
        """Clean up resources"""
        # Close database connections
        # Clear queues
        # Save state
        pass


# Graceful shutdown in FastAPI
from fastapi import FastAPI
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Execute on startup
    print("Starting up...")
    # Initialize resources

    yield

    # Execute on shutdown
    print("Shutting down...")
    # Clean up resources


app = FastAPI(lifespan=lifespan)
```

## Performance Considerations

### Performance Benchmark Testing

```python
"""
benchmark.py - Simple performance test script
"""

import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor
import aiohttp


async def benchmark_endpoint(url: str, num_requests: int = 1000, concurrency: int = 100):
    """
    Asynchronous benchmark test

    Args:
        url: Test endpoint URL
        num_requests: Total request count
        concurrency: Concurrency level
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

    # Calculate statistics
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
    """Print test results"""
    if 'error' in results:
        print(f"Error: {results['error']}")
        return

    print("\n" + "=" * 50)
    print("Performance Test Results")
    print("=" * 50)
    print(f"Total Requests: {results['total_requests']}")
    print(f"Successful Requests: {results['successful_requests']}")
    print(f"Failed Requests: {results['failed_requests']}")
    print(f"Total Duration: {results['total_time']:.2f}s")
    print(f"QPS: {results['requests_per_second']:.2f}")
    print(f"Average Latency: {results['avg_latency']*1000:.2f}ms")
    print(f"Min Latency: {results['min_latency']*1000:.2f}ms")
    print(f"Max Latency: {results['max_latency']*1000:.2f}ms")
    print(f"P50 Latency: {results['p50_latency']*1000:.2f}ms")
    print(f"P95 Latency: {results['p95_latency']*1000:.2f}ms")
    print(f"P99 Latency: {results['p99_latency']*1000:.2f}ms")
    print("=" * 50)


if __name__ == '__main__':
    import sys

    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000/'

    print(f"Testing: {url}")
    results = asyncio.run(benchmark_endpoint(url, num_requests=5000, concurrency=100))
    print_results(results)
```

### Server Performance Comparison

```
┌─────────────────────────────────────────────────────────────┐
│           Server Performance Comparison (Relative Values)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Simple JSON Response (Hello World):                        │
│                                                             │
│  Uvicorn (uvloop)  ████████████████████████████████ 100%   │
│  Hypercorn         ███████████████████████████      85%    │
│  Gunicorn (sync)   ████████████████████            65%    │
│  uWSGI             ███████████████████████          75%    │
│  Daphne            ██████████████████              58%    │
│                                                             │
│  Database Query (I/O Intensive):                           │
│                                                             │
│  Uvicorn (async)   ████████████████████████████████ 100%   │
│  Gunicorn (gevent) ████████████████████████████     90%    │
│  Gunicorn (sync)   ████████████████                50%    │
│  uWSGI             ███████████████████████          75%    │
│                                                             │
│  Note: Actual performance depends on specific use cases    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization Tips

```python
# Use uvloop instead of default event loop
import uvloop
import asyncio

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

# Or specify in uvicorn
# uvicorn main:app --loop uvloop


# Use httptools instead of default HTTP parser
# uvicorn main:app --http httptools


# Connection pool optimization
import aiohttp
from contextlib import asynccontextmanager


class HTTPClient:
    """Optimized HTTP client"""

    def __init__(self):
        self._session = None

    async def get_session(self):
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            connector = aiohttp.TCPConnector(
                limit=100,  # Total connection limit
                limit_per_host=30,  # Connections per host limit
                ttl_dns_cache=300,  # DNS cache time
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


# Database connection pool
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


# Response compression
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Cache frequently used data
from functools import lru_cache
from cachetools import TTLCache
import asyncio

# Synchronous cache
@lru_cache(maxsize=1000)
def get_config(key: str):
    return load_from_db(key)

# Asynchronous cache
_async_cache = TTLCache(maxsize=1000, ttl=300)


async def get_cached_data(key: str):
    if key in _async_cache:
        return _async_cache[key]

    data = await fetch_from_db(key)
    _async_cache[key] = data
    return data
```

### Monitoring Metrics

```python
"""
metrics.py - Application monitoring metrics
"""

import time
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps


# Define metrics
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
    """Prometheus metrics middleware"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        # If metrics endpoint, return metrics
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

## Real-World Scenarios

### Scenario 1: High Concurrency API Service

```python
"""
High concurrency API service architecture example
"""

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from contextlib import asynccontextmanager
import json

# Global resources
redis_client: Redis = None
db_session_factory = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    global redis_client, db_session_factory

    # Initialize on startup
    from database import create_session_factory, create_redis_pool

    db_session_factory = await create_session_factory()
    redis_client = await create_redis_pool()

    print("Resources initialized")

    yield

    # Clean up on shutdown
    await redis_client.close()
    print("Resources cleaned up")


app = FastAPI(lifespan=lifespan)


# Dependency injection
async def get_db():
    async with db_session_factory() as session:
        yield session


async def get_cache():
    return redis_client


# Cache decorator
def cached(ttl: int = 60):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"

            # Try to get from cache
            cached_value = await redis_client.get(cache_key)
            if cached_value:
                return json.loads(cached_value)

            # Execute function
            result = await func(*args, **kwargs)

            # Store in cache
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
    """Get product info (with caching)"""
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
    """Product list (pagination)"""
    from models import Product
    from sqlalchemy import select, func

    # Calculate total
    total = await db.scalar(select(func.count(Product.id)))

    # Paginated query
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

### Scenario 2: WebSocket Real-Time Communication

```python
"""
WebSocket real-time chat service example
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

app = FastAPI()


class ConnectionManager:
    """WebSocket connection manager"""

    def __init__(self):
        # Room -> Set of connections
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # Connection -> User info
        self.connections: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, room: str, user: dict):
        """Establish connection"""
        await websocket.accept()

        if room not in self.rooms:
            self.rooms[room] = set()

        self.rooms[room].add(websocket)
        self.connections[websocket] = {"room": room, "user": user}

        # Broadcast user joined message
        await self.broadcast(room, {
            "type": "user_joined",
            "user": user,
            "count": len(self.rooms[room]),
        })

    async def disconnect(self, websocket: WebSocket):
        """Close connection"""
        if websocket not in self.connections:
            return

        info = self.connections[websocket]
        room = info["room"]
        user = info["user"]

        self.rooms[room].discard(websocket)
        del self.connections[websocket]

        # Broadcast user left message
        if self.rooms[room]:
            await self.broadcast(room, {
                "type": "user_left",
                "user": user,
                "count": len(self.rooms[room]),
            })
        else:
            # Delete room if empty
            del self.rooms[room]

    async def broadcast(self, room: str, message: dict):
        """Broadcast message to room"""
        if room not in self.rooms:
            return

        dead_connections = set()
        for connection in self.rooms[room]:
            try:
                await connection.send_json(message)
            except:
                dead_connections.add(connection)

        # Clean up dead connections
        for conn in dead_connections:
            await self.disconnect(conn)

    async def send_to_user(self, websocket: WebSocket, message: dict):
        """Send message to specific user"""
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
    """WebSocket chat endpoint"""
    user = {"name": username}

    await manager.connect(websocket, room, user)

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "message":
                # Broadcast chat message
                await manager.broadcast(room, {
                    "type": "message",
                    "user": user,
                    "content": data["content"],
                    "timestamp": data.get("timestamp"),
                })

            elif data["type"] == "typing":
                # Broadcast typing status
                await manager.broadcast(room, {
                    "type": "typing",
                    "user": user,
                })

    except WebSocketDisconnect:
        await manager.disconnect(websocket)


@app.get("/api/rooms/{room}/users")
async def get_room_users(room: str):
    """Get room user list"""
    if room not in manager.rooms:
        return {"users": [], "count": 0}

    users = [
        manager.connections[conn]["user"]
        for conn in manager.rooms[room]
    ]
    return {"users": users, "count": len(users)}
```

### Scenario 3: File Upload and Streaming Response

```python
"""
File handling service example
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
    """File upload (stream processing, supports large files)"""
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "application/pdf"}
    if file.content_type not in allowed_types:
        raise HTTPException(400, "File type not allowed")

    # Calculate file hash as filename
    hasher = hashlib.sha256()
    file_size = 0

    # Temporary file path
    temp_path = UPLOAD_DIR / f"temp_{os.urandom(8).hex()}"

    try:
        async with aiofiles.open(temp_path, 'wb') as f:
            while chunk := await file.read(8192):
                hasher.update(chunk)
                file_size += len(chunk)

                # Check file size limit (100MB)
                if file_size > 100 * 1024 * 1024:
                    raise HTTPException(413, "File too large")

                await f.write(chunk)

        # Generate final filename
        file_hash = hasher.hexdigest()
        ext = Path(file.filename).suffix
        final_path = UPLOAD_DIR / f"{file_hash}{ext}"

        # If file exists, just return
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
        # Clean up temp file
        if temp_path.exists():
            temp_path.unlink()
        raise


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """File download (streaming response)"""
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(404, "File not found")

    # Ensure path is within upload directory (prevent path traversal)
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(400, "Invalid filename")

    async def file_iterator():
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                yield chunk

    # Determine content-type based on extension
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
    """Streaming response example (large data)"""
    import asyncio
    import json

    async def generate_data():
        for i in range(1000):
            data = {"id": i, "value": f"item_{i}"}
            yield json.dumps(data) + "\n"
            await asyncio.sleep(0.01)  # Simulate data generation delay

    return StreamingResponse(
        generate_data(),
        media_type="application/x-ndjson",
    )
```

### Scenario 4: Microservice Gateway

```python
"""
API Gateway example
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from typing import Dict
import asyncio

app = FastAPI()


class ServiceRegistry:
    """Service registry"""

    def __init__(self):
        self.services: Dict[str, list] = {
            "users": ["http://users-service:8000"],
            "products": ["http://products-service:8000"],
            "orders": ["http://orders-service:8000"],
        }
        self.health_status: Dict[str, Dict[str, bool]] = {}

    def get_healthy_instance(self, service: str) -> str:
        """Get healthy service instance"""
        if service not in self.services:
            raise HTTPException(404, f"Service {service} not found")

        instances = self.services[service]

        # Simple round-robin strategy
        for instance in instances:
            if self.health_status.get(service, {}).get(instance, True):
                return instance

        raise HTTPException(503, f"No healthy instances for {service}")

    async def check_health(self, service: str, instance: str) -> bool:
        """Check service health status"""
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


# Create shared HTTP client
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
    """Proxy request to backend service"""
    # Get service instance
    instance = registry.get_healthy_instance(service)

    # Build target URL
    target_url = f"{instance}/{path}"
    if request.query_params:
        target_url += f"?{request.query_params}"

    # Prepare headers (remove hop-by-hop headers)
    headers = dict(request.headers)
    hop_by_hop = {'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'host'}
    headers = {k: v for k, v in headers.items() if k.lower() not in hop_by_hop}

    # Add forwarding headers
    client_ip = request.client.host if request.client else "unknown"
    headers["X-Forwarded-For"] = client_ip
    headers["X-Forwarded-Proto"] = request.url.scheme

    # Read request body
    body = await request.body()

    try:
        # Send request
        response = await http_client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
        )

        # Stream response
        return StreamingResponse(
            response.aiter_bytes(),
            status_code=response.status_code,
            headers=dict(response.headers),
        )

    except httpx.TimeoutException:
        raise HTTPException(504, "Gateway timeout")
    except httpx.ConnectError:
        raise HTTPException(503, "Service unavailable")


# Health check task
async def health_check_task():
    """Periodically check service health"""
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

## Interview Points

### Fundamental Concepts

**Q1: Please explain the difference between WSGI and ASGI?**

```
Key points in answer:

1. Synchronous vs Asynchronous
   - WSGI: Synchronous interface, blocks per request
   - ASGI: Asynchronous interface, supports coroutines and event loop

2. Protocol Support
   - WSGI: Only supports HTTP/1.1
   - ASGI: Supports HTTP/1.1, HTTP/2, WebSocket

3. Interface Design
   - WSGI: application(environ, start_response) -> Iterable[bytes]
   - ASGI: async application(scope, receive, send)

4. Concurrency Model
   - WSGI: Multi-process/Multi-thread
   - ASGI: Single thread + event loop, efficient for I/O-bound tasks

5. Use Cases
   - WSGI: Traditional synchronous Web apps, CPU-bound
   - ASGI: Real-time apps, high concurrency I/O-bound
```

**Q2: What are the Gunicorn worker types? And their use cases?**

```
Key points in answer:

1. sync (default)
   - Synchronous blocking worker
   - Each worker handles one request at a time
   - Use case: General Web apps, CPU-bound tasks

2. gthread
   - Thread worker
   - Multiple threads per worker
   - Use case: I/O-bound applications

3. gevent
   - greenlet-based coroutine worker
   - Single worker handles high concurrency
   - Use case: High concurrency I/O-bound, requires patching third-party libraries

4. eventlet
   - Similar to gevent coroutine worker
   - Use case: High concurrency scenarios

5. uvicorn.workers.UvicornWorker
   - ASGI worker
   - Use case: FastAPI, Starlette and other ASGI applications

Selection recommendations:
- Default to sync
- Use gthread if many database/external API calls
- Use gevent/eventlet for handling many concurrent connections
- Use UvicornWorker for async applications
```

**Q3: How to calculate Gunicorn worker count?**

```python
"""
Worker count calculation formula:

1. CPU-bound applications
   workers = CPU core count

2. I/O-bound applications
   workers = (2 * CPU core count) + 1

3. Mixed applications
   workers = CPU core count + 1

4. Memory limit
   workers = Available memory / Single worker memory usage

Example calculation:
- 4-core CPU, 8GB memory
- Each worker approximately 300MB memory
- I/O-bound application

workers = min(
    (2 * 4) + 1,  # CPU calculation = 9
    8192 / 300     # Memory limit ~= 27
) = 9

Final choice: 9 workers
"""
```

### Practical Problems

**Q4: How to properly handle synchronous blocking code in ASGI applications?**

```python
"""
Wrong approach: Call synchronous code directly in async function
"""

import time

async def bad_handler():
    # This blocks the entire event loop!
    time.sleep(5)
    return {"result": "done"}


"""
Correct approach 1: Use run_in_executor
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
Correct approach 2: Use asyncio.to_thread (Python 3.9+)
"""

async def good_handler_2():
    result = await asyncio.to_thread(blocking_operation)
    return {"result": result}


"""
Correct approach 3: Use async library alternative
"""

import asyncio

async def good_handler_3():
    await asyncio.sleep(5)  # Async sleep
    return {"result": "done"}
```

**Q5: How to implement graceful shutdown (Graceful Shutdown)?**

```python
"""
WSGI (Gunicorn) graceful shutdown configuration
"""

# gunicorn.conf.py
timeout = 30
graceful_timeout = 30  # Wait time for graceful shutdown

def worker_exit(server, worker):
    """Clean up resources on worker exit"""
    from myapp import cleanup_resources
    cleanup_resources()


"""
ASGI (FastAPI) graceful shutdown implementation
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio

# Track in-progress requests
active_requests = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    yield

    # Shutdown - wait for all requests to complete
    print("Shutting down...")
    if active_requests:
        print(f"Waiting for {len(active_requests)} requests to complete...")
        # Set maximum wait time
        try:
            await asyncio.wait_for(
                wait_for_requests_to_complete(),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            print("Timeout waiting for requests, forcing shutdown")

    # Clean up resources
    await cleanup_resources()


async def wait_for_requests_to_complete():
    while active_requests:
        await asyncio.sleep(0.1)


app = FastAPI(lifespan=lifespan)
```

**Q6: Describe a production environment deployment architecture?**

```
Key points in answer:

Complete production environment architecture:

1. Network Layer
   - CDN: Static resource caching, DDoS protection
   - Load Balancer: Nginx/HAProxy, SSL termination

2. Application Layer
   - Reverse Proxy: Nginx
   - Application Servers:
     - WSGI: Gunicorn + 4-8 workers
     - ASGI: Uvicorn + 4 workers (managed by Gunicorn)
   - Process Management: Systemd/Supervisor

3. Data Layer
   - Database: PostgreSQL/MySQL (master-slave replication)
   - Cache: Redis Cluster
   - Message Queue: RabbitMQ/Kafka

4. Monitoring Layer
   - Metrics Collection: Prometheus
   - Visualization: Grafana
   - Log Aggregation: ELK Stack
   - Alerting: Alertmanager

5. Deployment Strategy
   - Containerization: Docker + Kubernetes
   - CI/CD: GitHub Actions / GitLab CI
   - Blue-green deployment or rolling update

Key configurations:
- Worker count = 2 * CPU + 1
- Connection pool size configured per database limits
- Set reasonable timeout values
- Enable Gzip compression
- Configure Keep-Alive
```

## Further Reading

### Official Documentation

- [PEP 3333 - WSGI Specification](https://peps.python.org/pep-3333/)
- [ASGI Specification](https://asgi.readthedocs.io/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Uvicorn Documentation](https://www.uvicorn.org/)
- [Hypercorn Documentation](https://pgjones.gitlab.io/hypercorn/)
- [uWSGI Documentation](https://uwsgi-docs.readthedocs.io/)

### Framework Documentation

- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Django Deployment Documentation](https://docs.djangoproject.com/en/stable/howto/deployment/)
- [Flask Deployment Guide](https://flask.palletsprojects.com/en/latest/deploying/)
- [Django Channels Documentation](https://channels.readthedocs.io/)

### In-Depth Learning

- [Real Python - Python WSGI Servers](https://realpython.com/python-wsgi-servers/)
- [Encode - ASGI Explained](https://www.encode.io/articles/asgi-explained)
- [TestDriven.io - Gunicorn Configuration](https://testdriven.io/blog/gunicorn-config/)
- [Python asyncio Official Documentation](https://docs.python.org/3/library/asyncio.html)

### Performance Optimization

- [Uvicorn Performance Tips](https://www.uvicorn.org/#performance)
- [Gunicorn Design](https://docs.gunicorn.org/en/stable/design.html)
- [High-Performance Python Web Services](https://calpaterson.com/async-python-is-not-faster.html)

### Related Tools

- [locust](https://locust.io/) - Load testing tool
- [wrk](https://github.com/wg/wrk) - HTTP benchmark
- [Prometheus Python Client](https://github.com/prometheus/client_python)
- [Sentry Python SDK](https://docs.sentry.io/platforms/python/)
