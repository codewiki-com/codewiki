---
title: Feature Platform Building
description: A comprehensive guide to building feature platforms for ML - from feature stores to real-time feature serving
track: datascience
section: deployment
difficulty: advanced
tags:
  - Feature Store
  - Feature Platform
  - Feast
  - Tecton
  - MLOps
  - Feature Engineering
status: imported
origin: old/src/content/docs/data/feature-platform.en.md
divergence: 0.23
issues: []
legacy:
  category: Data
  subcategory: MLOps
  order: 26
  lastUpdated: 2026-01-20
---

Feature platforms are the backbone of production machine learning systems, providing a centralized infrastructure for managing, storing, and serving features across training and inference pipelines. Building a robust feature platform enables teams to accelerate ML development, ensure consistency between training and serving, and improve collaboration across data science and engineering teams. You'll learn how to design, build, and operate feature platforms that scale with your organization's ML needs.

## What is a Feature Platform

### Understanding Features in ML

Features are the transformed, processed inputs that machine learning models use to make predictions. Raw data rarely goes directly into models; instead, it undergoes transformation into features that capture meaningful patterns.

```python
# Raw data example
raw_user_data = {
    "user_id": "u123",
    "created_at": "2024-01-15",
    "transactions": [
        {"amount": 150.0, "timestamp": "2024-06-01"},
        {"amount": 75.0, "timestamp": "2024-06-15"},
        {"amount": 200.0, "timestamp": "2024-06-20"}
    ]
}

# Derived features
user_features = {
    "user_id": "u123",
    "account_age_days": 156,
    "transaction_count_30d": 3,
    "avg_transaction_amount_30d": 141.67,
    "max_transaction_amount_30d": 200.0,
    "days_since_last_transaction": 5
}
```

### Feature Store vs Feature Platform

While often used interchangeably, these terms have distinct meanings:

| Aspect | Feature Store | Feature Platform |
|--------|---------------|------------------|
| Scope | Storage and retrieval | End-to-end feature lifecycle |
| Components | Online/offline stores | Store + compute + registry + monitoring |
| Focus | Data access | Feature operations |
| Complexity | Lower | Higher |
| Use Case | Basic ML pipelines | Enterprise ML systems |

**Feature Store** is a specialized database that stores and serves feature values for ML models. It typically includes:
- Offline store for batch training data
- Online store for low-latency inference
- Feature registry for discovery

**Feature Platform** encompasses the entire feature lifecycle:
- Feature definition and computation
- Feature storage and serving
- Feature discovery and governance
- Monitoring and quality management

### Why You Need a Feature Platform

Organizations without centralized feature management face several challenges:

```
Without Feature Platform:
┌─────────────────────────────────────────────────────────────┐
│  Data Scientist A          Data Scientist B                 │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │ Feature Code v1 │      │ Feature Code v2 │   Duplicate  │
│  │ (Python)        │      │ (Python)        │   effort     │
│  └────────┬────────┘      └────────┬────────┘              │
│           │                        │                        │
│  ┌────────▼────────┐      ┌────────▼────────┐              │
│  │ Training        │      │ Training        │   Inconsistent│
│  │ Pipeline        │      │ Pipeline        │   features    │
│  └────────┬────────┘      └────────┬────────┘              │
│           │                        │                        │
│  ┌────────▼────────┐      ┌────────▼────────┐              │
│  │ Serving Code    │      │ Serving Code    │   Training-   │
│  │ (Java)          │      │ (Scala)         │   serving     │
│  └─────────────────┘      └─────────────────┘   skew        │
└─────────────────────────────────────────────────────────────┘

With Feature Platform:
┌─────────────────────────────────────────────────────────────┐
│              Feature Platform                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Feature Registry & Definitions              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Feature Computation Engine              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────┬───────┴───────┬──────────────┐           │
│  │ Offline Store│               │ Online Store │           │
│  │ (Training)   │               │ (Serving)    │           │
│  └──────────────┘               └──────────────┘           │
│                                                             │
│  Data Scientist A & B → Same features, consistent results   │
└─────────────────────────────────────────────────────────────┘
```

**Key benefits:**

1. **Feature Reuse**: Write once, use across multiple models
2. **Consistency**: Same feature logic for training and serving
3. **Discovery**: Find and understand existing features
4. **Governance**: Track lineage, ownership, and access
5. **Efficiency**: Reduce compute costs through sharing

## Core Principles

### Offline and Online Features

Feature platforms must support two distinct access patterns:

**Offline Features (Batch):**
- Used for model training
- Historical point-in-time data
- High throughput, relaxed latency
- Typically stored in data lakes/warehouses

**Online Features (Real-time):**
- Used for model inference
- Current feature values
- Low latency (< 10ms typical)
- Stored in key-value stores

```python
from datetime import datetime, timedelta

class FeatureStore:
    """Simplified dual-store feature access."""

    def __init__(self, offline_store, online_store):
        self.offline = offline_store  # e.g., BigQuery, Snowflake
        self.online = online_store    # e.g., Redis, DynamoDB

    def get_historical_features(
        self,
        entity_df: "pd.DataFrame",
        features: list[str],
        timestamp_column: str = "event_timestamp"
    ) -> "pd.DataFrame":
        """
        Retrieve historical features for training.

        Args:
            entity_df: DataFrame with entity keys and timestamps
            features: List of feature names to retrieve
            timestamp_column: Column containing event timestamps

        Returns:
            DataFrame with features joined at point-in-time
        """
        # Point-in-time join logic
        return self.offline.point_in_time_join(
            entity_df, features, timestamp_column
        )

    def get_online_features(
        self,
        entity_keys: dict[str, list],
        features: list[str]
    ) -> dict:
        """
        Retrieve current features for inference.

        Args:
            entity_keys: Dictionary of entity columns to values
            features: List of feature names to retrieve

        Returns:
            Dictionary of feature values
        """
        # Low-latency lookup
        return self.online.multi_get(entity_keys, features)
```

### Point-in-Time Correctness

Point-in-time correctness prevents data leakage by ensuring features reflect only information available at prediction time.

```
Timeline Example:
─────────────────────────────────────────────────────────────────────
Time:    T-7d      T-3d      T-1d      T (now)    T+1d
Events:  Purchase  Purchase  Purchase  Prediction Future
         $100      $50       $75       ???        Purchase
                                                   $200
─────────────────────────────────────────────────────────────────────

For prediction at time T:
✓ Include: Purchases at T-7d, T-3d, T-1d
✗ Exclude: Purchase at T+1d (future data = DATA LEAKAGE!)

Correct feature calculation at T:
- total_purchases_7d = $100 + $50 + $75 = $225
- purchase_count_7d = 3
```

**Implementation with point-in-time joins:**

```python
import pandas as pd
from datetime import datetime

def point_in_time_join(
    entity_df: pd.DataFrame,
    feature_df: pd.DataFrame,
    entity_column: str,
    entity_timestamp: str,
    feature_timestamp: str,
    ttl_days: int = None
) -> pd.DataFrame:
    """
    Join features to entities respecting temporal boundaries.

    For each entity row, finds the most recent feature values
    that were available BEFORE the entity timestamp.
    """
    # Ensure datetime types
    entity_df = entity_df.copy()
    feature_df = feature_df.copy()
    entity_df[entity_timestamp] = pd.to_datetime(entity_df[entity_timestamp])
    feature_df[feature_timestamp] = pd.to_datetime(feature_df[feature_timestamp])

    # Sort features by timestamp for as-of join
    feature_df = feature_df.sort_values(feature_timestamp)

    # Merge with tolerance
    result = pd.merge_asof(
        entity_df.sort_values(entity_timestamp),
        feature_df,
        left_on=entity_timestamp,
        right_on=feature_timestamp,
        by=entity_column,
        direction='backward',  # Only look at past data
        tolerance=pd.Timedelta(days=ttl_days) if ttl_days else None
    )

    return result

# Example usage
entities = pd.DataFrame({
    'user_id': ['u1', 'u1', 'u2'],
    'event_timestamp': ['2024-06-15', '2024-06-20', '2024-06-18']
})

features = pd.DataFrame({
    'user_id': ['u1', 'u1', 'u2', 'u1'],
    'feature_timestamp': ['2024-06-10', '2024-06-14', '2024-06-12', '2024-06-19'],
    'purchase_count_7d': [5, 8, 3, 12]
})

# Result will have purchase_count_7d values that were known
# at each entity's event_timestamp (no future leakage)
result = point_in_time_join(
    entities, features,
    'user_id', 'event_timestamp', 'feature_timestamp',
    ttl_days=30
)
```

### Feature Lineage

Feature lineage tracks the complete history of how features are created:

```
Feature Lineage Graph:
┌────────────────┐
│  Raw Sources   │
├────────────────┤
│ transactions   │──┐
│ user_profiles  │──┼──┐
│ click_events   │──┤  │
└────────────────┘  │  │
                    │  │
         ┌──────────▼──▼─────────┐
         │ Transformation Layer   │
         ├────────────────────────┤
         │ • Aggregations         │
         │ • Joins                │
         │ • Encoding             │
         └───────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌────────┐    ┌────────────┐    ┌──────────┐
│user_   │    │transaction_│    │engagement│
│features│    │features    │    │_features │
└────────┘    └────────────┘    └──────────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
              ┌──────▼──────┐
              │ ML Models   │
              │ • Fraud     │
              │ • Recommend │
              │ • Churn     │
              └─────────────┘
```

