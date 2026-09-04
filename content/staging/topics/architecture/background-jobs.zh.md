---
title: 后台任务处理
description: 学习后台任务队列和调度
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - 后台任务
  - 队列
  - Bull
  - Celery
status: imported
origin: old/src/content/docs/backend/background-jobs.zh.md
divergence: 0.264
issues: []
legacy:
  category: Backend
  subcategory: Patterns
  order: 35
  lastUpdated: 2026-01-07
---

## 概念解释

后台任务（Background Jobs）是指在主请求-响应周期之外异步执行的工作单元。它们是构建高性能、可扩展应用程序的关键技术，允许将耗时操作从用户请求中分离出来，提升用户体验和系统吞吐量。

### 为什么需要后台任务

在 Web 应用中，很多操作不适合在 HTTP 请求中同步完成：

1. **耗时操作**：发送邮件、生成报表、视频转码等需要数秒甚至数分钟
2. **外部依赖**：调用第三方 API 可能不稳定或响应慢
3. **批量处理**：处理大量数据时需要分批执行
4. **定时任务**：每天凌晨清理数据、发送日报等周期性任务
5. **资源限制**：避免单个请求占用过多服务器资源

```
同步处理模式：
用户请求 → 处理业务 → 发送邮件 → 生成PDF → 更新缓存 → 响应用户
           (快速)      (3秒)      (5秒)     (1秒)
                      用户等待 9+ 秒

异步后台任务模式：
用户请求 → 处理业务 → 响应用户（快速响应）
              ↓
         任务队列
          ↙  ↓  ↘
      发送邮件  生成PDF  更新缓存（后台并行处理）
```

### 后台任务的核心组件

**1. 任务队列（Job Queue）**
存储待处理任务的数据结构，支持 FIFO、优先级队列等模式。

**2. 生产者（Producer）**
创建并投递任务到队列的组件，通常是 Web 应用。

**3. 消费者/Worker**
从队列获取任务并执行的进程，可以水平扩展。

**4. 调度器（Scheduler）**
管理定时任务和延迟任务的组件。

**5. 结果存储（Result Backend）**
保存任务执行结果，供后续查询。

---

## 任务队列框架对比

### Bull（Node.js）

Bull 是基于 Redis 的高性能任务队列，专为 Node.js 设计，支持优先级、延迟、重复任务等特性。

**核心特点：**
- 基于 Redis，高性能低延迟
- 支持任务优先级和延迟执行
- 提供任务进度跟踪
- 内置重试和死信队列机制
- 支持速率限制和并发控制

**适用场景：**
- Node.js/TypeScript 项目
- 需要实时任务处理
- 中小规模任务队列需求

### Celery（Python）

Celery 是 Python 生态中最流行的分布式任务队列，支持多种消息代理。

**核心特点：**
- 支持多种 Broker（RabbitMQ、Redis、Amazon SQS）
- 强大的任务编排能力（链式、分组、和弦）
- 内置定时任务调度器 Celery Beat
- 支持任务结果存储
- 丰富的监控工具（Flower）

**适用场景：**
- Python/Django/Flask 项目
- 复杂的任务工作流
- 需要强大的调度能力

### Sidekiq（Ruby）

Sidekiq 是 Ruby 生态中最受欢迎的后台任务处理器，以其高效和简洁著称。

**核心特点：**
- 多线程架构，内存效率高
- 与 Rails 无缝集成
- 提供 Web 监控界面
- 支持定时任务（Sidekiq-Cron）
- 企业版提供批量任务和速率限制

**适用场景：**
- Ruby on Rails 项目
- 需要高吞吐量处理
- 追求简洁的 API

### 对比总结

| 特性 | Bull | Celery | Sidekiq |
|------|------|--------|---------|
| 语言 | Node.js | Python | Ruby |
| Broker | Redis | Redis/RabbitMQ/SQS | Redis |
| 架构 | 单线程事件驱动 | 多进程 | 多线程 |
| 内存效率 | 高 | 中 | 高 |
| 学习曲线 | 低 | 中 | 低 |
| 定时任务 | 内置 | Celery Beat | 插件 |
| 监控UI | Bull Board | Flower | 内置 |
| 企业支持 | 社区 | 社区 | 商业版 |

---

## Bull 详解

### 基本使用

