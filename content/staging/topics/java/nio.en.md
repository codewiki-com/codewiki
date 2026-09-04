---
title: NIO Non-blocking IO
description: Complete guide to Java NIO, Channels, Buffers, Selectors and non-blocking programming
track: java
section: collections-streams
difficulty: advanced
tags:
  - Java
  - NIO
  - Channel
  - Non-blocking
status: imported
origin: old/src/content/docs/java/nio.en.md
divergence: 0.207
issues: []
legacy:
  category: Java
  subcategory: IO
  order: 13
  lastUpdated: 2026-01-07
---

Java NIO (New I/O) was introduced in Java 1.4 as a modern alternative to the traditional blocking I/O API. It provides a more efficient and scalable approach to handling I/O operations, particularly for high-performance network applications. We cover all essential aspects of Java NIO, from core concepts to practical implementations.

---

## Introduction to NIO

Java NIO is built around three core components:

- **Buffers**: Containers for data that is read from or written to channels
- **Channels**: Bidirectional conduits for I/O operations
- **Selectors**: Multiplexors that enable a single thread to monitor multiple channels

The key advantage of NIO is its support for non-blocking operations, allowing a single thread to manage multiple I/O channels efficiently.

```java
// Basic NIO imports
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.channels.SocketChannel;
import java.nio.channels.Selector;
import java.nio.channels.SelectionKey;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
```

---

## NIO vs Traditional IO

Understanding the differences between NIO and traditional IO is crucial for choosing the right approach for your application.

### Traditional IO (Blocking)

| Characteristic | Traditional IO |
|----------------|----------------|
| Data Flow | Stream-oriented (byte by byte) |
| Blocking | Always blocking |
| Thread Model | One thread per connection |
| Data Direction | Unidirectional (InputStream or OutputStream) |

### NIO (Non-blocking)

| Characteristic | NIO |
|----------------|-----|
| Data Flow | Buffer-oriented (block by block) |
| Blocking | Can be non-blocking |
| Thread Model | Single thread can handle multiple channels |
| Data Direction | Bidirectional through channels |

### When to Use Each

**Use Traditional IO when:**
- Simple file operations with small files
- Low concurrency requirements
- Code simplicity is more important than performance

**Use NIO when:**
- Handling thousands of simultaneous connections
- Building high-performance servers
- Working with large files
- Need for non-blocking operations

```java
// Traditional IO - blocks until data is available
InputStream input = socket.getInputStream();
byte[] data = new byte[1024];
int bytesRead = input.read(data); // Blocks here

// NIO - can be configured to return immediately
SocketChannel channel = SocketChannel.open();
channel.configureBlocking(false);
ByteBuffer buffer = ByteBuffer.allocate(1024);
int bytesRead = channel.read(buffer); // Returns immediately, may read 0 bytes
```

---

## Buffers

Buffers are fundamental to NIO operations. They are containers that hold data during I/O transfers.

### Buffer Types

Java NIO provides a buffer type for each primitive data type:

- `ByteBuffer` - Most commonly used
- `CharBuffer` - For character data
- `ShortBuffer`, `IntBuffer`, `LongBuffer` - For numeric types
- `FloatBuffer`, `DoubleBuffer` - For floating-point types

### Buffer Properties

Every buffer has four essential properties:

```java
ByteBuffer buffer = ByteBuffer.allocate(1024);

// Capacity: Maximum number of elements the buffer can hold (fixed)
int capacity = buffer.capacity();  // 1024

// Position: Index of the next element to be read or written
int position = buffer.position();  // 0 initially

// Limit: First element that should not be read or written
int limit = buffer.limit();  // equals capacity initially

// Mark: A remembered position (optional)
buffer.mark();  // Sets mark at current position
buffer.reset(); // Returns position to the mark
```

### Creating Buffers

```java
// Allocate a new buffer
ByteBuffer heapBuffer = ByteBuffer.allocate(1024);

// Allocate a direct buffer (faster I/O, but slower allocation)
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);

// Wrap an existing array
byte[] array = new byte[1024];
ByteBuffer wrappedBuffer = ByteBuffer.wrap(array);

// Wrap with offset and length
ByteBuffer partialWrap = ByteBuffer.wrap(array, 100, 500);
```

### Buffer Operations

#### Writing Data to a Buffer

```java
ByteBuffer buffer = ByteBuffer.allocate(48);

// Put individual bytes
buffer.put((byte) 127);
buffer.put((byte) -128);

// Put an array
byte[] data = {1, 2, 3, 4, 5};
buffer.put(data);

// Put at a specific index (doesn't change position)
buffer.put(10, (byte) 99);

// Put typed data
buffer.putInt(42);       // 4 bytes
buffer.putLong(123456L); // 8 bytes
buffer.putDouble(3.14);  // 8 bytes
```

#### Reading Data from a Buffer

```java
// Flip the buffer for reading (sets limit=position, position=0)
buffer.flip();

// Read individual bytes
byte b = buffer.get();

// Read into an array
byte[] dst = new byte[5];
buffer.get(dst);

// Read at a specific index (doesn't change position)
byte atIndex = buffer.get(10);

// Read typed data
int intValue = buffer.getInt();
long longValue = buffer.getLong();
double doubleValue = buffer.getDouble();
```

