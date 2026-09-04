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
origin: old/src/content/docs/python/requests.zh.md
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

Requests 是 Python 中最受欢迎的 HTTP 客户端库，以其简洁优雅的 API 设计著称。它让发送 HTTP 请求变得简单直观，被广泛应用于 Web 爬虫、API 调用、自动化测试等场景。本文将全面介绍 Requests 库的使用方法和最佳实践。

## 核心概念解释

### 什么是 Requests？

Requests 是一个基于 urllib3 构建的 HTTP 客户端库，它的设计理念是"HTTP for Humans"（人性化的 HTTP）。相比 Python 标准库中的 urllib，Requests 提供了更加简洁、直观的 API，让开发者能够用最少的代码完成 HTTP 请求。

### 为什么选择 Requests？

1. **简洁的 API**：一行代码即可发送请求
2. **自动处理编码**：自动检测响应编码
3. **会话管理**：支持 Cookie 持久化和连接池
4. **丰富的认证方式**：支持 Basic、Digest、OAuth 等
5. **文件上传**：简化多部分表单数据处理
6. **SSL 证书验证**：默认开启安全验证
7. **代理支持**：轻松配置 HTTP/HTTPS 代理

```python
import requests

# 检查版本
print(requests.__version__)
```

## 安装与基础配置

### 安装 Requests

```bash
# 使用 pip 安装
pip install requests

# 安装带安全增强的版本
pip install requests[security]

# 使用 conda 安装
conda install requests
```

### 基本导入

```python
import requests

# 常用的子模块
from requests.auth import HTTPBasicAuth, HTTPDigestAuth
from requests.exceptions import RequestException, Timeout, ConnectionError
```

## GET 请求

GET 请求是最常用的 HTTP 方法，用于从服务器获取数据。

### 基本 GET 请求

```python
import requests

# 简单的 GET 请求
response = requests.get('https://api.github.com')

# 检查响应状态
print(f"状态码: {response.status_code}")
print(f"响应头: {response.headers}")
print(f"响应内容: {response.text[:200]}")
```

### 带查询参数的 GET 请求

```python
# 方式一：直接在 URL 中拼接参数
response = requests.get('https://api.github.com/search/repositories?q=python&sort=stars')

# 方式二：使用 params 参数（推荐）
params = {
    'q': 'python',
    'sort': 'stars',
    'order': 'desc',
    'per_page': 10
}
response = requests.get('https://api.github.com/search/repositories', params=params)

# 查看实际请求的 URL
print(f"请求 URL: {response.url}")

# 处理列表类型的参数
params = {
    'key': ['value1', 'value2']  # 生成 key=value1&key=value2
}
response = requests.get('https://httpbin.org/get', params=params)
```

### 处理 GET 响应

```python
response = requests.get('https://api.github.com/users/octocat')

# 文本响应
text_content = response.text

# JSON 响应（自动解析）
json_data = response.json()
print(f"用户名: {json_data['login']}")
print(f"粉丝数: {json_data['followers']}")

# 二进制响应（用于下载文件）
binary_content = response.content

# 响应编码
print(f"编码: {response.encoding}")

# 手动设置编码
response.encoding = 'utf-8'
```

## POST 请求

POST 请求用于向服务器提交数据，常用于表单提交、API 调用等场景。

### 表单数据提交

```python
# 模拟表单提交
data = {
    'username': 'testuser',
    'password': 'testpass',
    'remember': 'true'
}

response = requests.post('https://httpbin.org/post', data=data)
print(response.json())

# Content-Type 自动设置为 application/x-www-form-urlencoded
```

### JSON 数据提交

```python
import json

# 方式一：使用 json 参数（推荐）
payload = {
    'name': '张三',
    'email': 'zhangsan@example.com',
    'age': 25
}

response = requests.post(
    'https://httpbin.org/post',
    json=payload  # 自动序列化并设置 Content-Type
)

# 方式二：手动序列化
headers = {'Content-Type': 'application/json'}
response = requests.post(
    'https://httpbin.org/post',
    data=json.dumps(payload),
    headers=headers
)

print(response.json())
```

