---
title: Model Monitoring
description: Production machine learning model monitoring system, including data drift detection, concept drift monitoring, performance tracking, and automated retraining triggers
track: datascience
section: deployment
difficulty: advanced
tags:
  - Model Monitoring
  - Data Drift
  - Concept Drift
  - MLOps
status: imported
origin: old/src/content/docs/datascience/model-monitoring.en.md
divergence: 0.491
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Production
  order: 44
  lastUpdated: 2026-01-07
---

## Overview

### Why Model Monitoring

After deploying a machine learning model to production, model performance can degrade over time for the following reasons:

1. **Data Drift**: Changes in the distribution of input data
2. **Concept Drift**: Changes in the relationship between features and targets
3. **System Issues**: Data pipeline failures, feature computation errors
4. **External Changes**: Business environment changes, user behavior changes

### Core Monitoring Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Model Monitoring System                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Data Drift │  │   Concept   │  │ Performance │         │
│  │  Detection  │  │    Drift    │  │  Monitoring │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Anomaly   │  │    Alert    │  │   Auto      │         │
│  │  Detection  │  │   System    │  │  Retrain    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Drift Detection

### Kolmogorov-Smirnov Test

The KS test is used to compare whether two samples come from the same distribution.

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Optional
import pandas as pd

class DataDriftDetector:
    """Data drift detector"""
    
    def __init__(self, reference_data: pd.DataFrame):
        """
        Initialize drift detector
        
        Args:
            reference_data: Reference dataset (training data distribution)
        """
        self.reference_data = reference_data
        self.reference_stats = self._compute_statistics(reference_data)
    
    def _compute_statistics(self, data: pd.DataFrame) -> Dict:
        """Compute statistical characteristics of data"""
        stats_dict = {}
        for column in data.columns:
            if data[column].dtype in ['float64', 'int64']:
                stats_dict[column] = {
                    'mean': data[column].mean(),
                    'std': data[column].std(),
                    'min': data[column].min(),
                    'max': data[column].max(),
                    'median': data[column].median(),
                    'q25': data[column].quantile(0.25),
                    'q75': data[column].quantile(0.75),
                }
        return stats_dict
    
    def ks_test(
        self, 
        current_data: pd.DataFrame,
        significance_level: float = 0.05
    ) -> Dict[str, Dict]:
        """
        Kolmogorov-Smirnov test
        
        Args:
            current_data: Current data
            significance_level: Significance level
            
        Returns:
            KS test results for each feature
        """
        results = {}
        
        for column in self.reference_data.columns:
            if column not in current_data.columns:
                continue
                
            if self.reference_data[column].dtype in ['float64', 'int64']:
                # Execute KS test
                statistic, p_value = stats.ks_2samp(
                    self.reference_data[column].dropna(),
                    current_data[column].dropna()
                )
                
                drift_detected = p_value < significance_level
                
                results[column] = {
                    'ks_statistic': statistic,
                    'p_value': p_value,
                    'drift_detected': drift_detected,
                    'severity': self._classify_severity(statistic)
                }
        
        return results
    
    def _classify_severity(self, ks_statistic: float) -> str:
        """Classify drift severity"""
        if ks_statistic < 0.1:
            return 'low'
        elif ks_statistic < 0.2:
            return 'medium'
        elif ks_statistic < 0.3:
            return 'high'
        else:
            return 'critical'
```

### Population Stability Index (PSI)

PSI is a commonly used metric for measuring distribution changes.

```python
class PSICalculator:
    """Population Stability Index calculator"""
    
    def __init__(self, n_bins: int = 10):
        """
        Initialize PSI calculator
        
        Args:
            n_bins: Number of bins
        """
        self.n_bins = n_bins
        self.bin_edges = None
    
    def fit(self, reference_data: np.ndarray) -> 'PSICalculator':
        """
        Fit on reference data (determine bin boundaries)
        
        Args:
            reference_data: Reference data
        """
        # Use quantile-based binning
        percentiles = np.linspace(0, 100, self.n_bins + 1)
        self.bin_edges = np.percentile(reference_data, percentiles)
        # Handle duplicate edges
        self.bin_edges = np.unique(self.bin_edges)
        return self
    
    def calculate(
        self, 
        reference_data: np.ndarray,
        current_data: np.ndarray,
        epsilon: float = 1e-10
    ) -> Dict:
        """
        Calculate PSI
        
        Args:
            reference_data: Reference data
            current_data: Current data
            epsilon: Small value to avoid division by zero
            
        Returns:
            PSI calculation results
        """
        if self.bin_edges is None:
            self.fit(reference_data)
        
        # Calculate distribution for each bin
        ref_counts, _ = np.histogram(reference_data, bins=self.bin_edges)
        cur_counts, _ = np.histogram(current_data, bins=self.bin_edges)
        
        # Convert to ratios
        ref_pct = ref_counts / len(reference_data) + epsilon
        cur_pct = cur_counts / len(current_data) + epsilon
        
        # Calculate PSI
        psi_values = (cur_pct - ref_pct) * np.log(cur_pct / ref_pct)
        psi_total = np.sum(psi_values)
        
        return {
            'psi': psi_total,
            'psi_per_bin': psi_values.tolist(),
            'reference_distribution': ref_pct.tolist(),
            'current_distribution': cur_pct.tolist(),
            'drift_level': self._interpret_psi(psi_total)
        }
    
    def _interpret_psi(self, psi: float) -> str:
        """Interpret PSI value"""
        if psi < 0.1:
            return 'no_drift'  # No significant change
        elif psi < 0.25:
            return 'moderate_drift'  # Moderate change, needs attention
        else:
            return 'significant_drift'  # Significant change, action required


