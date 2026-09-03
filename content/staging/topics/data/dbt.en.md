---
title: dbt Data Transformation
description: Use dbt for data warehouse transformation and modeling
track: data
section: data-engineering
difficulty: intermediate
tags:
  - dbt
  - data transformation
  - ELT
  - data modeling
status: imported
origin: old/src/content/docs/data/dbt.en.md
divergence: 0.275
issues: []
legacy:
  category: Data
  subcategory: ETL
  order: 17
  lastUpdated: 2026-01-07
---

dbt (data build tool) is a transformation tool that enables analytics engineers and data analysts to transform data in their warehouses using SQL. It follows the ELT (Extract, Load, Transform) paradigm, where data is first loaded into the warehouse and then transformed in place. dbt has become an essential tool in the modern data stack, bridging the gap between data engineering and analytics.

## What is dbt?

dbt is an open-source command-line tool that enables data transformation workflows using SQL SELECT statements. It handles the T (Transform) in ELT, allowing you to define transformations as modular SQL queries that dbt compiles and executes against your data warehouse.

```
+-------------------------------------------------------------------+
|                    dbt in the Modern Data Stack                    |
+-------------------------------------------------------------------+
|                                                                   |
|  +-------------+     +-------------+     +-------------+          |
|  |   Extract   |---->|    Load     |---->|  Transform  |          |
|  |  (Fivetran) |     |  (Airbyte)  |     |    (dbt)    |          |
|  +-------------+     +-------------+     +-------------+          |
|                                                |                  |
|                                                v                  |
|                                    +-------------------+          |
|                                    |  Data Warehouse   |          |
|                                    |  (Snowflake/BQ)   |          |
|                                    +-------------------+          |
|                                                |                  |
|                                                v                  |
|                                    +-------------------+          |
|                                    |    BI Tools       |          |
|                                    | (Looker/Tableau)  |          |
|                                    +-------------------+          |
|                                                                   |
+-------------------------------------------------------------------+
```

### Key Features

- **SQL-based**: Write transformations in SQL, the language data analysts already know
- **Version Control**: All transformations are code that can be versioned with Git
- **Modularity**: Build reusable models that reference each other
- **Testing**: Built-in testing framework for data quality
- **Documentation**: Auto-generated documentation from model descriptions
- **Lineage**: Automatic dependency tracking and visualization

### dbt Core vs dbt Cloud

| Feature | dbt Core | dbt Cloud |
|---------|----------|-----------|
| Cost | Free (open source) | Paid subscription |
| Execution | CLI / Local | Web-based IDE |
| Scheduling | External tools (Airflow, cron) | Built-in scheduler |
| CI/CD | Manual setup | Built-in |
| Collaboration | Git-based | Team features included |
| Documentation | Self-hosted | Hosted automatically |

---

## Project Structure

A well-organized dbt project follows a standard directory structure:

```
my_dbt_project/
|-- dbt_project.yml          # Project configuration
|-- profiles.yml             # Connection config (usually in ~/.dbt/)
|-- models/                  # SQL models
|   |-- staging/            # Data cleaning layer
|   |   |-- stg_orders.sql
|   |   |-- stg_customers.sql
|   |   +-- _staging.yml    # Model docs and tests
|   |-- intermediate/       # Intermediate transformation layer
|   |   +-- int_order_items.sql
|   +-- marts/              # Business data marts
|       |-- finance/
|       |   +-- fct_revenue.sql
|       +-- marketing/
|           +-- dim_customers.sql
|-- tests/                  # Custom tests
|-- macros/                 # Reusable SQL macros
|-- seeds/                  # Static data files (CSV)
|-- snapshots/              # SCD Type 2 snapshots
+-- analyses/               # Ad-hoc queries (not materialized)
```

### Project Configuration (dbt_project.yml)

```yaml
# dbt_project.yml
name: 'my_analytics_project'
version: '1.0.0'
config-version: 2

profile: 'my_warehouse'

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

# Model configurations
models:
  my_analytics_project:
    # Default materialization
    +materialized: view

    staging:
      +schema: staging
      +materialized: view

    intermediate:
      +schema: intermediate
      +materialized: ephemeral

    marts:
      +materialized: table
      finance:
        +schema: finance
      marketing:
        +schema: marketing
```

### Connection Profile (profiles.yml)

