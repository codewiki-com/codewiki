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
origin: old/src/content/docs/data/data-modeling.zh.md
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

数据建模是数据工程和数据架构的核心基础，它决定了数据如何被组织、存储和访问。一个优秀的数据模型不仅能够准确反映业务需求，还能提供高效的查询性能和良好的可扩展性。本文将全面介绍数据建模的理论基础、方法论和最佳实践。

## 数据建模概述

### 什么是数据建模？

数据建模是创建数据模型的过程，用于定义和分析数据需求，以支持组织的业务流程。数据模型是对现实世界数据特征的抽象表示，它描述了数据的结构、数据之间的关系以及数据的约束条件。

```python
# 数据建模的核心要素示例
class DataModel:
    """数据模型的基本组成"""

    def __init__(self):
        self.entities = []      # 实体：现实世界中的对象
        self.attributes = []    # 属性：实体的特征
        self.relationships = [] # 关系：实体之间的关联
        self.constraints = []   # 约束：数据的规则和限制

    def add_entity(self, name, description, attributes):
        """添加实体定义"""
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
        """添加关系定义

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

### 数据建模的重要性

1. **业务理解**：数据模型帮助技术团队理解业务需求
2. **沟通桥梁**：作为业务人员和技术人员之间的沟通工具
3. **系统设计**：为数据库设计和应用开发提供蓝图
4. **数据质量**：通过约束确保数据的一致性和完整性
5. **性能优化**：合理的模型设计直接影响查询性能

### 数据建模的生命周期

```python
# 数据建模生命周期管理
class ModelingLifecycle:
    """数据建模生命周期"""

    PHASES = [
        {
            'phase': '需求分析',
            'activities': ['业务需求收集', '数据需求识别', '利益相关者访谈'],
            'deliverables': ['需求文档', '业务术语表']
        },
        {
            'phase': '概念建模',
            'activities': ['识别主要实体', '定义高层关系', '验证业务理解'],
            'deliverables': ['概念数据模型', '实体定义文档']
        },
        {
            'phase': '逻辑建模',
            'activities': ['属性定义', '关系规范化', '约束定义'],
            'deliverables': ['逻辑数据模型', '数据字典']
        },
        {
            'phase': '物理建模',
            'activities': ['表设计', '索引策略', '分区方案'],
            'deliverables': ['物理数据模型', 'DDL脚本']
        },
        {
            'phase': '实施与维护',
            'activities': ['模型部署', '性能监控', '迭代优化'],
            'deliverables': ['生产数据库', '运维文档']
        }
    ]

    @classmethod
    def get_phase_details(cls, phase_name):
        for phase in cls.PHASES:
            if phase['phase'] == phase_name:
                return phase
        return None
```

## 概念模型、逻辑模型、物理模型

### 概念数据模型（CDM）

概念数据模型是最高层次的抽象，它关注业务概念而非技术实现，主要用于与业务人员沟通。

```sql
-- 概念模型示例：电商系统核心实体
-- 只关注主要实体和关系，不涉及具体属性

/*
概念实体：
- 客户（Customer）
- 订单（Order）
- 产品（Product）
- 供应商（Supplier）

核心关系：
- 客户 下单 订单 (1:N)
- 订单 包含 产品 (M:N)
- 供应商 供应 产品 (M:N)
*/

-- 概念模型文档化
CREATE TABLE conceptual_entities (
    entity_id INT PRIMARY KEY,
    entity_name VARCHAR(100),
    business_definition TEXT,
    business_owner VARCHAR(100),
    data_steward VARCHAR(100)
);

INSERT INTO conceptual_entities VALUES
(1, '客户', '购买产品或服务的个人或组织', '销售部', '数据治理团队'),
(2, '订单', '客户购买产品的交易记录', '销售部', '数据治理团队'),
(3, '产品', '可供销售的商品或服务', '产品部', '数据治理团队'),
(4, '供应商', '提供产品或原材料的外部组织', '采购部', '数据治理团队');
```

### 逻辑数据模型（LDM）

逻辑数据模型在概念模型基础上增加了详细的属性定义、数据类型和业务规则，但仍然独立于具体的数据库技术。

```sql
-- 逻辑数据模型示例

-- 客户实体
/*
实体名称: Customer
属性:
  - customer_id (PK): 客户唯一标识
  - customer_name: 客户名称
  - customer_type: 客户类型 (个人/企业)
  - email: 电子邮件
  - phone: 联系电话
  - registration_date: 注册日期
  - status: 状态 (活跃/非活跃)
业务规则:
  - email 必须唯一
  - phone 格式必须符合规范
*/

-- 订单实体
/*
实体名称: Order
属性:
  - order_id (PK): 订单唯一标识
  - customer_id (FK): 客户ID
  - order_date: 订单日期
  - total_amount: 订单总金额
  - status: 订单状态
  - shipping_address: 收货地址
  - payment_method: 支付方式
关系:
  - 属于一个客户 (N:1)
  - 包含多个订单明细 (1:N)
*/

-- 逻辑模型定义表
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

