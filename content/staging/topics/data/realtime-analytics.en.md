---
title: Real-time Analytics Architecture Design
description: Design and implement scalable real-time analytics systems - from data ingestion to visualization with Kafka, Flink, ClickHouse, and more
track: data
section: analytics-engines
difficulty: advanced
tags:
  - Real-time Analytics
  - Stream Processing
  - Data Architecture
  - Kafka
  - Flink
  - ClickHouse
  - OLAP
status: imported
origin: old/src/content/docs/data/realtime-analytics.en.md
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

Real-time analytics enables organizations to gain insights from data as it arrives, powering use cases from fraud detection to live dashboards. This guide covers the architecture patterns, technology choices, and implementation strategies for building scalable real-time analytics systems that can process millions of events per second with sub-second latency.

## Concept Explanation

### What is Real-time Analytics?

**Real-time analytics** is the practice of analyzing data immediately as it becomes available, enabling instant insights and automated responses. Unlike batch analytics that processes historical data periodically, real-time analytics operates on streaming data with latency requirements ranging from milliseconds to minutes.

```
┌─────────────────────────────────────────────────────────────────┐
│                 Real-time Analytics Architecture                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATA SOURCES              INGESTION            PROCESSING      │
│  ┌─────────────┐          ┌─────────┐          ┌─────────┐     │
│  │ Web/Mobile  │─────────▶│         │          │         │     │
│  │   Events    │          │         │          │         │     │
│  └─────────────┘          │         │          │         │     │
│  ┌─────────────┐          │  Kafka  │─────────▶│  Flink  │     │
│  │   IoT       │─────────▶│  Kinesis│          │  Spark  │     │
│  │  Devices    │          │  Pulsar │          │         │     │
│  └─────────────┘          │         │          │         │     │
│  ┌─────────────┐          │         │          │         │     │
│  │ Databases   │─────────▶│         │          │         │     │
│  │   (CDC)     │          └─────────┘          └────┬────┘     │
│  └─────────────┘                                    │          │
│                                                     ▼          │
│  STORAGE                  SERVING               VISUALIZATION  │
│  ┌─────────────┐         ┌─────────┐          ┌─────────┐     │
│  │ ClickHouse  │◀────────│  Redis  │          │ Grafana │     │
│  │   Druid     │         │  Cache  │─────────▶│ Superset│     │
│  │   Pinot     │         │         │          │ Tableau │     │
│  └─────────────┘         └─────────┘          └─────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Real-time vs Near-real-time vs Batch

| Processing Type | Latency | Use Cases | Technologies |
|-----------------|---------|-----------|--------------|
| **Real-time** | < 100ms | Fraud detection, alerting | Flink, Kafka Streams |
| **Near-real-time** | 100ms - 5min | Dashboards, recommendations | Spark Streaming, ksqlDB |
| **Batch** | Hours - Days | Reports, ML training | Spark, Hive, Trino |

### Lambda vs Kappa Architecture

```
Lambda Architecture (Batch + Speed layers):
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                      ┌─────────────────┐                        │
│                      │  Batch Layer    │                        │
│           ┌─────────▶│  (Historical)   │─────┐                  │
│           │          └─────────────────┘     │                  │
│  ┌────────┴───┐                              ▼                  │
│  │   Data     │                      ┌──────────────┐          │
│  │   Source   │                      │  Serving     │          │
│  └────────┬───┘                      │  Layer       │          │
│           │          ┌─────────────────┐     │                  │
│           └─────────▶│  Speed Layer    │─────┘                  │
│                      │  (Real-time)    │                        │
│                      └─────────────────┘                        │
│                                                                  │
│  Pros: Fault-tolerant, reprocessing capability                  │
│  Cons: Complex, dual codebase maintenance                       │
└─────────────────────────────────────────────────────────────────┘

