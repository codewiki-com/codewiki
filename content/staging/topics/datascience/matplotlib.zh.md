---
title: Matplotlib 数据可视化
description: 使用Matplotlib创建数据可视化图表
track: datascience
section: python-stack
difficulty: beginner
tags:
  - Matplotlib
  - 可视化
  - Python
  - 图表
status: imported
origin: old/src/content/docs/data/matplotlib.zh.md
divergence: 0.196
issues: []
legacy:
  category: Data
  subcategory: Visualization
  order: 26
  lastUpdated: 2026-01-07
---

Matplotlib 是 Python 中最流行、最成熟的数据可视化库，它提供了一套完整的�bottom-up API，可以创建从简单到复杂的各种静态、动画和交互式图表。无论是探索性数据分析还是出版级别的图表制作，Matplotlib 都是数据科学家和研究人员的首选工具。

## 为什么选择 Matplotlib？

### 核心优势

1. **功能全面**：支持几乎所有类型的 2D 图表，以及基础的 3D 图表
2. **高度可定制**：每一个图表元素都可以精细控制
3. **跨平台**：支持多种输出格式（PNG、PDF、SVG、EPS 等）
4. **生态丰富**：Seaborn、Pandas、Plotly 等库都基于或兼容 Matplotlib
5. **社区活跃**：大量文档、教程和 Stack Overflow 答案

### 安装与导入

```python
# 安装
# pip install matplotlib

# 标准导入方式
import matplotlib.pyplot as plt
import numpy as np

# 检查版本
import matplotlib
print(matplotlib.__version__)
```

## Figure 与 Axes：核心概念

理解 Matplotlib 的核心在于掌握 Figure 和 Axes 的概念。

### Figure（画布）

Figure 是整个图形的容器，可以包含一个或多个 Axes（子图）。

```python
import matplotlib.pyplot as plt
import numpy as np

# 创建 Figure
fig = plt.figure()  # 默认大小
fig = plt.figure(figsize=(10, 6))  # 指定大小（英寸）
fig = plt.figure(figsize=(10, 6), dpi=100)  # 指定大小和分辨率

# Figure 的常用属性
print(f"Figure 大小: {fig.get_size_inches()}")
print(f"Figure DPI: {fig.dpi}")
```

### Axes（绑定坐标系）

Axes 是实际绑制图表的区域，包含坐标轴、标签、标题等元素。

```python
# 方法1：使用 add_subplot
fig = plt.figure(figsize=(10, 6))
ax = fig.add_subplot(111)  # 1行1列的第1个

# 方法2：使用 subplots（推荐）
fig, ax = plt.subplots(figsize=(10, 6))

# 方法3：创建多个子图
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
# axes 是一个 2x2 的数组
ax1 = axes[0, 0]
ax2 = axes[0, 1]
ax3 = axes[1, 0]
ax4 = axes[1, 1]

plt.show()
```

### 面向对象 vs pyplot 接口

Matplotlib 提供两种绑图方式：

```python
# 方式1：pyplot 接口（快速绘图，适合简单图表）
plt.figure(figsize=(8, 5))
plt.plot([1, 2, 3, 4], [1, 4, 2, 3])
plt.title('pyplot 接口示例')
plt.xlabel('X 轴')
plt.ylabel('Y 轴')
plt.show()

# 方式2：面向对象接口（推荐，更灵活）
fig, ax = plt.subplots(figsize=(8, 5))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
ax.set_title('面向对象接口示例')
ax.set_xlabel('X 轴')
ax.set_ylabel('Y 轴')
plt.show()
```

## 基础图表类型

### 折线图（Line Plot）

折线图是最常用的图表类型，适合展示数据的趋势变化。

```python
import matplotlib.pyplot as plt
import numpy as np

# 准备数据
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# 创建图表
fig, ax = plt.subplots(figsize=(10, 6))

# 绑制多条线
ax.plot(x, y1, label='sin(x)', color='blue', linewidth=2)
ax.plot(x, y2, label='cos(x)', color='red', linewidth=2, linestyle='--')

# 设置标题和标签
ax.set_title('正弦和余弦函数', fontsize=14)
ax.set_xlabel('X', fontsize=12)
ax.set_ylabel('Y', fontsize=12)

# 添加图例
ax.legend(loc='upper right')

# 添加网格
ax.grid(True, alpha=0.3)

plt.show()
```

