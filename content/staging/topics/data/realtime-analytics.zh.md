---
title: 实时分析架构设计
description: 设计和实现可扩展的实时分析系统 - 从数据摄入到可视化，包括 Kafka、Flink、ClickHouse 等技术
track: data
section: analytics-engines
difficulty: advanced
tags:
  - 实时分析
  - 流处理
  - 数据架构
  - Kafka
  - Flink
  - ClickHouse
  - OLAP
status: imported
origin: old/src/content/docs/data/realtime-analytics.zh.md
divergence: 0.217
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Data
  subcategory: ""
  order: 20
  lastUpdated: 2026-01-22
---

实时分析使组织能够在数据到达时立即获得洞察，支持从欺诈检测到实时仪表板等用例。本指南涵盖构建可扩展实时分析系统的架构模式、技术选型和实施策略，这些系统能够以亚秒级延迟处理每秒数百万个事件。

## 概念解释

### 什么是实时分析？

**实时分析** 是在数据可用时立即分析的实践，实现即时洞察和自动响应。与定期处理历史数据的批处理分析不同，实时分析在流数据上运行，延迟要求从毫秒到分钟不等。

```
┌─────────────────────────────────────────────────────────────────┐
│                      实时分析架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  数据源                   摄入                   处理            │
│  ┌─────────────┐          ┌─────────┐          ┌─────────┐     │
│  │ Web/移动    │─────────▶│         │          │         │     │
│  │   事件      │          │         │          │         │     │
│  └─────────────┘          │         │          │         │     │
│  ┌─────────────┐          │  Kafka  │─────────▶│  Flink  │     │
│  │   IoT       │─────────▶│  Kinesis│          │  Spark  │     │
│  │   设备      │          │  Pulsar │          │         │     │
│  └─────────────┘          │         │          │         │     │
│  ┌─────────────┐          │         │          │         │     │
│  │  数据库     │─────────▶│         │          │         │     │
│  │   (CDC)     │          └─────────┘          └────┬────┘     │
│  └─────────────┘                                    │          │
│                                                     ▼          │
│  存储                     服务                   可视化        │
│  ┌─────────────┐         ┌─────────┐          ┌─────────┐     │
│  │ ClickHouse  │◀────────│  Redis  │          │ Grafana │     │
│  │   Druid     │         │  缓存   │─────────▶│ Superset│     │
│  │   Pinot     │         │         │          │ Tableau │     │
│  └─────────────┘         └─────────┘          └─────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 实时 vs 准实时 vs 批处理

| 处理类型 | 延迟 | 用例 | 技术 |
|----------|------|------|------|
| **实时** | < 100ms | 欺诈检测、告警 | Flink, Kafka Streams |
| **准实时** | 100ms - 5分钟 | 仪表板、推荐 | Spark Streaming, ksqlDB |
| **批处理** | 小时 - 天 | 报表、ML 训练 | Spark, Hive, Trino |

### Lambda vs Kappa 架构

```
Lambda 架构（批处理 + 速度层）：
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                      ┌─────────────────┐                        │
│                      │    批处理层     │                        │
│           ┌─────────▶│   （历史）      │─────┐                  │
│           │          └─────────────────┘     │                  │
│  ┌────────┴───┐                              ▼                  │
│  │   数据     │                      ┌──────────────┐          │
│  │    源      │                      │   服务层     │          │
│  └────────┬───┘                      │              │          │
│           │          ┌─────────────────┐     │                  │
│           └─────────▶│    速度层      │─────┘                  │
│                      │   （实时）      │                        │
│                      └─────────────────┘                        │
│                                                                  │
│  优点：容错、可重处理                                            │
│  缺点：复杂、双代码库维护                                        │
└─────────────────────────────────────────────────────────────────┘

