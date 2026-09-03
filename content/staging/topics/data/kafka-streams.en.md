---
title: Kafka Streams Processing
description: Build real-time stream processing applications with Kafka Streams
track: data
section: data-engineering
difficulty: advanced
tags:
  - Kafka
  - stream processing
  - real-time
  - event-driven
status: imported
origin: old/src/content/docs/data/kafka-streams.en.md
divergence: 0.323
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 15
  lastUpdated: 2026-01-07
---

Kafka Streams is a client library for building real-time, highly scalable, fault-tolerant stream processing applications on top of Apache Kafka. Unlike other stream processing frameworks that require separate cluster infrastructure, Kafka Streams runs as a standard Java application, making it significantly simpler to deploy and operate. We'll cover everything from basic concepts to advanced patterns for building production-grade streaming applications.

## Introduction to Kafka Streams

### What is Kafka Streams?

Kafka Streams is a lightweight stream processing library that enables you to build applications and microservices that process and analyze data stored in Kafka. It combines the simplicity of writing standard Java applications with the power of Kafka's distributed messaging system.

**Key characteristics:**

- **No separate cluster required**: Runs as a standard JVM application
- **Exactly-once processing semantics**: Guarantees each record is processed exactly once
- **Fault-tolerant local state**: State stores with automatic backup to Kafka
- **One record at a time processing**: True streaming with event-time support
- **Elastic and scalable**: Horizontally scales by adding more instances
- **Interactive queries**: Query local state stores directly

### Kafka Streams vs Other Stream Processors

| Feature | Kafka Streams | Apache Flink | Apache Spark Streaming | Apache Storm |
|---------|---------------|--------------|------------------------|--------------|
| Deployment | Library (embedded) | Cluster | Cluster | Cluster |
| Processing Model | True streaming | True streaming | Micro-batch | True streaming |
| Exactly-Once | Native | Native | With Kafka | With Kafka |
| State Management | RocksDB local | Managed | Checkpointing | External |
| Language Support | Java/Scala | Java/Scala/Python/SQL | Java/Scala/Python/R/SQL | Java/Clojure |
| Latency | Milliseconds | Milliseconds | Seconds | Milliseconds |
| Cluster Management | None needed | Required | Required | Required |
| Learning Curve | Low | Medium-High | Medium | Medium |

**When to choose Kafka Streams:**

- You already use Kafka as your messaging backbone
- You want to avoid managing a separate processing cluster
- You need millisecond latency with exactly-once semantics
- You prefer deploying standard Java/Kubernetes applications
- Your team has Java/Kotlin expertise

**When to consider alternatives:**

- You need to process data from non-Kafka sources (Flink/Spark)
- You require Python-native processing (Flink/Spark)
- You need complex batch + stream unified processing (Flink/Spark)
- Your processing logic requires advanced CEP patterns (Flink/Esper)

### Architecture Overview

```
+------------------+     +------------------+     +------------------+
|   Kafka Cluster  |     | Kafka Streams    |     |   Kafka Cluster  |
|   (Source Topics)|---->|   Application    |---->|  (Output Topics) |
+------------------+     +------------------+     +------------------+
                               |
                               v
                      +------------------+
                      |   State Stores   |
                      |   (RocksDB)      |
                      +------------------+
                               |
                               v
                      +------------------+
                      | Changelog Topics |
                      | (Fault Tolerance)|
                      +------------------+
```

**Core components:**

- **Stream Processor**: Application logic that transforms records
- **State Stores**: Local storage for stateful operations (backed by RocksDB)
- **Changelog Topics**: Kafka topics that back state stores for fault tolerance
- **Consumer Groups**: Kafka Streams uses consumer groups for partition assignment

## Getting Started

### Dependencies and Setup

```xml
<!-- Maven -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams</artifactId>
    <version>3.6.0</version>
</dependency>

<!-- For testing -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-streams-test-utils</artifactId>
    <version>3.6.0</version>
    <scope>test</scope>
</dependency>
```

```groovy
// Gradle
implementation 'org.apache.kafka:kafka-streams:3.6.0'
testImplementation 'org.apache.kafka:kafka-streams-test-utils:3.6.0'
```

### Basic Application Structure

```java
import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KafkaStreams;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.StreamsConfig;
import org.apache.kafka.streams.kstream.KStream;

import java.util.Properties;

public class BasicStreamsApp {
    public static void main(String[] args) {
        // 1. Configure the application
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-streams-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        // 2. Build the topology
        StreamsBuilder builder = new StreamsBuilder();

        KStream<String, String> source = builder.stream("input-topic");

        source
            .filter((key, value) -> value != null && value.length() > 5)
            .mapValues(value -> value.toUpperCase())
            .to("output-topic");

        // 3. Create and start the streams application
        KafkaStreams streams = new KafkaStreams(builder.build(), props);

        // Add shutdown hook for graceful shutdown
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));

        // Start the application
        streams.start();
    }
}
```

### Essential Configuration

```java
Properties props = new Properties();

// Required configurations
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092,broker2:9092");

// Serialization (can be overridden per stream)
props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

// Processing guarantees
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// State store configuration
props.put(StreamsConfig.STATE_DIR_CONFIG, "/var/lib/kafka-streams");

// Performance tuning
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG, 4);
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 1000);
props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 10 * 1024 * 1024L);

// Consumer configurations (prefixed with "consumer.")
props.put("consumer.auto.offset.reset", "earliest");
props.put("consumer.max.poll.records", 500);

// Producer configurations (prefixed with "producer.")
props.put("producer.acks", "all");
props.put("producer.compression.type", "lz4");
```

## Topology: The Processing Graph

### Understanding Topology

A topology defines the processing logic as a directed acyclic graph (DAG) of stream processors. It consists of:

- **Source Processors**: Read from Kafka topics
- **Stream Processors**: Transform data (map, filter, aggregate, etc.)
- **Sink Processors**: Write to Kafka topics or state stores

```java
StreamsBuilder builder = new StreamsBuilder();

// Source processor - reads from topic
KStream<String, String> source = builder.stream("input-topic");

// Stream processors - transform data
KStream<String, String> processed = source
    .filter((key, value) -> value != null)           // Filter processor
    .mapValues(String::toUpperCase)                  // Map processor
    .selectKey((key, value) -> value.substring(0, 3)); // Key selection

// Sink processor - writes to topic
processed.to("output-topic");

// Build and inspect the topology
Topology topology = builder.build();
System.out.println(topology.describe());
```

