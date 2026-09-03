---
title: ELK Stack 日志管理指南
description: 掌握ELK日志收集和分析平台，构建可观测性基础设施
track: devops
section: observability
difficulty: advanced
tags:
  - ELK
  - Elasticsearch
  - 日志
  - 可观测性
status: imported
origin: old/src/content/docs/devops/elk.zh.md
divergence: 0.167
issues: []
legacy:
  category: DevOps
  subcategory: Observability
  order: 13
  lastUpdated: 2026-01-07
---

## 概念解释

ELK Stack 是由 Elastic 公司开发的三个开源项目的组合：Elasticsearch、Logstash 和 Kibana。这套工具栈已成为日志管理和分析领域的事实标准，被广泛应用于企业级日志收集、存储、搜索和可视化场景。

### 核心组件

ELK Stack 由以下核心组件构成：

- **Elasticsearch**：分布式搜索和分析引擎，负责日志数据的存储和检索
- **Logstash**：服务端数据处理管道，用于数据收集、转换和输出
- **Kibana**：数据可视化平台，提供日志搜索、仪表板和分析功能
- **Beats**：轻量级数据采集器家族，包括 Filebeat、Metricbeat 等

### 适用场景

ELK Stack 特别适合以下场景：

1. **集中式日志管理**：统一收集和管理分布式系统的日志
2. **实时日志分析**：快速搜索和分析海量日志数据
3. **安全事件监控**：SIEM（安全信息和事件管理）解决方案
4. **业务指标分析**：从日志中提取业务洞察
5. **故障排查**：快速定位分布式系统中的问题

## ELK 架构概述

### 整体架构图

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   ELK Stack 架构                         │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│    Beats      │                   │    Logstash     │                   │   Elasticsearch │
│  (数据采集)    │───────发送────────►│   (数据处理)    │───────索引────────►│   (存储/搜索)    │
└───────────────┘                   └─────────────────┘                   └─────────────────┘
        │                                     │                                     │
        │                                     │                                     │
┌───────┴───────┐                   ┌─────────┴─────────┐                 ┌─────────┴─────────┐
│   Filebeat    │                   │   Input Plugins   │                 │    Index/Shard    │
│   Metricbeat  │                   │   Filter Plugins  │                 │    Replica        │
│   Packetbeat  │                   │   Output Plugins  │                 │    Cluster        │
└───────────────┘                   └───────────────────┘                 └───────────────────┘
                                                                                   │
                                                                                   ▼
                                                                         ┌─────────────────┐
                                                                         │     Kibana      │
                                                                         │   (可视化界面)   │
                                                                         └─────────────────┘
```

### 数据流向

典型的 ELK 数据流包含以下阶段：

```
应用程序 → 日志文件 → Filebeat → Logstash → Elasticsearch → Kibana
                         ↓
                    (可选) Kafka/Redis
                      (消息队列缓冲)
```

### 生产环境架构

```yaml
# docker-compose.yml - 生产环境示例
version: '3.8'

services:
  # Elasticsearch 集群
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

## Elasticsearch 索引与查询

### 索引管理

Elasticsearch 使用索引来组织数据，类似于关系数据库中的数据库概念。

#### 创建索引

```json
// 创建日志索引
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

#### 索引模板

```json
// 创建索引模板
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

### 查询 DSL

#### 基础查询

```json
// 匹配查询
GET /application-logs/_search
{
  "query": {
    "match": {
      "message": "error connection timeout"
    }
  }
}

// 精确匹配
GET /application-logs/_search
{
  "query": {
    "term": {
      "level": "ERROR"
    }
  }
}

// 范围查询
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

#### 复合查询

```json
// Bool 复合查询
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

#### 聚合查询

```json
// 多维聚合分析
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

### 索引生命周期管理 (ILM)

```json
// 创建 ILM 策略
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

## Logstash 数据管道

### 管道配置

Logstash 管道由三部分组成：input、filter 和 output。

