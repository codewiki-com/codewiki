---
title: Java NIO 深度剖析
description: 深入解析 Java NIO 三大核心组件 Buffer、Channel、Selector，掌握非阻塞 I/O 编程模式与高性能网络应用开发
track: java
section: collections-streams
difficulty: advanced
tags:
  - Java
  - NIO
  - Buffer
  - Channel
  - Selector
  - 非阻塞IO
  - 多路复用
status: imported
origin: old/src/content/docs/java/nio-detail.zh.md
divergence: 0.208
issues:
  - category-casing
legacy:
  category: Java
  subcategory: IO
  order: 14
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Java NIO

Java NIO（New I/O）是 Java 1.4 引入的一套全新 I/O API，提供了与传统 I/O 完全不同的编程模型。NIO 的核心特性包括：

- **面向缓冲区（Buffer-oriented）**：数据读写必须通过 Buffer，而非直接操作流
- **基于通道（Channel-based）**：Channel 是双向的数据传输通道
- **非阻塞 I/O（Non-blocking I/O）**：线程不必等待 I/O 操作完成
- **多路复用（Multiplexing）**：单线程可同时监控多个 Channel

### 历史背景

传统的 Java I/O（java.io 包）采用阻塞式、面向流的设计，这种模型在处理少量连接时足够高效，但在高并发场景下暴露出严重的可扩展性问题：

- **C10K 问题**：每个连接需要一个线程，10000 个连接需要 10000 个线程
- **线程开销巨大**：线程创建、销毁、上下文切换消耗大量 CPU 和内存
- **资源浪费**：大多数线程在等待 I/O 时处于阻塞状态

Java NIO 的诞生正是为了解决这些问题，借鉴了操作系统级别的 I/O 多路复用技术（如 Linux 的 epoll、BSD 的 kqueue），使得 Java 能够构建高性能网络服务器。

### NIO 三大核心组件

| 组件 | 职责 | 类比 |
|------|------|------|
| **Buffer** | 数据容器，所有数据读写的中转站 | 货物集装箱 |
| **Channel** | 数据传输通道，连接数据源与目标 | 运输管道 |
| **Selector** | I/O 事件多路复用器，监控多个 Channel | 交通调度中心 |

```
┌─────────────────────────────────────────────────────────────┐
│                    Java NIO 架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│   │ Channel  │     │ Channel  │     │ Channel  │            │
│   │ (Socket) │     │ (File)   │     │ (Socket) │            │
│   └────┬─────┘     └────┬─────┘     └────┬─────┘            │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│   ┌─────────────────────────────────────────────────┐       │
│   │                   Selector                       │       │
│   │        (监控多个 Channel 的 I/O 事件)            │       │
│   └─────────────────────────────────────────────────┘       │
│                          │                                   │
│                          ▼                                   │
│   ┌─────────────────────────────────────────────────┐       │
│   │                    Buffer                        │       │
│   │             (数据读写的中转站)                    │       │
│   └─────────────────────────────────────────────────┘       │
│                          │                                   │
│                          ▼                                   │
│                    [应用程序处理]                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心原理

### Buffer 工作原理

Buffer 本质上是一块可读写的内存区域，通过四个关键属性控制读写行为：

```java
// Buffer 的四个核心属性（始终满足：mark <= position <= limit <= capacity）
private int mark = -1;     // 标记位置，用于 reset() 恢复
private int position = 0;  // 当前读写位置
private int limit;         // 可读写的边界
private int capacity;      // 缓冲区总容量（不可变）
```

**Buffer 状态转换示意图：**

```
初始状态（写模式）：
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│   │   │   │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
↑                                       ↑
position=0                          limit=capacity=10

写入 "Hello" 后：
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                    ↑                   ↑
                position=5          limit=capacity=10

flip() 切换到读模式：
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
↑                   ↑
position=0      limit=5

读取 2 字节后：
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
        ↑           ↑
    position=2  limit=5
```

### 堆缓冲区 vs 直接缓冲区

**内存分配对比：**

```
堆缓冲区（HeapByteBuffer）：
┌─────────────────────────────────────────────────────┐
│                    JVM 进程                          │
│   ┌─────────────────────┐                           │
│   │      JVM 堆内存      │                           │
│   │   ┌─────────────┐   │   I/O 操作时需要          │
│   │   │ HeapBuffer  │◄──┼──► 复制到本地内存         │
│   │   └─────────────┘   │                           │
│   └─────────────────────┘                           │
└─────────────────────────────────────────────────────┘

直接缓冲区（DirectByteBuffer）：
┌─────────────────────────────────────────────────────┐
│                    JVM 进程                          │
│   ┌─────────────────────┐   ┌─────────────────────┐ │
│   │      JVM 堆内存      │   │     本地内存         │ │
│   │   ┌─────────────┐   │   │  ┌─────────────┐   │ │
│   │   │ 引用对象     │───┼───┼─►│DirectBuffer │   │ │
│   │   └─────────────┘   │   │  └─────────────┘   │ │
│   └─────────────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Channel 工作原理

Channel 与传统 I/O 流的核心区别：

| 特性 | Stream | Channel |
|------|--------|---------|
| 数据方向 | 单向（InputStream/OutputStream） | 双向 |
| 阻塞模式 | 必须阻塞 | 可配置非阻塞 |
| 数据操作 | 直接读写字节 | 必须通过 Buffer |
| 与 Selector 配合 | 不支持 | 支持 |

### Selector 多路复用原理

Selector 基于操作系统的 I/O 多路复用机制实现：

- **Linux**: epoll
- **macOS/BSD**: kqueue
- **Windows**: IOCP (通过 select 模拟)

