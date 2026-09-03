---
title: Python httpx HTTP 客户端
description: 学习 httpx 进行同步和异步 HTTP 请求，替代 requests 的现代选择
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - httpx
  - HTTP
  - 异步
status: imported
origin: old/src/content/docs/python/httpx.zh.md
divergence: 0.212
issues: []
legacy:
  category: Python
  subcategory: 网络
  order: 41
  lastUpdated: 2026-01-07
---

httpx 是 Python 的下一代 HTTP 客户端库，它提供同步和异步两种 API，同时支持 HTTP/1.1 和 HTTP/2 协议。作为 requests 库的现代替代品，httpx 继承了 requests 优雅的 API 设计，同时增加了异步支持、HTTP/2、严格的超时控制等现代特性。

## 安装

使用 pip 安装基本版本：

```bash
pip install httpx
```

安装 HTTP/2 支持：

```bash
pip install httpx[http2]
```

安装所有可选依赖：

```bash
pip install httpx[http2,brotli,zstd,socks,cli]
```

可选依赖说明：
- `http2`: HTTP/2 协议支持
- `brotli`: Brotli 压缩解码支持
- `zstd`: Zstandard 压缩解码支持
- `socks`: SOCKS 代理支持
- `cli`: 命令行客户端

## 快速开始

### 基本请求

```python
import httpx

# GET 请求
response = httpx.get('https://httpbin.org/get')
print(response.status_code)  # 200
print(response.text)         # 响应内容

# POST 请求
response = httpx.post('https://httpbin.org/post', data={'key': 'value'})

# 其他 HTTP 方法
response = httpx.put('https://httpbin.org/put', data={'key': 'value'})
response = httpx.delete('https://httpbin.org/delete')
response = httpx.head('https://httpbin.org/get')
response = httpx.options('https://httpbin.org/get')
response = httpx.patch('https://httpbin.org/patch', data={'key': 'value'})
```

### URL 参数

```python
import httpx

# 使用字典传递查询参数
params = {'key1': 'value1', 'key2': 'value2'}
response = httpx.get('https://httpbin.org/get', params=params)
print(response.url)  # https://httpbin.org/get?key1=value1&key2=value2

# 多值参数
params = {'key': ['value1', 'value2']}
response = httpx.get('https://httpbin.org/get', params=params)
print(response.url)  # https://httpbin.org/get?key=value1&key=value2
```

### 响应处理

```python
import httpx

response = httpx.get('https://api.github.com/repos/encode/httpx')

# 状态码
print(response.status_code)  # 200
print(response.status_code == httpx.codes.OK)  # True

# 响应头
print(response.headers['content-type'])  # application/json; charset=utf-8

# 文本内容
print(response.text)

# 二进制内容
print(response.content)

# JSON 响应
data = response.json()
print(data['full_name'])  # encode/httpx

# 编码
print(response.encoding)  # utf-8

# HTTP 版本
print(response.http_version)  # HTTP/1.1 或 HTTP/2
```

## 同步客户端 (Client)

使用 `Client` 实例而不是顶级 API 函数可以获得更好的性能和更多功能。

### 为什么使用 Client

1. **连接池复用**: Client 使用 HTTP 连接池，相同主机的请求会复用 TCP 连接
2. **减少延迟**: 无需每次请求都进行握手
3. **Cookie 持久化**: 自动在请求之间保持 Cookie
4. **共享配置**: 可以为所有请求设置统一的配置
5. **HTTP/2 支持**: 只有 Client 才能启用 HTTP/2

### 基本用法

```python
import httpx

# 推荐使用上下文管理器
with httpx.Client() as client:
    response = client.get('https://httpbin.org/get')
    print(response.status_code)

# 或手动管理
client = httpx.Client()
try:
    response = client.get('https://httpbin.org/get')
finally:
    client.close()
```

### 共享配置

