---
title: Pandas Complete Guide
description: Master Pandas for data manipulation and analysis in Python
track: datascience
section: python-stack
difficulty: intermediate
tags:
  - Pandas
  - Python
  - Data Analysis
  - DataFrame
status: imported
origin: old/src/content/docs/data/pandas-guide.en.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: Python
  order: 2
  lastUpdated: 2026-01-07
---

Pandas is one of the most essential libraries in the Python data science ecosystem, providing high-performance, easy-to-use data structures and data analysis tools. Whether you're a data scientist, analyst, or backend developer, mastering Pandas is a fundamental skill for working with structured data.

## Core Concepts

### What is Pandas?

The name "Pandas" derives from "Panel Data" and "Python Data Analysis." Built on top of NumPy, Pandas provides two primary data structures: **Series** (one-dimensional) and **DataFrame** (two-dimensional), making data manipulation intuitive and efficient.

### Why Choose Pandas?

1. **Powerful data manipulation**: Supports data cleaning, transformation, merging, and reshaping operations
2. **Flexible indexing**: Supports both label-based and position-based indexing
3. **Efficient I/O operations**: Can read and write CSV, Excel, SQL, JSON, Parquet, and many other formats
4. **Time series support**: Built-in robust datetime handling capabilities
5. **Seamless integration**: Works perfectly with NumPy, Matplotlib, Scikit-learn, and other libraries

```python
import pandas as pd
import numpy as np

# Check Pandas version
print(pd.__version__)
```

---

## DataFrame and Series

### Series: One-Dimensional Labeled Array

A Series is a one-dimensional labeled array capable of holding any data type.

```python
# Creating a Series
s = pd.Series([1, 3, 5, 7, 9])
print(s)

# Series with custom index
s = pd.Series([1, 3, 5, 7, 9], index=['a', 'b', 'c', 'd', 'e'])
print(s)

# Creating Series from a dictionary
data = {'New York': 8336, 'Los Angeles': 3979, 'Chicago': 2693, 'Houston': 2320}
population = pd.Series(data, name='Population (thousands)')
print(population)

# Series basic attributes
print(f"Index: {s.index}")
print(f"Values: {s.values}")
print(f"Data type: {s.dtype}")
print(f"Shape: {s.shape}")
```

### DataFrame: Two-Dimensional Table Structure

DataFrame is the most commonly used Pandas data structure, similar to a spreadsheet or SQL table.

```python
# Creating DataFrame from a dictionary
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'Age': [25, 30, 35, 28],
    'City': ['New York', 'Los Angeles', 'Chicago', 'Houston'],
    'Salary': [75000, 85000, 90000, 82000]
}
df = pd.DataFrame(data)
print(df)

# Creating DataFrame from a list of lists
data = [
    ['Alice', 25, 'New York'],
    ['Bob', 30, 'Los Angeles'],
    ['Charlie', 35, 'Chicago']
]
df = pd.DataFrame(data, columns=['Name', 'Age', 'City'])
print(df)

# DataFrame basic attributes and methods
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print(f"Index: {df.index.tolist()}")
print(f"Data types:\n{df.dtypes}")

# Data overview methods
print(df.head())       # First 5 rows
print(df.tail(3))      # Last 3 rows
print(df.info())       # Data information
print(df.describe())   # Statistical summary
```

### Key Differences Between Series and DataFrame

| Feature | Series | DataFrame |
|---------|--------|-----------|
| Dimensions | 1D | 2D |
| Structure | Single column with index | Multiple columns with index |
| Creation | From list, dict, scalar | From dict, list of dicts, 2D array |
| Access | Single index/label | Row and column indexing |

---

## Data Loading

Pandas provides extensive I/O capabilities for reading and writing data in various formats.

### Reading CSV Files

```python
# Basic CSV reading
df = pd.read_csv('data.csv')

# With specific options
df = pd.read_csv(
    'data.csv',
    sep=',',                    # Delimiter
    header=0,                   # Row number for column names
    index_col='id',             # Column to use as index
    usecols=['name', 'age'],    # Columns to read
    dtype={'age': int},         # Data types
    na_values=['N/A', 'NULL'],  # Values to treat as NaN
    parse_dates=['date'],       # Columns to parse as dates
    encoding='utf-8',           # File encoding
    nrows=1000                  # Number of rows to read
)

# Reading large files in chunks
chunks = pd.read_csv('large_file.csv', chunksize=10000)
for chunk in chunks:
    # Process each chunk
    process(chunk)
```

