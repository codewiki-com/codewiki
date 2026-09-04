---
title: Python Socket Network Programming
description: "Master Python socket programming: TCP/UDP communication, server and client, socket options, non-blocking mode, IO multiplexing, and socketserver"
track: python
section: stdlib
difficulty: advanced
tags:
  - Python
  - socket
  - network programming
  - TCP
  - UDP
  - concurrency
status: imported
origin: old/src/content/docs/python/socket.en.md
divergence: 0.2
issues: []
legacy:
  category: Python
  subcategory: Network Programming
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Explanation

Socket is the foundation of network programming, an abstraction layer between the application layer and the transport layer. It provides endpoints for inter-process network communication, enabling programs on different hosts to exchange data over the network.

### What is a Socket?

A socket is a network communication interface provided by the operating system. It encapsulates the complex details of underlying network protocols (such as TCP/IP) and provides developers with a concise API. You can think of a socket as:

- **Communication endpoint**: An endpoint for communication between two programs over a network
- **File descriptor**: In Unix/Linux, a socket is treated as a special type of file
- **API interface**: A programming interface that encapsulates the network protocol stack

### Historical Background

The Socket API was first introduced by the University of California, Berkeley in BSD 4.2 in 1983, which is why it's also called "Berkeley Sockets." It has become the de facto standard for network programming, supported by virtually all operating systems and programming languages.

### What Problems Does It Solve?

- **Inter-process communication**: Enables processes on different hosts to exchange data
- **Protocol abstraction**: Hides the implementation details of underlying network protocols
- **Cross-platform compatibility**: Provides a unified network programming interface
- **Flexibility**: Supports multiple transport protocols (TCP, UDP, etc.)

## Core Principles

### Network Layer Model

```
Application Layer (HTTP, FTP, SMTP...)
      |
Transport Layer (TCP, UDP)  <- Socket works here
      |
Network Layer (IP)
      |
Data Link Layer (Ethernet, WiFi)
      |
Physical Layer
```

### Socket Communication Model

```
    Client                                   Server
+---------------+                    +---------------+
|   socket()    |                    |   socket()    |
+-------+-------+                    +-------+-------+
        |                                    |
        |                            +-------+-------+
        |                            |    bind()     |
        |                            +-------+-------+
        |                                    |
        |                            +-------+-------+
        |                            |   listen()    |
        |                            +-------+-------+
        |                                    |
+-------+-------+                    +-------+-------+
|  connect()    | --Connection Req-> |   accept()    |
+-------+-------+                    +-------+-------+
        |                                    |
        | <------- Connection Est. -------->  |
        |                                    |
+-------+-------+                    +-------+-------+
|  send/recv    | <---Data Exchange--> |  send/recv  |
+-------+-------+                    +-------+-------+
        |                                    |
+-------+-------+                    +-------+-------+
|   close()     |                    |   close()     |
+---------------+                    +---------------+
```

### TCP Three-Way Handshake

```python
# TCP connection establishment process
# Client sends SYN
# Server responds with SYN+ACK
# Client sends ACK

# This process is automatically completed by the operating system, transparent to socket programming
```

### TCP vs UDP

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Reliable transmission | Unreliable |
| Order | Guaranteed order | No guaranteed order |
| Speed | Slower | Faster |
| Overhead | Higher | Lower |
| Use cases | File transfer, HTTP | Video streaming, DNS |

## Core Concepts

### Socket Types

```python
import socket

# Stream socket (TCP)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Datagram socket (UDP)
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

# Raw socket (requires root privileges)
raw_socket = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_TCP)
```

### Address Families

```python
import socket

# IPv4 address family
socket.AF_INET      # e.g.: ('192.168.1.1', 8080)

# IPv6 address family
socket.AF_INET6     # e.g.: ('::1', 8080, 0, 0)

# Unix domain socket (local inter-process communication)
socket.AF_UNIX      # e.g.: '/tmp/mysocket.sock'
```

### Core Methods Overview

| Method | Description | TCP | UDP |
|--------|-------------|-----|-----|
| `socket()` | Create socket | Yes | Yes |
| `bind()` | Bind address | Yes | Yes |
| `listen()` | Start listening | Yes | No |
| `accept()` | Accept connection | Yes | No |
| `connect()` | Connect to server | Yes | Optional |
| `send()` | Send data | Yes | Yes* |
| `recv()` | Receive data | Yes | Yes* |
| `sendto()` | Send data to specified address | No | Yes |
| `recvfrom()` | Receive data and get sender address | No | Yes |
| `close()` | Close socket | Yes | Yes |