### 发送原始数据

```python
# 发送 XML 数据
xml_data = '''<?xml version="1.0" encoding="UTF-8"?>
<user>
    <name>张三</name>
    <email>zhangsan@example.com</email>
</user>
'''

headers = {'Content-Type': 'application/xml'}
response = requests.post(
    'https://httpbin.org/post',
    data=xml_data,
    headers=headers
)

# 发送纯文本
response = requests.post(
    'https://httpbin.org/post',
    data='Hello, World!',
    headers={'Content-Type': 'text/plain'}
)
```

## 其他 HTTP 方法

Requests 支持所有标准的 HTTP 方法。

```python
# PUT 请求 - 完整更新资源
response = requests.put(
    'https://httpbin.org/put',
    json={'name': '李四', 'age': 30}
)

# PATCH 请求 - 部分更新资源
response = requests.patch(
    'https://httpbin.org/patch',
    json={'age': 31}
)

# DELETE 请求 - 删除资源
response = requests.delete('https://httpbin.org/delete')

# HEAD 请求 - 只获取响应头
response = requests.head('https://httpbin.org/get')
print(response.headers)

# OPTIONS 请求 - 获取支持的方法
response = requests.options('https://httpbin.org/')
print(response.headers.get('Allow'))
```

## 请求头设置

自定义请求头对于 API 调用和模拟浏览器行为非常重要。

### 设置自定义请求头

```python
# 自定义请求头
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

### 常用请求头示例

```python
# 模拟浏览器请求
browser_headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0'
}

# API 请求
api_headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

response = requests.get('https://example.com/api/data', headers=api_headers)
```

## 查询参数详解

### 构建复杂查询参数

```python
# 基本查询参数
params = {
    'search': 'Python 教程',
    'page': 1,
    'limit': 20
}

# 多值参数
params = {
    'tags': ['python', 'web', 'api'],  # tags=python&tags=web&tags=api
    'sort': 'date'
}

# 参数值为 None 时自动忽略
params = {
    'search': 'python',
    'category': None,  # 不会包含在请求中
    'page': 1
}

response = requests.get('https://httpbin.org/get', params=params)
print(response.url)
```

### URL 编码处理

```python
# Requests 自动处理 URL 编码
params = {
    'query': '中文搜索 关键词',
    'filter': 'name=张三&age>20'
}

response = requests.get('https://httpbin.org/get', params=params)
# URL 会自动编码为安全格式
print(response.url)
```

## JSON 数据处理

### 发送 JSON 数据

```python
import requests

# 创建用户
user_data = {
    'name': '张三',
    'email': 'zhangsan@example.com',
    'profile': {
        'age': 25,
        'city': '北京',
        'interests': ['编程', '阅读', '旅行']
    }
}

response = requests.post(
    'https://httpbin.org/post',
    json=user_data
)

print(response.json())
```

### 解析 JSON 响应

```python
response = requests.get('https://api.github.com/users/octocat/repos')

# 自动解析 JSON
repos = response.json()

# 遍历结果
for repo in repos[:5]:
    print(f"仓库: {repo['name']}")
    print(f"  描述: {repo.get('description', '无描述')}")
    print(f"  Star: {repo['stargazers_count']}")
    print()

# 处理 JSON 解析错误
try:
    data = response.json()
except requests.exceptions.JSONDecodeError:
    print("响应不是有效的 JSON 格式")
    print(response.text)
```

## 会话管理（Session）

Session 对象可以在多个请求之间保持某些参数，如 Cookie、认证信息等。

### 基本会话使用

```python
# 创建会话
session = requests.Session()

# 设置会话级别的请求头
session.headers.update({
    'User-Agent': 'MyApp/1.0',
    'Accept': 'application/json'
})

# 所有请求都会使用这些设置
response1 = session.get('https://httpbin.org/get')
response2 = session.post('https://httpbin.org/post', json={'key': 'value'})

