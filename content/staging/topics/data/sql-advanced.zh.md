---
title: 高级 SQL 完全指南
description: 掌握高级 SQL 技术用于复杂数据查询
track: data
section: sql
difficulty: advanced
tags:
  - SQL
  - Database
  - Queries
  - Analytics
status: imported
origin: old/src/content/docs/data/sql-advanced.zh.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: SQL
  order: 1
  lastUpdated: 2026-01-07
---

## 简介

SQL（结构化查询语言）是与关系型数据库交互的标准语言。虽然基本的 SELECT、WHERE 和 JOIN 操作可以处理许多常见任务，但现实世界的数据分析往往需要更复杂的技术。本指南探讨高级 SQL 功能，使复杂分析、层次数据处理和优化查询性能成为可能。

高级 SQL 技术解决了几个关键挑战：

1. **排名和分析计算**：计算排名、累计总和和百分位数而不折叠行
2. **层次数据处理**：遍历组织结构、评论线程和类别树
3. **复杂数据转换**：为报告需求将行转换为列及反向转换
4. **查询性能优化**：将分钟级查询转换为亚秒级操作

### 历史背景

窗口函数在 SQL:2003 标准中正式引入，尽管广泛的数据库支持是在几年后。PostgreSQL 8.4（2009）是最早提供全面支持的数据库之一，而 MySQL 直到 8.0 版本（2018）才添加窗口函数。公共表表达式（CTE）在 SQL:1999 中定义，递归 CTE 在 SQL:2003 中得到完善。

---

## 窗口函数

### 理解窗口函数

窗口函数和聚合函数之间的根本区别在于它们如何处理行：**聚合函数将多行折叠为一行，而窗口函数保留所有原始行并在定义的相关行"窗口"上计算值**。

```
原始数据:          聚合 SUM:         窗口函数 SUM OVER:
+----+-------+     +-------+        +----+-------+---------+
| id | sales |     | total |        | id | sales | running |
+----+-------+     +-------+        +----+-------+---------+
| 1  |  100  | =>  |  600  |        | 1  |  100  |   100   |
| 2  |  200  |     +-------+        | 2  |  200  |   300   |
| 3  |  300  |                      | 3  |  300  |   600   |
+----+-------+                      +----+-------+---------+
```

窗口函数**在 WHERE、GROUP BY 和 HAVING 子句之后但在 ORDER BY 之前执行**。这意味着它们在过滤和分组的结果集上操作。

### 窗口函数语法

```sql
function_name([arguments]) OVER (
    [PARTITION BY partition_columns]
    [ORDER BY sort_columns [ASC|DESC]]
    [ROWS|RANGE BETWEEN frame_start AND frame_end]
)
```

**关键组件：**

| 组件 | 描述 | 是否必需 |
|------|------|---------|
| PARTITION BY | 将数据分成独立的分区进行单独计算 | 可选 |
| ORDER BY | 定义每个分区内的逻辑顺序 | 取决于函数 |
| 窗口框架 | 指定相对于当前行包含哪些行 | 可选（有默认值）|

### 窗口框架边界

```sql
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW   -- 从分区开始到当前行
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING           -- 当前行前后各一行
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING   -- 从当前行到分区结束
RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW  -- 基于日期的范围
```

### 示例数据设置

```sql
-- 创建员工表
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE
);

-- 插入示例数据
INSERT INTO employees VALUES
(1, 'Alice', 'Engineering', 95000, '2020-01-15'),
(2, 'Bob', 'Engineering', 105000, '2019-06-20'),
(3, 'Carol', 'Engineering', 85000, '2021-03-10'),
(4, 'David', 'Sales', 75000, '2020-08-05'),
(5, 'Eve', 'Sales', 82000, '2018-12-01'),
(6, 'Frank', 'Sales', 71000, '2022-01-20'),
(7, 'Grace', 'HR', 65000, '2019-04-15'),
(8, 'Henry', 'HR', 68000, '2020-11-30');

-- 创建销售记录表
CREATE TABLE sales (
    id INT PRIMARY KEY,
    employee_id INT,
    sale_date DATE,
    amount DECIMAL(10, 2)
);

INSERT INTO sales VALUES
(1, 4, '2024-01-05', 5000),
(2, 5, '2024-01-08', 8000),
(3, 4, '2024-01-10', 3000),
(4, 6, '2024-01-12', 6000),
(5, 5, '2024-01-15', 7500),
(6, 4, '2024-01-18', 4500),
(7, 6, '2024-01-20', 5500),
(8, 5, '2024-01-25', 9000);
```

