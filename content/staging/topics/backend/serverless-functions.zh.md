---
title: Serverless 函数计算
description: 使用AWS Lambda/云函数构建无服务器应用
track: backend
section: deployment
difficulty: intermediate
tags:
  - Serverless
  - Lambda
  - 云函数
  - FaaS
status: imported
origin: old/src/content/docs/backend/serverless-functions.zh.md
divergence: 0.166
issues: []
legacy:
  category: Backend
  subcategory: Serverless
  order: 30
  lastUpdated: 2026-01-07
---

## 概念解释

Serverless（无服务器）是一种云计算执行模型，云服务提供商动态管理服务器资源的分配。开发者只需专注于编写业务代码，无需关心底层基础设施的运维、扩展和容量规划。函数即服务（FaaS，Function as a Service）是 Serverless 架构的核心实现形式。

### 什么是 Serverless？

Serverless 并不意味着没有服务器，而是开发者无需管理服务器。云平台负责处理所有基础设施相关的工作，包括：

- **自动扩缩容**：根据请求量自动增减计算资源
- **按需付费**：只为实际执行时间付费，空闲时无成本
- **高可用性**：云平台自动处理故障转移和灾备
- **零运维**：无需管理操作系统、安全补丁、网络配置

### Serverless 与传统架构对比

| 特性 | 传统服务器 | Serverless |
|------|-----------|------------|
| 服务器管理 | 需要手动维护 | 完全托管 |
| 扩展方式 | 手动或自动扩展，需预配置 | 自动、即时、无限扩展 |
| 计费模式 | 按时间计费（24/7） | 按执行次数和时长计费 |
| 冷启动 | 无 | 存在（首次调用延迟） |
| 执行时长 | 无限制 | 有限制（通常15分钟） |
| 状态管理 | 可以保持状态 | 无状态设计 |

## 主流 Serverless 平台

### AWS Lambda

AWS Lambda 是最早也是最成熟的 Serverless 平台，支持多种编程语言和丰富的触发器类型。

```javascript
// AWS Lambda 函数示例 (Node.js)
exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    // 处理业务逻辑
    const name = event.queryStringParameters?.name || 'World';

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
            requestId: context.awsRequestId
        })
    };
};
```

```python
# AWS Lambda 函数示例 (Python)
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Lambda 函数入口点

    Args:
        event: 触发事件数据
        context: Lambda 运行时上下文

    Returns:
        API Gateway 响应格式
    """
    logger.info(f"收到事件: {json.dumps(event)}")

    # 解析请求参数
    query_params = event.get('queryStringParameters') or {}
    name = query_params.get('name', 'World')

    # 构建响应
    response_body = {
        'message': f'Hello, {name}!',
        'timestamp': datetime.utcnow().isoformat(),
        'function_name': context.function_name,
        'memory_limit': context.memory_limit_in_mb,
        'remaining_time_ms': context.get_remaining_time_in_millis()
    }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response_body, ensure_ascii=False)
    }
```

### 阿里云函数计算 (FC)

阿里云函数计算是国内领先的 Serverless 平台，与阿里云生态深度集成。

```python
# 阿里云函数计算示例
import json
import logging

def handler(event, context):
    """
    阿里云 FC 函数入口

    Args:
        event: 事件对象（bytes 类型）
        context: 函数计算上下文
    """
    logger = logging.getLogger()

    # 解析事件数据
    try:
        evt = json.loads(event)
    except:
        evt = {}

    # 获取上下文信息
    credentials = context.credentials
    function_name = context.function.name
    service_name = context.service.name

    logger.info(f"函数 {service_name}/{function_name} 被调用")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': '阿里云函数计算响应成功',
            'service': service_name,
            'function': function_name
        })
    }
```

### 腾讯云云函数 (SCF)

```javascript
// 腾讯云 SCF 示例
'use strict';

exports.main_handler = async (event, context) => {
    console.log('Event:', event);
    console.log('Context:', context);

    // 获取请求信息
    const httpMethod = event.httpMethod || 'GET';
    const path = event.path || '/';
    const queryString = event.queryString || {};

    // 业务处理
    const result = {
        code: 0,
        message: 'success',
        data: {
            method: httpMethod,
            path: path,
            query: queryString,
            requestId: context.request_id,
            memoryLimit: context.memory_limit_in_mb
        }
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
    };
};
```

### Azure Functions

```csharp
// Azure Functions 示例 (C#)
using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

public static class HttpTriggerFunction
{
    [FunctionName("HelloWorld")]
    public static async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", "post", Route = null)]
        HttpRequest req,
        ILogger log)
    {
        log.LogInformation("C# HTTP trigger function processed a request.");

        string name = req.Query["name"];

        string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
        dynamic data = JsonConvert.DeserializeObject(requestBody);
        name = name ?? data?.name ?? "World";

        return new OkObjectResult(new {
            Message = $"Hello, {name}!",
            Timestamp = DateTime.UtcNow
        });
    }
}
```

## 冷启动问题与优化

### 什么是冷启动？

冷启动（Cold Start）是指当函数首次被调用或长时间未被调用后，云平台需要初始化执行环境的过程。这个过程包括：

1. **分配计算资源**：创建容器或微虚拟机
2. **加载运行时**：启动语言运行时环境
3. **下载代码**：从存储中拉取函数代码
4. **初始化依赖**：加载依赖库和建立连接