-- 客户实体属性定义
INSERT INTO logical_model_entities VALUES
(1, 'customer_id', 'INTEGER', TRUE, FALSE, FALSE, '自动生成', '客户唯一标识'),
(1, 'customer_name', 'VARCHAR(200)', FALSE, FALSE, FALSE, '不能为空', '客户名称'),
(1, 'customer_type', 'ENUM', FALSE, FALSE, FALSE, '值域: INDIVIDUAL, ENTERPRISE', '客户类型'),
(1, 'email', 'VARCHAR(255)', FALSE, FALSE, FALSE, '唯一约束，邮箱格式验证', '电子邮件'),
(1, 'phone', 'VARCHAR(20)', FALSE, FALSE, TRUE, '电话格式验证', '联系电话'),
(1, 'registration_date', 'DATE', FALSE, FALSE, FALSE, '默认当前日期', '注册日期'),
(1, 'status', 'ENUM', FALSE, FALSE, FALSE, '值域: ACTIVE, INACTIVE', '客户状态');
```

### 物理数据模型（PDM）

物理数据模型是逻辑模型的技术实现，包含具体的数据库对象定义、索引、分区等技术细节。

```sql
-- 物理数据模型示例 (PostgreSQL)

-- 客户表
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

-- 创建索引
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_registration_date ON customers(registration_date);

-- 订单表
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

-- 创建索引
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);

-- 分区表示例（按月分区）
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

-- 创建分区
CREATE TABLE orders_2024_01 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE orders_2024_02 PARTITION OF orders_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## 实体关系建模（ER）

### ER 模型基础

实体关系模型（Entity-Relationship Model）是数据建模的经典方法，由 Peter Chen 于 1976 年提出。

```python
# ER 模型组件实现
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class Cardinality(Enum):
    ONE_TO_ONE = "1:1"
    ONE_TO_MANY = "1:N"
    MANY_TO_MANY = "M:N"

class AttributeType(Enum):
    SIMPLE = "simple"           # 简单属性
    COMPOSITE = "composite"     # 复合属性
    DERIVED = "derived"         # 派生属性
    MULTIVALUED = "multivalued" # 多值属性

@dataclass
class Attribute:
    """属性定义"""
    name: str
    data_type: str
    is_key: bool = False
    is_nullable: bool = True
    attr_type: AttributeType = AttributeType.SIMPLE
    derived_from: Optional[str] = None

@dataclass
class Entity:
    """实体定义"""
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
    """关系定义"""
    name: str
    entity1: Entity
    entity2: Entity
    cardinality: Cardinality
    participation_entity1: str = "partial"  # partial 或 total
    participation_entity2: str = "partial"
    attributes: List[Attribute] = field(default_factory=list)

# 创建 ER 模型示例
def create_ecommerce_er_model():
    """创建电商系统 ER 模型"""

    # 定义客户实体
    customer = Entity(
        name="Customer",
        description="系统注册用户"
    )
    customer.add_attribute(Attribute("customer_id", "INTEGER", is_key=True, is_nullable=False))
    customer.add_attribute(Attribute("name", "VARCHAR(200)", is_nullable=False))
    customer.add_attribute(Attribute("email", "VARCHAR(255)", is_nullable=False))
    customer.add_attribute(Attribute("age", "INTEGER", attr_type=AttributeType.DERIVED,
                                     derived_from="birth_date"))

    # 定义订单实体
    order = Entity(
        name="Order",
        description="客户订单"
    )
    order.add_attribute(Attribute("order_id", "INTEGER", is_key=True, is_nullable=False))
    order.add_attribute(Attribute("order_date", "TIMESTAMP", is_nullable=False))
    order.add_attribute(Attribute("total_amount", "DECIMAL(15,2)", is_nullable=False))

    # 定义产品实体
    product = Entity(
        name="Product",
        description="销售产品"
    )
    product.add_attribute(Attribute("product_id", "INTEGER", is_key=True, is_nullable=False))
    product.add_attribute(Attribute("name", "VARCHAR(300)", is_nullable=False))
    product.add_attribute(Attribute("price", "DECIMAL(10,2)", is_nullable=False))

    # 定义关系
    places = Relationship(
        name="places",
        entity1=customer,
        entity2=order,
        cardinality=Cardinality.ONE_TO_MANY,
        participation_entity1="partial",
        participation_entity2="total"  # 每个订单必须属于一个客户
    )

    contains = Relationship(
        name="contains",
        entity1=order,
        entity2=product,
        cardinality=Cardinality.MANY_TO_MANY
    )
    # 关系属性
    contains.attributes.append(Attribute("quantity", "INTEGER", is_nullable=False))
    contains.attributes.append(Attribute("unit_price", "DECIMAL(10,2)", is_nullable=False))

    return {
        'entities': [customer, order, product],
        'relationships': [places, contains]
    }
```

### ER 图表示法

```sql
-- ER 模型转换为关系模式

-- 1:N 关系处理：外键放在 N 端
-- Customer (1) -- places --> (N) Order
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT NOT NULL,  -- 外键放在 N 端
    order_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- M:N 关系处理：创建关联表
-- Order (M) -- contains --> (N) Product
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (  -- 关联表
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- 1:1 关系处理：外键放在任一端或合并表
-- Employee (1) -- has --> (1) EmployeeDetail
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    department VARCHAR(100)
);

CREATE TABLE employee_details (
    employee_id INT PRIMARY KEY,  -- 同时是主键和外键
    address TEXT,
    emergency_contact VARCHAR(100),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);
```

