---
title: NIO非阻塞IO
description: Java NIO完全指南，Channel、Buffer、Selector与非阻塞编程
track: java
section: collections-streams
difficulty: advanced
tags:
  - Java
  - NIO
  - Channel
  - 非阻塞
status: imported
origin: old/src/content/docs/java/nio.zh.md
divergence: 0.207
issues: []
legacy:
  category: Java
  subcategory: IO
  order: 13
  lastUpdated: 2026-01-07
---

Java NIO (New I/O) 是 Java 1.4 引入的一套全新的 I/O API，为 Java 平台带来了高性能、非阻塞的 I/O 操作能力。NIO 采用面向缓冲区、基于通道的架构，彻底改变了 Java 处理 I/O 的方式，成为构建高性能网络服务器和大规模数据处理应用的基石。

## NIO 与传统 IO 的核心区别

### 设计理念对比

| 特性 | 传统 IO | NIO |
|------|---------|-----|
| 数据处理方式 | 面向流 (Stream) | 面向缓冲区 (Buffer) |
| 阻塞模式 | 阻塞 I/O | 支持非阻塞 I/O |
| 数据方向 | 单向（输入流或输出流） | 双向（Channel 可读可写） |
| 多路复用 | 不支持 | Selector 多路复用 |
| 线程模型 | 一个连接一个线程 | 单线程处理多连接 |

### 何时选择 NIO

```java
/*
 * 选择 NIO 的场景：
 * 1. 需要处理大量并发连接（如聊天服务器、游戏服务器）
 * 2. 连接数量多但每个连接数据量较小
 * 3. 需要非阻塞 I/O 操作
 * 4. 需要高性能文件操作（如大文件复制）
 *
 * 选择传统 IO 的场景：
 * 1. 连接数量少，每个连接数据量大
 * 2. 代码简洁性优先
 * 3. 简单的文件读写操作
 */
```

## Buffer 缓冲区

Buffer 是 NIO 的核心数据容器，所有数据的读写都必须通过 Buffer 进行。Buffer 本质上是一块可以写入和读取数据的内存区域，封装为 Java 对象并提供了一组方法来访问这块内存。

### Buffer 的核心属性

```java
public abstract class Buffer {
    // 四个核心属性，始终满足: mark <= position <= limit <= capacity
    private int mark = -1;     // 标记位置，用于 reset() 恢复
    private int position = 0;  // 当前读写位置
    private int limit;         // 可读写数据的边界
    private int capacity;      // 缓冲区最大容量，创建后不可改变
}
```

### Buffer 的类型体系

```java
import java.nio.*;

public class BufferTypeDemo {
    public static void main(String[] args) {
        // ByteBuffer - 最常用，网络传输和文件操作的基础
        ByteBuffer byteBuffer = ByteBuffer.allocate(1024);

        // CharBuffer - 字符缓冲区
        CharBuffer charBuffer = CharBuffer.allocate(1024);

        // ShortBuffer - 短整型缓冲区
        ShortBuffer shortBuffer = ShortBuffer.allocate(512);

        // IntBuffer - 整型缓冲区
        IntBuffer intBuffer = IntBuffer.allocate(256);

        // LongBuffer - 长整型缓冲区
        LongBuffer longBuffer = LongBuffer.allocate(128);

        // FloatBuffer - 单精度浮点缓冲区
        FloatBuffer floatBuffer = FloatBuffer.allocate(256);

        // DoubleBuffer - 双精度浮点缓冲区
        DoubleBuffer doubleBuffer = DoubleBuffer.allocate(128);

        // MappedByteBuffer - 内存映射文件缓冲区（特殊类型）
        // 通过 FileChannel.map() 创建
    }
}
```

### Buffer 的核心操作

```java
import java.nio.ByteBuffer;

public class BufferOperationsDemo {
    public static void main(String[] args) {
        // 1. 分配缓冲区
        ByteBuffer buffer = ByteBuffer.allocate(10);
        System.out.println("=== 初始状态 ===");
        printStatus(buffer);  // position=0, limit=10, capacity=10

        // 2. 写入数据（put 操作）
        buffer.put((byte) 'H');
        buffer.put((byte) 'e');
        buffer.put((byte) 'l');
        buffer.put((byte) 'l');
        buffer.put((byte) 'o');
        System.out.println("\n=== 写入5字节后 ===");
        printStatus(buffer);  // position=5, limit=10, capacity=10

        // 3. flip() - 切换到读模式（关键操作）
        // 将 limit 设为当前 position，position 设为 0
        buffer.flip();
        System.out.println("\n=== flip()后 ===");
        printStatus(buffer);  // position=0, limit=5, capacity=10

        // 4. 读取数据（get 操作）
        System.out.print("读取数据: ");
        while (buffer.hasRemaining()) {
            System.out.print((char) buffer.get());
        }
        System.out.println("\n\n=== 读取完成后 ===");
        printStatus(buffer);  // position=5, limit=5, capacity=10

        // 5. rewind() - 重新读取（position 归零，limit 不变）
        buffer.rewind();
        System.out.println("=== rewind()后 ===");
        printStatus(buffer);  // position=0, limit=5, capacity=10

        // 6. clear() - 清空缓冲区（准备重新写入）
        // 注意：数据并未真正清除，只是重置了位置指针
        buffer.clear();
        System.out.println("\n=== clear()后 ===");
        printStatus(buffer);  // position=0, limit=10, capacity=10

        // 7. compact() - 压缩缓冲区（保留未读数据）
        buffer.put((byte) 'A');
        buffer.put((byte) 'B');
        buffer.put((byte) 'C');
        buffer.flip();
        buffer.get();  // 读取 'A'
        System.out.println("\n=== 读取1字节后 ===");
        printStatus(buffer);  // position=1, limit=3

        buffer.compact();  // 将 'B', 'C' 移到开头
        System.out.println("\n=== compact()后 ===");
        printStatus(buffer);  // position=2, limit=10

        // 8. mark() 和 reset() - 标记和恢复位置
        buffer.clear();
        buffer.put((byte) 'X');
        buffer.put((byte) 'Y');
        buffer.mark();  // 在 position=2 处标记
        buffer.put((byte) 'Z');
        System.out.println("\n=== mark()后写入数据 ===");
        printStatus(buffer);  // position=3

        buffer.reset();  // 恢复到 mark 位置
        System.out.println("\n=== reset()后 ===");
        printStatus(buffer);  // position=2
    }

    private static void printStatus(ByteBuffer buffer) {
        System.out.printf("position=%d, limit=%d, capacity=%d%n",
            buffer.position(), buffer.limit(), buffer.capacity());
    }
}
```

### 直接缓冲区与堆缓冲区

