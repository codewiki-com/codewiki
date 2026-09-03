---
title: "Deep Learning for Time Series: LSTM, Temporal CNN, and Transformers"
description: "Master deep learning approaches for time series forecasting: LSTM networks, Temporal Convolutional Networks, and Transformer architectures with PyTorch implementations"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - time series
  - deep learning
  - LSTM
  - Temporal CNN
  - Transformer
  - PyTorch
status: imported
origin: old/src/content/docs/datascience/time-series-deep.en.md
divergence: 0.117
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 22
  lastUpdated: 2026-01-07
---

Deep learning has revolutionized time series analysis, offering powerful alternatives to traditional statistical methods. While classical approaches like ARIMA and exponential smoothing remain valuable for many applications, deep learning models excel at capturing complex nonlinear patterns, handling multiple related time series simultaneously, and learning hierarchical representations of temporal data. We cover three fundamental deep learning architectures for time series: Long Short-Term Memory (LSTM) networks, Temporal Convolutional Networks (TCN), and Transformer-based models.

## When to Use Deep Learning for Time Series

Before diving into architectures, it is essential to understand when deep learning approaches offer advantages over traditional methods:

**Deep learning excels when:**
- Large amounts of training data are available (typically thousands of samples)
- Complex nonlinear patterns exist that traditional models cannot capture
- Multiple related time series need to be modeled jointly
- Raw features can be learned automatically from data
- High-dimensional input features are present

**Traditional methods may be preferable when:**
- Data is limited (fewer than a few hundred samples)
- Interpretability is paramount
- Computational resources are constrained
- Simple linear trends and seasonality dominate
- Fast iteration and prototyping are needed

## Preparing Time Series Data for Deep Learning

### Sequence Creation and Windowing

Deep learning models require data in a specific format: sequences of input windows paired with target values. The fundamental transformation involves creating sliding windows over the time series.

```python
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import matplotlib.pyplot as plt

def create_sequences(data, seq_length, forecast_horizon=1, target_col=None):
    """
    Create sequences for time series deep learning models.

    Parameters:
    -----------
    data : np.ndarray
        Time series data of shape (n_samples, n_features) or (n_samples,)
    seq_length : int
        Length of input sequences (lookback window)
    forecast_horizon : int
        Number of future steps to predict
    target_col : int, optional
        Column index for target variable in multivariate data

    Returns:
    --------
    X : np.ndarray
        Input sequences of shape (n_sequences, seq_length, n_features)
    y : np.ndarray
        Target values of shape (n_sequences, forecast_horizon)
    """
    if data.ndim == 1:
        data = data.reshape(-1, 1)

    n_samples, n_features = data.shape

    if target_col is None:
        target_col = 0

    X, y = [], []

    for i in range(len(data) - seq_length - forecast_horizon + 1):
        X.append(data[i:(i + seq_length)])
        y.append(data[(i + seq_length):(i + seq_length + forecast_horizon), target_col])

    return np.array(X), np.array(y)


class TimeSeriesDataset(Dataset):
    """PyTorch Dataset for time series data."""

    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.FloatTensor(y)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


def prepare_data_loaders(data, seq_length, forecast_horizon=1,
                         train_ratio=0.7, val_ratio=0.15,
                         batch_size=32, scale=True):
    """
    Prepare train, validation, and test data loaders.

    Parameters:
    -----------
    data : np.ndarray
        Raw time series data
    seq_length : int
        Input sequence length
    forecast_horizon : int
        Prediction horizon
    train_ratio : float
        Proportion of data for training
    val_ratio : float
        Proportion of data for validation
    batch_size : int
        Batch size for data loaders
    scale : bool
        Whether to apply standardization

    Returns:
    --------
    dict containing data loaders and scaler
    """
    if data.ndim == 1:
        data = data.reshape(-1, 1)

    n_samples = len(data)
    train_end = int(n_samples * train_ratio)
    val_end = int(n_samples * (train_ratio + val_ratio))

    # Split data
    train_data = data[:train_end]
    val_data = data[:val_end]
    test_data = data

    # Scale data
    scaler = None
    if scale:
        scaler = StandardScaler()
        train_data_scaled = scaler.fit_transform(train_data)
        val_data_scaled = scaler.transform(val_data)
        test_data_scaled = scaler.transform(test_data)
    else:
        train_data_scaled = train_data
        val_data_scaled = val_data
        test_data_scaled = test_data

    # Create sequences
    X_train, y_train = create_sequences(train_data_scaled, seq_length, forecast_horizon)
    X_val_full, y_val_full = create_sequences(val_data_scaled, seq_length, forecast_horizon)
    X_test_full, y_test_full = create_sequences(test_data_scaled, seq_length, forecast_horizon)

    # Get only validation and test portions
    train_seq_count = len(X_train)

    X_val = X_val_full[train_seq_count:]
    y_val = y_val_full[train_seq_count:]

    test_start = int(len(X_test_full) * (train_ratio + val_ratio))
    X_test = X_test_full[test_start:]
    y_test = y_test_full[test_start:]

    # Create datasets and loaders
    train_dataset = TimeSeriesDataset(X_train, y_train)
    val_dataset = TimeSeriesDataset(X_val, y_val)
    test_dataset = TimeSeriesDataset(X_test, y_test)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return {
        'train_loader': train_loader,
        'val_loader': val_loader,
        'test_loader': test_loader,
        'scaler': scaler,
        'X_train': X_train,
        'y_train': y_train,
        'X_val': X_val,
        'y_val': y_val,
        'X_test': X_test,
        'y_test': y_test
    }


# Example: Generate synthetic data
np.random.seed(42)
n_samples = 2000
t = np.arange(n_samples)

# Create complex synthetic time series
trend = 0.02 * t
seasonal_1 = 10 * np.sin(2 * np.pi * t / 50)
seasonal_2 = 5 * np.sin(2 * np.pi * t / 100)
noise = np.random.normal(0, 2, n_samples)
nonlinear = 0.5 * np.sin(0.1 * t) * np.cos(0.05 * t)

data = trend + seasonal_1 + seasonal_2 + nonlinear + noise + 100

# Prepare data
prepared_data = prepare_data_loaders(
    data,
    seq_length=60,
    forecast_horizon=1,
    batch_size=32
)

print(f"Training samples: {len(prepared_data['X_train'])}")
print(f"Validation samples: {len(prepared_data['X_val'])}")
print(f"Test samples: {len(prepared_data['X_test'])}")
print(f"Input shape: {prepared_data['X_train'].shape}")
```