### Reading Excel Files

```python
# Basic Excel reading
df = pd.read_excel('data.xlsx')

# With specific options
df = pd.read_excel(
    'data.xlsx',
    sheet_name='Sheet1',        # Sheet name or index
    header=0,                   # Row for column names
    usecols='A:D',              # Columns to read
    skiprows=2,                 # Rows to skip
    engine='openpyxl'           # Engine for .xlsx files
)

# Reading multiple sheets
all_sheets = pd.read_excel('data.xlsx', sheet_name=None)
for sheet_name, df in all_sheets.items():
    print(f"Sheet: {sheet_name}, Shape: {df.shape}")
```

### Reading from Databases

```python
import sqlite3
from sqlalchemy import create_engine

# Using SQLite
conn = sqlite3.connect('database.db')
df = pd.read_sql('SELECT * FROM users', conn)
conn.close()

# Using SQLAlchemy (recommended)
engine = create_engine('postgresql://user:password@localhost/dbname')
df = pd.read_sql('SELECT * FROM users WHERE active = true', engine)

# Reading entire table
df = pd.read_sql_table('users', engine)

# Parameterized queries (safe from SQL injection)
df = pd.read_sql(
    'SELECT * FROM users WHERE city = %(city)s',
    engine,
    params={'city': 'New York'}
)
```

### Reading JSON and Other Formats

```python
# JSON
df = pd.read_json('data.json')
df = pd.read_json('data.json', orient='records', lines=True)

# Parquet (efficient columnar format)
df = pd.read_parquet('data.parquet')

# HTML tables
tables = pd.read_html('https://example.com/page.html')
df = tables[0]  # First table on the page

# Clipboard
df = pd.read_clipboard()
```

### Writing Data

```python
# CSV
df.to_csv('output.csv', index=False)

# Excel
df.to_excel('output.xlsx', sheet_name='Data', index=False)

# JSON
df.to_json('output.json', orient='records', indent=2)

# Parquet
df.to_parquet('output.parquet', compression='snappy')

# SQL
df.to_sql('table_name', engine, if_exists='replace', index=False)
```

---

## Selection and Filtering

### Column Selection

```python
# Single column selection (returns Series)
ages = df['Age']

# Multiple column selection (returns DataFrame)
subset = df[['Name', 'Age']]

# Using .loc and .iloc for column selection
df.loc[:, 'Name']              # By label
df.iloc[:, 0]                  # By position
df.loc[:, 'Name':'City']       # Slice by labels
```

### Row Selection

```python
# Using .loc (label-based)
df.loc[0]                      # Row with index 0
df.loc[0:2]                    # Rows 0 to 2 (inclusive)
df.loc[0:2, 'Name':'City']     # Rows and columns together

# Using .iloc (position-based)
df.iloc[0]                     # First row
df.iloc[0:2]                   # First two rows (exclusive of 2)
df.iloc[0:2, 0:2]              # First 2 rows, first 2 columns

# Using .at and .iat (fast scalar access)
df.at[0, 'Name']               # By label (single value)
df.iat[0, 0]                   # By position (single value)
```

### Conditional Filtering

```python
# Simple condition filtering
df[df['Age'] > 28]

# Multiple conditions (use & for AND, | for OR)
df[(df['Age'] > 25) & (df['Salary'] > 80000)]
df[(df['City'] == 'New York') | (df['City'] == 'Los Angeles')]

# Using isin() for filtering
df[df['City'].isin(['New York', 'Los Angeles'])]

# Using query() method (more concise syntax)
df.query('Age > 25 and Salary > 80000')
df.query('City in ["New York", "Los Angeles"]')

# String method filtering
df[df['Name'].str.contains('li', case=False)]
df[df['Name'].str.startswith('A')]
df[df['Name'].str.len() > 5]
```

### Advanced Boolean Indexing

