---
title: Feature Store and Data Lake Architecture
description: "Build ML data infrastructure: data lakes, feature stores, and vector databases"
track: data
section: data-engineering
difficulty: advanced
tags:
  - feature store
  - data lake
  - vector database
  - MLOps
status: imported
origin: old/src/content/docs/datascience/feature-store.en.md
divergence: 0.143
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 5
  lastUpdated: 2026-01-07
---

Building robust machine learning systems requires more than just training models. The underlying data infrastructure determines whether ML projects succeed in production. We'll cover the essential components: data lakes for raw data storage, feature stores for ML-ready features, and vector databases for embedding storage.

---

## Data Lake Architecture

A **data lake** is a centralized repository that stores raw data in its native format until needed for analysis. Unlike data warehouses that store processed, structured data, data lakes accommodate structured, semi-structured, and unstructured data at any scale.

### Data Lake vs Data Warehouse

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Data Storage Comparison                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Data Lake                        Data Warehouse                     │
│  ──────────                       ──────────────                     │
│  ○ Raw, unprocessed data          ○ Cleaned, transformed data       │
│  ○ Schema-on-read                 ○ Schema-on-write                  │
│  ○ Any data format                ○ Structured tables only           │
│  ○ Data scientists, ML engineers  ○ Business analysts, BI tools      │
│  ○ Exploratory analysis, ML       ○ Reporting, dashboards            │
│  ○ Lower storage cost             ○ Higher query performance         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Lakehouse Architecture

The modern approach combines data lake flexibility with data warehouse reliability through the **lakehouse** pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Data Lakehouse Architecture                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Data Sources              Bronze           Silver          Gold    │
│   ────────────              ──────           ──────          ────    │
│                                                                      │
│   ┌─────────┐              ┌──────┐        ┌──────┐       ┌──────┐  │
│   │ APIs    │──┐           │ Raw  │        │Clean │       │Curated│  │
│   └─────────┘  │           │ Data │───────▶│ Data │──────▶│ Data │  │
│                │           │      │        │      │       │      │  │
│   ┌─────────┐  │           └──────┘        └──────┘       └──────┘  │
│   │ DBs     │──┼──────────▶                                          │
│   └─────────┘  │                                                     │
│                │           Delta Lake / Iceberg / Hudi               │
│   ┌─────────┐  │           (ACID transactions, schema evolution)     │
│   │ Streams │──┘                                                     │
│   └─────────┘                                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementing a Data Lake with Delta Lake

```python
from pyspark.sql import SparkSession
from delta import configure_spark_with_delta_pip

# Initialize Spark with Delta Lake support
builder = (SparkSession.builder
    .appName("DataLakeDemo")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
)

spark = configure_spark_with_delta_pip(builder).getOrCreate()

# Bronze Layer: Raw data ingestion
def ingest_to_bronze(source_path: str, bronze_path: str):
    """Ingest raw data to bronze layer with minimal processing."""
    raw_df = spark.read.json(source_path)

    # Add metadata columns
    raw_df = raw_df.withColumn("_ingestion_timestamp", current_timestamp())
    raw_df = raw_df.withColumn("_source_file", input_file_name())

    # Write to Delta Lake with merge schema for flexibility
    raw_df.write \
        .format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .save(bronze_path)

    return raw_df.count()


# Silver Layer: Cleaned and validated data
def transform_to_silver(bronze_path: str, silver_path: str):
    """Transform bronze data to silver with cleaning and validation."""
    bronze_df = spark.read.format("delta").load(bronze_path)

    # Data cleaning
    silver_df = bronze_df \
        .dropDuplicates(["transaction_id"]) \
        .filter(col("amount") > 0) \
        .filter(col("timestamp").isNotNull()) \
        .withColumn("amount", col("amount").cast("decimal(10,2)")) \
        .withColumn("transaction_date", to_date(col("timestamp")))

    # Write with ACID guarantees
    silver_df.write \
        .format("delta") \
        .mode("overwrite") \
        .partitionBy("transaction_date") \
        .save(silver_path)


# Gold Layer: Business-level aggregations
def aggregate_to_gold(silver_path: str, gold_path: str):
    """Create business-ready aggregations in gold layer."""
    silver_df = spark.read.format("delta").load(silver_path)

    # Daily aggregations per customer
    gold_df = silver_df.groupBy(
        "customer_id",
        "transaction_date"
    ).agg(
        count("*").alias("transaction_count"),
        sum("amount").alias("total_amount"),
        avg("amount").alias("avg_amount"),
        max("amount").alias("max_amount")
    )

    # Merge for incremental updates
    from delta.tables import DeltaTable

    if DeltaTable.isDeltaTable(spark, gold_path):
        delta_table = DeltaTable.forPath(spark, gold_path)

        delta_table.alias("target").merge(
            gold_df.alias("source"),
            "target.customer_id = source.customer_id AND target.transaction_date = source.transaction_date"
        ).whenMatchedUpdateAll() \
         .whenNotMatchedInsertAll() \
         .execute()
    else:
        gold_df.write.format("delta").save(gold_path)
```

### Time Travel and Data Versioning

Delta Lake provides built-in versioning for auditing and rollback:

```python
from delta.tables import DeltaTable

# Read data at a specific version
df_v1 = spark.read.format("delta").option("versionAsOf", 1).load(delta_path)

# Read data at a specific timestamp
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-14 00:00:00") \
    .load(delta_path)

# View version history
delta_table = DeltaTable.forPath(spark, delta_path)
history = delta_table.history()
history.show()

# Rollback to a previous version
delta_table.restoreToVersion(5)

# Vacuum old files (retain last 7 days)
delta_table.vacuum(retentionHours=168)
```

---

## Feature Store Concepts

A **feature store** is a centralized repository for storing, managing, and serving machine learning features. It bridges the gap between data engineering and ML model development by providing consistent feature access across training and inference.

### Why Feature Stores?

```
┌─────────────────────────────────────────────────────────────────────┐
│                Problems Solved by Feature Stores                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Without Feature Store           With Feature Store                  │
│  ────────────────────           ──────────────────                   │
│                                                                      │
│  ○ Training/serving skew        ○ Consistent feature computation     │
│  ○ Duplicated feature code      ○ Single source of truth            │
│  ○ Slow feature discovery       ○ Feature catalog & search          │
│  ○ No feature reuse             ○ Cross-team feature sharing        │
│  ○ Manual feature pipelines     ○ Automated feature engineering     │
│  ○ Point-in-time leakage        ○ Correct temporal joins            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Feature Store Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Feature Store Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ Data Sources│───▶│  Feature    │───▶│   Offline   │             │
│  │ (Batch)     │    │  Pipeline   │    │   Store     │             │
│  └─────────────┘    └──────┬──────┘    │ (Historical)│             │
│                            │           └──────┬──────┘             │
│  ┌─────────────┐           │                  │                     │
│  │ Stream Data │───────────┤           ┌──────▼──────┐             │
│  │ (Real-time) │           │           │   Online    │             │
│  └─────────────┘           │           │   Store     │             │
│                            │           │ (Low-latency)│             │
│                            │           └──────┬──────┘             │
│                            │                  │                     │
│                     ┌──────▼──────┐    ┌──────▼──────┐             │
│                     │   Feature   │    │   Feature   │             │
│                     │   Registry  │    │   Server    │             │
│                     │ (Metadata)  │    │  (Serving)  │             │
│                     └─────────────┘    └─────────────┘             │
│                                                                      │
│                     Training              Inference                  │
│                        │                      │                      │
│                        ▼                      ▼                      │
│                 Read historical        Get real-time                 │
│                   features             features via API              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Components

| Component | Purpose | Technology Examples |
|-----------|---------|---------------------|
| **Offline Store** | Historical feature storage for training | S3, GCS, BigQuery, Snowflake |
| **Online Store** | Low-latency feature serving | Redis, DynamoDB, Bigtable |
| **Feature Registry** | Metadata, lineage, discovery | PostgreSQL, MySQL |
| **Feature Server** | API for real-time feature retrieval | gRPC, REST API |
| **Transformation Engine** | Feature computation | Spark, Flink, Pandas |

---

## Feast Feature Store

**Feast** (Feature Store) is the most popular open-source feature store, providing a complete solution for managing ML features at scale.

### Installation and Setup

```bash
# Install Feast
pip install feast

