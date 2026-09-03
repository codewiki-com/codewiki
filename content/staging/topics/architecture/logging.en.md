---
title: Logging System Design and Best Practices
description: Master logging systems for observable backend services
track: architecture
section: observability
difficulty: intermediate
tags:
  - Logging
  - Log System
  - Observability
  - Debugging
status: imported
origin: old/src/content/docs/backend/logging.en.md
divergence: 0.27
issues: []
legacy:
  category: Backend
  subcategory: Observability
  order: 28
  lastUpdated: 2026-01-07
---

## Concept Overview

Logging is one of the three pillars of observability, alongside metrics and tracing. A well-designed logging system provides invaluable insights into application behavior, aids in debugging, and serves as a critical tool for understanding system health in production environments.

### Why Logging Matters

Effective logging serves multiple purposes in modern software development:

- **Debugging and Troubleshooting**: Logs help developers understand what happened when something goes wrong
- **Auditing and Compliance**: Many industries require detailed audit trails for regulatory compliance
- **Performance Analysis**: Log data can reveal performance bottlenecks and optimization opportunities
- **Security Monitoring**: Logs are essential for detecting and investigating security incidents
- **Business Intelligence**: Application logs can provide insights into user behavior and business metrics

### The Cost of Poor Logging

Inadequate logging practices lead to significant problems:

```
1. Extended mean time to resolution (MTTR) during incidents
2. Difficulty reproducing and diagnosing bugs
3. Compliance violations and audit failures
4. Missed security threats and breach detection
5. Increased operational costs from inefficient troubleshooting
```

## Log Levels

Understanding and properly using log levels is fundamental to effective logging. Log levels provide a way to categorize messages by their severity and importance.

### Standard Log Levels

Most logging frameworks implement a hierarchy of log levels:

```
┌─────────────────────────────────────────────────────────────┐
│                    Log Level Hierarchy                       │
├─────────────────────────────────────────────────────────────┤
│  TRACE  │  Most verbose - detailed diagnostic information   │
│  DEBUG  │  Diagnostic information for debugging             │
│  INFO   │  General operational information                  │
│  WARN   │  Warning conditions that may require attention    │
│  ERROR  │  Error conditions - something failed              │
│  FATAL  │  Critical failure - application may terminate     │
└─────────────────────────────────────────────────────────────┘
```

### When to Use Each Level

**TRACE Level**

Use TRACE for extremely detailed diagnostic information. This level is typically disabled in production due to the volume of output.

```javascript
// Node.js example with Winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'trace',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

function processRequest(request) {
  logger.trace('Entering processRequest', {
    requestId: request.id,
    headers: request.headers,
    body: request.body
  });

  // Process each step with trace logging
  logger.trace('Validating request schema');
  const validated = validateSchema(request);

  logger.trace('Schema validation complete', { valid: validated });
}
```

**DEBUG Level**

DEBUG is appropriate for information useful during development and debugging:

```python
# Python example with structlog
import structlog

logger = structlog.get_logger()

def calculate_order_total(order):
    logger.debug("calculating_order_total",
                 order_id=order.id,
                 item_count=len(order.items))

    subtotal = sum(item.price * item.quantity for item in order.items)
    logger.debug("subtotal_calculated",
                 order_id=order.id,
                 subtotal=subtotal)

    tax = calculate_tax(subtotal, order.shipping_address)
    logger.debug("tax_calculated",
                 order_id=order.id,
                 tax=tax)

    total = subtotal + tax + order.shipping_cost
    logger.debug("total_calculated",
                 order_id=order.id,
                 total=total)

    return total
```

**INFO Level**

INFO logs capture significant application events and state changes:

```java
// Java example with SLF4J
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public User createUser(UserCreateRequest request) {
        logger.info("Creating new user",
            kv("email", request.getEmail()),
            kv("role", request.getRole()));

        User user = userRepository.save(new User(request));

        logger.info("User created successfully",
            kv("userId", user.getId()),
            kv("email", user.getEmail()));

        return user;
    }

    public void updateUserRole(String userId, Role newRole) {
        User user = userRepository.findById(userId);
        Role oldRole = user.getRole();

        user.setRole(newRole);
        userRepository.save(user);

        logger.info("User role updated",
            kv("userId", userId),
            kv("oldRole", oldRole),
            kv("newRole", newRole));
    }
}
```

