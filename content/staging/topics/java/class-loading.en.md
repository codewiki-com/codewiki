---
title: Java类加载机制
description: 深入理解Java类加载过程、类加载器体系、双亲委派模型与自定义类加载器
track: java
section: jvm-gc
difficulty: advanced
tags:
  - Java
  - JVM
  - 类加载
  - ClassLoader
  - 双亲委派
status: imported
origin: old/src/content/docs/java/class-loading.en.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: JVM
  order: 7
  lastUpdated: 2026-01-07
---

The Java class loading mechanism is a core component of the JVM, responsible for loading bytecode from `.class` files into memory and transforming it into Class objects that can be directly used by the JVM. A deep understanding of the class loading mechanism is crucial for mastering Java runtime behavior, implementing hot deployment, plugin architectures, and resolving class conflict issues.

## Concept Explanation

### What is Class Loading

Class loading is the process by which the JVM loads class bytecode files (`.class` files) into memory, performs verification, preparation, resolution, and initialization, and finally forms Java types (`Class` objects) that can be directly used by the JVM.

```
.java file  -->  Compiler (javac)  -->  .class file  -->  ClassLoader  -->  Class object
                                                              |
                                                              v
                                                    JVM Memory (Method Area)
```

### Why Do We Need Class Loading Mechanism

1. **Dynamic Loading**: Java adopts a strategy of dynamically loading classes at runtime rather than loading all classes at once
2. **Security**: The verification mechanism ensures that loaded classes conform to JVM specifications and prevents malicious code
3. **Namespace Isolation**: Classes loaded by different class loaders are isolated from each other; even classes with the same name are different classes
4. **Flexibility**: Supports advanced features like hot deployment, modularization, and plugin architecture

### Historical Background

The class loading mechanism has been a core feature of the JVM since Java 1.0:

- **JDK 1.0-1.1**: Simple three-layer class loader hierarchy
- **JDK 1.2**: Introduction of the parent delegation model
- **JDK 9**: Major improvements to class loading with the modular system (JPMS)
- **JDK 11+**: Optimized class loading performance and improved the module system

## Core Principles

### Class Lifecycle

A class goes through the following seven phases from loading to unloading:

```
+--------+    +--------+    +--------+    +--------+    +--------+
| Loading| -> | Verify | -> | Prepare| -> | Resolve| -> | Init   |
+--------+    +--------+    +--------+    +--------+    +--------+
                  |______________|______________|
                              |
                           Linking
                              |
                              v
                        +--------+    +--------+
                        | Using  | -> | Unload |
                        +--------+    +--------+
```

### Phase One: Loading

The loading phase accomplishes three things:

1. Obtain the binary byte stream that defines a class through its fully qualified name
2. Transform the static storage structure represented by the byte stream into the runtime data structure of the method area
3. Generate a `java.lang.Class` object in memory that represents this class

```java
// Ways to trigger class loading
public class LoadingDemo {

    public static void main(String[] args) throws Exception {
        // Method 1: Explicit loading - Class.forName()
        Class<?> clazz1 = Class.forName("com.example.MyClass");

        // Method 2: Explicit loading - ClassLoader.loadClass()
        ClassLoader loader = LoadingDemo.class.getClassLoader();
        Class<?> clazz2 = loader.loadClass("com.example.MyClass");

        // Method 3: Implicit loading - new keyword
        // MyClass obj = new MyClass();

        // Method 4: Implicit loading - accessing static members
        // int value = MyClass.STATIC_VALUE;
    }
}
```

**Bytecode Sources**:

```java
// Bytecode can come from various sources
public class BytecodeSourceDemo {

    // 1. Load .class files from the local file system
    // 2. Load from JAR/WAR packages
    // 3. Download from network (Applet)
    // 4. Generate dynamically at runtime (dynamic proxy, CGLib)
    // 5. Read from database
    // 6. Decrypt and load from encrypted files

    // Dynamic bytecode generation example
    public static void dynamicGeneration() {
        // When using dynamic proxy, JVM generates proxy class bytecode at runtime
        InvocationHandler handler = (proxy, method, args) -> {
            System.out.println("Before method: " + method.getName());
            return null;
        };

        Runnable proxy = (Runnable) Proxy.newProxyInstance(
            Runnable.class.getClassLoader(),
            new Class[]{Runnable.class},
            handler
        );

        // View proxy class information
        System.out.println("Proxy class: " + proxy.getClass().getName());
        // Output: Proxy class: com.sun.proxy.$Proxy0
    }
}
```

### Phase Two: Linking

Linking is divided into three sub-phases:

#### Verification

Ensures that the byte stream of the Class file conforms to JVM specifications and will not compromise virtual machine security.

```
Verification Content:
+------------------+----------------------------------------+
|  Verification    |              Content                   |
|      Type        |                                        |
+------------------+----------------------------------------+
| File Format      | Magic number (0xCAFEBABE), version,    |
| Verification     | constant pool, etc.                    |
| Metadata         | Semantic analysis, e.g., has parent    |
| Verification     | class, inherits final class            |
| Bytecode         | Data flow and control flow analysis,   |
| Verification     | ensure semantic validity               |
| Symbolic Ref     | Ensure resolution can execute          |
| Verification     | correctly                              |
+------------------+----------------------------------------+
```

```java
// Content checked during verification phase
public class VerificationDemo {

    // If a class file is tampered with, the verification phase will throw an exception
    public static void main(String[] args) {
        try {
            // Try to load a tampered class
            // If the bytecode is invalid, VerifyError will be thrown
            Class.forName("com.example.TamperedClass");
        } catch (VerifyError e) {
            System.out.println("Bytecode verification failed: " + e.getMessage());
        } catch (ClassNotFoundException e) {
            System.out.println("Class not found");
        }
    }
}
```

#### Preparation

Allocates memory for class static variables and sets initial values (zero values). The memory used by these variables is allocated in the method area.

```java
public class PreparationDemo {

    // Preparation phase: value = 0 (zero value for int)
    // Initialization phase: value = 123
    public static int value = 123;

    // Preparation phase: name = null (zero value for reference type)
    // Initialization phase: name = "Hello"
    public static String name = "Hello";

    // Compile-time constant, directly assigned to 100 during preparation
    // Because final static primitives/string literals are determined at compile time
    public static final int CONSTANT = 100;

    // Non-compile-time constant, preparation phase: randomValue = 0
    // Value calculated during initialization phase
    public static final int RANDOM_VALUE = new Random().nextInt();
}
```

