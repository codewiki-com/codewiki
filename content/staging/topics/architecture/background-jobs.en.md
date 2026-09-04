---
title: Background Job Processing
description: Learn background job queues and scheduling
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - background jobs
  - queues
  - Bull
  - Celery
status: imported
origin: old/src/content/docs/backend/background-jobs.en.md
divergence: 0.264
issues: []
legacy:
  category: Backend
  subcategory: Patterns
  order: 35
  lastUpdated: 2026-01-07
---

## Core Concepts

Background job processing allows applications to offload time-consuming, resource-intensive, or non-critical tasks from the main request-response cycle. Instead of making users wait for operations like sending emails, processing images, or generating reports, these tasks are queued and processed asynchronously by dedicated workers.

### Why Background Jobs Matter

In web applications, users expect fast responses. However, many operations cannot complete within acceptable response times:

1. **Email Notifications**: Connecting to SMTP servers and sending emails can take seconds
2. **File Processing**: Image resizing, video transcoding, or PDF generation are CPU-intensive
3. **Third-Party API Calls**: External services may be slow or rate-limited
4. **Batch Operations**: Processing thousands of records sequentially is time-consuming
5. **Scheduled Tasks**: Daily reports, cleanup jobs, or periodic synchronization

```
Synchronous Request Flow:
User Request -> API Handler -> Send Email -> Process Image -> Response (5+ seconds)
                               (slow)        (slow)

Asynchronous with Background Jobs:
User Request -> API Handler -> Queue Jobs -> Response (50ms)
                                    |
                              Background Workers
                               /           \
                        Send Email    Process Image
                        (async)         (async)
```

### Core Value Propositions

**1. Improved User Experience**
Users receive immediate responses while heavy operations complete in the background.

**2. Better Resource Utilization**
Workers can be scaled independently, processing jobs at optimal pace without blocking web servers.

**3. Fault Tolerance**
Failed jobs can be retried automatically with configurable retry strategies.

**4. Scheduled Execution**
Jobs can be delayed or scheduled to run at specific times.

**5. Priority Management**
Critical jobs can be prioritized over less important ones using multiple queues.

---

## Popular Job Queue Systems

Different ecosystems have their own battle-tested solutions for background job processing. Let's examine the most popular options.

### Bull (Node.js)

Bull is a Redis-backed queue library for Node.js, known for its reliability and feature-rich API.

**Key Characteristics:**
- Built on Redis for persistence and atomic operations
- Supports job priorities, delays, and rate limiting
- Provides job progress tracking and events
- Excellent TypeScript support via BullMQ
- Dashboard available (Bull Board, Arena)

**Ideal Use Cases:**
- Node.js applications requiring reliable job processing
- Real-time applications needing job progress updates
- Systems requiring complex job scheduling patterns

### Celery (Python)

Celery is a distributed task queue for Python, widely used in Django and Flask applications.

**Key Characteristics:**
- Supports multiple message brokers (Redis, RabbitMQ)
- Built-in scheduling with Celery Beat
- Canvas for complex task workflows (chains, groups, chords)
- Result backend for storing task outcomes
- Monitoring via Flower dashboard

**Ideal Use Cases:**
- Python web applications (Django, Flask, FastAPI)
- Data processing pipelines
- Scientific computing and ML workflows

### Sidekiq (Ruby)

Sidekiq is a background processing framework for Ruby, renowned for its performance and simplicity.

**Key Characteristics:**
- Uses Redis for job storage
- Thread-based workers (efficient memory usage)
- Pro/Enterprise versions offer additional features
- Built-in web UI for monitoring
- Excellent ActiveJob integration

**Ideal Use Cases:**
- Ruby on Rails applications
- Applications requiring high throughput
- Systems needing reliable job processing

### Comparison Summary

| Feature | Bull/BullMQ | Celery | Sidekiq |
|---------|-------------|--------|---------|
| Language | Node.js | Python | Ruby |
| Broker | Redis | Redis/RabbitMQ | Redis |
| Scheduling | Built-in | Celery Beat | Enterprise |
| Monitoring | Bull Board/Arena | Flower | Web UI |
| Throughput | High | High | Very High |
| Retry Support | Yes | Yes | Yes |
| Priority Queues | Yes | Yes | Yes |

---

## Bull/BullMQ Deep Dive

### Basic Setup and Configuration

