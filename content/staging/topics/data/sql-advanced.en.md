---
title: Advanced SQL Complete Guide
description: Master advanced SQL techniques for complex data queries
track: data
section: sql
difficulty: advanced
tags:
  - SQL
  - Database
  - Queries
  - Analytics
status: imported
origin: old/src/content/docs/data/sql-advanced.en.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: SQL
  order: 1
  lastUpdated: 2026-01-07
---

## Introduction

SQL (Structured Query Language) is the standard language for interacting with relational databases. While basic SELECT, WHERE, and JOIN operations handle many common tasks, real-world data analysis often demands more sophisticated techniques. We'll explore advanced SQL features that enable complex analytics, hierarchical data processing, and optimized query performance.

Advanced SQL techniques address several critical challenges:

1. **Ranking and Analytical Calculations**: Computing rankings, running totals, and percentiles without collapsing rows
2. **Hierarchical Data Processing**: Traversing organizational structures, comment threads, and category trees
3. **Complex Data Transformations**: Pivoting rows to columns and vice versa for reporting needs
4. **Query Performance Optimization**: Transforming minute-long queries into sub-second operations

### Historical Context

Window functions were formally introduced in the SQL:2003 standard, though widespread database support came years later. PostgreSQL 8.4 (2009) was among the first to offer comprehensive support, while MySQL only added window functions in version 8.0 (2018). Common Table Expressions (CTEs) were defined in SQL:1999, with recursive CTEs refined in SQL:2003.

---

## Window Functions

### Understanding Window Functions

The fundamental difference between window functions and aggregate functions lies in how they handle rows: **aggregate functions collapse multiple rows into one, while window functions preserve all original rows and compute values across a defined "window" of related rows**.

```
Original Data:        Aggregate SUM:       Window Function SUM OVER:
+----+-------+       +-------+            +----+-------+---------+
| id | sales |       | total |            | id | sales | running |
+----+-------+       +-------+            +----+-------+---------+
| 1  |  100  |  =>   |  600  |            | 1  |  100  |   100   |
| 2  |  200  |       +-------+            | 2  |  200  |   300   |
| 3  |  300  |                            | 3  |  300  |   600   |
+----+-------+                            +----+-------+---------+
```

Window functions execute **after WHERE, GROUP BY, and HAVING clauses but before ORDER BY**. This means they operate on the filtered and grouped result set.

### Window Function Syntax

```sql
function_name([arguments]) OVER (
    [PARTITION BY partition_columns]
    [ORDER BY sort_columns [ASC|DESC]]
    [ROWS|RANGE BETWEEN frame_start AND frame_end]
)
```

**Key Components:**

| Component | Description | Required |
|-----------|-------------|----------|
| PARTITION BY | Divides data into independent partitions for separate calculations | Optional |
| ORDER BY | Defines the logical order within each partition | Depends on function |
| Window Frame | Specifies which rows relative to current row to include | Optional (has defaults) |

### Window Frame Boundaries

```sql
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW   -- From partition start to current row
ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING           -- One row before and after current
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING   -- From current row to partition end
RANGE BETWEEN INTERVAL '7' DAY PRECEDING AND CURRENT ROW  -- Date-based range
```

### Sample Data Setup

```sql
-- Create employees table
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE
);

-- Insert sample data
INSERT INTO employees VALUES
(1, 'Alice', 'Engineering', 95000, '2020-01-15'),
(2, 'Bob', 'Engineering', 105000, '2019-06-20'),
(3, 'Carol', 'Engineering', 85000, '2021-03-10'),
(4, 'David', 'Sales', 75000, '2020-08-05'),
(5, 'Eve', 'Sales', 82000, '2018-12-01'),
(6, 'Frank', 'Sales', 71000, '2022-01-20'),
(7, 'Grace', 'HR', 65000, '2019-04-15'),
(8, 'Henry', 'HR', 68000, '2020-11-30');

-- Create sales records table
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

### ROW_NUMBER - Sequential Numbering

Assigns a unique sequential integer to each row within a partition.

```sql
-- Rank employees by salary within each department
SELECT
    name,
    department,
    salary,
    ROW_NUMBER() OVER (
        PARTITION BY department
        ORDER BY salary DESC
    ) AS salary_rank