# 会话结束后关闭
session.close()
```

### 使用上下文管理器

```python
# 推荐使用 with 语句自动管理会话
with requests.Session() as session:
    # 登录
    login_data = {
        'username': 'user',
        'password': 'pass'
    }
    session.post('https://example.com/login', data=login_data)

    # Cookie 会自动保持
    # 后续请求会带上登录后的 Cookie
    response = session.get('https://example.com/dashboard')
    print(response.text)
```

### Cookie 管理

```python
# 发送自定义 Cookie
cookies = {
    'session_id': 'abc123',
    'user_token': 'xyz789'
}

response = requests.get('https://httpbin.org/cookies', cookies=cookies)
print(response.json())

# 从响应中获取 Cookie
response = requests.get('https://httpbin.org/cookies/set/name/value')
print(response.cookies)
print(response.cookies['name'])

# 使用 Session 自动管理 Cookie
with requests.Session() as session:
    # 第一个请求设置 Cookie
    session.get('https://httpbin.org/cookies/set/sessionid/abc123')

    # 后续请求自动携带 Cookie
    response = session.get('https://httpbin.org/cookies')
    print(response.json())
```

### 会话配置

```python
session = requests.Session()

# 设置基础 URL（需要自定义封装）
session.base_url = 'https://api.example.com'

# 设置默认超时
session.timeout = 30

# 设置重试策略
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

## 认证方式

Requests 支持多种认证方式。

### Basic 认证

```python
from requests.auth import HTTPBasicAuth

# 方式一：使用 HTTPBasicAuth
response = requests.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=HTTPBasicAuth('user', 'pass')
)

# 方式二：使用元组（简写）
response = requests.get(
    'https://httpbin.org/basic-auth/user/pass',
    auth=('user', 'pass')
)

print(response.status_code)
print(response.json())
```

### Digest 认证

```python
from requests.auth import HTTPDigestAuth

response = requests.get(
    'https://httpbin.org/digest-auth/auth/user/pass',
    auth=HTTPDigestAuth('user', 'pass')
)
```

### Bearer Token 认证

```python
# 方式一：在请求头中设置
headers = {
    'Authorization': 'Bearer your-access-token'
}
response = requests.get('https://api.example.com/data', headers=headers)

# 方式二：自定义认证类
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

### API Key 认证

```python
# 在请求头中
headers = {'X-API-Key': 'your-api-key'}
response = requests.get('https://api.example.com/data', headers=headers)

# 在查询参数中
params = {'api_key': 'your-api-key'}
response = requests.get('https://api.example.com/data', params=params)

# 自定义认证类
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

### OAuth 2.0 认证

```python
from requests_oauthlib import OAuth2Session

# OAuth2 客户端凭证模式
client_id = 'your-client-id'
client_secret = 'your-client-secret'
token_url = 'https://oauth.example.com/token'

# 获取访问令牌
from oauthlib.oauth2 import BackendApplicationClient

client = BackendApplicationClient(client_id=client_id)
oauth = OAuth2Session(client=client)

token = oauth.fetch_token(
    token_url=token_url,
    client_id=client_id,
    client_secret=client_secret
)

# 使用令牌发送请求
response = oauth.get('https://api.example.com/protected-resource')
```

## 文件上传

### 上传单个文件

```python
# 上传文件
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('https://httpbin.org/post', files=files)

# 指定文件名和类型
with open('document.pdf', 'rb') as f:
    files = {
        'file': ('custom_name.pdf', f, 'application/pdf')
    }
    response = requests.post('https://httpbin.org/post', files=files)

print(response.json())
```

### 上传多个文件

```python
# 上传多个文件
files = [
    ('files', ('file1.txt', open('file1.txt', 'rb'), 'text/plain')),
    ('files', ('file2.txt', open('file2.txt', 'rb'), 'text/plain')),
    ('files', ('image.png', open('image.png', 'rb'), 'image/png'))
]

response = requests.post('https://httpbin.org/post', files=files)

# 记得关闭文件句柄
for _, (_, f, _) in files:
    f.close()
```

### 文件与表单数据一起提交