### ROW_NUMBER - 顺序编号

为分区内的每一行分配唯一的顺序整数。

```sql
-- 按部门内的薪资对员工进行排名
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (
        PARTITION BY department
        ORDER BY salary DESC
    ) AS salary_rank
FROM employees;

-- 结果:
-- name  | department  | salary  | salary_rank
-- ------+-------------+---------+------------
-- Bob   | Engineering | 105000  | 1
-- Alice | Engineering | 95000   | 2
-- Carol | Engineering | 85000   | 3
-- Eve   | Sales       | 82000   | 1
-- David | Sales       | 75000   | 2
-- Frank | Sales       | 71000   | 3
-- Henry | HR          | 68000   | 1
-- Grace | HR          | 65000   | 2
```

### RANK vs DENSE_RANK - 处理并列

这些函数以不同方式处理重复值：

```sql
-- 比较具有并列值的排名函数
SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
    RANK() OVER (ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank_num
FROM employees;

-- 假设 Alice 和 David 的薪资都是 75000:
-- name  | salary | row_num | rank_num | dense_rank_num
-- ------+--------+---------+----------+---------------
-- Bob   | 105000 | 1       | 1        | 1
-- Eve   | 82000  | 2       | 2        | 2
-- Alice | 75000  | 3       | 3        | 3   <- ROW_NUMBER 继续
-- David | 75000  | 4       | 3        | 3   <- RANK 并列, DENSE_RANK 并列
-- Frank | 71000  | 5       | 5        | 4   <- RANK 跳过 4, DENSE_RANK 不跳过
```

**使用场景：**
- `ROW_NUMBER`：分页、去重、唯一标识符
- `RANK`：并列跳过位置的竞赛排名
- `DENSE_RANK`：等级分配、层级分类

### LAG 和 LEAD - 偏移访问

无需自连接即可访问前一行或后一行的数据。

```sql
-- 计算与前一笔交易的销售差异（同比分析）
SELECT
    sale_date,
    employee_id,
    amount,
    LAG(amount, 1, 0) OVER (
        PARTITION BY employee_id
        ORDER BY sale_date
    ) AS prev_amount,
    amount - LAG(amount, 1, 0) OVER (
        PARTITION BY employee_id
        ORDER BY sale_date
    ) AS difference
FROM sales;

-- LAG(column, offset, default_value)
-- offset: 向后查看的行数（默认 1）
-- default_value: 没有前一行时的值

-- LEAD 类似但向前查看
SELECT
    sale_date,
    amount,
    LEAD(amount, 1) OVER (ORDER BY sale_date) AS next_amount
FROM sales;
```

### NTILE - 分桶分布

将行划分为指定数量的大致相等的组。

```sql
-- 将员工划分为薪资四分位数
SELECT
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;

-- 结果:
-- name  | salary  | salary_quartile
-- ------+---------+----------------
-- Bob   | 105000  | 1  (前 25%)
-- Alice | 95000   | 1
-- Carol | 85000   | 2  (25%-50%)
-- Eve   | 82000   | 2
-- David | 75000   | 3  (50%-75%)
-- Frank | 71000   | 3
-- Henry | 68000   | 4  (后 25%)
-- Grace | 65000   | 4
```

### 聚合窗口函数

```sql
-- 累计总和和移动平均
SELECT
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date) AS running_total,
    AVG(amount) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3
FROM sales;

-- 部门薪资百分比
SELECT
    name,
    department,
    salary,
    ROUND(
        salary * 100.0 / SUM(salary) OVER (PARTITION BY department),
        2
    ) AS dept_salary_pct
FROM employees;
```

---

## CTEs（公共表表达式）

### 基本 CTE 语法

CTEs 创建命名的临时结果集，仅在单个查询期间存在。

```sql
WITH cte_name AS (
    SELECT column1, column2
    FROM table_name
    WHERE condition
)
SELECT * FROM cte_name;
```