## Code Examples

### TCP Server - Basic Version

```python
import socket

def create_tcp_server(host='localhost', port=8888):
    """Create a basic TCP server"""
    # Create TCP socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Allow address reuse (avoid "Address already in use" error)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # Bind address and port
    server_socket.bind((host, port))

    # Start listening, parameter is the maximum length of the pending connection queue
    server_socket.listen(5)
    print(f"Server started, listening on {host}:{port}")

    try:
        while True:
            # Accept client connection (blocking)
            client_socket, client_address = server_socket.accept()
            print(f"Client connected: {client_address}")

            try:
                # Receive data
                data = client_socket.recv(1024)
                if data:
                    print(f"Received data: {data.decode('utf-8')}")
                    # Send response
                    response = f"Server received: {data.decode('utf-8')}"
                    client_socket.send(response.encode('utf-8'))
            finally:
                # Close client connection
                client_socket.close()
    finally:
        server_socket.close()

if __name__ == '__main__':
    create_tcp_server()
```

### TCP Client - Basic Version

```python
import socket

def create_tcp_client(host='localhost', port=8888):
    """Create a basic TCP client"""
    # Create TCP socket
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        # Connect to server
        client_socket.connect((host, port))
        print(f"Connected to {host}:{port}")

        # Send data
        message = "Hello, Server!"
        client_socket.send(message.encode('utf-8'))
        print(f"Sent: {message}")

        # Receive response
        response = client_socket.recv(1024)
        print(f"Received response: {response.decode('utf-8')}")
    finally:
        client_socket.close()

if __name__ == '__main__':
    create_tcp_client()
```

### TCP Server - Multi-threaded Version

```python
import socket
import threading

class ThreadedTCPServer:
    """Multi-threaded TCP server"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.server_socket = None
        self.running = False

    def start(self):
        """Start the server"""
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((self.host, self.port))
        self.server_socket.listen(5)
        self.running = True

        print(f"Multi-threaded server started, listening on {self.host}:{self.port}")

        try:
            while self.running:
                try:
                    client_socket, client_address = self.server_socket.accept()
                    # Create a new thread for each client
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
        """Handle client connection"""
        print(f"[{threading.current_thread().name}] Client connected: {client_address}")

        try:
            while True:
                data = client_socket.recv(1024)
                if not data:
                    break

                message = data.decode('utf-8')
                print(f"[{client_address}] Received: {message}")

                # Echo service
                response = f"Echo: {message}"
                client_socket.send(response.encode('utf-8'))
        except Exception as e:
            print(f"[{client_address}] Error: {e}")
        finally:
            print(f"[{client_address}] Disconnected")
            client_socket.close()

    def stop(self):
        """Stop the server"""
        self.running = False
        if self.server_socket:
            self.server_socket.close()

if __name__ == '__main__':
    server = ThreadedTCPServer()
    try:
        server.start()
    except KeyboardInterrupt:
        server.stop()
        print("\nServer stopped")
```

### UDP Server and Client

```python
import socket

# UDP Server
def udp_server(host='localhost', port=9999):
    """UDP server"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    server_socket.bind((host, port))
    print(f"UDP server started, listening on {host}:{port}")

    try:
        while True:
            # Receive data and client address
            data, client_address = server_socket.recvfrom(1024)
            print(f"Received from {client_address}: {data.decode('utf-8')}")

            # Send response
            response = f"UDP Echo: {data.decode('utf-8')}"
            server_socket.sendto(response.encode('utf-8'), client_address)
    finally:
        server_socket.close()

# UDP Client
def udp_client(host='localhost', port=9999):
    """UDP client"""
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    try:
        message = "Hello, UDP Server!"
        # Send data
        client_socket.sendto(message.encode('utf-8'), (host, port))
        print(f"Sent: {message}")

        # Set timeout
        client_socket.settimeout(5.0)

        # Receive response
        response, server_address = client_socket.recvfrom(1024)
        print(f"Received response: {response.decode('utf-8')}")
    except socket.timeout:
        print("Timeout waiting for response")
    finally:
        client_socket.close()
```

### Socket Options Configuration

