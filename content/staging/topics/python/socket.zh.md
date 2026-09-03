---
title: Python Socket 网络编程
description: 深入掌握 Python socket 编程：TCP/UDP 通信、服务器与客户端、socket 选项、非阻塞模式、IO 多路复用与 socketserver
track: python
section: stdlib
difficulty: advanced
tags:
  - Python
  - socket
  - 网络编程
  - TCP
  - UDP
  - 并发
status: imported
origin: old/src/content/docs/python/socket.zh.md
divergence: 0.2
issues: []
legacy:
  category: Python
  subcategory: 网络编程
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

Socket（套接字）是网络编程的基础，是应用层与传输层之间的抽象层。它提供了进程间网络通信的端点，使得不同主机上的程序可以通过网络进行数据交换。

### 什么是 Socket？

Socket 是操作系统提供的网络通信接口，它封装了底层网络协议（如 TCP/IP）的复杂细节，为开发者提供了简洁的 API。可以将 Socket 理解为：

- **通信端点**：网络上两个程序进行通信的端点
- **文件描述符**：在 Unix/Linux 中，socket 被视为特殊的文件
- **API 接口**：封装了网络协议栈的编程接口

### 历史背景

Socket API 最早由加州大学伯克利分校在 1983 年的 BSD 4.2 中引入，因此也被称为"Berkeley Sockets"。它已成为网络编程的事实标准，几乎所有操作系统和编程语言都支持这一接口。

### 解决什么问题？

- **进程间通信**：使不同主机上的进程能够交换数据
- **协议抽象**：隐藏底层网络协议的实现细节
- **跨平台兼容**：提供统一的网络编程接口
- **灵活性**：支持多种传输协议（TCP、UDP 等）

## 核心原理

### 网络分层模型

```
应用层 (HTTP, FTP, SMTP...)
      ↓
传输层 (TCP, UDP)  ← Socket 在这里工作
      ↓
网络层 (IP)
      ↓
数据链路层 (Ethernet, WiFi)
      ↓
物理层
```

### Socket 通信模型

```
    客户端                                服务器
┌──────────────┐                    ┌──────────────┐
│   socket()   │                    │   socket()   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │                            ┌──────┴───────┐
       │                            │    bind()    │
       │                            └──────┬───────┘
       │                                   │
       │                            ┌──────┴───────┐
       │                            │   listen()   │
       │                            └──────┬───────┘
       │                                   │
┌──────┴───────┐                    ┌──────┴───────┐
│  connect()   │ ─────连接请求─────→ │   accept()   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │ ←──────── 连接建立 ────────→      │
       │                                   │
┌──────┴───────┐                    ┌──────┴───────┐
│  send/recv   │ ←─────数据交换────→ │  send/recv   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
┌──────┴───────┐                    ┌──────┴───────┐
│   close()    │                    │   close()    │
└──────────────┘                    └──────────────┘
```

### TCP 三次握手

```python
# TCP 连接建立过程
# 客户端发送 SYN
# 服务器响应 SYN+ACK
# 客户端发送 ACK

# 这个过程由操作系统自动完成，对 socket 编程透明
```

### TCP vs UDP

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接 | 面向连接 | 无连接 |
| 可靠性 | 可靠传输 | 不可靠 |
| 顺序 | 保证顺序 | 不保证顺序 |
| 速度 | 较慢 | 较快 |
| 开销 | 较大 | 较小 |
| 适用场景 | 文件传输、HTTP | 视频流、DNS |

## 核心要点

### Socket 类型

```python
import socket

# 流式套接字 (TCP)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# 数据报套接字 (UDP)
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# 原始套接字 (需要 root 权限)
raw_socket = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
```

### 地址族

```python
import socket

# IPv4 地址族
socket.AF_INET      # 例如: ('192.168.1.1', 8080)

# IPv6 地址族
socket.AF_INET6     # 例如: ('::1', 8080, 0, 0)

# Unix 域套接字 (本地进程间通信)
socket.AF_UNIX      # 例如: '/tmp/mysocket.sock'
```

### 核心方法概览

| 方法 | 描述 | TCP | UDP |
|------|------|-----|-----|
| `socket()` | 创建套接字 | Yes | Yes |
| `bind()` | 绑定地址 | Yes | Yes |
| `listen()` | 开始监听 | Yes | No |
| `accept()` | 接受连接 | Yes | No |
| `connect()` | 连接服务器 | Yes | 可选 |
| `send()` | 发送数据 | Yes | Yes* |
| `recv()` | 接收数据 | Yes | Yes* |
| `sendto()` | 发送数据到指定地址 | No | Yes |
| `recvfrom()` | 接收数据并获取发送者地址 | No | Yes |
| `close()` | 关闭套接字 | Yes | Yes |

## 代码示例

### TCP 服务器 - 基础版本

