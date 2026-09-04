---
title: Data Visualization Complete Guide
description: Master data visualization for effective insights communication
track: datascience
section: python-stack
difficulty: intermediate
tags:
  - Visualization
  - Matplotlib
  - Seaborn
  - Charts
status: imported
origin: old/src/content/docs/data/visualization.en.md
divergence: 0.211
issues: []
legacy:
  category: Data
  subcategory: Visualization
  order: 5
  lastUpdated: 2026-01-07
---

Data visualization is both an art and a science of transforming complex data into intuitive graphics. Excellent visualization reveals hidden patterns and trends within data and effectively communicates insights to your audience. We cover the core principles, mainstream tools, and best practices of data visualization.

## Core Concepts

### What is Data Visualization?

Data visualization refers to the techniques and methods of using graphical elements (such as points, lines, areas, colors, shapes, etc.) to represent data. It transforms abstract numbers and statistical information into visual charts, enabling people to quickly understand the meaning of data, discover patterns, and make informed decisions.

### Why is Data Visualization Important?

1. **Cognitive Efficiency**: The human brain processes visual information 60,000 times faster than text
2. **Pattern Recognition**: Graphical representation can reveal hidden trends and anomalies in data
3. **Decision Support**: Intuitive data presentation facilitates quick and accurate decision-making
4. **Communication Effectiveness**: Excellent visualization can convey information across language and professional barriers
5. **Memory Retention**: Visual information is more memorable than plain text

```python
# Basic data visualization environment setup
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd
import numpy as np

# Set default style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Configure figure defaults
plt.rcParams['figure.figsize'] = (10, 6)
plt.rcParams['figure.dpi'] = 100

print("Visualization environment configured successfully!")
```

## Visualization Principles

### Edward Tufte's Visualization Principles

Edward Tufte is known as the "father of data visualization." He proposed several classic visualization principles:

**1. Data-Ink Ratio**

Charts should minimize non-data elements, ensuring every drop of "ink" is used to display data.

```python
# Example: High Data-Ink Ratio vs Low Data-Ink Ratio

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

data = {'Product': ['A', 'B', 'C', 'D', 'E'],
        'Sales': [120, 98, 145, 87, 112]}
df = pd.DataFrame(data)

# Low data-ink ratio (cluttered design)
axes[0].bar(df['Product'], df['Sales'], color='steelblue', edgecolor='black', linewidth=2)
axes[0].set_title('Cluttered Design Example', fontsize=14, fontweight='bold')
axes[0].set_facecolor('#f0f0f0')
axes[0].grid(True, linestyle='--', alpha=0.7)
for i, v in enumerate(df['Sales']):
    axes[0].text(i, v + 3, str(v), ha='center', fontsize=10)

# High data-ink ratio (clean design)
axes[1].bar(df['Product'], df['Sales'], color='steelblue')
axes[1].set_title('Clean Design Example', fontsize=14)
axes[1].spines['top'].set_visible(False)
axes[1].spines['right'].set_visible(False)

plt.tight_layout()
plt.show()
```

**2. Chartjunk**

Avoid meaningless decorative elements such as 3D effects, excessive shadows, and unnecessary background patterns.

**3. Data Integrity**

Charts should accurately reflect the true nature of data, avoiding misleading representations (such as truncated Y-axes, disproportionate graphics, etc.).

### Visual Encoding Principles

Visual encoding is the process of mapping data to visual attributes. Different visual attributes have different effectiveness for expressing different types of data:

```python
# Visual encoding examples
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

np.random.seed(42)
n = 50
x = np.random.rand(n)
y = np.random.rand(n)
sizes = np.random.rand(n) * 500
colors = np.random.rand(n)
categories = np.random.choice(['A', 'B', 'C'], n)

# Position encoding
axes[0, 0].scatter(x, y, s=100, alpha=0.6)
axes[0, 0].set_title('Position Encoding: Most Accurate Quantitative Expression')
axes[0, 0].set_xlabel('X Dimension')
axes[0, 0].set_ylabel('Y Dimension')

# Size encoding
axes[0, 1].scatter(x, y, s=sizes, alpha=0.6)
axes[0, 1].set_title('Size Encoding: Expressing Quantity Differences')
axes[0, 1].set_xlabel('X Dimension')
axes[0, 1].set_ylabel('Y Dimension')

# Color encoding (continuous)
scatter = axes[1, 0].scatter(x, y, c=colors, cmap='viridis', s=100, alpha=0.8)
axes[1, 0].set_title('Color Encoding: Expressing Continuous Variables')
plt.colorbar(scatter, ax=axes[1, 0])

# Shape/color encoding (categorical)
for cat, marker, color in zip(['A', 'B', 'C'], ['o', 's', '^'], ['#e74c3c', '#3498db', '#2ecc71']):
    mask = categories == cat
    axes[1, 1].scatter(x[mask], y[mask], marker=marker, c=color, s=100, label=f'Category {cat}', alpha=0.7)
axes[1, 1].set_title('Shape/Color Encoding: Distinguishing Categories')
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

## Chart Type Selection Guide

Choosing the right chart type is crucial for effective data visualization. A selection guide based on data relationships and analysis purposes:

### Classification by Data Relationship

| Data Relationship | Recommended Chart Types | Use Cases |
|------------------|------------------------|-----------|
| Comparison | Bar chart, Column chart, Radar chart | Comparing values across categories |
| Composition | Pie chart, Stacked bar chart, Treemap | Parts of a whole |
| Trend | Line chart, Area chart | Data changes over time |
| Distribution | Histogram, Box plot, Density plot | Data distribution patterns |
| Correlation | Scatter plot, Bubble chart, Heatmap | Relationships between variables |

```python
# Chart type selection examples
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# Sample data
categories = ['Electronics', 'Clothing', 'Food', 'Home', 'Books']
values = [45, 28, 35, 22, 15]
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
sales_trend = [120, 135, 148, 165, 158, 180]