**Lineage metadata example:**

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class FeatureLineage:
    """Tracks the origin and transformation of a feature."""

    feature_name: str
    version: str
    created_at: datetime
    created_by: str

    # Source information
    source_tables: list[str] = field(default_factory=list)
    source_features: list[str] = field(default_factory=list)

    # Transformation
    transformation_query: Optional[str] = None
    transformation_code: Optional[str] = None

    # Dependencies
    upstream_features: list[str] = field(default_factory=list)
    downstream_features: list[str] = field(default_factory=list)
    downstream_models: list[str] = field(default_factory=list)

    # Quality
    data_quality_tests: list[str] = field(default_factory=list)
    sla_freshness_hours: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "feature_name": self.feature_name,
            "version": self.version,
            "source_tables": self.source_tables,
            "upstream_features": self.upstream_features,
            "downstream_models": self.downstream_models,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat()
        }

# Example lineage
user_purchase_features = FeatureLineage(
    feature_name="user_purchase_count_30d",
    version="v2.1",
    created_at=datetime(2024, 6, 1),
    created_by="data-team",
    source_tables=["raw.transactions", "raw.users"],
    transformation_query="""
        SELECT
            user_id,
            COUNT(*) as purchase_count_30d
        FROM transactions
        WHERE transaction_date >= CURRENT_DATE - 30
        GROUP BY user_id
    """,
    downstream_models=["fraud_detection_v3", "churn_prediction_v2"],
    sla_freshness_hours=24
)
```

## Core Components

### Feature Definition

Features should be defined declaratively with clear specifications:

```python
from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional
from datetime import timedelta

class ValueType(Enum):
    INT64 = "int64"
    FLOAT64 = "float64"
    STRING = "string"
    BOOL = "bool"
    ARRAY_INT64 = "array_int64"
    ARRAY_FLOAT64 = "array_float64"
    ARRAY_STRING = "array_string"
    EMBEDDING = "embedding"

class AggregationType(Enum):
    SUM = "sum"
    AVG = "avg"
    COUNT = "count"
    MAX = "max"
    MIN = "min"
    LAST = "last"
    FIRST = "first"
    DISTINCT_COUNT = "distinct_count"
    PERCENTILE = "percentile"

@dataclass
class FeatureDefinition:
    """Declarative feature specification."""

    name: str
    description: str
    value_type: ValueType

    # Entity information
    entity: str
    entity_key: str

    # Source
    source_table: str
    source_column: Optional[str] = None

    # Transformation
    aggregation: Optional[AggregationType] = None
    window: Optional[timedelta] = None
    filter_condition: Optional[str] = None

    # Metadata
    owner: str = "unknown"
    tags: list[str] = None

    # Quality
    default_value: Any = None
    validation_rules: list[str] = None

    def __post_init__(self):
        self.tags = self.tags or []
        self.validation_rules = self.validation_rules or []

# Example feature definitions
feature_definitions = [
    FeatureDefinition(
        name="user_purchase_count_7d",
        description="Number of purchases by user in last 7 days",
        value_type=ValueType.INT64,
        entity="user",
        entity_key="user_id",
        source_table="transactions",
        source_column="transaction_id",
        aggregation=AggregationType.COUNT,
        window=timedelta(days=7),
        owner="ml-platform-team",
        tags=["user", "transaction", "behavioral"],
        default_value=0,
        validation_rules=["value >= 0"]
    ),
    FeatureDefinition(
        name="user_avg_order_value_30d",
        description="Average order value for user in last 30 days",
        value_type=ValueType.FLOAT64,
        entity="user",
        entity_key="user_id",
        source_table="transactions",
        source_column="amount",
        aggregation=AggregationType.AVG,
        window=timedelta(days=30),
        owner="ml-platform-team",
        tags=["user", "transaction", "monetary"],
        default_value=0.0,
        validation_rules=["value >= 0", "value <= 100000"]
    ),
    FeatureDefinition(
        name="user_embedding_128d",
        description="User behavior embedding from deep learning model",
        value_type=ValueType.EMBEDDING,
        entity="user",
        entity_key="user_id",
        source_table="ml_embeddings.user_vectors",
        owner="recommendation-team",
        tags=["user", "embedding", "deep-learning"]
    )
]
```

### Feature Registry

The feature registry is the central catalog for discovering and managing features:

```python
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional
import json

class FeatureRegistry(ABC):
    """Abstract base class for feature registries."""

    @abstractmethod
    def register_feature(self, feature: FeatureDefinition) -> str:
        """Register a new feature, returns feature ID."""
        pass

    @abstractmethod
    def get_feature(self, name: str, version: str = "latest") -> FeatureDefinition:
        """Retrieve feature definition by name."""
        pass

    @abstractmethod
    def search_features(
        self,
        query: str = None,
        tags: list[str] = None,
        entity: str = None,
        owner: str = None
    ) -> list[FeatureDefinition]:
        """Search features with filters."""
        pass

    @abstractmethod
    def list_feature_versions(self, name: str) -> list[str]:
        """List all versions of a feature."""
        pass


class SQLFeatureRegistry(FeatureRegistry):
    """SQL-backed feature registry implementation."""

    def __init__(self, connection_string: str):
        self.conn_string = connection_string
        self._init_schema()

    def _init_schema(self):
        """Initialize registry tables."""
        schema = """
        CREATE TABLE IF NOT EXISTS features (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            version VARCHAR(50) NOT NULL,
            definition JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            UNIQUE(name, version)
        );

        CREATE INDEX IF NOT EXISTS idx_features_name ON features(name);
        CREATE INDEX IF NOT EXISTS idx_features_tags ON features USING GIN ((definition->'tags'));

        CREATE TABLE IF NOT EXISTS feature_dependencies (
            id SERIAL PRIMARY KEY,
            feature_id INTEGER REFERENCES features(id),
            depends_on_feature_id INTEGER REFERENCES features(id),
            dependency_type VARCHAR(50)
        );
        """
        # Execute schema creation
        # self._execute(schema)

    def register_feature(self, feature: FeatureDefinition) -> str:
        """Register a new feature version."""
        # Check if feature exists to determine version
        existing_versions = self.list_feature_versions(feature.name)

        if existing_versions:
            # Increment version
            latest = max(existing_versions, key=lambda v: int(v.replace('v', '')))
            new_version = f"v{int(latest.replace('v', '')) + 1}"
        else:
            new_version = "v1"

        # Insert into registry
        query = """
        INSERT INTO features (name, version, definition, created_by)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """
        # feature_id = self._execute(query, (
        #     feature.name,
        #     new_version,
        #     json.dumps(feature.__dict__, default=str),
        #     feature.owner
        # ))

        return f"{feature.name}:{new_version}"

    def search_features(
        self,
        query: str = None,
        tags: list[str] = None,
        entity: str = None,
        owner: str = None
    ) -> list[FeatureDefinition]:
        """Search features with multiple filters."""

        sql = """
        SELECT DISTINCT ON (name) name, version, definition
        FROM features
        WHERE status = 'active'
        """
        params = []

        if query:
            sql += " AND (name ILIKE %s OR definition->>'description' ILIKE %s)"
            params.extend([f"%{query}%", f"%{query}%"])

        if tags:
            sql += " AND definition->'tags' ?| %s"
            params.append(tags)

        if entity:
            sql += " AND definition->>'entity' = %s"
            params.append(entity)

        if owner:
            sql += " AND definition->>'owner' = %s"
            params.append(owner)

        sql += " ORDER BY name, version DESC"

        # results = self._execute(sql, params)
        # return [self._row_to_feature(row) for row in results]
        return []

    def get_feature(self, name: str, version: str = "latest") -> FeatureDefinition:
        """Get specific feature version."""
        if version == "latest":
            query = """
            SELECT definition FROM features
            WHERE name = %s AND status = 'active'
            ORDER BY version DESC LIMIT 1
            """
        else:
            query = """
            SELECT definition FROM features
            WHERE name = %s AND version = %s AND status = 'active'
            """
        # Execute and return
        pass

    def list_feature_versions(self, name: str) -> list[str]:
        """List all versions of a feature."""
        query = """
        SELECT version FROM features
        WHERE name = %s
        ORDER BY version DESC
        """
        # return [row['version'] for row in self._execute(query, (name,))]
        return []
```

### Feature Serving

Feature serving requires different strategies for online and offline access:

```python
from abc import ABC, abstractmethod
from typing import Any
import redis
import time

class OnlineFeatureStore(ABC):
    """Abstract interface for online feature stores."""

    @abstractmethod
    def get_features(
        self,
        entity_key: str,
        entity_value: str,
        features: list[str]
    ) -> dict[str, Any]:
        """Get features for a single entity."""
        pass

    @abstractmethod
    def get_features_batch(
        self,
        entity_key: str,
        entity_values: list[str],
        features: list[str]
    ) -> list[dict[str, Any]]:
        """Get features for multiple entities."""
        pass

    @abstractmethod
    def write_features(
        self,
        entity_key: str,
        entity_value: str,
        features: dict[str, Any],
        timestamp: int = None
    ) -> None:
        """Write features for an entity."""
        pass