### 线条样式选项

```python
# 线型：'-', '--', '-.', ':', ''
# 颜色：'b', 'g', 'r', 'c', 'm', 'y', 'k', 'w' 或 十六进制 '#FF5733'
# 标记：'o', 's', '^', 'v', 'd', '+', 'x', '*'

fig, ax = plt.subplots(figsize=(10, 6))

x = np.arange(0, 10, 1)
ax.plot(x, x, 'b-o', label='实线 + 圆形标记')
ax.plot(x, x + 2, 'r--s', label='虚线 + 方形标记')
ax.plot(x, x + 4, 'g-.^', label='点划线 + 三角标记')
ax.plot(x, x + 6, 'm:d', label='点线 + 菱形标记')

ax.legend()
ax.set_title('线条样式示例')
plt.show()
```

### 散点图（Scatter Plot）

散点图用于展示两个变量之间的关系。

```python
# 基础散点图
np.random.seed(42)
x = np.random.randn(100)
y = x + np.random.randn(100) * 0.5

fig, ax = plt.subplots(figsize=(8, 6))
ax.scatter(x, y, alpha=0.6, edgecolors='black', linewidth=0.5)
ax.set_title('基础散点图')
ax.set_xlabel('X 变量')
ax.set_ylabel('Y 变量')
plt.show()

# 带有颜色和大小映射的散点图
np.random.seed(42)
n = 50
x = np.random.rand(n)
y = np.random.rand(n)
colors = np.random.rand(n)  # 颜色值
sizes = 1000 * np.random.rand(n)  # 大小值

fig, ax = plt.subplots(figsize=(10, 8))
scatter = ax.scatter(x, y, c=colors, s=sizes, alpha=0.6,
                     cmap='viridis', edgecolors='black')
ax.set_title('带颜色和大小映射的散点图')
ax.set_xlabel('X')
ax.set_ylabel('Y')

# 添加颜色条
cbar = plt.colorbar(scatter)
cbar.set_label('颜色值')

plt.show()
```

### 柱状图（Bar Plot）

柱状图用于比较不同类别的数据。

```python
# 基础柱状图
categories = ['A', 'B', 'C', 'D', 'E']
values = [23, 45, 56, 78, 32]

fig, ax = plt.subplots(figsize=(8, 6))
bars = ax.bar(categories, values, color='steelblue', edgecolor='black')
ax.set_title('销售数据')
ax.set_xlabel('产品类别')
ax.set_ylabel('销售额')

# 在柱子上添加数值标签
for bar, value in zip(bars, values):
    ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 1,
            str(value), ha='center', va='bottom')

plt.show()

# 分组柱状图
categories = ['Q1', 'Q2', 'Q3', 'Q4']
product_a = [20, 35, 30, 35]
product_b = [25, 32, 34, 20]

x = np.arange(len(categories))
width = 0.35

fig, ax = plt.subplots(figsize=(10, 6))
bars1 = ax.bar(x - width/2, product_a, width, label='产品 A', color='steelblue')
bars2 = ax.bar(x + width/2, product_b, width, label='产品 B', color='coral')

ax.set_title('季度销售对比')
ax.set_xlabel('季度')
ax.set_ylabel('销售额（万元）')
ax.set_xticks(x)
ax.set_xticklabels(categories)
ax.legend()

plt.show()

# 堆叠柱状图
fig, ax = plt.subplots(figsize=(10, 6))
ax.bar(categories, product_a, label='产品 A', color='steelblue')
ax.bar(categories, product_b, bottom=product_a, label='产品 B', color='coral')

ax.set_title('季度销售堆叠图')
ax.set_xlabel('季度')
ax.set_ylabel('销售额（万元）')
ax.legend()

plt.show()

# 水平柱状图
fig, ax = plt.subplots(figsize=(8, 6))
ax.barh(categories, product_a, color='steelblue')
ax.set_title('水平柱状图')
ax.set_xlabel('销售额')
ax.set_ylabel('季度')

plt.show()
```

