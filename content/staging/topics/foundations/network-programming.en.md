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
origin: old/src/content/docs/cpp/network-programming.en.md
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

Network programming is an essential skill in modern software development. As a system-level programming language, C++ provides powerful network programming capabilities, from low-level Socket APIs to high-level asynchronous I/O libraries, enabling developers to build high-performance network applications.

## Concept Explanation

### What is Network Programming

Network programming refers to writing programs that can exchange data over computer networks. It involves network protocol stacks, socket programming, data serialization, concurrent processing, and many other aspects.

### Historical Background

- **1983**: BSD Socket API was born, becoming the de facto standard for network programming
- **1990s**: Windows Sockets (Winsock) API appeared
- **2003**: Boost.Asio began development, providing cross-platform asynchronous I/O
- **2011**: C++11 introduced the standard thread library, providing concurrency support for network programming
- **2017**: Networking TS proposal, planning to incorporate networking library into C++ standard (not yet completed)

### Problems Solved

- Inter-process communication (IPC)
- Distributed system communication
- Client-server architecture implementation
- Real-time data transmission
- High-concurrency connection handling

## Core Principles

### OSI Seven-Layer Model and TCP/IP Model

```
OSI Seven-Layer Model    TCP/IP Four-Layer Model    C++ Focus Layer
┌─────────────┐         ┌─────────────┐
│ Application │         │             │            Application logic
├─────────────┤         │ Application │            HTTP, FTP, DNS
│ Presentation│         │             │
├─────────────┤         ├─────────────┤
│   Session   │         │             │            Socket API
├─────────────┤         │  Transport  │            TCP, UDP
│  Transport  │         │             │
├─────────────┤         ├─────────────┤
│   Network   │         │   Internet  │            IP address handling
├─────────────┤         ├─────────────┤
│  Data Link  │         │             │            Operating system kernel
├─────────────┤         │Network      │
│   Physical  │         │Interface    │
└─────────────┘         └─────────────┘
```

### How Sockets Work

A Socket is an endpoint for network communication, providing a bidirectional communication mechanism.

```
Server-side flow:                        Client-side flow:
┌─────────────┐                         ┌─────────────┐
│   socket()  │                         │   socket()  │
└──────┬──────┘                         └──────┬──────┘
       │                                       │
       ▼                                       │
┌─────────────┐                               │
│    bind()   │                               │
└──────┬──────┘                               │
       │                                       │
       ▼                                       │
┌─────────────┐                               │
│   listen()  │                               │
└──────┬──────┘                               │
       │                                       │
       ▼                                       ▼
┌─────────────┐      Connection request ┌─────────────┐
│   accept()  │◄────────────────────────│  connect()  │
└──────┬──────┘                         └──────┬──────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐       Data exchange     ┌─────────────┐
│ recv/send() │◄───────────────────────►│ recv/send() │
└──────┬──────┘                         └──────┬──────┘
       │                                       │
       ▼                                       ▼
┌─────────────┐                         ┌─────────────┐
│   close()   │                         │   close()   │
└─────────────┘                         └─────────────┘
```

### I/O Multiplexing Mechanism

I/O multiplexing allows a single thread to monitor multiple file descriptors simultaneously, which is a key technology for implementing high-concurrency servers.

```
                    ┌─────────────┐
                    │   select    │  Earliest multiplexing, cross-platform
                    │  O(n) scan  │  Max 1024 fds
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    poll     │  No fd count limit
                    │  O(n) scan  │  Still needs to traverse all fds
                    └─────────────┘
                           │
                           ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    epoll    │    │    kqueue   │    │    IOCP     │
│   (Linux)   │    │   (BSD)     │    │  (Windows)  │
│   O(1)      │    │    O(1)     │    │    O(1)     │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Key Points

### Socket Types

| Type | Macro Definition | Protocol | Characteristics |
|------|------------------|----------|-----------------|
| Stream Socket | SOCK_STREAM | TCP | Reliable, ordered, connection-oriented |
| Datagram Socket | SOCK_DGRAM | UDP | Unreliable, connectionless, low overhead |
| Raw Socket | SOCK_RAW | IP | Direct access to network layer |

### Common Address Structures

```cpp
// IPv4 address structure
struct sockaddr_in {
    sa_family_t    sin_family;   // AF_INET
    in_port_t      sin_port;     // Port number (network byte order)
    struct in_addr sin_addr;     // IP address
    char           sin_zero[8];  // Padding bytes
};

// IPv6 address structure
struct sockaddr_in6 {
    sa_family_t     sin6_family;   // AF_INET6
    in_port_t       sin6_port;     // Port number
    uint32_t        sin6_flowinfo; // Flow information
    struct in6_addr sin6_addr;     // IPv6 address
    uint32_t        sin6_scope_id; // Scope ID
};

