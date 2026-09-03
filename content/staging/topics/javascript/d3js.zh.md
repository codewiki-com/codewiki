---
title: D3.js 数据可视化指南
description: 掌握 D3.js 创建交互式数据可视化
track: javascript
section: browser
difficulty: advanced
tags:
  - D3.js
  - Data Visualization
  - SVG
  - Charts
status: imported
origin: old/src/content/docs/frontend/d3js.zh.md
divergence: 0.216
issues: []
legacy:
  category: Frontend
  subcategory: Visualization
  order: 26
  lastUpdated: 2026-01-07
---

D3.js（数据驱动文档）是一个强大的 JavaScript 库，用于在 Web 浏览器中创建动态、交互式的数据可视化。与提供预构建组件的高级图表库不同，D3.js 提供低级构建块，让开发者完全控制可视化的各个方面。本综合指南将带你从基本概念到创建复杂数据驱动图形的高级技术。

## D3.js 简介

### D3.js 的独特之处

D3.js 因以下几个关键原因而与其他可视化库不同：

1. **数据驱动方法**：D3 直接将数据绑定到 DOM 元素，使可视化能够自动反映底层数据的变化。

2. **Web 标准**：D3 使用标准的 Web 技术（HTML、SVG、CSS），意味着你的可视化不会被锁定在专有格式中。

3. **完全控制**：D3 不提供预构建的图表类型，而是给你构建任何可以想象的可视化的原语。

4. **大型生态系统**：D3 的模块化架构和广泛的社区创造了丰富的插件、示例和学习资源生态系统。

5. **生产就绪**：D3 已在主要组织（包括纽约时报、GitHub 和 Airbnb）的生产环境中经过实战检验。

### 何时使用 D3.js

D3 在以下情况下表现出色：

- 超越标准图表类型的自定义可视化
- 交互式动画图形
- 复杂的数据转换和布局
- 对样式和行为的完全控制
- 使用自定义投影的地理空间可视化

对于使用标准图表的简单用例，可以考虑 Chart.js 或 ECharts 等高级库，它们以牺牲灵活性为代价提供更简单的 API。

## 核心概念：选择器

选择器是 D3.js 的基础，提供了一种基于数据操作 DOM 的强大方式。

### 基本选择方法

D3 提供两个主要的选择方法，工作方式类似于 CSS 选择器：

```javascript
// 选择单个元素（第一个匹配项）
const body = d3.select("body");

// 选择所有匹配的元素
const paragraphs = d3.selectAll("p");

// 按 ID 选择
const chart = d3.select("#chart");

// 按类选择
const bars = d3.selectAll(".bar");

// 嵌套选择
const tableData = d3.selectAll("table tr")
  .selectAll("td");
```

### 链式操作

D3 选择器支持方法链，允许你按顺序执行多个操作：

```javascript
d3.select("body")
  .style("background-color", "#f0f0f0")
  .append("h1")
  .text("D3.js 数据可视化")
  .style("color", "steelblue")
  .style("font-family", "Arial, sans-serif");
```

### 操作元素

选择器提供修改元素的方法：

```javascript
const selection = d3.selectAll(".item");

// 设置属性
selection.attr("class", "item active");
selection.attr("data-id", (d, i) => i);

// 设置样式
selection.style("color", "blue");
selection.style("opacity", 0.8);

// 设置文本内容
selection.text("Hello World");

// 设置 HTML 内容
selection.html("<strong>粗体文本</strong>");

// 添加/移除类
selection.classed("highlighted", true);
selection.classed("hidden", false);
```

### 创建和移除元素

```javascript
// 追加元素
const svg = d3.select("#container")
  .append("svg")
  .attr("width", 800)
  .attr("height", 600);

// 在现有元素之前插入
d3.select("#container")
  .insert("div", ":first-child")
  .text("插入到开头");

// 移除元素
d3.selectAll(".temporary").remove();
```

## 数据绑定：D3 的核心

数据绑定是 D3 真正数据驱动的关键。它创建数据和 DOM 元素之间的连接。

### data() 方法

`data()` 方法将数据数组连接到选择器：

