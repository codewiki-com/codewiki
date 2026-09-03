---
title: Real-time Data Streaming
description: Learn real-time data streaming architecture and patterns
track: data
section: data-engineering
difficulty: advanced
tags:
  - stream processing
  - Kafka
  - real-time data
  - event-driven
status: imported
origin: old/src/content/docs/data/data-streaming.en.md
divergence: 0.13
issues: []
legacy:
  category: Data
  subcategory: Streaming
  order: 25
  lastUpdated: 2026-01-07
---

Real-time data streaming has become essential for modern applications that require immediate insights and rapid response to events. We'll cover streaming architecture fundamentals, the Kafka ecosystem, stream processing patterns, and best practices for building robust streaming systems.

## Streaming vs Batch Processing

### Understanding the Paradigms

The choice between streaming and batch processing fundamentally shapes your data architecture. Understanding when to use each approach is critical for building effective data systems.

**Batch Processing:**
- Processes data in discrete chunks at scheduled intervals
- Higher latency (minutes to hours)
- Simpler to implement and debug
- Better for historical analysis and large-scale transformations
- Examples: Daily reports, ETL jobs, data warehouse loading

**Stream Processing:**
- Processes data continuously as it arrives
- Low latency (milliseconds to seconds)
- More complex but enables real-time insights
- Better for time-sensitive decisions and monitoring
- Examples: Fraud detection, real-time analytics, IoT processing

### Comparison Table

| Aspect | Batch Processing | Stream Processing |
|--------|------------------|-------------------|
| Latency | Minutes to hours | Milliseconds to seconds |
| Data handling | Bounded datasets | Unbounded data streams |
| Processing model | Process all data at once | Process each event as it arrives |
| State management | Simpler (in-memory or disk) | Complex (distributed state) |
| Failure recovery | Restart from beginning | Checkpoint-based recovery |
| Use cases | Reports, ETL, ML training | Alerts, monitoring, real-time dashboards |
| Complexity | Lower | Higher |
| Cost efficiency | Better for large historical data | Better for continuous small updates |

### Lambda Architecture

Lambda Architecture combines batch and stream processing to provide both accurate historical views and real-time updates.

```
                    +------------------+
                    |   Data Source    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     |   Batch Layer   |          |  Speed Layer    |
     | (Historical)    |          | (Real-time)     |
     +--------+--------+          +--------+--------+
              |                             |
     +--------v--------+          +--------v--------+
     |   Batch View    |          |  Real-time View |
     +--------+--------+          +--------+--------+
              |                             |
              +-------------+---------------+
                            |
                   +--------v--------+
                   |  Serving Layer  |
                   |   (Merge Views) |
                   +-----------------+
```

```python
# Lambda Architecture Example with Spark and Kafka

# Batch Layer - Process historical data
def batch_layer():
    spark = SparkSession.builder.appName("BatchLayer").getOrCreate()

    # Read historical data from data lake
    historical_data = spark.read.parquet("s3://data-lake/events/")

    # Complex aggregations and analytics
    batch_view = historical_data \
        .groupBy("user_id", "date") \
        .agg(
            count("*").alias("event_count"),
            sum("revenue").alias("total_revenue"),
            collect_list("event_type").alias("event_sequence")
        )

    # Write to batch view storage
    batch_view.write.mode("overwrite").parquet("s3://data-lake/batch-views/")

# Speed Layer - Process real-time data
def speed_layer():
    spark = SparkSession.builder.appName("SpeedLayer").getOrCreate()

    # Read from Kafka stream
    stream = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "localhost:9092") \
        .option("subscribe", "events") \
        .load()

    # Parse and aggregate in real-time
    real_time_view = stream \
        .selectExpr("CAST(value AS STRING)") \
        .select(from_json(col("value"), schema).alias("data")) \
        .select("data.*") \
        .groupBy(
            window(col("timestamp"), "1 hour"),
            col("user_id")
        ).agg(
            count("*").alias("event_count"),
            sum("revenue").alias("total_revenue")
        )

    # Write to speed view storage
    query = real_time_view.writeStream \
        .outputMode("update") \
        .format("console") \
        .start()
```

### Kappa Architecture

Kappa Architecture simplifies Lambda by using a single stream processing layer for both real-time and batch processing.

```
                    +------------------+
                    |   Data Source    |
                    +--------+---------+
                             |
                    +--------v--------+
                    |   Message Queue |
                    |    (Kafka)      |
                    +--------+--------+
                             |
                    +--------v--------+
                    | Stream Process  |
                    |    Layer        |
                    +--------+--------+
                             |
                    +--------v--------+
                    |  Serving Layer  |
                    +-----------------+
```

**Advantages of Kappa:**
- Simpler architecture with single processing path
- Easier to maintain and debug
- Reprocess by replaying from message queue
- Consistent code for real-time and historical processing

**When to use Lambda vs Kappa:**
- Use Lambda when batch and streaming logic differs significantly
- Use Kappa when you can express everything as stream processing
- Consider Lambda for complex ML models requiring batch training

## Event-Driven Architecture

### Core Concepts

Event-Driven Architecture (EDA) is a design pattern where system components communicate through events. This approach enables loose coupling, scalability, and real-time responsiveness.

**Key Components:**

1. **Event Producers**: Generate events when something significant happens
2. **Event Channels**: Transport events (message brokers like Kafka)
3. **Event Consumers**: React to events and take appropriate action
4. **Event Store**: Persist events for replay and auditing

```
+-------------+     +----------------+     +--------------+
|   Producer  | --> |  Event Channel | --> |   Consumer   |
| (Order Svc) |     |    (Kafka)     |     | (Inventory)  |
+-------------+     +----------------+     +--------------+
                           |
                           v
                    +--------------+
                    |   Consumer   |
                    | (Shipping)   |
                    +--------------+
                           |
                           v
                    +--------------+
                    |   Consumer   |
                    | (Analytics)  |
                    +--------------+
```

### Event Types

**Domain Events**: Represent something that happened in the business domain
```json
{
  "eventType": "OrderPlaced",
  "eventId": "evt-12345",
  "timestamp": "2024-01-15T10:30:00Z",
  "aggregateId": "order-67890",
  "payload": {
    "orderId": "order-67890",
    "customerId": "cust-111",
    "items": [
      {"productId": "prod-222", "quantity": 2, "price": 29.99}
    ],
    "totalAmount": 59.98
  },
  "metadata": {
    "correlationId": "corr-abc",
    "causationId": "cmd-xyz",
    "userId": "user-333"
  }
}
```

**Integration Events**: Used for communication between services
```json
{
  "eventType": "InventoryReserved",
  "eventId": "evt-54321",
  "timestamp": "2024-01-15T10:30:05Z",
  "source": "inventory-service",
  "payload": {
    "orderId": "order-67890",
    "reservationId": "res-999",
    "items": [
      {"productId": "prod-222", "quantity": 2, "warehouseId": "wh-01"}
    ]
  }
}
```

### Event Design Best Practices

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

@dataclass
class EventEnvelope:
    """Standard event envelope for all domain events."""
    event_id: str
    event_type: str
    timestamp: datetime
    aggregate_id: str
    aggregate_type: str
    version: int
    payload: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

    @classmethod
    def create(cls, event_type: str, aggregate_id: str,
               aggregate_type: str, payload: Dict[str, Any],
               correlation_id: Optional[str] = None):
        return cls(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.utcnow(),
            aggregate_id=aggregate_id,
            aggregate_type=aggregate_type,
            version=1,
            payload=payload,
            metadata={
                "correlation_id": correlation_id or str(uuid.uuid4()),
                "created_at": datetime.utcnow().isoformat()
            }
        )

