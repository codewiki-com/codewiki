---
title: Elasticsearch 搜索引擎指南
description: 掌握Elasticsearch分布式搜索引擎，构建强大的搜索功能
track: backend
section: databases
difficulty: advanced
tags:
  - Elasticsearch
  - 搜索引擎
  - 全文检索
  - 分布式
status: imported
origin: old/src/content/docs/backend/elasticsearch.zh.md
divergence: 0.271
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 26
  lastUpdated: 2026-01-07
---

Elasticsearch 是当今最流行的分布式搜索和分析引擎，基于 Apache Lucene 构建，提供了强大的全文检索、结构化搜索、数据分析等功能。本文将全面介绍 Elasticsearch 的核心概念、查询语法和实践技巧，帮助开发者构建高性能的搜索系统。

## Elasticsearch 核心概念

### 基础架构

Elasticsearch 采用分布式架构设计，具有高可用性和水平扩展能力。理解其核心概念是掌握 Elasticsearch 的基础。

| 概念 | 说明 | 类比（关系型数据库） |
|-----|------|-------------------|
| Index（索引） | 文档的集合，类似数据库中的表 | Database/Table |
| Document（文档） | 可被索引的基本数据单元，JSON 格式 | Row |
| Field（字段） | 文档中的键值对 | Column |
| Mapping（映射） | 定义文档字段的类型和属性 | Schema |
| Shard（分片） | 索引的物理分区，支持水平扩展 | Partition |
| Replica（副本） | 分片的复制，提供高可用性 | Replica |
| Node（节点） | 运行 Elasticsearch 的服务器实例 | Server |
| Cluster（集群） | 多个节点组成的集合 | Cluster |

### 与传统数据库对比

```
关系型数据库          Elasticsearch
─────────────        ─────────────
Database      →      Index
Table         →      Type（7.x后废弃，一个索引一个类型）
Row           →      Document
Column        →      Field
Schema        →      Mapping
SQL           →      Query DSL
```

### 适用场景

**Elasticsearch 擅长：**
- 全文搜索：商品搜索、文章检索、日志分析
- 实时分析：监控数据、业务指标聚合
- 地理位置搜索：附近的人、门店查询
- 自动补全：搜索建议、拼写纠错

**不适合场景：**
- 高频事务性写入（如订单处理）
- 强一致性要求的金融交易
- 复杂的关联查询
- 作为主数据存储（应配合主库使用）

## 索引（Index）操作

### 创建索引

索引是 Elasticsearch 中存储数据的逻辑容器。创建索引时可以指定分片数、副本数和映射。

```bash
# 创建简单索引
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "1s"
  }
}
```

```bash
# 创建带有完整配置的索引
PUT /articles
{
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 2,
    "analysis": {
      "analyzer": {
        "my_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["lowercase", "my_stopwords"]
        }
      },
      "filter": {
        "my_stopwords": {
          "type": "stop",
          "stopwords": ["的", "是", "在", "了", "和"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "content": {
        "type": "text",
        "analyzer": "my_analyzer"
      },
      "author": {
        "type": "keyword"
      },
      "publish_date": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
      },
      "views": {
        "type": "integer"
      }
    }
  }
}
```

### 索引管理操作

```bash
# 查看索引信息
GET /products

# 查看索引设置
GET /products/_settings

# 查看索引映射
GET /products/_mapping

# 查看索引统计信息
GET /products/_stats

# 检查索引是否存在
HEAD /products

# 关闭索引（节省资源，不可搜索）
POST /products/_close

# 打开索引
POST /products/_open

# 删除索引
DELETE /products

# 删除多个索引
DELETE /products,articles

# 使用通配符删除
DELETE /logs-2024-*
```

### 索引别名

别名是指向一个或多个索引的虚拟名称，方便索引切换和管理。

```bash
# 创建别名
POST /_aliases
{
  "actions": [
    { "add": { "index": "products_v1", "alias": "products" } }
  ]
}

# 切换别名（零停机迁移）
POST /_aliases
{
  "actions": [
    { "remove": { "index": "products_v1", "alias": "products" } },
    { "add": { "index": "products_v2", "alias": "products" } }
  ]
}

# 过滤别名（只暴露部分数据）
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "products",
        "alias": "active_products",
        "filter": { "term": { "status": "active" } }
      }
    }
  ]
}
```

### 索引模板

为匹配特定模式的索引预定义设置和映射。

```bash
# 创建索引模板
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "message": { "type": "text" },
        "service": { "type": "keyword" },
        "trace_id": { "type": "keyword" }
      }
    }
  }
}

# 查看模板
GET /_index_template/logs_template

# 删除模板
DELETE /_index_template/logs_template
```

## 映射（Mapping）详解

映射定义了文档中字段的数据类型和索引方式，是 Elasticsearch 搜索性能的关键。

### 核心数据类型

