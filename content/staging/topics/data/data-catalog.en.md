---
title: Data Catalog
description: Learn data catalog management and data discovery
track: data
section: data-engineering
difficulty: intermediate
tags:
  - data catalog
  - data governance
  - metadata
  - data discovery
status: imported
origin: old/src/content/docs/data/data-catalog.en.md
divergence: 0.222
issues: []
legacy:
  category: Data
  subcategory: Governance
  order: 24
  lastUpdated: 2026-01-07
---

A data catalog is the cornerstone of modern data governance, serving as a centralized inventory that enables organizations to discover, understand, and trust their data assets. In an era where data volumes are exploding and data sources are proliferating, a well-implemented data catalog transforms chaotic data landscapes into organized, searchable, and governed repositories. We'll cover everything from fundamental concepts to implementation strategies using industry-leading tools.

## Understanding Data Catalogs

### What is a Data Catalog?

A data catalog is a metadata management tool that creates an organized inventory of data assets within an organization. It functions like a library catalog for data, providing search and discovery capabilities, contextual information, and governance controls.

```python
# Core components of a data catalog
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
    """Represents a cataloged data asset"""
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
    """Complete catalog entry with relationships"""
    asset: DataAsset
    schema_info: Dict
    lineage_upstream: List[str] = field(default_factory=list)
    lineage_downstream: List[str] = field(default_factory=list)
    related_assets: List[str] = field(default_factory=list)
    access_permissions: Dict = field(default_factory=dict)
    usage_statistics: Dict = field(default_factory=dict)
```

### Key Capabilities of Data Catalogs

```python
class DataCatalogCapabilities:
    """Core capabilities that define a modern data catalog"""

    CAPABILITIES = {
        'metadata_management': {
            'description': 'Central repository for technical and business metadata',
            'features': [
                'Automated metadata extraction',
                'Manual metadata enrichment',
                'Schema versioning',
                'Custom metadata attributes'
            ]
        },
        'data_discovery': {
            'description': 'Search and browse data assets across the organization',
            'features': [
                'Full-text search',
                'Faceted filtering',
                'Smart recommendations',
                'Data previews'
            ]
        },
        'data_lineage': {
            'description': 'Track data flow from source to consumption',
            'features': [
                'Column-level lineage',
                'Impact analysis',
                'Root cause analysis',
                'Transformation tracking'
            ]
        },
        'business_glossary': {
            'description': 'Standardized business terminology and definitions',
            'features': [
                'Term definitions',
                'Synonyms and aliases',
                'Term relationships',
                'Asset mappings'
            ]
        },
        'data_governance': {
            'description': 'Policy enforcement and compliance management',
            'features': [
                'Data classification',
                'Access controls',
                'Policy definitions',
                'Compliance tracking'
            ]
        },
        'collaboration': {
            'description': 'Enable team communication around data',
            'features': [
                'Comments and discussions',
                'Data asset ratings',
                'Usage documentation',
                'Knowledge sharing'
            ]
        }
    }
```

### Data Catalog vs Data Dictionary vs Business Glossary

```
+------------------+-------------------+-------------------+-------------------+
|     Aspect       |   Data Catalog    |  Data Dictionary  | Business Glossary |
+------------------+-------------------+-------------------+-------------------+
| Scope            | Enterprise-wide   | Database/System   | Organization-wide |
|                  | data assets       | specific          | terminology       |
+------------------+-------------------+-------------------+-------------------+
| Content          | Metadata, lineage,| Column names,     | Business terms,   |
|                  | quality, usage    | data types,       | definitions,      |
|                  |                   | constraints       | relationships     |
+------------------+-------------------+-------------------+-------------------+
| Primary Users    | Data analysts,    | Developers,       | Business users,   |
|                  | scientists, all   | DBAs              | analysts          |
+------------------+-------------------+-------------------+-------------------+
| Purpose          | Data discovery    | Technical         | Common            |
|                  | and governance    | documentation     | understanding     |
+------------------+-------------------+-------------------+-------------------+
| Example          | "Sales data in    | "customer_id:     | "Revenue: Total   |
|                  | Snowflake, owned  | INT, NOT NULL,    | income from       |
|                  | by Sales team"    | FK to customers"  | product sales"    |
+------------------+-------------------+-------------------+-------------------+
```

## Metadata Management

### Types of Metadata

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
    """Technical metadata extracted from data systems"""
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
    """Business context and meaning"""
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
    """Runtime and operational information"""
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
    """User-generated and collaboration metadata"""
    ratings: float
    reviews: List[str]
    usage_count: int
    top_users: List[str]
    related_queries: List[str]
    comments: List[Dict]
    bookmarks: int
    endorsements: List[str]