### Feature Engineering for Deep Learning

While deep learning can learn features automatically, providing meaningful engineered features often improves performance.

```python
def create_time_features(dates):
    """
    Create temporal features from datetime index.

    Parameters:
    -----------
    dates : pd.DatetimeIndex
        Datetime index

    Returns:
    --------
    pd.DataFrame with temporal features
    """
    df = pd.DataFrame(index=dates)

    # Cyclical encoding for periodic features
    df['hour_sin'] = np.sin(2 * np.pi * dates.hour / 24)
    df['hour_cos'] = np.cos(2 * np.pi * dates.hour / 24)

    df['day_sin'] = np.sin(2 * np.pi * dates.dayofweek / 7)
    df['day_cos'] = np.cos(2 * np.pi * dates.dayofweek / 7)

    df['month_sin'] = np.sin(2 * np.pi * dates.month / 12)
    df['month_cos'] = np.cos(2 * np.pi * dates.month / 12)

    df['day_of_year_sin'] = np.sin(2 * np.pi * dates.dayofyear / 365)
    df['day_of_year_cos'] = np.cos(2 * np.pi * dates.dayofyear / 365)

    # Binary features
    df['is_weekend'] = (dates.dayofweek >= 5).astype(float)
    df['is_month_start'] = dates.is_month_start.astype(float)
    df['is_month_end'] = dates.is_month_end.astype(float)

    return df


def add_lag_features(df, target_col, lags=[1, 7, 14, 30]):
    """Add lagged features for the target variable."""
    df = df.copy()
    for lag in lags:
        df[f'{target_col}_lag_{lag}'] = df[target_col].shift(lag)
    return df


def add_rolling_features(df, target_col, windows=[7, 14, 30]):
    """Add rolling statistics as features."""
    df = df.copy()
    for window in windows:
        df[f'{target_col}_roll_mean_{window}'] = df[target_col].rolling(window).mean()
        df[f'{target_col}_roll_std_{window}'] = df[target_col].rolling(window).std()
        df[f'{target_col}_roll_min_{window}'] = df[target_col].rolling(window).min()
        df[f'{target_col}_roll_max_{window}'] = df[target_col].rolling(window).max()
    return df
```

## LSTM Networks for Time Series

Long Short-Term Memory (LSTM) networks are a type of recurrent neural network (RNN) specifically designed to capture long-term dependencies in sequential data. The key innovation of LSTMs is the cell state, which acts as a "conveyor belt" carrying information across many time steps with minimal degradation.

### Understanding LSTM Architecture

The LSTM unit contains three gates that control information flow:

**Forget Gate**: Decides what information to discard from the cell state
$$f_t = \sigma(W_f \cdot [h_{t-1}, x_t] + b_f)$$

**Input Gate**: Decides what new information to store in the cell state
$$i_t = \sigma(W_i \cdot [h_{t-1}, x_t] + b_i)$$
$$\tilde{C}_t = \tanh(W_C \cdot [h_{t-1}, x_t] + b_C)$$

**Output Gate**: Decides what to output based on the cell state
$$o_t = \sigma(W_o \cdot [h_{t-1}, x_t] + b_o)$$

**Cell State Update**:
$$C_t = f_t \odot C_{t-1} + i_t \odot \tilde{C}_t$$
$$h_t = o_t \odot \tanh(C_t)$$

### Basic LSTM Implementation

```python
import torch
import torch.nn as nn

class LSTMForecaster(nn.Module):
    """
    LSTM-based time series forecasting model.

    Parameters:
    -----------
    input_size : int
        Number of input features
    hidden_size : int
        Number of LSTM hidden units
    num_layers : int
        Number of stacked LSTM layers
    output_size : int
        Prediction horizon (number of future steps to predict)
    dropout : float
        Dropout rate between LSTM layers
    """

    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super(LSTMForecaster, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        # Fully connected output layer
        self.fc = nn.Linear(hidden_size, output_size)

        # Dropout for regularization
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        """
        Forward pass.

        Parameters:
        -----------
        x : torch.Tensor
            Input tensor of shape (batch_size, seq_length, input_size)

        Returns:
        --------
        torch.Tensor
            Predictions of shape (batch_size, output_size)
        """
        # Initialize hidden states
        batch_size = x.size(0)
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)

        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x, (h0, c0))

        # Use the last hidden state for prediction
        out = self.dropout(lstm_out[:, -1, :])
        out = self.fc(out)

        return out


# Create model
model = LSTMForecaster(
    input_size=1,
    hidden_size=64,
    num_layers=2,
    output_size=1,
    dropout=0.2
)

print(model)
print(f"\nTotal parameters: {sum(p.numel() for p in model.parameters()):,}")
```

