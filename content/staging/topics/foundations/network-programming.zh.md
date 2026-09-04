---
title: C++ 网络编程
description: 深入理解 C++ 网络编程：Socket 基础、TCP/UDP、I/O 多路复用、异步 I/O 与 Boost.Asio
track: foundations
section: networking
difficulty: advanced
tags:
  - C++
  - 网络编程
  - Socket
  - TCP
  - UDP
  - epoll
  - Boost.Asio
status: imported
origin: old/src/content/docs/cpp/network-programming.zh.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: 系统编程
  order: 15
  lastUpdated: 2026-01-07
---

网络编程是现代软件开发中不可或缺的技能。C++ 作为系统级编程语言，提供了强大的网络编程能力，从底层的 Socket API 到高级的异步 I/O 库，让开发者能够构建高性能的网络应用程序。

## 概念解释

### 什么是网络编程

网络编程是指编写能够通过计算机网络进行数据交换的程序。它涉及到网络协议栈、套接字编程、数据序列化、并发处理等多个方面。

### 历史背景

- **1983年**：BSD Socket API 诞生，成为网络编程的事实标准
- **1990年代**：Windows Sockets (Winsock) API 出现
- **2003年**：Boost.Asio 开始开发，提供跨平台异步 I/O
- **2011年**：C++11 引入标准线程库，为网络编程提供并发支持
- **2017年**：Networking TS 提案，计划将网络库纳入 C++ 标准（尚未完成）

### 解决的问题

- 进程间通信（IPC）
- 分布式系统通信
- 客户端-服务器架构实现
- 实时数据传输
- 高并发连接处理

## 核心原理

### OSI 七层模型与 TCP/IP 模型

```
OSI 七层模型          TCP/IP 四层模型        C++ 关注层
┌─────────────┐      ┌─────────────┐
│   应用层    │      │             │       应用程序逻辑
├─────────────┤      │   应用层    │       HTTP, FTP, DNS
│   表示层    │      │             │
├─────────────┤      ├─────────────┤
│   会话层    │      │             │       Socket API
├─────────────┤      │   传输层    │       TCP, UDP
│   传输层    │      │             │
├─────────────┤      ├─────────────┤
│   网络层    │      │  网络互联层  │       IP 地址处理
├─────────────┤      ├─────────────┤
│  数据链路层  │      │             │       操作系统内核
├─────────────┤      │ 网络接口层   │
│   物理层    │      │             │
└─────────────┘      └─────────────┘
```

### Socket 工作原理

Socket（套接字）是网络通信的端点，它提供了一种双向通信机制。

```
服务器端流程:                          客户端流程:
┌─────────────┐                      ┌─────────────┐
│   socket()  │                      │   socket()  │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       ▼                                    │
┌─────────────┐                            │
│    bind()   │                            │
└──────┬──────┘                            │
       │                                    │
       ▼                                    │
┌─────────────┐                            │
│   listen()  │                            │
└──────┬──────┘                            │
       │                                    │
       ▼                                    ▼
┌─────────────┐        连接请求      ┌─────────────┐
│   accept()  │◄─────────────────────│  connect()  │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       ▼                                    ▼
┌─────────────┐       数据交换       ┌─────────────┐
│ recv/send() │◄────────────────────►│ recv/send() │
└──────┬──────┘                      └──────┬──────┘
       │                                    │
       ▼                                    ▼
┌─────────────┐                      ┌─────────────┐
│   close()   │                      │   close()   │
└─────────────┘                      └─────────────┘
```

### I/O 多路复用机制

I/O 多路复用允许单个线程同时监控多个文件描述符，是实现高并发服务器的关键技术。

```
                    ┌─────────────┐
                    │   select    │  最早的多路复用，跨平台
                    │  O(n) 扫描  │  最大 1024 个 fd
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    poll     │  无 fd 数量限制
                    │  O(n) 扫描  │  仍需遍历所有 fd
                    └─────────────┘
                           │
                           ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    epoll    │    │    kqueue   │    │    IOCP     │
│   (Linux)   │    │   (BSD)     │    │  (Windows)  │
│   O(1)      │    │    O(1)     │    │    O(1)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 核心要点

### Socket 类型

| 类型 | 宏定义 | 协议 | 特点 |
|------|--------|------|------|
| 流式套接字 | SOCK_STREAM | TCP | 可靠、有序、面向连接 |
| 数据报套接字 | SOCK_DGRAM | UDP | 不可靠、无连接、低开销 |
| 原始套接字 | SOCK_RAW | IP | 直接访问网络层 |

### 常用地址结构

```cpp
// IPv4 地址结构
struct sockaddr_in {
    sa_family_t    sin_family;   // AF_INET
    in_port_t      sin_port;     // 端口号（网络字节序）
    struct in_addr sin_addr;     // IP 地址
    char           sin_zero[8];  // 填充字节
};

// IPv6 地址结构
struct sockaddr_in6 {
    sa_family_t     sin6_family;   // AF_INET6
    in_port_t       sin6_port;     // 端口号
    uint32_t        sin6_flowinfo; // 流信息
    struct in6_addr sin6_addr;     // IPv6 地址
    uint32_t        sin6_scope_id; // 作用域 ID
};

// 通用地址结构
struct sockaddr_storage {
    sa_family_t ss_family;
    // ... 足够容纳任何地址类型
};
```

### 字节序转换

```cpp
// 主机字节序 -> 网络字节序
uint16_t htons(uint16_t hostshort);  // short
uint32_t htonl(uint32_t hostlong);   // long

// 网络字节序 -> 主机字节序
uint16_t ntohs(uint16_t netshort);   // short
uint32_t ntohl(uint32_t netlong);    // long
```

## 代码示例

### TCP 服务器基础实现

```cpp
#include <iostream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

class TcpServer {
private:
    int serverFd;
    int port;
    static const int BUFFER_SIZE = 1024;
    static const int BACKLOG = 10;

public:
    explicit TcpServer(int port) : serverFd(-1), port(port) {}

    ~TcpServer() {
        if (serverFd >= 0) {
            close(serverFd);
        }
    }

    bool start() {
        // 1. 创建 socket
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) {
            std::cerr << "创建 socket 失败: " << strerror(errno) << "\n";
            return false;
        }

        // 设置 SO_REUSEADDR 选项，允许端口复用
        int opt = 1;
        if (setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
            std::cerr << "设置 socket 选项失败\n";
            return false;
        }

        // 2. 绑定地址
        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;  // 监听所有接口
        serverAddr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&serverAddr),
                 sizeof(serverAddr)) < 0) {
            std::cerr << "绑定失败: " << strerror(errno) << "\n";
            return false;
        }

        // 3. 开始监听
        if (listen(serverFd, BACKLOG) < 0) {
            std::cerr << "监听失败: " << strerror(errno) << "\n";
            return false;
        }

        std::cout << "服务器启动，监听端口 " << port << "\n";
        return true;
    }

    void run() {
        while (true) {
            sockaddr_in clientAddr{};
            socklen_t clientLen = sizeof(clientAddr);

            // 4. 接受连接
            int clientFd = accept(serverFd,
                                  reinterpret_cast<sockaddr*>(&clientAddr),
                                  &clientLen);
            if (clientFd < 0) {
                std::cerr << "接受连接失败: " << strerror(errno) << "\n";
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));
            std::cout << "客户端连接: " << clientIp << ":"
                      << ntohs(clientAddr.sin_port) << "\n";

            // 5. 处理客户端请求
            handleClient(clientFd);
        }
    }