```
冷启动流程：
┌─────────────────────────────────────────────────────────────┐
│  请求到达  →  创建容器  →  加载运行时  →  初始化代码  →  执行函数  │
│     ↓           ↓           ↓            ↓           ↓      │
│   0ms       100-500ms    50-200ms     10-500ms    业务耗时   │
└─────────────────────────────────────────────────────────────┘
              └────────────── 冷启动延迟 ──────────────┘
```

### 冷启动优化策略

#### 策略一：预置并发（Provisioned Concurrency）

AWS Lambda 提供预置并发功能，预先初始化指定数量的执行环境：

```yaml
# serverless.yml 配置预置并发
functions:
  api:
    handler: handler.main
    provisionedConcurrency: 5  # 预置5个执行环境
    events:
      - http:
          path: /api
          method: any
```

```python
# 使用 AWS SDK 配置预置并发
import boto3

lambda_client = boto3.client('lambda')

# 设置预置并发
response = lambda_client.put_provisioned_concurrency_config(
    FunctionName='my-function',
    Qualifier='prod',  # 别名或版本
    ProvisionedConcurrentExecutions=10
)

print(f"预置并发配置完成: {response}")
```

#### 策略二：保持函数温热（Keep Warm）

通过定时触发保持函数处于活跃状态：

```javascript
// 保持函数温热的处理逻辑
exports.handler = async (event, context) => {
    // 检测是否为预热请求
    if (event.source === 'serverless-plugin-warmup' ||
        event.warmup === true) {
        console.log('Warmup request - keeping function warm');
        return { statusCode: 200, body: 'Warmed up' };
    }

    // 正常业务逻辑
    return await handleBusinessLogic(event);
};
```

```yaml
# serverless.yml 配置预热插件
plugins:
  - serverless-plugin-warmup

custom:
  warmup:
    default:
      enabled: true
      events:
        - schedule: rate(5 minutes)  # 每5分钟预热一次
      concurrency: 3  # 同时预热3个实例
      prewarm: true  # 部署后立即预热
```

#### 策略三：优化代码初始化

```python
# 不推荐：在 handler 内部初始化
def lambda_handler(event, context):
    import boto3  # 每次调用都导入
    import pandas as pd  # 大型库导入耗时

    client = boto3.client('dynamodb')  # 每次都创建连接
    # 业务逻辑

# 推荐：在 handler 外部初始化（利用执行环境复用）
import boto3
import pandas as pd

# 全局初始化，只在冷启动时执行
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('my-table')

def lambda_handler(event, context):
    # 直接使用预初始化的资源
    response = table.get_item(Key={'id': event['id']})
    return response
```

#### 策略四：减小部署包体积

```bash
# 使用 Lambda Layers 分离依赖
# 创建依赖层
mkdir -p python/lib/python3.9/site-packages
pip install -r requirements.txt -t python/lib/python3.9/site-packages
zip -r layer.zip python

# 上传层
aws lambda publish-layer-version \
    --layer-name my-dependencies \
    --zip-file fileb://layer.zip \
    --compatible-runtimes python3.9
```

### 各运行时冷启动时间对比

| 运行时 | 平均冷启动时间 | 优化建议 |
|--------|--------------|---------|
| Python | 200-500ms | 使用轻量级依赖 |
| Node.js | 100-300ms | 避免大型 npm 包 |
| Go | 50-150ms | 编译为静态二进制 |
| Java | 500-2000ms | 使用 GraalVM 或 Quarkus |
| .NET | 300-800ms | 使用 .NET 6+ |
| Rust | 50-100ms | 推荐用于延迟敏感场景 |

## 事件触发器

### HTTP API 触发器

```javascript
// API Gateway 集成
exports.handler = async (event) => {
    const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

    console.log(`${httpMethod} ${path}`);

    // 路由处理
    switch (true) {
        case httpMethod === 'GET' && path === '/users':
            return await listUsers(queryStringParameters);

        case httpMethod === 'GET' && path.startsWith('/users/'):
            return await getUser(pathParameters.id);

        case httpMethod === 'POST' && path === '/users':
            return await createUser(JSON.parse(body));

        case httpMethod === 'PUT' && path.startsWith('/users/'):
            return await updateUser(pathParameters.id, JSON.parse(body));

        case httpMethod === 'DELETE' && path.startsWith('/users/'):
            return await deleteUser(pathParameters.id);

        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Not Found' })
            };
    }
};

// 响应辅助函数
const response = (statusCode, data) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(data)
});
```

### 定时触发器（Cron）

```python
# 定时任务函数
import json
import boto3
from datetime import datetime

def scheduled_task(event, context):
    """
    定时执行的任务函数

    Cron 表达式格式: cron(分 时 日 月 周 年)
    示例: cron(0 12 * * ? *) = 每天 UTC 12:00
    """
    print(f"定时任务执行时间: {datetime.utcnow().isoformat()}")

    # 执行业务逻辑
    # 例如：数据清理、报告生成、健康检查等

    # 发送通知
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:region:account:topic',
        Subject='定时任务完成',
        Message=json.dumps({
            'task': 'scheduled_cleanup',
            'status': 'completed',
            'timestamp': datetime.utcnow().isoformat()
        })
    )

    return {'statusCode': 200, 'body': 'Task completed'}
```

```yaml
# serverless.yml 定时触发器配置
functions:
  scheduledTask:
    handler: tasks.scheduled_task
    events:
      # 每天 UTC 时间 2:00 执行
      - schedule: cron(0 2 * * ? *)

      # 每5分钟执行一次
      - schedule: rate(5 minutes)

      # 带输入参数的定时任务
      - schedule:
          rate: rate(1 hour)
          input:
            taskType: hourly_cleanup
            region: us-east-1
```

