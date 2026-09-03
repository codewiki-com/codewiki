---
title: Serverless Functions
description: Build serverless applications with AWS Lambda/Cloud Functions
track: backend
section: deployment
difficulty: intermediate
tags:
  - Serverless
  - Lambda
  - Cloud Functions
  - FaaS
status: imported
origin: old/src/content/docs/backend/serverless-functions.en.md
divergence: 0.166
issues: []
legacy:
  category: Backend
  subcategory: Serverless
  order: 30
  lastUpdated: 2026-01-07
---

Serverless computing represents a paradigm shift in how we build and deploy applications. Instead of managing servers, developers focus purely on writing code while the cloud provider handles all infrastructure concerns. We'll cover serverless concepts, AWS Lambda, cold starts, event triggers, deployment strategies, monitoring, and cost optimization.

## What is Serverless Computing?

Serverless computing is a cloud execution model where the cloud provider dynamically manages the allocation and provisioning of servers. Despite the name, servers still exist, but developers do not need to think about them.

```
Traditional Architecture vs Serverless Architecture

+------------------------+          +------------------------+
|   Traditional Server   |          |      Serverless        |
+------------------------+          +------------------------+
| +--------------------+ |          | +--------------------+ |
| |  Your Application  | |          | |  Your Functions    | |
| +--------------------+ |          | +--------------------+ |
| |  Runtime (Node.js) | |          |          ^            |
| +--------------------+ |          |          |            |
| |  Operating System  | |          |   Cloud Provider      |
| +--------------------+ |          |   Manages Everything  |
| |     Hardware       | |          |   Below This Line     |
| +--------------------+ |          +------------------------+
+------------------------+
  You manage everything              You only write code
```

### Key Characteristics

| Characteristic | Description |
|----------------|-------------|
| No Server Management | Infrastructure provisioning is handled by the provider |
| Auto-scaling | Scales automatically from zero to thousands of concurrent executions |
| Pay-per-use | Billed only for actual compute time consumed |
| Event-driven | Functions execute in response to events |
| Stateless | Each invocation is independent with no shared state |

### Function as a Service (FaaS)

FaaS is the compute component of serverless architecture. It allows you to run code without provisioning or managing servers.

```javascript
// A simple AWS Lambda function
exports.handler = async (event, context) => {
  const name = event.queryStringParameters?.name || 'World';

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      requestId: context.awsRequestId
    })
  };
};
```

### Major Serverless Platforms

| Platform | Provider | Runtime Support | Max Execution Time |
|----------|----------|-----------------|-------------------|
| AWS Lambda | Amazon | Node.js, Python, Java, Go, .NET, Ruby | 15 minutes |
| Azure Functions | Microsoft | Node.js, Python, Java, C#, PowerShell | 10 minutes (Consumption) |
| Google Cloud Functions | Google | Node.js, Python, Go, Java, .NET, Ruby | 9 minutes (1st gen), 60 min (2nd gen) |
| Cloudflare Workers | Cloudflare | JavaScript, TypeScript, Rust, WASM | 30 seconds (free), 15 min (paid) |

## AWS Lambda Deep Dive

AWS Lambda is the most widely adopted serverless platform. It runs your code in response to events and automatically manages the underlying compute resources.

### Lambda Function Anatomy

```javascript
// Complete Lambda function structure
exports.handler = async (event, context) => {
  // event: Contains data about the triggering event
  // context: Provides runtime information

  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Remaining time:', context.getRemainingTimeInMillis());
  console.log('Function name:', context.functionName);
  console.log('Memory limit:', context.memoryLimitInMB);

  try {
    // Your business logic here
    const result = await processEvent(event);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function processEvent(event) {
  // Process the incoming event
  return { processed: true, timestamp: new Date().toISOString() };
}
```

### Lambda Execution Model

