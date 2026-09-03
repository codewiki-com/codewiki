---
title: Maven构建工具
description: Maven完全指南，项目管理、依赖管理与生命周期
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Maven
  - 构建工具
  - 依赖管理
status: imported
origin: old/src/content/docs/java/maven.zh.md
divergence: 0.317
issues: []
legacy:
  category: Java
  subcategory: 工具链
  order: 15
  lastUpdated: 2026-01-07
---

Maven 是 Apache 软件基金会开发的一款强大的项目管理和构建工具。它基于项目对象模型（POM）的概念，通过一小段描述信息来管理项目的构建、报告和文档。Maven 已成为 Java 生态系统中最广泛使用的构建工具之一。

## Maven 概述

### 什么是 Maven

Maven 这个词来自意第绪语，意为"知识的积累者"。它主要服务于基于 Java 的项目构建、依赖管理和项目信息管理。

Maven 的核心功能：

- **项目构建**：提供标准化的构建流程
- **依赖管理**：自动下载和管理项目依赖
- **项目信息管理**：生成项目文档、测试报告等
- **统一开发规范**：约定优于配置的理念

### 安装与配置

#### 下载安装

```bash
# 下载 Maven（以 3.9.x 为例）
wget https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz

# 解压到指定目录
tar -xzf apache-maven-3.9.6-bin.tar.gz -C /opt/

# 创建软链接
ln -s /opt/apache-maven-3.9.6 /opt/maven
```

#### 环境变量配置

```bash
# 编辑 ~/.bashrc 或 ~/.zshrc
export MAVEN_HOME=/opt/maven
export PATH=$MAVEN_HOME/bin:$PATH

# 可选：配置 Maven 选项
export MAVEN_OPTS="-Xms256m -Xmx512m"
```

#### 验证安装

```bash
mvn -version
# Apache Maven 3.9.6
# Maven home: /opt/maven
# Java version: 21.0.1, vendor: Eclipse Adoptium
```

### 目录结构

Maven 采用约定优于配置的原则，推荐标准的目录结构：

```
my-project/
├── pom.xml                 # 项目描述文件
├── src/
│   ├── main/
│   │   ├── java/           # 主代码目录
│   │   ├── resources/      # 主资源文件
│   │   └── webapp/         # Web 应用资源（WAR 项目）
│   └── test/
│       ├── java/           # 测试代码目录
│       └── resources/      # 测试资源文件
└── target/                 # 构建输出目录
    ├── classes/            # 编译后的类文件
    ├── test-classes/       # 编译后的测试类
    └── *.jar               # 打包后的构件
```

## POM 文件详解

POM（Project Object Model）是 Maven 的核心配置文件，定义了项目的基本信息、依赖关系、构建配置等。

### 基本结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">

    <!-- POM 模型版本，目前固定为 4.0.0 -->
    <modelVersion>4.0.0</modelVersion>

    <!-- 项目坐标 -->
    <groupId>com.example</groupId>        <!-- 组织/公司标识 -->
    <artifactId>my-project</artifactId>   <!-- 项目/模块标识 -->
    <version>1.0.0-SNAPSHOT</version>     <!-- 版本号 -->
    <packaging>jar</packaging>            <!-- 打包类型：jar/war/pom/ear -->

    <!-- 项目描述信息 -->
    <name>My Project</name>
    <description>A sample Maven project</description>
    <url>https://example.com/my-project</url>

    <!-- 属性定义 -->
    <properties>
        <java.version>21</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
    </properties>

    <!-- 依赖管理 -->
    <dependencies>
        <!-- 依赖项在这里定义 -->
    </dependencies>

    <!-- 构建配置 -->
    <build>
        <!-- 构建相关配置 -->
    </build>

</project>
```

### 项目坐标（GAV）

Maven 使用坐标（Coordinates）来唯一标识一个构件：

```xml
<groupId>org.springframework</groupId>
<artifactId>spring-core</artifactId>
<version>6.1.3</version>
<classifier>sources</classifier>  <!-- 可选：附属构件分类器 -->
<type>jar</type>                  <!-- 可选：构件类型，默认 jar -->
```

- **groupId**：通常是组织或公司的域名倒写
- **artifactId**：项目或模块的唯一标识
- **version**：版本号，SNAPSHOT 表示快照版本
- **classifier**：用于区分同一版本的不同构件（如 sources、javadoc）
- **type**：构件的打包类型

### 版本管理

#### 版本号规范

Maven 推荐使用语义化版本号：

```
<major>.<minor>.<patch>[-<qualifier>]

