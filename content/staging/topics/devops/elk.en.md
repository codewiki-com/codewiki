---
title: ELK Stack Log Management Guide
description: Master ELK for centralized logging and analysis
track: devops
section: observability
difficulty: advanced
tags:
  - ELK
  - Elasticsearch
  - Logging
  - Observability
status: imported
origin: old/src/content/docs/devops/elk.en.md
divergence: 0.167
issues: []
legacy:
  category: DevOps
  subcategory: Observability
  order: 13
  lastUpdated: 2026-01-07
---

## Concept Overview

The ELK Stack is a collection of three open-source products developed by Elastic: Elasticsearch, Logstash, and Kibana. This technology stack has become the de facto standard for log management and analysis, widely adopted for enterprise-grade log collection, storage, search, and visualization.

### Core Components

The ELK Stack comprises the following core components:

- **Elasticsearch**: A distributed search and analytics engine responsible for log data storage and retrieval
- **Logstash**: A server-side data processing pipeline for data collection, transformation, and output
- **Kibana**: A data visualization platform providing log search, dashboards, and analytics capabilities
- **Beats**: A family of lightweight data shippers including Filebeat, Metricbeat, and others

### Use Cases

The ELK Stack is particularly suited for the following scenarios:

1. **Centralized Log Management**: Unified collection and management of logs from distributed systems
2. **Real-time Log Analysis**: Fast search and analysis of massive log data
3. **Security Event Monitoring**: SIEM (Security Information and Event Management) solutions
4. **Business Metrics Analysis**: Extracting business insights from log data
5. **Troubleshooting**: Rapid issue identification in distributed systems

## ELK Architecture Overview

### Architecture Diagram

```
                    +-------------------------------------------------------+
                    |                   ELK Stack Architecture               |
                    +-------------------------------------------------------+
                                              |
        +-------------------------------------+-------------------------------------+
        |                                     |                                     |
        v                                     v                                     v
+---------------+                   +-----------------+                   +-----------------+
|    Beats      |                   |    Logstash     |                   |  Elasticsearch  |
| (Data Shipper)|-------Send------->| (Data Processing)|------Index------>| (Storage/Search)|
+---------------+                   +-----------------+                   +-----------------+
        |                                     |                                     |
        |                                     |                                     |
+-------+-------+                   +---------+---------+                 +---------+---------+
|   Filebeat    |                   |   Input Plugins   |                 |    Index/Shard    |
|   Metricbeat  |                   |   Filter Plugins  |                 |    Replica        |
|   Packetbeat  |                   |   Output Plugins  |                 |    Cluster        |
+---------------+                   +-------------------+                 +-------------------+
                                                                                   |
                                                                                   v
                                                                         +-----------------+
                                                                         |     Kibana      |
                                                                         |  (Visualization)|
                                                                         +-----------------+
```

### Data Flow

A typical ELK data flow includes the following stages:

```
Application -> Log Files -> Filebeat -> Logstash -> Elasticsearch -> Kibana
                               |
                          (Optional) Kafka/Redis
                           (Message Queue Buffer)
```

### Production Environment Architecture

```yaml
# docker-compose.yml - Production environment example
version: '3.8'

services:
  # Elasticsearch Cluster
  elasticsearch-master:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-master
    environment:
      - node.name=es-master
      - cluster.name=production-cluster
      - discovery.seed_hosts=es-data-1,es-data-2
      - cluster.initial_master_nodes=es-master
      - node.roles=master
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es-master-data:/usr/share/elasticsearch/data
    networks:
      - elk

  elasticsearch-data-1:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-data-1
    environment:
      - node.name=es-data-1
      - cluster.name=production-cluster
      - discovery.seed_hosts=es-master,es-data-2
      - node.roles=data,ingest
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
      - xpack.security.enabled=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es-data-1:/usr/share/elasticsearch/data
    networks:
      - elk

  # Logstash
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    environment:
      - "LS_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "5044:5044"   # Beats input
      - "9600:9600"   # Logstash API
    networks:
      - elk
    depends_on:
      - elasticsearch-master

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://es-master:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=${KIBANA_PASSWORD}
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      - elasticsearch-master

volumes:
  es-master-data:
  es-data-1:

networks:
  elk:
    driver: bridge
```

## Elasticsearch Indexing and Queries

### Index Management

Elasticsearch uses indices to organize data, similar to the concept of databases in relational database systems.

#### Creating an Index

```json
// Create a log index
PUT /application-logs-2024.01
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index.lifecycle.name": "logs-policy",
    "index.lifecycle.rollover_alias": "application-logs",
    "analysis": {
      "analyzer": {
        "log_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "stop"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "@timestamp": {
        "type": "date"
      },
      "level": {
        "type": "keyword"
      },
      "message": {
        "type": "text",
        "analyzer": "log_analyzer"
      },
      "service": {
        "type": "keyword"
      },
      "host": {
        "type": "keyword"
      },
      "trace_id": {
        "type": "keyword"
      },
      "span_id": {
        "type": "keyword"
      },
      "response_time": {
        "type": "float"
      },
      "status_code": {
        "type": "integer"
      },
      "request": {
        "properties": {
          "method": { "type": "keyword" },
          "path": { "type": "keyword" },
          "query": { "type": "text" }
        }
      },
      "user": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      }
    }
  }
}
```

#### Index Templates