# Domain Events
@dataclass
class OrderPlaced:
    order_id: str
    customer_id: str
    items: list
    total_amount: float

    def to_event_envelope(self, correlation_id: Optional[str] = None):
        return EventEnvelope.create(
            event_type="OrderPlaced",
            aggregate_id=self.order_id,
            aggregate_type="Order",
            payload={
                "order_id": self.order_id,
                "customer_id": self.customer_id,
                "items": self.items,
                "total_amount": self.total_amount
            },
            correlation_id=correlation_id
        )

# Event Publisher
class EventPublisher:
    def __init__(self, kafka_producer):
        self.producer = kafka_producer

    def publish(self, topic: str, event: EventEnvelope):
        """Publish event to Kafka topic."""
        key = event.aggregate_id.encode('utf-8')
        value = json.dumps(asdict(event), default=str).encode('utf-8')

        self.producer.send(
            topic=topic,
            key=key,
            value=value,
            headers=[
                ("event_type", event.event_type.encode('utf-8')),
                ("correlation_id", event.metadata.get("correlation_id", "").encode('utf-8'))
            ]
        )
        self.producer.flush()
```

### Saga Pattern for Distributed Transactions

The Saga pattern manages distributed transactions across multiple services through a sequence of local transactions and compensating actions.

```python
from enum import Enum
from typing import Callable, List, Optional
import logging

class SagaStepStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    COMPENSATED = "compensated"
    FAILED = "failed"

@dataclass
class SagaStep:
    name: str
    action: Callable
    compensation: Callable
    status: SagaStepStatus = SagaStepStatus.PENDING

class OrderSaga:
    """
    Orchestrates the order placement process across multiple services.

    Steps:
    1. Reserve inventory
    2. Process payment
    3. Create shipment

    If any step fails, compensating actions are executed in reverse order.
    """

    def __init__(self, event_publisher, services):
        self.event_publisher = event_publisher
        self.inventory_service = services['inventory']
        self.payment_service = services['payment']
        self.shipping_service = services['shipping']
        self.logger = logging.getLogger(__name__)
        self.steps: List[SagaStep] = []
        self.completed_steps: List[SagaStep] = []

    def execute(self, order):
        """Execute the saga for order processing."""
        self.steps = [
            SagaStep(
                name="reserve_inventory",
                action=lambda: self.inventory_service.reserve(order.items),
                compensation=lambda: self.inventory_service.release(order.items)
            ),
            SagaStep(
                name="process_payment",
                action=lambda: self.payment_service.charge(
                    order.customer_id, order.total_amount
                ),
                compensation=lambda: self.payment_service.refund(
                    order.customer_id, order.total_amount
                )
            ),
            SagaStep(
                name="create_shipment",
                action=lambda: self.shipping_service.create_shipment(order),
                compensation=lambda: self.shipping_service.cancel_shipment(order.order_id)
            )
        ]

        try:
            for step in self.steps:
                self.logger.info(f"Executing step: {step.name}")
                step.action()
                step.status = SagaStepStatus.COMPLETED
                self.completed_steps.append(step)

                # Publish step completion event
                self.event_publisher.publish(
                    "saga-events",
                    EventEnvelope.create(
                        event_type=f"SagaStep{step.name.title()}Completed",
                        aggregate_id=order.order_id,
                        aggregate_type="OrderSaga",
                        payload={"step": step.name, "order_id": order.order_id}
                    )
                )

            self.logger.info("Saga completed successfully")
            return True

        except Exception as e:
            self.logger.error(f"Saga failed at step: {e}")
            self._compensate()
            return False

    def _compensate(self):
        """Execute compensating actions in reverse order."""
        for step in reversed(self.completed_steps):
            try:
                self.logger.info(f"Compensating step: {step.name}")
                step.compensation()
                step.status = SagaStepStatus.COMPENSATED
            except Exception as e:
                self.logger.error(f"Compensation failed for {step.name}: {e}")
                step.status = SagaStepStatus.FAILED
```

## The Kafka Ecosystem

### Apache Kafka Architecture

Apache Kafka is a distributed event streaming platform capable of handling trillions of events per day. Understanding its architecture is essential for building robust streaming systems.

```
+------------------+     +------------------+     +------------------+
|    Producer 1    |     |    Producer 2    |     |    Producer 3    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v-------------+
                    |      Kafka Cluster        |
                    |  +---------------------+  |
                    |  |   Broker 1          |  |
                    |  | +-------+ +-------+ |  |
                    |  | |Part 0 | |Part 1 | |  |
                    |  | +-------+ +-------+ |  |
                    |  +---------------------+  |
                    |  +---------------------+  |
                    |  |   Broker 2          |  |
                    |  | +-------+ +-------+ |  |
                    |  | |Part 0 | |Part 2 | |  |
                    |  | |replica| |       | |  |
                    |  | +-------+ +-------+ |  |
                    |  +---------------------+  |
                    |  +---------------------+  |
                    |  |   Broker 3          |  |
                    |  | +-------+ +-------+ |  |
                    |  | |Part 1 | |Part 2 | |  |
                    |  | |replica| |replica| |  |
                    |  | +-------+ +-------+ |  |
                    |  +---------------------+  |
                    +-------------+-------------+
                                  |
         +------------------------+------------------------+
         |                        |                        |
+--------v---------+     +--------v---------+     +--------v---------+
| Consumer Group 1 |     | Consumer Group 2 |     | Consumer Group 3 |
|  (App Service)   |     |  (Analytics)     |     |  (Archival)      |
+------------------+     +------------------+     +------------------+
```

### Core Kafka Concepts

| Concept | Description |
|---------|-------------|
| **Topic** | A category or feed name to which records are published |
| **Partition** | A topic is split into partitions for parallelism and ordering |
| **Offset** | A unique identifier for each record within a partition |
| **Broker** | A Kafka server that stores data and serves clients |
| **Producer** | Application that publishes records to topics |
| **Consumer** | Application that subscribes to topics and processes records |
| **Consumer Group** | A group of consumers that work together to consume a topic |
| **Replication Factor** | Number of copies of data across brokers |
| **Leader** | The broker responsible for all reads and writes for a partition |
| **Follower** | Brokers that replicate the leader's data |

### Kafka Producer

```python
from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import logging

