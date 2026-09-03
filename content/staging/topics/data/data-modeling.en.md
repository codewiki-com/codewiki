---
title: 数据建模完全指南
description: 掌握数据建模方法，设计高质量的数据资产
track: data
section: data-engineering
difficulty: advanced
tags:
  - 数据建模
  - 维度建模
  - 数据治理
  - 数据质量
status: imported
origin: old/src/content/docs/data/data-modeling.en.md
divergence: 0.219
issues:
  - title-lang-en
  - title-language
legacy:
  category: Data
  subcategory: Engineering
  order: 11
  lastUpdated: 2026-01-07
---

Data modeling is the core foundation of data engineering and data architecture, determining how data is organized, stored, and accessed. An excellent data model accurately reflects business requirements while providing efficient query performance and good scalability. This article comprehensively introduces the theoretical foundations, methodologies, and best practices of data modeling.

## Data Modeling Overview

### What is Data Modeling?

Data modeling is the process of creating data models to define and analyze data requirements in support of an organization's business processes. A data model is an abstract representation of real-world data characteristics, describing data structure, relationships between data, and data constraints.

```python
# Core elements of data modeling example
class DataModel:
    """Basic components of a data model"""

    def __init__(self):
        self.entities = []      # Entities: objects in the real world
        self.attributes = []    # Attributes: characteristics of entities
        self.relationships = [] # Relationships: associations between entities
        self.constraints = []   # Constraints: rules and limitations on data

    def add_entity(self, name, description, attributes):
        """Add entity definition"""
        entity = {
            'name': name,
            'description': description,
            'attributes': attributes,
            'primary_key': None,
            'foreign_keys': []
        }
        self.entities.append(entity)
        return entity

    def add_relationship(self, entity1, entity2, cardinality, relationship_type):
        """Add relationship definition

        cardinality: '1:1', '1:N', 'M:N'
        relationship_type: 'identifies', 'has', 'belongs_to'
        """
        relationship = {
            'from_entity': entity1,
            'to_entity': entity2,
            'cardinality': cardinality,
            'type': relationship_type
        }
        self.relationships.append(relationship)
        return relationship
```

### Importance of Data Modeling

1. **Business Understanding**: Data models help technical teams understand business requirements
2. **Communication Bridge**: Serves as a communication tool between business and technical personnel
3. **System Design**: Provides blueprints for database design and application development
4. **Data Quality**: Ensures data consistency and integrity through constraints
5. **Performance Optimization**: Proper model design directly impacts query performance

### Data Modeling Lifecycle

```python
# Data modeling lifecycle management
class ModelingLifecycle:
    """Data modeling lifecycle"""

    PHASES = [
        {
            'phase': 'Requirements Analysis',
            'activities': ['Business requirements gathering', 'Data requirements identification', 'Stakeholder interviews'],
            'deliverables': ['Requirements document', 'Business glossary']
        },
        {
            'phase': 'Conceptual Modeling',
            'activities': ['Identify key entities', 'Define high-level relationships', 'Validate business understanding'],
            'deliverables': ['Conceptual data model', 'Entity definition document']
        },
        {
            'phase': 'Logical Modeling',
            'activities': ['Attribute definition', 'Relationship normalization', 'Constraint definition'],
            'deliverables': ['Logical data model', 'Data dictionary']
        },
        {
            'phase': 'Physical Modeling',
            'activities': ['Table design', 'Indexing strategy', 'Partitioning scheme'],
            'deliverables': ['Physical data model', 'DDL scripts']
        },
        {
            'phase': 'Implementation and Maintenance',
            'activities': ['Model deployment', 'Performance monitoring', 'Iterative optimization'],
            'deliverables': ['Production database', 'Operations documentation']
        }
    ]

    @classmethod
    def get_phase_details(cls, phase_name):
        for phase in cls.PHASES:
            if phase['phase'] == phase_name:
                return phase
        return None
```

## Conceptual, Logical, and Physical Models

### Conceptual Data Model (CDM)

The conceptual data model is the highest level of abstraction, focusing on business concepts rather than technical implementation, primarily used for communication with business personnel.

```sql
-- Conceptual model example: E-commerce system core entities
-- Focus only on main entities and relationships, no specific attributes

/*
Conceptual Entities:
- Customer
- Order
- Product
- Supplier

Core Relationships:
- Customer places Order (1:N)
- Order contains Product (M:N)
- Supplier supplies Product (M:N)
*/

-- Conceptual model documentation
CREATE TABLE conceptual_entities (
    entity_id INT PRIMARY KEY,
    entity_name VARCHAR(100),
    business_definition TEXT,
    business_owner VARCHAR(100),
    data_steward VARCHAR(100)
);

INSERT INTO conceptual_entities VALUES
(1, 'Customer', 'Individual or organization that purchases products or services', 'Sales Dept', 'Data Governance Team'),
(2, 'Order', 'Transaction record of customer purchasing products', 'Sales Dept', 'Data Governance Team'),
(3, 'Product', 'Goods or services available for sale', 'Product Dept', 'Data Governance Team'),
(4, 'Supplier', 'External organization providing products or raw materials', 'Procurement Dept', 'Data Governance Team');
```

### Logical Data Model (LDM)

The logical data model builds upon the conceptual model by adding detailed attribute definitions, data types, and business rules, while remaining independent of specific database technology.

```sql
-- Logical data model example

-- Customer Entity
/*
Entity Name: Customer
Attributes:
  - customer_id (PK): Customer unique identifier
  - customer_name: Customer name
  - customer_type: Customer type (Individual/Enterprise)
  - email: Email address
  - phone: Contact phone
  - registration_date: Registration date
  - status: Status (Active/Inactive)
Business Rules:
  - email must be unique
  - phone format must comply with standards
*/

-- Order Entity
/*
Entity Name: Order
Attributes:
  - order_id (PK): Order unique identifier
  - customer_id (FK): Customer ID
  - order_date: Order date
  - total_amount: Order total amount
  - status: Order status
  - shipping_address: Shipping address
  - payment_method: Payment method
Relationships:
  - Belongs to one customer (N:1)
  - Contains multiple order items (1:N)
*/

-- Logical model definition table
CREATE TABLE logical_model_entities (
    entity_id INT,
    attribute_name VARCHAR(100),
    data_type VARCHAR(50),
    is_primary_key BOOLEAN,
    is_foreign_key BOOLEAN,
    is_nullable BOOLEAN,
    business_rule TEXT,
    description TEXT
);

-- Customer entity attribute definitions
INSERT INTO logical_model_entities VALUES
(1, 'customer_id', 'INTEGER', TRUE, FALSE, FALSE, 'Auto-generated', 'Customer unique identifier'),
(1, 'customer_name', 'VARCHAR(200)', FALSE, FALSE, FALSE, 'Cannot be null', 'Customer name'),
(1, 'customer_type', 'ENUM', FALSE, FALSE, FALSE, 'Domain: INDIVIDUAL, ENTERPRISE', 'Customer type'),
(1, 'email', 'VARCHAR(255)', FALSE, FALSE, FALSE, 'Unique constraint, email format validation', 'Email address'),
(1, 'phone', 'VARCHAR(20)', FALSE, FALSE, TRUE, 'Phone format validation', 'Contact phone'),
(1, 'registration_date', 'DATE', FALSE, FALSE, FALSE, 'Defaults to current date', 'Registration date'),
(1, 'status', 'ENUM', FALSE, FALSE, FALSE, 'Domain: ACTIVE, INACTIVE', 'Customer status');
```

### Physical Data Model (PDM)

The physical data model is the technical implementation of the logical model, containing specific database object definitions, indexes, partitions, and other technical details.

