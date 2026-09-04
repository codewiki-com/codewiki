---
title: Gradle构建工具
description: Gradle完全指南，Groovy/Kotlin DSL、任务与依赖管理
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Gradle
  - 构建工具
  - Kotlin DSL
status: imported
origin: old/src/content/docs/java/gradle.zh.md
divergence: 0.241
issues: []
legacy:
  category: Java
  subcategory: 工具链
  order: 16
  lastUpdated: 2026-01-07
---

Gradle 是一个基于 JVM 的现代化构建自动化工具，它结合了 Apache Ant 的灵活性和 Apache Maven 的约定优于配置理念。Gradle 使用基于 Groovy 或 Kotlin 的领域特定语言（DSL）来声明项目配置，相比 XML 更加简洁和强大。

## 为什么选择 Gradle

### Gradle vs Maven 对比

| 特性 | Gradle | Maven |
|------|--------|-------|
| 配置语言 | Groovy/Kotlin DSL | XML |
| 构建速度 | 快（增量构建、缓存） | 较慢 |
| 灵活性 | 高（可编程） | 低（固定生命周期） |
| 学习曲线 | 较陡 | 平缓 |
| IDE 支持 | 优秀 | 优秀 |
| 生态系统 | 丰富 | 非常丰富 |

### Gradle 的核心优势

1. **增量构建**：只重新编译修改过的文件
2. **构建缓存**：本地和远程缓存支持
3. **并行执行**：自动并行执行独立任务
4. **守护进程**：后台运行，加速后续构建
5. **可编程性**：完整的编程语言支持

## 安装与配置

### 使用 SDKMAN 安装（推荐）

```bash
# 安装 SDKMAN
curl -s "https://get.sdkman.io" | bash

# 安装 Gradle
sdk install gradle

# 验证安装
gradle --version
```

### 手动安装

```bash
# 下载并解压
wget https://services.gradle.org/distributions/gradle-8.5-bin.zip
unzip gradle-8.5-bin.zip -d /opt

# 配置环境变量
export GRADLE_HOME=/opt/gradle-8.5
export PATH=$PATH:$GRADLE_HOME/bin
```

### Gradle Wrapper（强烈推荐）

Gradle Wrapper 是项目随附的脚本，确保团队成员使用相同版本的 Gradle。

```bash
# 生成 Wrapper
gradle wrapper --gradle-version 8.5

# 生成的文件结构
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew        # Unix 脚本
└── gradlew.bat    # Windows 脚本
```

**gradle-wrapper.properties 配置：**

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

使用 Wrapper 执行构建：

```bash
# Unix/macOS
./gradlew build

# Windows
gradlew.bat build
```

## build.gradle 文件结构

### Groovy DSL 基础结构

```groovy
// build.gradle

// 插件声明
plugins {
    id 'java'
    id 'application'
    id 'org.springframework.boot' version '3.2.0'
}

// 项目基本信息
group = 'com.example'
version = '1.0.0'
description = 'My Gradle Project'

// Java 版本配置
java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

// 仓库配置
repositories {
    mavenLocal()
    mavenCentral()
    maven {
        url 'https://maven.aliyun.com/repository/public'
    }
}

// 依赖声明
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.google.guava:guava:32.1.3-jre'

    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'

    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

// 测试配置
test {
    useJUnitPlatform()
    testLogging {
        events "passed", "skipped", "failed"
    }
}

// 应用配置
application {
    mainClass = 'com.example.Application'
}

// 自定义任务
tasks.register('hello') {
    group = 'custom'
    description = 'Prints a greeting'
    doLast {
        println 'Hello, Gradle!'
    }
}
```

### Kotlin DSL 基础结构