**WARN Level**

WARN indicates potential problems that are not immediately harmful:

```go
// Go example with zerolog
package main

import (
    "github.com/rs/zerolog/log"
    "time"
)

func fetchDataWithRetry(url string, maxRetries int) ([]byte, error) {
    var lastErr error

    for attempt := 1; attempt <= maxRetries; attempt++ {
        data, err := fetchData(url)
        if err == nil {
            return data, nil
        }

        lastErr = err

        if attempt < maxRetries {
            log.Warn().
                Str("url", url).
                Int("attempt", attempt).
                Int("maxRetries", maxRetries).
                Err(err).
                Msg("Request failed, retrying")

            time.Sleep(time.Duration(attempt) * time.Second)
        }
    }

    return nil, lastErr
}

func checkDiskSpace() {
    usage := getDiskUsagePercent()

    if usage > 80 {
        log.Warn().
            Float64("usagePercent", usage).
            Str("threshold", "80%").
            Msg("Disk usage approaching critical threshold")
    }
}
```

**ERROR Level**

ERROR captures failures that affect current operations:

```typescript
// TypeScript example with Pino
import pino from 'pino';

const logger = pino({
  level: 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

async function processPayment(orderId: string, paymentDetails: PaymentDetails): Promise<PaymentResult> {
  try {
    const result = await paymentGateway.charge(paymentDetails);

    logger.info({ orderId, transactionId: result.transactionId }, 'Payment processed successfully');

    return result;
  } catch (error) {
    logger.error({
      orderId,
      errorCode: error.code,
      errorMessage: error.message,
      paymentMethod: paymentDetails.method,
      // Never log full card numbers or sensitive data
      lastFourDigits: paymentDetails.cardNumber.slice(-4)
    }, 'Payment processing failed');

    throw new PaymentFailedError(orderId, error);
  }
}

async function sendEmail(to: string, template: string, data: object): Promise<void> {
  try {
    await emailService.send(to, template, data);
  } catch (error) {
    logger.error({
      recipient: to,
      template,
      errorType: error.constructor.name,
      errorMessage: error.message
    }, 'Failed to send email');

    // Don't rethrow - email failure shouldn't break the main flow
    await notifyOpsTeam('email_failure', { to, template, error: error.message });
  }
}
```

**FATAL Level**

FATAL indicates catastrophic failures requiring immediate attention:

```javascript
// Node.js fatal error handling
const logger = require('./logger');

process.on('uncaughtException', (error) => {
  logger.fatal({
    errorType: 'uncaughtException',
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    pid: process.pid
  }, 'Uncaught exception - application will terminate');

  // Flush logs and exit
  logger.flush(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({
    errorType: 'unhandledRejection',
    reason: reason instanceof Error ? {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    } : reason
  }, 'Unhandled promise rejection - application will terminate');

  logger.flush(() => {
    process.exit(1);
  });
});
```

### Configuring Log Levels by Environment

```yaml
# log-config.yaml
development:
  level: debug
  console: true
  file: false

staging:
  level: debug
  console: true
  file: true
  filePath: /var/log/app/staging.log

production:
  level: info
  console: false
  file: true
  filePath: /var/log/app/production.log

# Override specific loggers
loggers:
  database:
    level: warn  # Reduce noise from database driver
  http:
    level: info
  security:
    level: debug  # Always verbose for security events
```

## Structured Logging

Structured logging transforms log messages from human-readable text into machine-parseable data structures, typically JSON. This approach dramatically improves log searchability and analysis.

### Why Structured Logging

Traditional logging produces messages like:

```
2024-01-15 10:23:45 INFO User john@example.com logged in from 192.168.1.100
```

Structured logging produces:

```json
{
  "timestamp": "2024-01-15T10:23:45.123Z",
  "level": "info",
  "message": "User logged in",
  "userId": "user_123",
  "email": "john@example.com",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_abc123",
  "service": "auth-service",
  "version": "1.2.3"
}
```

### Implementing Structured Logging

**Node.js with Pino**

