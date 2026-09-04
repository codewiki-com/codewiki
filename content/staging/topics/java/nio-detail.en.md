---
title: Java NIO In-Depth Analysis
description: "Master Java NIO's three core components: Buffer, Channel, and Selector. Learn non-blocking I/O programming patterns and develop high-performance network applications"
track: java
section: collections-streams
difficulty: advanced
tags:
  - Java
  - NIO
  - Buffer
  - Channel
  - Selector
  - Non-blocking IO
  - Multiplexing
status: imported
origin: old/src/content/docs/java/nio-detail.en.md
divergence: 0.208
issues:
  - category-casing
legacy:
  category: java
  subcategory: IO
  order: 14
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is Java NIO

Java NIO (New I/O) is a brand new I/O API introduced in Java 1.4, providing a completely different programming model from traditional I/O. The core features of NIO include:

- **Buffer-oriented**: Data must be read and written through Buffers, not directly through streams
- **Channel-based**: Channel is a bidirectional data transmission channel
- **Non-blocking I/O**: Threads don't need to wait for I/O operations to complete
- **Multiplexing**: A single thread can monitor multiple Channels simultaneously

### Historical Background

Traditional Java I/O (java.io package) uses a blocking, stream-oriented design. This model is efficient enough when handling a small number of connections, but reveals serious scalability issues in high-concurrency scenarios:

- **C10K Problem**: Each connection requires one thread; 10,000 connections require 10,000 threads
- **Thread overhead is huge**: Thread creation, destruction, and context switching consume significant CPU and memory
- **Resource waste**: Most threads remain blocked while waiting for I/O

Java NIO was created precisely to solve these problems, borrowing from operating system-level I/O multiplexing techniques (such as Linux's epoll or BSD's kqueue), enabling Java to build high-performance network servers.

### NIO's Three Core Components

| Component | Responsibility | Analogy |
|-----------|-----------------|---------|
| **Buffer** | Data container, transit hub for all data reads and writes | Shipping container |
| **Channel** | Data transmission channel, connects data sources and destinations | Transportation pipeline |
| **Selector** | I/O event multiplexer, monitors multiple Channels | Traffic control center |

```
┌─────────────────────────────────────────────────────────────┐
│                    Java NIO Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│   │ Channel  │     │ Channel  │     │ Channel  │            │
│   │ (Socket) │     │ (File)   │     │ (Socket) │            │
│   └────┬─────┘     └────┬─────┘     └────┬─────┘            │
│        │                │                │                   │
│        ▼                ▼                ▼                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   Selector                           │   │
│   │        (Monitors I/O events on Channels)            │   │
│   └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    Buffer                            │   │
│   │             (Transit hub for data reads/writes)      │   │
│   └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│                  [Application Processing]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

### Buffer Working Principle

A Buffer is essentially a read-write memory region controlled by four key attributes:

```java
// The four core attributes of Buffer (always satisfy: mark <= position <= limit <= capacity)
private int mark = -1;     // Mark position for reset()
private int position = 0;  // Current read/write position
private int limit;         // Boundary for reads and writes
private int capacity;      // Total buffer capacity (immutable)
```

**Buffer state transition diagram:**

```
Initial state (write mode):
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│   │   │   │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
↑                                       ↑
position=0                          limit=capacity=10

After writing "Hello":
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                    ↑                   ↑
                position=5          limit=capacity=10

After flip() to read mode:
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
↑                   ↑
position=0      limit=5

After reading 2 bytes:
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ H │ e │ l │ l │ o │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
        ↑           ↑
    position=2  limit=5
```

### Heap Buffer vs Direct Buffer

**Memory allocation comparison:**

```
Heap Buffer (HeapByteBuffer):
┌─────────────────────────────────────────────────────┐
│                    JVM Process                       │
│   ┌─────────────────────┐                           │
│   │      JVM Heap       │                           │
│   │   ┌─────────────┐   │   I/O operations require  │
│   │   │ HeapBuffer  │◄──┼──► copying to native mem  │
│   │   └─────────────┘   │                           │
│   └─────────────────────┘                           │
└─────────────────────────────────────────────────────┘

Direct Buffer (DirectByteBuffer):
┌─────────────────────────────────────────────────────┐
│                    JVM Process                       │
│   ┌─────────────────────┐   ┌─────────────────────┐ │
│   │      JVM Heap       │   │    Native Memory    │ │
│   │   ┌─────────────┐   │   │  ┌─────────────┐   │ │
│   │   │  Reference  │───┼───┼─►│DirectBuffer │   │ │
│   │   └─────────────┘   │   │  └─────────────┘   │ │
│   └─────────────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Channel Working Principle

Core differences between Channel and traditional I/O streams:

| Feature | Stream | Channel |
|---------|--------|---------|
| Data direction | Unidirectional (InputStream/OutputStream) | Bidirectional |
| Blocking mode | Must block | Configurable non-blocking |
| Data operation | Direct byte reading/writing | Must use Buffer |
| Selector compatibility | Not supported | Supported |

### Selector Multiplexing Principle

Selector is implemented based on operating system I/O multiplexing mechanisms:

- **Linux**: epoll
- **macOS/BSD**: kqueue
- **Windows**: IOCP (simulated via select)

