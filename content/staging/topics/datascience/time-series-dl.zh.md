---
title: 时间序列分析：深度学习方法
description: 使用深度学习进行时序预测：LSTM、Temporal CNN和Transformer
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 时间序列
  - LSTM
  - Transformer
  - 深度学习
status: imported
origin: old/src/content/docs/datascience/time-series-dl.zh.md
divergence: 0.236
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 22
  lastUpdated: 2026-01-07
---

时间序列预测是机器学习领域最具挑战性的任务之一，广泛应用于金融预测、能源调度、交通流量、气象预报等众多场景。随着深度学习的发展，LSTM、Temporal CNN、Transformer 等架构在时序预测任务上取得了显著突破。本文将系统介绍时间序列深度学习的核心技术与实践方法。

---

## 序列建模挑战

### 时间序列的特殊性

时间序列数据具有以下独特特征，使其区别于一般的监督学习任务：

**1. 时间依赖性**

时间序列中的观测值通常不是独立同分布的，而是存在时间上的依赖关系：

$$y_t = f(y_{t-1}, y_{t-2}, ..., y_{t-p}) + \epsilon_t$$

其中 $p$ 是滞后阶数，$\epsilon_t$ 是噪声项。

**2. 趋势与季节性**

时间序列通常包含多种组成成分：

$$Y_t = T_t + S_t + C_t + R_t$$

- $T_t$：趋势成分（长期变化方向）
- $S_t$：季节性成分（周期性波动）
- $C_t$：周期成分（非固定周期波动）
- $R_t$：残差成分（随机噪声）

**3. 非平稳性**

许多真实时间序列是非平稳的，统计特性（均值、方差）随时间变化：

```python
import numpy as np
import pandas as pd
from scipy import stats

def check_stationarity(series):
    """检验时间序列的平稳性（ADF检验）"""
    from statsmodels.tsa.stattools import adfuller

    result = adfuller(series, autolag='AIC')

    print(f'ADF统计量: {result[0]:.4f}')
    print(f'p值: {result[1]:.4f}')
    print('临界值:')
    for key, value in result[4].items():
        print(f'  {key}: {value:.4f}')

    if result[1] < 0.05:
        print('\n结论: 序列是平稳的 (拒绝原假设)')
    else:
        print('\n结论: 序列是非平稳的 (无法拒绝原假设)')

    return result[1] < 0.05

# 差分操作使序列平稳
def make_stationary(series, max_diff=2):
    """通过差分使序列平稳"""
    diff_series = series.copy()
    d = 0

    while d < max_diff:
        if check_stationarity(diff_series):
            break
        diff_series = diff_series.diff().dropna()
        d += 1

    return diff_series, d
```

### 深度学习 vs 传统方法

| 方面 | 传统方法 (ARIMA, Prophet) | 深度学习方法 |
|------|-------------------------|-------------|
| 数据需求 | 较少数据即可工作 | 需要大量数据 |
| 可解释性 | 强，参数有明确含义 | 弱，黑盒模型 |
| 非线性关系 | 处理能力有限 | 强大的非线性建模 |
| 多变量处理 | 复杂，扩展性差 | 自然支持多变量 |
| 长期依赖 | 受限于模型假设 | 可学习长距离依赖 |
| 计算成本 | 低 | 高 |

### 时序预测任务类型

```python
import torch
import torch.nn as nn

# 单步预测：预测下一个时间点
def single_step_forecast(model, x):
    """
    输入: x of shape (batch, seq_len, features)
    输出: prediction of shape (batch, 1, features)
    """
    return model(x)[:, -1:, :]

# 多步预测：预测未来多个时间点
def multi_step_forecast(model, x, horizon):
    """
    递归预测未来 horizon 个时间步
    """
    predictions = []
    current_input = x

    for _ in range(horizon):
        pred = model(current_input)[:, -1:, :]
        predictions.append(pred)
        # 滑动窗口更新输入
        current_input = torch.cat([current_input[:, 1:, :], pred], dim=1)

    return torch.cat(predictions, dim=1)

# 直接多步预测：一次输出多个时间点
class DirectMultiStepModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_horizon):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, output_horizon)

    def forward(self, x):
        _, (h_n, _) = self.lstm(x)
        return self.fc(h_n.squeeze(0))
```

---

## LSTM/GRU 时序预测

### LSTM 原理回顾

LSTM（Long Short-Term Memory）通过门控机制解决了 RNN 的梯度消失问题，特别适合学习时间序列中的长期依赖关系。

**LSTM 单元结构：**

$$
\begin{aligned}
f_t &= \sigma(W_f \cdot [h_{t-1}, x_t] + b_f) & \text{遗忘门} \\
i_t &= \sigma(W_i \cdot [h_{t-1}, x_t] + b_i) & \text{输入门} \\
\tilde{C}_t &= \tanh(W_C \cdot [h_{t-1}, x_t] + b_C) & \text{候选记忆} \\
C_t &= f_t \odot C_{t-1} + i_t \odot \tilde{C}_t & \text{记忆更新} \\
o_t &= \sigma(W_o \cdot [h_{t-1}, x_t] + b_o) & \text{输出门} \\
h_t &= o_t \odot \tanh(C_t) & \text{隐藏状态}
\end{aligned}
$$

### 时序预测 LSTM 实现

```python
import torch
import torch.nn as nn
import numpy as np

class TimeSeriesLSTM(nn.Module):
    """用于时间序列预测的 LSTM 模型"""

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        num_layers: int = 2,
        output_dim: int = 1,
        dropout: float = 0.2,
        bidirectional: bool = False
    ):
        super().__init__()

        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        # LSTM 层
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )

        # 输出层
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim * self.num_directions, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, output_dim)
        )

        # 初始化权重
        self._init_weights()

    def _init_weights(self):
        for name, param in self.lstm.named_parameters():
            if 'weight_ih' in name:
                nn.init.xavier_uniform_(param.data)
            elif 'weight_hh' in name:
                nn.init.orthogonal_(param.data)
            elif 'bias' in name:
                param.data.fill_(0)
                # 遗忘门偏置初始化为1（帮助学习长期依赖）
                n = param.size(0)
                param.data[n//4:n//2].fill_(1)

    def forward(self, x, hidden=None):
        """
        Args:
            x: (batch_size, seq_len, input_dim)
            hidden: 初始隐藏状态（可选）
        Returns:
            output: (batch_size, output_dim)
        """
        # LSTM 前向传播
        lstm_out, (h_n, c_n) = self.lstm(x, hidden)

        # 使用最后一个时间步的输出
        if self.bidirectional:
            # 拼接两个方向的最后隐藏状态
            last_hidden = torch.cat([h_n[-2], h_n[-1]], dim=1)
        else:
            last_hidden = h_n[-1]

        # 通过全连接层得到预测
        output = self.fc(last_hidden)

        return output

    def predict_sequence(self, x, future_steps):
        """递归预测未来多个时间步"""
        self.set_eval_mode()
        predictions = []
        current_seq = x.clone()

        with torch.no_grad():
            for _ in range(future_steps):
                pred = self.forward(current_seq)
                predictions.append(pred.unsqueeze(1))

                # 更新输入序列
                current_seq = torch.cat([
                    current_seq[:, 1:, :],
                    pred.unsqueeze(1)
                ], dim=1)

        return torch.cat(predictions, dim=1)

    def set_eval_mode(self):
        """设置模型为评估模式"""
        self.training = False
        for module in self.children():
            module.training = False


# 使用示例
def train_lstm_model():
    # 模型参数
    input_dim = 1       # 单变量时间序列
    hidden_dim = 64
    num_layers = 2
    seq_length = 30     # 使用过去30个时间步

    # 创建模型
    model = TimeSeriesLSTM(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        num_layers=num_layers,
        output_dim=1
    )

    # 模拟数据
    batch_size = 32
    x = torch.randn(batch_size, seq_length, input_dim)
    y = torch.randn(batch_size, 1)

    # 前向传播
    output = model(x)
    print(f"输入形状: {x.shape}")
    print(f"输出形状: {output.shape}")

    # 预测未来10步
    future_pred = model.predict_sequence(x, future_steps=10)
    print(f"未来预测形状: {future_pred.shape}")

train_lstm_model()
```

