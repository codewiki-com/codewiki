---
title: Elasticsearch Search Engine Guide
description: Master Elasticsearch for powerful search functionality
track: backend
section: databases
difficulty: advanced
tags:
  - Elasticsearch
  - Search Engine
  - Full-text Search
  - Distributed
status: imported
origin: old/src/content/docs/backend/elasticsearch.en.md
divergence: 0.271
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 26
  lastUpdated: 2026-01-07
---

Elasticsearch is a distributed, RESTful search and analytics engine built on Apache Lucene. It provides near real-time search capabilities, horizontal scalability, and powerful full-text search features that make it the backbone of many modern search applications. From powering e-commerce product searches to log analytics and enterprise search solutions, Elasticsearch has become the de facto standard for search infrastructure.

## Understanding Elasticsearch Architecture

Before diving into practical usage, it is essential to understand how Elasticsearch organizes and manages data at a fundamental level.

### Core Concepts

Elasticsearch uses several key concepts to organize data:

| Concept | Description | Analogy |
|---------|-------------|---------|
| Cluster | Collection of nodes working together | Database server cluster |
| Node | Single Elasticsearch instance | Individual database server |
| Index | Collection of documents with similar characteristics | Database table |
| Document | Basic unit of information (JSON format) | Table row |
| Shard | Horizontal partition of an index | Table partition |
| Replica | Copy of a shard for redundancy | Read replica |

### Cluster Architecture

A typical production Elasticsearch cluster consists of different node types:

```
                    +------------------+
                    |   Load Balancer  |
                    +--------+---------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
+---------------+    +---------------+    +---------------+
| Coordinating  |    | Coordinating  |    | Coordinating  |
|     Node      |    |     Node      |    |     Node      |
+-------+-------+    +-------+-------+    +-------+-------+
        |                    |                    |
        +--------------------+--------------------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
+---------------+    +---------------+    +---------------+
|    Master     |    |    Master     |    |    Master     |
|     Node      |    |     Node      |    |     Node      |
+---------------+    +---------------+    +---------------+
        |                    |                    |
        +--------------------+--------------------+
                             |
        +--------------------+--------------------+
        |                    |                    |
        v                    v                    v
+---------------+    +---------------+    +---------------+
|     Data      |    |     Data      |    |     Data      |
|     Node      |    |     Node      |    |     Node      |
+---------------+    +---------------+    +---------------+
```

**Node Types Explained:**

- **Master Node**: Manages cluster-wide operations such as creating/deleting indices, tracking nodes, and allocating shards
- **Data Node**: Stores data and performs data-related operations like CRUD, search, and aggregations
- **Coordinating Node**: Routes requests, handles search reduce phase, and distributes bulk indexing
- **Ingest Node**: Pre-processes documents before indexing using ingest pipelines

---

## Indices and Documents

An index in Elasticsearch is a logical namespace that maps to one or more primary shards and can have zero or more replica shards. Each index contains documents that share similar characteristics.

### Creating an Index

```json
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "1s",
    "index.max_result_window": 50000
  }
}
```

### Index Settings Explained

| Setting | Description | Default |
|---------|-------------|---------|
| number_of_shards | Primary shards for the index | 1 |
| number_of_replicas | Replica copies per shard | 1 |
| refresh_interval | How often to refresh index | 1s |
| max_result_window | Maximum from + size for searches | 10000 |

### Indexing Documents

```json
// Index a document with auto-generated ID
POST /products/_doc
{
  "name": "Wireless Bluetooth Headphones",
  "brand": "AudioTech",
  "price": 79.99,
  "category": "Electronics",
  "description": "Premium noise-canceling wireless headphones with 30-hour battery life",
  "tags": ["wireless", "bluetooth", "noise-canceling"],
  "in_stock": true,
  "stock_quantity": 150,
  "rating": 4.5,
  "created_at": "2024-01-15T10:30:00Z"
}

// Index with specific ID
PUT /products/_doc/prod_001
{
  "name": "Mechanical Gaming Keyboard",
  "brand": "GamePro",
  "price": 129.99,
  "category": "Electronics",
  "description": "RGB mechanical keyboard with Cherry MX switches",
  "tags": ["mechanical", "gaming", "rgb"],
  "in_stock": true,
  "stock_quantity": 75,
  "rating": 4.8,
  "created_at": "2024-01-15T11:00:00Z"
}
```

### Bulk Indexing

For large-scale data ingestion, use the Bulk API:

```json
POST /_bulk
{"index": {"_index": "products", "_id": "prod_002"}}
{"name": "USB-C Hub", "brand": "TechConnect", "price": 49.99, "category": "Accessories"}
{"index": {"_index": "products", "_id": "prod_003"}}
{"name": "4K Monitor", "brand": "ViewMax", "price": 399.99, "category": "Electronics"}
{"index": {"_index": "products", "_id": "prod_004"}}
{"name": "Ergonomic Mouse", "brand": "ComfortClick", "price": 59.99, "category": "Accessories"}
```

### Document Operations

```json
// Get a document
GET /products/_doc/prod_001

// Update a document (partial update)
POST /products/_update/prod_001
{
  "doc": {
    "price": 119.99,
    "stock_quantity": 50
  }
}

// Update with script
POST /products/_update/prod_001
{
  "script": {
    "source": "ctx._source.stock_quantity -= params.sold",
    "params": {
      "sold": 5
    }
  }
}

// Delete a document
DELETE /products/_doc/prod_001

// Delete by query
POST /products/_delete_by_query
{
  "query": {
    "term": {
      "in_stock": false
    }
  }
}
```

---

## Mappings

Mappings define how documents and their fields are stored and indexed. They are similar to schema definitions in relational databases but with more flexibility.

### Explicit Mapping Definition

```json
PUT /products
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          },
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer"
          }
        }
      },
      "brand": {
        "type": "keyword"
      },
      "price": {
        "type": "float"
      },
      "category": {
        "type": "keyword"
      },
      "description": {
        "type": "text",
        "analyzer": "english"
      },
      "tags": {
        "type": "keyword"
      },
      "in_stock": {
        "type": "boolean"
      },
      "stock_quantity": {
        "type": "integer"
      },
      "rating": {
        "type": "half_float"
      },
      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "location": {
        "type": "geo_point"
      },
      "specifications": {
        "type": "nested",
        "properties": {
          "key": { "type": "keyword" },
          "value": { "type": "text" }
        }
      }
    }
  }
}
```

### Field Data Types

Elasticsearch supports numerous field types:

**Core Types:**

| Type | Description | Use Case |
|------|-------------|----------|
| text | Analyzed full-text content | Descriptions, articles |
| keyword | Exact value matching | IDs, categories, tags |
| long/integer/short/byte | Numeric integers | Counts, quantities |
| double/float/half_float | Floating-point numbers | Prices, ratings |
| boolean | True/false values | Flags, status |
| date | Date and time values | Timestamps |
| binary | Base64 encoded binary | File attachments |

**Complex Types:**

| Type | Description | Use Case |
|------|-------------|----------|
| object | JSON object | Nested data |
| nested | Array of objects with independence | Related entities |
| geo_point | Latitude/longitude pairs | Location data |
| geo_shape | Complex geometric shapes | Geographic boundaries |
| ip | IPv4 and IPv6 addresses | Network data |
| completion | Auto-complete suggestions | Search-as-you-type |
| dense_vector | Numeric vector | ML embeddings |

### Dynamic Mapping

Elasticsearch can automatically detect and map field types:

```json
PUT /dynamic_example
{
  "mappings": {
    "dynamic": "strict",  // Options: true, false, strict, runtime
    "dynamic_templates": [
      {
        "strings_as_keywords": {
          "match_mapping_type": "string",
          "match": "*_id",
          "mapping": {
            "type": "keyword"
          }
        }
      },
      {
        "strings_as_text": {
          "match_mapping_type": "string",
          "mapping": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
        }
      }
    ]
  }
}
```

### Multi-fields

A single field can be indexed in multiple ways:

```json
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword"
          },
          "english": {
            "type": "text",
            "analyzer": "english"
          },
          "suggest": {
            "type": "completion"
          }
        }
      }
    }
  }
}
```

---

## Query DSL

Query DSL (Domain Specific Language) is Elasticsearch's powerful JSON-based query language. It provides two types of clauses: query context (relevance scoring) and filter context (exact matching without scoring).

### Full-Text Queries

#### Match Query

The most common query for full-text search:

```json
GET /products/_search
{
  "query": {
    "match": {
      "description": {
        "query": "wireless noise canceling headphones",
        "operator": "and",
        "fuzziness": "AUTO",
        "prefix_length": 2
      }
    }
  }
}
```

#### Multi-Match Query

Search across multiple fields:

```json
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "gaming keyboard mechanical",
      "fields": ["name^3", "description^2", "tags"],
      "type": "best_fields",
      "tie_breaker": 0.3,
      "minimum_should_match": "75%"
    }
  }
}
```