```python
import socket

def create_tcp_server(host='localhost', port=8888):
    """创建基础 TCP 服务器"""
    # 创建 TCP 套接字
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 允许地址重用（避免 "Address already in use" 错误）
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # 绑定地址和端口
    server_socket.bind((host, port))

    # 开始监听，参数是等待连接队列的最大长度
    server_socket.listen(5)
    print(f"服务器启动，监听 {host}:{port}")

    try:
        while True:
            # 接受客户端连接（阻塞）
            client_socket, client_address = server_socket.accept()
            print(f"客户端连接: {client_address}")

            try:
                # 接收数据
                data = client_socket.recv(1024)
                if data:
                    print(f"收到数据: {data.decode('utf-8')}")
                    # 发送响应
                    response = f"服务器收到: {data.decode('utf-8')}"
                    client_socket.send(response.encode('utf-8'))
            finally:
                # 关闭客户端连接
                client_socket.close()
    finally:
        server_socket.close()

if __name__ == '__main__':
    create_tcp_server()
```

### TCP 客户端 - 基础版本

```python
import socket

def create_tcp_client(host='localhost', port=8888):
    """创建基础 TCP 客户端"""
    # 创建 TCP 套接字
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        # 连接服务器
        client_socket.connect((host, port))
        print(f"已连接到 {host}:{port}")

        # 发送数据
        message = "Hello, Server!"
        client_socket.send(message.encode('utf-8'))
        print(f"发送: {message}")

        # 接收响应
        response = client_socket.recv(1024)
        print(f"收到响应: {response.decode('utf-8')}")
    finally:
        client_socket.close()

if __name__ == '__main__':
    create_tcp_client()
```

### TCP 服务器 - 多线程版本

```python
import socket
import threading

class ThreadedTCPServer:
    """多线程 TCP 服务器"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.server_socket = None
        self.running = False

    def start(self):
        """启动服务器"""
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        self.running = True

        print(f"多线程服务器启动，监听 {self.host}:{self.port}")

        try:
            while self.running:
                try:
                    client_socket, client_address = self.server_socket.accept()
                    # 为每个客户端创建新线程
                    client_thread = threading.Thread(
                        target=self.handle_client,
                        args=(client_socket, client_address)
                    )
                    client_thread.daemon = True
                    client_thread.start()
                except socket.error:
                    break
        finally:
            self.server_socket.close()

    def handle_client(self, client_socket, client_address):
        """处理客户端连接"""
        print(f"[{threading.current_thread().name}] 客户端连接: {client_address}")

        try:
            while True:
                data = client_socket.recv(1024)
                if not data:
                    break

                message = data.decode('utf-8')
                print(f"[{client_address}] 收到: {message}")

                # 回显服务
                response = f"Echo: {message}"
                client_socket.send(response.encode('utf-8'))
        except Exception as e:
            print(f"[{client_address}] 错误: {e}")
        finally:
            print(f"[{client_address}] 断开连接")
            client_socket.close()

    def stop(self):
        """停止服务器"""
        self.running = False
        if self.server_socket:
            self.server_socket.close()

if __name__ == '__main__':
    server = ThreadedTCPServer()
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()
        print("\n服务器已停止")
```

### UDP 服务器与客户端

```python
import socket

# UDP 服务器
def udp_server(host='localhost', port=9999):
    """UDP 服务器"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind((host, port))
    print(f"UDP 服务器启动，监听 {host}:{port}")

    try:
        while True:
            # 接收数据和客户端地址
            data, client_address = server_socket.recvfrom(1024)
            print(f"从 {client_address} 收到: {data.decode('utf-8')}")

            # 发送响应
            response = f"UDP Echo: {data.decode('utf-8')}"
            server_socket.sendto(response.encode('utf-8'), client_address)
    finally:
        server_socket.close()

# UDP 客户端
def udp_client(host='localhost', port=9999):
    """UDP 客户端"""
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    try:
        message = "Hello, UDP Server!"
        # 发送数据
        client_socket.sendto(message.encode('utf-8'), (host, port))
        print(f"发送: {message}")

        # 设置超时
        client_socket.settimeout(5.0)

        # 接收响应
        response, server_address = client_socket.recvfrom(1024)
        print(f"收到响应: {response.decode('utf-8')}")
    except socket.timeout:
        print("等待响应超时")
    finally:
        client_socket.close()
```

### Socket 选项配置

```python
import socket

def configure_socket_options():
    """演示常用 Socket 选项"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 1. 地址重用 - 避免 TIME_WAIT 状态导致的绑定失败
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # 2. 端口重用 (Linux 3.9+)
    # sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

    # 3. 发送缓冲区大小
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)

    # 4. 接收缓冲区大小
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)

    # 5. 保活机制 (TCP Keep-Alive)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

    # Linux 特有的 TCP Keep-Alive 参数
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)   # 空闲多久后开始探测
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10) # 探测间隔
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 5)    # 探测次数

    # 6. 禁用 Nagle 算法 (减少延迟)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

    # 7. 设置超时
    sock.settimeout(30.0)  # 30 秒超时

    # 读取选项值
    print(f"SO_REUSEADDR: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR)}")
    print(f"SO_SNDBUF: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)}")
    print(f"SO_RCVBUF: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)}")
    print(f"TCP_NODELAY: {sock.getsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY)}")

    return sock
```