```

### Automated Metadata Extraction

```python
import sqlalchemy
from typing import Dict, List
import json

class MetadataExtractor:
    """Extract metadata from various data sources"""

    def __init__(self, connection_string: str):
        self.engine = sqlalchemy.create_engine(connection_string)

    def extract_table_metadata(self, schema: str, table: str) -> Dict:
        """Extract comprehensive table metadata"""
        metadata = {
            'schema': schema,
            'table': table,
            'columns': [],
            'constraints': [],
            'indexes': [],
            'statistics': {}
        }

        # Extract column information
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

        # Extract constraints
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
        """Extract table statistics"""
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
        """Extract column-level statistics"""
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

### Metadata Storage Schema

```sql
-- Metadata catalog database schema

-- Core asset registry
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

-- Technical metadata for tables
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

-- Column metadata
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

-- Business glossary terms
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

-- Asset to glossary term mapping
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

-- Tags for flexible categorization
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

-- Usage tracking
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

## Data Discovery

### Search and Discovery Architecture

```python
from elasticsearch import Elasticsearch
from typing import List, Dict, Optional
import json

class DataDiscoveryService:
    """Service for searching and discovering data assets"""

    def __init__(self, es_host: str = "localhost:9200"):
        self.es = Elasticsearch([es_host])
        self.index_name = "data_catalog"

    def create_search_index(self):
        """Create Elasticsearch index with appropriate mappings"""
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
        """Search for data assets with filters and pagination"""

        # Build the search query
        must_clauses = []
        filter_clauses = []

        # Main search query
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

        # Apply filters
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

        # Build final query
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

        # Sort options
        if sort_by == "popularity":
            search_body["sort"] = [{"popularity_score": "desc"}]
        elif sort_by == "quality":
            search_body["sort"] = [{"quality_score": "desc"}]
        elif sort_by == "recent":
            search_body["sort"] = [{"last_updated": "desc"}]
        # Default is relevance (_score)

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
        """Get personalized asset recommendations based on user behavior"""

        # Query for similar assets based on user's recent activity
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

### Data Preview and Profiling

```python
import pandas as pd
from typing import Dict, Any, Optional
import numpy as np

class DataProfiler:
    """Profile data assets for discovery and quality assessment"""

    def __init__(self, connection):
        self.conn = connection

    def profile_table(self, schema: str, table: str, sample_size: int = 10000) -> Dict:
        """Generate comprehensive profile for a table"""

        # Get sample data
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
        """Profile a single column"""
        profile = {
            'data_type': str(series.dtype),
            'total_count': len(series),
            'null_count': series.isnull().sum(),
            'null_percentage': series.isnull().mean() * 100,
            'distinct_count': series.nunique(),
            'uniqueness': series.nunique() / len(series) if len(series) > 0 else 0
        }

        # Type-specific profiling
        if pd.api.types.is_numeric_dtype(series):
            profile.update(self._profile_numeric(series))
        elif pd.api.types.is_datetime64_any_dtype(series):
            profile.update(self._profile_datetime(series))
        else:
            profile.update(self._profile_string(series))

        # Detect potential data quality issues
        profile['quality_issues'] = self._detect_quality_issues(series, profile)

        return profile

    def _profile_numeric(self, series: pd.Series) -> Dict:
        """Profile numeric column"""
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
        """Profile datetime column"""
        clean_series = series.dropna()
        return {
            'min_date': str(clean_series.min()) if len(clean_series) > 0 else None,
            'max_date': str(clean_series.max()) if len(clean_series) > 0 else None,
            'date_range_days': (clean_series.max() - clean_series.min()).days if len(clean_series) > 0 else None
        }

    def _profile_string(self, series: pd.Series) -> Dict:
        """Profile string column"""
        clean_series = series.dropna().astype(str)
        lengths = clean_series.str.len()

        profile = {
            'min_length': lengths.min() if len(lengths) > 0 else None,
            'max_length': lengths.max() if len(lengths) > 0 else None,
            'avg_length': lengths.mean() if len(lengths) > 0 else None,
            'empty_string_count': (clean_series == '').sum()
        }

        # Top values for low cardinality columns
        if series.nunique() <= 20:
            profile['top_values'] = series.value_counts().head(10).to_dict()

        # Pattern detection
        profile['patterns'] = self._detect_patterns(clean_series)

        return profile

    def _detect_patterns(self, series: pd.Series) -> Dict:
        """Detect common patterns in string data"""
        patterns = {}
        sample = series.head(1000)

        # Email pattern
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        email_matches = sample.str.match(email_pattern, na=False).mean()
        if email_matches > 0.8:
            patterns['likely_email'] = True

        # Phone pattern
        phone_pattern = r'^[\d\s\-\+\(\)]+$'
        phone_matches = sample.str.match(phone_pattern, na=False).mean()
        if phone_matches > 0.8 and sample.str.len().mean() > 8:
            patterns['likely_phone'] = True

        # UUID pattern
        uuid_pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
        uuid_matches = sample.str.lower().str.match(uuid_pattern, na=False).mean()
        if uuid_matches > 0.8:
            patterns['likely_uuid'] = True

        return patterns

    def _detect_quality_issues(self, series: pd.Series, profile: Dict) -> List[str]:
        """Detect potential data quality issues"""
        issues = []

        # High null percentage
        if profile['null_percentage'] > 50:
            issues.append(f"High null percentage: {profile['null_percentage']:.1f}%")

        # Low uniqueness for potential ID column
        if 'id' in series.name.lower() and profile['uniqueness'] < 0.99:
            issues.append(f"Low uniqueness for ID column: {profile['uniqueness']:.2%}")

        # All nulls
        if profile['null_percentage'] == 100:
            issues.append("Column is entirely null")

        # Single value
        if profile['distinct_count'] == 1 and profile['null_percentage'] < 100:
            issues.append("Column contains only one distinct value")

        return issues

    def get_data_preview(self, schema: str, table: str, limit: int = 100) -> Dict:
        """Get a preview of data with sample rows"""
        query = f"SELECT * FROM {schema}.{table} LIMIT {limit}"
        df = pd.read_sql(query, self.conn)

        return {
            'columns': list(df.columns),
            'data': df.to_dict('records'),
            'row_count': len(df)
        }
```