**Zero Value Table for Primitive Types**:

| Data Type | Zero Value |
|-----------|------------|
| int | 0 |
| long | 0L |
| short | (short)0 |
| char | '\u0000' |
| byte | (byte)0 |
| boolean | false |
| float | 0.0f |
| double | 0.0d |
| reference | null |

#### Resolution

Replaces symbolic references in the constant pool with direct references.

```java
public class ResolutionDemo {

    // Symbolic reference: describes the target using a set of symbols
    // For example: "java/lang/String" is a symbolic reference to the String class

    // Direct reference: pointer, relative offset, or handle that points directly to the target

    public void method() {
        // At compile time, this is symbolic reference "java/lang/String"
        // After runtime resolution, it becomes a direct reference to the String class
        String str = new String("Hello");

        // Method calls also need resolution
        // Symbolic reference "java/io/PrintStream.println:(Ljava/lang/String;)V"
        // Resolved to direct reference of println method
        System.out.println(str);
    }
}
```

Resolution targets include:
- Classes or interfaces
- Fields
- Methods
- Interface methods

### Phase Three: Initialization

The initialization phase is the process of executing the class constructor `<clinit>()` method.

```java
public class InitializationDemo {

    // The <clinit>() method is automatically generated by the compiler
    // by collecting the following:
    // 1. All static variable assignment statements
    // 2. Statements in static blocks (static {})

    private static int a = 1;                    // Collected

    static {                                      // Collected
        a = 2;
        b = 20;  // Can assign, but cannot access (illegal forward reference)
        // System.out.println(b);  // Compilation error
    }

    private static int b = 10;                   // Collected

    static {                                      // Collected
        System.out.println("a = " + a);  // Output: a = 2
        System.out.println("b = " + b);  // Output: b = 10
    }

    // Final result: a = 2, b = 10 (later assignment overrides earlier one)
}
```

**Conditions that Trigger Initialization (only these six cases)**:

```java
public class InitTriggerDemo {

    public static void main(String[] args) throws Exception {

        // 1. Instantiate object using new keyword
        MyClass obj = new MyClass();

        // 2. Read or set class static field (except final constants)
        int value = MyClass.staticValue;
        MyClass.staticValue = 100;

        // 3. Call class static method
        MyClass.staticMethod();

        // 4. Use java.lang.reflect package methods for reflection calls
        Class<?> clazz = Class.forName("com.example.MyClass");

        // 5. When initializing a class, if its parent class is not yet initialized,
        // initialize the parent class first
        // When ChildClass initializes, ParentClass will be initialized first

        // 6. Main class containing main() method when JVM starts
    }
}

class MyClass {
    static int staticValue = 10;
    static void staticMethod() {}
}
```

**Cases that Do Not Trigger Initialization**:

```java
// Passive reference examples
public class PassiveReferenceDemo {

    public static void main(String[] args) {

        // Case 1: Referencing parent class static field through subclass
        // does not initialize subclass
        System.out.println(SubClass.parentValue);
        // Only SuperClass is initialized, SubClass is not

        // Case 2: Defining array reference of a class does not trigger initialization
        SuperClass[] arr = new SuperClass[10];
        // SuperClass is not initialized

        // Case 3: Referencing constants does not trigger initialization
        System.out.println(ConstantClass.HELLO);
        // Constants are already stored in the calling class's constant pool at compile time
        // ConstantClass is not initialized
    }
}

class SuperClass {
    static {
        System.out.println("SuperClass init!");
    }
    public static int parentValue = 100;
}

class SubClass extends SuperClass {
    static {
        System.out.println("SubClass init!");
    }
}

class ConstantClass {
    static {
        System.out.println("ConstantClass init!");
    }
    public static final String HELLO = "hello";
}
```

## Key Points

### Class Loader Architecture

```
                    +------------------+
                    |   Bootstrap      |
                    | ClassLoader      |
                    | [C++ impl]       |
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |   Platform       |
                    | ClassLoader      |
                    | [JDK 9+ replaces |
                    |  Extension]      |
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |   Application    |
                    | ClassLoader      |
                    | [loads classpath]|
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |     Custom       |
                    |   ClassLoader    |
                    +------------------+
```

### Three Core Class Loaders

```java
public class ClassLoaderHierarchyDemo {

    public static void main(String[] args) {

        // 1. Bootstrap ClassLoader
        // - Implemented in C++, part of the JVM
        // - Loads core class libraries from $JAVA_HOME/lib
        // - Loads java.*, javax.*, sun.*, etc. core classes
        // - Cannot be directly referenced by Java code, returns null
        ClassLoader bootstrapLoader = String.class.getClassLoader();
        System.out.println("String's ClassLoader: " + bootstrapLoader); // null

        // 2. Platform ClassLoader (JDK 9+)
        // - Called Extension ClassLoader in JDK 8 and earlier
        // - Loaded $JAVA_HOME/lib/ext directory (JDK 8)
        // - JDK 9+ loads standard modules outside java.se module
        ClassLoader platformLoader = ClassLoader.getPlatformClassLoader();
        System.out.println("Platform ClassLoader: " + platformLoader);

        // 3. Application ClassLoader
        // - Also called System ClassLoader
        // - Loads all classes on the user classpath
        // - Default class loader in the program
        ClassLoader appLoader = ClassLoaderHierarchyDemo.class.getClassLoader();
        System.out.println("Application ClassLoader: " + appLoader);

        // View class loader hierarchy
        ClassLoader loader = appLoader;
        while (loader != null) {
            System.out.println(loader);
            loader = loader.getParent();
        }
        // Output:
        // jdk.internal.loader.ClassLoaders$AppClassLoader@...
        // jdk.internal.loader.ClassLoaders$PlatformClassLoader@...
        // null (Bootstrap ClassLoader)
    }
}
```

### Parent Delegation Model

