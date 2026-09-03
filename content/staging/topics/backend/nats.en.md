---
title: NATS Messaging System
description: A comprehensive guide to NATS - the cloud-native messaging system for microservices and edge computing
track: backend
section: caching-queues
difficulty: intermediate
tags:
  - NATS
  - Messaging
  - Pub/Sub
  - JetStream
  - Microservices
status: imported
origin: old/src/content/docs/backend/nats.en.md
divergence: 0.22
issues: []
legacy:
  category: Backend
  subcategory: Messaging
  order: 35
  lastUpdated: 2026-01-20
---

NATS is a high-performance, cloud-native messaging system designed for modern distributed systems. Known for its simplicity, speed, and reliability, NATS powers some of the largest microservices architectures and IoT deployments in the world. This guide covers everything you need to build robust messaging solutions with NATS.

## What is NATS?

NATS (Neural Autonomic Transport System) is an open-source messaging system written in Go that provides a simple, secure, and high-performance communications infrastructure for digital systems, services, and devices. Originally developed by Derek Collison at Synadia, NATS is now part of the Cloud Native Computing Foundation (CNCF).

### Core Philosophy

NATS embraces a unique design philosophy centered on simplicity and performance:

**Always On, Always Available**: NATS is designed to be highly available with minimal configuration. A NATS server can be started with a single command and immediately begins accepting connections.

**Fire and Forget**: Core NATS uses an at-most-once delivery model, prioritizing performance and simplicity over guaranteed delivery (JetStream adds at-least-once and exactly-once semantics when needed).

**Location Transparency**: Clients don't need to know where services are located. NATS handles the routing and load balancing automatically.

**Security by Default**: NATS includes built-in support for TLS, authentication, and multi-tenant authorization.

### NATS vs. Kafka vs. RabbitMQ

| Feature | NATS | Kafka | RabbitMQ |
|---------|------|-------|----------|
| Primary Model | Pub/Sub, Request/Reply | Distributed Log | Queue-based |
| Latency | Sub-millisecond | Milliseconds | Milliseconds |
| Message Persistence | Optional (JetStream) | Yes (default) | Optional |
| Ordering Guarantee | Per-subject (JetStream) | Per-partition | Per-queue |
| Protocol | Simple text-based | Binary | AMQP (binary) |
| Clustering | Built-in, automatic | ZooKeeper/KRaft | Erlang clustering |
| Memory Footprint | ~10-50MB | 1GB+ | 100MB+ |
| Complexity | Low | High | Medium |
| Best For | Real-time, microservices | Event sourcing, streaming | Task queues |

**When to Choose NATS**:
- You need extremely low latency (sub-millisecond)
- You're building microservices that need request/reply patterns
- You want simple operations with minimal configuration
- You're deploying at the edge or in IoT scenarios
- You need a lightweight messaging solution

**When to Choose Kafka**:
- You need durable event logs and replay capabilities
- Event sourcing is a core requirement
- You need exactly-once semantics for large data pipelines

**When to Choose RabbitMQ**:
- You need complex routing with exchanges and bindings
- You have existing AMQP integrations
- You need traditional queue semantics with acknowledgments

## Core Concepts and Architecture

### Subjects

Subjects are the fundamental addressing mechanism in NATS. They are case-sensitive strings that define where messages are published and what subscribers listen to.

```
# Simple subjects
orders
users.created
payments.processed

# Hierarchical subjects
store.inventory.product.123
services.auth.login.success
```

**Subject Naming Best Practices**:
- Use lowercase with dots as delimiters
- Be specific and descriptive
- Follow a consistent hierarchical pattern
- Avoid special characters except dots

### Publish/Subscribe Pattern

The publish/subscribe pattern is the foundation of NATS messaging. Publishers send messages to subjects, and all subscribers listening to those subjects receive the messages.