### GRU：简化版 LSTM

GRU（Gated Recurrent Unit）是 LSTM 的简化版本，参数更少但效果相当：

$$
\begin{aligned}
z_t &= \sigma(W_z \cdot [h_{t-1}, x_t]) & \text{更新门} \\
r_t &= \sigma(W_r \cdot [h_{t-1}, x_t]) & \text{重置门} \\
\tilde{h}_t &= \tanh(W \cdot [r_t \odot h_{t-1}, x_t]) & \text{候选状态} \\
h_t &= (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t & \text{状态更新}
\end{aligned}
$$

```python
class TimeSeriesGRU(nn.Module):
    """用于时间序列预测的 GRU 模型"""

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        num_layers: int = 2,
        output_dim: int = 1,
        dropout: float = 0.2
    ):
        super().__init__()

        self.gru = nn.GRU(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, output_dim)
        )

    def forward(self, x):
        gru_out, h_n = self.gru(x)
        output = self.fc(h_n[-1])
        return output


# LSTM vs GRU 选择指南
"""
选择 LSTM 的情况：
- 序列很长，需要记住更远的信息
- 任务复杂，需要更强的表达能力
- 有足够的数据和计算资源

选择 GRU 的情况：
- 数据量较小，需要减少过拟合风险
- 计算资源有限，需要更快的训练
- 序列较短，不需要非常长的记忆
"""
```

---

## Seq2Seq 编码器-解码器

### 架构设计

Seq2Seq（Sequence-to-Sequence）架构特别适合多步预测任务，它将输入序列编码为固定长度的上下文向量，然后解码器基于此生成输出序列。

```python
class Encoder(nn.Module):
    """编码器：将输入序列压缩为上下文向量"""

    def __init__(self, input_dim, hidden_dim, num_layers, dropout):
        super().__init__()
        self.lstm = nn.LSTM(
            input_dim, hidden_dim, num_layers,
            batch_first=True, dropout=dropout
        )

    def forward(self, x):
        # outputs: (batch, seq_len, hidden_dim)
        # hidden: (h_n, c_n), 每个形状 (num_layers, batch, hidden_dim)
        outputs, hidden = self.lstm(x)
        return outputs, hidden


class Decoder(nn.Module):
    """解码器：基于上下文向量生成输出序列"""

    def __init__(self, input_dim, hidden_dim, output_dim, num_layers, dropout):
        super().__init__()
        self.lstm = nn.LSTM(
            input_dim, hidden_dim, num_layers,
            batch_first=True, dropout=dropout
        )
        self.fc = nn.Linear(hidden_dim, output_dim)

    def forward(self, x, hidden):
        # x: (batch, 1, input_dim) - 单个时间步输入
        output, hidden = self.lstm(x, hidden)
        prediction = self.fc(output)
        return prediction, hidden


class Seq2SeqForecaster(nn.Module):
    """完整的 Seq2Seq 时序预测模型"""

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        output_dim: int,
        output_len: int,
        num_layers: int = 2,
        dropout: float = 0.2,
        teacher_forcing_ratio: float = 0.5
    ):
        super().__init__()

        self.output_len = output_len
        self.output_dim = output_dim
        self.teacher_forcing_ratio = teacher_forcing_ratio

        self.encoder = Encoder(input_dim, hidden_dim, num_layers, dropout)
        self.decoder = Decoder(output_dim, hidden_dim, output_dim, num_layers, dropout)

    def forward(self, src, tgt=None):
        """
        Args:
            src: 输入序列 (batch, src_len, input_dim)
            tgt: 目标序列 (batch, tgt_len, output_dim)，训练时使用
        Returns:
            outputs: 预测序列 (batch, output_len, output_dim)
        """
        batch_size = src.size(0)

        # 编码
        encoder_outputs, hidden = self.encoder(src)

        # 初始化解码器输入（使用编码器最后一步的输出或零向量）
        decoder_input = torch.zeros(batch_size, 1, self.output_dim, device=src.device)

        outputs = []

        for t in range(self.output_len):
            # 解码一个时间步
            output, hidden = self.decoder(decoder_input, hidden)
            outputs.append(output)

            # 决定下一步输入：Teacher Forcing 或使用预测
            if tgt is not None and torch.rand(1).item() < self.teacher_forcing_ratio:
                decoder_input = tgt[:, t:t+1, :]
            else:
                decoder_input = output

        return torch.cat(outputs, dim=1)

    def predict(self, src):
        """推理模式：不使用 Teacher Forcing"""
        self.set_eval_mode()
        with torch.no_grad():
            return self.forward(src, tgt=None)

    def set_eval_mode(self):
        """设置模型为评估模式"""
        self.training = False


# 使用示例
def demo_seq2seq():
    model = Seq2SeqForecaster(
        input_dim=5,       # 5个输入特征
        hidden_dim=128,
        output_dim=1,      # 预测1个目标变量
        output_len=24,     # 预测未来24步
        num_layers=2
    )

    # 输入：过去168小时的数据（一周）
    src = torch.randn(32, 168, 5)
    # 目标：未来24小时的预测
    tgt = torch.randn(32, 24, 1)

    # 训练模式
    output = model(src, tgt)
    print(f"训练输出形状: {output.shape}")  # (32, 24, 1)

    # 推理模式
    pred = model.predict(src)
    print(f"预测输出形状: {pred.shape}")  # (32, 24, 1)

demo_seq2seq()
```

### 注意力机制增强

添加注意力机制可以让解码器动态关注编码器的不同位置：

```python
class Attention(nn.Module):
    """Bahdanau 注意力机制"""

    def __init__(self, encoder_dim, decoder_dim, attention_dim):
        super().__init__()
        self.encoder_att = nn.Linear(encoder_dim, attention_dim)
        self.decoder_att = nn.Linear(decoder_dim, attention_dim)
        self.full_att = nn.Linear(attention_dim, 1)

    def forward(self, encoder_outputs, decoder_hidden):
        """
        Args:
            encoder_outputs: (batch, src_len, encoder_dim)
            decoder_hidden: (batch, decoder_dim)
        Returns:
            context: (batch, encoder_dim)
            attention_weights: (batch, src_len)
        """
        # 计算注意力能量
        encoder_att = self.encoder_att(encoder_outputs)  # (batch, src_len, att_dim)
        decoder_att = self.decoder_att(decoder_hidden).unsqueeze(1)  # (batch, 1, att_dim)

        energy = torch.tanh(encoder_att + decoder_att)  # (batch, src_len, att_dim)
        attention_scores = self.full_att(energy).squeeze(-1)  # (batch, src_len)

        # Softmax 归一化
        attention_weights = torch.softmax(attention_scores, dim=1)

        # 加权求和得到上下文向量
        context = torch.bmm(attention_weights.unsqueeze(1), encoder_outputs)
        context = context.squeeze(1)  # (batch, encoder_dim)

        return context, attention_weights


class AttentionDecoder(nn.Module):
    """带注意力的解码器"""

    def __init__(self, input_dim, encoder_dim, hidden_dim, output_dim, attention_dim, num_layers):
        super().__init__()

        self.attention = Attention(encoder_dim, hidden_dim, attention_dim)
        self.lstm = nn.LSTM(
            input_dim + encoder_dim,  # 拼接输入和上下文
            hidden_dim,
            num_layers,
            batch_first=True
        )
        self.fc = nn.Linear(hidden_dim + encoder_dim, output_dim)

    def forward(self, x, hidden, encoder_outputs):
        """
        Args:
            x: (batch, 1, input_dim)
            hidden: ((num_layers, batch, hidden_dim), (num_layers, batch, hidden_dim))
            encoder_outputs: (batch, src_len, encoder_dim)
        """
        # 计算注意力
        h_n = hidden[0][-1]  # 最后一层的隐藏状态
        context, attention_weights = self.attention(encoder_outputs, h_n)

        # 拼接输入和上下文
        lstm_input = torch.cat([x, context.unsqueeze(1)], dim=-1)

        # LSTM 前向传播
        output, hidden = self.lstm(lstm_input, hidden)

        # 拼接输出和上下文，生成预测
        output = torch.cat([output.squeeze(1), context], dim=-1)
        prediction = self.fc(output).unsqueeze(1)

        return prediction, hidden, attention_weights


class Seq2SeqWithAttention(nn.Module):
    """带注意力机制的 Seq2Seq 模型"""

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        output_dim: int,
        output_len: int,
        attention_dim: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2
    ):
        super().__init__()

        self.output_len = output_len
        self.output_dim = output_dim

        self.encoder = Encoder(input_dim, hidden_dim, num_layers, dropout)
        self.decoder = AttentionDecoder(
            output_dim, hidden_dim, hidden_dim, output_dim, attention_dim, num_layers
        )

    def forward(self, src, tgt=None):
        batch_size = src.size(0)
        encoder_outputs, hidden = self.encoder(src)

        decoder_input = torch.zeros(batch_size, 1, self.output_dim, device=src.device)

        outputs = []
        attention_weights = []

        for t in range(self.output_len):
            output, hidden, attn_weights = self.decoder(
                decoder_input, hidden, encoder_outputs
            )
            outputs.append(output)
            attention_weights.append(attn_weights)
            decoder_input = output

        outputs = torch.cat(outputs, dim=1)
        attention_weights = torch.stack(attention_weights, dim=1)

        return outputs, attention_weights
```

---

## Temporal CNN (TCN)

### TCN 架构原理

Temporal Convolutional Network (TCN) 使用因果卷积和扩张卷积来处理序列数据，相比 RNN 具有以下优势：

1. **并行计算**：卷积操作可以并行，训练速度快
2. **稳定的梯度**：不存在梯度消失/爆炸问题
3. **灵活的感受野**：通过扩张卷积指数级增加感受野
4. **更少的内存**：不需要保存隐藏状态

**因果卷积（Causal Convolution）**：

确保时间步 $t$ 的输出只依赖于时间步 $t$ 及之前的输入：

$$y_t = \sum_{i=0}^{k-1} w_i \cdot x_{t-i}$$

**扩张卷积（Dilated Convolution）**：

通过扩张因子 $d$ 增加感受野：

$$y_t = \sum_{i=0}^{k-1} w_i \cdot x_{t - d \cdot i}$$

```python
import torch
import torch.nn as nn
from torch.nn.utils import weight_norm

class CausalConv1d(nn.Module):
    """因果卷积层"""

    def __init__(self, in_channels, out_channels, kernel_size, dilation=1):
        super().__init__()
        # 计算需要的 padding 以确保因果性
        self.padding = (kernel_size - 1) * dilation

        self.conv = nn.Conv1d(
            in_channels, out_channels, kernel_size,
            padding=self.padding, dilation=dilation
        )

    def forward(self, x):
        # x: (batch, channels, seq_len)
        out = self.conv(x)
        # 移除右侧多余的 padding 以保持因果性
        return out[:, :, :-self.padding] if self.padding > 0 else out


class TemporalBlock(nn.Module):
    """TCN 的基本构建块"""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        dilation: int,
        dropout: float = 0.2
    ):
        super().__init__()

        # 两层因果卷积
        self.conv1 = weight_norm(CausalConv1d(
            in_channels, out_channels, kernel_size, dilation
        ).conv)
        self.conv2 = weight_norm(CausalConv1d(
            out_channels, out_channels, kernel_size, dilation
        ).conv)

        # 手动处理 padding
        self.padding = (kernel_size - 1) * dilation

        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)

        # 残差连接（如果通道数不同需要 1x1 卷积）
        self.downsample = nn.Conv1d(in_channels, out_channels, 1) \
            if in_channels != out_channels else None

    def forward(self, x):
        # 第一层卷积
        out = self.conv1(x)
        out = out[:, :, :-self.padding] if self.padding > 0 else out
        out = self.relu(out)
        out = self.dropout(out)

        # 第二层卷积
        out = self.conv2(out)
        out = out[:, :, :-self.padding] if self.padding > 0 else out
        out = self.relu(out)
        out = self.dropout(out)

        # 残差连接
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(out + res)


class TCN(nn.Module):
    """Temporal Convolutional Network"""

    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        num_channels: list,
        kernel_size: int = 3,
        dropout: float = 0.2
    ):
        """
        Args:
            input_dim: 输入特征维度
            output_dim: 输出维度
            num_channels: 每层的通道数列表，如 [64, 64, 64, 64]
            kernel_size: 卷积核大小
            dropout: Dropout 比率
        """
        super().__init__()

        layers = []
        num_levels = len(num_channels)

        for i in range(num_levels):
            dilation = 2 ** i  # 指数增长的扩张因子
            in_ch = input_dim if i == 0 else num_channels[i-1]
            out_ch = num_channels[i]

            layers.append(TemporalBlock(
                in_ch, out_ch, kernel_size, dilation, dropout
            ))

        self.network = nn.Sequential(*layers)
        self.fc = nn.Linear(num_channels[-1], output_dim)

    def forward(self, x):
        """
        Args:
            x: (batch, seq_len, input_dim)
        Returns:
            output: (batch, output_dim)
        """
        # 转换维度：(batch, seq_len, features) -> (batch, features, seq_len)
        x = x.transpose(1, 2)

        # 通过 TCN 网络
        out = self.network(x)

        # 使用最后一个时间步的输出
        out = out[:, :, -1]

        return self.fc(out)

    def receptive_field(self, kernel_size, num_levels):
        """计算感受野大小"""
        return 1 + 2 * (kernel_size - 1) * (2 ** num_levels - 1)


# TCN 多步预测版本
class TCNForecaster(nn.Module):
    """用于多步预测的 TCN 模型"""

    def __init__(
        self,
        input_dim: int,
        output_dim: int,
        output_len: int,
        num_channels: list,
        kernel_size: int = 3,
        dropout: float = 0.2
    ):
        super().__init__()

        self.output_len = output_len

        # 构建 TCN 层
        layers = []
        num_levels = len(num_channels)

        for i in range(num_levels):
            dilation = 2 ** i
            in_ch = input_dim if i == 0 else num_channels[i-1]
            out_ch = num_channels[i]

            layers.append(TemporalBlock(
                in_ch, out_ch, kernel_size, dilation, dropout
            ))

        self.tcn = nn.Sequential(*layers)

        # 输出层：直接预测多个时间步
        self.fc = nn.Linear(num_channels[-1], output_len * output_dim)
        self.output_dim = output_dim

    def forward(self, x):
        # x: (batch, seq_len, input_dim)
        x = x.transpose(1, 2)  # (batch, input_dim, seq_len)

        out = self.tcn(x)  # (batch, channels, seq_len)
        out = out[:, :, -1]  # 使用最后时间步

        out = self.fc(out)  # (batch, output_len * output_dim)
        out = out.view(-1, self.output_len, self.output_dim)

        return out


# 使用示例
def demo_tcn():
    # 创建模型
    model = TCNForecaster(
        input_dim=7,           # 7个特征
        output_dim=1,          # 预测1个变量
        output_len=24,         # 预测24步
        num_channels=[64, 64, 64, 64],  # 4层TCN
        kernel_size=3,
        dropout=0.2
    )

    # 计算感受野
    rf = model.tcn[0].receptive_field(3, 4) if hasattr(model.tcn[0], 'receptive_field') else None
    print(f"TCN 感受野: {1 + 2 * (3-1) * (2**4 - 1)} = 61 时间步")

    # 测试前向传播
    x = torch.randn(32, 168, 7)  # 168小时历史数据
    output = model(x)
    print(f"输入形状: {x.shape}")
    print(f"输出形状: {output.shape}")

    # 参数量
    total_params = sum(p.numel() for p in model.parameters())
    print(f"总参数量: {total_params:,}")

demo_tcn()
```

---

## Transformer 时序模型

### 时序 Transformer 的挑战

将 Transformer 应用于时间序列预测面临一些独特挑战：

1. **计算复杂度**：标准自注意力的复杂度为 $O(L^2)$，对长序列不友好
2. **位置编码**：需要能够表达时间序列的周期性和相对位置
3. **点预测 vs 概率预测**：时序预测通常需要不确定性估计

### 基础时序 Transformer

```python
import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    """时间序列位置编码"""

    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)

        self.register_buffer('pe', pe)

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class TimeSeriesTransformer(nn.Module):
    """基于 Transformer 的时间序列预测模型"""

    def __init__(
        self,
        input_dim: int,
        d_model: int = 512,
        nhead: int = 8,
        num_encoder_layers: int = 6,
        num_decoder_layers: int = 6,
        dim_feedforward: int = 2048,
        dropout: float = 0.1,
        output_dim: int = 1,
        output_len: int = 24
    ):
        super().__init__()

        self.d_model = d_model
        self.output_len = output_len
        self.output_dim = output_dim

        # 输入嵌入
        self.encoder_embedding = nn.Linear(input_dim, d_model)
        self.decoder_embedding = nn.Linear(output_dim, d_model)

        # 位置编码
        self.pos_encoder = PositionalEncoding(d_model, dropout=dropout)

        # Transformer
        self.transformer = nn.Transformer(
            d_model=d_model,
            nhead=nhead,
            num_encoder_layers=num_encoder_layers,
            num_decoder_layers=num_decoder_layers,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )

        # 输出层
        self.fc_out = nn.Linear(d_model, output_dim)

    def generate_square_subsequent_mask(self, sz):
        """生成因果掩码"""
        mask = torch.triu(torch.ones(sz, sz), diagonal=1).bool()
        return mask

    def forward(self, src, tgt=None):
        """
        Args:
            src: 编码器输入 (batch, src_len, input_dim)
            tgt: 解码器输入 (batch, tgt_len, output_dim)
        """
        batch_size = src.size(0)

        # 编码器输入处理
        src_emb = self.encoder_embedding(src) * math.sqrt(self.d_model)
        src_emb = self.pos_encoder(src_emb)

        if tgt is None:
            # 推理模式：自回归生成
            return self._autoregressive_generate(src_emb, batch_size)

        # 训练模式
        tgt_emb = self.decoder_embedding(tgt) * math.sqrt(self.d_model)
        tgt_emb = self.pos_encoder(tgt_emb)

        # 生成因果掩码
        tgt_mask = self.generate_square_subsequent_mask(tgt.size(1)).to(src.device)

        # Transformer 前向传播
        output = self.transformer(src_emb, tgt_emb, tgt_mask=tgt_mask)

        return self.fc_out(output)

    def _autoregressive_generate(self, src_emb, batch_size):
        """自回归生成预测序列"""
        device = src_emb.device

        # 初始化解码器输入
        decoder_input = torch.zeros(batch_size, 1, self.output_dim, device=device)

        outputs = []

        for _ in range(self.output_len):
            tgt_emb = self.decoder_embedding(decoder_input) * math.sqrt(self.d_model)
            tgt_emb = self.pos_encoder(tgt_emb)

            tgt_mask = self.generate_square_subsequent_mask(tgt_emb.size(1)).to(device)

            output = self.transformer(src_emb, tgt_emb, tgt_mask=tgt_mask)
            pred = self.fc_out(output[:, -1:, :])

            outputs.append(pred)
            decoder_input = torch.cat([decoder_input, pred], dim=1)

        return torch.cat(outputs, dim=1)


# 使用示例
def demo_transformer():
    model = TimeSeriesTransformer(
        input_dim=7,
        d_model=256,
        nhead=8,
        num_encoder_layers=3,
        num_decoder_layers=3,
        dim_feedforward=512,
        dropout=0.1,
        output_dim=1,
        output_len=24
    )

    # 输入数据
    src = torch.randn(16, 168, 7)   # 历史数据
    tgt = torch.randn(16, 24, 1)    # 目标序列（训练时使用）

    # 训练模式
    model.train()
    output = model(src, tgt)
    print(f"训练输出形状: {output.shape}")

    # 推理模式
    model.set_eval_mode()
    with torch.no_grad():
        pred = model(src)
    print(f"推理输出形状: {pred.shape}")

def set_eval_mode(model):
    """设置模型为评估模式"""
    model.training = False
    return model

demo_transformer()
```

### Informer：高效长序列预测

Informer 是专门针对长序列时间序列预测设计的模型，主要改进包括：

1. **ProbSparse 自注意力**：将复杂度从 $O(L^2)$ 降低到 $O(L \log L)$
2. **自注意力蒸馏**：逐层减少序列长度，提取主要特征
3. **生成式解码器**：一次性预测所有输出，避免累积误差

```python
class ProbAttention(nn.Module):
    """ProbSparse 自注意力机制"""

    def __init__(self, d_model, n_heads, factor=5, dropout=0.1):
        super().__init__()
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.factor = factor

        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def _prob_QK(self, Q, K, sample_k, n_top):
        """计算稀疏注意力分数"""
        B, H, L_Q, D = Q.shape
        _, _, L_K, _ = K.shape

        # 计算采样的 Q 和全部 K 的注意力分数
        K_expand = K.unsqueeze(-3).expand(B, H, L_Q, L_K, D)

        # 随机采样 sample_k 个位置
        index_sample = torch.randint(L_K, (L_Q, sample_k))
        K_sample = K_expand[:, :, torch.arange(L_Q).unsqueeze(1), index_sample, :]

        # 计算 Q 和采样 K 的点积
        Q_K_sample = torch.matmul(Q.unsqueeze(-2), K_sample.transpose(-2, -1)).squeeze(-2)

        # 找到稀疏性度量最高的 top-u 个 query
        M = Q_K_sample.max(-1)[0] - torch.div(Q_K_sample.sum(-1), L_K)
        M_top = M.topk(n_top, sorted=False)[1]

        return M_top

    def forward(self, queries, keys, values, attn_mask=None):
        B, L_Q, _ = queries.shape
        _, L_K, _ = keys.shape
        H = self.n_heads

        # 线性变换
        Q = self.W_Q(queries).view(B, L_Q, H, self.d_k).transpose(1, 2)
        K = self.W_K(keys).view(B, L_K, H, self.d_k).transpose(1, 2)
        V = self.W_V(values).view(B, L_K, H, self.d_k).transpose(1, 2)

        # 计算采样参数
        U = self.factor * int(math.ceil(math.log(L_K)))
        u = self.factor * int(math.ceil(math.log(L_Q)))

        U = min(U, L_K)
        u = min(u, L_Q)

        # 简化版实现：使用标准注意力
        # 完整实现需要 ProbSparse 采样
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if attn_mask is not None:
            scores = scores.masked_fill(attn_mask, float('-inf'))

        attn = self.dropout(torch.softmax(scores, dim=-1))
        output = torch.matmul(attn, V)

        output = output.transpose(1, 2).contiguous().view(B, L_Q, -1)
        return self.W_O(output)


class InformerEncoder(nn.Module):
    """Informer 编码器（含自注意力蒸馏）"""

    def __init__(self, d_model, n_heads, d_ff, n_layers, dropout=0.1):
        super().__init__()

        self.layers = nn.ModuleList([
            nn.ModuleDict({
                'attention': ProbAttention(d_model, n_heads, dropout=dropout),
                'norm1': nn.LayerNorm(d_model),
                'ffn': nn.Sequential(
                    nn.Linear(d_model, d_ff),
                    nn.GELU(),
                    nn.Dropout(dropout),
                    nn.Linear(d_ff, d_model),
                    nn.Dropout(dropout)
                ),
                'norm2': nn.LayerNorm(d_model)
            })
            for _ in range(n_layers)
        ])

        # 蒸馏层：逐层减半序列长度
        self.distilling = nn.ModuleList([
            nn.Conv1d(d_model, d_model, kernel_size=3, padding=1, stride=2)
            for _ in range(n_layers - 1)
        ])

    def forward(self, x):
        for i, layer in enumerate(self.layers):
            # 自注意力
            attn_out = layer['attention'](x, x, x)
            x = layer['norm1'](x + attn_out)

            # FFN
            ffn_out = layer['ffn'](x)
            x = layer['norm2'](x + ffn_out)

            # 蒸馏（除最后一层外）
            if i < len(self.distilling):
                x = self.distilling[i](x.transpose(1, 2)).transpose(1, 2)

        return x
```

### Autoformer：自相关机制

Autoformer 引入了序列分解和自相关机制，更好地捕获时间序列的周期性模式：

```python
class SeriesDecomp(nn.Module):
    """序列分解：分离趋势和季节性成分"""

    def __init__(self, kernel_size):
        super().__init__()
        self.kernel_size = kernel_size
        self.avg_pool = nn.AvgPool1d(kernel_size, stride=1, padding=0)

    def forward(self, x):
        # x: (batch, seq_len, d_model)
        # 提取趋势
        front = x[:, :1, :].repeat(1, self.kernel_size // 2, 1)
        end = x[:, -1:, :].repeat(1, self.kernel_size // 2, 1)
        x_padded = torch.cat([front, x, end], dim=1)

        x_padded = x_padded.transpose(1, 2)
        trend = self.avg_pool(x_padded).transpose(1, 2)

        # 季节性 = 原始 - 趋势
        seasonal = x - trend

        return seasonal, trend


class AutoCorrelation(nn.Module):
    """自相关注意力机制"""

    def __init__(self, d_model, n_heads, factor=3, dropout=0.1):
        super().__init__()
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.factor = factor

        self.W_Q = nn.Linear(d_model, d_model)
        self.W_K = nn.Linear(d_model, d_model)
        self.W_V = nn.Linear(d_model, d_model)
        self.W_O = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def time_delay_agg(self, V, corr):
        """基于自相关的时延聚合"""
        B, H, L, D = V.shape

        # 选择 top-k 个周期
        top_k = int(self.factor * math.log(L))
        top_k = min(top_k, L)

        # 获取权重和索引
        weights, indices = torch.topk(corr, top_k, dim=-1)
        weights = torch.softmax(weights, dim=-1)

        # 聚合（简化实现）
        # 完整实现需要根据周期进行滚动聚合
        output = torch.zeros_like(V)
        for i in range(top_k):
            roll_V = torch.roll(V, shifts=int(indices[..., i].mean().item()), dims=2)
            output = output + weights[..., i:i+1].unsqueeze(-1) * roll_V

        return output

    def forward(self, queries, keys, values):
        B, L_Q, _ = queries.shape
        _, L_K, _ = keys.shape
        H = self.n_heads

        Q = self.W_Q(queries).view(B, L_Q, H, self.d_k).permute(0, 2, 1, 3)
        K = self.W_K(keys).view(B, L_K, H, self.d_k).permute(0, 2, 1, 3)
        V = self.W_V(values).view(B, L_K, H, self.d_k).permute(0, 2, 1, 3)

        # 使用 FFT 计算自相关
        Q_fft = torch.fft.rfft(Q, dim=2)
        K_fft = torch.fft.rfft(K, dim=2)
        corr = torch.fft.irfft(Q_fft * K_fft.conj(), dim=2)

        # 时延聚合
        output = self.time_delay_agg(V, corr)

        output = output.permute(0, 2, 1, 3).contiguous().view(B, L_Q, -1)
        return self.W_O(output)


class AutoformerLayer(nn.Module):
    """Autoformer 编码器层"""

    def __init__(self, d_model, n_heads, d_ff, kernel_size=25, dropout=0.1):
        super().__init__()

        self.autocorr = AutoCorrelation(d_model, n_heads, dropout=dropout)
        self.decomp1 = SeriesDecomp(kernel_size)
        self.decomp2 = SeriesDecomp(kernel_size)

        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model)
        )

        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # 自相关 + 分解
        attn_out = self.autocorr(x, x, x)
        x = x + self.dropout(attn_out)
        x, _ = self.decomp1(x)

        # FFN + 分解
        ffn_out = self.ffn(x)
        x = x + self.dropout(ffn_out)
        x, _ = self.decomp2(x)

        return x
```

---

## 多变量时间序列预测

### 多变量挑战

多变量时间序列预测需要同时考虑：
- **时间依赖**：单个变量的历史信息
- **变量间依赖**：不同变量之间的相互影响
- **外生变量**：已知的未来信息（如日期特征）

```python
class MultiVariateTimeSeriesDataset(torch.utils.data.Dataset):
    """多变量时间序列数据集"""

    def __init__(
        self,
        data: np.ndarray,
        target_col: int,
        seq_len: int,
        pred_len: int,
        feature_cols: list = None
    ):
        """
        Args:
            data: 形状为 (time_steps, num_features) 的数据
            target_col: 目标变量的列索引
            seq_len: 输入序列长度
            pred_len: 预测长度
            feature_cols: 使用的特征列索引列表
        """
        self.data = data
        self.target_col = target_col
        self.seq_len = seq_len
        self.pred_len = pred_len
        self.feature_cols = feature_cols or list(range(data.shape[1]))

    def __len__(self):
        return len(self.data) - self.seq_len - self.pred_len + 1

    def __getitem__(self, idx):
        # 输入序列
        x = self.data[idx:idx + self.seq_len, self.feature_cols]
        # 目标序列
        y = self.data[idx + self.seq_len:idx + self.seq_len + self.pred_len, self.target_col]

        return torch.FloatTensor(x), torch.FloatTensor(y)


class MultiVariateLSTM(nn.Module):
    """多变量 LSTM 预测模型"""

    def __init__(
        self,
        num_features: int,
        hidden_dim: int,
        num_layers: int,
        output_len: int,
        dropout: float = 0.2
    ):
        super().__init__()

        self.lstm = nn.LSTM(
            input_size=num_features,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )

        # 使用多层感知机输出
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, output_len)
        )

    def forward(self, x):
        # x: (batch, seq_len, num_features)
        lstm_out, (h_n, c_n) = self.lstm(x)

        # 使用最后一层的隐藏状态
        output = self.fc(h_n[-1])

        return output
```

### 特征工程

时间序列特征工程对模型性能至关重要：

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler

class TimeSeriesFeatureEngineering:
    """时间序列特征工程"""

    def __init__(self, datetime_col: str):
        self.datetime_col = datetime_col
        self.scaler = StandardScaler()

    def create_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """创建时间相关特征"""
        df = df.copy()
        dt = pd.to_datetime(df[self.datetime_col])

        # 基础时间特征
        df['hour'] = dt.dt.hour
        df['dayofweek'] = dt.dt.dayofweek
        df['dayofmonth'] = dt.dt.day
        df['dayofyear'] = dt.dt.dayofyear
        df['month'] = dt.dt.month
        df['quarter'] = dt.dt.quarter
        df['year'] = dt.dt.year
        df['weekofyear'] = dt.dt.isocalendar().week.astype(int)

        # 周期性编码（正弦/余弦变换）
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['dayofweek'] / 7)
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

        # 是否为工作日/周末
        df['is_weekend'] = (df['dayofweek'] >= 5).astype(int)

        return df

    def create_lag_features(
        self,
        df: pd.DataFrame,
        target_col: str,
        lags: list
    ) -> pd.DataFrame:
        """创建滞后特征"""
        df = df.copy()

        for lag in lags:
            df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)

        return df

    def create_rolling_features(
        self,
        df: pd.DataFrame,
        target_col: str,
        windows: list
    ) -> pd.DataFrame:
        """创建滚动统计特征"""
        df = df.copy()

        for window in windows:
            # 滚动均值
            df[f'{target_col}_rolling_mean_{window}'] = \
                df[target_col].rolling(window=window).mean()

            # 滚动标准差
            df[f'{target_col}_rolling_std_{window}'] = \
                df[target_col].rolling(window=window).std()

            # 滚动最大值
            df[f'{target_col}_rolling_max_{window}'] = \
                df[target_col].rolling(window=window).max()

            # 滚动最小值
            df[f'{target_col}_rolling_min_{window}'] = \
                df[target_col].rolling(window=window).min()

        return df

    def create_diff_features(
        self,
        df: pd.DataFrame,
        target_col: str,
        periods: list = [1, 7, 30]
    ) -> pd.DataFrame:
        """创建差分特征"""
        df = df.copy()

        for period in periods:
            df[f'{target_col}_diff_{period}'] = df[target_col].diff(period)
            df[f'{target_col}_pct_change_{period}'] = df[target_col].pct_change(period)

        return df


