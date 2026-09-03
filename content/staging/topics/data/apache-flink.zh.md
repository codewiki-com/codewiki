---
title: Apache Flink 实时计算
description: 学习Apache Flink进行大规模实时数据处理
track: data
section: data-engineering
difficulty: advanced
tags:
  - Flink
  - 流处理
  - 实时计算
  - 大数据
status: imported
origin: old/src/content/docs/data/apache-flink.zh.md
divergence: 0.215
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 16
  lastUpdated: 2026-01-07
---

Apache Flink 是一个开源的分布式流处理框架，专为高吞吐量、低延迟的实时数据处理而设计。它提供了真正的流处理能力，能够以事件驱动的方式处理无界数据流，同时也支持批处理作为流处理的特例。本指南将深入讲解 Flink 的核心概念、API 使用和生产实践。

## Flink 架构与核心概念

### 什么是 Apache Flink？

Apache Flink 是一个框架和分布式处理引擎，用于在无界和有界数据流上进行有状态计算。Flink 被设计为在所有常见的集群环境中运行，以内存速度和任意规模执行计算。

### 核心特性

- **真正的流处理**：事件驱动，逐条处理数据
- **精确一次语义**：保证数据处理的正确性
- **低延迟高吞吐**：毫秒级延迟，百万级吞吐
- **强大的状态管理**：支持大规模有状态计算
- **事件时间处理**：基于事件时间的窗口计算
- **容错机制**：基于检查点的故障恢复

### Flink 架构设计

```
                    +------------------+
                    |   Client         |
                    | (提交作业)        |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   JobManager     |
                    | +-------------+  |
                    | | Dispatcher  |  |
                    | +-------------+  |
                    | | ResourceMgr |  |
                    | +-------------+  |
                    | | JobMaster   |  |
                    | +-------------+  |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +--------v-------+  +--------v-------+
|  TaskManager   |  |  TaskManager   |  |  TaskManager   |
| +------------+ |  | +------------+ |  | +------------+ |
| | Task Slot  | |  | | Task Slot  | |  | | Task Slot  | |
| | Task Slot  | |  | | Task Slot  | |  | | Task Slot  | |
| | Task Slot  | |  | | Task Slot  | |  | | Task Slot  | |
| +------------+ |  | +------------+ |  | +------------+ |
+----------------+  +----------------+  +----------------+
```

### 核心组件说明

| 组件 | 说明 |
|------|------|
| **Client** | 提交作业，生成 JobGraph |
| **JobManager** | 集群的主节点，负责调度和协调 |
| **Dispatcher** | 接收作业提交，启动 JobMaster |
| **ResourceManager** | 管理 TaskManager 的资源 |
| **JobMaster** | 管理单个作业的执行 |
| **TaskManager** | 工作节点，执行具体的任务 |
| **Task Slot** | TaskManager 中的资源单元 |

### 初始化 Flink 环境

```java
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;

public class FlinkQuickStart {
    public static void main(String[] args) throws Exception {
        // 创建流处理执行环境
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 设置并行度
        env.setParallelism(4);

        // 设置时间特性（Flink 1.12+ 默认事件时间）
        // env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);

        // 创建 Table 环境
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

        // 配置检查点
        env.enableCheckpointing(60000); // 60秒

        System.out.println("Flink 版本: " + env.getVersion());
    }
}
```

```python
# PyFlink 示例
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment

# 创建流处理环境
env = StreamExecutionEnvironment.get_execution_environment()
env.set_parallelism(4)

# 创建 Table 环境
table_env = StreamTableEnvironment.create(env)

# 配置检查点
env.enable_checkpointing(60000)

print("Flink 环境初始化完成")
```

## DataStream API

### 数据源（Source）

DataStream API 是 Flink 的核心 API，用于处理无界和有界数据流。

```java
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class DataStreamSources {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 1. 从集合创建
        DataStream<String> fromCollection = env.fromElements(
            "Hello", "World", "Flink"
        );

        // 2. 从文件读取
        DataStream<String> fromFile = env.readTextFile("path/to/file.txt");

        // 3. 从 Socket 读取
        DataStream<String> fromSocket = env.socketTextStream("localhost", 9999);

        // 4. 从 Kafka 读取
        KafkaSource<String> kafkaSource = KafkaSource.<String>builder()
            .setBootstrapServers("localhost:9092")
            .setTopics("input-topic")
            .setGroupId("flink-group")
            .setStartingOffsets(OffsetsInitializer.earliest())
            .setValueOnlyDeserializer(new SimpleStringSchema())
            .build();

        DataStream<String> fromKafka = env.fromSource(
            kafkaSource,
            WatermarkStrategy.noWatermarks(),
            "Kafka Source"
        );

        // 5. 自定义 Source
        DataStream<Long> customSource = env.addSource(new SourceFunction<Long>() {
            private volatile boolean isRunning = true;
            private long counter = 0;

            @Override
            public void run(SourceContext<Long> ctx) throws Exception {
                while (isRunning) {
                    ctx.collect(counter++);
                    Thread.sleep(1000);
                }
            }

            @Override
            public void cancel() {
                isRunning = false;
            }
        });

        env.execute("DataStream Sources Demo");
    }
}
```

### 转换操作（Transformation）

```java
import org.apache.flink.api.common.functions.*;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.util.Collector;

public class DataStreamTransformations {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<String> input = env.fromElements(
            "hello world", "flink streaming", "real time processing"
        );

        // 1. Map：一对一转换
        DataStream<String> mapped = input.map(new MapFunction<String, String>() {
            @Override
            public String map(String value) {
                return value.toUpperCase();
            }
        });

        // Lambda 写法
        DataStream<Integer> lengths = input.map(s -> s.length());

        // 2. FlatMap：一对多转换
        DataStream<String> words = input.flatMap(
            new FlatMapFunction<String, String>() {
                @Override
                public void flatMap(String value, Collector<String> out) {
                    for (String word : value.split(" ")) {
                        out.collect(word);
                    }
                }
            }
        );

        // 3. Filter：过滤
        DataStream<String> filtered = words.filter(word -> word.length() > 4);

        // 4. KeyBy：按键分组
        DataStream<Tuple2<String, Integer>> wordCounts = words
            .map(word -> Tuple2.of(word, 1))
            .returns(Types.TUPLE(Types.STRING, Types.INT))
            .keyBy(tuple -> tuple.f0)
            .sum(1);

        // 5. Reduce：聚合
        DataStream<Tuple2<String, Integer>> reduced = words
            .map(word -> Tuple2.of(word, 1))
            .returns(Types.TUPLE(Types.STRING, Types.INT))
            .keyBy(tuple -> tuple.f0)
            .reduce((t1, t2) -> Tuple2.of(t1.f0, t1.f1 + t2.f1));

        // 6. Union：合并多个流
        DataStream<String> stream1 = env.fromElements("a", "b");
        DataStream<String> stream2 = env.fromElements("c", "d");
        DataStream<String> unioned = stream1.union(stream2);

        // 7. Connect：连接两个不同类型的流
        DataStream<Integer> intStream = env.fromElements(1, 2, 3);
        DataStream<String> stringStream = env.fromElements("a", "b", "c");

        ConnectedStreams<Integer, String> connected =
            intStream.connect(stringStream);

        DataStream<String> coProcessed = connected.map(
            new CoMapFunction<Integer, String, String>() {
                @Override
                public String map1(Integer value) {
                    return "Integer: " + value;
                }

                @Override
                public String map2(String value) {
                    return "String: " + value;
                }
            }
        );

        // 8. Side Output：侧输出
        final OutputTag<String> lateDataTag =
            new OutputTag<String>("late-data"){};

        SingleOutputStreamOperator<String> mainStream = input
            .process(new ProcessFunction<String, String>() {
                @Override
                public void processElement(String value, Context ctx,
                                          Collector<String> out) {
                    if (value.length() > 5) {
                        out.collect(value);
                    } else {
                        ctx.output(lateDataTag, value);
                    }
                }
            });

        DataStream<String> sideOutput = mainStream.getSideOutput(lateDataTag);

        env.execute("Transformations Demo");
    }
}
```

