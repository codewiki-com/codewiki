---
title: 时间序列深度学习：LSTM、TCN与Transformer
description: 深入掌握深度学习时间序列预测方法：LSTM、Temporal CNN、Transformer架构与PyTorch实战
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 时间序列
  - 深度学习
  - LSTM
  - Transformer
  - TCN
  - PyTorch
status: imported
origin: old/src/content/docs/datascience/time-series-deep.zh.md
divergence: 0.117
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 22
  lastUpdated: 2026-01-07
---

深度学习在时间序列预测领域取得了突破性进展，从经典的循环神经网络（RNN/LSTM）到时序卷积网络（TCN），再到近年来席卷各领域的Transformer架构，这些方法为复杂时间序列建模提供了强大的工具。本文将系统介绍这些深度学习方法的原理与PyTorch实现。

---

## 深度学习时序预测概述

### 为什么使用深度学习

传统时间序列方法（如ARIMA、指数平滑）虽然在许多场景下表现良好，但面对以下挑战时存在局限：

| 挑战 | 传统方法局限 | 深度学习优势 |
|------|-------------|-------------|
| 非线性关系 | 主要处理线性依赖 | 自动学习复杂非线性模式 |
| 多变量输入 | 扩展困难 | 自然支持多维输入 |
| 长距离依赖 | 随距离衰减 | LSTM/Transformer擅长捕捉 |
| 特征工程 | 需手动设计 | 自动特征提取 |
| 多任务学习 | 难以实现 | 灵活的多输出架构 |

### 深度学习时序方法演进

```
RNN (1986) -> LSTM (1997) -> GRU (2014) -> Seq2Seq (2014)
                                              |
TCN (2018) <- WaveNet (2016) <- Dilated Conv (2016)
                                              |
Transformer (2017) -> Informer (2021) -> Autoformer (2021) -> PatchTST (2023)
```

### 基础环境配置

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error

# 检查GPU
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'使用设备: {device}')

# 设置随机种子
def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True

set_seed(42)
```

---

## LSTM长短期记忆网络

### LSTM原理回顾

LSTM通过门控机制解决了标准RNN的梯度消失问题，能够学习长距离依赖关系。

**LSTM核心公式：**

遗忘门：$f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$

输入门：$i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$

候选记忆：$\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C)$

记忆单元：$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$

输出门：$o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o)$

隐藏状态：$h_t = o_t \odot \tanh(C_t)$

### 时序数据集构建

```python
class TimeSeriesDataset(Dataset):
    """时间序列数据集"""
    def __init__(self, data, seq_length, pred_length=1, stride=1):
        """
        Args:
            data: numpy数组，形状为 (n_samples, n_features) 或 (n_samples,)
            seq_length: 输入序列长度（回看窗口）
            pred_length: 预测序列长度
            stride: 滑动步长
        """
        self.seq_length = seq_length
        self.pred_length = pred_length

        # 确保数据为2D
        if len(data.shape) == 1:
            data = data.reshape(-1, 1)

        self.data = torch.FloatTensor(data)

        # 计算有效样本数
        self.n_samples = (len(data) - seq_length - pred_length) // stride + 1
        self.stride = stride

    def __len__(self):
        return self.n_samples

    def __getitem__(self, idx):
        start = idx * self.stride
        end = start + self.seq_length

        x = self.data[start:end]
        y = self.data[end:end + self.pred_length, 0]  # 只预测第一个特征

        return x, y


def create_dataloaders(data, seq_length, pred_length, batch_size,
                       train_ratio=0.7, val_ratio=0.15):
    """创建训练、验证、测试数据加载器"""
    n = len(data)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_data = data[:train_end]
    val_data = data[train_end - seq_length:val_end]  # 保留上下文
    test_data = data[val_end - seq_length:]

    train_dataset = TimeSeriesDataset(train_data, seq_length, pred_length)
    val_dataset = TimeSeriesDataset(val_data, seq_length, pred_length)
    test_dataset = TimeSeriesDataset(test_data, seq_length, pred_length)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader


# 使用示例
np.random.seed(42)
n = 2000
t = np.linspace(0, 50, n)
# 生成复杂时序：趋势 + 多周期 + 噪声
data = (0.02 * t +
        2 * np.sin(2 * np.pi * t / 50) +
        0.5 * np.sin(2 * np.pi * t / 10) +
        np.random.normal(0, 0.3, n))

