---
title: D3.js Data Visualization Guide
description: Master D3.js for interactive data visualizations
track: javascript
section: browser
difficulty: advanced
tags:
  - D3.js
  - Data Visualization
  - SVG
  - Charts
status: imported
origin: old/src/content/docs/frontend/d3js.en.md
divergence: 0.216
issues: []
legacy:
  category: Frontend
  subcategory: Visualization
  order: 26
  lastUpdated: 2026-01-07
---

D3.js (Data-Driven Documents) is a powerful JavaScript library for creating dynamic, interactive data visualizations in web browsers. Unlike higher-level charting libraries that provide pre-built components, D3.js offers low-level building blocks that give developers complete control over every aspect of their visualizations. This comprehensive guide will take you from the fundamental concepts to advanced techniques for creating sophisticated data-driven graphics.

## Introduction to D3.js

### What Makes D3.js Unique

D3.js stands apart from other visualization libraries for several key reasons:

1. **Data-Driven Approach**: D3 binds data directly to DOM elements, allowing the visualization to automatically reflect changes in the underlying data.

2. **Web Standards**: D3 works with standard web technologies (HTML, SVG, CSS), meaning your visualizations are not locked into proprietary formats.

3. **Complete Control**: Rather than providing pre-built chart types, D3 gives you primitives to build any visualization you can imagine.

4. **Large Ecosystem**: D3's modular architecture and extensive community have created a rich ecosystem of plugins, examples, and learning resources.

5. **Production-Ready**: D3 is battle-tested in production by major organizations including The New York Times, GitHub, and Airbnb.

### When to Use D3.js

D3 excels when you need:

- Custom visualizations beyond standard chart types
- Interactive, animated graphics
- Complex data transformations and layouts
- Full control over styling and behavior
- Geospatial visualizations with custom projections

For simpler use cases with standard charts, consider higher-level libraries like Chart.js or ECharts that provide easier APIs at the cost of flexibility.

## Core Concepts: Selections

Selections are the foundation of D3.js, providing a powerful way to manipulate the DOM based on data.

### Basic Selection Methods

D3 provides two primary selection methods that work similarly to CSS selectors:

```javascript
// Select a single element (first match)
const body = d3.select("body");

// Select all matching elements
const paragraphs = d3.selectAll("p");

// Select by ID
const chart = d3.select("#chart");

// Select by class
const bars = d3.selectAll(".bar");

// Nested selections
const tableData = d3.selectAll("table tr")
  .selectAll("td");
```

### Chaining Operations

D3 selections support method chaining, allowing you to perform multiple operations in sequence:

```javascript
d3.select("body")
  .style("background-color", "#f0f0f0")
  .append("h1")
  .text("D3.js Data Visualization")
  .style("color", "steelblue")
  .style("font-family", "Arial, sans-serif");
```

### Manipulating Elements

Selections provide methods for modifying elements:

```javascript
const selection = d3.selectAll(".item");

// Setting attributes
selection.attr("class", "item active");
selection.attr("data-id", (d, i) => i);

// Setting styles
selection.style("color", "blue");
selection.style("opacity", 0.8);

// Setting text content
selection.text("Hello World");

// Setting HTML content
selection.html("<strong>Bold text</strong>");

// Adding/removing classes
selection.classed("highlighted", true);
selection.classed("hidden", false);
```

### Creating and Removing Elements

```javascript
// Append elements
const svg = d3.select("#container")
  .append("svg")
  .attr("width", 800)
  .attr("height", 600);

// Insert before existing elements
d3.select("#container")
  .insert("div", ":first-child")
  .text("Inserted at beginning");

// Remove elements
d3.selectAll(".temporary").remove();
```

## Data Binding: The Heart of D3

Data binding is what makes D3 truly data-driven. It creates a connection between your data and DOM elements.

### The data() Method

The `data()` method joins an array of data to a selection:

```javascript
const data = [4, 8, 15, 16, 23, 42];

// Bind data to existing elements
const bars = d3.select("#chart")
  .selectAll("div")
  .data(data);
```

### The Enter-Update-Exit Pattern

This fundamental pattern handles the three possible states when binding data:

- **Enter**: Data elements without corresponding DOM elements (need to create)
- **Update**: Data elements with corresponding DOM elements (need to update)
- **Exit**: DOM elements without corresponding data (need to remove)

```javascript
const data = [10, 20, 30, 40, 50];

// Select and bind data
const bars = d3.select("#chart")
  .selectAll("div")
  .data(data);

// ENTER: Create new elements for new data
bars.enter()
  .append("div")
  .attr("class", "bar")
  .style("width", d => d * 10 + "px")
  .style("height", "20px")
  .style("background-color", "steelblue")
  .style("margin", "2px")
  .text(d => d);

// UPDATE: Modify existing elements (implicit in selection)
bars.style("width", d => d * 10 + "px")
  .text(d => d);

// EXIT: Remove elements without data
bars.exit().remove();
```

### The Modern join() Method

D3 v5+ introduced `join()` to simplify the enter-update-exit pattern:

```javascript
const data = [10, 20, 30, 40, 50];

// Simple join (handles enter and exit automatically)
d3.select("#chart")
  .selectAll("div")
  .data(data)
  .join("div")
    .attr("class", "bar")
    .style("width", d => d * 10 + "px")
    .style("background-color", "steelblue")
    .text(d => d);

// Advanced join with custom enter/update/exit handling
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

### Data Keys for Object Constancy

When updating data, use keys to maintain object identity:

```javascript
const data = [
  { id: 1, name: "Alice", value: 30 },
  { id: 2, name: "Bob", value: 50 },
  { id: 3, name: "Carol", value: 40 }
];

// Use id as the key function
d3.selectAll(".person")
  .data(data, d => d.id)  // Key function
  .join("div")
    .text(d => `${d.name}: ${d.value}`);
```

Using keys ensures that when data changes, the correct elements are updated rather than being replaced, enabling smooth transitions.

## SVG Fundamentals

SVG (Scalable Vector Graphics) is the primary canvas for D3 visualizations. Understanding SVG is essential for effective D3 development.

### Creating an SVG Container

```javascript
const width = 800;
const height = 600;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", `0 0 ${width} ${height}`);

// Add a group element for organization and transformation
const g = svg.append("g")
  .attr("transform", "translate(50, 50)");
```

### Basic SVG Shapes

```javascript
// Rectangle
g.append("rect")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", 100)
  .attr("height", 50)
  .attr("fill", "steelblue")
  .attr("stroke", "black")
  .attr("stroke-width", 2);

// Circle
g.append("circle")
  .attr("cx", 200)
  .attr("cy", 25)
  .attr("r", 25)
  .attr("fill", "orange");

// Ellipse
g.append("ellipse")
  .attr("cx", 300)
  .attr("cy", 25)
  .attr("rx", 40)
  .attr("ry", 20)
  .attr("fill", "green");

// Line
g.append("line")
  .attr("x1", 350)
  .attr("y1", 0)
  .attr("x2", 450)
  .attr("y2", 50)
  .attr("stroke", "red")
  .attr("stroke-width", 3);

// Text
g.append("text")
  .attr("x", 500)
  .attr("y", 30)
  .attr("font-size", "16px")
  .attr("fill", "purple")
  .text("D3.js SVG");
```

### SVG Paths

Paths are the most powerful SVG element. D3 provides generators to create complex paths:

```javascript
// Manual path using path commands
g.append("path")
  .attr("d", "M 0 0 L 50 50 L 100 0 Z")
  .attr("fill", "none")
  .attr("stroke", "black");

// Using D3 line generator
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

## Scales: Mapping Data to Visual Properties

Scales are functions that map from a data domain to a visual range. They are essential for positioning and sizing elements based on data values.

### Linear Scales

Linear scales create a continuous mapping between numeric domains:

```javascript
// Create a linear scale
const xScale = d3.scaleLinear()
  .domain([0, 100])     // Data range (input)
  .range([0, 800])      // Pixel range (output)
  .nice();              // Round domain to nice values

// Use the scale
console.log(xScale(50));      // 400
console.log(xScale(0));       // 0
console.log(xScale(100));     // 800

// Invert the scale (get data from pixel)
console.log(xScale.invert(400));  // 50

// Clamp values outside domain
const clampedScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, 800])
  .clamp(true);

console.log(clampedScale(150));  // 800 (clamped)
```

