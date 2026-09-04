---
title: "Anomaly Detection: From Statistical Methods to Deep Learning"
description: "Master anomaly detection techniques: statistical methods, Isolation Forest, deep learning anomaly detection, and practical applications"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - Anomaly Detection
  - Isolation Forest
  - Autoencoder
  - Time Series
  - Outlier Detection
status: imported
origin: old/src/content/docs/datascience/anomaly-detection.en.md
divergence: 0.2
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 23
  lastUpdated: 2026-01-07
---

Anomaly Detection is one of the core tasks in data science, with wide applications in financial fraud detection, industrial equipment monitoring, network security, medical diagnosis, and more. This article covers various methods for time series anomaly detection, from traditional statistical methods to modern deep learning techniques.

---

## Overview of Anomaly Types

In time series data, anomalies can be classified into three main types. Understanding these types is crucial for selecting appropriate detection methods.

### Point Anomaly

Point anomaly is the simplest type of anomaly, referring to a single data point that significantly deviates from other data points.

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Generate time series with point anomalies
np.random.seed(42)
n_points = 200

# Normal data
normal_data = np.sin(np.linspace(0, 4*np.pi, n_points)) + np.random.normal(0, 0.1, n_points)

# Insert point anomalies
anomaly_indices = [50, 100, 150]
data_with_anomalies = normal_data.copy()
data_with_anomalies[anomaly_indices] = [3.5, -2.8, 4.0]

# Visualization
plt.figure(figsize=(14, 5))
plt.plot(data_with_anomalies, label='Time Series Data', alpha=0.7)
plt.scatter(anomaly_indices, data_with_anomalies[anomaly_indices],
            color='red', s=100, label='Point Anomalies', zorder=5)
plt.xlabel('Time')
plt.ylabel('Value')
plt.title('Point Anomaly Example')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**Characteristics:**
- A single data point is significantly different from the overall distribution
- Relatively easy to detect
- Commonly caused by sensor failures, data entry errors

### Contextual Anomaly

Contextual anomaly refers to data points that are anomalous in a specific context but may be normal in other contexts.

```python
# Generate seasonal data
days = 365
time = np.arange(days)

# Base trend + seasonality
trend = 0.01 * time
seasonality = 10 * np.sin(2 * np.pi * time / 365)
noise = np.random.normal(0, 1, days)
temperature = 20 + trend + seasonality + noise

# Insert contextual anomaly: low temperature in summer
summer_anomaly_idx = 180  # Mid-summer
temperature[summer_anomaly_idx] = 5  # Low temperature of 5 degrees in summer

# Visualization
plt.figure(figsize=(14, 5))
plt.plot(time, temperature, label='Temperature Data')
plt.scatter([summer_anomaly_idx], [temperature[summer_anomaly_idx]],
            color='red', s=100, label='Contextual Anomaly', zorder=5)
plt.xlabel('Days')
plt.ylabel('Temperature (C)')
plt.title('Contextual Anomaly Example: Low Temperature in Summer')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**Characteristics:**
- Depends on context (time, location, conditions, etc.)
- Needs to consider periodicity and trends in time series
- Higher detection difficulty

### Collective Anomaly

Collective anomaly refers to a group of data points that are anomalous as a whole, but individual data points may not be anomalous.

```python
# Generate data with collective anomaly
n_points = 500
normal_data = np.random.normal(0, 1, n_points)

# Insert collective anomaly: a sustained anomalous pattern
anomaly_start, anomaly_end = 200, 250
collective_anomaly = np.sin(np.linspace(0, 4*np.pi, anomaly_end - anomaly_start)) * 0.5

data_with_collective = normal_data.copy()
data_with_collective[anomaly_start:anomaly_end] = collective_anomaly

# Visualization
plt.figure(figsize=(14, 5))
plt.plot(data_with_collective, label='Time Series Data', alpha=0.7)
plt.axvspan(anomaly_start, anomaly_end, color='red', alpha=0.3, label='Collective Anomaly Region')
plt.xlabel('Time')
plt.ylabel('Value')
plt.title('Collective Anomaly Example: Anomalous Periodic Pattern')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**Characteristics:**
- Requires analyzing the overall behavior of data point sequences
- Common in system failures, attack behaviors
- Detection needs to consider time windows

### Anomaly Type Summary

| Anomaly Type | Definition | Detection Difficulty | Typical Scenarios |
|--------------|------------|---------------------|-------------------|
| Point Anomaly | Single data point is anomalous | Low | Sensor failures, data errors |
| Contextual Anomaly | Anomalous in specific context | Medium | Seasonal deviations, periodic anomalies |
| Collective Anomaly | A group of data points collectively anomalous | High | System failures, network attacks |

---

## Statistical Methods

Statistical methods are the foundation of anomaly detection, simple and intuitive, suitable for scenarios where data distribution is known or can be estimated.

### Z-Score Method

The Z-Score (standard score) method assumes that data follows a normal distribution and determines whether a point is anomalous by calculating how many standard deviations each data point deviates from the mean.

$$Z = \frac{x - \mu}{\sigma}$$

Where $\mu$ is the mean and $\sigma$ is the standard deviation. Typically, $|Z| > 3$ is considered anomalous.

```python
import numpy as np
import pandas as pd
from scipy import stats

class ZScoreDetector:
    """Z-Score based anomaly detector"""

    def __init__(self, threshold: float = 3.0):
        """
        Initialize detector

        Args:
            threshold: Z-Score threshold, default is 3
        """
        self.threshold = threshold
        self.mean = None
        self.std = None

    def fit(self, data: np.ndarray) -> 'ZScoreDetector':
        """
        Fit data, calculate mean and standard deviation

        Args:
            data: Training data
        """
        self.mean = np.mean(data)
        self.std = np.std(data)
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """
        Detect anomalies

        Args:
            data: Data to be detected

        Returns:
            Boolean array, True indicates anomaly
        """
        if self.mean is None or self.std is None:
            raise ValueError("Please call fit method first")

        z_scores = np.abs((data - self.mean) / self.std)
        return z_scores > self.threshold

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """Fit and detect"""
        self.fit(data)
        return self.detect(data)

    def get_z_scores(self, data: np.ndarray) -> np.ndarray:
        """Get Z-Score values"""
        return (data - self.mean) / self.std


# Usage example
np.random.seed(42)
data = np.random.normal(100, 15, 1000)
# Insert some anomalies
data[100] = 200
data[500] = 20
data[800] = 180

detector = ZScoreDetector(threshold=3.0)
anomalies = detector.fit_detect(data)

print(f"Detected {anomalies.sum()} anomaly points")
print(f"Anomaly indices: {np.where(anomalies)[0]}")
print(f"Anomaly values: {data[anomalies]}")
```

### Improved Z-Score (MAD)

