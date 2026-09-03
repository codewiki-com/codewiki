---
title: Data Quality Management
description: Learn data quality testing and assurance methods
track: data
section: data-engineering
difficulty: intermediate
tags:
  - data quality
  - data governance
  - Great Expectations
  - testing
status: imported
origin: old/src/content/docs/data/data-quality.en.md
divergence: 0.181
issues: []
legacy:
  category: Data
  subcategory: Governance
  order: 23
  lastUpdated: 2026-01-07
---

Data quality is the foundation of trustworthy analytics and decision-making. Poor data quality leads to incorrect insights, failed machine learning models, and eroded trust in data systems. We'll cover the essential concepts, tools, and practices for implementing robust data quality management in modern data platforms.

## Data Quality Dimensions

Data quality is typically measured across six core dimensions. Understanding these dimensions helps teams define clear quality standards and build appropriate validation rules.

### The Six Dimensions

```
+------------------+     +------------------+     +------------------+
|   Completeness   |     |    Accuracy      |     |   Consistency    |
| Is data present? |     | Is data correct? |     | Is data aligned? |
+------------------+     +------------------+     +------------------+

+------------------+     +------------------+     +------------------+
|   Timeliness     |     |    Uniqueness    |     |    Validity      |
| Is data fresh?   |     | Is data unique?  |     | Does data conform|
+------------------+     +------------------+     +------------------+
```

### Completeness

Completeness measures whether all required data is present. Missing values can significantly impact downstream analytics.

```python
import pandas as pd
import numpy as np

def assess_completeness(df: pd.DataFrame) -> dict:
    """Calculate completeness metrics for each column."""
    total_rows = len(df)

    completeness_report = {}
    for column in df.columns:
        non_null_count = df[column].notna().sum()
        completeness_pct = (non_null_count / total_rows) * 100

        completeness_report[column] = {
            'total_rows': total_rows,
            'non_null_count': non_null_count,
            'null_count': total_rows - non_null_count,
            'completeness_pct': round(completeness_pct, 2)
        }

    return completeness_report

# Example usage
df = pd.DataFrame({
    'customer_id': [1, 2, 3, 4, 5],
    'email': ['a@test.com', 'b@test.com', None, 'd@test.com', None],
    'phone': ['555-0001', None, None, '555-0004', '555-0005']
})

report = assess_completeness(df)
# Output: email completeness = 60%, phone completeness = 60%
```

### Accuracy

Accuracy measures whether data values correctly represent real-world entities. This often requires comparison against authoritative sources.

```python
def check_accuracy(df: pd.DataFrame, reference_df: pd.DataFrame,
                   key_column: str, check_columns: list) -> dict:
    """Compare data against a reference source for accuracy."""
    merged = df.merge(reference_df, on=key_column,
                      suffixes=('_source', '_reference'))

    accuracy_report = {}
    for col in check_columns:
        source_col = f'{col}_source'
        ref_col = f'{col}_reference'

        matches = (merged[source_col] == merged[ref_col]).sum()
        total = len(merged)

        accuracy_report[col] = {
            'matching_records': matches,
            'total_records': total,
            'accuracy_pct': round((matches / total) * 100, 2) if total > 0 else 0
        }

    return accuracy_report
```

### Consistency

Consistency ensures data is uniform across different systems, tables, or time periods.

```python
def check_cross_system_consistency(source_a: pd.DataFrame,
                                   source_b: pd.DataFrame,
                                   key_column: str) -> dict:
    """Check if records exist consistently across two data sources."""
    keys_a = set(source_a[key_column].unique())
    keys_b = set(source_b[key_column].unique())

    only_in_a = keys_a - keys_b
    only_in_b = keys_b - keys_a
    in_both = keys_a & keys_b

    return {
        'source_a_count': len(keys_a),
        'source_b_count': len(keys_b),
        'consistent_count': len(in_both),
        'only_in_source_a': len(only_in_a),
        'only_in_source_b': len(only_in_b),
        'consistency_pct': round((len(in_both) / len(keys_a | keys_b)) * 100, 2)
    }
```

### Timeliness

Timeliness measures whether data is available when needed and how current it is.

```python
from datetime import datetime, timedelta

def check_data_freshness(df: pd.DataFrame,
                         timestamp_column: str,
                         max_age_hours: int = 24) -> dict:
    """Check if data is within acceptable freshness threshold."""
    max_timestamp = pd.to_datetime(df[timestamp_column]).max()
    current_time = datetime.now()

    age = current_time - max_timestamp
    age_hours = age.total_seconds() / 3600

    return {
        'latest_record': max_timestamp.isoformat(),
        'current_time': current_time.isoformat(),
        'age_hours': round(age_hours, 2),
        'threshold_hours': max_age_hours,
        'is_fresh': age_hours <= max_age_hours
    }
```

### Uniqueness

Uniqueness ensures that each record appears only once in the dataset where it should be unique.