Kappa Architecture (Stream-only):
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────┐    ┌─────────────────┐    ┌──────────────┐     │
│  │   Data     │───▶│  Stream Layer   │───▶│  Serving     │     │
│  │   Source   │    │  (All processing)│    │  Layer       │     │
│  └────────────┘    └─────────────────┘    └──────────────┘     │
│                            │                                     │
│                            ▼                                     │
│                    ┌─────────────────┐                          │
│                    │  Reprocessing   │                          │
│                    │  (Replay logs)  │                          │
│                    └─────────────────┘                          │
│                                                                  │
│  Pros: Simpler, single codebase                                 │
│  Cons: Requires replayable log, higher stream storage           │
└─────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Data Ingestion Layer

```python
# Kafka producer for event ingestion
from confluent_kafka import Producer
import json
import time

class EventProducer:
    def __init__(self, bootstrap_servers: str):
        self.producer = Producer({
            'bootstrap.servers': bootstrap_servers,
            'client.id': 'analytics-producer',
            'acks': 'all',  # Wait for all replicas
            'retries': 3,
            'retry.backoff.ms': 1000,
            'compression.type': 'lz4',
            'batch.size': 16384,
            'linger.ms': 5,  # Wait up to 5ms to batch
        })

    def delivery_callback(self, err, msg):
        if err:
            print(f'Message delivery failed: {err}')
        else:
            print(f'Message delivered to {msg.topic()} [{msg.partition()}]')

    def send_event(self, topic: str, event: dict, key: str = None):
        """Send event to Kafka topic."""
        try:
            self.producer.produce(
                topic=topic,
                key=key.encode('utf-8') if key else None,
                value=json.dumps(event).encode('utf-8'),
                callback=self.delivery_callback
            )
            self.producer.poll(0)  # Trigger callbacks
        except BufferError:
            print('Buffer full, waiting...')
            self.producer.poll(1)
            self.send_event(topic, event, key)

    def flush(self):
        self.producer.flush()

# Usage
producer = EventProducer('kafka:9092')

# Send clickstream events
event = {
    'event_type': 'page_view',
    'user_id': 'user123',
    'page_url': '/products/123',
    'timestamp': int(time.time() * 1000),
    'session_id': 'sess_abc',
    'device': 'mobile',
    'country': 'US'
}

producer.send_event('clickstream', event, key=event['user_id'])
producer.flush()
```

```java
// High-throughput Kafka producer in Java
import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class HighThroughputProducer {
    private final KafkaProducer<String, String> producer;

    public HighThroughputProducer(String bootstrapServers) {
        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
            "org.apache.kafka.common.serialization.StringSerializer");
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
            "org.apache.kafka.common.serialization.StringSerializer");

        // High throughput settings
        props.put(ProducerConfig.ACKS_CONFIG, "1"); // Trade-off: lower latency
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "lz4");
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 65536); // 64KB batches
        props.put(ProducerConfig.LINGER_MS_CONFIG, 10);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 67108864); // 64MB buffer

        this.producer = new KafkaProducer<>(props);
    }

    public void sendAsync(String topic, String key, String value) {
        ProducerRecord<String, String> record = new ProducerRecord<>(topic, key, value);

        producer.send(record, (metadata, exception) -> {
            if (exception != null) {
                System.err.println("Send failed: " + exception.getMessage());
            }
        });
    }

    public void close() {
        producer.close();
    }
}
```

### 2. Stream Processing Layer

