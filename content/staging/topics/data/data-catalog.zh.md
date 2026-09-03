---
title: 数据目录
description: 学习数据目录管理和数据发现
track: data
section: data-engineering
difficulty: intermediate
tags:
  - data catalog
  - data governance
  - metadata
  - data discovery
status: imported
origin: old/src/content/docs/data/data-catalog.zh.md
divergence: 0.222
issues: []
legacy:
  category: Data
  subcategory: Governance
  order: 24
  lastUpdated: 2026-01-07
---

数据目录是现代数据治理的基石，它作为一个集中式清单，使组织能够发现、理解和信任其数据资产。在数据量爆炸式增长、数据源不断增加的时代，实施良好的数据目录可以将混乱的数据环境转变为有组织、可搜索、受治理的存储库。本指南涵盖了从基本概念到使用行业领先工具的实施策略的所有内容。

## 理解数据目录

### 什么是数据目录？

数据目录是一种元数据管理工具，用于创建组织内数据资产的有序清单。它的功能类似于数据的图书馆目录，提供搜索和发现功能、上下文信息和治理控制。

```python
# 数据目录的核心组件
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class AssetType(Enum):
    TABLE = "table"
    VIEW = "view"
    DASHBOARD = "dashboard"
    REPORT = "report"
    DATASET = "dataset"
    PIPELINE = "pipeline"
    ML_MODEL = "ml_model"

class DataClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PII = "pii"

@dataclass
class DataAsset:
    """表示已编目的数据资产"""
    asset_id: str
    name: str
    asset_type: AssetType
    description: str
    owner: str
    steward: Optional[str] = None
    source_system: Optional[str] = None
    schema_name: Optional[str] = None
    database: Optional[str] = None
    classification: DataClassification = DataClassification.INTERNAL
    tags: List[str] = field(default_factory=list)
    business_glossary_terms: List[str] = field(default_factory=list)
    quality_score: Optional[float] = None
    popularity_score: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: Dict = field(default_factory=dict)

@dataclass
class CatalogEntry:
    """包含关系的完整目录条目"""
    asset: DataAsset
    schema_info: Dict
    lineage_upstream: List[str] = field(default_factory=list)
    lineage_downstream: List[str] = field(default_factory=list)
    related_assets: List[str] = field(default_factory=list)
    access_permissions: Dict = field(default_factory=dict)
    usage_statistics: Dict = field(default_factory=dict)
```

### 数据目录的核心功能

```python
class DataCatalogCapabilities:
    """定义现代数据目录的核心功能"""

    CAPABILITIES = {
        'metadata_management': {
            'description': '技术和业务元数据的中央存储库',
            'features': [
                '自动化元数据提取',
                '手动元数据丰富',
                '模式版本控制',
                '自定义元数据属性'
            ]
        },
        'data_discovery': {
            'description': '跨组织搜索和浏览数据资产',
            'features': [
                '全文搜索',
                '分面筛选',
                '智能推荐',
                '数据预览'
            ]
        },
        'data_lineage': {
            'description': '从源头到消费跟踪数据流',
            'features': [
                '列级血缘',
                '影响分析',
                '根因分析',
                '转换跟踪'
            ]
        },
        'business_glossary': {
            'description': '标准化的业务术语和定义',
            'features': [
                '术语定义',
                '同义词和别名',
                '术语关系',
                '资产映射'
            ]
        },
        'data_governance': {
            'description': '策略执行和合规管理',
            'features': [
                '数据分类',
                '访问控制',
                '策略定义',
                '合规跟踪'
            ]
        },
        'collaboration': {
            'description': '围绕数据启用团队沟通',
            'features': [
                '评论和讨论',
                '数据资产评级',
                '使用文档',
                '知识共享'
            ]
        }
    }
```

### 数据目录 vs 数据字典 vs 业务词汇表

```
+------------------+-------------------+-------------------+-------------------+
|     方面         |   数据目录        |   数据字典        |   业务词汇表      |
+------------------+-------------------+-------------------+-------------------+
| 范围             | 企业级           | 数据库/系统        | 组织级            |
|                  | 数据资产         | 特定              | 术语              |
+------------------+-------------------+-------------------+-------------------+
| 内容             | 元数据、血缘、    | 列名、            | 业务术语、        |
|                  | 质量、使用       | 数据类型、        | 定义、            |
|                  |                  | 约束              | 关系              |
+------------------+-------------------+-------------------+-------------------+
| 主要用户         | 数据分析师、      | 开发人员、        | 业务用户、        |
|                  | 科学家、所有人   | DBA               | 分析师            |
+------------------+-------------------+-------------------+-------------------+
| 目的             | 数据发现         | 技术              | 共同              |
|                  | 和治理           | 文档              | 理解              |
+------------------+-------------------+-------------------+-------------------+
| 示例             | "销售数据在       | "customer_id:     | "收入：来自       |
|                  | Snowflake，属于  | INT, NOT NULL,    | 产品销售的        |
|                  | 销售团队"        | FK to customers"  | 总收入"           |
+------------------+-------------------+-------------------+-------------------+
```

## 元数据管理

### 元数据类型

```python
from dataclasses import dataclass
from typing import Dict, List, Any
from enum import Enum

class MetadataCategory(Enum):
    TECHNICAL = "technical"
    BUSINESS = "business"
    OPERATIONAL = "operational"
    SOCIAL = "social"

@dataclass
class TechnicalMetadata:
    """从数据系统提取的技术元数据"""
    database: str
    schema: str
    table_name: str
    columns: List[Dict[str, Any]]
    data_types: Dict[str, str]
    primary_keys: List[str]
    foreign_keys: List[Dict]
    indexes: List[Dict]
    partitioning: Dict
    row_count: int
    size_bytes: int
    created_date: str
    modified_date: str
    storage_location: str
    file_format: str

@dataclass
class BusinessMetadata:
    """业务上下文和含义"""
    business_name: str
    description: str
    business_owner: str
    data_steward: str
    business_domain: str
    business_glossary_terms: List[str]
    use_cases: List[str]
    data_classification: str
    retention_policy: str
    regulatory_requirements: List[str]

@dataclass
class OperationalMetadata:
    """运行时和运维信息"""
    last_refresh_time: str
    refresh_frequency: str
    etl_job_name: str
    data_quality_score: float
    data_freshness: str
    sla_requirements: Dict
    incident_history: List[Dict]
    performance_metrics: Dict

@dataclass
class SocialMetadata:
    """用户生成的和协作元数据"""
    ratings: float
    reviews: List[str]
    usage_count: int
    top_users: List[str]
    related_queries: List[str]
    comments: List[Dict]
    bookmarks: int
    endorsements: List[str]
```

### 自动化元数据提取