### Bidirectional LSTM

Bidirectional LSTMs process sequences in both forward and backward directions, capturing context from both past and future observations.

```python
class BidirectionalLSTM(nn.Module):
    """Bidirectional LSTM for time series forecasting."""

    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super(BidirectionalLSTM, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # Bidirectional LSTM
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )

        # Output layer receives 2x hidden_size due to bidirectional
        self.fc = nn.Linear(hidden_size * 2, output_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        batch_size = x.size(0)

        # Initialize hidden states for both directions
        h0 = torch.zeros(self.num_layers * 2, batch_size, self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers * 2, batch_size, self.hidden_size).to(x.device)

        lstm_out, _ = self.lstm(x, (h0, c0))

        # Concatenate final forward and backward hidden states
        out = self.dropout(lstm_out[:, -1, :])
        out = self.fc(out)

        return out
```

### LSTM with Attention Mechanism

Attention mechanisms allow the model to focus on the most relevant parts of the input sequence for making predictions.

```python
class Attention(nn.Module):
    """Attention mechanism for sequence models."""

    def __init__(self, hidden_size):
        super(Attention, self).__init__()
        self.attention = nn.Linear(hidden_size, 1)

    def forward(self, lstm_output):
        """
        Parameters:
        -----------
        lstm_output : torch.Tensor
            LSTM output of shape (batch_size, seq_length, hidden_size)

        Returns:
        --------
        context : torch.Tensor
            Context vector of shape (batch_size, hidden_size)
        attention_weights : torch.Tensor
            Attention weights of shape (batch_size, seq_length)
        """
        # Calculate attention scores
        attention_scores = self.attention(lstm_output)
        attention_weights = torch.softmax(attention_scores, dim=1)

        # Calculate weighted sum
        context = torch.sum(attention_weights * lstm_output, dim=1)

        return context, attention_weights.squeeze(-1)


class LSTMWithAttention(nn.Module):
    """LSTM with attention mechanism for time series forecasting."""

    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super(LSTMWithAttention, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

        self.attention = Attention(hidden_size)
        self.fc = nn.Linear(hidden_size, output_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        batch_size = x.size(0)
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)

        lstm_out, _ = self.lstm(x, (h0, c0))

        # Apply attention
        context, attention_weights = self.attention(lstm_out)

        out = self.dropout(context)
        out = self.fc(out)

        return out, attention_weights
```

### Encoder-Decoder LSTM for Multi-Step Forecasting

For predicting multiple future time steps, an encoder-decoder architecture is highly effective.

```python
class Encoder(nn.Module):
    """Encoder for sequence-to-sequence model."""

    def __init__(self, input_size, hidden_size, num_layers, dropout=0.2):
        super(Encoder, self).__init__()

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )

    def forward(self, x):
        outputs, (hidden, cell) = self.lstm(x)
        return outputs, hidden, cell


class Decoder(nn.Module):
    """Decoder for sequence-to-sequence model."""

    def __init__(self, input_size, hidden_size, num_layers, output_size, dropout=0.2):
        super(Decoder, self).__init__()

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


class Seq2SeqLSTM(nn.Module):
    """
    Sequence-to-Sequence LSTM for multi-step time series forecasting.
    """

    def __init__(self, input_size, hidden_size, num_layers, output_size,
                 forecast_horizon, teacher_forcing_ratio=0.5, dropout=0.2):
        super(Seq2SeqLSTM, self).__init__()

        self.forecast_horizon = forecast_horizon
        self.teacher_forcing_ratio = teacher_forcing_ratio
        self.output_size = output_size

        self.encoder = Encoder(input_size, hidden_size, num_layers, dropout)
        self.decoder = Decoder(output_size, hidden_size, num_layers, output_size, dropout)

    def forward(self, x, target=None):
        batch_size = x.size(0)

        # Encode input sequence
        encoder_outputs, hidden, cell = self.encoder(x)

        # Initialize decoder input with last value from input sequence
        decoder_input = x[:, -1:, :self.output_size]

        # Store predictions
        predictions = []

        for t in range(self.forecast_horizon):
            # Decode one step
            prediction, hidden, cell = self.decoder(decoder_input, hidden, cell)
            predictions.append(prediction)

            # Decide whether to use teacher forcing
            if target is not None and torch.rand(1).item() < self.teacher_forcing_ratio:
                decoder_input = target[:, t:t+1, :]
            else:
                decoder_input = prediction

        # Concatenate predictions
        predictions = torch.cat(predictions, dim=1)

        return predictions
```

## Temporal Convolutional Networks (TCN)

Temporal Convolutional Networks apply 1D convolutions over the temporal dimension of time series data. Unlike RNNs, TCNs process sequences in parallel, making them faster to train while still capturing long-range dependencies through dilated convolutions.

### Key Concepts in TCN

**Causal Convolutions**: Ensure that predictions at time t only depend on observations at time t and earlier, preventing information leakage from the future.

**Dilated Convolutions**: Increase the receptive field exponentially without increasing the number of parameters, allowing the network to capture very long-range dependencies.

**Residual Connections**: Enable training of very deep networks by providing skip connections that bypass convolutional layers.

### TCN Architecture Implementation

