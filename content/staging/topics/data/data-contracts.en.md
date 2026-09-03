---
title: Data Contracts Design
description: A comprehensive guide to data contracts - formal agreements for data exchange between producers and consumers
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Data Contracts
  - Data Quality
  - Schema
  - Data Mesh
  - Data Governance
status: imported
origin: old/src/content/docs/data/data-contracts.en.md
divergence: 0.224
issues: []
legacy:
  category: Data
  subcategory: Data Engineering
  order: 24
  lastUpdated: 2026-01-20
---

Data contracts are formal agreements that define the structure, semantics, and quality expectations for data exchanged between producers and consumers. As organizations embrace data mesh architectures and decentralized data ownership, data contracts have become essential for ensuring reliable, trustworthy data flows across organizational boundaries. This guide covers everything you need to know about designing, implementing, and managing data contracts effectively.

## Understanding Data Contracts

### What is a Data Contract?

A data contract is a formal specification that establishes an agreement between a data producer (the team or system that creates data) and data consumers (the teams or systems that use that data). Unlike simple schemas that only define structure, data contracts encompass the complete set of expectations around data delivery.

**Key Components of a Data Contract:**

| Component | Description | Example |
|-----------|-------------|---------|
| Schema | Structure and data types | Field names, types, nullability |
| Semantics | Business meaning of fields | "revenue" means gross revenue in USD |
| Quality Rules | Data quality expectations | Completeness > 99%, no duplicates |
| SLAs | Service level agreements | Freshness < 1 hour, availability 99.9% |
| Ownership | Responsible parties | Team contact, escalation paths |
| Versioning | Change management rules | Semantic versioning, deprecation policy |

### Why Data Contracts Matter

**The Problem Without Data Contracts:**

```
Producer Team                    Consumer Team
     │                                │
     │  Makes schema change           │
     ├──────────────────────────────►│
     │                                │  Pipeline breaks!
     │                                │  Reports show wrong data!
     │  No notification given         │  Trust in data erodes
     │                                │
```

**With Data Contracts:**

```
Producer Team                    Contract                    Consumer Team
     │                              │                              │
     │  Proposes change             │                              │
     ├─────────────────────────────►│                              │
     │                              │  Validates against rules     │
     │                              │  Notifies consumers          │
     │                              ├─────────────────────────────►│
     │                              │                              │  Reviews impact
     │                              │◄─────────────────────────────┤
     │  Implements change           │  Approval received           │
     │                              │                              │
```

### Data Contracts vs. Schemas

Many teams confuse data contracts with schemas. While related, they serve different purposes:

| Aspect | Schema | Data Contract |
|--------|--------|---------------|
| **Scope** | Technical structure only | Structure + semantics + SLAs + governance |
| **Focus** | "What shape is the data?" | "What can I expect from this data?" |
| **Ownership** | Often implicit | Explicitly defined |
| **Versioning** | Usually schema registry | Contract lifecycle management |
| **Quality** | Not addressed | Core component |
| **SLAs** | Not included | Explicitly defined |
| **Consumers** | Unknown or implicit | Registered and tracked |

**Schema Example (Avro):**

```json
{
  "type": "record",
  "name": "Order",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "status", "type": "string"}
  ]
}
```

**Data Contract Example:**

```yaml
dataContractSpecification: 0.9.3
id: orders-contract
info:
  title: Orders Data Contract
  version: 1.0.0
  owner: order-processing-team
  contact:
    email: orders-team@company.com
    slack: "#orders-data"

schema:
  type: object
  properties:
    order_id:
      type: string
      description: Unique identifier for the order (UUID v4)
      pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    amount:
      type: number
      description: Order total in USD (gross, pre-tax)
      minimum: 0
    status:
      type: string
      description: Current order status
      enum: [pending, confirmed, shipped, delivered, cancelled]

quality:
  - type: completeness
    column: order_id
    mustBe: 100
  - type: uniqueness
    column: order_id
    mustBe: 100
  - type: freshness
    maxDelay: PT1H

sla:
  availability: 99.9%
  latency: P0DT1H
  support: business-hours
```

## Core Principles of Data Contract Design

### The Contract-First Approach

Design contracts before implementing data pipelines, not after. This approach ensures that:

1. **Producers and consumers align** on expectations upfront
2. **Breaking changes are identified** before they happen
3. **Documentation is built-in**, not an afterthought
4. **Quality expectations are explicit** from day one

```yaml
# Step 1: Define the contract first
dataContractSpecification: 0.9.3
id: customer-events-v1
info:
  title: Customer Events Stream
  version: 1.0.0
  status: draft  # Start in draft status
  owner: customer-platform-team

# Step 2: Review with consumers
consumers:
  - team: marketing-analytics
    usage: Customer segmentation
    contactedOn: 2024-01-15
    approved: true
  - team: fraud-detection
    usage: Real-time fraud scoring
    contactedOn: 2024-01-16
    approved: pending

# Step 3: Implement after approval
```

### Semantic Clarity

Every field should have unambiguous business meaning:

```yaml
schema:
  type: object
  properties:
    revenue:
      type: number
      description: |
        Total revenue for the transaction in USD.
        - Includes: base price, shipping fees, taxes
        - Excludes: discounts, refunds
        - Currency: Always USD (converted at transaction time)
        - Precision: 2 decimal places
      examples:
        - 99.99
        - 1234.56

    created_at:
      type: string
      format: date-time
      description: |
        Timestamp when the record was created.
        - Timezone: UTC (ISO 8601 format)
        - Precision: Milliseconds
        - Source: Application server clock
      examples:
        - "2024-01-15T10:30:00.000Z"
```

### Versioning Strategy

Use semantic versioning with clear rules for changes:

```yaml
versioning:
  strategy: semantic  # MAJOR.MINOR.PATCH

  rules:
    major:  # Breaking changes
      - Removing a field
      - Changing a field type
      - Changing field semantics
      - Removing enum values

    minor:  # Backward compatible additions
      - Adding optional fields
      - Adding enum values
      - Relaxing constraints

    patch:  # No schema changes
      - Documentation updates
      - Bug fixes in validation

  deprecation:
    noticePeroid: 90d
    sunsetPeriod: 180d
    communicationChannels:
      - email
      - slack
      - changelog
```

## Data Contract Specification Formats

### YAML-Based Contracts (Data Contract Specification)