class MultiFeatureDriftDetector:
    """Multi-feature drift detector"""
    
    def __init__(
        self,
        reference_data: pd.DataFrame,
        numerical_features: List[str],
        categorical_features: List[str]
    ):
        self.reference_data = reference_data
        self.numerical_features = numerical_features
        self.categorical_features = categorical_features
        
        # Initialize numerical feature detectors
        self.psi_calculators = {}
        for feature in numerical_features:
            calc = PSICalculator(n_bins=10)
            calc.fit(reference_data[feature].values)
            self.psi_calculators[feature] = calc
        
        # Calculate reference distribution for categorical features
        self.categorical_distributions = {}
        for feature in categorical_features:
            self.categorical_distributions[feature] = (
                reference_data[feature].value_counts(normalize=True).to_dict()
            )
    
    def detect_drift(
        self,
        current_data: pd.DataFrame,
        psi_threshold: float = 0.25,
        chi2_significance: float = 0.05
    ) -> Dict:
        """
        Detect data drift
        
        Args:
            current_data: Current data
            psi_threshold: PSI threshold
            chi2_significance: Chi-square test significance level
            
        Returns:
            Drift detection results
        """
        results = {
            'numerical_drift': {},
            'categorical_drift': {},
            'overall_drift': False,
            'drift_summary': {}
        }
        
        # Check numerical features
        numerical_drifts = 0
        for feature in self.numerical_features:
            psi_result = self.psi_calculators[feature].calculate(
                self.reference_data[feature].values,
                current_data[feature].values
            )
            results['numerical_drift'][feature] = psi_result
            if psi_result['psi'] >= psi_threshold:
                numerical_drifts += 1
        
        # Check categorical features
        categorical_drifts = 0
        for feature in self.categorical_features:
            chi2_result = self._chi2_test(
                feature,
                current_data,
                chi2_significance
            )
            results['categorical_drift'][feature] = chi2_result
            if chi2_result['drift_detected']:
                categorical_drifts += 1
        
        # Overall summary
        total_features = len(self.numerical_features) + len(self.categorical_features)
        total_drifts = numerical_drifts + categorical_drifts
        drift_ratio = total_drifts / total_features if total_features > 0 else 0
        
        results['drift_summary'] = {
            'total_features': total_features,
            'drifted_features': total_drifts,
            'drift_ratio': drift_ratio,
            'numerical_drifts': numerical_drifts,
            'categorical_drifts': categorical_drifts
        }
        
        # Determine overall drift
        results['overall_drift'] = drift_ratio > 0.3  # >30% of features have drifted
        
        return results
    
    def _chi2_test(
        self,
        feature: str,
        current_data: pd.DataFrame,
        significance: float
    ) -> Dict:
        """Chi-square test for categorical features"""
        ref_dist = self.categorical_distributions[feature]
        cur_dist = current_data[feature].value_counts(normalize=True).to_dict()
        
        # Get all categories
        all_categories = set(ref_dist.keys()) | set(cur_dist.keys())
        
        # Construct frequency arrays
        ref_freq = np.array([ref_dist.get(cat, 0) for cat in all_categories])
        cur_freq = np.array([cur_dist.get(cat, 0) for cat in all_categories])
        
        # Avoid zero values
        ref_freq = ref_freq + 1e-10
        cur_freq = cur_freq + 1e-10
        
        # Chi-square test
        n_current = len(current_data)
        expected = ref_freq * n_current
        observed = cur_freq * n_current
        
        chi2_stat, p_value = stats.chisquare(observed, expected)
        
        return {
            'chi2_statistic': chi2_stat,
            'p_value': p_value,
            'drift_detected': p_value < significance,
            'reference_distribution': ref_dist,
            'current_distribution': cur_dist
        }
```

## Concept Drift Detection

### Performance Monitoring

```python
from datetime import datetime, timedelta
from collections import deque
import json

class ConceptDriftMonitor:
    """Concept drift monitor"""
    
    def __init__(
        self,
        baseline_metrics: Dict[str, float],
        window_size: int = 1000,
        alert_threshold: float = 0.1
    ):
        """
        Initialize concept drift monitor
        
        Args:
            baseline_metrics: Baseline performance metrics
            window_size: Sliding window size
            alert_threshold: Alert threshold (ratio of performance degradation)
        """
        self.baseline_metrics = baseline_metrics
        self.window_size = window_size
        self.alert_threshold = alert_threshold
        
        # Sliding window for storing recent predictions and actual values
        self.predictions = deque(maxlen=window_size)
        self.actuals = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)
        
        # Metric history
        self.metric_history = []
    
    def add_sample(
        self,
        prediction: float,
        actual: float,
        timestamp: Optional[datetime] = None
    ):
        """Add new sample"""
        self.predictions.append(prediction)
        self.actuals.append(actual)
        self.timestamps.append(timestamp or datetime.now())
    
    def compute_metrics(self) -> Dict[str, float]:
        """Compute current performance metrics"""
        if len(self.predictions) < 100:  # Need sufficient samples
            return {}
        
        preds = np.array(self.predictions)
        acts = np.array(self.actuals)
        
        # Classification metrics
        if self._is_classification():
            metrics = self._compute_classification_metrics(preds, acts)
        else:
            metrics = self._compute_regression_metrics(preds, acts)
        
        return metrics
    
    def _is_classification(self) -> bool:
        """Determine if classification task"""
        unique_actuals = np.unique(list(self.actuals))
        return len(unique_actuals) <= 10  # Simple heuristic
    
    def _compute_classification_metrics(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ) -> Dict[str, float]:
        """Compute classification metrics"""
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
        
        # Threshold binary predictions
        binary_preds = (predictions >= 0.5).astype(int)
        
        metrics = {
            'accuracy': accuracy_score(actuals, binary_preds),
            'precision': precision_score(actuals, binary_preds, zero_division=0),
            'recall': recall_score(actuals, binary_preds, zero_division=0),
            'f1': f1_score(actuals, binary_preds, zero_division=0),
        }
        
        # AUC (requires probability predictions)
        try:
            metrics['auc'] = roc_auc_score(actuals, predictions)
        except:
            pass
        
        return metrics
    
    def _compute_regression_metrics(
        self,
        predictions: np.ndarray,
        actuals: np.ndarray
    ) -> Dict[str, float]:
        """Compute regression metrics"""
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        
        return {
            'mse': mean_squared_error(actuals, predictions),
            'rmse': np.sqrt(mean_squared_error(actuals, predictions)),
            'mae': mean_absolute_error(actuals, predictions),
            'r2': r2_score(actuals, predictions)
        }
    
    def check_drift(self) -> Dict:
        """Check for concept drift"""
        current_metrics = self.compute_metrics()
        if not current_metrics:
            return {'status': 'insufficient_data'}
        
        drift_detected = False
        degradation_details = {}
        
        for metric_name, baseline_value in self.baseline_metrics.items():
            if metric_name not in current_metrics:
                continue
            
            current_value = current_metrics[metric_name]
            
            # Calculate degradation ratio (considering whether higher or lower is better for different metrics)
            if metric_name in ['mse', 'rmse', 'mae']:  # Lower is better
                degradation = (current_value - baseline_value) / baseline_value
            else:  # Higher is better
                degradation = (baseline_value - current_value) / baseline_value
            
            is_degraded = degradation > self.alert_threshold
            
            degradation_details[metric_name] = {
                'baseline': baseline_value,
                'current': current_value,
                'degradation_ratio': degradation,
                'is_degraded': is_degraded
            }
            
            if is_degraded:
                drift_detected = True
        
        # Record history
        self.metric_history.append({
            'timestamp': datetime.now().isoformat(),
            'metrics': current_metrics,
            'drift_detected': drift_detected
        })
        
        return {
            'status': 'drift_detected' if drift_detected else 'normal',
            'current_metrics': current_metrics,
            'degradation_details': degradation_details,
            'window_size': len(self.predictions)
        }