```python
def check_uniqueness(df: pd.DataFrame, key_columns: list) -> dict:
    """Check for duplicate records based on key columns."""
    total_records = len(df)
    unique_records = df.drop_duplicates(subset=key_columns).shape[0]
    duplicate_count = total_records - unique_records

    # Get sample duplicates for investigation
    duplicates = df[df.duplicated(subset=key_columns, keep=False)]
    sample_duplicates = duplicates.head(10).to_dict('records')

    return {
        'total_records': total_records,
        'unique_records': unique_records,
        'duplicate_count': duplicate_count,
        'uniqueness_pct': round((unique_records / total_records) * 100, 2),
        'sample_duplicates': sample_duplicates
    }
```

### Validity

Validity checks whether data conforms to defined formats, ranges, and business rules.

```python
import re

def check_validity(df: pd.DataFrame, validation_rules: dict) -> dict:
    """Validate data against defined rules."""
    results = {}

    for column, rules in validation_rules.items():
        column_results = {
            'total_records': len(df),
            'valid_records': len(df),
            'violations': []
        }

        # Check regex pattern
        if 'pattern' in rules:
            pattern = re.compile(rules['pattern'])
            invalid = df[~df[column].astype(str).str.match(pattern)]
            column_results['valid_records'] -= len(invalid)
            if len(invalid) > 0:
                column_results['violations'].append({
                    'rule': 'pattern',
                    'count': len(invalid)
                })

        # Check range
        if 'min' in rules or 'max' in rules:
            min_val = rules.get('min', float('-inf'))
            max_val = rules.get('max', float('inf'))
            invalid = df[(df[column] < min_val) | (df[column] > max_val)]
            column_results['valid_records'] -= len(invalid)
            if len(invalid) > 0:
                column_results['violations'].append({
                    'rule': 'range',
                    'count': len(invalid)
                })

        # Check allowed values
        if 'allowed_values' in rules:
            invalid = df[~df[column].isin(rules['allowed_values'])]
            column_results['valid_records'] -= len(invalid)
            if len(invalid) > 0:
                column_results['violations'].append({
                    'rule': 'allowed_values',
                    'count': len(invalid)
                })

        column_results['validity_pct'] = round(
            (column_results['valid_records'] / len(df)) * 100, 2
        )
        results[column] = column_results

    return results

# Example usage
rules = {
    'email': {'pattern': r'^[\w\.-]+@[\w\.-]+\.\w+$'},
    'age': {'min': 0, 'max': 150},
    'status': {'allowed_values': ['active', 'inactive', 'pending']}
}
```

---

## Great Expectations

Great Expectations is a popular open-source Python library for data validation, documentation, and profiling. It provides a declarative framework for expressing data quality expectations.

### Installation and Setup

```bash
pip install great_expectations

# Initialize a new project
great_expectations init
```

### Core Concepts

```
+-------------------+     +-------------------+     +-------------------+
|    Expectations   |     |   Expectation     |     |   Checkpoints     |
|   Individual data |---->|      Suites       |---->|   Validation      |
|   quality rules   |     |   Collections     |     |   workflows       |
+-------------------+     +-------------------+     +-------------------+
                                  |
                                  v
                          +-------------------+
                          |   Data Docs       |
                          |   Documentation   |
                          +-------------------+
```

### Creating Expectations

```python
import great_expectations as gx
from great_expectations.core.batch import RuntimeBatchRequest

# Initialize context
context = gx.get_context()

# Create a Data Source
datasource = context.sources.add_pandas("pandas_datasource")

# Create an Expectation Suite
suite = context.add_or_update_expectation_suite(
    expectation_suite_name="orders_quality_suite"
)

# Add expectations
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="order_id")
)

suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeUnique(column="order_id")
)

suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeBetween(
        column="order_amount",
        min_value=0,
        max_value=1000000
    )
)

suite.add_expectation(
    gx.expectations.ExpectColumnValuesToMatchRegex(
        column="email",
        regex=r"^[\w\.-]+@[\w\.-]+\.\w+$"
    )
)

suite.add_expectation(
    gx.expectations.ExpectColumnValuesToBeInSet(
        column="status",
        value_set=["pending", "confirmed", "shipped", "delivered", "cancelled"]
    )
)

# Statistical expectations
suite.add_expectation(
    gx.expectations.ExpectColumnMeanToBeBetween(
        column="order_amount",
        min_value=50,
        max_value=500
    )
)

suite.add_expectation(
    gx.expectations.ExpectTableRowCountToBeBetween(
        min_value=1000,
        max_value=100000
    )
)
```

### Running Validations

```python
import pandas as pd

# Sample data
df = pd.DataFrame({
    'order_id': ['ORD-001', 'ORD-002', 'ORD-003'],
    'email': ['customer1@example.com', 'customer2@example.com', 'invalid-email'],
    'order_amount': [150.00, 250.00, 75.00],
    'status': ['pending', 'confirmed', 'shipped']
})

# Create a Batch Request
batch_request = RuntimeBatchRequest(
    datasource_name="pandas_datasource",
    data_connector_name="default_runtime_data_connector_name",
    data_asset_name="order_data",
    runtime_parameters={"batch_data": df},
    batch_identifiers={"default_identifier_name": "batch_1"}
)

# Create and run checkpoint
checkpoint = context.add_or_update_checkpoint(
    name="orders_checkpoint",
    validations=[
        {
            "batch_request": batch_request,
            "expectation_suite_name": "orders_quality_suite"
        }
    ]
)

result = checkpoint.run()

# Check results
if not result.success:
    print("Validation failed!")
    for validation_result in result.run_results.values():
        for exp_result in validation_result["validation_result"]["results"]:
            if not exp_result["success"]:
                print(f"Failed: {exp_result['expectation_config']}")
```