Kappa 架构（仅流）：
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────┐    ┌─────────────────┐    ┌──────────────┐     │
│  │   数据     │───▶│     流处理层    │───▶│   服务层     │     │
│  │    源      │    │  （所有处理）    │    │              │     │
│  └────────────┘    └─────────────────┘    └──────────────┘     │
│                            │                                     │
│                            ▼                                     │
│                    ┌─────────────────┐                          │
│                    │     重处理      │                          │
│                    │   （重放日志）   │                          │
│                    └─────────────────┘                          │
│                                                                  │
│  优点：更简单、单一代码库                                        │
│  缺点：需要可重放日志、更高的流存储                              │
└─────────────────────────────────────────────────────────────────┘
```

## 核心原理

### 1. 数据摄入层

```python
# 用于事件摄入的 Kafka 生产者
from confluent_kafka import Producer
import json
import time

class EventProducer:
    def __init__(self, bootstrap_servers: str):
        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'client.id': 'analytics-producer',
            'acks': 'all',  # 等待所有副本
            'retries': 3,
            'retry.backoff.ms': 1000,
            'compression.type': 'lz4',
            'batch.size': 16384,
            'linger.ms': 5,  # 最多等待 5ms 进行批处理
        })

    def delivery_callback(self, err, msg):
        if err:
            print(f'消息投递失败: {err}')
        else:
            print(f'消息投递到 {msg.topic()} [{msg.partition()}]')

    def send_event(self, topic: str, event: dict, key: str = None):
        """发送事件到 Kafka topic。"""
        try:
            self.producer.produce(
                topic=topic,
                key=key.encode('utf-8') if key else None,
                value=json.dumps(event).encode('utf-8'),
                callback=self.delivery_callback
            )
            self.producer.poll(0)  # 触发回调
        except BufferError:
            print('缓冲区已满，等待中...')
            self.producer.poll(1)
            self.send_event(topic, event, key)

    def flush(self):
        self.producer.flush()

# 使用
producer = EventProducer('kafka:9092')

# 发送点击流事件
event = {
    'event_type': 'page_view',
    'user_id': 'user123',
    'page_url': '/products/123',
    'timestamp': int(time.time() * 1000),
    'session_id': 'sess_abc',
    'device': 'mobile',
    'country': 'CN'
}

producer.send_event('clickstream', event, key=event['user_id'])
producer.flush()
```

### 2. 流处理层

```java
// Apache Flink 实时分析作业
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;

public class RealTimeAnalyticsJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 启用检查点以实现精确一次处理
        env.enableCheckpointing(60000);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);

        // Kafka 源
        Properties kafkaProps = new Properties();
        kafkaProps.setProperty("bootstrap.servers", "kafka:9092");
        kafkaProps.setProperty("group.id", "analytics-consumer");

        FlinkKafkaConsumer<ClickEvent> consumer = new FlinkKafkaConsumer<>(
            "clickstream",
            new ClickEventDeserializer(),
            kafkaProps
        );
        consumer.setStartFromLatest();

        DataStream<ClickEvent> events = env.addSource(consumer);

        // 实时聚合
        DataStream<PageViewMetric> pageViews = events
            .filter(e -> e.getEventType().equals("page_view"))
            .keyBy(ClickEvent::getPageUrl)
            .window(TumblingEventTimeWindows.of(Time.minutes(1)))
            .aggregate(new PageViewAggregator());

        // 会话分析
        DataStream<SessionMetric> sessions = events
            .keyBy(ClickEvent::getSessionId)
            .window(EventTimeSessionWindows.withGap(Time.minutes(30)))
            .process(new SessionAnalyzer());

        // 漏斗分析
        DataStream<FunnelMetric> funnels = events
            .keyBy(ClickEvent::getUserId)
            .process(new FunnelProcessor());

        // 输出到多个 sink
        pageViews.addSink(new ClickHouseSink<>("page_views"));
        sessions.addSink(new ClickHouseSink<>("sessions"));
        funnels.addSink(new ClickHouseSink<>("funnels"));

        env.execute("实时分析");
    }
}