# Initialize a new Feast project
feast init my_feature_repo
cd my_feature_repo
```

### Project Structure

```
my_feature_repo/
├── feature_repo/
│   ├── __init__.py
│   ├── features.py          # Feature definitions
│   ├── feature_store.yaml   # Configuration
│   └── data/                # Sample data
└── README.md
```

### Configuration

```yaml
# feature_store.yaml
project: my_ml_project
registry: data/registry.db
provider: local

offline_store:
  type: file

online_store:
  type: sqlite
  path: data/online_store.db

entity_key_serialization_version: 2
```

### Defining Features

```python
# features.py
from datetime import timedelta
from feast import Entity, Feature, FeatureView, FileSource, ValueType
from feast.types import Float32, Int64, String

# Define entities (primary keys for features)
customer = Entity(
    name="customer_id",
    value_type=ValueType.INT64,
    description="Unique customer identifier"
)

# Define data source
customer_stats_source = FileSource(
    path="data/customer_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# Define feature view (logical grouping of features)
customer_stats_fv = FeatureView(
    name="customer_stats",
    entities=[customer],
    ttl=timedelta(days=365),  # Time-to-live for features
    schema=[
        Feature(name="total_transactions", dtype=Int64),
        Feature(name="total_amount", dtype=Float32),
        Feature(name="avg_transaction_amount", dtype=Float32),
        Feature(name="days_since_last_transaction", dtype=Int64),
        Feature(name="customer_segment", dtype=String),
    ],
    source=customer_stats_source,
    online=True,  # Enable online serving
    tags={"team": "fraud_detection", "owner": "ml_team"}
)

# Real-time features from streaming source
from feast import KafkaSource

transaction_stream_source = KafkaSource(
    name="transaction_stream",
    kafka_bootstrap_servers="localhost:9092",
    topic="transactions",
    timestamp_field="transaction_time",
    message_format=JsonFormat(schema_json=transaction_schema)
)

realtime_transaction_fv = FeatureView(
    name="realtime_transactions",
    entities=[customer],
    ttl=timedelta(hours=1),
    schema=[
        Feature(name="transaction_count_1h", dtype=Int64),
        Feature(name="transaction_amount_1h", dtype=Float32),
        Feature(name="unique_merchants_1h", dtype=Int64),
    ],
    source=transaction_stream_source,
    online=True
)
```

### Feature Transformation with On-Demand Features

```python
from feast import on_demand_feature_view, Field
from feast.types import Float32
import pandas as pd

# On-demand feature transformation (computed at request time)
@on_demand_feature_view(
    sources=[customer_stats_fv],
    schema=[
        Field(name="transaction_frequency_score", dtype=Float32),
        Field(name="high_value_customer", dtype=Int64),
    ]
)
def compute_derived_features(inputs: pd.DataFrame) -> pd.DataFrame:
    """Compute features on-demand during serving."""
    df = pd.DataFrame()

    # Transaction frequency score
    df["transaction_frequency_score"] = (
        inputs["total_transactions"] /
        (inputs["days_since_last_transaction"] + 1)
    ).clip(0, 100)

    # High value customer flag
    df["high_value_customer"] = (
        (inputs["total_amount"] > 10000) &
        (inputs["avg_transaction_amount"] > 100)
    ).astype(int)

    return df
```

### Applying Features and Materialization

```bash
# Apply feature definitions to the registry
feast apply

# Materialize features to online store
feast materialize 2024-01-01T00:00:00 2024-01-15T00:00:00

# Materialize incrementally (from last run to now)
feast materialize-incremental $(date +%Y-%m-%dT%H:%M:%S)
```

### Training Data Generation

```python
from feast import FeatureStore
from datetime import datetime
import pandas as pd

# Initialize feature store
store = FeatureStore(repo_path="feature_repo/")

# Define entity dataframe (events with timestamps)
entity_df = pd.DataFrame({
    "customer_id": [1001, 1002, 1003, 1001, 1002],
    "event_timestamp": [
        datetime(2024, 1, 10, 10, 0, 0),
        datetime(2024, 1, 10, 11, 0, 0),
        datetime(2024, 1, 11, 9, 0, 0),
        datetime(2024, 1, 12, 14, 0, 0),
        datetime(2024, 1, 13, 16, 0, 0),
    ],
    "label": [0, 1, 0, 1, 0]  # Training labels
})

# Get historical features with point-in-time correct joins
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_transactions",
        "customer_stats:total_amount",
        "customer_stats:avg_transaction_amount",
        "customer_stats:days_since_last_transaction",
        "customer_stats:customer_segment",
    ]
).to_df()

print(training_df.head())
# Output:
#    customer_id      event_timestamp  label  total_transactions  total_amount  ...
# 0         1001  2024-01-10 10:00:00      0                  45       5234.50  ...
# 1         1002  2024-01-10 11:00:00      1                  12       1023.00  ...
```

### Online Feature Serving

```python
# Get online features for real-time inference
online_features = store.get_online_features(
    features=[
        "customer_stats:total_transactions",
        "customer_stats:total_amount",
        "customer_stats:avg_transaction_amount",
        "customer_stats:customer_segment",
    ],
    entity_rows=[
        {"customer_id": 1001},
        {"customer_id": 1002},
    ]
).to_dict()

print(online_features)
# Output:
# {
#     'customer_id': [1001, 1002],
#     'total_transactions': [45, 12],
#     'total_amount': [5234.50, 1023.00],
#     'avg_transaction_amount': [116.32, 85.25],
#     'customer_segment': ['gold', 'silver']
# }
```

### Feature Server Deployment

```python
# Start Feast feature server
# feast serve -p 6566

# HTTP API call
import requests

response = requests.post(
    "http://localhost:6566/get-online-features",
    json={
        "features": [
            "customer_stats:total_transactions",
            "customer_stats:total_amount",
        ],
        "entities": {
            "customer_id": [1001, 1002]
        }
    }
)

features = response.json()
```

---

## Offline and Online Features

Understanding the distinction between offline and online features is crucial for building production ML systems.

### Offline Features

**Offline features** are computed from historical data and used for model training and batch inference.

```python
import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("OfflineFeatures").getOrCreate()