### 数据输出（Sink）

```java
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.file.sink.FileSink;
import org.apache.flink.core.fs.Path;

public class DataStreamSinks {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<String> stream = env.fromElements("a", "b", "c");

        // 1. 打印到控制台
        stream.print();
        stream.print("prefix");  // 带前缀

        // 2. 写入文件
        FileSink<String> fileSink = FileSink
            .forRowFormat(new Path("output/"), new SimpleStringEncoder<String>())
            .withRollingPolicy(
                DefaultRollingPolicy.builder()
                    .withRolloverInterval(Duration.ofMinutes(15))
                    .withInactivityInterval(Duration.ofMinutes(5))
                    .withMaxPartSize(MemorySize.ofMebiBytes(1024))
                    .build()
            )
            .build();

        stream.sinkTo(fileSink);

        // 3. 写入 Kafka
        KafkaSink<String> kafkaSink = KafkaSink.<String>builder()
            .setBootstrapServers("localhost:9092")
            .setRecordSerializer(
                KafkaRecordSerializationSchema.builder()
                    .setTopic("output-topic")
                    .setValueSerializationSchema(new SimpleStringSchema())
                    .build()
            )
            .setDeliveryGuarantee(DeliveryGuarantee.AT_LEAST_ONCE)
            .build();

        stream.sinkTo(kafkaSink);

        // 4. 写入 JDBC
        JdbcSink.sink(
            "INSERT INTO words (word) VALUES (?)",
            (statement, word) -> statement.setString(1, word),
            JdbcExecutionOptions.builder()
                .withBatchSize(1000)
                .withBatchIntervalMs(200)
                .withMaxRetries(5)
                .build(),
            new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
                .withUrl("jdbc:mysql://localhost:3306/flink_db")
                .withDriverName("com.mysql.cj.jdbc.Driver")
                .withUsername("root")
                .withPassword("password")
                .build()
        );

        // 5. 自定义 Sink
        stream.addSink(new RichSinkFunction<String>() {
            @Override
            public void open(Configuration parameters) throws Exception {
                // 初始化资源，如数据库连接
            }

            @Override
            public void invoke(String value, Context context) throws Exception {
                // 处理每条数据
                System.out.println("Custom sink: " + value);
            }

            @Override
            public void close() throws Exception {
                // 释放资源
            }
        });

        env.execute("Sinks Demo");
    }
}
```

## Table API 与 SQL

### Table API 基础

Table API 是一种声明式的、关系型的 API，类似于 SQL，但可以嵌入到 Java、Scala 或 Python 程序中。

```java
import org.apache.flink.table.api.*;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;

public class TableAPIDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

        // 创建表
        tableEnv.executeSql(
            "CREATE TABLE orders (" +
            "  order_id STRING," +
            "  user_id STRING," +
            "  product STRING," +
            "  amount DECIMAL(10, 2)," +
            "  order_time TIMESTAMP(3)," +
            "  WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND" +
            ") WITH (" +
            "  'connector' = 'kafka'," +
            "  'topic' = 'orders'," +
            "  'properties.bootstrap.servers' = 'localhost:9092'," +
            "  'format' = 'json'" +
            ")"
        );

        // 获取 Table 对象
        Table orders = tableEnv.from("orders");

        // Table API 操作
        Table result = orders
            .filter($("amount").isGreater(100))
            .groupBy($("user_id"))
            .select(
                $("user_id"),
                $("amount").sum().as("total_amount"),
                $("order_id").count().as("order_count")
            );

        // 打印结果
        result.execute().print();
    }
}
```

### Flink SQL

```java
import org.apache.flink.table.api.TableResult;

public class FlinkSQLDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

        // 创建源表
        tableEnv.executeSql(
            "CREATE TABLE user_behavior (" +
            "  user_id BIGINT," +
            "  item_id BIGINT," +
            "  category_id BIGINT," +
            "  behavior STRING," +
            "  ts TIMESTAMP(3)," +
            "  proctime AS PROCTIME()," +
            "  WATERMARK FOR ts AS ts - INTERVAL '5' SECOND" +
            ") WITH (" +
            "  'connector' = 'kafka'," +
            "  'topic' = 'user_behavior'," +
            "  'properties.bootstrap.servers' = 'localhost:9092'," +
            "  'format' = 'json'," +
            "  'scan.startup.mode' = 'earliest-offset'" +
            ")"
        );

        // 创建结果表
        tableEnv.executeSql(
            "CREATE TABLE pv_count (" +
            "  window_start TIMESTAMP(3)," +
            "  window_end TIMESTAMP(3)," +
            "  pv_count BIGINT," +
            "  PRIMARY KEY (window_start, window_end) NOT ENFORCED" +
            ") WITH (" +
            "  'connector' = 'jdbc'," +
            "  'url' = 'jdbc:mysql://localhost:3306/flink_db'," +
            "  'table-name' = 'pv_count'," +
            "  'username' = 'root'," +
            "  'password' = 'password'" +
            ")"
        );

        // 执行 SQL 查询
        tableEnv.executeSql(
            "INSERT INTO pv_count " +
            "SELECT " +
            "  TUMBLE_START(ts, INTERVAL '1' HOUR) AS window_start," +
            "  TUMBLE_END(ts, INTERVAL '1' HOUR) AS window_end," +
            "  COUNT(*) AS pv_count " +
            "FROM user_behavior " +
            "WHERE behavior = 'pv' " +
            "GROUP BY TUMBLE(ts, INTERVAL '1' HOUR)"
        );
    }
}
```

### 窗口函数