Traditional Z-Score is sensitive to outliers because the mean and standard deviation themselves are affected by outliers. Using Median Absolute Deviation (MAD) improves robustness.

$$MAD = median(|x_i - median(x)|)$$

$$Modified\ Z = \frac{0.6745 \times (x - median(x))}{MAD}$$

```python
class RobustZScoreDetector:
    """Robust Z-Score detector based on MAD"""

    def __init__(self, threshold: float = 3.5):
        """
        Initialize detector

        Args:
            threshold: Modified Z-Score threshold, default is 3.5
        """
        self.threshold = threshold
        self.median = None
        self.mad = None

    def fit(self, data: np.ndarray) -> 'RobustZScoreDetector':
        """Fit data"""
        self.median = np.median(data)
        self.mad = np.median(np.abs(data - self.median))
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """Detect anomalies"""
        if self.mad == 0:
            return np.zeros(len(data), dtype=bool)

        # 0.6745 is the ratio of MAD to standard deviation for normal distribution
        modified_z_scores = 0.6745 * np.abs(data - self.median) / self.mad
        return modified_z_scores > self.threshold

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """Fit and detect"""
        self.fit(data)
        return self.detect(data)


# Compare traditional Z-Score and robust Z-Score
np.random.seed(42)
data = np.random.normal(100, 15, 100)
# Insert extreme outlier
data[50] = 500

z_detector = ZScoreDetector(threshold=3.0)
robust_detector = RobustZScoreDetector(threshold=3.5)

z_anomalies = z_detector.fit_detect(data)
robust_anomalies = robust_detector.fit_detect(data)

print(f"Traditional Z-Score detected: {z_anomalies.sum()} anomalies")
print(f"Robust Z-Score detected: {robust_anomalies.sum()} anomalies")
print(f"\nTraditional method mean: {z_detector.mean:.2f} (affected by outliers)")
print(f"Robust method median: {robust_detector.median:.2f} (not affected by outliers)")
```

### IQR Method (Interquartile Range)

The IQR method is based on data quartiles, more robust to outliers, and does not assume data follows a normal distribution.

$$IQR = Q_3 - Q_1$$

Anomaly bounds: $[Q_1 - k \times IQR, Q_3 + k \times IQR]$, where $k$ is typically 1.5.

```python
class IQRDetector:
    """IQR-based anomaly detector"""

    def __init__(self, k: float = 1.5):
        """
        Initialize detector

        Args:
            k: IQR multiplier, default is 1.5
        """
        self.k = k
        self.q1 = None
        self.q3 = None
        self.iqr = None
        self.lower_bound = None
        self.upper_bound = None

    def fit(self, data: np.ndarray) -> 'IQRDetector':
        """Fit data, calculate quartiles and bounds"""
        self.q1 = np.percentile(data, 25)
        self.q3 = np.percentile(data, 75)
        self.iqr = self.q3 - self.q1
        self.lower_bound = self.q1 - self.k * self.iqr
        self.upper_bound = self.q3 + self.k * self.iqr
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """Detect anomalies"""
        return (data < self.lower_bound) | (data > self.upper_bound)

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """Fit and detect"""
        self.fit(data)
        return self.detect(data)

    def get_bounds(self) -> tuple:
        """Get anomaly bounds"""
        return self.lower_bound, self.upper_bound


# Usage example
np.random.seed(42)
data = np.concatenate([
    np.random.normal(50, 10, 200),  # Normal data
    np.array([100, 110, 0, -10])     # Anomalies
])

detector = IQRDetector(k=1.5)
anomalies = detector.fit_detect(data)

print(f"Q1: {detector.q1:.2f}")
print(f"Q3: {detector.q3:.2f}")
print(f"IQR: {detector.iqr:.2f}")
print(f"Lower bound: {detector.lower_bound:.2f}")
print(f"Upper bound: {detector.upper_bound:.2f}")
print(f"Detected {anomalies.sum()} anomaly points")
```

### Sliding Window Statistical Method

For time series data, using sliding windows to calculate local statistics can capture time-varying characteristics.

```python
class SlidingWindowDetector:
    """Sliding window anomaly detector"""

    def __init__(self, window_size: int = 20, threshold: float = 3.0):
        """
        Initialize detector

        Args:
            window_size: Sliding window size
            threshold: Anomaly threshold (standard deviation multiplier)
        """
        self.window_size = window_size
        self.threshold = threshold

    def detect(self, data: np.ndarray) -> np.ndarray:
        """
        Detect anomalies using sliding window

        Args:
            data: Time series data

        Returns:
            Boolean array, True indicates anomaly
        """
        n = len(data)
        anomalies = np.zeros(n, dtype=bool)

        for i in range(self.window_size, n):
            # Get window data (excluding current point)
            window = data[i - self.window_size:i]

            # Calculate window statistics
            mean = np.mean(window)
            std = np.std(window)

            # Determine if current point is anomalous
            if std > 0:
                z_score = abs(data[i] - mean) / std
                anomalies[i] = z_score > self.threshold

        return anomalies

    def detect_with_scores(self, data: np.ndarray) -> tuple:
        """
        Detect anomalies and return anomaly scores

        Returns:
            (anomalies, scores): Anomaly labels and anomaly scores
        """
        n = len(data)
        scores = np.zeros(n)

        for i in range(self.window_size, n):
            window = data[i - self.window_size:i]
            mean = np.mean(window)
            std = np.std(window)

            if std > 0:
                scores[i] = abs(data[i] - mean) / std

        anomalies = scores > self.threshold
        return anomalies, scores


# Usage example: Detect anomalies in time series
np.random.seed(42)

# Generate time series with trend and noise
t = np.arange(200)
trend = 0.05 * t
noise = np.random.normal(0, 1, 200)
data = trend + noise

# Insert anomalies
data[50] = 15
data[100] = -10
data[150] = 20

detector = SlidingWindowDetector(window_size=20, threshold=3.0)
anomalies, scores = detector.detect_with_scores(data)

print(f"Detected {anomalies.sum()} anomaly points")
print(f"Anomaly indices: {np.where(anomalies)[0]}")
```

### EWMA Exponentially Weighted Moving Average

EWMA assigns higher weights to recent data, enabling faster response to data changes.

$$EWMA_t = \alpha \cdot x_t + (1 - \alpha) \cdot EWMA_{t-1}$$