示例：
1.0.0         - 正式版本
1.0.0-SNAPSHOT - 快照版本（开发中）
1.0.0-alpha   - Alpha 测试版
1.0.0-beta    - Beta 测试版
1.0.0-RC1     - 发布候选版本
```

#### 版本范围

```xml
<!-- 精确版本 -->
<version>1.0.0</version>

<!-- 版本范围 -->
<version>[1.0.0,2.0.0)</version>  <!-- 1.0.0 <= version < 2.0.0 -->
<version>[1.0.0,]</version>       <!-- version >= 1.0.0 -->
<version>[,2.0.0]</version>       <!-- version <= 2.0.0 -->
```

### 属性（Properties）

属性用于定义可重用的值：

```xml
<properties>
    <!-- 内置属性 -->
    <!-- ${project.basedir} - 项目根目录 -->
    <!-- ${project.version} - 项目版本 -->

    <!-- 自定义属性 -->
    <spring.version>6.1.3</spring.version>
    <junit.version>5.10.1</junit.version>

    <!-- 编码设置 -->
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
</properties>

<!-- 使用属性 -->
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>${spring.version}</version>
</dependency>
```

## 依赖管理

### 声明依赖

```xml
<dependencies>
    <!-- 编译时依赖 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>6.1.3</version>
    </dependency>

    <!-- 测试依赖 -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.1</version>
        <scope>test</scope>
    </dependency>

    <!-- 可选依赖 -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>2.0.11</version>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### 依赖范围（Scope）

| Scope | 编译 | 测试 | 运行 | 说明 |
|-------|------|------|------|------|
| compile | Y | Y | Y | 默认范围，全程有效 |
| provided | Y | Y | N | 编译和测试有效，运行时由容器提供 |
| runtime | N | Y | Y | 测试和运行有效，编译时不需要 |
| test | N | Y | N | 仅测试时有效 |
| system | Y | Y | N | 类似 provided，需指定本地路径 |
| import | - | - | - | 仅用于 dependencyManagement，导入 BOM |

```xml
<!-- provided 示例：Servlet API 由容器提供 -->
<dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>6.0.0</version>
    <scope>provided</scope>
</dependency>

<!-- runtime 示例：JDBC 驱动 -->
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.3.0</version>
    <scope>runtime</scope>
</dependency>

<!-- system 示例：本地 JAR（不推荐） -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>local-lib</artifactId>
    <version>1.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/lib/local-lib.jar</systemPath>
</dependency>
```

### 依赖传递

Maven 会自动解析依赖的依赖（传递依赖）：

```
A -> B -> C

当项目 A 依赖 B，B 依赖 C 时：
- C 会自动成为 A 的传递依赖
- 传递依赖的 scope 会受到影响
```

**传递依赖的 Scope 变化规则**：

| 直接依赖 \ 传递依赖 | compile | provided | runtime | test |
|---------------------|---------|----------|---------|------|
| compile | compile | - | runtime | - |
| provided | provided | - | provided | - |
| runtime | runtime | - | runtime | - |
| test | test | - | test | - |

### 排除依赖

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>6.1.3</version>
    <exclusions>
        <!-- 排除不需要的传递依赖 -->
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

### 依赖管理（dependencyManagement）

用于统一管理依赖版本，子模块无需指定版本：

```xml
<!-- 父 POM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>6.1.3</version>
        </dependency>

        <!-- 导入 BOM（Bill of Materials） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.2</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- 子模块只需声明 groupId 和 artifactId -->
<dependencies>
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-core</artifactId>
        <!-- version 从 dependencyManagement 继承 -->
    </dependency>
</dependencies>
```

### 依赖冲突解决

Maven 使用以下策略解决版本冲突：