```
Selector event processing flow:

    Channel1 ─┐                      ┌─► Handle READ event
    Channel2 ─┼──► Selector ──►│    ├─► Handle WRITE event
    Channel3 ─┤    (blocking)   │    ├─► Handle ACCEPT event
    Channel4 ─┘                      └─► Handle CONNECT event
                    │
                    ▼
              select() returns
              set of ready Channels
```

**SelectionKey event types:**

```java
SelectionKey.OP_ACCEPT  = 16  // Server-side: ready to accept connections
SelectionKey.OP_CONNECT = 8   // Client-side: ready to connect
SelectionKey.OP_READ    = 1   // Ready to read
SelectionKey.OP_WRITE   = 4   // Ready to write
```

## Key Points

### ByteBuffer Key Points

1. **Creation methods**
   - `allocate(int capacity)`: Heap buffer
   - `allocateDirect(int capacity)`: Direct buffer
   - `wrap(byte[] array)`: Wrap existing array

2. **Key operations**
   - `put()`: Write data
   - `get()`: Read data
   - `flip()`: Switch from write mode to read mode
   - `clear()`: Clear buffer (prepare for rewriting)
   - `compact()`: Compress buffer (retain unread data)
   - `rewind()`: Reset position to 0 (reread)

3. **Byte order handling**
   - `order(ByteOrder.BIG_ENDIAN)`: Big-endian
   - `order(ByteOrder.LITTLE_ENDIAN)`: Little-endian

### FileChannel Key Points

1. **Can only be obtained through**
   - `FileInputStream.getChannel()`
   - `FileOutputStream.getChannel()`
   - `RandomAccessFile.getChannel()`
   - `FileChannel.open(Path, OpenOption...)`

2. **FileChannel does not support non-blocking mode**

3. **Zero-copy methods**
   - `transferTo()`: Transfer from current Channel to destination Channel
   - `transferFrom()`: Transfer from source Channel to current Channel

### SocketChannel Key Points

1. **Support non-blocking mode**
   - `configureBlocking(false)`

2. **Connection operations**
   - `connect()`: Initiate connection
   - `finishConnect()`: Complete connection (in non-blocking mode)
   - `isConnected()`: Check if connected

3. **Read/write characteristics**
   - Non-blocking read may return 0 (no data available)
   - Non-blocking write may partially write

### Selector Key Points

1. **Three key collections**
   - `keys()`: All registered SelectionKeys
   - `selectedKeys()`: Ready SelectionKeys (requires manual removal)
   - `cancelledKeys()`: Cancelled SelectionKeys (internal use)

2. **Selection operations**
   - `select()`: Block until events are ready
   - `select(timeout)`: Blocking with timeout
   - `selectNow()`: Non-blocking, returns immediately

3. **Wakeup mechanism**
   - `wakeup()`: Wake up thread blocked in select()

## Code Examples

### ByteBuffer Complete Example

```java
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

public class ByteBufferDemo {

    public static void main(String[] args) {
        // 1. Create buffer
        ByteBuffer buffer = ByteBuffer.allocate(64);

        System.out.println("=== Initial State ===");
        printBufferState(buffer);

        // 2. Write data
        String message = "Hello, NIO!";
        buffer.put(message.getBytes(StandardCharsets.UTF_8));

        System.out.println("\n=== After Writing ===");
        printBufferState(buffer);

        // 3. Switch to read mode (critical step)
        buffer.flip();

        System.out.println("\n=== After flip() ===");
        printBufferState(buffer);

        // 4. Read data
        byte[] data = new byte[buffer.remaining()];
        buffer.get(data);
        System.out.println("Read content: " + new String(data, StandardCharsets.UTF_8));

        System.out.println("\n=== After Reading ===");
        printBufferState(buffer);

        // 5. Demonstrate compact() operation
        buffer.clear();
        buffer.put("ABCDEFGH".getBytes());
        buffer.flip();
        buffer.get(); // Read 'A'
        buffer.get(); // Read 'B'

        System.out.println("\n=== Before compact() after reading 2 bytes ===");
        printBufferState(buffer);

        buffer.compact(); // Move "CDEFGH" to the beginning

        System.out.println("\n=== After compact() ===");
        printBufferState(buffer);

        // 6. View buffers
        demonstrateViews();

        // 7. Byte order handling
        demonstrateByteOrder();
    }

    private static void printBufferState(ByteBuffer buffer) {
        System.out.printf("position=%d, limit=%d, capacity=%d, remaining=%d%n",
            buffer.position(), buffer.limit(), buffer.capacity(), buffer.remaining());
    }

    private static void demonstrateViews() {
        System.out.println("\n=== View Buffer Demonstration ===");

        ByteBuffer buffer = ByteBuffer.allocate(16);

        // Write 4 integers
        buffer.putInt(1);
        buffer.putInt(2);
        buffer.putInt(3);
        buffer.putInt(4);
        buffer.flip();

        // Convert to IntBuffer view
        java.nio.IntBuffer intView = buffer.asIntBuffer();
        System.out.println("IntBuffer capacity: " + intView.capacity());

        while (intView.hasRemaining()) {
            System.out.println("Integer: " + intView.get());
        }
    }

    private static void demonstrateByteOrder() {
        System.out.println("\n=== Byte Order Demonstration ===");

        ByteBuffer buffer = ByteBuffer.allocate(4);

        // Big-endian (default)
        buffer.order(ByteOrder.BIG_ENDIAN);
        buffer.putInt(0x12345678);
        buffer.flip();

        System.out.print("Big-endian bytes: ");
        while (buffer.hasRemaining()) {
            System.out.printf("0x%02X ", buffer.get());
        }
        System.out.println();

        // Little-endian
        buffer.clear();
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        buffer.putInt(0x12345678);
        buffer.flip();

        System.out.print("Little-endian bytes: ");
        while (buffer.hasRemaining()) {
            System.out.printf("0x%02X ", buffer.get());
        }
        System.out.println();
    }
}
```