```bash
PUT /data_types_demo
{
  "mappings": {
    "properties": {
      # 字符串类型
      "title": {
        "type": "text",           # 全文检索，会分词
        "analyzer": "ik_max_word"
      },
      "status": {
        "type": "keyword"         # 精确匹配，不分词
      },

      # 数值类型
      "price": { "type": "double" },
      "quantity": { "type": "integer" },
      "order_id": { "type": "long" },
      "score": { "type": "float" },

      # 日期类型
      "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
      },

      # 布尔类型
      "is_active": { "type": "boolean" },

      # 二进制类型
      "file": { "type": "binary" },

      # 范围类型
      "age_range": { "type": "integer_range" },
      "date_range": { "type": "date_range" },

      # 地理位置类型
      "location": { "type": "geo_point" },
      "area": { "type": "geo_shape" },

      # IP 类型
      "ip_address": { "type": "ip" },

      # 对象和嵌套类型
      "author": {
        "type": "object",
        "properties": {
          "name": { "type": "keyword" },
          "email": { "type": "keyword" }
        }
      },
      "comments": {
        "type": "nested",         # 嵌套类型，保持数组元素独立性
        "properties": {
          "user": { "type": "keyword" },
          "content": { "type": "text" }
        }
      }
    }
  }
}
```

### text vs keyword

理解 text 和 keyword 的区别至关重要：

```bash
# text 类型 - 用于全文搜索
# "Elasticsearch 是一个搜索引擎" 会被分词为：
# ["elasticsearch", "是", "一个", "搜索", "引擎"]

# keyword 类型 - 用于精确匹配、聚合、排序
# "Elasticsearch 是一个搜索引擎" 保持原样

# 同时使用两种类型（多字段）
PUT /products/_mapping
{
  "properties": {
    "name": {
      "type": "text",
      "analyzer": "ik_max_word",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    }
  }
}

# 搜索时使用
# 全文搜索：name
# 精确匹配/聚合：name.keyword
```

### 映射参数详解

```bash
PUT /mapping_params_demo
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "ik_max_word",        # 索引时使用的分词器
        "search_analyzer": "ik_smart",    # 搜索时使用的分词器
        "boost": 2.0,                     # 字段权重
        "index": true,                    # 是否可搜索
        "store": false                    # 是否单独存储
      },
      "description": {
        "type": "text",
        "index": true,
        "norms": false,                   # 禁用评分因子，节省空间
        "index_options": "docs"           # 只索引文档ID
      },
      "code": {
        "type": "keyword",
        "doc_values": true,               # 支持排序和聚合
        "eager_global_ordinals": true     # 预加载全局序号
      },
      "content": {
        "type": "text",
        "term_vector": "with_positions_offsets"  # 词向量，用于高亮
      },
      "tags": {
        "type": "keyword",
        "null_value": "NULL"              # 空值替代
      },
      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      }
    },
    "dynamic": "strict"                   # 严格模式，拒绝未定义字段
  }
}
```

### 动态映射控制

```bash
# dynamic 参数选项：
# true - 自动添加新字段（默认）
# false - 忽略新字段，不索引但保存
# strict - 拒绝包含新字段的文档
# runtime - 新字段作为运行时字段

PUT /dynamic_demo
{
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "name": { "type": "text" },
      "metadata": {
        "type": "object",
        "dynamic": true           # 允许 metadata 下动态添加字段
      }
    }
  }
}

# 动态模板
PUT /dynamic_template_demo
{
  "mappings": {
    "dynamic_templates": [
      {
        "strings_as_keywords": {
          "match_mapping_type": "string",
          "mapping": {
            "type": "keyword"
          }
        }
      },
      {
        "longs_as_integers": {
          "match_mapping_type": "long",
          "mapping": {
            "type": "integer"
          }
        }
      },
      {
        "message_fields": {
          "match": "*_message",
          "mapping": {
            "type": "text",
            "analyzer": "ik_max_word"
          }
        }
      }
    ]
  }
}
```

## 查询 DSL（Domain Specific Language）

Query DSL 是 Elasticsearch 的核心查询语言，提供了丰富的查询和过滤功能。

### 基本查询结构

```bash
GET /products/_search
{
  "query": { ... },           # 查询条件
  "from": 0,                  # 分页起始位置
  "size": 10,                 # 返回数量
  "sort": [ ... ],            # 排序
  "_source": [ ... ],         # 返回字段
  "highlight": { ... },       # 高亮
  "aggs": { ... }             # 聚合
}
```

### 全文搜索查询

```bash
# match 查询 - 标准全文搜索
GET /articles/_search
{
  "query": {
    "match": {
      "content": {
        "query": "Elasticsearch 搜索引擎",
        "operator": "and",            # 默认 or
        "minimum_should_match": "75%"
      }
    }
  }
}

# match_phrase 查询 - 短语匹配
GET /articles/_search
{
  "query": {
    "match_phrase": {
      "content": {
        "query": "分布式搜索",
        "slop": 2                     # 允许词之间有2个其他词
      }
    }
  }
}

# match_phrase_prefix 查询 - 前缀短语匹配（自动补全）
GET /articles/_search
{
  "query": {
    "match_phrase_prefix": {
      "title": {
        "query": "Elastic",
        "max_expansions": 50
      }
    }
  }
}

# multi_match 查询 - 多字段搜索
GET /articles/_search
{
  "query": {
    "multi_match": {
      "query": "Elasticsearch 教程",
      "fields": ["title^3", "content", "summary^2"],   # ^n 表示权重
      "type": "best_fields",          # 或 most_fields, cross_fields
      "tie_breaker": 0.3
    }
  }
}

# query_string 查询 - 支持 Lucene 语法
GET /articles/_search
{
  "query": {
    "query_string": {
      "query": "(Elasticsearch OR Solr) AND 搜索",
      "default_field": "content",
      "default_operator": "AND"
    }
  }
}

# simple_query_string - 更安全的查询字符串
GET /articles/_search
{
  "query": {
    "simple_query_string": {
      "query": "Elasticsearch + 教程 -入门",
      "fields": ["title", "content"],
      "default_operator": "and"
    }
  }
}
```