## 维度建模方法论

### 维度建模概述

维度建模是数据仓库设计的核心方法，由 Ralph Kimball 提出。它以业务过程为中心，围绕事实表和维度表构建星型或雪花型模型。

```python
# 维度建模组件
from datetime import datetime, date
from typing import Dict, List, Any

class DimensionalModel:
    """维度模型设计器"""

    def __init__(self, business_process: str):
        self.business_process = business_process
        self.grain = None
        self.dimensions = []
        self.facts = []
        self.measures = []

    def declare_grain(self, grain_description: str):
        """声明粒度 - 维度建模四步法第一步"""
        self.grain = grain_description
        print(f"粒度声明: {grain_description}")

    def identify_dimensions(self, dimensions: List[Dict]):
        """识别维度 - 维度建模四步法第二步"""
        self.dimensions = dimensions
        for dim in dimensions:
            print(f"维度: {dim['name']} - {dim['description']}")

    def identify_facts(self, measures: List[Dict]):
        """识别事实 - 维度建模四步法第三步"""
        self.measures = measures
        for measure in measures:
            print(f"度量: {measure['name']} ({measure['aggregation']})")

# 电商销售维度模型设计
def design_sales_dimensional_model():
    """设计销售分析维度模型"""

    model = DimensionalModel("零售销售分析")

    # 第一步：声明粒度
    model.declare_grain("每个订单中的每个商品行项目")

    # 第二步：识别维度
    dimensions = [
        {
            'name': 'dim_date',
            'description': '日期维度',
            'type': 'Type 0',  # 固定维度
            'attributes': ['date_key', 'full_date', 'year', 'quarter', 'month',
                          'week', 'day_of_week', 'is_holiday', 'fiscal_year']
        },
        {
            'name': 'dim_product',
            'description': '产品维度',
            'type': 'Type 2',  # 缓慢变化维度
            'attributes': ['product_key', 'product_id', 'product_name', 'category',
                          'subcategory', 'brand', 'supplier', 'effective_date', 'end_date']
        },
        {
            'name': 'dim_customer',
            'description': '客户维度',
            'type': 'Type 2',
            'attributes': ['customer_key', 'customer_id', 'customer_name', 'segment',
                          'region', 'city', 'effective_date', 'end_date', 'is_current']
        },
        {
            'name': 'dim_store',
            'description': '门店维度',
            'type': 'Type 1',  # 覆盖更新
            'attributes': ['store_key', 'store_id', 'store_name', 'store_type',
                          'address', 'city', 'region', 'manager']
        }
    ]
    model.identify_dimensions(dimensions)

    # 第三步：识别事实（度量）
    measures = [
        {'name': 'quantity', 'aggregation': 'SUM', 'description': '销售数量'},
        {'name': 'unit_price', 'aggregation': 'AVG', 'description': '单价'},
        {'name': 'discount_amount', 'aggregation': 'SUM', 'description': '折扣金额'},
        {'name': 'sales_amount', 'aggregation': 'SUM', 'description': '销售金额'},
        {'name': 'cost_amount', 'aggregation': 'SUM', 'description': '成本金额'},
        {'name': 'profit', 'aggregation': 'SUM', 'description': '利润'}
    ]
    model.identify_facts(measures)

    return model
```

### 星型模型与雪花模型

```sql
-- 星型模型实现

-- 日期维度表
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

-- 产品维度表（SCD Type 2）
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

-- 客户维度表（SCD Type 2）
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

-- 门店维度表
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

-- 销售事实表
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

-- 创建索引优化查询
CREATE INDEX idx_fact_sales_date ON fact_sales(date_key);
CREATE INDEX idx_fact_sales_product ON fact_sales(product_key);
CREATE INDEX idx_fact_sales_customer ON fact_sales(customer_key);
CREATE INDEX idx_fact_sales_store ON fact_sales(store_key);

-- 雪花模型示例（维度表进一步规范化）
-- 产品类别单独成表
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

-- 产品维度引用子类别
CREATE TABLE dim_product_snowflake (
    product_key SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(300) NOT NULL,
    subcategory_key INT REFERENCES dim_subcategory(subcategory_key),
    brand VARCHAR(100),
    supplier VARCHAR(200)
);
```

### 缓慢变化维度（SCD）