```sql
-- 滚动窗口（Tumbling Window）
SELECT
    user_id,
    TUMBLE_START(ts, INTERVAL '1' HOUR) AS window_start,
    TUMBLE_END(ts, INTERVAL '1' HOUR) AS window_end,
    COUNT(*) AS cnt
FROM user_behavior
GROUP BY user_id, TUMBLE(ts, INTERVAL '1' HOUR);

-- 滑动窗口（Sliding Window）
SELECT
    user_id,
    HOP_START(ts, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_start,
    HOP_END(ts, INTERVAL '5' MINUTE, INTERVAL '1' HOUR) AS window_end,
    COUNT(*) AS cnt
FROM user_behavior
GROUP BY user_id, HOP(ts, INTERVAL '5' MINUTE, INTERVAL '1' HOUR);

-- 会话窗口（Session Window）
SELECT
    user_id,
    SESSION_START(ts, INTERVAL '30' MINUTE) AS session_start,
    SESSION_END(ts, INTERVAL '30' MINUTE) AS session_end,
    COUNT(*) AS cnt
FROM user_behavior
GROUP BY user_id, SESSION(ts, INTERVAL '30' MINUTE);

-- 累积窗口（Cumulate Window）- Flink 1.13+
SELECT
    user_id,
    window_start,
    window_end,
    SUM(amount) AS total_amount
FROM TABLE(
    CUMULATE(TABLE orders, DESCRIPTOR(order_time),
             INTERVAL '1' HOUR, INTERVAL '1' DAY)
)
GROUP BY user_id, window_start, window_end;
```

### 维表 Join

```java
// 创建维表
tableEnv.executeSql(
    "CREATE TABLE dim_product (" +
    "  product_id BIGINT," +
    "  product_name STRING," +
    "  category STRING," +
    "  price DECIMAL(10, 2)," +
    "  PRIMARY KEY (product_id) NOT ENFORCED" +
    ") WITH (" +
    "  'connector' = 'jdbc'," +
    "  'url' = 'jdbc:mysql://localhost:3306/flink_db'," +
    "  'table-name' = 'products'," +
    "  'lookup.cache.max-rows' = '5000'," +
    "  'lookup.cache.ttl' = '10min'" +
    ")"
);

// Lookup Join
tableEnv.executeSql(
    "SELECT " +
    "  o.order_id," +
    "  o.user_id," +
    "  p.product_name," +
    "  p.category," +
    "  o.amount " +
    "FROM orders AS o " +
    "JOIN dim_product FOR SYSTEM_TIME AS OF o.proctime AS p " +
    "ON o.product_id = p.product_id"
);
```

## 事件时间与处理时间

### 时间语义

Flink 支持三种时间语义：

```
+------------------+------------------------------------------+
|     时间类型      |                   说明                    |
+------------------+------------------------------------------+
| Event Time       | 事件发生的时间，由数据本身携带             |
| Processing Time  | 数据被处理的时间                          |
| Ingestion Time   | 数据进入 Flink 的时间                     |
+------------------+------------------------------------------+
```

### 事件时间处理

```java
import org.apache.flink.api.common.eventtime.*;
import org.apache.flink.streaming.api.windowing.time.Time;

public class EventTimeDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 定义数据类
        @Data
        @AllArgsConstructor
        public static class Event {
            private String userId;
            private String action;
            private long timestamp;
        }

        DataStream<Event> events = env.fromElements(
            new Event("user1", "click", 1000L),
            new Event("user2", "view", 2000L),
            new Event("user1", "purchase", 3000L)
        );

        // 分配时间戳和水位线
        DataStream<Event> withTimestamps = events
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                    .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
            );

        // 基于事件时间的窗口操作
        DataStream<Tuple2<String, Long>> result = withTimestamps
            .keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.seconds(10)))
            .aggregate(new CountAggregator());

        result.print();
        env.execute("Event Time Demo");
    }
}
```

### 处理时间处理

```java
public class ProcessingTimeDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<String> stream = env.socketTextStream("localhost", 9999);

        // 基于处理时间的窗口
        DataStream<Tuple2<String, Long>> result = stream
            .map(line -> Tuple2.of(line, 1L))
            .returns(Types.TUPLE(Types.STRING, Types.LONG))
            .keyBy(tuple -> tuple.f0)
            .window(TumblingProcessingTimeWindows.of(Time.seconds(10)))
            .sum(1);

        result.print();
        env.execute("Processing Time Demo");
    }
}
```

## Watermark 水位线

### 水位线概念

Watermark 是 Flink 处理事件时间的核心机制，用于处理乱序数据和触发窗口计算。

```
数据流（按事件时间）:
[Event(t=1)] [Event(t=4)] [Event(t=2)] [Event(t=7)] [Event(t=5)]
                              ↑
                          乱序数据

Watermark 表示：在此之前的所有数据都已到达
Watermark(t=W) 意味着不会再有 t < W 的事件到达

允许延迟 5 秒的水位线:
Event(t=7) 到达 → Watermark(7-5=2)
```

### Watermark 策略

```java
import org.apache.flink.api.common.eventtime.*;

public class WatermarkStrategies {

    // 1. 有序流的水位线（无延迟）
    WatermarkStrategy<Event> forMonotonous =
        WatermarkStrategy.forMonotonousTimestamps();

    // 2. 有界乱序的水位线（允许一定延迟）
    WatermarkStrategy<Event> forBoundedOutOfOrderness =
        WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp());

    // 3. 自定义水位线生成器
    WatermarkStrategy<Event> customStrategy =
        WatermarkStrategy
            .<Event>forGenerator(ctx -> new WatermarkGenerator<Event>() {
                private long maxTimestamp = Long.MIN_VALUE;
                private final long maxOutOfOrderness = 5000L;

                @Override
                public void onEvent(Event event, long eventTimestamp,
                                   WatermarkOutput output) {
                    maxTimestamp = Math.max(maxTimestamp, eventTimestamp);
                }

                @Override
                public void onPeriodicEmit(WatermarkOutput output) {
                    output.emitWatermark(
                        new Watermark(maxTimestamp - maxOutOfOrderness - 1)
                    );
                }
            })
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp());

    // 4. 处理空闲源的水位线
    WatermarkStrategy<Event> withIdleness =
        WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
            .withIdleness(Duration.ofMinutes(1)); // 1分钟无数据则标记为空闲
}
```

### 处理延迟数据

```java
public class LateDataHandling {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 定义侧输出标签用于延迟数据
        final OutputTag<Event> lateDataTag = new OutputTag<Event>("late-data"){};

        DataStream<Event> events = // ... 数据源

        SingleOutputStreamOperator<WindowResult> result = events
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                    .withTimestampAssigner((event, ts) -> event.getTimestamp())
            )
            .keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.minutes(1)))
            .allowedLateness(Time.minutes(1))  // 允许 1 分钟延迟
            .sideOutputLateData(lateDataTag)    // 超过延迟的数据输出到侧输出
            .aggregate(new MyAggregateFunction());

        // 获取延迟数据流
        DataStream<Event> lateData = result.getSideOutput(lateDataTag);

        // 处理延迟数据
        lateData.print("Late Data");

        env.execute("Late Data Handling");
    }
}
```