```python
import httpx

# 设置默认请求头
headers = {'User-Agent': 'MyApp/1.0'}

with httpx.Client(headers=headers) as client:
    # 所有请求都会带上这个 User-Agent
    response = client.get('https://httpbin.org/headers')
    print(response.json())

# 设置基础 URL
with httpx.Client(base_url='https://api.github.com') as client:
    # 自动拼接 base_url
    response = client.get('/repos/encode/httpx')
    print(response.url)  # https://api.github.com/repos/encode/httpx

# 设置默认超时
with httpx.Client(timeout=30.0) as client:
    response = client.get('https://httpbin.org/delay/5')
```

### 配置合并

```python
import httpx

# 客户端级别配置
client_headers = {'X-Auth': 'client-token'}
client_params = {'client_id': 'abc123'}

with httpx.Client(headers=client_headers, params=client_params) as client:
    # 请求级别配置
    request_headers = {'X-Request-ID': 'req-001'}
    request_params = {'page': '1'}

    response = client.get(
        'https://httpbin.org/get',
        headers=request_headers,
        params=request_params
    )

    # headers、params、cookies 会合并
    # 其他参数请求级别优先
```

## 异步客户端 (AsyncClient)

httpx 的异步支持是其最大亮点之一，特别适合高并发场景。

### 基本用法

```python
import httpx
import asyncio

async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://httpbin.org/get')
        return response.json()

# 运行异步函数
data = asyncio.run(fetch_data())
print(data)
```

### 并发请求

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
        # 并发发送所有请求
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks)

        return [r.json() for r in responses]

results = asyncio.run(fetch_all())
for result in results:
    print(result['args'])
```

### 异步流式响应

```python
import httpx
import asyncio

async def stream_download():
    async with httpx.AsyncClient() as client:
        async with client.stream('GET', 'https://httpbin.org/stream/10') as response:
            async for chunk in response.aiter_bytes():
                print(f"收到 {len(chunk)} 字节")

            # 或者按行读取
            # async for line in response.aiter_lines():
            #     print(line)

asyncio.run(stream_download())
```

### 异步上下文中的流式请求

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

### 支持的异步框架

httpx 自动检测并支持以下异步框架：

```python
# asyncio (Python 内置)
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

anyio.run(main, backend='trio')  # 或 'asyncio'
```

## 发送数据

### 表单数据

```python
import httpx

# 表单编码数据
data = {'username': 'john', 'password': 'secret'}
response = httpx.post('https://httpbin.org/post', data=data)
print(response.json()['form'])

# 多值表单字段
data = {'interests': ['python', 'javascript', 'rust']}
response = httpx.post('https://httpbin.org/post', data=data)
```

### JSON 数据

```python
import httpx

# 自动序列化为 JSON
data = {
    'name': 'httpx',
    'features': ['async', 'http2', 'streaming'],
    'version': 0.27
}
response = httpx.post('https://httpbin.org/post', json=data)
print(response.json()['json'])
```

### 二进制数据

```python
import httpx

# 发送二进制内容
content = b'Binary data here'
response = httpx.post(
    'https://httpbin.org/post',
    content=content,
    headers={'Content-Type': 'application/octet-stream'}
)
```

### 文件上传

```python
import httpx

# 单文件上传
with open('report.pdf', 'rb') as f:
    files = {'file': f}
    response = httpx.post('https://httpbin.org/post', files=files)

# 指定文件名和 MIME 类型
with open('report.pdf', 'rb') as f:
    files = {'file': ('custom_name.pdf', f, 'application/pdf')}
    response = httpx.post('https://httpbin.org/post', files=files)

# 多文件上传
with open('file1.txt', 'rb') as f1, open('file2.txt', 'rb') as f2:
    files = [
        ('files', ('file1.txt', f1, 'text/plain')),
        ('files', ('file2.txt', f2, 'text/plain')),
    ]
    response = httpx.post('https://httpbin.org/post', files=files)

# 文件和表单数据混合
with open('avatar.png', 'rb') as f:
    data = {'username': 'john', 'email': 'john@example.com'}
    files = {'avatar': f}
    response = httpx.post('https://httpbin.org/post', data=data, files=files)
```

## 认证

### 基本认证

```python
import httpx