// Generic address structure
struct sockaddr_storage {
    sa_family_t ss_family;
    // ... large enough to hold any address type
};
```

### Byte Order Conversion

```cpp
// Host byte order -> Network byte order
uint16_t htons(uint16_t hostshort);  // short
uint32_t htonl(uint32_t hostlong);   // long

// Network byte order -> Host byte order
uint16_t ntohs(uint16_t netshort);   // short
uint32_t ntohl(uint32_t netlong);    // long
```

## Code Examples

### Basic TCP Server Implementation

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
        // 1. Create socket
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) {
            std::cerr << "Failed to create socket: " << strerror(errno) << "\n";
            return false;
        }

        // Set SO_REUSEADDR option to allow port reuse
        int opt = 1;
        if (setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
            std::cerr << "Failed to set socket options\n";
            return false;
        }

        // 2. Bind address
        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;  // Listen on all interfaces
        serverAddr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&serverAddr),
                 sizeof(serverAddr)) < 0) {
            std::cerr << "Bind failed: " << strerror(errno) << "\n";
            return false;
        }

        // 3. Start listening
        if (listen(serverFd, BACKLOG) < 0) {
            std::cerr << "Listen failed: " << strerror(errno) << "\n";
            return false;
        }

        std::cout << "Server started, listening on port " << port << "\n";
        return true;
    }

    void run() {
        while (true) {
            sockaddr_in clientAddr{};
            socklen_t clientLen = sizeof(clientAddr);

            // 4. Accept connection
            int clientFd = accept(serverFd,
                                  reinterpret_cast<sockaddr*>(&clientAddr),
                                  &clientLen);
            if (clientFd < 0) {
                std::cerr << "Failed to accept connection: " << strerror(errno) << "\n";
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));
            std::cout << "Client connected: " << clientIp << ":"
                      << ntohs(clientAddr.sin_port) << "\n";

            // 5. Handle client request
            handleClient(clientFd);
        }
    }

private:
    void handleClient(int clientFd) {
        char buffer[BUFFER_SIZE];

        while (true) {
            memset(buffer, 0, sizeof(buffer));

            // Receive data
            ssize_t bytesRead = recv(clientFd, buffer, sizeof(buffer) - 1, 0);

            if (bytesRead <= 0) {
                if (bytesRead == 0) {
                    std::cout << "Client disconnected\n";
                } else {
                    std::cerr << "Failed to receive data: " << strerror(errno) << "\n";
                }
                break;
            }

            std::cout << "Received: " << buffer;

            // Echo data
            std::string response = "Server reply: " + std::string(buffer);
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

### TCP Client Implementation

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
        // Create socket
        sockFd = socket(AF_INET, SOCK_STREAM, 0);
        if (sockFd < 0) {
            std::cerr << "Failed to create socket\n";
            return false;
        }

        // Set server address
        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_port = htons(serverPort);

        if (inet_pton(AF_INET, serverIp.c_str(), &serverAddr.sin_addr) <= 0) {
            std::cerr << "Invalid address\n";
            return false;
        }

        // Connect to server
        if (::connect(sockFd, reinterpret_cast<sockaddr*>(&serverAddr),
                      sizeof(serverAddr)) < 0) {
            std::cerr << "Connection failed: " << strerror(errno) << "\n";
            return false;
        }

        std::cout << "Connected to " << serverIp << ":" << serverPort << "\n";
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
    while (std::cout << "Enter message: " && std::getline(std::cin, input)) {
        if (input == "quit") break;

        input += "\n";
        if (!client.sendMessage(input)) {
            std::cerr << "Send failed\n";
            break;
        }

        std::string response = client.receiveMessage();
        if (response.empty()) {
            std::cerr << "Receive failed\n";
            break;
        }

        std::cout << response;
    }

    return 0;
}
```

### UDP Communication Implementation

```cpp
#include <iostream>
#include <cstring>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

// UDP Server
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
        // Create UDP socket
        sockFd = socket(AF_INET, SOCK_DGRAM, 0);
        if (sockFd < 0) {
            std::cerr << "Failed to create socket\n";
            return false;
        }

        sockaddr_in serverAddr{};
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(sockFd, reinterpret_cast<sockaddr*>(&serverAddr),
                 sizeof(serverAddr)) < 0) {
            std::cerr << "Bind failed\n";
            return false;
        }

        std::cout << "UDP server started on port " << port << "\n";
        return true;
    }

    void run() {
        char buffer[BUFFER_SIZE];
        sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);

        while (true) {
            memset(buffer, 0, sizeof(buffer));

            // Receive datagram
            ssize_t bytesRead = recvfrom(sockFd, buffer, sizeof(buffer) - 1, 0,
                                         reinterpret_cast<sockaddr*>(&clientAddr),
                                         &clientLen);

            if (bytesRead < 0) {
                std::cerr << "Receive failed\n";
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));

            std::cout << "Received from " << clientIp << ":"
                      << ntohs(clientAddr.sin_port) << " message: " << buffer;

            // Reply to client
            std::string response = "UDP reply: " + std::string(buffer);
            sendto(sockFd, response.c_str(), response.length(), 0,
                   reinterpret_cast<sockaddr*>(&clientAddr), clientLen);
        }
    }
};

// UDP Client
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

        // Set receive timeout
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

// Example usage
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
        std::cout << "Sent: " << message;
        std::string response = client.receiveMessage();
        if (!response.empty()) {
            std::cout << "Received: " << response;
        }
    }
}
```