```python
import sqlalchemy
from typing import Dict, List
import json

class MetadataExtractor:
    """从各种数据源提取元数据"""

    def __init__(self, connection_string: str):
        self.engine = sqlalchemy.create_engine(connection_string)

    def extract_table_metadata(self, schema: str, table: str) -> Dict:
        """提取全面的表元数据"""
        metadata = {
            'schema': schema,
            'table': table,
            'columns': [],
            'constraints': [],
            'indexes': [],
            'statistics': {}
        }

        # 提取列信息
        column_query = """
        SELECT
            column_name,
            data_type,
            character_maximum_length,
            numeric_precision,
            numeric_scale,
            is_nullable,
            column_default,
            ordinal_position
        FROM information_schema.columns
        WHERE table_schema = :schema AND table_name = :table
        ORDER BY ordinal_position
        """

        with self.engine.connect() as conn:
            result = conn.execute(
                sqlalchemy.text(column_query),
                {'schema': schema, 'table': table}
            )
            for row in result:
                metadata['columns'].append({
                    'name': row.column_name,
                    'data_type': row.data_type,
                    'max_length': row.character_maximum_length,
                    'precision': row.numeric_precision,
                    'scale': row.numeric_scale,
                    'nullable': row.is_nullable == 'YES',
                    'default': row.column_default,
                    'position': row.ordinal_position
                })

        # 提取约束
        constraint_query = """
        SELECT
            tc.constraint_name,
            tc.constraint_type,
            kcu.column_name,
            ccu.table_name AS foreign_table,
            ccu.column_name AS foreign_column
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = :schema AND tc.table_name = :table
        """

        with self.engine.connect() as conn:
            result = conn.execute(
                sqlalchemy.text(constraint_query),
                {'schema': schema, 'table': table}
            )
            for row in result:
                metadata['constraints'].append({
                    'name': row.constraint_name,
                    'type': row.constraint_type,
                    'column': row.column_name,
                    'foreign_table': row.foreign_table,
                    'foreign_column': row.foreign_column
                })

        return metadata

    def extract_table_statistics(self, schema: str, table: str) -> Dict:
        """提取表统计信息"""
        stats_query = f"""
        SELECT
            COUNT(*) as row_count,
            pg_total_relation_size('{schema}.{table}') as total_size_bytes,
            pg_table_size('{schema}.{table}') as table_size_bytes,
            pg_indexes_size('{schema}.{table}') as indexes_size_bytes
        FROM {schema}.{table}
        """

        with self.engine.connect() as conn:
            result = conn.execute(sqlalchemy.text(stats_query)).fetchone()
            return {
                'row_count': result.row_count,
                'total_size_bytes': result.total_size_bytes,
                'table_size_bytes': result.table_size_bytes,
                'indexes_size_bytes': result.indexes_size_bytes
            }

    def extract_column_statistics(self, schema: str, table: str, column: str) -> Dict:
        """提取列级统计信息"""
        stats_query = f"""
        SELECT
            COUNT(*) as total_count,
            COUNT(DISTINCT {column}) as distinct_count,
            COUNT(*) - COUNT({column}) as null_count,
            MIN({column}::text) as min_value,
            MAX({column}::text) as max_value
        FROM {schema}.{table}
        """

        with self.engine.connect() as conn:
            result = conn.execute(sqlalchemy.text(stats_query)).fetchone()
            return {
                'total_count': result.total_count,
                'distinct_count': result.distinct_count,
                'null_count': result.null_count,
                'null_percentage': result.null_count / result.total_count if result.total_count > 0 else 0,
                'uniqueness': result.distinct_count / result.total_count if result.total_count > 0 else 0,
                'min_value': result.min_value,
                'max_value': result.max_value
            }
```
### 元数据存储模式

```sql
-- 元数据目录数据库模式

-- 核心资产注册表
CREATE TABLE catalog_assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type VARCHAR(50) NOT NULL,
    qualified_name VARCHAR(500) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(user_id),
    steward_id UUID REFERENCES users(user_id),
    source_system VARCHAR(100),
    classification VARCHAR(50),
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
);

CREATE INDEX idx_assets_type ON catalog_assets(asset_type);
CREATE INDEX idx_assets_qualified_name ON catalog_assets(qualified_name);
CREATE INDEX idx_assets_owner ON catalog_assets(owner_id);

-- 表的技术元数据
CREATE TABLE table_metadata (
    metadata_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES catalog_assets(asset_id),
    database_name VARCHAR(100),
    schema_name VARCHAR(100),
    table_name VARCHAR(200),
    table_type VARCHAR(50),
    row_count BIGINT,
    size_bytes BIGINT,
    partition_columns JSONB,
    clustering_columns JSONB,
    storage_format VARCHAR(50),
    location VARCHAR(500),
    created_date TIMESTAMP,
    modified_date TIMESTAMP,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 列元数据
CREATE TABLE column_metadata (
    column_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES catalog_assets(asset_id),
    column_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    ordinal_position INT,
    is_nullable BOOLEAN,
    is_primary_key BOOLEAN DEFAULT FALSE,
    is_foreign_key BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    description TEXT,
    business_name VARCHAR(200),
    classification VARCHAR(50),
    pii_type VARCHAR(50),
    statistics JSONB,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_columns_asset ON column_metadata(asset_id);

-- 业务词汇表术语
CREATE TABLE glossary_terms (
    term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_name VARCHAR(200) NOT NULL,
    definition TEXT NOT NULL,
    domain VARCHAR(100),
    owner_id UUID REFERENCES users(user_id),
    status VARCHAR(30) DEFAULT 'draft',
    synonyms TEXT[],
    related_terms UUID[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 资产到词汇表术语的映射
CREATE TABLE asset_term_mapping (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES catalog_assets(asset_id),
    term_id UUID REFERENCES glossary_terms(term_id),
    column_name VARCHAR(200),
    confidence_score DECIMAL(5,4),
    mapping_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(user_id)
);

-- 用于灵活分类的标签
CREATE TABLE tags (
    tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name VARCHAR(100) NOT NULL UNIQUE,
    tag_category VARCHAR(50),
    description TEXT,
    color VARCHAR(7)
);

CREATE TABLE asset_tags (
    asset_id UUID REFERENCES catalog_assets(asset_id),
    tag_id UUID REFERENCES tags(tag_id),
    tagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tagged_by UUID REFERENCES users(user_id),
    PRIMARY KEY (asset_id, tag_id)
);

-- 使用跟踪
CREATE TABLE asset_usage (
    usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES catalog_assets(asset_id),
    user_id UUID REFERENCES users(user_id),
    usage_type VARCHAR(50),
    query_text TEXT,
    execution_time_ms INT,
    rows_returned BIGINT,
    usage_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_asset ON asset_usage(asset_id);
CREATE INDEX idx_usage_timestamp ON asset_usage(usage_timestamp);
```

## 数据发现

### 搜索和发现架构

```python
from elasticsearch import Elasticsearch
from typing import List, Dict, Optional
import json

class DataDiscoveryService:
    """用于搜索和发现数据资产的服务"""

    def __init__(self, es_host: str = "localhost:9200"):
        self.es = Elasticsearch([es_host])
        self.index_name = "data_catalog"

    def create_search_index(self):
        """创建具有适当映射的 Elasticsearch 索引"""
        index_settings = {
            "settings": {
                "number_of_shards": 3,
                "number_of_replicas": 1,
                "analysis": {
                    "analyzer": {
                        "asset_analyzer": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "snowball", "synonym_filter"]
                        }
                    },
                    "filter": {
                        "synonym_filter": {
                            "type": "synonym",
                            "synonyms": [
                                "customer,client,user",
                                "revenue,sales,income",
                                "product,item,sku"
                            ]
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "asset_id": {"type": "keyword"},
                    "qualified_name": {"type": "keyword"},
                    "display_name": {
                        "type": "text",
                        "analyzer": "asset_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"}
                        }
                    },
                    "description": {
                        "type": "text",
                        "analyzer": "asset_analyzer"
                    },
                    "asset_type": {"type": "keyword"},
                    "owner": {"type": "keyword"},
                    "domain": {"type": "keyword"},
                    "classification": {"type": "keyword"},
                    "tags": {"type": "keyword"},
                    "glossary_terms": {"type": "keyword"},
                    "columns": {
                        "type": "nested",
                        "properties": {
                            "name": {"type": "text"},
                            "data_type": {"type": "keyword"},
                            "description": {"type": "text"}
                        }
                    },
                    "quality_score": {"type": "float"},
                    "popularity_score": {"type": "float"},
                    "last_updated": {"type": "date"},
                    "created_at": {"type": "date"}
                }
            }
        }

        if not self.es.indices.exists(index=self.index_name):
            self.es.indices.create(index=self.index_name, body=index_settings)

    def search_assets(
        self,
        query: str,
        filters: Optional[Dict] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "relevance"
    ) -> Dict:
        """使用过滤器和分页搜索数据资产"""

        # 构建搜索查询
        must_clauses = []
        filter_clauses = []

        # 主搜索查询
        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": [
                        "display_name^3",
                        "description^2",
                        "columns.name^2",
                        "columns.description",
                        "tags^2",
                        "glossary_terms^2"
                    ],
                    "type": "best_fields",
                    "fuzziness": "AUTO"
                }
            })

        # 应用过滤器
        if filters:
            if filters.get("asset_type"):
                filter_clauses.append({
                    "terms": {"asset_type": filters["asset_type"]}
                })
            if filters.get("domain"):
                filter_clauses.append({
                    "terms": {"domain": filters["domain"]}
                })
            if filters.get("owner"):
                filter_clauses.append({
                    "terms": {"owner": filters["owner"]}
                })
            if filters.get("classification"):
                filter_clauses.append({
                    "terms": {"classification": filters["classification"]}
                })
            if filters.get("tags"):
                filter_clauses.append({
                    "terms": {"tags": filters["tags"]}
                })
            if filters.get("min_quality_score"):
                filter_clauses.append({
                    "range": {"quality_score": {"gte": filters["min_quality_score"]}}
                })

        # 构建最终查询
        search_body = {
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else [{"match_all": {}}],
                    "filter": filter_clauses
                }
            },
            "from": (page - 1) * page_size,
            "size": page_size,
            "highlight": {
                "fields": {
                    "display_name": {},
                    "description": {},
                    "columns.name": {}
                }
            },
            "aggs": {
                "by_type": {
                    "terms": {"field": "asset_type"}
                },
                "by_domain": {
                    "terms": {"field": "domain"}
                },
                "by_classification": {
                    "terms": {"field": "classification"}
                },
                "by_owner": {
                    "terms": {"field": "owner", "size": 10}
                }
            }
        }

        # 排序选项
        if sort_by == "popularity":
            search_body["sort"] = [{"popularity_score": "desc"}]
        elif sort_by == "quality":
            search_body["sort"] = [{"quality_score": "desc"}]
        elif sort_by == "recent":
            search_body["sort"] = [{"last_updated": "desc"}]
        # 默认是相关性 (_score)

        result = self.es.search(index=self.index_name, body=search_body)

        return {
            "total": result["hits"]["total"]["value"],
            "page": page,
            "page_size": page_size,
            "results": [
                {
                    "asset": hit["_source"],
                    "score": hit["_score"],
                    "highlights": hit.get("highlight", {})
                }
                for hit in result["hits"]["hits"]
            ],
            "facets": {
                "asset_types": result["aggregations"]["by_type"]["buckets"],
                "domains": result["aggregations"]["by_domain"]["buckets"],
                "classifications": result["aggregations"]["by_classification"]["buckets"],
                "owners": result["aggregations"]["by_owner"]["buckets"]
            }
        }

    def get_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """基于用户行为获取个性化资产推荐"""

        # 基于用户最近活动查询相似资产
        recommendation_query = {
            "query": {
                "function_score": {
                    "query": {"match_all": {}},
                    "functions": [
                        {
                            "field_value_factor": {
                                "field": "popularity_score",
                                "factor": 1.2,
                                "modifier": "sqrt"
                            }
                        },
                        {
                            "field_value_factor": {
                                "field": "quality_score",
                                "factor": 1.5,
                                "modifier": "log1p"
                            }
                        },
                        {
                            "gauss": {
                                "last_updated": {
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
            },
            "size": limit
        }

        result = self.es.search(index=self.index_name, body=recommendation_query)
        return [hit["_source"] for hit in result["hits"]["hits"]]
```

