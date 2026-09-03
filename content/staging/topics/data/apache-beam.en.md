---
title: Apache Beam Unified Processing
description: Use Apache Beam for unified batch and stream processing
track: data
section: data-engineering
difficulty: advanced
tags:
  - Apache Beam
  - batch processing
  - stream processing
  - unified model
status: imported
origin: old/src/content/docs/data/apache-beam.en.md
divergence: 0.222
issues: []
legacy:
  category: Data
  subcategory: Processing
  order: 21
  lastUpdated: 2026-01-07
---

Apache Beam is a unified programming model for defining both batch and streaming data-parallel processing pipelines. It provides a portable API layer that can run on multiple distributed processing backends. We'll cover the Beam model, PCollections, transforms, windowing, triggers, runners, and I/O connectors.

## What is Apache Beam?

Apache Beam (Batch + strEAM) is an open-source, unified model for defining both batch and streaming data processing pipelines. The key innovation is the separation of the pipeline definition from the execution engine, allowing the same code to run on different distributed processing backends.

### Core Philosophy

The Beam model is built around four key concepts, often called the "What, Where, When, How" model:

- **What**: What results are being computed (transformations)
- **Where**: Where in event time are results computed (windowing)
- **When**: When in processing time are results materialized (triggers)
- **How**: How do refinements of results relate (accumulation)

### Key Advantages

- **Unified Model**: Write once, run batch or streaming with the same code
- **Portability**: Execute on multiple runners (Dataflow, Flink, Spark, etc.)
- **Expressiveness**: Rich windowing, triggering, and late data handling
- **Extensibility**: Custom transforms, I/O connectors, and runners
- **Language SDKs**: Available in Java, Python, Go, and experimental Scala

### When to Use Apache Beam

| Use Case | Beam Suitability |
|----------|------------------|
| Unified batch/streaming pipelines | Excellent |
| Multi-cloud portability | Excellent |
| Complex event-time processing | Excellent |
| Simple ETL jobs | Good (may be overkill) |
| Low-latency sub-millisecond | Limited (use Flink directly) |
| Machine learning training | Limited (use Spark MLlib) |

## Beam Architecture

### Pipeline Structure

```
+-------------------+     +-------------------+     +-------------------+
|   Data Source     | --> |   Transforms      | --> |   Data Sink       |
| (I/O Connector)   |     | (PTransforms)     |     | (I/O Connector)   |
+-------------------+     +-------------------+     +-------------------+
         |                         |                         |
         v                         v                         v
+---------------------------------------------------------------+
|                        PCollections                           |
|              (Immutable Distributed Datasets)                 |
+---------------------------------------------------------------+
         |                         |                         |
         v                         v                         v
+---------------------------------------------------------------+
|                          Runner                               |
|     (Dataflow, Flink, Spark, Direct, Samza, etc.)            |
+---------------------------------------------------------------+
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Pipeline** | Encapsulates the entire data processing job |
| **PCollection** | Immutable, distributed collection of elements |
| **PTransform** | Operation that transforms PCollections |
| **I/O Connectors** | Read from and write to external systems |
| **Runner** | Executes the pipeline on a specific backend |
| **PipelineOptions** | Configuration for the pipeline execution |

## Getting Started

### Installation

```bash
# Python SDK
pip install apache-beam

# With specific extras for GCP
pip install apache-beam[gcp]

# With all extras
pip install apache-beam[gcp,aws,azure,dataframe,test]
```

### Basic Pipeline Structure

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# Define pipeline options
options = PipelineOptions([
    '--runner=DirectRunner',  # Local runner for development
    '--project=my-project',
    '--temp_location=gs://my-bucket/temp'
])

# Create and run pipeline
with beam.Pipeline(options=options) as pipeline:
    # Pipeline definition goes here
    result = (
        pipeline
        | 'Read' >> beam.io.ReadFromText('input.txt')
        | 'Transform' >> beam.Map(lambda x: x.upper())
        | 'Write' >> beam.io.WriteToText('output.txt')
    )
```

### Word Count Example

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import re

def extract_words(text):
    """Extract words from a line of text."""
    return re.findall(r'[A-Za-z\']+', text)

def format_result(word_count):
    """Format the word count result for output."""
    word, count = word_count
    return f'{word}: {count}'