```javascript
const pino = require('pino');

// Configure the logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
      service: process.env.SERVICE_NAME,
      version: process.env.APP_VERSION
    })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['password', 'creditCard', 'ssn', 'apiKey'],
    censor: '[REDACTED]'
  }
});

// Create child loggers with context
function createRequestLogger(req) {
  return logger.child({
    requestId: req.id,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
}

// Usage in Express middleware
app.use((req, res, next) => {
  req.log = createRequestLogger(req);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    req.log.info({
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    }, 'Request completed');
  });

  next();
});
```

**Python with structlog**

```python
import structlog
import logging
from datetime import datetime

# Configure structlog
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True
)

logger = structlog.get_logger()

# Bind context that persists across log calls
def process_order(order_id: str, user_id: str):
    log = logger.bind(order_id=order_id, user_id=user_id)

    log.info("order_processing_started")

    try:
        items = fetch_order_items(order_id)
        log.debug("items_fetched", item_count=len(items))

        total = calculate_total(items)
        log.debug("total_calculated", total=total)

        payment_result = process_payment(order_id, total)
        log.info("payment_processed",
                 transaction_id=payment_result.transaction_id)

        log.info("order_completed", total=total)

    except PaymentError as e:
        log.error("payment_failed",
                  error_code=e.code,
                  error_message=str(e))
        raise
```

**Go with zerolog**

```go
package main

import (
    "os"
    "time"

    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func init() {
    // Configure global logger
    zerolog.TimeFieldFormat = time.RFC3339Nano

    // Add service context
    log.Logger = zerolog.New(os.Stdout).
        With().
        Timestamp().
        Str("service", "order-service").
        Str("version", os.Getenv("APP_VERSION")).
        Logger()
}

func ProcessOrder(orderID string, userID string) error {
    // Create a sub-logger with request context
    logger := log.With().
        Str("orderId", orderID).
        Str("userId", userID).
        Logger()

    logger.Info().Msg("Processing order")

    startTime := time.Now()

    items, err := fetchOrderItems(orderID)
    if err != nil {
        logger.Error().
            Err(err).
            Msg("Failed to fetch order items")
        return err
    }

    logger.Debug().
        Int("itemCount", len(items)).
        Msg("Order items fetched")

    total := calculateTotal(items)

    logger.Info().
        Float64("total", total).
        Dur("processingTime", time.Since(startTime)).
        Msg("Order processing completed")

    return nil
}
```

### Contextual Logging

Adding context to logs makes them more useful for debugging and analysis:

```javascript
// Express.js middleware for request context
const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');

const asyncLocalStorage = new AsyncLocalStorage();

// Middleware to set up context
app.use((req, res, next) => {
  const context = {
    requestId: req.headers['x-request-id'] || uuidv4(),
    traceId: req.headers['x-trace-id'] || uuidv4(),
    userId: null, // Set after authentication
    sessionId: req.session?.id
  };

  asyncLocalStorage.run(context, () => {
    next();
  });
});

// Logger that automatically includes context
function getLogger() {
  const context = asyncLocalStorage.getStore() || {};
  return logger.child(context);
}

// Usage anywhere in the request lifecycle
async function updateUserProfile(userId, data) {
  const log = getLogger();

  log.info({ userId, fields: Object.keys(data) }, 'Updating user profile');

  const result = await userRepository.update(userId, data);

  log.info({ userId, updated: true }, 'User profile updated');

  return result;
}
```

## Log Aggregation

In distributed systems, logs are generated across multiple services and instances. Log aggregation consolidates these logs into a centralized location for unified access and analysis.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Log Aggregation Architecture                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Service A  │  │  Service B  │  │  Service C  │  │  Service D  │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Log Shippers                                   │
│            (Fluentd, Filebeat, Vector, Fluent Bit)                      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Message Queue (Optional Buffer)                       │
│                      (Kafka, Redis, RabbitMQ)                           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Log Processing Pipeline                             │
│              (Logstash, Fluentd, Vector Transforms)                     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Log Storage                                      │
│        (Elasticsearch, Loki, ClickHouse, Cloud Solutions)               │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Visualization & Alerting                            │
│                  (Kibana, Grafana, Custom Dashboards)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluentd Configuration