```sql
-- Physical data model example (PostgreSQL)

-- Customers table
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('INDIVIDUAL', 'ENTERPRISE')),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_registration_date ON customers(registration_date);

-- Orders table
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(15, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);

-- Partitioned table example (monthly partitioning)
CREATE TABLE orders_partitioned (
    order_id SERIAL,
    customer_id INTEGER NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    PRIMARY KEY (order_id, order_date)
) PARTITION BY RANGE (order_date);

-- Create partitions
CREATE TABLE orders_2024_01 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## Entity-Relationship Modeling (ER)

### ER Model Fundamentals

The Entity-Relationship Model is a classic approach to data modeling, proposed by Peter Chen in 1976.

```python
# ER model component implementation
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class Cardinality(Enum):
    ONE_TO_ONE = "1:1"
    ONE_TO_MANY = "1:N"
    MANY_TO_MANY = "M:N"

class AttributeType(Enum):
    SIMPLE = "simple"           # Simple attribute
    COMPOSITE = "composite"     # Composite attribute
    DERIVED = "derived"         # Derived attribute
    MULTIVALUED = "multivalued" # Multi-valued attribute

@dataclass
class Attribute:
    """Attribute definition"""
    name: str
    data_type: str
    is_key: bool = False
    is_nullable: bool = True
    attr_type: AttributeType = AttributeType.SIMPLE
    derived_from: Optional[str] = None

@dataclass
class Entity:
    """Entity definition"""
    name: str
    description: str
    attributes: List[Attribute] = field(default_factory=list)

    def add_attribute(self, attr: Attribute):
        self.attributes.append(attr)

    def get_primary_key(self) -> Optional[Attribute]:
        for attr in self.attributes:
            if attr.is_key:
                return attr
        return None

@dataclass
class Relationship:
    """Relationship definition"""
    name: str
    entity1: Entity
    entity2: Entity
    cardinality: Cardinality
    participation_entity1: str = "partial"  # partial or total
    participation_entity2: str = "partial"
    attributes: List[Attribute] = field(default_factory=list)

# Create ER model example
def create_ecommerce_er_model():
    """Create e-commerce system ER model"""

    # Define customer entity
    customer = Entity(
        name="Customer",
        description="Registered system user"
    )
    customer.add_attribute(Attribute("customer_id", "INTEGER", is_key=True, is_nullable=False))
    customer.add_attribute(Attribute("name", "VARCHAR(200)", is_nullable=False))
    customer.add_attribute(Attribute("email", "VARCHAR(255)", is_nullable=False))
    customer.add_attribute(Attribute("age", "INTEGER", attr_type=AttributeType.DERIVED,
                                     derived_from="birth_date"))

    # Define order entity
    order = Entity(
        name="Order",
        description="Customer order"
    )
    order.add_attribute(Attribute("order_id", "INTEGER", is_key=True, is_nullable=False))
    order.add_attribute(Attribute("order_date", "TIMESTAMP", is_nullable=False))
    order.add_attribute(Attribute("total_amount", "DECIMAL(15,2)", is_nullable=False))

    # Define product entity
    product = Entity(
        name="Product",
        description="Product for sale"
    )
    product.add_attribute(Attribute("product_id", "INTEGER", is_key=True, is_nullable=False))
    product.add_attribute(Attribute("name", "VARCHAR(300)", is_nullable=False))
    product.add_attribute(Attribute("price", "DECIMAL(10,2)", is_nullable=False))

    # Define relationships
    places = Relationship(
        name="places",
        entity1=customer,
        entity2=order,
        cardinality=Cardinality.ONE_TO_MANY,
        participation_entity1="partial",
        participation_entity2="total"  # Every order must belong to a customer
    )

    contains = Relationship(
        name="contains",
        entity1=order,
        entity2=product,
        cardinality=Cardinality.MANY_TO_MANY
    )
    # Relationship attributes
    contains.attributes.append(Attribute("quantity", "INTEGER", is_nullable=False))
    contains.attributes.append(Attribute("unit_price", "DECIMAL(10,2)", is_nullable=False))

    return {
        'entities': [customer, order, product],
        'relationships': [places, contains]
    }
```

### ER Diagram Notation

```sql
-- ER model conversion to relational schema

-- 1:N relationship handling: Foreign key placed on N side
-- Customer (1) -- places --> (N) Order
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT NOT NULL,  -- Foreign key on N side
    order_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- M:N relationship handling: Create junction table
-- Order (M) -- contains --> (N) Product
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (  -- Junction table
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 1:1 relationship handling: Foreign key on either side or merge tables
-- Employee (1) -- has --> (1) EmployeeDetail
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department VARCHAR(100)
);

CREATE TABLE employee_details (
    employee_id INT PRIMARY KEY,  -- Both primary key and foreign key
    address TEXT,
    emergency_contact VARCHAR(100),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
```

## Dimensional Modeling Methodology

### Dimensional Modeling Overview

Dimensional modeling is a core methodology for data warehouse design, proposed by Ralph Kimball. It centers on business processes and builds star or snowflake models around fact and dimension tables.

```python
# Dimensional modeling components
from datetime import datetime, date
from typing import Dict, List, Any

class DimensionalModel:
    """Dimensional model designer"""

    def __init__(self, business_process: str):
        self.business_process = business_process
        self.grain = None
        self.dimensions = []
        self.facts = []
        self.measures = []

    def declare_grain(self, grain_description: str):
        """Declare grain - Step 1 of the four-step dimensional modeling process"""
        self.grain = grain_description
        print(f"Grain declaration: {grain_description}")

    def identify_dimensions(self, dimensions: List[Dict]):
        """Identify dimensions - Step 2 of the four-step dimensional modeling process"""
        self.dimensions = dimensions
        for dim in dimensions:
            print(f"Dimension: {dim['name']} - {dim['description']}")

    def identify_facts(self, measures: List[Dict]):
        """Identify facts - Step 3 of the four-step dimensional modeling process"""
        self.measures = measures
        for measure in measures:
            print(f"Measure: {measure['name']} ({measure['aggregation']})")

# E-commerce sales dimensional model design
def design_sales_dimensional_model():
    """Design sales analysis dimensional model"""

    model = DimensionalModel("Retail Sales Analysis")

    # Step 1: Declare grain
    model.declare_grain("Each product line item within each order")

    # Step 2: Identify dimensions
    dimensions = [
        {
            'name': 'dim_date',
            'description': 'Date dimension',
            'type': 'Type 0',  # Fixed dimension
            'attributes': ['date_key', 'full_date', 'year', 'quarter', 'month',
                          'week', 'day_of_week', 'is_holiday', 'fiscal_year']
        },
        {
            'name': 'dim_product',
            'description': 'Product dimension',
            'type': 'Type 2',  # Slowly changing dimension
            'attributes': ['product_key', 'product_id', 'product_name', 'category',
                          'subcategory', 'brand', 'supplier', 'effective_date', 'end_date']
        },
        {
            'name': 'dim_customer',
            'description': 'Customer dimension',
            'type': 'Type 2',
            'attributes': ['customer_key', 'customer_id', 'customer_name', 'segment',
                          'region', 'city', 'effective_date', 'end_date', 'is_current']
        },
        {
            'name': 'dim_store',
            'description': 'Store dimension',
            'type': 'Type 1',  # Overwrite update
            'attributes': ['store_key', 'store_id', 'store_name', 'store_type',
                          'address', 'city', 'region', 'manager']
        }
    ]
    model.identify_dimensions(dimensions)

    # Step 3: Identify facts (measures)
    measures = [
        {'name': 'quantity', 'aggregation': 'SUM', 'description': 'Sales quantity'},
        {'name': 'unit_price', 'aggregation': 'AVG', 'description': 'Unit price'},
        {'name': 'discount_amount', 'aggregation': 'SUM', 'description': 'Discount amount'},
        {'name': 'sales_amount', 'aggregation': 'SUM', 'description': 'Sales amount'},
        {'name': 'cost_amount', 'aggregation': 'SUM', 'description': 'Cost amount'},
        {'name': 'profit', 'aggregation': 'SUM', 'description': 'Profit'}
    ]
    model.identify_facts(measures)

    return model
```

### Star Schema and Snowflake Schema

```sql
-- Star schema implementation

-- Date dimension table
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE NOT NULL,
    year INT NOT NULL,
    quarter INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    week INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL,
    is_holiday BOOLEAN NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_quarter INT NOT NULL
);