```
Publisher                    NATS Server                   Subscribers
    |                            |                              |
    |--- PUB orders.new -------->|-----> orders.new ----------->| Sub 1
    |    {"id": 1}               |-----> orders.new ----------->| Sub 2
    |                            |-----> orders.new ----------->| Sub 3
```

### Request/Reply Pattern

NATS provides native support for request/reply (RPC-style) communication. A requester publishes a message with a unique reply subject, and responders send their replies to that subject.

```
Requester                    NATS Server                   Responder
    |                            |                              |
    |--- REQ api.users.get ----->|-----> api.users.get -------->|
    |    reply: _INBOX.abc       |                              |
    |                            |<----- _INBOX.abc ------------|
    |<---------------------------|       {"name": "John"}       |
```

### Queue Groups

Queue groups enable load balancing by distributing messages among multiple subscribers. Only one subscriber in a queue group receives each message.

```
Publisher                    NATS Server                   Queue Group "workers"
    |                            |                              |
    |--- PUB tasks.process ----->|-----> Worker 1 (receives) ---|
    |                            |       Worker 2               |
    |                            |       Worker 3               |
    |                            |                              |
    |--- PUB tasks.process ----->|       Worker 1               |
    |                            |-----> Worker 2 (receives) ---|
    |                            |       Worker 3               |
```

### JetStream - Persistent Messaging

JetStream is NATS's built-in persistence layer, providing:
- At-least-once and exactly-once delivery
- Message persistence and replay
- Consumer acknowledgment tracking
- Stream replication across clusters

```
            JetStream Architecture

┌─────────────────────────────────────────────┐
│                   Stream                     │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐     │
│  │ M1  │ M2  │ M3  │ M4  │ M5  │ M6  │     │
│  └─────┴─────┴─────┴─────┴─────┴─────┘     │
│                    │                         │
│         ┌─────────┴─────────┐               │
│         ▼                   ▼               │
│  ┌────────────┐      ┌────────────┐         │
│  │ Consumer A │      │ Consumer B │         │
│  │ (Push)     │      │ (Pull)     │         │
│  └────────────┘      └────────────┘         │
└─────────────────────────────────────────────┘
```

## Key Concepts Deep Dive

### Subject Wildcards

NATS supports two wildcard tokens for flexible subscriptions:

**Single Token Wildcard (`*`)**: Matches exactly one token in a subject.

```
orders.*           matches: orders.new, orders.completed
                   no match: orders, orders.us.new

store.*.inventory  matches: store.west.inventory, store.east.inventory
                   no match: store.inventory, store.west.us.inventory
```

**Multi-Token Wildcard (`>`)**: Matches one or more tokens (must be last token).

```
orders.>           matches: orders.new, orders.us.new, orders.us.west.new
                   no match: orders

store.west.>       matches: store.west.inventory, store.west.sales.daily
```

### Queue Groups for Load Balancing

Queue groups distribute work across multiple instances of a service:

```go
// All three instances share the work
// Only one receives each message
nc.QueueSubscribe("tasks.process", "workers", func(m *nats.Msg) {
    // Process task
})
```

**Key Properties**:
- Messages are distributed randomly among group members
- If a member disconnects, messages go to remaining members
- Multiple queue groups can subscribe to the same subject
- Each queue group receives one copy of each message

### JetStream Streams

Streams are message stores that capture and persist messages for one or more subjects:

```javascript
// Stream configuration
const streamConfig = {
    name: "ORDERS",
    subjects: ["orders.*", "payments.>"],
    storage: "file",        // or "memory"
    retention: "limits",    // "limits", "interest", "workqueue"
    maxMsgs: 1000000,
    maxBytes: 1024 * 1024 * 1024, // 1GB
    maxAge: 24 * 60 * 60 * 1000000000, // 24 hours in nanoseconds
    replicas: 3,
    discard: "old",         // "old" or "new"
};
```