```yaml
# fluent.conf
<source>
  @type forward
  port 24224
  bind 0.0.0.0
</source>

# Parse JSON logs
<filter **>
  @type parser
  key_name log
  reserve_data true
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%LZ
  </parse>
</filter>

# Add metadata
<filter **>
  @type record_transformer
  <record>
    hostname "#{Socket.gethostname}"
    environment "#{ENV['ENVIRONMENT']}"
  </record>
</filter>

# Route logs based on tag
<match app.**>
  @type elasticsearch
  host elasticsearch.logging.svc.cluster.local
  port 9200
  logstash_format true
  logstash_prefix app-logs
  <buffer>
    @type file
    path /var/log/fluentd-buffers/app
    flush_mode interval
    flush_interval 5s
    retry_max_interval 30
    retry_forever true
  </buffer>
</match>

<match error.**>
  @type copy

  # Store in Elasticsearch
  <store>
    @type elasticsearch
    host elasticsearch.logging.svc.cluster.local
    port 9200
    logstash_format true
    logstash_prefix error-logs
  </store>

  # Also send to alerting system
  <store>
    @type http
    endpoint https://alerts.example.com/webhook
    <format>
      @type json
    </format>
  </store>
</match>
```

### Vector Configuration

Vector is a high-performance alternative to Fluentd:

```toml
# vector.toml
[sources.app_logs]
type = "file"
include = ["/var/log/app/*.log"]
read_from = "beginning"

[sources.docker_logs]
type = "docker_logs"
docker_host = "unix:///var/run/docker.sock"

[transforms.parse_json]
type = "remap"
inputs = ["app_logs", "docker_logs"]
source = '''
. = parse_json!(.message)
.timestamp = parse_timestamp!(.timestamp, format: "%Y-%m-%dT%H:%M:%S%.fZ")
.host = get_hostname!()
.environment = get_env_var!("ENVIRONMENT")
'''

[transforms.filter_errors]
type = "filter"
inputs = ["parse_json"]
condition = '.level == "error" || .level == "fatal"'

[transforms.sample_debug]
type = "sample"
inputs = ["parse_json"]
rate = 10  # Keep 1 in 10 debug logs
condition = '.level == "debug"'

[sinks.elasticsearch]
type = "elasticsearch"
inputs = ["parse_json"]
endpoints = ["http://elasticsearch:9200"]
index = "logs-%Y-%m-%d"
compression = "gzip"

[sinks.error_alerts]
type = "http"
inputs = ["filter_errors"]
uri = "https://alerts.example.com/webhook"
encoding.codec = "json"
```

### Kubernetes Log Collection

```yaml
# fluent-bit-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Tag               kube.*
        Path              /var/log/containers/*.log
        Parser            docker
        DB                /var/log/flb_kube.db
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On
        Refresh_Interval  10

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude On

    [OUTPUT]
        Name            es
        Match           *
        Host            elasticsearch.logging.svc.cluster.local
        Port            9200
        Index           kubernetes-logs
        Type            _doc
        Logstash_Format On
        Retry_Limit     False

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
```

## Log Analysis

Effective log analysis transforms raw log data into actionable insights.

### Querying Logs in Elasticsearch

```json
// Find all errors in the last hour
GET /app-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        {
          "range": {
            "@timestamp": {
              "gte": "now-1h",
              "lte": "now"
            }
          }
        }
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }],
  "size": 100
}

// Aggregate errors by service and error type
GET /app-logs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        { "term": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ]
    }
  },
  "aggs": {
    "by_service": {
      "terms": { "field": "service.keyword" },
      "aggs": {
        "by_error_type": {
          "terms": { "field": "errorType.keyword" }
        }
      }
    }
  }
}

// Find slow requests
GET /app-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "type": "request" } },
        { "range": { "duration": { "gte": 1000 } } }
      ]
    }
  },
  "sort": [{ "duration": "desc" }]
}
```

### Log Analysis with Grafana Loki

Loki uses LogQL for querying:

```logql
# Find all error logs from auth-service
{service="auth-service"} |= "error"

# Parse JSON and filter
{namespace="production"} | json | level="error" | line_format "{{.message}}"

# Aggregate error rate
sum(rate({service=~".*"} |= "error" [5m])) by (service)

# Find logs containing specific user ID
{service="user-service"} |~ "userId.*user_12345"

# Calculate request latency percentiles
quantile_over_time(0.99,
  {service="api-gateway"}
  | json
  | unwrap duration [5m]
) by (endpoint)
```