private:
    void handleClient(int clientFd) {
        char buffer[BUFFER_SIZE];

        while (true) {
            memset(buffer, 0, sizeof(buffer));

            // 接收数据
            ssize_t bytesRead = recv(clientFd, buffer, sizeof(buffer) - 1, 0);

            if (bytesRead <= 0) {
                if (bytesRead == 0) {
                    std::cout << "客户端断开连接\n";
                } else {
                    std::cerr << "接收数据失败: " << strerror(errno) << "\n";
                }
                break;
            }

            std::cout << "收到: " << buffer;

            // 回显数据
            std::string response = "服务器回复: " + std::string(buffer);
            send(clientFd, response.c_str(), response.length(), 0);
        }

        close(clientFd);
    }
};

int main() {
    TcpServer server(8080);

    if (!server.start()) {
        return 1;
    }

    server.run();
    return 0;
}
```

### TCP 客户端实现

```cpp
#include <iostream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

class TcpClient {
private:
    int sockFd;
    std::string serverIp;
    int serverPort;
    static const int BUFFER_SIZE = 1024;

public:
    TcpClient(const std::string& ip, int port)
        : sockFd(-1), serverIp(ip), serverPort(port) {}

    ~TcpClient() {
        disconnect();
    }

    bool connect() {
        // 创建 socket
        sockFd = socket(AF_INET, SOCK_STREAM, 0);
        if (sockFd < 0) {
            std::cerr << "创建 socket 失败\n";
            return false;
        }

        // 设置服务器地址
        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_port = htons(serverPort);

        if (inet_pton(AF_INET, serverIp.c_str(), &serverAddr.sin_addr) <= 0) {
            std::cerr << "无效的地址\n";
            return false;
        }

        // 连接服务器
        if (::connect(sockFd, reinterpret_cast<sockaddr*>(&serverAddr),
                      sizeof(serverAddr)) < 0) {
            std::cerr << "连接失败: " << strerror(errno) << "\n";
            return false;
        }

        std::cout << "已连接到 " << serverIp << ":" << serverPort << "\n";
        return true;
    }

    void disconnect() {
        if (sockFd >= 0) {
            close(sockFd);
            sockFd = -1;
        }
    }

    bool sendMessage(const std::string& message) {
        if (sockFd < 0) return false;

        ssize_t bytesSent = send(sockFd, message.c_str(), message.length(), 0);
        return bytesSent > 0;
    }

    std::string receiveMessage() {
        if (sockFd < 0) return "";

        char buffer[BUFFER_SIZE];
        memset(buffer, 0, sizeof(buffer));

        ssize_t bytesRead = recv(sockFd, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) {
            return "";
        }

        return std::string(buffer);
    }
};

int main() {
    TcpClient client("127.0.0.1", 8080);

    if (!client.connect()) {
        return 1;
    }

    std::string input;
    while (std::cout << "输入消息: " && std::getline(std::cin, input)) {
        if (input == "quit") break;

        input += "\n";
        if (!client.sendMessage(input)) {
            std::cerr << "发送失败\n";
            break;
        }

        std::string response = client.receiveMessage();
        if (response.empty()) {
            std::cerr << "接收失败\n";
            break;
        }

        std::cout << response;
    }

    return 0;
}
```

### UDP 通信实现

```cpp
#include <iostream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// UDP 服务器
class UdpServer {
private:
    int sockFd;
    int port;
    static const int BUFFER_SIZE = 1024;

public:
    explicit UdpServer(int port) : sockFd(-1), port(port) {}

    ~UdpServer() {
        if (sockFd >= 0) {
            close(sockFd);
        }
    }

    bool start() {
        // 创建 UDP socket
        sockFd = socket(AF_INET, SOCK_DGRAM, 0);
        if (sockFd < 0) {
            std::cerr << "创建 socket 失败\n";
            return false;
        }

        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(sockFd, reinterpret_cast<sockaddr*>(&serverAddr),
                 sizeof(serverAddr)) < 0) {
            std::cerr << "绑定失败\n";
            return false;
        }

        std::cout << "UDP 服务器启动，端口 " << port << "\n";
        return true;
    }

    void run() {
        char buffer[BUFFER_SIZE];
        sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);

        while (true) {
            memset(buffer, 0, sizeof(buffer));

            // 接收数据报
            ssize_t bytesRead = recvfrom(sockFd, buffer, sizeof(buffer) - 1, 0,
                                         reinterpret_cast<sockaddr*>(&clientAddr),
                                         &clientLen);

            if (bytesRead < 0) {
                std::cerr << "接收失败\n";
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));

            std::cout << "收到来自 " << clientIp << ":"
                      << ntohs(clientAddr.sin_port) << " 的消息: " << buffer;

            // 回复客户端
            std::string response = "UDP 回复: " + std::string(buffer);
            sendto(sockFd, response.c_str(), response.length(), 0,
                   reinterpret_cast<sockaddr*>(&clientAddr), clientLen);
        }
    }
};

// UDP 客户端
class UdpClient {
private:
    int sockFd;
    sockaddr_in serverAddr;
    static const int BUFFER_SIZE = 1024;

public:
    UdpClient(const std::string& serverIp, int serverPort) : sockFd(-1) {
        sockFd = socket(AF_INET, SOCK_DGRAM, 0);

        serverAddr = {};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_port = htons(serverPort);
        inet_pton(AF_INET, serverIp.c_str(), &serverAddr.sin_addr);
    }

    ~UdpClient() {
        if (sockFd >= 0) {
            close(sockFd);
        }
    }

    bool sendMessage(const std::string& message) {
        ssize_t bytesSent = sendto(sockFd, message.c_str(), message.length(), 0,
                                   reinterpret_cast<sockaddr*>(&serverAddr),
                                   sizeof(serverAddr));
        return bytesSent > 0;
    }

    std::string receiveMessage() {
        char buffer[BUFFER_SIZE];
        memset(buffer, 0, sizeof(buffer));

        // 设置接收超时
        timeval tv{};
        tv.tv_sec = 5;
        tv.tv_usec = 0;
        setsockopt(sockFd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

        ssize_t bytesRead = recvfrom(sockFd, buffer, sizeof(buffer) - 1, 0,
                                     nullptr, nullptr);
        if (bytesRead < 0) {
            return "";
        }

        return std::string(buffer);
    }
};

// 示例使用
void runUdpServer() {
    UdpServer server(8081);
    if (server.start()) {
        server.run();
    }
}

void runUdpClient() {
    UdpClient client("127.0.0.1", 8081);

    std::string message = "Hello UDP!\n";
    if (client.sendMessage(message)) {
        std::cout << "已发送: " << message;
        std::string response = client.receiveMessage();
        if (!response.empty()) {
            std::cout << "收到: " << response;
        }
    }
}
```

### select 多路复用

```cpp
#include <iostream>
#include <cstring>
#include <vector>
#include <unistd.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <arpa/inet.h>

class SelectServer {
private:
    int serverFd;
    int port;
    std::vector<int> clientFds;
    static const int BUFFER_SIZE = 1024;
    static const int MAX_CLIENTS = 1024;

public:
    explicit SelectServer(int port) : serverFd(-1), port(port) {}

    ~SelectServer() {
        for (int fd : clientFds) {
            close(fd);
        }
        if (serverFd >= 0) {
            close(serverFd);
        }
    }

    bool start() {
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) return false;

        int opt = 1;
        setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
            return false;
        }

        if (listen(serverFd, 10) < 0) {
            return false;
        }

