---
title: Requests HTTP库
description: Python Requests完全指南，HTTP请求、会话管理与认证
track: backend
section: http-apis
difficulty: beginner
tags:
  - Python
  - Requests
  - HTTP
  - API
status: imported
origin: old/src/content/docs/python/requests.en.md
divergence: 0.193
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 第三方库
  order: 28
  lastUpdated: 2026-01-07
---

Requests is the most popular HTTP client library in Python, renowned for its simple and elegant API design. It makes sending HTTP requests straightforward and intuitive, and is widely used in web scraping, API calls, automated testing, and more. We'll cover using the Requests library and its best practices comprehensively.

## Core Concepts

### What is Requests?

Requests is an HTTP client library built on urllib3, designed with the philosophy of "HTTP for Humans." Compared to Python's standard library urllib, Requests provides a more concise and intuitive API, allowing developers to complete HTTP requests with minimal code.

### Why Choose Requests?

1. **Simple API**: Send requests with a single line of code
2. **Automatic Encoding Handling**: Automatically detects response encoding
3. **Session Management**: Supports Cookie persistence and connection pooling
4. **Rich Authentication Methods**: Supports Basic, Digest, OAuth, and more
5. **File Upload**: Simplifies multipart form data handling
6. **SSL Certificate Verification**: Security verification enabled by default
7. **Proxy Support**: Easy HTTP/HTTPS proxy configuration

```python
import requests

# Check version
print(requests.__version__)
```

## Installation and Basic Configuration

### Installing Requests

```bash
# Install using pip
pip install requests

# Install with security enhancements
pip install requests[security]

# Install using conda
conda install requests
```

### Basic Import

```python
import requests

# Common submodules
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
from requests.exceptions import RequestException, Timeout, ConnectionError
```

## GET Requests

GET requests are the most common HTTP method, used to retrieve data from a server.

### Basic GET Request

```python
import requests

# Simple GET request
response = requests.get('https://api.github.com')

# Check response status
print(f"Status code: {response.status_code}")
print(f"Response headers: {response.headers}")
print(f"Response content: {response.text[:200]}")
```

### GET Request with Query Parameters

```python
# Method 1: Concatenate parameters directly in URL
response = requests.get('https://api.github.com/search/repositories?q=python&sort=stars')

# Method 2: Use params parameter (recommended)
params = {
    'q': 'python',
    'sort': 'stars',
    'order': 'desc',
    'per_page': 10
}
response = requests.get('https://api.github.com/search/repositories', params=params)

# View the actual request URL
print(f"Request URL: {response.url}")

# Handle list-type parameters
params = {
    'key': ['value1', 'value2']  # Generates key=value1&key=value2
}
response = requests.get('https://httpbin.org/get', params=params)
```

### Handling GET Responses

```python
response = requests.get('https://api.github.com/users/octocat')

# Text response
text_content = response.text

# JSON response (automatically parsed)
json_data = response.json()
print(f"Username: {json_data['login']}")
print(f"Followers: {json_data['followers']}")

# Binary response (for downloading files)
binary_content = response.content

# Response encoding
print(f"Encoding: {response.encoding}")

# Manually set encoding
response.encoding = 'utf-8'
```

## POST Requests

POST requests are used to submit data to the server, commonly used for form submissions, API calls, and similar scenarios.

### Form Data Submission

```python
# Simulate form submission
data = {
    'username': 'testuser',
    'password': 'testpass',
    'remember': 'true'
}

response = requests.post('https://httpbin.org/post', data=data)
print(response.json())

# Content-Type is automatically set to application/x-www-form-urlencoded
```

### JSON Data Submission

```python
import json

# Method 1: Use json parameter (recommended)
payload = {
    'name': 'John Doe',
    'email': 'johndoe@example.com',
    'age': 25
}

response = requests.post(
    'https://httpbin.org/post',
    json=payload  # Automatically serializes and sets Content-Type
)

# Method 2: Manual serialization
headers = {'Content-Type': 'application/json'}
response = requests.post(
    'https://httpbin.org/post',
    data=json.dumps(payload),
    headers=headers
)

print(response.json())
```

### Sending Raw Data