```javascript
const Queue = require('bull');

// 创建队列
const emailQueue = new Queue('email', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: 'your-password'
  }
});

// 添加任务
async function sendWelcomeEmail(userId, email) {
  const job = await emailQueue.add('welcome', {
    userId,
    email,
    subject: '欢迎加入我们的平台',
    template: 'welcome'
  }, {
    attempts: 3,           // 最多重试3次
    backoff: {
      type: 'exponential', // 指数退避
      delay: 2000          // 初始延迟2秒
    },
    removeOnComplete: 100, // 保留最近100个完成的任务
    removeOnFail: 50       // 保留最近50个失败的任务
  });

  console.log(`Email job created: ${job.id}`);
  return job;
}

// 处理任务
emailQueue.process('welcome', async (job) => {
  const { userId, email, subject, template } = job.data;

  // 更新进度
  job.progress(10);

  // 获取用户信息
  const user = await getUserById(userId);
  job.progress(30);

  // 渲染邮件模板
  const html = await renderTemplate(template, { user });
  job.progress(60);

  // 发送邮件
  await sendEmail({
    to: email,
    subject,
    html
  });
  job.progress(100);

  return { sent: true, email };
});
```

### 任务优先级

```javascript
const priorityQueue = new Queue('priority-tasks');

// 添加不同优先级的任务
// 数字越小优先级越高
await priorityQueue.add('critical', { data: 'urgent' }, { priority: 1 });
await priorityQueue.add('normal', { data: 'regular' }, { priority: 5 });
await priorityQueue.add('low', { data: 'background' }, { priority: 10 });

// 处理器会先处理优先级高的任务
priorityQueue.process(async (job) => {
  console.log(`Processing ${job.name} with priority ${job.opts.priority}`);
  // 处理逻辑
});
```

### 延迟任务

```javascript
const reminderQueue = new Queue('reminders');

// 延迟执行 - 1小时后发送提醒
await reminderQueue.add('send-reminder', {
  userId: 123,
  message: '您的订单即将过期'
}, {
  delay: 60 * 60 * 1000  // 1小时
});

// 定时执行 - 在特定时间执行
const scheduledTime = new Date('2024-01-20 09:00:00');
await reminderQueue.add('scheduled-notification', {
  type: 'daily-report'
}, {
  delay: scheduledTime.getTime() - Date.now()
});
```

### 重复任务（Cron）

```javascript
const reportQueue = new Queue('reports');

// 每天凌晨2点生成日报
await reportQueue.add('daily-report', {
  type: 'daily',
  format: 'pdf'
}, {
  repeat: {
    cron: '0 2 * * *',  // 每天凌晨2点
    tz: 'Asia/Shanghai'
  }
});

// 每小时执行一次
await reportQueue.add('hourly-check', {
  type: 'health-check'
}, {
  repeat: {
    every: 60 * 60 * 1000  // 每小时
  }
});

// 每周一上午9点
await reportQueue.add('weekly-summary', {
  type: 'weekly'
}, {
  repeat: {
    cron: '0 9 * * 1',
    tz: 'Asia/Shanghai'
  }
});

// 获取所有重复任务
const repeatableJobs = await reportQueue.getRepeatableJobs();
console.log(repeatableJobs);

// 删除重复任务
await reportQueue.removeRepeatableByKey(repeatableJobs[0].key);
```

### 任务事件监听

```javascript
const taskQueue = new Queue('tasks');

// 任务完成
taskQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

// 任务失败
taskQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error.message);

  // 发送告警
  if (job.attemptsMade >= job.opts.attempts) {
    alertService.send({
      level: 'critical',
      message: `Job ${job.name} failed after ${job.attemptsMade} attempts`,
      error: error.message,
      jobId: job.id
    });
  }
});

// 任务进度更新
taskQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// 任务开始处理
taskQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

// 任务暂停
taskQueue.on('paused', () => {
  console.log('Queue paused');
});

// 任务恢复
taskQueue.on('resumed', () => {
  console.log('Queue resumed');
});
```

### 并发控制

```javascript
const imageQueue = new Queue('image-processing');

// 限制并发数为5
imageQueue.process(5, async (job) => {
  const { imageUrl, filters } = job.data;

  // 处理图片
  const result = await processImage(imageUrl, filters);

  return result;
});

// 速率限制
const rateLimitedQueue = new Queue('api-calls', {
  limiter: {
    max: 100,        // 最多100个任务
    duration: 60000  // 每分钟
  }
});
```

### Bull Board 监控

```javascript
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const serverAdapter = new ExpressAdapter();

createBullBoard({
  queues: [
    new BullAdapter(emailQueue),
    new BullAdapter(reportQueue),
    new BullAdapter(imageQueue)
  ],
  serverAdapter
});

serverAdapter.setBasePath('/admin/queues');

const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

app.listen(3000, () => {
  console.log('Bull Board available at http://localhost:3000/admin/queues');
});
```

---

## Celery 详解

### 基本配置

