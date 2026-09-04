---
title: Python httpx HTTP Client
description: Learn httpx for synchronous and asynchronous HTTP requests, a modern alternative to requests
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - httpx
  - HTTP
  - Async
status: imported
origin: old/src/content/docs/python/httpx.en.md
divergence: 0.212
issues: []
legacy:
  category: Python
  subcategory: Networking
  order: 41
  lastUpdated: 2026-01-07
---

httpx is Python's next-generation HTTP client library, providing both synchronous and asynchronous APIs while supporting HTTP/1.1 and HTTP/2 protocols. As a modern replacement for the requests library, httpx inherits requests' elegant API design while adding async support, HTTP/2, strict timeout control, and other modern features.

## Installation

Install the basic version using pip:

```bash
pip install httpx
```

Install with HTTP/2 support:

```bash
pip install httpx[http2]
```

Install all optional dependencies:

```bash
pip install httpx[http2,brotli,zstd,socks,cli]
```

Optional dependency descriptions:
- `http2`: HTTP/2 protocol support
- `brotli`: Brotli compression decoding support
- `zstd`: Zstandard compression decoding support
- `socks`: SOCKS proxy support
- `cli`: Command line client

## Quick Start

### Basic Requests

```python
import httpx

# GET request
response = httpx.get('https://httpbin.org/get')
print(response.status_code)  # 200
print(response.text)         # Response content

# POST request
response = httpx.post('https://httpbin.org/post', data={'key': 'value'})

# Other HTTP methods
response = httpx.put('https://httpbin.org/put', data={'key': 'value'})
response = httpx.delete('https://httpbin.org/delete')
response = httpx.head('https://httpbin.org/get')
response = httpx.options('https://httpbin.org/get')
response = httpx.patch('https://httpbin.org/patch', data={'key': 'value'})
```

### URL Parameters

```python
import httpx

# Pass query parameters using dict
params = {'key1': 'value1', 'key2': 'value2'}
response = httpx.get('https://httpbin.org/get', params=params)
print(response.url)  # https://httpbin.org/get?key1=value1&key2=value2

# Multi-value parameters
params = {'key': ['value1', 'value2']}
response = httpx.get('https://httpbin.org/get', params=params)
print(response.url)  # https://httpbin.org/get?key=value1&key=value2
```

### Response Handling

```python
import httpx

response = httpx.get('https://api.github.com/repos/encode/httpx')

# Status code
print(response.status_code)  # 200
print(response.status_code == httpx.codes.OK)  # True

# Response headers
print(response.headers['content-type'])  # application/json; charset=utf-8

# Text content
print(response.text)

# Binary content
print(response.content)

# JSON response
data = response.json()
print(data['full_name'])  # encode/httpx

# Encoding
print(response.encoding)  # utf-8

# HTTP version
print(response.http_version)  # HTTP/1.1 or HTTP/2
```

## Synchronous Client

Using a `Client` instance instead of top-level API functions provides better performance and more features.

### Why Use Client

1. **Connection pool reuse**: Client uses HTTP connection pools, reusing TCP connections for requests to the same host
2. **Reduced latency**: No need for handshake on every request
3. **Cookie persistence**: Automatically maintains cookies between requests
4. **Shared configuration**: Set unified configuration for all requests
5. **HTTP/2 support**: Only Client can enable HTTP/2

### Basic Usage

```python
import httpx

# Recommended: use context manager
with httpx.Client() as client:
    response = client.get('https://httpbin.org/get')
    print(response.status_code)

# Or manual management
client = httpx.Client()
try:
    response = client.get('https://httpbin.org/get')
finally:
    client.close()
```

### Shared Configuration

```python
import httpx

# Set default request headers
headers = {'User-Agent': 'MyApp/1.0'}

with httpx.Client(headers=headers) as client:
    # All requests will include this User-Agent
    response = client.get('https://httpbin.org/headers')
    print(response.json())

# Set base URL
with httpx.Client(base_url='https://api.github.com') as client:
    # Automatically concatenates base_url
    response = client.get('/repos/encode/httpx')
    print(response.url)  # https://api.github.com/repos/encode/httpx

# Set default timeout
with httpx.Client(timeout=30.0) as client:
    response = client.get('https://httpbin.org/delay/5')
```