class KafkaEventProducer:
    """Production-ready Kafka producer with best practices."""

    def __init__(self, bootstrap_servers: str, config: dict = None):
        default_config = {
            'bootstrap_servers': bootstrap_servers,
            'value_serializer': lambda v: json.dumps(v).encode('utf-8'),
            'key_serializer': lambda k: k.encode('utf-8') if k else None,
            'acks': 'all',  # Wait for all replicas to acknowledge
            'retries': 3,
            'retry_backoff_ms': 100,
            'max_in_flight_requests_per_connection': 5,
            'enable_idempotence': True,  # Exactly-once semantics
            'compression_type': 'snappy',
            'batch_size': 16384,  # 16KB
            'linger_ms': 10,  # Wait up to 10ms to batch
            'buffer_memory': 33554432,  # 32MB buffer
        }

        if config:
            default_config.update(config)

        self.producer = KafkaProducer(**default_config)
        self.logger = logging.getLogger(__name__)

    def send(self, topic: str, value: dict, key: str = None,
             headers: list = None, partition: int = None):
        """
        Send a message to Kafka with delivery confirmation.

        Args:
            topic: Target topic name
            value: Message payload (will be JSON serialized)
            key: Optional message key for partitioning
            headers: Optional list of (key, value) header tuples
            partition: Optional specific partition number
        """
        try:
            future = self.producer.send(
                topic=topic,
                value=value,
                key=key,
                headers=headers,
                partition=partition
            )

            # Block for synchronous send with timeout
            record_metadata = future.get(timeout=10)

            self.logger.info(
                f"Message sent to {record_metadata.topic} "
                f"partition {record_metadata.partition} "
                f"offset {record_metadata.offset}"
            )

            return record_metadata

        except KafkaError as e:
            self.logger.error(f"Failed to send message: {e}")
            raise

    def send_async(self, topic: str, value: dict, key: str = None,
                   on_success=None, on_error=None):
        """Send message asynchronously with callbacks."""

        def default_on_success(record_metadata):
            self.logger.debug(
                f"Async message sent: {record_metadata.topic}:{record_metadata.partition}"
            )

        def default_on_error(exc):
            self.logger.error(f"Async message failed: {exc}")

        future = self.producer.send(topic=topic, value=value, key=key)
        future.add_callback(on_success or default_on_success)
        future.add_errback(on_error or default_on_error)

        return future

    def send_batch(self, topic: str, messages: list):
        """Send multiple messages in a batch."""
        futures = []
        for msg in messages:
            future = self.producer.send(
                topic=topic,
                value=msg.get('value'),
                key=msg.get('key')
            )
            futures.append(future)

        # Wait for all messages to be sent
        self.producer.flush()

        # Check results
        results = []
        for future in futures:
            try:
                record_metadata = future.get(timeout=10)
                results.append({
                    'success': True,
                    'partition': record_metadata.partition,
                    'offset': record_metadata.offset
                })
            except Exception as e:
                results.append({'success': False, 'error': str(e)})

        return results

    def close(self):
        """Flush and close the producer."""
        self.producer.flush()
        self.producer.close()


# Usage example
producer = KafkaEventProducer('localhost:9092')

# Send order event
order_event = {
    'event_type': 'OrderCreated',
    'order_id': 'order-123',
    'customer_id': 'cust-456',
    'items': [{'product_id': 'prod-789', 'quantity': 2}],
    'total': 99.99,
    'timestamp': '2024-01-15T10:30:00Z'
}

producer.send(
    topic='orders',
    value=order_event,
    key='order-123',  # Use order_id as key for partition locality
    headers=[
        ('event_type', b'OrderCreated'),
        ('source', b'order-service')
    ]
)
```

### Kafka Consumer

```python
from kafka import KafkaConsumer, OffsetAndMetadata, TopicPartition
from kafka.errors import KafkaError
import json
import logging
from typing import Callable, Dict, List
import signal
import sys

class KafkaEventConsumer:
    """Production-ready Kafka consumer with at-least-once semantics."""

    def __init__(self, bootstrap_servers: str, group_id: str,
                 topics: List[str], config: dict = None):
        default_config = {
            'bootstrap_servers': bootstrap_servers,
            'group_id': group_id,
            'value_deserializer': lambda v: json.loads(v.decode('utf-8')),
            'key_deserializer': lambda k: k.decode('utf-8') if k else None,
            'auto_offset_reset': 'earliest',  # Start from beginning if no offset
            'enable_auto_commit': False,  # Manual commit for at-least-once
            'max_poll_records': 500,
            'max_poll_interval_ms': 300000,  # 5 minutes max processing time
            'session_timeout_ms': 30000,
            'heartbeat_interval_ms': 10000,
            'fetch_min_bytes': 1,
            'fetch_max_wait_ms': 500,
        }

        if config:
            default_config.update(config)

        self.consumer = KafkaConsumer(**default_config)
        self.consumer.subscribe(topics)
        self.logger = logging.getLogger(__name__)
        self.running = True
        self.handlers: Dict[str, Callable] = {}

        # Setup graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        self.logger.info("Shutdown signal received")
        self.running = False

    def register_handler(self, event_type: str, handler: Callable):
        """Register a handler for a specific event type."""
        self.handlers[event_type] = handler

    def consume(self, batch_timeout_ms: int = 1000):
        """
        Main consumption loop with manual offset management.

        Implements at-least-once delivery by committing offsets
        only after successful processing.
        """
        self.logger.info("Starting consumer loop")

        while self.running:
            try:
                # Poll for messages
                records = self.consumer.poll(
                    timeout_ms=batch_timeout_ms,
                    max_records=100
                )

                if not records:
                    continue

                # Process messages by partition for offset tracking
                offsets_to_commit = {}

                for topic_partition, messages in records.items():
                    for message in messages:
                        try:
                            self._process_message(message)

                            # Track highest offset processed per partition
                            offsets_to_commit[topic_partition] = OffsetAndMetadata(
                                message.offset + 1, None
                            )

                        except Exception as e:
                            self.logger.error(
                                f"Error processing message at "
                                f"{topic_partition.topic}:{topic_partition.partition}:"
                                f"{message.offset}: {e}"
                            )
                            # Depending on requirements, you might:
                            # - Retry the message
                            # - Send to dead letter queue
                            # - Skip and continue
                            self._handle_processing_error(message, e)

                # Commit offsets after successful processing
                if offsets_to_commit:
                    self.consumer.commit(offsets_to_commit)
                    self.logger.debug(f"Committed offsets: {offsets_to_commit}")

            except KafkaError as e:
                self.logger.error(f"Kafka error: {e}")

        self.logger.info("Consumer loop ended")
        self.consumer.close()

    def _process_message(self, message):
        """Process a single message using registered handlers."""
        value = message.value
        event_type = value.get('event_type')

        self.logger.info(
            f"Processing message: topic={message.topic}, "
            f"partition={message.partition}, offset={message.offset}, "
            f"event_type={event_type}"
        )

        handler = self.handlers.get(event_type)
        if handler:
            handler(value, message)
        else:
            self.logger.warning(f"No handler registered for event type: {event_type}")

    def _handle_processing_error(self, message, error):
        """Handle message processing errors."""
        # Send to dead letter queue
        # In production, you would publish to a separate DLQ topic
        self.logger.error(
            f"Message sent to DLQ: topic={message.topic}, "
            f"partition={message.partition}, offset={message.offset}, "
            f"error={error}"
        )


# Usage example
def handle_order_created(event, message):
    """Process OrderCreated events."""
    print(f"Processing order: {event['order_id']}")
    # Business logic here
    # - Update inventory
    # - Send confirmation email
    # - Update analytics

def handle_order_shipped(event, message):
    """Process OrderShipped events."""
    print(f"Order shipped: {event['order_id']}")
    # Update order status, notify customer

consumer = KafkaEventConsumer(
    bootstrap_servers='localhost:9092',
    group_id='order-processor',
    topics=['orders']
)

consumer.register_handler('OrderCreated', handle_order_created)
consumer.register_handler('OrderShipped', handle_order_shipped)

