---
title: "Model Interpretability: LIME"
description: "Use LIME for local model explanations: image, text, and tabular data"
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - LIME
  - interpretability
  - local explanations
  - XAI
status: imported
origin: old/src/content/docs/datascience/lime-interpretation.en.md
divergence: 0.28
issues: []
legacy:
  category: DataScience
  subcategory: Interpretability
  order: 35
  lastUpdated: 2026-01-07
---

LIME (Local Interpretable Model-agnostic Explanations) is a powerful technique for explaining individual predictions of any machine learning model. In an era where complex models like deep neural networks and gradient boosting ensembles dominate, understanding why a model makes specific predictions has become essential for building trust, debugging models, and meeting regulatory requirements.

## Introduction to LIME

### The Interpretability Problem

Modern machine learning models often operate as "black boxes." While they may achieve impressive accuracy, understanding their decision-making process remains challenging. This opacity creates several problems:

- **Trust**: Stakeholders hesitate to rely on predictions they cannot understand
- **Debugging**: Identifying why a model fails on certain inputs is difficult
- **Compliance**: Regulations like GDPR require explanations for automated decisions
- **Fairness**: Detecting and addressing bias requires understanding model behavior

### What is LIME?

LIME, introduced by Ribeiro, Singh, and Guestrin in 2016, addresses these challenges by providing local explanations for individual predictions. The key insight is that while a model may be globally complex, its behavior around any single prediction can often be approximated by a simpler, interpretable model.

**Core Principles:**

1. **Model-agnostic**: Works with any classifier or regressor
2. **Local fidelity**: Explains individual predictions, not global behavior
3. **Interpretable representations**: Uses human-understandable features
4. **Perturbation-based**: Generates explanations by observing model behavior on modified inputs

```python
# Installation
# pip install lime

import lime
import lime.lime_tabular
import lime.lime_text
import lime.lime_image
import numpy as np
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
```

### How LIME Works

LIME follows a systematic approach to generate explanations:

1. **Select the instance** to explain
2. **Generate perturbations** around the instance
3. **Get model predictions** for all perturbations
4. **Weight samples** by proximity to the original instance
5. **Train an interpretable model** (typically linear) on the weighted samples
6. **Extract feature importance** from the interpretable model

The mathematical formulation seeks to minimize:

$$\xi(x) = \arg\min_{g \in G} \mathcal{L}(f, g, \pi_x) + \Omega(g)$$

Where:
- $f$ is the original model
- $g$ is the interpretable model
- $\pi_x$ is the proximity measure
- $\Omega(g)$ is the complexity penalty

---

## Local Linear Approximation

### The Intuition Behind Local Approximation

Consider a complex decision boundary that curves and twists through feature space. While describing this boundary globally requires a complex model, at any single point, we can approximate it with a simple linear function. This is analogous to how calculus uses tangent lines to approximate curves locally.

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression

# Demonstrate local linear approximation
np.random.seed(42)
x = np.linspace(0, 10, 100)
y = np.sin(x) + 0.1 * np.random.randn(100)

# Point of interest
x_point = 5

# Local neighborhood
mask = np.abs(x - x_point) < 1.5
x_local = x[mask]
y_local = y[mask]

# Fit local linear model
local_model = LinearRegression()
local_model.fit(x_local.reshape(-1, 1), y_local)

# Visualize
plt.figure(figsize=(10, 6))
plt.scatter(x, y, alpha=0.5, label='Data')
plt.scatter(x_local, y_local, c='orange', label='Local neighborhood')
plt.axvline(x=x_point, color='red', linestyle='--', label='Point of interest')

x_line = np.linspace(x_point - 2, x_point + 2, 50)
y_line = local_model.predict(x_line.reshape(-1, 1))
plt.plot(x_line, y_line, 'g-', linewidth=2, label='Local linear approximation')

plt.xlabel('Feature')
plt.ylabel('Prediction')
plt.title('Local Linear Approximation Concept')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

### The Perturbation Process

LIME generates perturbations differently for each data type:

**For Tabular Data:**
- Sample from a Gaussian distribution centered on the training data
- Or randomly toggle features on/off

**For Text:**
- Randomly remove words from the document
- Each perturbation is a subset of the original words

**For Images:**
- Divide image into superpixels
- Randomly mask (grey out) superpixels

```python
def generate_tabular_perturbations(instance, num_samples=1000, feature_stats=None):
    """
    Generate perturbations for tabular data explanation.

    Parameters:
    -----------
    instance : array-like
        The instance to explain
    num_samples : int
        Number of perturbations to generate
    feature_stats : dict
        Dictionary with 'mean' and 'std' for each feature

    Returns:
    --------
    perturbations : np.ndarray
        Array of perturbed samples
    """
    n_features = len(instance)
    perturbations = np.zeros((num_samples, n_features))

    for i in range(n_features):
        if feature_stats is not None:
            # Sample around training distribution
            perturbations[:, i] = np.random.normal(
                loc=feature_stats['mean'][i],
                scale=feature_stats['std'][i],
                size=num_samples
            )
        else:
            # Sample around the instance
            perturbations[:, i] = np.random.normal(
                loc=instance[i],
                scale=np.abs(instance[i]) * 0.1 + 0.1,
                size=num_samples
            )

    # Include the original instance
    perturbations[0] = instance

    return perturbations
```

### Weighting by Proximity

Not all perturbations are equally informative. LIME weights samples by their proximity to the original instance using an exponential kernel:

$$\pi_x(z) = \exp\left(-\frac{D(x, z)^2}{\sigma^2}\right)$$

Where $D(x, z)$ is the distance between the original instance $x$ and the perturbation $z$, and $\sigma$ (kernel width) controls how quickly weights decay with distance.

```python
def compute_proximity_weights(original, perturbations, kernel_width=None):
    """
    Compute proximity weights using exponential kernel.

    Parameters:
    -----------
    original : array-like
        The original instance
    perturbations : np.ndarray
        Array of perturbed samples
    kernel_width : float
        Width of the exponential kernel

    Returns:
    --------
    weights : np.ndarray
        Proximity weights for each perturbation
    """
    # Compute Euclidean distances
    distances = np.sqrt(np.sum((perturbations - original) ** 2, axis=1))

    # Default kernel width based on number of features
    if kernel_width is None:
        kernel_width = np.sqrt(len(original)) * 0.75

    # Compute exponential kernel weights
    weights = np.exp(-(distances ** 2) / (kernel_width ** 2))

    return weights


def train_local_linear_model(perturbations, predictions, weights):
    """
    Train a weighted linear model on perturbations.

    Parameters:
    -----------
    perturbations : np.ndarray
        Perturbed samples
    predictions : np.ndarray
        Model predictions for perturbations
    weights : np.ndarray
        Sample weights

    Returns:
    --------
    model : LinearRegression
        Fitted linear model
    """
    from sklearn.linear_model import Ridge

    model = Ridge(alpha=1.0)
    model.fit(perturbations, predictions, sample_weight=weights)

    return model
```

---

## Tabular LIME

Tabular LIME is used for structured datasets with numerical and categorical features, commonly found in business applications, healthcare, and finance.

### Basic Usage

```python
import lime.lime_tabular
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

# Load and prepare data
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# Train a complex model
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Create LIME explainer
explainer = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train,
    feature_names=iris.feature_names,
    class_names=iris.target_names,
    mode='classification'
)

# Explain a single prediction
instance_idx = 0
instance = X_test[instance_idx]

explanation = explainer.explain_instance(
    data_row=instance,
    predict_fn=rf_model.predict_proba,
    num_features=4,
    num_samples=1000
)

# Display explanation
print(f"True class: {iris.target_names[y_test[instance_idx]]}")
print(f"Predicted class: {iris.target_names[rf_model.predict([instance])[0]]}")
print("\nFeature contributions:")
for feature, weight in explanation.as_list():
    print(f"  {feature}: {weight:.4f}")
```