1. **最短路径优先**：依赖树中路径最短的版本优先
2. **先声明优先**：相同路径长度时，先声明的优先

```xml
<!-- 使用 dependency:tree 分析依赖 -->
<!-- mvn dependency:tree -->

<!-- 强制使用特定版本 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>33.0.0-jre</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## 构建生命周期

Maven 定义了三个标准的构建生命周期：clean、default 和 site。

### Clean 生命周期

清理项目构建产物：

| 阶段 | 说明 |
|------|------|
| pre-clean | 执行清理前的准备工作 |
| clean | 删除上次构建生成的文件 |
| post-clean | 执行清理后的收尾工作 |

```bash
mvn clean
```

### Default 生命周期

项目的主要构建过程：

| 阶段 | 说明 |
|------|------|
| validate | 验证项目正确性 |
| compile | 编译主代码 |
| test-compile | 编译测试代码 |
| test | 运行单元测试 |
| package | 打包（jar/war） |
| verify | 验证包的有效性 |
| install | 安装到本地仓库 |
| deploy | 部署到远程仓库 |

```bash
# 常用命令
mvn compile        # 编译
mvn test           # 测试
mvn package        # 打包
mvn install        # 安装到本地仓库
mvn deploy         # 部署到远程仓库

# 跳过测试
mvn package -DskipTests           # 跳过测试执行
mvn package -Dmaven.test.skip=true # 跳过测试编译和执行
```

### Site 生命周期

生成项目文档站点：

| 阶段 | 说明 |
|------|------|
| pre-site | 准备生成站点 |
| site | 生成项目站点文档 |
| post-site | 站点生成后处理 |
| site-deploy | 部署站点到服务器 |

```bash
mvn site
```

### 生命周期与插件

生命周期的阶段由插件目标（goal）来执行：

```xml
<!-- 阶段与默认插件绑定 -->
compile      -> maven-compiler-plugin:compile
test-compile -> maven-compiler-plugin:testCompile
test         -> maven-surefire-plugin:test
package      -> maven-jar-plugin:jar (JAR 项目)
install      -> maven-install-plugin:install
deploy       -> maven-deploy-plugin:deploy
```

## 插件配置

### 编译插件

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.12.1</version>
            <configuration>
                <source>21</source>
                <target>21</target>
                <encoding>UTF-8</encoding>
                <compilerArgs>
                    <arg>-parameters</arg>  <!-- 保留方法参数名 -->
                    <arg>--enable-preview</arg>  <!-- 启用预览特性 -->
                </compilerArgs>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>1.18.30</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 打包插件

#### 可执行 JAR

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-jar-plugin</artifactId>
    <version>3.3.0</version>
    <configuration>
        <archive>
            <manifest>
                <mainClass>com.example.Application</mainClass>
                <addClasspath>true</addClasspath>
                <classpathPrefix>lib/</classpathPrefix>
            </manifest>
        </archive>
    </configuration>
</plugin>
```

#### Fat JAR（含依赖）

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.5.1</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <transformers>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <mainClass>com.example.Application</mainClass>
                    </transformer>
                    <!-- 合并 Spring 配置文件 -->
                    <transformer implementation="org.apache.maven.plugins.shade.resource.AppendingTransformer">
                        <resource>META-INF/spring.handlers</resource>
                    </transformer>
                </transformers>
                <filters>
                    <filter>
                        <artifact>*:*</artifact>
                        <excludes>
                            <exclude>META-INF/*.SF</exclude>
                            <exclude>META-INF/*.DSA</exclude>
                            <exclude>META-INF/*.RSA</exclude>
                        </excludes>
                    </filter>
                </filters>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 测试插件

```xml
<!-- 单元测试 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>
        <excludes>
            <exclude>**/*IntegrationTest.java</exclude>
        </excludes>
        <argLine>-Xmx1024m</argLine>
        <parallel>methods</parallel>
        <threadCount>4</threadCount>
    </configuration>
</plugin>

<!-- 集成测试 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <version>3.2.5</version>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <includes>
            <include>**/*IntegrationTest.java</include>
            <include>**/*IT.java</include>
        </includes>
    </configuration>
