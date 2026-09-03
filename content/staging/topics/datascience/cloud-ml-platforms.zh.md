---
title: ML工具生态：云ML平台
description: 掌握云ML平台：AWS SageMaker、GCP Vertex AI和Azure ML
track: datascience
section: deployment
difficulty: intermediate
tags:
  - SageMaker
  - Vertex AI
  - Azure ML
  - 云平台
status: imported
origin: old/src/content/docs/datascience/cloud-ml-platforms.zh.md
divergence: 0.148
issues: []
legacy:
  category: DataScience
  subcategory: Tools
  order: 46
  lastUpdated: 2026-01-07
---

云机器学习平台已成为现代AI开发的核心基础设施。本文将深入介绍主流云ML平台（AWS SageMaker、GCP Vertex AI、Azure Machine Learning和Databricks），帮助你掌握从模型训练到生产部署的完整工作流程。

## 云ML平台的价值

### 为什么需要云ML平台

传统的本地机器学习开发面临诸多挑战：

```
                        传统ML开发的痛点
+------------------------------------------------------------------+
|  基础设施管理          数据管理              模型运维              |
|  - GPU采购成本高       - 数据存储分散        - 部署流程复杂        |
|  - 资源利用率低        - 版本管理困难        - 扩展性差            |
|  - 环境配置复杂        - 数据安全难保障      - 监控能力弱          |
|  - 扩展困难            - 协作效率低          - 迭代周期长          |
+------------------------------------------------------------------+
```

**云ML平台解决的核心问题**：

| 问题领域 | 传统方式 | 云ML平台方案 |
|---------|---------|-------------|
| 计算资源 | 固定资产，前期投入大 | 按需付费，弹性伸缩 |
| 环境配置 | 手动安装，版本冲突 | 预配置镜像，一键启动 |
| 分布式训练 | 自建集群，运维复杂 | 托管服务，自动扩展 |
| 模型部署 | 手写服务，负载均衡 | 一键部署，自动扩缩 |
| 实验管理 | 手工记录，难以复现 | 自动追踪，版本控制 |
| 团队协作 | 代码/数据共享困难 | 统一平台，权限管理 |

### 云ML平台核心能力

```
                        云ML平台全景图
+------------------------------------------------------------------+
|                                                                  |
|  +------------+  +------------+  +------------+                  |
|  |  数据准备   | -> |  模型开发   | -> |  模型训练   |                  |
|  |  Data Prep |  |  Notebooks |  |  Training  |                  |
|  +------------+  +------------+  +------------+                  |
|        |               |               |                         |
|        v               v               v                         |
|  +------------+  +------------+  +------------+                  |
|  | 特征工程    |  | 实验追踪    |  | 超参优化    |                  |
|  | Feature    |  | Experiment |  | HPO        |                  |
|  | Store      |  | Tracking   |  |            |                  |
|  +------------+  +------------+  +------------+                  |
|        |               |               |                         |
|        +---------------+---------------+                         |
|                        v                                         |
|  +------------+  +------------+  +------------+                  |
|  | 模型注册    | -> |  模型部署   | -> |  模型监控   |                  |
|  | Registry   |  |  Serving   |  |  Monitoring|                  |
|  +------------+  +------------+  +------------+                  |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |                      MLOps Pipeline                       |   |
|  |        自动化训练 -> 自动化测试 -> 自动化部署              |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

## AWS SageMaker

### SageMaker 架构概览

Amazon SageMaker 是 AWS 提供的全托管机器学习服务，涵盖ML生命周期的各个阶段。

```
                      SageMaker 生态系统
+------------------------------------------------------------------+
|                                                                  |
|  开发工具层                                                       |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  | Studio    | | Notebooks | | Canvas    | | JumpStart |         |
|  | (IDE)     | | (Jupyter) | | (No-Code) | | (预训练)  |         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|                                                                  |
|  核心服务层                                                       |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  |Processing | | Training  | | Inference | | Pipelines |         |
|  |  Jobs     | |   Jobs    | | Endpoints | |  (MLOps)  |         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|                                                                  |
|  ML功能层                                                         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|  | Feature   | | Model     | | Clarify   | | Ground    |         |
|  | Store     | | Registry  | | (公平性)  | | Truth     |         |
|  +-----------+ +-----------+ +-----------+ +-----------+         |
|                                                                  |
|  基础设施层                                                       |
|  +----------------------------------------------------------+   |
|  |    S3 (存储)  |  EC2/GPU (计算)  |  VPC (网络)            |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### SageMaker 训练任务

#### 基础训练示例

```python
import sagemaker
from sagemaker.pytorch import PyTorch
from sagemaker.inputs import TrainingInput

# 初始化 SageMaker 会话
sagemaker_session = sagemaker.Session()
role = sagemaker.get_execution_role()
bucket = sagemaker_session.default_bucket()

# 定义 PyTorch 估计器
pytorch_estimator = PyTorch(
    entry_point='train.py',           # 训练脚本
    source_dir='./src',               # 源代码目录
    role=role,
    instance_count=1,
    instance_type='ml.p3.2xlarge',    # GPU实例
    framework_version='2.0.0',
    py_version='py310',

    # 超参数
    hyperparameters={
        'epochs': 100,
        'batch-size': 64,
        'learning-rate': 0.001,
        'model-type': 'resnet50'
    },

    # 实验追踪
    enable_sagemaker_metrics=True,
    metric_definitions=[
        {'Name': 'train:loss', 'Regex': 'train_loss: ([0-9\\.]+)'},
        {'Name': 'val:accuracy', 'Regex': 'val_accuracy: ([0-9\\.]+)'}
    ],

    # 检查点配置
    checkpoint_s3_uri=f's3://{bucket}/checkpoints/',
    checkpoint_local_path='/opt/ml/checkpoints',

    # 输出配置
    output_path=f's3://{bucket}/output/'
)

# 定义数据输入
train_input = TrainingInput(
    s3_data=f's3://{bucket}/data/train/',
    content_type='application/x-image',
    s3_data_type='S3Prefix',
    input_mode='File'  # 或 'Pipe' 用于流式处理
)

val_input = TrainingInput(
    s3_data=f's3://{bucket}/data/validation/',
    content_type='application/x-image'
)

# 启动训练
pytorch_estimator.fit(
    inputs={
        'train': train_input,
        'validation': val_input
    },
    job_name='pytorch-training-job',
    wait=True,  # 等待完成
    logs='All'  # 显示日志
)
```

#### 训练脚本示例 (train.py)

