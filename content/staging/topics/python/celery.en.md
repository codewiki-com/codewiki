---
title: Python Celery Distributed Task Queue
description: Learn Celery for async task processing and distributed task scheduling
track: python
section: concurrency
difficulty: intermediate
tags:
  - Python
  - Celery
  - task queue
  - distributed
status: imported
origin: old/src/content/docs/python/celery.en.md
divergence: 0.228
issues: []
legacy:
  category: Python
  subcategory: Async
  order: 40
  lastUpdated: 2026-01-07
---

## Introduction

Celery is a simple, flexible, and reliable distributed task queue for Python. It enables you to run time-consuming tasks asynchronously in the background, freeing your web application to respond to user requests immediately. Celery is widely used in production environments for handling everything from sending emails to processing images, running machine learning models, and orchestrating complex workflows.

### Why Use Celery?

Modern web applications often need to perform operations that take a long time to complete - sending emails, generating reports, processing uploaded files, or making external API calls. Running these tasks synchronously blocks the request-response cycle, leading to poor user experience and potential timeouts.

Celery solves these problems by:

- **Asynchronous Execution**: Tasks run in the background while your application remains responsive
- **Distributed Processing**: Scale horizontally by adding more workers across multiple machines
- **Reliability**: Built-in retry mechanisms and result persistence ensure tasks complete successfully
- **Scheduling**: Run tasks at specific times or intervals with Celery Beat
- **Monitoring**: Real-time monitoring with Flower and integration with logging systems

### Core Architecture

```
                    ┌─────────────────────────────────────────────────┐
                    │                   Celery System                 │
                    │                                                 │
   Application  ──► │  Producer  ──►  Message Broker  ──►  Workers   │
   (Django/Flask)   │  (Client)       (Redis/RabbitMQ)     (Celery)  │
                    │                       │                 │       │
                    │                       └────────┬────────┘       │
                    │                                │                │
                    │                       Result Backend            │
                    │                       (Redis/Database)          │
                    └─────────────────────────────────────────────────┘
```

**Producer (Client)**: Your application code that sends tasks to the queue
**Message Broker**: Stores and delivers task messages (Redis, RabbitMQ, Amazon SQS)
**Workers**: Processes that consume and execute tasks
**Result Backend**: Optional storage for task results and state

---

## Installation and Setup

### Basic Installation

```bash
# Install Celery
pip install celery

# Install with Redis support (recommended)
pip install celery[redis]

# Install with RabbitMQ support
pip install celery[rabbitmq]

# Install with all extras for development
pip install celery[redis,auth,msgpack]
```

### Message Broker Setup

Celery requires a message broker to send and receive messages. Redis and RabbitMQ are the most common choices.

**Redis (Recommended for simplicity)**:

```bash
# Install Redis on Ubuntu/Debian
sudo apt-get install redis-server

# Install Redis on macOS
brew install redis

# Start Redis
redis-server

# Or using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

**RabbitMQ (Recommended for reliability)**:

```bash
# Install RabbitMQ on Ubuntu/Debian
sudo apt-get install rabbitmq-server

# Install on macOS
brew install rabbitmq

# Using Docker
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management
```

### Project Structure

For a well-organized Celery project, follow this structure:

```
project/
├── config/
│   ├── __init__.py
│   └── celery.py          # Celery app configuration
├── tasks/
│   ├── __init__.py
│   ├── email_tasks.py     # Email-related tasks
│   ├── report_tasks.py    # Report generation tasks
│   └── data_tasks.py      # Data processing tasks
├── app.py                 # Main application
├── requirements.txt
└── .env                   # Environment variables
```

---

## Creating Your First Celery Application

### Basic Configuration

```python
# config/celery.py
from celery import Celery

# Create Celery application instance
app = Celery(
    'myproject',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
    include=['tasks.email_tasks', 'tasks.report_tasks']
)

# Configure Celery settings
app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task execution settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result settings
    result_expires=3600,  # Results expire after 1 hour

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)

# Optional: Configure from object
class CeleryConfig:
    broker_url = 'redis://localhost:6379/0'
    result_backend = 'redis://localhost:6379/1'
    task_serializer = 'json'
    result_serializer = 'json'
    accept_content = ['json']
    timezone = 'UTC'
    enable_utc = True

    # Task routing
    task_routes = {
        'tasks.email_tasks.*': {'queue': 'email'},
        'tasks.report_tasks.*': {'queue': 'reports'},
    }

app.config_from_object(CeleryConfig)

if __name__ == '__main__':
    app.start()
```

### Defining Tasks

```python
# tasks/email_tasks.py
from config.celery import app
from celery import shared_task
import smtplib
from email.mime.text import MIMEText