def compute_offline_features(transactions_df):
    """Compute offline features from historical transaction data."""

    # Customer-level aggregations
    customer_features = transactions_df.groupBy("customer_id").agg(
        # Recency features
        F.datediff(
            F.current_date(),
            F.max("transaction_date")
        ).alias("days_since_last_transaction"),

        # Frequency features
        F.count("*").alias("total_transactions"),
        F.countDistinct("merchant_id").alias("unique_merchants"),

        # Monetary features
        F.sum("amount").alias("total_amount"),
        F.avg("amount").alias("avg_amount"),
        F.stddev("amount").alias("stddev_amount"),
        F.max("amount").alias("max_amount"),

        # Time-based aggregations
        F.count(
            F.when(F.col("transaction_date") >= F.date_sub(F.current_date(), 30), 1)
        ).alias("transactions_last_30d"),

        F.sum(
            F.when(F.col("transaction_date") >= F.date_sub(F.current_date(), 30),
                   F.col("amount"))
        ).alias("amount_last_30d"),
    )

    # Add derived features
    customer_features = customer_features.withColumn(
        "avg_transaction_frequency",
        F.col("total_transactions") /
        (F.col("days_since_last_transaction") + 1)
    ).withColumn(
        "amount_volatility",
        F.col("stddev_amount") / (F.col("avg_amount") + 0.01)
    )

    return customer_features


def compute_windowed_features(transactions_df):
    """Compute rolling window features."""

    # Define windows
    window_7d = Window.partitionBy("customer_id") \
        .orderBy(F.col("transaction_date").cast("timestamp").cast("long")) \
        .rangeBetween(-7 * 86400, 0)  # 7 days in seconds

    window_30d = Window.partitionBy("customer_id") \
        .orderBy(F.col("transaction_date").cast("timestamp").cast("long")) \
        .rangeBetween(-30 * 86400, 0)

    # Compute rolling features
    windowed_df = transactions_df \
        .withColumn("rolling_sum_7d", F.sum("amount").over(window_7d)) \
        .withColumn("rolling_count_7d", F.count("*").over(window_7d)) \
        .withColumn("rolling_avg_30d", F.avg("amount").over(window_30d)) \
        .withColumn("rolling_max_30d", F.max("amount").over(window_30d))

    return windowed_df
```

### Online Features

**Online features** require low-latency serving for real-time inference, typically sub-100ms.

```python
import redis
from typing import Dict, List, Optional
import json
import time

class OnlineFeatureStore:
    """Simple online feature store using Redis."""

    def __init__(self, host: str = "localhost", port: int = 6379):
        self.redis = redis.Redis(host=host, port=port, decode_responses=True)

    def _get_key(self, entity_name: str, entity_id: str, feature_view: str) -> str:
        """Generate Redis key for feature storage."""
        return f"feast:{feature_view}:{entity_name}:{entity_id}"

    def write_features(
        self,
        entity_name: str,
        entity_id: str,
        feature_view: str,
        features: Dict[str, any],
        ttl_seconds: int = 86400
    ):
        """Write features to online store."""
        key = self._get_key(entity_name, entity_id, feature_view)

        # Store features as hash
        features["_timestamp"] = time.time()
        self.redis.hset(key, mapping={k: json.dumps(v) for k, v in features.items()})
        self.redis.expire(key, ttl_seconds)

    def get_features(
        self,
        entity_name: str,
        entity_id: str,
        feature_view: str,
        feature_names: List[str]
    ) -> Dict[str, any]:
        """Get features from online store with low latency."""
        key = self._get_key(entity_name, entity_id, feature_view)

        # Fetch specific features
        values = self.redis.hmget(key, feature_names)

        return {
            name: json.loads(value) if value else None
            for name, value in zip(feature_names, values)
        }

    def batch_get_features(
        self,
        entity_name: str,
        entity_ids: List[str],
        feature_view: str,
        feature_names: List[str]
    ) -> List[Dict[str, any]]:
        """Batch retrieve features for multiple entities."""
        pipe = self.redis.pipeline()

        for entity_id in entity_ids:
            key = self._get_key(entity_name, entity_id, feature_view)
            pipe.hmget(key, feature_names)

        results = pipe.execute()

        return [
            {name: json.loads(v) if v else None for name, v in zip(feature_names, values)}
            for values in results
        ]


# Usage example
online_store = OnlineFeatureStore()

# Write features
online_store.write_features(
    entity_name="customer_id",
    entity_id="1001",
    feature_view="customer_stats",
    features={
        "total_transactions": 45,
        "total_amount": 5234.50,
        "avg_transaction_amount": 116.32,
        "customer_segment": "gold"
    }
)

# Read features (low latency)
features = online_store.get_features(
    entity_name="customer_id",
    entity_id="1001",
    feature_view="customer_stats",
    feature_names=["total_transactions", "total_amount"]
)
```

### Feature Materialization Pipeline

```python
from datetime import datetime, timedelta
from typing import List
import schedule
import time

class FeatureMaterializer:
    """Pipeline for materializing offline features to online store."""

    def __init__(self, offline_store, online_store):
        self.offline_store = offline_store
        self.online_store = online_store

    def materialize_features(
        self,
        feature_view: str,
        entity_name: str,
        entity_ids: List[str],
        feature_names: List[str]
    ):
        """Materialize features from offline to online store."""

        # Fetch from offline store
        offline_features = self.offline_store.get_features(
            feature_view=feature_view,
            entity_name=entity_name,
            entity_ids=entity_ids,
            feature_names=feature_names
        )

        # Write to online store
        for entity_id, features in zip(entity_ids, offline_features):
            if features:
                self.online_store.write_features(
                    entity_name=entity_name,
                    entity_id=entity_id,
                    feature_view=feature_view,
                    features=dict(zip(feature_names, features))
                )

        print(f"Materialized {len(entity_ids)} entities for {feature_view}")

    def run_incremental_materialization(self, feature_view: str, lookback_hours: int = 24):
        """Materialize only recently updated features."""

        # Get entities updated in the last N hours
        cutoff_time = datetime.now() - timedelta(hours=lookback_hours)

        updated_entities = self.offline_store.get_updated_entities(
            feature_view=feature_view,
            since=cutoff_time
        )

        if updated_entities:
            self.materialize_features(
                feature_view=feature_view,
                entity_name="customer_id",
                entity_ids=updated_entities,
                feature_names=self.offline_store.get_feature_names(feature_view)
            )


# Schedule periodic materialization
materializer = FeatureMaterializer(offline_store, online_store)

schedule.every(1).hours.do(
    materializer.run_incremental_materialization,
    feature_view="customer_stats",
    lookback_hours=2
)

# Run scheduler
while True:
    schedule.run_pending()
    time.sleep(60)
```

---

## Feature Consistency

**Training-serving skew** occurs when features used during training differ from those at inference time. This is one of the most common causes of ML model degradation in production.

### Types of Feature Skew

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Types of Feature Skew                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Schema Skew                                                      │
│     ○ Different data types between training and serving              │
│     ○ Missing features at inference time                             │
│                                                                      │
│  2. Distribution Skew                                                │
│     ○ Feature distributions change over time                         │
│     ○ Training data not representative of production                 │
│                                                                      │
│  3. Temporal Skew                                                    │
│     ○ Using future information during training (data leakage)        │
│     ○ Incorrect point-in-time joins                                  │
│                                                                      │
│  4. Code Skew                                                        │
│     ○ Different transformation code in training vs serving           │
│     ○ Version mismatches in feature computation                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Point-in-Time Correct Joins

```python
import pandas as pd
from datetime import datetime