### Common Expectations Reference

| Category | Expectation | Description |
|----------|-------------|-------------|
| Null checks | `expect_column_values_to_not_be_null` | No null values |
| Uniqueness | `expect_column_values_to_be_unique` | All values unique |
| Range | `expect_column_values_to_be_between` | Values within range |
| Set membership | `expect_column_values_to_be_in_set` | Values in allowed list |
| Pattern | `expect_column_values_to_match_regex` | Values match pattern |
| Type | `expect_column_values_to_be_of_type` | Correct data type |
| Statistics | `expect_column_mean_to_be_between` | Mean within range |
| Row count | `expect_table_row_count_to_be_between` | Record count in range |
| Relationships | `expect_column_pair_values_A_to_be_greater_than_B` | Column comparisons |

---

## dbt Tests

dbt (data build tool) includes a powerful testing framework for validating data transformations directly in SQL. Tests run as part of your dbt pipeline, catching issues before data reaches downstream consumers.

### Built-in Tests

```yaml
# models/schema.yml
version: 2

models:
  - name: dim_customers
    description: "Customer dimension table"
    columns:
      - name: customer_id
        description: "Unique customer identifier"
        tests:
          - unique
          - not_null

      - name: email
        description: "Customer email address"
        tests:
          - unique
          - not_null

      - name: customer_segment
        description: "Customer classification"
        tests:
          - accepted_values:
              values: ['enterprise', 'mid-market', 'small-business', 'consumer']

      - name: created_at
        tests:
          - not_null

  - name: fact_orders
    description: "Order fact table"
    columns:
      - name: order_id
        tests:
          - unique
          - not_null

      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id

      - name: order_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

### Custom Tests

Create reusable test macros in your dbt project:

```sql
-- tests/generic/test_positive_values.sql
{% test positive_values(model, column_name) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} < 0

{% endtest %}
```

```sql
-- tests/generic/test_valid_email.sql
{% test valid_email(model, column_name) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} IS NOT NULL
  AND {{ column_name }} !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

{% endtest %}
```

```sql
-- tests/generic/test_freshness.sql
{% test data_freshness(model, column_name, max_age_hours=24) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} < CURRENT_TIMESTAMP - INTERVAL '{{ max_age_hours }} hours'

{% endtest %}
```

### Singular Tests

Create specific test files for complex validation logic:

```sql
-- tests/assert_total_equals_sum_of_line_items.sql
-- This test ensures order totals match the sum of their line items

WITH order_totals AS (
    SELECT
        order_id,
        total_amount
    FROM {{ ref('fact_orders') }}
),

line_item_totals AS (
    SELECT
        order_id,
        SUM(quantity * unit_price) AS calculated_total
    FROM {{ ref('fact_order_items') }}
    GROUP BY order_id
)

SELECT
    o.order_id,
    o.total_amount,
    l.calculated_total,
    ABS(o.total_amount - l.calculated_total) AS difference
FROM order_totals o
JOIN line_item_totals l ON o.order_id = l.order_id
WHERE ABS(o.total_amount - l.calculated_total) > 0.01
```

### dbt Source Freshness

Monitor source data freshness:

```yaml
# models/sources.yml
version: 2

sources:
  - name: raw_data
    database: raw_database
    schema: public
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    loaded_at_field: _loaded_at

    tables:
      - name: orders
        freshness:
          warn_after: {count: 1, period: hour}
          error_after: {count: 6, period: hour}

      - name: customers
        freshness:
          warn_after: {count: 24, period: hour}
          error_after: {count: 48, period: hour}
```

Run freshness checks:

```bash
# Check source freshness
dbt source freshness

# Run all tests
dbt test

# Run tests for specific model
dbt test --select dim_customers
```

---

## Data Profiling

Data profiling analyzes datasets to understand their structure, content, and quality characteristics. This is essential for discovering issues and establishing baseline metrics.

### Automated Profiling with pandas-profiling

```python
from ydata_profiling import ProfileReport
import pandas as pd

# Load data
df = pd.read_csv('orders.csv')

# Generate profile report
profile = ProfileReport(
    df,
    title="Orders Data Profile",
    explorative=True,
    config_file="profile_config.yaml"
)

# Save report
profile.to_file("orders_profile.html")
```

### Custom Profiling Framework

```python
from dataclasses import dataclass
from typing import Dict, List, Any
import pandas as pd
import numpy as np

@dataclass
class ColumnProfile:
    """Profile for a single column."""
    name: str
    dtype: str
    total_count: int
    null_count: int
    null_pct: float
    unique_count: int
    unique_pct: float
    sample_values: List[Any]

    # Numeric stats (if applicable)
    min_value: float = None
    max_value: float = None
    mean: float = None
    median: float = None
    std: float = None

    # String stats (if applicable)
    min_length: int = None
    max_length: int = None
    avg_length: float = None