### Configuration Merging

```python
import httpx

# Client-level configuration
client_headers = {'X-Auth': 'client-token'}
client_params = {'client_id': 'abc123'}

with httpx.Client(headers=client_headers, params=client_params) as client:
    # Request-level configuration
    request_headers = {'X-Request-ID': 'req-001'}
    request_params = {'page': '1'}

    response = client.get(
        'https://httpbin.org/get',
        headers=request_headers,
        params=request_params
    )

    # headers, params, cookies are merged
    # Other parameters use request-level priority
```

## Async Client (AsyncClient)

httpx's async support is one of its biggest highlights, especially suitable for high-concurrency scenarios.

### Basic Usage

```python
import httpx
import asyncio

async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://httpbin.org/get')
        return response.json()

# Run async function
data = asyncio.run(fetch_data())
print(data)
```

### Concurrent Requests

```python
import httpx
import asyncio

async def fetch_all():
    urls = [
        'https://httpbin.org/get?id=1',
        'https://httpbin.org/get?id=2',
        'https://httpbin.org/get?id=3',
    ]

    async with httpx.AsyncClient() as client:
        # Send all requests concurrently
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)

        return [r.json() for r in responses]

results = asyncio.run(fetch_all())
for result in results:
    print(result['args'])
```

### Async Streaming Response

```python
import httpx
import asyncio

async def stream_download():
    async with httpx.AsyncClient() as client:
        async with client.stream('GET', 'https://httpbin.org/stream/10') as response:
            async for chunk in response.aiter_bytes():
                print(f"Received {len(chunk)} bytes")

            # Or read line by line
            # async for line in response.aiter_lines():
            #     print(line)

asyncio.run(stream_download())
```

### Streaming Requests in Async Context

```python
import httpx
import asyncio

async def upload_stream():
    async def generate_data():
        for i in range(10):
            yield f"data chunk {i}\n".encode()
            await asyncio.sleep(0.1)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://httpbin.org/post',
            content=generate_data()
        )
        return response.json()

result = asyncio.run(upload_stream())
print(result)
```

### Supported Async Frameworks

httpx automatically detects and supports the following async frameworks:

```python
# asyncio (Python built-in)
import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://httpbin.org/get')
        print(response.json())

asyncio.run(main())

# trio
import trio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://httpbin.org/get')
        print(response.json())

trio.run(main)

# anyio
import anyio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://httpbin.org/get')
        print(response.json())

anyio.run(main, backend='trio')  # or 'asyncio'
```

## Sending Data

### Form Data

```python
import httpx

# Form-encoded data
data = {'username': 'john', 'password': 'secret'}
response = httpx.post('https://httpbin.org/post', data=data)
print(response.json()['form'])

# Multi-value form fields
data = {'interests': ['python', 'javascript', 'rust']}
response = httpx.post('https://httpbin.org/post', data=data)
```

### JSON Data

```python
import httpx

# Automatically serializes to JSON
data = {
    'name': 'httpx',
    'features': ['async', 'http2', 'streaming'],
    'version': 0.27
}
response = httpx.post('https://httpbin.org/post', json=data)
print(response.json()['json'])
```

### Binary Data

```python
import httpx

# Send binary content
content = b'Binary data here'
response = httpx.post(
    'https://httpbin.org/post',
    content=content,
    headers={'Content-Type': 'application/octet-stream'}
)
```

### File Upload

```python
import httpx

# Single file upload
with open('report.pdf', 'rb') as f:
    files = {'file': f}
    response = httpx.post('https://httpbin.org/post', files=files)

# Specify filename and MIME type
with open('report.pdf', 'rb') as f:
    files = {'file': ('custom_name.pdf', f, 'application/pdf')}
    response = httpx.post('https://httpbin.org/post', files=files)

# Multiple file upload
with open('file1.txt', 'rb') as f1, open('file2.txt', 'rb') as f2:
    files = [
        ('files', ('file1.txt', f1, 'text/plain')),
        ('files', ('file2.txt', f2, 'text/plain')),
    ]
    response = httpx.post('https://httpbin.org/post', files=files)

# Mixed files and form data
with open('avatar.png', 'rb') as f:
    data = {'username': 'john', 'email': 'john@example.com'}
    files = {'avatar': f}
    response = httpx.post('https://httpbin.org/post', data=data, files=files)
```

