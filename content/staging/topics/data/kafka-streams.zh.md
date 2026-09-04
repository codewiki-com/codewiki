---
title: Kafka Streams 流处理
description: 使用Kafka Streams构建实时流处理应用
track: data
section: data-engineering
difficulty: advanced
tags:
  - Kafka
  - 流处理
  - 实时数据
  - 事件驱动
status: imported
origin: old/src/content/docs/data/kafka-streams.zh.md
divergence: 0.323
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 15
  lastUpdated: 2026-01-07
---

Kafka Streams 是 Apache Kafka 官方提供的流处理客户端库，它允许开发者在 JVM 应用程序中构建高可用、可扩展的实时流处理应用。与其他流处理框架不同，Kafka Streams 不需要独立的集群，只需要普通的 Java 应用程序即可运行。

## Kafka Streams 与其他流处理器对比

在选择流处理技术时，了解各种方案的特点至关重要。以下是主流流处理器的详细对比：

### 对比总览

| 特性 | Kafka Streams | Apache Flink | Apache Spark Streaming | Apache Storm |
|------|---------------|--------------|------------------------|--------------|
| 部署模式 | 嵌入式库 | 独立集群 | 独立集群 | 独立集群 |
| 延迟 | 毫秒级 | 毫秒级 | 秒级（微批处理） | 毫秒级 |
| 状态管理 | RocksDB/内存 | 内置状态后端 | 需要外部存储 | 需要外部存储 |
| 精确一次语义 | 原生支持 | 原生支持 | 检查点机制 | At-least-once |
| 数据源 | 仅 Kafka | 多数据源 | 多数据源 | 多数据源 |
| 运维复杂度 | 低 | 高 | 高 | 高 |
| 学习曲线 | 低 | 中 | 中 | 高 |

### Kafka Streams 的核心优势

**1. 轻量级部署**

Kafka Streams 只是一个 Java 库，不需要额外的集群资源。应用程序可以作为普通的微服务部署，使用 Docker、Kubernetes 或任何标准部署工具。

**2. 弹性伸缩**

通过增加应用实例数量即可水平扩展，Kafka Streams 会自动重新分配任务。缩容时也会自动进行状态迁移。

**3. 容错与高可用**

基于 Kafka 的消费者组机制实现故障转移，状态存储支持变更日志（Changelog）备份，确保故障恢复后状态不丢失。

**4. 与 Kafka 生态深度集成**

原生支持 Kafka 的分区机制、事务和精确一次语义，无需额外配置即可获得一致性保证。

### 何时选择 Kafka Streams

- 数据源和目标都是 Kafka
- 需要毫秒级延迟的实时处理
- 希望简化运维，避免管理额外集群
- 应用逻辑相对简单到中等复杂度
- 团队熟悉 Java/Scala 技术栈

### 何时选择其他方案

- **Apache Flink**：需要复杂的事件处理（CEP）、超大规模状态管理、多数据源集成
- **Spark Streaming**：已有 Spark 生态系统、需要批流一体处理、机器学习集成
- **Apache Storm**：遗留系统维护、需要极端的低延迟场景

---

## Topology（拓扑）

Topology 是 Kafka Streams 的核心概念，它定义了数据流的处理逻辑。Topology 由处理器节点（Processor）和边（Edge）组成，形成一个有向无环图（DAG）。

### Topology 基础概念

```
Source Processor ──► Stream Processor ──► Stream Processor ──► Sink Processor
     │                    │                      │                    │
   读取 Topic           转换/过滤              聚合/Join           写入 Topic
```

**Source Processor**：从 Kafka Topic 读取数据的入口节点

**Stream Processor**：执行数据转换、过滤、聚合等操作的中间节点

**Sink Processor**：将处理结果写入 Kafka Topic 的出口节点

### 使用 DSL 构建 Topology

Kafka Streams 提供了高级 DSL（Domain Specific Language）来声明式地构建 Topology：

```java
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.kstream.*;
import org.apache.kafka.common.serialization.Serdes;

public class TopologyExample {

    public Topology buildTopology() {
        StreamsBuilder builder = new StreamsBuilder();

        // 1. 从源 Topic 读取数据
        KStream<String, String> sourceStream = builder.stream(
            "input-topic",
            Consumed.with(Serdes.String(), Serdes.String())
        );

        // 2. 数据转换
        KStream<String, String> transformedStream = sourceStream
            .filter((key, value) -> value != null && !value.isEmpty())
            .mapValues(value -> value.toUpperCase())
            .peek((key, value) -> System.out.println("Processing: " + key + " -> " + value));

        // 3. 分支处理
        Map<String, KStream<String, String>> branches = transformedStream.split(Named.as("branch-"))
            .branch((key, value) -> value.startsWith("ERROR"), Branched.as("errors"))
            .branch((key, value) -> value.startsWith("WARN"), Branched.as("warnings"))
            .defaultBranch(Branched.as("others"));

        // 4. 写入不同的目标 Topic
        branches.get("branch-errors").to("error-topic");
        branches.get("branch-warnings").to("warning-topic");
        branches.get("branch-others").to("output-topic");

        return builder.build();
    }

    public static void main(String[] args) {
        TopologyExample example = new TopologyExample();
        Topology topology = example.buildTopology();

        // 打印 Topology 描述
        System.out.println(topology.describe());
    }
}
```

### 使用 Processor API 构建 Topology

对于需要更精细控制的场景，可以使用底层 Processor API：