# 使用示例
def prepare_multivariate_data():
    # 模拟数据
    np.random.seed(42)
    n_samples = 10000

    # 创建时间索引
    dates = pd.date_range(start='2020-01-01', periods=n_samples, freq='H')

    # 创建目标变量（带有趋势、季节性和噪声）
    trend = np.linspace(0, 10, n_samples)
    seasonal_daily = 5 * np.sin(2 * np.pi * np.arange(n_samples) / 24)
    seasonal_weekly = 3 * np.sin(2 * np.pi * np.arange(n_samples) / (24 * 7))
    noise = np.random.randn(n_samples) * 0.5

    target = trend + seasonal_daily + seasonal_weekly + noise + 50

    # 创建相关特征
    feature1 = target * 0.8 + np.random.randn(n_samples) * 2
    feature2 = np.roll(target, 24) * 0.5 + np.random.randn(n_samples) * 1.5

    df = pd.DataFrame({
        'datetime': dates,
        'target': target,
        'feature1': feature1,
        'feature2': feature2
    })

    # 特征工程
    fe = TimeSeriesFeatureEngineering('datetime')
    df = fe.create_time_features(df)
    df = fe.create_lag_features(df, 'target', lags=[1, 24, 168])
    df = fe.create_rolling_features(df, 'target', windows=[24, 168])
    df = fe.create_diff_features(df, 'target')

    # 删除 NaN
    df = df.dropna()

    print(f"数据形状: {df.shape}")
    print(f"特征列: {df.columns.tolist()}")

    return df