```javascript
const data = [4, 8, 15, 16, 23, 42];

// 将数据绑定到现有元素
const bars = d3.select("#chart")
  .selectAll("div")
  .data(data);
```

### Enter-Update-Exit 模式

这个基本模式处理绑定数据时的三种可能状态：

- **Enter**：没有对应 DOM 元素的数据元素（需要创建）
- **Update**：有对应 DOM 元素的数据元素（需要更新）
- **Exit**：没有对应数据的 DOM 元素（需要移除）

```javascript
const data = [10, 20, 30, 40, 50];

// 选择并绑定数据
const bars = d3.select("#chart")
  .selectAll("div")
  .data(data);

// ENTER：为新数据创建新元素
bars.enter()
  .append("div")
  .attr("class", "bar")
  .style("width", d => d * 10 + "px")
  .style("height", "20px")
  .style("background-color", "steelblue")
  .style("margin", "2px")
  .text(d => d);

// UPDATE：修改现有元素（隐式在选择器中）
bars.style("width", d => d * 10 + "px")
  .text(d => d);

// EXIT：移除没有数据的元素
bars.exit().remove();
```

### 现代 join() 方法

D3 v5+ 引入了 `join()` 来简化 enter-update-exit 模式：

```javascript
const data = [10, 20, 30, 40, 50];

// 简单 join（自动处理 enter 和 exit）
d3.select("#chart")
  .selectAll("div")
  .data(data)
  .join("div")
    .attr("class", "bar")
    .style("width", d => d * 10 + "px")
    .style("background-color", "steelblue")
    .text(d => d);

// 高级 join，自定义 enter/update/exit 处理
svg.selectAll("circle")
  .data(data)
  .join(
    enter => enter.append("circle")
      .attr("fill", "green")
      .attr("r", 0)
      .call(enter => enter.transition()
        .duration(500)
        .attr("r", 10)),
    update => update
      .attr("fill", "blue"),
    exit => exit
      .call(exit => exit.transition()
        .duration(500)
        .attr("r", 0)
        .remove())
  )
  .attr("cx", (d, i) => i * 50 + 25)
  .attr("cy", 50);
```

### 对象恒定性的数据键

更新数据时，使用键来保持对象标识：

```javascript
const data = [
  { id: 1, name: "Alice", value: 30 },
  { id: 2, name: "Bob", value: 50 },
  { id: 3, name: "Carol", value: 40 }
];

// 使用 id 作为键函数
d3.selectAll(".person")
  .data(data, d => d.id)  // 键函数
  .join("div")
    .text(d => `${d.name}: ${d.value}`);
```

使用键确保数据变化时，正确的元素被更新而不是被替换，从而实现平滑的过渡。

## SVG 基础

SVG（可缩放矢量图形）是 D3 可视化的主要画布。理解 SVG 对于有效的 D3 开发至关重要。

### 创建 SVG 容器

```javascript
const width = 800;
const height = 600;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", `0 0 ${width} ${height}`);

// 添加组元素用于组织和变换
const g = svg.append("g")
  .attr("transform", "translate(50, 50)");
```

### 基本 SVG 形状

```javascript
// 矩形
g.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 100)
  .attr("height", 50)
  .attr("fill", "steelblue")
  .attr("stroke", "black")
  .attr("stroke-width", 2);

// 圆形
g.append("circle")
  .attr("cx", 200)
  .attr("cy", 25)
  .attr("r", 25)
  .attr("fill", "orange");

// 椭圆
g.append("ellipse")
  .attr("cx", 300)
  .attr("cy", 25)
  .attr("rx", 40)
  .attr("ry", 20)
  .attr("fill", "green");

// 线条
g.append("line")
  .attr("x1", 350)
  .attr("y1", 0)
  .attr("x2", 450)
  .attr("y2", 50)
  .attr("stroke", "red")
  .attr("stroke-width", 3);

// 文本
g.append("text")
  .attr("x", 500)
  .attr("y", 30)
  .attr("font-size", "16px")
  .attr("fill", "purple")
  .text("D3.js SVG");
```

### SVG 路径

