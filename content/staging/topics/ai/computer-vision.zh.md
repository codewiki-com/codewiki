---
title: 计算机视觉(CV)指南
description: 掌握计算机视觉核心技术，实现图像识别与处理
track: ai
section: multimodal
difficulty: advanced
tags:
  - 计算机视觉
  - CV
  - 图像识别
  - CNN
status: imported
origin: old/src/content/docs/ai/computer-vision.zh.md
divergence: 0.328
issues:
  - h1-in-body
legacy:
  category: AI
  subcategory: Computer Vision
  order: 7
  lastUpdated: 2026-01-07
---

计算机视觉（Computer Vision，CV）是人工智能领域的重要分支，致力于让计算机理解和解释视觉信息。从图像分类到自动驾驶，计算机视觉技术正在深刻改变我们的生活。本文将系统性地介绍计算机视觉的核心概念、经典架构和实战技巧。

---

## 计算机视觉任务概述

### 什么是计算机视觉？

计算机视觉是一门研究如何让计算机从图像或视频中获取高层次语义理解的学科。其目标是模拟人类视觉系统，使机器能够"看懂"世界。

**计算机视觉的发展历程：**

- **1960年代**：早期研究，边缘检测等基础算法
- **1990年代**：特征工程时代（SIFT、HOG等）
- **2012年**：AlexNet在ImageNet上的突破，开启深度学习时代
- **2015年**：ResNet实现超越人类的图像分类准确率
- **2020年至今**：Vision Transformer、多模态大模型涌现

### 主要任务类型

| 任务类型 | 描述 | 典型应用 |
|---------|------|---------|
| 图像分类 | 判断图像属于哪个类别 | 医疗影像诊断、产品分类 |
| 目标检测 | 定位并识别图像中的物体 | 自动驾驶、安防监控 |
| 语义分割 | 像素级别的分类 | 自动驾驶场景理解 |
| 实例分割 | 区分同类物体的不同实例 | 机器人抓取、医学图像 |
| 目标跟踪 | 在视频中跟踪目标运动 | 运动分析、监控追踪 |
| 姿态估计 | 检测人体关键点位置 | 动作捕捉、健身指导 |
| 人脸识别 | 识别和验证人脸身份 | 身份认证、考勤系统 |
| 图像生成 | 生成新的图像内容 | 艺术创作、图像修复 |

### 任务难度层次

```
图像级别任务（简单）
├── 图像分类：整张图片一个标签
├── 图像检索：找相似图片
└── 场景识别：识别图片场景

区域级别任务（中等）
├── 目标检测：边界框 + 类别
├── 目标跟踪：跨帧关联
└── 关键点检测：定位特定点

像素级别任务（困难）
├── 语义分割：每个像素一个类别
├── 实例分割：区分不同实例
└── 全景分割：语义 + 实例
```

---

## 图像基础与预处理

### 数字图像基础

数字图像本质上是一个多维数组，理解其结构是进行图像处理的基础。

```python
import numpy as np
import cv2
from PIL import Image

# 读取图像
img = cv2.imread('image.jpg')

# 图像属性
print(f"形状: {img.shape}")      # (高度, 宽度, 通道数)
print(f"数据类型: {img.dtype}")   # uint8
print(f"像素值范围: [{img.min()}, {img.max()}]")  # [0, 255]

# 颜色空间
# OpenCV默认读取为BGR格式
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
```

### 常见颜色空间

| 颜色空间 | 描述 | 应用场景 |
|---------|------|---------|
| RGB | 红绿蓝三通道 | 显示、神经网络输入 |
| BGR | OpenCV默认格式 | OpenCV处理 |
| HSV | 色调、饱和度、明度 | 颜色检测、分割 |
| LAB | 感知均匀颜色空间 | 颜色差异计算 |
| YCrCb | 亮度与色度分离 | 视频压缩、肤色检测 |

### 图像预处理技术

```python
import torch
import torchvision.transforms as transforms
from PIL import Image

# 定义预处理管道
preprocess = transforms.Compose([
    # 1. 调整大小
    transforms.Resize(256),

    # 2. 中心裁剪
    transforms.CenterCrop(224),

    # 3. 转换为张量 [0, 255] -> [0, 1]
    transforms.ToTensor(),

    # 4. 标准化（ImageNet均值和标准差）
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

# 应用预处理
img = Image.open('image.jpg')
tensor = preprocess(img)
print(f"预处理后形状: {tensor.shape}")  # torch.Size([3, 224, 224])
```

### 图像归一化的重要性

归一化是将像素值缩放到特定范围的过程，对深度学习至关重要：

```python
import numpy as np

def normalize_image(img, method='minmax'):
    """
    图像归一化方法

    Args:
        img: 输入图像数组
        method: 归一化方法

    Returns:
        归一化后的图像
    """
    if method == 'minmax':
        # Min-Max归一化: [0, 1]
        return (img - img.min()) / (img.max() - img.min() + 1e-8)

    elif method == 'zscore':
        # Z-score标准化
        return (img - img.mean()) / (img.std() + 1e-8)

    elif method == 'imagenet':
        # ImageNet预训练模型标准化
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img = img / 255.0  # 先缩放到[0, 1]
        return (img - mean) / std

    else:
        raise ValueError(f"未知归一化方法: {method}")
```