```java
import org.apache.kafka.streams.Topology;
import org.apache.kafka.streams.processor.api.*;
import org.apache.kafka.streams.state.*;

public class ProcessorApiExample {

    public Topology buildTopology() {
        Topology topology = new Topology();

        // 添加源处理器
        topology.addSource(
            "source",
            Serdes.String().deserializer(),
            Serdes.String().deserializer(),
            "input-topic"
        );

        // 添加处理器并关联状态存储
        StoreBuilder<KeyValueStore<String, Long>> storeBuilder = Stores.keyValueStoreBuilder(
            Stores.persistentKeyValueStore("word-count-store"),
            Serdes.String(),
            Serdes.Long()
        );

        topology.addProcessor(
            "word-counter",
            () -> new WordCountProcessor(),
            "source"
        );

        topology.addStateStore(storeBuilder, "word-counter");

        // 添加 Sink 处理器
        topology.addSink(
            "sink",
            "output-topic",
            Serdes.String().serializer(),
            Serdes.Long().serializer(),
            "word-counter"
        );

        return topology;
    }
}

// 自定义处理器
class WordCountProcessor implements Processor<String, String, String, Long> {
    private ProcessorContext<String, Long> context;
    private KeyValueStore<String, Long> store;

    @Override
    public void init(ProcessorContext<String, Long> context) {
        this.context = context;
        this.store = context.getStateStore("word-count-store");

        // 设置定时器，定期刷新结果
        context.schedule(
            Duration.ofSeconds(30),
            PunctuationType.WALL_CLOCK_TIME,
            this::punctuate
        );
    }

    @Override
    public void process(Record<String, String> record) {
        String[] words = record.value().toLowerCase().split("\\s+");

        for (String word : words) {
            Long count = store.get(word);
            count = (count == null) ? 1L : count + 1;
            store.put(word, count);

            // 转发结果到下游
            context.forward(new Record<>(word, count, record.timestamp()));
        }
    }

    private void punctuate(long timestamp) {
        // 定期处理逻辑，如刷新缓存
        try (KeyValueIterator<String, Long> iterator = store.all()) {
            while (iterator.hasNext()) {
                KeyValue<String, Long> entry = iterator.next();
                context.forward(new Record<>(entry.key, entry.value, timestamp));
            }
        }
    }

    @Override
    public void close() {
        // 清理资源
    }
}
```

### Topology 可视化

```java
// 获取 Topology 描述
Topology topology = buildTopology();
TopologyDescription description = topology.describe();

System.out.println(description);

// 输出示例：
// Topologies:
//    Sub-topology: 0
//     Source: source (topics: [input-topic])
//       --> word-counter
//     Processor: word-counter (stores: [word-count-store])
//       --> sink
//       <-- source
//     Sink: sink (topic: output-topic)
//       <-- word-counter
```

---

## KStream 与 KTable

Kafka Streams 提供了两种核心抽象来表示数据流：KStream（记录流）和 KTable（变更日志流）。理解它们的区别是掌握 Kafka Streams 的关键。

### KStream（记录流）

KStream 表示无限的、不可变的记录序列。每条记录都是独立的事件，包含一个键值对。

**特点：**
- 每条记录代表一个独立事件
- 相同 Key 的记录不会覆盖，而是追加
- 适用于事件日志、点击流、交易记录等场景

```java
StreamsBuilder builder = new StreamsBuilder();

// 创建 KStream
KStream<String, String> stream = builder.stream("events-topic");

// KStream 操作示例
KStream<String, String> processed = stream
    // 过滤：只保留有效事件
    .filter((key, value) -> value != null)

    // 映射：转换 Key
    .selectKey((key, value) -> extractNewKey(value))

    // 映射：转换 Value
    .mapValues(value -> transformValue(value))

    // 扁平映射：一条记录产生多条记录
    .flatMapValues(value -> Arrays.asList(value.split(",")))

    // Peek：调试用，不修改流
    .peek((key, value) -> log.info("Key: {}, Value: {}", key, value));

// 写入目标 Topic
processed.to("output-topic");
```

### KTable（变更日志流）

KTable 表示一个持续更新的表，每个 Key 只保留最新的值。可以理解为对 KStream 按 Key 进行聚合的结果。

**特点：**
- 每个 Key 只有一个当前值
- 新记录会覆盖同 Key 的旧记录
- 适用于用户资料、账户余额、配置信息等场景

```java
StreamsBuilder builder = new StreamsBuilder();

// 从 Topic 创建 KTable
KTable<String, String> table = builder.table(
    "user-profiles-topic",
    Consumed.with(Serdes.String(), Serdes.String()),
    Materialized.as("user-profiles-store")
);

// KTable 操作示例
KTable<String, UserProfile> userProfiles = table
    // 过滤
    .filter((userId, profile) -> profile != null)

    // 值映射
    .mapValues(json -> parseUserProfile(json));

// 查询 KTable 中的数据
ReadOnlyKeyValueStore<String, UserProfile> store = streams.store(
    StoreQueryParameters.fromNameAndType(
        "user-profiles-store",
        QueryableStoreTypes.keyValueStore()
    )
);

UserProfile profile = store.get("user-123");
```

### KStream 与 KTable 的转换

```java
StreamsBuilder builder = new StreamsBuilder();

// KStream -> KTable：通过聚合实现
KStream<String, Long> clickStream = builder.stream("clicks");

KTable<String, Long> clickCounts = clickStream
    .groupByKey()
    .count(Materialized.as("click-counts"));

// KTable -> KStream：每次表更新时产生一条记录
KStream<String, Long> clickCountStream = clickCounts.toStream();

// 使用场景：将聚合结果发送到下游
clickCountStream.to("click-counts-output");
```

### GlobalKTable

GlobalKTable 是 KTable 的变体，它将整个表复制到每个应用实例，适用于小表的广播 Join。

```java
// 创建 GlobalKTable
GlobalKTable<String, String> configTable = builder.globalTable(
    "config-topic",
    Consumed.with(Serdes.String(), Serdes.String()),
    Materialized.as("config-store")
);

// GlobalKTable 与 KStream 的 Join
KStream<String, String> events = builder.stream("events");

KStream<String, String> enrichedEvents = events.join(
    configTable,
    (eventKey, eventValue) -> extractConfigKey(eventValue),  // Key 映射
    (eventValue, configValue) -> enrich(eventValue, configValue)  // Value 合并
);
```

### KStream 与 KTable 对比

| 特性 | KStream | KTable |
|------|---------|--------|
| 语义 | 事件流（INSERT） | 变更日志（UPSERT） |
| 相同 Key 处理 | 追加 | 覆盖 |
| 状态存储 | 无 | 有（物化视图） |
| 适用场景 | 事件日志、交易流 | 用户状态、配置数据 |
| 与 SQL 类比 | INSERT 语句序列 | 表的当前状态 |

---

## 有状态处理（Stateful Processing）

有状态处理是流处理的核心能力，Kafka Streams 提供了强大的状态管理机制，支持聚合、Join、窗口等有状态操作。

### 状态存储类型

Kafka Streams 支持多种状态存储类型：