class PredictionDistributionMonitor:
    """Prediction distribution monitor"""
    
    def __init__(self, reference_predictions: np.ndarray):
        """
        Initialize prediction distribution monitor
        
        Args:
            reference_predictions: Reference prediction distribution
        """
        self.reference_predictions = reference_predictions
        self.reference_stats = {
            'mean': np.mean(reference_predictions),
            'std': np.std(reference_predictions),
            'median': np.median(reference_predictions),
            'q25': np.percentile(reference_predictions, 25),
            'q75': np.percentile(reference_predictions, 75)
        }
        self.psi_calculator = PSICalculator(n_bins=10)
        self.psi_calculator.fit(reference_predictions)
    
    def monitor(self, current_predictions: np.ndarray) -> Dict:
        """
        Monitor prediction distribution
        
        Args:
            current_predictions: Current predictions
            
        Returns:
            Monitoring results
        """
        current_stats = {
            'mean': np.mean(current_predictions),
            'std': np.std(current_predictions),
            'median': np.median(current_predictions),
            'q25': np.percentile(current_predictions, 25),
            'q75': np.percentile(current_predictions, 75)
        }
        
        # PSI check
        psi_result = self.psi_calculator.calculate(
            self.reference_predictions,
            current_predictions
        )
        
        # Statistics comparison
        stats_comparison = {}
        for stat_name in self.reference_stats:
            ref_val = self.reference_stats[stat_name]
            cur_val = current_stats[stat_name]
            change = (cur_val - ref_val) / ref_val if ref_val != 0 else 0
            stats_comparison[stat_name] = {
                'reference': ref_val,
                'current': cur_val,
                'change_ratio': change
            }
        
        return {
            'psi': psi_result,
            'statistics_comparison': stats_comparison,
            'alert': psi_result['psi'] >= 0.1
        }
```

## Anomaly Detection

### Input Anomaly Detection

```python
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