### 相对于子查询的优势

1. **可读性**：将复杂查询分解为逻辑命名的步骤
2. **可重用性**：在一个查询中多次引用同一个 CTE
3. **递归**：启用层次数据的自引用查询

### 多级 CTE 组合

```sql
-- 复杂业务分析：带排名和趋势的销售业绩
WITH
-- 步骤 1：计算每个员工的月度总额
monthly_sales AS (
    SELECT
        employee_id,
        DATE_TRUNC('month', sale_date) AS month,
        SUM(amount) AS total_amount
    FROM sales
    GROUP BY employee_id, DATE_TRUNC('month', sale_date)
),
-- 步骤 2：添加排名
ranked_sales AS (
    SELECT
        *,
        RANK() OVER (PARTITION BY month ORDER BY total_amount DESC) AS monthly_rank
    FROM monthly_sales
),
-- 步骤 3：计算环比增长
sales_with_growth AS (
    SELECT
        *,
        LAG(total_amount) OVER (PARTITION BY employee_id ORDER BY month) AS prev_amount,
        ROUND(
            (total_amount - LAG(total_amount) OVER (PARTITION BY employee_id ORDER BY month))
            / NULLIF(LAG(total_amount) OVER (PARTITION BY employee_id ORDER BY month), 0) * 100,
            2
        ) AS growth_rate
    FROM ranked_sales
)
SELECT
    e.name,
    s.month,
    s.total_amount,
    s.monthly_rank,
    s.growth_rate
FROM sales_with_growth s
JOIN employees e ON s.employee_id = e.id
ORDER BY s.month, s.monthly_rank;
```

---

## 递归查询

### 递归 CTE 结构

递归 CTE 由两部分组成：
1. **锚成员**：初始查询（基本情况）
2. **递归成员**：引用 CTE 本身

```sql
-- 组织层次表
CREATE TABLE org_structure (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    manager_id INT,
    title VARCHAR(50)
);

INSERT INTO org_structure VALUES
(1, 'Sarah CEO', NULL, 'CEO'),
(2, 'Mike VP', 1, 'VP Engineering'),
(3, 'Lisa Manager', 2, 'Engineering Manager'),
(4, 'Tom Lead', 3, 'Team Lead'),
(5, 'John Developer', 4, 'Senior Developer'),
(6, 'Anna Manager', 2, 'Product Manager'),
(7, 'Chris Lead', 6, 'Product Lead');

-- 递归查询：构建完整的组织层次
WITH RECURSIVE org_hierarchy AS (
    -- 锚：找到顶级（无经理）
    SELECT
        id,
        name,
        manager_id,
        title,
        1 AS level,
        CAST(name AS VARCHAR(500)) AS path
    FROM org_structure
    WHERE manager_id IS NULL

    UNION ALL

    -- 递归：连接下属
    SELECT
        o.id,
        o.name,
        o.manager_id,
        o.title,
        h.level + 1,
        CONCAT(h.path, ' -> ', o.name)
    FROM org_structure o
    INNER JOIN org_hierarchy h ON o.manager_id = h.id
)
SELECT * FROM org_hierarchy ORDER BY level, id;

-- 结果:
-- id | name           | level | path
-- ---+----------------+-------+----------------------------------------
-- 1  | Sarah CEO      | 1     | Sarah CEO
-- 2  | Mike VP        | 2     | Sarah CEO -> Mike VP
-- 3  | Lisa Manager   | 3     | Sarah CEO -> Mike VP -> Lisa Manager
-- 6  | Anna Manager   | 3     | Sarah CEO -> Mike VP -> Anna Manager
-- 4  | Tom Lead       | 4     | Sarah CEO -> Mike VP -> Lisa Manager -> Tom Lead
-- ...
```

### 防止无限循环

始终在递归 CTE 中包含终止条件：

```sql
-- 带深度限制的安全递归
WITH RECURSIVE org_tree AS (
    SELECT id, name, 1 AS depth
    FROM org_structure
    WHERE manager_id IS NULL

    UNION ALL

    SELECT o.id, o.name, t.depth + 1
    FROM org_structure o
    JOIN org_tree t ON o.manager_id = t.id
    WHERE t.depth < 10  -- 安全限制防止无限循环
)
SELECT * FROM org_tree;
```