```java
// 1. KeyValue 存储（持久化）
StoreBuilder<KeyValueStore<String, Long>> keyValueStore = Stores.keyValueStoreBuilder(
    Stores.persistentKeyValueStore("my-store"),
    Serdes.String(),
    Serdes.Long()
);

// 2. KeyValue 存储（内存）
StoreBuilder<KeyValueStore<String, Long>> inMemoryStore = Stores.keyValueStoreBuilder(
    Stores.inMemoryKeyValueStore("in-memory-store"),
    Serdes.String(),
    Serdes.Long()
);

// 3. 窗口存储
StoreBuilder<WindowStore<String, Long>> windowStore = Stores.windowStoreBuilder(
    Stores.persistentWindowStore("window-store", Duration.ofDays(1), Duration.ofMinutes(5), false),
    Serdes.String(),
    Serdes.Long()
);

// 4. Session 存储
StoreBuilder<SessionStore<String, Long>> sessionStore = Stores.sessionStoreBuilder(
    Stores.persistentSessionStore("session-store", Duration.ofHours(1)),
    Serdes.String(),
    Serdes.Long()
);
```

### 聚合操作

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, Order> orders = builder.stream("orders");

// 按用户聚合订单总金额
KTable<String, Double> userTotals = orders
    .groupBy((orderId, order) -> order.getUserId())
    .aggregate(
        () -> 0.0,  // 初始值
        (userId, order, total) -> total + order.getAmount(),  // 聚合函数
        Materialized.<String, Double, KeyValueStore<Bytes, byte[]>>as("user-totals")
            .withKeySerde(Serdes.String())
            .withValueSerde(Serdes.Double())
    );

// 计数
KTable<String, Long> orderCounts = orders
    .groupBy((orderId, order) -> order.getUserId())
    .count(Materialized.as("order-counts"));

// Reduce（要求输入输出类型相同）
KTable<String, Order> latestOrders = orders
    .groupBy((orderId, order) -> order.getUserId())
    .reduce(
        (order1, order2) -> order1.getTimestamp() > order2.getTimestamp() ? order1 : order2,
        Materialized.as("latest-orders")
    );
```

### 状态查询

Kafka Streams 支持交互式查询，可以从外部直接查询状态存储：

```java
public class StateQueryService {

    private final KafkaStreams streams;

    public StateQueryService(KafkaStreams streams) {
        this.streams = streams;
    }

    // 查询本地状态
    public Long getOrderCount(String userId) {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "order-counts",
                QueryableStoreTypes.keyValueStore()
            )
        );
        return store.get(userId);
    }

    // 范围查询
    public Map<String, Long> getOrderCountsInRange(String fromKey, String toKey) {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "order-counts",
                QueryableStoreTypes.keyValueStore()
            )
        );

        Map<String, Long> result = new HashMap<>();
        try (KeyValueIterator<String, Long> iterator = store.range(fromKey, toKey)) {
            while (iterator.hasNext()) {
                KeyValue<String, Long> entry = iterator.next();
                result.put(entry.key, entry.value);
            }
        }
        return result;
    }

    // 查询所有实例的状态（分布式查询）
    public Long getOrderCountAllInstances(String userId) {
        // 获取 Key 所在的实例元数据
        KeyQueryMetadata metadata = streams.queryMetadataForKey(
            "order-counts",
            userId,
            Serdes.String().serializer()
        );

        if (metadata.activeHost().equals(getCurrentHostInfo())) {
            // Key 在本地
            return getOrderCount(userId);
        } else {
            // Key 在远程实例，需要通过 RPC 查询
            return queryRemoteInstance(metadata.activeHost(), userId);
        }
    }
}
```

### 状态恢复与容错

Kafka Streams 通过变更日志（Changelog Topic）实现状态的持久化和恢复：

```java
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

// 状态目录配置
props.put(StreamsConfig.STATE_DIR_CONFIG, "/tmp/kafka-streams");

// 副本数配置（影响 Changelog Topic）
props.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3);

// 待机副本配置（热备份）
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);

// 状态恢复监听
KafkaStreams streams = new KafkaStreams(topology, props);
streams.setStateListener((newState, oldState) -> {
    if (newState == KafkaStreams.State.RUNNING) {
        System.out.println("应用已完成状态恢复，开始处理数据");
    }
});
```

---

## 窗口操作（Windowing）

窗口操作是流处理中的关键概念，用于将无限的数据流划分为有限的时间段进行处理。Kafka Streams 支持多种窗口类型。

### 窗口类型概览

```
滚动窗口（Tumbling Window）:
|-------|-------|-------|-------|
   W1      W2      W3      W4

滑动窗口（Hopping Window）:
|-------|
    |-------|
        |-------|
            |-------|

会话窗口（Session Window）:
|-----|     |-----------|   |--|
  S1            S2          S3
（按活动间隙分隔）

滑动时间窗口（Sliding Window）:
|<---窗口--->|
  任意时间点的前后范围
```

### 滚动窗口（Tumbling Window）

滚动窗口是固定大小、不重叠的时间窗口：

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, PageView> pageViews = builder.stream("page-views");

// 每5分钟统计一次页面访问量
KTable<Windowed<String>, Long> pageViewCounts = pageViews
    .groupBy((key, view) -> view.getPageId())
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count(Materialized.as("page-view-counts"));

// 输出结果
pageViewCounts.toStream()
    .map((windowedKey, count) -> {
        String pageId = windowedKey.key();
        Window window = windowedKey.window();
        String result = String.format(
            "Page: %s, Window: [%s - %s], Count: %d",
            pageId,
            Instant.ofEpochMilli(window.start()),
            Instant.ofEpochMilli(window.end()),
            count
        );
        return KeyValue.pair(pageId, result);
    })
    .to("page-view-stats");
```

### 滑动窗口（Hopping Window）

滑动窗口有固定大小，但窗口之间可以重叠：

```java
// 窗口大小5分钟，每1分钟滑动一次
KTable<Windowed<String>, Long> hoppingCounts = pageViews
    .groupBy((key, view) -> view.getPageId())
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1))
        .advanceBy(Duration.ofMinutes(1)))  // 滑动步长
    .count();

// 这意味着每分钟会产生一个结果，每个结果包含最近5分钟的数据
```

### 会话窗口（Session Window）

会话窗口根据活动间隙动态划分，适用于用户行为分析：