### 直方图（Histogram）

直方图用于展示数据的分布情况。

```python
# 基础直方图
np.random.seed(42)
data = np.random.randn(1000)

fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(data, bins=30, color='steelblue', edgecolor='black', alpha=0.7)
ax.set_title('正态分布直方图')
ax.set_xlabel('值')
ax.set_ylabel('频数')

plt.show()

# 多组数据直方图对比
data1 = np.random.normal(0, 1, 1000)
data2 = np.random.normal(2, 1.5, 1000)

fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(data1, bins=30, alpha=0.5, label='组 A', color='blue')
ax.hist(data2, bins=30, alpha=0.5, label='组 B', color='red')
ax.set_title('两组数据分布对比')
ax.set_xlabel('值')
ax.set_ylabel('频数')
ax.legend()

plt.show()

# 累积直方图
fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(data, bins=30, cumulative=True, color='steelblue',
        edgecolor='black', alpha=0.7)
ax.set_title('累积直方图')
ax.set_xlabel('值')
ax.set_ylabel('累积频数')

plt.show()
```

### 饼图（Pie Chart）

饼图用于展示各部分占整体的比例。

```python
# 基础饼图
labels = ['产品 A', '产品 B', '产品 C', '产品 D']
sizes = [35, 25, 25, 15]
colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']
explode = (0.05, 0, 0, 0)  # 突出显示第一块

fig, ax = plt.subplots(figsize=(8, 8))
ax.pie(sizes, explode=explode, labels=labels, colors=colors,
       autopct='%1.1f%%', shadow=True, startangle=90)
ax.set_title('产品销售占比')

plt.show()

# 环形图（Donut Chart）
fig, ax = plt.subplots(figsize=(8, 8))
wedges, texts, autotexts = ax.pie(sizes, labels=labels, colors=colors,
                                   autopct='%1.1f%%', startangle=90,
                                   wedgeprops=dict(width=0.5))
ax.set_title('产品销售占比（环形图）')

plt.show()
```

### 箱线图（Box Plot）

箱线图用于展示数据的分布和异常值。

```python
# 基础箱线图
np.random.seed(42)
data = [np.random.normal(0, std, 100) for std in range(1, 5)]

fig, ax = plt.subplots(figsize=(10, 6))
bp = ax.boxplot(data, labels=['A', 'B', 'C', 'D'], patch_artist=True)

# 设置箱体颜色
colors = ['lightblue', 'lightgreen', 'lightyellow', 'lightpink']
for patch, color in zip(bp['boxes'], colors):
    patch.set_facecolor(color)

ax.set_title('箱线图示例')
ax.set_xlabel('组别')
ax.set_ylabel('值')

plt.show()

# 水平箱线图
fig, ax = plt.subplots(figsize=(10, 6))
ax.boxplot(data, labels=['A', 'B', 'C', 'D'], vert=False, patch_artist=True)
ax.set_title('水平箱线图')

plt.show()
```

### 热力图（Heatmap）

热力图用于展示矩阵数据的强度。

```python
# 创建热力图数据
np.random.seed(42)
data = np.random.rand(10, 10)

fig, ax = plt.subplots(figsize=(10, 8))
im = ax.imshow(data, cmap='YlOrRd')

# 添加颜色条
cbar = ax.figure.colorbar(im, ax=ax)
cbar.set_label('强度')

# 设置刻度标签
ax.set_xticks(np.arange(10))
ax.set_yticks(np.arange(10))
ax.set_xticklabels([f'X{i}' for i in range(10)])
ax.set_yticklabels([f'Y{i}' for i in range(10)])

# 旋转 x 轴标签
plt.setp(ax.get_xticklabels(), rotation=45, ha='right')

ax.set_title('热力图示例')

plt.show()

# 带数值标注的热力图
fig, ax = plt.subplots(figsize=(10, 8))
im = ax.imshow(data, cmap='YlOrRd')

# 在每个单元格添加数值
for i in range(10):
    for j in range(10):
        text = ax.text(j, i, f'{data[i, j]:.2f}',
                       ha='center', va='center', color='black', fontsize=8)

cbar = ax.figure.colorbar(im, ax=ax)
ax.set_title('带数值的热力图')

plt.show()
```