```
Selector 事件处理流程：

    Channel1 ─┐                      ┌─► 处理 READ 事件
    Channel2 ─┼──► Selector ──►│    ├─► 处理 WRITE 事件
    Channel3 ─┤    (阻塞等待)   │    ├─► 处理 ACCEPT 事件
    Channel4 ─┘                      └─► 处理 CONNECT 事件
                    │
                    ▼
              select() 返回
              就绪的 Channel 集合
```

**SelectionKey 事件类型：**

```java
SelectionKey.OP_ACCEPT  = 16  // 服务端：接受连接就绪
SelectionKey.OP_CONNECT = 8   // 客户端：连接就绪
SelectionKey.OP_READ    = 1   // 读就绪
SelectionKey.OP_WRITE   = 4   // 写就绪
```

## 核心要点

### ByteBuffer 核心要点

1. **创建方式**
   - `allocate(int capacity)`: 堆缓冲区
   - `allocateDirect(int capacity)`: 直接缓冲区
   - `wrap(byte[] array)`: 包装现有数组

2. **关键操作**
   - `put()`: 写入数据
   - `get()`: 读取数据
   - `flip()`: 写模式切换到读模式
   - `clear()`: 清空缓冲区（准备重新写入）
   - `compact()`: 压缩缓冲区（保留未读数据）
   - `rewind()`: 重置 position 为 0（重新读取）

3. **大小端处理**
   - `order(ByteOrder.BIG_ENDIAN)`: 大端序
   - `order(ByteOrder.LITTLE_ENDIAN)`: 小端序

### FileChannel 核心要点

1. **只能通过以下方式获取**
   - `FileInputStream.getChannel()`
   - `FileOutputStream.getChannel()`
   - `RandomAccessFile.getChannel()`
   - `FileChannel.open(Path, OpenOption...)`

2. **FileChannel 不支持非阻塞模式**

3. **零拷贝方法**
   - `transferTo()`: 从当前 Channel 传输到目标 Channel
   - `transferFrom()`: 从源 Channel 传输到当前 Channel

### SocketChannel 核心要点

1. **支持非阻塞模式**
   - `configureBlocking(false)`

2. **连接操作**
   - `connect()`: 发起连接
   - `finishConnect()`: 完成连接（非阻塞模式下）
   - `isConnected()`: 检查是否已连接

3. **读写特性**
   - 非阻塞读可能返回 0（无数据可读）
   - 非阻塞写可能部分写入

### Selector 核心要点

1. **三个关键集合**
   - `keys()`: 所有注册的 SelectionKey
   - `selectedKeys()`: 就绪的 SelectionKey（需手动移除）
   - `cancelledKeys()`: 已取消的 SelectionKey（内部使用）

2. **选择操作**
   - `select()`: 阻塞直到有事件就绪
   - `select(timeout)`: 带超时的阻塞
   - `selectNow()`: 非阻塞，立即返回

3. **唤醒机制**
   - `wakeup()`: 唤醒阻塞在 select() 的线程

## 代码示例

### ByteBuffer 完整示例

```java
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

public class ByteBufferDemo {

    public static void main(String[] args) {
        // 1. 创建缓冲区
        ByteBuffer buffer = ByteBuffer.allocate(64);

        System.out.println("=== 初始状态 ===");
        printBufferState(buffer);

        // 2. 写入数据
        String message = "Hello, NIO!";
        buffer.put(message.getBytes(StandardCharsets.UTF_8));

        System.out.println("\n=== 写入后 ===");
        printBufferState(buffer);

        // 3. 切换到读模式（关键步骤）
        buffer.flip();

        System.out.println("\n=== flip()后 ===");
        printBufferState(buffer);

        // 4. 读取数据
        byte[] data = new byte[buffer.remaining()];
        buffer.get(data);
        System.out.println("读取内容: " + new String(data, StandardCharsets.UTF_8));

        System.out.println("\n=== 读取后 ===");
        printBufferState(buffer);

        // 5. 演示 compact() 操作
        buffer.clear();
        buffer.put("ABCDEFGH".getBytes());
        buffer.flip();
        buffer.get(); // 读取 'A'
        buffer.get(); // 读取 'B'

        System.out.println("\n=== 读取2字节后，compact()前 ===");
        printBufferState(buffer);

        buffer.compact(); // 将 "CDEFGH" 移到开头

        System.out.println("\n=== compact()后 ===");
        printBufferState(buffer);

        // 6. 视图缓冲区
        demonstrateViews();

        // 7. 字节序处理
        demonstrateByteOrder();
    }

    private static void printBufferState(ByteBuffer buffer) {
        System.out.printf("position=%d, limit=%d, capacity=%d, remaining=%d%n",
            buffer.position(), buffer.limit(), buffer.capacity(), buffer.remaining());
    }

    private static void demonstrateViews() {
        System.out.println("\n=== 视图缓冲区演示 ===");

        ByteBuffer buffer = ByteBuffer.allocate(16);

        // 写入4个整数
        buffer.putInt(1);
        buffer.putInt(2);
        buffer.putInt(3);
        buffer.putInt(4);
        buffer.flip();

        // 转换为 IntBuffer 视图
        java.nio.IntBuffer intView = buffer.asIntBuffer();
        System.out.println("IntBuffer 容量: " + intView.capacity());

        while (intView.hasRemaining()) {
            System.out.println("整数: " + intView.get());
        }
    }

    private static void demonstrateByteOrder() {
        System.out.println("\n=== 字节序演示 ===");

        ByteBuffer buffer = ByteBuffer.allocate(4);

        // 大端序（默认）
        buffer.order(ByteOrder.BIG_ENDIAN);
        buffer.putInt(0x12345678);
        buffer.flip();

        System.out.print("大端序字节: ");
        while (buffer.hasRemaining()) {
            System.out.printf("0x%02X ", buffer.get());
        }
        System.out.println();

        // 小端序
        buffer.clear();
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.putInt(0x12345678);
        buffer.flip();

        System.out.print("小端序字节: ");
        while (buffer.hasRemaining()) {
            System.out.printf("0x%02X ", buffer.get());
        }
        System.out.println();
    }
}
```