### select Multiplexing

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

        std::cout << "Select server started on port " << port << "\n";
        return true;
    }

    void run() {
        fd_set readFds;
        int maxFd;
        char buffer[BUFFER_SIZE];

        while (true) {
            // Clear and set file descriptor set
            FD_ZERO(&readFds);
            FD_SET(serverFd, &readFds);
            maxFd = serverFd;

            // Add all client sockets
            for (int clientFd : clientFds) {
                FD_SET(clientFd, &readFds);
                if (clientFd > maxFd) {
                    maxFd = clientFd;
                }
            }

            // Set timeout
            timeval timeout{};
            timeout.tv_sec = 5;
            timeout.tv_usec = 0;

            // Wait for events
            int activity = select(maxFd + 1, &readFds, nullptr, nullptr, &timeout);

            if (activity < 0) {
                std::cerr << "select error\n";
                continue;
            }

            if (activity == 0) {
                // Timeout, no events
                continue;
            }

            // Check for new connections
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
                        std::cout << "New connection: " << clientIp << ":"
                                  << ntohs(clientAddr.sin_port)
                                  << " (fd=" << newClient << ")\n";
                    } else {
                        std::cerr << "Max connections reached\n";
                        close(newClient);
                    }
                }
            }

            // Check client data
            for (auto it = clientFds.begin(); it != clientFds.end(); ) {
                int clientFd = *it;

                if (FD_ISSET(clientFd, &readFds)) {
                    memset(buffer, 0, sizeof(buffer));
                    ssize_t bytesRead = recv(clientFd, buffer,
                                             sizeof(buffer) - 1, 0);

                    if (bytesRead <= 0) {
                        // Client disconnected
                        std::cout << "Client disconnected (fd=" << clientFd << ")\n";
                        close(clientFd);
                        it = clientFds.erase(it);
                        continue;
                    }

                    std::cout << "fd=" << clientFd << " sent: " << buffer;

                    // Echo
                    std::string response = "Reply: " + std::string(buffer);
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

### poll Multiplexing

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

        // Add server socket to poll set
        pollfd serverPfd{};
        serverPfd.fd = serverFd;
        serverPfd.events = POLLIN;
        pollFds.push_back(serverPfd);

        std::cout << "Poll server started on port " << port << "\n";
        return true;
    }

    void run() {
        char buffer[BUFFER_SIZE];

        while (true) {
            // Wait for events, timeout 5 seconds
            int activity = poll(pollFds.data(), pollFds.size(), 5000);

            if (activity < 0) {
                std::cerr << "poll error\n";
                continue;
            }

            if (activity == 0) {
                // Timeout
                continue;
            }

            // Handle server socket (new connections)
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
                    std::cout << "New connection: " << clientIp
                              << " (fd=" << newClient << ")\n";
                }
            }

            // Handle client sockets
            for (size_t i = 1; i < pollFds.size(); ) {
                if (pollFds[i].revents & POLLIN) {
                    int clientFd = pollFds[i].fd;

                    memset(buffer, 0, sizeof(buffer));
                    ssize_t bytesRead = recv(clientFd, buffer,
                                             sizeof(buffer) - 1, 0);

                    if (bytesRead <= 0) {
                        std::cout << "Client disconnected (fd=" << clientFd << ")\n";
                        close(clientFd);
                        pollFds.erase(pollFds.begin() + i);
                        continue;
                    }

                    std::cout << "fd=" << clientFd << " sent: " << buffer;

                    std::string response = "Reply: " + std::string(buffer);
                    send(clientFd, response.c_str(), response.length(), 0);
                }

                // Handle errors
                if (pollFds[i].revents & (POLLERR | POLLHUP | POLLNVAL)) {
                    std::cout << "Client error (fd=" << pollFds[i].fd << ")\n";
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

### epoll High-Performance Server (Linux)

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

    // Set non-blocking mode
    static bool setNonBlocking(int fd) {
        int flags = fcntl(fd, F_GETFL, 0);
        if (flags < 0) return false;
        return fcntl(fd, F_SETFL, flags | O_NONBLOCK) >= 0;
    }

    bool start() {
        // Create server socket
        serverFd = socket(AF_INET, SOCK_STREAM, 0);
        if (serverFd < 0) {
            std::cerr << "Failed to create socket\n";
            return false;
        }

        // Set options
        int opt = 1;
        setsockopt(serverFd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
        setNonBlocking(serverFd);

        // Bind address
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = INADDR_ANY;
        addr.sin_port = htons(port);

        if (bind(serverFd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0) {
            std::cerr << "Bind failed\n";
            return false;
        }

        if (listen(serverFd, SOMAXCONN) < 0) {
            std::cerr << "Listen failed\n";
            return false;
        }

        // Create epoll instance
        epollFd = epoll_create1(EPOLL_CLOEXEC);
        if (epollFd < 0) {
            std::cerr << "Failed to create epoll\n";
            return false;
        }

        // Add server socket to epoll
        epoll_event ev{};
        ev.events = EPOLLIN | EPOLLET;  // Edge-triggered mode
        ev.data.fd = serverFd;

        if (epoll_ctl(epollFd, EPOLL_CTL_ADD, serverFd, &ev) < 0) {
            std::cerr << "epoll_ctl failed\n";
            return false;
        }

        std::cout << "Epoll server started on port " << port << "\n";
        return true;
    }

    void run() {
        epoll_event events[MAX_EVENTS];
        char buffer[BUFFER_SIZE];

        while (true) {
            int numEvents = epoll_wait(epollFd, events, MAX_EVENTS, -1);

            if (numEvents < 0) {
                if (errno == EINTR) continue;
                std::cerr << "epoll_wait error\n";
                break;
            }

            for (int i = 0; i < numEvents; ++i) {
                int fd = events[i].data.fd;

                // Handle errors
                if (events[i].events & (EPOLLERR | EPOLLHUP)) {
                    std::cerr << "socket error (fd=" << fd << ")\n";
                    close(fd);
                    continue;
                }

                // New connection
                if (fd == serverFd) {
                    handleNewConnection();
                    continue;
                }

                // Readable event
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
                    // All connections processed
                    break;
                }
                std::cerr << "accept failed\n";
                break;
            }

            setNonBlocking(clientFd);

            // Add to epoll
            epoll_event ev{};
            ev.events = EPOLLIN | EPOLLET;
            ev.data.fd = clientFd;

            if (epoll_ctl(epollFd, EPOLL_CTL_ADD, clientFd, &ev) < 0) {
                std::cerr << "epoll_ctl add client failed\n";
                close(clientFd);
                continue;
            }

            char clientIp[INET_ADDRSTRLEN];
            inet_ntop(AF_INET, &clientAddr.sin_addr, clientIp, sizeof(clientIp));
            std::cout << "New connection: " << clientIp << ":"
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
                    // Data fully read
                    break;
                }
                std::cerr << "recv error\n";
                close(clientFd);
                break;
            }

            if (bytesRead == 0) {
                // Client closed connection
                std::cout << "Client disconnected (fd=" << clientFd << ")\n";
                close(clientFd);
                break;
            }

            std::cout << "fd=" << clientFd << " sent: " << buffer;

            // Reply
            std::string response = "Reply: " + std::string(buffer);
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

### Boost.Asio Asynchronous Network Programming

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <boost/asio.hpp>

using boost::asio::ip::tcp;

// Asynchronous session class
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
                    std::cout << "Received: "
                              << std::string(buffer_.data(), length);

                    // Asynchronous write
                    doWrite(length);
                } else {
                    std::cout << "Client disconnected\n";
                }
            });
    }

    void doWrite(std::size_t length) {
        auto self = shared_from_this();

        std::string response = "Asio reply: " +
                               std::string(buffer_.data(), length);

        boost::asio::async_write(
            socket_,
            boost::asio::buffer(response),
            [this, self](boost::system::error_code ec, std::size_t /*length*/) {
                if (!ec) {
                    // Continue reading
                    doRead();
                }
            });
    }
};