#### Buffer State Transitions

```java
ByteBuffer buffer = ByteBuffer.allocate(10);

// After allocation: position=0, limit=capacity=10
// [_, _, _, _, _, _, _, _, _, _]
//  ^position                   ^limit/capacity

buffer.put(new byte[]{1, 2, 3, 4, 5});
// After writing: position=5, limit=10
// [1, 2, 3, 4, 5, _, _, _, _, _]
//                 ^position     ^limit

buffer.flip();
// After flip: position=0, limit=5
// [1, 2, 3, 4, 5, _, _, _, _, _]
//  ^position      ^limit

buffer.get();
buffer.get();
buffer.get();
// After reading 3 bytes: position=3, limit=5
// [1, 2, 3, 4, 5, _, _, _, _, _]
//           ^position ^limit

buffer.compact();
// After compact: remaining data moved to beginning, ready for writing
// [4, 5, _, _, _, _, _, _, _, _]
//        ^position              ^limit=capacity

buffer.clear();
// After clear: position=0, limit=capacity (data not erased, just forgotten)
// [4, 5, _, _, _, _, _, _, _, _]
//  ^position                   ^limit
```

### Practical Buffer Example

```java
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class BufferExample {

    public static void main(String[] args) {
        // Create a buffer and write a string
        ByteBuffer buffer = ByteBuffer.allocate(256);

        String message = "Hello, Java NIO!";
        buffer.put(message.getBytes(StandardCharsets.UTF_8));

        // Prepare for reading
        buffer.flip();

        // Read the data back
        byte[] bytes = new byte[buffer.remaining()];
        buffer.get(bytes);

        String retrieved = new String(bytes, StandardCharsets.UTF_8);
        System.out.println("Retrieved: " + retrieved);

        // Demonstrate buffer views
        buffer.clear();
        buffer.putInt(1);
        buffer.putInt(2);
        buffer.putInt(3);
        buffer.putInt(4);
        buffer.flip();

        // Create an IntBuffer view
        java.nio.IntBuffer intView = buffer.asIntBuffer();
        while (intView.hasRemaining()) {
            System.out.println("Int value: " + intView.get());
        }
    }
}
```

---

## Channels

Channels are bidirectional conduits for I/O operations. Unlike streams, channels can both read and write data.

### Channel Types

| Channel Type | Description |
|--------------|-------------|
| `FileChannel` | Reading and writing files |
| `SocketChannel` | TCP network connections (client) |
| `ServerSocketChannel` | Listening for TCP connections (server) |
| `DatagramChannel` | UDP network connections |
| `Pipe.SourceChannel` / `Pipe.SinkChannel` | Inter-thread communication |

### FileChannel

FileChannel provides file I/O operations with additional features like memory mapping and file locking.

```java
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FileChannelExample {

    public static void main(String[] args) throws Exception {
        // Opening a FileChannel (modern approach)
        Path path = Path.of("example.txt");

        // For writing
        try (FileChannel writeChannel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE)) {

            ByteBuffer buffer = ByteBuffer.allocate(1024);
            buffer.put("Hello, FileChannel!".getBytes());
            buffer.flip();

            while (buffer.hasRemaining()) {
                writeChannel.write(buffer);
            }
        }

        // For reading
        try (FileChannel readChannel = FileChannel.open(path,
                StandardOpenOption.READ)) {

            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int bytesRead = readChannel.read(buffer);

            buffer.flip();
            byte[] data = new byte[buffer.remaining()];
            buffer.get(data);
            System.out.println("Read: " + new String(data));
        }
    }
}
```

### Channel-to-Channel Transfers

One of NIO's powerful features is direct channel-to-channel transfers, which can leverage OS-level optimizations.

```java
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class ChannelTransferExample {

    public static void copyFile(Path source, Path destination) throws Exception {
        try (FileChannel sourceChannel = FileChannel.open(source, StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(destination,
                     StandardOpenOption.CREATE,
                     StandardOpenOption.WRITE)) {

            long size = sourceChannel.size();
            long transferred = 0;

            // transferTo may not transfer all bytes in one call
            while (transferred < size) {
                transferred += sourceChannel.transferTo(
                    transferred,
                    size - transferred,
                    destChannel
                );
            }

            System.out.println("Transferred " + transferred + " bytes");
        }
    }

    // Alternative using transferFrom
    public static void copyFileReverse(Path source, Path destination) throws Exception {
        try (FileChannel sourceChannel = FileChannel.open(source, StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(destination,
                     StandardOpenOption.CREATE,
                     StandardOpenOption.WRITE)) {

            destChannel.transferFrom(sourceChannel, 0, sourceChannel.size());
        }
    }
}
```

### Memory-Mapped Files

Memory mapping allows a file to be mapped directly into memory, providing very fast access for large files.