```python
# SCD 类型实现
from datetime import date

class SCDHandler:
    """缓慢变化维度处理器"""

    def __init__(self, connection):
        self.conn = connection

    def handle_type0(self, table, key_column, record):
        """Type 0: 保留原始值，不做任何更新"""
        # 仅插入新记录，已存在的记录不更新
        pass

    def handle_type1(self, table, key_column, record, business_key):
        """Type 1: 覆盖旧值"""
        sql = f"""
        UPDATE {table}
        SET {', '.join([f"{k} = %s" for k in record.keys()])}
        WHERE {business_key} = %s
        """
        # 直接更新，不保留历史

    def handle_type2(self, table, business_key, business_key_value, new_record):
        """Type 2: 保留历史，添加新版本"""
        today = date.today()

        # 1. 关闭当前记录
        close_sql = f"""
        UPDATE {table}
        SET end_date = %s, is_current = FALSE
        WHERE {business_key} = %s AND is_current = TRUE
        """

        # 2. 插入新版本
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
        """Type 3: 添加前一个值列"""
        sql = f"""
        UPDATE {table}
        SET {previous_column}_previous = {previous_column},
            {previous_column} = %s
        WHERE {key_column} = %s
        """
        # 保留上一个值在单独列中

    def handle_type4(self, main_table, history_table, record):
        """Type 4: 使用历史表"""
        # 主表保持当前值
        # 变更记录写入历史表
        pass

    def handle_type6(self, table, business_key, business_key_value, new_record):
        """Type 6: 混合方法 (1+2+3)
        - 保留当前值列
        - 保留历史记录（Type 2）
        - 保留前一个值（Type 3）
        """
        today = date.today()

        # 更新所有历史记录的 current_ 列
        update_current_sql = f"""
        UPDATE {table}
        SET current_value = %s
        WHERE {business_key} = %s
        """

        # 关闭当前记录
        close_sql = f"""
        UPDATE {table}
        SET end_date = %s, is_current = FALSE
        WHERE {business_key} = %s AND is_current = TRUE
        """

        # 插入新记录
        # ...
```

```sql
-- SCD Type 2 完整实现示例

-- 初始数据加载
INSERT INTO dim_customer (customer_id, customer_name, segment, region, city,
                          effective_date, end_date, is_current)
VALUES ('C001', '张三', 'Regular', '华东', '上海', '2024-01-01', NULL, TRUE);

-- 客户升级为 VIP，创建新版本
UPDATE dim_customer
SET end_date = '2024-06-30', is_current = FALSE
WHERE customer_id = 'C001' AND is_current = TRUE;

INSERT INTO dim_customer (customer_id, customer_name, segment, region, city,
                          effective_date, end_date, is_current)
VALUES ('C001', '张三', 'VIP', '华东', '上海', '2024-07-01', NULL, TRUE);

-- 查询客户历史
SELECT customer_key, customer_id, customer_name, segment,
       effective_date, end_date, is_current
FROM dim_customer
WHERE customer_id = 'C001'
ORDER BY effective_date;

-- 查询特定时间点的客户状态（时间旅行查询）
SELECT c.customer_name, c.segment
FROM dim_customer c
WHERE c.customer_id = 'C001'
  AND '2024-05-15' >= c.effective_date
  AND ('2024-05-15' < c.end_date OR c.end_date IS NULL);
```

## 数据标准化

### 范式理论

```sql
-- 第一范式 (1NF): 消除重复组，确保原子性

-- 违反 1NF（多值属性）
CREATE TABLE orders_bad (
    order_id INT,
    customer_name VARCHAR(100),
    products VARCHAR(500)  -- '产品A,产品B,产品C' 违反原子性
);

-- 符合 1NF
CREATE TABLE orders_1nf (
    order_id INT,
    customer_name VARCHAR(100),
    product_name VARCHAR(100),
    PRIMARY KEY (order_id, product_name)
);

-- 第二范式 (2NF): 消除部分依赖

-- 违反 2NF（非主属性依赖于部分主键）
CREATE TABLE order_items_bad (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- 只依赖于 product_id
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- 符合 2NF（分解表）
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

-- 第三范式 (3NF): 消除传递依赖

-- 违反 3NF（传递依赖）
CREATE TABLE employees_bad (
    employee_id INT PRIMARY KEY,
    employee_name VARCHAR(100),
    department_id INT,
    department_name VARCHAR(100),  -- 依赖于 department_id，而非 employee_id
    department_manager VARCHAR(100)
);

-- 符合 3NF
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

-- BCNF (Boyce-Codd 范式): 每个决定因素都是候选键

-- 违反 BCNF 示例
-- 假设：一个学生只能选一个导师，一个导师只教一门课
CREATE TABLE student_advisor_bad (
    student_id INT,
    subject VARCHAR(100),
    advisor VARCHAR(100),
    PRIMARY KEY (student_id, subject)
    -- advisor -> subject (导师决定课程，但 advisor 不是候选键)
);

-- 符合 BCNF
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

### 反规范化策略

```sql
-- 反规范化：为了查询性能而有意引入冗余

-- 预计算汇总表
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

-- 定期刷新汇总表
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

-- 冗余存储常用查询字段
CREATE TABLE orders_denormalized (
    order_id INT PRIMARY KEY,
    customer_id INT,
    customer_name VARCHAR(200),      -- 冗余：来自 customers 表
    customer_segment VARCHAR(50),    -- 冗余：来自 customers 表
    order_date TIMESTAMP,
    total_amount DECIMAL(15, 2),
    item_count INT,                  -- 冗余：计算字段
    shipping_address TEXT
);
```

## 主数据管理

### MDM 架构设计

```python
# 主数据管理系统设计
from typing import Dict, List, Optional
from datetime import datetime
import hashlib