```python
# Send XML data
xml_data = '''<?xml version="1.0" encoding="UTF-8"?>
<user>
    <name>John Doe</name>
    <email>johndoe@example.com</email>
</user>
'''

headers = {'Content-Type': 'application/xml'}
response = requests.post(
    'https://httpbin.org/post',
    data=xml_data,
    headers=headers
)

# Send plain text
response = requests.post(
    'https://httpbin.org/post',
    data='Hello, World!',
    headers={'Content-Type': 'text/plain'}
)
```

## Other HTTP Methods

Requests supports all standard HTTP methods.

```python
# PUT request - Complete resource update
response = requests.put(
    'https://httpbin.org/put',
    json={'name': 'Jane Doe', 'age': 30}
)

# PATCH request - Partial resource update
response = requests.patch(
    'https://httpbin.org/patch',
    json={'age': 31}
)

# DELETE request - Delete resource
response = requests.delete('https://httpbin.org/delete')

# HEAD request - Get response headers only
response = requests.head('https://httpbin.org/get')
print(response.headers)

# OPTIONS request - Get supported methods
response = requests.options('https://httpbin.org/')
print(response.headers.get('Allow'))
```

## Request Headers

Custom request headers are important for API calls and simulating browser behavior.

### Setting Custom Request Headers

```python
# Custom request headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Authorization': 'Bearer your-token-here',
    'X-Custom-Header': 'custom-value'
}

response = requests.get('https://httpbin.org/headers', headers=headers)
print(response.json())
```

### Common Request Header Examples

```python
# Simulate browser request
browser_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0'
}

# API request
api_headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

response = requests.get('https://example.com/api/data', headers=api_headers)
```

## Query Parameters in Detail

### Building Complex Query Parameters

```python
# Basic query parameters
params = {
    'search': 'Python tutorial',
    'page': 1,
    'limit': 20
}

# Multiple value parameters
params = {
    'tags': ['python', 'web', 'api'],  # tags=python&tags=web&tags=api
    'sort': 'date'
}

# Parameters with None value are automatically ignored
params = {
    'search': 'python',
    'category': None,  # Will not be included in the request
    'page': 1
}

response = requests.get('https://httpbin.org/get', params=params)
print(response.url)
```

### URL Encoding Handling

```python
# Requests automatically handles URL encoding
params = {
    'query': 'Chinese search keywords',
    'filter': 'name=John&age>20'
}

response = requests.get('https://httpbin.org/get', params=params)
# URL will be automatically encoded to a safe format
print(response.url)
```

## JSON Data Processing

### Sending JSON Data

```python
import requests

# Create user
user_data = {
    'name': 'John Doe',
    'email': 'johndoe@example.com',
    'profile': {
        'age': 25,
        'city': 'Beijing',
        'interests': ['programming', 'reading', 'traveling']
    }
}

response = requests.post(
    'https://httpbin.org/post',
    json=user_data
)

print(response.json())
```

### Parsing JSON Responses

```python
response = requests.get('https://api.github.com/users/octocat/repos')

# Automatically parse JSON
repos = response.json()

# Iterate through results
for repo in repos[:5]:
    print(f"Repository: {repo['name']}")
    print(f"  Description: {repo.get('description', 'No description')}")
    print(f"  Stars: {repo['stargazers_count']}")
    print()

# Handle JSON parsing errors
try:
    data = response.json()
except requests.exceptions.JSONDecodeError:
    print("Response is not valid JSON format")
    print(response.text)
```

## Session Management

Session objects can maintain certain parameters across multiple requests, such as Cookies, authentication information, etc.

### Basic Session Usage

```python
# Create session
session = requests.Session()

# Set session-level request headers
session.headers.update({
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
})

# All requests will use these settings
response1 = session.get('https://httpbin.org/get')
response2 = session.post('https://httpbin.org/post', json={'key': 'value'})

# Close session when done
session.close()
```

### Using Context Manager

```python
# Recommended: Use with statement for automatic session management
with requests.Session() as session:
    # Login
    login_data = {
        'username': 'user',
        'password': 'pass'
    }
    session.post('https://example.com/login', data=login_data)

    # Cookies are automatically maintained
    # Subsequent requests will include the post-login Cookies
    response = session.get('https://example.com/dashboard')
    print(response.text)
```

### Cookie Management

```python
# Send custom Cookies
cookies = {
    'session_id': 'abc123',
    'user_token': 'xyz789'
}

response = requests.get('https://httpbin.org/cookies', cookies=cookies)
print(response.json())

# Get Cookies from response
response = requests.get('https://httpbin.org/cookies/set/name/value')
print(response.cookies)
print(response.cookies['name'])

# Use Session for automatic Cookie management
with requests.Session() as session:
    # First request sets Cookie
    session.get('https://httpbin.org/cookies/set/sessionid/abc123')

    # Subsequent requests automatically include the Cookie
    response = session.get('https://httpbin.org/cookies')
    print(response.json())
```