### 非阻塞模式

```python
import socket
import errno

def non_blocking_server():
    """非阻塞服务器示例"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen(5)

    # 设置为非阻塞模式
    server_socket.setblocking(False)

    clients = []
    print("非阻塞服务器启动")

    try:
        while True:
            # 尝试接受新连接
            try:
                client_socket, address = server_socket.accept()
                client_socket.setblocking(False)
                clients.append(client_socket)
                print(f"新连接: {address}")
            except BlockingIOError:
                pass  # 没有新连接

            # 处理现有客户端
            for client in clients[:]:  # 使用切片复制避免修改迭代中的列表
                try:
                    data = client.recv(1024)
                    if data:
                        print(f"收到: {data.decode('utf-8')}")
                        client.send(f"Echo: {data.decode('utf-8')}".encode('utf-8'))
                    else:
                        # 客户端关闭连接
                        clients.remove(client)
                        client.close()
                except BlockingIOError:
                    pass  # 没有数据可读
                except ConnectionResetError:
                    clients.remove(client)
                    client.close()
    except KeyboardInterrupt:
        pass
    finally:
        for client in clients:
            client.close()
        server_socket.close()
```

### select 模块 - IO 多路复用

```python
import socket
import select

def select_server():
    """使用 select 实现 IO 多路复用服务器"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen(5)
    server_socket.setblocking(False)

    # 监视的读列表，包含服务器套接字
    inputs = [server_socket]
    # 监视的写列表
    outputs = []
    # 消息队列
    message_queues = {}

    print("select 服务器启动")

    try:
        while inputs:
            # select 返回三个列表：可读、可写、异常
            readable, writable, exceptional = select.select(inputs, outputs, inputs, 1.0)

            for sock in readable:
                if sock is server_socket:
                    # 新连接
                    client_socket, address = sock.accept()
                    print(f"新连接: {address}")
                    client_socket.setblocking(False)
                    inputs.append(client_socket)
                    message_queues[client_socket] = []
                else:
                    # 现有客户端有数据
                    try:
                        data = sock.recv(1024)
                        if data:
                            print(f"收到: {data.decode('utf-8')}")
                            # 将响应加入队列
                            message_queues[sock].append(f"Echo: {data.decode('utf-8')}")
                            if sock not in outputs:
                                outputs.append(sock)
                        else:
                            # 客户端关闭
                            print("客户端断开")
                            if sock in outputs:
                                outputs.remove(sock)
                            inputs.remove(sock)
                            sock.close()
                            del message_queues[sock]
                    except ConnectionResetError:
                        if sock in outputs:
                            outputs.remove(sock)
                        inputs.remove(sock)
                        sock.close()
                        del message_queues[sock]

            for sock in writable:
                if message_queues.get(sock):
                    msg = message_queues[sock].pop(0)
                    sock.send(msg.encode('utf-8'))
                if not message_queues.get(sock):
                    outputs.remove(sock)

            for sock in exceptional:
                print(f"异常: {sock.getpeername()}")
                inputs.remove(sock)
                if sock in outputs:
                    outputs.remove(sock)
                sock.close()
                del message_queues[sock]

    except KeyboardInterrupt:
        pass
    finally:
        for sock in inputs:
            sock.close()
```

### selectors 模块 - 高级 IO 多路复用

```python
import socket
import selectors
import types

def selectors_server():
    """使用 selectors 模块的高级服务器"""
    sel = selectors.DefaultSelector()

    def accept_connection(sock):
        """接受新连接"""
        conn, addr = sock.accept()
        print(f"新连接: {addr}")
        conn.setblocking(False)
        data = types.SimpleNamespace(addr=addr, inb=b'', outb=b'')
        events = selectors.EVENT_READ | selectors.EVENT_WRITE
        sel.register(conn, events, data=data)

    def service_connection(key, mask):
        """处理客户端连接"""
        sock = key.fileobj
        data = key.data

        if mask & selectors.EVENT_READ:
            try:
                recv_data = sock.recv(1024)
                if recv_data:
                    data.outb += f"Echo: {recv_data.decode('utf-8')}".encode('utf-8')
                else:
                    print(f"关闭连接: {data.addr}")
                    sel.unregister(sock)
                    sock.close()
            except ConnectionResetError:
                sel.unregister(sock)
                sock.close()

        if mask & selectors.EVENT_WRITE:
            if data.outb:
                sent = sock.send(data.outb)
                data.outb = data.outb[sent:]

    # 创建服务器套接字
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen()
    server_socket.setblocking(False)

    # 注册服务器套接字
    sel.register(server_socket, selectors.EVENT_READ, data=None)

    print("selectors 服务器启动")

    try:
        while True:
            events = sel.select(timeout=1)
            for key, mask in events:
                if key.data is None:
                    accept_connection(key.fileobj)
                else:
                    service_connection(key, mask)
    except KeyboardInterrupt:
        pass
    finally:
        sel.close()
```