```json
// Create an index template
PUT /_index_template/logs-template
{
  "index_patterns": ["logs-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1,
      "index.refresh_interval": "5s",
      "index.translog.durability": "async"
    },
    "mappings": {
      "dynamic_templates": [
        {
          "strings_as_keywords": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      ],
      "properties": {
        "@timestamp": { "type": "date" },
        "message": { "type": "text" }
      }
    }
  }
}
```

### Query DSL

#### Basic Queries

```json
// Match query
GET /application-logs/_search
{
  "query": {
    "match": {
      "message": "error connection timeout"
    }
  }
}

// Term query (exact match)
GET /application-logs/_search
{
  "query": {
    "term": {
      "level": "ERROR"
    }
  }
}

// Range query
GET /application-logs/_search
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-1h",
        "lte": "now"
      }
    }
  }
}
```

#### Compound Queries

```json
// Bool compound query
GET /application-logs/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "error" } }
      ],
      "filter": [
        { "term": { "service": "api-gateway" } },
        { "range": { "@timestamp": { "gte": "now-24h" } } }
      ],
      "must_not": [
        { "term": { "level": "DEBUG" } }
      ],
      "should": [
        { "term": { "status_code": 500 } },
        { "term": { "status_code": 502 } }
      ],
      "minimum_should_match": 1
    }
  },
  "sort": [
    { "@timestamp": "desc" }
  ],
  "size": 100
}
```

#### Aggregation Queries

```json
// Multi-dimensional aggregation analysis
GET /application-logs/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-7d"
      }
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "hour"
      },
      "aggs": {
        "by_service": {
          "terms": {
            "field": "service",
            "size": 10
          },
          "aggs": {
            "error_count": {
              "filter": {
                "term": { "level": "ERROR" }
              }
            },
            "avg_response_time": {
              "avg": {
                "field": "response_time"
              }
            },
            "percentiles_response_time": {
              "percentiles": {
                "field": "response_time",
                "percents": [50, 90, 95, 99]
              }
            }
          }
        }
      }
    },
    "top_errors": {
      "terms": {
        "field": "message.keyword",
        "size": 10,
        "order": { "_count": "desc" }
      }
    }
  }
}
```

### Index Lifecycle Management (ILM)

```json
// Create an ILM policy
PUT /_ilm/policy/logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_primary_shard_size": "50gb",
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
          "set_priority": {
            "priority": 0
          },
          "freeze": {}
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

## Logstash Data Pipelines

### Pipeline Configuration

A Logstash pipeline consists of three parts: input, filter, and output.

#### Complete Pipeline Example

```ruby
# /etc/logstash/conf.d/application-logs.conf

input {
  beats {
    port => 5044
    ssl => true
    ssl_certificate => "/etc/logstash/certs/logstash.crt"
    ssl_key => "/etc/logstash/certs/logstash.key"
  }

  kafka {
    bootstrap_servers => "kafka1:9092,kafka2:9092,kafka3:9092"
    topics => ["application-logs"]
    group_id => "logstash-consumers"
    consumer_threads => 3
    codec => json
  }
}