### 精确查询

```bash
# term 查询 - 精确匹配（不分词）
GET /products/_search
{
  "query": {
    "term": {
      "status": {
        "value": "published",
        "boost": 1.5
      }
    }
  }
}

# terms 查询 - 多值匹配
GET /products/_search
{
  "query": {
    "terms": {
      "category": ["electronics", "computers", "phones"]
    }
  }
}

# range 查询 - 范围查询
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 100,
        "lte": 500,
        "boost": 2.0
      }
    }
  }
}

# 日期范围查询
GET /articles/_search
{
  "query": {
    "range": {
      "publish_date": {
        "gte": "2024-01-01",
        "lt": "2024-02-01",
        "format": "yyyy-MM-dd",
        "time_zone": "+08:00"
      }
    }
  }
}

# 相对日期
GET /logs/_search
{
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-7d/d",            # 7天前的开始
        "lt": "now/d"                 # 今天的开始
      }
    }
  }
}

# exists 查询 - 字段存在
GET /products/_search
{
  "query": {
    "exists": {
      "field": "description"
    }
  }
}

# prefix 查询 - 前缀匹配
GET /products/_search
{
  "query": {
    "prefix": {
      "name.keyword": {
        "value": "iPhone"
      }
    }
  }
}

# wildcard 查询 - 通配符匹配
GET /products/_search
{
  "query": {
    "wildcard": {
      "name.keyword": {
        "value": "iPhone*Pro"
      }
    }
  }
}

# regexp 查询 - 正则表达式
GET /products/_search
{
  "query": {
    "regexp": {
      "sku": {
        "value": "SKU-[0-9]{4}-[A-Z]+"
      }
    }
  }
}

# fuzzy 查询 - 模糊匹配（容错）
GET /products/_search
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "Elasticsaerch",     # 故意拼错
        "fuzziness": "AUTO",
        "prefix_length": 2
      }
    }
  }
}

# ids 查询 - 根据 ID 查询
GET /products/_search
{
  "query": {
    "ids": {
      "values": ["1", "2", "3"]
    }
  }
}
```

### 复合查询

```bash
# bool 查询 - 组合多个查询条件
GET /products/_search
{
  "query": {
    "bool": {
      "must": [                        # 必须匹配，影响评分
        { "match": { "title": "手机" } }
      ],
      "must_not": [                    # 必须不匹配
        { "term": { "status": "deleted" } }
      ],
      "should": [                      # 可选匹配，影响评分
        { "term": { "brand": "Apple" } },
        { "term": { "brand": "Samsung" } }
      ],
      "filter": [                      # 必须匹配，不影响评分（可缓存）
        { "range": { "price": { "gte": 1000, "lte": 5000 } } },
        { "term": { "in_stock": true } }
      ],
      "minimum_should_match": 1        # should 子句最少匹配数
    }
  }
}

# 嵌套 bool 查询
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "bool": {
            "should": [
              { "match": { "title": "iPhone" } },
              { "match": { "title": "iPad" } }
            ]
          }
        }
      ],
      "filter": [
        { "term": { "category": "electronics" } }
      ]
    }
  }
}

# boosting 查询 - 降低特定文档评分
GET /articles/_search
{
  "query": {
    "boosting": {
      "positive": {
        "match": { "content": "Elasticsearch" }
      },
      "negative": {
        "term": { "status": "draft" }
      },
      "negative_boost": 0.5
    }
  }
}

# constant_score 查询 - 固定评分
GET /products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": { "category": "electronics" }
      },
      "boost": 1.2
    }
  }
}

# dis_max 查询 - 分离最大化查询
GET /articles/_search
{
  "query": {
    "dis_max": {
      "queries": [
        { "match": { "title": "Elasticsearch" } },
        { "match": { "content": "Elasticsearch" } }
      ],
      "tie_breaker": 0.7
    }
  }
}

# function_score 查询 - 自定义评分
GET /products/_search
{
  "query": {
    "function_score": {
      "query": { "match": { "title": "手机" } },
      "functions": [
        {
          "filter": { "term": { "brand": "Apple" } },
          "weight": 2
        },
        {
          "field_value_factor": {
            "field": "sales",
            "factor": 1.2,
            "modifier": "sqrt",
            "missing": 1
          }
        },
        {
          "gauss": {
            "publish_date": {
              "origin": "now",
              "scale": "30d",
              "offset": "7d",
              "decay": 0.5
            }
          }
        }
      ],
      "score_mode": "multiply",
      "boost_mode": "multiply"
    }
  }
}
```

### 嵌套查询和父子查询

```bash
# nested 查询 - 查询嵌套对象
GET /products/_search
{
  "query": {
    "nested": {
      "path": "comments",
      "query": {
        "bool": {
          "must": [
            { "match": { "comments.content": "很好" } },
            { "range": { "comments.rating": { "gte": 4 } } }
          ]
        }
      },
      "inner_hits": {                  # 返回匹配的嵌套对象
        "size": 3,
        "highlight": {
          "fields": { "comments.content": {} }
        }
      }
    }
  }
}

# has_child 查询 - 根据子文档查询父文档
GET /departments/_search
{
  "query": {
    "has_child": {
      "type": "employee",
      "query": {
        "range": { "salary": { "gte": 50000 } }
      },
      "min_children": 2,
      "max_children": 10,
      "inner_hits": {}
    }
  }
}

# has_parent 查询 - 根据父文档查询子文档
GET /employees/_search
{
  "query": {
    "has_parent": {
      "parent_type": "department",
      "query": {
        "term": { "name": "Engineering" }
      }
    }
  }
}
```