### FileChannel 文件操作示例

```java
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

public class FileChannelDemo {

    public static void main(String[] args) throws IOException {
        Path testFile = Paths.get("nio_test.txt");

        try {
            // 1. 基本读写
            basicReadWrite(testFile);

            // 2. 零拷贝文件复制
            zeroCopyTransfer(testFile);

            // 3. 内存映射文件
            memoryMappedFile();

            // 4. 分散/聚集 I/O
            scatterGatherIO();

            // 5. 文件锁
            fileLocking(testFile);

        } finally {
            // 清理测试文件
            Files.deleteIfExists(testFile);
            Files.deleteIfExists(Paths.get("nio_copy.txt"));
            Files.deleteIfExists(Paths.get("mapped.dat"));
            Files.deleteIfExists(Paths.get("protocol.dat"));
        }
    }

    /**
     * 基本的 FileChannel 读写操作
     */
    private static void basicReadWrite(Path path) throws IOException {
        System.out.println("=== FileChannel 基本读写 ===");

        // 写入文件
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            String content = "Java NIO FileChannel 示例\n这是第二行内容";
            ByteBuffer buffer = ByteBuffer.wrap(content.getBytes(StandardCharsets.UTF_8));

            int written = channel.write(buffer);
            System.out.println("写入字节数: " + written);

            // 强制刷新到磁盘
            channel.force(true);
        }

        // 读取文件
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocate((int) channel.size());

            int read = channel.read(buffer);
            System.out.println("读取字节数: " + read);

            buffer.flip();
            String content = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("文件内容:\n" + content);
        }
    }

    /**
     * 零拷贝文件复制
     */
    private static void zeroCopyTransfer(Path source) throws IOException {
        System.out.println("\n=== 零拷贝文件复制 ===");

        Path dest = Paths.get("nio_copy.txt");

        try (FileChannel sourceChannel = FileChannel.open(source, StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(dest,
                     StandardOpenOption.CREATE,
                     StandardOpenOption.WRITE,
                     StandardOpenOption.TRUNCATE_EXISTING)) {

            long size = sourceChannel.size();
            long transferred = 0;

            // transferTo 利用操作系统的零拷贝能力
            while (transferred < size) {
                transferred += sourceChannel.transferTo(
                    transferred, size - transferred, destChannel);
            }

            System.out.println("复制完成，共传输 " + transferred + " 字节");
        }
    }

    /**
     * 内存映射文件操作
     */
    private static void memoryMappedFile() throws IOException {
        System.out.println("\n=== 内存映射文件 ===");

        Path path = Paths.get("mapped.dat");
        long size = 1024 * 1024; // 1MB

        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "rw");
             FileChannel channel = raf.getChannel()) {

            // 创建读写映射
            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, size);

            // 直接操作映射的内存
            String data = "通过内存映射写入的数据";
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
            mappedBuffer.put(bytes);

            // 写入整数
            mappedBuffer.putInt(12345);

            // 强制写入磁盘
            mappedBuffer.force();

            // 读取验证
            mappedBuffer.flip();
            byte[] readBytes = new byte[bytes.length];
            mappedBuffer.get(readBytes);
            System.out.println("读取的字符串: " + new String(readBytes, StandardCharsets.UTF_8));
            System.out.println("读取的整数: " + mappedBuffer.getInt());
        }
    }

    /**
     * 分散/聚集 I/O（Scatter/Gather）
     */
    private static void scatterGatherIO() throws IOException {
        System.out.println("\n=== 分散/聚集 I/O ===");

        Path path = Paths.get("protocol.dat");

        // 聚集写入（Gather Write）
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            // 模拟协议格式：4字节头 + 内容 + 4字节尾
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(64);
            ByteBuffer footer = ByteBuffer.allocate(4);

            header.putInt(12345);  // 消息ID
            body.put("这是协议正文内容".getBytes(StandardCharsets.UTF_8));
            footer.putInt(99999);  // 校验码

            header.flip();
            body.flip();
            footer.flip();

            ByteBuffer[] buffers = {header, body, footer};
            long written = channel.write(buffers);
            System.out.println("聚集写入字节数: " + written);
        }

        // 分散读取（Scatter Read）
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(64);
            ByteBuffer footer = ByteBuffer.allocate(4);

            ByteBuffer[] buffers = {header, body, footer};
            long read = channel.read(buffers);
            System.out.println("分散读取字节数: " + read);

            header.flip();
            body.flip();
            footer.flip();

            System.out.println("消息ID: " + header.getInt());
            System.out.println("正文: " + StandardCharsets.UTF_8.decode(body).toString().trim());
            System.out.println("校验码: " + footer.getInt());
        }
    }

    /**
     * 文件锁操作
     */
    private static void fileLocking(Path path) throws IOException {
        System.out.println("\n=== 文件锁 ===");

        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.READ, StandardOpenOption.WRITE)) {

            // 获取独占锁（阻塞）
            java.nio.channels.FileLock lock = channel.lock();
            System.out.println("获取独占锁成功，是否共享锁: " + lock.isShared());

            // 模拟持有锁期间的操作
            Thread.sleep(100);

            // 释放锁
            lock.release();
            System.out.println("锁已释放");

            // 尝试获取锁（非阻塞）
            java.nio.channels.FileLock tryLock = channel.tryLock();
            if (tryLock != null) {
                System.out.println("tryLock 成功");
                tryLock.release();
            } else {
                System.out.println("tryLock 失败，文件已被锁定");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### SocketChannel 网络通信示例

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;

public class SocketChannelDemo {

    /**
     * 阻塞模式客户端
     */
    public static void blockingClient(String host, int port) throws IOException {
        try (SocketChannel channel = SocketChannel.open()) {
            // 默认是阻塞模式
            channel.connect(new InetSocketAddress(host, port));

            System.out.println("已连接到服务器: " + channel.getRemoteAddress());

            // 发送数据
            String message = "Hello from blocking client!";
            ByteBuffer buffer = ByteBuffer.wrap(message.getBytes(StandardCharsets.UTF_8));
            channel.write(buffer);

            // 接收响应
            buffer = ByteBuffer.allocate(1024);
            int read = channel.read(buffer);
            if (read > 0) {
                buffer.flip();
                String response = StandardCharsets.UTF_8.decode(buffer).toString();
                System.out.println("服务器响应: " + response);
            }
        }
    }

    /**
     * 非阻塞模式客户端
     */
    public static void nonBlockingClient(String host, int port) throws IOException {
        try (SocketChannel channel = SocketChannel.open()) {
            // 设置非阻塞模式
            channel.configureBlocking(false);

            // 发起非阻塞连接
            channel.connect(new InetSocketAddress(host, port));

            // 等待连接完成
            while (!channel.finishConnect()) {
                System.out.println("连接中...");
                // 可以执行其他任务
            }

            System.out.println("连接成功: " + channel.getRemoteAddress());

            // 发送数据
            ByteBuffer buffer = ByteBuffer.wrap("Hello from non-blocking client!".getBytes(StandardCharsets.UTF_8));
            while (buffer.hasRemaining()) {
                int written = channel.write(buffer);
                // 非阻塞模式下可能写入 0 字节
                if (written == 0) {
                    Thread.yield(); // 让出 CPU
                }
            }

            // 接收响应
            buffer = ByteBuffer.allocate(1024);
            int totalRead = 0;
            int retries = 0;

            while (totalRead == 0 && retries < 100) {
                int read = channel.read(buffer);
                if (read > 0) {
                    totalRead += read;
                } else if (read == 0) {
                    // 无数据可读，稍后重试
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    retries++;
                } else {
                    // read == -1，连接已关闭
                    break;
                }
            }

            if (totalRead > 0) {
                buffer.flip();
                System.out.println("服务器响应: " + StandardCharsets.UTF_8.decode(buffer).toString());
            }
        }
    }
}
```