```java
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class MemoryMappedFileExample {

    public static void main(String[] args) throws Exception {
        Path path = Path.of("mapped.dat");

        // Create and write using memory mapping
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.READ,
                StandardOpenOption.WRITE)) {

            // Map the first 1024 bytes
            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_WRITE,
                0,
                1024
            );

            // Write directly to the mapped buffer
            mappedBuffer.putInt(0, 42);
            mappedBuffer.putDouble(4, 3.14159);
            mappedBuffer.put(12, (byte) 'A');

            // Force changes to disk
            mappedBuffer.force();

            System.out.println("Data written via memory mapping");
        }

        // Read using memory mapping
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {

            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_ONLY,
                0,
                channel.size()
            );

            System.out.println("Int at 0: " + mappedBuffer.getInt(0));
            System.out.println("Double at 4: " + mappedBuffer.getDouble(4));
            System.out.println("Byte at 12: " + (char) mappedBuffer.get(12));
        }
    }
}
```

### File Locking

FileChannel supports file locking to coordinate access between processes.

```java
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

public class FileLockExample {

    public static void main(String[] args) throws Exception {
        Path path = Path.of("locked.txt");

        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE)) {

            // Acquire an exclusive lock
            try (FileLock lock = channel.lock()) {
                System.out.println("Lock acquired: " + lock.isValid());
                System.out.println("Is shared: " + lock.isShared());

                // Perform file operations while holding the lock
                channel.write(java.nio.ByteBuffer.wrap("Protected data".getBytes()));

                // Lock is automatically released when closed
            }
        }

        // Try lock (non-blocking)
        try (FileChannel channel = FileChannel.open(path,
                StandardOpenOption.READ,
                StandardOpenOption.WRITE)) {

            FileLock lock = channel.tryLock();
            if (lock != null) {
                try {
                    System.out.println("Got the lock!");
                    // Do work...
                } finally {
                    lock.release();
                }
            } else {
                System.out.println("Could not acquire lock");
            }
        }
    }
}
```

---

## Selectors

Selectors enable a single thread to monitor multiple channels for events, making them essential for building scalable servers.

### Understanding Selectors

A Selector monitors multiple channels for:
- **OP_READ** - Channel is ready for reading
- **OP_WRITE** - Channel is ready for writing
- **OP_CONNECT** - Channel has completed connection
- **OP_ACCEPT** - Channel is ready to accept new connections

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;
import java.util.Set;

public class SelectorExample {

    public static void main(String[] args) throws Exception {
        // Create a selector
        Selector selector = Selector.open();

        // Create and configure server channel
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.bind(new InetSocketAddress("localhost", 8080));
        serverChannel.configureBlocking(false);

        // Register the server channel with the selector
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("Server started on port 8080");

        while (true) {
            // Block until at least one channel is ready
            int readyChannels = selector.select();

            if (readyChannels == 0) {
                continue;
            }

            // Get the ready keys
            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> keyIterator = selectedKeys.iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();

                if (key.isAcceptable()) {
                    // Accept new connection
                    handleAccept(key, selector);
                } else if (key.isReadable()) {
                    // Read from channel
                    handleRead(key);
                } else if (key.isWritable()) {
                    // Write to channel
                    handleWrite(key);
                }

                // Remove the key from the selected set
                keyIterator.remove();
            }
        }
    }

    private static void handleAccept(SelectionKey key, Selector selector)
            throws Exception {
        ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
        SocketChannel clientChannel = serverChannel.accept();
        clientChannel.configureBlocking(false);

        // Register for read events
        clientChannel.register(selector, SelectionKey.OP_READ);

        System.out.println("Accepted connection from: " +
            clientChannel.getRemoteAddress());
    }

    private static void handleRead(SelectionKey key) throws Exception {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = ByteBuffer.allocate(256);

        int bytesRead = channel.read(buffer);

        if (bytesRead == -1) {
            // Connection closed
            channel.close();
            key.cancel();
            System.out.println("Connection closed");
            return;
        }

        buffer.flip();
        byte[] data = new byte[buffer.remaining()];
        buffer.get(data);
        String message = new String(data).trim();
        System.out.println("Received: " + message);

        // Echo back
        buffer.clear();
        buffer.put(("Echo: " + message + "\n").getBytes());
        buffer.flip();
        channel.write(buffer);
    }

    private static void handleWrite(SelectionKey key) throws Exception {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = (ByteBuffer) key.attachment();

        if (buffer != null && buffer.hasRemaining()) {
            channel.write(buffer);
        }

        if (buffer == null || !buffer.hasRemaining()) {
            // Done writing, switch back to read interest
            key.interestOps(SelectionKey.OP_READ);
        }
    }
}
```

### SelectionKey Details

```java
// Getting information from a SelectionKey
SelectionKey key = channel.register(selector, SelectionKey.OP_READ);

// Check what operations the channel is registered for
int interestOps = key.interestOps();

// Check what operations are ready
int readyOps = key.readyOps();

// Convenience methods
boolean isAcceptable = key.isAcceptable();  // (readyOps & OP_ACCEPT) != 0
boolean isConnectable = key.isConnectable(); // (readyOps & OP_CONNECT) != 0
boolean isReadable = key.isReadable();       // (readyOps & OP_READ) != 0
boolean isWritable = key.isWritable();       // (readyOps & OP_WRITE) != 0