### Handling Categorical Features

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import GradientBoostingClassifier

# Create sample dataset with categorical features
np.random.seed(42)
n_samples = 1000

data = pd.DataFrame({
    'age': np.random.randint(18, 70, n_samples),
    'income': np.random.exponential(50000, n_samples),
    'education': np.random.choice(['high_school', 'bachelors', 'masters', 'phd'], n_samples),
    'employment': np.random.choice(['employed', 'self_employed', 'unemployed'], n_samples),
    'credit_score': np.random.randint(300, 850, n_samples)
})

# Create target variable
data['approved'] = (
    (data['income'] > 40000) &
    (data['credit_score'] > 600) &
    (data['education'].isin(['bachelors', 'masters', 'phd']))
).astype(int)

# Encode categorical features
le_education = LabelEncoder()
le_employment = LabelEncoder()

data['education_encoded'] = le_education.fit_transform(data['education'])
data['employment_encoded'] = le_employment.fit_transform(data['employment'])

# Prepare features
feature_cols = ['age', 'income', 'education_encoded', 'employment_encoded', 'credit_score']
X = data[feature_cols].values
y = data['approved'].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = GradientBoostingClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Create LIME explainer with categorical feature specification
categorical_features = [2, 3]  # education_encoded and employment_encoded

explainer = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train,
    feature_names=['Age', 'Income', 'Education', 'Employment', 'Credit Score'],
    class_names=['Rejected', 'Approved'],
    categorical_features=categorical_features,
    categorical_names={
        2: le_education.classes_.tolist(),
        3: le_employment.classes_.tolist()
    },
    mode='classification'
)

# Explain a prediction
instance = X_test[0]
explanation = explainer.explain_instance(
    instance,
    model.predict_proba,
    num_features=5
)

print("Loan Approval Explanation:")
print("=" * 50)
for feature, weight in explanation.as_list():
    direction = "supports approval" if weight > 0 else "supports rejection"
    print(f"{feature}: {weight:+.4f} ({direction})")
```

### Regression Tasks

```python
from sklearn.datasets import fetch_california_housing
from sklearn.ensemble import GradientBoostingRegressor
import lime.lime_tabular

# Load California housing dataset
housing = fetch_california_housing()
X_train, X_test, y_train, y_test = train_test_split(
    housing.data, housing.target, test_size=0.2, random_state=42
)

# Train regression model
reg_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
reg_model.fit(X_train, y_train)

# Create LIME explainer for regression
explainer = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train,
    feature_names=housing.feature_names,
    mode='regression'
)

# Explain a prediction
instance = X_test[0]
explanation = explainer.explain_instance(
    instance,
    reg_model.predict,
    num_features=8
)

print(f"Predicted house price: ${reg_model.predict([instance])[0] * 100000:.2f}")
print(f"Actual house price: ${y_test[0] * 100000:.2f}")
print("\nFeature contributions to prediction:")
for feature, weight in explanation.as_list():
    print(f"  {feature}: {weight:+.4f}")
```

### Visualizing Tabular Explanations

```python
import matplotlib.pyplot as plt

def plot_lime_explanation(explanation, title="LIME Explanation"):
    """
    Create a horizontal bar plot for LIME explanation.
    """
    features = []
    weights = []

    for feature, weight in explanation.as_list():
        features.append(feature)
        weights.append(weight)

    # Sort by absolute weight
    sorted_idx = np.argsort(np.abs(weights))[::-1]
    features = [features[i] for i in sorted_idx]
    weights = [weights[i] for i in sorted_idx]

    colors = ['green' if w > 0 else 'red' for w in weights]

    fig, ax = plt.subplots(figsize=(10, 6))
    y_pos = np.arange(len(features))

    ax.barh(y_pos, weights, color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(features)
    ax.invert_yaxis()
    ax.set_xlabel('Feature Contribution')
    ax.set_title(title)
    ax.axvline(x=0, color='black', linestyle='-', linewidth=0.5)

    plt.tight_layout()
    plt.show()

# Use the function
# plot_lime_explanation(explanation, "Loan Approval Explanation")
```

---

## Text LIME

Text LIME explains predictions for text classification models by identifying which words or phrases most influenced the prediction.

### Basic Text Classification Explanation

```python
from lime.lime_text import LimeTextExplainer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Sample text data
texts = [
    "This movie was absolutely fantastic! Great acting and plot.",
    "Terrible film, waste of time. The acting was horrible.",
    "An amazing cinematic experience with stunning visuals.",
    "Boring and predictable. I fell asleep halfway through.",
    "One of the best films I have ever seen. Highly recommend!",
    "Awful movie with poor direction and weak storyline.",
    "Brilliant performances by all actors. A must-watch!",
    "Disappointing sequel that fails to live up to the original.",
    "Masterpiece of storytelling and character development.",
    "Overrated and overhyped. Save your money."
]
labels = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]  # 1 = positive, 0 = negative

# Create text classification pipeline
vectorizer = TfidfVectorizer(max_features=1000)
classifier = MultinomialNB()
pipeline = make_pipeline(vectorizer, classifier)
pipeline.fit(texts, labels)

# Create LIME text explainer
text_explainer = LimeTextExplainer(class_names=['Negative', 'Positive'])

# Explain a prediction
text_to_explain = "This film was absolutely wonderful with superb acting!"

explanation = text_explainer.explain_instance(
    text_to_explain,
    pipeline.predict_proba,
    num_features=10,
    num_samples=1000
)

print(f"Text: {text_to_explain}")
print(f"Prediction: {'Positive' if pipeline.predict([text_to_explain])[0] == 1 else 'Negative'}")
print(f"Confidence: {pipeline.predict_proba([text_to_explain])[0].max():.2%}")
print("\nWord contributions:")
for word, weight in explanation.as_list():
    sentiment = "positive" if weight > 0 else "negative"
    print(f"  '{word}': {weight:+.4f} (contributes to {sentiment})")
```

### Explaining Deep Learning Text Models

```python
import numpy as np

# Simulating a neural network text classifier
# In practice, you would use a trained model like BERT, LSTM, etc.

class MockNeuralTextClassifier:
    """
    Mock neural text classifier for demonstration.
    Replace with actual model in production.
    """
    def __init__(self):
        self.positive_words = {'great', 'excellent', 'amazing', 'wonderful',
                               'fantastic', 'brilliant', 'superb', 'outstanding'}
        self.negative_words = {'terrible', 'awful', 'horrible', 'bad',
                               'disappointing', 'boring', 'waste', 'poor'}

    def predict_proba(self, texts):
        """Return probability scores for each text."""
        results = []
        for text in texts:
            words = set(text.lower().split())
            pos_count = len(words.intersection(self.positive_words))
            neg_count = len(words.intersection(self.negative_words))

            # Calculate probability
            if pos_count + neg_count == 0:
                prob_positive = 0.5
            else:
                prob_positive = pos_count / (pos_count + neg_count + 1)

            # Add some noise for realism
            prob_positive = np.clip(prob_positive + np.random.normal(0, 0.05), 0.1, 0.9)
            results.append([1 - prob_positive, prob_positive])

        return np.array(results)