```yaml
# ~/.dbt/profiles.yml
my_warehouse:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      role: transformer
      database: analytics_dev
      warehouse: transforming
      schema: dbt_dev
      threads: 4

    prod:
      type: snowflake
      account: "{{ env_var('SNOWFLAKE_ACCOUNT') }}"
      user: "{{ env_var('SNOWFLAKE_USER') }}"
      password: "{{ env_var('SNOWFLAKE_PASSWORD') }}"
      role: transformer
      database: analytics
      warehouse: transforming
      schema: dbt_prod
      threads: 8
```

---

## Models

Models are the core building blocks in dbt. Each model is a SQL SELECT statement stored in a `.sql` file that dbt compiles and runs against your data warehouse.

### Model Layers

Following best practices, models should be organized into layers:

```
+-------------------------------------------------------------------+
|                        Model Layer Architecture                    |
+-------------------------------------------------------------------+
|                                                                   |
|   Sources (raw data)                                              |
|       |                                                           |
|       v                                                           |
|   +-----------------------------------------------------------+   |
|   |                    Staging Layer                          |   |
|   |   - Light transformations                                 |   |
|   |   - Renaming, type casting                                |   |
|   |   - One model per source table                            |   |
|   +-----------------------------------------------------------+   |
|       |                                                           |
|       v                                                           |
|   +-----------------------------------------------------------+   |
|   |                 Intermediate Layer                        |   |
|   |   - Business logic transformations                        |   |
|   |   - Joins across staging models                           |   |
|   |   - Usually ephemeral                                     |   |
|   +-----------------------------------------------------------+   |
|       |                                                           |
|       v                                                           |
|   +-----------------------------------------------------------+   |
|   |                      Marts Layer                          |   |
|   |   - Business-focused datasets                             |   |
|   |   - Dimensional models (facts and dimensions)             |   |
|   |   - Ready for BI tools                                    |   |
|   +-----------------------------------------------------------+   |
|                                                                   |
+-------------------------------------------------------------------+
```

### Staging Model Example

```sql
-- models/staging/stg_orders.sql

{{ config(
    materialized='view',
    schema='staging'
) }}

WITH source AS (
    SELECT * FROM {{ source('ecommerce', 'raw_orders') }}
),

renamed AS (
    SELECT
        -- Primary key
        id AS order_id,

        -- Foreign keys
        customer_id,
        product_id,

        -- Numeric fields with type casting
        quantity,
        CAST(unit_price AS DECIMAL(10, 2)) AS unit_price,

        -- Date fields
        CAST(order_date AS DATE) AS order_date,
        CAST(created_at AS TIMESTAMP) AS created_at,

        -- Standardize status values
        LOWER(TRIM(status)) AS order_status,

        -- Metadata
        CURRENT_TIMESTAMP AS _loaded_at
    FROM source
    WHERE id IS NOT NULL
      AND quantity > 0
)

SELECT * FROM renamed
```

### Intermediate Model Example

```sql
-- models/intermediate/int_order_items_enriched.sql

{{ config(
    materialized='ephemeral'
) }}

WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
),

customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

products AS (
    SELECT * FROM {{ ref('stg_products') }}
),

enriched AS (
    SELECT
        o.order_id,
        o.order_date,
        o.quantity,
        o.unit_price,
        o.quantity * o.unit_price AS line_total,

        -- Customer attributes
        c.customer_id,
        c.customer_name,
        c.customer_segment,
        c.region,

        -- Product attributes
        p.product_id,
        p.product_name,
        p.category,
        p.subcategory,

        -- Derived dimensions
        DATE_TRUNC('month', o.order_date) AS order_month,
        DATE_TRUNC('quarter', o.order_date) AS order_quarter,
        EXTRACT(DOW FROM o.order_date) AS day_of_week

    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN products p ON o.product_id = p.product_id
)

SELECT * FROM enriched
```

### Mart Model Example