```python
import socket

def configure_socket_options():
    """Demonstrate common socket options"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # 1. Address reuse - avoid binding failure due to TIME_WAIT state
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # 2. Port reuse (Linux 3.9+)
    # sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)

    # 3. Send buffer size
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 65536)

    # 4. Receive buffer size
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)

    # 5. Keep-alive mechanism (TCP Keep-Alive)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)

    # Linux-specific TCP Keep-Alive parameters
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 60)   # Time before starting probes
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10) # Probe interval
    # sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 5)    # Probe count

    # 6. Disable Nagle algorithm (reduce latency)
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

    # 7. Set timeout
    sock.settimeout(30.0)  # 30 second timeout

    # Read option values
    print(f"SO_REUSEADDR: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR)}")
    print(f"SO_SNDBUF: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)}")
    print(f"SO_RCVBUF: {sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)}")
    print(f"TCP_NODELAY: {sock.getsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY)}")

    return sock
```

### Non-blocking Mode

```python
import socket
import errno

def non_blocking_server():
    """Non-blocking server example"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen(5)

    # Set to non-blocking mode
    server_socket.setblocking(False)

    clients = []
    print("Non-blocking server started")

    try:
        while True:
            # Try to accept new connections
            try:
                client_socket, address = server_socket.accept()
                client_socket.setblocking(False)
                clients.append(client_socket)
                print(f"New connection: {address}")
            except BlockingIOError:
                pass  # No new connections

            # Handle existing clients
            for client in clients[:]:  # Use slice copy to avoid modifying list during iteration
                try:
                    data = client.recv(1024)
                    if data:
                        print(f"Received: {data.decode('utf-8')}")
                        client.send(f"Echo: {data.decode('utf-8')}".encode('utf-8'))
                    else:
                        # Client closed connection
                        clients.remove(client)
                        client.close()
                except BlockingIOError:
                    pass  # No data to read
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

### select Module - IO Multiplexing

```python
import socket
import select

def select_server():
    """IO multiplexing server using select"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen(5)
    server_socket.setblocking(False)

    # Read list to monitor, includes server socket
    inputs = [server_socket]
    # Write list to monitor
    outputs = []
    # Message queues
    message_queues = {}

    print("select server started")

    try:
        while inputs:
            # select returns three lists: readable, writable, exceptional
            readable, writable, exceptional = select.select(inputs, outputs, inputs, 1.0)

            for sock in readable:
                if sock is server_socket:
                    # New connection
                    client_socket, address = sock.accept()
                    print(f"New connection: {address}")
                    client_socket.setblocking(False)
                    inputs.append(client_socket)
                    message_queues[client_socket] = []
                else:
                    # Existing client has data
                    try:
                        data = sock.recv(1024)
                        if data:
                            print(f"Received: {data.decode('utf-8')}")
                            # Add response to queue
                            message_queues[sock].append(f"Echo: {data.decode('utf-8')}")
                            if sock not in outputs:
                                outputs.append(sock)
                        else:
                            # Client closed
                            print("Client disconnected")
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
                print(f"Exception: {sock.getpeername()}")
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

### selectors Module - High-level IO Multiplexing

```python
import socket
import selectors
import types

def selectors_server():
    """Advanced server using selectors module"""
    sel = selectors.DefaultSelector()

    def accept_connection(sock):
        """Accept new connection"""
        conn, addr = sock.accept()
        print(f"New connection: {addr}")
        conn.setblocking(False)
        data = types.SimpleNamespace(addr=addr, inb=b'', outb=b'')
        events = selectors.EVENT_READ | selectors.EVENT_WRITE
        sel.register(conn, events, data=data)

    def service_connection(key, mask):
        """Handle client connection"""
        sock = key.fileobj
        data = key.data

        if mask & selectors.EVENT_READ:
            try:
                recv_data = sock.recv(1024)
                if recv_data:
                    data.outb += f"Echo: {recv_data.decode('utf-8')}".encode('utf-8')
                else:
                    print(f"Closing connection: {data.addr}")
                    sel.unregister(sock)
                    sock.close()
            except ConnectionResetError:
                sel.unregister(sock)
                sock.close()

        if mask & selectors.EVENT_WRITE:
            if data.outb:
                sent = sock.send(data.outb)
                data.outb = data.outb[sent:]

    # Create server socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('localhost', 8888))
    server_socket.listen()
    server_socket.setblocking(False)

    # Register server socket
    sel.register(server_socket, selectors.EVENT_READ, data=None)

    print("selectors server started")

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

### socketserver Module

```python
import socketserver
import threading

# Synchronous TCP request handler
class MyTCPHandler(socketserver.BaseRequestHandler):
    """TCP request handler"""

    def handle(self):
        # self.request is the client socket
        data = self.request.recv(1024).strip()
        print(f"[{self.client_address[0]}] Received: {data.decode('utf-8')}")

        # Send response
        response = f"Echo: {data.decode('utf-8')}"
        self.request.sendall(response.encode('utf-8'))

# Stream request handler (using file objects)
class MyStreamHandler(socketserver.StreamRequestHandler):
    """Stream request handler"""

    def handle(self):
        # self.rfile and self.wfile are file-like objects
        data = self.rfile.readline().strip()
        print(f"[{self.client_address[0]}] Received: {data.decode('utf-8')}")

        self.wfile.write(f"Echo: {data.decode('utf-8')}\n".encode('utf-8'))

# Multi-threaded TCP server
class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    """Multi-threaded TCP server"""
    allow_reuse_address = True
    daemon_threads = True

# Multi-process TCP server
class ForkingTCPServer(socketserver.ForkingMixIn, socketserver.TCPServer):
    """Multi-process TCP server (Unix only)"""
    allow_reuse_address = True

# UDP request handler
class MyUDPHandler(socketserver.BaseRequestHandler):
    """UDP request handler"""

    def handle(self):
        # self.request is a (data, socket) tuple
        data, socket = self.request
        print(f"[{self.client_address[0]}] Received: {data.decode('utf-8')}")

        response = f"UDP Echo: {data.decode('utf-8')}"
        socket.sendto(response.encode('utf-8'), self.client_address)

def run_tcp_server():
    """Run synchronous TCP server"""
    with socketserver.TCPServer(('localhost', 8888), MyTCPHandler) as server:
        print("Synchronous TCP server started")
        server.serve_forever()

def run_threaded_server():
    """Run multi-threaded server"""
    server = ThreadedTCPServer(('localhost', 8888), MyTCPHandler)
    print("Multi-threaded server started")

    # Run in background thread
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()

    return server

def run_udp_server():
    """Run UDP server"""
    with socketserver.UDPServer(('localhost', 9999), MyUDPHandler) as server:
        print("UDP server started")
        server.serve_forever()
```

### Socket with Context Manager

```python
import socket
from contextlib import contextmanager

@contextmanager
def tcp_connection(host, port, timeout=30):
    """TCP connection context manager"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        yield sock
    finally:
        sock.close()