// Modify interest set
key.interestOps(SelectionKey.OP_READ | SelectionKey.OP_WRITE);

// Attach an object to the key (useful for maintaining state)
key.attach(myStateObject);
Object attachment = key.attachment();

// Cancel the registration
key.cancel();
```

---

## Non-blocking I/O

Non-blocking I/O is the cornerstone of NIO's scalability. When configured for non-blocking mode, I/O operations return immediately rather than waiting.

### Configuring Non-blocking Mode

```java
// Socket channels are blocking by default
SocketChannel channel = SocketChannel.open();

// Configure for non-blocking mode
channel.configureBlocking(false);

// Check current mode
boolean isBlocking = channel.isBlocking();
```

### Non-blocking Read and Write

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;

public class NonBlockingIOExample {

    public static void main(String[] args) throws Exception {
        SocketChannel channel = SocketChannel.open();
        channel.configureBlocking(false);

        // Non-blocking connect
        boolean connected = channel.connect(
            new InetSocketAddress("example.com", 80));

        if (!connected) {
            // Connection in progress, need to finish it
            while (!channel.finishConnect()) {
                // Can do other work here while waiting
                System.out.println("Waiting for connection...");
                Thread.sleep(100);
            }
        }

        System.out.println("Connected!");

        // Non-blocking write
        ByteBuffer writeBuffer = ByteBuffer.wrap(
            "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n".getBytes());

        while (writeBuffer.hasRemaining()) {
            int bytesWritten = channel.write(writeBuffer);
            if (bytesWritten == 0) {
                // Channel not ready for writing, do other work
                Thread.sleep(10);
            }
        }

        // Non-blocking read
        ByteBuffer readBuffer = ByteBuffer.allocate(4096);
        StringBuilder response = new StringBuilder();

        long startTime = System.currentTimeMillis();
        while (System.currentTimeMillis() - startTime < 5000) {
            int bytesRead = channel.read(readBuffer);

            if (bytesRead > 0) {
                readBuffer.flip();
                byte[] data = new byte[readBuffer.remaining()];
                readBuffer.get(data);
                response.append(new String(data));
                readBuffer.clear();
            } else if (bytesRead == 0) {
                // No data available, do other work
                Thread.sleep(10);
            } else {
                // -1 means end of stream
                break;
            }
        }

        System.out.println("Response received:");
        System.out.println(response.toString().substring(0,
            Math.min(500, response.length())));

        channel.close();
    }
}
```

### Handling Partial Reads and Writes

In non-blocking mode, reads and writes may not complete in a single operation.

```java
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;

public class PartialIOHandler {

    private ByteBuffer writeBuffer;
    private ByteBuffer readBuffer;
    private SocketChannel channel;

    public PartialIOHandler(SocketChannel channel) {
        this.channel = channel;
        this.readBuffer = ByteBuffer.allocate(8192);
        this.writeBuffer = ByteBuffer.allocate(8192);
    }

    /**
     * Attempts to write data. Returns true if all data was written.
     */
    public boolean write(byte[] data) throws Exception {
        // If there's pending data, try to write it first
        if (writeBuffer.hasRemaining()) {
            channel.write(writeBuffer);
        }

        if (writeBuffer.hasRemaining()) {
            // Still have pending data, can't accept more
            return false;
        }

        // Write new data
        writeBuffer.clear();
        writeBuffer.put(data);
        writeBuffer.flip();

        channel.write(writeBuffer);

        return !writeBuffer.hasRemaining();
    }

    /**
     * Attempts to complete any pending writes.
     */
    public boolean flushWrite() throws Exception {
        if (writeBuffer.hasRemaining()) {
            channel.write(writeBuffer);
        }
        return !writeBuffer.hasRemaining();
    }

    /**
     * Attempts to read data. Returns null if no complete message available.
     */
    public String readMessage() throws Exception {
        int bytesRead = channel.read(readBuffer);

        if (bytesRead == -1) {
            throw new Exception("Connection closed");
        }

        // Look for a complete message (e.g., ending with newline)
        readBuffer.flip();

        int newlinePos = -1;
        for (int i = 0; i < readBuffer.limit(); i++) {
            if (readBuffer.get(i) == '\n') {
                newlinePos = i;
                break;
            }
        }

        if (newlinePos == -1) {
            // No complete message yet
            readBuffer.position(readBuffer.limit());
            readBuffer.limit(readBuffer.capacity());
            return null;
        }

        // Extract the message
        byte[] messageBytes = new byte[newlinePos];
        readBuffer.get(messageBytes);
        readBuffer.get(); // consume newline

        // Compact remaining data
        readBuffer.compact();

        return new String(messageBytes);
    }
}
```

---

## File Operations with NIO

Java NIO.2 (introduced in Java 7) added the `java.nio.file` package with powerful file operations.

### Path and Files