### Selector 多路复用服务器完整示例

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * 基于 Selector 的非阻塞 Echo 服务器
 */
public class NioEchoServer {

    private static final int PORT = 8080;
    private static final int BUFFER_SIZE = 1024;

    private Selector selector;
    private ServerSocketChannel serverChannel;
    private volatile boolean running = true;

    public void start() throws IOException {
        // 1. 创建 Selector
        selector = Selector.open();

        // 2. 创建 ServerSocketChannel
        serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false); // 必须设置非阻塞

        // 3. 注册到 Selector，监听 ACCEPT 事件
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO 服务器启动，监听端口: " + PORT);

        // 4. 事件循环
        while (running) {
            try {
                // 阻塞等待事件（可设置超时）
                int readyCount = selector.select(1000);

                if (readyCount == 0) {
                    continue;
                }

                // 5. 处理就绪事件
                Set<SelectionKey> selectedKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectedKeys.iterator();

                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    iterator.remove(); // 必须手动移除

                    if (!key.isValid()) {
                        continue;
                    }

                    try {
                        if (key.isAcceptable()) {
                            handleAccept(key);
                        } else if (key.isReadable()) {
                            handleRead(key);
                        } else if (key.isWritable()) {
                            handleWrite(key);
                        }
                    } catch (IOException e) {
                        System.err.println("处理事件异常: " + e.getMessage());
                        closeChannel(key);
                    }
                }

            } catch (IOException e) {
                System.err.println("Selector 异常: " + e.getMessage());
            }
        }
    }

    /**
     * 处理新连接
     */
    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel server = (ServerSocketChannel) key.channel();
        SocketChannel client = server.accept();

        if (client == null) {
            return; // 非阻塞模式下可能返回 null
        }

        client.configureBlocking(false);

        // 为每个客户端创建独立的 Buffer
        ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);

        // 注册读事件，附加 Buffer
        client.register(selector, SelectionKey.OP_READ, buffer);

        System.out.println("新连接: " + client.getRemoteAddress());
    }

    /**
     * 处理读事件
     */
    private void handleRead(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = client.read(buffer);

        if (bytesRead == -1) {
            // 客户端关闭连接
            System.out.println("客户端断开: " + client.getRemoteAddress());
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();

            // 解析消息
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("收到消息: " + message.trim());

            // 准备响应数据
            buffer.clear();
            String response = "Echo: " + message;
            buffer.put(response.getBytes(StandardCharsets.UTF_8));
            buffer.flip();

            // 切换到写事件
            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    /**
     * 处理写事件
     */
    private void handleWrite(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        // 写入数据
        while (buffer.hasRemaining()) {
            int written = client.write(buffer);
            if (written == 0) {
                // 发送缓冲区满，等待下次写事件
                return;
            }
        }

        // 写完成，清空缓冲区，切换回读事件
        buffer.clear();
        key.interestOps(SelectionKey.OP_READ);
    }

    /**
     * 关闭通道
     */
    private void closeChannel(SelectionKey key) {
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException e) {
            System.err.println("关闭通道失败: " + e.getMessage());
        }
    }

    /**
     * 停止服务器
     */
    public void stop() {
        running = false;
        if (selector != null) {
            selector.wakeup();
        }
    }

    public static void main(String[] args) {
        NioEchoServer server = new NioEchoServer();

        // 添加关闭钩子
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("正在关闭服务器...");
            server.stop();
        }));

        try {
            server.start();
        } catch (IOException e) {
            System.err.println("服务器启动失败: " + e.getMessage());
        }
    }
}
```

### 多线程 Reactor 模式示例

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 多线程 Reactor 模式服务器
 * - Main Reactor: 负责接受连接
 * - Sub Reactors: 负责处理 I/O 事件
 */
public class MultiReactorServer {

    private static final int PORT = 8080;
    private static final int SUB_REACTOR_COUNT = Runtime.getRuntime().availableProcessors();

    private Selector mainSelector;
    private Selector[] subSelectors;
    private ExecutorService reactorPool;
    private AtomicInteger nextReactor = new AtomicInteger(0);
    private volatile boolean running = true;

    public void start() throws IOException {
        // 初始化 Main Reactor
        mainSelector = Selector.open();
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false);
        serverChannel.register(mainSelector, SelectionKey.OP_ACCEPT);

        // 初始化 Sub Reactors
        subSelectors = new Selector[SUB_REACTOR_COUNT];
        reactorPool = Executors.newFixedThreadPool(SUB_REACTOR_COUNT);

        for (int i = 0; i < SUB_REACTOR_COUNT; i++) {
            subSelectors[i] = Selector.open();
            int reactorId = i;
            reactorPool.submit(() -> runSubReactor(reactorId));
        }

        System.out.println("Multi-Reactor 服务器启动");
        System.out.println("Main Reactor: 1, Sub Reactors: " + SUB_REACTOR_COUNT);
        System.out.println("监听端口: " + PORT);

        // Main Reactor 事件循环
        runMainReactor();
    }

    /**
     * Main Reactor - 只处理连接事件
     */
    private void runMainReactor() {
        try {
            while (running) {
                mainSelector.select(1000);
                Iterator<SelectionKey> iterator = mainSelector.selectedKeys().iterator();

                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    iterator.remove();

                    if (key.isAcceptable()) {
                        handleAccept(key);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Main Reactor 异常: " + e.getMessage());
        }
    }

    /**
     * Sub Reactor - 处理 I/O 事件
     */
    private void runSubReactor(int reactorId) {
        Selector selector = subSelectors[reactorId];

        try {
            while (running) {
                selector.select(1000);
                Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();

                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    iterator.remove();

                    if (!key.isValid()) {
                        continue;
                    }

                    try {
                        if (key.isReadable()) {
                            handleRead(key, reactorId);
                        } else if (key.isWritable()) {
                            handleWrite(key, reactorId);
                        }
                    } catch (IOException e) {
                        closeChannel(key);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Sub Reactor " + reactorId + " 异常: " + e.getMessage());
        }
    }

    /**
     * 处理新连接，轮询分配到 Sub Reactor
     */
    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel server = (ServerSocketChannel) key.channel();
        SocketChannel client = server.accept();

        if (client == null) return;

        client.configureBlocking(false);

        // 轮询选择 Sub Reactor
        int reactorIndex = Math.abs(nextReactor.getAndIncrement() % SUB_REACTOR_COUNT);
        Selector subSelector = subSelectors[reactorIndex];

        // 唤醒 Sub Reactor 以便注册新通道
        subSelector.wakeup();

        // 注册到选中的 Sub Reactor
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        client.register(subSelector, SelectionKey.OP_READ, buffer);

        System.out.println("[Main] 新连接分配到 Reactor-" + reactorIndex +
                          ": " + client.getRemoteAddress());
    }

    private void handleRead(SelectionKey key, int reactorId) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = client.read(buffer);

        if (bytesRead == -1) {
            System.out.println("[Reactor-" + reactorId + "] 客户端断开");
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("[Reactor-" + reactorId + "] 收到: " + message.trim());

            buffer.clear();
            buffer.put(("Echo: " + message).getBytes(StandardCharsets.UTF_8));
            buffer.flip();

            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    private void handleWrite(SelectionKey key, int reactorId) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        client.write(buffer);

        if (!buffer.hasRemaining()) {
            buffer.clear();
            key.interestOps(SelectionKey.OP_READ);
        }
    }

    private void closeChannel(SelectionKey key) {
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException ignored) {}
    }

    public void stop() {
        running = false;
        mainSelector.wakeup();
        for (Selector selector : subSelectors) {
            selector.wakeup();
        }
        reactorPool.shutdown();
    }

    public static void main(String[] args) throws IOException {
        new MultiReactorServer().start();
    }
}
```