# Usage example
def client_with_context():
    with tcp_connection('localhost', 8888) as sock:
        sock.send(b"Hello!")
        response = sock.recv(1024)
        print(f"Response: {response.decode('utf-8')}")

# Or using socket's built-in context manager
def simple_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        sock.send(b"Hello!")
        response = sock.recv(1024)
        print(f"Response: {response.decode('utf-8')}")
```

### Sending and Receiving Complete Data

```python
import socket
import struct

def send_message(sock, message):
    """Send a message with length prefix"""
    data = message.encode('utf-8')
    # Use 4 bytes to represent message length
    length = struct.pack('!I', len(data))
    sock.sendall(length + data)

def recv_message(sock):
    """Receive a message with length prefix"""
    # First receive length
    length_data = recv_all(sock, 4)
    if not length_data:
        return None

    length = struct.unpack('!I', length_data)[0]

    # Receive message content
    data = recv_all(sock, length)
    if not data:
        return None

    return data.decode('utf-8')

def recv_all(sock, length):
    """Ensure receiving data of specified length"""
    data = b''
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk:
            return None
        data += chunk
    return data

# Usage example
def message_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('localhost', 8888))
    server.listen(5)

    print("Message server started")

    while True:
        client, addr = server.accept()
        print(f"Connection: {addr}")

        try:
            while True:
                msg = recv_message(client)
                if msg is None:
                    break
                print(f"Received: {msg}")
                send_message(client, f"Echo: {msg}")
        finally:
            client.close()

def message_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))

        # Send multiple messages
        messages = ["Hello", "This is a very long message" * 100, "Goodbye"]
        for msg in messages:
            send_message(sock, msg)
            response = recv_message(sock)
            print(f"Response: {response[:50]}...")
```

## Best Practices

### Resource Management

```python
import socket
from contextlib import closing

# Use with statement to ensure resource release
def safe_connection():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        # Use sock
        pass
    # Automatically closed