```python
import argparse
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, models
from torchvision.datasets import ImageFolder

def parse_args():
    parser = argparse.ArgumentParser()

    # 超参数
    parser.add_argument('--epochs', type=int, default=10)
    parser.add_argument('--batch-size', type=int, default=64)
    parser.add_argument('--learning-rate', type=float, default=0.001)
    parser.add_argument('--model-type', type=str, default='resnet50')

    # SageMaker 环境变量
    parser.add_argument('--model-dir', type=str,
                        default=os.environ.get('SM_MODEL_DIR', '/opt/ml/model'))
    parser.add_argument('--train', type=str,
                        default=os.environ.get('SM_CHANNEL_TRAIN', '/opt/ml/input/data/train'))
    parser.add_argument('--validation', type=str,
                        default=os.environ.get('SM_CHANNEL_VALIDATION', '/opt/ml/input/data/validation'))
    parser.add_argument('--num-gpus', type=int,
                        default=int(os.environ.get('SM_NUM_GPUS', 1)))

    return parser.parse_args()

def get_model(model_type, num_classes):
    """加载预训练模型"""
    if model_type == 'resnet50':
        model = models.resnet50(pretrained=True)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    elif model_type == 'efficientnet':
        model = models.efficientnet_b0(pretrained=True)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    return model

def train_epoch(model, train_loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = output.max(1)
        total += target.size(0)
        correct += predicted.eq(target).sum().item()

    return running_loss / len(train_loader), correct / total

def validate(model, val_loader, criterion, device):
    model.train(False)  # Set to inference mode
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for data, target in val_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            loss = criterion(output, target)

            running_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

    return running_loss / len(val_loader), correct / total

def main():
    args = parse_args()

    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    # 数据预处理
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])

    # 加载数据集
    train_dataset = ImageFolder(args.train, transform=transform)
    val_dataset = ImageFolder(args.validation, transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size,
                             shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size,
                           shuffle=False, num_workers=4, pin_memory=True)

    # 初始化模型
    num_classes = len(train_dataset.classes)
    model = get_model(args.model_type, num_classes)

    # 多GPU训练
    if args.num_gpus > 1:
        model = nn.DataParallel(model)
    model = model.to(device)

    # 优化器和损失函数
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=args.learning_rate)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # 训练循环
    best_acc = 0.0
    for epoch in range(args.epochs):
        train_loss, train_acc = train_epoch(model, train_loader, criterion,
                                           optimizer, device)
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()

        # 打印指标（SageMaker会解析这些日志）
        print(f"Epoch {epoch+1}/{args.epochs}")
        print(f"train_loss: {train_loss:.4f}, train_accuracy: {train_acc:.4f}")
        print(f"val_loss: {val_loss:.4f}, val_accuracy: {val_acc:.4f}")

        # 保存最佳模型
        if val_acc > best_acc:
            best_acc = val_acc
            save_model(model, args.model_dir, train_dataset.classes)

    print(f"Best validation accuracy: {best_acc:.4f}")

def save_model(model, model_dir, classes):
    """保存模型用于部署"""
    # 处理 DataParallel 包装
    model_to_save = model.module if hasattr(model, 'module') else model

    # 保存模型权重
    model_path = os.path.join(model_dir, 'model.pth')
    torch.save(model_to_save.state_dict(), model_path)

    # 保存类别映射
    import json
    classes_path = os.path.join(model_dir, 'classes.json')
    with open(classes_path, 'w') as f:
        json.dump(classes, f)

    print(f"Model saved to {model_dir}")

if __name__ == '__main__':
    main()
```

### SageMaker 分布式训练

#### 数据并行训练

```python
from sagemaker.pytorch import PyTorch
from sagemaker.inputs import TrainingInput

# 使用 SageMaker 分布式数据并行
pytorch_estimator = PyTorch(
    entry_point='train_distributed.py',
    source_dir='./src',
    role=role,
    instance_count=4,                  # 多节点
    instance_type='ml.p4d.24xlarge',   # 8 GPU/节点
    framework_version='2.0.0',
    py_version='py310',

    # 启用分布式训练
    distribution={
        'smdistributed': {
            'dataparallel': {
                'enabled': True,
                'custom_mpi_options': '-verbose -x NCCL_DEBUG=VERSION'
            }
        }
    },

    hyperparameters={
        'epochs': 100,
        'batch-size': 256,  # 全局batch size
        'learning-rate': 0.004,  # 根据GPU数量线性缩放
    }
)

# 启动训练
pytorch_estimator.fit({'train': train_input, 'validation': val_input})
```

#### 分布式训练脚本

```python
# train_distributed.py
import torch
import torch.distributed as dist
import smdistributed.dataparallel.torch.torch_smddp

def setup_distributed():
    """初始化分布式环境"""
    # SageMaker 数据并行会自动设置环境变量
    dist.init_process_group(backend='smddp')

    local_rank = int(os.environ.get('LOCAL_RANK', 0))
    world_size = dist.get_world_size()
    rank = dist.get_rank()

    torch.cuda.set_device(local_rank)

    return local_rank, world_size, rank

def main():
    local_rank, world_size, rank = setup_distributed()

    # 只在主进程打印
    if rank == 0:
        print(f"World size: {world_size}")

    # 创建模型并包装为DDP
    model = get_model(args.model_type, num_classes)
    model = model.to(local_rank)
    model = torch.nn.parallel.DistributedDataParallel(
        model,
        device_ids=[local_rank],
        output_device=local_rank
    )

    # 创建分布式采样器
    train_sampler = torch.utils.data.distributed.DistributedSampler(
        train_dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=args.batch_size // world_size,  # 每个GPU的batch
        sampler=train_sampler,
        num_workers=4,
        pin_memory=True
    )

    # 学习率线性缩放
    base_lr = args.learning_rate
    scaled_lr = base_lr * world_size
    optimizer = optim.AdamW(model.parameters(), lr=scaled_lr)

    # 训练循环
    for epoch in range(args.epochs):
        train_sampler.set_epoch(epoch)  # 确保每个epoch的shuffle不同
        train_epoch(model, train_loader, criterion, optimizer, local_rank)

        # 只在主进程保存模型
        if rank == 0:
            save_model(model, args.model_dir)

    # 清理
    dist.destroy_process_group()
```

### SageMaker 模型部署

#### 实时推理端点

```python
from sagemaker.pytorch import PyTorchModel
from sagemaker.serializers import JSONSerializer
from sagemaker.deserializers import JSONDeserializer

# 从训练任务获取模型
model_data = pytorch_estimator.model_data

# 或者指定S3路径
# model_data = f's3://{bucket}/output/pytorch-training-job/output/model.tar.gz'

# 创建模型
pytorch_model = PyTorchModel(
    model_data=model_data,
    role=role,
    entry_point='inference.py',     # 推理脚本
    source_dir='./src',
    framework_version='2.0.0',
    py_version='py310',

    # 模型环境变量
    env={
        'SAGEMAKER_MODEL_SERVER_WORKERS': '2',
        'SAGEMAKER_MODEL_SERVER_TIMEOUT': '60'
    }
)

# 部署到端点
predictor = pytorch_model.deploy(
    instance_type='ml.g4dn.xlarge',
    initial_instance_count=1,
    endpoint_name='image-classifier-endpoint',

    # 配置序列化
    serializer=JSONSerializer(),
    deserializer=JSONDeserializer(),

    # 数据捕获（用于模型监控）
    data_capture_config=DataCaptureConfig(
        enable_capture=True,
        sampling_percentage=20,
        destination_s3_uri=f's3://{bucket}/data-capture/'
    )
)

# 进行预测
import base64

with open('test_image.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode('utf-8')

response = predictor.predict({
    'image': image_data,
    'return_probs': True
})

print(f"Predicted class: {response['class']}")
print(f"Confidence: {response['confidence']:.4f}")
```

#### 推理脚本 (inference.py)