路径是最强大的 SVG 元素。D3 提供生成器来创建复杂的路径：

```javascript
// 使用路径命令的手动路径
g.append("path")
  .attr("d", "M 0 0 L 50 50 L 100 0 Z")
  .attr("fill", "none")
  .attr("stroke", "black");

// 使用 D3 线条生成器
const lineGenerator = d3.line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveCardinal);

const points = [
  { x: 0, y: 50 },
  { x: 50, y: 0 },
  { x: 100, y: 50 },
  { x: 150, y: 25 }
];

g.append("path")
  .datum(points)
  .attr("d", lineGenerator)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2);
```

## 比例尺：将数据映射到视觉属性

比例尺是将数据域映射到视觉范围的函数。它们对于基于数据值定位和调整元素大小至关重要。

### 线性比例尺

线性比例尺在数值域之间创建连续映射：

```javascript
// 创建线性比例尺
const xScale = d3.scaleLinear()
  .domain([0, 100])     // 数据范围（输入）
  .range([0, 800])      // 像素范围（输出）
  .nice();              // 将域四舍五入到整数值

// 使用比例尺
console.log(xScale(50));      // 400
console.log(xScale(0));       // 0
console.log(xScale(100));     // 800

// 反转比例尺（从像素获取数据）
console.log(xScale.invert(400));  // 50

// 将域外的值钳制
const clampedScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 800])
  .clamp(true);

console.log(clampedScale(150));  // 800（被钳制）
```

### 时间比例尺

时间比例尺处理 Date 对象：

```javascript
const timeScale = d3.scaleTime()
  .domain([new Date(2023, 0, 1), new Date(2023, 11, 31)])
  .range([0, 800]);

console.log(timeScale(new Date(2023, 6, 1)));  // ~400

// 用于时区无关日期的 UTC 时间比例尺
const utcScale = d3.scaleUtc()
  .domain([new Date("2023-01-01"), new Date("2024-01-01")])
  .range([0, 800]);
```

### 分类数据的带状比例尺

带状比例尺将范围分成均匀的带，非常适合柱状图：

```javascript
const categories = ["A", "B", "C", "D", "E"];

const xBand = d3.scaleBand()
  .domain(categories)
  .range([0, 500])
  .padding(0.1)           // 带之间的间隙（0-1）
  .paddingInner(0.1)      // 内部间距
  .paddingOuter(0.05);    // 外部间距

console.log(xBand("A"));           // 带 A 的起始位置
console.log(xBand.bandwidth());    // 每个带的宽度
console.log(xBand.step());         // 带之间的步长
```

### 点比例尺

点比例尺以均匀间隔放置点：

```javascript
const xPoint = d3.scalePoint()
  .domain(["Mon", "Tue", "Wed", "Thu", "Fri"])
  .range([0, 400])
  .padding(0.5);

console.log(xPoint("Wed"));        // 中心位置
console.log(xPoint.step());        // 点之间的距离
```

### 序数和颜色比例尺

```javascript
// 带自定义范围的序数比例尺
const colorScale = d3.scaleOrdinal()
  .domain(["Apple", "Banana", "Orange"])
  .range(["#ff0000", "#ffff00", "#ff8800"]);

// 内置颜色方案
const categoryColors = d3.scaleOrdinal(d3.schemeCategory10);
const pairedColors = d3.scaleOrdinal(d3.schemePaired);

// 顺序颜色比例尺
const heatScale = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateYlOrRd);

// 发散颜色比例尺
const divergingScale = d3.scaleDiverging()
  .domain([-1, 0, 1])
  .interpolator(d3.interpolateRdBu);
```

### 对数和幂比例尺

用于指数分布的数据：

```javascript
// 对数比例尺（默认以 10 为底）
const logScale = d3.scaleLog()
  .domain([1, 1000])
  .range([0, 300]);

// 幂比例尺
const sqrtScale = d3.scaleSqrt()  // 平方根比例尺
  .domain([0, 100])
  .range([0, 50]);

const powScale = d3.scalePow()
  .exponent(2)
  .domain([0, 10])
  .range([0, 100]);
```