### Topology Description Output

```
Topologies:
   Sub-topology: 0
    Source: KSTREAM-SOURCE-0000000000 (topics: [input-topic])
      --> KSTREAM-FILTER-0000000001
    Processor: KSTREAM-FILTER-0000000001 (stores: [])
      --> KSTREAM-MAPVALUES-0000000002
      <-- KSTREAM-SOURCE-0000000000
    Processor: KSTREAM-MAPVALUES-0000000002 (stores: [])
      --> KSTREAM-KEY-SELECT-0000000003
      <-- KSTREAM-FILTER-0000000001
    Processor: KSTREAM-KEY-SELECT-0000000003 (stores: [])
      --> KSTREAM-SINK-0000000004
      <-- KSTREAM-MAPVALUES-0000000002
    Sink: KSTREAM-SINK-0000000004 (topic: output-topic)
      <-- KSTREAM-KEY-SELECT-0000000003
```

### Sub-topologies and Partitioning

When operations require data repartitioning (like joins or aggregations by a new key), Kafka Streams creates separate sub-topologies connected by internal repartition topics.

```java
// This creates a repartition because we change the key
KStream<String, Long> stream = builder.<String, String>stream("events")
    .selectKey((key, value) -> extractNewKey(value))  // Key change triggers repartition
    .groupByKey()
    .count()
    .toStream();
```

## KStream vs KTable: Core Abstractions

### KStream: Record Stream

A KStream represents an unbounded, continuously updating stream of records. Each record is an independent, immutable fact.

**Characteristics:**
- Represents a stream of events/facts
- Each record is independent
- Insert-only semantics
- Suitable for events, logs, sensor readings

```java
// KStream operations
KStream<String, String> stream = builder.stream("events");

// Each record is processed independently
stream
    .filter((key, value) -> value.contains("important"))
    .mapValues(value -> "Processed: " + value)
    .peek((key, value) -> System.out.println("Key: " + key + ", Value: " + value))
    .to("processed-events");

// Branching streams
KStream<String, String>[] branches = stream.branch(
    (key, value) -> value.startsWith("A"),  // Branch 0
    (key, value) -> value.startsWith("B"),  // Branch 1
    (key, value) -> true                     // Default branch
);

branches[0].to("branch-a");
branches[1].to("branch-b");
branches[2].to("branch-default");
```

### KTable: Changelog Stream

A KTable represents a changelog stream where each record is an update to a row identified by its key. It maintains the latest value for each key.

**Characteristics:**
- Represents a table with updates
- Latest value per key
- Upsert semantics (insert/update)
- Suitable for reference data, aggregations, current state

```java
// KTable from a compacted topic
KTable<String, String> table = builder.table("user-profiles");

// KTable from aggregation
KTable<String, Long> wordCounts = builder.<String, String>stream("text-input")
    .flatMapValues(value -> Arrays.asList(value.toLowerCase().split("\\W+")))
    .groupBy((key, word) -> word)
    .count();

// Convert KTable to KStream (get changelog)
KStream<String, Long> countsStream = wordCounts.toStream();
countsStream.to("word-counts-output");
```

### GlobalKTable: Fully Replicated Table

A GlobalKTable is fully replicated on each Kafka Streams instance. Useful for small lookup tables that need to be joined with streams.

```java
// GlobalKTable - replicated to all instances
GlobalKTable<String, String> globalRegions = builder.globalTable("regions");

// Join stream with GlobalKTable (no repartitioning needed)
KStream<String, String> enriched = ordersStream.join(
    globalRegions,
    (orderId, order) -> extractRegionId(order),  // Key extractor
    (order, region) -> order + ", Region: " + region
);
```

### KStream-KTable Duality

```java
// KStream to KTable: aggregate the stream
KTable<String, Long> aggregated = stream
    .groupByKey()
    .count();

// KTable to KStream: convert back to record stream
KStream<String, Long> changelog = aggregated.toStream();

// The changelog stream contains all changes to the table
changelog.foreach((key, value) ->
    System.out.println("Key " + key + " updated to " + value));
```

### Comparison Summary

| Aspect | KStream | KTable | GlobalKTable |
|--------|---------|--------|--------------|
| Semantics | Insert | Upsert | Upsert |
| State | Stateless | Stateful | Stateful |
| Partitioning | Partitioned | Partitioned | Fully replicated |
| Memory Usage | Low | Medium | High (full copy) |
| Join Locality | Requires co-partitioning | Requires co-partitioning | Local join |
| Use Case | Events, logs | Aggregations, lookups | Small reference data |

## Stateful Processing

### State Stores

Kafka Streams uses state stores to maintain local state for operations like aggregations, joins, and windowing.

```java
// Persistent state store (backed by RocksDB)
StoreBuilder<KeyValueStore<String, Long>> countStoreBuilder =
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("count-store"),
        Serdes.String(),
        Serdes.Long()
    );

builder.addStateStore(countStoreBuilder);

// In-memory state store (faster but not persistent)
StoreBuilder<KeyValueStore<String, String>> cacheStoreBuilder =
    Stores.keyValueStoreBuilder(
        Stores.inMemoryKeyValueStore("cache-store"),
        Serdes.String(),
        Serdes.String()
    );
```

### Custom Processor with State

```java
public class StatefulProcessor implements Processor<String, String, String, String> {
    private ProcessorContext<String, String> context;
    private KeyValueStore<String, Long> stateStore;

    @Override
    public void init(ProcessorContext<String, String> context) {
        this.context = context;
        this.stateStore = context.getStateStore("my-state-store");

        // Schedule periodic punctuation
        context.schedule(
            Duration.ofMinutes(1),
            PunctuationType.WALL_CLOCK_TIME,
            this::punctuate
        );
    }

    @Override
    public void process(Record<String, String> record) {
        String key = record.key();
        String value = record.value();

        // Read from state store
        Long currentCount = stateStore.get(key);
        if (currentCount == null) {
            currentCount = 0L;
        }

        // Update state store
        Long newCount = currentCount + 1;
        stateStore.put(key, newCount);

        // Forward processed record
        context.forward(new Record<>(key, "Count: " + newCount, record.timestamp()));
    }

    private void punctuate(long timestamp) {
        // Periodic processing - e.g., emit aggregates, cleanup old state
        try (KeyValueIterator<String, Long> iterator = stateStore.all()) {
            while (iterator.hasNext()) {
                KeyValue<String, Long> entry = iterator.next();
                if (entry.value > 100) {
                    context.forward(new Record<>(
                        entry.key,
                        "High count alert: " + entry.value,
                        timestamp
                    ));
                }
            }
        }
    }

    @Override
    public void close() {
        // Cleanup resources
    }
}
```