# 元组形式
response = httpx.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=('user', 'pass')
)
print(response.status_code)  # 200

# 在 Client 中设置
with httpx.Client(auth=('user', 'pass')) as client:
    response = client.get('https://httpbin.org/basic-auth/user/pass')
```

### 摘要认证

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

# 手动设置 Authorization 头
headers = {'Authorization': 'Bearer your-token-here'}
response = httpx.get('https://api.example.com/data', headers=headers)

# 自定义认证类
class BearerAuth(httpx.Auth):
    def __init__(self, token: str):
        self.token = token

    def auth_flow(self, request):
        request.headers['Authorization'] = f'Bearer {self.token}'
        yield request

auth = BearerAuth('your-token-here')
response = httpx.get('https://api.example.com/data', auth=auth)
```

### 自定义认证流程

```python
import httpx

class CustomAuth(httpx.Auth):
    """支持 token 刷新的认证类"""

    def __init__(self, access_token: str, refresh_token: str):
        self.access_token = access_token
        self.refresh_token = refresh_token

    def auth_flow(self, request):
        # 添加认证头
        request.headers['Authorization'] = f'Bearer {self.access_token}'
        response = yield request

        # 如果 token 过期，刷新后重试
        if response.status_code == 401:
            self.refresh_access_token()
            request.headers['Authorization'] = f'Bearer {self.access_token}'
            yield request

    def refresh_access_token(self):
        # 实现 token 刷新逻辑
        response = httpx.post(
            'https://api.example.com/refresh',
            data={'refresh_token': self.refresh_token}
        )
        self.access_token = response.json()['access_token']
```

## 超时控制

httpx 默认对所有网络操作设置 5 秒超时，避免请求无限期挂起。

### 简单超时

```python
import httpx

# 设置总超时时间
response = httpx.get('https://httpbin.org/delay/2', timeout=10.0)

# 禁用超时
response = httpx.get('https://httpbin.org/delay/10', timeout=None)

# Client 级别设置
with httpx.Client(timeout=30.0) as client:
    response = client.get('https://httpbin.org/delay/5')
```

### 精细超时控制

```python
import httpx

# 创建超时配置对象
timeout = httpx.Timeout(
    connect=5.0,    # 连接超时
    read=10.0,      # 读取超时
    write=5.0,      # 写入超时
    pool=10.0       # 连接池等待超时
)

response = httpx.get('https://httpbin.org/get', timeout=timeout)

# 或者使用默认值加特定覆盖
timeout = httpx.Timeout(10.0, connect=30.0)  # 总体 10 秒，连接 30 秒

with httpx.Client(timeout=timeout) as client:
    response = client.get('https://slow-server.example.com/')
```

### 超时异常处理

```python
import httpx

try:
    response = httpx.get('https://httpbin.org/delay/10', timeout=1.0)
except httpx.TimeoutException as e:
    print(f"请求超时: {e}")
except httpx.ConnectTimeout:
    print("连接超时")
except httpx.ReadTimeout:
    print("读取超时")
except httpx.WriteTimeout:
    print("写入超时")
except httpx.PoolTimeout:
    print("连接池等待超时")
```

## 流式传输

### 流式下载

```python
import httpx

# 使用 stream() 上下文管理器
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    # 按字节流读取
    for chunk in response.iter_bytes():
        print(f"收到 {len(chunk)} 字节")

# 按文本流读取
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    for text in response.iter_text():
        print(text)

# 按行读取
with httpx.stream('GET', 'https://httpbin.org/stream/20') as response:
    for line in response.iter_lines():
        print(line)

# 读取原始字节 (不解压)
with httpx.stream('GET', 'https://example.com/file.gz') as response:
    for chunk in response.iter_raw():
        print(len(chunk))
```

### 大文件下载与进度显示

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

### 条件读取

```python
import httpx

MAX_SIZE = 10 * 1024 * 1024  # 10 MB

with httpx.stream('GET', 'https://example.com/file') as response:
    content_length = int(response.headers.get('Content-Length', 0))

    if content_length < MAX_SIZE:
        # 文件不大，完全读取
        response.read()
        print(response.text)
    else:
        print(f"文件太大 ({content_length} 字节)，跳过下载")
```