```
Lambda Invocation Lifecycle

+------------------+     +------------------+     +------------------+
|   Event Source   | --> |  Lambda Service  | --> | Function Instance|
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                         +--------------------------------------------------+
                         |              Execution Environment               |
                         | +----------------------------------------------+ |
                         | |  1. INIT Phase (Cold Start)                  | |
                         | |     - Download code                          | |
                         | |     - Start runtime                          | |
                         | |     - Run initialization code                | |
                         | +----------------------------------------------+ |
                         | |  2. INVOKE Phase                             | |
                         | |     - Execute handler function               | |
                         | |     - Return response                        | |
                         | +----------------------------------------------+ |
                         | |  3. SHUTDOWN Phase                           | |
                         | |     - Runtime shutdown (optional hooks)      | |
                         | +----------------------------------------------+ |
                         +--------------------------------------------------+
```

### Python Lambda Example

```python
import json
import boto3
import logging
from datetime import datetime

# Initialize outside handler for connection reuse
logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Users')

def lambda_handler(event, context):
    """
    Main Lambda handler function

    Args:
        event: Event data from the trigger
        context: Lambda runtime information

    Returns:
        API Gateway compatible response
    """
    logger.info(f"Received event: {json.dumps(event)}")

    http_method = event.get('httpMethod', 'GET')

    try:
        if http_method == 'GET':
            return get_user(event)
        elif http_method == 'POST':
            return create_user(event)
        elif http_method == 'PUT':
            return update_user(event)
        elif http_method == 'DELETE':
            return delete_user(event)
        else:
            return response(405, {'error': 'Method not allowed'})

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return response(500, {'error': 'Internal server error'})


def get_user(event):
    user_id = event['pathParameters']['id']

    result = table.get_item(Key={'userId': user_id})

    if 'Item' not in result:
        return response(404, {'error': 'User not found'})

    return response(200, result['Item'])


def create_user(event):
    body = json.loads(event['body'])

    item = {
        'userId': body['userId'],
        'name': body['name'],
        'email': body['email'],
        'createdAt': datetime.utcnow().isoformat()
    }

    table.put_item(Item=item)

    return response(201, item)


def update_user(event):
    user_id = event['pathParameters']['id']
    body = json.loads(event['body'])

    update_expression = "SET #name = :name, email = :email, updatedAt = :updated"

    result = table.update_item(
        Key={'userId': user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames={'#name': 'name'},
        ExpressionAttributeValues={
            ':name': body['name'],
            ':email': body['email'],
            ':updated': datetime.utcnow().isoformat()
        },
        ReturnValues='ALL_NEW'
    )

    return response(200, result['Attributes'])


def delete_user(event):
    user_id = event['pathParameters']['id']

    table.delete_item(Key={'userId': user_id})

    return response(204, None)


def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body) if body else ''
    }
```

### Lambda Configuration

```yaml
# AWS SAM template (template.yaml)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Serverless API with Lambda

Globals:
  Function:
    Timeout: 30
    MemorySize: 256
    Runtime: python3.11
    Architectures:
      - arm64  # Graviton2 for better price/performance
    Environment:
      Variables:
        LOG_LEVEL: INFO
        TABLE_NAME: !Ref UsersTable

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: user-api
      CodeUri: src/
      Handler: app.lambda_handler
      Description: User API Lambda function

      # VPC Configuration (if needed)
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2

      # IAM Permissions
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable

      # API Gateway Events
      Events:
        GetUser:
          Type: Api
          Properties:
            Path: /users/{id}
            Method: GET
        CreateUser:
          Type: Api
          Properties:
            Path: /users
            Method: POST
        UpdateUser:
          Type: Api
          Properties:
            Path: /users/{id}
            Method: PUT
        DeleteUser:
          Type: Api
          Properties:
            Path: /users/{id}
            Method: DELETE

  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Users
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

## Understanding Cold Starts

Cold starts are one of the most discussed aspects of serverless computing. A cold start occurs when a function is invoked after being idle, requiring the platform to initialize a new execution environment.

### Cold Start Timeline

```
Cold Start vs Warm Start

Cold Start (First invocation or after idle):
+--------+------------------+-------------------+------------------+
| Download|  Start Runtime   | Init Code         | Execute Handler  |
|  Code  |  Environment     | (outside handler) |                  |
+--------+------------------+-------------------+------------------+
         |<---- Cold Start Latency ---->|<-- Execution Time -->|