def point_in_time_join(
    entity_df: pd.DataFrame,
    feature_df: pd.DataFrame,
    entity_column: str,
    entity_timestamp: str,
    feature_timestamp: str,
    ttl_days: int = 365
) -> pd.DataFrame:
    """
    Perform a point-in-time correct join.

    For each entity event, join the most recent feature values
    that were available BEFORE the event timestamp.
    """

    # Sort both dataframes
    entity_df = entity_df.sort_values([entity_column, entity_timestamp])
    feature_df = feature_df.sort_values([entity_column, feature_timestamp])

    # Perform asof merge (join most recent feature before event)
    result = pd.merge_asof(
        entity_df,
        feature_df,
        left_on=entity_timestamp,
        right_on=feature_timestamp,
        by=entity_column,
        direction='backward',  # Only use past features
        tolerance=pd.Timedelta(days=ttl_days)  # TTL constraint
    )

    return result


# Example usage
entity_df = pd.DataFrame({
    "customer_id": [1, 1, 2],
    "event_timestamp": pd.to_datetime([
        "2024-01-15 10:00:00",
        "2024-01-20 14:00:00",
        "2024-01-18 09:00:00"
    ]),
    "label": [0, 1, 0]
})

feature_df = pd.DataFrame({
    "customer_id": [1, 1, 2, 2],
    "feature_timestamp": pd.to_datetime([
        "2024-01-10 00:00:00",
        "2024-01-17 00:00:00",
        "2024-01-12 00:00:00",
        "2024-01-16 00:00:00"
    ]),
    "total_transactions": [10, 15, 5, 8],
    "total_amount": [1000.0, 1500.0, 500.0, 800.0]
})

result = point_in_time_join(
    entity_df,
    feature_df,
    entity_column="customer_id",
    entity_timestamp="event_timestamp",
    feature_timestamp="feature_timestamp"
)

print(result)
# For customer 1 at 2024-01-15: uses features from 2024-01-10 (10 transactions)
# For customer 1 at 2024-01-20: uses features from 2024-01-17 (15 transactions)
```

### Feature Validation

```python
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

@dataclass
class FeatureStats:
    """Statistics for feature validation."""
    mean: float
    std: float
    min: float
    max: float
    null_rate: float
    unique_count: int

class FeatureValidator:
    """Validate feature consistency between training and serving."""

    def __init__(self):
        self.baseline_stats: Dict[str, FeatureStats] = {}

    def compute_stats(self, df: pd.DataFrame, feature_name: str) -> FeatureStats:
        """Compute statistics for a feature."""
        series = df[feature_name]

        return FeatureStats(
            mean=series.mean() if series.dtype in [np.float64, np.int64] else 0,
            std=series.std() if series.dtype in [np.float64, np.int64] else 0,
            min=series.min() if series.dtype in [np.float64, np.int64] else 0,
            max=series.max() if series.dtype in [np.float64, np.int64] else 0,
            null_rate=series.isnull().mean(),
            unique_count=series.nunique()
        )

    def set_baseline(self, training_df: pd.DataFrame, feature_names: List[str]):
        """Set baseline statistics from training data."""
        for feature in feature_names:
            self.baseline_stats[feature] = self.compute_stats(training_df, feature)

    def validate(
        self,
        serving_df: pd.DataFrame,
        feature_names: List[str],
        thresholds: Dict[str, float] = None
    ) -> Dict[str, List[str]]:
        """Validate serving data against baseline statistics."""

        thresholds = thresholds or {
            "mean_drift": 0.2,      # 20% mean drift
            "std_drift": 0.3,       # 30% std drift
            "null_rate_increase": 0.1,  # 10% null rate increase
            "range_violation": 0.05     # 5% out-of-range
        }

        violations = {}

        for feature in feature_names:
            feature_violations = []
            serving_stats = self.compute_stats(serving_df, feature)
            baseline = self.baseline_stats.get(feature)

            if baseline is None:
                feature_violations.append("No baseline stats available")
                continue

            # Check mean drift
            if baseline.mean != 0:
                mean_drift = abs(serving_stats.mean - baseline.mean) / abs(baseline.mean)
                if mean_drift > thresholds["mean_drift"]:
                    feature_violations.append(
                        f"Mean drift: {mean_drift:.2%} (threshold: {thresholds['mean_drift']:.2%})"
                    )

            # Check std drift
            if baseline.std != 0:
                std_drift = abs(serving_stats.std - baseline.std) / baseline.std
                if std_drift > thresholds["std_drift"]:
                    feature_violations.append(
                        f"Std drift: {std_drift:.2%}"
                    )

            # Check null rate
            null_increase = serving_stats.null_rate - baseline.null_rate
            if null_increase > thresholds["null_rate_increase"]:
                feature_violations.append(
                    f"Null rate increased: {null_increase:.2%}"
                )

            # Check range violations
            if baseline.min != baseline.max:
                out_of_range = (
                    (serving_df[feature] < baseline.min) |
                    (serving_df[feature] > baseline.max)
                ).mean()

                if out_of_range > thresholds["range_violation"]:
                    feature_violations.append(
                        f"Out of range: {out_of_range:.2%}"
                    )

            if feature_violations:
                violations[feature] = feature_violations

        return violations


# Usage example
validator = FeatureValidator()

# Set baseline from training data
validator.set_baseline(training_df, ["total_transactions", "total_amount"])

# Validate serving data
violations = validator.validate(serving_df, ["total_transactions", "total_amount"])

if violations:
    print("Feature validation warnings:")
    for feature, issues in violations.items():
        print(f"  {feature}: {issues}")
```

---

## Vector Databases

**Vector databases** store high-dimensional embeddings and enable similarity search. They are essential for features based on semantic similarity, such as user/item embeddings.

### Integration with Feature Stores

```python
from pinecone import Pinecone, ServerlessSpec
import numpy as np
from typing import List, Dict

class VectorFeatureStore:
    """Feature store with vector database backend for embedding features."""

    def __init__(self, api_key: str, index_name: str, dimension: int = 768):
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dimension = dimension

        # Create index if not exists
        if index_name not in [i.name for i in self.pc.list_indexes()]:
            self.pc.create_index(
                name=index_name,
                dimension=dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )

        self.index = self.pc.Index(index_name)

    def store_embedding_feature(
        self,
        entity_id: str,
        embedding: List[float],
        metadata: Dict = None
    ):
        """Store an embedding feature for an entity."""
        self.index.upsert(
            vectors=[{
                "id": entity_id,
                "values": embedding,
                "metadata": metadata or {}
            }]
        )

    def get_embedding_feature(self, entity_id: str) -> Dict:
        """Retrieve embedding feature for an entity."""
        result = self.index.fetch(ids=[entity_id])

        if entity_id in result.vectors:
            vec = result.vectors[entity_id]
            return {
                "embedding": vec.values,
                "metadata": vec.metadata
            }
        return None

    def find_similar_entities(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        filter: Dict = None
    ) -> List[Dict]:
        """Find entities with similar embeddings."""
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter
        )

        return [
            {
                "entity_id": match.id,
                "similarity": match.score,
                "metadata": match.metadata
            }
            for match in results.matches
        ]

    def compute_similarity_features(
        self,
        entity_id: str,
        reference_entities: List[str],
        top_k: int = 5
    ) -> Dict[str, float]:
        """Compute similarity-based features for an entity."""

        # Get entity embedding
        entity_data = self.get_embedding_feature(entity_id)
        if not entity_data:
            return {}

        # Fetch reference embeddings
        ref_results = self.index.fetch(ids=reference_entities)

        similarities = []
        for ref_id in reference_entities:
            if ref_id in ref_results.vectors:
                ref_vec = ref_results.vectors[ref_id].values
                # Compute cosine similarity
                sim = np.dot(entity_data["embedding"], ref_vec)
                similarities.append(sim)

        if not similarities:
            return {}

        return {
            "max_similarity": max(similarities),
            "avg_similarity": np.mean(similarities),
            "min_similarity": min(similarities),
            f"top_{top_k}_avg_similarity": np.mean(sorted(similarities, reverse=True)[:top_k])
        }