---

## 透视和逆透视操作

### 手动行列转换

```sql
-- 按员工的月度销售（行转列）
SELECT
    employee_id,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 1 THEN amount ELSE 0 END) AS jan_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 2 THEN amount ELSE 0 END) AS feb_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 3 THEN amount ELSE 0 END) AS mar_sales,
    SUM(CASE WHEN EXTRACT(MONTH FROM sale_date) = 4 THEN amount ELSE 0 END) AS apr_sales
FROM sales
WHERE EXTRACT(YEAR FROM sale_date) = 2024
GROUP BY employee_id;
```

### SQL Server PIVOT 语法

```sql
-- SQL Server 原生 PIVOT
SELECT *
FROM (
    SELECT employee_id, MONTH(sale_date) AS sale_month, amount
    FROM sales
) AS source_table
PIVOT (
    SUM(amount)
    FOR sale_month IN ([1], [2], [3], [4], [5], [6])
) AS pivot_table;
```

### PostgreSQL crosstab

```sql
-- 使用 tablefunc 扩展
CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT *
FROM crosstab(
    'SELECT employee_id,
            EXTRACT(MONTH FROM sale_date)::text,
            SUM(amount)
     FROM sales
     GROUP BY employee_id, EXTRACT(MONTH FROM sale_date)
     ORDER BY 1, 2',
    'SELECT generate_series(1, 12)::text'
) AS ct(
    employee_id INT,
    m1 NUMERIC, m2 NUMERIC, m3 NUMERIC, m4 NUMERIC,
    m5 NUMERIC, m6 NUMERIC, m7 NUMERIC, m8 NUMERIC,
    m9 NUMERIC, m10 NUMERIC, m11 NUMERIC, m12 NUMERIC
);
```

### UNPIVOT：列转行

```sql
-- SQL Server UNPIVOT
SELECT employee_id, month_name, sales_amount
FROM (
    SELECT employee_id, jan_sales, feb_sales, mar_sales
    FROM monthly_summary
) AS source
UNPIVOT (
    sales_amount FOR month_name IN (jan_sales, feb_sales, mar_sales)
) AS unpivoted;

-- 使用 UNION ALL 的标准 SQL 方法
SELECT employee_id, 'January' AS month, jan_sales AS amount FROM monthly_summary
UNION ALL
SELECT employee_id, 'February', feb_sales FROM monthly_summary
UNION ALL
SELECT employee_id, 'March', mar_sales FROM monthly_summary;
```

---

## 查询优化

### 理解执行计划

```sql
-- PostgreSQL
EXPLAIN ANALYZE
SELECT e.name, s.amount
FROM employees e
JOIN sales s ON e.id = s.employee_id
WHERE s.amount > 5000;

-- MySQL
EXPLAIN FORMAT=JSON
SELECT e.name, s.amount
FROM employees e
JOIN sales s ON e.id = s.employee_id
WHERE s.amount > 5000;

-- SQL Server
SET STATISTICS IO ON;
SET STATISTICS TIME ON;
-- 然后运行你的查询
```

### 关键执行计划指标

| 指标 | 描述 | 优化目标 |
|------|------|---------|
| Seq Scan / Table Scan | 全表扫描 | 考虑添加索引 |
| Index Scan | 使用索引查找行 | 通常良好 |
| Index Only Scan | 数据完全从索引检索 | 覆盖查询的最优选择 |
| Nested Loop | 遍历组合 | 确保小表驱动 |
| Hash Join | 构建哈希表进行匹配 | 适合大表 |
| Merge Join | 合并排序的输入 | 适合预排序数据 |
| Sort | 排序操作 | 考虑索引避免 |
| Rows | 估计行数 | 检查统计信息准确性 |
| Cost | 相对执行成本 | 越低越好 |

---

## 执行计划深入分析

### 阅读 PostgreSQL EXPLAIN 输出

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.name, COUNT(s.id) as sale_count
FROM employees e
LEFT JOIN sales s ON e.id = s.employee_id
GROUP BY e.id, e.name;