## 图表定制与美化

### 标题、标签和图例

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x), label='sin(x)')
ax.plot(x, np.cos(x), label='cos(x)')

# 设置标题
ax.set_title('三角函数图', fontsize=16, fontweight='bold', pad=20)

# 设置轴标签
ax.set_xlabel('X 轴', fontsize=12, labelpad=10)
ax.set_ylabel('Y 轴', fontsize=12, labelpad=10)

# 设置图例
ax.legend(loc='upper right',           # 位置
          fontsize=10,                  # 字体大小
          frameon=True,                 # 显示边框
          framealpha=0.8,               # 边框透明度
          facecolor='white',            # 背景颜色
          edgecolor='gray',             # 边框颜色
          title='函数类型',             # 图例标题
          title_fontsize=11)

plt.show()
```

### 坐标轴设置

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x))

# 设置坐标轴范围
ax.set_xlim(0, 12)
ax.set_ylim(-1.5, 1.5)

# 设置刻度
ax.set_xticks([0, 2, 4, 6, 8, 10])
ax.set_yticks([-1, -0.5, 0, 0.5, 1])

# 设置刻度标签
ax.set_xticklabels(['零', '二', '四', '六', '八', '十'])

# 设置刻度参数
ax.tick_params(axis='both', which='major', labelsize=10,
               direction='out', length=6, width=1)

# 隐藏特定边框
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

# 移动坐标轴
# ax.spines['left'].set_position('center')
# ax.spines['bottom'].set_position('center')

plt.show()
```

### 网格线

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x))

# 基础网格
ax.grid(True, which='major', linestyle='-', linewidth=0.5, alpha=0.7)

# 主次网格
ax.grid(True, which='minor', linestyle=':', linewidth=0.3, alpha=0.5)
ax.minorticks_on()

plt.show()

# 自定义网格
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(x, np.sin(x))

# 只显示 y 轴网格
ax.yaxis.grid(True, linestyle='--', alpha=0.7)
ax.xaxis.grid(False)

plt.show()
```

### 注释和文本

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
y = np.sin(x)
ax.plot(x, y)

# 添加文本
ax.text(5, 0.5, '这是一段文本', fontsize=12, ha='center')

# 添加带箭头的注释
ax.annotate('最大值', xy=(np.pi/2, 1), xytext=(np.pi/2 + 1, 0.8),
            fontsize=10, ha='center',
            arrowprops=dict(arrowstyle='->', color='red'))

# 添加带框的注释
ax.annotate('最小值', xy=(3*np.pi/2, -1), xytext=(3*np.pi/2 + 1, -0.7),
            fontsize=10, ha='center',
            arrowprops=dict(arrowstyle='->', color='blue'),
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

# 添加数学公式（LaTeX）
ax.text(8, 0.5, r'$y = \sin(x)$', fontsize=14)

plt.show()
```

### 颜色和颜色映射

```python
# 内置颜色名称
colors = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'black']

# 十六进制颜色
hex_colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5']

# RGB/RGBA 元组
rgb_color = (0.5, 0.2, 0.8)
rgba_color = (0.5, 0.2, 0.8, 0.5)  # 带透明度

# 颜色映射示例
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

cmaps = ['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'coolwarm']
data = np.random.rand(10, 10)

for ax, cmap in zip(axes.flat, cmaps):
    im = ax.imshow(data, cmap=cmap)
    ax.set_title(cmap)
    plt.colorbar(im, ax=ax)

plt.tight_layout()
plt.show()
```

### 样式设置