```python
# Using where() to preserve structure
df.where(df['Age'] > 28, other='N/A')

# Using mask() for inverse operation
df.mask(df['Age'] > 28, other='Filtered')

# Using np.where() for conditional assignment
df['Age_Group'] = np.where(df['Age'] > 30, 'Senior', 'Junior')

# Multiple conditions with np.select()
conditions = [
    df['Age'] < 25,
    (df['Age'] >= 25) & (df['Age'] < 35),
    df['Age'] >= 35
]
choices = ['Young', 'Middle', 'Senior']
df['Age_Category'] = np.select(conditions, choices, default='Unknown')
```

---

## Data Cleaning

Data cleaning is the most time-consuming but crucial step in data analysis. Pandas provides rich tools for handling dirty data.

### Handling Missing Values

```python
# Create data with missing values
df = pd.DataFrame({
    'Name': ['Alice', 'Bob', None, 'Diana'],
    'Age': [25, None, 35, 28],
    'Salary': [75000, 85000, None, 82000]
})

# Detecting missing values
print(df.isnull())               # Boolean DataFrame
print(df.isnull().sum())         # Count per column
print(df.isnull().any())         # Any missing per column
print(df.isnull().sum().sum())   # Total missing count

# Dropping missing values
df.dropna()                      # Drop rows with any NaN
df.dropna(axis=1)                # Drop columns with any NaN
df.dropna(how='all')             # Drop rows where all values are NaN
df.dropna(thresh=2)              # Keep rows with at least 2 non-NaN
df.dropna(subset=['Name'])       # Only consider specific columns

# Filling missing values
df.fillna(0)                               # Fill with 0
df.fillna({'Age': 30, 'Salary': 80000})    # Fill by column
df['Age'].fillna(df['Age'].mean())         # Fill with mean
df['Age'].fillna(df['Age'].median())       # Fill with median
df.fillna(method='ffill')                  # Forward fill
df.fillna(method='bfill')                  # Backward fill

# Interpolation
df['Age'].interpolate(method='linear')     # Linear interpolation
df['Salary'].interpolate(method='polynomial', order=2)
```

### Handling Duplicate Values

```python
# Create data with duplicates
df = pd.DataFrame({
    'Name': ['Alice', 'Bob', 'Alice', 'Charlie'],
    'Age': [25, 30, 25, 35],
    'City': ['NYC', 'LA', 'NYC', 'Chicago']
})

# Detecting duplicates
print(df.duplicated())                     # Boolean Series
print(df.duplicated().sum())               # Count of duplicates
print(df.duplicated(subset=['Name']))      # Based on specific columns
print(df.duplicated(keep='last'))          # Mark first occurrence as dup

# Removing duplicates
df.drop_duplicates()                       # Keep first occurrence
df.drop_duplicates(keep='last')            # Keep last occurrence
df.drop_duplicates(keep=False)             # Remove all duplicates
df.drop_duplicates(subset=['Name'])        # Based on specific columns
df.drop_duplicates(subset=['Name', 'Age'], keep='first')
```

### Data Type Conversion

```python
# View data types
print(df.dtypes)

# Convert data types
df['Age'] = df['Age'].astype(int)
df['Salary'] = df['Salary'].astype(float)
df['Name'] = df['Name'].astype('string')

# Convert to category (saves memory)
df['City'] = df['City'].astype('category')

# Using pd.to_numeric() for mixed types
df['Mixed_Column'] = pd.to_numeric(df['Mixed_Column'], errors='coerce')

# Convert datetime
df['Date'] = pd.to_datetime(df['Date'])
df['Date'] = pd.to_datetime(df['Date'], format='%Y-%m-%d')

# Convert to nullable integer type (supports NaN)
df['Age'] = df['Age'].astype('Int64')  # Note: capital I
```

### String Processing

```python
# String methods via .str accessor
df['Name'].str.upper()                 # Uppercase
df['Name'].str.lower()                 # Lowercase
df['Name'].str.strip()                 # Remove whitespace
df['Name'].str.replace('old', 'new')   # Replace
df['Name'].str.split(' ')              # Split
df['Name'].str.len()                   # Length
df['Name'].str.title()                 # Title case

# Regular expressions
df['Phone'].str.extract(r'(\d{3})-(\d{4})-(\d{4})')
df['Text'].str.findall(r'\d+')
df['Email'].str.match(r'[\w.]+@[\w.]+')

# Combining string methods
df['Name'].str.strip().str.lower().str.replace(' ', '_')
```

### Renaming and Replacing

