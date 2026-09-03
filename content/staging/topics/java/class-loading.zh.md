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
origin: old/src/content/docs/java/class-loading.zh.md
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

Java 类加载机制是 JVM 的核心组成部分，负责将 `.class` 文件中的字节码加载到内存中，并转换为可以被 JVM 直接使用的 Class 对象。深入理解类加载机制对于掌握 Java 运行时行为、实现热部署、插件化架构以及解决类冲突问题至关重要。

## 概念解释

### 什么是类加载

类加载是 JVM 将类的字节码文件（`.class` 文件）加载到内存，并对其进行验证、准备、解析和初始化，最终形成可以被 JVM 直接使用的 Java 类型（`Class` 对象）的过程。

```
.java 文件  -->  编译器(javac)  -->  .class 文件  -->  类加载器  -->  Class 对象
                                                          |
                                                          v
                                                    JVM 内存（方法区）
```

### 为什么需要类加载机制

1. **动态加载**：Java 采用运行时动态加载类的策略，而非一次性加载所有类
2. **安全性**：通过验证机制确保加载的类符合 JVM 规范，防止恶意代码
3. **命名空间隔离**：不同类加载器加载的类相互隔离，即使类名相同也是不同的类
4. **灵活性**：支持热部署、模块化、插件化等高级功能

### 历史背景

类加载机制从 Java 1.0 开始就是 JVM 的核心特性：

- **JDK 1.0-1.1**：简单的三层类加载器体系
- **JDK 1.2**：引入双亲委派模型
- **JDK 9**：模块化系统（JPMS）对类加载进行了重大改进
- **JDK 11+**：优化类加载性能，改进模块系统

## 核心原理

### 类的生命周期

一个类从加载到卸载，完整的生命周期包括以下七个阶段：

```
+--------+    +--------+    +--------+    +--------+    +--------+
| 加载    | -> | 验证    | -> | 准备    | -> | 解析    | -> | 初始化  |
|(Loading)|   |(Verify) |   |(Prepare)|   |(Resolve)|   |(Init)  |
+--------+    +--------+    +--------+    +--------+    +--------+
                  |______________|______________|
                              |
                           链接(Linking)
                              |
                              v
                        +--------+    +--------+
                        | 使用    | -> | 卸载    |
                        |(Using) |   |(Unload) |
                        +--------+    +--------+
```

### 阶段一：加载（Loading）

加载阶段完成三件事：

1. 通过类的全限定名获取定义此类的二进制字节流
2. 将字节流所代表的静态存储结构转换为方法区的运行时数据结构
3. 在内存中生成一个代表这个类的 `java.lang.Class` 对象

```java
// 类加载的触发方式
public class LoadingDemo {

    public static void main(String[] args) throws Exception {
        // 方式1：显式加载 - Class.forName()
        Class<?> clazz1 = Class.forName("com.example.MyClass");

        // 方式2：显式加载 - ClassLoader.loadClass()
        ClassLoader loader = LoadingDemo.class.getClassLoader();
        Class<?> clazz2 = loader.loadClass("com.example.MyClass");

        // 方式3：隐式加载 - new 关键字
        // MyClass obj = new MyClass();

        // 方式4：隐式加载 - 访问静态成员
        // int value = MyClass.STATIC_VALUE;
    }
}
```

**字节码来源**：

```java
// 字节码可以来自多种来源
public class BytecodeSourceDemo {

    // 1. 从本地文件系统加载 .class 文件
    // 2. 从 JAR/WAR 包中加载
    // 3. 从网络下载（Applet）
    // 4. 运行时动态生成（动态代理、CGLib）
    // 5. 从数据库读取
    // 6. 从加密文件解密后加载

    // 动态生成字节码示例
    public static void dynamicGeneration() {
        // 使用动态代理时，JVM 会在运行时生成代理类的字节码
        InvocationHandler handler = (proxy, method, args) -> {
            System.out.println("Before method: " + method.getName());
            return null;
        };

        Runnable proxy = (Runnable) Proxy.newProxyInstance(
            Runnable.class.getClassLoader(),
            new Class[]{Runnable.class},
            handler
        );

        // 查看代理类信息
        System.out.println("代理类: " + proxy.getClass().getName());
        // 输出: 代理类: com.sun.proxy.$Proxy0
    }
}
```

### 阶段二：链接（Linking）

链接分为三个子阶段：

#### 验证（Verification）

确保 Class 文件的字节流符合 JVM 规范，不会危害虚拟机安全。

```
验证内容:
+------------------+----------------------------------------+
|    验证类型       |              验证内容                   |
+------------------+----------------------------------------+
| 文件格式验证      | 魔数(0xCAFEBABE)、版本号、常量池等       |
| 元数据验证        | 语义分析，如是否有父类、是否继承final类   |
| 字节码验证        | 数据流和控制流分析，确保语义合法         |
| 符号引用验证      | 确保解析能正确执行                      |
+------------------+----------------------------------------+
```

```java
// 验证阶段会检查的内容
public class VerificationDemo {

    // 如果一个类文件被篡改，验证阶段会抛出异常
    public static void main(String[] args) {
        try {
            // 尝试加载一个被篡改的类
            // 如果字节码不合法，会抛出 VerifyError
            Class.forName("com.example.TamperedClass");
        } catch (VerifyError e) {
            System.out.println("字节码验证失败: " + e.getMessage());
        } catch (ClassNotFoundException e) {
            System.out.println("类不存在");
        }
    }
}
```