// 页面浏览聚合器
public class PageViewAggregator implements AggregateFunction<ClickEvent, PageViewAccumulator, PageViewMetric> {
    @Override
    public PageViewAccumulator createAccumulator() {
        return new PageViewAccumulator();
    }

    @Override
    public PageViewAccumulator add(ClickEvent event, PageViewAccumulator acc) {
        acc.count++;
        acc.uniqueUsers.add(event.getUserId());
        acc.totalLoadTime += event.getLoadTime();
        return acc;
    }

    @Override
    public PageViewMetric getResult(PageViewAccumulator acc) {
        return new PageViewMetric(
            acc.count,
            acc.uniqueUsers.size(),
            acc.totalLoadTime / acc.count
        );
    }

    @Override
    public PageViewAccumulator merge(PageViewAccumulator a, PageViewAccumulator b) {
        a.count += b.count;
        a.uniqueUsers.addAll(b.uniqueUsers);
        a.totalLoadTime += b.totalLoadTime;
        return a;
    }
}
```

### 3. 实时 OLAP 存储

```sql
-- ClickHouse 实时分析 schema
CREATE DATABASE analytics;

-- 带高效分区的事件表
CREATE TABLE analytics.events (
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),
    user_id String,
    session_id String,
    page_url String,
    referrer String,
    device LowCardinality(String),
    country LowCardinality(String),
    event_time DateTime64(3),
    properties Map(String, String),
    event_date Date MATERIALIZED toDate(event_time)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time)
TTL event_date + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

-- 实时页面浏览指标的物化视图
CREATE MATERIALIZED VIEW analytics.page_views_mv
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMMDD(event_date)
ORDER BY (event_date, page_url, hour)
AS SELECT
    toDate(event_time) as event_date,
    toStartOfHour(event_time) as hour,
    page_url,
    count() as page_views,
    uniqExact(user_id) as unique_users,
    uniqExact(session_id) as unique_sessions,
    countIf(device = 'mobile') as mobile_views,
    countIf(device = 'desktop') as desktop_views
FROM analytics.events
WHERE event_type = 'page_view'
GROUP BY event_date, hour, page_url;

-- 漏斗分析的物化视图
CREATE MATERIALIZED VIEW analytics.funnel_mv
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMMDD(event_date)
ORDER BY (event_date, user_id)
AS SELECT
    toDate(event_time) as event_date,
    user_id,
    groupArrayState(event_type) as event_sequence,
    minState(event_time) as first_event,
    maxState(event_time) as last_event
FROM analytics.events
GROUP BY event_date, user_id;

-- 实时仪表板查询
SELECT
    toStartOfHour(event_time) as hour,
    count() as events,
    uniqExact(user_id) as users,
    uniqExact(session_id) as sessions,
    countIf(event_type = 'purchase') as purchases,
    sumIf(toFloat64(properties['amount']), event_type = 'purchase') as revenue
FROM analytics.events
WHERE event_time >= now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour;

-- 漏斗查询
SELECT
    countIf(has(event_sequence, 'page_view')) as step1_view,
    countIf(has(event_sequence, 'add_to_cart')) as step2_cart,
    countIf(has(event_sequence, 'checkout')) as step3_checkout,
    countIf(has(event_sequence, 'purchase')) as step4_purchase,
    step2_cart / step1_view as cart_rate,
    step3_checkout / step2_cart as checkout_rate,
    step4_purchase / step3_checkout as purchase_rate
FROM (
    SELECT user_id, groupArray(event_type) as event_sequence
    FROM analytics.events
    WHERE event_date = today()
    GROUP BY user_id
);
```

## 关键概念

### 1. 窗口策略

```java
// Flink 中的不同窗口类型
import org.apache.flink.streaming.api.windowing.assigners.*;
import org.apache.flink.streaming.api.windowing.time.Time;