The [Data Contract Specification](https://datacontract.com) is an open standard for defining data contracts:

```yaml
dataContractSpecification: 0.9.3
id: sales-transactions
info:
  title: Sales Transactions
  version: 2.1.0
  description: |
    Contains all completed sales transactions from the e-commerce platform.
    Updated in near real-time (< 5 minute delay).
  owner: sales-platform-team
  contact:
    name: Sales Platform Team
    email: sales-platform@company.com
    url: https://wiki.company.com/sales-platform

servers:
  production:
    type: kafka
    topic: sales.transactions.v2
    broker: kafka.company.com:9092
    format: avro
    schemaRegistryUrl: https://schema-registry.company.com

  analytics:
    type: bigquery
    project: analytics-prod
    dataset: sales
    table: transactions

models:
  SalesTransaction:
    description: A completed sales transaction
    type: object
    fields:
      transaction_id:
        type: string
        format: uuid
        description: Unique identifier for the transaction
        required: true
        unique: true
        pii: false

      customer_id:
        type: string
        description: Identifier of the customer
        required: true
        pii: true
        classification: confidential

      amount:
        type: decimal
        precision: 10
        scale: 2
        description: Transaction amount in USD
        required: true
        minimum: 0

      items:
        type: array
        items:
          $ref: "#/definitions/LineItem"
        minItems: 1

      transaction_time:
        type: timestamp
        description: When the transaction occurred (UTC)
        required: true

definitions:
  LineItem:
    type: object
    fields:
      sku:
        type: string
        required: true
      quantity:
        type: integer
        minimum: 1
        required: true
      unit_price:
        type: decimal
        precision: 10
        scale: 2
        required: true

quality:
  type: SodaCL
  specification: |
    checks for SalesTransaction:
      - row_count > 0
      - missing_count(transaction_id) = 0
      - duplicate_count(transaction_id) = 0
      - invalid_count(amount) = 0:
          valid min: 0
      - freshness(transaction_time) < 5m

servicelevels:
  availability:
    percentage: 99.9%
  retention:
    period: 2y
    unlimited: false
  latency:
    threshold: 5m
    percentile: p99
  freshness:
    threshold: 5m
  support:
    time: business hours
    responseTime: 4h

terms:
  usage: |
    This data may be used for:
    - Sales analytics and reporting
    - Customer behavior analysis
    - Revenue forecasting

    This data may NOT be used for:
    - Direct marketing without consent
    - Sharing with third parties

  limitations: |
    - Data is eventually consistent
    - Historical data before 2023-01-01 may be incomplete

  billing: internal chargeback at $0.01 per 1000 records
```

### JSON Schema with Extensions

For teams preferring JSON Schema, add contract metadata via extensions:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://company.com/schemas/order-events/v1",
  "title": "Order Events",
  "description": "Events emitted when order state changes",

  "x-data-contract": {
    "version": "1.2.0",
    "owner": {
      "team": "order-service",
      "email": "orders@company.com",
      "slack": "#order-service-support"
    },
    "sla": {
      "availability": "99.95%",
      "maxLatency": "PT30S",
      "freshness": "PT1M"
    },
    "classification": "internal",
    "retentionPeriod": "P2Y"
  },

  "type": "object",
  "required": ["event_id", "event_type", "order_id", "timestamp"],

  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "Unique event identifier",
      "x-pii": false
    },
    "event_type": {
      "type": "string",
      "enum": ["created", "updated", "shipped", "delivered", "cancelled"],
      "description": "Type of order event"
    },
    "order_id": {
      "type": "string",
      "pattern": "^ORD-[0-9]{10}$",
      "description": "Order identifier",
      "x-pii": false
    },
    "customer_id": {
      "type": "string",
      "description": "Customer identifier",
      "x-pii": true,
      "x-classification": "confidential"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Event timestamp in ISO 8601 format (UTC)"
    },
    "payload": {
      "type": "object",
      "description": "Event-specific payload data"
    }
  },

  "x-quality-rules": [
    {
      "name": "event_id_unique",
      "type": "uniqueness",
      "column": "event_id",
      "threshold": 100
    },
    {
      "name": "timestamp_freshness",
      "type": "freshness",
      "column": "timestamp",
      "maxAge": "PT5M"
    }
  ]
}
```

### Protocol Buffers with Contract Metadata

For gRPC and high-performance scenarios:

```protobuf
syntax = "proto3";

package company.orders.v1;

import "google/protobuf/timestamp.proto";

option java_package = "com.company.orders.v1";
option go_package = "company.com/orders/v1";

// Data Contract Metadata
// Owner: order-processing-team
// Contact: orders@company.com
// SLA: 99.9% availability, < 100ms p99 latency
// Version: 1.0.0

// OrderEvent represents a change in order state
message OrderEvent {
  // Unique event identifier (UUID v4)
  // Required: true, PII: false
  string event_id = 1;

  // Type of event that occurred
  EventType event_type = 2;

  // The order this event relates to
  // Required: true, PII: false
  string order_id = 3;

  // When this event occurred
  google.protobuf.Timestamp timestamp = 4;

  // Customer who owns the order
  // Required: true, PII: true, Classification: confidential
  string customer_id = 5;

  // Event-specific details
  oneof details {
    OrderCreated created = 10;
    OrderUpdated updated = 11;
    OrderShipped shipped = 12;
  }
}

enum EventType {
  EVENT_TYPE_UNSPECIFIED = 0;
  EVENT_TYPE_CREATED = 1;
  EVENT_TYPE_UPDATED = 2;
  EVENT_TYPE_SHIPPED = 3;
  EVENT_TYPE_DELIVERED = 4;
  EVENT_TYPE_CANCELLED = 5;
}

message OrderCreated {
  repeated LineItem items = 1;
  Money total = 2;
}

message OrderUpdated {
  repeated string changed_fields = 1;
}

message OrderShipped {
  string carrier = 1;
  string tracking_number = 2;
}

message LineItem {
  string sku = 1;
  int32 quantity = 2;
  Money unit_price = 3;
}

message Money {
  string currency_code = 1;  // ISO 4217
  int64 units = 2;           // Whole units
  int32 nanos = 3;           // Nano units (10^-9)
}
```

## Implementing Data Quality Checks

### Great Expectations Integration

[Great Expectations](https://greatexpectations.io) is a powerful framework for data validation:

```python
import great_expectations as gx
from great_expectations.core.expectation_configuration import ExpectationConfiguration

def create_contract_expectations(contract: dict) -> gx.ExpectationSuite:
    """Convert data contract to Great Expectations suite."""

    suite = gx.ExpectationSuite(
        name=f"{contract['id']}_validation",
        meta={
            "contract_version": contract["info"]["version"],
            "owner": contract["info"]["owner"]
        }
    )

    # Add schema expectations
    for field_name, field_spec in contract["schema"]["properties"].items():
        # Check field exists
        suite.add_expectation(
            ExpectationConfiguration(
                expectation_type="expect_column_to_exist",
                kwargs={"column": field_name}
            )
        )

        # Check data type
        type_mapping = {
            "string": "str",
            "integer": "int64",
            "number": "float64",
            "boolean": "bool"
        }
        if field_spec.get("type") in type_mapping:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_of_type",
                    kwargs={
                        "column": field_name,
                        "type_": type_mapping[field_spec["type"]]
                    }
                )
            )

        # Check for required fields (not null)
        if field_name in contract["schema"].get("required", []):
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_not_be_null",
                    kwargs={"column": field_name}
                )
            )

        # Check enum values
        if "enum" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_in_set",
                    kwargs={
                        "column": field_name,
                        "value_set": field_spec["enum"]
                    }
                )
            )

        # Check regex patterns
        if "pattern" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_match_regex",
                    kwargs={
                        "column": field_name,
                        "regex": field_spec["pattern"]
                    }
                )
            )

        # Check numeric ranges
        if "minimum" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_between",
                    kwargs={
                        "column": field_name,
                        "min_value": field_spec["minimum"],
                        "max_value": field_spec.get("maximum")
                    }
                )
            )

    return suite