### Time Scales

Time scales work with Date objects:

```javascript
const timeScale = d3.scaleTime()
  .domain([new Date(2023, 0, 1), new Date(2023, 11, 31)])
  .range([0, 800]);

console.log(timeScale(new Date(2023, 6, 1)));  // ~400

// UTC time scale for timezone-independent dates
const utcScale = d3.scaleUtc()
  .domain([new Date("2023-01-01"), new Date("2024-01-01")])
  .range([0, 800]);
```

### Band Scales for Categorical Data

Band scales divide a range into uniform bands, ideal for bar charts:

```javascript
const categories = ["A", "B", "C", "D", "E"];

const xBand = d3.scaleBand()
  .domain(categories)
  .range([0, 500])
  .padding(0.1)           // Gap between bands (0-1)
  .paddingInner(0.1)      // Inner padding
  .paddingOuter(0.05);    // Outer padding

console.log(xBand("A"));           // Starting position of band A
console.log(xBand.bandwidth());    // Width of each band
console.log(xBand.step());         // Step between bands
```

### Point Scales

Point scales place points at uniform intervals:

```javascript
const xPoint = d3.scalePoint()
  .domain(["Mon", "Tue", "Wed", "Thu", "Fri"])
  .range([0, 400])
  .padding(0.5);

console.log(xPoint("Wed"));        // Center position
console.log(xPoint.step());        // Distance between points
```

### Ordinal and Color Scales

```javascript
// Ordinal scale with custom range
const colorScale = d3.scaleOrdinal()
  .domain(["Apple", "Banana", "Orange"])
  .range(["#ff0000", "#ffff00", "#ff8800"]);

// Built-in color schemes
const categoryColors = d3.scaleOrdinal(d3.schemeCategory10);
const pairedColors = d3.scaleOrdinal(d3.schemePaired);

// Sequential color scale
const heatScale = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateYlOrRd);

// Diverging color scale
const divergingScale = d3.scaleDiverging()
  .domain([-1, 0, 1])
  .interpolator(d3.interpolateRdBu);
```

### Logarithmic and Power Scales

For exponentially distributed data:

```javascript
// Log scale (base 10 by default)
const logScale = d3.scaleLog()
  .domain([1, 1000])
  .range([0, 300]);

// Power scale
const sqrtScale = d3.scaleSqrt()  // Square root scale
  .domain([0, 100])
  .range([0, 50]);

const powScale = d3.scalePow()
  .exponent(2)
  .domain([0, 10])
  .range([0, 100]);
```

## Axes: Visualizing Scales

Axes provide visual reference for scales, including tick marks and labels.

### Creating Axes

```javascript
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create scales
const xScale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);  // Inverted for SVG coordinates

// Create axis generators
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

// Create SVG and add axes
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Add X axis at the bottom
svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(xAxis);

// Add Y axis on the left
svg.append("g")
  .attr("class", "y-axis")
  .call(yAxis);
```

### Customizing Axes

```javascript
const xAxis = d3.axisBottom(xScale)
  .ticks(10)                          // Approximate number of ticks
  .tickValues([0, 25, 50, 75, 100])   // Specific tick values
  .tickFormat(d => d + "%")           // Custom tick format
  .tickSize(6)                        // Tick line length
  .tickPadding(3);                    // Space between tick and label

// Create grid lines
const yAxisWithGrid = d3.axisLeft(yScale)
  .ticks(5)
  .tickSize(-width)    // Extend ticks across chart
  .tickFormat("");     // No labels on grid lines

// Style grid lines with CSS
svg.selectAll(".y-axis .tick line")
  .attr("stroke", "#ddd")
  .attr("stroke-dasharray", "2,2");
```

### Axis Orientations

D3 provides four axis orientations:

```javascript
const top = d3.axisTop(scale);       // Ticks above, labels above
const bottom = d3.axisBottom(scale); // Ticks below, labels below
const left = d3.axisLeft(scale);     // Ticks left, labels left
const right = d3.axisRight(scale);   // Ticks right, labels right
```