```java
// Apache Flink real-time analytics job
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer;
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaProducer;

public class RealTimeAnalyticsJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // Enable checkpointing for exactly-once processing
        env.enableCheckpointing(60000);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);

        // Kafka source
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

        // Real-time aggregations
        DataStream<PageViewMetric> pageViews = events
            .filter(e -> e.getEventType().equals("page_view"))
            .keyBy(ClickEvent::getPageUrl)
            .window(TumblingEventTimeWindows.of(Time.minutes(1)))
            .aggregate(new PageViewAggregator());

        // Session analysis
        DataStream<SessionMetric> sessions = events
            .keyBy(ClickEvent::getSessionId)
            .window(EventTimeSessionWindows.withGap(Time.minutes(30)))
            .process(new SessionAnalyzer());

        // Funnel analysis
        DataStream<FunnelMetric> funnels = events
            .keyBy(ClickEvent::getUserId)
            .process(new FunnelProcessor());

        // Output to multiple sinks
        pageViews.addSink(new ClickHouseSink<>("page_views"));
        sessions.addSink(new ClickHouseSink<>("sessions"));
        funnels.addSink(new ClickHouseSink<>("funnels"));

        // Also send alerts to Kafka
        funnels
            .filter(f -> f.getDropoffRate() > 0.5)
            .addSink(new FlinkKafkaProducer<>("alerts", new FunnelAlertSerializer(), kafkaProps));

        env.execute("Real-time Analytics");
    }
}

// Page view aggregator
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

### 3. Real-time OLAP Storage

```sql
-- ClickHouse schema for real-time analytics
CREATE DATABASE analytics;

-- Events table with efficient partitioning
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

-- Materialized view for real-time page view metrics
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

-- Materialized view for funnel analysis
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

-- Real-time dashboard query
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

-- Funnel query
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

## Key Concepts

### 1. Windowing Strategies

```java
// Different window types in Flink
import org.apache.flink.streaming.api.windowing.assigners.*;
import org.apache.flink.streaming.api.windowing.time.Time;

// Tumbling windows: Fixed-size, non-overlapping
DataStream<Metric> tumblingResult = events
    .keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new MetricAggregator());

// Sliding windows: Fixed-size, overlapping
DataStream<Metric> slidingResult = events
    .keyBy(Event::getKey)
    .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(1)))
    .aggregate(new MetricAggregator());

// Session windows: Dynamic size based on gap
DataStream<SessionMetric> sessionResult = events
    .keyBy(Event::getSessionId)
    .window(EventTimeSessionWindows.withGap(Time.minutes(30)))
    .process(new SessionWindowFunction());

// Custom window with allowed lateness
DataStream<Metric> withLateness = events
    .keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .allowedLateness(Time.minutes(1))
    .sideOutputLateData(lateOutputTag)
    .aggregate(new MetricAggregator());
```

### 2. State Management

```java
// Stateful processing for user behavior tracking
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
        // Update user state
        UserState state = userState.value();
        if (state == null) {
            state = new UserState(event.getUserId());
        }
        state.updateLastSeen(event.getTimestamp());
        state.incrementEventCount();
        userState.update(state);

        // Update event counts
        String eventType = event.getEventType();
        Long count = eventCounts.get(eventType);
        eventCounts.put(eventType, count == null ? 1 : count + 1);

        // Add to recent events
        recentEvents.add(event);

        // Check for anomalies
        if (isAnomalous(event, state)) {
            out.collect(new Alert(event.getUserId(), "Anomalous behavior detected"));
        }

        // Register timer for session timeout
        ctx.timerService().registerEventTimeTimer(event.getTimestamp() + 30 * 60 * 1000);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Alert> out) throws Exception {
        // Session timeout - emit session summary
        UserState state = userState.value();
        if (state != null && state.getLastSeen() < timestamp - 30 * 60 * 1000) {
            // Emit session summary and clear state
            List<Event> events = new ArrayList<>();
            recentEvents.get().forEach(events::add);

            // Clear state for new session
            recentEvents.clear();
            eventCounts.clear();
        }
    }

    private boolean isAnomalous(Event event, UserState state) {
        // Implement anomaly detection logic
        return state.getEventCount() > 1000; // Simple threshold
    }
}
```

### 3. Exactly-Once Processing

```java
// End-to-end exactly-once with Kafka and Flink
import org.apache.flink.streaming.connectors.kafka.*;

public class ExactlyOnceJob {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // Enable exactly-once checkpointing
        env.enableCheckpointing(60000, CheckpointingMode.EXACTLY_ONCE);
        env.getCheckpointConfig().setCheckpointTimeout(300000);
        env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
        env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);

        // Kafka consumer with exactly-once
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

        // Kafka producer with exactly-once (transactional)
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

        env.execute("Exactly-Once Processing");
    }
}
```