Warm Start (Subsequent invocations):
+------------------+
| Execute Handler  |
+------------------+
|<-- Execution  -->|
     Time Only
```

### Cold Start Factors

| Factor | Impact | Optimization Strategy |
|--------|--------|----------------------|
| Runtime | Java/.NET have higher cold starts than Node.js/Python | Choose lightweight runtimes for latency-sensitive apps |
| Package Size | Larger packages take longer to download | Minimize dependencies, use tree shaking |
| Memory Allocation | More memory = faster CPU = faster init | Increase memory for faster cold starts |
| VPC | VPC-attached functions have longer cold starts | Use VPC only when necessary, use VPC endpoints |
| Init Code | Code outside handler runs during cold start | Move heavy initialization to handler when possible |

### Cold Start Measurements by Runtime

```
Typical Cold Start Latencies (approximate):

Python 3.x:     |████████|                           ~200-500ms
Node.js 18.x:   |██████████|                         ~200-600ms
Go 1.x:         |██████|                             ~150-400ms
Ruby 3.x:       |████████████|                       ~300-700ms
Java 17:        |██████████████████████████|         ~1000-3000ms
.NET 6:         |██████████████████████|             ~800-2000ms

Note: These are estimates. Actual times vary based on package size,
memory configuration, and VPC settings.
```

### Cold Start Mitigation Strategies

```javascript
// 1. Provisioned Concurrency keeps instances warm
// Configure in AWS Console or CloudFormation

// 2. Optimize initialization code
// BAD: Heavy initialization in handler
exports.handler = async (event) => {
  const AWS = require('aws-sdk');  // Cold start penalty every time
  const db = new AWS.DynamoDB.DocumentClient();
  // ...
};

// GOOD: Initialize outside handler (runs once during cold start)
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Handler uses pre-initialized resources
  const result = await db.get(params).promise();
  // ...
};
```

```python
# Use lazy loading for rarely-used dependencies
import json

# Heavy imports loaded lazily
_heavy_module = None

def get_heavy_module():
    global _heavy_module
    if _heavy_module is None:
        import heavy_dependency  # Only imported when needed
        _heavy_module = heavy_dependency
    return _heavy_module

def lambda_handler(event, context):
    if event.get('needs_heavy_processing'):
        module = get_heavy_module()
        return module.process(event)

    # Light operations don't incur import penalty
    return {'statusCode': 200, 'body': json.dumps('OK')}
```

```yaml
# Provisioned Concurrency Configuration (SAM)
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      # ... other properties
      AutoPublishAlias: live
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 5

  # Schedule-based provisioned concurrency
  ScheduledProvisionedConcurrency:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      ServiceNamespace: lambda
      ScalableDimension: lambda:function:ProvisionedConcurrency
      ResourceId: !Sub function:${MyFunction}:live
      MinCapacity: 1
      MaxCapacity: 100
```

## Event Triggers

Lambda functions can be triggered by a wide variety of AWS services and custom events.

### Common Event Sources

```
Lambda Event Sources

+-------------------+     +----------------+     +-------------------+
|  Synchronous      |     |  AWS Lambda    |     |  Asynchronous     |
|  Invocations      | --> |                | <-- |  Invocations      |
+-------------------+     +----------------+     +-------------------+
| - API Gateway     |                            | - S3              |
| - ALB             |                            | - SNS             |
| - Cognito         |                            | - EventBridge     |
| - Alexa           |                            | - CloudWatch Events|
+-------------------+                            +-------------------+

+-------------------+
|  Stream-based     |
|  (Poll-based)     |
+-------------------+
| - Kinesis         |
| - DynamoDB Streams|
| - SQS             |
| - Kafka           |
+-------------------+
```

### API Gateway Integration

```javascript
// API Gateway event structure
const apiGatewayEvent = {
  resource: '/users/{id}',
  path: '/users/123',
  httpMethod: 'GET',
  headers: {
    'Accept': 'application/json',
    'Authorization': 'Bearer eyJhbGc...'
  },
  queryStringParameters: {
    'include': 'profile'
  },
  pathParameters: {
    'id': '123'
  },
  body: null,
  isBase64Encoded: false,
  requestContext: {
    accountId: '123456789012',
    apiId: 'abc123',
    authorizer: {
      claims: {
        sub: 'user-uuid',
        email: 'user@example.com'
      }
    },
    requestId: 'request-id',
    identity: {
      sourceIp: '192.168.1.1',
      userAgent: 'Mozilla/5.0...'
    }
  }
};