```python
import torch.nn.functional as F

class CausalConv1d(nn.Module):
    """
    Causal 1D convolution with dilation.
    Ensures output at time t depends only on inputs at time t and before.
    """

    def __init__(self, in_channels, out_channels, kernel_size, dilation=1):
        super(CausalConv1d, self).__init__()

        self.padding = (kernel_size - 1) * dilation
        self.conv = nn.Conv1d(
            in_channels,
            out_channels,
            kernel_size,
            padding=self.padding,
            dilation=dilation
        )

    def forward(self, x):
        # Remove future padding to maintain causality
        out = self.conv(x)
        if self.padding != 0:
            out = out[:, :, :-self.padding]
        return out


class TemporalBlock(nn.Module):
    """
    Temporal block with two causal convolutions, residual connection,
    and dropout.
    """

    def __init__(self, in_channels, out_channels, kernel_size, stride, dilation, dropout=0.2):
        super(TemporalBlock, self).__init__()

        # First causal convolution
        self.conv1 = CausalConv1d(in_channels, out_channels, kernel_size, dilation)
        self.bn1 = nn.BatchNorm1d(out_channels)

        # Second causal convolution
        self.conv2 = CausalConv1d(out_channels, out_channels, kernel_size, dilation)
        self.bn2 = nn.BatchNorm1d(out_channels)

        # Dropout
        self.dropout = nn.Dropout(dropout)

        # Residual connection
        self.downsample = nn.Conv1d(in_channels, out_channels, 1) if in_channels != out_channels else None

        self.relu = nn.ReLU()

    def forward(self, x):
        # First convolution block
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.dropout(out)

        # Second convolution block
        out = self.conv2(out)
        out = self.bn2(out)
        out = self.relu(out)
        out = self.dropout(out)

        # Residual connection
        res = x if self.downsample is None else self.downsample(x)

        return self.relu(out + res)


class TCN(nn.Module):
    """
    Temporal Convolutional Network for time series forecasting.

    Parameters:
    -----------
    input_size : int
        Number of input features
    output_size : int
        Prediction horizon
    num_channels : list
        List of channel sizes for each temporal block
    kernel_size : int
        Kernel size for convolutions
    dropout : float
        Dropout rate
    """

    def __init__(self, input_size, output_size, num_channels, kernel_size=3, dropout=0.2):
        super(TCN, self).__init__()

        layers = []
        num_levels = len(num_channels)

        for i in range(num_levels):
            dilation = 2 ** i
            in_ch = input_size if i == 0 else num_channels[i-1]
            out_ch = num_channels[i]

            layers.append(
                TemporalBlock(
                    in_ch, out_ch, kernel_size,
                    stride=1, dilation=dilation, dropout=dropout
                )
            )

        self.network = nn.Sequential(*layers)
        self.fc = nn.Linear(num_channels[-1], output_size)

    def forward(self, x):
        """
        Parameters:
        -----------
        x : torch.Tensor
            Input of shape (batch_size, seq_length, input_size)

        Returns:
        --------
        torch.Tensor
            Predictions of shape (batch_size, output_size)
        """
        # TCN expects (batch, channels, seq_length)
        x = x.permute(0, 2, 1)

        # Apply temporal blocks
        out = self.network(x)

        # Use last time step for prediction
        out = out[:, :, -1]
        out = self.fc(out)

        return out


# Create TCN model
tcn_model = TCN(
    input_size=1,
    output_size=1,
    num_channels=[32, 64, 64, 128],
    kernel_size=3,
    dropout=0.2
)

# Calculate receptive field
kernel_size = 3
num_layers = len([32, 64, 64, 128])
receptive_field = 1 + 2 * (kernel_size - 1) * (2 ** num_layers - 1)
print(f"TCN Receptive Field: {receptive_field} time steps")
```

## Transformer for Time Series

Transformers, originally designed for natural language processing, have proven highly effective for time series tasks. Their self-attention mechanism allows them to capture complex dependencies across any time steps without the sequential processing limitations of RNNs.

### Positional Encoding

Since Transformers process all time steps in parallel, positional encoding is essential to inject information about the order of observations.

```python
import math

class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for Transformer models."""

    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super(PositionalEncoding, self).__init__()

        self.dropout = nn.Dropout(p=dropout)

        # Create positional encoding matrix
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


class LearnablePositionalEncoding(nn.Module):
    """Learnable positional encoding as an alternative to sinusoidal."""

    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super(LearnablePositionalEncoding, self).__init__()

        self.dropout = nn.Dropout(p=dropout)
        self.pe = nn.Parameter(torch.randn(1, max_len, d_model))

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)
```

### Vanilla Transformer for Time Series