-- Product dimension table (SCD Type 2)
CREATE TABLE dim_product (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(300) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    supplier VARCHAR(200),
    unit_cost DECIMAL(10, 2),
    effective_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

-- Customer dimension table (SCD Type 2)
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    segment VARCHAR(50),
    region VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    effective_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE
);

-- Store dimension table
CREATE TABLE dim_store (
    store_key SERIAL PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    store_type VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    manager VARCHAR(200),
    open_date DATE,
    square_footage INT
);

-- Sales fact table
CREATE TABLE fact_sales (
    sales_key SERIAL PRIMARY KEY,
    date_key INT NOT NULL REFERENCES dim_date(date_key),
    product_key INT NOT NULL REFERENCES dim_product(product_key),
    customer_key INT NOT NULL REFERENCES dim_customer(customer_key),
    store_key INT NOT NULL REFERENCES dim_store(store_key),
    order_id VARCHAR(50) NOT NULL,
    line_number INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    sales_amount DECIMAL(15, 2) NOT NULL,
    cost_amount DECIMAL(15, 2),
    profit DECIMAL(15, 2)
);

-- Create indexes to optimize queries
CREATE INDEX idx_fact_sales_date ON fact_sales(date_key);
CREATE INDEX idx_fact_sales_product ON fact_sales(product_key);
CREATE INDEX idx_fact_sales_customer ON fact_sales(customer_key);
CREATE INDEX idx_fact_sales_store ON fact_sales(store_key);

-- Snowflake schema example (dimension tables further normalized)
-- Product category as separate table
CREATE TABLE dim_category (
    category_key SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    category_manager VARCHAR(200)
);

CREATE TABLE dim_subcategory (
    subcategory_key SERIAL PRIMARY KEY,
    category_key INT REFERENCES dim_category(category_key),
    subcategory_name VARCHAR(100) NOT NULL
);

-- Product dimension references subcategory
CREATE TABLE dim_product_snowflake (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(300) NOT NULL,
    subcategory_key INT REFERENCES dim_subcategory(subcategory_key),
    brand VARCHAR(100),
    supplier VARCHAR(200)
);
```

### Slowly Changing Dimensions (SCD)

```python
# SCD type implementation
from datetime import date

class SCDHandler:
    """Slowly changing dimension handler"""

    def __init__(self, connection):
        self.conn = connection

    def handle_type0(self, table, key_column, record):
        """Type 0: Retain original value, no updates"""
        # Only insert new records, existing records are not updated
        pass

    def handle_type1(self, table, key_column, record, business_key):
        """Type 1: Overwrite old value"""
        sql = f"""
        UPDATE {table}
        SET {', '.join([f"{k} = %s" for k in record.keys()])}
        WHERE {business_key} = %s
        """
        # Direct update, no history preserved

    def handle_type2(self, table, business_key, business_key_value, new_record):
        """Type 2: Preserve history, add new version"""
        today = date.today()

        # 1. Close current record
        close_sql = f"""
        UPDATE {table}
        SET end_date = %s, is_current = FALSE
        WHERE {business_key} = %s AND is_current = TRUE
        """

        # 2. Insert new version
        new_record['effective_date'] = today
        new_record['end_date'] = None
        new_record['is_current'] = True

        columns = ', '.join(new_record.keys())
        placeholders = ', '.join(['%s'] * len(new_record))
        insert_sql = f"""
        INSERT INTO {table} ({columns})
        VALUES ({placeholders})
        """

    def handle_type3(self, table, key_column, record, previous_column):
        """Type 3: Add previous value column"""
        sql = f"""
        UPDATE {table}
        SET {previous_column}_previous = {previous_column},
            {previous_column} = %s
        WHERE {key_column} = %s
        """
        # Preserve previous value in separate column

    def handle_type4(self, main_table, history_table, record):
        """Type 4: Use history table"""
        # Main table keeps current value
        # Changes written to history table
        pass

    def handle_type6(self, table, business_key, business_key_value, new_record):
        """Type 6: Hybrid approach (1+2+3)
        - Preserve current value column
        - Preserve historical records (Type 2)
        - Preserve previous value (Type 3)
        """
        today = date.today()

        # Update current_ columns in all historical records
        update_current_sql = f"""
        UPDATE {table}
        SET current_value = %s
        WHERE {business_key} = %s
        """

        # Close current record
        close_sql = f"""
        UPDATE {table}
        SET end_date = %s, is_current = FALSE
        WHERE {business_key} = %s AND is_current = TRUE
        """

        # Insert new record
        # ...
```

```sql
-- SCD Type 2 complete implementation example

-- Initial data load
INSERT INTO dim_customer (customer_id, customer_name, segment, region, city,
                          effective_date, end_date, is_current)
VALUES ('C001', 'John Smith', 'Regular', 'East', 'Shanghai', '2024-01-01', NULL, TRUE);

-- Customer upgraded to VIP, create new version
UPDATE dim_customer
SET end_date = '2024-06-30', is_current = FALSE
WHERE customer_id = 'C001' AND is_current = TRUE;

INSERT INTO dim_customer (customer_id, customer_name, segment, region, city,
                          effective_date, end_date, is_current)
VALUES ('C001', 'John Smith', 'VIP', 'East', 'Shanghai', '2024-07-01', NULL, TRUE);

-- Query customer history
SELECT customer_key, customer_id, customer_name, segment,
       effective_date, end_date, is_current
FROM dim_customer
WHERE customer_id = 'C001'
ORDER BY effective_date;

-- Query customer state at a specific point in time (time travel query)
SELECT c.customer_name, c.segment
FROM dim_customer c
WHERE c.customer_id = 'C001'
  AND '2024-05-15' >= c.effective_date
  AND ('2024-05-15' < c.end_date OR c.end_date IS NULL);
```

## Data Normalization

### Normal Form Theory

```sql
-- First Normal Form (1NF): Eliminate repeating groups, ensure atomicity

-- Violates 1NF (multi-valued attribute)
CREATE TABLE orders_bad (
    order_id INT,
    customer_name VARCHAR(100),
    products VARCHAR(500)  -- 'Product A,Product B,Product C' violates atomicity
);

-- Complies with 1NF
CREATE TABLE orders_1nf (
    order_id INT,
    customer_name VARCHAR(100),
    product_name VARCHAR(100),
    PRIMARY KEY (order_id, product_name)
);

-- Second Normal Form (2NF): Eliminate partial dependencies

-- Violates 2NF (non-key attribute depends on part of primary key)
CREATE TABLE order_items_bad (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- Only depends on product_id
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- Complies with 2NF (decompose tables)
CREATE TABLE products_2nf (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100)
);

CREATE TABLE order_items_2nf (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products_2nf(product_id)
);

-- Third Normal Form (3NF): Eliminate transitive dependencies

-- Violates 3NF (transitive dependency)
CREATE TABLE employees_bad (
    employee_id INT PRIMARY KEY,
    employee_name VARCHAR(100),
    department_id INT,
    department_name VARCHAR(100),  -- Depends on department_id, not employee_id
    department_manager VARCHAR(100)
);

-- Complies with 3NF
CREATE TABLE departments_3nf (
    department_id INT PRIMARY KEY,
    department_name VARCHAR(100),
    department_manager VARCHAR(100)
);