```python
# 查看可用样式
print(plt.style.available)

# 使用内置样式
plt.style.use('seaborn-v0_8-whitegrid')

fig, ax = plt.subplots(figsize=(10, 6))
x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x), label='sin(x)')
ax.plot(x, np.cos(x), label='cos(x)')
ax.legend()
ax.set_title('使用 seaborn 样式')
plt.show()

# 临时使用样式
with plt.style.context('dark_background'):
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(x, np.sin(x))
    ax.set_title('暗色背景样式')
    plt.show()

# 恢复默认样式
plt.style.use('default')
```

## 子图布局

### subplots 方法

```python
# 创建 2x2 的子图网格
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

x = np.linspace(0, 10, 100)

axes[0, 0].plot(x, np.sin(x))
axes[0, 0].set_title('sin(x)')

axes[0, 1].plot(x, np.cos(x))
axes[0, 1].set_title('cos(x)')

axes[1, 0].plot(x, np.tan(x))
axes[1, 0].set_title('tan(x)')
axes[1, 0].set_ylim(-5, 5)

axes[1, 1].plot(x, np.exp(-x))
axes[1, 1].set_title('exp(-x)')

plt.tight_layout()  # 自动调整子图间距
plt.show()
```

### 共享坐标轴

```python
# 共享 x 轴
fig, axes = plt.subplots(2, 1, figsize=(10, 8), sharex=True)

x = np.linspace(0, 10, 100)
axes[0].plot(x, np.sin(x))
axes[0].set_ylabel('sin(x)')

axes[1].plot(x, np.cos(x))
axes[1].set_ylabel('cos(x)')
axes[1].set_xlabel('X')

plt.show()

# 共享 y 轴
fig, axes = plt.subplots(1, 2, figsize=(12, 5), sharey=True)

axes[0].plot(x, np.sin(x))
axes[0].set_ylabel('Y')
axes[0].set_xlabel('X')
axes[0].set_title('sin(x)')

axes[1].plot(x, np.cos(x))
axes[1].set_xlabel('X')
axes[1].set_title('cos(x)')

plt.show()
```

### GridSpec 自定义布局

```python
import matplotlib.gridspec as gridspec

fig = plt.figure(figsize=(12, 8))

# 创建 3x3 的网格
gs = gridspec.GridSpec(3, 3, figure=fig)

# 创建不同大小的子图
ax1 = fig.add_subplot(gs[0, :])  # 第一行，占满
ax2 = fig.add_subplot(gs[1, :-1])  # 第二行，前两列
ax3 = fig.add_subplot(gs[1:, -1])  # 右侧两行
ax4 = fig.add_subplot(gs[-1, 0])  # 左下角
ax5 = fig.add_subplot(gs[-1, -2])  # 中下

x = np.linspace(0, 10, 100)

ax1.plot(x, np.sin(x))
ax1.set_title('大子图')

ax2.bar(['A', 'B', 'C'], [3, 7, 5])
ax2.set_title('柱状图')

ax3.scatter(np.random.rand(50), np.random.rand(50))
ax3.set_title('散点图')

ax4.hist(np.random.randn(100), bins=20)
ax4.set_title('直方图')

ax5.pie([30, 40, 30], labels=['X', 'Y', 'Z'])
ax5.set_title('饼图')

plt.tight_layout()
plt.show()
```

### 图中图（Inset）

```python
fig, ax = plt.subplots(figsize=(10, 6))

x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x))
ax.set_title('主图')

# 创建内嵌子图
inset_ax = ax.inset_axes([0.6, 0.6, 0.35, 0.35])  # [x, y, width, height]
inset_ax.plot(x, np.sin(x), 'r-')
inset_ax.set_xlim(4, 6)
inset_ax.set_ylim(-1, 0)
inset_ax.set_title('放大区域', fontsize=9)

# 添加指示框
ax.indicate_inset_zoom(inset_ax, edgecolor='black')

plt.show()
```

## 保存图形

### 基本保存