```
              Class Loading Request
                  |
                  v
        +-------------------+
        |  Application      |  <-- First receives request
        |  ClassLoader      |
        +--------+----------+
                 |
                 | Delegates to parent loader
                 v
        +-------------------+
        |  Platform         |
        |  ClassLoader      |
        +--------+----------+
                 |
                 | Delegates to parent loader
                 v
        +-------------------+
        |  Bootstrap        |  <-- First attempts to load
        |  ClassLoader      |
        +--------+----------+
                 |
                 | Cannot load, returns
                 v
        +-------------------+
        |  Platform         |  <-- Attempts to load
        |  ClassLoader      |
        +--------+----------+
                 |
                 | Cannot load, returns
                 v
        +-------------------+
        |  Application      |  <-- Finally attempts to load
        |  ClassLoader      |
        +-------------------+
```

**Implementation of Parent Delegation Model**:

```java
// Core logic of loadClass method in java.lang.ClassLoader
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 1. First check if the class is already loaded
        Class<?> c = findLoadedClass(name);

        if (c == null) {
            try {
                // 2. If there's a parent loader, delegate to parent
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    // 3. If no parent loader, delegate to bootstrap class loader
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // Parent loader cannot load, throws ClassNotFoundException
            }

            if (c == null) {
                // 4. Parent loader cannot load, call own findClass method
                c = findClass(name);
            }
        }

        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

**Advantages of Parent Delegation**:

```java
public class ParentDelegationBenefitsDemo {

    // Advantage 1: Avoid duplicate class loading
    // When parent loader has already loaded a class, child loader won't reload it

    // Advantage 2: Ensure security of Java core class library
    public static void main(String[] args) {
        // Even if you define a java.lang.String class
        // it cannot be loaded, because it will delegate to Bootstrap ClassLoader
        // Bootstrap ClassLoader will load the real String class

        String str = new String("Hello");
        System.out.println(str.getClass().getClassLoader()); // null

        // Without parent delegation, malicious code could replace core classes
        // causing serious security issues
    }
}
```

### Class Uniqueness

**In the JVM, two classes are considered the same only if**:
1. The fully qualified class name is the same
2. The class loader that loaded this class is the same

```java
public class ClassIdentityDemo {

    public static void main(String[] args) throws Exception {
        // Create two custom class loaders
        CustomClassLoader loader1 = new CustomClassLoader("./classes/");
        CustomClassLoader loader2 = new CustomClassLoader("./classes/");

        // Load the same class with different class loaders
        Class<?> clazz1 = loader1.loadClass("com.example.MyClass");
        Class<?> clazz2 = loader2.loadClass("com.example.MyClass");

        // Same class name
        System.out.println(clazz1.getName()); // com.example.MyClass
        System.out.println(clazz2.getName()); // com.example.MyClass

        // But they are not the same class!
        System.out.println(clazz1 == clazz2);               // false
        System.out.println(clazz1.equals(clazz2));          // false

        // Create instances
        Object obj1 = clazz1.getDeclaredConstructor().newInstance();
        Object obj2 = clazz2.getDeclaredConstructor().newInstance();

        // instanceof check fails
        System.out.println(clazz1.isInstance(obj2));        // false

        // If you try to cast, ClassCastException will be thrown
        // MyClass m = (MyClass) obj2;  // Exception!
    }
}
```

## Code Examples

### Basic Custom Class Loader Implementation

```java
import java.io.*;

/**
 * Custom class loader - loads classes from specified directory
 */
public class FileSystemClassLoader extends ClassLoader {

    private final String classPath;

    public FileSystemClassLoader(String classPath) {
        // Use default parent class loader (Application ClassLoader)
        this.classPath = classPath;
    }

    public FileSystemClassLoader(String classPath, ClassLoader parent) {
        // Specify parent class loader
        super(parent);
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = loadClassData(name);
            if (classData == null) {
                throw new ClassNotFoundException("Cannot find class: " + name);
            }
            // Call defineClass to convert byte array to Class object
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException("Failed to load class: " + name, e);
        }
    }

    private byte[] loadClassData(String className) throws IOException {
        // Convert class name to file path
        String path = classPath + File.separator
                    + className.replace('.', File.separatorChar) + ".class";

        File classFile = new File(path);
        if (!classFile.exists()) {
            return null;
        }

        try (InputStream is = new FileInputStream(classFile);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }

    // Usage example
    public static void main(String[] args) throws Exception {
        FileSystemClassLoader loader = new FileSystemClassLoader("/path/to/classes");

        // Load class
        Class<?> clazz = loader.loadClass("com.example.MyClass");

        // Create instance
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // Call method
        clazz.getMethod("sayHello").invoke(instance);
    }
}
```

### Network Class Loader

```java
import java.io.*;
import java.net.*;

/**
 * Class loader that loads classes from network
 */
public class NetworkClassLoader extends ClassLoader {

    private final String baseUrl;

    public NetworkClassLoader(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = downloadClassData(name);
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException("Cannot load class from network: " + name, e);
        }
    }

    private byte[] downloadClassData(String className) throws IOException {
        String urlPath = baseUrl + className.replace('.', '/') + ".class";
        URL url = new URL(urlPath);

        try (InputStream is = url.openStream();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }
}
```

### Encrypted Class Loader

```java
import javax.crypto.*;
import javax.crypto.spec.*;
import java.io.*;
import java.security.*;

/**
 * Class loader that loads encrypted class files
 */
public class EncryptedClassLoader extends ClassLoader {

    private final String classPath;
    private final SecretKey secretKey;

    public EncryptedClassLoader(String classPath, String password) throws Exception {
        this.classPath = classPath;
        this.secretKey = generateKey(password);
    }

    private SecretKey generateKey(String password) throws Exception {
        // Generate key using password
        byte[] keyBytes = password.getBytes();
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(keyBytes);
        byte[] keyData = new byte[16]; // AES-128
        System.arraycopy(hash, 0, keyData, 0, 16);
        return new SecretKeySpec(keyData, "AES");
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] encryptedData = loadEncryptedClassData(name);
            byte[] classData = decrypt(encryptedData);
            return defineClass(name, classData, 0, classData.length);
        } catch (Exception e) {
            throw new ClassNotFoundException("Cannot decrypt and load class: " + name, e);
        }
    }

    private byte[] loadEncryptedClassData(String className) throws IOException {
        String path = classPath + File.separator
                    + className.replace('.', File.separatorChar) + ".enc";

        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }

    private byte[] decrypt(byte[] data) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey);
        return cipher.doFinal(data);
    }

    // Encryption utility method (used to generate encrypted class files)
    public static void encryptClassFile(String inputPath, String outputPath,
                                        String password) throws Exception {
        // Read original class file
        byte[] classData;
        try (InputStream is = new FileInputStream(inputPath);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            classData = baos.toByteArray();
        }

        // Encrypt
        byte[] keyBytes = password.getBytes();
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(keyBytes);
        byte[] keyData = new byte[16];
        System.arraycopy(hash, 0, keyData, 0, 16);
        SecretKey key = new SecretKeySpec(keyData, "AES");

        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedData = cipher.doFinal(classData);

        // Write encrypted file
        try (OutputStream os = new FileOutputStream(outputPath)) {
            os.write(encryptedData);
        }
    }
}
```

### Hot Deployment Class Loader

```java
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * Class loader that supports hot deployment
 */