### 消息队列触发器

```python
# SQS 触发器
import json

def sqs_handler(event, context):
    """处理 SQS 消息队列事件"""

    processed = 0
    failed = 0

    for record in event['Records']:
        try:
            # 解析消息
            message_body = json.loads(record['body'])
            message_id = record['messageId']
            receipt_handle = record['receiptHandle']

            print(f"处理消息 {message_id}: {message_body}")

            # 处理业务逻辑
            process_message(message_body)

            processed += 1

        except Exception as e:
            print(f"处理消息失败: {e}")
            failed += 1
            # 抛出异常会导致消息重新入队
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': processed,
            'failed': failed
        })
    }

def process_message(message):
    """实际的消息处理逻辑"""
    # 根据消息类型执行不同操作
    action = message.get('action')

    if action == 'send_email':
        send_email(message['to'], message['subject'], message['content'])
    elif action == 'process_image':
        process_image(message['image_url'])
    else:
        raise ValueError(f"未知的操作类型: {action}")
```

### 对象存储触发器

```python
# S3 事件触发器
import boto3
import urllib.parse

s3_client = boto3.client('s3')

def s3_handler(event, context):
    """处理 S3 对象事件"""

    for record in event['Records']:
        # 获取事件信息
        event_name = record['eventName']
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        size = record['s3']['object'].get('size', 0)

        print(f"事件: {event_name}, 桶: {bucket}, 对象: {key}, 大小: {size}")

        # 根据事件类型处理
        if event_name.startswith('ObjectCreated:'):
            handle_object_created(bucket, key)
        elif event_name.startswith('ObjectRemoved:'):
            handle_object_removed(bucket, key)

    return {'statusCode': 200}

def handle_object_created(bucket, key):
    """处理对象创建事件"""

    # 例如：处理上传的图片
    if key.endswith(('.jpg', '.jpeg', '.png')):
        # 生成缩略图
        generate_thumbnail(bucket, key)

    # 例如：处理 CSV 文件
    elif key.endswith('.csv'):
        # 导入数据库
        import_csv_to_database(bucket, key)

def generate_thumbnail(bucket, key):
    """生成缩略图"""
    from PIL import Image
    import io

    # 下载原图
    response = s3_client.get_object(Bucket=bucket, Key=key)
    image_content = response['Body'].read()

    # 处理图片
    image = Image.open(io.BytesIO(image_content))
    image.thumbnail((200, 200))

    # 保存缩略图
    buffer = io.BytesIO()
    image.save(buffer, 'JPEG')
    buffer.seek(0)

    # 上传缩略图
    thumbnail_key = f"thumbnails/{key}"
    s3_client.put_object(
        Bucket=bucket,
        Key=thumbnail_key,
        Body=buffer,
        ContentType='image/jpeg'
    )

    print(f"缩略图已生成: {thumbnail_key}")
```

### 数据库流触发器

```javascript
// DynamoDB Streams 触发器
exports.handler = async (event) => {
    console.log(`收到 ${event.Records.length} 条记录`);

    for (const record of event.Records) {
        const eventName = record.eventName;  // INSERT, MODIFY, REMOVE
        const dynamodb = record.dynamodb;

        // 获取新旧数据镜像
        const newImage = dynamodb.NewImage
            ? unmarshall(dynamodb.NewImage)
            : null;
        const oldImage = dynamodb.OldImage
            ? unmarshall(dynamodb.OldImage)
            : null;

        console.log(`事件类型: ${eventName}`);
        console.log('新数据:', JSON.stringify(newImage));
        console.log('旧数据:', JSON.stringify(oldImage));

        // 根据事件类型处理
        switch (eventName) {
            case 'INSERT':
                await handleInsert(newImage);
                break;
            case 'MODIFY':
                await handleModify(oldImage, newImage);
                break;
            case 'REMOVE':
                await handleRemove(oldImage);
                break;
        }
    }

    return { statusCode: 200 };
};

// 解析 DynamoDB 格式
function unmarshall(data) {
    const AWS = require('aws-sdk');
    return AWS.DynamoDB.Converter.unmarshall(data);
}

async function handleInsert(item) {
    // 新记录处理逻辑
    // 例如：发送欢迎邮件、更新统计等
    console.log('处理新记录:', item.id);
}

async function handleModify(oldItem, newItem) {
    // 记录修改处理逻辑
    // 例如：检测变更、触发通知等
    const changes = detectChanges(oldItem, newItem);
    console.log('检测到变更:', changes);
}

async function handleRemove(item) {
    // 记录删除处理逻辑
    // 例如：清理关联数据、归档等
    console.log('记录已删除:', item.id);
}
```

## Lambda Layers（函数层）

### Layer 的作用

Lambda Layer 允许你将库、自定义运行时或其他依赖项打包为单独的组件，可以被多个函数共享：

```
Layer 架构：
┌─────────────────────────────────────────┐
│              Lambda 函数                 │
│  ┌─────────────────────────────────────┐ │
│  │           函数代码                   │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │        Layer 1: 公共库               │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │        Layer 2: 工具函数             │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │        Layer 3: 配置文件             │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 创建和使用 Layer

```bash
# 创建 Python Layer
mkdir -p python/lib/python3.9/site-packages

# 安装依赖到指定目录
pip install requests boto3 pandas numpy \
    -t python/lib/python3.9/site-packages