**为什么要归一化？**

1. **加速收敛**：使不同特征处于相同尺度
2. **防止梯度问题**：避免数值过大或过小
3. **模型兼容**：预训练模型要求特定的输入分布

---

## CNN架构详解

卷积神经网络（CNN）是计算机视觉的基石，通过卷积操作自动提取图像特征。

### 卷积操作原理

```python
import torch
import torch.nn as nn

# 卷积层的基本参数
conv = nn.Conv2d(
    in_channels=3,      # 输入通道数
    out_channels=64,    # 输出通道数（卷积核数量）
    kernel_size=3,      # 卷积核大小
    stride=1,           # 步长
    padding=1           # 填充
)

# 输出尺寸计算公式
# H_out = (H_in + 2*padding - kernel_size) / stride + 1
# 例如: (224 + 2*1 - 3) / 1 + 1 = 224

# 池化层
maxpool = nn.MaxPool2d(kernel_size=2, stride=2)  # 尺寸减半
avgpool = nn.AdaptiveAvgPool2d((1, 1))  # 全局平均池化
```

### LeNet-5：开山之作

LeNet-5由Yann LeCun于1998年提出，是第一个成功应用的卷积神经网络，用于手写数字识别。

```python
import torch.nn as nn
import torch.nn.functional as F

class LeNet5(nn.Module):
    """
    LeNet-5架构
    输入: 32x32灰度图像
    """
    def __init__(self, num_classes=10):
        super(LeNet5, self).__init__()

        # 卷积层
        self.conv1 = nn.Conv2d(1, 6, kernel_size=5)    # 32->28
        self.conv2 = nn.Conv2d(6, 16, kernel_size=5)   # 14->10

        # 全连接层
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, num_classes)

    def forward(self, x):
        # 卷积 + 激活 + 池化
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)  # 28->14
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)  # 10->5

        # 展平
        x = x.view(-1, 16 * 5 * 5)

        # 全连接层
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)

        return x

# 模型参数统计
model = LeNet5()
total_params = sum(p.numel() for p in model.parameters())
print(f"LeNet-5 参数量: {total_params:,}")  # 约61,706
```

### VGGNet：深度的力量

VGGNet由牛津大学视觉几何组于2014年提出，证明了网络深度对性能的重要性。其核心思想是使用统一的3x3小卷积核堆叠。

```python
import torch.nn as nn

class VGG16(nn.Module):
    """
    VGG16架构
    特点: 全部使用3x3卷积核，结构简洁规整
    """
    def __init__(self, num_classes=1000):
        super(VGG16, self).__init__()

        self.features = nn.Sequential(
            # Block 1: 2个卷积层
            nn.Conv2d(3, 64, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1), nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 224 -> 112

            # Block 2: 2个卷积层
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1), nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 112 -> 56

            # Block 3: 3个卷积层
            nn.Conv2d(128, 256, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1), nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 56 -> 28

            # Block 4: 3个卷积层
            nn.Conv2d(256, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 28 -> 14

            # Block 5: 3个卷积层
            nn.Conv2d(512, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.Conv2d(512, 512, 3, padding=1), nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),  # 14 -> 7
        )

        self.classifier = nn.Sequential(
            nn.Linear(512 * 7 * 7, 4096),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(4096, 4096),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(4096, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

# VGG16参数量约1.38亿
```

**VGG设计哲学：**
- 两个3x3卷积等效于一个5x5卷积的感受野
- 三个3x3卷积等效于一个7x7卷积的感受野
- 更少的参数，更多的非线性

### ResNet：残差革命

ResNet由何恺明等人于2015年提出，通过残差连接解决了深层网络的退化问题，使得训练超过100层的网络成为可能。

```python
import torch
import torch.nn as nn

class BasicBlock(nn.Module):
    """
    ResNet基本残差块（用于ResNet-18/34）
    """
    expansion = 1

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super(BasicBlock, self).__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, 3,
                               stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

        self.conv2 = nn.Conv2d(out_channels, out_channels, 3,
                               padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)

        self.downsample = downsample  # 用于调整维度

    def forward(self, x):
        identity = x

        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))

        # 残差连接
        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity  # 核心：跳跃连接
        out = self.relu(out)

        return out


class Bottleneck(nn.Module):
    """
    ResNet瓶颈残差块（用于ResNet-50/101/152）
    使用1x1卷积降维和升维，减少计算量
    """
    expansion = 4

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super(Bottleneck, self).__init__()

        # 1x1卷积降维
        self.conv1 = nn.Conv2d(in_channels, out_channels, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)

        # 3x3卷积
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3,
                               stride=stride, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)

        # 1x1卷积升维
        self.conv3 = nn.Conv2d(out_channels, out_channels * self.expansion,
                               1, bias=False)
        self.bn3 = nn.BatchNorm2d(out_channels * self.expansion)

        self.relu = nn.ReLU(inplace=True)
        self.downsample = downsample

    def forward(self, x):
        identity = x

        out = self.relu(self.bn1(self.conv1(x)))
        out = self.relu(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity
        out = self.relu(out)

        return out
```

**ResNet变体比较：**