FROM employees;

-- Result:
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

### RANK vs DENSE_RANK - Handling Ties

These functions handle duplicate values differently:

```sql
-- Compare ranking functions with ties
SELECT
    name,
    salary,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num,
    RANK() OVER (ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank_num
FROM employees;

-- Assuming Alice and David both have salary 75000:
-- name  | salary | row_num | rank_num | dense_rank_num
-- ------+--------+---------+----------+---------------
-- Bob   | 105000 | 1       | 1        | 1
-- Eve   | 82000  | 2       | 2        | 2
-- Alice | 75000  | 3       | 3        | 3   <- ROW_NUMBER continues
-- David | 75000  | 4       | 3        | 3   <- RANK ties, DENSE_RANK ties
-- Frank | 71000  | 5       | 5        | 4   <- RANK skips 4, DENSE_RANK doesn't
```

**Use Cases:**
- `ROW_NUMBER`: Pagination, deduplication, unique identifiers
- `RANK`: Competition rankings where ties skip positions
- `DENSE_RANK`: Grade assignments, tier classifications

### LAG and LEAD - Offset Access

Access data from preceding or following rows without self-joins.

```sql
-- Calculate sales difference from previous transaction (period-over-period analysis)
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
-- offset: number of rows to look back (default 1)
-- default_value: value when no previous row exists

-- LEAD works similarly but looks forward
SELECT
    sale_date,
    amount,
    LEAD(amount, 1) OVER (ORDER BY sale_date) AS next_amount
FROM sales;
```

### NTILE - Bucket Distribution

Divides rows into a specified number of roughly equal groups.

```sql
-- Divide employees into salary quartiles
SELECT
    name,
    salary,
    NTILE(4) OVER (ORDER BY salary DESC) AS salary_quartile
FROM employees;

-- Result:
-- name  | salary  | salary_quartile
-- ------+---------+----------------
-- Bob   | 105000  | 1  (Top 25%)
-- Alice | 95000   | 1
-- Carol | 85000   | 2  (25%-50%)
-- Eve   | 82000   | 2
-- David | 75000   | 3  (50%-75%)
-- Frank | 71000   | 3
-- Henry | 68000   | 4  (Bottom 25%)
-- Grace | 65000   | 4
```

### Aggregate Window Functions

```sql
-- Running totals and moving averages
SELECT
    sale_date,
    amount,
    SUM(amount) OVER (ORDER BY sale_date) AS running_total,
    AVG(amount) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3
FROM sales;

-- Department salary percentage
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

## CTEs (Common Table Expressions)

### Basic CTE Syntax

CTEs create named temporary result sets that exist only for the duration of a single query.

```sql
WITH cte_name AS (
    SELECT column1, column2
    FROM table_name
    WHERE condition
)
SELECT * FROM cte_name;
```

### Benefits Over Subqueries

1. **Readability**: Break complex queries into logical, named steps
2. **Reusability**: Reference the same CTE multiple times in one query
3. **Recursion**: Enable self-referential queries for hierarchical data

### Multi-Level CTE Composition

```sql
-- Complex business analysis: sales performance with rankings and trends
WITH
-- Step 1: Calculate monthly totals per employee
monthly_sales AS (
    SELECT
        employee_id,
        DATE_TRUNC('month', sale_date) AS month,
        SUM(amount) AS total_amount
    FROM sales
    GROUP BY employee_id, DATE_TRUNC('month', sale_date)
),
-- Step 2: Add rankings
ranked_sales AS (
    SELECT
        *,
        RANK() OVER (PARTITION BY month ORDER BY total_amount DESC) AS monthly_rank
    FROM monthly_sales
),
-- Step 3: Calculate month-over-month growth
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

## Recursive Queries

### Recursive CTE Structure

Recursive CTEs consist of two parts:
1. **Anchor member**: The initial query (base case)
2. **Recursive member**: References the CTE itself