```python
import os
import json
import base64
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io

# 全局变量用于模型缓存
model = None
classes = None
device = None
transform = None

def model_fn(model_dir):
    """加载模型"""
    global model, classes, device, transform

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # 加载类别映射
    with open(os.path.join(model_dir, 'classes.json'), 'r') as f:
        classes = json.load(f)

    # 初始化模型
    num_classes = len(classes)
    model = models.resnet50(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, num_classes)

    # 加载权重
    model_path = os.path.join(model_dir, 'model.pth')
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.train(False)  # Set to inference mode

    # 预处理转换
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])

    return model

def input_fn(request_body, request_content_type):
    """处理输入数据"""
    if request_content_type == 'application/json':
        data = json.loads(request_body)

        # 解码Base64图像
        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data)).convert('RGB')

        # 应用预处理
        tensor = transform(image).unsqueeze(0)

        return {'tensor': tensor, 'return_probs': data.get('return_probs', False)}

    raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    """执行推理"""
    tensor = input_data['tensor'].to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = probabilities.max(1)

    return {
        'predicted': predicted.item(),
        'confidence': confidence.item(),
        'probabilities': probabilities[0].tolist() if input_data['return_probs'] else None
    }

def output_fn(prediction, response_content_type):
    """格式化输出"""
    if response_content_type == 'application/json':
        result = {
            'class': classes[prediction['predicted']],
            'confidence': prediction['confidence']
        }
        if prediction['probabilities']:
            result['probabilities'] = {
                classes[i]: prob
                for i, prob in enumerate(prediction['probabilities'])
            }
        return json.dumps(result)

    raise ValueError(f"Unsupported response type: {response_content_type}")
```

#### 自动扩缩容配置

```python
import boto3

# 配置自动扩缩
autoscaling = boto3.client('application-autoscaling')

# 注册可扩缩目标
autoscaling.register_scalable_target(
    ServiceNamespace='sagemaker',
    ResourceId=f'endpoint/{endpoint_name}/variant/AllTraffic',
    ScalableDimension='sagemaker:variant:DesiredInstanceCount',
    MinCapacity=1,
    MaxCapacity=10
)

# 配置目标跟踪策略
autoscaling.put_scaling_policy(
    PolicyName='InvocationsPerInstance',
    ServiceNamespace='sagemaker',
    ResourceId=f'endpoint/{endpoint_name}/variant/AllTraffic',
    ScalableDimension='sagemaker:variant:DesiredInstanceCount',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'TargetValue': 1000.0,  # 每实例每分钟的调用次数
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'SageMakerVariantInvocationsPerInstance'
        },
        'ScaleInCooldown': 300,
        'ScaleOutCooldown': 60
    }
)
```

### SageMaker Pipelines (MLOps)

```python
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import ProcessingStep, TrainingStep, CreateModelStep
from sagemaker.workflow.step_collections import RegisterModel
from sagemaker.workflow.parameters import ParameterInteger, ParameterFloat, ParameterString
from sagemaker.workflow.conditions import ConditionGreaterThanOrEqualTo
from sagemaker.workflow.condition_step import ConditionStep
from sagemaker.workflow.functions import JsonGet
from sagemaker.processing import ProcessingInput, ProcessingOutput
from sagemaker.sklearn.processing import SKLearnProcessor

# 定义Pipeline参数
instance_type = ParameterString(name="TrainingInstanceType", default_value="ml.p3.2xlarge")
instance_count = ParameterInteger(name="TrainingInstanceCount", default_value=1)
learning_rate = ParameterFloat(name="LearningRate", default_value=0.001)
model_approval_status = ParameterString(name="ModelApprovalStatus", default_value="PendingManualApproval")

# Step 1: 数据预处理
sklearn_processor = SKLearnProcessor(
    framework_version='1.0-1',
    role=role,
    instance_type='ml.m5.xlarge',
    instance_count=1
)

processing_step = ProcessingStep(
    name="PreprocessData",
    processor=sklearn_processor,
    inputs=[
        ProcessingInput(
            source=f's3://{bucket}/raw-data/',
            destination='/opt/ml/processing/input'
        )
    ],
    outputs=[
        ProcessingOutput(
            output_name='train',
            source='/opt/ml/processing/output/train',
            destination=f's3://{bucket}/processed-data/train/'
        ),
        ProcessingOutput(
            output_name='validation',
            source='/opt/ml/processing/output/validation',
            destination=f's3://{bucket}/processed-data/validation/'
        ),
        ProcessingOutput(
            output_name='test',
            source='/opt/ml/processing/output/test',
            destination=f's3://{bucket}/processed-data/test/'
        )
    ],
    code='preprocessing.py'
)

# Step 2: 模型训练
from sagemaker.pytorch import PyTorch
from sagemaker.inputs import TrainingInput

pytorch_estimator = PyTorch(
    entry_point='train.py',
    source_dir='./src',
    role=role,
    instance_count=instance_count,
    instance_type=instance_type,
    framework_version='2.0.0',
    py_version='py310',
    hyperparameters={
        'epochs': 50,
        'batch-size': 64,
        'learning-rate': learning_rate
    }
)

training_step = TrainingStep(
    name="TrainModel",
    estimator=pytorch_estimator,
    inputs={
        'train': TrainingInput(
            s3_data=processing_step.properties.ProcessingOutputConfig.Outputs['train'].S3Output.S3Uri,
            content_type='application/x-image'
        ),
        'validation': TrainingInput(
            s3_data=processing_step.properties.ProcessingOutputConfig.Outputs['validation'].S3Output.S3Uri,
            content_type='application/x-image'
        )
    }
)

# Step 3: 模型验证
from sagemaker.processing import ScriptProcessor

validation_processor = ScriptProcessor(
    image_uri=sagemaker.image_uris.retrieve('pytorch', region, version='2.0.0-cpu-py310'),
    role=role,
    instance_type='ml.m5.xlarge',
    instance_count=1,
    command=['python3']
)

validation_step = ProcessingStep(
    name="ValidateModel",
    processor=validation_processor,
    inputs=[
        ProcessingInput(
            source=training_step.properties.ModelArtifacts.S3ModelArtifacts,
            destination='/opt/ml/processing/model'
        ),
        ProcessingInput(
            source=processing_step.properties.ProcessingOutputConfig.Outputs['test'].S3Output.S3Uri,
            destination='/opt/ml/processing/test'
        )
    ],
    outputs=[
        ProcessingOutput(
            output_name='metrics',
            source='/opt/ml/processing/metrics',
            destination=f's3://{bucket}/metrics/'
        )
    ],
    code='validate_model.py',
    property_files=[
        PropertyFile(
            name="ValidationReport",
            output_name="metrics",
            path="metrics.json"
        )
    ]
)

# Step 4: 条件检查（模型性能达标才注册）
condition = ConditionGreaterThanOrEqualTo(
    left=JsonGet(
        step_name=validation_step.name,
        property_file="ValidationReport",
        json_path="metrics.accuracy"
    ),
    right=0.9  # 准确率阈值
)

# Step 5: 模型注册
from sagemaker.model_metrics import MetricsSource, ModelMetrics

model_metrics = ModelMetrics(
    model_statistics=MetricsSource(
        s3_uri=f'{validation_step.properties.ProcessingOutputConfig.Outputs["metrics"].S3Output.S3Uri}/metrics.json',
        content_type='application/json'
    )
)

register_step = RegisterModel(
    name="RegisterModel",
    estimator=pytorch_estimator,
    model_data=training_step.properties.ModelArtifacts.S3ModelArtifacts,
    content_types=['application/json'],
    response_types=['application/json'],
    inference_instances=['ml.g4dn.xlarge', 'ml.p3.2xlarge'],
    transform_instances=['ml.m5.xlarge'],
    model_package_group_name='image-classifier-models',
    approval_status=model_approval_status,
    model_metrics=model_metrics
)

# 条件步骤
condition_step = ConditionStep(
    name="CheckAccuracy",
    conditions=[condition],
    if_steps=[register_step],
    else_steps=[]  # 如果不达标则跳过注册
)

# 创建Pipeline
pipeline = Pipeline(
    name="ImageClassifierPipeline",
    parameters=[
        instance_type,
        instance_count,
        learning_rate,
        model_approval_status
    ],
    steps=[
        processing_step,
        training_step,
        validation_step,
        condition_step
    ],
    sagemaker_session=sagemaker_session
)

# 提交Pipeline
pipeline.upsert(role_arn=role)

# 执行Pipeline
execution = pipeline.start(
    parameters={
        'TrainingInstanceType': 'ml.p3.2xlarge',
        'LearningRate': 0.001
    }
)

# 查看执行状态
execution.describe()
execution.wait()
```