### 数据预览和分析

```python
import pandas as pd
from typing import Dict, Any, Optional
import numpy as np

class DataProfiler:
    """为发现和质量评估分析数据资产"""

    def __init__(self, connection):
        self.conn = connection

    def profile_table(self, schema: str, table: str, sample_size: int = 10000) -> Dict:
        """为表生成全面的分析报告"""

        # 获取样本数据
        sample_query = f"""
        SELECT * FROM {schema}.{table}
        ORDER BY RANDOM()
        LIMIT {sample_size}
        """
        df = pd.read_sql(sample_query, self.conn)

        profile = {
            'schema': schema,
            'table': table,
            'sample_size': len(df),
            'column_count': len(df.columns),
            'columns': {}
        }

        for column in df.columns:
            col_profile = self._profile_column(df[column])
            profile['columns'][column] = col_profile

        return profile

    def _profile_column(self, series: pd.Series) -> Dict:
        """分析单个列"""
        profile = {
            'data_type': str(series.dtype),
            'total_count': len(series),
            'null_count': series.isnull().sum(),
            'null_percentage': series.isnull().mean() * 100,
            'distinct_count': series.nunique(),
            'uniqueness': series.nunique() / len(series) if len(series) > 0 else 0
        }

        # 类型特定的分析
        if pd.api.types.is_numeric_dtype(series):
            profile.update(self._profile_numeric(series))
        elif pd.api.types.is_datetime64_any_dtype(series):
            profile.update(self._profile_datetime(series))
        else:
            profile.update(self._profile_string(series))

        # 检测潜在的数据质量问题
        profile['quality_issues'] = self._detect_quality_issues(series, profile)

        return profile

    def _profile_numeric(self, series: pd.Series) -> Dict:
        """分析数值列"""
        clean_series = series.dropna()
        return {
            'min': clean_series.min() if len(clean_series) > 0 else None,
            'max': clean_series.max() if len(clean_series) > 0 else None,
            'mean': clean_series.mean() if len(clean_series) > 0 else None,
            'median': clean_series.median() if len(clean_series) > 0 else None,
            'std': clean_series.std() if len(clean_series) > 0 else None,
            'percentile_25': clean_series.quantile(0.25) if len(clean_series) > 0 else None,
            'percentile_75': clean_series.quantile(0.75) if len(clean_series) > 0 else None,
            'zero_count': (clean_series == 0).sum(),
            'negative_count': (clean_series < 0).sum()
        }

    def _profile_datetime(self, series: pd.Series) -> Dict:
        """分析日期时间列"""
        clean_series = series.dropna()
        return {
            'min_date': str(clean_series.min()) if len(clean_series) > 0 else None,
            'max_date': str(clean_series.max()) if len(clean_series) > 0 else None,
            'date_range_days': (clean_series.max() - clean_series.min()).days if len(clean_series) > 0 else None
        }

    def _profile_string(self, series: pd.Series) -> Dict:
        """分析字符串列"""
        clean_series = series.dropna().astype(str)
        lengths = clean_series.str.len()

        profile = {
            'min_length': lengths.min() if len(lengths) > 0 else None,
            'max_length': lengths.max() if len(lengths) > 0 else None,
            'avg_length': lengths.mean() if len(lengths) > 0 else None,
            'empty_string_count': (clean_series == '').sum()
        }

        # 低基数列的Top值
        if series.nunique() <= 20:
            profile['top_values'] = series.value_counts().head(10).to_dict()

        # 模式检测
        profile['patterns'] = self._detect_patterns(clean_series)

        return profile

    def _detect_patterns(self, series: pd.Series) -> Dict:
        """检测字符串数据中的常见模式"""
        patterns = {}
        sample = series.head(1000)

        # 邮箱模式
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        email_matches = sample.str.match(email_pattern, na=False).mean()
        if email_matches > 0.8:
            patterns['likely_email'] = True

        # 电话模式
        phone_pattern = r'^[\d\s\-\+\(\)]+$'
        phone_matches = sample.str.match(phone_pattern, na=False).mean()
        if phone_matches > 0.8 and sample.str.len().mean() > 8:
            patterns['likely_phone'] = True

        # UUID模式
        uuid_pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
        uuid_matches = sample.str.lower().str.match(uuid_pattern, na=False).mean()
        if uuid_matches > 0.8:
            patterns['likely_uuid'] = True

        return patterns

    def _detect_quality_issues(self, series: pd.Series, profile: Dict) -> List[str]:
        """检测潜在的数据质量问题"""
        issues = []

        # 高空值百分比
        if profile['null_percentage'] > 50:
            issues.append(f"高空值百分比：{profile['null_percentage']:.1f}%")

        # 潜在ID列的低唯一性
        if 'id' in series.name.lower() and profile['uniqueness'] < 0.99:
            issues.append(f"ID列唯一性低：{profile['uniqueness']:.2%}")

        # 全部为空值
        if profile['null_percentage'] == 100:
            issues.append("列完全为空")

        # 单一值
        if profile['distinct_count'] == 1 and profile['null_percentage'] < 100:
            issues.append("列只包含一个不同的值")

        return issues

    def get_data_preview(self, schema: str, table: str, limit: int = 100) -> Dict:
        """获取带有样本行的数据预览"""
        query = f"SELECT * FROM {schema}.{table} LIMIT {limit}"
        df = pd.read_sql(query, self.conn)

        return {
            'columns': list(df.columns),
            'data': df.to_dict('records'),
            'row_count': len(df)
        }
```

## 数据血缘

### 血缘图实现

