---
title: Apache Beam 统一数据处理
description: 使用 Apache Beam 进行统一的批处理和流处理
track: data
section: data-engineering
difficulty: advanced
tags:
  - Apache Beam
  - 批处理
  - 流处理
  - 统一模型
status: imported
origin: old/src/content/docs/data/apache-beam.zh.md
divergence: 0.222
issues: []
legacy:
  category: Data
  subcategory: Processing
  order: 21
  lastUpdated: 2026-01-07
---

Apache Beam 是一个统一的编程模型，用于定义批处理和流式数据并行处理管道。它提供了可在多个分布式处理后端上运行的可移植 API 层。本指南涵盖 Beam 模型、PCollection、转换、窗口化、触发器、运行器和 I/O 连接器。

## 什么是 Apache Beam？

Apache Beam（Batch + strEAM）是一个开源的统一模型，用于定义批处理和流式数据处理管道。其关键创新在于将管道定义与执行引擎分离，使相同的代码可以在不同的分布式处理后端上运行。

### 核心理念

Beam 模型围绕四个关键概念构建，通常称为"What、Where、When、How"模型：

- **What**：正在计算什么结果（转换）
- **Where**：结果在事件时间的哪个位置计算（窗口化）
- **When**：结果在处理时间的什么时候具体化（触发器）
- **How**：结果的细化如何关联（累积）

### 主要优势

- **统一模型**：一次编写，批处理或流式处理使用相同代码
- **可移植性**：在多个运行器上执行（Dataflow、Flink、Spark 等）
- **表达能力**：丰富的窗口化、触发和延迟数据处理
- **可扩展性**：自定义转换、I/O 连接器和运行器
- **语言 SDK**：提供 Java、Python、Go 和实验性 Scala 支持

### 何时使用 Apache Beam

| 用例 | Beam 适用性 |
|------|-------------|
| 统一批处理/流处理管道 | 优秀 |
| 多云可移植性 | 优秀 |
| 复杂事件时间处理 | 优秀 |
| 简单 ETL 作业 | 良好（可能过度） |
| 亚毫秒低延迟 | 有限（直接使用 Flink） |
| 机器学习训练 | 有限（使用 Spark MLlib） |

## Beam 架构

### 管道结构

```
+-------------------+     +-------------------+     +-------------------+
|   数据源          | --> |   转换            | --> |   数据接收器      |
| (I/O 连接器)      |     | (PTransform)      |     | (I/O 连接器)      |
+-------------------+     +-------------------+     +-------------------+
         |                         |                         |
         v                         v                         v
+---------------------------------------------------------------+
|                        PCollection                            |
|              （不可变分布式数据集）                            |
+---------------------------------------------------------------+
         |                         |                         |
         v                         v                         v
+---------------------------------------------------------------+
|                          运行器                               |
|     (Dataflow, Flink, Spark, Direct, Samza 等)               |
+---------------------------------------------------------------+
```

### 核心组件

| 组件 | 描述 |
|------|------|
| **Pipeline** | 封装整个数据处理作业 |
| **PCollection** | 不可变的分布式元素集合 |
| **PTransform** | 转换 PCollection 的操作 |
| **I/O 连接器** | 从外部系统读取和写入 |
| **Runner** | 在特定后端上执行管道 |
| **PipelineOptions** | 管道执行的配置 |

## 入门

### 安装

```bash
# Python SDK
pip install apache-beam

# 带 GCP 特定扩展
pip install apache-beam[gcp]

# 带所有扩展
pip install apache-beam[gcp,aws,azure,dataframe,test]
```

### 基本管道结构

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 定义管道选项
options = PipelineOptions([
    '--runner=DirectRunner',  # 用于开发的本地运行器
    '--project=my-project',
    '--temp_location=gs://my-bucket/temp'
])

# 创建并运行管道
with beam.Pipeline(options=options) as pipeline:
    # 管道定义在此处
    result = (
        pipeline
        | 'Read' >> beam.io.ReadFromText('input.txt')
        | 'Transform' >> beam.Map(lambda x: x.upper())
        | 'Write' >> beam.io.WriteToText('output.txt')
    )
```

### 词频统计示例

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import re

def extract_words(text):
    """从一行文本中提取单词。"""
    return re.findall(r'[A-Za-z\']+', text)

def format_result(word_count):
    """格式化词频统计结果用于输出。"""
    word, count = word_count
    return f'{word}: {count}'

# 创建管道
with beam.Pipeline(options=PipelineOptions()) as p:
    # 从输入文件读取行
    lines = p | 'ReadLines' >> beam.io.ReadFromText('input.txt')

    # 统计词频
    word_counts = (
        lines
        | 'ExtractWords' >> beam.FlatMap(extract_words)
        | 'PairWithOne' >> beam.Map(lambda word: (word.lower(), 1))
        | 'GroupAndSum' >> beam.CombinePerKey(sum)
    )

    # 格式化并写入输出
    output = (
        word_counts
        | 'FormatOutput' >> beam.Map(format_result)
        | 'WriteOutput' >> beam.io.WriteToText('output.txt')
    )
```

## PCollection

### 理解 PCollection

PCollection 表示 Beam 管道中的分布式、不可变数据集。PCollection 可以是有界的（批处理）或无界的（流处理）。

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 从内存数据创建 PCollection
    numbers = p | 'CreateNumbers' >> beam.Create([1, 2, 3, 4, 5])

    # 从文件创建 PCollection
    lines = p | 'ReadFile' >> beam.io.ReadFromText('data.txt')

    # 从 Pub/Sub 创建 PCollection（无界/流式）
    messages = p | 'ReadPubSub' >> beam.io.ReadFromPubSub(
        topic='projects/my-project/topics/my-topic'
    )
```

### PCollection 特性

| 特性 | 描述 |
|------|------|
| **不可变性** | 一旦创建，元素不能被修改 |
| **无随机访问** | 元素只能通过转换访问 |
| **分布式** | 数据自动分布在工作节点上 |
| **带时间戳** | 每个元素都有关联的时间戳 |
| **窗口化** | 元素属于一个或多个窗口 |

### 元素类型和编码器

```python
import apache_beam as beam
from apache_beam.coders import coders

# Beam 会推断类型，但你可以显式指定
@beam.typehints.with_input_types(str)
@beam.typehints.with_output_types(int)
def word_length(word):
    return len(word)