#### 准备（Preparation）

为类的静态变量分配内存并设置初始值（零值），这些变量使用的内存在方法区中分配。

```java
public class PreparationDemo {

    // 准备阶段：value = 0（int 的零值）
    // 初始化阶段：value = 123
    public static int value = 123;

    // 准备阶段：name = null（引用类型的零值）
    // 初始化阶段：name = "Hello"
    public static String name = "Hello";

    // 编译期常量，准备阶段直接赋值为 100
    // 因为 final static 基本类型/字符串字面量在编译期就确定了
    public static final int CONSTANT = 100;

    // 非编译期常量，准备阶段：randomValue = 0
    // 初始化阶段才计算值
    public static final int RANDOM_VALUE = new Random().nextInt();
}
```

**基本类型零值表**：

| 数据类型 | 零值 |
|---------|------|
| int | 0 |
| long | 0L |
| short | (short)0 |
| char | '\u0000' |
| byte | (byte)0 |
| boolean | false |
| float | 0.0f |
| double | 0.0d |
| reference | null |

#### 解析（Resolution）

将常量池中的符号引用替换为直接引用。

```java
public class ResolutionDemo {

    // 符号引用：用一组符号来描述引用的目标
    // 例如："java/lang/String" 是 String 类的符号引用

    // 直接引用：直接指向目标的指针、相对偏移量或句柄

    public void method() {
        // 编译时，这里是符号引用 "java/lang/String"
        // 运行时解析后，变成指向 String 类的直接引用
        String str = new String("Hello");

        // 方法调用也需要解析
        // 符号引用 "java/io/PrintStream.println:(Ljava/lang/String;)V"
        // 解析为 println 方法的直接引用
        System.out.println(str);
    }
}
```

解析的对象包括：
- 类或接口的解析
- 字段解析
- 方法解析
- 接口方法解析

### 阶段三：初始化（Initialization）

初始化阶段是执行类构造器 `<clinit>()` 方法的过程。

```java
public class InitializationDemo {

    // <clinit>() 方法由编译器自动收集以下内容合并产生:
    // 1. 所有静态变量的赋值动作
    // 2. 静态代码块(static {})中的语句

    private static int a = 1;                    // 收集

    static {                                      // 收集
        a = 2;
        b = 20;  // 可以赋值，但不能访问（非法前向引用）
        // System.out.println(b);  // 编译错误
    }

    private static int b = 10;                   // 收集

    static {                                      // 收集
        System.out.println("a = " + a);  // 输出: a = 2
        System.out.println("b = " + b);  // 输出: b = 10
    }

    // 最终: a = 2, b = 10（后面的赋值覆盖了前面的）
}
```

**触发初始化的条件（有且仅有以下六种情况）**：

```java
public class InitTriggerDemo {

    public static void main(String[] args) throws Exception {

        // 1. 使用 new 关键字实例化对象
        MyClass obj = new MyClass();

        // 2. 读取或设置类的静态字段（final 常量除外）
        int value = MyClass.staticValue;
        MyClass.staticValue = 100;

        // 3. 调用类的静态方法
        MyClass.staticMethod();

        // 4. 使用 java.lang.reflect 包的方法对类进行反射调用
        Class<?> clazz = Class.forName("com.example.MyClass");

        // 5. 初始化一个类时，如果其父类还未初始化，先初始化父类
        // ChildClass 初始化时，会先初始化 ParentClass

        // 6. JVM 启动时，包含 main() 方法的主类
    }
}

class MyClass {
    static int staticValue = 10;
    static void staticMethod() {}
}
```

**不会触发初始化的情况**：

```java
// 被动引用示例
public class PassiveReferenceDemo {

    public static void main(String[] args) {

        // 情况1: 通过子类引用父类的静态字段，不会初始化子类
        System.out.println(SubClass.parentValue);
        // 只会初始化 SuperClass，不会初始化 SubClass

        // 情况2: 通过数组定义引用类，不会触发初始化
        SuperClass[] arr = new SuperClass[10];
        // 不会初始化 SuperClass

        // 情况3: 引用常量不会触发初始化
        System.out.println(ConstantClass.HELLO);
        // 常量在编译期已经存入调用类的常量池
        // 不会初始化 ConstantClass
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

## 核心要点

### 类加载器体系结构

```
                    +------------------+
                    |   Bootstrap      |
                    | ClassLoader      |
                    | (启动类加载器)    |
                    | [C++ 实现]        |
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |   Platform       |
                    | ClassLoader      |
                    | (平台类加载器)    |
                    | [JDK 9+ 替代扩展] |
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |   Application    |
                    | ClassLoader      |
                    | (应用类加载器)    |
                    | [加载 classpath]  |
                    +--------+---------+
                             |
                             | parent
                             v
                    +------------------+
                    |     Custom       |
                    |   ClassLoader    |
                    | (自定义类加载器)  |
                    +------------------+
```

### 三种核心类加载器

```java
public class ClassLoaderHierarchyDemo {