```python
from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict
from enum import Enum
import networkx as nx

class LineageType(Enum):
    TABLE = "table"
    COLUMN = "column"
    JOB = "job"
    REPORT = "report"

@dataclass
class LineageNode:
    """表示血缘图中的节点"""
    node_id: str
    node_type: LineageType
    name: str
    qualified_name: str
    properties: Dict = field(default_factory=dict)

@dataclass
class LineageEdge:
    """表示血缘图中的边（转换）"""
    source_id: str
    target_id: str
    transformation_type: str  # 'direct', 'derived', 'aggregated', 'filtered', 'joined'
    transformation_logic: Optional[str] = None
    job_id: Optional[str] = None
    column_mappings: List[Dict] = field(default_factory=list)

class LineageGraph:
    """具有分析能力的数据血缘图"""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes: Dict[str, LineageNode] = {}
        self.edges: List[LineageEdge] = []

    def add_node(self, node: LineageNode):
        """向血缘图添加节点"""
        self.nodes[node.node_id] = node
        self.graph.add_node(
            node.node_id,
            node_type=node.node_type.value,
            name=node.name,
            qualified_name=node.qualified_name,
            **node.properties
        )

    def add_edge(self, edge: LineageEdge):
        """向血缘图添加边"""
        self.edges.append(edge)
        self.graph.add_edge(
            edge.source_id,
            edge.target_id,
            transformation_type=edge.transformation_type,
            transformation_logic=edge.transformation_logic,
            job_id=edge.job_id,
            column_mappings=edge.column_mappings
        )

    def get_upstream_lineage(
        self,
        node_id: str,
        depth: int = -1,
        include_jobs: bool = True
    ) -> Dict:
        """获取所有上游依赖"""
        if node_id not in self.graph:
            return {'error': f'节点 {node_id} 未找到'}

        visited = set()
        upstream_nodes = []
        upstream_edges = []

        def traverse(current_id: str, current_depth: int):
            if current_id in visited:
                return
            if depth != -1 and current_depth > depth:
                return

            visited.add(current_id)

            for predecessor in self.graph.predecessors(current_id):
                node = self.nodes.get(predecessor)
                if node:
                    if not include_jobs and node.node_type == LineageType.JOB:
                        # 跳过作业节点但继续遍历
                        traverse(predecessor, current_depth)
                    else:
                        upstream_nodes.append({
                            'id': predecessor,
                            'name': node.name,
                            'type': node.node_type.value,
                            'depth': current_depth + 1
                        })
                        edge_data = self.graph.get_edge_data(predecessor, current_id)
                        upstream_edges.append({
                            'source': predecessor,
                            'target': current_id,
                            **edge_data
                        })
                        traverse(predecessor, current_depth + 1)

        traverse(node_id, 0)

        return {
            'root_node': node_id,
            'direction': 'upstream',
            'nodes': upstream_nodes,
            'edges': upstream_edges,
            'depth_reached': max([n['depth'] for n in upstream_nodes]) if upstream_nodes else 0
        }

    def get_downstream_lineage(
        self,
        node_id: str,
        depth: int = -1,
        include_jobs: bool = True
    ) -> Dict:
        """获取所有下游依赖"""
        if node_id not in self.graph:
            return {'error': f'节点 {node_id} 未找到'}

        visited = set()
        downstream_nodes = []
        downstream_edges = []

        def traverse(current_id: str, current_depth: int):
            if current_id in visited:
                return
            if depth != -1 and current_depth > depth:
                return

            visited.add(current_id)

            for successor in self.graph.successors(current_id):
                node = self.nodes.get(successor)
                if node:
                    if not include_jobs and node.node_type == LineageType.JOB:
                        traverse(successor, current_depth)
                    else:
                        downstream_nodes.append({
                            'id': successor,
                            'name': node.name,
                            'type': node.node_type.value,
                            'depth': current_depth + 1
                        })
                        edge_data = self.graph.get_edge_data(current_id, successor)
                        downstream_edges.append({
                            'source': current_id,
                            'target': successor,
                            **edge_data
                        })
                        traverse(successor, current_depth + 1)

        traverse(node_id, 0)

        return {
            'root_node': node_id,
            'direction': 'downstream',
            'nodes': downstream_nodes,
            'edges': downstream_edges,
            'depth_reached': max([n['depth'] for n in downstream_nodes]) if downstream_nodes else 0
        }

    def impact_analysis(self, node_id: str) -> Dict:
        """分析对节点更改的影响"""
        downstream = self.get_downstream_lineage(node_id)

        impact = {
            'source_node': node_id,
            'total_impacted': len(downstream['nodes']),
            'by_type': defaultdict(list),
            'by_depth': defaultdict(list),
            'critical_impacts': [],
            'jobs_affected': [],
            'reports_affected': []
        }

        for node in downstream['nodes']:
            impact['by_type'][node['type']].append(node['name'])
            impact['by_depth'][node['depth']].append(node['name'])

            full_node = self.nodes.get(node['id'])
            if full_node:
                if full_node.properties.get('is_critical'):
                    impact['critical_impacts'].append(node['name'])
                if full_node.node_type == LineageType.JOB:
                    impact['jobs_affected'].append(node['name'])
                if full_node.node_type == LineageType.REPORT:
                    impact['reports_affected'].append(node['name'])

        return impact

    def root_cause_analysis(self, node_id: str) -> Dict:
        """回溯查找根因"""
        upstream = self.get_upstream_lineage(node_id)

        root_causes = {
            'target_node': node_id,
            'source_tables': [],
            'transformation_chain': [],
            'jobs_involved': []
        }

        # 找到根节点（无前驱）
        for node in upstream['nodes']:
            full_node = self.nodes.get(node['id'])
            if full_node and len(list(self.graph.predecessors(node['id']))) == 0:
                if full_node.node_type == LineageType.TABLE:
                    root_causes['source_tables'].append({
                        'name': node['name'],
                        'qualified_name': full_node.qualified_name
                    })

        # 构建转换链
        for edge in upstream['edges']:
            if edge.get('transformation_logic'):
                root_causes['transformation_chain'].append({
                    'from': edge['source'],
                    'to': edge['target'],
                    'type': edge['transformation_type'],
                    'logic': edge['transformation_logic']
                })
            if edge.get('job_id'):
                root_causes['jobs_involved'].append(edge['job_id'])

        root_causes['jobs_involved'] = list(set(root_causes['jobs_involved']))

        return root_causes

    def get_column_lineage(self, table_id: str, column_name: str) -> Dict:
        """获取列级血缘"""
        column_lineage = {
            'table': table_id,
            'column': column_name,
            'upstream_columns': [],
            'downstream_columns': [],
            'transformations': []
        }

        # 检查边的列映射
        for edge in self.edges:
            for mapping in edge.column_mappings:
                if edge.target_id == table_id and mapping.get('target_column') == column_name:
                    column_lineage['upstream_columns'].append({
                        'table': edge.source_id,
                        'column': mapping.get('source_column'),
                        'transformation': mapping.get('transformation')
                    })
                if edge.source_id == table_id and mapping.get('source_column') == column_name:
                    column_lineage['downstream_columns'].append({
                        'table': edge.target_id,
                        'column': mapping.get('target_column'),
                        'transformation': mapping.get('transformation')
                    })

        return column_lineage
```

### 用于血缘提取的 SQL 解析器

