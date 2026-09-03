---
title: Python Statistics Module
description: "Master Python's statistics module: mean, median, mode, standard deviation, and variance calculations for data analysis"
track: python
section: stdlib
difficulty: beginner
tags:
  - Statistics
  - Data Analysis
  - Python Standard Library
  - Mathematics
status: imported
origin: old/src/content/docs/python/statistics.en.md
divergence: 0.276
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

The `statistics` module is Python's built-in library for calculating basic statistical properties of numerical data. It provides simple, intuitive functions for computing measures of central tendency and dispersion without requiring external dependencies like NumPy.

## Concept Explanation

The `statistics` module provides basic statistical calculations for quantitative data. Statistics is the science of collecting, analyzing, and interpreting data. Key statistical concepts include:

- **Central Tendency**: Measures that describe where the data is centered (mean, median, mode)
- **Dispersion**: Measures that describe how spread out the data is (variance, standard deviation)
- **Data Types**: The module works with numeric sequences like lists, tuples, and iterables

### Why Use the Statistics Module?

The `statistics` module is ideal when you need:
- Simple statistical calculations without installing external libraries
- Pure Python implementation without C extensions
- Calculation from iterables without loading data into memory
- Decimal precision and exact rational arithmetic

### Key Functions

The module provides five main functions:

- `mean()`: Calculate arithmetic mean (average)
- `median()`: Find the middle value(s)
- `mode()`: Find the most frequently occurring value
- `stdev()`: Calculate sample standard deviation
- `variance()`: Calculate sample variance

Additionally, `median_low()` and `median_high()` provide alternative median calculations.

## Core Principles

### Decimal and Fraction Support

The `statistics` module works with various numeric types:

```python
from statistics import mean
from decimal import Decimal
from fractions import Fraction

# Works with integers
print(mean([1, 2, 3, 4, 5]))  # 3.0

# Works with floats
print(mean([1.5, 2.5, 3.5]))  # 2.5

# Works with Decimal for precision
print(mean([Decimal('1.1'), Decimal('2.2'), Decimal('3.3')]))
# Decimal('2.2')

# Works with Fraction for exact arithmetic
print(mean([Fraction(1, 2), Fraction(1, 3)]))
# Fraction(5, 12)
```

### Single-Pass Calculation

Functions like `mean()` can work with iterables that are only iterable once:

```python
from statistics import mean

def data_generator():
    yield 10
    yield 20
    yield 30

# Works with generators
result = mean(data_generator())
print(result)  # 20.0
```

### Population vs. Sample

Standard deviation and variance distinguish between:
- **Sample Statistics** (default): Use for data samples from a larger population
- **Population Statistics**: Use when data represents the entire population

```python
from statistics import stdev, pstdev

data = [1, 2, 3, 4, 5]

# Sample standard deviation (default)
print(stdev(data))  # ~1.58

# Population standard deviation
print(pstdev(data))  # ~1.41
```

### Data Validation

The module includes automatic data validation:

```python
from statistics import mean

# Raises TypeError for non-numeric values
try:
    mean([1, 2, 'three'])
except TypeError as e:
    print(f"Error: {e}")

# Raises StatisticsError for empty sequences
from statistics import StatisticsError

try:
    mean([])
except StatisticsError as e:
    print(f"Error: {e}")
```

## Key Points

### Essential Concepts

1. **Mean (Average)**: Sum of all values divided by count
   - Formula: μ = (x₁ + x₂ + ... + xₙ) / n
   - Most common measure of central tendency
   - Affected by outliers

2. **Median**: Middle value when data is sorted
   - Not affected by outliers
   - For even-length datasets, use `median_low()` or `median_high()`

3. **Mode**: Most frequently occurring value
   - Useful for categorical data
   - Raises `StatisticsError` if no unique mode exists
   - Returns the first mode found

4. **Variance**: Average of squared deviations from mean
   - Measures data spread
   - Formula: σ² = Σ(xᵢ - μ)² / (n - 1) for samples