## 坐标轴：可视化比例尺

坐标轴为比例尺提供视觉参考，包括刻度线和标签。

### 创建坐标轴

```javascript
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// 创建比例尺
const xScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);  // 为 SVG 坐标反转

// 创建坐标轴生成器
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// 创建 SVG 并添加坐标轴
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 在底部添加 X 轴
svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(xAxis);

// 在左侧添加 Y 轴
svg.append("g")
  .attr("class", "y-axis")
  .call(yAxis);
```

### 自定义坐标轴

```javascript
const xAxis = d3.axisBottom(xScale)
  .ticks(10)                          // 大约的刻度数量
  .tickValues([0, 25, 50, 75, 100])   // 特定的刻度值
  .tickFormat(d => d + "%")           // 自定义刻度格式
  .tickSize(6)                        // 刻度线长度
  .tickPadding(3);                    // 刻度和标签之间的间距

// 创建网格线
const yAxisWithGrid = d3.axisLeft(yScale)
  .ticks(5)
  .tickSize(-width)    // 刻度延伸到整个图表
  .tickFormat("");     // 网格线不显示标签

// 用 CSS 设置网格线样式
svg.selectAll(".y-axis .tick line")
  .attr("stroke", "#ddd")
  .attr("stroke-dasharray", "2,2");
```

### 坐标轴方向

D3 提供四种坐标轴方向：

```javascript
const top = d3.axisTop(scale);       // 刻度在上，标签在上
const bottom = d3.axisBottom(scale); // 刻度在下，标签在下
const left = d3.axisLeft(scale);     // 刻度在左，标签在左
const right = d3.axisRight(scale);   // 刻度在右，标签在右
```

## 构建常见图表类型

### 柱状图

```javascript
const data = [
  { category: "A", value: 30 },
  { category: "B", value: 50 },
  { category: "C", value: 40 },
  { category: "D", value: 60 },
  { category: "E", value: 35 }
];

const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#bar-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 比例尺
const x = d3.scaleBand()
  .domain(data.map(d => d.category))
  .range([0, width])
  .padding(0.1);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .nice()
  .range([height, 0]);

// 坐标轴
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .call(d3.axisLeft(y));

// 柱子
svg.selectAll(".bar")
  .data(data)
  .join("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d.value))
  .attr("fill", "steelblue");

// 值标签
svg.selectAll(".label")
  .data(data)
  .join("text")
  .attr("class", "label")
  .attr("x", d => x(d.category) + x.bandwidth() / 2)
  .attr("y", d => y(d.value) - 5)
  .attr("text-anchor", "middle")
  .attr("font-size", "12px")
  .text(d => d.value);
```

### 折线图

```javascript
const lineData = [
  { date: new Date(2023, 0, 1), value: 30 },
  { date: new Date(2023, 1, 1), value: 50 },
  { date: new Date(2023, 2, 1), value: 40 },
  { date: new Date(2023, 3, 1), value: 60 },
  { date: new Date(2023, 4, 1), value: 45 },
  { date: new Date(2023, 5, 1), value: 70 }
];

const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#line-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 比例尺
const x = d3.scaleTime()
  .domain(d3.extent(lineData, d => d.date))
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([0, d3.max(lineData, d => d.value)])
  .nice()
  .range([height, 0]);

// 线条生成器
const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.value))
  .curve(d3.curveMonotoneX);  // 平滑曲线

// 面积生成器用于填充
const area = d3.area()
  .x(d => x(d.date))
  .y0(height)
  .y1(d => y(d.value))
  .curve(d3.curveMonotoneX);

// 坐标轴
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(6));

svg.append("g")
  .call(d3.axisLeft(y));

// 面积填充
svg.append("path")
  .datum(lineData)
  .attr("fill", "steelblue")
  .attr("fill-opacity", 0.2)
  .attr("d", area);

// 线条
svg.append("path")
  .datum(lineData)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2)
  .attr("d", line);

// 数据点
svg.selectAll(".dot")
  .data(lineData)
  .join("circle")
  .attr("class", "dot")
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.value))
  .attr("r", 5)
  .attr("fill", "steelblue");
```