# Use with LIME
mock_model = MockNeuralTextClassifier()
text_explainer = LimeTextExplainer(class_names=['Negative', 'Positive'])

text = "The movie was great but the ending was disappointing and boring."
explanation = text_explainer.explain_instance(
    text,
    mock_model.predict_proba,
    num_features=6
)

print(f"Text: {text}")
print("\nWord importance for classification:")
for word, weight in sorted(explanation.as_list(), key=lambda x: abs(x[1]), reverse=True):
    print(f"  {word}: {weight:+.4f}")
```

### Handling Long Documents

```python
def explain_long_document(text, model_predict_fn, max_words=500, num_features=20):
    """
    Explain predictions for long documents by processing in chunks.

    Parameters:
    -----------
    text : str
        Long document to explain
    model_predict_fn : callable
        Model's predict_proba function
    max_words : int
        Maximum words per chunk
    num_features : int
        Number of features to return

    Returns:
    --------
    dict
        Aggregated word importance scores
    """
    words = text.split()

    if len(words) <= max_words:
        # Process entire document
        explainer = LimeTextExplainer(class_names=['Negative', 'Positive'])
        explanation = explainer.explain_instance(
            text, model_predict_fn, num_features=num_features
        )
        return dict(explanation.as_list())

    # Process in chunks
    chunk_size = max_words
    word_scores = {}

    for i in range(0, len(words), chunk_size // 2):  # Overlapping chunks
        chunk_words = words[i:i + chunk_size]
        chunk_text = ' '.join(chunk_words)

        explainer = LimeTextExplainer(class_names=['Negative', 'Positive'])
        explanation = explainer.explain_instance(
            chunk_text, model_predict_fn, num_features=num_features
        )

        for word, score in explanation.as_list():
            if word in word_scores:
                word_scores[word].append(score)
            else:
                word_scores[word] = [score]

    # Average scores across chunks
    aggregated_scores = {
        word: np.mean(scores)
        for word, scores in word_scores.items()
    }

    # Return top features
    sorted_scores = sorted(
        aggregated_scores.items(),
        key=lambda x: abs(x[1]),
        reverse=True
    )

    return dict(sorted_scores[:num_features])
```

### Visualizing Text Explanations

```python
def visualize_text_explanation(text, explanation, class_names=['Negative', 'Positive']):
    """
    Create an HTML visualization of text explanation.
    Words are highlighted based on their contribution.
    """
    word_weights = dict(explanation.as_list())
    words = text.split()

    html_parts = []

    for word in words:
        # Check if word (or variations) is in explanation
        weight = word_weights.get(word, 0)

        if weight > 0:
            # Positive contribution - green
            intensity = min(abs(weight) * 2, 1)
            color = f"rgba(0, 255, 0, {intensity})"
        elif weight < 0:
            # Negative contribution - red
            intensity = min(abs(weight) * 2, 1)
            color = f"rgba(255, 0, 0, {intensity})"
        else:
            color = "transparent"

        html_parts.append(f'<span style="background-color: {color}; padding: 2px;">{word}</span>')

    html_output = ' '.join(html_parts)

    return f"""
    <div style="font-family: Arial; font-size: 14px; line-height: 1.8;">
        <p><strong>Prediction explanation:</strong></p>
        <p>{html_output}</p>
        <p style="font-size: 12px; color: gray;">
            Green = contributes to {class_names[1]}, Red = contributes to {class_names[0]}
        </p>
    </div>
    """

# Usage in Jupyter notebook:
# from IPython.display import HTML
# HTML(visualize_text_explanation(text, explanation))
```

---

## Image LIME (Superpixels)

Image LIME explains predictions of image classifiers by identifying which regions of an image were most important for the prediction.

### Understanding Superpixels

Instead of treating each pixel independently, LIME groups pixels into superpixels using segmentation algorithms. This approach:

- Reduces the dimensionality of the problem
- Creates more interpretable explanations
- Is computationally more efficient

Common segmentation algorithms include:
- **SLIC** (Simple Linear Iterative Clustering)
- **Quickshift**
- **Felzenszwalb**

```python
from skimage.segmentation import slic, quickshift, felzenszwalb
from skimage.segmentation import mark_boundaries
import matplotlib.pyplot as plt
import numpy as np

def compare_segmentation_methods(image):
    """
    Compare different superpixel segmentation methods.
    """
    fig, axes = plt.subplots(2, 2, figsize=(12, 12))

    # Original image
    axes[0, 0].imshow(image)
    axes[0, 0].set_title('Original Image')
    axes[0, 0].axis('off')

    # SLIC segmentation
    segments_slic = slic(image, n_segments=100, compactness=10)
    axes[0, 1].imshow(mark_boundaries(image, segments_slic))
    axes[0, 1].set_title(f'SLIC ({len(np.unique(segments_slic))} segments)')
    axes[0, 1].axis('off')

    # Quickshift segmentation
    segments_quick = quickshift(image, kernel_size=3, max_dist=6, ratio=0.5)
    axes[1, 0].imshow(mark_boundaries(image, segments_quick))
    axes[1, 0].set_title(f'Quickshift ({len(np.unique(segments_quick))} segments)')
    axes[1, 0].axis('off')

    # Felzenszwalb segmentation
    segments_fz = felzenszwalb(image, scale=100, sigma=0.5, min_size=50)
    axes[1, 1].imshow(mark_boundaries(image, segments_fz))
    axes[1, 1].set_title(f'Felzenszwalb ({len(np.unique(segments_fz))} segments)')
    axes[1, 1].axis('off')

    plt.tight_layout()
    plt.show()

# Example usage with a sample image:
# from skimage import data
# image = data.astronaut()
# compare_segmentation_methods(image)
```

### Basic Image Classification Explanation

```python
from lime import lime_image
from skimage.segmentation import mark_boundaries
import numpy as np

# Example with a pre-trained model (e.g., from tensorflow/keras)
# For demonstration, we'll create a mock classifier

class MockImageClassifier:
    """
    Mock image classifier for demonstration.
    Replace with actual model (e.g., ResNet, VGG) in production.
    """
    def __init__(self):
        self.class_names = ['cat', 'dog', 'bird', 'fish', 'other']

    def predict(self, images):
        """Return class predictions."""
        # Mock prediction based on image brightness
        predictions = []
        for img in images:
            brightness = np.mean(img)
            if brightness > 0.7:
                predictions.append(2)  # bird
            elif brightness > 0.5:
                predictions.append(0)  # cat
            elif brightness > 0.3:
                predictions.append(1)  # dog
            else:
                predictions.append(4)  # other
        return np.array(predictions)

    def predict_proba(self, images):
        """Return probability distribution over classes."""
        results = []
        for img in images:
            brightness = np.mean(img)
            # Create probability distribution
            probs = np.random.dirichlet(np.ones(5) * 0.5)
            # Boost probability of predicted class
            pred = self.predict([img])[0]
            probs[pred] += 0.5
            probs = probs / probs.sum()
            results.append(probs)
        return np.array(results)

# Create explainer
image_explainer = lime_image.LimeImageExplainer()

# Generate a sample image
sample_image = np.random.rand(224, 224, 3)

# Create mock model
model = MockImageClassifier()

# Get explanation
explanation = image_explainer.explain_instance(
    sample_image,
    model.predict_proba,
    top_labels=3,
    hide_color=0,
    num_samples=1000
)

print("Top predicted classes and their explanations generated.")
```

### Visualizing Image Explanations

```python
def visualize_image_explanation(explanation, image, label_idx,
                                 num_features=5, positive_only=True):
    """
    Visualize LIME explanation for an image prediction.

    Parameters:
    -----------
    explanation : lime.lime_image.ImageExplanation
        LIME explanation object
    image : np.ndarray
        Original image
    label_idx : int
        Class label to explain
    num_features : int
        Number of superpixels to highlight
    positive_only : bool
        Whether to show only positive contributions
    """
    fig, axes = plt.subplots(1, 4, figsize=(16, 4))

    # Original image
    axes[0].imshow(image)
    axes[0].set_title('Original Image')
    axes[0].axis('off')

    # Positive contributions only
    temp, mask = explanation.get_image_and_mask(
        label_idx,
        positive_only=True,
        num_features=num_features,
        hide_rest=False
    )
    axes[1].imshow(mark_boundaries(temp, mask))
    axes[1].set_title('Positive Contributions')
    axes[1].axis('off')

    # Negative contributions only
    temp, mask = explanation.get_image_and_mask(
        label_idx,
        positive_only=False,
        negative_only=True,
        num_features=num_features,
        hide_rest=False
    )
    axes[2].imshow(mark_boundaries(temp, mask))
    axes[2].set_title('Negative Contributions')
    axes[2].axis('off')

    # Highlighted regions only
    temp, mask = explanation.get_image_and_mask(
        label_idx,
        positive_only=True,
        num_features=num_features,
        hide_rest=True
    )
    axes[3].imshow(temp)
    axes[3].set_title('Important Regions Only')
    axes[3].axis('off')

    plt.tight_layout()
    plt.show()

# Usage:
# visualize_image_explanation(explanation, sample_image, label_idx=0)
```

### Working with Deep Learning Models

```python
# Example with a real deep learning model (TensorFlow/Keras)

def explain_keras_image_model(model, image, class_names, num_samples=1000):
    """
    Explain predictions of a Keras image classification model.

    Parameters:
    -----------
    model : keras.Model
        Trained Keras image classification model
    image : np.ndarray
        Image to explain (should be preprocessed for model)
    class_names : list
        List of class names
    num_samples : int
        Number of perturbation samples

    Returns:
    --------
    explanation : ImageExplanation
        LIME explanation object
    """
    from lime import lime_image

    # Define prediction function
    def predict_fn(images):
        # Preprocess images for model
        preprocessed = np.array([img for img in images])

        # Get predictions
        predictions = model.predict(preprocessed, verbose=0)

        return predictions

    # Create explainer
    explainer = lime_image.LimeImageExplainer()

    # Generate explanation
    explanation = explainer.explain_instance(
        image,
        predict_fn,
        top_labels=5,
        hide_color=0,
        num_samples=num_samples,
        segmentation_fn=None  # Uses default quickshift
    )

    return explanation


def create_heatmap_overlay(explanation, image, label_idx, alpha=0.5):
    """
    Create a heatmap overlay showing feature importance.
    """
    # Get segments and their weights
    segments = explanation.segments

    # Get local explanation for the label
    local_exp = explanation.local_exp[label_idx]

    # Create weight map
    weight_map = np.zeros(segments.shape)
    for segment_idx, weight in local_exp:
        weight_map[segments == segment_idx] = weight

    # Normalize weights
    max_abs_weight = np.max(np.abs(weight_map))
    if max_abs_weight > 0:
        weight_map = weight_map / max_abs_weight

    # Create heatmap
    fig, ax = plt.subplots(figsize=(8, 8))
    ax.imshow(image)
    heatmap = ax.imshow(weight_map, cmap='RdBu_r', alpha=alpha, vmin=-1, vmax=1)
    plt.colorbar(heatmap, label='Feature Importance')
    ax.set_title('Prediction Explanation Heatmap')
    ax.axis('off')
    plt.tight_layout()
    plt.show()
```

---

## LIME vs SHAP Comparison

Both LIME and SHAP are popular methods for model interpretability, but they differ in their approaches and characteristics.

### Fundamental Differences

| Aspect | LIME | SHAP |
|--------|------|------|
| **Approach** | Local linear approximation | Shapley values from game theory |
| **Scope** | Local explanations only | Local and global explanations |
| **Consistency** | May vary between runs | Theoretically consistent |
| **Computational Cost** | Generally faster | Can be slower (depends on variant) |
| **Theoretical Foundation** | Heuristic | Strong mathematical foundation |
| **Additivity** | Not guaranteed | Feature contributions sum to prediction |

### Practical Comparison

```python
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

# Load data
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Instance to explain
instance_idx = 0
instance = X_test[instance_idx:instance_idx+1]

print("Comparing LIME and SHAP explanations")
print("=" * 60)

# LIME Explanation
import lime.lime_tabular

lime_explainer = lime.lime_tabular.LimeTabularExplainer(
    X_train,
    feature_names=data.feature_names,
    class_names=data.target_names,
    mode='classification'
)

lime_exp = lime_explainer.explain_instance(
    instance[0],
    model.predict_proba,
    num_features=10
)

print("\nLIME Top 10 Features:")
for feature, weight in lime_exp.as_list()[:10]:
    print(f"  {feature}: {weight:+.4f}")

# SHAP Explanation (requires shap package)
try:
    import shap

    shap_explainer = shap.TreeExplainer(model)
    shap_values = shap_explainer.shap_values(instance)

    # Get feature importance for positive class
    if isinstance(shap_values, list):
        importance = shap_values[1][0]  # Class 1 (malignant)
    else:
        importance = shap_values[0]

    # Sort by absolute importance
    sorted_idx = np.argsort(np.abs(importance))[::-1][:10]

    print("\nSHAP Top 10 Features:")
    for idx in sorted_idx:
        print(f"  {data.feature_names[idx]}: {importance[idx]:+.4f}")

except ImportError:
    print("\nSHAP not installed. Install with: pip install shap")
```

### When to Use Which

**Use LIME when:**
- You need fast, individual explanations
- Working with diverse data types (especially images and text)
- Model-agnostic explanation is required
- Approximate explanations are acceptable

**Use SHAP when:**
- You need theoretically grounded explanations
- Global feature importance is required
- Feature contributions must sum to the prediction difference
- Working with tree-based models (TreeExplainer is very efficient)
- Consistency across explanations is important

```python
def compare_explanation_stability(model, X_test, lime_explainer, n_runs=5):
    """
    Compare stability of LIME explanations across multiple runs.
    """
    instance = X_test[0]

    feature_rankings = []

    for i in range(n_runs):
        explanation = lime_explainer.explain_instance(
            instance,
            model.predict_proba,
            num_features=10
        )

        # Get feature ranking
        features = [f.split()[0] for f, w in explanation.as_list()]
        feature_rankings.append(features)

    # Calculate consistency
    first_ranking = feature_rankings[0]
    consistency_scores = []

    for ranking in feature_rankings[1:]:
        matches = sum(1 for f in ranking[:5] if f in first_ranking[:5])
        consistency_scores.append(matches / 5)

    print(f"LIME Explanation Stability (top 5 features):")
    print(f"  Average consistency: {np.mean(consistency_scores):.2%}")
    print(f"  Standard deviation: {np.std(consistency_scores):.2%}")

    return feature_rankings
```

### Combining LIME and SHAP

```python
def ensemble_explanation(model, instance, X_train, feature_names,
                         lime_weight=0.5, shap_weight=0.5):
    """
    Combine LIME and SHAP explanations for more robust feature importance.

    Parameters:
    -----------
    model : sklearn estimator
        Trained model
    instance : array-like
        Instance to explain
    X_train : array-like
        Training data
    feature_names : list
        Feature names
    lime_weight : float
        Weight for LIME scores
    shap_weight : float
        Weight for SHAP scores

    Returns:
    --------
    dict
        Combined feature importance scores
    """
    try:
        import shap
    except ImportError:
        raise ImportError("SHAP is required for ensemble explanation")

    # Get LIME explanation
    lime_explainer = lime.lime_tabular.LimeTabularExplainer(
        X_train,
        feature_names=feature_names,
        mode='classification'
    )

    lime_exp = lime_explainer.explain_instance(
        instance,
        model.predict_proba,
        num_features=len(feature_names)
    )

    lime_scores = {f.split()[0]: w for f, w in lime_exp.as_list()}

    # Get SHAP explanation
    shap_explainer = shap.TreeExplainer(model)
    shap_values = shap_explainer.shap_values(instance.reshape(1, -1))

    if isinstance(shap_values, list):
        shap_importance = shap_values[1][0]
    else:
        shap_importance = shap_values[0]

    shap_scores = dict(zip(feature_names, shap_importance))

    # Normalize scores
    lime_max = max(abs(v) for v in lime_scores.values()) or 1
    shap_max = max(abs(v) for v in shap_scores.values()) or 1

    normalized_lime = {k: v / lime_max for k, v in lime_scores.items()}
    normalized_shap = {k: v / shap_max for k, v in shap_scores.items()}

    # Combine scores
    combined = {}
    all_features = set(normalized_lime.keys()) | set(normalized_shap.keys())

    for feature in all_features:
        lime_val = normalized_lime.get(feature, 0)
        shap_val = normalized_shap.get(feature, 0)
        combined[feature] = lime_weight * lime_val + shap_weight * shap_val

    return dict(sorted(combined.items(), key=lambda x: abs(x[1]), reverse=True))
```

---

## Trustworthiness Considerations

While LIME is a powerful tool, understanding its limitations is crucial for responsible use.

### Stability and Consistency

LIME explanations can vary between runs due to the random sampling process. This instability can be problematic in high-stakes applications.

```python
def measure_lime_stability(explainer, instance, predict_fn, n_runs=10, top_k=5):
    """
    Measure the stability of LIME explanations.

    Parameters:
    -----------
    explainer : LimeTabularExplainer
        LIME explainer object
    instance : array-like
        Instance to explain
    predict_fn : callable
        Model prediction function
    n_runs : int
        Number of explanation runs
    top_k : int
        Number of top features to consider

    Returns:
    --------
    dict
        Stability metrics
    """
    all_features = []
    all_weights = []

    for _ in range(n_runs):
        explanation = explainer.explain_instance(
            instance,
            predict_fn,
            num_features=top_k
        )

        features = [f for f, w in explanation.as_list()]
        weights = [w for f, w in explanation.as_list()]

        all_features.append(features)
        all_weights.append(dict(zip(features, weights)))

    # Calculate Jaccard similarity between top-k sets
    jaccard_scores = []
    for i in range(n_runs):
        for j in range(i + 1, n_runs):
            set_i = set(all_features[i])
            set_j = set(all_features[j])
            intersection = len(set_i & set_j)
            union = len(set_i | set_j)
            jaccard_scores.append(intersection / union if union > 0 else 0)

    # Calculate weight variance for common features
    feature_weights = {}
    for weights in all_weights:
        for feature, weight in weights.items():
            if feature not in feature_weights:
                feature_weights[feature] = []
            feature_weights[feature].append(weight)

    weight_variance = {
        f: np.var(w) for f, w in feature_weights.items()
        if len(w) > 1
    }

    return {
        'jaccard_mean': np.mean(jaccard_scores),
        'jaccard_std': np.std(jaccard_scores),
        'avg_weight_variance': np.mean(list(weight_variance.values())),
        'feature_frequency': {
            f: len(w) / n_runs
            for f, w in feature_weights.items()
        }
    }

# Usage example
# stability = measure_lime_stability(explainer, instance, model.predict_proba)
# print(f"Feature set stability (Jaccard): {stability['jaccard_mean']:.2%}")
```

### Faithfulness to the Original Model

LIME explanations may not always accurately reflect the model's true decision-making process.

```python
def check_lime_faithfulness(explainer, model, instance, X_test,
                            num_features=5, n_samples=100):
    """
    Check if LIME explanation is faithful to the model's behavior.

    This tests whether removing important features actually changes
    the model's predictions as expected.
    """
    # Get LIME explanation
    explanation = explainer.explain_instance(
        instance,
        model.predict_proba,
        num_features=num_features
    )

    # Get original prediction
    original_prob = model.predict_proba([instance])[0]
    original_class = np.argmax(original_prob)

    # Get important features
    important_features = []
    for feature_desc, weight in explanation.as_list():
        # Extract feature index from description
        # This is a simplified approach; actual implementation depends on feature names
        important_features.append((feature_desc, weight))

    # Test by ablating features
    feature_names = explainer.feature_names

    results = {
        'original_prediction': original_class,
        'original_confidence': original_prob[original_class],
        'feature_ablation_effects': []
    }

    print(f"Original prediction: Class {original_class} ({original_prob[original_class]:.2%})")
    print("\nFeature ablation effects:")

    for feature_desc, weight in important_features[:5]:
        # Find feature index
        # Simplified: assume feature_desc starts with feature name
        feature_idx = None
        for idx, name in enumerate(feature_names):
            if feature_desc.startswith(name):
                feature_idx = idx
                break

        if feature_idx is not None:
            # Ablate feature (set to mean value)
            modified_instance = instance.copy()
            modified_instance[feature_idx] = np.mean(X_test[:, feature_idx])

            # Get new prediction
            new_prob = model.predict_proba([modified_instance])[0]
            new_class = np.argmax(new_prob)

            effect = original_prob[original_class] - new_prob[original_class]
            expected_direction = "decrease" if weight > 0 else "increase"
            actual_direction = "decrease" if effect > 0 else "increase"

            match = expected_direction == actual_direction

            print(f"  {feature_desc[:40]}: weight={weight:+.3f}, "
                  f"effect={effect:+.3f}, faithful={'Yes' if match else 'No'}")

            results['feature_ablation_effects'].append({
                'feature': feature_desc,
                'weight': weight,
                'effect': effect,
                'faithful': match
            })

    # Calculate faithfulness score
    faithful_count = sum(
        1 for r in results['feature_ablation_effects'] if r['faithful']
    )
    results['faithfulness_score'] = faithful_count / len(results['feature_ablation_effects'])

    return results
```

### Best Practices for Reliable LIME Explanations

```python
class ReliableLIMEExplainer:
    """
    Wrapper class for more reliable LIME explanations.
    Implements several best practices for trustworthy explanations.
    """

    def __init__(self, training_data, feature_names, class_names=None,
                 mode='classification', n_ensemble=5):
        """
        Initialize with ensemble of LIME explanations.

        Parameters:
        -----------
        training_data : np.ndarray
            Training data for creating perturbations
        feature_names : list
            Names of features
        class_names : list
            Names of classes (for classification)
        mode : str
            'classification' or 'regression'
        n_ensemble : int
            Number of LIME runs to ensemble
        """
        self.training_data = training_data
        self.feature_names = feature_names
        self.class_names = class_names
        self.mode = mode
        self.n_ensemble = n_ensemble

        self.base_explainer = lime.lime_tabular.LimeTabularExplainer(
            training_data=training_data,
            feature_names=feature_names,
            class_names=class_names,
            mode=mode
        )

    def explain_instance(self, instance, predict_fn, num_features=10,
                         num_samples=1000, labels=None):
        """
        Generate stable explanation by ensembling multiple LIME runs.
        """
        all_weights = {}

        for i in range(self.n_ensemble):
            exp = self.base_explainer.explain_instance(
                instance,
                predict_fn,
                num_features=num_features,
                num_samples=num_samples,
                labels=labels
            )

            for feature, weight in exp.as_list():
                if feature not in all_weights:
                    all_weights[feature] = []
                all_weights[feature].append(weight)

        # Calculate ensemble statistics
        ensemble_results = []
        for feature, weights in all_weights.items():
            mean_weight = np.mean(weights)
            std_weight = np.std(weights)

            # Confidence based on consistency
            confidence = 1 - (std_weight / (abs(mean_weight) + 1e-10))
            confidence = np.clip(confidence, 0, 1)

            ensemble_results.append({
                'feature': feature,
                'mean_weight': mean_weight,
                'std_weight': std_weight,
                'confidence': confidence,
                'n_appearances': len(weights)
            })

        # Sort by absolute mean weight
        ensemble_results.sort(key=lambda x: abs(x['mean_weight']), reverse=True)

        return EnsembleLIMEExplanation(ensemble_results, self.n_ensemble)


class EnsembleLIMEExplanation:
    """Container for ensemble LIME explanation results."""

    def __init__(self, results, n_ensemble):
        self.results = results
        self.n_ensemble = n_ensemble

    def as_list(self, min_confidence=0.0):
        """Return explanation as list of (feature, weight) tuples."""
        return [
            (r['feature'], r['mean_weight'])
            for r in self.results
            if r['confidence'] >= min_confidence
        ]

    def get_confident_features(self, confidence_threshold=0.7):
        """Return only features with high confidence."""
        return [
            r for r in self.results
            if r['confidence'] >= confidence_threshold
        ]

    def summary(self):
        """Print summary of ensemble explanation."""
        print(f"Ensemble LIME Explanation (n={self.n_ensemble})")
        print("=" * 60)

        for r in self.results[:10]:
            conf_str = "*" * int(r['confidence'] * 5)
            print(f"{r['feature'][:40]:40s} {r['mean_weight']:+.4f} "
                  f"(+/-{r['std_weight']:.4f}) [{conf_str:5s}]")
```

### Limitations and Caveats

1. **Locality assumption**: LIME assumes the model is locally linear, which may not hold for highly non-linear regions.

2. **Perturbation distribution**: The perturbation method affects explanations significantly.

3. **Feature independence**: LIME treats features as independent, missing interactions.

4. **Hyperparameter sensitivity**: Results depend on kernel width, number of samples, and segmentation parameters.

```python
def analyze_hyperparameter_sensitivity(explainer, instance, predict_fn,
                                        num_samples_range=[100, 500, 1000, 2000],
                                        kernel_widths=[0.25, 0.5, 0.75, 1.0]):
    """
    Analyze sensitivity of LIME to hyperparameters.
    """
    results = []

    for num_samples in num_samples_range:
        for kw in kernel_widths:
            # Create new explainer with specific kernel width
            exp = explainer.explain_instance(
                instance,
                predict_fn,
                num_features=5,
                num_samples=num_samples
            )

            top_features = [f for f, w in exp.as_list()[:3]]

            results.append({
                'num_samples': num_samples,
                'kernel_width': kw,
                'top_features': top_features,
                'top_weights': [w for f, w in exp.as_list()[:3]]
            })

    # Analyze consistency
    all_top_features = [set(r['top_features']) for r in results]
    reference = all_top_features[0]

    consistency_scores = [
        len(reference & s) / len(reference | s)
        for s in all_top_features[1:]
    ]

    print("Hyperparameter Sensitivity Analysis")
    print("=" * 60)
    print(f"Average feature set consistency: {np.mean(consistency_scores):.2%}")
    print(f"Consistency range: {min(consistency_scores):.2%} - {max(consistency_scores):.2%}")

    return results
```

---

## Python Implementation

### Complete Example: Credit Risk Model Explanation

```python
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
import lime.lime_tabular
import matplotlib.pyplot as plt

# Generate synthetic credit risk data
np.random.seed(42)
n_samples = 2000

data = pd.DataFrame({
    'age': np.random.normal(45, 15, n_samples).clip(18, 80),
    'income': np.random.exponential(50000, n_samples).clip(10000, 500000),
    'debt_to_income': np.random.uniform(0, 0.8, n_samples),
    'credit_history_years': np.random.uniform(0, 30, n_samples),
    'num_credit_cards': np.random.poisson(3, n_samples),
    'num_late_payments': np.random.poisson(1, n_samples),
    'employment_years': np.random.uniform(0, 40, n_samples),
    'owns_home': np.random.choice([0, 1], n_samples, p=[0.4, 0.6]),
    'loan_amount': np.random.uniform(1000, 100000, n_samples),
    'loan_purpose': np.random.choice(['home', 'car', 'education', 'personal'], n_samples)
})

# Create target variable based on realistic rules
default_probability = (
    0.1 +
    0.2 * (data['debt_to_income'] > 0.5) +
    0.15 * (data['num_late_payments'] > 2) +
    0.1 * (data['credit_history_years'] < 3) -
    0.1 * (data['owns_home'] == 1) -
    0.05 * (data['income'] > 75000).astype(int)
).clip(0, 1)

data['default'] = (np.random.random(n_samples) < default_probability).astype(int)

# Encode categorical variable
le = LabelEncoder()
data['loan_purpose_encoded'] = le.fit_transform(data['loan_purpose'])

# Prepare features
feature_cols = ['age', 'income', 'debt_to_income', 'credit_history_years',
                'num_credit_cards', 'num_late_payments', 'employment_years',
                'owns_home', 'loan_amount', 'loan_purpose_encoded']

X = data[feature_cols].values
y = data['default'].values

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Scale numerical features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = GradientBoostingClassifier(
    n_estimators=100,
    max_depth=5,
    random_state=42
)
model.fit(X_train_scaled, y_train)

print(f"Model Accuracy: {model.score(X_test_scaled, y_test):.2%}")

# Create LIME explainer
explainer = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train_scaled,
    feature_names=feature_cols,
    class_names=['No Default', 'Default'],
    categorical_features=[7, 9],  # owns_home and loan_purpose_encoded
    categorical_names={
        7: ['Rents', 'Owns'],
        9: le.classes_.tolist()
    },
    mode='classification'
)