-- 示例输出解释:
-- HashAggregate  (cost=45.50..47.50 rows=8 width=40) (actual time=0.089..0.091 rows=8 loops=1)
--   Group Key: e.id, e.name
--   Buffers: shared hit=3
--   ->  Hash Left Join  (cost=1.18..45.38 rows=8 width=36) (actual time=0.048..0.073 rows=8 loops=1)
--         Hash Cond: (e.id = s.employee_id)
--         Buffers: shared hit=3
--         ->  Seq Scan on employees e  (cost=0.00..1.08 rows=8 width=36) (actual time=0.008..0.010 rows=8 loops=1)
--         ->  Hash  (cost=1.08..1.08 rows=8 width=8) (actual time=0.018..0.018 rows=8 loops=1)
```

需要关注的关键指标：
- **actual time**：实际执行时间 vs 估计
- **rows**：实际行数 vs 估计（大差异表明统计信息过时）
- **Buffers**：内存和磁盘 I/O 模式
- **loops**：迭代次数（嵌套循环中的高值令人担忧）

---

## 索引策略

### 索引类型和使用场景

```sql
-- B-tree 索引（默认，最常见）
CREATE INDEX idx_employees_department ON employees(department);

-- 多列查询的复合索引
CREATE INDEX idx_sales_emp_date ON sales(employee_id, sale_date);

-- 覆盖索引（包含所有需要的列）
CREATE INDEX idx_emp_dept_salary ON employees(department) INCLUDE (name, salary);

-- 部分索引（带过滤）
CREATE INDEX idx_high_value_sales ON sales(amount) WHERE amount > 10000;

-- 表达式索引
CREATE INDEX idx_emp_name_lower ON employees(LOWER(name));

-- 哈希索引（仅等值查询，PostgreSQL）
CREATE INDEX idx_emp_id_hash ON employees USING HASH (id);
```

### 索引选择指南

```sql
-- 适合索引的候选列：
-- 1. WHERE 子句中的列
-- 2. JOIN 条件中的列
-- 3. ORDER BY 中的列
-- 4. 高选择性的列（很多唯一值）

-- 避免索引：
-- 1. 小表（全表扫描通常更快）
-- 2. 低选择性的列（很少唯一值如布尔值）
-- 3. 频繁更新的列（索引维护开销）
-- 4. 宽列（大文本字段）

-- 检查索引使用情况（PostgreSQL）
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 复合索引列顺序

```sql
-- 列顺序很重要！最左前缀至关重要。
CREATE INDEX idx_sales_composite ON sales(employee_id, sale_date, amount);

-- 此索引支持：
WHERE employee_id = 1                           -- 是（使用索引）
WHERE employee_id = 1 AND sale_date > '2024-01-01'  -- 是（使用索引）
WHERE employee_id = 1 AND sale_date > '2024-01-01' AND amount > 1000  -- 是（完整索引）

-- 此索引不高效支持：
WHERE sale_date > '2024-01-01'                  -- 否（跳过第一列）
WHERE amount > 1000                             -- 否（跳过前两列）
WHERE sale_date > '2024-01-01' AND amount > 1000  -- 否（跳过第一列）
```

---

## 高级连接

### 自连接

```sql
-- 找出薪资高于其经理的员工
SELECT
    e.name AS employee_name,
    e.salary AS employee_salary,
    m.name AS manager_name,
    m.salary AS manager_salary
FROM employees e
JOIN org_structure os ON e.id = os.id
JOIN org_structure om ON os.manager_id = om.id
JOIN employees m ON om.id = m.id
WHERE e.salary > m.salary;
```

### LATERAL 连接（逐行关联）

```sql
-- 获取每个部门薪资最高的前 2 名员工
SELECT
    d.department,
    t.name,
    t.salary
FROM (SELECT DISTINCT department FROM employees) d
CROSS JOIN LATERAL (
    SELECT name, salary
    FROM employees e
    WHERE e.department = d.department
    ORDER BY salary DESC
    LIMIT 2
) t;
```

### 反连接模式

