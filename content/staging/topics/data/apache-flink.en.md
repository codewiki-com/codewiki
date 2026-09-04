---
title: Apache Flink Real-time Computing
description: Learn Apache Flink for large-scale real-time data processing
track: data
section: data-engineering
difficulty: advanced
tags:
  - Flink
  - stream processing
  - real-time computing
  - big data
status: imported
origin: old/src/content/docs/data/apache-flink.en.md
divergence: 0.215
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 16
  lastUpdated: 2026-01-07
---

Apache Flink is a distributed stream processing framework designed for stateful computations over unbounded and bounded data streams. Unlike traditional batch processing systems, Flink treats batch as a special case of streaming, providing true real-time processing capabilities with exactly-once semantics, event-time processing, and sophisticated state management.

## Flink Architecture

### What is Apache Flink?

Apache Flink is an open-source, unified stream and batch processing framework that provides high-throughput, low-latency streaming engine with exactly-once fault tolerance guarantees. Flink's streaming-first approach makes it ideal for building event-driven applications, real-time analytics, and continuous ETL pipelines.

**Key advantages of Flink:**

- **True Streaming**: Processes events one at a time with low latency, not micro-batches
- **Exactly-Once Semantics**: Guaranteed correct results even during failures
- **Event Time Processing**: Handle out-of-order events correctly with watermarks
- **Stateful Computations**: Rich state management with fault tolerance
- **Unified Batch and Stream**: Same API for bounded and unbounded data
- **Scalability**: Scales to thousands of nodes with high throughput

### Core Architecture Components

Flink follows a master-worker architecture with the following components:

```
                    +------------------+
                    |   Flink Client   |
                    | (Submit Jobs)    |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   JobManager     |
                    | (Master Node)    |
                    | - JobMaster      |
                    | - ResourceManager|
                    | - Dispatcher     |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +--------v-------+  +--------v-------+
|  TaskManager   |  |  TaskManager   |  |  TaskManager   |
|  (Worker Node) |  |  (Worker Node) |  |  (Worker Node) |
| +-----------+  |  | +-----------+  |  | +-----------+  |
| | Task Slot |  |  | | Task Slot |  |  | | Task Slot |  |
| | Task Slot |  |  | | Task Slot |  |  | | Task Slot |  |
| +-----------+  |  | +-----------+  |  | +-----------+  |
+----------------+  +----------------+  +----------------+
```

### Component Responsibilities

| Component | Description |
|-----------|-------------|
| **JobManager** | Coordinates distributed execution, schedules tasks, manages checkpoints |
| **JobMaster** | Manages execution of a single job, handles task scheduling and recovery |
| **ResourceManager** | Manages TaskManager slots, handles resource allocation |
| **Dispatcher** | Provides REST interface, submits jobs to JobMaster |
| **TaskManager** | Executes tasks, manages local state and buffers |
| **Task Slot** | Fixed subset of TaskManager resources for running parallel tasks |

### Setting Up Flink

```java
// Java - Creating a Flink Streaming Environment
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class FlinkSetup {
    public static void main(String[] args) throws Exception {
        // Create streaming execution environment
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // Configure parallelism
        env.setParallelism(4);

        // Configure checkpointing
        env.enableCheckpointing(60000); // Every 60 seconds

        // Your streaming logic here

        // Execute the job
        env.execute("My Flink Job");
    }
}
```

```python
# Python (PyFlink) - Creating a Flink Environment
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment

# Create streaming execution environment
env = StreamExecutionEnvironment.get_execution_environment()
env.set_parallelism(4)

# Create table environment for SQL support
table_env = StreamTableEnvironment.create(env)

# Configure checkpointing
env.enable_checkpointing(60000)  # Every 60 seconds
```

## DataStream API

### Basic Concepts

The DataStream API is Flink's core API for stream processing. It provides transformations on data streams that can be applied to create complex data processing pipelines.

```java
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

public class DataStreamBasics {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        // Create a DataStream from a collection
        DataStream<Integer> numbers = env.fromElements(1, 2, 3, 4, 5);

        // Create from a source
        DataStream<String> lines = env.socketTextStream("localhost", 9999);

        // Basic transformations
        DataStream<Integer> doubled = numbers.map(x -> x * 2);
        DataStream<Integer> evens = numbers.filter(x -> x % 2 == 0);

        // Print results
        doubled.print();

        env.execute("DataStream Basics");
    }
}
```

### Transformation Operations

```java
import org.apache.flink.api.common.functions.*;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.util.Collector;

// Map: One-to-one transformation
DataStream<String> mapped = stream.map(new MapFunction<Integer, String>() {
    @Override
    public String map(Integer value) {
        return "Number: " + value;
    }
});

// Lambda syntax (Java 8+)
DataStream<Integer> squared = numbers.map(x -> x * x);

// FlatMap: One-to-many transformation
DataStream<String> words = lines.flatMap(new FlatMapFunction<String, String>() {
    @Override
    public void flatMap(String line, Collector<String> out) {
        for (String word : line.split(" ")) {
            out.collect(word);
        }
    }
});

// Filter: Select elements matching a condition
DataStream<Integer> positive = numbers.filter(x -> x > 0);

// KeyBy: Partition stream by key (creates KeyedStream)
DataStream<Tuple2<String, Integer>> events = ...;
KeyedStream<Tuple2<String, Integer>, String> keyed = events.keyBy(event -> event.f0);

// Reduce: Aggregate values with same key
DataStream<Tuple2<String, Integer>> sums = keyed.reduce(
    (a, b) -> new Tuple2<>(a.f0, a.f1 + b.f1)
);

// Union: Combine multiple streams
DataStream<Integer> combined = stream1.union(stream2, stream3);

// Connect: Combine two streams with different types
ConnectedStreams<Integer, String> connected = intStream.connect(stringStream);
DataStream<String> result = connected.map(
    new CoMapFunction<Integer, String, String>() {
        @Override
        public String map1(Integer value) { return "Int: " + value; }
        @Override
        public String map2(String value) { return "String: " + value; }
    }
);
```

### KeyedStream Operations

```java
import org.apache.flink.streaming.api.datastream.KeyedStream;

// Create keyed stream
KeyedStream<Event, String> keyedEvents = events.keyBy(event -> event.getUserId());

// Aggregations on KeyedStream
keyedEvents.sum("amount");      // Sum by field
keyedEvents.min("timestamp");   // Minimum by field
keyedEvents.max("amount");      // Maximum by field
keyedEvents.minBy("amount");    // Element with minimum (returns entire object)
keyedEvents.maxBy("amount");    // Element with maximum

// Custom aggregation with reduce
keyedEvents.reduce((event1, event2) -> {
    return new Event(
        event1.getUserId(),
        event1.getAmount() + event2.getAmount(),
        Math.max(event1.getTimestamp(), event2.getTimestamp())
    );
});
```