```sql
-- models/marts/finance/fct_daily_revenue.sql

{{ config(
    materialized='table',
    schema='finance',
    unique_key='date_day'
) }}

WITH order_items AS (
    SELECT * FROM {{ ref('int_order_items_enriched') }}
),

daily_aggregates AS (
    SELECT
        order_date AS date_day,

        -- Revenue metrics
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(line_total) AS gross_revenue,
        AVG(line_total) AS avg_order_value,

        -- Customer metrics
        COUNT(DISTINCT customer_id) AS unique_customers,

        -- Segment breakdown
        SUM(CASE WHEN customer_segment = 'enterprise' THEN line_total ELSE 0 END) AS enterprise_revenue,
        SUM(CASE WHEN customer_segment = 'smb' THEN line_total ELSE 0 END) AS smb_revenue,
        SUM(CASE WHEN customer_segment = 'consumer' THEN line_total ELSE 0 END) AS consumer_revenue,

        -- Category breakdown
        SUM(CASE WHEN category = 'electronics' THEN line_total ELSE 0 END) AS electronics_revenue,
        SUM(CASE WHEN category = 'clothing' THEN line_total ELSE 0 END) AS clothing_revenue,
        SUM(CASE WHEN category = 'home' THEN line_total ELSE 0 END) AS home_revenue

    FROM order_items
    GROUP BY order_date
)

SELECT
    *,
    ROUND(enterprise_revenue / NULLIF(gross_revenue, 0) * 100, 2) AS enterprise_pct,
    ROUND(smb_revenue / NULLIF(gross_revenue, 0) * 100, 2) AS smb_pct,
    ROUND(consumer_revenue / NULLIF(gross_revenue, 0) * 100, 2) AS consumer_pct,
    CURRENT_TIMESTAMP AS _updated_at
FROM daily_aggregates
```

---

## Materializations

Materializations determine how dbt builds a model in the warehouse. Choosing the right materialization affects performance, cost, and data freshness.

### Materialization Types

| Type | Description | Use Case | Storage |
|------|-------------|----------|---------|
| View | Creates a database view | Small transformations, always fresh data | No extra storage |
| Table | Creates a physical table | Larger datasets, complex queries | Full data copy |
| Incremental | Appends or updates rows | Large datasets, append-only or slowly changing | Partial updates |
| Ephemeral | Not materialized, injected as CTE | Intermediate calculations | No storage |

### View Materialization

```sql
-- models/staging/stg_users.sql

{{ config(materialized='view') }}

SELECT
    id AS user_id,
    email,
    created_at
FROM {{ source('app', 'users') }}
```

### Table Materialization

```sql
-- models/marts/dim_customers.sql

{{ config(materialized='table') }}

SELECT
    customer_id,
    customer_name,
    email,
    segment,
    created_at,
    CURRENT_TIMESTAMP AS _updated_at
FROM {{ ref('stg_customers') }}
```

### Incremental Materialization

```sql
-- models/marts/fct_events.sql

{{ config(
    materialized='incremental',
    unique_key='event_id',
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

WITH source_events AS (
    SELECT
        event_id,
        user_id,
        event_type,
        event_timestamp,
        properties
    FROM {{ ref('stg_events') }}

    {% if is_incremental() %}
    -- Only process new events since last run
    WHERE event_timestamp > (SELECT MAX(event_timestamp) FROM {{ this }})
    {% endif %}
)

SELECT
    *,
    CURRENT_TIMESTAMP AS _loaded_at
FROM source_events
```

### Incremental Strategies

Different warehouses support different incremental strategies:

```sql
-- Merge strategy (Snowflake, BigQuery, Databricks)
{{ config(
    materialized='incremental',
    unique_key='id',
    incremental_strategy='merge'
) }}

-- Delete+Insert strategy (Redshift, Postgres)
{{ config(
    materialized='incremental',
    unique_key='id',
    incremental_strategy='delete+insert'
) }}

-- Insert Overwrite by partition (BigQuery, Spark)
{{ config(
    materialized='incremental',
    incremental_strategy='insert_overwrite',
    partition_by={
        "field": "event_date",
        "data_type": "date"
    }
) }}
```

### Ephemeral Materialization

```sql
-- models/intermediate/int_user_metrics.sql

{{ config(materialized='ephemeral') }}

-- This will be injected as a CTE in downstream models
SELECT
    user_id,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_spend,
    MIN(order_date) AS first_order_date,
    MAX(order_date) AS last_order_date
FROM {{ ref('stg_orders') }}
GROUP BY user_id
```

---

## Sources and Refs

dbt uses two primary functions to reference data: `source()` for raw data and `ref()` for other models.

### Defining Sources

Sources represent raw data loaded into your warehouse by external tools.