// Handler for API Gateway
exports.handler = async (event) => {
  const userId = event.pathParameters.id;
  const authUser = event.requestContext.authorizer?.claims;

  // Process request
  const user = await getUser(userId);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300'
    },
    body: JSON.stringify(user)
  };
};
```

### S3 Event Trigger

```python
import json
import boto3
import urllib.parse

s3_client = boto3.client('s3')
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    """Process images uploaded to S3"""

    for record in event['Records']:
        # Get bucket and key from event
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])

        print(f"Processing: s3://{bucket}/{key}")

        # Analyze image with Rekognition
        response = rekognition.detect_labels(
            Image={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            },
            MaxLabels=10,
            MinConfidence=75
        )

        labels = [label['Name'] for label in response['Labels']]

        # Store results
        result_key = f"results/{key.split('/')[-1]}.json"
        s3_client.put_object(
            Bucket=bucket,
            Key=result_key,
            Body=json.dumps({
                'sourceImage': key,
                'labels': labels,
                'confidence': response['Labels']
            }),
            ContentType='application/json'
        )

        print(f"Labels detected: {labels}")

    return {
        'statusCode': 200,
        'body': json.dumps('Processing complete')
    }
```

### SQS Event Processing

```javascript
// SQS batch processing with partial failure handling
exports.handler = async (event) => {
  const batchItemFailures = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);

      console.log(`Processing message: ${record.messageId}`);

      // Process the message
      await processMessage(body);

      console.log(`Successfully processed: ${record.messageId}`);
    } catch (error) {
      console.error(`Failed to process ${record.messageId}:`, error);

      // Report individual item failures
      batchItemFailures.push({
        itemIdentifier: record.messageId
      });
    }
  }

  // Return failed items for retry
  return {
    batchItemFailures
  };
};

async function processMessage(message) {
  // Your message processing logic
  await sendNotification(message);
  await updateDatabase(message);
}
```

### EventBridge (CloudWatch Events) Scheduled Trigger

```python
import boto3
from datetime import datetime, timedelta

ec2 = boto3.client('ec2')

def lambda_handler(event, context):
    """
    Scheduled function to clean up old EBS snapshots
    Triggered by EventBridge rule: rate(1 day)
    """

    # Calculate cutoff date (30 days ago)
    cutoff_date = datetime.utcnow() - timedelta(days=30)

    # Get all snapshots owned by this account
    snapshots = ec2.describe_snapshots(OwnerIds=['self'])['Snapshots']

    deleted_count = 0

    for snapshot in snapshots:
        # Check if snapshot is older than cutoff
        if snapshot['StartTime'].replace(tzinfo=None) < cutoff_date:
            # Check if snapshot is not in use
            if not is_snapshot_in_use(snapshot['SnapshotId']):
                print(f"Deleting snapshot: {snapshot['SnapshotId']}")

                ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
                deleted_count += 1

    print(f"Cleanup complete. Deleted {deleted_count} snapshots.")

    return {
        'statusCode': 200,
        'deletedSnapshots': deleted_count
    }

def is_snapshot_in_use(snapshot_id):
    # Check if snapshot is used by any AMI
    images = ec2.describe_images(
        Filters=[{
            'Name': 'block-device-mapping.snapshot-id',
            'Values': [snapshot_id]
        }]
    )
    return len(images['Images']) > 0
```

## Lambda Layers

Lambda Layers allow you to package and share common code, libraries, and dependencies across multiple functions.

### Layer Architecture

```
Lambda Layers Structure

+------------------------------------------+
|           Lambda Function                |
|  +------------------------------------+  |
|  |         Your Function Code         |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |    Layer 1: Common Utilities       |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |    Layer 2: SDK/Libraries          |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  |    Layer 3: ML Models/Data         |  |
|  +------------------------------------+  |
+------------------------------------------+