## 最佳实践

### Buffer 使用最佳实践

```java
public class BufferBestPractices {

    /**
     * 1. 始终在 try-finally 中使用 Buffer，确保资源释放
     */
    public void properBufferUsage() {
        ByteBuffer buffer = ByteBuffer.allocateDirect(1024);
        try {
            // 使用 buffer
        } finally {
            // 对于 DirectByteBuffer，虽然没有显式释放方法，
            // 但可以通过设置为 null 让 GC 回收
            buffer = null;
            System.gc(); // 提示 GC（不保证立即执行）
        }
    }

    /**
     * 2. 重用 Buffer 而非频繁创建
     */
    private static final ThreadLocal<ByteBuffer> BUFFER_CACHE =
        ThreadLocal.withInitial(() -> ByteBuffer.allocate(8192));

    public void reuseBuffer() {
        ByteBuffer buffer = BUFFER_CACHE.get();
        buffer.clear(); // 重置状态
        // 使用 buffer
    }

    /**
     * 3. 正确处理部分读写
     */
    public void handlePartialReadWrite(SocketChannel channel) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        buffer.put("Hello, World!".getBytes());
        buffer.flip();

        // 非阻塞模式下可能无法一次写完
        while (buffer.hasRemaining()) {
            int written = channel.write(buffer);
            if (written == 0) {
                // 发送缓冲区满，应该注册 OP_WRITE 等待
                break;
            }
        }

        // 如果还有剩余数据，使用 compact() 而非 clear()
        if (buffer.hasRemaining()) {
            buffer.compact();
        } else {
            buffer.clear();
        }
    }

    /**
     * 4. 根据场景选择合适的缓冲区类型
     */
    public ByteBuffer chooseBufferType(String scenario) {
        switch (scenario) {
            case "short-lived":
                // 短期使用：堆缓冲区，分配/回收快
                return ByteBuffer.allocate(1024);

            case "large-file":
                // 大文件操作：直接缓冲区，减少拷贝
                return ByteBuffer.allocateDirect(64 * 1024);

            case "network":
                // 网络 I/O：直接缓冲区，性能更好
                return ByteBuffer.allocateDirect(8 * 1024);

            default:
                return ByteBuffer.allocate(1024);
        }
    }
}
```