### Session Configuration

```python
session = requests.Session()

# Set base URL (requires custom wrapper)
session.base_url = 'https://api.example.com'

# Set default timeout
session.timeout = 30

# Set retry strategy
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry_strategy = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[429, 500, 502, 503, 504]
)

adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

## Authentication Methods

Requests supports multiple authentication methods.

### Basic Authentication

```python
from requests.auth import HTTPBasicAuth

# Method 1: Use HTTPBasicAuth
response = requests.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=HTTPBasicAuth('user', 'pass')
)

# Method 2: Use tuple (shorthand)
response = requests.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=('user', 'pass')
)

print(response.status_code)
print(response.json())
```

### Digest Authentication

```python
from requests.auth import HTTPDigestAuth

response = requests.get(
    'https://httpbin.org/digest-auth/auth/user/pass',
    auth=HTTPDigestAuth('user', 'pass')
)
```

### Bearer Token Authentication

```python
# Method 1: Set in request headers
headers = {
    'Authorization': 'Bearer your-access-token'
}
response = requests.get('https://api.example.com/data', headers=headers)

# Method 2: Custom authentication class
from requests.auth import AuthBase

class BearerAuth(AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, request):
        request.headers['Authorization'] = f'Bearer {self.token}'
        return request

response = requests.get(
    'https://api.example.com/data',
    auth=BearerAuth('your-access-token')
)
```

### API Key Authentication

```python
# In request headers
headers = {'X-API-Key': 'your-api-key'}
response = requests.get('https://api.example.com/data', headers=headers)

# In query parameters
params = {'api_key': 'your-api-key'}
response = requests.get('https://api.example.com/data', params=params)

# Custom authentication class
class APIKeyAuth(AuthBase):
    def __init__(self, api_key, header_name='X-API-Key'):
        self.api_key = api_key
        self.header_name = header_name

    def __call__(self, request):
        request.headers[self.header_name] = self.api_key
        return request

response = requests.get(
    'https://api.example.com/data',
    auth=APIKeyAuth('your-api-key')
)
```

### OAuth 2.0 Authentication

```python
from requests_oauthlib import OAuth2Session

# OAuth2 client credentials flow
client_id = 'your-client-id'
client_secret = 'your-client-secret'
token_url = 'https://oauth.example.com/token'

# Get access token
from oauthlib.oauth2 import BackendApplicationClient

client = BackendApplicationClient(client_id=client_id)
oauth = OAuth2Session(client=client)

token = oauth.fetch_token(
    token_url=token_url,
    client_id=client_id,
    client_secret=client_secret
)

# Send request using token
response = oauth.get('https://api.example.com/protected-resource')
```

## File Upload

### Upload Single File

```python
# Upload file
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('https://httpbin.org/post', files=files)

# Specify filename and type
with open('document.pdf', 'rb') as f:
    files = {
        'file': ('custom_name.pdf', f, 'application/pdf')
    }
    response = requests.post('https://httpbin.org/post', files=files)

print(response.json())
```

### Upload Multiple Files

```python
# Upload multiple files
files = [
    ('files', ('file1.txt', open('file1.txt', 'rb'), 'text/plain')),
    ('files', ('file2.txt', open('file2.txt', 'rb'), 'text/plain')),
    ('files', ('image.png', open('image.png', 'rb'), 'image/png'))
]

response = requests.post('https://httpbin.org/post', files=files)

# Remember to close file handles
for _, (_, f, _) in files:
    f.close()
```

### Submit Files with Form Data

```python
# Upload file and form data together
with open('avatar.jpg', 'rb') as f:
    files = {'avatar': ('avatar.jpg', f, 'image/jpeg')}
    data = {
        'username': 'John Doe',
        'email': 'johndoe@example.com'
    }
    response = requests.post(
        'https://httpbin.org/post',
        files=files,
        data=data
    )

print(response.json())
```

### Upload In-Memory Files

```python
from io import BytesIO

# Upload from memory
content = b'Hello, World! This is file content.'
files = {
    'file': ('hello.txt', BytesIO(content), 'text/plain')
}