## Authentication

### Basic Authentication

```python
import httpx

# Tuple form
response = httpx.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=('user', 'pass')
)
print(response.status_code)  # 200

# Set in Client
with httpx.Client(auth=('user', 'pass')) as client:
    response = client.get('https://httpbin.org/basic-auth/user/pass')
```

### Digest Authentication

```python
import httpx

auth = httpx.DigestAuth('user', 'pass')
response = httpx.get(
    'https://httpbin.org/digest-auth/auth/user/pass',
    auth=auth
)
```

### Bearer Token

```python
import httpx

# Manually set Authorization header
headers = {'Authorization': 'Bearer your-token-here'}
response = httpx.get('https://api.example.com/data', headers=headers)

# Custom auth class
class BearerAuth(httpx.Auth):
    def __init__(self, token: str):
        self.token = token

    def auth_flow(self, request):
        request.headers['Authorization'] = f'Bearer {self.token}'
        yield request

auth = BearerAuth('your-token-here')
response = httpx.get('https://api.example.com/data', auth=auth)
```

### Custom Auth Flow

```python
import httpx

class CustomAuth(httpx.Auth):
    """Auth class supporting token refresh"""

    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

    def auth_flow(self, request):
        # Add auth header
        request.headers['Authorization'] = f'Bearer {self.access_token}'
        response = yield request

        # If token expired, refresh and retry
        if response.status_code == 401:
            self.refresh_access_token()
            request.headers['Authorization'] = f'Bearer {self.access_token}'
            yield request

    def refresh_access_token(self):
        # Implement token refresh logic
        response = httpx.post(
            'https://api.example.com/refresh',
            data={'refresh_token': self.refresh_token}
        )
        self.access_token = response.json()['access_token']
```

## Timeout Control

httpx sets a default 5-second timeout for all network operations to prevent requests from hanging indefinitely.

### Simple Timeout

```python
import httpx

# Set total timeout
response = httpx.get('https://httpbin.org/delay/2', timeout=10.0)

# Disable timeout
response = httpx.get('https://httpbin.org/delay/10', timeout=None)

# Client-level setting
with httpx.Client(timeout=30.0) as client:
    response = client.get('https://httpbin.org/delay/5')
```

### Fine-Grained Timeout Control

```python
import httpx

# Create timeout configuration object
timeout = httpx.Timeout(
    connect=5.0,    # Connection timeout
    read=10.0,      # Read timeout
    write=5.0,      # Write timeout
    pool=10.0       # Connection pool wait timeout
)

response = httpx.get('https://httpbin.org/get', timeout=timeout)

# Or use defaults with specific overrides
timeout = httpx.Timeout(10.0, connect=30.0)  # Overall 10s, connect 30s

with httpx.Client(timeout=timeout) as client:
    response = client.get('https://slow-server.example.com/')
```

### Timeout Exception Handling

```python
import httpx

try:
    response = httpx.get('https://httpbin.org/delay/10', timeout=1.0)
except httpx.TimeoutException as e:
    print(f"Request timeout: {e}")
except httpx.ConnectTimeout:
    print("Connection timeout")
except httpx.ReadTimeout:
    print("Read timeout")
except httpx.WriteTimeout:
    print("Write timeout")
except httpx.PoolTimeout:
    print("Connection pool wait timeout")
```

## Streaming

### Streaming Download

```python
import httpx

# Use stream() context manager
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    # Read byte stream
    for chunk in response.iter_bytes():
        print(f"Received {len(chunk)} bytes")

# Read text stream
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    for text in response.iter_text():
        print(text)

# Read line by line
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    for line in response.iter_lines():
        print(line)

# Read raw bytes (without decompression)
with httpx.stream('GET', 'https://example.com/file.gz') as response:
    for chunk in response.iter_raw():
        print(len(chunk))
```