df = prepare_multivariate_data()
```

---

## PyTorch 完整实现

### 完整训练流程

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np
from sklearn.preprocessing import StandardScaler
from tqdm import tqdm
import matplotlib.pyplot as plt

class TimeSeriesDataset(Dataset):
    """通用时间序列数据集"""

    def __init__(
        self,
        data: np.ndarray,
        seq_len: int,
        pred_len: int,
        target_idx: int = 0,
        mode: str = 'train'
    ):
        self.data = data
        self.seq_len = seq_len
        self.pred_len = pred_len
        self.target_idx = target_idx
        self.mode = mode

    def __len__(self):
        return len(self.data) - self.seq_len - self.pred_len + 1

    def __getitem__(self, idx):
        x = self.data[idx:idx + self.seq_len]
        y = self.data[idx + self.seq_len:idx + self.seq_len + self.pred_len, self.target_idx]

        return torch.FloatTensor(x), torch.FloatTensor(y)


class TimeSeriesTrainer:
    """时间序列模型训练器"""

    def __init__(
        self,
        model: nn.Module,
        criterion: nn.Module = None,
        optimizer: optim.Optimizer = None,
        scheduler = None,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.model = model.to(device)
        self.criterion = criterion or nn.MSELoss()
        self.optimizer = optimizer or optim.Adam(model.parameters(), lr=1e-3)
        self.scheduler = scheduler
        self.device = device

        self.train_losses = []
        self.val_losses = []
        self.best_val_loss = float('inf')

    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0

        for batch_x, batch_y in tqdm(train_loader, desc='Training'):
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            self.optimizer.zero_grad()

            output = self.model(batch_x)
            loss = self.criterion(output, batch_y)

            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()

            total_loss += loss.item()

        return total_loss / len(train_loader)

    @torch.no_grad()
    def validate(self, val_loader):
        self.model.set_eval_mode()
        total_loss = 0

        for batch_x, batch_y in val_loader:
            batch_x = batch_x.to(self.device)
            batch_y = batch_y.to(self.device)

            output = self.model(batch_x)
            loss = self.criterion(output, batch_y)

            total_loss += loss.item()

        return total_loss / len(val_loader)

    def train(
        self,
        train_loader,
        val_loader,
        epochs: int,
        early_stopping_patience: int = 10,
        save_path: str = 'best_model.pt'
    ):
        patience_counter = 0

        for epoch in range(epochs):
            train_loss = self.train_epoch(train_loader)
            val_loss = self.validate(val_loader)

            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)

            print(f'Epoch {epoch+1}/{epochs} - '
                  f'Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}')

            if self.scheduler:
                if isinstance(self.scheduler, optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_loss)
                else:
                    self.scheduler.step()

            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                torch.save(self.model.state_dict(), save_path)
                patience_counter = 0
                print(f'  -> Best model saved! Val Loss: {val_loss:.6f}')
            else:
                patience_counter += 1

            if patience_counter >= early_stopping_patience:
                print(f'Early stopping at epoch {epoch+1}')
                break

        return self.train_losses, self.val_losses

    @torch.no_grad()
    def predict(self, data_loader):
        self.model.set_eval_mode()
        predictions = []
        actuals = []

        for batch_x, batch_y in data_loader:
            batch_x = batch_x.to(self.device)

            output = self.model(batch_x)

            predictions.append(output.cpu().numpy())
            actuals.append(batch_y.numpy())

        return np.concatenate(predictions), np.concatenate(actuals)

    def plot_training_history(self):
        plt.figure(figsize=(10, 5))
        plt.plot(self.train_losses, label='Train Loss')
        plt.plot(self.val_losses, label='Val Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.title('Training History')
        plt.legend()
        plt.grid(True)
        plt.show()


def run_complete_pipeline():
    """完整的训练流程示例"""

    # 1. 生成模拟数据
    np.random.seed(42)
    n_samples = 5000
    n_features = 5

    # 创建多变量时间序列
    t = np.arange(n_samples)
    data = np.zeros((n_samples, n_features))

    # 主目标变量
    data[:, 0] = (
        10 * np.sin(2 * np.pi * t / 24) +  # 日周期
        5 * np.sin(2 * np.pi * t / 168) +   # 周周期
        0.01 * t +                           # 趋势
        np.random.randn(n_samples) * 0.5    # 噪声
    )

    # 相关特征
    for i in range(1, n_features):
        data[:, i] = data[:, 0] * (0.5 + 0.1 * i) + np.random.randn(n_samples) * (0.3 * i)

    # 2. 数据标准化
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)

    # 3. 划分数据集
    train_size = int(len(data_scaled) * 0.7)
    val_size = int(len(data_scaled) * 0.15)

    train_data = data_scaled[:train_size]
    val_data = data_scaled[train_size:train_size + val_size]
    test_data = data_scaled[train_size + val_size:]

    # 4. 创建数据集和数据加载器
    seq_len = 168  # 使用过去一周的数据
    pred_len = 24  # 预测未来一天

    train_dataset = TimeSeriesDataset(train_data, seq_len, pred_len)
    val_dataset = TimeSeriesDataset(val_data, seq_len, pred_len)
    test_dataset = TimeSeriesDataset(test_data, seq_len, pred_len)

    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    print(f"训练集大小: {len(train_dataset)}")
    print(f"验证集大小: {len(val_dataset)}")
    print(f"测试集大小: {len(test_dataset)}")

    # 5. 创建模型
    model = MultiVariateLSTM(
        num_features=n_features,
        hidden_dim=128,
        num_layers=2,
        output_len=pred_len,
        dropout=0.2
    )

    # 6. 配置训练
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=1e-3)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=5
    )

    # 7. 创建训练器并训练
    trainer = TimeSeriesTrainer(
        model=model,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler
    )

    train_losses, val_losses = trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=50,
        early_stopping_patience=10
    )

    # 8. 加载最佳模型并测试
    model.load_state_dict(torch.load('best_model.pt'))
    predictions, actuals = trainer.predict(test_loader)

    # 9. 计算评估指标
    from sklearn.metrics import mean_squared_error, mean_absolute_error

    mse = mean_squared_error(actuals, predictions)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(actuals, predictions)

    print(f"\n测试集评估:")
    print(f"MSE: {mse:.6f}")
    print(f"RMSE: {rmse:.6f}")
    print(f"MAE: {mae:.6f}")

    # 10. 可视化结果
    plt.figure(figsize=(15, 5))

    # 显示前100个样本的预测
    n_show = min(100, len(predictions))

    plt.subplot(1, 2, 1)
    plt.plot(actuals[:n_show, 0], label='Actual', alpha=0.8)
    plt.plot(predictions[:n_show, 0], label='Predicted', alpha=0.8)
    plt.xlabel('Sample')
    plt.ylabel('Value')
    plt.title('Prediction vs Actual (First Hour)')
    plt.legend()
    plt.grid(True)

    plt.subplot(1, 2, 2)
    plt.scatter(actuals.flatten(), predictions.flatten(), alpha=0.3)
    plt.plot([actuals.min(), actuals.max()], [actuals.min(), actuals.max()], 'r--')
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title('Scatter Plot')
    plt.grid(True)

    plt.tight_layout()
    plt.show()

    return trainer, model


# 运行完整流程
# trainer, model = run_complete_pipeline()
```