5. **Standard Deviation**: Square root of variance
   - Same units as original data
   - More interpretable than variance

### Data Type Compatibility

The module works with:
- `int`: Integer values
- `float`: Floating-point numbers
- `Decimal`: Arbitrary precision decimals
- `Fraction`: Exact rational numbers

The module **does not** work with:
- Complex numbers
- Non-numeric objects
- Booleans (despite bool being a subclass of int)

### Empty Data Handling

```python
from statistics import mean, StatisticsError

# StatisticsError is raised for empty sequences
try:
    mean([])
except StatisticsError:
    print("Cannot calculate mean of empty data")
```

## Code Examples

### Basic Calculations

```python
from statistics import mean, median, mode, stdev, variance

data = [10, 20, 30, 40, 50]

# Arithmetic mean
print(f"Mean: {mean(data)}")  # 30.0

# Median value
print(f"Median: {median(data)}")  # 30

# Most common value
repeated_data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
print(f"Mode: {mode(repeated_data)}")  # 4

# Standard deviation (sample)
print(f"Stdev: {stdev(data)}")  # ~15.81

# Variance (sample)
print(f"Variance: {variance(data)}")  # 250.0
```

### Working with Decimal Precision

```python
from statistics import mean, stdev
from decimal import Decimal

prices = [Decimal('10.99'), Decimal('11.50'), Decimal('10.75'), Decimal('11.25')]

avg_price = mean(prices)
price_stdev = stdev(prices)

print(f"Average price: ${avg_price}")
print(f"Price std deviation: ${price_stdev}")
```

### Processing File Data

```python
from statistics import mean, median

def analyze_measurements(filename):
    """Read measurements from file and calculate statistics."""
    measurements = []

    with open(filename, 'r') as f:
        for line in f:
            try:
                measurements.append(float(line.strip()))
            except ValueError:
                print(f"Skipping invalid line: {line}")

    if measurements:
        print(f"Mean: {mean(measurements):.2f}")
        print(f"Median: {median(measurements):.2f}")
        return measurements
    return None

# Usage
# data = analyze_measurements('data.txt')
```

### Handling Different Median Cases

```python
from statistics import median, median_low, median_high

# Odd-length dataset
odd_data = [1, 3, 5]
print(f"Median (odd): {median(odd_data)}")  # 3

# Even-length dataset
even_data = [1, 2, 3, 4]
print(f"Median (even): {median(even_data)}")  # 2.5
print(f"Median low: {median_low(even_data)}")  # 2
print(f"Median high: {median_high(even_data)}")  # 3
```

### Population vs. Sample Statistics

```python
from statistics import stdev, pstdev, variance, pvariance

# Sample data from a larger population
sample = [65, 72, 68, 71, 70]

print("Sample Statistics (estimating population):")
print(f"  Standard Deviation: {stdev(sample):.4f}")
print(f"  Variance: {variance(sample):.4f}")

print("\nPopulation Statistics (if data is the entire population):")
print(f"  Standard Deviation: {pstdev(sample):.4f}")
print(f"  Variance: {pvariance(sample):.4f}")
```

### Custom Statistics Functions

```python
from statistics import mean, stdev

def calculate_statistics(data):
    """Calculate comprehensive statistics for a dataset."""
    if not data:
        return None

    avg = mean(data)
    std = stdev(data) if len(data) > 1 else 0

    # Calculate z-scores
    z_scores = [(x - avg) / std for x in data] if std > 0 else [0] * len(data)

    # Find outliers (|z| > 2)
    outliers = [x for x, z in zip(data, z_scores) if abs(z) > 2]

    return {
        'mean': avg,
        'stdev': std,
        'min': min(data),
        'max': max(data),
        'count': len(data),
        'outliers': outliers,
        'z_scores': z_scores
    }

# Usage
scores = [85, 90, 92, 88, 95, 150, 87, 89]
stats = calculate_statistics(scores)
print(f"Mean: {stats['mean']:.2f}")
print(f"Outliers: {stats['outliers']}")
```