# 复杂类型的自定义编码器
class PersonCoder(coders.Coder):
    def encode(self, person):
        return f'{person.name},{person.age}'.encode('utf-8')

    def decode(self, encoded):
        name, age = encoded.decode('utf-8').split(',')
        return Person(name, int(age))

# 注册编码器
beam.coders.registry.register_coder(Person, PersonCoder)
```

## 核心转换

### 逐元素转换

```python
import apache_beam as beam

with beam.Pipeline() as p:
    numbers = p | beam.Create([1, 2, 3, 4, 5])

    # Map：一对一转换
    squared = numbers | 'Square' >> beam.Map(lambda x: x ** 2)
    # 结果：[1, 4, 9, 16, 25]

    # FlatMap：一对多转换（展平结果）
    expanded = numbers | 'Expand' >> beam.FlatMap(lambda x: range(x))
    # 结果：[0, 0, 1, 0, 1, 2, 0, 1, 2, 3, 0, 1, 2, 3, 4]

    # Filter：选择匹配谓词的元素
    evens = numbers | 'FilterEvens' >> beam.Filter(lambda x: x % 2 == 0)
    # 结果：[2, 4]

    # ParDo：最灵活的逐元素转换
    class ProcessElement(beam.DoFn):
        def process(self, element):
            if element > 2:
                yield element * 10

    processed = numbers | 'ParDo' >> beam.ParDo(ProcessElement())
    # 结果：[30, 40, 50]
```

### ParDo 和 DoFn

```python
import apache_beam as beam
from apache_beam import pvalue

class EnrichmentDoFn(beam.DoFn):
    """带有 setup、process 和 teardown 的示例 DoFn。"""

    def setup(self):
        """每个工作节点在处理开始前调用一次。"""
        self.db_connection = connect_to_database()

    def start_bundle(self):
        """在处理每批元素前调用。"""
        self.batch = []

    def process(self, element, timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam):
        """处理每个元素。"""
        # 访问元素时间戳和窗口
        enriched = {
            'value': element,
            'timestamp': timestamp.to_utc_datetime(),
            'window': str(window)
        }

        # 发出主输出
        yield enriched

        # 发出到副输出（标记输出）
        if element > 100:
            yield pvalue.TaggedOutput('large_values', element)

    def finish_bundle(self):
        """在处理每批后调用。"""
        pass

    def teardown(self):
        """每个工作节点在处理完成时调用一次。"""
        self.db_connection.close()

# 使用带副输出的 DoFn
with beam.Pipeline() as p:
    results = (
        p
        | beam.Create([50, 150, 75, 200])
        | beam.ParDo(EnrichmentDoFn()).with_outputs('large_values', main='enriched')
    )

    main_output = results.enriched
    large_values = results.large_values
```

### 聚合转换

```python
import apache_beam as beam

with beam.Pipeline() as p:
    numbers = p | beam.Create([1, 2, 3, 4, 5])

    # 计算所有元素数量
    count = numbers | 'Count' >> beam.combiners.Count.Globally()
    # 结果：5

    # 求和所有元素
    total = numbers | 'Sum' >> beam.CombineGlobally(sum)
    # 结果：15

    # 平均值
    mean = numbers | 'Mean' >> beam.combiners.Mean.Globally()
    # 结果：3.0

    # 最小值和最大值
    minimum = numbers | 'Min' >> beam.CombineGlobally(min)
    maximum = numbers | 'Max' >> beam.CombineGlobally(max)

    # 前 N 个元素
    top_3 = numbers | 'Top3' >> beam.combiners.Top.Largest(3)
    # 结果：[5, 4, 3]

    # 自定义组合器
    class AverageFn(beam.CombineFn):
        def create_accumulator(self):
            return (0, 0)  # (sum, count)

        def add_input(self, accumulator, input):
            sum_val, count = accumulator
            return (sum_val + input, count + 1)

        def merge_accumulators(self, accumulators):
            sums, counts = zip(*accumulators)
            return (sum(sums), sum(counts))

        def extract_output(self, accumulator):
            sum_val, count = accumulator
            return sum_val / count if count else 0

    average = numbers | 'Average' >> beam.CombineGlobally(AverageFn())
```

### 分组转换

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 键值对
    sales = p | beam.Create([
        ('electronics', 1000),
        ('clothing', 500),
        ('electronics', 1500),
        ('clothing', 300),
        ('electronics', 800)
    ])

    # GroupByKey：按键分组值
    grouped = sales | 'GroupByKey' >> beam.GroupByKey()
    # 结果：[('electronics', [1000, 1500, 800]), ('clothing', [500, 300])]

    # CombinePerKey：按键聚合（比 GroupByKey 更高效）
    totals = sales | 'SumPerKey' >> beam.CombinePerKey(sum)
    # 结果：[('electronics', 3300), ('clothing', 800)]

    # CountPerKey
    counts = sales | 'CountPerKey' >> beam.combiners.Count.PerKey()
    # 结果：[('electronics', 3), ('clothing', 2)]

    # TopPerKey
    top_sales = sales | 'Top2PerKey' >> beam.combiners.Top.PerKey(2)
    # 结果：[('electronics', [1500, 1000]), ('clothing', [500, 300])]
```

### CoGroupByKey（连接）

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 订单
    orders = p | 'Orders' >> beam.Create([
        ('user1', {'order_id': 'O1', 'amount': 100}),
        ('user1', {'order_id': 'O2', 'amount': 200}),
        ('user2', {'order_id': 'O3', 'amount': 150})
    ])

    # 用户资料
    users = p | 'Users' >> beam.Create([
        ('user1', {'name': 'Alice', 'tier': 'gold'}),
        ('user2', {'name': 'Bob', 'tier': 'silver'})
    ])

    # CoGroupByKey 按键连接多个 PCollection
    joined = {'orders': orders, 'users': users} | beam.CoGroupByKey()

    # 处理连接的数据
    def process_joined(element):
        key, grouped = element
        orders_list = list(grouped['orders'])
        users_list = list(grouped['users'])

        if users_list:
            user = users_list[0]
            for order in orders_list:
                yield {
                    'user_id': key,
                    'user_name': user['name'],
                    'order_id': order['order_id'],
                    'amount': order['amount']
                }

    enriched_orders = joined | 'ProcessJoined' >> beam.FlatMap(process_joined)