```java
import java.nio.ByteBuffer;

public class DirectBufferDemo {
    public static void main(String[] args) {
        // 堆缓冲区 - 分配在 JVM 堆内存中
        ByteBuffer heapBuffer = ByteBuffer.allocate(1024);
        System.out.println("堆缓冲区 isDirect: " + heapBuffer.isDirect());  // false

        // 直接缓冲区 - 分配在操作系统本地内存中
        ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
        System.out.println("直接缓冲区 isDirect: " + directBuffer.isDirect());  // true

        // 包装数组创建缓冲区
        byte[] data = new byte[1024];
        ByteBuffer wrapBuffer = ByteBuffer.wrap(data);
        System.out.println("wrap缓冲区 isDirect: " + wrapBuffer.isDirect());  // false
    }
}

/*
 * 直接缓冲区 vs 堆缓冲区：
 *
 * 堆缓冲区（HeapByteBuffer）:
 * - 优点：分配和回收速度快，由 GC 管理
 * - 缺点：I/O 操作需要额外的内存拷贝（堆内存 -> 本地内存 -> 内核）
 * - 适用：数据量小、生命周期短的场景
 *
 * 直接缓冲区（DirectByteBuffer）:
 * - 优点：减少一次内存拷贝，I/O 性能更高
 * - 缺点：分配和回收成本高，不受 GC 直接管理，可能造成内存泄漏
 * - 适用：大文件操作、长期使用的缓冲区、高性能网络传输
 *
 * 零拷贝原理：
 * 传统 I/O：用户空间 <-> JVM堆 <-> 本地内存 <-> 内核缓冲区 <-> 设备
 * 直接缓冲区：用户空间 <-> 本地内存 <-> 内核缓冲区 <-> 设备
 */
```

### Buffer 视图与切片

```java
import java.nio.ByteBuffer;
import java.nio.IntBuffer;
import java.nio.ReadOnlyBufferException;

public class BufferViewDemo {
    public static void main(String[] args) {
        // 1. 创建视图缓冲区（共享底层数据）
        ByteBuffer byteBuffer = ByteBuffer.allocate(16);
        for (int i = 0; i < 16; i++) {
            byteBuffer.put((byte) i);
        }
        byteBuffer.flip();

        // 转换为 IntBuffer 视图（每4个字节为一个int）
        IntBuffer intView = byteBuffer.asIntBuffer();
        System.out.println("IntBuffer 容量: " + intView.capacity());  // 4
        while (intView.hasRemaining()) {
            System.out.printf("0x%08X%n", intView.get());
        }

        // 2. 切片操作（slice）
        ByteBuffer original = ByteBuffer.allocate(10);
        for (int i = 0; i < 10; i++) {
            original.put((byte) (i * 10));
        }

        // 创建切片：从 position=3 到 limit=7
        original.position(3);
        original.limit(7);
        ByteBuffer slice = original.slice();

        System.out.println("\n切片容量: " + slice.capacity());  // 4
        System.out.println("切片内容:");
        while (slice.hasRemaining()) {
            System.out.print(slice.get() + " ");  // 30 40 50 60
        }

        // 切片修改会影响原缓冲区
        slice.put(0, (byte) 99);
        System.out.println("\n\n原缓冲区[3]: " + original.get(3));  // 99

        // 3. 只读缓冲区
        ByteBuffer readOnly = original.asReadOnlyBuffer();
        System.out.println("\n是否只读: " + readOnly.isReadOnly());  // true

        try {
            readOnly.put((byte) 1);
        } catch (ReadOnlyBufferException e) {
            System.out.println("只读缓冲区不可写入");
        }

        // 4. 复制缓冲区（共享数据，独立位置指针）
        original.clear();
        ByteBuffer duplicate = original.duplicate();
        original.position(5);
        System.out.println("\n原缓冲区 position: " + original.position());  // 5
        System.out.println("复制缓冲区 position: " + duplicate.position());  // 0
    }
}
```

## Channel 通道

Channel 是 NIO 中用于数据传输的通道，类似于传统 I/O 中的流（Stream），但具有以下特点：

- **双向性**：同一个 Channel 既可以读也可以写
- **非阻塞支持**：可以配置为非阻塞模式
- **必须通过 Buffer 操作**：数据必须先读到 Buffer 或从 Buffer 写出

### Channel 类型

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.channels.*;
import java.nio.file.*;

public class ChannelTypesDemo {
    public static void main(String[] args) throws IOException {
        // 1. FileChannel - 文件通道（不支持非阻塞）
        FileChannel fileChannel = FileChannel.open(
            Paths.get("test.txt"),
            StandardOpenOption.READ,
            StandardOpenOption.WRITE,
            StandardOpenOption.CREATE
        );

        // 2. SocketChannel - TCP 客户端通道
        SocketChannel socketChannel = SocketChannel.open();
        socketChannel.configureBlocking(false);  // 设置非阻塞
        socketChannel.connect(new InetSocketAddress("localhost", 8080));

        // 3. ServerSocketChannel - TCP 服务器通道
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false);
        serverChannel.bind(new InetSocketAddress(8080));

        // 4. DatagramChannel - UDP 通道
        DatagramChannel datagramChannel = DatagramChannel.open();
        datagramChannel.configureBlocking(false);
        datagramChannel.bind(new InetSocketAddress(9090));

        // 关闭所有通道
        fileChannel.close();
        socketChannel.close();
        serverChannel.close();
        datagramChannel.close();
    }
}
```

### FileChannel 文件操作

```java
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

public class FileChannelDemo {

    // 写入文件
    public static void writeFile(String path, String content) throws IOException {
        try (FileChannel channel = FileChannel.open(
                Paths.get(path),
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            ByteBuffer buffer = ByteBuffer.wrap(content.getBytes(StandardCharsets.UTF_8));

            while (buffer.hasRemaining()) {
                channel.write(buffer);
            }

            // 强制将数据刷新到磁盘
            channel.force(true);
        }
    }

    // 读取文件
    public static String readFile(String path) throws IOException {
        try (FileChannel channel = FileChannel.open(
                Paths.get(path), StandardOpenOption.READ)) {

            // 获取文件大小
            long fileSize = channel.size();
            ByteBuffer buffer = ByteBuffer.allocate((int) fileSize);

            // 读取全部内容
            while (buffer.hasRemaining()) {
                if (channel.read(buffer) == -1) break;
            }

            buffer.flip();
            return StandardCharsets.UTF_8.decode(buffer).toString();
        }
    }

    // 高效文件复制（零拷贝）
    public static void copyFile(String source, String dest) throws IOException {
        try (FileChannel sourceChannel = FileChannel.open(
                    Paths.get(source), StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(
                    Paths.get(dest),
                    StandardOpenOption.CREATE,
                    StandardOpenOption.WRITE,
                    StandardOpenOption.TRUNCATE_EXISTING)) {

            long size = sourceChannel.size();
            long position = 0;

            // transferTo 使用零拷贝技术，效率极高
            while (position < size) {
                long transferred = sourceChannel.transferTo(
                    position, size - position, destChannel);
                position += transferred;
            }

            // 或使用 transferFrom
            // destChannel.transferFrom(sourceChannel, 0, sourceChannel.size());
        }
    }

    // 随机访问文件
    public static void randomAccess(String path) throws IOException {
        try (RandomAccessFile file = new RandomAccessFile(path, "rw");
             FileChannel channel = file.getChannel()) {

            // 定位到文件末尾
            long fileSize = channel.size();
            channel.position(fileSize);

            // 追加数据
            ByteBuffer buffer = ByteBuffer.wrap("\n追加的内容".getBytes(StandardCharsets.UTF_8));
            channel.write(buffer);

            // 定位到文件开头读取
            channel.position(0);
            buffer = ByteBuffer.allocate(100);
            channel.read(buffer);
            buffer.flip();

            System.out.println("前100字节: " + StandardCharsets.UTF_8.decode(buffer));
        }
    }

    public static void main(String[] args) throws IOException {
        // 写入文件
        writeFile("nio_test.txt", "Hello, Java NIO FileChannel!\n你好，NIO！");
        System.out.println("文件写入完成");

        // 读取文件
        String content = readFile("nio_test.txt");
        System.out.println("文件内容:\n" + content);

        // 复制文件
        copyFile("nio_test.txt", "nio_copy.txt");
        System.out.println("文件复制完成");
    }
}
```

### 内存映射文件

```java
import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;

public class MappedFileDemo {
    public static void main(String[] args) throws IOException {
        // 创建大文件并使用内存映射
        try (RandomAccessFile file = new RandomAccessFile("mapped_file.dat", "rw");
             FileChannel channel = file.getChannel()) {

            // 映射文件到内存（1MB）
            long size = 1024 * 1024;
            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, size);

            // 直接操作映射的内存
            String data = "通过内存映射写入的数据";
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
            mappedBuffer.put(bytes);

            // 读取数据
            mappedBuffer.flip();
            byte[] readBytes = new byte[bytes.length];
            mappedBuffer.get(readBytes);
            System.out.println("读取: " + new String(readBytes, StandardCharsets.UTF_8));

            // 强制将更改写入磁盘
            mappedBuffer.force();
        }

        /*
         * 内存映射文件的优势：
         * 1. 操作系统级别的优化，性能极高
         * 2. 适合处理超大文件（无需全部加载到内存）
         * 3. 多进程可以共享同一映射区域
         *
         * 映射模式：
         * - READ_ONLY: 只读映射
         * - READ_WRITE: 读写映射
         * - PRIVATE: 私有映射（修改不影响原文件）
         */
    }
}
```

### Scatter/Gather 分散/聚集 I/O

```java
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

public class ScatterGatherDemo {