### Processing Streaming Data

```python
from statistics import mean, stdev
from decimal import Decimal

class StreamingStatistics:
    """Calculate statistics from streaming data."""

    def __init__(self):
        self.data = []

    def add(self, value):
        """Add a new value to the dataset."""
        try:
            self.data.append(float(value))
        except ValueError:
            raise ValueError(f"Invalid numeric value: {value}")

    def get_mean(self):
        """Get current mean."""
        return mean(self.data) if self.data else None

    def get_stdev(self):
        """Get current standard deviation."""
        return stdev(self.data) if len(self.data) > 1 else None

    def get_summary(self):
        """Get complete statistics."""
        if not self.data:
            return None

        return {
            'count': len(self.data),
            'mean': mean(self.data),
            'stdev': self.get_stdev(),
            'min': min(self.data),
            'max': max(self.data),
            'range': max(self.data) - min(self.data)
        }

# Usage
stats = StreamingStatistics()
for measurement in [10.5, 11.2, 10.8, 11.5, 10.9]:
    stats.add(measurement)

summary = stats.get_summary()
for key, value in summary.items():
    if value is not None:
        print(f"{key}: {value:.2f}")
```

### Grade Analysis Example

```python
from statistics import mean, median, mode, stdev, StatisticsError

def analyze_grades(grades):
    """Analyze a class's grades."""
    if not grades:
        print("No grades to analyze")
        return

    print(f"Total students: {len(grades)}")
    print(f"Mean grade: {mean(grades):.2f}")
    print(f"Median grade: {median(grades):.2f}")

    try:
        print(f"Mode grade: {mode(grades)}")
    except StatisticsError:
        print("Mode: No unique mode")

    if len(grades) > 1:
        print(f"Standard deviation: {stdev(grades):.2f}")

        # Grade distribution
        passing = sum(1 for g in grades if g >= 60)
        print(f"Passing rate: {(passing/len(grades))*100:.1f}%")

# Usage
grades = [75, 85, 90, 78, 92, 88, 76, 95, 82, 80]
analyze_grades(grades)
```

## Best Practices

### Choose the Right Statistical Function

```python
from statistics import mean, median, mode

# Use mean for symmetric distributions
data = [1, 2, 3, 4, 5]
print(f"Mean: {mean(data)}")  # Good choice

# Use median for skewed data or with outliers
skewed_data = [1, 2, 3, 4, 100]
print(f"Median: {median(skewed_data)}")  # Better than mean

# Use mode for categorical or frequency data
categories = ['A', 'B', 'A', 'C', 'A', 'B']
# Note: statistics module mode() works with values that support equality
```

### Validate Input Data

```python
from statistics import mean, StatisticsError

def safe_statistics(data):
    """Calculate statistics with proper validation."""
    if not data:
        raise ValueError("Data cannot be empty")

    if not all(isinstance(x, (int, float)) for x in data):
        raise TypeError("All values must be numeric")

    return {
        'mean': mean(data),
        'count': len(data)
    }

# Usage
try:
    result = safe_statistics([1, 2, 3, 4, 5])
    print(result)
except (ValueError, TypeError) as e:
    print(f"Error: {e}")
```

### Handle Edge Cases

```python
from statistics import mean, stdev, StatisticsError

def robust_statistics(data):
    """Calculate statistics handling edge cases."""
    if not data:
        return {'error': 'Empty dataset'}

    if len(data) == 1:
        return {
            'count': 1,
            'mean': float(data[0]),
            'stdev': None  # Cannot calculate for single value
        }

    return {
        'count': len(data),
        'mean': mean(data),
        'stdev': stdev(data)
    }
```

### Use Decimal for Financial Data

```python
from statistics import mean
from decimal import Decimal

# Don't use floats for money
prices_float = [10.10, 20.20, 30.30]
print(mean(prices_float))  # May have precision issues

# Use Decimal instead
prices_decimal = [Decimal('10.10'), Decimal('20.20'), Decimal('30.30')]
print(mean(prices_decimal))  # Precise result
```