### 饼图和环形图

```javascript
const pieData = [
  { name: "类别 A", value: 30 },
  { name: "类别 B", value: 50 },
  { name: "类别 C", value: 20 },
  { name: "类别 D", value: 40 }
];

const width = 400;
const height = 400;
const radius = Math.min(width, height) / 2;

const svg = d3.select("#pie-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

// 颜色比例尺
const color = d3.scaleOrdinal(d3.schemeCategory10);

// 饼图布局
const pie = d3.pie()
  .value(d => d.value)
  .sort(null);  // 保持数据顺序

// 饼图的弧形生成器
const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius - 20);

// 标签的弧形生成器
const labelArc = d3.arc()
  .innerRadius(radius - 80)
  .outerRadius(radius - 80);

// 创建饼图扇区
const arcs = svg.selectAll(".arc")
  .data(pie(pieData))
  .join("g")
  .attr("class", "arc");

arcs.append("path")
  .attr("d", arc)
  .attr("fill", (d, i) => color(i))
  .attr("stroke", "white")
  .attr("stroke-width", 2);

// 添加标签
arcs.append("text")
  .attr("transform", d => `translate(${labelArc.centroid(d)})`)
  .attr("text-anchor", "middle")
  .attr("font-size", "12px")
  .text(d => d.data.name);

// 对于环形图，只需更改 innerRadius：
const donutArc = d3.arc()
  .innerRadius(radius - 100)
  .outerRadius(radius - 20);
```

### 散点图

```javascript
const scatterData = [
  { x: 10, y: 20, size: 5 },
  { x: 30, y: 50, size: 10 },
  { x: 50, y: 35, size: 8 },
  { x: 70, y: 80, size: 15 },
  { x: 90, y: 60, size: 12 }
];

const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 500 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#scatter-plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// 比例尺
const x = d3.scaleLinear()
  .domain([0, 100])
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);

const size = d3.scaleLinear()
  .domain(d3.extent(scatterData, d => d.size))
  .range([5, 20]);

// 坐标轴
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .call(d3.axisLeft(y));

// 点
svg.selectAll("circle")
  .data(scatterData)
  .join("circle")
  .attr("cx", d => x(d.x))
  .attr("cy", d => y(d.y))
  .attr("r", d => size(d.size))
  .attr("fill", "steelblue")
  .attr("fill-opacity", 0.7)
  .attr("stroke", "white");
```

## 过渡和动画

D3 提供了强大的过渡系统，用于创建平滑的动画变化。

### 基本过渡

```javascript
// 简单过渡
d3.select("circle")
  .transition()
  .duration(1000)         // 持续时间（毫秒）
  .attr("r", 50)
  .attr("fill", "red");

// 延迟过渡
d3.selectAll("circle")
  .transition()
  .duration(750)
  .delay((d, i) => i * 100)  // 错开动画
  .attr("r", 20);
```

### 缓动函数

缓动控制动画的节奏：

```javascript
// 应用缓动
d3.select("rect")
  .transition()
  .duration(1000)
  .ease(d3.easeElastic)    // 弹性效果
  .attr("width", 200);

// 可用的缓动函数：
// d3.easeLinear      - 恒定速度
// d3.easeQuad        - 二次加速
// d3.easeCubic       - 三次（默认）
// d3.easeSin         - 正弦
// d3.easeExp         - 指数
// d3.easeCircle      - 圆形
// d3.easeElastic     - 弹性弹簧
// d3.easeBack        - 预期效果
// d3.easeBounce      - 弹跳球

// 每个都有 In、Out 和 InOut 变体：
d3.easeElasticIn    // 加速弹性
d3.easeElasticOut   // 减速弹性
d3.easeElasticInOut // 对称弹性
```

### 链式过渡

```javascript
// 顺序过渡
d3.select("rect")
  .transition()
  .duration(500)
  .attr("x", 100)
  .transition()          // 链接另一个过渡
  .duration(500)
  .attr("y", 100)
  .transition()
  .duration(500)
  .attr("fill", "orange");
```

### 命名过渡

使用命名过渡协调多个元素：