    // Scatter Read - 将通道数据分散读取到多个缓冲区
    public static void scatterRead() throws IOException {
        try (FileChannel channel = FileChannel.open(
                Paths.get("protocol.dat"), StandardOpenOption.READ)) {

            // 定义协议格式：4字节头 + 100字节正文 + 4字节尾
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(100);
            ByteBuffer footer = ByteBuffer.allocate(4);

            ByteBuffer[] buffers = {header, body, footer};

            // 分散读取 - 按顺序填充各个缓冲区
            long bytesRead = channel.read(buffers);

            header.flip();
            body.flip();
            footer.flip();

            System.out.println("Header: " + header.getInt());
            System.out.println("Body: " + StandardCharsets.UTF_8.decode(body));
            System.out.println("Footer: " + footer.getInt());
        }
    }

    // Gather Write - 将多个缓冲区数据聚集写入通道
    public static void gatherWrite() throws IOException {
        try (FileChannel channel = FileChannel.open(
                Paths.get("protocol.dat"),
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            // 准备协议数据
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(100);
            ByteBuffer footer = ByteBuffer.allocate(4);

            header.putInt(12345);  // 消息ID
            body.put("这是协议正文内容，使用Gather写入".getBytes(StandardCharsets.UTF_8));
            footer.putInt(99999);  // 校验码

            header.flip();
            body.flip();
            footer.flip();

            ByteBuffer[] buffers = {header, body, footer};

            // 聚集写入 - 按顺序写入各个缓冲区内容
            long bytesWritten = channel.write(buffers);
            System.out.println("写入字节数: " + bytesWritten);
        }
    }

    public static void main(String[] args) throws IOException {
        gatherWrite();
        scatterRead();
    }
}

/*
 * Scatter/Gather 的应用场景：
 * 1. 处理固定格式的协议消息（如：消息头 + 消息体 + 消息尾）
 * 2. 日志文件处理（时间戳 + 级别 + 内容）
 * 3. 网络协议解析
 */
```

## Selector 选择器

Selector 是 Java NIO 实现多路复用的核心组件，允许单个线程高效地管理多个 Channel。这是构建高性能网络服务器的关键技术。

### Selector 工作原理

```java
/*
 * Selector 多路复用原理：
 *
 * 传统阻塞 I/O 模型：
 * - 每个连接需要一个独立的线程处理
 * - 10000 个连接需要 10000 个线程
 * - 线程切换开销巨大，资源浪费严重
 *
 * Selector 模型：
 * - 多个 Channel 注册到同一个 Selector
 * - Selector 轮询检测哪些 Channel 有事件就绪
 * - 单线程可以处理数千个连接
 * - 只有真正有数据时才进行处理
 *
 * 事件类型（SelectionKey）：
 * - OP_ACCEPT (16): 接受连接事件（ServerSocketChannel）
 * - OP_CONNECT (8): 连接就绪事件（SocketChannel）
 * - OP_READ (1): 读就绪事件
 * - OP_WRITE (4): 写就绪事件
 */
```

### 非阻塞 TCP 服务器

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Set;

public class NioEchoServer {
    private static final int PORT = 8080;
    private static final int BUFFER_SIZE = 1024;

    public static void main(String[] args) throws IOException {
        // 1. 创建 Selector
        Selector selector = Selector.open();

        // 2. 创建 ServerSocketChannel 并配置
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false);  // 必须设置为非阻塞

        // 3. 注册到 Selector，监听 ACCEPT 事件
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO Echo 服务器启动，端口: " + PORT);

        // 4. 事件循环
        while (true) {
            // 阻塞等待事件（可设置超时: selector.select(1000)）
            int readyChannels = selector.select();

            if (readyChannels == 0) {
                continue;  // 超时或被 wakeup()，无就绪事件
            }

            // 5. 获取就绪的 SelectionKey 集合
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> keyIterator = selectedKeys.iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();

                try {
                    if (key.isAcceptable()) {
                        // 处理新连接
                        handleAccept(key, selector);
                    } else if (key.isReadable()) {
                        // 处理读事件
                        handleRead(key);
                    } else if (key.isWritable()) {
                        // 处理写事件
                        handleWrite(key);
                    }
                } catch (IOException e) {
                    System.err.println("处理连接异常: " + e.getMessage());
                    closeChannel(key);
                }

                // 6. 必须手动移除已处理的 key（否则下次循环会重复处理）
                keyIterator.remove();
            }
        }
    }

    // 处理新连接
    private static void handleAccept(SelectionKey key, Selector selector)
            throws IOException {
        ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();

        // 接受连接
        SocketChannel clientChannel = serverChannel.accept();
        clientChannel.configureBlocking(false);

        // 为客户端分配缓冲区并附加到 key
        ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);
        clientChannel.register(selector, SelectionKey.OP_READ, buffer);

        System.out.println("新连接: " + clientChannel.getRemoteAddress());
    }

    // 处理读事件
    private static void handleRead(SelectionKey key) throws IOException {
        SocketChannel clientChannel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = clientChannel.read(buffer);

        if (bytesRead == -1) {
            // 客户端关闭连接
            System.out.println("客户端断开: " + clientChannel.getRemoteAddress());
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("收到消息: " + message.trim());

            // 准备回写数据
            buffer.clear();
            String response = "服务器回复: " + message;
            buffer.put(response.getBytes(StandardCharsets.UTF_8));
            buffer.flip();

            // 切换到监听写事件
            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    // 处理写事件
    private static void handleWrite(SelectionKey key) throws IOException {
        SocketChannel clientChannel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        // 写入数据
        while (buffer.hasRemaining()) {
            clientChannel.write(buffer);
        }

        // 清空缓冲区，切换回监听读事件
        buffer.clear();
        key.interestOps(SelectionKey.OP_READ);
    }

    // 关闭通道
    private static void closeChannel(SelectionKey key) {
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 非阻塞 TCP 客户端

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Scanner;

public class NioEchoClient {
    private static final String HOST = "localhost";
    private static final int PORT = 8080;

    public static void main(String[] args) throws IOException {
        Selector selector = Selector.open();
        SocketChannel channel = SocketChannel.open();
        channel.configureBlocking(false);

        // 发起非阻塞连接
        channel.connect(new InetSocketAddress(HOST, PORT));
        channel.register(selector, SelectionKey.OP_CONNECT);

        Scanner scanner = new Scanner(System.in);
        ByteBuffer buffer = ByteBuffer.allocate(1024);

        while (true) {
            selector.select();
            Iterator<SelectionKey> keyIterator = selector.selectedKeys().iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                keyIterator.remove();

                if (key.isConnectable()) {
                    // 完成连接
                    SocketChannel sc = (SocketChannel) key.channel();
                    if (sc.isConnectionPending()) {
                        sc.finishConnect();
                    }
                    System.out.println("连接服务器成功!");
                    key.interestOps(SelectionKey.OP_WRITE);

                } else if (key.isWritable()) {
                    // 发送消息
                    System.out.print("输入消息: ");
                    String message = scanner.nextLine();

                    buffer.clear();
                    buffer.put(message.getBytes(StandardCharsets.UTF_8));
                    buffer.flip();

                    SocketChannel sc = (SocketChannel) key.channel();
                    sc.write(buffer);

                    key.interestOps(SelectionKey.OP_READ);

                } else if (key.isReadable()) {
                    // 接收响应
                    SocketChannel sc = (SocketChannel) key.channel();
                    buffer.clear();
                    int bytesRead = sc.read(buffer);

                    if (bytesRead > 0) {
                        buffer.flip();
                        String response = StandardCharsets.UTF_8.decode(buffer).toString();
                        System.out.println(response);
                    }

                    key.interestOps(SelectionKey.OP_WRITE);
                }
            }
        }
    }
}
```

### Selector 高级用法

```java
import java.io.IOException;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.util.Set;

public class SelectorAdvancedDemo {

    // 1. 修改感兴趣的事件
    public static void modifyInterestOps(SelectionKey key) {
        // 添加事件
        key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);

        // 移除事件
        key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);

        // 替换事件
        key.interestOps(SelectionKey.OP_READ);
    }

    // 2. 使用 wakeup() 唤醒阻塞的 select()
    public static void wakeupDemo(Selector selector) {
        new Thread(() -> {
            try {
                Thread.sleep(5000);
                System.out.println("唤醒 Selector");
                selector.wakeup();  // 唤醒阻塞在 select() 的线程
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    // 3. selectNow() 非阻塞选择
    public static void selectNowDemo(Selector selector) throws IOException {
        // 立即返回，不阻塞
        int ready = selector.selectNow();
        System.out.println("就绪通道数: " + ready);
    }

    // 4. select(timeout) 带超时的选择
    public static void selectWithTimeoutDemo(Selector selector) throws IOException {
        // 最多阻塞 1000 毫秒
        int ready = selector.select(1000);
        if (ready == 0) {
            System.out.println("超时，无就绪事件");
        }
    }

    // 5. 取消注册
    public static void cancelRegistration(SelectionKey key) {
        key.cancel();  // 取消注册
        // 注意：key.cancel() 后，key 会在下次 select() 时被移除
    }

    // 6. 获取所有注册的 key
    public static void getAllKeys(Selector selector) {
        // 获取所有注册的 key（包括未就绪的）
        Set<SelectionKey> allKeys = selector.keys();
        System.out.println("注册的通道数: " + allKeys.size());

        // 获取就绪的 key
        Set<SelectionKey> selectedKeys = selector.selectedKeys();
        System.out.println("就绪的通道数: " + selectedKeys.size());
    }
}
```

## 多线程 Reactor 模式

在高并发场景下，单线程 Reactor 可能成为瓶颈。多线程 Reactor 模式将接受连接和处理 I/O 分离到不同的线程。

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MultiReactorServer {
    private static final int PORT = 8080;
    private static final int WORKER_COUNT = Runtime.getRuntime().availableProcessors();

    private Selector bossSelector;  // 主 Reactor，处理连接
    private Selector[] workerSelectors;  // 工作 Reactor，处理 I/O
    private int workerIndex = 0;
    private ExecutorService workerPool;

    public void start() throws IOException {
        // 初始化主 Selector
        bossSelector = Selector.open();

        // 初始化工作 Selector 数组
        workerSelectors = new Selector[WORKER_COUNT];
        for (int i = 0; i < WORKER_COUNT; i++) {
            workerSelectors[i] = Selector.open();
        }

        // 创建工作线程池
        workerPool = Executors.newFixedThreadPool(WORKER_COUNT);

        // 创建服务器通道
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false);
        serverChannel.register(bossSelector, SelectionKey.OP_ACCEPT);

        System.out.println("多线程 Reactor 服务器启动，端口: " + PORT);
        System.out.println("工作线程数: " + WORKER_COUNT);

        // 启动工作线程
        for (int i = 0; i < WORKER_COUNT; i++) {
            final int index = i;
            workerPool.submit(() -> runWorker(index));
        }

        // 主线程处理连接
        runBoss();
    }