### Using Custom Processor in Topology

```java
builder.addStateStore(
    Stores.keyValueStoreBuilder(
        Stores.persistentKeyValueStore("my-state-store"),
        Serdes.String(),
        Serdes.Long()
    )
);

builder.<String, String>stream("input")
    .process(StatefulProcessor::new, "my-state-store")
    .to("output");
```

### Aggregations

```java
// Simple count
KTable<String, Long> counts = stream
    .groupByKey()
    .count();

// Count with named store
KTable<String, Long> namedCounts = stream
    .groupByKey()
    .count(Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("counts-store")
        .withKeySerde(Serdes.String())
        .withValueSerde(Serdes.Long()));

// Reduce (combine values)
KTable<String, String> combined = stream
    .groupByKey()
    .reduce((aggValue, newValue) -> aggValue + "," + newValue);

// Aggregate with custom logic
KTable<String, UserStats> stats = userEvents
    .groupByKey()
    .aggregate(
        UserStats::new,  // Initializer
        (key, event, stats) -> stats.update(event),  // Aggregator
        Materialized.<String, UserStats, KeyValueStore<Bytes, byte[]>>as("user-stats")
            .withKeySerde(Serdes.String())
            .withValueSerde(userStatsSerde)
    );
```

## Windowing Operations

### Window Types

Kafka Streams supports several window types for time-based aggregations:

```
Time-based Windows:

Tumbling Window (fixed, non-overlapping):
|-------|-------|-------|-------|
   5m      5m      5m      5m

Hopping Window (fixed, overlapping):
|-------|
   |-------|
      |-------|
         |-------|
   5m window, 1m advance

Sliding Window (for joins):
Events within 5 minutes of each other are joined

Session Window (activity-based):
|------|     |--------|     |---|
  gap     gap    gap     gap
Sessions end after inactivity gap
```

### Tumbling Windows

Fixed-size, non-overlapping windows:

```java
import org.apache.kafka.streams.kstream.TimeWindows;
import java.time.Duration;

// 5-minute tumbling windows
KTable<Windowed<String>, Long> windowedCounts = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
    .count();

// With grace period for late arrivals
KTable<Windowed<String>, Long> windowedCountsWithGrace = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count();

// Access window information
windowedCounts.toStream()
    .foreach((windowedKey, count) -> {
        String key = windowedKey.key();
        Window window = windowedKey.window();
        long start = window.start();
        long end = window.end();
        System.out.printf("Key: %s, Window: [%d, %d], Count: %d%n",
            key, start, end, count);
    });
```

### Hopping Windows

Fixed-size, overlapping windows:

```java
import org.apache.kafka.streams.kstream.TimeWindows;

// 5-minute windows that advance every 1 minute
KTable<Windowed<String>, Long> hoppingCounts = stream
    .groupByKey()
    .windowedBy(
        TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5))
            .advanceBy(Duration.ofMinutes(1))
    )
    .count();
```

### Session Windows

Dynamic windows based on activity gaps:

```java
import org.apache.kafka.streams.kstream.SessionWindows;

// Sessions with 30-minute inactivity gap
KTable<Windowed<String>, Long> sessionCounts = stream
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapWithNoGrace(Duration.ofMinutes(30)))
    .count();

// Session with grace period
KTable<Windowed<String>, Long> sessionCountsWithGrace = stream
    .groupByKey()
    .windowedBy(SessionWindows.ofInactivityGapAndGrace(
        Duration.ofMinutes(30),
        Duration.ofMinutes(5)
    ))
    .count();
```

### Sliding Windows (for Joins)

Used primarily for stream-stream joins:

```java
import org.apache.kafka.streams.kstream.JoinWindows;

// Join events within 5 minutes of each other
KStream<String, String> joined = leftStream.join(
    rightStream,
    (leftValue, rightValue) -> leftValue + "," + rightValue,
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5))
);

// Asymmetric join window
KStream<String, String> asymmetricJoin = leftStream.join(
    rightStream,
    (leftValue, rightValue) -> leftValue + "," + rightValue,
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(5))
        .before(Duration.ofMinutes(5))   // Look back 5 minutes
        .after(Duration.ofMinutes(10))   // Look forward 10 minutes
);
```

### Suppression: Controlling Output

By default, Kafka Streams emits updates continuously. Use suppression to control when results are emitted:

```java
import org.apache.kafka.streams.kstream.Suppressed;

// Emit only final results (when window closes)
KTable<Windowed<String>, Long> finalCounts = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count()
    .suppress(Suppressed.untilWindowCloses(Suppressed.BufferConfig.unbounded()));

// Emit final results with bounded buffer (may lose data if buffer fills)
KTable<Windowed<String>, Long> boundedFinalCounts = stream
    .groupByKey()
    .windowedBy(TimeWindows.ofSizeAndGrace(Duration.ofMinutes(5), Duration.ofMinutes(1)))
    .count()
    .suppress(Suppressed.untilWindowCloses(
        Suppressed.BufferConfig.maxBytes(10_000_000L).shutDownWhenFull()
    ));
```

## Joins

### Stream-Stream Join

Joins two KStreams within a time window:

```java
// Define the streams
KStream<String, OrderEvent> orders = builder.stream("orders");
KStream<String, PaymentEvent> payments = builder.stream("payments");

// Join within a 10-minute window
KStream<String, OrderWithPayment> joined = orders.join(
    payments,
    (order, payment) -> new OrderWithPayment(order, payment),
    JoinWindows.ofTimeDifferenceAndGrace(
        Duration.ofMinutes(10),
        Duration.ofMinutes(2)
    ),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
);

// Left join (include orders without payments)
KStream<String, OrderWithPayment> leftJoined = orders.leftJoin(
    payments,
    (order, payment) -> new OrderWithPayment(order, payment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(10)),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
);

// Outer join (include both unmatched orders and payments)
KStream<String, OrderWithPayment> outerJoined = orders.outerJoin(
    payments,
    (order, payment) -> new OrderWithPayment(order, payment),
    JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ofMinutes(10)),
    StreamJoined.with(Serdes.String(), orderSerde, paymentSerde)
);
```