        std::cout << "Select 服务器启动，端口 " << port << "\n";
        return true;
    }

    void run() {
        fd_set readFds;
        int maxFd;
        char buffer[BUFFER_SIZE];

        while (true) {
            // 清空并设置文件描述符集合
            FD_ZERO(&readFds);
            FD_SET(serverFd, &readFds);
            maxFd = serverFd;

            // 添加所有客户端 socket
            for (int clientFd : clientFds) {
                FD_SET(clientFd, &readFds);
                if (clientFd > maxFd) {
                    maxFd = clientFd;
                }
            }

            // 设置超时
            timeval timeout{};
            timeout.tv_sec = 5;
            timeout.tv_usec = 0;

            // 等待事件
            int activity = select(maxFd + 1, &readFds, nullptr, nullptr, &timeout);

            if (activity < 0) {
                std::cerr << "select 错误\n";
                continue;
            }

            if (activity == 0) {
                // 超时，无事件
                continue;
            }

            // 检查是否有新连接
            if (FD_ISSET(serverFd, &readFds)) {
                sockaddr_in clientAddr{};
                socklen_t clientLen = sizeof(clientAddr);

                int newClient = accept(serverFd,
                                       reinterpret_cast<sockaddr*>(&clientAddr),
                                       &clientLen);

                if (newClient >= 0) {
                    if (clientFds.size() < MAX_CLIENTS) {
                        clientFds.push_back(newClient);

                        char clientIp[INET_ADDRSTRLEN];
                        inet_ntop(AF_INET, &clientAddr.sin_addr,
                                  clientIp, sizeof(clientIp));
                        std::cout << "新连接: " << clientIp << ":"
                                  << ntohs(clientAddr.sin_port)
                                  << " (fd=" << newClient << ")\n";
                    } else {
                        std::cerr << "连接数已达上限\n";
                        close(newClient);
                    }
                }
            }

            // 检查客户端数据
            for (auto it = clientFds.begin(); it != clientFds.end(); ) {
                int clientFd = *it;

                if (FD_ISSET(clientFd, &readFds)) {
                    memset(buffer, 0, sizeof(buffer));
                    ssize_t bytesRead = recv(clientFd, buffer,
                                             sizeof(buffer) - 1, 0);

                    if (bytesRead <= 0) {
                        // 客户端断开
                        std::cout << "客户端断开 (fd=" << clientFd << ")\n";
                        close(clientFd);
                        it = clientFds.erase(it);
                        continue;
                    }

                    std::cout << "fd=" << clientFd << " 发送: " << buffer;

                    // 回显
                    std::string response = "回复: " + std::string(buffer);
                    send(clientFd, response.c_str(), response.length(), 0);
                }

                ++it;
            }
        }
    }
};

int main() {
    SelectServer server(8080);
    if (server.start()) {
        server.run();
    }
    return 0;
}
```

### poll 多路复用

```cpp
#include <iostream>
#include <cstring>
#include <vector>
#include <unistd.h>
#include <sys/socket.h>
#include <poll.h>
#include <netinet/in.h>
#include <arpa/inet.h>

class PollServer {
private:
    int serverFd;
    int port;
    std::vector<pollfd> pollFds;
    static const int BUFFER_SIZE = 1024;

public:
    explicit PollServer(int port) : serverFd(-1), port(port) {}

    ~PollServer() {
        for (auto& pfd : pollFds) {
            if (pfd.fd >= 0) {
                close(pfd.fd);
            }
        }
    }

    bool start() {
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) return false;

        int opt = 1;
        setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
            return false;
        }

        if (listen(serverFd, 10) < 0) {
            return false;
        }

        // 添加服务器 socket 到 poll 集合
        pollfd serverPfd{};
        serverPfd.fd = serverFd;
        serverPfd.events = POLLIN;
        pollFds.push_back(serverPfd);

        std::cout << "Poll 服务器启动，端口 " << port << "\n";
        return true;
    }

    void run() {
        char buffer[BUFFER_SIZE];

        while (true) {
            // 等待事件，超时 5 秒
            int activity = poll(pollFds.data(), pollFds.size(), 5000);

            if (activity < 0) {
                std::cerr << "poll 错误\n";
                continue;
            }

            if (activity == 0) {
                // 超时
                continue;
            }

            // 处理服务器 socket（新连接）
            if (pollFds[0].revents & POLLIN) {
                sockaddr_in clientAddr{};
                socklen_t clientLen = sizeof(clientAddr);

                int newClient = accept(serverFd,
                                       reinterpret_cast<sockaddr*>(&clientAddr),
                                       &clientLen);

                if (newClient >= 0) {
                    pollfd clientPfd{};
                    clientPfd.fd = newClient;
                    clientPfd.events = POLLIN;
                    pollFds.push_back(clientPfd);

                    char clientIp[INET_ADDRSTRLEN];
                    inet_ntop(AF_INET, &clientAddr.sin_addr,
                              clientIp, sizeof(clientIp));
                    std::cout << "新连接: " << clientIp
                              << " (fd=" << newClient << ")\n";
                }
            }

            // 处理客户端 socket
            for (size_t i = 1; i < pollFds.size(); ) {
                if (pollFds[i].revents & POLLIN) {
                    int clientFd = pollFds[i].fd;

                    memset(buffer, 0, sizeof(buffer));
                    ssize_t bytesRead = recv(clientFd, buffer,
                                             sizeof(buffer) - 1, 0);

                    if (bytesRead <= 0) {
                        std::cout << "客户端断开 (fd=" << clientFd << ")\n";
                        close(clientFd);
                        pollFds.erase(pollFds.begin() + i);
                        continue;
                    }

                    std::cout << "fd=" << clientFd << " 发送: " << buffer;

                    std::string response = "回复: " + std::string(buffer);
                    send(clientFd, response.c_str(), response.length(), 0);
                }

                // 处理错误
                if (pollFds[i].revents & (POLLERR | POLLHUP | POLLNVAL)) {
                    std::cout << "客户端错误 (fd=" << pollFds[i].fd << ")\n";
                    close(pollFds[i].fd);
                    pollFds.erase(pollFds.begin() + i);
                    continue;
                }

                ++i;
            }
        }
    }
};

int main() {
    PollServer server(8080);
    if (server.start()) {
        server.run();
    }
    return 0;
}
```

### epoll 高性能服务器 (Linux)

```cpp
#include <iostream>
#include <cstring>
#include <unistd.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <arpa/inet.h>

class EpollServer {
private:
    int serverFd;
    int epollFd;
    int port;
    static const int MAX_EVENTS = 1024;
    static const int BUFFER_SIZE = 1024;

public:
    explicit EpollServer(int port) : serverFd(-1), epollFd(-1), port(port) {}

    ~EpollServer() {
        if (epollFd >= 0) close(epollFd);
        if (serverFd >= 0) close(serverFd);
    }

    // 设置非阻塞模式
    static bool setNonBlocking(int fd) {
        int flags = fcntl(fd, F_GETFL, 0);
        if (flags < 0) return false;
        return fcntl(fd, F_SETFL, flags | O_NONBLOCK) >= 0;
    }

    bool start() {
        // 创建服务器 socket
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) {
            std::cerr << "创建 socket 失败\n";
            return false;
        }

        // 设置选项
        int opt = 1;
        setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
        setNonBlocking(serverFd);

        // 绑定地址
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
            std::cerr << "绑定失败\n";
            return false;
        }

        if (listen(serverFd, SOMAXCONN) < 0) {
            std::cerr << "监听失败\n";
            return false;
        }

        // 创建 epoll 实例
        epollFd = epoll_create1(EPOLL_CLOEXEC);
        if (epollFd < 0) {
            std::cerr << "创建 epoll 失败\n";
            return false;
        }

        // 添加服务器 socket 到 epoll
        epoll_event ev{};
        ev.events = EPOLLIN | EPOLLET;  // 边缘触发模式
        ev.data.fd = serverFd;

        if (epoll_ctl(epollFd, EPOLL_CTL_ADD, serverFd, &ev) < 0) {
            std::cerr << "epoll_ctl 失败\n";
            return false;
        }

        std::cout << "Epoll 服务器启动，端口 " << port << "\n";
        return true;
    }

    void run() {
        epoll_event events[MAX_EVENTS];
        char buffer[BUFFER_SIZE];

        while (true) {
            int numEvents = epoll_wait(epollFd, events, MAX_EVENTS, -1);

            if (numEvents < 0) {
                if (errno == EINTR) continue;
                std::cerr << "epoll_wait 错误\n";
                break;
            }

            for (int i = 0; i < numEvents; ++i) {
                int fd = events[i].data.fd;

                // 处理错误
                if (events[i].events & (EPOLLERR | EPOLLHUP)) {
                    std::cerr << "socket 错误 (fd=" << fd << ")\n";
                    close(fd);
                    continue;
                }

                // 新连接
                if (fd == serverFd) {
                    handleNewConnection();
                    continue;
                }

                // 可读事件
                if (events[i].events & EPOLLIN) {
                    handleClientData(fd, buffer);
                }
            }
        }
    }