class MasterDataManager:
    """主数据管理器"""

    def __init__(self):
        self.golden_records = {}
        self.source_mappings = {}
        self.matching_rules = []
        self.survivorship_rules = {}

    def register_source(self, source_name: str, source_config: Dict):
        """注册数据源"""
        self.source_mappings[source_name] = {
            'config': source_config,
            'priority': source_config.get('priority', 100),
            'trust_score': source_config.get('trust_score', 0.5)
        }

    def add_matching_rule(self, rule: Dict):
        """添加匹配规则"""
        self.matching_rules.append(rule)

    def match_records(self, record1: Dict, record2: Dict) -> float:
        """计算两条记录的匹配分数"""
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
        """模糊匹配（简化的 Levenshtein 距离）"""
        if str1 == str2:
            return 1.0
        len1, len2 = len(str1), len(str2)
        if len1 == 0 or len2 == 0:
            return 0.0
        # 简化实现
        common = sum(c1 == c2 for c1, c2 in zip(str1.lower(), str2.lower()))
        return common / max(len1, len2)

    def _phonetic_match(self, str1: str, str2: str) -> float:
        """语音匹配（占位实现）"""
        # 实际应使用 Soundex、Metaphone 等算法
        return 1.0 if str1.lower() == str2.lower() else 0.0

    def create_golden_record(self, matched_records: List[Dict]) -> Dict:
        """创建黄金记录（应用生存规则）"""
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
                # 选择出现次数最多的值
                value_counts = {}
                for v in values:
                    value_counts[v['value']] = value_counts.get(v['value'], 0) + 1
                golden[field] = max(value_counts, key=value_counts.get)

        # 生成黄金记录 ID
        golden['_golden_id'] = self._generate_golden_id(golden)
        golden['_created_at'] = datetime.now()
        golden['_source_count'] = len(matched_records)

        return golden

    def _generate_golden_id(self, record: Dict) -> str:
        """生成黄金记录唯一标识"""
        key_fields = ['name', 'email', 'phone']  # 配置关键字段
        key_string = '|'.join(str(record.get(f, '')) for f in key_fields)
        return hashlib.md5(key_string.encode()).hexdigest()

# 使用示例
def setup_customer_mdm():
    """设置客户主数据管理"""
    mdm = MasterDataManager()

    # 注册数据源
    mdm.register_source('CRM', {'priority': 1, 'trust_score': 0.9})
    mdm.register_source('ERP', {'priority': 2, 'trust_score': 0.8})
    mdm.register_source('Website', {'priority': 3, 'trust_score': 0.6})

    # 配置匹配规则
    mdm.add_matching_rule({'field': 'email', 'weight': 0.4, 'match_type': 'exact'})
    mdm.add_matching_rule({'field': 'phone', 'weight': 0.3, 'match_type': 'exact'})
    mdm.add_matching_rule({'field': 'name', 'weight': 0.3, 'match_type': 'fuzzy'})

    # 配置生存规则
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
-- 主数据管理表结构

-- 黄金记录表
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

-- 源记录映射表
CREATE TABLE mdm_customer_source_mapping (
    mapping_id SERIAL PRIMARY KEY,
    golden_id VARCHAR(50) REFERENCES mdm_customer_golden(golden_id),
    source_system VARCHAR(50) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    match_score DECIMAL(5, 4),
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source_system, source_id)
);

-- 匹配历史表
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

-- 数据质量问题跟踪
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

## 数据血缘

### 数据血缘追踪

```python
# 数据血缘管理系统
from dataclasses import dataclass, field
from typing import List, Dict, Set, Optional
from datetime import datetime
import json

@dataclass
class DataAsset:
    """数据资产"""
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
    """血缘关系边"""
    source_id: str
    target_id: str
    transformation_type: str  # 'direct', 'derived', 'aggregated', 'filtered'
    transformation_logic: Optional[str] = None
    job_name: Optional[str] = None
    confidence: float = 1.0

class DataLineageGraph:
    """数据血缘图"""

    def __init__(self):
        self.assets: Dict[str, DataAsset] = {}
        self.edges: List[LineageEdge] = []
        self.upstream_index: Dict[str, Set[str]] = {}
        self.downstream_index: Dict[str, Set[str]] = {}

    def add_asset(self, asset: DataAsset):
        """添加数据资产"""
        self.assets[asset.asset_id] = asset
        if asset.asset_id not in self.upstream_index:
            self.upstream_index[asset.asset_id] = set()
        if asset.asset_id not in self.downstream_index:
            self.downstream_index[asset.asset_id] = set()

    def add_lineage(self, edge: LineageEdge):
        """添加血缘关系"""
        self.edges.append(edge)

        # 更新索引
        if edge.target_id not in self.upstream_index:
            self.upstream_index[edge.target_id] = set()
        self.upstream_index[edge.target_id].add(edge.source_id)

        if edge.source_id not in self.downstream_index:
            self.downstream_index[edge.source_id] = set()
        self.downstream_index[edge.source_id].add(edge.target_id)

    def get_upstream(self, asset_id: str, depth: int = -1) -> List[str]:
        """获取上游血缘"""
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
        """获取下游血缘"""
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
        """影响分析"""
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
        """根因分析"""
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

# 构建血缘图示例
def build_sales_lineage():
    """构建销售数据血缘"""
    graph = DataLineageGraph()

    # 源表
    graph.add_asset(DataAsset(
        'src.orders', 'table', 'orders',
        '订单源表', 'source_db', 'mysql'
    ))
    graph.add_asset(DataAsset(
        'src.customers', 'table', 'customers',
        '客户源表', 'source_db', 'mysql'
    ))
    graph.add_asset(DataAsset(
        'src.products', 'table', 'products',
        '产品源表', 'source_db', 'mysql'
    ))

    # ODS 层
    graph.add_asset(DataAsset(
        'ods.orders', 'table', 'ods_orders',
        'ODS订单表', 'ods', 'hive'
    ))

    # DWD 层
    graph.add_asset(DataAsset(
        'dwd.fact_sales', 'table', 'dwd_fact_sales',
        '销售事实表', 'dwd', 'hive', tags=['critical']
    ))

    # DWS 层
    graph.add_asset(DataAsset(
        'dws.sales_daily', 'table', 'dws_sales_daily',
        '日销售汇总', 'dws', 'hive'
    ))

    # ADS 层 / 报表
    graph.add_asset(DataAsset(
        'ads.sales_report', 'report', '销售日报',
        '每日销售报表', tags=['critical']
    ))

    # 添加血缘关系
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
-- 数据血缘元数据表

-- 数据资产目录
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

-- 血缘关系表
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

-- 列级血缘
CREATE TABLE column_lineage (
    lineage_id SERIAL PRIMARY KEY,
    source_asset_id VARCHAR(200) NOT NULL,
    source_column VARCHAR(200) NOT NULL,
    target_asset_id VARCHAR(200) NOT NULL,
    target_column VARCHAR(200) NOT NULL,
    transformation_expression TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 查询上游血缘
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

## 数据质量管理

### 数据质量框架

```python
# 数据质量管理框架
from dataclasses import dataclass
from typing import List, Dict, Callable, Any, Optional
from datetime import datetime
from enum import Enum
import pandas as pd