```java
import java.nio.file.*;
import java.nio.file.attribute.*;
import java.util.List;

public class FileOperationsExample {

    public static void main(String[] args) throws Exception {
        // Creating Path objects
        Path path1 = Path.of("myfile.txt");
        Path path2 = Path.of("/home", "user", "documents", "file.txt");
        Path path3 = Paths.get("relative/path/file.txt");

        // Path operations
        Path absolutePath = path1.toAbsolutePath();
        Path normalized = Path.of("./dir/../file.txt").normalize();
        Path resolved = Path.of("/home/user").resolve("documents/file.txt");
        Path relative = Path.of("/home/user/docs").relativize(
            Path.of("/home/user/pics"));

        System.out.println("Absolute: " + absolutePath);
        System.out.println("Normalized: " + normalized);
        System.out.println("Resolved: " + resolved);
        System.out.println("Relative: " + relative);

        // File operations with Files class
        Path testFile = Path.of("test.txt");

        // Write a file
        Files.writeString(testFile, "Hello, NIO.2!");

        // Read a file
        String content = Files.readString(testFile);
        System.out.println("Content: " + content);

        // Write lines
        List<String> lines = List.of("Line 1", "Line 2", "Line 3");
        Files.write(testFile, lines);

        // Read lines
        List<String> readLines = Files.readAllLines(testFile);
        readLines.forEach(System.out::println);

        // File attributes
        BasicFileAttributes attrs = Files.readAttributes(
            testFile, BasicFileAttributes.class);
        System.out.println("Size: " + attrs.size());
        System.out.println("Created: " + attrs.creationTime());
        System.out.println("Modified: " + attrs.lastModifiedTime());
        System.out.println("Is directory: " + attrs.isDirectory());

        // Check file properties
        System.out.println("Exists: " + Files.exists(testFile));
        System.out.println("Readable: " + Files.isReadable(testFile));
        System.out.println("Writable: " + Files.isWritable(testFile));

        // Copy and move files
        Path copyTarget = Path.of("test_copy.txt");
        Files.copy(testFile, copyTarget, StandardCopyOption.REPLACE_EXISTING);

        Path moveTarget = Path.of("test_moved.txt");
        Files.move(copyTarget, moveTarget, StandardCopyOption.REPLACE_EXISTING);

        // Delete files
        Files.deleteIfExists(testFile);
        Files.deleteIfExists(moveTarget);
    }
}
```

### Directory Operations

```java
import java.nio.file.*;
import java.util.stream.Stream;

public class DirectoryOperationsExample {

    public static void main(String[] args) throws Exception {
        Path dir = Path.of("test_directory");

        // Create directories
        Files.createDirectories(dir.resolve("subdir1/subdir2"));

        // Create some test files
        Files.writeString(dir.resolve("file1.txt"), "Content 1");
        Files.writeString(dir.resolve("file2.txt"), "Content 2");
        Files.writeString(dir.resolve("subdir1/file3.txt"), "Content 3");

        // List directory contents
        System.out.println("Directory listing:");
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path entry : stream) {
                System.out.println("  " + entry.getFileName());
            }
        }

        // List with glob pattern
        System.out.println("\nFiles matching *.txt:");
        try (DirectoryStream<Path> stream =
                Files.newDirectoryStream(dir, "*.txt")) {
            for (Path entry : stream) {
                System.out.println("  " + entry.getFileName());
            }
        }

        // Walk directory tree
        System.out.println("\nWalking directory tree:");
        try (Stream<Path> paths = Files.walk(dir)) {
            paths.forEach(path -> System.out.println("  " + path));
        }

        // Find files matching a condition
        System.out.println("\nFinding .txt files:");
        try (Stream<Path> paths = Files.find(dir, Integer.MAX_VALUE,
                (path, attrs) -> path.toString().endsWith(".txt"))) {
            paths.forEach(path -> System.out.println("  " + path));
        }

        // Clean up - delete directory tree
        try (Stream<Path> paths = Files.walk(dir)) {
            paths.sorted((p1, p2) -> -p1.compareTo(p2)) // Reverse order
                 .forEach(path -> {
                     try {
                         Files.delete(path);
                     } catch (Exception e) {
                         e.printStackTrace();
                     }
                 });
        }
    }
}
```

### Watching for File System Changes

```java
import java.nio.file.*;

public class FileWatchExample {

    public static void main(String[] args) throws Exception {
        Path watchDir = Path.of(".");

        WatchService watchService = FileSystems.getDefault().newWatchService();

        watchDir.register(watchService,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_DELETE,
            StandardWatchEventKinds.ENTRY_MODIFY);

        System.out.println("Watching directory: " + watchDir.toAbsolutePath());
        System.out.println("Create, modify, or delete files to see events...");

        while (true) {
            WatchKey key = watchService.take(); // Blocks until event

            for (WatchEvent<?> event : key.pollEvents()) {
                WatchEvent.Kind<?> kind = event.kind();

                if (kind == StandardWatchEventKinds.OVERFLOW) {
                    continue;
                }

                @SuppressWarnings("unchecked")
                WatchEvent<Path> pathEvent = (WatchEvent<Path>) event;
                Path filename = pathEvent.context();

                System.out.printf("Event: %s - File: %s%n",
                    kind.name(), filename);
            }

            // Reset the key to receive more events
            boolean valid = key.reset();
            if (!valid) {
                break; // Directory no longer accessible
            }
        }
    }
}
```

---

## Network Programming with NIO