private:
    void handleNewConnection() {
        while (true) {
            sockaddr_in clientAddr{};
            socklen_t clientLen = sizeof(clientAddr);

            int clientFd = accept(serverFd,
                                  reinterpret_cast<sockaddr*>(&clientAddr),
                                  &clientLen);

            if (clientFd < 0) {
                if (errno == EAGAIN || errno == EWOULDBLOCK) {
                    // 所有连接已处理完毕
                    break;
                }
                std::cerr << "accept 失败\n";
                break;
            }

            setNonBlocking(clientFd);

            // 添加到 epoll
            epoll_event ev{};
            ev.events = EPOLLIN | EPOLLET;
            ev.data.fd = clientFd;

            if (epoll_ctl(epollFd, EPOLL_CTL_ADD, clientFd, &ev) < 0) {
                std::cerr << "epoll_ctl 添加客户端失败\n";
                close(clientFd);
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));
            std::cout << "新连接: " << clientIp << ":"
                      << ntohs(clientAddr.sin_port)
                      << " (fd=" << clientFd << ")\n";
        }
    }

    void handleClientData(int clientFd, char* buffer) {
        while (true) {
            memset(buffer, 0, BUFFER_SIZE);
            ssize_t bytesRead = recv(clientFd, buffer, BUFFER_SIZE - 1, 0);

            if (bytesRead < 0) {
                if (errno == EAGAIN || errno == EWOULDBLOCK) {
                    // 数据读取完毕
                    break;
                }
                std::cerr << "recv 错误\n";
                close(clientFd);
                break;
            }

            if (bytesRead == 0) {
                // 客户端关闭连接
                std::cout << "客户端断开 (fd=" << clientFd << ")\n";
                close(clientFd);
                break;
            }

            std::cout << "fd=" << clientFd << " 发送: " << buffer;

            // 回复
            std::string response = "回复: " + std::string(buffer);
            send(clientFd, response.c_str(), response.length(), 0);
        }
    }
};

int main() {
    EpollServer server(8080);
    if (server.start()) {
        server.run();
    }
    return 0;
}
```

### Boost.Asio 异步网络编程

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <boost/asio.hpp>

using boost::asio::ip::tcp;

// 异步会话类
class Session : public std::enable_shared_from_this<Session> {
private:
    tcp::socket socket_;
    std::array<char, 1024> buffer_;

public:
    explicit Session(tcp::socket socket)
        : socket_(std::move(socket)) {}

    void start() {
        doRead();
    }

private:
    void doRead() {
        auto self = shared_from_this();

        socket_.async_read_some(
            boost::asio::buffer(buffer_),
            [this, self](boost::system::error_code ec, std::size_t length) {
                if (!ec) {
                    std::cout << "收到: "
                              << std::string(buffer_.data(), length);

                    // 异步写入
                    doWrite(length);
                } else {
                    std::cout << "客户端断开连接\n";
                }
            });
    }

    void doWrite(std::size_t length) {
        auto self = shared_from_this();

        std::string response = "Asio 回复: " +
                               std::string(buffer_.data(), length);

        boost::asio::async_write(
            socket_,
            boost::asio::buffer(response),
            [this, self](boost::system::error_code ec, std::size_t /*length*/) {
                if (!ec) {
                    // 继续读取
                    doRead();
                }
            });
    }
};

// 异步服务器类
class AsioServer {
private:
    boost::asio::io_context& ioContext_;
    tcp::acceptor acceptor_;

public:
    AsioServer(boost::asio::io_context& ioContext, short port)
        : ioContext_(ioContext),
          acceptor_(ioContext, tcp::endpoint(tcp::v4(), port)) {
        std::cout << "Asio 服务器启动，端口 " << port << "\n";
        doAccept();
    }

private:
    void doAccept() {
        acceptor_.async_accept(
            [this](boost::system::error_code ec, tcp::socket socket) {
                if (!ec) {
                    std::cout << "新连接: "
                              << socket.remote_endpoint().address().to_string()
                              << ":" << socket.remote_endpoint().port() << "\n";

                    std::make_shared<Session>(std::move(socket))->start();
                }

                // 继续接受下一个连接
                doAccept();
            });
    }
};

// 异步客户端
class AsioClient {
private:
    boost::asio::io_context& ioContext_;
    tcp::socket socket_;
    std::array<char, 1024> buffer_;

public:
    AsioClient(boost::asio::io_context& ioContext,
               const std::string& host, const std::string& port)
        : ioContext_(ioContext), socket_(ioContext) {

        tcp::resolver resolver(ioContext);
        auto endpoints = resolver.resolve(host, port);

        boost::asio::async_connect(
            socket_, endpoints,
            [this](boost::system::error_code ec, const tcp::endpoint& /*endpoint*/) {
                if (!ec) {
                    std::cout << "已连接到服务器\n";
                    doWrite("Hello from Asio client!\n");
                } else {
                    std::cerr << "连接失败: " << ec.message() << "\n";
                }
            });
    }

    void doWrite(const std::string& message) {
        boost::asio::async_write(
            socket_,
            boost::asio::buffer(message),
            [this](boost::system::error_code ec, std::size_t /*length*/) {
                if (!ec) {
                    doRead();
                }
            });
    }

private:
    void doRead() {
        socket_.async_read_some(
            boost::asio::buffer(buffer_),
            [this](boost::system::error_code ec, std::size_t length) {
                if (!ec) {
                    std::cout << "收到回复: "
                              << std::string(buffer_.data(), length);
                }
            });
    }
};

// 服务器主函数
void runServer() {
    try {
        boost::asio::io_context ioContext;
        AsioServer server(ioContext, 8080);
        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "异常: " << e.what() << "\n";
    }
}

// 客户端主函数
void runClient() {
    try {
        boost::asio::io_context ioContext;
        AsioClient client(ioContext, "127.0.0.1", "8080");
        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "异常: " << e.what() << "\n";
    }
}
```

### Boost.Asio 协程风格 (C++20)

```cpp
#include <iostream>
#include <boost/asio.hpp>
#include <boost/asio/co_spawn.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/use_awaitable.hpp>

using boost::asio::ip::tcp;
using boost::asio::awaitable;
using boost::asio::co_spawn;
using boost::asio::detached;
using boost::asio::use_awaitable;

// 协程风格的会话处理
awaitable<void> session(tcp::socket socket) {
    try {
        std::array<char, 1024> buffer;

        for (;;) {
            std::size_t n = co_await socket.async_read_some(
                boost::asio::buffer(buffer), use_awaitable);

            std::cout << "收到: " << std::string(buffer.data(), n);

            std::string response = "协程回复: " +
                                   std::string(buffer.data(), n);

            co_await boost::asio::async_write(
                socket, boost::asio::buffer(response), use_awaitable);
        }
    } catch (std::exception& e) {
        std::cout << "会话异常: " << e.what() << "\n";
    }
}

// 协程风格的监听器
awaitable<void> listener(tcp::acceptor acceptor) {
    for (;;) {
        tcp::socket socket = co_await acceptor.async_accept(use_awaitable);

        std::cout << "新连接: "
                  << socket.remote_endpoint().address().to_string()
                  << ":" << socket.remote_endpoint().port() << "\n";

        co_spawn(acceptor.get_executor(),
                 session(std::move(socket)),
                 detached);
    }
}

int main() {
    try {
        boost::asio::io_context ioContext;

        tcp::acceptor acceptor(ioContext, {tcp::v4(), 8080});
        std::cout << "协程服务器启动，端口 8080\n";

        co_spawn(ioContext, listener(std::move(acceptor)), detached);

        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "异常: " << e.what() << "\n";
    }

    return 0;
}
```