// Asynchronous server class
class AsioServer {
private:
    boost::asio::io_context& ioContext_;
    tcp::acceptor acceptor_;

public:
    AsioServer(boost::asio::io_context& ioContext, short port)
        : ioContext_(ioContext),
          acceptor_(ioContext, tcp::endpoint(tcp::v4(), port)) {
        std::cout << "Asio server started on port " << port << "\n";
        doAccept();
    }

private:
    void doAccept() {
        acceptor_.async_accept(
            [this](boost::system::error_code ec, tcp::socket socket) {
                if (!ec) {
                    std::cout << "New connection: "
                              << socket.remote_endpoint().address().to_string()
                              << ":" << socket.remote_endpoint().port() << "\n";

                    std::make_shared<Session>(std::move(socket))->start();
                }

                // Continue accepting next connection
                doAccept();
            });
    }
};

// Asynchronous client
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
                    std::cout << "Connected to server\n";
                    doWrite("Hello from Asio client!\n");
                } else {
                    std::cerr << "Connection failed: " << ec.message() << "\n";
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
                    std::cout << "Received reply: "
                              << std::string(buffer_.data(), length);
                }
            });
    }
};

// Server main function
void runServer() {
    try {
        boost::asio::io_context ioContext;
        AsioServer server(ioContext, 8080);
        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "Exception: " << e.what() << "\n";
    }
}