```sql
-- Organization hierarchy table
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

-- Recursive query: Build complete org hierarchy
WITH RECURSIVE org_hierarchy AS (
    -- Anchor: Find top-level (no manager)
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

    -- Recursive: Join subordinates
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

-- Result:
-- id | name           | level | path
-- ---+----------------+-------+----------------------------------------
-- 1  | Sarah CEO      | 1     | Sarah CEO
-- 2  | Mike VP        | 2     | Sarah CEO -> Mike VP
-- 3  | Lisa Manager   | 3     | Sarah CEO -> Mike VP -> Lisa Manager
-- 6  | Anna Manager   | 3     | Sarah CEO -> Mike VP -> Anna Manager
-- 4  | Tom Lead       | 4     | Sarah CEO -> Mike VP -> Lisa Manager -> Tom Lead
-- ...
```

### Preventing Infinite Loops

Always include termination conditions in recursive CTEs:

```sql
-- Safe recursion with depth limit
WITH RECURSIVE org_tree AS (
    SELECT id, name, 1 AS depth
    FROM org_structure
    WHERE manager_id IS NULL

    UNION ALL

    SELECT o.id, o.name, t.depth + 1
    FROM org_structure o
    JOIN org_tree t ON o.manager_id = t.id
    WHERE t.depth < 10  -- Safety limit prevents infinite loops
)
SELECT * FROM org_tree;
```

---

## Pivot and Unpivot Operations

### Manual Row-to-Column Transformation

```sql
-- Monthly sales by employee (rows to columns)
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

### SQL Server PIVOT Syntax

```sql
-- SQL Server native PIVOT
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
-- Using tablefunc extension
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

### UNPIVOT: Columns to Rows

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

-- Standard SQL approach using UNION ALL
SELECT employee_id, 'January' AS month, jan_sales AS amount FROM monthly_summary
UNION ALL
SELECT employee_id, 'February', feb_sales FROM monthly_summary
UNION ALL
SELECT employee_id, 'March', mar_sales FROM monthly_summary;
```

---

## Query Optimization

### Understanding Execution Plans

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
-- Then run your query
```

### Key Execution Plan Metrics

| Metric | Description | Optimization Goal |
|--------|-------------|-------------------|
| Seq Scan / Table Scan | Full table scan | Consider adding indexes |
| Index Scan | Uses index to find rows | Generally good |
| Index Only Scan | Data retrieved entirely from index | Optimal for covered queries |
| Nested Loop | Iterates through combinations | Ensure small table drives |
| Hash Join | Builds hash table for matching | Good for large tables |
| Merge Join | Merges sorted inputs | Efficient for pre-sorted data |
| Sort | Sorting operation | Consider index to avoid |
| Rows | Estimated row count | Check statistics accuracy |
| Cost | Relative execution cost | Lower is better |

---

## Execution Plans Deep Dive

### Reading PostgreSQL EXPLAIN Output

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.name, COUNT(s.id) as sale_count
FROM employees e
LEFT JOIN sales s ON e.id = s.employee_id
GROUP BY e.id, e.name;

-- Sample output interpretation:
-- HashAggregate  (cost=45.50..47.50 rows=8 width=40) (actual time=0.089..0.091 rows=8 loops=1)
--   Group Key: e.id, e.name
--   Buffers: shared hit=3
--   ->  Hash Left Join  (cost=1.18..45.38 rows=8 width=36) (actual time=0.048..0.073 rows=8 loops=1)
--         Hash Cond: (e.id = s.employee_id)
--         Buffers: shared hit=3
--         ->  Seq Scan on employees e  (cost=0.00..1.08 rows=8 width=36) (actual time=0.008..0.010 rows=8 loops=1)
--         ->  Hash  (cost=1.08..1.08 rows=8 width=8) (actual time=0.018..0.018 rows=8 loops=1)
```

Key indicators to watch:
- **actual time**: Real execution time vs estimated
- **rows**: Actual rows vs estimated (large discrepancies suggest stale statistics)
- **Buffers**: Memory and disk I/O patterns
- **loops**: Number of iterations (high values in nested loops are concerning)

---

## Index Strategies

### Index Types and Use Cases

```sql
-- B-tree index (default, most common)
CREATE INDEX idx_employees_department ON employees(department);