### 4. Late Data Handling

```java
// Comprehensive late data handling
public class LateDataHandler {
    private static final OutputTag<Event> LATE_DATA_TAG =
        new OutputTag<Event>("late-data") {};

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // Configure watermark strategy
        WatermarkStrategy<Event> watermarkStrategy = WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofMinutes(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
            .withIdleness(Duration.ofMinutes(1));

        DataStream<Event> events = env.addSource(kafkaConsumer)
            .assignTimestampsAndWatermarks(watermarkStrategy);

        // Main processing with late data side output
        SingleOutputStreamOperator<Metric> metrics = events
            .keyBy(Event::getKey)
            .window(TumblingEventTimeWindows.of(Time.minutes(5)))
            .allowedLateness(Time.minutes(2))
            .sideOutputLateData(LATE_DATA_TAG)
            .aggregate(new MetricAggregator());

        // Handle late data separately
        DataStream<Event> lateData = metrics.getSideOutput(LATE_DATA_TAG);

        lateData
            .keyBy(Event::getKey)
            .process(new LateDataProcessor())
            .addSink(new LateDataSink());

        // Log late data statistics
        lateData
            .windowAll(TumblingProcessingTimeWindows.of(Time.minutes(1)))
            .aggregate(new LateDataCounter())
            .addSink(new MetricsSink("late_data_count"));

        env.execute("Late Data Handling");
    }
}

public class LateDataProcessor extends KeyedProcessFunction<String, Event, LateDataCorrection> {
    private ValueState<Long> lastProcessedWatermark;

    @Override
    public void open(Configuration parameters) {
        lastProcessedWatermark = getRuntimeContext().getState(
            new ValueStateDescriptor<>("watermark", Long.class));
    }

    @Override
    public void processElement(Event event, Context ctx, Collector<LateDataCorrection> out) {
        // Calculate how late the data is
        long lateness = ctx.timerService().currentWatermark() - event.getTimestamp();

        // Emit correction event
        out.collect(new LateDataCorrection(
            event.getKey(),
            event.getTimestamp(),
            lateness,
            event.getValue()
        ));

        // Update metrics
        ctx.output(METRICS_TAG, new Metric("late_data_lateness_ms", lateness));
    }
}
```

## Code Examples

### Complete Real-time Analytics Pipeline

```python
# Python-based real-time analytics with Apache Spark Structured Streaming
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

# Initialize Spark
spark = SparkSession.builder \
    .appName("RealTimeAnalytics") \
    .config("spark.sql.streaming.checkpointLocation", "/checkpoints") \
    .config("spark.sql.shuffle.partitions", "10") \
    .getOrCreate()

# Define schema
event_schema = StructType([
    StructField("event_id", StringType()),
    StructField("event_type", StringType()),
    StructField("user_id", StringType()),
    StructField("session_id", StringType()),
    StructField("page_url", StringType()),
    StructField("timestamp", LongType()),
    StructField("properties", MapType(StringType(), StringType()))
])

# Read from Kafka
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

# Define watermark for late data handling
events_with_watermark = events.withWatermark("event_time", "5 minutes")

# Real-time aggregations
# 1. Page views per minute
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

# 2. User session metrics
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

# 3. Real-time funnel analysis
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

# Write to ClickHouse
def write_to_clickhouse(df, epoch_id, table_name):
    df.write \
        .format("jdbc") \
        .option("driver", "com.clickhouse.jdbc.ClickHouseDriver") \
        .option("url", "jdbc:clickhouse://clickhouse:8123/analytics") \
        .option("dbtable", table_name) \
        .mode("append") \
        .save()

# Start streaming queries
page_views_query = page_views.writeStream \
    .outputMode("update") \
    .foreachBatch(lambda df, id: write_to_clickhouse(df, id, "page_views")) \
    .trigger(processingTime="10 seconds") \
    .start()

funnel_query = funnel_summary.writeStream \
    .outputMode("complete") \
    .foreachBatch(lambda df, id: write_to_clickhouse(df, id, "funnel_metrics")) \
    .trigger(processingTime="1 minute") \
    .start()

# Wait for termination
spark.streams.awaitAnyTermination()
```