class RedisOnlineStore(OnlineFeatureStore):
    """Redis-based online feature store."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        prefix: str = "features"
    ):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.prefix = prefix

    def _make_key(self, entity_key: str, entity_value: str) -> str:
        """Create Redis key for entity."""
        return f"{self.prefix}:{entity_key}:{entity_value}"

    def get_features(
        self,
        entity_key: str,
        entity_value: str,
        features: list[str]
    ) -> dict[str, Any]:
        """Get features with sub-millisecond latency."""
        key = self._make_key(entity_key, entity_value)

        if not features:
            # Get all features
            result = self.client.hgetall(key)
        else:
            # Get specific features
            values = self.client.hmget(key, features)
            result = dict(zip(features, values))

        # Parse values (Redis stores everything as strings)
        return self._parse_values(result)

    def get_features_batch(
        self,
        entity_key: str,
        entity_values: list[str],
        features: list[str]
    ) -> list[dict[str, Any]]:
        """Batch get using Redis pipeline."""
        pipe = self.client.pipeline()

        for entity_value in entity_values:
            key = self._make_key(entity_key, entity_value)
            if features:
                pipe.hmget(key, features)
            else:
                pipe.hgetall(key)

        results = pipe.execute()

        parsed_results = []
        for i, result in enumerate(results):
            if isinstance(result, list):
                # hmget returns list
                parsed = dict(zip(features, result))
            else:
                # hgetall returns dict
                parsed = result
            parsed_results.append(self._parse_values(parsed))

        return parsed_results

    def write_features(
        self,
        entity_key: str,
        entity_value: str,
        features: dict[str, Any],
        timestamp: int = None
    ) -> None:
        """Write features with optional timestamp."""
        key = self._make_key(entity_key, entity_value)

        # Add metadata
        features_with_meta = {
            **{k: self._serialize_value(v) for k, v in features.items()},
            "_updated_at": timestamp or int(time.time() * 1000)
        }

        self.client.hset(key, mapping=features_with_meta)

    def _serialize_value(self, value: Any) -> str:
        """Serialize value for Redis storage."""
        if isinstance(value, (list, dict)):
            import json
            return json.dumps(value)
        return str(value)

    def _parse_values(self, data: dict) -> dict:
        """Parse string values back to Python types."""
        import json
        parsed = {}
        for k, v in data.items():
            if v is None:
                parsed[k] = None
            elif v.startswith('[') or v.startswith('{'):
                try:
                    parsed[k] = json.loads(v)
                except json.JSONDecodeError:
                    parsed[k] = v
            elif v.replace('.', '').replace('-', '').isdigit():
                parsed[k] = float(v) if '.' in v else int(v)
            elif v.lower() in ('true', 'false'):
                parsed[k] = v.lower() == 'true'
            else:
                parsed[k] = v
        return parsed


class FeatureServer:
    """High-level feature serving API."""

    def __init__(
        self,
        online_store: OnlineFeatureStore,
        registry: FeatureRegistry,
        default_timeout_ms: int = 50
    ):
        self.online_store = online_store
        self.registry = registry
        self.timeout_ms = default_timeout_ms
        self._feature_cache = {}  # Cache feature definitions

    def get_online_features(
        self,
        feature_refs: list[str],
        entity_rows: list[dict]
    ) -> "FeatureResponse":
        """
        Get online features for inference.

        Args:
            feature_refs: List of feature references (e.g., ["user:purchase_count_7d"])
            entity_rows: List of entity key-value dictionaries

        Returns:
            FeatureResponse with feature values and metadata
        """
        start_time = time.time()

        # Parse feature references
        parsed_features = self._parse_feature_refs(feature_refs)

        # Group by entity type for efficient batch retrieval
        results = []
        for entity_row in entity_rows:
            row_features = {}
            for entity_type, features in parsed_features.items():
                if entity_type in entity_row:
                    entity_value = entity_row[entity_type]
                    fetched = self.online_store.get_features(
                        entity_type,
                        str(entity_value),
                        features
                    )
                    row_features.update(fetched)
            results.append(row_features)

        latency_ms = (time.time() - start_time) * 1000

        return FeatureResponse(
            features=results,
            metadata={
                "latency_ms": latency_ms,
                "feature_count": len(feature_refs),
                "entity_count": len(entity_rows)
            }
        )

    def _parse_feature_refs(self, refs: list[str]) -> dict[str, list[str]]:
        """Parse feature references into entity -> features mapping."""
        parsed = {}
        for ref in refs:
            if ':' in ref:
                entity, feature = ref.split(':', 1)
            else:
                # Default entity from registry
                feature_def = self._get_cached_definition(ref)
                entity = feature_def.entity if feature_def else "default"
                feature = ref

            if entity not in parsed:
                parsed[entity] = []
            parsed[entity].append(feature)

        return parsed

    def _get_cached_definition(self, name: str) -> Optional[FeatureDefinition]:
        """Get feature definition with caching."""
        if name not in self._feature_cache:
            try:
                self._feature_cache[name] = self.registry.get_feature(name)
            except Exception:
                self._feature_cache[name] = None
        return self._feature_cache[name]


@dataclass
class FeatureResponse:
    """Response from feature serving."""
    features: list[dict[str, Any]]
    metadata: dict[str, Any]
```

### Feature Monitoring

Monitoring ensures feature quality in production:

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
import statistics

@dataclass
class FeatureStats:
    """Statistical summary of feature values."""
    feature_name: str
    timestamp: datetime
    count: int
    null_count: int
    null_rate: float
    mean: Optional[float] = None
    std: Optional[float] = None
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    p50: Optional[float] = None
    p95: Optional[float] = None
    p99: Optional[float] = None
    unique_count: Optional[int] = None

class FeatureMonitor:
    """Monitor feature quality and drift."""

    def __init__(self, metrics_store, alert_service):
        self.metrics = metrics_store
        self.alerts = alert_service
        self.baselines = {}  # Feature name -> baseline stats

    def compute_stats(
        self,
        feature_name: str,
        values: list
    ) -> FeatureStats:
        """Compute statistics for feature values."""
        non_null = [v for v in values if v is not None]
        numeric = [v for v in non_null if isinstance(v, (int, float))]

        stats = FeatureStats(
            feature_name=feature_name,
            timestamp=datetime.now(),
            count=len(values),
            null_count=len(values) - len(non_null),
            null_rate=(len(values) - len(non_null)) / len(values) if values else 0
        )

        if numeric:
            sorted_vals = sorted(numeric)
            stats.mean = statistics.mean(numeric)
            stats.std = statistics.stdev(numeric) if len(numeric) > 1 else 0
            stats.min_value = sorted_vals[0]
            stats.max_value = sorted_vals[-1]
            stats.p50 = sorted_vals[len(sorted_vals) // 2]
            stats.p95 = sorted_vals[int(len(sorted_vals) * 0.95)]
            stats.p99 = sorted_vals[int(len(sorted_vals) * 0.99)]

        if non_null:
            stats.unique_count = len(set(non_null))

        return stats

    def check_drift(
        self,
        feature_name: str,
        current_stats: FeatureStats,
        threshold: float = 0.1
    ) -> dict:
        """Check for feature drift against baseline."""
        baseline = self.baselines.get(feature_name)
        if not baseline:
            return {"drift_detected": False, "message": "No baseline available"}

        alerts = []

        # Check null rate drift
        if abs(current_stats.null_rate - baseline.null_rate) > threshold:
            alerts.append({
                "type": "null_rate_drift",
                "baseline": baseline.null_rate,
                "current": current_stats.null_rate
            })

        # Check mean drift (for numeric features)
        if current_stats.mean is not None and baseline.mean is not None:
            if baseline.mean != 0:
                mean_drift = abs(current_stats.mean - baseline.mean) / abs(baseline.mean)
                if mean_drift > threshold:
                    alerts.append({
                        "type": "mean_drift",
                        "baseline": baseline.mean,
                        "current": current_stats.mean,
                        "drift_pct": mean_drift
                    })

        # Check distribution drift via min/max
        if current_stats.max_value and baseline.max_value:
            if current_stats.max_value > baseline.max_value * (1 + threshold):
                alerts.append({
                    "type": "max_value_drift",
                    "baseline": baseline.max_value,
                    "current": current_stats.max_value
                })

        return {
            "drift_detected": len(alerts) > 0,
            "alerts": alerts,
            "timestamp": datetime.now().isoformat()
        }

    def set_baseline(self, feature_name: str, stats: FeatureStats):
        """Set baseline statistics for drift detection."""
        self.baselines[feature_name] = stats

    def monitor_freshness(
        self,
        feature_name: str,
        last_update: datetime,
        sla_hours: int
    ) -> dict:
        """Check if feature data meets freshness SLA."""
        age_hours = (datetime.now() - last_update).total_seconds() / 3600

        is_stale = age_hours > sla_hours

        if is_stale:
            self.alerts.send(
                feature_name=feature_name,
                alert_type="staleness",
                message=f"Feature {feature_name} is {age_hours:.1f}h old, SLA is {sla_hours}h"
            )

        return {
            "feature_name": feature_name,
            "last_update": last_update.isoformat(),
            "age_hours": age_hours,
            "sla_hours": sla_hours,
            "is_stale": is_stale
        }
```

## Code Examples with Feast

Feast is the most popular open-source feature store. Here's how to use it:

### Feast Setup and Configuration

```python
# feature_repo/feature_store.yaml
"""
project: my_ml_project
registry: data/registry.db
provider: local
online_store:
  type: redis
  connection_string: localhost:6379