### HTTP 服务器简单实现

```cpp
#include <iostream>
#include <sstream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>

class SimpleHttpServer {
private:
    int serverFd;
    int port;
    static const int BUFFER_SIZE = 4096;

public:
    explicit SimpleHttpServer(int port) : serverFd(-1), port(port) {}

    ~SimpleHttpServer() {
        if (serverFd >= 0) close(serverFd);
    }

    bool start() {
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) return false;

        int opt = 1;
        setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
            return false;
        }

        if (listen(serverFd, 10) < 0) {
            return false;
        }

        std::cout << "HTTP 服务器启动: http://localhost:" << port << "/\n";
        return true;
    }

    void run() {
        while (true) {
            sockaddr_in clientAddr{};
            socklen_t clientLen = sizeof(clientAddr);

            int clientFd = accept(serverFd,
                                  reinterpret_cast<sockaddr*>(&clientAddr),
                                  &clientLen);

            if (clientFd < 0) continue;

            handleRequest(clientFd);
            close(clientFd);
        }
    }

private:
    void handleRequest(int clientFd) {
        char buffer[BUFFER_SIZE];
        memset(buffer, 0, sizeof(buffer));

        ssize_t bytesRead = recv(clientFd, buffer, sizeof(buffer) - 1, 0);
        if (bytesRead <= 0) return;

        std::string request(buffer);
        std::cout << "收到请求:\n" << request.substr(0, 200) << "\n";

        // 解析请求行
        std::istringstream requestStream(request);
        std::string method, path, version;
        requestStream >> method >> path >> version;

        // 构造响应
        std::string responseBody;
        std::string contentType = "text/html; charset=utf-8";
        int statusCode = 200;
        std::string statusText = "OK";

        if (path == "/") {
            responseBody = R"(
<!DOCTYPE html>
<html>
<head>
    <title>C++ HTTP Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Welcome to C++ HTTP Server!</h1>
    <p>This is a simple HTTP server written in C++.</p>
    <ul>
        <li><a href="/api/time">Current Time API</a></li>
        <li><a href="/api/status">Server Status API</a></li>
    </ul>
</body>
</html>
)";
        } else if (path == "/api/time") {
            contentType = "application/json";
            time_t now = time(nullptr);
            responseBody = "{\"time\": \"" + std::string(ctime(&now)) + "\"}";
            // 移除换行符
            responseBody.erase(responseBody.find_last_of("\"") - 1, 1);
        } else if (path == "/api/status") {
            contentType = "application/json";
            responseBody = R"({"status": "running", "server": "C++ HTTP Server"})";
        } else {
            statusCode = 404;
            statusText = "Not Found";
            responseBody = "<h1>404 Not Found</h1>";
        }

        // 构造 HTTP 响应
        std::ostringstream response;
        response << "HTTP/1.1 " << statusCode << " " << statusText << "\r\n";
        response << "Content-Type: " << contentType << "\r\n";
        response << "Content-Length: " << responseBody.length() << "\r\n";
        response << "Connection: close\r\n";
        response << "\r\n";
        response << responseBody;

        std::string responseStr = response.str();
        send(clientFd, responseStr.c_str(), responseStr.length(), 0);
    }
};

int main() {
    SimpleHttpServer server(8080);
    if (server.start()) {
        server.run();
    }
    return 0;
}
```

## 最佳实践

### 错误处理规范

```cpp
#include <iostream>
#include <system_error>
#include <cerrno>
#include <cstring>

// 封装 socket 错误处理
class SocketError : public std::system_error {
public:
    explicit SocketError(const std::string& operation)
        : std::system_error(errno, std::system_category(),
                            operation + " 失败") {}
};

// 安全的 socket 操作封装
class SafeSocket {
private:
    int fd;

public:
    SafeSocket() : fd(-1) {}

    ~SafeSocket() {
        if (fd >= 0) {
            close(fd);
        }
    }

    // 禁止拷贝
    SafeSocket(const SafeSocket&) = delete;
    SafeSocket& operator=(const SafeSocket&) = delete;

    // 允许移动
    SafeSocket(SafeSocket&& other) noexcept : fd(other.fd) {
        other.fd = -1;
    }

    SafeSocket& operator=(SafeSocket&& other) noexcept {
        if (this != &other) {
            if (fd >= 0) close(fd);
            fd = other.fd;
            other.fd = -1;
        }
        return *this;
    }

    void create(int domain, int type, int protocol) {
        fd = socket(domain, type, protocol);
        if (fd < 0) {
            throw SocketError("socket()");
        }
    }

    void bind(const sockaddr* addr, socklen_t addrlen) {
        if (::bind(fd, addr, addrlen) < 0) {
            throw SocketError("bind()");
        }
    }

    void listen(int backlog) {
        if (::listen(fd, backlog) < 0) {
            throw SocketError("listen()");
        }
    }

    int accept(sockaddr* addr, socklen_t* addrlen) {
        int clientFd = ::accept(fd, addr, addrlen);
        if (clientFd < 0) {
            throw SocketError("accept()");
        }
        return clientFd;
    }

    int get() const { return fd; }

    void setOption(int level, int optname, const void* optval, socklen_t optlen) {
        if (setsockopt(fd, level, optname, optval, optlen) < 0) {
            throw SocketError("setsockopt()");
        }
    }
};

// 使用示例
void safeServerExample() {
    try {
        SafeSocket server;
        server.create(AF_INET, SOCK_STREAM, 0);

        int opt = 1;
        server.setOption(SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(8080);

        server.bind(reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
        server.listen(10);

        std::cout << "服务器安全启动\n";

    } catch (const SocketError& e) {
        std::cerr << "Socket 错误: " << e.what() << "\n";
    }
}
```

### 连接超时处理

```cpp
#include <iostream>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <poll.h>
#include <unistd.h>

// 带超时的连接
bool connectWithTimeout(int sockfd, const sockaddr* addr,
                        socklen_t addrlen, int timeoutMs) {
    // 设置非阻塞
    int flags = fcntl(sockfd, F_GETFL, 0);
    fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);

    int result = connect(sockfd, addr, addrlen);

    if (result < 0) {
        if (errno != EINPROGRESS) {
            fcntl(sockfd, F_SETFL, flags);  // 恢复阻塞模式
            return false;
        }

        // 等待连接完成
        pollfd pfd{};
        pfd.fd = sockfd;
        pfd.events = POLLOUT;

        result = poll(&pfd, 1, timeoutMs);

        if (result <= 0) {
            fcntl(sockfd, F_SETFL, flags);
            return false;  // 超时或错误
        }

        // 检查连接是否成功
        int error = 0;
        socklen_t len = sizeof(error);
        if (getsockopt(sockfd, SOL_SOCKET, SO_ERROR, &error, &len) < 0 ||
            error != 0) {
            fcntl(sockfd, F_SETFL, flags);
            return false;
        }
    }

    // 恢复阻塞模式
    fcntl(sockfd, F_SETFL, flags);
    return true;
}

// 带超时的接收
ssize_t recvWithTimeout(int sockfd, void* buf, size_t len, int timeoutMs) {
    pollfd pfd{};
    pfd.fd = sockfd;
    pfd.events = POLLIN;

    int result = poll(&pfd, 1, timeoutMs);

    if (result <= 0) {
        return result;  // 超时返回 0，错误返回 -1
    }

    return recv(sockfd, buf, len, 0);
}
```

### 优雅关闭连接