public class HotDeployClassLoader extends ClassLoader {

    private final String classPath;
    private final Map<String, Long> classModifiedTimes = new ConcurrentHashMap<>();
    private final Map<String, Class<?>> loadedClasses = new ConcurrentHashMap<>();

    public HotDeployClassLoader(String classPath, ClassLoader parent) {
        super(parent);
        this.classPath = classPath;
    }

    /**
     * Check if class needs to be reloaded
     */
    public boolean needsReload(String className) {
        String classFile = getClassFilePath(className);
        File file = new File(classFile);

        if (!file.exists()) {
            return false;
        }

        Long lastModified = classModifiedTimes.get(className);
        return lastModified == null || file.lastModified() > lastModified;
    }

    /**
     * Reload class (create new class loader instance)
     */
    public Class<?> reloadClass(String className) throws ClassNotFoundException {
        // Create new class loader instance to load new version of class
        HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath, getParent());
        return newLoader.loadClass(className);
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // Check if already loaded
        Class<?> loadedClass = loadedClasses.get(name);
        if (loadedClass != null && !needsReload(name)) {
            return loadedClass;
        }

        try {
            byte[] classData = loadClassData(name);
            Class<?> clazz = defineClass(name, classData, 0, classData.length);

            // Record loading time and class
            String classFile = getClassFilePath(name);
            classModifiedTimes.put(name, new File(classFile).lastModified());
            loadedClasses.put(name, clazz);

            return clazz;
        } catch (IOException e) {
            throw new ClassNotFoundException("Cannot load class: " + name, e);
        }
    }

    private String getClassFilePath(String className) {
        return classPath + File.separator
             + className.replace('.', File.separatorChar) + ".class";
    }

    private byte[] loadClassData(String className) throws IOException {
        String path = getClassFilePath(className);

        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }
}

/**
 * Hot Deployment Manager
 */
public class HotDeployManager {

    private final String classPath;
    private volatile HotDeployClassLoader currentLoader;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    public HotDeployManager(String classPath) {
        this.classPath = classPath;
        this.currentLoader = new HotDeployClassLoader(classPath,
            Thread.currentThread().getContextClassLoader());
    }

    /**
     * Start automatic hot deployment detection
     */
    public void startWatching(long intervalMs) {
        scheduler.scheduleAtFixedRate(this::checkAndReload,
            intervalMs, intervalMs, TimeUnit.MILLISECONDS);
    }

    private void checkAndReload() {
        // Check if any class needs to be reloaded
        boolean needsReload = false;
        for (String className : getMonitoredClasses()) {
            if (currentLoader.needsReload(className)) {
                needsReload = true;
                break;
            }
        }

        if (needsReload) {
            // Create new class loader
            HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath,
                Thread.currentThread().getContextClassLoader());

            // Atomic replacement
            currentLoader = newLoader;

            System.out.println("Hot deployment: Classes reloaded");
        }
    }

    public Class<?> loadClass(String name) throws ClassNotFoundException {
        return currentLoader.loadClass(name);
    }

    private List<String> getMonitoredClasses() {
        // Return list of classes to monitor
        return Arrays.asList("com.example.Plugin");
    }

    public void shutdown() {
        scheduler.shutdown();
    }
}
```

### Breaking the Parent Delegation Model

```java
/**
 * Class loader that breaks parent delegation
 * Used for class isolation, like Tomcat's Web application class loader
 */
public class BreakingDelegationClassLoader extends ClassLoader {

    private final String classPath;
    private final Set<String> breakDelegationPackages;

    public BreakingDelegationClassLoader(String classPath, Set<String> packages) {
        this.classPath = classPath;
        this.breakDelegationPackages = packages;
    }

    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            // First check if already loaded
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // Check if parent delegation should be broken
            if (shouldBreakDelegation(name)) {
                try {
                    // Try to load by self first
                    return findClass(name);
                } catch (ClassNotFoundException e) {
                    // Self loading failed, delegate to parent
                    return super.loadClass(name);
                }
            }

            // Normal parent delegation
            return super.loadClass(name);
        }
    }

    private boolean shouldBreakDelegation(String className) {
        // Core Java classes cannot break delegation
        if (className.startsWith("java.") ||
            className.startsWith("javax.") ||
            className.startsWith("sun.")) {
            return false;
        }

        // Check if in the break delegation package list
        for (String pkg : breakDelegationPackages) {
            if (className.startsWith(pkg)) {
                return true;
            }
        }
        return false;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = loadClassData(name);
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name, e);
        }
    }

    private byte[] loadClassData(String className) throws IOException {
        String path = classPath + File.separator
                    + className.replace('.', File.separatorChar) + ".class";

        try (InputStream is = new FileInputStream(path);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }
}
```

### SPI Mechanism and Thread Context Class Loader

```java
import java.sql.*;
import java.util.*;

/**
 * SPI (Service Provider Interface) mechanism example
 * Shows how to break parent delegation using thread context class loader
 */
public class SPIDemo {

    public static void main(String[] args) {
        // JDBC's DriverManager is a typical SPI application
        // DriverManager is loaded by Bootstrap ClassLoader
        // But it needs to load driver implementations loaded by Application ClassLoader

        // View thread context class loader
        ClassLoader contextLoader = Thread.currentThread().getContextClassLoader();
        System.out.println("Thread context class loader: " + contextLoader);

        // DriverManager internally uses ServiceLoader to load drivers
        // ServiceLoader.load(Driver.class) uses thread context class loader

        // Manual demonstration of ServiceLoader's working principle
        ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        System.out.println("Registered JDBC drivers:");
        for (Driver driver : drivers) {
            System.out.println("  - " + driver.getClass().getName());
            System.out.println("    Loader: " + driver.getClass().getClassLoader());
        }
    }
}