# 打包 Layer
zip -r my-layer.zip python

# 发布 Layer
aws lambda publish-layer-version \
    --layer-name common-dependencies \
    --description "公共Python依赖库" \
    --zip-file fileb://my-layer.zip \
    --compatible-runtimes python3.9 python3.10 \
    --compatible-architectures x86_64 arm64
```

```yaml
# serverless.yml 配置 Layer
layers:
  commonDependencies:
    path: layers/common
    name: common-dependencies
    description: 公共依赖层
    compatibleRuntimes:
      - python3.9
      - python3.10
    retain: false

functions:
  api:
    handler: handler.main
    layers:
      - !Ref CommonDependenciesLambdaLayer  # 引用自定义层
      - arn:aws:lambda:us-east-1:123456789:layer:shared-utils:5  # 引用外部层
```

### 自定义运行时 Layer

```bash
# 创建自定义 Python 运行时 Layer
# bootstrap 文件是 Lambda 调用的入口
#!/bin/sh
set -euo pipefail

# 初始化
export PYTHONPATH="/opt/python"

# 处理事件循环
while true
do
    # 获取事件
    HEADERS="$(mktemp)"
    EVENT_DATA=$(curl -sS -LD "$HEADERS" -X GET \
        "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/next")
    REQUEST_ID=$(grep -Fi Lambda-Runtime-Aws-Request-Id "$HEADERS" | tr -d '[:space:]' | cut -d: -f2)

    # 调用处理函数
    RESPONSE=$(python3 -c "
import json
from handler import lambda_handler

event = json.loads('$EVENT_DATA')
context = type('Context', (), {'aws_request_id': '$REQUEST_ID'})()
result = lambda_handler(event, context)
print(json.dumps(result))
")

    # 返回响应
    curl -X POST \
        "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/response" \
        -d "$RESPONSE"
done
```

## 部署策略

### Serverless Framework

Serverless Framework 是最流行的 Serverless 部署工具：

```yaml
# serverless.yml 完整配置示例
service: my-serverless-app

frameworkVersion: '3'

provider:
  name: aws
  runtime: python3.9
  region: ap-northeast-1
  stage: ${opt:stage, 'dev'}
  memorySize: 256
  timeout: 30

  # 环境变量
  environment:
    STAGE: ${self:provider.stage}
    TABLE_NAME: ${self:service}-${self:provider.stage}-table

  # IAM 权限
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
            - dynamodb:UpdateItem
            - dynamodb:DeleteItem
          Resource:
            - !GetAtt DynamoDBTable.Arn
            - !Join ['/', [!GetAtt DynamoDBTable.Arn, 'index/*']]
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
          Resource:
            - !Join ['/', [!GetAtt S3Bucket.Arn, '*']]

# 插件
plugins:
  - serverless-python-requirements
  - serverless-offline
  - serverless-domain-manager

# 自定义配置
custom:
  pythonRequirements:
    dockerizePip: true
    slim: true
    layer: true

  serverless-offline:
    httpPort: 3000

  customDomain:
    domainName: api.example.com
    stage: ${self:provider.stage}
    createRoute53Record: true

# 函数定义
functions:
  # API 函数
  api:
    handler: src/handlers/api.handler
    events:
      - http:
          path: /{proxy+}
          method: any
          cors: true
    layers:
      - !Ref PythonRequirementsLambdaLayer

  # 定时任务
  scheduler:
    handler: src/handlers/scheduler.handler
    events:
      - schedule:
          rate: rate(1 hour)
          enabled: true

  # S3 触发器
  imageProcessor:
    handler: src/handlers/image.handler
    timeout: 60
    memorySize: 1024
    events:
      - s3:
          bucket: ${self:service}-${self:provider.stage}-uploads
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .jpg

# 资源定义
resources:
  Resources:
    DynamoDBTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.TABLE_NAME}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: pk
            AttributeType: S
          - AttributeName: sk
            AttributeType: S
        KeySchema:
          - AttributeName: pk
            KeyType: HASH
          - AttributeName: sk
            KeyType: RANGE
        GlobalSecondaryIndexes:
          - IndexName: GSI1
            KeySchema:
              - AttributeName: sk
                KeyType: HASH
              - AttributeName: pk
                KeyType: RANGE
            Projection:
              ProjectionType: ALL

    S3Bucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:service}-${self:provider.stage}-uploads
        CorsConfiguration:
          CorsRules:
            - AllowedHeaders: ['*']
              AllowedMethods: [GET, PUT, POST]
              AllowedOrigins: ['*']
              MaxAge: 3000
```

### AWS SAM（Serverless Application Model）

```yaml
# template.yaml (AWS SAM)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Description: Serverless API 应用

Globals:
  Function:
    Timeout: 30
    Runtime: python3.9
    MemorySize: 256
    Environment:
      Variables:
        STAGE: !Ref Stage
        LOG_LEVEL: INFO

Parameters:
  Stage:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: !Ref Stage
      Cors:
        AllowMethods: "'*'"
        AllowHeaders: "'*'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  # Lambda 函数
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: handlers/api.handler
      Description: API 处理函数
      Events:
        ApiEvent:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /{proxy+}
            Method: ANY
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref DataTable
        - S3ReadPolicy:
            BucketName: !Ref DataBucket

  # DynamoDB 表
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-data
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH

  # S3 存储桶
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub ${AWS::StackName}-data-${AWS::AccountId}

  # Cognito 用户池
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub ${AWS::StackName}-users
      AutoVerifiedAttributes:
        - email
      UsernameAttributes:
        - email