#### 完整管道示例

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
  # 解析 JSON 格式日志
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

  # 解析非结构化日志
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

  # 时间戳处理
  date {
    match => ["log_timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSS"]
    target => "@timestamp"
    timezone => "Asia/Shanghai"
  }

  # GeoIP 地理位置解析
  if [client_ip] {
    geoip {
      source => "client_ip"
      target => "geoip"
      database => "/etc/logstash/GeoLite2-City.mmdb"
    }
  }

  # User Agent 解析
  if [user_agent] {
    useragent {
      source => "user_agent"
      target => "ua"
    }
  }

  # 敏感信息脱敏
  mutate {
    gsub => [
      "log_message", "password=\S+", "password=***",
      "log_message", "token=\S+", "token=***",
      "log_message", "\b\d{16,19}\b", "****CARD****"
    ]
  }

  # 字段类型转换
  mutate {
    convert => {
      "response_time" => "float"
      "status_code" => "integer"
      "bytes" => "integer"
    }
  }

  # 添加元数据
  mutate {
    add_field => {
      "[@metadata][index_prefix]" => "logs"
      "environment" => "${ENVIRONMENT:production}"
    }
  }

  # 根据日志级别路由
  if [level] == "ERROR" or [level] == "FATAL" {
    mutate {
      add_tag => ["alert"]
    }
  }

  # 删除不需要的字段
  mutate {
    remove_field => ["parsed", "log_timestamp", "agent", "ecs"]
  }
}

output {
  # 输出到 Elasticsearch
  elasticsearch {
    hosts => ["https://es-master:9200"]
    user => "logstash_writer"
    password => "${ES_PASSWORD}"
    ssl => true
    ssl_certificate_verification => true
    cacert => "/etc/logstash/certs/ca.crt"

    index => "%{[@metadata][index_prefix]}-%{[service]}-%{+YYYY.MM.dd}"

    # 使用管道处理
    pipeline => "logs-pipeline"

    # 批量写入优化
    bulk_path => "/_bulk"
    http_compression => true
  }

  # 错误日志额外发送到告警队列
  if "alert" in [tags] {
    kafka {
      bootstrap_servers => "kafka1:9092"
      topic_id => "error-alerts"
      codec => json
    }
  }

  # 调试输出
  if [@metadata][debug] {
    stdout {
      codec => rubydebug
    }
  }
}
```

### Grok 模式库

```ruby
# /etc/logstash/patterns/custom-patterns

# Nginx 访问日志
NGINX_ACCESS %{IPORHOST:client_ip} - %{USER:ident} \[%{HTTPDATE:timestamp}\] "%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}" %{NUMBER:status_code} %{NUMBER:bytes} "%{DATA:referrer}" "%{DATA:user_agent}" %{NUMBER:request_time}

# Java 异常堆栈
JAVA_EXCEPTION %{JAVACLASS:exception_class}: %{GREEDYDATA:exception_message}
JAVA_STACKTRACE ^\s+at %{JAVACLASS:class}\.%{JAVAMETHOD:method}\(%{JAVAFILE:file}:%{NUMBER:line}\)

# 应用日志格式
APP_LOG %{TIMESTAMP_ISO8601:timestamp} \[%{DATA:thread}\] %{LOGLEVEL:level}\s+%{JAVACLASS:logger} - %{GREEDYDATA:message}

# API 请求日志
API_REQUEST \[%{DATA:trace_id}\] %{WORD:method} %{URIPATH:path} %{NUMBER:status_code} %{NUMBER:response_time}ms
```

## Filebeat 日志收集

### 基础配置

```yaml
# /etc/filebeat/filebeat.yml