</plugin>
```

### 资源处理插件

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <encoding>UTF-8</encoding>
        <!-- 启用资源过滤（变量替换） -->
        <delimiters>
            <delimiter>@</delimiter>
        </delimiters>
        <useDefaultDelimiters>false</useDefaultDelimiters>
    </configuration>
</plugin>

<!-- 在 build 中配置资源过滤 -->
<build>
    <resources>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>true</filtering>
            <includes>
                <include>**/*.properties</include>
                <include>**/*.yml</include>
            </includes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <filtering>false</filtering>
            <excludes>
                <exclude>**/*.properties</exclude>
                <exclude>**/*.yml</exclude>
            </excludes>
        </resource>
    </resources>
</build>
```

### 其他常用插件

```xml
<!-- 源码包 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-source-plugin</artifactId>
    <version>3.3.0</version>
    <executions>
        <execution>
            <id>attach-sources</id>
            <goals>
                <goal>jar-no-fork</goal>
            </goals>
        </execution>
    </executions>
</plugin>

<!-- Javadoc -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-javadoc-plugin</artifactId>
    <version>3.6.3</version>
    <executions>
        <execution>
            <id>attach-javadocs</id>
            <goals>
                <goal>jar</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <doclint>none</doclint>
        <encoding>UTF-8</encoding>
    </configuration>
</plugin>

<!-- 代码检查 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.3.1</version>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <consoleOutput>true</consoleOutput>
        <failsOnError>true</failsOnError>
    </configuration>
</plugin>

<!-- 版本管理 -->
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>versions-maven-plugin</artifactId>
    <version>2.16.2</version>
</plugin>
```

### 插件管理

```xml
<!-- 统一管理插件版本 -->
<build>
    <pluginManagement>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.12.1</version>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.2.5</version>
            </plugin>
        </plugins>
    </pluginManagement>
</build>
```

## Profiles 配置

Profile 允许根据不同环境或条件使用不同的配置。

### 定义 Profile

```xml
<profiles>
    <!-- 开发环境 -->
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <env>development</env>
            <db.url>jdbc:mysql://localhost:3306/devdb</db.url>
        </properties>
    </profile>

    <!-- 测试环境 -->
    <profile>
        <id>test</id>
        <properties>
            <env>testing</env>
            <db.url>jdbc:mysql://test-server:3306/testdb</db.url>
        </properties>
    </profile>

    <!-- 生产环境 -->
    <profile>
        <id>prod</id>
        <properties>
            <env>production</env>
            <db.url>jdbc:mysql://prod-server:3306/proddb</db.url>
        </properties>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <configuration>
                        <debug>false</debug>
                        <optimize>true</optimize>
                    </configuration>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

### 激活 Profile

```bash
# 命令行激活
mvn package -Pprod
mvn package -Ptest,integration

# 查看激活的 profile
mvn help:active-profiles
```

### Profile 激活条件

```xml
<profile>
    <id>windows</id>
    <activation>
        <!-- 基于操作系统 -->
        <os>
            <family>windows</family>
        </os>
    </activation>
</profile>

<profile>
    <id>jdk21</id>
    <activation>
        <!-- 基于 JDK 版本 -->
        <jdk>[21,)</jdk>
    </activation>
</profile>

<profile>
    <id>ci</id>
    <activation>
        <!-- 基于环境变量 -->
        <property>
            <name>env.CI</name>
            <value>true</value>
        </property>
    </activation>
</profile>

<profile>
    <id>with-tests</id>
    <activation>
        <!-- 基于文件存在 -->
        <file>
            <exists>src/test/java</exists>
        </file>
    </activation>
</profile>
```

## 多模块项目

### 项目结构

```
my-application/
├── pom.xml                    # 父 POM
├── common/                    # 公共模块
│   ├── pom.xml
│   └── src/
├── api/                       # API 模块
│   ├── pom.xml
│   └── src/
├── service/                   # 服务模块
│   ├── pom.xml
│   └── src/
└── web/                       # Web 模块
    ├── pom.xml
    └── src/