## Building Common Chart Types

### Bar Chart

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

// Scales
const x = d3.scaleBand()
  .domain(data.map(d => d.category))
  .range([0, width])
  .padding(0.1);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .nice()
  .range([height, 0]);

// Axes
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .call(d3.axisLeft(y));

// Bars
svg.selectAll(".bar")
  .data(data)
  .join("rect")
  .attr("class", "bar")
  .attr("x", d => x(d.category))
  .attr("y", d => y(d.value))
  .attr("width", x.bandwidth())
  .attr("height", d => height - y(d.value))
  .attr("fill", "steelblue");

// Value labels
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

### Line Chart

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

// Scales
const x = d3.scaleTime()
  .domain(d3.extent(lineData, d => d.date))
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([0, d3.max(lineData, d => d.value)])
  .nice()
  .range([height, 0]);

// Line generator
const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.value))
  .curve(d3.curveMonotoneX);  // Smooth curve

// Area generator for fill
const area = d3.area()
  .x(d => x(d.date))
  .y0(height)
  .y1(d => y(d.value))
  .curve(d3.curveMonotoneX);

// Axes
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x).ticks(6));

svg.append("g")
  .call(d3.axisLeft(y));

// Area fill
svg.append("path")
  .datum(lineData)
  .attr("fill", "steelblue")
  .attr("fill-opacity", 0.2)
  .attr("d", area);

// Line
svg.append("path")
  .datum(lineData)
  .attr("fill", "none")
  .attr("stroke", "steelblue")
  .attr("stroke-width", 2)
  .attr("d", line);

// Data points
svg.selectAll(".dot")
  .data(lineData)
  .join("circle")
  .attr("class", "dot")
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.value))
  .attr("r", 5)
  .attr("fill", "steelblue");
```

### Pie and Donut Charts

```javascript
const pieData = [
  { name: "Category A", value: 30 },
  { name: "Category B", value: 50 },
  { name: "Category C", value: 20 },
  { name: "Category D", value: 40 }
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

// Color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Pie layout
const pie = d3.pie()
  .value(d => d.value)
  .sort(null);  // Maintain data order

// Arc generator for pie
const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius - 20);

// Arc generator for labels
const labelArc = d3.arc()
  .innerRadius(radius - 80)
  .outerRadius(radius - 80);

// Create pie slices
const arcs = svg.selectAll(".arc")
  .data(pie(pieData))
  .join("g")
  .attr("class", "arc");

arcs.append("path")
  .attr("d", arc)
  .attr("fill", (d, i) => color(i))
  .attr("stroke", "white")
  .attr("stroke-width", 2);

// Add labels
arcs.append("text")
  .attr("transform", d => `translate(${labelArc.centroid(d)})`)
  .attr("text-anchor", "middle")
  .attr("font-size", "12px")
  .text(d => d.data.name);

// For a donut chart, just change innerRadius:
const donutArc = d3.arc()
  .innerRadius(radius - 100)
  .outerRadius(radius - 20);
```

### Scatter Plot

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

// Scales
const x = d3.scaleLinear()
  .domain([0, 100])
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([0, 100])
  .range([height, 0]);

const size = d3.scaleLinear()
  .domain(d3.extent(scatterData, d => d.size))
  .range([5, 20]);

// Axes
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x));

svg.append("g")
  .call(d3.axisLeft(y));

// Points
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

## Transitions and Animations

D3 provides a powerful transition system for creating smooth, animated changes.

### Basic Transitions

```javascript
// Simple transition
d3.select("circle")
  .transition()
  .duration(1000)         // Duration in milliseconds
  .attr("r", 50)
  .attr("fill", "red");

// Delayed transition
d3.selectAll("circle")
  .transition()
  .duration(750)
  .delay((d, i) => i * 100)  // Stagger animations
  .attr("r", 20);
```

### Easing Functions

Easing controls the pace of the animation:

```javascript
// Apply easing
d3.select("rect")
  .transition()
  .duration(1000)
  .ease(d3.easeElastic)    // Elastic bounce effect
  .attr("width", 200);