```python
import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Where, Parenthesis
from sqlparse.tokens import Keyword, DML
from typing import List, Dict, Set, Tuple
import re

class SQLLineageExtractor:
    """从 SQL 语句提取血缘信息"""

    def __init__(self):
        self.cte_tables = {}

    def extract_lineage(self, sql: str) -> Dict:
        """从 SQL 提取源表和目标表"""
        parsed = sqlparse.parse(sql)

        lineage = {
            'source_tables': set(),
            'target_tables': set(),
            'cte_definitions': {},
            'joins': [],
            'columns': {
                'selected': [],
                'filtered': [],
                'grouped': []
            }
        }

        for statement in parsed:
            self._process_statement(statement, lineage)

        # 将集合转换为列表以便 JSON 序列化
        lineage['source_tables'] = list(lineage['source_tables'])
        lineage['target_tables'] = list(lineage['target_tables'])

        return lineage

    def _process_statement(self, statement, lineage: Dict):
        """处理单个 SQL 语句"""
        statement_type = statement.get_type()

        if statement_type == 'SELECT':
            self._process_select(statement, lineage)
        elif statement_type == 'INSERT':
            self._process_insert(statement, lineage)
        elif statement_type == 'CREATE':
            self._process_create(statement, lineage)
        elif statement_type == 'UPDATE':
            self._process_update(statement, lineage)
        elif statement_type == 'DELETE':
            self._process_delete(statement, lineage)

    def _process_select(self, statement, lineage: Dict):
        """处理 SELECT 语句"""
        # 提取 CTE
        self._extract_ctes(statement, lineage)

        # 提取 FROM 子句中的表
        from_seen = False
        for token in statement.tokens:
            if from_seen:
                if self._is_subselect(token):
                    self._process_statement(token, lineage)
                elif token.ttype is Keyword:
                    from_seen = False
                else:
                    self._extract_table_identifiers(token, lineage['source_tables'])
            if token.ttype is Keyword and token.value.upper() == 'FROM':
                from_seen = True

        # 提取 JOIN 表
        self._extract_joins(statement, lineage)

    def _process_insert(self, statement, lineage: Dict):
        """处理 INSERT 语句"""
        # 找到目标表
        into_seen = False
        for token in statement.tokens:
            if into_seen:
                if isinstance(token, Identifier):
                    lineage['target_tables'].add(self._get_table_name(token))
                    break
                elif token.ttype is not None and not token.is_whitespace:
                    lineage['target_tables'].add(token.value)
                    break
            if token.ttype is Keyword and token.value.upper() == 'INTO':
                into_seen = True

        # 从 SELECT 找到源表
        for token in statement.tokens:
            if self._is_subselect(token):
                self._process_select(token, lineage)

    def _process_create(self, statement, lineage: Dict):
        """处理 CREATE TABLE/VIEW 语句"""
        tokens = [t for t in statement.tokens if not t.is_whitespace]

        # 找到 CREATE TABLE/VIEW 名称
        for i, token in enumerate(tokens):
            if token.ttype is Keyword and token.value.upper() in ('TABLE', 'VIEW'):
                if i + 1 < len(tokens):
                    target = tokens[i + 1]
                    if isinstance(target, Identifier):
                        lineage['target_tables'].add(self._get_table_name(target))
                    else:
                        lineage['target_tables'].add(target.value)
                break

        # 从 AS SELECT 找到源表
        for token in statement.tokens:
            if self._is_subselect(token):
                self._process_select(token, lineage)

    def _process_update(self, statement, lineage: Dict):
        """处理 UPDATE 语句"""
        update_seen = False
        for token in statement.tokens:
            if update_seen and not token.is_whitespace:
                if isinstance(token, Identifier):
                    lineage['target_tables'].add(self._get_table_name(token))
                else:
                    lineage['target_tables'].add(token.value)
                break
            if token.ttype is DML and token.value.upper() == 'UPDATE':
                update_seen = True

    def _process_delete(self, statement, lineage: Dict):
        """处理 DELETE 语句"""
        from_seen = False
        for token in statement.tokens:
            if from_seen and not token.is_whitespace:
                if isinstance(token, Identifier):
                    lineage['target_tables'].add(self._get_table_name(token))
                else:
                    lineage['target_tables'].add(token.value)
                break
            if token.ttype is Keyword and token.value.upper() == 'FROM':
                from_seen = True

    def _extract_ctes(self, statement, lineage: Dict):
        """提取公共表表达式"""
        cte_pattern = r'WITH\s+(\w+)\s+AS\s*\(([\s\S]+?)\)(?:\s*,\s*(\w+)\s+AS\s*\(([\s\S]+?)\))*'
        sql_str = str(statement)

        matches = re.findall(r'(\w+)\s+AS\s*\(', sql_str, re.IGNORECASE)
        for cte_name in matches:
            lineage['cte_definitions'][cte_name] = True
            self.cte_tables[cte_name] = True

    def _extract_joins(self, statement, lineage: Dict):
        """提取 JOIN 信息"""
        join_pattern = r'(LEFT|RIGHT|INNER|OUTER|FULL|CROSS)?\s*JOIN\s+(\w+(?:\.\w+)?)'
        sql_str = str(statement)

        matches = re.findall(join_pattern, sql_str, re.IGNORECASE)
        for join_type, table_name in matches:
            if table_name not in self.cte_tables:
                lineage['source_tables'].add(table_name)
                lineage['joins'].append({
                    'type': join_type or 'INNER',
                    'table': table_name
                })

    def _extract_table_identifiers(self, token, tables: Set):
        """从token提取表标识符"""
        if isinstance(token, IdentifierList):
            for identifier in token.get_identifiers():
                table_name = self._get_table_name(identifier)
                if table_name and table_name not in self.cte_tables:
                    tables.add(table_name)
        elif isinstance(token, Identifier):
            table_name = self._get_table_name(token)
            if table_name and table_name not in self.cte_tables:
                tables.add(table_name)

    def _get_table_name(self, token) -> str:
        """从标识符token获取表名"""
        if isinstance(token, Identifier):
            return token.get_real_name()
        return str(token).strip()

    def _is_subselect(self, token) -> bool:
        """检查token是否是子查询"""
        if isinstance(token, Parenthesis):
            for sub_token in token.tokens:
                if sub_token.ttype is DML and sub_token.value.upper() == 'SELECT':
                    return True
        return False


# 示例用法
def extract_dbt_lineage(dbt_manifest: Dict) -> List[LineageEdge]:
    """从 dbt manifest.json 提取血缘"""
    edges = []

    for node_id, node in dbt_manifest.get('nodes', {}).items():
        if node['resource_type'] in ('model', 'seed', 'source'):
            target_table = node['relation_name']

            # 获取依赖
            for dep in node.get('depends_on', {}).get('nodes', []):
                dep_node = dbt_manifest['nodes'].get(dep) or dbt_manifest.get('sources', {}).get(dep)
                if dep_node:
                    source_table = dep_node.get('relation_name')
                    if source_table:
                        edges.append(LineageEdge(
                            source_id=source_table,
                            target_id=target_table,
                            transformation_type='dbt_model',
                            job_id=node_id
                        ))

    return edges
```

## 数据目录工具

### DataHub

DataHub 是由 LinkedIn 开发的开源元数据平台，用于数据发现、数据可观测性和联邦治理。

```python
# DataHub 集成示例
from datahub.emitter.mce_builder import make_dataset_urn, make_schema_field_urn
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import (
    DatasetPropertiesClass,
    SchemaMetadataClass,
    SchemaFieldClass,
    DatasetSnapshotClass,
    MetadataChangeEventClass,
    OwnershipClass,
    OwnerClass,
    OwnershipTypeClass,
    GlobalTagsClass,
    TagAssociationClass,
    GlossaryTermsClass,
    GlossaryTermAssociationClass,
    UpstreamLineageClass,
    UpstreamClass,
    DatasetLineageTypeClass
)

class DataHubCatalog:
    """DataHub 数据目录集成"""

    def __init__(self, server_url: str = "http://localhost:8080"):
        self.emitter = DatahubRestEmitter(server_url)

    def register_dataset(
        self,
        platform: str,
        name: str,
        description: str,
        schema: List[Dict],
        owner: str,
        tags: List[str] = None,
        glossary_terms: List[str] = None
    ) -> str:
        """在 DataHub 中注册数据集"""

        # 创建数据集 URN
        dataset_urn = make_dataset_urn(platform=platform, name=name, env="PROD")

        # 创建模式字段
        schema_fields = []
        for field in schema:
            schema_fields.append(SchemaFieldClass(
                fieldPath=field['name'],
                type=self._map_data_type(field['data_type']),
                nativeDataType=field['data_type'],
                description=field.get('description', ''),
                nullable=field.get('nullable', True)
            ))

        # 创建元数据方面
        aspects = []

        # 数据集属性
        aspects.append(DatasetPropertiesClass(
            description=description,
            customProperties={}
        ))

        # 模式
        aspects.append(SchemaMetadataClass(
            schemaName=name,
            platform=f"urn:li:dataPlatform:{platform}",
            version=0,
            hash="",
            platformSchema={},
            fields=schema_fields
        ))

        # 所有权
        aspects.append(OwnershipClass(
            owners=[
                OwnerClass(
                    owner=f"urn:li:corpuser:{owner}",
                    type=OwnershipTypeClass.DATAOWNER
                )
            ]
        ))

        # 标签
        if tags:
            aspects.append(GlobalTagsClass(
                tags=[
                    TagAssociationClass(tag=f"urn:li:tag:{tag}")
                    for tag in tags
                ]
            ))

        # 词汇表术语
        if glossary_terms:
            aspects.append(GlossaryTermsClass(
                terms=[
                    GlossaryTermAssociationClass(urn=f"urn:li:glossaryTerm:{term}")
                    for term in glossary_terms
                ]
            ))

        # 创建并发送 MCE
        snapshot = DatasetSnapshotClass(urn=dataset_urn, aspects=aspects)
        mce = MetadataChangeEventClass(proposedSnapshot=snapshot)

        self.emitter.emit(mce)
        return dataset_urn

    def add_lineage(
        self,
        downstream_platform: str,
        downstream_name: str,
        upstream_datasets: List[Dict]
    ):
        """添加血缘关系"""

        downstream_urn = make_dataset_urn(
            platform=downstream_platform,
            name=downstream_name,
            env="PROD"
        )

        upstreams = []
        for upstream in upstream_datasets:
            upstream_urn = make_dataset_urn(
                platform=upstream['platform'],
                name=upstream['name'],
                env="PROD"
            )
            upstreams.append(UpstreamClass(
                dataset=upstream_urn,
                type=DatasetLineageTypeClass.TRANSFORMED
            ))

        lineage = UpstreamLineageClass(upstreams=upstreams)

        # 发送血缘
        self.emitter.emit_mcp(
            entity_urn=downstream_urn,
            aspect_name="upstreamLineage",
            aspect=lineage
        )

    def _map_data_type(self, native_type: str) -> Dict:
        """将原生数据类型映射到 DataHub 类型"""
        type_mapping = {
            'string': {'type': {'com.linkedin.pegasus2avro.schema.StringType': {}}},
            'varchar': {'type': {'com.linkedin.pegasus2avro.schema.StringType': {}}},
            'int': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'integer': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'bigint': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'float': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'double': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'decimal': {'type': {'com.linkedin.pegasus2avro.schema.NumberType': {}}},
            'boolean': {'type': {'com.linkedin.pegasus2avro.schema.BooleanType': {}}},
            'date': {'type': {'com.linkedin.pegasus2avro.schema.DateType': {}}},
            'timestamp': {'type': {'com.linkedin.pegasus2avro.schema.TimeType': {}}},
        }
        return type_mapping.get(native_type.lower(),
                               {'type': {'com.linkedin.pegasus2avro.schema.StringType': {}}})
```