### 自定义损失函数

```python
class TimeSeriesLosses:
    """时间序列专用损失函数"""

    @staticmethod
    def mape_loss(pred, target, eps=1e-8):
        """平均绝对百分比误差"""
        return torch.mean(torch.abs((target - pred) / (torch.abs(target) + eps))) * 100

    @staticmethod
    def smape_loss(pred, target, eps=1e-8):
        """对称平均绝对百分比误差"""
        return torch.mean(
            2.0 * torch.abs(pred - target) / (torch.abs(pred) + torch.abs(target) + eps)
        ) * 100

    @staticmethod
    def quantile_loss(pred, target, quantiles=[0.1, 0.5, 0.9]):
        """分位数损失（用于概率预测）"""
        losses = []
        for i, q in enumerate(quantiles):
            errors = target - pred[:, i]
            losses.append(torch.max((q - 1) * errors, q * errors))
        return torch.mean(torch.stack(losses))

    @staticmethod
    def weighted_mse_loss(pred, target, weights=None):
        """加权均方误差（对近期预测给予更高权重）"""
        if weights is None:
            weights = torch.linspace(1.0, 0.5, target.size(-1), device=target.device)

        mse = (pred - target) ** 2
        weighted_mse = mse * weights
        return torch.mean(weighted_mse)


class CombinedLoss(nn.Module):
    """组合损失函数"""

    def __init__(self, alpha=0.5):
        super().__init__()
        self.alpha = alpha
        self.mse = nn.MSELoss()
        self.mae = nn.L1Loss()

    def forward(self, pred, target):
        return self.alpha * self.mse(pred, target) + (1 - self.alpha) * self.mae(pred, target)
```