### 地理位置查询

```bash
# geo_distance 查询 - 距离查询
GET /stores/_search
{
  "query": {
    "geo_distance": {
      "distance": "5km",
      "location": {
        "lat": 31.2304,
        "lon": 121.4737
      }
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": {
          "lat": 31.2304,
          "lon": 121.4737
        },
        "order": "asc",
        "unit": "km"
      }
    }
  ]
}

# geo_bounding_box 查询 - 矩形区域
GET /stores/_search
{
  "query": {
    "geo_bounding_box": {
      "location": {
        "top_left": { "lat": 31.5, "lon": 121.0 },
        "bottom_right": { "lat": 31.0, "lon": 122.0 }
      }
    }
  }
}

# geo_polygon 查询 - 多边形区域
GET /stores/_search
{
  "query": {
    "geo_polygon": {
      "location": {
        "points": [
          { "lat": 31.2, "lon": 121.4 },
          { "lat": 31.3, "lon": 121.5 },
          { "lat": 31.1, "lon": 121.6 }
        ]
      }
    }
  }
}
```

## 聚合（Aggregations）分析

聚合是 Elasticsearch 强大的数据分析功能，支持实时统计和分析。

### 指标聚合

```bash
# 基本统计
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "total_amount": { "sum": { "field": "amount" } },
    "avg_amount": { "avg": { "field": "amount" } },
    "max_amount": { "max": { "field": "amount" } },
    "min_amount": { "min": { "field": "amount" } },
    "order_count": { "value_count": { "field": "order_id" } },
    "unique_customers": { "cardinality": { "field": "customer_id" } }
  }
}

# stats 聚合 - 综合统计
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "amount_stats": {
      "stats": { "field": "amount" }
    },
    "amount_extended_stats": {
      "extended_stats": { "field": "amount" }
    }
  }
}

# 百分位数聚合
GET /response_times/_search
{
  "size": 0,
  "aggs": {
    "latency_percentiles": {
      "percentiles": {
        "field": "response_time",
        "percents": [50, 90, 95, 99]
      }
    },
    "latency_ranks": {
      "percentile_ranks": {
        "field": "response_time",
        "values": [100, 200, 500]
      }
    }
  }
}

# Top Hits 聚合 - 获取每个桶的文档
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category" },
      "aggs": {
        "top_products": {
          "top_hits": {
            "size": 3,
            "sort": [{ "sales": "desc" }],
            "_source": ["name", "price", "sales"]
          }
        }
      }
    }
  }
}
```

### 桶聚合

```bash
# terms 聚合 - 按字段值分桶
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "by_status": {
      "terms": {
        "field": "status",
        "size": 10,
        "order": { "_count": "desc" }
      }
    },
    "by_category": {
      "terms": {
        "field": "category",
        "size": 20,
        "min_doc_count": 10,
        "missing": "未分类"
      },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } }
      }
    }
  }
}

# range 聚合 - 自定义范围分桶
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "key": "便宜", "to": 100 },
          { "key": "中等", "from": 100, "to": 500 },
          { "key": "昂贵", "from": 500 }
        ]
      }
    }
  }
}

# date_range 聚合
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "order_periods": {
      "date_range": {
        "field": "order_date",
        "format": "yyyy-MM-dd",
        "ranges": [
          { "key": "本周", "from": "now/w", "to": "now" },
          { "key": "本月", "from": "now/M", "to": "now" },
          { "key": "今年", "from": "now/y", "to": "now" }
        ]
      }
    }
  }
}

# histogram 聚合 - 固定间隔直方图
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_histogram": {
      "histogram": {
        "field": "price",
        "interval": 100,
        "min_doc_count": 0,
        "extended_bounds": {
          "min": 0,
          "max": 1000
        }
      }
    }
  }
}

# date_histogram 聚合 - 时间直方图
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "orders_over_time": {
      "date_histogram": {
        "field": "order_date",
        "calendar_interval": "month",
        "format": "yyyy-MM",
        "min_doc_count": 0,
        "time_zone": "+08:00"
      },
      "aggs": {
        "total_amount": { "sum": { "field": "amount" } },
        "avg_amount": { "avg": { "field": "amount" } }
      }
    }
  }
}

# auto_date_histogram 聚合 - 自动时间间隔
GET /logs/_search
{
  "size": 0,
  "aggs": {
    "logs_over_time": {
      "auto_date_histogram": {
        "field": "@timestamp",
        "buckets": 20
      }
    }
  }
}

# filter 聚合 - 单个过滤桶
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "premium_orders": {
      "filter": { "range": { "amount": { "gte": 1000 } } },
      "aggs": {
        "avg_amount": { "avg": { "field": "amount" } }
      }
    }
  }
}

# filters 聚合 - 多个过滤桶
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "order_types": {
      "filters": {
        "filters": {
          "small": { "range": { "amount": { "lt": 100 } } },
          "medium": { "range": { "amount": { "gte": 100, "lt": 500 } } },
          "large": { "range": { "amount": { "gte": 500 } } }
        }
      },
      "aggs": {
        "total": { "sum": { "field": "amount" } }
      }
    }
  }
}

# nested 聚合 - 嵌套对象聚合
GET /products/_search
{
  "size": 0,
  "aggs": {
    "comments_agg": {
      "nested": { "path": "comments" },
      "aggs": {
        "avg_rating": { "avg": { "field": "comments.rating" } },
        "by_author": {
          "terms": { "field": "comments.author" }
        }
      }
    }
  }
}

# composite 聚合 - 分页聚合
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "my_buckets": {
      "composite": {
        "size": 100,
        "sources": [
          { "category": { "terms": { "field": "category" } } },
          { "brand": { "terms": { "field": "brand" } } }
        ],
        "after": { "category": "electronics", "brand": "Apple" }
      },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } }
      }
    }
  }
}
```