def validate_data_against_contract(df, contract: dict) -> dict:
    """Validate a DataFrame against a data contract."""

    context = gx.get_context()

    # Create expectation suite from contract
    suite = create_contract_expectations(contract)
    context.suites.add(suite)

    # Create data source and batch
    data_source = context.data_sources.add_pandas("contract_validation")
    data_asset = data_source.add_dataframe_asset("data_to_validate")
    batch_definition = data_asset.add_batch_definition_whole_dataframe("full_batch")
    batch = batch_definition.get_batch(batch_parameters={"dataframe": df})

    # Run validation
    validation_result = batch.validate(suite)

    return {
        "success": validation_result.success,
        "statistics": validation_result.statistics,
        "results": [
            {
                "expectation": r.expectation_config.expectation_type,
                "success": r.success,
                "observed_value": r.result.get("observed_value")
            }
            for r in validation_result.results
        ]
    }


# Example usage
if __name__ == "__main__":
    import pandas as pd

    # Sample contract
    contract = {
        "id": "orders-contract",
        "info": {"version": "1.0.0", "owner": "orders-team"},
        "schema": {
            "properties": {
                "order_id": {"type": "string", "pattern": "^ORD-[0-9]+$"},
                "amount": {"type": "number", "minimum": 0},
                "status": {"type": "string", "enum": ["pending", "shipped", "delivered"]}
            },
            "required": ["order_id", "amount", "status"]
        }
    }

    # Sample data
    df = pd.DataFrame({
        "order_id": ["ORD-001", "ORD-002", "ORD-003"],
        "amount": [99.99, 149.50, 75.00],
        "status": ["pending", "shipped", "delivered"]
    })

    result = validate_data_against_contract(df, contract)
    print(f"Validation passed: {result['success']}")
```

### Soda Core Integration

[Soda Core](https://www.soda.io/) provides a declarative approach to data quality:

```yaml
# soda_checks.yml - Generated from data contract
checks for orders:
  # Schema checks
  - schema:
      fail:
        when required column missing:
          - order_id
          - amount
          - status
          - created_at
        when wrong column type:
          order_id: varchar
          amount: decimal
          status: varchar
          created_at: timestamp

  # Completeness checks
  - missing_count(order_id) = 0:
      name: Order ID must not be null

  - missing_percent(amount) < 1:
      name: Amount completeness above 99%

  # Uniqueness checks
  - duplicate_count(order_id) = 0:
      name: Order IDs must be unique

  # Validity checks
  - invalid_count(status) = 0:
      valid values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
      name: Status must be valid enum value

  - invalid_count(amount) = 0:
      valid min: 0
      name: Amount must be non-negative

  # Freshness check
  - freshness(created_at) < 1h:
      name: Data must be less than 1 hour old

  # Volume check
  - row_count > 0:
      name: Table must not be empty

  # Custom SQL check
  - failed rows:
      name: Order total must match line items
      fail query: |
        SELECT order_id
        FROM orders o
        WHERE amount != (
          SELECT SUM(quantity * unit_price)
          FROM order_items
          WHERE order_id = o.order_id
        )
```

```python
from soda.core.scan import Scan
import yaml

def run_contract_validation(
    contract_path: str,
    connection_config: dict
) -> dict:
    """Run Soda validation based on data contract."""

    # Load contract and generate Soda checks
    with open(contract_path) as f:
        contract = yaml.safe_load(f)

    soda_checks = generate_soda_checks(contract)

    # Run scan
    scan = Scan()
    scan.set_data_source_name("production")
    scan.add_configuration_yaml_str(yaml.dump(connection_config))
    scan.add_sodacl_yaml_str(soda_checks)

    scan.execute()

    return {
        "has_failures": scan.has_check_fails(),
        "has_warnings": scan.has_check_warns(),
        "results": scan.get_scan_results()
    }


def generate_soda_checks(contract: dict) -> str:
    """Generate SodaCL checks from data contract."""

    table_name = contract.get("server", {}).get("table", contract["id"])
    checks = [f"checks for {table_name}:"]

    # Generate schema checks
    schema_check = ["  - schema:", "      fail:"]
    required_fields = contract.get("schema", {}).get("required", [])
    if required_fields:
        schema_check.append("        when required column missing:")
        for field in required_fields:
            schema_check.append(f"          - {field}")
    checks.extend(schema_check)

    # Generate quality checks from contract
    for quality_rule in contract.get("quality", []):
        if quality_rule["type"] == "completeness":
            column = quality_rule["column"]
            threshold = quality_rule.get("mustBe", 100)
            if threshold == 100:
                checks.append(f"  - missing_count({column}) = 0")
            else:
                checks.append(f"  - missing_percent({column}) < {100 - threshold}")

        elif quality_rule["type"] == "uniqueness":
            column = quality_rule["column"]
            checks.append(f"  - duplicate_count({column}) = 0")

        elif quality_rule["type"] == "freshness":
            max_delay = quality_rule.get("maxDelay", "PT1H")
            # Convert ISO 8601 duration to Soda format
            hours = parse_duration_hours(max_delay)
            checks.append(f"  - freshness(updated_at) < {hours}h")

    return "\n".join(checks)


def parse_duration_hours(iso_duration: str) -> int:
    """Parse ISO 8601 duration to hours."""
    import re
    match = re.match(r'PT(\d+)H', iso_duration)
    return int(match.group(1)) if match else 1