response = requests.post('https://httpbin.org/post', files=files)
```

## File Download

### Download Small Files

```python
# Simple download
response = requests.get('https://example.com/file.pdf')

with open('downloaded_file.pdf', 'wb') as f:
    f.write(response.content)
```

### Download Large Files (Streaming)

```python
# Use stream=True to avoid loading everything into memory at once
url = 'https://example.com/large_file.zip'

with requests.get(url, stream=True) as response:
    response.raise_for_status()

    with open('large_file.zip', 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

print("Download complete")
```

### Download with Progress Bar

```python
import requests
from tqdm import tqdm

url = 'https://example.com/large_file.zip'

response = requests.get(url, stream=True)
total_size = int(response.headers.get('content-length', 0))

with open('large_file.zip', 'wb') as f:
    with tqdm(total=total_size, unit='B', unit_scale=True, desc='Downloading') as pbar:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            pbar.update(len(chunk))
```

### Resume Download

```python
import os
import requests

def download_with_resume(url, filename):
    """Download function with resume support"""
    headers = {}

    # Check already downloaded file size
    if os.path.exists(filename):
        downloaded_size = os.path.getsize(filename)
        headers['Range'] = f'bytes={downloaded_size}-'
        mode = 'ab'  # Append mode
    else:
        downloaded_size = 0
        mode = 'wb'

    response = requests.get(url, headers=headers, stream=True)

    # Check if server supports resume
    if response.status_code == 206:  # Partial Content
        print(f"Resuming download, already downloaded: {downloaded_size} bytes")
    elif response.status_code == 200:
        print("Starting download from beginning")
        mode = 'wb'
    else:
        response.raise_for_status()

    with open(filename, mode) as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    print("Download complete")

download_with_resume('https://example.com/large_file.zip', 'file.zip')
```

## Timeout Settings

Setting appropriate timeouts prevents requests from waiting indefinitely.

### Basic Timeout Settings

```python
# Single timeout value (shared for connect and read)
response = requests.get('https://api.example.com', timeout=10)

# Separate connect timeout and read timeout
response = requests.get(
    'https://api.example.com',
    timeout=(3.05, 27)  # (connect timeout, read timeout)
)

# Never timeout (not recommended)
response = requests.get('https://api.example.com', timeout=None)
```

### Timeout Exception Handling

```python
from requests.exceptions import Timeout, ConnectTimeout, ReadTimeout

try:
    response = requests.get('https://api.example.com', timeout=5)
except ConnectTimeout:
    print("Connection timeout: Unable to establish connection")
except ReadTimeout:
    print("Read timeout: Server response too slow")
except Timeout:
    print("Request timeout")
```

### Global Timeout Configuration

```python
# Use Session to set default timeout
class TimeoutSession(requests.Session):
    def __init__(self, timeout=30):
        super().__init__()
        self.timeout = timeout

    def request(self, method, url, **kwargs):
        kwargs.setdefault('timeout', self.timeout)
        return super().request(method, url, **kwargs)

# Usage
session = TimeoutSession(timeout=10)
response = session.get('https://api.example.com')
```

## Error Handling

### Exception Types

```python
from requests.exceptions import (
    RequestException,      # Base class for all request exceptions
    ConnectionError,       # Network connection error
    HTTPError,            # HTTP error response
    URLRequired,          # Invalid URL
    TooManyRedirects,     # Too many redirects
    ConnectTimeout,       # Connection timeout
    ReadTimeout,          # Read timeout
    Timeout,              # Timeout (connection or read)
    JSONDecodeError       # JSON parsing error
)
```

### Complete Error Handling Example

```python
import requests
from requests.exceptions import (
    RequestException, ConnectionError, HTTPError,
    Timeout, TooManyRedirects
)

def safe_request(url, method='GET', **kwargs):
    """Safe request wrapper"""
    try:
        response = requests.request(method, url, **kwargs)
        response.raise_for_status()  # Check for HTTP errors
        return response

    except ConnectionError as e:
        print(f"Connection error: Unable to connect to {url}")
        print(f"Details: {e}")
        return None

    except Timeout as e:
        print(f"Request timeout: {url}")
        print(f"Details: {e}")
        return None

    except TooManyRedirects as e:
        print(f"Too many redirects: {url}")
        print(f"Details: {e}")
        return None

    except HTTPError as e:
        print(f"HTTP error: {e.response.status_code}")
        print(f"Response content: {e.response.text[:200]}")
        return e.response

    except RequestException as e:
        print(f"Request exception: {e}")
        return None

# Usage
response = safe_request('https://api.github.com/users/octocat', timeout=10)
if response:
    print(response.json())
```

### Status Code Checking

```python
response = requests.get('https://httpbin.org/status/404')

# Method 1: Check status code
if response.status_code == 200:
    print("Request successful")
elif response.status_code == 404:
    print("Resource not found")
elif response.status_code >= 500:
    print("Server error")

# Method 2: Use ok property
if response.ok:  # Status code in 200-299 range
    print("Request successful")

# Method 3: Use raise_for_status()
try:
    response.raise_for_status()
except requests.exceptions.HTTPError as e:
    print(f"HTTP error: {e}")
```

### Retry Mechanism

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import requests

def create_session_with_retry(
    retries=3,
    backoff_factor=0.3,
    status_forcelist=(500, 502, 503, 504)
):
    """Create session with retry mechanism"""
    session = requests.Session()

    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
        allowed_methods=['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'TRACE']
    )

    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    return session

# Usage
session = create_session_with_retry()
response = session.get('https://api.example.com/data')
```

## Proxy Settings

### Basic Proxy Configuration

```python
# HTTP and HTTPS proxy
proxies = {
    'http': 'http://proxy.example.com:8080',
    'https': 'https://proxy.example.com:8080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
print(response.json())
```

### Authenticated Proxy

```python
# Proxy with authentication
proxies = {
    'http': 'http://user:password@proxy.example.com:8080',
    'https': 'http://user:password@proxy.example.com:8080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
```

### SOCKS Proxy

```python
# Requires requests[socks]
# pip install requests[socks]

proxies = {
    'http': 'socks5://127.0.0.1:1080',
    'https': 'socks5://127.0.0.1:1080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
```

### Environment Variable Proxy

```python
import os

# Set environment variables
os.environ['HTTP_PROXY'] = 'http://proxy.example.com:8080'
os.environ['HTTPS_PROXY'] = 'https://proxy.example.com:8080'
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,.example.com'

# Requests will automatically use proxy from environment variables
response = requests.get('https://httpbin.org/ip')
```

## SSL/TLS Configuration

### Certificate Verification

```python
# SSL certificate verification enabled by default
response = requests.get('https://example.com')

# Disable certificate verification (not recommended for production)
response = requests.get('https://example.com', verify=False)

# Use custom CA certificate
response = requests.get('https://example.com', verify='/path/to/ca-bundle.crt')

# Use certificate directory
response = requests.get('https://example.com', verify='/path/to/certdir/')
```

### Client Certificate

```python
# Use client certificate for mutual TLS
response = requests.get(
    'https://secure.example.com',
    cert=('/path/to/client.cert', '/path/to/client.key')
)

# Password-protected certificate
response = requests.get(
    'https://secure.example.com',
    cert=('/path/to/client.cert', '/path/to/client.key', 'password')
)
```

### Disable Warnings

```python
import urllib3
import requests

# Disable insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

response = requests.get('https://example.com', verify=False)
```

## Advanced Features

### Request Hooks

```python
def log_request(response, *args, **kwargs):
    """Log request information"""
    print(f"Request URL: {response.request.url}")
    print(f"Request method: {response.request.method}")
    print(f"Response status: {response.status_code}")
    print(f"Response time: {response.elapsed.total_seconds():.2f}s")
    print("-" * 50)

# Use hook for single request
response = requests.get(
    'https://httpbin.org/get',
    hooks={'response': log_request}
)

# Use hook at session level
session = requests.Session()
session.hooks['response'].append(log_request)

response = session.get('https://httpbin.org/get')
```

### Streaming Requests

```python
# Stream response
response = requests.get('https://httpbin.org/stream/10', stream=True)

# Iterate response content
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))

# Iterate response chunks
for chunk in response.iter_content(chunk_size=1024):
    print(f"Received {len(chunk)} bytes")
```

### Request Preparation

```python
from requests import Request, Session

# Prepare request (without sending)
session = Session()

request = Request(
    'POST',
    'https://httpbin.org/post',
    data={'key': 'value'},
    headers={'X-Custom': 'header'}
)

# Prepare the request
prepared = session.prepare_request(request)

# Inspect the prepared request
print(f"URL: {prepared.url}")
print(f"Method: {prepared.method}")
print(f"Headers: {prepared.headers}")
print(f"Body: {prepared.body}")

# Send the prepared request
response = session.send(prepared)
```

### Custom Transport Adapter

```python
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

class CustomAdapter(HTTPAdapter):
    """Custom transport adapter"""

    def __init__(self, *args, **kwargs):
        self.ssl_context = create_urllib3_context()
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, *args, **kwargs):
        kwargs['ssl_context'] = self.ssl_context
        return super().init_poolmanager(*args, **kwargs)

# Use custom adapter
session = requests.Session()
session.mount('https://', CustomAdapter())
```

## Practical Examples

### Example 1: API Client Wrapper

```python
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class APIResponse:
    """API response wrapper class"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: int = 0

class APIClient:
    """Generic API client"""

    def __init__(self, base_url: str, api_key: str = None, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()

        # Set default request headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

        if api_key:
            self.session.headers['Authorization'] = f'Bearer {api_key}'

    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> APIResponse:
        """Internal method for sending requests"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        kwargs.setdefault('timeout', self.timeout)

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            return APIResponse(
                success=True,
                data=response.json() if response.text else None,
                status_code=response.status_code
            )

        except requests.exceptions.HTTPError as e:
            return APIResponse(
                success=False,
                error=f"HTTP error: {e.response.status_code}",
                status_code=e.response.status_code,
                data=e.response.json() if e.response.text else None
            )

        except requests.exceptions.RequestException as e:
            return APIResponse(
                success=False,
                error=str(e)
            )

    def get(self, endpoint: str, params: Dict = None) -> APIResponse:
        """GET request"""
        return self._request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict = None) -> APIResponse:
        """POST request"""
        return self._request('POST', endpoint, json=data)

    def put(self, endpoint: str, data: Dict = None) -> APIResponse:
        """PUT request"""
        return self._request('PUT', endpoint, json=data)

    def delete(self, endpoint: str) -> APIResponse:
        """DELETE request"""
        return self._request('DELETE', endpoint)

    def close(self):
        """Close session"""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# Usage example
with APIClient('https://api.github.com', timeout=10) as client:
    # Get user information
    result = client.get('/users/octocat')
    if result.success:
        print(f"Username: {result.data['login']}")
        print(f"Followers: {result.data['followers']}")
    else:
        print(f"Error: {result.error}")
```

### Example 2: Basic Web Crawler

```python
import requests
from urllib.parse import urljoin
import time

class SimpleCrawler:
    """Simple web crawler"""

    def __init__(self, delay: float = 1.0):
        self.session = requests.Session()
        self.delay = delay

        # Set request headers to simulate browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        })

    def fetch(self, url: str) -> Optional[str]:
        """Fetch webpage content"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            response.encoding = response.apparent_encoding
            time.sleep(self.delay)  # Polite delay
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"Failed to fetch {url}: {e}")
            return None

    def download_file(self, url: str, filename: str) -> bool:
        """Download file"""
        try:
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            time.sleep(self.delay)
            return True
        except Exception as e:
            print(f"Failed to download {url}: {e}")
            return False

# Usage example
crawler = SimpleCrawler(delay=0.5)
html = crawler.fetch('https://example.com')
if html:
    print(f"Fetched {len(html)} characters")
```

### Example 3: Batch API Requests

```python
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

def fetch_user(user_id: int) -> Dict:
    """Fetch single user information"""
    try:
        response = requests.get(
            f'https://jsonplaceholder.typicode.com/users/{user_id}',
            timeout=10
        )
        response.raise_for_status()
        return {'user_id': user_id, 'data': response.json(), 'error': None}
    except requests.exceptions.RequestException as e:
        return {'user_id': user_id, 'data': None, 'error': str(e)}

def fetch_users_batch(user_ids: List[int], max_workers: int = 5) -> List[Dict]:
    """Batch fetch user information"""
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_id = {
            executor.submit(fetch_user, uid): uid
            for uid in user_ids
        }

        for future in as_completed(future_to_id):
            result = future.result()
            results.append(result)

            if result['error']:
                print(f"User {result['user_id']} fetch failed: {result['error']}")
            else:
                print(f"User {result['user_id']} fetch successful")

    return results

# Usage example
user_ids = list(range(1, 11))
results = fetch_users_batch(user_ids, max_workers=3)

# Process results
successful = [r for r in results if r['data']]
print(f"\nSuccessfully fetched {len(successful)}/{len(user_ids)} users")
```

### Example 4: File Upload Service

```python
import requests
import os
from pathlib import Path

class FileUploader:
    """File upload service"""

    def __init__(self, upload_url: str, api_key: str = None):
        self.upload_url = upload_url
        self.session = requests.Session()

        if api_key:
            self.session.headers['Authorization'] = f'Bearer {api_key}'

    def upload_file(
        self,
        file_path: str,
        field_name: str = 'file',
        extra_data: Dict = None
    ) -> Dict:
        """Upload single file"""
        path = Path(file_path)

        if not path.exists():
            return {'success': False, 'error': 'File does not exist'}

        try:
            with open(path, 'rb') as f:
                files = {field_name: (path.name, f, self._get_mime_type(path))}
                data = extra_data or {}

                response = self.session.post(
                    self.upload_url,
                    files=files,
                    data=data,
                    timeout=60
                )
                response.raise_for_status()

                return {
                    'success': True,
                    'data': response.json(),
                    'filename': path.name
                }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def upload_multiple(
        self,
        file_paths: List[str],
        field_name: str = 'files'
    ) -> Dict:
        """Upload multiple files"""
        files = []

        for file_path in file_paths:
            path = Path(file_path)
            if path.exists():
                files.append(
                    (field_name, (path.name, open(path, 'rb'), self._get_mime_type(path)))
                )

        try:
            response = self.session.post(
                self.upload_url,
                files=files,
                timeout=120
            )
            response.raise_for_status()

            return {
                'success': True,
                'data': response.json(),
                'count': len(files)
            }

        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

        finally:
            # Close all file handles
            for _, (_, f, _) in files:
                f.close()

    @staticmethod
    def _get_mime_type(path: Path) -> str:
        """Get file MIME type"""
        mime_types = {
            '.txt': 'text/plain',
            '.html': 'text/html',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.zip': 'application/zip'
        }
        return mime_types.get(path.suffix.lower(), 'application/octet-stream')
```

## Common Interview Questions

### What is the difference between requests and urllib?

**urllib** is part of Python's standard library with basic functionality but cumbersome usage. **requests** is a third-party library with a more concise API and richer features:

- requests automatically handles encoding
- requests automatically handles Cookies
- requests supports connection pooling
- requests has friendlier error handling

### How do you handle large file downloads?

Use the `stream=True` parameter for streaming downloads:

```python
with requests.get(url, stream=True) as response:
    for chunk in response.iter_content(chunk_size=8192):
        file.write(chunk)
```

### What is the difference between Session and regular requests?

- Session maintains Cookies
- Session uses connection pooling for better performance
- Session can set default parameters
- Session is recommended for multiple requests to the same host

### How do you implement request retries?

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(total=3, backoff_factor=0.1)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
```

### What are the risks of using verify=False?

Disabling SSL verification makes requests vulnerable to man-in-the-middle attacks, where sensitive data could be intercepted. Certificate verification should always be enabled in production environments.

### How do you set up a proxy?

```python
proxies = {
    'http': 'http://proxy:port',
    'https': 'https://proxy:port'
}
requests.get(url, proxies=proxies)
```

### What does the timeout parameter mean?

- Single value: Shared timeout for both connection and read
- Tuple `(connect, read)`: Separate connect timeout and read timeout
- Connect timeout: Maximum wait time to establish connection
- Read timeout: Maximum wait time for server response

## Further Reading

### Official Resources

- [Requests Official Documentation](https://requests.readthedocs.io/)
- [Requests GitHub Repository](https://github.com/psf/requests)
- [urllib3 Documentation](https://urllib3.readthedocs.io/)

### Related Libraries

- **httpx**: Modern HTTP client with async support
- **aiohttp**: Pure async HTTP client
- **urllib3**: Library used internally by Requests
- **requests-toolbelt**: Extension toolkit for Requests
- **requests-cache**: Adds caching support to Requests

### Advanced Learning

- Deep understanding of HTTP protocol
- RESTful API design principles
- OAuth 2.0 authentication flow
- Web scraping best practices
- Async HTTP programming (httpx, aiohttp)

---

The Requests library has become the most popular HTTP client library in Python due to its simple and elegant API. Mastering Requests is a fundamental skill for web development, API calls, and data collection. Through the study and practice in this article, you should be able to proficiently handle various HTTP request scenarios.