# Explain predictions for high-risk applicants
high_risk_indices = np.where(model.predict_proba(X_test_scaled)[:, 1] > 0.7)[0]

if len(high_risk_indices) > 0:
    instance_idx = high_risk_indices[0]
    instance = X_test_scaled[instance_idx]

    print("\n" + "=" * 60)
    print("CREDIT RISK EXPLANATION")
    print("=" * 60)

    # Get explanation
    explanation = explainer.explain_instance(
        instance,
        model.predict_proba,
        num_features=10,
        num_samples=2000
    )

    # Display prediction
    pred_proba = model.predict_proba([instance])[0]
    print(f"\nPredicted Default Probability: {pred_proba[1]:.2%}")
    print(f"Actual Outcome: {'Default' if y_test[instance_idx] == 1 else 'No Default'}")

    # Display original values
    original_values = scaler.inverse_transform([instance])[0]
    print("\nApplicant Profile:")
    for i, col in enumerate(feature_cols):
        if col == 'loan_purpose_encoded':
            val = le.inverse_transform([int(original_values[i])])[0]
        elif col == 'owns_home':
            val = 'Yes' if original_values[i] > 0.5 else 'No'
        else:
            val = f"{original_values[i]:.2f}"
        print(f"  {col}: {val}")

    # Display LIME explanation
    print("\nRisk Factors (LIME Explanation):")
    for feature, weight in explanation.as_list():
        direction = "increases risk" if weight > 0 else "decreases risk"
        print(f"  {feature}: {weight:+.4f} ({direction})")

    # Visualize
    fig, ax = plt.subplots(figsize=(12, 6))
    features = [f for f, w in explanation.as_list()]
    weights = [w for f, w in explanation.as_list()]

    colors = ['#d73027' if w > 0 else '#1a9850' for w in weights]
    y_pos = np.arange(len(features))

    ax.barh(y_pos, weights, color=colors, alpha=0.7)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(features)
    ax.invert_yaxis()
    ax.set_xlabel('Feature Contribution to Default Prediction')
    ax.set_title('Credit Risk Explanation (LIME)')
    ax.axvline(x=0, color='black', linestyle='-', linewidth=0.5)

    plt.tight_layout()
    plt.show()