### PyFlink DataStream API

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.functions import MapFunction, FilterFunction, FlatMapFunction
from pyflink.common.typeinfo import Types

env = StreamExecutionEnvironment.get_execution_environment()

# Create DataStream
ds = env.from_collection(
    collection=[(1, 'a'), (2, 'b'), (3, 'c')],
    type_info=Types.ROW([Types.INT(), Types.STRING()])
)

# Map transformation
class MyMapFunction(MapFunction):
    def map(self, value):
        return (value[0] * 2, value[1].upper())

mapped = ds.map(MyMapFunction(), output_type=Types.ROW([Types.INT(), Types.STRING()]))

# Filter transformation
class MyFilterFunction(FilterFunction):
    def filter(self, value):
        return value[0] > 1

filtered = ds.filter(MyFilterFunction())

# FlatMap transformation
class MyFlatMapFunction(FlatMapFunction):
    def flat_map(self, value):
        for i in range(value[0]):
            yield (i, value[1])

flat_mapped = ds.flat_map(MyFlatMapFunction())

# KeyBy and reduce
keyed = ds.key_by(lambda x: x[1])

# Execute
env.execute("PyFlink Example")
```

## Table API and SQL

### Table API Basics

The Table API provides a relational abstraction on top of Flink, allowing you to express streaming computations using SQL-like operations.

```java
import org.apache.flink.table.api.*;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;

public class TableAPIExample {
    public static void main(String[] args) {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

        // Create a table from a DataStream
        DataStream<Order> orderStream = ...;
        Table orderTable = tableEnv.fromDataStream(orderStream);

        // Table API operations
        Table result = orderTable
            .filter($("amount").isGreater(100))
            .groupBy($("userId"))
            .select($("userId"), $("amount").sum().as("totalAmount"));

        // Convert back to DataStream
        DataStream<Row> resultStream = tableEnv.toDataStream(result);
    }
}
```

### SQL Support

Flink provides full SQL support for both batch and streaming queries.

```java
import org.apache.flink.table.api.*;

// Create table environment
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

// Register a table using DDL
tableEnv.executeSql("""
    CREATE TABLE orders (
        order_id STRING,
        user_id STRING,
        amount DECIMAL(10, 2),
        order_time TIMESTAMP(3),
        WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND
    ) WITH (
        'connector' = 'kafka',
        'topic' = 'orders',
        'properties.bootstrap.servers' = 'localhost:9092',
        'format' = 'json'
    )
""");

// Execute SQL queries
Table result = tableEnv.sqlQuery("""
    SELECT
        user_id,
        COUNT(*) as order_count,
        SUM(amount) as total_amount
    FROM orders
    WHERE amount > 100
    GROUP BY user_id
""");

// Window aggregations in SQL
Table windowedResult = tableEnv.sqlQuery("""
    SELECT
        user_id,
        TUMBLE_START(order_time, INTERVAL '1' HOUR) as window_start,
        TUMBLE_END(order_time, INTERVAL '1' HOUR) as window_end,
        COUNT(*) as order_count,
        SUM(amount) as total_amount
    FROM orders
    GROUP BY
        user_id,
        TUMBLE(order_time, INTERVAL '1' HOUR)
""");

// Insert results into a sink
tableEnv.executeSql("""
    CREATE TABLE user_summary (
        user_id STRING,
        order_count BIGINT,
        total_amount DECIMAL(10, 2),
        PRIMARY KEY (user_id) NOT ENFORCED
    ) WITH (
        'connector' = 'jdbc',
        'url' = 'jdbc:mysql://localhost:3306/analytics',
        'table-name' = 'user_summary',
        'username' = 'root',
        'password' = 'password'
    )
""");

tableEnv.executeSql("""
    INSERT INTO user_summary
    SELECT user_id, order_count, total_amount
    FROM (
        SELECT user_id, COUNT(*) as order_count, SUM(amount) as total_amount
        FROM orders
        GROUP BY user_id
    )
""");
```

### PyFlink Table API and SQL

```python
from pyflink.table import EnvironmentSettings, TableEnvironment
from pyflink.table.expressions import col, lit

# Create table environment
env_settings = EnvironmentSettings.in_streaming_mode()
table_env = TableEnvironment.create(env_settings)

# Create source table
table_env.execute_sql("""
    CREATE TABLE source_table (
        id INT,
        name STRING,
        amount DECIMAL(10, 2),
        event_time TIMESTAMP(3),
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
    ) WITH (
        'connector' = 'kafka',
        'topic' = 'input_topic',
        'properties.bootstrap.servers' = 'localhost:9092',
        'format' = 'json',
        'scan.startup.mode' = 'earliest-offset'
    )
""")

# Table API operations
source = table_env.from_path("source_table")
result = source \
    .filter(col("amount") > 100) \
    .group_by(col("name")) \
    .select(
        col("name"),
        col("amount").sum.alias("total_amount"),
        col("id").count.alias("count")
    )

# SQL query
result_sql = table_env.sql_query("""
    SELECT
        name,
        SUM(amount) as total_amount,
        COUNT(id) as count
    FROM source_table
    WHERE amount > 100
    GROUP BY name
""")

# Create sink and insert
table_env.execute_sql("""
    CREATE TABLE sink_table (
        name STRING,
        total_amount DECIMAL(10, 2),
        count BIGINT,
        PRIMARY KEY (name) NOT ENFORCED
    ) WITH (
        'connector' = 'print'
    )
""")

result.execute_insert("sink_table")
```

## Event Time vs Processing Time

### Time Semantics in Flink

Flink supports three notions of time for stream processing:

| Time Type | Description | Use Case |
|-----------|-------------|----------|
| **Event Time** | Time when event occurred (embedded in data) | Correct results regardless of processing delays |
| **Processing Time** | Time when event is processed by operator | Lowest latency, but results depend on processing speed |
| **Ingestion Time** | Time when event enters Flink | Compromise between event time and processing time |

```java
import org.apache.flink.streaming.api.TimeCharacteristic;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

// Set time characteristic (deprecated in Flink 1.12+, use watermark strategy instead)
// env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime);

// Modern approach: Assign watermarks with event time
DataStream<Event> events = source
    .assignTimestampsAndWatermarks(
        WatermarkStrategy
            .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
            .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
    );
```

### Event Time Example

```java
import org.apache.flink.api.common.eventtime.*;
import org.apache.flink.streaming.api.windowing.time.Time;