## HTTP/2 支持

HTTP/2 提供多路复用、头部压缩等特性，可以显著提升高并发场景的性能。

### 启用 HTTP/2

```python
import httpx

# 首先安装 HTTP/2 依赖
# pip install httpx[http2]

# 同步客户端
with httpx.Client(http2=True) as client:
    response = client.get('https://httpbin.org/get')
    print(response.http_version)  # HTTP/2

# 异步客户端
import asyncio

async def main():
    async with httpx.AsyncClient(http2=True) as client:
        response = await client.get('https://httpbin.org/get')
        print(response.http_version)

asyncio.run(main())
```

### 检查 HTTP 版本

```python
import httpx

with httpx.Client(http2=True) as client:
    response = client.get('https://www.google.com')

    # 可能是 HTTP/1.0, HTTP/1.1 或 HTTP/2
    # 取决于服务器是否支持 HTTP/2
    print(f"使用协议: {response.http_version}")
```

### HTTP/2 的优势

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

## Cookie 处理

### 读取 Cookie

```python
import httpx

response = httpx.get('https://httpbin.org/cookies/set?name=value')
print(response.cookies['name'])  # value

# 遍历所有 Cookie
for name, value in response.cookies.items():
    print(f"{name}: {value}")
```

### 发送 Cookie

```python
import httpx

# 使用字典
cookies = {'session_id': 'abc123', 'user': 'john'}
response = httpx.get('https://httpbin.org/cookies', cookies=cookies)
print(response.json())

# 使用 Cookies 对象 (支持域名过滤)
cookies = httpx.Cookies()
cookies.set('cookie1', 'value1', domain='httpbin.org')
cookies.set('cookie2', 'value2', domain='example.com')

response = httpx.get('https://httpbin.org/cookies', cookies=cookies)
# 只会发送 cookie1，因为 cookie2 是 example.com 域名的
```

### Client 中的 Cookie 持久化

```python
import httpx

with httpx.Client() as client:
    # 设置 Cookie
    client.get('https://httpbin.org/cookies/set?session=xyz789')

    # 后续请求自动携带 Cookie
    response = client.get('https://httpbin.org/cookies')
    print(response.json())  # {'cookies': {'session': 'xyz789'}}
```

## 重定向处理

### 默认行为

```python
import httpx

# 默认不自动跟随重定向
response = httpx.get('http://github.com/')
print(response.status_code)  # 301
print(response.next_request)  # 下一个请求对象
print(response.history)  # 空列表

# 启用自动重定向
response = httpx.get('http://github.com/', follow_redirects=True)
print(response.status_code)  # 200
print(response.url)  # https://github.com/
print(response.history)  # [<Response [301]>]
```

### Client 级别设置

```python
import httpx

with httpx.Client(follow_redirects=True) as client:
    # 所有请求都会自动跟随重定向
    response = client.get('http://github.com/')
    print(response.url)  # https://github.com/

# 限制最大重定向次数
with httpx.Client(follow_redirects=True, max_redirects=5) as client:
    response = client.get('http://example.com/')
```

## 代理支持

### HTTP 代理

```python
import httpx

# 单个代理
proxies = 'http://proxy.example.com:8080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
    print(response.json())

# 带认证的代理
proxies = 'http://user:pass@proxy.example.com:8080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
```

### SOCKS 代理

```python
import httpx

# 需要安装: pip install httpx[socks]

proxies = 'socks5://localhost:1080'
with httpx.Client(proxy=proxies) as client:
    response = client.get('https://httpbin.org/ip')
    print(response.json())
```

## 异常处理

### 异常层次结构

```python
"""
httpx 异常层次：
HTTPError
├── RequestError (请求相关错误)
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
└── HTTPStatusError (HTTP 状态码错误)
"""
```

### 完整异常处理