```

### Complete Example: Sentiment Analysis Explanation

```python
from lime.lime_text import LimeTextExplainer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import re

# Sample movie reviews
reviews = [
    "This movie was absolutely wonderful. The acting was superb and the plot kept me engaged throughout.",
    "Terrible waste of time. Poor acting and a confusing storyline made this unwatchable.",
    "A masterpiece of cinema. Brilliant performances and stunning cinematography.",
    "I've never been so bored watching a film. Predictable and dull from start to finish.",
    "An instant classic! The director outdid themselves with this emotional journey.",
    "Disappointing sequel that fails to capture the magic of the original.",
    "Heartwarming story with excellent character development. Highly recommend!",
    "Awful script and wooden acting. Save your money and skip this one.",
    "One of the best films of the year. Thought-provoking and beautifully crafted.",
    "Complete disaster. Nothing works in this mess of a movie.",
    "Captivating from beginning to end. A truly memorable experience.",
    "Boring, predictable, and overlong. What a disappointment.",
    "Exceptional filmmaking at its finest. Every scene is a work of art.",
    "Worst movie I've seen this year. Total waste of talented actors.",
    "A delightful surprise! Fun, engaging, and thoroughly entertaining."
]

labels = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]  # 1 = positive, 0 = negative

# Create text classification pipeline
pipeline = make_pipeline(
    TfidfVectorizer(max_features=5000, ngram_range=(1, 2)),
    LogisticRegression(max_iter=1000, random_state=42)
)
pipeline.fit(reviews, labels)