## GCP Vertex AI

### Vertex AI 架构

Google Cloud Vertex AI 整合了Google的AI能力，提供统一的ML平台。

```
                        Vertex AI 架构
+------------------------------------------------------------------+
|                                                                  |
|  +----------------------------------------------------------+   |
|  |                    Vertex AI Workbench                    |   |
|  |         (托管Jupyter Notebooks + IDE)                     |   |
|  +----------------------------------------------------------+   |
|                              |                                   |
|  +-----------+-----------+---+-----------+-----------+          |
|  | AutoML    |  Custom   |   预训练API   |  生成式AI  |          |
|  | (无代码ML)|  Training |   (Vision等)  |  (PaLM等)  |          |
|  +-----------+-----------+---------------+-----------+          |
|                              |                                   |
|  +----------------------------------------------------------+   |
|  |                    Vertex AI Pipelines                    |   |
|  |         (Kubeflow Pipelines 托管服务)                     |   |
|  +----------------------------------------------------------+   |
|                              |                                   |
|  +-----------+-----------+---+-----------+-----------+          |
|  | Feature   |  Model    |   Endpoint    |  监控与    |          |
|  | Store     |  Registry |   Serving     |  解释      |          |
|  +-----------+-----------+---------------+-----------+          |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |  GCS (存储) | Compute Engine/GKE | BigQuery | TPU/GPU     |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### Vertex AI 自定义训练

```python
from google.cloud import aiplatform

# 初始化
aiplatform.init(
    project='my-gcp-project',
    location='us-central1',
    staging_bucket='gs://my-staging-bucket'
)

# 定义自定义训练任务
custom_job = aiplatform.CustomTrainingJob(
    display_name='pytorch-image-classifier',
    script_path='train.py',
    container_uri='us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-0:latest',
    requirements=['pillow', 'albumentations'],
    model_serving_container_image_uri='us-docker.pkg.dev/vertex-ai/prediction/pytorch-gpu.2-0:latest'
)

# 运行训练
model = custom_job.run(
    # 数据集
    dataset=None,  # 使用GCS路径代替

    # 计算资源
    replica_count=1,
    machine_type='n1-standard-8',
    accelerator_type='NVIDIA_TESLA_T4',
    accelerator_count=1,

    # 超参数
    args=[
        '--train-dir=gs://my-bucket/data/train',
        '--val-dir=gs://my-bucket/data/validation',
        '--epochs=50',
        '--batch-size=64',
        '--learning-rate=0.001'
    ],

    # 输出
    model_display_name='image-classifier-v1',
    base_output_dir='gs://my-bucket/output/'
)

print(f"Model resource name: {model.resource_name}")
```

### Vertex AI 分布式训练

```python
from google.cloud import aiplatform
from google.cloud.aiplatform import hyperparameter_tuning as hpt

# 定义工作池规格
worker_pool_specs = [
    # 主节点
    {
        'machine_spec': {
            'machine_type': 'n1-standard-16',
            'accelerator_type': 'NVIDIA_TESLA_V100',
            'accelerator_count': 4
        },
        'replica_count': 1,
        'container_spec': {
            'image_uri': 'us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-0:latest',
            'command': ['python', '-m', 'torch.distributed.launch'],
            'args': [
                '--nproc_per_node=4',
                '--nnodes=2',
                '--node_rank=0',
                '--master_addr=$CLUSTER_SPEC_ENV',
                '--master_port=1234',
                'train_distributed.py',
                '--train-dir=gs://my-bucket/data/train',
                '--epochs=100',
                '--batch-size=256'
            ]
        }
    },
    # 工作节点
    {
        'machine_spec': {
            'machine_type': 'n1-standard-16',
            'accelerator_type': 'NVIDIA_TESLA_V100',
            'accelerator_count': 4
        },
        'replica_count': 1,
        'container_spec': {
            'image_uri': 'us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-0:latest',
            'command': ['python', '-m', 'torch.distributed.launch'],
            'args': [
                '--nproc_per_node=4',
                '--nnodes=2',
                '--node_rank=1',
                '--master_addr=$CLUSTER_SPEC_ENV',
                '--master_port=1234',
                'train_distributed.py',
                '--train-dir=gs://my-bucket/data/train',
                '--epochs=100',
                '--batch-size=256'
            ]
        }
    }
]

# 创建自定义任务
custom_job = aiplatform.CustomJob(
    display_name='distributed-pytorch-training',
    worker_pool_specs=worker_pool_specs,
    base_output_dir='gs://my-bucket/distributed-output/'
)

# 运行
custom_job.run(
    service_account='my-training-sa@my-project.iam.gserviceaccount.com',
    tensorboard='projects/my-project/locations/us-central1/tensorboards/123456',
    sync=True
)
```

### Vertex AI 超参数调优

```python
from google.cloud import aiplatform
from google.cloud.aiplatform import hyperparameter_tuning as hpt

# 定义超参数搜索空间
parameter_spec = {
    'learning_rate': hpt.DoubleParameterSpec(min=0.0001, max=0.1, scale='log'),
    'batch_size': hpt.DiscreteParameterSpec(values=[32, 64, 128, 256], scale='linear'),
    'num_layers': hpt.IntegerParameterSpec(min=2, max=6, scale='linear'),
    'dropout_rate': hpt.DoubleParameterSpec(min=0.1, max=0.5, scale='linear'),
    'optimizer': hpt.CategoricalParameterSpec(values=['adam', 'sgd', 'adamw'])
}

# 定义优化目标
metric_spec = {
    'val_accuracy': 'maximize'
}