```javascript
// bullmq-setup.js
const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

// Redis connection configuration
const connection = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null, // Required for BullMQ
});

// Create a queue
const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,  // Keep last 100 completed jobs
    removeOnFail: 500,      // Keep last 500 failed jobs
  },
});

// Queue scheduler handles delayed and repeatable jobs
const scheduler = new QueueScheduler('email', { connection });

// Export for use in application
module.exports = { emailQueue, connection };
```

### Creating and Processing Jobs

```javascript
// producer.js - Adding jobs to the queue
const { emailQueue } = require('./bullmq-setup');

async function sendWelcomeEmail(userId, email) {
  const job = await emailQueue.add('welcome-email', {
    userId,
    email,
    template: 'welcome',
    timestamp: Date.now(),
  }, {
    priority: 1,           // Higher priority (lower number = higher priority)
    delay: 5000,           // Delay 5 seconds before processing
    attempts: 5,           // Override default attempts
    jobId: `welcome-${userId}`, // Custom job ID (prevents duplicates)
  });

  console.log(`Created job ${job.id}`);
  return job;
}

// Bulk add jobs
async function sendBulkEmails(users) {
  const jobs = users.map(user => ({
    name: 'newsletter',
    data: { userId: user.id, email: user.email },
    opts: { priority: 5 },
  }));

  await emailQueue.addBulk(jobs);
  console.log(`Added ${jobs.length} newsletter jobs`);
}

module.exports = { sendWelcomeEmail, sendBulkEmails };
```

```javascript
// worker.js - Processing jobs
const { Worker } = require('bullmq');
const { connection } = require('./bullmq-setup');

const worker = new Worker('email', async (job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);

  switch (job.name) {
    case 'welcome-email':
      await sendWelcomeEmail(job.data);
      break;
    case 'newsletter':
      await sendNewsletter(job.data);
      break;
    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }

  return { sent: true, timestamp: Date.now() };
}, {
  connection,
  concurrency: 5,  // Process up to 5 jobs simultaneously
  limiter: {
    max: 100,      // Maximum 100 jobs
    duration: 60000, // Per minute
  },
});

// Event handlers
worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

async function sendWelcomeEmail(data) {
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Sent welcome email to ${data.email}`);
}