## Data Lineage

### Lineage Graph Implementation

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
    """Represents a node in the lineage graph"""
    node_id: str
    node_type: LineageType
    name: str
    qualified_name: str
    properties: Dict = field(default_factory=dict)

@dataclass
class LineageEdge:
    """Represents an edge (transformation) in the lineage graph"""
    source_id: str
    target_id: str
    transformation_type: str  # 'direct', 'derived', 'aggregated', 'filtered', 'joined'
    transformation_logic: Optional[str] = None
    job_id: Optional[str] = None
    column_mappings: List[Dict] = field(default_factory=list)

class LineageGraph:
    """Data lineage graph with analysis capabilities"""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.nodes: Dict[str, LineageNode] = {}
        self.edges: List[LineageEdge] = []

    def add_node(self, node: LineageNode):
        """Add a node to the lineage graph"""
        self.nodes[node.node_id] = node
        self.graph.add_node(
            node.node_id,
            node_type=node.node_type.value,
            name=node.name,
            qualified_name=node.qualified_name,
            **node.properties
        )

    def add_edge(self, edge: LineageEdge):
        """Add an edge to the lineage graph"""
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
        """Get all upstream dependencies"""
        if node_id not in self.graph:
            return {'error': f'Node {node_id} not found'}

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
                        # Skip job nodes but continue traversal
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
        """Get all downstream dependencies"""
        if node_id not in self.graph:
            return {'error': f'Node {node_id} not found'}

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
        """Analyze the impact of changes to a node"""
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
        """Trace back to find root causes"""
        upstream = self.get_upstream_lineage(node_id)

        root_causes = {
            'target_node': node_id,
            'source_tables': [],
            'transformation_chain': [],
            'jobs_involved': []
        }

        # Find root nodes (no predecessors)
        for node in upstream['nodes']:
            full_node = self.nodes.get(node['id'])
            if full_node and len(list(self.graph.predecessors(node['id']))) == 0:
                if full_node.node_type == LineageType.TABLE:
                    root_causes['source_tables'].append({
                        'name': node['name'],
                        'qualified_name': full_node.qualified_name
                    })

        # Build transformation chain
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
        """Get column-level lineage"""
        column_lineage = {
            'table': table_id,
            'column': column_name,
            'upstream_columns': [],
            'downstream_columns': [],
            'transformations': []
        }

        # Check edges for column mappings
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

### SQL Parser for Lineage Extraction

