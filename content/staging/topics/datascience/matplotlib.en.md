---
title: Matplotlib Data Visualization
description: Create data visualization charts with Matplotlib
track: datascience
section: python-stack
difficulty: beginner
tags:
  - Matplotlib
  - visualization
  - Python
  - charts
status: imported
origin: old/src/content/docs/data/matplotlib.en.md
divergence: 0.196
issues: []
legacy:
  category: Data
  subcategory: Visualization
  order: 26
  lastUpdated: 2026-01-07
---

Matplotlib is the foundational plotting library for Python, providing a comprehensive framework for creating static, animated, and interactive visualizations. As the backbone of Python's visualization ecosystem, Matplotlib offers fine-grained control over every aspect of a figure, from basic line plots to complex multi-panel figures.

## Why Choose Matplotlib?

### Key Advantages

1. **Complete control**: Fine-grained customization of every plot element
2. **Publication quality**: Generate high-resolution figures suitable for academic publications
3. **Extensive ecosystem**: Foundation for Seaborn, Pandas plotting, and many other libraries
4. **Multiple backends**: Support for interactive notebooks, GUI applications, and static file output
5. **Wide format support**: Export to PNG, PDF, SVG, EPS, and many other formats

```python
import matplotlib.pyplot as plt
import numpy as np

# Check Matplotlib version
import matplotlib
print(matplotlib.__version__)

# Simple plot example
x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.plot(x, y)
plt.title('Simple Sine Wave')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.show()
```

---

## Matplotlib Basics

### The Two Interfaces

Matplotlib provides two main interfaces for creating plots:

1. **pyplot interface**: State-based interface similar to MATLAB, good for quick plots
2. **Object-oriented interface**: More explicit control, recommended for complex figures

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

# pyplot interface (implicit)
plt.figure(figsize=(10, 6))
plt.plot(x, y)
plt.title('Using pyplot interface')
plt.show()

# Object-oriented interface (explicit)
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(x, y)
ax.set_title('Using OO interface')
plt.show()
```

### Basic Plot Structure

Every Matplotlib figure follows a hierarchical structure:

```python
# Figure: The overall window/page
# Axes: The actual plot area (a figure can have multiple axes)
# Axis: The x-axis and y-axis
# Artists: Everything visible on the figure (lines, text, labels, etc.)

fig, ax = plt.subplots()

# Figure-level operations
fig.suptitle('Figure Title')
fig.set_size_inches(10, 6)

# Axes-level operations
ax.set_title('Axes Title')
ax.set_xlabel('X Label')
ax.set_ylabel('Y Label')

# Plot data
x = np.linspace(0, 10, 50)
ax.plot(x, np.sin(x), label='sin(x)')
ax.legend()

plt.show()
```

### Saving Figures

```python
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])

# Save to different formats
fig.savefig('plot.png', dpi=300)           # PNG with high resolution
fig.savefig('plot.pdf')                     # PDF for publications
fig.savefig('plot.svg')                     # SVG for web
fig.savefig('plot.png',
            dpi=300,
            bbox_inches='tight',            # Trim whitespace
            facecolor='white',              # Background color
            transparent=False)              # Transparency

plt.close(fig)  # Close figure to free memory
```

---

## Figure and Axes

### Creating Figures

```python
import matplotlib.pyplot as plt
import numpy as np

# Method 1: plt.figure()
fig = plt.figure(figsize=(12, 8), dpi=100)
ax = fig.add_subplot(111)  # 1 row, 1 col, first plot

# Method 2: plt.subplots() - recommended
fig, ax = plt.subplots(figsize=(12, 8))

# Method 3: Multiple subplots
fig, axes = plt.subplots(2, 3, figsize=(15, 10))  # 2 rows, 3 columns

# Access individual axes
axes[0, 0].plot([1, 2, 3])  # Top-left
axes[1, 2].plot([3, 2, 1])  # Bottom-right

plt.tight_layout()  # Adjust spacing
plt.show()
```

### Figure Properties

```python
fig, ax = plt.subplots()

# Figure size and resolution
fig.set_size_inches(12, 8)
fig.set_dpi(150)

# Figure background
fig.set_facecolor('lightgray')

# Figure title
fig.suptitle('Main Title', fontsize=16, fontweight='bold', y=1.02)

# Adjust subplot parameters
fig.subplots_adjust(
    left=0.1,    # Left margin
    right=0.9,   # Right margin
    top=0.9,     # Top margin
    bottom=0.1,  # Bottom margin
    wspace=0.2,  # Width space between subplots
    hspace=0.3   # Height space between subplots
)

plt.show()
```

### Axes Configuration

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x))

# Axes title and labels
ax.set_title('Sine Wave', fontsize=14, pad=20)
ax.set_xlabel('Time (s)', fontsize=12)
ax.set_ylabel('Amplitude', fontsize=12)

# Axes limits
ax.set_xlim(0, 10)
ax.set_ylim(-1.5, 1.5)

# Axes aspect ratio
ax.set_aspect('equal')  # Equal scaling
ax.set_aspect(0.5)      # Custom ratio

# Axes background
ax.set_facecolor('#f0f0f0')

# Grid
ax.grid(True, linestyle='--', alpha=0.7)

# Spine visibility
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.show()
```