# 标准化
scaler = StandardScaler()
data_scaled = scaler.fit_transform(data.reshape(-1, 1))

# 创建数据加载器
train_loader, val_loader, test_loader = create_dataloaders(
    data_scaled, seq_length=60, pred_length=1, batch_size=32
)

print(f"训练批次数: {len(train_loader)}")
print(f"验证批次数: {len(val_loader)}")
print(f"测试批次数: {len(test_loader)}")
```

### 基础LSTM模型

```python
class LSTMForecaster(nn.Module):
    """基础LSTM时序预测模型"""
    def __init__(self, input_size, hidden_size, num_layers, output_size,
                 dropout=0.2, bidirectional=False):
        super().__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        # LSTM层
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )

        # 输出层
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * self.num_directions, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, output_size)
        )

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        batch_size = x.size(0)

        # LSTM前向传播
        lstm_out, (hidden, cell) = self.lstm(x)
        # lstm_out: (batch, seq_len, hidden_size * num_directions)

        # 使用最后一个时间步的输出
        if self.bidirectional:
            # 拼接正向和反向的最后隐藏状态
            hidden_forward = hidden[-2]
            hidden_backward = hidden[-1]
            out = torch.cat([hidden_forward, hidden_backward], dim=1)
        else:
            out = hidden[-1]

        # 全连接层
        out = self.fc(out)

        return out


# 创建模型
model = LSTMForecaster(
    input_size=1,
    hidden_size=64,
    num_layers=2,
    output_size=1,
    dropout=0.2
).to(device)

print(model)
print(f"模型参数量: {sum(p.numel() for p in model.parameters()):,}")
```

### 带注意力机制的LSTM

```python
class AttentionLayer(nn.Module):
    """注意力机制层"""
    def __init__(self, hidden_size):
        super().__init__()
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1)
        )

    def forward(self, lstm_output):
        # lstm_output: (batch, seq_len, hidden_size)

        # 计算注意力权重
        attention_weights = self.attention(lstm_output)  # (batch, seq_len, 1)
        attention_weights = torch.softmax(attention_weights, dim=1)

        # 加权求和
        context = torch.sum(attention_weights * lstm_output, dim=1)

        return context, attention_weights


class LSTMWithAttention(nn.Module):
    """带注意力机制的LSTM"""
    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.attention = AttentionLayer(hidden_size)

        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, output_size)
        )

    def forward(self, x, return_attention=False):
        lstm_out, _ = self.lstm(x)
        context, attention_weights = self.attention(lstm_out)
        out = self.fc(context)

        if return_attention:
            return out, attention_weights
        return out


# 创建带注意力的LSTM
model_attn = LSTMWithAttention(
    input_size=1,
    hidden_size=64,
    num_layers=2,
    output_size=1
).to(device)