# Bar Chart - Comparison
axes[0, 0].bar(categories, values, color=sns.color_palette("husl", 5))
axes[0, 0].set_title('Bar Chart: Category Comparison', fontsize=12)
axes[0, 0].set_ylabel('Sales (10k)')

# Pie Chart - Composition
axes[0, 1].pie(values, labels=categories, autopct='%1.1f%%', colors=sns.color_palette("husl", 5))
axes[0, 1].set_title('Pie Chart: Composition Analysis', fontsize=12)

# Line Chart - Trend
axes[0, 2].plot(months, sales_trend, marker='o', linewidth=2, markersize=8)
axes[0, 2].set_title('Line Chart: Trend Analysis', fontsize=12)
axes[0, 2].set_ylabel('Sales (10k)')
axes[0, 2].fill_between(months, sales_trend, alpha=0.3)

# Histogram - Distribution
np.random.seed(42)
data = np.random.normal(100, 15, 1000)
axes[1, 0].hist(data, bins=30, edgecolor='white', alpha=0.7)
axes[1, 0].set_title('Histogram: Data Distribution', fontsize=12)
axes[1, 0].set_xlabel('Value')
axes[1, 0].set_ylabel('Frequency')

# Scatter Plot - Correlation
x = np.random.rand(100) * 100
y = x * 0.8 + np.random.randn(100) * 10
axes[1, 1].scatter(x, y, alpha=0.6)
axes[1, 1].set_title('Scatter Plot: Variable Correlation', fontsize=12)
axes[1, 1].set_xlabel('Ad Spending')
axes[1, 1].set_ylabel('Sales')

# Box Plot - Distribution Comparison
data_box = [np.random.normal(loc, 10, 100) for loc in [60, 75, 80, 70, 85]]
bp = axes[1, 2].boxplot(data_box, labels=categories, patch_artist=True)
for patch, color in zip(bp['boxes'], sns.color_palette("husl", 5)):
    patch.set_facecolor(color)
axes[1, 2].set_title('Box Plot: Distribution Comparison', fontsize=12)
axes[1, 2].set_ylabel('Score')

plt.tight_layout()
plt.show()
```

### Chart Selection Decision Tree

```
What do you want to show?
|
+-- Compare Data
|   +-- Few categories (<7) -> Bar Chart
|   +-- Many categories -> Horizontal Bar Chart
|   +-- Multi-dimensional comparison -> Radar Chart
|
+-- Show Composition
|   +-- Simple proportions -> Pie/Donut Chart
|   +-- Multi-period composition -> Stacked Bar Chart
|   +-- Hierarchical structure -> Treemap/Sunburst
|
+-- Analyze Trends
|   +-- Single series -> Line Chart
|   +-- Multiple series comparison -> Multi-line Chart
|   +-- Show cumulative -> Area Chart
|
+-- Show Distribution
|   +-- Single variable -> Histogram/Density Plot
|   +-- Group comparison -> Box Plot/Violin Plot
|   +-- Two-dimensional distribution -> 2D Histogram/Contour Plot
|
+-- Explore Correlation
    +-- Two variables -> Scatter Plot
    +-- Three variables -> Bubble Chart
    +-- Multiple variables -> Heatmap/Parallel Coordinates
```

## Matplotlib Deep Dive

Matplotlib is the most fundamental and powerful visualization library in Python. Almost all other visualization libraries are built on top of it.

### Basic Plotting

```python
import matplotlib.pyplot as plt
import numpy as np

# Create figure and axes
fig, ax = plt.subplots(figsize=(10, 6))

# Generate data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Plot curves
ax.plot(x, y1, label='sin(x)', linewidth=2, color='#3498db')
ax.plot(x, y2, label='cos(x)', linewidth=2, color='#e74c3c', linestyle='--')

# Set title and labels
ax.set_title('Sine and Cosine Functions', fontsize=16, fontweight='bold')
ax.set_xlabel('x', fontsize=12)
ax.set_ylabel('y', fontsize=12)

# Add legend
ax.legend(loc='upper right', fontsize=10)

# Add grid
ax.grid(True, alpha=0.3)

# Set axis limits
ax.set_xlim(0, 10)
ax.set_ylim(-1.5, 1.5)

# Add annotation
ax.annotate('Maximum', xy=(np.pi/2, 1), xytext=(np.pi/2 + 1, 1.2),
            arrowprops=dict(arrowstyle='->', color='gray'),
            fontsize=10)

plt.tight_layout()
plt.show()
```

### Subplot Layouts

```python
# Method 1: Using subplots
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Top-left: Line chart
axes[0, 0].plot(np.random.randn(100).cumsum())
axes[0, 0].set_title('Random Walk')

# Top-right: Bar chart
axes[0, 1].bar(['A', 'B', 'C', 'D'], [23, 45, 56, 78])
axes[0, 1].set_title('Bar Chart Example')