### Ticks and Labels

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 2*np.pi, 100)
ax.plot(x, np.sin(x))

# Custom tick positions
ax.set_xticks([0, np.pi/2, np.pi, 3*np.pi/2, 2*np.pi])

# Custom tick labels
ax.set_xticklabels(['0', r'$\frac{\pi}{2}$', r'$\pi$',
                    r'$\frac{3\pi}{2}$', r'$2\pi$'])

# Tick parameters
ax.tick_params(axis='both', which='major', labelsize=12)
ax.tick_params(axis='x', rotation=45)

# Minor ticks
ax.minorticks_on()
ax.tick_params(axis='both', which='minor', length=4)

plt.show()
```

---

## Plot Types

### Line Plots

```python
import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

x = np.linspace(0, 10, 100)

# Basic line plot
axes[0, 0].plot(x, np.sin(x))
axes[0, 0].set_title('Basic Line Plot')

# Multiple lines with styling
axes[0, 1].plot(x, np.sin(x), 'r-', label='sin(x)', linewidth=2)
axes[0, 1].plot(x, np.cos(x), 'b--', label='cos(x)', linewidth=2)
axes[0, 1].legend()
axes[0, 1].set_title('Multiple Lines')

# Line with markers
axes[1, 0].plot(x[::10], np.sin(x[::10]), 'go-',
                markersize=8, markerfacecolor='yellow')
axes[1, 0].set_title('Line with Markers')

# Step plot
axes[1, 1].step(x[::5], np.sin(x[::5]), where='mid', label='step')
axes[1, 1].plot(x, np.sin(x), 'r--', alpha=0.5, label='original')
axes[1, 1].legend()
axes[1, 1].set_title('Step Plot')

plt.tight_layout()
plt.show()
```

### Scatter Plots

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

np.random.seed(42)
x = np.random.randn(100)
y = np.random.randn(100)
colors = np.random.rand(100)
sizes = np.abs(np.random.randn(100)) * 200

# Basic scatter
axes[0].scatter(x, y)
axes[0].set_title('Basic Scatter')

# Colored scatter
scatter = axes[1].scatter(x, y, c=colors, cmap='viridis', alpha=0.7)
plt.colorbar(scatter, ax=axes[1])
axes[1].set_title('Colored Scatter')

# Sized and colored scatter
scatter = axes[2].scatter(x, y, c=colors, s=sizes, cmap='plasma',
                          alpha=0.6, edgecolors='black')
plt.colorbar(scatter, ax=axes[2])
axes[2].set_title('Bubble Chart')

plt.tight_layout()
plt.show()
```

### Bar Charts

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

categories = ['A', 'B', 'C', 'D', 'E']
values1 = [25, 40, 30, 55, 45]
values2 = [30, 35, 40, 50, 35]

# Vertical bar chart
axes[0, 0].bar(categories, values1, color='steelblue', edgecolor='black')
axes[0, 0].set_title('Vertical Bar Chart')
axes[0, 0].set_ylabel('Values')

# Horizontal bar chart
axes[0, 1].barh(categories, values1, color='coral', edgecolor='black')
axes[0, 1].set_title('Horizontal Bar Chart')
axes[0, 1].set_xlabel('Values')

# Grouped bar chart
x = np.arange(len(categories))
width = 0.35
axes[1, 0].bar(x - width/2, values1, width, label='Group 1', color='steelblue')
axes[1, 0].bar(x + width/2, values2, width, label='Group 2', color='coral')
axes[1, 0].set_xticks(x)
axes[1, 0].set_xticklabels(categories)
axes[1, 0].legend()
axes[1, 0].set_title('Grouped Bar Chart')

# Stacked bar chart
axes[1, 1].bar(categories, values1, label='Group 1', color='steelblue')
axes[1, 1].bar(categories, values2, bottom=values1, label='Group 2', color='coral')
axes[1, 1].legend()
axes[1, 1].set_title('Stacked Bar Chart')

plt.tight_layout()
plt.show()
```

### Histograms

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

np.random.seed(42)
data = np.random.randn(1000)
data2 = np.random.randn(1000) + 2

# Basic histogram
axes[0, 0].hist(data, bins=30, color='steelblue', edgecolor='black')
axes[0, 0].set_title('Basic Histogram')

# Histogram with density
axes[0, 1].hist(data, bins=30, density=True, color='coral',
                edgecolor='black', alpha=0.7)
axes[0, 1].set_title('Normalized Histogram')

# Multiple histograms
axes[1, 0].hist(data, bins=30, alpha=0.7, label='Data 1')
axes[1, 0].hist(data2, bins=30, alpha=0.7, label='Data 2')
axes[1, 0].legend()
axes[1, 0].set_title('Overlapping Histograms')

# Cumulative histogram
axes[1, 1].hist(data, bins=50, cumulative=True, density=True,
                histtype='step', linewidth=2)
axes[1, 1].set_title('Cumulative Histogram')

plt.tight_layout()
plt.show()
```

### Pie Charts

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

labels = ['Python', 'JavaScript', 'Java', 'C++', 'Other']
sizes = [35, 25, 20, 12, 8]
explode = (0.05, 0, 0, 0, 0)  # Explode first slice
colors = plt.cm.Set3.colors[:5]