class DataProfiler:
    """Generate comprehensive data profiles."""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.profiles: Dict[str, ColumnProfile] = {}

    def profile_column(self, column: str) -> ColumnProfile:
        """Generate profile for a single column."""
        series = self.df[column]
        total = len(series)
        null_count = series.isna().sum()

        profile = ColumnProfile(
            name=column,
            dtype=str(series.dtype),
            total_count=total,
            null_count=null_count,
            null_pct=round(null_count / total * 100, 2),
            unique_count=series.nunique(),
            unique_pct=round(series.nunique() / total * 100, 2),
            sample_values=series.dropna().head(5).tolist()
        )

        # Numeric column stats
        if pd.api.types.is_numeric_dtype(series):
            profile.min_value = series.min()
            profile.max_value = series.max()
            profile.mean = round(series.mean(), 2)
            profile.median = round(series.median(), 2)
            profile.std = round(series.std(), 2)

        # String column stats
        if pd.api.types.is_string_dtype(series) or series.dtype == 'object':
            lengths = series.dropna().astype(str).str.len()
            if len(lengths) > 0:
                profile.min_length = int(lengths.min())
                profile.max_length = int(lengths.max())
                profile.avg_length = round(lengths.mean(), 2)

        return profile

    def profile_all(self) -> Dict[str, ColumnProfile]:
        """Generate profiles for all columns."""
        for column in self.df.columns:
            self.profiles[column] = self.profile_column(column)
        return self.profiles

    def get_quality_summary(self) -> Dict:
        """Generate overall quality summary."""
        if not self.profiles:
            self.profile_all()

        return {
            'total_columns': len(self.profiles),
            'total_rows': len(self.df),
            'columns_with_nulls': sum(
                1 for p in self.profiles.values() if p.null_count > 0
            ),
            'avg_completeness': round(
                100 - np.mean([p.null_pct for p in self.profiles.values()]), 2
            ),
            'columns_summary': [
                {
                    'name': p.name,
                    'type': p.dtype,
                    'completeness': round(100 - p.null_pct, 2),
                    'uniqueness': p.unique_pct
                }
                for p in self.profiles.values()
            ]
        }

# Usage
profiler = DataProfiler(df)
profiles = profiler.profile_all()
summary = profiler.get_quality_summary()
```

### Profiling in SQL

```sql
-- PostgreSQL data profiling query
WITH column_stats AS (
    SELECT
        'customer_id' AS column_name,
        COUNT(*) AS total_rows,
        COUNT(customer_id) AS non_null_count,
        COUNT(*) - COUNT(customer_id) AS null_count,
        COUNT(DISTINCT customer_id) AS unique_count,
        MIN(customer_id)::TEXT AS min_value,
        MAX(customer_id)::TEXT AS max_value
    FROM customers

    UNION ALL

    SELECT
        'email' AS column_name,
        COUNT(*) AS total_rows,
        COUNT(email) AS non_null_count,
        COUNT(*) - COUNT(email) AS null_count,
        COUNT(DISTINCT email) AS unique_count,
        NULL AS min_value,
        NULL AS max_value
    FROM customers
)
SELECT
    column_name,
    total_rows,
    non_null_count,
    null_count,
    ROUND(non_null_count::NUMERIC / total_rows * 100, 2) AS completeness_pct,
    unique_count,
    ROUND(unique_count::NUMERIC / total_rows * 100, 2) AS uniqueness_pct,
    min_value,
    max_value
FROM column_stats;
```

---

## Anomaly Detection

Anomaly detection identifies unusual patterns in data that may indicate quality issues, system problems, or fraud.

### Statistical Anomaly Detection

```python
import pandas as pd
import numpy as np
from scipy import stats

class AnomalyDetector:
    """Detect anomalies in time series data."""

    def __init__(self, sensitivity: float = 3.0):
        self.sensitivity = sensitivity  # Number of standard deviations

    def detect_zscore(self, series: pd.Series) -> pd.DataFrame:
        """Detect anomalies using Z-score method."""
        mean = series.mean()
        std = series.std()

        z_scores = (series - mean) / std
        anomalies = abs(z_scores) > self.sensitivity

        return pd.DataFrame({
            'value': series,
            'z_score': z_scores,
            'is_anomaly': anomalies
        })

    def detect_iqr(self, series: pd.Series,
                   multiplier: float = 1.5) -> pd.DataFrame:
        """Detect anomalies using IQR method."""
        Q1 = series.quantile(0.25)
        Q3 = series.quantile(0.75)
        IQR = Q3 - Q1

        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR

        anomalies = (series < lower_bound) | (series > upper_bound)

        return pd.DataFrame({
            'value': series,
            'lower_bound': lower_bound,
            'upper_bound': upper_bound,
            'is_anomaly': anomalies
        })

    def detect_moving_average(self, series: pd.Series,
                              window: int = 7) -> pd.DataFrame:
        """Detect anomalies using moving average deviation."""
        rolling_mean = series.rolling(window=window, center=True).mean()
        rolling_std = series.rolling(window=window, center=True).std()

        deviation = abs(series - rolling_mean)
        threshold = self.sensitivity * rolling_std

        anomalies = deviation > threshold

        return pd.DataFrame({
            'value': series,
            'rolling_mean': rolling_mean,
            'deviation': deviation,
            'threshold': threshold,
            'is_anomaly': anomalies
        })