**Multi-match Types:**

| Type | Description |
|------|-------------|
| best_fields | Returns highest scoring field match |
| most_fields | Combines scores from all matching fields |
| cross_fields | Treats fields as one big field |
| phrase | Runs phrase query on each field |
| phrase_prefix | Runs phrase prefix on each field |

#### Match Phrase Query

For exact phrase matching:

```json
GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": {
        "query": "noise-canceling wireless",
        "slop": 2
      }
    }
  }
}
```

### Term-Level Queries

These queries find exact values without analyzing the query string:

```json
// Term query (exact match)
GET /products/_search
{
  "query": {
    "term": {
      "brand": {
        "value": "AudioTech",
        "boost": 1.5
      }
    }
  }
}

// Terms query (multiple values)
GET /products/_search
{
  "query": {
    "terms": {
      "category": ["Electronics", "Accessories", "Gaming"]
    }
  }
}

// Range query
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 50,
        "lte": 200,
        "boost": 2.0
      }
    }
  }
}

// Exists query
GET /products/_search
{
  "query": {
    "exists": {
      "field": "rating"
    }
  }
}

// Prefix query
GET /products/_search
{
  "query": {
    "prefix": {
      "name.keyword": {
        "value": "Wire"
      }
    }
  }
}

// Wildcard query
GET /products/_search
{
  "query": {
    "wildcard": {
      "name.keyword": {
        "value": "*Keyboard*"
      }
    }
  }
}

// Regexp query
GET /products/_search
{
  "query": {
    "regexp": {
      "name.keyword": {
        "value": ".*[Kk]eyboard.*",
        "flags": "ALL"
      }
    }
  }
}
```

### Compound Queries

#### Bool Query

Combine multiple queries with boolean logic:

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "description": "wireless" } }
      ],
      "filter": [
        { "term": { "category": "Electronics" } },
        { "range": { "price": { "lte": 100 } } },
        { "term": { "in_stock": true } }
      ],
      "should": [
        { "term": { "brand": "AudioTech" } },
        { "range": { "rating": { "gte": 4.5 } } }
      ],
      "must_not": [
        { "term": { "tags": "refurbished" } }
      ],
      "minimum_should_match": 1,
      "boost": 1.0
    }
  }
}
```

**Bool Clause Types:**

| Clause | Scoring | Description |
|--------|---------|-------------|
| must | Yes | Documents must match, contributes to score |
| filter | No | Documents must match, no scoring (cached) |
| should | Yes | Documents should match, contributes to score |
| must_not | No | Documents must not match, no scoring |

#### Boosting Query

Demote certain documents without excluding them:

```json
GET /products/_search
{
  "query": {
    "boosting": {
      "positive": {
        "match": { "description": "headphones" }
      },
      "negative": {
        "term": { "brand": "BudgetAudio" }
      },
      "negative_boost": 0.5
    }
  }
}
```

#### Function Score Query

Customize scoring with mathematical functions:

```json
GET /products/_search
{
  "query": {
    "function_score": {
      "query": { "match_all": {} },
      "functions": [
        {
          "filter": { "term": { "in_stock": true } },
          "weight": 2
        },
        {
          "field_value_factor": {
            "field": "rating",
            "factor": 1.2,
            "modifier": "sqrt",
            "missing": 1
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
      "score_mode": "multiply",
      "boost_mode": "multiply"
    }
  }
}
```

### Specialized Queries

#### Nested Query

Query nested objects independently:

```json
GET /products/_search
{
  "query": {
    "nested": {
      "path": "specifications",
      "query": {
        "bool": {
          "must": [
            { "term": { "specifications.key": "battery_life" } },
            { "match": { "specifications.value": "30 hours" } }
          ]
        }
      },
      "score_mode": "avg"
    }
  }
}
```

#### Geo Queries

```json
// Geo distance query
GET /stores/_search
{
  "query": {
    "geo_distance": {
      "distance": "10km",
      "location": {
        "lat": 40.7128,
        "lon": -74.0060
      }
    }
  },
  "sort": [
    {
      "_geo_distance": {
        "location": {
          "lat": 40.7128,
          "lon": -74.0060
        },
        "order": "asc",
        "unit": "km"
      }
    }
  ]
}

// Geo bounding box query
GET /stores/_search
{
  "query": {
    "geo_bounding_box": {
      "location": {
        "top_left": {
          "lat": 41.0,
          "lon": -75.0
        },
        "bottom_right": {
          "lat": 40.0,
          "lon": -73.0
        }
      }
    }
  }
}
```

---

## Aggregations

Aggregations provide powerful analytics capabilities, allowing you to summarize, group, and extract statistics from your data.

### Metric Aggregations

Calculate metrics over a set of documents:

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "avg_price": {
      "avg": { "field": "price" }
    },
    "max_price": {
      "max": { "field": "price" }
    },
    "min_price": {
      "min": { "field": "price" }
    },
    "total_stock": {
      "sum": { "field": "stock_quantity" }
    },
    "product_count": {
      "value_count": { "field": "name.keyword" }
    },
    "unique_brands": {
      "cardinality": {
        "field": "brand",
        "precision_threshold": 1000
      }
    },
    "price_stats": {
      "stats": { "field": "price" }
    },
    "price_percentiles": {
      "percentiles": {
        "field": "price",
        "percents": [25, 50, 75, 95, 99]
      }
    }
  }
}
```

### Bucket Aggregations

Group documents into buckets:

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": {
        "field": "category",
        "size": 10,
        "order": { "_count": "desc" }
      },
      "aggs": {
        "avg_price": {
          "avg": { "field": "price" }
        },
        "top_products": {
          "top_hits": {
            "size": 3,
            "_source": ["name", "price"],
            "sort": [{ "rating": "desc" }]
          }
        }
      }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "key": "budget", "to": 50 },
          { "key": "mid-range", "from": 50, "to": 200 },
          { "key": "premium", "from": 200 }
        ]
      }
    },
    "price_histogram": {
      "histogram": {
        "field": "price",
        "interval": 50,
        "min_doc_count": 1
      }
    },
    "sales_over_time": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month",
        "format": "yyyy-MM",
        "min_doc_count": 0,
        "extended_bounds": {
          "min": "2024-01-01",
          "max": "2024-12-31"
        }
      }
    },
    "rating_distribution": {
      "histogram": {
        "field": "rating",
        "interval": 0.5
      }
    }
  }
}
```

### Nested Aggregations

Combine aggregations for multi-dimensional analysis:

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": {
        "field": "category",
        "size": 10
      },
      "aggs": {
        "by_brand": {
          "terms": {
            "field": "brand",
            "size": 5
          },
          "aggs": {
            "avg_price": {
              "avg": { "field": "price" }
            },
            "avg_rating": {
              "avg": { "field": "rating" }
            },
            "in_stock_count": {
              "filter": {
                "term": { "in_stock": true }
              }
            }
          }
        },
        "category_stats": {
          "stats": { "field": "price" }
        }
      }
    }
  }
}
```