CREATE TABLE employees_3nf (
    employee_id INT PRIMARY KEY,
    employee_name VARCHAR(100),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments_3nf(department_id)
);

-- BCNF (Boyce-Codd Normal Form): Every determinant is a candidate key

-- Violates BCNF example
-- Assumption: A student can only have one advisor, an advisor teaches only one subject
CREATE TABLE student_advisor_bad (
    student_id INT,
    subject VARCHAR(100),
    advisor VARCHAR(100),
    PRIMARY KEY (student_id, subject)
    -- advisor -> subject (advisor determines subject, but advisor is not a candidate key)
);

-- Complies with BCNF
CREATE TABLE advisor_subject (
    advisor VARCHAR(100) PRIMARY KEY,
    subject VARCHAR(100)
);

CREATE TABLE student_advisor_bcnf (
    student_id INT,
    advisor VARCHAR(100),
    PRIMARY KEY (student_id, advisor),
    FOREIGN KEY (advisor) REFERENCES advisor_subject(advisor)
);
```

### Denormalization Strategies

```sql
-- Denormalization: Intentionally introducing redundancy for query performance

-- Pre-computed summary table
CREATE TABLE daily_sales_summary (
    date_key INT,
    store_key INT,
    product_category VARCHAR(100),
    total_quantity INT,
    total_sales DECIMAL(15, 2),
    total_profit DECIMAL(15, 2),
    transaction_count INT,
    avg_basket_size DECIMAL(10, 2),
    PRIMARY KEY (date_key, store_key, product_category)
);

-- Periodically refresh summary table
INSERT INTO daily_sales_summary
SELECT
    f.date_key,
    f.store_key,
    p.category,
    SUM(f.quantity),
    SUM(f.sales_amount),
    SUM(f.profit),
    COUNT(DISTINCT f.order_id),
    AVG(f.sales_amount)
FROM fact_sales f
JOIN dim_product p ON f.product_key = p.product_key
GROUP BY f.date_key, f.store_key, p.category
ON CONFLICT (date_key, store_key, product_category) DO UPDATE
SET total_quantity = EXCLUDED.total_quantity,
    total_sales = EXCLUDED.total_sales,
    total_profit = EXCLUDED.total_profit,
    transaction_count = EXCLUDED.transaction_count,
    avg_basket_size = EXCLUDED.avg_basket_size;

-- Redundant storage of frequently queried fields
CREATE TABLE orders_denormalized (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(200),      -- Redundant: from customers table
    customer_segment VARCHAR(50),    -- Redundant: from customers table
    order_date TIMESTAMP,
    total_amount DECIMAL(15, 2),
    item_count INT,                  -- Redundant: calculated field
    shipping_address TEXT
);
```

## Master Data Management

### MDM Architecture Design

```python
# Master data management system design
from typing import Dict, List, Optional
from datetime import datetime
import hashlib

class MasterDataManager:
    """Master data manager"""

    def __init__(self):
        self.golden_records = {}
        self.source_mappings = {}
        self.matching_rules = []
        self.survivorship_rules = {}

    def register_source(self, source_name: str, source_config: Dict):
        """Register data source"""
        self.source_mappings[source_name] = {
            'config': source_config,
            'priority': source_config.get('priority', 100),
            'trust_score': source_config.get('trust_score', 0.5)
        }

    def add_matching_rule(self, rule: Dict):
        """Add matching rule"""
        self.matching_rules.append(rule)

    def match_records(self, record1: Dict, record2: Dict) -> float:
        """Calculate match score between two records"""
        total_score = 0
        total_weight = 0

        for rule in self.matching_rules:
            field = rule['field']
            weight = rule['weight']
            match_type = rule['match_type']

            if field in record1 and field in record2:
                if match_type == 'exact':
                    score = 1.0 if record1[field] == record2[field] else 0.0
                elif match_type == 'fuzzy':
                    score = self._fuzzy_match(record1[field], record2[field])
                elif match_type == 'phonetic':
                    score = self._phonetic_match(record1[field], record2[field])
                else:
                    score = 0.0

                total_score += score * weight
                total_weight += weight

        return total_score / total_weight if total_weight > 0 else 0

    def _fuzzy_match(self, str1: str, str2: str) -> float:
        """Fuzzy matching (simplified Levenshtein distance)"""
        if str1 == str2:
            return 1.0
        len1, len2 = len(str1), len(str2)
        if len1 == 0 or len2 == 0:
            return 0.0
        # Simplified implementation
        common = sum(c1 == c2 for c1, c2 in zip(str1.lower(), str2.lower()))
        return common / max(len1, len2)

    def _phonetic_match(self, str1: str, str2: str) -> float:
        """Phonetic matching (placeholder implementation)"""
        # Should use Soundex, Metaphone, etc. algorithms in practice
        return 1.0 if str1.lower() == str2.lower() else 0.0

    def create_golden_record(self, matched_records: List[Dict]) -> Dict:
        """Create golden record (apply survivorship rules)"""
        golden = {}

        for field, rule in self.survivorship_rules.items():
            values = []
            for record in matched_records:
                if field in record and record[field]:
                    values.append({
                        'value': record[field],
                        'source': record.get('_source'),
                        'timestamp': record.get('_timestamp')
                    })

            if not values:
                continue

            if rule['strategy'] == 'most_recent':
                golden[field] = max(values, key=lambda x: x['timestamp'])['value']
            elif rule['strategy'] == 'most_trusted':
                golden[field] = max(
                    values,
                    key=lambda x: self.source_mappings.get(x['source'], {}).get('trust_score', 0)
                )['value']
            elif rule['strategy'] == 'most_complete':
                golden[field] = max(values, key=lambda x: len(str(x['value'])))['value']
            elif rule['strategy'] == 'frequency':
                # Select the value that appears most frequently
                value_counts = {}
                for v in values:
                    value_counts[v['value']] = value_counts.get(v['value'], 0) + 1
                golden[field] = max(value_counts, key=value_counts.get)

        # Generate golden record ID
        golden['_golden_id'] = self._generate_golden_id(golden)
        golden['_created_at'] = datetime.now()
        golden['_source_count'] = len(matched_records)

        return golden

    def _generate_golden_id(self, record: Dict) -> str:
        """Generate golden record unique identifier"""
        key_fields = ['name', 'email', 'phone']  # Configure key fields
        key_string = '|'.join(str(record.get(f, '')) for f in key_fields)
        return hashlib.md5(key_string.encode()).hexdigest()

# Usage example
def setup_customer_mdm():
    """Set up customer master data management"""
    mdm = MasterDataManager()

    # Register data sources
    mdm.register_source('CRM', {'priority': 1, 'trust_score': 0.9})
    mdm.register_source('ERP', {'priority': 2, 'trust_score': 0.8})
    mdm.register_source('Website', {'priority': 3, 'trust_score': 0.6})

    # Configure matching rules
    mdm.add_matching_rule({'field': 'email', 'weight': 0.4, 'match_type': 'exact'})
    mdm.add_matching_rule({'field': 'phone', 'weight': 0.3, 'match_type': 'exact'})
    mdm.add_matching_rule({'field': 'name', 'weight': 0.3, 'match_type': 'fuzzy'})

    # Configure survivorship rules
    mdm.survivorship_rules = {
        'name': {'strategy': 'most_trusted'},
        'email': {'strategy': 'most_recent'},
        'phone': {'strategy': 'most_complete'},
        'address': {'strategy': 'most_trusted'},
        'segment': {'strategy': 'most_trusted'}
    }

    return mdm
```

```sql
-- Master data management table structure

-- Golden records table
CREATE TABLE mdm_customer_golden (
    golden_id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    segment VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5, 4),
    source_count INT
);