# 创建超参数调优任务
hp_job = aiplatform.HyperparameterTuningJob(
    display_name='hpo-image-classifier',
    custom_job=custom_job,  # 上面定义的训练任务
    metric_spec=metric_spec,
    parameter_spec=parameter_spec,
    max_trial_count=50,
    parallel_trial_count=5,
    search_algorithm='RANDOM_SEARCH',  # 或 'GRID_SEARCH'
    max_failed_trial_count=10
)

# 运行超参数调优
hp_job.run(sync=True)

# 获取最佳超参数
best_trial = hp_job.trials[0]
print(f"Best accuracy: {best_trial.final_measurement.metrics[0].value}")
print(f"Best hyperparameters: {best_trial.parameters}")
```

### Vertex AI 模型部署

```python
from google.cloud import aiplatform

# 上传模型到 Model Registry
model = aiplatform.Model.upload(
    display_name='image-classifier-v1',
    artifact_uri='gs://my-bucket/output/model/',
    serving_container_image_uri='us-docker.pkg.dev/vertex-ai/prediction/pytorch-gpu.2-0:latest',
    serving_container_predict_route='/predict',
    serving_container_health_route='/health',
    serving_container_ports=[8080]
)

# 创建端点
endpoint = aiplatform.Endpoint.create(
    display_name='image-classifier-endpoint',
    description='Production endpoint for image classification'
)

# 部署模型
model.deploy(
    endpoint=endpoint,
    machine_type='n1-standard-4',
    accelerator_type='NVIDIA_TESLA_T4',
    accelerator_count=1,
    min_replica_count=1,
    max_replica_count=10,

    # 流量分配
    traffic_percentage=100,

    # 自动扩缩
    autoscaling_target_cpu_utilization=70,

    # 日志
    enable_access_logging=True,

    # 部署超时
    deploy_request_timeout=1800
)

# 进行预测
import base64
from google.cloud import aiplatform

endpoint = aiplatform.Endpoint('projects/my-project/locations/us-central1/endpoints/123456')

# 准备输入数据
with open('test_image.jpg', 'rb') as f:
    image_bytes = f.read()

instances = [{
    'image_bytes': {
        'b64': base64.b64encode(image_bytes).decode('utf-8')
    }
}]

# 预测
predictions = endpoint.predict(instances=instances)
print(predictions)
```

### Vertex AI Pipelines

```python
from kfp import dsl
from kfp.v2 import compiler
from kfp.v2.dsl import component, Input, Output, Dataset, Model, Metrics
from google.cloud import aiplatform

# 定义组件

@component(
    base_image='python:3.10',
    packages_to_install=['pandas', 'scikit-learn', 'google-cloud-storage']
)
def preprocess_data(
    input_data_path: str,
    output_train_path: Output[Dataset],
    output_test_path: Output[Dataset],
    test_split_ratio: float = 0.2
):
    """数据预处理组件"""
    import pandas as pd
    from sklearn.model_selection import train_test_split

    # 下载和处理数据
    # ... 数据处理逻辑

    # 划分数据集
    train_data, test_data = train_test_split(data, test_size=test_split_ratio)

    # 保存结果
    train_data.to_csv(output_train_path.path, index=False)
    test_data.to_csv(output_test_path.path, index=False)


@component(
    base_image='us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-0:latest',
    packages_to_install=['pillow']
)
def train_model(
    train_data: Input[Dataset],
    val_data: Input[Dataset],
    epochs: int,
    learning_rate: float,
    model_output: Output[Model],
    metrics: Output[Metrics]
):
    """模型训练组件"""
    import torch

    # 训练逻辑
    # ...

    # 保存模型
    torch.save(model.state_dict(), f'{model_output.path}/model.pth')

    # 记录指标
    metrics.log_metric('accuracy', val_accuracy)
    metrics.log_metric('loss', val_loss)


# 定义 Pipeline
@dsl.pipeline(
    name='ml-training-pipeline',
    description='End-to-end ML training pipeline'
)
def ml_pipeline(
    input_data_path: str,
    epochs: int = 50,
    learning_rate: float = 0.001,
    project: str = 'my-project',
    location: str = 'us-central1'
):
    # 数据预处理
    preprocess_task = preprocess_data(
        input_data_path=input_data_path
    )

    # 模型训练
    train_task = train_model(
        train_data=preprocess_task.outputs['output_train_path'],
        val_data=preprocess_task.outputs['output_test_path'],
        epochs=epochs,
        learning_rate=learning_rate
    )


# 编译 Pipeline
compiler.Compiler().compile(
    pipeline_func=ml_pipeline,
    package_path='ml_pipeline.json'
)

# 提交 Pipeline
aiplatform.init(project='my-project', location='us-central1')

job = aiplatform.PipelineJob(
    display_name='training-pipeline-run',
    template_path='ml_pipeline.json',
    pipeline_root='gs://my-bucket/pipeline-root/',
    parameter_values={
        'input_data_path': 'gs://my-bucket/raw-data/',
        'epochs': 100,
        'learning_rate': 0.001
    },
    enable_caching=True
)

job.run(
    service_account='pipeline-sa@my-project.iam.gserviceaccount.com',
    sync=True
)
```

## Azure Machine Learning

### Azure ML 架构

```
                    Azure Machine Learning
+------------------------------------------------------------------+
|                                                                  |
|  +----------------------------------------------------------+   |
|  |                    Azure ML Studio                        |   |
|  |         (可视化界面 + Designer 拖拽式建模)                |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +-----------+-----------+-----------+-----------+              |
|  | Notebooks | AutoML    | Designer  | Labeling  |              |
|  | (Jupyter) | (自动ML)  | (可视化)  | (数据标注)|              |
|  +-----------+-----------+-----------+-----------+              |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |                    Azure ML SDK v2                        |   |
|  |         (Python SDK + CLI v2)                             |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +-----------+-----------+-----------+-----------+              |
|  | Compute   | Data      | Model     | Endpoints |              |
|  | (计算集群)| (数据资产)| (模型注册)| (部署端点)|              |
|  +-----------+-----------+-----------+-----------+              |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |  Azure Storage | AKS | Container Registry | Key Vault     |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
```

### Azure ML SDK v2 训练

```python
from azure.ai.ml import MLClient, command, Input, Output
from azure.ai.ml.entities import Environment, AmlCompute
from azure.identity import DefaultAzureCredential

# 初始化客户端
credential = DefaultAzureCredential()
ml_client = MLClient(
    credential=credential,
    subscription_id='your-subscription-id',
    resource_group_name='your-resource-group',
    workspace_name='your-workspace'
)

# 创建或获取计算集群
try:
    compute = ml_client.compute.get('gpu-cluster')
except:
    compute = AmlCompute(
        name='gpu-cluster',
        type='amlcompute',
        size='Standard_NC6s_v3',  # GPU实例
        min_instances=0,
        max_instances=4,
        idle_time_before_scale_down=120
    )
    ml_client.compute.begin_create_or_update(compute).result()

# 定义环境
env = Environment(
    name='pytorch-training-env',
    conda_file='environment.yml',
    image='mcr.microsoft.com/azureml/openmpi4.1.0-cuda11.8-cudnn8-ubuntu22.04'
)