public class EventTimeExample {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<Event> events = env.addSource(new EventSource())
            .assignTimestampsAndWatermarks(
                WatermarkStrategy
                    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(10))
                    .withTimestampAssigner((event, timestamp) -> event.getEventTime())
                    .withIdleness(Duration.ofMinutes(1))  // Handle idle partitions
            );

        // Window based on event time
        DataStream<EventStats> stats = events
            .keyBy(Event::getUserId)
            .window(TumblingEventTimeWindows.of(Time.minutes(5)))
            .aggregate(new EventAggregator());

        stats.print();
        env.execute("Event Time Processing");
    }
}
```

### Processing Time Example

```java
import org.apache.flink.streaming.api.windowing.assigners.TumblingProcessingTimeWindows;
import org.apache.flink.streaming.api.windowing.time.Time;

// Processing time windows - simpler but less accurate
DataStream<EventStats> stats = events
    .keyBy(Event::getUserId)
    .window(TumblingProcessingTimeWindows.of(Time.minutes(5)))
    .aggregate(new EventAggregator());
```

### Comparing Time Semantics

```java
// Event Time: Consistent results, handles late data
// - Results are deterministic and reproducible
// - Requires watermarks to track progress
// - Can handle out-of-order events
// - Higher latency due to waiting for watermarks

// Processing Time: Fast but inconsistent
// - Results depend on processing speed
// - No watermark overhead
// - Cannot handle out-of-order events correctly
// - Lowest latency

// Example: Click-through rate calculation
// With Event Time:
clicks.keyBy(click -> click.getAdId())
    .window(TumblingEventTimeWindows.of(Time.hours(1)))
    .aggregate(new ClickCounter());

// With Processing Time (simpler but less accurate):
clicks.keyBy(click -> click.getAdId())
    .window(TumblingProcessingTimeWindows.of(Time.hours(1)))
    .aggregate(new ClickCounter());
```

## Watermarks

### Understanding Watermarks

Watermarks are Flink's mechanism for tracking event time progress. They signal that no events with timestamps older than the watermark should arrive.

```
Event Stream:    [e1:10] [e2:12] [e3:9] [e4:15] [e5:11] [e6:20]
                    |       |      |       |       |       |
                   10s     12s    9s     15s     11s     20s

Watermarks:      W(5)    W(7)   W(7)   W(10)   W(10)   W(15)
                (10-5)  (12-5)  (no update, 9<12)  (15-5)   (20-5)
```

### Watermark Strategies

```java
import org.apache.flink.api.common.eventtime.*;

// Strategy 1: Bounded Out-of-Orderness (most common)
// Allows events to be late by up to maxOutOfOrderness
WatermarkStrategy<Event> strategy = WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
    .withTimestampAssigner((event, timestamp) -> event.getTimestamp());

// Strategy 2: Monotonously Increasing Timestamps
// For perfectly ordered streams (rare in practice)
WatermarkStrategy<Event> monotonous = WatermarkStrategy
    .<Event>forMonotonousTimestamps()
    .withTimestampAssigner((event, timestamp) -> event.getTimestamp());

// Strategy 3: Custom Watermark Generator
WatermarkStrategy<Event> custom = WatermarkStrategy
    .<Event>forGenerator(ctx -> new CustomWatermarkGenerator())
    .withTimestampAssigner((event, timestamp) -> event.getTimestamp());

// Apply watermark strategy to stream
DataStream<Event> withWatermarks = events.assignTimestampsAndWatermarks(strategy);
```

### Custom Watermark Generator

```java
import org.apache.flink.api.common.eventtime.*;

public class CustomWatermarkGenerator implements WatermarkGenerator<Event> {
    private long maxTimestamp = Long.MIN_VALUE;
    private final long maxOutOfOrderness = 5000; // 5 seconds

    @Override
    public void onEvent(Event event, long eventTimestamp, WatermarkOutput output) {
        maxTimestamp = Math.max(maxTimestamp, eventTimestamp);
    }

    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        // Emit watermark periodically
        output.emitWatermark(new Watermark(maxTimestamp - maxOutOfOrderness - 1));
    }
}

// Punctuated watermarks (emit based on events)
public class PunctuatedWatermarkGenerator implements WatermarkGenerator<Event> {
    @Override
    public void onEvent(Event event, long eventTimestamp, WatermarkOutput output) {
        // Emit watermark when seeing special marker events
        if (event.isWatermarkMarker()) {
            output.emitWatermark(new Watermark(event.getTimestamp()));
        }
    }

    @Override
    public void onPeriodicEmit(WatermarkOutput output) {
        // No periodic emission in punctuated mode
    }
}
```

### Handling Late Data

```java
import org.apache.flink.streaming.api.windowing.time.Time;
import org.apache.flink.util.OutputTag;

// Define side output for late data
final OutputTag<Event> lateDataTag = new OutputTag<Event>("late-data"){};