filter {
  # Parse JSON format logs
  if [message] =~ /^\{/ {
    json {
      source => "message"
      target => "parsed"
    }

    mutate {
      rename => {
        "[parsed][level]" => "level"
        "[parsed][timestamp]" => "log_timestamp"
        "[parsed][service]" => "service"
        "[parsed][message]" => "log_message"
      }
    }
  }

  # Parse unstructured logs
  else {
    grok {
      match => {
        "message" => [
          "%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} \[%{DATA:service}\] \[%{DATA:trace_id}\] %{GREEDYDATA:log_message}",
          "%{TIMESTAMP_ISO8601:log_timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log_message}"
        ]
      }
      tag_on_failure => ["_grokparsefailure"]
    }
  }

  # Timestamp processing
  date {
    match => ["log_timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSS"]
    target => "@timestamp"
    timezone => "UTC"
  }

  # GeoIP geolocation parsing
  if [client_ip] {
    geoip {
      source => "client_ip"
      target => "geoip"
      database => "/etc/logstash/GeoLite2-City.mmdb"
    }
  }

  # User Agent parsing
  if [user_agent] {
    useragent {
      source => "user_agent"
      target => "ua"
    }
  }

  # Sensitive data masking
  mutate {
    gsub => [
      "log_message", "password=\S+", "password=***",
      "log_message", "token=\S+", "token=***",
      "log_message", "\b\d{16,19}\b", "****CARD****"
    ]
  }

  # Field type conversion
  mutate {
    convert => {
      "response_time" => "float"
      "status_code" => "integer"
      "bytes" => "integer"
    }
  }

  # Add metadata
  mutate {
    add_field => {
      "[@metadata][index_prefix]" => "logs"
      "environment" => "${ENVIRONMENT:production}"
    }
  }

  # Route based on log level
  if [level] == "ERROR" or [level] == "FATAL" {
    mutate {
      add_tag => ["alert"]
    }
  }

  # Remove unnecessary fields
  mutate {
    remove_field => ["parsed", "log_timestamp", "agent", "ecs"]
  }
}

output {
  # Output to Elasticsearch
  elasticsearch {
    hosts => ["https://es-master:9200"]
    user => "logstash_writer"
    password => "${ES_PASSWORD}"
    ssl => true
    ssl_certificate_verification => true
    cacert => "/etc/logstash/certs/ca.crt"

    index => "%{[@metadata][index_prefix]}-%{[service]}-%{+YYYY.MM.dd}"

    # Use ingest pipeline
    pipeline => "logs-pipeline"

    # Bulk write optimization
    bulk_path => "/_bulk"
    http_compression => true
  }

  # Send error logs to alert queue
  if "alert" in [tags] {
    kafka {
      bootstrap_servers => "kafka1:9092"
      topic_id => "error-alerts"
      codec => json
    }
  }

  # Debug output
  if [@metadata][debug] {
    stdout {
      codec => rubydebug
    }
  }
}
```

### Grok Pattern Library

```ruby
# /etc/logstash/patterns/custom-patterns

# Nginx access log
NGINX_ACCESS %{IPORHOST:client_ip} - %{USER:ident} \[%{HTTPDATE:timestamp}\] "%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:status_code} %{NUMBER:bytes} "%{DATA:referrer}" "%{DATA:user_agent}" %{NUMBER:request_time}

# Java exception stack trace
JAVA_EXCEPTION %{JAVACLASS:exception_class}: %{GREEDYDATA:exception_message}
JAVA_STACKTRACE ^\s+at %{JAVACLASS:class}\.%{JAVAMETHOD:method}\(%{JAVAFILE:file}:%{NUMBER:line}\)

# Application log format
APP_LOG %{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level}\s+%{JAVACLASS:logger} - %{GREEDYDATA:message}

# API request log
API_REQUEST \[%{DATA:trace_id}\] %{WORD:method} %{URIPATH:path} %{NUMBER:status_code} %{NUMBER:response_time}ms
```

## Filebeat Log Collection

### Basic Configuration

```yaml
# /etc/filebeat/filebeat.yml

filebeat.inputs:
  # Application log collection
  - type: log
    id: application-logs
    enabled: true
    paths:
      - /var/log/application/*.log
      - /var/log/application/**/*.log
    exclude_files: ['\.gz$', '\.zip$']

    # Multiline log handling (Java stack traces)
    multiline:
      type: pattern
      pattern: '^\d{4}-\d{2}-\d{2}'
      negate: true
      match: after
      max_lines: 500
      timeout: 5s

    # Field additions
    fields:
      service: my-application
      environment: production
    fields_under_root: true

    # Processors
    processors:
      - add_host_metadata:
          when.not.contains.tags: forwarded
      - add_docker_metadata: ~
      - add_kubernetes_metadata: ~

    # File state management
    close_inactive: 5m
    close_removed: true
    clean_removed: true

    # Performance tuning
    harvester_buffer_size: 16384
    max_bytes: 10485760

  # Container log collection
  - type: container
    id: docker-logs
    enabled: true
    paths:
      - /var/lib/docker/containers/*/*.log

    processors:
      - add_docker_metadata: ~
      - decode_json_fields:
          fields: ["message"]
          target: ""
          overwrite_keys: true

  # Kubernetes log collection
  - type: kubernetes
    id: k8s-logs
    enabled: true
    node: ${NODE_NAME}
    hints.enabled: true
    hints.default_config:
      type: container
      paths:
        - /var/log/containers/*${data.kubernetes.container.id}.log

# Module configuration
filebeat.modules:
  - module: nginx
    access:
      enabled: true
      var.paths: ["/var/log/nginx/access.log*"]
    error:
      enabled: true
      var.paths: ["/var/log/nginx/error.log*"]

  - module: system
    syslog:
      enabled: true
    auth:
      enabled: true

# Output configuration
output.elasticsearch:
  hosts: ["https://es1:9200", "https://es2:9200", "https://es3:9200"]
  username: "filebeat_writer"
  password: "${ES_PASSWORD}"
  ssl:
    enabled: true
    certificate_authorities: ["/etc/filebeat/certs/ca.crt"]

  # Index configuration
  index: "filebeat-%{[agent.version]}-%{+yyyy.MM.dd}"

  # Performance tuning
  bulk_max_size: 2048
  worker: 2
  compression_level: 5

# Or output to Logstash
output.logstash:
  hosts: ["logstash1:5044", "logstash2:5044"]
  loadbalance: true
  ssl:
    enabled: true
    certificate_authorities: ["/etc/filebeat/certs/ca.crt"]
    certificate: "/etc/filebeat/certs/filebeat.crt"
    key: "/etc/filebeat/certs/filebeat.key"

# Queue configuration
queue.mem:
  events: 4096
  flush.min_events: 2048
  flush.timeout: 1s

# Monitoring
monitoring:
  enabled: true
  elasticsearch:
    hosts: ["https://es-monitoring:9200"]
    username: "beats_system"
    password: "${BEATS_PASSWORD}"

# Logging configuration
logging:
  level: info
  to_files: true
  files:
    path: /var/log/filebeat
    name: filebeat
    keepfiles: 7
    permissions: 0640
```

### Kubernetes DaemonSet Deployment

```yaml
# filebeat-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: logging
  labels:
    app: filebeat
spec:
  selector:
    matchLabels:
      app: filebeat
  template:
    metadata:
      labels:
        app: filebeat
    spec:
      serviceAccountName: filebeat
      terminationGracePeriodSeconds: 30
      hostNetwork: true
      dnsPolicy: ClusterFirstWithHostNet
      containers:
        - name: filebeat
          image: docker.elastic.co/beats/filebeat:8.11.0
          args: ["-c", "/etc/filebeat.yml", "-e"]
          env:
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: ES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: elasticsearch-credentials
                  key: password
          securityContext:
            runAsUser: 0
          resources:
            limits:
              memory: 500Mi
              cpu: 500m
            requests:
              memory: 200Mi
              cpu: 100m
          volumeMounts:
            - name: config
              mountPath: /etc/filebeat.yml
              subPath: filebeat.yml
              readOnly: true
            - name: data
              mountPath: /usr/share/filebeat/data
            - name: varlog
              mountPath: /var/log
              readOnly: true
            - name: containers
              mountPath: /var/lib/docker/containers
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: filebeat-config
        - name: data
          hostPath:
            path: /var/lib/filebeat-data
            type: DirectoryOrCreate
        - name: varlog
          hostPath:
            path: /var/log
        - name: containers
          hostPath:
            path: /var/lib/docker/containers
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: filebeat
rules:
  - apiGroups: [""]
    resources: ["namespaces", "pods", "nodes"]
    verbs: ["get", "watch", "list"]
```

## Kibana Visualization

### Dashboard Configuration

```json
// Saved search example
{
  "title": "Error Logs - Last 24h",
  "description": "All error level logs from the past 24 hours",
  "columns": ["@timestamp", "service", "level", "message"],
  "sort": [["@timestamp", "desc"]],
  "kibanaSavedObjectMeta": {
    "searchSourceJSON": {
      "query": {
        "bool": {
          "must": [
            { "term": { "level": "ERROR" } }
          ],
          "filter": [
            {
              "range": {
                "@timestamp": {
                  "gte": "now-24h",
                  "lte": "now"
                }
              }
            }
          ]
        }
      },
      "index": "logs-*"
    }
  }
}
```

### Visualization Components

```json
// Service error rate trend chart
{
  "title": "Service Error Rate",
  "type": "line",
  "params": {
    "type": "line",
    "grid": { "categoryLines": false },
    "categoryAxes": [{
      "id": "CategoryAxis-1",
      "type": "category",
      "position": "bottom",
      "show": true,
      "labels": { "show": true, "truncate": 100 },
      "title": {}
    }],
    "valueAxes": [{
      "id": "ValueAxis-1",
      "name": "LeftAxis-1",
      "type": "value",
      "position": "left",
      "show": true,
      "labels": { "show": true },
      "title": { "text": "Error Rate (%)" }
    }]
  },
  "aggs": [
    {
      "id": "1",
      "enabled": true,
      "type": "avg",
      "schema": "metric",
      "params": {
        "field": "error_rate",
        "customLabel": "Error Rate"
      }
    },
    {
      "id": "2",
      "enabled": true,
      "type": "date_histogram",
      "schema": "segment",
      "params": {
        "field": "@timestamp",
        "interval": "auto",
        "min_doc_count": 1
      }
    },
    {
      "id": "3",
      "enabled": true,
      "type": "terms",
      "schema": "group",
      "params": {
        "field": "service",
        "size": 10,
        "order": "desc",
        "orderBy": "1"
      }
    }
  ]
}
```

### Kibana Alert Rules

```yaml
# Kibana Alert Rule (created via API)
POST kbn:/api/alerting/rule
{
  "name": "High Error Rate Alert",
  "consumer": "alerts",
  "rule_type_id": ".es-query",
  "schedule": {
    "interval": "5m"
  },
  "params": {
    "index": ["logs-*"],
    "timeField": "@timestamp",
    "esQuery": {
      "bool": {
        "must": [
          { "term": { "level": "ERROR" } }
        ],
        "filter": [
          {
            "range": {
              "@timestamp": {
                "gte": "now-5m"
              }
            }
          }
        ]
      }
    },
    "threshold": [100],
    "thresholdComparator": ">",
    "size": 100
  },
  "actions": [
    {
      "group": "threshold met",
      "id": "slack-connector-id",
      "params": {
        "message": "High error rate detected: {{context.value}} errors in the last 5 minutes"
      }
    }
  ]
}
```

## Log Standardization

### Structured Log Specification

```json
// Standard log format
{
  "@timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "com.example.service.UserService",
  "message": "User login successful",
  "service": {
    "name": "user-service",
    "version": "1.2.3",
    "environment": "production",
    "instance": "user-service-pod-abc123"
  },
  "trace": {
    "trace_id": "abc123def456",
    "span_id": "span789",
    "parent_span_id": "parent456"
  },
  "event": {
    "category": "authentication",
    "action": "login",
    "outcome": "success"
  },
  "user": {
    "id": "user123",
    "name": "john.doe"
  },
  "http": {
    "request": {
      "method": "POST",
      "path": "/api/v1/login"
    },
    "response": {
      "status_code": 200
    }
  },
  "duration_ms": 45,
  "host": {
    "name": "node-1",
    "ip": "10.0.1.100"
  }
}
```

### Java Logging Configuration (Logback)

```xml
<!-- logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- JSON format output -->
    <appender name="JSON_CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>
                {"service":{"name":"${SERVICE_NAME}","version":"${SERVICE_VERSION}"}}</customFields>
            <includeMdcKeyName>trace_id</includeMdcKeyName>
            <includeMdcKeyName>span_id</includeMdcKeyName>
            <includeMdcKeyName>user_id</includeMdcKeyName>
            <timeZone>UTC</timeZone>
            <fieldNames>
                <timestamp>@timestamp</timestamp>
                <message>message</message>
                <logger>logger</logger>
                <level>level</level>
                <thread>thread</thread>
            </fieldNames>
        </encoder>
    </appender>

    <!-- File output (rolling) -->
    <appender name="JSON_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/application/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
            <fileNamePattern>/var/log/application/app.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>10GB</totalSizeCap>
        </rollingPolicy>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>{"service":{"name":"${SERVICE_NAME}"}}</customFields>
        </encoder>
    </appender>

    <!-- Async output -->
    <appender name="ASYNC_JSON" class="ch.qos.logback.classic.AsyncAppender">
        <queueSize>512</queueSize>
        <discardingThreshold>0</discardingThreshold>
        <includeCallerData>true</includeCallerData>
        <appender-ref ref="JSON_FILE"/>
    </appender>

    <root level="INFO">
        <appender-ref ref="JSON_CONSOLE"/>
        <appender-ref ref="ASYNC_JSON"/>
    </root>
</configuration>
```

### Python Logging Configuration

```python
# logging_config.py
import logging
import json
import sys
import os
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # Standard fields
        log_record['@timestamp'] = datetime.utcnow().isoformat() + 'Z'
        log_record['level'] = record.levelname
        log_record['logger'] = record.name

        # Service information
        log_record['service'] = {
            'name': os.getenv('SERVICE_NAME', 'unknown'),
            'version': os.getenv('SERVICE_VERSION', 'unknown'),
            'environment': os.getenv('ENVIRONMENT', 'development')
        }

        # Trace information
        if hasattr(record, 'trace_id'):
            log_record['trace'] = {
                'trace_id': record.trace_id,
                'span_id': getattr(record, 'span_id', None)
            }

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # JSON format handler
    handler = logging.StreamHandler(sys.stdout)
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger

# Usage example
logger = setup_logging()

class TraceAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        extra = kwargs.get('extra', {})
        extra['trace_id'] = self.extra.get('trace_id')
        extra['span_id'] = self.extra.get('span_id')
        kwargs['extra'] = extra
        return msg, kwargs

# Logging with trace context
trace_logger = TraceAdapter(logger, {'trace_id': 'abc123', 'span_id': 'span456'})
trace_logger.info('Processing request', extra={'user_id': 'user123'})
```

### Node.js Logging Configuration

```javascript
// logger.js
const winston = require('winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD
    }
  },
  indexPrefix: 'logs-nodejs'
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: {
      name: process.env.SERVICE_NAME || 'nodejs-app',
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new ElasticsearchTransport(esTransportOpts)
  ]
});

// Add trace context middleware
const addTraceContext = (traceId, spanId) => {
  return logger.child({
    trace: { trace_id: traceId, span_id: spanId }
  });
};

module.exports = { logger, addTraceContext };
```

## Cluster Operations

### Elasticsearch Cluster Configuration

```yaml
# elasticsearch.yml - Master node configuration
cluster.name: production-elk
node.name: es-master-1
node.roles: [master]

network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

discovery.seed_hosts:
  - es-master-1:9300
  - es-master-2:9300
  - es-master-3:9300

cluster.initial_master_nodes:
  - es-master-1
  - es-master-2
  - es-master-3

# Path configuration
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# Memory locking
bootstrap.memory_lock: true

# Network optimization
http.max_content_length: 200mb
http.compression: true

# Cluster recovery settings
gateway.recover_after_nodes: 2
gateway.expected_nodes: 3
gateway.recover_after_time: 5m

# Shard allocation
cluster.routing.allocation.node_concurrent_recoveries: 4
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
cluster.routing.allocation.disk.watermark.flood_stage: 95%
```

```yaml
# elasticsearch.yml - Data node configuration
cluster.name: production-elk
node.name: es-data-1
node.roles: [data, ingest]

# Data node specific configuration
indices.memory.index_buffer_size: 30%
indices.queries.cache.size: 20%
indices.fielddata.cache.size: 30%

thread_pool:
  write:
    queue_size: 1000
  search:
    queue_size: 1000
```

### Cluster Health Check Script

```bash
#!/bin/bash
# cluster-health-check.sh

ES_HOST="localhost:9200"
ES_USER="elastic"
ES_PASS="${ELASTIC_PASSWORD}"

# Cluster health status
echo "=== Cluster Health ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cluster/health?pretty"

# Node status
echo -e "\n=== Node Stats ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/nodes?v&h=name,ip,heap.percent,ram.percent,cpu,load_1m,node.role,master"

# Index status
echo -e "\n=== Index Health ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/indices?v&h=health,status,index,pri,rep,docs.count,store.size&s=store.size:desc" | head -20

# Shard allocation
echo -e "\n=== Shard Allocation ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/shards?v&h=index,shard,prirep,state,node&s=state" | grep -E "(UNASSIGNED|RELOCATING|INITIALIZING)"

# Pending tasks
echo -e "\n=== Pending Tasks ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cluster/pending_tasks?pretty"
```

### Ansible Automated Deployment

```yaml
# elasticsearch-playbook.yml
---
- name: Deploy Elasticsearch Cluster
  hosts: elasticsearch
  become: yes
  vars:
    es_version: "8.11.0"
    es_heap_size: "{{ (ansible_memtotal_mb * 0.5) | int }}m"
    cluster_name: "production-elk"

  tasks:
    - name: Configure system settings
      sysctl:
        name: "{{ item.name }}"
        value: "{{ item.value }}"
        state: present
        reload: yes
      loop:
        - { name: 'vm.max_map_count', value: '262144' }
        - { name: 'vm.swappiness', value: '1' }
        - { name: 'net.core.somaxconn', value: '65535' }

    - name: Set file limits
      pam_limits:
        domain: elasticsearch
        limit_type: "{{ item.type }}"
        limit_item: "{{ item.item }}"
        value: "{{ item.value }}"
      loop:
        - { type: 'soft', item: 'nofile', value: '65535' }
        - { type: 'hard', item: 'nofile', value: '65535' }
        - { type: 'soft', item: 'memlock', value: 'unlimited' }
        - { type: 'hard', item: 'memlock', value: 'unlimited' }

    - name: Install Elasticsearch
      apt:
        deb: "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-{{ es_version }}-amd64.deb"
        state: present

    - name: Configure Elasticsearch
      template:
        src: elasticsearch.yml.j2
        dest: /etc/elasticsearch/elasticsearch.yml
        owner: root
        group: elasticsearch
        mode: '0660'
      notify: restart elasticsearch

    - name: Configure JVM options
      template:
        src: jvm.options.j2
        dest: /etc/elasticsearch/jvm.options.d/heap.options
        owner: root
        group: elasticsearch
        mode: '0660'
      notify: restart elasticsearch

    - name: Enable and start Elasticsearch
      systemd:
        name: elasticsearch
        enabled: yes
        state: started

  handlers:
    - name: restart elasticsearch
      systemd:
        name: elasticsearch
        state: restarted
```

## Performance Tuning

### Elasticsearch Performance Optimization

```json
// Index performance optimization settings
PUT /logs-optimized/_settings
{
  "settings": {
    "index": {
      // Refresh interval (write optimization)
      "refresh_interval": "30s",

      // Transaction log
      "translog": {
        "durability": "async",
        "sync_interval": "5s",
        "flush_threshold_size": "1gb"
      },

      // Merge policy
      "merge": {
        "scheduler": {
          "max_thread_count": 1
        },
        "policy": {
          "max_merged_segment": "5gb",
          "segments_per_tier": 10
        }
      },

      // Write optimization
      "number_of_replicas": 0,  // During bulk import

      // Query cache
      "queries.cache.enabled": true
    }
  }
}

// Restore after bulk import
PUT /logs-optimized/_settings
{
  "settings": {
    "index": {
      "refresh_interval": "1s",
      "number_of_replicas": 1
    }
  }
}

// Force merge (read-only indices)
POST /logs-2024.01.01/_forcemerge?max_num_segments=1
```

### JVM Tuning

```bash
# /etc/elasticsearch/jvm.options.d/custom.options

# Heap size (recommended: no more than 50% of physical memory, max 32GB)
-Xms16g
-Xmx16g

# GC configuration (G1GC - recommended for ES 8.x)
-XX:+UseG1GC
-XX:G1HeapRegionSize=32m
-XX:MaxGCPauseMillis=200
-XX:InitiatingHeapOccupancyPercent=75

# GC logging
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/elasticsearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m

# Disable explicit GC
-XX:+DisableExplicitGC

# Off-heap memory
-XX:MaxDirectMemorySize=4g

# Error handling
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/lib/elasticsearch
-XX:ErrorFile=/var/log/elasticsearch/hs_err_pid%p.log
```

### Query Performance Optimization

```json
// Use filter context (cacheable)
GET /logs-*/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "service": "api-gateway" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ],
      "must": [
        { "match": { "message": "error" } }
      ]
    }
  }
}