@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(self, to_address: str, subject: str, body: str):
    """
    Send an email asynchronously.

    Args:
        to_address: Recipient email address
        subject: Email subject
        body: Email body content

    Returns:
        dict: Status and message ID
    """
    try:
        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = 'noreply@example.com'
        msg['To'] = to_address

        with smtplib.SMTP('smtp.example.com', 587) as server:
            server.starttls()
            server.login('user', 'password')
            server.send_message(msg)

        return {'status': 'sent', 'to': to_address}

    except smtplib.SMTPException as exc:
        # Retry on SMTP errors
        raise self.retry(exc=exc)


@shared_task(name='tasks.send_welcome_email')
def send_welcome_email(user_id: int, email: str):
    """
    Send welcome email to new users.
    Using @shared_task for reusable apps.
    """
    subject = "Welcome to Our Platform!"
    body = f"Hello! Your account has been created successfully."

    return send_email.delay(email, subject, body)


# tasks/report_tasks.py
from config.celery import app
from celery import group, chain, chord
import time

@app.task(bind=True)
def generate_report(self, report_type: str, date_range: dict):
    """Generate a report with progress updates."""

    # Update task state for progress tracking
    self.update_state(state='PROGRESS', meta={'stage': 'fetching_data'})
    data = fetch_data(report_type, date_range)

    self.update_state(state='PROGRESS', meta={'stage': 'processing', 'progress': 50})
    processed = process_data(data)

    self.update_state(state='PROGRESS', meta={'stage': 'generating_pdf', 'progress': 80})
    pdf_path = create_pdf(processed)

    return {'status': 'complete', 'file_path': pdf_path}


@app.task(bind=True, time_limit=300, soft_time_limit=240)
def process_large_dataset(self, dataset_id: int):
    """
    Process large datasets with time limits.

    - time_limit: Hard limit, task is killed after this
    - soft_time_limit: Raises SoftTimeLimitExceeded, allowing cleanup
    """
    try:
        # Process data...
        pass
    except SoftTimeLimitExceeded:
        # Clean up and save partial results
        self.update_state(state='PARTIAL', meta={'message': 'Time limit reached'})
        save_partial_results()
```

### Calling Tasks

```python
# app.py
from tasks.email_tasks import send_email, send_welcome_email
from tasks.report_tasks import generate_report

# Method 1: delay() - Simple async call
result = send_email.delay('user@example.com', 'Hello', 'Message body')
print(f"Task ID: {result.id}")

# Method 2: apply_async() - Full control over execution
result = send_email.apply_async(
    args=['user@example.com', 'Hello', 'Message body'],
    kwargs={},
    countdown=60,        # Execute after 60 seconds
    expires=3600,        # Task expires after 1 hour
    queue='email',       # Send to specific queue
    priority=5,          # Priority (0-9, lower is higher priority)
    retry=True,
    retry_policy={
        'max_retries': 3,
        'interval_start': 0,
        'interval_step': 0.2,
        'interval_max': 0.5,
    }
)

# Method 3: Schedule for specific time
from datetime import datetime, timedelta

eta = datetime.utcnow() + timedelta(hours=1)
result = generate_report.apply_async(
    args=['monthly', {'start': '2024-01-01', 'end': '2024-01-31'}],
    eta=eta
)

# Check task state
print(f"State: {result.state}")  # PENDING, STARTED, SUCCESS, FAILURE, RETRY

# Get result (blocking)
try:
    output = result.get(timeout=30)  # Wait up to 30 seconds
    print(f"Result: {output}")
except TimeoutError:
    print("Task did not complete in time")

# Get result without blocking
if result.ready():
    output = result.get()
else:
    print("Task still running")

# Check for success/failure
if result.successful():
    print("Task completed successfully")
elif result.failed():
    print(f"Task failed: {result.result}")  # result.result contains exception
```

---

## Task Patterns and Workflows

### Task Groups (Parallel Execution)

Execute multiple tasks in parallel and collect results:

```python
from celery import group

@app.task
def process_item(item_id: int):
    """Process a single item."""
    # Processing logic
    return {'item_id': item_id, 'status': 'processed'}

@app.task
def aggregate_results(results: list):
    """Aggregate results from parallel tasks."""
    successful = sum(1 for r in results if r['status'] == 'processed')
    return {'total': len(results), 'successful': successful}

# Execute 100 items in parallel
items = range(100)
job = group(process_item.s(item_id) for item_id in items)
result = job.apply_async()

# Get all results
all_results = result.get()  # Returns list of results
print(f"Processed {len(all_results)} items")
```

### Task Chains (Sequential Execution)

Execute tasks one after another, passing results:

```python
from celery import chain

@app.task
def fetch_data(url: str):
    """Fetch data from URL."""
    import requests
    response = requests.get(url)
    return response.json()

@app.task
def transform_data(data: dict):
    """Transform fetched data."""
    # Apply transformations
    return {
        'records': len(data.get('items', [])),
        'transformed': True
    }

@app.task
def save_data(data: dict, destination: str):
    """Save transformed data."""
    # Save to database or file
    return {'saved': True, 'destination': destination}