```python
import sqlparse
from sqlparse.sql import IdentifierList, Identifier, Where, Parenthesis
from sqlparse.tokens import Keyword, DML
from typing import List, Dict, Set, Tuple
import re

class SQLLineageExtractor:
    """Extract lineage information from SQL statements"""

    def __init__(self):
        self.cte_tables = {}

    def extract_lineage(self, sql: str) -> Dict:
        """Extract source and target tables from SQL"""
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

        # Convert sets to lists for JSON serialization
        lineage['source_tables'] = list(lineage['source_tables'])
        lineage['target_tables'] = list(lineage['target_tables'])

        return lineage

    def _process_statement(self, statement, lineage: Dict):
        """Process a single SQL statement"""
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
        """Process SELECT statement"""
        # Extract CTEs
        self._extract_ctes(statement, lineage)

        # Extract FROM clause tables
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

        # Extract JOIN tables
        self._extract_joins(statement, lineage)

    def _process_insert(self, statement, lineage: Dict):
        """Process INSERT statement"""
        # Find target table
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

        # Find source tables from SELECT
        for token in statement.tokens:
            if self._is_subselect(token):
                self._process_select(token, lineage)

    def _process_create(self, statement, lineage: Dict):
        """Process CREATE TABLE/VIEW statement"""
        tokens = [t for t in statement.tokens if not t.is_whitespace]

        # Find CREATE TABLE/VIEW name
        for i, token in enumerate(tokens):
            if token.ttype is Keyword and token.value.upper() in ('TABLE', 'VIEW'):
                if i + 1 < len(tokens):
                    target = tokens[i + 1]
                    if isinstance(target, Identifier):
                        lineage['target_tables'].add(self._get_table_name(target))
                    else:
                        lineage['target_tables'].add(target.value)
                break

        # Find source tables from AS SELECT
        for token in statement.tokens:
            if self._is_subselect(token):
                self._process_select(token, lineage)

    def _process_update(self, statement, lineage: Dict):
        """Process UPDATE statement"""
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
        """Process DELETE statement"""
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
        """Extract Common Table Expressions"""
        cte_pattern = r'WITH\s+(\w+)\s+AS\s*\(([\s\S]+?)\)(?:\s*,\s*(\w+)\s+AS\s*\(([\s\S]+?)\))*'
        sql_str = str(statement)

        matches = re.findall(r'(\w+)\s+AS\s*\(', sql_str, re.IGNORECASE)
        for cte_name in matches:
            lineage['cte_definitions'][cte_name] = True
            self.cte_tables[cte_name] = True

    def _extract_joins(self, statement, lineage: Dict):
        """Extract JOIN information"""
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
        """Extract table identifiers from token"""
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
        """Get table name from identifier token"""
        if isinstance(token, Identifier):
            return token.get_real_name()
        return str(token).strip()

    def _is_subselect(self, token) -> bool:
        """Check if token is a subselect"""
        if isinstance(token, Parenthesis):
            for sub_token in token.tokens:
                if sub_token.ttype is DML and sub_token.value.upper() == 'SELECT':
                    return True
        return False


# Example usage
def extract_dbt_lineage(dbt_manifest: Dict) -> List[LineageEdge]:
    """Extract lineage from dbt manifest.json"""
    edges = []

    for node_id, node in dbt_manifest.get('nodes', {}).items():
        if node['resource_type'] in ('model', 'seed', 'source'):
            target_table = node['relation_name']

            # Get dependencies
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

## Data Catalog Tools

### DataHub

DataHub is an open-source metadata platform developed by LinkedIn for data discovery, data observability, and federated governance.

```python
# DataHub integration example
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
    """DataHub data catalog integration"""

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
        """Register a dataset in DataHub"""

        # Create dataset URN
        dataset_urn = make_dataset_urn(platform=platform, name=name, env="PROD")

        # Create schema fields
        schema_fields = []
        for field in schema:
            schema_fields.append(SchemaFieldClass(
                fieldPath=field['name'],
                type=self._map_data_type(field['data_type']),
                nativeDataType=field['data_type'],
                description=field.get('description', ''),
                nullable=field.get('nullable', True)
            ))

        # Create metadata aspects
        aspects = []

        # Dataset properties
        aspects.append(DatasetPropertiesClass(
            description=description,
            customProperties={}
        ))

        # Schema
        aspects.append(SchemaMetadataClass(
            schemaName=name,
            platform=f"urn:li:dataPlatform:{platform}",
            version=0,
            hash="",
            platformSchema={},
            fields=schema_fields
        ))

        # Ownership
        aspects.append(OwnershipClass(
            owners=[
                OwnerClass(
                    owner=f"urn:li:corpuser:{owner}",
                    type=OwnershipTypeClass.DATAOWNER
                )
            ]
        ))

        # Tags
        if tags:
            aspects.append(GlobalTagsClass(
                tags=[
                    TagAssociationClass(tag=f"urn:li:tag:{tag}")
                    for tag in tags
                ]
            ))

        # Glossary terms
        if glossary_terms:
            aspects.append(GlossaryTermsClass(
                terms=[
                    GlossaryTermAssociationClass(urn=f"urn:li:glossaryTerm:{term}")
                    for term in glossary_terms
                ]
            ))

        # Create and emit MCE
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
        """Add lineage relationships"""

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

        # Emit lineage
        self.emitter.emit_mcp(
            entity_urn=downstream_urn,
            aspect_name="upstreamLineage",
            aspect=lineage
        )

    def _map_data_type(self, native_type: str) -> Dict:
        """Map native data types to DataHub types"""
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