# Or use closing
def legacy_safe_connection():
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.connect(('localhost', 8888))
        pass
```

### Exception Handling

```python
import socket
import errno

def robust_client():
    """Robust client"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)

    try:
        sock.connect(('localhost', 8888))
    except socket.timeout:
        print("Connection timeout")
        return
    except ConnectionRefusedError:
        print("Connection refused, server may not be running")
        return
    except socket.gaierror as e:
        print(f"Address resolution error: {e}")
        return

    try:
        sock.sendall(b"Hello")

        try:
            data = sock.recv(1024)
        except socket.timeout:
            print("Timeout receiving data")
        except ConnectionResetError:
            print("Connection reset")
        else:
            print(f"Received: {data}")

    finally:
        sock.close()
```

### Graceful Shutdown

```python
import socket
import signal
import sys

class GracefulServer:
    """Server supporting graceful shutdown"""

    def __init__(self, host='localhost', port=8888):
        self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_socket.bind((host, port))
        self.server_socket.listen(5)
        self.running = True
        self.clients = []

        # Register signal handlers
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle termination signals"""
        print("\nShutting down server...")
        self.running = False

        # Close all client connections
        for client in self.clients:
            try:
                client.shutdown(socket.SHUT_RDWR)
                client.close()
            except:
                pass

        # Close server socket
        self.server_socket.close()
        sys.exit(0)

    def run(self):
        print("Server started, press Ctrl+C to stop")
        self.server_socket.settimeout(1.0)

        while self.running:
            try:
                client, addr = self.server_socket.accept()
                self.clients.append(client)
                print(f"New connection: {addr}")
                # Handle client...
            except socket.timeout:
                continue
            except OSError:
                break
```

### Logging

```python
import socket
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def logged_server():
    """Server with logging"""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('localhost', 8888))
    server.listen(5)

    logger.info("Server started, listening on port 8888")

    try:
        while True:
            client, addr = server.accept()
            logger.info(f"New connection from {addr}")

            try:
                data = client.recv(1024)
                logger.debug(f"Received data: {data[:100]}")
                client.send(b"OK")
                logger.info(f"Response sent to {addr}")
            except Exception as e:
                logger.error(f"Error handling {addr}: {e}")
            finally:
                client.close()
                logger.info(f"Connection {addr} closed")
    except KeyboardInterrupt:
        logger.info("Termination signal received")
    finally:
        server.close()
        logger.info("Server closed")
```

## Common Pitfalls

### Address Already in Use

```python
# Problem: "Address already in use" when quickly restarting server
# Cause: TCP connection enters TIME_WAIT state after closing

# Solution: Set SO_REUSEADDR
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(('localhost', 8888))
```

### Incomplete Data

```python
# Problem: Only receiving partial data in large data transfers
# Cause: TCP is a stream protocol, one recv may not get all data

# Wrong approach
data = sock.recv(1024)  # May only receive partial data

# Correct approach: Loop until complete data received
def recv_all(sock, length):
    data = b''
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk:
            raise ConnectionError("Connection closed")
        data += chunk
    return data
```

### Deadlock Due to Blocking

```python
# Problem: Client and server both waiting for each other to send data
# Cause: recv() blocks by default

# Solution 1: Set timeout
sock.settimeout(30)  # 30 second timeout

# Solution 2: Non-blocking mode
sock.setblocking(False)

# Solution 3: Use select
import select
readable, _, _ = select.select([sock], [], [], 5.0)
if readable:
    data = sock.recv(1024)
```

### Forgetting to Close Connections

```python
# Problem: Socket not closed causing resource leak

# Wrong approach
def bad_client():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 8888))
    sock.send(b"Hello")
    # Forgot to close!

# Correct approach: Use with statement
def good_client():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.connect(('localhost', 8888))
        sock.send(b"Hello")
    # Automatically closed
```

### TCP Sticky Packet Problem

```python
# Problem: Multiple sends are merged when received
# Cause: TCP is a stream protocol with no message boundaries

# Sender
sock.send(b"Message1")
sock.send(b"Message2")

# Receiver may receive
# "Message1Message2" (sticky packet)

# Solutions: Add message boundaries
# Option 1: Fixed length
msg = b"Hello"
sock.send(msg.ljust(100))  # Fixed 100 bytes

# Option 2: Length prefix
import struct
msg = b"Hello"
sock.send(struct.pack('!I', len(msg)) + msg)