    public static void main(String[] args) {

        // 1. Bootstrap ClassLoader（启动类加载器）
        // - 由 C++ 实现，是 JVM 的一部分
        // - 加载 $JAVA_HOME/lib 下的核心类库
        // - 加载 java.*, javax.*, sun.* 等核心类
        // - 无法被 Java 代码直接引用，返回 null
        ClassLoader bootstrapLoader = String.class.getClassLoader();
        System.out.println("String 的类加载器: " + bootstrapLoader); // null

        // 2. Platform ClassLoader（平台类加载器，JDK 9+）
        // - JDK 8 及之前叫 Extension ClassLoader（扩展类加载器）
        // - 加载 $JAVA_HOME/lib/ext 目录（JDK 8）
        // - JDK 9+ 加载 java.se 模块以外的标准模块
        ClassLoader platformLoader = ClassLoader.getPlatformClassLoader();
        System.out.println("平台类加载器: " + platformLoader);

        // 3. Application ClassLoader（应用类加载器）
        // - 也称为 System ClassLoader
        // - 加载用户类路径（classpath）上的所有类
        // - 是程序中默认的类加载器
        ClassLoader appLoader = ClassLoaderHierarchyDemo.class.getClassLoader();
        System.out.println("应用类加载器: " + appLoader);

        // 查看类加载器层级关系
        ClassLoader loader = appLoader;
        while (loader != null) {
            System.out.println(loader);
            loader = loader.getParent();
        }
        // 输出:
        // jdk.internal.loader.ClassLoaders$AppClassLoader@...
        // jdk.internal.loader.ClassLoaders$PlatformClassLoader@...
        // null (Bootstrap ClassLoader)
    }
}
```

### 双亲委派模型

```
              类加载请求
                  |
                  v
        +-------------------+
        |  Application      |  <-- 首先接收请求
        |  ClassLoader      |
        +--------+----------+
                 |
                 | 委派给父加载器
                 v
        +-------------------+
        |  Platform         |
        |  ClassLoader      |
        +--------+----------+
                 |
                 | 委派给父加载器
                 v
        +-------------------+
        |  Bootstrap        |  <-- 最先尝试加载
        |  ClassLoader      |
        +--------+----------+
                 |
                 | 无法加载，返回
                 v
        +-------------------+
        |  Platform         |  <-- 尝试加载
        |  ClassLoader      |
        +--------+----------+
                 |
                 | 无法加载，返回
                 v
        +-------------------+
        |  Application      |  <-- 最后尝试加载
        |  ClassLoader      |
        +-------------------+