Apache Atlas is an open-source metadata management and governance framework for Hadoop ecosystems.

```python
# Apache Atlas integration example
import requests
from typing import Dict, List, Optional
import json

class ApacheAtlasCatalog:
    """Apache Atlas data catalog integration"""

    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.auth = (username, password)
        self.headers = {'Content-Type': 'application/json'}

    def create_entity(self, entity: Dict) -> Dict:
        """Create an entity in Atlas"""
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
        """Create a Hive table entity"""

        # Create column entities
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

        # Create table entity
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
        """Create a lineage process entity"""

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
        """Search for entities"""
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
        """Get lineage for an entity"""
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
        """Add classification to an entity"""
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
        """Create a glossary term"""
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

### Tool Comparison

```
+------------------+----------------+----------------+----------------+----------------+
|     Feature      |    DataHub     |  Apache Atlas  |   Amundsen     |    Alation     |
+------------------+----------------+----------------+----------------+----------------+
| Open Source      | Yes            | Yes            | Yes            | No             |
| License          | Apache 2.0     | Apache 2.0     | Apache 2.0     | Commercial     |
+------------------+----------------+----------------+----------------+----------------+
| Metadata Ingestion                                                                  |
+------------------+----------------+----------------+----------------+----------------+
| Push API         | Yes            | Yes            | Yes            | Yes            |
| Pull Connectors  | 50+            | Hadoop focus   | 20+            | 75+            |
| Real-time        | Yes            | Limited        | No             | Yes            |
+------------------+----------------+----------------+----------------+----------------+
| Discovery                                                                           |
+------------------+----------------+----------------+----------------+----------------+
| Search           | Elasticsearch  | Solr           | Elasticsearch  | Proprietary    |
| Faceted Search   | Yes            | Yes            | Yes            | Yes            |
| Preview          | Yes            | Limited        | Yes            | Yes            |
+------------------+----------------+----------------+----------------+----------------+
| Lineage                                                                             |
+------------------+----------------+----------------+----------------+----------------+
| Table Level      | Yes            | Yes            | Yes            | Yes            |
| Column Level     | Yes            | Limited        | Limited        | Yes            |
| Real-time        | Yes            | No             | No             | Yes            |
+------------------+----------------+----------------+----------------+----------------+
| Governance                                                                          |
+------------------+----------------+----------------+----------------+----------------+
| Classification   | Yes            | Yes            | Limited        | Yes            |
| Access Control   | Yes            | Yes            | Limited        | Yes            |
| Glossary         | Yes            | Yes            | Limited        | Yes            |
| Policies         | Yes            | Limited        | No             | Yes            |
+------------------+----------------+----------------+----------------+----------------+
| Scalability      | High           | Medium         | Medium         | High           |
| Ease of Setup    | Medium         | Complex        | Simple         | Easy           |
| Community        | Active         | Mature         | Active         | N/A            |
+------------------+----------------+----------------+----------------+----------------+
```

## Implementation Strategy

### Data Catalog Architecture

```
+------------------------------------------------------------------+
|                     Data Catalog Architecture                      |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------------+     +-------------------+                   |
|  |   Data Sources    |     |  Metadata Store   |                   |
|  +-------------------+     +-------------------+                   |
|  | - Databases       |     | - PostgreSQL      |                   |
|  | - Data Lakes      |---->| - Graph DB        |                   |
|  | - BI Tools        |     | - Search Index    |                   |
|  | - ETL Pipelines   |     +--------+----------+                   |
|  +-------------------+              |                              |
|           |                         |                              |
|           v                         v                              |
|  +-------------------+     +-------------------+                   |
|  | Metadata Ingestion|     |  Catalog API      |                   |
|  +-------------------+     +-------------------+                   |
|  | - Crawlers        |     | - REST API        |                   |
|  | - Connectors      |     | - GraphQL         |                   |
|  | - Event Listeners |     | - SDK             |                   |
|  +-------------------+     +--------+----------+                   |
|                                     |                              |
|                                     v                              |
|                       +----------------------------+               |
|                       |      Web Application       |               |
|                       +----------------------------+               |
|                       | - Search & Discovery       |               |
|                       | - Lineage Visualization    |               |
|                       | - Data Governance          |               |
|                       | - Collaboration            |               |
|                       +----------------------------+               |
|                                                                    |
+------------------------------------------------------------------+
```

### Implementation Phases

```python
class DataCatalogImplementation:
    """Data catalog implementation framework"""

    IMPLEMENTATION_PHASES = {
        'phase_1_foundation': {
            'duration': '4-6 weeks',
            'objectives': [
                'Deploy catalog platform',
                'Connect core data sources',
                'Import technical metadata'
            ],
            'deliverables': [
                'Catalog infrastructure deployed',
                'Top 10 data sources connected',
                'Automated metadata extraction running'
            ],
            'success_metrics': [
                'Platform uptime > 99%',
                'Core tables cataloged > 80%'
            ]
        },
        'phase_2_enrichment': {
            'duration': '6-8 weeks',
            'objectives': [
                'Add business metadata',
                'Establish data ownership',
                'Create business glossary'
            ],
            'deliverables': [
                'Business descriptions for priority assets',
                'Owner/steward assigned to all assets',
                'Initial glossary with 50+ terms'
            ],
            'success_metrics': [
                'Assets with descriptions > 70%',
                'Assets with owners > 90%'
            ]
        },
        'phase_3_lineage': {
            'duration': '4-6 weeks',
            'objectives': [
                'Implement lineage tracking',
                'Connect ETL tools',
                'Enable impact analysis'
            ],
            'deliverables': [
                'Table-level lineage for key pipelines',
                'Lineage visualization in UI',
                'Impact analysis reports'
            ],
            'success_metrics': [
                'Key tables with lineage > 80%',
                'Lineage depth >= 3 hops'
            ]
        },
        'phase_4_governance': {
            'duration': '6-8 weeks',
            'objectives': [
                'Implement data classification',
                'Define governance policies',
                'Enable compliance tracking'
            ],
            'deliverables': [
                'Classification taxonomy',
                'PII/sensitive data tagged',
                'Access policies defined'
            ],
            'success_metrics': [
                'Sensitive data classified > 95%',
                'Policy violations < 5%'
            ]
        },
        'phase_5_adoption': {
            'duration': 'Ongoing',
            'objectives': [
                'Drive user adoption',
                'Integrate with workflows',
                'Continuous improvement'
            ],
            'deliverables': [
                'Training materials',
                'Workflow integrations',
                'Usage dashboards'
            ],
            'success_metrics': [
                'Weekly active users > 50%',
                'Search satisfaction > 4.0/5'
            ]
        }
    }

    @classmethod
    def get_checklist(cls, phase: str) -> List[Dict]:
        """Get implementation checklist for a phase"""
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