### FileChannel File Operations Example

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
            // 1. Basic read/write
            basicReadWrite(testFile);

            // 2. Zero-copy file transfer
            zeroCopyTransfer(testFile);

            // 3. Memory-mapped files
            memoryMappedFile();

            // 4. Scatter/Gather I/O
            scatterGatherIO();

            // 5. File locking
            fileLocking(testFile);

        } finally {
            // Clean up test files
            Files.deleteIfExists(testFile);
            Files.deleteIfExists(Paths.get("nio_copy.txt"));
            Files.deleteIfExists(Paths.get("mapped.dat"));
            Files.deleteIfExists(Paths.get("protocol.dat"));
        }
    }

    /**
     * Basic FileChannel read/write operations
     */
    private static void basicReadWrite(Path path) throws IOException {
        System.out.println("=== FileChannel Basic Read/Write ===");

        // Write file
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            String content = "Java NIO FileChannel Example\nThis is the second line";
            ByteBuffer buffer = ByteBuffer.wrap(content.getBytes(StandardCharsets.UTF_8));

            int written = channel.write(buffer);
            System.out.println("Bytes written: " + written);

            // Force flush to disk
            channel.force(true);
        }

        // Read file
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer buffer = ByteBuffer.allocate((int) channel.size());

            int read = channel.read(buffer);
            System.out.println("Bytes read: " + read);

            buffer.flip();
            String content = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("File content:\n" + content);
        }
    }

    /**
     * Zero-copy file transfer
     */
    private static void zeroCopyTransfer(Path source) throws IOException {
        System.out.println("\n=== Zero-Copy File Transfer ===");

        Path dest = Paths.get("nio_copy.txt");

        try (FileChannel sourceChannel = FileChannel.open(source, StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(dest,
                     StandardOpenOption.CREATE,
                     StandardOpenOption.WRITE,
                     StandardOpenOption.TRUNCATE_EXISTING)) {

            long size = sourceChannel.size();
            long transferred = 0;

            // transferTo leverages OS zero-copy capability
            while (transferred < size) {
                transferred += sourceChannel.transferTo(
                    transferred, size - transferred, destChannel);
            }

            System.out.println("Transfer complete, total bytes transferred: " + transferred);
        }
    }

    /**
     * Memory-mapped file operations
     */
    private static void memoryMappedFile() throws IOException {
        System.out.println("\n=== Memory-Mapped Files ===");

        Path path = Paths.get("mapped.dat");
        long size = 1024 * 1024; // 1MB

        try (RandomAccessFile raf = new RandomAccessFile(path.toFile(), "rw");
             FileChannel channel = raf.getChannel()) {

            // Create read/write mapping
            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, size);

            // Directly operate on mapped memory
            String data = "Data written via memory mapping";
            byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
            mappedBuffer.put(bytes);

            // Write integer
            mappedBuffer.putInt(12345);

            // Force write to disk
            mappedBuffer.force();

            // Read to verify
            mappedBuffer.flip();
            byte[] readBytes = new byte[bytes.length];
            mappedBuffer.get(readBytes);
            System.out.println("Read string: " + new String(readBytes, StandardCharsets.UTF_8));
            System.out.println("Read integer: " + mappedBuffer.getInt());
        }
    }

    /**
     * Scatter/Gather I/O
     */
    private static void scatterGatherIO() throws IOException {
        System.out.println("\n=== Scatter/Gather I/O ===");

        Path path = Paths.get("protocol.dat");

        // Gather write
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE,
                StandardOpenOption.TRUNCATE_EXISTING)) {

            // Simulate protocol format: 4-byte header + body + 4-byte footer
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(64);
            ByteBuffer footer = ByteBuffer.allocate(4);

            header.putInt(12345);  // Message ID
            body.put("This is protocol body content".getBytes(StandardCharsets.UTF_8));
            footer.putInt(99999);  // Checksum

            header.flip();
            body.flip();
            footer.flip();

            ByteBuffer[] buffers = {header, body, footer};
            long written = channel.write(buffers);
            System.out.println("Gather write bytes: " + written);
        }

        // Scatter read
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            ByteBuffer header = ByteBuffer.allocate(4);
            ByteBuffer body = ByteBuffer.allocate(64);
            ByteBuffer footer = ByteBuffer.allocate(4);

            ByteBuffer[] buffers = {header, body, footer};
            long read = channel.read(buffers);
            System.out.println("Scatter read bytes: " + read);

            header.flip();
            body.flip();
            footer.flip();

            System.out.println("Message ID: " + header.getInt());
            System.out.println("Body: " + StandardCharsets.UTF_8.decode(body).toString().trim());
            System.out.println("Checksum: " + footer.getInt());
        }
    }

    /**
     * File locking operations
     */
    private static void fileLocking(Path path) throws IOException {
        System.out.println("\n=== File Locking ===");

        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.READ, StandardOpenOption.WRITE)) {

            // Acquire exclusive lock (blocking)
            java.nio.channels.FileLock lock = channel.lock();
            System.out.println("Exclusive lock acquired, is shared: " + lock.isShared());

            // Simulate holding lock
            Thread.sleep(100);

            // Release lock
            lock.release();
            System.out.println("Lock released");

            // Try to acquire lock (non-blocking)
            java.nio.channels.FileLock tryLock = channel.tryLock();
            if (tryLock != null) {
                System.out.println("tryLock succeeded");
                tryLock.release();
            } else {
                System.out.println("tryLock failed, file is locked");
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### SocketChannel Network Communication Example

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;

public class SocketChannelDemo {

    /**
     * Blocking mode client
     */
    public static void blockingClient(String host, int port) throws IOException {
        try (SocketChannel channel = SocketChannel.open()) {
            // Default is blocking mode
            channel.connect(new InetSocketAddress(host, port));

            System.out.println("Connected to server: " + channel.getRemoteAddress());

            // Send data
            String message = "Hello from blocking client!";
            ByteBuffer buffer = ByteBuffer.wrap(message.getBytes(StandardCharsets.UTF_8));
            channel.write(buffer);

            // Receive response
            buffer = ByteBuffer.allocate(1024);
            int read = channel.read(buffer);
            if (read > 0) {
                buffer.flip();
                String response = StandardCharsets.UTF_8.decode(buffer).toString();
                System.out.println("Server response: " + response);
            }
        }
    }

    /**
     * Non-blocking mode client
     */
    public static void nonBlockingClient(String host, int port) throws IOException {
        try (SocketChannel channel = SocketChannel.open()) {
            // Set non-blocking mode
            channel.configureBlocking(false);

            // Initiate non-blocking connection
            channel.connect(new InetSocketAddress(host, port));

            // Wait for connection completion
            while (!channel.finishConnect()) {
                System.out.println("Connecting...");
                // Can perform other tasks here
            }

            System.out.println("Connected: " + channel.getRemoteAddress());

            // Send data
            ByteBuffer buffer = ByteBuffer.wrap("Hello from non-blocking client!".getBytes(StandardCharsets.UTF_8));
            while (buffer.hasRemaining()) {
                int written = channel.write(buffer);
                // Non-blocking mode may write 0 bytes
                if (written == 0) {
                    Thread.yield(); // Yield CPU
                }
            }

            // Receive response
            buffer = ByteBuffer.allocate(1024);
            int totalRead = 0;
            int retries = 0;

            while (totalRead == 0 && retries < 100) {
                int read = channel.read(buffer);
                if (read > 0) {
                    totalRead += read;
                } else if (read == 0) {
                    // No data available, retry later
                    try {
                        Thread.sleep(10);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    retries++;
                } else {
                    // read == -1, connection closed
                    break;
                }
            }

            if (totalRead > 0) {
                buffer.flip();
                System.out.println("Server response: " + StandardCharsets.UTF_8.decode(buffer).toString());
            }
        }
    }
}
```

### Selector Multiplexing Server Complete Example

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Set;

/**
 * Non-blocking Echo server based on Selector
 */
public class NioEchoServer {

    private static final int PORT = 8080;
    private static final int BUFFER_SIZE = 1024;

    private Selector selector;
    private ServerSocketChannel serverChannel;
    private volatile boolean running = true;

    public void start() throws IOException {
        // 1. Create Selector
        selector = Selector.open();

        // 2. Create ServerSocketChannel
        serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false); // Must set non-blocking

        // 3. Register with Selector, listen for ACCEPT events
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO Server started, listening on port: " + PORT);

        // 4. Event loop
        while (running) {
            try {
                // Block waiting for events (can set timeout)
                int readyCount = selector.select(1000);

                if (readyCount == 0) {
                    continue;
                }

                // 5. Process ready events
                Set<SelectionKey> selectedKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectedKeys.iterator();

                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    iterator.remove(); // Must remove manually

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
                        System.err.println("Event handling exception: " + e.getMessage());
                        closeChannel(key);
                    }
                }

            } catch (IOException e) {
                System.err.println("Selector exception: " + e.getMessage());
            }
        }
    }

    /**
     * Handle new connections
     */
    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel server = (ServerSocketChannel) key.channel();
        SocketChannel client = server.accept();

        if (client == null) {
            return; // Non-blocking mode may return null
        }

        client.configureBlocking(false);

        // Create independent buffer for each client
        ByteBuffer buffer = ByteBuffer.allocate(BUFFER_SIZE);

        // Register read event, attach Buffer
        client.register(selector, SelectionKey.OP_READ, buffer);

        System.out.println("New connection: " + client.getRemoteAddress());
    }

    /**
     * Handle read events
     */
    private void handleRead(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = client.read(buffer);

        if (bytesRead == -1) {
            // Client closed connection
            System.out.println("Client disconnected: " + client.getRemoteAddress());
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();

            // Parse message
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("Received message: " + message.trim());

            // Prepare response data
            buffer.clear();
            String response = "Echo: " + message;
            buffer.put(response.getBytes(StandardCharsets.UTF_8));
            buffer.flip();

            // Switch to write event
            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    /**
     * Handle write events
     */
    private void handleWrite(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        // Write data
        while (buffer.hasRemaining()) {
            int written = client.write(buffer);
            if (written == 0) {
                // Send buffer full, wait for next write event
                return;
            }
        }

        // Write complete, clear buffer, switch back to read event
        buffer.clear();
        key.interestOps(SelectionKey.OP_READ);
    }

    /**
     * Close channel
     */
    private void closeChannel(SelectionKey key) {
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException e) {
            System.err.println("Failed to close channel: " + e.getMessage());
        }
    }

    /**
     * Stop server
     */
    public void stop() {
        running = false;
        if (selector != null) {
            selector.wakeup();
        }
    }

    public static void main(String[] args) {
        NioEchoServer server = new NioEchoServer();

        // Add shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Shutting down server...");
            server.stop();
        }));

        try {
            server.start();
        } catch (IOException e) {
            System.err.println("Server startup failed: " + e.getMessage());
        }
    }
}
```

### Multi-threaded Reactor Pattern Example

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
 * Multi-threaded Reactor pattern server
 * - Main Reactor: Handles connection acceptance
 * - Sub Reactors: Handle I/O events
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
        // Initialize Main Reactor
        mainSelector = Selector.open();
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress(PORT));
        serverChannel.configureBlocking(false);
        serverChannel.register(mainSelector, SelectionKey.OP_ACCEPT);

        // Initialize Sub Reactors
        subSelectors = new Selector[SUB_REACTOR_COUNT];
        reactorPool = Executors.newFixedThreadPool(SUB_REACTOR_COUNT);

        for (int i = 0; i < SUB_REACTOR_COUNT; i++) {
            subSelectors[i] = Selector.open();
            int reactorId = i;
            reactorPool.submit(() -> runSubReactor(reactorId));
        }

        System.out.println("Multi-Reactor server started");
        System.out.println("Main Reactor: 1, Sub Reactors: " + SUB_REACTOR_COUNT);
        System.out.println("Listening on port: " + PORT);

        // Main Reactor event loop
        runMainReactor();
    }

    /**
     * Main Reactor - handles only connection events
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
            System.err.println("Main Reactor exception: " + e.getMessage());
        }
    }

    /**
     * Sub Reactor - handles I/O events
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
            System.err.println("Sub Reactor " + reactorId + " exception: " + e.getMessage());
        }
    }

    /**
     * Handle new connections, distribute to Sub Reactors in round-robin fashion
     */
    private void handleAccept(SelectionKey key) throws IOException {
        ServerSocketChannel server = (ServerSocketChannel) key.channel();
        SocketChannel client = server.accept();

        if (client == null) return;

        client.configureBlocking(false);

        // Round-robin selection of Sub Reactor
        int reactorIndex = Math.abs(nextReactor.getAndIncrement() % SUB_REACTOR_COUNT);
        Selector subSelector = subSelectors[reactorIndex];

        // Wake up Sub Reactor for registering new channel
        subSelector.wakeup();

        // Register with selected Sub Reactor
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        client.register(subSelector, SelectionKey.OP_READ, buffer);

        System.out.println("[Main] New connection assigned to Reactor-" + reactorIndex +
                          ": " + client.getRemoteAddress());
    }

    private void handleRead(SelectionKey key, int reactorId) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        int bytesRead = client.read(buffer);

        if (bytesRead == -1) {
            System.out.println("[Reactor-" + reactorId + "] Client disconnected");
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();
            String message = StandardCharsets.UTF_8.decode(buffer).toString();
            System.out.println("[Reactor-" + reactorId + "] Received: " + message.trim());

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

## Best Practices

### Buffer Usage Best Practices

```java
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.io.IOException;

public class BufferBestPractices {

    /**
     * 1. Always use Buffer in try-finally to ensure resource cleanup
     */
    public void properBufferUsage() {
        ByteBuffer buffer = ByteBuffer.allocateDirect(1024);
        try {
            // Use buffer
        } finally {
            // For DirectByteBuffer, although there's no explicit release method,
            // we can set to null for GC
            buffer = null;
            System.gc(); // Suggest GC (not guaranteed immediate execution)
        }
    }

    /**
     * 2. Reuse buffers rather than frequently creating new ones
     */
    private static final ThreadLocal<ByteBuffer> BUFFER_CACHE =
        ThreadLocal.withInitial(() -> ByteBuffer.allocate(8192));

    public void reuseBuffer() {
        ByteBuffer buffer = BUFFER_CACHE.get();
        buffer.clear(); // Reset state
        // Use buffer
    }

    /**
     * 3. Correctly handle partial reads/writes
     */
    public void handlePartialReadWrite(SocketChannel channel) throws IOException {
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        buffer.put("Hello, World!".getBytes());
        buffer.flip();

        // Non-blocking mode may not write all data at once
        while (buffer.hasRemaining()) {
            int written = channel.write(buffer);
            if (written == 0) {
                // Send buffer full, should register OP_WRITE and wait
                break;
            }
        }

        // If data remains, use compact() instead of clear()
        if (buffer.hasRemaining()) {
            buffer.compact();
        } else {
            buffer.clear();
        }
    }

    /**
     * 4. Choose appropriate buffer type based on scenario
     */
    public ByteBuffer chooseBufferType(String scenario) {
        switch (scenario) {
            case "short-lived":
                // Short-term use: heap buffer, fast allocation/deallocation
                return ByteBuffer.allocate(1024);

            case "large-file":
                // Large file operations: direct buffer, reduce copying
                return ByteBuffer.allocateDirect(64 * 1024);

            case "network":
                // Network I/O: direct buffer, better performance
                return ByteBuffer.allocateDirect(8 * 1024);

            default:
                return ByteBuffer.allocate(1024);
        }
    }
}
```

### Selector Usage Best Practices

```java
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.SocketChannel;
import java.nio.ByteBuffer;
import java.util.Queue;
import java.util.Set;
import java.util.Iterator;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.io.IOException;

public class SelectorBestPractices {

    /**
     * 1. Correct event loop structure
     */
    public void eventLoop(Selector selector) throws IOException {
        while (true) {
            // Set reasonable timeout
            int ready = selector.select(1000);

            if (ready == 0) {
                // Can perform maintenance tasks, e.g., check idle connections
                checkIdleConnections();
                continue;
            }

            Set<SelectionKey> keys = selector.selectedKeys();
            Iterator<SelectionKey> iterator = keys.iterator();

            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();
                // Must remove before processing
                iterator.remove();

                // Check if key is valid
                if (!key.isValid()) {
                    continue;
                }

                try {
                    processKey(key);
                } catch (Exception e) {
                    // Single connection exception shouldn't affect others
                    handleError(key, e);
                }
            }
        }
    }

    /**
     * 2. Correctly handle OP_WRITE events
     */
    public void handleWriteCorrectly(SelectionKey key, ByteBuffer data) throws IOException {
        // Only register OP_WRITE when there's data to send
        if (data.hasRemaining()) {
            key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);
        }
    }

    public void onWritable(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        channel.write(buffer);

        // Immediately cancel OP_WRITE after writing to avoid CPU spinning
        if (!buffer.hasRemaining()) {
            key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);
        }
    }

    /**
     * 3. Modify interestOps in the correct thread
     */
    private ConcurrentLinkedQueue<Runnable> pendingTasks = new ConcurrentLinkedQueue<>();

    public void safeModifyInterestOps(SelectionKey key, int ops) {
        // If in other thread, add to task queue
        pendingTasks.offer(() -> key.interestOps(ops));
        // Wake up Selector to process tasks
        key.selector().wakeup();
    }

    public void processPendingTasks() {
        Runnable task;
        while ((task = pendingTasks.poll()) != null) {
            task.run();
        }
    }

    private void checkIdleConnections() {
        // Periodically check and close idle connections
    }

    private void processKey(SelectionKey key) throws IOException {
        // Process event
    }

    private void handleError(SelectionKey key, Exception e) {
        // Close problematic connection
        try {
            key.cancel();
            key.channel().close();
        } catch (IOException ignored) {}
    }
}
```

### Direct Buffer Usage Guidelines

```java
import java.nio.ByteBuffer;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class DirectBufferGuidelines {

    // Use object pool to manage direct buffers
    private static final int BUFFER_SIZE = 8192;
    private static final int POOL_SIZE = 100;
    private static final Queue<ByteBuffer> bufferPool = new ConcurrentLinkedQueue<>();

    static {
        // Pre-create buffers
        for (int i = 0; i < POOL_SIZE; i++) {
            bufferPool.offer(ByteBuffer.allocateDirect(BUFFER_SIZE));
        }
    }

    /**
     * Acquire buffer from pool
     */
    public static ByteBuffer acquire() {
        ByteBuffer buffer = bufferPool.poll();
        if (buffer == null) {
            // Pool empty, create new
            buffer = ByteBuffer.allocateDirect(BUFFER_SIZE);
        }
        buffer.clear();
        return buffer;
    }

    /**
     * Return buffer to pool
     */
    public static void release(ByteBuffer buffer) {
        if (buffer.isDirect()) {
            buffer.clear();
            bufferPool.offer(buffer);
        }
    }

    /**
     * Usage example
     */
    public void example() {
        ByteBuffer buffer = acquire();
        try {
            // Use buffer
        } finally {
            release(buffer);
        }
    }
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to call flip()

```java
// Wrong example
ByteBuffer buffer = ByteBuffer.allocate(100);
buffer.put("Hello".getBytes());
// Forget flip(), read directly
byte b = buffer.get(); // Reads empty data!

// Correct example
ByteBuffer buffer = ByteBuffer.allocate(100);
buffer.put("Hello".getBytes());
buffer.flip(); // Switch to read mode
byte b = buffer.get(); // Correctly reads 'H'
```

### Pitfall 2: Forgetting to remove selectedKeys

```java
// Wrong example
while (true) {
    selector.select();
    for (SelectionKey key : selector.selectedKeys()) {
        // Handle event
        // Forget to remove key, next loop will handle it again!
    }
}

// Correct example
while (true) {
    selector.select();
    Iterator<SelectionKey> iter = selector.selectedKeys().iterator();
    while (iter.hasNext()) {
        SelectionKey key = iter.next();
        iter.remove(); // Must remove
        // Handle event
    }
}
```

### Pitfall 3: OP_WRITE causes CPU spinning

```java
// Wrong example: always register OP_WRITE
channel.register(selector, SelectionKey.OP_READ | SelectionKey.OP_WRITE);
// Problem: isWritable() returns true even without data to write, causing spinning

// Correct example: only register OP_WRITE when there's data to write
channel.register(selector, SelectionKey.OP_READ);
// ...
if (hasDataToWrite) {
    key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);
}
// Cancel OP_WRITE after writing
key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);
```

### Pitfall 4: Non-blocking read/write return value handling

```java
// Wrong example: assume all data is read at once
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer); // May return 0!
buffer.flip();
// May read incomplete data