```java
KStream<String, UserAction> userActions = builder.stream("user-actions");

// 30分钟不活动则结束会话
KTable<Windowed<String>, Long> sessionCounts = userActions
    .groupBy((key, action) -> action.getUserId())
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
    .count(Materialized.as("session-counts"));

// 会话聚合示例：统计每个会话的详细信息
KTable<Windowed<String>, SessionStats> sessionStats = userActions
    .groupBy((key, action) -> action.getUserId())
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
    .aggregate(
        SessionStats::new,
        (userId, action, stats) -> stats.addAction(action),  // 添加新动作
        (userId, stats1, stats2) -> stats1.merge(stats2),    // 合并会话
        Materialized.<String, SessionStats, SessionStore<Bytes, byte[]>>as("session-stats")
            .withValueSerde(sessionStatsSerde)
    );
```

### 滑动时间窗口（Sliding Window）

Kafka Streams 2.7+ 引入的滑动时间窗口，用于 Join 操作：

```java
KStream<String, Order> orders = builder.stream("orders");
KStream<String, Payment> payments = builder.stream("payments");

// 订单和支付在10分钟内的关联
KStream<String, OrderPayment> orderPayments = orders.join(
    payments,
    (order, payment) -> new OrderPayment(order, payment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(10)),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
);
```

### 延迟数据处理（Grace Period）

实际场景中，数据可能会延迟到达。Kafka Streams 通过 Grace Period 处理延迟数据：

```java
// 允许5分钟的延迟
KTable<Windowed<String>, Long> counts = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(
        Duration.ofMinutes(5),    // 窗口大小
        Duration.ofMinutes(5)     // 宽限期
    ))
    .count();

// 窗口关闭逻辑：
// 当事件时间 > 窗口结束时间 + 宽限期 时，窗口关闭
// 关闭后的延迟数据将被丢弃（或发送到死信队列）
```

### 窗口结果输出控制

```java
// 使用 suppress 控制输出时机
KTable<Windowed<String>, Long> finalCounts = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count()
    .suppress(Suppressed.untilWindowCloses(
        Suppressed.BufferConfig.unbounded()  // 缓冲区配置
    ));

// suppress 选项：
// 1. untilWindowCloses: 窗口关闭时才输出最终结果
// 2. untilTimeLimit: 等待指定时间后输出
```

---

## Join 操作

Join 是流处理中的核心操作，Kafka Streams 支持多种 Join 类型，包括流-流 Join、流-表 Join 和表-表 Join。

### Join 类型概览

| Join 类型 | 左侧 | 右侧 | 说明 |
|-----------|------|------|------|
| KStream-KStream | KStream | KStream | 基于时间窗口的流 Join |
| KStream-KTable | KStream | KTable | 流事件用表数据增强 |
| KStream-GlobalKTable | KStream | GlobalKTable | 流与全局表 Join（无分区限制） |
| KTable-KTable | KTable | KTable | 表之间的实时 Join |

### KStream-KStream Join

两个流之间的 Join 必须基于时间窗口：

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, Order> orders = builder.stream("orders");
KStream<String, Shipment> shipments = builder.stream("shipments");

// 内连接：订单和发货记录在1小时内的匹配
KStream<String, OrderShipment> orderShipments = orders.join(
    shipments,
    (order, shipment) -> new OrderShipment(order, shipment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofHours(1)),
    StreamJoined.with(
        Serdes.String(),
        orderSerde,
        shipmentSerde
    )
);

// 左连接：所有订单，可能没有发货记录
KStream<String, OrderShipment> leftJoined = orders.leftJoin(
    shipments,
    (order, shipment) -> new OrderShipment(order, shipment),  // shipment 可能为 null
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofHours(1)),
    StreamJoined.with(Serdes.String(), orderSerde, shipmentSerde)
);

// 外连接：包含所有订单和发货记录
KStream<String, OrderShipment> outerJoined = orders.outerJoin(
    shipments,
    (order, shipment) -> new OrderShipment(order, shipment),  // 任一方可能为 null
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofHours(1)),
    StreamJoined.with(Serdes.String(), orderSerde, shipmentSerde)
);
```

### KStream-KTable Join

流与表的 Join 用于数据增强，每条流记录与表的当前状态 Join：

```java
KStream<String, Order> orders = builder.stream("orders");
KTable<String, Customer> customers = builder.table("customers");

// 订单增强：关联客户信息
KStream<String, EnrichedOrder> enrichedOrders = orders.join(
    customers,
    (order, customer) -> new EnrichedOrder(order, customer),
    Joined.with(Serdes.String(), orderSerde, customerSerde)
);

// 左连接：即使没有客户信息也保留订单
KStream<String, EnrichedOrder> leftEnriched = orders.leftJoin(
    customers,
    (order, customer) -> {
        if (customer == null) {
            return new EnrichedOrder(order, Customer.unknown());
        }
        return new EnrichedOrder(order, customer);
    },
    Joined.with(Serdes.String(), orderSerde, customerSerde)
);
```

### KStream-GlobalKTable Join

GlobalKTable 会被完整复制到每个实例，适用于小表的广播 Join：

```java
GlobalKTable<String, Country> countries = builder.globalTable("countries");
KStream<String, Order> orders = builder.stream("orders");

// 使用 GlobalKTable 进行 Join（无需 co-partitioning）
KStream<String, EnrichedOrder> enriched = orders.join(
    countries,
    // KeyValueMapper：从 Order 中提取 Join Key
    (orderId, order) -> order.getCountryCode(),
    // ValueJoiner：合并 Order 和 Country
    (order, country) -> new EnrichedOrder(order, country)
);
```

### KTable-KTable Join

两个表之间的 Join，结果是一个持续更新的表：

```java
KTable<String, User> users = builder.table("users");
KTable<String, Address> addresses = builder.table("addresses");

// 用户和地址的 Join
KTable<String, UserWithAddress> usersWithAddress = users.join(
    addresses,
    (user, address) -> new UserWithAddress(user, address),
    Materialized.as("users-with-address")
);

// 左连接
KTable<String, UserWithAddress> leftJoined = users.leftJoin(
    addresses,
    (user, address) -> new UserWithAddress(user, address)
);