```kotlin
// build.gradle.kts

// 插件声明
plugins {
    java
    application
    id("org.springframework.boot") version "3.2.0"
}

// 项目基本信息
group = "com.example"
version = "1.0.0"
description = "My Gradle Project"

// Java 版本配置
java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

// 仓库配置
repositories {
    mavenLocal()
    mavenCentral()
    maven {
        url = uri("https://maven.aliyun.com/repository/public")
    }
}

// 依赖声明
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.google.guava:guava:32.1.3-jre")

    compileOnly("org.projectlombok:lombok:1.18.30")
    annotationProcessor("org.projectlombok:lombok:1.18.30")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

// 测试配置
tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
    }
}

// 应用配置
application {
    mainClass.set("com.example.Application")
}

// 自定义任务
tasks.register("hello") {
    group = "custom"
    description = "Prints a greeting"
    doLast {
        println("Hello, Gradle!")
    }
}
```

## Groovy DSL vs Kotlin DSL

### 语法差异对比

| 操作 | Groovy DSL | Kotlin DSL |
|------|------------|------------|
| 字符串 | `'单引号'` 或 `"双引号"` | `"双引号"` |
| 方法调用 | `method arg` 或 `method(arg)` | `method(arg)` |
| 属性赋值 | `property = value` | `property.set(value)` 或 `property = value` |
| 插件声明 | `id 'plugin-id'` | `id("plugin-id")` |
| 闭包 | `{ }` | `{ }` 或 lambda |

### 选择建议

**选择 Groovy DSL：**
- 团队熟悉 Groovy
- 需要更灵活的动态特性
- 迁移现有 Gradle 项目
- 脚本编写更简洁

**选择 Kotlin DSL：**
- 需要更好的 IDE 支持（代码补全、重构）
- 编译时类型检查
- 与 Kotlin 项目保持一致
- 更好的可维护性

## 任务（Tasks）

### 任务基础

任务是 Gradle 的核心构建单元，代表一个原子操作。

```groovy
// 定义任务 - Groovy DSL
tasks.register('compileCode') {
    group = 'build'
    description = 'Compiles the source code'

    doFirst {
        println 'Preparing to compile...'
    }

    doLast {
        println 'Compilation complete!'
    }
}

// 带类型的任务
tasks.register('copyDocs', Copy) {
    from 'src/docs'
    into 'build/docs'
    include '**/*.md'
}
```

```kotlin
// 定义任务 - Kotlin DSL
tasks.register("compileCode") {
    group = "build"
    description = "Compiles the source code"

    doFirst {
        println("Preparing to compile...")
    }

    doLast {
        println("Compilation complete!")
    }
}

// 带类型的任务
tasks.register<Copy>("copyDocs") {
    from("src/docs")
    into("build/docs")
    include("**/*.md")
}
```

### 任务依赖

```groovy
// 声明任务依赖
tasks.register('taskA') {
    doLast { println 'Task A' }
}

tasks.register('taskB') {
    dependsOn 'taskA'
    doLast { println 'Task B' }
}

tasks.register('taskC') {
    dependsOn 'taskA', 'taskB'
    doLast { println 'Task C' }
}

// 使用 mustRunAfter（弱依赖）
tasks.register('taskD') {
    mustRunAfter 'taskA'
    doLast { println 'Task D' }
}

// 使用 shouldRunAfter
tasks.register('taskE') {
    shouldRunAfter 'taskA'
    doLast { println 'Task E' }
}

// 使用 finalizedBy
tasks.register('taskF') {
    finalizedBy 'cleanup'
    doLast { println 'Task F' }
}

tasks.register('cleanup') {
    doLast { println 'Cleaning up...' }
}
```

### 任务输入输出

Gradle 通过输入输出来判断任务是否需要重新执行：

```groovy
tasks.register('processFiles') {
    // 声明输入
    inputs.files(fileTree('src/data'))
    inputs.property('version', project.version)

    // 声明输出
    outputs.dir('build/processed')
    outputs.cacheIf { true }

    doLast {
        // 处理逻辑
        copy {
            from 'src/data'
            into 'build/processed'
        }
    }
}
```

```kotlin
// Kotlin DSL - 使用注解的自定义任务类
abstract class ProcessTask : DefaultTask() {
    @get:InputDirectory
    abstract val inputDir: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Input
    abstract val version: Property<String>

    @TaskAction
    fun process() {
        // 处理逻辑
        project.copy {
            from(inputDir)
            into(outputDir)
        }
    }
}

tasks.register<ProcessTask>("processFiles") {
    inputDir.set(file("src/data"))
    outputDir.set(file("build/processed"))
    version.set(project.version.toString())
}
```