### Selector 使用最佳实践

```java
public class SelectorBestPractices {

    /**
     * 1. 正确的事件循环结构
     */
    public void eventLoop(Selector selector) throws IOException {
        while (true) {
            // 设置合理的超时时间
            int ready = selector.select(1000);

            if (ready == 0) {
                // 可以执行一些维护任务，如检查空闲连接
                checkIdleConnections();
                continue;
            }

            Set<SelectionKey> keys = selector.selectedKeys();
            Iterator<SelectionKey> iterator = keys.iterator();

            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();
                // 必须在处理前移除
                iterator.remove();

                // 检查 key 是否有效
                if (!key.isValid()) {
                    continue;
                }

                try {
                    processKey(key);
                } catch (Exception e) {
                    // 单个连接异常不应影响其他连接
                    handleError(key, e);
                }
            }
        }
    }

    /**
     * 2. 正确处理 OP_WRITE 事件
     */
    public void handleWriteCorrectly(SelectionKey key, ByteBuffer data) throws IOException {
        // 只在有数据要发送时才注册 OP_WRITE
        if (data.hasRemaining()) {
            key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);
        }
    }

    public void onWritable(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        channel.write(buffer);

        // 写完后立即取消 OP_WRITE，避免 CPU 空转
        if (!buffer.hasRemaining()) {
            key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);
        }
    }

    /**
     * 3. 在正确的线程修改 interestOps
     */
    private ConcurrentLinkedQueue<Runnable> pendingTasks = new ConcurrentLinkedQueue<>();

    public void safeModifyInterestOps(SelectionKey key, int ops) {
        // 如果在其他线程，添加到任务队列
        pendingTasks.offer(() -> key.interestOps(ops));
        // 唤醒 Selector 处理任务
        key.selector().wakeup();
    }

    public void processPendingTasks() {
        Runnable task;
        while ((task = pendingTasks.poll()) != null) {
            task.run();
        }
    }

    private void checkIdleConnections() {
        // 定期检查并关闭空闲连接
    }

    private void processKey(SelectionKey key) throws IOException {
        // 处理事件
    }

    private void handleError(SelectionKey key, Exception e) {
        // 关闭异常连接
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException ignored) {}
    }
}
```

### 直接缓冲区使用建议

```java
public class DirectBufferGuidelines {

    // 使用对象池管理直接缓冲区
    private static final int BUFFER_SIZE = 8192;
    private static final int POOL_SIZE = 100;
    private static final Queue<ByteBuffer> bufferPool = new ConcurrentLinkedQueue<>();

    static {
        // 预创建缓冲区
        for (int i = 0; i < POOL_SIZE; i++) {
            bufferPool.offer(ByteBuffer.allocateDirect(BUFFER_SIZE));
        }
    }

    /**
     * 从池中获取缓冲区
     */
    public static ByteBuffer acquire() {
        ByteBuffer buffer = bufferPool.poll();
        if (buffer == null) {
            // 池为空，创建新的
            buffer = ByteBuffer.allocateDirect(BUFFER_SIZE);
        }
        buffer.clear();
        return buffer;
    }

    /**
     * 归还缓冲区到池中
     */
    public static void release(ByteBuffer buffer) {
        if (buffer.isDirect()) {
            buffer.clear();
            bufferPool.offer(buffer);
        }
    }

    /**
     * 使用示例
     */
    public void example() {
        ByteBuffer buffer = acquire();
        try {
            // 使用 buffer
        } finally {
            release(buffer);
        }
    }
}
```

## 常见陷阱

### 陷阱 1：忘记调用 flip()

```java
// 错误示例
ByteBuffer buffer = ByteBuffer.allocate(100);
buffer.put("Hello".getBytes());
// 忘记 flip()，直接读取
byte b = buffer.get(); // 读取的是空数据！

// 正确示例
ByteBuffer buffer = ByteBuffer.allocate(100);
buffer.put("Hello".getBytes());
buffer.flip(); // 切换到读模式
byte b = buffer.get(); // 正确读取 'H'
```

### 陷阱 2：忘记移除 selectedKeys

```java
// 错误示例
while (true) {
    selector.select();
    for (SelectionKey key : selector.selectedKeys()) {
        // 处理事件
        // 忘记移除 key，下次循环会重复处理！
    }
}

// 正确示例
while (true) {
    selector.select();
    Iterator<SelectionKey> iter = selector.selectedKeys().iterator();
    while (iter.hasNext()) {
        SelectionKey key = iter.next();
        iter.remove(); // 必须移除
        // 处理事件
    }
}
```

### 陷阱 3：OP_WRITE 导致 CPU 空转