# Usage example
detector = AnomalyDetector(sensitivity=3.0)

# Daily order counts
df = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=100),
    'order_count': np.random.normal(1000, 100, 100)
})
# Add some anomalies
df.loc[25, 'order_count'] = 2000
df.loc[75, 'order_count'] = 200

results = detector.detect_zscore(df['order_count'])
print(f"Anomalies detected: {results['is_anomaly'].sum()}")
```

### Volume Anomaly Detection

```python
class VolumeAnomalyDetector:
    """Detect volume anomalies in data pipelines."""

    def __init__(self, connection):
        self.conn = connection
        self.history = {}

    def check_row_count(self, table_name: str,
                        date_column: str,
                        current_date: str) -> dict:
        """Check if today's row count is anomalous."""

        # Get historical counts
        history_query = f"""
        SELECT
            DATE({date_column}) AS date,
            COUNT(*) AS row_count
        FROM {table_name}
        WHERE DATE({date_column}) >= DATE('{current_date}') - INTERVAL '30 days'
          AND DATE({date_column}) < DATE('{current_date}')
        GROUP BY DATE({date_column})
        ORDER BY date
        """

        history_df = pd.read_sql(history_query, self.conn)

        # Get current count
        current_query = f"""
        SELECT COUNT(*) AS row_count
        FROM {table_name}
        WHERE DATE({date_column}) = DATE('{current_date}')
        """
        current_count = pd.read_sql(current_query, self.conn).iloc[0]['row_count']

        # Calculate statistics
        mean_count = history_df['row_count'].mean()
        std_count = history_df['row_count'].std()

        z_score = (current_count - mean_count) / std_count if std_count > 0 else 0

        return {
            'table': table_name,
            'date': current_date,
            'current_count': current_count,
            'historical_mean': round(mean_count, 2),
            'historical_std': round(std_count, 2),
            'z_score': round(z_score, 2),
            'is_anomaly': abs(z_score) > 3,
            'severity': 'high' if abs(z_score) > 4 else
                       ('medium' if abs(z_score) > 3 else 'low')
        }
```

### Schema Change Detection

```python
class SchemaMonitor:
    """Monitor for unexpected schema changes."""

    def __init__(self, connection):
        self.conn = connection
        self.baseline_schemas = {}

    def capture_schema(self, table_name: str) -> dict:
        """Capture current schema of a table."""
        query = """
        SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = %s
        ORDER BY ordinal_position
        """

        df = pd.read_sql(query, self.conn, params=[table_name])

        return {
            'table': table_name,
            'captured_at': datetime.now().isoformat(),
            'columns': df.to_dict('records')
        }

    def set_baseline(self, table_name: str):
        """Set baseline schema for comparison."""
        self.baseline_schemas[table_name] = self.capture_schema(table_name)

    def detect_changes(self, table_name: str) -> dict:
        """Detect schema changes from baseline."""
        if table_name not in self.baseline_schemas:
            return {'error': 'No baseline set for this table'}

        baseline = self.baseline_schemas[table_name]
        current = self.capture_schema(table_name)

        baseline_cols = {c['column_name']: c for c in baseline['columns']}
        current_cols = {c['column_name']: c for c in current['columns']}

        changes = {
            'added_columns': [],
            'removed_columns': [],
            'modified_columns': [],
            'has_changes': False
        }

        # Check for added columns
        for col_name in current_cols:
            if col_name not in baseline_cols:
                changes['added_columns'].append(col_name)
                changes['has_changes'] = True

        # Check for removed columns
        for col_name in baseline_cols:
            if col_name not in current_cols:
                changes['removed_columns'].append(col_name)
                changes['has_changes'] = True

        # Check for modified columns
        for col_name in baseline_cols:
            if col_name in current_cols:
                if baseline_cols[col_name] != current_cols[col_name]:
                    changes['modified_columns'].append({
                        'column': col_name,
                        'baseline': baseline_cols[col_name],
                        'current': current_cols[col_name]
                    })
                    changes['has_changes'] = True

        return changes
```

---

## Data Contracts

Data contracts are formal agreements between data producers and consumers that define the structure, semantics, and quality expectations of shared data.

### Contract Definition

```yaml
# contracts/orders_contract.yaml
version: "1.0"
contract:
  name: "orders"
  owner: "order-service-team"
  description: "Order events from the e-commerce platform"

schema:
  type: "object"
  properties:
    order_id:
      type: "string"
      description: "Unique order identifier"
      pattern: "^ORD-[0-9]{8}$"
      required: true

    customer_id:
      type: "integer"
      description: "Customer identifier"
      required: true

    order_date:
      type: "string"
      format: "date-time"
      description: "Order creation timestamp"
      required: true

    total_amount:
      type: "number"
      description: "Order total in USD"
      minimum: 0
      maximum: 1000000
      required: true

    status:
      type: "string"
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"]
      required: true

    items:
      type: "array"
      items:
        type: "object"
        properties:
          product_id:
            type: "string"
            required: true
          quantity:
            type: "integer"
            minimum: 1
            required: true
          unit_price:
            type: "number"
            minimum: 0
            required: true