---

## 模型评估与优化

### 评估指标

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

class TimeSeriesMetrics:
    """时间序列评估指标"""

    @staticmethod
    def mse(y_true, y_pred):
        """均方误差"""
        return mean_squared_error(y_true, y_pred)

    @staticmethod
    def rmse(y_true, y_pred):
        """均方根误差"""
        return np.sqrt(mean_squared_error(y_true, y_pred))

    @staticmethod
    def mae(y_true, y_pred):
        """平均绝对误差"""
        return mean_absolute_error(y_true, y_pred)

    @staticmethod
    def mape(y_true, y_pred, eps=1e-8):
        """平均绝对百分比误差"""
        return np.mean(np.abs((y_true - y_pred) / (np.abs(y_true) + eps))) * 100

    @staticmethod
    def smape(y_true, y_pred, eps=1e-8):
        """对称平均绝对百分比误差"""
        return np.mean(
            2.0 * np.abs(y_pred - y_true) / (np.abs(y_pred) + np.abs(y_true) + eps)
        ) * 100

    @staticmethod
    def r2(y_true, y_pred):
        """决定系数"""
        return r2_score(y_true, y_pred)

    @staticmethod
    def mase(y_true, y_pred, y_train, seasonality=1):
        """平均绝对缩放误差"""
        # 朴素预测的 MAE
        naive_mae = np.mean(np.abs(np.diff(y_train, n=seasonality)))
        # 模型 MAE
        model_mae = np.mean(np.abs(y_true - y_pred))
        return model_mae / naive_mae if naive_mae > 0 else np.inf

    @classmethod
    def compute_all_metrics(cls, y_true, y_pred, y_train=None):
        """计算所有指标"""
        metrics = {
            'MSE': cls.mse(y_true, y_pred),
            'RMSE': cls.rmse(y_true, y_pred),
            'MAE': cls.mae(y_true, y_pred),
            'MAPE': cls.mape(y_true, y_pred),
            'SMAPE': cls.smape(y_true, y_pred),
            'R2': cls.r2(y_true, y_pred)
        }

        if y_train is not None:
            metrics['MASE'] = cls.mase(y_true, y_pred, y_train)

        return metrics