```cpp
#include <sys/socket.h>
#include <unistd.h>

// 优雅关闭连接
void gracefulShutdown(int sockfd) {
    // 关闭写端，发送 FIN
    shutdown(sockfd, SHUT_WR);

    // 继续读取直到对方关闭
    char buffer[1024];
    while (recv(sockfd, buffer, sizeof(buffer), 0) > 0) {
        // 丢弃数据
    }

    // 关闭 socket
    close(sockfd);
}

// 带超时的优雅关闭
void gracefulShutdownWithTimeout(int sockfd, int timeoutMs) {
    shutdown(sockfd, SHUT_WR);

    // 设置接收超时
    timeval tv{};
    tv.tv_sec = timeoutMs / 1000;
    tv.tv_usec = (timeoutMs % 1000) * 1000;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    char buffer[1024];
    while (recv(sockfd, buffer, sizeof(buffer), 0) > 0) {
        // 丢弃数据
    }

    close(sockfd);
}
```

### 心跳机制实现

```cpp
#include <iostream>
#include <thread>
#include <atomic>
#include <chrono>
#include <sys/socket.h>
#include <netinet/tcp.h>

class HeartbeatConnection {
private:
    int sockfd;
    std::atomic<bool> running;
    std::thread heartbeatThread;
    std::chrono::seconds interval;

public:
    HeartbeatConnection(int fd, int intervalSec)
        : sockfd(fd), running(true), interval(intervalSec) {}

    ~HeartbeatConnection() {
        stop();
    }

    // 启用 TCP keepalive
    void enableTcpKeepalive(int idleTime, int interval, int count) {
        int opt = 1;
        setsockopt(sockfd, SOL_SOCKET, SO_KEEPALIVE, &opt, sizeof(opt));

        // Linux 特定选项
        #ifdef __linux__
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPIDLE, &idleTime, sizeof(idleTime));
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPINTVL, &interval, sizeof(interval));
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPCNT, &count, sizeof(count));
        #endif
    }

    // 应用层心跳
    void startHeartbeat() {
        heartbeatThread = std::thread([this]() {
            while (running) {
                std::this_thread::sleep_for(interval);

                if (!running) break;

                // 发送心跳包
                const char* heartbeat = "PING";
                if (send(sockfd, heartbeat, 4, MSG_NOSIGNAL) < 0) {
                    std::cerr << "心跳发送失败，连接可能已断开\n";
                    break;
                }

                std::cout << "心跳已发送\n";
            }
        });
    }

    void stop() {
        running = false;
        if (heartbeatThread.joinable()) {
            heartbeatThread.join();
        }
    }
};
```

## 常见陷阱

### 忘记处理部分发送/接收

```cpp
// 错误：假设一次 send 能发送所有数据
void badSend(int sockfd, const char* data, size_t len) {
    send(sockfd, data, len, 0);  // 可能只发送部分数据！
}

// 正确：循环发送直到完成
ssize_t sendAll(int sockfd, const char* data, size_t len) {
    size_t totalSent = 0;

    while (totalSent < len) {
        ssize_t sent = send(sockfd, data + totalSent, len - totalSent, 0);

        if (sent < 0) {
            if (errno == EINTR) continue;  // 被信号中断，重试
            return -1;  // 发生错误
        }

        if (sent == 0) {
            break;  // 连接关闭
        }

        totalSent += sent;
    }

    return totalSent;
}

// 正确：循环接收直到完成
ssize_t recvAll(int sockfd, char* buffer, size_t len) {
    size_t totalReceived = 0;

    while (totalReceived < len) {
        ssize_t received = recv(sockfd, buffer + totalReceived,
                                len - totalReceived, 0);

        if (received < 0) {
            if (errno == EINTR) continue;
            return -1;
        }

        if (received == 0) {
            break;  // 连接关闭
        }

        totalReceived += received;
    }

    return totalReceived;
}
```

### 字节序问题

```cpp
// 错误：直接发送主机字节序的整数
void badSendInt(int sockfd, int value) {
    send(sockfd, &value, sizeof(value), 0);  // 字节序可能不正确！
}

// 正确：转换为网络字节序
void goodSendInt(int sockfd, int32_t value) {
    int32_t networkValue = htonl(value);
    send(sockfd, &networkValue, sizeof(networkValue), 0);
}

// 正确：接收时转换回主机字节序
int32_t receiveInt(int sockfd) {
    int32_t networkValue;
    recv(sockfd, &networkValue, sizeof(networkValue), 0);
    return ntohl(networkValue);
}
```

### 忘记关闭 socket

```cpp
// 错误：异常情况下忘记关闭 socket
void badFunction(int port) {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (someCondition) {
        return;  // socket 泄漏！
    }

    // ... 使用 socket ...

    close(sockfd);
}

// 正确：使用 RAII 管理 socket
class SocketGuard {
private:
    int fd;

public:
    explicit SocketGuard(int fd) : fd(fd) {}
    ~SocketGuard() { if (fd >= 0) close(fd); }

    SocketGuard(const SocketGuard&) = delete;
    SocketGuard& operator=(const SocketGuard&) = delete;

    int get() const { return fd; }
    int release() { int tmp = fd; fd = -1; return tmp; }
};

void goodFunction(int port) {
    SocketGuard guard(socket(AF_INET, SOCK_STREAM, 0));

    if (someCondition) {
        return;  // 析构函数自动关闭 socket
    }

    // ... 使用 socket ...
}
```

### 信号处理问题

```cpp
#include <signal.h>

// 全局标志，用于优雅退出
volatile sig_atomic_t shouldExit = 0;

void signalHandler(int sig) {
    shouldExit = 1;
}

void setupSignalHandling() {
    struct sigaction sa{};
    sa.sa_handler = signalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;

    sigaction(SIGINT, &sa, nullptr);
    sigaction(SIGTERM, &sa, nullptr);

    // 忽略 SIGPIPE（写入已关闭的 socket 时产生）
    signal(SIGPIPE, SIG_IGN);
}

// 使用 MSG_NOSIGNAL 代替忽略 SIGPIPE
void safeSend(int sockfd, const char* data, size_t len) {
    send(sockfd, data, len, MSG_NOSIGNAL);
}
```

### 边缘触发模式下的陷阱

```cpp
// 错误：边缘触发模式下只读一次
void badEpollHandler(int fd) {
    char buffer[1024];
    recv(fd, buffer, sizeof(buffer), 0);  // 可能丢失数据！
}

// 正确：边缘触发模式下读取所有数据
void goodEpollHandler(int fd) {
    char buffer[1024];

    while (true) {
        ssize_t bytesRead = recv(fd, buffer, sizeof(buffer), 0);

        if (bytesRead < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                // 数据已全部读取
                break;
            }
            // 处理错误
            break;
        }

        if (bytesRead == 0) {
            // 连接关闭
            break;
        }

        // 处理数据
        processData(buffer, bytesRead);
    }
}
```

## 性能考量

### I/O 模型对比

| 模型 | 并发能力 | CPU 效率 | 内存占用 | 适用场景 |
|------|----------|----------|----------|----------|
| 阻塞 I/O + 多线程 | 中 | 低 | 高 | 简单应用 |
| select | 低 (1024) | 低 | 中 | 兼容性要求高 |
| poll | 中 | 中 | 中 | 跨平台应用 |
| epoll | 高 | 高 | 低 | Linux 高并发 |
| io_uring | 极高 | 极高 | 低 | Linux 5.1+ |

### 性能优化技巧