```python
# Rename columns
df.rename(columns={'Name': 'FullName', 'Age': 'Years'})

# Rename with function
df.rename(columns=str.lower)
df.rename(columns=lambda x: x.replace(' ', '_'))

# Replace values
df['City'].replace('NYC', 'New York City')
df.replace({'NYC': 'New York', 'LA': 'Los Angeles'})
df['Grade'].replace([1, 2, 3], ['Low', 'Medium', 'High'])
```

---

## GroupBy Operations

GroupBy is one of the most powerful features in Pandas, enabling split-apply-combine operations on data.

### Basic GroupBy Operations

```python
# Create sample sales data
sales = pd.DataFrame({
    'Date': pd.date_range('2024-01-01', periods=10, freq='D'),
    'Product': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
    'Region': ['East', 'East', 'West', 'West', 'East', 'East', 'West', 'West', 'East', 'East'],
    'Quantity': [100, 150, 200, 180, 120, 160, 140, 190, 130, 170],
    'Revenue': [1000, 1500, 2000, 1800, 1200, 1600, 1400, 1900, 1300, 1700]
})

# Single column groupby
grouped = sales.groupby('Product')
print(grouped.mean())
print(grouped.sum())

# Multiple column groupby
grouped = sales.groupby(['Product', 'Region'])
print(grouped.sum())

# Common aggregation functions
grouped.count()     # Count
grouped.sum()       # Sum
grouped.mean()      # Mean
grouped.median()    # Median
grouped.std()       # Standard deviation
grouped.min()       # Minimum
grouped.max()       # Maximum
grouped.first()     # First value
grouped.last()      # Last value
```

### Advanced Aggregation

```python
# Using agg() with multiple functions
result = sales.groupby('Product').agg({
    'Quantity': ['sum', 'mean', 'max'],
    'Revenue': ['sum', 'mean']
})

# Custom aggregation functions
def range_func(x):
    return x.max() - x.min()

result = sales.groupby('Product')['Quantity'].agg(['sum', 'mean', range_func])

# Named aggregation (Pandas 0.25+)
result = sales.groupby('Product').agg(
    TotalQuantity=('Quantity', 'sum'),
    AvgQuantity=('Quantity', 'mean'),
    TotalRevenue=('Revenue', 'sum'),
    MaxRevenue=('Revenue', 'max')
)

# Transform: maintain original shape
sales['ProductAvgQuantity'] = sales.groupby('Product')['Quantity'].transform('mean')
sales['PercentOfProductTotal'] = (
    sales['Revenue'] / sales.groupby('Product')['Revenue'].transform('sum') * 100
)

# Apply: flexible custom operations
def top_n(group, n=2):
    return group.nlargest(n, 'Quantity')

result = sales.groupby('Product').apply(top_n)

# Filter: keep groups that meet a condition
result = sales.groupby('Product').filter(lambda x: x['Quantity'].mean() > 140)
```

### Pivot Tables

```python
# Create pivot table
pivot = sales.pivot_table(
    values='Revenue',
    index='Product',
    columns='Region',
    aggfunc='sum'
)
print(pivot)

# Multiple aggregations
pivot = sales.pivot_table(
    values=['Quantity', 'Revenue'],
    index='Product',
    columns='Region',
    aggfunc='sum'
)

# With margins (totals)
pivot = sales.pivot_table(
    values='Revenue',
    index='Product',
    columns='Region',
    aggfunc='sum',
    margins=True,
    margins_name='Total'
)

# Cross tabulation
ct = pd.crosstab(sales['Product'], sales['Region'])
ct = pd.crosstab(sales['Product'], sales['Region'], normalize='index')
```

---

## Merge and Join

### concat: Stack DataFrames

```python
df1 = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})
df2 = pd.DataFrame({'A': [5, 6], 'B': [7, 8]})

# Vertical concatenation (default)
result = pd.concat([df1, df2])
result = pd.concat([df1, df2], ignore_index=True)

# Horizontal concatenation
result = pd.concat([df1, df2], axis=1)

# Handling different columns
df3 = pd.DataFrame({'A': [9, 10], 'C': [11, 12]})
result = pd.concat([df1, df3], join='inner')  # Only common columns
result = pd.concat([df1, df3], join='outer')  # All columns (default)

# With keys for multi-index
result = pd.concat([df1, df2], keys=['first', 'second'])
```