DataStream<EventStats> result = events
    .keyBy(Event::getUserId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .allowedLateness(Time.minutes(1))  // Allow late data up to 1 minute
    .sideOutputLateData(lateDataTag)   // Send very late data to side output
    .aggregate(new EventAggregator());

// Get late data stream for separate processing
DataStream<Event> lateData = result.getSideOutput(lateDataTag);

// Process late data separately
lateData.map(event -> {
    // Log or store late events for analysis
    return "Late event: " + event;
}).print();
```

### Watermark Alignment

```java
// Handle idle sources that don't emit watermarks
WatermarkStrategy<Event> strategy = WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
    .withTimestampAssigner((event, timestamp) -> event.getTimestamp())
    .withIdleness(Duration.ofMinutes(1));  // Mark source idle after 1 minute

// Watermark alignment for multiple sources (Flink 1.15+)
// Ensures watermarks don't drift too far apart
env.getConfig().setAutoWatermarkInterval(200);  // Watermark interval in ms
```

## State Management

### Understanding State in Flink

State is a fundamental concept in Flink that enables stateful stream processing. Flink provides different types of state and handles fault tolerance automatically through checkpointing.

### Types of State

```java
import org.apache.flink.api.common.state.*;
import org.apache.flink.api.common.functions.RichFlatMapFunction;

public class StatefulFunction extends RichFlatMapFunction<Event, Result> {
    // ValueState: Single value per key
    private ValueState<Long> countState;

    // ListState: List of values per key
    private ListState<Event> eventListState;

    // MapState: Key-value pairs per key
    private MapState<String, Long> mapState;

    // ReducingState: Aggregated value using reduce function
    private ReducingState<Long> sumState;

    // AggregatingState: Aggregated value with different input/output types
    private AggregatingState<Event, Statistics> aggState;

    @Override
    public void open(Configuration parameters) {
        // Initialize ValueState
        ValueStateDescriptor<Long> countDescriptor =
            new ValueStateDescriptor<>("count", Long.class, 0L);
        countState = getRuntimeContext().getState(countDescriptor);

        // Initialize ListState
        ListStateDescriptor<Event> listDescriptor =
            new ListStateDescriptor<>("events", Event.class);
        eventListState = getRuntimeContext().getListState(listDescriptor);

        // Initialize MapState
        MapStateDescriptor<String, Long> mapDescriptor =
            new MapStateDescriptor<>("map", String.class, Long.class);
        mapState = getRuntimeContext().getMapState(mapDescriptor);

        // Initialize ReducingState
        ReducingStateDescriptor<Long> reduceDescriptor =
            new ReducingStateDescriptor<>("sum", Long::sum, Long.class);
        sumState = getRuntimeContext().getReducingState(reduceDescriptor);
    }

    @Override
    public void flatMap(Event event, Collector<Result> out) throws Exception {
        // Read and update ValueState
        Long count = countState.value();
        count = (count == null) ? 1L : count + 1;
        countState.update(count);

        // Use ListState
        eventListState.add(event);

        // Use MapState
        String category = event.getCategory();
        Long categoryCount = mapState.get(category);
        mapState.put(category, categoryCount == null ? 1L : categoryCount + 1);

        // Use ReducingState
        sumState.add(event.getAmount());

        // Emit result
        out.collect(new Result(event.getUserId(), count, sumState.get()));
    }
}
```

### State TTL (Time-to-Live)

```java
import org.apache.flink.api.common.state.StateTtlConfig;
import org.apache.flink.api.common.time.Time;

// Configure state TTL
StateTtlConfig ttlConfig = StateTtlConfig
    .newBuilder(Time.hours(24))                         // TTL duration
    .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)  // When to refresh TTL
    .setStateVisibility(StateTtlConfig.StateVisibility.NeverReturnExpired)
    .cleanupFullSnapshot()                              // Cleanup during checkpoint
    .build();

// Apply TTL to state descriptor
ValueStateDescriptor<Long> descriptor = new ValueStateDescriptor<>("count", Long.class);
descriptor.enableTimeToLive(ttlConfig);

// Incremental cleanup (for RocksDB backend)
StateTtlConfig ttlWithCleanup = StateTtlConfig
    .newBuilder(Time.hours(24))
    .cleanupIncrementally(100, true)  // Clean 100 entries per access
    .build();
```

### Operator State vs Keyed State

```java
import org.apache.flink.streaming.api.checkpoint.CheckpointedFunction;
import org.apache.flink.runtime.state.FunctionInitializationContext;
import org.apache.flink.runtime.state.FunctionSnapshotContext;

// Keyed State: Scoped to key (used with keyBy)
public class KeyedStateExample extends RichMapFunction<Event, Result> {
    private ValueState<Long> state;  // One state per key

    @Override
    public void open(Configuration config) {
        state = getRuntimeContext().getState(
            new ValueStateDescriptor<>("state", Long.class));
    }

    @Override
    public Result map(Event event) throws Exception {
        Long current = state.value();
        state.update(current == null ? 1L : current + 1);
        return new Result(event.getId(), state.value());
    }
}

// Operator State: Scoped to operator instance (used for sources, sinks)
public class OperatorStateExample implements
        FlatMapFunction<String, String>, CheckpointedFunction {

    private transient ListState<Long> offsetState;
    private List<Long> offsets = new ArrayList<>();

    @Override
    public void snapshotState(FunctionSnapshotContext context) throws Exception {
        offsetState.clear();
        offsetState.addAll(offsets);
    }

    @Override
    public void initializeState(FunctionInitializationContext context) throws Exception {
        ListStateDescriptor<Long> descriptor =
            new ListStateDescriptor<>("offsets", Long.class);
        offsetState = context.getOperatorStateStore().getListState(descriptor);

        // Restore from checkpoint
        if (context.isRestored()) {
            offsets = new ArrayList<>();
            for (Long offset : offsetState.get()) {
                offsets.add(offset);
            }
        }
    }

    @Override
    public void flatMap(String value, Collector<String> out) {
        // Process and track offsets
    }
}
```

### Broadcast State

```java
import org.apache.flink.streaming.api.datastream.BroadcastStream;
import org.apache.flink.streaming.api.functions.co.BroadcastProcessFunction;

// Define broadcast state descriptor
MapStateDescriptor<String, Rule> ruleStateDescriptor =
    new MapStateDescriptor<>("rules", String.class, Rule.class);

// Create broadcast stream
BroadcastStream<Rule> ruleBroadcast = rules.broadcast(ruleStateDescriptor);

// Connect main stream with broadcast stream
DataStream<Alert> alerts = events
    .connect(ruleBroadcast)
    .process(new BroadcastProcessFunction<Event, Rule, Alert>() {
        @Override
        public void processElement(Event event, ReadOnlyContext ctx, Collector<Alert> out) {
            // Read-only access to broadcast state
            ReadOnlyBroadcastState<String, Rule> rules =
                ctx.getBroadcastState(ruleStateDescriptor);

            Rule rule = rules.get(event.getType());
            if (rule != null && rule.matches(event)) {
                out.collect(new Alert(event, rule));
            }
        }

        @Override
        public void processBroadcastElement(Rule rule, Context ctx, Collector<Alert> out) {
            // Update broadcast state (write access)
            BroadcastState<String, Rule> rules =
                ctx.getBroadcastState(ruleStateDescriptor);
            rules.put(rule.getType(), rule);
        }
    });
```

## Checkpointing

### Checkpoint Configuration

Checkpointing is Flink's mechanism for fault tolerance, periodically saving the state of all operators.

```java
import org.apache.flink.streaming.api.CheckpointingMode;
import org.apache.flink.streaming.api.environment.CheckpointConfig;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

// Enable checkpointing with interval
env.enableCheckpointing(60000);  // Every 60 seconds

// Advanced checkpoint configuration
CheckpointConfig config = env.getCheckpointConfig();

// Exactly-once vs at-least-once semantics
config.setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);

// Minimum time between checkpoints
config.setMinPauseBetweenCheckpoints(30000);  // 30 seconds

// Maximum concurrent checkpoints
config.setMaxConcurrentCheckpoints(1);

// Checkpoint timeout
config.setCheckpointTimeout(600000);  // 10 minutes

// Tolerable checkpoint failures
config.setTolerableCheckpointFailureNumber(3);