# Start consuming (blocking call)
consumer.consume()
```

### Kafka Streams

Kafka Streams is a client library for building stream processing applications that transform and analyze data stored in Kafka.

```java
// Kafka Streams Example (Java)
import org.apache.kafka.streams.*;
import org.apache.kafka.streams.kstream.*;
import org.apache.kafka.common.serialization.Serdes;

import java.util.Properties;
import java.time.Duration;

public class OrderStreamProcessor {

    public static void main(String[] args) {
        Properties props = new Properties();
        props.put(StreamsConfig.APPLICATION_ID_CONFIG, "order-processor");
        props.put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String().getClass());
        props.put(StreamsConfig.PROCESSING_GUARANTEE_CONFIG, StreamsConfig.EXACTLY_ONCE_V2);

        StreamsBuilder builder = new StreamsBuilder();

        // Read from orders topic
        KStream<String, String> orders = builder.stream("orders");

        // Parse JSON and extract order details
        KStream<String, Order> parsedOrders = orders
            .mapValues(value -> parseOrder(value))
            .filter((key, order) -> order != null);

        // Branch orders by value
        Map<String, KStream<String, Order>> branches = parsedOrders.split(Named.as("order-"))
            .branch((key, order) -> order.getTotal() > 1000, Branched.as("high-value"))
            .branch((key, order) -> order.getTotal() > 100, Branched.as("medium-value"))
            .defaultBranch(Branched.as("low-value"));

        // Process high-value orders with special handling
        branches.get("order-high-value")
            .peek((key, order) -> System.out.println("High-value order: " + key))
            .to("high-value-orders");

        // Aggregate orders by customer over time windows
        KTable<Windowed<String>, Long> orderCounts = parsedOrders
            .groupBy((key, order) -> order.getCustomerId())
            .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofMinutes(5)))
            .count();

        // Join orders with customer data
        KTable<String, Customer> customers = builder.table("customers");

        KStream<String, EnrichedOrder> enrichedOrders = parsedOrders
            .selectKey((key, order) -> order.getCustomerId())
            .join(
                customers,
                (order, customer) -> new EnrichedOrder(order, customer),
                Joined.with(Serdes.String(), orderSerde, customerSerde)
            );

        enrichedOrders.to("enriched-orders");

        // Build and start the topology
        Topology topology = builder.build();
        KafkaStreams streams = new KafkaStreams(topology, props);

        // Add shutdown hook
        Runtime.getRuntime().addShutdownHook(new Thread(streams::close));

        streams.start();
    }
}
```

### Kafka Connect

Kafka Connect is a framework for connecting Kafka with external systems like databases, key-value stores, and file systems.

```json
// Source Connector Configuration - PostgreSQL to Kafka
{
  "name": "postgres-source-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "postgres-server",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "${secrets:postgres:password}",
    "database.dbname": "orders_db",
    "database.server.name": "orders",
    "table.include.list": "public.orders,public.order_items",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_slot",
    "publication.name": "dbz_publication",
    "snapshot.mode": "initial",
    "transforms": "unwrap,route",
    "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex": "orders\\.public\\.(.*)",
    "transforms.route.replacement": "$1-events"
  }
}
```

```json
// Sink Connector Configuration - Kafka to Elasticsearch
{
  "name": "elasticsearch-sink-connector",
  "config": {
    "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
    "connection.url": "http://elasticsearch:9200",
    "connection.username": "elastic",
    "connection.password": "${secrets:elasticsearch:password}",
    "topics": "orders-events,order_items-events",
    "type.name": "_doc",
    "key.ignore": "false",
    "schema.ignore": "true",
    "behavior.on.null.values": "delete",
    "write.method": "upsert",
    "batch.size": 1000,
    "max.buffered.records": 5000,
    "flush.timeout.ms": 60000,
    "max.retries": 5,
    "retry.backoff.ms": 1000
  }
}
```

### Schema Registry

Schema Registry provides a centralized repository for managing Avro, JSON Schema, or Protobuf schemas.

```python
from confluent_kafka import avro
from confluent_kafka.avro import AvroProducer, AvroConsumer
from confluent_kafka.avro.serializer import SerializerError

# Define Avro schema
order_schema_str = """
{
  "type": "record",
  "name": "Order",
  "namespace": "com.example.events",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "customer_id", "type": "string"},
    {"name": "items", "type": {
      "type": "array",
      "items": {
        "type": "record",
        "name": "OrderItem",
        "fields": [
          {"name": "product_id", "type": "string"},
          {"name": "quantity", "type": "int"},
          {"name": "price", "type": "double"}
        ]
      }
    }},
    {"name": "total", "type": "double"},
    {"name": "status", "type": {
      "type": "enum",
      "name": "OrderStatus",
      "symbols": ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
    }},
    {"name": "created_at", "type": {"type": "long", "logicalType": "timestamp-millis"}}
  ]
}
"""

order_schema = avro.loads(order_schema_str)

# Producer with Schema Registry
producer_config = {
    'bootstrap.servers': 'localhost:9092',
    'schema.registry.url': 'http://localhost:8081'
}

producer = AvroProducer(producer_config, default_value_schema=order_schema)

# Produce message with schema validation
order = {
    'order_id': 'order-123',
    'customer_id': 'cust-456',
    'items': [
        {'product_id': 'prod-789', 'quantity': 2, 'price': 29.99}
    ],
    'total': 59.98,
    'status': 'PENDING',
    'created_at': 1705312200000
}

producer.produce(topic='orders', value=order, key='order-123')
producer.flush()

# Consumer with Schema Registry
consumer_config = {
    'bootstrap.servers': 'localhost:9092',
    'schema.registry.url': 'http://localhost:8081',
    'group.id': 'order-consumer',
    'auto.offset.reset': 'earliest'
}

consumer = AvroConsumer(consumer_config)
consumer.subscribe(['orders'])

while True:
    try:
        msg = consumer.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print(f"Consumer error: {msg.error()}")
            continue

        # Message is automatically deserialized using schema
        order = msg.value()
        print(f"Received order: {order['order_id']}, status: {order['status']}")

    except SerializerError as e:
        print(f"Schema error: {e}")
```

## Stream Processing Patterns

### Windowing Patterns

Windowing is fundamental to stream processing, allowing you to group events by time for aggregation.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

spark = SparkSession.builder \
    .appName("WindowingPatterns") \
    .getOrCreate()

# Sample streaming data schema
schema = StructType([
    StructField("event_id", StringType()),
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("amount", DoubleType()),
    StructField("timestamp", TimestampType())
])

# Read from Kafka
stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .load() \
    .select(from_json(col("value").cast("string"), schema).alias("data")) \
    .select("data.*")

# Tumbling Window - Fixed, non-overlapping windows
tumbling_aggregation = stream \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "5 minutes"),  # 5-minute tumbling window
        col("event_type")
    ).agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount")
    )

# Sliding Window - Overlapping windows
sliding_aggregation = stream \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "10 minutes", "2 minutes"),  # 10-min window, slide every 2 min
        col("user_id")
    ).agg(
        count("*").alias("event_count"),
        collect_list("event_type").alias("event_sequence")
    )

# Session Window - Gap-based windows (Spark 3.2+)
session_aggregation = stream \
    .withWatermark("timestamp", "30 minutes") \
    .groupBy(
        session_window(col("timestamp"), "10 minutes"),  # New session after 10-min gap
        col("user_id")
    ).agg(
        count("*").alias("events_in_session"),
        min("timestamp").alias("session_start"),
        max("timestamp").alias("session_end"),
        sum("amount").alias("session_total")
    )
```