# Bottom-left: Scatter plot
axes[1, 0].scatter(np.random.rand(50), np.random.rand(50),
                   c=np.random.rand(50), s=np.random.rand(50)*500,
                   alpha=0.6, cmap='viridis')
axes[1, 0].set_title('Scatter Plot Example')

# Bottom-right: Histogram
axes[1, 1].hist(np.random.randn(1000), bins=30, edgecolor='white')
axes[1, 1].set_title('Histogram Example')

plt.tight_layout()
plt.show()

# Method 2: Using GridSpec for unequal subplot sizes
from matplotlib.gridspec import GridSpec

fig = plt.figure(figsize=(12, 8))
gs = GridSpec(3, 3, figure=fig)

# Large plot occupying left 2x2 area
ax1 = fig.add_subplot(gs[0:2, 0:2])
ax1.plot(np.random.randn(100).cumsum(), linewidth=2)
ax1.set_title('Main Plot: Random Walk', fontsize=14)

# Two small plots on the right
ax2 = fig.add_subplot(gs[0, 2])
ax2.bar(['Q1', 'Q2', 'Q3', 'Q4'], [120, 145, 132, 165])
ax2.set_title('Quarterly Sales')

ax3 = fig.add_subplot(gs[1, 2])
ax3.pie([30, 25, 25, 20], labels=['A', 'B', 'C', 'D'], autopct='%1.0f%%')
ax3.set_title('Market Share')

# Long plot at the bottom
ax4 = fig.add_subplot(gs[2, :])
ax4.fill_between(range(50), np.random.rand(50)*100, alpha=0.5)
ax4.set_title('Trend Area Chart')

plt.tight_layout()
plt.show()
```

### Style Customization

```python
# Custom style configuration
custom_style = {
    'figure.figsize': (10, 6),
    'figure.dpi': 100,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'axes.grid': True,
    'grid.alpha': 0.3
}

with plt.rc_context(custom_style):
    fig, ax = plt.subplots()

    x = np.arange(5)
    categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
    values1 = [25, 32, 28, 35, 30]
    values2 = [22, 28, 25, 30, 27]

    width = 0.35
    ax.bar(x - width/2, values1, width, label='2023', color='#3498db')
    ax.bar(x + width/2, values2, width, label='2024', color='#e74c3c')

    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.set_ylabel('Sales (10k)')
    ax.set_title('Annual Sales Comparison')
    ax.legend()

    plt.tight_layout()
    plt.show()
```

## Seaborn Statistical Plots

Seaborn is a statistical visualization library built on Matplotlib, providing more attractive default styles and convenient statistical chart plotting functions.

### Distribution Visualization

```python
import seaborn as sns

# Load sample dataset
tips = sns.load_dataset('tips')

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Histogram + KDE
sns.histplot(data=tips, x='total_bill', kde=True, ax=axes[0, 0])
axes[0, 0].set_title('Bill Amount Distribution')

# Kernel Density Estimation
sns.kdeplot(data=tips, x='total_bill', hue='time', fill=True, ax=axes[0, 1])
axes[0, 1].set_title('Bill Distribution by Time')

# Box Plot
sns.boxplot(data=tips, x='day', y='total_bill', hue='sex', ax=axes[1, 0])
axes[1, 0].set_title('Bill Box Plot by Day')

# Violin Plot
sns.violinplot(data=tips, x='day', y='total_bill', hue='sex', split=True, ax=axes[1, 1])
axes[1, 1].set_title('Bill Violin Plot')

plt.tight_layout()
plt.show()
```

### Relationship Visualization

```python
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Scatter plot with regression line
sns.regplot(data=tips, x='total_bill', y='tip', ax=axes[0])
axes[0].set_title('Relationship Between Bill and Tip')

# Multi-dimensional scatter plot
sns.scatterplot(data=tips, x='total_bill', y='tip', hue='day',
                size='size', sizes=(20, 200), ax=axes[1])
axes[1].set_title('Multi-dimensional Scatter Plot')

plt.tight_layout()
plt.show()

# Joint distribution plot (separate figure)
g = sns.jointplot(data=tips, x='total_bill', y='tip', kind='hex')
g.fig.suptitle('Joint Distribution Plot', y=1.02)
plt.show()

# Pair plot (separate figure)
iris = sns.load_dataset('iris')
g = sns.pairplot(iris, hue='species', diag_kind='kde')
g.fig.suptitle('Iris Features Pairwise Relationships', y=1.02)
plt.show()
```

### Categorical Data Visualization

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Bar plot with error bars
sns.barplot(data=tips, x='day', y='total_bill', hue='sex',
            errorbar='sd', ax=axes[0, 0])
axes[0, 0].set_title('Average Bill (with Standard Deviation)')

# Count plot
sns.countplot(data=tips, x='day', hue='time', ax=axes[0, 1])
axes[0, 1].set_title('Order Count by Day')

# Point plot
sns.pointplot(data=tips, x='day', y='total_bill', hue='sex',
              markers=['o', 's'], linestyles=['-', '--'], ax=axes[1, 0])
axes[1, 0].set_title('Bill Point Plot')

# Strip plot (jittered scatter)
sns.stripplot(data=tips, x='day', y='total_bill', hue='time',
              dodge=True, alpha=0.7, ax=axes[1, 1])
axes[1, 1].set_title('Categorical Scatter Plot')

plt.tight_layout()
plt.show()
```