```java
// 错误示例：始终注册 OP_WRITE
channel.register(selector, SelectionKey.OP_READ | SelectionKey.OP_WRITE);
// 问题：即使没有数据要写，isWritable() 也会返回 true，导致空转

// 正确示例：只在有数据要写时才注册 OP_WRITE
channel.register(selector, SelectionKey.OP_READ);
// ...
if (hasDataToWrite) {
    key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);
}
// 写完后取消 OP_WRITE
key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);
```

### 陷阱 4：非阻塞 read/write 的返回值处理

```java
// 错误示例：假设一次能读完
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer); // 可能返回 0！
buffer.flip();
// 可能读取到不完整的数据

// 正确示例：循环读取直到无数据
ByteBuffer buffer = ByteBuffer.allocate(1024);
int totalRead = 0;
while (true) {
    int read = channel.read(buffer);
    if (read == -1) {
        // 连接关闭
        break;
    } else if (read == 0) {
        // 暂时无数据，等待下次读事件
        break;
    } else {
        totalRead += read;
    }
}
```

### 陷阱 5：直接缓冲区内存泄漏

```java
// 错误示例：频繁创建直接缓冲区
public void process() {
    ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024);
    // 使用 buffer...
    // 方法结束后 buffer 不会立即释放！
}

// 正确示例：重用直接缓冲区
private final ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024);

public void process() {
    buffer.clear();
    // 使用 buffer...
}
```

### 陷阱 6：多线程修改 SelectionKey

```java
// 错误示例：在其他线程直接修改
new Thread(() -> {
    key.interestOps(SelectionKey.OP_WRITE); // 可能导致问题
}).start();

// 正确示例：通过 Selector 线程修改
pendingChanges.add(() -> key.interestOps(SelectionKey.OP_WRITE));
selector.wakeup();

// 在 Selector 线程中处理
while ((change = pendingChanges.poll()) != null) {
    change.run();
}
```

## 性能考量

### Buffer 性能对比

```java
/**
 * 不同 Buffer 类型的性能测试
 */
public class BufferPerformanceTest {

    private static final int ITERATIONS = 1_000_000;
    private static final int BUFFER_SIZE = 1024;

    public static void main(String[] args) {
        // 预热
        for (int i = 0; i < 10; i++) {
            testHeapBuffer();
            testDirectBuffer();
        }

        // 正式测试
        long heapTime = benchmark("Heap Buffer", BufferPerformanceTest::testHeapBuffer);
        long directTime = benchmark("Direct Buffer", BufferPerformanceTest::testDirectBuffer);

        System.out.println("\n性能对比:");
        System.out.printf("Direct vs Heap 提升: %.2f%%%n",
            (heapTime - directTime) * 100.0 / heapTime);
    }

    private static void testHeapBuffer() {
        ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);
        for (int i = 0; i < ITERATIONS; i++) {
            buffer.clear();
            buffer.putInt(i);
            buffer.flip();
            buffer.getInt();
        }
    }

    private static void testDirectBuffer() {
        ByteBuffer buffer = ByteBuffer.allocateDirect(BUFFER_SIZE);
        for (int i = 0; i < ITERATIONS; i++) {
            buffer.clear();
            buffer.putInt(i);
            buffer.flip();
            buffer.getInt();
        }
    }

    private static long benchmark(String name, Runnable task) {
        long start = System.nanoTime();
        task.run();
        long end = System.nanoTime();
        long timeMs = (end - start) / 1_000_000;
        System.out.printf("%s: %d ms%n", name, timeMs);
        return timeMs;
    }
}
```

### I/O 性能优化建议

| 场景 | 优化策略 | 预期提升 |
|------|----------|----------|
| 大文件复制 | 使用 `transferTo/transferFrom` | 30-50% |
| 频繁小文件读写 | 使用堆缓冲区 | 分配更快 |
| 网络 I/O | 使用直接缓冲区 | 减少拷贝 |
| 超大文件 | 使用内存映射 | 显著提升 |
| 高并发连接 | 多 Reactor + 线程池 | 线性扩展 |

### Selector 性能调优

```java
/**
 * Selector 性能优化配置
 */
public class SelectorOptimization {

    /**
     * 1. 合理设置 select 超时时间
     */
    public void selectTimeout(Selector selector) throws IOException {
        // 太短：CPU 占用高
        // 太长：响应慢
        // 建议：根据业务场景设置 100-1000ms
        selector.select(500);
    }

    /**
     * 2. 避免在事件循环中执行耗时操作
     */
    private ExecutorService workerPool = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );

    public void handleReadAsync(SelectionKey key) {
        // 将耗时的业务处理提交到线程池
        workerPool.submit(() -> {
            try {
                processBusinessLogic(key);
            } catch (Exception e) {
                // 异常处理
            }
        });
    }

    /**
     * 3. 批量处理写操作
     */
    public void batchWrite(SocketChannel channel, List<ByteBuffer> buffers)
            throws IOException {
        // 使用 GatheringByteChannel 批量写入
        ByteBuffer[] array = buffers.toArray(new ByteBuffer[0]);
        channel.write(array);
    }

    private void processBusinessLogic(SelectionKey key) {
        // 业务处理逻辑
    }
}
```

## 实战场景

### 场景 1：高性能文件服务器

```java
/**
 * 支持断点续传的文件服务器
 */
public class FileServer {

    public void serveFile(SocketChannel client, Path filePath, long offset)
            throws IOException {
        try (FileChannel fileChannel = FileChannel.open(filePath, StandardOpenOption.READ)) {
            long fileSize = fileChannel.size();
            long remaining = fileSize - offset;

            // 发送文件信息头
            ByteBuffer header = ByteBuffer.allocate(16);
            header.putLong(fileSize);
            header.putLong(remaining);
            header.flip();
            client.write(header);

            // 使用零拷贝传输文件
            long transferred = 0;
            while (transferred < remaining) {
                long count = fileChannel.transferTo(
                    offset + transferred,
                    remaining - transferred,
                    client
                );
                if (count == 0) {
                    // 发送缓冲区满，等待可写
                    break;
                }
                transferred += count;
            }
        }
    }
}
```