```
Tumbling Window (5 minutes):
|-------|-------|-------|-------|
|  W1   |  W2   |  W3   |  W4   |
|-------|-------|-------|-------|
0       5       10      15      20 (minutes)

Sliding Window (10 min window, 2 min slide):
|---------------|
    |---------------|
        |---------------|
            |---------------|
|---|---|---|---|---|---|---|---|
0   2   4   6   8   10  12  14  16 (minutes)

Session Window (10 min gap):
User A: [e1, e2, e3] ... 15 min gap ... [e4, e5]
        |-- Session 1 --|              |-- Session 2 --|
```

### Stateful Processing Patterns

```python
from pyspark.sql.streaming.state import GroupState, GroupStateTimeout

# Stateful Processing with mapGroupsWithState (Scala/Java)
# Python equivalent using flatMapGroupsWithState

def update_user_state(user_id, events, state):
    """
    Maintain user state across streaming batches.

    Args:
        user_id: The grouping key
        events: Iterator of events for this user in current batch
        state: GroupState object for maintaining state
    """
    # Get existing state or initialize
    if state.exists:
        current_state = state.get
    else:
        current_state = {
            'total_events': 0,
            'total_amount': 0.0,
            'last_event_time': None,
            'event_types': set()
        }

    # Process new events
    for event in events:
        current_state['total_events'] += 1
        current_state['total_amount'] += event.amount
        current_state['last_event_time'] = event.timestamp
        current_state['event_types'].add(event.event_type)

    # Update state
    state.update(current_state)

    # Optionally set timeout for state cleanup
    state.setTimeoutDuration("1 hour")

    # Emit result
    yield {
        'user_id': user_id,
        'total_events': current_state['total_events'],
        'total_amount': current_state['total_amount'],
        'last_event_time': current_state['last_event_time'],
        'unique_event_types': len(current_state['event_types'])
    }

# Apply stateful processing
# Note: In PySpark, use applyInPandas or foreachBatch for similar functionality
stateful_stream = stream \
    .groupBy("user_id") \
    .applyInPandas(update_user_state_pandas, output_schema)
```

### Join Patterns

```python
# Stream-Stream Join
# Joining two event streams with time constraints

# Stream 1: Impressions
impressions = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "impressions") \
    .load() \
    .select(from_json(col("value").cast("string"), impression_schema).alias("data")) \
    .select("data.*") \
    .withWatermark("impression_time", "2 hours")

# Stream 2: Clicks
clicks = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "clicks") \
    .load() \
    .select(from_json(col("value").cast("string"), click_schema).alias("data")) \
    .select("data.*") \
    .withWatermark("click_time", "3 hours")

# Join impressions with clicks within 1-hour window
impressions_with_clicks = impressions.join(
    clicks,
    expr("""
        impression_id = click_impression_id AND
        click_time >= impression_time AND
        click_time <= impression_time + interval 1 hour
    """),
    "leftOuter"
)

# Calculate click-through rate
ctr_stats = impressions_with_clicks \
    .groupBy(
        window(col("impression_time"), "1 hour"),
        col("campaign_id")
    ).agg(
        count("impression_id").alias("impressions"),
        count("click_id").alias("clicks")
    ).withColumn(
        "ctr", col("clicks") / col("impressions")
    )


# Stream-Static Join
# Enrich streaming data with static reference data

# Static dimension table (refresh periodically)
products = spark.read.parquet("s3://data-lake/products/")

# Streaming orders
orders = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "orders") \
    .load()

# Join streaming orders with static products
enriched_orders = orders.join(
    products,
    orders.product_id == products.product_id,
    "left"
).select(
    orders["*"],
    products["product_name"],
    products["category"],
    products["price"]
)
```

### Deduplication Pattern

```python
# Deduplicate events based on event_id within a time window

def deduplicate_stream(stream, id_column, timestamp_column, watermark_delay):
    """
    Remove duplicate events within a time window.

    Uses watermarking to bound state size.
    """
    return stream \
        .withWatermark(timestamp_column, watermark_delay) \
        .dropDuplicates([id_column, timestamp_column])

# Usage
deduped_events = deduplicate_stream(
    stream=events,
    id_column="event_id",
    timestamp_column="timestamp",
    watermark_delay="10 minutes"
)


# Alternative: Deduplication with explicit state management
from collections import OrderedDict

class DeduplicationProcessor:
    """
    Deduplication processor with LRU cache for seen event IDs.
    """

    def __init__(self, max_cache_size=100000, ttl_seconds=3600):
        self.seen_events = OrderedDict()
        self.max_cache_size = max_cache_size
        self.ttl_seconds = ttl_seconds

    def is_duplicate(self, event_id: str, timestamp: float) -> bool:
        """Check if event is duplicate and update cache."""
        current_time = time.time()

        # Clean expired entries
        self._cleanup_expired(current_time)

        if event_id in self.seen_events:
            return True

        # Add to cache
        self.seen_events[event_id] = current_time

        # Evict oldest if cache is full
        while len(self.seen_events) > self.max_cache_size:
            self.seen_events.popitem(last=False)

        return False

    def _cleanup_expired(self, current_time):
        """Remove entries older than TTL."""
        expired_keys = [
            key for key, timestamp in self.seen_events.items()
            if current_time - timestamp > self.ttl_seconds
        ]
        for key in expired_keys:
            del self.seen_events[key]
```

### Complex Event Processing (CEP)