-- Composite index for multi-column queries
CREATE INDEX idx_sales_emp_date ON sales(employee_id, sale_date);

-- Covering index (includes all needed columns)
CREATE INDEX idx_emp_dept_salary ON employees(department) INCLUDE (name, salary);

-- Partial index (filtered)
CREATE INDEX idx_high_value_sales ON sales(amount) WHERE amount > 10000;

-- Expression index
CREATE INDEX idx_emp_name_lower ON employees(LOWER(name));

-- Hash index (equality only, PostgreSQL)
CREATE INDEX idx_emp_id_hash ON employees USING HASH (id);
```

### Index Selection Guidelines

```sql
-- Good candidates for indexing:
-- 1. Columns in WHERE clauses
-- 2. Columns in JOIN conditions
-- 3. Columns in ORDER BY
-- 4. Columns with high selectivity (many unique values)

-- Avoid indexing:
-- 1. Small tables (full scan is often faster)
-- 2. Columns with low selectivity (few unique values like boolean)
-- 3. Frequently updated columns (index maintenance overhead)
-- 4. Wide columns (large text fields)

-- Check index usage (PostgreSQL)
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

### Composite Index Column Order

```sql
-- Column order matters! Leftmost prefix is crucial.
CREATE INDEX idx_sales_composite ON sales(employee_id, sale_date, amount);

-- This index supports:
WHERE employee_id = 1                           -- Yes (uses index)
WHERE employee_id = 1 AND sale_date > '2024-01-01'  -- Yes (uses index)
WHERE employee_id = 1 AND sale_date > '2024-01-01' AND amount > 1000  -- Yes (full index)

-- This index does NOT efficiently support:
WHERE sale_date > '2024-01-01'                  -- No (skips first column)
WHERE amount > 1000                             -- No (skips first two columns)
WHERE sale_date > '2024-01-01' AND amount > 1000  -- No (skips first column)
```

---

## Advanced Joins

### Self Join

```sql
-- Find employees earning more than their manager
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

### LATERAL Join (Row-by-Row Correlation)

```sql
-- Get top 2 highest paid employees per department
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

### Anti Join Patterns

```sql
-- Find salespeople with no sales records

-- Method 1: NOT EXISTS (often most efficient)
SELECT e.*
FROM employees e
WHERE e.department = 'Sales'
  AND NOT EXISTS (
      SELECT 1 FROM sales s WHERE s.employee_id = e.id
  );

-- Method 2: LEFT JOIN + IS NULL (usually comparable performance)
SELECT e.*
FROM employees e
LEFT JOIN sales s ON e.id = s.employee_id
WHERE e.department = 'Sales'
  AND s.id IS NULL;

-- Method 3: NOT IN (avoid with NULLs in subquery)
SELECT e.*
FROM employees e
WHERE e.department = 'Sales'
  AND e.id NOT IN (SELECT employee_id FROM sales WHERE employee_id IS NOT NULL);
```

### Semi Join Patterns

```sql
-- Find employees who have made at least one sale over 5000

-- Method 1: EXISTS (stops at first match)
SELECT e.*
FROM employees e
WHERE EXISTS (
    SELECT 1 FROM sales s
    WHERE s.employee_id = e.id AND s.amount > 5000
);

-- Method 2: IN
SELECT e.*
FROM employees e
WHERE e.id IN (
    SELECT employee_id FROM sales WHERE amount > 5000
);

-- Method 3: DISTINCT with JOIN
SELECT DISTINCT e.*
FROM employees e
JOIN sales s ON e.id = s.employee_id
WHERE s.amount > 5000;
```

---

## Optimization Techniques

### Subquery to JOIN Conversion

```sql
-- Inefficient: Correlated subquery (executes per row)
SELECT
    e.name,
    e.salary,
    (SELECT AVG(salary) FROM employees e2 WHERE e2.department = e.department) AS dept_avg
FROM employees e;

-- Better: Derived table JOIN
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

-- Best: Window function
SELECT
    name,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```