```

**双亲委派模型的实现**：

```java
// java.lang.ClassLoader 中 loadClass 方法的核心逻辑
protected Class<?> loadClass(String name, boolean resolve)
    throws ClassNotFoundException
{
    synchronized (getClassLoadingLock(name)) {
        // 1. 首先检查类是否已经被加载
        Class<?> c = findLoadedClass(name);

        if (c == null) {
            try {
                // 2. 如果有父加载器，委派给父加载器
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    // 3. 如果没有父加载器，委派给启动类加载器
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父加载器无法加载，抛出 ClassNotFoundException
            }

            if (c == null) {
                // 4. 父加载器无法加载，调用自己的 findClass 方法
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

**双亲委派的优势**：

```java
public class ParentDelegationBenefitsDemo {

    // 优势1: 避免类的重复加载
    // 当父加载器已经加载过某个类时，子加载器不会再次加载

    // 优势2: 保证 Java 核心类库的安全性
    public static void main(String[] args) {
        // 即使你定义了一个 java.lang.String 类
        // 也无法被加载，因为会委派给 Bootstrap ClassLoader
        // Bootstrap ClassLoader 会加载真正的 String 类

        String str = new String("Hello");
        System.out.println(str.getClass().getClassLoader()); // null

        // 如果没有双亲委派，恶意代码可能会替换核心类
        // 造成严重的安全问题
    }
}
```

### 类的唯一性

**在 JVM 中，判断两个类是否相同，需要同时满足**：
1. 类的全限定名相同
2. 加载这个类的类加载器相同

```java
public class ClassIdentityDemo {

    public static void main(String[] args) throws Exception {
        // 创建两个自定义类加载器
        CustomClassLoader loader1 = new CustomClassLoader("./classes/");
        CustomClassLoader loader2 = new CustomClassLoader("./classes/");

        // 用不同的类加载器加载同一个类
        Class<?> clazz1 = loader1.loadClass("com.example.MyClass");
        Class<?> clazz2 = loader2.loadClass("com.example.MyClass");

        // 类名相同
        System.out.println(clazz1.getName()); // com.example.MyClass
        System.out.println(clazz2.getName()); // com.example.MyClass

        // 但它们不是同一个类！
        System.out.println(clazz1 == clazz2);               // false
        System.out.println(clazz1.equals(clazz2));          // false

        // 创建实例
        Object obj1 = clazz1.getDeclaredConstructor().newInstance();
        Object obj2 = clazz2.getDeclaredConstructor().newInstance();

        // instanceof 检查失败
        System.out.println(clazz1.isInstance(obj2));        // false

        // 如果尝试强制转换，会抛出 ClassCastException
        // MyClass m = (MyClass) obj2;  // 异常!
    }
}
```

## 代码示例

### 自定义类加载器基础实现

```java
import java.io.*;

/**
 * 自定义类加载器 - 从指定目录加载类
 */
public class FileSystemClassLoader extends ClassLoader {

    private final String classPath;

    public FileSystemClassLoader(String classPath) {
        // 使用默认的父类加载器（Application ClassLoader）
        this.classPath = classPath;
    }

    public FileSystemClassLoader(String classPath, ClassLoader parent) {
        // 指定父类加载器
        super(parent);
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = loadClassData(name);
            if (classData == null) {
                throw new ClassNotFoundException("无法找到类: " + name);
            }
            // 调用 defineClass 将字节数组转换为 Class 对象
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException("加载类失败: " + name, e);
        }
    }

    private byte[] loadClassData(String className) throws IOException {
        // 将类名转换为文件路径
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

    // 使用示例
    public static void main(String[] args) throws Exception {
        FileSystemClassLoader loader = new FileSystemClassLoader("/path/to/classes");

        // 加载类
        Class<?> clazz = loader.loadClass("com.example.MyClass");

        // 创建实例
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // 调用方法
        clazz.getMethod("sayHello").invoke(instance);
    }
}
```

### 网络类加载器

```java
import java.io.*;
import java.net.*;

/**
 * 从网络加载类的类加载器
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
            throw new ClassNotFoundException("无法从网络加载类: " + name, e);
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

### 加密类加载器

```java
import javax.crypto.*;
import javax.crypto.spec.*;
import java.io.*;
import java.security.*;

/**
 * 加载加密类文件的类加载器
 */
public class EncryptedClassLoader extends ClassLoader {

    private final String classPath;
    private final SecretKey secretKey;

    public EncryptedClassLoader(String classPath, String password) throws Exception {
        this.classPath = classPath;
        this.secretKey = generateKey(password);
    }

    private SecretKey generateKey(String password) throws Exception {
        // 使用密码生成密钥
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
            throw new ClassNotFoundException("无法解密加载类: " + name, e);
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

    // 加密工具方法（用于生成加密的类文件）
    public static void encryptClassFile(String inputPath, String outputPath,
                                        String password) throws Exception {
        // 读取原始类文件
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

        // 加密
        byte[] keyBytes = password.getBytes();
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(keyBytes);
        byte[] keyData = new byte[16];
        System.arraycopy(hash, 0, keyData, 0, 16);
        SecretKey key = new SecretKeySpec(keyData, "AES");

        Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedData = cipher.doFinal(classData);

        // 写入加密文件
        try (OutputStream os = new FileOutputStream(outputPath)) {
            os.write(encryptedData);
        }
    }
}
```

### 热部署类加载器

```java
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

/**
 * 支持热部署的类加载器
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
     * 检查类是否需要重新加载
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
     * 重新加载类（创建新的类加载器实例）
     */
    public Class<?> reloadClass(String className) throws ClassNotFoundException {
        // 创建新的类加载器实例来加载新版本的类
        HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath, getParent());
        return newLoader.loadClass(className);
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // 检查是否已加载
        Class<?> loadedClass = loadedClasses.get(name);
        if (loadedClass != null && !needsReload(name)) {
            return loadedClass;
        }

        try {
            byte[] classData = loadClassData(name);
            Class<?> clazz = defineClass(name, classData, 0, classData.length);

            // 记录加载时间和类
            String classFile = getClassFilePath(name);
            classModifiedTimes.put(name, new File(classFile).lastModified());
            loadedClasses.put(name, clazz);

            return clazz;
        } catch (IOException e) {
            throw new ClassNotFoundException("无法加载类: " + name, e);
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
 * 热部署管理器
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
     * 启动自动热部署检测
     */
    public void startWatching(long intervalMs) {
        scheduler.scheduleAtFixedRate(this::checkAndReload,
            intervalMs, intervalMs, TimeUnit.MILLISECONDS);
    }

    private void checkAndReload() {
        // 检查是否有类需要重新加载
        boolean needsReload = false;
        for (String className : getMonitoredClasses()) {
            if (currentLoader.needsReload(className)) {
                needsReload = true;
                break;
            }
        }

        if (needsReload) {
            // 创建新的类加载器
            HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath,
                Thread.currentThread().getContextClassLoader());

            // 原子替换
            currentLoader = newLoader;

            System.out.println("热部署: 已重新加载类");
        }
    }

    public Class<?> loadClass(String name) throws ClassNotFoundException {
        return currentLoader.loadClass(name);
    }

    private List<String> getMonitoredClasses() {
        // 返回需要监控的类列表
        return Arrays.asList("com.example.Plugin");
    }

    public void shutdown() {
        scheduler.shutdown();
    }
}
```

### 打破双亲委派模型

```java
/**
 * 打破双亲委派的类加载器
 * 用于实现类隔离，如 Tomcat 的 Web 应用类加载器
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
            // 首先检查是否已加载
            Class<?> loadedClass = findLoadedClass(name);
            if (loadedClass != null) {
                return loadedClass;
            }

            // 检查是否需要打破双亲委派
            if (shouldBreakDelegation(name)) {
                try {
                    // 先尝试自己加载
                    return findClass(name);
                } catch (ClassNotFoundException e) {
                    // 自己加载失败，再委派给父类
                    return super.loadClass(name);
                }
            }

            // 正常的双亲委派
            return super.loadClass(name);
        }
    }

    private boolean shouldBreakDelegation(String className) {
        // 核心 Java 类不能打破委派
        if (className.startsWith("java.") ||
            className.startsWith("javax.") ||
            className.startsWith("sun.")) {
            return false;
        }

        // 检查是否在打破委派的包列表中
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

### SPI 机制与线程上下文类加载器

```java
import java.sql.*;
import java.util.*;

/**
 * SPI (Service Provider Interface) 机制示例
 * 展示如何使用线程上下文类加载器打破双亲委派
 */
public class SPIDemo {

    public static void main(String[] args) {
        // JDBC 的 DriverManager 就是典型的 SPI 应用
        // DriverManager 由 Bootstrap ClassLoader 加载
        // 但它需要加载由 Application ClassLoader 加载的驱动实现

        // 查看线程上下文类加载器
        ClassLoader contextLoader = Thread.currentThread().getContextClassLoader();
        System.out.println("线程上下文类加载器: " + contextLoader);

        // DriverManager 内部使用 ServiceLoader 加载驱动
        // ServiceLoader.load(Driver.class) 使用线程上下文类加载器

        // 手动演示 ServiceLoader 的工作原理
        ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        System.out.println("已注册的 JDBC 驱动:");
        for (Driver driver : drivers) {
            System.out.println("  - " + driver.getClass().getName());
            System.out.println("    加载器: " + driver.getClass().getClassLoader());
        }
    }
}

/**
 * 自定义 SPI 示例
 */
// 定义 SPI 接口
interface MessageService {
    void sendMessage(String message);
}

// SPI 实现类（通常在单独的 JAR 中）
class EmailMessageService implements MessageService {
    @Override
    public void sendMessage(String message) {
        System.out.println("发送邮件: " + message);
    }
}

class SmsMessageService implements MessageService {
    @Override
    public void sendMessage(String message) {
        System.out.println("发送短信: " + message);
    }
}

// SPI 消费者
class MessageServiceLoader {

    public static void main(String[] args) {
        // META-INF/services/MessageService 文件内容:
        // com.example.EmailMessageService
        // com.example.SmsMessageService

        ServiceLoader<MessageService> services = ServiceLoader.load(MessageService.class);

        for (MessageService service : services) {
            service.sendMessage("Hello, SPI!");
        }
    }
}
```

## 最佳实践

### 遵循双亲委派模型

```java
/**
 * 推荐: 重写 findClass 而不是 loadClass
 */
public class BestPracticeClassLoader extends ClassLoader {

    // 正确做法: 重写 findClass
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // 自定义加载逻辑
        byte[] classData = loadClassData(name);
        return defineClass(name, classData, 0, classData.length);
    }

    // 错误做法: 重写 loadClass 可能破坏双亲委派
    // 除非你明确需要打破双亲委派

    private byte[] loadClassData(String name) {
        // 加载逻辑
        return null;
    }
}
```

### 正确处理资源加载

```java
public class ResourceLoadingDemo {

    public void loadResource() {
        // 推荐: 使用当前类的类加载器
        InputStream is1 = getClass().getResourceAsStream("/config.properties");

        // 或者使用线程上下文类加载器（在框架代码中常用）
        ClassLoader contextLoader = Thread.currentThread().getContextClassLoader();
        InputStream is2 = contextLoader.getResourceAsStream("config.properties");

        // 不推荐: 直接使用 ClassLoader.getSystemResourceAsStream
        // 因为它只使用系统类加载器，无法加载自定义类加载器的资源
        InputStream is3 = ClassLoader.getSystemResourceAsStream("config.properties");
    }
}
```

### 避免内存泄漏

```java
/**
 * 类加载器内存泄漏防护
 */
public class ClassLoaderMemoryLeakPrevention {

    // 问题: 静态引用会阻止类加载器被回收
    // private static Class<?> cachedClass; // 危险!

    // 解决方案1: 使用弱引用
    private static WeakReference<Class<?>> cachedClassRef;

    // 解决方案2: 确保在卸载时清理
    public static void cleanup() {
        cachedClassRef = null;

        // 清理 ThreadLocal
        // 如果 ThreadLocal 的值引用了自定义类加载器加载的类
        // 必须在类加载器卸载前清理
    }

    // 解决方案3: 避免在长生命周期对象中持有短生命周期类加载器的引用
    public void badPattern() {
        // 单例模式中持有自定义类加载器的引用 - 危险!
        // SingletonHolder.instance = customLoader.loadClass("...").newInstance();
    }
}
```

### 正确使用线程上下文类加载器

```java
public class ContextClassLoaderBestPractice {

    public void executeWithContextLoader(ClassLoader loader, Runnable task) {
        // 保存原来的上下文类加载器
        ClassLoader originalLoader = Thread.currentThread().getContextClassLoader();

        try {
            // 设置新的上下文类加载器
            Thread.currentThread().setContextClassLoader(loader);

            // 执行任务
            task.run();
        } finally {
            // 恢复原来的上下文类加载器
            Thread.currentThread().setContextClassLoader(originalLoader);
        }
    }
}
```

### 处理类加载器隔离

```java
/**
 * 类加载器隔离最佳实践
 */
public class ClassLoaderIsolationDemo {

    /**
     * 使用接口进行跨类加载器通信
     */
    public interface Plugin {
        void execute();
    }

    /**
     * 插件管理器
     */
    public class PluginManager {

        private final Map<String, Plugin> plugins = new ConcurrentHashMap<>();

        public void loadPlugin(String name, String classPath, String className)
                throws Exception {

            // 为每个插件创建独立的类加载器
            URLClassLoader pluginLoader = new URLClassLoader(
                new URL[]{new File(classPath).toURI().toURL()},
                Plugin.class.getClassLoader()  // 使用接口的类加载器作为父加载器
            );

            // 加载插件实现类
            Class<?> pluginClass = pluginLoader.loadClass(className);

            // 确保实现了 Plugin 接口
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

## 常见陷阱

### ClassNotFoundException vs NoClassDefFoundError

```java
/**
 * ClassNotFoundException: 主动加载类时找不到
 * NoClassDefFoundError: 被动加载类时找不到
 */
public class ClassNotFoundDemo {

    public void demonstrateExceptions() {
        // ClassNotFoundException - 显式加载时抛出
        try {
            Class.forName("com.nonexistent.MyClass");
        } catch (ClassNotFoundException e) {
            System.out.println("ClassNotFoundException: " + e.getMessage());
        }

        // NoClassDefFoundError - 隐式加载时抛出
        // 例如: 类 A 依赖类 B，加载 A 时 B 不存在
        try {
            // MyClass 编译时存在，运行时不存在
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
 * 类加载器约束冲突
 * 当同一个类被不同的类加载器加载时可能发生
 */
public class LinkageErrorDemo {

    public void demonstrateLinkageError() {
        // 场景: 框架加载的接口和应用加载的实现类不兼容

        // 类加载器 A 加载了 IService 接口
        // 类加载器 B 也加载了 IService 接口
        // 类加载器 B 加载的 ServiceImpl 实现了 B 的 IService
        // 但运行时期望的是 A 的 IService

        // 解决方案:
        // 1. 确保接口由共同的父加载器加载
        // 2. 正确设置类加载器的父子关系
    }
}
```

### 循环依赖导致的死锁

```java
/**
 * 类加载死锁示例
 */
public class ClassLoadingDeadlockDemo {

    // 类 A 的静态初始化块中引用类 B
    // 类 B 的静态初始化块中引用类 A
    // 如果两个线程同时触发 A 和 B 的初始化，可能死锁

    public static void main(String[] args) {
        // 线程 1 触发 ClassA 的初始化
        Thread t1 = new Thread(() -> {
            new ClassA();
        });

        // 线程 2 触发 ClassB 的初始化
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
        new ClassB(); // 引用 ClassB
        System.out.println("ClassA init end");
    }
}

class ClassB {
    static {
        System.out.println("ClassB init start");
        try { Thread.sleep(100); } catch (InterruptedException e) {}
        new ClassA(); // 引用 ClassA - 可能死锁!
        System.out.println("ClassB init end");
    }
}
```

### 类卸载的条件

```java
/**
 * 类卸载需要满足的条件
 */
public class ClassUnloadingDemo {

    public void explainUnloading() {
        // 类卸载需要同时满足以下条件:
        // 1. 该类的所有实例都已被回收
        // 2. 加载该类的类加载器已被回收
        // 3. 该类对应的 Class 对象没有被引用

        // 注意:
        // - Bootstrap ClassLoader 加载的类永远不会被卸载
        // - 只有自定义类加载器加载的类才有可能被卸载
    }

    public void forceUnloading() throws Exception {
        // 创建自定义类加载器
        CustomClassLoader loader = new CustomClassLoader("./classes/");

        // 加载类
        Class<?> clazz = loader.loadClass("com.example.MyClass");
        Object instance = clazz.getDeclaredConstructor().newInstance();

        // 清除所有引用
        instance = null;
        clazz = null;
        loader = null;

        // 建议 GC
        System.gc();

        // 类可能被卸载（不保证）
    }
}
```

### Class.forName 与 ClassLoader.loadClass 的区别

```java
/**
 * Class.forName vs ClassLoader.loadClass
 */
public class ForNameVsLoadClassDemo {

    public static void main(String[] args) throws Exception {

        // Class.forName(className) - 会执行类的初始化
        Class<?> clazz1 = Class.forName("com.example.MyClass");
        // 静态代码块已执行

        // Class.forName(className, false, classLoader) - 可以控制是否初始化
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        Class<?> clazz2 = Class.forName("com.example.MyClass", false, loader);
        // 静态代码块未执行

        // ClassLoader.loadClass(className) - 不会执行类的初始化
        Class<?> clazz3 = loader.loadClass("com.example.AnotherClass");
        // 静态代码块未执行，直到第一次使用
    }
}
```

## 性能考量

### 类加载性能优化

```java
/**
 * 类加载性能优化策略
 */
public class ClassLoadingPerformance {

    // 1. 使用并行类加载（JDK 7+）
    public static class ParallelClassLoader extends ClassLoader {

        static {
            // 注册为并行可用
            registerAsParallelCapable();
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            // 并行类加载器可以同时加载不同的类
            // 而不会相互阻塞
            return super.findClass(name);
        }
    }

    // 2. 缓存已加载的类
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

    // 3. 预加载关键类
    public void preloadClasses(List<String> classNames) {
        for (String className : classNames) {
            try {
                Class.forName(className);
            } catch (ClassNotFoundException e) {
                // 记录日志，继续预加载其他类
            }
        }
    }
}
```

### 避免重复类加载

```java
/**
 * 防止重复加载同一个类
 */
public class AvoidDuplicateLoading extends ClassLoader {

    private final Map<String, Class<?>> loadedClasses = new ConcurrentHashMap<>();

    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        // 检查是否已加载
        Class<?> loadedClass = loadedClasses.get(name);
        if (loadedClass != null) {
            return loadedClass;
        }

        synchronized (getClassLoadingLock(name)) {
            // 双重检查
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

### 大量类加载的内存影响

```java
/**
 * 监控类加载对内存的影响
 */
public class ClassLoadingMemoryImpact {

    public static void monitorClassLoading() {
        // 获取类加载 MXBean
        ClassLoadingMXBean classLoadingBean = ManagementFactory.getClassLoadingMXBean();

        System.out.println("已加载类数量: " + classLoadingBean.getLoadedClassCount());
        System.out.println("总加载类数量: " + classLoadingBean.getTotalLoadedClassCount());
        System.out.println("已卸载类数量: " + classLoadingBean.getUnloadedClassCount());

        // 启用详细类加载日志
        // JVM 参数: -verbose:class
        // 或: -Xlog:class+load=info
    }

    // JVM 参数优化
    // -XX:MetaspaceSize=256m      初始元空间大小
    // -XX:MaxMetaspaceSize=512m   最大元空间大小
    // -XX:+UseCompressedClassPointers  启用压缩类指针
    // -XX:CompressedClassSpaceSize=256m  压缩类空间大小
}
```

## 实战场景

### 场景一：实现插件化架构

```java
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.jar.*;

/**
 * 完整的插件系统实现
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

            // 插件包内的类优先由自己加载
            if (isPluginClass(name)) {
                try {
                    loadedClass = findClass(name);
                    if (resolve) {
                        resolveClass(loadedClass);
                    }
                    return loadedClass;
                } catch (ClassNotFoundException e) {
                    // 找不到则委托给父加载器
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
            throw new FileNotFoundException("插件不存在: " + pluginJar);
        }

        // 读取插件配置
        PluginConfig config = readPluginConfig(jarFile);

        // 创建插件类加载器
        URL[] urls = {jarFile.toURI().toURL()};
        PluginClassLoader loader = new PluginClassLoader(
            urls,
            Plugin.class.getClassLoader(),
            config.getPackages()
        );

        // 加载插件主类
        Class<?> pluginClass = loader.loadClass(config.getMainClass());
        Plugin plugin = (Plugin) pluginClass.getDeclaredConstructor().newInstance();

        // 初始化插件
        plugin.initialize();

        // 保存插件上下文
        plugins.put(plugin.getName(), new PluginContext(plugin, loader, config));

        System.out.println("插件已加载: " + plugin.getName());
    }

    public void unloadPlugin(String pluginName) {
        PluginContext context = plugins.remove(pluginName);
        if (context != null) {
            try {
                context.getPlugin().shutdown();
                context.getClassLoader().close();
                System.out.println("插件已卸载: " + pluginName);
            } catch (Exception e) {
                System.err.println("卸载插件失败: " + e.getMessage());
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
                throw new IllegalStateException("缺少 plugin.properties");
            }

            Properties props = new Properties();
            props.load(jar.getInputStream(entry));

            return new PluginConfig(
                props.getProperty("mainClass"),
                new HashSet<>(Arrays.asList(props.getProperty("packages").split(",")))
            );
        }
    }

    // 内部类定义
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

### 场景二：实现多版本类库隔离

```java
/**
 * 模拟类似 OSGi 的多版本类库隔离
 */
public class ModuleClassLoader extends ClassLoader {

    private final String moduleName;
    private final String moduleVersion;
    private final URL[] classPath;
    private final Map<String, ModuleClassLoader> dependencies;

    public ModuleClassLoader(String name, String version, URL[] classPath,
                            Map<String, ModuleClassLoader> dependencies) {
        super(null); // 不设置父类加载器
        this.moduleName = name;
        this.moduleVersion = version;
        this.classPath = classPath;
        this.dependencies = dependencies;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        // 1. 首先在自己的类路径中查找
        for (URL url : classPath) {
            byte[] classData = loadClassFromUrl(url, name);
            if (classData != null) {
                return defineClass(name, classData, 0, classData.length);
            }
        }

        // 2. 在依赖模块中查找
        for (ModuleClassLoader dep : dependencies.values()) {
            try {
                return dep.loadClass(name);
            } catch (ClassNotFoundException e) {
                // 继续尝试下一个依赖
            }
        }

        // 3. 最后委托给系统类加载器（加载 JDK 类）
        return ClassLoader.getSystemClassLoader().loadClass(name);
    }

    private byte[] loadClassFromUrl(URL url, String className) {
        // 从 URL 加载类字节码
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
 * 模块管理器
 */
public class ModuleManager {

    private final Map<String, ModuleClassLoader> modules = new ConcurrentHashMap<>();

    public void installModule(String name, String version, URL[] classPath,
                             List<String> dependencyNames) {
        // 解析依赖
        Map<String, ModuleClassLoader> dependencies = new HashMap<>();
        for (String depName : dependencyNames) {
            ModuleClassLoader dep = modules.get(depName);
            if (dep != null) {
                dependencies.put(depName, dep);
            }
        }

        // 创建模块类加载器
        ModuleClassLoader loader = new ModuleClassLoader(name, version, classPath, dependencies);

        // 注册模块
        modules.put(name + ":" + version, loader);
        System.out.println("模块已安装: " + name + ":" + version);
    }

    public Class<?> loadClassFromModule(String moduleName, String className)
            throws ClassNotFoundException {
        ModuleClassLoader loader = modules.get(moduleName);
        if (loader == null) {
            throw new ClassNotFoundException("模块不存在: " + moduleName);
        }
        return loader.loadClass(className);
    }
}
```

### 场景三：Web 容器类加载器（类似 Tomcat）

```java
/**
 * 模拟 Tomcat 的 Web 应用类加载器
 */
public class WebAppClassLoader extends URLClassLoader {

    // Tomcat 的类加载顺序:
    // 1. Bootstrap classes
    // 2. /WEB-INF/classes
    // 3. /WEB-INF/lib/*.jar
    // 4. Common ClassLoader (共享类库)

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

            // 1. 首先尝试使用系统类加载器（加载 JDK 类）
            if (isDelegateFirst(name)) {
                try {
                    clazz = getSystemClassLoader().loadClass(name);
                    if (resolve) resolveClass(clazz);
                    return clazz;
                } catch (ClassNotFoundException e) {
                    // 继续
                }
            }

            // 2. 尝试在 Web 应用自己的类路径中加载
            try {
                clazz = findClass(name);
                if (resolve) resolveClass(clazz);
                return clazz;
            } catch (ClassNotFoundException e) {
                // 继续
            }

            // 3. 最后委托给 Common ClassLoader
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

## 面试要点

### Q1: 类加载的过程是什么？

**答**: 类加载过程分为三个主要阶段：

1. **加载（Loading）**：
   - 通过类的全限定名获取类的二进制字节流
   - 将字节流转换为方法区的运行时数据结构
   - 在内存中生成 Class 对象

2. **链接（Linking）**：
   - **验证**：确保字节码符合 JVM 规范
   - **准备**：为静态变量分配内存并设置零值
   - **解析**：将符号引用转换为直接引用

3. **初始化（Initialization）**：
   - 执行类构造器 `<clinit>()` 方法
   - 初始化静态变量和静态代码块

### Q2: 什么是双亲委派模型？为什么需要它？

**答**: 双亲委派模型的工作流程：
1. 类加载器收到加载请求时，首先委派给父类加载器
2. 父类加载器继续向上委派，直到启动类加载器
3. 如果父类加载器无法加载，子类加载器才尝试自己加载

**优势**：
- **安全性**：防止核心 API 被篡改（如自定义 java.lang.String）
- **避免重复加载**：确保同一个类只被加载一次
- **层次分明**：保证 Java 程序的稳定运行

### Q3: 如何打破双亲委派模型？

**答**: 有以下几种方式：

1. **重写 loadClass() 方法**：直接修改类加载逻辑
2. **线程上下文类加载器**：SPI 机制使用此方式
3. **OSGi 模块化**：使用网状类加载结构

```java
@Override
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    // 先尝试自己加载
    Class<?> c = findClass(name);
    if (c == null) {
        // 再委派给父类
        c = super.loadClass(name, resolve);
    }
    return c;
}
```

### Q4: Class.forName() 和 ClassLoader.loadClass() 的区别？

| 方面 | Class.forName() | ClassLoader.loadClass() |
|------|-----------------|------------------------|
| 初始化 | 默认执行类的初始化 | 不执行类的初始化 |
| 灵活性 | 可通过参数控制是否初始化 | 只加载不初始化 |
| 常用场景 | JDBC 驱动加载 | 延迟初始化场景 |

### Q5: 什么情况下会触发类的初始化？

**会触发初始化的情况**：
1. new 创建对象
2. 访问类的静态字段（非 final）
3. 调用类的静态方法
4. 反射调用（Class.forName）
5. 子类初始化时，父类先初始化
6. main 方法所在的主类

**不会触发初始化的情况**：
1. 子类引用父类的静态字段
2. 定义类数组
3. 引用 final 常量

### Q6: 如何实现热部署？

**答**: 热部署的关键是替换类加载器：

1. 创建新的类加载器实例加载新版本的类
2. 用新类加载器创建新对象
3. 替换旧对象的引用
4. 等待旧类加载器被 GC 回收

```java
// 热部署示例
HotDeployClassLoader newLoader = new HotDeployClassLoader(classPath);
Class<?> newClass = newLoader.loadClass("com.example.MyClass");
Object newInstance = newClass.getDeclaredConstructor().newInstance();
// 替换引用...
```

### Q7: 类加载器导致的 OOM 怎么排查？

**排查步骤**：
1. 使用 `jmap -clstats <pid>` 查看类加载器统计
2. 检查 Metaspace 使用情况
3. 分析是否有大量动态生成的类
4. 检查是否有类加载器泄漏（未正确关闭）

```bash
# 监控类加载
-verbose:class
-Xlog:class+load=info

# Metaspace 配置
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m
```

## 延伸阅读

### 官方文档

- [Java Language Specification - Loading, Linking, and Initializing](https://docs.oracle.com/javase/specs/jls/se17/html/jls-12.html)
- [JVM Specification - Class Loading](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html)
- [ClassLoader JavaDoc](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/ClassLoader.html)

### 经典书籍

- **《深入理解Java虚拟机》(周志明)**：第7章详细讲解类加载机制
- **《Java核心技术》**：涵盖类加载器的基础知识
- **《OSGi实战》**：深入了解模块化类加载

### 优质文章

- [Understanding Java Class Loading](https://www.baeldung.com/java-classloaders)
- [Class Loaders in Java](https://www.javatpoint.com/classloader-in-java)
- [How to leak a ClassLoader](https://blog.frankel.ch/how-to-leak-classloader/)

### 相关工具

- **Arthas**：阿里开源的 Java 诊断工具，支持类加载器分析
- **JProfiler**：商业 JVM 性能分析工具
- **Eclipse MAT**：内存分析工具，可分析类加载器泄漏
- **VisualVM**：JDK 自带的可视化监控工具

### 进阶主题

- **JPMS (Java Platform Module System)**：JDK 9+ 的模块化系统
- **OSGi**：企业级模块化框架
- **字节码增强**：ASM、Javassist、ByteBuddy
- **Java Agent**：基于 Instrumentation API 的字节码注入