// Correct example: loop read until no more data
ByteBuffer buffer = ByteBuffer.allocate(1024);
int totalRead = 0;
while (true) {
    int read = channel.read(buffer);
    if (read == -1) {
        // Connection closed
        break;
    } else if (read == 0) {
        // No data available, wait for next read event
        break;
    } else {
        totalRead += read;
    }
}
```

### Pitfall 5: Direct buffer memory leak

```java
// Wrong example: frequently create direct buffers
public void process() {
    ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024);
    // Use buffer...
    // Buffer won't be released immediately after method ends!
}

// Correct example: reuse direct buffers
private final ByteBuffer buffer = ByteBuffer.allocateDirect(1024 * 1024);

public void process() {
    buffer.clear();
    // Use buffer...
}
```

### Pitfall 6: Multi-threaded SelectionKey modification

```java
// Wrong example: modify in other thread directly
new Thread(() -> {
    key.interestOps(SelectionKey.OP_WRITE); // May cause issues
}).start();

// Correct example: modify through Selector thread
pendingChanges.add(() -> key.interestOps(SelectionKey.OP_WRITE));
selector.wakeup();

// Process in Selector thread
while ((change = pendingChanges.poll()) != null) {
    change.run();
}
```

## Performance Considerations

### Buffer Performance Comparison

```java
/**
 * Performance test for different Buffer types
 */