```python
# celery_config.py
from celery import Celery

app = Celery(
    'myproject',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
    include=['tasks']
)

# 配置选项
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Shanghai',
    enable_utc=True,

    # 任务执行配置
    task_acks_late=True,  # 任务完成后再确认
    task_reject_on_worker_lost=True,  # Worker 丢失时拒绝任务
    worker_prefetch_multiplier=4,  # 预取任务数

    # 结果过期时间
    result_expires=3600,  # 1小时

    # 任务路由
    task_routes={
        'tasks.email.*': {'queue': 'email'},
        'tasks.report.*': {'queue': 'report'},
        'tasks.default.*': {'queue': 'default'}
    }
)
```

### 定义任务

```python
# tasks.py
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
import logging

logger = logging.getLogger(__name__)

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True
)
def send_email(self, user_id, email_type):
    """发送邮件任务"""
    try:
        user = get_user(user_id)
        template = get_email_template(email_type)

        # 更新任务状态
        self.update_state(state='SENDING', meta={'progress': 50})

        result = email_service.send(
            to=user.email,
            template=template,
            context={'user': user}
        )

        return {'status': 'sent', 'message_id': result.id}

    except ConnectionError as exc:
        logger.warning(f"Email connection failed, retrying... {exc}")
        raise self.retry(exc=exc)

    except Exception as exc:
        logger.error(f"Email failed permanently: {exc}")
        raise

@shared_task(bind=True)
def generate_report(self, report_type, date_range, format='pdf'):
    """生成报表任务"""
    try:
        # 获取数据
        self.update_state(state='FETCHING', meta={'progress': 20})
        data = fetch_report_data(report_type, date_range)

        # 处理数据
        self.update_state(state='PROCESSING', meta={'progress': 50})
        processed_data = process_data(data)

        # 生成报表
        self.update_state(state='GENERATING', meta={'progress': 80})
        report_url = generate_file(processed_data, format)

        return {
            'status': 'completed',
            'url': report_url,
            'format': format
        }

    except Exception as exc:
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc)}
        )
        raise
```

### 调用任务

```python
# 异步调用
result = send_email.delay(user_id=123, email_type='welcome')

# 带选项调用
result = send_email.apply_async(
    args=[123, 'welcome'],
    countdown=60,  # 60秒后执行
    expires=3600,  # 1小时后过期
    queue='email',
    priority=5
)

# 获取任务结果
if result.ready():
    print(result.get())

# 检查任务状态
print(result.state)  # PENDING, STARTED, SUCCESS, FAILURE

# 获取任务进度
if result.state == 'SENDING':
    print(f"Progress: {result.info.get('progress')}%")

# 撤销任务
result.revoke(terminate=True)
```

### 任务编排

```python
from celery import chain, group, chord

# 链式任务 - 顺序执行
workflow = chain(
    fetch_data.s(user_id=123),
    process_data.s(),
    save_result.s()
)
result = workflow.apply_async()

# 分组任务 - 并行执行
job_group = group([
    send_email.s(user_id=1),
    send_email.s(user_id=2),
    send_email.s(user_id=3)
])
result = job_group.apply_async()

# 和弦任务 - 并行执行后汇总
workflow = chord(
    [
        fetch_user_data.s(1),
        fetch_user_data.s(2),
        fetch_user_data.s(3)
    ],
    aggregate_results.s()
)
result = workflow.apply_async()

# 复杂工作流
from celery import signature

workflow = chain(
    validate_input.s(data),
    group([
        process_images.s(),
        process_videos.s(),
        process_documents.s()
    ]),
    merge_results.s(),
    notify_completion.s()
)
```

### Celery Beat 定时任务

```python
# celery_config.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    # 每天凌晨2点清理过期数据
    'cleanup-expired-data': {
        'task': 'tasks.cleanup_expired_data',
        'schedule': crontab(hour=2, minute=0),
        'args': (),
        'options': {'queue': 'maintenance'}
    },

    # 每小时同步数据
    'sync-data-hourly': {
        'task': 'tasks.sync_external_data',
        'schedule': crontab(minute=0),  # 每小时整点
        'kwargs': {'source': 'api'},
    },

    # 每周一上午9点发送周报
    'weekly-report': {
        'task': 'tasks.generate_weekly_report',
        'schedule': crontab(hour=9, minute=0, day_of_week=1),
        'args': ('summary',),
    },

    # 每30秒执行健康检查
    'health-check': {
        'task': 'tasks.health_check',
        'schedule': 30.0,  # 秒
    },

    # 每月1号生成月报
    'monthly-report': {
        'task': 'tasks.generate_monthly_report',
        'schedule': crontab(hour=8, minute=0, day_of_month=1),
    }
}
```

### 启动 Worker 和 Beat