async function sendNewsletter(data) {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Sent newsletter to ${data.email}`);
}
```

### Job Progress and Events

```javascript
// progress-tracking.js
const { Queue, Worker } = require('bullmq');
const { connection } = require('./bullmq-setup');

const processingQueue = new Queue('file-processing', { connection });

// Worker with progress updates
const worker = new Worker('file-processing', async (job) => {
  const { files } = job.data;
  const total = files.length;

  for (let i = 0; i < total; i++) {
    await processFile(files[i]);

    // Update job progress
    await job.updateProgress((i + 1) / total * 100);

    // Add log entries
    await job.log(`Processed file ${i + 1}/${total}: ${files[i]}`);
  }

  return { processedCount: total };
}, { connection });

// Monitoring progress from the application
async function monitorJob(jobId) {
  const job = await processingQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  // Get current state
  const state = await job.getState();
  console.log(`Job state: ${state}`);

  // Get progress
  const progress = job.progress;
  console.log(`Progress: ${progress}%`);

  // Get logs
  const logs = await job.log;
  console.log('Logs:', logs);

  // Wait for completion
  const result = await job.waitUntilFinished(
    processingQueue.events,
    20000 // Timeout in ms
  );

  return result;
}

async function processFile(filename) {
  // Simulate file processing
  await new Promise(resolve => setTimeout(resolve, 200));
}
```

### Repeatable Jobs (Scheduling)

```javascript
// scheduled-jobs.js
const { Queue } = require('bullmq');
const { connection } = require('./bullmq-setup');

const scheduledQueue = new Queue('scheduled-tasks', { connection });

async function setupScheduledJobs() {
  // Run every hour
  await scheduledQueue.add('hourly-cleanup',
    { taskType: 'cleanup' },
    {
      repeat: {
        pattern: '0 * * * *', // Cron expression: every hour
      },
      jobId: 'hourly-cleanup', // Prevents duplicate scheduled jobs
    }
  );

  // Run every day at midnight
  await scheduledQueue.add('daily-report',
    { taskType: 'report' },
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at 00:00
        tz: 'America/New_York', // Timezone
      },
    }
  );

  // Run every 5 minutes
  await scheduledQueue.add('health-check',
    { taskType: 'health' },
    {
      repeat: {
        every: 5 * 60 * 1000, // Every 5 minutes (in milliseconds)
      },
    }
  );

  console.log('Scheduled jobs configured');
}

// List all repeatable jobs
async function listRepeatableJobs() {
  const repeatableJobs = await scheduledQueue.getRepeatableJobs();
  console.log('Repeatable jobs:', repeatableJobs);
  return repeatableJobs;
}

// Remove a repeatable job
async function removeRepeatableJob(name, pattern) {
  await scheduledQueue.removeRepeatableByKey(`${name}:::${pattern}`);
  console.log(`Removed repeatable job: ${name}`);
}

module.exports = { setupScheduledJobs, listRepeatableJobs, removeRepeatableJob };
```

---

## Celery Deep Dive

### Basic Setup and Configuration

```python
# celery_config.py
from celery import Celery

# Create Celery application
app = Celery(
    'myapp',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
    include=['tasks']
)

# Configuration
app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Retry settings
    task_acks_late=True,  # Acknowledge after task completion
    task_reject_on_worker_lost=True,

    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time per worker
    worker_concurrency=4,

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour

    # Task routing
    task_routes={
        'tasks.send_email': {'queue': 'email'},
        'tasks.process_image': {'queue': 'media'},
        'tasks.generate_report': {'queue': 'reports'},
    },

    # Rate limiting
    task_annotations={
        'tasks.send_email': {'rate_limit': '100/m'},
    },
)

# Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'cleanup-every-hour': {
        'task': 'tasks.cleanup_old_files',
        'schedule': 3600.0,  # Every hour
    },
    'daily-report': {
        'task': 'tasks.generate_daily_report',
        'schedule': crontab(hour=0, minute=0),  # Every day at midnight
    },
    'check-health-every-5-minutes': {
        'task': 'tasks.health_check',
        'schedule': 300.0,  # Every 5 minutes
    },
}

from celery.schedules import crontab
```

### Defining Tasks

```python
# tasks.py
from celery import shared_task
from celery.exceptions import Retry
from celery_config import app
import time
import logging

logger = logging.getLogger(__name__)

@app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_email(self, user_id, email, template):
    """Send email with automatic retry on failure."""
    try:
        logger.info(f"Sending {template} email to {email}")
        # Simulate email sending
        time.sleep(1)

        if random.random() < 0.1:  # 10% failure rate for demo
            raise ConnectionError("SMTP connection failed")

        logger.info(f"Email sent successfully to {email}")
        return {'status': 'sent', 'email': email}

    except ConnectionError as exc:
        logger.warning(f"Email failed, retrying... ({self.request.retries}/{self.max_retries})")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

    except Exception as exc:
        logger.error(f"Email failed permanently: {exc}")
        raise

@app.task(bind=True)
def process_image(self, image_path, operations):
    """Process image with progress updates."""
    total_ops = len(operations)

    for i, operation in enumerate(operations):
        # Update task state with progress
        self.update_state(
            state='PROCESSING',
            meta={
                'current': i + 1,
                'total': total_ops,
                'operation': operation,
                'progress': (i + 1) / total_ops * 100
            }
        )

        # Simulate processing
        time.sleep(0.5)
        logger.info(f"Applied {operation} to {image_path}")

    return {'status': 'completed', 'path': image_path, 'operations': operations}

@app.task
def generate_report(report_type, date_range):
    """Generate report synchronously."""
    logger.info(f"Generating {report_type} report for {date_range}")
    time.sleep(5)  # Simulate report generation
    return {'report_type': report_type, 'url': f'/reports/{report_type}.pdf'}

@app.task
def cleanup_old_files():
    """Periodic cleanup task."""
    logger.info("Running cleanup task")
    # Cleanup logic here
    return {'deleted_count': 42}

@app.task
def health_check():
    """Periodic health check."""
    # Check database, redis, external services
    return {'status': 'healthy', 'timestamp': time.time()}
```

### Task Chains and Workflows

```python
# workflows.py
from celery import chain, group, chord
from tasks import send_email, process_image, generate_report

# Chain: Tasks execute sequentially, output of one becomes input of next
def process_order_chain(order_id):
    """Sequential workflow for order processing."""
    workflow = chain(
        validate_order.s(order_id),
        process_payment.s(),
        update_inventory.s(),
        send_confirmation_email.s()
    )
    return workflow.apply_async()

# Group: Tasks execute in parallel
def send_bulk_notifications(user_ids, message):
    """Send notifications to multiple users in parallel."""
    notification_group = group(
        send_notification.s(user_id, message)
        for user_id in user_ids
    )
    return notification_group.apply_async()

# Chord: Parallel tasks followed by a callback
def generate_monthly_report(month):
    """Generate reports in parallel, then combine them."""
    # First, gather data from multiple sources in parallel
    # Then, combine into final report
    workflow = chord(
        group(
            fetch_sales_data.s(month),
            fetch_user_data.s(month),
            fetch_inventory_data.s(month)
        ),
        combine_report.s(month)
    )
    return workflow.apply_async()

# Immutable signatures: Arguments cannot be modified by previous task
def immutable_workflow():
    """Workflow where tasks don't modify each other's arguments."""
    workflow = chain(
        task_a.si(arg1='value1'),  # .si() creates immutable signature
        task_b.si(arg2='value2'),
        task_c.si(arg3='value3')
    )
    return workflow.apply_async()
```

### Calling Tasks

```python
# calling_tasks.py
from tasks import send_email, process_image
from celery.result import AsyncResult

# Basic async call
result = send_email.delay('user123', 'user@example.com', 'welcome')
print(f"Task ID: {result.id}")

# Call with options
result = send_email.apply_async(
    args=['user123', 'user@example.com', 'welcome'],
    countdown=60,        # Delay 60 seconds
    expires=3600,        # Task expires after 1 hour
    priority=0,          # Highest priority (0-9, lower is higher)
    queue='high-priority',
)

# Scheduled execution
from datetime import datetime, timedelta

eta = datetime.utcnow() + timedelta(hours=1)
result = send_email.apply_async(
    args=['user123', 'user@example.com', 'reminder'],
    eta=eta  # Execute at specific time
)

# Check task status
def check_task_status(task_id):
    result = AsyncResult(task_id)

    if result.ready():
        if result.successful():
            return {'status': 'completed', 'result': result.result}
        else:
            return {'status': 'failed', 'error': str(result.result)}
    else:
        return {'status': result.state, 'info': result.info}

# Wait for result (with timeout)
def wait_for_result(task_id, timeout=30):
    result = AsyncResult(task_id)
    try:
        return result.get(timeout=timeout)
    except TimeoutError:
        return {'error': 'Task timed out'}
    except Exception as e:
        return {'error': str(e)}
```

---

## Sidekiq Deep Dive

### Basic Setup and Configuration

```ruby
# config/initializers/sidekiq.rb
require 'sidekiq'

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }

  # Custom error handling
  config.error_handlers << proc { |ex, ctx_hash|
    Bugsnag.notify(ex, ctx_hash)
  }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end

# sidekiq.yml
:concurrency: 10
:queues:
  - [critical, 3]    # Weight 3 (highest priority)
  - [default, 2]     # Weight 2
  - [low, 1]         # Weight 1 (lowest priority)
:limits:
  email: 100         # Rate limit: 100 jobs/second
```

### Defining Workers

```ruby
# app/workers/email_worker.rb
class EmailWorker
  include Sidekiq::Worker

  sidekiq_options queue: :default,
                  retry: 5,
                  backtrace: true,
                  dead: true  # Move to dead queue after max retries

  def perform(user_id, email, template)
    user = User.find(user_id)
    UserMailer.send(template, user).deliver_now

    logger.info "Email sent to #{email}"
  rescue ActiveRecord::RecordNotFound => e
    # Don't retry for missing records
    logger.error "User #{user_id} not found"
    raise Sidekiq::JobKill
  rescue Net::SMTPError => e
    # Retry with exponential backoff
    logger.warn "SMTP error, retrying: #{e.message}"
    raise
  end
end

# app/workers/image_processor_worker.rb
class ImageProcessorWorker
  include Sidekiq::Worker

  sidekiq_options queue: :low, retry: 3

  # Custom retry logic
  sidekiq_retry_in do |count, exception|
    case exception
    when Net::TimeoutError
      10 * (count + 1)  # Linear backoff for timeouts
    else
      (count ** 4) + 15  # Exponential backoff for others
    end
  end

  def perform(image_id, operations)
    image = Image.find(image_id)

    operations.each do |operation|
      image.apply(operation)
      logger.info "Applied #{operation} to image #{image_id}"
    end

    image.save!
  end
end

# app/workers/batch_worker.rb
class BatchWorker
  include Sidekiq::Worker

  sidekiq_options queue: :critical

  def perform(batch_id)
    batch = Batch.find(batch_id)

    batch.items.find_each do |item|
      # Process each item
      ProcessItemWorker.perform_async(item.id)
    end

    batch.update!(status: 'queued')
  end
end
```

### Scheduling with Sidekiq-Cron

```ruby
# Gemfile
gem 'sidekiq-cron'

# config/initializers/sidekiq_cron.rb
require 'sidekiq-cron'

schedule = {
  'cleanup_job' => {
    'class' => 'CleanupWorker',
    'cron' => '0 * * * *',  # Every hour
    'queue' => 'low'
  },
  'daily_report' => {
    'class' => 'DailyReportWorker',
    'cron' => '0 0 * * *',  # Every day at midnight
    'queue' => 'default',
    'args' => [{ 'report_type' => 'daily' }]
  },
  'health_check' => {
    'class' => 'HealthCheckWorker',
    'cron' => '*/5 * * * *',  # Every 5 minutes
    'queue' => 'critical'
  }
}

Sidekiq::Cron::Job.load_from_hash(schedule)
```

### Calling Workers

```ruby
# Async execution
EmailWorker.perform_async(user.id, user.email, 'welcome')

# Delayed execution
EmailWorker.perform_in(1.hour, user.id, user.email, 'reminder')

# Scheduled execution
EmailWorker.perform_at(Time.now + 1.day, user.id, user.email, 'followup')

# Bulk enqueue
users.each do |user|
  EmailWorker.perform_async(user.id, user.email, 'newsletter')
end

# Or more efficiently using push_bulk
Sidekiq::Client.push_bulk(
  'class' => EmailWorker,
  'args' => users.map { |u| [u.id, u.email, 'newsletter'] }
)
```

---

## Retry Strategies

Proper retry handling is crucial for building resilient job processing systems.

### Exponential Backoff

```javascript
// Bull/BullMQ exponential backoff
const queue = new Queue('tasks', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,  // Initial delay: 1 second
      // Delays: 1s, 2s, 4s, 8s, 16s
    },
  },
});

// Custom backoff strategy
const customBackoff = {
  type: 'custom',
};

const worker = new Worker('tasks', processJob, {
  connection,
  settings: {
    backoffStrategy: (attemptsMade) => {
      // Custom logic: longer delays for specific attempt counts
      if (attemptsMade < 3) {
        return 1000 * Math.pow(2, attemptsMade); // Exponential
      }
      return 60000; // Fixed 1 minute for later attempts
    },
  },
});
```

```python
# Celery custom retry
@app.task(bind=True, max_retries=5)
def resilient_task(self, data):
    try:
        process(data)
    except TransientError as exc:
        # Exponential backoff: 1, 2, 4, 8, 16 minutes
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)
    except PermanentError as exc:
        # Don't retry permanent errors
        logger.error(f"Permanent failure: {exc}")
        raise
```

### Retry with Circuit Breaker

```javascript
// circuit-breaker.js
const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
};

const breaker = new CircuitBreaker(externalServiceCall, options);

async function processWithCircuitBreaker(job) {
  try {
    return await breaker.fire(job.data);
  } catch (error) {
    if (breaker.opened) {
      // Circuit is open, delay retry significantly
      throw new Error('CIRCUIT_OPEN');
    }
    throw error;
  }
}

// Worker with circuit breaker handling
const worker = new Worker('external-calls', async (job) => {
  try {
    return await processWithCircuitBreaker(job);
  } catch (error) {
    if (error.message === 'CIRCUIT_OPEN') {
      // Move to delayed queue instead of immediate retry
      await job.moveToDelayed(Date.now() + 60000);
      return;
    }
    throw error;
  }
}, { connection });
```

---

## Dead Letter Queues

Dead Letter Queues (DLQ) capture jobs that have exhausted all retry attempts, enabling investigation and potential reprocessing.

### BullMQ Dead Letter Queue Implementation

```javascript
// dead-letter-queue.js
const { Queue, Worker, QueueEvents } = require('bullmq');
const { connection } = require('./bullmq-setup');

// Main queue
const mainQueue = new Queue('main-tasks', { connection });

// Dead letter queue
const dlq = new Queue('dead-letter', { connection });

// Worker that moves failed jobs to DLQ
const worker = new Worker('main-tasks', async (job) => {
  // Process job
  await processJob(job.data);
}, {
  connection,
  settings: {
    // After max attempts, job goes to 'failed' state
  },
});

// Listen for failed jobs and move to DLQ
const queueEvents = new QueueEvents('main-tasks', { connection });

queueEvents.on('failed', async ({ jobId, failedReason, prev }) => {
  const job = await mainQueue.getJob(jobId);

  if (job && job.attemptsMade >= job.opts.attempts) {
    // Job exhausted all retries, move to DLQ
    await dlq.add('failed-job', {
      originalJob: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
      },
      failedReason,
      failedAt: Date.now(),
      attemptsMade: job.attemptsMade,
    });

    console.log(`Job ${jobId} moved to dead letter queue`);
  }
});

// DLQ processor for investigation/alerting
const dlqWorker = new Worker('dead-letter', async (job) => {
  const { originalJob, failedReason } = job.data;

  // Log for investigation
  console.error('Dead letter job:', {
    originalJobId: originalJob.id,
    jobName: originalJob.name,
    failedReason,
  });

  // Send alert
  await sendAlert({
    type: 'dead_letter_job',
    jobId: originalJob.id,
    reason: failedReason,
  });

  // Optionally store in database for later analysis
  await saveToDatabase(job.data);
}, { connection });

// Reprocess DLQ jobs
async function reprocessDeadLetterJobs() {
  const jobs = await dlq.getJobs(['completed', 'failed', 'waiting'], 0, 100);

  for (const job of jobs) {
    const { originalJob } = job.data;

    // Re-add to main queue
    await mainQueue.add(originalJob.name, originalJob.data, {
      ...originalJob.opts,
      attempts: 3, // Reset attempts
    });

    // Remove from DLQ
    await job.remove();
  }

  console.log(`Reprocessed ${jobs.length} dead letter jobs`);
}
```

### Celery Dead Letter Queue

```python
# celery_dlq.py
from celery import Task
from celery.exceptions import Reject

class TaskWithDLQ(Task):
    """Base task class that handles dead letter queue."""

    max_retries = 3

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called when task fails after all retries."""
        # Store failed task info
        failed_task = {
            'task_id': task_id,
            'task_name': self.name,
            'args': args,
            'kwargs': kwargs,
            'exception': str(exc),
            'traceback': str(einfo),
            'failed_at': datetime.utcnow().isoformat(),
        }

        # Store in Redis or database
        redis_client.lpush('dead_letter_queue', json.dumps(failed_task))

        # Send alert
        send_slack_alert(f"Task {self.name} failed: {exc}")

@app.task(base=TaskWithDLQ, bind=True, max_retries=3)
def critical_task(self, data):
    try:
        process(data)
    except Exception as exc:
        raise self.retry(exc=exc)

# Reprocess dead letter queue
def reprocess_dlq():
    while True:
        task_json = redis_client.rpop('dead_letter_queue')
        if not task_json:
            break

        task_info = json.loads(task_json)

        # Re-queue the task
        app.send_task(
            task_info['task_name'],
            args=task_info['args'],
            kwargs=task_info['kwargs']
        )

        logger.info(f"Reprocessed task {task_info['task_id']}")
```

---

## Monitoring and Observability

### Metrics to Track

```javascript
// monitoring.js
const { Queue, QueueEvents } = require('bullmq');
const promClient = require('prom-client');

// Prometheus metrics
const jobsProcessed = new promClient.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of processed jobs',
  labelNames: ['queue', 'status'],
});

const jobDuration = new promClient.Histogram({
  name: 'job_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue', 'jobName'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

const queueSize = new promClient.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue', 'state'],
});

async function setupMonitoring(queueName) {
  const queue = new Queue(queueName, { connection });
  const events = new QueueEvents(queueName, { connection });

  // Track completed jobs
  events.on('completed', ({ jobId, returnvalue }) => {
    jobsProcessed.inc({ queue: queueName, status: 'completed' });
  });

  // Track failed jobs
  events.on('failed', ({ jobId, failedReason }) => {
    jobsProcessed.inc({ queue: queueName, status: 'failed' });
  });

  // Periodically update queue size metrics
  setInterval(async () => {
    const counts = await queue.getJobCounts();

    queueSize.set({ queue: queueName, state: 'waiting' }, counts.waiting);
    queueSize.set({ queue: queueName, state: 'active' }, counts.active);
    queueSize.set({ queue: queueName, state: 'completed' }, counts.completed);
    queueSize.set({ queue: queueName, state: 'failed' }, counts.failed);
    queueSize.set({ queue: queueName, state: 'delayed' }, counts.delayed);
  }, 5000);

  return queue;
}

// Job duration tracking in worker
const worker = new Worker('tasks', async (job) => {
  const startTime = Date.now();

  try {
    const result = await processJob(job);
    return result;
  } finally {
    const duration = (Date.now() - startTime) / 1000;
    jobDuration.observe(
      { queue: 'tasks', jobName: job.name },
      duration
    );
  }
}, { connection });
```

### Celery Monitoring with Flower

```python
# celery_signals.py
from celery.signals import task_prerun, task_postrun, task_failure
import time
from prometheus_client import Counter, Histogram

# Metrics
tasks_total = Counter('celery_tasks_total', 'Total Celery tasks', ['task_name', 'status'])
task_duration = Histogram('celery_task_duration_seconds', 'Task duration', ['task_name'])

task_start_times = {}

@task_prerun.connect
def task_prerun_handler(task_id, task, *args, **kwargs):
    task_start_times[task_id] = time.time()

@task_postrun.connect
def task_postrun_handler(task_id, task, *args, **kwargs):
    start_time = task_start_times.pop(task_id, None)
    if start_time:
        duration = time.time() - start_time
        task_duration.labels(task_name=task.name).observe(duration)
        tasks_total.labels(task_name=task.name, status='success').inc()

@task_failure.connect
def task_failure_handler(task_id, exception, *args, **kwargs):
    tasks_total.labels(task_name=kwargs.get('sender').name, status='failure').inc()
```

### Key Metrics Dashboard

Essential metrics to monitor:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Queue Depth | Number of pending jobs | > 10,000 |
| Processing Rate | Jobs processed per minute | < expected rate |
| Failure Rate | Percentage of failed jobs | > 5% |
| Average Duration | Mean job processing time | > SLA threshold |
| DLQ Size | Dead letter queue size | > 0 |
| Worker Count | Active workers | < minimum |
| Memory Usage | Worker memory consumption | > 80% |

---

## Best Practices

### Design Idempotent Jobs

Jobs may be executed multiple times due to retries or worker failures. Design them to be idempotent.

```javascript
// idempotent-job.js
async function processPayment(job) {
  const { paymentId, amount } = job.data;

  // Check if already processed
  const existing = await db.payments.findUnique({
    where: { idempotencyKey: paymentId }
  });

  if (existing) {
    console.log(`Payment ${paymentId} already processed`);
    return existing;
  }

  // Process payment
  const result = await paymentGateway.charge(amount);

  // Store with idempotency key
  await db.payments.create({
    data: {
      idempotencyKey: paymentId,
      amount,
      status: result.status,
    }
  });

  return result;
}
```

### Keep Jobs Small and Focused

```javascript
// Bad: One large job doing too much
async function processOrderBad(job) {
  await validateOrder(job.data);
  await processPayment(job.data);
  await updateInventory(job.data);
  await sendConfirmation(job.data);
  await notifyWarehouse(job.data);
}

// Good: Separate jobs, orchestrated by a workflow
async function processOrderGood(job) {
  const { orderId } = job.data;

  // Validate only
  await validateOrder(orderId);

  // Queue subsequent jobs
  await paymentQueue.add('process-payment', { orderId });
}
```

### Use Appropriate Timeouts

```javascript
// Worker with timeout
const worker = new Worker('long-tasks', async (job) => {
  // Set job-level timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Job timeout')), 30000);
  });

  const resultPromise = processJob(job);

  return Promise.race([resultPromise, timeoutPromise]);
}, {
  connection,
  lockDuration: 60000,  // How long to lock the job
  stalledInterval: 30000, // Check for stalled jobs
});
```

### Implement Graceful Shutdown

```javascript
// graceful-shutdown.js
const { Worker } = require('bullmq');

const worker = new Worker('tasks', processJob, { connection });

async function gracefulShutdown() {
  console.log('Shutting down gracefully...');

  // Stop accepting new jobs
  await worker.pause();

  // Wait for current jobs to complete (with timeout)
  const timeout = setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);

  await worker.close();
  clearTimeout(timeout);

  console.log('Worker shut down successfully');
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### Use Priority Queues Appropriately

```javascript
// priority-queues.js
const highPriorityQueue = new Queue('tasks', {
  connection,
  defaultJobOptions: { priority: 1 },
});

const normalPriorityQueue = new Queue('tasks', {
  connection,
  defaultJobOptions: { priority: 5 },
});

const lowPriorityQueue = new Queue('tasks', {
  connection,
  defaultJobOptions: { priority: 10 },
});

// Or use separate queues for better isolation
const criticalQueue = new Queue('critical', { connection });
const defaultQueue = new Queue('default', { connection });
const bulkQueue = new Queue('bulk', { connection });
```

### Log Comprehensively

```javascript
// logging.js
const worker = new Worker('tasks', async (job) => {
  const logger = createJobLogger(job);

  logger.info('Starting job', {
    jobId: job.id,
    jobName: job.name,
    attemptsMade: job.attemptsMade,
  });

  try {
    const result = await processJob(job);

    logger.info('Job completed', {
      jobId: job.id,
      duration: Date.now() - job.timestamp,
      result: summarize(result),
    });

    return result;
  } catch (error) {
    logger.error('Job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
      attemptsMade: job.attemptsMade,
    });
    throw error;
  }
}, { connection });
```

---

## Interview Key Points

### When should you use background jobs vs synchronous processing?

**Key Points:**
- Use background jobs for time-consuming operations (> 100ms)
- Use for operations that can fail and need retries
- Use when the result is not immediately needed by the user
- Use for scheduled/periodic tasks
- Keep synchronous: quick operations, operations requiring immediate response

### How do you ensure job processing reliability?

**Key Points:**
- Acknowledge after successful processing (at-least-once delivery)
- Implement idempotent job handlers
- Use persistent storage (Redis, database)
- Configure appropriate retry strategies
- Implement dead letter queues for failed jobs
- Monitor queue health and job metrics

### How do you handle job failures?

**Key Points:**
- Implement exponential backoff for transient failures
- Distinguish between retriable and non-retriable errors
- Use circuit breakers for external service calls
- Move permanently failed jobs to dead letter queue
- Alert on high failure rates
- Provide mechanisms to reprocess failed jobs

### How do you scale job processing?

**Key Points:**
- Add more workers (horizontal scaling)
- Use priority queues to handle critical jobs first
- Partition work across multiple queues
- Use concurrency settings to process multiple jobs per worker
- Implement rate limiting to prevent overwhelming downstream services
- Consider auto-scaling based on queue depth

### What are the trade-offs between different job queue systems?

**Key Points:**
- Bull/BullMQ: Best for Node.js, Redis-only, excellent features
- Celery: Best for Python, multiple broker support, complex workflows
- Sidekiq: Best for Ruby, highest throughput, excellent monitoring
- Consider: ecosystem fit, operational complexity, feature requirements

---

## Further Reading

### Documentation
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Celery Documentation](https://docs.celeryq.dev/)
- [Sidekiq Wiki](https://github.com/sidekiq/sidekiq/wiki)

### Related Topics
- Message Queue patterns (RabbitMQ, Kafka)
- Event-driven architecture
- Distributed systems reliability patterns
- Observability and monitoring
- Container orchestration for workers (Kubernetes)

---

## Summary

Background job processing is essential for building responsive, scalable applications. By offloading time-consuming operations to dedicated workers, applications can provide better user experiences while maintaining reliability through retry mechanisms and dead letter queues.

**Key Takeaways:**

1. Choose the right job queue for your language and requirements
2. Design jobs to be idempotent and focused on single responsibilities
3. Implement proper retry strategies with exponential backoff
4. Use dead letter queues to capture and investigate failed jobs
5. Monitor queue health with appropriate metrics and alerts
6. Implement graceful shutdown to prevent job loss
7. Scale workers based on queue depth and processing requirements

With background job processing, you can build resilient, scalable backend systems that handle complex workloads efficiently.