### Stream-Table Join

Joins a KStream with a KTable (lookup enrichment):

```java
// Stream of orders
KStream<String, Order> orders = builder.stream("orders");

// Table of customer information
KTable<String, Customer> customers = builder.table("customers");

// Enrich orders with customer data
KStream<String, EnrichedOrder> enriched = orders.join(
    customers,
    (order, customer) -> new EnrichedOrder(order, customer),
    Joined.with(Serdes.String(), orderSerde, customerSerde)
);

// Left join (keep orders even if customer not found)
KStream<String, EnrichedOrder> leftEnriched = orders.leftJoin(
    customers,
    (order, customer) -> {
        if (customer == null) {
            return new EnrichedOrder(order, Customer.UNKNOWN);
        }
        return new EnrichedOrder(order, customer);
    }
);
```

### Stream-GlobalKTable Join

Join with a fully replicated table (no co-partitioning required):

```java
// Global table of product catalog
GlobalKTable<String, Product> products = builder.globalTable("products");

// Stream of order line items
KStream<String, OrderLine> orderLines = builder.stream("order-lines");

// Join using a key extractor
KStream<String, EnrichedOrderLine> enriched = orderLines.join(
    products,
    (orderLineKey, orderLine) -> orderLine.getProductId(),  // Extract join key
    (orderLine, product) -> new EnrichedOrderLine(orderLine, product)
);
```

### Table-Table Join

Join two KTables:

```java
KTable<String, UserProfile> profiles = builder.table("user-profiles");
KTable<String, UserPreferences> preferences = builder.table("user-preferences");

// Inner join
KTable<String, UserComplete> complete = profiles.join(
    preferences,
    (profile, prefs) -> new UserComplete(profile, prefs)
);

// Left join
KTable<String, UserComplete> leftJoined = profiles.leftJoin(
    preferences,
    (profile, prefs) -> new UserComplete(profile, prefs)
);

// Outer join
KTable<String, UserComplete> outerJoined = profiles.outerJoin(
    preferences,
    (profile, prefs) -> new UserComplete(profile, prefs)
);
```

### Co-partitioning Requirements

For stream-stream and stream-table joins (not GlobalKTable), the input topics must be co-partitioned:

- Same number of partitions
- Same partitioning strategy (same key)

```java
// If keys don't match, repartition first
KStream<String, Order> ordersByCustomer = orders
    .selectKey((orderId, order) -> order.getCustomerId())  // Change key
    .repartition(Repartitioned.with(Serdes.String(), orderSerde));

// Now join with customer table (keyed by customer ID)
KStream<String, EnrichedOrder> enriched = ordersByCustomer.join(
    customers,
    (order, customer) -> new EnrichedOrder(order, customer)
);
```

## Exactly-Once Semantics

### Understanding Processing Guarantees

Kafka Streams supports three processing guarantees:

1. **At-least-once**: Records may be processed multiple times on failure
2. **Exactly-once (EOS)**: Each record is processed exactly once, even on failure

### Enabling Exactly-Once Processing

```java
// Enable exactly-once semantics (v2 is recommended for Kafka 2.5+)
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// For older Kafka versions (< 2.5), use:
// props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE);
```

### How Exactly-Once Works

```
1. Read from input topic
2. Process the record
3. Write to output topic AND update state store
4. Commit consumer offsets

All of these happen atomically using Kafka transactions:

+------------------+     +------------------+     +------------------+
|   Read Record    |---->|    Process       |---->|   Transaction    |
|   (Consumer)     |     |                  |     |   - Write output |
+------------------+     +------------------+     |   - Update state |
                                                  |   - Commit offset|
                                                  +------------------+
```

### EOS Configuration Details

```java
Properties props = new Properties();
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "eos-app");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// Transaction timeout (should be > max.poll.interval.ms)
props.put(StreamsConfig.producerPrefix(ProducerConfig.TRANSACTION_TIMEOUT_CONFIG), 60000);

// Commit interval (affects latency vs. overhead tradeoff)
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);  // Lower for lower latency
```

### EOS Considerations and Trade-offs

```java
// Exactly-once has higher overhead due to transactions
// Consider the trade-offs:

// 1. Latency: EOS adds ~20-50ms latency per transaction
// 2. Throughput: ~10-20% reduction compared to at-least-once
// 3. Broker load: More requests for transaction coordination

// For very high throughput with relaxed consistency:
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.AT_LEAST_ONCE);
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 30000);  // Less frequent commits

// For financial/critical applications:
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 100);  // Frequent commits
```

## Practical Examples

### Example 1: Real-Time Word Count

```java
public class WordCountApp {
    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "wordcount-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();

        KStream<String, String> textLines = builder.stream("text-input");

        KTable<String, Long> wordCounts = textLines
            .flatMapValues(line -> Arrays.asList(line.toLowerCase().split("\\W+")))
            .filter((key, word) -> word.length() > 0)
            .groupBy((key, word) -> word)
            .count(Materialized.as("word-counts-store"));

        wordCounts.toStream().to("word-counts-output",
            Produced.with(Serdes.String(), Serdes.Long()));

        KafkaStreams streams = new KafkaStreams(builder.build(), props);
        streams.start();
    }
}
```

### Example 2: Order Processing with Enrichment

```java
public class OrderEnrichmentApp {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();

        // Order events stream
        KStream<String, Order> orders = builder.stream("orders",
            Consumed.with(Serdes.String(), orderSerde));

        // Customer lookup table
        GlobalKTable<String, Customer> customers = builder.globalTable("customers",
            Consumed.with(Serdes.String(), customerSerde));

        // Product catalog table
        GlobalKTable<String, Product> products = builder.globalTable("products",
            Consumed.with(Serdes.String(), productSerde));

        // Enrich orders
        KStream<String, EnrichedOrder> enriched = orders
            // Join with customer
            .join(customers,
                (orderId, order) -> order.getCustomerId(),
                (order, customer) -> new OrderWithCustomer(order, customer))
            // Join with product
            .join(products,
                (orderId, orderWithCustomer) -> orderWithCustomer.getOrder().getProductId(),
                (orderWithCustomer, product) ->
                    new EnrichedOrder(orderWithCustomer, product));

        // Route based on order value
        enriched
            .filter((key, order) -> order.getTotalValue() > 1000)
            .to("high-value-orders");

        enriched
            .filter((key, order) -> order.getTotalValue() <= 1000)
            .to("standard-orders");

        KafkaStreams streams = new KafkaStreams(builder.build(), getProps());
        streams.start();
    }
}
```