// Available easing functions:
// d3.easeLinear      - Constant speed
// d3.easeQuad        - Quadratic acceleration
// d3.easeCubic       - Cubic (default)
// d3.easeSin         - Sinusoidal
// d3.easeExp         - Exponential
// d3.easeCircle      - Circular
// d3.easeElastic     - Elastic spring
// d3.easeBack        - Anticipation
// d3.easeBounce      - Bouncing ball

// Each has In, Out, and InOut variants:
d3.easeElasticIn    // Accelerating elastic
d3.easeElasticOut   // Decelerating elastic
d3.easeElasticInOut // Symmetric elastic
```

### Chained Transitions

```javascript
// Sequential transitions
d3.select("rect")
  .transition()
  .duration(500)
  .attr("x", 100)
  .transition()          // Chain another transition
  .duration(500)
  .attr("y", 100)
  .transition()
  .duration(500)
  .attr("fill", "orange");
```

### Named Transitions

Coordinate multiple elements with named transitions:

```javascript
// Create a named transition
const t = d3.transition()
  .duration(1000)
  .ease(d3.easeCubicInOut);

// Apply to multiple selections
d3.selectAll("circle")
  .transition(t)
  .attr("r", 20);

d3.selectAll("rect")
  .transition(t)
  .attr("width", 50);
```

### Transition Events and Promises

```javascript
// Using events
d3.select("circle")
  .transition()
  .duration(750)
  .attr("r", 30)
  .on("start", function() {
    console.log("Animation started");
  })
  .on("end", function() {
    console.log("Animation completed");
  })
  .on("interrupt", function() {
    console.log("Animation was interrupted");
  });

// Using promises (D3 v7+)
d3.select("circle")
  .transition()
  .duration(750)
  .attr("r", 30)
  .end()
  .then(() => {
    console.log("Transition finished, perform next action");
  })
  .catch(() => {
    console.log("Transition was interrupted");
  });
```

### Custom Interpolators

```javascript
// Number animation
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

// Color interpolation
d3.select("circle")
  .transition()
  .duration(1000)
  .attrTween("fill", function() {
    return d3.interpolateRgb("blue", "red");
  });