Outputs:
  ApiEndpoint:
    Description: API Gateway 端点
    Value: !Sub https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Stage}/

  UserPoolId:
    Description: Cognito 用户池 ID
    Value: !Ref UserPool
```

### CI/CD 流水线

```yaml
# .github/workflows/deploy.yml
name: Deploy Serverless Application

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  AWS_REGION: ap-northeast-1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run tests
        run: |
          pytest tests/ -v --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install Serverless Framework
        run: npm install -g serverless

      - name: Install plugins
        run: npm install

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Determine stage
        id: stage
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "stage=prod" >> $GITHUB_OUTPUT
          else
            echo "stage=dev" >> $GITHUB_OUTPUT
          fi

      - name: Deploy
        run: |
          serverless deploy --stage ${{ steps.stage.outputs.stage }} --verbose
```

## 监控与日志

### 结构化日志

```python
# 结构化日志实现
import json
import logging
import sys
from datetime import datetime
from functools import wraps
import traceback

class StructuredLogger:
    """结构化日志记录器"""

    def __init__(self, service_name: str, log_level: str = 'INFO'):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(getattr(logging, log_level))

        # 配置 JSON 格式输出
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(self.JsonFormatter())
        self.logger.addHandler(handler)

    class JsonFormatter(logging.Formatter):
        def format(self, record):
            log_data = {
                'timestamp': datetime.utcnow().isoformat(),
                'level': record.levelname,
                'message': record.getMessage(),
                'logger': record.name
            }

            # 添加额外字段
            if hasattr(record, 'extra_fields'):
                log_data.update(record.extra_fields)

            # 添加异常信息
            if record.exc_info:
                log_data['exception'] = {
                    'type': record.exc_info[0].__name__,
                    'message': str(record.exc_info[1]),
                    'stacktrace': traceback.format_exception(*record.exc_info)
                }

            return json.dumps(log_data, ensure_ascii=False)

    def _log(self, level: str, message: str, **kwargs):
        record = self.logger.makeRecord(
            self.service_name, getattr(logging, level),
            '', 0, message, (), None
        )
        record.extra_fields = kwargs
        self.logger.handle(record)

    def info(self, message: str, **kwargs):
        self._log('INFO', message, **kwargs)

    def error(self, message: str, exc_info=None, **kwargs):
        self._log('ERROR', message, **kwargs)
        if exc_info:
            self.logger.error(message, exc_info=exc_info)

    def warn(self, message: str, **kwargs):
        self._log('WARNING', message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log('DEBUG', message, **kwargs)

# 使用示例
logger = StructuredLogger('my-service')

def lambda_handler(event, context):
    # 记录请求开始
    logger.info('请求开始',
        request_id=context.aws_request_id,
        function_name=context.function_name,
        event_source=event.get('source', 'unknown')
    )

    try:
        # 业务逻辑
        result = process_request(event)

        # 记录成功
        logger.info('请求完成',
            request_id=context.aws_request_id,
            status='success',
            duration_ms=calculate_duration()
        )

        return result

    except Exception as e:
        # 记录错误
        logger.error('请求失败',
            request_id=context.aws_request_id,
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True
        )
        raise
```

### 分布式追踪（X-Ray）

```python
# AWS X-Ray 集成
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# 自动追踪 AWS SDK 调用
patch_all()

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    # 添加注解
    xray_recorder.put_annotation('user_id', event.get('user_id'))
    xray_recorder.put_annotation('operation', 'process_order')

    # 添加元数据
    xray_recorder.put_metadata('event', event)

    # 创建子段
    with xray_recorder.in_subsegment('validate_input'):
        validate_input(event)

    with xray_recorder.in_subsegment('process_data'):
        result = process_data(event)

    with xray_recorder.in_subsegment('save_to_database'):
        save_to_database(result)

    return {'statusCode': 200, 'body': 'Success'}

# serverless.yml X-Ray 配置
# provider:
#   tracing:
#     lambda: true
#     apiGateway: true
```

### CloudWatch Metrics 和告警

```python
# 自定义 CloudWatch 指标
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')

def put_custom_metric(metric_name: str, value: float, unit: str = 'Count',
                     dimensions: dict = None):
    """发送自定义指标到 CloudWatch"""

    metric_data = {
        'MetricName': metric_name,
        'Value': value,
        'Unit': unit,
        'Timestamp': datetime.utcnow()
    }

    if dimensions:
        metric_data['Dimensions'] = [
            {'Name': k, 'Value': v} for k, v in dimensions.items()
        ]

    cloudwatch.put_metric_data(
        Namespace='MyServerlessApp',
        MetricData=[metric_data]
    )

# 在函数中使用
def lambda_handler(event, context):
    start_time = datetime.utcnow()

    try:
        result = process_request(event)

        # 记录成功指标
        put_custom_metric(
            'RequestSuccess', 1, 'Count',
            {'Function': context.function_name}
        )

        return result

    except Exception as e:
        # 记录失败指标
        put_custom_metric(
            'RequestFailure', 1, 'Count',
            {'Function': context.function_name, 'ErrorType': type(e).__name__}
        )
        raise

    finally:
        # 记录延迟
        duration = (datetime.utcnow() - start_time).total_seconds() * 1000
        put_custom_metric(
            'RequestLatency', duration, 'Milliseconds',
            {'Function': context.function_name}
        )
```

```yaml
# CloudFormation 告警配置
Resources:
  ErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-errors
      AlarmDescription: Lambda 函数错误告警
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300  # 5分钟
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiFunction
      AlarmActions:
        - !Ref AlertTopic

  ThrottlingAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-throttles
      AlarmDescription: Lambda 函数节流告警
      MetricName: Throttles
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 3
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiFunction
      AlarmActions:
        - !Ref AlertTopic

  DurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-duration
      AlarmDescription: Lambda 函数延迟告警
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10000  # 10秒
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiFunction
      AlarmActions:
        - !Ref AlertTopic

  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub ${AWS::StackName}-alerts
      Subscription:
        - Protocol: email
          Endpoint: ops@example.com
```

## 成本优化

### 成本计算公式

AWS Lambda 的费用由以下部分组成：

```
总费用 = 请求费用 + 计算费用 + 其他费用

请求费用 = 请求次数 × $0.0000002（每百万次 $0.20）

计算费用 = GB-秒 × $0.0000166667
         = (内存MB / 1024) × 执行时间(秒) × 调用次数 × $0.0000166667

示例计算：
- 每月 1000 万次调用
- 平均执行时间 200ms
- 内存配置 256MB

请求费用 = 10,000,000 × $0.0000002 = $2.00
计算费用 = (256/1024) × 0.2 × 10,000,000 × $0.0000166667 = $8.33
总费用 = $2.00 + $8.33 = $10.33/月
```

### 内存与性能优化

```python
# 内存优化测试脚本
import boto3
import time
import json

lambda_client = boto3.client('lambda')

def benchmark_memory_settings(function_name: str, test_event: dict,
                             memory_sizes: list = None):
    """测试不同内存配置下的性能"""

    if memory_sizes is None:
        memory_sizes = [128, 256, 512, 1024, 2048, 3008]

    results = []
    original_config = lambda_client.get_function_configuration(
        FunctionName=function_name
    )

    for memory in memory_sizes:
        # 更新内存配置
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            MemorySize=memory
        )

        # 等待配置生效
        time.sleep(5)

        # 执行测试（多次取平均）
        durations = []
        for _ in range(10):
            response = lambda_client.invoke(
                FunctionName=function_name,
                Payload=json.dumps(test_event)
            )

            # 从日志中提取执行时间
            log_result = response.get('LogResult')
            if log_result:
                # 解析 REPORT 行获取实际执行时间
                duration = parse_duration_from_log(log_result)
                durations.append(duration)

        avg_duration = sum(durations) / len(durations)

        # 计算成本
        gb_seconds = (memory / 1024) * (avg_duration / 1000)
        cost_per_invocation = gb_seconds * 0.0000166667

        results.append({
            'memory_mb': memory,
            'avg_duration_ms': avg_duration,
            'gb_seconds': gb_seconds,
            'cost_per_million': cost_per_invocation * 1000000
        })

        print(f"内存: {memory}MB, 平均耗时: {avg_duration:.2f}ms, "
              f"百万次成本: ${cost_per_invocation * 1000000:.2f}")

    # 恢复原始配置
    lambda_client.update_function_configuration(
        FunctionName=function_name,
        MemorySize=original_config['MemorySize']
    )

    return results