```python
class EWMADetector:
    """EWMA-based anomaly detector"""

    def __init__(self, alpha: float = 0.3, threshold: float = 3.0):
        """
        Initialize detector

        Args:
            alpha: Smoothing factor, range (0, 1)
            threshold: Anomaly threshold
        """
        self.alpha = alpha
        self.threshold = threshold

    def detect(self, data: np.ndarray) -> tuple:
        """
        Detect anomalies

        Returns:
            (anomalies, ewma, upper_bound, lower_bound)
        """
        n = len(data)
        ewma = np.zeros(n)
        ewma_std = np.zeros(n)

        # Initialize
        ewma[0] = data[0]
        ewma_std[0] = 0

        # Calculate EWMA and EWMA standard deviation
        for i in range(1, n):
            ewma[i] = self.alpha * data[i] + (1 - self.alpha) * ewma[i-1]
            diff = data[i] - ewma[i-1]
            ewma_std[i] = np.sqrt(
                self.alpha * diff**2 + (1 - self.alpha) * ewma_std[i-1]**2
            )

        # Calculate control bounds
        upper_bound = ewma + self.threshold * ewma_std
        lower_bound = ewma - self.threshold * ewma_std

        # Detect anomalies
        anomalies = (data > upper_bound) | (data < lower_bound)

        return anomalies, ewma, upper_bound, lower_bound


# Usage example
np.random.seed(42)
t = np.arange(300)
# Generate data with mean shift
data = np.concatenate([
    np.random.normal(10, 1, 100),
    np.random.normal(12, 1, 100),  # Mean shift
    np.random.normal(10, 1, 100)
])
# Insert point anomalies
data[50] = 20
data[200] = 5

detector = EWMADetector(alpha=0.2, threshold=3.0)
anomalies, ewma, upper, lower = detector.detect(data)

print(f"Detected {anomalies.sum()} anomaly points")
```

---

## Machine Learning Methods

### Isolation Forest

Isolation Forest is an unsupervised anomaly detection algorithm based on the intuition that anomalies are easier to "isolate."

**Core idea:**
- Anomalies have feature values that differ significantly from normal points
- During random partitioning, anomalies require fewer splits to be isolated
- Anomalies have shorter average path lengths in the tree

```python
from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

class IsolationForestDetector:
    """Isolation Forest anomaly detector"""

    def __init__(self, contamination: float = 0.1, n_estimators: int = 100,
                 max_samples: str = 'auto', random_state: int = 42):
        """
        Initialize detector

        Args:
            contamination: Estimated proportion of anomalies
            n_estimators: Number of trees
            max_samples: Number of samples per tree
            random_state: Random seed
        """
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1
        )

    def fit(self, data: np.ndarray) -> 'IsolationForestDetector':
        """Fit model"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        self.model.fit(data)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        Predict anomalies

        Returns:
            Boolean array, True indicates anomaly
        """
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        predictions = self.model.predict(data)
        return predictions == -1  # -1 indicates anomaly

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """Get anomaly scores (lower is more anomalous)"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        return self.model.decision_function(data)

    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """Fit and predict"""
        self.fit(data)
        return self.predict(data)


# One-dimensional time series anomaly detection
np.random.seed(42)
n_samples = 500

# Generate normal data
normal_data = np.sin(np.linspace(0, 8*np.pi, n_samples)) + np.random.normal(0, 0.1, n_samples)

# Insert anomalies
data = normal_data.copy()
anomaly_idx = [50, 150, 250, 350, 450]
data[anomaly_idx] = [3, -2.5, 2.8, -3, 2.5]

# Detection
detector = IsolationForestDetector(contamination=0.02)
anomalies = detector.fit_predict(data)
scores = detector.decision_function(data)

print(f"Detected {anomalies.sum()} anomaly points")
print(f"True anomalies: {anomaly_idx}")
print(f"Detected anomalies: {np.where(anomalies)[0].tolist()}")
```

### Multi-dimensional Feature Isolation Forest

In practical applications, multiple features are usually extracted from time series for anomaly detection.

```python
from sklearn.preprocessing import StandardScaler

class TimeSeriesFeatureExtractor:
    """Time series feature extractor"""

    def __init__(self, window_size: int = 20):
        self.window_size = window_size

    def extract_features(self, data: np.ndarray) -> np.ndarray:
        """
        Extract features from sliding window

        Features:
        - Mean
        - Standard deviation
        - Maximum
        - Minimum
        - Slope
        - Kurtosis
        - Skewness
        """
        from scipy import stats

        n = len(data)
        features = []

        for i in range(self.window_size, n):
            window = data[i - self.window_size:i]

            # Basic statistical features
            mean = np.mean(window)
            std = np.std(window)
            max_val = np.max(window)
            min_val = np.min(window)

            # Trend features
            slope = np.polyfit(range(len(window)), window, 1)[0]

            # Distribution features
            kurtosis = stats.kurtosis(window)
            skewness = stats.skew(window)

            # Current point's relationship to window
            current_value = data[i]
            z_score = (current_value - mean) / (std + 1e-8)

            features.append([
                mean, std, max_val, min_val, slope,
                kurtosis, skewness, current_value, z_score
            ])

        return np.array(features)


# Anomaly detection with multi-dimensional features
np.random.seed(42)

# Generate more complex time series
n_samples = 500
t = np.arange(n_samples)
trend = 0.01 * t
seasonality = 2 * np.sin(2 * np.pi * t / 50)
noise = np.random.normal(0, 0.3, n_samples)
data = trend + seasonality + noise

# Insert different types of anomalies
data[100] = 10      # Point anomaly
data[200:210] = 8   # Collective anomaly
data[350] = -5      # Point anomaly

# Feature extraction
extractor = TimeSeriesFeatureExtractor(window_size=20)
features = extractor.extract_features(data)

# Anomaly detection
detector = IsolationForestDetector(contamination=0.05)
anomalies_features = detector.fit_predict(features)

# Map back to original indices
anomaly_indices = np.where(anomalies_features)[0] + extractor.window_size

print(f"Detected {len(anomaly_indices)} anomaly points")
print(f"Anomaly indices: {anomaly_indices}")
```

### One-Class SVM

One-Class SVM learns the boundary of normal data and marks points outside the boundary as anomalies.

```python
from sklearn.svm import OneClassSVM

class OneClassSVMDetector:
    """One-Class SVM anomaly detector"""

    def __init__(self, kernel: str = 'rbf', nu: float = 0.1, gamma: str = 'scale'):
        """
        Initialize detector

        Args:
            kernel: Kernel function type
            nu: Upper bound on anomaly proportion
            gamma: RBF kernel parameter
        """
        self.scaler = StandardScaler()
        self.model = OneClassSVM(kernel=kernel, nu=nu, gamma=gamma)

    def fit(self, data: np.ndarray) -> 'OneClassSVMDetector':
        """Fit model"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.fit_transform(data)
        self.model.fit(data_scaled)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        predictions = self.model.predict(data_scaled)
        return predictions == -1

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """Get anomaly scores"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        return self.model.decision_function(data_scaled)

    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """Fit and predict"""
        self.fit(data)
        return self.predict(data)


# Usage example
np.random.seed(42)

# Generate 2D data (for visualization)
n_samples = 300
normal_data = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], n_samples)

# Add anomaly points
anomalies_data = np.array([[4, 4], [-4, 3], [3, -4], [-3, -3], [5, 0]])
data = np.vstack([normal_data, anomalies_data])

# Detection
detector = OneClassSVMDetector(nu=0.05)
predictions = detector.fit_predict(data)
scores = detector.decision_function(data)

print(f"Detected {predictions.sum()} anomaly points")
```