### socketserver 模块

```python
import socketserver
import threading

# 同步 TCP 请求处理器
class MyTCPHandler(socketserver.BaseRequestHandler):
    """TCP 请求处理器"""

    def handle(self):
        # self.request 是客户端套接字
        data = self.request.recv(1024).strip()
        print(f"[{self.client_address[0]}] 收到: {data.decode('utf-8')}")

        # 发送响应
        response = f"Echo: {data.decode('utf-8')}"
        self.request.sendall(response.encode('utf-8'))

# 流式请求处理器（使用文件对象）
class MyStreamHandler(socketserver.StreamRequestHandler):
    """流式请求处理器"""

    def handle(self):
        # self.rfile 和 self.wfile 是文件类对象
        data = self.rfile.readline().strip()
        print(f"[{self.client_address[0]}] 收到: {data.decode('utf-8')}")

        self.wfile.write(f"Echo: {data.decode('utf-8')}\n".encode('utf-8'))

# 多线程 TCP 服务器
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """多线程 TCP 服务器"""
    allow_reuse_address = True
    daemon_threads = True

# 多进程 TCP 服务器
class ForkingTCPServer(socketserver.ForkingMixIn, socketserver.TCPServer):
    """多进程 TCP 服务器（仅 Unix）"""
    allow_reuse_address = True

# UDP 请求处理器
class MyUDPHandler(socketserver.BaseRequestHandler):
    """UDP 请求处理器"""

    def handle(self):
        # self.request 是 (data, socket) 元组
        data, socket = self.request
        print(f"[{self.client_address[0]}] 收到: {data.decode('utf-8')}")

        response = f"UDP Echo: {data.decode('utf-8')}"
        socket.sendto(response.encode('utf-8'), self.client_address)

def run_tcp_server():
    """运行同步 TCP 服务器"""
    with socketserver.TCPServer(('localhost', 8888), MyTCPHandler) as server:
        print("同步 TCP 服务器启动")
        server.serve_forever()

def run_threaded_server():
    """运行多线程服务器"""
    server = ThreadedTCPServer(('localhost', 8888), MyTCPHandler)
    print("多线程服务器启动")

    # 在后台线程运行
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()

    return server

def run_udp_server():
    """运行 UDP 服务器"""
    with socketserver.UDPServer(('localhost', 9999), MyUDPHandler) as server:
        print("UDP 服务器启动")
        server.serve_forever()
```

### 带上下文管理器的 Socket

```python
import socket
from contextlib import contextmanager

@contextmanager
def tcp_connection(host, port, timeout=30):
    """TCP 连接上下文管理器"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        yield sock
    finally:
        sock.close()

# 使用示例
def client_with_context():
    with tcp_connection('localhost', 8888) as sock:
        sock.send(b"Hello!")
        response = sock.recv(1024)
        print(f"响应: {response.decode('utf-8')}")

# 或使用 socket 内置的上下文管理器
def simple_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        sock.send(b"Hello!")
        response = sock.recv(1024)
        print(f"响应: {response.decode('utf-8')}")
```

### 发送和接收完整数据

```python
import socket
import struct

def send_message(sock, message):
    """发送带长度前缀的消息"""
    data = message.encode('utf-8')
    # 使用 4 字节表示消息长度
    length = struct.pack('!I', len(data))
    sock.sendall(length + data)

def recv_message(sock):
    """接收带长度前缀的消息"""
    # 先接收长度
    length_data = recv_all(sock, 4)
    if not length_data:
        return None

    length = struct.unpack('!I', length_data)[0]

    # 接收消息内容
    data = recv_all(sock, length)
    if not data:
        return None

    return data.decode('utf-8')

def recv_all(sock, length):
    """确保接收指定长度的数据"""
    data = b''
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk:
            return None
        data += chunk
    return data

# 使用示例
def message_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('localhost', 8888))
    server.listen(5)

    print("消息服务器启动")

    while True:
        client, addr = server.accept()
        print(f"连接: {addr}")

        try:
            while True:
                msg = recv_message(client)
                if msg is None:
                    break
                print(f"收到: {msg}")
                send_message(client, f"Echo: {msg}")
        finally:
            client.close()

def message_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))

        # 发送多条消息
        messages = ["Hello", "这是一条很长的消息" * 100, "Goodbye"]
        for msg in messages:
            send_message(sock, msg)
            response = recv_message(sock)
            print(f"响应: {response[:50]}...")
```

## 最佳实践

### 资源管理

```python
import socket
from contextlib import closing

# 使用 with 语句确保资源释放
def safe_connection():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        # 使用 sock
        pass
    # 自动关闭

# 或使用 closing
def legacy_safe_connection():
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.connect(('localhost', 8888))
        pass
```

### 异常处理