# 测试模型
x_test = torch.randn(4, 60, 1).to(device)
output, attn_weights = model_attn(x_test, return_attention=True)
print(f"输出形状: {output.shape}")
print(f"注意力权重形状: {attn_weights.shape}")
```

### Seq2Seq多步预测

```python
class Encoder(nn.Module):
    """编码器"""
    def __init__(self, input_size, hidden_size, num_layers, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

    def forward(self, x):
        outputs, (hidden, cell) = self.lstm(x)
        return hidden, cell


class Decoder(nn.Module):
    """解码器"""
    def __init__(self, input_size, hidden_size, output_size, num_layers, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x, hidden, cell):
        output, (hidden, cell) = self.lstm(x, (hidden, cell))
        prediction = self.fc(output)
        return prediction, hidden, cell


class Seq2Seq(nn.Module):
    """Seq2Seq多步预测模型"""
    def __init__(self, input_size, hidden_size, output_size, num_layers,
                 pred_length, dropout=0.2, teacher_forcing_ratio=0.5):
        super().__init__()

        self.pred_length = pred_length
        self.teacher_forcing_ratio = teacher_forcing_ratio
        self.output_size = output_size

        self.encoder = Encoder(input_size, hidden_size, num_layers, dropout)
        self.decoder = Decoder(output_size, hidden_size, output_size, num_layers, dropout)

    def forward(self, x, target=None):
        batch_size = x.size(0)

        # 编码
        hidden, cell = self.encoder(x)

        # 准备解码器输入（使用编码器最后一个输出）
        decoder_input = x[:, -1:, :self.output_size]  # (batch, 1, output_size)

        outputs = []

        for t in range(self.pred_length):
            output, hidden, cell = self.decoder(decoder_input, hidden, cell)
            outputs.append(output)

            # Teacher Forcing
            if target is not None and np.random.random() < self.teacher_forcing_ratio:
                decoder_input = target[:, t:t+1, :]
            else:
                decoder_input = output

        outputs = torch.cat(outputs, dim=1)  # (batch, pred_length, output_size)
        return outputs.squeeze(-1)  # (batch, pred_length)


# 创建Seq2Seq模型
seq2seq_model = Seq2Seq(
    input_size=1,
    hidden_size=64,
    output_size=1,
    num_layers=2,
    pred_length=10,
    dropout=0.2
).to(device)

# 测试
x_test = torch.randn(4, 60, 1).to(device)
output = seq2seq_model(x_test)
print(f"多步预测输出形状: {output.shape}")  # (4, 10)
```

---

## Temporal CNN时序卷积网络

### TCN原理

时序卷积网络（Temporal Convolutional Network, TCN）使用因果卷积和膨胀卷积来处理序列数据，具有以下优势：

- **因果性**：确保预测只依赖于过去的信息
- **灵活的感受野**：通过膨胀卷积指数级扩展
- **并行计算**：比RNN更高效
- **稳定的梯度**：避免梯度消失/爆炸

**膨胀卷积公式：**

$$F(s) = (x *_d f)(s) = \sum_{i=0}^{k-1} f(i) \cdot x_{s-d \cdot i}$$

其中 $d$ 是膨胀率，$k$ 是卷积核大小。

### 因果卷积实现

```python
class CausalConv1d(nn.Module):
    """因果卷积：确保输出只依赖于过去的输入"""
    def __init__(self, in_channels, out_channels, kernel_size, dilation=1):
        super().__init__()
        # 因果卷积需要的padding：(kernel_size - 1) * dilation
        self.padding = (kernel_size - 1) * dilation

        self.conv = nn.Conv1d(
            in_channels=in_channels,
            out_channels=out_channels,
            kernel_size=kernel_size,
            padding=self.padding,
            dilation=dilation
        )

    def forward(self, x):
        # x: (batch, channels, seq_len)
        out = self.conv(x)
        # 移除右侧的padding以保持因果性
        if self.padding > 0:
            out = out[:, :, :-self.padding]
        return out


class TemporalBlock(nn.Module):
    """TCN的基本构建块"""
    def __init__(self, in_channels, out_channels, kernel_size, dilation, dropout=0.2):
        super().__init__()

        self.conv1 = CausalConv1d(in_channels, out_channels, kernel_size, dilation)
        self.bn1 = nn.BatchNorm1d(out_channels)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)

        self.conv2 = CausalConv1d(out_channels, out_channels, kernel_size, dilation)
        self.bn2 = nn.BatchNorm1d(out_channels)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)

        # 残差连接
        self.downsample = nn.Conv1d(in_channels, out_channels, 1) if in_channels != out_channels else None
        self.relu = nn.ReLU()

    def forward(self, x):
        residual = x

        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu1(out)
        out = self.dropout1(out)

        out = self.conv2(out)
        out = self.bn2(out)
        out = self.relu2(out)
        out = self.dropout2(out)

        if self.downsample is not None:
            residual = self.downsample(residual)

        return self.relu(out + residual)
```

### 完整TCN模型

```python
class TCN(nn.Module):
    """时序卷积网络"""
    def __init__(self, input_size, output_size, num_channels, kernel_size=3, dropout=0.2):
        """
        Args:
            input_size: 输入特征维度
            output_size: 输出维度
            num_channels: 各层通道数列表，如 [64, 64, 64, 64]
            kernel_size: 卷积核大小
            dropout: Dropout率
        """
        super().__init__()

        layers = []
        num_levels = len(num_channels)

        for i in range(num_levels):
            dilation = 2 ** i  # 指数增长的膨胀率
            in_channels = input_size if i == 0 else num_channels[i - 1]
            out_channels = num_channels[i]

            layers.append(
                TemporalBlock(
                    in_channels, out_channels, kernel_size, dilation, dropout
                )
            )

        self.network = nn.Sequential(*layers)
        self.fc = nn.Linear(num_channels[-1], output_size)

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        # 转换为 (batch, channels, seq_len)
        x = x.transpose(1, 2)

        out = self.network(x)

        # 使用最后一个时间步
        out = out[:, :, -1]

        out = self.fc(out)
        return out