```python
import httpx

def safe_request(url: str) -> dict | None:
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
        return response.json()

    except httpx.TimeoutException as e:
        print(f"请求超时: {e}")
    except httpx.NetworkError as e:
        print(f"网络错误: {e}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP 错误 {e.response.status_code}: {e.response.text}")
    except httpx.RequestError as e:
        print(f"请求错误: {e}")

    return None

# 使用
data = safe_request('https://api.github.com/repos/encode/httpx')
if data:
    print(data['full_name'])
```

### raise_for_status 使用

```python
import httpx

# 链式调用
try:
    data = httpx.get('https://api.example.com/data').raise_for_status().json()
except httpx.HTTPStatusError as e:
    print(f"请求失败: {e.response.status_code}")
```

## httpx 与 requests 对比

### API 兼容性

```python
# requests 代码
import requests

session = requests.Session()
session.headers.update({'User-Agent': 'MyApp'})
response = session.get('https://httpbin.org/get')

# httpx 等效代码
import httpx

with httpx.Client(headers={'User-Agent': 'MyApp'}) as client:
    response = client.get('https://httpbin.org/get')
```

### 主要差异

| 特性 | requests | httpx |
|------|----------|-------|
| 同步 API | 是 | 是 |
| 异步 API | 否 | 是 |
| HTTP/2 | 否 | 是 |
| 默认超时 | 无 | 5 秒 |
| 重定向 | 自动跟随 | 默认不跟随 |
| 类型提示 | 部分 | 完整 |
| 连接池 | Session | Client |
| WSGI/ASGI 测试 | 否 | 是 |

### 迁移示例

```python
# requests
import requests

session = requests.Session()
session.auth = ('user', 'pass')
response = session.get('https://api.example.com/data', timeout=30)

# httpx 等效
import httpx

with httpx.Client(auth=('user', 'pass'), timeout=30.0) as client:
    response = client.get('https://api.example.com/data')

# requests 异步 (需要 aiohttp)
import aiohttp
import asyncio

async def fetch():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://api.example.com/data') as response:
            return await response.json()

# httpx 异步
import httpx
import asyncio

async def fetch():
    async with httpx.AsyncClient() as client:
        response = await client.get('https://api.example.com/data')
        return response.json()
```

## 高级用法

### 自定义传输层

```python
import httpx

# 配置连接限制
limits = httpx.Limits(
    max_connections=100,
    max_keepalive_connections=20,
    keepalive_expiry=30.0
)

with httpx.Client(limits=limits) as client:
    response = client.get('https://httpbin.org/get')

# 配置重试
transport = httpx.HTTPTransport(retries=3)
with httpx.Client(transport=transport) as client:
    response = client.get('https://httpbin.org/get')
```

### 请求实例

```python
import httpx

# 创建请求对象
request = httpx.Request('GET', 'https://httpbin.org/get')

with httpx.Client() as client:
    # 修改请求
    request.headers['X-Custom'] = 'value'

    # 发送请求
    response = client.send(request)
    print(response.json())

# 使用 build_request 创建带客户端配置的请求
with httpx.Client(headers={'User-Agent': 'MyApp'}) as client:
    request = client.build_request('GET', 'https://httpbin.org/get')

    # 请求已包含客户端的默认头
    print(request.headers['User-Agent'])  # MyApp

    # 可以进一步修改
    del request.headers['User-Agent']
    request.headers['User-Agent'] = 'CustomAgent'

    response = client.send(request)
```

### WSGI/ASGI 应用测试

```python
import httpx

# 测试 Flask/Django 等 WSGI 应用
from myapp import app  # Flask/Django app

transport = httpx.WSGITransport(app=app)
with httpx.Client(transport=transport, base_url='http://testserver') as client:
    response = client.get('/api/users')
    assert response.status_code == 200

# 测试 FastAPI/Starlette 等 ASGI 应用
from myapp import app  # FastAPI app
import asyncio

async def test_asgi():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://testserver') as client:
        response = await client.get('/api/users')
        assert response.status_code == 200

asyncio.run(test_asgi())
```

### 事件钩子