### 常用内置任务

```bash
# 查看所有任务
./gradlew tasks --all

# 常用任务
./gradlew clean          # 清理 build 目录
./gradlew build          # 编译并测试
./gradlew assemble       # 只编译，不测试
./gradlew test           # 运行测试
./gradlew check          # 运行所有检查
./gradlew jar            # 打包 JAR
./gradlew bootRun        # 运行 Spring Boot 应用
./gradlew dependencies   # 显示依赖树

# 任务选项
./gradlew build --info           # 详细输出
./gradlew build --debug          # 调试输出
./gradlew build --dry-run        # 模拟运行
./gradlew build --parallel       # 并行构建
./gradlew build --continue       # 失败后继续
./gradlew build -x test          # 跳过测试
```

## 依赖管理

### 依赖配置（Configurations）

```groovy
dependencies {
    // 编译和运行时都需要
    implementation 'com.google.guava:guava:32.1.3-jre'

    // 仅编译时需要（不传递给消费者）
    compileOnly 'javax.servlet:javax.servlet-api:4.0.1'

    // 仅运行时需要
    runtimeOnly 'mysql:mysql-connector-java:8.0.33'

    // API 依赖（会暴露给消费者）
    api 'org.apache.commons:commons-lang3:3.14.0'

    // 注解处理器
    annotationProcessor 'org.projectlombok:lombok:1.18.30'

    // 测试编译依赖
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'

    // 测试运行时依赖
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'

    // 测试注解处理器
    testAnnotationProcessor 'org.projectlombok:lombok:1.18.30'
}
```

### 依赖声明方式

```groovy
dependencies {
    // 标准 GAV 坐标
    implementation 'group:artifact:version'

    // 带分类器
    implementation 'group:artifact:version:classifier'

    // 带扩展名
    implementation 'group:artifact:version@ext'

    // Map 形式
    implementation group: 'com.google.guava', name: 'guava', version: '32.1.3-jre'

    // 项目依赖
    implementation project(':submodule')

    // 文件依赖
    implementation files('libs/custom.jar')
    implementation fileTree(dir: 'libs', include: '*.jar')

    // 平台依赖（BOM）
    implementation platform('org.springframework.boot:spring-boot-dependencies:3.2.0')
    implementation 'org.springframework.boot:spring-boot-starter-web' // 无需版本
}
```

### 版本管理

```groovy
// 动态版本（不推荐用于生产）
implementation 'com.example:lib:1.+'      // 1.x 最新版
implementation 'com.example:lib:latest.release'

// 版本范围
implementation 'com.example:lib:[1.0,2.0)'  // 1.0 <= version < 2.0
implementation 'com.example:lib:[1.0,)'     // version >= 1.0

// 严格版本
implementation('com.example:lib') {
    version {
        strictly '[1.0,2.0['
        prefer '1.5'
    }
}

// 拒绝版本
implementation('com.example:lib:1.+') {
    version {
        reject '1.2.1'  // 排除特定版本
    }
}
```

### 使用版本目录（推荐）

**gradle/libs.versions.toml：**

```toml
[versions]
spring-boot = "3.2.0"
junit = "5.10.1"
guava = "32.1.3-jre"
lombok = "1.18.30"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web", version.ref = "spring-boot" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test", version.ref = "spring-boot" }
junit-jupiter = { module = "org.junit.jupiter:junit-jupiter", version.ref = "junit" }
guava = { module = "com.google.guava:guava", version.ref = "guava" }
lombok = { module = "org.projectlombok:lombok", version.ref = "lombok" }

[bundles]
testing = ["junit-jupiter", "spring-boot-starter-test"]

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
```

**build.gradle.kts：**

```kotlin
plugins {
    alias(libs.plugins.spring.boot)
}

dependencies {
    implementation(libs.spring.boot.starter.web)
    implementation(libs.guava)

    compileOnly(libs.lombok)
    annotationProcessor(libs.lombok)

    testImplementation(libs.bundles.testing)
}
```