```

### Flatten 和 Partition

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 创建多个 PCollection
    list1 = p | 'List1' >> beam.Create([1, 2, 3])
    list2 = p | 'List2' >> beam.Create([4, 5, 6])
    list3 = p | 'List3' >> beam.Create([7, 8, 9])

    # Flatten：将多个 PCollection 合并为一个
    merged = (list1, list2, list3) | 'Flatten' >> beam.Flatten()
    # 结果：[1, 2, 3, 4, 5, 6, 7, 8, 9]

    # Partition：将 PCollection 拆分为多个输出
    def partition_fn(element, num_partitions):
        return element % num_partitions

    partitions = merged | 'Partition' >> beam.Partition(partition_fn, 3)
    # partitions[0]: [3, 6, 9]（能被 3 整除）
    # partitions[1]: [1, 4, 7]（余数为 1）
    # partitions[2]: [2, 5, 8]（余数为 2）
```


## 窗口化

### 理解窗口化

窗口化将数据划分为有限的块进行处理。这对于流数据至关重要，但也适用于批处理。

```
事件时间: |---1---|---2---|---3---|---4---|---5---|---6---|---7---|

固定窗口（3 单位）:
            |___________|___________|___________|
                Win1        Win2        Win3

滑动窗口（3 单位，1 单位滑动）:
            |___________|
                |___________|
                    |___________|
                        |___________|

会话窗口（间隔=2）:
            |___|   |_________|   |___|
              S1         S2         S3
```

### 固定窗口

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    events = (
        p
        | 'ReadFromPubSub' >> beam.io.ReadFromPubSub(topic='my-topic')
        | 'ParseTimestamp' >> beam.Map(parse_event_with_timestamp)
    )

    # 1 小时的固定（滚动）窗口
    hourly_counts = (
        events
        | 'FixedWindow' >> beam.WindowInto(window.FixedWindows(60 * 60))  # 3600 秒
        | 'CountPerWindow' >> beam.combiners.Count.Globally()
    )

    # 带自定义时间戳的固定窗口
    windowed = (
        events
        | 'AssignTimestamp' >> beam.Map(
            lambda x: beam.window.TimestampedValue(x, x['event_time'])
        )
        | 'Window5Min' >> beam.WindowInto(window.FixedWindows(5 * 60))
    )
```

### 滑动窗口

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    events = p | 'CreateEvents' >> beam.Create([...])

    # 滑动窗口：10 分钟窗口，每 5 分钟滑动一次
    sliding_counts = (
        events
        | 'SlidingWindow' >> beam.WindowInto(
            window.SlidingWindows(
                size=10 * 60,    # 10 分钟窗口大小
                period=5 * 60    # 每 5 分钟滑动
            )
        )
        | 'CountPerCategory' >> beam.CombinePerKey(sum)
    )

    # 每个事件将出现在 2 个窗口中（10 / 5 = 2）
```

### 会话窗口

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    user_events = p | 'ReadEvents' >> beam.io.ReadFromPubSub(...)

    # 30 分钟间隔的会话窗口
    user_sessions = (
        user_events
        | 'ExtractUserKey' >> beam.Map(lambda e: (e['user_id'], e))
        | 'SessionWindow' >> beam.WindowInto(
            window.Sessions(gap_size=30 * 60)  # 30 分钟不活动间隔
        )
        | 'GroupByUser' >> beam.GroupByKey()
        | 'AnalyzeSession' >> beam.Map(analyze_user_session)
    )
```

### 全局窗口

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    # 全局窗口（批处理的默认值）
    # 所有元素在单个窗口中
    elements = p | beam.Create([1, 2, 3, 4, 5])

    # 显式分配全局窗口
    global_windowed = (
        elements
        | 'GlobalWindow' >> beam.WindowInto(window.GlobalWindows())
        | 'Sum' >> beam.CombineGlobally(sum)
    )
```

### 自定义时间戳

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.window import TimestampedValue
import time

def add_timestamp(element):
    """从元素的 event_time 字段分配时间戳。"""
    # 转换为 Unix 时间戳（秒）
    unix_timestamp = element['event_time'].timestamp()
    return TimestampedValue(element, unix_timestamp)

with beam.Pipeline() as p:
    events = (
        p
        | 'ReadEvents' >> beam.io.ReadFromText('events.json')
        | 'ParseJSON' >> beam.Map(json.loads)
        | 'AddTimestamp' >> beam.Map(add_timestamp)
        | 'Window1Hour' >> beam.WindowInto(window.FixedWindows(3600))
        | 'Process' >> beam.Map(process_event)
    )
```

## 触发器

### 理解触发器

触发器控制何时发出窗口的结果。它们回答"何时应该输出结果？"这个问题。

### 默认触发器

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import (
    AfterWatermark, AfterProcessingTime, AfterCount,
    Repeatedly, AfterAny, AfterAll, AccumulationMode
)

# 默认触发器：当水位线超过窗口结束时触发
# （等待所有数据到达）
with beam.Pipeline() as p:
    (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(window.FixedWindows(60))  # 默认触发器
        | beam.CombineGlobally(sum)
    )
```

### 事件时间触发器

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark

# 带有早期和延迟触发的 AfterWatermark 触发器
trigger = AfterWatermark(
    early=AfterProcessingTime(30),  # 每 30 秒发出早期结果
    late=AfterCount(1)               # 对每个延迟元素触发
)

with beam.Pipeline() as p:
    windowed = (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(
            window.FixedWindows(60),
            trigger=trigger,
            accumulation_mode=AccumulationMode.ACCUMULATING,
            allowed_lateness=Duration(seconds=3600)  # 1 小时延迟数据
        )
        | beam.CombineGlobally(sum)
    )
```

### 处理时间触发器

```python
from apache_beam.transforms.trigger import AfterProcessingTime, Repeatedly

# 每 30 秒处理时间发出结果
trigger = Repeatedly(AfterProcessingTime(30))

with beam.Pipeline() as p:
    (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(
            window.GlobalWindows(),
            trigger=trigger,
            accumulation_mode=AccumulationMode.DISCARDING
        )
        | beam.CombineGlobally(sum)
    )
```

### 数据驱动触发器

```python
from apache_beam.transforms.trigger import AfterCount, Repeatedly

# 每 100 个元素后触发
trigger = Repeatedly(AfterCount(100))

with beam.Pipeline() as p:
    (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(
            window.GlobalWindows(),
            trigger=trigger,
            accumulation_mode=AccumulationMode.ACCUMULATING
        )
        | beam.CombineGlobally(sum)
    )
