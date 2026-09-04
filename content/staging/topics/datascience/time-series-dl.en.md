---
title: "Time Series Analysis: Deep Learning Methods"
description: "Time series forecasting with deep learning: LSTM, Temporal CNN, and Transformer"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - time series
  - LSTM
  - Transformer
  - deep learning
status: imported
origin: old/src/content/docs/datascience/time-series-dl.en.md
divergence: 0.236
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 22
  lastUpdated: 2026-01-07
---

Time series forecasting is one of the most critical tasks in data science, with applications ranging from stock price prediction and weather forecasting to demand planning and anomaly detection. While traditional statistical methods like ARIMA and exponential smoothing have served well for decades, deep learning approaches have emerged as powerful alternatives that can capture complex nonlinear patterns and dependencies in sequential data. We explore modern deep learning architectures for time series analysis, from foundational LSTM networks to state-of-the-art Transformer models.

---

## Sequence Modeling Challenges

Time series data presents unique challenges that distinguish it from other machine learning tasks. Understanding these challenges is essential for selecting appropriate architectures and designing effective solutions.

### Temporal Dependencies

Time series data exhibits dependencies across time steps. A value at time $t$ often depends on values at times $t-1, t-2, \ldots, t-k$. These dependencies can be:

- **Short-term**: Recent observations strongly influence current values
- **Long-term**: Seasonal patterns or trends spanning weeks, months, or years
- **Multi-scale**: Combinations of dependencies at different temporal resolutions

### Non-Stationarity

Real-world time series often exhibit:

- **Trend**: Long-term increase or decrease
- **Seasonality**: Recurring patterns at fixed intervals
- **Concept drift**: Changing statistical properties over time

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def generate_complex_time_series(n_points=1000, seed=42):
    """Generate a time series with trend, seasonality, and noise."""
    np.random.seed(seed)
    t = np.arange(n_points)

    # Trend component
    trend = 0.02 * t

    # Multiple seasonal components
    daily_seasonality = 10 * np.sin(2 * np.pi * t / 24)
    weekly_seasonality = 5 * np.sin(2 * np.pi * t / (24 * 7))

    # Noise
    noise = np.random.normal(0, 2, n_points)

    # Combine components
    series = trend + daily_seasonality + weekly_seasonality + noise

    return pd.Series(series, index=pd.date_range('2023-01-01', periods=n_points, freq='H'))

# Generate and visualize
series = generate_complex_time_series()
fig, axes = plt.subplots(2, 1, figsize=(14, 8))

axes[0].plot(series[:500])
axes[0].set_title('Time Series with Trend and Seasonality')
axes[0].set_xlabel('Time')
axes[0].set_ylabel('Value')

# Autocorrelation plot
from pandas.plotting import autocorrelation_plot
autocorrelation_plot(series, ax=axes[1])
axes[1].set_title('Autocorrelation')

plt.tight_layout()
plt.savefig('time_series_analysis.png', dpi=150)
```

### Variable Length Sequences

Unlike fixed-size inputs in image classification, time series can have:

- Variable input lengths (different historical windows)
- Variable output lengths (different forecast horizons)
- Missing values and irregular sampling

### Key Design Decisions

When designing deep learning models for time series, consider:

| Aspect | Options | Considerations |
|--------|---------|----------------|
| Input window | Fixed vs. variable | Memory constraints, pattern length |
| Forecast horizon | Single vs. multi-step | Error accumulation, direct vs. recursive |
| Architecture | RNN, CNN, Transformer | Sequence length, computational budget |
| Features | Univariate vs. multivariate | Available data, correlation structure |

---

## LSTM and GRU for Forecasting

Long Short-Term Memory (LSTM) networks and Gated Recurrent Units (GRU) are recurrent neural network architectures specifically designed to capture long-term dependencies in sequential data.

### LSTM Architecture

LSTM introduces a memory cell and gating mechanisms to control information flow:

**Forget Gate**: Decides what information to discard from the cell state
$$f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$$

**Input Gate**: Decides what new information to store
$$i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$$

**Candidate Cell State**: Creates candidate values to add
$$\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C)$$

**Cell State Update**: Combines forget and input operations
$$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$$

**Output Gate**: Decides what to output
$$o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o)$$
$$h_t = o_t \odot \tanh(C_t)$$

### PyTorch Implementation

```python
import torch
import torch.nn as nn

class LSTMForecaster(nn.Module):
    """LSTM-based time series forecasting model."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_layers: int,
        output_size: int,
        dropout: float = 0.2,
        bidirectional: bool = False
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional
        )

        # Output layer
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * self.num_directions, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, output_size)
        )

    def forward(self, x, hidden=None):
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, input_size)
            hidden: Optional initial hidden state
        Returns:
            Output predictions of shape (batch_size, output_size)
        """
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x, hidden)

        # Use the last time step output
        if self.bidirectional:
            # Concatenate forward and backward final states
            out = torch.cat([h_n[-2], h_n[-1]], dim=1)
        else:
            out = lstm_out[:, -1, :]

        # Prediction
        output = self.fc(out)
        return output

    def init_hidden(self, batch_size, device):
        """Initialize hidden state."""
        h0 = torch.zeros(
            self.num_layers * self.num_directions,
            batch_size,
            self.hidden_size,
            device=device
        )
        c0 = torch.zeros_like(h0)
        return (h0, c0)


# Example usage
model = LSTMForecaster(
    input_size=1,        # Univariate time series
    hidden_size=64,
    num_layers=2,
    output_size=1,       # Single-step forecast
    dropout=0.2
)