```python
# 同时上传文件和表单数据
with open('avatar.jpg', 'rb') as f:
    files = {'avatar': ('avatar.jpg', f, 'image/jpeg')}
    data = {
        'username': '张三',
        'email': 'zhangsan@example.com'
    }
    response = requests.post(
        'https://httpbin.org/post',
        files=files,
        data=data
    )

print(response.json())
```

### 上传内存中的文件

```python
from io import BytesIO

# 从内存中上传
content = b'Hello, World! This is file content.'
files = {
    'file': ('hello.txt', BytesIO(content), 'text/plain')
}

response = requests.post('https://httpbin.org/post', files=files)
```

## 文件下载

### 下载小文件

```python
# 简单下载
response = requests.get('https://example.com/file.pdf')

with open('downloaded_file.pdf', 'wb') as f:
    f.write(response.content)
```

### 下载大文件（流式下载）

```python
# 使用 stream=True 避免一次性加载到内存
url = 'https://example.com/large_file.zip'

with requests.get(url, stream=True) as response:
    response.raise_for_status()

    with open('large_file.zip', 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

print("下载完成")
```

### 带进度条的下载

```python
import requests
from tqdm import tqdm

url = 'https://example.com/large_file.zip'

response = requests.get(url, stream=True)
total_size = int(response.headers.get('content-length', 0))

with open('large_file.zip', 'wb') as f:
    with tqdm(total=total_size, unit='B', unit_scale=True, desc='下载中') as pbar:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
            pbar.update(len(chunk))
```

### 断点续传

```python
import os
import requests

def download_with_resume(url, filename):
    """支持断点续传的下载函数"""
    headers = {}

    # 检查已下载的文件大小
    if os.path.exists(filename):
        downloaded_size = os.path.getsize(filename)
        headers['Range'] = f'bytes={downloaded_size}-'
        mode = 'ab'  # 追加模式
    else:
        downloaded_size = 0
        mode = 'wb'

    response = requests.get(url, headers=headers, stream=True)

    # 检查服务器是否支持断点续传
    if response.status_code == 206:  # Partial Content
        print(f"续传下载，已下载: {downloaded_size} 字节")
    elif response.status_code == 200:
        print("重新开始下载")
        mode = 'wb'
    else:
        response.raise_for_status()

    with open(filename, mode) as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    print("下载完成")

download_with_resume('https://example.com/large_file.zip', 'file.zip')
```

## 超时设置

合理设置超时可以防止请求无限等待。

### 基本超时设置

```python
# 单一超时值（连接和读取共用）
response = requests.get('https://api.example.com', timeout=10)

# 分别设置连接超时和读取超时
response = requests.get(
    'https://api.example.com',
    timeout=(3.05, 27)  # (连接超时, 读取超时)
)

# 永不超时（不推荐）
response = requests.get('https://api.example.com', timeout=None)
```

### 超时异常处理

```python
from requests.exceptions import Timeout, ConnectTimeout, ReadTimeout

try:
    response = requests.get('https://api.example.com', timeout=5)
except ConnectTimeout:
    print("连接超时：无法建立连接")
except ReadTimeout:
    print("读取超时：服务器响应太慢")
except Timeout:
    print("请求超时")
```

### 全局超时配置

```python
# 使用 Session 设置默认超时
class TimeoutSession(requests.Session):
    def __init__(self, timeout=30):
        super().__init__()
        self.timeout = timeout

    def request(self, method, url, **kwargs):
        kwargs.setdefault('timeout', self.timeout)
        return super().request(method, url, **kwargs)

# 使用
session = TimeoutSession(timeout=10)
response = session.get('https://api.example.com')
```

## 错误处理

### 异常类型

```python
from requests.exceptions import (
    RequestException,      # 所有请求异常的基类
    ConnectionError,       # 网络连接错误
    HTTPError,            # HTTP 错误响应
    URLRequired,          # 无效的 URL
    TooManyRedirects,     # 重定向次数过多
    ConnectTimeout,       # 连接超时
    ReadTimeout,          # 读取超时
    Timeout,              # 超时（连接或读取）
    JSONDecodeError       # JSON 解析错误
)
```