```

### 复合触发器

```python
from apache_beam.transforms.trigger import (
    AfterWatermark, AfterProcessingTime, AfterCount,
    AfterAny, AfterAll, Repeatedly
)

# AfterAny：当任一触发器触发时触发
any_trigger = AfterAny(
    AfterCount(100),
    AfterProcessingTime(60)
)

# AfterAll：当所有触发器都触发后触发
all_trigger = AfterAll(
    AfterCount(10),
    AfterProcessingTime(30)
)

# 复杂复合触发器
complex_trigger = AfterWatermark(
    early=Repeatedly(
        AfterAny(
            AfterCount(100),
            AfterProcessingTime(60)
        )
    ),
    late=AfterCount(1)
)
```

### 累积模式

```python
from apache_beam.transforms.trigger import AccumulationMode

# DISCARDING：每次触发只输出自上次触发以来的新元素
# 内存高效，但只能看到增量变化
discarding_mode = AccumulationMode.DISCARDING

# ACCUMULATING：每次触发输出窗口中到目前为止的所有元素
# 内存使用较高，但总是能看到完整图景
accumulating_mode = AccumulationMode.ACCUMULATING

# 示例
with beam.Pipeline() as p:
    (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(
            window.FixedWindows(60),
            trigger=Repeatedly(AfterCount(10)),
            accumulation_mode=AccumulationMode.ACCUMULATING
        )
        | beam.CombineGlobally(sum)
    )
```

## 水位线和延迟数据

### 理解水位线

水位线是标记"准时"和"延迟"数据之间边界的阈值。它表示系统对某个事件时间之前的所有数据何时到达的概念。

```
处理时间
     ^
     |                    * (延迟数据)
     |         *    *
     |    *  *    *
     |  *   *   *       ---- 水位线
     |*   *   *   *    /
     |  *   *   *     /
     +----------------+------> 事件时间
                      ^
                      |
                 水位线位置
```

### 处理延迟数据

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark, AfterCount
from apache_beam.utils.timestamp import Duration

with beam.Pipeline() as p:
    events = p | beam.io.ReadFromPubSub(...)

    # 配置带延迟数据处理的窗口化
    windowed = (
        events
        | beam.WindowInto(
            window.FixedWindows(60),
            trigger=AfterWatermark(
                late=AfterCount(1)  # 对每个延迟元素重新触发
            ),
            accumulation_mode=beam.transforms.trigger.AccumulationMode.ACCUMULATING,
            allowed_lateness=Duration(seconds=3600)  # 接受最多 1 小时的延迟数据
        )
    )

    # 处理带延迟数据感知
    result = windowed | beam.CombineGlobally(sum)
```

### 丢弃与累积延迟数据

```python
# 选项 1：丢弃延迟数据（allowed_lateness 未设置时的默认值）
drop_late = beam.WindowInto(
    window.FixedWindows(60),
    allowed_lateness=Duration(seconds=0)
)

# 选项 2：接受并累积延迟数据
accept_late = beam.WindowInto(
    window.FixedWindows(60),
    trigger=AfterWatermark(late=AfterCount(1)),
    allowed_lateness=Duration(seconds=7200),  # 2 小时
    accumulation_mode=beam.transforms.trigger.AccumulationMode.ACCUMULATING
)

# 选项 3：将延迟数据路由到副输出
class ProcessWithLateData(beam.DoFn):
    def process(self, element, timestamp=beam.DoFn.TimestampParam,
                pane_info=beam.DoFn.PaneInfoParam):
        if pane_info.is_late:
            yield beam.pvalue.TaggedOutput('late', element)
        else:
            yield element
```

## 运行器

### 运行器概述

Apache Beam 支持多个在不同后端执行管道的运行器：

| 运行器 | 用例 | 优势 |
|--------|------|------|
| **DirectRunner** | 开发/测试 | 本地执行，易于调试 |
| **DataflowRunner** | GCP 上的生产环境 | 完全托管，自动扩展 |
| **FlinkRunner** | 生产环境流处理 | 低延迟，精确一次 |
| **SparkRunner** | 现有 Spark 集群 | 批处理优化，ML 支持 |
| **SamzaRunner** | Kafka 为中心的工作负载 | Kafka 集成 |
| **NemoRunner** | 研究/优化 | 执行优化 |