// 滚动窗口：固定大小，不重叠
DataStream<Metric> tumblingResult = events
    .keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new MetricAggregator());

// 滑动窗口：固定大小，重叠
DataStream<Metric> slidingResult = events
    .keyBy(Event::getKey)
    .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(1)))
    .aggregate(new MetricAggregator());

// 会话窗口：基于间隙的动态大小
DataStream<SessionMetric> sessionResult = events
    .keyBy(Event::getSessionId)
    .window(EventTimeSessionWindows.withGap(Time.minutes(30)))
    .process(new SessionWindowFunction());

// 带允许延迟的自定义窗口
DataStream<Metric> withLateness = events
    .keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .allowedLateness(Time.minutes(1))
    .sideOutputLateData(lateOutputTag)
    .aggregate(new MetricAggregator());
```

### 2. 状态管理

```java
// 用于用户行为跟踪的有状态处理
public class UserBehaviorTracker extends KeyedProcessFunction<String, Event, Alert> {
    private ValueState<UserState> userState;
    private MapState<String, Long> eventCounts;
    private ListState<Event> recentEvents;

    @Override
    public void open(Configuration parameters) {
        userState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("user-state", UserState.class));

        eventCounts = getRuntimeContext().getMapState(
            new MapStateDescriptor<>("event-counts", String.class, Long.class));

        ListStateDescriptor<Event> recentEventsDesc =
            new ListStateDescriptor<>("recent-events", Event.class);
        recentEventsDesc.enableTimeToLive(StateTtlConfig.newBuilder(Time.hours(24))
            .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
            .build());
        recentEvents = getRuntimeContext().getListState(recentEventsDesc);
    }

    @Override
    public void processElement(Event event, Context ctx, Collector<Alert> out) throws Exception {
        // 更新用户状态
        UserState state = userState.value();
        if (state == null) {
            state = new UserState(event.getUserId());
        }
        state.updateLastSeen(event.getTimestamp());
        state.incrementEventCount();
        userState.update(state);

        // 更新事件计数
        String eventType = event.getEventType();
        Long count = eventCounts.get(eventType);
        eventCounts.put(eventType, count == null ? 1 : count + 1);

        // 添加到最近事件
        recentEvents.add(event);

        // 检查异常
        if (isAnomalous(event, state)) {
            out.collect(new Alert(event.getUserId(), "检测到异常行为"));
        }

        // 注册会话超时定时器
        ctx.timerService().registerEventTimeTimer(event.getTimestamp() + 30 * 60 * 1000);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Alert> out) throws Exception {
        // 会话超时 - 发出会话摘要
        UserState state = userState.value();
        if (state != null && state.getLastSeen() < timestamp - 30 * 60 * 1000) {
            // 发出会话摘要并清除状态
            List<Event> events = new ArrayList<>();
            recentEvents.get().forEach(events::add);

            // 为新会话清除状态
            recentEvents.clear();
            eventCounts.clear();
        }
    }

    private boolean isAnomalous(Event event, UserState state) {
        // 实现异常检测逻辑
        return state.getEventCount() > 1000; // 简单阈值
    }
}
```

### 3. 精确一次处理

```java
// 使用 Kafka 和 Flink 的端到端精确一次
public class ExactlyOnceJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 启用精确一次检查点
        env.enableCheckpointing(60000, CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setCheckpointTimeout(300000);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);

        // 精确一次的 Kafka 消费者
        Properties consumerProps = new Properties();
        consumerProps.setProperty("bootstrap.servers", "kafka:9092");
        consumerProps.setProperty("group.id", "exactly-once-consumer");
        consumerProps.setProperty("isolation.level", "read_committed");

        FlinkKafkaConsumer<Event> consumer = new FlinkKafkaConsumer<>(
            "events",
            new EventDeserializer(),
            consumerProps
        );
        consumer.setCommitOffsetsOnCheckpoints(true);

        // 精确一次的 Kafka 生产者（事务性）
        Properties producerProps = new Properties();
        producerProps.setProperty("bootstrap.servers", "kafka:9092");
        producerProps.setProperty("transaction.timeout.ms", "300000");

        FlinkKafkaProducer<Result> producer = new FlinkKafkaProducer<>(
            "results",
            new ResultSerializer(),
            producerProps,
            FlinkKafkaProducer.Semantic.EXACTLY_ONCE
        );

        env.addSource(consumer)
            .keyBy(Event::getKey)
            .process(new StatefulProcessor())
            .addSink(producer);

        env.execute("精确一次处理");
    }
}
```

### 4. 延迟数据处理

```java
// 全面的延迟数据处理
public class LateDataHandler {
    private static final OutputTag<Event> LATE_DATA_TAG =
        new OutputTag<Event>("late-data") {};

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // 配置水位线策略
        WatermarkStrategy<Event> watermarkStrategy = WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofMinutes(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
            .withIdleness(Duration.ofMinutes(1));

        DataStream<Event> events = env.addSource(kafkaConsumer)
            .assignTimestampsAndWatermarks(watermarkStrategy);

        // 带延迟数据侧输出的主处理
        SingleOutputStreamOperator<Metric> metrics = events
            .keyBy(Event::getKey)
            .window(TumblingEventTimeWindows.of(Time.minutes(5)))
            .allowedLateness(Time.minutes(2))
            .sideOutputLateData(LATE_DATA_TAG)
            .aggregate(new MetricAggregator());

        // 单独处理延迟数据
        DataStream<Event> lateData = metrics.getSideOutput(LATE_DATA_TAG);

        lateData
            .keyBy(Event::getKey)
            .process(new LateDataProcessor())
            .addSink(new LateDataSink());

        env.execute("延迟数据处理");
    }
}
```

## 代码示例

### 完整的实时分析管道

```python
# 基于 Python 的实时分析（Apache Spark Structured Streaming）
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