## 状态管理

### 状态类型

Flink 提供了多种状态类型来满足不同的需求：

```java
import org.apache.flink.api.common.state.*;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;

public class StateTypes extends KeyedProcessFunction<String, Event, String> {

    // 1. ValueState：存储单个值
    private ValueState<Long> countState;

    // 2. ListState：存储列表
    private ListState<Event> eventListState;

    // 3. MapState：存储键值对
    private MapState<String, Long> mapState;

    // 4. ReducingState：存储聚合结果
    private ReducingState<Long> sumState;

    // 5. AggregatingState：存储聚合结果（更灵活）
    private AggregatingState<Event, Double> avgState;

    @Override
    public void open(Configuration parameters) throws Exception {
        // 初始化 ValueState
        ValueStateDescriptor<Long> countDescriptor =
            new ValueStateDescriptor<>("count", Long.class);
        countState = getRuntimeContext().getState(countDescriptor);

        // 初始化 ListState
        ListStateDescriptor<Event> listDescriptor =
            new ListStateDescriptor<>("events", Event.class);
        eventListState = getRuntimeContext().getListState(listDescriptor);

        // 初始化 MapState
        MapStateDescriptor<String, Long> mapDescriptor =
            new MapStateDescriptor<>("userCounts", String.class, Long.class);
        mapState = getRuntimeContext().getMapState(mapDescriptor);

        // 初始化 ReducingState
        ReducingStateDescriptor<Long> reduceDescriptor =
            new ReducingStateDescriptor<>("sum", Long::sum, Long.class);
        sumState = getRuntimeContext().getReducingState(reduceDescriptor);

        // 设置状态 TTL（过期清理）
        StateTtlConfig ttlConfig = StateTtlConfig
            .newBuilder(Time.hours(1))
            .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
            .setStateVisibility(
                StateTtlConfig.StateVisibility.NeverReturnExpired
            )
            .build();

        countDescriptor.enableTimeToLive(ttlConfig);
    }

    @Override
    public void processElement(Event event, Context ctx,
                               Collector<String> out) throws Exception {
        // 使用 ValueState
        Long currentCount = countState.value();
        if (currentCount == null) {
            currentCount = 0L;
        }
        countState.update(currentCount + 1);

        // 使用 ListState
        eventListState.add(event);

        // 使用 MapState
        String action = event.getAction();
        Long actionCount = mapState.get(action);
        mapState.put(action, actionCount == null ? 1L : actionCount + 1);

        // 使用 ReducingState
        sumState.add(1L);

        out.collect("Processed: " + event);
    }
}
```

### Keyed State vs Operator State

```java
// Keyed State：与 Key 绑定，常用于 KeyedStream
public class KeyedStateExample extends KeyedProcessFunction<String, Event, String> {
    private ValueState<Long> countState;

    @Override
    public void open(Configuration parameters) {
        countState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("count", Long.class)
        );
    }

    @Override
    public void processElement(Event event, Context ctx,
                               Collector<String> out) throws Exception {
        Long count = countState.value();
        countState.update(count == null ? 1L : count + 1);
    }
}

// Operator State：与算子绑定，用于非 KeyedStream
public class OperatorStateExample
    implements SinkFunction<String>, CheckpointedFunction {

    private List<String> bufferedElements;
    private ListState<String> checkpointedState;

    @Override
    public void snapshotState(FunctionSnapshotContext context) throws Exception {
        checkpointedState.clear();
        for (String element : bufferedElements) {
            checkpointedState.add(element);
        }
    }

    @Override
    public void initializeState(FunctionInitializationContext context)
        throws Exception {
        ListStateDescriptor<String> descriptor =
            new ListStateDescriptor<>("buffered-elements", String.class);

        checkpointedState = context.getOperatorStateStore()
            .getListState(descriptor);

        if (context.isRestored()) {
            for (String element : checkpointedState.get()) {
                bufferedElements.add(element);
            }
        }
    }

    @Override
    public void invoke(String value, Context context) {
        bufferedElements.add(value);
        // 批量写入逻辑
    }
}
```

### 状态后端

```java
import org.apache.flink.contrib.streaming.state.EmbeddedRocksDBStateBackend;
import org.apache.flink.runtime.state.hashmap.HashMapStateBackend;

public class StateBackendConfig {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 1. HashMapStateBackend（内存存储，适合小状态）
        env.setStateBackend(new HashMapStateBackend());

        // 2. EmbeddedRocksDBStateBackend（磁盘存储，适合大状态）
        EmbeddedRocksDBStateBackend rocksDBBackend =
            new EmbeddedRocksDBStateBackend(true);  // 增量检查点
        rocksDBBackend.setDbStoragePath("file:///tmp/rocksdb");
        env.setStateBackend(rocksDBBackend);

        // 配置检查点存储
        env.getCheckpointConfig().setCheckpointStorage(
            "hdfs://namenode:8020/flink/checkpoints"
        );

        // 或者通过配置文件设置
        // state.backend: rocksdb
        // state.checkpoints.dir: hdfs://namenode:8020/flink/checkpoints
        // state.backend.incremental: true
    }
}
```

## Checkpoint 检查点

### 检查点机制

Checkpoint 是 Flink 实现容错的核心机制，通过定期保存状态快照来实现故障恢复。

```
                        Checkpoint 流程

Source → Map → KeyBy → Window → Sink
   ↓       ↓      ↓       ↓       ↓
   |-------|------|-------|-------|
         Barrier 传播

1. JobManager 触发 Checkpoint
2. Source 插入 Barrier
3. Barrier 随数据流传播
4. 算子收到所有输入的 Barrier 后保存状态
5. 所有算子完成后，Checkpoint 成功
```

### 检查点配置

```java
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.environment.CheckpointConfig;

public class CheckpointConfiguration {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 启用检查点，间隔 1 分钟
        env.enableCheckpointing(60000);

        CheckpointConfig config = env.getCheckpointConfig();

        // 设置检查点模式（精确一次 或 至少一次）
        config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);

        // 检查点超时时间
        config.setCheckpointTimeout(600000);  // 10 分钟

        // 最小检查点间隔
        config.setMinPauseBetweenCheckpoints(30000);  // 30 秒

        // 允许同时进行的检查点数量
        config.setMaxConcurrentCheckpoints(1);

        // 启用非对齐检查点（Flink 1.11+）
        config.enableUnalignedCheckpoints();

        // 设置检查点存储位置
        config.setCheckpointStorage("hdfs://namenode:8020/flink/checkpoints");

        // 外部化检查点（作业取消后保留）
        config.setExternalizedCheckpointCleanup(
            CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
        );

        // 容忍的检查点失败次数
        config.setTolerableCheckpointFailureNumber(3);

        // 启用增量检查点（仅 RocksDB）
        env.setStateBackend(new EmbeddedRocksDBStateBackend(true));
    }
}
```