# Create LIME text explainer
text_explainer = LimeTextExplainer(
    class_names=['Negative', 'Positive'],
    split_expression=r'\W+',
    bow=True
)

# Explain a new review
new_review = """This film exceeded all my expectations. The performances were incredible,
especially the lead actress who delivered an oscar-worthy portrayal. The story was both
heartbreaking and uplifting, keeping me on the edge of my seat. However, the pacing in
the middle was slightly slow, which is my only minor complaint. Overall, a must-watch
movie that I will definitely recommend to friends."""

# Get explanation
explanation = text_explainer.explain_instance(
    new_review,
    pipeline.predict_proba,
    num_features=15,
    num_samples=2000
)

# Display results
prediction = pipeline.predict([new_review])[0]
confidence = pipeline.predict_proba([new_review])[0][prediction]

print("SENTIMENT ANALYSIS EXPLANATION")
print("=" * 60)
print(f"\nReview: {new_review[:100]}...")
print(f"\nPredicted Sentiment: {'Positive' if prediction == 1 else 'Negative'}")
print(f"Confidence: {confidence:.2%}")

print("\nWord Contributions:")
print("-" * 40)

positive_words = []
negative_words = []

for word, weight in explanation.as_list():
    if weight > 0:
        positive_words.append((word, weight))
    else:
        negative_words.append((word, weight))