# 创建TCN模型
tcn_model = TCN(
    input_size=1,
    output_size=1,
    num_channels=[32, 64, 64, 128],
    kernel_size=3,
    dropout=0.2
).to(device)

# 计算感受野
def calculate_receptive_field(num_layers, kernel_size):
    """计算TCN的感受野"""
    rf = 1
    for i in range(num_layers):
        dilation = 2 ** i
        rf += (kernel_size - 1) * dilation
    return rf

rf = calculate_receptive_field(4, 3)
print(f"TCN感受野: {rf}")
print(f"模型参数量: {sum(p.numel() for p in tcn_model.parameters()):,}")

# 测试
x_test = torch.randn(4, 60, 1).to(device)
output = tcn_model(x_test)
print(f"输出形状: {output.shape}")
```

### WaveNet风格架构

```python
class WaveNetBlock(nn.Module):
    """WaveNet风格的门控激活单元"""
    def __init__(self, residual_channels, skip_channels, kernel_size, dilation):
        super().__init__()

        self.dilated_conv = CausalConv1d(
            residual_channels, residual_channels * 2, kernel_size, dilation
        )

        self.residual_conv = nn.Conv1d(residual_channels, residual_channels, 1)
        self.skip_conv = nn.Conv1d(residual_channels, skip_channels, 1)

    def forward(self, x):
        # 膨胀卷积
        out = self.dilated_conv(x)

        # 门控激活
        tanh_out = torch.tanh(out[:, :out.size(1)//2, :])
        sigmoid_out = torch.sigmoid(out[:, out.size(1)//2:, :])
        gated = tanh_out * sigmoid_out

        # 残差连接和跳跃连接
        residual = self.residual_conv(gated) + x
        skip = self.skip_conv(gated)

        return residual, skip


class WaveNet(nn.Module):
    """简化版WaveNet"""
    def __init__(self, input_size, output_size, residual_channels=32,
                 skip_channels=64, num_layers=8, kernel_size=2):
        super().__init__()

        self.input_conv = nn.Conv1d(input_size, residual_channels, 1)

        self.blocks = nn.ModuleList()
        for i in range(num_layers):
            dilation = 2 ** (i % 4)  # 循环膨胀率
            self.blocks.append(
                WaveNetBlock(residual_channels, skip_channels, kernel_size, dilation)
            )

        self.output = nn.Sequential(
            nn.ReLU(),
            nn.Conv1d(skip_channels, skip_channels, 1),
            nn.ReLU(),
            nn.Conv1d(skip_channels, output_size, 1)
        )

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        x = x.transpose(1, 2)  # (batch, input_size, seq_len)

        x = self.input_conv(x)

        skip_sum = 0
        for block in self.blocks:
            x, skip = block(x)
            skip_sum = skip_sum + skip

        out = self.output(skip_sum)
        out = out[:, :, -1]  # 取最后一个时间步

        return out


wavenet_model = WaveNet(
    input_size=1,
    output_size=1,
    residual_channels=32,
    skip_channels=64,
    num_layers=8
).to(device)

print(f"WaveNet参数量: {sum(p.numel() for p in wavenet_model.parameters()):,}")
```

---

## Transformer时序架构

### Transformer时序应用

Transformer架构通过自注意力机制直接建模序列中任意两个位置的依赖关系，近年来在时间序列领域取得了显著成果。

**关键优势：**
- 并行计算，训练效率高
- 直接建模长距离依赖
- 可解释性强（注意力可视化）

**时序Transformer的挑战：**
- 自注意力复杂度 $O(L^2)$，长序列计算量大
- 需要位置编码保留时序信息
- 容易过拟合小数据集

### 位置编码

```python
class PositionalEncoding(nn.Module):
    """正弦位置编码"""
    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        # 创建位置编码矩阵
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x):
        # x: (batch, seq_len, d_model)
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class LearnablePositionalEncoding(nn.Module):
    """可学习的位置编码"""
    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        self.pe = nn.Parameter(torch.randn(1, max_len, d_model))

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class TemporalEmbedding(nn.Module):
    """时间特征嵌入（用于多周期时序）"""
    def __init__(self, d_model):
        super().__init__()
        self.hour_embed = nn.Embedding(24, d_model)
        self.day_embed = nn.Embedding(7, d_model)
        self.month_embed = nn.Embedding(12, d_model)

    def forward(self, hour, day, month):
        return self.hour_embed(hour) + self.day_embed(day) + self.month_embed(month)
```

### 基础Transformer时序模型

```python
class TransformerForecaster(nn.Module):
    """Transformer时序预测模型"""
    def __init__(self, input_size, d_model, nhead, num_encoder_layers,
                 dim_feedforward, output_size, dropout=0.1, max_len=500):
        super().__init__()

        self.d_model = d_model

        # 输入嵌入
        self.input_embedding = nn.Linear(input_size, d_model)

        # 位置编码
        self.pos_encoder = PositionalEncoding(d_model, max_len, dropout)

        # Transformer编码器
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_encoder_layers
        )

        # 输出层
        self.fc = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, output_size)
        )

    def generate_square_subsequent_mask(self, sz):
        """生成因果掩码"""
        mask = torch.triu(torch.ones(sz, sz), diagonal=1)
        mask = mask.masked_fill(mask == 1, float('-inf'))
        return mask

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        seq_len = x.size(1)

        # 嵌入和位置编码
        x = self.input_embedding(x) * np.sqrt(self.d_model)
        x = self.pos_encoder(x)

        # 因果掩码
        mask = self.generate_square_subsequent_mask(seq_len).to(x.device)

        # Transformer编码
        out = self.transformer_encoder(x, mask=mask)

        # 使用最后一个时间步
        out = out[:, -1, :]
        out = self.fc(out)

        return out