### Savepoint 保存点

```bash
# 创建 Savepoint
flink savepoint <jobId> [savepointDirectory]

# 从 Savepoint 恢复作业
flink run -s <savepointPath> myJob.jar

# 取消作业并创建 Savepoint
flink cancel -s <savepointDirectory> <jobId>

# 停止作业（优雅停止，完成所有检查点）
flink stop --savepointPath <savepointDirectory> <jobId>
```

```java
// 代码中配置 Savepoint
env.getCheckpointConfig().setCheckpointStorage(
    "hdfs://namenode:8020/flink/savepoints"
);

// 使用 SavepointRestoreSettings 恢复
StreamExecutionEnvironment env =
    StreamExecutionEnvironment.getExecutionEnvironment();

// 通过 CLI 参数传递 savepoint 路径
// flink run -s hdfs://path/to/savepoint myJob.jar
```

### 端到端精确一次

```java
// 使用两阶段提交实现端到端精确一次
public class ExactlyOnceDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 启用检查点
        env.enableCheckpointing(60000);
        env.getCheckpointConfig().setCheckpointingMode(
            CheckpointingMode.EXACTLY_ONCE
        );

        // Kafka Source（支持精确一次读取）
        KafkaSource<String> source = KafkaSource.<String>builder()
            .setBootstrapServers("localhost:9092")
            .setTopics("input")
            .setGroupId("flink-group")
            .setValueOnlyDeserializer(new SimpleStringSchema())
            .build();

        DataStream<String> stream = env.fromSource(
            source,
            WatermarkStrategy.noWatermarks(),
            "Kafka Source"
        );

        // 处理数据
        DataStream<String> processed = stream.map(s -> s.toUpperCase());

        // Kafka Sink（支持精确一次写入）
        KafkaSink<String> sink = KafkaSink.<String>builder()
            .setBootstrapServers("localhost:9092")
            .setRecordSerializer(
                KafkaRecordSerializationSchema.builder()
                    .setTopic("output")
                    .setValueSerializationSchema(new SimpleStringSchema())
                    .build()
            )
            .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)  // 精确一次
            .setTransactionalIdPrefix("flink-kafka-")
            .build();

        processed.sinkTo(sink);

        env.execute("Exactly Once Demo");
    }
}
```

## 窗口操作

### 窗口类型

```java
import org.apache.flink.streaming.api.windowing.windows.*;
import org.apache.flink.streaming.api.windowing.assigners.*;

public class WindowTypes {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<Event> events = // ... 数据源

        // 1. 滚动窗口（Tumbling Window）
        // 固定大小，不重叠
        events.keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.hours(1)))
            .sum("amount");

        // 带偏移量的滚动窗口（如：每小时整点）
        events.keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(
                Time.hours(1),
                Time.minutes(15)  // 偏移 15 分钟
            ))
            .sum("amount");

        // 2. 滑动窗口（Sliding Window）
        // 固定大小，可重叠
        events.keyBy(Event::getUserId)
            .window(SlidingEventTimeWindows.of(
                Time.hours(1),   // 窗口大小
                Time.minutes(15) // 滑动步长
            ))
            .sum("amount");

        // 3. 会话窗口（Session Window）
        // 根据活动间隔动态确定
        events.keyBy(Event::getUserId)
            .window(EventTimeSessionWindows.withGap(Time.minutes(30)))
            .sum("amount");

        // 动态 Gap 的会话窗口
        events.keyBy(Event::getUserId)
            .window(EventTimeSessionWindows.withDynamicGap(
                (element) -> element.getType().equals("VIP")
                    ? 60 * 60 * 1000L  // VIP 用户 1 小时
                    : 30 * 60 * 1000L  // 普通用户 30 分钟
            ))
            .sum("amount");

        // 4. 全局窗口（Global Window）
        // 需要自定义触发器
        events.keyBy(Event::getUserId)
            .window(GlobalWindows.create())
            .trigger(CountTrigger.of(100))  // 每 100 个元素触发
            .sum("amount");

        // 5. 计数窗口（Count Window）
        events.keyBy(Event::getUserId)
            .countWindow(100)  // 滚动计数窗口
            .sum("amount");

        events.keyBy(Event::getUserId)
            .countWindow(100, 10)  // 滑动计数窗口
            .sum("amount");
    }
}
```

### 窗口函数

```java
import org.apache.flink.streaming.api.functions.windowing.*;
import org.apache.flink.api.common.functions.*;

public class WindowFunctions {

    // 1. ReduceFunction：增量聚合，效率高
    public static class SumReduce implements ReduceFunction<Event> {
        @Override
        public Event reduce(Event e1, Event e2) {
            return new Event(e1.getUserId(), e1.getAmount() + e2.getAmount());
        }
    }

    // 2. AggregateFunction：更灵活的增量聚合
    public static class AvgAggregate
        implements AggregateFunction<Event, Tuple2<Long, Long>, Double> {

        @Override
        public Tuple2<Long, Long> createAccumulator() {
            return Tuple2.of(0L, 0L);
        }

        @Override
        public Tuple2<Long, Long> add(Event event, Tuple2<Long, Long> acc) {
            return Tuple2.of(acc.f0 + event.getAmount(), acc.f1 + 1);
        }

        @Override
        public Double getResult(Tuple2<Long, Long> acc) {
            return acc.f1 == 0 ? 0.0 : (double) acc.f0 / acc.f1;
        }

        @Override
        public Tuple2<Long, Long> merge(Tuple2<Long, Long> a,
                                        Tuple2<Long, Long> b) {
            return Tuple2.of(a.f0 + b.f0, a.f1 + b.f1);
        }
    }

    // 3. ProcessWindowFunction：访问完整窗口数据和元数据
    public static class MyProcessWindowFunction
        extends ProcessWindowFunction<Event, String, String, TimeWindow> {

        @Override
        public void process(String key, Context context,
                           Iterable<Event> events, Collector<String> out) {
            long count = 0;
            for (Event event : events) {
                count++;
            }

            TimeWindow window = context.window();
            out.collect(String.format(
                "Key: %s, Window: [%d, %d), Count: %d",
                key, window.getStart(), window.getEnd(), count
            ));
        }
    }

    // 4. 组合使用：增量聚合 + ProcessWindowFunction
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<Event> events = // ...

        events.keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.hours(1)))
            .aggregate(
                new AvgAggregate(),
                new ProcessWindowFunction<Double, String, String, TimeWindow>() {
                    @Override
                    public void process(String key, Context ctx,
                                       Iterable<Double> values,
                                       Collector<String> out) {
                        Double avg = values.iterator().next();
                        out.collect(String.format(
                            "Key: %s, Window: %s, Avg: %.2f",
                            key, ctx.window(), avg
                        ));
                    }
                }
            );
    }
}
```