### 依赖冲突解决

```groovy
configurations.all {
    // 解决策略
    resolutionStrategy {
        // 强制使用特定版本
        force 'com.google.guava:guava:32.1.3-jre'

        // 失败时报错（默认是选择最新版）
        failOnVersionConflict()

        // 优先使用项目中定义的版本
        preferProjectModules()

        // 缓存动态版本的时间
        cacheDynamicVersionsFor 10, 'minutes'

        // 缓存变化模块的时间
        cacheChangingModulesFor 0, 'seconds'
    }
}

// 排除传递依赖
dependencies {
    implementation('org.springframework.boot:spring-boot-starter-web') {
        exclude group: 'org.springframework.boot', module: 'spring-boot-starter-tomcat'
    }
}

// 全局排除
configurations.all {
    exclude group: 'commons-logging', module: 'commons-logging'
}

// 依赖替换
configurations.all {
    resolutionStrategy.eachDependency { details ->
        if (details.requested.group == 'log4j') {
            details.useTarget 'org.apache.logging.log4j:log4j-core:2.22.0'
            details.because 'CVE-2021-44228 安全漏洞'
        }
    }
}
```

### 查看依赖信息

```bash
# 查看所有依赖
./gradlew dependencies

# 查看特定配置的依赖
./gradlew dependencies --configuration implementation

# 依赖洞察
./gradlew dependencyInsight --dependency guava

# 生成依赖报告
./gradlew htmlDependencyReport
```

## 插件系统

### 核心插件

```groovy
plugins {
    id 'java'              // Java 支持
    id 'java-library'      // Java 库支持
    id 'application'       // 可执行应用
    id 'war'               // WAR 打包
    id 'maven-publish'     // Maven 发布
    id 'signing'           // 签名
    id 'jacoco'            // 代码覆盖率
    id 'checkstyle'        // 代码风格检查
    id 'pmd'               // 静态分析
    id 'idea'              // IntelliJ IDEA 集成
    id 'eclipse'           // Eclipse 集成
}
```

### 社区插件

```groovy
plugins {
    // Spring Boot
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'

    // Shadow（打包 fat JAR）
    id 'com.github.johnrengelman.shadow' version '8.1.1'

    // Spotless（代码格式化）
    id 'com.diffplug.spotless' version '6.23.3'

    // JIB（容器化）
    id 'com.google.cloud.tools.jib' version '3.4.0'

    // Flyway（数据库迁移）
    id 'org.flywaydb.flyway' version '10.4.1'

    // Protobuf
    id 'com.google.protobuf' version '0.9.4'
}
```

### 插件配置示例

```groovy
// JaCoCo 代码覆盖率
plugins {
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        csv.required = false
        html.outputLocation = layout.buildDirectory.dir('reports/jacoco')
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = 0.80
            }
        }
    }
}

// Spotless 代码格式化
plugins {
    id 'com.diffplug.spotless' version '6.23.3'
}

spotless {
    java {
        target 'src/**/*.java'
        googleJavaFormat('1.19.1')
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
    kotlin {
        target 'src/**/*.kt'
        ktlint('1.1.0')
    }
}

// JIB 容器化
plugins {
    id 'com.google.cloud.tools.jib' version '3.4.0'
}

jib {
    from {
        image = 'eclipse-temurin:21-jre-alpine'
    }
    to {
        image = 'myregistry/myapp'
        tags = ['latest', project.version]
    }
    container {
        mainClass = 'com.example.Application'
        ports = ['8080']
        jvmFlags = ['-Xms512m', '-Xmx1024m']
        environment = [
            'SPRING_PROFILES_ACTIVE': 'production'
        ]
    }
}
```

### 编写自定义插件

**buildSrc/src/main/groovy/MyPlugin.groovy：**