### merge: SQL-like Joins

```python
# Create sample data
employees = pd.DataFrame({
    'EmpID': [1, 2, 3, 4],
    'Name': ['Alice', 'Bob', 'Charlie', 'Diana'],
    'DeptID': [101, 102, 101, 103]
})

departments = pd.DataFrame({
    'DeptID': [101, 102, 104],
    'DeptName': ['Engineering', 'Marketing', 'Finance']
})

# Inner join (default)
result = pd.merge(employees, departments, on='DeptID')

# Left join
result = pd.merge(employees, departments, on='DeptID', how='left')

# Right join
result = pd.merge(employees, departments, on='DeptID', how='right')

# Outer join
result = pd.merge(employees, departments, on='DeptID', how='outer')

# Join on different column names
result = pd.merge(
    employees, departments,
    left_on='DeptID', right_on='dept_id'
)

# Multiple key join
result = pd.merge(df1, df2, on=['Key1', 'Key2'])

# Join using index
result = pd.merge(df1, df2, left_index=True, right_index=True)

# Handle overlapping column names
result = pd.merge(df1, df2, on='Key', suffixes=('_left', '_right'))

# Indicator column for debugging
result = pd.merge(employees, departments, on='DeptID', how='outer', indicator=True)
```

### join: Index-based Joining

```python
# join uses index by default
df1 = pd.DataFrame({'A': [1, 2, 3]}, index=['a', 'b', 'c'])
df2 = pd.DataFrame({'B': [4, 5, 6]}, index=['a', 'b', 'd'])

result = df1.join(df2, how='left')
result = df1.join(df2, how='outer')

# Join on a column
df1 = df1.set_index('Key')
result = df1.join(df2, on='Key')
```

---

## Time Series

Pandas provides powerful time series processing capabilities, one of its core strengths.

### DateTime Basics

```python
# Creating datetime index
dates = pd.date_range('2024-01-01', periods=10, freq='D')
dates = pd.date_range('2024-01-01', '2024-12-31', freq='M')
dates = pd.date_range('2024-01-01', periods=24, freq='H')

# Common frequency aliases
# 'D' - Calendar day
# 'B' - Business day
# 'W' - Weekly
# 'M' - Month end
# 'MS' - Month start
# 'Q' - Quarter end
# 'Y' - Year end
# 'H' - Hour
# 'T' or 'min' - Minute

# Time series DataFrame
ts = pd.DataFrame({
    'Date': pd.date_range('2024-01-01', periods=100, freq='D'),
    'Value': np.random.randn(100).cumsum()
})
ts.set_index('Date', inplace=True)

# Datetime properties
ts.index.year          # Year
ts.index.month         # Month
ts.index.day           # Day
ts.index.dayofweek     # Day of week (0=Monday)
ts.index.quarter       # Quarter
ts.index.is_month_end  # Is month end
ts.index.day_name()    # Day name ('Monday', etc.)
```

### Time Series Indexing and Slicing

```python
# Date-based indexing
ts['2024-01-15']                    # Single day
ts['2024-01']                       # Entire month
ts['2024-01':'2024-03']             # Date range
ts.loc['2024-01-01':'2024-01-15']   # Using loc

# Filtering by time components
ts[ts.index.month == 1]             # January only
ts[ts.index.dayofweek < 5]          # Weekdays only
```

### Resampling

```python
# Downsampling (high frequency to low frequency)
ts.resample('W').mean()      # Weekly mean
ts.resample('M').sum()       # Monthly sum
ts.resample('Q').last()      # Quarterly last value
ts.resample('M').agg({
    'Value': ['mean', 'std', 'min', 'max']
})

# Upsampling (low frequency to high frequency)
ts_monthly = ts.resample('M').mean()
ts_daily = ts_monthly.resample('D').ffill()    # Forward fill
ts_daily = ts_monthly.resample('D').interpolate()  # Interpolation

# OHLC aggregation (Open, High, Low, Close)
ts.resample('W').ohlc()
```

### Rolling Window Calculations