# Create a chain: fetch -> transform -> save
workflow = chain(
    fetch_data.s('https://api.example.com/data'),
    transform_data.s(),
    save_data.s(destination='database')
)

# Execute the chain
result = workflow.apply_async()

# Get final result
final_result = result.get()
print(f"Workflow complete: {final_result}")
```

### Task Chords (Parallel + Callback)

Execute tasks in parallel, then call a callback with all results:

```python
from celery import chord

@app.task
def process_chunk(chunk_id: int, data: list):
    """Process a chunk of data."""
    processed = [item * 2 for item in data]
    return {'chunk_id': chunk_id, 'count': len(processed)}

@app.task
def summarize_chunks(results: list):
    """Summarize all chunk processing results."""
    total_count = sum(r['count'] for r in results)
    return {
        'total_chunks': len(results),
        'total_items': total_count
    }

# Split data into chunks
data = list(range(1000))
chunk_size = 100
chunks = [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]

# Create chord: process all chunks in parallel, then summarize
workflow = chord(
    (process_chunk.s(i, chunk) for i, chunk in enumerate(chunks)),
    summarize_chunks.s()
)

result = workflow.apply_async()
summary = result.get()
print(f"Summary: {summary}")
```

### Task Signatures and Immutability

```python
from celery import signature

# Create a task signature
sig = send_email.signature(
    args=['user@example.com', 'Subject', 'Body'],
    countdown=60
)

# Immutable signatures (ignore results from previous tasks in chain)
sig_immutable = send_email.si('user@example.com', 'Subject', 'Body')

# Clone and modify signatures
new_sig = sig.clone(args=['other@example.com'])

# Link callbacks
sig.link(log_email_sent.s())         # Called on success
sig.link_error(handle_email_error.s())  # Called on failure

# Execute
result = sig.apply_async()
```

---

## Error Handling and Retries

### Automatic Retries

```python
from celery import app
from celery.exceptions import MaxRetriesExceededError
import requests

@app.task(
    bind=True,
    autoretry_for=(requests.RequestException, ConnectionError),
    retry_backoff=True,           # Exponential backoff
    retry_backoff_max=600,        # Max 10 minutes between retries
    retry_jitter=True,            # Add randomness to prevent thundering herd
    max_retries=5
)
def fetch_external_api(self, url: str):
    """Fetch data from external API with automatic retry."""
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.json()


@app.task(bind=True, max_retries=3)
def manual_retry_task(self, data: dict):
    """Task with manual retry logic."""
    try:
        result = process_data(data)
        return result
    except TemporaryError as exc:
        # Retry with exponential backoff
        retry_in = 2 ** self.request.retries * 60  # 60s, 120s, 240s
        raise self.retry(exc=exc, countdown=retry_in)
    except PermanentError as exc:
        # Don't retry, fail immediately
        raise exc
    except MaxRetriesExceededError:
        # All retries exhausted
        handle_permanent_failure(data)
        raise
```

### Error Callbacks

```python
from celery import app

@app.task
def process_order(order_id: int):
    """Process an order."""
    order = get_order(order_id)
    if not order:
        raise ValueError(f"Order {order_id} not found")

    # Process order...
    return {'order_id': order_id, 'status': 'processed'}


@app.task
def on_order_success(result, order_id: int):
    """Called when order processing succeeds."""
    send_confirmation_email(order_id)
    update_inventory(order_id)


@app.task
def on_order_failure(request, exc, traceback, order_id: int):
    """Called when order processing fails."""
    log_failure(order_id, str(exc))
    notify_support(order_id, exc)


# Link callbacks when calling the task
process_order.apply_async(
    args=[12345],
    link=on_order_success.s(order_id=12345),
    link_error=on_order_failure.s(order_id=12345)
)
```

### Dead Letter Queue Pattern

```python
from celery import app
from celery.signals import task_failure

@app.task(bind=True, max_retries=3)
def critical_task(self, data: dict):
    """Task that sends to dead letter queue after max retries."""
    try:
        return process_critical_data(data)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            # Send to dead letter queue
            send_to_dead_letter_queue.delay(
                task_name=self.name,
                task_args=self.request.args,
                task_kwargs=self.request.kwargs,
                exception=str(exc),
                traceback=traceback.format_exc()
            )
        raise self.retry(exc=exc, countdown=60)


@app.task
def send_to_dead_letter_queue(task_name: str, task_args: tuple,
                               task_kwargs: dict, exception: str,
                               traceback: str):
    """Store failed task for manual review."""
    db.failed_tasks.insert({
        'task_name': task_name,
        'args': task_args,
        'kwargs': task_kwargs,
        'exception': exception,
        'traceback': traceback,
        'failed_at': datetime.utcnow()
    })