// Enable unaligned checkpoints (faster for backpressure)
config.enableUnalignedCheckpoints();

// Externalized checkpoints (retain on cancellation)
config.setExternalizedCheckpointCleanup(
    CheckpointConfig.ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);

// Checkpoint storage
config.setCheckpointStorage("hdfs:///checkpoints");
// Or use filesystem
config.setCheckpointStorage("file:///tmp/checkpoints");
```

### State Backends

```java
import org.apache.flink.contrib.streaming.state.EmbeddedRocksDBStateBackend;
import org.apache.flink.runtime.state.hashmap.HashMapStateBackend;

// HashMapStateBackend (default): State stored in JVM heap
env.setStateBackend(new HashMapStateBackend());

// RocksDBStateBackend: State stored in RocksDB (supports large state)
env.setStateBackend(new EmbeddedRocksDBStateBackend());

// Configure RocksDB options
EmbeddedRocksDBStateBackend rocksDB = new EmbeddedRocksDBStateBackend();
rocksDB.setDbStoragePath("/path/to/rocksdb");
rocksDB.setPredefinedOptions(PredefinedOptions.SPINNING_DISK_OPTIMIZED);
env.setStateBackend(rocksDB);
```

### Savepoints

```java
// Savepoints are manually triggered checkpoints for upgrades/migrations

// Trigger savepoint via CLI
// $ flink savepoint <jobId> /path/to/savepoint

// Resume from savepoint
// $ flink run -s /path/to/savepoint myJob.jar

// Programmatic savepoint trigger
// CompletableFuture<String> savepointPath =
//     clusterClient.triggerSavepoint(jobId, savepointDirectory);

// Savepoint compatibility
// - Add operators: Supported (new state initialized empty)
// - Remove operators: Supported (state discarded)
// - Reorder operators: Not supported (use UID)
// - Change parallelism: Supported

// Assign UIDs for savepoint compatibility
DataStream<Result> result = source
    .uid("source-uid")       // Unique identifier for savepoint
    .name("My Source")
    .map(new MyMapper())
    .uid("mapper-uid")
    .name("My Mapper")
    .keyBy(...)
    .process(new MyProcessor())
    .uid("processor-uid")
    .name("My Processor");
```

### Incremental Checkpoints

```java
import org.apache.flink.contrib.streaming.state.EmbeddedRocksDBStateBackend;

// Enable incremental checkpoints for RocksDB
// Only changes since last checkpoint are uploaded
EmbeddedRocksDBStateBackend rocksDB = new EmbeddedRocksDBStateBackend(true);  // true = incremental
env.setStateBackend(rocksDB);

// Benefits:
// - Faster checkpoint times for large state
// - Less storage required
// - Reduced network I/O during checkpointing
```

## Window Operations

### Window Types

```java
import org.apache.flink.streaming.api.windowing.assigners.*;
import org.apache.flink.streaming.api.windowing.time.Time;

// Tumbling Window: Fixed-size, non-overlapping
events.keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new MyAggregator());

// Sliding Window: Fixed-size, overlapping
events.keyBy(Event::getKey)
    .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(5)))  // 10min window, 5min slide
    .aggregate(new MyAggregator());

// Session Window: Dynamic gaps
events.keyBy(Event::getKey)
    .window(EventTimeSessionWindows.withGap(Time.minutes(30)))  // Close window after 30min inactivity
    .aggregate(new MyAggregator());

// Global Window: All events in one window (requires custom trigger)
events.keyBy(Event::getKey)
    .window(GlobalWindows.create())
    .trigger(CountTrigger.of(100))  // Trigger every 100 elements
    .aggregate(new MyAggregator());

// Count Window: Fixed number of elements
events.keyBy(Event::getKey)
    .countWindow(100)              // Tumbling count window
    .aggregate(new MyAggregator());

events.keyBy(Event::getKey)
    .countWindow(100, 10)          // Sliding count window (100 elements, slide 10)
    .aggregate(new MyAggregator());
```

### Window Functions

```java
import org.apache.flink.streaming.api.functions.windowing.*;
import org.apache.flink.api.common.functions.*;

// ReduceFunction: Incremental aggregation
events.keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .reduce((e1, e2) -> new Event(e1.getKey(), e1.getValue() + e2.getValue()));

// AggregateFunction: Incremental with different types
public class AverageAggregate implements AggregateFunction<Event, Tuple2<Long, Long>, Double> {
    @Override
    public Tuple2<Long, Long> createAccumulator() {
        return Tuple2.of(0L, 0L);  // (sum, count)
    }

    @Override
    public Tuple2<Long, Long> add(Event event, Tuple2<Long, Long> acc) {
        return Tuple2.of(acc.f0 + event.getValue(), acc.f1 + 1);
    }

    @Override
    public Double getResult(Tuple2<Long, Long> acc) {
        return acc.f0.doubleValue() / acc.f1;
    }

    @Override
    public Tuple2<Long, Long> merge(Tuple2<Long, Long> a, Tuple2<Long, Long> b) {
        return Tuple2.of(a.f0 + b.f0, a.f1 + b.f1);
    }
}

// ProcessWindowFunction: Access to window metadata
public class MyProcessWindowFunction
        extends ProcessWindowFunction<Event, Result, String, TimeWindow> {
    @Override
    public void process(String key, Context context, Iterable<Event> events,
                       Collector<Result> out) {
        long count = 0;
        long sum = 0;
        for (Event e : events) {
            count++;
            sum += e.getValue();
        }

        TimeWindow window = context.window();
        out.collect(new Result(
            key,
            sum / count,
            window.getStart(),
            window.getEnd()
        ));
    }
}

// Combine incremental and full for efficiency
events.keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .aggregate(new AverageAggregate(), new MyProcessWindowFunction());
```

### Window Triggers and Evictors

```java
import org.apache.flink.streaming.api.windowing.triggers.*;
import org.apache.flink.streaming.api.windowing.evictors.*;

// Custom Trigger
events.keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.hours(1)))
    .trigger(new Trigger<Event, TimeWindow>() {
        @Override
        public TriggerResult onElement(Event event, long timestamp,
                TimeWindow window, TriggerContext ctx) {
            // Trigger early if we see urgent event
            if (event.isUrgent()) {
                return TriggerResult.FIRE;
            }
            return TriggerResult.CONTINUE;
        }

        @Override
        public TriggerResult onProcessingTime(long time, TimeWindow window,
                TriggerContext ctx) {
            return TriggerResult.CONTINUE;
        }

        @Override
        public TriggerResult onEventTime(long time, TimeWindow window,
                TriggerContext ctx) {
            return time >= window.maxTimestamp() ?
                TriggerResult.FIRE_AND_PURGE : TriggerResult.CONTINUE;
        }

        @Override
        public void clear(TimeWindow window, TriggerContext ctx) {}
    });