### Example 3: Fraud Detection with Windowing

```java
public class FraudDetectionApp {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();

        KStream<String, Transaction> transactions = builder.stream("transactions",
            Consumed.with(Serdes.String(), transactionSerde));

        // Count transactions per user in 5-minute windows
        KTable<Windowed<String>, Long> transactionCounts = transactions
            .groupBy((txnId, txn) -> txn.getUserId())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count(Materialized.as("transaction-counts"));

        // Calculate total amount per user in 5-minute windows
        KTable<Windowed<String>, Double> transactionTotals = transactions
            .groupBy((txnId, txn) -> txn.getUserId())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .aggregate(
                () -> 0.0,
                (userId, txn, total) -> total + txn.getAmount(),
                Materialized.<String, Double, WindowStore<Bytes, byte[]>>as("transaction-totals")
                    .withValueSerde(Serdes.Double())
            );

        // Detect suspicious patterns
        KStream<String, FraudAlert> alerts = transactionCounts.toStream()
            .join(
                transactionTotals.toStream(),
                (count, total) -> {
                    if (count > 10 || total > 10000) {
                        return new FraudAlert("High activity detected", count, total);
                    }
                    return null;
                },
                JoinWindows.ofTimeDifferenceWithNoGrace(Duration.ZERO),
                StreamJoined.with(
                    new WindowedSerdes.TimeWindowedSerde<>(Serdes.String()),
                    Serdes.Long(),
                    Serdes.Double()
                )
            )
            .filter((key, alert) -> alert != null)
            .selectKey((windowedKey, alert) -> windowedKey.key());

        alerts.to("fraud-alerts", Produced.with(Serdes.String(), fraudAlertSerde));

        KafkaStreams streams = new KafkaStreams(builder.build(), getProps());
        streams.start();
    }
}
```

### Example 4: Session-Based User Analytics

```java
public class SessionAnalyticsApp {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();

        KStream<String, UserEvent> events = builder.stream("user-events",
            Consumed.with(Serdes.String(), userEventSerde));

        // Aggregate events into sessions (30-minute inactivity gap)
        KTable<Windowed<String>, SessionStats> sessions = events
            .groupBy((eventId, event) -> event.getUserId())
            .windowedBy(SessionWindows.ofInactivityGapAndGrace(
                Duration.ofMinutes(30),
                Duration.ofMinutes(5)
            ))
            .aggregate(
                SessionStats::new,
                (userId, event, stats) -> stats.addEvent(event),
                (userId, stats1, stats2) -> stats1.merge(stats2),  // Session merger
                Materialized.<String, SessionStats, SessionStore<Bytes, byte[]>>as("sessions")
                    .withKeySerde(Serdes.String())
                    .withValueSerde(sessionStatsSerde)
            );

        // Emit completed sessions
        sessions.toStream()
            .filter((windowedKey, stats) -> stats.getEventCount() > 0)
            .map((windowedKey, stats) -> {
                String userId = windowedKey.key();
                long sessionStart = windowedKey.window().start();
                long sessionEnd = windowedKey.window().end();
                return KeyValue.pair(userId,
                    new CompletedSession(userId, sessionStart, sessionEnd, stats));
            })
            .to("completed-sessions");

        KafkaStreams streams = new KafkaStreams(builder.build(), getProps());
        streams.start();
    }
}
```

### Example 5: Real-Time Leaderboard

```java
public class LeaderboardApp {
    public static void main(String[] args) {
        StreamsBuilder builder = new StreamsBuilder();

        KStream<String, GameEvent> gameEvents = builder.stream("game-events");

        // Aggregate scores per player
        KTable<String, Long> playerScores = gameEvents
            .filter((key, event) -> "SCORE".equals(event.getEventType()))
            .groupBy((key, event) -> event.getPlayerId())
            .aggregate(
                () -> 0L,
                (playerId, event, totalScore) -> totalScore + event.getPoints(),
                Materialized.<String, Long, KeyValueStore<Bytes, byte[]>>as("player-scores")
                    .withKeySerde(Serdes.String())
                    .withValueSerde(Serdes.Long())
            );

        // Maintain top 10 leaderboard using a custom processor
        builder.addStateStore(
            Stores.keyValueStoreBuilder(
                Stores.persistentKeyValueStore("leaderboard-store"),
                Serdes.String(),
                Serdes.Long()
            )
        );

        playerScores.toStream()
            .process(() -> new LeaderboardProcessor(), "leaderboard-store")
            .to("leaderboard-updates");

        KafkaStreams streams = new KafkaStreams(builder.build(), getProps());
        streams.start();
    }
}

class LeaderboardProcessor implements Processor<String, Long, String, String> {
    private KeyValueStore<String, Long> leaderboard;
    private ProcessorContext<String, String> context;
    private static final int TOP_N = 10;

    @Override
    public void init(ProcessorContext<String, String> context) {
        this.context = context;
        this.leaderboard = context.getStateStore("leaderboard-store");
    }

    @Override
    public void process(Record<String, Long> record) {
        String playerId = record.key();
        Long score = record.value();

        // Update player score
        leaderboard.put(playerId, score);

        // Get top N and emit leaderboard
        List<KeyValue<String, Long>> topPlayers = new ArrayList<>();
        try (KeyValueIterator<String, Long> all = leaderboard.all()) {
            while (all.hasNext()) {
                topPlayers.add(all.next());
            }
        }

        topPlayers.sort((a, b) -> Long.compare(b.value, a.value));
        List<KeyValue<String, Long>> topN = topPlayers.subList(0,
            Math.min(TOP_N, topPlayers.size()));

        // Emit updated leaderboard
        String leaderboardJson = serializeLeaderboard(topN);
        context.forward(new Record<>("leaderboard", leaderboardJson, record.timestamp()));
    }

    @Override
    public void close() {}
}
```