# Basic pie chart
axes[0].pie(sizes, labels=labels, autopct='%1.1f%%', startangle=90)
axes[0].set_title('Basic Pie Chart')

# Styled pie chart
wedges, texts, autotexts = axes[1].pie(
    sizes,
    explode=explode,
    labels=labels,
    colors=colors,
    autopct='%1.1f%%',
    shadow=True,
    startangle=90,
    wedgeprops={'edgecolor': 'black', 'linewidth': 1}
)
axes[1].set_title('Styled Pie Chart')

plt.tight_layout()
plt.show()
```

### Box Plots

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

np.random.seed(42)
data = [np.random.normal(0, std, 100) for std in range(1, 5)]

# Basic box plot
axes[0].boxplot(data, labels=['A', 'B', 'C', 'D'])
axes[0].set_title('Basic Box Plot')

# Styled box plot
bp = axes[1].boxplot(data, labels=['A', 'B', 'C', 'D'],
                     patch_artist=True,
                     notch=True,
                     showmeans=True,
                     meanprops={"marker": "D", "markerfacecolor": "red"})

# Color each box
colors = ['lightblue', 'lightgreen', 'lightyellow', 'lightcoral']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)

axes[1].set_title('Styled Box Plot')

plt.tight_layout()
plt.show()
```

### Heatmaps

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

np.random.seed(42)
data = np.random.rand(10, 10)

# Basic heatmap
im1 = axes[0].imshow(data, cmap='viridis')
plt.colorbar(im1, ax=axes[0])
axes[0].set_title('Basic Heatmap')

# Annotated heatmap
data_small = np.random.rand(5, 5)
im2 = axes[1].imshow(data_small, cmap='YlOrRd')
plt.colorbar(im2, ax=axes[1])

# Add text annotations
for i in range(5):
    for j in range(5):
        text = axes[1].text(j, i, f'{data_small[i, j]:.2f}',
                            ha='center', va='center', color='black')

axes[1].set_title('Annotated Heatmap')

plt.tight_layout()
plt.show()
```

### Contour Plots

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Create data
x = np.linspace(-3, 3, 100)
y = np.linspace(-3, 3, 100)
X, Y = np.meshgrid(x, y)
Z = np.sin(X) * np.cos(Y)

# Contour lines
cs1 = axes[0].contour(X, Y, Z, levels=15, cmap='RdYlBu')
axes[0].clabel(cs1, inline=True, fontsize=8)
axes[0].set_title('Contour Lines')

# Filled contours
cs2 = axes[1].contourf(X, Y, Z, levels=15, cmap='RdYlBu')
plt.colorbar(cs2, ax=axes[1])
axes[1].contour(X, Y, Z, levels=15, colors='black', linewidths=0.5)
axes[1].set_title('Filled Contours')

plt.tight_layout()
plt.show()
```

### Error Bars

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

x = np.arange(1, 6)
y = np.array([2, 4, 3, 5, 4])
yerr = np.array([0.5, 0.8, 0.3, 0.6, 0.4])
xerr = np.array([0.2, 0.3, 0.2, 0.25, 0.2])

# Symmetric error bars
axes[0].errorbar(x, y, yerr=yerr, fmt='o-', capsize=5, capthick=2,
                 ecolor='red', color='blue', markersize=8)
axes[0].set_title('Symmetric Error Bars')

# Asymmetric error bars
yerr_asym = np.array([[0.3, 0.5, 0.2, 0.4, 0.3],  # Lower errors
                       [0.6, 0.9, 0.4, 0.7, 0.5]]) # Upper errors
axes[1].errorbar(x, y, yerr=yerr_asym, xerr=xerr, fmt='s-',
                 capsize=5, color='green', ecolor='gray', markersize=8)
axes[1].set_title('Asymmetric Error Bars')

plt.tight_layout()
plt.show()
```

---

## Customization

### Colors

```python
import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

x = np.linspace(0, 10, 100)

# Named colors
axes[0, 0].plot(x, np.sin(x), color='steelblue', linewidth=2)
axes[0, 0].plot(x, np.cos(x), color='coral', linewidth=2)
axes[0, 0].set_title('Named Colors')

# Hex colors
axes[0, 1].plot(x, np.sin(x), color='#2E86AB', linewidth=2)
axes[0, 1].plot(x, np.cos(x), color='#A23B72', linewidth=2)
axes[0, 1].set_title('Hex Colors')

# RGB/RGBA tuples
axes[1, 0].plot(x, np.sin(x), color=(0.2, 0.4, 0.6), linewidth=2)
axes[1, 0].plot(x, np.cos(x), color=(0.8, 0.2, 0.2, 0.7), linewidth=2)
axes[1, 0].set_title('RGB/RGBA Colors')

# Color cycle
for i in range(5):
    axes[1, 1].plot(x, np.sin(x + i*0.5), linewidth=2, label=f'Shift {i}')
axes[1, 1].legend()
axes[1, 1].set_title('Default Color Cycle')

plt.tight_layout()
plt.show()
```

### Colormaps

```python
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