filebeat.inputs:
  # 应用日志收集
  - type: log
    id: application-logs
    enabled: true
    paths:
      - /var/log/application/*.log
      - /var/log/application/**/*.log
    exclude_files: ['\.gz$', '\.zip$']

    # 多行日志处理（Java 堆栈）
    multiline:
      type: pattern
      pattern: '^\d{4}-\d{2}-\d{2}'
      negate: true
      match: after
      max_lines: 500
      timeout: 5s

    # 字段添加
    fields:
      service: my-application
      environment: production
    fields_under_root: true

    # 处理器
    processors:
      - add_host_metadata:
          when.not.contains.tags: forwarded
      - add_docker_metadata: ~
      - add_kubernetes_metadata: ~

    # 文件状态管理
    close_inactive: 5m
    close_removed: true
    clean_removed: true

    # 性能调优
    harvester_buffer_size: 16384
    max_bytes: 10485760

  # 容器日志收集
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

  # Kubernetes 日志收集
  - type: kubernetes
    id: k8s-logs
    enabled: true
    node: ${NODE_NAME}
    hints.enabled: true
    hints.default_config:
      type: container
      paths:
        - /var/log/containers/*${data.kubernetes.container.id}.log

# 模块配置
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

# 输出配置
output.elasticsearch:
  hosts: ["https://es1:9200", "https://es2:9200", "https://es3:9200"]
  username: "filebeat_writer"
  password: "${ES_PASSWORD}"
  ssl:
    enabled: true
    certificate_authorities: ["/etc/filebeat/certs/ca.crt"]

  # 索引配置
  index: "filebeat-%{[agent.version]}-%{+yyyy.MM.dd}"

  # 性能调优
  bulk_max_size: 2048
  worker: 2
  compression_level: 5

# 或输出到 Logstash
output.logstash:
  hosts: ["logstash1:5044", "logstash2:5044"]
  loadbalance: true
  ssl:
    enabled: true
    certificate_authorities: ["/etc/filebeat/certs/ca.crt"]
    certificate: "/etc/filebeat/certs/filebeat.crt"
    key: "/etc/filebeat/certs/filebeat.key"

# 队列配置
queue.mem:
  events: 4096
  flush.min_events: 2048
  flush.timeout: 1s

# 监控
monitoring:
  enabled: true
  elasticsearch:
    hosts: ["https://es-monitoring:9200"]
    username: "beats_system"
    password: "${BEATS_PASSWORD}"

# 日志配置
logging:
  level: info
  to_files: true
  files:
    path: /var/log/filebeat
    name: filebeat
    keepfiles: 7
    permissions: 0640
```

### Kubernetes DaemonSet 部署

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

## Kibana 可视化

### 仪表板配置

```json
// 保存的搜索示例
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

### 可视化组件

```json
// 服务错误率趋势图
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

### Kibana 告警规则

```yaml
# Kibana Alert Rule (通过 API 创建)
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

## 日志格式标准化

### 结构化日志规范

```json
// 标准日志格式
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

### Java 日志配置 (Logback)

```xml
<!-- logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- JSON 格式输出 -->
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

    <!-- 文件输出（滚动） -->
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

    <!-- 异步输出 -->
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

### Python 日志配置

```python
# logging_config.py
import logging
import json
import sys
from datetime import datetime
from pythonjsonlogger import jsonlogger

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)

        # 标准字段
        log_record['@timestamp'] = datetime.utcnow().isoformat() + 'Z'
        log_record['level'] = record.levelname
        log_record['logger'] = record.name

        # 服务信息
        log_record['service'] = {
            'name': os.getenv('SERVICE_NAME', 'unknown'),
            'version': os.getenv('SERVICE_VERSION', 'unknown'),
            'environment': os.getenv('ENVIRONMENT', 'development')
        }

        # 追踪信息
        if hasattr(record, 'trace_id'):
            log_record['trace'] = {
                'trace_id': record.trace_id,
                'span_id': getattr(record, 'span_id', None)
            }

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # JSON 格式处理器
    handler = logging.StreamHandler(sys.stdout)
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    return logger

# 使用示例
logger = setup_logging()

class TraceAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        extra = kwargs.get('extra', {})
        extra['trace_id'] = self.extra.get('trace_id')
        extra['span_id'] = self.extra.get('span_id')
        kwargs['extra'] = extra
        return msg, kwargs

# 带追踪的日志
trace_logger = TraceAdapter(logger, {'trace_id': 'abc123', 'span_id': 'span456'})
trace_logger.info('Processing request', extra={'user_id': 'user123'})
```

## 集群部署与运维

### Elasticsearch 集群配置

```yaml
# elasticsearch.yml - 主节点配置
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

# 路径配置
path.data: /var/lib/elasticsearch
path.logs: /var/log/elasticsearch

# 内存锁定
bootstrap.memory_lock: true

# 网络优化
http.max_content_length: 200mb
http.compression: true

# 集群恢复设置
gateway.recover_after_nodes: 2
gateway.expected_nodes: 3
gateway.recover_after_time: 5m

# 分片分配
cluster.routing.allocation.node_concurrent_recoveries: 4
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
cluster.routing.allocation.disk.watermark.flood_stage: 95%
```

```yaml
# elasticsearch.yml - 数据节点配置
cluster.name: production-elk
node.name: es-data-1
node.roles: [data, ingest]

# 数据节点特定配置
indices.memory.index_buffer_size: 30%
indices.queries.cache.size: 20%
indices.fielddata.cache.size: 30%

thread_pool:
  write:
    queue_size: 1000
  search:
    queue_size: 1000
```

### 集群健康检查脚本

```bash
#!/bin/bash
# cluster-health-check.sh

ES_HOST="localhost:9200"
ES_USER="elastic"
ES_PASS="${ELASTIC_PASSWORD}"

# 集群健康状态
echo "=== Cluster Health ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cluster/health?pretty"

# 节点状态
echo -e "\n=== Node Stats ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/nodes?v&h=name,ip,heap.percent,ram.percent,cpu,load_1m,node.role,master"

# 索引状态
echo -e "\n=== Index Health ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/indices?v&h=health,status,index,pri,rep,docs.count,store.size&s=store.size:desc" | head -20

# 分片分配
echo -e "\n=== Shard Allocation ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cat/shards?v&h=index,shard,prirep,state,node&s=state" | grep -E "(UNASSIGNED|RELOCATING|INITIALIZING)"

# 待处理任务
echo -e "\n=== Pending Tasks ==="
curl -s -u ${ES_USER}:${ES_PASS} "${ES_HOST}/_cluster/pending_tasks?pretty"
```

### Ansible 自动化部署

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

## 性能调优

### Elasticsearch 性能优化

```json
// 索引性能优化设置
PUT /logs-optimized/_settings
{
  "settings": {
    "index": {
      // 刷新间隔（写入优化）
      "refresh_interval": "30s",

      // 事务日志
      "translog": {
        "durability": "async",
        "sync_interval": "5s",
        "flush_threshold_size": "1gb"
      },

      // 合并策略
      "merge": {
        "scheduler": {
          "max_thread_count": 1
        },
        "policy": {
          "max_merged_segment": "5gb",
          "segments_per_tier": 10
        }
      },

      // 写入优化
      "number_of_replicas": 0,  // 批量导入时

      // 查询缓存
      "queries.cache.enabled": true
    }
  }
}

// 批量导入后恢复
PUT /logs-optimized/_settings
{
  "settings": {
    "index": {
      "refresh_interval": "1s",
      "number_of_replicas": 1
    }
  }
}

// 强制合并（只读索引）
POST /logs-2024.01.01/_forcemerge?max_num_segments=1
```

### JVM 调优

```bash
# /etc/elasticsearch/jvm.options.d/custom.options

# 堆大小（建议不超过物理内存的50%，不超过32GB）
-Xms16g
-Xmx16g

# GC 配置 (G1GC - 推荐 ES 8.x)
-XX:+UseG1GC
-XX:G1HeapRegionSize=32m
-XX:MaxGCPauseMillis=200
-XX:InitiatingHeapOccupancyPercent=75

# GC 日志
-Xlog:gc*,gc+age=trace,safepoint:file=/var/log/elasticsearch/gc.log:utctime,pid,tags:filecount=32,filesize=64m

# 禁用显式 GC
-XX:+DisableExplicitGC

# 堆外内存
-XX:MaxDirectMemorySize=4g

# 错误处理
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/lib/elasticsearch
-XX:ErrorFile=/var/log/elasticsearch/hs_err_pid%p.log
```

### 查询性能优化

```json
// 使用 filter 上下文（可缓存）
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

// 分页优化（使用 search_after）
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

// 使用 Point in Time (PIT) 进行深度分页
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

### Logstash 性能优化

```yaml
# /etc/logstash/logstash.yml

# 管道配置
pipeline.workers: 8                    # CPU 核心数
pipeline.batch.size: 1000             # 批量大小
pipeline.batch.delay: 50              # 批量延迟(ms)

# 队列配置（持久化队列）
queue.type: persisted
queue.max_bytes: 4gb
queue.checkpoint.writes: 1024

# 性能监控
monitoring.enabled: true
monitoring.elasticsearch.hosts: ["http://es-monitoring:9200"]
```

```ruby
# 管道性能优化
output {
  elasticsearch {
    hosts => ["es1:9200", "es2:9200", "es3:9200"]

    # 批量写入优化
    bulk_max_size => 2000
    flush_size => 2000
    idle_flush_time => 5

    # 重试配置
    retry_max_interval => 64
    retry_initial_interval => 2

    # HTTP 优化
    http_compression => true
    pool_max => 1000
    pool_max_per_route => 100
  }
}
```

## 安全配置

### Elasticsearch 安全设置

```yaml
# elasticsearch.yml 安全配置
xpack.security.enabled: true
xpack.security.enrollment.enabled: true

# 传输层加密
xpack.security.transport.ssl:
  enabled: true
  verification_mode: certificate
  keystore.path: /etc/elasticsearch/certs/transport.p12
  truststore.path: /etc/elasticsearch/certs/transport.p12

# HTTP 层加密
xpack.security.http.ssl:
  enabled: true
  keystore.path: /etc/elasticsearch/certs/http.p12

# 审计日志
xpack.security.audit.enabled: true
xpack.security.audit.logfile.events.include:
  - access_granted
  - access_denied
  - authentication_failed
  - connection_denied
```

### 角色和用户管理

```json
// 创建只读角色
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

// 创建写入角色
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

// 创建用户
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

// API Key 创建
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

### TLS 证书生成

```bash
#!/bin/bash
# generate-certs.sh

# 创建 CA
elasticsearch-certutil ca --out /etc/elasticsearch/certs/elastic-stack-ca.p12 --pass ""

# 生成节点证书
elasticsearch-certutil cert \
  --ca /etc/elasticsearch/certs/elastic-stack-ca.p12 \
  --ca-pass "" \
  --out /etc/elasticsearch/certs/elastic-certificates.p12 \
  --pass "" \
  --dns es-master-1,es-master-2,es-master-3,es-data-1,es-data-2 \
  --ip 10.0.1.1,10.0.1.2,10.0.1.3,10.0.2.1,10.0.2.2

# 生成 HTTP 证书
elasticsearch-certutil http

# 提取 CA 证书（供客户端使用）
openssl pkcs12 -in /etc/elasticsearch/certs/elastic-stack-ca.p12 \
  -out /etc/elasticsearch/certs/ca.crt \
  -clcerts -nokeys -passin pass:

# 设置权限
chmod 640 /etc/elasticsearch/certs/*
chown root:elasticsearch /etc/elasticsearch/certs/*
```

## 面试要点

### 核心概念

**Q: ELK Stack 各组件的作用是什么？**

```
A: ELK Stack 由四个核心组件组成：

1. Elasticsearch
   - 分布式搜索和分析引擎
   - 基于 Lucene 构建
   - 提供 RESTful API
   - 支持实时搜索和聚合分析

2. Logstash
   - 服务端数据处理管道
   - 支持多种输入、过滤和输出插件
   - 数据转换和丰富
   - 可扩展的插件架构

3. Kibana
   - 数据可视化和探索平台
   - 仪表板创建和管理
   - 告警和报告功能
   - 集群管理界面

4. Beats (扩展)
   - 轻量级数据采集器
   - Filebeat: 日志文件收集
   - Metricbeat: 指标收集
   - Packetbeat: 网络数据收集
```

**Q: Elasticsearch 的分片和副本机制是什么？**

```
A: 分片（Shard）和副本（Replica）是 Elasticsearch 分布式架构的核心：

分片：
- 主分片（Primary Shard）：数据的原始分片
- 索引创建时确定，之后不可更改
- 每个分片是独立的 Lucene 索引
- 数据根据路由算法分配到特定分片

副本：
- 主分片的复制
- 提供高可用性和读取扩展
- 可以动态调整数量
- 不与主分片在同一节点

路由公式：
shard = hash(routing) % number_of_primary_shards

最佳实践：
- 分片数 = 节点数 * 1.5~2
- 单个分片大小 10-50GB
- 至少 1 个副本保证高可用
```

### 性能优化

**Q: 如何优化 Elasticsearch 写入性能？**

```
A: 写入优化策略：

1. 索引设置优化
   - 增大 refresh_interval（30s 或更长）
   - 禁用副本（批量导入时）
   - 使用异步 translog

2. 批量操作
   - 使用 Bulk API
   - 合理的批量大小（1000-5000 文档）
   - 控制并发请求数

3. 硬件优化
   - SSD 存储
   - 充足的内存（堆 + 文件系统缓存）
   - 多核 CPU

4. 映射优化
   - 避免动态映射
   - 禁用不需要的 _source
   - 合理使用 keyword 和 text

5. 集群配置
   - 专用主节点
   - 协调节点分担压力
   - 合理的线程池配置
```

**Q: 如何处理 Elasticsearch 集群黄色或红色状态？**

```
A: 集群健康状态处理：

黄色状态（副本未分配）：
1. 检查节点数量是否满足副本需求
2. 检查磁盘空间是否充足
3. 检查分片分配设置

# 查看未分配原因
GET /_cluster/allocation/explain

红色状态（主分片未分配）：
1. 检查节点是否全部在线
2. 检查数据目录是否损坏
3. 尝试手动分配分片

# 重新路由分片
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

预防措施：
- 监控磁盘使用率
- 配置合理的水位线
- 定期检查集群健康
- 实施 ILM 策略
```

### 日志最佳实践

**Q: 结构化日志的最佳实践是什么？**

```
A: 结构化日志最佳实践：

1. 使用统一的日志格式
   {
     "@timestamp": "ISO8601",
     "level": "INFO/WARN/ERROR",
     "service": "服务名",
     "trace_id": "追踪ID",
     "message": "日志消息",
     "context": { "业务上下文" }
   }

2. 日志级别规范
   - DEBUG: 调试信息
   - INFO: 业务流程
   - WARN: 潜在问题
   - ERROR: 错误但可恢复
   - FATAL: 致命错误

3. 上下文信息
   - 追踪 ID（分布式追踪）
   - 用户 ID
   - 请求路径
   - 响应时间

4. 安全考虑
   - 脱敏敏感数据
   - 不记录密码、令牌
   - 合规性要求（GDPR等）

5. 性能考虑
   - 异步日志输出
   - 合理的日志级别
   - 避免在循环中记录
```

### 架构设计

**Q: 如何设计高可用的 ELK 架构？**

```
A: 高可用 ELK 架构设计：

1. Elasticsearch 集群
   - 3 个专用主节点（投票）
   - 多个数据节点（水平扩展）
   - 协调节点（查询负载均衡）
   - 跨可用区部署

2. Logstash 高可用
   - 多实例部署
   - 前置负载均衡器
   - 持久化队列
   - 消息队列缓冲（Kafka）

3. Kibana 高可用
   - 多实例 + 负载均衡
   - 会话持久化
   - CDN 加速

4. 数据采集
   - Filebeat DaemonSet
   - 自动发现配置
   - 断点续传

5. 监控告警
   - 集群健康监控
   - 存储容量告警
   - 性能指标追踪

架构图：
                    ┌─────────────┐
                    │ Load Balancer│
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ Kibana  │    │ Kibana  │    │ Kibana  │
      └────┬────┘    └────┬────┘    └────┬────┘
           └───────────────┼───────────────┘
                           ▼
                    ┌─────────────┐
                    │ Coordinator │
                    └──────┬──────┘
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │ Master  │        │ Master  │        │ Master  │
   │   #1    │        │   #2    │        │   #3    │
   └─────────┘        └─────────┘        └─────────┘
        │                  │                  │
   ┌────┴────┐        ┌────┴────┐        ┌────┴────┐
   │  Data   │        │  Data   │        │  Data   │
   │  Nodes  │        │  Nodes  │        │  Nodes  │
   └─────────┘        └─────────┘        └─────────┘
```

### 常见问题排查

```bash
# 查看集群状态
curl -X GET "localhost:9200/_cluster/health?pretty"

# 查看节点信息
curl -X GET "localhost:9200/_cat/nodes?v"

# 查看索引状态
curl -X GET "localhost:9200/_cat/indices?v&health=red"

# 查看分片分配
curl -X GET "localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason"

# 查看热点线程
curl -X GET "localhost:9200/_nodes/hot_threads"

# 查看慢查询日志
curl -X GET "localhost:9200/_cluster/settings?include_defaults=true" | jq '.defaults.index.search.slowlog'

# 检查 Logstash 管道
curl -X GET "localhost:9600/_node/stats/pipelines?pretty"

# Filebeat 诊断
filebeat test config -c /etc/filebeat/filebeat.yml
filebeat test output -c /etc/filebeat/filebeat.yml
```

## 总结

ELK Stack 是构建企业级日志管理和分析平台的强大工具组合。通过本指南，你应该掌握了：

1. **架构理解**：了解 ELK 各组件的职责和数据流向
2. **部署实践**：能够部署生产级别的 ELK 集群
3. **数据处理**：熟练使用 Logstash 进行数据转换和丰富
4. **查询分析**：掌握 Elasticsearch DSL 查询和聚合
5. **可视化**：能够在 Kibana 中创建有价值的仪表板
6. **运维能力**：具备集群监控、调优和故障排查能力
7. **安全配置**：理解并实施 ELK 安全最佳实践

在实际应用中，建议结合 APM、SIEM 等场景，充分发挥 Elastic Stack 的能力，构建完整的可观测性平台。