# Option 3: Delimiter
sock.send(b"Hello\n")  # Use newline as delimiter
```

### Bytes vs String Confusion

```python
# Problem: TypeError: a bytes-like object is required

# Wrong approach
sock.send("Hello")  # In Python 3, socket only accepts bytes

# Correct approach
sock.send("Hello".encode('utf-8'))

# When receiving
data = sock.recv(1024)
text = data.decode('utf-8')
```

## Performance Considerations

### Buffer Size Tuning

```python
import socket

def optimized_socket():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Increase buffer size to improve throughput
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF, 262144)  # 256 KB
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 262144)

    # Check actual buffer size (system may adjust)
    actual_sndbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_SNDBUF)
    actual_rcvbuf = sock.getsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF)
    print(f"Actual send buffer: {actual_sndbuf}, receive buffer: {actual_rcvbuf}")

    return sock
```

### TCP_NODELAY and Nagle Algorithm

```python
import socket

# Default: Nagle algorithm enabled, merges small packets
# Suitable for: Bulk data transfer, reduces network overhead

# Disable Nagle: Suitable for real-time scenarios
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# Typical use cases
# - Disable Nagle: Games, real-time communication, interactive applications
# - Enable Nagle: File transfer, batch data transfer
```

### Using sendfile() for Large File Transfer

```python
import socket
import os

def send_file_efficient(sock, filepath):
    """Efficiently send large files"""
    with open(filepath, 'rb') as f:
        # Use sendfile system call (zero-copy)
        # Python 3.5+
        sent = 0
        file_size = os.path.getsize(filepath)

        while sent < file_size:
            sent += sock.sendfile(f, sent)

        return sent

# Compare with traditional approach
def send_file_traditional(sock, filepath):
    """Traditional file sending (requires data copy)"""
    with open(filepath, 'rb') as f:
        while True:
            data = f.read(8192)
            if not data:
                break
            sock.sendall(data)
```

### Connection Pool

```python
import socket
import queue
import threading

class ConnectionPool:
    """Simple connection pool implementation"""

    def __init__(self, host, port, max_connections=10):
        self.host = host
        self.port = port
        self.max_connections = max_connections
        self.pool = queue.Queue(maxsize=max_connections)
        self.lock = threading.Lock()
        self.created = 0

    def get_connection(self):
        """Get a connection"""
        try:
            return self.pool.get_nowait()
        except queue.Empty:
            with self.lock:
                if self.created < self.max_connections:
                    conn = self._create_connection()
                    self.created += 1
                    return conn
            # Wait for available connection
            return self.pool.get(timeout=30)

    def return_connection(self, conn):
        """Return a connection"""
        try:
            self.pool.put_nowait(conn)
        except queue.Full:
            conn.close()
            with self.lock:
                self.created -= 1

    def _create_connection(self):
        """Create new connection"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.host, self.port))
        return sock

    def close_all(self):
        """Close all connections"""
        while not self.pool.empty():
            try:
                conn = self.pool.get_nowait()
                conn.close()
            except queue.Empty:
                break

# Usage example
pool = ConnectionPool('localhost', 8888, max_connections=5)

def worker():
    conn = pool.get_connection()
    try:
        conn.send(b"Hello")
        data = conn.recv(1024)
    finally:
        pool.return_connection(conn)
```

### IO Multiplexing Selection

```python
import sys

# Best choice on different systems
# Linux: epoll (high performance, supports many connections)
# BSD/macOS: kqueue
# Windows: select (IOCP requires other libraries)

if sys.platform.startswith('linux'):
    # Use epoll on Linux
    import select
    epoll = select.epoll()
elif sys.platform == 'darwin':
    # Use kqueue on macOS
    import select
    kq = select.kqueue()
else:
    # Use select on other platforms
    import select

# Recommended: Use selectors module to automatically select best implementation
import selectors
sel = selectors.DefaultSelector()  # Automatically selects best implementation
```

## Practical Scenarios

### Simple Chat Room

```python
import socket
import threading
import select

class ChatServer:
    """Simple chat room server"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.clients = {}  # socket: nickname
        self.server = None

    def broadcast(self, message, sender_socket=None):
        """Broadcast message to all clients"""
        for client in self.clients:
            if client != sender_socket:
                try:
                    client.send(message.encode('utf-8'))
                except:
                    self.remove_client(client)

    def remove_client(self, client_socket):
        """Remove client"""
        if client_socket in self.clients:
            nickname = self.clients[client_socket]
            del self.clients[client_socket]
            client_socket.close()
            self.broadcast(f"[{nickname}] left the chat room")

    def handle_client(self, client_socket, address):
        """Handle client"""
        # Get nickname
        client_socket.send("Please enter nickname: ".encode('utf-8'))
        nickname = client_socket.recv(1024).decode('utf-8').strip()
        self.clients[client_socket] = nickname

        welcome = f"[{nickname}] joined the chat room"
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
        """Start server"""
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((self.host, self.port))
        self.server.listen(10)

        print(f"Chat server started: {self.host}:{self.port}")

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
            print("\nShutting down server")
        finally:
            self.server.close()