### 完整的错误处理示例

```python
import requests
from requests.exceptions import (
    RequestException, ConnectionError, HTTPError,
    Timeout, TooManyRedirects
)

def safe_request(url, method='GET', **kwargs):
    """安全的请求封装"""
    try:
        response = requests.request(method, url, **kwargs)
        response.raise_for_status()  # 检查 HTTP 错误
        return response

    except ConnectionError as e:
        print(f"连接错误: 无法连接到 {url}")
        print(f"详情: {e}")
        return None

    except Timeout as e:
        print(f"请求超时: {url}")
        print(f"详情: {e}")
        return None

    except TooManyRedirects as e:
        print(f"重定向次数过多: {url}")
        print(f"详情: {e}")
        return None

    except HTTPError as e:
        print(f"HTTP 错误: {e.response.status_code}")
        print(f"响应内容: {e.response.text[:200]}")
        return e.response

    except RequestException as e:
        print(f"请求异常: {e}")
        return None

# 使用
response = safe_request('https://api.github.com/users/octocat', timeout=10)
if response:
    print(response.json())
```

### 状态码检查

```python
response = requests.get('https://httpbin.org/status/404')

# 方式一：检查状态码
if response.status_code == 200:
    print("请求成功")
elif response.status_code == 404:
    print("资源不存在")
elif response.status_code >= 500:
    print("服务器错误")

# 方式二：使用 ok 属性
if response.ok:  # 状态码在 200-299 范围内
    print("请求成功")

# 方式三：使用 raise_for_status()
try:
    response.raise_for_status()
except requests.exceptions.HTTPError as e:
    print(f"HTTP 错误: {e}")
```

### 重试机制

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import requests

def create_session_with_retry(
    retries=3,
    backoff_factor=0.3,
    status_forcelist=(500, 502, 503, 504)
):
    """创建带重试机制的会话"""
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

# 使用
session = create_session_with_retry()
response = session.get('https://api.example.com/data')
```

## 代理设置

### 基本代理配置

```python
# HTTP 和 HTTPS 代理
proxies = {
    'http': 'http://proxy.example.com:8080',
    'https': 'https://proxy.example.com:8080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
print(response.json())
```

### 认证代理

```python
# 带认证的代理
proxies = {
    'http': 'http://user:password@proxy.example.com:8080',
    'https': 'http://user:password@proxy.example.com:8080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
```

### SOCKS 代理

```python
# 需要安装 requests[socks]
# pip install requests[socks]

proxies = {
    'http': 'socks5://127.0.0.1:1080',
    'https': 'socks5://127.0.0.1:1080'
}

response = requests.get('https://httpbin.org/ip', proxies=proxies)
```

### 环境变量代理

```python
import os

# 设置环境变量
os.environ['HTTP_PROXY'] = 'http://proxy.example.com:8080'
os.environ['HTTPS_PROXY'] = 'https://proxy.example.com:8080'
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,.example.com'

# Requests 会自动使用环境变量中的代理
response = requests.get('https://httpbin.org/ip')
```

## SSL/TLS 配置

### 证书验证

```python
# 默认启用 SSL 证书验证
response = requests.get('https://example.com')

# 禁用证书验证（不推荐用于生产环境）
response = requests.get('https://example.com', verify=False)

# 使用自定义 CA 证书
response = requests.get('https://example.com', verify='/path/to/ca-bundle.crt')

# 使用证书目录
response = requests.get('https://example.com', verify='/path/to/certdir/')
```

### 客户端证书

```python
# 使用客户端证书进行双向 TLS
response = requests.get(
    'https://secure.example.com',
    cert=('/path/to/client.cert', '/path/to/client.key')
)

# 带密码保护的证书
response = requests.get(
    'https://secure.example.com',
    cert=('/path/to/client.cert', '/path/to/client.key', 'password')
)
```

### 禁用警告

```python
import urllib3
import requests

# 禁用不安全请求警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

response = requests.get('https://example.com', verify=False)
```

## 高级特性

### 请求钩子

```python
def log_request(response, *args, **kwargs):
    """记录请求日志"""
    print(f"请求 URL: {response.request.url}")
    print(f"请求方法: {response.request.method}")
    print(f"响应状态: {response.status_code}")
    print(f"响应时间: {response.elapsed.total_seconds():.2f}s")
    print("-" * 50)

# 单个请求使用钩子
response = requests.get(
    'https://httpbin.org/get',
    hooks={'response': log_request}
)

# 会话级别使用钩子
session = requests.Session()
session.hooks['response'].append(log_request)

response = session.get('https://httpbin.org/get')
```

### 流式请求

```python
# 流式获取响应
response = requests.get('https://httpbin.org/stream/10', stream=True)

# 迭代响应内容
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))