```python
# Rolling calculations
ts['MA7'] = ts['Value'].rolling(window=7).mean()      # 7-day moving average
ts['MA30'] = ts['Value'].rolling(window=30).mean()    # 30-day moving average
ts['Std7'] = ts['Value'].rolling(window=7).std()      # 7-day rolling std

# Expanding window (from start to current)
ts['CumMean'] = ts['Value'].expanding().mean()
ts['CumMax'] = ts['Value'].expanding().max()

# Exponential weighted moving average
ts['EMA'] = ts['Value'].ewm(span=7).mean()
ts['EMA12'] = ts['Value'].ewm(span=12, adjust=False).mean()

# Shift and difference
ts['Lag1'] = ts['Value'].shift(1)          # Lag by 1 period
ts['Lead1'] = ts['Value'].shift(-1)        # Lead by 1 period
ts['Diff'] = ts['Value'].diff()            # First difference
ts['PctChange'] = ts['Value'].pct_change() # Percentage change
ts['LogReturn'] = np.log(ts['Value'] / ts['Value'].shift(1))
```

### Timezone Handling

```python
# Localize timezone
ts.index = ts.index.tz_localize('UTC')
ts.index = ts.index.tz_localize('America/New_York')

# Convert timezone
ts.index = ts.index.tz_convert('Europe/London')

# Remove timezone info
ts.index = ts.index.tz_localize(None)
```

---

## Performance Tips

Performance optimization is crucial when working with large datasets.

### Memory Optimization

```python
# View memory usage
print(df.memory_usage(deep=True))
print(f"Total memory: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# Optimize data types
def optimize_dtypes(df):
    """Optimize DataFrame memory usage by downcasting types."""
    df = df.copy()

    # Downcast integers
    for col in df.select_dtypes(include=['int64']).columns:
        df[col] = pd.to_numeric(df[col], downcast='integer')

    # Downcast floats
    for col in df.select_dtypes(include=['float64']).columns:
        df[col] = pd.to_numeric(df[col], downcast='float')

    # Convert low-cardinality strings to category
    for col in df.select_dtypes(include=['object']).columns:
        if df[col].nunique() / len(df) < 0.5:
            df[col] = df[col].astype('category')

    return df

df_optimized = optimize_dtypes(df)

# Compare memory usage
print(f"Before: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
print(f"After: {df_optimized.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

# Read large files in chunks
chunks = pd.read_csv('large_file.csv', chunksize=10000)
result = pd.concat([chunk.query('condition') for chunk in chunks])

# Use efficient file formats
df.to_parquet('data.parquet')  # Much faster than CSV for large data
```

### Computation Optimization

```python
# Vectorized operations vs loops
# BAD: Using loops
for i in range(len(df)):
    df.loc[i, 'NewCol'] = df.loc[i, 'A'] + df.loc[i, 'B']

# GOOD: Vectorized operation
df['NewCol'] = df['A'] + df['B']

# Using DataFrame.assign() for chained operations
df = df.assign(NewCol=df['A'] + df['B'] * df['C'])

# Using query() instead of boolean indexing
# Slightly slower for small DataFrames, faster for large ones
df.query('A > 0 and B < 100')

# Avoid apply() when possible - use vectorized alternatives
# BAD
df['Result'] = df['Value'].apply(lambda x: x ** 2 + x)

# GOOD
df['Result'] = df['Value'] ** 2 + df['Value']

# When apply() is necessary, use raw=True for numpy operations
df['Result'] = df[['A', 'B']].apply(lambda x: np.sum(x), axis=1, raw=True)

# Use numba for custom operations
from numba import jit

@jit(nopython=True)
def custom_calc(values):
    result = np.empty(len(values))
    for i in range(len(values)):
        result[i] = values[i] ** 2 + values[i]
    return result

df['Result'] = custom_calc(df['Value'].values)
```

### Index Optimization

```python
# Set appropriate index
df.set_index('ID', inplace=True)

# Sort index for faster lookups
df.sort_index(inplace=True)

# Use .loc instead of chained indexing
# BAD
df[df['A'] > 0]['B']

# GOOD
df.loc[df['A'] > 0, 'B']

# Use categorical index for repeated values
df.index = pd.CategoricalIndex(df.index)
```

### Parallel Processing