```python
# Pattern Detection in Event Streams

from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime, timedelta

@dataclass
class Event:
    event_id: str
    user_id: str
    event_type: str
    amount: float
    timestamp: datetime

@dataclass
class Pattern:
    name: str
    events: List[str]
    within: timedelta
    condition: Optional[callable] = None

class CEPEngine:
    """
    Simple Complex Event Processing engine for pattern detection.
    """

    def __init__(self):
        self.patterns: List[Pattern] = []
        self.event_buffer: dict = {}  # user_id -> list of events
        self.buffer_ttl = timedelta(hours=1)

    def register_pattern(self, pattern: Pattern):
        """Register a pattern to detect."""
        self.patterns.append(pattern)

    def process_event(self, event: Event) -> List[dict]:
        """
        Process an event and check for pattern matches.

        Returns list of detected patterns.
        """
        # Add event to user's buffer
        if event.user_id not in self.event_buffer:
            self.event_buffer[event.user_id] = []

        self.event_buffer[event.user_id].append(event)

        # Clean old events
        self._cleanup_buffer(event.user_id, event.timestamp)

        # Check patterns
        matches = []
        for pattern in self.patterns:
            match = self._check_pattern(event.user_id, pattern, event.timestamp)
            if match:
                matches.append({
                    'pattern_name': pattern.name,
                    'user_id': event.user_id,
                    'events': match,
                    'detected_at': event.timestamp
                })

        return matches

    def _check_pattern(self, user_id: str, pattern: Pattern,
                       current_time: datetime) -> Optional[List[Event]]:
        """Check if pattern is matched in user's event sequence."""
        events = self.event_buffer.get(user_id, [])

        # Filter events within pattern window
        window_start = current_time - pattern.within
        recent_events = [e for e in events if e.timestamp >= window_start]

        # Check if all pattern events are present in order
        matched_events = []
        pattern_idx = 0

        for event in recent_events:
            if pattern_idx >= len(pattern.events):
                break
            if event.event_type == pattern.events[pattern_idx]:
                matched_events.append(event)
                pattern_idx += 1

        if pattern_idx == len(pattern.events):
            # All pattern events found, check additional condition
            if pattern.condition is None or pattern.condition(matched_events):
                return matched_events

        return None

    def _cleanup_buffer(self, user_id: str, current_time: datetime):
        """Remove events older than buffer TTL."""
        cutoff = current_time - self.buffer_ttl
        self.event_buffer[user_id] = [
            e for e in self.event_buffer[user_id]
            if e.timestamp >= cutoff
        ]


# Usage Example: Fraud Detection Patterns

cep_engine = CEPEngine()

# Pattern 1: Rapid small transactions followed by large transaction
def high_value_after_small(events):
    small_total = sum(e.amount for e in events[:-1])
    large_amount = events[-1].amount
    return small_total < 100 and large_amount > 1000

cep_engine.register_pattern(Pattern(
    name="potential_fraud_pattern",
    events=["small_purchase", "small_purchase", "small_purchase", "large_purchase"],
    within=timedelta(minutes=30),
    condition=high_value_after_small
))

# Pattern 2: Failed login attempts followed by successful login
cep_engine.register_pattern(Pattern(
    name="brute_force_success",
    events=["login_failed", "login_failed", "login_failed", "login_success"],
    within=timedelta(minutes=5)
))

# Pattern 3: Card testing pattern
cep_engine.register_pattern(Pattern(
    name="card_testing",
    events=["declined_1_dollar", "declined_1_dollar", "approved_large"],
    within=timedelta(minutes=10)
))

# Process incoming events
for event in event_stream:
    matches = cep_engine.process_event(event)
    for match in matches:
        print(f"Pattern detected: {match['pattern_name']} for user {match['user_id']}")
        # Trigger alert, block transaction, etc.
```

## Exactly-Once Semantics

### Understanding Delivery Guarantees

| Guarantee | Description | Use Case |
|-----------|-------------|----------|
| **At-most-once** | Messages may be lost but never duplicated | Metrics, logs where some loss is acceptable |
| **At-least-once** | Messages are never lost but may be duplicated | Most applications with idempotent processing |
| **Exactly-once** | Messages are delivered exactly once | Financial transactions, inventory updates |

### Implementing Exactly-Once in Kafka

```python
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json

class ExactlyOnceProducer:
    """
    Kafka producer with exactly-once semantics using idempotent producer
    and transactional writes.
    """

    def __init__(self, bootstrap_servers: str, transactional_id: str):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',
            enable_idempotence=True,  # Enable idempotent producer
            transactional_id=transactional_id,  # Enable transactions
            max_in_flight_requests_per_connection=5,
            retries=2147483647,  # Max retries for reliability
        )

        # Initialize transactions
        self.producer.init_transactions()

    def send_transactional(self, messages: list):
        """
        Send multiple messages in a single transaction.
        Either all succeed or none do.
        """
        try:
            self.producer.begin_transaction()

            for msg in messages:
                self.producer.send(
                    topic=msg['topic'],
                    key=msg.get('key'),
                    value=msg['value']
                )

            self.producer.commit_transaction()

        except KafkaError as e:
            self.producer.abort_transaction()
            raise e

    def consume_transform_produce(self, consumer, input_topic, output_topic,
                                   transform_fn):
        """
        Atomic consume-transform-produce pattern.

        Reads from input topic, transforms, and writes to output topic
        in a single transaction, including offset commits.
        """
        try:
            self.producer.begin_transaction()

            # Consume messages
            records = consumer.poll(timeout_ms=1000)

            for tp, messages in records.items():
                for message in messages:
                    # Transform
                    transformed = transform_fn(message.value)

                    # Produce to output topic
                    self.producer.send(
                        topic=output_topic,
                        key=message.key,
                        value=transformed
                    )

                # Send offsets to transaction
                self.producer.send_offsets_to_transaction(
                    {tp: message.offset + 1},
                    consumer.group_id
                )

            self.producer.commit_transaction()

        except Exception as e:
            self.producer.abort_transaction()
            raise e


class ExactlyOnceConsumer:
    """
    Consumer configured for exactly-once processing with read_committed isolation.
    """

    def __init__(self, bootstrap_servers: str, group_id: str, topics: list):
        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            enable_auto_commit=False,
            isolation_level='read_committed',  # Only read committed transactions
            auto_offset_reset='earliest'
        )

    def consume_exactly_once(self, process_fn, db_connection):
        """
        Exactly-once consumption with database sink using outbox pattern.
        """
        while True:
            records = self.consumer.poll(timeout_ms=1000)

            for tp, messages in records.items():
                for message in messages:
                    # Begin database transaction
                    with db_connection.begin() as txn:
                        try:
                            # Check if already processed (idempotency check)
                            if self._is_processed(db_connection, message.key):
                                continue

                            # Process message
                            result = process_fn(message.value)

                            # Store result
                            self._store_result(db_connection, result)

                            # Mark as processed
                            self._mark_processed(db_connection, message.key)

                            # Store offset in same transaction
                            self._store_offset(
                                db_connection,
                                tp.topic,
                                tp.partition,
                                message.offset
                            )

                            txn.commit()

                        except Exception as e:
                            txn.rollback()
                            raise e
```

### Idempotent Processing

```python
import hashlib
from datetime import datetime, timedelta
import redis

class IdempotentProcessor:
    """
    Ensures idempotent message processing using deduplication.
    """

    def __init__(self, redis_client: redis.Redis, ttl_seconds: int = 86400):
        self.redis = redis_client
        self.ttl = ttl_seconds

    def process_idempotently(self, message_id: str, process_fn: callable,
                              *args, **kwargs):
        """
        Process a message idempotently.

        Uses Redis to track processed message IDs and prevent duplicate processing.
        """
        # Generate idempotency key
        idempotency_key = f"processed:{message_id}"

        # Try to set key (returns True if key didn't exist)
        is_new = self.redis.set(
            idempotency_key,
            datetime.utcnow().isoformat(),
            nx=True,  # Only set if not exists
            ex=self.ttl  # Expire after TTL
        )

        if not is_new:
            # Already processed
            return {'status': 'duplicate', 'message_id': message_id}

        try:
            # Process the message
            result = process_fn(*args, **kwargs)
            return {'status': 'processed', 'message_id': message_id, 'result': result}

        except Exception as e:
            # Remove key on failure to allow retry
            self.redis.delete(idempotency_key)
            raise e

    def generate_idempotency_key(self, event: dict) -> str:
        """
        Generate a deterministic idempotency key from event content.

        Useful when events don't have natural IDs.
        """
        # Create hash from event content
        content = json.dumps(event, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()


# Database-based idempotency with optimistic locking
class DatabaseIdempotencyHandler:
    """
    Idempotent processing with database-backed deduplication.
    """

    def __init__(self, db_session):
        self.db = db_session

    def process_with_idempotency(self, event_id: str, process_fn: callable,
                                   expected_version: int = None):
        """
        Process event with optimistic locking for exactly-once semantics.
        """
        # Check if event already processed
        existing = self.db.query(ProcessedEvent).filter_by(
            event_id=event_id
        ).first()

        if existing:
            return existing.result

        # Process event
        result = process_fn()

        # Record processing with version check
        processed_event = ProcessedEvent(
            event_id=event_id,
            processed_at=datetime.utcnow(),
            result=result,
            version=expected_version or 1
        )

        try:
            self.db.add(processed_event)
            self.db.commit()
        except IntegrityError:
            # Concurrent processing detected
            self.db.rollback()
            # Return existing result
            existing = self.db.query(ProcessedEvent).filter_by(
                event_id=event_id
            ).first()
            return existing.result

        return result
```