```

### Custom Validation Framework

Build a reusable validation framework for data contracts:

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Callable, List, Optional
from datetime import datetime, timedelta
import pandas as pd

@dataclass
class ValidationResult:
    rule_name: str
    passed: bool
    actual_value: Any
    expected_value: Any
    message: str
    severity: str = "error"

class ValidationRule(ABC):
    def __init__(self, name: str, severity: str = "error"):
        self.name = name
        self.severity = severity

    @abstractmethod
    def validate(self, data: pd.DataFrame) -> ValidationResult:
        pass

class CompletenessRule(ValidationRule):
    def __init__(self, column: str, threshold: float = 1.0, **kwargs):
        super().__init__(f"completeness_{column}", **kwargs)
        self.column = column
        self.threshold = threshold

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        if self.column not in data.columns:
            return ValidationResult(
                rule_name=self.name,
                passed=False,
                actual_value=None,
                expected_value=f"Column {self.column} exists",
                message=f"Column {self.column} not found"
            )

        completeness = 1 - (data[self.column].isna().sum() / len(data))
        passed = completeness >= self.threshold

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=round(completeness, 4),
            expected_value=self.threshold,
            message=f"Completeness: {completeness:.2%} (threshold: {self.threshold:.2%})",
            severity=self.severity
        )

class UniquenessRule(ValidationRule):
    def __init__(self, column: str, **kwargs):
        super().__init__(f"uniqueness_{column}", **kwargs)
        self.column = column

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        duplicates = data[self.column].duplicated().sum()
        passed = duplicates == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=duplicates,
            expected_value=0,
            message=f"Found {duplicates} duplicate values in {self.column}",
            severity=self.severity
        )

class FreshnessRule(ValidationRule):
    def __init__(self, column: str, max_age: timedelta, **kwargs):
        super().__init__(f"freshness_{column}", **kwargs)
        self.column = column
        self.max_age = max_age

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        max_timestamp = pd.to_datetime(data[self.column]).max()
        age = datetime.utcnow() - max_timestamp.to_pydatetime()
        passed = age <= self.max_age

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=str(age),
            expected_value=str(self.max_age),
            message=f"Data age: {age}, max allowed: {self.max_age}",
            severity=self.severity
        )

class EnumRule(ValidationRule):
    def __init__(self, column: str, allowed_values: List[Any], **kwargs):
        super().__init__(f"enum_{column}", **kwargs)
        self.column = column
        self.allowed_values = set(allowed_values)

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        invalid = data[~data[self.column].isin(self.allowed_values)][self.column].unique()
        passed = len(invalid) == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=list(invalid),
            expected_value=list(self.allowed_values),
            message=f"Invalid values found: {list(invalid)}",
            severity=self.severity
        )

class RangeRule(ValidationRule):
    def __init__(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        **kwargs
    ):
        super().__init__(f"range_{column}", **kwargs)
        self.column = column
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        violations = 0
        col_data = data[self.column].dropna()

        if self.min_value is not None:
            violations += (col_data < self.min_value).sum()
        if self.max_value is not None:
            violations += (col_data > self.max_value).sum()

        passed = violations == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=violations,
            expected_value=0,
            message=f"Found {violations} values outside range [{self.min_value}, {self.max_value}]",
            severity=self.severity
        )

class CustomRule(ValidationRule):
    def __init__(self, name: str, validation_fn: Callable[[pd.DataFrame], bool], **kwargs):
        super().__init__(name, **kwargs)
        self.validation_fn = validation_fn

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        try:
            passed = self.validation_fn(data)
            return ValidationResult(
                rule_name=self.name,
                passed=passed,
                actual_value=passed,
                expected_value=True,
                message=f"Custom validation {'passed' if passed else 'failed'}",
                severity=self.severity
            )
        except Exception as e:
            return ValidationResult(
                rule_name=self.name,
                passed=False,
                actual_value=str(e),
                expected_value="No error",
                message=f"Validation error: {e}",
                severity=self.severity
            )


class DataContractValidator:
    """Main validator that combines multiple rules."""

    def __init__(self, contract_id: str):
        self.contract_id = contract_id
        self.rules: List[ValidationRule] = []

    def add_rule(self, rule: ValidationRule) -> "DataContractValidator":
        self.rules.append(rule)
        return self

    def validate(self, data: pd.DataFrame) -> dict:
        results = [rule.validate(data) for rule in self.rules]

        errors = [r for r in results if not r.passed and r.severity == "error"]
        warnings = [r for r in results if not r.passed and r.severity == "warning"]

        return {
            "contract_id": self.contract_id,
            "timestamp": datetime.utcnow().isoformat(),
            "passed": len(errors) == 0,
            "total_rules": len(self.rules),
            "passed_rules": len([r for r in results if r.passed]),
            "error_count": len(errors),
            "warning_count": len(warnings),
            "results": [
                {
                    "rule": r.rule_name,
                    "passed": r.passed,
                    "actual": r.actual_value,
                    "expected": r.expected_value,
                    "message": r.message,
                    "severity": r.severity
                }
                for r in results
            ]
        }

    @classmethod
    def from_contract(cls, contract: dict) -> "DataContractValidator":
        """Build validator from contract definition."""

        validator = cls(contract["id"])
        schema = contract.get("schema", {})
        properties = schema.get("properties", {})
        required = schema.get("required", [])

        # Add completeness rules for required fields
        for field in required:
            validator.add_rule(CompletenessRule(field, threshold=1.0))

        # Add type-specific rules
        for field_name, field_spec in properties.items():
            if "enum" in field_spec:
                validator.add_rule(EnumRule(field_name, field_spec["enum"]))

            if "minimum" in field_spec or "maximum" in field_spec:
                validator.add_rule(RangeRule(
                    field_name,
                    min_value=field_spec.get("minimum"),
                    max_value=field_spec.get("maximum")
                ))

            if field_spec.get("unique"):
                validator.add_rule(UniquenessRule(field_name))

        # Add quality rules
        for quality_rule in contract.get("quality", []):
            if quality_rule["type"] == "completeness":
                validator.add_rule(CompletenessRule(
                    quality_rule["column"],
                    threshold=quality_rule.get("mustBe", 100) / 100
                ))
            elif quality_rule["type"] == "uniqueness":
                validator.add_rule(UniquenessRule(quality_rule["column"]))
            elif quality_rule["type"] == "freshness":
                # Parse ISO duration
                hours = int(quality_rule.get("maxDelay", "PT1H").replace("PT", "").replace("H", ""))
                validator.add_rule(FreshnessRule(
                    quality_rule.get("column", "updated_at"),
                    max_age=timedelta(hours=hours)
                ))

        return validator


# Example usage
if __name__ == "__main__":
    # Define contract
    contract = {
        "id": "user-events-contract",
        "schema": {
            "properties": {
                "event_id": {"type": "string", "unique": True},
                "user_id": {"type": "string"},
                "event_type": {
                    "type": "string",
                    "enum": ["click", "view", "purchase"]
                },
                "amount": {"type": "number", "minimum": 0},
                "timestamp": {"type": "string", "format": "date-time"}
            },
            "required": ["event_id", "user_id", "event_type", "timestamp"]
        },
        "quality": [
            {"type": "completeness", "column": "event_id", "mustBe": 100},
            {"type": "uniqueness", "column": "event_id"},
            {"type": "freshness", "column": "timestamp", "maxDelay": "PT1H"}
        ]
    }

    # Create validator
    validator = DataContractValidator.from_contract(contract)

    # Test data
    df = pd.DataFrame({
        "event_id": ["e1", "e2", "e3"],
        "user_id": ["u1", "u2", "u3"],
        "event_type": ["click", "view", "purchase"],
        "amount": [10.0, None, 25.0],
        "timestamp": [datetime.utcnow().isoformat()] * 3
    })

    # Validate
    result = validator.validate(df)
    print(f"Validation passed: {result['passed']}")
    for r in result["results"]:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"  [{status}] {r['rule']}: {r['message']}")
```

## Best Practices for Data Contract Design

### 1. Start with Consumer Needs

Design contracts based on what consumers actually need, not what producers can provide:

```yaml
# Bad: Producer-centric contract (exposes internal details)
schema:
  properties:
    _internal_id:
      type: integer
      description: Database auto-increment ID
    raw_json_payload:
      type: string
      description: Unparsed JSON blob

# Good: Consumer-centric contract (provides useful abstractions)
schema:
  properties:
    order_id:
      type: string
      format: uuid
      description: Stable external identifier for the order
    line_items:
      type: array
      items:
        $ref: "#/definitions/LineItem"
      description: Parsed and validated order line items
```

### 2. Make Breaking Changes Explicit

Define clear rules for what constitutes a breaking change:

```yaml
breaking_change_policy:
  requires_major_version:
    - Removing a field
    - Renaming a field
    - Changing a field's type
    - Changing a field's semantic meaning
    - Making an optional field required
    - Narrowing an enum's allowed values
    - Tightening validation constraints

  requires_minor_version:
    - Adding a new optional field
    - Expanding an enum's allowed values
    - Relaxing validation constraints
    - Adding new optional quality rules

  requires_patch_version:
    - Documentation updates
    - Internal implementation changes
    - Bug fixes that don't affect the interface
```

### 3. Include Ownership and Escalation

Clear ownership prevents "orphaned" data:

```yaml
ownership:
  producer:
    team: order-processing-team
    product_owner: jane.smith@company.com
    tech_lead: john.doe@company.com
    slack_channel: "#order-processing"
    on_call_rotation: https://pagerduty.com/order-team

  consumers:
    - team: analytics
      contact: analytics-team@company.com
      usage: Daily revenue reporting
      criticality: high

    - team: fraud-detection
      contact: fraud-team@company.com
      usage: Real-time fraud scoring
      criticality: critical

escalation:
  level_1:
    contact: data-platform-oncall@company.com
    response_time: 15m
    scope: Data availability issues

  level_2:
    contact: data-platform-manager@company.com
    response_time: 1h
    scope: SLA breaches, contract violations

  level_3:
    contact: vp-engineering@company.com
    response_time: 4h
    scope: Critical business impact
```

### 4. Version Your Contracts Properly

Implement semantic versioning with clear migration paths:

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import semver

class ChangeType(Enum):
    BREAKING = "breaking"
    FEATURE = "feature"
    FIX = "fix"

@dataclass
class ContractChange:
    change_type: ChangeType
    description: str
    affected_fields: List[str]
    migration_guide: Optional[str] = None

class ContractVersionManager:
    def __init__(self, current_version: str):
        self.current_version = semver.VersionInfo.parse(current_version)
        self.pending_changes: List[ContractChange] = []

    def add_change(self, change: ContractChange):
        self.pending_changes.append(change)

    def calculate_next_version(self) -> str:
        has_breaking = any(c.change_type == ChangeType.BREAKING for c in self.pending_changes)
        has_feature = any(c.change_type == ChangeType.FEATURE for c in self.pending_changes)

        if has_breaking:
            return str(self.current_version.bump_major())
        elif has_feature:
            return str(self.current_version.bump_minor())
        else:
            return str(self.current_version.bump_patch())

    def generate_changelog(self) -> str:
        next_version = self.calculate_next_version()

        changelog = [f"## Version {next_version}\n"]

        breaking_changes = [c for c in self.pending_changes if c.change_type == ChangeType.BREAKING]
        if breaking_changes:
            changelog.append("### Breaking Changes\n")
            for change in breaking_changes:
                changelog.append(f"- {change.description}")
                if change.migration_guide:
                    changelog.append(f"  - Migration: {change.migration_guide}")

        features = [c for c in self.pending_changes if c.change_type == ChangeType.FEATURE]
        if features:
            changelog.append("\n### New Features\n")
            for change in features:
                changelog.append(f"- {change.description}")

        fixes = [c for c in self.pending_changes if c.change_type == ChangeType.FIX]
        if fixes:
            changelog.append("\n### Fixes\n")
            for change in fixes:
                changelog.append(f"- {change.description}")

        return "\n".join(changelog)

# Example usage
version_manager = ContractVersionManager("1.2.3")

version_manager.add_change(ContractChange(
    change_type=ChangeType.BREAKING,
    description="Removed deprecated 'legacy_id' field",
    affected_fields=["legacy_id"],
    migration_guide="Use 'order_id' instead. See migration script at /scripts/migrate_legacy_id.py"
))

version_manager.add_change(ContractChange(
    change_type=ChangeType.FEATURE,
    description="Added 'shipping_method' field",
    affected_fields=["shipping_method"]
))

print(f"Next version: {version_manager.calculate_next_version()}")  # 2.0.0
print(version_manager.generate_changelog())
```

### 5. Integrate with CI/CD

Validate contracts automatically in your pipeline:

```yaml
# .github/workflows/contract-validation.yml
name: Data Contract Validation

on:
  pull_request:
    paths:
      - 'contracts/**'
      - 'schemas/**'