class ChatClient:
    """Chat client"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port
        self.socket = None
        self.running = False

    def receive_messages(self):
        """Receive messages thread"""
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
        """Start client"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((self.host, self.port))
        self.running = True

        # Start receive thread
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

### File Transfer Server

```python
import socket
import os
import struct
import hashlib

class FileTransferServer:
    """File transfer server"""

    def __init__(self, host='localhost', port=8888, save_dir='./received'):
        self.host = host
        self.port = port
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)

    def receive_file(self, client_socket):
        """Receive file"""
        # Receive filename length and filename
        filename_len = struct.unpack('!I', self._recv_all(client_socket, 4))[0]
        filename = self._recv_all(client_socket, filename_len).decode('utf-8')

        # Receive file size
        filesize = struct.unpack('!Q', self._recv_all(client_socket, 8))[0]

        print(f"Receiving file: {filename} ({filesize} bytes)")

        # Receive file content
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

                # Show progress
                progress = received / filesize * 100
                print(f"\rProgress: {progress:.1f}%", end='')

        print(f"\nFile saved to: {filepath}")
        print(f"MD5: {md5.hexdigest()}")

        # Send confirmation
        client_socket.send(b"OK")

    def _recv_all(self, sock, length):
        data = b''
        while len(data) < length:
            chunk = sock.recv(length - len(data))
            if not chunk:
                raise ConnectionError("Connection closed")
            data += chunk
        return data

    def start(self):
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(5)

        print(f"File server started: {self.host}:{self.port}")

        try:
            while True:
                client, addr = server.accept()
                print(f"Connection from: {addr}")
                try:
                    self.receive_file(client)
                finally:
                    client.close()
        except KeyboardInterrupt:
            print("\nServer stopped")
        finally:
            server.close()

class FileTransferClient:
    """File transfer client"""

    def __init__(self, host='localhost', port=8888):
        self.host = host
        self.port = port

    def send_file(self, filepath):
        """Send file"""
        if not os.path.exists(filepath):
            print(f"File not found: {filepath}")
            return

        filename = os.path.basename(filepath)
        filesize = os.path.getsize(filepath)

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.host, self.port))

        try:
            # Send filename
            filename_bytes = filename.encode('utf-8')
            sock.send(struct.pack('!I', len(filename_bytes)))
            sock.send(filename_bytes)

            # Send file size
            sock.send(struct.pack('!Q', filesize))

            # Send file content
            print(f"Sending file: {filename} ({filesize} bytes)")
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
                    print(f"\rProgress: {progress:.1f}%", end='')

            print(f"\nMD5: {md5.hexdigest()}")

            # Wait for confirmation
            response = sock.recv(1024)
            print(f"Server response: {response.decode('utf-8')}")

        finally:
            sock.close()
```

### Simple HTTP Server Implementation