# Milvus implementation
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType

class MilvusFeatureStore:
    """Feature store using Milvus for embedding storage."""

    def __init__(self, host: str = "localhost", port: int = 19530):
        connections.connect("default", host=host, port=port)

    def create_embedding_collection(
        self,
        collection_name: str,
        dimension: int,
        metadata_fields: List[Dict] = None
    ):
        """Create a collection for embedding features."""

        fields = [
            FieldSchema(name="entity_id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=dimension),
            FieldSchema(name="updated_at", dtype=DataType.INT64),
        ]

        # Add custom metadata fields
        if metadata_fields:
            for field in metadata_fields:
                fields.append(FieldSchema(**field))

        schema = CollectionSchema(fields=fields, description="Embedding features")
        collection = Collection(name=collection_name, schema=schema)

        # Create HNSW index
        index_params = {
            "metric_type": "COSINE",
            "index_type": "HNSW",
            "params": {"M": 32, "efConstruction": 256}
        }
        collection.create_index("embedding", index_params)

        return collection

    def upsert_embeddings(
        self,
        collection_name: str,
        entity_ids: List[str],
        embeddings: List[List[float]],
        timestamps: List[int],
        metadata: Dict[str, List] = None
    ):
        """Batch upsert embedding features."""
        collection = Collection(collection_name)

        data = [entity_ids, embeddings, timestamps]

        if metadata:
            for field_name, values in metadata.items():
                data.append(values)

        collection.upsert(data)

    def search_similar(
        self,
        collection_name: str,
        query_embedding: List[float],
        top_k: int = 10,
        filter_expr: str = None
    ) -> List[Dict]:
        """Search for similar entities."""
        collection = Collection(collection_name)
        collection.load()

        search_params = {"metric_type": "COSINE", "params": {"ef": 100}}

        results = collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=filter_expr,
            output_fields=["entity_id", "updated_at"]
        )

        return [
            {
                "entity_id": hit.entity.get("entity_id"),
                "distance": hit.distance,
                "updated_at": hit.entity.get("updated_at")
            }
            for hit in results[0]
        ]
```

---

## Feature Versioning

Feature versioning ensures reproducibility and enables safe rollback when issues occur.

### Version Control for Features

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Callable
import hashlib
import json

@dataclass
class FeatureVersion:
    """Represents a specific version of a feature."""
    version_id: str
    feature_name: str
    created_at: datetime
    schema: Dict
    transformation_code: str
    transformation_hash: str
    dependencies: List[str] = field(default_factory=list)
    metadata: Dict = field(default_factory=dict)

    @classmethod
    def create(
        cls,
        feature_name: str,
        schema: Dict,
        transformation_func: Callable,
        dependencies: List[str] = None
    ) -> "FeatureVersion":
        """Create a new feature version."""
        import inspect

        # Get transformation source code
        code = inspect.getsource(transformation_func)
        code_hash = hashlib.sha256(code.encode()).hexdigest()[:12]

        # Generate version ID
        version_id = f"{feature_name}_v{datetime.now().strftime('%Y%m%d_%H%M%S')}_{code_hash}"

        return cls(
            version_id=version_id,
            feature_name=feature_name,
            created_at=datetime.now(),
            schema=schema,
            transformation_code=code,
            transformation_hash=code_hash,
            dependencies=dependencies or []
        )


class FeatureRegistry:
    """Registry for managing feature versions."""

    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.versions: Dict[str, List[FeatureVersion]] = {}
        self._load_registry()

    def _load_registry(self):
        """Load existing versions from storage."""
        import os
        if os.path.exists(f"{self.storage_path}/registry.json"):
            with open(f"{self.storage_path}/registry.json", "r") as f:
                data = json.load(f)
                # Reconstruct versions
                for feature_name, versions in data.items():
                    self.versions[feature_name] = [
                        FeatureVersion(**v) for v in versions
                    ]

    def _save_registry(self):
        """Persist registry to storage."""
        import os
        os.makedirs(self.storage_path, exist_ok=True)

        data = {}
        for feature_name, versions in self.versions.items():
            data[feature_name] = [
                {
                    "version_id": v.version_id,
                    "feature_name": v.feature_name,
                    "created_at": v.created_at.isoformat(),
                    "schema": v.schema,
                    "transformation_code": v.transformation_code,
                    "transformation_hash": v.transformation_hash,
                    "dependencies": v.dependencies,
                    "metadata": v.metadata
                }
                for v in versions
            ]

        with open(f"{self.storage_path}/registry.json", "w") as f:
            json.dump(data, f, indent=2)

    def register_version(self, version: FeatureVersion):
        """Register a new feature version."""
        if version.feature_name not in self.versions:
            self.versions[version.feature_name] = []

        # Check for duplicate hash
        existing_hashes = [v.transformation_hash for v in self.versions[version.feature_name]]
        if version.transformation_hash in existing_hashes:
            print(f"Warning: Identical transformation already registered for {version.feature_name}")
            return

        self.versions[version.feature_name].append(version)
        self._save_registry()

        print(f"Registered version: {version.version_id}")

    def get_latest_version(self, feature_name: str) -> Optional[FeatureVersion]:
        """Get the latest version of a feature."""
        if feature_name not in self.versions or not self.versions[feature_name]:
            return None

        return max(self.versions[feature_name], key=lambda v: v.created_at)

    def get_version(self, version_id: str) -> Optional[FeatureVersion]:
        """Get a specific version by ID."""
        for versions in self.versions.values():
            for v in versions:
                if v.version_id == version_id:
                    return v
        return None

    def list_versions(self, feature_name: str) -> List[FeatureVersion]:
        """List all versions of a feature."""
        return sorted(
            self.versions.get(feature_name, []),
            key=lambda v: v.created_at,
            reverse=True
        )

    def compare_versions(self, version_id_1: str, version_id_2: str) -> Dict:
        """Compare two versions of a feature."""
        v1 = self.get_version(version_id_1)
        v2 = self.get_version(version_id_2)

        if not v1 or not v2:
            raise ValueError("One or both versions not found")

        import difflib

        code_diff = list(difflib.unified_diff(
            v1.transformation_code.splitlines(),
            v2.transformation_code.splitlines(),
            lineterm=""
        ))

        schema_changes = {
            "added_fields": set(v2.schema.keys()) - set(v1.schema.keys()),
            "removed_fields": set(v1.schema.keys()) - set(v2.schema.keys()),
            "type_changes": {
                k: (v1.schema.get(k), v2.schema.get(k))
                for k in set(v1.schema.keys()) & set(v2.schema.keys())
                if v1.schema.get(k) != v2.schema.get(k)
            }
        }

        return {
            "code_diff": "\n".join(code_diff),
            "schema_changes": schema_changes,
            "dependency_changes": {
                "added": set(v2.dependencies) - set(v1.dependencies),
                "removed": set(v1.dependencies) - set(v2.dependencies)
            }
        }


# Usage example
registry = FeatureRegistry("./feature_registry")

def compute_customer_features_v1(df):
    return df.groupby("customer_id").agg({
        "amount": ["sum", "mean"]
    })

# Register version
version = FeatureVersion.create(
    feature_name="customer_spending",
    schema={"total_amount": "float", "avg_amount": "float"},
    transformation_func=compute_customer_features_v1,
    dependencies=["transactions"]
)

registry.register_version(version)
```