## Interactive Queries

### Querying Local State Stores

Kafka Streams allows you to query state stores directly, enabling interactive queries against streaming data:

```java
public class InteractiveQueryService {
    private final KafkaStreams streams;

    public InteractiveQueryService(KafkaStreams streams) {
        this.streams = streams;
    }

    // Query a simple key-value store
    public Long getWordCount(String word) {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "word-counts-store",
                QueryableStoreTypes.keyValueStore()
            )
        );
        return store.get(word);
    }

    // Get all entries from a store
    public Map<String, Long> getAllWordCounts() {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "word-counts-store",
                QueryableStoreTypes.keyValueStore()
            )
        );

        Map<String, Long> result = new HashMap<>();
        try (KeyValueIterator<String, Long> iterator = store.all()) {
            while (iterator.hasNext()) {
                KeyValue<String, Long> entry = iterator.next();
                result.put(entry.key, entry.value);
            }
        }
        return result;
    }

    // Range query
    public Map<String, Long> getWordCountsInRange(String from, String to) {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "word-counts-store",
                QueryableStoreTypes.keyValueStore()
            )
        );

        Map<String, Long> result = new HashMap<>();
        try (KeyValueIterator<String, Long> iterator = store.range(from, to)) {
            while (iterator.hasNext()) {
                KeyValue<String, Long> entry = iterator.next();
                result.put(entry.key, entry.value);
            }
        }
        return result;
    }
}
```

### Querying Windowed State Stores

```java
public class WindowedQueryService {
    private final KafkaStreams streams;

    // Query windowed store for a specific key and time range
    public Map<Long, Long> getWindowedCounts(String key, Instant from, Instant to) {
        ReadOnlyWindowStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "windowed-counts-store",
                QueryableStoreTypes.windowStore()
            )
        );

        Map<Long, Long> result = new HashMap<>();
        try (WindowStoreIterator<Long> iterator = store.fetch(key, from, to)) {
            while (iterator.hasNext()) {
                KeyValue<Long, Long> entry = iterator.next();
                result.put(entry.key, entry.value);  // key is window start time
            }
        }
        return result;
    }

    // Query all keys in a time range
    public Map<String, Map<Long, Long>> getAllWindowedCounts(Instant from, Instant to) {
        ReadOnlyWindowStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "windowed-counts-store",
                QueryableStoreTypes.windowStore()
            )
        );

        Map<String, Map<Long, Long>> result = new HashMap<>();
        try (KeyValueIterator<Windowed<String>, Long> iterator = store.fetchAll(from, to)) {
            while (iterator.hasNext()) {
                KeyValue<Windowed<String>, Long> entry = iterator.next();
                String key = entry.key.key();
                long windowStart = entry.key.window().start();
                result.computeIfAbsent(key, k -> new HashMap<>())
                    .put(windowStart, entry.value);
            }
        }
        return result;
    }
}
```

### Building a REST API for Interactive Queries

```java
// Using Spring Boot with Kafka Streams
@RestController
@RequestMapping("/api")
public class StreamsQueryController {
    private final KafkaStreams streams;

    @Autowired
    public StreamsQueryController(KafkaStreams streams) {
        this.streams = streams;
    }

    @GetMapping("/wordcount/{word}")
    public ResponseEntity<Long> getWordCount(@PathVariable String word) {
        try {
            ReadOnlyKeyValueStore<String, Long> store = streams.store(
                StoreQueryParameters.fromNameAndType(
                    "word-counts-store",
                    QueryableStoreTypes.keyValueStore()
                )
            );
            Long count = store.get(word);
            return count != null
                ? ResponseEntity.ok(count)
                : ResponseEntity.notFound().build();
        } catch (InvalidStateStoreException e) {
            // Store not yet ready (rebalancing)
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }

    @GetMapping("/wordcount")
    public ResponseEntity<Map<String, Long>> getAllWordCounts() {
        try {
            ReadOnlyKeyValueStore<String, Long> store = streams.store(
                StoreQueryParameters.fromNameAndType(
                    "word-counts-store",
                    QueryableStoreTypes.keyValueStore()
                )
            );

            Map<String, Long> result = new HashMap<>();
            try (KeyValueIterator<String, Long> iterator = store.all()) {
                while (iterator.hasNext()) {
                    KeyValue<String, Long> entry = iterator.next();
                    result.put(entry.key, entry.value);
                }
            }
            return ResponseEntity.ok(result);
        } catch (InvalidStateStoreException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        KafkaStreams.State state = streams.state();
        if (state == KafkaStreams.State.RUNNING) {
            return ResponseEntity.ok("RUNNING");
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(state.toString());
        }
    }
}
```

### Distributed Queries Across Instances

When running multiple Kafka Streams instances, state is partitioned. Use metadata to route queries:

```java
@Service
public class DistributedQueryService {
    private final KafkaStreams streams;
    private final RestTemplate restTemplate;
    private final String applicationServer;  // This instance's host:port

    // Find which instance has the key
    public HostInfo getHostForKey(String storeName, String key) {
        StreamsMetadata metadata = streams.queryMetadataForKey(
            storeName,
            key,
            Serdes.String().serializer()
        );
        return metadata.hostInfo();
    }

    // Query local or remote
    public Long getCount(String word) {
        HostInfo hostInfo = getHostForKey("word-counts-store", word);

        if (isThisHost(hostInfo)) {
            // Query locally
            return queryLocal(word);
        } else {
            // Query remote instance
            return queryRemote(hostInfo, word);
        }
    }

    private boolean isThisHost(HostInfo hostInfo) {
        return (hostInfo.host() + ":" + hostInfo.port()).equals(applicationServer);
    }

    private Long queryLocal(String word) {
        ReadOnlyKeyValueStore<String, Long> store = streams.store(
            StoreQueryParameters.fromNameAndType(
                "word-counts-store",
                QueryableStoreTypes.keyValueStore()
            )
        );
        return store.get(word);
    }

    private Long queryRemote(HostInfo hostInfo, String word) {
        String url = String.format("http://%s:%d/api/wordcount/%s",
            hostInfo.host(), hostInfo.port(), word);
        return restTemplate.getForObject(url, Long.class);
    }

    // Get all instances hosting a store
    public Collection<StreamsMetadata> getAllInstancesForStore(String storeName) {
        return streams.streamsMetadataForStore(storeName);
    }
}
```