```bash
# 启动 Worker
celery -A myproject worker -l info -Q default,email,report -c 4

# 启动 Beat 调度器
celery -A myproject beat -l info

# 同时启动 Worker 和 Beat（开发环境）
celery -A myproject worker -B -l info

# 指定并发模式
celery -A myproject worker -P gevent -c 100  # 协程模式
celery -A myproject worker -P prefork -c 4   # 多进程模式（默认）

# 使用 Flower 监控
celery -A myproject flower --port=5555
```

---

## Sidekiq 详解

### 基本配置

```ruby
# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  config.redis = { url: ENV['REDIS_URL'], network_timeout: 5 }

  config.on(:startup) do
    # 启动时执行
  end

  config.on(:shutdown) do
    # 关闭时执行
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV['REDIS_URL'], network_timeout: 5 }
end

# config/sidekiq.yml
:concurrency: 10
:timeout: 25
:queues:
  - [critical, 3]
  - [default, 2]
  - [low, 1]

:schedule:
  cleanup_job:
    cron: '0 2 * * *'
    class: CleanupWorker
    queue: low
```

### 定义 Worker

```ruby
# app/workers/email_worker.rb
class EmailWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'default',
                  retry: 5,
                  backtrace: true,
                  dead: true

  sidekiq_retry_in do |count, exception|
    # 指数退避: 10, 30, 90, 270, 810 秒
    10 * (3 ** count)
  end

  sidekiq_retries_exhausted do |msg, exception|
    # 重试耗尽后的处理
    Sidekiq.logger.warn "Failed #{msg['class']} with #{msg['args']}: #{msg['error_message']}"

    # 发送告警
    AlertService.notify(
      message: "Job failed permanently",
      job_class: msg['class'],
      args: msg['args'],
      error: msg['error_message']
    )
  end

  def perform(user_id, email_type)
    user = User.find(user_id)

    case email_type
    when 'welcome'
      UserMailer.welcome(user).deliver_now
    when 'reset_password'
      UserMailer.reset_password(user).deliver_now
    else
      raise ArgumentError, "Unknown email type: #{email_type}"
    end
  end
end

# 调用
EmailWorker.perform_async(123, 'welcome')

# 延迟执行
EmailWorker.perform_in(1.hour, 123, 'reminder')

# 定时执行
EmailWorker.perform_at(Time.now + 1.day, 123, 'daily_digest')
```

### 批量任务（Sidekiq Pro）

```ruby
# Sidekiq Pro 特性
class BatchWorker
  include Sidekiq::Worker

  def perform(user_id)
    # 处理单个用户
  end
end

# 创建批量任务
batch = Sidekiq::Batch.new
batch.description = "Send emails to all users"
batch.on(:success, BatchCallback, user_count: 1000)
batch.on(:complete, BatchCallback)

batch.jobs do
  User.find_each do |user|
    BatchWorker.perform_async(user.id)
  end
end

# 回调处理
class BatchCallback
  def on_success(status, options)
    puts "Batch completed successfully!"
    puts "Processed #{options['user_count']} users"
  end

  def on_complete(status, options)
    if status.failures > 0
      puts "Batch completed with #{status.failures} failures"
    end
  end
end
```

### 速率限制（Sidekiq Enterprise）

```ruby
class RateLimitedWorker
  include Sidekiq::Worker

  sidekiq_options queue: 'api_calls'

  LIMITER = Sidekiq::Limiter.concurrent(
    :external_api,
    10,  # 最多10个并发
    wait_timeout: 5
  )

  def perform(resource_id)
    LIMITER.within_limit do
      # 调用外部 API
      ExternalAPI.fetch(resource_id)
    end
  end
end

# 窗口限制
WINDOW_LIMITER = Sidekiq::Limiter.window(
  :api_calls,
  100,  # 最多100次
  :minute
)
```

---

## 重试策略

### 指数退避

指数退避是处理临时故障的标准策略，每次重试间隔呈指数增长。

```javascript
// Bull 指数退避
const queue = new Queue('tasks');

await queue.add('api-call', { url: 'https://api.example.com' }, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000  // 1s, 2s, 4s, 8s, 16s
  }
});

// 自定义退避策略
await queue.add('custom-retry', data, {
  attempts: 5,
  backoff: {
    type: 'custom'
  }
});

// 在处理器中定义自定义退避
queue.process(async (job) => {
  // 处理逻辑
});

queue.on('failed', async (job, error) => {
  if (job.attemptsMade < job.opts.attempts) {
    // 自定义延迟计算
    const delay = Math.min(
      1000 * Math.pow(2, job.attemptsMade) + Math.random() * 1000,
      60000  // 最大1分钟
    );

    await job.retry();
  }
});
```

```python
# Celery 指数退避
@shared_task(
    bind=True,
    max_retries=5,
    retry_backoff=True,  # 启用指数退避
    retry_backoff_max=600,  # 最大10分钟
    retry_jitter=True  # 添加随机抖动
)
def api_call(self, url):
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise self.retry(exc=exc)
```