```python
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
ax.set_title('示例图表')

# 保存为 PNG
fig.savefig('plot.png')

# 保存为高分辨率 PNG
fig.savefig('plot_high_res.png', dpi=300)

# 保存为 PDF（矢量格式，适合论文）
fig.savefig('plot.pdf')

# 保存为 SVG（矢量格式，适合网页）
fig.savefig('plot.svg')

# 保存为 EPS（矢量格式，适合出版）
fig.savefig('plot.eps')

plt.close()  # 关闭图形，释放内存
```

### 保存选项

```python
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])

# 完整的保存选项
fig.savefig('plot_custom.png',
            dpi=300,                    # 分辨率
            bbox_inches='tight',        # 紧凑边界
            pad_inches=0.1,             # 边距
            facecolor='white',          # 背景色
            edgecolor='none',           # 边框色
            transparent=False,          # 是否透明
            format='png')               # 格式

plt.close()
```

### 批量保存

```python
import os

# 创建输出目录
os.makedirs('figures', exist_ok=True)

# 批量生成并保存图表
for i in range(5):
    fig, ax = plt.subplots(figsize=(8, 6))
    x = np.linspace(0, 10, 100)
    ax.plot(x, np.sin(x + i))
    ax.set_title(f'图表 {i+1}')

    fig.savefig(f'figures/plot_{i+1}.png', dpi=150, bbox_inches='tight')
    plt.close(fig)  # 关闭图形释放内存

print('所有图表已保存')
```

## 实战案例

### 案例1：股票数据可视化

```python
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.dates as mdates
from datetime import datetime, timedelta

# 模拟股票数据
np.random.seed(42)
n_days = 252  # 一年的交易日
dates = [datetime(2024, 1, 1) + timedelta(days=i) for i in range(n_days)]

# 模拟价格数据
price_start = 100
returns = np.random.randn(n_days) * 0.02
prices = price_start * np.cumprod(1 + returns)
volumes = np.random.randint(100000, 1000000, n_days)

# 计算移动平均
ma5 = np.convolve(prices, np.ones(5)/5, mode='valid')
ma20 = np.convolve(prices, np.ones(20)/20, mode='valid')

# 创建图表
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10),
                               gridspec_kw={'height_ratios': [3, 1]},
                               sharex=True)

# 绑制价格和移动平均线
ax1.plot(dates, prices, label='收盘价', color='black', linewidth=1)
ax1.plot(dates[4:], ma5, label='5日均线', color='blue', linewidth=1)
ax1.plot(dates[19:], ma20, label='20日均线', color='red', linewidth=1)

ax1.set_title('股票价格走势图', fontsize=14, fontweight='bold')
ax1.set_ylabel('价格', fontsize=12)
ax1.legend(loc='upper left')
ax1.grid(True, alpha=0.3)

# 绘制成交量柱状图
colors = ['green' if prices[i] >= prices[i-1] else 'red'
          for i in range(1, len(prices))]
colors.insert(0, 'green')
ax2.bar(dates, volumes, color=colors, alpha=0.7, width=1)
ax2.set_ylabel('成交量', fontsize=12)
ax2.set_xlabel('日期', fontsize=12)

# 格式化日期轴
ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
ax2.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
plt.xticks(rotation=45)

plt.tight_layout()
plt.show()
```

### 案例2：数据分析仪表板