### Pipeline Aggregations

Perform calculations on other aggregation results:

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "monthly_sales": {
      "date_histogram": {
        "field": "created_at",
        "calendar_interval": "month"
      },
      "aggs": {
        "total_revenue": {
          "sum": { "field": "price" }
        }
      }
    },
    "cumulative_revenue": {
      "cumulative_sum": {
        "buckets_path": "monthly_sales>total_revenue"
      }
    },
    "revenue_derivative": {
      "derivative": {
        "buckets_path": "monthly_sales>total_revenue"
      }
    },
    "moving_avg_revenue": {
      "moving_avg": {
        "buckets_path": "monthly_sales>total_revenue",
        "window": 3,
        "model": "simple"
      }
    },
    "avg_monthly_revenue": {
      "avg_bucket": {
        "buckets_path": "monthly_sales>total_revenue"
      }
    },
    "max_monthly_revenue": {
      "max_bucket": {
        "buckets_path": "monthly_sales>total_revenue"
      }
    }
  }
}
```

### Filter Aggregations

Apply filters within aggregations:

```json
GET /products/_search
{
  "size": 0,
  "aggs": {
    "all_products": {
      "global": {},
      "aggs": {
        "total_count": {
          "value_count": { "field": "name.keyword" }
        }
      }
    },
    "in_stock_products": {
      "filter": {
        "term": { "in_stock": true }
      },
      "aggs": {
        "avg_price": {
          "avg": { "field": "price" }
        }
      }
    },
    "price_segments": {
      "filters": {
        "filters": {
          "budget": { "range": { "price": { "lt": 50 } } },
          "mid": { "range": { "price": { "gte": 50, "lt": 200 } } },
          "premium": { "range": { "price": { "gte": 200 } } }
        }
      },
      "aggs": {
        "avg_rating": {
          "avg": { "field": "rating" }
        }
      }
    }
  }
}
```

---

## Analyzers

Analyzers are responsible for converting text into tokens during indexing and searching. Understanding analyzers is crucial for effective full-text search.

### Analyzer Components

An analyzer consists of three components:

1. **Character Filters**: Pre-process the text (e.g., HTML stripping)
2. **Tokenizer**: Split text into tokens
3. **Token Filters**: Transform tokens (e.g., lowercase, stemming)

```
Input Text --> Character Filters --> Tokenizer --> Token Filters --> Tokens
```

### Built-in Analyzers

```json
// Test different analyzers
POST /_analyze
{
  "analyzer": "standard",
  "text": "The Quick Brown Fox jumps over the lazy dog's bone!"
}
// Output: [the, quick, brown, fox, jumps, over, the, lazy, dog's, bone]