// 外连接
KTable<String, UserWithAddress> outerJoined = users.outerJoin(
    addresses,
    (user, address) -> new UserWithAddress(user, address)
);
```

### Co-partitioning 要求

对于 KStream-KStream 和 KTable-KTable Join，要求两个数据源满足 Co-partitioning：

1. 相同的分区数
2. 相同的分区策略
3. 使用相同的 Key

```java
// 确保 Topic 具有相同的分区数
// kafka-topics.sh --create --topic orders --partitions 12
// kafka-topics.sh --create --topic payments --partitions 12

// 如果不满足条件，使用 repartition
KStream<String, Order> repartitionedOrders = orders
    .selectKey((key, order) -> order.getOrderId())
    .repartition(Repartitioned.with(Serdes.String(), orderSerde)
        .withNumberOfPartitions(12));
```

### Join 实战示例：实时订单仪表板

```java
public Topology buildOrderDashboard() {
    StreamsBuilder builder = new StreamsBuilder();

    // 输入流
    KStream<String, Order> orders = builder.stream("orders");
    KStream<String, Payment> payments = builder.stream("payments");
    KTable<String, Customer> customers = builder.table("customers");
    GlobalKTable<String, Product> products = builder.globalTable("products");

    // 1. 订单与支付 Join（10分钟窗口）
    KStream<String, OrderWithPayment> ordersWithPayment = orders.join(
        payments,
        OrderWithPayment::new,
        JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(10)),
        StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
    );

    // 2. 增强客户信息
    KStream<String, OrderWithPaymentAndCustomer> enrichedWithCustomer =
        ordersWithPayment.leftJoin(
            customers,
            (orderPayment, customer) -> new OrderWithPaymentAndCustomer(
                orderPayment,
                customer != null ? customer : Customer.unknown()
            )
        );

    // 3. 增强产品信息
    KStream<String, FullOrderInfo> fullOrderInfo = enrichedWithCustomer.join(
        products,
        (orderId, enriched) -> enriched.getOrder().getProductId(),
        (enriched, product) -> new FullOrderInfo(enriched, product)
    );

    // 4. 输出到仪表板 Topic
    fullOrderInfo.to("order-dashboard");

    return builder.build();
}
```

---

## 精确一次语义（Exactly-Once Semantics）

Kafka Streams 原生支持精确一次语义（EOS），确保每条消息在处理过程中不会丢失或重复。

### 启用精确一次语义

```java
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-eos-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");

// 启用精确一次语义
// "exactly_once_v2" 是 Kafka 2.5+ 推荐的配置
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// 相关配置
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);  // 提交间隔
props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 10 * 1024 * 1024);  // 10MB 缓存

KafkaStreams streams = new KafkaStreams(topology, props);
```

### EOS 工作原理

```
1. 事务性生产者
   - 每个 Task 使用唯一的 transactional.id
   - 所有输出在同一事务中原子提交

2. 消费者 Offset 提交
   - Offset 与输出消息在同一事务中提交
   - 保证输入和输出的一致性

3. 状态存储变更日志
   - Changelog 写入也包含在事务中
   - 故障恢复时状态与处理进度一致
```

### EOS 与 At-Least-Once 对比

```java
// At-Least-Once 配置（默认）
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.AT_LEAST_ONCE);

// 特点：
// - 消息至少处理一次，可能重复
// - 性能更高
// - 需要下游实现幂等处理

// Exactly-Once 配置
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// 特点：
// - 消息精确处理一次
// - 性能开销较高（约10-20%）
// - 适用于金融、计费等对准确性要求高的场景
```

### 幂等处理模式

即使启用了 EOS，在某些边界场景（如跨系统交互）仍建议实现幂等处理：

```java
class IdempotentProcessor implements Processor<String, Order, String, ProcessedOrder> {

    private ProcessorContext<String, ProcessedOrder> context;
    private KeyValueStore<String, Long> processedStore;

    @Override
    public void init(ProcessorContext<String, ProcessedOrder> context) {
        this.context = context;
        this.processedStore = context.getStateStore("processed-orders");
    }

    @Override
    public void process(Record<String, Order> record) {
        String orderId = record.key();
        Order order = record.value();

        // 检查是否已处理
        Long processedTime = processedStore.get(orderId);
        if (processedTime != null) {
            // 已处理，跳过
            log.info("Order {} already processed at {}", orderId, processedTime);
            return;
        }

        // 处理订单
        ProcessedOrder result = processOrder(order);

        // 标记为已处理
        processedStore.put(orderId, System.currentTimeMillis());

        // 转发结果
        context.forward(new Record<>(orderId, result, record.timestamp()));
    }
}
```

### 事务边界与性能优化

```java
// 事务提交间隔配置
// 较小的值：更低的延迟，但更高的事务开销
// 较大的值：更好的吞吐量，但更高的端到端延迟
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);

// 缓存配置
// 缓存可以减少对状态存储的写入次数
props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 10 * 1024 * 1024);

// Standby 副本配置
// 用于快速故障转移
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
```

---

## 实战示例

### 示例一：实时电商分析

```java
public class EcommerceAnalytics {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "ecommerce-analytics");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();

        // 订单流
        KStream<String, Order> orders = builder.stream(
            "orders",
            Consumed.with(Serdes.String(), new OrderSerde())
        );

        // 1. 实时销售额统计（每分钟）
        KTable<Windowed<String>, Double> salesByMinute = orders
            .groupBy((orderId, order) -> order.getCategory())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
            .aggregate(
                () -> 0.0,
                (category, order, total) -> total + order.getAmount(),
                Materialized.<String, Double, WindowStore<Bytes, byte[]>>as("sales-by-minute")
                    .withKeySerde(Serdes.String())
                    .withValueSerde(Serdes.Double())
            );

        // 输出到仪表板
        salesByMinute.toStream()
            .map((windowedKey, amount) -> KeyValue.pair(
                windowedKey.key(),
                new SalesMetric(windowedKey.key(), windowedKey.window(), amount)
            ))
            .to("sales-dashboard", Produced.with(Serdes.String(), new SalesMetricSerde()));

        // 2. 用户行为分析（会话窗口）
        KStream<String, UserAction> userActions = builder.stream(
            "user-actions",
            Consumed.with(Serdes.String(), new UserActionSerde())
        );

        KTable<Windowed<String>, SessionSummary> userSessions = userActions
            .groupBy((key, action) -> action.getUserId())
            .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
            .aggregate(
                SessionSummary::new,
                (userId, action, session) -> session.addAction(action),
                (userId, session1, session2) -> session1.merge(session2),
                Materialized.as("user-sessions")
            );

        // 3. 异常检测：大额订单告警
        KStream<String, Order> largeOrders = orders
            .filter((orderId, order) -> order.getAmount() > 10000);

        largeOrders.to("large-order-alerts");

        // 4. 实时库存更新
        KTable<String, Integer> inventory = builder.table(
            "inventory",
            Consumed.with(Serdes.String(), Serdes.Integer())
        );

        KStream<String, InventoryUpdate> inventoryUpdates = orders
            .flatMapValues(order -> order.getItems().stream()
                .map(item -> new InventoryUpdate(item.getSku(), -item.getQuantity()))
                .collect(Collectors.toList()));

        KTable<String, Integer> updatedInventory = inventoryUpdates
            .groupBy((key, update) -> update.getSku())
            .aggregate(
                () -> 0,
                (sku, update, current) -> current + update.getDelta(),
                Materialized.as("inventory-updates")
            );

        // 库存告警
        updatedInventory.toStream()
            .filter((sku, quantity) -> quantity < 10)
            .to("low-inventory-alerts");

        // 启动应用
        KafkaStreams streams = new KafkaStreams(builder.build(), props);

        // 优雅关闭
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));

        streams.start();
    }
}
```

### 示例二：实时欺诈检测

```java
public class FraudDetection {