```yaml
# models/staging/_sources.yml

version: 2

sources:
  - name: ecommerce
    description: "Raw e-commerce data from production database"
    database: raw_data
    schema: ecommerce_prod

    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}

    loaded_at_field: _loaded_at

    tables:
      - name: raw_orders
        description: "Order transactions"
        identifier: orders  # Actual table name if different
        columns:
          - name: id
            description: "Primary key"
            tests:
              - unique
              - not_null
          - name: customer_id
            tests:
              - not_null
          - name: status
            tests:
              - accepted_values:
                  values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

      - name: raw_customers
        description: "Customer master data"

      - name: raw_products
        description: "Product catalog"
```

### Using Sources

```sql
-- models/staging/stg_orders.sql

SELECT
    id AS order_id,
    customer_id,
    order_date,
    status
FROM {{ source('ecommerce', 'raw_orders') }}
```

### Using Refs

The `ref()` function creates dependencies between models and enables dbt to build them in the correct order.

```sql
-- models/marts/fct_orders.sql

WITH orders AS (
    -- Reference to staging model
    SELECT * FROM {{ ref('stg_orders') }}
),

customers AS (
    -- Reference to another model
    SELECT * FROM {{ ref('dim_customers') }}
),

joined AS (
    SELECT
        o.*,
        c.customer_name,
        c.segment
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
)

SELECT * FROM joined
```

### Cross-Project References

In dbt 1.6+, you can reference models across projects:

```sql
-- Reference a model from another dbt project
SELECT * FROM {{ ref('shared_project', 'dim_date') }}
```

### Source Freshness

Check if source data is up to date:

```bash
# Run source freshness checks
dbt source freshness

# Only check specific sources
dbt source freshness --select source:ecommerce
```

---

## Tests

dbt provides a robust testing framework to validate data quality and model integrity.

### Built-in Generic Tests

```yaml
# models/staging/_staging.yml

version: 2

models:
  - name: stg_orders
    description: "Cleaned order data"
    columns:
      - name: order_id
        description: "Unique order identifier"
        tests:
          - unique
          - not_null

      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('stg_customers')
              field: customer_id

      - name: order_status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

      - name: order_amount
        tests:
          - not_null
```

### Custom Generic Tests

```sql
-- tests/generic/test_positive_value.sql

{% test positive_value(model, column_name) %}

SELECT
    {{ column_name }} AS failing_value
FROM {{ model }}
WHERE {{ column_name }} < 0

{% endtest %}
```

Use the custom test:

```yaml
# models/marts/_marts.yml

models:
  - name: fct_revenue
    columns:
      - name: gross_revenue
        tests:
          - positive_value
```

### Singular Tests

Create specific tests for complex business logic:

```sql
-- tests/assert_total_revenue_positive.sql

-- This test fails if any rows are returned
SELECT
    date_day,
    gross_revenue
FROM {{ ref('fct_daily_revenue') }}
WHERE gross_revenue < 0
```

```sql
-- tests/assert_orders_have_customers.sql

-- Check referential integrity across models
WITH orders AS (
    SELECT DISTINCT customer_id FROM {{ ref('fct_orders') }}
),

customers AS (
    SELECT customer_id FROM {{ ref('dim_customers') }}
)

SELECT
    o.customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL
```

### Test Severity and Configuration

```yaml
# models/marts/_marts.yml

models:
  - name: fct_orders
    columns:
      - name: order_id
        tests:
          - unique:
              severity: error  # Fail the run
          - not_null:
              severity: warn   # Just warn, don't fail

      - name: discount_amount
        tests:
          - not_null:
              where: "order_date > '2024-01-01'"  # Conditional test
```

### Running Tests

```bash
# Run all tests
dbt test

# Run tests for specific models
dbt test --select stg_orders

# Run only data tests (not schema tests)
dbt test --select test_type:data

# Run tests for models in marts folder
dbt test --select marts.*
```

---

## Documentation

dbt automatically generates documentation from your project, making it easy to understand data lineage and model details.

### Documenting Models

```yaml
# models/marts/finance/_finance.yml

version: 2

models:
  - name: fct_daily_revenue
    description: |
      Daily revenue aggregations for financial reporting.

      **Grain**: One row per day
      **Update Frequency**: Daily at 6 AM UTC
      **Owner**: Finance Team

      This model aggregates order data to provide daily revenue metrics
      broken down by customer segment and product category.

    columns:
      - name: date_day
        description: "The calendar date (YYYY-MM-DD)"

      - name: gross_revenue
        description: |
          Total revenue before discounts and refunds.
          Calculated as SUM(quantity * unit_price).

      - name: total_orders
        description: "Count of distinct orders placed on this day"

      - name: unique_customers
        description: "Count of distinct customers who placed orders"
```