### 管道聚合

```bash
# 基于其他聚合结果进行二次计算

GET /orders/_search
{
  "size": 0,
  "aggs": {
    "sales_per_month": {
      "date_histogram": {
        "field": "order_date",
        "calendar_interval": "month"
      },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } }
      }
    },
    "avg_monthly_sales": {
      "avg_bucket": {
        "buckets_path": "sales_per_month>total_sales"
      }
    },
    "max_monthly_sales": {
      "max_bucket": {
        "buckets_path": "sales_per_month>total_sales"
      }
    },
    "sales_derivative": {
      "derivative": {
        "buckets_path": "sales_per_month>total_sales"
      }
    },
    "cumulative_sales": {
      "cumulative_sum": {
        "buckets_path": "sales_per_month>total_sales"
      }
    },
    "moving_avg_sales": {
      "moving_fn": {
        "buckets_path": "sales_per_month>total_sales",
        "window": 3,
        "script": "MovingFunctions.unweightedAvg(values)"
      }
    }
  }
}

# bucket_script - 基于多个指标计算
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category" },
      "aggs": {
        "total_sales": { "sum": { "field": "sales_amount" } },
        "total_cost": { "sum": { "field": "cost" } },
        "profit_margin": {
          "bucket_script": {
            "buckets_path": {
              "sales": "total_sales",
              "cost": "total_cost"
            },
            "script": "(params.sales - params.cost) / params.sales * 100"
          }
        }
      }
    }
  }
}

# bucket_selector - 过滤桶
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category" },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } },
        "filter_high_sales": {
          "bucket_selector": {
            "buckets_path": { "sales": "total_sales" },
            "script": "params.sales > 10000"
          }
        }
      }
    }
  }
}

# bucket_sort - 排序桶
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category", "size": 100 },
      "aggs": {
        "total_sales": { "sum": { "field": "amount" } },
        "sort_by_sales": {
          "bucket_sort": {
            "sort": [{ "total_sales": { "order": "desc" } }],
            "size": 10
          }
        }
      }
    }
  }
}
```

## 分词器（Analyzer）

分词器是全文搜索的核心，决定了文本如何被切分和索引。

### 分词器组成

```
分词器 (Analyzer) = 字符过滤器 + 分词器 + 词元过滤器
                   Character Filters + Tokenizer + Token Filters
```

### 内置分词器

```bash
# 测试分词器效果
POST /_analyze
{
  "analyzer": "standard",
  "text": "Hello World! Elasticsearch is awesome."
}

# standard 分词器（默认）
# 结果: ["hello", "world", "elasticsearch", "is", "awesome"]

# simple 分词器 - 按非字母分割
POST /_analyze
{
  "analyzer": "simple",
  "text": "Hello World! 123"
}
# 结果: ["hello", "world"]

# whitespace 分词器 - 按空白分割
POST /_analyze
{
  "analyzer": "whitespace",
  "text": "Hello World!"
}
# 结果: ["Hello", "World!"]

# keyword 分词器 - 不分词
POST /_analyze
{
  "analyzer": "keyword",
  "text": "Hello World"
}
# 结果: ["Hello World"]

# pattern 分词器 - 正则表达式分割
POST /_analyze
{
  "tokenizer": "pattern",
  "text": "Hello,World;Elasticsearch"
}
# 结果: ["Hello", "World", "Elasticsearch"]

# 中文分词 - 需要安装插件
# IK 分词器
POST /_analyze
{
  "analyzer": "ik_smart",
  "text": "中华人民共和国国歌"
}
# 结果: ["中华人民共和国", "国歌"]

POST /_analyze
{
  "analyzer": "ik_max_word",
  "text": "中华人民共和国国歌"
}
# 结果: ["中华人民共和国", "中华人民", "中华", "华人", "人民共和国", "人民", "共和国", "共和", "国歌"]
```

### 自定义分词器