### Heatmaps

```python
# Correlation heatmap
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Calculate correlation coefficients
iris = sns.load_dataset('iris')
corr = iris.drop('species', axis=1).corr()

# Basic heatmap
sns.heatmap(corr, annot=True, cmap='coolwarm', center=0, ax=axes[0])
axes[0].set_title('Correlation Coefficient Heatmap')

# Masked heatmap (lower triangle only)
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, annot=True, cmap='RdYlBu_r',
            center=0, square=True, linewidths=0.5, ax=axes[1])
axes[1].set_title('Lower Triangle Correlation Matrix')

plt.tight_layout()
plt.show()
```

## Plotly Interactive Charts

Plotly is a powerful interactive visualization library, particularly suitable for creating charts that can be interacted with on web pages.

### Basic Interactive Charts

```python
import plotly.express as px
import plotly.graph_objects as go

# Use Plotly Express for quick chart creation
df = px.data.gapminder()
df_2007 = df[df['year'] == 2007]

# Interactive scatter plot
fig = px.scatter(df_2007, x='gdpPercap', y='lifeExp',
                 size='pop', color='continent',
                 hover_name='country',
                 log_x=True,
                 size_max=60,
                 title='GDP per Capita vs Life Expectancy (2007)')
fig.show()

# Animated scatter plot (by year)
fig = px.scatter(df, x='gdpPercap', y='lifeExp',
                 animation_frame='year',
                 animation_group='country',
                 size='pop', color='continent',
                 hover_name='country',
                 log_x=True,
                 size_max=60,
                 range_x=[100, 100000],
                 range_y=[25, 90],
                 title='Global Development Trends (1952-2007)')
fig.show()
```

### Advanced Chart Types

```python
# Interactive line chart
df_usa = df[df['country'] == 'United States']
fig = px.line(df_usa, x='year', y='gdpPercap',
              title='US GDP per Capita Over Time',
              markers=True)
fig.update_traces(line_width=3, marker_size=10)
fig.show()

# 3D scatter plot
fig = px.scatter_3d(df_2007, x='gdpPercap', y='lifeExp', z='pop',
                    color='continent',
                    hover_name='country',
                    log_x=True, log_z=True,
                    title='3D Country Development Indicators')
fig.show()

# Choropleth map
fig = px.choropleth(df_2007,
                    locations='iso_alpha',
                    color='lifeExp',
                    hover_name='country',
                    color_continuous_scale='Viridis',
                    title='Global Life Expectancy Distribution')
fig.show()

# Treemap
fig = px.treemap(df_2007, path=['continent', 'country'],
                 values='pop',
                 color='lifeExp',
                 color_continuous_scale='RdYlGn',
                 title='Global Population Distribution Treemap')
fig.show()
```

### Custom Charts with Graph Objects

```python
# Using Graph Objects for fine-grained control
fig = go.Figure()

# Add multiple traces
categories = ['Sales', 'Marketing', 'R&D', 'Operations', 'HR']
values_2023 = [85, 72, 90, 68, 75]
values_2024 = [90, 80, 88, 75, 82]

fig.add_trace(go.Scatterpolar(
    r=values_2023,
    theta=categories,
    fill='toself',
    name='2023'
))

fig.add_trace(go.Scatterpolar(
    r=values_2024,
    theta=categories,
    fill='toself',
    name='2024'
))

fig.update_layout(
    polar=dict(
        radialaxis=dict(visible=True, range=[0, 100])
    ),
    showlegend=True,
    title='Department Performance Radar Chart'
)

fig.show()

# Funnel chart
stages = ['Visit Website', 'Browse Products', 'Add to Cart', 'Start Checkout', 'Complete Purchase']
values = [10000, 6500, 3200, 1800, 950]

fig = go.Figure(go.Funnel(
    y=stages,
    x=values,
    textposition="inside",
    textinfo="value+percent initial",
    marker=dict(color=["#3498db", "#2ecc71", "#f1c40f", "#e74c3c", "#9b59b6"])
))

fig.update_layout(title='E-commerce Conversion Funnel')
fig.show()
```

## Color and Design Principles

Color is one of the most important visual elements in data visualization. Using color correctly can significantly enhance the readability and aesthetics of charts.

### Color Types

```python
import matplotlib.colors as mcolors

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Sequential palette - for continuous data
cmap_seq = plt.cm.Blues
gradient = np.linspace(0, 1, 256).reshape(1, -1)
axes[0].imshow(gradient, aspect='auto', cmap=cmap_seq)
axes[0].set_title('Sequential Palette: Expressing Magnitude')
axes[0].set_yticks([])

# Diverging palette - for data with a center point
cmap_div = plt.cm.RdYlBu_r
axes[1].imshow(gradient, aspect='auto', cmap=cmap_div)
axes[1].set_title('Diverging Palette: Expressing Deviation')
axes[1].set_yticks([])

# Qualitative palette - for categorical data
colors = plt.cm.Set2(np.linspace(0, 1, 8))
for i, color in enumerate(colors):
    axes[2].axvspan(i, i+1, color=color)
axes[2].set_title('Qualitative Palette: Distinguishing Categories')
axes[2].set_xlim(0, 8)
axes[2].set_yticks([])

plt.tight_layout()
plt.show()
```

### Color Selection Best Practices