### Local Outlier Factor (LOF)

LOF is a density-based anomaly detection method that compares the local density of each point with its neighbors.

```python
from sklearn.neighbors import LocalOutlierFactor

class LOFDetector:
    """Local Outlier Factor detector"""

    def __init__(self, n_neighbors: int = 20, contamination: float = 0.1):
        """
        Initialize detector

        Args:
            n_neighbors: Number of neighbors
            contamination: Estimated proportion of anomalies
        """
        self.model = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=contamination,
            novelty=True
        )
        self.scaler = StandardScaler()

    def fit(self, data: np.ndarray) -> 'LOFDetector':
        """Fit model"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.fit_transform(data)
        self.model.fit(data_scaled)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        predictions = self.model.predict(data_scaled)
        return predictions == -1

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """Get anomaly scores"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        return self.model.decision_function(data_scaled)


# Usage example
np.random.seed(42)

# Generate data with clusters of different densities
cluster1 = np.random.normal([0, 0], 0.5, (100, 2))
cluster2 = np.random.normal([4, 4], 0.3, (50, 2))
anomalies_data = np.array([[2, 2], [-2, 3], [6, 1]])

data = np.vstack([cluster1, cluster2, anomalies_data])

# Detection
detector = LOFDetector(n_neighbors=20, contamination=0.05)
detector.fit(data)
predictions = detector.predict(data)

print(f"Detected {predictions.sum()} anomaly points")
```

---

## Deep Learning Methods

Deep learning methods excel in complex data and high-dimensional scenarios, particularly suitable for capturing nonlinear patterns.

### Autoencoder Anomaly Detection

Autoencoders learn compressed representations of data. Normal data can be reconstructed well, while anomalous data has larger reconstruction errors.

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class Autoencoder(nn.Module):
    """Basic Autoencoder"""

    def __init__(self, input_dim: int, encoding_dim: int = 8):
        super().__init__()

        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, encoding_dim),
            nn.ReLU()
        )

        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.Linear(64, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

    def encode(self, x):
        return self.encoder(x)


class AutoencoderDetector:
    """Autoencoder-based anomaly detector"""

    def __init__(self, input_dim: int, encoding_dim: int = 8,
                 threshold_percentile: float = 95):
        """
        Initialize detector

        Args:
            input_dim: Input dimension
            encoding_dim: Encoding dimension
            threshold_percentile: Percentile for reconstruction error threshold
        """
        self.model = Autoencoder(input_dim, encoding_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """
        Train autoencoder

        Args:
            data: Training data (assumed to be normal data)
            epochs: Number of training epochs
            batch_size: Batch size
            learning_rate: Learning rate
            verbose: Whether to print training information
        """
        # Convert to tensor
        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        # Optimizer and loss function
        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        # Training
        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        # Calculate threshold
        self.model.eval()
        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            reconstruction_errors = torch.mean((data_tensor - reconstructed) ** 2, dim=1)
            self.threshold = np.percentile(
                reconstruction_errors.cpu().numpy(),
                self.threshold_percentile
            )

        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """Calculate reconstruction error"""
        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=1)

        return errors.cpu().numpy()


# Usage example: Time series window anomaly detection
np.random.seed(42)

# Generate normal time series
n_samples = 1000
normal_data = np.sin(np.linspace(0, 20*np.pi, n_samples)) + np.random.normal(0, 0.1, n_samples)

# Create sliding window features
window_size = 20
def create_windows(data, window_size):
    windows = []
    for i in range(len(data) - window_size + 1):
        windows.append(data[i:i + window_size])
    return np.array(windows)

# Training data (normal data)
train_windows = create_windows(normal_data[:800], window_size)

# Test data (containing anomalies)
test_data = normal_data.copy()
test_data[850] = 5  # Point anomaly
test_data[900:910] = 3  # Collective anomaly
test_windows = create_windows(test_data[800:], window_size)

# Train detector
detector = AutoencoderDetector(input_dim=window_size, encoding_dim=4, threshold_percentile=95)
detector.fit(train_windows, epochs=100, verbose=True)

# Detect anomalies
anomalies = detector.predict(test_windows)
errors = detector.reconstruction_error(test_windows)

print(f"\nDetected {anomalies.sum()} anomalous windows")
print(f"Anomalous window start indices: {np.where(anomalies)[0] + 800}")
print(f"Threshold: {detector.threshold:.6f}")
```

### LSTM Autoencoder

LSTM autoencoders can capture temporal dependencies in time series.

```python
class LSTMAutoencoder(nn.Module):
    """LSTM Autoencoder"""

    def __init__(self, input_dim: int, hidden_dim: int = 64,
                 latent_dim: int = 16, num_layers: int = 2):
        super().__init__()

        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # Encoder LSTM
        self.encoder_lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )

        # Compression layer
        self.encoder_fc = nn.Linear(hidden_dim, latent_dim)

        # Decoder
        self.decoder_fc = nn.Linear(latent_dim, hidden_dim)

        self.decoder_lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )

        # Output layer
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        batch_size, seq_len, _ = x.size()

        # Encode
        _, (hidden, cell) = self.encoder_lstm(x)

        # Use hidden state of last layer
        latent = self.encoder_fc(hidden[-1])

        # Decode
        decoder_input = self.decoder_fc(latent)
        decoder_input = decoder_input.unsqueeze(1).repeat(1, seq_len, 1)

        decoder_output, _ = self.decoder_lstm(decoder_input)
        reconstructed = self.output_layer(decoder_output)

        return reconstructed, latent