NIO excels at building high-performance network applications.

### Complete Echo Server

```java
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.*;

public class NioEchoServer {

    private Selector selector;
    private ServerSocketChannel serverChannel;
    private Map<SocketChannel, ByteBuffer> clientBuffers;

    public NioEchoServer(int port) throws IOException {
        this.selector = Selector.open();
        this.serverChannel = ServerSocketChannel.open();
        this.clientBuffers = new HashMap<>();

        serverChannel.bind(new InetSocketAddress(port));
        serverChannel.configureBlocking(false);
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("Echo server started on port " + port);
    }

    public void run() throws IOException {
        while (true) {
            selector.select();

            Iterator<SelectionKey> keyIterator =
                selector.selectedKeys().iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                keyIterator.remove();

                if (!key.isValid()) {
                    continue;
                }

                try {
                    if (key.isAcceptable()) {
                        accept(key);
                    } else if (key.isReadable()) {
                        read(key);
                    } else if (key.isWritable()) {
                        write(key);
                    }
                } catch (IOException e) {
                    closeChannel(key);
                }
            }
        }
    }

    private void accept(SelectionKey key) throws IOException {
        ServerSocketChannel server = (ServerSocketChannel) key.channel();
        SocketChannel client = server.accept();
        client.configureBlocking(false);

        // Allocate buffer for this client
        clientBuffers.put(client, ByteBuffer.allocate(4096));

        // Register for read events
        client.register(selector, SelectionKey.OP_READ);

        System.out.println("New connection: " + client.getRemoteAddress());
    }

    private void read(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = clientBuffers.get(client);

        int bytesRead = client.read(buffer);

        if (bytesRead == -1) {
            closeChannel(key);
            return;
        }

        if (bytesRead > 0) {
            buffer.flip();

            // Log received message
            byte[] data = new byte[buffer.remaining()];
            buffer.get(data);
            System.out.println("Received from " + client.getRemoteAddress() +
                ": " + new String(data).trim());

            // Prepare to echo back
            buffer.flip();

            // Register for write
            key.interestOps(SelectionKey.OP_WRITE);
        }
    }

    private void write(SelectionKey key) throws IOException {
        SocketChannel client = (SocketChannel) key.channel();
        ByteBuffer buffer = clientBuffers.get(client);

        client.write(buffer);

        if (!buffer.hasRemaining()) {
            // Done writing, switch back to read
            buffer.clear();
            key.interestOps(SelectionKey.OP_READ);
        }
    }

    private void closeChannel(SelectionKey key) {
        SocketChannel client = (SocketChannel) key.channel();
        clientBuffers.remove(client);

        try {
            System.out.println("Connection closed: " + client.getRemoteAddress());
            client.close();
        } catch (IOException e) {
            // Ignore
        }

        key.cancel();
    }

    public static void main(String[] args) throws IOException {
        new NioEchoServer(8080).run();
    }
}
```

### NIO Client

```java
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.util.Iterator;
import java.util.Scanner;

public class NioEchoClient {

    private Selector selector;
    private SocketChannel channel;
    private ByteBuffer readBuffer;
    private ByteBuffer writeBuffer;

    public NioEchoClient(String host, int port) throws IOException {
        this.selector = Selector.open();
        this.channel = SocketChannel.open();
        this.readBuffer = ByteBuffer.allocate(4096);
        this.writeBuffer = ByteBuffer.allocate(4096);

        channel.configureBlocking(false);
        channel.connect(new InetSocketAddress(host, port));
        channel.register(selector, SelectionKey.OP_CONNECT);
    }

    public void run() throws IOException {
        // Start a thread for reading console input
        Thread inputThread = new Thread(this::readConsoleInput);
        inputThread.setDaemon(true);
        inputThread.start();

        while (true) {
            selector.select(100); // Short timeout to check for user input

            Iterator<SelectionKey> keyIterator =
                selector.selectedKeys().iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                keyIterator.remove();

                if (key.isConnectable()) {
                    finishConnect(key);
                } else if (key.isReadable()) {
                    read(key);
                } else if (key.isWritable()) {
                    write(key);
                }
            }
        }
    }

    private void finishConnect(SelectionKey key) throws IOException {
        channel.finishConnect();
        System.out.println("Connected to server!");
        System.out.println("Type messages to send (press Enter to send):");
        key.interestOps(SelectionKey.OP_READ);
    }

    private void read(SelectionKey key) throws IOException {
        readBuffer.clear();
        int bytesRead = channel.read(readBuffer);

        if (bytesRead == -1) {
            System.out.println("Server closed connection");
            channel.close();
            System.exit(0);
        }

        readBuffer.flip();
        byte[] data = new byte[readBuffer.remaining()];
        readBuffer.get(data);
        System.out.println("Server: " + new String(data).trim());
    }

    private void write(SelectionKey key) throws IOException {
        synchronized (writeBuffer) {
            writeBuffer.flip();
            channel.write(writeBuffer);

            if (!writeBuffer.hasRemaining()) {
                writeBuffer.clear();
                key.interestOps(SelectionKey.OP_READ);
            } else {
                writeBuffer.compact();
            }
        }
    }

    private void readConsoleInput() {
        Scanner scanner = new Scanner(System.in);

        while (scanner.hasNextLine()) {
            String line = scanner.nextLine();

            synchronized (writeBuffer) {
                writeBuffer.clear();
                writeBuffer.put((line + "\n").getBytes());
            }

            // Update interest ops
            SelectionKey key = channel.keyFor(selector);
            if (key != null) {
                key.interestOps(SelectionKey.OP_READ | SelectionKey.OP_WRITE);
                selector.wakeup();
            }
        }
    }

    public static void main(String[] args) throws IOException {
        new NioEchoClient("localhost", 8080).run();
    }
}
```