# 创建Transformer模型
transformer_model = TransformerForecaster(
    input_size=1,
    d_model=64,
    nhead=4,
    num_encoder_layers=3,
    dim_feedforward=256,
    output_size=1,
    dropout=0.1
).to(device)

print(f"Transformer参数量: {sum(p.numel() for p in transformer_model.parameters()):,}")

# 测试
x_test = torch.randn(4, 60, 1).to(device)
output = transformer_model(x_test)
print(f"输出形状: {output.shape}")
```

### Informer高效长序列预测

```python
class ProbAttention(nn.Module):
    """稀疏自注意力（Informer核心）"""
    def __init__(self, d_model, n_heads, factor=5, dropout=0.1):
        super().__init__()
        self.factor = factor
        self.n_heads = n_heads
        self.d_keys = d_model // n_heads

        self.query_proj = nn.Linear(d_model, d_model)
        self.key_proj = nn.Linear(d_model, d_model)
        self.value_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, queries, keys, values, attn_mask=None):
        B, L_Q, _ = queries.shape
        _, L_K, _ = keys.shape

        # 计算Q、K、V
        Q = self.query_proj(queries).view(B, L_Q, self.n_heads, self.d_keys).transpose(1, 2)
        K = self.key_proj(keys).view(B, L_K, self.n_heads, self.d_keys).transpose(1, 2)
        V = self.value_proj(values).view(B, L_K, self.n_heads, self.d_keys).transpose(1, 2)

        # 计算注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / np.sqrt(self.d_keys)

        if attn_mask is not None:
            scores.masked_fill_(attn_mask, float('-inf'))

        attn = torch.softmax(scores, dim=-1)
        attn = self.dropout(attn)

        out = torch.matmul(attn, V)
        out = out.transpose(1, 2).contiguous().view(B, L_Q, -1)
        out = self.out_proj(out)

        return out


class InformerEncoderLayer(nn.Module):
    """Informer编码器层"""
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()

        self.attention = ProbAttention(d_model, n_heads, dropout=dropout)
        self.conv1 = nn.Conv1d(d_model, d_ff, 1)
        self.conv2 = nn.Conv1d(d_ff, d_model, 1)

        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

        self.dropout = nn.Dropout(dropout)
        self.activation = nn.GELU()

    def forward(self, x, attn_mask=None):
        # 自注意力
        attn_out = self.attention(x, x, x, attn_mask)
        x = self.norm1(x + self.dropout(attn_out))

        # 前馈网络
        y = x.transpose(1, 2)
        y = self.dropout(self.activation(self.conv1(y)))
        y = self.dropout(self.conv2(y))
        y = y.transpose(1, 2)

        return self.norm2(x + y)