-- Source record mapping table
CREATE TABLE mdm_customer_source_mapping (
    mapping_id SERIAL PRIMARY KEY,
    golden_id VARCHAR(50) REFERENCES mdm_customer_golden(golden_id),
    source_system VARCHAR(50) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    match_score DECIMAL(5, 4),
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_system, source_id)
);

-- Match history table
CREATE TABLE mdm_match_history (
    match_id SERIAL PRIMARY KEY,
    record1_source VARCHAR(50),
    record1_id VARCHAR(100),
    record2_source VARCHAR(50),
    record2_id VARCHAR(100),
    match_score DECIMAL(5, 4),
    match_status VARCHAR(20),  -- 'auto_matched', 'manual_review', 'rejected'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data quality issue tracking
CREATE TABLE mdm_data_issues (
    issue_id SERIAL PRIMARY KEY,
    golden_id VARCHAR(50),
    source_system VARCHAR(50),
    source_id VARCHAR(100),
    issue_type VARCHAR(50),  -- 'duplicate', 'missing', 'inconsistent', 'invalid'
    issue_field VARCHAR(100),
    issue_description TEXT,
    severity VARCHAR(20),  -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100)
);
```

## Data Lineage

### Data Lineage Tracking

```python
# Data lineage management system
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional
from datetime import datetime
import json

@dataclass
class DataAsset:
    """Data asset"""
    asset_id: str
    asset_type: str  # 'table', 'column', 'report', 'dashboard'
    name: str
    description: str
    schema_name: Optional[str] = None
    database: Optional[str] = None
    owner: Optional[str] = None
    tags: List[str] = field(default_factory=list)

@dataclass
class LineageEdge:
    """Lineage relationship edge"""
    source_id: str
    target_id: str
    transformation_type: str  # 'direct', 'derived', 'aggregated', 'filtered'
    transformation_logic: Optional[str] = None
    job_name: Optional[str] = None
    confidence: float = 1.0

class DataLineageGraph:
    """Data lineage graph"""

    def __init__(self):
        self.assets: Dict[str, DataAsset] = {}
        self.edges: List[LineageEdge] = []
        self.upstream_index: Dict[str, Set[str]] = {}
        self.downstream_index: Dict[str, Set[str]] = {}

    def add_asset(self, asset: DataAsset):
        """Add data asset"""
        self.assets[asset.asset_id] = asset
        if asset.asset_id not in self.upstream_index:
            self.upstream_index[asset.asset_id] = set()
        if asset.asset_id not in self.downstream_index:
            self.downstream_index[asset.asset_id] = set()

    def add_lineage(self, edge: LineageEdge):
        """Add lineage relationship"""
        self.edges.append(edge)

        # Update indexes
        if edge.target_id not in self.upstream_index:
            self.upstream_index[edge.target_id] = set()
        self.upstream_index[edge.target_id].add(edge.source_id)

        if edge.source_id not in self.downstream_index:
            self.downstream_index[edge.source_id] = set()
        self.downstream_index[edge.source_id].add(edge.target_id)

    def get_upstream(self, asset_id: str, depth: int = -1) -> List[str]:
        """Get upstream lineage"""
        visited = set()
        result = []

        def dfs(current_id: str, current_depth: int):
            if current_id in visited:
                return
            if depth != -1 and current_depth > depth:
                return

            visited.add(current_id)
            if current_id != asset_id:
                result.append(current_id)

            for upstream_id in self.upstream_index.get(current_id, []):
                dfs(upstream_id, current_depth + 1)

        dfs(asset_id, 0)
        return result

    def get_downstream(self, asset_id: str, depth: int = -1) -> List[str]:
        """Get downstream lineage"""
        visited = set()
        result = []

        def dfs(current_id: str, current_depth: int):
            if current_id in visited:
                return
            if depth != -1 and current_depth > depth:
                return

            visited.add(current_id)
            if current_id != asset_id:
                result.append(current_id)

            for downstream_id in self.downstream_index.get(current_id, []):
                dfs(downstream_id, current_depth + 1)

        dfs(asset_id, 0)
        return result

    def impact_analysis(self, asset_id: str) -> Dict:
        """Impact analysis"""
        downstream = self.get_downstream(asset_id)

        impact = {
            'total_impacted': len(downstream),
            'by_type': {},
            'critical_assets': [],
            'reports': [],
            'dashboards': []
        }

        for aid in downstream:
            asset = self.assets.get(aid)
            if asset:
                asset_type = asset.asset_type
                impact['by_type'][asset_type] = impact['by_type'].get(asset_type, 0) + 1

                if 'critical' in asset.tags:
                    impact['critical_assets'].append(aid)
                if asset_type == 'report':
                    impact['reports'].append(asset.name)
                if asset_type == 'dashboard':
                    impact['dashboards'].append(asset.name)

        return impact

    def root_cause_analysis(self, asset_id: str) -> Dict:
        """Root cause analysis"""
        upstream = self.get_upstream(asset_id)

        sources = {
            'source_tables': [],
            'transformations': [],
            'jobs': set()
        }

        for aid in upstream:
            asset = self.assets.get(aid)
            if asset and asset.asset_type == 'table':
                sources['source_tables'].append(asset.name)

        for edge in self.edges:
            if edge.target_id == asset_id or edge.target_id in upstream:
                if edge.transformation_logic:
                    sources['transformations'].append({
                        'from': edge.source_id,
                        'to': edge.target_id,
                        'logic': edge.transformation_logic
                    })
                if edge.job_name:
                    sources['jobs'].add(edge.job_name)

        sources['jobs'] = list(sources['jobs'])
        return sources

# Build lineage graph example
def build_sales_lineage():
    """Build sales data lineage"""
    graph = DataLineageGraph()

    # Source tables
    graph.add_asset(DataAsset(
        'src.orders', 'table', 'orders',
        'Orders source table', 'source_db', 'mysql'
    ))
    graph.add_asset(DataAsset(
        'src.customers', 'table', 'customers',
        'Customers source table', 'source_db', 'mysql'
    ))
    graph.add_asset(DataAsset(
        'src.products', 'table', 'products',
        'Products source table', 'source_db', 'mysql'
    ))

    # ODS layer
    graph.add_asset(DataAsset(
        'ods.orders', 'table', 'ods_orders',
        'ODS orders table', 'ods', 'hive'
    ))

    # DWD layer
    graph.add_asset(DataAsset(
        'dwd.fact_sales', 'table', 'dwd_fact_sales',
        'Sales fact table', 'dwd', 'hive', tags=['critical']
    ))

    # DWS layer
    graph.add_asset(DataAsset(
        'dws.sales_daily', 'table', 'dws_sales_daily',
        'Daily sales summary', 'dws', 'hive'
    ))

    # ADS layer / Reports
    graph.add_asset(DataAsset(
        'ads.sales_report', 'report', 'Daily Sales Report',
        'Daily sales report', tags=['critical']
    ))

    # Add lineage relationships
    graph.add_lineage(LineageEdge(
        'src.orders', 'ods.orders', 'direct',
        job_name='sync_orders_to_ods'
    ))
    graph.add_lineage(LineageEdge(
        'ods.orders', 'dwd.fact_sales', 'derived',
        'JOIN with dim tables',
        job_name='build_fact_sales'
    ))
    graph.add_lineage(LineageEdge(
        'src.customers', 'dwd.fact_sales', 'derived',
        job_name='build_fact_sales'
    ))
    graph.add_lineage(LineageEdge(
        'src.products', 'dwd.fact_sales', 'derived',
        job_name='build_fact_sales'
    ))
    graph.add_lineage(LineageEdge(
        'dwd.fact_sales', 'dws.sales_daily', 'aggregated',
        'SUM by date',
        job_name='aggregate_daily_sales'
    ))
    graph.add_lineage(LineageEdge(
        'dws.sales_daily', 'ads.sales_report', 'direct',
        job_name='generate_sales_report'
    ))

    return graph