// Evictors: Remove elements before window function
events.keyBy(Event::getKey)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)))
    .evictor(TimeEvictor.of(Time.minutes(1)))  // Keep only last 1 minute
    .aggregate(new MyAggregator());

// CountEvictor: Keep only last N elements
events.keyBy(Event::getKey)
    .window(GlobalWindows.create())
    .trigger(CountTrigger.of(100))
    .evictor(CountEvictor.of(10))  // Keep only last 10 elements
    .process(new MyWindowFunction());
```

## Connectors and Sources/Sinks

### Kafka Connector

```java
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;

// Kafka Source
KafkaSource<Event> kafkaSource = KafkaSource.<Event>builder()
    .setBootstrapServers("localhost:9092")
    .setTopics("input-topic")
    .setGroupId("my-consumer-group")
    .setStartingOffsets(OffsetsInitializer.earliest())
    .setValueOnlyDeserializer(new EventDeserializationSchema())
    .build();

DataStream<Event> events = env.fromSource(
    kafkaSource,
    WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(5)),
    "Kafka Source"
);

// Kafka Sink
KafkaSink<Event> kafkaSink = KafkaSink.<Event>builder()
    .setBootstrapServers("localhost:9092")
    .setRecordSerializer(KafkaRecordSerializationSchema.builder()
        .setTopic("output-topic")
        .setValueSerializationSchema(new EventSerializationSchema())
        .build())
    .setDeliveryGuarantee(DeliveryGuarantee.EXACTLY_ONCE)
    .setTransactionalIdPrefix("flink-producer")
    .build();

events.sinkTo(kafkaSink);
```

### JDBC Connector

```java
import org.apache.flink.connector.jdbc.*;

// JDBC Sink
events.addSink(JdbcSink.sink(
    "INSERT INTO events (id, name, value) VALUES (?, ?, ?)",
    (statement, event) -> {
        statement.setLong(1, event.getId());
        statement.setString(2, event.getName());
        statement.setDouble(3, event.getValue());
    },
    JdbcExecutionOptions.builder()
        .withBatchSize(1000)
        .withBatchIntervalMs(200)
        .withMaxRetries(5)
        .build(),
    new JdbcConnectionOptions.JdbcConnectionOptionsBuilder()
        .withUrl("jdbc:postgresql://localhost:5432/mydb")
        .withDriverName("org.postgresql.Driver")
        .withUsername("user")
        .withPassword("password")
        .build()
));

// JDBC Source (Table API)
tableEnv.executeSql("""
    CREATE TABLE jdbc_source (
        id BIGINT,
        name STRING,
        value DOUBLE
    ) WITH (
        'connector' = 'jdbc',
        'url' = 'jdbc:postgresql://localhost:5432/mydb',
        'table-name' = 'events',
        'username' = 'user',
        'password' = 'password'
    )
""");
```

### File System Connector

```java
import org.apache.flink.connector.file.sink.FileSink;
import org.apache.flink.core.fs.Path;
import org.apache.flink.formats.parquet.avro.AvroParquetWriters;

// File Sink with Parquet format
FileSink<Event> fileSink = FileSink
    .forBulkFormat(new Path("hdfs:///output"), AvroParquetWriters.forReflectRecord(Event.class))
    .withRollingPolicy(
        DefaultRollingPolicy.builder()
            .withRolloverInterval(Duration.ofMinutes(15))
            .withInactivityInterval(Duration.ofMinutes(5))
            .withMaxPartSize(MemorySize.ofMebiBytes(128))
            .build())
    .withBucketAssigner(new DateTimeBucketAssigner<>("yyyy-MM-dd/HH"))
    .build();

events.sinkTo(fileSink);

// File Source
FileSource<String> fileSource = FileSource
    .forRecordStreamFormat(new TextLineInputFormat(), new Path("hdfs:///input"))
    .monitorContinuously(Duration.ofSeconds(10))  // For streaming
    .build();

DataStream<String> lines = env.fromSource(fileSource, WatermarkStrategy.noWatermarks(), "File Source");
```

### Elasticsearch Connector

```java
import org.apache.flink.connector.elasticsearch.sink.*;

// Elasticsearch Sink
ElasticsearchSink<Event> esSink = new ElasticsearchSinkBuilder<Event>()
    .setHosts(new HttpHost("localhost", 9200))
    .setEmitter((event, context, indexer) -> {
        indexer.add(
            Requests.indexRequest()
                .index("events")
                .id(String.valueOf(event.getId()))
                .source(Map.of(
                    "name", event.getName(),
                    "value", event.getValue(),
                    "timestamp", event.getTimestamp()
                ))
        );
    })
    .setBulkFlushMaxActions(1000)
    .setBulkFlushInterval(5000)
    .build();

events.sinkTo(esSink);
```

## Advanced Features

### Async I/O

```java
import org.apache.flink.streaming.api.functions.async.*;

// Async function for external service calls
public class AsyncDatabaseRequest extends RichAsyncFunction<Event, EnrichedEvent> {
    private transient DatabaseClient client;

    @Override
    public void open(Configuration parameters) {
        client = new DatabaseClient();
    }

    @Override
    public void asyncInvoke(Event event, ResultFuture<EnrichedEvent> resultFuture) {
        CompletableFuture<UserInfo> future = client.queryUserAsync(event.getUserId());

        future.thenAccept(userInfo -> {
            resultFuture.complete(Collections.singleton(
                new EnrichedEvent(event, userInfo)
            ));
        }).exceptionally(throwable -> {
            resultFuture.completeExceptionally(throwable);
            return null;
        });
    }

    @Override
    public void timeout(Event event, ResultFuture<EnrichedEvent> resultFuture) {
        resultFuture.complete(Collections.singleton(
            new EnrichedEvent(event, UserInfo.unknown())
        ));
    }
}

// Apply async function
DataStream<EnrichedEvent> enriched = AsyncDataStream
    .unorderedWait(
        events,
        new AsyncDatabaseRequest(),
        1000,  // Timeout in ms
        TimeUnit.MILLISECONDS,
        100    // Capacity (max concurrent requests)
    );

// Ordered wait (maintains order but higher latency)
DataStream<EnrichedEvent> orderedEnriched = AsyncDataStream
    .orderedWait(events, new AsyncDatabaseRequest(), 1000, TimeUnit.MILLISECONDS, 100);