// Pagination optimization (using search_after)
GET /logs-*/_search
{
  "size": 100,
  "query": {
    "match_all": {}
  },
  "sort": [
    { "@timestamp": "desc" },
    { "_id": "asc" }
  ],
  "search_after": ["2024-01-15T10:30:00.000Z", "doc_id_123"]
}

// Using Point in Time (PIT) for deep pagination
POST /logs-*/_pit?keep_alive=5m

GET /_search
{
  "size": 100,
  "pit": {
    "id": "pit_id_here",
    "keep_alive": "5m"
  },
  "sort": [
    { "@timestamp": "desc" }
  ]
}
```

### Logstash Performance Optimization

```yaml
# /etc/logstash/logstash.yml

# Pipeline configuration
pipeline.workers: 8                    # Number of CPU cores
pipeline.batch.size: 1000             # Batch size
pipeline.batch.delay: 50              # Batch delay (ms)

# Queue configuration (persistent queue)
queue.type: persisted
queue.max_bytes: 4gb
queue.checkpoint.writes: 1024

# Performance monitoring
monitoring.enabled: true
monitoring.elasticsearch.hosts: ["http://es-monitoring:9200"]
```

```ruby
# Pipeline performance optimization
output {
  elasticsearch {
    hosts => ["es1:9200", "es2:9200", "es3:9200"]

    # Bulk write optimization
    bulk_max_size => 2000
    flush_size => 2000
    idle_flush_time => 5

    # Retry configuration
    retry_max_interval => 64
    retry_initial_interval => 2

    # HTTP optimization
    http_compression => true
    pool_max => 1000
    pool_max_per_route => 100
  }
}
```

## Security Configuration

### Elasticsearch Security Settings

```yaml
# elasticsearch.yml security configuration
xpack.security.enabled: true
xpack.security.enrollment.enabled: true