### 固定间隔重试

```javascript
// Bull 固定间隔
await queue.add('fixed-retry', data, {
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000  // 固定5秒间隔
  }
});
```

```python
# Celery 固定间隔
@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def fixed_retry_task(self):
    try:
        # 任务逻辑
        pass
    except Exception as exc:
        raise self.retry(exc=exc)
```

### 自定义重试逻辑

```javascript
// 根据错误类型决定重试策略
queue.process(async (job) => {
  try {
    await processJob(job.data);
  } catch (error) {
    if (error.code === 'RATE_LIMITED') {
      // 速率限制，等待更长时间
      throw new Error('RATE_LIMITED');
    } else if (error.code === 'PERMANENT_FAILURE') {
      // 永久性失败，不重试
      throw new UnrecoverableError('Permanent failure');
    } else {
      // 临时错误，正常重试
      throw error;
    }
  }
});
```

---

## 死信队列

死信队列（Dead Letter Queue，DLQ）用于存储无法成功处理的任务，便于后续分析和手动处理。

### Bull 死信队列

```javascript
const Queue = require('bull');

const mainQueue = new Queue('main-tasks');
const deadLetterQueue = new Queue('dead-letter');

mainQueue.on('failed', async (job, error) => {
  // 检查是否已耗尽重试次数
  if (job.attemptsMade >= job.opts.attempts) {
    // 移入死信队列
    await deadLetterQueue.add('failed-job', {
      originalJob: {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts
      },
      error: {
        message: error.message,
        stack: error.stack
      },
      failedAt: new Date().toISOString(),
      attempts: job.attemptsMade
    });

    console.log(`Job ${job.id} moved to dead letter queue`);
  }
});

// 处理死信队列
deadLetterQueue.process(async (job) => {
  const { originalJob, error, failedAt } = job.data;

  // 记录到数据库
  await db.failedJobs.create({
    jobId: originalJob.id,
    jobName: originalJob.name,
    jobData: originalJob.data,
    errorMessage: error.message,
    errorStack: error.stack,
    failedAt,
    status: 'pending_review'
  });

  // 发送告警
  await alertService.send({
    level: 'warning',
    title: 'Job Failed Permanently',
    message: `Job ${originalJob.name} failed after ${job.data.attempts} attempts`,
    metadata: { jobId: originalJob.id }
  });
});

// 重试死信队列中的任务
async function retryDeadLetter(deadLetterJobId) {
  const dlJob = await deadLetterQueue.getJob(deadLetterJobId);
  const { originalJob } = dlJob.data;

  // 重新添加到主队列
  await mainQueue.add(originalJob.name, originalJob.data, {
    ...originalJob.opts,
    attempts: 3  // 重置重试次数
  });

  // 标记死信任务已处理
  await dlJob.remove();
}
```

### Celery 死信队列

```python
from celery import signals
from celery.exceptions import Reject

# 配置死信队列
app.conf.task_queues = [
    Queue('default'),
    Queue('dead_letter')
]

@signals.task_failure.connect
def handle_task_failure(sender, task_id, exception, args, kwargs, traceback, einfo, **kw):
    """任务失败时的处理"""
    # 检查是否已耗尽重试
    task = sender
    if hasattr(task, 'request') and task.request.retries >= task.max_retries:
        # 发送到死信队列
        move_to_dead_letter.delay(
            task_name=task.name,
            task_id=task_id,
            args=args,
            kwargs=kwargs,
            exception=str(exception),
            traceback=str(einfo)
        )

@shared_task(queue='dead_letter')
def move_to_dead_letter(task_name, task_id, args, kwargs, exception, traceback):
    """记录失败任务到死信存储"""
    FailedTask.objects.create(
        task_name=task_name,
        task_id=task_id,
        args=json.dumps(args),
        kwargs=json.dumps(kwargs),
        exception=exception,
        traceback=traceback,
        failed_at=timezone.now(),
        status='pending'
    )

    # 发送告警
    send_alert(
        title=f"Task {task_name} failed",
        message=f"Task ID: {task_id}\nError: {exception}"
    )

# 重试死信任务
def retry_dead_letter(failed_task_id):
    failed_task = FailedTask.objects.get(id=failed_task_id)

    # 获取原始任务
    task = app.tasks[failed_task.task_name]

    # 重新执行
    args = json.loads(failed_task.args)
    kwargs = json.loads(failed_task.kwargs)

    result = task.apply_async(args=args, kwargs=kwargs)

    # 更新状态
    failed_task.status = 'retried'
    failed_task.retry_task_id = result.id
    failed_task.save()

    return result.id
```

---