Layers are extracted to /opt directory:
/opt/nodejs/node_modules/    (Node.js)
/opt/python/                 (Python)
/opt/lib/                    (Shared libraries)
```

### Creating a Python Layer

```bash
# Directory structure for Python layer
mkdir -p python-layer/python

# Install dependencies
pip install requests boto3 -t python-layer/python/

# Create ZIP file
cd python-layer
zip -r ../my-layer.zip python/

# Publish layer
aws lambda publish-layer-version \
    --layer-name my-python-utils \
    --description "Common Python utilities" \
    --zip-file fileb://my-layer.zip \
    --compatible-runtimes python3.9 python3.10 python3.11 \
    --compatible-architectures x86_64 arm64
```

### Creating a Node.js Layer

```bash
# Directory structure for Node.js layer
mkdir -p nodejs-layer/nodejs

cd nodejs-layer/nodejs
npm init -y
npm install lodash axios moment

cd ..
zip -r ../my-node-layer.zip nodejs/

# Publish layer
aws lambda publish-layer-version \
    --layer-name my-node-utils \
    --zip-file fileb://my-node-layer.zip \
    --compatible-runtimes nodejs18.x nodejs20.x
```

### Using Layers in SAM

```yaml
# template.yaml
Resources:
  SharedUtilsLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: shared-utils
      Description: Shared utility functions and libraries
      ContentUri: layers/shared-utils/
      CompatibleRuntimes:
        - python3.11
      RetentionPolicy: Retain
    Metadata:
      BuildMethod: python3.11

  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.11
      Layers:
        - !Ref SharedUtilsLayer
        - arn:aws:lambda:us-east-1:123456789012:layer:external-layer:1
```

### Layer Best Practices

```python
# Layer code structure (/opt/python/utils/common.py)
import json
import logging
from functools import wraps
from typing import Any, Callable

logger = logging.getLogger(__name__)

def api_response(status_code: int, body: Any, headers: dict = None) -> dict:
    """Standardized API response format"""
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

    if headers:
        default_headers.update(headers)

    return {
        'statusCode': status_code,
        'headers': default_headers,
        'body': json.dumps(body) if body else ''
    }


def handle_errors(func: Callable) -> Callable:
    """Decorator for consistent error handling"""
    @wraps(func)
    def wrapper(event, context):
        try:
            return func(event, context)
        except ValidationError as e:
            logger.warning(f"Validation error: {e}")
            return api_response(400, {'error': str(e)})
        except NotFoundError as e:
            return api_response(404, {'error': str(e)})
        except Exception as e:
            logger.exception("Unexpected error")
            return api_response(500, {'error': 'Internal server error'})

    return wrapper


class ValidationError(Exception):
    pass


class NotFoundError(Exception):
    pass
```

```python
# Using the layer in your function
from utils.common import api_response, handle_errors, ValidationError

@handle_errors
def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))

    if 'email' not in body:
        raise ValidationError('Email is required')

    user = create_user(body)
    return api_response(201, user)
```

## Deployment Strategies

### Infrastructure as Code with Serverless Framework

```yaml
# serverless.yml
service: my-serverless-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'us-east-1'}

  environment:
    DYNAMODB_TABLE: ${self:service}-${self:provider.stage}
    LOG_LEVEL: ${self:custom.logLevel.${self:provider.stage}}

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
            - !GetAtt UsersTable.Arn
            - !Sub '${UsersTable.Arn}/index/*'

custom:
  logLevel:
    dev: DEBUG
    staging: INFO
    prod: WARN

  prune:
    automatic: true
    number: 3