```python
class TransformerForecaster(nn.Module):
    """
    Transformer-based time series forecasting model.

    Parameters:
    -----------
    input_size : int
        Number of input features
    d_model : int
        Dimension of the model
    nhead : int
        Number of attention heads
    num_encoder_layers : int
        Number of encoder layers
    num_decoder_layers : int
        Number of decoder layers
    dim_feedforward : int
        Dimension of feedforward network
    output_size : int
        Number of output features
    forecast_horizon : int
        Number of future steps to predict
    dropout : float
        Dropout rate
    """

    def __init__(self, input_size, d_model, nhead, num_encoder_layers,
                 num_decoder_layers, dim_feedforward, output_size,
                 forecast_horizon, dropout=0.1):
        super(TransformerForecaster, self).__init__()

        self.d_model = d_model
        self.forecast_horizon = forecast_horizon

        # Input projection
        self.input_projection = nn.Linear(input_size, d_model)

        # Positional encoding
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
        self.output_projection = nn.Linear(d_model, output_size)

        # Decoder input embedding
        self.decoder_input = nn.Parameter(torch.randn(1, forecast_horizon, d_model))

    def generate_square_subsequent_mask(self, sz):
        """Generate causal mask for decoder."""
        mask = torch.triu(torch.ones(sz, sz), diagonal=1)
        mask = mask.masked_fill(mask == 1, float('-inf'))
        return mask

    def forward(self, src):
        batch_size = src.size(0)

        # Project input
        src = self.input_projection(src) * math.sqrt(self.d_model)
        src = self.pos_encoder(src)

        # Expand decoder input for batch
        tgt = self.decoder_input.expand(batch_size, -1, -1)
        tgt = self.pos_encoder(tgt)

        # Generate causal mask
        tgt_mask = self.generate_square_subsequent_mask(self.forecast_horizon).to(src.device)

        # Transformer forward
        out = self.transformer(src, tgt, tgt_mask=tgt_mask)

        # Project to output
        out = self.output_projection(out)

        return out


# Create Transformer model
transformer_model = TransformerForecaster(
    input_size=1,
    d_model=64,
    nhead=4,
    num_encoder_layers=2,
    num_decoder_layers=2,
    dim_feedforward=256,
    output_size=1,
    forecast_horizon=10,
    dropout=0.1
)

print(transformer_model)
print(f"\nTotal parameters: {sum(p.numel() for p in transformer_model.parameters()):,}")
```

### Informer: Efficient Transformer for Long Sequences

The Informer architecture addresses the O(n^2) complexity of standard attention, making it suitable for very long time series.

```python
class ProbSparseAttention(nn.Module):
    """
    Probabilistic Sparse Attention from Informer paper.
    Selects top-k queries based on their "sparsity" measure.
    """

    def __init__(self, d_model, nhead, factor=5, dropout=0.1):
        super(ProbSparseAttention, self).__init__()

        self.nhead = nhead
        self.d_k = d_model // nhead
        self.factor = factor

        self.query_proj = nn.Linear(d_model, d_model)
        self.key_proj = nn.Linear(d_model, d_model)
        self.value_proj = nn.Linear(d_model, d_model)
        self.out_proj = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value, mask=None):
        B, L_Q, _ = query.shape
        _, L_K, _ = key.shape

        # Project
        Q = self.query_proj(query).view(B, L_Q, self.nhead, self.d_k).transpose(1, 2)
        K = self.key_proj(key).view(B, L_K, self.nhead, self.d_k).transpose(1, 2)
        V = self.value_proj(value).view(B, L_K, self.nhead, self.d_k).transpose(1, 2)

        # Standard attention
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)

        if mask is not None:
            scores = scores.masked_fill(mask == 0, float('-inf'))

        attn = torch.softmax(scores, dim=-1)
        attn = self.dropout(attn)

        out = torch.matmul(attn, V)
        out = out.transpose(1, 2).contiguous().view(B, L_Q, -1)
        out = self.out_proj(out)

        return out


class InformerEncoderLayer(nn.Module):
    """Single layer of Informer encoder."""

    def __init__(self, d_model, nhead, dim_feedforward, dropout=0.1):
        super(InformerEncoderLayer, self).__init__()

        self.self_attn = ProbSparseAttention(d_model, nhead, dropout=dropout)
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, dim_feedforward),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim_feedforward, d_model)
        )

        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Self attention
        attn_out = self.self_attn(x, x, x, mask)
        x = x + self.dropout(attn_out)
        x = self.norm1(x)

        # Feed forward
        ff_out = self.feed_forward(x)
        x = x + self.dropout(ff_out)
        x = self.norm2(x)

        return x


class Informer(nn.Module):
    """Simplified Informer architecture for time series forecasting."""

    def __init__(self, input_size, d_model, nhead, num_layers,
                 dim_feedforward, output_size, forecast_horizon, dropout=0.1):
        super(Informer, self).__init__()

        self.forecast_horizon = forecast_horizon

        # Input embedding
        self.input_embed = nn.Linear(input_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout=dropout)

        # Encoder layers
        self.encoder_layers = nn.ModuleList([
            InformerEncoderLayer(d_model, nhead, dim_feedforward, dropout)
            for _ in range(num_layers)
        ])

        # Output projection
        self.output_proj = nn.Linear(d_model, output_size * forecast_horizon)
        self.output_size = output_size

    def forward(self, x):
        # Embed input
        x = self.input_embed(x)
        x = self.pos_encoder(x)

        # Encode
        for layer in self.encoder_layers:
            x = layer(x)

        # Use last position for prediction
        out = x[:, -1, :]
        out = self.output_proj(out)
        out = out.view(-1, self.forecast_horizon, self.output_size)

        return out
```

### Temporal Fusion Transformer (TFT)

TFT is a state-of-the-art architecture combining various attention mechanisms with variable selection networks.

