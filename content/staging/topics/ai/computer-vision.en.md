---
title: Computer Vision Guide
description: Master computer vision for image recognition and processing
track: ai
section: multimodal
difficulty: advanced
tags:
  - Computer Vision
  - CV
  - Image Recognition
  - CNN
status: imported
origin: old/src/content/docs/ai/computer-vision.en.md
divergence: 0.328
issues:
  - h1-in-body
legacy:
  category: AI
  subcategory: Computer Vision
  order: 7
  lastUpdated: 2026-01-07
---

Computer Vision (CV) is a field of artificial intelligence that enables computers to interpret and understand visual information from the world. From autonomous vehicles to medical imaging, computer vision powers many of the most impactful AI applications today. This comprehensive guide covers the fundamental concepts, architectures, and practical implementations you need to master this critical domain.

---

## Computer Vision Tasks

Computer vision encompasses various tasks, each with its own challenges and applications. Understanding these tasks is essential for choosing the right approach for your specific problem.

### Image Classification

Image classification is the foundational task in computer vision, where the goal is to assign a single label to an entire image.

**Key Characteristics:**
- Input: Single image
- Output: Class label (and optionally confidence score)
- Applications: Medical diagnosis, content moderation, product categorization

\`\`\`python
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image

class ImageClassifier:
    """Simple image classifier using pretrained models"""
    def __init__(self, num_classes=1000):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = models.resnet50(pretrained=True)
        self.model.eval()
        self.model.to(self.device)

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, image_path):
        """Predict class for a single image"""
        image = Image.open(image_path).convert('RGB')
        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(input_tensor)
            probabilities = torch.softmax(output, dim=1)
            predicted_class = torch.argmax(probabilities, dim=1)
            confidence = probabilities[0, predicted_class].item()

        return predicted_class.item(), confidence

classifier = ImageClassifier()
class_id, confidence = classifier.predict('image.jpg')
print(f"Predicted class: {class_id}, Confidence: {confidence:.4f}")
\`\`\`

### Object Detection

Object detection goes beyond classification by identifying multiple objects within an image and localizing them with bounding boxes.

**Key Characteristics:**
- Input: Single image
- Output: Multiple bounding boxes with class labels and confidence scores
- Applications: Autonomous driving, surveillance, retail analytics

### Semantic Segmentation

Semantic segmentation assigns a class label to every pixel in an image, providing dense predictions.

**Key Characteristics:**
- Input: Single image
- Output: Pixel-wise class labels (same resolution as input)
- Applications: Medical imaging, autonomous navigation, satellite imagery analysis

### Instance Segmentation

Instance segmentation combines object detection and semantic segmentation, distinguishing between different instances of the same class.

**Key Characteristics:**
- Input: Single image
- Output: Pixel masks for each individual object instance
- Applications: Robotics, augmented reality, precision agriculture

### Pose Estimation

Pose estimation detects the position and orientation of human bodies or objects.

**Key Characteristics:**
- Input: Single image or video frame
- Output: Keypoint coordinates (e.g., joints for human pose)
- Applications: Sports analysis, animation, gesture recognition

---

## Image Preprocessing

Proper image preprocessing is crucial for training effective computer vision models. It ensures consistency, improves model performance, and can significantly impact training speed.

### Basic Image Operations

\`\`\`python
import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt

def basic_preprocessing(image_path):
    """Demonstrate basic image preprocessing operations"""
    # Load image using OpenCV (BGR format)
    img_cv2 = cv2.imread(image_path)

    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2RGB)

    # Resize image
    img_resized = cv2.resize(img_rgb, (224, 224), interpolation=cv2.INTER_LINEAR)

    # Convert to grayscale
    img_gray = cv2.cvtColor(img_cv2, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian blur
    img_blurred = cv2.GaussianBlur(img_gray, (5, 5), 0)

    # Edge detection using Canny
    edges = cv2.Canny(img_blurred, 50, 150)

    return img_resized, img_gray, edges

def normalize_image(image, method='standard'):
    """
    Normalize image using different methods

    Args:
        image: Input image as numpy array
        method: 'standard', 'minmax', or 'imagenet'

    Returns:
        Normalized image
    """
    image = image.astype(np.float32)

    if method == 'standard':
        # Zero mean, unit variance
        mean = np.mean(image)
        std = np.std(image)
        normalized = (image - mean) / (std + 1e-8)

    elif method == 'minmax':
        # Scale to [0, 1]
        min_val = np.min(image)
        max_val = np.max(image)
        normalized = (image - min_val) / (max_val - min_val + 1e-8)

    elif method == 'imagenet':
        # ImageNet normalization
        image = image / 255.0
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        normalized = (image - mean) / std

    return normalized
\`\`\`

### Color Space Transformations

\`\`\`python
def color_space_demo(image_path):
    """Demonstrate different color space transformations"""
    img = cv2.imread(image_path)

    # RGB (OpenCV loads as BGR, so convert)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # HSV - useful for color-based segmentation
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # LAB - perceptually uniform color space
    img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

    # YCrCb - separates luminance from chrominance
    img_ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)

    return {
        'rgb': img_rgb,
        'hsv': img_hsv,
        'lab': img_lab,
        'ycrcb': img_ycrcb
    }

def histogram_equalization(image):
    """Apply histogram equalization for contrast enhancement"""
    if len(image.shape) == 3:
        # For color images, apply to luminance channel
        img_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(img_lab)

        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel_eq = clahe.apply(l_channel)

        # Merge channels back
        img_lab_eq = cv2.merge([l_channel_eq, a_channel, b_channel])
        result = cv2.cvtColor(img_lab_eq, cv2.COLOR_LAB2BGR)
    else:
        # For grayscale images
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        result = clahe.apply(image)

    return result
\`\`\`

### PyTorch Data Pipeline

\`\`\`python
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
import os

class CustomImageDataset(Dataset):
    """Custom dataset for image classification"""
    def __init__(self, image_dir, labels_file, transform=None):
        self.image_dir = image_dir
        self.transform = transform

        # Load labels from file
        self.samples = []
        with open(labels_file, 'r') as f:
            for line in f:
                img_name, label = line.strip().split(',')
                self.samples.append((img_name, int(label)))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_name, label = self.samples[idx]
        img_path = os.path.join(self.image_dir, img_name)

        # Load image
        image = Image.open(img_path).convert('RGB')

        # Apply transforms
        if self.transform:
            image = self.transform(image)

        return image, label

# Define transforms for training and validation
train_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
])

# Create data loaders
def create_data_loaders(train_dir, val_dir, train_labels, val_labels, batch_size=32):
    train_dataset = CustomImageDataset(train_dir, train_labels, train_transform)
    val_dataset = CustomImageDataset(val_dir, val_labels, val_transform)

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    return train_loader, val_loader
\`\`\`

---

## CNN Architectures

Convolutional Neural Networks (CNNs) are the backbone of modern computer vision. Understanding the evolution and design principles of CNN architectures is essential for building effective vision models.

### Fundamental Building Blocks

#### Convolutional Layers

The convolution operation is the core of CNNs, enabling the network to learn spatial hierarchies of features.

**Output Size Calculation:**

$$H_{out} = \frac{H_{in} + 2P - K}{S} + 1$$

Where $H_{in}$ is input size, $P$ is padding, $K$ is kernel size, and $S$ is stride.

\`\`\`python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBlock(nn.Module):
    """Standard convolutional block: Conv -> BatchNorm -> ReLU"""
    def __init__(self, in_channels, out_channels, kernel_size=3,
                 stride=1, padding=1, use_bn=True):
        super().__init__()
        self.conv = nn.Conv2d(
            in_channels, out_channels, kernel_size,
            stride=stride, padding=padding, bias=not use_bn
        )
        self.bn = nn.BatchNorm2d(out_channels) if use_bn else nn.Identity()
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))

# Example: Calculate output dimensions
def calculate_output_size(input_size, kernel_size, padding, stride):
    return (input_size + 2 * padding - kernel_size) // stride + 1

# For 224x224 input with 7x7 kernel, padding=3, stride=2
output_size = calculate_output_size(224, 7, 3, 2)
print(f"Output size: {output_size}x{output_size}")  # 112x112
\`\`\`

### Classic Architectures

#### VGG Network

VGG demonstrated that deep networks with small (3x3) filters can be very effective.

\`\`\`python
class VGGBlock(nn.Module):
    """VGG-style block with multiple conv layers"""
    def __init__(self, in_channels, out_channels, num_convs):
        super().__init__()
        layers = []
        for i in range(num_convs):
            layers.append(nn.Conv2d(
                in_channels if i == 0 else out_channels,
                out_channels, kernel_size=3, padding=1
            ))
            layers.append(nn.ReLU(inplace=True))
        layers.append(nn.MaxPool2d(kernel_size=2, stride=2))
        self.block = nn.Sequential(*layers)

    def forward(self, x):
        return self.block(x)

class VGG16(nn.Module):
    """Simplified VGG16 architecture"""
    def __init__(self, num_classes=1000):
        super().__init__()
        self.features = nn.Sequential(
            VGGBlock(3, 64, 2),      # 224 -> 112
            VGGBlock(64, 128, 2),    # 112 -> 56
            VGGBlock(128, 256, 3),   # 56 -> 28
            VGGBlock(256, 512, 3),   # 28 -> 14
            VGGBlock(512, 512, 3),   # 14 -> 7
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
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
        x = self.classifier(x)
        return x
\`\`\`

#### ResNet (Residual Networks)

ResNet introduced skip connections to enable training of very deep networks by addressing the vanishing gradient problem.

\`\`\`python
class BasicBlock(nn.Module):
    """Basic residual block for ResNet-18/34"""
    expansion = 1

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.downsample = downsample
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        identity = x

        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity  # Skip connection
        out = self.relu(out)

        return out

class Bottleneck(nn.Module):
    """Bottleneck block for ResNet-50/101/152"""
    expansion = 4

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, stride, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.conv3 = nn.Conv2d(out_channels, out_channels * self.expansion, 1, bias=False)
        self.bn3 = nn.BatchNorm2d(out_channels * self.expansion)
        self.downsample = downsample
        self.relu = nn.ReLU(inplace=True)

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

class ResNet(nn.Module):
    """Flexible ResNet implementation"""
    def __init__(self, block, layers, num_classes=1000):
        super().__init__()
        self.in_channels = 64

        # Initial layers
        self.conv1 = nn.Conv2d(3, 64, 7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

        # Residual layers
        self.layer1 = self._make_layer(block, 64, layers[0])
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(block, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(block, 512, layers[3], stride=2)

        # Classification head
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * block.expansion, num_classes)

    def _make_layer(self, block, out_channels, blocks, stride=1):
        downsample = None
        if stride != 1 or self.in_channels != out_channels * block.expansion:
            downsample = nn.Sequential(
                nn.Conv2d(self.in_channels, out_channels * block.expansion,
                         1, stride, bias=False),
                nn.BatchNorm2d(out_channels * block.expansion),
            )

        layers = [block(self.in_channels, out_channels, stride, downsample)]
        self.in_channels = out_channels * block.expansion

        for _ in range(1, blocks):
            layers.append(block(self.in_channels, out_channels))

        return nn.Sequential(*layers)

    def forward(self, x):
        x = self.maxpool(self.relu(self.bn1(self.conv1(x))))

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)

        return x

# Create different ResNet variants
def resnet18(num_classes=1000):
    return ResNet(BasicBlock, [2, 2, 2, 2], num_classes)

def resnet50(num_classes=1000):
    return ResNet(Bottleneck, [3, 4, 6, 3], num_classes)
\`\`\`

### Modern Architectures

#### EfficientNet

EfficientNet uses compound scaling to balance network depth, width, and resolution.

\`\`\`python
class MBConv(nn.Module):
    """Mobile Inverted Bottleneck Convolution (MBConv) block"""
    def __init__(self, in_channels, out_channels, expand_ratio, stride,
                 kernel_size=3, se_ratio=0.25):
        super().__init__()
        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = in_channels * expand_ratio

        layers = []

        # Expansion phase
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, 1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.SiLU(inplace=True),
            ])

        # Depthwise convolution
        layers.extend([
            nn.Conv2d(hidden_dim, hidden_dim, kernel_size, stride,
                     kernel_size // 2, groups=hidden_dim, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(inplace=True),
        ])

        # Squeeze-and-Excitation
        se_channels = max(1, int(in_channels * se_ratio))
        layers.append(SEBlock(hidden_dim, se_channels))

        # Projection phase
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
        ])

        self.conv = nn.Sequential(*layers)

    def forward(self, x):
        if self.use_residual:
            return x + self.conv(x)
        return self.conv(x)

class SEBlock(nn.Module):
    """Squeeze-and-Excitation block"""
    def __init__(self, channels, se_channels):
        super().__init__()
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc1 = nn.Conv2d(channels, se_channels, 1)
        self.fc2 = nn.Conv2d(se_channels, channels, 1)

    def forward(self, x):
        scale = self.avg_pool(x)
        scale = F.silu(self.fc1(scale))
        scale = torch.sigmoid(self.fc2(scale))
        return x * scale
\`\`\`

#### Vision Transformer (ViT)

Vision Transformers apply the transformer architecture to image classification.

\`\`\`python
class PatchEmbedding(nn.Module):
    """Convert image into patch embeddings"""
    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        self.proj = nn.Conv2d(in_channels, embed_dim,
                              kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        # (B, C, H, W) -> (B, embed_dim, H/P, W/P) -> (B, embed_dim, num_patches)
        x = self.proj(x)
        x = x.flatten(2).transpose(1, 2)  # (B, num_patches, embed_dim)
        return x

class MultiHeadAttention(nn.Module):
    """Multi-head self-attention"""
    def __init__(self, embed_dim, num_heads, dropout=0.0):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = self.head_dim ** -0.5

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, N, C = x.shape
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]

        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        attn = self.dropout(attn)

        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        return x

class TransformerBlock(nn.Module):
    """Transformer encoder block"""
    def __init__(self, embed_dim, num_heads, mlp_ratio=4.0, dropout=0.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadAttention(embed_dim, num_heads, dropout)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, int(embed_dim * mlp_ratio)),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(int(embed_dim * mlp_ratio), embed_dim),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        x = x + self.attn(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x

class VisionTransformer(nn.Module):
    """Vision Transformer (ViT)"""
    def __init__(self, img_size=224, patch_size=16, in_channels=3,
                 num_classes=1000, embed_dim=768, depth=12,
                 num_heads=12, mlp_ratio=4.0, dropout=0.0):
        super().__init__()
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        num_patches = self.patch_embed.num_patches

        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.dropout = nn.Dropout(dropout)

        self.blocks = nn.Sequential(*[
            TransformerBlock(embed_dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])

        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

        # Initialize weights
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x):
        B = x.shape[0]
        x = self.patch_embed(x)

        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        x = x + self.pos_embed
        x = self.dropout(x)

        x = self.blocks(x)
        x = self.norm(x)

        # Use CLS token for classification
        x = x[:, 0]
        x = self.head(x)

        return x
\`\`\`

---

## Object Detection

Object detection is one of the most important applications of computer vision, combining classification and localization to identify and locate multiple objects in an image.

### Two-Stage Detectors

Two-stage detectors first generate region proposals, then classify and refine them.

#### Faster R-CNN Components

\`\`\`python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision.ops import nms, roi_pool

class AnchorGenerator:
    """Generate anchor boxes for object detection"""
    def __init__(self, sizes=(128, 256, 512), ratios=(0.5, 1.0, 2.0)):
        self.sizes = sizes
        self.ratios = ratios

    def generate_anchors(self, feature_map_size, stride):
        """Generate anchors for a feature map"""
        fm_height, fm_width = feature_map_size
        anchors = []

        for y in range(fm_height):
            for x in range(fm_width):
                cx = (x + 0.5) * stride
                cy = (y + 0.5) * stride

                for size in self.sizes:
                    for ratio in self.ratios:
                        w = size * (ratio ** 0.5)
                        h = size / (ratio ** 0.5)

                        anchors.append([
                            cx - w/2, cy - h/2,  # x1, y1
                            cx + w/2, cy + h/2   # x2, y2
                        ])

        return torch.tensor(anchors)

class RegionProposalNetwork(nn.Module):
    """Region Proposal Network for Faster R-CNN"""
    def __init__(self, in_channels, num_anchors=9):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, 512, 3, padding=1)
        self.cls_score = nn.Conv2d(512, num_anchors * 2, 1)  # Object vs background
        self.bbox_pred = nn.Conv2d(512, num_anchors * 4, 1)  # Box regression

    def forward(self, features):
        x = F.relu(self.conv(features))
        cls_scores = self.cls_score(x)
        bbox_deltas = self.bbox_pred(x)
        return cls_scores, bbox_deltas

class RoIHead(nn.Module):
    """RoI Head for final classification and box regression"""
    def __init__(self, in_channels, pool_size=7, num_classes=81):
        super().__init__()
        self.pool_size = pool_size
        self.fc1 = nn.Linear(in_channels * pool_size * pool_size, 1024)
        self.fc2 = nn.Linear(1024, 1024)
        self.cls_score = nn.Linear(1024, num_classes)
        self.bbox_pred = nn.Linear(1024, num_classes * 4)

    def forward(self, features, proposals, image_shapes):
        # Apply RoI pooling
        pooled = roi_pool(features, proposals,
                         output_size=(self.pool_size, self.pool_size),
                         spatial_scale=1/16)

        # Flatten and pass through FC layers
        x = pooled.flatten(start_dim=1)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))

        cls_scores = self.cls_score(x)
        bbox_deltas = self.bbox_pred(x)

        return cls_scores, bbox_deltas
\`\`\`

### One-Stage Detectors

One-stage detectors directly predict bounding boxes and classes without region proposals.

#### YOLO-style Detection Head

\`\`\`python
class YOLOHead(nn.Module):
    """YOLO-style detection head"""
    def __init__(self, in_channels, num_classes, num_anchors=3):
        super().__init__()
        self.num_classes = num_classes
        self.num_anchors = num_anchors

        # Output: (x, y, w, h, objectness, class_scores) per anchor
        self.output_channels = num_anchors * (5 + num_classes)

        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, in_channels * 2, 3, padding=1),
            nn.BatchNorm2d(in_channels * 2),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Conv2d(in_channels * 2, self.output_channels, 1)
        )

    def forward(self, x):
        batch_size = x.size(0)
        output = self.conv(x)

        # Reshape: (B, anchors*(5+classes), H, W) -> (B, anchors, H, W, 5+classes)
        output = output.view(batch_size, self.num_anchors,
                            5 + self.num_classes,
                            output.size(2), output.size(3))
        output = output.permute(0, 1, 3, 4, 2)

        return output

def decode_predictions(predictions, anchors, stride, num_classes):
    """Decode YOLO predictions to bounding boxes"""
    batch_size = predictions.size(0)
    num_anchors = predictions.size(1)
    grid_h = predictions.size(2)
    grid_w = predictions.size(3)

    # Create grid
    grid_y, grid_x = torch.meshgrid(torch.arange(grid_h), torch.arange(grid_w))
    grid_x = grid_x.float().view(1, 1, grid_h, grid_w)
    grid_y = grid_y.float().view(1, 1, grid_h, grid_w)

    # Decode predictions
    pred_x = (torch.sigmoid(predictions[..., 0]) + grid_x) * stride
    pred_y = (torch.sigmoid(predictions[..., 1]) + grid_y) * stride
    pred_w = torch.exp(predictions[..., 2]) * anchors[:, 0].view(1, -1, 1, 1)
    pred_h = torch.exp(predictions[..., 3]) * anchors[:, 1].view(1, -1, 1, 1)

    objectness = torch.sigmoid(predictions[..., 4])
    class_probs = torch.sigmoid(predictions[..., 5:])

    # Convert to corner format
    x1 = pred_x - pred_w / 2
    y1 = pred_y - pred_h / 2
    x2 = pred_x + pred_w / 2
    y2 = pred_y + pred_h / 2

    boxes = torch.stack([x1, y1, x2, y2], dim=-1)

    return boxes, objectness, class_probs
\`\`\`

### Non-Maximum Suppression

\`\`\`python
def non_max_suppression(boxes, scores, iou_threshold=0.5, score_threshold=0.5):
    """
    Apply Non-Maximum Suppression to filter overlapping detections

    Args:
        boxes: (N, 4) tensor of bounding boxes [x1, y1, x2, y2]
        scores: (N,) tensor of confidence scores
        iou_threshold: IoU threshold for suppression
        score_threshold: Minimum score to keep

    Returns:
        Indices of boxes to keep
    """
    # Filter by score threshold
    keep_mask = scores > score_threshold
    boxes = boxes[keep_mask]
    scores = scores[keep_mask]

    if boxes.size(0) == 0:
        return torch.tensor([], dtype=torch.long)

    # Sort by score (descending)
    sorted_indices = torch.argsort(scores, descending=True)

    keep = []
    while sorted_indices.size(0) > 0:
        # Keep the highest scoring box
        current_idx = sorted_indices[0]
        keep.append(current_idx)

        if sorted_indices.size(0) == 1:
            break

        # Calculate IoU with remaining boxes
        current_box = boxes[current_idx]
        remaining_boxes = boxes[sorted_indices[1:]]

        ious = calculate_iou(current_box.unsqueeze(0), remaining_boxes)

        # Keep boxes with IoU below threshold
        mask = ious < iou_threshold
        sorted_indices = sorted_indices[1:][mask]

    return torch.tensor(keep)

def calculate_iou(box1, box2):
    """Calculate IoU between two sets of boxes"""
    # Get intersection coordinates
    x1 = torch.max(box1[:, 0], box2[:, 0])
    y1 = torch.max(box1[:, 1], box2[:, 1])
    x2 = torch.min(box1[:, 2], box2[:, 2])
    y2 = torch.min(box1[:, 3], box2[:, 3])

    # Calculate intersection area
    intersection = torch.clamp(x2 - x1, min=0) * torch.clamp(y2 - y1, min=0)

    # Calculate union area
    area1 = (box1[:, 2] - box1[:, 0]) * (box1[:, 3] - box1[:, 1])
    area2 = (box2[:, 2] - box2[:, 0]) * (box2[:, 3] - box2[:, 1])
    union = area1 + area2 - intersection

    return intersection / (union + 1e-6)
\`\`\`

---

## Image Segmentation

Image segmentation assigns labels to pixels, enabling fine-grained understanding of image content.

### Semantic Segmentation with U-Net

U-Net is a popular encoder-decoder architecture for semantic segmentation.

\`\`\`python
class DoubleConv(nn.Module):
    """Double convolution block for U-Net"""
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)

class UNet(nn.Module):
    """U-Net architecture for semantic segmentation"""
    def __init__(self, in_channels=3, num_classes=21, features=[64, 128, 256, 512]):
        super().__init__()
        self.encoder = nn.ModuleList()
        self.decoder = nn.ModuleList()
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        # Encoder (contracting path)
        for feature in features:
            self.encoder.append(DoubleConv(in_channels, feature))
            in_channels = feature

        # Bottleneck
        self.bottleneck = DoubleConv(features[-1], features[-1] * 2)

        # Decoder (expanding path)
        for feature in reversed(features):
            self.decoder.append(
                nn.ConvTranspose2d(feature * 2, feature, kernel_size=2, stride=2)
            )
            self.decoder.append(DoubleConv(feature * 2, feature))

        # Final convolution
        self.final_conv = nn.Conv2d(features[0], num_classes, kernel_size=1)

    def forward(self, x):
        skip_connections = []

        # Encoder
        for encoder_block in self.encoder:
            x = encoder_block(x)
            skip_connections.append(x)
            x = self.pool(x)

        # Bottleneck
        x = self.bottleneck(x)

        # Decoder
        skip_connections = skip_connections[::-1]
        for idx in range(0, len(self.decoder), 2):
            x = self.decoder[idx](x)  # Upsample
            skip = skip_connections[idx // 2]

            # Handle size mismatch
            if x.shape != skip.shape:
                x = F.interpolate(x, size=skip.shape[2:])

            x = torch.cat([skip, x], dim=1)  # Concatenate skip connection
            x = self.decoder[idx + 1](x)  # Double conv

        return self.final_conv(x)

# Example usage
model = UNet(in_channels=3, num_classes=21)
x = torch.randn(2, 3, 256, 256)
output = model(x)
print(f"Output shape: {output.shape}")  # torch.Size([2, 21, 256, 256])
\`\`\`

### DeepLab with Atrous Convolution

DeepLab uses atrous (dilated) convolutions to capture multi-scale context.

\`\`\`python
class ASPPModule(nn.Module):
    """Atrous Spatial Pyramid Pooling module"""
    def __init__(self, in_channels, out_channels, rates=[6, 12, 18]):
        super().__init__()

        # 1x1 convolution
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

        # Atrous convolutions with different rates
        self.atrous_convs = nn.ModuleList()
        for rate in rates:
            self.atrous_convs.append(nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 3,
                         padding=rate, dilation=rate, bias=False),
                nn.BatchNorm2d(out_channels),
                nn.ReLU(inplace=True)
            ))

        # Global average pooling
        self.global_pool = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

        # Projection
        num_branches = 2 + len(rates)  # 1x1 + atrous + global pool
        self.project = nn.Sequential(
            nn.Conv2d(out_channels * num_branches, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5)
        )

    def forward(self, x):
        size = x.shape[2:]

        features = [self.conv1(x)]

        for atrous_conv in self.atrous_convs:
            features.append(atrous_conv(x))

        # Global pooling branch
        global_feat = self.global_pool(x)
        global_feat = F.interpolate(global_feat, size=size, mode='bilinear',
                                    align_corners=False)
        features.append(global_feat)

        # Concatenate and project
        x = torch.cat(features, dim=1)
        x = self.project(x)

        return x
\`\`\`

### Segmentation Loss Functions

\`\`\`python
class DiceLoss(nn.Module):
    """Dice loss for segmentation"""
    def __init__(self, smooth=1e-6):
        super().__init__()
        self.smooth = smooth

    def forward(self, predictions, targets):
        predictions = torch.sigmoid(predictions)

        # Flatten
        predictions = predictions.view(-1)
        targets = targets.view(-1)

        intersection = (predictions * targets).sum()
        dice = (2. * intersection + self.smooth) / (
            predictions.sum() + targets.sum() + self.smooth
        )

        return 1 - dice

class FocalLoss(nn.Module):
    """Focal loss for handling class imbalance"""
    def __init__(self, alpha=0.25, gamma=2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, predictions, targets):
        ce_loss = F.cross_entropy(predictions, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss.mean()

class CombinedLoss(nn.Module):
    """Combined Cross-Entropy and Dice loss"""
    def __init__(self, ce_weight=0.5, dice_weight=0.5):
        super().__init__()
        self.ce_weight = ce_weight
        self.dice_weight = dice_weight
        self.ce_loss = nn.CrossEntropyLoss()
        self.dice_loss = DiceLoss()

    def forward(self, predictions, targets):
        ce = self.ce_loss(predictions, targets)
        dice = self.dice_loss(predictions, targets)
        return self.ce_weight * ce + self.dice_weight * dice
\`\`\`

---

## Transfer Learning

Transfer learning leverages pretrained models to achieve better results with less data and training time.

### Feature Extraction

\`\`\`python
import torch
import torch.nn as nn
from torchvision import models

class FeatureExtractor(nn.Module):
    """Use pretrained model as feature extractor"""
    def __init__(self, num_classes, freeze_backbone=True):
        super().__init__()

        # Load pretrained ResNet
        self.backbone = models.resnet50(pretrained=True)

        # Freeze backbone weights
        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        # Get the number of features from the backbone
        num_features = self.backbone.fc.in_features

        # Replace the classifier
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

# Example: Fine-tuning with different learning rates
def create_optimizer_with_layer_lr(model, base_lr=1e-4, fc_lr=1e-3):
    """Create optimizer with different learning rates for different layers"""
    backbone_params = []
    fc_params = []

    for name, param in model.named_parameters():
        if 'fc' in name:
            fc_params.append(param)
        else:
            backbone_params.append(param)

    optimizer = torch.optim.Adam([
        {'params': backbone_params, 'lr': base_lr},
        {'params': fc_params, 'lr': fc_lr}
    ])

    return optimizer
\`\`\`

### Fine-Tuning Strategies

\`\`\`python
class GradualUnfreezing:
    """Gradually unfreeze layers during training"""
    def __init__(self, model, layer_groups, unfreeze_schedule):
        """
        Args:
            model: The model to train
            layer_groups: List of layer name patterns
            unfreeze_schedule: Dict mapping epoch -> layers to unfreeze
        """
        self.model = model
        self.layer_groups = layer_groups
        self.unfreeze_schedule = unfreeze_schedule

        # Initially freeze all layers
        for param in model.parameters():
            param.requires_grad = False

    def step(self, epoch):
        """Check and unfreeze layers based on current epoch"""
        if epoch in self.unfreeze_schedule:
            layers_to_unfreeze = self.unfreeze_schedule[epoch]

            for name, param in self.model.named_parameters():
                for layer_pattern in layers_to_unfreeze:
                    if layer_pattern in name:
                        param.requires_grad = True
                        print(f"Epoch {epoch}: Unfreezing {name}")

def transfer_learning_pipeline(train_loader, val_loader, num_classes, epochs=30):
    """Complete transfer learning training pipeline"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Create model
    model = FeatureExtractor(num_classes, freeze_backbone=True)
    model.to(device)

    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = create_optimizer_with_layer_lr(model)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', patience=3, factor=0.5
    )

    # Gradual unfreezing schedule
    unfreezer = GradualUnfreezing(model,
        layer_groups=['layer4', 'layer3', 'layer2', 'layer1'],
        unfreeze_schedule={
            10: ['layer4'],
            15: ['layer3'],
            20: ['layer2', 'layer1']
        }
    )

    best_val_acc = 0.0

    for epoch in range(epochs):
        # Check for layer unfreezing
        unfreezer.step(epoch)

        # Training phase
        model.train()
        train_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

        train_acc = 100. * correct / total

        # Validation phase
        model.eval()
        val_loss = 0.0
        correct = 0
        total = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item()
                _, predicted = outputs.max(1)
                total += labels.size(0)
                correct += predicted.eq(labels).sum().item()

        val_acc = 100. * correct / total
        scheduler.step(val_loss)

        print(f"Epoch {epoch+1}/{epochs}")
        print(f"  Train Loss: {train_loss/len(train_loader):.4f}, Acc: {train_acc:.2f}%")
        print(f"  Val Loss: {val_loss/len(val_loader):.4f}, Acc: {val_acc:.2f}%")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'best_model.pt')

    return model
\`\`\`

---

## Data Augmentation

Data augmentation is crucial for improving model generalization, especially when training data is limited.

### Standard Augmentations

\`\`\`python
from torchvision import transforms
import albumentations as A
from albumentations.pytorch import ToTensorV2
import random
import numpy as np

# PyTorch transforms
pytorch_train_transforms = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    transforms.RandomErasing(p=0.5, scale=(0.02, 0.33), ratio=(0.3, 3.3)),
])

# Albumentations (recommended for more flexibility)
albumentations_train_transforms = A.Compose([
    A.RandomResizedCrop(224, 224, scale=(0.8, 1.0)),
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.1),
    A.Rotate(limit=15, p=0.5),
    A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.5),
    A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=15, p=0.5),
    A.OneOf([
        A.GaussNoise(var_limit=(10.0, 50.0)),
        A.GaussianBlur(blur_limit=3),
        A.MotionBlur(blur_limit=3),
    ], p=0.3),
    A.CoarseDropout(max_holes=8, max_height=16, max_width=16, p=0.3),
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ToTensorV2(),
])
\`\`\`

### Advanced Augmentations

#### MixUp and CutMix

\`\`\`python
def mixup(images, labels, alpha=0.2):
    """
    MixUp augmentation: blend two images and their labels

    Args:
        images: Batch of images (B, C, H, W)
        labels: Batch of labels (B,)
        alpha: Beta distribution parameter

    Returns:
        Mixed images and labels
    """
    batch_size = images.size(0)

    # Sample mixing coefficient
    lam = np.random.beta(alpha, alpha)

    # Random permutation for pairing
    index = torch.randperm(batch_size)

    # Mix images
    mixed_images = lam * images + (1 - lam) * images[index]

    # Return mixed data and labels for both components
    return mixed_images, labels, labels[index], lam

def cutmix(images, labels, alpha=1.0):
    """
    CutMix augmentation: cut and paste patches between images

    Args:
        images: Batch of images (B, C, H, W)
        labels: Batch of labels (B,)
        alpha: Beta distribution parameter

    Returns:
        Mixed images and labels
    """
    batch_size, _, h, w = images.size()

    # Sample mixing coefficient
    lam = np.random.beta(alpha, alpha)

    # Random permutation for pairing
    index = torch.randperm(batch_size)

    # Calculate cut region
    cut_ratio = np.sqrt(1 - lam)
    cut_w = int(w * cut_ratio)
    cut_h = int(h * cut_ratio)

    # Random center point
    cx = np.random.randint(w)
    cy = np.random.randint(h)

    # Clip to image boundaries
    x1 = np.clip(cx - cut_w // 2, 0, w)
    x2 = np.clip(cx + cut_w // 2, 0, w)
    y1 = np.clip(cy - cut_h // 2, 0, h)
    y2 = np.clip(cy + cut_h // 2, 0, h)

    # Apply cut
    mixed_images = images.clone()
    mixed_images[:, :, y1:y2, x1:x2] = images[index, :, y1:y2, x1:x2]

    # Adjust lambda based on actual cut size
    lam = 1 - ((x2 - x1) * (y2 - y1) / (w * h))

    return mixed_images, labels, labels[index], lam
\`\`\`

#### AutoAugment and RandAugment

\`\`\`python
from torchvision.transforms import autoaugment, AutoAugmentPolicy

# AutoAugment with ImageNet policy
auto_augment_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    autoaugment.AutoAugment(policy=AutoAugmentPolicy.IMAGENET),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# RandAugment
rand_augment_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    autoaugment.RandAugment(num_ops=2, magnitude=9),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# TrivialAugment
trivial_augment_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.RandomCrop(224),
    autoaugment.TrivialAugmentWide(),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])
\`\`\`

---

## OpenCV Fundamentals

OpenCV is the most widely used library for traditional computer vision tasks and image processing.

### Basic Operations

\`\`\`python
import cv2
import numpy as np

def load_and_display(image_path):
    """Load and display an image"""
    # Read image (BGR format by default)
    img = cv2.imread(image_path)

    # Get image properties
    height, width, channels = img.shape
    print(f"Image size: {width}x{height}, Channels: {channels}")

    # Convert to RGB for display
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Resize image
    img_resized = cv2.resize(img, (224, 224), interpolation=cv2.INTER_LINEAR)

    # Rotate image
    center = (width // 2, height // 2)
    rotation_matrix = cv2.getRotationMatrix2D(center, 45, 1.0)
    img_rotated = cv2.warpAffine(img, rotation_matrix, (width, height))

    return img, img_rgb, img_resized, img_rotated

def image_filtering(image):
    """Apply various filters to an image"""
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Median blur (good for salt-and-pepper noise)
    median_blurred = cv2.medianBlur(gray, 5)

    # Bilateral filter (edge-preserving smoothing)
    bilateral = cv2.bilateralFilter(gray, 9, 75, 75)

    # Sharpening using unsharp masking
    gaussian = cv2.GaussianBlur(gray, (0, 0), 3)
    sharpened = cv2.addWeighted(gray, 1.5, gaussian, -0.5, 0)

    return {
        'gray': gray,
        'blurred': blurred,
        'median': median_blurred,
        'bilateral': bilateral,
        'sharpened': sharpened
    }
\`\`\`

### Edge Detection

\`\`\`python
def edge_detection(image):
    """Apply various edge detection methods"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Canny edge detection
    canny_edges = cv2.Canny(blurred, 50, 150)

    # Sobel operators
    sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
    sobel_combined = cv2.magnitude(sobel_x, sobel_y)

    # Laplacian
    laplacian = cv2.Laplacian(blurred, cv2.CV_64F)

    return {
        'canny': canny_edges,
        'sobel_x': np.abs(sobel_x).astype(np.uint8),
        'sobel_y': np.abs(sobel_y).astype(np.uint8),
        'sobel_combined': sobel_combined.astype(np.uint8),
        'laplacian': np.abs(laplacian).astype(np.uint8)
    }
\`\`\`

### Contour Detection and Analysis

\`\`\`python
def find_and_draw_contours(image):
    """Find and analyze contours in an image"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Threshold the image
    _, thresh = cv2.threshold(blurred, 127, 255, cv2.THRESH_BINARY)

    # Find contours
    contours, hierarchy = cv2.findContours(
        thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )

    # Draw all contours
    result = image.copy()
    cv2.drawContours(result, contours, -1, (0, 255, 0), 2)

    # Analyze each contour
    for i, contour in enumerate(contours):
        # Contour area
        area = cv2.contourArea(contour)

        # Contour perimeter
        perimeter = cv2.arcLength(contour, True)

        # Bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)

        # Minimum enclosing circle
        (cx, cy), radius = cv2.minEnclosingCircle(contour)

        # Fit ellipse (if enough points)
        if len(contour) >= 5:
            ellipse = cv2.fitEllipse(contour)

        # Approximate polygon
        epsilon = 0.02 * perimeter
        approx = cv2.approxPolyDP(contour, epsilon, True)

        print(f"Contour {i}: Area={area:.0f}, Perimeter={perimeter:.0f}, "
              f"Vertices={len(approx)}")

    return result, contours
\`\`\`

### Feature Detection

\`\`\`python
def detect_features(image):
    """Detect keypoints and descriptors using various methods"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ORB (Oriented FAST and Rotated BRIEF)
    orb = cv2.ORB_create(nfeatures=500)
    keypoints_orb, descriptors_orb = orb.detectAndCompute(gray, None)

    # SIFT (Scale-Invariant Feature Transform)
    sift = cv2.SIFT_create()
    keypoints_sift, descriptors_sift = sift.detectAndCompute(gray, None)

    # Draw keypoints
    img_orb = cv2.drawKeypoints(image, keypoints_orb, None,
                                 color=(0, 255, 0),
                                 flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

    img_sift = cv2.drawKeypoints(image, keypoints_sift, None,
                                  color=(0, 255, 0),
                                  flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)

    return {
        'orb_keypoints': keypoints_orb,
        'orb_descriptors': descriptors_orb,
        'orb_image': img_orb,
        'sift_keypoints': keypoints_sift,
        'sift_descriptors': descriptors_sift,
        'sift_image': img_sift
    }

def match_features(img1, img2):
    """Match features between two images"""
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

    # Detect features
    orb = cv2.ORB_create(nfeatures=500)
    kp1, des1 = orb.detectAndCompute(gray1, None)
    kp2, des2 = orb.detectAndCompute(gray2, None)

    # Match features using BFMatcher
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)

    # Sort matches by distance
    matches = sorted(matches, key=lambda x: x.distance)

    # Draw top matches
    result = cv2.drawMatches(img1, kp1, img2, kp2, matches[:50], None,
                             flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS)

    return result, matches
\`\`\`

### Morphological Operations

\`\`\`python
def morphological_operations(image):
    """Apply morphological operations"""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

    # Define kernels
    kernel_3x3 = np.ones((3, 3), np.uint8)
    kernel_5x5 = np.ones((5, 5), np.uint8)

    # Erosion - shrinks white regions
    eroded = cv2.erode(binary, kernel_3x3, iterations=1)

    # Dilation - expands white regions
    dilated = cv2.dilate(binary, kernel_3x3, iterations=1)

    # Opening - erosion followed by dilation (removes small noise)
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel_5x5)

    # Closing - dilation followed by erosion (fills small holes)
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_5x5)

    # Gradient - difference between dilation and erosion
    gradient = cv2.morphologyEx(binary, cv2.MORPH_GRADIENT, kernel_3x3)

    # Top hat - difference between input and opening
    tophat = cv2.morphologyEx(binary, cv2.MORPH_TOPHAT, kernel_5x5)

    # Black hat - difference between closing and input
    blackhat = cv2.morphologyEx(binary, cv2.MORPH_BLACKHAT, kernel_5x5)

    return {
        'eroded': eroded,
        'dilated': dilated,
        'opened': opened,
        'closed': closed,
        'gradient': gradient,
        'tophat': tophat,
        'blackhat': blackhat
    }
\`\`\`

---

## Interview Key Points

### Core Concepts

**Q1: Explain the difference between semantic segmentation, instance segmentation, and panoptic segmentation.**

- **Semantic Segmentation**: Assigns a class label to every pixel but does not differentiate between instances of the same class. All cars in an image would have the same label.

- **Instance Segmentation**: Detects and segments individual object instances. Each car would have a unique identifier, but background classes are not segmented.

- **Panoptic Segmentation**: Combines both approaches - assigns instance labels to "things" (countable objects like cars, people) and class labels to "stuff" (uncountable regions like sky, grass).

**Q2: What is the receptive field and why is it important?**

The receptive field is the region of the input image that influences a particular feature in a deeper layer. It is crucial because:

- Determines what context the network can see at each layer
- Larger receptive fields can capture more global information
- Too small a receptive field limits the network's ability to understand relationships between distant parts of an image

**Receptive Field Calculation:**

$$RF_l = RF_{l-1} + (K_l - 1) \times \prod_{i=1}^{l-1} S_i$$

where $K_l$ is the kernel size at layer $l$ and $S_i$ is the stride at layer $i$.

**Q3: How do residual connections help train deeper networks?**

Residual connections (skip connections) help by:

1. **Gradient Flow**: Create shortcuts for gradients to flow backward, mitigating vanishing gradients
2. **Identity Mapping**: Network can learn identity function easily by setting residual weights to zero
3. **Feature Reuse**: Lower-level features can be directly used by higher layers
4. **Ensemble Effect**: Can be interpreted as an ensemble of shallower networks

\`\`\`python
# Residual connection
output = F.relu(block(x) + x)  # Adding input to output
\`\`\`

**Q4: Compare one-stage and two-stage object detectors.**

| Aspect | One-Stage (YOLO, SSD) | Two-Stage (Faster R-CNN) |
|--------|----------------------|-------------------------|
| Speed | Faster | Slower |
| Accuracy | Good | Generally higher |
| Small objects | May struggle | Better performance |
| Architecture | Single network | Region proposal + classification |
| Use case | Real-time applications | High accuracy requirements |

**Q5: What is the purpose of Feature Pyramid Networks (FPN)?**

FPN addresses the challenge of detecting objects at multiple scales by:

1. Building a top-down pathway with lateral connections
2. Creating feature maps at multiple resolutions
3. Combining high-level semantic information with low-level spatial details
4. Enabling detection of both small and large objects effectively

### Practical Engineering Questions

**Q6: How do you handle class imbalance in object detection?**

\`\`\`python
# Focal Loss - down-weight easy examples
class FocalLoss(nn.Module):
    def __init__(self, alpha=0.25, gamma=2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma

    def forward(self, pred, target):
        ce_loss = F.cross_entropy(pred, target, reduction='none')
        pt = torch.exp(-ce_loss)
        return (self.alpha * (1 - pt) ** self.gamma * ce_loss).mean()

# Hard negative mining
def hard_negative_mining(losses, pos_mask, neg_pos_ratio=3):
    """Select hard negatives based on loss values"""
    num_pos = pos_mask.sum()
    num_neg = min(num_pos * neg_pos_ratio, (~pos_mask).sum())

    neg_losses = losses.clone()
    neg_losses[pos_mask] = 0
    _, neg_idx = neg_losses.topk(num_neg)

    return neg_idx

# Class weights
class_weights = torch.tensor([1.0, 10.0, 5.0])  # Higher for rare classes
criterion = nn.CrossEntropyLoss(weight=class_weights)
\`\`\`

**Q7: What techniques can improve model inference speed?**

1. **Model Optimization**:
   - Pruning: Remove unimportant weights
   - Quantization: Reduce precision (FP32 -> INT8)
   - Knowledge distillation: Train smaller model from larger one

2. **Architecture Changes**:
   - Use efficient backbones (MobileNet, EfficientNet)
   - Depthwise separable convolutions
   - Reduce input resolution

3. **Deployment Optimization**:
   - TensorRT, ONNX Runtime
   - Batch processing
   - GPU optimization

\`\`\`python
# Quantization example
model_quantized = torch.quantization.quantize_dynamic(
    model, {nn.Linear, nn.Conv2d}, dtype=torch.qint8
)

# ONNX export
torch.onnx.export(
    model, dummy_input, "model.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}}
)
\`\`\`

**Q8: How do you evaluate object detection models?**

Key metrics:

1. **IoU (Intersection over Union)**: Measures overlap between predicted and ground truth boxes
2. **Precision/Recall**: At various IoU thresholds
3. **AP (Average Precision)**: Area under precision-recall curve for each class
4. **mAP (mean Average Precision)**: Average of AP across all classes

\`\`\`python
def calculate_ap(recalls, precisions):
    """Calculate Average Precision using 11-point interpolation"""
    ap = 0.0
    for t in np.arange(0, 1.1, 0.1):
        precisions_above_t = precisions[recalls >= t]
        if len(precisions_above_t) > 0:
            ap += np.max(precisions_above_t) / 11
    return ap

# COCO-style evaluation uses IoU thresholds from 0.5 to 0.95
# mAP@0.5: IoU threshold of 0.5
# mAP@0.5:0.95: Average over multiple IoU thresholds
\`\`\`

**Q9: Explain batch normalization and its role in CNNs.**

Batch Normalization normalizes activations within each mini-batch:

$$\hat{x} = \frac{x - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}$$
$$y = \gamma \hat{x} + \beta$$

**Benefits**:
- Reduces internal covariate shift
- Allows higher learning rates
- Acts as regularization
- Makes training more stable

**Considerations**:
- Behaves differently during training and inference
- Batch size affects performance
- Layer Normalization may be preferred for transformers

**Q10: What are common data augmentation strategies for different CV tasks?**

| Task | Recommended Augmentations |
|------|--------------------------|
| Classification | RandomCrop, HorizontalFlip, ColorJitter, MixUp, CutMix |
| Object Detection | Scale, Crop (avoiding cutting objects), Mosaic, Photometric distortions |
| Segmentation | Elastic deformations, Rotation, Scaling (applied to both image and mask) |
| Pose Estimation | Affine transforms, Scale, Rotation (transform keypoints accordingly) |

---

## Further Reading

### Recommended Papers

1. **Classic Architectures**:
   - "ImageNet Classification with Deep Convolutional Neural Networks" (AlexNet, 2012)
   - "Very Deep Convolutional Networks for Large-Scale Image Recognition" (VGG, 2014)
   - "Deep Residual Learning for Image Recognition" (ResNet, 2015)

2. **Object Detection**:
   - "Faster R-CNN: Towards Real-Time Object Detection" (2015)
   - "You Only Look Once: Unified, Real-Time Object Detection" (YOLO, 2016)
   - "Feature Pyramid Networks for Object Detection" (FPN, 2017)

3. **Segmentation**:
   - "U-Net: Convolutional Networks for Biomedical Image Segmentation" (2015)
   - "Encoder-Decoder with Atrous Separable Convolution for Semantic Image Segmentation" (DeepLabV3+, 2018)
   - "Mask R-CNN" (2017)

4. **Modern Architectures**:
   - "EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks" (2019)
   - "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale" (ViT, 2020)
   - "Swin Transformer: Hierarchical Vision Transformer using Shifted Windows" (2021)

### Online Courses

- **Stanford CS231n**: Convolutional Neural Networks for Visual Recognition
- **Fast.ai**: Practical Deep Learning for Coders
- **Coursera**: Deep Learning Specialization by Andrew Ng

### Libraries and Frameworks

1. **PyTorch Ecosystem**:
   - torchvision: Pre-trained models and transforms
   - Detectron2: Facebook's object detection library
   - MMDetection: OpenMMLab detection toolbox

2. **TensorFlow Ecosystem**:
   - TensorFlow Object Detection API
   - Keras Applications

3. **Other Tools**:
   - OpenCV: Traditional computer vision
   - Albumentations: Data augmentation
   - ONNX: Model interoperability

### Books

- "Deep Learning" by Ian Goodfellow, Yoshua Bengio, and Aaron Courville
- "Computer Vision: Algorithms and Applications" by Richard Szeliski
- "Programming Computer Vision with Python" by Jan Erik Solem

---

## Summary

This guide covered the essential topics in computer vision:

1. **CV Tasks**: Understanding the spectrum from classification to segmentation
2. **Preprocessing**: Proper data preparation and normalization
3. **CNN Architectures**: From VGG to Vision Transformers
4. **Object Detection**: One-stage and two-stage approaches
5. **Segmentation**: Semantic, instance, and panoptic methods
6. **Transfer Learning**: Leveraging pretrained models effectively
7. **Data Augmentation**: Techniques to improve generalization
8. **OpenCV**: Traditional CV operations and feature detection
9. **Interview Preparation**: Key concepts and practical questions

Computer vision continues to evolve rapidly, with new architectures and techniques emerging regularly. The fundamentals covered here provide a solid foundation for understanding both classical approaches and modern deep learning methods. To stay current, focus on reading recent papers, experimenting with new models, and applying these techniques to real-world problems.

The key to mastering computer vision is combining theoretical understanding with hands-on practice. Start with simple classification tasks, then progressively tackle more complex problems like detection and segmentation. Use pretrained models and transfer learning to get started quickly, then dive deeper into custom architectures as your understanding grows.