```

```sql
-- Data lineage metadata tables

-- Data catalog
CREATE TABLE data_catalog (
    asset_id VARCHAR(200) PRIMARY KEY,
    asset_type VARCHAR(50) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    description TEXT,
    database_name VARCHAR(100),
    schema_name VARCHAR(100),
    owner VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tags JSONB
);

-- Lineage relationship table
CREATE TABLE data_lineage (
    lineage_id SERIAL PRIMARY KEY,
    source_asset_id VARCHAR(200) NOT NULL,
    target_asset_id VARCHAR(200) NOT NULL,
    transformation_type VARCHAR(50),
    transformation_logic TEXT,
    job_name VARCHAR(200),
    job_id VARCHAR(100),
    confidence DECIMAL(5, 4) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_asset_id) REFERENCES data_catalog(asset_id),
    FOREIGN KEY (target_asset_id) REFERENCES data_catalog(asset_id)
);

-- Column-level lineage
CREATE TABLE column_lineage (
    lineage_id SERIAL PRIMARY KEY,
    source_asset_id VARCHAR(200) NOT NULL,
    source_column VARCHAR(200) NOT NULL,
    target_asset_id VARCHAR(200) NOT NULL,
    target_column VARCHAR(200) NOT NULL,
    transformation_expression TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Query upstream lineage
WITH RECURSIVE upstream AS (
    SELECT source_asset_id, target_asset_id, 1 as depth
    FROM data_lineage
    WHERE target_asset_id = 'dws.sales_daily'

    UNION ALL

    SELECT l.source_asset_id, l.target_asset_id, u.depth + 1
    FROM data_lineage l
    JOIN upstream u ON l.target_asset_id = u.source_asset_id
    WHERE u.depth < 10
)
SELECT DISTINCT source_asset_id, depth
FROM upstream
ORDER BY depth;
```

## Data Quality Management

### Data Quality Framework

```python
# Data quality management framework
from dataclasses import dataclass
from typing import List, Dict, Callable, Any, Optional
from datetime import datetime
from enum import Enum
import pandas as pd

class QualityDimension(Enum):
    """Data quality dimensions"""
    COMPLETENESS = "Completeness"    # Is data complete
    ACCURACY = "Accuracy"            # Is data correct
    CONSISTENCY = "Consistency"      # Is data consistent
    TIMELINESS = "Timeliness"        # Is data timely
    UNIQUENESS = "Uniqueness"        # Is data unique
    VALIDITY = "Validity"            # Does data conform to rules

@dataclass
class QualityRule:
    """Data quality rule"""
    rule_id: str
    rule_name: str
    dimension: QualityDimension
    table_name: str
    column_name: Optional[str]
    rule_type: str  # 'sql', 'python', 'regex'
    rule_expression: str
    threshold: float  # Quality threshold (0-1)
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str

@dataclass
class QualityResult:
    """Quality check result"""
    rule_id: str
    execution_time: datetime
    total_records: int
    passed_records: int
    failed_records: int
    quality_score: float
    passed: bool
    failed_samples: List[Dict] = None

class DataQualityEngine:
    """Data quality engine"""

    def __init__(self, connection):
        self.conn = connection
        self.rules: Dict[str, QualityRule] = {}
        self.results: List[QualityResult] = []

    def add_rule(self, rule: QualityRule):
        """Add quality rule"""
        self.rules[rule.rule_id] = rule

    def execute_rule(self, rule_id: str) -> QualityResult:
        """Execute single rule"""
        rule = self.rules.get(rule_id)
        if not rule:
            raise ValueError(f"Rule {rule_id} not found")

        if rule.rule_type == 'sql':
            return self._execute_sql_rule(rule)
        elif rule.rule_type == 'python':
            return self._execute_python_rule(rule)
        else:
            raise ValueError(f"Unsupported rule type: {rule.rule_type}")

    def _execute_sql_rule(self, rule: QualityRule) -> QualityResult:
        """Execute SQL rule"""
        # Get total record count
        count_sql = f"SELECT COUNT(*) FROM {rule.table_name}"
        total = pd.read_sql(count_sql, self.conn).iloc[0, 0]

        # Execute quality check
        check_sql = rule.rule_expression
        failed_df = pd.read_sql(check_sql, self.conn)
        failed_count = len(failed_df)

        passed_count = total - failed_count
        score = passed_count / total if total > 0 else 1.0

        result = QualityResult(
            rule_id=rule.rule_id,
            execution_time=datetime.now(),
            total_records=total,
            passed_records=passed_count,
            failed_records=failed_count,
            quality_score=score,
            passed=score >= rule.threshold,
            failed_samples=failed_df.head(10).to_dict('records') if failed_count > 0 else None
        )

        self.results.append(result)
        return result

    def execute_all_rules(self, table_name: str = None) -> List[QualityResult]:
        """Execute all rules"""
        results = []
        for rule_id, rule in self.rules.items():
            if table_name is None or rule.table_name == table_name:
                result = self.execute_rule(rule_id)
                results.append(result)
        return results

    def generate_report(self) -> Dict:
        """Generate quality report"""
        if not self.results:
            return {'status': 'no_results'}

        report = {
            'execution_time': datetime.now().isoformat(),
            'total_rules': len(self.results),
            'passed_rules': sum(1 for r in self.results if r.passed),
            'failed_rules': sum(1 for r in self.results if not r.passed),
            'overall_score': sum(r.quality_score for r in self.results) / len(self.results),
            'by_dimension': {},
            'critical_issues': [],
            'details': []
        }

        # Statistics by dimension
        for result in self.results:
            rule = self.rules[result.rule_id]
            dim = rule.dimension.value
            if dim not in report['by_dimension']:
                report['by_dimension'][dim] = {'count': 0, 'score': 0}
            report['by_dimension'][dim]['count'] += 1
            report['by_dimension'][dim]['score'] += result.quality_score

            # Record critical issues
            if not result.passed and rule.severity in ['high', 'critical']:
                report['critical_issues'].append({
                    'rule': rule.rule_name,
                    'dimension': dim,
                    'score': result.quality_score,
                    'threshold': rule.threshold
                })

            report['details'].append({
                'rule_id': result.rule_id,
                'rule_name': rule.rule_name,
                'dimension': dim,
                'score': result.quality_score,
                'passed': result.passed,
                'failed_records': result.failed_records
            })

        # Calculate average score per dimension
        for dim in report['by_dimension']:
            count = report['by_dimension'][dim]['count']
            report['by_dimension'][dim]['score'] /= count

        return report

# Standard quality rule definitions
def create_standard_rules(table_name: str, columns: Dict) -> List[QualityRule]:
    """Create standard quality rules"""
    rules = []

    # Completeness rules
    for col, config in columns.items():
        if config.get('required', False):
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.completeness",
                rule_name=f"{col} completeness check",
                dimension=QualityDimension.COMPLETENESS,
                table_name=table_name,
                column_name=col,
                rule_type='sql',
                rule_expression=f"SELECT * FROM {table_name} WHERE {col} IS NULL",
                threshold=0.99,
                severity='high',
                description=f"Check that {col} field is not null"
            ))

        # Uniqueness rules
        if config.get('unique', False):
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.uniqueness",
                rule_name=f"{col} uniqueness check",
                dimension=QualityDimension.UNIQUENESS,
                table_name=table_name,
                column_name=col,
                rule_type='sql',
                rule_expression=f"""
                    SELECT {col}, COUNT(*) as cnt
                    FROM {table_name}
                    GROUP BY {col}
                    HAVING COUNT(*) > 1
                """,
                threshold=1.0,
                severity='critical',
                description=f"Check {col} field uniqueness"
            ))

        # Validity rules (format check)
        if 'pattern' in config:
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.validity",
                rule_name=f"{col} format validity check",
                dimension=QualityDimension.VALIDITY,
                table_name=table_name,
                column_name=col,
                rule_type='sql',
                rule_expression=f"""
                    SELECT * FROM {table_name}
                    WHERE {col} !~ '{config['pattern']}'
                """,
                threshold=0.95,
                severity='medium',
                description=f"Check {col} field format"
            ))

    return rules