functions:
  api:
    handler: src/handlers/api.handler
    memorySize: 256
    timeout: 30
    events:
      - http:
          path: /users
          method: get
          cors: true
      - http:
          path: /users
          method: post
          cors: true
      - http:
          path: /users/{id}
          method: get
          cors: true
      - http:
          path: /users/{id}
          method: put
          cors: true
      - http:
          path: /users/{id}
          method: delete
          cors: true

  processQueue:
    handler: src/handlers/queue.handler
    memorySize: 512
    timeout: 300
    reservedConcurrency: 10
    events:
      - sqs:
          arn: !GetAtt ProcessingQueue.Arn
          batchSize: 10
          maximumBatchingWindow: 5

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.DYNAMODB_TABLE}
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

    ProcessingQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-${self:provider.stage}-processing
        VisibilityTimeout: 360
        RedrivePolicy:
          deadLetterTargetArn: !GetAtt DeadLetterQueue.Arn
          maxReceiveCount: 3

    DeadLetterQueue:
      Type: AWS::SQS::Queue
      Properties:
        QueueName: ${self:service}-${self:provider.stage}-dlq
        MessageRetentionPeriod: 1209600  # 14 days

plugins:
  - serverless-prune-plugin
  - serverless-offline
```

### CI/CD Pipeline with GitHub Actions

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
  AWS_REGION: us-east-1
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to staging
        run: npx serverless deploy --stage staging

      - name: Run integration tests
        run: npm run test:integration
        env:
          API_ENDPOINT: ${{ steps.deploy.outputs.api-endpoint }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to production
        run: npx serverless deploy --stage prod
```

### Blue-Green Deployment with Lambda Aliases

```yaml
# SAM template with traffic shifting
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: my-api-function
      Handler: app.handler
      Runtime: nodejs18.x
      AutoPublishAlias: live

      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
        Alarms:
          - !Ref ApiErrorAlarm
          - !Ref Api5xxAlarm
        Hooks:
          PreTraffic: !Ref PreTrafficHook
          PostTraffic: !Ref PostTrafficHook

  PreTrafficHook:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hooks.pre_traffic
      Runtime: python3.11
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action: codedeploy:PutLifecycleEventHookExecutionStatus
              Resource: '*'
            - Effect: Allow
              Action: lambda:InvokeFunction
              Resource: !Ref MyFunction.Version

  PostTrafficHook:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hooks.post_traffic
      Runtime: python3.11

  ApiErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Lambda errors exceed threshold
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyFunction
```

## Monitoring and Observability

### CloudWatch Metrics and Logs

```python
import json
import logging
import os
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit

# Initialize Powertools
logger = Logger(service="user-service")
metrics = Metrics(namespace="UserService")
tracer = Tracer(service="user-service")

@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(capture_cold_start_metric=True)
@tracer.capture_lambda_handler
def lambda_handler(event, context):
    """
    Lambda handler with comprehensive observability
    """

    # Add custom dimensions to all metrics
    metrics.add_dimension(name="Environment", value=os.environ.get("ENV", "dev"))

    try:
        # Parse request
        user_id = event['pathParameters']['id']

        # Add correlation ID for request tracing
        logger.append_keys(user_id=user_id)

        # Business logic with tracing
        with tracer.capture_method():
            user = get_user(user_id)

        # Record custom metrics
        metrics.add_metric(name="UserFetched", unit=MetricUnit.Count, value=1)

        logger.info("User retrieved successfully", extra={"user_status": user.get("status")})

        return {
            'statusCode': 200,
            'body': json.dumps(user)
        }

    except UserNotFoundError as e:
        logger.warning("User not found", extra={"user_id": user_id})
        metrics.add_metric(name="UserNotFound", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'User not found'})
        }

    except Exception as e:
        logger.exception("Unexpected error")
        metrics.add_metric(name="UnhandledError", unit=MetricUnit.Count, value=1)

        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


@tracer.capture_method
def get_user(user_id: str) -> dict:
    """Fetch user from database with tracing"""
    # Add custom annotation for tracing
    tracer.put_annotation(key="UserId", value=user_id)

    # Simulate database call
    user = fetch_from_dynamodb(user_id)

    # Add metadata to trace
    tracer.put_metadata(key="user_data", value=user)

    return user
```

### CloudWatch Dashboard