# 迭代响应块
for chunk in response.iter_content(chunk_size=1024):
    print(f"收到 {len(chunk)} 字节")
```

### 请求准备

```python
from requests import Request, Session

# 准备请求（不发送）
session = Session()

request = Request(
    'POST',
    'https://httpbin.org/post',
    data={'key': 'value'},
    headers={'X-Custom': 'header'}
)

# 准备请求
prepared = session.prepare_request(request)

# 检查准备好的请求
print(f"URL: {prepared.url}")
print(f"方法: {prepared.method}")
print(f"请求头: {prepared.headers}")
print(f"请求体: {prepared.body}")

# 发送准备好的请求
response = session.send(prepared)
```

### 自定义传输适配器

```python
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

class CustomAdapter(HTTPAdapter):
    """自定义传输适配器"""

    def __init__(self, *args, **kwargs):
        self.ssl_context = create_urllib3_context()
        super().__init__(*args, **kwargs)

    def init_poolmanager(self, *args, **kwargs):
        kwargs['ssl_context'] = self.ssl_context
        return super().init_poolmanager(*args, **kwargs)

# 使用自定义适配器
session = requests.Session()
session.mount('https://', CustomAdapter())
```

## 实战示例

### 示例1：API 客户端封装

```python
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class APIResponse:
    """API 响应包装类"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: int = 0

class APIClient:
    """通用 API 客户端"""

    def __init__(self, base_url: str, api_key: str = None, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()

        # 设置默认请求头
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
        """发送请求的内部方法"""
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
                error=f"HTTP 错误: {e.response.status_code}",
                status_code=e.response.status_code,
                data=e.response.json() if e.response.text else None
            )

        except requests.exceptions.RequestException as e:
            return APIResponse(
                success=False,
                error=str(e)
            )

    def get(self, endpoint: str, params: Dict = None) -> APIResponse:
        """GET 请求"""
        return self._request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict = None) -> APIResponse:
        """POST 请求"""
        return self._request('POST', endpoint, json=data)

    def put(self, endpoint: str, data: Dict = None) -> APIResponse:
        """PUT 请求"""
        return self._request('PUT', endpoint, json=data)

    def delete(self, endpoint: str) -> APIResponse:
        """DELETE 请求"""
        return self._request('DELETE', endpoint)

    def close(self):
        """关闭会话"""
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# 使用示例
with APIClient('https://api.github.com', timeout=10) as client:
    # 获取用户信息
    result = client.get('/users/octocat')
    if result.success:
        print(f"用户名: {result.data['login']}")
        print(f"粉丝数: {result.data['followers']}")
    else:
        print(f"错误: {result.error}")
```

### 示例2：网页爬虫基础

```python
import requests
from urllib.parse import urljoin
import time

class SimpleCrawler:
    """简单的网页爬虫"""

    def __init__(self, delay: float = 1.0):
        self.session = requests.Session()
        self.delay = delay

        # 设置请求头模拟浏览器
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        })

    def fetch(self, url: str) -> Optional[str]:
        """获取网页内容"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            response.encoding = response.apparent_encoding
            time.sleep(self.delay)  # 礼貌性延迟
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"获取 {url} 失败: {e}")
            return None

    def download_file(self, url: str, filename: str) -> bool:
        """下载文件"""
        try:
            response = self.session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            with open(filename, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            time.sleep(self.delay)
            return True
        except Exception as e:
            print(f"下载 {url} 失败: {e}")
            return False

# 使用示例
crawler = SimpleCrawler(delay=0.5)
html = crawler.fetch('https://example.com')
if html:
    print(f"获取到 {len(html)} 字符")
```

### 示例3：批量 API 请求

```python
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict

def fetch_user(user_id: int) -> Dict:
    """获取单个用户信息"""
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
    """批量获取用户信息"""
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
                print(f"用户 {result['user_id']} 获取失败: {result['error']}")
            else:
                print(f"用户 {result['user_id']} 获取成功")

    return results

# 使用示例
user_ids = list(range(1, 11))
results = fetch_users_batch(user_ids, max_workers=3)

# 处理结果
successful = [r for r in results if r['data']]
print(f"\n成功获取 {len(successful)}/{len(user_ids)} 个用户")
```

### 示例4：文件上传服务

```python
import requests
import os
from pathlib import Path

class FileUploader:
    """文件上传服务"""

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
        """上传单个文件"""
        path = Path(file_path)

        if not path.exists():
            return {'success': False, 'error': '文件不存在'}

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
        """上传多个文件"""
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
            # 关闭所有文件句柄
            for _, (_, f, _) in files:
                f.close()

    @staticmethod
    def _get_mime_type(path: Path) -> str:
        """获取文件 MIME 类型"""
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

## 面试常见问题

### requests 和 urllib 的区别是什么？

**urllib** 是 Python 标准库，功能基础但使用较繁琐。**requests** 是第三方库，API 更简洁，功能更丰富：

- requests 自动处理编码
- requests 自动处理 Cookie
- requests 支持连接池
- requests 的错误处理更友好

### 如何处理大文件下载？

使用 `stream=True` 参数进行流式下载：

```python
with requests.get(url, stream=True) as response:
    for chunk in response.iter_content(chunk_size=8192):
        file.write(chunk)
```

### Session 和普通请求的区别？

- Session 会保持 Cookie
- Session 使用连接池，性能更好
- Session 可以设置默认参数
- 多次请求同一主机时推荐使用 Session

### 如何实现请求重试？

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

retry = Retry(total=3, backoff_factor=0.1)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
```

### verify=False 有什么风险？

禁用 SSL 验证会使请求容易受到中间人攻击，敏感数据可能被窃取。生产环境应始终启用证书验证。

### 如何设置代理？

```python
proxies = {
    'http': 'http://proxy:port',
    'https': 'https://proxy:port'
}
requests.get(url, proxies=proxies)
```

### timeout 参数的含义？

- 单个值：连接和读取共用超时
- 元组 `(connect, read)`：分别设置连接超时和读取超时
- 连接超时：建立连接的最大等待时间
- 读取超时：等待服务器响应的最大时间

## 延伸阅读

### 官方资源

- [Requests 官方文档](https://requests.readthedocs.io/)
- [Requests GitHub 仓库](https://github.com/psf/requests)
- [urllib3 文档](https://urllib3.readthedocs.io/)

### 相关库

- **httpx**：支持异步的现代 HTTP 客户端
- **aiohttp**：纯异步 HTTP 客户端
- **urllib3**：Requests 底层使用的库
- **requests-toolbelt**：Requests 的扩展工具集
- **requests-cache**：为 Requests 添加缓存支持

### 进阶学习

- HTTP 协议深入理解
- RESTful API 设计原则
- OAuth 2.0 认证流程
- 网络爬虫最佳实践
- 异步 HTTP 编程（httpx、aiohttp）

---

Requests 库以其简洁优雅的 API 成为 Python 中最受欢迎的 HTTP 客户端库。掌握 Requests 的使用是进行 Web 开发、API 调用、数据采集的基础技能。通过本文的学习和实践，你应该能够熟练处理各种 HTTP 请求场景。