| 模型 | 层数 | 参数量 | Top-1准确率 |
|------|-----|-------|------------|
| ResNet-18 | 18 | 11.7M | 69.8% |
| ResNet-34 | 34 | 21.8M | 73.3% |
| ResNet-50 | 50 | 25.6M | 76.1% |
| ResNet-101 | 101 | 44.5M | 77.4% |
| ResNet-152 | 152 | 60.2M | 78.3% |

### 其他重要架构

```python
# 使用torchvision预训练模型
import torchvision.models as models

# 各种经典架构
alexnet = models.alexnet(pretrained=True)        # 2012年ImageNet冠军
vgg16 = models.vgg16(pretrained=True)            # 简洁深度网络
resnet50 = models.resnet50(pretrained=True)      # 残差网络
densenet121 = models.densenet121(pretrained=True) # 密集连接
inception_v3 = models.inception_v3(pretrained=True) # 多尺度特征
efficientnet_b0 = models.efficientnet_b0(pretrained=True) # 效率优化
```

---

## 目标检测

目标检测是计算机视觉的核心任务之一，需要同时完成定位（在哪里）和分类（是什么）。

### 目标检测发展历程

```
传统方法
├── 滑动窗口 + 手工特征（HOG、SIFT）
└── DPM（可变形部件模型）

两阶段检测器（精度高）
├── R-CNN (2014)
├── Fast R-CNN (2015)
├── Faster R-CNN (2015)
└── Mask R-CNN (2017)

一阶段检测器（速度快）
├── YOLO系列 (2016-)
├── SSD (2016)
└── RetinaNet (2017)

无锚点检测器
├── FCOS (2019)
├── CenterNet (2019)
└── DETR (2020) - Transformer方法
```

### Faster R-CNN详解

Faster R-CNN是两阶段检测器的代表作，由Region Proposal Network（RPN）和检测网络两部分组成。

```python
import torch
import torch.nn as nn
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn

# 加载预训练Faster R-CNN
model = fasterrcnn_resnet50_fpn(pretrained=True)
model.eval()

# 推理示例
from PIL import Image
import torchvision.transforms as T

def detect_objects(image_path, threshold=0.5):
    """
    使用Faster R-CNN进行目标检测

    Args:
        image_path: 图像路径
        threshold: 置信度阈值

    Returns:
        检测结果字典
    """
    # 加载并预处理图像
    image = Image.open(image_path).convert('RGB')
    transform = T.ToTensor()
    image_tensor = transform(image).unsqueeze(0)

    # 推理
    with torch.no_grad():
        predictions = model(image_tensor)

    # 过滤低置信度结果
    pred = predictions[0]
    keep = pred['scores'] > threshold

    results = {
        'boxes': pred['boxes'][keep],      # 边界框 [x1, y1, x2, y2]
        'labels': pred['labels'][keep],    # 类别标签
        'scores': pred['scores'][keep]     # 置信度分数
    }

    return results

# COCO数据集类别
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle',
    'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
    # ... 共80个类别
]
```

### YOLO系列：实时检测之王

YOLO（You Only Look Once）将目标检测视为回归问题，实现了实时检测。

```python
# YOLOv5使用示例（使用ultralytics库）
import torch

# 加载YOLOv5模型
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

# 推理
results = model('image.jpg')

# 查看结果
results.print()   # 打印检测结果
results.show()    # 显示标注图像
results.save()    # 保存结果

# 获取检测数据
detections = results.pandas().xyxy[0]  # DataFrame格式
print(detections[['name', 'confidence', 'xmin', 'ymin', 'xmax', 'ymax']])
```

**YOLO版本演进：**

| 版本 | 年份 | 主要创新 |
|------|-----|---------|
| YOLOv1 | 2016 | 端到端检测框架 |
| YOLOv2 | 2017 | Batch Norm、锚框 |
| YOLOv3 | 2018 | 多尺度预测、残差网络 |
| YOLOv4 | 2020 | CSPDarknet、Mish激活 |
| YOLOv5 | 2020 | PyTorch实现、易用性 |
| YOLOv8 | 2023 | 无锚点检测、分割支持 |

### 自定义目标检测训练

```python
import torch
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as T
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor

class CustomDataset(Dataset):
    """自定义目标检测数据集"""

    def __init__(self, images, annotations, transforms=None):
        self.images = images
        self.annotations = annotations
        self.transforms = transforms

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        image = self.images[idx]
        target = self.annotations[idx]

        # target格式:
        # {
        #     'boxes': tensor([[x1, y1, x2, y2], ...]),
        #     'labels': tensor([1, 2, ...]),
        #     'area': tensor([...]),
        #     'iscrowd': tensor([0, 0, ...])
        # }

        if self.transforms:
            image = self.transforms(image)

        return image, target


def get_detection_model(num_classes):
    """获取可微调的检测模型"""
    # 加载预训练模型
    model = fasterrcnn_resnet50_fpn(pretrained=True)

    # 替换分类头
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)

    return model


def train_one_epoch(model, optimizer, data_loader, device):
    """训练一个epoch"""
    model.train()
    total_loss = 0

    for images, targets in data_loader:
        images = [img.to(device) for img in images]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        # 前向传播
        loss_dict = model(images, targets)
        losses = sum(loss for loss in loss_dict.values())

        # 反向传播
        optimizer.zero_grad()
        losses.backward()
        optimizer.step()

        total_loss += losses.item()

    return total_loss / len(data_loader)
```

---

## 图像分割