### Large File Download with Progress

```python
import httpx
from tqdm import tqdm

def download_with_progress(url: str, filename: str):
    with httpx.stream('GET', url) as response:
        total = int(response.headers.get('Content-Length', 0))

        with open(filename, 'wb') as f:
            with tqdm(total=total, unit='B', unit_scale=True) as pbar:
                downloaded = 0
                for chunk in response.iter_bytes():
                    f.write(chunk)
                    pbar.update(len(chunk))

download_with_progress(
    'https://speed.hetzner.de/100MB.bin',
    'downloaded_file.bin'
)
```

### Conditional Reading

```python
import httpx

MAX_SIZE = 10 * 1024 * 1024  # 10 MB

with httpx.stream('GET', 'https://example.com/file') as response:
    content_length = int(response.headers.get('Content-Length', 0))

    if content_length < MAX_SIZE:
        # File is small enough, read completely
        response.read()
        print(response.text)
    else:
        print(f"File too large ({content_length} bytes), skipping download")
```

## HTTP/2 Support

HTTP/2 provides multiplexing, header compression, and other features that can significantly improve performance in high-concurrency scenarios.

### Enabling HTTP/2

```python
import httpx

# First install HTTP/2 dependencies
# pip install httpx[http2]

# Synchronous client
with httpx.Client(http2=True) as client:
    response = client.get('https://httpbin.org/get')
    print(response.http_version)  # HTTP/2

# Async client
import asyncio

async def main():
    async with httpx.AsyncClient(http2=True) as client:
        response = await client.get('https://httpbin.org/get')
        print(response.http_version)

asyncio.run(main())
```

### Checking HTTP Version

```python
import httpx

with httpx.Client(http2=True) as client:
    response = client.get('https://www.google.com')

    # Could be HTTP/1.0, HTTP/1.1, or HTTP/2
    # Depends on whether server supports HTTP/2
    print(f"Protocol used: {response.http_version}")
```

### HTTP/2 Advantages

```python
import httpx
import asyncio
import time

async def benchmark_http2():
    urls = [f'https://httpbin.org/get?id={i}' for i in range(20)]

    # HTTP/1.1
    start = time.time()
    async with httpx.AsyncClient(http2=False) as client:
        await asyncio.gather(*[client.get(url) for url in urls])
    http1_time = time.time() - start

    # HTTP/2
    start = time.time()
    async with httpx.AsyncClient(http2=True) as client:
        await asyncio.gather(*[client.get(url) for url in urls])
    http2_time = time.time() - start

    print(f"HTTP/1.1: {http1_time:.2f}s")
    print(f"HTTP/2:   {http2_time:.2f}s")

asyncio.run(benchmark_http2())
```

## Cookie Handling

### Reading Cookies

```python
import httpx

response = httpx.get('https://httpbin.org/cookies/set?name=value')
print(response.cookies['name'])  # value

# Iterate all cookies
for name, value in response.cookies.items():
    print(f"{name}: {value}")
```

### Sending Cookies

```python
import httpx

# Using dict
cookies = {'session_id': 'abc123', 'user': 'john'}
response = httpx.get('https://httpbin.org/cookies', cookies=cookies)
print(response.json())

# Using Cookies object (supports domain filtering)
cookies = httpx.Cookies()
cookies.set('cookie1', 'value1', domain='httpbin.org')
cookies.set('cookie2', 'value2', domain='example.com')

response = httpx.get('https://httpbin.org/cookies', cookies=cookies)
# Only cookie1 is sent because cookie2 is for example.com domain
```

### Cookie Persistence in Client

```python
import httpx

with httpx.Client() as client:
    # Set cookie
    client.get('https://httpbin.org/cookies/set?session=xyz789')

    # Subsequent requests automatically include cookie
    response = client.get('https://httpbin.org/cookies')
    print(response.json())  # {'cookies': {'session': 'xyz789'}}
```