# Using signals for global error handling
@task_failure.connect
def handle_task_failure(sender=None, task_id=None, exception=None,
                        args=None, kwargs=None, traceback=None, **kw):
    """Global handler for all task failures."""
    logger.error(f"Task {sender.name}[{task_id}] failed: {exception}")
    metrics.increment('celery.task.failure', tags=[f'task:{sender.name}'])
```

---

## Celery Beat - Periodic Tasks

### Basic Schedule Configuration

```python
# config/celery.py
from celery import Celery
from celery.schedules import crontab

app = Celery('myproject')

# Define periodic tasks
app.conf.beat_schedule = {
    # Execute every 10 minutes
    'cleanup-every-10-minutes': {
        'task': 'tasks.maintenance.cleanup_expired_sessions',
        'schedule': 600.0,  # seconds
    },

    # Execute at specific times using crontab
    'daily-report': {
        'task': 'tasks.reports.generate_daily_report',
        'schedule': crontab(hour=7, minute=30),  # Every day at 7:30 AM
        'args': ('sales',),
    },

    # Execute every Monday at 9:00 AM
    'weekly-newsletter': {
        'task': 'tasks.email.send_newsletter',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
    },

    # Execute on the first day of every month
    'monthly-billing': {
        'task': 'tasks.billing.process_monthly_billing',
        'schedule': crontab(hour=0, minute=0, day_of_month=1),
    },

    # Complex schedule: Every 15 minutes during business hours (Mon-Fri)
    'sync-inventory': {
        'task': 'tasks.inventory.sync_inventory',
        'schedule': crontab(minute='*/15', hour='9-17', day_of_week='mon-fri'),
    },
}

# Configure Beat to use database scheduler (for dynamic schedules)
app.conf.beat_scheduler = 'django_celery_beat.schedulers:DatabaseScheduler'
```

### Dynamic Periodic Tasks

```python
# Using django-celery-beat for dynamic schedules
from django_celery_beat.models import PeriodicTask, IntervalSchedule, CrontabSchedule
import json

# Create an interval schedule
schedule, created = IntervalSchedule.objects.get_or_create(
    every=10,
    period=IntervalSchedule.MINUTES,
)

# Create a periodic task
task = PeriodicTask.objects.create(
    interval=schedule,
    name='Dynamic Task Example',
    task='tasks.dynamic_task',
    args=json.dumps(['arg1', 'arg2']),
    kwargs=json.dumps({'key': 'value'}),
    enabled=True,
)

# Create crontab schedule
cron_schedule, _ = CrontabSchedule.objects.get_or_create(
    minute='0',
    hour='*/2',
    day_of_week='*',
    day_of_month='*',
    month_of_year='*',
)

# Update or disable task
task.enabled = False
task.save()

# Delete task
task.delete()
```

### Running Celery Beat

```bash
# Run Beat scheduler (in a separate terminal)
celery -A config.celery beat --loglevel=info

# Run Beat with database scheduler
celery -A config.celery beat --scheduler django_celery_beat.schedulers:DatabaseScheduler

# Run worker and beat together (development only)
celery -A config.celery worker --beat --loglevel=info
```

---

## Task Routing and Queues

### Configuring Multiple Queues

```python
# config/celery.py
from kombu import Queue, Exchange

app = Celery('myproject')

# Define exchanges
default_exchange = Exchange('default', type='direct')
media_exchange = Exchange('media', type='direct')

# Define queues
app.conf.task_queues = (
    Queue('default', default_exchange, routing_key='default'),
    Queue('high_priority', default_exchange, routing_key='high'),
    Queue('low_priority', default_exchange, routing_key='low'),
    Queue('email', default_exchange, routing_key='email'),
    Queue('media', media_exchange, routing_key='media'),
)

# Default queue
app.conf.task_default_queue = 'default'
app.conf.task_default_exchange = 'default'
app.conf.task_default_routing_key = 'default'

# Task routing
app.conf.task_routes = {
    # Route by task name
    'tasks.email.*': {'queue': 'email'},
    'tasks.media.*': {'queue': 'media'},

    # Route by pattern
    'tasks.*.high_priority_*': {'queue': 'high_priority'},

    # Route with custom router
    'tasks.dynamic_routing': {
        'queue': lambda task, args, kwargs: determine_queue(args, kwargs)
    },
}

def determine_queue(args, kwargs):
    """Dynamic queue routing based on task arguments."""
    priority = kwargs.get('priority', 'normal')
    if priority == 'high':
        return 'high_priority'
    elif priority == 'low':
        return 'low_priority'
    return 'default'
```

### Running Workers for Specific Queues

```bash
# Worker for all queues
celery -A config.celery worker --loglevel=info

# Worker for specific queue
celery -A config.celery worker -Q email --loglevel=info

# Worker for multiple queues
celery -A config.celery worker -Q high_priority,default --loglevel=info

# Worker with concurrency settings
celery -A config.celery worker -Q media -c 2 --loglevel=info