# 使用 AWS Lambda Power Tuning（推荐）
# https://github.com/alexcasalboni/aws-lambda-power-tuning
```

### 成本优化策略

```yaml
# 成本优化配置示例
provider:
  name: aws
  runtime: python3.9

  # 1. 选择合适的内存（通过测试确定）
  memorySize: 512  # 而不是默认的 1024

  # 2. 设置合理的超时时间
  timeout: 10  # 而不是默认的 30

  # 3. 使用 ARM 架构（成本降低 20%，性能可能更好）
  architecture: arm64

functions:
  # 4. 为不同函数配置不同资源
  lightweightApi:
    handler: handlers/api.light_handler
    memorySize: 128
    timeout: 5

  heavyProcessing:
    handler: handlers/process.heavy_handler
    memorySize: 2048
    timeout: 60

  # 5. 使用预留并发控制成本
  criticalApi:
    handler: handlers/api.critical_handler
    reservedConcurrency: 100  # 限制最大并发

custom:
  # 6. 针对不同环境配置不同资源
  stages:
    dev:
      memorySize: 128
      logRetention: 7
    prod:
      memorySize: 512
      logRetention: 30
```

```python
# 代码级别的优化
import asyncio
from functools import lru_cache

# 使用连接池复用
import urllib3
http = urllib3.PoolManager(maxsize=10)

# 缓存重复计算
@lru_cache(maxsize=128)
def expensive_calculation(param):
    # 耗时计算
    return result

# 并行处理多个 I/O 操作
async def parallel_fetch(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# 延迟加载大型依赖
_heavy_module = None

def get_heavy_module():
    global _heavy_module
    if _heavy_module is None:
        import heavy_module  # 只在需要时加载
        _heavy_module = heavy_module
    return _heavy_module

# 使用流式处理大文件
def process_large_file(bucket, key):
    s3 = boto3.client('s3')
    response = s3.get_object(Bucket=bucket, Key=key)

    # 流式读取，避免内存溢出
    for chunk in response['Body'].iter_chunks(chunk_size=1024*1024):
        process_chunk(chunk)
```

### 成本监控和报告

```python
# 成本分析脚本
import boto3
from datetime import datetime, timedelta

ce_client = boto3.client('ce')  # Cost Explorer

def get_lambda_costs(days: int = 30):
    """获取 Lambda 成本报告"""

    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)

    response = ce_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date.isoformat(),
            'End': end_date.isoformat()
        },
        Granularity='DAILY',
        Metrics=['BlendedCost', 'UsageQuantity'],
        Filter={
            'Dimensions': {
                'Key': 'SERVICE',
                'Values': ['AWS Lambda']
            }
        },
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}
        ]
    )

    # 分析结果
    total_cost = 0
    cost_breakdown = {}

    for result in response['ResultsByTime']:
        for group in result['Groups']:
            usage_type = group['Keys'][0]
            cost = float(group['Metrics']['BlendedCost']['Amount'])
            total_cost += cost

            if usage_type not in cost_breakdown:
                cost_breakdown[usage_type] = 0
            cost_breakdown[usage_type] += cost

    return {
        'total_cost': total_cost,
        'daily_average': total_cost / days,
        'breakdown': cost_breakdown
    }