### Building Effective Dashboards

Key metrics to visualize:

```yaml
# Dashboard configuration example
panels:
  - title: "Error Rate by Service"
    type: timeseries
    query: |
      sum(rate({level="error"}[5m])) by (service)

  - title: "Request Latency P99"
    type: gauge
    query: |
      histogram_quantile(0.99,
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
      )

  - title: "Top Error Messages"
    type: table
    query: |
      topk(10,
        count_over_time({level="error"}[1h])
      ) by (message)

  - title: "Log Volume by Level"
    type: piechart
    query: |
      sum(count_over_time({}[24h])) by (level)
```

### Alerting on Log Patterns

```yaml
# Prometheus alerting rules based on log metrics
groups:
  - name: log-based-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(log_messages_total{level="error"}[5m])) by (service)
          / sum(rate(log_messages_total[5m])) by (service) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: AuthenticationFailureSpike
        expr: |
          sum(increase(log_messages_total{
            service="auth-service",
            message=~".*authentication failed.*"
          }[5m])) > 100
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Spike in authentication failures"
          description: "{{ $value }} auth failures in last 5 minutes"

      - alert: NoLogsReceived
        expr: |
          absent(log_messages_total{service="critical-service"})
          or sum(rate(log_messages_total{service="critical-service"}[5m])) == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "No logs from critical-service"
```

## Best Practices

### What to Log

```javascript
// Good logging practices

// 1. Log application lifecycle events
logger.info({ port: 3000 }, 'Server started');
logger.info('Database connection established');
logger.info({ signal: 'SIGTERM' }, 'Graceful shutdown initiated');

// 2. Log business events
logger.info({
  userId,
  orderId,
  total: order.total,
  itemCount: order.items.length
}, 'Order placed');

// 3. Log external service interactions
logger.info({
  service: 'payment-gateway',
  operation: 'charge',
  duration: endTime - startTime,
  success: true
}, 'External API call completed');

// 4. Log security-relevant events
logger.info({
  userId,
  action: 'login',
  ipAddress: req.ip,
  success: true
}, 'User authentication');

logger.warn({
  ipAddress: req.ip,
  attemptedUser: username,
  failureCount: attempts
}, 'Failed login attempt');

// 5. Log errors with context
logger.error({
  error: {
    name: error.name,
    message: error.message,
    stack: error.stack
  },
  requestId,
  userId,
  operation: 'processPayment'
}, 'Operation failed');
```

### What NOT to Log

```javascript
// NEVER log sensitive data

// BAD - exposes credentials
logger.info({ password: user.password }, 'User created');

// BAD - exposes full credit card
logger.info({ creditCard: '4111111111111111' }, 'Payment processed');

// BAD - exposes API keys
logger.debug({ apiKey: process.env.API_KEY }, 'Calling external API');

// BAD - exposes PII
logger.info({ ssn: customer.ssn }, 'Customer verified');

// GOOD - redact or mask sensitive data
logger.info({
  email: maskEmail(user.email),  // j***@example.com
  lastFourDigits: card.slice(-4)  // ****1111
}, 'Payment processed');

// GOOD - use structured redaction
const logger = pino({
  redact: {
    paths: ['password', 'creditCard', 'ssn', 'apiKey', '*.password'],
    censor: '[REDACTED]'
  }
});
```

### Log Message Guidelines

```javascript
// Use consistent, searchable message formats

// GOOD - action-oriented, searchable
logger.info('user_created');
logger.info('order_processed');
logger.info('payment_failed');

// BAD - inconsistent, hard to search
logger.info('A new user was created in the system');
logger.info('Order done!');
logger.info('Payment didnt work');

// GOOD - include relevant context
logger.info({
  event: 'cache_miss',
  key: cacheKey,
  ttl: 3600
}, 'Cache miss occurred');

// GOOD - use snake_case for event names (consistent with metrics)
logger.info({
  event: 'http_request_completed',
  method: 'POST',
  path: '/api/orders',
  statusCode: 201,
  durationMs: 145
});
```