### Doc Blocks

Create reusable documentation blocks:

```markdown
<!-- docs/descriptions.md -->

{% docs order_status %}

The current status of the order:

| Status | Description |
|--------|-------------|
| pending | Order received, awaiting payment |
| confirmed | Payment received, preparing to ship |
| shipped | Order has been shipped |
| delivered | Order delivered to customer |
| cancelled | Order was cancelled |

{% enddocs %}

{% docs customer_segment %}

Customer segments based on annual spend:

- **enterprise**: Annual spend > $100,000
- **smb**: Annual spend $10,000 - $100,000
- **consumer**: Annual spend < $10,000

{% enddocs %}
```

Reference doc blocks in YAML:

```yaml
# models/staging/_staging.yml

models:
  - name: stg_orders
    columns:
      - name: order_status
        description: "{{ doc('order_status') }}"
```

### Generating Documentation

```bash
# Generate documentation
dbt docs generate

# Serve documentation locally
dbt docs serve

# Generate with specific target
dbt docs generate --target prod
```

### Model Descriptions in SQL

You can also add descriptions directly in model files:

```sql
-- models/marts/dim_customers.sql

{{
    config(
        materialized='table',
        description='Customer dimension table with demographic and behavioral attributes'
    )
}}

SELECT
    customer_id,
    customer_name,
    -- Add column descriptions
    {{ dbt_utils.safe_cast('created_at', 'date') }} AS signup_date
FROM {{ ref('stg_customers') }}
```

---

## Macros