    public Topology buildTopology() {
        StreamsBuilder builder = new StreamsBuilder();

        // 交易流
        KStream<String, Transaction> transactions = builder.stream(
            "transactions",
            Consumed.with(Serdes.String(), transactionSerde)
        );

        // 用户历史交易表
        KTable<String, UserTransactionHistory> userHistory = builder.table(
            "user-transaction-history",
            Consumed.with(Serdes.String(), userHistorySerde)
        );

        // 1. 规则检测：单笔大额交易
        KStream<String, FraudAlert> largeTransactionAlerts = transactions
            .filter((txId, tx) -> tx.getAmount() > 50000)
            .mapValues(tx -> new FraudAlert(
                tx.getUserId(),
                "LARGE_TRANSACTION",
                "单笔交易金额超过 50000: " + tx.getAmount(),
                tx
            ));

        // 2. 规则检测：高频交易（5分钟内超过10笔）
        KStream<String, Long> transactionCounts = transactions
            .groupBy((txId, tx) -> tx.getUserId())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count()
            .toStream()
            .filter((windowedKey, count) -> count > 10)
            .map((windowedKey, count) -> KeyValue.pair(windowedKey.key(), count));

        KStream<String, FraudAlert> highFrequencyAlerts = transactionCounts
            .mapValues((userId, count) -> new FraudAlert(
                userId,
                "HIGH_FREQUENCY",
                "5分钟内交易次数过多: " + count,
                null
            ));

        // 3. 规则检测：异常地点（与历史交易地点不符）
        KStream<String, FraudAlert> locationAlerts = transactions.join(
            userHistory,
            (tx, history) -> {
                if (history != null && !history.getCommonLocations().contains(tx.getLocation())) {
                    return new FraudAlert(
                        tx.getUserId(),
                        "UNUSUAL_LOCATION",
                        "异常交易地点: " + tx.getLocation(),
                        tx
                    );
                }
                return null;
            }
        ).filter((userId, alert) -> alert != null);

        // 4. 规则检测：短时间内跨地区交易
        KStream<String, List<Transaction>> userTransactionWindows = transactions
            .groupBy((txId, tx) -> tx.getUserId())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
            .aggregate(
                ArrayList::new,
                (userId, tx, list) -> { list.add(tx); return list; },
                Materialized.with(Serdes.String(), new ListSerde<>(transactionSerde))
            )
            .toStream()
            .map((windowedKey, txList) -> KeyValue.pair(windowedKey.key(), txList));

        KStream<String, FraudAlert> impossibleTravelAlerts = userTransactionWindows
            .flatMapValues(txList -> detectImpossibleTravel(txList));

        // 合并所有告警
        KStream<String, FraudAlert> allAlerts = largeTransactionAlerts
            .merge(highFrequencyAlerts)
            .merge(locationAlerts)
            .merge(impossibleTravelAlerts);

        // 输出告警
        allAlerts.to("fraud-alerts", Produced.with(Serdes.String(), fraudAlertSerde));

        // 告警计数（用于监控）
        allAlerts
            .groupBy((userId, alert) -> alert.getType())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
            .count()
            .toStream()
            .to("fraud-alert-metrics");

        return builder.build();
    }

    private List<FraudAlert> detectImpossibleTravel(List<Transaction> transactions) {
        List<FraudAlert> alerts = new ArrayList<>();

        if (transactions.size() < 2) {
            return alerts;
        }

        transactions.sort(Comparator.comparing(Transaction::getTimestamp));

        for (int i = 1; i < transactions.size(); i++) {
            Transaction prev = transactions.get(i - 1);
            Transaction curr = transactions.get(i);

            double distance = calculateDistance(prev.getLocation(), curr.getLocation());
            long timeDiff = curr.getTimestamp() - prev.getTimestamp();
            double requiredSpeed = distance / (timeDiff / 3600000.0);  // km/h

            if (requiredSpeed > 1000) {  // 超过飞机速度
                alerts.add(new FraudAlert(
                    curr.getUserId(),
                    "IMPOSSIBLE_TRAVEL",
                    String.format("不可能的旅行速度: %.0f km/h", requiredSpeed),
                    curr
                ));
            }
        }

        return alerts;
    }
}
```

### 示例三：IoT 数据处理

```java
public class IoTDataProcessor {