def get_function_invocations(function_name: str, days: int = 7):
    """获取函数调用统计"""

    cloudwatch = boto3.client('cloudwatch')

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=days)

    response = cloudwatch.get_metric_statistics(
        Namespace='AWS/Lambda',
        MetricName='Invocations',
        Dimensions=[
            {'Name': 'FunctionName', 'Value': function_name}
        ],
        StartTime=start_time,
        EndTime=end_time,
        Period=86400,  # 每天
        Statistics=['Sum']
    )

    total_invocations = sum(dp['Sum'] for dp in response['Datapoints'])

    return {
        'function_name': function_name,
        'period_days': days,
        'total_invocations': int(total_invocations),
        'daily_average': int(total_invocations / days)
    }
```

## 最佳实践总结

### 架构设计原则

```
Serverless 架构最佳实践：

1. 单一职责
   ┌─────────────────────────────────────┐
   │  每个函数只做一件事                   │
   │  - 易于测试和调试                     │
   │  - 独立扩展                          │
   │  - 故障隔离                          │
   └─────────────────────────────────────┘

2. 无状态设计
   ┌─────────────────────────────────────┐
   │  函数不依赖本地状态                   │
   │  - 使用外部存储（DynamoDB、Redis）    │
   │  - 支持水平扩展                       │
   │  - 请求间相互独立                     │
   └─────────────────────────────────────┘

3. 异步优先
   ┌─────────────────────────────────────┐
   │  使用消息队列解耦                     │
   │  - SQS、SNS、EventBridge            │
   │  - 提高系统弹性                       │
   │  - 削峰填谷                          │
   └─────────────────────────────────────┘

4. 幂等性设计
   ┌─────────────────────────────────────┐
   │  相同请求多次执行结果一致              │
   │  - 使用唯一请求 ID                    │
   │  - 乐观锁控制并发                     │
   │  - 支持安全重试                       │
   └─────────────────────────────────────┘
```

### 安全最佳实践

```python
# 安全配置示例
import os
import boto3
from functools import wraps

# 使用环境变量存储敏感信息
DATABASE_URL = os.environ.get('DATABASE_URL')
API_KEY = os.environ.get('API_KEY')

# 使用 Secrets Manager 管理密钥
def get_secret(secret_name: str) -> dict:
    """从 Secrets Manager 获取密钥"""
    client = boto3.client('secretsmanager')
    response = client.get_secret_value(SecretId=secret_name)
    return json.loads(response['SecretString'])

# 输入验证
from pydantic import BaseModel, validator

class UserInput(BaseModel):
    username: str
    email: str
    age: int

    @validator('username')
    def validate_username(cls, v):
        if not v.isalnum():
            raise ValueError('用户名只能包含字母和数字')
        if len(v) < 3 or len(v) > 20:
            raise ValueError('用户名长度必须在3-20之间')
        return v

    @validator('email')
    def validate_email(cls, v):
        import re
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', v):
            raise ValueError('邮箱格式无效')
        return v

# 权限最小化原则
# serverless.yml
# iam:
#   role:
#     statements:
#       - Effect: Allow
#         Action:
#           - dynamodb:GetItem
#           - dynamodb:PutItem
#         Resource: !GetAtt Table.Arn
#         # 不要使用 dynamodb:* 或 Resource: "*"

# 请求验证装饰器
def validate_request(schema_class):
    def decorator(func):
        @wraps(func)
        def wrapper(event, context):
            try:
                body = json.loads(event.get('body', '{}'))
                validated_data = schema_class(**body)
                event['validated_body'] = validated_data.dict()
                return func(event, context)
            except Exception as e:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': str(e)})
                }
        return wrapper
    return decorator

@validate_request(UserInput)
def lambda_handler(event, context):
    user_data = event['validated_body']
    # 处理验证后的数据
    return {'statusCode': 200, 'body': 'Success'}
```

### 错误处理模式

```python
# 统一错误处理
import json
import traceback
from functools import wraps
from enum import Enum

class ErrorCode(Enum):
    VALIDATION_ERROR = 'VALIDATION_ERROR'
    NOT_FOUND = 'NOT_FOUND'
    UNAUTHORIZED = 'UNAUTHORIZED'
    INTERNAL_ERROR = 'INTERNAL_ERROR'
    RATE_LIMITED = 'RATE_LIMITED'