class InformerForecaster(nn.Module):
    """简化版Informer"""
    def __init__(self, input_size, d_model, n_heads, e_layers, d_ff,
                 output_size, pred_len=1, dropout=0.1):
        super().__init__()

        self.pred_len = pred_len

        self.embedding = nn.Linear(input_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout=dropout)

        self.encoder_layers = nn.ModuleList([
            InformerEncoderLayer(d_model, n_heads, d_ff, dropout)
            for _ in range(e_layers)
        ])

        self.projection = nn.Linear(d_model, output_size)

    def forward(self, x):
        # 嵌入
        x = self.embedding(x)
        x = self.pos_encoder(x)

        # 编码
        for layer in self.encoder_layers:
            x = layer(x)

        # 预测
        out = self.projection(x[:, -self.pred_len:, :])

        return out.squeeze(-1)


informer_model = InformerForecaster(
    input_size=1,
    d_model=64,
    n_heads=4,
    e_layers=2,
    d_ff=256,
    output_size=1,
    pred_len=1,
    dropout=0.1
).to(device)

print(f"Informer参数量: {sum(p.numel() for p in informer_model.parameters()):,}")
```

### PatchTST补丁时序Transformer

```python
class PatchEmbedding(nn.Module):
    """将时序分割为补丁并嵌入"""
    def __init__(self, input_size, patch_len, stride, d_model):
        super().__init__()
        self.patch_len = patch_len
        self.stride = stride

        self.projection = nn.Linear(patch_len * input_size, d_model)

    def forward(self, x):
        # x: (batch, seq_len, input_size)
        batch, seq_len, n_vars = x.shape

        # 分割为补丁
        num_patches = (seq_len - self.patch_len) // self.stride + 1

        patches = []
        for i in range(num_patches):
            start = i * self.stride
            patch = x[:, start:start + self.patch_len, :]
            patches.append(patch.reshape(batch, -1))

        patches = torch.stack(patches, dim=1)

        # 投影
        patches = self.projection(patches)

        return patches, num_patches


class PatchTST(nn.Module):
    """PatchTST: 基于补丁的时序Transformer"""
    def __init__(self, input_size, seq_len, patch_len, stride, d_model,
                 nhead, num_layers, d_ff, output_size, pred_len=1, dropout=0.1):
        super().__init__()

        self.pred_len = pred_len

        # 补丁嵌入
        self.patch_embedding = PatchEmbedding(input_size, patch_len, stride, d_model)

        # 计算补丁数量
        num_patches = (seq_len - patch_len) // stride + 1

        # 可学习的位置编码
        self.pos_embedding = nn.Parameter(torch.randn(1, num_patches, d_model))

        # Transformer编码器
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_ff,
            dropout=dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)

        # 预测头
        self.head = nn.Sequential(
            nn.Flatten(),
            nn.Linear(num_patches * d_model, d_model),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model, pred_len * output_size)
        )

        self.output_size = output_size

    def forward(self, x):
        # 补丁嵌入
        x, num_patches = self.patch_embedding(x)

        # 添加位置编码
        x = x + self.pos_embedding[:, :num_patches, :]

        # Transformer编码
        x = self.transformer(x)

        # 预测
        out = self.head(x)
        out = out.view(-1, self.pred_len, self.output_size)

        return out.squeeze(-1)


# 创建PatchTST
patchtst_model = PatchTST(
    input_size=1,
    seq_len=60,
    patch_len=8,
    stride=4,
    d_model=64,
    nhead=4,
    num_layers=2,
    d_ff=256,
    output_size=1,
    pred_len=1,
    dropout=0.1
).to(device)

print(f"PatchTST参数量: {sum(p.numel() for p in patchtst_model.parameters()):,}")
```

---

## 数据预处理与特征工程

### 时序数据标准化

```python
class TimeSeriesScaler:
    """时序数据标准化器"""
    def __init__(self, method='standard'):
        self.method = method

    def fit(self, data):
        if self.method == 'standard':
            self.mean = np.mean(data, axis=0)
            self.std = np.std(data, axis=0)
            self.std[self.std == 0] = 1
        elif self.method == 'minmax':
            self.min = np.min(data, axis=0)
            self.max = np.max(data, axis=0)
            self.range = self.max - self.min
            self.range[self.range == 0] = 1
        return self

    def transform(self, data):
        if self.method == 'standard':
            return (data - self.mean) / self.std
        elif self.method == 'minmax':
            return (data - self.min) / self.range

    def inverse_transform(self, data):
        if self.method == 'standard':
            return data * self.std + self.mean
        elif self.method == 'minmax':
            return data * self.range + self.min

    def fit_transform(self, data):
        return self.fit(data).transform(data)