# Worker with specific pool
celery -A config.celery worker -Q email --pool=solo  # Single-threaded
celery -A config.celery worker -Q cpu_bound --pool=prefork -c 4  # Process pool
celery -A config.celery worker -Q io_bound --pool=gevent -c 1000  # Greenlet pool
```

### Priority Queues

```python
# Configure priority queue
app.conf.task_queue_max_priority = 10
app.conf.task_default_priority = 5

# Send task with priority
high_priority_task.apply_async(args=[data], priority=9)  # Higher priority
low_priority_task.apply_async(args=[data], priority=1)   # Lower priority

# Note: Priority support depends on the broker
# RabbitMQ supports native priority queues
# Redis requires separate queues for different priorities
```

---

## Monitoring and Observability

### Flower - Real-time Web Monitor

```bash
# Install Flower
pip install flower

# Run Flower
celery -A config.celery flower --port=5555

# With authentication
celery -A config.celery flower --basic_auth=user:password

# With persistent storage
celery -A config.celery flower --persistent=True --db=flower.db

# Access at http://localhost:5555
```

### Custom Task Events and Signals

```python
from celery.signals import (
    task_prerun, task_postrun, task_success, task_failure,
    task_retry, task_revoked, worker_ready
)
import logging
import time

logger = logging.getLogger(__name__)

# Task lifecycle signals
@task_prerun.connect
def task_prerun_handler(task_id, task, args, kwargs, **kw):
    """Called before task execution."""
    logger.info(f"Task {task.name}[{task_id}] starting with args={args}")
    # Store start time for duration calculation
    task.start_time = time.time()


@task_postrun.connect
def task_postrun_handler(task_id, task, args, kwargs, retval, state, **kw):
    """Called after task execution."""
    duration = time.time() - getattr(task, 'start_time', time.time())
    logger.info(f"Task {task.name}[{task_id}] completed in {duration:.2f}s with state={state}")

    # Send metrics to monitoring system
    send_metrics('celery.task.duration', duration, tags=[f'task:{task.name}'])


@task_success.connect
def task_success_handler(sender, result, **kwargs):
    """Called when task succeeds."""
    send_metrics('celery.task.success', 1, tags=[f'task:{sender.name}'])


@task_failure.connect
def task_failure_handler(sender, task_id, exception, args, kwargs, traceback, **kw):
    """Called when task fails."""
    logger.error(f"Task {sender.name}[{task_id}] failed: {exception}")
    send_metrics('celery.task.failure', 1, tags=[f'task:{sender.name}'])

    # Send alert for critical tasks
    if sender.name.startswith('tasks.critical'):
        send_alert(f"Critical task failed: {sender.name}", str(exception))


@task_retry.connect
def task_retry_handler(sender, request, reason, **kwargs):
    """Called when task is retried."""
    logger.warning(f"Task {sender.name}[{request.id}] retrying: {reason}")
    send_metrics('celery.task.retry', 1, tags=[f'task:{sender.name}'])


@worker_ready.connect
def worker_ready_handler(sender, **kwargs):
    """Called when worker is ready."""
    logger.info(f"Worker {sender.hostname} is ready")
```

### Prometheus Metrics

```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from celery.signals import task_prerun, task_postrun, task_failure

# Define metrics
TASK_COUNTER = Counter(
    'celery_tasks_total',
    'Total number of Celery tasks',
    ['task_name', 'state']
)

TASK_DURATION = Histogram(
    'celery_task_duration_seconds',
    'Task execution duration',
    ['task_name'],
    buckets=[.1, .25, .5, 1, 2.5, 5, 10, 30, 60, 120]
)

ACTIVE_TASKS = Gauge(
    'celery_active_tasks',
    'Number of currently active tasks',
    ['task_name']
)

task_start_times = {}

@task_prerun.connect
def track_task_start(task_id, task, **kwargs):
    task_start_times[task_id] = time.time()
    ACTIVE_TASKS.labels(task_name=task.name).inc()


@task_postrun.connect
def track_task_end(task_id, task, state, **kwargs):
    start_time = task_start_times.pop(task_id, None)
    if start_time:
        duration = time.time() - start_time
        TASK_DURATION.labels(task_name=task.name).observe(duration)

    ACTIVE_TASKS.labels(task_name=task.name).dec()
    TASK_COUNTER.labels(task_name=task.name, state=state).inc()


# Start metrics server
start_http_server(9090)
```

---

## Integration with Web Frameworks

### Django Integration

```python
# myproject/celery.py
import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

app = Celery('myproject')

# Load config from Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


# myproject/__init__.py
from .celery import app as celery_app

__all__ = ('celery_app',)


# myproject/settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/1'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Task routing
CELERY_TASK_ROUTES = {
    'myapp.tasks.*': {'queue': 'default'},
}


# myapp/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth.models import User