### Real-time Dashboard API

```python
# FastAPI backend for real-time analytics dashboard
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

# ClickHouse connection pool
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
    """Get current real-time metrics."""
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
    """Get funnel conversion metrics."""
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

@app.get("/api/metrics/top-pages")
async def get_top_pages(limit: int = 10):
    """Get top pages by views."""
    query = f"""
    SELECT
        page_url,
        count() as views,
        uniqExact(user_id) as unique_users,
        avg(toFloat64OrZero(properties['load_time'])) as avg_load_time
    FROM events
    WHERE event_type = 'page_view'
      AND event_time >= now() - INTERVAL 1 HOUR
    GROUP BY page_url
    ORDER BY views DESC
    LIMIT {limit}
    """
    result = ch_client.execute(query)
    return {
        "pages": [
            {
                "url": row[0],
                "views": row[1],
                "unique_users": row[2],
                "avg_load_time": float(row[3])
            }
            for row in result
        ]
    }

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time metric updates."""
    await manager.connect(websocket)
    try:
        while True:
            # Query latest metrics
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

            await asyncio.sleep(5)  # Update every 5 seconds

    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task for anomaly detection
async def anomaly_detector():
    """Detect anomalies and broadcast alerts."""
    while True:
        query = """
        SELECT
            toStartOfMinute(event_time) as minute,
            count() as events
        FROM events
        WHERE event_time >= now() - INTERVAL 10 MINUTE
        GROUP BY minute
        ORDER BY minute
        """
        result = ch_client.execute(query)

        if len(result) >= 5:
            recent = [r[1] for r in result[-5:]]
            avg = sum(recent) / len(recent)

            # Simple anomaly detection: 50% deviation
            if result[-1][1] > avg * 1.5 or result[-1][1] < avg * 0.5:
                await manager.broadcast({
                    "type": "anomaly_alert",
                    "timestamp": datetime.now().isoformat(),
                    "message": f"Traffic anomaly detected: {result[-1][1]} events (avg: {avg:.0f})"
                })

        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(anomaly_detector())
```

## Best Practices

### 1. Schema Design for Analytics

```sql
-- Optimized ClickHouse schema
CREATE TABLE analytics.events_optimized (
    -- Use appropriate data types
    event_id UUID DEFAULT generateUUIDv4(),
    event_type LowCardinality(String),  -- Low cardinality for enums
    user_id String CODEC(ZSTD),
    session_id String CODEC(ZSTD),

    -- Separate frequently queried fields
    page_url String CODEC(ZSTD),
    referrer String CODEC(ZSTD),

    -- Use LowCardinality for categorical data
    device LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country LowCardinality(String),

    -- Timestamps with appropriate precision
    event_time DateTime64(3),
    server_time DateTime DEFAULT now(),

    -- Nested data for flexibility
    properties Nested(
        key LowCardinality(String),
        value String
    ) CODEC(ZSTD),

    -- Materialized columns
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

-- Create skip indices for common filters
ALTER TABLE analytics.events_optimized
    ADD INDEX idx_session (session_id) TYPE bloom_filter GRANULARITY 4,
    ADD INDEX idx_country (country) TYPE set(100) GRANULARITY 4;
```

### 2. Backpressure Handling