# Create pipeline
with beam.Pipeline(options=PipelineOptions()) as p:
    # Read lines from input file
    lines = p | 'ReadLines' >> beam.io.ReadFromText('input.txt')

    # Count words
    word_counts = (
        lines
        | 'ExtractWords' >> beam.FlatMap(extract_words)
        | 'PairWithOne' >> beam.Map(lambda word: (word.lower(), 1))
        | 'GroupAndSum' >> beam.CombinePerKey(sum)
    )

    # Format and write output
    output = (
        word_counts
        | 'FormatOutput' >> beam.Map(format_result)
        | 'WriteOutput' >> beam.io.WriteToText('output.txt')
    )
```

## PCollections

### Understanding PCollections

A PCollection represents a distributed, immutable dataset in a Beam pipeline. PCollections can be bounded (batch) or unbounded (streaming).

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Create PCollection from in-memory data
    numbers = p | 'CreateNumbers' >> beam.Create([1, 2, 3, 4, 5])

    # PCollection from file
    lines = p | 'ReadFile' >> beam.io.ReadFromText('data.txt')

    # PCollection from Pub/Sub (unbounded/streaming)
    messages = p | 'ReadPubSub' >> beam.io.ReadFromPubSub(
        topic='projects/my-project/topics/my-topic'
    )
```

### PCollection Characteristics

| Characteristic | Description |
|----------------|-------------|
| **Immutability** | Once created, elements cannot be modified |
| **No Random Access** | Elements are accessed through transforms only |
| **Distributed** | Data spread across workers automatically |
| **Timestamped** | Each element has an associated timestamp |
| **Windowed** | Elements belong to one or more windows |

### Element Types and Coders

```python
import apache_beam as beam
from apache_beam.coders import coders

# Beam infers types but you can specify explicitly
@beam.typehints.with_input_types(str)
@beam.typehints.with_output_types(int)
def word_length(word):
    return len(word)

# Custom coder for complex types
class PersonCoder(coders.Coder):
    def encode(self, person):
        return f'{person.name},{person.age}'.encode('utf-8')

    def decode(self, encoded):
        name, age = encoded.decode('utf-8').split(',')
        return Person(name, int(age))

# Register coder
beam.coders.registry.register_coder(Person, PersonCoder)
```

## Core Transforms

### Element-wise Transforms

```python
import apache_beam as beam

with beam.Pipeline() as p:
    numbers = p | beam.Create([1, 2, 3, 4, 5])

    # Map: One-to-one transformation
    squared = numbers | 'Square' >> beam.Map(lambda x: x ** 2)
    # Result: [1, 4, 9, 16, 25]

    # FlatMap: One-to-many transformation (flattens results)
    expanded = numbers | 'Expand' >> beam.FlatMap(lambda x: range(x))
    # Result: [0, 0, 1, 0, 1, 2, 0, 1, 2, 3, 0, 1, 2, 3, 4]

    # Filter: Select elements matching predicate
    evens = numbers | 'FilterEvens' >> beam.Filter(lambda x: x % 2 == 0)
    # Result: [2, 4]

    # ParDo: Most flexible element-wise transform
    class ProcessElement(beam.DoFn):
        def process(self, element):
            if element > 2:
                yield element * 10

    processed = numbers | 'ParDo' >> beam.ParDo(ProcessElement())
    # Result: [30, 40, 50]
```

### ParDo and DoFn

```python
import apache_beam as beam
from apache_beam import pvalue

class EnrichmentDoFn(beam.DoFn):
    """Example DoFn with setup, process, and teardown."""

    def setup(self):
        """Called once per worker before processing begins."""
        self.db_connection = connect_to_database()

    def start_bundle(self):
        """Called before processing each bundle of elements."""
        self.batch = []

    def process(self, element, timestamp=beam.DoFn.TimestampParam,
                window=beam.DoFn.WindowParam):
        """Process each element."""
        # Access element timestamp and window
        enriched = {
            'value': element,
            'timestamp': timestamp.to_utc_datetime(),
            'window': str(window)
        }

        # Emit main output
        yield enriched

        # Emit to side output (tagged output)
        if element > 100:
            yield pvalue.TaggedOutput('large_values', element)

    def finish_bundle(self):
        """Called after processing each bundle."""
        pass

    def teardown(self):
        """Called once per worker when processing is complete."""
        self.db_connection.close()

# Using DoFn with side outputs
with beam.Pipeline() as p:
    results = (
        p
        | beam.Create([50, 150, 75, 200])
        | beam.ParDo(EnrichmentDoFn()).with_outputs('large_values', main='enriched')
    )

    main_output = results.enriched
    large_values = results.large_values
```

### Aggregation Transforms