```bash
PUT /custom_analyzer_demo
{
  "settings": {
    "analysis": {
      "char_filter": {
        "my_char_filter": {
          "type": "mapping",
          "mappings": [
            "& => and",
            "| => or"
          ]
        },
        "html_strip_filter": {
          "type": "html_strip"
        }
      },
      "tokenizer": {
        "my_tokenizer": {
          "type": "pattern",
          "pattern": "[\\s,;.!?]+"
        }
      },
      "filter": {
        "my_stopwords": {
          "type": "stop",
          "stopwords": ["的", "是", "在", "了", "和", "a", "an", "the"]
        },
        "my_stemmer": {
          "type": "stemmer",
          "language": "english"
        },
        "my_synonym": {
          "type": "synonym",
          "synonyms": [
            "ES, Elasticsearch",
            "搜索, 检索, search"
          ]
        },
        "my_length": {
          "type": "length",
          "min": 2,
          "max": 50
        }
      },
      "analyzer": {
        "my_custom_analyzer": {
          "type": "custom",
          "char_filter": ["my_char_filter", "html_strip_filter"],
          "tokenizer": "my_tokenizer",
          "filter": ["lowercase", "my_stopwords", "my_stemmer"]
        },
        "my_chinese_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["my_stopwords", "my_synonym"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "my_custom_analyzer"
      },
      "content": {
        "type": "text",
        "analyzer": "my_chinese_analyzer",
        "search_analyzer": "ik_smart"
      }
    }
  }
}
```

### 常用分词器插件

```bash
# IK 分词器安装（中文分词）
./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v8.x.x/elasticsearch-analysis-ik-8.x.x.zip

# IK 分词器配置词典
# config/analysis-ik/IKAnalyzer.cfg.xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
    <entry key="ext_dict">custom/custom.dic</entry>
    <entry key="ext_stopwords">custom/stopwords.dic</entry>
    <entry key="remote_ext_dict">http://example.com/custom.dic</entry>
</properties>

# 拼音分词器
./bin/elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-pinyin/releases/download/v8.x.x/elasticsearch-analysis-pinyin-8.x.x.zip

# 拼音分词器配置
PUT /pinyin_demo
{
  "settings": {
    "analysis": {
      "analyzer": {
        "pinyin_analyzer": {
          "tokenizer": "ik_max_word",
          "filter": ["pinyin_filter", "lowercase"]
        }
      },
      "filter": {
        "pinyin_filter": {
          "type": "pinyin",
          "keep_full_pinyin": true,
          "keep_joined_full_pinyin": true,
          "keep_original": true,
          "limit_first_letter_length": 16,
          "remove_duplicated_term": true
        }
      }
    }
  }
}

# 繁简转换
PUT /simplified_demo
{
  "settings": {
    "analysis": {
      "analyzer": {
        "simplified_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["stconvert"]
        }
      },
      "filter": {
        "stconvert": {
          "type": "stconvert",
          "delimiter": ",",
          "convert_type": "t2s"
        }
      }
    }
  }
}
```

## 集群管理

### 集群健康检查

```bash
# 集群健康状态
GET /_cluster/health
{
  "cluster_name": "my-cluster",
  "status": "green",                    # green/yellow/red
  "timed_out": false,
  "number_of_nodes": 3,
  "number_of_data_nodes": 3,
  "active_primary_shards": 15,
  "active_shards": 30,
  "relocating_shards": 0,
  "initializing_shards": 0,
  "unassigned_shards": 0,
  "pending_tasks": 0
}

# 状态说明：
# green  - 所有主分片和副本分片都正常
# yellow - 所有主分片正常，部分副本分片未分配
# red    - 部分主分片未分配

# 索引级别健康状态
GET /_cluster/health/products?level=indices

# 分片级别健康状态
GET /_cluster/health/products?level=shards

# 等待集群状态
GET /_cluster/health?wait_for_status=yellow&timeout=50s
```

### 节点信息

```bash
# 查看所有节点
GET /_cat/nodes?v
# ip           heap.percent ram.percent cpu load_1m load_5m load_15m node.role master name
# 45          75  10    0.50    0.45     0.40 cdfhilmrstw *      node-1
# 32          70   8    0.30    0.35     0.38 cdfhilmrstw -      node-2
# 28          65   5    0.20    0.25     0.30 cdfhilmrstw -      node-3

# 节点详细信息
GET /_nodes
GET /_nodes/stats
GET /_nodes/node-1/stats

# 热点线程
GET /_nodes/hot_threads
GET /_nodes/node-1/hot_threads

# 节点角色说明：
# m - master eligible  可选举为主节点
# d - data             数据节点
# i - ingest           预处理节点
# c - coordinating     协调节点（默认所有节点）
# l - ml               机器学习节点
# r - remote_cluster_client  远程集群客户端
```

### 分片管理

```bash
# 查看分片分配
GET /_cat/shards?v
GET /_cat/shards/products?v

# 分片分配解释
GET /_cluster/allocation/explain
{
  "index": "products",
  "shard": 0,
  "primary": true
}

# 手动移动分片
POST /_cluster/reroute
{
  "commands": [
    {
      "move": {
        "index": "products",
        "shard": 0,
        "from_node": "node-1",
        "to_node": "node-2"
      }
    }
  ]
}

# 取消分片分配
POST /_cluster/reroute
{
  "commands": [
    {
      "cancel": {
        "index": "products",
        "shard": 0,
        "node": "node-1"
      }
    }
  ]
}

# 分配未分配的分片
POST /_cluster/reroute
{
  "commands": [
    {
      "allocate_replica": {
        "index": "products",
        "shard": 0,
        "node": "node-2"
      }
    }
  ]
}
```

### 集群设置