### 触发器与驱逐器

```java
import org.apache.flink.streaming.api.windowing.triggers.*;
import org.apache.flink.streaming.api.windowing.evictors.*;

public class TriggersAndEvictors {

    // 自定义触发器
    public static class CountTriggerWithTimeout
        extends Trigger<Event, TimeWindow> {

        private final long maxCount;

        public CountTriggerWithTimeout(long maxCount) {
            this.maxCount = maxCount;
        }

        @Override
        public TriggerResult onElement(Event element, long timestamp,
                                       TimeWindow window, TriggerContext ctx) {
            ReducingState<Long> count = ctx.getPartitionedState(
                new ReducingStateDescriptor<>("count", Long::sum, Long.class)
            );
            count.add(1L);

            if (count.get() >= maxCount) {
                count.clear();
                return TriggerResult.FIRE_AND_PURGE;
            }
            return TriggerResult.CONTINUE;
        }

        @Override
        public TriggerResult onProcessingTime(long time, TimeWindow window,
                                              TriggerContext ctx) {
            return TriggerResult.FIRE_AND_PURGE;
        }

        @Override
        public TriggerResult onEventTime(long time, TimeWindow window,
                                         TriggerContext ctx) {
            return time == window.maxTimestamp()
                ? TriggerResult.FIRE_AND_PURGE
                : TriggerResult.CONTINUE;
        }

        @Override
        public void clear(TimeWindow window, TriggerContext ctx) {
            ctx.getPartitionedState(
                new ReducingStateDescriptor<>("count", Long::sum, Long.class)
            ).clear();
        }
    }

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<Event> events = // ...

        // 使用自定义触发器
        events.keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.hours(1)))
            .trigger(new CountTriggerWithTimeout(1000))
            .sum("amount");

        // 使用内置触发器
        events.keyBy(Event::getUserId)
            .window(GlobalWindows.create())
            .trigger(CountTrigger.of(100))
            .trigger(ProcessingTimeTrigger.create())
            .trigger(PurgingTrigger.of(CountTrigger.of(100)))
            .sum("amount");

        // 使用驱逐器
        events.keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.hours(1)))
            .evictor(CountEvictor.of(1000))  // 只保留最近 1000 个
            .evictor(TimeEvictor.of(Time.minutes(5)))  // 只保留最近 5 分钟
            .sum("amount");
    }
}
```

## 高级特性

### 异步 I/O

```java
import org.apache.flink.streaming.api.functions.async.*;
import java.util.concurrent.CompletableFuture;

public class AsyncIODemo {

    // 异步函数实现
    public static class AsyncDatabaseRequest
        extends RichAsyncFunction<String, Tuple2<String, String>> {

        private transient DatabaseClient client;

        @Override
        public void open(Configuration parameters) throws Exception {
            client = new DatabaseClient();
        }

        @Override
        public void asyncInvoke(String key,
                                ResultFuture<Tuple2<String, String>> resultFuture) {
            // 异步查询数据库
            CompletableFuture<String> result = client.asyncGet(key);

            result.whenComplete((value, error) -> {
                if (error != null) {
                    resultFuture.completeExceptionally(error);
                } else {
                    resultFuture.complete(
                        Collections.singleton(Tuple2.of(key, value))
                    );
                }
            });
        }

        @Override
        public void timeout(String key,
                           ResultFuture<Tuple2<String, String>> resultFuture) {
            resultFuture.complete(
                Collections.singleton(Tuple2.of(key, "TIMEOUT"))
            );
        }

        @Override
        public void close() throws Exception {
            client.close();
        }
    }

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<String> stream = // ...

        // 有序异步 I/O
        DataStream<Tuple2<String, String>> resultOrdered =
            AsyncDataStream.orderedWait(
                stream,
                new AsyncDatabaseRequest(),
                1000,  // 超时时间（毫秒）
                TimeUnit.MILLISECONDS,
                100    // 最大并发请求数
            );

        // 无序异步 I/O（更高效）
        DataStream<Tuple2<String, String>> resultUnordered =
            AsyncDataStream.unorderedWait(
                stream,
                new AsyncDatabaseRequest(),
                1000,
                TimeUnit.MILLISECONDS,
                100
            );
    }
}
```

### 广播状态模式

```java
import org.apache.flink.streaming.api.functions.co.*;
import org.apache.flink.api.common.state.MapStateDescriptor;

public class BroadcastStateDemo {

    // 定义广播状态描述符
    private static final MapStateDescriptor<String, Rule> ruleStateDescriptor =
        new MapStateDescriptor<>("rules", String.class, Rule.class);

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 数据流
        DataStream<Event> eventStream = // ...

        // 规则流（将被广播）
        DataStream<Rule> ruleStream = // ...

        // 将规则流广播
        BroadcastStream<Rule> broadcastRules =
            ruleStream.broadcast(ruleStateDescriptor);

        // 连接数据流和广播流
        DataStream<Alert> alerts = eventStream
            .keyBy(Event::getUserId)
            .connect(broadcastRules)
            .process(new RuleEvaluator());
    }

    // 处理函数
    public static class RuleEvaluator
        extends KeyedBroadcastProcessFunction<String, Event, Rule, Alert> {

        @Override
        public void processElement(Event event, ReadOnlyContext ctx,
                                   Collector<Alert> out) throws Exception {
            // 读取广播状态
            ReadOnlyBroadcastState<String, Rule> rules =
                ctx.getBroadcastState(ruleStateDescriptor);

            // 应用规则
            for (Map.Entry<String, Rule> entry : rules.immutableEntries()) {
                Rule rule = entry.getValue();
                if (rule.matches(event)) {
                    out.collect(new Alert(event, rule));
                }
            }
        }

        @Override
        public void processBroadcastElement(Rule rule, Context ctx,
                                            Collector<Alert> out)
            throws Exception {
            // 更新广播状态
            BroadcastState<String, Rule> rules =
                ctx.getBroadcastState(ruleStateDescriptor);
            rules.put(rule.getId(), rule);
        }
    }
}
```

### CEP 复杂事件处理