# 使用示例
def assess_model_performance(y_true, y_pred, y_train=None):
    metrics = TimeSeriesMetrics.compute_all_metrics(y_true, y_pred, y_train)

    print("=" * 50)
    print("模型评估结果")
    print("=" * 50)
    for name, value in metrics.items():
        print(f"{name:10s}: {value:.6f}")
    print("=" * 50)

    return metrics
```

### 超参数调优

```python
import optuna
from optuna.trial import Trial

class HyperparameterTuner:
    """基于 Optuna 的超参数调优"""

    def __init__(
        self,
        train_data: np.ndarray,
        val_data: np.ndarray,
        seq_len: int,
        pred_len: int,
        n_features: int,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.train_data = train_data
        self.val_data = val_data
        self.seq_len = seq_len
        self.pred_len = pred_len
        self.n_features = n_features
        self.device = device

    def objective(self, trial: Trial) -> float:
        # 采样超参数
        hidden_dim = trial.suggest_int('hidden_dim', 32, 256, step=32)
        num_layers = trial.suggest_int('num_layers', 1, 4)
        dropout = trial.suggest_float('dropout', 0.1, 0.5)
        lr = trial.suggest_float('lr', 1e-5, 1e-2, log=True)
        batch_size = trial.suggest_categorical('batch_size', [16, 32, 64, 128])

        # 创建数据加载器
        train_dataset = TimeSeriesDataset(
            self.train_data, self.seq_len, self.pred_len
        )
        val_dataset = TimeSeriesDataset(
            self.val_data, self.seq_len, self.pred_len
        )

        train_loader = DataLoader(
            train_dataset, batch_size=batch_size, shuffle=True
        )
        val_loader = DataLoader(
            val_dataset, batch_size=batch_size, shuffle=False
        )

        # 创建模型
        model = MultiVariateLSTM(
            num_features=self.n_features,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            output_len=self.pred_len,
            dropout=dropout
        ).to(self.device)

        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=lr)

        # 训练
        best_val_loss = float('inf')
        patience = 10
        patience_counter = 0

        for epoch in range(50):
            # 训练
            model.train()
            for batch_x, batch_y in train_loader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)

                optimizer.zero_grad()
                output = model(batch_x)
                loss = criterion(output, batch_y)
                loss.backward()
                optimizer.step()

            # 验证
            model.set_eval_mode()
            val_loss = 0
            with torch.no_grad():
                for batch_x, batch_y in val_loader:
                    batch_x = batch_x.to(self.device)
                    batch_y = batch_y.to(self.device)
                    output = model(batch_x)
                    val_loss += criterion(output, batch_y).item()

            val_loss /= len(val_loader)

            # 早停
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= patience:
                break

            # 报告中间结果
            trial.report(val_loss, epoch)

            # 剪枝
            if trial.should_prune():
                raise optuna.TrialPruned()

        return best_val_loss

    def tune(self, n_trials: int = 100):
        study = optuna.create_study(
            direction='minimize',
            pruner=optuna.pruners.MedianPruner()
        )

        study.optimize(self.objective, n_trials=n_trials, show_progress_bar=True)

        print("\n最佳超参数:")
        print(study.best_params)
        print(f"\n最佳验证损失: {study.best_value:.6f}")

        return study.best_params