POST /_analyze
{
  "analyzer": "simple",
  "text": "The Quick Brown Fox jumps over the lazy dog's bone!"
}
// Output: [the, quick, brown, fox, jumps, over, the, lazy, dog, s, bone]

POST /_analyze
{
  "analyzer": "whitespace",
  "text": "The Quick Brown Fox jumps over the lazy dog's bone!"
}
// Output: [The, Quick, Brown, Fox, jumps, over, the, lazy, dog's, bone!]

POST /_analyze
{
  "analyzer": "english",
  "text": "The Quick Brown Foxes are jumping over the lazy dogs"
}
// Output: [quick, brown, fox, jump, over, lazi, dog]
```

### Custom Analyzers

Create custom analyzers for specific needs:

```json
PUT /custom_analysis
{
  "settings": {
    "analysis": {
      "char_filter": {
        "html_strip_filter": {
          "type": "html_strip",
          "escaped_tags": ["b", "i"]
        },
        "special_char_mapping": {
          "type": "mapping",
          "mappings": [
            "& => and",
            "@ => at"
          ]
        }
      },
      "tokenizer": {
        "custom_tokenizer": {
          "type": "pattern",
          "pattern": "[\\W_]+",
          "lowercase": true
        },
        "edge_ngram_tokenizer": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 10,
          "token_chars": ["letter", "digit"]
        }
      },
      "filter": {
        "english_stop": {
          "type": "stop",
          "stopwords": "_english_"
        },
        "english_stemmer": {
          "type": "stemmer",
          "language": "english"
        },
        "synonym_filter": {
          "type": "synonym",
          "synonyms": [
            "quick, fast, speedy",
            "laptop, notebook, portable computer"
          ]
        },
        "autocomplete_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      },
      "analyzer": {
        "english_custom": {
          "type": "custom",
          "char_filter": ["html_strip_filter"],
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "english_stop",
            "english_stemmer"
          ]
        },
        "search_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "synonym_filter",
            "english_stemmer"
          ]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "autocomplete_filter"
          ]
        },
        "autocomplete_search": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "english_custom",
        "search_analyzer": "search_analyzer"
      },
      "name": {
        "type": "text",
        "analyzer": "autocomplete_analyzer",
        "search_analyzer": "autocomplete_search"
      }
    }
  }
}
```

### Language-Specific Analysis

```json
PUT /multilingual_content
{
  "settings": {
    "analysis": {
      "analyzer": {
        "german_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "german_stop",
            "german_normalization",
            "german_stemmer"
          ]
        },
        "french_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "french_elision",
            "french_stop",
            "french_stemmer"
          ]
        }
      },
      "filter": {
        "german_stop": {
          "type": "stop",
          "stopwords": "_german_"
        },
        "german_stemmer": {
          "type": "stemmer",
          "language": "light_german"
        },
        "french_elision": {
          "type": "elision",
          "articles_case": true,
          "articles": ["l", "m", "t", "qu", "n", "s", "j", "d", "c"]
        },
        "french_stop": {
          "type": "stop",
          "stopwords": "_french_"
        },
        "french_stemmer": {
          "type": "stemmer",
          "language": "light_french"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "content_de": {
        "type": "text",
        "analyzer": "german_analyzer"
      },
      "content_fr": {
        "type": "text",
        "analyzer": "french_analyzer"
      },
      "content_en": {
        "type": "text",
        "analyzer": "english"
      }
    }
  }
}
```

---

## Search Features

### Highlighting

Display matching terms in search results:

```json
GET /products/_search
{
  "query": {
    "match": {
      "description": "wireless headphones"
    }
  },
  "highlight": {
    "pre_tags": ["<strong>"],
    "post_tags": ["</strong>"],
    "fields": {
      "description": {
        "fragment_size": 150,
        "number_of_fragments": 3,
        "type": "unified"
      },
      "name": {
        "number_of_fragments": 0
      }
    }
  }
}
```

### Suggesters

Implement search suggestions and autocomplete:

```json
// Term suggester (did you mean)
GET /products/_search
{
  "suggest": {
    "spell_check": {
      "text": "wireles headphons",
      "term": {
        "field": "description",
        "suggest_mode": "popular",
        "min_word_length": 3
      }
    }
  }
}