### Apache Atlas

Apache Atlas 是用于 Hadoop 生态系统的开源元数据管理和治理框架。

```python
# Apache Atlas 集成示例
import requests
from typing import Dict, List, Optional
import json

class ApacheAtlasCatalog:
    """Apache Atlas 数据目录集成"""

    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.auth = (username, password)
        self.headers = {'Content-Type': 'application/json'}

    def create_entity(self, entity: Dict) -> Dict:
        """在 Atlas 中创建实体"""
        url = f"{self.base_url}/api/atlas/v2/entity"
        response = requests.post(
            url,
            headers=self.headers,
            auth=self.auth,
            json={'entity': entity}
        )
        response.raise_for_status()
        return response.json()

    def create_hive_table(
        self,
        database: str,
        table: str,
        columns: List[Dict],
        owner: str,
        description: str = "",
        classification: str = None
    ) -> Dict:
        """创建 Hive 表实体"""

        # 创建列实体
        column_entities = []
        for col in columns:
            column_entities.append({
                'typeName': 'hive_column',
                'attributes': {
                    'name': col['name'],
                    'type': col['data_type'],
                    'comment': col.get('description', ''),
                    'qualifiedName': f"{database}.{table}.{col['name']}@cluster"
                }
            })

        # 创建表实体
        table_entity = {
            'typeName': 'hive_table',
            'attributes': {
                'name': table,
                'qualifiedName': f"{database}.{table}@cluster",
                'description': description,
                'owner': owner,
                'db': {
                    'typeName': 'hive_db',
                    'uniqueAttributes': {
                        'qualifiedName': f"{database}@cluster"
                    }
                },
                'columns': column_entities
            }
        }

        if classification:
            table_entity['classifications'] = [{'typeName': classification}]

        return self.create_entity(table_entity)

    def create_lineage(
        self,
        process_name: str,
        inputs: List[str],
        outputs: List[str],
        description: str = ""
    ) -> Dict:
        """创建血缘流程实体"""

        input_refs = [
            {'typeName': 'hive_table', 'uniqueAttributes': {'qualifiedName': qn}}
            for qn in inputs
        ]

        output_refs = [
            {'typeName': 'hive_table', 'uniqueAttributes': {'qualifiedName': qn}}
            for qn in outputs
        ]

        process_entity = {
            'typeName': 'hive_process',
            'attributes': {
                'name': process_name,
                'qualifiedName': f"{process_name}@cluster",
                'description': description,
                'inputs': input_refs,
                'outputs': output_refs
            }
        }

        return self.create_entity(process_entity)

    def search_entities(
        self,
        query: str,
        type_name: str = None,
        classification: str = None,
        limit: int = 25,
        offset: int = 0
    ) -> Dict:
        """搜索实体"""
        url = f"{self.base_url}/api/atlas/v2/search/basic"

        search_params = {
            'query': query,
            'limit': limit,
            'offset': offset
        }

        if type_name:
            search_params['typeName'] = type_name
        if classification:
            search_params['classification'] = classification

        response = requests.get(
            url,
            headers=self.headers,
            auth=self.auth,
            params=search_params
        )
        response.raise_for_status()
        return response.json()

    def get_lineage(self, guid: str, direction: str = 'BOTH', depth: int = 3) -> Dict:
        """获取实体的血缘"""
        url = f"{self.base_url}/api/atlas/v2/lineage/{guid}"
        params = {
            'direction': direction,
            'depth': depth
        }

        response = requests.get(
            url,
            headers=self.headers,
            auth=self.auth,
            params=params
        )
        response.raise_for_status()
        return response.json()

    def add_classification(self, guid: str, classification: str):
        """为实体添加分类"""
        url = f"{self.base_url}/api/atlas/v2/entity/guid/{guid}/classifications"

        classification_body = [{
            'typeName': classification,
            'propagate': True
        }]

        response = requests.post(
            url,
            headers=self.headers,
            auth=self.auth,
            json=classification_body
        )
        response.raise_for_status()

    def create_glossary_term(
        self,
        name: str,
        definition: str,
        glossary_guid: str,
        related_terms: List[str] = None
    ) -> Dict:
        """创建词汇表术语"""
        url = f"{self.base_url}/api/atlas/v2/glossary/term"

        term = {
            'name': name,
            'shortDescription': definition,
            'anchor': {
                'glossaryGuid': glossary_guid
            }
        }

        if related_terms:
            term['seeAlso'] = [
                {'termGuid': guid} for guid in related_terms
            ]

        response = requests.post(
            url,
            headers=self.headers,
            auth=self.auth,
            json=term
        )
        response.raise_for_status()
        return response.json()
```

### 工具对比

```
+------------------+----------------+----------------+----------------+----------------+
|     功能         |    DataHub     |  Apache Atlas  |   Amundsen     |    Alation     |
+------------------+----------------+----------------+----------------+----------------+
| 开源             | 是             | 是             | 是             | 否             |
| 许可证           | Apache 2.0     | Apache 2.0     | Apache 2.0     | 商业           |
+------------------+----------------+----------------+----------------+----------------+
| 元数据摄取                                                                          |
+------------------+----------------+----------------+----------------+----------------+
| 推送 API         | 是             | 是             | 是             | 是             |
| 拉取连接器       | 50+            | Hadoop 为主    | 20+            | 75+            |
| 实时             | 是             | 有限           | 否             | 是             |
+------------------+----------------+----------------+----------------+----------------+
| 发现                                                                                |
+------------------+----------------+----------------+----------------+----------------+
| 搜索             | Elasticsearch  | Solr           | Elasticsearch  | 专有           |
| 分面搜索         | 是             | 是             | 是             | 是             |
| 预览             | 是             | 有限           | 是             | 是             |
+------------------+----------------+----------------+----------------+----------------+
| 血缘                                                                                |
+------------------+----------------+----------------+----------------+----------------+
| 表级             | 是             | 是             | 是             | 是             |
| 列级             | 是             | 有限           | 有限           | 是             |
| 实时             | 是             | 否             | 否             | 是             |
+------------------+----------------+----------------+----------------+----------------+
| 治理                                                                                |
+------------------+----------------+----------------+----------------+----------------+
| 分类             | 是             | 是             | 有限           | 是             |
| 访问控制         | 是             | 是             | 有限           | 是             |
| 词汇表           | 是             | 是             | 有限           | 是             |
| 策略             | 是             | 有限           | 否             | 是             |
+------------------+----------------+----------------+----------------+----------------+
| 可扩展性         | 高             | 中等           | 中等           | 高             |
| 部署难度         | 中等           | 复杂           | 简单           | 简单           |
| 社区             | 活跃           | 成熟           | 活跃           | N/A            |
+------------------+----------------+----------------+----------------+----------------+
```

## 实施策略

### 数据目录架构