print("\nWords supporting POSITIVE sentiment:")
for word, weight in sorted(positive_words, key=lambda x: x[1], reverse=True)[:7]:
    print(f"  '{word}': +{weight:.4f}")

print("\nWords supporting NEGATIVE sentiment:")
for word, weight in sorted(negative_words, key=lambda x: abs(x[1]), reverse=True)[:7]:
    print(f"  '{word}': {weight:.4f}")

# Create visualization
def create_highlighted_text(text, explanation):
    """Create HTML with highlighted words."""
    word_weights = dict(explanation.as_list())
    words = re.split(r'(\W+)', text)

    highlighted = []
    for word in words:
        weight = word_weights.get(word.lower(), 0)

        if weight > 0.05:
            color = f"rgba(0, 128, 0, {min(weight * 5, 0.8)})"
        elif weight < -0.05:
            color = f"rgba(255, 0, 0, {min(abs(weight) * 5, 0.8)})"
        else:
            color = "transparent"

        highlighted.append(f'<span style="background-color: {color};">{word}</span>')

    return ''.join(highlighted)

# For Jupyter notebook:
# from IPython.display import HTML
# HTML(create_highlighted_text(new_review, explanation))
```

### Batch Explanation and Analysis

```python
import pandas as pd
from collections import Counter

def batch_explain(explainer, instances, predict_fn, num_features=10,
                  num_samples=1000, show_progress=True):
    """
    Generate LIME explanations for multiple instances.

    Parameters:
    -----------
    explainer : LimeTabularExplainer
        LIME explainer object
    instances : np.ndarray
        Array of instances to explain
    predict_fn : callable
        Model prediction function
    num_features : int
        Number of features per explanation
    num_samples : int
        Number of perturbation samples
    show_progress : bool
        Whether to show progress bar

    Returns:
    --------
    list
        List of explanation objects
    """
    explanations = []

    n_instances = len(instances)

    for i, instance in enumerate(instances):
        if show_progress and i % 10 == 0:
            print(f"Explaining instance {i+1}/{n_instances}...")

        exp = explainer.explain_instance(
            instance,
            predict_fn,
            num_features=num_features,
            num_samples=num_samples
        )
        explanations.append(exp)

    return explanations


def analyze_feature_importance_distribution(explanations, feature_names):
    """
    Analyze the distribution of feature importance across multiple explanations.
    """
    # Collect all feature weights
    feature_weights = {name: [] for name in feature_names}
    feature_appearances = Counter()

    for exp in explanations:
        for feature_desc, weight in exp.as_list():
            # Extract feature name
            for name in feature_names:
                if feature_desc.startswith(name):
                    feature_weights[name].append(weight)
                    feature_appearances[name] += 1
                    break

    # Calculate statistics
    stats = []
    for name in feature_names:
        weights = feature_weights[name]
        if len(weights) > 0:
            stats.append({
                'feature': name,
                'mean_weight': np.mean(weights),
                'std_weight': np.std(weights),
                'median_weight': np.median(weights),
                'appearance_rate': feature_appearances[name] / len(explanations),
                'positive_rate': sum(1 for w in weights if w > 0) / len(weights)
            })

    return pd.DataFrame(stats).sort_values('appearance_rate', ascending=False)