```

### 时间特征提取

```python
def extract_time_features(timestamps):
    """从时间戳提取时间特征"""
    df = pd.DataFrame({'timestamp': timestamps})
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    features = pd.DataFrame()

    # 基础时间特征
    features['hour'] = df['timestamp'].dt.hour
    features['dayofweek'] = df['timestamp'].dt.dayofweek
    features['month'] = df['timestamp'].dt.month

    # 周期性编码
    features['hour_sin'] = np.sin(2 * np.pi * features['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * features['hour'] / 24)
    features['day_sin'] = np.sin(2 * np.pi * features['dayofweek'] / 7)
    features['day_cos'] = np.cos(2 * np.pi * features['dayofweek'] / 7)

    # 二进制特征
    features['is_weekend'] = (features['dayofweek'] >= 5).astype(int)

    return features
```

### 滞后特征和滚动统计

```python
def create_lag_features(data, lags=[1, 7, 14, 28]):
    """创建滞后特征"""
    df = pd.DataFrame({'value': data})
    for lag in lags:
        df[f'lag_{lag}'] = df['value'].shift(lag)
    return df


def create_rolling_features(data, windows=[7, 14, 28]):
    """创建滚动统计特征"""
    df = pd.DataFrame({'value': data})
    for window in windows:
        df[f'rolling_mean_{window}'] = df['value'].rolling(window).mean()
        df[f'rolling_std_{window}'] = df['value'].rolling(window).std()
    return df
```

---

## 模型训练与调优

### 训练循环封装

```python
class TimeSeriesTrainer:
    """时序模型训练器"""
    def __init__(self, model, criterion, optimizer, scheduler=None, device='cuda'):
        self.model = model.to(device)
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device
        self.train_losses = []
        self.val_losses = []
        self.best_val_loss = float('inf')

    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0

        for batch_x, batch_y in train_loader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            self.optimizer.zero_grad()
            output = self.model(batch_x)
            loss = self.criterion(output.squeeze(), batch_y.squeeze())
            loss.backward()

            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()
            total_loss += loss.item()

        return total_loss / len(train_loader)

    @torch.no_grad()
    def validate(self, val_loader):
        self.model.eval()
        total_loss = 0

        for batch_x, batch_y in val_loader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            output = self.model(batch_x)
            loss = self.criterion(output.squeeze(), batch_y.squeeze())
            total_loss += loss.item()

        return total_loss / len(val_loader)

    def train(self, train_loader, val_loader, epochs, early_stopping_patience=10,
              save_path='best_model.pt'):
        patience_counter = 0

        for epoch in range(epochs):
            train_loss = self.train_epoch(train_loader)
            val_loss = self.validate(val_loader)

            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)

            if self.scheduler:
                if isinstance(self.scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_loss)
                else:
                    self.scheduler.step()

            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                torch.save(self.model.state_dict(), save_path)
                patience_counter = 0
            else:
                patience_counter += 1

            if (epoch + 1) % 10 == 0:
                print(f'Epoch {epoch+1}/{epochs}, Train: {train_loss:.6f}, Val: {val_loss:.6f}')

            if patience_counter >= early_stopping_patience:
                print(f'Early stopping at epoch {epoch + 1}')
                break

        self.model.load_state_dict(torch.load(save_path))
        return self.train_losses, self.val_losses
```

### 评估指标

```python
def evaluate_forecast(y_true, y_pred, scaler=None):
    """评估时序预测模型"""
    if scaler:
        y_true = scaler.inverse_transform(y_true.reshape(-1, 1)).flatten()
        y_pred = scaler.inverse_transform(y_pred.reshape(-1, 1)).flatten()

    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)

    mask = y_true != 0
    mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

    print(f'MAE: {mae:.4f}, RMSE: {rmse:.4f}, MAPE: {mape:.2f}%')

    return {'MAE': mae, 'RMSE': rmse, 'MAPE': mape}
```

---

## 多变量时序预测

### 多输入单输出（MISO）

```python
class MultivariateLSTM(nn.Module):
    """多变量输入LSTM"""
    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, output_size)
        )

    def forward(self, x):
        lstm_out, (hidden, cell) = self.lstm(x)
        out = self.fc(hidden[-1])
        return out