```javascript
// 创建命名过渡
const t = d3.transition()
  .duration(1000)
  .ease(d3.easeCubicInOut);

// 应用到多个选择器
d3.selectAll("circle")
  .transition(t)
  .attr("r", 20);

d3.selectAll("rect")
  .transition(t)
  .attr("width", 50);
```

### 过渡事件和 Promise

```javascript
// 使用事件
d3.select("circle")
  .transition()
  .duration(750)
  .attr("r", 30)
  .on("start", function() {
    console.log("动画开始");
  })
  .on("end", function() {
    console.log("动画完成");
  })
  .on("interrupt", function() {
    console.log("动画被中断");
  });

// 使用 promises（D3 v7+）
d3.select("circle")
  .transition()
  .duration(750)
  .attr("r", 30)
  .end()
  .then(() => {
    console.log("过渡完成，执行下一个操作");
  })
  .catch(() => {
    console.log("过渡被中断");
  });
```

### 自定义插值器

```javascript
// 数字动画
d3.select("#counter")
  .transition()
  .duration(2000)
  .tween("text", function() {
    const node = this;
    const interpolator = d3.interpolate(0, 1000);
    return function(t) {
      node.textContent = Math.round(interpolator(t)).toLocaleString();
    };
  });

// 颜色插值
d3.select("circle")
  .transition()
  .duration(1000)
  .attrTween("fill", function() {
    return d3.interpolateRgb("blue", "red");
  });
```

### 动画数据更新

```javascript
function updateChart(newData) {
  const bars = svg.selectAll(".bar")
    .data(newData, d => d.id);

  // 用过渡处理 enter/update/exit
  bars.join(
    enter => enter.append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.category))
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "steelblue")
      .call(enter => enter.transition()
        .duration(750)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))),

    update => update
      .call(update => update.transition()
        .duration(750)
        .attr("y", d => y(d.value))
        .attr("height", d => height - y(d.value))),

    exit => exit
      .call(exit => exit.transition()
        .duration(750)
        .attr("y", height)
        .attr("height", 0)
        .remove())
  );
}
```

## 事件处理和交互

### 基本事件绑定

```javascript
// D3 v7+ 事件处理（event 作为第一个参数）
d3.selectAll("circle")
  .on("click", function(event, d) {
    console.log("点击的数据:", d);
    console.log("事件:", event);
    console.log("元素:", this);
  })
  .on("mouseover", function(event, d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr("r", 15)
      .style("fill", "orange");
  })
  .on("mouseout", function(event, d) {
    d3.select(this)
      .transition()
      .duration(200)
      .attr("r", 10)
      .style("fill", "steelblue");
  });
```

### 工具提示

```javascript
// 创建工具提示容器
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background-color", "rgba(0, 0, 0, 0.8)")
  .style("color", "white")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("pointer-events", "none");

// 绑定事件
d3.selectAll(".bar")
  .on("mouseover", function(event, d) {
    tooltip
      .style("visibility", "visible")
      .html(`<strong>${d.category}</strong><br/>值: ${d.value}`);

    d3.select(this)
      .style("fill", "orange");
  })
  .on("mousemove", function(event) {
    tooltip
      .style("top", (event.pageY - 10) + "px")
      .style("left", (event.pageX + 10) + "px");
  })
  .on("mouseout", function() {
    tooltip.style("visibility", "hidden");

    d3.select(this)
      .style("fill", "steelblue");
  });
```

### 缩放和平移

```javascript
// 创建缩放行为
const zoom = d3.zoom()
  .scaleExtent([0.5, 10])    // 最小和最大缩放级别
  .on("zoom", zoomed);

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", 800)
  .attr("height", 600)
  .call(zoom);

const g = svg.append("g");

function zoomed(event) {
  g.attr("transform", event.transform);
}

// 程序化缩放控制
d3.select("#zoom-in").on("click", () => {
  svg.transition()
    .duration(300)
    .call(zoom.scaleBy, 1.5);
});

d3.select("#zoom-out").on("click", () => {
  svg.transition()
    .duration(300)
    .call(zoom.scaleBy, 0.67);
});

d3.select("#reset").on("click", () => {
  svg.transition()
    .duration(300)
    .call(zoom.transform, d3.zoomIdentity);
});
```