```python
# Using swifter for automatic parallelization
# pip install swifter
import swifter
df['Result'] = df['Value'].swifter.apply(lambda x: complex_function(x))

# Using multiprocessing with pandas
from multiprocessing import Pool

def process_chunk(chunk):
    return chunk.apply(complex_function)

chunks = np.array_split(df, 4)
with Pool(4) as pool:
    results = pool.map(process_chunk, chunks)
df = pd.concat(results)
```

---

## Interview Key Points

### Frequently Asked Questions

**Q1: What's the difference between loc and iloc?**

- `loc`: Label-based indexing, uses row/column names
- `iloc`: Position-based indexing, uses integer positions

```python
df.loc[0:2]     # Includes index 2
df.iloc[0:2]    # Excludes position 2
```

**Q2: What's the difference between merge and join?**

- `merge`: SQL-like join operation, can join on columns or indices
- `join`: Primarily index-based joining, a simplified version of merge

**Q3: How do you handle large datasets?**

- Use `chunksize` for chunked reading
- Optimize data types to reduce memory
- Use `query()` method for efficient filtering
- Consider Dask or Modin for distributed computing
- Use Parquet format instead of CSV

**Q4: How do you maintain original index after groupby?**

Use the `transform` method:

```python
df['GroupMean'] = df.groupby('Category')['Value'].transform('mean')
```

**Q5: How do you improve apply() function performance?**

- Prefer vectorized operations
- Use `swifter` library for automatic parallelization
- Use `numba` JIT compilation for speed
- Consider numpy's `ufunc`
- Set `raw=True` when possible

**Q6: What's the difference between pivot_table and groupby?**

- `groupby`: Returns flattened aggregation results
- `pivot_table`: Creates spreadsheet-like 2D pivot tables, better for presentation

**Q7: How do you handle memory errors with large DataFrames?**

```python
# Read in chunks
for chunk in pd.read_csv('large.csv', chunksize=10000):
    process(chunk)

# Reduce memory with optimized dtypes
df = pd.read_csv('data.csv', dtype={'col1': 'int32', 'col2': 'category'})

# Select only needed columns
df = pd.read_csv('data.csv', usecols=['col1', 'col2'])

# Use Dask for out-of-core computing
import dask.dataframe as dd
ddf = dd.read_csv('large.csv')
```

**Q8: Explain the copy-on-write behavior in Pandas.**

```python
# Creating a view vs copy
subset = df[df['A'] > 0]  # Creates a copy in most cases
subset.loc[:, 'B'] = 0    # Modifies subset, not original df

# Explicit copy
df_copy = df.copy()       # Always creates a new copy
df_copy['A'] = 0          # Does not affect original
```

---

## Practical Examples

### Example 1: Sales Data Analysis

```python
import pandas as pd
import numpy as np

# Generate sample sales data
np.random.seed(42)
n = 1000

sales_data = pd.DataFrame({
    'OrderID': range(1, n + 1),
    'Date': pd.date_range('2024-01-01', periods=n, freq='H'),
    'Product': np.random.choice(['Phone', 'Laptop', 'Tablet', 'Headphones'], n),
    'Region': np.random.choice(['East', 'West', 'North', 'South'], n),
    'Quantity': np.random.randint(1, 10, n),
    'UnitPrice': np.random.uniform(100, 2000, n).round(2),
    'CustomerType': np.random.choice(['VIP', 'Regular', 'New'], n, p=[0.2, 0.5, 0.3])
})
sales_data['Revenue'] = sales_data['Quantity'] * sales_data['UnitPrice']

# Basic statistics
print("=== Sales Overview ===")
print(f"Total Revenue: ${sales_data['Revenue'].sum():,.2f}")
print(f"Average Order Value: ${sales_data['Revenue'].mean():,.2f}")
print(f"Total Orders: {len(sales_data)}")

# Product analysis
print("\n=== Product Sales Analysis ===")
product_analysis = sales_data.groupby('Product').agg(
    OrderCount=('OrderID', 'count'),
    TotalQuantity=('Quantity', 'sum'),
    TotalRevenue=('Revenue', 'sum'),
    AvgUnitPrice=('UnitPrice', 'mean')
).round(2)
print(product_analysis.sort_values('TotalRevenue', ascending=False))

# Region-Product cross analysis
print("\n=== Region-Product Cross Analysis ===")
pivot = sales_data.pivot_table(
    values='Revenue',
    index='Region',
    columns='Product',
    aggfunc='sum',
    margins=True
).round(2)
print(pivot)

# Time trend analysis
sales_data.set_index('Date', inplace=True)
daily_sales = sales_data.resample('D')['Revenue'].sum()
weekly_sales = sales_data.resample('W')['Revenue'].sum()

print("\n=== Daily Sales Trend (First 10 Days) ===")
print(daily_sales.head(10))
```