```python
# Creating colorblind-friendly color schemes
colorblind_palette = ['#0077BB', '#33BBEE', '#009988', '#EE7733', '#CC3311', '#EE3377', '#BBBBBB']

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Not recommended: Red-green color scheme (not colorblind-friendly)
categories = ['A', 'B', 'C', 'D', 'E']
values = [30, 25, 20, 15, 10]

axes[0].pie(values, labels=categories, colors=['red', 'green', 'blue', 'yellow', 'purple'],
            autopct='%1.0f%%')
axes[0].set_title('Not Recommended: Red-Green (Not Colorblind-Friendly)')

# Recommended: Colorblind-friendly palette
axes[1].pie(values, labels=categories, colors=colorblind_palette[:5],
            autopct='%1.0f%%')
axes[1].set_title('Recommended: Colorblind-Friendly Palette')

plt.tight_layout()
plt.show()

# Using Seaborn's colorblind-friendly palettes
print("Seaborn colorblind-friendly palettes:")
palettes = ['colorblind', 'deep', 'muted', 'bright']

fig, axes = plt.subplots(1, 4, figsize=(16, 2))
for ax, palette in zip(axes, palettes):
    colors = sns.color_palette(palette, 8)
    for i, color in enumerate(colors):
        ax.axvspan(i, i+1, color=color)
    ax.set_title(f'{palette}')
    ax.set_xlim(0, 8)
    ax.set_yticks([])
plt.tight_layout()
plt.show()
```

### Design Principles Summary

1. **Maintain Consistency**: Use a unified color scheme within the same report/dashboard
2. **Highlight Key Points**: Use contrasting colors to emphasize critical data points
3. **Consider Colorblindness**: Avoid relying solely on red-green differentiation; use shapes and labels as supplements
4. **Limit Color Count**: Typically no more than 5-7 colors
5. **Leverage Gray**: Set secondary elements to gray to highlight primary information

## Dashboard Design

A dashboard is a comprehensive display interface that integrates multiple visualization components, used for real-time monitoring and decision support.

### Dashboard Design Principles

```python
from matplotlib.gridspec import GridSpec

# Create a simple dashboard layout
fig = plt.figure(figsize=(16, 10))
gs = GridSpec(3, 4, figure=fig, hspace=0.3, wspace=0.3)

# Simulated data
np.random.seed(42)
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
revenue = [120, 135, 148, 165, 158, 180]
costs = [80, 85, 90, 95, 92, 100]
profit = [r - c for r, c in zip(revenue, costs)]

# KPI card area (top)
kpi_data = [
    ('Total Revenue', '$906K', '+15.2%', '#3498db'),
    ('Net Profit', '$364K', '+12.8%', '#2ecc71'),
    ('Customers', '15,234', '+8.5%', '#9b59b6'),
    ('Conversion', '23.5%', '+2.3%', '#e74c3c')
]

for i, (title, value, change, color) in enumerate(kpi_data):
    ax = fig.add_subplot(gs[0, i])
    ax.text(0.5, 0.7, value, fontsize=24, fontweight='bold',
            ha='center', va='center', transform=ax.transAxes)
    ax.text(0.5, 0.35, title, fontsize=12, ha='center',
            va='center', transform=ax.transAxes, color='gray')
    ax.text(0.5, 0.15, change, fontsize=14, ha='center',
            va='center', transform=ax.transAxes,
            color='green' if change.startswith('+') else 'red')
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, fill=False,
                                edgecolor=color, linewidth=3,
                                transform=ax.transAxes))

# Main trend chart (middle-left)
ax_main = fig.add_subplot(gs[1, :2])
ax_main.plot(months, revenue, marker='o', linewidth=2, label='Revenue', color='#3498db')
ax_main.plot(months, costs, marker='s', linewidth=2, label='Costs', color='#e74c3c')
ax_main.fill_between(months, costs, revenue, alpha=0.3, color='#2ecc71', label='Profit')
ax_main.set_title('Revenue and Cost Trends', fontsize=14, fontweight='bold')
ax_main.legend(loc='upper left')
ax_main.set_ylabel('Amount (10k)')
ax_main.grid(True, alpha=0.3)

# Pie chart (middle-right-top)
ax_pie = fig.add_subplot(gs[1, 2])
products = ['Product A', 'Product B', 'Product C', 'Product D']
sales = [35, 28, 22, 15]
ax_pie.pie(sales, labels=products, autopct='%1.0f%%',
           colors=sns.color_palette("husl", 4))
ax_pie.set_title('Product Sales Share', fontsize=12, fontweight='bold')

# Bar chart (middle-right-bottom)
ax_bar = fig.add_subplot(gs[1, 3])
regions = ['East', 'North', 'South', 'West']
region_sales = [42, 28, 35, 25]
bars = ax_bar.barh(regions, region_sales, color=sns.color_palette("Blues_r", 4))
ax_bar.set_title('Regional Sales Distribution', fontsize=12, fontweight='bold')
ax_bar.set_xlabel('Sales (10k)')

# Bottom table area
ax_table = fig.add_subplot(gs[2, :])
ax_table.axis('off')

table_data = [
    ['Product', 'Units Sold', 'Revenue', 'YoY Growth', 'Status'],
    ['Product A', '1,234', '$156K', '+12%', 'Normal'],
    ['Product B', '987', '$128K', '+8%', 'Normal'],
    ['Product C', '756', '$98K', '-3%', 'Watch'],
    ['Product D', '543', '$67K', '+15%', 'Good'],
]

table = ax_table.table(cellText=table_data,
                       loc='center',
                       cellLoc='center',
                       colWidths=[0.15, 0.15, 0.15, 0.15, 0.15])
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.8)

# Style header row
for i in range(5):
    table[(0, i)].set_facecolor('#3498db')
    table[(0, i)].set_text_props(color='white', fontweight='bold')

plt.suptitle('Sales Data Dashboard', fontsize=18, fontweight='bold', y=0.98)
plt.tight_layout(rect=[0, 0, 1, 0.96])
plt.show()
```