---

## Real-Time Feature Computation

Some features cannot be pre-computed and must be calculated in real-time during inference.

### Streaming Feature Pipeline

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.streaming import StreamingQuery

spark = SparkSession.builder \
    .appName("RealtimeFeatures") \
    .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoints") \
    .getOrCreate()

# Define schema for incoming events
transaction_schema = StructType([
    StructField("transaction_id", StringType(), True),
    StructField("customer_id", StringType(), True),
    StructField("merchant_id", StringType(), True),
    StructField("amount", DoubleType(), True),
    StructField("timestamp", TimestampType(), True),
    StructField("category", StringType(), True),
])

# Read from Kafka stream
transactions_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "transactions") \
    .load() \
    .select(from_json(col("value").cast("string"), transaction_schema).alias("data")) \
    .select("data.*")

# Compute real-time aggregations with watermarking
realtime_features = transactions_stream \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        col("customer_id"),
        window(col("timestamp"), "1 hour", "5 minutes")  # Sliding window
    ) \
    .agg(
        count("*").alias("transaction_count_1h"),
        sum("amount").alias("transaction_amount_1h"),
        avg("amount").alias("avg_amount_1h"),
        countDistinct("merchant_id").alias("unique_merchants_1h"),
        countDistinct("category").alias("unique_categories_1h"),
        max("amount").alias("max_amount_1h"),
    )

# Write to Redis for online serving
def write_to_redis(batch_df, batch_id):
    """Write aggregated features to Redis."""
    import redis
    import json

    r = redis.Redis(host="localhost", port=6379)

    for row in batch_df.collect():
        key = f"realtime_features:{row.customer_id}"
        features = {
            "transaction_count_1h": row.transaction_count_1h,
            "transaction_amount_1h": row.transaction_amount_1h,
            "avg_amount_1h": row.avg_amount_1h,
            "unique_merchants_1h": row.unique_merchants_1h,
            "unique_categories_1h": row.unique_categories_1h,
            "max_amount_1h": row.max_amount_1h,
            "window_end": row.window.end.isoformat()
        }
        r.hset(key, mapping={k: json.dumps(v) for k, v in features.items()})
        r.expire(key, 7200)  # 2 hour TTL


# Start streaming query
query = realtime_features.writeStream \
    .outputMode("update") \
    .foreachBatch(write_to_redis) \
    .start()
```

### On-Demand Feature Computation

```python
from typing import Dict, List, Any
import time
from functools import lru_cache
import numpy as np