# Sample input: batch of 32, sequence length 24, 1 feature
x = torch.randn(32, 24, 1)
output = model(x)
print(f"Output shape: {output.shape}")  # torch.Size([32, 1])
```

### GRU Architecture

GRU simplifies LSTM by combining the forget and input gates into a single update gate:

```python
class GRUForecaster(nn.Module):
    """GRU-based time series forecasting model."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_layers: int,
        output_size: int,
        dropout: float = 0.2
    ):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # GRU forward pass
        gru_out, h_n = self.gru(x)

        # Use last hidden state
        output = self.fc(gru_out[:, -1, :])
        return output
```

### Multi-Step Forecasting Strategies

For predicting multiple future time steps, there are several approaches:

**1. Recursive (Autoregressive) Strategy**

```python
class RecursiveLSTM(nn.Module):
    """LSTM with recursive multi-step forecasting."""

    def __init__(self, input_size, hidden_size, num_layers):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, input_size)

    def forward(self, x, forecast_horizon):
        """
        Args:
            x: Input sequence (batch_size, seq_len, input_size)
            forecast_horizon: Number of steps to forecast
        """
        predictions = []
        lstm_out, hidden = self.lstm(x)

        # Use last output as first prediction input
        current_input = lstm_out[:, -1:, :]

        for _ in range(forecast_horizon):
            pred = self.fc(current_input)
            predictions.append(pred)

            # Feed prediction back as input
            current_input, hidden = self.lstm(pred, hidden)
            current_input = current_input

        return torch.cat(predictions, dim=1)
```

**2. Direct Multi-Output Strategy**

```python
class DirectMultiStepLSTM(nn.Module):
    """LSTM with direct multi-step output."""

    def __init__(self, input_size, hidden_size, num_layers, forecast_horizon):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, forecast_horizon)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        # Predict all future steps at once
        output = self.fc(lstm_out[:, -1, :])
        return output
```

---

## Seq2Seq Encoder-Decoder Architecture

The Sequence-to-Sequence (Seq2Seq) architecture is particularly effective for time series forecasting tasks where the input and output sequences may have different lengths.

### Architecture Overview

The Seq2Seq model consists of two main components:

1. **Encoder**: Processes the input sequence and compresses it into a context vector
2. **Decoder**: Generates the output sequence from the context vector

### Encoder-Decoder with Attention

Attention mechanisms allow the decoder to focus on different parts of the input sequence at each decoding step:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class Attention(nn.Module):
    """Bahdanau-style attention mechanism."""

    def __init__(self, encoder_hidden_size, decoder_hidden_size):
        super().__init__()
        self.attn = nn.Linear(encoder_hidden_size + decoder_hidden_size, decoder_hidden_size)
        self.v = nn.Linear(decoder_hidden_size, 1, bias=False)

    def forward(self, decoder_hidden, encoder_outputs):
        """
        Args:
            decoder_hidden: (batch_size, decoder_hidden_size)
            encoder_outputs: (batch_size, seq_len, encoder_hidden_size)
        Returns:
            context: (batch_size, encoder_hidden_size)
            attention_weights: (batch_size, seq_len)
        """
        seq_len = encoder_outputs.size(1)

        # Repeat decoder hidden state
        decoder_hidden = decoder_hidden.unsqueeze(1).repeat(1, seq_len, 1)

        # Calculate attention energies
        energy = torch.tanh(self.attn(torch.cat([decoder_hidden, encoder_outputs], dim=2)))
        attention_scores = self.v(energy).squeeze(2)

        # Softmax to get attention weights
        attention_weights = F.softmax(attention_scores, dim=1)

        # Calculate context vector
        context = torch.bmm(attention_weights.unsqueeze(1), encoder_outputs).squeeze(1)

        return context, attention_weights


class Seq2SeqEncoder(nn.Module):
    """Encoder for Seq2Seq model."""

    def __init__(self, input_size, hidden_size, num_layers, dropout=0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size, hidden_size, num_layers,
            batch_first=True, dropout=dropout, bidirectional=True
        )
        self.fc = nn.Linear(hidden_size * 2, hidden_size)

    def forward(self, x):
        outputs, (hidden, cell) = self.lstm(x)

        # Combine bidirectional hidden states
        hidden = torch.tanh(self.fc(torch.cat([hidden[-2], hidden[-1]], dim=1)))

        return outputs, hidden, cell


class Seq2SeqDecoder(nn.Module):
    """Decoder with attention for Seq2Seq model."""

    def __init__(self, input_size, hidden_size, output_size, num_layers, dropout=0.2):
        super().__init__()
        self.attention = Attention(hidden_size * 2, hidden_size)

        self.lstm = nn.LSTM(
            input_size + hidden_size * 2, hidden_size, num_layers,
            batch_first=True, dropout=dropout
        )

        self.fc = nn.Linear(hidden_size + hidden_size * 2 + input_size, output_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, hidden, cell, encoder_outputs):
        """
        Args:
            x: Current input (batch_size, 1, input_size)
            hidden: Previous hidden state
            cell: Previous cell state
            encoder_outputs: All encoder outputs
        """
        # Calculate attention
        context, attention_weights = self.attention(hidden[-1], encoder_outputs)

        # Combine input with context
        rnn_input = torch.cat([x, context.unsqueeze(1)], dim=2)

        # LSTM step
        output, (hidden, cell) = self.lstm(rnn_input, (hidden, cell))

        # Final prediction
        output = output.squeeze(1)
        prediction = self.fc(torch.cat([output, context, x.squeeze(1)], dim=1))

        return prediction, hidden, cell, attention_weights


class Seq2SeqForecaster(nn.Module):
    """Complete Seq2Seq model for time series forecasting."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        output_size: int,
        num_layers: int = 2,
        dropout: float = 0.2
    ):
        super().__init__()
        self.encoder = Seq2SeqEncoder(input_size, hidden_size, num_layers, dropout)
        self.decoder = Seq2SeqDecoder(input_size, hidden_size, output_size, num_layers, dropout)
        self.output_size = output_size

    def forward(self, src, forecast_horizon, teacher_forcing_ratio=0.5, target=None):
        """
        Args:
            src: Source sequence (batch_size, src_len, input_size)
            forecast_horizon: Number of time steps to predict
            teacher_forcing_ratio: Probability of using ground truth as input
            target: Target sequence for teacher forcing (batch_size, forecast_horizon, output_size)
        """
        batch_size = src.size(0)

        # Encode input sequence
        encoder_outputs, hidden, cell = self.encoder(src)

        # Prepare decoder initial input (last value from source)
        decoder_input = src[:, -1:, :]

        # Initialize outputs
        outputs = []
        attentions = []

        # Expand hidden state for decoder layers
        hidden = hidden.unsqueeze(0).repeat(self.decoder.lstm.num_layers, 1, 1)
        cell = cell[-2:].contiguous()  # Use last 2 layers of cell state

        for t in range(forecast_horizon):
            output, hidden, cell, attn = self.decoder(
                decoder_input, hidden, cell, encoder_outputs
            )
            outputs.append(output.unsqueeze(1))
            attentions.append(attn.unsqueeze(1))

            # Teacher forcing
            if target is not None and torch.rand(1).item() < teacher_forcing_ratio:
                decoder_input = target[:, t:t+1, :]
            else:
                decoder_input = output.unsqueeze(1)

        outputs = torch.cat(outputs, dim=1)
        attentions = torch.cat(attentions, dim=1)

        return outputs, attentions


# Example usage
model = Seq2SeqForecaster(
    input_size=1,
    hidden_size=64,
    output_size=1,
    num_layers=2,
    dropout=0.2
)