### Dashboard Design Key Points

1. **Information Hierarchy**: Place the most important KPIs in the most prominent position (usually top-left or top)
2. **Visual Flow**: Guide users to browse in F-pattern or Z-pattern
3. **White Space**: Use appropriate white space to avoid information overload
4. **Interaction Design**: Provide filtering, drill-down, and other interactive features
5. **Responsive Design**: Adapt to different screen sizes

## Data Storytelling

Data storytelling is the technique of presenting data analysis results in a narrative manner, making it easier for audiences to understand and remember key information.

### Story Structure

```python
# Creating a data story example
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Simulated e-commerce data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=12, freq='M')
revenue = [100, 95, 110, 125, 140, 155, 145, 160, 175, 190, 185, 210]
new_customers = [500, 480, 520, 580, 650, 700, 680, 720, 800, 850, 830, 900]

# Setting the Scene - Overall Trend
axes[0, 0].plot(dates, revenue, marker='o', linewidth=2, color='#3498db')
axes[0, 0].fill_between(dates, revenue, alpha=0.3)
axes[0, 0].set_title('Chapter 1: Annual Revenue Shows Continuous Growth', fontsize=12, fontweight='bold')
axes[0, 0].set_ylabel('Monthly Revenue (10k)')
axes[0, 0].axhline(y=np.mean(revenue), color='red', linestyle='--', label=f'Average: {np.mean(revenue):.0f}k')
axes[0, 0].legend()
axes[0, 0].annotate('Starting Point', xy=(dates[0], revenue[0]),
                    xytext=(dates[1], revenue[0]+20),
                    arrowprops=dict(arrowstyle='->', color='gray'))
axes[0, 0].annotate('End: 110% Growth', xy=(dates[-1], revenue[-1]),
                    xytext=(dates[-3], revenue[-1]+10),
                    arrowprops=dict(arrowstyle='->', color='gray'))

# Conflict/Turning Point - Discovering Problems
monthly_growth = [0] + [(revenue[i]-revenue[i-1])/revenue[i-1]*100 for i in range(1, len(revenue))]
colors = ['#e74c3c' if g < 0 else '#2ecc71' for g in monthly_growth]
axes[0, 1].bar(range(12), monthly_growth, color=colors)
axes[0, 1].set_xticks(range(12))
axes[0, 1].set_xticklabels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
axes[0, 1].axhline(y=0, color='black', linewidth=0.5)
axes[0, 1].set_title('Chapter 2: Discovering Growth Slowdown Signals', fontsize=12, fontweight='bold')
axes[0, 1].set_ylabel('MoM Growth Rate (%)')
# Mark problem months
problem_months = [i for i, g in enumerate(monthly_growth) if g < 0]
for m in problem_months:
    axes[0, 1].annotate('Decline!', xy=(m, monthly_growth[m]),
                        xytext=(m, monthly_growth[m]-3),
                        ha='center', color='red', fontweight='bold')

# Analyzing Causes - New Customer Acquisition
ax3 = axes[1, 0]
ax3.bar(range(12), new_customers, color='#9b59b6', alpha=0.7)
ax3.set_xticks(range(12))
ax3.set_xticklabels(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
ax3.set_title('Chapter 3: New Customers Drive Growth', fontsize=12, fontweight='bold')
ax3.set_ylabel('New Customer Count')

# Add trend line
z = np.polyfit(range(12), new_customers, 1)
p = np.poly1d(z)
ax3.plot(range(12), p(range(12)), color='red', linestyle='--', linewidth=2, label='Trend Line')
ax3.legend()

# Solution and Call to Action
ax4 = axes[1, 1]
actions = ['Increase Marketing', 'Optimize Funnel', 'Boost AOV', 'Improve Retention']
impact = [35, 25, 22, 18]
colors = ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c']

wedges, texts, autotexts = ax4.pie(impact, labels=actions, autopct='%1.0f%%',
                                     colors=colors, explode=[0.05, 0, 0, 0])
ax4.set_title('Chapter 4: Action Plan (Expected Impact)', fontsize=12, fontweight='bold')

plt.suptitle('Data Story: 2024 Business Growth Analysis Report', fontsize=16, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()
```

### Data Storytelling Elements

1. **Hook**: Capture attention with compelling data points or questions
2. **Context**: Provide necessary background information and data sources
3. **Insight**: Reveal key findings from the data
4. **Action**: Propose clear recommendations or action plans based on insights

## Common Mistakes and How to Avoid Them

### Error Examples and Correct Approaches