## 定时任务调度

### Cron 表达式

Cron 表达式用于定义周期性任务的执行时间：

```
┌─────────── 分钟 (0 - 59)
│ ┌───────── 小时 (0 - 23)
│ │ ┌─────── 日期 (1 - 31)
│ │ │ ┌───── 月份 (1 - 12)
│ │ │ │ ┌─── 星期 (0 - 6，0=周日)
│ │ │ │ │
* * * * *
```

常用示例：
- `0 * * * *` - 每小时整点
- `*/15 * * * *` - 每15分钟
- `0 9 * * 1-5` - 工作日上午9点
- `0 2 * * *` - 每天凌晨2点
- `0 0 1 * *` - 每月1号零点
- `0 0 * * 0` - 每周日零点

### Node.js 定时调度

```javascript
// 使用 Bull 的 repeat 功能
const scheduledQueue = new Queue('scheduled-tasks');

// 添加定时任务
await scheduledQueue.add('daily-cleanup', {}, {
  repeat: {
    cron: '0 2 * * *',
    tz: 'Asia/Shanghai'
  },
  jobId: 'daily-cleanup-job'  // 防止重复添加
});

await scheduledQueue.add('hourly-sync', {}, {
  repeat: {
    every: 3600000  // 每小时
  }
});

// 使用 node-cron 库
const cron = require('node-cron');

// 每天凌晨3点执行
cron.schedule('0 3 * * *', async () => {
  console.log('Running daily cleanup...');
  await cleanupExpiredData();
}, {
  timezone: 'Asia/Shanghai'
});

// 每5分钟执行
cron.schedule('*/5 * * * *', async () => {
  console.log('Running health check...');
  await performHealthCheck();
});

// 使用 Agenda 调度器
const Agenda = require('agenda');

const agenda = new Agenda({
  db: { address: 'mongodb://localhost/agenda' }
});

agenda.define('send-daily-report', async (job) => {
  const { userId } = job.attrs.data;
  await generateAndSendReport(userId);
});

// 定时执行
agenda.every('0 9 * * *', 'send-daily-report', { userId: 123 });

// 延迟执行
agenda.schedule('in 2 hours', 'send-reminder', { message: 'Hello' });

await agenda.start();
```

### 分布式定时任务

在分布式环境中，需要确保定时任务只执行一次：

```javascript
const Redlock = require('redlock');
const Redis = require('ioredis');

const redis = new Redis();
const redlock = new Redlock([redis], {
  retryCount: 0  // 不重试，未获取锁则放弃
});

async function runScheduledTask(taskName, taskFn) {
  const lockKey = `scheduler:${taskName}:lock`;

  try {
    // 尝试获取分布式锁
    const lock = await redlock.acquire([lockKey], 60000);

    console.log(`Acquired lock for ${taskName}, executing...`);

    try {
      await taskFn();
    } finally {
      // 释放锁
      await lock.release();
    }
  } catch (error) {
    if (error.name === 'LockError') {
      console.log(`${taskName} is already running on another instance`);
    } else {
      throw error;
    }
  }
}

// 使用示例
cron.schedule('0 * * * *', async () => {
  await runScheduledTask('hourly-sync', async () => {
    await syncExternalData();
  });
});
```

---

## 监控与告警

### 任务监控指标

```javascript
// metrics.js - Prometheus 指标收集
const promClient = require('prom-client');

// 任务计数器
const jobCounter = new promClient.Counter({
  name: 'job_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['queue', 'status']
});

// 任务处理时长
const jobDuration = new promClient.Histogram({
  name: 'job_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['queue', 'job_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

// 队列深度
const queueDepth = new promClient.Gauge({
  name: 'job_queue_depth',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue']
});

// 活跃 Worker 数
const activeWorkers = new promClient.Gauge({
  name: 'job_workers_active',
  help: 'Number of active workers',
  labelNames: ['queue']
});

// 在队列事件中收集指标
function setupMetrics(queue) {
  const queueName = queue.name;

  queue.on('completed', (job) => {
    jobCounter.labels(queueName, 'completed').inc();

    const duration = (Date.now() - job.timestamp) / 1000;
    jobDuration.labels(queueName, job.name).observe(duration);
  });

  queue.on('failed', (job) => {
    jobCounter.labels(queueName, 'failed').inc();
  });

  queue.on('active', () => {
    activeWorkers.labels(queueName).inc();
  });

  queue.on('completed', () => {
    activeWorkers.labels(queueName).dec();
  });

  queue.on('failed', () => {
    activeWorkers.labels(queueName).dec();
  });

  // 定期更新队列深度
  setInterval(async () => {
    const waiting = await queue.getWaitingCount();
    const delayed = await queue.getDelayedCount();
    queueDepth.labels(queueName).set(waiting + delayed);
  }, 10000);
}
```