**Retention Policies**:
- `limits`: Keep messages until limits (size, count, age) are reached
- `interest`: Keep messages only while there are active consumers
- `workqueue`: Delete messages once acknowledged (queue semantics)

### JetStream Consumers

Consumers track delivery and acknowledgment state for a stream:

**Push Consumers**: Server pushes messages to a delivery subject
```javascript
const pushConfig = {
    durable_name: "order-processor",
    deliver_subject: "orders.push",
    ack_policy: "explicit",
    ack_wait: 30000000000, // 30 seconds
    max_deliver: 5,
    filter_subject: "orders.new"
};
```

**Pull Consumers**: Client explicitly requests messages
```javascript
const pullConfig = {
    durable_name: "order-processor",
    ack_policy: "explicit",
    max_waiting: 512,
    max_ack_pending: 1000
};
```

**Acknowledgment Policies**:
- `none`: No acknowledgment required (at-most-once)
- `all`: Acknowledge all prior messages
- `explicit`: Acknowledge each message individually (at-least-once)

## Code Examples

### Go Client

**Installation**:
```bash
go get github.com/nats-io/nats.go
```

**Basic Publish/Subscribe**:
```go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    // Connect to NATS
    nc, err := nats.Connect(nats.DefaultURL)
    if err != nil {
        log.Fatal(err)
    }
    defer nc.Close()

    // Simple subscriber
    sub, err := nc.Subscribe("updates", func(m *nats.Msg) {
        fmt.Printf("Received: %s\n", string(m.Data))
    })
    if err != nil {
        log.Fatal(err)
    }
    defer sub.Unsubscribe()

    // Publish a message
    err = nc.Publish("updates", []byte("Hello NATS!"))
    if err != nil {
        log.Fatal(err)
    }

    // Ensure message is sent
    nc.Flush()

    // Wait for message
    time.Sleep(time.Second)
}
```

**Request/Reply**:
```go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    // Service responder
    nc.Subscribe("api.users.get", func(m *nats.Msg) {
        userID := string(m.Data)
        response := fmt.Sprintf(`{"id": "%s", "name": "John Doe"}`, userID)
        m.Respond([]byte(response))
    })

    // Client request with 2-second timeout
    msg, err := nc.Request("api.users.get", []byte("123"), 2*time.Second)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Response: %s\n", string(msg.Data))
}
```

**Queue Groups**:
```go
package main

import (
    "fmt"
    "sync"
    "time"

    "github.com/nats-io/nats.go"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    var wg sync.WaitGroup

    // Create 3 workers in the same queue group
    for i := 1; i <= 3; i++ {
        workerID := i
        nc.QueueSubscribe("tasks", "workers", func(m *nats.Msg) {
            fmt.Printf("Worker %d processing: %s\n", workerID, string(m.Data))
            wg.Done()
        })
    }

    // Publish 10 tasks
    wg.Add(10)
    for i := 1; i <= 10; i++ {
        nc.Publish("tasks", []byte(fmt.Sprintf("Task %d", i)))
    }

    nc.Flush()
    wg.Wait()
}
```

**JetStream**:
```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/nats-io/nats.go"
    "github.com/nats-io/nats.go/jetstream"
)

func main() {
    nc, _ := nats.Connect(nats.DefaultURL)
    defer nc.Close()

    // Create JetStream context
    js, err := jetstream.New(nc)
    if err != nil {
        log.Fatal(err)
    }

    ctx := context.Background()

    // Create or get a stream
    stream, err := js.CreateOrUpdateStream(ctx, jetstream.StreamConfig{
        Name:     "ORDERS",
        Subjects: []string{"orders.>"},
        Storage:  jetstream.FileStorage,
        MaxMsgs:  10000,
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Stream: %s created\n", stream.CachedInfo().Config.Name)

    // Publish messages
    for i := 1; i <= 5; i++ {
        ack, err := js.Publish(ctx, "orders.new",
            []byte(fmt.Sprintf(`{"order_id": %d}`, i)))
        if err != nil {
            log.Fatal(err)
        }
        fmt.Printf("Published seq: %d\n", ack.Sequence)
    }

    // Create a consumer
    consumer, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
        Durable:   "order-processor",
        AckPolicy: jetstream.AckExplicitPolicy,
    })
    if err != nil {
        log.Fatal(err)
    }

    // Consume messages
    msgs, err := consumer.Fetch(10)
    if err != nil {
        log.Fatal(err)
    }

    for msg := range msgs.Messages() {
        fmt.Printf("Received: %s\n", string(msg.Data()))
        msg.Ack()
    }
}
```