```java
import org.apache.flink.cep.*;
import org.apache.flink.cep.pattern.*;
import org.apache.flink.cep.pattern.conditions.*;

public class CEPDemo {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<LoginEvent> loginEvents = // ...

        // 定义模式：同一用户 5 秒内连续 3 次登录失败
        Pattern<LoginEvent, ?> loginFailPattern = Pattern
            .<LoginEvent>begin("firstFail")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return event.getType().equals("fail");
                }
            })
            .next("secondFail")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return event.getType().equals("fail");
                }
            })
            .next("thirdFail")
            .where(new SimpleCondition<LoginEvent>() {
                @Override
                public boolean filter(LoginEvent event) {
                    return event.getType().equals("fail");
                }
            })
            .within(Time.seconds(5));

        // 将模式应用到流上
        PatternStream<LoginEvent> patternStream = CEP.pattern(
            loginEvents.keyBy(LoginEvent::getUserId),
            loginFailPattern
        );

        // 检测匹配的模式
        DataStream<Alert> alerts = patternStream.select(
            new PatternSelectFunction<LoginEvent, Alert>() {
                @Override
                public Alert select(Map<String, List<LoginEvent>> pattern) {
                    LoginEvent first = pattern.get("firstFail").get(0);
                    return new Alert(
                        first.getUserId(),
                        "连续3次登录失败",
                        first.getTimestamp()
                    );
                }
            }
        );

        // 更复杂的模式
        Pattern<Event, ?> complexPattern = Pattern
            .<Event>begin("start")
            .where(new SimpleCondition<Event>() {
                @Override
                public boolean filter(Event event) {
                    return event.getAction().equals("add_to_cart");
                }
            })
            .followedBy("middle")
            .where(new IterativeCondition<Event>() {
                @Override
                public boolean filter(Event event, Context<Event> ctx) {
                    return event.getAction().equals("remove_from_cart");
                }
            })
            .oneOrMore()
            .greedy()
            .followedBy("end")
            .where(new SimpleCondition<Event>() {
                @Override
                public boolean filter(Event event) {
                    return event.getAction().equals("purchase");
                }
            })
            .within(Time.hours(1));

        alerts.print();
        env.execute("CEP Demo");
    }
}
```

## 生产部署

### 部署模式

```bash
# Standalone 模式
# 启动集群
./bin/start-cluster.sh

# 提交作业
./bin/flink run -c com.example.MyJob myJob.jar

# YARN 模式
# Session 模式（共享集群）
./bin/yarn-session.sh -n 4 -jm 2048m -tm 4096m -s 2

# Per-Job 模式（独立集群）
./bin/flink run -m yarn-cluster -c com.example.MyJob myJob.jar

# Application 模式（Flink 1.11+）
./bin/flink run-application -t yarn-application -c com.example.MyJob myJob.jar

# Kubernetes 模式
# Native Kubernetes
./bin/flink run-application \
    -t kubernetes-application \
    -Dkubernetes.cluster-id=my-flink-cluster \
    -Dkubernetes.container.image=flink:1.17 \
    -Dkubernetes.namespace=flink \
    local:///opt/flink/myJob.jar
```

### 资源配置

```yaml
# flink-conf.yaml 关键配置

# JobManager 配置
jobmanager.memory.process.size: 4096m
jobmanager.memory.heap.size: 2048m

# TaskManager 配置
taskmanager.memory.process.size: 8192m
taskmanager.memory.framework.heap.size: 128m
taskmanager.memory.task.heap.size: 4096m
taskmanager.memory.managed.size: 2048m
taskmanager.memory.network.fraction: 0.1
taskmanager.numberOfTaskSlots: 4

# 并行度
parallelism.default: 4

# 状态后端
state.backend: rocksdb
state.checkpoints.dir: hdfs://namenode:8020/flink/checkpoints
state.savepoints.dir: hdfs://namenode:8020/flink/savepoints
state.backend.incremental: true

# 检查点
execution.checkpointing.interval: 60000
execution.checkpointing.mode: EXACTLY_ONCE
execution.checkpointing.timeout: 600000
execution.checkpointing.min-pause: 30000
execution.checkpointing.max-concurrent-checkpoints: 1
execution.checkpointing.externalized-checkpoint-retention: RETAIN_ON_CANCELLATION

# 重启策略
restart-strategy: fixed-delay
restart-strategy.fixed-delay.attempts: 3
restart-strategy.fixed-delay.delay: 10s

# 高可用
high-availability: zookeeper
high-availability.zookeeper.quorum: zk1:2181,zk2:2181,zk3:2181
high-availability.zookeeper.path.root: /flink
high-availability.storageDir: hdfs://namenode:8020/flink/ha
```

### 监控与告警

```java
import org.apache.flink.metrics.*;

public class MetricsDemo extends RichMapFunction<String, String> {

    private transient Counter counter;
    private transient Meter meter;
    private transient Histogram histogram;
    private transient Gauge<Integer> gauge;

    @Override
    public void open(Configuration parameters) throws Exception {
        // 计数器
        counter = getRuntimeContext()
            .getMetricGroup()
            .counter("myCounter");

        // 吞吐量计量器
        meter = getRuntimeContext()
            .getMetricGroup()
            .meter("myMeter", new MeterView(60));

        // 直方图
        histogram = getRuntimeContext()
            .getMetricGroup()
            .histogram("myHistogram", new DescriptiveStatisticsHistogram(1000));

        // 仪表盘
        getRuntimeContext()
            .getMetricGroup()
            .gauge("myGauge", () -> queueSize);
    }

    @Override
    public String map(String value) throws Exception {
        counter.inc();
        meter.markEvent();

        long startTime = System.currentTimeMillis();
        String result = process(value);
        histogram.update(System.currentTimeMillis() - startTime);

        return result;
    }
}
```

```yaml
# Prometheus 监控配置
metrics.reporters: prometheus
metrics.reporter.prometheus.class: org.apache.flink.metrics.prometheus.PrometheusReporter
metrics.reporter.prometheus.port: 9249

# 或使用 PushGateway
metrics.reporter.promgateway.class: org.apache.flink.metrics.prometheus.PrometheusPushGatewayReporter
metrics.reporter.promgateway.host: prometheus-pushgateway
metrics.reporter.promgateway.port: 9091
metrics.reporter.promgateway.jobName: flink-metrics
metrics.reporter.promgateway.randomJobNameSuffix: true
metrics.reporter.promgateway.deleteOnShutdown: false
```

## 性能调优

### 常见优化策略

```java
public class PerformanceOptimization {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        // 1. 合理设置并行度
        env.setParallelism(16);  // 全局并行度

        DataStream<Event> events = // ...

        // 算子级别并行度
        events
            .keyBy(Event::getUserId)
            .process(new ExpensiveFunction())
            .setParallelism(32)  // 增加计算密集型算子的并行度
            .addSink(new MySink())
            .setParallelism(8);  // 减少 I/O 密集型算子的并行度

        // 2. 禁用算子链（用于调试）
        env.disableOperatorChaining();

        // 或选择性禁用
        events
            .map(e -> e).disableChaining()  // 开始新链
            .filter(e -> true).startNewChain()  // 开始新链
            .keyBy(Event::getUserId)
            .process(new MyFunction()).slotSharingGroup("compute");  // 独立资源组

        // 3. 使用对象复用
        env.getConfig().enableObjectReuse();

        // 4. 配置网络缓冲
        // taskmanager.memory.network.fraction: 0.1
        // taskmanager.memory.network.min: 64mb
        // taskmanager.memory.network.max: 1gb

        // 5. 选择合适的序列化器
        env.getConfig().registerTypeWithKryoSerializer(
            MyClass.class,
            MySerializer.class
        );

        // 使用 POJO 或 Avro 优化序列化
        env.getConfig().registerPojoType(MyPojo.class);
    }
}
```