```bash
# 查看集群设置
GET /_cluster/settings?include_defaults=true

# 临时设置（重启后失效）
PUT /_cluster/settings
{
  "transient": {
    "cluster.routing.allocation.enable": "all",
    "cluster.routing.allocation.node_concurrent_recoveries": 4,
    "indices.recovery.max_bytes_per_sec": "100mb"
  }
}

# 持久设置
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.disk.threshold_enabled": true,
    "cluster.routing.allocation.disk.watermark.low": "85%",
    "cluster.routing.allocation.disk.watermark.high": "90%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
  }
}

# 分片分配过滤
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.exclude._ip": "192.168.1.100"
  }
}
```

### 索引生命周期管理（ILM）

```bash
# 创建 ILM 策略
PUT /_ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "1d",
            "max_docs": 10000000
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
          },
          "allocate": {
            "require": {
              "data": "warm"
            }
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {},
          "set_priority": {
            "priority": 0
          },
          "allocate": {
            "require": {
              "data": "cold"
            }
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

# 将策略应用到索引模板
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "index.lifecycle.name": "logs_policy",
      "index.lifecycle.rollover_alias": "logs"
    }
  }
}

# 创建初始索引
PUT /logs-000001
{
  "aliases": {
    "logs": {
      "is_write_index": true
    }
  }
}

# 查看 ILM 状态
GET /logs-*/_ilm/explain
```

### 快照与恢复

```bash
# 注册仓库
PUT /_snapshot/my_backup
{
  "type": "fs",
  "settings": {
    "location": "/mount/backups/my_backup",
    "compress": true
  }
}

# 创建快照
PUT /_snapshot/my_backup/snapshot_1?wait_for_completion=true
{
  "indices": "products,orders",
  "ignore_unavailable": true,
  "include_global_state": false
}

# 查看快照
GET /_snapshot/my_backup/snapshot_1
GET /_snapshot/my_backup/_all

# 恢复快照
POST /_snapshot/my_backup/snapshot_1/_restore
{
  "indices": "products",
  "ignore_unavailable": true,
  "include_global_state": false,
  "rename_pattern": "(.+)",
  "rename_replacement": "restored_$1",
  "index_settings": {
    "index.number_of_replicas": 0
  }
}

# 删除快照
DELETE /_snapshot/my_backup/snapshot_1
```

## 性能优化

### 索引优化

```bash
# 索引设置优化
PUT /products/_settings
{
  "index": {
    "refresh_interval": "30s",          # 降低刷新频率
    "number_of_replicas": 0,            # 批量导入时关闭副本
    "translog.durability": "async",     # 异步刷盘
    "translog.sync_interval": "30s"
  }
}

# 批量导入完成后恢复
PUT /products/_settings
{
  "index": {
    "refresh_interval": "1s",
    "number_of_replicas": 1,
    "translog.durability": "request"
  }
}

# 强制合并（只读索引）
POST /products/_forcemerge?max_num_segments=1

# 清除缓存
POST /products/_cache/clear

# 刷新索引
POST /products/_refresh

# 冲洗索引
POST /products/_flush
```

### 查询优化

```bash
# 使用 filter 替代 query（可缓存）
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "手机" } }     # 需要评分
      ],
      "filter": [                             # 不需要评分，可缓存
        { "term": { "status": "active" } },
        { "range": { "price": { "gte": 1000 } } }
      ]
    }
  }
}

# 限制返回字段
GET /products/_search
{
  "_source": ["title", "price", "category"],
  "query": { "match_all": {} }
}

# 使用 source filtering
GET /products/_search
{
  "_source": {
    "includes": ["title", "price"],
    "excludes": ["description"]
  },
  "query": { "match_all": {} }
}

# 使用 stored_fields（需要字段设置 store: true）
GET /products/_search
{
  "stored_fields": ["title", "price"],
  "query": { "match_all": {} }
}

# 分页优化 - 使用 search_after 替代 from/size
GET /products/_search
{
  "size": 10,
  "query": { "match_all": {} },
  "sort": [
    { "created_at": "desc" },
    { "_id": "asc" }
  ],
  "search_after": ["2024-01-15T10:30:00", "abc123"]
}

# 使用 scroll API 进行大量数据导出
POST /products/_search?scroll=5m
{
  "size": 1000,
  "query": { "match_all": {} }
}

POST /_search/scroll
{
  "scroll": "5m",
  "scroll_id": "DXF1ZXJ5QW5kRmV0Y2gB..."
}

# 使用路由优化查询
PUT /orders/_doc/1?routing=customer_123
{
  "customer_id": "customer_123",
  "order_id": "1",
  "amount": 199.99
}

GET /orders/_search?routing=customer_123
{
  "query": {
    "term": { "customer_id": "customer_123" }
  }
}
```

### 映射优化

```bash
PUT /optimized_index
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "norms": false,              # 不需要评分时禁用
        "index_options": "freqs"     # 减少索引数据
      },
      "status": {
        "type": "keyword",
        "doc_values": true,          # 需要排序/聚合
        "eager_global_ordinals": true # 频繁聚合时预加载
      },
      "description": {
        "type": "text",
        "index": false               # 不需要搜索时禁用索引
      },
      "internal_id": {
        "type": "keyword",
        "doc_values": false,         # 不需要排序/聚合时禁用
        "index": true
      }
    }
  }
}
```

## 实战示例

### 电商搜索系统