```python
import httpx

def log_request(request):
    print(f"请求: {request.method} {request.url}")

def log_response(response):
    print(f"响应: {response.status_code}")

with httpx.Client(
    event_hooks={
        'request': [log_request],
        'response': [log_response]
    }
) as client:
    response = client.get('https://httpbin.org/get')
    # 输出:
    # 请求: GET https://httpbin.org/get
    # 响应: 200
```

## 实际应用示例

### RESTful API 客户端

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

# 使用
with APIClient('https://api.example.com', 'your-api-key') as api:
    users = api.get('/users')
    new_user = api.post('/users', {'name': 'John', 'email': 'john@example.com'})
    api.delete(f'/users/{new_user["id"]}')
```

### 异步爬虫

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
                print(f"错误 {url}: {e}")
                return None

    async def crawl(self, start_url: str, max_pages: int = 100):
        to_visit = [start_url]
        results = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            while to_visit and len(self.visited) < max_pages:
                # 批量获取
                batch = []
                while to_visit and len(batch) < 10:
                    url = to_visit.pop(0)
                    if url not in self.visited:
                        self.visited.add(url)
                        batch.append(url)

                if not batch:
                    break

                # 并发请求
                tasks = [self.fetch(client, url) for url in batch]
                pages = await asyncio.gather(*tasks)

                for url, html in zip(batch, pages):
                    if html:
                        results.append({'url': url, 'html': html})
                        # 提取链接 (简化示例)
                        soup = BeautifulSoup(html, 'html.parser')
                        for link in soup.find_all('a', href=True):
                            full_url = urljoin(url, link['href'])
                            if full_url.startswith('http') and full_url not in self.visited:
                                to_visit.append(full_url)

        return results

# 使用
async def main():
    crawler = AsyncCrawler(max_concurrent=5)
    results = await crawler.crawl('https://example.com', max_pages=10)
    print(f"抓取了 {len(results)} 个页面")

asyncio.run(main())
```

### 带重试的健壮客户端

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

# 使用
async def main():
    async with RobustClient('https://api.example.com') as client:
        response = await client.get('/data')
        print(response.json())

asyncio.run(main())
```

## 最佳实践

### 始终使用 Client

```python
import httpx

# 不推荐 - 每次请求都创建新连接
for i in range(100):
    response = httpx.get(f'https://api.example.com/item/{i}')

# 推荐 - 复用连接
with httpx.Client() as client:
    for i in range(100):
        response = client.get(f'https://api.example.com/item/{i}')
```

### 正确处理异常

```python
import httpx

with httpx.Client() as client:
    try:
        response = client.get('https://api.example.com/data')
        response.raise_for_status()
    except httpx.TimeoutException:
        # 超时重试或降级
        pass
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            # 速率限制，等待后重试
            pass
        elif e.response.status_code >= 500:
            # 服务器错误，可以重试
            pass
        else:
            # 客户端错误，检查请求
            raise
```

### 使用类型提示

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

### 配置合理的超时

```python
import httpx

# 根据 API 特点配置超时
timeout = httpx.Timeout(
    connect=5.0,     # 连接应该很快
    read=30.0,       # 读取可能需要更长时间
    write=10.0,      # 写入通常较快
    pool=10.0        # 等待连接池
)

with httpx.Client(timeout=timeout) as client:
    response = client.get('https://api.example.com/large-data')
```

### 异步场景使用 AsyncClient

```python
import httpx
import asyncio

# I/O 密集型任务使用异步
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

## 总结

httpx 是 Python HTTP 客户端的现代选择，它的主要优势包括：

1. **同步异步统一**: 相同的 API 同时支持同步和异步模式
2. **HTTP/2 支持**: 原生支持 HTTP/2 协议，提升并发性能
3. **严格超时**: 默认设置合理的超时，避免请求挂起
4. **类型完整**: 完整的类型注解，IDE 支持更好
5. **测试友好**: 内置 WSGI/ASGI 传输，方便测试 Web 应用
6. **requests 兼容**: API 设计与 requests 兼容，迁移成本低

对于新项目，特别是需要异步支持或 HTTP/2 的场景，httpx 是比 requests 更好的选择。