### Node.js Client

**Installation**:
```bash
npm install nats
```

**Basic Publish/Subscribe**:
```javascript
import { connect, StringCodec } from "nats";

async function main() {
    // Connect to NATS
    const nc = await connect({ servers: "localhost:4222" });
    const sc = StringCodec();

    // Subscribe to a subject
    const sub = nc.subscribe("updates");
    (async () => {
        for await (const msg of sub) {
            console.log(`Received: ${sc.decode(msg.data)}`);
        }
    })();

    // Publish messages
    nc.publish("updates", sc.encode("Hello from Node.js!"));
    nc.publish("updates", sc.encode("Another message"));

    // Wait a bit then close
    await nc.flush();
    await new Promise(resolve => setTimeout(resolve, 1000));
    await nc.close();
}

main();
```

**Request/Reply**:
```javascript
import { connect, StringCodec } from "nats";

async function main() {
    const nc = await connect({ servers: "localhost:4222" });
    const sc = StringCodec();

    // Service handler
    const sub = nc.subscribe("api.echo");
    (async () => {
        for await (const msg of sub) {
            const request = sc.decode(msg.data);
            console.log(`Received request: ${request}`);
            msg.respond(sc.encode(`Echo: ${request}`));
        }
    })();

    // Make a request
    const response = await nc.request(
        "api.echo",
        sc.encode("Hello!"),
        { timeout: 2000 }
    );
    console.log(`Response: ${sc.decode(response.data)}`);

    await nc.close();
}

main();
```

**JetStream**:
```javascript
import { connect, StringCodec, AckPolicy, DeliverPolicy } from "nats";

async function main() {
    const nc = await connect({ servers: "localhost:4222" });
    const js = nc.jetstream();
    const jsm = await nc.jetstreamManager();
    const sc = StringCodec();

    // Create a stream
    await jsm.streams.add({
        name: "EVENTS",
        subjects: ["events.>"],
        storage: "file",
        max_msgs: 10000,
    });

    // Publish to JetStream
    const pa = await js.publish("events.user.created",
        sc.encode(JSON.stringify({ userId: "123", name: "Alice" })));
    console.log(`Published seq: ${pa.seq}`);

    // Create a durable consumer
    await jsm.consumers.add("EVENTS", {
        durable_name: "event-processor",
        ack_policy: AckPolicy.Explicit,
        deliver_policy: DeliverPolicy.All,
    });

    // Consume messages
    const consumer = await js.consumers.get("EVENTS", "event-processor");
    const messages = await consumer.fetch({ max_messages: 10 });

    for await (const msg of messages) {
        console.log(`Received: ${sc.decode(msg.data)}`);
        msg.ack();
    }

    await nc.close();
}

main();
```

### Python Client

**Installation**:
```bash
pip install nats-py
```

**Basic Publish/Subscribe**:
```python
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")

    # Message handler
    async def message_handler(msg):
        subject = msg.subject
        data = msg.data.decode()
        print(f"Received [{subject}]: {data}")

    # Subscribe
    await nc.subscribe("updates", cb=message_handler)

    # Publish
    await nc.publish("updates", b"Hello from Python!")
    await nc.publish("updates", b"Another message")

    # Wait for messages
    await asyncio.sleep(1)
    await nc.close()

asyncio.run(main())
```