```python
import apache_beam as beam

with beam.Pipeline() as p:
    numbers = p | beam.Create([1, 2, 3, 4, 5])

    # Count all elements
    count = numbers | 'Count' >> beam.combiners.Count.Globally()
    # Result: 5

    # Sum all elements
    total = numbers | 'Sum' >> beam.CombineGlobally(sum)
    # Result: 15

    # Mean
    mean = numbers | 'Mean' >> beam.combiners.Mean.Globally()
    # Result: 3.0

    # Min and Max
    minimum = numbers | 'Min' >> beam.CombineGlobally(min)
    maximum = numbers | 'Max' >> beam.CombineGlobally(max)

    # Top N elements
    top_3 = numbers | 'Top3' >> beam.combiners.Top.Largest(3)
    # Result: [5, 4, 3]

    # Custom combiner
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

### Grouping Transforms

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Key-value pairs
    sales = p | beam.Create([
        ('electronics', 1000),
        ('clothing', 500),
        ('electronics', 1500),
        ('clothing', 300),
        ('electronics', 800)
    ])

    # GroupByKey: Group values by key
    grouped = sales | 'GroupByKey' >> beam.GroupByKey()
    # Result: [('electronics', [1000, 1500, 800]), ('clothing', [500, 300])]

    # CombinePerKey: Aggregate per key (more efficient than GroupByKey)
    totals = sales | 'SumPerKey' >> beam.CombinePerKey(sum)
    # Result: [('electronics', 3300), ('clothing', 800)]

    # CountPerKey
    counts = sales | 'CountPerKey' >> beam.combiners.Count.PerKey()
    # Result: [('electronics', 3), ('clothing', 2)]

    # TopPerKey
    top_sales = sales | 'Top2PerKey' >> beam.combiners.Top.PerKey(2)
    # Result: [('electronics', [1500, 1000]), ('clothing', [500, 300])]
```

### CoGroupByKey (Join)

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Orders
    orders = p | 'Orders' >> beam.Create([
        ('user1', {'order_id': 'O1', 'amount': 100}),
        ('user1', {'order_id': 'O2', 'amount': 200}),
        ('user2', {'order_id': 'O3', 'amount': 150})
    ])

    # User profiles
    users = p | 'Users' >> beam.Create([
        ('user1', {'name': 'Alice', 'tier': 'gold'}),
        ('user2', {'name': 'Bob', 'tier': 'silver'})
    ])

    # CoGroupByKey joins multiple PCollections by key
    joined = {'orders': orders, 'users': users} | beam.CoGroupByKey()

    # Process joined data
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

### Flatten and Partition

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Create multiple PCollections
    list1 = p | 'List1' >> beam.Create([1, 2, 3])
    list2 = p | 'List2' >> beam.Create([4, 5, 6])
    list3 = p | 'List3' >> beam.Create([7, 8, 9])

    # Flatten: Merge multiple PCollections into one
    merged = (list1, list2, list3) | 'Flatten' >> beam.Flatten()
    # Result: [1, 2, 3, 4, 5, 6, 7, 8, 9]

    # Partition: Split PCollection into multiple outputs
    def partition_fn(element, num_partitions):
        return element % num_partitions

    partitions = merged | 'Partition' >> beam.Partition(partition_fn, 3)
    # partitions[0]: [3, 6, 9] (divisible by 3)
    # partitions[1]: [1, 4, 7] (remainder 1)
    # partitions[2]: [2, 5, 8] (remainder 2)
```

## Windowing

### Understanding Windowing

Windowing divides data into finite chunks for processing. This is essential for streaming data but also applicable to batch processing.

```
Event Time: |---1---|---2---|---3---|---4---|---5---|---6---|---7---|

Fixed Windows (3-unit):
            |___________|___________|___________|
                Win1        Win2        Win3

Sliding Windows (3-unit, 1-unit slide):
            |___________|
                |___________|
                    |___________|
                        |___________|

Session Windows (gap=2):
            |___|   |_________|   |___|
              S1         S2         S3
```

### Fixed Windows

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    events = (
        p
        | 'ReadFromPubSub' >> beam.io.ReadFromPubSub(topic='my-topic')
        | 'ParseTimestamp' >> beam.Map(parse_event_with_timestamp)
    )

    # Fixed (tumbling) windows of 1 hour
    hourly_counts = (
        events
        | 'FixedWindow' >> beam.WindowInto(window.FixedWindows(60 * 60))  # 3600 seconds
        | 'CountPerWindow' >> beam.combiners.Count.Globally()
    )

    # Fixed windows with custom timestamp
    windowed = (
        events
        | 'AssignTimestamp' >> beam.Map(
            lambda x: beam.window.TimestampedValue(x, x['event_time'])
        )
        | 'Window5Min' >> beam.WindowInto(window.FixedWindows(5 * 60))
    )
```