## Redirect Handling

### Default Behavior

```python
import httpx

# Default: don't automatically follow redirects
response = httpx.get('http://github.com/')
print(response.status_code)  # 301
print(response.next_request)  # Next request object
print(response.history)  # Empty list

# Enable automatic redirects
response = httpx.get('http://github.com/', follow_redirects=True)
print(response.status_code)  # 200
print(response.url)  # https://github.com/
print(response.history)  # [<Response [301]>]
```

### Client-Level Setting

```python
import httpx

with httpx.Client(follow_redirects=True) as client:
    # All requests will automatically follow redirects
    response = client.get('http://github.com/')
    print(response.url)  # https://github.com/

# Limit maximum redirect count
with httpx.Client(follow_redirects=True, max_redirects=5) as client:
    response = client.get('http://example.com/')
```

## Proxy Support

### HTTP Proxy

```python
import httpx

# Single proxy
proxies = 'http://proxy.example.com:8080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
    print(response.json())

# Proxy with authentication
proxies = 'http://user:pass@proxy.example.com:8080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
```

### SOCKS Proxy

```python
import httpx

# Requires installation: pip install httpx[socks]

proxies = 'socks5://localhost:1080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
    print(response.json())
```

## Exception Handling

### Exception Hierarchy

```python
"""
httpx exception hierarchy:
HTTPError
├── RequestError (request-related errors)
│   ├── TransportError
│   │   ├── TimeoutException
│   │   │   ├── ConnectTimeout
│   │   │   ├── ReadTimeout
│   │   │   ├── WriteTimeout
│   │   │   └── PoolTimeout
│   │   ├── NetworkError
│   │   │   ├── ConnectError
│   │   │   ├── ReadError
│   │   │   ├── WriteError
│   │   │   └── CloseError
│   │   ├── ProtocolError
│   │   │   ├── LocalProtocolError
│   │   │   └── RemoteProtocolError
│   │   ├── ProxyError
│   │   └── UnsupportedProtocol
│   ├── DecodingError
│   └── TooManyRedirects
└── HTTPStatusError (HTTP status code errors)
"""
```

### Complete Exception Handling

```python
import httpx

def safe_request(url: str) -> dict | None:
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

    except httpx.TimeoutException as e:
        print(f"Request timeout: {e}")
    except httpx.NetworkError as e:
        print(f"Network error: {e}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP error {e.response.status_code}: {e.response.text}")
    except httpx.RequestError as e:
        print(f"Request error: {e}")

    return None

# Usage
data = safe_request('https://api.github.com/repos/encode/httpx')
if data:
    print(data['full_name'])
```

### Using raise_for_status

```python
import httpx

# Method chaining
try:
    data = httpx.get('https://api.example.com/data').raise_for_status().json()
except httpx.HTTPStatusError as e:
    print(f"Request failed: {e.response.status_code}")
```

## httpx vs requests Comparison

### API Compatibility

```python
# requests code
import requests

session = requests.Session()
session.headers.update({'User-Agent': 'MyApp'})
response = session.get('https://httpbin.org/get')

# httpx equivalent
import httpx

with httpx.Client(headers={'User-Agent': 'MyApp'}) as client:
    response = client.get('https://httpbin.org/get')
```

### Key Differences

| Feature | requests | httpx |
|---------|----------|-------|
| Sync API | Yes | Yes |
| Async API | No | Yes |
| HTTP/2 | No | Yes |
| Default timeout | None | 5 seconds |
| Redirects | Auto-follow | Default off |
| Type hints | Partial | Complete |
| Connection pool | Session | Client |
| WSGI/ASGI testing | No | Yes |

### Migration Examples

```python
# requests
import requests

session = requests.Session()
session.auth = ('user', 'pass')
response = session.get('https://api.example.com/data', timeout=30)

# httpx equivalent
import httpx

with httpx.Client(auth=('user', 'pass'), timeout=30.0) as client:
    response = client.get('https://api.example.com/data')

# requests async (requires aiohttp)
import aiohttp
import asyncio

async def fetch():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.example.com/data') as response:
            return await response.json()

# httpx async
import httpx
import asyncio

async def fetch():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://api.example.com/data')
        return response.json()
```