```cpp
#include <sys/socket.h>
#include <netinet/tcp.h>

// 1. 禁用 Nagle 算法（对延迟敏感的应用）
void disableNagle(int sockfd) {
    int flag = 1;
    setsockopt(sockfd, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));
}

// 2. 调整缓冲区大小
void adjustBufferSize(int sockfd, int sendSize, int recvSize) {
    setsockopt(sockfd, SOL_SOCKET, SO_SNDBUF, &sendSize, sizeof(sendSize));
    setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, &recvSize, sizeof(recvSize));
}

// 3. 启用 TCP 快速打开
void enableFastOpen(int serverFd) {
    #ifdef TCP_FASTOPEN
    int qlen = 5;
    setsockopt(serverFd, IPPROTO_TCP, TCP_FASTOPEN, &qlen, sizeof(qlen));
    #endif
}

// 4. 使用 writev/readv 进行向量 I/O
#include <sys/uio.h>

void scatterGatherIO(int sockfd) {
    char header[100];
    char body[1000];

    iovec iov[2];
    iov[0].iov_base = header;
    iov[0].iov_len = sizeof(header);
    iov[1].iov_base = body;
    iov[1].iov_len = sizeof(body);

    // 一次系统调用发送多个缓冲区
    writev(sockfd, iov, 2);
}

// 5. 使用 sendfile 进行零拷贝文件传输
#include <sys/sendfile.h>

void zerocopySendFile(int sockfd, int filefd, size_t fileSize) {
    off_t offset = 0;
    sendfile(sockfd, filefd, &offset, fileSize);
}
```

### 连接池实现

```cpp
#include <queue>
#include <mutex>
#include <condition_variable>
#include <memory>

class ConnectionPool {
private:
    std::queue<int> connections;
    std::mutex mtx;
    std::condition_variable cv;
    std::string host;
    int port;
    size_t maxSize;
    size_t currentSize;

public:
    ConnectionPool(const std::string& host, int port, size_t maxSize)
        : host(host), port(port), maxSize(maxSize), currentSize(0) {}

    ~ConnectionPool() {
        while (!connections.empty()) {
            close(connections.front());
            connections.pop();
        }
    }

    int acquire() {
        std::unique_lock<std::mutex> lock(mtx);

        // 等待可用连接或允许创建新连接
        cv.wait(lock, [this]() {
            return !connections.empty() || currentSize < maxSize;
        });

        if (!connections.empty()) {
            int conn = connections.front();
            connections.pop();
            return conn;
        }

        // 创建新连接
        int conn = createConnection();
        if (conn >= 0) {
            ++currentSize;
        }
        return conn;
    }

    void release(int conn) {
        if (conn < 0) return;

        // 检查连接是否有效
        if (!isConnectionAlive(conn)) {
            close(conn);
            std::lock_guard<std::mutex> lock(mtx);
            --currentSize;
            cv.notify_one();
            return;
        }

        {
            std::lock_guard<std::mutex> lock(mtx);
            connections.push(conn);
        }
        cv.notify_one();
    }

private:
    int createConnection() {
        int sockfd = socket(AF_INET, SOCK_STREAM, 0);
        if (sockfd < 0) return -1;

        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_port = htons(port);
        inet_pton(AF_INET, host.c_str(), &addr.sin_addr);

        if (connect(sockfd, reinterpret_cast<sockaddr*>(&addr),
                    sizeof(addr)) < 0) {
            close(sockfd);
            return -1;
        }

        return sockfd;
    }

    bool isConnectionAlive(int conn) {
        char buf;
        int result = recv(conn, &buf, 1, MSG_PEEK | MSG_DONTWAIT);
        if (result == 0) return false;  // 连接已关闭
        if (result < 0 && errno != EAGAIN && errno != EWOULDBLOCK) {
            return false;  // 连接错误
        }
        return true;
    }
};
```

## 实战场景

### 场景一：高并发聊天服务器

```cpp
#include <iostream>
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <mutex>
#include <sys/epoll.h>

class ChatServer {
private:
    int serverFd;
    int epollFd;
    std::unordered_map<int, std::string> clientNames;  // fd -> 用户名
    std::unordered_map<std::string, std::unordered_set<int>> rooms;  // 房间 -> 用户集合
    std::mutex mtx;

public:
    void broadcast(const std::string& room, const std::string& message,
                   int excludeFd = -1) {
        std::lock_guard<std::mutex> lock(mtx);

        auto it = rooms.find(room);
        if (it == rooms.end()) return;

        for (int fd : it->second) {
            if (fd != excludeFd) {
                send(fd, message.c_str(), message.length(), MSG_NOSIGNAL);
            }
        }
    }

    void joinRoom(int fd, const std::string& room, const std::string& name) {
        {
            std::lock_guard<std::mutex> lock(mtx);
            clientNames[fd] = name;
            rooms[room].insert(fd);
        }

        std::string msg = name + " 加入了房间 " + room + "\n";
        broadcast(room, msg, fd);
    }

    void leaveRoom(int fd) {
        std::string name;
        std::string room;

        {
            std::lock_guard<std::mutex> lock(mtx);

            auto nameIt = clientNames.find(fd);
            if (nameIt == clientNames.end()) return;
            name = nameIt->second;
            clientNames.erase(nameIt);

            for (auto& [r, members] : rooms) {
                if (members.erase(fd) > 0) {
                    room = r;
                    break;
                }
            }
        }

        if (!room.empty()) {
            std::string msg = name + " 离开了房间\n";
            broadcast(room, msg);
        }
    }

    void handleMessage(int fd, const std::string& message) {
        std::string name;
        std::string room;

        {
            std::lock_guard<std::mutex> lock(mtx);

            auto nameIt = clientNames.find(fd);
            if (nameIt == clientNames.end()) return;
            name = nameIt->second;

            for (const auto& [r, members] : rooms) {
                if (members.count(fd) > 0) {
                    room = r;
                    break;
                }
            }
        }

        if (!room.empty()) {
            std::string msg = "[" + name + "]: " + message;
            broadcast(room, msg);
        }
    }
};
```

### 场景二：文件传输服务

```cpp
#include <iostream>
#include <fstream>
#include <sys/stat.h>
#include <sys/sendfile.h>

class FileTransferServer {
public:
    // 发送文件（带进度）
    bool sendFile(int sockfd, const std::string& filepath,
                  std::function<void(size_t, size_t)> progressCallback) {
        // 打开文件
        int filefd = open(filepath.c_str(), O_RDONLY);
        if (filefd < 0) return false;

        // 获取文件大小
        struct stat statbuf;
        fstat(filefd, &statbuf);
        size_t fileSize = statbuf.st_size;

        // 发送文件大小
        uint64_t netSize = htobe64(fileSize);
        send(sockfd, &netSize, sizeof(netSize), 0);

        // 发送文件名
        std::string filename = filepath.substr(filepath.find_last_of("/") + 1);
        uint32_t nameLen = htonl(filename.length());
        send(sockfd, &nameLen, sizeof(nameLen), 0);
        send(sockfd, filename.c_str(), filename.length(), 0);

        // 使用 sendfile 零拷贝传输
        off_t offset = 0;
        size_t remaining = fileSize;
        const size_t chunkSize = 1024 * 1024;  // 1MB chunks

        while (remaining > 0) {
            size_t toSend = std::min(remaining, chunkSize);
            ssize_t sent = sendfile(sockfd, filefd, &offset, toSend);

            if (sent < 0) {
                close(filefd);
                return false;
            }

            remaining -= sent;

            if (progressCallback) {
                progressCallback(fileSize - remaining, fileSize);
            }
        }

        close(filefd);
        return true;
    }

    // 接收文件
    bool receiveFile(int sockfd, const std::string& savePath,
                     std::function<void(size_t, size_t)> progressCallback) {
        // 接收文件大小
        uint64_t netSize;
        recv(sockfd, &netSize, sizeof(netSize), MSG_WAITALL);
        size_t fileSize = be64toh(netSize);

        // 接收文件名
        uint32_t nameLen;
        recv(sockfd, &nameLen, sizeof(nameLen), MSG_WAITALL);
        nameLen = ntohl(nameLen);

        std::string filename(nameLen, '\0');
        recv(sockfd, &filename[0], nameLen, MSG_WAITALL);

        // 创建文件
        std::string fullPath = savePath + "/" + filename;
        std::ofstream file(fullPath, std::ios::binary);
        if (!file) return false;

        // 接收文件内容
        size_t received = 0;
        const size_t bufferSize = 64 * 1024;  // 64KB buffer
        std::vector<char> buffer(bufferSize);

        while (received < fileSize) {
            size_t toReceive = std::min(bufferSize, fileSize - received);
            ssize_t n = recv(sockfd, buffer.data(), toReceive, 0);

            if (n <= 0) {
                file.close();
                return false;
            }

            file.write(buffer.data(), n);
            received += n;

            if (progressCallback) {
                progressCallback(received, fileSize);
            }
        }

        file.close();
        return true;
    }
};
```