```

### Animating Data Updates

```javascript
function updateChart(newData) {
  const bars = svg.selectAll(".bar")
    .data(newData, d => d.id);

  // Handle enter/update/exit with transitions
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

## Event Handling and Interactivity

### Basic Event Binding

```javascript
// D3 v7+ event handling (event as first parameter)
d3.selectAll("circle")
  .on("click", function(event, d) {
    console.log("Clicked data:", d);
    console.log("Event:", event);
    console.log("Element:", this);
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

### Tooltips

```javascript
// Create tooltip container
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

// Bind events
d3.selectAll(".bar")
  .on("mouseover", function(event, d) {
    tooltip
      .style("visibility", "visible")
      .html(`<strong>${d.category}</strong><br/>Value: ${d.value}`);

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

### Zoom and Pan

```javascript
// Create zoom behavior
const zoom = d3.zoom()
  .scaleExtent([0.5, 10])    // Min and max zoom levels
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

// Programmatic zoom controls
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

### Drag Behavior

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

// Apply drag to elements
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => d.x)
  .attr("cy", d => d.y)
  .attr("r", 20)
  .attr("fill", "steelblue")
  .call(drag);
```

### Brush Selection

```javascript
// Create brush
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

## Responsive Charts

### Using ViewBox

```javascript
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .classed("responsive-svg", true);

// CSS for responsiveness
/*
.responsive-svg {
  width: 100%;
  height: auto;
}
*/
```

### Using ResizeObserver

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

    // Update SVG dimensions
    d3.select(containerSelector)
      .select("svg")
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Update scales
    xScale.range([0, width]);
    yScale.range([height, 0]);

    // Re-render chart elements
    // ...
  }

  // Return cleanup function
  return () => resizeObserver.disconnect();
}
```

## Loading External Data

D3 provides utilities for loading various data formats:

```javascript
// Load JSON
d3.json("data.json").then(data => {
  renderChart(data);
}).catch(error => {
  console.error("Error loading JSON:", error);
});

// Load CSV
d3.csv("data.csv", d => ({
  // Type conversion during parsing
  name: d.name,
  value: +d.value,  // Convert string to number
  date: new Date(d.date)
})).then(data => {
  renderChart(data);
});

// Load multiple files in parallel
Promise.all([
  d3.json("data1.json"),
  d3.csv("data2.csv"),
  d3.tsv("data3.tsv")
]).then(([json, csv, tsv]) => {
  renderChart(json, csv, tsv);
});

// Async/await pattern
async function loadAndRender() {
  try {
    const data = await d3.json("data.json");
    renderChart(data);
  } catch (error) {
    console.error("Loading failed:", error);
  }
}
```

## Performance Optimization

### Using Canvas for Large Datasets

```javascript
// Canvas is more efficient for thousands of elements
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

### Data Aggregation

```javascript
// Sample large datasets
function sampleData(data, sampleSize) {
  if (data.length <= sampleSize) return data;
  const step = Math.floor(data.length / sampleSize);
  return data.filter((_, i) => i % step === 0);
}

// Bin data for histograms
const bins = d3.bin()
  .value(d => d.value)
  .thresholds(20);

const binnedData = bins(data);
```

### Virtual Rendering

```javascript
// Only render elements in the visible viewport
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

## Framework Integration

### React Integration

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

### Vue Integration

```javascript
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';

export default {
  props: ['data'],
  setup(props) {
    const svgRef = ref(null);

    function renderChart() {
      const svg = d3.select(svgRef.value);
      // D3 rendering logic
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

## Interview Key Points

### Common Interview Questions

**1. What is data binding in D3.js and how does it work?**

Data binding creates a connection between data arrays and DOM elements. D3 uses the `data()` method to associate data with selections. The enter-update-exit pattern handles mismatches between data and elements:

- Enter: Creates new elements for new data
- Update: Modifies existing elements
- Exit: Removes elements without corresponding data

**2. What types of scales does D3 provide and when should each be used?**

| Scale Type | Use Case |
|------------|----------|
| scaleLinear | Continuous numeric data |
| scaleTime | Date/time data |
| scaleBand | Bar charts with categorical data |
| scaleOrdinal | Mapping categories to colors |
| scaleLog | Exponentially distributed data |
| scaleQuantile | Data-driven quantile grouping |

**3. How do you create smooth transitions in D3?**

```javascript
selection
  .transition()
  .duration(750)
  .ease(d3.easeCubicInOut)
  .attr("x", newValue);
```

Use the `join()` method with enter/update/exit handlers for data-driven animations.

**4. How should D3.js be integrated with React?**

Use refs to access DOM elements and useEffect for D3 operations:

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

**5. How do you optimize D3 performance with large datasets?**

Key strategies include:
- Use Canvas instead of SVG for many elements
- Data aggregation and sampling
- Virtual rendering (only render visible elements)
- Throttle/debounce interaction events
- Use Web Workers for heavy computations

### Best Practices

1. **Use the margin convention** for consistent chart layouts
2. **Always use keys** with data binding for object constancy
3. **Prefer the join() method** over manual enter/update/exit
4. **Create reusable chart functions** for maintainability
5. **Handle responsive behavior** from the start

## Summary

D3.js is a powerful and flexible library that provides complete control over data visualization. Key concepts covered in this guide include:

1. **Selections and Data Binding**: The foundation of D3, enabling data-driven DOM manipulation through the enter-update-exit pattern
2. **Scales and Axes**: Essential tools for mapping data to visual properties and providing reference for viewers
3. **Chart Building**: Techniques for creating bar charts, line charts, pie charts, and scatter plots
4. **Transitions and Animation**: Creating smooth, engaging visual changes
5. **Event Handling**: Building interactive visualizations with tooltips, zoom, drag, and brush
6. **Performance Optimization**: Strategies for handling large datasets efficiently

D3's learning curve is steeper than higher-level charting libraries, but the investment pays off in flexibility and control. Start with simple visualizations, gradually incorporate more features, and build a library of reusable components for your projects.

For continued learning, explore the extensive D3 documentation and the Observable platform, which hosts thousands of interactive D3 examples and tutorials.