class QualityDimension(Enum):
    """数据质量维度"""
    COMPLETENESS = "完整性"      # 数据是否完整
    ACCURACY = "准确性"          # 数据是否正确
    CONSISTENCY = "一致性"       # 数据是否一致
    TIMELINESS = "及时性"        # 数据是否及时
    UNIQUENESS = "唯一性"        # 数据是否唯一
    VALIDITY = "有效性"          # 数据是否符合规则

@dataclass
class QualityRule:
    """数据质量规则"""
    rule_id: str
    rule_name: str
    dimension: QualityDimension
    table_name: str
    column_name: Optional[str]
    rule_type: str  # 'sql', 'python', 'regex'
    rule_expression: str
    threshold: float  # 质量阈值 (0-1)
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str

@dataclass
class QualityResult:
    """质量检查结果"""
    rule_id: str
    execution_time: datetime
    total_records: int
    passed_records: int
    failed_records: int
    quality_score: float
    passed: bool
    failed_samples: List[Dict] = None

class DataQualityEngine:
    """数据质量引擎"""

    def __init__(self, connection):
        self.conn = connection
        self.rules: Dict[str, QualityRule] = {}
        self.results: List[QualityResult] = []

    def add_rule(self, rule: QualityRule):
        """添加质量规则"""
        self.rules[rule.rule_id] = rule

    def execute_rule(self, rule_id: str) -> QualityResult:
        """执行单个规则"""
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
        """执行 SQL 规则"""
        # 获取总记录数
        count_sql = f"SELECT COUNT(*) FROM {rule.table_name}"
        total = pd.read_sql(count_sql, self.conn).iloc[0, 0]

        # 执行质量检查
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
        """执行所有规则"""
        results = []
        for rule_id, rule in self.rules.items():
            if table_name is None or rule.table_name == table_name:
                result = self.execute_rule(rule_id)
                results.append(result)
        return results

    def generate_report(self) -> Dict:
        """生成质量报告"""
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

        # 按维度统计
        for result in self.results:
            rule = self.rules[result.rule_id]
            dim = rule.dimension.value
            if dim not in report['by_dimension']:
                report['by_dimension'][dim] = {'count': 0, 'score': 0}
            report['by_dimension'][dim]['count'] += 1
            report['by_dimension'][dim]['score'] += result.quality_score

            # 记录关键问题
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

        # 计算各维度平均分
        for dim in report['by_dimension']:
            count = report['by_dimension'][dim]['count']
            report['by_dimension'][dim]['score'] /= count

        return report

# 常用质量规则定义
def create_standard_rules(table_name: str, columns: Dict) -> List[QualityRule]:
    """创建标准质量规则"""
    rules = []

    # 完整性规则
    for col, config in columns.items():
        if config.get('required', False):
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.completeness",
                rule_name=f"{col} 完整性检查",
                dimension=QualityDimension.COMPLETENESS,
                table_name=table_name,
                column_name=col,
                rule_type='sql',
                rule_expression=f"SELECT * FROM {table_name} WHERE {col} IS NULL",
                threshold=0.99,
                severity='high',
                description=f"检查 {col} 字段不为空"
            ))

        # 唯一性规则
        if config.get('unique', False):
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.uniqueness",
                rule_name=f"{col} 唯一性检查",
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
                description=f"检查 {col} 字段唯一性"
            ))

        # 有效性规则（格式检查）
        if 'pattern' in config:
            rules.append(QualityRule(
                rule_id=f"{table_name}.{col}.validity",
                rule_name=f"{col} 格式有效性检查",
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
                description=f"检查 {col} 字段格式"
            ))

    return rules