@shared_task
def send_welcome_email(user_id: int):
    """Send welcome email to new user."""
    user = User.objects.get(id=user_id)
    send_mail(
        'Welcome!',
        f'Hello {user.username}, welcome to our platform!',
        'noreply@example.com',
        [user.email],
        fail_silently=False,
    )
    return {'user_id': user_id, 'email': user.email}


# myapp/views.py
from django.http import JsonResponse
from .tasks import send_welcome_email

def register_user(request):
    # Create user...
    user = User.objects.create_user(...)

    # Send welcome email asynchronously
    task = send_welcome_email.delay(user.id)

    return JsonResponse({
        'user_id': user.id,
        'task_id': task.id,
        'message': 'Registration successful'
    })
```

### Flask Integration

```python
# app/extensions.py
from celery import Celery

celery = Celery()

def init_celery(app):
    """Initialize Celery with Flask app context."""
    celery.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery


# app/__init__.py
from flask import Flask
from app.extensions import celery, init_celery

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    init_celery(app)

    from app.routes import main
    app.register_blueprint(main)

    return app


# app/tasks.py
from app.extensions import celery
from app.models import User, db

@celery.task
def process_user_data(user_id: int):
    """Process user data with Flask app context."""
    user = User.query.get(user_id)
    if user:
        user.processed = True
        db.session.commit()
    return {'user_id': user_id, 'processed': True}


# app/routes.py
from flask import Blueprint, jsonify
from app.tasks import process_user_data

main = Blueprint('main', __name__)

@main.route('/process/<int:user_id>', methods=['POST'])
def process_user(user_id):
    task = process_user_data.delay(user_id)
    return jsonify({
        'task_id': task.id,
        'status': 'processing'
    })


@main.route('/task/<task_id>')
def get_task_status(task_id):
    from app.extensions import celery
    task = celery.AsyncResult(task_id)

    if task.state == 'PENDING':
        response = {'state': task.state, 'status': 'Task is pending'}
    elif task.state == 'SUCCESS':
        response = {'state': task.state, 'result': task.result}
    elif task.state == 'FAILURE':
        response = {'state': task.state, 'error': str(task.result)}
    else:
        response = {'state': task.state, 'status': str(task.info)}

    return jsonify(response)
```

### FastAPI Integration

```python
# app/celery_app.py
from celery import Celery