```python
import socket
import errno

def robust_client():
    """健壮的客户端"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)

    try:
        sock.connect(('localhost', 8888))
    except socket.timeout:
        print("连接超时")
        return
    except ConnectionRefusedError:
        print("连接被拒绝，服务器可能未启动")
        return
    except socket.gaierror as e:
        print(f"地址解析错误: {e}")
        return

    try:
        sock.sendall(b"Hello")

        try:
            data = sock.recv(1024)
        except socket.timeout:
            print("接收数据超时")
        except ConnectionResetError:
            print("连接被重置")
        else:
            print(f"收到: {data}")

    finally:
        sock.close()
```

### 优雅关闭

```python
import socket
import signal
import sys

class GracefulServer:
    """支持优雅关闭的服务器"""

    def __init__(self, host='localhost', port=8888):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((host, port))
        self.server_socket.listen(5)
        self.running = True
        self.clients = []

        # 注册信号处理
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """处理终止信号"""
        print("\n正在关闭服务器...")
        self.running = False

        # 关闭所有客户端连接
        for client in self.clients:
            try:
                client.shutdown(socket.SHUT_RDWR)
                client.close()
            except:
                pass

        # 关闭服务器套接字
        self.server_socket.close()
        sys.exit(0)

    def run(self):
        print("服务器启动，按 Ctrl+C 停止")
        self.server_socket.settimeout(1.0)

        while self.running:
            try:
                client, addr = self.server_socket.accept()
                self.clients.append(client)
                print(f"新连接: {addr}")
                # 处理客户端...
            except socket.timeout:
                continue
            except OSError:
                break
```

### 日志记录

```python
import socket
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def logged_server():
    """带日志的服务器"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('localhost', 8888))
    server.listen(5)

    logger.info("服务器启动，监听端口 8888")

    try:
        while True:
            client, addr = server.accept()
            logger.info(f"新连接来自 {addr}")

            try:
                data = client.recv(1024)
                logger.debug(f"收到数据: {data[:100]}")
                client.send(b"OK")
                logger.info(f"响应已发送到 {addr}")
            except Exception as e:
                logger.error(f"处理 {addr} 时出错: {e}")
            finally:
                client.close()
                logger.info(f"连接 {addr} 已关闭")
    except KeyboardInterrupt:
        logger.info("收到终止信号")
    finally:
        server.close()
        logger.info("服务器已关闭")
```

## 常见陷阱

### 地址已被占用

```python
# 问题：快速重启服务器时出现 "Address already in use"
# 原因：TCP 连接关闭后会进入 TIME_WAIT 状态

# 解决方案：设置 SO_REUSEADDR
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('localhost', 8888))
```

### 数据不完整

```python
# 问题：大数据传输时只收到部分数据
# 原因：TCP 是流协议，一次 recv 可能无法获取全部数据

# 错误方式
data = sock.recv(1024)  # 可能只收到部分数据

# 正确方式：循环接收直到获取完整数据
def recv_all(sock, length):
    data = b''
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk:
            raise ConnectionError("连接关闭")
        data += chunk
    return data
```

### 阻塞导致的死锁

```python
# 问题：客户端和服务器都在等待对方发送数据
# 原因：recv() 默认阻塞

# 解决方案 1：设置超时
sock.settimeout(30)  # 30 秒超时

# 解决方案 2：非阻塞模式
sock.setblocking(False)

# 解决方案 3：使用 select
import select
readable, _, _ = select.select([sock], [], [], 5.0)
if readable:
    data = sock.recv(1024)
```

### 忘记关闭连接

```python
# 问题：socket 未关闭导致资源泄漏

# 错误方式
def bad_client():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 8888))
    sock.send(b"Hello")
    # 忘记关闭！

# 正确方式：使用 with 语句
def good_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        sock.send(b"Hello")
    # 自动关闭
```

### TCP 粘包问题

```python
# 问题：多次 send 的数据被合并接收
# 原因：TCP 是流协议，没有消息边界

# 发送端
sock.send(b"Message1")
sock.send(b"Message2")

# 接收端可能收到
# "Message1Message2" (粘包)

# 解决方案：添加消息边界
# 方案 1：固定长度
msg = b"Hello"
sock.send(msg.ljust(100))  # 固定 100 字节

# 方案 2：长度前缀
import struct
msg = b"Hello"
sock.send(struct.pack('!I', len(msg)) + msg)

# 方案 3：分隔符
sock.send(b"Hello\n")  # 使用换行分隔
```

### 字节与字符串混淆

```python
# 问题：TypeError: a bytes-like object is required

# 错误方式
sock.send("Hello")  # Python 3 中 socket 只接受 bytes

# 正确方式
sock.send("Hello".encode('utf-8'))

# 接收时
data = sock.recv(1024)
text = data.decode('utf-8')
```

## 性能考量

### 缓冲区大小调优

```python
import socket

def optimized_socket():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 增大缓冲区以提高吞吐量
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 262144)  # 256 KB
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 262144)

    # 检查实际缓冲区大小（系统可能调整）
    actual_sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    actual_rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
    print(f"实际发送缓冲区: {actual_sndbuf}, 接收缓冲区: {actual_rcvbuf}")

    return sock
```