```

### 父 POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>my-application</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>  <!-- 父项目必须为 pom 类型 -->

    <name>My Application</name>

    <!-- 子模块列表 -->
    <modules>
        <module>common</module>
        <module>api</module>
        <module>service</module>
        <module>web</module>
    </modules>

    <!-- 统一属性 -->
    <properties>
        <java.version>21</java.version>
        <spring.version>6.1.3</spring.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 依赖版本管理 -->
    <dependencyManagement>
        <dependencies>
            <!-- 内部模块 -->
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>common</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>api</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>com.example</groupId>
                <artifactId>service</artifactId>
                <version>${project.version}</version>
            </dependency>

            <!-- 外部依赖 -->
            <dependency>
                <groupId>org.springframework</groupId>
                <artifactId>spring-context</artifactId>
                <version>${spring.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- 公共依赖（所有子模块都继承） -->
    <dependencies>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.11</version>
        </dependency>
    </dependencies>

    <!-- 插件管理 -->
    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.12.1</version>
                    <configuration>
                        <source>${java.version}</source>
                        <target>${java.version}</target>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### 子模块 POM

```xml
<!-- common/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 父项目 -->
    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>common</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>33.0.0-jre</version>
        </dependency>
    </dependencies>
</project>

<!-- service/pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-application</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>service</artifactId>

    <dependencies>
        <!-- 依赖其他模块 -->
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>common</artifactId>
        </dependency>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>api</artifactId>
        </dependency>

        <!-- 外部依赖（版本从父 POM 继承） -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
        </dependency>
    </dependencies>
</project>
```

### 构建多模块项目

```bash
# 构建所有模块
mvn clean install

# 只构建特定模块及其依赖
mvn clean install -pl service -am

# 只构建特定模块及依赖它的模块
mvn clean install -pl common -amd

# 从指定模块开始构建
mvn clean install -rf :service
```

命令参数说明：
- `-pl` (--projects)：指定模块
- `-am` (--also-make)：同时构建依赖的模块
- `-amd` (--also-make-dependents)：同时构建依赖此模块的模块
- `-rf` (--resume-from)：从指定模块开始继续构建

## 仓库管理

### 仓库类型

Maven 仓库分为三种：

1. **本地仓库**：存储在本地机器上
2. **中央仓库**：Maven 官方仓库（https://repo.maven.apache.org/maven2）
3. **远程仓库**：公司私服或第三方仓库

### 本地仓库配置

```xml
<!-- settings.xml -->
<settings>
    <!-- 本地仓库路径（默认 ~/.m2/repository） -->
    <localRepository>/path/to/local/repo</localRepository>
</settings>
```

### 远程仓库配置

```xml
<!-- pom.xml 中配置 -->
<repositories>
    <repository>
        <id>aliyun</id>
        <name>Aliyun Maven Repository</name>
        <url>https://maven.aliyun.com/repository/public</url>
        <releases>
            <enabled>true</enabled>
        </releases>
        <snapshots>
            <enabled>true</enabled>
            <updatePolicy>daily</updatePolicy>
        </snapshots>
    </repository>
</repositories>

<!-- 插件仓库 -->
<pluginRepositories>
    <pluginRepository>
        <id>aliyun-plugin</id>
        <name>Aliyun Plugin Repository</name>
        <url>https://maven.aliyun.com/repository/public</url>
    </pluginRepository>
</pluginRepositories>
```

### 镜像配置

```xml
<!-- settings.xml -->
<settings>
    <mirrors>
        <!-- 阿里云镜像 -->
        <mirror>
            <id>aliyun</id>
            <name>Aliyun Maven Mirror</name>
            <url>https://maven.aliyun.com/repository/public</url>
            <mirrorOf>central</mirrorOf>
        </mirror>

        <!-- 镜像所有仓库 -->
        <mirror>
            <id>nexus</id>
            <name>Nexus Mirror</name>
            <url>http://nexus.company.com/repository/maven-public/</url>
            <mirrorOf>*</mirrorOf>
        </mirror>

        <!-- 镜像除了指定仓库外的所有仓库 -->
        <mirror>
            <id>nexus-partial</id>
            <url>http://nexus.company.com/repository/maven-public/</url>
            <mirrorOf>*,!spring-milestones</mirrorOf>
        </mirror>
    </mirrors>