```groovy
import org.gradle.api.Plugin
import org.gradle.api.Project

class MyPlugin implements Plugin<Project> {
    void apply(Project project) {
        // 创建扩展
        def extension = project.extensions.create('myPlugin', MyPluginExtension)

        // 注册任务
        project.tasks.register('myTask') {
            group = 'my-plugin'
            description = 'My custom task'

            doLast {
                println "Message: ${extension.message.get()}"
            }
        }

        // 应用其他插件
        project.plugins.apply('java')

        // 在项目评估后执行
        project.afterEvaluate {
            println "Project ${project.name} configured with MyPlugin"
        }
    }
}

abstract class MyPluginExtension {
    abstract Property<String> getMessage()

    MyPluginExtension() {
        message.convention('Hello from MyPlugin')
    }
}
```

**使用插件：**

```groovy
plugins {
    id 'my-plugin'
}

myPlugin {
    message = 'Custom message'
}
```

## 多项目构建

### 项目结构

```
my-project/
├── build.gradle.kts           # 根项目构建脚本
├── settings.gradle.kts        # 项目设置
├── gradle.properties          # 属性配置
├── gradle/
│   └── libs.versions.toml     # 版本目录
├── buildSrc/                  # 构建逻辑
│   ├── build.gradle.kts
│   └── src/main/kotlin/
├── app/                       # 应用模块
│   ├── build.gradle.kts
│   └── src/
├── core/                      # 核心模块
│   ├── build.gradle.kts
│   └── src/
├── api/                       # API 模块
│   ├── build.gradle.kts
│   └── src/
└── common/                    # 公共模块
    ├── build.gradle.kts
    └── src/
```

### settings.gradle.kts

```kotlin
rootProject.name = "my-project"

// 包含子项目
include("app")
include("core")
include("api")
include("common")

// 嵌套子项目
include("modules:feature-a")
include("modules:feature-b")

// 自定义项目目录
project(":custom-module").projectDir = file("custom/path/module")

// 插件管理
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
    plugins {
        kotlin("jvm") version "1.9.21"
        id("org.springframework.boot") version "3.2.0"
    }
}

// 依赖管理
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}

// 启用类型安全的项目访问器
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")
```

### 根项目 build.gradle.kts

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0" apply false
}