```yaml
# CloudFormation for monitoring dashboard
Resources:
  ServerlessDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: Serverless-API-Dashboard
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "title": "Lambda Invocations",
                "metrics": [
                  ["AWS/Lambda", "Invocations", "FunctionName", "${MyFunction}", {"stat": "Sum"}],
                  [".", "Errors", ".", ".", {"stat": "Sum", "color": "#d62728"}],
                  [".", "Throttles", ".", ".", {"stat": "Sum", "color": "#ff7f0e"}]
                ],
                "period": 60,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "title": "Lambda Duration",
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", "${MyFunction}", {"stat": "Average"}],
                  ["...", {"stat": "p99", "color": "#d62728"}],
                  ["...", {"stat": "Maximum", "color": "#ff7f0e"}]
                ],
                "period": 60,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "title": "Concurrent Executions",
                "metrics": [
                  ["AWS/Lambda", "ConcurrentExecutions", "FunctionName", "${MyFunction}", {"stat": "Maximum"}]
                ],
                "period": 60,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "title": "API Gateway Latency",
                "metrics": [
                  ["AWS/ApiGateway", "Latency", "ApiName", "MyApi", {"stat": "Average"}],
                  ["...", {"stat": "p99", "color": "#d62728"}]
                ],
                "period": 60,
                "region": "${AWS::Region}"
              }
            },
            {
              "type": "log",
              "x": 0,
              "y": 12,
              "width": 24,
              "height": 6,
              "properties": {
                "title": "Recent Errors",
                "query": "SOURCE '/aws/lambda/${MyFunction}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50",
                "region": "${AWS::Region}"
              }
            }
          ]
        }
```

### X-Ray Distributed Tracing

```javascript
// Enable X-Ray tracing
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Create custom subsegment for business logic
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('ProcessOrder');

  try {
    subsegment.addAnnotation('orderId', event.orderId);
    subsegment.addMetadata('orderDetails', event);

    // Database operations are automatically traced
    const result = await dynamodb.put({
      TableName: 'Orders',
      Item: {
        orderId: event.orderId,
        // ...
      }
    }).promise();

    subsegment.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};
```

## Cost Optimization

### Understanding Lambda Pricing

```
Lambda Pricing Components (US East - N. Virginia)

1. Request Charges:
   $0.20 per 1 million requests

2. Duration Charges (per GB-second):
   x86: $0.0000166667 per GB-second
   ARM64 (Graviton2): $0.0000133334 per GB-second (20% cheaper)

3. Provisioned Concurrency:
   $0.000004167 per GB-second of configured concurrency

Example Calculation:
- 10 million invocations/month
- 256MB memory
- 200ms average duration
- Using ARM64

Duration cost:
  10,000,000 * 0.2s * (256MB / 1024MB) * $0.0000133334
  = 10,000,000 * 0.2 * 0.25 * $0.0000133334
  = $6.67/month

Request cost:
  10,000,000 / 1,000,000 * $0.20
  = $2.00/month

Total: ~$8.67/month
```

### Cost Optimization Strategies

```javascript
// 1. Right-size memory allocation
// Use AWS Lambda Power Tuning to find optimal memory

// 2. Optimize function duration
// BAD: Sequential operations
async function processSequential(items) {
  for (const item of items) {
    await processItem(item);  // Slow
  }
}

// GOOD: Parallel operations
async function processParallel(items) {
  await Promise.all(items.map(item => processItem(item)));  // Fast
}

// 3. Use ARM64 architecture (20% cheaper)
// In serverless.yml:
// provider:
//   architecture: arm64

// 4. Implement caching to reduce invocations
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 });

async function getConfigWithCache() {
  const cached = cache.get('config');
  if (cached) return cached;

  const config = await fetchConfig();
  cache.set('config', config);
  return config;
}
```

```python
# Batch operations to reduce invocations
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Items')

def batch_write_items(items):
    """Write items in batches of 25 (DynamoDB limit)"""
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)
    # Much cheaper than individual put_item calls


# Use SQS batching
def lambda_handler(event, context):
    """Process up to 10 messages per invocation"""
    for record in event['Records']:
        process_message(record)
    # Single invocation handles multiple messages


# Implement request coalescing
from functools import lru_cache
import time

@lru_cache(maxsize=1000)
def get_user_cached(user_id, cache_time):
    """Cache results for 5 minutes"""
    return fetch_user_from_db(user_id)

def get_user(user_id):
    # Round time to 5-minute intervals for caching
    cache_time = int(time.time() / 300)
    return get_user_cached(user_id, cache_time)
```