### Sliding Windows

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    events = p | 'CreateEvents' >> beam.Create([...])

    # Sliding windows: 10-minute windows, sliding every 5 minutes
    sliding_counts = (
        events
        | 'SlidingWindow' >> beam.WindowInto(
            window.SlidingWindows(
                size=10 * 60,    # 10-minute window size
                period=5 * 60    # Slide every 5 minutes
            )
        )
        | 'CountPerCategory' >> beam.CombinePerKey(sum)
    )

    # Each event will appear in 2 windows (10 / 5 = 2)
```

### Session Windows

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    user_events = p | 'ReadEvents' >> beam.io.ReadFromPubSub(...)

    # Session windows with 30-minute gap
    user_sessions = (
        user_events
        | 'ExtractUserKey' >> beam.Map(lambda e: (e['user_id'], e))
        | 'SessionWindow' >> beam.WindowInto(
            window.Sessions(gap_size=30 * 60)  # 30-minute inactivity gap
        )
        | 'GroupByUser' >> beam.GroupByKey()
        | 'AnalyzeSession' >> beam.Map(analyze_user_session)
    )
```

### Global Windows

```python
import apache_beam as beam
from apache_beam import window

with beam.Pipeline() as p:
    # Global window (default for batch)
    # All elements in a single window
    elements = p | beam.Create([1, 2, 3, 4, 5])

    # Explicitly assign global window
    global_windowed = (
        elements
        | 'GlobalWindow' >> beam.WindowInto(window.GlobalWindows())
        | 'Sum' >> beam.CombineGlobally(sum)
    )
```

### Custom Timestamps

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.window import TimestampedValue
import time

def add_timestamp(element):
    """Assign timestamp from element's event_time field."""
    # Convert to Unix timestamp in seconds
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

## Triggers

### Understanding Triggers

Triggers control when results for a window are emitted. They answer the question "When should I output results?"

### Default Trigger

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import (
    AfterWatermark, AfterProcessingTime, AfterCount,
    Repeatedly, AfterAny, AfterAll, AccumulationMode
)

# Default trigger: fires when watermark passes window end
# (waits for all data to arrive)
with beam.Pipeline() as p:
    (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(window.FixedWindows(60))  # Default trigger
        | beam.CombineGlobally(sum)
    )
```

### Event-Time Triggers

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark

# AfterWatermark trigger with early and late firings
trigger = AfterWatermark(
    early=AfterProcessingTime(30),  # Emit early results every 30 seconds
    late=AfterCount(1)               # Emit on each late element
)

with beam.Pipeline() as p:
    windowed = (
        p
        | beam.io.ReadFromPubSub(...)
        | beam.WindowInto(
            window.FixedWindows(60),
            trigger=trigger,
            accumulation_mode=AccumulationMode.ACCUMULATING,
            allowed_lateness=Duration(seconds=3600)  # 1 hour late data
        )
        | beam.CombineGlobally(sum)
    )
```

### Processing-Time Triggers

```python
from apache_beam.transforms.trigger import AfterProcessingTime, Repeatedly

# Emit results every 30 seconds of processing time
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

### Data-Driven Triggers

```python
from apache_beam.transforms.trigger import AfterCount, Repeatedly

# Emit after every 100 elements
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

### Composite Triggers

```python
from apache_beam.transforms.trigger import (
    AfterWatermark, AfterProcessingTime, AfterCount,
    AfterAny, AfterAll, Repeatedly
)

# AfterAny: Fire when ANY of the triggers fires
any_trigger = AfterAny(
    AfterCount(100),
    AfterProcessingTime(60)
)

# AfterAll: Fire when ALL triggers have fired
all_trigger = AfterAll(
    AfterCount(10),
    AfterProcessingTime(30)
)

# Complex composite trigger
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

### Accumulation Modes

```python
from apache_beam.transforms.trigger import AccumulationMode

# DISCARDING: Each firing outputs only new elements since last firing
# Memory efficient, but you only see incremental changes
discarding_mode = AccumulationMode.DISCARDING

# ACCUMULATING: Each firing outputs all elements in window so far
# Higher memory usage, but you always see complete picture
accumulating_mode = AccumulationMode.ACCUMULATING

# Example
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

## Watermarks and Late Data

### Understanding Watermarks

A watermark is a threshold that marks the boundary between "on-time" and "late" data. It represents the system's notion of when all data up to a certain event time has arrived.