# 定义训练任务
training_job = command(
    code='./src',
    command='python train.py '
            '--train-dir ${{inputs.train_data}} '
            '--val-dir ${{inputs.val_data}} '
            '--output-dir ${{outputs.model}} '
            '--epochs ${{inputs.epochs}} '
            '--batch-size ${{inputs.batch_size}} '
            '--learning-rate ${{inputs.learning_rate}}',

    # 输入
    inputs={
        'train_data': Input(
            type='uri_folder',
            path='azureml://datastores/workspaceblobstore/paths/data/train/'
        ),
        'val_data': Input(
            type='uri_folder',
            path='azureml://datastores/workspaceblobstore/paths/data/validation/'
        ),
        'epochs': 50,
        'batch_size': 64,
        'learning_rate': 0.001
    },

    # 输出
    outputs={
        'model': Output(
            type='uri_folder',
            path='azureml://datastores/workspaceblobstore/paths/output/model/'
        )
    },

    # 计算资源
    compute='gpu-cluster',
    instance_count=1,

    # 环境
    environment=env,

    # 实验设置
    experiment_name='image-classification',
    display_name='pytorch-training-run',

    # 分布式训练配置（可选）
    distribution={
        'type': 'PyTorch',
        'process_count_per_instance': 1
    }
)

# 提交任务
returned_job = ml_client.jobs.create_or_update(training_job)
print(f"Job submitted: {returned_job.name}")

# 等待完成
ml_client.jobs.stream(returned_job.name)
```

### Azure ML 超参数调优

```python
from azure.ai.ml import command
from azure.ai.ml.sweep import Choice, Uniform, LogUniform, BanditPolicy

# 定义基础训练命令
training_command = command(
    code='./src',
    command='python train.py '
            '--train-dir ${{inputs.train_data}} '
            '--epochs ${{inputs.epochs}} '
            '--batch-size ${{search_space.batch_size}} '
            '--learning-rate ${{search_space.learning_rate}} '
            '--dropout ${{search_space.dropout}} '
            '--optimizer ${{search_space.optimizer}}',

    inputs={
        'train_data': Input(type='uri_folder', path='azureml:training-data@latest'),
        'epochs': 50
    },

    compute='gpu-cluster',
    environment=env
)

# 配置超参数搜索
sweep_job = training_command.sweep(
    # 搜索空间
    search_space={
        'batch_size': Choice(values=[32, 64, 128, 256]),
        'learning_rate': LogUniform(min_value=-5, max_value=-2),  # 10^-5 到 10^-2
        'dropout': Uniform(min_value=0.1, max_value=0.5),
        'optimizer': Choice(values=['adam', 'sgd', 'adamw'])
    },

    # 采样方法
    sampling_algorithm='bayesian',  # 或 'random', 'grid'

    # 优化目标
    primary_metric='val_accuracy',
    goal='maximize',

    # 限制
    max_total_trials=50,
    max_concurrent_trials=5,
    timeout=43200,  # 12小时

    # 早停策略
    early_termination=BanditPolicy(
        slack_factor=0.2,
        evaluation_interval=10,
        delay_evaluation=20
    )
)

# 提交超参数调优任务
returned_sweep = ml_client.jobs.create_or_update(sweep_job)
print(f"Sweep job: {returned_sweep.name}")
```

### Azure ML 模型部署

```python
from azure.ai.ml.entities import (
    ManagedOnlineEndpoint,
    ManagedOnlineDeployment,
    Model,
    Environment,
    CodeConfiguration
)

# 注册模型
model = Model(
    path='./model/',
    name='image-classifier',
    description='Image classification model trained with PyTorch',
    type='custom_model'
)
registered_model = ml_client.models.create_or_update(model)

# 创建端点
endpoint = ManagedOnlineEndpoint(
    name='image-classifier-endpoint',
    description='Production endpoint for image classification',
    auth_mode='key'
)
ml_client.online_endpoints.begin_create_or_update(endpoint).result()

# 定义推理环境
inference_env = Environment(
    name='inference-env',
    conda_file='inference_environment.yml',
    image='mcr.microsoft.com/azureml/openmpi4.1.0-cuda11.8-cudnn8-ubuntu22.04'
)

# 创建部署
deployment = ManagedOnlineDeployment(
    name='blue',
    endpoint_name='image-classifier-endpoint',
    model=registered_model,

    # 推理代码
    code_configuration=CodeConfiguration(
        code='./inference/',
        scoring_script='score.py'
    ),

    environment=inference_env,

    # 实例配置
    instance_type='Standard_NC6s_v3',
    instance_count=1,

    # 请求设置
    request_settings={
        'request_timeout_ms': 60000,
        'max_concurrent_requests_per_instance': 10,
        'max_queue_wait_ms': 60000
    }
)

ml_client.online_deployments.begin_create_or_update(deployment).result()

# 设置流量
endpoint.traffic = {'blue': 100}
ml_client.online_endpoints.begin_create_or_update(endpoint).result()
```

## Databricks ML

### Databricks ML 架构

```
                      Databricks ML 平台
+------------------------------------------------------------------+
|                                                                  |
|  +----------------------------------------------------------+   |
|  |               Databricks Workspace                        |   |
|  |    (Notebooks + Repos + Jobs + SQL)                       |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +-----------+-----------+-----------+-----------+              |
|  | MLflow    | Feature   | Model     | AutoML    |              |
|  | Tracking  | Store     | Serving   |           |              |
|  +-----------+-----------+-----------+-----------+              |
|                                                                  |
|  +----------------------------------------------------------+   |
|  |                 Unity Catalog                             |   |
|  |         (统一数据治理 + 模型治理)                         |   |
|  +----------------------------------------------------------+   |
|                                                                  |
|  +-----------+-----------+-----------+-----------+              |
|  | Delta Lake| Spark     | Photon    | GPU集群   |              |
|  | (存储层)  | (计算引擎)| (加速引擎)| (深度学习)|              |
|  +-----------+-----------+-----------+-----------+              |
+------------------------------------------------------------------+
```

### MLflow 实验追踪

```python
import mlflow
import mlflow.pytorch
from mlflow.tracking import MlflowClient

# 设置实验
mlflow.set_experiment('/Users/username/image-classification')

# 开始实验运行
with mlflow.start_run(run_name='pytorch-resnet50') as run:
    # 记录参数
    mlflow.log_params({
        'epochs': 50,
        'batch_size': 64,
        'learning_rate': 0.001,
        'model_type': 'resnet50',
        'optimizer': 'AdamW'
    })

    # 训练模型
    model = train_model(config)

    # 记录指标
    for epoch in range(epochs):
        train_loss, train_acc = train_epoch(model, train_loader)
        val_loss, val_acc = validate_model(model, val_loader)

        mlflow.log_metrics({
            'train_loss': train_loss,
            'train_accuracy': train_acc,
            'val_loss': val_loss,
            'val_accuracy': val_acc
        }, step=epoch)

    # 记录模型
    mlflow.pytorch.log_model(
        model,
        'model',
        registered_model_name='image-classifier',
        signature=mlflow.models.signature.infer_signature(
            sample_input,
            model(sample_input)
        ),
        input_example=sample_input
    )

    # 记录额外工件
    mlflow.log_artifact('confusion_matrix.png')
    mlflow.log_artifact('training_curves.png')

print(f"Run ID: {run.info.run_id}")
```

### Databricks Feature Store

```python
from databricks.feature_store import FeatureStoreClient
from pyspark.sql import functions as F