图像分割将图像划分为具有语义含义的区域，是像素级别的分类任务。

### 分割任务类型

```
语义分割（Semantic Segmentation）
├── 每个像素分配一个类别标签
├── 不区分同类的不同实例
└── 应用：场景理解、自动驾驶

实例分割（Instance Segmentation）
├── 检测每个物体实例
├── 为每个实例生成掩码
└── 应用：机器人抓取、医学图像

全景分割（Panoptic Segmentation）
├── 语义分割 + 实例分割
├── stuff类别（不可数：天空、道路）+ thing类别（可数：车、人）
└── 应用：完整场景理解
```

### U-Net：医学图像分割利器

```python
import torch
import torch.nn as nn

class DoubleConv(nn.Module):
    """U-Net的基本卷积块：两个3x3卷积"""

    def __init__(self, in_channels, out_channels):
        super(DoubleConv, self).__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)


class UNet(nn.Module):
    """
    U-Net架构
    特点：编码器-解码器结构，跳跃连接
    """

    def __init__(self, in_channels=3, num_classes=1):
        super(UNet, self).__init__()

        # 编码器（下采样路径）
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.enc4 = DoubleConv(256, 512)

        # 瓶颈层
        self.bottleneck = DoubleConv(512, 1024)

        # 解码器（上采样路径）
        self.up4 = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec4 = DoubleConv(1024, 512)  # 512+512跳跃连接

        self.up3 = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3 = DoubleConv(512, 256)

        self.up2 = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2 = DoubleConv(256, 128)

        self.up1 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1 = DoubleConv(128, 64)

        # 输出层
        self.out_conv = nn.Conv2d(64, num_classes, 1)

        self.pool = nn.MaxPool2d(2, 2)

    def forward(self, x):
        # 编码器
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))

        # 瓶颈
        b = self.bottleneck(self.pool(e4))

        # 解码器 + 跳跃连接
        d4 = self.dec4(torch.cat([self.up4(b), e4], dim=1))
        d3 = self.dec3(torch.cat([self.up3(d4), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))

        return self.out_conv(d1)


# 分割损失函数
class DiceLoss(nn.Module):
    """Dice损失，适用于类别不平衡的分割任务"""

    def __init__(self, smooth=1.0):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, pred, target):
        pred = torch.sigmoid(pred)

        # 展平
        pred_flat = pred.view(-1)
        target_flat = target.view(-1)

        # 计算Dice系数
        intersection = (pred_flat * target_flat).sum()
        dice = (2. * intersection + self.smooth) / (
            pred_flat.sum() + target_flat.sum() + self.smooth
        )

        return 1 - dice
```

### DeepLab系列

```python
import torchvision.models.segmentation as segmentation

# 加载预训练DeepLabV3+
model = segmentation.deeplabv3_resnet101(pretrained=True)
model.eval()

# 推理
import torch
from PIL import Image
import torchvision.transforms as T

def segment_image(image_path):
    """使用DeepLabV3进行语义分割"""
    # 预处理
    image = Image.open(image_path).convert('RGB')
    preprocess = T.Compose([
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                   std=[0.229, 0.224, 0.225])
    ])
    input_tensor = preprocess(image).unsqueeze(0)

    # 推理
    with torch.no_grad():
        output = model(input_tensor)['out'][0]

    # 获取预测类别
    predictions = output.argmax(0).numpy()

    return predictions

# PASCAL VOC类别
VOC_CLASSES = [
    'background', 'aeroplane', 'bicycle', 'bird', 'boat',
    'bottle', 'bus', 'car', 'cat', 'chair', 'cow',
    'diningtable', 'dog', 'horse', 'motorbike', 'person',
    'pottedplant', 'sheep', 'sofa', 'train', 'tvmonitor'
]
```

---

## 迁移学习

迁移学习利用在大规模数据集上预训练的模型，加速在新任务上的学习。

### 迁移学习策略

```
策略一：特征提取（Feature Extraction）
├── 冻结预训练模型的权重
├── 只训练新添加的分类层
├── 适用于：数据量少、与原任务相似
└── 训练速度：最快

策略二：微调（Fine-tuning）
├── 解冻部分或全部预训练层
├── 使用较小学习率训练
├── 适用于：数据量中等、任务有差异
└── 训练速度：中等

策略三：从头训练
├── 不使用预训练权重
├── 完全重新训练
├── 适用于：数据量大、任务差异大
└── 训练速度：最慢
```

### 迁移学习实践