np.random.seed(42)
data = np.random.rand(10, 10)

# Different colormaps
cmaps = ['viridis', 'plasma', 'coolwarm', 'RdYlBu', 'terrain', 'Set3']

for ax, cmap in zip(axes.flat, cmaps):
    im = ax.imshow(data, cmap=cmap)
    ax.set_title(f'cmap: {cmap}')
    plt.colorbar(im, ax=ax, shrink=0.8)

plt.tight_layout()
plt.show()

# Creating custom colormap
from matplotlib.colors import LinearSegmentedColormap

colors = ['#000428', '#004e92', '#00c6ff', '#0052d4']
custom_cmap = LinearSegmentedColormap.from_list('custom', colors, N=256)

fig, ax = plt.subplots(figsize=(8, 6))
im = ax.imshow(data, cmap=custom_cmap)
plt.colorbar(im, ax=ax)
ax.set_title('Custom Colormap')
plt.show()
```

### Line Styles and Markers

```python
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

x = np.linspace(0, 10, 20)

# Line styles
line_styles = ['-', '--', '-.', ':', (0, (5, 10)), (0, (3, 5, 1, 5))]
for i, ls in enumerate(line_styles):
    axes[0].plot(x, np.sin(x + i*0.3) + i*0.5, linestyle=ls,
                 linewidth=2, label=f'Style {i+1}')
axes[0].legend()
axes[0].set_title('Line Styles')

# Markers
markers = ['o', 's', '^', 'D', 'v', '*', 'p', 'h']
for i, marker in enumerate(markers):
    axes[1].plot(x[::2], np.sin(x[::2] + i*0.3) + i*0.3,
                 marker=marker, markersize=10, linestyle='-',
                 label=f'Marker: {marker}')
axes[1].legend(bbox_to_anchor=(1.05, 1), loc='upper left')
axes[1].set_title('Markers')

plt.tight_layout()
plt.show()
```

### Text and Annotations

```python
fig, ax = plt.subplots(figsize=(12, 8))

x = np.linspace(0, 10, 100)
y = np.sin(x)
ax.plot(x, y, 'b-', linewidth=2)

# Adding text
ax.text(2, 0.8, 'Maximum', fontsize=12, color='red',
        fontweight='bold', ha='center')

ax.text(5, -1.2, r'$y = \sin(x)$', fontsize=14,
        bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

# Annotations with arrows
ax.annotate('Local Max', xy=(np.pi/2, 1), xytext=(2, 1.3),
            arrowprops=dict(arrowstyle='->', color='red'),
            fontsize=12, color='red')

ax.annotate('Local Min', xy=(3*np.pi/2, -1), xytext=(6, -0.7),
            arrowprops=dict(facecolor='black', shrink=0.05,
                          width=2, headwidth=8),
            fontsize=12)

# Fancy annotation
ax.annotate('Zero Crossing', xy=(np.pi, 0), xytext=(4, 0.5),
            arrowprops=dict(arrowstyle='fancy',
                          connectionstyle='arc3,rad=0.3',
                          fc='cyan'),
            bbox=dict(boxstyle='round,pad=0.3', fc='yellow', alpha=0.7),
            fontsize=11)

ax.set_title('Text and Annotations Example', fontsize=14)
plt.show()
```

### Legends

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

x = np.linspace(0, 10, 100)

# Basic legend
axes[0, 0].plot(x, np.sin(x), label='sin(x)')
axes[0, 0].plot(x, np.cos(x), label='cos(x)')
axes[0, 0].legend()
axes[0, 0].set_title('Basic Legend')

# Legend position
axes[0, 1].plot(x, np.sin(x), label='sin(x)')
axes[0, 1].plot(x, np.cos(x), label='cos(x)')
axes[0, 1].legend(loc='upper right')  # or 'lower left', 'center', etc.
axes[0, 1].set_title('Legend Position')

# Legend outside plot
axes[1, 0].plot(x, np.sin(x), label='sin(x)')
axes[1, 0].plot(x, np.cos(x), label='cos(x)')
axes[1, 0].legend(bbox_to_anchor=(1.05, 1), loc='upper left')
axes[1, 0].set_title('Legend Outside')

# Styled legend
axes[1, 1].plot(x, np.sin(x), label='sin(x)')
axes[1, 1].plot(x, np.cos(x), label='cos(x)')
axes[1, 1].legend(
    loc='upper right',
    frameon=True,
    fancybox=True,
    shadow=True,
    framealpha=0.9,
    facecolor='white',
    edgecolor='gray',
    fontsize=12,
    title='Functions',
    title_fontsize=14
)
axes[1, 1].set_title('Styled Legend')

plt.tight_layout()
plt.show()
```

### Styles and Themes

```python
import matplotlib.pyplot as plt
import numpy as np

# List available styles
print(plt.style.available)

# Example with different styles
styles = ['default', 'seaborn-v0_8', 'ggplot', 'dark_background']

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

x = np.linspace(0, 10, 100)

for ax, style in zip(axes.flat, styles):
    with plt.style.context(style):
        ax.plot(x, np.sin(x), linewidth=2)
        ax.plot(x, np.cos(x), linewidth=2)
        ax.set_title(f'Style: {style}')
        ax.grid(True)

plt.tight_layout()
plt.show()

# Setting a global style
# plt.style.use('seaborn-v0_8-whitegrid')
```

### Custom rcParams

```python
import matplotlib.pyplot as plt
import numpy as np

# Customize default parameters
plt.rcParams.update({
    'figure.figsize': (10, 6),
    'figure.dpi': 100,
    'axes.titlesize': 14,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'lines.linewidth': 2,
    'lines.markersize': 8,
    'axes.grid': True,
    'grid.alpha': 0.3,
    'font.family': 'sans-serif',
})

# Now all plots will use these settings
x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x), label='sin(x)')
plt.plot(x, np.cos(x), label='cos(x)')
plt.title('Plot with Custom rcParams')
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.legend()
plt.show()

# Reset to defaults
plt.rcParams.update(plt.rcParamsDefault)
```

---

## Subplots

### Basic Subplots

```python
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

x = np.linspace(0, 10, 100)

# Access individual subplots
axes[0, 0].plot(x, np.sin(x))
axes[0, 0].set_title('sin(x)')

axes[0, 1].plot(x, np.cos(x))
axes[0, 1].set_title('cos(x)')

axes[0, 2].plot(x, np.tan(x))
axes[0, 2].set_ylim(-5, 5)
axes[0, 2].set_title('tan(x)')

axes[1, 0].plot(x, x**2)
axes[1, 0].set_title('x^2')

axes[1, 1].plot(x, np.exp(-x))
axes[1, 1].set_title('exp(-x)')

axes[1, 2].plot(x, np.log(x + 1))
axes[1, 2].set_title('log(x+1)')

plt.tight_layout()
plt.show()
```

### Sharing Axes

```python
fig, axes = plt.subplots(2, 2, figsize=(12, 10),
                         sharex=True, sharey='row')

x = np.linspace(0, 10, 100)

axes[0, 0].plot(x, np.sin(x))
axes[0, 0].set_title('sin(x)')

axes[0, 1].plot(x, np.cos(x))
axes[0, 1].set_title('cos(x)')

axes[1, 0].plot(x, np.sin(2*x))
axes[1, 0].set_title('sin(2x)')

axes[1, 1].plot(x, np.cos(2*x))
axes[1, 1].set_title('cos(2x)')

# Only bottom row has x labels due to sharex
# Only left column has y labels due to sharey='row'

plt.tight_layout()
plt.show()
```

### GridSpec for Complex Layouts

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(12, 8))
gs = gridspec.GridSpec(3, 3, figure=fig)