```

### Side Outputs

```java
import org.apache.flink.util.OutputTag;
import org.apache.flink.streaming.api.functions.ProcessFunction;

// Define output tags
final OutputTag<Event> rejectedTag = new OutputTag<Event>("rejected"){};
final OutputTag<Alert> alertTag = new OutputTag<Alert>("alerts"){};

// Process function with side outputs
DataStream<Event> mainOutput = events.process(new ProcessFunction<Event, Event>() {
    @Override
    public void processElement(Event event, Context ctx, Collector<Event> out) {
        if (!event.isValid()) {
            // Send to rejected side output
            ctx.output(rejectedTag, event);
        } else if (event.isAnomalous()) {
            // Send alert to side output
            ctx.output(alertTag, new Alert(event, "Anomaly detected"));
            out.collect(event);  // Also send to main output
        } else {
            out.collect(event);
        }
    }
});

// Get side output streams
DataStream<Event> rejected = mainOutput.getSideOutput(rejectedTag);
DataStream<Alert> alerts = mainOutput.getSideOutput(alertTag);

// Process side outputs separately
rejected.addSink(new RejectedEventSink());
alerts.addSink(new AlertSink());
```

### Process Function

```java
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.api.common.state.*;

// KeyedProcessFunction with timers
public class FraudDetector extends KeyedProcessFunction<String, Transaction, Alert> {
    private ValueState<Transaction> lastTransaction;
    private ValueState<Long> timerState;

    @Override
    public void open(Configuration parameters) {
        lastTransaction = getRuntimeContext().getState(
            new ValueStateDescriptor<>("last-tx", Transaction.class));
        timerState = getRuntimeContext().getState(
            new ValueStateDescriptor<>("timer", Long.class));
    }

    @Override
    public void processElement(Transaction tx, Context ctx, Collector<Alert> out)
            throws Exception {
        Transaction last = lastTransaction.value();

        if (last != null) {
            // Check for suspicious pattern
            if (tx.getAmount() > 10000 &&
                tx.getTimestamp() - last.getTimestamp() < 60000) {
                out.collect(new Alert(tx.getUserId(), "Suspicious rapid transaction"));
            }
        }

        lastTransaction.update(tx);

        // Register timer to clear state after 24 hours
        long cleanupTime = ctx.timerService().currentProcessingTime() + 86400000;
        ctx.timerService().registerProcessingTimeTimer(cleanupTime);
        timerState.update(cleanupTime);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<Alert> out)
            throws Exception {
        // Clear state when timer fires
        lastTransaction.clear();
        timerState.clear();
    }
}
```

### CEP (Complex Event Processing)

```java
import org.apache.flink.cep.*;
import org.apache.flink.cep.pattern.*;
import org.apache.flink.cep.pattern.conditions.*;

// Define a pattern
Pattern<Event, ?> pattern = Pattern.<Event>begin("start")
    .where(new SimpleCondition<Event>() {
        @Override
        public boolean filter(Event event) {
            return event.getType().equals("login");
        }
    })
    .next("middle")
    .where(new SimpleCondition<Event>() {
        @Override
        public boolean filter(Event event) {
            return event.getType().equals("purchase");
        }
    })
    .within(Time.minutes(10));

// Apply pattern to stream
PatternStream<Event> patternStream = CEP.pattern(
    events.keyBy(Event::getUserId),
    pattern
);

// Select matching patterns
DataStream<Alert> alerts = patternStream.select(
    new PatternSelectFunction<Event, Alert>() {
        @Override
        public Alert select(Map<String, List<Event>> pattern) {
            Event login = pattern.get("start").get(0);
            Event purchase = pattern.get("middle").get(0);
            return new Alert(login.getUserId(),
                "Quick purchase after login",
                purchase.getAmount());
        }
    }
);

// Complex pattern with iterations
Pattern<Event, ?> fraudPattern = Pattern.<Event>begin("first")
    .where(event -> event.getType().equals("login-failed"))
    .times(3)  // Exactly 3 failed logins
    .consecutive()  // Must be consecutive
    .followedBy("success")
    .where(event -> event.getType().equals("login-success"))
    .within(Time.minutes(5));
```

## Best Practices and Optimization

### Performance Tuning

```java
// Parallelism configuration
env.setParallelism(16);  // Global parallelism
dataStream.setParallelism(8);  // Per-operator parallelism

// Disable operator chaining for debugging
env.disableOperatorChaining();

// Or selectively disable
dataStream
    .map(new HeavyMapper())
    .disableChaining()  // Force separate task slot
    .filter(new SimpleFilter())
    .startNewChain();   // Start new operator chain

// Buffer timeout for latency tuning
env.setBufferTimeout(10);  // Flush buffers every 10ms (lower = lower latency)
env.setBufferTimeout(-1);  // Disable (flush only when full - higher throughput)

// Network memory tuning
// flink-conf.yaml:
// taskmanager.memory.network.min: 64mb
// taskmanager.memory.network.max: 1gb
// taskmanager.memory.network.fraction: 0.1

// Managed memory for RocksDB
// taskmanager.memory.managed.fraction: 0.4
```

### Memory Management

```java
// Configure managed memory for state backend
// In flink-conf.yaml:
// taskmanager.memory.process.size: 4096m
// taskmanager.memory.managed.fraction: 0.4
// taskmanager.memory.task.heap.size: 1024m

// RocksDB memory configuration
EmbeddedRocksDBStateBackend rocksDB = new EmbeddedRocksDBStateBackend();
rocksDB.setRocksDBOptions(new OptionsFactory() {
    @Override
    public DBOptions createDBOptions(DBOptions currentOptions, Collection<AutoCloseable> handlesToClose) {
        return currentOptions
            .setMaxBackgroundJobs(4)
            .setMaxOpenFiles(5000);
    }

    @Override
    public ColumnFamilyOptions createColumnOptions(ColumnFamilyOptions currentOptions, Collection<AutoCloseable> handlesToClose) {
        return currentOptions
            .setWriteBufferSize(64 * 1024 * 1024)
            .setMaxWriteBufferNumber(3);
    }
});
```

### Serialization

```java
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.api.common.typeinfo.TypeHint;

// Register custom serializers for better performance
env.getConfig().registerTypeWithKryoSerializer(MyClass.class, MySerializer.class);

// Use Flink's POJO serializer (most efficient for POJOs)
// Requirements: public class, default constructor, all fields accessible
public class Event {
    public String id;
    public long timestamp;
    public double value;

    public Event() {} // Default constructor required

    // Getters and setters
}