```

```sql
-- Data quality rules table

CREATE TABLE dq_rules (
    rule_id VARCHAR(100) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    dimension VARCHAR(50) NOT NULL,
    table_name VARCHAR(200) NOT NULL,
    column_name VARCHAR(200),
    rule_type VARCHAR(20) NOT NULL,
    rule_expression TEXT NOT NULL,
    threshold DECIMAL(5, 4) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data quality execution results table
CREATE TABLE dq_results (
    result_id SERIAL PRIMARY KEY,
    rule_id VARCHAR(100) REFERENCES dq_rules(rule_id),
    execution_time TIMESTAMP NOT NULL,
    total_records BIGINT,
    passed_records BIGINT,
    failed_records BIGINT,
    quality_score DECIMAL(5, 4),
    passed BOOLEAN,
    failed_samples JSONB,
    execution_duration_ms INT
);

-- Common quality check SQL examples

-- 1. Completeness check: Null ratio
SELECT
    'email' as column_name,
    COUNT(*) as total,
    COUNT(email) as non_null,
    COUNT(*) - COUNT(email) as null_count,
    ROUND(COUNT(email)::DECIMAL / COUNT(*), 4) as completeness_score
FROM customers;

-- 2. Uniqueness check: Duplicate records
SELECT email, COUNT(*) as duplicate_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;

-- 3. Consistency check: Cross-table consistency
SELECT o.customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;

-- 4. Validity check: Range check
SELECT *
FROM products
WHERE price < 0 OR price > 1000000;

-- 5. Timeliness check: Data latency
SELECT
    MAX(created_at) as latest_record,
    NOW() - MAX(created_at) as data_lag
FROM orders;

-- 6. Accuracy check: Business rules
SELECT *
FROM orders
WHERE total_amount != (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_items.order_id = orders.order_id
);
```

## Modeling Tool Selection

### Comparison of Major Modeling Tools

```python
# Data modeling tool comparison analysis
modeling_tools = {
    'ERwin': {
        'type': 'Enterprise',
        'features': ['Conceptual/Logical/Physical modeling', 'Forward/Reverse engineering', 'Team collaboration', 'Version control'],
        'databases': ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'DB2'],
        'pricing': 'Commercial',
        'pros': ['Comprehensive features', 'Enterprise support', 'Industry standard'],
        'cons': ['Expensive', 'Steep learning curve']
    },
    'PowerDesigner': {
        'type': 'Enterprise',
        'features': ['Multiple model types', 'Metadata management', 'Impact analysis', 'Report generation'],
        'databases': ['Full support for major databases'],
        'pricing': 'Commercial',
        'pros': ['Powerful features', 'Good SAP integration'],
        'cons': ['Dated interface', 'High cost']
    },
    'MySQL Workbench': {
        'type': 'Free/Open source',
        'features': ['ER modeling', 'SQL development', 'Database management', 'Migration tools'],
        'databases': ['MySQL'],
        'pricing': 'Free',
        'pros': ['Free', 'Native MySQL support', 'Easy to use'],
        'cons': ['MySQL only', 'Limited features']
    },
    'dbdiagram.io': {
        'type': 'SaaS',
        'features': ['Online collaboration', 'DSL syntax', 'SQL export', 'Version history'],
        'databases': ['Multiple databases'],
        'pricing': 'Free/Paid',
        'pros': ['Simple to use', 'Easy collaboration', 'Low learning curve'],
        'cons': ['Simple features', 'Not suitable for large projects']
    },
    'dbt': {
        'type': 'Open source',
        'features': ['Data transformation', 'Documentation generation', 'Testing framework', 'Lineage tracking'],
        'databases': ['Snowflake', 'BigQuery', 'Redshift', 'Databricks'],
        'pricing': 'Open source/Cloud paid',
        'pros': ['Code-based modeling', 'Git-friendly', 'Active community'],
        'cons': ['Requires SQL knowledge', 'Transformation layer only']
    },
    'Apache Atlas': {
        'type': 'Open source',
        'features': ['Metadata management', 'Data governance', 'Lineage tracking', 'Classification tags'],
        'databases': ['Hadoop ecosystem'],
        'pricing': 'Free',
        'pros': ['Open source free', 'Hadoop integration', 'Enterprise features'],
        'cons': ['Complex deployment', 'High learning curve']
    },
    'DataHub': {
        'type': 'Open source',
        'features': ['Metadata search', 'Lineage visualization', 'Data discovery', 'API-driven'],
        'databases': ['Multiple data sources'],
        'pricing': 'Free',
        'pros': ['Modern architecture', 'LinkedIn open source', 'Active development'],
        'cons': ['Relatively new', 'Incomplete documentation']
    }
}

def recommend_tool(requirements: Dict) -> List[str]:
    """Recommend modeling tools based on requirements"""
    recommendations = []

    budget = requirements.get('budget', 'any')
    team_size = requirements.get('team_size', 1)
    databases = requirements.get('databases', [])
    use_case = requirements.get('use_case', 'general')

    for tool, info in modeling_tools.items():
        score = 0

        # Budget matching
        if budget == 'free' and info['pricing'] in ['Free', 'Open source/Cloud paid']:
            score += 3
        elif budget == 'enterprise':
            score += 2

        # Database support
        for db in databases:
            if db in info['databases'] or 'Full support for major databases' in info['databases'] or 'Multiple databases' in info['databases']:
                score += 1

        # Use case matching
        if use_case == 'data_warehouse' and tool in ['dbt', 'ERwin', 'PowerDesigner']:
            score += 2
        elif use_case == 'metadata' and tool in ['Apache Atlas', 'DataHub']:
            score += 3
        elif use_case == 'simple' and tool in ['dbdiagram.io', 'MySQL Workbench']:
            score += 2

        if score > 0:
            recommendations.append((tool, score))

    recommendations.sort(key=lambda x: x[1], reverse=True)
    return [r[0] for r in recommendations[:3]]
```

### dbt Modeling Example

```sql
-- dbt model examples

-- models/staging/stg_orders.sql
{{
    config(
        materialized='view',
        schema='staging'
    )
}}

WITH source AS (
    SELECT * FROM {{ source('raw', 'orders') }}
),

renamed AS (
    SELECT
        id AS order_id,
        customer_id,
        order_date::DATE AS order_date,
        status,
        total_amount,
        created_at,
        updated_at
    FROM source
    WHERE _deleted = FALSE
)

SELECT * FROM renamed


-- models/marts/dim_customers.sql
{{
    config(
        materialized='table',
        schema='marts',
        unique_key='customer_id'
    )
}}

WITH customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
),

customer_orders AS (
    SELECT
        customer_id,
        MIN(order_date) AS first_order_date,
        MAX(order_date) AS last_order_date,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS lifetime_value
    FROM orders
    GROUP BY customer_id
)

SELECT
    c.customer_id,
    c.customer_name,
    c.email,
    c.segment,
    c.region,
    c.city,
    co.first_order_date,
    co.last_order_date,
    COALESCE(co.total_orders, 0) AS total_orders,
    COALESCE(co.lifetime_value, 0) AS lifetime_value,
    CASE
        WHEN co.lifetime_value >= 10000 THEN 'Platinum'
        WHEN co.lifetime_value >= 5000 THEN 'Gold'
        WHEN co.lifetime_value >= 1000 THEN 'Silver'
        ELSE 'Bronze'
    END AS customer_tier,
    c.created_at,
    CURRENT_TIMESTAMP AS updated_at