// Phrase suggester
GET /products/_search
{
  "suggest": {
    "phrase_suggestion": {
      "text": "wireles blutooth headphons",
      "phrase": {
        "field": "description",
        "size": 3,
        "gram_size": 2,
        "direct_generator": [{
          "field": "description",
          "suggest_mode": "always"
        }],
        "highlight": {
          "pre_tag": "<em>",
          "post_tag": "</em>"
        }
      }
    }
  }
}

// Completion suggester (autocomplete)
PUT /products_autocomplete
{
  "mappings": {
    "properties": {
      "suggest": {
        "type": "completion",
        "contexts": [
          {
            "name": "category",
            "type": "category"
          }
        ]
      },
      "name": { "type": "text" }
    }
  }
}

POST /products_autocomplete/_doc
{
  "name": "Wireless Bluetooth Headphones",
  "suggest": {
    "input": ["wireless", "bluetooth", "headphones", "wireless headphones"],
    "weight": 10,
    "contexts": {
      "category": ["Electronics", "Audio"]
    }
  }
}

GET /products_autocomplete/_search
{
  "suggest": {
    "product_suggest": {
      "prefix": "wire",
      "completion": {
        "field": "suggest",
        "size": 5,
        "skip_duplicates": true,
        "fuzzy": {
          "fuzziness": "AUTO"
        },
        "contexts": {
          "category": ["Electronics"]
        }
      }
    }
  }
}
```

### Pagination

Different pagination strategies for different use cases:

```json
// From/Size pagination (simple but limited)
GET /products/_search
{
  "from": 0,
  "size": 10,
  "query": { "match_all": {} }
}

// Search After (for deep pagination)
GET /products/_search
{
  "size": 10,
  "query": { "match_all": {} },
  "sort": [
    { "created_at": "desc" },
    { "_id": "asc" }
  ]
}

// Subsequent request with search_after
GET /products/_search
{
  "size": 10,
  "query": { "match_all": {} },
  "sort": [
    { "created_at": "desc" },
    { "_id": "asc" }
  ],
  "search_after": ["2024-01-15T10:30:00.000Z", "prod_100"]
}

// Point in Time (PIT) for consistent pagination
POST /products/_pit?keep_alive=5m

GET /_search
{
  "size": 10,
  "query": { "match_all": {} },
  "pit": {
    "id": "your_pit_id_here",
    "keep_alive": "5m"
  },
  "sort": [
    { "created_at": "desc" },
    { "_id": "asc" }
  ]
}

// Scroll API (for large exports, deprecated for search)
POST /products/_search?scroll=5m
{
  "size": 1000,
  "query": { "match_all": {} }
}

POST /_search/scroll
{
  "scroll": "5m",
  "scroll_id": "your_scroll_id_here"
}
```

### Search Templates

Reusable search templates:

```json
// Create a search template
PUT /_scripts/product_search_template
{
  "script": {
    "lang": "mustache",
    "source": {
      "query": {
        "bool": {
          "must": [
            {
              "multi_match": {
                "query": "{{query_string}}",
                "fields": ["name^3", "description^2", "tags"]
              }
            }
          ],
          "filter": [
            {{#category}}
            { "term": { "category": "{{category}}" } },
            {{/category}}
            {{#min_price}}
            { "range": { "price": { "gte": {{min_price}} } } },
            {{/min_price}}
            {{#max_price}}
            { "range": { "price": { "lte": {{max_price}} } } },
            {{/max_price}}
            { "term": { "in_stock": true } }
          ]
        }
      },
      "from": "{{from}}{{^from}}0{{/from}}",
      "size": "{{size}}{{^size}}10{{/size}}",
      "sort": [
        { "{{sort_field}}{{^sort_field}}_score{{/sort_field}}": "{{sort_order}}{{^sort_order}}desc{{/sort_order}}" }
      ]
    }
  }
}

// Use the template
GET /products/_search/template
{
  "id": "product_search_template",
  "params": {
    "query_string": "wireless headphones",
    "category": "Electronics",
    "min_price": 50,
    "max_price": 200,
    "from": 0,
    "size": 20,
    "sort_field": "rating",
    "sort_order": "desc"
  }
}
```

---

## Performance Optimization

### Index Settings for Performance

```json
PUT /high_performance_index
{
  "settings": {
    "number_of_shards": 5,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "index": {
      "translog": {
        "durability": "async",
        "sync_interval": "5s",
        "flush_threshold_size": "1gb"
      },
      "merge": {
        "scheduler": {
          "max_thread_count": 1
        }
      },
      "search": {
        "slowlog": {
          "threshold": {
            "query": {
              "warn": "10s",
              "info": "5s",
              "debug": "2s"
            },
            "fetch": {
              "warn": "1s",
              "info": "500ms",
              "debug": "200ms"
            }
          }
        }
      }
    }
  }
}
```

### Query Optimization Tips

1. **Use Filter Context When Possible**

```json
// Good: Filter context (cached, no scoring)
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "status": "active" } },
        { "range": { "date": { "gte": "2024-01-01" } } }
      ]
    }
  }
}