### 健康检查

```javascript
// healthcheck.js
class QueueHealthCheck {
  constructor(queues) {
    this.queues = queues;
  }

  async check() {
    const results = {};

    for (const queue of this.queues) {
      const queueName = queue.name;

      try {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount()
        ]);

        // 检查是否有任务积压
        const isHealthy = waiting < 1000;

        results[queueName] = {
          status: isHealthy ? 'healthy' : 'degraded',
          metrics: {
            waiting,
            active,
            completed,
            failed,
            delayed
          }
        };
      } catch (error) {
        results[queueName] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }

    return results;
  }
}

// 暴露健康检查端点
app.get('/health/queues', async (req, res) => {
  const healthCheck = new QueueHealthCheck([emailQueue, reportQueue]);
  const results = await healthCheck.check();

  const allHealthy = Object.values(results).every(r => r.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json(results);
});
```

### 告警配置

```javascript
// alerts.js
class AlertManager {
  constructor(config) {
    this.slackWebhook = config.slackWebhook;
    this.emailService = config.emailService;
    this.thresholds = config.thresholds || {
      queueDepth: 1000,
      failureRate: 0.1,
      processingTime: 60
    };
  }

  async checkAndAlert(queue) {
    const queueName = queue.name;
    const waiting = await queue.getWaitingCount();
    const failed = await queue.getFailedCount();
    const completed = await queue.getCompletedCount();

    // 队列积压告警
    if (waiting > this.thresholds.queueDepth) {
      await this.sendAlert({
        level: 'warning',
        title: `Queue ${queueName} Backlog Alert`,
        message: `Queue has ${waiting} waiting jobs (threshold: ${this.thresholds.queueDepth})`,
        queue: queueName,
        metrics: { waiting }
      });
    }

    // 失败率告警
    const total = completed + failed;
    if (total > 100) {
      const failureRate = failed / total;
      if (failureRate > this.thresholds.failureRate) {
        await this.sendAlert({
          level: 'critical',
          title: `Queue ${queueName} High Failure Rate`,
          message: `Failure rate is ${(failureRate * 100).toFixed(2)}% (threshold: ${this.thresholds.failureRate * 100}%)`,
          queue: queueName,
          metrics: { failureRate, failed, completed }
        });
      }
    }
  }

  async sendAlert(alert) {
    console.log(`Alert [${alert.level}]: ${alert.title}`);

    // 发送 Slack 通知
    if (this.slackWebhook) {
      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `*${alert.level.toUpperCase()}*: ${alert.title}`,
          attachments: [{
            color: alert.level === 'critical' ? 'danger' : 'warning',
            text: alert.message,
            fields: Object.entries(alert.metrics || {}).map(([key, value]) => ({
              title: key,
              value: String(value),
              short: true
            }))
          }]
        })
      });
    }

    // 关键告警发送邮件
    if (alert.level === 'critical' && this.emailService) {
      await this.emailService.send({
        to: 'ops@company.com',
        subject: `[CRITICAL] ${alert.title}`,
        body: alert.message
      });
    }
  }
}
```

---

## 最佳实践

### 任务设计原则

```javascript
// 好的实践：任务幂等性
async function processPayment(paymentId) {
  // 检查是否已处理
  const existing = await db.payments.findOne({ paymentId, status: 'completed' });
  if (existing) {
    console.log(`Payment ${paymentId} already processed`);
    return existing;
  }

  // 使用事务确保原子性
  return await db.transaction(async (tx) => {
    const payment = await tx.payments.findOne({ paymentId });

    if (payment.status === 'completed') {
      return payment;
    }

    // 处理支付
    await processWithPaymentGateway(payment);

    // 更新状态
    return await tx.payments.update(
      { paymentId },
      { status: 'completed', processedAt: new Date() }
    );
  });
}

// 好的实践：任务数据序列化
// 只传递 ID，不传递整个对象
emailQueue.add('send-welcome', { userId: 123 });  // 好

// 避免传递大对象
emailQueue.add('send-welcome', { user: largeUserObject });  // 不好

// 好的实践：设置合理的超时
queue.process(async (job) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    await processWithTimeout(job.data, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
});
```

### 错误处理策略

```javascript
// 区分可重试和不可重试错误
class RetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RetryableError';
  }
}

class PermanentError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PermanentError';
  }
}

queue.process(async (job) => {
  try {
    await processJob(job.data);
  } catch (error) {
    if (error.code === 'RATE_LIMITED') {
      // 临时错误，可重试
      throw new RetryableError('Rate limited');
    } else if (error.code === 'INVALID_DATA') {
      // 数据问题，不可重试
      throw new PermanentError('Invalid data');
    } else {
      throw error;
    }
  }
});

queue.on('failed', async (job, error) => {
  if (error.name === 'PermanentError') {
    // 永久性错误，直接移入死信队列
    await moveToDeadLetter(job, error);
  }
});
```