```python
class GatedLinearUnit(nn.Module):
    """Gated Linear Unit for variable selection."""

    def __init__(self, input_size, hidden_size):
        super(GatedLinearUnit, self).__init__()

        self.fc = nn.Linear(input_size, hidden_size)
        self.gate_fc = nn.Linear(input_size, hidden_size)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        return self.fc(x) * self.sigmoid(self.gate_fc(x))


class TemporalFusionTransformerSimplified(nn.Module):
    """
    Simplified Temporal Fusion Transformer for time series forecasting.

    This version focuses on key components:
    - Temporal self-attention
    - Gated skip connections
    """

    def __init__(self, num_features, hidden_size, num_heads, num_layers,
                 output_size, forecast_horizon, dropout=0.1):
        super(TemporalFusionTransformerSimplified, self).__init__()

        self.forecast_horizon = forecast_horizon

        # Input projection
        self.input_proj = nn.Linear(num_features, hidden_size)

        # Positional encoding
        self.pos_encoder = PositionalEncoding(hidden_size, dropout=dropout)

        # Temporal self-attention layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_size,
            nhead=num_heads,
            dim_feedforward=hidden_size * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        # Gated skip connection
        self.glu = GatedLinearUnit(hidden_size, hidden_size)
        self.layer_norm = nn.LayerNorm(hidden_size)

        # Output layers
        self.output_proj = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # Project input
        x = self.input_proj(x)
        x = self.pos_encoder(x)

        # Store for skip connection
        skip = x

        # Transformer encoding
        x = self.transformer_encoder(x)

        # Gated skip connection
        x = self.layer_norm(self.glu(x) + skip)

        # Use last 'forecast_horizon' positions for output
        x = x[:, -self.forecast_horizon:, :]
        x = self.output_proj(x)

        return x
```

## Training Deep Learning Time Series Models

### Training Loop with Best Practices

```python
import time
from torch.optim.lr_scheduler import ReduceLROnPlateau, CosineAnnealingWarmRestarts

class EarlyStopping:
    """Early stopping to prevent overfitting."""

    def __init__(self, patience=10, min_delta=1e-4, restore_best=True):
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best = restore_best
        self.counter = 0
        self.best_loss = None
        self.best_model_state = None
        self.early_stop = False

    def __call__(self, val_loss, model):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.best_model_state = model.state_dict().copy()
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.best_model_state = model.state_dict().copy()
            self.counter = 0

    def restore(self, model):
        if self.restore_best and self.best_model_state is not None:
            model.load_state_dict(self.best_model_state)


def train_model(model, train_loader, val_loader, num_epochs=100,
                learning_rate=1e-3, weight_decay=1e-5, patience=15,
                device='cuda', scheduler_type='plateau'):
    """
    Complete training loop for time series models.

    Parameters:
    -----------
    model : nn.Module
        PyTorch model
    train_loader : DataLoader
        Training data loader
    val_loader : DataLoader
        Validation data loader
    num_epochs : int
        Maximum number of epochs
    learning_rate : float
        Initial learning rate
    weight_decay : float
        L2 regularization
    patience : int
        Early stopping patience
    device : str
        Device to train on
    scheduler_type : str
        Type of learning rate scheduler ('plateau' or 'cosine')

    Returns:
    --------
    dict containing training history
    """
    model = model.to(device)

    # Loss and optimizer
    criterion = nn.MSELoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)

    # Learning rate scheduler
    if scheduler_type == 'plateau':
        scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5, verbose=True)
    else:
        scheduler = CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=2)

    # Early stopping
    early_stopping = EarlyStopping(patience=patience)

    # Training history
    history = {
        'train_loss': [],
        'val_loss': [],
        'learning_rate': []
    }

    print(f"Training on {device}")
    print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    print("-" * 60)

    for epoch in range(num_epochs):
        start_time = time.time()

        # Training phase
        model.train()
        train_losses = []

        for batch_X, batch_y in train_loader:
            batch_X = batch_X.to(device)
            batch_y = batch_y.to(device)

            optimizer.zero_grad()

            # Forward pass
            predictions = model(batch_X)
            if predictions.dim() == 3:
                predictions = predictions.squeeze(-1)

            # Compute loss
            loss = criterion(predictions, batch_y)

            # Backward pass
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()

            train_losses.append(loss.item())

        avg_train_loss = np.mean(train_losses)

        # Validation phase
        model.train(False)  # Set to inference mode
        val_losses = []

        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X = batch_X.to(device)
                batch_y = batch_y.to(device)

                predictions = model(batch_X)
                if isinstance(predictions, tuple):
                    predictions = predictions[0]
                if predictions.dim() == 3:
                    predictions = predictions.squeeze(-1)

                loss = criterion(predictions, batch_y)
                val_losses.append(loss.item())

        avg_val_loss = np.mean(val_losses)

        # Update scheduler
        if scheduler_type == 'plateau':
            scheduler.step(avg_val_loss)
        else:
            scheduler.step()

        current_lr = optimizer.param_groups[0]['lr']

        # Record history
        history['train_loss'].append(avg_train_loss)
        history['val_loss'].append(avg_val_loss)
        history['learning_rate'].append(current_lr)

        # Early stopping check
        early_stopping(avg_val_loss, model)

        epoch_time = time.time() - start_time

        # Print progress
        if (epoch + 1) % 5 == 0 or epoch == 0:
            print(f"Epoch {epoch+1:3d}/{num_epochs} | "
                  f"Train Loss: {avg_train_loss:.6f} | "
                  f"Val Loss: {avg_val_loss:.6f} | "
                  f"LR: {current_lr:.2e} | "
                  f"Time: {epoch_time:.1f}s")

        if early_stopping.early_stop:
            print(f"\nEarly stopping triggered at epoch {epoch+1}")
            break

    # Restore best model
    early_stopping.restore(model)
    print(f"\nBest validation loss: {early_stopping.best_loss:.6f}")

    return history


def plot_training_history(history):
    """Visualize training progress."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Loss curves
    axes[0].plot(history['train_loss'], label='Train Loss')
    axes[0].plot(history['val_loss'], label='Validation Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].set_title('Training and Validation Loss')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # Learning rate
    axes[1].plot(history['learning_rate'])
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Learning Rate')
    axes[1].set_title('Learning Rate Schedule')
    axes[1].set_yscale('log')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()
```