class AppError(Exception):
    """应用自定义异常"""

    def __init__(self, code: ErrorCode, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)

    def to_response(self):
        status_codes = {
            ErrorCode.VALIDATION_ERROR: 400,
            ErrorCode.NOT_FOUND: 404,
            ErrorCode.UNAUTHORIZED: 401,
            ErrorCode.INTERNAL_ERROR: 500,
            ErrorCode.RATE_LIMITED: 429
        }

        return {
            'statusCode': status_codes.get(self.code, 500),
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': {
                    'code': self.code.value,
                    'message': self.message,
                    'details': self.details
                }
            })
        }

def error_handler(func):
    """统一错误处理装饰器"""

    @wraps(func)
    def wrapper(event, context):
        try:
            return func(event, context)

        except AppError as e:
            # 业务异常
            logger.warning(f"业务异常: {e.code.value} - {e.message}")
            return e.to_response()

        except json.JSONDecodeError:
            # JSON 解析错误
            return AppError(
                ErrorCode.VALIDATION_ERROR,
                '请求体必须是有效的 JSON 格式'
            ).to_response()

        except Exception as e:
            # 未预期的异常
            logger.error(f"未处理异常: {str(e)}", exc_info=True)
            return AppError(
                ErrorCode.INTERNAL_ERROR,
                '服务器内部错误'
            ).to_response()

    return wrapper

# 使用示例
@error_handler
def lambda_handler(event, context):
    user_id = event.get('pathParameters', {}).get('id')

    if not user_id:
        raise AppError(
            ErrorCode.VALIDATION_ERROR,
            '缺少用户 ID',
            {'field': 'id', 'location': 'path'}
        )

    user = get_user(user_id)
    if not user:
        raise AppError(
            ErrorCode.NOT_FOUND,
            f'用户 {user_id} 不存在'
        )

    return {
        'statusCode': 200,
        'body': json.dumps(user)
    }
```

## 常见问题排查

### 冷启动延迟过高

```
问题：函数首次调用延迟超过 3 秒

排查步骤：
1. 检查部署包大小
   aws lambda get-function --function-name xxx | jq '.Configuration.CodeSize'

2. 分析初始化代码
   - 是否在全局范围导入大型库？
   - 是否在 handler 外建立不必要的连接？

3. 查看 X-Ray 追踪
   - 确定延迟发生在哪个阶段
   - 识别耗时的初始化操作

解决方案：
- 使用预置并发
- 将大型依赖移至 Layer
- 延迟加载非必需模块
- 考虑使用更轻量的运行时（如 Go、Rust）
```

### 内存溢出（OOM）

```python
# 内存使用监控
import tracemalloc

def lambda_handler(event, context):
    # 启动内存跟踪
    tracemalloc.start()

    try:
        result = process_data(event)

        # 获取内存使用峰值
        current, peak = tracemalloc.get_traced_memory()
        print(f"当前内存: {current / 1024 / 1024:.2f} MB")
        print(f"峰值内存: {peak / 1024 / 1024:.2f} MB")
        print(f"配置内存: {context.memory_limit_in_mb} MB")

        # 检查是否接近限制
        if peak / 1024 / 1024 > context.memory_limit_in_mb * 0.8:
            logger.warning("内存使用接近限制，建议增加内存配置")

        return result

    finally:
        tracemalloc.stop()

# 处理大文件时使用流式处理
def process_large_file_safely(bucket, key):
    """流式处理大文件，避免内存溢出"""

    s3 = boto3.client('s3')

    # 获取文件大小
    head = s3.head_object(Bucket=bucket, Key=key)
    file_size = head['ContentLength']

    # 分块处理
    chunk_size = 10 * 1024 * 1024  # 10MB

    for start in range(0, file_size, chunk_size):
        end = min(start + chunk_size - 1, file_size - 1)

        response = s3.get_object(
            Bucket=bucket, Key=key,
            Range=f'bytes={start}-{end}'
        )

        chunk = response['Body'].read()
        process_chunk(chunk)

        # 显式释放内存
        del chunk
```

### 超时问题

```python
# 超时处理策略
import signal

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("函数执行超时")

def lambda_handler(event, context):
    # 设置安全边界（预留 5 秒用于清理）
    remaining_time = context.get_remaining_time_in_millis()
    safe_timeout = (remaining_time - 5000) / 1000

    # 注册超时信号（仅在 Linux 上有效）
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(int(safe_timeout))

    try:
        # 执行可能超时的操作
        result = long_running_operation(event)
        return result

    except TimeoutError:
        # 超时处理
        logger.error("操作超时，保存当前进度")
        save_progress(event)

        return {
            'statusCode': 202,
            'body': json.dumps({
                'message': '处理超时，已保存进度',
                'resumeToken': generate_resume_token(event)
            })
        }

    finally:
        signal.alarm(0)  # 取消定时器
```

## 总结

Serverless 函数计算代表了云计算的重要发展方向，它让开发者能够专注于业务逻辑而无需管理基础设施。通过本文的学习，你应该掌握了：

1. **核心概念**：理解 Serverless 和 FaaS 的本质，以及与传统架构的区别
2. **冷启动优化**：通过预置并发、代码优化、Layer 分离等手段降低延迟
3. **事件触发器**：熟悉 HTTP、定时、队列、存储等多种触发方式
4. **部署策略**：使用 Serverless Framework、SAM 等工具实现自动化部署
5. **监控与日志**：建立完善的可观测性体系，快速定位和解决问题
6. **成本优化**：通过合理配置和代码优化，最大化性价比

Serverless 虽然有执行时间限制、冷启动延迟等挑战，但通过合理的架构设计和优化策略，完全可以构建高性能、低成本的生产级应用。随着技术的不断演进，Serverless 将在更多场景中发挥重要作用。