```

```sql
-- 数据质量规则表

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

-- 数据质量执行结果表
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

-- 常用质量检查 SQL 示例

-- 1. 完整性检查：空值比例
SELECT
    'email' as column_name,
    COUNT(*) as total,
    COUNT(email) as non_null,
    COUNT(*) - COUNT(email) as null_count,
    ROUND(COUNT(email)::DECIMAL / COUNT(*), 4) as completeness_score
FROM customers;

-- 2. 唯一性检查：重复记录
SELECT email, COUNT(*) as duplicate_count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;

-- 3. 一致性检查：跨表一致性
SELECT o.customer_id
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;

-- 4. 有效性检查：范围检查
SELECT *
FROM products
WHERE price < 0 OR price > 1000000;

-- 5. 及时性检查：数据延迟
SELECT
    MAX(created_at) as latest_record,
    NOW() - MAX(created_at) as data_lag
FROM orders;

-- 6. 准确性检查：业务规则
SELECT *
FROM orders
WHERE total_amount != (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_items.order_id = orders.order_id
);
```

## 建模工具选择

### 主流建模工具对比

```python
# 数据建模工具对比分析
modeling_tools = {
    'ERwin': {
        'type': '企业级',
        'features': ['概念/逻辑/物理建模', '正向/逆向工程', '团队协作', '版本控制'],
        'databases': ['Oracle', 'SQL Server', 'MySQL', 'PostgreSQL', 'DB2'],
        'pricing': '商业付费',
        'pros': ['功能全面', '企业级支持', '行业标准'],
        'cons': ['价格昂贵', '学习曲线陡峭']
    },
    'PowerDesigner': {
        'type': '企业级',
        'features': ['多种模型类型', '元数据管理', '影响分析', '报告生成'],
        'databases': ['主流数据库全支持'],
        'pricing': '商业付费',
        'pros': ['功能强大', 'SAP 集成好'],
        'cons': ['界面较老', '成本高']
    },
    'MySQL Workbench': {
        'type': '免费/开源',
        'features': ['ER 建模', 'SQL 开发', '数据库管理', '迁移工具'],
        'databases': ['MySQL'],
        'pricing': '免费',
        'pros': ['免费', 'MySQL 原生支持', '易于使用'],
        'cons': ['仅支持 MySQL', '功能有限']
    },
    'dbdiagram.io': {
        'type': 'SaaS',
        'features': ['在线协作', 'DSL 语法', '导出 SQL', '版本历史'],
        'databases': ['多数据库'],
        'pricing': '免费/付费',
        'pros': ['简单易用', '协作方便', '学习成本低'],
        'cons': ['功能简单', '大型项目不适用']
    },
    'dbt': {
        'type': '开源',
        'features': ['数据转换', '文档生成', '测试框架', '血缘追踪'],
        'databases': ['Snowflake', 'BigQuery', 'Redshift', 'Databricks'],
        'pricing': '开源/Cloud 付费',
        'pros': ['代码化建模', 'Git 友好', '社区活跃'],
        'cons': ['需要 SQL 基础', '仅限转换层']
    },
    'Apache Atlas': {
        'type': '开源',
        'features': ['元数据管理', '数据治理', '血缘追踪', '分类标签'],
        'databases': ['Hadoop 生态'],
        'pricing': '免费',
        'pros': ['开源免费', 'Hadoop 集成', '企业级功能'],
        'cons': ['部署复杂', '学习成本高']
    },
    'DataHub': {
        'type': '开源',
        'features': ['元数据搜索', '血缘可视化', '数据发现', 'API 驱动'],
        'databases': ['多数据源'],
        'pricing': '免费',
        'pros': ['现代化架构', 'LinkedIn 开源', '活跃开发'],
        'cons': ['相对较新', '文档不完善']
    }
}

def recommend_tool(requirements: Dict) -> List[str]:
    """根据需求推荐建模工具"""
    recommendations = []

    budget = requirements.get('budget', 'any')
    team_size = requirements.get('team_size', 1)
    databases = requirements.get('databases', [])
    use_case = requirements.get('use_case', 'general')

    for tool, info in modeling_tools.items():
        score = 0

        # 预算匹配
        if budget == 'free' and info['pricing'] in ['免费', '开源/Cloud 付费']:
            score += 3
        elif budget == 'enterprise':
            score += 2

        # 数据库支持
        for db in databases:
            if db in info['databases'] or '主流数据库全支持' in info['databases'] or '多数据库' in info['databases']:
                score += 1

        # 用例匹配
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

### dbt 建模示例

```sql
-- dbt 模型示例

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
-- 自定义数据质量测试
SELECT *
FROM {{ ref('fact_sales') }}
WHERE sales_amount < 0
```