Macros are reusable pieces of Jinja code that help you write DRY (Don't Repeat Yourself) SQL.

### Basic Macro

```sql
-- macros/cents_to_dollars.sql

{% macro cents_to_dollars(column_name, precision=2) %}
    ROUND({{ column_name }} / 100.0, {{ precision }})
{% endmacro %}
```

Use in a model:

```sql
-- models/staging/stg_payments.sql

SELECT
    payment_id,
    {{ cents_to_dollars('amount_cents') }} AS amount_dollars
FROM {{ source('payments', 'transactions') }}
```

### Generating SQL Dynamically

```sql
-- macros/generate_schema_name.sql

{% macro generate_schema_name(custom_schema_name, node) %}
    {%- set default_schema = target.schema -%}

    {%- if custom_schema_name is none -%}
        {{ default_schema }}
    {%- else -%}
        {{ default_schema }}_{{ custom_schema_name | trim }}
    {%- endif -%}
{% endmacro %}
```

### Pivot Macro

```sql
-- macros/pivot.sql

{% macro pivot(column, values, alias=True, agg='sum', cmp='=', then_value=1, else_value=0, prefix='', suffix='', quote_identifiers=True) %}
    {% for value in values %}
        {{ agg }}(
            CASE
                WHEN {{ column }} {{ cmp }} '{{ value }}'
                THEN {{ then_value }}
                ELSE {{ else_value }}
            END
        )
        {% if alias %}
            AS {{ prefix }}{{ value | replace(' ', '_') | lower }}{{ suffix }}
        {% endif %}
        {% if not loop.last %},{% endif %}
    {% endfor %}
{% endmacro %}
```

Use the pivot macro:

```sql
-- models/marts/fct_order_status_counts.sql

SELECT
    order_date,
    {{ pivot(
        column='order_status',
        values=['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        agg='count',
        then_value=1,
        prefix='status_'
    ) }}
FROM {{ ref('stg_orders') }}
GROUP BY order_date
```

### Grant Permissions Macro

```sql
-- macros/grant_select.sql

{% macro grant_select(role) %}
    {% set sql %}
        GRANT SELECT ON {{ this }} TO ROLE {{ role }};
    {% endset %}

    {{ log('Granting select on ' ~ this ~ ' to ' ~ role, info=True) }}
    {% do run_query(sql) %}
{% endmacro %}
```

Use as a post-hook:

```sql
-- models/marts/fct_revenue.sql

{{ config(
    materialized='table',
    post_hook="{{ grant_select('ANALYST_ROLE') }}"
) }}

SELECT * FROM {{ ref('int_revenue_calcs') }}
```

### Date Spine Macro

```sql
-- macros/date_spine.sql

{% macro date_spine(start_date, end_date) %}

WITH date_spine AS (
    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('" ~ start_date ~ "' as date)",
        end_date="cast('" ~ end_date ~ "' as date)"
    ) }}
)

SELECT
    date_day,
    EXTRACT(DOW FROM date_day) AS day_of_week,
    EXTRACT(MONTH FROM date_day) AS month_num,
    EXTRACT(YEAR FROM date_day) AS year_num,
    CASE WHEN EXTRACT(DOW FROM date_day) IN (0, 6) THEN TRUE ELSE FALSE END AS is_weekend
FROM date_spine

{% endmacro %}
```

---

## Packages

dbt packages are reusable collections of macros and models that can be installed from the dbt Hub or Git repositories.

### Installing Packages

```yaml
# packages.yml

packages:
  # From dbt Hub
  - package: dbt-labs/dbt_utils
    version: 1.1.1

  - package: calogica/dbt_expectations
    version: 0.10.1

  - package: dbt-labs/codegen
    version: 0.12.1

  # From Git
  - git: "https://github.com/company/internal-dbt-package.git"
    revision: v1.0.0

  # From local path
  - local: ../shared-dbt-package
```

Install packages:

```bash
dbt deps
```

### Popular Packages

#### dbt_utils

```sql
-- Generate surrogate keys
SELECT
    {{ dbt_utils.generate_surrogate_key(['customer_id', 'order_date']) }} AS order_key,
    customer_id,
    order_date
FROM {{ ref('stg_orders') }}

-- Pivot columns
{{ dbt_utils.pivot(
    column='status',
    values=dbt_utils.get_column_values(ref('stg_orders'), 'status'),
    agg='count'
) }}

-- Union multiple relations
{{ dbt_utils.union_relations(
    relations=[ref('orders_2022'), ref('orders_2023'), ref('orders_2024')]
) }}
```

#### dbt_expectations

```yaml
# models/staging/_staging.yml

models:
  - name: stg_orders
    tests:
      - dbt_expectations.expect_table_row_count_to_be_between:
          min_value: 1000
          max_value: 1000000

    columns:
      - name: order_date
        tests:
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: "'2020-01-01'"
              max_value: "CURRENT_DATE"

      - name: email
        tests:
          - dbt_expectations.expect_column_values_to_match_regex:
              regex: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$"
```

#### codegen

Generate YAML schema files:

```sql
-- Run in dbt Cloud IDE or via dbt run-operation
{{ codegen.generate_model_yaml(
    model_names=['stg_orders', 'stg_customers']
) }}

-- Generate source YAML
{{ codegen.generate_source(
    schema_name='raw_ecommerce',
    database_name='raw_data',
    table_names=['orders', 'customers', 'products']
) }}
```

### Creating Your Own Package

```yaml
# my_package/dbt_project.yml

name: 'my_analytics_utils'
version: '1.0.0'
config-version: 2

macro-paths: ["macros"]
```

```sql
-- my_package/macros/safe_divide.sql

{% macro safe_divide(numerator, denominator, default=0) %}
    CASE
        WHEN {{ denominator }} = 0 OR {{ denominator }} IS NULL
        THEN {{ default }}
        ELSE {{ numerator }} / {{ denominator }}
    END
{% endmacro %}
```

---

## CI/CD Integration

Integrating dbt into CI/CD pipelines ensures code quality and automated deployments.

### GitHub Actions Workflow

```yaml
# .github/workflows/dbt-ci.yml

name: dbt CI

on:
  pull_request:
    branches: [main]
    paths:
      - 'models/**'
      - 'macros/**'
      - 'tests/**'
      - 'dbt_project.yml'

jobs:
  dbt-test:
    runs-on: ubuntu-latest

    env:
      DBT_PROFILES_DIR: ./
      SNOWFLAKE_ACCOUNT: ${{ secrets.SNOWFLAKE_ACCOUNT }}
      SNOWFLAKE_USER: ${{ secrets.SNOWFLAKE_USER }}
      SNOWFLAKE_PASSWORD: ${{ secrets.SNOWFLAKE_PASSWORD }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install dbt-snowflake==1.7.0
          dbt deps

      - name: Run dbt debug
        run: dbt debug

      - name: Run dbt build (modified models only)
        run: |
          dbt build --select state:modified+ --defer --state ./prod-manifest

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dbt-artifacts
          path: |
            target/manifest.json
            target/run_results.json
```

### Slim CI with State Comparison

Only test modified models by comparing against production state:

```yaml
# .github/workflows/dbt-slim-ci.yml

name: dbt Slim CI

on:
  pull_request:
    branches: [main]

jobs:
  dbt-slim-ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Download production manifest
        uses: actions/download-artifact@v4
        with:
          name: prod-manifest
          path: ./prod-manifest

      - name: Install dbt
        run: pip install dbt-snowflake

      - name: Run modified models
        run: |
          dbt build \
            --select state:modified+ \
            --defer \
            --state ./prod-manifest \
            --target ci

      - name: Upload manifest
        uses: actions/upload-artifact@v4
        with:
          name: pr-manifest
          path: target/manifest.json
```

### Production Deployment

```yaml
# .github/workflows/dbt-deploy.yml

name: dbt Production Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Install dbt
        run: pip install dbt-snowflake

      - name: Install packages
        run: dbt deps

      - name: Run dbt build
        run: dbt build --target prod

      - name: Generate docs
        run: dbt docs generate --target prod

      - name: Upload production manifest
        uses: actions/upload-artifact@v4
        with:
          name: prod-manifest
          path: target/manifest.json

      - name: Deploy docs to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./target
```

### Integration with Airflow

```python
# dags/dbt_dag.py

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    'owner': 'data_team',
    'depends_on_past': False,
    'email_on_failure': True,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'dbt_daily_build',
    default_args=default_args,
    description='Daily dbt build',
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
)

dbt_deps = BashOperator(
    task_id='dbt_deps',
    bash_command='cd /opt/dbt && dbt deps',
    dag=dag,
)

dbt_run_staging = BashOperator(
    task_id='dbt_run_staging',
    bash_command='cd /opt/dbt && dbt run --select staging',
    dag=dag,
)

dbt_test_staging = BashOperator(
    task_id='dbt_test_staging',
    bash_command='cd /opt/dbt && dbt test --select staging',
    dag=dag,
)

dbt_run_marts = BashOperator(
    task_id='dbt_run_marts',
    bash_command='cd /opt/dbt && dbt run --select marts',
    dag=dag,
)

dbt_test_marts = BashOperator(
    task_id='dbt_test_marts',
    bash_command='cd /opt/dbt && dbt test --select marts',
    dag=dag,
)

dbt_docs = BashOperator(
    task_id='dbt_docs_generate',
    bash_command='cd /opt/dbt && dbt docs generate',
    dag=dag,
)

# Define dependencies
dbt_deps >> dbt_run_staging >> dbt_test_staging >> dbt_run_marts >> dbt_test_marts >> dbt_docs
```

---

## Snapshots

Snapshots capture the state of mutable data over time, implementing Slowly Changing Dimensions (SCD Type 2).

### Creating Snapshots

```sql
-- snapshots/customer_snapshot.sql

{% snapshot customer_snapshot %}

{{
    config(
        target_database='analytics',
        target_schema='snapshots',
        unique_key='customer_id',
        strategy='timestamp',
        updated_at='updated_at',
        invalidate_hard_deletes=True
    )
}}

SELECT
    customer_id,
    customer_name,
    email,
    customer_segment,
    region,
    updated_at
FROM {{ source('ecommerce', 'customers') }}

{% endsnapshot %}
```

### Check Strategy

Use when you don't have an updated_at column:

```sql
-- snapshots/product_snapshot.sql

{% snapshot product_snapshot %}

{{
    config(
        target_schema='snapshots',
        unique_key='product_id',
        strategy='check',
        check_cols=['product_name', 'price', 'category']
    )
}}

SELECT
    product_id,
    product_name,
    price,
    category,
    CURRENT_TIMESTAMP AS snapshot_time
FROM {{ source('catalog', 'products') }}

{% endsnapshot %}
```

### Running Snapshots

```bash
# Run all snapshots
dbt snapshot

# Run specific snapshot
dbt snapshot --select customer_snapshot
```

### Using Snapshots in Models

```sql
-- models/marts/dim_customers.sql

WITH current_customers AS (
    SELECT *
    FROM {{ ref('customer_snapshot') }}
    WHERE dbt_valid_to IS NULL  -- Current records only
),

historical_customers AS (
    SELECT
        customer_id,
        customer_name,
        customer_segment,
        dbt_valid_from AS valid_from,
        dbt_valid_to AS valid_to,
        CASE WHEN dbt_valid_to IS NULL THEN TRUE ELSE FALSE END AS is_current
    FROM {{ ref('customer_snapshot') }}
)

SELECT * FROM current_customers
```

---

## Seeds

Seeds are CSV files that dbt loads into your warehouse as tables. They are useful for static reference data.

### Creating Seeds

```csv
<!-- seeds/country_codes.csv -->
country_code,country_name,region
US,United States,North America
CA,Canada,North America
GB,United Kingdom,Europe
DE,Germany,Europe
FR,France,Europe
JP,Japan,Asia Pacific
AU,Australia,Asia Pacific
```

### Seed Configuration

```yaml
# dbt_project.yml

seeds:
  my_project:
    +schema: reference_data
    country_codes:
      +column_types:
        country_code: varchar(2)
        country_name: varchar(100)
        region: varchar(50)
```

### Running Seeds

```bash
# Load all seeds
dbt seed

# Load specific seed
dbt seed --select country_codes

# Full refresh (drop and recreate)
dbt seed --full-refresh
```

### Using Seeds in Models

```sql
-- models/marts/dim_geography.sql

WITH countries AS (
    SELECT * FROM {{ ref('country_codes') }}
),

addresses AS (
    SELECT * FROM {{ ref('stg_addresses') }}
)

SELECT
    a.address_id,
    a.city,
    a.state,
    a.postal_code,
    c.country_name,
    c.region
FROM addresses a
LEFT JOIN countries c ON a.country_code = c.country_code
```

---

## Best Practices

### Model Naming Conventions

| Layer | Prefix | Example |
|-------|--------|---------|
| Staging | stg_ | stg_orders |
| Intermediate | int_ | int_order_items |
| Fact | fct_ | fct_daily_revenue |
| Dimension | dim_ | dim_customers |

### Model Selection Syntax

```bash
# Run a specific model
dbt run --select my_model

# Run a model and its descendants
dbt run --select my_model+

# Run a model and its ancestors
dbt run --select +my_model

# Run a model with ancestors and descendants
dbt run --select +my_model+

# Run models in a specific folder
dbt run --select marts.finance

# Run by tag
dbt run --select tag:daily

# Exclude models
dbt run --select marts --exclude fct_legacy

# Run modified models (state comparison)
dbt run --select state:modified+
```

### Configuration Hierarchy

```yaml
# dbt_project.yml (lowest priority)
models:
  my_project:
    +materialized: view

# In-model config (highest priority)
# {{ config(materialized='table') }}
```

### Performance Optimization

```sql
-- Use clustering keys (Snowflake)
{{ config(
    materialized='table',
    cluster_by=['date_day', 'customer_segment']
) }}

-- Use partitioning (BigQuery)
{{ config(
    materialized='table',
    partition_by={
        'field': 'created_date',
        'data_type': 'date',
        'granularity': 'day'
    }
) }}

-- Use sort and dist keys (Redshift)
{{ config(
    materialized='table',
    sort='created_at',
    dist='customer_id'
) }}
```

### Debugging Tips

```bash
# Compile SQL without running
dbt compile --select my_model

# Show compiled SQL
cat target/compiled/my_project/models/my_model.sql

# Run with full refresh (rebuild incremental models)
dbt run --full-refresh --select my_model

# Debug connection
dbt debug

# Show parsed project
dbt parse
```

---

## Further Reading

### Official Resources

- [dbt Documentation](https://docs.getdbt.com/) - Comprehensive official documentation
- [dbt Learn](https://courses.getdbt.com/) - Free official courses
- [dbt Hub](https://hub.getdbt.com/) - Package registry

### Community Resources

- [dbt Discourse](https://discourse.getdbt.com/) - Community forum
- [dbt Slack](https://www.getdbt.com/community/) - Active community chat
- [Analytics Engineering Roundup](https://roundup.getdbt.com/) - Weekly newsletter

### Related Tools

- **Orchestration**: Apache Airflow, Prefect, Dagster
- **Data Quality**: Great Expectations, Soda, Elementary
- **BI/Visualization**: Looker, Tableau, Metabase, Superset
- **Data Integration**: Fivetran, Airbyte, Stitch

---

> **Summary**: dbt has transformed how data teams build and maintain data pipelines by bringing software engineering best practices to analytics workflows. With its SQL-based approach, built-in testing, documentation, and version control, dbt enables data teams to build reliable, maintainable, and well-documented data transformations. Whether you are starting a new analytics project or modernizing an existing data warehouse, dbt provides the tools and patterns needed for success.
