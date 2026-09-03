---
title: 合成数据生成技术
description: 为AI/ML训练和测试生成高质量合成数据的完全指南
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - 合成数据
  - 数据生成
  - LLM
  - 数据增强
  - 隐私保护
  - 训练数据
status: imported
origin: old/src/content/docs/ai/synthetic-data.zh.md
divergence: 0.226
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: AI
  subcategory: ""
  order: 10
  lastUpdated: 2026-01-21
---

合成数据生成已成为现代AI/ML开发中的关键技术，使团队能够克服数据稀缺、保护隐私并创建多样化的训练数据集。本指南全面介绍了在各个领域生成高质量合成数据的原理、方法和最佳实践。

---

## 概念解释

### 什么是合成数据？

**合成数据**是人工生成的数据，它模仿真实世界数据的统计特性和模式，但不包含实际的真实世界观测值。它是通过算法、模拟或生成模型创建的，而不是从真实事件或测量中收集的。

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据生成光谱                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  真实数据 ──────────────────────────────────────► 合成数据       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 原始数据 │  │ 脱敏数据 │  │ 增强数据 │  │ 完全合成 │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│       │              │              │              │             │
│   包含真实      删除PII但       修改后的       从头生成          │
│   个人信息     保留结构         真实数据                         │
└─────────────────────────────────────────────────────────────────┘
```

### 为什么需要合成数据？

合成数据解决了AI/ML开发中的几个关键挑战：

| 挑战 | 合成数据如何帮助 |
|-----|-----------------|
| **数据稀缺** | 为罕见事件生成无限的训练样本 |
| **隐私问题** | 创建不暴露敏感信息的数据 |
| **成本降低** | 避免昂贵的数据收集和标注 |
| **偏差缓解** | 生成跨人口统计的平衡数据集 |
| **边缘案例** | 创建难以收集的罕见场景 |
| **快速原型** | 在真实数据可用之前进行开发 |
| **合规要求** | 满足GDPR、HIPAA要求而无需真实PII |

### 应用场景

```python
# 常见的合成数据用例
use_cases = {
    "LLM微调": {
        "description": "生成用于模型训练的指令-响应对",
        "example": "创建客服对话、代码解释",
        "benefit": "在无需人工标注的情况下扩展训练数据"
    },
    "软件测试": {
        "description": "为应用程序生成真实的测试数据",
        "example": "用户档案、交易记录、API响应",
        "benefit": "测试边缘案例和压力场景"
    },
    "医疗AI": {
        "description": "创建用于模型开发的患者记录",
        "example": "医学影像、电子病历数据、临床笔记",
        "benefit": "在不违反隐私的情况下开发AI"
    },
    "自动驾驶": {
        "description": "模拟驾驶场景",
        "example": "传感器数据、交通状况、天气条件",
        "benefit": "安全地训练危险场景"
    },
    "金融建模": {
        "description": "生成交易和市场数据",
        "example": "欺诈模式、交易数据、客户行为",
        "benefit": "在没有真实欺诈的情况下测试欺诈检测"
    },
    "少样本学习": {
        "description": "增强有限的标注数据集",
        "example": "生成现有样本的变体",
        "benefit": "用有限数据提高模型性能"
    }
}
```

---

## 核心原理

### 1. 基于规则的生成

最简单的方法是使用预定义的规则和模板来生成数据。

```python
import random
import string
from datetime import datetime, timedelta

class RuleBasedGenerator:
    """基于规则的合成数据生成器"""

    def __init__(self, seed=42):
        random.seed(seed)

    def generate_email(self, name: str, domains: list = None) -> str:
        """生成合成电子邮件地址"""
        domains = domains or ["example.com", "test.org", "sample.net"]
        username = name.lower().replace(" ", ".")
        noise = ''.join(random.choices(string.digits, k=3))
        return f"{username}{noise}@{random.choice(domains)}"

    def generate_phone(self, format: str = "CN") -> str:
        """生成合成电话号码"""
        if format == "CN":
            prefix = random.choice(["138", "139", "150", "151", "186", "187"])
            return f"+86-{prefix}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
        elif format == "US":
            area = random.randint(200, 999)
            exchange = random.randint(200, 999)
            subscriber = random.randint(1000, 9999)
            return f"+1-{area}-{exchange}-{subscriber}"

    def generate_transaction(self, user_id: str) -> dict:
        """生成合成交易记录"""
        categories = ["日用百货", "数码电子", "服装鞋帽", "餐饮美食", "旅游出行"]
        merchants = {
            "日用百货": ["超市优选", "新鲜生活", "绿色菜场"],
            "数码电子": ["科技数码", "数码天地", "电子商城"],
            "服装鞋帽": ["时尚前沿", "潮流衣橱", "品质服饰"],
            "餐饮美食": ["美味餐厅", "小厨美食", "美食广场"],
            "旅游出行": ["航空出行", "连锁酒店", "租车服务"]
        }

        category = random.choice(categories)
        amount_ranges = {
            "日用百货": (10, 200),
            "数码电子": (50, 2000),
            "服装鞋帽": (20, 500),
            "餐饮美食": (15, 150),
            "旅游出行": (100, 3000)
        }

        min_amt, max_amt = amount_ranges[category]

        return {
            "transaction_id": ''.join(random.choices(string.hexdigits, k=16)),
            "user_id": user_id,
            "timestamp": (datetime.now() - timedelta(days=random.randint(0, 365))).isoformat(),
            "amount": round(random.uniform(min_amt, max_amt), 2),
            "currency": "CNY",
            "category": category,
            "merchant": random.choice(merchants[category]),
            "status": random.choices(["completed", "pending", "failed"], weights=[0.95, 0.03, 0.02])[0]
        }