```python
import matplotlib.pyplot as plt
import numpy as np

# 模拟数据
np.random.seed(42)
months = ['1月', '2月', '3月', '4月', '5月', '6月']
sales_a = [120, 135, 150, 165, 180, 175]
sales_b = [100, 115, 125, 140, 155, 160]
categories = ['电子', '服装', '食品', '家居', '其他']
category_sales = [35, 25, 20, 15, 5]

# 创建仪表板
fig = plt.figure(figsize=(16, 10))
gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

# 月度销售趋势
ax1 = fig.add_subplot(gs[0, :2])
ax1.plot(months, sales_a, 'bo-', label='产品 A', linewidth=2, markersize=8)
ax1.plot(months, sales_b, 'rs-', label='产品 B', linewidth=2, markersize=8)
ax1.fill_between(months, sales_a, alpha=0.3)
ax1.fill_between(months, sales_b, alpha=0.3)
ax1.set_title('月度销售趋势', fontsize=14, fontweight='bold')
ax1.set_xlabel('月份')
ax1.set_ylabel('销售额（万元）')
ax1.legend()
ax1.grid(True, alpha=0.3)

# 销售类别占比
ax2 = fig.add_subplot(gs[0, 2])
colors = plt.cm.Set3(np.linspace(0, 1, len(categories)))
wedges, texts, autotexts = ax2.pie(category_sales, labels=categories,
                                    colors=colors, autopct='%1.1f%%',
                                    startangle=90)
ax2.set_title('销售类别占比', fontsize=14, fontweight='bold')

# 产品对比柱状图
ax3 = fig.add_subplot(gs[1, 0])
x = np.arange(len(months))
width = 0.35
bars1 = ax3.bar(x - width/2, sales_a, width, label='产品 A', color='steelblue')
bars2 = ax3.bar(x + width/2, sales_b, width, label='产品 B', color='coral')
ax3.set_title('产品销售对比', fontsize=14, fontweight='bold')
ax3.set_xticks(x)
ax3.set_xticklabels(months)
ax3.set_ylabel('销售额（万元）')
ax3.legend()

# 销售分布直方图
ax4 = fig.add_subplot(gs[1, 1])
all_sales = np.random.normal(150, 30, 1000)
ax4.hist(all_sales, bins=30, color='steelblue', edgecolor='black', alpha=0.7)
ax4.axvline(np.mean(all_sales), color='red', linestyle='--', label=f'均值: {np.mean(all_sales):.1f}')
ax4.set_title('销售额分布', fontsize=14, fontweight='bold')
ax4.set_xlabel('销售额')
ax4.set_ylabel('频数')
ax4.legend()

# 关键指标卡片
ax5 = fig.add_subplot(gs[1, 2])
ax5.axis('off')

# 绘制指标卡片
metrics = [
    ('总销售额', '925万', '+15.2%'),
    ('平均客单价', '¥328', '+8.5%'),
    ('客户数量', '2,845', '+12.3%')
]

for i, (label, value, change) in enumerate(metrics):
    y = 0.8 - i * 0.3
    ax5.text(0.5, y, label, ha='center', fontsize=11, color='gray',
             transform=ax5.transAxes)
    ax5.text(0.5, y - 0.08, value, ha='center', fontsize=18, fontweight='bold',
             transform=ax5.transAxes)
    color = 'green' if '+' in change else 'red'
    ax5.text(0.5, y - 0.16, change, ha='center', fontsize=12, color=color,
             transform=ax5.transAxes)

ax5.set_title('关键指标', fontsize=14, fontweight='bold')

plt.suptitle('销售数据仪表板', fontsize=18, fontweight='bold', y=1.02)
plt.tight_layout()
plt.show()
```

### 案例3：科学数据可视化