</settings>
```

### 发布到私服

```xml
<!-- pom.xml -->
<distributionManagement>
    <repository>
        <id>releases</id>
        <name>Release Repository</name>
        <url>http://nexus.company.com/repository/maven-releases/</url>
    </repository>
    <snapshotRepository>
        <id>snapshots</id>
        <name>Snapshot Repository</name>
        <url>http://nexus.company.com/repository/maven-snapshots/</url>
    </snapshotRepository>
</distributionManagement>

<!-- settings.xml 中配置认证信息 -->
<servers>
    <server>
        <id>releases</id>
        <username>admin</username>
        <password>password</password>
    </server>
    <server>
        <id>snapshots</id>
        <username>admin</username>
        <password>password</password>
    </server>
</servers>
```

```bash
# 部署到私服
mvn deploy
```

## 实用技巧

### 常用命令

```bash
# 查看有效 POM
mvn help:effective-pom

# 查看有效 settings
mvn help:effective-settings

# 分析依赖树
mvn dependency:tree
mvn dependency:tree -Dincludes=org.springframework

# 分析依赖冲突
mvn dependency:analyze

# 查看可更新的依赖
mvn versions:display-dependency-updates

# 查看可更新的插件
mvn versions:display-plugin-updates

# 更新父版本
mvn versions:update-parent

# 离线模式
mvn -o package

# 强制更新快照
mvn -U package

# 调试模式
mvn -X package

# 并行构建
mvn -T 4 package          # 使用 4 个线程
mvn -T 1C package         # 每个 CPU 核心 1 个线程
```

### 跳过指定阶段

```bash
# 跳过测试
mvn package -DskipTests

# 跳过测试编译和执行
mvn package -Dmaven.test.skip=true

# 跳过 Javadoc
mvn package -Dmaven.javadoc.skip=true

# 跳过 GPG 签名
mvn deploy -Dgpg.skip=true
```

### 调试技巧

```xml
<!-- 输出详细信息 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-antrun-plugin</artifactId>
    <version>3.1.0</version>
    <executions>
        <execution>
            <phase>validate</phase>
            <goals>
                <goal>run</goal>
            </goals>
            <configuration>
                <target>
                    <echo>Project: ${project.name}</echo>
                    <echo>Version: ${project.version}</echo>
                    <echo>Base Dir: ${project.basedir}</echo>
                </target>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### CI/CD 集成

```xml
<!-- 适用于 CI 环境的配置 -->
<profile>
    <id>ci</id>
    <activation>
        <property>
            <name>env.CI</name>
        </property>
    </activation>
    <build>
        <plugins>
            <!-- 代码覆盖率 -->
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.11</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>prepare-agent</goal>
                        </goals>
                    </execution>
                    <execution>
                        <id>report</id>
                        <phase>test</phase>
                        <goals>
                            <goal>report</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</profile>
```

### settings.xml 最佳实践

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0
                              http://maven.apache.org/xsd/settings-1.2.0.xsd">

    <!-- 本地仓库位置 -->
    <localRepository>${user.home}/.m2/repository</localRepository>

    <!-- 是否启用交互模式 -->
    <interactiveMode>true</interactiveMode>

    <!-- 是否使用插件注册表 -->
    <usePluginRegistry>false</usePluginRegistry>

    <!-- 是否离线模式 -->
    <offline>false</offline>

    <!-- 插件组 -->
    <pluginGroups>
        <pluginGroup>org.springframework.boot</pluginGroup>
    </pluginGroups>

    <!-- 代理配置 -->
    <proxies>
        <proxy>
            <id>company-proxy</id>
            <active>true</active>
            <protocol>http</protocol>
            <host>proxy.company.com</host>
            <port>8080</port>
            <username>user</username>
            <password>password</password>
            <nonProxyHosts>localhost|*.company.com</nonProxyHosts>
        </proxy>
    </proxies>

    <!-- 服务器认证 -->
    <servers>
        <server>
            <id>nexus</id>
            <username>admin</username>
            <password>admin123</password>
        </server>
    </servers>

    <!-- 镜像 -->
    <mirrors>
        <mirror>
            <id>aliyun</id>
            <mirrorOf>central</mirrorOf>
            <name>Aliyun Maven Mirror</name>
            <url>https://maven.aliyun.com/repository/public</url>
        </mirror>
    </mirrors>

    <!-- Profile 配置 -->
    <profiles>
        <profile>
            <id>default</id>
            <properties>
                <maven.compiler.source>21</maven.compiler.source>
                <maven.compiler.target>21</maven.compiler.target>
            </properties>
            <repositories>
                <repository>
                    <id>central</id>
                    <url>https://repo.maven.apache.org/maven2</url>
                </repository>
            </repositories>
        </profile>
    </profiles>

    <!-- 激活的 Profile -->
    <activeProfiles>
        <activeProfile>default</activeProfile>
    </activeProfiles>