// Client main function
void runClient() {
    try {
        boost::asio::io_context ioContext;
        AsioClient client(ioContext, "127.0.0.1", "8080");
        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "Exception: " << e.what() << "\n";
    }
}
```

### Boost.Asio Coroutine Style (C++20)

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

// Coroutine-style session handling
awaitable<void> session(tcp::socket socket) {
    try {
        std::array<char, 1024> buffer;

        for (;;) {
            std::size_t n = co_await socket.async_read_some(
                boost::asio::buffer(buffer), use_awaitable);

            std::cout << "Received: " << std::string(buffer.data(), n);

            std::string response = "Coroutine reply: " +
                                   std::string(buffer.data(), n);

            co_await boost::asio::async_write(
                socket, boost::asio::buffer(response), use_awaitable);
        }
    } catch (std::exception& e) {
        std::cout << "Session exception: " << e.what() << "\n";
    }
}

// Coroutine-style listener
awaitable<void> listener(tcp::acceptor acceptor) {
    for (;;) {
        tcp::socket socket = co_await acceptor.async_accept(use_awaitable);

        std::cout << "New connection: "
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
        std::cout << "Coroutine server started on port 8080\n";

        co_spawn(ioContext, listener(std::move(acceptor)), detached);

        ioContext.run();
    } catch (std::exception& e) {
        std::cerr << "Exception: " << e.what() << "\n";
    }

    return 0;
}
```

### Simple HTTP Server Implementation

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

        std::cout << "HTTP server started: http://localhost:" << port << "/\n";
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
        std::cout << "Request received:\n" << request.substr(0, 200) << "\n";

        // Parse request line
        std::istringstream requestStream(request);
        std::string method, path, version;
        requestStream >> method >> path >> version;

        // Build response
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
            // Remove newline
            responseBody.erase(responseBody.find_last_of("\"") - 1, 1);
        } else if (path == "/api/status") {
            contentType = "application/json";
            responseBody = R"({"status": "running", "server": "C++ HTTP Server"})";
        } else {
            statusCode = 404;
            statusText = "Not Found";
            responseBody = "<h1>404 Not Found</h1>";
        }

        // Build HTTP response
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

## Best Practices

### Error Handling Standards

```cpp
#include <iostream>
#include <system_error>
#include <cerrno>
#include <cstring>

// Encapsulate socket error handling
class SocketError : public std::system_error {
public:
    explicit SocketError(const std::string& operation)
        : std::system_error(errno, std::system_category(),
                            operation + " failed") {}
};

// Safe socket operation wrapper
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

    // Disable copy
    SafeSocket(const SafeSocket&) = delete;
    SafeSocket& operator=(const SafeSocket&) = delete;

    // Allow move
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

// Usage example
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

        std::cout << "Server started safely\n";

    } catch (const SocketError& e) {
        std::cerr << "Socket error: " << e.what() << "\n";
    }
}
```

### Connection Timeout Handling

```cpp
#include <iostream>
#include <fcntl.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <poll.h>
#include <unistd.h>

// Connect with timeout
bool connectWithTimeout(int sockfd, const sockaddr* addr,
                        socklen_t addrlen, int timeoutMs) {
    // Set non-blocking
    int flags = fcntl(sockfd, F_GETFL, 0);
    fcntl(sockfd, F_SETFL, flags | O_NONBLOCK);

    int result = connect(sockfd, addr, addrlen);

    if (result < 0) {
        if (errno != EINPROGRESS) {
            fcntl(sockfd, F_SETFL, flags);  // Restore blocking mode
            return false;
        }

        // Wait for connection to complete
        pollfd pfd{};
        pfd.fd = sockfd;
        pfd.events = POLLOUT;

        result = poll(&pfd, 1, timeoutMs);

        if (result <= 0) {
            fcntl(sockfd, F_SETFL, flags);
            return false;  // Timeout or error
        }

        // Check if connection succeeded
        int error = 0;
        socklen_t len = sizeof(error);
        if (getsockopt(sockfd, SOL_SOCKET, SO_ERROR, &error, &len) < 0 ||
            error != 0) {
            fcntl(sockfd, F_SETFL, flags);
            return false;
        }
    }

    // Restore blocking mode
    fcntl(sockfd, F_SETFL, flags);
    return true;
}

// Receive with timeout
ssize_t recvWithTimeout(int sockfd, void* buf, size_t len, int timeoutMs) {
    pollfd pfd{};
    pfd.fd = sockfd;
    pfd.events = POLLIN;

    int result = poll(&pfd, 1, timeoutMs);

    if (result <= 0) {
        return result;  // Timeout returns 0, error returns -1
    }

    return recv(sockfd, buf, len, 0);
}
```

### Graceful Connection Shutdown