```yaml
# dbt schema.yml 数据质量测试配置
version: 2

models:
  - name: dim_customers
    description: "客户维度表"
    columns:
      - name: customer_id
        description: "客户唯一标识"
        tests:
          - unique
          - not_null
      - name: email
        description: "客户邮箱"
        tests:
          - unique
          - not_null
      - name: customer_tier
        description: "客户等级"
        tests:
          - accepted_values:
              values: ['Platinum', 'Gold', 'Silver', 'Bronze']

  - name: fact_sales
    description: "销售事实表"
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

## 面试要点

### 核心概念题

**Q1: 解释数据建模的三层架构（概念、逻辑、物理）**

```text
答案要点：
1. 概念模型（CDM）：
   - 最高层抽象，关注业务概念
   - 识别主要实体和关系
   - 不涉及具体属性和技术细节
   - 主要受众：业务人员

2. 逻辑模型（LDM）：
   - 详细的属性定义和数据类型
   - 规范化设计（遵循范式）
   - 定义业务规则和约束
   - 独立于具体数据库技术
   - 主要受众：业务分析师、数据架构师

3. 物理模型（PDM）：
   - 具体的数据库实现
   - 包含表、索引、分区等技术细节
   - 考虑性能优化
   - 针对特定数据库平台
   - 主要受众：DBA、开发人员
```

**Q2: 什么是维度建模？星型模型和雪花模型的区别？**

```text
答案要点：
维度建模是数据仓库设计方法，围绕业务过程构建，包含：
- 事实表：存储业务度量（如销售金额、数量）
- 维度表：存储描述性属性（如时间、产品、客户）

星型模型：
- 事实表直接连接所有维度表
- 维度表不规范化（可能有冗余）
- 查询性能好（JOIN 少）
- 易于理解和使用

雪花模型：
- 维度表进一步规范化
- 减少数据冗余
- 查询需要更多 JOIN
- 维护一致性更容易

选择建议：
- 大多数情况选择星型模型
- 维度数据量大且变化频繁时考虑雪花模型
```

**Q3: 解释 SCD（缓慢变化维度）的不同类型**

```text
答案要点：

Type 0：固定属性
- 不做任何更新，保留原始值
- 适用于：出生日期、原始注册日期

Type 1：覆盖更新
- 直接覆盖旧值，不保留历史
- 适用于：数据纠错、非重要属性

Type 2：历史追踪
- 创建新版本记录，保留完整历史
- 使用生效日期、失效日期、当前标志
- 适用于：需要历史分析的重要属性

Type 3：前值列
- 增加 previous_value 列
- 只保留上一个值
- 适用于：只关心前后对比

Type 4：历史表
- 当前值在主表，历史记录在单独表
- 适用于：频繁变化且需要历史的场景

Type 6：混合方法（1+2+3）
- 结合多种策略
- 最灵活但也最复杂
```

### 设计实践题

**Q4: 设计一个电商订单系统的数据模型**

```sql
-- 参考答案

-- 1. 概念层面识别核心实体
-- 客户、订单、产品、支付、物流

-- 2. 逻辑模型设计
-- 核心表结构（3NF）

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

-- 3. 维度模型设计（数据仓库）
-- 事实表 + 维度表结构
-- 见前文维度建模章节
```

**Q5: 如何实现数据血缘追踪？**

```text
答案要点：

1. 血缘采集方式：
   - SQL 解析：分析 ETL SQL 中的表依赖
   - 日志分析：从执行日志提取数据流向
   - API 集成：通过工具 API 获取元数据
   - 手动维护：人工标注关键血缘关系

2. 血缘存储设计：
   - 图数据库（Neo4j）适合复杂血缘关系
   - 关系型数据库 + 递归查询
   - 元数据目录表 + 血缘边表

3. 血缘应用场景：
   - 影响分析：变更前评估影响范围
   - 根因分析：数据问题追溯
   - 合规审计：数据来源证明
   - 数据治理：理解数据流转

4. 工具选型：
   - Apache Atlas（Hadoop 生态）
   - DataHub（通用型）
   - 自建系统（定制需求）
```

### 数据质量题

**Q6: 数据质量的六个维度是什么？如何设计质量规则？**

```text
答案要点：

六个质量维度：
1. 完整性（Completeness）：数据是否缺失
2. 准确性（Accuracy）：数据是否正确反映现实
3. 一致性（Consistency）：不同系统数据是否一致
4. 及时性（Timeliness）：数据是否在需要时可用
5. 唯一性（Uniqueness）：数据是否有重复
6. 有效性（Validity）：数据是否符合定义规则

质量规则设计原则：
1. 基于业务需求定义规则
2. 设置合理的质量阈值
3. 分级处理（Critical/High/Medium/Low）
4. 自动化执行和告警
5. 持续监控和优化

规则示例：
- 主键非空且唯一
- 外键参照完整性
- 值域范围检查
- 格式正则匹配
- 跨表一致性校验
- 数据延迟监控
```

### 总结

数据建模是数据工程的核心能力，掌握以下关键点：

1. **建模方法论**：理解概念、逻辑、物理三层架构
2. **ER 建模**：熟练运用实体关系模型设计 OLTP 系统
3. **维度建模**：掌握星型/雪花模型设计数据仓库
4. **SCD 处理**：根据业务需求选择合适的历史数据处理策略
5. **数据标准化**：理解范式理论，在规范化和性能间平衡
6. **数据血缘**：建立端到端的数据追溯能力
7. **数据质量**：构建全面的数据质量管理体系
8. **工具选型**：根据场景选择合适的建模工具

良好的数据模型是数据资产的基础，值得投入时间精心设计。