### 拖拽行为

```javascript
const drag = d3.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

function dragstarted(event, d) {
  d3.select(this)
    .raise()
    .attr("stroke", "black");
}

function dragged(event, d) {
  d3.select(this)
    .attr("cx", d.x = event.x)
    .attr("cy", d.y = event.y);
}

function dragended(event, d) {
  d3.select(this)
    .attr("stroke", null);
}

// 将拖拽应用到元素
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => d.x)
  .attr("cy", d => d.y)
  .attr("r", 20)
  .attr("fill", "steelblue")
  .call(drag);
```

### 刷选

```javascript
// 创建刷选
const brush = d3.brush()
  .extent([[0, 0], [width, height]])
  .on("start brush end", brushed);

svg.append("g")
  .attr("class", "brush")
  .call(brush);

function brushed(event) {
  if (!event.selection) return;

  const [[x0, y0], [x1, y1]] = event.selection;

  svg.selectAll("circle")
    .attr("fill", d => {
      const cx = xScale(d.x);
      const cy = yScale(d.y);
      const isSelected = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
      return isSelected ? "orange" : "steelblue";
    });
}
```

## 响应式图表

### 使用 ViewBox

```javascript
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .classed("responsive-svg", true);

// 响应式 CSS
/*
.responsive-svg {
  width: 100%;
  height: auto;
}
*/
```

### 使用 ResizeObserver

```javascript
function createResponsiveChart(containerSelector, data) {
  const container = document.querySelector(containerSelector);

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      updateChart(width, height);
    }
  });

  resizeObserver.observe(container);

  function updateChart(containerWidth, containerHeight) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // 更新 SVG 尺寸
    d3.select(containerSelector)
      .select("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // 更新比例尺
    xScale.range([0, width]);
    yScale.range([height, 0]);

    // 重新渲染图表元素
    // ...
  }

  // 返回清理函数
  return () => resizeObserver.disconnect();
}
```

## 加载外部数据

D3 提供用于加载各种数据格式的工具：

```javascript
// 加载 JSON
d3.json("data.json").then(data => {
  renderChart(data);
}).catch(error => {
  console.error("加载 JSON 错误:", error);
});

// 加载 CSV
d3.csv("data.csv", d => ({
  // 解析时进行类型转换
  name: d.name,
  value: +d.value,  // 将字符串转换为数字
  date: new Date(d.date)
})).then(data => {
  renderChart(data);
});

// 并行加载多个文件
Promise.all([
  d3.json("data1.json"),
  d3.csv("data2.csv"),
  d3.tsv("data3.tsv")
]).then(([json, csv, tsv]) => {
  renderChart(json, csv, tsv);
});

// Async/await 模式
async function loadAndRender() {
  try {
    const data = await d3.json("data.json");
    renderChart(data);
  } catch (error) {
    console.error("加载失败:", error);
  }
}
```

## 性能优化

### 大数据集使用 Canvas

```javascript
// Canvas 对于数千个元素更高效
const canvas = d3.select("#chart")
  .append("canvas")
  .attr("width", width)
  .attr("height", height);

const context = canvas.node().getContext("2d");

function renderCanvas(data) {
  context.clearRect(0, 0, width, height);

  data.forEach(d => {
    context.beginPath();
    context.arc(xScale(d.x), yScale(d.y), 3, 0, 2 * Math.PI);
    context.fillStyle = "steelblue";
    context.fill();
  });
}
```

### 数据聚合

```javascript
// 对大数据集进行采样
function sampleData(data, sampleSize) {
  if (data.length <= sampleSize) return data;
  const step = Math.floor(data.length / sampleSize);
  return data.filter((_, i) => i % step === 0);
}

// 为直方图分箱数据
const bins = d3.bin()
  .value(d => d.value)
  .thresholds(20);

const binnedData = bins(data);
```

### 虚拟渲染