// Provide TypeInformation explicitly for generics
DataStream<Tuple2<String, Integer>> result = stream
    .map(new MapFunction<Event, Tuple2<String, Integer>>() {
        @Override
        public Tuple2<String, Integer> map(Event event) {
            return Tuple2.of(event.getId(), 1);
        }
    })
    .returns(new TypeHint<Tuple2<String, Integer>>() {});
```

### Monitoring and Debugging

```java
// Add metrics
public class CountingMapper extends RichMapFunction<Event, Event> {
    private transient Counter counter;

    @Override
    public void open(Configuration parameters) {
        counter = getRuntimeContext()
            .getMetricGroup()
            .counter("processedEvents");
    }

    @Override
    public Event map(Event event) {
        counter.inc();
        return event;
    }
}

// Custom metrics
public class MetricsExample extends RichMapFunction<Event, Event> {
    private transient Meter eventMeter;
    private transient Histogram latencyHistogram;
    private transient Gauge<Long> queueSizeGauge;

    private long queueSize = 0;

    @Override
    public void open(Configuration parameters) {
        MetricGroup metrics = getRuntimeContext().getMetricGroup();

        eventMeter = metrics.meter("events", new MeterView(60));
        latencyHistogram = metrics.histogram("latency", new DescriptiveStatisticsHistogram(1000));
        queueSizeGauge = metrics.gauge("queueSize", () -> queueSize);
    }

    @Override
    public Event map(Event event) {
        long start = System.currentTimeMillis();
        // Process event
        latencyHistogram.update(System.currentTimeMillis() - start);
        eventMeter.markEvent();
        return event;
    }
}

// Logging for debugging
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingMapper extends RichMapFunction<Event, Event> {
    private static final Logger LOG = LoggerFactory.getLogger(LoggingMapper.class);

    @Override
    public Event map(Event event) {
        LOG.debug("Processing event: {}", event);
        return event;
    }
}
```

## Interview Key Points

### Flink vs Spark Streaming

| Feature | Flink | Spark Streaming |
|---------|-------|-----------------|
| Processing Model | True streaming (event-by-event) | Micro-batch |
| Latency | Milliseconds | Seconds |
| State Management | First-class support, large state | Limited |
| Exactly-Once | Native support | Requires careful setup |
| Event Time | Native with watermarks | Structured Streaming only |
| Backpressure | Automatic | Manual tuning |
| SQL Support | Flink SQL | Spark SQL |

### Exactly-Once Semantics

```
Flink achieves exactly-once through:
1. Checkpointing: Periodic consistent snapshots of state
2. Barriers: Alignment markers flowing through the stream
3. Two-Phase Commit: For exactly-once sinks (Kafka, JDBC)
4. Chandy-Lamport algorithm: Distributed snapshot algorithm

Levels:
- At-least-once: May have duplicates on failure
- Exactly-once internal: Correct internal state
- End-to-end exactly-once: Requires transactional sinks
```

### Watermarks and Late Data

```java
// Key concepts:
// - Watermark W(t) means: No events with timestamp < t will arrive
// - Late data: Events arriving after watermark
// - Allowed lateness: Grace period for late data
// - Side outputs: Handle very late data separately

// Best practices:
// 1. Set out-of-orderness based on data characteristics
// 2. Use allowed lateness for important late data
// 3. Monitor watermark lag in production
// 4. Handle idle sources with withIdleness()
```

### State and Checkpointing

```java
// State types:
// - ValueState: Single value per key
// - ListState: List of values per key
// - MapState: Key-value map per key
// - ReducingState: Incrementally aggregated value
// - AggregatingState: Aggregated with type transformation

// Checkpointing modes:
// - Aligned: Consistent but can cause backpressure
// - Unaligned: Faster but larger checkpoints

// State backends:
// - HashMapStateBackend: In-memory, fast but limited size
// - RocksDBStateBackend: Disk-based, large state support
```

### Window Operations

```java
// Window types:
// - Tumbling: Fixed-size, non-overlapping
// - Sliding: Fixed-size, overlapping
// - Session: Dynamic size based on gaps
// - Global: Single window, custom trigger

// Window functions:
// - ReduceFunction: Incremental, same type
// - AggregateFunction: Incremental, different types
// - ProcessWindowFunction: Full access to window

// Optimization: Combine aggregate with process for efficiency
```

### Common Optimization Techniques

```java
// 1. Avoid shuffles when possible
// Use keyBy strategically, consider pre-aggregation

// 2. Choose appropriate parallelism
// - Too low: Underutilization
// - Too high: Overhead from coordination

// 3. Use incremental aggregation
// ReduceFunction and AggregateFunction over ProcessWindowFunction

// 4. Configure proper state backend
// RocksDB for large state, HashMapStateBackend for speed

// 5. Tune checkpointing
// Balance checkpoint interval vs recovery time

// 6. Use async I/O for external calls
// Don't block operators with synchronous calls

// 7. Enable object reuse (carefully)
env.getConfig().enableObjectReuse();  // Danger: must not modify objects
```

## Further Reading

### Official Resources

- [Apache Flink Official Documentation](https://flink.apache.org/docs/)
- [Flink Training Exercises](https://github.com/apache/flink-training)
- [Flink Improvement Proposals (FLIPs)](https://cwiki.apache.org/confluence/display/FLINK/Flink+Improvement+Proposals)
- [Flink Mailing Lists](https://flink.apache.org/community.html#mailing-lists)

### Recommended Books

- **"Stream Processing with Apache Flink"** - Fabian Hueske, Vasiliki Kalavri
- **"Learning Apache Flink"** - Tanmay Deshpande
- **"Streaming Systems"** - Tyler Akidau, Slava Chernyak, Reuven Lax

### Related Technologies

- **Apache Kafka**: Distributed event streaming platform
- **Apache Pulsar**: Cloud-native messaging and streaming
- **Apache Beam**: Unified programming model for batch and stream
- **Confluent Platform**: Enterprise Kafka with Flink integration
- **Amazon Kinesis Data Analytics**: Managed Flink on AWS
- **Google Cloud Dataflow**: Managed Apache Beam service

### Practice Projects

- Real-time fraud detection system
- Streaming ETL pipeline with CDC
- Real-time recommendation engine
- IoT sensor data processing
- Log analysis and alerting platform
- Real-time dashboard with metrics aggregation

---

Apache Flink is a powerful framework for building real-time data processing applications. Its streaming-first architecture, sophisticated state management, and exactly-once guarantees make it ideal for mission-critical applications. After reading this guide, you should be able to: design efficient streaming pipelines, handle event time processing correctly, manage large state, and build fault-tolerant applications. Continue practicing with real-world use cases to master Flink's advanced features and optimization techniques.