### TCP_NODELAY 与 Nagle 算法

```python
import socket

# 默认：启用 Nagle 算法，合并小数据包
# 适合：大量数据传输，减少网络开销

# 禁用 Nagle：适合实时性要求高的场景
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# 典型应用场景
# - 禁用 Nagle：游戏、实时通信、交互式应用
# - 启用 Nagle：文件传输、批量数据传输
```

### 使用 sendfile() 传输大文件

```python
import socket
import os

def send_file_efficient(sock, filepath):
    """高效发送大文件"""
    with open(filepath, 'rb') as f:
        # 使用 sendfile 系统调用（零拷贝）
        # Python 3.5+
        sent = 0
        file_size = os.path.getsize(filepath)

        while sent < file_size:
            sent += sock.sendfile(f, sent)

        return sent

# 对比传统方式
def send_file_traditional(sock, filepath):
    """传统方式发送文件（需要数据拷贝）"""
    with open(filepath, 'rb') as f:
        while True:
            data = f.read(8192)
            if not data:
                break
            sock.sendall(data)
```

### 连接池

```python
import socket
import queue
import threading

class ConnectionPool:
    """简单的连接池实现"""

    def __init__(self, host, port, max_connections=10):
        self.host = host
        self.port = port
        self.max_connections = max_connections
        self.pool = queue.Queue(maxsize=max_connections)
        self.lock = threading.Lock()
        self.created = 0

    def get_connection(self):
        """获取连接"""
        try:
            return self.pool.get_nowait()
        except queue.Empty:
            with self.lock:
                if self.created < self.max_connections:
                    conn = self._create_connection()
                    self.created += 1
                    return conn
            # 等待可用连接
            return self.pool.get(timeout=30)

    def return_connection(self, conn):
        """归还连接"""
        try:
            self.pool.put_nowait(conn)
        except queue.Full:
            conn.close()
            with self.lock:
                self.created -= 1

    def _create_connection(self):
        """创建新连接"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.host, self.port))
        return sock

    def close_all(self):
        """关闭所有连接"""
        while not self.pool.empty():
            try:
                conn = self.pool.get_nowait()
                conn.close()
            except queue.Empty:
                break

# 使用示例
pool = ConnectionPool('localhost', 8888, max_connections=5)

def worker():
    conn = pool.get_connection()
    try:
        conn.send(b"Hello")
        data = conn.recv(1024)
    finally:
        pool.return_connection(conn)
```

### IO 多路复用的选择

```python
import sys

# 不同系统上的最佳选择
# Linux: epoll (高性能，支持大量连接)
# BSD/macOS: kqueue
# Windows: select (IOCP 需要其他库)

if sys.platform.startswith('linux'):
    # Linux 上使用 epoll
    import select
    epoll = select.epoll()
elif sys.platform == 'darwin':
    # macOS 上使用 kqueue
    import select
    kq = select.kqueue()
else:
    # 其他平台使用 select
    import select

# 推荐：使用 selectors 模块自动选择最佳实现
import selectors
sel = selectors.DefaultSelector()  # 自动选择最佳实现
```

## 实战场景

### 简单的聊天室

```python
import socket
import threading
import select

class ChatServer:
    """简单聊天室服务器"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.clients = {}  # socket: nickname
        self.server = None

    def broadcast(self, message, sender_socket=None):
        """广播消息给所有客户端"""
        for client in self.clients:
            if client != sender_socket:
                try:
                    client.send(message.encode('utf-8'))
                except:
                    self.remove_client(client)

    def remove_client(self, client_socket):
        """移除客户端"""
        if client_socket in self.clients:
            nickname = self.clients[client_socket]
            del self.clients[client_socket]
            client_socket.close()
            self.broadcast(f"[{nickname}] 离开了聊天室")

    def handle_client(self, client_socket, address):
        """处理客户端"""
        # 获取昵称
        client_socket.send("请输入昵称: ".encode('utf-8'))
        nickname = client_socket.recv(1024).decode('utf-8').strip()
        self.clients[client_socket] = nickname

        welcome = f"[{nickname}] 加入了聊天室"
        print(welcome)
        self.broadcast(welcome)

        while True:
            try:
                message = client_socket.recv(1024).decode('utf-8')
                if message:
                    formatted = f"[{nickname}]: {message}"
                    print(formatted)
                    self.broadcast(formatted, client_socket)
                else:
                    break
            except:
                break

        self.remove_client(client_socket)

    def start(self):
        """启动服务器"""
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((self.host, self.port))
        self.server.listen(10)

        print(f"聊天室服务器启动: {self.host}:{self.port}")

        try:
            while True:
                client_socket, address = self.server.accept()
                thread = threading.Thread(
                    target=self.handle_client,
                    args=(client_socket, address)
                )
                thread.daemon = True
                thread.start()
        except KeyboardInterrupt:
            print("\n关闭服务器")
        finally:
            self.server.close()

class ChatClient:
    """聊天客户端"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.socket = None
        self.running = False

    def receive_messages(self):
        """接收消息线程"""
        while self.running:
            try:
                message = self.socket.recv(1024).decode('utf-8')
                if message:
                    print(f"\n{message}")
                else:
                    break
            except:
                break

    def start(self):
        """启动客户端"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((self.host, self.port))
        self.running = True

        # 启动接收线程
        receive_thread = threading.Thread(target=self.receive_messages)
        receive_thread.daemon = True
        receive_thread.start()

        try:
            while self.running:
                message = input()
                if message.lower() == '/quit':
                    break
                self.socket.send(message.encode('utf-8'))
        except KeyboardInterrupt:
            pass
        finally:
            self.running = False
            self.socket.close()
```