// Less efficient: Query context (scored)
{
  "query": {
    "bool": {
      "must": [
        { "term": { "status": "active" } },
        { "range": { "date": { "gte": "2024-01-01" } } }
      ]
    }
  }
}
```

2. **Limit Fields Retrieved**

```json
{
  "query": { "match_all": {} },
  "_source": ["name", "price", "category"],
  "stored_fields": ["_none_"],
  "docvalue_fields": ["created_at"]
}
```

3. **Profile Slow Queries**

```json
GET /products/_search
{
  "profile": true,
  "query": {
    "match": {
      "description": "wireless headphones"
    }
  }
}
```

### Shard Optimization

```bash
# Check shard sizes
GET /_cat/shards?v&h=index,shard,prirep,state,docs,store,node&s=store:desc

# Force merge for read-only indices
POST /logs-2024.01/_forcemerge?max_num_segments=1

# Shrink an index
POST /logs-2024.01/_shrink/logs-2024.01-shrunk
{
  "settings": {
    "index.number_of_replicas": 1,
    "index.number_of_shards": 1
  }
}
```

### Caching Strategies

```json
// Request cache (aggregation results)
GET /products/_search?request_cache=true
{
  "size": 0,
  "aggs": {
    "by_category": {
      "terms": { "field": "category" }
    }
  }
}

// Query cache settings
PUT /products/_settings
{
  "index.queries.cache.enabled": true
}

// Fielddata cache (for sorting/aggregations on text fields)
PUT /products/_settings
{
  "index.fielddata.cache": "node"
}