```sql
-- 找出没有销售记录的销售人员

-- 方法 1：NOT EXISTS（通常最高效）
SELECT e.*
FROM employees e
WHERE e.department = 'Sales'
  AND NOT EXISTS (
      SELECT 1 FROM sales s WHERE s.employee_id = e.id
  );

-- 方法 2：LEFT JOIN + IS NULL（通常性能相当）
SELECT e.*
FROM employees e
LEFT JOIN sales s ON e.id = s.employee_id
WHERE e.department = 'Sales'
  AND s.id IS NULL;

-- 方法 3：NOT IN（子查询中有 NULL 时避免使用）
SELECT e.*
FROM employees e
WHERE e.department = 'Sales'
  AND e.id NOT IN (SELECT employee_id FROM sales WHERE employee_id IS NOT NULL);
```

### 半连接模式

```sql
-- 找出至少有一笔超过 5000 的销售的员工

-- 方法 1：EXISTS（在第一个匹配时停止）
SELECT e.*
FROM employees e
WHERE EXISTS (
    SELECT 1 FROM sales s
    WHERE s.employee_id = e.id AND s.amount > 5000
);

-- 方法 2：IN
SELECT e.*
FROM employees e
WHERE e.id IN (
    SELECT employee_id FROM sales WHERE amount > 5000
);

-- 方法 3：DISTINCT + JOIN
SELECT DISTINCT e.*
FROM employees e
JOIN sales s ON e.id = s.employee_id
WHERE s.amount > 5000;
```

---

## 优化技术

### 子查询转 JOIN

```sql
-- 低效：相关子查询（每行执行）
SELECT
    e.name,
    e.salary,
    (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e.department) AS dept_avg
FROM employees e;

-- 更好：派生表 JOIN
SELECT
    e.name,
    e.salary,
    d.dept_avg
FROM employees e
JOIN (
    SELECT department, AVG(salary) AS dept_avg
    FROM employees
    GROUP BY department
) d ON e.department = d.department;

-- 最佳：窗口函数
SELECT
    name,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```

### 分页优化

```sql
-- 低效：OFFSET 扩展性差
SELECT * FROM employees ORDER BY id LIMIT 10 OFFSET 10000;

-- 高效：键集分页（基于游标）
SELECT * FROM employees
WHERE id > 10000  -- 上一页的最后一个 ID
ORDER BY id
LIMIT 10;

-- 复杂排序使用复合游标
SELECT * FROM employees
WHERE (hire_date, id) > ('2020-01-01', 500)
ORDER BY hire_date, id
LIMIT 10;
```

### 窗口函数优化

```sql
-- 重用窗口定义
SELECT
    name,
    salary,
    ROW_NUMBER() OVER w AS row_num,
    RANK() OVER w AS rank_num,
    SUM(salary) OVER w AS running_sum
FROM employees
WINDOW w AS (ORDER BY salary DESC);

-- 尽可能限制框架大小
-- 低效：默认无界框架
SUM(amount) OVER (ORDER BY sale_date)

-- 高效：显式有界框架
SUM(amount) OVER (ORDER BY sale_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

### 批量操作

```sql
-- 使用批量 INSERT 而不是循环插入
INSERT INTO sales (employee_id, sale_date, amount)
VALUES
    (1, '2024-01-01', 1000),
    (1, '2024-01-02', 2000),
    (1, '2024-01-03', 1500),
    (2, '2024-01-01', 3000);

-- 使用 INSERT ... SELECT 进行数据迁移
INSERT INTO sales_archive
SELECT * FROM sales WHERE sale_date < '2023-01-01';

-- 使用 CASE 批量 UPDATE
UPDATE employees
SET salary = CASE id
    WHEN 1 THEN 100000
    WHEN 2 THEN 110000
    WHEN 3 THEN 90000
    END
WHERE id IN (1, 2, 3);
```

---

## 常见陷阱

### WHERE 子句中的窗口函数

```sql
-- 错误：窗口函数不能在 WHERE 中使用
SELECT * FROM employees
WHERE ROW_NUMBER() OVER (ORDER BY salary DESC) <= 3;

-- 解决方案：使用 CTE 或子查询
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;
```

### NULL 处理

```sql
-- NULL 比较陷阱
SELECT * FROM employees WHERE manager_id = NULL;  -- 返回空！
SELECT * FROM employees WHERE manager_id IS NULL;  -- 正确

-- NOT IN 子查询中的 NULL
SELECT * FROM employees
WHERE id NOT IN (SELECT manager_id FROM org_structure);  -- 如果任何 manager_id 是 NULL 则失败