**Request/Reply**:
```python
import asyncio
from nats.aio.client import Client as NATS

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")

    # Service handler
    async def echo_handler(msg):
        response = f"Echo: {msg.data.decode()}"
        await msg.respond(response.encode())

    await nc.subscribe("api.echo", cb=echo_handler)

    # Make request
    response = await nc.request("api.echo", b"Hello!", timeout=2)
    print(f"Response: {response.data.decode()}")

    await nc.close()

asyncio.run(main())
```

**JetStream**:
```python
import asyncio
from nats.aio.client import Client as NATS
from nats.js.api import StreamConfig, ConsumerConfig, AckPolicy

async def main():
    nc = NATS()
    await nc.connect("nats://localhost:4222")
    js = nc.jetstream()

    # Create stream
    await js.add_stream(
        config=StreamConfig(
            name="ORDERS",
            subjects=["orders.>"],
            max_msgs=10000,
        )
    )

    # Publish with acknowledgment
    ack = await js.publish("orders.new", b'{"order_id": 1}')
    print(f"Published seq: {ack.seq}")

    # Create consumer
    consumer = await js.pull_subscribe(
        "orders.>",
        durable="order-processor",
        config=ConsumerConfig(ack_policy=AckPolicy.EXPLICIT),
    )

    # Fetch and process messages
    messages = await consumer.fetch(batch=10, timeout=5)
    for msg in messages:
        print(f"Received: {msg.data.decode()}")
        await msg.ack()

    await nc.close()

asyncio.run(main())
```

## Best Practices

### Cluster Deployment

**Three-Node Cluster Configuration**:

```yaml
# node1.conf
server_name: node1
listen: 0.0.0.0:4222
http: 8222

cluster {
    name: production
    listen: 0.0.0.0:6222
    routes: [
        nats://node2.example.com:6222
        nats://node3.example.com:6222
    ]
}

jetstream {
    store_dir: /data/jetstream
    max_mem: 4GB
    max_file: 100GB
}
```

**Kubernetes Deployment with Helm**:
```bash
# Add NATS Helm repository
helm repo add nats https://nats-io.github.io/k8s/helm/charts/
helm repo update

# Install NATS cluster
helm install nats nats/nats \
    --set cluster.enabled=true \
    --set cluster.replicas=3 \
    --set jetstream.enabled=true \
    --set jetstream.fileStore.pvc.size=10Gi
```

### Security Configuration

**TLS Configuration**:
```yaml
# server.conf
tls {
    cert_file: "/etc/nats/certs/server.crt"
    key_file: "/etc/nats/certs/server.key"
    ca_file: "/etc/nats/certs/ca.crt"
    verify: true
}
```

**Authentication with NKeys**:
```yaml
# Generate NKey pair
# nk -gen user -pubout

authorization {
    users: [
        {
            nkey: UAKYB4XGQKBQR7XGNAVWVTRHPG3WVJKJQB6C5XVJQWZ7PJXDTWVDVWYQ
            permissions: {
                publish: ["orders.>", "events.>"]
                subscribe: ["notifications.>"]
            }
        }
    ]
}
```

**Multi-Tenant with Accounts**:
```yaml
accounts {
    TENANT_A: {
        jetstream: enabled
        users: [
            { user: admin_a, password: $2a$11$... }
        ]
        exports: [
            { service: "api.>" }
        ]
    }

    TENANT_B: {
        jetstream: enabled
        users: [
            { user: admin_b, password: $2a$11$... }
        ]
        imports: [
            { service: { account: TENANT_A, subject: "api.>" } }
        ]
    }
}
```

### Monitoring

**Prometheus Metrics**:
```yaml
# Enable monitoring endpoint
http: 8222

# Access metrics at http://localhost:8222/varz
# JetStream metrics at http://localhost:8222/jsz
```