def find_similar_explanations(explanations, target_idx, top_n=5):
    """
    Find instances with similar explanations to a target instance.

    Uses Jaccard similarity of top features.
    """
    target_exp = explanations[target_idx]
    target_features = set(f for f, w in target_exp.as_list()[:5])

    similarities = []

    for i, exp in enumerate(explanations):
        if i == target_idx:
            continue

        exp_features = set(f for f, w in exp.as_list()[:5])

        intersection = len(target_features & exp_features)
        union = len(target_features | exp_features)
        jaccard = intersection / union if union > 0 else 0

        similarities.append((i, jaccard))

    # Sort by similarity
    similarities.sort(key=lambda x: x[1], reverse=True)

    return similarities[:top_n]


# Example usage
def comprehensive_lime_analysis(model, X_train, X_test, y_test,
                                feature_names, class_names):
    """
    Perform comprehensive LIME analysis on a dataset.
    """
    # Create explainer
    explainer = lime.lime_tabular.LimeTabularExplainer(
        training_data=X_train,
        feature_names=feature_names,
        class_names=class_names,
        mode='classification'
    )

    # Sample instances to explain
    n_explain = min(50, len(X_test))
    sample_indices = np.random.choice(len(X_test), n_explain, replace=False)
    sample_instances = X_test[sample_indices]

    # Generate explanations
    print("Generating LIME explanations...")
    explanations = batch_explain(
        explainer,
        sample_instances,
        model.predict_proba,
        num_features=10,
        num_samples=1000
    )

    # Analyze feature importance distribution
    print("\nAnalyzing feature importance distribution...")
    importance_stats = analyze_feature_importance_distribution(
        explanations, feature_names
    )

    print("\nFeature Importance Statistics:")
    print(importance_stats.to_string(index=False))

    # Find prediction errors and explain
    predictions = model.predict(sample_instances)
    actual = y_test[sample_indices]
    errors = np.where(predictions != actual)[0]

    if len(errors) > 0:
        print(f"\nExamining {len(errors)} prediction errors...")
        for error_idx in errors[:3]:  # Show first 3 errors
            print(f"\n  Instance {sample_indices[error_idx]}:")
            print(f"    Predicted: {class_names[predictions[error_idx]]}")
            print(f"    Actual: {class_names[actual[error_idx]]}")
            print(f"    Top contributing features:")
            for feature, weight in explanations[error_idx].as_list()[:3]:
                print(f"      {feature}: {weight:+.4f}")

    return explanations, importance_stats
```

---

## Interview Key Points

### Common Interview Questions

**Q1: Explain how LIME works in simple terms.**

LIME explains individual predictions by:
1. Creating variations of the input around the point of interest
2. Getting model predictions for these variations
3. Fitting a simple linear model weighted by proximity
4. Using this simple model to identify which features most influenced the prediction

The key insight is that even complex models behave approximately linearly in small local regions.

**Q2: What are the main hyperparameters in LIME and how do they affect explanations?**

- **num_samples**: Number of perturbations generated. Higher values give more stable but slower explanations.
- **kernel_width**: Controls how much nearby samples are weighted. Smaller values focus on closer samples.
- **num_features**: Number of features in the explanation. Too few may miss important factors; too many adds noise.
- **segmentation (for images)**: How the image is divided into superpixels affects which regions can be identified as important.

**Q3: When would you choose LIME over SHAP?**

Choose LIME when:
- You need fast, approximate explanations
- Working with image or text data
- Complete model-agnosticism is required
- Theoretical guarantees are less important than speed

Choose SHAP when:
- You need theoretically sound explanations with additivity
- Working with tree-based models (TreeExplainer is very fast)
- Global feature importance is also needed
- Consistency across explanations is critical

**Q4: What are the limitations of LIME?**

- **Instability**: Explanations can vary between runs due to random sampling
- **Locality assumption**: Assumes local linearity which may not hold
- **Feature independence**: Ignores feature interactions
- **Faithfulness**: May not accurately represent the model's true reasoning
- **Hyperparameter sensitivity**: Results depend on tuning choices

**Q5: How would you validate that a LIME explanation is trustworthy?**

1. **Stability check**: Run multiple times and check consistency
2. **Ablation test**: Remove important features and verify prediction changes
3. **Sanity check**: Verify explanations match domain knowledge
4. **Comparison**: Compare with other methods (SHAP, permutation importance)
5. **Ensemble**: Use multiple runs to get confidence intervals

### Quick Reference Summary

```python
# Quick LIME Setup Reference

# For Tabular Data
import lime.lime_tabular
explainer = lime.lime_tabular.LimeTabularExplainer(
    training_data=X_train,
    feature_names=feature_names,
    class_names=class_names,
    categorical_features=[...],  # indices of categorical features
    mode='classification'  # or 'regression'
)
exp = explainer.explain_instance(instance, model.predict_proba, num_features=10)

# For Text
from lime.lime_text import LimeTextExplainer
text_explainer = LimeTextExplainer(class_names=['Negative', 'Positive'])
exp = text_explainer.explain_instance(text, model.predict_proba, num_features=10)

# For Images
from lime import lime_image
image_explainer = lime_image.LimeImageExplainer()
exp = image_explainer.explain_instance(
    image, model.predict_proba, top_labels=3, hide_color=0, num_samples=1000
)

# Get explanation as list
features_and_weights = exp.as_list()

# Visualize (in Jupyter)
exp.show_in_notebook()  # or
exp.as_pyplot_figure()
```

---

## Further Reading

### Original Paper and Resources

- **Original Paper**: Ribeiro, Singh, Guestrin (2016). "Why Should I Trust You?: Explaining the Predictions of Any Classifier"
- **LIME GitHub Repository**: https://github.com/marcotcr/lime
- **Official Documentation**: https://lime-ml.readthedocs.io/

### Related Interpretability Methods

- **SHAP (SHapley Additive exPlanations)**: Game-theoretic approach to feature importance
- **Anchors**: Rule-based explanations from the same authors as LIME
- **Integrated Gradients**: Gradient-based attributions for neural networks
- **Attention Mechanisms**: Built-in interpretability for transformer models
- **Concept Bottleneck Models**: Models designed for interpretability

### Recommended Books

- **"Interpretable Machine Learning"** by Christoph Molnar - Comprehensive guide to ML interpretability
- **"Explainable AI"** by Leilani Gilpin et al. - Academic perspective on XAI
- **"Machine Learning Interpretability"** by Patrick Hall - Practical approach to interpretability

### Related Code Wiki Articles

- [Machine Learning Fundamentals](/ai/ml-fundamentals) - Core ML concepts
- [Model Evaluation](/ai/model-evaluation) - Evaluating model performance
- [Deep Learning](/ai/deep-learning) - Neural network architectures
- [Natural Language Processing](/ai/nlp) - Text processing techniques

---

## Summary

LIME provides a practical approach to explaining predictions of any machine learning model. Its key strengths lie in model-agnosticism, applicability to various data types, and intuitive explanations based on local linear approximations.

**Key Takeaways:**

1. **Local Focus**: LIME explains individual predictions, not global model behavior
2. **Perturbation-Based**: Creates explanations by observing how predictions change with input variations
3. **Interpretable Approximations**: Uses simple models (typically linear) to approximate complex model behavior locally
4. **Data Type Flexibility**: Works with tabular, text, and image data through appropriate perturbation strategies
5. **Trade-offs**: Fast and flexible but may lack stability and theoretical guarantees compared to methods like SHAP

When using LIME in production:
- Always validate explanations against domain knowledge
- Use ensemble approaches for stability when reliability is critical
- Combine with other interpretability methods for comprehensive understanding
- Be transparent about the limitations when communicating explanations to stakeholders

Model interpretability is not just a technical requirement but an ethical imperative. As machine learning systems increasingly influence important decisions, understanding and explaining their behavior becomes essential for building trustworthy AI systems.