offline_store:
  type: file
entity_key_serialization_version: 2
"""

# feature_repo/features.py
from datetime import timedelta
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64, String

# Define entities
user = Entity(
    name="user",
    join_keys=["user_id"],
    description="User entity"
)

driver = Entity(
    name="driver",
    join_keys=["driver_id"],
    description="Driver entity"
)

# Define data sources
user_stats_source = FileSource(
    name="user_stats_source",
    path="data/user_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# Define feature views
user_stats_fv = FeatureView(
    name="user_stats",
    entities=[user],
    ttl=timedelta(days=365),
    schema=[
        Field(name="purchase_count_7d", dtype=Int64),
        Field(name="purchase_count_30d", dtype=Int64),
        Field(name="avg_order_value_30d", dtype=Float32),
        Field(name="total_spend_lifetime", dtype=Float32),
        Field(name="favorite_category", dtype=String),
    ],
    source=user_stats_source,
    online=True,
    tags={"team": "ml-platform", "tier": "critical"}
)
```

### Feast Operations

```python
from feast import FeatureStore
from datetime import datetime
import pandas as pd

# Initialize feature store
store = FeatureStore(repo_path="feature_repo")

# Apply feature definitions (deploy)
# Run: feast apply

# Get historical features for training
entity_df = pd.DataFrame({
    "user_id": ["user_1", "user_2", "user_3"],
    "event_timestamp": [
        datetime(2024, 6, 1),
        datetime(2024, 6, 15),
        datetime(2024, 6, 20)
    ]
})

training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "user_stats:purchase_count_7d",
        "user_stats:purchase_count_30d",
        "user_stats:avg_order_value_30d"
    ]
).to_df()

print("Training features:")
print(training_df)

# Materialize features to online store
store.materialize(
    start_date=datetime(2024, 1, 1),
    end_date=datetime.now()
)

# Or incrementally
store.materialize_incremental(end_date=datetime.now())

# Get online features for inference
feature_vector = store.get_online_features(
    features=[
        "user_stats:purchase_count_7d",
        "user_stats:avg_order_value_30d"
    ],
    entity_rows=[
        {"user_id": "user_1"},
        {"user_id": "user_2"}
    ]
).to_dict()

print("\nOnline features:")
print(feature_vector)
```

### Feast with Streaming Features

```python
from feast import FeatureView, StreamSource, KafkaSource, Field
from feast.types import Float32, Int64
from datetime import timedelta

# Kafka source for streaming features
user_activity_stream = KafkaSource(
    name="user_activity_stream",
    kafka_bootstrap_servers="localhost:9092",
    topic="user_activity",
    timestamp_field="event_timestamp",
    batch_source=user_stats_source,  # Fallback for historical
    message_format=JsonFormat(
        schema_json="""
        {
            "type": "record",
            "name": "UserActivity",
            "fields": [
                {"name": "user_id", "type": "string"},
                {"name": "event_timestamp", "type": "long"},
                {"name": "page_views", "type": "int"},
                {"name": "clicks", "type": "int"}
            ]
        }
        """
    )
)

# Streaming feature view
user_realtime_fv = FeatureView(
    name="user_realtime_stats",
    entities=[user],
    ttl=timedelta(hours=1),
    schema=[
        Field(name="page_views_1h", dtype=Int64),
        Field(name="clicks_1h", dtype=Int64),
        Field(name="click_rate_1h", dtype=Float32),
    ],
    source=user_activity_stream,
    online=True
)
```

### Building Custom Feature Platform Components

For organizations that need custom solutions beyond Feast:

```python
from abc import ABC, abstractmethod
from typing import Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

class FeatureComputeEngine(ABC):
    """Abstract interface for feature computation."""

    @abstractmethod
    def compute_batch(
        self,
        feature_def: FeatureDefinition,
        start_time: datetime,
        end_time: datetime
    ) -> "pd.DataFrame":
        """Compute features for a time range."""
        pass

    @abstractmethod
    async def compute_streaming(
        self,
        feature_def: FeatureDefinition,
        event: dict
    ) -> dict:
        """Compute features from streaming event."""
        pass


class SparkFeatureEngine(FeatureComputeEngine):
    """Spark-based feature computation engine."""

    def __init__(self, spark_session):
        self.spark = spark_session

    def compute_batch(
        self,
        feature_def: FeatureDefinition,
        start_time: datetime,
        end_time: datetime
    ) -> "pd.DataFrame":
        """Compute batch features using Spark SQL."""

        # Generate SQL based on feature definition
        sql = self._generate_feature_sql(feature_def, start_time, end_time)

        # Execute on Spark
        result_df = self.spark.sql(sql)

        return result_df.toPandas()

    def _generate_feature_sql(
        self,
        feature_def: FeatureDefinition,
        start_time: datetime,
        end_time: datetime
    ) -> str:
        """Generate SQL for feature computation."""

        window_seconds = int(feature_def.window.total_seconds()) if feature_def.window else 0

        agg_map = {
            AggregationType.COUNT: "COUNT",
            AggregationType.SUM: "SUM",
            AggregationType.AVG: "AVG",
            AggregationType.MAX: "MAX",
            AggregationType.MIN: "MIN",
            AggregationType.DISTINCT_COUNT: "COUNT(DISTINCT"
        }

        agg_func = agg_map.get(feature_def.aggregation, "COUNT")

        sql = f"""
        SELECT
            {feature_def.entity_key},
            {agg_func}({feature_def.source_column or '*'}) as {feature_def.name},
            MAX(event_timestamp) as feature_timestamp
        FROM {feature_def.source_table}
        WHERE event_timestamp BETWEEN '{start_time}' AND '{end_time}'
        """

        if feature_def.filter_condition:
            sql += f" AND {feature_def.filter_condition}"

        sql += f" GROUP BY {feature_def.entity_key}"

        return sql


class FeatureMaterializer:
    """Handles materialization from offline to online store."""

    def __init__(
        self,
        compute_engine: FeatureComputeEngine,
        offline_store,
        online_store: OnlineFeatureStore,
        registry: FeatureRegistry
    ):
        self.compute = compute_engine
        self.offline = offline_store
        self.online = online_store
        self.registry = registry
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def materialize_feature(
        self,
        feature_name: str,
        start_time: datetime,
        end_time: datetime
    ) -> dict:
        """Materialize a single feature to online store."""

        # Get feature definition
        feature_def = self.registry.get_feature(feature_name)

        # Compute batch features
        feature_df = await asyncio.get_event_loop().run_in_executor(
            self.executor,
            lambda: self.compute.compute_batch(feature_def, start_time, end_time)
        )

        # Write to online store
        materialized_count = 0
        for _, row in feature_df.iterrows():
            entity_value = str(row[feature_def.entity_key])
            features = {feature_name: row[feature_name]}

            self.online.write_features(
                entity_key=feature_def.entity_key,
                entity_value=entity_value,
                features=features,
                timestamp=int(row.get('feature_timestamp', datetime.now()).timestamp() * 1000)
            )
            materialized_count += 1

        return {
            "feature_name": feature_name,
            "rows_materialized": materialized_count,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }

    async def materialize_all(
        self,
        start_time: datetime,
        end_time: datetime,
        tags: list[str] = None
    ) -> list[dict]:
        """Materialize all features matching criteria."""

        # Get features to materialize
        features = self.registry.search_features(tags=tags)

        # Materialize in parallel
        tasks = [
            self.materialize_feature(f.name, start_time, end_time)
            for f in features
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        return [r for r in results if not isinstance(r, Exception)]
```

## Best Practices

### Feature Naming Conventions

Consistent naming makes features discoverable and self-documenting:

```python
# Feature naming pattern:
# {entity}_{metric}_{aggregation}_{window}

# Good examples:
feature_names = [
    "user_purchase_count_7d",           # user entity, count aggregation, 7-day window
    "user_purchase_sum_30d",            # user entity, sum aggregation, 30-day window
    "user_session_avg_duration_24h",    # user entity, average, 24-hour window
    "item_view_count_1h",               # item entity, count, 1-hour window
    "merchant_rating_avg_lifetime",     # merchant entity, average, all-time
    "user_item_interaction_score",      # cross-entity feature
]

# Bad examples:
bad_names = [
    "feature1",                         # Non-descriptive
    "userPurchaseCount",                # Inconsistent casing
    "usr_purch_cnt_7d",                 # Over-abbreviated
    "user_purchase_count",              # Missing time window
]

class FeatureNameValidator:
    """Validate feature names against conventions."""

    VALID_ENTITIES = {"user", "item", "merchant", "driver", "order", "session"}
    VALID_AGGREGATIONS = {"count", "sum", "avg", "max", "min", "last", "first", "distinct"}
    VALID_WINDOWS = {"1h", "6h", "12h", "24h", "7d", "14d", "30d", "90d", "lifetime"}

    def validate(self, name: str) -> tuple[bool, list[str]]:
        """Validate feature name and return errors."""
        errors = []
        parts = name.split("_")

        if len(parts) < 3:
            errors.append("Name must have at least 3 parts: entity_metric_window")
            return False, errors

        # Check entity (first part)
        if parts[0] not in self.VALID_ENTITIES:
            errors.append(f"Unknown entity '{parts[0]}'. Valid: {self.VALID_ENTITIES}")

        # Check for time window (last part)
        if parts[-1] not in self.VALID_WINDOWS:
            errors.append(f"Missing or invalid time window. Valid: {self.VALID_WINDOWS}")

        # Check casing (should be snake_case)
        if name != name.lower():
            errors.append("Name should be lowercase snake_case")

        return len(errors) == 0, errors
```

### Version Management

Version features properly to maintain backwards compatibility:

```python
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class VersionStatus(Enum):
    EXPERIMENTAL = "experimental"  # Testing
    STABLE = "stable"              # Production ready
    DEPRECATED = "deprecated"      # Being phased out
    ARCHIVED = "archived"          # No longer used

@dataclass
class FeatureVersion:
    """Feature version metadata."""
    feature_name: str
    version: str
    status: VersionStatus
    created_at: datetime
    deprecated_at: datetime = None
    replacement_version: str = None
    breaking_changes: list[str] = None

    def __post_init__(self):
        self.breaking_changes = self.breaking_changes or []

class FeatureVersionManager:
    """Manage feature versions with migration support."""

    def __init__(self, registry: FeatureRegistry):
        self.registry = registry
        self.versions: dict[str, list[FeatureVersion]] = {}

    def create_version(
        self,
        feature_name: str,
        feature_def: FeatureDefinition,
        breaking_changes: list[str] = None
    ) -> FeatureVersion:
        """Create a new feature version."""

        # Get existing versions
        existing = self.versions.get(feature_name, [])

        # Determine version number
        if not existing:
            version_num = "v1"
        elif breaking_changes:
            # Major version bump for breaking changes
            last_major = max(int(v.version.split('.')[0].replace('v', ''))
                           for v in existing)
            version_num = f"v{last_major + 1}"
        else:
            # Minor version bump
            last_version = existing[-1].version
            parts = last_version.replace('v', '').split('.')
            if len(parts) == 1:
                version_num = f"{last_version}.1"
            else:
                version_num = f"v{parts[0]}.{int(parts[1]) + 1}"

        new_version = FeatureVersion(
            feature_name=feature_name,
            version=version_num,
            status=VersionStatus.EXPERIMENTAL,
            created_at=datetime.now(),
            breaking_changes=breaking_changes
        )

        # Register in store
        self.registry.register_feature(feature_def)

        if feature_name not in self.versions:
            self.versions[feature_name] = []
        self.versions[feature_name].append(new_version)

        return new_version

    def deprecate_version(
        self,
        feature_name: str,
        version: str,
        replacement: str = None
    ):
        """Mark a version as deprecated."""
        versions = self.versions.get(feature_name, [])
        for v in versions:
            if v.version == version:
                v.status = VersionStatus.DEPRECATED
                v.deprecated_at = datetime.now()
                v.replacement_version = replacement
                break

    def get_latest_stable(self, feature_name: str) -> FeatureVersion:
        """Get the latest stable version of a feature."""
        versions = self.versions.get(feature_name, [])
        stable = [v for v in versions if v.status == VersionStatus.STABLE]
        return stable[-1] if stable else None
```

### Feature Sharing

Enable cross-team feature sharing with proper governance:

```python
from dataclasses import dataclass
from enum import Enum

class AccessLevel(Enum):
    PUBLIC = "public"        # Anyone can use
    TEAM = "team"            # Team members only
    RESTRICTED = "restricted" # Requires approval
    PRIVATE = "private"      # Owner only

@dataclass
class FeatureAccessPolicy:
    """Access control for features."""
    feature_name: str
    owner_team: str
    access_level: AccessLevel
    approved_teams: list[str] = None
    approved_users: list[str] = None

    def can_access(self, user: str, team: str) -> bool:
        """Check if user/team can access the feature."""
        if self.access_level == AccessLevel.PUBLIC:
            return True
        if self.access_level == AccessLevel.TEAM:
            return team == self.owner_team
        if self.access_level == AccessLevel.RESTRICTED:
            return (
                team in (self.approved_teams or []) or
                user in (self.approved_users or [])
            )
        return False

class FeatureCatalog:
    """Searchable catalog for feature discovery."""

    def __init__(self, registry: FeatureRegistry):
        self.registry = registry
        self.access_policies: dict[str, FeatureAccessPolicy] = {}

    def search(
        self,
        query: str = None,
        tags: list[str] = None,
        entity: str = None,
        user: str = None,
        team: str = None
    ) -> list[dict]:
        """Search features with access control."""

        features = self.registry.search_features(
            query=query,
            tags=tags,
            entity=entity
        )

        # Filter by access
        accessible = []
        for feature in features:
            policy = self.access_policies.get(feature.name)
            if not policy or policy.can_access(user, team):
                accessible.append({
                    "name": feature.name,
                    "description": feature.description,
                    "entity": feature.entity,
                    "owner": feature.owner,
                    "tags": feature.tags,
                    "access_level": policy.access_level.value if policy else "public"
                })

        return accessible

    def get_feature_documentation(self, feature_name: str) -> dict:
        """Get comprehensive feature documentation."""
        feature = self.registry.get_feature(feature_name)

        return {
            "name": feature.name,
            "description": feature.description,
            "entity": feature.entity,
            "value_type": feature.value_type.value,
            "aggregation": feature.aggregation.value if feature.aggregation else None,
            "window": str(feature.window) if feature.window else None,
            "owner": feature.owner,
            "tags": feature.tags,
            "source": feature.source_table,
            "validation_rules": feature.validation_rules,
            "example_values": self._get_example_values(feature_name),
            "usage_stats": self._get_usage_stats(feature_name)
        }

    def _get_example_values(self, feature_name: str) -> list:
        """Get sample feature values."""
        # Sample from online/offline store
        return []

    def _get_usage_stats(self, feature_name: str) -> dict:
        """Get feature usage statistics."""
        return {
            "models_using": 0,
            "daily_queries": 0,
            "last_accessed": None
        }
```

## Common Pitfalls

### Training-Serving Skew

Training-serving skew occurs when features behave differently in training vs production:

```python
# PROBLEM 1: Different computation logic
# Training code (Python)
def compute_avg_purchase_training(df):
    return df.groupby('user_id')['amount'].mean()

# Serving code (Java) - Different implementation
# public double computeAvgPurchase(List<Purchase> purchases) {
#     return purchases.stream().mapToDouble(p -> p.amount).average().orElse(0);
# }
# Issue: Division by zero handling differs!

# SOLUTION: Single source of truth
class FeatureComputer:
    """Unified feature computation for train and serve."""

    def compute_avg_purchase(self, amounts: list[float]) -> float:
        """
        Compute average purchase with consistent null handling.
        Used by both training pipeline and serving endpoint.
        """
        if not amounts:
            return 0.0  # Explicit default

        valid_amounts = [a for a in amounts if a is not None and a > 0]
        if not valid_amounts:
            return 0.0

        return sum(valid_amounts) / len(valid_amounts)

# PROBLEM 2: Time zone inconsistencies
# Training: UTC timestamps
# Serving: Local time zone
# Solution: Always use UTC, convert at boundaries

# PROBLEM 3: Data type mismatches
# Training: float64
# Serving: float32 (precision loss)
# Solution: Explicit type contracts

@dataclass
class FeatureContract:
    """Contract ensuring train-serve consistency."""
    name: str
    dtype: str  # Explicit type: "float32", "int64", etc.
    default_value: Any
    null_handling: str  # "zero", "mean", "error"
    precision: int = None  # Decimal places for floats

    def validate_value(self, value: Any) -> tuple[bool, Any]:
        """Validate and coerce value to contract spec."""
        if value is None:
            if self.null_handling == "error":
                raise ValueError(f"Null not allowed for {self.name}")
            return True, self.default_value

        # Type coercion
        if self.dtype == "float32":
            value = float(value)
            if self.precision:
                value = round(value, self.precision)
        elif self.dtype == "int64":
            value = int(value)

        return True, value
```

### Data Leakage

Data leakage introduces information from the future into training:

```python
# LEAKAGE EXAMPLE 1: Target encoding with full dataset
def bad_target_encoding(df, column, target):
    """WRONG: Uses entire dataset including test."""
    means = df.groupby(column)[target].mean()
    return df[column].map(means)

def safe_target_encoding(train_df, column, target, smoothing=10):
    """CORRECT: Only uses training data, with smoothing."""
    global_mean = train_df[target].mean()
    agg = train_df.groupby(column)[target].agg(['sum', 'count'])

    # Smoothed mean
    smooth_mean = (agg['sum'] + smoothing * global_mean) / (agg['count'] + smoothing)

    return smooth_mean

# LEAKAGE EXAMPLE 2: Features computed after event
# BAD: Using order_completed_at for features predicting order success
# order was only completed AFTER the prediction should be made

# GOOD: Only use features available at prediction time
def get_features_for_prediction(user_id, prediction_time):
    """Get only features available before prediction time."""
    return {
        "orders_completed_before": count_orders(
            user_id,
            end_time=prediction_time  # Not including future!
        ),
        "avg_rating_to_date": avg_rating(
            user_id,
            end_time=prediction_time
        )
    }

# LEAKAGE EXAMPLE 3: Aggregation windows including future
# BAD: 7-day moving average centered on current day
# GOOD: 7-day moving average looking backward only

def safe_rolling_features(df, timestamp_col, value_col, window_days):
    """Compute rolling features without future data."""
    df = df.sort_values(timestamp_col)

    return df[value_col].rolling(
        window=f'{window_days}D',
        min_periods=1,
        closed='left'  # Excludes current point
    ).mean()
```

### Feature Computation Consistency

Ensure consistent computation across environments:

```python
import hashlib
import json

class FeatureValidator:
    """Validate feature computation consistency."""

    def __init__(self):
        self.reference_outputs = {}

    def register_reference(
        self,
        feature_name: str,
        input_data: dict,
        expected_output: Any
    ):
        """Register reference input/output pair."""
        key = self._make_key(feature_name, input_data)
        self.reference_outputs[key] = expected_output

    def validate_computation(
        self,
        feature_name: str,
        input_data: dict,
        computed_output: Any,
        tolerance: float = 1e-6
    ) -> tuple[bool, str]:
        """Validate computed output matches reference."""
        key = self._make_key(feature_name, input_data)

        if key not in self.reference_outputs:
            return True, "No reference for validation"

        expected = self.reference_outputs[key]

        # Numeric comparison with tolerance
        if isinstance(expected, (int, float)):
            if abs(computed_output - expected) > tolerance:
                return False, f"Expected {expected}, got {computed_output}"
        elif computed_output != expected:
            return False, f"Expected {expected}, got {computed_output}"

        return True, "Validation passed"

    def _make_key(self, feature_name: str, input_data: dict) -> str:
        """Create hash key for input."""
        content = json.dumps({"feature": feature_name, "input": input_data}, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

# Integration test example
def test_feature_consistency():
    """Test that feature computation is consistent across environments."""

    validator = FeatureValidator()

    # Register known good outputs (from validated training run)
    validator.register_reference(
        "user_purchase_count_7d",
        {"user_id": "test_user", "amounts": [100, 200, 50]},
        expected_output=3
    )

    # Test Python computation
    python_result = compute_purchase_count([100, 200, 50])
    valid, msg = validator.validate_computation(
        "user_purchase_count_7d",
        {"user_id": "test_user", "amounts": [100, 200, 50]},
        python_result
    )
    assert valid, msg

    # Test SQL computation (via same inputs)
    # This ensures consistency between batch and real-time
```

## Performance Considerations

### Online Serving Latency

Low-latency feature serving is critical for real-time inference:

```python
import time
import asyncio
from typing import Any
from functools import lru_cache

class OptimizedFeatureServer:
    """Performance-optimized feature server."""

    def __init__(self, redis_cluster, local_cache_size: int = 10000):
        self.redis = redis_cluster
        self.local_cache_size = local_cache_size

        # Multi-level caching
        self._local_cache = {}  # L1: In-memory
        self._cache_stats = {"hits": 0, "misses": 0}

    @lru_cache(maxsize=1000)
    def _get_feature_schema(self, feature_name: str) -> dict:
        """Cache feature schemas (rarely change)."""
        return self.registry.get_feature(feature_name)

    async def get_features_optimized(
        self,
        entity_keys: list[dict],
        features: list[str],
        timeout_ms: int = 10
    ) -> list[dict]:
        """
        Get features with optimized latency.

        Target: p99 < 10ms for typical requests
        """
        start = time.perf_counter()

        # Check local cache first (L1)
        results = []
        uncached_indices = []

        for i, entity in enumerate(entity_keys):
            cache_key = self._make_cache_key(entity, features)
            if cache_key in self._local_cache:
                results.append(self._local_cache[cache_key])
                self._cache_stats["hits"] += 1
            else:
                results.append(None)
                uncached_indices.append(i)
                self._cache_stats["misses"] += 1

        if not uncached_indices:
            return results  # All from cache

        # Fetch uncached from Redis (L2)
        uncached_entities = [entity_keys[i] for i in uncached_indices]

        try:
            remote_results = await asyncio.wait_for(
                self._fetch_from_redis_batch(uncached_entities, features),
                timeout=timeout_ms / 1000
            )

            # Update results and cache
            for idx, result in zip(uncached_indices, remote_results):
                results[idx] = result
                cache_key = self._make_cache_key(entity_keys[idx], features)
                self._update_local_cache(cache_key, result)

        except asyncio.TimeoutError:
            # Return defaults on timeout
            for idx in uncached_indices:
                results[idx] = self._get_default_features(features)

        latency = (time.perf_counter() - start) * 1000
        self._record_latency(latency)

        return results

    async def _fetch_from_redis_batch(
        self,
        entities: list[dict],
        features: list[str]
    ) -> list[dict]:
        """Batch fetch from Redis using pipeline."""
        pipe = self.redis.pipeline()

        for entity in entities:
            key = f"features:{entity.get('user_id', entity.get('item_id'))}"
            pipe.hmget(key, features)

        results = await pipe.execute()

        return [
            dict(zip(features, values))
            for values in results
        ]

    def _make_cache_key(self, entity: dict, features: list[str]) -> str:
        """Create cache key."""
        entity_str = ":".join(f"{k}={v}" for k, v in sorted(entity.items()))
        features_str = ",".join(sorted(features))
        return f"{entity_str}|{features_str}"

    def _update_local_cache(self, key: str, value: dict):
        """Update local cache with eviction."""
        if len(self._local_cache) >= self.local_cache_size:
            # Simple LRU: remove oldest
            oldest_key = next(iter(self._local_cache))
            del self._local_cache[oldest_key]
        self._local_cache[key] = value

    def _get_default_features(self, features: list[str]) -> dict:
        """Get default values for features."""
        return {f: None for f in features}

    def _record_latency(self, latency_ms: float):
        """Record latency for monitoring."""
        # Push to metrics system
        pass

    def get_cache_stats(self) -> dict:
        """Return cache statistics."""
        total = self._cache_stats["hits"] + self._cache_stats["misses"]
        return {
            "hit_rate": self._cache_stats["hits"] / total if total > 0 else 0,
            "total_requests": total,
            "local_cache_size": len(self._local_cache)
        }
```

### Batch Processing Throughput

Optimize batch feature computation for training:

```python
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp

class BatchFeatureComputer:
    """High-throughput batch feature computation."""

    def __init__(self, spark_session, num_workers: int = None):
        self.spark = spark_session
        self.num_workers = num_workers or mp.cpu_count()

    def compute_features_parallel(
        self,
        feature_defs: list[FeatureDefinition],
        start_date: str,
        end_date: str
    ) -> dict:
        """Compute multiple features in parallel."""

        # Group features by source table for efficient reads
        by_source = {}
        for feature in feature_defs:
            source = feature.source_table
            if source not in by_source:
                by_source[source] = []
            by_source[source].append(feature)

        results = {}

        for source, features in by_source.items():
            # Read source once
            source_df = self.spark.read.parquet(source).filter(
                f"event_date BETWEEN '{start_date}' AND '{end_date}'"
            )
            source_df.cache()  # Cache for multiple aggregations

            # Compute all features from this source
            for feature in features:
                result_df = self._compute_single_feature(source_df, feature)
                results[feature.name] = result_df

            source_df.unpersist()

        return results

    def _compute_single_feature(self, df, feature: FeatureDefinition):
        """Compute single feature with Spark optimizations."""

        # Use Spark SQL for complex aggregations
        df.createOrReplaceTempView("source_data")

        window_expr = ""
        if feature.window:
            window_days = feature.window.days
            window_expr = f"AND event_timestamp >= current_timestamp() - INTERVAL {window_days} DAY"

        agg_expr = self._get_agg_expression(feature)

        sql = f"""
        SELECT
            {feature.entity_key},
            {agg_expr} as {feature.name},
            current_timestamp() as computed_at
        FROM source_data
        WHERE 1=1 {window_expr}
        GROUP BY {feature.entity_key}
        """

        return self.spark.sql(sql)

    def _get_agg_expression(self, feature: FeatureDefinition) -> str:
        """Generate aggregation expression."""
        col = feature.source_column or "*"
        agg_map = {
            AggregationType.COUNT: f"COUNT({col})",
            AggregationType.SUM: f"SUM({col})",
            AggregationType.AVG: f"AVG({col})",
            AggregationType.MAX: f"MAX({col})",
            AggregationType.MIN: f"MIN({col})",
            AggregationType.DISTINCT_COUNT: f"COUNT(DISTINCT {col})"
        }
        return agg_map.get(feature.aggregation, f"COUNT({col})")


# Optimal Spark configuration for feature computation
spark_config = {
    "spark.sql.adaptive.enabled": "true",
    "spark.sql.adaptive.coalescePartitions.enabled": "true",
    "spark.sql.shuffle.partitions": "auto",
    "spark.sql.files.maxPartitionBytes": "128MB",
    "spark.sql.broadcastTimeout": "600",
}
```

### Storage Cost Optimization

Manage storage costs effectively:

```python
from datetime import datetime, timedelta
from enum import Enum

class StorageTier(Enum):
    HOT = "hot"      # Frequent access, low latency
    WARM = "warm"    # Moderate access
    COLD = "cold"    # Rare access, cheap storage

class FeatureStorageManager:
    """Manage feature storage lifecycle and costs."""

    def __init__(self, online_store, offline_store, archive_store):
        self.online = online_store    # Redis/DynamoDB
        self.offline = offline_store  # S3/GCS Parquet
        self.archive = archive_store  # S3 Glacier/GCS Archive

    def apply_retention_policy(
        self,
        feature_name: str,
        online_retention_days: int = 7,
        offline_retention_days: int = 365,
        archive_retention_days: int = 2555  # ~7 years
    ):
        """Apply tiered retention policy."""

        now = datetime.now()

        # 1. Archive old offline data
        archive_cutoff = now - timedelta(days=offline_retention_days)
        self._move_to_archive(feature_name, before=archive_cutoff)

        # 2. Delete from online store
        online_cutoff = now - timedelta(days=online_retention_days)
        self._cleanup_online(feature_name, before=online_cutoff)

        # 3. Delete very old archives
        delete_cutoff = now - timedelta(days=archive_retention_days)
        self._delete_archives(feature_name, before=delete_cutoff)

    def estimate_storage_cost(
        self,
        feature_name: str,
        entity_count: int,
        avg_feature_size_bytes: int
    ) -> dict:
        """Estimate monthly storage costs."""

        # Pricing estimates (vary by provider)
        pricing = {
            StorageTier.HOT: 0.25,    # $/GB/month (Redis)
            StorageTier.WARM: 0.023,  # $/GB/month (S3 Standard)
            StorageTier.COLD: 0.004   # $/GB/month (S3 Glacier)
        }

        total_size_gb = (entity_count * avg_feature_size_bytes) / (1024 ** 3)

        # Assume distribution across tiers
        distribution = {
            StorageTier.HOT: 0.1,   # 10% in online
            StorageTier.WARM: 0.3,  # 30% in offline
            StorageTier.COLD: 0.6   # 60% in archive
        }

        costs = {}
        for tier, fraction in distribution.items():
            tier_size = total_size_gb * fraction
            costs[tier.value] = tier_size * pricing[tier]

        return {
            "feature_name": feature_name,
            "total_size_gb": total_size_gb,
            "monthly_costs": costs,
            "total_monthly": sum(costs.values())
        }

    def optimize_storage(self, feature_name: str) -> dict:
        """Suggest storage optimizations."""

        suggestions = []

        # Check for duplicate features
        similar = self._find_similar_features(feature_name)
        if similar:
            suggestions.append({
                "type": "deduplication",
                "message": f"Consider consolidating with similar features: {similar}"
            })

        # Check access patterns
        access_stats = self._get_access_stats(feature_name)
        if access_stats.get("daily_reads", 0) < 10:
            suggestions.append({
                "type": "tier_down",
                "message": "Low access feature - consider moving to cold storage"
            })

        # Check compression
        compression_ratio = self._estimate_compression_benefit(feature_name)
        if compression_ratio > 2:
            suggestions.append({
                "type": "compression",
                "message": f"Enable compression for {compression_ratio}x storage savings"
            })

        return {
            "feature_name": feature_name,
            "suggestions": suggestions
        }

    def _move_to_archive(self, feature_name: str, before: datetime):
        """Move old data to archive storage."""
        pass

    def _cleanup_online(self, feature_name: str, before: datetime):
        """Remove expired data from online store."""
        pass

    def _delete_archives(self, feature_name: str, before: datetime):
        """Delete very old archived data."""
        pass

    def _find_similar_features(self, feature_name: str) -> list[str]:
        """Find potentially duplicate features."""
        return []

    def _get_access_stats(self, feature_name: str) -> dict:
        """Get feature access statistics."""
        return {}

    def _estimate_compression_benefit(self, feature_name: str) -> float:
        """Estimate compression ratio."""
        return 1.0
```

## Real-World Use Cases

### Recommendation System Features

```python
from dataclasses import dataclass
from typing import Optional
import numpy as np

@dataclass
class RecommendationFeatures:
    """Feature definitions for recommendation systems."""

    # User features
    user_embedding: np.ndarray           # Dense user representation
    user_click_count_24h: int
    user_purchase_count_7d: int
    user_avg_session_duration: float
    user_favorite_categories: list[str]
    user_price_sensitivity: float        # Derived from purchase patterns

    # Item features
    item_embedding: np.ndarray
    item_popularity_score: float
    item_price: float
    item_category: str
    item_avg_rating: float
    item_view_count_7d: int

    # Context features
    hour_of_day: int
    day_of_week: int
    is_weekend: bool
    device_type: str

    # Interaction features
    user_item_view_count: int
    user_category_affinity: float
    time_since_last_interaction: Optional[float]

class RecommendationFeatureStore:
    """Feature store for recommendation systems."""

    def __init__(self, online_store, embedding_store):
        self.online = online_store
        self.embeddings = embedding_store  # Specialized vector store

    def get_candidate_features(
        self,
        user_id: str,
        item_ids: list[str],
        context: dict
    ) -> list[dict]:
        """Get features for ranking candidates."""

        # Batch fetch user features (single call)
        user_features = self.online.get_features(
            "user_id", user_id,
            ["click_count_24h", "purchase_count_7d", "favorite_categories",
             "price_sensitivity"]
        )

        # Fetch user embedding
        user_embedding = self.embeddings.get_vector(f"user:{user_id}")

        # Batch fetch item features
        item_features_batch = self.online.get_features_batch(
            "item_id", item_ids,
            ["popularity_score", "price", "category", "avg_rating"]
        )

        # Fetch item embeddings
        item_embeddings = self.embeddings.get_vectors_batch(
            [f"item:{iid}" for iid in item_ids]
        )

        # Compute interaction features
        results = []
        for i, item_id in enumerate(item_ids):
            item_feat = item_features_batch[i]
            item_emb = item_embeddings[i]

            # Compute embedding similarity
            similarity = np.dot(user_embedding, item_emb) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(item_emb)
            )

            # Category affinity
            cat_affinity = 1.0 if item_feat.get("category") in user_features.get("favorite_categories", []) else 0.0

            results.append({
                "item_id": item_id,
                # User features (same for all candidates)
                "user_click_count_24h": user_features.get("click_count_24h", 0),
                "user_purchase_count_7d": user_features.get("purchase_count_7d", 0),
                "user_price_sensitivity": user_features.get("price_sensitivity", 0.5),
                # Item features
                "item_popularity": item_feat.get("popularity_score", 0),
                "item_price": item_feat.get("price", 0),
                "item_rating": item_feat.get("avg_rating", 0),
                # Interaction features
                "embedding_similarity": similarity,
                "category_affinity": cat_affinity,
                # Context features
                "hour_of_day": context.get("hour", 12),
                "is_weekend": context.get("is_weekend", False)
            })

        return results
```

### Fraud Detection Features

```python
@dataclass
class FraudDetectionFeatures:
    """Feature definitions for fraud detection."""

    # Transaction features
    transaction_amount: float
    transaction_currency: str
    merchant_category: str
    payment_method: str

    # Velocity features (critical for fraud)
    tx_count_1h: int
    tx_count_24h: int
    tx_amount_sum_1h: float
    tx_amount_sum_24h: float
    unique_merchants_24h: int
    unique_countries_24h: int

    # Historical behavior
    avg_transaction_amount_30d: float
    max_transaction_amount_30d: float
    typical_hour_pattern: list[float]  # 24-dim vector

    # Device/session features
    device_fingerprint: str
    ip_address_country: str
    is_new_device: bool
    session_duration_seconds: int

    # Risk scores
    merchant_risk_score: float
    ip_risk_score: float
    device_risk_score: float

class FraudFeatureStore:
    """Real-time feature store for fraud detection."""

    def __init__(self, redis_cluster, velocity_engine):
        self.redis = redis_cluster
        self.velocity = velocity_engine  # Real-time aggregation

    async def get_fraud_features(
        self,
        transaction: dict
    ) -> dict:
        """
        Get fraud detection features in real-time.

        Critical: Must complete in <50ms for transaction approval.
        """
        user_id = transaction["user_id"]
        amount = transaction["amount"]

        # Parallel feature fetches
        tasks = [
            self._get_velocity_features(user_id),
            self._get_historical_features(user_id),
            self._get_device_features(transaction.get("device_id")),
            self._get_risk_scores(transaction)
        ]

        velocity, historical, device, risk = await asyncio.gather(*tasks)

        # Compute derived features
        amount_zscore = (amount - historical.get("avg_amount", amount)) / (
            historical.get("std_amount", 1) or 1
        )

        is_unusual_hour = self._check_unusual_hour(
            transaction.get("hour", 12),
            historical.get("hour_pattern", [])
        )

        return {
            # Transaction
            "amount": amount,
            "amount_zscore": amount_zscore,
            "merchant_category": transaction.get("merchant_category"),

            # Velocity
            "tx_count_1h": velocity.get("count_1h", 0),
            "tx_count_24h": velocity.get("count_24h", 0),
            "tx_amount_sum_1h": velocity.get("sum_1h", 0),
            "unique_merchants_24h": velocity.get("unique_merchants", 0),

            # Behavioral anomalies
            "is_above_max_30d": amount > historical.get("max_amount", float('inf')),
            "is_unusual_hour": is_unusual_hour,
            "is_new_device": device.get("is_new", True),

            # Risk scores
            "merchant_risk": risk.get("merchant", 0),
            "ip_risk": risk.get("ip", 0),
            "device_risk": risk.get("device", 0)
        }

    async def _get_velocity_features(self, user_id: str) -> dict:
        """Get real-time velocity features."""
        return await self.velocity.get_aggregates(
            user_id,
            windows=["1h", "24h"],
            metrics=["count", "sum", "unique_merchants"]
        )

    async def _get_historical_features(self, user_id: str) -> dict:
        """Get pre-computed historical features."""
        return await self.redis.hgetall(f"user:history:{user_id}")

    async def _get_device_features(self, device_id: str) -> dict:
        """Get device-related features."""
        if not device_id:
            return {"is_new": True}
        return await self.redis.hgetall(f"device:{device_id}")

    async def _get_risk_scores(self, transaction: dict) -> dict:
        """Get pre-computed risk scores."""
        # Batch fetch risk scores
        return {
            "merchant": 0.1,  # From merchant risk table
            "ip": 0.2,        # From IP reputation
            "device": 0.15    # From device fingerprint
        }

    def _check_unusual_hour(self, hour: int, pattern: list[float]) -> bool:
        """Check if transaction hour is unusual for user."""
        if not pattern or len(pattern) < 24:
            return False
        return pattern[hour] < 0.05  # Less than 5% of historical transactions
```

### Real-Time Personalization

```python
class PersonalizationFeatureStore:
    """Feature store for real-time personalization."""

    def __init__(self, feature_server, ab_test_service):
        self.features = feature_server
        self.ab_tests = ab_test_service

    async def get_personalization_context(
        self,
        user_id: str,
        page_type: str,
        session_id: str
    ) -> dict:
        """
        Get features for real-time content personalization.

        Used for: Homepage layout, search ranking, content ordering
        """

        # User segment and preferences
        user_features = await self.features.get_online_features(
            ["user:segment", "user:preferred_categories",
             "user:price_range", "user:brand_affinity"],
            [{"user_id": user_id}]
        )

        # Session features
        session_features = await self.features.get_online_features(
            ["session:page_views", "session:cart_items",
             "session:search_queries", "session:time_on_site"],
            [{"session_id": session_id}]
        )

        # Real-time context
        context = {
            "page_type": page_type,
            "timestamp": datetime.now().isoformat(),
            "user_segment": user_features[0].get("user:segment", "new"),
            "preferred_categories": user_features[0].get("user:preferred_categories", []),
            "session_page_views": session_features[0].get("session:page_views", 0),
            "has_cart_items": session_features[0].get("session:cart_items", 0) > 0
        }

        # A/B test assignments
        context["experiments"] = self.ab_tests.get_assignments(user_id)

        return context

    async def update_session_features(
        self,
        session_id: str,
        event_type: str,
        event_data: dict
    ):
        """Update session features from user events."""

        updates = {}

        if event_type == "page_view":
            updates["page_views"] = ("increment", 1)
            updates["last_page"] = event_data.get("page_url")

        elif event_type == "add_to_cart":
            updates["cart_items"] = ("increment", 1)
            updates["cart_value"] = ("increment", event_data.get("price", 0))

        elif event_type == "search":
            # Append to search history
            updates["search_queries"] = ("append", event_data.get("query"))

        await self.features.update_features(
            entity_key="session_id",
            entity_value=session_id,
            updates=updates
        )
```

## Interview Focus

### Common Interview Questions

**Q1: What is training-serving skew and how do you prevent it?**

Training-serving skew occurs when features behave differently during model training versus production serving. This can happen due to:

1. **Different code paths**: Training uses Python/Spark, serving uses Java/C++
2. **Different data freshness**: Training uses batch data, serving uses real-time
3. **Missing features**: Feature not available at prediction time
4. **Time leakage**: Training accidentally uses future information

Prevention strategies:
- Single feature definition used by both train and serve
- Feature store as single source of truth
- Point-in-time correctness for historical features
- Integration tests comparing train vs serve outputs

**Q2: How would you design a feature store for sub-millisecond latency?**

Key design decisions:
1. **Storage**: Use Redis Cluster or DynamoDB with provisioned capacity
2. **Caching**: Multi-level cache (L1: in-process, L2: distributed)
3. **Data model**: Denormalize features per entity, avoid joins
4. **Precomputation**: Materialize all features, no real-time computation
5. **Batching**: Support batch fetch for multiple entities
6. **Connection pooling**: Reuse connections, avoid cold starts

**Q3: Explain point-in-time correctness and why it matters.**

Point-in-time correctness ensures that when computing features for historical training data, only information that was available at that point in time is used. Without this:

- Models learn patterns from "future" data (data leakage)
- Training metrics are overly optimistic
- Production performance degrades significantly

Implementation requires:
- Timestamped feature values
- As-of joins instead of regular joins
- Proper backfill logic for new features

**Q4: How do you handle feature freshness vs latency tradeoffs?**

| Approach | Freshness | Latency | Use Case |
|----------|-----------|---------|----------|
| Pre-computed batch | Hours/days | <1ms | Stable user preferences |
| Near real-time streaming | Minutes | <10ms | Session features |
| On-demand computation | Real-time | 50-100ms | Complex derived features |

Strategy:
- Categorize features by freshness requirements
- Use hybrid approach with multiple stores
- Cache aggressively for stable features
- Stream updates for time-sensitive features

**Q5: Design a feature platform for a ride-sharing company.**

Key features needed:
1. **Driver features**: Rating, acceptance rate, location, current status
2. **Rider features**: Tier, ride history, preferred payment
3. **Trip features**: Distance, estimated time, surge pricing
4. **Real-time features**: Current demand, driver supply, weather

Architecture:
- Kafka for real-time event streaming
- Flink for streaming aggregations
- Redis for online serving
- Delta Lake for offline training
- Feature registry for governance

Challenges:
- Geo-partitioning for location features
- High write throughput for driver locations
- Complex aggregations (drivers nearby in last 5 min)

### Key Concepts to Master

| Concept | Description | Why It Matters |
|---------|-------------|----------------|
| Feature Lineage | Track feature origins and transformations | Debugging, compliance |
| Point-in-Time Join | Historical feature retrieval without leakage | Training data integrity |
| Feature Versioning | Manage feature changes over time | Backwards compatibility |
| Online/Offline Consistency | Same features in train and serve | Model reliability |
| Feature Freshness | How current feature values are | Business requirements |
| Feature Drift | Changes in feature distributions | Model degradation |

## Further Reading

### Official Documentation

- [Feast Documentation](https://docs.feast.dev/) - Open-source feature store
- [Tecton Documentation](https://docs.tecton.ai/) - Enterprise feature platform
- [Databricks Feature Store](https://docs.databricks.com/machine-learning/feature-store/) - Integrated with MLflow
- [Amazon SageMaker Feature Store](https://docs.aws.amazon.com/sagemaker/latest/dg/feature-store.html) - AWS managed service
- [Vertex AI Feature Store](https://cloud.google.com/vertex-ai/docs/featurestore) - GCP managed service

### Research Papers

- "Feature Store: A Centralized Feature Store for ML Models" - Uber Engineering
- "Zipline: A Declarative Feature Engineering Library" - Airbnb
- "Feast: Feature Store for Machine Learning" - Gojek/Google
- "Michelangelo: Uber's Machine Learning Platform" - Uber Engineering

### Community Resources

- [Feast GitHub Repository](https://github.com/feast-dev/feast)
- [MLOps Community](https://mlops.community/) - Feature store discussions
- [Feature Store Comparison](https://www.featurestore.org/) - Vendor comparisons

### Books

- "Designing Machine Learning Systems" by Chip Huyen - Chapter on Feature Engineering
- "Machine Learning Engineering" by Andriy Burkov - Production ML systems
- "Building Machine Learning Pipelines" by Hannes Hapke - Feature store patterns

Feature platforms are essential infrastructure for scaling ML in organizations. By centralizing feature management, you enable faster model development, improve consistency, and reduce technical debt. Start with open-source solutions like Feast for simpler use cases, and evaluate managed services or custom builds as your requirements grow.