celery_app = Celery(
    'worker',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


# app/tasks.py
from app.celery_app import celery_app
import time

@celery_app.task(bind=True)
def long_running_task(self, duration: int):
    """Simulate a long-running task."""
    for i in range(duration):
        time.sleep(1)
        self.update_state(
            state='PROGRESS',
            meta={'current': i + 1, 'total': duration}
        )
    return {'status': 'completed', 'duration': duration}


@celery_app.task
def send_notification(user_id: int, message: str):
    """Send notification to user."""
    # Send notification logic
    return {'user_id': user_id, 'sent': True}


# app/main.py
from fastapi import FastAPI, BackgroundTasks
from celery.result import AsyncResult
from app.celery_app import celery_app
from app.tasks import long_running_task, send_notification
from pydantic import BaseModel

app = FastAPI()

class TaskCreate(BaseModel):
    duration: int = 10

class TaskResponse(BaseModel):
    task_id: str
    status: str

@app.post("/tasks/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate):
    """Create a new background task."""
    task = long_running_task.delay(task_data.duration)
    return TaskResponse(task_id=task.id, status="processing")

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """Get task status and result."""
    task_result = AsyncResult(task_id, app=celery_app)

    result = {
        "task_id": task_id,
        "status": task_result.status,
        "ready": task_result.ready(),
    }

    if task_result.ready():
        result["result"] = task_result.get()
    elif task_result.status == "PROGRESS":
        result["progress"] = task_result.info
    elif task_result.failed():
        result["error"] = str(task_result.result)

    return result

@app.delete("/tasks/{task_id}")
async def revoke_task(task_id: str):
    """Revoke a pending or running task."""
    celery_app.control.revoke(task_id, terminate=True)
    return {"task_id": task_id, "status": "revoked"}
```

---

## Production Best Practices

### Configuration for Production

```python
# config/celery_production.py
from celery import Celery
import os

app = Celery('myproject')

app.conf.update(
    # Broker settings
    broker_url=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    broker_connection_retry_on_startup=True,
    broker_pool_limit=10,

    # Result backend
    result_backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/1'),
    result_expires=86400,  # 24 hours
    result_extended=True,

    # Serialization
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],

    # Task execution
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_time_limit=300,
    task_soft_time_limit=240,

    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    worker_max_memory_per_child=400000,  # 400MB
    worker_disable_rate_limits=False,

    # Concurrency
    worker_concurrency=os.cpu_count() or 4,

    # Security
    task_annotations={
        '*': {
            'rate_limit': '100/m',
        },
        'tasks.critical.*': {
            'rate_limit': '10/m',
        },
    },

    # Logging
    worker_hijack_root_logger=False,
    worker_log_format='[%(asctime)s: %(levelname)s/%(processName)s] %(message)s',

    # Beat settings
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
    beat_max_loop_interval=5,
)
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' celeryuser
USER celeryuser

# Default command (can be overridden)
CMD ["celery", "-A", "config.celery", "worker", "--loglevel=info"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  celery-worker:
    build: .
    command: celery -A config.celery worker --loglevel=info --concurrency=4
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  celery-beat:
    build: .
    command: celery -A config.celery beat --loglevel=info
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
      - celery-worker
    restart: unless-stopped

  flower:
    build: .
    command: celery -A config.celery flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - redis
      - celery-worker

volumes:
  redis_data:
```

### Kubernetes Deployment

```yaml
# celery-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: celery-worker
        image: myapp:latest
        command: ["celery", "-A", "config.celery", "worker", "--loglevel=info"]
        env:
        - name: CELERY_BROKER_URL
          valueFrom:
            secretKeyRef:
              name: celery-secrets
              key: broker-url
        - name: CELERY_RESULT_BACKEND
          valueFrom:
            secretKeyRef:
              name: celery-secrets
              key: result-backend
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command:
            - celery
            - -A
            - config.celery
            - inspect
            - ping
          initialDelaySeconds: 30
          periodSeconds: 60
        readinessProbe:
          exec:
            command:
            - celery
            - -A
            - config.celery
            - inspect
            - ping
          initialDelaySeconds: 10
          periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: celery-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: celery-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Graceful Shutdown

```python
# graceful_shutdown.py
import signal
import sys
from celery import current_app
from celery.signals import worker_shutting_down

@worker_shutting_down.connect
def worker_shutting_down_handler(sig, how, exitcode, **kwargs):
    """Handle worker shutdown gracefully."""
    print(f"Worker shutting down with signal {sig}")

    # Perform cleanup
    cleanup_resources()

    # Cancel any pending tasks
    current_app.control.cancel_consumer(queue='default')

def cleanup_resources():
    """Clean up resources before shutdown."""
    # Close database connections
    # Flush caches
    # Save state
    pass

# Configure worker to wait for current tasks
# In celery config:
app.conf.update(
    worker_cancel_long_running_tasks_on_connection_loss=True,
    worker_lost_wait=60.0,  # Wait 60 seconds for tasks to complete
)
```

---

## Testing Celery Tasks

### Unit Testing

```python
# tests/test_tasks.py
import pytest
from unittest.mock import patch, MagicMock
from celery.exceptions import Retry

# Test tasks synchronously
@pytest.fixture
def celery_config():
    return {
        'task_always_eager': True,  # Execute tasks synchronously
        'task_eager_propagates': True,  # Propagate exceptions
    }

def test_send_email_success():
    """Test email task succeeds."""
    with patch('tasks.email_tasks.smtplib.SMTP') as mock_smtp:
        from tasks.email_tasks import send_email

        result = send_email('test@example.com', 'Subject', 'Body')

        assert result['status'] == 'sent'
        assert result['to'] == 'test@example.com'
        mock_smtp.assert_called_once()

def test_send_email_retry():
    """Test email task retries on failure."""
    from tasks.email_tasks import send_email
    import smtplib

    with patch('tasks.email_tasks.smtplib.SMTP') as mock_smtp:
        mock_smtp.return_value.__enter__.return_value.send_message.side_effect = \
            smtplib.SMTPException("Connection failed")

        with pytest.raises(Retry):
            send_email('test@example.com', 'Subject', 'Body')

def test_process_order_task():
    """Test order processing task."""
    from tasks.order_tasks import process_order

    with patch('tasks.order_tasks.get_order') as mock_get_order:
        mock_get_order.return_value = {'id': 1, 'total': 100}

        result = process_order(1)

        assert result['order_id'] == 1
        assert result['status'] == 'processed'
```

### Integration Testing

```python
# tests/test_integration.py
import pytest
from celery.contrib.testing.worker import start_worker
from config.celery import app

@pytest.fixture(scope='module')
def celery_worker():
    """Start a Celery worker for integration tests."""
    with start_worker(app, perform_ping_check=False) as worker:
        yield worker

def test_task_chain_integration(celery_worker):
    """Test task chain executes correctly."""
    from celery import chain
    from tasks.data_tasks import fetch_data, transform_data, save_data

    workflow = chain(
        fetch_data.s('https://api.example.com/data'),
        transform_data.s(),
        save_data.s('database')
    )

    result = workflow.apply_async()
    output = result.get(timeout=30)

    assert output['saved'] is True

def test_task_group_integration(celery_worker):
    """Test task group processes in parallel."""
    from celery import group
    from tasks.processing import process_item

    job = group(process_item.s(i) for i in range(10))
    result = job.apply_async()

    all_results = result.get(timeout=30)

    assert len(all_results) == 10
    assert all(r['status'] == 'processed' for r in all_results)
```

### Mocking Celery Tasks

```python
# tests/test_views.py
import pytest
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client

class TestUserRegistration(TestCase):
    @patch('myapp.tasks.send_welcome_email.delay')
    def test_registration_sends_email(self, mock_send_email):
        """Test that registration triggers welcome email task."""
        mock_send_email.return_value = MagicMock(id='task-123')

        response = self.client.post('/register/', {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'securepass123'
        })

        self.assertEqual(response.status_code, 200)
        mock_send_email.assert_called_once()

        # Check task was called with correct arguments
        call_args = mock_send_email.call_args
        self.assertEqual(call_args[0][1], 'test@example.com')

    @patch('myapp.tasks.process_order')
    def test_order_processing(self, mock_process):
        """Test order processing with mocked task."""
        mock_process.apply_async.return_value = MagicMock(
            id='task-456',
            get=MagicMock(return_value={'status': 'completed'})
        )

        response = self.client.post('/orders/', {'items': [1, 2, 3]})

        self.assertEqual(response.status_code, 202)
        mock_process.apply_async.assert_called_once()
```

---

## Common Interview Questions

### Q1: What is Celery and when would you use it?

**Answer**: Celery is a distributed task queue for Python that enables asynchronous task processing. Use it when:

- You need to offload time-consuming operations from the request-response cycle
- You want to schedule periodic tasks
- You need to distribute work across multiple machines
- You want reliable task execution with retries

### Q2: Explain the difference between delay() and apply_async()

**Answer**:
- `delay()` is a shortcut that calls `apply_async()` with positional arguments
- `apply_async()` provides full control with options like countdown, eta, queue, priority, retries

```python
# These are equivalent
task.delay(arg1, arg2)
task.apply_async(args=[arg1, arg2])

# apply_async allows more options
task.apply_async(args=[arg1], countdown=60, queue='high_priority')
```

### Q3: How do you ensure tasks are not lost?

**Answer**:

1. **Broker persistence**: Configure Redis/RabbitMQ for message persistence
2. **Late acknowledgment**: Use `task_acks_late=True`
3. **Result backend**: Store results for tracking
4. **Retry configuration**: Set up automatic retries
5. **Dead letter queues**: Capture failed tasks for analysis

### Q4: How do you handle task failures?

**Answer**:

```python
@app.task(bind=True, max_retries=3, autoretry_for=(ConnectionError,))
def my_task(self, data):
    try:
        return process(data)
    except TransientError as exc:
        raise self.retry(exc=exc, countdown=60)
    except PermanentError:
        log_failure(data)
        raise
```

### Q5: Explain task_acks_late and its importance

**Answer**: `task_acks_late=True` means tasks are acknowledged after they complete, not when received. This is important because:

- If a worker crashes during task execution, the task returns to the queue
- Ensures at-least-once delivery semantics
- Trade-off: Tasks may be executed more than once, so idempotency is important

### Q6: How would you scale Celery workers?

**Answer**:

1. **Horizontal scaling**: Add more workers across machines
2. **Queue separation**: Route different tasks to specialized workers
3. **Concurrency tuning**: Adjust worker concurrency based on task type
4. **Auto-scaling**: Use Kubernetes HPA or cloud auto-scaling
5. **Priority queues**: Ensure critical tasks are processed first

### Q7: What is the difference between prefork, eventlet, and gevent pools?

**Answer**:

- **Prefork (default)**: Process-based, good for CPU-bound tasks
- **Eventlet/Gevent**: Greenlet-based, excellent for I/O-bound tasks with many concurrent operations
- **Solo**: Single-threaded, useful for debugging

```bash
# CPU-bound tasks
celery worker --pool=prefork -c 4

# I/O-bound tasks (API calls, database queries)
celery worker --pool=gevent -c 1000
```

---

## Summary

Celery is an essential tool for building scalable Python applications. Key takeaways:

1. **Architecture**: Understand the producer-broker-worker-backend pattern
2. **Task Design**: Use proper error handling, retries, and idempotency
3. **Workflows**: Master groups, chains, and chords for complex operations
4. **Scheduling**: Use Celery Beat for periodic tasks
5. **Routing**: Design queue strategies for different workload types
6. **Monitoring**: Implement proper logging, metrics, and alerting
7. **Production**: Follow best practices for deployment and scaling
8. **Testing**: Write comprehensive unit and integration tests

By following these patterns and best practices, you can build robust, scalable background task processing systems that handle millions of tasks reliably.

## Additional Resources

- [Celery Official Documentation](https://docs.celeryq.dev/)
- [Celery Best Practices](https://docs.celeryq.dev/en/stable/userguide/tasks.html#best-practices)
- [Flower - Real-time Celery Monitor](https://flower.readthedocs.io/)
- [django-celery-beat](https://django-celery-beat.readthedocs.io/)
- [Celery with FastAPI](https://fastapi.tiangolo.com/tutorial/background-tasks/)