### Consider Performance for Large Datasets

```python
# For large datasets, NumPy is more efficient
# But statistics module is fine for modest amounts of data

from statistics import mean
import time

# Small dataset - statistics module is fine
small_data = list(range(1000))
start = time.time()
result = mean(small_data)
print(f"Small dataset time: {time.time() - start:.6f}s")

# For very large datasets, consider NumPy
# import numpy as np
# large_data = np.arange(10_000_000)
# result = np.mean(large_data)  # Much faster
```

## Common Pitfalls

### Mode with No Unique Mode

```python
from statistics import mode, StatisticsError

# Raises StatisticsError if multiple values tie for most frequent
try:
    result = mode([1, 1, 2, 2, 3, 4])
except StatisticsError as e:
    print(f"Error: {e}")  # "no unique mode"

# Solution: Handle the exception or find all modes manually
from collections import Counter

def find_all_modes(data):
    """Find all modes in a dataset."""
    counts = Counter(data)
    max_count = max(counts.values())
    return [value for value, count in counts.items() if count == max_count]

modes = find_all_modes([1, 1, 2, 2, 3, 4])
print(f"All modes: {modes}")  # [1, 2]
```

### Empty Sequence Error

```python
from statistics import mean, StatisticsError

# This raises an error
try:
    result = mean([])
except StatisticsError as e:
    print(f"Error: {e}")  # "no numeric types"

# Solution: Check before calculating
data = []
if data:
    result = mean(data)
else:
    print("Cannot calculate mean of empty sequence")
```

### Single Value and Standard Deviation

```python
from statistics import stdev, StatisticsError

# Standard deviation requires at least 2 values
try:
    result = stdev([5])
except StatisticsError as e:
    print(f"Error: {e}")  # "need at least two data points"

# Solution: Check data length
data = [5]
if len(data) > 1:
    result = stdev(data)
else:
    print("Need at least 2 values for standard deviation")
```

### Mixing Numeric Types Incorrectly

```python
from statistics import mean
from decimal import Decimal

# Mixing float and Decimal can cause issues
mixed = [Decimal('10.5'), 20.5, 30]
result = mean(mixed)  # Result will be float, losing precision

# Solution: Convert to consistent type
from decimal import Decimal
consistent = [Decimal('10.5'), Decimal('20.5'), Decimal('30')]
result = mean(consistent)  # Maintains precision
```

### Forgetting Population vs. Sample

```python
from statistics import stdev, pstdev

data = [1, 2, 3, 4, 5]

# If you have the entire population, use pstdev()
population_std = pstdev(data)

# If you have a sample, use stdev()
sample_std = stdev(data)

# They give different results!
print(f"Sample: {sample_std}")      # ~1.58
print(f"Population: {population_std}")  # ~1.41
```

## Performance Considerations

### Time Complexity

```python
# All statistics functions are O(n) - must read all data
from statistics import mean, median, stdev

# Time to calculate each function:
# - mean: O(n) - single pass
# - median: O(n log n) - requires sorting
# - mode: O(n) - single pass with counting
# - stdev/variance: O(n) - single pass

large_data = list(range(1_000_000))

import time

start = time.time()
mean_val = mean(large_data)
print(f"Mean calculation: {time.time() - start:.6f}s")

start = time.time()
median_val = median(large_data)
print(f"Median calculation: {time.time() - start:.6f}s")
```

### Memory Usage

```python
from statistics import mean

# The module stores data in memory if using iterables
def data_generator():
    for i in range(1_000_000):
        yield i

# Generator is consumed and converted to list internally
result = mean(data_generator())

# For streaming/large data without loading all at once:
# Consider implementing online algorithms
```

### When to Use NumPy Instead