```python
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# Error 1: Truncated Y-axis
ax = axes[0, 0]
values = [98, 99, 100, 101, 102]
categories = ['A', 'B', 'C', 'D', 'E']
ax.bar(categories, values, color='#e74c3c')
ax.set_ylim(97, 103)  # Truncated Y-axis exaggerates differences
ax.set_title('Error: Truncated Y-axis (Exaggerates Differences)', fontsize=10, color='red')
ax.set_ylabel('Value')

# Correct approach
ax = axes[0, 1]
ax.bar(categories, values, color='#2ecc71')
ax.set_ylim(0, 110)  # Start from 0
ax.set_title('Correct: Y-axis Starts at 0', fontsize=10, color='green')
ax.set_ylabel('Value')

# Error 2: 3D pie chart
ax = axes[0, 2]
ax.text(0.5, 0.5, '3D Pie Chart\n(Distorts proportions)\n\nAvoid using!',
        ha='center', va='center', fontsize=12, color='red',
        transform=ax.transAxes)
ax.set_title('Error: 3D Effects', fontsize=10, color='red')
ax.axis('off')

# Error 3: Too many colors
ax = axes[1, 0]
many_categories = [f'Cat{i}' for i in range(15)]
many_values = np.random.rand(15) * 100
ax.bar(many_categories, many_values, color=plt.cm.tab20(np.linspace(0, 1, 15)))
ax.set_title('Error: Too Many Colors', fontsize=10, color='red')
ax.set_xticklabels(many_categories, rotation=45, ha='right', fontsize=8)

# Correct approach: Group or use gradient
ax = axes[1, 1]
# Keep only top 5 categories, group others as "Other"
top_values = sorted(many_values, reverse=True)[:5]
top_categories = ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5']
other_value = sum(sorted(many_values)[:-5])
ax.bar(top_categories + ['Other'], list(top_values) + [other_value],
       color=sns.color_palette("Blues_r", 6))
ax.set_title('Correct: Consolidate Small Categories', fontsize=10, color='green')

# Error 4: Chart without labels
ax = axes[1, 2]
x = np.random.rand(50)
y = np.random.rand(50)
ax.scatter(x, y)
ax.set_title('Charts Need:\nTitle, Axis Labels, Legend, Data Source', fontsize=10)
ax.set_xlabel('X-axis Label (Unit)')
ax.set_ylabel('Y-axis Label (Unit)')

plt.tight_layout()
plt.show()
```

### Common Mistakes Checklist

| Error Type | Problem Description | Solution |
|------------|---------------------|----------|
| Truncated Y-axis | Exaggerates data differences | Start Y-axis at 0 or clearly label |
| 3D effects | Distorts data proportions | Use 2D charts |
| Too many colors | Hard to distinguish categories | Limit to 5-7 colors |
| Missing labels | Cannot understand meaning | Add complete titles and labels |
| Missing legend | Cannot identify data series | Add clear legend |
| Data overload | Information overwhelm | Simplify or split into multiple charts |
| Disproportionate scales | Misleads readers | Maintain consistent scales |
| Excessive decoration | Distracts attention | Follow data-ink ratio principle |

## Interview Key Points

### Frequently Asked Interview Questions

**1. How do you choose the appropriate chart type?**

```python
"""
Key Points:
1. First clarify data type and analysis purpose
2. Consider audience's comprehension level
3. Follow the "simple and effective" principle

Decision Framework:
- Comparison -> Bar chart/Column chart
- Trend -> Line chart
- Composition -> Pie chart/Stacked chart
- Distribution -> Histogram/Box plot
- Correlation -> Scatter plot/Heatmap
"""

# Example: Recommend chart based on analysis purpose
def recommend_chart(data_type, analysis_purpose):
    recommendations = {
        ('categorical', 'comparison'): 'Bar chart or Column chart',
        ('time_series', 'trend'): 'Line chart or Area chart',
        ('proportional', 'composition'): 'Pie chart or Stacked bar chart',
        ('numerical', 'distribution'): 'Histogram or Box plot',
        ('bivariate', 'correlation'): 'Scatter plot or Heatmap',
    }
    return recommendations.get((data_type, analysis_purpose), 'Requires further analysis')
```

**2. Explain what Data-Ink Ratio is?**

```python
"""
Data-Ink Ratio = Data Ink / Total Ink

Core Concept:
- Maximize the proportion of "ink" used to display data
- Reduce decorative, non-data visual elements
- Every visual element should have meaning

Practical Methods:
1. Remove unnecessary borders and backgrounds
2. Reduce grid line prominence
3. Avoid 3D effects and shadows
4. Use clear labels instead of legends (when feasible)
"""
```

**3. How do you handle visualization with large datasets?**

```python
"""
Strategies:
1. Data sampling: Random or stratified sampling to reduce data points
2. Data aggregation: Aggregate by time/category before display
3. Faceted display: Split data into multiple subplots
4. Use heatmaps or density plots instead of scatter plots
5. Interactive filtering: Allow users to customize viewing range
"""

# Example: Handling large dataset scatter plots
import numpy as np

# Original data: 1 million points
n = 1000000
x = np.random.randn(n)
y = np.random.randn(n)

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Method 1: Sampling
sample_idx = np.random.choice(n, 5000, replace=False)
axes[0].scatter(x[sample_idx], y[sample_idx], alpha=0.3, s=10)
axes[0].set_title('Method 1: Random Sampling (5000 points)')

# Method 2: 2D Histogram
axes[1].hist2d(x, y, bins=50, cmap='Blues')
axes[1].set_title('Method 2: 2D Histogram')

# Method 3: Kernel Density Estimation
from scipy import stats
xx, yy = np.mgrid[-4:4:100j, -4:4:100j]
positions = np.vstack([xx.ravel(), yy.ravel()])
kernel = stats.gaussian_kde(np.vstack([x[:10000], y[:10000]]))
f = np.reshape(kernel(positions).T, xx.shape)
axes[2].contourf(xx, yy, f, cmap='Blues')
axes[2].set_title('Method 3: Kernel Density Estimation')

plt.tight_layout()
plt.show()
```