# Large plot on left
ax1 = fig.add_subplot(gs[:, 0:2])
ax1.plot(np.random.randn(100).cumsum())
ax1.set_title('Large Left Panel')

# Three stacked plots on right
ax2 = fig.add_subplot(gs[0, 2])
ax2.plot(np.random.randn(50), 'r-')
ax2.set_title('Top Right')

ax3 = fig.add_subplot(gs[1, 2])
ax3.bar([1, 2, 3], [3, 1, 2])
ax3.set_title('Middle Right')

ax4 = fig.add_subplot(gs[2, 2])
ax4.scatter(np.random.rand(20), np.random.rand(20))
ax4.set_title('Bottom Right')

plt.tight_layout()
plt.show()
```

### Nested Subplots

```python
fig = plt.figure(figsize=(12, 8))

# Outer gridspec
outer = gridspec.GridSpec(2, 2, figure=fig, wspace=0.3, hspace=0.3)

# First quadrant: single plot
ax1 = fig.add_subplot(outer[0, 0])
ax1.plot(np.random.randn(50))
ax1.set_title('Single Plot')

# Second quadrant: 2x2 nested grid
inner = gridspec.GridSpecFromSubplotSpec(2, 2, subplot_spec=outer[0, 1],
                                          wspace=0.1, hspace=0.1)
for i in range(4):
    ax = fig.add_subplot(inner[i // 2, i % 2])
    ax.plot(np.random.randn(20))
    ax.set_xticks([])
    ax.set_yticks([])

# Third quadrant: single plot
ax3 = fig.add_subplot(outer[1, 0])
ax3.bar([1, 2, 3, 4], [2, 3, 1, 4])
ax3.set_title('Bar Plot')

# Fourth quadrant: single plot
ax4 = fig.add_subplot(outer[1, 1])
ax4.scatter(np.random.rand(30), np.random.rand(30))
ax4.set_title('Scatter Plot')

plt.show()
```

### Inset Axes

```python
from mpl_toolkits.axes_grid1.inset_locator import inset_axes, zoomed_inset_axes

fig, ax = plt.subplots(figsize=(10, 8))

x = np.linspace(0, 10, 1000)
y = np.sin(x) * np.exp(-x/10)

ax.plot(x, y, 'b-', linewidth=2)
ax.set_title('Main Plot with Inset')
ax.set_xlabel('X')
ax.set_ylabel('Y')

# Create inset axes
axins = inset_axes(ax, width='40%', height='30%', loc='upper right')
axins.plot(x, y, 'b-', linewidth=1)
axins.set_xlim(2, 4)
axins.set_ylim(-0.2, 0.4)
axins.set_title('Zoomed View', fontsize=10)

# Mark the zoomed region on main plot
ax.axvspan(2, 4, alpha=0.2, color='yellow')

plt.show()
```

---

## Saving Figures

### Basic Saving

```python
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
ax.set_title('Sample Plot')

# Save as PNG
fig.savefig('plot.png')

# Save with higher resolution
fig.savefig('plot_hires.png', dpi=300)

# Save as PDF (vector format)
fig.savefig('plot.pdf')

# Save as SVG (vector format)
fig.savefig('plot.svg')

# Save as EPS (for LaTeX)
fig.savefig('plot.eps')

plt.close(fig)
```

### Advanced Saving Options

```python
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])