```python
import torch
import torch.nn as nn
import torchvision.models as models

def create_transfer_model(num_classes, strategy='finetune'):
    """
    创建迁移学习模型

    Args:
        num_classes: 目标类别数
        strategy: 'feature_extraction' 或 'finetune'

    Returns:
        配置好的模型
    """
    # 加载预训练ResNet50
    model = models.resnet50(pretrained=True)

    if strategy == 'feature_extraction':
        # 冻结所有层
        for param in model.parameters():
            param.requires_grad = False

    elif strategy == 'finetune':
        # 冻结前面的层，只训练后面的层
        # 冻结前3个stage
        for name, param in model.named_parameters():
            if 'layer4' not in name and 'fc' not in name:
                param.requires_grad = False

    # 替换最后的全连接层
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(in_features, num_classes)
    )

    return model


def get_optimizer_for_transfer(model, strategy='finetune'):
    """为迁移学习配置优化器"""
    if strategy == 'feature_extraction':
        # 只优化分类头
        optimizer = torch.optim.Adam(
            model.fc.parameters(),
            lr=1e-3
        )

    elif strategy == 'finetune':
        # 差异化学习率
        # 预训练层使用小学习率，新层使用大学习率
        pretrained_params = []
        new_params = []

        for name, param in model.named_parameters():
            if param.requires_grad:
                if 'fc' in name:
                    new_params.append(param)
                else:
                    pretrained_params.append(param)

        optimizer = torch.optim.Adam([
            {'params': pretrained_params, 'lr': 1e-5},  # 小学习率
            {'params': new_params, 'lr': 1e-3}          # 大学习率
        ])

    return optimizer


# 使用示例
model = create_transfer_model(num_classes=10, strategy='finetune')
optimizer = get_optimizer_for_transfer(model, strategy='finetune')

# 查看可训练参数
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
total_params = sum(p.numel() for p in model.parameters())
print(f"可训练参数: {trainable_params:,} / {total_params:,}")
```

### 预训练模型选择指南

| 模型 | 参数量 | ImageNet Top-1 | 推荐场景 |
|------|-------|---------------|---------|
| MobileNetV3 | 5.4M | 75.2% | 移动端部署 |
| EfficientNet-B0 | 5.3M | 77.1% | 效率与精度平衡 |
| ResNet-50 | 25.6M | 76.1% | 通用场景 |
| EfficientNet-B7 | 66M | 84.3% | 追求最高精度 |
| ViT-L/16 | 304M | 87.8% | 资源充足时 |

---

## 数据增强技术

数据增强通过对训练数据进行变换，增加数据多样性，提高模型泛化能力。

### 基础数据增强

```python
import torchvision.transforms as T
from PIL import Image

# 训练时的数据增强
train_transforms = T.Compose([
    # 几何变换
    T.RandomResizedCrop(224, scale=(0.8, 1.0)),  # 随机裁剪缩放
    T.RandomHorizontalFlip(p=0.5),               # 水平翻转
    T.RandomRotation(15),                         # 随机旋转
    T.RandomAffine(                               # 仿射变换
        degrees=0,
        translate=(0.1, 0.1),
        scale=(0.9, 1.1),
        shear=10
    ),

    # 颜色变换
    T.ColorJitter(
        brightness=0.2,   # 亮度
        contrast=0.2,     # 对比度
        saturation=0.2,   # 饱和度
        hue=0.1           # 色调
    ),

    # 转换为张量并标准化
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225])
])

# 验证/测试时不使用增强
val_transforms = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225])
])
```

### 高级数据增强：Albumentations

```python
import albumentations as A
from albumentations.pytorch import ToTensorV2
import cv2

# 使用Albumentations（更高效、更多选择）
train_transform = A.Compose([
    # 几何变换
    A.RandomResizedCrop(224, 224, scale=(0.8, 1.0)),
    A.HorizontalFlip(p=0.5),
    A.ShiftScaleRotate(
        shift_limit=0.1,
        scale_limit=0.2,
        rotate_limit=30,
        p=0.5
    ),

    # 像素级变换
    A.OneOf([
        A.GaussNoise(var_limit=(10.0, 50.0)),    # 高斯噪声
        A.GaussianBlur(blur_limit=(3, 7)),       # 高斯模糊
        A.MotionBlur(blur_limit=(3, 7)),         # 运动模糊
    ], p=0.3),

    # 颜色变换
    A.OneOf([
        A.RandomBrightnessContrast(p=1),
        A.HueSaturationValue(p=1),
        A.RGBShift(p=1),
    ], p=0.3),

    # Dropout类增强
    A.OneOf([
        A.CoarseDropout(                          # Cutout
            max_holes=8,
            max_height=32,
            max_width=32,
            p=1
        ),
        A.GridDropout(p=1),                       # GridMask
    ], p=0.2),

    # 标准化
    A.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
    ToTensorV2()
])

def apply_transform(image_path):
    """应用数据增强"""
    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    transformed = train_transform(image=image)
    return transformed['image']
```

### MixUp与CutMix

```python
import torch
import numpy as np

def mixup_data(x, y, alpha=0.2):
    """
    MixUp: 混合两个样本及其标签

    Args:
        x: 输入图像批次
        y: 标签批次
        alpha: Beta分布参数

    Returns:
        mixed_x: 混合后的图像
        y_a, y_b: 两个标签
        lam: 混合比例
    """
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1

    batch_size = x.size(0)
    index = torch.randperm(batch_size)

    mixed_x = lam * x + (1 - lam) * x[index, :]
    y_a, y_b = y, y[index]

    return mixed_x, y_a, y_b, lam


def cutmix_data(x, y, alpha=1.0):
    """
    CutMix: 将一个样本的区域粘贴到另一个样本上

    Args:
        x: 输入图像批次
        y: 标签批次
        alpha: Beta分布参数

    Returns:
        mixed_x: 混合后的图像
        y_a, y_b: 两个标签
        lam: 混合比例
    """
    lam = np.random.beta(alpha, alpha)
    batch_size = x.size(0)
    index = torch.randperm(batch_size)

    # 生成随机边界框
    W, H = x.size(2), x.size(3)
    cut_rat = np.sqrt(1. - lam)
    cut_w = int(W * cut_rat)
    cut_h = int(H * cut_rat)

    cx = np.random.randint(W)
    cy = np.random.randint(H)

    bbx1 = np.clip(cx - cut_w // 2, 0, W)
    bby1 = np.clip(cy - cut_h // 2, 0, H)
    bbx2 = np.clip(cx + cut_w // 2, 0, W)
    bby2 = np.clip(cy + cut_h // 2, 0, H)

    # 应用CutMix
    mixed_x = x.clone()
    mixed_x[:, :, bbx1:bbx2, bby1:bby2] = x[index, :, bbx1:bbx2, bby1:bby2]

    # 调整lambda
    lam = 1 - ((bbx2 - bbx1) * (bby2 - bby1) / (W * H))

    return mixed_x, y, y[index], lam


def mixup_criterion(criterion, pred, y_a, y_b, lam):
    """MixUp/CutMix的损失计算"""
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)
```