# Input: 32 samples, 48 time steps history
src = torch.randn(32, 48, 1)
outputs, attentions = model(src, forecast_horizon=24)
print(f"Forecast shape: {outputs.shape}")  # torch.Size([32, 24, 1])
print(f"Attention shape: {attentions.shape}")  # torch.Size([32, 24, 48])
```

---

## Temporal Convolutional Networks (TCN)

Temporal Convolutional Networks offer an alternative to RNNs for sequence modeling. They use causal dilated convolutions to efficiently capture long-range dependencies while maintaining parallelization benefits.

### Key Concepts

**Causal Convolution**: Ensures that predictions at time $t$ only depend on values from time $t$ and earlier, preventing information leakage from the future.

**Dilated Convolution**: Uses a dilation factor to increase the receptive field exponentially without increasing computational complexity:

$$\text{Receptive Field} = 1 + \sum_{i=0}^{n-1} (k-1) \cdot d_i$$

where $k$ is kernel size and $d_i$ is dilation factor at layer $i$.

### TCN Architecture

```python
import torch
import torch.nn as nn
from torch.nn.utils import weight_norm

class CausalConv1d(nn.Module):
    """Causal 1D convolution with proper padding."""

    def __init__(self, in_channels, out_channels, kernel_size, dilation=1):
        super().__init__()
        self.padding = (kernel_size - 1) * dilation
        self.conv = nn.Conv1d(
            in_channels, out_channels, kernel_size,
            padding=self.padding, dilation=dilation
        )

    def forward(self, x):
        # x: (batch_size, channels, seq_len)
        out = self.conv(x)
        # Remove future values (causal padding)
        if self.padding > 0:
            out = out[:, :, :-self.padding]
        return out


class TemporalBlock(nn.Module):
    """Single temporal block with residual connection."""

    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        kernel_size: int,
        dilation: int,
        dropout: float = 0.2
    ):
        super().__init__()

        # First convolution
        self.conv1 = weight_norm(CausalConv1d(
            in_channels, out_channels, kernel_size, dilation
        ))
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(dropout)

        # Second convolution
        self.conv2 = weight_norm(CausalConv1d(
            out_channels, out_channels, kernel_size, dilation
        ))
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(dropout)

        # Residual connection
        self.downsample = nn.Conv1d(in_channels, out_channels, 1) \
            if in_channels != out_channels else None

        self.relu = nn.ReLU()

    def forward(self, x):
        # Main path
        out = self.dropout1(self.relu1(self.conv1(x)))
        out = self.dropout2(self.relu2(self.conv2(out)))

        # Residual connection
        res = x if self.downsample is None else self.downsample(x)

        return self.relu(out + res)


class TCN(nn.Module):
    """Temporal Convolutional Network for time series forecasting."""

    def __init__(
        self,
        input_size: int,
        output_size: int,
        num_channels: list,
        kernel_size: int = 3,
        dropout: float = 0.2
    ):
        """
        Args:
            input_size: Number of input features
            output_size: Number of output features
            num_channels: List of channel sizes for each temporal block
            kernel_size: Convolution kernel size
            dropout: Dropout rate
        """
        super().__init__()

        layers = []
        num_levels = len(num_channels)

        for i in range(num_levels):
            dilation = 2 ** i
            in_ch = input_size if i == 0 else num_channels[i-1]
            out_ch = num_channels[i]

            layers.append(TemporalBlock(
                in_ch, out_ch, kernel_size, dilation, dropout
            ))

        self.network = nn.Sequential(*layers)
        self.fc = nn.Linear(num_channels[-1], output_size)

    def forward(self, x):
        """
        Args:
            x: Input tensor (batch_size, seq_len, input_size)
        Returns:
            Output predictions (batch_size, output_size)
        """
        # Transpose for convolution: (batch, channels, seq_len)
        x = x.transpose(1, 2)

        # TCN forward pass
        out = self.network(x)

        # Use last time step for prediction
        out = out[:, :, -1]

        return self.fc(out)

    def receptive_field(self, kernel_size, num_levels):
        """Calculate the receptive field of the TCN."""
        return 1 + 2 * (kernel_size - 1) * (2 ** num_levels - 1)


class TCNMultiStep(nn.Module):
    """TCN for multi-step forecasting."""

    def __init__(
        self,
        input_size: int,
        output_size: int,
        forecast_horizon: int,
        num_channels: list,
        kernel_size: int = 3,
        dropout: float = 0.2
    ):
        super().__init__()

        self.tcn = TCN(input_size, num_channels[-1], num_channels, kernel_size, dropout)
        self.fc = nn.Linear(num_channels[-1], forecast_horizon * output_size)
        self.forecast_horizon = forecast_horizon
        self.output_size = output_size

    def forward(self, x):
        # Get TCN features
        out = self.tcn.network(x.transpose(1, 2))
        out = out[:, :, -1]

        # Predict all future steps
        predictions = self.fc(out)

        # Reshape to (batch, horizon, features)
        return predictions.view(-1, self.forecast_horizon, self.output_size)


# Example usage
model = TCN(
    input_size=1,
    output_size=1,
    num_channels=[32, 64, 128],
    kernel_size=3,
    dropout=0.2
)

# Calculate receptive field
receptive_field = model.receptive_field(kernel_size=3, num_levels=3)
print(f"Receptive field: {receptive_field}")  # 29