```
Processing Time
     ^
     |                    * (late data)
     |         *    *
     |    *  *    *
     |  *   *   *       ---- Watermark
     |*   *   *   *    /
     |  *   *   *     /
     +----------------+------> Event Time
                      ^
                      |
                 Watermark position
```

### Handling Late Data

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark, AfterCount
from apache_beam.utils.timestamp import Duration

with beam.Pipeline() as p:
    events = p | beam.io.ReadFromPubSub(...)

    # Configure windowing with late data handling
    windowed = (
        events
        | beam.WindowInto(
            window.FixedWindows(60),
            trigger=AfterWatermark(
                late=AfterCount(1)  # Re-fire for each late element
            ),
            accumulation_mode=beam.transforms.trigger.AccumulationMode.ACCUMULATING,
            allowed_lateness=Duration(seconds=3600)  # Accept data up to 1 hour late
        )
    )

    # Process with late data awareness
    result = windowed | beam.CombineGlobally(sum)
```

### Dropping vs Accumulating Late Data

```python
# Option 1: Drop late data (default when allowed_lateness not set)
drop_late = beam.WindowInto(
    window.FixedWindows(60),
    allowed_lateness=Duration(seconds=0)
)

# Option 2: Accept and accumulate late data
accept_late = beam.WindowInto(
    window.FixedWindows(60),
    trigger=AfterWatermark(late=AfterCount(1)),
    allowed_lateness=Duration(seconds=7200),  # 2 hours
    accumulation_mode=beam.transforms.trigger.AccumulationMode.ACCUMULATING
)

# Option 3: Route late data to side output
class ProcessWithLateData(beam.DoFn):
    def process(self, element, timestamp=beam.DoFn.TimestampParam,
                pane_info=beam.DoFn.PaneInfoParam):
        if pane_info.is_late:
            yield beam.pvalue.TaggedOutput('late', element)
        else:
            yield element
```

## Runners

### Overview of Runners

Apache Beam supports multiple runners that execute pipelines on different backends:

| Runner | Use Case | Strengths |
|--------|----------|-----------|
| **DirectRunner** | Development/Testing | Local execution, easy debugging |
| **DataflowRunner** | Production on GCP | Fully managed, auto-scaling |
| **FlinkRunner** | Production streaming | Low latency, exactly-once |
| **SparkRunner** | Existing Spark clusters | Batch optimization, ML support |
| **SamzaRunner** | Kafka-centric workloads | Kafka integration |
| **NemoRunner** | Research/optimization | Execution optimization |

### DirectRunner (Local Development)

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# DirectRunner for local development and testing
options = PipelineOptions([
    '--runner=DirectRunner',
    '--direct_num_workers=4',         # Parallel workers
    '--direct_running_mode=multi_threading'
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.Create([1, 2, 3, 4, 5])
        | beam.Map(lambda x: x * 2)
    )
```

### Google Cloud Dataflow Runner

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# DataflowRunner for production on Google Cloud
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
    '--enable_streaming_engine',  # For streaming pipelines
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