**Key Metrics to Monitor**:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nats'
    static_configs:
      - targets: ['nats-1:8222', 'nats-2:8222', 'nats-3:8222']
    metrics_path: /metrics
```

**Essential Metrics**:
- `nats_server_connections`: Active client connections
- `nats_server_subscriptions`: Total subscriptions
- `nats_server_messages_received`: Messages received per second
- `nats_server_messages_sent`: Messages sent per second
- `nats_server_bytes_received/sent`: Throughput in bytes
- `jetstream_server_streams`: Number of streams
- `jetstream_server_consumers`: Number of consumers

## Common Pitfalls

### Message Loss Scenarios

**Problem**: Messages lost when subscriber is slow or disconnected.

```go
// BAD: No buffer, slow consumer drops messages
sub, _ := nc.Subscribe("events", func(m *nats.Msg) {
    time.Sleep(time.Second) // Slow processing
})

// GOOD: Use JetStream for persistence
js, _ := jetstream.New(nc)
consumer, _ := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
    Durable:   "reliable-processor",
    AckPolicy: jetstream.AckExplicitPolicy,
    MaxDeliver: 5, // Retry up to 5 times
})
```

**Prevention Strategies**:
1. Use JetStream for critical messages
2. Implement proper acknowledgment handling
3. Monitor consumer lag
4. Set appropriate pending message limits

### Backpressure Handling

**Problem**: Publisher overwhelms slow consumers.

```go
// BAD: Unbounded publishing
for i := 0; i < 1000000; i++ {
    nc.Publish("data", largePayload)
}

// GOOD: Respect backpressure with JetStream
for i := 0; i < 1000000; i++ {
    _, err := js.Publish(ctx, "data", largePayload)
    if err != nil {
        // Handle backpressure
        if errors.Is(err, jetstream.ErrNoStreamResponse) {
            time.Sleep(100 * time.Millisecond)
            continue
        }
        log.Printf("Publish error: %v", err)
    }
}
```

### Connection Management

**Problem**: Not handling reconnection properly.

```go
// BAD: No error handling
nc, _ := nats.Connect(nats.DefaultURL)

// GOOD: Proper connection handling
nc, err := nats.Connect(
    "nats://host1:4222,nats://host2:4222,nats://host3:4222",
    nats.MaxReconnects(-1), // Unlimited reconnects
    nats.ReconnectWait(2*time.Second),
    nats.ReconnectBufSize(8*1024*1024), // 8MB buffer during reconnect
    nats.DisconnectErrHandler(func(nc *nats.Conn, err error) {
        log.Printf("Disconnected: %v", err)
    }),
    nats.ReconnectHandler(func(nc *nats.Conn) {
        log.Printf("Reconnected to %s", nc.ConnectedUrl())
    }),
    nats.ErrorHandler(func(nc *nats.Conn, sub *nats.Subscription, err error) {
        log.Printf("Error: %v", err)
    }),
)
```

### Consumer Acknowledgment Issues

**Problem**: Messages redelivered due to improper ack handling.

```go
// BAD: Processing might fail after ack
for msg := range msgs.Messages() {
    msg.Ack() // Ack before processing
    process(msg) // If this fails, message is lost
}

// GOOD: Ack after successful processing
for msg := range msgs.Messages() {
    if err := process(msg); err != nil {
        msg.Nak() // Negative ack for redelivery
        continue
    }
    msg.Ack() // Ack only on success
}
```

## Performance Considerations

### High Throughput Configuration

**Server Configuration**:
```yaml
# High-performance server settings
max_payload: 8MB
max_pending: 64MB
write_deadline: 10s

jetstream {
    max_mem: 8GB
    max_file: 1TB
    sync_interval: 60s  # Less frequent sync for higher throughput
}
```

**Client Optimization (Go)**:
```go
nc, _ := nats.Connect(
    nats.DefaultURL,
    nats.MaxReconnects(-1),
    nats.ReconnectBufSize(64*1024*1024), // 64MB reconnect buffer
    nats.PingInterval(20*time.Second),
    nats.MaxPingsOutstanding(5),
)