public class BufferPerformanceTest {

    private static final int ITERATIONS = 1_000_000;
    private static final int BUFFER_SIZE = 1024;

    public static void main(String[] args) {
        // Warm-up
        for (int i = 0; i < 10; i++) {
            testHeapBuffer();
            testDirectBuffer();
        }

        // Formal test
        long heapTime = benchmark("Heap Buffer", BufferPerformanceTest::testHeapBuffer);
        long directTime = benchmark("Direct Buffer", BufferPerformanceTest::testDirectBuffer);

        System.out.println("\nPerformance comparison:");
        System.out.printf("Direct vs Heap improvement: %.2f%%%n",
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

### I/O Performance Optimization Recommendations

| Scenario | Optimization Strategy | Expected Improvement |
|----------|----------------------|----------------------|
| Large file copy | Use `transferTo/transferFrom` | 30-50% |
| Frequent small file read/write | Use heap buffer | Faster allocation |
| Network I/O | Use direct buffer | Reduce copying |
| Super large files | Use memory mapping | Significant improvement |
| High concurrent connections | Multi-Reactor + thread pool | Linear scaling |

### Selector Performance Tuning

```java
import java.nio.channels.Selector;
import java.nio.channels.SelectionKey;
import java.nio.channels.SocketChannel;
import java.nio.ByteBuffer;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.io.IOException;

/**
 * Selector performance optimization configuration
 */
public class SelectorOptimization {

    /**
     * 1. Set reasonable select timeout
     */
    public void selectTimeout(Selector selector) throws IOException {
        // Too short: high CPU usage
        // Too long: slow response
        // Recommended: 100-1000ms based on business scenario
        selector.select(500);
    }

    /**
     * 2. Avoid time-consuming operations in event loop
     */
    private ExecutorService workerPool = Executors.newFixedThreadPool(
        Runtime.getRuntime().availableProcessors()
    );

    public void handleReadAsync(SelectionKey key) {
        // Submit time-consuming business processing to thread pool
        workerPool.submit(() -> {
            try {
                processBusinessLogic(key);
            } catch (Exception e) {
                // Exception handling
            }
        });
    }

    /**
     * 3. Batch write operations
     */
    public void batchWrite(SocketChannel channel, List<ByteBuffer> buffers)
            throws IOException {
        // Use GatheringByteChannel to batch write
        ByteBuffer[] array = buffers.toArray(new ByteBuffer[0]);
        channel.write(array);
    }

    private void processBusinessLogic(SelectionKey key) {
        // Business processing logic
    }
}
```

## Real-world Scenarios

### Scenario 1: High-performance File Server

```java
import java.nio.channels.FileChannel;
import java.nio.channels.SocketChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.ByteBuffer;
import java.io.IOException;

/**
 * File server supporting resume on breakpoint
 */
public class FileServer {

    public void serveFile(SocketChannel client, Path filePath, long offset)
            throws IOException {
        try (FileChannel fileChannel = FileChannel.open(filePath, StandardOpenOption.READ)) {
            long fileSize = fileChannel.size();
            long remaining = fileSize - offset;

            // Send file info header
            ByteBuffer header = ByteBuffer.allocate(16);
            header.putLong(fileSize);
            header.putLong(remaining);
            header.flip();
            client.write(header);

            // Use zero-copy to transfer file
            long transferred = 0;
            while (transferred < remaining) {
                long count = fileChannel.transferTo(
                    offset + transferred,
                    remaining - transferred,
                    client
                );
                if (count == 0) {
                    // Send buffer full, wait for writable
                    break;
                }
                transferred += count;
            }
        }
    }
}
```

### Scenario 2: Real-time Chat Server

```java
import java.nio.channels.SocketChannel;
import java.nio.channels.Selector;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.io.IOException;

/**
 * Simple chat room server
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
            broadcast(username + " joined the chat room", client);
        } catch (IOException e) {
            // Handle exception
        }
    }

    public void handleLeave(SocketChannel client) {
        String username = clients.remove(client);
        if (username != null) {
            try {
                broadcast(username + " left the chat room", client);
            } catch (IOException e) {
                // Handle exception
            }
        }
    }
}
```

### Scenario 3: Proxy Server

```java
import java.nio.channels.SocketChannel;
import java.nio.channels.Selector;
import java.nio.channels.SelectionKey;
import java.nio.ByteBuffer;
import java.net.InetSocketAddress;
import java.io.IOException;

/**
 * Simple TCP proxy
 */
public class TcpProxy {

    public void proxyConnection(SocketChannel client, String targetHost, int targetPort)
            throws IOException {

        SocketChannel target = SocketChannel.open();
        target.configureBlocking(false);
        target.connect(new InetSocketAddress(targetHost, targetPort));

        // Wait for connection completion
        while (!target.finishConnect()) {
            Thread.yield();
        }

        ByteBuffer buffer = ByteBuffer.allocateDirect(8192);

        // Bidirectional data forwarding
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
                        // Connection closed
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

## Interview Key Points

### Differences between NIO and BIO

**Key answer points:**
- BIO is stream-oriented, NIO is buffer-oriented
- BIO is blocking, NIO supports non-blocking
- BIO uses one thread per connection, NIO uses one thread for multiple connections
- NIO has Selector multiplexing mechanism

### Differences between Buffer's flip() and clear()

**Key answer points:**
- `flip()`: Sets limit to current position, position to 0, prepares for reading
- `clear()`: Sets position to 0, limit to capacity, prepares for writing
- `compact()`: Moves unread data to beginning, sets position to unread data length

### Differences between direct and heap buffers

**Key answer points:**
- Heap buffers are in JVM heap memory, managed by GC
- Direct buffers are in native memory, better I/O performance
- Direct buffers have high allocation/deallocation costs
- Heavy use of direct buffers may cause OOM

### How Selector works

**Key answer points:**
- Based on OS I/O multiplexing (epoll/kqueue)
- Channels register with Selector, specify interested events
- select() blocks waiting for events
- Returns ready SelectionKey collection for processing

### Why is NIO more performant?

**Key answer points:**
- Reduces thread count, lowers context switching overhead
- Non-blocking I/O avoids thread waiting
- Direct buffers reduce data copying
- Selector's efficient event notification mechanism

### How to solve the NIO busy-loop bug?

**Key answer points:**
- Some Linux versions have epoll implementation bugs
- Causes select() to return even without events
- Solution: detect busy-loop count, rebuild Selector at threshold
- Frameworks like Netty have built-in solutions

```java
int selectCnt = 0;
while (true) {
    int ready = selector.select(timeoutMs);
    if (ready == 0) {
        selectCnt++;
        if (selectCnt >= 512) {
            // Rebuild Selector
            selector = rebuildSelector();
            selectCnt = 0;
        }
    } else {
        selectCnt = 0;
        // Handle events
    }
}
```

### Why doesn't FileChannel support non-blocking?

**Key answer points:**
- File I/O differs from network I/O characteristics
- File data is always "ready", no need to wait
- OS file I/O is typically synchronous
- For async file operations, use AsynchronousFileChannel

## Further Reading

### Official Documentation
- [Java NIO Tutorial (Oracle)](https://docs.oracle.com/javase/tutorial/essential/io/index.html)
- [Java NIO API Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/package-summary.html)

### Classic Books
- "Java NIO" - Ron Hitchens
- "Netty in Action" - Norman Maurer
- "Java Concurrency in Practice" - Brian Goetz

### Advanced Learning
- Netty framework source code
- Reactor vs Proactor pattern
- Linux epoll mechanism
- Zero-copy techniques (sendfile, mmap)

### Related Technologies
- Netty - High-performance network framework
- gRPC - High-performance RPC framework
- Project Loom - Virtual threads (Java 21+)