### Example 2: Data Cleaning Pipeline

```python
def data_cleaning_pipeline(df):
    """
    Comprehensive data cleaning pipeline.
    """
    df = df.copy()

    # 1. Standardize column names
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # 2. Handle missing values
    # Fill numeric columns with median
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        df[col].fillna(df[col].median(), inplace=True)

    # Fill categorical columns with mode
    cat_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in cat_cols:
        df[col].fillna(df[col].mode()[0], inplace=True)

    # 3. Handle duplicates
    df.drop_duplicates(inplace=True)

    # 4. Handle outliers (IQR method)
    for col in numeric_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df[col] = df[col].clip(lower_bound, upper_bound)

    # 5. Optimize data types
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], downcast='float')
    for col in cat_cols:
        if df[col].nunique() < 50:
            df[col] = df[col].astype('category')

    return df

# Usage
# cleaned_df = data_cleaning_pipeline(raw_df)
```

### Example 3: Customer Cohort Analysis

```python
def cohort_analysis(df, user_col, date_col, value_col):
    """
    Perform cohort analysis on user data.
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    # Get first purchase date for each user
    df['CohortMonth'] = df.groupby(user_col)[date_col].transform('min').dt.to_period('M')
    df['OrderMonth'] = df[date_col].dt.to_period('M')

    # Calculate months since first purchase
    df['CohortIndex'] = (
        (df['OrderMonth'].dt.year - df['CohortMonth'].dt.year) * 12 +
        (df['OrderMonth'].dt.month - df['CohortMonth'].dt.month)
    )

    # Create cohort table
    cohort_data = df.groupby(['CohortMonth', 'CohortIndex'])[user_col].nunique()
    cohort_table = cohort_data.unstack(fill_value=0)

    # Calculate retention rates
    cohort_sizes = cohort_table.iloc[:, 0]
    retention_table = cohort_table.divide(cohort_sizes, axis=0) * 100

    return retention_table.round(2)

# Usage
# retention = cohort_analysis(orders_df, 'CustomerID', 'OrderDate', 'Revenue')
```

---

## Further Reading

### Official Resources

- [Pandas Official Documentation](https://pandas.pydata.org/docs/)
- [Pandas Cookbook](https://pandas.pydata.org/docs/user_guide/cookbook.html)
- [10 Minutes to Pandas](https://pandas.pydata.org/docs/user_guide/10min.html)

### Recommended Books

- **"Python for Data Analysis"** - Wes McKinney (Pandas creator)
- **"Effective Pandas"** - Matt Harrison
- **"Pandas 1.x Cookbook"** - Matt Harrison

### Alternative Tools

- **Dask**: Distributed Pandas for handling datasets larger than memory
- **Modin**: Drop-in replacement for Pandas with parallel execution
- **Polars**: High-performance DataFrame library written in Rust
- **Vaex**: DataFrame library for billion-row datasets
- **cuDF**: GPU DataFrame library (part of RAPIDS)

### Online Practice

- [Kaggle Learn - Pandas](https://www.kaggle.com/learn/pandas)
- [DataCamp - Pandas Courses](https://www.datacamp.com/courses/pandas-foundations)
- [LeetCode Database Problems](https://leetcode.com/problemset/database/) (can be solved with Pandas)
- [HackerRank Python](https://www.hackerrank.com/domains/python)

### Related Code Wiki Articles

- [NumPy Fundamentals](/data/numpy) - The foundation that Pandas is built upon
- [SQL Advanced Queries](/data/sql-advanced) - Comparison with SQL operations
- [Data Visualization](/data/visualization) - Visualizing Pandas DataFrames
- [Statistics Fundamentals](/data/statistics-fundamentals) - Statistical concepts for data analysis

---

> **Summary**: Mastering Pandas is fundamental to data analysis. Through consistent practice and real-world project application, you'll be able to efficiently handle various data manipulation tasks. Remember, the best way to learn is by working hands-on with real datasets.