### Evaluation and Forecasting

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error

def evaluate_model(model, test_loader, scaler=None, device='cuda'):
    """
    Evaluate model on test set.

    Returns predictions, actuals, and various metrics.
    """
    model.train(False)  # Set to inference mode
    model = model.to(device)

    all_predictions = []
    all_actuals = []

    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            batch_X = batch_X.to(device)

            predictions = model(batch_X)
            if isinstance(predictions, tuple):
                predictions = predictions[0]

            all_predictions.append(predictions.cpu().numpy())
            all_actuals.append(batch_y.numpy())

    predictions = np.concatenate(all_predictions, axis=0)
    actuals = np.concatenate(all_actuals, axis=0)

    # Flatten if needed
    if predictions.ndim > 1:
        predictions = predictions.flatten()
    if actuals.ndim > 1:
        actuals = actuals.flatten()

    # Inverse transform if scaler provided
    if scaler is not None:
        predictions = scaler.inverse_transform(predictions.reshape(-1, 1)).flatten()
        actuals = scaler.inverse_transform(actuals.reshape(-1, 1)).flatten()

    # Calculate metrics
    mae = mean_absolute_error(actuals, predictions)
    rmse = np.sqrt(mean_squared_error(actuals, predictions))
    mape = np.mean(np.abs((actuals - predictions) / (actuals + 1e-8))) * 100

    # Symmetric MAPE (handles zeros better)
    smape = np.mean(2 * np.abs(predictions - actuals) /
                    (np.abs(predictions) + np.abs(actuals) + 1e-8)) * 100

    metrics = {
        'MAE': mae,
        'RMSE': rmse,
        'MAPE': mape,
        'sMAPE': smape
    }

    print("\nTest Set Evaluation:")
    print("-" * 40)
    for name, value in metrics.items():
        print(f"{name}: {value:.4f}")

    return predictions, actuals, metrics