```

### 多输入多输出（MIMO）

```python
class MIMOTransformer(nn.Module):
    """多输入多输出Transformer"""
    def __init__(self, n_features, d_model, nhead, num_layers, pred_length, dropout=0.1):
        super().__init__()

        self.n_features = n_features
        self.pred_length = pred_length

        self.embedding = nn.Linear(n_features, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout=dropout)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead,
            dim_feedforward=d_model * 4, dropout=dropout, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)

        self.output_projection = nn.Linear(d_model, n_features * pred_length)

    def forward(self, x):
        batch_size = x.size(0)
        x = self.embedding(x)
        x = self.pos_encoder(x)
        x = self.transformer(x)

        out = self.output_projection(x[:, -1, :])
        out = out.view(batch_size, self.pred_length, self.n_features)

        return out
```

---

## 完整实战案例

### 电力负荷预测

```python
class ElectricityLoadForecaster:
    """电力负荷预测系统"""

    def __init__(self, seq_length=168, pred_length=24, device='cuda'):
        self.seq_length = seq_length
        self.pred_length = pred_length
        self.device = device
        self.scaler = TimeSeriesScaler(method='standard')

    def prepare_data(self, data, timestamps):
        """准备数据"""
        time_features = extract_time_features(timestamps)
        selected = ['hour_sin', 'hour_cos', 'day_sin', 'day_cos', 'is_weekend']
        features = np.column_stack([data.reshape(-1, 1), time_features[selected].values])
        return features

    def build_model(self, model_type='transformer', **kwargs):
        """构建模型"""
        input_size = kwargs.get('input_size', 6)

        if model_type == 'lstm':
            model = Seq2Seq(
                input_size=input_size,
                hidden_size=kwargs.get('hidden_size', 128),
                output_size=1,
                num_layers=kwargs.get('num_layers', 2),
                pred_length=self.pred_length
            )
        elif model_type == 'transformer':
            model = TransformerForecaster(
                input_size=input_size,
                d_model=kwargs.get('d_model', 64),
                nhead=kwargs.get('nhead', 4),
                num_encoder_layers=kwargs.get('num_layers', 3),
                dim_feedforward=kwargs.get('dim_feedforward', 256),
                output_size=self.pred_length
            )

        return model.to(self.device)
```

---

## 面试要点与最佳实践

### 常见面试问题

**Q1: LSTM如何解决梯度消失问题？**

LSTM通过门控机制解决梯度消失：
- 遗忘门控制历史信息的保留
- 输入门控制新信息的写入
- 记忆单元提供恒定的梯度流通道

**Q2: TCN与LSTM的对比？**

| 方面 | TCN | LSTM |
|------|-----|------|
| 计算效率 | 高（并行） | 低（顺序） |
| 感受野 | 固定 | 理论上无限 |
| 梯度流动 | 稳定 | 可能消失 |

**Q3: 多步预测策略比较？**

| 策略 | 优点 | 缺点 |
|------|------|------|
| 递归 | 简单 | 误差累积 |
| 直接 | 无误差累积 | 模型数量多 |
| MIMO | 考虑步间关系 | 输出维度大 |
| Seq2Seq | 灵活 | 训练复杂 |

### 最佳实践

**模型选择指南**

| 数据特点 | 推荐模型 |
|----------|----------|
| 短序列 | LSTM, GRU |
| 中等序列 | TCN, Transformer |
| 长序列 | Informer, PatchTST |
| 多变量强相关 | 通道混合模型 |

**训练技巧**

```python
# 学习率调度
scheduler = optim.lr_scheduler.OneCycleLR(optimizer, max_lr=0.01, epochs=epochs, steps_per_epoch=len(train_loader))

# 梯度裁剪
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 模型量化
quantized_model = torch.quantization.quantize_dynamic(model, {nn.Linear, nn.LSTM}, dtype=torch.qint8)
```

### 常见陷阱

1. **数据泄露**：使用未来信息进行标准化
2. **忽略时序性**：使用随机划分而非时序划分
3. **过拟合**：模型过于复杂、正则化不足
4. **评估偏差**：只评估单一预测步

---

## 总结

本文系统介绍了深度学习在时间序列预测中的应用：

1. **LSTM网络**：通过门控机制处理序列数据
2. **TCN网络**：使用因果卷积和膨胀卷积
3. **Transformer架构**：自注意力机制建模长距离依赖
4. **数据处理**：标准化、时间特征提取
5. **训练优化**：学习率调度、早停、梯度裁剪
6. **多变量预测**：MISO、MIMO架构

深度学习时序预测是活跃的研究领域，持续关注最新进展对保持技术竞争力至关重要。