---

## OpenCV实战

OpenCV是最流行的计算机视觉库，提供了丰富的图像处理功能。

### 基础图像操作

```python
import cv2
import numpy as np

# 读取和显示图像
img = cv2.imread('image.jpg')            # 读取图像
cv2.imshow('Image', img)                  # 显示图像
cv2.waitKey(0)                            # 等待按键
cv2.destroyAllWindows()                   # 关闭窗口

# 图像基本信息
print(f"形状: {img.shape}")              # (高度, 宽度, 通道)
print(f"大小: {img.size}")               # 像素总数
print(f"类型: {img.dtype}")              # 数据类型

# 颜色空间转换
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)     # 转灰度
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)       # 转HSV
rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)       # 转RGB

# 图像调整大小
resized = cv2.resize(img, (300, 200))                     # 指定尺寸
resized = cv2.resize(img, None, fx=0.5, fy=0.5)          # 缩放比例

# 图像裁剪（使用NumPy切片）
roi = img[100:300, 200:400]  # [y1:y2, x1:x2]

# 图像旋转
center = (img.shape[1] // 2, img.shape[0] // 2)
matrix = cv2.getRotationMatrix2D(center, 45, 1.0)         # 中心点、角度、缩放
rotated = cv2.warpAffine(img, matrix, (img.shape[1], img.shape[0]))
```

### 图像滤波与边缘检测

```python
import cv2
import numpy as np

def image_processing_demo(image_path):
    """图像处理综合示例"""
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. 高斯模糊（降噪）
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # 2. 边缘检测
    # Sobel算子
    sobel_x = cv2.Sobel(blur, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(blur, cv2.CV_64F, 0, 1, ksize=3)
    sobel = cv2.magnitude(sobel_x, sobel_y)

    # Canny边缘检测
    edges = cv2.Canny(blur, 50, 150)

    # 3. 形态学操作
    kernel = np.ones((5, 5), np.uint8)
    # 膨胀
    dilated = cv2.dilate(edges, kernel, iterations=1)
    # 腐蚀
    eroded = cv2.erode(edges, kernel, iterations=1)
    # 开运算（先腐蚀后膨胀，去除噪点）
    opened = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)
    # 闭运算（先膨胀后腐蚀，填充孔洞）
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # 4. 阈值处理
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    return {
        'blur': blur,
        'edges': edges,
        'sobel': sobel,
        'binary': binary,
        'adaptive': adaptive
    }
```

### 轮廓检测与形状分析

```python
import cv2
import numpy as np

def contour_analysis(image_path):
    """轮廓检测与分析"""
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 二值化
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

    # 查找轮廓
    contours, hierarchy = cv2.findContours(
        binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    result = img.copy()

    for contour in contours:
        # 计算轮廓面积
        area = cv2.contourArea(contour)
        if area < 100:  # 过滤小轮廓
            continue

        # 计算周长
        perimeter = cv2.arcLength(contour, True)

        # 获取边界矩形
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(result, (x, y), (x+w, y+h), (0, 255, 0), 2)

        # 获取最小外接矩形
        rect = cv2.minAreaRect(contour)
        box = cv2.boxPoints(rect)
        box = np.int0(box)
        cv2.drawContours(result, [box], 0, (255, 0, 0), 2)

        # 获取最小外接圆
        (cx, cy), radius = cv2.minEnclosingCircle(contour)
        cv2.circle(result, (int(cx), int(cy)), int(radius), (0, 0, 255), 2)

        # 多边形逼近
        epsilon = 0.02 * perimeter
        approx = cv2.approxPolyDP(contour, epsilon, True)

        # 形状识别
        vertices = len(approx)
        if vertices == 3:
            shape = "triangle"
        elif vertices == 4:
            shape = "rectangle"
        elif vertices > 8:
            shape = "circle"
        else:
            shape = f"{vertices}-polygon"

        cv2.putText(result, shape, (x, y-10),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    return result
```

### 视频处理