```python
import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d import Axes3D

# 创建画布
fig = plt.figure(figsize=(16, 12))

# 等高线图
ax1 = fig.add_subplot(2, 2, 1)
x = np.linspace(-3, 3, 100)
y = np.linspace(-3, 3, 100)
X, Y = np.meshgrid(x, y)
Z = np.sin(X) * np.cos(Y)

contour = ax1.contourf(X, Y, Z, levels=20, cmap='RdYlBu')
ax1.contour(X, Y, Z, levels=20, colors='black', linewidths=0.5, alpha=0.5)
plt.colorbar(contour, ax=ax1)
ax1.set_title('等高线图: sin(x)*cos(y)', fontsize=12, fontweight='bold')
ax1.set_xlabel('X')
ax1.set_ylabel('Y')

# 向量场
ax2 = fig.add_subplot(2, 2, 2)
x = np.linspace(-2, 2, 15)
y = np.linspace(-2, 2, 15)
X, Y = np.meshgrid(x, y)
U = -Y
V = X

ax2.quiver(X, Y, U, V, color='blue', alpha=0.8)
ax2.set_title('向量场: 旋转场', fontsize=12, fontweight='bold')
ax2.set_xlabel('X')
ax2.set_ylabel('Y')
ax2.set_aspect('equal')
ax2.grid(True, alpha=0.3)

# 3D 曲面图
ax3 = fig.add_subplot(2, 2, 3, projection='3d')
x = np.linspace(-5, 5, 50)
y = np.linspace(-5, 5, 50)
X, Y = np.meshgrid(x, y)
Z = np.sin(np.sqrt(X**2 + Y**2))

surf = ax3.plot_surface(X, Y, Z, cmap='viridis', alpha=0.8)
ax3.set_title('3D 曲面图', fontsize=12, fontweight='bold')
ax3.set_xlabel('X')
ax3.set_ylabel('Y')
ax3.set_zlabel('Z')

# 误差棒图
ax4 = fig.add_subplot(2, 2, 4)
x = np.arange(1, 8)
y = np.array([2.3, 3.1, 4.2, 3.8, 5.1, 4.5, 5.8])
yerr = np.array([0.3, 0.4, 0.35, 0.5, 0.4, 0.45, 0.3])

ax4.errorbar(x, y, yerr=yerr, fmt='o-', capsize=5, capthick=2,
             color='steelblue', ecolor='gray', markersize=8)
ax4.fill_between(x, y - yerr, y + yerr, alpha=0.2)
ax4.set_title('误差棒图', fontsize=12, fontweight='bold')
ax4.set_xlabel('实验编号')
ax4.set_ylabel('测量值')
ax4.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

## 常见问题与解决方案

### 中文显示问题

```python
import matplotlib.pyplot as plt

# 方法1：使用系统中文字体
plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows
# plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']  # macOS
# plt.rcParams['font.sans-serif'] = ['WenQuanYi Micro Hei']  # Linux

plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题

# 方法2：使用 fontproperties 参数
from matplotlib.font_manager import FontProperties
font = FontProperties(fname='/path/to/font.ttf')
ax.set_title('中文标题', fontproperties=font)

# 方法3：设置全局字体
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
```

### 图表太挤或重叠

```python
# 使用 tight_layout 自动调整
plt.tight_layout()

# 手动调整子图间距
plt.subplots_adjust(left=0.1, right=0.9, top=0.9, bottom=0.1,
                    wspace=0.3, hspace=0.3)

# 使用 constrained_layout
fig, axes = plt.subplots(2, 2, figsize=(10, 8), constrained_layout=True)
```

### 保存时图表被裁切

```python
# 使用 bbox_inches='tight'
fig.savefig('plot.png', bbox_inches='tight', pad_inches=0.1)
```

### 内存泄漏

```python
# 绑制大量图表时，及时关闭
for i in range(100):
    fig, ax = plt.subplots()
    ax.plot([1, 2, 3])
    fig.savefig(f'plot_{i}.png')
    plt.close(fig)  # 关闭图形释放内存

# 或者使用 plt.close('all') 关闭所有图形
```

### 刻度标签重叠

```python
# 旋转标签
plt.xticks(rotation=45, ha='right')

# 减少刻度数量
ax.xaxis.set_major_locator(plt.MaxNLocator(5))

# 使用缩写标签
ax.set_xticklabels(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
```

## 延伸阅读

### 官方资源

- [Matplotlib 官方文档](https://matplotlib.org/stable/contents.html)
- [Matplotlib 画廊](https://matplotlib.org/stable/gallery/index.html)
- [Matplotlib 教程](https://matplotlib.org/stable/tutorials/index.html)

### 进阶学习

- **Seaborn**：基于 Matplotlib 的统计数据可视化库
- **Plotly**：交互式可视化库
- **Bokeh**：Web 交互式可视化
- **Altair**：声明式统计可视化

### 推荐资源

- 《Python 数据可视化之美》
- 《Matplotlib 3.0 Cookbook》
- [Matplotlib Cheatsheet](https://matplotlib.org/cheatsheets/)

---

Matplotlib 是 Python 数据可视化的基石，掌握它对于数据分析和科学研究至关重要。通过本文的学习，你应该能够创建各种类型的图表，并进行精细的定制。建议在实际项目中多加练习，逐步提高可视化技能。