### UDP with DatagramChannel

```java
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.DatagramChannel;

public class DatagramChannelExample {

    // UDP Server
    public static class UdpServer {
        public static void main(String[] args) throws Exception {
            DatagramChannel channel = DatagramChannel.open();
            channel.bind(new InetSocketAddress(9999));

            System.out.println("UDP Server started on port 9999");

            ByteBuffer buffer = ByteBuffer.allocate(1024);

            while (true) {
                buffer.clear();
                SocketAddress sender = channel.receive(buffer);

                buffer.flip();
                byte[] data = new byte[buffer.remaining()];
                buffer.get(data);
                String message = new String(data);

                System.out.println("Received from " + sender + ": " + message);

                // Send response
                buffer.clear();
                buffer.put(("Echo: " + message).getBytes());
                buffer.flip();
                channel.send(buffer, sender);
            }
        }
    }

    // UDP Client
    public static class UdpClient {
        public static void main(String[] args) throws Exception {
            DatagramChannel channel = DatagramChannel.open();

            InetSocketAddress serverAddress =
                new InetSocketAddress("localhost", 9999);

            // Send a message
            ByteBuffer buffer = ByteBuffer.allocate(1024);
            buffer.put("Hello, UDP!".getBytes());
            buffer.flip();
            channel.send(buffer, serverAddress);

            // Receive response
            buffer.clear();
            channel.receive(buffer);

            buffer.flip();
            byte[] data = new byte[buffer.remaining()];
            buffer.get(data);
            System.out.println("Server response: " + new String(data));

            channel.close();
        }
    }
}
```

### Asynchronous I/O with CompletionHandler

```java
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.AsynchronousServerSocketChannel;
import java.nio.channels.AsynchronousSocketChannel;
import java.nio.channels.CompletionHandler;

public class AsyncServerExample {

    public static void main(String[] args) throws Exception {
        AsynchronousServerSocketChannel server =
            AsynchronousServerSocketChannel.open();
        server.bind(new InetSocketAddress("localhost", 8080));

        System.out.println("Async server started on port 8080");

        server.accept(null, new CompletionHandler<AsynchronousSocketChannel, Void>() {
            @Override
            public void completed(AsynchronousSocketChannel client, Void attachment) {
                // Accept next connection
                server.accept(null, this);

                // Handle current client
                ByteBuffer buffer = ByteBuffer.allocate(1024);
                client.read(buffer, buffer,
                    new CompletionHandler<Integer, ByteBuffer>() {
                        @Override
                        public void completed(Integer result, ByteBuffer attachment) {
                            if (result == -1) {
                                try {
                                    client.close();
                                } catch (Exception e) {
                                    // Ignore
                                }
                                return;
                            }

                            attachment.flip();
                            byte[] data = new byte[attachment.remaining()];
                            attachment.get(data);
                            System.out.println("Received: " + new String(data).trim());

                            // Echo back
                            attachment.flip();
                            client.write(attachment, attachment,
                                new CompletionHandler<Integer, ByteBuffer>() {
                                    @Override
                                    public void completed(Integer result, ByteBuffer buf) {
                                        if (buf.hasRemaining()) {
                                            client.write(buf, buf, this);
                                        } else {
                                            buf.clear();
                                            client.read(buf, buf,
                                                AsyncServerExample.this.createReadHandler(client));
                                        }
                                    }

                                    @Override
                                    public void failed(Throwable exc, ByteBuffer buf) {
                                        System.err.println("Write failed: " + exc.getMessage());
                                    }
                                });
                        }

                        @Override
                        public void failed(Throwable exc, ByteBuffer attachment) {
                            System.err.println("Read failed: " + exc.getMessage());
                        }
                    });
            }

            @Override
            public void failed(Throwable exc, Void attachment) {
                System.err.println("Accept failed: " + exc.getMessage());
            }
        });

        // Keep server running
        Thread.sleep(Long.MAX_VALUE);
    }

    private CompletionHandler<Integer, ByteBuffer> createReadHandler(
            AsynchronousSocketChannel client) {
        return new CompletionHandler<Integer, ByteBuffer>() {
            @Override
            public void completed(Integer result, ByteBuffer attachment) {
                if (result == -1) {
                    try {
                        client.close();
                    } catch (Exception e) {
                        // Ignore
                    }
                    return;
                }

                attachment.flip();
                byte[] data = new byte[attachment.remaining()];
                attachment.get(data);
                System.out.println("Received: " + new String(data).trim());

                attachment.flip();
                client.write(attachment);
                attachment.clear();
                client.read(attachment, attachment, this);
            }

            @Override
            public void failed(Throwable exc, ByteBuffer attachment) {
                System.err.println("Read failed: " + exc.getMessage());
            }
        };
    }
}
```