fs = FeatureStoreClient()

# 计算用户特征
def compute_user_features(events_df):
    return (
        events_df
        .groupBy('user_id')
        .agg(
            F.count('*').alias('total_events'),
            F.countDistinct('session_id').alias('num_sessions'),
            F.avg('event_value').alias('avg_event_value'),
            F.max('timestamp').alias('last_event_time'),
            F.min('timestamp').alias('first_event_time')
        )
        .withColumn('days_since_first_event',
                   F.datediff(F.current_date(), 'first_event_time'))
        .withColumn('avg_events_per_session',
                   F.col('total_events') / F.col('num_sessions'))
    )

# 注册特征表
fs.create_table(
    name='ml_features.user_features',
    primary_keys=['user_id'],
    df=compute_user_features(spark.table('events')),
    description='User behavior features'
)

# 创建训练数据集
from databricks.feature_store import FeatureLookup

training_set = fs.create_training_set(
    df=spark.table('training_labels'),  # 包含 user_id 和标签
    feature_lookups=[
        FeatureLookup(
            table_name='ml_features.user_features',
            feature_names=['total_events', 'num_sessions', 'avg_event_value'],
            lookup_key='user_id'
        )
    ],
    label='label',
    exclude_columns=['user_id']
)

# 获取训练数据
training_df = training_set.load_df()
```

### Databricks 分布式训练

```python
from pyspark.ml.torch.distributor import TorchDistributor
import torch
import torch.nn as nn
import torch.distributed as dist

def train_distributed(num_gpus_per_node, num_nodes):
    """分布式训练函数"""
    # 初始化分布式环境
    dist.init_process_group(backend='nccl')
    local_rank = int(os.environ['LOCAL_RANK'])
    global_rank = dist.get_rank()
    world_size = dist.get_world_size()

    torch.cuda.set_device(local_rank)

    # 创建模型
    model = create_model()
    model = model.to(local_rank)
    model = nn.parallel.DistributedDataParallel(model, device_ids=[local_rank])

    # 创建数据加载器
    train_sampler = torch.utils.data.distributed.DistributedSampler(
        train_dataset, num_replicas=world_size, rank=global_rank
    )
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size_per_gpu,
        sampler=train_sampler, num_workers=4
    )

    # 训练循环
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate * world_size)

    for epoch in range(epochs):
        train_sampler.set_epoch(epoch)

        for batch in train_loader:
            loss = train_step(model, batch)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # 只在主进程记录
        if global_rank == 0:
            mlflow.log_metric('loss', loss.item(), step=epoch)

    # 返回模型（只从主进程返回）
    if global_rank == 0:
        return model.module
    return None

# 使用 TorchDistributor 启动分布式训练
with mlflow.start_run():
    distributor = TorchDistributor(
        num_processes=8,  # 总GPU数
        local_mode=False,
        use_gpu=True
    )

    model = distributor.run(train_distributed, num_gpus_per_node=4, num_nodes=2)

    if model is not None:
        mlflow.pytorch.log_model(model, 'model')
```

### Databricks Model Serving

```python
import mlflow
from mlflow.deployments import get_deploy_client

# 获取模型版本
client = mlflow.tracking.MlflowClient()
model_version = client.get_latest_versions('image-classifier', stages=['Production'])[0]

# 创建模型服务端点
deploy_client = get_deploy_client('databricks')

endpoint = deploy_client.create_endpoint(
    name='image-classifier-endpoint',
    config={
        'served_models': [{
            'model_name': 'image-classifier',
            'model_version': model_version.version,
            'workload_size': 'Small',
            'scale_to_zero_enabled': True
        }],
        'traffic_config': {
            'routes': [{
                'served_model_name': f'image-classifier-{model_version.version}',
                'traffic_percentage': 100
            }]
        }
    }
)

# 调用端点
import requests

endpoint_url = f"https://{workspace_url}/serving-endpoints/image-classifier-endpoint/invocations"
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    'inputs': [{
        'image': base64_encoded_image
    }]
}

response = requests.post(endpoint_url, headers=headers, json=data)
print(response.json())
```

## 平台对比与选择

### 功能对比

| 功能 | SageMaker | Vertex AI | Azure ML | Databricks |
|------|-----------|-----------|----------|------------|
| **托管Notebooks** | Studio Notebooks | Workbench | Notebooks | Notebooks |
| **AutoML** | Autopilot | AutoML | AutoML | AutoML |
| **分布式训练** | 原生支持 | 原生支持 | 原生支持 | TorchDistributor |
| **超参数调优** | 原生HPO | 原生HPO | HyperDrive | Hyperopt |
| **特征存储** | Feature Store | Feature Store | Feature Store | Feature Store |
| **模型注册** | Model Registry | Model Registry | Model Registry | MLflow Registry |
| **实时推理** | Endpoints | Endpoints | Online Endpoints | Model Serving |
| **批量推理** | Batch Transform | Batch Prediction | Batch Endpoints | Spark推理 |
| **MLOps Pipeline** | Pipelines | Pipelines | Pipelines | Jobs/Workflows |
| **实验追踪** | Experiments | Experiments | Experiments | MLflow |
| **模型监控** | Model Monitor | Model Monitoring | 数据漂移检测 | Lakehouse Monitoring |

### 定价对比

| 服务 | 计费模式 | GPU训练成本(参考) | 推理成本(参考) |
|------|---------|------------------|---------------|
| **SageMaker** | 按实例小时 | ml.p3.2xlarge: ~$3.8/h | ml.g4dn.xlarge: ~$0.7/h |
| **Vertex AI** | 按节点小时 | n1-standard-8 + T4: ~$1.2/h | n1-standard-4 + T4: ~$0.8/h |
| **Azure ML** | 按VM小时 | NC6s_v3: ~$3.1/h | NC6s_v3: ~$3.1/h |
| **Databricks** | DBU + 云资源 | 按DBU计费 + GPU实例费 | Serverless或集群 |

*注：价格仅供参考，实际价格因区域和配置而异*

### 选择建议

```
                      平台选择决策树
+------------------------------------------------------------------+
|                                                                  |
|  已有云平台投资？                                                 |
|       |                                                          |
|       +-- AWS为主 -------> SageMaker (生态集成最佳)              |
|       |                                                          |
|       +-- GCP为主 -------> Vertex AI (BigQuery/TPU优势)          |
|       |                                                          |
|       +-- Azure为主 -----> Azure ML (企业集成/混合云)            |
|       |                                                          |
|       +-- 多云/数据分析为主 -> Databricks (跨云/Spark原生)       |
|                                                                  |
|  特殊需求考量：                                                   |
|  +- 大规模数据处理 -> Databricks / Vertex AI (BigQuery)          |
|  +- 边缘部署 -> SageMaker Edge / Azure IoT Edge                  |
|  +- TPU训练 -> Vertex AI                                         |
|  +- 企业安全合规 -> Azure ML                                     |
|  +- 开源生态 -> Databricks (MLflow)                              |
|                                                                  |
+------------------------------------------------------------------+
```

**按场景推荐**：

| 场景 | 推荐平台 | 理由 |
|------|---------|------|
| 初创公司，快速迭代 | Vertex AI | 预训练API丰富，快速上手 |
| 大型企业，安全优先 | Azure ML | 企业集成，合规认证全 |
| 电商/互联网，规模化ML | SageMaker | 成熟稳定，文档详尽 |
| 数据密集型ML | Databricks | Spark原生，Delta Lake |
| 研究/实验性项目 | Vertex AI | TPU支持，前沿模型 |
| 混合云部署 | Azure ML | Arc支持，本地部署 |

## 成本优化最佳实践

### 训练成本优化

```python
# 使用 Spot/Preemptible 实例
# SageMaker
from sagemaker.pytorch import PyTorch