### 场景三：负载均衡器

```cpp
#include <iostream>
#include <vector>
#include <atomic>

class LoadBalancer {
private:
    struct Backend {
        std::string host;
        int port;
        std::atomic<int> activeConnections{0};
        std::atomic<bool> healthy{true};
    };

    std::vector<Backend> backends;
    std::atomic<size_t> roundRobinIndex{0};

public:
    void addBackend(const std::string& host, int port) {
        backends.push_back({host, port});
    }

    // 轮询策略
    Backend* roundRobin() {
        size_t size = backends.size();
        if (size == 0) return nullptr;

        for (size_t i = 0; i < size; ++i) {
            size_t idx = (roundRobinIndex.fetch_add(1)) % size;
            if (backends[idx].healthy) {
                return &backends[idx];
            }
        }
        return nullptr;
    }

    // 最少连接策略
    Backend* leastConnections() {
        Backend* selected = nullptr;
        int minConns = INT_MAX;

        for (auto& backend : backends) {
            if (backend.healthy && backend.activeConnections < minConns) {
                minConns = backend.activeConnections;
                selected = &backend;
            }
        }

        return selected;
    }

    // 代理连接
    void proxyConnection(int clientFd) {
        Backend* backend = leastConnections();
        if (!backend) {
            const char* error = "HTTP/1.1 503 Service Unavailable\r\n\r\n";
            send(clientFd, error, strlen(error), 0);
            return;
        }

        ++backend->activeConnections;

        // 连接到后端
        int backendFd = socket(AF_INET, SOCK_STREAM, 0);
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_port = htons(backend->port);
        inet_pton(AF_INET, backend->host.c_str(), &addr.sin_addr);

        if (connect(backendFd, reinterpret_cast<sockaddr*>(&addr),
                    sizeof(addr)) < 0) {
            backend->healthy = false;
            --backend->activeConnections;
            close(backendFd);
            return;
        }

        // 双向转发数据
        forwardData(clientFd, backendFd);

        --backend->activeConnections;
        close(backendFd);
    }

private:
    void forwardData(int fd1, int fd2) {
        fd_set readFds;
        char buffer[4096];
        int maxFd = std::max(fd1, fd2) + 1;

        while (true) {
            FD_ZERO(&readFds);
            FD_SET(fd1, &readFds);
            FD_SET(fd2, &readFds);

            if (select(maxFd, &readFds, nullptr, nullptr, nullptr) < 0) {
                break;
            }

            if (FD_ISSET(fd1, &readFds)) {
                ssize_t n = recv(fd1, buffer, sizeof(buffer), 0);
                if (n <= 0) break;
                send(fd2, buffer, n, 0);
            }

            if (FD_ISSET(fd2, &readFds)) {
                ssize_t n = recv(fd2, buffer, sizeof(buffer), 0);
                if (n <= 0) break;
                send(fd1, buffer, n, 0);
            }
        }
    }
};
```

## 面试要点

### select、poll、epoll 的区别是什么？

**答案**：

| 特性 | select | poll | epoll |
|------|--------|------|-------|
| 最大连接数 | 1024 (FD_SETSIZE) | 无限制 | 无限制 |
| 实现方式 | 位图 | 链表 | 红黑树 + 链表 |
| 时间复杂度 | O(n) | O(n) | O(1) |
| 内核态/用户态拷贝 | 每次都拷贝 | 每次都拷贝 | 只拷贝有事件的 |
| 触发方式 | 水平触发 | 水平触发 | 水平/边缘触发 |
| 跨平台 | 是 | 是 | 仅 Linux |

### TCP 三次握手和四次挥手过程？

**答案**：

三次握手：
1. 客户端发送 SYN，进入 SYN_SENT 状态
2. 服务器收到后发送 SYN+ACK，进入 SYN_RCVD 状态
3. 客户端发送 ACK，双方进入 ESTABLISHED 状态

四次挥手：
1. 主动方发送 FIN，进入 FIN_WAIT_1 状态
2. 被动方发送 ACK，进入 CLOSE_WAIT 状态；主动方进入 FIN_WAIT_2
3. 被动方发送 FIN，进入 LAST_ACK 状态
4. 主动方发送 ACK，进入 TIME_WAIT 状态；被动方收到后关闭

### TIME_WAIT 状态的作用是什么？

**答案**：
- 确保最后一个 ACK 能够到达，防止连接提前关闭
- 等待网络中残留的数据包消失，防止影响新连接
- 持续时间为 2 * MSL（Maximum Segment Lifetime，通常 60 秒）

### 如何解决 C10K 问题？

**答案**：
- 使用非阻塞 I/O 配合 I/O 多路复用（epoll/kqueue）
- 使用事件驱动架构
- 使用异步 I/O（io_uring）
- 优化系统参数（文件描述符限制、TCP 参数等）
- 使用连接池减少建立连接的开销
- 考虑使用协程减少线程切换开销

### TCP 粘包问题如何解决？

**答案**：
- 固定长度消息
- 消息头 + 消息体（头部包含长度信息）
- 特殊分隔符
- 消息结构中包含长度字段

```cpp
// 示例：消息头 + 消息体
struct MessageHeader {
    uint32_t length;  // 消息体长度
    uint32_t type;    // 消息类型
};

// 发送消息
void sendMessage(int sockfd, uint32_t type, const std::string& body) {
    MessageHeader header;
    header.length = htonl(body.length());
    header.type = htonl(type);

    send(sockfd, &header, sizeof(header), 0);
    send(sockfd, body.c_str(), body.length(), 0);
}
```

### epoll 的 ET 和 LT 模式有什么区别？

**答案**：
- **LT（水平触发）**：只要 fd 对应的缓冲区有数据，就会一直触发通知
- **ET（边缘触发）**：只有 fd 对应的缓冲区状态发生变化时才触发通知

ET 模式效率更高，但必须注意：
- 必须使用非阻塞 I/O
- 必须循环读取/写入直到返回 EAGAIN

## 延伸阅读

### 官方文档与标准
- [POSIX Socket API](https://pubs.opengroup.org/onlinepubs/9699919799/)
- [Boost.Asio Documentation](https://www.boost.org/doc/libs/release/doc/html/boost_asio.html)
- [Linux epoll man page](https://man7.org/linux/man-pages/man7/epoll.7.html)

### 经典书籍
- 《UNIX 网络编程》- W. Richard Stevens
- 《TCP/IP 详解》- W. Richard Stevens
- 《Linux 高性能服务器编程》- 游双
- 《C++ 网络编程》- Douglas Schmidt

### 优质开源项目
- [libevent](https://libevent.org/) - 事件通知库
- [libev](http://software.schmorp.de/pkg/libev.html) - 轻量级事件循环库
- [libuv](https://libuv.org/) - Node.js 底层 I/O 库
- [muduo](https://github.com/chenshuo/muduo) - 陈硕的 C++ 网络库

### 学习资源
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [The C10K Problem](http://www.kegel.com/c10k.html)
- [Asio C++ Library Tutorial](https://think-async.com/Asio/)