# Save with all options
fig.savefig(
    'plot_advanced.png',
    dpi=300,                    # Resolution
    bbox_inches='tight',        # Trim whitespace
    pad_inches=0.1,             # Padding around figure
    facecolor='white',          # Background color
    edgecolor='none',           # Edge color
    transparent=False,          # Transparency
    format='png',               # Explicit format
    metadata={                  # Add metadata
        'Title': 'Sample Plot',
        'Author': 'Data Scientist',
        'Description': 'A sample plot for demonstration'
    }
)

plt.close(fig)
```

### Saving Multiple Figures

```python
from matplotlib.backends.backend_pdf import PdfPages

# Save multiple figures to a single PDF
with PdfPages('multipage.pdf') as pdf:
    for i in range(5):
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.plot(np.random.randn(100).cumsum())
        ax.set_title(f'Page {i+1}')

        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)

    # Add metadata
    d = pdf.infodict()
    d['Title'] = 'Multiple Plots Collection'
    d['Author'] = 'Data Scientist'
```

### Saving Figures Programmatically

```python
import os

def save_figure(fig, filename, formats=['png', 'pdf'], output_dir='figures'):
    """Save a figure in multiple formats."""

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    for fmt in formats:
        filepath = os.path.join(output_dir, f'{filename}.{fmt}')
        fig.savefig(
            filepath,
            dpi=300 if fmt == 'png' else None,
            bbox_inches='tight',
            facecolor='white'
        )
        print(f'Saved: {filepath}')

# Usage
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 2, 3])
save_figure(fig, 'my_plot', formats=['png', 'pdf', 'svg'])
plt.close(fig)
```

---

## Practical Examples

### Example 1: Complete Dashboard

```python
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np

# Create sample data
np.random.seed(42)
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
revenue = [120, 135, 145, 160, 155, 175]
costs = [80, 85, 90, 95, 92, 100]
customers = [1200, 1350, 1500, 1650, 1800, 2000]
categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Other']
category_sales = [35, 25, 20, 12, 8]

# Create figure with custom layout
fig = plt.figure(figsize=(16, 10))
gs = gridspec.GridSpec(2, 3, figure=fig, hspace=0.3, wspace=0.3)

# Revenue and Costs Line Chart
ax1 = fig.add_subplot(gs[0, 0:2])
ax1.plot(months, revenue, 'b-o', linewidth=2, markersize=8, label='Revenue')
ax1.plot(months, costs, 'r--s', linewidth=2, markersize=8, label='Costs')
ax1.fill_between(months, costs, revenue, alpha=0.3, color='green', label='Profit')
ax1.set_title('Monthly Revenue vs Costs', fontsize=14, fontweight='bold')
ax1.set_ylabel('Amount ($K)')
ax1.legend(loc='upper left')
ax1.grid(True, alpha=0.3)

# Category Distribution Pie Chart
ax2 = fig.add_subplot(gs[0, 2])
colors = plt.cm.Set3.colors[:5]
wedges, texts, autotexts = ax2.pie(
    category_sales,
    labels=categories,
    autopct='%1.1f%%',
    colors=colors,
    explode=(0.05, 0, 0, 0, 0),
    shadow=True
)
ax2.set_title('Sales by Category', fontsize=14, fontweight='bold')

# Customer Growth Bar Chart
ax3 = fig.add_subplot(gs[1, 0])
bars = ax3.bar(months, customers, color='steelblue', edgecolor='black')
ax3.set_title('Customer Growth', fontsize=14, fontweight='bold')
ax3.set_ylabel('Number of Customers')
for bar, val in zip(bars, customers):
    ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 30,
             str(val), ha='center', va='bottom', fontsize=9)

# Performance Metrics Box Plot
ax4 = fig.add_subplot(gs[1, 1])
data = [np.random.normal(100, 15, 50) for _ in range(4)]
bp = ax4.boxplot(data, labels=['Q1', 'Q2', 'Q3', 'Q4'], patch_artist=True)
colors = ['lightblue', 'lightgreen', 'lightyellow', 'lightcoral']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)
ax4.set_title('Quarterly Performance', fontsize=14, fontweight='bold')
ax4.set_ylabel('Score')
ax4.grid(True, axis='y', alpha=0.3)

# Trend Analysis
ax5 = fig.add_subplot(gs[1, 2])
x = np.arange(len(months))
ax5.scatter(x, revenue, s=100, c=customers, cmap='viridis',
            edgecolors='black', linewidth=1)