// 所有项目通用配置
allprojects {
    group = "com.example"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

// 子项目通用配置
subprojects {
    apply(plugin = "java")

    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    dependencies {
        testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    }

    tasks.test {
        useJUnitPlatform()
    }
}

// 特定项目配置
project(":app") {
    apply(plugin = "org.springframework.boot")
    apply(plugin = "application")
}
```

### 子项目 build.gradle.kts

```kotlin
// app/build.gradle.kts
plugins {
    id("org.springframework.boot")
    application
}

dependencies {
    implementation(project(":core"))
    implementation(project(":api"))
    implementation(project(":common"))

    implementation("org.springframework.boot:spring-boot-starter-web")
}

application {
    mainClass.set("com.example.app.Application")
}

// core/build.gradle.kts
plugins {
    `java-library`
}

dependencies {
    api(project(":common"))
    implementation("com.google.guava:guava:32.1.3-jre")
}

// api/build.gradle.kts
plugins {
    `java-library`
}

dependencies {
    api(project(":common"))
}

// common/build.gradle.kts
plugins {
    `java-library`
}

dependencies {
    api("org.apache.commons:commons-lang3:3.14.0")
}
```

### 使用约定插件（Convention Plugins）

**buildSrc/build.gradle.kts：**

```kotlin
plugins {
    `kotlin-dsl`
}

repositories {
    gradlePluginPortal()
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-gradle-plugin:3.2.0")
}
```

**buildSrc/src/main/kotlin/java-conventions.gradle.kts：**

```kotlin
plugins {
    java
}

group = "com.example"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.test {
    useJUnitPlatform()
}
```

**buildSrc/src/main/kotlin/spring-boot-conventions.gradle.kts：**

```kotlin
plugins {
    id("java-conventions")
    id("org.springframework.boot")
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

**使用约定插件：**

```kotlin
// app/build.gradle.kts
plugins {
    id("spring-boot-conventions")
    application
}

dependencies {
    implementation(project(":core"))
    implementation("org.springframework.boot:spring-boot-starter-web")
}
```

## 属性与环境变量

### 属性来源优先级

1. 命令行参数：`-P` 或 `--project-prop`
2. `gradle.properties`（项目目录）
3. `gradle.properties`（GRADLE_USER_HOME）
4. 环境变量
5. 系统属性

### gradle.properties

```properties
# 项目属性
projectGroup=com.example
projectVersion=1.0.0

# Gradle 配置
org.gradle.jvmargs=-Xmx2g -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.daemon=true
org.gradle.configureondemand=true

# 编译选项
kotlin.incremental=true
kapt.incremental.apt=true

# 代理设置
systemProp.http.proxyHost=proxy.example.com
systemProp.http.proxyPort=8080
systemProp.https.proxyHost=proxy.example.com
systemProp.https.proxyPort=8080

# 敏感信息（不要提交到版本控制）
nexusUsername=admin
nexusPassword=secret123
```

### 在构建脚本中使用属性

```groovy
// 读取属性
def myProp = project.findProperty('myProperty') ?: 'default'

// 检查属性是否存在
if (project.hasProperty('skipTests')) {
    tasks.test.enabled = false
}

// 从环境变量读取
def apiKey = System.getenv('API_KEY') ?: 'dev-key'

// 扩展属性
ext {
    springBootVersion = '3.2.0'
    junitVersion = '5.10.1'
}

dependencies {
    implementation "org.springframework.boot:spring-boot-starter:${springBootVersion}"
}
```

```kotlin
// Kotlin DSL
val myProp: String by project
val myOptionalProp: String? = project.findProperty("myProperty") as String?

// 扩展属性
val springBootVersion by extra("3.2.0")

dependencies {
    implementation("org.springframework.boot:spring-boot-starter:$springBootVersion")
}
```

## 发布配置

### Maven 发布

```groovy
plugins {
    id 'java-library'
    id 'maven-publish'
    id 'signing'
}

java {
    withJavadocJar()
    withSourcesJar()
}

publishing {
    publications {
        maven(MavenPublication) {
            from components.java

            groupId = 'com.example'
            artifactId = 'my-library'
            version = '1.0.0'

            pom {
                name = 'My Library'
                description = 'A fantastic library'
                url = 'https://github.com/example/my-library'

                licenses {
                    license {
                        name = 'The Apache License, Version 2.0'
                        url = 'http://www.apache.org/licenses/LICENSE-2.0.txt'
                    }
                }

                developers {
                    developer {
                        id = 'developer'
                        name = 'Developer Name'
                        email = 'dev@example.com'
                    }
                }

                scm {
                    connection = 'scm:git:git://github.com/example/my-library.git'
                    developerConnection = 'scm:git:ssh://github.com:example/my-library.git'
                    url = 'https://github.com/example/my-library'
                }
            }
        }
    }

    repositories {
        maven {
            name = 'nexus'
            def releasesUrl = 'https://nexus.example.com/repository/maven-releases/'
            def snapshotsUrl = 'https://nexus.example.com/repository/maven-snapshots/'
            url = version.endsWith('SNAPSHOT') ? snapshotsUrl : releasesUrl

            credentials {
                username = findProperty('nexusUsername') ?: System.getenv('NEXUS_USERNAME')
                password = findProperty('nexusPassword') ?: System.getenv('NEXUS_PASSWORD')
            }
        }
    }
}

signing {
    sign publishing.publications.maven
}
```

### 发布到 Maven Central

```groovy
plugins {
    id 'java-library'
    id 'maven-publish'
    id 'signing'
    id 'io.github.gradle-nexus.publish-plugin' version '1.3.0'
}

nexusPublishing {
    repositories {
        sonatype {
            nexusUrl.set(uri("https://s01.oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://s01.oss.sonatype.org/content/repositories/snapshots/"))
            username = findProperty('ossrhUsername')
            password = findProperty('ossrhPassword')
        }
    }
}

signing {
    def signingKey = findProperty('signingKey')
    def signingPassword = findProperty('signingPassword')
    useInMemoryPgpKeys(signingKey, signingPassword)
    sign publishing.publications.maven
}
```

## 性能优化

### 构建缓存

```groovy
// settings.gradle.kts
buildCache {
    local {
        directory = File(rootDir, "build-cache")
        removeUnusedEntriesAfterDays = 30
    }
    remote<HttpBuildCache> {
        url = uri("https://cache.example.com/cache/")
        credentials {
            username = "user"
            password = "password"
        }
        push = System.getenv("CI") != null
    }
}
```

### 配置缓存

```bash
# 启用配置缓存
./gradlew build --configuration-cache

# 在 gradle.properties 中启用
org.gradle.configuration-cache=true
org.gradle.configuration-cache.problems=warn
```

### 并行构建

```properties
# gradle.properties
org.gradle.parallel=true
org.gradle.workers.max=4
```

### 按需配置

```properties
# gradle.properties
org.gradle.configureondemand=true
```

### JVM 调优

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx4g \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:+UseParallelGC \
    -XX:MaxMetaspaceSize=512m \
    -Dfile.encoding=UTF-8
```

### 构建扫描

```groovy
// settings.gradle.kts
plugins {
    id("com.gradle.enterprise") version "3.16.1"
}

gradleEnterprise {
    buildScan {
        termsOfServiceUrl = "https://gradle.com/terms-of-service"
        termsOfServiceAgree = "yes"
        publishAlways()
    }
}
```

```bash
# 生成构建扫描报告
./gradlew build --scan
```

## 常见问题与解决方案

### 依赖下载失败

```groovy
repositories {
    // 使用国内镜像
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/spring' }
    maven { url 'https://maven.aliyun.com/repository/google' }
    mavenCentral()
}

// 配置超时
configurations.all {
    resolutionStrategy {
        cacheChangingModulesFor 0, 'seconds'
    }
}
```

### 内存不足

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
```

### 清理 Gradle 缓存

```bash
# 清理项目缓存
./gradlew clean

# 清理 Gradle 全局缓存
rm -rf ~/.gradle/caches/

# 停止 Daemon
./gradlew --stop

# 禁用 Daemon 运行
./gradlew build --no-daemon
```

### 调试构建脚本

```bash
# 详细输出
./gradlew build --info
./gradlew build --debug

# 堆栈跟踪
./gradlew build --stacktrace

# 分析构建性能
./gradlew build --profile

# 构建扫描
./gradlew build --scan
```

### 刷新依赖

```bash
# 强制刷新依赖
./gradlew build --refresh-dependencies

# 刷新特定模块
./gradlew dependencies --refresh-dependencies
```

## 完整项目示例

### Spring Boot 项目

**settings.gradle.kts：**

```kotlin
rootProject.name = "spring-boot-demo"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
    }
}
```

**build.gradle.kts：**

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0"
    id("io.spring.dependency-management") version "1.1.4"
    id("com.diffplug.spotless") version "6.23.3"
    jacoco
}

group = "com.example"
version = "1.0.0"

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")

    runtimeOnly("com.h2database:h2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.test {
    useJUnitPlatform()
    finalizedBy(tasks.jacocoTestReport)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

spotless {
    java {
        googleJavaFormat()
        removeUnusedImports()
        trimTrailingWhitespace()
        endWithNewline()
    }
}

tasks.bootJar {
    archiveFileName.set("app.jar")
    launchScript()
}
```

## 总结

Gradle 是一个功能强大且灵活的构建工具，通过本指南，你应该能够：

1. **理解 Gradle 基础**：项目结构、构建脚本、任务概念
2. **选择合适的 DSL**：根据团队需求选择 Groovy 或 Kotlin DSL
3. **管理依赖**：正确配置依赖、解决冲突、使用版本目录
4. **使用插件**：应用核心插件和社区插件，编写自定义插件
5. **构建多项目**：设计合理的项目结构，使用约定插件
6. **优化构建性能**：利用缓存、并行构建、JVM 调优
7. **发布产物**：配置 Maven 发布，推送到仓库

持续学习 Gradle 的最佳实践，关注官方文档和社区动态，可以帮助你更高效地管理 Java 项目的构建流程。