```
+------------------------------------------------------------------+
|                     数据目录架构                                   |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------------+     +-------------------+                   |
|  |   数据源          |     |  元数据存储       |                   |
|  +-------------------+     +-------------------+                   |
|  | - 数据库          |     | - PostgreSQL      |                   |
|  | - 数据湖          |---->| - 图数据库        |                   |
|  | - BI工具          |     | - 搜索索引        |                   |
|  | - ETL管道         |     +--------+----------+                   |
|  +-------------------+              |                              |
|           |                         |                              |
|           v                         v                              |
|  +-------------------+     +-------------------+                   |
|  | 元数据摄取        |     |  目录API          |                   |
|  +-------------------+     +-------------------+                   |
|  | - 爬虫            |     | - REST API        |                   |
|  | - 连接器          |     | - GraphQL         |                   |
|  | - 事件监听器      |     | - SDK             |                   |
|  +-------------------+     +--------+----------+                   |
|                                     |                              |
|                                     v                              |
|                       +----------------------------+               |
|                       |      Web 应用程序          |               |
|                       +----------------------------+               |
|                       | - 搜索和发现               |               |
|                       | - 血缘可视化               |               |
|                       | - 数据治理                 |               |
|                       | - 协作                     |               |
|                       +----------------------------+               |
|                                                                    |
+------------------------------------------------------------------+
```

### 实施阶段

```python
class DataCatalogImplementation:
    """数据目录实施框架"""

    IMPLEMENTATION_PHASES = {
        'phase_1_foundation': {
            'duration': '4-6 周',
            'objectives': [
                '部署目录平台',
                '连接核心数据源',
                '导入技术元数据'
            ],
            'deliverables': [
                '目录基础设施已部署',
                '前 10 个数据源已连接',
                '自动化元数据提取运行中'
            ],
            'success_metrics': [
                '平台可用性 > 99%',
                '核心表已编目 > 80%'
            ]
        },
        'phase_2_enrichment': {
            'duration': '6-8 周',
            'objectives': [
                '添加业务元数据',
                '建立数据所有权',
                '创建业务词汇表'
            ],
            'deliverables': [
                '优先资产的业务描述',
                '所有资产已分配所有者/管理员',
                '初始词汇表包含 50+ 术语'
            ],
            'success_metrics': [
                '有描述的资产 > 70%',
                '有所有者的资产 > 90%'
            ]
        },
        'phase_3_lineage': {
            'duration': '4-6 周',
            'objectives': [
                '实施血缘跟踪',
                '连接 ETL 工具',
                '启用影响分析'
            ],
            'deliverables': [
                '关键管道的表级血缘',
                'UI 中的血缘可视化',
                '影响分析报告'
            ],
            'success_metrics': [
                '有血缘的关键表 > 80%',
                '血缘深度 >= 3 跳'
            ]
        },
        'phase_4_governance': {
            'duration': '6-8 周',
            'objectives': [
                '实施数据分类',
                '定义治理策略',
                '启用合规跟踪'
            ],
            'deliverables': [
                '分类体系',
                'PII/敏感数据已标记',
                '访问策略已定义'
            ],
            'success_metrics': [
                '敏感数据已分类 > 95%',
                '策略违规 < 5%'
            ]
        },
        'phase_5_adoption': {
            'duration': '持续',
            'objectives': [
                '推动用户采用',
                '与工作流集成',
                '持续改进'
            ],
            'deliverables': [
                '培训材料',
                '工作流集成',
                '使用仪表板'
            ],
            'success_metrics': [
                '周活跃用户 > 50%',
                '搜索满意度 > 4.0/5'
            ]
        }
    }

    @classmethod
    def get_checklist(cls, phase: str) -> List[Dict]:
        """获取阶段的实施检查清单"""
        phase_data = cls.IMPLEMENTATION_PHASES.get(phase)
        if not phase_data:
            return []

        checklist = []
        for objective in phase_data['objectives']:
            checklist.append({
                'item': objective,
                'category': 'objective',
                'status': 'pending'
            })
        for deliverable in phase_data['deliverables']:
            checklist.append({
                'item': deliverable,
                'category': 'deliverable',
                'status': 'pending'
            })

        return checklist
```

### 数据目录治理模型

```python
from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class Role(Enum):
    DATA_OWNER = "data_owner"
    DATA_STEWARD = "data_steward"
    DATA_CUSTODIAN = "data_custodian"
    DATA_CONSUMER = "data_consumer"
    CATALOG_ADMIN = "catalog_admin"

@dataclass
class GovernanceRole:
    """数据治理角色定义"""
    role: Role
    responsibilities: List[str]
    permissions: List[str]

class CatalogGovernanceModel:
    """数据目录的治理模型"""

    ROLES = {
        Role.DATA_OWNER: GovernanceRole(
            role=Role.DATA_OWNER,
            responsibilities=[
                "定义业务含义和上下文",
                "批准数据访问请求",
                "确保数据质量标准",
                "定义保留策略"
            ],
            permissions=[
                "edit_business_metadata",
                "approve_access",
                "manage_classification",
                "assign_stewards"
            ]
        ),
        Role.DATA_STEWARD: GovernanceRole(
            role=Role.DATA_STEWARD,
            responsibilities=[
                "维护数据质量",
                "丰富元数据",
                "管理词汇表术语",
                "监控数据使用"
            ],
            permissions=[
                "edit_business_metadata",
                "create_glossary_terms",
                "run_quality_checks",
                "view_usage_stats"
            ]
        ),
        Role.DATA_CUSTODIAN: GovernanceRole(
            role=Role.DATA_CUSTODIAN,
            responsibilities=[
                "管理技术元数据",
                "配置数据源",
                "维护血缘",
                "处理技术问题"
            ],
            permissions=[
                "edit_technical_metadata",
                "manage_connectors",
                "edit_lineage",
                "manage_schedules"
            ]
        ),
        Role.DATA_CONSUMER: GovernanceRole(
            role=Role.DATA_CONSUMER,
            responsibilities=[
                "搜索和发现数据",
                "请求数据访问",
                "提供反馈",
                "报告数据问题"
            ],
            permissions=[
                "search_catalog",
                "view_metadata",
                "request_access",
                "add_comments"
            ]
        ),
        Role.CATALOG_ADMIN: GovernanceRole(
            role=Role.CATALOG_ADMIN,
            responsibilities=[
                "管理目录平台",
                "管理用户和角色",
                "配置策略",
                "监控系统健康"
            ],
            permissions=[
                "all_permissions",
                "manage_users",
                "configure_system",
                "manage_policies"
            ]
        )
    }

    @classmethod
    def get_role_matrix(cls) -> Dict:
        """生成目录治理的 RACI 矩阵"""
        activities = [
            "创建新数据资产",
            "编辑业务元数据",
            "编辑技术元数据",
            "批准数据访问",
            "创建词汇表术语",
            "管理分类",
            "配置数据源",
            "运行质量检查",
            "报告数据问题"
        ]

        raci = {
            activity: {} for activity in activities
        }

        # 定义 RACI（负责、问责、咨询、知情）
        raci["创建新数据资产"] = {
            Role.DATA_OWNER: "A",
            Role.DATA_STEWARD: "R",
            Role.DATA_CUSTODIAN: "C",
            Role.CATALOG_ADMIN: "I"
        }
        raci["编辑业务元数据"] = {
            Role.DATA_OWNER: "A",
            Role.DATA_STEWARD: "R",
            Role.DATA_CONSUMER: "C"
        }
        raci["编辑技术元数据"] = {
            Role.DATA_CUSTODIAN: "R",
            Role.DATA_STEWARD: "C",
            Role.CATALOG_ADMIN: "A"
        }
        raci["批准数据访问"] = {
            Role.DATA_OWNER: "A/R",
            Role.DATA_STEWARD: "C",
            Role.DATA_CONSUMER: "I"
        }

        return raci
```

## 最佳实践

### 元数据质量指南