    // 主 Reactor - 处理连接
    private void runBoss() {
        try {
            while (true) {
                bossSelector.select();
                Iterator<SelectionKey> keyIterator = bossSelector.selectedKeys().iterator();

                while (keyIterator.hasNext()) {
                    SelectionKey key = keyIterator.next();
                    keyIterator.remove();

                    if (key.isAcceptable()) {
                        handleAccept(key);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // 工作 Reactor - 处理 I/O
    private void runWorker(int index) {
        Selector selector = workerSelectors[index];
        try {
            while (true) {
                selector.select();
                Iterator<SelectionKey> keyIterator = selector.selectedKeys().iterator();

                while (keyIterator.hasNext()) {
                    SelectionKey key = keyIterator.next();
                    keyIterator.remove();

                    if (key.isReadable()) {
                        handleRead(key);
                    } else if (key.isWritable()) {
                        handleWrite(key);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // 处理新连接 - 轮询分配给工作 Selector
    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
        SocketChannel clientChannel = serverChannel.accept();
        clientChannel.configureBlocking(false);

        // 轮询选择工作 Selector
        int index = workerIndex++ % WORKER_COUNT;
        Selector workerSelector = workerSelectors[index];

        // 唤醒工作 Selector 以便注册新通道
        workerSelector.wakeup();

        ByteBuffer buffer = ByteBuffer.allocate(1024);
        clientChannel.register(workerSelector, SelectionKey.OP_READ, buffer);

        System.out.println("新连接分配到 Worker-" + index + ": " +
            clientChannel.getRemoteAddress());
    }

    private void handleRead(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = channel.read(buffer);
        if (bytesRead == -1) {
            key.cancel();
            channel.close();
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("[" + Thread.currentThread().getName() + "] 收到: " + message.trim());

            buffer.clear();
            buffer.put(("Echo: " + message).getBytes(StandardCharsets.UTF_8));
            buffer.flip();
            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    private void handleWrite(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        channel.write(buffer);
        buffer.clear();
        key.interestOps(SelectionKey.OP_READ);
    }

    public static void main(String[] args) throws IOException {
        new MultiReactorServer().start();
    }
}
```

## Path 与 Files (NIO.2)

Java 7 引入了 NIO.2，提供了更现代化的文件系统 API。

### Path 路径操作

```java
import java.nio.file.*;
import java.io.IOException;

public class PathDemo {
    public static void main(String[] args) throws IOException {
        // 创建 Path 对象
        Path path1 = Paths.get("/home/user/documents/file.txt");
        Path path2 = Paths.get("/home", "user", "documents", "file.txt");
        Path path3 = Path.of("/home/user/documents/file.txt");  // Java 11+

        // 获取路径信息
        System.out.println("文件名: " + path1.getFileName());  // file.txt
        System.out.println("父路径: " + path1.getParent());    // /home/user/documents
        System.out.println("根路径: " + path1.getRoot());      // /
        System.out.println("路径深度: " + path1.getNameCount());  // 4

        // 获取路径元素
        for (int i = 0; i < path1.getNameCount(); i++) {
            System.out.println("  [" + i + "]: " + path1.getName(i));
        }

        // 路径转换
        Path current = Paths.get(".");
        System.out.println("\n当前目录: " + current.toAbsolutePath());
        System.out.println("规范化: " + current.toAbsolutePath().normalize());
        System.out.println("URI: " + path1.toUri());

        // 路径解析
        Path base = Paths.get("/home/user");
        Path resolved = base.resolve("documents/file.txt");
        System.out.println("\n解析后: " + resolved);

        // 相对路径
        Path from = Paths.get("/home/user/documents");
        Path to = Paths.get("/home/user/images/photo.jpg");
        Path relative = from.relativize(to);
        System.out.println("相对路径: " + relative);  // ../images/photo.jpg

        // 路径规范化
        Path messy = Paths.get("/home/user/../user/./documents/../documents/file.txt");
        System.out.println("\n规范化前: " + messy);
        System.out.println("规范化后: " + messy.normalize());

        // 路径比较
        Path p1 = Paths.get("/home/user");
        Path p2 = Paths.get("/home/user");
        System.out.println("\n路径相等: " + p1.equals(p2));
        System.out.println("路径以...开头: " + p1.startsWith("/home"));
        System.out.println("路径以...结尾: " + p1.endsWith("user"));
    }
}
```

### Files 文件操作

```java
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.*;
import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

public class FilesDemo {

    public static void main(String[] args) throws IOException {
        // 1. 创建文件和目录
        createDemo();

        // 2. 读写文件
        readWriteDemo();

        // 3. 复制、移动、删除
        copyMoveDeleteDemo();

        // 4. 文件属性
        attributesDemo();

        // 5. 目录遍历
        walkDemo();
    }

    // 创建文件和目录
    public static void createDemo() throws IOException {
        // 创建单个目录
        Path dir = Paths.get("nio_test_dir");
        if (!Files.exists(dir)) {
            Files.createDirectory(dir);
        }

        // 创建多级目录
        Path dirs = Paths.get("parent/child/grandchild");
        Files.createDirectories(dirs);

        // 创建文件
        Path file = dir.resolve("test.txt");
        if (!Files.exists(file)) {
            Files.createFile(file);
        }

        // 创建临时文件和目录
        Path tempFile = Files.createTempFile("prefix_", ".tmp");
        Path tempDir = Files.createTempDirectory("temp_");
        System.out.println("临时文件: " + tempFile);
        System.out.println("临时目录: " + tempDir);

        // 创建符号链接（需要权限）
        // Path link = Paths.get("link_to_test");
        // Files.createSymbolicLink(link, file);
    }

    // 读写文件
    public static void readWriteDemo() throws IOException {
        Path file = Paths.get("nio_test_dir/data.txt");

        // 写入字符串（Java 11+）
        String content = "第一行内容\n第二行内容\n第三行内容";
        Files.writeString(file, content, StandardCharsets.UTF_8);

        // 追加内容
        Files.writeString(file, "\n追加的内容",
            StandardCharsets.UTF_8, StandardOpenOption.APPEND);

        // 写入字节数组
        // Files.write(file, content.getBytes(StandardCharsets.UTF_8));

        // 写入行列表
        List<String> lines = List.of("Line 1", "Line 2", "Line 3");
        Files.write(Paths.get("nio_test_dir/lines.txt"), lines);

        // 读取字符串
        String read = Files.readString(file, StandardCharsets.UTF_8);
        System.out.println("读取内容:\n" + read);

        // 读取所有行
        List<String> allLines = Files.readAllLines(file);
        System.out.println("\n按行读取: " + allLines);

        // 使用 Stream 读取大文件（惰性加载）
        System.out.println("\n使用 Stream:");
        try (Stream<String> lineStream = Files.lines(file)) {
            lineStream.filter(line -> line.contains("内容"))
                      .forEach(System.out::println);
        }

        // 读取字节数组
        byte[] bytes = Files.readAllBytes(file);
        System.out.println("文件大小: " + bytes.length + " 字节");
    }

    // 复制、移动、删除
    public static void copyMoveDeleteDemo() throws IOException {
        Path source = Paths.get("nio_test_dir/source.txt");
        Path target = Paths.get("nio_test_dir/target.txt");

        // 创建源文件
        Files.writeString(source, "源文件内容");

        // 复制文件
        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("复制完成");

        // 移动文件
        Path moved = Paths.get("nio_test_dir/moved.txt");
        Files.move(target, moved, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("移动完成");

        // 复制到输出流
        // Files.copy(source, System.out);

        // 删除文件
        Files.deleteIfExists(moved);
        System.out.println("删除完成");

        // 删除目录（必须为空）
        Path emptyDir = Paths.get("nio_test_dir/empty");
        Files.createDirectories(emptyDir);
        Files.delete(emptyDir);
    }

    // 文件属性
    public static void attributesDemo() throws IOException {
        Path file = Paths.get("nio_test_dir/data.txt");

        // 基本检查
        System.out.println("存在: " + Files.exists(file));
        System.out.println("是文件: " + Files.isRegularFile(file));
        System.out.println("是目录: " + Files.isDirectory(file));
        System.out.println("可读: " + Files.isReadable(file));
        System.out.println("可写: " + Files.isWritable(file));
        System.out.println("大小: " + Files.size(file) + " 字节");

        // 详细属性
        BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
        System.out.println("\n创建时间: " + attrs.creationTime());
        System.out.println("最后修改: " + attrs.lastModifiedTime());
        System.out.println("最后访问: " + attrs.lastAccessTime());

        // 修改时间
        Files.setLastModifiedTime(file, FileTime.from(Instant.now()));

        // 获取文件所有者（需要权限）
        try {
            UserPrincipal owner = Files.getOwner(file);
            System.out.println("所有者: " + owner.getName());
        } catch (UnsupportedOperationException e) {
            System.out.println("不支持获取所有者");
        }

        // POSIX 权限（Unix/Linux/macOS）
        try {
            PosixFileAttributes posixAttrs = Files.readAttributes(file, PosixFileAttributes.class);
            System.out.println("权限: " + PosixFilePermissions.toString(posixAttrs.permissions()));
        } catch (UnsupportedOperationException e) {
            System.out.println("当前系统不支持 POSIX 属性");
        }
    }

    // 目录遍历
    public static void walkDemo() throws IOException {
        Path dir = Paths.get(".");

        // 列出目录内容
        System.out.println("当前目录内容:");
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path entry : stream) {
                System.out.println("  " + entry.getFileName());
            }
        }

        // 使用 glob 模式过滤
        System.out.println("\nJava 文件:");
        try (DirectoryStream<Path> stream =
                Files.newDirectoryStream(dir, "*.java")) {
            for (Path entry : stream) {
                System.out.println("  " + entry.getFileName());
            }
        }

        // 递归遍历（Stream API）
        System.out.println("\n递归遍历（最大深度2）:");
        try (Stream<Path> walk = Files.walk(dir, 2)) {
            walk.filter(Files::isRegularFile)
                .forEach(System.out::println);
        }

        // 查找文件
        System.out.println("\n查找 .txt 文件:");
        try (Stream<Path> found = Files.find(dir, 3,
                (path, attrs) -> path.toString().endsWith(".txt") &&
                                 attrs.isRegularFile())) {
            found.forEach(System.out::println);
        }

        // 使用 FileVisitor
        System.out.println("\nFileVisitor 遍历:");
        Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) {
                System.out.println("进入目录: " + dir);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                System.out.println("  文件: " + file.getFileName());
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) {
                System.err.println("访问失败: " + file);
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
```

### 文件系统监控

```java
import java.io.IOException;
import java.nio.file.*;

public class WatchServiceDemo {
    public static void main(String[] args) throws IOException, InterruptedException {
        // 创建 WatchService
        WatchService watchService = FileSystems.getDefault().newWatchService();

        // 监控目录
        Path dir = Paths.get("nio_test_dir");
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }

        // 注册监控事件
        dir.register(watchService,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_DELETE,
            StandardWatchEventKinds.ENTRY_MODIFY);

        System.out.println("开始监控目录: " + dir.toAbsolutePath());
        System.out.println("请在该目录中进行文件操作...");

        // 事件循环
        while (true) {
            // 等待事件（阻塞）
            WatchKey key = watchService.take();

            // 处理事件
            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();

                // 溢出事件（事件丢失）
                if (kind == StandardWatchEventKinds.OVERFLOW) {
                    System.out.println("事件溢出!");
                    continue;
                }

                // 获取文件名
                @SuppressWarnings("unchecked")
                WatchEvent<Path> pathEvent = (WatchEvent<Path>) event;
                Path filename = pathEvent.context();

                // 输出事件信息
                String action;
                if (kind == StandardWatchEventKinds.ENTRY_CREATE) {
                    action = "创建";
                } else if (kind == StandardWatchEventKinds.ENTRY_DELETE) {
                    action = "删除";
                } else if (kind == StandardWatchEventKinds.ENTRY_MODIFY) {
                    action = "修改";
                } else {
                    action = "未知";
                }

                System.out.printf("[%s] %s%n", action, filename);
            }

            // 重置 key，继续监控
            boolean valid = key.reset();
            if (!valid) {
                System.out.println("监控目录不可用，退出");
                break;
            }
        }

        watchService.close();
    }
}
```

## 异步文件 I/O

Java 7 引入了 `AsynchronousFileChannel`，支持真正的异步文件操作。

### Future 模式

```java
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousFileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;

public class AsyncFileFutureDemo {
    public static void main(String[] args) throws IOException, ExecutionException, InterruptedException {
        Path file = Paths.get("async_test.txt");

        // 异步写入
        asyncWrite(file);

        // 异步读取
        asyncRead(file);
    }

    // 异步写入（Future 模式）
    public static void asyncWrite(Path file) throws IOException, ExecutionException, InterruptedException {
        try (AsynchronousFileChannel channel = AsynchronousFileChannel.open(file,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            String content = "异步写入的内容\nJava Async File I/O";
            ByteBuffer buffer = ByteBuffer.wrap(content.getBytes(StandardCharsets.UTF_8));

            // 发起异步写操作
            Future<Integer> future = channel.write(buffer, 0);

            // 可以做其他事情...
            System.out.println("写入请求已提交，继续执行其他任务...");

            // 等待写入完成
            Integer bytesWritten = future.get();
            System.out.println("写入完成，共 " + bytesWritten + " 字节");
        }
    }

    // 异步读取（Future 模式）
    public static void asyncRead(Path file) throws IOException, ExecutionException, InterruptedException {
        try (AsynchronousFileChannel channel = AsynchronousFileChannel.open(file,
                StandardOpenOption.READ)) {

            long fileSize = channel.size();
            ByteBuffer buffer = ByteBuffer.allocate((int) fileSize);

            // 发起异步读操作
            Future<Integer> future = channel.read(buffer, 0);

            // 可以做其他事情...
            System.out.println("读取请求已提交，继续执行其他任务...");

            // 等待读取完成
            Integer bytesRead = future.get();
            System.out.println("读取完成，共 " + bytesRead + " 字节");

            buffer.flip();
            String content = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("内容:\n" + content);
        }
    }
}
```

### CompletionHandler 回调模式

```java
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousFileChannel;
import java.nio.channels.CompletionHandler;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.concurrent.CountDownLatch;

public class AsyncFileCallbackDemo {
    public static void main(String[] args) throws IOException, InterruptedException {
        Path file = Paths.get("async_callback_test.txt");

        CountDownLatch latch = new CountDownLatch(2);  // 等待读写完成

        // 异步写入
        asyncWrite(file, latch);

        // 等待写入完成后再读取
        Thread.sleep(100);

        // 异步读取
        asyncRead(file, latch);

        // 等待所有操作完成
        latch.await();
        System.out.println("所有操作完成");
    }

    // 异步写入（回调模式）
    public static void asyncWrite(Path file, CountDownLatch latch) throws IOException {
        AsynchronousFileChannel channel = AsynchronousFileChannel.open(file,
            StandardOpenOption.CREATE,
            StandardOpenOption.WRITE,
            StandardOpenOption.TRUNCATE_EXISTING);

        String content = "使用 CompletionHandler 回调模式写入\n异步 I/O 示例";
        ByteBuffer buffer = ByteBuffer.wrap(content.getBytes(StandardCharsets.UTF_8));

        // 使用 CompletionHandler 回调
        channel.write(buffer, 0, channel, new CompletionHandler<Integer, AsynchronousFileChannel>() {
            @Override
            public void completed(Integer result, AsynchronousFileChannel attachment) {
                System.out.println("[回调] 写入成功: " + result + " 字节");
                try {
                    attachment.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                latch.countDown();
            }

            @Override
            public void failed(Throwable exc, AsynchronousFileChannel attachment) {
                System.err.println("[回调] 写入失败: " + exc.getMessage());
                try {
                    attachment.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                latch.countDown();
            }
        });

        System.out.println("写入请求已提交（回调模式）");
    }

    // 异步读取（回调模式）
    public static void asyncRead(Path file, CountDownLatch latch) throws IOException {
        AsynchronousFileChannel channel = AsynchronousFileChannel.open(file, StandardOpenOption.READ);
        ByteBuffer buffer = ByteBuffer.allocate(1024);

        // 创建带上下文的附件
        ReadContext context = new ReadContext(channel, buffer, latch);

        channel.read(buffer, 0, context, new CompletionHandler<Integer, ReadContext>() {
            @Override
            public void completed(Integer result, ReadContext ctx) {
                System.out.println("[回调] 读取成功: " + result + " 字节");

                ctx.buffer.flip();
                String content = StandardCharsets.UTF_8.decode(ctx.buffer).toString();
                System.out.println("[回调] 内容:\n" + content);

                try {
                    ctx.channel.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                ctx.latch.countDown();
            }

            @Override
            public void failed(Throwable exc, ReadContext ctx) {
                System.err.println("[回调] 读取失败: " + exc.getMessage());
                try {
                    ctx.channel.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                ctx.latch.countDown();
            }
        });

        System.out.println("读取请求已提交（回调模式）");
    }

    // 读取上下文
    static class ReadContext {
        AsynchronousFileChannel channel;
        ByteBuffer buffer;
        CountDownLatch latch;

        ReadContext(AsynchronousFileChannel channel, ByteBuffer buffer, CountDownLatch latch) {
            this.channel = channel;
            this.buffer = buffer;
            this.latch = latch;
        }
    }
}
```

## 异步网络 I/O

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;

public class AsyncNetworkDemo {

    // 异步 TCP 服务器
    public static class AsyncServer {
        private AsynchronousServerSocketChannel serverChannel;

        public void start() throws IOException {
            serverChannel = AsynchronousServerSocketChannel.open();
            serverChannel.bind(new InetSocketAddress(8080));
            System.out.println("异步服务器启动，端口 8080");

            // 开始接受连接
            acceptConnection();
        }

        private void acceptConnection() {
            serverChannel.accept(null, new CompletionHandler<AsynchronousSocketChannel, Void>() {
                @Override
                public void completed(AsynchronousSocketChannel client, Void attachment) {
                    // 继续接受下一个连接
                    acceptConnection();

                    try {
                        System.out.println("新连接: " + client.getRemoteAddress());
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    // 处理客户端
                    handleClient(client);
                }

                @Override
                public void failed(Throwable exc, Void attachment) {
                    System.err.println("接受连接失败: " + exc.getMessage());
                }
            });
        }

        private void handleClient(AsynchronousSocketChannel client) {
            ByteBuffer buffer = ByteBuffer.allocate(1024);

            // 异步读取
            client.read(buffer, buffer, new CompletionHandler<Integer, ByteBuffer>() {
                @Override
                public void completed(Integer result, ByteBuffer buf) {
                    if (result == -1) {
                        try {
                            client.close();
                        } catch (IOException e) {
                            e.printStackTrace();
                        }
                        return;
                    }

                    buf.flip();
                    String message = StandardCharsets.UTF_8.decode(buf).toString();
                    System.out.println("收到: " + message.trim());

                    // 准备响应
                    buf.clear();
                    String response = "Echo: " + message;
                    buf.put(response.getBytes(StandardCharsets.UTF_8));
                    buf.flip();

                    // 异步写入
                    client.write(buf, buf, new CompletionHandler<Integer, ByteBuffer>() {
                        @Override
                        public void completed(Integer result, ByteBuffer buf) {
                            System.out.println("响应发送: " + result + " 字节");

                            // 继续读取
                            buf.clear();
                            handleClient(client);
                        }

                        @Override
                        public void failed(Throwable exc, ByteBuffer buf) {
                            System.err.println("写入失败: " + exc.getMessage());
                        }
                    });
                }

                @Override
                public void failed(Throwable exc, ByteBuffer buf) {
                    System.err.println("读取失败: " + exc.getMessage());
                }
            });
        }
    }

    // 异步 TCP 客户端
    public static class AsyncClient {
        public void connect(String host, int port) throws IOException, InterruptedException {
            AsynchronousSocketChannel channel = AsynchronousSocketChannel.open();
            CountDownLatch latch = new CountDownLatch(1);

            channel.connect(new InetSocketAddress(host, port), latch,
                new CompletionHandler<Void, CountDownLatch>() {
                    @Override
                    public void completed(Void result, CountDownLatch latch) {
                        System.out.println("连接成功!");

                        // 发送消息
                        String message = "Hello from async client!";
                        ByteBuffer buffer = ByteBuffer.wrap(message.getBytes(StandardCharsets.UTF_8));

                        channel.write(buffer, buffer, new CompletionHandler<Integer, ByteBuffer>() {
                            @Override
                            public void completed(Integer result, ByteBuffer buf) {
                                System.out.println("消息发送: " + result + " 字节");

                                // 读取响应
                                buf.clear();
                                channel.read(buf, buf, new CompletionHandler<Integer, ByteBuffer>() {
                                    @Override
                                    public void completed(Integer result, ByteBuffer buf) {
                                        buf.flip();
                                        String response = StandardCharsets.UTF_8.decode(buf).toString();
                                        System.out.println("收到响应: " + response);

                                        try {
                                            channel.close();
                                        } catch (IOException e) {
                                            e.printStackTrace();
                                        }
                                        latch.countDown();
                                    }

                                    @Override
                                    public void failed(Throwable exc, ByteBuffer buf) {
                                        exc.printStackTrace();
                                        latch.countDown();
                                    }
                                });
                            }

                            @Override
                            public void failed(Throwable exc, ByteBuffer buf) {
                                exc.printStackTrace();
                                latch.countDown();
                            }
                        });
                    }

                    @Override
                    public void failed(Throwable exc, CountDownLatch latch) {
                        System.err.println("连接失败: " + exc.getMessage());
                        latch.countDown();
                    }
                });

            latch.await();
        }
    }

    public static void main(String[] args) throws IOException, InterruptedException {
        // 启动服务器
        AsyncServer server = new AsyncServer();
        server.start();

        Thread.sleep(500);

        // 启动客户端
        AsyncClient client = new AsyncClient();
        client.connect("localhost", 8080);

        // 保持运行
        Thread.sleep(2000);
    }
}
```

## NIO 性能对比

```java
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.*;

public class NioPerformanceTest {
    private static final String TEST_FILE = "performance_test.dat";
    private static final int FILE_SIZE = 100 * 1024 * 1024;  // 100MB
    private static final int BUFFER_SIZE = 8192;

    public static void main(String[] args) throws IOException {
        // 创建测试文件
        System.out.println("创建 100MB 测试文件...");
        createTestFile();

        // 预热 JVM
        System.out.println("预热 JVM...");
        for (int i = 0; i < 3; i++) {
            readWithIO();
            readWithNIO();
            readWithNIODirect();
        }

        // 正式测试
        System.out.println("\n=== 性能测试结果 ===\n");

        long ioTime = benchmark("传统 IO (BufferedInputStream)", () -> readWithIO());
        long nioTime = benchmark("NIO (HeapByteBuffer)", () -> readWithNIO());
        long nioDirectTime = benchmark("NIO (DirectByteBuffer)", () -> readWithNIODirect());
        long mappedTime = benchmark("NIO (MappedByteBuffer)", () -> readWithMapped());

        // 对比
        System.out.println("\n=== 性能对比 ===");
        System.out.printf("NIO vs IO 提升: %.1f%%%n", (ioTime - nioTime) * 100.0 / ioTime);
        System.out.printf("Direct vs Heap 提升: %.1f%%%n", (nioTime - nioDirectTime) * 100.0 / nioTime);
        System.out.printf("Mapped vs IO 提升: %.1f%%%n", (ioTime - mappedTime) * 100.0 / ioTime);

        // 清理
        Files.deleteIfExists(Paths.get(TEST_FILE));
    }

    private static void createTestFile() throws IOException {
        byte[] data = new byte[BUFFER_SIZE];
        for (int i = 0; i < BUFFER_SIZE; i++) {
            data[i] = (byte) (i % 256);
        }

        try (FileOutputStream fos = new FileOutputStream(TEST_FILE);
             BufferedOutputStream bos = new BufferedOutputStream(fos)) {
            int times = FILE_SIZE / BUFFER_SIZE;
            for (int i = 0; i < times; i++) {
                bos.write(data);
            }
        }
    }

    // 传统 IO
    private static long readWithIO() throws IOException {
        try (FileInputStream fis = new FileInputStream(TEST_FILE);
             BufferedInputStream bis = new BufferedInputStream(fis, BUFFER_SIZE)) {
            byte[] buffer = new byte[BUFFER_SIZE];
            long total = 0;
            int read;
            while ((read = bis.read(buffer)) != -1) {
                total += read;
            }
            return total;
        }
    }

    // NIO 堆缓冲区
    private static long readWithNIO() throws IOException {
        try (FileChannel channel = FileChannel.open(Paths.get(TEST_FILE), StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);
            long total = 0;
            while (channel.read(buffer) != -1) {
                total += buffer.position();
                buffer.clear();
            }
            return total;
        }
    }

    // NIO 直接缓冲区
    private static long readWithNIODirect() throws IOException {
        try (FileChannel channel = FileChannel.open(Paths.get(TEST_FILE), StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocateDirect(BUFFER_SIZE);
            long total = 0;
            while (channel.read(buffer) != -1) {
                total += buffer.position();
                buffer.clear();
            }
            return total;
        }
    }

    // 内存映射文件
    private static long readWithMapped() throws IOException {
        try (FileChannel channel = FileChannel.open(Paths.get(TEST_FILE), StandardOpenOption.READ)) {
            long size = channel.size();
            java.nio.MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, size);
            long total = 0;
            while (buffer.hasRemaining()) {
                buffer.get();
                total++;
            }
            return total;
        }
    }

    private static long benchmark(String name, IOTask task) throws IOException {
        long start = System.nanoTime();
        task.run();
        long end = System.nanoTime();
        long timeMs = (end - start) / 1_000_000;
        System.out.printf("%-30s: %d ms%n", name, timeMs);
        return timeMs;
    }

    @FunctionalInterface
    interface IOTask {
        void run() throws IOException;
    }
}
```

## 最佳实践与常见陷阱

### Buffer 使用注意事项

```java
import java.nio.ByteBuffer;

public class BufferBestPractices {
    public static void main(String[] args) {
        // 1. 忘记调用 flip()
        ByteBuffer buffer = ByteBuffer.allocate(10);
        buffer.put((byte) 'A');
        // 错误：直接读取，position 不对
        // System.out.println(buffer.get());  // 读取的是空数据

        // 正确：先 flip()
        buffer.flip();
        System.out.println((char) buffer.get());  // A

        // 2. clear() vs compact()
        buffer.clear();  // 重置位置，但数据仍在
        buffer.put("Hello".getBytes());
        buffer.flip();
        buffer.get();  // 读取 'H'
        buffer.get();  // 读取 'e'

        // compact() 保留未读数据
        buffer.compact();  // "llo" 移到开头，position=3
        buffer.put((byte) '!');  // 追加
        buffer.flip();
        // 现在包含 "llo!"

        // 3. 直接缓冲区的正确使用
        // 不要频繁创建和销毁
        ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
        // 重复使用，只在最后释放
        // directBuffer = null;  // 等待 GC 回收

        // 4. 缓冲区大小选择
        // 文件操作: 4KB - 64KB
        // 网络操作: 根据实际数据大小选择
        // 避免过大导致内存浪费，过小导致频繁操作
    }
}
```

### Selector 最佳实践

```java
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.util.Iterator;

public class SelectorBestPractices {
    public static void selectorLoop(Selector selector) throws Exception {
        while (true) {
            int ready = selector.select();  // 阻塞

            // 1. 处理 select() 返回 0 的情况
            if (ready == 0) {
                continue;
            }

            Iterator<SelectionKey> keyIterator = selector.selectedKeys().iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();

                // 2. 检查 key 是否有效
                if (!key.isValid()) {
                    keyIterator.remove();
                    continue;
                }

                try {
                    // 3. 处理事件
                    if (key.isAcceptable()) {
                        // ...
                    }
                } catch (Exception e) {
                    // 4. 异常处理：关闭通道，取消注册
                    key.cancel();
                    key.channel().close();
                }

                // 5. 必须移除已处理的 key
                keyIterator.remove();
            }

            // 6. 定期检查并关闭空闲连接
            // cleanupIdleConnections();
        }
    }

    /*
     * 常见陷阱：
     *
     * 1. 忘记移除 selectedKeys 中的 key
     *    - 会导致同一事件被重复处理
     *
     * 2. 在错误的线程修改 interestOps
     *    - 应该在 Selector 所在线程修改
     *    - 或者使用 wakeup() + 队列
     *
     * 3. 不检查 key.isValid()
     *    - 可能抛出 CancelledKeyException
     *
     * 4. 忽略 OP_WRITE 事件
     *    - 只在有数据要写时才注册 OP_WRITE
     *    - 否则会导致 CPU 空转
     *
     * 5. 阻塞操作在事件循环中
     *    - 会阻塞所有其他连接的处理
     *    - 应该将耗时操作提交到线程池
     */
}
```

## 总结

### NIO 的核心优势

1. **高性能**：零拷贝、直接缓冲区、内存映射等技术显著提升 I/O 效率
2. **可扩展性**：单线程可处理数万连接，资源利用率极高
3. **灵活性**：面向缓冲区的设计允许数据回溯和批量处理
4. **异步支持**：真正的异步 I/O 操作，不阻塞主线程

### 适用场景

| 场景 | 推荐方案 |
|------|----------|
| 高并发网络服务器 | Selector + 多线程 Reactor |
| 大文件处理 | MappedByteBuffer |
| 文件复制 | transferTo/transferFrom |
| 简单文件操作 | Files 工具类 |
| 异步文件处理 | AsynchronousFileChannel |

### 技术选型建议

1. **简单场景**：使用 `java.nio.file.Files` 工具类，代码简洁易维护
2. **高并发网络**：基于 NIO 的框架如 Netty、Mina，避免重复造轮子
3. **大文件操作**：使用内存映射或 `transferTo`
4. **响应式编程**：考虑使用 Java 9+ 的 Flow API 或响应式框架

Java NIO 是构建高性能 Java 应用的基础技术，掌握其核心概念和最佳实践对于开发高并发服务器、处理大规模数据至关重要。虽然直接使用 NIO 编程较为复杂，但理解其原理有助于更好地使用基于 NIO 的高级框架。