### 资源管理

```javascript
// 连接池管理
const pool = new Pool({ max: 10 });

queue.process(5, async (job) => {
  const client = await pool.acquire();

  try {
    await processWithClient(client, job.data);
  } finally {
    pool.release(client);
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');

  // 停止接收新任务
  await queue.pause();

  // 等待当前任务完成
  await queue.whenCurrentJobsFinished();

  // 关闭连接
  await queue.close();
  await pool.drain();

  process.exit(0);
});
```

### 任务分片处理

```javascript
// 大批量任务分片
async function processBatchUsers() {
  const batchSize = 100;
  let offset = 0;

  while (true) {
    const users = await db.users.find({
      status: 'active'
    }).skip(offset).limit(batchSize);

    if (users.length === 0) break;

    // 为每批用户创建任务
    await Promise.all(users.map(user =>
      emailQueue.add('process-user', { userId: user.id })
    ));

    offset += batchSize;

    // 控制任务创建速率
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 或使用 Bull 的批量添加
const jobs = users.map(user => ({
  name: 'process-user',
  data: { userId: user.id }
}));

await queue.addBulk(jobs);
```

### 日志和追踪

```javascript
// 结构化日志
const logger = require('pino')();

queue.process(async (job) => {
  const startTime = Date.now();
  const logContext = {
    jobId: job.id,
    jobName: job.name,
    attempt: job.attemptsMade + 1
  };

  logger.info(logContext, 'Job started');

  try {
    const result = await processJob(job.data);

    logger.info({
      ...logContext,
      duration: Date.now() - startTime,
      result
    }, 'Job completed');

    return result;
  } catch (error) {
    logger.error({
      ...logContext,
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    }, 'Job failed');

    throw error;
  }
});

// 分布式追踪集成
const { trace } = require('@opentelemetry/api');

queue.process(async (job) => {
  const tracer = trace.getTracer('job-processor');

  return await tracer.startActiveSpan(`job:${job.name}`, async (span) => {
    span.setAttribute('job.id', job.id);
    span.setAttribute('job.attempt', job.attemptsMade + 1);

    try {
      const result = await processJob(job.data);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
});
```

---

## 面试要点

### 后台任务和消息队列有什么区别？

**答案要点：**
- 后台任务侧重于**工作单元的执行**，关注任务的调度、重试、进度跟踪
- 消息队列侧重于**消息的传递**，关注消息的路由、持久化、消费
- 后台任务框架（Bull、Celery）通常基于消息队列实现
- 消息队列更通用，后台任务更专注于任务处理场景

### 如何保证任务不丢失？

**答案要点：**
- 任务持久化：使用 Redis 持久化或数据库存储
- 确认机制：任务完成后再从队列移除
- 失败重试：配置合理的重试策略
- 死信队列：保存无法处理的任务
- 监控告警：及时发现异常情况

### 如何处理任务堆积？

**答案要点：**
- 水平扩展 Worker 数量
- 增加并发处理能力
- 优化任务处理逻辑
- 任务分优先级处理
- 临时降级非核心任务
- 建立预警机制

### 如何实现任务的幂等性？

**答案要点：**
- 使用唯一任务 ID
- 处理前检查任务状态
- 数据库唯一约束
- 乐观锁/版本控制
- Redis 去重标记

### 定时任务如何避免重复执行？

**答案要点：**
- 分布式锁（Redlock）
- 单点调度 + 分布式执行
- Leader 选举机制
- 数据库行锁
- 任务执行记录检查

### Bull 和 Celery 如何选择？

**答案要点：**
- Node.js 项目优先选择 Bull
- Python 项目优先选择 Celery
- Bull 更轻量，适合中小规模
- Celery 功能更全面，适合复杂场景
- 考虑团队技术栈和运维能力

---

## 总结

后台任务处理是构建可扩展应用的关键技术。合理使用任务队列可以显著提升用户体验、系统吞吐量和可靠性。

**核心要点回顾：**

1. 后台任务将耗时操作从主流程中分离，提升响应速度
2. 选择合适的任务队列框架：Bull（Node.js）、Celery（Python）、Sidekiq（Ruby）
3. 重试策略使用指数退避，避免雪崩效应
4. 死信队列保存失败任务，便于排查和重试
5. 定时任务需要考虑分布式环境下的锁机制
6. 监控和告警是生产环境的必备能力
7. 任务设计要保证幂等性，正确处理重复执行

掌握这些知识，你就能设计和实现高效可靠的后台任务处理系统。