## Advanced Usage

### Custom Transport Layer

```python
import httpx

# Configure connection limits
limits = httpx.Limits(
    max_connections=100,
    max_keepalive_connections=20,
    keepalive_expiry=30.0
)

with httpx.Client(limits=limits) as client:
    response = client.get('https://httpbin.org/get')

# Configure retries
transport = httpx.HTTPTransport(retries=3)
with httpx.Client(transport=transport) as client:
    response = client.get('https://httpbin.org/get')
```

### Request Instances

```python
import httpx

# Create request object
request = httpx.Request('GET', 'https://httpbin.org/get')

with httpx.Client() as client:
    # Modify request
    request.headers['X-Custom'] = 'value'

    # Send request
    response = client.send(request)
    print(response.json())

# Use build_request to create request with client config
with httpx.Client(headers={'User-Agent': 'MyApp'}) as client:
    request = client.build_request('GET', 'https://httpbin.org/get')

    # Request already includes client's default headers
    print(request.headers['User-Agent'])  # MyApp

    # Can further modify
    del request.headers['User-Agent']
    request.headers['User-Agent'] = 'CustomAgent'

    response = client.send(request)
```

### WSGI/ASGI Application Testing

```python
import httpx

# Test Flask/Django and other WSGI apps
from myapp import app  # Flask/Django app

transport = httpx.WSGITransport(app=app)
with httpx.Client(transport=transport, base_url='http://testserver') as client:
    response = client.get('/api/users')
    assert response.status_code == 200

# Test FastAPI/Starlette and other ASGI apps
from myapp import app  # FastAPI app
import asyncio

async def test_asgi():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
        response = await client.get('/api/users')
        assert response.status_code == 200

asyncio.run(test_asgi())
```

### Event Hooks

```python
import httpx

def log_request(request):
    print(f"Request: {request.method} {request.url}")

def log_response(response):
    print(f"Response: {response.status_code}")

with httpx.Client(
    event_hooks={
        'request': [log_request],
        'response': [log_response]
    }
) as client:
    response = client.get('https://httpbin.org/get')
    # Output:
    # Request: GET https://httpbin.org/get
    # Response: 200
```

## Practical Application Examples

### RESTful API Client

```python
import httpx
from typing import Any

class APIClient:
    def __init__(self, base_url: str, api_key: str):
        self.client = httpx.Client(
            base_url=base_url,
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=30.0
        )

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.client.close()

    def get(self, endpoint: str, params: dict = None) -> Any:
        response = self.client.get(endpoint, params=params)
        response.raise_for_status()
        return response.json()

    def post(self, endpoint: str, data: dict) -> Any:
        response = self.client.post(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    def put(self, endpoint: str, data: dict) -> Any:
        response = self.client.put(endpoint, json=data)
        response.raise_for_status()
        return response.json()

    def delete(self, endpoint: str) -> None:
        response = self.client.delete(endpoint)
        response.raise_for_status()

# Usage
with APIClient('https://api.example.com', 'your-api-key') as api:
    users = api.get('/users')
    new_user = api.post('/users', {'name': 'John', 'email': 'john@example.com'})
    api.delete(f'/users/{new_user["id"]}')
```

### Async Crawler