```cpp
#include <sys/socket.h>
#include <unistd.h>

// Graceful shutdown
void gracefulShutdown(int sockfd) {
    // Close write end, send FIN
    shutdown(sockfd, SHUT_WR);

    // Continue reading until peer closes
    char buffer[1024];
    while (recv(sockfd, buffer, sizeof(buffer), 0) > 0) {
        // Discard data
    }

    // Close socket
    close(sockfd);
}

// Graceful shutdown with timeout
void gracefulShutdownWithTimeout(int sockfd, int timeoutMs) {
    shutdown(sockfd, SHUT_WR);

    // Set receive timeout
    timeval tv{};
    tv.tv_sec = timeoutMs / 1000;
    tv.tv_usec = (timeoutMs % 1000) * 1000;
    setsockopt(sockfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));

    char buffer[1024];
    while (recv(sockfd, buffer, sizeof(buffer), 0) > 0) {
        // Discard data
    }

    close(sockfd);
}
```

### Heartbeat Mechanism Implementation

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

    // Enable TCP keepalive
    void enableTcpKeepalive(int idleTime, int interval, int count) {
        int opt = 1;
        setsockopt(sockfd, SOL_SOCKET, SO_KEEPALIVE, &opt, sizeof(opt));

        // Linux-specific options
        #ifdef __linux__
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPIDLE, &idleTime, sizeof(idleTime));
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPINTVL, &interval, sizeof(interval));
        setsockopt(sockfd, IPPROTO_TCP, TCP_KEEPCNT, &count, sizeof(count));
        #endif
    }

    // Application-layer heartbeat
    void startHeartbeat() {
        heartbeatThread = std::thread([this]() {
            while (running) {
                std::this_thread::sleep_for(interval);

                if (!running) break;

                // Send heartbeat packet
                const char* heartbeat = "PING";
                if (send(sockfd, heartbeat, 4, MSG_NOSIGNAL) < 0) {
                    std::cerr << "Heartbeat send failed, connection may be broken\n";
                    break;
                }

                std::cout << "Heartbeat sent\n";
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

## Common Pitfalls

### Forgetting to Handle Partial Send/Receive

```cpp
// Wrong: Assuming one send can send all data
void badSend(int sockfd, const char* data, size_t len) {
    send(sockfd, data, len, 0);  // May only send partial data!
}

// Correct: Loop until all data is sent
ssize_t sendAll(int sockfd, const char* data, size_t len) {
    size_t totalSent = 0;

    while (totalSent < len) {
        ssize_t sent = send(sockfd, data + totalSent, len - totalSent, 0);

        if (sent < 0) {
            if (errno == EINTR) continue;  // Interrupted by signal, retry
            return -1;  // Error occurred
        }

        if (sent == 0) {
            break;  // Connection closed
        }

        totalSent += sent;
    }

    return totalSent;
}

// Correct: Loop until all data is received
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
            break;  // Connection closed
        }

        totalReceived += received;
    }

    return totalReceived;
}
```

### Byte Order Issues

```cpp
// Wrong: Sending integers in host byte order directly
void badSendInt(int sockfd, int value) {
    send(sockfd, &value, sizeof(value), 0);  // Byte order may be incorrect!
}

// Correct: Convert to network byte order
void goodSendInt(int sockfd, int32_t value) {
    int32_t networkValue = htonl(value);
    send(sockfd, &networkValue, sizeof(networkValue), 0);
}

// Correct: Convert back to host byte order when receiving
int32_t receiveInt(int sockfd) {
    int32_t networkValue;
    recv(sockfd, &networkValue, sizeof(networkValue), 0);
    return ntohl(networkValue);
}
```

### Forgetting to Close Sockets

```cpp
// Wrong: Forgetting to close socket on exceptions
void badFunction(int port) {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (someCondition) {
        return;  // Socket leak!
    }

    // ... use socket ...

    close(sockfd);
}

// Correct: Use RAII to manage sockets
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
        return;  // Destructor automatically closes socket
    }

    // ... use socket ...
}
```

### Signal Handling Issues

```cpp
#include <signal.h>

// Global flag for graceful exit
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

    // Ignore SIGPIPE (generated when writing to closed socket)
    signal(SIGPIPE, SIG_IGN);
}

// Use MSG_NOSIGNAL instead of ignoring SIGPIPE
void safeSend(int sockfd, const char* data, size_t len) {
    send(sockfd, data, len, MSG_NOSIGNAL);
}
```

### Edge-Triggered Mode Pitfalls

```cpp
// Wrong: Only reading once in edge-triggered mode
void badEpollHandler(int fd) {
    char buffer[1024];
    recv(fd, buffer, sizeof(buffer), 0);  // May lose data!
}

// Correct: Read all data in edge-triggered mode
void goodEpollHandler(int fd) {
    char buffer[1024];

    while (true) {
        ssize_t bytesRead = recv(fd, buffer, sizeof(buffer), 0);

        if (bytesRead < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                // All data has been read
                break;
            }
            // Handle error
            break;
        }

        if (bytesRead == 0) {
            // Connection closed
            break;
        }

        // Process data
        processData(buffer, bytesRead);
    }
}
```

## Performance Considerations

### I/O Model Comparison

| Model | Concurrency | CPU Efficiency | Memory Usage | Use Case |
|-------|-------------|----------------|--------------|----------|
| Blocking I/O + Multi-threading | Medium | Low | High | Simple applications |
| select | Low (1024) | Low | Medium | High compatibility requirements |
| poll | Medium | Medium | Medium | Cross-platform applications |
| epoll | High | High | Low | Linux high-concurrency |
| io_uring | Very High | Very High | Low | Linux 5.1+ |

### Performance Optimization Tips

```cpp
#include <sys/socket.h>
#include <netinet/tcp.h>

// 1. Disable Nagle algorithm (for latency-sensitive applications)
void disableNagle(int sockfd) {
    int flag = 1;
    setsockopt(sockfd, IPPROTO_TCP, TCP_NODELAY, &flag, sizeof(flag));
}

// 2. Adjust buffer sizes
void adjustBufferSize(int sockfd, int sendSize, int recvSize) {
    setsockopt(sockfd, SOL_SOCKET, SO_SNDBUF, &sendSize, sizeof(sendSize));
    setsockopt(sockfd, SOL_SOCKET, SO_RCVBUF, &recvSize, sizeof(recvSize));
}

// 3. Enable TCP Fast Open
void enableFastOpen(int serverFd) {
    #ifdef TCP_FASTOPEN
    int qlen = 5;
    setsockopt(serverFd, IPPROTO_TCP, TCP_FASTOPEN, &qlen, sizeof(qlen));
    #endif
}

// 4. Use writev/readv for vectored I/O
#include <sys/uio.h>

void scatterGatherIO(int sockfd) {
    char header[100];
    char body[1000];

    iovec iov[2];
    iov[0].iov_base = header;
    iov[0].iov_len = sizeof(header);
    iov[1].iov_base = body;
    iov[1].iov_len = sizeof(body);

    // Send multiple buffers with one system call
    writev(sockfd, iov, 2);
}

// 5. Use sendfile for zero-copy file transfer
#include <sys/sendfile.h>

void zerocopySendFile(int sockfd, int filefd, size_t fileSize) {
    off_t offset = 0;
    sendfile(sockfd, filefd, &offset, fileSize);
}
```

### Connection Pool Implementation

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

        // Wait for available connection or permission to create new one
        cv.wait(lock, [this]() {
            return !connections.empty() || currentSize < maxSize;
        });

        if (!connections.empty()) {
            int conn = connections.front();
            connections.pop();
            return conn;
        }

        // Create new connection
        int conn = createConnection();
        if (conn >= 0) {
            ++currentSize;
        }
        return conn;
    }

    void release(int conn) {
        if (conn < 0) return;

        // Check if connection is valid
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
        if (result == 0) return false;  // Connection closed
        if (result < 0 && errno != EAGAIN && errno != EWOULDBLOCK) {
            return false;  // Connection error
        }
        return true;
    }
};
```

## Practical Scenarios

### Scenario 1: High-Concurrency Chat Server

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
    std::unordered_map<int, std::string> clientNames;  // fd -> username
    std::unordered_map<std::string, std::unordered_set<int>> rooms;  // room -> user set
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

        std::string msg = name + " joined room " + room + "\n";
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
            std::string msg = name + " left the room\n";
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

### Scenario 2: File Transfer Service

```cpp
#include <iostream>
#include <fstream>
#include <sys/stat.h>
#include <sys/sendfile.h>

class FileTransferServer {
public:
    // Send file (with progress)
    bool sendFile(int sockfd, const std::string& filepath,
                  std::function<void(size_t, size_t)> progressCallback) {
        // Open file
        int filefd = open(filepath.c_str(), O_RDONLY);
        if (filefd < 0) return false;

        // Get file size
        struct stat statbuf;
        fstat(filefd, &statbuf);
        size_t fileSize = statbuf.st_size;

        // Send file size
        uint64_t netSize = htobe64(fileSize);
        send(sockfd, &netSize, sizeof(netSize), 0);

        // Send filename
        std::string filename = filepath.substr(filepath.find_last_of("/") + 1);
        uint32_t nameLen = htonl(filename.length());
        send(sockfd, &nameLen, sizeof(nameLen), 0);
        send(sockfd, filename.c_str(), filename.length(), 0);

        // Use sendfile for zero-copy transfer
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

    // Receive file
    bool receiveFile(int sockfd, const std::string& savePath,
                     std::function<void(size_t, size_t)> progressCallback) {
        // Receive file size
        uint64_t netSize;
        recv(sockfd, &netSize, sizeof(netSize), MSG_WAITALL);
        size_t fileSize = be64toh(netSize);

        // Receive filename
        uint32_t nameLen;
        recv(sockfd, &nameLen, sizeof(nameLen), MSG_WAITALL);
        nameLen = ntohl(nameLen);

        std::string filename(nameLen, '\0');
        recv(sockfd, &filename[0], nameLen, MSG_WAITALL);

        // Create file
        std::string fullPath = savePath + "/" + filename;
        std::ofstream file(fullPath, std::ios::binary);
        if (!file) return false;

        // Receive file content
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

### Scenario 3: Load Balancer

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

    // Round-robin strategy
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

    // Least connections strategy
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

    // Proxy connection
    void proxyConnection(int clientFd) {
        Backend* backend = leastConnections();
        if (!backend) {
            const char* error = "HTTP/1.1 503 Service Unavailable\r\n\r\n";
            send(clientFd, error, strlen(error), 0);
            return;
        }

        ++backend->activeConnections;

        // Connect to backend
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

        // Bidirectional data forwarding
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

## Interview Key Points

### What are the differences between select, poll, and epoll?

**Answer**:

| Feature | select | poll | epoll |
|---------|--------|------|-------|
| Max connections | 1024 (FD_SETSIZE) | Unlimited | Unlimited |
| Implementation | Bitmap | Linked list | Red-black tree + linked list |
| Time complexity | O(n) | O(n) | O(1) |
| Kernel/User space copy | Copy every time | Copy every time | Only copy events |
| Trigger mode | Level-triggered | Level-triggered | Level/Edge-triggered |
| Cross-platform | Yes | Yes | Linux only |

### Describe the TCP three-way handshake and four-way wave?

**Answer**:

Three-way handshake:
1. Client sends SYN, enters SYN_SENT state
2. Server receives and sends SYN+ACK, enters SYN_RCVD state
3. Client sends ACK, both enter ESTABLISHED state

Four-way wave:
1. Active party sends FIN, enters FIN_WAIT_1 state
2. Passive party sends ACK, enters CLOSE_WAIT state; active party enters FIN_WAIT_2
3. Passive party sends FIN, enters LAST_ACK state
4. Active party sends ACK, enters TIME_WAIT state; passive party closes upon receipt

### What is the purpose of the TIME_WAIT state?

**Answer**:
- Ensures the last ACK can reach, preventing premature connection closure
- Waits for residual packets in the network to disappear, preventing them from affecting new connections
- Duration is 2 * MSL (Maximum Segment Lifetime, typically 60 seconds)

### How to solve the C10K problem?

**Answer**:
- Use non-blocking I/O with I/O multiplexing (epoll/kqueue)
- Use event-driven architecture
- Use asynchronous I/O (io_uring)
- Optimize system parameters (file descriptor limits, TCP parameters, etc.)
- Use connection pools to reduce connection establishment overhead
- Consider using coroutines to reduce thread switching overhead

### How to solve the TCP sticky packet problem?

**Answer**:
- Fixed-length messages
- Message header + message body (header contains length information)
- Special delimiters
- Include length field in message structure

```cpp
// Example: Message header + message body
struct MessageHeader {
    uint32_t length;  // Message body length
    uint32_t type;    // Message type
};

// Send message
void sendMessage(int sockfd, uint32_t type, const std::string& body) {
    MessageHeader header;
    header.length = htonl(body.length());
    header.type = htonl(type);

    send(sockfd, &header, sizeof(header), 0);
    send(sockfd, body.c_str(), body.length(), 0);
}
```

### What are the differences between ET and LT modes in epoll?

**Answer**:
- **LT (Level-Triggered)**: As long as there's data in the fd's buffer, notifications will keep being triggered
- **ET (Edge-Triggered)**: Notifications are only triggered when the fd's buffer state changes

ET mode is more efficient, but note:
- Must use non-blocking I/O
- Must read/write in a loop until EAGAIN is returned

## Further Reading

### Official Documentation and Standards
- [POSIX Socket API](https://pubs.opengroup.org/onlinepubs/9699919799/)
- [Boost.Asio Documentation](https://www.boost.org/doc/libs/release/doc/html/boost_asio.html)
- [Linux epoll man page](https://man7.org/linux/man-pages/man7/epoll.7.html)

### Classic Books
- "UNIX Network Programming" - W. Richard Stevens
- "TCP/IP Illustrated" - W. Richard Stevens
- "Linux High-Performance Server Programming" - You Shuang
- "C++ Network Programming" - Douglas Schmidt

### Quality Open Source Projects
- [libevent](https://libevent.org/) - Event notification library
- [libev](http://software.schmorp.de/pkg/libev.html) - Lightweight event loop library
- [libuv](https://libuv.org/) - Node.js underlying I/O library
- [muduo](https://github.com/chenshuo/muduo) - Chen Shuo's C++ network library

### Learning Resources
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/)
- [The C10K Problem](http://www.kegel.com/c10k.html)
- [Asio C++ Library Tutorial](https://think-async.com/Asio/)