// Clear caches
POST /products/_cache/clear
POST /_cache/clear?fielddata=true&query=true&request=true
```

---

## Cluster Operations

### Index Lifecycle Management (ILM)

```json
PUT /_ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_primary_shard_size": "50gb",
            "max_age": "1d",
            "max_docs": 100000000
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
          "allocate": {
            "require": {
              "data": "warm"
            }
          },
          "set_priority": {
            "priority": 50
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "allocate": {
            "require": {
              "data": "cold"
            }
          },
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

// Apply policy to index template
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
```

### Snapshot and Restore

```json
// Register a repository
PUT /_snapshot/backup_repo
{
  "type": "fs",
  "settings": {
    "location": "/mnt/backups/elasticsearch",
    "compress": true
  }
}

// Create a snapshot
PUT /_snapshot/backup_repo/snapshot_2024_01_15?wait_for_completion=true
{
  "indices": "products,orders",
  "ignore_unavailable": true,
  "include_global_state": false
}

// List snapshots
GET /_snapshot/backup_repo/_all

// Restore a snapshot
POST /_snapshot/backup_repo/snapshot_2024_01_15/_restore
{
  "indices": "products",
  "ignore_unavailable": true,
  "include_global_state": false,
  "rename_pattern": "(.+)",
  "rename_replacement": "restored_$1"
}
```

### Cluster Health Monitoring

```bash
# Cluster health
GET /_cluster/health?pretty

# Node statistics
GET /_nodes/stats?pretty

# Index statistics
GET /_stats?pretty

# Pending tasks
GET /_cluster/pending_tasks

# Shard allocation explanation
GET /_cluster/allocation/explain

# Hot threads
GET /_nodes/hot_threads
```

---

## Interview Key Points

### Common Interview Questions

**1. How does Elasticsearch achieve near real-time search?**

Elasticsearch uses a refresh mechanism where new documents are written to an in-memory buffer first, then periodically (default 1 second) flushed to a new segment. This segment becomes searchable immediately. The trade-off is between search latency and indexing performance.

**2. What is the difference between text and keyword field types?**

- **text**: Analyzed and tokenized for full-text search. Supports match queries.
- **keyword**: Stored as-is without analysis. Used for exact matching, sorting, and aggregations.

**3. How do you handle relevance scoring?**

- Use boosting to prioritize certain fields or terms
- Implement function_score for custom scoring logic
- Utilize decay functions for time-based relevance
- Consider BM25 tuning parameters (k1, b)

**4. Explain the difference between filter and query context.**

| Aspect | Query Context | Filter Context |
|--------|---------------|----------------|
| Scoring | Calculates relevance score | No scoring |
| Caching | Not cached | Cached automatically |
| Use Case | Full-text search | Exact matching, ranges |
| Performance | Slower | Faster |

**5. How do you optimize Elasticsearch for write-heavy workloads?**

- Increase refresh_interval or disable it temporarily
- Use bulk API for batch indexing
- Reduce replica count during bulk imports
- Use async translog durability
- Consider dedicated coordinating nodes

**6. What are the considerations for choosing shard count?**

- Target shard size: 10-50 GB
- Avoid too many small shards (overhead)
- Avoid too few large shards (slow queries, recovery)
- Consider future growth
- Formula: Number of shards = Data size / Target shard size

**7. How does Elasticsearch handle distributed search?**

1. Coordinating node receives request
2. Request broadcast to all relevant shards
3. Each shard executes query locally
4. Results gathered at coordinating node
5. Final sorting, aggregation, and pagination
6. Response returned to client

### Performance Optimization Checklist

- [ ] Use appropriate field mappings (keyword vs text)
- [ ] Implement filter context for non-scoring queries
- [ ] Enable query and request caching
- [ ] Set appropriate refresh interval
- [ ] Use bulk API for indexing
- [ ] Implement proper pagination (search_after for deep paging)
- [ ] Monitor and tune JVM heap settings
- [ ] Use doc_values for sorting and aggregations
- [ ] Implement ILM for time-series data
- [ ] Regular index optimization (force merge for read-only)

---

## Further Reading

### Official Resources

- [Elasticsearch Official Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch Definitive Guide](https://www.elastic.co/guide/en/elasticsearch/guide/current/index.html)
- [Elastic Blog](https://www.elastic.co/blog/)
- [Elasticsearch GitHub Repository](https://github.com/elastic/elasticsearch)

### Recommended Books

- *Elasticsearch: The Definitive Guide* by Clinton Gormley and Zachary Tong
- *Relevant Search* by Doug Turnbull and John Berryman
- *Elasticsearch in Action* by Radu Gheorghe

### Related Tools

| Tool | Description |
|------|-------------|
| Kibana | Visualization and management interface |
| Logstash | Data processing pipeline |
| Beats | Lightweight data shippers |
| Elastic APM | Application performance monitoring |
| Elasticsearch-head | Web interface for cluster management |
| Cerebro | Open source Elasticsearch admin tool |

### Advanced Topics to Explore

- Cross-cluster search and replication
- Machine learning integration
- Vector search and semantic search
- Runtime fields
- Data streams
- Searchable snapshots
- Asynchronous search

---

## Summary

Elasticsearch is a powerful distributed search engine that excels at full-text search, log analytics, and real-time data exploration. Key takeaways from this guide:

1. **Architecture Understanding**: Master the concepts of indices, shards, replicas, and node types to design scalable clusters.

2. **Mapping Strategy**: Define explicit mappings with appropriate field types to optimize storage and query performance.

3. **Query Mastery**: Leverage Query DSL effectively by understanding when to use query context versus filter context, and how to combine different query types.

4. **Aggregation Power**: Use aggregations for real-time analytics, from simple metrics to complex multi-dimensional analysis.

5. **Analyzer Expertise**: Customize text analysis for your specific use case, whether it is language-specific search, autocomplete, or synonym handling.

6. **Performance Optimization**: Apply best practices for indexing, querying, and cluster configuration to maintain high performance at scale.

7. **Operational Excellence**: Implement proper monitoring, backup strategies, and index lifecycle management for production deployments.

Elasticsearch continues to evolve with new features for vector search, machine learning, and enhanced observability. Stay updated with the official documentation and community resources to leverage the full potential of this versatile search platform.