# 使用示例
generator = RuleBasedGenerator()
print(generator.generate_email("张三"))
print(generator.generate_transaction("user_123"))
```

### 2. 统计模型生成

使用从真实数据中学习的统计分布来生成新样本。

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple

class StatisticalGenerator:
    """基于统计分布生成数据"""

    def __init__(self):
        self.distributions = {}
        self.correlations = None

    def fit(self, data: np.ndarray, column_names: List[str]):
        """从真实数据中学习分布"""
        self.column_names = column_names
        n_cols = data.shape[1]

        for i, name in enumerate(column_names):
            col_data = data[:, i]
            best_dist = self._fit_best_distribution(col_data)
            self.distributions[name] = best_dist

        # 学习相关性
        self.correlations = np.corrcoef(data.T)

    def _fit_best_distribution(self, data: np.ndarray) -> Tuple[str, tuple]:
        """找到最佳拟合分布"""
        distributions = [
            ('norm', stats.norm),
            ('lognorm', stats.lognorm),
            ('expon', stats.expon),
        ]

        best_dist = None
        best_sse = float('inf')

        for name, dist in distributions:
            try:
                params = dist.fit(data)
                pdf = dist.pdf(np.sort(data), *params)
                hist, bin_edges = np.histogram(data, bins=50, density=True)
                bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
                expected = dist.pdf(bin_centers, *params)
                sse = np.sum((hist - expected) ** 2)

                if sse < best_sse:
                    best_sse = sse
                    best_dist = (name, params)
            except Exception:
                continue

        return best_dist or ('norm', stats.norm.fit(data))

    def generate(self, n_samples: int) -> np.ndarray:
        """生成保持相关性的新样本"""
        normal_samples = np.random.multivariate_normal(
            mean=np.zeros(len(self.column_names)),
            cov=self.correlations,
            size=n_samples
        )

        result = np.zeros_like(normal_samples)
        for i, name in enumerate(self.column_names):
            dist_name, params = self.distributions[name]
            dist = getattr(stats, dist_name)
            uniform = stats.norm.cdf(normal_samples[:, i])
            result[:, i] = dist.ppf(uniform, *params[:-2], loc=params[-2], scale=params[-1])

        return result
```

### 3. GAN/VAE生成

深度生成模型用于复杂数据生成。

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class VAE(nn.Module):
    """用于表格数据的变分自编码器"""

    def __init__(self, input_dim: int, latent_dim: int = 16):
        super().__init__()

        # 编码器
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
        )

        self.fc_mu = nn.Linear(64, latent_dim)
        self.fc_logvar = nn.Linear(64, latent_dim)

        # 解码器
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Linear(128, input_dim),
        )

    def encode(self, x):
        h = self.encoder(x)
        return self.fc_mu(h), self.fc_logvar(h)

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        return self.decoder(z)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        return self.decode(z), mu, logvar


def vae_loss(recon_x, x, mu, logvar):
    """VAE损失 = 重建损失 + KL散度"""
    recon_loss = nn.functional.mse_loss(recon_x, x, reduction='sum')
    kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon_loss + kl_loss
```

### 4. 基于LLM的生成

使用大型语言模型生成高质量的合成数据。

```python
import json
from openai import OpenAI
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class GenerationConfig:
    """LLM生成配置"""
    model: str = "gpt-4"
    temperature: float = 0.8
    max_tokens: int = 2048
    num_samples: int = 10