### Apache Flink Runner

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# FlinkRunner for Flink cluster
options = PipelineOptions([
    '--runner=FlinkRunner',
    '--flink_master=localhost:8081',  # Flink JobManager
    '--parallelism=4',
    '--flink_submit_uber_jar',
    '--checkpointing_interval=60000',  # 60 seconds
    '--execution_mode_for_batch=BATCH_FORCED'  # or PIPELINED
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

### Apache Spark Runner

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

# SparkRunner for Spark cluster
options = PipelineOptions([
    '--runner=SparkRunner',
    '--spark_master=spark://master:7077',  # Or 'local[*]' for local
    '--spark_submit_uber_jar',
    '--spark_rest_url=http://master:6066',
    '--streaming=true'  # For streaming pipelines
])

with beam.Pipeline(options=options) as p:
    result = (
        p
        | beam.io.ReadFromText('hdfs://path/to/input')
        | beam.Map(process_line)
        | beam.io.WriteToText('hdfs://path/to/output')
    )
```

### Runner Comparison

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

def create_pipeline(runner='DirectRunner'):
    """Create pipeline with different runners based on environment."""

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

# Usage
import os
runner = os.getenv('BEAM_RUNNER', 'DirectRunner')
p = create_pipeline(runner)
```

## I/O Connectors

### File-Based I/O

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Text files
    lines = p | 'ReadText' >> beam.io.ReadFromText(
        'gs://bucket/input.txt',
        skip_header_lines=1
    )
    lines | 'WriteText' >> beam.io.WriteToText(
        'gs://bucket/output',
        file_name_suffix='.txt',
        num_shards=5
    )

    # CSV with schema
    csv_data = p | 'ReadCSV' >> beam.io.ReadFromText('data.csv')
    parsed = csv_data | 'ParseCSV' >> beam.Map(
        lambda line: dict(zip(['col1', 'col2'], line.split(',')))
    )

    # Avro files
    avro_records = p | 'ReadAvro' >> beam.io.ReadFromAvro('data.avro')
    avro_records | 'WriteAvro' >> beam.io.WriteToAvro(
        'output.avro',
        schema=avro_schema
    )

    # Parquet files
    parquet_data = p | 'ReadParquet' >> beam.io.ReadFromParquet('data.parquet')
    parquet_data | 'WriteParquet' >> beam.io.WriteToParquet(
        'output.parquet',
        schema=pyarrow_schema
    )

    # TFRecord (TensorFlow)
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

    # Cloud Storage (using fileio for more control)
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
    # Read from Kafka
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

    # Process and write to Kafka
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

### Database I/O

```python
import apache_beam as beam
from apache_beam.io.jdbc import ReadFromJdbc, WriteToJdbc

with beam.Pipeline() as p:
    # JDBC (PostgreSQL, MySQL, etc.)
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
    # S3 (using standard file I/O with s3:// paths)
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

## Side Inputs and Side Outputs

### Side Inputs

Side inputs allow you to pass additional data to a transform beyond the main PCollection.

```python
import apache_beam as beam
from apache_beam.pvalue import AsDict, AsSingleton, AsList, AsIter

with beam.Pipeline() as p:
    # Main data
    transactions = p | 'Transactions' >> beam.Create([
        {'user_id': 'u1', 'amount': 100},
        {'user_id': 'u2', 'amount': 200},
        {'user_id': 'u1', 'amount': 150}
    ])

    # Side input: User details as dictionary
    users = (
        p
        | 'Users' >> beam.Create([
            ('u1', {'name': 'Alice', 'tier': 'gold'}),
            ('u2', {'name': 'Bob', 'tier': 'silver'})
        ])
    )

    # Use side input in transform
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

    # AsSingleton: Single value side input
    threshold = p | 'Threshold' >> beam.Create([1000])

    filtered = transactions | 'Filter' >> beam.Filter(
        lambda t, thresh: t['amount'] < thresh,
        thresh=AsSingleton(threshold)
    )

    # AsList: List side input
    blacklist = p | 'Blacklist' >> beam.Create(['u3', 'u4'])

    valid = transactions | 'ValidateUsers' >> beam.Filter(
        lambda t, blocked: t['user_id'] not in blocked,
        blocked=AsList(blacklist)
    )
```

### Side Outputs (Tagged Outputs)

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

    # Process with multiple outputs
    results = events | 'Route' >> beam.ParDo(RouteByStatus()).with_outputs(
        'errors', 'unknown', main='success'
    )

    # Access different outputs
    success_events = results.success
    error_events = results.errors
    unknown_events = results.unknown

    # Write to different destinations
    success_events | 'WriteSuccess' >> beam.io.WriteToText('success.txt')
    error_events | 'WriteErrors' >> beam.io.WriteToText('errors.txt')
    unknown_events | 'WriteUnknown' >> beam.io.WriteToText('unknown.txt')
```

## Advanced Patterns

### Streaming Pipeline Pattern

```python
import apache_beam as beam
from apache_beam import window
from apache_beam.transforms.trigger import AfterWatermark, AfterProcessingTime
import json

def parse_message(message):
    """Parse Pub/Sub message to event."""
    data = json.loads(message.decode('utf-8'))
    return beam.window.TimestampedValue(data, data['event_time'])

with beam.Pipeline() as p:
    # Read streaming data
    events = (
        p
        | 'ReadPubSub' >> beam.io.ReadFromPubSub(
            subscription='projects/project/subscriptions/sub'
        )
        | 'Parse' >> beam.Map(parse_message)
    )

    # Window and aggregate
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

    # Write results
    aggregated | 'WriteBigQuery' >> beam.io.WriteToBigQuery(
        table='project:dataset.aggregated_events',
        schema='category:STRING,total:FLOAT,window_start:TIMESTAMP',
        create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
        write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND
    )
```

### Batch Pipeline with Checkpointing

```python
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions

class StatefulProcessing(beam.DoFn):
    """DoFn with state for deduplication."""

    SEEN_STATE = beam.transforms.userstate.SetStateSpec(
        'seen', beam.coders.StrUtf8Coder()
    )

    def process(self, element, seen=beam.DoFn.StateParam(SEEN_STATE)):
        key, value = element
        if key not in seen.read():
            seen.add(key)
            yield element

with beam.Pipeline() as p:
    # Read and deduplicate
    data = (
        p
        | 'ReadInput' >> beam.io.ReadFromText('input/*.json')
        | 'ParseJSON' >> beam.Map(json.loads)
        | 'KeyById' >> beam.Map(lambda x: (x['id'], x))
        | 'Deduplicate' >> beam.ParDo(StatefulProcessing())
    )

    # Process and write
    (
        data
        | 'ProcessRecords' >> beam.Map(process_record)
        | 'WriteOutput' >> beam.io.WriteToText('output/processed')
    )
```

### Error Handling Pattern

```python
import apache_beam as beam
from apache_beam import pvalue
import traceback

class SafeProcess(beam.DoFn):
    """DoFn with error handling and dead letter queue."""

    def process(self, element):
        try:
            # Process element
            result = self.transform(element)
            yield result
        except Exception as e:
            # Send to dead letter queue with error details
            error_record = {
                'original_data': element,
                'error_message': str(e),
                'error_type': type(e).__name__,
                'stack_trace': traceback.format_exc()
            }
            yield pvalue.TaggedOutput('dead_letter', error_record)

    def transform(self, element):
        # Actual transformation logic
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

    # Write successful results
    results.processed | 'WriteSuccess' >> beam.io.WriteToText('output/success')

    # Write failed records for investigation
    results.dead_letter | 'WriteDLQ' >> beam.io.WriteToText('output/dead_letter')
```

### Fan-Out / Fan-In Pattern

```python
import apache_beam as beam

with beam.Pipeline() as p:
    # Read input
    raw_data = p | 'Read' >> beam.io.ReadFromText('input.txt')

    # Fan-out: Process same data through multiple paths
    path_a = raw_data | 'TransformA' >> beam.Map(transform_a)
    path_b = raw_data | 'TransformB' >> beam.Map(transform_b)
    path_c = raw_data | 'TransformC' >> beam.Map(transform_c)

    # Fan-in: Merge results
    merged = (path_a, path_b, path_c) | 'Flatten' >> beam.Flatten()

    # Or join paths with different logic
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

## Testing Beam Pipelines

### Unit Testing Transforms

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
        """Test a custom DoFn."""
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

### Testing with Timestamps and Windows

```python
import apache_beam as beam
from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.util import assert_that, equal_to
from apache_beam import window
from apache_beam.transforms.window import TimestampedValue

class WindowedTest(unittest.TestCase):

    def test_windowed_aggregation(self):
        with TestPipeline() as p:
            # Create timestamped elements
            input_data = p | beam.Create([
                TimestampedValue(('key', 1), 0),   # Window [0, 60)
                TimestampedValue(('key', 2), 30),  # Window [0, 60)
                TimestampedValue(('key', 3), 90),  # Window [60, 120)
            ])

            output = (
                input_data
                | beam.WindowInto(window.FixedWindows(60))
                | beam.CombinePerKey(sum)
            )

            # Check results (values across windows)
            assert_that(output, equal_to([('key', 3), ('key', 3)]))
```

### Integration Testing

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

            # Write test input
            with open(input_path, 'w') as f:
                f.write('hello world\nbeam test\n')

            # Run pipeline
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

            # Verify output
            output_files = [f for f in os.listdir(tmpdir) if f.startswith('output')]
            self.assertTrue(len(output_files) > 0)
```

## Best Practices

### Pipeline Design

1. **Design for Idempotency**: Ensure transforms can be safely retried
2. **Minimize Side Effects**: Keep transforms pure when possible
3. **Use Built-in Transforms**: Prefer Beam's optimized transforms over custom code
4. **Plan for Scale**: Design for distributed execution from the start

### Performance Optimization

```python
import apache_beam as beam

# Use CombinePerKey instead of GroupByKey + Map
# Bad:
# values | GroupByKey() | Map(lambda kv: (kv[0], sum(kv[1])))

# Good:
values | beam.CombinePerKey(sum)

# Filter early to reduce data volume
# Bad:
# data | Map(expensive_transform) | Filter(condition)

# Good:
data | beam.Filter(condition) | beam.Map(expensive_transform)

# Use Reshuffle to break fusion when needed
data | beam.Reshuffle() | beam.Map(cpu_intensive_transform)

# Batch operations for external calls
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

# Use fusion-aware checkpointing
data | beam.Reshuffle() | checkpoint_transform | beam.Reshuffle() | next_step
```

### Resource Management

```python
import apache_beam as beam

class ManagedResourceDoFn(beam.DoFn):
    """DoFn with proper resource lifecycle management."""

    def setup(self):
        """Called once per worker - initialize heavy resources."""
        self.connection_pool = create_connection_pool()
        self.model = load_ml_model()

    def start_bundle(self):
        """Called per bundle - prepare for batch of elements."""
        self.batch_count = 0

    def process(self, element):
        """Process each element."""
        self.batch_count += 1
        result = self.model.predict(element)
        yield result

    def finish_bundle(self):
        """Called after bundle - flush any buffered data."""
        logging.info(f'Processed {self.batch_count} elements in bundle')

    def teardown(self):
        """Called once per worker - cleanup resources."""
        self.connection_pool.close()
        self.model = None
```

### Monitoring and Debugging

```python
import apache_beam as beam
from apache_beam.metrics import Metrics

class MonitoredDoFn(beam.DoFn):
    """DoFn with metrics for monitoring."""

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
        # Actual processing logic
        return element
```

## Common Pitfalls and Solutions

### Pitfall 1: Memory Issues with GroupByKey

```python
# Problem: GroupByKey loads all values into memory
# Solution: Use CombinePerKey or stateful processing

# Bad (can OOM on hot keys):
pairs | beam.GroupByKey() | beam.Map(lambda kv: (kv[0], len(list(kv[1]))))

# Good (aggregates incrementally):
pairs | beam.combiners.Count.PerKey()
```

### Pitfall 2: Serialization Failures

```python
# Problem: Non-serializable objects in DoFn
# Solution: Initialize in setup(), not __init__

# Bad:
class BadDoFn(beam.DoFn):
    def __init__(self):
        self.client = SomeClient()  # Not serializable!

# Good:
class GoodDoFn(beam.DoFn):
    def setup(self):
        self.client = SomeClient()  # Initialized on worker
```

### Pitfall 3: Side Input Size

```python
# Problem: Large side inputs cause memory issues
# Solution: Use AsIter for large side inputs or filter first

# Bad (loads entire list into memory):
large_list = beam.pvalue.AsList(huge_pcollection)

# Good (iterates without full materialization):
large_iter = beam.pvalue.AsIter(huge_pcollection)

# Better (filter to reduce size):
filtered = huge_pcollection | beam.Filter(is_relevant)
small_list = beam.pvalue.AsList(filtered)
```

### Pitfall 4: Timestamp Skew

```python
# Problem: Processing time used instead of event time
# Solution: Explicitly assign timestamps from event data

# Bad (uses processing time):
events | beam.WindowInto(window.FixedWindows(60))

# Good (uses event time):
events | beam.Map(
    lambda e: beam.window.TimestampedValue(e, e['event_timestamp'])
) | beam.WindowInto(window.FixedWindows(60))
```

## Further Reading

### Official Resources

- [Apache Beam Documentation](https://beam.apache.org/documentation/)
- [Beam Programming Guide](https://beam.apache.org/documentation/programming-guide/)
- [Beam SQL](https://beam.apache.org/documentation/dsls/sql/overview/)
- [Beam Transforms Catalog](https://beam.apache.org/documentation/transforms/python/overview/)

### Recommended Learning Path

1. Start with the Beam Programming Guide
2. Complete the WordCount tutorial
3. Explore the built-in transforms catalog
4. Study windowing and triggers for streaming
5. Learn runner-specific optimizations

### Related Technologies

- **Google Cloud Dataflow**: Fully managed Beam runner on GCP
- **Apache Flink**: Alternative stream processing framework
- **Apache Spark**: Batch-first processing with streaming support
- **Apache Kafka**: Distributed event streaming platform
- **Apache Airflow**: Workflow orchestration (complements Beam)

### Community Resources

- [Beam User Mailing List](https://beam.apache.org/community/contact-us/)
- [Stack Overflow - apache-beam tag](https://stackoverflow.com/questions/tagged/apache-beam)
- [GitHub - apache/beam](https://github.com/apache/beam)

---

Apache Beam provides a powerful unified model for both batch and streaming data processing. Its portability across runners makes it an excellent choice for organizations seeking flexibility in their data infrastructure. By mastering PCollections, transforms, windowing, triggers, and the various runners and I/O connectors, you can build robust, scalable data pipelines that work across multiple execution environments.