### Transactional Outbox Pattern

```python
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
import json
from datetime import datetime

Base = declarative_base()

class OutboxEvent(Base):
    """
    Outbox table for reliable event publishing.

    Events are written to this table in the same transaction as business data,
    then published to Kafka by a separate process.
    """
    __tablename__ = 'outbox_events'

    id = Column(Integer, primary_key=True)
    aggregate_type = Column(String(255), nullable=False)
    aggregate_id = Column(String(255), nullable=False)
    event_type = Column(String(255), nullable=False)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)


class OutboxPublisher:
    """
    Publishes events from outbox table to Kafka.

    Runs as a separate process, polling the outbox table and publishing
    unpublished events.
    """

    def __init__(self, db_session, kafka_producer, batch_size: int = 100):
        self.db = db_session
        self.producer = kafka_producer
        self.batch_size = batch_size

    def publish_pending_events(self):
        """Publish all pending events from outbox."""
        while True:
            # Get batch of unpublished events
            events = self.db.query(OutboxEvent) \
                .filter_by(published=False) \
                .order_by(OutboxEvent.created_at) \
                .limit(self.batch_size) \
                .all()

            if not events:
                break

            for event in events:
                try:
                    # Publish to Kafka
                    topic = f"{event.aggregate_type.lower()}-events"
                    self.producer.send(
                        topic=topic,
                        key=event.aggregate_id,
                        value=json.loads(event.payload),
                        headers=[
                            ('event_type', event.event_type.encode('utf-8'))
                        ]
                    )

                    # Mark as published
                    event.published = True
                    event.published_at = datetime.utcnow()

                except Exception as e:
                    logging.error(f"Failed to publish event {event.id}: {e}")
                    continue

            self.db.commit()
            self.producer.flush()


class OrderService:
    """
    Example service using outbox pattern for reliable event publishing.
    """

    def __init__(self, db_session):
        self.db = db_session

    def create_order(self, order_data: dict) -> Order:
        """
        Create order and publish event in same transaction.
        """
        # Create order
        order = Order(
            customer_id=order_data['customer_id'],
            items=order_data['items'],
            total=order_data['total'],
            status='PENDING'
        )
        self.db.add(order)

        # Create outbox event (same transaction)
        outbox_event = OutboxEvent(
            aggregate_type='Order',
            aggregate_id=str(order.id),
            event_type='OrderCreated',
            payload=json.dumps({
                'order_id': str(order.id),
                'customer_id': order.customer_id,
                'items': order.items,
                'total': order.total,
                'created_at': datetime.utcnow().isoformat()
            })
        )
        self.db.add(outbox_event)

        # Both committed together
        self.db.commit()

        return order
```

## Real-World Use Cases

### Real-time Fraud Detection

```python
class FraudDetectionPipeline:
    """
    Real-time fraud detection system using streaming.
    """

    def __init__(self, spark):
        self.spark = spark
        self.rules = self._load_rules()
        self.ml_model = self._load_ml_model()

    def build_pipeline(self):
        # Read transactions from Kafka
        transactions = self.spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("subscribe", "transactions") \
            .option("startingOffsets", "latest") \
            .load()

        # Parse transaction data
        parsed = transactions.select(
            from_json(col("value").cast("string"), self.transaction_schema).alias("txn")
        ).select("txn.*")

        # Enrich with customer profile
        customer_profiles = self.spark.read.parquet("s3://data/customer_profiles/")
        enriched = parsed.join(
            broadcast(customer_profiles),
            parsed.customer_id == customer_profiles.customer_id,
            "left"
        )

        # Apply rule-based detection
        with_rule_scores = self._apply_rules(enriched)

        # Apply ML model for scoring
        with_ml_scores = self._apply_ml_model(with_rule_scores)

        # Calculate final fraud score
        scored = with_ml_scores.withColumn(
            "fraud_score",
            (col("rule_score") * 0.4 + col("ml_score") * 0.6)
        ).withColumn(
            "is_fraud",
            when(col("fraud_score") > 0.8, True).otherwise(False)
        )

        # Route high-risk transactions
        high_risk = scored.filter(col("fraud_score") > 0.6)

        # Write alerts to Kafka
        alert_query = high_risk.selectExpr(
            "transaction_id AS key",
            "to_json(struct(*)) AS value"
        ).writeStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("topic", "fraud-alerts") \
            .option("checkpointLocation", "/checkpoints/fraud-alerts") \
            .outputMode("append") \
            .start()

        # Write all scored transactions to data lake
        archive_query = scored.writeStream \
            .format("delta") \
            .option("path", "s3://data-lake/fraud-scores/") \
            .option("checkpointLocation", "/checkpoints/fraud-archive") \
            .partitionBy("date") \
            .outputMode("append") \
            .start()

        return [alert_query, archive_query]

    def _apply_rules(self, df):
        """Apply rule-based fraud detection."""
        return df.withColumn(
            "rule_score",
            (
                # High amount transaction
                when(col("amount") > col("avg_transaction_amount") * 5, 0.3)
                .otherwise(0.0)
            ) + (
                # Unusual location
                when(col("location") != col("usual_location"), 0.2)
                .otherwise(0.0)
            ) + (
                # Multiple transactions in short time
                when(col("transactions_last_hour") > 10, 0.3)
                .otherwise(0.0)
            ) + (
                # New device
                when(col("is_new_device") == True, 0.2)
                .otherwise(0.0)
            )
        )
```

### Real-time Analytics Dashboard