/**
 * Custom SPI example
 */
// Define SPI interface
interface MessageService {
    void sendMessage(String message);
}

// SPI implementation class (typically in a separate JAR)
class EmailMessageService implements MessageService {
    @Override
    public void sendMessage(String message) {
        System.out.println("Sending email: " + message);
    }
}

class SmsMessageService implements MessageService {
    @Override
    public void sendMessage(String message) {
        System.out.println("Sending SMS: " + message);
    }
}

// SPI consumer
class MessageServiceLoader {

    public static void main(String[] args) {
        // META-INF/services/MessageService file content:
        // com.example.EmailMessageService
        // com.example.SmsMessageService

        ServiceLoader<MessageService> services = ServiceLoader.load(MessageService.class);

        for (MessageService service : services) {
            service.sendMessage("Hello, SPI!");
        }
    }
}
```

## Best Practices

### Follow Parent Delegation Model

```java
/**
 * Recommended: Override findClass instead of loadClass
 */
public class BestPracticeClassLoader extends ClassLoader {

    // Correct approach: Override findClass
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // Custom loading logic
        byte[] classData = loadClassData(name);
        return defineClass(name, classData, 0, classData.length);
    }

    // Wrong approach: Overriding loadClass may break parent delegation
    // Unless you explicitly need to break parent delegation

    private byte[] loadClassData(String name) {
        // Loading logic
        return null;
    }
}
```

### Properly Handle Resource Loading

```java
public class ResourceLoadingDemo {

    public void loadResource() {
        // Recommended: Use current class's class loader
        InputStream is1 = getClass().getResourceAsStream("/config.properties");

        // Or use thread context class loader (commonly used in framework code)
        ClassLoader contextLoader = Thread.currentThread().getContextClassLoader();
        InputStream is2 = contextLoader.getResourceAsStream("config.properties");

        // Not recommended: Directly using ClassLoader.getSystemResourceAsStream
        // Because it only uses system class loader, cannot load resources
        // from custom class loaders
        InputStream is3 = ClassLoader.getSystemResourceAsStream("config.properties");
    }
}
```

### Avoid Memory Leaks

```java
/**
 * Class loader memory leak prevention
 */
public class ClassLoaderMemoryLeakPrevention {

    // Problem: Static references prevent class loader from being garbage collected
    // private static Class<?> cachedClass; // Dangerous!

    // Solution 1: Use weak references
    private static WeakReference<Class<?>> cachedClassRef;

    // Solution 2: Ensure cleanup during unloading
    public static void cleanup() {
        cachedClassRef = null;

        // Clean up ThreadLocal
        // If ThreadLocal's value references classes loaded by custom class loader
        // Must clean up before class loader is unloaded
    }

    // Solution 3: Avoid holding references to short-lived class loaders
    // in long-lived objects
    public void badPattern() {
        // Holding custom class loader reference in singleton pattern - Dangerous!
        // SingletonHolder.instance = customLoader.loadClass("...").newInstance();
    }
}
```

### Properly Use Thread Context Class Loader

```java
public class ContextClassLoaderBestPractice {

    public void executeWithContextLoader(ClassLoader loader, Runnable task) {
        // Save original context class loader
        ClassLoader originalLoader = Thread.currentThread().getContextClassLoader();

        try {
            // Set new context class loader
            Thread.currentThread().setContextClassLoader(loader);

            // Execute task
            task.run();
        } finally {
            // Restore original context class loader
            Thread.currentThread().setContextClassLoader(originalLoader);
        }
    }
}
```

### Handle Class Loader Isolation

```java
/**
 * Class loader isolation best practices
 */
public class ClassLoaderIsolationDemo {

    /**
     * Use interfaces for cross-class-loader communication
     */
    public interface Plugin {
        void execute();
    }

    /**
     * Plugin manager
     */
    public class PluginManager {

        private final Map<String, Plugin> plugins = new ConcurrentHashMap<>();

        public void loadPlugin(String name, String classPath, String className)
                throws Exception {

            // Create independent class loader for each plugin
            URLClassLoader pluginLoader = new URLClassLoader(
                new URL[]{new File(classPath).toURI().toURL()},
                Plugin.class.getClassLoader()  // Use interface's class loader as parent
            );

            // Load plugin implementation class
            Class<?> pluginClass = pluginLoader.loadClass(className);

            // Ensure it implements Plugin interface
            if (Plugin.class.isAssignableFrom(pluginClass)) {
                Plugin plugin = (Plugin) pluginClass.getDeclaredConstructor().newInstance();
                plugins.put(name, plugin);
            }
        }

        public void executePlugin(String name) {
            Plugin plugin = plugins.get(name);
            if (plugin != null) {
                plugin.execute();
            }
        }
    }
}
```

## Common Pitfalls

### ClassNotFoundException vs NoClassDefFoundError

```java
/**
 * ClassNotFoundException: Cannot find class during active loading
 * NoClassDefFoundError: Cannot find class during passive loading
 */
public class ClassNotFoundDemo {

    public void demonstrateExceptions() {
        // ClassNotFoundException - thrown during explicit loading
        try {
            Class.forName("com.nonexistent.MyClass");
        } catch (ClassNotFoundException e) {
            System.out.println("ClassNotFoundException: " + e.getMessage());
        }

        // NoClassDefFoundError - thrown during implicit loading
        // Example: Class A depends on class B, B doesn't exist when loading A
        try {
            // MyClass existed at compile time, doesn't exist at runtime
            // MyClass obj = new MyClass();
        } catch (NoClassDefFoundError e) {
            System.out.println("NoClassDefFoundError: " + e.getMessage());
        }
    }
}
```

### LinkageError: loader constraint violation

```java
/**
 * Class loader constraint violation
 * Can occur when the same class is loaded by different class loaders
 */
public class LinkageErrorDemo {

    public void demonstrateLinkageError() {
        // Scenario: Interface loaded by framework and implementation class
        // loaded by application are incompatible

        // Class loader A loaded IService interface
        // Class loader B also loaded IService interface
        // ServiceImpl loaded by class loader B implements B's IService
        // But runtime expects A's IService

        // Solutions:
        // 1. Ensure interfaces are loaded by common parent loader
        // 2. Correctly set parent-child relationships of class loaders
    }
}
```

### Deadlock Caused by Circular Dependencies

```java
/**
 * Class loading deadlock example
 */