def plot_predictions(predictions, actuals, title='Model Predictions'):
    """Visualize predictions vs actuals."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Time series plot
    axes[0, 0].plot(actuals, label='Actual', alpha=0.7)
    axes[0, 0].plot(predictions, label='Predicted', alpha=0.7)
    axes[0, 0].set_xlabel('Time Step')
    axes[0, 0].set_ylabel('Value')
    axes[0, 0].set_title(f'{title} - Time Series')
    axes[0, 0].legend()

    # Scatter plot
    axes[0, 1].scatter(actuals, predictions, alpha=0.5)
    axes[0, 1].plot([actuals.min(), actuals.max()],
                    [actuals.min(), actuals.max()], 'r--', label='Perfect Prediction')
    axes[0, 1].set_xlabel('Actual')
    axes[0, 1].set_ylabel('Predicted')
    axes[0, 1].set_title('Actual vs Predicted')
    axes[0, 1].legend()

    # Residuals
    residuals = actuals - predictions
    axes[1, 0].plot(residuals)
    axes[1, 0].axhline(y=0, color='r', linestyle='--')
    axes[1, 0].set_xlabel('Time Step')
    axes[1, 0].set_ylabel('Residual')
    axes[1, 0].set_title('Residuals Over Time')

    # Residual distribution
    axes[1, 1].hist(residuals, bins=50, edgecolor='black')
    axes[1, 1].axvline(x=0, color='r', linestyle='--')
    axes[1, 1].set_xlabel('Residual')
    axes[1, 1].set_ylabel('Frequency')
    axes[1, 1].set_title('Residual Distribution')

    plt.tight_layout()
    plt.show()
```

## Production Deployment Considerations

### Model Export and Inference

```python
class ProductionModel:
    """
    Wrapper for production deployment of time series models.
    """

    def __init__(self, model, scaler, seq_length, device='cpu'):
        self.model = model.to(device)
        self.scaler = scaler
        self.seq_length = seq_length
        self.device = device
        self.model.train(False)  # Set to inference mode

    def preprocess(self, data):
        """Preprocess input data."""
        if isinstance(data, list):
            data = np.array(data)

        if data.ndim == 1:
            data = data.reshape(-1, 1)

        # Scale data
        if self.scaler is not None:
            data = self.scaler.transform(data)

        # Ensure correct sequence length
        if len(data) > self.seq_length:
            data = data[-self.seq_length:]
        elif len(data) < self.seq_length:
            padding = np.zeros((self.seq_length - len(data), data.shape[1]))
            data = np.vstack([padding, data])

        return data

    def predict(self, data):
        """Generate prediction for input sequence."""
        # Preprocess
        processed = self.preprocess(data)

        # Convert to tensor
        input_tensor = torch.FloatTensor(processed).unsqueeze(0).to(self.device)

        # Predict
        with torch.no_grad():
            prediction = self.model(input_tensor)
            if isinstance(prediction, tuple):
                prediction = prediction[0]

        prediction = prediction.cpu().numpy()

        # Inverse transform
        if self.scaler is not None:
            prediction = self.scaler.inverse_transform(prediction.reshape(-1, 1)).flatten()

        return prediction

    def export_torchscript(self, filepath, example_input=None):
        """Export model to TorchScript for deployment."""
        if example_input is None:
            example_input = torch.randn(1, self.seq_length, 1)

        example_input = example_input.to(self.device)

        # Trace the model
        traced_model = torch.jit.trace(self.model, example_input)
        traced_model.save(filepath)

        print(f"Model exported to {filepath}")

    def export_onnx(self, filepath, example_input=None):
        """Export model to ONNX format."""
        if example_input is None:
            example_input = torch.randn(1, self.seq_length, 1)

        example_input = example_input.to(self.device)

        torch.onnx.export(
            self.model,
            example_input,
            filepath,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={
                'input': {0: 'batch_size'},
                'output': {0: 'batch_size'}
            },
            opset_version=11
        )

        print(f"Model exported to {filepath}")
```

## Interview Key Points

### Common Interview Questions

**Q1: When would you choose LSTM over Transformer for time series?**

LSTM may be preferred when:
- Dataset is small to medium sized (Transformers need more data)
- Computational resources are limited
- Strict sequential processing is required
- Interpretability of hidden states is important

Transformers excel when:
- Large amounts of training data are available
- Long-range dependencies need to be captured efficiently
- Parallel training is needed for speed
- Multi-horizon forecasting is required

**Q2: How do you handle variable-length sequences in deep learning models?**

Several approaches:
1. **Padding**: Pad shorter sequences to a fixed length with zeros
2. **Masking**: Use attention masks to ignore padded positions
3. **PackedSequence**: PyTorch's packed sequences for efficient RNN processing
4. **Dynamic batching**: Group sequences of similar length

**Q3: Explain the vanishing gradient problem and how LSTM addresses it.**

In standard RNNs, gradients are multiplied through many time steps during backpropagation. If the weight matrices have eigenvalues less than 1, gradients shrink exponentially (vanish). If greater than 1, they explode.

LSTM addresses this through:
1. **Cell state**: Acts as a "highway" for gradient flow with mostly additive operations
2. **Forget gate**: Controls what information to discard, not full multiplicative updates
3. **Input gate**: Allows selective addition of new information
4. **Gating mechanisms**: Use sigmoid activation bounded between 0 and 1

**Q4: What is the receptive field in TCN and why does it matter?**

The receptive field is the range of input time steps that can influence a particular output. In TCN:

Receptive Field = 1 + 2 * (k-1) * sum(d^i for i in 0 to L-1)

where k is kernel size, L is number of layers, and d is dilation base.

It matters because:
- Must be larger than the longest dependencies in your data
- Determines what historical context the model can use
- Affects model capacity and computational requirements

**Q5: How do you prevent overfitting in deep learning time series models?**

Key strategies:
1. **Regularization**: Dropout, L2 weight decay
2. **Early stopping**: Monitor validation loss
3. **Data augmentation**: Add noise, time warping, window slicing
4. **Architecture**: Use simpler models when data is limited
5. **Ensemble**: Combine predictions from multiple models
6. **Cross-validation**: Use proper time series cross-validation

## Best Practices Summary

### Data Preparation
- Always normalize or standardize input features
- Use proper train/validation/test splits (temporal, not random)
- Create meaningful features when possible
- Handle missing values appropriately (forward fill, interpolation)

### Model Architecture
- Start with simpler models (single-layer LSTM) before complex ones
- Match receptive field to expected dependency length
- Use appropriate output structure for forecast horizon
- Consider attention mechanisms for long sequences

### Training
- Use learning rate scheduling (cosine annealing, reduce on plateau)
- Apply gradient clipping to prevent explosions
- Monitor both training and validation metrics
- Use early stopping with patience

### Evaluation
- Use multiple metrics (MAE, RMSE, MAPE, sMAPE)
- Visualize predictions across different time periods
- Check residual patterns for systematic errors
- Compare against simple baselines (persistence, moving average)

## Further Reading

### Papers
- "Long Short-Term Memory" - Hochreiter and Schmidhuber (1997)
- "An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling" - Bai et al. (2018)
- "Attention Is All You Need" - Vaswani et al. (2017)
- "Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting" - Zhou et al. (2021)
- "Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting" - Lim et al. (2021)

### Libraries
- **PyTorch Forecasting**: High-level library for time series with PyTorch
- **Darts**: Unified interface for various time series models
- **GluonTS**: Amazon's time series library with deep learning support
- **tsai**: State-of-the-art deep learning for time series

### Online Resources
- Stanford CS230 Deep Learning course materials
- PyTorch official time series tutorials
- Papers With Code - Time Series Forecasting benchmarks

## Summary

Deep learning has transformed time series analysis, offering powerful tools for capturing complex patterns that traditional methods cannot model. This article covered:

1. **Data Preparation**: Sequence creation, normalization, and feature engineering for deep learning
2. **LSTM Networks**: From basic architectures to attention mechanisms and encoder-decoder designs
3. **Temporal Convolutional Networks**: Efficient parallel processing with dilated convolutions
4. **Transformer Architectures**: Self-attention for time series, including Informer and TFT
5. **Training Best Practices**: Learning rate scheduling, early stopping, and gradient clipping
6. **Production Deployment**: Model export and inference optimization

The key to success with deep learning time series models lies in matching the architecture to your data characteristics, having sufficient training data, and following rigorous training and evaluation practices. Start with simpler models, establish strong baselines, and increase complexity only when the data and performance gains justify it.