    public Topology buildTopology() {
        StreamsBuilder builder = new StreamsBuilder();

        // 设备数据流
        KStream<String, SensorReading> sensorData = builder.stream(
            "sensor-readings",
            Consumed.with(Serdes.String(), sensorReadingSerde)
        );

        // 设备元数据表
        GlobalKTable<String, DeviceMetadata> deviceMetadata = builder.globalTable(
            "device-metadata",
            Consumed.with(Serdes.String(), deviceMetadataSerde)
        );

        // 1. 数据清洗
        KStream<String, SensorReading> cleanedData = sensorData
            .filter((deviceId, reading) -> isValidReading(reading))
            .mapValues(reading -> normalizeReading(reading));

        // 2. 关联设备元数据
        KStream<String, EnrichedReading> enrichedData = cleanedData.join(
            deviceMetadata,
            (deviceId, reading) -> deviceId,
            (reading, metadata) -> new EnrichedReading(reading, metadata)
        );

        // 3. 实时聚合（每分钟）
        KTable<Windowed<String>, SensorStats> minuteStats = enrichedData
            .groupBy((deviceId, reading) -> reading.getDeviceType())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(1)))
            .aggregate(
                SensorStats::new,
                (type, reading, stats) -> stats.add(reading),
                Materialized.<String, SensorStats, WindowStore<Bytes, byte[]>>as("minute-stats")
                    .withValueSerde(sensorStatsSerde)
            );

        // 4. 异常检测（滑动窗口平均值）
        KTable<Windowed<String>, Double> movingAverages = enrichedData
            .groupBy((deviceId, reading) -> deviceId)
            .windowedBy(SlidingWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5)))
            .aggregate(
                () -> new double[]{0.0, 0.0},  // [sum, count]
                (deviceId, reading, agg) -> new double[]{
                    agg[0] + reading.getValue(),
                    agg[1] + 1
                },
                Materialized.with(Serdes.String(), new ArraySerde())
            )
            .mapValues(agg -> agg[1] > 0 ? agg[0] / agg[1] : 0.0);

        // 检测异常值（偏离移动平均值超过3倍标准差）
        KStream<String, AnomalyAlert> anomalies = enrichedData.join(
            movingAverages,
            (reading, avgValue) -> {
                double deviation = Math.abs(reading.getValue() - avgValue);
                if (deviation > 3 * getStdDev(reading.getDeviceId())) {
                    return new AnomalyAlert(reading, avgValue, deviation);
                }
                return null;
            },
            JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(1)),
            StreamJoined.with(Serdes.String(), enrichedReadingSerde, Serdes.Double())
        ).filter((deviceId, alert) -> alert != null);

        // 5. 设备健康度计算
        KTable<String, DeviceHealth> deviceHealth = enrichedData
            .groupBy((deviceId, reading) -> deviceId)
            .aggregate(
                DeviceHealth::new,
                (deviceId, reading, health) -> health.update(reading),
                Materialized.as("device-health")
            );

        // 6. 输出结果
        minuteStats.toStream().to("sensor-minute-stats");
        anomalies.to("sensor-anomalies");
        deviceHealth.toStream().to("device-health-status");

        return builder.build();
    }

    private boolean isValidReading(SensorReading reading) {
        return reading != null
            && reading.getTimestamp() > 0
            && !Double.isNaN(reading.getValue())
            && reading.getValue() >= -1000
            && reading.getValue() <= 1000;
    }

    private SensorReading normalizeReading(SensorReading reading) {
        // 数据标准化处理
        return reading;
    }
}
```

---

## 最佳实践与调优

### 应用配置最佳实践

```java
public Properties getOptimalConfig() {
    Properties props = new Properties();

    // 基本配置
    props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-streams-app");
    props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "kafka1:9092,kafka2:9092");

    // 线程配置
    // 建议：num.stream.threads <= partition count
    props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);

    // 处理保证
    props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

    // 提交间隔（影响延迟和吞吐量的权衡）
    props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);

    // 缓存配置（减少状态存储写入）
    props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 10 * 1024 * 1024);

    // Standby 副本（快速故障转移）
    props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);

    // 状态目录
    props.put(StreamsConfig.STATE_DIR_CONFIG, "/var/kafka-streams");

    // 序列化配置
    props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
    props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

    // RocksDB 调优
    props.put(StreamsConfig.ROCKSDB_CONFIG_SETTER_CLASS_CONFIG, CustomRocksDBConfig.class);

    // 生产者配置
    props.put(StreamsConfig.producerPrefix(ProducerConfig.ACKS_CONFIG), "all");
    props.put(StreamsConfig.producerPrefix(ProducerConfig.RETRIES_CONFIG), Integer.MAX_VALUE);
    props.put(StreamsConfig.producerPrefix(ProducerConfig.COMPRESSION_TYPE_CONFIG), "lz4");

    // 消费者配置
    props.put(StreamsConfig.consumerPrefix(ConsumerConfig.MAX_POLL_RECORDS_CONFIG), 500);
    props.put(StreamsConfig.consumerPrefix(ConsumerConfig.FETCH_MAX_BYTES_CONFIG), 50 * 1024 * 1024);

    return props;
}

// 自定义 RocksDB 配置
public class CustomRocksDBConfig implements RocksDBConfigSetter {
    @Override
    public void setConfig(String storeName, Options options, Map<String, Object> configs) {
        // 写缓冲区大小
        options.setWriteBufferSize(64 * 1024 * 1024);

        // 最大写缓冲区数量
        options.setMaxWriteBufferNumber(4);

        // 压缩
        options.setCompressionType(CompressionType.LZ4_COMPRESSION);

        // Block Cache
        BlockBasedTableConfig tableConfig = new BlockBasedTableConfig();
        tableConfig.setBlockCacheSize(256 * 1024 * 1024);
        options.setTableFormatConfig(tableConfig);
    }
}
```

### 监控与可观测性

```java
public class StreamsMonitoring {

    public void setupMetrics(KafkaStreams streams) {
        // 内置指标
        Map<MetricName, ? extends Metric> metrics = streams.metrics();

        for (Map.Entry<MetricName, ? extends Metric> entry : metrics.entrySet()) {
            MetricName name = entry.getKey();
            if (name.group().equals("stream-metrics")) {
                System.out.printf("Metric: %s.%s = %s%n",
                    name.group(), name.name(), entry.getValue().metricValue());
            }
        }

        // 常用指标
        // - process-rate: 处理速率
        // - process-latency-avg: 平均处理延迟
        // - commit-rate: 提交速率
        // - poll-rate: 拉取速率
        // - task-created-rate: 任务创建速率
        // - rebalance-rate: 再平衡速率
    }