class OnDemandFeatureEngine:
    """Engine for computing features on-demand during inference."""

    def __init__(self):
        self.feature_functions = {}
        self.cache_ttl = 60  # seconds

    def register_feature(self, name: str, func: callable, dependencies: List[str] = None):
        """Register an on-demand feature function."""
        self.feature_functions[name] = {
            "func": func,
            "dependencies": dependencies or []
        }

    def compute_feature(
        self,
        feature_name: str,
        context: Dict[str, Any]
    ) -> Any:
        """Compute a single feature."""
        if feature_name not in self.feature_functions:
            raise ValueError(f"Unknown feature: {feature_name}")

        feature_def = self.feature_functions[feature_name]

        # Resolve dependencies first
        resolved_context = context.copy()
        for dep in feature_def["dependencies"]:
            if dep not in resolved_context:
                resolved_context[dep] = self.compute_feature(dep, context)

        return feature_def["func"](resolved_context)

    def compute_features(
        self,
        feature_names: List[str],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compute multiple features."""
        results = {}

        for name in feature_names:
            try:
                results[name] = self.compute_feature(name, context)
            except Exception as e:
                results[name] = None
                print(f"Error computing {name}: {e}")

        return results


# Register on-demand features
engine = OnDemandFeatureEngine()

# Simple derived feature
engine.register_feature(
    "amount_to_avg_ratio",
    lambda ctx: ctx["transaction_amount"] / (ctx["customer_avg_amount"] + 0.01),
    dependencies=[]
)

# Feature with external API call
def fetch_merchant_risk_score(ctx: Dict) -> float:
    """Fetch real-time merchant risk score from external service."""
    import requests

    response = requests.get(
        f"http://risk-service/merchant/{ctx['merchant_id']}/score",
        timeout=0.1  # 100ms timeout
    )

    if response.status_code == 200:
        return response.json()["risk_score"]
    return 0.5  # Default score

engine.register_feature(
    "merchant_risk_score",
    fetch_merchant_risk_score
)

# Complex derived feature
def compute_transaction_anomaly_score(ctx: Dict) -> float:
    """Compute anomaly score based on multiple factors."""
    amount_deviation = abs(ctx["transaction_amount"] - ctx["customer_avg_amount"]) / \
                       (ctx["customer_std_amount"] + 0.01)

    time_deviation = 1.0 if ctx.get("is_unusual_hour", False) else 0.0

    merchant_risk = ctx.get("merchant_risk_score", 0.5)

    # Weighted combination
    anomaly_score = (
        0.4 * min(amount_deviation / 3.0, 1.0) +
        0.2 * time_deviation +
        0.4 * merchant_risk
    )

    return float(np.clip(anomaly_score, 0, 1))

engine.register_feature(
    "transaction_anomaly_score",
    compute_transaction_anomaly_score,
    dependencies=["merchant_risk_score"]
)


# Usage at inference time
context = {
    "transaction_amount": 500.0,
    "customer_avg_amount": 100.0,
    "customer_std_amount": 50.0,
    "merchant_id": "merchant_123",
    "is_unusual_hour": True
}

features = engine.compute_features(
    ["amount_to_avg_ratio", "transaction_anomaly_score"],
    context
)

print(features)
# {'amount_to_avg_ratio': 4.99, 'transaction_anomaly_score': 0.72}
```

### Low-Latency Feature Serving

```python
import asyncio
from typing import Dict, List
import aioredis
import time

class AsyncFeatureServer:
    """High-performance async feature server."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis = None
        self.local_cache = {}
        self.cache_ttl = 5  # seconds

    async def connect(self):
        """Initialize Redis connection."""
        self.redis = await aioredis.from_url(self.redis_url)

    async def get_feature(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str
    ) -> any:
        """Get a single feature with local caching."""
        cache_key = f"{entity_type}:{entity_id}:{feature_name}"

        # Check local cache
        if cache_key in self.local_cache:
            cached_value, cached_time = self.local_cache[cache_key]
            if time.time() - cached_time < self.cache_ttl:
                return cached_value

        # Fetch from Redis
        redis_key = f"features:{entity_type}:{entity_id}"
        value = await self.redis.hget(redis_key, feature_name)

        if value:
            import json
            parsed_value = json.loads(value)
            self.local_cache[cache_key] = (parsed_value, time.time())
            return parsed_value

        return None

    async def get_features_batch(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_names: List[str]
    ) -> List[Dict]:
        """Batch retrieve features for multiple entities."""

        async def get_entity_features(entity_id: str) -> Dict:
            redis_key = f"features:{entity_type}:{entity_id}"
            values = await self.redis.hmget(redis_key, *feature_names)

            import json
            return {
                name: json.loads(v) if v else None
                for name, v in zip(feature_names, values)
            }

        # Parallel fetch
        tasks = [get_entity_features(eid) for eid in entity_ids]
        results = await asyncio.gather(*tasks)

        return results

    async def serve_request(
        self,
        entity_type: str,
        entity_id: str,
        offline_features: List[str],
        online_features: List[str],
        on_demand_features: List[str] = None
    ) -> Dict:
        """Complete feature serving request."""

        start_time = time.time()

        # Fetch offline features
        offline_task = self.get_features_batch(
            f"{entity_type}_offline", [entity_id], offline_features
        )

        # Fetch online features
        online_task = self.get_features_batch(
            f"{entity_type}_online", [entity_id], online_features
        )

        # Wait for both
        offline_result, online_result = await asyncio.gather(offline_task, online_task)

        # Combine results
        features = {}
        features.update(offline_result[0] if offline_result else {})
        features.update(online_result[0] if online_result else {})

        # Compute on-demand features if needed
        if on_demand_features:
            from on_demand_engine import engine
            on_demand_result = engine.compute_features(on_demand_features, features)
            features.update(on_demand_result)

        latency_ms = (time.time() - start_time) * 1000

        return {
            "features": features,
            "latency_ms": latency_ms,
            "entity_id": entity_id
        }


# FastAPI endpoint
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
feature_server = AsyncFeatureServer()

@app.on_event("startup")
async def startup():
    await feature_server.connect()

class FeatureRequest(BaseModel):
    entity_type: str
    entity_id: str
    features: List[str]

@app.post("/features")
async def get_features(request: FeatureRequest):
    """Feature serving endpoint with <10ms latency target."""
    return await feature_server.serve_request(
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        offline_features=request.features,
        online_features=[],
    )
```

---

## Best Practices

### Feature Naming Conventions

```python
# Feature naming best practices
NAMING_CONVENTIONS = """
1. Use descriptive, unambiguous names
   Good: customer_total_transactions_30d
   Bad: cust_txn_cnt

2. Include temporal scope
   Good: avg_order_value_7d, max_amount_1h
   Bad: avg_order_value, max_amount

3. Indicate aggregation type
   Good: sum_revenue_mtd, avg_rating_lifetime
   Bad: revenue, rating

4. Use consistent prefixes for entity types
   Good: customer_*, product_*, merchant_*
   Bad: mixed naming

5. Version suffix for breaking changes
   Good: feature_name_v2
"""

# Feature naming validator
import re

def validate_feature_name(name: str) -> bool:
    """Validate feature name follows conventions."""

    # Must be lowercase with underscores
    if not re.match(r'^[a-z][a-z0-9_]*$', name):
        return False

    # Should include entity prefix
    valid_prefixes = ['customer_', 'product_', 'merchant_', 'transaction_', 'session_']
    has_prefix = any(name.startswith(p) for p in valid_prefixes)

    # Should include time window for aggregations
    time_patterns = ['_1h', '_6h', '_1d', '_7d', '_30d', '_90d', '_1y', '_lifetime', '_mtd', '_ytd']
    agg_patterns = ['sum_', 'avg_', 'max_', 'min_', 'count_', 'std_']

    is_aggregation = any(p in name for p in agg_patterns)
    has_time_window = any(p in name for p in time_patterns)

    if is_aggregation and not has_time_window:
        print(f"Warning: Aggregation feature '{name}' missing time window")

    return has_prefix
```

### Feature Documentation

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class FeatureType(Enum):
    NUMERICAL = "numerical"
    CATEGORICAL = "categorical"
    EMBEDDING = "embedding"
    TIMESTAMP = "timestamp"
    BOOLEAN = "boolean"

@dataclass
class FeatureDocumentation:
    """Comprehensive feature documentation."""

    name: str
    description: str
    feature_type: FeatureType
    data_type: str

    # Source information
    source_table: str
    transformation_logic: str

    # Freshness requirements
    update_frequency: str  # "hourly", "daily", "real-time"
    max_staleness: str

    # Value characteristics
    expected_range: Optional[tuple] = None
    null_handling: str = "default_to_zero"
    example_values: List = None

    # Ownership
    owner_team: str = ""
    owner_email: str = ""

    # Lineage
    upstream_features: List[str] = None
    downstream_models: List[str] = None

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "type": self.feature_type.value,
            "data_type": self.data_type,
            "source": {
                "table": self.source_table,
                "transformation": self.transformation_logic
            },
            "freshness": {
                "update_frequency": self.update_frequency,
                "max_staleness": self.max_staleness
            },
            "characteristics": {
                "expected_range": self.expected_range,
                "null_handling": self.null_handling,
                "examples": self.example_values
            },
            "ownership": {
                "team": self.owner_team,
                "email": self.owner_email
            },
            "lineage": {
                "upstream": self.upstream_features,
                "downstream_models": self.downstream_models
            }
        }


# Example documentation
customer_ltv_doc = FeatureDocumentation(
    name="customer_lifetime_value_90d",
    description="Total revenue from customer in last 90 days",
    feature_type=FeatureType.NUMERICAL,
    data_type="float64",
    source_table="transactions",
    transformation_logic="SUM(amount) WHERE transaction_date >= CURRENT_DATE - 90",
    update_frequency="daily",
    max_staleness="24 hours",
    expected_range=(0, 1000000),
    null_handling="default_to_zero",
    example_values=[150.50, 2340.00, 890.25],
    owner_team="Data Science",
    owner_email="ds-team@company.com",
    upstream_features=["transaction_amount"],
    downstream_models=["churn_prediction", "upsell_model"]
)
```

### Monitoring and Alerting

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
FEATURE_REQUESTS = Counter(
    'feature_store_requests_total',
    'Total feature requests',
    ['feature_view', 'entity_type']
)

FEATURE_LATENCY = Histogram(
    'feature_store_latency_seconds',
    'Feature serving latency',
    ['feature_view', 'store_type'],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
)

FEATURE_STALENESS = Gauge(
    'feature_staleness_seconds',
    'Time since last feature update',
    ['feature_view']
)

NULL_RATE = Gauge(
    'feature_null_rate',
    'Rate of null values in feature requests',
    ['feature_name']
)

class FeatureStoreMonitor:
    """Monitor feature store health and performance."""

    def __init__(self):
        self.null_counts = {}
        self.total_counts = {}

    def record_request(
        self,
        feature_view: str,
        entity_type: str,
        store_type: str,
        latency: float
    ):
        """Record a feature request."""
        FEATURE_REQUESTS.labels(
            feature_view=feature_view,
            entity_type=entity_type
        ).inc()

        FEATURE_LATENCY.labels(
            feature_view=feature_view,
            store_type=store_type
        ).observe(latency)

    def record_null_value(self, feature_name: str, is_null: bool):
        """Track null value rates."""
        if feature_name not in self.null_counts:
            self.null_counts[feature_name] = 0
            self.total_counts[feature_name] = 0

        self.total_counts[feature_name] += 1
        if is_null:
            self.null_counts[feature_name] += 1

        # Update gauge
        null_rate = self.null_counts[feature_name] / self.total_counts[feature_name]
        NULL_RATE.labels(feature_name=feature_name).set(null_rate)

    def update_staleness(self, feature_view: str, last_updated: float):
        """Update feature staleness metric."""
        staleness = time.time() - last_updated
        FEATURE_STALENESS.labels(feature_view=feature_view).set(staleness)

    def check_alerts(self) -> List[str]:
        """Check for alerting conditions."""
        alerts = []

        # Check null rates
        for feature_name, null_count in self.null_counts.items():
            null_rate = null_count / max(self.total_counts[feature_name], 1)
            if null_rate > 0.1:  # 10% threshold
                alerts.append(f"High null rate for {feature_name}: {null_rate:.2%}")

        return alerts
```

---

## Interview Questions

### Core Concepts

**Q1: What is a feature store and why do we need it?**

A feature store is a centralized repository for storing, managing, and serving ML features. Key benefits:

1. **Consistency**: Same feature computation for training and serving, eliminating skew
2. **Reusability**: Features can be shared across teams and models
3. **Discovery**: Feature catalog enables finding existing features
4. **Point-in-time correctness**: Prevents data leakage in training data
5. **Low-latency serving**: Optimized online store for real-time inference

**Q2: Explain the difference between offline and online feature stores.**

```
Offline Store:
- Purpose: Historical feature storage for model training
- Access pattern: Batch reads with point-in-time joins
- Latency: Seconds to minutes acceptable
- Storage: Data warehouse, object storage (S3, GCS)
- Examples: BigQuery, Snowflake, Parquet files

Online Store:
- Purpose: Real-time feature serving for inference
- Access pattern: Single entity, latest features
- Latency: Milliseconds (< 100ms target)
- Storage: Key-value stores, in-memory databases
- Examples: Redis, DynamoDB, Bigtable
```

**Q3: What is training-serving skew and how do you prevent it?**

Training-serving skew occurs when features used during training differ from those at inference. Prevention strategies:

1. **Single feature definition**: Use one codebase for both training and serving
2. **Feature store**: Centralized feature management ensures consistency
3. **Point-in-time joins**: Use correct timestamps in training data
4. **Feature validation**: Monitor distributions between training and serving
5. **Version control**: Track feature transformations and schemas

### System Design

**Q4: Design a feature store for a fraud detection system.**

```python
"""
Requirements:
- Real-time features (last 1h transaction patterns)
- Historical features (customer spending history)
- Low latency (<50ms for inference)
- High throughput (10K requests/second)

Architecture:

1. Data Sources
   - Transaction stream (Kafka)
   - Customer database (PostgreSQL)
   - External risk scores (API)

2. Feature Computation
   - Batch pipeline (Spark): Daily customer aggregations
   - Stream pipeline (Flink): Real-time transaction windows
   - On-demand: External API features

3. Storage
   - Offline: Delta Lake for historical features
   - Online: Redis Cluster for low-latency serving
   - Vector DB: User embeddings for similarity features

4. Serving
   - Feature server with gRPC API
   - Local caching layer
   - Circuit breaker for external dependencies

5. Monitoring
   - Feature freshness alerts
   - Latency percentiles
   - Null rate tracking
"""

class FraudDetectionFeatureStore:
    def __init__(self):
        self.offline_store = DeltaLakeStore()
        self.online_store = RedisCluster()
        self.vector_store = Pinecone()
        self.stream_processor = FlinkProcessor()

    def get_features(self, transaction: dict) -> dict:
        # Parallel feature fetches
        offline_features = self.online_store.get_features(
            entity_id=transaction["customer_id"],
            features=["total_spend_90d", "avg_transaction", "merchant_diversity"]
        )

        realtime_features = self.online_store.get_features(
            entity_id=transaction["customer_id"],
            features=["transaction_count_1h", "amount_1h", "unique_merchants_1h"]
        )

        # Similar customer features from embeddings
        customer_embedding = self.get_customer_embedding(transaction["customer_id"])
        similarity_features = self.vector_store.find_similar_entities(
            query_embedding=customer_embedding,
            top_k=10
        )

        return {
            **offline_features,
            **realtime_features,
            "avg_similar_customer_fraud_rate": self.compute_peer_fraud_rate(similarity_features)
        }
```

**Q5: How would you handle feature backfilling when adding a new feature?**

```python
"""
Feature backfilling process:

1. Define feature with historical computation
2. Validate on sample data
3. Compute historical values
4. Load to offline store
5. Materialize to online store
6. Monitor and validate
"""

def backfill_feature(
    feature_definition,
    start_date: str,
    end_date: str,
    chunk_size_days: int = 7
):
    """Backfill a new feature over historical data."""

    from datetime import datetime, timedelta

    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)

    current = start
    while current < end:
        chunk_end = min(current + timedelta(days=chunk_size_days), end)

        print(f"Processing {current} to {chunk_end}")

        # 1. Read source data for chunk
        source_data = read_source_data(
            feature_definition.source_table,
            start_date=current,
            end_date=chunk_end
        )

        # 2. Compute feature values
        feature_values = feature_definition.transform(source_data)

        # 3. Validate
        validation_result = validate_feature_values(
            feature_values,
            feature_definition.expected_schema
        )

        if not validation_result.passed:
            raise ValueError(f"Validation failed: {validation_result.errors}")

        # 4. Write to offline store
        write_to_offline_store(
            feature_values,
            feature_definition.feature_view,
            partition_date=current
        )

        # 5. Update progress
        current = chunk_end

    print("Backfill complete. Starting materialization to online store...")

    # 6. Materialize to online store
    materialize_to_online_store(
        feature_definition.feature_view,
        start_date,
        end_date
    )