public class ClassLoadingDeadlockDemo {

    // Class A's static initialization block references class B
    // Class B's static initialization block references class A
    // If two threads simultaneously trigger initialization of A and B,
    // deadlock may occur

    public static void main(String[] args) {
        // Thread 1 triggers ClassA initialization
        Thread t1 = new Thread(() -> {
            new ClassA();
        });

        // Thread 2 triggers ClassB initialization
        Thread t2 = new Thread(() -> {
            new ClassB();
        });

        t1.start();
        t2.start();
    }
}

class ClassA {
    static {
        System.out.println("ClassA init start");
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        new ClassB(); // References ClassB
        System.out.println("ClassA init end");
    }
}

class ClassB {
    static {
        System.out.println("ClassB init start");
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        new ClassA(); // References ClassA - may deadlock!
        System.out.println("ClassB init end");
    }
}
```

### Conditions for Class Unloading

```java
/**
 * Conditions required for class unloading
 */
public class ClassUnloadingDemo {

    public void explainUnloading() {
        // Class unloading requires all following conditions to be met:
        // 1. All instances of the class have been garbage collected
        // 2. The class loader that loaded this class has been garbage collected
        // 3. The Class object corresponding to this class has no references

        // Note:
        // - Classes loaded by Bootstrap ClassLoader are never unloaded
        // - Only classes loaded by custom class loaders can be unloaded
    }

    public void forceUnloading() throws Exception {
        // Create custom class loader
        CustomClassLoader loader = new CustomClassLoader("./classes/");

        // Load class
        Class<?> clazz = loader.loadClass("com.example.MyClass");
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // Clear all references
        instance = null;
        clazz = null;
        loader = null;

        // Suggest GC
        System.gc();

        // Class may be unloaded (not guaranteed)
    }
}
```

### Difference Between Class.forName and ClassLoader.loadClass

```java
/**
 * Class.forName vs ClassLoader.loadClass
 */
public class ForNameVsLoadClassDemo {

    public static void main(String[] args) throws Exception {

        // Class.forName(className) - will execute class initialization
        Class<?> clazz1 = Class.forName("com.example.MyClass");
        // Static block has been executed

        // Class.forName(className, false, classLoader) - can control whether to initialize
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        Class<?> clazz2 = Class.forName("com.example.MyClass", false, loader);
        // Static block has not been executed

        // ClassLoader.loadClass(className) - will not execute class initialization
        Class<?> clazz3 = loader.loadClass("com.example.AnotherClass");
        // Static block has not been executed, until first use
    }
}
```

## Performance Considerations

### Class Loading Performance Optimization

```java
/**
 * Class loading performance optimization strategies
 */
public class ClassLoadingPerformance {

    // 1. Use parallel class loading (JDK 7+)
    public static class ParallelClassLoader extends ClassLoader {

        static {
            // Register as parallel capable
            registerAsParallelCapable();
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            // Parallel class loaders can load different classes simultaneously
            // without blocking each other
            return super.findClass(name);
        }
    }

    // 2. Cache loaded classes
    private final Map<String, Class<?>> classCache = new ConcurrentHashMap<>();

    public Class<?> loadClassWithCache(String name) throws ClassNotFoundException {
        return classCache.computeIfAbsent(name, k -> {
            try {
                return Class.forName(k);
            } catch (ClassNotFoundException e) {
                throw new RuntimeException(e);
            }
        });
    }

    // 3. Preload critical classes
    public void preloadClasses(List<String> classNames) {
        for (String className : classNames) {
            try {
                Class.forName(className);
            } catch (ClassNotFoundException e) {
                // Log and continue preloading other classes
            }
        }
    }
}
```

### Avoid Duplicate Class Loading

```java
/**
 * Prevent loading the same class multiple times
 */
public class AvoidDuplicateLoading extends ClassLoader {

    private final Map<String, Class<?>> loadedClasses = new ConcurrentHashMap<>();

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // Check if already loaded
        Class<?> loadedClass = loadedClasses.get(name);
        if (loadedClass != null) {
            return loadedClass;
        }

        synchronized (getClassLoadingLock(name)) {
            // Double check
            loadedClass = loadedClasses.get(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            loadedClass = super.loadClass(name, resolve);
            loadedClasses.put(name, loadedClass);
            return loadedClass;
        }
    }
}
```

### Memory Impact of Massive Class Loading

```java
/**
 * Monitor memory impact of class loading
 */
public class ClassLoadingMemoryImpact {

    public static void monitorClassLoading() {
        // Get class loading MXBean
        ClassLoadingMXBean classLoadingBean = ManagementFactory.getClassLoadingMXBean();

        System.out.println("Loaded class count: " + classLoadingBean.getLoadedClassCount());
        System.out.println("Total loaded class count: " + classLoadingBean.getTotalLoadedClassCount());
        System.out.println("Unloaded class count: " + classLoadingBean.getUnloadedClassCount());

        // Enable verbose class loading logs
        // JVM parameter: -verbose:class
        // Or: -Xlog:class+load=info
    }

    // JVM parameter optimization
    // -XX:MetaspaceSize=256m      Initial metaspace size
    // -XX:MaxMetaspaceSize=512m   Maximum metaspace size
    // -XX:+UseCompressedClassPointers  Enable compressed class pointers
    // -XX:CompressedClassSpaceSize=256m  Compressed class space size
}
```

## Real-World Scenarios

### Scenario One: Implementing Plugin Architecture

```java
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.jar.*;

/**
 * Complete plugin system implementation
 */
public interface Plugin {
    String getName();
    void initialize();
    void execute();
    void shutdown();
}

public class PluginClassLoader extends URLClassLoader {

    private final Set<String> pluginPackages;

    public PluginClassLoader(URL[] urls, ClassLoader parent, Set<String> packages) {
        super(urls, parent);
        this.pluginPackages = packages;
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // Classes within plugin packages are loaded by self first
            if (isPluginClass(name)) {
                try {
                    loadedClass = findClass(name);
                    if (resolve) {
                        resolveClass(loadedClass);
                    }
                    return loadedClass;
                } catch (ClassNotFoundException e) {
                    // Not found, delegate to parent loader
                }
            }

            return super.loadClass(name, resolve);
        }
    }

    private boolean isPluginClass(String name) {
        for (String pkg : pluginPackages) {
            if (name.startsWith(pkg)) {
                return true;
            }
        }
        return false;
    }
}