ax5.set_xticks(x)
ax5.set_xticklabels(months)
ax5.set_title('Revenue vs Customer Count', fontsize=14, fontweight='bold')
ax5.set_xlabel('Month')
ax5.set_ylabel('Revenue ($K)')
cbar = plt.colorbar(ax5.collections[0], ax=ax5, shrink=0.8)
cbar.set_label('Customers')

# Main title
fig.suptitle('Business Analytics Dashboard', fontsize=18, fontweight='bold', y=1.02)

plt.savefig('dashboard.png', dpi=300, bbox_inches='tight', facecolor='white')
plt.show()
```

### Example 2: Scientific Publication Figure

```python
import matplotlib.pyplot as plt
import numpy as np

# Set publication-quality defaults
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 12,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'axes.linewidth': 0.8,
})

# Create data
np.random.seed(42)
x = np.linspace(0, 10, 50)
y_theory = np.sin(x) * np.exp(-x/10)
y_exp = y_theory + np.random.normal(0, 0.05, len(x))
y_error = np.abs(np.random.normal(0.03, 0.01, len(x)))

fig, axes = plt.subplots(1, 2, figsize=(7, 3))

# Left panel: Experimental data with theory
ax1 = axes[0]
ax1.errorbar(x, y_exp, yerr=y_error, fmt='o', markersize=4,
             color='steelblue', ecolor='gray', capsize=2,
             label='Experimental', alpha=0.7)
ax1.plot(x, y_theory, 'r-', linewidth=1.5, label='Theory')
ax1.set_xlabel(r'Time $t$ (s)')
ax1.set_ylabel(r'Amplitude $A$ (a.u.)')
ax1.legend(frameon=False)
ax1.set_title('(a) Time-domain response')

# Right panel: Residuals
ax2 = axes[1]
residuals = y_exp - y_theory
ax2.axhline(y=0, color='black', linestyle='-', linewidth=0.5)
ax2.axhline(y=0.05, color='gray', linestyle='--', linewidth=0.5)
ax2.axhline(y=-0.05, color='gray', linestyle='--', linewidth=0.5)
ax2.scatter(x, residuals, s=15, color='steelblue', alpha=0.7)
ax2.fill_between(x, -0.05, 0.05, alpha=0.2, color='gray')
ax2.set_xlabel(r'Time $t$ (s)')
ax2.set_ylabel(r'Residuals')
ax2.set_title('(b) Residual analysis')

plt.tight_layout()
plt.savefig('publication_figure.pdf', bbox_inches='tight')
plt.savefig('publication_figure.png', dpi=300, bbox_inches='tight')
plt.show()

# Reset defaults
plt.rcParams.update(plt.rcParamsDefault)
```

### Example 3: Time Series Analysis

```python
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.dates as mdates
from datetime import datetime, timedelta

# Create sample time series data
np.random.seed(42)
dates = [datetime(2024, 1, 1) + timedelta(days=i) for i in range(365)]
values = np.cumsum(np.random.randn(365)) + 100
trend = np.linspace(0, 20, 365)
seasonal = 10 * np.sin(np.linspace(0, 4*np.pi, 365))
data = values + trend + seasonal

# Calculate moving averages
window = 30
ma = np.convolve(data, np.ones(window)/window, mode='valid')
ma_dates = dates[window-1:]

fig, axes = plt.subplots(3, 1, figsize=(12, 10), sharex=True)

# Main time series plot
ax1 = axes[0]
ax1.plot(dates, data, 'b-', alpha=0.5, linewidth=0.8, label='Daily')
ax1.plot(ma_dates, ma, 'r-', linewidth=2, label=f'{window}-day MA')
ax1.fill_between(dates, data, alpha=0.2)
ax1.set_ylabel('Value')
ax1.set_title('Time Series with Moving Average')
ax1.legend(loc='upper left')
ax1.grid(True, alpha=0.3)

# Daily returns
ax2 = axes[1]
returns = np.diff(data) / data[:-1] * 100
colors = ['green' if r > 0 else 'red' for r in returns]
ax2.bar(dates[1:], returns, color=colors, alpha=0.7, width=1)
ax2.axhline(y=0, color='black', linewidth=0.5)
ax2.set_ylabel('Daily Return (%)')
ax2.set_title('Daily Returns')
ax2.grid(True, alpha=0.3)

# Rolling volatility
ax3 = axes[2]
volatility = np.array([np.std(returns[max(0,i-30):i+1])
                       for i in range(len(returns))])
ax3.fill_between(dates[1:], volatility, alpha=0.5, color='purple')
ax3.plot(dates[1:], volatility, 'purple', linewidth=1)
ax3.set_ylabel('30-day Volatility (%)')
ax3.set_title('Rolling Volatility')
ax3.grid(True, alpha=0.3)

# Format x-axis dates
ax3.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
ax3.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
plt.xticks(rotation=45)

plt.tight_layout()
plt.savefig('timeseries_analysis.png', dpi=300, bbox_inches='tight')
plt.show()
```

---

## Interview Key Points

### Frequently Asked Questions

**Q1: What's the difference between pyplot and object-oriented interface?**

```python
# pyplot (implicit, stateful)
import matplotlib.pyplot as plt
plt.figure()
plt.plot([1, 2, 3])
plt.title('Title')
plt.show()