```python
import cv2

def video_processing(video_path, output_path=None):
    """视频处理示例"""
    # 打开视频
    cap = cv2.VideoCapture(video_path)
    # 使用摄像头: cap = cv2.VideoCapture(0)

    # 获取视频属性
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # 视频写入器
    if output_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # 处理每一帧
        # 例如：转换为灰度
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 边缘检测
        edges = cv2.Canny(gray, 50, 150)

        # 转回3通道以便显示
        edges_colored = cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)

        # 显示结果
        cv2.imshow('Original', frame)
        cv2.imshow('Edges', edges_colored)

        # 保存处理后的帧
        if output_path:
            out.write(edges_colored)

        # 按'q'退出
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    if output_path:
        out.release()
    cv2.destroyAllWindows()
```

---

## 模型部署

将训练好的模型部署到生产环境是计算机视觉应用的最后一公里。

### 模型导出

```python
import torch
import torchvision.models as models

# 加载模型
model = models.resnet50(pretrained=True)
model.eval()

# 示例输入
dummy_input = torch.randn(1, 3, 224, 224)

# 导出ONNX格式
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    },
    opset_version=11
)

# TorchScript导出
# Tracing方式
traced_model = torch.jit.trace(model, dummy_input)
traced_model.save("model_traced.pt")

# Scripting方式（支持控制流）
scripted_model = torch.jit.script(model)
scripted_model.save("model_scripted.pt")
```

### ONNX Runtime推理

```python
import onnxruntime as ort
import numpy as np
from PIL import Image
import torchvision.transforms as T

class ONNXInference:
    """ONNX Runtime推理封装"""

    def __init__(self, model_path):
        # 创建推理会话
        self.session = ort.InferenceSession(
            model_path,
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )

        # 获取输入输出信息
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name

        # 预处理
        self.preprocess = T.Compose([
            T.Resize(256),
            T.CenterCrop(224),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406],
                       std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image_path):
        """执行推理"""
        # 加载和预处理图像
        image = Image.open(image_path).convert('RGB')
        input_tensor = self.preprocess(image).unsqueeze(0).numpy()

        # 执行推理
        outputs = self.session.run(
            [self.output_name],
            {self.input_name: input_tensor}
        )

        # 后处理
        predictions = outputs[0]
        predicted_class = np.argmax(predictions, axis=1)[0]
        confidence = float(np.max(predictions))

        return predicted_class, confidence

# 使用示例
inference = ONNXInference("model.onnx")
class_id, conf = inference.predict("test.jpg")
print(f"预测类别: {class_id}, 置信度: {conf:.4f}")
```

### TensorRT加速

```python
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np

class TensorRTInference:
    """TensorRT推理封装（适用于NVIDIA GPU）"""

    def __init__(self, engine_path):
        # 加载TRT引擎
        logger = trt.Logger(trt.Logger.WARNING)
        with open(engine_path, 'rb') as f:
            self.engine = trt.Runtime(logger).deserialize_cuda_engine(f.read())

        self.context = self.engine.create_execution_context()

        # 分配内存
        self.inputs = []
        self.outputs = []
        self.bindings = []

        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding))
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))

            # 分配主机和设备内存
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)

            self.bindings.append(int(device_mem))

            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem})

    def predict(self, input_data):
        """执行推理"""
        # 将输入数据复制到页锁定内存
        np.copyto(self.inputs[0]['host'], input_data.ravel())

        # 传输到GPU
        cuda.memcpy_htod(self.inputs[0]['device'], self.inputs[0]['host'])

        # 执行推理
        self.context.execute_v2(self.bindings)

        # 传输回CPU
        cuda.memcpy_dtoh(self.outputs[0]['host'], self.outputs[0]['device'])

        return self.outputs[0]['host']
```

### Flask API服务

```python
from flask import Flask, request, jsonify
import torch
import torchvision.models as models
import torchvision.transforms as T
from PIL import Image
import io

app = Flask(__name__)

# 加载模型（全局）
model = models.resnet50(pretrained=True)
model.eval()

# 预处理
preprocess = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225])
])

# ImageNet类别标签
with open('imagenet_classes.txt') as f:
    CLASSES = [line.strip() for line in f.readlines()]


@app.route('/predict', methods=['POST'])
def predict():
    """图像分类API端点"""
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400

    try:
        # 读取图像
        file = request.files['image']
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert('RGB')

        # 预处理
        input_tensor = preprocess(image).unsqueeze(0)

        # 推理
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.nn.functional.softmax(outputs[0], dim=0)

        # 获取Top-5预测
        top5_prob, top5_idx = torch.topk(probabilities, 5)

        results = []
        for prob, idx in zip(top5_prob, top5_idx):
            results.append({
                'class': CLASSES[idx],
                'probability': float(prob)
            })

        return jsonify({'predictions': results})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

### Docker部署

```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制模型和代码
COPY model.onnx .
COPY app.py .
COPY imagenet_classes.txt .

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  cv-api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

---

## 面试要点

### 基础概念

**Q1: 卷积操作的本质是什么？**

卷积操作本质上是一种特征提取操作，通过滑动窗口的方式在输入上进行加权求和。其核心优势包括：
- **参数共享**：同一个卷积核应用于整个图像
- **局部连接**：只关注局部区域的信息
- **平移等变性**：物体在图像中移动，特征图也相应移动

**Q2: BatchNorm的作用和原理？**

```python
# BatchNorm计算过程
def batch_norm_forward(x, gamma, beta, eps=1e-5):
    # x: (N, C, H, W)
    mean = x.mean(dim=(0, 2, 3), keepdim=True)  # 对batch, H, W求均值
    var = x.var(dim=(0, 2, 3), keepdim=True)

    # 标准化
    x_norm = (x - mean) / torch.sqrt(var + eps)

    # 缩放和平移
    out = gamma * x_norm + beta

    return out
```