### Cost Monitoring and Alerts

```yaml
# CloudWatch alarm for cost anomalies
Resources:
  LambdaCostAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Lambda-High-Invocations
      AlarmDescription: Alert when Lambda invocations spike unexpectedly
      MetricName: Invocations
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyFunction
      Statistic: Sum
      Period: 3600  # 1 hour
      EvaluationPeriods: 1
      Threshold: 100000  # Adjust based on normal traffic
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  # Monitor duration to detect performance degradation
  DurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Lambda-High-Duration
      MetricName: Duration
      Namespace: AWS/Lambda
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyFunction
      ExtendedStatistic: p99
      Period: 300
      EvaluationPeriods: 3
      Threshold: 5000  # 5 seconds
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic
```

## Best Practices Summary

### Development Best Practices

| Practice | Description |
|----------|-------------|
| Keep functions focused | Single responsibility principle - one function, one purpose |
| Externalize configuration | Use environment variables and Parameter Store |
| Initialize outside handler | Database connections, SDK clients belong outside the handler |
| Handle errors gracefully | Implement proper error handling and logging |
| Use structured logging | JSON logs with correlation IDs for traceability |
| Write idempotent handlers | Support safe retries for asynchronous invocations |

### Performance Best Practices

| Practice | Description |
|----------|-------------|
| Minimize package size | Remove unused dependencies, use layers for shared code |
| Use ARM64 | Better price-performance ratio |
| Optimize memory | Use Power Tuning to find optimal configuration |
| Implement connection pooling | Reuse database connections across invocations |
| Use caching | Cache frequently accessed data in memory |
| Prefer async operations | Use parallel processing where possible |

### Security Best Practices

```yaml
# Least privilege IAM example
Resources:
  MyFunctionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole

      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

      Policies:
        - PolicyName: MinimalDynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:UpdateItem
                  - dynamodb:Query
                Resource:
                  - !GetAtt MyTable.Arn
                  - !Sub '${MyTable.Arn}/index/*'
                Condition:
                  ForAllValues:StringEquals:
                    dynamodb:LeadingKeys:
                      - '${aws:userid}'  # Row-level security
```

## Interview Key Points

### Common Interview Questions

1. **What is a cold start and how do you mitigate it?**
   - Cold start is the initialization time when Lambda creates a new execution environment
   - Mitigation: Provisioned concurrency, smaller packages, optimize init code, ARM64 architecture

2. **How do you handle secrets in Lambda?**
   - Use AWS Secrets Manager or Parameter Store
   - Never hardcode secrets or store in environment variables unencrypted
   - Implement secrets rotation

3. **What are Lambda Layers and when would you use them?**
   - Shared code and dependencies across functions
   - Use for: common utilities, large dependencies, binary files
   - Benefits: smaller deployment packages, code reuse, easier updates

4. **How do you handle failures in asynchronous Lambda invocations?**
   - Configure retry behavior and DLQ (Dead Letter Queue)
   - Implement idempotent handlers
   - Use Lambda Destinations for success/failure routing

5. **What is the maximum execution time for Lambda?**
   - 15 minutes maximum
   - For longer tasks, consider Step Functions, Fargate, or breaking into smaller chunks

6. **How do you secure a Lambda function?**
   - IAM roles with least privilege
   - VPC for network isolation when needed
   - Secrets Manager for credentials
   - Input validation and sanitization
   - Enable AWS CloudTrail for audit logging

## Further Reading

### Official Documentation

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Lambda Power Tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)

### Best Practice Guides

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [AWS Well-Architected Serverless Lens](https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/)
- [Lambda Powertools](https://awslabs.github.io/aws-lambda-powertools-python/)

### Tools and Frameworks

- [AWS SAM CLI](https://github.com/aws/aws-sam-cli) - Build and test serverless applications locally
- [LocalStack](https://localstack.cloud/) - Local AWS cloud stack for development
- [Artillery](https://artillery.io/) - Load testing for serverless APIs
- [Lumigo](https://lumigo.io/) - Serverless monitoring and debugging