---

## Best Practices

### Buffer Management

```java
// DO: Reuse buffers when possible
public class BufferPool {
    private final Queue<ByteBuffer> pool = new LinkedList<>();
    private final int bufferSize;

    public BufferPool(int bufferSize, int initialSize) {
        this.bufferSize = bufferSize;
        for (int i = 0; i < initialSize; i++) {
            pool.offer(ByteBuffer.allocateDirect(bufferSize));
        }
    }

    public ByteBuffer acquire() {
        ByteBuffer buffer = pool.poll();
        if (buffer == null) {
            buffer = ByteBuffer.allocateDirect(bufferSize);
        }
        buffer.clear();
        return buffer;
    }

    public void release(ByteBuffer buffer) {
        pool.offer(buffer);
    }
}

// DON'T: Create new buffers for each operation
// ByteBuffer buffer = ByteBuffer.allocate(1024); // In a loop - bad!
```

### Direct vs Heap Buffers

```java
// Use direct buffers for I/O-intensive operations
ByteBuffer directBuffer = ByteBuffer.allocateDirect(8192);
// Pros: Faster I/O, avoids copying to native memory
// Cons: Slower allocation, harder to debug, not garbage collected quickly

// Use heap buffers for processing data
ByteBuffer heapBuffer = ByteBuffer.allocate(8192);
// Pros: Fast allocation, easy to debug, quick garbage collection
// Cons: May require copying for I/O operations
```

### Proper Resource Management

```java
// Always use try-with-resources for channels
try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
    // Use channel
}

// Or ensure proper cleanup
Selector selector = null;
try {
    selector = Selector.open();
    // Use selector
} finally {
    if (selector != null) {
        try {
            selector.close();
        } catch (IOException e) {
            // Log error
        }
    }
}
```

### Handling SelectionKey Operations

```java
// DO: Remove keys from selectedKeys after processing
Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
while (iterator.hasNext()) {
    SelectionKey key = iterator.next();
    iterator.remove(); // Important!
    // Process key
}

// DO: Check key validity before operations
if (key.isValid() && key.isReadable()) {
    // Safe to read
}

// DO: Properly update interest ops
key.interestOps(key.interestOps() | SelectionKey.OP_WRITE);
key.interestOps(key.interestOps() & ~SelectionKey.OP_WRITE);
```

### Thread Safety

```java
// Selector is not thread-safe - synchronize if multiple threads access it
public class ThreadSafeSelector {
    private final Selector selector;
    private final Object lock = new Object();

    public void wakeupAndRegister(SelectableChannel channel, int ops)
            throws ClosedChannelException {
        synchronized (lock) {
            selector.wakeup();
            channel.register(selector, ops);
        }
    }

    public int select() throws IOException {
        synchronized (lock) {
            return selector.select();
        }
    }
}
```

### Avoiding Common Pitfalls

```java
// PITFALL 1: Forgetting to flip() before reading
ByteBuffer buffer = ByteBuffer.allocate(100);
buffer.put("Hello".getBytes());
// buffer.flip(); // Missing! Reading will return nothing
buffer.flip(); // Correct

// PITFALL 2: Not handling partial reads/writes
int bytesWritten = channel.write(buffer);
// Don't assume all bytes were written!
while (buffer.hasRemaining()) {
    channel.write(buffer);
}

// PITFALL 3: Not clearing buffer before reuse
buffer.clear(); // Reset position and limit

// PITFALL 4: Ignoring return values
int bytesRead = channel.read(buffer);
if (bytesRead == -1) {
    // Handle connection close!
    channel.close();
}
```

### Performance Tips Summary

| Tip | Description |
|-----|-------------|
| Buffer Pooling | Reuse buffers to reduce allocation overhead |
| Direct Buffers | Use for I/O-heavy operations, but sparingly |
| Batch Operations | Process multiple keys before calling select() again |
| Minimize syscalls | Use scatter/gather I/O when possible |
| Tune Buffer Size | Match buffer sizes to expected data sizes |
| Avoid Blocking | Never perform blocking operations in the selector thread |

---

## Conclusion

Java NIO provides a powerful foundation for building high-performance I/O applications. The key concepts to remember are:

1. **Buffers** are containers for data with position, limit, and capacity
2. **Channels** are bidirectional conduits that work with buffers
3. **Selectors** enable single-threaded multiplexing of multiple channels
4. **Non-blocking mode** allows operations to return immediately
5. **NIO.2** (java.nio.file) provides modern file system operations

By understanding these concepts and following best practices, you can build scalable network servers, efficient file processors, and responsive applications that handle thousands of concurrent connections with minimal resource usage.

For simple applications, traditional I/O may be sufficient and easier to work with. For high-performance, high-concurrency scenarios, NIO is the clear choice. Many modern frameworks like Netty, Vert.x, and others are built on top of NIO to provide even higher-level abstractions while maintaining excellent performance.