-- 安全版本
SELECT * FROM employees
WHERE id NOT IN (SELECT manager_id FROM org_structure WHERE manager_id IS NOT NULL);

-- 或使用 NOT EXISTS（NULL 安全）
SELECT * FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM org_structure o WHERE o.manager_id = e.id);
```

### 隐式类型转换

```sql
-- 避免阻止索引使用的隐式转换
-- 不好：字符串与数字比较
SELECT * FROM employees WHERE id = '5';  -- 可能不使用索引

-- 好：显式匹配类型
SELECT * FROM employees WHERE id = 5;

-- 不好：索引列上的函数
SELECT * FROM employees WHERE YEAR(hire_date) = 2020;  -- 无法使用索引

-- 好：范围比较
SELECT * FROM employees
WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01';
```

---

## 面试要点

### 高频面试问题

**问题1：ROW_NUMBER、RANK 和 DENSE_RANK 有什么区别？**

三者都分配排名，但处理并列的方式不同：
- `ROW_NUMBER`：始终是唯一的顺序数字；并列获得任意不同的数字
- `RANK`：并列相同排名，跳过后续排名（1, 1, 3）
- `DENSE_RANK`：并列相同排名，无间隙（1, 1, 2）

**问题2：如何获取每个部门第二高的薪资？**

```sql
WITH ranked AS (
    SELECT
        *,
        DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn = 2;
```

**问题3：CTE vs 临时表 - 何时使用？**

| 方面 | CTE | 临时表 |
|------|-----|--------|
| 存储 | 仅内存，查询范围 | 持久化在 tempdb |
| 范围 | 单个查询 | 整个会话 |
| 索引 | 不支持 | 支持 |
| 最适合 | 查询简化，递归 | 大数据集，多次引用 |

**问题4：如何优化慢查询？**

1. 使用 EXPLAIN ANALYZE 分析执行计划
2. 检查全表扫描；添加适当的索引
3. 优化 JOIN 顺序（小表应该驱动）
4. 避免 SELECT *；只选择需要的列
5. 使用键集分页而不是 OFFSET
6. 验证统计信息是最新的（PostgreSQL 中的 ANALYZE）
7. 考虑查询重写（相关子查询转 JOIN）

**问题5：编写 SQL 计算连续登录天数**

```sql
WITH login_dates AS (
    SELECT DISTINCT user_id, DATE(login_time) AS login_date
    FROM user_logins
),
date_groups AS (
    SELECT
        user_id,
        login_date,
        login_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY login_date))::int AS grp
    FROM login_dates
)
SELECT
    user_id,
    MIN(login_date) AS streak_start,
    MAX(login_date) AS streak_end,
    COUNT(*) AS consecutive_days
FROM date_groups
GROUP BY user_id, grp
ORDER BY user_id, streak_start;
```

**问题6：解释 SQL 执行顺序**

```
1. FROM / JOIN    - 识别表并连接它们
2. WHERE          - 过滤行
3. GROUP BY       - 聚合成组
4. HAVING         - 过滤组
5. SELECT         - 选择列（窗口函数在这里执行）
6. DISTINCT       - 移除重复
7. ORDER BY       - 排序结果
8. LIMIT/OFFSET   - 分页结果
```

---

## 实际场景

### 电商销售分析（帕累托分析）

```sql
-- 找出贡献 80% 收入的产品（80/20 法则）
WITH product_sales AS (
    SELECT
        product_id,
        SUM(quantity * price) AS total_revenue
    FROM order_items
    GROUP BY product_id
),
ranked_products AS (
    SELECT
        product_id,
        total_revenue,
        RANK() OVER (ORDER BY total_revenue DESC) AS revenue_rank,
        ROUND(total_revenue * 100.0 / SUM(total_revenue) OVER (), 2) AS revenue_pct,
        ROUND(SUM(total_revenue) OVER (ORDER BY total_revenue DESC) * 100.0 /
              SUM(total_revenue) OVER (), 2) AS cumulative_pct
    FROM product_sales
)
SELECT * FROM ranked_products
WHERE cumulative_pct <= 80;
```

### 用户留存队列分析

```sql
-- 计算 N 天留存率
WITH first_visit AS (
    SELECT user_id, MIN(DATE(visit_time)) AS first_date
    FROM user_visits
    GROUP BY user_id
),
retention AS (
    SELECT
        fv.first_date AS cohort_date,
        DATE(uv.visit_time) - fv.first_date AS days_since_first,
        COUNT(DISTINCT uv.user_id) AS retained_users
    FROM first_visit fv
    JOIN user_visits uv ON fv.user_id = uv.user_id
    GROUP BY fv.first_date, DATE(uv.visit_time) - fv.first_date
),
cohort_size AS (
    SELECT first_date AS cohort_date, COUNT(*) AS total_users
    FROM first_visit
    GROUP BY first_date
)
SELECT
    r.cohort_date,
    r.days_since_first,
    r.retained_users,
    cs.total_users,
    ROUND(r.retained_users * 100.0 / cs.total_users, 2) AS retention_rate