```java
// Flink backpressure configuration
env.setBufferTimeout(100);  // Reduce buffer timeout for faster backpressure propagation

// Use rate limiting source
DataStream<Event> events = env.addSource(new RateLimitedKafkaSource(
    kafkaConsumer,
    1000000  // Max 1M events per second
));

// Async I/O with timeout and capacity
AsyncDataStream.unorderedWait(
    events,
    new AsyncDatabaseLookup(),
    5000,  // Timeout in ms
    TimeUnit.MILLISECONDS,
    100    // Max concurrent requests
);

// Custom backpressure handling
public class BackpressureAwareProcessor extends ProcessFunction<Event, Result> {
    private transient Meter backpressureMeter;

    @Override
    public void open(Configuration parameters) {
        backpressureMeter = getRuntimeContext()
            .getMetricGroup()
            .meter("backpressure", new MeterView(60));
    }

    @Override
    public void processElement(Event event, Context ctx, Collector<Result> out) {
        // Check if we're under backpressure
        if (isBackpressured()) {
            backpressureMeter.markEvent();
            // Implement backpressure handling strategy
            // Option 1: Drop low-priority events
            // Option 2: Sample events
            // Option 3: Write to overflow queue
            return;
        }

        // Normal processing
        out.collect(process(event));
    }

    private boolean isBackpressured() {
        // Check buffer utilization or other indicators
        return getRuntimeContext().getTaskManagerRuntimeInfo()
            .getConfiguration()
            .getFloat("taskmanager.network.memory.buffer-debloat.target", 0.5f) > 0.8f;
    }
}
```

### 3. Query Optimization

```sql
-- ClickHouse query optimization techniques

-- Use PREWHERE for filtering
SELECT *
FROM analytics.events
PREWHERE event_date = today()  -- Evaluated first, reduces data read
WHERE event_type = 'purchase'
  AND user_id = 'user123';

-- Use sampling for approximate queries
SELECT
    count() * 10 as estimated_count,
    uniq(user_id) * 10 as estimated_users
FROM analytics.events SAMPLE 0.1  -- 10% sample
WHERE event_date >= today() - 7;

-- Optimize GROUP BY with partial sorting
SELECT
    country,
    count() as events
FROM analytics.events
WHERE event_date = today()
GROUP BY country
ORDER BY events DESC
SETTINGS optimize_aggregation_in_order = 1;

-- Use materialized views for repeated queries
-- (Already created earlier in the document)

-- Parallel replicas for large queries
SELECT
    toStartOfHour(event_time) as hour,
    count() as events
FROM analytics.events
WHERE event_date >= today() - 30
GROUP BY hour
SETTINGS
    max_parallel_replicas = 3,
    parallel_replicas_for_non_replicated_merge_tree = 1;
```

## Common Pitfalls

### 1. Not Handling Data Skew

```java
// BAD: Hot keys cause processing bottleneck
events.keyBy(Event::getUserId)  // Some users have 1000x more events
    .process(new Processor());

// GOOD: Add salting to distribute load
events
    .map(e -> {
        int salt = e.hashCode() % 10;
        return new Tuple2<>(e.getUserId() + "_" + salt, e);
    })
    .keyBy(t -> t.f0)
    .process(new Processor())
    .keyBy(r -> r.getUserId())  // Re-key for final aggregation
    .reduce(new Reducer());

// GOOD: Use local pre-aggregation
events
    .keyBy(Event::getUserId)
    .window(TumblingEventTimeWindows.of(Time.seconds(10)))
    .aggregate(new LocalAggregator())  // Pre-aggregate locally
    .keyBy(Aggregate::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(1)))
    .reduce(new GlobalReducer());
```

### 2. Ignoring Checkpoint Impact

```java
// BAD: Large state without incremental checkpoints
env.enableCheckpointing(60000);
// State can be GBs, causing long checkpoint times

// GOOD: Enable incremental checkpoints with RocksDB
env.setStateBackend(new EmbeddedRocksDBStateBackend(true));  // true = incremental

CheckpointConfig config = env.getCheckpointConfig();
config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
config.setMinPauseBetweenCheckpoints(30000);
config.setCheckpointTimeout(600000);
config.enableUnalignedCheckpoints();  // Faster checkpoints under backpressure
config.setMaxConcurrentCheckpoints(1);

// Configure RocksDB for better checkpoint performance
Configuration configuration = new Configuration();
configuration.set(RocksDBConfigurableOptions.CHECKPOINT_TRANSFER_THREAD_NUM, 4);
configuration.set(RocksDBConfigurableOptions.COMPACTION_STYLE, "LEVEL");
```