class InputAnomalyDetector:
    """Input data anomaly detector"""
    
    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100
    ):
        """
        Initialize anomaly detector
        
        Args:
            contamination: Expected ratio of anomalies
            n_estimators: Number of trees in Isolation Forest
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = None
    
    def fit(self, reference_data: pd.DataFrame) -> 'InputAnomalyDetector':
        """
        Fit anomaly detector
        
        Args:
            reference_data: Reference data (normal data)
        """
        self.feature_names = reference_data.columns.tolist()
        
        # Standardize data
        scaled_data = self.scaler.fit_transform(reference_data)
        
        # Train Isolation Forest
        self.model = IsolationForest(
            contamination=self.contamination,
            n_estimators=self.n_estimators,
            random_state=42
        )
        self.model.fit(scaled_data)
        
        return self
    
    def detect(self, data: pd.DataFrame) -> Dict:
        """
        Detect anomalies
        
        Args:
            data: Data to check
            
        Returns:
            Anomaly detection results
        """
        if self.model is None:
            raise ValueError("Detector not fitted")
        
        # Standardize data
        scaled_data = self.scaler.transform(data)
        
        # Predict anomalies
        predictions = self.model.predict(scaled_data)  # 1: normal, -1: anomaly
        scores = self.model.decision_function(scaled_data)  # Anomaly score
        
        anomaly_mask = predictions == -1
        
        return {
            'predictions': predictions.tolist(),
            'anomaly_scores': scores.tolist(),
            'n_anomalies': int(anomaly_mask.sum()),
            'anomaly_ratio': float(anomaly_mask.mean()),
            'anomaly_indices': np.where(anomaly_mask)[0].tolist()
        }
    
    def explain_anomaly(
        self,
        data_point: pd.Series,
        reference_data: pd.DataFrame
    ) -> Dict:
        """
        Explain why a sample is an anomaly
        
        Args:
            data_point: Anomalous sample
            reference_data: Reference data
            
        Returns:
            Anomaly explanation
        """
        explanations = {}
        
        for feature in self.feature_names:
            value = data_point[feature]
            ref_mean = reference_data[feature].mean()
            ref_std = reference_data[feature].std()
            
            # Calculate z-score
            z_score = (value - ref_mean) / ref_std if ref_std > 0 else 0
            
            # Calculate percentile
            percentile = stats.percentileofscore(
                reference_data[feature],
                value
            )
            
            explanations[feature] = {
                'value': value,
                'reference_mean': ref_mean,
                'reference_std': ref_std,
                'z_score': z_score,
                'percentile': percentile,
                'is_outlier': abs(z_score) > 3
            }
        
        # Sort by degree of anomaly
        sorted_features = sorted(
            explanations.items(),
            key=lambda x: abs(x[1]['z_score']),
            reverse=True
        )
        
        return {
            'feature_explanations': dict(sorted_features),
            'top_anomaly_features': [f[0] for f in sorted_features[:5]]
        }


class DataQualityMonitor:
    """Data quality monitor"""
    
    def __init__(self, reference_schema: Dict):
        """
        Initialize data quality monitor
        
        Args:
            reference_schema: Reference data schema
        """
        self.reference_schema = reference_schema
    
    def check_quality(self, data: pd.DataFrame) -> Dict:
        """
        Check data quality
        
        Args:
            data: Data to check
            
        Returns:
            Quality check results
        """
        issues = []
        
        # Check missing values
        missing_check = self._check_missing_values(data)
        if missing_check['has_issues']:
            issues.extend(missing_check['issues'])
        
        # Check data types
        type_check = self._check_data_types(data)
        if type_check['has_issues']:
            issues.extend(type_check['issues'])
        
        # Check value ranges
        range_check = self._check_value_ranges(data)
        if range_check['has_issues']:
            issues.extend(range_check['issues'])
        
        # Check schema consistency
        schema_check = self._check_schema(data)
        if schema_check['has_issues']:
            issues.extend(schema_check['issues'])
        
        return {
            'quality_score': 1 - len(issues) / (len(data.columns) * 4),
            'issues': issues,
            'has_critical_issues': any(i['severity'] == 'critical' for i in issues)
        }
    
    def _check_missing_values(self, data: pd.DataFrame) -> Dict:
        """Check missing values"""
        issues = []
        
        for column in data.columns:
            missing_ratio = data[column].isna().mean()
            
            if missing_ratio > 0:
                severity = 'critical' if missing_ratio > 0.5 else 'warning' if missing_ratio > 0.1 else 'info'
                issues.append({
                    'type': 'missing_values',
                    'column': column,
                    'missing_ratio': missing_ratio,
                    'severity': severity,
                    'message': f"Column {column} has {missing_ratio:.2%} missing values"
                })
        
        return {'has_issues': len(issues) > 0, 'issues': issues}
    
    def _check_data_types(self, data: pd.DataFrame) -> Dict:
        """Check data types"""
        issues = []
        
        for column, expected_type in self.reference_schema.get('dtypes', {}).items():
            if column in data.columns:
                actual_type = str(data[column].dtype)
                if actual_type != expected_type:
                    issues.append({
                        'type': 'type_mismatch',
                        'column': column,
                        'expected_type': expected_type,
                        'actual_type': actual_type,
                        'severity': 'warning',
                        'message': f"Column {column} type mismatch: expected {expected_type}, got {actual_type}"
                    })
        
        return {'has_issues': len(issues) > 0, 'issues': issues}
    
    def _check_value_ranges(self, data: pd.DataFrame) -> Dict:
        """Check value ranges"""
        issues = []
        
        for column, range_config in self.reference_schema.get('ranges', {}).items():
            if column not in data.columns:
                continue
            
            min_val = range_config.get('min')
            max_val = range_config.get('max')
            
            if min_val is not None:
                below_min = (data[column] < min_val).sum()
                if below_min > 0:
                    issues.append({
                        'type': 'value_below_min',
                        'column': column,
                        'count': int(below_min),
                        'min_value': min_val,
                        'severity': 'warning',
                        'message': f"Column {column} has {below_min} values below minimum {min_val}"
                    })
            
            if max_val is not None:
                above_max = (data[column] > max_val).sum()
                if above_max > 0:
                    issues.append({
                        'type': 'value_above_max',
                        'column': column,
                        'count': int(above_max),
                        'max_value': max_val,
                        'severity': 'warning',
                        'message': f"Column {column} has {above_max} values above maximum {max_val}"
                    })
        
        return {'has_issues': len(issues) > 0, 'issues': issues}
    
    def _check_schema(self, data: pd.DataFrame) -> Dict:
        """Check schema consistency"""
        issues = []
        
        expected_columns = set(self.reference_schema.get('columns', []))
        actual_columns = set(data.columns)
        
        # Check for missing columns
        missing_columns = expected_columns - actual_columns
        if missing_columns:
            issues.append({
                'type': 'missing_columns',
                'columns': list(missing_columns),
                'severity': 'critical',
                'message': f"Missing columns: {missing_columns}"
            })
        
        # Check for extra columns
        extra_columns = actual_columns - expected_columns
        if extra_columns:
            issues.append({
                'type': 'extra_columns',
                'columns': list(extra_columns),
                'severity': 'info',
                'message': f"Extra columns: {extra_columns}"
            })
        
        return {'has_issues': len(issues) > 0, 'issues': issues}
```

## Monitoring Tools Integration

### Evidently AI Integration

```python
# Using Evidently AI for monitoring
try:
    from evidently import ColumnMapping
    from evidently.report import Report
    from evidently.metric_preset import DataDriftPreset, DataQualityPreset
    from evidently.metrics import *
    EVIDENTLY_AVAILABLE = True
except ImportError:
    EVIDENTLY_AVAILABLE = False

class EvidentlyMonitor:
    """Evidently AI-based monitor"""
    
    def __init__(
        self,
        reference_data: pd.DataFrame,
        column_mapping: Optional[Dict] = None
    ):
        """
        Initialize Evidently monitor
        
        Args:
            reference_data: Reference dataset
            column_mapping: Column mapping configuration
        """
        if not EVIDENTLY_AVAILABLE:
            raise ImportError("Evidently AI not installed")
        
        self.reference_data = reference_data
        
        # Set column mapping
        self.column_mapping = ColumnMapping()
        if column_mapping:
            self.column_mapping.target = column_mapping.get('target')
            self.column_mapping.prediction = column_mapping.get('prediction')
            self.column_mapping.numerical_features = column_mapping.get('numerical_features')
            self.column_mapping.categorical_features = column_mapping.get('categorical_features')
    
    def generate_drift_report(
        self,
        current_data: pd.DataFrame,
        output_path: Optional[str] = None
    ) -> Dict:
        """
        Generate data drift report
        
        Args:
            current_data: Current data
            output_path: Report output path
            
        Returns:
            Report results
        """
        report = Report(metrics=[
            DataDriftPreset(),
        ])
        
        report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )
        
        if output_path:
            report.save_html(output_path)
        
        # Extract key metrics
        report_dict = report.as_dict()
        
        return {
            'drift_detected': self._extract_drift_status(report_dict),
            'drift_by_column': self._extract_column_drift(report_dict),
            'report_path': output_path
        }
    
    def generate_quality_report(
        self,
        current_data: pd.DataFrame,
        output_path: Optional[str] = None
    ) -> Dict:
        """Generate data quality report"""
        report = Report(metrics=[
            DataQualityPreset(),
        ])
        
        report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )
        
        if output_path:
            report.save_html(output_path)
        
        return report.as_dict()
    
    def _extract_drift_status(self, report_dict: Dict) -> bool:
        """Extract overall drift status"""
        try:
            metrics = report_dict.get('metrics', [])
            for metric in metrics:
                if 'dataset_drift' in str(metric):
                    return metric.get('result', {}).get('dataset_drift', False)
        except:
            pass
        return False
    
    def _extract_column_drift(self, report_dict: Dict) -> Dict:
        """Extract column-level drift status"""
        column_drift = {}
        try:
            metrics = report_dict.get('metrics', [])
            for metric in metrics:
                result = metric.get('result', {})
                drift_by_columns = result.get('drift_by_columns', {})
                for col, info in drift_by_columns.items():
                    column_drift[col] = {
                        'drift_detected': info.get('drift_detected', False),
                        'drift_score': info.get('drift_score', 0)
                    }
        except:
            pass
        return column_drift
```

### Arize AI Integration

```python
# Using Arize AI for monitoring
try:
    from arize.api import Client
    from arize.utils.types import ModelTypes, Environments, Schema
    ARIZE_AVAILABLE = True
except ImportError:
    ARIZE_AVAILABLE = False

class ArizeMonitor:
    """Arize AI-based monitor"""
    
    def __init__(
        self,
        api_key: str,
        space_key: str,
        model_id: str,
        model_version: str
    ):
        """
        Initialize Arize monitor
        
        Args:
            api_key: Arize API key
            space_key: Space key
            model_id: Model ID
            model_version: Model version
        """
        if not ARIZE_AVAILABLE:
            raise ImportError("Arize SDK not installed")
        
        self.client = Client(space_key=space_key, api_key=api_key)
        self.model_id = model_id
        self.model_version = model_version
    
    def log_predictions(
        self,
        prediction_ids: List[str],
        features: pd.DataFrame,
        predictions: np.ndarray,
        actuals: Optional[np.ndarray] = None,
        timestamps: Optional[List[datetime]] = None
    ) -> Dict:
        """
        Log predictions to Arize
        
        Args:
            prediction_ids: Prediction ID list
            features: Feature data
            predictions: Predictions
            actuals: Actual values (optional)
            timestamps: Timestamps (optional)
            
        Returns:
            Logging results
        """
        schema = Schema(
            prediction_id_column_name='prediction_id',
            feature_column_names=features.columns.tolist(),
            prediction_label_column_name='prediction',
            actual_label_column_name='actual' if actuals is not None else None,
            timestamp_column_name='timestamp' if timestamps is not None else None
        )
        
        # Construct data
        data = features.copy()
        data['prediction_id'] = prediction_ids
        data['prediction'] = predictions
        
        if actuals is not None:
            data['actual'] = actuals
        
        if timestamps is not None:
            data['timestamp'] = timestamps
        
        # Send to Arize
        response = self.client.log(
            dataframe=data,
            schema=schema,
            model_id=self.model_id,
            model_version=self.model_version,
            model_type=ModelTypes.BINARY_CLASSIFICATION,
            environment=Environments.PRODUCTION
        )
        
        return {
            'status': 'success' if response.status_code == 200 else 'failed',
            'records_logged': len(data)
        }
```

## Monitoring Dashboard and Alerting

### Monitoring Dashboard Configuration

```python
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable
import smtplib
from email.mime.text import MIMEText
import requests

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class AlertRule:
    """Alert rule"""
    name: str
    metric_name: str
    condition: Callable[[float], bool]
    severity: AlertSeverity
    message_template: str
    cooldown_minutes: int = 30

@dataclass
class MonitoringConfig:
    """Monitoring configuration"""
    model_name: str
    model_version: str
    
    # Drift thresholds
    psi_warning_threshold: float = 0.1
    psi_critical_threshold: float = 0.25
    ks_significance_level: float = 0.05
    
    # Performance thresholds
    performance_degradation_threshold: float = 0.1
    
    # Monitoring frequency
    monitoring_interval_minutes: int = 60
    
    # Alert configuration
    alert_rules: List[AlertRule] = field(default_factory=list)
    
    # Storage configuration
    metrics_storage_path: str = "./monitoring_metrics"


class AlertManager:
    """Alert manager"""
    
    def __init__(self, config: MonitoringConfig):
        """
        Initialize alert manager
        
        Args:
            config: Monitoring configuration
        """
        self.config = config
        self.alert_history = []
        self.last_alert_time = {}  # Record last alert time for each rule
    
    def check_and_alert(self, metrics: Dict) -> List[Dict]:
        """
        Check metrics and send alerts
        
        Args:
            metrics: Current metrics
            
        Returns:
            List of triggered alerts
        """
        triggered_alerts = []
        current_time = datetime.now()
        
        for rule in self.config.alert_rules:
            # Check cooldown
            last_alert = self.last_alert_time.get(rule.name)
            if last_alert:
                cooldown_end = last_alert + timedelta(minutes=rule.cooldown_minutes)
                if current_time < cooldown_end:
                    continue
            
            # Check condition
            metric_value = metrics.get(rule.metric_name)
            if metric_value is not None and rule.condition(metric_value):
                alert = {
                    'rule_name': rule.name,
                    'severity': rule.severity.value,
                    'metric_name': rule.metric_name,
                    'metric_value': metric_value,
                    'message': rule.message_template.format(
                        metric_value=metric_value,
                        model_name=self.config.model_name,
                        model_version=self.config.model_version
                    ),
                    'timestamp': current_time.isoformat()
                }
                
                triggered_alerts.append(alert)
                self.alert_history.append(alert)
                self.last_alert_time[rule.name] = current_time
        
        return triggered_alerts
    
    def send_alerts(
        self,
        alerts: List[Dict],
        channels: List[str] = ['email', 'slack']
    ):
        """
        Send alerts
        
        Args:
            alerts: Alert list
            channels: Notification channels
        """
        for alert in alerts:
            for channel in channels:
                if channel == 'email':
                    self._send_email_alert(alert)
                elif channel == 'slack':
                    self._send_slack_alert(alert)
                elif channel == 'pagerduty':
                    self._send_pagerduty_alert(alert)
    
    def _send_email_alert(self, alert: Dict):
        """Send email alert"""
        # Example implementation
        print(f"[EMAIL ALERT] {alert['severity'].upper()}: {alert['message']}")
    
    def _send_slack_alert(self, alert: Dict):
        """Send Slack alert"""
        # Example implementation
        print(f"[SLACK ALERT] {alert['severity'].upper()}: {alert['message']}")
    
    def _send_pagerduty_alert(self, alert: Dict):
        """Send PagerDuty alert"""
        # Example implementation
        print(f"[PAGERDUTY ALERT] {alert['severity'].upper()}: {alert['message']}")


# Create default alert rules
def create_default_alert_rules() -> List[AlertRule]:
    """Create default alert rules"""
    return [
        AlertRule(
            name="high_psi",
            metric_name="psi",
            condition=lambda x: x >= 0.25,
            severity=AlertSeverity.CRITICAL,
            message_template="[{model_name}] Data drift detected: PSI = {metric_value:.3f}",
            cooldown_minutes=60
        ),
        AlertRule(
            name="moderate_psi",
            metric_name="psi",
            condition=lambda x: 0.1 <= x < 0.25,
            severity=AlertSeverity.WARNING,
            message_template="[{model_name}] Data drift warning: PSI = {metric_value:.3f}",
            cooldown_minutes=120
        ),
        AlertRule(
            name="accuracy_drop",
            metric_name="accuracy",
            condition=lambda x: x < 0.85,
            severity=AlertSeverity.CRITICAL,
            message_template="[{model_name}] Accuracy dropped to {metric_value:.3f}",
            cooldown_minutes=30
        ),
        AlertRule(
            name="high_anomaly_rate",
            metric_name="anomaly_ratio",
            condition=lambda x: x > 0.15,
            severity=AlertSeverity.WARNING,
            message_template="[{model_name}] Anomaly rate increased: {metric_value:.2%}",
            cooldown_minutes=60
        )
    ]
```

## Retraining Triggers

### Automated Retraining Decision

```python
from enum import Enum
from dataclasses import dataclass

class RetrainDecision(Enum):
    NO_ACTION = "no_action"
    MONITOR_CLOSELY = "monitor_closely"
    SCHEDULE_RETRAIN = "schedule_retrain"
    IMMEDIATE_RETRAIN = "immediate_retrain"

@dataclass
class RetrainConfig:
    """Retraining configuration"""
    # Performance thresholds
    accuracy_min_threshold: float = 0.80
    auc_min_threshold: float = 0.75
    
    # Drift thresholds
    psi_retrain_threshold: float = 0.25
    drift_feature_ratio_threshold: float = 0.3
    
    # Time-based triggers
    max_days_without_retrain: int = 30
    
    # Data requirements
    min_samples_for_retrain: int = 10000


class RetrainTrigger:
    """Retraining trigger"""
    
    def __init__(self, config: RetrainConfig):
        """
        Initialize retraining trigger
        
        Args:
            config: Retraining configuration
        """
        self.config = config
        self.last_retrain_date = None
        self.decision_history = []
    
    def evaluate(
        self,
        performance_metrics: Dict[str, float],
        drift_metrics: Dict,
        data_quality_metrics: Dict,
        available_samples: int
    ) -> Dict:
        """
        Evaluate whether retraining is needed
        
        Args:
            performance_metrics: Performance metrics
            drift_metrics: Drift metrics
            data_quality_metrics: Data quality metrics
            available_samples: Available sample count
            
        Returns:
            Evaluation results
        """
        reasons = []
        scores = {
            'performance_score': 0,
            'drift_score': 0,
            'time_score': 0,
            'quality_score': 0
        }
        
        # 1. Evaluate performance degradation
        performance_result = self._evaluate_performance(performance_metrics)
        scores['performance_score'] = performance_result['score']
        reasons.extend(performance_result['reasons'])
        
        # 2. Evaluate data drift
        drift_result = self._evaluate_drift(drift_metrics)
        scores['drift_score'] = drift_result['score']
        reasons.extend(drift_result['reasons'])
        
        # 3. Evaluate time since last retraining
        time_result = self._evaluate_time()
        scores['time_score'] = time_result['score']
        reasons.extend(time_result['reasons'])
        
        # 4. Evaluate data quality
        quality_result = self._evaluate_quality(data_quality_metrics)
        scores['quality_score'] = quality_result['score']
        reasons.extend(quality_result['reasons'])
        
        # Calculate total score and make decision
        total_score = sum(scores.values())
        decision = self._make_decision(total_score, scores, available_samples)
        
        result = {
            'decision': decision.value,
            'scores': scores,
            'total_score': total_score,
            'reasons': reasons,
            'timestamp': datetime.now().isoformat()
        }
        
        self.decision_history.append(result)
        
        return result
    
    def _evaluate_performance(self, metrics: Dict[str, float]) -> Dict:
        """Evaluate performance metrics"""
        score = 0
        reasons = []
        
        accuracy = metrics.get('accuracy', 1.0)
        if accuracy < self.config.accuracy_min_threshold:
            score += 3
            reasons.append(f"Accuracy below threshold: {accuracy:.3f} < {self.config.accuracy_min_threshold}")
        elif accuracy < self.config.accuracy_min_threshold + 0.05:
            score += 1
            reasons.append(f"Accuracy approaching threshold: {accuracy:.3f}")
        
        auc = metrics.get('auc', 1.0)
        if auc < self.config.auc_min_threshold:
            score += 3
            reasons.append(f"AUC below threshold: {auc:.3f} < {self.config.auc_min_threshold}")
        
        return {'score': score, 'reasons': reasons}
    
    def _evaluate_drift(self, drift_metrics: Dict) -> Dict:
        """Evaluate drift metrics"""
        score = 0
        reasons = []
        
        # Check overall PSI
        psi = drift_metrics.get('overall_psi', 0)
        if psi >= self.config.psi_retrain_threshold:
            score += 3
            reasons.append(f"Significant data drift detected: PSI = {psi:.3f}")
        elif psi >= 0.1:
            score += 1
            reasons.append(f"Moderate data drift detected: PSI = {psi:.3f}")
        
        # Check drifted feature ratio
        drift_summary = drift_metrics.get('drift_summary', {})
        drift_ratio = drift_summary.get('drift_ratio', 0)
        if drift_ratio > self.config.drift_feature_ratio_threshold:
            score += 2
            reasons.append(f"Multiple features drifted: {drift_ratio:.1%}")
        
        return {'score': score, 'reasons': reasons}
    
    def _evaluate_time(self) -> Dict:
        """Evaluate time since last retraining"""
        score = 0
        reasons = []
        
        if self.last_retrain_date:
            days_since_retrain = (datetime.now() - self.last_retrain_date).days
            if days_since_retrain > self.config.max_days_without_retrain:
                score += 2
                reasons.append(f"Days since last retrain: {days_since_retrain} > {self.config.max_days_without_retrain}")
            elif days_since_retrain > self.config.max_days_without_retrain * 0.8:
                score += 1
                reasons.append(f"Approaching retraining deadline: {days_since_retrain} days")
        
        return {'score': score, 'reasons': reasons}
    
    def _evaluate_quality(self, quality_metrics: Dict) -> Dict:
        """Evaluate data quality"""
        score = 0
        reasons = []
        
        quality_score = quality_metrics.get('quality_score', 1.0)
        if quality_score < 0.8:
            score += 1
            reasons.append(f"Data quality issues detected: score = {quality_score:.2f}")
        
        if quality_metrics.get('has_critical_issues', False):
            score += 2
            reasons.append("Critical data quality issues exist")
        
        return {'score': score, 'reasons': reasons}
    
    def _make_decision(
        self,
        total_score: float,
        scores: Dict[str, float],
        available_samples: int
    ) -> RetrainDecision:
        """Make retraining decision"""
        # Check if sufficient data available
        if available_samples < self.config.min_samples_for_retrain:
            return RetrainDecision.MONITOR_CLOSELY
        
        # Immediate retraining
        if total_score >= 8 or scores['performance_score'] >= 5:
            return RetrainDecision.IMMEDIATE_RETRAIN
        
        # Schedule retraining
        if total_score >= 5:
            return RetrainDecision.SCHEDULE_RETRAIN
        
        # Close monitoring
        if total_score >= 2:
            return RetrainDecision.MONITOR_CLOSELY
        
        return RetrainDecision.NO_ACTION
    
    def record_retrain(self):
        """Record retraining event"""
        self.last_retrain_date = datetime.now()
```

## Complete Monitoring Pipeline

### Integration Example

```python
class ModelMonitoringPipeline:
    """Complete model monitoring pipeline"""
    
    def __init__(
        self,
        model_name: str,
        model_version: str,
        reference_data: pd.DataFrame,
        reference_predictions: np.ndarray,
        baseline_metrics: Dict[str, float],
        numerical_features: List[str],
        categorical_features: List[str]
    ):
        """
        Initialize monitoring pipeline
        
        Args:
            model_name: Model name
            model_version: Model version
            reference_data: Reference data
            reference_predictions: Reference predictions
            baseline_metrics: Baseline metrics
            numerical_features: Numerical feature list
            categorical_features: Categorical feature list
        """
        self.model_name = model_name
        self.model_version = model_version
        
        # Initialize monitoring components
        self.drift_detector = MultiFeatureDriftDetector(
            reference_data=reference_data,
            numerical_features=numerical_features,
            categorical_features=categorical_features
        )
        
        self.concept_monitor = ConceptDriftMonitor(
            baseline_metrics=baseline_metrics,
            window_size=1000
        )
        
        self.prediction_monitor = PredictionDistributionMonitor(
            reference_predictions=reference_predictions
        )
        
        self.anomaly_detector = InputAnomalyDetector()
        self.anomaly_detector.fit(reference_data[numerical_features])
        
        # Initialize alert manager
        config = MonitoringConfig(
            model_name=model_name,
            model_version=model_version,
            alert_rules=create_default_alert_rules()
        )
        self.alert_manager = AlertManager(config)
        
        # Initialize retraining trigger
        self.retrain_trigger = RetrainTrigger(RetrainConfig())
        
        # Store monitoring history
        self.monitoring_history = []
    
    def run_monitoring(
        self,
        current_data: pd.DataFrame,
        predictions: np.ndarray,
        actuals: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Run complete monitoring process
        
        Args:
            current_data: Current input data
            predictions: Current predictions
            actuals: Actual values (optional)
            
        Returns:
            Complete monitoring results
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'model_name': self.model_name,
            'model_version': self.model_version
        }
        
        # 1. Data drift detection
        drift_results = self.drift_detector.detect_drift(current_data)
        results['data_drift'] = drift_results
        
        # 2. Prediction distribution monitoring
        pred_dist_results = self.prediction_monitor.monitor(predictions)
        results['prediction_distribution'] = pred_dist_results
        
        # 3. Anomaly detection
        numerical_features = self.drift_detector.numerical_features
        anomaly_results = self.anomaly_detector.detect(
            current_data[numerical_features]
        )
        results['anomalies'] = anomaly_results
        
        # 4. Performance monitoring (if actuals available)
        if actuals is not None:
            for pred, actual in zip(predictions, actuals):
                self.concept_monitor.add_sample(pred, actual)
            
            concept_results = self.concept_monitor.check_drift()
            results['concept_drift'] = concept_results
        
        # 5. Generate alert metrics
        alert_metrics = self._extract_alert_metrics(results)
        
        # 6. Check alert rules
        alerts = self.alert_manager.check_and_alert(alert_metrics)
        if alerts:
            results['alerts'] = alerts
            self.alert_manager.send_alerts(alerts)
        
        # 7. Evaluate retraining
        retrain_result = self.retrain_trigger.evaluate(
            performance_metrics=results.get('concept_drift', {}).get('current_metrics', {}),
            drift_metrics={
                'overall_psi': pred_dist_results['psi']['psi'],
                'drift_summary': drift_results['drift_summary']
            },
            data_quality_metrics={'quality_score': 1.0},
            available_samples=len(current_data)
        )
        results['retrain_decision'] = retrain_result
        
        # Record history
        self.monitoring_history.append(results)
        
        return results
    
    def _extract_alert_metrics(self, results: Dict) -> Dict:
        """Extract metrics for alerting"""
        metrics = {}
        
        # PSI metric
        if 'prediction_distribution' in results:
            metrics['psi'] = results['prediction_distribution']['psi']['psi']
        
        # Performance metrics
        if 'concept_drift' in results:
            current_metrics = results['concept_drift'].get('current_metrics', {})
            metrics.update(current_metrics)
        
        # Anomaly rate
        if 'anomalies' in results:
            metrics['anomaly_ratio'] = results['anomalies']['anomaly_ratio']
        
        return metrics
    
    def get_monitoring_summary(self) -> Dict:
        """Get monitoring summary"""
        if not self.monitoring_history:
            return {}
        
        recent = self.monitoring_history[-1]
        
        return {
            'model_name': self.model_name,
            'model_version': self.model_version,
            'last_check': recent['timestamp'],
            'data_drift_detected': recent.get('data_drift', {}).get('overall_drift', False),
            'prediction_drift_detected': recent.get('prediction_distribution', {}).get('alert', False),
            'anomaly_ratio': recent.get('anomalies', {}).get('anomaly_ratio', 0),
            'retrain_decision': recent.get('retrain_decision', {}).get('decision', 'unknown'),
            'total_checks': len(self.monitoring_history)
        }


# Usage example
def run_monitoring_demo():
    """Run monitoring demo"""
    np.random.seed(42)
    
    # Create sample data
    n_samples = 1000
    reference_data = pd.DataFrame({
        'feature_1': np.random.normal(0, 1, n_samples),
        'feature_2': np.random.normal(5, 2, n_samples),
        'feature_3': np.random.exponential(2, n_samples),
        'category': np.random.choice(['A', 'B', 'C'], n_samples)
    })
    
    # Simulate reference predictions
    reference_predictions = 1 / (1 + np.exp(-reference_data['feature_1']))
    
    # Baseline metrics
    baseline_metrics = {
        'accuracy': 0.92,
        'auc': 0.95,
        'precision': 0.90,
        'recall': 0.88
    }
    
    # Create monitoring pipeline
    pipeline = ModelMonitoringPipeline(
        model_name="fraud_detection_model",
        model_version="v1.2.0",
        reference_data=reference_data,
        reference_predictions=reference_predictions,
        baseline_metrics=baseline_metrics,
        numerical_features=['feature_1', 'feature_2', 'feature_3'],
        categorical_features=['category']
    )
    
    # Simulate new data with drift
    current_data = pd.DataFrame({
        'feature_1': np.random.normal(0.5, 1.2, n_samples),  # Drift
        'feature_2': np.random.normal(5, 2, n_samples),
        'feature_3': np.random.exponential(2.5, n_samples),  # Slight drift
        'category': np.random.choice(['A', 'B', 'C', 'D'], n_samples)  # New category
    })
    
    current_predictions = 1 / (1 + np.exp(-current_data['feature_1'] * 0.8))
    current_actuals = (current_predictions + np.random.normal(0, 0.1, n_samples) > 0.5).astype(int)
    
    # Run monitoring
    results = pipeline.run_monitoring(
        current_data=current_data,
        predictions=current_predictions,
        actuals=current_actuals
    )
    
    print("=== Monitoring Results ===")
    print(json.dumps(results, indent=2, default=str))
    
    print("\n=== Monitoring Summary ===")
    summary = pipeline.get_monitoring_summary()
    print(json.dumps(summary, indent=2, default=str))
    
    return results

# run_monitoring_demo()
```

## Interview Key Points

### Common Interview Questions

**Q1: What are data drift and concept drift? How do you distinguish them?**

Data drift refers to changes in the distribution of input features P(X), while concept drift refers to changes in the relationship between features and labels P(Y|X). How to distinguish:
- Data drift can be detected by checking only input feature distribution changes (e.g., KS test, PSI)
- Concept drift requires combining prediction results with true labels, typically manifested as model performance degradation but input distribution may remain unchanged

**Q2: Explain the PSI metric and its thresholds?**

PSI (Population Stability Index) measures the difference between two distributions:
- PSI < 0.1: No significant change
- 0.1 <= PSI < 0.25: Moderate change, needs attention
- PSI >= 0.25: Significant change, action required

**Q3: How to design a complete model monitoring system?**

1. **Data Layer Monitoring**: Data quality, missing values, anomalies
2. **Feature Layer Monitoring**: Data drift detection, distribution changes
3. **Model Layer Monitoring**: Performance metrics, prediction distribution
4. **Business Layer Monitoring**: Business KPIs, user feedback
5. **Alert System**: Multi-level alerts, multi-channel notifications
6. **Retraining Triggers**: Automated evaluation and trigger mechanisms

**Q4: How to handle monitoring in delayed label scenarios?**

When labels are delayed:
- Use proxy metrics (e.g., prediction distribution changes) for early warning
- Monitor input data drift as indirect indicator
- Use business feedback as soft labels
- Establish label backfill mechanism for periodic historical evaluation

**Q5: When should model retraining be triggered?**

Trigger conditions typically include:
1. Significant performance metric degradation (exceeding preset thresholds)
2. Severe data drift (PSI > 0.25 or multiple features drifted)
3. Periodic retraining (time-based strategy)
4. Business requirement changes (new features or target changes)

### Practical Recommendations

```
1. Establish Baseline
   - Record all metrics on test set before deployment
   - Save distribution statistics of reference data
   - Define acceptable performance ranges

2. Layered Monitoring
   - System layer: Latency, error rate, resource usage
   - Model layer: Performance metrics, drift metrics
   - Business layer: Conversion rate, revenue impact

3. Alert Strategy
   - Avoid alert fatigue, set reasonable thresholds
   - Implement alert escalation mechanism
   - Regularly review and adjust alert rules

4. Automation
   - Automate data collection and metric calculation
   - Automate report generation
   - Automate retraining process (MLOps)

5. Visualization
   - Real-time dashboard showing key metrics
   - Historical trend analysis
   - Anomaly visualization and root cause analysis
```

## Further Reading

### Recommended Resources

**Tools and Frameworks:**
- [Evidently AI](https://www.evidentlyai.com/) - Open-source ML observability tool
- [Arize AI](https://arize.com/) - Enterprise ML observability platform
- [Whylogs](https://whylabs.ai/whylogs) - Data logging library
- [Great Expectations](https://greatexpectations.io/) - Data quality validation
- [NannyML](https://www.nannyml.com/) - Model performance estimation

**Papers and Books:**
- "Learning under Concept Drift: A Review" - Concept drift survey
- "A Survey on Concept Drift Adaptation" - Drift adaptation methods
- "Reliable Machine Learning" - O'Reilly Reliable ML
- "Designing Machine Learning Systems" - Chip Huyen

### Related Topics

| Topic | Description | Relevance |
|-------|-------------|-----------|
| MLOps | Machine learning operations | Monitoring is a core component of MLOps |
| Feature Store | Feature management and serving | Provides data source for monitoring |
| A/B Testing | Model comparison experiments | Performance validation method |
| Model Interpretability | Prediction explanation | Helps understand anomalies |
| Continuous Training | Automated retraining | Downstream action triggered by monitoring |

## Summary

Model monitoring is the key guarantee for reliable operation of machine learning systems in production environments. We've covered:

1. **Importance of Monitoring**: Understanding why production models need continuous monitoring
2. **Data Drift Detection**: Using KS test, PSI, and other methods to detect feature distribution changes
3. **Concept Drift Detection**: Discovering changes in feature-label relationships through performance monitoring
4. **Performance Monitoring**: Tracking model real-time performance metrics
5. **Anomaly Detection**: Identifying anomalous samples in input data
6. **Monitoring Tools**: Using tools like Evidently AI and Arize AI
7. **Alerting and Retraining**: Designing alert systems and automated retraining triggers

In practice, we recommend starting with simple monitoring metrics and gradually building a comprehensive monitoring system. Remember: an unmonitored model has unpredictable behavior. Continuous monitoring, timely problem detection, and rapid response are key to ensuring ML system quality.