estimator = PyTorch(
    # ...其他配置...
    use_spot_instances=True,
    max_wait=7200,  # 最大等待时间
    max_run=3600,   # 最大运行时间
    checkpoint_s3_uri='s3://bucket/checkpoints/'  # 检查点保存
)

# Vertex AI
custom_job = aiplatform.CustomJob(
    # ...其他配置...
    scheduling={
        'strategy': 'SPOT'  # 使用抢占式实例
    }
)

# Azure ML
training_job = command(
    # ...其他配置...
    compute='low-priority-cluster'  # 使用低优先级节点
)
```

```python
# 混合精度训练（减少GPU内存，加速训练）
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

for batch in train_loader:
    optimizer.zero_grad()

    with autocast():
        outputs = model(inputs)
        loss = criterion(outputs, targets)

    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

### 推理成本优化

```python
# 模型优化 - 量化
import torch.quantization

# 动态量化（推理时量化）
quantized_model = torch.quantization.quantize_dynamic(
    model,
    {torch.nn.Linear, torch.nn.Conv2d},
    dtype=torch.qint8
)

# Serverless 推理（按调用付费）
# SageMaker Serverless
serverless_predictor = model.deploy(
    serverless_inference_config=ServerlessInferenceConfig(
        memory_size_in_mb=4096,
        max_concurrency=10
    )
)

# Vertex AI - 自动扩缩到0
model.deploy(
    # ...其他配置...
    min_replica_count=0,
    max_replica_count=10
)
```

### 成本监控

```python
# AWS Cost Explorer
import boto3

ce = boto3.client('ce')

def get_sagemaker_costs(days=30):
    from datetime import datetime, timedelta

    end = datetime.now()
    start = end - timedelta(days=days)

    response = ce.get_cost_and_usage(
        TimePeriod={
            'Start': start.strftime('%Y-%m-%d'),
            'End': end.strftime('%Y-%m-%d')
        },
        Granularity='DAILY',
        Filter={
            'Dimensions': {
                'Key': 'SERVICE',
                'Values': ['Amazon SageMaker']
            }
        },
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'USAGE_TYPE'}
        ]
    )

    return response['ResultsByTime']
```

## 面试要点

### 常见面试问题

**Q1: 如何选择合适的云ML平台？**

```
选择考量因素：
1. 现有云基础设施：优先选择与现有云环境匹配的平台
2. 团队技能栈：考虑团队对特定SDK/工具的熟悉程度
3. 特定功能需求：如TPU需求选GCP，企业合规选Azure
4. 成本预算：对比各平台定价，考虑预留实例优惠
5. 数据位置：数据存储位置影响训练延迟和成本
6. 生态系统：考虑与其他服务（数据库、分析工具）的集成
```

**Q2: 如何优化分布式训练性能？**

```
优化策略：
1. 数据并行：增加batch size，线性缩放学习率
2. 通信优化：使用梯度压缩、异步更新
3. 混合精度：FP16训练减少通信和计算开销
4. 数据加载：预取数据，避免GPU空闲
5. 选择合适的实例：高带宽网络（如AWS的EFA）
6. 检查点策略：定期保存以应对抢占式实例中断
```

**Q3: 生产环境模型部署的最佳实践？**

```
部署最佳实践：
1. 蓝绿部署：新旧版本并行，逐步切换流量
2. 自动扩缩：根据负载动态调整实例数
3. 模型监控：监控预测延迟、错误率、数据漂移
4. A/B测试：新模型小流量验证后再全量上线
5. 回滚机制：保留旧版本，出问题快速回滚
6. 安全加固：VPC隔离、IAM权限、数据加密
```

**Q4: 如何管理ML实验和模型版本？**

```
实验管理：
1. 使用MLflow/实验追踪服务记录所有运行
2. 参数、指标、代码版本全记录
3. 模型注册表管理模型版本和阶段（开发/测试/生产）
4. 数据版本控制（DVC或平台内置功能）
5. 可复现性：固定随机种子、记录环境依赖
```

### 实战技巧总结

```
云ML平台使用技巧：

开发阶段：
+- 使用托管Notebooks快速原型开发
+- 小数据集本地测试，大数据集云端训练
+- 善用预构建容器，减少环境配置时间
+- 实验追踪从第一天开始

训练阶段：
+- 先用小实例验证代码，再用大实例正式训练
+- 使用Spot实例+检查点节省成本
+- 分布式训练从2节点开始，逐步扩展
+- 超参数调优使用贝叶斯优化而非网格搜索

部署阶段：
+- 模型优化（量化/蒸馏）后再部署
+- 合理设置自动扩缩阈值
+- 监控先于上线
+- 批量推理用批处理服务而非实时端点

成本控制：
+- 设置预算告警
+- 非生产环境使用Spot/低优先级实例
+- 自动关机策略
+- 定期审查资源使用情况
```

## 延伸阅读

### 官方文档

- **AWS SageMaker**: https://docs.aws.amazon.com/sagemaker/
- **GCP Vertex AI**: https://cloud.google.com/vertex-ai/docs
- **Azure ML**: https://docs.microsoft.com/azure/machine-learning/
- **Databricks**: https://docs.databricks.com/machine-learning/

### 推荐学习资源

| 资源 | 平台 | 说明 |
|------|------|------|
| AWS ML University | AWS | 免费ML课程 |
| Google ML Crash Course | GCP | 机器学习入门 |
| Microsoft Learn | Azure | AI认证学习路径 |
| Databricks Academy | Databricks | 平台认证课程 |

### 认证考试

| 认证 | 平台 | 难度 |
|------|------|------|
| AWS ML Specialty | AWS | 专业级 |
| Google Professional ML Engineer | GCP | 专业级 |
| Azure AI Engineer Associate | Azure | 助理级 |
| Databricks ML Associate | Databricks | 助理级 |

## 总结

云ML平台是现代AI/ML工程的核心基础设施，选择合适的平台并掌握其使用方法对于ML工程师至关重要：

1. **AWS SageMaker**：最成熟的端到端ML平台，生态系统完善，适合大规模生产环境
2. **GCP Vertex AI**：与Google AI能力深度集成，TPU支持出色，适合研究和前沿应用
3. **Azure ML**：企业级集成最佳，适合已有Azure投资的组织
4. **Databricks**：数据和ML统一平台，适合数据密集型ML场景

无论选择哪个平台，核心能力都是相通的：
- 掌握分布式训练技术
- 理解MLOps流水线设计
- 熟悉模型部署最佳实践
- 具备成本优化意识

持续学习和实践是掌握这些平台的关键，建议通过官方文档、动手实验和认证考试来深化理解。