### 场景 2：实时聊天服务器

```java
/**
 * 简单的聊天室服务器
 */
public class ChatServer {

    private final Map<SocketChannel, String> clients = new ConcurrentHashMap<>();
    private Selector selector;

    public void broadcast(String message, SocketChannel sender) throws IOException {
        ByteBuffer buffer = ByteBuffer.wrap(message.getBytes(StandardCharsets.UTF_8));

        for (SocketChannel client : clients.keySet()) {
            if (client != sender && client.isConnected()) {
                buffer.rewind();
                client.write(buffer);
            }
        }
    }

    public void handleJoin(SocketChannel client, String username) {
        clients.put(client, username);
        try {
            broadcast(username + " 加入了聊天室", client);
        } catch (IOException e) {
            // 处理异常
        }
    }

    public void handleLeave(SocketChannel client) {
        String username = clients.remove(client);
        if (username != null) {
            try {
                broadcast(username + " 离开了聊天室", client);
            } catch (IOException e) {
                // 处理异常
            }
        }
    }
}
```

### 场景 3：代理服务器

```java
/**
 * 简单的 TCP 代理
 */
public class TcpProxy {

    public void proxyConnection(SocketChannel client, String targetHost, int targetPort)
            throws IOException {

        SocketChannel target = SocketChannel.open();
        target.configureBlocking(false);
        target.connect(new InetSocketAddress(targetHost, targetPort));

        // 等待连接完成
        while (!target.finishConnect()) {
            Thread.yield();
        }

        ByteBuffer buffer = ByteBuffer.allocateDirect(8192);

        // 双向转发数据
        Selector selector = Selector.open();
        client.register(selector, SelectionKey.OP_READ, target);
        target.register(selector, SelectionKey.OP_READ, client);

        while (client.isConnected() && target.isConnected()) {
            selector.select(1000);

            for (SelectionKey key : selector.selectedKeys()) {
                if (key.isReadable()) {
                    SocketChannel source = (SocketChannel) key.channel();
                    SocketChannel dest = (SocketChannel) key.attachment();

                    buffer.clear();
                    int read = source.read(buffer);

                    if (read == -1) {
                        // 连接关闭
                        return;
                    }

                    buffer.flip();
                    while (buffer.hasRemaining()) {
                        dest.write(buffer);
                    }
                }
            }
            selector.selectedKeys().clear();
        }
    }
}
```

## 面试要点

### NIO 与 BIO 的区别

**答案要点：**
- BIO 面向流，NIO 面向缓冲区
- BIO 阻塞，NIO 支持非阻塞
- BIO 一个连接一个线程，NIO 一个线程处理多个连接
- NIO 有 Selector 多路复用机制

### Buffer 的 flip() 和 clear() 的区别

**答案要点：**
- `flip()`: 将 limit 设为当前 position，position 设为 0，准备读取
- `clear()`: 将 position 设为 0，limit 设为 capacity，准备写入
- `compact()`: 将未读数据移到开头，position 设为未读数据长度

### 直接缓冲区和堆缓冲区的区别

**答案要点：**
- 堆缓冲区在 JVM 堆内存，受 GC 管理
- 直接缓冲区在本地内存，I/O 性能更好
- 直接缓冲区分配和回收成本高
- 大量使用直接缓冲区可能导致 OOM

### Selector 的工作原理

**答案要点：**
- 基于操作系统的 I/O 多路复用（epoll/kqueue）
- Channel 注册到 Selector，指定感兴趣的事件
- select() 阻塞等待事件就绪
- 返回就绪的 SelectionKey 集合进行处理

### 为什么 NIO 性能更好？

**答案要点：**
- 减少线程数量，降低上下文切换开销
- 非阻塞 I/O 避免线程等待
- 直接缓冲区减少数据拷贝
- Selector 高效的事件通知机制

### 如何解决 NIO 的空轮询 Bug？

**答案要点：**
- Linux 某些版本的 epoll 实现有 bug
- 导致 select() 在无事件时也返回
- 解决方案：检测空轮询次数，达到阈值重建 Selector
- Netty 等框架已内置此问题的解决方案

```java
int selectCnt = 0;
while (true) {
    int ready = selector.select(timeoutMs);
    if (ready == 0) {
        selectCnt++;
        if (selectCnt >= 512) {
            // 重建 Selector
            selector = rebuildSelector();
            selectCnt = 0;
        }
    } else {
        selectCnt = 0;
        // 处理事件
    }
}
```

### FileChannel 为什么不支持非阻塞？

**答案要点：**
- 文件 I/O 与网络 I/O 特性不同
- 文件数据总是"就绪"的，不需要等待
- 操作系统的文件 I/O 通常是同步的
- 如需异步文件操作，使用 AsynchronousFileChannel

## 延伸阅读

### 官方文档
- [Java NIO Tutorial (Oracle)](https://docs.oracle.com/javase/tutorial/essential/io/index.html)
- [Java NIO API Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/package-summary.html)

### 经典书籍
- 《Java NIO》- Ron Hitchens
- 《Netty in Action》- Norman Maurer
- 《Java 并发编程实战》- Brian Goetz

### 进阶学习
- Netty 框架源码
- Reactor 模式与 Proactor 模式
- Linux epoll 机制
- 零拷贝技术（sendfile, mmap）

### 相关技术
- Netty - 高性能网络框架
- gRPC - 高性能 RPC 框架
- Project Loom - 虚拟线程（Java 21+）