```javascript
// 只渲染可见视口中的元素
function renderVisible(data, viewport) {
  const visibleData = data.filter(d => {
    const cx = xScale(d.x);
    const cy = yScale(d.y);
    return cx >= viewport.left &&
           cx <= viewport.right &&
           cy >= viewport.top &&
           cy <= viewport.bottom;
  });

  svg.selectAll("circle")
    .data(visibleData, d => d.id)
    .join("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", 3);
}
```

## 框架集成

### React 集成

```javascript
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

function BarChart({ data, width, height }) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const xScale = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, width])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([height, 0]);

    svg.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => xScale(d.category))
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d.value))
      .attr("fill", "steelblue");

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

### Vue 集成

```javascript
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

export default {
  props: ['data'],
  setup(props) {
    const svgRef = ref(null);

    function renderChart() {
      const svg = d3.select(svgRef.value);
      // D3 渲染逻辑
    }

    onMounted(() => {
      renderChart();
    });

    watch(() => props.data, () => {
      renderChart();
    });

    return { svgRef };
  },
  template: '<svg ref="svgRef"></svg>'
};
```

## 面试要点

### 常见面试问题

**1. D3.js 中的数据绑定是什么，它是如何工作的？**

数据绑定在数据数组和 DOM 元素之间创建连接。D3 使用 `data()` 方法将数据与选择器关联。enter-update-exit 模式处理数据和元素之间的不匹配：

- Enter：为新数据创建新元素
- Update：修改现有元素
- Exit：移除没有对应数据的元素

**2. D3 提供哪些类型的比例尺，何时应该使用？**

| 比例尺类型 | 使用场景 |
|-----------|---------|
| scaleLinear | 连续数值数据 |
| scaleTime | 日期/时间数据 |
| scaleBand | 带分类数据的柱状图 |
| scaleOrdinal | 将类别映射到颜色 |
| scaleLog | 指数分布的数据 |
| scaleQuantile | 数据驱动的分位数分组 |

**3. 如何在 D3 中创建平滑的过渡？**

```javascript
selection
  .transition()
  .duration(750)
  .ease(d3.easeCubicInOut)
  .attr("x", newValue);
```

使用带有 enter/update/exit 处理程序的 `join()` 方法进行数据驱动的动画。

**4. D3.js 应该如何与 React 集成？**

使用 refs 访问 DOM 元素，使用 useEffect 进行 D3 操作：

```javascript
const svgRef = useRef();

useEffect(() => {
  d3.select(svgRef.current)
    .selectAll("circle")
    .data(data)
    .join("circle")
    // ...
}, [data]);
```

**5. 如何优化大数据集的 D3 性能？**

关键策略包括：
- 对于大量元素使用 Canvas 而不是 SVG
- 数据聚合和采样
- 虚拟渲染（只渲染可见元素）
- 节流/防抖交互事件
- 使用 Web Workers 进行繁重计算

### 最佳实践

1. **使用边距约定**以获得一致的图表布局
2. **始终在数据绑定时使用键**以保持对象恒定性
3. **优先使用 join() 方法**而不是手动 enter/update/exit
4. **创建可重用的图表函数**以提高可维护性
5. **从一开始就处理响应式行为**

## 总结

D3.js 是一个强大而灵活的库，提供对数据可视化的完全控制。本指南涵盖的关键概念包括：

1. **选择器和数据绑定**：D3 的基础，通过 enter-update-exit 模式实现数据驱动的 DOM 操作
2. **比例尺和坐标轴**：将数据映射到视觉属性并为观众提供参考的基本工具
3. **图表构建**：创建柱状图、折线图、饼图和散点图的技术
4. **过渡和动画**：创建平滑、引人入胜的视觉变化
5. **事件处理**：使用工具提示、缩放、拖拽和刷选构建交互式可视化
6. **性能优化**：高效处理大数据集的策略

D3 的学习曲线比高级图表库更陡峭，但在灵活性和控制方面的投资是值得的。从简单的可视化开始，逐渐加入更多功能，并为你的项目构建可重用组件库。

如需继续学习，请探索广泛的 D3 文档和 Observable 平台，该平台托管了数千个交互式 D3 示例和教程。