// Use async publishing for throughput
for i := 0; i < 1000000; i++ {
    nc.Publish("data", payload) // Fire and forget
}
nc.Flush() // Ensure all sent
```

### Latency Optimization

**Minimize Network Hops**:
```go
// Use leaf nodes for edge deployments
// Leaf node connects to cluster, provides local pub/sub
```

**Optimize Message Size**:
```go
// Use efficient serialization
import "github.com/vmihailenco/msgpack/v5"

data, _ := msgpack.Marshal(event)
nc.Publish("events", data)
```

**Connection Pooling**:
```go
// Reuse connections, don't create per-request
var nc *nats.Conn

func init() {
    nc, _ = nats.Connect(nats.DefaultURL)
}

func HandleRequest(w http.ResponseWriter, r *http.Request) {
    nc.Publish("requests", []byte(r.URL.Path))
}
```

### Benchmarking

```bash
# NATS bench tool
nats bench test --pub 4 --sub 4 --msgs 10000000 --size 256

# Expected results on modern hardware:
# - Core NATS: 10-20 million msgs/sec
# - JetStream (ack): 100K-500K msgs/sec
```

## Real-World Use Cases

### Microservices Communication

```go
// Service discovery and request routing
package main

import (
    "encoding/json"
    "log"
    "github.com/nats-io/nats.go"
)

type OrderService struct {
    nc *nats.Conn
}

func (s *OrderService) Start() {
    // Handle order creation
    s.nc.QueueSubscribe("orders.create", "order-service", func(m *nats.Msg) {
        var order Order
        json.Unmarshal(m.Data, &order)

        // Process order
        order.ID = generateID()
        order.Status = "created"

        // Respond to requester
        response, _ := json.Marshal(order)
        m.Respond(response)

        // Publish event for other services
        s.nc.Publish("events.order.created", response)
    })
}

// Client service making requests
func CreateOrder(nc *nats.Conn, items []Item) (*Order, error) {
    request, _ := json.Marshal(map[string]interface{}{
        "items": items,
    })

    msg, err := nc.Request("orders.create", request, 5*time.Second)
    if err != nil {
        return nil, err
    }

    var order Order
    json.Unmarshal(msg.Data, &order)
    return &order, nil
}
```

### IoT Data Collection

```python
import asyncio
import json
from nats.aio.client import Client as NATS

async def iot_gateway():
    nc = NATS()
    await nc.connect("nats://edge-server:4222")
    js = nc.jetstream()

    # Create stream for sensor data
    await js.add_stream(
        name="SENSORS",
        subjects=["sensors.>"],
        max_age=86400 * 1000000000,  # 24 hours
    )

    async def collect_sensor_data():
        while True:
            reading = {
                "device_id": "sensor-001",
                "temperature": read_temperature(),
                "humidity": read_humidity(),
                "timestamp": time.time()
            }

            await js.publish(
                f"sensors.{reading['device_id']}",
                json.dumps(reading).encode()
            )

            await asyncio.sleep(1)

    await collect_sensor_data()
```

### Edge Computing

```yaml
# Leaf node configuration for edge deployment
server_name: edge-node-1

leafnodes {
    remotes: [
        {
            url: "nats://cloud-cluster.example.com:7422"
            credentials: "/etc/nats/edge.creds"
        }
    ]
}