```python
# Use statistics module for:
# - Small to medium datasets (< 100,000 elements)
# - When you don't want external dependencies
# - Need Decimal or Fraction precision

# Use NumPy for:
# - Large datasets (> 100,000 elements)
# - Need multiple statistical operations
# - Performance-critical code
# - Complex numerical operations

# Example: statistics module is fine here
from statistics import mean, stdev
data = [float(x) for x in range(10000)]
result = mean(data)

# For this, NumPy is better
# import numpy as np
# data = np.arange(10_000_000)
# result = np.mean(data)
```

## Real-world Scenarios

### Test Score Analysis

```python
from statistics import mean, median, stdev

def analyze_test_scores(scores):
    """Analyze test scores for a class."""
    if not scores:
        return None

    mean_score = mean(scores)
    median_score = median(scores)
    std_score = stdev(scores) if len(scores) > 1 else 0

    # Identify students needing help (> 1 std dev below mean)
    threshold = mean_score - std_score
    struggling = [s for s in scores if s < threshold]

    return {
        'class_average': mean_score,
        'median_score': median_score,
        'variability': std_score,
        'struggling_students': len(struggling),
        'performance_spread': max(scores) - min(scores)
    }

# Usage
test_scores = [78, 85, 92, 88, 76, 95, 82, 81, 90, 74]
results = analyze_test_scores(test_scores)
print(f"Class average: {results['class_average']:.2f}")
print(f"Struggling: {results['struggling_students']} students")
```

### Weather Data Analysis

```python
from statistics import mean, median

def analyze_temperature_data(filename):
    """Analyze daily temperature readings."""
    temps = []

    try:
        with open(filename, 'r') as f:
            for line in f:
                temp = float(line.strip())
                temps.append(temp)
    except FileNotFoundError:
        print(f"File {filename} not found")
        return None

    if not temps:
        return None

    return {
        'avg_temp': mean(temps),
        'median_temp': median(temps),
        'high': max(temps),
        'low': min(temps),
        'days_recorded': len(temps)
    }

# Usage
# data = analyze_temperature_data('weather.txt')
```

### Product Quality Measurement

```python
from statistics import mean, stdev
from decimal import Decimal

def quality_control_report(measurements):
    """Generate quality control report."""
    if len(measurements) < 2:
        print("Need at least 2 measurements")
        return None

    avg = mean(measurements)
    std = stdev(measurements)

    # Flag measurements outside tolerance (±2 std dev)
    lower_bound = avg - (2 * std)
    upper_bound = avg + (2 * std)

    defects = [m for m in measurements if m < lower_bound or m > upper_bound]

    return {
        'target': avg,
        'tolerance_lower': lower_bound,
        'tolerance_upper': upper_bound,
        'defect_count': len(defects),
        'defect_rate': f"{(len(defects)/len(measurements))*100:.2f}%"
    }

# Usage
measurements = [Decimal(x) for x in ['100.05', '99.95', '100.10', '99.90', '120.0', '100.02']]
report = quality_control_report(measurements)
```

### Performance Metrics

```python
from statistics import mean, median

def analyze_api_response_times(times_ms):
    """Analyze API response time performance."""
    return {
        'avg_response_time': f"{mean(times_ms):.2f}ms",
        'median_response_time': f"{median(times_ms):.2f}ms",
        'p50': f"{median(times_ms):.2f}ms",
        'min_response_time': f"{min(times_ms):.2f}ms",
        'max_response_time': f"{max(times_ms):.2f}ms",
        'requests_analyzed': len(times_ms)
    }

# Usage
response_times = [145.2, 153.8, 142.1, 156.4, 149.3, 151.2, 148.9]
metrics = analyze_api_response_times(response_times)
for key, value in metrics.items():
    print(f"{key}: {value}")
```

## Interview Points

### Questions You Might Be Asked

**Q1: What's the difference between mean and median?**

A: Mean is the arithmetic average (sum/count) and is affected by outliers. Median is the middle value when sorted and is robust to outliers. Use median for skewed data.