# 初始化 Spark
spark = SparkSession.builder \
    .appName("RealTimeAnalytics") \
    .config("spark.sql.streaming.checkpointLocation", "/checkpoints") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

# 定义 schema
event_schema = StructType([
    StructField("event_id", StringType()),
    StructField("event_type", StringType()),
    StructField("user_id", StringType()),
    StructField("session_id", StringType()),
    StructField("page_url", StringType()),
    StructField("timestamp", LongType()),
    StructField("properties", MapType(StringType(), StringType()))
])

# 从 Kafka 读取
events = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "clickstream") \
    .option("startingOffsets", "latest") \
    .load() \
    .select(from_json(col("value").cast("string"), event_schema).alias("data")) \
    .select("data.*") \
    .withColumn("event_time", from_unixtime(col("timestamp") / 1000).cast("timestamp"))

# 定义水位线用于延迟数据处理
events_with_watermark = events.withWatermark("event_time", "5 minutes")

# 实时聚合
# 1. 每分钟页面浏览
page_views = events_with_watermark \
    .filter(col("event_type") == "page_view") \
    .groupBy(
        window(col("event_time"), "1 minute"),
        col("page_url")
    ) \
    .agg(
        count("*").alias("views"),
        countDistinct("user_id").alias("unique_users"),
        countDistinct("session_id").alias("unique_sessions")
    )

# 2. 用户会话指标
sessions = events_with_watermark \
    .groupBy(
        window(col("event_time"), "30 minutes", "1 minute"),
        col("session_id")
    ) \
    .agg(
        count("*").alias("events_count"),
        min("event_time").alias("session_start"),
        max("event_time").alias("session_end"),
        collect_list("event_type").alias("event_sequence")
    ) \
    .withColumn("session_duration",
        unix_timestamp(col("session_end")) - unix_timestamp(col("session_start")))