### Pagination Optimization

```sql
-- Inefficient: OFFSET scales poorly
SELECT * FROM employees ORDER BY id LIMIT 10 OFFSET 10000;

-- Efficient: Keyset pagination (cursor-based)
SELECT * FROM employees
WHERE id > 10000  -- Last ID from previous page
ORDER BY id
LIMIT 10;

-- For complex sorting, use composite cursor
SELECT * FROM employees
WHERE (hire_date, id) > ('2020-01-01', 500)
ORDER BY hire_date, id
LIMIT 10;
```

### Window Function Optimization

```sql
-- Reuse window definitions
SELECT
    name,
    salary,
    ROW_NUMBER() OVER w AS row_num,
    RANK() OVER w AS rank_num,
    SUM(salary) OVER w AS running_sum
FROM employees
WINDOW w AS (ORDER BY salary DESC);

-- Limit frame size when possible
-- Inefficient: Default unbounded frame
SUM(amount) OVER (ORDER BY sale_date)

-- Efficient: Explicit bounded frame
SUM(amount) OVER (ORDER BY sale_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
```

### Batch Operations

```sql
-- Instead of loop inserts, use batch INSERT
INSERT INTO sales (employee_id, sale_date, amount)
VALUES
    (1, '2024-01-01', 1000),
    (1, '2024-01-02', 2000),
    (1, '2024-01-03', 1500),
    (2, '2024-01-01', 3000);

-- Use INSERT ... SELECT for data migration
INSERT INTO sales_archive
SELECT * FROM sales WHERE sale_date < '2023-01-01';

-- Batch UPDATE with CASE
UPDATE employees
SET salary = CASE id
    WHEN 1 THEN 100000
    WHEN 2 THEN 110000
    WHEN 3 THEN 90000
    END
WHERE id IN (1, 2, 3);
```

---

## Common Pitfalls

### Window Functions in WHERE Clause

```sql
-- Error: Window functions cannot be in WHERE
SELECT * FROM employees
WHERE ROW_NUMBER() OVER (ORDER BY salary DESC) <= 3;

-- Solution: Use CTE or subquery
WITH ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn <= 3;
```

### NULL Handling

```sql
-- NULL comparison pitfalls
SELECT * FROM employees WHERE manager_id = NULL;  -- Returns nothing!
SELECT * FROM employees WHERE manager_id IS NULL;  -- Correct

-- NULL in NOT IN subquery
SELECT * FROM employees
WHERE id NOT IN (SELECT manager_id FROM org_structure);  -- Fails if any manager_id is NULL

-- Safe version
SELECT * FROM employees
WHERE id NOT IN (SELECT manager_id FROM org_structure WHERE manager_id IS NOT NULL);

-- Or use NOT EXISTS (NULL-safe)
SELECT * FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM org_structure o WHERE o.manager_id = e.id);
```

### Implicit Type Conversions

```sql
-- Avoid implicit conversions that prevent index usage
-- Bad: String compared to number
SELECT * FROM employees WHERE id = '5';  -- May not use index

-- Good: Match types explicitly
SELECT * FROM employees WHERE id = 5;

-- Bad: Function on indexed column
SELECT * FROM employees WHERE YEAR(hire_date) = 2020;  -- Cannot use index

-- Good: Range comparison
SELECT * FROM employees
WHERE hire_date >= '2020-01-01' AND hire_date < '2021-01-01';
```

---

## Interview Key Points

### High-Frequency Interview Questions

**Q1: What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?**

All three assign rankings, but handle ties differently:
- `ROW_NUMBER`: Always unique sequential numbers; ties get arbitrary different numbers
- `RANK`: Same rank for ties, skips subsequent ranks (1, 1, 3)
- `DENSE_RANK`: Same rank for ties, no gaps (1, 1, 2)

**Q2: How do you get the second highest salary per department?**

```sql
WITH ranked AS (
    SELECT
        *,
        DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rn
    FROM employees
)
SELECT * FROM ranked WHERE rn = 2;
```

**Q3: CTE vs Temporary Table - when to use each?**