    public void setupStateListener(KafkaStreams streams) {
        streams.setStateListener((newState, oldState) -> {
            System.out.printf("状态变更: %s -> %s%n", oldState, newState);

            switch (newState) {
                case CREATED:
                    System.out.println("应用已创建");
                    break;
                case REBALANCING:
                    System.out.println("正在重新平衡");
                    break;
                case RUNNING:
                    System.out.println("应用正在运行");
                    break;
                case PENDING_SHUTDOWN:
                    System.out.println("正在关闭");
                    break;
                case NOT_RUNNING:
                    System.out.println("应用已停止");
                    break;
                case PENDING_ERROR:
                case ERROR:
                    System.err.println("应用发生错误");
                    break;
            }
        });
    }

    public void setupExceptionHandler(KafkaStreams streams) {
        // 未捕获异常处理
        streams.setUncaughtExceptionHandler((thread, exception) -> {
            System.err.println("未捕获异常: " + exception.getMessage());
            exception.printStackTrace();

            // 返回处理策略
            if (exception instanceof DeserializationException) {
                return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.REPLACE_THREAD;
            }
            return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.SHUTDOWN_APPLICATION;
        });
    }
}
```

### 错误处理最佳实践

```java
public class ErrorHandling {

    public Properties getErrorHandlingConfig() {
        Properties props = new Properties();

        // 反序列化错误处理
        props.put(StreamsConfig.DEFAULT_DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG,
            LogAndContinueExceptionHandler.class);

        // 生产错误处理
        props.put(StreamsConfig.DEFAULT_PRODUCTION_EXCEPTION_HANDLER_CLASS_CONFIG,
            DefaultProductionExceptionHandler.class);

        return props;
    }
}

// 自定义反序列化异常处理器
public class CustomDeserializationHandler implements DeserializationExceptionHandler {

    @Override
    public DeserializationHandlerResponse handle(ProcessorContext context,
                                                   ConsumerRecord<byte[], byte[]> record,
                                                   Exception exception) {
        // 记录错误
        log.error("反序列化失败: topic={}, partition={}, offset={}",
            record.topic(), record.partition(), record.offset(), exception);

        // 发送到死信队列
        sendToDeadLetterQueue(record, exception);

        // 继续处理
        return DeserializationHandlerResponse.CONTINUE;
    }

    private void sendToDeadLetterQueue(ConsumerRecord<byte[], byte[]> record, Exception ex) {
        // 实现死信队列逻辑
    }
}

// 自定义生产异常处理器
public class CustomProductionExceptionHandler implements ProductionExceptionHandler {

    @Override
    public ProductionExceptionHandlerResponse handle(ProducerRecord<byte[], byte[]> record,
                                                      Exception exception) {
        log.error("生产消息失败: topic={}", record.topic(), exception);

        if (exception instanceof RecordTooLargeException) {
            // 消息过大，跳过
            return ProductionExceptionHandlerResponse.CONTINUE;
        }

        // 其他错误，停止处理
        return ProductionExceptionHandlerResponse.FAIL;
    }
}
```

---

## 面试要点

### Kafka Streams 与 Flink 的主要区别是什么？

**答案要点：**
- **部署模式**：Kafka Streams 是嵌入式库，Flink 是独立集群
- **数据源**：Kafka Streams 仅支持 Kafka，Flink 支持多数据源
- **复杂度**：Kafka Streams 更轻量，Flink 功能更全面
- **状态管理**：两者都支持，但 Flink 的状态后端更灵活
- **适用场景**：Kafka Streams 适合中等复杂度的 Kafka 原生场景，Flink 适合复杂流处理

### KStream 和 KTable 的区别？

**答案要点：**
- **KStream**：记录流，每条记录独立，相同 Key 追加
- **KTable**：变更日志，相同 Key 的新值覆盖旧值
- **类比**：KStream 类似 INSERT 操作序列，KTable 类似表的当前状态
- **转换**：KStream 通过聚合变为 KTable，KTable 通过 toStream 变为 KStream

### 如何保证 Exactly-Once 语义？

**答案要点：**
- 配置 `processing.guarantee=exactly_once_v2`
- 依赖 Kafka 事务机制
- 输入消费、状态更新、输出生产在同一事务中
- 事务 ID 基于 Application ID 和 Task ID

### 窗口类型有哪些？各自的使用场景？

**答案要点：**
- **滚动窗口**：固定大小不重叠，定时统计
- **滑动窗口**：固定大小可重叠，滑动统计
- **会话窗口**：动态大小，用户行为分析
- **Grace Period**：处理延迟数据

### 如何处理状态恢复？

**答案要点：**
- Changelog Topic 记录状态变更
- 应用重启时从 Changelog 恢复状态
- Standby 副本提供热备份
- 状态目录持久化到本地磁盘

### Co-partitioning 是什么？为什么需要？

**答案要点：**
- 两个 Topic 具有相同分区数和分区策略
- 确保相同 Key 的数据在同一分区
- KStream-KStream Join 和 KTable-KTable Join 需要
- GlobalKTable 不需要（全量复制）

### 如何进行性能调优？

**答案要点：**
- 增加 `num.stream.threads`（不超过分区数）
- 调整 `cache.max.bytes.buffering` 减少写入
- 配置 `commit.interval.ms` 平衡延迟和吞吐
- 使用 Standby 副本加速故障转移
- RocksDB 调优（写缓冲区、Block Cache）

### 如何处理数据倾斜？

**答案要点：**
- 使用 `repartition` 重新分区
- 设计合理的 Key 分布
- 考虑使用 GlobalKTable 广播小表
- 监控分区处理延迟

---

## 总结

Kafka Streams 作为 Kafka 生态系统的原生流处理库，提供了一种简单而强大的方式来构建实时流处理应用。其核心优势包括：

**核心要点回顾：**

1. **轻量级部署**：作为库嵌入应用，无需独立集群
2. **双重抽象**：KStream（事件流）和 KTable（变更日志）覆盖不同场景
3. **丰富的操作**：支持转换、聚合、窗口、Join 等操作
4. **精确一次语义**：原生支持 EOS，保证数据一致性
5. **状态管理**：内置 RocksDB 状态存储，支持交互式查询
6. **容错机制**：Changelog 备份 + Standby 副本实现高可用

选择 Kafka Streams 时，请确保你的场景满足以下条件：数据源和目标都是 Kafka，对延迟有一定要求，希望简化运维复杂度。对于更复杂的流处理需求，可以考虑 Apache Flink 等更全面的解决方案。

掌握 Kafka Streams，你就能够高效地构建实时数据管道、事件驱动应用和流式分析系统，为企业的数字化转型提供强大的技术支撑。