class LLMDataGenerator:
    """使用LLM生成合成数据"""

    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key)

    def generate_instruction_data(
        self,
        task_description: str,
        examples: List[Dict],
        num_samples: int = 10,
        config: GenerationConfig = None
    ) -> List[Dict]:
        """生成用于LLM微调的指令跟随数据"""

        config = config or GenerationConfig()

        examples_text = "\n".join([
            f"示例 {i+1}:\n指令: {ex['instruction']}\n"
            f"输入: {ex.get('input', '')}\n输出: {ex['output']}"
            for i, ex in enumerate(examples[:3])
        ])

        prompt = f"""你是一个数据生成专家。为以下任务生成{num_samples}个多样化的训练示例。

任务描述: {task_description}

以下是一些示例格式:
{examples_text}

要求:
1. 生成多样化且真实的示例
2. 保持与示例一致的格式
3. 确保高质量和准确性
4. 覆盖不同的边缘案例和场景
5. 输出为JSON数组

生成{num_samples}个新示例，JSON格式:
[{{"instruction": "...", "input": "...", "output": "..."}}]"""

        response = self.client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return result.get("examples", result) if isinstance(result, dict) else result
        except json.JSONDecodeError:
            return []

    def generate_conversation_data(
        self,
        scenario: str,
        persona: Dict,
        num_turns: int = 5,
        num_conversations: int = 10
    ) -> List[Dict]:
        """生成多轮对话数据"""

        prompt = f"""为以下场景生成{num_conversations}个真实的多轮对话。

场景: {scenario}

AI人设:
- 名称: {persona.get('name', '助手')}
- 角色: {persona.get('role', '有帮助的助手')}
- 特点: {persona.get('traits', '专业、友好、知识渊博')}

要求:
1. 每个对话应有大约{num_turns}轮
2. 包含自然的对话流程和后续问题
3. 覆盖各种用户意图和边缘案例
4. 在整个对话中保持一致的人设

输出格式为JSON数组:
[{{"conversation_id": "1", "messages": [{{"role": "user", "content": "..."}},
{{"role": "assistant", "content": "..."}}]}}]"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return result.get("conversations", result)
        except json.JSONDecodeError:
            return []
```

---

## 核心要点

### 数据类型和生成方法

```python
# 不同数据类型需要不同的生成方法

data_type_approaches = {
    "表格数据": {
        "methods": ["统计模型", "GAN (CTGAN)", "VAE", "SDV"],
        "challenges": ["混合类型", "相关性", "约束条件"],
        "tools": ["SDV", "Faker", "CTGAN", "Gretel"]
    },
    "文本": {
        "methods": ["LLM", "模板", "马尔可夫链", "Seq2Seq"],
        "challenges": ["连贯性", "事实性", "多样性"],
        "tools": ["GPT-4", "Claude", "Llama", "T5"]
    },
    "图像": {
        "methods": ["GAN", "扩散模型", "VAE", "3D渲染"],
        "challenges": ["质量", "多样性", "可控性"],
        "tools": ["Stable Diffusion", "DALL-E", "Midjourney"]
    },
    "时间序列": {
        "methods": ["统计(ARIMA)", "GAN", "Transformer"],
        "challenges": ["时间模式", "季节性", "趋势"],
        "tools": ["TimeGAN", "DoppelGANger", "Gretel"]
    }
}
```

### 质量评估指标

```python
import numpy as np
from scipy.stats import ks_2samp, wasserstein_distance
from sklearn.metrics import pairwise_distances
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

class SyntheticDataEvaluator:
    """评估合成数据质量"""

    def __init__(self, real_data: np.ndarray, synthetic_data: np.ndarray):
        self.real = real_data
        self.synthetic = synthetic_data

    def statistical_similarity(self) -> Dict:
        """比较统计特性"""
        results = {}

        for i in range(self.real.shape[1]):
            real_col = self.real[:, i]
            syn_col = self.synthetic[:, i]

            # Kolmogorov-Smirnov检验
            ks_stat, ks_pval = ks_2samp(real_col, syn_col)

            # Wasserstein距离
            w_dist = wasserstein_distance(real_col, syn_col)

            results[f"column_{i}"] = {
                "ks_statistic": ks_stat,
                "ks_pvalue": ks_pval,
                "wasserstein_distance": w_dist,
            }

        return results

    def privacy_score(self, k: int = 5) -> Dict:
        """使用最近记录距离评估隐私保护"""
        distances = pairwise_distances(self.synthetic, self.real)
        min_distances = distances.min(axis=1)

        dcr_mean = min_distances.mean()
        dcr_5th = np.percentile(min_distances, 5)

        threshold = np.percentile(pairwise_distances(self.real, self.real), 5)
        potential_copies = (min_distances < threshold).sum()

        return {
            "dcr_mean": dcr_mean,
            "dcr_5th_percentile": dcr_5th,
            "potential_memorization_count": potential_copies,
            "potential_memorization_rate": potential_copies / len(self.synthetic)
        }

    def utility_score(self, target_col: int = -1) -> Dict:
        """通过在合成数据上训练ML模型来评估效用"""
        X_real = np.delete(self.real, target_col, axis=1)
        y_real = self.real[:, target_col]

        X_syn = np.delete(self.synthetic, target_col, axis=1)
        y_syn = self.synthetic[:, target_col]

        y_real_disc = (y_real > np.median(y_real)).astype(int)
        y_syn_disc = (y_syn > np.median(y_syn)).astype(int)

        clf_real = RandomForestClassifier(n_estimators=100, random_state=42)
        real_score = cross_val_score(clf_real, X_real, y_real_disc, cv=5).mean()

        clf_syn = RandomForestClassifier(n_estimators=100, random_state=42)
        clf_syn.fit(X_syn, y_syn_disc)
        tstr_score = clf_syn.score(X_real, y_real_disc)

        return {
            "real_baseline_accuracy": real_score,
            "tstr_accuracy": tstr_score,
            "utility_ratio": tstr_score / real_score if real_score > 0 else 0
        }
```

### 隐私保证

```python
import numpy as np

class DifferentialPrivacy:
    """为合成数据实现差分隐私"""

    @staticmethod
    def add_laplace_noise(data: np.ndarray, epsilon: float, sensitivity: float) -> np.ndarray:
        """添加拉普拉斯噪声以实现epsilon-差分隐私"""
        scale = sensitivity / epsilon
        noise = np.random.laplace(0, scale, data.shape)
        return data + noise

    @staticmethod
    def add_gaussian_noise(
        data: np.ndarray,
        epsilon: float,
        delta: float,
        sensitivity: float
    ) -> np.ndarray:
        """添加高斯噪声以实现(epsilon, delta)-差分隐私"""
        sigma = sensitivity * np.sqrt(2 * np.log(1.25 / delta)) / epsilon
        noise = np.random.normal(0, sigma, data.shape)
        return data + noise

    @staticmethod
    def compute_sensitivity(data: np.ndarray, query_type: str = "mean") -> float:
        """计算常见查询的敏感度"""
        n = len(data)
        data_range = data.max() - data.min()

        sensitivities = {
            "mean": data_range / n,
            "sum": data_range,
            "count": 1,
        }

        return sensitivities.get(query_type, data_range)
```

---

## 代码示例

### 使用Faker生成真实测试数据

```python
from faker import Faker
import pandas as pd
from datetime import datetime, timedelta
import random

class RealisticDataGenerator:
    """使用Faker生成真实的假数据"""

    def __init__(self, locale: str = "zh_CN", seed: int = 42):
        self.fake = Faker(locale)
        Faker.seed(seed)
        random.seed(seed)

    def generate_user_profiles(self, n: int = 100) -> pd.DataFrame:
        """生成真实的用户档案"""
        users = []

        for _ in range(n):
            user = {
                "user_id": self.fake.uuid4(),
                "username": self.fake.user_name(),
                "email": self.fake.email(),
                "name": self.fake.name(),
                "phone": self.fake.phone_number(),
                "birth_date": self.fake.date_of_birth(minimum_age=18, maximum_age=80),
                "address": self.fake.address(),
                "city": self.fake.city(),
                "province": self.fake.province(),
                "job_title": self.fake.job(),
                "company": self.fake.company(),
                "created_at": self.fake.date_time_between(start_date="-2y", end_date="now"),
                "is_active": random.choice([True, True, True, False]),
                "subscription_tier": random.choices(
                    ["免费", "基础", "高级", "企业"],
                    weights=[0.5, 0.3, 0.15, 0.05]
                )[0]
            }
            users.append(user)

        return pd.DataFrame(users)

    def generate_ecommerce_data(self, n_orders: int = 1000) -> Dict[str, pd.DataFrame]:
        """生成完整的电商数据集"""

        categories = ["数码电子", "服装鞋帽", "家居用品", "图书音像", "运动户外"]
        products = []
        for i in range(100):
            category = random.choice(categories)
            products.append({
                "product_id": f"PROD_{i:04d}",
                "name": self.fake.catch_phrase(),
                "category": category,
                "price": round(random.uniform(9.99, 499.99), 2),
                "stock": random.randint(0, 500),
                "rating": round(random.uniform(3.0, 5.0), 1)
            })
        products_df = pd.DataFrame(products)

        customers = self.generate_user_profiles(200)

        orders = []
        order_items = []

        for i in range(n_orders):
            order_id = f"ORD_{i:06d}"
            customer = customers.sample(1).iloc[0]
            order_date = self.fake.date_time_between(start_date="-1y", end_date="now")

            order = {
                "order_id": order_id,
                "customer_id": customer["user_id"],
                "order_date": order_date,
                "status": random.choices(
                    ["待处理", "处理中", "已发货", "已完成", "已取消"],
                    weights=[0.05, 0.1, 0.15, 0.65, 0.05]
                )[0],
                "shipping_address": self.fake.address(),
                "payment_method": random.choice(["微信支付", "支付宝", "银行卡"])
            }
            orders.append(order)

            n_items = random.randint(1, 5)
            selected_products = products_df.sample(n_items)

            for _, product in selected_products.iterrows():
                quantity = random.randint(1, 3)
                order_items.append({
                    "order_id": order_id,
                    "product_id": product["product_id"],
                    "quantity": quantity,
                    "unit_price": product["price"],
                    "total_price": round(product["price"] * quantity, 2)
                })

        orders_df = pd.DataFrame(orders)
        order_items_df = pd.DataFrame(order_items)

        order_totals = order_items_df.groupby("order_id")["total_price"].sum().reset_index()
        order_totals.columns = ["order_id", "order_total"]
        orders_df = orders_df.merge(order_totals, on="order_id")

        return {
            "products": products_df,
            "customers": customers,
            "orders": orders_df,
            "order_items": order_items_df
        }


# 使用
gen = RealisticDataGenerator()
users = gen.generate_user_profiles(100)
ecommerce = gen.generate_ecommerce_data(500)

print(f"生成了 {len(users)} 个用户")
print(f"生成了 {len(ecommerce['orders'])} 个订单")
```

### 使用SDV进行表格数据合成

```python
# 安装: pip install sdv
from sdv.single_table import GaussianCopulaSynthesizer, CTGANSynthesizer
from sdv.metadata import SingleTableMetadata
from sdv.evaluation.single_table import evaluate_quality, run_diagnostic
import pandas as pd
import numpy as np

class SDVDataGenerator:
    """使用SDV生成合成表格数据"""

    def __init__(self, method: str = "gaussian_copula"):
        self.method = method
        self.synthesizer = None
        self.metadata = None

    def fit(self, data: pd.DataFrame, metadata: dict = None):
        """将合成器拟合到数据"""
        self.metadata = SingleTableMetadata()
        self.metadata.detect_from_dataframe(data)

        if metadata:
            for col, col_meta in metadata.items():
                if "sdtype" in col_meta:
                    self.metadata.update_column(col, sdtype=col_meta["sdtype"])

        if self.method == "gaussian_copula":
            self.synthesizer = GaussianCopulaSynthesizer(self.metadata)
        elif self.method == "ctgan":
            self.synthesizer = CTGANSynthesizer(self.metadata, epochs=300, verbose=True)
        else:
            raise ValueError(f"未知方法: {self.method}")

        self.synthesizer.fit(data)

    def generate(self, n_samples: int) -> pd.DataFrame:
        """生成合成样本"""
        if self.synthesizer is None:
            raise ValueError("必须先拟合合成器")
        return self.synthesizer.sample(n_samples)

    def evaluate(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame) -> dict:
        """评估合成数据质量"""
        diagnostic = run_diagnostic(
            real_data=real_data,
            synthetic_data=synthetic_data,
            metadata=self.metadata
        )

        quality_report = evaluate_quality(
            real_data=real_data,
            synthetic_data=synthetic_data,
            metadata=self.metadata
        )

        return {
            "diagnostic": diagnostic.get_results(),
            "quality_score": quality_report.get_score(),
        }


# 使用示例
real_data = pd.DataFrame({
    "age": np.random.normal(35, 10, 1000).astype(int).clip(18, 80),
    "income": np.random.lognormal(10.5, 0.5, 1000).astype(int),
    "credit_score": np.random.normal(700, 50, 1000).astype(int).clip(300, 850),
    "employment_type": np.random.choice(["全职", "兼职", "自由职业"], 1000),
    "default": np.random.choice([0, 1], 1000, p=[0.9, 0.1])
})

sdv_gen = SDVDataGenerator(method="gaussian_copula")
sdv_gen.fit(real_data)
synthetic_data = sdv_gen.generate(500)

results = sdv_gen.evaluate(real_data, synthetic_data)
print(f"质量分数: {results['quality_score']}")
```

### 文本数据增强

```python
import random
from typing import List

class TextAugmenter:
    """使用各种技术增强文本数据"""

    def synonym_replacement(self, text: str, n: int = 2) -> str:
        """用同义词替换n个随机词"""
        words = text.split()
        new_words = words.copy()

        # 简化的同义词映射（实际应用中使用词库）
        synonyms = {
            "好": ["优秀", "出色", "良好"],
            "坏": ["差", "糟糕", "不好"],
            "大": ["巨大", "庞大", "宏大"],
            "小": ["微小", "细小", "小巧"],
        }

        for i, word in enumerate(words):
            if word in synonyms and random.random() < 0.3:
                new_words[i] = random.choice(synonyms[word])

        return "".join(new_words)

    def random_swap(self, text: str, n: int = 1) -> str:
        """随机交换n对词"""
        words = list(text)
        for _ in range(n):
            if len(words) >= 2:
                idx1, idx2 = random.sample(range(len(words)), 2)
                words[idx1], words[idx2] = words[idx2], words[idx1]
        return "".join(words)

    def random_deletion(self, text: str, p: float = 0.1) -> str:
        """以概率p随机删除字符"""
        chars = list(text)
        if len(chars) == 1:
            return text
        new_chars = [char for char in chars if random.random() > p]
        if not new_chars:
            return random.choice(chars)
        return "".join(new_chars)

    def augment(self, text: str, n_augmented: int = 4) -> List[str]:
        """应用多种增强技术"""
        techniques = [
            self.synonym_replacement,
            self.random_swap,
            self.random_deletion,
        ]

        augmented = []
        for _ in range(n_augmented):
            technique = random.choice(techniques)
            aug_text = technique(text)
            if aug_text != text:
                augmented.append(aug_text)

        return list(set(augmented))


# 使用
augmenter = TextAugmenter()
original = "机器学习模型需要大量的训练数据才能达到良好的性能。"
augmented = augmenter.augment(original, n_augmented=5)
print("原文:", original)
print("增强版本:", augmented)
```

---

## 最佳实践

### 数据验证框架

```python
from dataclasses import dataclass
from typing import List, Dict, Callable
import pandas as pd
import numpy as np

@dataclass
class ValidationRule:
    """定义验证规则"""
    name: str
    check_fn: Callable[[pd.DataFrame], bool]
    error_message: str
    severity: str = "error"

class SyntheticDataValidator:
    """验证合成数据质量"""

    def __init__(self):
        self.rules: List[ValidationRule] = []

    def add_rule(self, rule: ValidationRule):
        """添加验证规则"""
        self.rules.append(rule)

    def add_schema_rules(self, schema: Dict):
        """基于模式添加规则"""
        for col, spec in schema.items():
            if "min" in spec or "max" in spec:
                self.rules.append(ValidationRule(
                    name=f"{col}_range_check",
                    check_fn=lambda df, c=col, mn=spec.get("min"), mx=spec.get("max"):
                        self._check_range(df, c, mn, mx),
                    error_message=f"列 {col} 的值超出范围"
                ))

            if spec.get("nullable") == False:
                self.rules.append(ValidationRule(
                    name=f"{col}_null_check",
                    check_fn=lambda df, c=col: not df[c].isna().any(),
                    error_message=f"列 {col} 包含空值"
                ))

    def _check_range(self, df: pd.DataFrame, col: str, min_val, max_val) -> bool:
        if min_val is not None and df[col].min() < min_val:
            return False
        if max_val is not None and df[col].max() > max_val:
            return False
        return True

    def validate(self, data: pd.DataFrame) -> Dict:
        """运行所有验证规则"""
        results = {"passed": [], "failed": [], "warnings": []}

        for rule in self.rules:
            try:
                if rule.check_fn(data):
                    results["passed"].append(rule.name)
                else:
                    if rule.severity == "error":
                        results["failed"].append({
                            "rule": rule.name,
                            "message": rule.error_message
                        })
                    else:
                        results["warnings"].append({
                            "rule": rule.name,
                            "message": rule.error_message
                        })
            except Exception as e:
                results["failed"].append({
                    "rule": rule.name,
                    "message": f"验证错误: {str(e)}"
                })

        results["is_valid"] = len(results["failed"]) == 0
        return results
```

### 多样性保证

```python
from sklearn.cluster import KMeans
import numpy as np

class DiversityAnalyzer:
    """分析并确保合成数据的多样性"""

    def __init__(self, real_data: np.ndarray, synthetic_data: np.ndarray):
        self.real = real_data
        self.synthetic = synthetic_data

    def coverage_analysis(self, n_clusters: int = 10) -> Dict:
        """分析合成数据对真实数据空间的覆盖程度"""
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        real_clusters = kmeans.fit_predict(self.real)
        syn_clusters = kmeans.predict(self.synthetic)

        real_cluster_counts = np.bincount(real_clusters, minlength=n_clusters)
        syn_cluster_counts = np.bincount(syn_clusters, minlength=n_clusters)

        covered_clusters = (syn_cluster_counts > 0).sum()

        real_dist = real_cluster_counts / real_cluster_counts.sum()
        syn_dist = syn_cluster_counts / syn_cluster_counts.sum()

        kl_div = np.sum(real_dist * np.log((real_dist + 1e-10) / (syn_dist + 1e-10)))

        return {
            "n_clusters": n_clusters,
            "covered_clusters": covered_clusters,
            "coverage_ratio": covered_clusters / n_clusters,
            "kl_divergence": kl_div,
        }

    def suggest_improvements(self) -> List[str]:
        """建议改进多样性的方法"""
        suggestions = []
        coverage = self.coverage_analysis()

        if coverage["coverage_ratio"] < 0.8:
            suggestions.append(
                f"覆盖率低 ({coverage['coverage_ratio']:.2%}): "
                "考虑更长时间的训练或使用条件生成"
            )

        if coverage["kl_divergence"] > 0.5:
            suggestions.append(
                f"分布不匹配程度高 (KL={coverage['kl_divergence']:.3f}): "
                "考虑调整采样策略"
            )

        unique_ratio = len(np.unique(self.synthetic, axis=0)) / len(self.synthetic)
        if unique_ratio < 0.95:
            suggestions.append(
                f"唯一性低 ({unique_ratio:.2%}): "
                "可能存在模式崩溃 - 增加多样性"
            )

        return suggestions
```

---

## 常见陷阱

### 1. 数据偏差和分布偏移

```python
class BiasDetector:
    """检测和缓解合成数据中的偏差"""

    def __init__(self, real_data: pd.DataFrame, synthetic_data: pd.DataFrame):
        self.real = real_data
        self.synthetic = synthetic_data

    def detect_representation_bias(self, sensitive_columns: List[str]) -> Dict:
        """检测敏感属性中的代表性偏差"""
        results = {}

        for col in sensitive_columns:
            real_dist = self.real[col].value_counts(normalize=True)
            syn_dist = self.synthetic[col].value_counts(normalize=True)

            all_values = set(real_dist.index) | set(syn_dist.index)

            bias_scores = {}
            for value in all_values:
                real_pct = real_dist.get(value, 0)
                syn_pct = syn_dist.get(value, 0)

                if real_pct > 0:
                    ratio = syn_pct / real_pct
                else:
                    ratio = float('inf') if syn_pct > 0 else 1.0

                bias_scores[value] = {
                    "real_percentage": real_pct,
                    "synthetic_percentage": syn_pct,
                    "representation_ratio": ratio,
                    "is_underrepresented": ratio < 0.8,
                    "is_overrepresented": ratio > 1.2
                }

            results[col] = bias_scores

        return results
```

### 2. 过拟合和记忆化

```python
class MemorizationDetector:
    """检测合成数据是否记忆了真实数据"""

    def __init__(self, real_data: np.ndarray, synthetic_data: np.ndarray):
        self.real = real_data
        self.synthetic = synthetic_data

    def nearest_neighbor_analysis(self, k: int = 1) -> Dict:
        """检查合成样本是否与真实样本过于接近"""
        from sklearn.neighbors import NearestNeighbors

        nn = NearestNeighbors(n_neighbors=k)
        nn.fit(self.real)
        distances, indices = nn.kneighbors(self.synthetic)

        nn_real = NearestNeighbors(n_neighbors=k+1)
        nn_real.fit(self.real)
        real_distances, _ = nn_real.kneighbors(self.real)
        real_distances = real_distances[:, 1:]

        syn_median_dist = np.median(distances)
        real_median_dist = np.median(real_distances)

        threshold = np.percentile(real_distances, 5)
        potential_copies = (distances[:, 0] < threshold).sum()

        return {
            "synthetic_median_distance": syn_median_dist,
            "real_median_distance": real_median_dist,
            "distance_ratio": syn_median_dist / real_median_dist,
            "potential_memorization_count": potential_copies,
            "potential_memorization_rate": potential_copies / len(self.synthetic),
            "warning": potential_copies > 0.01 * len(self.synthetic)
        }
```

### 3. 隐私泄露

```python
class PrivacyRiskAssessor:
    """评估合成数据中的隐私风险"""

    def membership_inference_attack(
        self,
        real_data: np.ndarray,
        synthetic_data: np.ndarray,
        holdout_data: np.ndarray
    ) -> Dict:
        """模拟成员推断攻击"""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import cross_val_score

        member_features = self._compute_similarity_features(real_data, synthetic_data)
        nonmember_features = self._compute_similarity_features(holdout_data, synthetic_data)

        X = np.vstack([member_features, nonmember_features])
        y = np.array([1] * len(member_features) + [0] * len(nonmember_features))

        attack_model = RandomForestClassifier(n_estimators=100, random_state=42)
        scores = cross_val_score(attack_model, X, y, cv=5, scoring='accuracy')

        return {
            "attack_accuracy_mean": scores.mean(),
            "attack_accuracy_std": scores.std(),
            "privacy_risk": "高" if scores.mean() > 0.6 else "中" if scores.mean() > 0.55 else "低",
        }

    def _compute_similarity_features(self, query_data: np.ndarray, synthetic_data: np.ndarray) -> np.ndarray:
        """计算成员推断的特征"""
        features = []
        for query in query_data:
            distances = np.linalg.norm(synthetic_data - query, axis=1)
            features.append([
                distances.min(),
                distances.mean(),
                np.percentile(distances, 10),
                (distances < np.percentile(distances, 5)).sum()
            ])
        return np.array(features)
```

---

## 性能考量

### 生成效率

```python
import time
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

class EfficientGenerator:
    """优化合成数据生成的性能"""

    def __init__(self, generator_fn, batch_size: int = 1000):
        self.generator_fn = generator_fn
        self.batch_size = batch_size

    def generate_parallel(
        self,
        n_samples: int,
        n_workers: int = 4,
        use_processes: bool = False
    ) -> np.ndarray:
        """并行生成数据"""
        n_batches = (n_samples + self.batch_size - 1) // self.batch_size
        batch_sizes = [self.batch_size] * (n_batches - 1)
        batch_sizes.append(n_samples - sum(batch_sizes))

        executor_class = ProcessPoolExecutor if use_processes else ThreadPoolExecutor

        with executor_class(max_workers=n_workers) as executor:
            results = list(executor.map(self.generator_fn, batch_sizes))

        return np.vstack(results)


class PerformanceBenchmark:
    """基准测试生成性能"""

    @staticmethod
    def benchmark_generator(
        generator_fn,
        sample_sizes: List[int] = [100, 1000, 10000],
        n_runs: int = 3
    ) -> Dict:
        """基准测试生成速度"""
        results = {}

        for n in sample_sizes:
            times = []
            for _ in range(n_runs):
                start = time.time()
                _ = generator_fn(n)
                elapsed = time.time() - start
                times.append(elapsed)

            results[n] = {
                "mean_time": np.mean(times),
                "std_time": np.std(times),
                "samples_per_second": n / np.mean(times)
            }

        return results
```

### 成本控制

```python
class CostController:
    """控制基于LLM生成的成本"""

    MODEL_COSTS = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    }

    def __init__(self, budget: float, model: str = "gpt-4"):
        self.budget = budget
        self.model = model
        self.spent = 0
        self.token_counts = {"input": 0, "output": 0}

    def estimate_cost(
        self,
        n_samples: int,
        avg_input_tokens: int = 500,
        avg_output_tokens: int = 200
    ) -> Dict:
        """估算生成成本"""
        costs = self.MODEL_COSTS.get(self.model, self.MODEL_COSTS["gpt-4"])

        total_input = n_samples * avg_input_tokens
        total_output = n_samples * avg_output_tokens

        input_cost = (total_input / 1000) * costs["input"]
        output_cost = (total_output / 1000) * costs["output"]

        return {
            "estimated_total_cost": input_cost + output_cost,
            "within_budget": (input_cost + output_cost) <= self.budget
        }

    def track_usage(self, input_tokens: int, output_tokens: int):
        """跟踪实际使用情况"""
        costs = self.MODEL_COSTS.get(self.model, self.MODEL_COSTS["gpt-4"])

        self.token_counts["input"] += input_tokens
        self.token_counts["output"] += output_tokens

        cost = (input_tokens / 1000) * costs["input"] + \
               (output_tokens / 1000) * costs["output"]

        self.spent += cost

        if self.spent >= self.budget * 0.9:
            print(f"警告: 接近预算限制。已花费: ${self.spent:.2f}")

        return self.budget - self.spent
```

---

## 实战场景

### LLM微调数据生成

```python
class FineTuningDataGenerator:
    """为LLM生成高质量的微调数据"""

    def __init__(self, client=None):
        from openai import OpenAI
        self.client = client or OpenAI()

    def generate_instruction_dataset(
        self,
        domain: str,
        task_types: List[str],
        n_samples_per_task: int = 100,
        complexity_levels: List[str] = ["简单", "中等", "困难"]
    ) -> List[Dict]:
        """生成多样化的指令跟随数据集"""
        all_samples = []

        for task_type in task_types:
            for complexity in complexity_levels:
                samples = self._generate_task_samples(
                    domain=domain,
                    task_type=task_type,
                    complexity=complexity,
                    n_samples=n_samples_per_task // len(complexity_levels)
                )
                all_samples.extend(samples)

        return all_samples

    def _generate_task_samples(
        self,
        domain: str,
        task_type: str,
        complexity: str,
        n_samples: int
    ) -> List[Dict]:
        """为特定任务类型生成样本"""
        prompt = f"""为AI助手生成{n_samples}个多样化的训练示例。