```

### Practical Experience

**Q6: Describe a challenge you faced with feature stores and how you solved it.**

Example answer:

"We faced severe training-serving skew in our recommendation model. The offline training pipeline used Spark with specific null handling, while the online serving used Python with different defaults. Features like 'average_session_duration' showed 15% distribution shift.

**Solution:**

1. Created a unified feature transformation library used by both pipelines
2. Implemented feature validation that compared training and serving distributions
3. Added schema enforcement with explicit null handling rules
4. Set up automated alerts for distribution drift > 5%

**Result:** Model performance improved by 8% after eliminating skew, and we now catch issues before they reach production."

---

## Summary

Building robust ML data infrastructure requires understanding three key components:

1. **Data Lakes**: Provide scalable storage for raw and processed data with the lakehouse pattern (Bronze/Silver/Gold layers)

2. **Feature Stores**: Centralize feature management, ensuring consistency between training and serving while enabling feature reuse

3. **Vector Databases**: Enable similarity-based features through efficient embedding storage and retrieval

Key takeaways:

- Use point-in-time correct joins to prevent data leakage
- Implement both offline (training) and online (serving) stores
- Monitor feature distributions and freshness continuously
- Version control feature definitions for reproducibility
- Design for low-latency serving with appropriate caching strategies

As ML systems mature, investing in proper data infrastructure becomes critical for maintaining model quality and team productivity.

---

## Further Reading

### Official Documentation

- [Feast Documentation](https://docs.feast.dev/) - Open-source feature store
- [Delta Lake Documentation](https://docs.delta.io/) - Lakehouse storage layer
- [Tecton Documentation](https://docs.tecton.ai/) - Enterprise feature platform

### Recommended Books

- **"Fundamentals of Data Engineering"** - Joe Reis, Matt Housley
- **"Designing Machine Learning Systems"** - Chip Huyen
- **"Building Machine Learning Pipelines"** - Hannes Hapke, Catherine Nelson

### Community Resources

- [Feature Store Summit](https://www.featurestoresummit.com/) - Annual conference
- [MLOps Community](https://mlops.community/) - Discussions and best practices
- [Awesome Feature Store](https://github.com/eugeneyan/applied-ml#feature-store) - Curated resources