### Performance Considerations

```javascript
// Avoid expensive operations in log statements

// BAD - JSON.stringify runs even if debug is disabled
logger.debug(`Full object: ${JSON.stringify(largeObject)}`);

// GOOD - use structured logging, let the logger handle serialization
logger.debug({ data: largeObject }, 'Processing complete');

// BAD - expensive computation always runs
logger.debug(`Stats: ${calculateExpensiveStats()}`);

// GOOD - check log level first or use lazy evaluation
if (logger.isLevelEnabled('debug')) {
  logger.debug({ stats: calculateExpensiveStats() }, 'Debug stats');
}

// Use sampling for high-volume logs
const shouldSample = () => Math.random() < 0.1; // 10% sample rate

function logHighVolumeEvent(data) {
  if (shouldSample()) {
    logger.debug({ ...data, sampled: true }, 'High volume event');
  }
}

// Async logging for performance-critical paths
const asyncLogger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: '/var/log/app.log' }
  }
});
```

### Correlation and Tracing

```javascript
// Implement request correlation across services

// Generate or propagate correlation ID
function correlationMiddleware(req, res, next) {
  req.correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.traceId = req.headers['x-trace-id'] || uuidv4();

  // Propagate to downstream services
  res.setHeader('x-correlation-id', req.correlationId);

  next();
}

// Include in all logs
function createRequestLogger(req) {
  return logger.child({
    correlationId: req.correlationId,
    traceId: req.traceId,
    spanId: uuidv4()
  });
}

// When calling other services, propagate headers
async function callDownstreamService(endpoint, data, req) {
  return axios.post(endpoint, data, {
    headers: {
      'x-correlation-id': req.correlationId,
      'x-trace-id': req.traceId,
      'x-parent-span-id': req.spanId
    }
  });
}
```

## Log Retention and Storage

### Retention Policies

```yaml
# Elasticsearch ILM policy
PUT _ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "50gb",
            "max_age": "1d"
          },
          "set_priority": {
            "priority": 100
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {},
          "set_priority": {
            "priority": 0
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

### Cost Optimization

```yaml
# Log level and sampling by environment
production:
  defaults:
    level: info
    sampleRate: 1.0

  overrides:
    # High-volume services use sampling for debug
    payment-service:
      debug:
        sampleRate: 0.01  # 1% of debug logs

    # Verbose services only log warnings and above
    metrics-collector:
      level: warn

    # Critical services keep all logs
    auth-service:
      level: debug
      sampleRate: 1.0

# Archive older logs to cheaper storage
archival:
  destination: s3://logs-archive
  compression: gzip
  retentionDays: 365
```

## Further Reading

### Official Documentation

- [Elasticsearch Logging Best Practices](https://www.elastic.co/guide/en/elasticsearch/reference/current/logging.html)
- [Fluentd Documentation](https://docs.fluentd.org/)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [OpenTelemetry Logging Specification](https://opentelemetry.io/docs/specs/otel/logs/)

### Recommended Libraries

- **Node.js**: Pino, Winston, Bunyan
- **Python**: structlog, loguru, python-json-logger
- **Go**: zerolog, zap, logrus
- **Java**: SLF4J with Logback, Log4j2

### Cloud Logging Solutions

- **AWS CloudWatch Logs**: Native AWS logging with insights and metrics
- **Google Cloud Logging**: Integrated logging for GCP workloads
- **Azure Monitor Logs**: Comprehensive logging for Azure services
- **Datadog Logs**: Full-stack observability platform
- **Splunk**: Enterprise log management and SIEM

### Related Topics

- **Distributed Tracing**: Jaeger, Zipkin, OpenTelemetry
- **Metrics Collection**: Prometheus, StatsD, Graphite
- **Alerting**: PagerDuty, OpsGenie, Alertmanager
- **APM Solutions**: New Relic, Dynatrace, Elastic APM

---

> Effective logging is essential for maintaining observable, debuggable systems. By implementing structured logging, proper log levels, and centralized aggregation, teams can significantly reduce incident response times and improve system reliability. Remember that logs are not just for debugging - they tell the story of your application's behavior and are critical for understanding system health in production.