# Transport layer encryption
xpack.security.transport.ssl:
  enabled: true
  verification_mode: certificate
  keystore.path: /etc/elasticsearch/certs/transport.p12
  truststore.path: /etc/elasticsearch/certs/transport.p12

# HTTP layer encryption
xpack.security.http.ssl:
  enabled: true
  keystore.path: /etc/elasticsearch/certs/http.p12

# Audit logging
xpack.security.audit.enabled: true
xpack.security.audit.logfile.events.include:
  - access_granted
  - access_denied
  - authentication_failed
  - connection_denied
```

### Role and User Management

```json
// Create read-only role
POST /_security/role/logs_reader
{
  "cluster": ["monitor"],
  "indices": [
    {
      "names": ["logs-*"],
      "privileges": ["read", "view_index_metadata"],
      "field_security": {
        "grant": ["*"],
        "except": ["password", "secret", "token"]
      },
      "query": {
        "term": {
          "environment": "production"
        }
      }
    }
  ]
}

// Create write role
POST /_security/role/logs_writer
{
  "cluster": ["monitor", "manage_index_templates"],
  "indices": [
    {
      "names": ["logs-*"],
      "privileges": ["create_index", "write", "manage"]
    }
  ]
}

// Create user
POST /_security/user/log_analyst
{
  "password": "secure_password_here",
  "roles": ["logs_reader", "kibana_user"],
  "full_name": "Log Analyst",
  "email": "analyst@example.com",
  "metadata": {
    "department": "operations"
  }
}