</settings>
```

## 完整项目示例

### Spring Boot 项目 POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 继承 Spring Boot 父项目 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>demo-application</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>Demo Application</name>
    <description>A demo Spring Boot application</description>

    <properties>
        <java.version>21</java.version>
        <mybatis.version>3.0.3</mybatis.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- MyBatis -->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>${mybatis.version}</version>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- Development -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Spring Boot Maven Plugin -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>

    <profiles>
        <!-- 开发环境 -->
        <profile>
            <id>dev</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <properties>
                <spring.profiles.active>dev</spring.profiles.active>
            </properties>
        </profile>

        <!-- 生产环境 -->
        <profile>
            <id>prod</id>
            <properties>
                <spring.profiles.active>prod</spring.profiles.active>
            </properties>
            <build>
                <plugins>
                    <plugin>
                        <groupId>org.springframework.boot</groupId>
                        <artifactId>spring-boot-maven-plugin</artifactId>
                        <configuration>
                            <layers>
                                <enabled>true</enabled>
                            </layers>
                        </configuration>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>

</project>
```

### Maven Wrapper

Maven Wrapper 确保项目使用指定版本的 Maven：

```bash
# 生成 Maven Wrapper
mvn wrapper:wrapper -Dmaven=3.9.6

# 使用 Wrapper 构建
./mvnw clean package        # Linux/Mac
mvnw.cmd clean package      # Windows
```

生成的文件：
```
project/
├── .mvn/
│   └── wrapper/
│       ├── maven-wrapper.jar
│       └── maven-wrapper.properties
├── mvnw                # Unix 脚本
└── mvnw.cmd           # Windows 脚本
```

## 常见问题与解决

### 依赖下载失败

```bash
# 清理失败的下载
find ~/.m2/repository -name "*.lastUpdated" -delete

# 强制更新
mvn clean install -U
```

### 内存不足

```bash
# 增加 Maven 内存
export MAVEN_OPTS="-Xms512m -Xmx1024m -XX:MaxMetaspaceSize=256m"
```

### 编码问题

```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
    <maven.compiler.encoding>UTF-8</maven.compiler.encoding>
</properties>
```

### 依赖冲突排查

```bash
# 查看依赖树
mvn dependency:tree

# 查看特定依赖的来源
mvn dependency:tree -Dincludes=groupId:artifactId

# 分析未使用和未声明的依赖
mvn dependency:analyze
```

### 清理本地仓库

```bash
# 删除所有 SNAPSHOT 版本
find ~/.m2/repository -type d -name "*-SNAPSHOT" -exec rm -rf {} +

# 删除指定 groupId 的所有缓存
rm -rf ~/.m2/repository/com/example
```

## 总结

Maven 是 Java 生态中不可或缺的构建工具，本文涵盖了以下核心内容：

1. **POM 结构**：项目坐标、属性、依赖声明等基础配置
2. **依赖管理**：scope、传递依赖、依赖排除与冲突解决
3. **生命周期**：clean、default、site 三个生命周期及其阶段
4. **插件系统**：编译、打包、测试等常用插件的配置
5. **Profile**：多环境配置与激活机制
6. **多模块项目**：父子项目结构与依赖管理
7. **仓库管理**：本地仓库、远程仓库与镜像配置

掌握 Maven 不仅能提高开发效率，还能帮助团队建立统一的项目管理规范。建议在实际项目中多加练习，逐步深入理解各个配置的作用和最佳实践。