```

---

## 面试要点

### 核心概念题

**Q1: LSTM 如何解决梯度消失问题？**

LSTM 通过引入门控机制和记忆单元解决梯度消失：

1. **遗忘门**：控制保留多少历史信息
2. **输入门**：控制接收多少新信息
3. **记忆单元**：提供梯度直接传播的路径
4. **关键公式**：$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$

当 $f_t \approx 1$ 时，梯度可以无损地传播到很远的过去。

**Q2: TCN 相比 LSTM 有什么优势？**

| 方面 | TCN | LSTM |
|------|-----|------|
| 并行性 | 完全并行 | 必须顺序计算 |
| 感受野 | 通过扩张卷积指数增长 | 理论无限 |
| 梯度 | 稳定，无梯度消失 | 可能梯度消失/爆炸 |
| 内存 | 不需要保存状态 | 需要保存隐藏状态 |
| 训练速度 | 快 | 慢 |

**Q3: Transformer 在时序预测中的优缺点？**

**优点**：
- 能够直接建模长距离依赖
- 完全并行化计算
- 多头注意力捕获不同类型的模式

**缺点**：
- $O(L^2)$ 计算复杂度
- 需要大量数据
- 位置编码设计需要考虑时间序列特性

### 实践题

**Q4: 如何处理时间序列中的缺失值？**

```python
def handle_missing_values(series, method='interpolate'):
    """处理缺失值"""
    if method == 'interpolate':
        # 线性插值
        return series.interpolate(method='linear')
    elif method == 'forward_fill':
        # 前向填充
        return series.ffill()
    elif method == 'backward_fill':
        # 后向填充
        return series.bfill()
    elif method == 'mean':
        # 均值填充
        return series.fillna(series.mean())
    elif method == 'seasonal':
        # 季节性填充（使用相同季节的历史值）
        return series.fillna(series.shift(periods=24))  # 假设24小时周期
```

**Q5: 如何选择输入序列长度（lookback window）？**

选择依据：
1. **领域知识**：考虑数据的周期性（日周期、周周期等）
2. **自相关分析**：观察自相关函数衰减的速度
3. **模型感受野**：确保模型能够覆盖所需的历史信息
4. **计算资源**：更长的序列需要更多内存和计算
5. **交叉验证**：尝试不同长度，选择验证集上表现最好的

**Q6: 多步预测有哪些策略？各有什么优缺点？**

```python
"""
1. 递归预测（Recursive/Autoregressive）
   - 方法：迭代使用单步预测
   - 优点：模型简单，只需训练单步预测
   - 缺点：误差累积，长期预测不准确

2. 直接预测（Direct）
   - 方法：为每个预测步骤训练独立模型
   - 优点：无误差累积
   - 缺点：计算成本高，忽略预测步之间的关系

3. 直接多输出（Direct Multi-Output）
   - 方法：单个模型同时预测所有未来步骤
   - 优点：考虑步骤间关系，无误差累积
   - 缺点：输出空间大，训练困难

4. Seq2Seq
   - 方法：编码器-解码器架构
   - 优点：灵活处理变长输出，可加注意力机制
   - 缺点：训练复杂，需要大量数据
"""
```

### 代码题

**Q7: 实现一个简单的时间序列滑动窗口数据生成器**

```python
def create_sequences(data, seq_len, pred_len, step=1):
    """创建时间序列滑动窗口数据"""
    X, y = [], []

    for i in range(0, len(data) - seq_len - pred_len + 1, step):
        X.append(data[i:i + seq_len])
        y.append(data[i + seq_len:i + seq_len + pred_len])

    return np.array(X), np.array(y)
```

**Q8: 实现时间序列的交叉验证**

```python
def time_series_cv(data, n_splits=5, test_size=None):
    """时间序列交叉验证（TimeSeriesSplit）"""
    n_samples = len(data)
    test_size = test_size or n_samples // (n_splits + 1)

    indices = np.arange(n_samples)

    for i in range(n_splits):
        # 训练集结束位置
        train_end = n_samples - (n_splits - i) * test_size
        # 测试集范围
        test_start = train_end
        test_end = test_start + test_size

        train_indices = indices[:train_end]
        test_indices = indices[test_start:test_end]

        yield train_indices, test_indices
```

---

## 延伸阅读

### 推荐论文

1. **LSTM 与 GRU**
   - "Long Short-Term Memory" - Hochreiter & Schmidhuber, 1997
   - "Learning Phrase Representations using RNN Encoder-Decoder" - Cho et al., 2014

2. **TCN**
   - "An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling" - Bai et al., 2018

3. **时序 Transformer**
   - "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting" - Zhou et al., 2021
   - "Autoformer: Decomposition Transformers with Auto-Correlation for Long-Term Series Forecasting" - Wu et al., 2021
   - "Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting" - Lim et al., 2021

4. **概率预测**
   - "DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks" - Salinas et al., 2020

### 开源库推荐

- **PyTorch Forecasting**：时间序列预测专用库
- **GluonTS**：Amazon 开源的概率时间序列建模库
- **Darts**：时间序列预测和分析库
- **NeuralProphet**：受 Prophet 启发的神经网络预测库

### 进阶主题

1. **概率预测与不确定性估计**
2. **异常检测与时间序列**
3. **因果推断在时间序列中的应用**
4. **图神经网络处理时空数据**
5. **预训练时间序列模型**
6. **在线学习与增量更新**

---

## 总结

时间序列深度学习是一个快速发展的领域，从 LSTM/GRU 到 TCN 再到 Transformer，模型架构不断演进。选择合适的模型需要考虑：

1. **数据特性**：序列长度、周期性、变量数量
2. **任务需求**：单步/多步预测、点预测/概率预测
3. **计算资源**：训练时间、推理延迟
4. **可解释性要求**：是否需要理解预测依据

实践中，建议从简单模型（如 LSTM）开始，建立 baseline，然后根据需要尝试更复杂的架构。同时，特征工程和数据预处理往往比模型选择更重要。持续关注领域最新进展，结合实际问题灵活运用，才能取得最佳效果。