quality:
  freshness:
    max_age_hours: 1

  completeness:
    required_fields:
      - order_id
      - customer_id
      - order_date
      - total_amount
      - status
    minimum_completeness: 0.99

  volume:
    expected_daily_records:
      min: 1000
      max: 50000

  accuracy:
    total_amount_matches_items: true

sla:
  availability: "99.9%"
  latency_p99_seconds: 5

consumers:
  - team: "analytics"
    usage: "Daily sales reporting"
  - team: "fraud-detection"
    usage: "Real-time fraud scoring"
```

### Contract Validation Engine

```python
import yaml
import jsonschema
from datetime import datetime
from typing import Dict, Any, List

class DataContractValidator:
    """Validate data against defined contracts."""

    def __init__(self, contract_path: str):
        with open(contract_path, 'r') as f:
            self.contract = yaml.safe_load(f)

    def validate_schema(self, record: dict) -> Dict[str, Any]:
        """Validate a record against the schema."""
        try:
            jsonschema.validate(record, self.contract['schema'])
            return {'valid': True, 'errors': []}
        except jsonschema.ValidationError as e:
            return {'valid': False, 'errors': [str(e)]}

    def validate_batch(self, records: List[dict]) -> Dict[str, Any]:
        """Validate a batch of records."""
        results = {
            'total_records': len(records),
            'valid_records': 0,
            'invalid_records': 0,
            'validation_errors': []
        }

        for i, record in enumerate(records):
            validation = self.validate_schema(record)
            if validation['valid']:
                results['valid_records'] += 1
            else:
                results['invalid_records'] += 1
                results['validation_errors'].append({
                    'record_index': i,
                    'errors': validation['errors']
                })

        results['validity_rate'] = round(
            results['valid_records'] / len(records) * 100, 2
        )

        return results

    def validate_quality_rules(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate quality rules from the contract."""
        quality = self.contract.get('quality', {})
        results = {'checks': [], 'passed': True}

        # Check completeness
        if 'completeness' in quality:
            required_fields = quality['completeness'].get('required_fields', [])
            min_completeness = quality['completeness'].get('minimum_completeness', 1.0)

            for field in required_fields:
                if field in df.columns:
                    completeness = df[field].notna().mean()
                    passed = completeness >= min_completeness
                    results['checks'].append({
                        'type': 'completeness',
                        'field': field,
                        'expected': min_completeness,
                        'actual': round(completeness, 4),
                        'passed': passed
                    })
                    if not passed:
                        results['passed'] = False

        # Check volume
        if 'volume' in quality:
            volume = quality['volume']
            expected = volume.get('expected_daily_records', {})
            min_records = expected.get('min', 0)
            max_records = expected.get('max', float('inf'))

            actual_count = len(df)
            passed = min_records <= actual_count <= max_records

            results['checks'].append({
                'type': 'volume',
                'expected_min': min_records,
                'expected_max': max_records,
                'actual': actual_count,
                'passed': passed
            })
            if not passed:
                results['passed'] = False

        return results
```

### Contract Registry

```python
class ContractRegistry:
    """Manage and discover data contracts."""

    def __init__(self, contracts_dir: str):
        self.contracts_dir = contracts_dir
        self.contracts = {}
        self._load_contracts()

    def _load_contracts(self):
        """Load all contracts from directory."""
        import os
        import glob

        for filepath in glob.glob(f"{self.contracts_dir}/*.yaml"):
            with open(filepath, 'r') as f:
                contract = yaml.safe_load(f)
                name = contract['contract']['name']
                self.contracts[name] = contract

    def get_contract(self, name: str) -> dict:
        """Get a contract by name."""
        return self.contracts.get(name)

    def list_contracts(self) -> List[dict]:
        """List all registered contracts."""
        return [
            {
                'name': c['contract']['name'],
                'owner': c['contract']['owner'],
                'description': c['contract']['description']
            }
            for c in self.contracts.values()
        ]

    def find_consumers(self, contract_name: str) -> List[dict]:
        """Find all consumers of a contract."""
        contract = self.contracts.get(contract_name)
        if contract:
            return contract.get('consumers', [])
        return []

    def impact_analysis(self, contract_name: str) -> dict:
        """Analyze impact of changes to a contract."""
        consumers = self.find_consumers(contract_name)
        return {
            'contract': contract_name,
            'consumer_count': len(consumers),
            'consumers': consumers
        }
```

---

## Data Observability

Data observability extends traditional monitoring to provide comprehensive visibility into data health across the entire data stack.

### Observability Pillars

```
+------------------+     +------------------+     +------------------+
|    Freshness     |     |     Volume       |     |     Schema       |
| When was data    |     | How much data    |     | Has structure    |
| last updated?    |     | is expected?     |     | changed?         |
+------------------+     +------------------+     +------------------+

+------------------+     +------------------+
|   Distribution   |     |    Lineage       |
| Are values       |     | Where does data  |
| within range?    |     | come from/go?    |
+------------------+     +------------------+
```

### Data Observability Platform

```python
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Optional
import json

@dataclass
class DataObservation:
    """A single data quality observation."""
    table_name: str
    observation_type: str
    timestamp: datetime
    value: float
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    is_anomaly: bool = False
    metadata: Dict = None

class DataObservabilityPlatform:
    """Central platform for data observability."""

    def __init__(self, storage_connection):
        self.storage = storage_connection
        self.observations: List[DataObservation] = []
        self.monitors = {}

    def add_monitor(self, table_name: str, monitor_type: str, config: dict):
        """Register a new monitor."""
        key = f"{table_name}:{monitor_type}"
        self.monitors[key] = {
            'table': table_name,
            'type': monitor_type,
            'config': config,
            'created_at': datetime.now()
        }

    def run_freshness_check(self, table_name: str,
                            timestamp_column: str) -> DataObservation:
        """Check data freshness."""
        query = f"""
        SELECT MAX({timestamp_column}) AS latest_record
        FROM {table_name}
        """
        result = pd.read_sql(query, self.storage)
        latest = result.iloc[0]['latest_record']

        age_hours = (datetime.now() - latest).total_seconds() / 3600

        monitor_config = self.monitors.get(f"{table_name}:freshness", {})
        threshold = monitor_config.get('config', {}).get('max_age_hours', 24)

        observation = DataObservation(
            table_name=table_name,
            observation_type='freshness',
            timestamp=datetime.now(),
            value=age_hours,
            threshold_max=threshold,
            is_anomaly=age_hours > threshold,
            metadata={'latest_record': latest.isoformat()}
        )

        self.observations.append(observation)
        self._alert_if_anomaly(observation)

        return observation

    def run_volume_check(self, table_name: str,
                         date_column: str = None) -> DataObservation:
        """Check data volume."""
        if date_column:
            query = f"""
            SELECT COUNT(*) AS row_count
            FROM {table_name}
            WHERE DATE({date_column}) = CURRENT_DATE
            """
        else:
            query = f"SELECT COUNT(*) AS row_count FROM {table_name}"

        result = pd.read_sql(query, self.storage)
        count = result.iloc[0]['row_count']

        # Get historical baseline
        monitor_config = self.monitors.get(f"{table_name}:volume", {})
        config = monitor_config.get('config', {})
        min_threshold = config.get('min_count', 0)
        max_threshold = config.get('max_count', float('inf'))

        is_anomaly = count < min_threshold or count > max_threshold

        observation = DataObservation(
            table_name=table_name,
            observation_type='volume',
            timestamp=datetime.now(),
            value=count,
            threshold_min=min_threshold,
            threshold_max=max_threshold,
            is_anomaly=is_anomaly
        )

        self.observations.append(observation)
        self._alert_if_anomaly(observation)

        return observation

    def run_distribution_check(self, table_name: str,
                               column_name: str) -> DataObservation:
        """Check column value distribution."""
        query = f"""
        SELECT
            AVG({column_name}) AS mean_val,
            STDDEV({column_name}) AS std_val,
            MIN({column_name}) AS min_val,
            MAX({column_name}) AS max_val,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY {column_name}) AS median_val
        FROM {table_name}
        """

        result = pd.read_sql(query, self.storage)
        stats = result.iloc[0].to_dict()

        # Compare with historical baseline
        monitor_config = self.monitors.get(
            f"{table_name}:distribution:{column_name}", {}
        )
        baseline = monitor_config.get('config', {}).get('baseline', {})

        # Check for significant deviation
        is_anomaly = False
        if baseline:
            mean_deviation = abs(stats['mean_val'] - baseline.get('mean', stats['mean_val']))
            expected_std = baseline.get('std', stats['std_val'])
            if mean_deviation > 3 * expected_std:
                is_anomaly = True

        observation = DataObservation(
            table_name=table_name,
            observation_type='distribution',
            timestamp=datetime.now(),
            value=stats['mean_val'],
            is_anomaly=is_anomaly,
            metadata={
                'column': column_name,
                'statistics': stats
            }
        )

        self.observations.append(observation)
        self._alert_if_anomaly(observation)

        return observation

    def _alert_if_anomaly(self, observation: DataObservation):
        """Send alert if anomaly detected."""
        if observation.is_anomaly:
            alert = {
                'table': observation.table_name,
                'type': observation.observation_type,
                'value': observation.value,
                'timestamp': observation.timestamp.isoformat(),
                'metadata': observation.metadata
            }
            # Send to alerting system (Slack, PagerDuty, etc.)
            print(f"ALERT: {json.dumps(alert)}")

    def get_health_dashboard(self) -> Dict:
        """Generate health dashboard data."""
        recent_observations = [
            o for o in self.observations
            if (datetime.now() - o.timestamp).total_seconds() < 86400
        ]

        return {
            'total_observations': len(recent_observations),
            'anomalies_detected': sum(1 for o in recent_observations if o.is_anomaly),
            'by_type': {
                'freshness': len([o for o in recent_observations
                                  if o.observation_type == 'freshness']),
                'volume': len([o for o in recent_observations
                               if o.observation_type == 'volume']),
                'distribution': len([o for o in recent_observations
                                     if o.observation_type == 'distribution'])
            },
            'anomaly_rate': round(
                sum(1 for o in recent_observations if o.is_anomaly) /
                len(recent_observations) * 100, 2
            ) if recent_observations else 0
        }
```

### Integration with Monitoring Systems

```python
from prometheus_client import Counter, Gauge, Histogram

# Define metrics
DQ_CHECKS_TOTAL = Counter(
    'data_quality_checks_total',
    'Total number of data quality checks run',
    ['table', 'check_type', 'status']
)

DQ_SCORE = Gauge(
    'data_quality_score',
    'Current data quality score',
    ['table', 'dimension']
)

DQ_CHECK_DURATION = Histogram(
    'data_quality_check_duration_seconds',
    'Time spent running data quality checks',
    ['table', 'check_type']
)

class MetricsExporter:
    """Export data quality metrics to Prometheus."""

    def record_check(self, table: str, check_type: str,
                     passed: bool, duration: float):
        """Record a data quality check result."""
        status = 'passed' if passed else 'failed'
        DQ_CHECKS_TOTAL.labels(
            table=table,
            check_type=check_type,
            status=status
        ).inc()

        DQ_CHECK_DURATION.labels(
            table=table,
            check_type=check_type
        ).observe(duration)

    def update_score(self, table: str, dimension: str, score: float):
        """Update quality score gauge."""
        DQ_SCORE.labels(
            table=table,
            dimension=dimension
        ).set(score)
```

---

## Best Practices

### Defense in Depth

Apply quality checks at multiple layers:

```python
class DataQualityPipeline:
    """Multi-layer data quality validation."""

    def __init__(self):
        self.layers = {
            'ingestion': [],   # Checks at data entry
            'transform': [],   # Checks during transformation
            'output': []       # Checks before serving
        }

    def add_check(self, layer: str, check_func):
        """Add a check to a specific layer."""
        self.layers[layer].append(check_func)

    def run_layer(self, layer: str, data: pd.DataFrame) -> dict:
        """Run all checks for a layer."""
        results = {'layer': layer, 'checks': [], 'passed': True}

        for check in self.layers[layer]:
            check_result = check(data)
            results['checks'].append(check_result)
            if not check_result.get('passed', True):
                results['passed'] = False

        return results
```

### Fail Fast, Fail Safe

```python
class DataQualityGate:
    """Quality gate that can block or warn."""

    def __init__(self, mode: str = 'block'):
        self.mode = mode  # 'block' or 'warn'
        self.failures = []

    def check(self, condition: bool, message: str):
        """Check a condition and handle failure."""
        if not condition:
            self.failures.append(message)

            if self.mode == 'block':
                raise DataQualityError(message)
            else:
                print(f"WARNING: {message}")

    def get_summary(self) -> dict:
        return {
            'mode': self.mode,
            'total_failures': len(self.failures),
            'failures': self.failures
        }
```

### Automated Quality Scoring

```python
def calculate_quality_score(metrics: dict) -> float:
    """Calculate overall quality score from individual metrics."""
    weights = {
        'completeness': 0.25,
        'accuracy': 0.25,
        'consistency': 0.15,
        'timeliness': 0.15,
        'uniqueness': 0.10,
        'validity': 0.10
    }

    score = 0
    for dimension, weight in weights.items():
        dimension_score = metrics.get(dimension, 100)
        score += dimension_score * weight

    return round(score, 2)
```

### Quality Documentation

```yaml
# quality_standards.yaml
tables:
  - name: fact_orders
    owner: order-service-team
    quality_sla:
      completeness: 99.5
      uniqueness: 100
      freshness_hours: 1

    critical_columns:
      - order_id
      - customer_id
      - order_date
      - total_amount

    quality_rules:
      - rule: "order_id is unique"
        severity: critical
      - rule: "total_amount >= 0"
        severity: high
      - rule: "order_date is not in future"
        severity: medium
```

---

## Summary

Effective data quality management requires a comprehensive approach:

| Component | Purpose | Key Tools |
|-----------|---------|-----------|
| **Dimensions** | Define what quality means | Completeness, Accuracy, Consistency, Timeliness, Uniqueness, Validity |
| **Great Expectations** | Declarative data validation | Python-based expectation suites |
| **dbt Tests** | SQL-native data testing | Built-in and custom tests |
| **Data Profiling** | Understand data characteristics | Automated profiling tools |
| **Anomaly Detection** | Identify unusual patterns | Statistical methods |
| **Data Contracts** | Formalize agreements | Schema and SLA definitions |
| **Observability** | Monitor data health | Metrics, alerts, dashboards |

**Key Takeaways:**

1. Define quality dimensions specific to your use cases
2. Implement validation at multiple pipeline stages
3. Use declarative tools like Great Expectations and dbt for maintainability
4. Monitor continuously rather than checking periodically
5. Establish data contracts between producers and consumers
6. Build observability into your data platform from the start
7. Automate quality scoring and alerting
8. Document quality standards and ownership

Data quality is not a one-time effort but an ongoing practice that requires investment in tooling, processes, and culture.