### 反压处理

```
反压检测方法：
1. Flink Web UI：查看 backpressure 标签
2. 指标监控：
   - buffers.inPoolUsage
   - buffers.outPoolUsage

反压原因分析：
1. 数据倾斜
2. 算子处理能力不足
3. Sink 写入瓶颈
4. GC 问题
5. 检查点阻塞
```

```java
// 处理数据倾斜
public class SkewHandling {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env =
            StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<Event> events = // ...

        // 方法1：增加随机前缀打散热点 Key
        DataStream<Tuple2<String, Long>> result = events
            .map(e -> {
                String newKey = e.getUserId() + "_" +
                    ThreadLocalRandom.current().nextInt(10);
                return Tuple2.of(newKey, e.getAmount());
            })
            .keyBy(t -> t.f0)
            .sum(1)
            .map(t -> {
                String originalKey = t.f0.split("_")[0];
                return Tuple2.of(originalKey, t.f1);
            })
            .keyBy(t -> t.f0)
            .sum(1);

        // 方法2：本地预聚合
        events
            .keyBy(Event::getUserId)
            .process(new LocalAggregator())  // 本地预聚合
            .keyBy(t -> t.f0)
            .reduce((t1, t2) -> Tuple2.of(t1.f0, t1.f1 + t2.f1));

        // 方法3：使用侧输出分流
        final OutputTag<Event> hotKeyTag = new OutputTag<Event>("hot-key"){};

        SingleOutputStreamOperator<Event> mainStream = events
            .process(new ProcessFunction<Event, Event>() {
                @Override
                public void processElement(Event event, Context ctx,
                                          Collector<Event> out) {
                    if (isHotKey(event.getUserId())) {
                        ctx.output(hotKeyTag, event);
                    } else {
                        out.collect(event);
                    }
                }
            });

        // 热点 Key 单独处理
        DataStream<Event> hotKeyStream = mainStream.getSideOutput(hotKeyTag);
    }
}
```

## 面试要点

### Flink 与 Spark Streaming 的区别

| 特性 | Flink | Spark Streaming |
|------|-------|-----------------|
| 处理模型 | 真正的流处理（逐条） | 微批处理 |
| 延迟 | 毫秒级 | 秒级 |
| 语义保证 | 精确一次 | 精确一次（需配置） |
| 状态管理 | 原生支持，功能强大 | 依赖外部系统 |
| 事件时间 | 原生支持 | 需额外配置 |
| 窗口支持 | 丰富灵活 | 相对简单 |
| SQL 支持 | 流批统一 | 分离 |

### Flink 如何保证精确一次语义？

```
1. 分布式快照（Checkpoint）
   - 基于 Chandy-Lamport 算法
   - 通过 Barrier 同步状态

2. 端到端精确一次
   - Source：可重放（如 Kafka Offset）
   - 处理：Checkpoint 保证
   - Sink：两阶段提交/幂等写入

3. 两阶段提交流程
   - 预提交：Checkpoint 时写入但不提交
   - 提交：Checkpoint 成功后真正提交
   - 回滚：Checkpoint 失败时回滚
```

### Watermark 原理与应用

```java
// Watermark 是流处理中处理乱序事件的核心机制
// Watermark(t) 表示：t 之前的所有事件都已到达

// 关键配置
// 1. 最大乱序时间：根据业务数据特点设置
// 2. 空闲检测：处理某些分区长时间无数据的情况
// 3. 延迟数据处理：allowedLateness + 侧输出

WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
    .withTimestampAssigner((event, ts) -> event.getTimestamp())
    .withIdleness(Duration.ofMinutes(1));
```

### Flink 状态管理最佳实践

```java
// 1. 选择合适的状态后端
// - 小状态：HashMapStateBackend
// - 大状态：EmbeddedRocksDBStateBackend

// 2. 合理设置 TTL
StateTtlConfig.newBuilder(Time.days(7))
    .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
    .cleanupFullSnapshot()
    .build();

// 3. 增量检查点（RocksDB）
new EmbeddedRocksDBStateBackend(true);

// 4. 本地恢复加速
// state.backend.local-recovery: true
```

### Checkpoint 调优

```yaml
# 关键参数
execution.checkpointing.interval: 60000  # 检查点间隔
execution.checkpointing.timeout: 600000  # 超时时间
execution.checkpointing.min-pause: 30000  # 最小间隔

# 优化建议
# 使用增量检查点
state.backend.incremental: true

# 开启本地恢复
state.backend.local-recovery: true

# 使用非对齐检查点（减少反压影响）
execution.checkpointing.unaligned: true

# 合理设置检查点存储
state.checkpoints.dir: hdfs://...
state.checkpoints.num-retained: 3
```

### 常见问题排查

```
1. 反压问题
   - 检查 Web UI 的 backpressure 指标
   - 分析算子处理能力
   - 检查数据倾斜

2. Checkpoint 失败
   - 检查超时配置
   - 分析状态大小
   - 检查存储系统性能

3. 内存问题
   - 调整 taskmanager.memory 配置
   - 检查状态大小
   - 使用 RocksDB 状态后端

4. 延迟高
   - 分析处理链路
   - 检查网络配置
   - 优化序列化
```

## 延伸阅读

### 官方资源

- [Apache Flink 官方文档](https://flink.apache.org/docs/stable/)
- [Flink 中文社区](https://flink-learning.org.cn/)
- [Flink Forward 大会](https://www.flink-forward.org/)

### 推荐书籍

- **《Stream Processing with Apache Flink》** - Fabian Hueske
- **《Flink 原理、实战与性能优化》** - 张利兵
- **《Apache Flink 实战》** - 官方团队

### 相关技术

- **Apache Kafka**：消息队列，常与 Flink 配合使用
- **Apache Iceberg**：数据湖表格式
- **Flink CDC**：变更数据捕获
- **Flink ML**：机器学习库

### 实践项目

- 实时数据仓库 ETL
- 实时用户行为分析
- 实时风控系统
- 实时推荐引擎
- 物联网数据处理

---

Apache Flink 是实时计算领域的领先技术，其独特的流处理模型和强大的状态管理能力使其成为构建低延迟、高吞吐数据处理应用的首选。通过本指南的学习，你应该能够：理解 Flink 的核心架构、掌握 DataStream 和 Table API、正确处理事件时间和水位线、实现可靠的状态管理和检查点、以及优化生产环境的部署配置。建议结合实际项目深入实践，不断积累经验。