```python
import socket
import os
from datetime import datetime

class SimpleHTTPServer:
    """Simple HTTP server"""

    def __init__(self, host='localhost', port=8080, root_dir='./www'):
        self.host = host
        self.port = port
        self.root_dir = root_dir
        os.makedirs(root_dir, exist_ok=True)

    def parse_request(self, request):
        """Parse HTTP request"""
        lines = request.split('\r\n')
        method, path, version = lines[0].split(' ')

        headers = {}
        for line in lines[1:]:
            if ': ' in line:
                key, value = line.split(': ', 1)
                headers[key] = value

        return method, path, version, headers

    def get_content_type(self, path):
        """Get content type"""
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
        """Build HTTP response"""
        response = f"HTTP/1.1 {status_code} {status_text}\r\n"
        response += f"Date: {datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')}\r\n"
        response += f"Content-Type: {content_type}\r\n"
        response += f"Content-Length: {len(content)}\r\n"
        response += "Connection: close\r\n"
        response += "\r\n"

        return response.encode('utf-8') + content

    def handle_request(self, client_socket):
        """Handle request"""
        request = client_socket.recv(4096).decode('utf-8')

        if not request:
            return

        method, path, version, headers = self.parse_request(request)
        print(f"{method} {path}")

        if method != 'GET':
            response = self.build_response(405, 'Method Not Allowed', b'Method Not Allowed')
            client_socket.send(response)
            return

        # Security check
        if '..' in path:
            response = self.build_response(403, 'Forbidden', b'Forbidden')
            client_socket.send(response)
            return

        # Default file
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
        """Start server"""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((self.host, self.port))
        server.listen(10)

        print(f"HTTP server started: http://{self.host}:{self.port}")

        try:
            while True:
                client, addr = server.accept()
                try:
                    self.handle_request(client)
                except Exception as e:
                    print(f"Request handling error: {e}")
                finally:
                    client.close()
        except KeyboardInterrupt:
            print("\nServer stopped")
        finally:
            server.close()
```

## Interview Key Points

### What is a Socket? What's the difference between TCP and UDP?

**Key Points:**
- Socket is an endpoint for network communication, the interface between application layer and transport layer
- TCP is connection-oriented, reliable, and byte-stream based
- UDP is connectionless, unreliable, and datagram-based
- TCP has three-way handshake, flow control, congestion control
- UDP is faster with lower overhead, suitable for real-time scenarios

### Explain TCP Three-Way Handshake and Four-Way Wave

**Key Points:**
```
Three-Way Handshake:
1. Client -> Server: SYN
2. Server -> Client: SYN + ACK
3. Client -> Server: ACK

Four-Way Wave:
1. Active -> Passive: FIN
2. Passive -> Active: ACK
3. Passive -> Active: FIN
4. Active -> Passive: ACK
```

### What is TIME_WAIT state? Why is it needed?

**Key Points:**
- TIME_WAIT is the state the active closer enters after sending the last ACK
- Duration is 2MSL (Maximum Segment Lifetime)
- Purpose: Ensure the last ACK reaches destination; let old connection packets expire
- May prevent port from being reused immediately, need to set SO_REUSEADDR

### How to handle TCP sticky packet problem?

**Key Points:**
- Fixed length messages
- Message boundary delimiter
- Length prefix (recommended)
- Use application layer protocol (e.g., HTTP)

### What are the differences between select, poll, and epoll?

**Key Points:**

| Feature | select | poll | epoll |
|---------|--------|------|-------|
| Max connections | 1024 (FD_SETSIZE) | Unlimited | Unlimited |
| Search method | Traversal | Traversal | Callback |
| Data copy | Copy every call | Copy every call | Shared memory |
| Time complexity | O(n) | O(n) | O(1) |

### What is blocking IO and non-blocking IO?

**Key Points:**
- Blocking IO: Thread waits indefinitely when calling recv() with no data
- Non-blocking IO: recv() returns error immediately when there's no data
- IO multiplexing: Use select/poll/epoll to monitor multiple descriptors
- Asynchronous IO: Returns immediately after initiating operation, notified when complete

### How to implement a high-concurrency network server?

**Key Points:**
- Multi-threading/multi-process model
- IO multiplexing (select/poll/epoll)
- Event-driven (asyncio, event loop)
- Connection pool
- Load balancing

## Further Reading

### Official Documentation

- [Python socket Module Official Documentation](https://docs.python.org/3/library/socket.html)
- [Python socketserver Module Documentation](https://docs.python.org/3/library/socketserver.html)
- [Python selectors Module Documentation](https://docs.python.org/3/library/selectors.html)

### Classic Books

- "Unix Network Programming" - W. Richard Stevens
- "TCP/IP Illustrated" - W. Richard Stevens
- "Foundations of Python Network Programming"

### Related Resources

- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [Python asyncio Official Documentation](https://docs.python.org/3/library/asyncio.html)
- [Real Python - Python Sockets Tutorial](https://realpython.com/python-sockets/)

### Advanced Frameworks

- **Twisted**: Mature event-driven network framework
- **asyncio**: Python built-in asynchronous IO framework
- **aiohttp**: HTTP client/server based on asyncio
- **uvloop**: High-performance event loop implementation