class LSTMAutoencoderDetector:
    """LSTM Autoencoder-based anomaly detector"""

    def __init__(self, input_dim: int = 1, hidden_dim: int = 64,
                 latent_dim: int = 16, threshold_percentile: float = 95):
        self.model = LSTMAutoencoder(input_dim, hidden_dim, latent_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """
        Train LSTM Autoencoder

        Args:
            data: Data with shape (n_samples, seq_len, n_features)
        """
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed, _ = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        # Calculate threshold
        errors = self.reconstruction_error(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """Calculate reconstruction error"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed, _ = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=(1, 2))

        return errors.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold
```

### Variational Autoencoder (VAE) Anomaly Detection

VAE learns the latent distribution of data and can detect anomalies through reconstruction probability or ELBO.

```python
class VAE(nn.Module):
    """Variational Autoencoder"""

    def __init__(self, input_dim: int, hidden_dim: int = 64, latent_dim: int = 16):
        super().__init__()

        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU()
        )

        # Mean and variance layers
        self.fc_mu = nn.Linear(hidden_dim // 2, latent_dim)
        self.fc_logvar = nn.Linear(hidden_dim // 2, latent_dim)

        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )

    def encode(self, x):
        h = self.encoder(x)
        mu = self.fc_mu(h)
        logvar = self.fc_logvar(h)
        return mu, logvar

    def reparameterize(self, mu, logvar):
        """Reparameterization trick"""
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        return self.decoder(z)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        reconstructed = self.decode(z)
        return reconstructed, mu, logvar


def vae_loss(reconstructed, original, mu, logvar):
    """VAE loss function = reconstruction loss + KL divergence"""
    # Reconstruction loss
    reconstruction_loss = nn.functional.mse_loss(reconstructed, original, reduction='sum')

    # KL divergence
    kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())

    return reconstruction_loss + kl_loss


class VAEDetector:
    """VAE-based anomaly detector"""

    def __init__(self, input_dim: int, hidden_dim: int = 64,
                 latent_dim: int = 16, threshold_percentile: float = 95):
        self.model = VAE(input_dim, hidden_dim, latent_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """Train VAE"""
        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed, mu, logvar = self.model(batch_data)
                loss = vae_loss(reconstructed, batch_data, mu, logvar)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataset)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.4f}')

        # Calculate threshold
        errors = self.anomaly_score(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def anomaly_score(self, data: np.ndarray) -> np.ndarray:
        """
        Calculate anomaly score
        Use reconstruction error + KL divergence as anomaly score
        """
        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed, mu, logvar = self.model(data_tensor)

            # Reconstruction error
            reconstruction_error = torch.mean((data_tensor - reconstructed) ** 2, dim=1)

            # KL divergence
            kl_divergence = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp(), dim=1)

            # Combined anomaly score
            scores = reconstruction_error + 0.1 * kl_divergence

        return scores.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        scores = self.anomaly_score(data)
        return scores > self.threshold

    def generate_samples(self, n_samples: int) -> np.ndarray:
        """Generate samples from learned distribution"""
        self.model.eval()
        with torch.no_grad():
            z = torch.randn(n_samples, self.model.fc_mu.out_features).to(self.device)
            samples = self.model.decode(z)
        return samples.cpu().numpy()


# Usage example
np.random.seed(42)

# Generate normal data
n_train = 1000
n_test = 200
input_dim = 20

# Normal data from multivariate Gaussian distribution
normal_train = np.random.multivariate_normal(
    np.zeros(input_dim),
    np.eye(input_dim),
    n_train
)

normal_test = np.random.multivariate_normal(
    np.zeros(input_dim),
    np.eye(input_dim),
    n_test - 20
)

# Anomaly data
anomaly_test = np.random.multivariate_normal(
    np.ones(input_dim) * 3,
    np.eye(input_dim),
    20
)

test_data = np.vstack([normal_test, anomaly_test])
test_labels = np.array([0] * (n_test - 20) + [1] * 20)

# Train and detect
detector = VAEDetector(input_dim=input_dim, hidden_dim=64, latent_dim=8)
detector.fit(normal_train, epochs=100, verbose=True)

predictions = detector.predict(test_data)
scores = detector.anomaly_score(test_data)

print(f"\nDetected {predictions.sum()} anomaly points")
print(f"True anomaly count: {test_labels.sum()}")
```

### Transformer Anomaly Detection

The Transformer architecture uses self-attention mechanisms to capture long-range dependencies, suitable for handling complex time series patterns.

```python
class TransformerEncoder(nn.Module):
    """Transformer encoder for time series anomaly detection"""

    def __init__(self, input_dim: int, d_model: int = 64, nhead: int = 4,
                 num_layers: int = 2, dim_feedforward: int = 128, dropout: float = 0.1):
        super().__init__()

        # Input embedding
        self.input_embedding = nn.Linear(input_dim, d_model)

        # Positional encoding
        self.pos_encoder = PositionalEncoding(d_model, dropout)

        # Transformer encoder layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        # Output layer (reconstruction)
        self.output_layer = nn.Linear(d_model, input_dim)

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        x = self.input_embedding(x)
        x = self.pos_encoder(x)
        encoded = self.transformer_encoder(x)
        reconstructed = self.output_layer(encoded)
        return reconstructed


class PositionalEncoding(nn.Module):
    """Positional encoding"""

    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)

        self.register_buffer('pe', pe)

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class TransformerDetector:
    """Transformer-based anomaly detector"""

    def __init__(self, input_dim: int = 1, d_model: int = 64, nhead: int = 4,
                 num_layers: int = 2, threshold_percentile: float = 95):
        self.model = TransformerEncoder(input_dim, d_model, nhead, num_layers)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """Train Transformer"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        errors = self.reconstruction_error(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """Calculate reconstruction error"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=(1, 2))

        return errors.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """Predict anomalies"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold
```

---

## Model Evaluation Metrics

Model evaluation for anomaly detection needs special attention to class imbalance since anomalies are usually the minority class.

### Basic Evaluation Metrics

```python
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    accuracy_score, confusion_matrix, roc_auc_score,
    precision_recall_curve, roc_curve, average_precision_score
)
import matplotlib.pyplot as plt

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                    y_scores: np.ndarray = None) -> dict:
    """
    Calculate anomaly detector performance metrics

    Args:
        y_true: True labels (0=normal, 1=anomaly)
        y_pred: Predicted labels
        y_scores: Anomaly scores (optional)

    Returns:
        Metrics dictionary
    """
    metrics = {}

    # Basic metrics
    metrics['accuracy'] = accuracy_score(y_true, y_pred)
    metrics['precision'] = precision_score(y_true, y_pred, zero_division=0)
    metrics['recall'] = recall_score(y_true, y_pred, zero_division=0)
    metrics['f1'] = f1_score(y_true, y_pred, zero_division=0)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    metrics['confusion_matrix'] = cm

    # Calculate specific metrics
    tn, fp, fn, tp = cm.ravel()
    metrics['true_positives'] = tp
    metrics['false_positives'] = fp
    metrics['true_negatives'] = tn
    metrics['false_negatives'] = fn

    # Specificity (True Negative Rate)
    metrics['specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0

    # If anomaly scores available, calculate AUC
    if y_scores is not None:
        metrics['roc_auc'] = roc_auc_score(y_true, y_scores)
        metrics['pr_auc'] = average_precision_score(y_true, y_scores)

    return metrics


def print_metrics_report(metrics: dict):
    """Print metrics report"""
    print("=" * 50)
    print("Anomaly Detection Metrics Report")
    print("=" * 50)

    print(f"\nAccuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1 Score: {metrics['f1']:.4f}")
    print(f"Specificity: {metrics['specificity']:.4f}")

    if 'roc_auc' in metrics:
        print(f"ROC AUC: {metrics['roc_auc']:.4f}")
        print(f"PR AUC: {metrics['pr_auc']:.4f}")

    print(f"\nConfusion Matrix:")
    print(f"  True Positives (TP): {metrics['true_positives']}")
    print(f"  False Positives (FP): {metrics['false_positives']}")
    print(f"  True Negatives (TN): {metrics['true_negatives']}")
    print(f"  False Negatives (FN): {metrics['false_negatives']}")


# Usage example
np.random.seed(42)

# Simulate true labels and predictions
n_samples = 1000
n_anomalies = 50

y_true = np.zeros(n_samples)
y_true[:n_anomalies] = 1
np.random.shuffle(y_true)

# Simulate predictions (80% accuracy)
y_pred = y_true.copy()
flip_indices = np.random.choice(n_samples, size=int(n_samples * 0.2), replace=False)
y_pred[flip_indices] = 1 - y_pred[flip_indices]

# Simulate anomaly scores
y_scores = np.random.beta(2, 5, n_samples)
y_scores[y_true == 1] = np.random.beta(5, 2, int(y_true.sum()))

# Calculate metrics
metrics = compute_metrics(y_true, y_pred, y_scores)
print_metrics_report(metrics)
```

### ROC Curve and PR Curve

```python
def plot_curves(y_true: np.ndarray, y_scores: np.ndarray):
    """Plot ROC curve and PR curve"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ROC curve
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    roc_auc = roc_auc_score(y_true, y_scores)

    axes[0].plot(fpr, tpr, 'b-', linewidth=2, label=f'ROC Curve (AUC = {roc_auc:.4f})')
    axes[0].plot([0, 1], [0, 1], 'r--', linewidth=1, label='Random Guess')
    axes[0].fill_between(fpr, tpr, alpha=0.2)
    axes[0].set_xlabel('False Positive Rate (FPR)')
    axes[0].set_ylabel('True Positive Rate (TPR)')
    axes[0].set_title('ROC Curve')
    axes[0].legend(loc='lower right')
    axes[0].grid(True, alpha=0.3)

    # PR curve
    precision, recall, thresholds = precision_recall_curve(y_true, y_scores)
    pr_auc = average_precision_score(y_true, y_scores)

    axes[1].plot(recall, precision, 'g-', linewidth=2, label=f'PR Curve (AP = {pr_auc:.4f})')
    baseline = y_true.sum() / len(y_true)
    axes[1].axhline(y=baseline, color='r', linestyle='--', label=f'Baseline ({baseline:.4f})')
    axes[1].fill_between(recall, precision, alpha=0.2, color='green')
    axes[1].set_xlabel('Recall')
    axes[1].set_ylabel('Precision')
    axes[1].set_title('Precision-Recall Curve')
    axes[1].legend(loc='lower left')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    return roc_auc, pr_auc


# Plot curves
roc_auc, pr_auc = plot_curves(y_true, y_scores)
```

### Threshold Selection Strategies

```python
def find_optimal_threshold(y_true: np.ndarray, y_scores: np.ndarray,
                           strategy: str = 'f1') -> float:
    """
    Find optimal threshold

    Args:
        y_true: True labels
        y_scores: Anomaly scores
        strategy: Optimization strategy ('f1', 'precision', 'recall', 'youden')

    Returns:
        Optimal threshold
    """
    thresholds = np.percentile(y_scores, np.arange(0, 100, 1))
    best_threshold = thresholds[0]
    best_score = 0

    for threshold in thresholds:
        y_pred = (y_scores >= threshold).astype(int)

        if strategy == 'f1':
            score = f1_score(y_true, y_pred, zero_division=0)
        elif strategy == 'precision':
            score = precision_score(y_true, y_pred, zero_division=0)
        elif strategy == 'recall':
            score = recall_score(y_true, y_pred, zero_division=0)
        elif strategy == 'youden':
            # Youden's J statistic: TPR - FPR
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            score = tpr - fpr
        else:
            raise ValueError(f"Unknown strategy: {strategy}")

        if score > best_score:
            best_score = score
            best_threshold = threshold

    return best_threshold


# Find optimal thresholds for different strategies
strategies = ['f1', 'precision', 'recall', 'youden']
print("Optimal thresholds for different strategies:")
for strategy in strategies:
    threshold = find_optimal_threshold(y_true, y_scores, strategy)
    y_pred = (y_scores >= threshold).astype(int)
    f1 = f1_score(y_true, y_pred)
    print(f"  {strategy}: threshold={threshold:.4f}, F1={f1:.4f}")
```

---

## Practical Cases

### Case 1: Server CPU Usage Anomaly Detection

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class ServerMonitoringSystem:
    """Server monitoring system"""

    def __init__(self):
        self.detectors = {}
        self.thresholds = {}

    def generate_sample_data(self, days: int = 7) -> pd.DataFrame:
        """Generate simulated server monitoring data"""
        np.random.seed(42)

        # Time index
        start_date = datetime.now() - timedelta(days=days)
        timestamps = pd.date_range(start=start_date, periods=days*24*60, freq='1min')

        n_points = len(timestamps)

        # CPU usage: daily periodicity + noise
        hour = np.array([t.hour for t in timestamps])
        day_pattern = 30 + 20 * np.sin(2 * np.pi * hour / 24 - np.pi/2)
        cpu_usage = day_pattern + np.random.normal(0, 5, n_points)
        cpu_usage = np.clip(cpu_usage, 0, 100)

        # Insert anomalies
        # 1. CPU spikes
        spike_indices = np.random.choice(n_points, size=20, replace=False)
        cpu_usage[spike_indices] = np.random.uniform(90, 100, 20)

        # 2. Abnormally low usage (possible service crash)
        crash_start = n_points // 2
        cpu_usage[crash_start:crash_start + 30] = np.random.uniform(0, 5, 30)

        # Memory usage
        memory_usage = 60 + np.random.normal(0, 10, n_points)
        memory_usage = np.clip(memory_usage, 0, 100)

        # Network traffic
        network_traffic = 100 + 50 * np.sin(2 * np.pi * hour / 24) + np.random.normal(0, 20, n_points)
        network_traffic = np.clip(network_traffic, 0, 300)

        df = pd.DataFrame({
            'timestamp': timestamps,
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'network_traffic': network_traffic
        })

        return df

    def train_detectors(self, df: pd.DataFrame):
        """Train anomaly detectors"""
        # Train detector for each metric
        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            data = df[column].values

            # Use sliding window statistical method
            detector = SlidingWindowDetector(window_size=60, threshold=3.0)
            self.detectors[column] = detector

    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect anomalies"""
        results = df.copy()

        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            data = df[column].values
            detector = self.detectors[column]
            anomalies, scores = detector.detect_with_scores(data)

            results[f'{column}_anomaly'] = anomalies
            results[f'{column}_score'] = scores

        # Combined anomaly flag
        results['is_anomaly'] = (
            results['cpu_usage_anomaly'] |
            results['memory_usage_anomaly'] |
            results['network_traffic_anomaly']
        )

        return results

    def generate_report(self, results: pd.DataFrame) -> str:
        """Generate anomaly report"""
        report = []
        report.append("=" * 60)
        report.append("Server Monitoring Anomaly Report")
        report.append("=" * 60)

        total_anomalies = results['is_anomaly'].sum()
        report.append(f"\nTotal anomalies: {total_anomalies}")
        report.append(f"Data time range: {results['timestamp'].min()} - {results['timestamp'].max()}")

        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            anomaly_count = results[f'{column}_anomaly'].sum()
            report.append(f"\n{column} anomaly count: {anomaly_count}")

            if anomaly_count > 0:
                anomaly_data = results[results[f'{column}_anomaly']]
                report.append(f"  Max anomaly score: {anomaly_data[f'{column}_score'].max():.2f}")
                report.append(f"  Sample anomaly timestamps:")
                for _, row in anomaly_data.head(3).iterrows():
                    report.append(f"    - {row['timestamp']}: {row[column]:.2f}")

        return '\n'.join(report)


# Run example
monitor = ServerMonitoringSystem()

# Generate data
print("Generating simulated data...")
df = monitor.generate_sample_data(days=3)
print(f"Data points: {len(df)}")

# Train detectors
print("\nTraining detectors...")
monitor.train_detectors(df)

# Detect anomalies
print("Detecting anomalies...")
results = monitor.detect_anomalies(df)

# Generate report
report = monitor.generate_report(results)
print(report)
```

### Case 2: Financial Transaction Fraud Detection

```python
class FraudDetectionSystem:
    """Financial fraud detection system"""

    def __init__(self):
        self.isolation_forest = None
        self.autoencoder = None
        self.scaler = StandardScaler()

    def generate_sample_transactions(self, n_normal: int = 10000,
                                      n_fraud: int = 200) -> pd.DataFrame:
        """Generate simulated transaction data"""
        np.random.seed(42)

        # Normal transaction features
        normal_transactions = pd.DataFrame({
            'amount': np.random.lognormal(4, 1, n_normal),  # Log-normal distribution
            'time_since_last': np.random.exponential(24, n_normal),  # Hours
            'distance_from_home': np.random.exponential(10, n_normal),  # Kilometers
            'merchant_category': np.random.randint(0, 20, n_normal),
            'transaction_count_24h': np.random.poisson(3, n_normal),
            'is_fraud': 0
        })

        # Fraud transaction features
        fraud_transactions = pd.DataFrame({
            'amount': np.random.lognormal(6, 1.5, n_fraud),  # Larger amounts
            'time_since_last': np.random.exponential(1, n_fraud),  # Short intervals
            'distance_from_home': np.random.exponential(100, n_fraud),  # Far distance
            'merchant_category': np.random.randint(0, 20, n_fraud),
            'transaction_count_24h': np.random.poisson(10, n_fraud),  # High frequency
            'is_fraud': 1
        })

        df = pd.concat([normal_transactions, fraud_transactions], ignore_index=True)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # Shuffle

        return df

    def extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extract features"""
        feature_columns = ['amount', 'time_since_last', 'distance_from_home',
                          'merchant_category', 'transaction_count_24h']

        # Add derived features
        df = df.copy()
        df['log_amount'] = np.log1p(df['amount'])
        df['amount_per_transaction'] = df['amount'] / (df['transaction_count_24h'] + 1)

        extended_features = feature_columns + ['log_amount', 'amount_per_transaction']

        return df[extended_features].values

    def train(self, df: pd.DataFrame):
        """Train detection model"""
        features = self.extract_features(df)
        features_scaled = self.scaler.fit_transform(features)

        # Train only on normal data (unsupervised)
        normal_mask = df['is_fraud'] == 0
        normal_features = features_scaled[normal_mask]

        # Train Isolation Forest
        self.isolation_forest = IsolationForest(
            contamination=0.02,
            n_estimators=100,
            random_state=42
        )
        self.isolation_forest.fit(normal_features)

        # Train Autoencoder
        self.autoencoder = AutoencoderDetector(
            input_dim=features_scaled.shape[1],
            encoding_dim=4,
            threshold_percentile=98
        )
        self.autoencoder.fit(normal_features, epochs=50, verbose=False)

        print("Model training complete")

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """Predict fraud"""
        features = self.extract_features(df)
        features_scaled = self.scaler.transform(features)

        results = df.copy()

        # Isolation Forest prediction
        if_scores = -self.isolation_forest.decision_function(features_scaled)
        if_predictions = self.isolation_forest.predict(features_scaled) == -1

        # Autoencoder prediction
        ae_scores = self.autoencoder.reconstruction_error(features_scaled)
        ae_predictions = ae_scores > self.autoencoder.threshold

        # Combined prediction (either model flags as anomaly)
        results['if_score'] = if_scores
        results['if_fraud'] = if_predictions
        results['ae_score'] = ae_scores
        results['ae_fraud'] = ae_predictions
        results['predicted_fraud'] = if_predictions | ae_predictions

        return results

    def run_assessment(self, results: pd.DataFrame):
        """Evaluate model performance"""
        y_true = results['is_fraud'].values

        print("\n" + "=" * 50)
        print("Fraud Detection Performance Report")
        print("=" * 50)

        for model_name, pred_col, score_col in [
            ('Isolation Forest', 'if_fraud', 'if_score'),
            ('Autoencoder', 'ae_fraud', 'ae_score'),
            ('Ensemble Model', 'predicted_fraud', 'if_score')
        ]:
            y_pred = results[pred_col].values
            y_scores = results[score_col].values

            print(f"\n{model_name}:")
            print(f"  Precision: {precision_score(y_true, y_pred):.4f}")
            print(f"  Recall: {recall_score(y_true, y_pred):.4f}")
            print(f"  F1 Score: {f1_score(y_true, y_pred):.4f}")
            print(f"  ROC AUC: {roc_auc_score(y_true, y_scores):.4f}")


# Run example
fraud_system = FraudDetectionSystem()

# Generate data
print("Generating simulated transaction data...")
df = fraud_system.generate_sample_transactions(n_normal=5000, n_fraud=100)
print(f"Total transactions: {len(df)}, Fraud transactions: {df['is_fraud'].sum()}")

# Split train and test sets
train_size = int(len(df) * 0.7)
train_df = df.iloc[:train_size]
test_df = df.iloc[train_size:]

# Train
print("\nTraining detection model...")
fraud_system.train(train_df)

# Predict and evaluate
print("\nEvaluating on test set...")
results = fraud_system.predict(test_df)
fraud_system.run_assessment(results)
```

---

## Interview Key Points

### Core Concept Questions

**Q1: Explain the difference between point anomalies, contextual anomalies, and collective anomalies in anomaly detection?**

- **Point anomaly**: A single data point is significantly different from other data, such as a credit card transaction amount suddenly increasing 100 times
- **Contextual anomaly**: Anomalous in a specific context, such as a temperature of 0 degrees in summer is anomalous, but normal in winter
- **Collective anomaly**: A group of data points is anomalous as a whole, such as network traffic showing abnormal patterns during a certain period

**Q2: What are the pros and cons of Z-Score method and IQR method?**

| Method | Pros | Cons |
|--------|------|------|
| Z-Score | Simple and intuitive, has probabilistic interpretation | Assumes normal distribution, affected by outliers |
| IQR | Does not assume distribution, robust to outliers | Cannot utilize distribution information |

**Q3: What is the core idea of Isolation Forest? Why do anomalies have shorter path lengths?**

Core idea: Anomalies have feature values that differ significantly from normal points, making them easier to "isolate" during random partitioning.

Reasons for shorter path length:
1. Anomalies are usually located in sparse regions of feature space
2. When randomly selecting partition features and thresholds, it's easier to select partitions that isolate anomalies
3. Normal points are dense, requiring more partitions to distinguish

**Q4: How do autoencoders work for anomaly detection?**

```python
# Basic principle
# Train autoencoder on normal data to learn compressed representation
# Normal data can be reconstructed well, anomalous data has larger reconstruction error
# Use reconstruction error as anomaly score

# Anomaly score = ||x - decode(encode(x))||^2
```

Key points:
- Train only on normal data
- Encoding dimension selection affects detection effectiveness
- Can use percentile of reconstruction error as threshold

**Q5: In anomaly detection with extreme class imbalance, which performance metrics should be used?**

- **Not recommended**: Accuracy - dominated by the large number of normal samples
- **Recommended**:
  - Precision-Recall curve (PR curve) and PR AUC
  - F1 score
  - Recall@specific precision
  - If anomaly detection costs are asymmetric, use weighted F-score

### Engineering Practice Questions

**Q6: How to handle seasonality and trends in time series anomaly detection?**

```python
from statsmodels.tsa.seasonal import seasonal_decompose

def decompose_and_detect(data, period=24):
    """Decompose time series and detect anomalies"""
    # 1. Decompose time series
    decomposition = seasonal_decompose(data, period=period, model='additive')

    # 2. Detect anomalies on residuals (trends and seasonality removed)
    residual = decomposition.resid

    # 3. Use statistical methods to detect anomalies in residuals
    detector = ZScoreDetector(threshold=3.0)
    anomalies = detector.fit_detect(residual[~np.isnan(residual)])

    return anomalies, decomposition
```

**Q7: Design considerations for real-time anomaly detection systems?**

1. **Latency requirements**: Choose methods with low computational complexity (e.g., sliding window statistics)
2. **Model updates**: Regular retraining or online learning algorithms
3. **Threshold adjustment**: Dynamic thresholds to adapt to data distribution changes
4. **Alert strategy**: Set cooldown periods to avoid duplicate alerts
5. **Explainability**: Provide anomaly cause analysis

**Q8: How to choose the appropriate anomaly detection method?**

| Scenario | Recommended Method |
|----------|-------------------|
| Small data, few features | Statistical methods (Z-Score, IQR) |
| High-dimensional data | Isolation Forest, One-Class SVM |
| Strong temporal dependencies | LSTM Autoencoder, Transformer |
| Need probabilistic interpretation | VAE, Gaussian Mixture Model |
| Real-time detection | Sliding window statistics, EWMA |

### Algorithm Design Questions

**Q9: Design a multi-scale time series anomaly detection system**

```python
class MultiScaleAnomalyDetector:
    """Multi-scale anomaly detector"""

    def __init__(self, scales=[1, 5, 15, 60]):
        """
        Args:
            scales: Different time scales (minutes)
        """
        self.scales = scales
        self.detectors = {}

    def aggregate_data(self, data, scale):
        """Aggregate data by time scale"""
        # Implement data aggregation logic
        pass

    def detect(self, data):
        """Multi-scale detection"""
        all_anomalies = []

        for scale in self.scales:
            # 1. Aggregate data
            aggregated = self.aggregate_data(data, scale)

            # 2. Detect at this scale
            detector = self.detectors.get(scale)
            anomalies = detector.detect(aggregated)

            # 3. Map back to original time points
            all_anomalies.append(self.map_to_original(anomalies, scale))

        # 4. Combine multi-scale results
        return self.combine_results(all_anomalies)
```

**Q10: How to handle multivariate time series anomaly detection?**

1. **Independent detection**: Detect each variable separately, then aggregate
2. **Joint detection**: Treat multiple variables as feature vectors, use multivariate methods (e.g., Isolation Forest)
3. **Correlation detection**: Monitor changes in correlations between variables
4. **Deep learning**: Use multivariate LSTM or Transformer

---

## Further Reading

### Recommended Resources

1. **Books**
   - "Outlier Analysis" - Charu C. Aggarwal
   - "Anomaly Detection: A Survey" - Varun Chandola et al.

2. **Papers**
   - "Isolation Forest" - Liu et al., 2008
   - "Deep Learning for Anomaly Detection: A Survey" - Chalapathy & Chawla, 2019
   - "LSTM-based Encoder-Decoder for Multi-sensor Anomaly Detection" - Malhotra et al., 2016

3. **Libraries**
   - PyOD: Python Outlier Detection library
   - Alibi Detect: Machine learning model monitoring
   - ADTK: Anomaly Detection Toolkit for time series

### Advanced Topics

- Online anomaly detection and stream data processing
- Graph neural network anomaly detection
- Anomaly detection in federated learning
- Explainable anomaly detection
- Self-supervised learning anomaly detection

---

After reading this, you should be able to:

1. Understand different types of anomalies and their characteristics
2. Master statistical methods, machine learning methods, and deep learning methods
3. Correctly evaluate anomaly detection model performance
4. Apply anomaly detection techniques in real projects
5. Confidently answer anomaly detection questions in interviews

Anomaly detection is a constantly evolving field with new methods and techniques emerging continuously. We recommend keeping up with the latest research and accumulating experience in practical projects.