### 3. Memory Issues with Large Windows

```java
// BAD: Collecting all events in memory
.window(TumblingEventTimeWindows.of(Time.hours(24)))
.process(new ProcessWindowFunction<Event, Result, String, TimeWindow>() {
    @Override
    public void process(String key, Context context,
            Iterable<Event> elements, Collector<Result> out) {
        List<Event> all = new ArrayList<>();
        elements.forEach(all::add);  // OOM for large windows!
        // Process all events
    }
});

// GOOD: Use incremental aggregation
.window(TumblingEventTimeWindows.of(Time.hours(24)))
.aggregate(
    new IncrementalAggregator(),  // Maintains running state
    new ResultProcessor()          // Only receives final aggregate
);

// GOOD: Use reduce for simple aggregations
.window(TumblingEventTimeWindows.of(Time.hours(24)))
.reduce(
    (a, b) -> merge(a, b),  // Incremental reduce
    new ResultProcessor()
);
```

## Interview Key Points

### Architecture Questions

**Q: How would you design a real-time analytics system for 1M events/second?**
> Use Kafka for ingestion with multiple partitions (at least 100 for 1M/s). Process with Flink using parallelism matching partitions. Store in ClickHouse with sharding based on event time and user ID. Use materialized views for common aggregations. Implement Kappa architecture for simplicity, keeping 7 days of raw events in Kafka for reprocessing.

**Q: How do you handle late-arriving data?**
> Configure watermarks with appropriate out-of-orderness (e.g., 5 minutes). Use allowed lateness in windows to update results. Side-output very late data for separate handling or correction. For ClickHouse, use ReplacingMergeTree or AggregatingMergeTree to handle updates. Monitor late data metrics to adjust watermark strategy.

**Q: Lambda vs Kappa architecture - when to use each?**
> Kappa is simpler and preferred when: stream processing can handle all use cases, you have replayable logs, and consistency between batch/stream isn't critical. Lambda is better when: you need complex batch-only algorithms (ML training), exact historical reprocessing is required, or you have existing batch infrastructure to leverage.

### Quick Reference Card

```
Real-time Analytics Stack:
├── Ingestion: Kafka, Kinesis, Pulsar
├── Processing: Flink, Spark Streaming, ksqlDB
├── Storage: ClickHouse, Druid, Pinot
├── Caching: Redis, Memcached
└── Visualization: Grafana, Superset, Metabase

Key Metrics to Monitor:
├── End-to-end latency (p50, p99)
├── Throughput (events/second)
├── Checkpoint duration and size
├── Consumer lag
├── Late data percentage
└── Query latency

Performance Targets:
├── Ingestion: < 10ms latency
├── Processing: < 1s window latency
├── Query: < 100ms for dashboards
├── Checkpoint: < 1 minute
└── Recovery: < 5 minutes
```

## Further Reading

### Technologies

| Technology | Use Case | URL |
|------------|----------|-----|
| Apache Kafka | Event streaming | kafka.apache.org |
| Apache Flink | Stream processing | flink.apache.org |
| ClickHouse | Real-time OLAP | clickhouse.com |
| Apache Druid | Time-series OLAP | druid.apache.org |
| Apache Pinot | User-facing analytics | pinot.apache.org |
| Materialize | Streaming SQL | materialize.com |

### Books and Resources

- **"Streaming Systems"** by Tyler Akidau - Comprehensive streaming theory
- **"Designing Data-Intensive Applications"** by Martin Kleppmann - Foundational concepts
- **"Kafka: The Definitive Guide"** - Kafka deep dive

---

Real-time analytics systems require careful architecture design balancing latency, throughput, accuracy, and cost. The key is choosing the right tools for each layer, implementing proper state management, and handling the inherent challenges of streaming data like late arrivals and out-of-order events. Start with simpler architectures (Kappa) and add complexity only when needed.