## Testing Kafka Streams

### Unit Testing with TopologyTestDriver

```java
import org.apache.kafka.streams.TopologyTestDriver;
import org.apache.kafka.streams.TestInputTopic;
import org.apache.kafka.streams.TestOutputTopic;

public class WordCountTest {
    private TopologyTestDriver testDriver;
    private TestInputTopic<String, String> inputTopic;
    private TestOutputTopic<String, Long> outputTopic;

    @BeforeEach
    void setup() {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "test-app");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "dummy:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());

        StreamsBuilder builder = new StreamsBuilder();
        // Build your topology
        WordCountApp.buildTopology(builder);

        testDriver = new TopologyTestDriver(builder.build(), props);

        inputTopic = testDriver.createInputTopic(
            "text-input",
            Serdes.String().serializer(),
            Serdes.String().serializer()
        );

        outputTopic = testDriver.createOutputTopic(
            "word-counts-output",
            Serdes.String().deserializer(),
            Serdes.Long().deserializer()
        );
    }

    @AfterEach
    void teardown() {
        testDriver.close();
    }

    @Test
    void testWordCount() {
        // Send input records
        inputTopic.pipeInput("key1", "hello world");
        inputTopic.pipeInput("key2", "hello kafka streams");

        // Read output records
        Map<String, Long> results = outputTopic.readKeyValuesToMap();

        // Verify results
        assertEquals(2L, results.get("hello"));
        assertEquals(1L, results.get("world"));
        assertEquals(1L, results.get("kafka"));
        assertEquals(1L, results.get("streams"));
    }

    @Test
    void testStateStore() {
        inputTopic.pipeInput("key1", "hello world hello");

        // Query state store directly
        KeyValueStore<String, Long> store = testDriver.getKeyValueStore("word-counts-store");
        assertEquals(2L, store.get("hello"));
        assertEquals(1L, store.get("world"));
    }
}
```

### Testing with Timestamps

```java
@Test
void testWindowedAggregation() {
    Instant baseTime = Instant.parse("2024-01-01T00:00:00Z");

    // Send records with specific timestamps
    inputTopic.pipeInput("user1", "event", baseTime);
    inputTopic.pipeInput("user1", "event", baseTime.plusSeconds(30));
    inputTopic.pipeInput("user1", "event", baseTime.plusMinutes(2));

    // First window should have 2 events
    inputTopic.pipeInput("user1", "event", baseTime.plusMinutes(6));  // New window

    List<KeyValue<Windowed<String>, Long>> results = outputTopic.readKeyValuesToList();
    // Verify windowed results
}

@Test
void testLateArrivingData() {
    Instant baseTime = Instant.parse("2024-01-01T00:00:00Z");

    // Send in-order events
    inputTopic.pipeInput("user1", "event", baseTime);
    inputTopic.pipeInput("user1", "event", baseTime.plusMinutes(1));

    // Advance time past window
    inputTopic.pipeInput("user1", "event", baseTime.plusMinutes(10));

    // Late event (within grace period)
    inputTopic.pipeInput("user1", "late-event", baseTime.plusSeconds(30));

    // Verify late event was processed
}
```

### Integration Testing with Embedded Kafka

```java
import org.springframework.kafka.test.EmbeddedKafkaBroker;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"input", "output"})
public class KafkaStreamsIntegrationTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafka;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Test
    void testEndToEnd() throws Exception {
        // Start the streams application
        // ...

        // Send records
        kafkaTemplate.send("input", "key", "hello world").get();
        kafkaTemplate.send("input", "key", "hello kafka").get();

        // Wait for processing
        Thread.sleep(5000);

        // Consume from output topic and verify
        Consumer<String, Long> consumer = createConsumer();
        consumer.subscribe(Collections.singletonList("output"));

        ConsumerRecords<String, Long> records = consumer.poll(Duration.ofSeconds(10));

        Map<String, Long> results = new HashMap<>();
        records.forEach(record -> results.put(record.key(), record.value()));

        assertEquals(2L, results.get("hello"));
    }
}
```

## Production Deployment

### Application Configuration for Production

```java
Properties props = new Properties();

// Application identity
props.put(StreamsConfig.APPLICATION_ID_CONFIG, "my-production-app");
props.put(StreamsConfig.CLIENT_ID_CONFIG, "my-production-app-client");
props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "broker1:9092,broker2:9092,broker3:9092");

// Processing guarantee
props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

// Threading
props.put(StreamsConfig.NUM_STREAM_THREADS_CONFIG,
    Runtime.getRuntime().availableProcessors());

// State management
props.put(StreamsConfig.STATE_DIR_CONFIG, "/var/lib/kafka-streams");
props.put(StreamsConfig.COMMIT_INTERVAL_MS_CONFIG, 1000);

// Performance tuning
props.put(StreamsConfig.CACHE_MAX_BYTES_BUFFERING_CONFIG, 100 * 1024 * 1024L);  // 100MB
props.put(StreamsConfig.BUFFERED_RECORDS_PER_PARTITION_CONFIG, 1000);

// Fault tolerance
props.put(StreamsConfig.NUM_STANDBY_REPLICAS_CONFIG, 1);
props.put(StreamsConfig.REPLICATION_FACTOR_CONFIG, 3);

// Consumer settings
props.put("consumer.max.poll.records", 500);
props.put("consumer.fetch.min.bytes", 1024);
props.put("consumer.fetch.max.wait.ms", 500);

// Producer settings
props.put("producer.acks", "all");
props.put("producer.compression.type", "lz4");
props.put("producer.linger.ms", 10);
props.put("producer.batch.size", 32768);

// Security (if using SSL/SASL)
props.put("security.protocol", "SASL_SSL");
props.put("sasl.mechanism", "SCRAM-SHA-256");
props.put("sasl.jaas.config", "...");
```

### Health Monitoring