### 文件传输服务器

```python
import socket
import os
import struct
import hashlib

class FileTransferServer:
    """文件传输服务器"""

    def __init__(self, host='localhost', port=8888, save_dir='./received'):
        self.host = host
        self.port = port
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)

    def receive_file(self, client_socket):
        """接收文件"""
        # 接收文件名长度和文件名
        filename_len = struct.unpack('!I', self._recv_all(client_socket, 4))[0]
        filename = self._recv_all(client_socket, filename_len).decode('utf-8')

        # 接收文件大小
        filesize = struct.unpack('!Q', self._recv_all(client_socket, 8))[0]

        print(f"接收文件: {filename} ({filesize} bytes)")

        # 接收文件内容
        filepath = os.path.join(self.save_dir, filename)
        received = 0
        md5 = hashlib.md5()

        with open(filepath, 'wb') as f:
            while received < filesize:
                chunk_size = min(8192, filesize - received)
                chunk = client_socket.recv(chunk_size)
                if not chunk:
                    break
                f.write(chunk)
                md5.update(chunk)
                received += len(chunk)

                # 显示进度
                progress = received / filesize * 100
                print(f"\r进度: {progress:.1f}%", end='')

        print(f"\n文件保存到: {filepath}")
        print(f"MD5: {md5.hexdigest()}")

        # 发送确认
        client_socket.send(b"OK")

    def _recv_all(self, sock, length):
        data = b''
        while len(data) < length:
            chunk = sock.recv(length - len(data))
            if not chunk:
                raise ConnectionError("连接关闭")
            data += chunk
        return data

    def start(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(5)

        print(f"文件服务器启动: {self.host}:{self.port}")

        try:
            while True:
                client, addr = server.accept()
                print(f"连接来自: {addr}")
                try:
                    self.receive_file(client)
                finally:
                    client.close()
        except KeyboardInterrupt:
            print("\n服务器停止")
        finally:
            server.close()

class FileTransferClient:
    """文件传输客户端"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port

    def send_file(self, filepath):
        """发送文件"""
        if not os.path.exists(filepath):
            print(f"文件不存在: {filepath}")
            return

        filename = os.path.basename(filepath)
        filesize = os.path.getsize(filepath)

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.host, self.port))

        try:
            # 发送文件名
            filename_bytes = filename.encode('utf-8')
            sock.send(struct.pack('!I', len(filename_bytes)))
            sock.send(filename_bytes)

            # 发送文件大小
            sock.send(struct.pack('!Q', filesize))

            # 发送文件内容
            print(f"发送文件: {filename} ({filesize} bytes)")
            sent = 0
            md5 = hashlib.md5()

            with open(filepath, 'rb') as f:
                while True:
                    chunk = f.read(8192)
                    if not chunk:
                        break
                    sock.send(chunk)
                    md5.update(chunk)
                    sent += len(chunk)

                    progress = sent / filesize * 100
                    print(f"\r进度: {progress:.1f}%", end='')

            print(f"\nMD5: {md5.hexdigest()}")

            # 等待确认
            response = sock.recv(1024)
            print(f"服务器响应: {response.decode('utf-8')}")

        finally:
            sock.close()
```

### HTTP 服务器简单实现