领域: {domain}
任务类型: {task_type}
复杂度: {complexity}

要求:
1. 指令应该自然且多样
2. 响应应该准确且有帮助
3. 包含边缘案例和真实场景

输出为JSON数组:
[{{"instruction": "...", "input": "...", "output": "..."}}]"""

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.9,
            max_tokens=4096,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        samples = result.get("examples", result.get("data", result))

        for sample in samples:
            sample["metadata"] = {
                "domain": domain,
                "task_type": task_type,
                "complexity": complexity,
            }

        return samples
```

### 隐私保护数据共享

```python
class PrivacyPreservingDataSharing:
    """生成用于安全数据共享的合成数据"""

    def __init__(self, epsilon: float = 1.0):
        self.epsilon = epsilon

    def create_shareable_dataset(
        self,
        sensitive_data: pd.DataFrame,
        sensitive_columns: List[str],
        quasi_identifiers: List[str]
    ) -> pd.DataFrame:
        """创建可安全共享的合成数据集"""
        synthetic = self._generate_synthetic_base(sensitive_data)
        synthetic = self._apply_k_anonymity(synthetic, quasi_identifiers, k=5)

        for col in sensitive_columns:
            if pd.api.types.is_numeric_dtype(synthetic[col]):
                sensitivity = sensitive_data[col].max() - sensitive_data[col].min()
                noise = np.random.laplace(0, sensitivity / self.epsilon, len(synthetic))
                synthetic[col] = synthetic[col] + noise

        return synthetic

    def _generate_synthetic_base(self, data: pd.DataFrame) -> pd.DataFrame:
        """生成保留分布的基础合成数据"""
        synthetic = pd.DataFrame()

        for col in data.columns:
            if pd.api.types.is_numeric_dtype(data[col]):
                mean, std = data[col].mean(), data[col].std()
                synthetic[col] = np.random.normal(mean, std, len(data))
            else:
                value_counts = data[col].value_counts(normalize=True)
                synthetic[col] = np.random.choice(
                    value_counts.index,
                    size=len(data),
                    p=value_counts.values
                )

        return synthetic

    def _apply_k_anonymity(
        self,
        data: pd.DataFrame,
        quasi_identifiers: List[str],
        k: int = 5
    ) -> pd.DataFrame:
        """通过泛化应用k-匿名性"""
        result = data.copy()

        for col in quasi_identifiers:
            if pd.api.types.is_numeric_dtype(result[col]):
                result[col] = pd.cut(result[col], bins=20, labels=False)
            elif result[col].dtype == object:
                value_counts = result[col].value_counts()
                rare_values = value_counts[value_counts < k].index
                result.loc[result[col].isin(rare_values), col] = "其他"

        return result
```

---

## 面试要点

### 概念性问题

**Q1: 什么是合成数据，为什么它对AI/ML很重要？**

关键点:
1. 定义: 人工生成的模仿真实世界数据特性的数据
2. 重要性: 解决数据稀缺、实现符合隐私的开发、降低成本
3. 权衡: 可能无法捕获所有真实世界的细微差别、需要验证

**Q2: 比较不同的合成数据生成方法**

| 方法 | 优点 | 缺点 | 最适合 |
|------|------|------|--------|
| 基于规则 | 简单、可控 | 真实性有限 | 测试数据 |
| 统计 | 保留分布 | 假设参数形式 | 表格数据 |
| GAN/VAE | 高质量 | 训练困难 | 图像、复杂数据 |
| 基于LLM | 自然文本、灵活 | 成本、幻觉风险 | 文本、指令 |

**Q3: 如何确保合成数据质量？**

关键点:
1. 统计验证: 比较分布、验证相关性
2. 效用测试: 合成训练真实测试（TSTR）评估
3. 隐私评估: 到最近记录的距离、成员推断攻击
4. 人工审查: 基于样本的质量审计

**Q4: 解释合成数据中的隐私-效用权衡**

关键点:
1. 更多隐私保护通常意味着更少数据效用
2. 使用适当的epsilon值进行差分隐私
3. 用隐私攻击验证
4. 记录隐私保证

---

## 延伸阅读

### 重要论文

1. **"Generating Diverse High-Fidelity Images with VQ-VAE-2"** (Razavi et al., 2019)
2. **"Self-Instruct: Aligning Language Models with Self-Generated Instructions"** (Wang et al., 2022)
3. **"Synthetic Data Generation for Tabular Data"** (Xu et al., 2019)
4. **"Differential Privacy: A Survey of Results"** (Dwork, 2008)

### 工具和库

- **[SDV (Synthetic Data Vault)](https://sdv.dev/)** - 综合表格数据合成
- **[Faker](https://faker.readthedocs.io/)** - 真实假数据生成
- **[Gretel.ai](https://gretel.ai/)** - 企业合成数据平台
- **[CTGAN](https://github.com/sdv-dev/CTGAN)** - 用于表格数据的GAN

---

## 总结

合成数据生成是AI/ML开发的强大技术。主要要点：

1. **选择正确的方法**: 简单模式用基于规则，表格数据用统计模型，复杂模式用GAN/VAE，文本用LLM
2. **质量至关重要**: 始终通过统计测试、效用评估和专家审查来验证
3. **隐私需要严谨**: 使用差分隐私，用攻击验证，记录保证
4. **迭代和改进**: 监控质量，检测偏差和记忆化，不断改进
5. **平衡权衡**: 根据需求管理隐私-效用权衡

掌握这些技术以构建健壮、符合隐私要求且高性能的AI系统。