```python
from statistics import mean, median

data = [1, 2, 3, 4, 100]  # outlier at 100
print(mean(data))    # 22 - skewed by outlier
print(median(data))  # 3 - better represents center
```

**Q2: When would you use sample statistics vs. population statistics?**

A: Use sample statistics (stdev, variance) when working with a subset of data from a larger population. Use population statistics (pstdev, pvariance) when your data represents the entire population.

```python
from statistics import stdev, pstdev

sample = [1, 2, 3, 4, 5]
print(stdev(sample))   # ~1.58 - estimates population std
print(pstdev(sample))  # ~1.41 - assumes this is all data
```

**Q3: Why does mode() sometimes raise StatisticsError?**

A: The mode() function requires a unique most-frequent value. If multiple values tie for most frequent, it raises an error. Handle this by checking for exceptions or finding all modes manually.

```python
from statistics import mode, StatisticsError
from collections import Counter

data = [1, 1, 2, 2, 3]
try:
    m = mode(data)
except StatisticsError:
    # Find all modes
    counts = Counter(data)
    max_count = max(counts.values())
    modes = [v for v, c in counts.items() if c == max_count]
```

**Q4: What are the advantages of Decimal over float in statistics?**

A: Decimal provides arbitrary precision arithmetic, avoiding floating-point rounding errors. Important for financial data, medical measurements, and other precision-critical applications.

```python
from statistics import mean
from decimal import Decimal

# Float precision issue
print(mean([0.1, 0.2, 0.3]))  # May not equal 0.2

# Decimal precision
print(mean([Decimal('0.1'), Decimal('0.2'), Decimal('0.3')]))  # Exact
```

**Q5: How would you detect outliers in a dataset?**

A: Calculate mean and standard deviation, then identify values beyond 2 or 3 standard deviations from the mean (using z-scores).

```python
from statistics import mean, stdev

def find_outliers(data, threshold=2):
    """Find outliers using z-score method."""
    avg = mean(data)
    std = stdev(data) if len(data) > 1 else 0

    if std == 0:
        return []

    return [x for x in data if abs((x - avg) / std) > threshold]

data = [1, 2, 3, 4, 5, 100]
outliers = find_outliers(data)
print(outliers)  # [100]
```

## Further Reading

### Standard Library Documentation

- [Official statistics module documentation](https://docs.python.org/3/library/statistics.html)
- [Python statistics PEP 450](https://www.python.org/dev/peps/pep-0450/)

### Related Topics

- **NumPy**: For advanced statistical operations and numerical computing
- **Pandas**: For data manipulation and analysis with DataFrames
- **SciPy**: For advanced statistical functions and scientific computing
- **Decimal Module**: For arbitrary precision arithmetic
- **Collections Module**: For counting and frequency analysis

### Key Formulas

**Mean (Arithmetic Average):**
```
μ = (Σ xᵢ) / n
```

**Median:** The middle value when data is sorted

**Standard Deviation (Sample):**
```
s = √[Σ(xᵢ - x̄)² / (n - 1)]
```

**Variance (Sample):**
```
s² = Σ(xᵢ - x̄)² / (n - 1)
```

**Standard Deviation (Population):**
```
σ = √[Σ(xᵢ - μ)² / n]
```

**Variance (Population):**
```
σ² = Σ(xᵢ - μ)² / n
```

### Summary

The `statistics` module provides essential statistical functions for data analysis in Python. Key takeaways:

1. **Use for simple calculations**: Mean, median, mode, standard deviation, and variance
2. **Choose appropriate functions**: Mean for symmetric data, median for skewed data
3. **Distinguish sample vs. population**: Use stdev() for samples, pstdev() for populations
4. **Handle edge cases**: Empty data, single values, and non-unique modes
5. **Consider precision**: Use Decimal for financial data and Fraction for exact arithmetic
6. **Scale appropriately**: Use NumPy for large datasets or complex numerical operations

Mastering the `statistics` module is essential for Python developers who work with data analysis, quality control, performance metrics, and any domain requiring statistical calculations.