```python
class RealTimeAnalyticsPipeline:
    """
    Pipeline for real-time analytics dashboard with multiple metrics.
    """

    def __init__(self, spark):
        self.spark = spark

    def build_pipeline(self):
        # Read events
        events = self.spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("subscribe", "user-events") \
            .load()

        parsed = events.select(
            from_json(col("value").cast("string"), self.event_schema).alias("event")
        ).select("event.*") \
         .withWatermark("timestamp", "5 minutes")

        # Metric 1: Active users per minute
        active_users = parsed \
            .groupBy(
                window(col("timestamp"), "1 minute")
            ).agg(
                countDistinct("user_id").alias("active_users")
            )

        # Metric 2: Events by type per minute
        events_by_type = parsed \
            .groupBy(
                window(col("timestamp"), "1 minute"),
                col("event_type")
            ).agg(
                count("*").alias("event_count")
            )

        # Metric 3: Revenue per minute
        revenue = parsed \
            .filter(col("event_type") == "purchase") \
            .groupBy(
                window(col("timestamp"), "1 minute")
            ).agg(
                sum("amount").alias("revenue"),
                count("*").alias("purchase_count"),
                avg("amount").alias("avg_order_value")
            )

        # Metric 4: Conversion funnel (5-minute windows)
        funnel = parsed \
            .groupBy(
                window(col("timestamp"), "5 minutes")
            ).agg(
                sum(when(col("event_type") == "page_view", 1).otherwise(0)).alias("page_views"),
                sum(when(col("event_type") == "add_to_cart", 1).otherwise(0)).alias("add_to_cart"),
                sum(when(col("event_type") == "checkout_start", 1).otherwise(0)).alias("checkout_start"),
                sum(when(col("event_type") == "purchase", 1).otherwise(0)).alias("purchases")
            ).withColumn(
                "cart_rate", col("add_to_cart") / col("page_views")
            ).withColumn(
                "checkout_rate", col("checkout_start") / col("add_to_cart")
            ).withColumn(
                "purchase_rate", col("purchases") / col("checkout_start")
            )

        # Write to Redis for dashboard consumption
        def write_to_redis(batch_df, batch_id, metric_name):
            rows = batch_df.collect()
            redis_client = redis.Redis(host='localhost', port=6379)
            for row in rows:
                key = f"metrics:{metric_name}:{row.window.start}"
                redis_client.setex(key, 3600, json.dumps(row.asDict()))

        # Start all metric streams
        queries = []

        for metric_name, metric_df in [
            ("active_users", active_users),
            ("events_by_type", events_by_type),
            ("revenue", revenue),
            ("funnel", funnel)
        ]:
            query = metric_df.writeStream \
                .foreachBatch(lambda df, id: write_to_redis(df, id, metric_name)) \
                .outputMode("update") \
                .option("checkpointLocation", f"/checkpoints/{metric_name}") \
                .start()
            queries.append(query)

        return queries
```

### IoT Sensor Processing

```python
class IoTSensorPipeline:
    """
    Process IoT sensor data for anomaly detection and monitoring.
    """

    def __init__(self, spark):
        self.spark = spark
        self.anomaly_threshold = 3.0  # Standard deviations

    def build_pipeline(self):
        # Read sensor data
        sensor_data = self.spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("subscribe", "sensor-readings") \
            .load()

        parsed = sensor_data.select(
            from_json(col("value").cast("string"), self.sensor_schema).alias("sensor")
        ).select("sensor.*") \
         .withWatermark("timestamp", "1 minute")

        # Calculate rolling statistics per sensor
        rolling_stats = parsed \
            .groupBy(
                col("sensor_id"),
                window(col("timestamp"), "10 minutes", "1 minute")
            ).agg(
                avg("value").alias("avg_value"),
                stddev("value").alias("stddev_value"),
                min("value").alias("min_value"),
                max("value").alias("max_value"),
                count("*").alias("reading_count")
            )

        # Detect anomalies using z-score
        with_zscore = parsed.alias("current").join(
            rolling_stats.alias("stats"),
            (col("current.sensor_id") == col("stats.sensor_id")) &
            (col("current.timestamp") >= col("stats.window.start")) &
            (col("current.timestamp") < col("stats.window.end")),
            "left"
        ).withColumn(
            "z_score",
            (col("current.value") - col("stats.avg_value")) / col("stats.stddev_value")
        ).withColumn(
            "is_anomaly",
            abs(col("z_score")) > self.anomaly_threshold
        )

        # Send anomaly alerts
        anomalies = with_zscore.filter(col("is_anomaly") == True)

        anomaly_query = anomalies.selectExpr(
            "sensor_id AS key",
            "to_json(struct(sensor_id, value, z_score, timestamp)) AS value"
        ).writeStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("topic", "sensor-anomalies") \
            .option("checkpointLocation", "/checkpoints/anomalies") \
            .outputMode("append") \
            .start()

        # Aggregate for monitoring dashboard
        monitoring = parsed \
            .groupBy(
                col("sensor_id"),
                col("sensor_type"),
                window(col("timestamp"), "1 minute")
            ).agg(
                avg("value").alias("avg_value"),
                max("value").alias("max_value"),
                min("value").alias("min_value"),
                count("*").alias("readings")
            )

        monitoring_query = monitoring.writeStream \
            .format("console") \
            .outputMode("update") \
            .option("checkpointLocation", "/checkpoints/monitoring") \
            .start()

        # Archive raw data to data lake
        archive_query = parsed.writeStream \
            .format("delta") \
            .option("path", "s3://data-lake/sensor-data/") \
            .option("checkpointLocation", "/checkpoints/archive") \
            .partitionBy("sensor_type", "date") \
            .outputMode("append") \
            .start()

        return [anomaly_query, monitoring_query, archive_query]
```

## Best Practices Summary

### Architecture Design

1. **Choose the right paradigm**: Use streaming for low-latency needs, batch for complex analytics
2. **Design for failure**: Implement proper error handling, dead letter queues, and retry mechanisms
3. **Plan for scale**: Partition data appropriately and design for horizontal scaling
4. **Decouple producers and consumers**: Use event-driven architecture for flexibility

### Kafka Configuration

```properties
# Producer configuration for reliability
acks=all
enable.idempotence=true
max.in.flight.requests.per.connection=5
retries=2147483647

# Consumer configuration for exactly-once
enable.auto.commit=false
isolation.level=read_committed
auto.offset.reset=earliest

# Broker configuration for durability
min.insync.replicas=2
unclean.leader.election.enable=false
log.flush.interval.messages=10000
```

### Processing Guidelines

1. **Use watermarks**: Always define watermarks for windowed operations
2. **Handle late data**: Configure appropriate watermark delays
3. **Implement idempotency**: Design consumers to handle duplicate messages
4. **Monitor lag**: Track consumer lag to detect processing issues
5. **Test failure scenarios**: Verify behavior during broker failures, network issues

### Performance Tips

1. **Batch writes**: Use micro-batching for better throughput
2. **Compress data**: Enable compression for network efficiency
3. **Tune partitions**: Match partition count to consumer parallelism
4. **Use broadcast joins**: For small reference data lookups
5. **Cache frequently accessed data**: Reduce repeated computations

## Further Reading

### Official Documentation

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Platform Documentation](https://docs.confluent.io/)
- [Spark Structured Streaming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
- [Apache Flink Documentation](https://flink.apache.org/documentation/)

### Recommended Books

- **"Kafka: The Definitive Guide"** - Neha Narkhede, Gwen Shapira, Todd Palino
- **"Designing Data-Intensive Applications"** - Martin Kleppmann
- **"Streaming Systems"** - Tyler Akidau, Slava Chernyak, Reuven Lax
- **"Building Event-Driven Microservices"** - Adam Bellemare

### Related Technologies

- **Apache Flink**: Alternative stream processing framework with true streaming
- **Apache Pulsar**: Distributed messaging and streaming platform
- **Amazon Kinesis**: Managed streaming service on AWS
- **Google Cloud Dataflow**: Managed stream and batch processing
- **Azure Event Hubs**: Microsoft's event streaming platform
- **Redis Streams**: Lightweight streaming data structure

### Practice Projects

- Build a real-time clickstream analytics system
- Implement a fraud detection pipeline
- Create a real-time recommendation engine
- Design an IoT data processing platform
- Build a distributed log aggregation system

---

Real-time data streaming is a critical capability for modern data architectures. Mastering the concepts covered in this guide - event-driven architecture, the Kafka ecosystem, stream processing patterns, and exactly-once semantics - will enable you to build robust, scalable streaming systems. Remember that the choice between streaming and batch processing depends on your specific requirements, and many production systems benefit from combining both approaches.