```bash
# 商品索引设计
PUT /products
{
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["lowercase", "product_synonym"]
        }
      },
      "filter": {
        "product_synonym": {
          "type": "synonym",
          "synonyms": [
            "手机,手机,智能手机,移动电话",
            "电脑,笔记本,laptop,notebook"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "product_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "ik_max_word"
      },
      "category": {
        "type": "keyword"
      },
      "brand": {
        "type": "keyword"
      },
      "price": {
        "type": "double"
      },
      "sales": {
        "type": "integer"
      },
      "rating": {
        "type": "float"
      },
      "tags": {
        "type": "keyword"
      },
      "specs": {
        "type": "nested",
        "properties": {
          "name": { "type": "keyword" },
          "value": { "type": "keyword" }
        }
      },
      "created_at": {
        "type": "date"
      },
      "location": {
        "type": "geo_point"
      }
    }
  }
}

# 复杂商品搜索
GET /products/_search
{
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [
            {
              "multi_match": {
                "query": "苹果手机",
                "fields": ["title^3", "description", "brand^2"],
                "type": "best_fields"
              }
            }
          ],
          "filter": [
            { "term": { "category": "手机" } },
            { "range": { "price": { "gte": 3000, "lte": 8000 } } },
            {
              "nested": {
                "path": "specs",
                "query": {
                  "bool": {
                    "must": [
                      { "term": { "specs.name": "内存" } },
                      { "term": { "specs.value": "8GB" } }
                    ]
                  }
                }
              }
            }
          ]
        }
      },
      "functions": [
        {
          "field_value_factor": {
            "field": "sales",
            "factor": 1.2,
            "modifier": "log1p"
          }
        },
        {
          "field_value_factor": {
            "field": "rating",
            "factor": 1.5,
            "modifier": "sqrt"
          }
        },
        {
          "gauss": {
            "created_at": {
              "origin": "now",
              "scale": "30d",
              "decay": 0.5
            }
          }
        }
      ],
      "score_mode": "sum",
      "boost_mode": "multiply"
    }
  },
  "highlight": {
    "fields": {
      "title": {},
      "description": { "fragment_size": 150 }
    },
    "pre_tags": ["<em>"],
    "post_tags": ["</em>"]
  },
  "aggs": {
    "brands": {
      "terms": { "field": "brand", "size": 20 }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 1000 },
          { "from": 1000, "to": 3000 },
          { "from": 3000, "to": 5000 },
          { "from": 5000 }
        ]
      }
    },
    "avg_rating": {
      "avg": { "field": "rating" }
    }
  },
  "from": 0,
  "size": 20,
  "sort": [
    { "_score": "desc" },
    { "sales": "desc" }
  ]
}
```

### 日志分析系统

```bash
# 日志索引模板
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "index.lifecycle.name": "logs_policy",
      "index.lifecycle.rollover_alias": "logs"
    },
    "mappings": {
      "properties": {
        "@timestamp": { "type": "date" },
        "level": { "type": "keyword" },
        "service": { "type": "keyword" },
        "host": { "type": "keyword" },
        "message": {
          "type": "text",
          "analyzer": "standard"
        },
        "trace_id": { "type": "keyword" },
        "user_id": { "type": "keyword" },
        "response_time": { "type": "integer" },
        "status_code": { "type": "integer" },
        "error": {
          "properties": {
            "type": { "type": "keyword" },
            "message": { "type": "text" },
            "stack_trace": { "type": "text", "index": false }
          }
        }
      }
    }
  }
}

# 日志分析查询
GET /logs-*/_search
{
  "size": 0,
  "query": {
    "bool": {
      "filter": [
        { "range": { "@timestamp": { "gte": "now-24h" } } },
        { "term": { "service": "api-gateway" } }
      ]
    }
  },
  "aggs": {
    "errors_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1h"
      },
      "aggs": {
        "by_level": {
          "terms": { "field": "level" }
        },
        "error_count": {
          "filter": { "term": { "level": "ERROR" } }
        }
      }
    },
    "top_errors": {
      "filter": { "term": { "level": "ERROR" } },
      "aggs": {
        "by_type": {
          "terms": { "field": "error.type", "size": 10 }
        }
      }
    },
    "response_time_percentiles": {
      "percentiles": {
        "field": "response_time",
        "percents": [50, 90, 95, 99]
      }
    },
    "slow_requests": {
      "filter": { "range": { "response_time": { "gte": 1000 } } },
      "aggs": {
        "count": { "value_count": { "field": "trace_id" } }
      }
    }
  }
}
```

## 总结

Elasticsearch 是一个功能强大的分布式搜索和分析引擎，本文介绍了其核心概念和实践技巧：

**核心要点：**
1. **索引设计** - 合理设置分片数、副本数，使用索引模板和别名
2. **映射优化** - 正确选择字段类型，理解 text 与 keyword 的区别
3. **查询 DSL** - 掌握各种查询类型，善用 bool 查询组合条件
4. **聚合分析** - 利用指标聚合、桶聚合和管道聚合进行数据分析
5. **分词器配置** - 针对中文场景配置合适的分词器
6. **集群管理** - 监控集群健康状态，合理配置 ILM 策略

**最佳实践：**
- 使用 filter 替代 query 进行不需要评分的过滤
- 批量导入数据时临时关闭副本和降低刷新频率
- 使用 search_after 替代 from/size 进行深度分页
- 为热点索引配置预加载策略
- 定期进行集群健康检查和性能监控

掌握 Elasticsearch 需要理论与实践相结合，建议在实际项目中不断探索和优化，才能真正发挥其强大的搜索和分析能力。