jetstream {
    store_dir: /data/jetstream
    max_mem: 1GB
    max_file: 50GB
}
```

```go
// Edge application with local caching
func EdgeProcessor(nc *nats.Conn) {
    js, _ := jetstream.New(nc)

    // Local stream for offline operation
    js.CreateOrUpdateStream(context.Background(), jetstream.StreamConfig{
        Name:     "LOCAL_EVENTS",
        Subjects: []string{"local.>"},
        Storage:  jetstream.FileStorage,
    })

    // Process locally, sync to cloud when connected
    nc.Subscribe("sensors.>", func(m *nats.Msg) {
        // Store locally
        js.Publish(context.Background(), "local."+m.Subject, m.Data)

        // Forward to cloud if connected
        if nc.IsConnected() {
            nc.Publish("cloud."+m.Subject, m.Data)
        }
    })
}
```

## Interview Topics

### Conceptual Questions

**Q: How does NATS achieve such low latency compared to other messaging systems?**

A: NATS achieves sub-millisecond latency through several design choices:
1. Simple text-based protocol with minimal parsing overhead
2. At-most-once delivery by default (no persistence overhead)
3. Direct TCP connections without intermediary persistence
4. Efficient goroutine-based connection handling in Go
5. Zero-copy message forwarding when possible

**Q: Explain the difference between at-most-once, at-least-once, and exactly-once delivery.**

A:
- **At-most-once** (Core NATS): Messages delivered 0 or 1 time. Fast but may lose messages.
- **At-least-once** (JetStream default): Messages delivered 1+ times. Requires acknowledgments and redelivery logic.
- **Exactly-once** (JetStream with deduplication): Messages delivered exactly 1 time. Requires message deduplication and idempotent consumers.

**Q: When would you choose NATS over Kafka?**

A: Choose NATS when:
- You need sub-millisecond latency
- Request/reply patterns are common
- Operational simplicity is important
- You're doing edge computing or IoT
- Memory footprint matters

Choose Kafka when:
- You need infinite message retention
- Event sourcing is a core pattern
- You need strong ordering across partitions
- You're building data pipelines with replay requirements

### Technical Questions

**Q: How do queue groups differ from Kafka consumer groups?**

A: Key differences:
- NATS queue groups distribute messages randomly; Kafka partitions messages by key
- NATS doesn't require pre-partitioning; Kafka requires partition configuration
- NATS queue groups work with any subject; Kafka groups are tied to topic partitions
- NATS has no offset tracking for core subscriptions; Kafka maintains consumer offsets

**Q: Explain JetStream stream retention policies.**

A: Three retention policies:
- **Limits**: Keep messages until limits (max_msgs, max_bytes, max_age) are reached
- **Interest**: Keep messages only while active consumers exist
- **WorkQueue**: Delete messages immediately after acknowledgment (queue semantics)

**Q: How would you implement exactly-once processing with NATS?**

A: Combine these strategies:
1. Enable message deduplication on the stream with `Duplicates` window
2. Use explicit acknowledgments
3. Implement idempotent message handlers using message IDs
4. Use transactions or sagas for multi-step operations

## Further Reading

### Official Resources

- [NATS Documentation](https://docs.nats.io/) - Comprehensive official documentation
- [NATS GitHub Repository](https://github.com/nats-io/nats-server) - Server source code and issues
- [NATS By Example](https://natsbyexample.com/) - Interactive examples in multiple languages
- [NATS Clients](https://github.com/nats-io) - Official client libraries for Go, Python, JavaScript, and more

### Community Resources

- [NATS Slack Community](https://slack.nats.io/) - Active community for questions and discussions
- [Synadia Blog](https://www.synadia.com/blog) - Technical articles from NATS maintainers
- [CNCF NATS Project](https://www.cncf.io/projects/nats/) - Cloud Native Computing Foundation project page

### Books and Tutorials

- "Practical NATS" by Waldemar Quevedo - Deep dive into NATS internals
- [Kubernetes Native Microservices with NATS](https://nats.io/blog/) - Integration guides

NATS provides a powerful, simple, and performant foundation for modern distributed systems. By understanding its core concepts and following best practices, you can build resilient messaging architectures that scale from edge devices to global cloud deployments.