// Create API key
POST /_security/api_key
{
  "name": "filebeat-api-key",
  "role_descriptors": {
    "filebeat_writer": {
      "cluster": ["monitor", "read_ilm"],
      "indices": [
        {
          "names": ["filebeat-*", "logs-*"],
          "privileges": ["create_index", "write", "manage"]
        }
      ]
    }
  },
  "expiration": "365d"
}
```

### TLS Certificate Generation

```bash
#!/bin/bash
# generate-certs.sh

# Create CA
elasticsearch-certutil ca --out /etc/elasticsearch/certs/elastic-stack-ca.p12 --pass ""

# Generate node certificates
elasticsearch-certutil cert \
  --ca /etc/elasticsearch/certs/elastic-stack-ca.p12 \
  --ca-pass "" \
  --out /etc/elasticsearch/certs/elastic-certificates.p12 \
  --pass "" \
  --dns es-master-1,es-master-2,es-master-3,es-data-1,es-data-2 \
  --ip 10.0.1.1,10.0.1.2,10.0.1.3,10.0.2.1,10.0.2.2

# Generate HTTP certificates
elasticsearch-certutil http

# Extract CA certificate (for client use)
openssl pkcs12 -in /etc/elasticsearch/certs/elastic-stack-ca.p12 \
  -out /etc/elasticsearch/certs/ca.crt \
  -clcerts -nokeys -passin pass:

# Set permissions
chmod 640 /etc/elasticsearch/certs/*
chown root:elasticsearch /etc/elasticsearch/certs/*
```

## Interview Key Points

### Core Concepts

**Q: What are the roles of each component in the ELK Stack?**

```
A: The ELK Stack consists of four core components:

1. Elasticsearch
   - Distributed search and analytics engine
   - Built on Apache Lucene
   - Provides RESTful API
   - Supports real-time search and aggregation analysis

2. Logstash
   - Server-side data processing pipeline
   - Supports multiple input, filter, and output plugins
   - Data transformation and enrichment
   - Extensible plugin architecture

3. Kibana
   - Data visualization and exploration platform
   - Dashboard creation and management
   - Alerting and reporting features
   - Cluster management interface

4. Beats (Extended)
   - Lightweight data shippers
   - Filebeat: Log file collection
   - Metricbeat: Metrics collection
   - Packetbeat: Network data collection
```

**Q: What are shards and replicas in Elasticsearch?**

```
A: Shards and Replicas are core to Elasticsearch's distributed architecture:

Shards:
- Primary Shard: The original shard of data
- Determined at index creation time, cannot be changed afterward
- Each shard is an independent Lucene index
- Data is assigned to specific shards based on routing algorithm

Replicas:
- Copies of primary shards
- Provide high availability and read scaling
- Number can be adjusted dynamically
- Never placed on the same node as the primary shard

Routing formula:
shard = hash(routing) % number_of_primary_shards

Best practices:
- Number of shards = nodes * 1.5-2
- Single shard size: 10-50GB
- At least 1 replica for high availability
```

### Performance Optimization

**Q: How do you optimize Elasticsearch write performance?**

```
A: Write optimization strategies:

1. Index settings optimization
   - Increase refresh_interval (30s or longer)
   - Disable replicas (during bulk import)
   - Use async translog

2. Bulk operations
   - Use Bulk API
   - Reasonable batch size (1000-5000 documents)
   - Control concurrent request count

3. Hardware optimization
   - SSD storage
   - Sufficient memory (heap + file system cache)
   - Multi-core CPU

4. Mapping optimization
   - Avoid dynamic mapping
   - Disable unnecessary _source
   - Use keyword and text types appropriately

5. Cluster configuration
   - Dedicated master nodes
   - Coordinating nodes to share load
   - Proper thread pool configuration
```

**Q: How do you handle yellow or red cluster status in Elasticsearch?**

```
A: Cluster health status handling:

Yellow status (replicas unassigned):
1. Check if number of nodes meets replica requirements
2. Check if disk space is sufficient
3. Check shard allocation settings

# View unassigned reason
GET /_cluster/allocation/explain

Red status (primary shards unassigned):
1. Check if all nodes are online
2. Check if data directory is corrupted
3. Try manual shard allocation

# Reroute shards
POST /_cluster/reroute
{
  "commands": [{
    "allocate_stale_primary": {
      "index": "logs-2024.01.15",
      "shard": 0,
      "node": "es-data-1",
      "accept_data_loss": true
    }
  }]
}

Prevention measures:
- Monitor disk usage
- Configure reasonable watermarks
- Regular cluster health checks
- Implement ILM policies
```

### Logging Best Practices

**Q: What are the best practices for structured logging?**

```
A: Structured logging best practices:

1. Use a unified log format
   {
     "@timestamp": "ISO8601",
     "level": "INFO/WARN/ERROR",
     "service": "service name",
     "trace_id": "trace ID",
     "message": "log message",
     "context": { "business context" }
   }

2. Log level standards
   - DEBUG: Debugging information
   - INFO: Business flow
   - WARN: Potential issues
   - ERROR: Errors but recoverable
   - FATAL: Fatal errors

3. Context information
   - Trace ID (distributed tracing)
   - User ID
   - Request path
   - Response time

4. Security considerations
   - Mask sensitive data
   - Never log passwords, tokens
   - Compliance requirements (GDPR, etc.)

5. Performance considerations
   - Async log output
   - Appropriate log levels
   - Avoid logging in loops
```

### Architecture Design

**Q: How do you design a highly available ELK architecture?**

```
A: High availability ELK architecture design:

1. Elasticsearch Cluster
   - 3 dedicated master nodes (voting)
   - Multiple data nodes (horizontal scaling)
   - Coordinating nodes (query load balancing)
   - Cross-availability zone deployment

2. Logstash High Availability
   - Multiple instance deployment
   - Frontend load balancer
   - Persistent queue
   - Message queue buffer (Kafka)

3. Kibana High Availability
   - Multiple instances + load balancer
   - Session persistence
   - CDN acceleration

4. Data Collection
   - Filebeat DaemonSet
   - Auto-discovery configuration
   - Checkpoint resumption

5. Monitoring and Alerting
   - Cluster health monitoring
   - Storage capacity alerts
   - Performance metrics tracking

Architecture diagram:
                    +-------------+
                    | Load Balancer|
                    +------+------+
           +---------------+---------------+
           |               |               |
           v               v               v
      +---------+    +---------+    +---------+
      | Kibana  |    | Kibana  |    | Kibana  |
      +----+----+    +----+----+    +----+----+
           +---------------+---------------+
                           |
                           v
                    +------+------+
                    | Coordinator |
                    +------+------+
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
   +---------+        +---------+        +---------+
   | Master  |        | Master  |        | Master  |
   |   #1    |        |   #2    |        |   #3    |
   +---------+        +---------+        +---------+
        |                  |                  |
   +----+----+        +----+----+        +----+----+
   |  Data   |        |  Data   |        |  Data   |
   |  Nodes  |        |  Nodes  |        |  Nodes  |
   +---------+        +---------+        +---------+
```

### Common Troubleshooting

```bash
# Check cluster status
curl -X GET "localhost:9200/_cluster/health?pretty"

# View node information
curl -X GET "localhost:9200/_cat/nodes?v"

# View index status
curl -X GET "localhost:9200/_cat/indices?v&health=red"

# View shard allocation
curl -X GET "localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason"

# View hot threads
curl -X GET "localhost:9200/_nodes/hot_threads"

# View slow query logs
curl -X GET "localhost:9200/_cluster/settings?include_defaults=true" | jq '.defaults.index.search.slowlog'

# Check Logstash pipeline
curl -X GET "localhost:9600/_node/stats/pipelines?pretty"

# Filebeat diagnostics
filebeat test config -c /etc/filebeat/filebeat.yml
filebeat test output -c /etc/filebeat/filebeat.yml
```

## Further Reading

### Official Resources

- [Elastic Official Documentation](https://www.elastic.co/guide/index.html)
- [Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Reference](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Beats Platform Reference](https://www.elastic.co/guide/en/beats/libbeat/current/index.html)

### Recommended Books

- "Elasticsearch: The Definitive Guide" - Clinton Gormley & Zachary Tong
- "Learning Elastic Stack 7.0" - Pranav Shukla & Sharath Kumar M N
- "Advanced Elasticsearch 7.0" - Wai Tak Wong

### Related Tools

| Tool | Purpose | Link |
|------|---------|------|
| Elastic Agent | Unified agent for observability | https://www.elastic.co/elastic-agent |
| Fleet | Centralized agent management | https://www.elastic.co/guide/en/fleet |
| APM | Application Performance Monitoring | https://www.elastic.co/apm |
| SIEM | Security Information and Event Management | https://www.elastic.co/siem |
| Elastic Cloud | Managed Elasticsearch service | https://www.elastic.co/cloud |

### Community Resources

- [Elastic Community](https://discuss.elastic.co/)
- [Elastic GitHub](https://github.com/elastic)
- [Awesome Elasticsearch](https://github.com/dzharii/awesome-elasticsearch)
- [Elastic Blog](https://www.elastic.co/blog)

### Alternative Solutions

| Solution | Description | Use Case |
|----------|-------------|----------|
| Grafana Loki | Log aggregation system | Kubernetes native logging |
| Splunk | Enterprise log management | Enterprise SIEM |
| Datadog | Cloud monitoring platform | SaaS observability |
| Graylog | Open source log management | On-premise logging |
| Fluentd | Data collector | Kubernetes logging |

## Summary

The ELK Stack is a powerful combination of tools for building enterprise-grade log management and analysis platforms. By now, you should have mastered:

1. **Architecture Understanding**: Understanding the responsibilities of each ELK component and data flow
2. **Deployment Practices**: Ability to deploy production-level ELK clusters
3. **Data Processing**: Proficiency in using Logstash for data transformation and enrichment
4. **Query Analysis**: Mastery of Elasticsearch DSL queries and aggregations
5. **Visualization**: Ability to create valuable dashboards in Kibana
6. **Operations Capability**: Cluster monitoring, tuning, and troubleshooting skills
7. **Security Configuration**: Understanding and implementing ELK security best practices

In practice, we recommend combining APM, SIEM, and other scenarios to fully leverage the capabilities of the Elastic Stack and build a complete observability platform.