public class PluginManager {

    private final Map<String, PluginContext> plugins = new ConcurrentHashMap<>();
    private final String pluginDir;

    public PluginManager(String pluginDir) {
        this.pluginDir = pluginDir;
    }

    public void loadPlugin(String pluginJar) throws Exception {
        File jarFile = new File(pluginDir, pluginJar);
        if (!jarFile.exists()) {
            throw new FileNotFoundException("Plugin not found: " + pluginJar);
        }

        // Read plugin configuration
        PluginConfig config = readPluginConfig(jarFile);

        // Create plugin class loader
        URL[] urls = {jarFile.toURI().toURL()};
        PluginClassLoader loader = new PluginClassLoader(
            urls,
            Plugin.class.getClassLoader(),
            config.getPackages()
        );

        // Load plugin main class
        Class<?> pluginClass = loader.loadClass(config.getMainClass());
        Plugin plugin = (Plugin) pluginClass.getDeclaredConstructor().newInstance();

        // Initialize plugin
        plugin.initialize();

        // Save plugin context
        plugins.put(plugin.getName(), new PluginContext(plugin, loader, config));

        System.out.println("Plugin loaded: " + plugin.getName());
    }

    public void unloadPlugin(String pluginName) {
        PluginContext context = plugins.remove(pluginName);
        if (context != null) {
            try {
                context.getPlugin().shutdown();
                context.getClassLoader().close();
                System.out.println("Plugin unloaded: " + pluginName);
            } catch (Exception e) {
                System.err.println("Failed to unload plugin: " + e.getMessage());
            }
        }
    }

    public void executePlugin(String pluginName) {
        PluginContext context = plugins.get(pluginName);
        if (context != null) {
            context.getPlugin().execute();
        }
    }

    private PluginConfig readPluginConfig(File jarFile) throws Exception {
        try (JarFile jar = new JarFile(jarFile)) {
            JarEntry entry = jar.getJarEntry("plugin.properties");
            if (entry == null) {
                throw new IllegalStateException("Missing plugin.properties");
            }

            Properties props = new Properties();
            props.load(jar.getInputStream(entry));

            return new PluginConfig(
                props.getProperty("mainClass"),
                new HashSet<>(Arrays.asList(props.getProperty("packages").split(",")))
            );
        }
    }

    // Inner class definitions
    private static class PluginContext {
        private final Plugin plugin;
        private final PluginClassLoader classLoader;
        private final PluginConfig config;

        PluginContext(Plugin plugin, PluginClassLoader classLoader, PluginConfig config) {
            this.plugin = plugin;
            this.classLoader = classLoader;
            this.config = config;
        }

        Plugin getPlugin() { return plugin; }
        PluginClassLoader getClassLoader() { return classLoader; }
    }

    private static class PluginConfig {
        private final String mainClass;
        private final Set<String> packages;

        PluginConfig(String mainClass, Set<String> packages) {
            this.mainClass = mainClass;
            this.packages = packages;
        }

        String getMainClass() { return mainClass; }
        Set<String> getPackages() { return packages; }
    }
}
```

### Scenario Two: Implementing Multi-Version Library Isolation

```java
/**
 * Simulate multi-version library isolation similar to OSGi
 */
public class ModuleClassLoader extends ClassLoader {

    private final String moduleName;
    private final String moduleVersion;
    private final URL[] classPath;
    private final Map<String, ModuleClassLoader> dependencies;

    public ModuleClassLoader(String name, String version, URL[] classPath,
                            Map<String, ModuleClassLoader> dependencies) {
        super(null); // Do not set parent class loader
        this.moduleName = name;
        this.moduleVersion = version;
        this.classPath = classPath;
        this.dependencies = dependencies;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // 1. First look in own class path
        for (URL url : classPath) {
            byte[] classData = loadClassFromUrl(url, name);
            if (classData != null) {
                return defineClass(name, classData, 0, classData.length);
            }
        }

        // 2. Look in dependency modules
        for (ModuleClassLoader dep : dependencies.values()) {
            try {
                return dep.loadClass(name);
            } catch (ClassNotFoundException e) {
                // Continue trying next dependency
            }
        }

        // 3. Finally delegate to system class loader (load JDK classes)
        return ClassLoader.getSystemClassLoader().loadClass(name);
    }

    private byte[] loadClassFromUrl(URL url, String className) {
        // Load class bytecode from URL
        String path = className.replace('.', '/') + ".class";
        try {
            URL classUrl = new URL(url, path);
            try (InputStream is = classUrl.openStream();
                 ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    baos.write(buffer, 0, bytesRead);
                }
                return baos.toByteArray();
            }
        } catch (IOException e) {
            return null;
        }
    }

    public String getModuleInfo() {
        return moduleName + ":" + moduleVersion;
    }
}

/**
 * Module Manager
 */
public class ModuleManager {

    private final Map<String, ModuleClassLoader> modules = new ConcurrentHashMap<>();

    public void installModule(String name, String version, URL[] classPath,
                             List<String> dependencyNames) {
        // Resolve dependencies
        Map<String, ModuleClassLoader> dependencies = new HashMap<>();
        for (String depName : dependencyNames) {
            ModuleClassLoader dep = modules.get(depName);
            if (dep != null) {
                dependencies.put(depName, dep);
            }
        }

        // Create module class loader
        ModuleClassLoader loader = new ModuleClassLoader(name, version, classPath, dependencies);

        // Register module
        modules.put(name + ":" + version, loader);
        System.out.println("Module installed: " + name + ":" + version);
    }

    public Class<?> loadClassFromModule(String moduleName, String className)
            throws ClassNotFoundException {
        ModuleClassLoader loader = modules.get(moduleName);
        if (loader == null) {
            throw new ClassNotFoundException("Module not found: " + moduleName);
        }
        return loader.loadClass(className);
    }
}
```

### Scenario Three: Web Container Class Loader (Similar to Tomcat)

```java
/**
 * Simulate Tomcat's Web application class loader
 */
public class WebAppClassLoader extends URLClassLoader {