```python
class MetadataQualityGuidelines:
    """维护元数据质量的指南"""

    GUIDELINES = {
        'descriptions': {
            'min_length': 50,
            'max_length': 500,
            'required_elements': [
                '数据代表什么',
                '如何使用',
                '更新频率'
            ],
            'avoid': [
                '与名称重复',
                '没有解释的技术术语',
                '过时的信息'
            ]
        },
        'naming_conventions': {
            'tables': {
                'pattern': r'^[a-z][a-z0-9_]*$',
                'prefix_rules': {
                    'dim_': '维度表',
                    'fact_': '事实表',
                    'stg_': '暂存表',
                    'raw_': '原始数据表'
                }
            },
            'columns': {
                'pattern': r'^[a-z][a-z0-9_]*$',
                'suffix_rules': {
                    '_id': '标识符列',
                    '_at': '时间戳列',
                    '_date': '日期列',
                    '_flag': '布尔列',
                    '_count': '计数指标',
                    '_amount': '金额值'
                }
            }
        },
        'classification': {
            'required_for': ['PII', '财务', '健康'],
            'review_frequency': '每季度',
            'approval_required': True
        },
        'ownership': {
            'required': True,
            'owner_must_be': '在职员工',
            'backup_owner_required': True,
            'review_frequency': '每年'
        }
    }

    @classmethod
    def validate_description(cls, description: str) -> Dict:
        """根据指南验证描述"""
        guidelines = cls.GUIDELINES['descriptions']
        issues = []
        score = 100

        if len(description) < guidelines['min_length']:
            issues.append(f"描述太短（最少 {guidelines['min_length']} 字符）")
            score -= 30

        if len(description) > guidelines['max_length']:
            issues.append(f"描述太长（最多 {guidelines['max_length']} 字符）")
            score -= 10

        # 检查必需元素
        for element in guidelines['required_elements']:
            # 简单启发式检查
            keywords = element.lower().split()
            if not any(kw in description.lower() for kw in keywords):
                issues.append(f"缺少：{element}")
                score -= 15

        return {
            'valid': len(issues) == 0,
            'score': max(0, score),
            'issues': issues
        }
```

### 采用和变更管理

```python
class CatalogAdoptionStrategy:
    """推动数据目录采用的策略"""

    ADOPTION_TACTICS = {
        'awareness': [
            {
                'tactic': '高管支持',
                'description': '获得可见的高管支持',
                'impact': '高'
            },
            {
                'tactic': '成功案例',
                'description': '分享成功和节省时间的例子',
                'impact': '高'
            },
            {
                'tactic': '定期沟通',
                'description': '每月通讯和更新',
                'impact': '中'
            }
        ],
        'training': [
            {
                'tactic': '基于角色的培训',
                'description': '为不同用户类型定制的培训',
                'impact': '高'
            },
            {
                'tactic': '自助文档',
                'description': '全面的指南和常见问题',
                'impact': '中'
            },
            {
                'tactic': '答疑时间',
                'description': '与目录团队的定期问答',
                'impact': '中'
            }
        ],
        'integration': [
            {
                'tactic': '工具集成',
                'description': '将目录嵌入现有工具（BI、IDE）',
                'impact': '高'
            },
            {
                'tactic': '工作流嵌入',
                'description': '使目录成为标准流程的一部分',
                'impact': '高'
            },
            {
                'tactic': 'API/SDK 访问',
                'description': '启用编程访问',
                'impact': '中'
            }
        ],
        'incentives': [
            {
                'tactic': '游戏化',
                'description': '贡献的徽章和排行榜',
                'impact': '中'
            },
            {
                'tactic': 'OKR 集成',
                'description': '在团队目标中包含目录指标',
                'impact': '高'
            },
            {
                'tactic': '认可计划',
                'description': '表彰顶级贡献者',
                'impact': '中'
            }
        ]
    }

    @classmethod
    def get_adoption_metrics(cls) -> Dict:
        """定义采用成功指标"""
        return {
            'usage_metrics': {
                'daily_active_users': {
                    'target': '> 30% 的数据用户',
                    'measurement': '每天唯一登录数'
                },
                'search_queries': {
                    'target': '> 每天 100 次',
                    'measurement': '搜索 API 调用'
                },
                'assets_discovered': {
                    'target': '> 每周 50 次',
                    'measurement': '新资产浏览'
                }
            },
            'quality_metrics': {
                'documented_assets': {
                    'target': '> 80%',
                    'measurement': '有描述的资产'
                },
                'owned_assets': {
                    'target': '> 95%',
                    'measurement': '有分配所有者的资产'
                },
                'classified_assets': {
                    'target': '> 90%',
                    'measurement': '已分类的敏感数据'
                }
            },
            'engagement_metrics': {
                'contribution_rate': {
                    'target': '> 20%',
                    'measurement': '编辑元数据的用户'
                },
                'feedback_score': {
                    'target': '> 4.0/5',
                    'measurement': '用户满意度调查'
                },
                'time_to_find': {
                    'target': '< 5 分钟',
                    'measurement': '平均搜索到发现时间'
                }
            }
        }
```

## 面试要点

### 常见问题

**问题1：数据目录和数据字典有什么区别？**

```text
要点：

数据目录：
- 企业级范围
- 包含业务上下文、血缘、使用情况
- 支持发现和治理
- 交互式、可搜索的平台
- 面向所有数据用户

数据字典：
- 数据库/系统特定
- 仅技术元数据（列、类型、约束）
- 静态文档
- 面向开发人员和 DBA

数据目录通常包含数据字典，但提供额外的
上下文、可发现性和治理能力。
```

**问题2：如何确保数据目录中的元数据质量？**

```text
要点：

1. 自动化：
   - 自动化元数据提取
   - 计划刷新周期
   - 模式变更检测

2. 标准：
   - 命名约定
   - 描述模板
   - 必填字段

3. 治理：
   - 所有权分配
   - 审核流程
   - 质量评分

4. 验证：
   - 完整性检查
   - 一致性验证
   - 新鲜度监控

5. 激励：
   - 游戏化
   - OKR 中的指标
   - 认可计划
```

**问题3：实施数据目录的主要挑战是什么？**

```text
要点：

1. 数据源复杂性：
   - 多样的平台和技术
   - 元数据较差的遗留系统
   - 实时与批处理源

2. 元数据质量：
   - 不完整的描述
   - 过时的信息
   - 不一致的术语

3. 用户采用：
   - 变更管理
   - 培训需求
   - 与工作流集成

4. 血缘准确性：
   - 复杂转换
   - 手动流程
   - 跨系统跟踪

5. 治理对齐：
   - 定义所有权
   - 策略执行
   - 合规要求

解决方案：
- 分阶段实施
- 高管支持
- 明确的投资回报展示
- 持续改进文化
```

**问题4：如何处理列级血缘？**

```text
要点：

1. SQL 解析：
   - 解析转换逻辑
   - 提取列引用
   - 跟踪 SELECT、JOIN、WHERE 子句

2. 工具集成：
   - ETL 工具元数据（dbt、Informatica）
   - 查询日志分析
   - 代码库扫描

3. 挑战：
   - 动态 SQL
   - 复杂表达式
   - UDF 和自定义代码

4. 最佳实践：
   - 先从表级开始，再到列级
   - 专注于关键数据路径
   - 结合自动化和手动
   - 与数据工程师验证
```

## 总结

数据目录是现代数据驱动组织的基础设施。主要要点：

1. **核心价值**：支持跨组织的数据发现、理解和信任

2. **元数据管理**：结合技术、业务、运营和社交元数据以获得完整上下文

3. **数据发现**：通过分面、推荐和数据分析实现强大的搜索

4. **数据血缘**：为影响分析、根因分析和合规跟踪数据流

5. **工具选择**：根据规模、生态系统适配和治理需求选择

6. **实施**：遵循分阶段方法，明确指标和利益相关者参与

7. **治理**：建立清晰的角色、职责和质量标准

8. **采用**：通过培训、集成和激励推动采用

实施良好的数据目录可以改变组织发现、理解和治理其数据资产的方式，最终实现更好更快的数据驱动决策。

## 延伸阅读

### 官方文档

- [DataHub 文档](https://datahubproject.io/docs/) - 现代元数据平台
- [Apache Atlas](https://atlas.apache.org/) - Hadoop 生态系统治理
- [Amundsen](https://www.amundsen.io/) - Lyft 的数据发现工具
- [OpenLineage](https://openlineage.io/) - 血缘开放标准

### 书籍

- **"Data Management at Scale"** by Piethein Strengholt - 现代数据架构模式
- **"The Data Warehouse Toolkit"** by Ralph Kimball - 基础数据建模概念
- **"Data Governance"** by John Ladley - 全面的治理框架

### 在线资源

- [数据目录对比指南](https://atlan.com/data-catalog-comparison/) - 工具对比
- [DMBOK（数据管理知识体系）](https://www.dama.org/cpages/body-of-knowledge) - 行业标准
- [现代数据栈指南](https://www.moderndatastack.xyz/) - 工具和架构