FROM customers c
LEFT JOIN customer_orders co ON c.customer_id = co.customer_id


-- models/marts/fact_sales.sql
{{
    config(
        materialized='incremental',
        schema='marts',
        unique_key='sales_key',
        incremental_strategy='merge'
    )
}}

WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
    {% if is_incremental() %}
    WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
    {% endif %}
),

order_items AS (
    SELECT * FROM {{ ref('stg_order_items') }}
),

products AS (
    SELECT * FROM {{ ref('dim_products') }}
),

customers AS (
    SELECT * FROM {{ ref('dim_customers') }}
)

SELECT
    {{ dbt_utils.generate_surrogate_key(['oi.order_id', 'oi.product_id']) }} AS sales_key,
    o.order_date,
    o.order_id,
    oi.product_id,
    o.customer_id,
    oi.quantity,
    oi.unit_price,
    oi.discount_amount,
    (oi.quantity * oi.unit_price - oi.discount_amount) AS sales_amount,
    (oi.quantity * p.unit_cost) AS cost_amount,
    (oi.quantity * oi.unit_price - oi.discount_amount - oi.quantity * p.unit_cost) AS profit,
    o.updated_at
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id


-- tests/assert_positive_sales.sql
-- Custom data quality test
SELECT *
FROM {{ ref('fact_sales') }}
WHERE sales_amount < 0
```

```yaml
# dbt schema.yml data quality test configuration
version: 2

models:
  - name: dim_customers
    description: "Customer dimension table"
    columns:
      - name: customer_id
        description: "Customer unique identifier"
        tests:
          - unique
          - not_null
      - name: email
        description: "Customer email"
        tests:
          - unique
          - not_null
      - name: customer_tier
        description: "Customer tier"
        tests:
          - accepted_values:
              values: ['Platinum', 'Gold', 'Silver', 'Bronze']

  - name: fact_sales
    description: "Sales fact table"
    columns:
      - name: sales_key
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - relationships:
              to: ref('dim_customers')
              field: customer_id
      - name: sales_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

## Interview Key Points

### Core Concept Questions

**Q1: Explain the three-tier architecture of data modeling (Conceptual, Logical, Physical)**

```text
Key Points:
1. Conceptual Model (CDM):
   - Highest level of abstraction, focuses on business concepts
   - Identifies main entities and relationships
   - Does not involve specific attributes or technical details
   - Primary audience: Business personnel

2. Logical Model (LDM):
   - Detailed attribute definitions and data types
   - Normalized design (following normal forms)
   - Defines business rules and constraints
   - Independent of specific database technology
   - Primary audience: Business analysts, data architects

3. Physical Model (PDM):
   - Specific database implementation
   - Contains technical details like tables, indexes, partitions
   - Considers performance optimization
   - Targets specific database platform
   - Primary audience: DBAs, developers
```

**Q2: What is dimensional modeling? What's the difference between star schema and snowflake schema?**

```text
Key Points:
Dimensional modeling is a data warehouse design methodology that includes:
- Fact tables: Store business measures (e.g., sales amount, quantity)
- Dimension tables: Store descriptive attributes (e.g., time, product, customer)

Star Schema:
- Fact table directly connects to all dimension tables
- Dimension tables are not normalized (may have redundancy)
- Good query performance (fewer JOINs)
- Easy to understand and use

Snowflake Schema:
- Dimension tables are further normalized
- Reduces data redundancy
- Queries require more JOINs
- Easier to maintain consistency

Selection Guidelines:
- Choose star schema in most cases
- Consider snowflake schema when dimension data is large and changes frequently
```

**Q3: Explain the different types of SCD (Slowly Changing Dimensions)**

```text
Key Points:

Type 0: Fixed Attribute
- No updates, retain original value
- Suitable for: Birth date, original registration date

Type 1: Overwrite Update
- Directly overwrite old value, no history preserved
- Suitable for: Data corrections, non-critical attributes

Type 2: History Tracking
- Create new version record, preserve complete history
- Uses effective date, end date, current flag
- Suitable for: Important attributes requiring historical analysis

Type 3: Previous Value Column
- Add previous_value column
- Only preserves the previous value
- Suitable for: Only caring about before/after comparison

Type 4: History Table
- Current value in main table, history records in separate table
- Suitable for: Frequently changing data that needs history

Type 6: Hybrid Approach (1+2+3)
- Combines multiple strategies
- Most flexible but also most complex
```

### Design Practice Questions

**Q4: Design a data model for an e-commerce order system**

```sql
-- Reference Answer

-- 1. Identify core entities at conceptual level
-- Customer, Order, Product, Payment, Logistics

-- 2. Logical model design
-- Core table structure (3NF)

CREATE TABLE customers (
    customer_id BIGINT PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    customer_type VARCHAR(20) CHECK (customer_type IN ('INDIVIDUAL', 'ENTERPRISE')),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id BIGINT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(300) NOT NULL,
    category_id INT,
    brand VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    unit_cost DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL,
    order_status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    shipping_address TEXT NOT NULL,
    order_time TIMESTAMP NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    item_id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 3. Dimensional model design (Data Warehouse)
-- Fact table + Dimension table structure
-- See dimensional modeling section above
```

**Q5: How to implement data lineage tracking?**

```text
Key Points:

1. Lineage Collection Methods:
   - SQL parsing: Analyze table dependencies in ETL SQL
   - Log analysis: Extract data flow from execution logs
   - API integration: Get metadata through tool APIs
   - Manual maintenance: Manually annotate key lineage relationships

2. Lineage Storage Design:
   - Graph database (Neo4j) suitable for complex lineage
   - Relational database + recursive queries
   - Metadata catalog table + lineage edge table

3. Lineage Use Cases:
   - Impact analysis: Assess impact scope before changes
   - Root cause analysis: Trace data issues
   - Compliance audit: Prove data provenance
   - Data governance: Understand data flow

4. Tool Selection:
   - Apache Atlas (Hadoop ecosystem)
   - DataHub (general purpose)
   - Custom system (for specific needs)
```

### Data Quality Questions

**Q6: What are the six dimensions of data quality? How to design quality rules?**

```text
Key Points:

Six Quality Dimensions:
1. Completeness: Is data missing
2. Accuracy: Does data correctly reflect reality
3. Consistency: Is data consistent across different systems
4. Timeliness: Is data available when needed
5. Uniqueness: Is there duplicate data
6. Validity: Does data conform to defined rules

Quality Rule Design Principles:
1. Define rules based on business requirements
2. Set reasonable quality thresholds
3. Handle by severity level (Critical/High/Medium/Low)
4. Automate execution and alerting
5. Continuous monitoring and optimization

Rule Examples:
- Primary key not null and unique
- Foreign key referential integrity
- Value range checks
- Format regex matching
- Cross-table consistency validation
- Data latency monitoring
```

### Summary

Data modeling is a core competency in data engineering. Master these key points:

1. **Modeling Methodology**: Understand the conceptual, logical, and physical three-tier architecture
2. **ER Modeling**: Proficiently use entity-relationship models to design OLTP systems
3. **Dimensional Modeling**: Master star/snowflake schema for data warehouse design
4. **SCD Handling**: Choose appropriate historical data handling strategies based on business needs
5. **Data Normalization**: Understand normal form theory, balance between normalization and performance
6. **Data Lineage**: Establish end-to-end data traceability capabilities
7. **Data Quality**: Build comprehensive data quality management systems
8. **Tool Selection**: Choose appropriate modeling tools based on scenarios

A good data model is the foundation of data assets and deserves careful design investment.