### DirectRunner（本地开发）

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 用于本地开发和测试的 DirectRunner
options = PipelineOptions([
    '--runner=DirectRunner',
    '--direct_num_workers=4',         # 并行工作节点
    '--direct_running_mode=multi_threading'
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.Create([1, 2, 3, 4, 5])
        | beam.Map(lambda x: x * 2)
    )
```

### Google Cloud Dataflow 运行器

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 用于 Google Cloud 生产环境的 DataflowRunner
options = PipelineOptions([
    '--runner=DataflowRunner',
    '--project=my-gcp-project',
    '--region=us-central1',
    '--temp_location=gs://my-bucket/temp',
    '--staging_location=gs://my-bucket/staging',
    '--job_name=my-pipeline-job',
    '--max_num_workers=10',
    '--machine_type=n1-standard-4',
    '--disk_size_gb=100',
    '--autoscaling_algorithm=THROUGHPUT_BASED',
    '--enable_streaming_engine',  # 用于流处理管道
    '--experiments=use_runner_v2'
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.io.ReadFromPubSub(topic='projects/my-project/topics/input')
        | beam.Map(process_message)
        | beam.io.WriteToBigQuery(
            table='my-project:dataset.table',
            write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND
        )
    )
```

### Apache Flink 运行器

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 用于 Flink 集群的 FlinkRunner
options = PipelineOptions([
    '--runner=FlinkRunner',
    '--flink_master=localhost:8081',  # Flink JobManager
    '--parallelism=4',
    '--flink_submit_uber_jar',
    '--checkpointing_interval=60000',  # 60 秒
    '--execution_mode_for_batch=BATCH_FORCED'  # 或 PIPELINED
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.io.ReadFromKafka(
            consumer_config={'bootstrap.servers': 'localhost:9092'},
            topics=['input-topic']
        )
        | beam.Map(process_message)
        | beam.io.WriteToKafka(
            producer_config={'bootstrap.servers': 'localhost:9092'},
            topic='output-topic'
        )
    )
```

### Apache Spark 运行器

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# 用于 Spark 集群的 SparkRunner
options = PipelineOptions([
    '--runner=SparkRunner',
    '--spark_master=spark://master:7077',  # 或本地用 'local[*]'
    '--spark_submit_uber_jar',
    '--spark_rest_url=http://master:6066',
    '--streaming=true'  # 用于流处理管道
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.io.ReadFromText('hdfs://path/to/input')
        | beam.Map(process_line)
        | beam.io.WriteToText('hdfs://path/to/output')
    )
```

### 运行器比较

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

def create_pipeline(runner='DirectRunner'):
    """根据环境使用不同运行器创建管道。"""

    if runner == 'DirectRunner':
        options = PipelineOptions(['--runner=DirectRunner'])
    elif runner == 'DataflowRunner':
        options = PipelineOptions([
            '--runner=DataflowRunner',
            '--project=my-project',
            '--region=us-central1',
            '--temp_location=gs://bucket/temp'
        ])
    elif runner == 'FlinkRunner':
        options = PipelineOptions([
            '--runner=FlinkRunner',
            '--flink_master=localhost:8081'
        ])
    elif runner == 'SparkRunner':
        options = PipelineOptions([
            '--runner=SparkRunner',
            '--spark_master=local[*]'
        ])

    return beam.Pipeline(options=options)

# 使用
import os
runner = os.getenv('BEAM_RUNNER', 'DirectRunner')
p = create_pipeline(runner)
```


## I/O 连接器

### 基于文件的 I/O

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 文本文件
    lines = p | 'ReadText' >> beam.io.ReadFromText(
        'gs://bucket/input.txt',
        skip_header_lines=1
    )
    lines | 'WriteText' >> beam.io.WriteToText(
        'gs://bucket/output',
        file_name_suffix='.txt',
        num_shards=5
    )

    # 带模式的 CSV
    csv_data = p | 'ReadCSV' >> beam.io.ReadFromText('data.csv')
    parsed = csv_data | 'ParseCSV' >> beam.Map(
        lambda line: dict(zip(['col1', 'col2'], line.split(',')))
    )

    # Avro 文件
    avro_records = p | 'ReadAvro' >> beam.io.ReadFromAvro('data.avro')
    avro_records | 'WriteAvro' >> beam.io.WriteToAvro(
        'output.avro',
        schema=avro_schema
    )

    # Parquet 文件
    parquet_data = p | 'ReadParquet' >> beam.io.ReadFromParquet('data.parquet')
    parquet_data | 'WriteParquet' >> beam.io.WriteToParquet(
        'output.parquet',
        schema=pyarrow_schema
    )

    # TFRecord（TensorFlow）
    tf_records = p | 'ReadTFRecord' >> beam.io.ReadFromTFRecord('data.tfrecord')
    tf_records | 'WriteTFRecord' >> beam.io.WriteToTFRecord('output.tfrecord')
```

### Google Cloud I/O

```python
import apache_beam as beam
from apache_beam.io.gcp.bigquery import ReadFromBigQuery, WriteToBigQuery

with beam.Pipeline() as p:
    # BigQuery
    bq_data = p | 'ReadBQ' >> ReadFromBigQuery(
        query='SELECT * FROM `project.dataset.table` WHERE date > "2024-01-01"',
        use_standard_sql=True
    )

    bq_data | 'WriteBQ' >> WriteToBigQuery(
        table='project:dataset.output_table',
        schema='col1:STRING,col2:INTEGER,col3:FLOAT',
        create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
        write_disposition=beam.io.BigQueryDisposition.WRITE_TRUNCATE
    )

    # Pub/Sub
    messages = p | 'ReadPubSub' >> beam.io.ReadFromPubSub(
        topic='projects/project-id/topics/input-topic',
        with_attributes=True
    )

    messages | 'WritePubSub' >> beam.io.WriteToPubSub(
        topic='projects/project-id/topics/output-topic'
    )

    # Cloud Storage（使用 fileio 获得更多控制）
    from apache_beam.io import fileio

    files = (
        p
        | fileio.MatchFiles('gs://bucket/pattern*.json')
        | fileio.ReadMatches()
        | beam.FlatMap(lambda f: json.loads(f.read_utf8()))
    )

    # Bigtable
    from apache_beam.io.gcp.bigtableio import ReadFromBigtable, WriteToBigtable

    bigtable_rows = p | ReadFromBigtable(
        project_id='my-project',
        instance_id='my-instance',
        table_id='my-table'
    )

    # Datastore
    from apache_beam.io.gcp.datastore.v1new.datastoreio import ReadFromDatastore

    entities = p | ReadFromDatastore(
        project='my-project',
        query=datastore_query
    )
```

### Kafka I/O

```python
import apache_beam as beam
from apache_beam.io.kafka import ReadFromKafka, WriteToKafka

with beam.Pipeline() as p:
    # 从 Kafka 读取
    messages = (
        p
        | 'ReadKafka' >> ReadFromKafka(
            consumer_config={
                'bootstrap.servers': 'localhost:9092',
                'group.id': 'my-consumer-group',
                'auto.offset.reset': 'latest'
            },
            topics=['input-topic'],
            with_metadata=True
        )
        | 'ExtractValue' >> beam.Map(lambda kv: kv[1].decode('utf-8'))
    )

    # 处理并写入 Kafka
    (
        messages
        | 'Process' >> beam.Map(process_message)
        | 'FormatOutput' >> beam.Map(lambda x: (None, x.encode('utf-8')))
        | 'WriteKafka' >> WriteToKafka(
            producer_config={'bootstrap.servers': 'localhost:9092'},
            topic='output-topic'
        )
    )
```

### 数据库 I/O

```python
import apache_beam as beam
from apache_beam.io.jdbc import ReadFromJdbc, WriteToJdbc

with beam.Pipeline() as p:
    # JDBC（PostgreSQL、MySQL 等）
    jdbc_data = p | 'ReadJdbc' >> ReadFromJdbc(
        table_name='my_table',
        driver_class_name='org.postgresql.Driver',
        jdbc_url='jdbc:postgresql://localhost:5432/mydb',
        username='user',
        password='password'
    )

    jdbc_data | 'WriteJdbc' >> WriteToJdbc(
        table_name='output_table',
        driver_class_name='org.postgresql.Driver',
        jdbc_url='jdbc:postgresql://localhost:5432/mydb',
        username='user',
        password='password'
    )

    # MongoDB
    from apache_beam.io.mongodbio import ReadFromMongoDB, WriteToMongoDB

    mongo_docs = p | 'ReadMongo' >> ReadFromMongoDB(
        uri='mongodb://localhost:27017',
        db='mydb',
        coll='mycollection',
        filter={'status': 'active'}
    )

    mongo_docs | 'WriteMongo' >> WriteToMongoDB(
        uri='mongodb://localhost:27017',
        db='mydb',
        coll='output_collection'
    )

    # Elasticsearch
    from apache_beam.io.elasticsearch import ReadFromElasticsearch, WriteToElasticsearch

    es_docs = p | 'ReadES' >> ReadFromElasticsearch(
        hosts=['http://localhost:9200'],
        index='my-index',
        query={'match_all': {}}
    )
```

### AWS I/O

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # S3（使用标准文件 I/O 和 s3:// 路径）
    s3_data = p | 'ReadS3' >> beam.io.ReadFromText('s3://bucket/path/file.txt')
    s3_data | 'WriteS3' >> beam.io.WriteToText('s3://bucket/output/file')

    # Kinesis
    from apache_beam.io.kinesis import ReadFromKinesis, WriteToKinesis

    kinesis_records = p | 'ReadKinesis' >> ReadFromKinesis(
        stream_name='my-stream',
        aws_access_key='...',
        aws_secret_key='...',
        region='us-east-1'
    )

    kinesis_records | 'WriteKinesis' >> WriteToKinesis(
        stream_name='output-stream',
        aws_access_key='...',
        aws_secret_key='...',
        region='us-east-1'
    )

    # DynamoDB
    from apache_beam.io.aws.dynamodb import ReadFromDynamoDB, WriteToDynamoDB

    dynamodb_items = p | 'ReadDynamoDB' >> ReadFromDynamoDB(
        table_name='my-table',
        region='us-east-1'
    )
```

## 副输入和副输出

### 副输入

副输入允许您将额外数据传递给转换，超出主 PCollection。

```python
import apache_beam as beam
from apache_beam.pvalue import AsDict, AsSingleton, AsList, AsIter

with beam.Pipeline() as p:
    # 主数据
    transactions = p | 'Transactions' >> beam.Create([
        {'user_id': 'u1', 'amount': 100},
        {'user_id': 'u2', 'amount': 200},
        {'user_id': 'u1', 'amount': 150}
    ])

    # 副输入：作为字典的用户详情
    users = (
        p
        | 'Users' >> beam.Create([
            ('u1', {'name': 'Alice', 'tier': 'gold'}),
            ('u2', {'name': 'Bob', 'tier': 'silver'})
        ])
    )

    # 在转换中使用副输入
    def enrich_transaction(transaction, users_dict):
        user_id = transaction['user_id']
        user_info = users_dict.get(user_id, {})
        return {
            **transaction,
            'user_name': user_info.get('name', 'Unknown'),
            'user_tier': user_info.get('tier', 'basic')
        }

    enriched = transactions | 'Enrich' >> beam.Map(
        enrich_transaction,
        users_dict=AsDict(users)
    )

    # AsSingleton：单值副输入
    threshold = p | 'Threshold' >> beam.Create([1000])

    filtered = transactions | 'Filter' >> beam.Filter(
        lambda t, thresh: t['amount'] < thresh,
        thresh=AsSingleton(threshold)
    )

    # AsList：列表副输入
    blacklist = p | 'Blacklist' >> beam.Create(['u3', 'u4'])

    valid = transactions | 'ValidateUsers' >> beam.Filter(
        lambda t, blocked: t['user_id'] not in blocked,
        blocked=AsList(blacklist)
    )
```

### 副输出（标记输出）

```python
import apache_beam as beam
from apache_beam import pvalue

class RouteByStatus(beam.DoFn):
    def process(self, element):
        if element['status'] == 'success':
            yield element
        elif element['status'] == 'error':
            yield pvalue.TaggedOutput('errors', element)
        else:
            yield pvalue.TaggedOutput('unknown', element)

with beam.Pipeline() as p:
    events = p | 'Events' >> beam.Create([
        {'id': 1, 'status': 'success', 'data': 'a'},
        {'id': 2, 'status': 'error', 'data': 'b'},
        {'id': 3, 'status': 'pending', 'data': 'c'},
        {'id': 4, 'status': 'success', 'data': 'd'}
    ])

    # 处理多个输出
    results = events | 'Route' >> beam.ParDo(RouteByStatus()).with_outputs(
        'errors', 'unknown', main='success'
    )

    # 访问不同的输出
    success_events = results.success
    error_events = results.errors
    unknown_events = results.unknown

    # 写入不同目的地
    success_events | 'WriteSuccess' >> beam.io.WriteToText('success.txt')
    error_events | 'WriteErrors' >> beam.io.WriteToText('errors.txt')
    unknown_events | 'WriteUnknown' >> beam.io.WriteToText('unknown.txt')
```

## 高级模式

### 流处理管道模式

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark, AfterProcessingTime
import json

def parse_message(message):
    """将 Pub/Sub 消息解析为事件。"""
    data = json.loads(message.decode('utf-8'))
    return beam.window.TimestampedValue(data, data['event_time'])

with beam.Pipeline() as p:
    # 读取流数据
    events = (
        p
        | 'ReadPubSub' >> beam.io.ReadFromPubSub(
            subscription='projects/project/subscriptions/sub'
        )
        | 'Parse' >> beam.Map(parse_message)
    )

    # 窗口化和聚合
    aggregated = (
        events
        | 'Window5Min' >> beam.WindowInto(
            window.FixedWindows(5 * 60),
            trigger=AfterWatermark(
                early=AfterProcessingTime(30),
                late=AfterProcessingTime(60)
            ),
            allowed_lateness=beam.utils.timestamp.Duration(seconds=3600),
            accumulation_mode=beam.transforms.trigger.AccumulationMode.ACCUMULATING
        )
        | 'KeyByCategory' >> beam.Map(lambda e: (e['category'], e['value']))
        | 'SumPerCategory' >> beam.CombinePerKey(sum)
    )

    # 写入结果
    aggregated | 'WriteBigQuery' >> beam.io.WriteToBigQuery(
        table='project:dataset.aggregated_events',
        schema='category:STRING,total:FLOAT,window_start:TIMESTAMP',
        create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
        write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND
    )
```

### 带检查点的批处理管道

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

class StatefulProcessing(beam.DoFn):
    """带状态用于去重的 DoFn。"""

    SEEN_STATE = beam.transforms.userstate.SetStateSpec(
        'seen', beam.coders.StrUtf8Coder()
    )

    def process(self, element, seen=beam.DoFn.StateParam(SEEN_STATE)):
        key, value = element
        if key not in seen.read():
            seen.add(key)
            yield element

with beam.Pipeline() as p:
    # 读取并去重
    data = (
        p
        | 'ReadInput' >> beam.io.ReadFromText('input/*.json')
        | 'ParseJSON' >> beam.Map(json.loads)
        | 'KeyById' >> beam.Map(lambda x: (x['id'], x))
        | 'Deduplicate' >> beam.ParDo(StatefulProcessing())
    )

    # 处理并写入
    (
        data
        | 'ProcessRecords' >> beam.Map(process_record)
        | 'WriteOutput' >> beam.io.WriteToText('output/processed')
    )
```

### 错误处理模式

```python
import apache_beam as beam
from apache_beam import pvalue
import traceback

class SafeProcess(beam.DoFn):
    """带错误处理和死信队列的 DoFn。"""

    def process(self, element):
        try:
            # 处理元素
            result = self.transform(element)
            yield result
        except Exception as e:
            # 发送到死信队列并带错误详情
            error_record = {
                'original_data': element,
                'error_message': str(e),
                'error_type': type(e).__name__,
                'stack_trace': traceback.format_exc()
            }
            yield pvalue.TaggedOutput('dead_letter', error_record)

    def transform(self, element):
        # 实际转换逻辑
        return {'processed': element['value'] * 2}

with beam.Pipeline() as p:
    input_data = p | 'Read' >> beam.io.ReadFromText('input.json')

    results = (
        input_data
        | 'Parse' >> beam.Map(json.loads)
        | 'SafeProcess' >> beam.ParDo(SafeProcess()).with_outputs(
            'dead_letter', main='processed'
        )
    )

    # 写入成功结果
    results.processed | 'WriteSuccess' >> beam.io.WriteToText('output/success')

    # 写入失败记录用于调查
    results.dead_letter | 'WriteDLQ' >> beam.io.WriteToText('output/dead_letter')
```

### 扇出/扇入模式

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # 读取输入
    raw_data = p | 'Read' >> beam.io.ReadFromText('input.txt')

    # 扇出：通过多个路径处理相同数据
    path_a = raw_data | 'TransformA' >> beam.Map(transform_a)
    path_b = raw_data | 'TransformB' >> beam.Map(transform_b)
    path_c = raw_data | 'TransformC' >> beam.Map(transform_c)

    # 扇入：合并结果
    merged = (path_a, path_b, path_c) | 'Flatten' >> beam.Flatten()

    # 或使用不同逻辑连接路径
    def join_results(element, path_b_data, path_c_data):
        b_lookup = {x['id']: x for x in path_b_data}
        c_lookup = {x['id']: x for x in path_c_data}
        return {
            'main': element,
            'enriched_b': b_lookup.get(element['id']),
            'enriched_c': c_lookup.get(element['id'])
        }

    joined = path_a | 'JoinAll' >> beam.Map(
        join_results,
        path_b_data=beam.pvalue.AsList(path_b),
        path_c_data=beam.pvalue.AsList(path_c)
    )
```

## 测试 Beam 管道

### 单元测试转换

```python
import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that, equal_to
import unittest

class MyTransformTest(unittest.TestCase):

    def test_word_count(self):
        with TestPipeline() as p:
            input_data = p | beam.Create(['hello world', 'hello beam'])

            output = (
                input_data
                | beam.FlatMap(lambda line: line.split())
                | beam.Map(lambda word: (word, 1))
                | beam.CombinePerKey(sum)
            )

            expected = [('hello', 2), ('world', 1), ('beam', 1)]
            assert_that(output, equal_to(expected))

    def test_filtering(self):
        with TestPipeline() as p:
            input_data = p | beam.Create([1, 2, 3, 4, 5])
            output = input_data | beam.Filter(lambda x: x > 3)

            assert_that(output, equal_to([4, 5]))

    def test_dofn(self):
        """测试自定义 DoFn。"""
        with TestPipeline() as p:
            input_data = p | beam.Create([
                {'value': 10},
                {'value': 20}
            ])

            output = input_data | beam.ParDo(MyCustomDoFn())

            assert_that(output, equal_to([
                {'value': 10, 'processed': True},
                {'value': 20, 'processed': True}
            ]))

if __name__ == '__main__':
    unittest.main()
```

### 带时间戳和窗口的测试

```python
import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that, equal_to
from apache_beam import window
from apache_beam.transforms.window import TimestampedValue

class WindowedTest(unittest.TestCase):

    def test_windowed_aggregation(self):
        with TestPipeline() as p:
            # 创建带时间戳的元素
            input_data = p | beam.Create([
                TimestampedValue(('key', 1), 0),   # 窗口 [0, 60)
                TimestampedValue(('key', 2), 30),  # 窗口 [0, 60)
                TimestampedValue(('key', 3), 90),  # 窗口 [60, 120)
            ])

            output = (
                input_data
                | beam.WindowInto(window.FixedWindows(60))
                | beam.CombinePerKey(sum)
            )

            # 检查结果（跨窗口的值）
            assert_that(output, equal_to([('key', 3), ('key', 3)]))
```

### 集成测试

```python
import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
import tempfile
import os

class IntegrationTest(unittest.TestCase):

    def test_end_to_end_pipeline(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            input_path = os.path.join(tmpdir, 'input.txt')
            output_path = os.path.join(tmpdir, 'output')

            # 写入测试输入
            with open(input_path, 'w') as f:
                f.write('hello world\nbeam test\n')

            # 运行管道
            with TestPipeline() as p:
                (
                    p
                    | beam.io.ReadFromText(input_path)
                    | beam.FlatMap(str.split)
                    | beam.Map(lambda w: (w, 1))
                    | beam.CombinePerKey(sum)
                    | beam.Map(lambda kv: f'{kv[0]}: {kv[1]}')
                    | beam.io.WriteToText(output_path)
                )

            # 验证输出
            output_files = [f for f in os.listdir(tmpdir) if f.startswith('output')]
            self.assertTrue(len(output_files) > 0)
```

## 最佳实践

### 管道设计

1. **设计幂等性**：确保转换可以安全重试
2. **最小化副作用**：尽可能保持转换纯净
3. **使用内置转换**：优先使用 Beam 优化的转换而非自定义代码
4. **为规模设计**：从一开始就为分布式执行设计

### 性能优化

```python
import apache_beam as beam

# 使用 CombinePerKey 而不是 GroupByKey + Map
# 差：
# values | GroupByKey() | Map(lambda kv: (kv[0], sum(kv[1])))

# 好：
values | beam.CombinePerKey(sum)

# 早期过滤以减少数据量
# 差：
# data | Map(expensive_transform) | Filter(condition)

# 好：
data | beam.Filter(condition) | beam.Map(expensive_transform)

# 需要时使用 Reshuffle 打破融合
data | beam.Reshuffle() | beam.Map(cpu_intensive_transform)

# 批量处理外部调用
class BatchedExternalCall(beam.DoFn):
    def __init__(self, batch_size=100):
        self.batch_size = batch_size

    def start_bundle(self):
        self.batch = []

    def process(self, element):
        self.batch.append(element)
        if len(self.batch) >= self.batch_size:
            yield from self._flush()

    def finish_bundle(self):
        yield from self._flush()

    def _flush(self):
        if self.batch:
            results = external_api_batch_call(self.batch)
            self.batch = []
            yield from results

# 使用融合感知的检查点
data | beam.Reshuffle() | checkpoint_transform | beam.Reshuffle() | next_step
```

### 资源管理

```python
import apache_beam as beam

class ManagedResourceDoFn(beam.DoFn):
    """带有正确资源生命周期管理的 DoFn。"""

    def setup(self):
        """每个工作节点调用一次 - 初始化重量级资源。"""
        self.connection_pool = create_connection_pool()
        self.model = load_ml_model()

    def start_bundle(self):
        """每批调用 - 准备处理一批元素。"""
        self.batch_count = 0

    def process(self, element):
        """处理每个元素。"""
        self.batch_count += 1
        result = self.model.predict(element)
        yield result

    def finish_bundle(self):
        """批后调用 - 刷新任何缓冲数据。"""
        logging.info(f'在批中处理了 {self.batch_count} 个元素')

    def teardown(self):
        """每个工作节点调用一次 - 清理资源。"""
        self.connection_pool.close()
        self.model = None
```

### 监控和调试

```python
import apache_beam as beam
from apache_beam.metrics import Metrics

class MonitoredDoFn(beam.DoFn):
    """带有监控指标的 DoFn。"""

    def __init__(self):
        self.elements_processed = Metrics.counter(self.__class__, 'elements_processed')
        self.processing_time = Metrics.distribution(self.__class__, 'processing_time_ms')
        self.errors = Metrics.counter(self.__class__, 'errors')

    def process(self, element):
        import time
        start = time.time()

        try:
            result = self._process_element(element)
            self.elements_processed.inc()
            yield result
        except Exception as e:
            self.errors.inc()
            raise
        finally:
            elapsed_ms = (time.time() - start) * 1000
            self.processing_time.update(elapsed_ms)

    def _process_element(self, element):
        # 实际处理逻辑
        return element
```

## 常见陷阱和解决方案

### 陷阱 1：GroupByKey 的内存问题

```python
# 问题：GroupByKey 将所有值加载到内存
# 解决方案：使用 CombinePerKey 或有状态处理

# 差（热键可能 OOM）：
pairs | beam.GroupByKey() | beam.Map(lambda kv: (kv[0], len(list(kv[1]))))

# 好（增量聚合）：
pairs | beam.combiners.Count.PerKey()
```

### 陷阱 2：序列化失败

```python
# 问题：DoFn 中的不可序列化对象
# 解决方案：在 setup() 中初始化，而不是 __init__

# 差：
class BadDoFn(beam.DoFn):
    def __init__(self):
        self.client = SomeClient()  # 不可序列化！

# 好：
class GoodDoFn(beam.DoFn):
    def setup(self):
        self.client = SomeClient()  # 在工作节点上初始化
```

### 陷阱 3：副输入大小

```python
# 问题：大型副输入导致内存问题
# 解决方案：对大型副输入使用 AsIter 或先过滤

# 差（将整个列表加载到内存）：
large_list = beam.pvalue.AsList(huge_pcollection)

# 好（迭代而不完全物化）：
large_iter = beam.pvalue.AsIter(huge_pcollection)

# 更好（过滤以减小大小）：
filtered = huge_pcollection | beam.Filter(is_relevant)
small_list = beam.pvalue.AsList(filtered)
```

### 陷阱 4：时间戳偏差

```python
# 问题：使用处理时间而不是事件时间
# 解决方案：从事件数据显式分配时间戳

# 差（使用处理时间）：
events | beam.WindowInto(window.FixedWindows(60))

# 好（使用事件时间）：
events | beam.Map(
    lambda e: beam.window.TimestampedValue(e, e['event_timestamp'])
) | beam.WindowInto(window.FixedWindows(60))
```

## 延伸阅读

### 官方资源

- [Apache Beam 文档](https://beam.apache.org/documentation/)
- [Beam 编程指南](https://beam.apache.org/documentation/programming-guide/)
- [Beam SQL](https://beam.apache.org/documentation/dsls/sql/overview/)
- [Beam 转换目录](https://beam.apache.org/documentation/transforms/python/overview/)

### 推荐学习路径

1. 从 Beam 编程指南开始
2. 完成 WordCount 教程
3. 探索内置转换目录
4. 学习流处理的窗口化和触发器
5. 学习特定运行器的优化

### 相关技术

- **Google Cloud Dataflow**：GCP 上完全托管的 Beam 运行器
- **Apache Flink**：替代的流处理框架
- **Apache Spark**：批处理优先的处理框架，支持流处理
- **Apache Kafka**：分布式事件流平台
- **Apache Airflow**：工作流编排（与 Beam 互补）

### 社区资源

- [Beam 用户邮件列表](https://beam.apache.org/community/contact-us/)
- [Stack Overflow - apache-beam 标签](https://stackoverflow.com/questions/tagged/apache-beam)
- [GitHub - apache/beam](https://github.com/apache/beam)

---

Apache Beam 提供了强大的统一模型，用于批处理和流式数据处理。其跨运行器的可移植性使其成为寻求数据基础设施灵活性的组织的绝佳选择。通过掌握 PCollection、转换、窗口化、触发器以及各种运行器和 I/O 连接器，您可以构建健壮、可扩展的数据管道，在多个执行环境中工作。