### Data Catalog Governance Model

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
    """Data governance role definition"""
    role: Role
    responsibilities: List[str]
    permissions: List[str]

class CatalogGovernanceModel:
    """Governance model for data catalog"""

    ROLES = {
        Role.DATA_OWNER: GovernanceRole(
            role=Role.DATA_OWNER,
            responsibilities=[
                "Define business meaning and context",
                "Approve data access requests",
                "Ensure data quality standards",
                "Define retention policies"
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
                "Maintain data quality",
                "Enrich metadata",
                "Manage glossary terms",
                "Monitor data usage"
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
                "Manage technical metadata",
                "Configure data sources",
                "Maintain lineage",
                "Handle technical issues"
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
                "Search and discover data",
                "Request data access",
                "Provide feedback",
                "Report data issues"
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
                "Administer catalog platform",
                "Manage users and roles",
                "Configure policies",
                "Monitor system health"
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
        """Generate RACI matrix for catalog governance"""
        activities = [
            "Create new data asset",
            "Edit business metadata",
            "Edit technical metadata",
            "Approve data access",
            "Create glossary terms",
            "Manage classification",
            "Configure data sources",
            "Run quality checks",
            "Report data issues"
        ]

        raci = {
            activity: {} for activity in activities
        }

        # Define RACI (Responsible, Accountable, Consulted, Informed)
        raci["Create new data asset"] = {
            Role.DATA_OWNER: "A",
            Role.DATA_STEWARD: "R",
            Role.DATA_CUSTODIAN: "C",
            Role.CATALOG_ADMIN: "I"
        }
        raci["Edit business metadata"] = {
            Role.DATA_OWNER: "A",
            Role.DATA_STEWARD: "R",
            Role.DATA_CONSUMER: "C"
        }
        raci["Edit technical metadata"] = {
            Role.DATA_CUSTODIAN: "R",
            Role.DATA_STEWARD: "C",
            Role.CATALOG_ADMIN: "A"
        }
        raci["Approve data access"] = {
            Role.DATA_OWNER: "A/R",
            Role.DATA_STEWARD: "C",
            Role.DATA_CONSUMER: "I"
        }

        return raci
```

## Best Practices

### Metadata Quality Guidelines

```python
class MetadataQualityGuidelines:
    """Guidelines for maintaining metadata quality"""

    GUIDELINES = {
        'descriptions': {
            'min_length': 50,
            'max_length': 500,
            'required_elements': [
                'What the data represents',
                'How it is used',
                'Update frequency'
            ],
            'avoid': [
                'Duplicate of name',
                'Technical jargon without explanation',
                'Outdated information'
            ]
        },
        'naming_conventions': {
            'tables': {
                'pattern': r'^[a-z][a-z0-9_]*$',
                'prefix_rules': {
                    'dim_': 'Dimension tables',
                    'fact_': 'Fact tables',
                    'stg_': 'Staging tables',
                    'raw_': 'Raw data tables'
                }
            },
            'columns': {
                'pattern': r'^[a-z][a-z0-9_]*$',
                'suffix_rules': {
                    '_id': 'Identifier columns',
                    '_at': 'Timestamp columns',
                    '_date': 'Date columns',
                    '_flag': 'Boolean columns',
                    '_count': 'Count metrics',
                    '_amount': 'Monetary values'
                }
            }
        },
        'classification': {
            'required_for': ['PII', 'financial', 'health'],
            'review_frequency': 'quarterly',
            'approval_required': True
        },
        'ownership': {
            'required': True,
            'owner_must_be': 'active_employee',
            'backup_owner_required': True,
            'review_frequency': 'annually'
        }
    }

    @classmethod
    def validate_description(cls, description: str) -> Dict:
        """Validate description against guidelines"""
        guidelines = cls.GUIDELINES['descriptions']
        issues = []
        score = 100

        if len(description) < guidelines['min_length']:
            issues.append(f"Description too short (min {guidelines['min_length']} chars)")
            score -= 30

        if len(description) > guidelines['max_length']:
            issues.append(f"Description too long (max {guidelines['max_length']} chars)")
            score -= 10

        # Check for required elements
        for element in guidelines['required_elements']:
            # Simple heuristic check
            keywords = element.lower().split()
            if not any(kw in description.lower() for kw in keywords):
                issues.append(f"Missing: {element}")
                score -= 15

        return {
            'valid': len(issues) == 0,
            'score': max(0, score),
            'issues': issues
        }
```

### Adoption and Change Management

```python
class CatalogAdoptionStrategy:
    """Strategy for driving data catalog adoption"""

    ADOPTION_TACTICS = {
        'awareness': [
            {
                'tactic': 'Executive sponsorship',
                'description': 'Secure visible executive support',
                'impact': 'high'
            },
            {
                'tactic': 'Success stories',
                'description': 'Share wins and time-saved examples',
                'impact': 'high'
            },
            {
                'tactic': 'Regular communications',
                'description': 'Monthly newsletters and updates',
                'impact': 'medium'
            }
        ],
        'training': [
            {
                'tactic': 'Role-based training',
                'description': 'Tailored sessions for different user types',
                'impact': 'high'
            },
            {
                'tactic': 'Self-service documentation',
                'description': 'Comprehensive guides and FAQs',
                'impact': 'medium'
            },
            {
                'tactic': 'Office hours',
                'description': 'Regular Q&A sessions with catalog team',
                'impact': 'medium'
            }
        ],
        'integration': [
            {
                'tactic': 'Tool integration',
                'description': 'Embed catalog in existing tools (BI, IDE)',
                'impact': 'high'
            },
            {
                'tactic': 'Workflow embedding',
                'description': 'Make catalog part of standard processes',
                'impact': 'high'
            },
            {
                'tactic': 'API/SDK access',
                'description': 'Enable programmatic access',
                'impact': 'medium'
            }
        ],
        'incentives': [
            {
                'tactic': 'Gamification',
                'description': 'Badges and leaderboards for contributions',
                'impact': 'medium'
            },
            {
                'tactic': 'OKR integration',
                'description': 'Include catalog metrics in team goals',
                'impact': 'high'
            },
            {
                'tactic': 'Recognition program',
                'description': 'Highlight top contributors',
                'impact': 'medium'
            }
        ]
    }

    @classmethod
    def get_adoption_metrics(cls) -> Dict:
        """Define adoption success metrics"""
        return {
            'usage_metrics': {
                'daily_active_users': {
                    'target': '> 30% of data users',
                    'measurement': 'Unique logins per day'
                },
                'search_queries': {
                    'target': '> 100 per day',
                    'measurement': 'Search API calls'
                },
                'assets_discovered': {
                    'target': '> 50 per week',
                    'measurement': 'New asset views'
                }
            },
            'quality_metrics': {
                'documented_assets': {
                    'target': '> 80%',
                    'measurement': 'Assets with descriptions'
                },
                'owned_assets': {
                    'target': '> 95%',
                    'measurement': 'Assets with assigned owners'
                },
                'classified_assets': {
                    'target': '> 90%',
                    'measurement': 'Sensitive data classified'
                }
            },
            'engagement_metrics': {
                'contribution_rate': {
                    'target': '> 20%',
                    'measurement': 'Users who edit metadata'
                },
                'feedback_score': {
                    'target': '> 4.0/5',
                    'measurement': 'User satisfaction surveys'
                },
                'time_to_find': {
                    'target': '< 5 minutes',
                    'measurement': 'Average search to discovery time'
                }
            }
        }
```

## Interview Key Points

### Common Questions

**Q1: What is the difference between a data catalog and a data dictionary?**

```text
Key Points:

Data Catalog:
- Enterprise-wide scope
- Includes business context, lineage, usage
- Enables discovery and governance
- Interactive, searchable platform
- Targets all data users

Data Dictionary:
- Database/system specific
- Technical metadata only (columns, types, constraints)
- Static documentation
- Targets developers and DBAs

A data catalog often incorporates data dictionaries but provides
additional context, discoverability, and governance capabilities.
```

**Q2: How do you ensure metadata quality in a data catalog?**

```text
Key Points:

1. Automation:
   - Automated metadata extraction
   - Scheduled refresh cycles
   - Schema change detection

2. Standards:
   - Naming conventions
   - Description templates
   - Required fields

3. Governance:
   - Ownership assignment
   - Review processes
   - Quality scoring

4. Validation:
   - Completeness checks
   - Consistency validation
   - Freshness monitoring

5. Incentives:
   - Gamification
   - Metrics in OKRs
   - Recognition programs
```

**Q3: What are the key challenges in implementing a data catalog?**

```text
Key Points:

1. Data Source Complexity:
   - Diverse platforms and technologies
   - Legacy systems with poor metadata
   - Real-time vs batch sources

2. Metadata Quality:
   - Incomplete descriptions
   - Stale information
   - Inconsistent terminology

3. User Adoption:
   - Change management
   - Training requirements
   - Integration with workflows

4. Lineage Accuracy:
   - Complex transformations
   - Manual processes
   - Cross-system tracking

5. Governance Alignment:
   - Defining ownership
   - Policy enforcement
   - Compliance requirements

Solutions:
- Phased implementation
- Executive sponsorship
- Clear ROI demonstration
- Continuous improvement culture
```

**Q4: How do you approach column-level lineage?**

```text
Key Points:

1. SQL Parsing:
   - Parse transformation logic
   - Extract column references
   - Track SELECT, JOIN, WHERE clauses

2. Tool Integration:
   - ETL tool metadata (dbt, Informatica)
   - Query logs analysis
   - Code repository scanning

3. Challenges:
   - Dynamic SQL
   - Complex expressions
   - UDFs and custom code

4. Best Practices:
   - Start with table-level, then column
   - Focus on critical data paths
   - Combine automated + manual
   - Validate with data engineers
```

## Summary

A data catalog is essential infrastructure for modern data-driven organizations. Key takeaways:

1. **Core Value**: Enables data discovery, understanding, and trust across the organization

2. **Metadata Management**: Combine technical, business, operational, and social metadata for complete context

3. **Data Discovery**: Implement powerful search with facets, recommendations, and data profiling

4. **Data Lineage**: Track data flow for impact analysis, root cause analysis, and compliance

5. **Tool Selection**: Choose based on scale, ecosystem fit, and governance requirements

6. **Implementation**: Follow phased approach with clear metrics and stakeholder engagement

7. **Governance**: Establish clear roles, responsibilities, and quality standards

8. **Adoption**: Drive adoption through training, integration, and incentives

A well-implemented data catalog transforms how organizations discover, understand, and govern their data assets, ultimately enabling better and faster data-driven decisions.

## Further Reading

### Official Documentation

- [DataHub Documentation](https://datahubproject.io/docs/) - Modern metadata platform
- [Apache Atlas](https://atlas.apache.org/) - Hadoop ecosystem governance
- [Amundsen](https://www.amundsen.io/) - Lyft's data discovery tool
- [OpenLineage](https://openlineage.io/) - Open standard for lineage

### Books

- **"Data Management at Scale"** by Piethein Strengholt - Modern data architecture patterns
- **"The Data Warehouse Toolkit"** by Ralph Kimball - Foundational data modeling concepts
- **"Data Governance"** by John Ladley - Comprehensive governance framework

### Online Resources

- [Data Catalog Comparison Guide](https://atlan.com/data-catalog-comparison/) - Tool comparison
- [DMBOK (Data Management Body of Knowledge)](https://www.dama.org/cpages/body-of-knowledge) - Industry standards
- [Modern Data Stack Guide](https://www.moderndatastack.xyz/) - Tools and architectures