# Object-oriented (explicit, recommended)
fig, ax = plt.subplots()
ax.plot([1, 2, 3])
ax.set_title('Title')
plt.show()
```

The OO interface is preferred for:
- Complex figures with multiple subplots
- Programmatic figure generation
- Better code organization and reusability

**Q2: How do you save a figure with transparent background?**

```python
fig.savefig('plot.png', transparent=True, facecolor='none')
```

**Q3: What's the difference between `fig.add_subplot()` and `plt.subplots()`?**

```python
# fig.add_subplot() - add one subplot at a time
fig = plt.figure()
ax1 = fig.add_subplot(2, 2, 1)  # 2x2 grid, position 1
ax2 = fig.add_subplot(2, 2, 4)  # 2x2 grid, position 4

# plt.subplots() - create all subplots at once (recommended)
fig, axes = plt.subplots(2, 2)  # Returns figure and 2x2 array of axes
```

**Q4: How do you create publication-quality figures?**

```python
# Set appropriate DPI and figure size
fig, ax = plt.subplots(figsize=(7, 5), dpi=150)

# Use vector formats for publications
fig.savefig('figure.pdf', bbox_inches='tight')

# Set font sizes appropriately
plt.rcParams.update({'font.size': 10, 'axes.labelsize': 11})
```

**Q5: How do you add multiple y-axes?**

```python
fig, ax1 = plt.subplots()
ax2 = ax1.twinx()  # Create second y-axis sharing the same x-axis

ax1.plot(x, y1, 'b-')
ax2.plot(x, y2, 'r-')

ax1.set_ylabel('First Y', color='blue')
ax2.set_ylabel('Second Y', color='red')
```

**Q6: How do you handle overlapping labels?**

```python
# Method 1: Rotate labels
plt.xticks(rotation=45, ha='right')

# Method 2: Use tight_layout
plt.tight_layout()

# Method 3: Adjust figure size
fig.set_size_inches(12, 6)

# Method 4: Use constrained_layout
fig, ax = plt.subplots(constrained_layout=True)
```

**Q7: What are the best practices for colormaps?**

```python
# Sequential data: viridis, plasma, magma, cividis
# Diverging data: coolwarm, RdBu, seismic
# Categorical data: Set1, Set2, tab10

# Perceptually uniform colormaps (recommended)
plt.imshow(data, cmap='viridis')

# Avoid: jet, rainbow (not perceptually uniform)
```

**Q8: How do you create interactive plots?**

```python
# For Jupyter notebooks
%matplotlib notebook  # or %matplotlib widget

# For web applications
import plotly.express as px  # Alternative library

# For GUI applications
import matplotlib
matplotlib.use('TkAgg')  # or 'Qt5Agg'
```

---

## Summary

Matplotlib is the foundational visualization library in Python, offering complete control over every aspect of your plots. Key takeaways include:

1. **Two interfaces**: Use the object-oriented interface for complex figures and better code organization
2. **Figure hierarchy**: Understand Figure > Axes > Axis > Artists relationship
3. **Customization**: Master colors, styles, annotations, and legends for professional plots
4. **Subplots**: Use GridSpec for complex layouts and shared axes for comparative plots
5. **Saving**: Choose appropriate formats (PNG for web, PDF/SVG for publications)
6. **Best practices**: Use perceptually uniform colormaps, appropriate figure sizes, and tight layouts

With practice, you'll be able to create any visualization from simple line plots to complex multi-panel figures suitable for publications and presentations.

---

## Further Reading

### Official Resources

- [Matplotlib Official Documentation](https://matplotlib.org/stable/contents.html)
- [Matplotlib Tutorials](https://matplotlib.org/stable/tutorials/index.html)
- [Matplotlib Gallery](https://matplotlib.org/stable/gallery/index.html)

### Recommended Books

- **"Python Data Science Handbook"** by Jake VanderPlas - Excellent Matplotlib chapter
- **"Effective Matplotlib"** by Nicolas P. Rougier - Advanced techniques
- **"Scientific Visualization: Python + Matplotlib"** by Nicolas P. Rougier

### Related Visualization Libraries

- **Seaborn**: Statistical visualization built on Matplotlib
- **Plotly**: Interactive visualizations for web
- **Bokeh**: Interactive visualization for web applications
- **Altair**: Declarative statistical visualization

### Online Practice

- [Matplotlib Tutorial on Real Python](https://realpython.com/python-matplotlib-guide/)
- [DataCamp Matplotlib Courses](https://www.datacamp.com/courses/introduction-to-data-visualization-with-matplotlib)
- [Kaggle Visualization Micro-Course](https://www.kaggle.com/learn/data-visualization)

### Related Code Wiki Articles

- [NumPy Scientific Computing Guide](/data/numpy) - Data preparation for visualization
- [Pandas Complete Guide](/data/pandas-guide) - DataFrame plotting capabilities
- [Data Visualization Best Practices](/data/visualization) - Design principles

---

> **Summary**: Matplotlib provides the foundation for all Python visualization work. Master its concepts and you'll be equipped to create any type of chart or figure, customize it to your exact specifications, and produce publication-quality graphics for any purpose.