# Forward pass
x = torch.randn(32, 48, 1)
output = model(x)
print(f"Output shape: {output.shape}")  # torch.Size([32, 1])
```

### TCN vs LSTM Comparison

| Aspect | TCN | LSTM |
|--------|-----|------|
| Parallelization | Full parallel | Sequential |
| Memory | O(n) | O(n) |
| Gradient flow | Stable (residual) | Can suffer from vanishing gradients |
| Receptive field | Explicit, controllable | Implicit, learned |
| Flexibility | Fixed receptive field | Adaptive context |
| Training speed | Generally faster | Slower |

---

## Transformers for Time Series

Transformers have revolutionized sequence modeling in NLP and are increasingly being adapted for time series forecasting. They offer parallel processing and can capture long-range dependencies through self-attention.

### Vanilla Transformer for Time Series

```python
import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for time series."""

    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)

        self.register_buffer('pe', pe)

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class TimeSeriesTransformer(nn.Module):
    """Transformer model for time series forecasting."""

    def __init__(
        self,
        input_size: int,
        d_model: int = 64,
        nhead: int = 4,
        num_encoder_layers: int = 3,
        num_decoder_layers: int = 3,
        dim_feedforward: int = 256,
        dropout: float = 0.1,
        forecast_horizon: int = 1
    ):
        super().__init__()

        self.d_model = d_model
        self.forecast_horizon = forecast_horizon

        # Input embedding
        self.input_embedding = nn.Linear(input_size, d_model)
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

        # Output projection
        self.output_projection = nn.Linear(d_model, input_size)

    def generate_square_subsequent_mask(self, sz):
        """Generate causal mask for decoder."""
        mask = torch.triu(torch.ones(sz, sz), diagonal=1)
        mask = mask.masked_fill(mask == 1, float('-inf'))
        return mask

    def forward(self, src, tgt=None):
        """
        Args:
            src: Source sequence (batch_size, src_len, input_size)
            tgt: Target sequence for training (batch_size, tgt_len, input_size)
        """
        batch_size = src.size(0)

        # Embed and add positional encoding
        src_embed = self.pos_encoder(self.input_embedding(src) * math.sqrt(self.d_model))

        if tgt is None:
            # Inference: use last value as decoder input start
            tgt = src[:, -1:, :]

        tgt_embed = self.pos_encoder(self.input_embedding(tgt) * math.sqrt(self.d_model))

        # Generate causal mask
        tgt_mask = self.generate_square_subsequent_mask(tgt_embed.size(1)).to(src.device)

        # Transformer forward pass
        output = self.transformer(src_embed, tgt_embed, tgt_mask=tgt_mask)

        # Project to output space
        output = self.output_projection(output)

        return output

    def forecast(self, src, horizon):
        """Generate forecasts autoregressively."""
        self.train(False)

        with torch.no_grad():
            # Start with last value
            decoder_input = src[:, -1:, :]
            predictions = []

            for _ in range(horizon):
                output = self.forward(src, decoder_input)
                pred = output[:, -1:, :]
                predictions.append(pred)
                decoder_input = torch.cat([decoder_input, pred], dim=1)

            return torch.cat(predictions, dim=1)


# Example usage
model = TimeSeriesTransformer(
    input_size=1,
    d_model=64,
    nhead=4,
    num_encoder_layers=3,
    num_decoder_layers=3,
    forecast_horizon=24
)

src = torch.randn(32, 48, 1)
forecast = model.forecast(src, horizon=24)
print(f"Forecast shape: {forecast.shape}")  # torch.Size([32, 24, 1])
```

### Informer: Efficient Transformer for Long Sequences

Informer addresses the quadratic complexity of self-attention through ProbSparse attention:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class ProbSparseAttention(nn.Module):
    """ProbSparse self-attention for Informer."""

    def __init__(self, d_model, n_heads, dropout=0.1, factor=5):
        super().__init__()
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.factor = factor

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def _prob_QK(self, Q, K, sample_k):
        """Calculate probsparse attention scores."""
        B, H, L_Q, D = Q.shape
        _, _, L_K, _ = K.shape

        # Sample keys for sparsity estimation
        K_sample = K[:, :, torch.randperm(L_K)[:sample_k], :]

        # Calculate attention scores for sampled keys
        Q_K_sample = torch.matmul(Q, K_sample.transpose(-2, -1)) / math.sqrt(D)

        # Measure sparsity
        M = Q_K_sample.max(dim=-1)[0] - Q_K_sample.mean(dim=-1)

        # Select top-u queries
        u = max(int(self.factor * math.log(L_Q)), 1)
        M_top = M.topk(u, sorted=False)[1]

        return M_top

    def forward(self, x, mask=None):
        B, L, _ = x.shape

        Q = self.W_q(x).view(B, L, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(B, L, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(B, L, self.n_heads, self.d_k).transpose(1, 2)

        # Standard attention for simplicity (full ProbSparse is more complex)
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attn = F.softmax(scores, dim=-1)
        attn = self.dropout(attn)

        output = torch.matmul(attn, V)
        output = output.transpose(1, 2).contiguous().view(B, L, -1)

        return self.W_o(output)


class InformerEncoderLayer(nn.Module):
    """Informer encoder layer with distilling."""

    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()

        self.attention = ProbSparseAttention(d_model, n_heads, dropout)
        self.conv1 = nn.Conv1d(d_model, d_ff, 1)
        self.conv2 = nn.Conv1d(d_ff, d_model, 1)

        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

        # Distilling layer (downsampling)
        self.distill = nn.MaxPool1d(kernel_size=2, stride=2, padding=1)

    def forward(self, x, distill=True):
        # Self-attention
        attn_out = self.attention(x)
        x = self.norm1(x + self.dropout(attn_out))

        # Feed-forward
        ff_out = self.conv2(F.gelu(self.conv1(x.transpose(1, 2))))
        x = self.norm2(x + self.dropout(ff_out.transpose(1, 2)))

        # Distilling (reduce sequence length)
        if distill:
            x = self.distill(x.transpose(1, 2)).transpose(1, 2)

        return x


class Informer(nn.Module):
    """Informer model for long sequence time series forecasting."""

    def __init__(
        self,
        input_size: int,
        d_model: int = 512,
        n_heads: int = 8,
        e_layers: int = 3,
        d_layers: int = 2,
        d_ff: int = 2048,
        dropout: float = 0.1,
        label_len: int = 48,
        pred_len: int = 24
    ):
        super().__init__()

        self.label_len = label_len
        self.pred_len = pred_len

        # Embedding
        self.enc_embedding = nn.Linear(input_size, d_model)
        self.dec_embedding = nn.Linear(input_size, d_model)
        self.pos_encoding = PositionalEncoding(d_model, dropout=dropout)

        # Encoder
        self.encoder_layers = nn.ModuleList([
            InformerEncoderLayer(d_model, n_heads, d_ff, dropout)
            for _ in range(e_layers)
        ])

        # Decoder (simplified - using standard transformer decoder)
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_ff,
            dropout=dropout,
            batch_first=True
        )
        self.decoder = nn.TransformerDecoder(decoder_layer, num_layers=d_layers)

        # Output projection
        self.projection = nn.Linear(d_model, input_size)

    def forward(self, x_enc, x_dec):
        """
        Args:
            x_enc: Encoder input (batch_size, seq_len, input_size)
            x_dec: Decoder input (batch_size, label_len + pred_len, input_size)
        """
        # Encoder
        enc_out = self.pos_encoding(self.enc_embedding(x_enc))
        for layer in self.encoder_layers:
            enc_out = layer(enc_out, distill=True)

        # Decoder
        dec_out = self.pos_encoding(self.dec_embedding(x_dec))
        dec_out = self.decoder(dec_out, enc_out)

        # Output
        output = self.projection(dec_out)

        return output[:, -self.pred_len:, :]
```

### Autoformer: Decomposition-Based Transformer

Autoformer introduces auto-correlation mechanism and series decomposition:

```python
class SeriesDecomposition(nn.Module):
    """Series decomposition block for Autoformer."""

    def __init__(self, kernel_size=25):
        super().__init__()
        self.kernel_size = kernel_size
        self.avg_pool = nn.AvgPool1d(kernel_size, stride=1, padding=kernel_size//2)

    def forward(self, x):
        """
        Args:
            x: Input tensor (batch_size, seq_len, features)
        Returns:
            trend: Trend component
            seasonal: Seasonal component
        """
        # x: (B, L, D) -> (B, D, L) for pooling
        x_transposed = x.transpose(1, 2)

        # Moving average for trend
        trend = self.avg_pool(x_transposed)

        # Handle edge cases from pooling
        if trend.size(-1) != x_transposed.size(-1):
            trend = F.pad(trend, (0, x_transposed.size(-1) - trend.size(-1)))

        trend = trend.transpose(1, 2)

        # Seasonal is the residual
        seasonal = x - trend

        return seasonal, trend


class AutoCorrelation(nn.Module):
    """Auto-correlation mechanism for Autoformer."""

    def __init__(self, d_model, n_heads, dropout=0.1, factor=3):
        super().__init__()
        self.factor = factor
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, queries, keys, values):
        B, L, _ = queries.shape
        _, S, _ = keys.shape
        H = self.n_heads

        Q = self.W_q(queries).view(B, L, H, -1).transpose(1, 2)
        K = self.W_k(keys).view(B, S, H, -1).transpose(1, 2)
        V = self.W_v(values).view(B, S, H, -1).transpose(1, 2)

        # Auto-correlation using FFT
        q_fft = torch.fft.rfft(Q, dim=-2)
        k_fft = torch.fft.rfft(K, dim=-2)

        # Correlation in frequency domain
        corr = q_fft * torch.conj(k_fft)
        corr = torch.fft.irfft(corr, n=L, dim=-2)

        # Time delay aggregation
        top_k = int(self.factor * math.log(L))
        weights, delays = torch.topk(corr.mean(dim=-1), top_k, dim=-1)
        weights = F.softmax(weights, dim=-1)

        # Aggregate with time delays (simplified)
        output = torch.matmul(weights.unsqueeze(-2), V)
        output = output.transpose(1, 2).contiguous().view(B, L, -1)

        return self.W_o(output)


class AutoformerEncoderLayer(nn.Module):
    """Autoformer encoder layer."""

    def __init__(self, d_model, n_heads, d_ff, kernel_size=25, dropout=0.1):
        super().__init__()

        self.auto_correlation = AutoCorrelation(d_model, n_heads, dropout)
        self.decomposition1 = SeriesDecomposition(kernel_size)
        self.decomposition2 = SeriesDecomposition(kernel_size)

        self.conv1 = nn.Conv1d(d_model, d_ff, 1)
        self.conv2 = nn.Conv1d(d_ff, d_model, 1)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # Auto-correlation
        attn_out = self.auto_correlation(x, x, x)
        x = x + self.dropout(attn_out)
        x, _ = self.decomposition1(x)

        # Feed-forward
        ff_out = self.conv2(F.gelu(self.conv1(x.transpose(1, 2))))
        x = x + self.dropout(ff_out.transpose(1, 2))
        x, _ = self.decomposition2(x)

        return x
```

---

## Multivariate Time Series Forecasting

Real-world time series often involve multiple related variables that influence each other. Multivariate forecasting captures these cross-variable dependencies.

### Challenges in Multivariate Forecasting

1. **Cross-variable dependencies**: Variables may influence each other with time lags
2. **Different dynamics**: Each variable may have different patterns and scales
3. **Missing data**: Some variables may have incomplete observations
4. **High dimensionality**: Large number of variables increases model complexity

### Multivariate LSTM

```python
class MultivariateLSTM(nn.Module):
    """LSTM for multivariate time series forecasting."""

    def __init__(
        self,
        num_features: int,
        hidden_size: int,
        num_layers: int,
        forecast_horizon: int,
        dropout: float = 0.2
    ):
        super().__init__()

        self.num_features = num_features
        self.forecast_horizon = forecast_horizon

        # Feature embedding (optional)
        self.feature_embedding = nn.Linear(num_features, hidden_size)

        # LSTM
        self.lstm = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )

        # Output heads for each feature
        self.output_heads = nn.ModuleList([
            nn.Linear(hidden_size, forecast_horizon)
            for _ in range(num_features)
        ])

    def forward(self, x):
        """
        Args:
            x: Input tensor (batch_size, seq_len, num_features)
        Returns:
            predictions: (batch_size, forecast_horizon, num_features)
        """
        # Embed features
        x = self.feature_embedding(x)

        # LSTM encoding
        lstm_out, _ = self.lstm(x)

        # Use last hidden state
        last_hidden = lstm_out[:, -1, :]

        # Generate predictions for each feature
        predictions = []
        for head in self.output_heads:
            pred = head(last_hidden)
            predictions.append(pred.unsqueeze(-1))

        return torch.cat(predictions, dim=-1)


class CrossVariableAttention(nn.Module):
    """Attention across variables for multivariate forecasting."""

    def __init__(self, num_features, d_model, n_heads, dropout=0.1):
        super().__init__()

        self.feature_embedding = nn.Linear(1, d_model)

        self.cross_attention = nn.MultiheadAttention(
            d_model, n_heads, dropout=dropout, batch_first=True
        )

        self.norm = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        """
        Args:
            x: (batch_size, seq_len, num_features)
        Returns:
            x: (batch_size, seq_len, num_features, d_model)
        """
        B, L, F = x.shape

        # Embed each feature separately
        x = x.unsqueeze(-1)  # (B, L, F, 1)
        x = self.feature_embedding(x)  # (B, L, F, D)

        # Reshape for cross-variable attention at each time step
        x = x.permute(0, 1, 3, 2)  # (B, L, D, F)

        outputs = []
        for t in range(L):
            x_t = x[:, t, :, :].transpose(1, 2)  # (B, F, D)
            attn_out, _ = self.cross_attention(x_t, x_t, x_t)
            x_t = self.norm(x_t + self.dropout(attn_out))
            outputs.append(x_t.unsqueeze(1))

        return torch.cat(outputs, dim=1)  # (B, L, F, D)


class MultivariateTransformer(nn.Module):
    """Transformer for multivariate time series with cross-variable attention."""

    def __init__(
        self,
        num_features: int,
        d_model: int = 64,
        n_heads: int = 4,
        num_layers: int = 3,
        forecast_horizon: int = 24,
        dropout: float = 0.1
    ):
        super().__init__()

        self.num_features = num_features
        self.forecast_horizon = forecast_horizon
        self.d_model = d_model

        # Input embedding
        self.input_embedding = nn.Linear(num_features, d_model)
        self.pos_encoding = PositionalEncoding(d_model, dropout=dropout)

        # Temporal transformer layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            batch_first=True
        )
        self.temporal_encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        # Cross-variable attention
        self.cross_var_attention = CrossVariableAttention(num_features, d_model, n_heads, dropout)

        # Output projection
        self.output_projection = nn.Linear(d_model, forecast_horizon * num_features)

    def forward(self, x):
        """
        Args:
            x: Input tensor (batch_size, seq_len, num_features)
        Returns:
            predictions: (batch_size, forecast_horizon, num_features)
        """
        B, L, F = x.shape

        # Temporal encoding
        x_embed = self.pos_encoding(self.input_embedding(x) * math.sqrt(self.d_model))
        temporal_out = self.temporal_encoder(x_embed)

        # Use last time step
        out = temporal_out[:, -1, :]

        # Output projection
        predictions = self.output_projection(out)
        predictions = predictions.view(B, self.forecast_horizon, F)

        return predictions


# Example usage
model = MultivariateTransformer(
    num_features=5,
    d_model=64,
    n_heads=4,
    num_layers=3,
    forecast_horizon=24
)

# Input: 32 samples, 48 time steps, 5 features
x = torch.randn(32, 48, 5)
predictions = model(x)
print(f"Predictions shape: {predictions.shape}")  # torch.Size([32, 24, 5])
```

### Channel Independence vs Channel Mixing

Recent research shows that simple channel-independent models can outperform complex channel-mixing approaches:

```python
class PatchTST(nn.Module):
    """Patch-based Transformer with channel independence."""

    def __init__(
        self,
        num_features: int,
        seq_len: int,
        patch_len: int = 16,
        stride: int = 8,
        d_model: int = 128,
        n_heads: int = 4,
        num_layers: int = 3,
        forecast_horizon: int = 24,
        dropout: float = 0.1
    ):
        super().__init__()

        self.num_features = num_features
        self.patch_len = patch_len
        self.stride = stride
        self.forecast_horizon = forecast_horizon

        # Calculate number of patches
        self.num_patches = (seq_len - patch_len) // stride + 1

        # Patch embedding (per channel)
        self.patch_embedding = nn.Linear(patch_len, d_model)
        self.pos_encoding = nn.Parameter(torch.randn(1, self.num_patches, d_model))

        # Transformer encoder (shared across channels)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            batch_first=True
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        # Output head (per channel)
        self.head = nn.Linear(d_model * self.num_patches, forecast_horizon)

        self.dropout = nn.Dropout(dropout)

    def create_patches(self, x):
        """Create patches from input sequence."""
        # x: (B, L, C) -> patches: (B, num_patches, patch_len, C)
        B, L, C = x.shape

        patches = []
        for i in range(0, L - self.patch_len + 1, self.stride):
            patch = x[:, i:i+self.patch_len, :]
            patches.append(patch)

        return torch.stack(patches, dim=1)  # (B, num_patches, patch_len, C)

    def forward(self, x):
        """
        Args:
            x: Input tensor (batch_size, seq_len, num_features)
        Returns:
            predictions: (batch_size, forecast_horizon, num_features)
        """
        B, L, C = x.shape

        # Create patches
        patches = self.create_patches(x)  # (B, num_patches, patch_len, C)

        # Process each channel independently
        outputs = []
        for c in range(C):
            # Get patches for this channel
            channel_patches = patches[:, :, :, c]  # (B, num_patches, patch_len)

            # Embed patches
            embedded = self.patch_embedding(channel_patches)  # (B, num_patches, d_model)
            embedded = embedded + self.pos_encoding
            embedded = self.dropout(embedded)

            # Transformer encoding
            encoded = self.encoder(embedded)  # (B, num_patches, d_model)

            # Flatten and project to forecast
            flat = encoded.view(B, -1)
            out = self.head(flat)  # (B, forecast_horizon)
            outputs.append(out.unsqueeze(-1))

        return torch.cat(outputs, dim=-1)  # (B, forecast_horizon, C)
```

---

## PyTorch Implementation

Below is a complete, production-ready implementation for training time series models.

### Data Preparation

```python
import torch
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

class TimeSeriesDataset(Dataset):
    """Dataset for time series forecasting."""

    def __init__(
        self,
        data: np.ndarray,
        seq_len: int,
        forecast_horizon: int,
        stride: int = 1
    ):
        """
        Args:
            data: Time series data of shape (time_steps, features)
            seq_len: Length of input sequence
            forecast_horizon: Number of steps to predict
            stride: Step size between samples
        """
        self.data = torch.FloatTensor(data)
        self.seq_len = seq_len
        self.forecast_horizon = forecast_horizon
        self.stride = stride

        # Calculate valid sample indices
        self.valid_indices = list(range(
            0,
            len(data) - seq_len - forecast_horizon + 1,
            stride
        ))

    def __len__(self):
        return len(self.valid_indices)

    def __getitem__(self, idx):
        start_idx = self.valid_indices[idx]

        # Input sequence
        x = self.data[start_idx:start_idx + self.seq_len]

        # Target sequence
        y = self.data[start_idx + self.seq_len:start_idx + self.seq_len + self.forecast_horizon]

        return x, y


def prepare_data(
    df: pd.DataFrame,
    target_col: str,
    feature_cols: list = None,
    train_ratio: float = 0.7,
    val_ratio: float = 0.15,
    seq_len: int = 48,
    forecast_horizon: int = 24,
    batch_size: int = 32
):
    """Prepare data loaders for training."""

    # Select features
    if feature_cols is None:
        feature_cols = [target_col]

    data = df[feature_cols].values

    # Normalize
    scaler = StandardScaler()
    data_scaled = scaler.fit_transform(data)

    # Split data
    n = len(data_scaled)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_data = data_scaled[:train_end]
    val_data = data_scaled[train_end:val_end]
    test_data = data_scaled[val_end:]

    # Create datasets
    train_dataset = TimeSeriesDataset(train_data, seq_len, forecast_horizon)
    val_dataset = TimeSeriesDataset(val_data, seq_len, forecast_horizon)
    test_dataset = TimeSeriesDataset(test_data, seq_len, forecast_horizon)

    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader, scaler


# Example: Create synthetic data
np.random.seed(42)
n_samples = 10000
t = np.arange(n_samples)
data = (
    0.01 * t +  # Trend
    10 * np.sin(2 * np.pi * t / 24) +  # Daily seasonality
    5 * np.sin(2 * np.pi * t / (24 * 7)) +  # Weekly seasonality
    np.random.normal(0, 2, n_samples)  # Noise
)

df = pd.DataFrame({'value': data})
train_loader, val_loader, test_loader, scaler = prepare_data(
    df,
    target_col='value',
    seq_len=48,
    forecast_horizon=24,
    batch_size=32
)
```

### Training Loop

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import OneCycleLR
from tqdm import tqdm
import numpy as np

class TimeSeriesTrainer:
    """Trainer for time series forecasting models."""

    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        criterion: nn.Module = None,
        optimizer: optim.Optimizer = None,
        scheduler = None,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device

        # Default criterion
        self.criterion = criterion or nn.MSELoss()

        # Default optimizer
        self.optimizer = optimizer or optim.AdamW(
            model.parameters(), lr=1e-3, weight_decay=0.01
        )

        # Default scheduler
        self.scheduler = scheduler or OneCycleLR(
            self.optimizer,
            max_lr=1e-2,
            epochs=100,
            steps_per_epoch=len(train_loader)
        )

        self.train_losses = []
        self.val_losses = []
        self.best_val_loss = float('inf')

    def train_epoch(self):
        """Train for one epoch."""
        self.model.train()
        total_loss = 0

        pbar = tqdm(self.train_loader, desc='Training')
        for batch_idx, (x, y) in enumerate(pbar):
            x, y = x.to(self.device), y.to(self.device)

            # Forward pass
            self.optimizer.zero_grad()
            output = self.model(x)

            # Handle different output shapes
            if output.dim() == 2 and y.dim() == 3:
                output = output.unsqueeze(-1)

            loss = self.criterion(output, y)

            # Backward pass
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            self.optimizer.step()

            if self.scheduler is not None:
                self.scheduler.step()

            total_loss += loss.item()

            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'lr': f'{self.optimizer.param_groups[0]["lr"]:.6f}'
            })

        return total_loss / len(self.train_loader)

    @torch.no_grad()
    def validate(self):
        """Validate the model."""
        self.model.train(False)
        total_loss = 0
        all_preds = []
        all_targets = []

        for x, y in self.val_loader:
            x, y = x.to(self.device), y.to(self.device)

            output = self.model(x)

            if output.dim() == 2 and y.dim() == 3:
                output = output.unsqueeze(-1)

            loss = self.criterion(output, y)
            total_loss += loss.item()

            all_preds.append(output.cpu())
            all_targets.append(y.cpu())

        all_preds = torch.cat(all_preds, dim=0)
        all_targets = torch.cat(all_targets, dim=0)

        # Calculate metrics
        mae = torch.abs(all_preds - all_targets).mean().item()
        mse = ((all_preds - all_targets) ** 2).mean().item()

        return total_loss / len(self.val_loader), mae, mse

    def train(
        self,
        epochs: int,
        early_stopping_patience: int = 10,
        save_path: str = 'best_model.pt'
    ):
        """Full training loop."""
        patience_counter = 0

        for epoch in range(epochs):
            print(f'\nEpoch {epoch + 1}/{epochs}')

            # Train
            train_loss = self.train_epoch()
            self.train_losses.append(train_loss)

            # Validate
            val_loss, mae, mse = self.validate()
            self.val_losses.append(val_loss)

            print(f'Train Loss: {train_loss:.4f}')
            print(f'Val Loss: {val_loss:.4f}, MAE: {mae:.4f}, MSE: {mse:.4f}')

            # Save best model
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_loss': val_loss
                }, save_path)
                print(f'Model saved to {save_path}')
                patience_counter = 0
            else:
                patience_counter += 1

            # Early stopping
            if patience_counter >= early_stopping_patience:
                print(f'Early stopping at epoch {epoch + 1}')
                break

        return self.train_losses, self.val_losses


# Complete training example
def main():
    # Set random seed
    torch.manual_seed(42)
    np.random.seed(42)

    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')

    # Generate synthetic data
    n_samples = 10000
    t = np.arange(n_samples)
    data = (
        0.01 * t +
        10 * np.sin(2 * np.pi * t / 24) +
        5 * np.sin(2 * np.pi * t / (24 * 7)) +
        np.random.normal(0, 2, n_samples)
    )

    df = pd.DataFrame({'value': data})

    # Prepare data
    train_loader, val_loader, test_loader, scaler = prepare_data(
        df,
        target_col='value',
        seq_len=48,
        forecast_horizon=24,
        batch_size=32
    )

    # Create model
    model = LSTMForecaster(
        input_size=1,
        hidden_size=64,
        num_layers=2,
        output_size=24,
        dropout=0.2
    )

    # Train
    trainer = TimeSeriesTrainer(model, train_loader, val_loader, device=device)
    train_losses, val_losses = trainer.train(epochs=50, early_stopping_patience=10)

    # Load best model and test
    model.load_state_dict(torch.load('best_model.pt')['model_state_dict'])
    test_loss, test_mae, test_mse = trainer.validate()
    print(f'\nTest Loss: {test_loss:.4f}, MAE: {test_mae:.4f}, MSE: {test_mse:.4f}')


if __name__ == '__main__':
    main()
```

### Metrics Calculation

```python
import torch
import numpy as np

def calculate_metrics(predictions: torch.Tensor, targets: torch.Tensor):
    """Calculate common forecasting metrics."""

    # Ensure same device and type
    predictions = predictions.float()
    targets = targets.float()

    # Mean Absolute Error
    mae = torch.abs(predictions - targets).mean().item()

    # Mean Squared Error
    mse = ((predictions - targets) ** 2).mean().item()

    # Root Mean Squared Error
    rmse = np.sqrt(mse)

    # Mean Absolute Percentage Error
    epsilon = 1e-8
    mape = (torch.abs((targets - predictions) / (targets + epsilon)) * 100).mean().item()

    # Symmetric Mean Absolute Percentage Error
    smape = (200 * torch.abs(predictions - targets) /
             (torch.abs(predictions) + torch.abs(targets) + epsilon)).mean().item()

    return {
        'MAE': mae,
        'MSE': mse,
        'RMSE': rmse,
        'MAPE': mape,
        'sMAPE': smape
    }


def assess_model(model, test_loader, device, scaler=None):
    """Comprehensive model assessment."""
    model.train(False)

    all_preds = []
    all_targets = []

    with torch.no_grad():
        for x, y in test_loader:
            x = x.to(device)
            output = model(x)

            if output.dim() == 2:
                output = output.unsqueeze(-1)

            all_preds.append(output.cpu())
            all_targets.append(y)

    all_preds = torch.cat(all_preds, dim=0)
    all_targets = torch.cat(all_targets, dim=0)

    # Calculate metrics
    metrics = calculate_metrics(all_preds, all_targets)

    # Inverse transform if scaler provided
    if scaler is not None:
        all_preds_np = scaler.inverse_transform(
            all_preds.numpy().reshape(-1, all_preds.shape[-1])
        )
        all_targets_np = scaler.inverse_transform(
            all_targets.numpy().reshape(-1, all_targets.shape[-1])
        )

        metrics_original = calculate_metrics(
            torch.from_numpy(all_preds_np),
            torch.from_numpy(all_targets_np)
        )
        metrics['original_scale'] = metrics_original

    return metrics, all_preds, all_targets
```

---

## Best Practices and Tips

### Data Preprocessing

1. **Normalization**: Always normalize your data, especially when using gradient-based optimization
2. **Handling missing values**: Use forward fill, interpolation, or learned embeddings for missing values
3. **Feature engineering**: Add time-based features (hour, day, month) and lag features

```python
def add_time_features(df, datetime_col):
    """Add time-based features to dataframe."""
    df = df.copy()

    df['hour'] = df[datetime_col].dt.hour
    df['day_of_week'] = df[datetime_col].dt.dayofweek
    df['day_of_month'] = df[datetime_col].dt.day
    df['month'] = df[datetime_col].dt.month
    df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)

    # Cyclical encoding
    df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
    df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)

    return df
```

### Architecture Selection

| Data Characteristics | Recommended Architecture |
|---------------------|-------------------------|
| Short sequences (< 100) | LSTM/GRU |
| Long sequences (> 1000) | TCN or Transformer |
| Multiple seasonalities | Transformer with decomposition |
| Real-time requirements | TCN (parallelizable) |
| Limited data | Simpler LSTM |
| Multivariate with correlations | Transformer with cross-attention |

### Hyperparameter Tuning

```python
# Common hyperparameter ranges for grid search
hyperparameter_space = {
    'hidden_size': [32, 64, 128, 256],
    'num_layers': [1, 2, 3],
    'dropout': [0.1, 0.2, 0.3],
    'learning_rate': [1e-4, 1e-3, 1e-2],
    'batch_size': [16, 32, 64, 128],
    'seq_len': [24, 48, 96, 168],
}
```

### Common Pitfalls

1. **Data leakage**: Ensure train/val/test splits respect temporal order
2. **Look-ahead bias**: Never use future information in features
3. **Overfitting**: Use dropout, early stopping, and regularization
4. **Wrong scaling**: Scale train set separately from test set
5. **Ignoring seasonality**: Model may not capture all seasonal patterns

---

## Interview Questions

### Conceptual Questions

**Q1: What are the key differences between LSTM and GRU?**

A: GRU combines the forget and input gates into a single update gate, resulting in fewer parameters and faster training. LSTM has a separate cell state that can better preserve long-term information. GRU typically performs comparably to LSTM with less computational cost.

**Q2: Why do Transformers work well for time series?**

A: Transformers can:
- Capture long-range dependencies through self-attention without degradation
- Process sequences in parallel, enabling faster training
- Model complex temporal patterns through multi-head attention
- Adapt to variable-length sequences naturally

**Q3: What is the receptive field in TCN and why is it important?**

A: The receptive field is the range of input time steps that influence a given output. In TCN, it grows exponentially with network depth due to dilated convolutions. A sufficient receptive field ensures the model can capture all relevant temporal patterns.

**Q4: How do you handle multiple seasonalities in time series forecasting?**

A: Approaches include:
- Using decomposition methods (Autoformer)
- Adding Fourier features for different frequencies
- Longer input sequences to capture all patterns
- Hierarchical models with different time scales
- Explicit seasonal features (hour, day, week embeddings)

### Practical Questions

**Q5: How would you choose between LSTM, TCN, and Transformer for a given task?**

A: Consider:
- **LSTM**: Moderate sequence length, limited compute, need interpretability
- **TCN**: Real-time applications, need parallelization, clear temporal patterns
- **Transformer**: Long sequences, abundant compute, complex dependencies

**Q6: Explain the teacher forcing technique and its trade-offs.**

A: Teacher forcing feeds ground truth rather than model predictions as input during training. Benefits: faster convergence, more stable training. Drawbacks: exposure bias (train-test mismatch), may hurt generalization. Solutions: scheduled sampling, curriculum learning.

### Coding Questions

**Q7: Implement a simple attention mechanism for sequence-to-sequence forecasting.**

```python
class SimpleAttention(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.attention = nn.Linear(hidden_size * 2, 1)

    def forward(self, decoder_hidden, encoder_outputs):
        # decoder_hidden: (batch, hidden)
        # encoder_outputs: (batch, seq_len, hidden)

        seq_len = encoder_outputs.size(1)

        # Repeat decoder hidden for each encoder output
        decoder_hidden = decoder_hidden.unsqueeze(1).repeat(1, seq_len, 1)

        # Calculate attention scores
        combined = torch.cat([decoder_hidden, encoder_outputs], dim=2)
        scores = self.attention(combined).squeeze(2)

        # Softmax to get weights
        weights = F.softmax(scores, dim=1)

        # Weighted sum of encoder outputs
        context = torch.bmm(weights.unsqueeze(1), encoder_outputs).squeeze(1)

        return context, weights
```

**Q8: Write a function to create time series cross-validation splits.**

```python
def time_series_cv_splits(n_samples, n_splits=5, test_size=0.2):
    """Generate time series cross-validation splits."""
    splits = []

    test_samples = int(n_samples * test_size)
    train_samples = n_samples - test_samples

    fold_size = train_samples // n_splits

    for i in range(n_splits):
        train_end = fold_size * (i + 1) + test_samples

        if train_end > n_samples:
            break

        train_indices = list(range(0, fold_size * (i + 1)))
        val_indices = list(range(fold_size * (i + 1), train_end))

        splits.append((train_indices, val_indices))

    return splits
```

---

## Further Reading

### Essential Papers

1. **LSTM**: "Long Short-Term Memory" - Hochreiter & Schmidhuber (1997)
2. **Seq2Seq**: "Sequence to Sequence Learning with Neural Networks" - Sutskever et al. (2014)
3. **Attention**: "Neural Machine Translation by Jointly Learning to Align and Translate" - Bahdanau et al. (2015)
4. **TCN**: "An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling" - Bai et al. (2018)
5. **Informer**: "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting" - Zhou et al. (2021)
6. **Autoformer**: "Autoformer: Decomposition Transformers with Auto-Correlation for Long-Term Series Forecasting" - Wu et al. (2021)
7. **PatchTST**: "A Time Series is Worth 64 Words: Long-term Forecasting with Transformers" - Nie et al. (2023)

### Recommended Resources

- **GluonTS**: Amazon's toolkit for probabilistic time series forecasting
- **PyTorch Forecasting**: High-level library for time series prediction
- **Darts**: Python library for easy manipulation and forecasting of time series
- **NeuralProphet**: Neural network based time series forecasting (inspired by Prophet)

### Advanced Topics

- Probabilistic forecasting with quantile regression
- Neural architecture search for time series
- Self-supervised learning for time series
- Foundation models for time series (TimeGPT, Lag-Llama)
- Conformal prediction for uncertainty quantification

---

## Summary

Deep learning has transformed time series forecasting by enabling models to capture complex temporal patterns automatically. Key takeaways:

1. **LSTM/GRU** remain solid choices for moderate-length sequences with their gating mechanisms for long-term dependencies
2. **Seq2Seq** architectures excel at variable-length input-output tasks with attention mechanisms
3. **TCN** provides efficient parallel processing with explicit control over receptive field
4. **Transformers** push the boundaries for long sequences through self-attention and novel architectural innovations like Informer and Autoformer
5. **Multivariate forecasting** benefits from architectures that model cross-variable dependencies appropriately

Choose your architecture based on data characteristics, computational resources, and specific requirements. Start simple (LSTM) and increase complexity only when needed. Always ensure proper data preprocessing, avoid look-ahead bias, and use appropriate metrics for your application domain.