**4. What are the differences between Matplotlib, Seaborn, and Plotly?**

```python
"""
Matplotlib:
- Pros: Most fundamental, highly flexible, fully customizable
- Cons: Verbose code, plain default styles
- Best for: Fine-grained control, generating static images

Seaborn:
- Pros: Beautiful default styles, easy statistical charts
- Cons: Less flexible
- Best for: Statistical analysis, quick data exploration

Plotly:
- Pros: Interactive, web support, animations
- Cons: Large file sizes, steeper learning curve
- Best for: Dashboards, web applications, presentations

Selection Guidelines:
- Exploratory analysis -> Seaborn
- Fine customization -> Matplotlib
- Interactive display -> Plotly
"""
```

**5. How do you design an effective dashboard?**

```python
"""
Design Principles:
1. Clarify target audience and use cases
2. Highlight key metrics (KPIs)
3. Follow visual hierarchy (F-pattern or Z-pattern layout)
4. Maintain consistent design style
5. Provide appropriate interactive features

Layout Recommendations:
- Top/Top-left: Most important KPI cards
- Middle: Main trend charts
- Sidebar: Secondary analysis charts
- Bottom: Detailed data tables

Interaction Design:
- Time range filtering
- Dimension drill-down
- Data export functionality
"""
```

### Practical Code Template

```python
# Universal visualization function template
def create_professional_chart(data, chart_type='bar', title='',
                               xlabel='', ylabel='', figsize=(10, 6)):
    """
    Create a professional chart

    Parameters:
    -----------
    data : dict or DataFrame
        Chart data
    chart_type : str
        Chart type ('bar', 'line', 'scatter', 'pie')
    title : str
        Chart title
    xlabel, ylabel : str
        Axis labels
    figsize : tuple
        Figure size

    Returns:
    --------
    fig, ax : matplotlib objects
    """

    # Set style
    plt.style.use('seaborn-v0_8-whitegrid')
    fig, ax = plt.subplots(figsize=figsize)

    # Prepare data based on input type
    if isinstance(data, dict):
        x = list(data.keys())
        y = list(data.values())
    else:
        x = data.index
        y = data.values

    if chart_type == 'bar':
        ax.bar(x, y, color='#3498db', edgecolor='white')
    elif chart_type == 'line':
        ax.plot(x, y, marker='o', linewidth=2, color='#3498db')
    elif chart_type == 'scatter':
        ax.scatter(x, y, s=100, alpha=0.6, color='#3498db')

    # Beautification
    ax.set_title(title, fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel(xlabel, fontsize=12)
    ax.set_ylabel(ylabel, fontsize=12)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    plt.tight_layout()
    return fig, ax

# Usage example
data = {'Q1': 120, 'Q2': 145, 'Q3': 132, 'Q4': 168}
fig, ax = create_professional_chart(
    data,
    chart_type='bar',
    title='2024 Quarterly Sales',
    xlabel='Quarter',
    ylabel='Sales (10k)'
)
plt.show()
```

## Summary

Data visualization is an indispensable skill in data analysis and data science. We've covered a complete knowledge system from basic principles to advanced applications:

1. **Understand Principles**: Master core theories such as data-ink ratio and visual encoding
2. **Choose Charts**: Select appropriate charts based on data type and analysis purpose
3. **Master Tools**: Proficiently use the three major libraries: Matplotlib, Seaborn, and Plotly
4. **Design Aesthetics**: Apply color theory and design principles to enhance chart quality
5. **Tell Stories**: Transform data insights into compelling data stories
6. **Avoid Pitfalls**: Identify and avoid common visualization mistakes

Continuous practice is key to mastering data visualization. Start with simple charts, gradually challenge more complex visualization projects, and actively reference excellent visualization works to continuously improve your data visualization skills.

## Further Reading

- **Recommended Books**:
  - "The Visual Display of Quantitative Information" by Edward Tufte
  - "Storytelling with Data" by Cole Nussbaumer Knaflic
  - "Data Visualization: A Practical Introduction" by Kieran Healy
  - "Fundamentals of Data Visualization" by Claus O. Wilke

- **Online Resources**:
  - [Matplotlib Official Documentation](https://matplotlib.org/stable/contents.html)
  - [Seaborn Official Tutorial](https://seaborn.pydata.org/tutorial.html)
  - [Plotly Official Examples Gallery](https://plotly.com/python/)
  - [D3.js Gallery](https://observablehq.com/@d3/gallery)

- **Practice Platforms**:
  - [Kaggle Data Visualization Competitions](https://www.kaggle.com/competitions)
  - [Observable Visualization Community](https://observablehq.com/)
  - [Tableau Public Gallery](https://public.tableau.com/app/discover)
  - [Information is Beautiful Awards](https://www.informationisbeautifulawards.com/)

- **Color Tools**:
  - [ColorBrewer](https://colorbrewer2.org/) - Color schemes for maps and data visualization
  - [Coolors](https://coolors.co/) - Color palette generator
  - [Adobe Color](https://color.adobe.com/) - Color wheel and palette tools