```python
import socket
import os
from datetime import datetime

class SimpleHTTPServer:
    """简单 HTTP 服务器"""

    def __init__(self, host='localhost', port=8080, root_dir='./www'):
        self.host = host
        self.port = port
        self.root_dir = root_dir
        os.makedirs(root_dir, exist_ok=True)

    def parse_request(self, request):
        """解析 HTTP 请求"""
        lines = request.split('\r\n')
        method, path, version = lines[0].split(' ')

        headers = {}
        for line in lines[1:]:
            if ': ' in line:
                key, value = line.split(': ', 1)
                headers[key] = value

        return method, path, version, headers

    def get_content_type(self, path):
        """获取内容类型"""
        extension = os.path.splitext(path)[1].lower()
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
        }
        return content_types.get(extension, 'application/octet-stream')

    def build_response(self, status_code, status_text, content, content_type='text/html'):
        """构建 HTTP 响应"""
        response = f"HTTP/1.1 {status_code} {status_text}\r\n"
        response += f"Date: {datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')}\r\n"
        response += f"Content-Type: {content_type}\r\n"
        response += f"Content-Length: {len(content)}\r\n"
        response += "Connection: close\r\n"
        response += "\r\n"

        return response.encode('utf-8') + content

    def handle_request(self, client_socket):
        """处理请求"""
        request = client_socket.recv(4096).decode('utf-8')

        if not request:
            return

        method, path, version, headers = self.parse_request(request)
        print(f"{method} {path}")

        if method != 'GET':
            response = self.build_response(405, 'Method Not Allowed', b'Method Not Allowed')
            client_socket.send(response)
            return

        # 安全检查
        if '..' in path:
            response = self.build_response(403, 'Forbidden', b'Forbidden')
            client_socket.send(response)
            return

        # 默认文件
        if path == '/':
            path = '/index.html'

        filepath = os.path.join(self.root_dir, path.lstrip('/'))

        if os.path.isfile(filepath):
            with open(filepath, 'rb') as f:
                content = f.read()
            content_type = self.get_content_type(filepath)
            response = self.build_response(200, 'OK', content, content_type)
        else:
            response = self.build_response(404, 'Not Found', b'404 Not Found')

        client_socket.send(response)

    def start(self):
        """启动服务器"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(10)

        print(f"HTTP 服务器启动: http://{self.host}:{self.port}")

        try:
            while True:
                client, addr = server.accept()
                try:
                    self.handle_request(client)
                except Exception as e:
                    print(f"处理请求错误: {e}")
                finally:
                    client.close()
        except KeyboardInterrupt:
            print("\n服务器停止")
        finally:
            server.close()
```

## 面试要点

### 什么是 Socket？TCP 和 UDP 的区别？

**答案要点：**
- Socket 是网络通信的端点，是应用层与传输层的接口
- TCP 是面向连接的、可靠的、基于字节流的协议
- UDP 是无连接的、不可靠的、基于数据报的协议
- TCP 有三次握手、流量控制、拥塞控制
- UDP 速度快、开销小，适合实时性要求高的场景

### 解释 TCP 三次握手和四次挥手

**答案要点：**
```
三次握手：
1. 客户端 → 服务器：SYN
2. 服务器 → 客户端：SYN + ACK
3. 客户端 → 服务器：ACK

四次挥手：
1. 主动方 → 被动方：FIN
2. 被动方 → 主动方：ACK
3. 被动方 → 主动方：FIN
4. 主动方 → 被动方：ACK
```

### 什么是 TIME_WAIT 状态？为什么需要它？

**答案要点：**
- TIME_WAIT 是主动关闭方在发送最后一个 ACK 后进入的状态
- 持续时间为 2MSL（Maximum Segment Lifetime）
- 目的：确保最后的 ACK 能到达；让旧连接的数据包消失
- 可能导致端口无法立即重用，需要设置 SO_REUSEADDR

### 如何处理 TCP 粘包问题？

**答案要点：**
- 固定长度消息
- 消息边界分隔符
- 长度前缀（推荐）
- 使用应用层协议（如 HTTP）

### select、poll、epoll 的区别？

**答案要点：**

| 特性 | select | poll | epoll |
|------|--------|------|-------|
| 最大连接数 | 1024(FD_SETSIZE) | 无限制 | 无限制 |
| 查找方式 | 遍历 | 遍历 | 回调 |
| 数据拷贝 | 每次调用复制 | 每次调用复制 | 共享内存 |
| 时间复杂度 | O(n) | O(n) | O(1) |

### 什么是阻塞 IO 和非阻塞 IO？

**答案要点：**
- 阻塞 IO：调用 recv() 时如果没有数据，线程会一直等待
- 非阻塞 IO：调用 recv() 时如果没有数据，立即返回错误
- IO 多路复用：使用 select/poll/epoll 监视多个描述符
- 异步 IO：发起操作后立即返回，完成后通知

### 如何实现高并发网络服务器？

**答案要点：**
- 多线程/多进程模型
- IO 多路复用（select/poll/epoll）
- 事件驱动（asyncio、事件循环）
- 连接池
- 负载均衡

## 延伸阅读

### 官方文档

- [Python socket 模块官方文档](https://docs.python.org/3/library/socket.html)
- [Python socketserver 模块文档](https://docs.python.org/3/library/socketserver.html)
- [Python selectors 模块文档](https://docs.python.org/3/library/selectors.html)

### 经典书籍

- 《Unix 网络编程》 - W. Richard Stevens
- 《TCP/IP 详解》 - W. Richard Stevens
- 《Python 网络编程攻略》

### 相关资源

- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [Python asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)
- [Real Python - Python Sockets Tutorial](https://realpython.com/python-sockets/)

### 进阶框架

- **Twisted**: 成熟的事件驱动网络框架
- **asyncio**: Python 内置异步 IO 框架
- **aiohttp**: 基于 asyncio 的 HTTP 客户端/服务器
- **uvloop**: 高性能事件循环实现