jobs:
  validate-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install datacontract-cli pyyaml jsonschema

      - name: Validate contract syntax
        run: |
          for contract in contracts/*.yaml; do
            echo "Validating $contract..."
            datacontract lint "$contract"
          done

      - name: Check for breaking changes
        run: |
          # Compare with main branch
          git fetch origin main

          for contract in contracts/*.yaml; do
            contract_name=$(basename "$contract")

            if git show origin/main:"$contract" > /tmp/old_contract.yaml 2>/dev/null; then
              echo "Checking $contract_name for breaking changes..."
              datacontract breaking /tmp/old_contract.yaml "$contract"
            else
              echo "$contract_name is new, skipping breaking change check"
            fi
          done

      - name: Validate against sample data
        run: |
          python scripts/validate_sample_data.py

      - name: Generate documentation
        run: |
          mkdir -p docs/contracts
          for contract in contracts/*.yaml; do
            contract_name=$(basename "$contract" .yaml)
            datacontract export --format html "$contract" > "docs/contracts/${contract_name}.html"
          done

      - name: Upload documentation
        uses: actions/upload-artifact@v4
        with:
          name: contract-docs
          path: docs/contracts/
```

```python
# scripts/validate_sample_data.py
import yaml
import pandas as pd
from pathlib import Path
from contract_validator import DataContractValidator

def main():
    contracts_dir = Path("contracts")
    sample_data_dir = Path("sample_data")

    failures = []

    for contract_file in contracts_dir.glob("*.yaml"):
        print(f"Validating {contract_file.name}...")

        with open(contract_file) as f:
            contract = yaml.safe_load(f)

        # Look for corresponding sample data
        sample_file = sample_data_dir / f"{contract_file.stem}.csv"
        if not sample_file.exists():
            print(f"  Warning: No sample data found at {sample_file}")
            continue

        df = pd.read_csv(sample_file)
        validator = DataContractValidator.from_contract(contract)
        result = validator.validate(df)

        if not result["passed"]:
            failures.append({
                "contract": contract_file.name,
                "errors": [r for r in result["results"] if not r["passed"]]
            })
            print(f"  FAILED: {result['error_count']} errors")
        else:
            print(f"  PASSED: All {result['total_rules']} rules passed")

    if failures:
        print("\n=== VALIDATION FAILURES ===")
        for failure in failures:
            print(f"\n{failure['contract']}:")
            for error in failure["errors"]:
                print(f"  - {error['rule']}: {error['message']}")
        exit(1)

    print("\nAll contracts validated successfully!")

if __name__ == "__main__":
    main()
```

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Overly Strict Contracts

**Problem:** Contracts that are too strict break constantly and create friction.

```yaml
# Too strict - will fail on minor variations
quality:
  - type: completeness
    column: optional_notes
    mustBe: 100  # This field is optional!

  - type: pattern
    column: phone
    regex: "^\\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$"  # Only US format!
```

**Solution:** Design for realistic variations:

```yaml
quality:
  - type: completeness
    column: optional_notes
    mustBe: 0  # Optional field, no completeness requirement
    severity: info

  - type: pattern
    column: phone
    regex: "^\\+?[0-9\\-\\s]{7,15}$"  # International formats

  - type: custom
    name: phone_format_distribution
    severity: warning
    description: Monitor phone format distribution for anomalies
```

### Pitfall 2: Overly Loose Contracts

**Problem:** Contracts without teeth don't protect consumers.

```yaml
# Too loose - provides no guarantees
schema:
  properties:
    data:
      type: object
      description: Contains order data
      # No field definitions, no validation

quality: []  # No quality rules!
```

**Solution:** Define meaningful constraints:

```yaml
schema:
  properties:
    order_id:
      type: string
      format: uuid
      description: Unique order identifier
    amount:
      type: number
      minimum: 0
      maximum: 1000000
    status:
      type: string
      enum: [pending, confirmed, shipped, delivered, cancelled]

quality:
  - type: completeness
    column: order_id
    mustBe: 100
  - type: uniqueness
    column: order_id
  - type: freshness
    maxDelay: PT1H
```

### Pitfall 3: Version Management Chaos

**Problem:** No clear versioning leads to confusion and broken consumers.

```
# Chaotic versioning
contracts/
  orders.yaml           # Which version is this?
  orders_new.yaml       # Is this newer?
  orders_v2.yaml        # What about this?
  orders_final.yaml     # Really final?
  orders_final_v2.yaml  # ...
```

**Solution:** Use semantic versioning with a single source of truth:

```
contracts/
  orders/
    contract.yaml           # Current version (has version in metadata)
    CHANGELOG.md            # Version history
    versions/
      1.0.0.yaml            # Archived versions
      1.1.0.yaml
      2.0.0.yaml
```

```yaml
# contract.yaml
info:
  version: 2.1.0
  previousVersions:
    - version: 2.0.0
      deprecatedOn: 2024-01-15
      sunsetOn: 2024-04-15
    - version: 1.1.0
      deprecatedOn: 2023-10-01
      sunsetOn: 2024-01-01
      status: sunset
```

### Pitfall 4: Missing Governance

**Problem:** No process for contract changes leads to surprises.

**Solution:** Implement a governance workflow:

```python
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

class ContractStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    SUNSET = "sunset"

@dataclass
class ContractReview:
    reviewer: str
    team: str
    approved: bool
    comments: Optional[str]
    reviewed_at: datetime

@dataclass
class ContractProposal:
    contract_id: str
    version: str
    author: str
    status: ContractStatus
    changes_description: str
    breaking_changes: bool
    affected_consumers: List[str]
    reviews: List[ContractReview]
    created_at: datetime

    def can_activate(self) -> bool:
        """Check if proposal can be activated."""
        if self.status != ContractStatus.APPROVED:
            return False

        # All affected consumers must approve breaking changes
        if self.breaking_changes:
            approved_teams = {r.team for r in self.reviews if r.approved}
            return all(c in approved_teams for c in self.affected_consumers)

        return True

    def get_pending_reviews(self) -> List[str]:
        """Get list of consumers who haven't reviewed."""
        reviewed_teams = {r.team for r in self.reviews}
        return [c for c in self.affected_consumers if c not in reviewed_teams]


class ContractGovernance:
    """Manage contract lifecycle and approvals."""

    def __init__(self):
        self.proposals: dict[str, ContractProposal] = {}

    def submit_proposal(
        self,
        contract_id: str,
        version: str,
        author: str,
        changes: str,
        breaking: bool,
        consumers: List[str]
    ) -> ContractProposal:
        """Submit a new contract change proposal."""

        proposal = ContractProposal(
            contract_id=contract_id,
            version=version,
            author=author,
            status=ContractStatus.DRAFT,
            changes_description=changes,
            breaking_changes=breaking,
            affected_consumers=consumers,
            reviews=[],
            created_at=datetime.utcnow()
        )

        self.proposals[f"{contract_id}:{version}"] = proposal
        return proposal

    def submit_for_review(self, contract_id: str, version: str):
        """Move proposal to review status."""
        key = f"{contract_id}:{version}"
        if key in self.proposals:
            self.proposals[key].status = ContractStatus.REVIEW
            self._notify_consumers(self.proposals[key])

    def add_review(
        self,
        contract_id: str,
        version: str,
        reviewer: str,
        team: str,
        approved: bool,
        comments: Optional[str] = None
    ):
        """Add a review from a consumer team."""
        key = f"{contract_id}:{version}"
        if key not in self.proposals:
            raise ValueError(f"Proposal {key} not found")

        proposal = self.proposals[key]
        proposal.reviews.append(ContractReview(
            reviewer=reviewer,
            team=team,
            approved=approved,
            comments=comments,
            reviewed_at=datetime.utcnow()
        ))

        # Check if all required reviews are in
        if proposal.breaking_changes:
            pending = proposal.get_pending_reviews()
            all_approved = all(r.approved for r in proposal.reviews)

            if not pending and all_approved:
                proposal.status = ContractStatus.APPROVED
        else:
            # Non-breaking changes auto-approve
            proposal.status = ContractStatus.APPROVED

    def _notify_consumers(self, proposal: ContractProposal):
        """Notify affected consumers of pending review."""
        for consumer in proposal.affected_consumers:
            print(f"Notifying {consumer} of contract change review request")
            # In production: send Slack/email notification
```

### Pitfall 5: Ignoring Data Lineage

**Problem:** Contracts in isolation don't capture dependencies.

**Solution:** Include lineage information:

```yaml
lineage:
  upstream:
    - contract: raw-events-contract
      version: ">=1.0.0"
      relationship: source
      fields_used:
        - event_id
        - timestamp
        - user_id

    - contract: user-profiles-contract
      version: ">=2.0.0"
      relationship: enrichment
      fields_used:
        - user_id
        - user_segment

  downstream:
    - contract: daily-aggregates-contract
      version: "1.x"
      fields_consumed:
        - event_id
        - user_segment

    - contract: real-time-metrics-contract
      version: "2.x"
      fields_consumed:
        - event_type
        - timestamp
```

## Performance Considerations

### Validation Overhead

Contract validation adds latency. Optimize for your use case:

```python
from functools import lru_cache
import hashlib
import time
from typing import Optional
import pandas as pd

class OptimizedValidator:
    """Validator with performance optimizations."""

    def __init__(self, contract: dict):
        self.contract = contract
        self.schema_hash = self._compute_schema_hash()
        self._compiled_rules = self._compile_rules()

    def _compute_schema_hash(self) -> str:
        """Compute hash for caching."""
        import json
        content = json.dumps(self.contract, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _compile_rules(self):
        """Pre-compile validation rules for performance."""
        # Pre-compute regex patterns, enum sets, etc.
        compiled = {}
        for field, spec in self.contract.get("schema", {}).get("properties", {}).items():
            if "pattern" in spec:
                import re
                compiled[f"{field}_pattern"] = re.compile(spec["pattern"])
            if "enum" in spec:
                compiled[f"{field}_enum"] = frozenset(spec["enum"])
        return compiled

    def validate_sample(
        self,
        df: pd.DataFrame,
        sample_size: int = 10000,
        sample_method: str = "random"
    ) -> dict:
        """Validate a sample instead of full dataset."""

        if len(df) <= sample_size:
            return self.validate_full(df)

        if sample_method == "random":
            sample = df.sample(n=sample_size, random_state=42)
        elif sample_method == "stratified":
            # Stratified sampling if there's a category column
            category_col = self._find_category_column(df)
            if category_col:
                sample = df.groupby(category_col, group_keys=False).apply(
                    lambda x: x.sample(min(len(x), sample_size // df[category_col].nunique()))
                )
            else:
                sample = df.sample(n=sample_size, random_state=42)
        elif sample_method == "recent":
            # Validate most recent records
            timestamp_col = self._find_timestamp_column(df)
            if timestamp_col:
                sample = df.nlargest(sample_size, timestamp_col)
            else:
                sample = df.tail(sample_size)
        else:
            sample = df.sample(n=sample_size, random_state=42)

        result = self.validate_full(sample)
        result["sample_size"] = len(sample)
        result["total_size"] = len(df)
        result["sampling_method"] = sample_method

        return result

    def validate_full(self, df: pd.DataFrame) -> dict:
        """Full validation with optimizations."""
        start = time.time()
        results = []

        # Vectorized operations for performance
        for field, spec in self.contract.get("schema", {}).get("properties", {}).items():
            if field not in df.columns:
                results.append({"field": field, "check": "exists", "passed": False})
                continue

            col = df[field]

            # Null check (vectorized)
            if field in self.contract.get("schema", {}).get("required", []):
                null_count = col.isna().sum()
                results.append({
                    "field": field,
                    "check": "not_null",
                    "passed": null_count == 0,
                    "violations": int(null_count)
                })

            # Enum check (vectorized with pre-computed set)
            enum_key = f"{field}_enum"
            if enum_key in self._compiled_rules:
                valid_values = self._compiled_rules[enum_key]
                invalid = ~col.dropna().isin(valid_values)
                results.append({
                    "field": field,
                    "check": "enum",
                    "passed": not invalid.any(),
                    "violations": int(invalid.sum())
                })

            # Pattern check (vectorized with pre-compiled regex)
            pattern_key = f"{field}_pattern"
            if pattern_key in self._compiled_rules:
                pattern = self._compiled_rules[pattern_key]
                non_null = col.dropna().astype(str)
                matches = non_null.str.match(pattern)
                results.append({
                    "field": field,
                    "check": "pattern",
                    "passed": matches.all(),
                    "violations": int((~matches).sum())
                })

        elapsed = time.time() - start

        return {
            "passed": all(r["passed"] for r in results),
            "results": results,
            "validation_time_ms": round(elapsed * 1000, 2),
            "records_validated": len(df)
        }

    def _find_timestamp_column(self, df: pd.DataFrame) -> Optional[str]:
        """Find likely timestamp column."""
        for col in ["timestamp", "created_at", "updated_at", "event_time"]:
            if col in df.columns:
                return col
        return None

    def _find_category_column(self, df: pd.DataFrame) -> Optional[str]:
        """Find likely category column for stratified sampling."""
        for col in ["category", "type", "status", "segment"]:
            if col in df.columns and df[col].nunique() < 100:
                return col
        return None


class AsyncValidator:
    """Asynchronous validation for high-throughput scenarios."""

    def __init__(self, contract: dict, batch_size: int = 1000):
        self.validator = OptimizedValidator(contract)
        self.batch_size = batch_size
        self.pending_batches = []
        self.results = []

    async def validate_stream(self, data_stream):
        """Validate data as it streams in."""
        import asyncio

        batch = []
        async for record in data_stream:
            batch.append(record)

            if len(batch) >= self.batch_size:
                # Validate batch asynchronously
                df = pd.DataFrame(batch)
                result = await asyncio.to_thread(
                    self.validator.validate_full, df
                )
                self.results.append(result)
                batch = []

        # Validate remaining records
        if batch:
            df = pd.DataFrame(batch)
            result = await asyncio.to_thread(
                self.validator.validate_full, df
            )
            self.results.append(result)

        return self._aggregate_results()

    def _aggregate_results(self) -> dict:
        """Aggregate results from all batches."""
        if not self.results:
            return {"passed": True, "batches": 0}

        all_passed = all(r["passed"] for r in self.results)
        total_records = sum(r["records_validated"] for r in self.results)
        total_time = sum(r["validation_time_ms"] for r in self.results)

        return {
            "passed": all_passed,
            "batches": len(self.results),
            "total_records": total_records,
            "total_time_ms": total_time,
            "avg_time_per_batch_ms": total_time / len(self.results)
        }
```

### Sampling Strategies

Choose the right sampling strategy based on your data:

| Strategy | Best For | Drawbacks |
|----------|----------|-----------|
| Random | General validation | May miss rare issues |
| Stratified | Categorical data | Requires category column |
| Recent | Time-series data | Ignores historical issues |
| Reservoir | Streaming data | Memory overhead |
| Systematic | Ordered data | May hit patterns |

```python
def choose_sampling_strategy(
    df: pd.DataFrame,
    contract: dict
) -> str:
    """Recommend sampling strategy based on data characteristics."""

    # Check for timestamp column
    has_timestamp = any(
        col in df.columns
        for col in ["timestamp", "created_at", "event_time"]
    )

    # Check for category columns
    categorical_cols = [
        col for col in df.columns
        if df[col].dtype == "object" and df[col].nunique() < 100
    ]

    # Check contract SLA requirements
    sla = contract.get("servicelevels", {})
    freshness_critical = sla.get("freshness", {}).get("threshold", "PT1H").startswith("PT")

    if freshness_critical and has_timestamp:
        return "recent"  # Prioritize recent data for freshness-critical contracts
    elif categorical_cols:
        return "stratified"  # Ensure coverage across categories
    else:
        return "random"  # Default to random sampling
```

## Real-World Scenarios

### Scenario 1: Data Mesh Implementation

In a Data Mesh architecture, each domain owns its data products with contracts:

```yaml
# Domain: Orders
# Data Product: Order Events

dataContractSpecification: 0.9.3
id: orders-domain/order-events
info:
  title: Order Events Data Product
  version: 3.0.0
  owner: orders-domain-team
  dataProduct: true
  domain: orders

# Self-serve discovery
discovery:
  catalog: https://datacatalog.company.com/products/order-events
  documentation: https://wiki.company.com/orders/data-products/events
  sampleData: https://storage.company.com/samples/order-events.parquet

# Multi-platform availability
servers:
  streaming:
    type: kafka
    topic: orders.events.v3
    format: avro

  batch:
    type: s3
    location: s3://data-lake/orders/events/
    format: parquet
    partitioning:
      - column: event_date
        granularity: day

  api:
    type: rest
    baseUrl: https://api.company.com/orders/events
    authentication: oauth2

# Federated governance
governance:
  classification: internal
  personalData: true
  retentionPolicy: 2-years
  accessControl:
    - role: data-analyst
      access: read
    - role: orders-domain-admin
      access: admin
```

### Scenario 2: Cross-Team Data Sharing

When sharing data between teams, contracts ensure clear expectations:

```yaml
dataContractSpecification: 0.9.3
id: customer-360-shared
info:
  title: Customer 360 View
  version: 1.0.0
  owner: customer-platform-team

# Explicitly define consumers and their approved usage
consumers:
  - name: marketing-team
    approved: true
    approvedUsage:
      - Customer segmentation
      - Campaign targeting
    restrictedUsage:
      - Direct individual outreach without consent

  - name: fraud-team
    approved: true
    approvedUsage:
      - Fraud detection models
      - Risk scoring
    specialPermissions:
      - Access to transaction history

  - name: external-partner
    approved: false
    pendingReview: true
    requestedUsage:
      - Joint analytics initiative

# Data sharing agreement
sharing:
  internalUse:
    allowed: true
    requiresApproval: false

  crossDomain:
    allowed: true
    requiresApproval: true
    approver: data-governance-board

  external:
    allowed: false
    exception_process: https://wiki.company.com/external-data-sharing

# Privacy controls
privacy:
  containsPII: true
  piiFields:
    - name: customer_email
      type: email
      masking: hash
    - name: customer_phone
      type: phone
      masking: partial
    - name: customer_address
      type: address
      masking: generalize

  anonymization:
    available: true
    endpoint: /api/customer-360/anonymized
```

### Scenario 3: Event-Driven Architecture

For event streaming, contracts ensure event compatibility:

```yaml
dataContractSpecification: 0.9.3
id: payment-events
info:
  title: Payment Events Stream
  version: 2.0.0
  owner: payments-team

# Event-specific metadata
eventMetadata:
  eventTypes:
    - name: PaymentInitiated
      description: A payment has been started
      frequency: ~10000/hour

    - name: PaymentAuthorized
      description: Payment has been authorized by processor
      frequency: ~9500/hour

    - name: PaymentCompleted
      description: Payment has been fully processed
      frequency: ~9000/hour

    - name: PaymentFailed
      description: Payment processing failed
      frequency: ~500/hour

  ordering:
    guarantees: per-key  # Events for same payment_id are ordered
    keyField: payment_id

  delivery:
    semantics: at-least-once
    deduplication:
      field: event_id
      window: PT1H

# Schema for all event types
schema:
  type: object
  required:
    - event_id
    - event_type
    - payment_id
    - timestamp
    - version
  properties:
    event_id:
      type: string
      format: uuid

    event_type:
      type: string
      enum:
        - PaymentInitiated
        - PaymentAuthorized
        - PaymentCompleted
        - PaymentFailed

    payment_id:
      type: string
      format: uuid

    timestamp:
      type: string
      format: date-time

    version:
      type: string
      const: "2.0"

    payload:
      type: object
      description: Event-type specific payload

# Event compatibility rules
compatibility:
  mode: forward  # New schemas must be forward compatible
  rules:
    - New events can add optional fields
    - Existing fields cannot be removed (deprecate instead)
    - Field types cannot change
    - Enum values can only be added, not removed
```

## Interview Preparation

### Common Interview Questions

**Q1: What is the difference between a schema and a data contract?**

A schema defines the technical structure of data (fields, types, constraints), while a data contract is a broader agreement that includes:
- Schema definition
- Semantic meaning of fields
- Data quality expectations
- SLAs (freshness, availability, latency)
- Ownership and contact information
- Versioning and change management policies
- Usage terms and restrictions

Think of a schema as the "shape" of data, while a contract defines the complete "promise" around that data.

**Q2: How do you handle breaking changes in data contracts?**

1. **Identify breaking changes**: Field removals, type changes, semantic changes, constraint tightening
2. **Version appropriately**: Use semantic versioning (MAJOR.MINOR.PATCH)
3. **Communicate early**: Notify consumers before changes
4. **Provide migration path**: Document how to adapt
5. **Support transition period**: Run old and new versions in parallel
6. **Sunset gracefully**: Give adequate deprecation notice (typically 90+ days)

**Q3: How would you implement data contracts in a Data Mesh architecture?**

- Each domain owns its data products and defines contracts
- Contracts are versioned and stored in a central registry
- Federated governance ensures consistency across domains
- Self-serve discovery through data catalog integration
- Automated validation in CI/CD pipelines
- Cross-domain dependencies tracked through lineage

**Q4: What quality checks would you include in a data contract?**

| Category | Examples |
|----------|----------|
| Completeness | Null checks, required fields |
| Uniqueness | Primary key uniqueness, duplicate detection |
| Validity | Type checks, enum validation, range checks |
| Consistency | Referential integrity, business rules |
| Freshness | Data age, update frequency |
| Accuracy | Comparison with source of truth |

**Q5: How do you balance contract strictness with flexibility?**

- **Start conservative**: Begin with core guarantees, expand based on feedback
- **Severity levels**: Use errors for critical rules, warnings for recommendations
- **Optional vs required fields**: Only require what's truly necessary
- **Version flexibility**: Use compatibility ranges (e.g., "^1.0.0")
- **Grace periods**: Allow time for consumers to adapt to changes
- **Escape hatches**: Provide mechanisms for exceptional cases

## Further Reading

### Books

- **"Data Mesh: Delivering Data-Driven Value at Scale"** by Zhamak Dehghani - The foundational book on Data Mesh, with extensive coverage of data products and contracts
- **"Fundamentals of Data Engineering"** by Joe Reis & Matt Housley - Comprehensive coverage of modern data engineering practices
- **"Building Event-Driven Microservices"** by Adam Bellemare - Event-driven patterns including schema and contract management

### Tools and Frameworks

| Tool | Purpose | Link |
|------|---------|------|
| Data Contract Specification | Open standard for contracts | [datacontract.com](https://datacontract.com) |
| Great Expectations | Data validation framework | [greatexpectations.io](https://greatexpectations.io) |
| Soda Core | Data quality testing | [soda.io](https://www.soda.io) |
| dbt | Data transformation with contracts | [getdbt.com](https://www.getdbt.com) |
| Confluent Schema Registry | Schema management for Kafka | [confluent.io](https://www.confluent.io) |
| DataHub | Data catalog with contracts | [datahubproject.io](https://datahubproject.io) |

### Articles and Documentation

- [Data Contracts: The Key to Scaling Data Products](https://www.datamesh-architecture.com/data-contracts) - Comprehensive guide on implementing contracts
- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/) - Schema management best practices
- [Great Expectations Documentation](https://docs.greatexpectations.io/) - Validation framework guide
- [dbt Contracts](https://docs.getdbt.com/docs/collaborate/govern/model-contracts) - Contract enforcement in dbt

### Communities

- **Data Engineering Weekly** - Newsletter covering data contract developments
- **Data Mesh Learning** - Community focused on Data Mesh patterns
- **dbt Community Slack** - Active discussions on data contracts in dbt

Data contracts represent a fundamental shift in how organizations manage data dependencies. By treating data as a product with clear interfaces and guarantees, teams can build more reliable data systems while maintaining the agility needed to evolve. Start with clear ownership, define meaningful quality rules, and implement governance processes that balance control with velocity.