| Aspect | CTE | Temporary Table |
|--------|-----|-----------------|
| Storage | Memory only, query-scoped | Persisted in tempdb |
| Scope | Single query | Entire session |
| Indexing | Not supported | Supported |
| Best for | Query simplification, recursion | Large datasets, multiple references |

**Q4: How do you optimize a slow query?**

1. Analyze execution plan with EXPLAIN ANALYZE
2. Check for full table scans; add appropriate indexes
3. Optimize JOIN order (small table should drive)
4. Avoid SELECT *; select only needed columns
5. Use keyset pagination instead of OFFSET
6. Verify statistics are current (ANALYZE in PostgreSQL)
7. Consider query rewriting (correlated subquery to JOIN)

**Q5: Write SQL to calculate consecutive login days**

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

**Q6: Explain the SQL execution order**

```
1. FROM / JOIN    - Identify tables and join them
2. WHERE          - Filter rows
3. GROUP BY       - Aggregate into groups
4. HAVING         - Filter groups
5. SELECT         - Choose columns (window functions execute here)
6. DISTINCT       - Remove duplicates
7. ORDER BY       - Sort results
8. LIMIT/OFFSET   - Paginate results
```

---

## Real-World Scenarios

### E-commerce Sales Analysis (Pareto Analysis)

```sql
-- Find products contributing to 80% of revenue (80/20 rule)
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

### User Retention Cohort Analysis

```sql
-- Calculate N-day retention rates
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

### Gap Analysis (Finding Missing Data)

```sql
-- Find gaps in sequential order numbers
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

## Further Reading

### Official Documentation

- [PostgreSQL Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html) - Comprehensive window function tutorial
- [MySQL Window Functions](https://dev.mysql.com/doc/refman/8.0/en/window-functions.html) - MySQL 8.0 window function reference
- [SQL Server OVER Clause](https://docs.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql) - T-SQL window function documentation

### Recommended Books

- *SQL Antipatterns* by Bill Karwin - Common mistakes and how to avoid them
- *High Performance MySQL* by Baron Schwartz - Essential for MySQL optimization
- *SQL Cookbook* by Anthony Molinaro - Practical recipes for complex queries
- *The Art of SQL* by Stephane Faroult - Query optimization philosophy

### Online Resources

- [Mode SQL Tutorial](https://mode.com/sql-tutorial/) - Interactive advanced SQL lessons
- [LeetCode Database](https://leetcode.com/problemset/database/) - SQL practice problems
- [SQLZoo](https://sqlzoo.net/) - Interactive SQL exercises
- [Use The Index, Luke](https://use-the-index-luke.com/) - Comprehensive indexing guide
- [Explain.depesz.com](https://explain.depesz.com/) - PostgreSQL execution plan visualizer

### Practice Platforms

- [DB Fiddle](https://www.db-fiddle.com/) - Online SQL execution environment
- [SQLPad](https://sqlpad.io/) - Self-hosted SQL editor
- [pgexercises.com](https://pgexercises.com/) - PostgreSQL-specific exercises
- [HackerRank SQL](https://www.hackerrank.com/domains/sql) - SQL challenges by difficulty

---

## Summary

Advanced SQL mastery is a critical skill for data analysts, backend engineers, and anyone working with relational databases. Window functions enable sophisticated analytical calculations while preserving row-level detail. CTEs improve query readability and enable recursive traversal of hierarchical data. Understanding execution plans and indexing strategies ensures your queries perform efficiently at scale.

The key to SQL proficiency is continuous practice. Start with the fundamentals, then progressively tackle more complex scenarios. Use execution plan analysis to understand how the database processes your queries, and always consider the performance implications of your query design choices.

Remember these principles:
- **Window functions** operate on result sets without collapsing rows
- **CTEs** simplify complex queries and enable recursion
- **Indexes** accelerate lookups but add write overhead
- **Execution plans** reveal the true cost of your queries
- **Query optimization** is iterative: measure, analyze, improve

With these advanced techniques in your toolkit, you will be well-equipped to handle complex data analysis challenges and write performant, maintainable SQL code.