# 3. 实时漏斗分析
funnel = events_with_watermark \
    .filter(col("event_type").isin(["page_view", "add_to_cart", "checkout", "purchase"])) \
    .groupBy(
        window(col("event_time"), "1 hour"),
        col("user_id")
    ) \
    .agg(
        max(when(col("event_type") == "page_view", 1).otherwise(0)).alias("viewed"),
        max(when(col("event_type") == "add_to_cart", 1).otherwise(0)).alias("added_to_cart"),
        max(when(col("event_type") == "checkout", 1).otherwise(0)).alias("checked_out"),
        max(when(col("event_type") == "purchase", 1).otherwise(0)).alias("purchased")
    )

funnel_summary = funnel \
    .groupBy("window") \
    .agg(
        sum("viewed").alias("step1_views"),
        sum("added_to_cart").alias("step2_carts"),
        sum("checked_out").alias("step3_checkouts"),
        sum("purchased").alias("step4_purchases")
    )

# 启动流式查询
page_views_query = page_views.writeStream \
    .outputMode("update") \
    .foreachBatch(lambda df, id: write_to_clickhouse(df, id, "page_views")) \
    .trigger(processingTime="10 seconds") \
    .start()

# 等待终止
spark.streams.awaitAnyTermination()
```

### 实时仪表板 API

```python
# 实时分析仪表板的 FastAPI 后端
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import clickhouse_driver
from datetime import datetime, timedelta
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ClickHouse 连接池
ch_client = clickhouse_driver.Client(
    host='clickhouse',
    port=9000,
    database='analytics'
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.get("/api/metrics/realtime")
async def get_realtime_metrics():
    """获取当前实时指标。"""
    query = """
    SELECT
        toStartOfMinute(event_time) as minute,
        count() as events,
        uniqExact(user_id) as users,
        uniqExact(session_id) as sessions,
        countIf(event_type = 'purchase') as purchases,
        sumIf(toFloat64(properties['amount']), event_type = 'purchase') as revenue
    FROM events
    WHERE event_time >= now() - INTERVAL 1 HOUR
    GROUP BY minute
    ORDER BY minute DESC
    LIMIT 60
    """
    result = ch_client.execute(query)
    return {
        "metrics": [
            {
                "minute": str(row[0]),
                "events": row[1],
                "users": row[2],
                "sessions": row[3],
                "purchases": row[4],
                "revenue": float(row[5]) if row[5] else 0
            }
            for row in result
        ]
    }

@app.get("/api/metrics/funnel")
async def get_funnel_metrics(period: str = "1h"):
    """获取漏斗转化指标。"""
    interval_map = {"1h": "1 HOUR", "24h": "24 HOUR", "7d": "7 DAY"}
    interval = interval_map.get(period, "1 HOUR")

    query = f"""
    WITH user_events AS (
        SELECT
            user_id,
            groupArray(event_type) as events
        FROM events
        WHERE event_time >= now() - INTERVAL {interval}
        GROUP BY user_id
    )
    SELECT
        countIf(has(events, 'page_view')) as step1,
        countIf(has(events, 'add_to_cart')) as step2,
        countIf(has(events, 'checkout')) as step3,
        countIf(has(events, 'purchase')) as step4
    FROM user_events
    """
    result = ch_client.execute(query)
    row = result[0]

    return {
        "funnel": {
            "page_view": row[0],
            "add_to_cart": row[1],
            "checkout": row[2],
            "purchase": row[3],
            "conversion_rates": {
                "view_to_cart": row[1] / row[0] if row[0] > 0 else 0,
                "cart_to_checkout": row[2] / row[1] if row[1] > 0 else 0,
                "checkout_to_purchase": row[3] / row[2] if row[2] > 0 else 0,
                "overall": row[3] / row[0] if row[0] > 0 else 0
            }
        }
    }

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    """用于实时指标更新的 WebSocket 端点。"""
    await manager.connect(websocket)
    try:
        while True:
            # 查询最新指标
            query = """
            SELECT
                count() as events,
                uniqExact(user_id) as users,
                countIf(event_type = 'purchase') as purchases
            FROM events
            WHERE event_time >= now() - INTERVAL 1 MINUTE
            """
            result = ch_client.execute(query)
            row = result[0]

            await websocket.send_json({
                "type": "metrics_update",
                "timestamp": datetime.now().isoformat(),
                "data": {
                    "events_per_minute": row[0],
                    "active_users": row[1],
                    "purchases_per_minute": row[2]
                }
            })

            await asyncio.sleep(5)  # 每 5 秒更新

    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

## 最佳实践

### 1. 分析优化的 Schema 设计

```sql
-- 优化的 ClickHouse schema
CREATE TABLE analytics.events_optimized (
    -- 使用适当的数据类型
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),  -- 枚举使用低基数
    user_id String CODEC(ZSTD),
    session_id String CODEC(ZSTD),

    -- 分离频繁查询的字段
    page_url String CODEC(ZSTD),
    referrer String CODEC(ZSTD),

    -- 分类数据使用 LowCardinality
    device LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country LowCardinality(String),

    -- 适当精度的时间戳
    event_time DateTime64(3),
    server_time DateTime DEFAULT now(),

    -- 灵活性的嵌套数据
    properties Nested(
        key LowCardinality(String),
        value String
    ) CODEC(ZSTD),

    -- 物化列
    event_date Date MATERIALIZED toDate(event_time),
    event_hour UInt8 MATERIALIZED toHour(event_time)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time)
SETTINGS
    index_granularity = 8192,
    min_bytes_for_wide_part = 0,
    min_rows_for_wide_part = 0;

-- 为常见过滤器创建跳过索引
ALTER TABLE analytics.events_optimized
    ADD INDEX idx_session (session_id) TYPE bloom_filter GRANULARITY 4,
    ADD INDEX idx_country (country) TYPE set(100) GRANULARITY 4;
```

### 2. 背压处理

```java
// Flink 背压配置
env.setBufferTimeout(100);  // 减少缓冲超时以加快背压传播

// 使用限流源
DataStream<Event> events = env.addSource(new RateLimitedKafkaSource(
    kafkaConsumer,
    1000000  // 每秒最多 100 万事件
));

// 带超时和容量的异步 I/O
AsyncDataStream.unorderedWait(
    events,
    new AsyncDatabaseLookup(),
    5000,  // 超时（毫秒）
    TimeUnit.MILLISECONDS,
    100    // 最大并发请求
);
```

## 常见陷阱

### 1. 未处理数据倾斜

```java
// 错误：热键导致处理瓶颈
events.keyBy(Event::getUserId)  // 某些用户事件量是其他的 1000 倍
    .process(new Processor());

// 正确：添加盐值分散负载
events
    .map(e -> {
        int salt = e.hashCode() % 10;
        return new Tuple2<>(e.getUserId() + "_" + salt, e);
    })
    .keyBy(t -> t.f0)
    .process(new Processor())
    .keyBy(r -> r.getUserId())  // 为最终聚合重新分键
    .reduce(new Reducer());

// 正确：使用本地预聚合
events
    .keyBy(Event::getUserId)
    .window(TumblingEventTimeWindows.of(Time.seconds(10)))
    .aggregate(new LocalAggregator())  // 本地预聚合
    .keyBy(Aggregate::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(1)))
    .reduce(new GlobalReducer());
```

### 2. 忽略检查点影响

```java
// 错误：大状态没有增量检查点
env.enableCheckpointing(60000);
// 状态可能是 GB 级，导致检查点时间过长

// 正确：使用 RocksDB 启用增量检查点
env.setStateBackend(new EmbeddedRocksDBStateBackend(true));  // true = 增量

CheckpointConfig config = env.getCheckpointConfig();
config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
config.setMinPauseBetweenCheckpoints(30000);
config.setCheckpointTimeout(600000);
config.enableUnalignedCheckpoints();  // 背压下更快的检查点
config.setMaxConcurrentCheckpoints(1);
```

### 3. 大窗口的内存问题

```java
// 错误：在内存中收集所有事件
.window(TumblingEventTimeWindows.of(Time.hours(24)))
.process(new ProcessWindowFunction<Event, Result, String, TimeWindow>() {
    @Override
    public void process(String key, Context context,
            Iterable<Event> elements, Collector<Result> out) {
        List<Event> all = new ArrayList<>();
        elements.forEach(all::add);  // 大窗口会 OOM！
        // 处理所有事件
    }
});

// 正确：使用增量聚合
.window(TumblingEventTimeWindows.of(Time.hours(24)))
.aggregate(
    new IncrementalAggregator(),  // 维护运行状态
    new ResultProcessor()          // 只接收最终聚合
);
```

## 面试要点

### 架构问题

**Q: 如何设计每秒 100 万事件的实时分析系统？**
> 使用 Kafka 进行摄入，多分区（100 万/秒至少 100 个分区）。使用 Flink 处理，并行度匹配分区数。存储在 ClickHouse 中，基于事件时间和用户 ID 分片。使用物化视图处理常见聚合。实现 Kappa 架构以简化，在 Kafka 中保留 7 天原始事件用于重处理。

**Q: 如何处理延迟到达的数据？**
> 配置适当乱序容忍度的水位线（如 5 分钟）。在窗口中使用允许延迟来更新结果。将非常延迟的数据侧输出用于单独处理或修正。对于 ClickHouse，使用 ReplacingMergeTree 或 AggregatingMergeTree 处理更新。监控延迟数据指标以调整水位线策略。

**Q: Lambda vs Kappa 架构 - 何时使用哪个？**
> Kappa 更简单，在以下情况下优先：流处理可以处理所有用例、你有可重放的日志、批处理/流之间的一致性不关键。Lambda 在以下情况下更好：需要复杂的仅批处理算法（ML 训练）、需要精确的历史重处理、或有现有的批处理基础设施可利用。

### 快速参考卡片

```
实时分析技术栈：
├── 摄入：Kafka, Kinesis, Pulsar
├── 处理：Flink, Spark Streaming, ksqlDB
├── 存储：ClickHouse, Druid, Pinot
├── 缓存：Redis, Memcached
└── 可视化：Grafana, Superset, Metabase

关键监控指标：
├── 端到端延迟（p50, p99）
├── 吞吐量（事件/秒）
├── 检查点持续时间和大小
├── 消费者延迟
├── 延迟数据百分比
└── 查询延迟

性能目标：
├── 摄入：< 10ms 延迟
├── 处理：< 1s 窗口延迟
├── 查询：< 100ms 用于仪表板
├── 检查点：< 1 分钟
└── 恢复：< 5 分钟
```

## 延伸阅读

### 技术

| 技术 | 用例 | URL |
|------|------|-----|
| Apache Kafka | 事件流 | kafka.apache.org |
| Apache Flink | 流处理 | flink.apache.org |
| ClickHouse | 实时 OLAP | clickhouse.com |
| Apache Druid | 时序 OLAP | druid.apache.org |
| Apache Pinot | 面向用户的分析 | pinot.apache.org |
| Materialize | 流式 SQL | materialize.com |

### 书籍和资源

- **"Streaming Systems"** by Tyler Akidau - 全面的流处理理论
- **"Designing Data-Intensive Applications"** by Martin Kleppmann - 基础概念
- **"Kafka: The Definitive Guide"** - Kafka 深入

---

实时分析系统需要仔细的架构设计，平衡延迟、吞吐量、准确性和成本。关键是为每一层选择正确的工具，实现适当的状态管理，并处理流数据固有的挑战，如延迟到达和乱序事件。从简单的架构（Kappa）开始，仅在需要时增加复杂性。