    // Tomcat's class loading order:
    // 1. Bootstrap classes
    // 2. /WEB-INF/classes
    // 3. /WEB-INF/lib/*.jar
    // 4. Common ClassLoader (shared libraries)

    private final ClassLoader commonLoader;
    private final Set<String> delegatePackages;

    public WebAppClassLoader(URL[] urls, ClassLoader commonLoader) {
        super(urls, null);
        this.commonLoader = commonLoader;
        this.delegatePackages = new HashSet<>(Arrays.asList(
            "java.", "javax.", "sun.", "org.xml.", "org.w3c."
        ));
    }

    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        return loadClass(name, false);
    }

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            Class<?> clazz = findLoadedClass(name);
            if (clazz != null) {
                if (resolve) resolveClass(clazz);
                return clazz;
            }

            // 1. First try using system class loader (load JDK classes)
            if (isDelegateFirst(name)) {
                try {
                    clazz = getSystemClassLoader().loadClass(name);
                    if (resolve) resolveClass(clazz);
                    return clazz;
                } catch (ClassNotFoundException e) {
                    // Continue
                }
            }

            // 2. Try loading from Web application's own class path
            try {
                clazz = findClass(name);
                if (resolve) resolveClass(clazz);
                return clazz;
            } catch (ClassNotFoundException e) {
                // Continue
            }

            // 3. Finally delegate to Common ClassLoader
            if (commonLoader != null) {
                clazz = commonLoader.loadClass(name);
                if (resolve) resolveClass(clazz);
                return clazz;
            }

            throw new ClassNotFoundException(name);
        }
    }

    private boolean isDelegateFirst(String name) {
        for (String pkg : delegatePackages) {
            if (name.startsWith(pkg)) {
                return true;
            }
        }
        return false;
    }
}
```

## Interview Key Points

### Q1: What is the class loading process?

**Answer**: The class loading process is divided into three main phases:

1. **Loading**:
   - Obtain binary byte stream of a class through its fully qualified name
   - Transform byte stream into runtime data structure of method area
   - Generate Class object in memory

2. **Linking**:
   - **Verification**: Ensure bytecode conforms to JVM specifications
   - **Preparation**: Allocate memory for static variables and set zero values
   - **Resolution**: Convert symbolic references to direct references

3. **Initialization**:
   - Execute class constructor `<clinit>()` method
   - Initialize static variables and static blocks

### Q2: What is the parent delegation model? Why do we need it?

**Answer**: Parent delegation model workflow:
1. When a class loader receives a loading request, it first delegates to parent loader
2. Parent loader continues delegating upward until Bootstrap ClassLoader
3. If parent loader cannot load, child loader tries to load itself

**Advantages**:
- **Security**: Prevents core API from being tampered (e.g., custom java.lang.String)
- **Avoid duplicate loading**: Ensures a class is loaded only once
- **Clear hierarchy**: Ensures stable Java program execution

### Q3: How to break the parent delegation model?

**Answer**: There are several ways:

1. **Override loadClass() method**: Directly modify class loading logic
2. **Thread context class loader**: SPI mechanism uses this approach
3. **OSGi modularization**: Uses mesh class loading structure

```java
@Override
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    // Try to load by self first
    Class<?> c = findClass(name);
    if (c == null) {
        // Then delegate to parent
        c = super.loadClass(name, resolve);
    }
    return c;
}
```

### Q4: What's the difference between Class.forName() and ClassLoader.loadClass()?

| Aspect | Class.forName() | ClassLoader.loadClass() |
|--------|-----------------|------------------------|
| Initialization | Executes class initialization by default | Does not execute class initialization |
| Flexibility | Can control whether to initialize via parameter | Only loads without initializing |
| Common Use Cases | JDBC driver loading | Delayed initialization scenarios |

### Q5: When will class initialization be triggered?

**Cases that trigger initialization**:
1. Create object using new
2. Access class static field (non-final)
3. Call class static method
4. Reflection call (Class.forName)
5. When subclass initializes, parent class initializes first
6. Main class with main method

**Cases that do not trigger initialization**:
1. Subclass references parent class's static field
2. Defining class array
3. Referencing final constants

### Q6: How to implement hot deployment?

**Answer**: The key to hot deployment is replacing class loaders:

1. Create new class loader instance to load new version of class
2. Create new objects with new class loader
3. Replace old object references
4. Wait for old class loader to be garbage collected

```java
// Hot deployment example
HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath);
Class<?> newClass = newLoader.loadClass("com.example.MyClass");
Object newInstance = newClass.getDeclaredConstructor().newInstance();
// Replace references...
```

### Q7: How to troubleshoot OOM caused by class loaders?

**Troubleshooting steps**:
1. Use `jmap -clstats <pid>` to view class loader statistics
2. Check Metaspace usage
3. Analyze if there are many dynamically generated classes
4. Check for class loader leaks (not properly closed)

```bash
# Monitor class loading
-verbose:class
-Xlog:class+load=info

# Metaspace configuration
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m
```

## Further Reading

### Official Documentation

- [Java Language Specification - Loading, Linking, and Initializing](https://docs.oracle.com/javase/specs/jls/se17/html/jls-12.html)
- [JVM Specification - Class Loading](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html)
- [ClassLoader JavaDoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ClassLoader.html)

### Classic Books

- **"Understanding the JVM" (Zhou Zhiming)**: Chapter 7 covers class loading mechanism in detail
- **"Core Java"**: Covers basics of class loaders
- **"OSGi in Action"**: Deep dive into modular class loading

### Quality Articles

- [Understanding Java Class Loading](https://www.baeldung.com/java-classloaders)
- [Class Loaders in Java](https://www.javatpoint.com/classloader-in-java)
- [How to leak a ClassLoader](https://blog.frankel.ch/how-to-leak-classloader/)

### Related Tools

- **Arthas**: Alibaba's open-source Java diagnostic tool, supports class loader analysis
- **JProfiler**: Commercial JVM performance analysis tool
- **Eclipse MAT**: Memory analysis tool, can analyze class loader leaks
- **VisualVM**: Visual monitoring tool bundled with JDK

### Advanced Topics

- **JPMS (Java Platform Module System)**: Modular system in JDK 9+
- **OSGi**: Enterprise-grade modular framework
- **Bytecode Enhancement**: ASM, Javassist, ByteBuddy
- **Java Agent**: Bytecode injection based on Instrumentation API