```java
public class StreamsHealthCheck {
    private final KafkaStreams streams;

    public StreamsHealthCheck(KafkaStreams streams) {
        this.streams = streams;

        // Register state listener
        streams.setStateListener((newState, oldState) -> {
            log.info("State changed from {} to {}", oldState, newState);
            if (newState == KafkaStreams.State.ERROR) {
                log.error("Streams application entered ERROR state");
                // Alert, restart, etc.
            }
        });

        // Register uncaught exception handler
        streams.setUncaughtExceptionHandler(exception -> {
            log.error("Uncaught exception in streams", exception);
            // Return SHUTDOWN_CLIENT to stop, REPLACE_THREAD to recover
            return StreamsUncaughtExceptionHandler.StreamThreadExceptionResponse.REPLACE_THREAD;
        });
    }

    public boolean isHealthy() {
        KafkaStreams.State state = streams.state();
        return state == KafkaStreams.State.RUNNING ||
               state == KafkaStreams.State.REBALANCING;
    }

    public Map<String, Object> getMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Get built-in metrics
        streams.metrics().forEach((name, metric) -> {
            if (name.name().contains("records-consumed") ||
                name.name().contains("records-produced") ||
                name.name().contains("process-latency")) {
                metrics.put(name.name(), metric.metricValue());
            }
        });

        return metrics;
    }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kafka-streams-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kafka-streams-app
  template:
    metadata:
      labels:
        app: kafka-streams-app
    spec:
      containers:
      - name: kafka-streams-app
        image: my-registry/kafka-streams-app:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka-0.kafka:9092,kafka-1.kafka:9092,kafka-2.kafka:9092"
        - name: APPLICATION_SERVER
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        volumeMounts:
        - name: state-store
          mountPath: /var/lib/kafka-streams
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: state-store
        emptyDir: {}  # Or use PersistentVolumeClaim for durability
---
apiVersion: v1
kind: Service
metadata:
  name: kafka-streams-app
spec:
  selector:
    app: kafka-streams-app
  ports:
  - port: 8080
    targetPort: 8080
  clusterIP: None  # Headless service for interactive queries
```

### Graceful Shutdown

```java
public class GracefulShutdown {
    private final KafkaStreams streams;
    private final CountDownLatch shutdownLatch = new CountDownLatch(1);

    public void start() {
        // Register shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log.info("Shutting down streams application...");
            streams.close(Duration.ofSeconds(30));
            shutdownLatch.countDown();
            log.info("Streams application shut down");
        }));

        // Start streams
        streams.start();

        // Wait for shutdown signal
        try {
            shutdownLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## Interview Key Points

### What is Kafka Streams and how does it differ from other stream processors?

Kafka Streams is a client library for building stream processing applications on Apache Kafka. Key differences:

- **Deployment**: Runs as a standard JVM application (no separate cluster)
- **Exactly-once**: Native support without external coordination
- **State management**: Local RocksDB stores backed by Kafka changelog topics
- **Scalability**: Scale by adding application instances (uses consumer groups)

### Explain KStream vs KTable

- **KStream**: Unbounded stream of records (insert semantics). Each record is an independent event.
- **KTable**: Changelog stream (upsert semantics). Maintains latest value per key, like a materialized view.

They are duals: KStream can be aggregated into KTable, and KTable can be converted to KStream (changelog).

### How does Kafka Streams achieve exactly-once processing?

Kafka Streams uses Kafka transactions to atomically:
1. Consume from input topics
2. Process and produce to output topics
3. Update local state stores
4. Commit consumer offsets

All operations succeed or fail together, preventing duplicates or data loss.

### What are state stores and how are they made fault-tolerant?

State stores are local key-value stores (typically RocksDB) that hold application state. Fault tolerance is achieved through:
- **Changelog topics**: Every state update is written to a Kafka topic
- **Restoration**: On restart, state is restored by replaying the changelog
- **Standby replicas**: Keep warm copies ready for fast failover

### Explain windowing in Kafka Streams

Window types:
- **Tumbling**: Fixed-size, non-overlapping windows
- **Hopping**: Fixed-size, overlapping windows
- **Session**: Dynamic windows based on activity gaps
- **Sliding**: Used for joins, events within a time difference

### How do joins work in Kafka Streams?

- **Stream-Stream**: Joins records within a time window (requires co-partitioning)
- **Stream-Table**: Enriches stream records with table lookups (requires co-partitioning)
- **Stream-GlobalKTable**: Lookups against fully replicated table (no co-partitioning needed)
- **Table-Table**: Joins two tables (like a SQL join)

### What is co-partitioning and why is it important?

Co-partitioning means topics have:
- Same number of partitions
- Same partitioning strategy (key)

Required for stream-stream and stream-table joins so that records with the same key are processed by the same task.

### How do you scale a Kafka Streams application?

- **Horizontally**: Add more instances (limited by input partition count)
- **Vertically**: Increase `num.stream.threads` per instance
- **Maximum parallelism**: Number of tasks = number of input partitions
- **Standby replicas**: Enable for faster failover during scaling

## Further Reading

### Official Resources

- [Kafka Streams Documentation](https://kafka.apache.org/documentation/streams/)
- [Kafka Streams Developer Guide](https://docs.confluent.io/platform/current/streams/developer-guide/dsl-api.html)
- [Kafka Streams Examples](https://github.com/confluentinc/kafka-streams-examples)

### Recommended Books

- **"Kafka: The Definitive Guide, 2nd Edition"** - Gwen Shapira, et al.
- **"Mastering Kafka Streams and ksqlDB"** - Mitch Seymour
- **"Kafka Streams in Action"** - Bill Bejeck

### Related Technologies

- **ksqlDB**: SQL interface for Kafka Streams
- **Apache Flink**: Alternative stream processor with richer API
- **Apache Spark Structured Streaming**: Micro-batch stream processing
- **Debezium**: Change data capture for database streaming
- **Schema Registry**: Schema management for Kafka messages

### Practice Projects

- Real-time fraud detection system
- Event-driven microservices with CQRS
- Real-time analytics dashboard with interactive queries
- IoT sensor data aggregation and alerting
- User session analytics with session windows
- Real-time recommendation engine

---

Kafka Streams provides a powerful yet simple way to build stream processing applications that leverage Kafka's distributed, fault-tolerant infrastructure. Its library-based approach eliminates the need for a separate processing cluster, making it an excellent choice for teams already invested in the Kafka ecosystem. By mastering concepts like KStream/KTable duality, stateful processing, windowing, and exactly-once semantics, you can build robust real-time data pipelines that scale with your needs.