FROM retention r
JOIN cohort_size cs ON r.cohort_date = cs.cohort_date
WHERE r.days_since_first IN (1, 3, 7, 14, 30)
ORDER BY r.cohort_date, r.days_since_first;
```

### 间隙分析（查找缺失数据）

```sql
-- 查找顺序订单号中的间隙
WITH order_range AS (
    SELECT
        MIN(order_number) AS min_num,
        MAX(order_number) AS max_num
    FROM orders
),
all_numbers AS (
    SELECT generate_series(min_num, max_num) AS expected_number
    FROM order_range
)
SELECT expected_number AS missing_order_number
FROM all_numbers a
LEFT JOIN orders o ON a.expected_number = o.order_number
WHERE o.order_number IS NULL;
```

---

## 延伸阅读

### 官方文档

- [PostgreSQL 窗口函数](https://www.postgresql.org/docs/current/tutorial-window.html) - 全面的窗口函数教程
- [MySQL 窗口函数](https://dev.mysql.com/doc/refman/8.0/en/window-functions.html) - MySQL 8.0 窗口函数参考
- [SQL Server OVER 子句](https://docs.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql) - T-SQL 窗口函数文档

### 推荐书籍

- *SQL Antipatterns* by Bill Karwin - 常见错误及如何避免
- *High Performance MySQL* by Baron Schwartz - MySQL 优化必备
- *SQL Cookbook* by Anthony Molinaro - 复杂查询的实用技巧
- *The Art of SQL* by Stephane Faroult - 查询优化理念

### 在线资源

- [Mode SQL Tutorial](https://mode.com/sql-tutorial/) - 交互式高级 SQL 课程
- [LeetCode Database](https://leetcode.com/problemset/database/) - SQL 练习题
- [SQLZoo](https://sqlzoo.net/) - 交互式 SQL 练习
- [Use The Index, Luke](https://use-the-index-luke.com/) - 全面的索引指南
- [Explain.depesz.com](https://explain.depesz.com/) - PostgreSQL 执行计划可视化器

### 练习平台

- [DB Fiddle](https://www.db-fiddle.com/) - 在线 SQL 执行环境
- [SQLPad](https://sqlpad.io/) - 自托管 SQL 编辑器
- [pgexercises.com](https://pgexercises.com/) - PostgreSQL 专项练习
- [HackerRank SQL](https://www.hackerrank.com/domains/sql) - 按难度分级的 SQL 挑战

---

## 总结

高级 SQL 掌握是数据分析师、后端工程师以及任何使用关系型数据库的人的关键技能。窗口函数能够进行复杂的分析计算，同时保留行级细节。CTEs 提高查询可读性并支持层次数据的递归遍历。理解执行计划和索引策略可确保查询在规模化时高效执行。

SQL 熟练的关键是持续练习。从基础开始，然后逐步处理更复杂的场景。使用执行计划分析来理解数据库如何处理你的查询，并始终考虑查询设计选择的性能影响。

记住这些原则：
- **窗口函数** 在结果集上操作而不折叠行
- **CTEs** 简化复杂查询并支持递归
- **索引** 加速查找但增加写入开销
- **执行计划** 揭示查询的真实成本
- **查询优化** 是迭代的：测量、分析、改进

掌握了这些高级技术，你将能够处理复杂的数据分析挑战，并编写高性能、可维护的 SQL 代码。