```python
import httpx
import asyncio
from urllib.parse import urljoin
from bs4 import BeautifulSoup

class AsyncCrawler:
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.visited = set()

    async def fetch(self, client: httpx.AsyncClient, url: str) -> str | None:
        async with self.semaphore:
            try:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                return response.text
            except httpx.HTTPError as e:
                print(f"Error {url}: {e}")
                return None

    async def crawl(self, start_url: str, max_pages: int = 100):
        to_visit = [start_url]
        results = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            while to_visit and len(self.visited) < max_pages:
                # Batch fetch
                batch = []
                while to_visit and len(batch) < 10:
                    url = to_visit.pop(0)
                    if url not in self.visited:
                        self.visited.add(url)
                        batch.append(url)

                if not batch:
                    break

                # Concurrent requests
                tasks = [self.fetch(client, url) for url in batch]
                pages = await asyncio.gather(*tasks)

                for url, html in zip(batch, pages):
                    if html:
                        results.append({'url': url, 'html': html})
                        # Extract links (simplified example)
                        soup = BeautifulSoup(html, 'html.parser')
                        for link in soup.find_all('a', href=True):
                            full_url = urljoin(url, link['href'])
                            if full_url.startswith('http') and full_url not in self.visited:
                                to_visit.append(full_url)

        return results

# Usage
async def main():
    crawler = AsyncCrawler(max_concurrent=5)
    results = await crawler.crawl('https://example.com', max_pages=10)
    print(f"Crawled {len(results)} pages")

asyncio.run(main())
```

### Robust Client with Retry

```python
import httpx
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

class RobustClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client: httpx.AsyncClient | None = None

    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(30.0, connect=10.0),
            http2=True
        )
        return self

    async def __aexit__(self, *args):
        if self.client:
            await self.client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    async def request(self, method: str, url: str, **kwargs) -> httpx.Response:
        response = await self.client.request(method, url, **kwargs)
        response.raise_for_status()
        return response

    async def get(self, url: str, **kwargs) -> httpx.Response:
        return await self.request('GET', url, **kwargs)

    async def post(self, url: str, **kwargs) -> httpx.Response:
        return await self.request('POST', url, **kwargs)

# Usage
async def main():
    async with RobustClient('https://api.example.com') as client:
        response = await client.get('/data')
        print(response.json())

asyncio.run(main())
```

## Best Practices

### Always Use Client

```python
import httpx

# Not recommended - creates new connection each time
for i in range(100):
    response = httpx.get(f'https://api.example.com/item/{i}')

# Recommended - reuses connections
with httpx.Client() as client:
    for i in range(100):
        response = client.get(f'https://api.example.com/item/{i}')
```

### Handle Exceptions Properly

```python
import httpx

with httpx.Client() as client:
    try:
        response = client.get('https://api.example.com/data')
        response.raise_for_status()
    except httpx.TimeoutException:
        # Timeout - retry or fallback
        pass
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            # Rate limited - wait and retry
            pass
        elif e.response.status_code >= 500:
            # Server error - can retry
            pass
        else:
            # Client error - check request
            raise
```

### Use Type Hints

```python
import httpx
from typing import TypedDict

class User(TypedDict):
    id: int
    name: str
    email: str

def get_user(client: httpx.Client, user_id: int) -> User:
    response = client.get(f'/users/{user_id}')
    response.raise_for_status()
    return response.json()
```

### Configure Reasonable Timeouts

```python
import httpx

# Configure timeout based on API characteristics
timeout = httpx.Timeout(
    connect=5.0,     # Connection should be quick
    read=30.0,       # Reading may take longer
    write=10.0,      # Writing usually quick
    pool=10.0        # Wait for connection pool
)

with httpx.Client(timeout=timeout) as client:
    response = client.get('https://api.example.com/large-data')
```

### Use AsyncClient for Async Scenarios

```python
import httpx
import asyncio

# Use async for I/O intensive tasks
async def fetch_many(urls: list[str]) -> list[dict]:
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        results = []
        for response in responses:
            if isinstance(response, Exception):
                results.append({'error': str(response)})
            else:
                results.append(response.json())

        return results
```

## Summary

httpx is the modern choice for Python HTTP clients. Its main advantages include:

1. **Unified sync/async**: Same API supports both synchronous and asynchronous modes
2. **HTTP/2 support**: Native HTTP/2 protocol support improves concurrent performance
3. **Strict timeouts**: Reasonable default timeouts prevent hanging requests
4. **Complete types**: Full type annotations for better IDE support
5. **Test-friendly**: Built-in WSGI/ASGI transport for easy web app testing
6. **requests compatible**: API design compatible with requests, low migration cost

For new projects, especially those requiring async support or HTTP/2, httpx is a better choice than requests.