作用：
- 加速训练收敛
- 缓解Internal Covariate Shift
- 提供正则化效果
- 允许使用更大学习率

**Q3: ResNet为什么能训练更深的网络？**

残差连接解决了深层网络的退化问题（不是梯度消失/爆炸）。通过`y = F(x) + x`的形式：
- 梯度可以直接通过跳跃连接反向传播
- 网络可以学习恒等映射（F(x)=0）
- 优化目标从学习完整映射变为学习残差

### 目标检测

**Q4: NMS（非极大值抑制）的原理？**

```python
def nms(boxes, scores, iou_threshold=0.5):
    """
    非极大值抑制

    Args:
        boxes: 边界框 [N, 4]
        scores: 置信度 [N]
        iou_threshold: IoU阈值

    Returns:
        keep: 保留的框索引
    """
    keep = []
    order = scores.argsort()[::-1]  # 按分数降序排列

    while len(order) > 0:
        i = order[0]
        keep.append(i)

        if len(order) == 1:
            break

        # 计算IoU
        ious = compute_iou(boxes[i], boxes[order[1:]])

        # 保留IoU小于阈值的框
        inds = np.where(ious <= iou_threshold)[0]
        order = order[inds + 1]

    return keep
```

**Q5: YOLO和Faster R-CNN的区别？**

| 特性 | YOLO | Faster R-CNN |
|------|------|-------------|
| 检测方式 | 一阶段 | 两阶段 |
| 速度 | 快（实时） | 相对慢 |
| 精度 | 略低 | 较高 |
| 小目标 | 效果较差 | 效果较好 |
| 适用场景 | 实时检测 | 精度优先 |

### 图像分割

**Q6: 语义分割常用的损失函数？**

```python
# 交叉熵损失
ce_loss = nn.CrossEntropyLoss()

# Dice损失（处理类别不平衡）
class DiceLoss(nn.Module):
    def forward(self, pred, target):
        smooth = 1.0
        pred = torch.sigmoid(pred)
        intersection = (pred * target).sum()
        return 1 - (2. * intersection + smooth) / (pred.sum() + target.sum() + smooth)

# Focal Loss（关注难样本）
class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, pred, target):
        bce = F.binary_cross_entropy_with_logits(pred, target, reduction='none')
        pt = torch.exp(-bce)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * bce
        return focal_loss.mean()

# 组合损失
def combined_loss(pred, target):
    return 0.5 * ce_loss(pred, target) + 0.5 * dice_loss(pred, target)
```

### 实践问题

**Q7: 如何处理类别不平衡问题？**

1. **数据层面**：过采样少数类、欠采样多数类、数据增强
2. **损失函数**：加权交叉熵、Focal Loss、Dice Loss
3. **采样策略**：类别平衡采样器
4. **评估指标**：使用mAP、F1-score而非准确率

**Q8: 模型在边缘设备部署的优化策略？**

1. **模型压缩**：
   - 量化（FP32 -> INT8）
   - 剪枝（移除冗余通道）
   - 知识蒸馏

2. **架构优化**：
   - 使用轻量级模型（MobileNet、ShuffleNet）
   - 深度可分离卷积

3. **推理优化**：
   - TensorRT/ONNX Runtime
   - 批处理推理
   - 模型融合

### 常见坑点

1. **忘记model.eval()**：推理时不调用会导致BatchNorm和Dropout行为异常
2. **图像通道顺序**：OpenCV读取为BGR，PyTorch/PIL使用RGB
3. **输入归一化不一致**：训练和推理时必须使用相同的归一化参数
4. **内存泄漏**：推理时忘记使用`torch.no_grad()`
5. **数据增强过度**：验证集不应该使用数据增强

---

## 延伸阅读

### 经典论文

- **AlexNet**: "ImageNet Classification with Deep Convolutional Neural Networks" (2012)
- **VGGNet**: "Very Deep Convolutional Networks for Large-Scale Image Recognition" (2014)
- **ResNet**: "Deep Residual Learning for Image Recognition" (2015)
- **Faster R-CNN**: "Faster R-CNN: Towards Real-Time Object Detection" (2015)
- **U-Net**: "U-Net: Convolutional Networks for Biomedical Image Segmentation" (2015)
- **YOLO**: "You Only Look Once: Unified, Real-Time Object Detection" (2016)
- **ViT**: "An Image is Worth 16x16 Words" (2020)

### 学习资源

- **CS231n**: 斯坦福大学计算机视觉课程
- **PyTorch官方教程**: 图像分类、目标检测实战
- **OpenCV文档**: 图像处理全面指南
- **Papers With Code**: 最新SOTA论文和代码

### 实践项目建议

1. **入门**：MNIST/CIFAR-10图像分类
2. **进阶**：自定义数据集目标检测
3. **实战**：车牌识别系统、人脸识别应用
4. **挑战**：参加Kaggle计算机视觉竞赛

---

> 计算机视觉是一个快速发展的领域，持续学习和实践是掌握这门技术的关键。建议从经典架构开始，逐步了解最新进展，并在实际项目中不断积累经验。
