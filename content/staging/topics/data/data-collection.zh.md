---
title: 数据收集与标注技术
description: 掌握机器学习数据收集全流程：爬虫、API获取和数据标注平台
track: data
section: data-engineering
difficulty: intermediate
tags:
  - 数据收集
  - 爬虫
  - 标注
  - 数据工程
status: imported
origin: old/src/content/docs/datascience/data-collection.zh.md
divergence: 0.329
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 4
  lastUpdated: 2026-01-07
---

在机器学习项目中，数据质量决定了模型的上限，而算法和调优只是在逼近这个上限。本文将全面介绍数据收集的核心策略、技术实现以及数据标注的最佳实践，帮助你建立起完整的数据工程知识体系。

## 数据收集策略

### 数据需求分析

在开始收集数据之前，需要明确以下关键问题：

| 维度 | 关键问题 | 考虑因素 |
|------|----------|----------|
| 数据规模 | 需要多少数据？ | 模型复杂度、任务难度、过拟合风险 |
| 数据类型 | 结构化还是非结构化？ | 文本、图像、音频、表格数据 |
| 数据来源 | 从哪里获取数据？ | 公开数据集、API、爬虫、用户生成 |
| 数据质量 | 如何保证质量？ | 准确性、完整性、一致性、时效性 |
| 合规性 | 是否符合法规？ | GDPR、隐私保护、版权问题 |

### 数据收集方法对比

```python
"""
数据收集方法选择决策框架
"""

def choose_collection_method(requirements: dict) -> str:
    """
    根据需求选择最合适的数据收集方法

    Args:
        requirements: 包含数据需求的字典

    Returns:
        推荐的数据收集方法
    """
    # 检查是否有现成数据集
    if requirements.get('public_dataset_available'):
        return "使用公开数据集"

    # 检查是否有官方 API
    if requirements.get('official_api_available'):
        return "API 数据获取"

    # 检查数据量需求
    if requirements.get('data_volume') == 'large':
        if requirements.get('real_time_required'):
            return "流式数据采集"
        return "大规模爬虫系统"

    # 小规模数据收集
    if requirements.get('structured'):
        return "定向爬虫"

    return "手动收集 + 众包标注"


# 常见数据收集场景
collection_scenarios = {
    "情感分析": {
        "sources": ["社交媒体API", "评论数据爬取", "公开情感数据集"],
        "recommended": "Twitter/微博 API + 公开数据集补充"
    },
    "图像分类": {
        "sources": ["ImageNet", "自建数据集", "图片搜索爬取"],
        "recommended": "公开数据集 + 领域特定数据收集"
    },
    "问答系统": {
        "sources": ["SQuAD", "知识图谱", "论坛问答爬取"],
        "recommended": "公开数据集 + 领域知识库构建"
    }
}
```

### 数据量估算

机器学习项目中数据量的经验法则：

| 任务类型 | 最小数据量 | 推荐数据量 | 备注 |
|----------|------------|------------|------|
| 简单分类 | 每类 100+ 样本 | 每类 1000+ 样本 | 类别数越多需要越多数据 |
| 复杂分类 | 每类 1000+ 样本 | 每类 10000+ 样本 | 如细粒度图像分类 |
| 目标检测 | 1000+ 标注图像 | 10000+ 标注图像 | 每个目标类别需要足够实例 |
| NLP 任务 | 10000+ 样本 | 100000+ 样本 | 预训练模型可降低需求 |
| 深度学习 | 10000+ 样本 | 100000+ 样本 | 迁移学习可降低需求 |

## Web 爬虫技术

### 爬虫基础架构

```python
"""
通用爬虫框架基础实现
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import random
from typing import List, Dict, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CrawlerConfig:
    """爬虫配置类"""
    base_url: str
    max_pages: int = 100
    delay_range: tuple = (1, 3)  # 请求间隔范围（秒）
    timeout: int = 10
    max_retries: int = 3
    concurrent_requests: int = 5
    user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


class WebCrawler:
    """通用网页爬虫基类"""

    def __init__(self, config: CrawlerConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': config.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        })
        self.visited_urls = set()
        self.collected_data = []

    def _random_delay(self):
        """随机延迟，避免被封禁"""
        delay = random.uniform(*self.config.delay_range)
        time.sleep(delay)

    def _fetch_page(self, url: str) -> Optional[str]:
        """获取页面内容"""
        for attempt in range(self.config.max_retries):
            try:
                self._random_delay()
                response = self.session.get(
                    url,
                    timeout=self.config.timeout
                )
                response.raise_for_status()
                response.encoding = response.apparent_encoding
                return response.text
            except requests.RequestException as e:
                logger.warning(f"请求失败 (尝试 {attempt + 1}): {url}, 错误: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(2 ** attempt)  # 指数退避
        return None

    def parse_page(self, html: str, url: str) -> Dict:
        """解析页面内容（子类需要重写）"""
        raise NotImplementedError

    def extract_links(self, html: str, base_url: str) -> List[str]:
        """提取页面中的链接"""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            full_url = urljoin(base_url, href)
            # 只保留同域名链接
            if urlparse(full_url).netloc == urlparse(base_url).netloc:
                links.append(full_url)
        return links

    def crawl(self, start_url: str) -> List[Dict]:
        """执行爬取"""
        urls_to_visit = [start_url]

        while urls_to_visit and len(self.visited_urls) < self.config.max_pages:
            url = urls_to_visit.pop(0)

            if url in self.visited_urls:
                continue

            logger.info(f"正在爬取: {url}")
            html = self._fetch_page(url)

            if html:
                self.visited_urls.add(url)

                # 解析数据
                data = self.parse_page(html, url)
                if data:
                    self.collected_data.append(data)

                # 提取新链接
                new_links = self.extract_links(html, url)
                for link in new_links:
                    if link not in self.visited_urls:
                        urls_to_visit.append(link)

        logger.info(f"爬取完成，共收集 {len(self.collected_data)} 条数据")
        return self.collected_data
```

### 新闻数据爬虫示例

```python
"""
新闻数据爬虫实现示例
"""
from datetime import datetime
import re
import json


class NewsCrawler(WebCrawler):
    """新闻爬虫实现"""

    def parse_page(self, html: str, url: str) -> Optional[Dict]:
        """解析新闻页面"""
        soup = BeautifulSoup(html, 'html.parser')

        # 提取标题
        title_tag = soup.find('h1') or soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else None

        # 提取正文
        article_selectors = [
            'article',
            '.article-content',
            '.post-content',
            '#content',
            '.entry-content'
        ]
        content = None
        for selector in article_selectors:
            content_tag = soup.select_one(selector)
            if content_tag:
                # 移除脚本和样式
                for tag in content_tag.find_all(['script', 'style']):
                    tag.decompose()
                content = content_tag.get_text(separator='\n', strip=True)
                break

        # 提取发布时间
        time_patterns = [
            r'\d{4}[-/]\d{1,2}[-/]\d{1,2}',
            r'\d{4}年\d{1,2}月\d{1,2}日'
        ]
        publish_time = None
        for pattern in time_patterns:
            match = re.search(pattern, html)
            if match:
                publish_time = match.group()
                break

        # 提取元数据
        meta_keywords = soup.find('meta', attrs={'name': 'keywords'})
        keywords = meta_keywords.get('content', '') if meta_keywords else ''

        if title and content and len(content) > 100:
            return {
                'url': url,
                'title': title,
                'content': content,
                'publish_time': publish_time,
                'keywords': keywords,
                'crawl_time': datetime.now().isoformat()
            }
        return None


# 使用示例
def crawl_news_example():
    config = CrawlerConfig(
        base_url="https://example-news.com",
        max_pages=50,
        delay_range=(2, 5),
        concurrent_requests=3
    )

    crawler = NewsCrawler(config)
    news_data = crawler.crawl("https://example-news.com/news")

    # 保存数据
    with open('news_data.json', 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)

    return news_data
```

### Scrapy 框架实战

```python
"""
使用 Scrapy 框架构建生产级爬虫
文件结构：
project/
├── scrapy.cfg
├── myspider/
│   ├── __init__.py
│   ├── items.py
│   ├── middlewares.py
│   ├── pipelines.py
│   ├── settings.py
│   └── spiders/
│       └── news_spider.py
"""

# items.py - 数据模型定义
import scrapy


class NewsItem(scrapy.Item):
    """新闻数据项"""
    url = scrapy.Field()
    title = scrapy.Field()
    content = scrapy.Field()
    author = scrapy.Field()
    publish_time = scrapy.Field()
    category = scrapy.Field()
    tags = scrapy.Field()
    crawl_time = scrapy.Field()


# spiders/news_spider.py - 爬虫定义
import scrapy
from scrapy.linkextractors import LinkExtractor
from scrapy.spiders import CrawlSpider, Rule
from datetime import datetime


class NewsSpider(CrawlSpider):
    """新闻网站爬虫"""
    name = 'news_spider'
    allowed_domains = ['example.com']
    start_urls = ['https://example.com/news']

    # 链接提取规则
    rules = (
        Rule(
            LinkExtractor(allow=r'/news/\d+'),
            callback='parse_news',
            follow=True
        ),
        Rule(
            LinkExtractor(allow=r'/category/'),
            follow=True
        ),
    )

    def parse_news(self, response):
        """解析新闻详情页"""
        item = NewsItem()

        item['url'] = response.url
        item['title'] = response.css('h1.title::text').get()
        item['content'] = '\n'.join(
            response.css('div.article-body p::text').getall()
        )
        item['author'] = response.css('.author-name::text').get()
        item['publish_time'] = response.css('.publish-time::text').get()
        item['category'] = response.css('.category::text').get()
        item['tags'] = response.css('.tags a::text').getall()
        item['crawl_time'] = datetime.now().isoformat()

        yield item


# pipelines.py - 数据处理管道
import json
from itemadapter import ItemAdapter


class JsonPipeline:
    """JSON 文件存储管道"""

    def open_spider(self, spider):
        self.file = open('news_output.jsonl', 'w', encoding='utf-8')

    def close_spider(self, spider):
        self.file.close()

    def process_item(self, item, spider):
        line = json.dumps(
            ItemAdapter(item).asdict(),
            ensure_ascii=False
        ) + '\n'
        self.file.write(line)
        return item


class DataCleaningPipeline:
    """数据清洗管道"""

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)

        # 清理标题
        if adapter.get('title'):
            adapter['title'] = adapter['title'].strip()

        # 清理正文
        if adapter.get('content'):
            content = adapter['content']
            # 移除多余空白
            content = ' '.join(content.split())
            adapter['content'] = content

        # 验证必要字段
        if not adapter.get('title') or not adapter.get('content'):
            raise DropItem(f"缺少必要字段: {item}")

        return item


# settings.py - 配置文件
"""
# Scrapy 配置
BOT_NAME = 'myspider'
SPIDER_MODULES = ['myspider.spiders']

# 遵守 robots.txt
ROBOTSTXT_OBEY = True

# 并发设置
CONCURRENT_REQUESTS = 16
CONCURRENT_REQUESTS_PER_DOMAIN = 8
DOWNLOAD_DELAY = 1

# 中间件
DOWNLOADER_MIDDLEWARES = {
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
    'myspider.middlewares.RandomUserAgentMiddleware': 400,
}

# 管道
ITEM_PIPELINES = {
    'myspider.pipelines.DataCleaningPipeline': 300,
    'myspider.pipelines.JsonPipeline': 400,
}

# 日志
LOG_LEVEL = 'INFO'

# 重试设置
RETRY_ENABLED = True
RETRY_TIMES = 3

# 缓存
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 86400
"""
```

### 异步爬虫与性能优化

```python
"""
使用 aiohttp 实现高性能异步爬虫
"""
import asyncio
import aiohttp
from aiohttp import ClientSession, TCPConnector
from bs4 import BeautifulSoup
from typing import List, Dict, Set
import logging
from dataclasses import dataclass, field
from asyncio import Semaphore

logger = logging.getLogger(__name__)


@dataclass
class AsyncCrawlerConfig:
    """异步爬虫配置"""
    max_concurrent: int = 50  # 最大并发数
    timeout: int = 30
    max_retries: int = 3
    delay: float = 0.1  # 请求间隔


class AsyncWebCrawler:
    """高性能异步爬虫"""

    def __init__(self, config: AsyncCrawlerConfig):
        self.config = config
        self.semaphore = Semaphore(config.max_concurrent)
        self.visited: Set[str] = set()
        self.results: List[Dict] = []

    async def fetch(
        self,
        session: ClientSession,
        url: str
    ) -> str | None:
        """异步获取页面"""
        async with self.semaphore:
            for attempt in range(self.config.max_retries):
                try:
                    async with session.get(
                        url,
                        timeout=aiohttp.ClientTimeout(
                            total=self.config.timeout
                        )
                    ) as response:
                        if response.status == 200:
                            return await response.text()
                        elif response.status == 429:  # Too Many Requests
                            await asyncio.sleep(2 ** attempt)
                except Exception as e:
                    logger.warning(f"请求失败: {url}, 错误: {e}")
                    if attempt < self.config.max_retries - 1:
                        await asyncio.sleep(1)
            return None

    async def parse(self, html: str, url: str) -> Dict | None:
        """解析页面（子类重写）"""
        raise NotImplementedError

    async def crawl_url(
        self,
        session: ClientSession,
        url: str
    ) -> Dict | None:
        """爬取单个 URL"""
        if url in self.visited:
            return None

        self.visited.add(url)
        html = await self.fetch(session, url)

        if html:
            result = await self.parse(html, url)
            if result:
                self.results.append(result)
                return result
        return None

    async def crawl(self, urls: List[str]) -> List[Dict]:
        """批量爬取"""
        connector = TCPConnector(
            limit=self.config.max_concurrent,
            limit_per_host=10
        )

        async with ClientSession(connector=connector) as session:
            tasks = [
                self.crawl_url(session, url)
                for url in urls
            ]
            await asyncio.gather(*tasks)

        return self.results


class AsyncProductCrawler(AsyncWebCrawler):
    """商品信息异步爬虫示例"""

    async def parse(self, html: str, url: str) -> Dict | None:
        """解析商品页面"""
        soup = BeautifulSoup(html, 'html.parser')

        try:
            return {
                'url': url,
                'name': soup.select_one('.product-name')
                           .get_text(strip=True),
                'price': soup.select_one('.price')
                            .get_text(strip=True),
                'description': soup.select_one('.description')
                                   .get_text(strip=True),
                'rating': soup.select_one('.rating')
                              .get_text(strip=True),
            }
        except AttributeError:
            return None


# 运行示例
async def main():
    config = AsyncCrawlerConfig(
        max_concurrent=20,
        timeout=15,
        max_retries=3
    )

    crawler = AsyncProductCrawler(config)

    # 假设我们有一批商品 URL
    product_urls = [
        f"https://example.com/product/{i}"
        for i in range(1, 101)
    ]

    results = await crawler.crawl(product_urls)
    print(f"成功爬取 {len(results)} 个商品")

    return results


# if __name__ == "__main__":
#     asyncio.run(main())
```

## API 数据获取

### RESTful API 调用

```python
"""
API 数据获取最佳实践
"""
import requests
from typing import Dict, List, Optional, Generator
import time
from dataclasses import dataclass
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def rate_limit(calls_per_second: float = 1.0):
    """速率限制装饰器"""
    min_interval = 1.0 / calls_per_second
    last_call = [0.0]

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_call[0]
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            last_call[0] = time.time()
            return func(*args, **kwargs)
        return wrapper
    return decorator


def retry_on_error(max_retries: int = 3, backoff_factor: float = 2.0):
    """重试装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    wait_time = backoff_factor ** attempt
                    logger.warning(
                        f"请求失败，{wait_time}秒后重试: {e}"
                    )
                    time.sleep(wait_time)
            raise last_exception
        return wrapper
    return decorator


@dataclass
class APIConfig:
    """API 配置"""
    base_url: str
    api_key: str
    timeout: int = 30
    rate_limit: float = 1.0  # 每秒请求数


class APIClient:
    """通用 API 客户端"""

    def __init__(self, config: APIConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {config.api_key}',
            'Content-Type': 'application/json',
        })

    @rate_limit(calls_per_second=1.0)
    @retry_on_error(max_retries=3)
    def _request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict:
        """发送 API 请求"""
        url = f"{self.config.base_url}/{endpoint}"

        response = self.session.request(
            method=method,
            url=url,
            timeout=self.config.timeout,
            **kwargs
        )
        response.raise_for_status()
        return response.json()

    def get(self, endpoint: str, params: Dict = None) -> Dict:
        """GET 请求"""
        return self._request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict = None) -> Dict:
        """POST 请求"""
        return self._request('POST', endpoint, json=data)

    def paginate(
        self,
        endpoint: str,
        params: Dict = None,
        page_key: str = 'page',
        data_key: str = 'data',
        max_pages: int = None
    ) -> Generator[Dict, None, None]:
        """分页获取数据"""
        params = params or {}
        page = 1

        while True:
            params[page_key] = page
            response = self.get(endpoint, params)

            data = response.get(data_key, [])
            if not data:
                break

            for item in data:
                yield item

            page += 1
            if max_pages and page > max_pages:
                break


# Twitter API 示例（使用 tweepy）
"""
import tweepy

class TwitterDataCollector:
    '''Twitter 数据收集器'''

    def __init__(self, bearer_token: str):
        self.client = tweepy.Client(bearer_token=bearer_token)

    def search_tweets(
        self,
        query: str,
        max_results: int = 100
    ) -> List[Dict]:
        '''搜索推文'''
        tweets = []

        for tweet in tweepy.Paginator(
            self.client.search_recent_tweets,
            query=query,
            tweet_fields=['created_at', 'public_metrics', 'lang'],
            max_results=min(max_results, 100)
        ).flatten(limit=max_results):
            tweets.append({
                'id': tweet.id,
                'text': tweet.text,
                'created_at': tweet.created_at.isoformat(),
                'retweet_count': tweet.public_metrics['retweet_count'],
                'like_count': tweet.public_metrics['like_count'],
                'language': tweet.lang
            })

        return tweets
"""
```

### GraphQL API 调用

```python
"""
GraphQL API 数据获取
"""
import requests
from typing import Dict, List, Optional


class GraphQLClient:
    """GraphQL 客户端"""

    def __init__(self, endpoint: str, headers: Dict = None):
        self.endpoint = endpoint
        self.session = requests.Session()
        if headers:
            self.session.headers.update(headers)

    def execute(
        self,
        query: str,
        variables: Dict = None
    ) -> Dict:
        """执行 GraphQL 查询"""
        payload = {'query': query}
        if variables:
            payload['variables'] = variables

        response = self.session.post(
            self.endpoint,
            json=payload
        )
        response.raise_for_status()

        result = response.json()
        if 'errors' in result:
            raise Exception(f"GraphQL 错误: {result['errors']}")

        return result['data']


# GitHub GraphQL API 示例
class GitHubDataCollector:
    """GitHub 数据收集器"""

    def __init__(self, token: str):
        self.client = GraphQLClient(
            endpoint='https://api.github.com/graphql',
            headers={'Authorization': f'Bearer {token}'}
        )

    def get_repository_info(
        self,
        owner: str,
        name: str
    ) -> Dict:
        """获取仓库信息"""
        query = """
        query($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
                name
                description
                stargazerCount
                forkCount
                primaryLanguage {
                    name
                }
                issues(states: OPEN) {
                    totalCount
                }
                pullRequests(states: OPEN) {
                    totalCount
                }
            }
        }
        """

        return self.client.execute(
            query,
            {'owner': owner, 'name': name}
        )

    def get_user_repositories(
        self,
        username: str,
        first: int = 10
    ) -> List[Dict]:
        """获取用户仓库列表"""
        query = """
        query($username: String!, $first: Int!) {
            user(login: $username) {
                repositories(
                    first: $first,
                    orderBy: {field: STARGAZERS, direction: DESC}
                ) {
                    nodes {
                        name
                        description
                        stargazerCount
                        forkCount
                        url
                    }
                }
            }
        }
        """

        result = self.client.execute(
            query,
            {'username': username, 'first': first}
        )
        return result['user']['repositories']['nodes']


# 使用示例
def github_example():
    collector = GitHubDataCollector(token="your_github_token")

    # 获取仓库信息
    repo_info = collector.get_repository_info(
        owner="pytorch",
        name="pytorch"
    )
    print(f"PyTorch Stars: {repo_info['repository']['stargazerCount']}")

    # 获取用户仓库
    repos = collector.get_user_repositories(
        username="torvalds",
        first=5
    )
    for repo in repos:
        print(f"- {repo['name']}: {repo['stargazerCount']} stars")
```

### 流式数据收集

```python
"""
流式数据收集（WebSocket、SSE）
"""
import asyncio
import websockets
import json
from typing import Callable, AsyncGenerator
from datetime import datetime
import aiohttp


class WebSocketCollector:
    """WebSocket 数据收集器"""

    def __init__(self, uri: str):
        self.uri = uri
        self.data_buffer = []

    async def connect_and_collect(
        self,
        callback: Callable[[dict], None],
        duration: int = 60
    ):
        """连接并收集数据"""
        start_time = datetime.now()

        async with websockets.connect(self.uri) as websocket:
            while (datetime.now() - start_time).seconds < duration:
                try:
                    message = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=5.0
                    )
                    data = json.loads(message)
                    callback(data)
                    self.data_buffer.append(data)
                except asyncio.TimeoutError:
                    continue
                except websockets.ConnectionClosed:
                    break

        return self.data_buffer


class SSECollector:
    """Server-Sent Events 数据收集器"""

    def __init__(self, url: str, headers: dict = None):
        self.url = url
        self.headers = headers or {}

    async def collect(
        self,
        max_events: int = 100
    ) -> AsyncGenerator[dict, None]:
        """收集 SSE 事件"""
        async with aiohttp.ClientSession() as session:
            async with session.get(
                self.url,
                headers=self.headers
            ) as response:
                event_count = 0
                async for line in response.content:
                    line = line.decode('utf-8').strip()
                    if line.startswith('data:'):
                        data = json.loads(line[5:])
                        yield data
                        event_count += 1
                        if event_count >= max_events:
                            break


# 加密货币价格流数据收集示例
async def crypto_price_collector():
    """收集加密货币实时价格"""
    uri = "wss://stream.binance.com:9443/ws/btcusdt@trade"

    collector = WebSocketCollector(uri)

    def process_trade(data):
        print(f"BTC 价格: {data['p']} @ {datetime.now()}")

    # 收集 30 秒数据
    trades = await collector.connect_and_collect(
        callback=process_trade,
        duration=30
    )

    return trades
```

## 数据标注平台

### Label Studio 部署与配置

```python
"""
Label Studio 数据标注平台配置
"""

# Docker 部署 Label Studio
"""
# docker-compose.yml
version: '3.8'

services:
  label-studio:
    image: heartexlabs/label-studio:latest
    ports:
      - "8080:8080"
    volumes:
      - ./data:/label-studio/data
    environment:
      - LABEL_STUDIO_LOCAL_FILES_SERVING_ENABLED=true
      - LABEL_STUDIO_LOCAL_FILES_DOCUMENT_ROOT=/label-studio/data
    restart: unless-stopped

# 启动命令
# docker-compose up -d
"""


# Label Studio API 集成
import requests
from typing import List, Dict, Optional
import json


class LabelStudioClient:
    """Label Studio API 客户端"""

    def __init__(self, url: str, api_key: str):
        self.url = url.rstrip('/')
        self.headers = {
            'Authorization': f'Token {api_key}',
            'Content-Type': 'application/json'
        }

    def create_project(
        self,
        title: str,
        label_config: str
    ) -> Dict:
        """创建标注项目"""
        response = requests.post(
            f'{self.url}/api/projects',
            headers=self.headers,
            json={
                'title': title,
                'label_config': label_config
            }
        )
        response.raise_for_status()
        return response.json()

    def import_tasks(
        self,
        project_id: int,
        tasks: List[Dict]
    ) -> Dict:
        """导入标注任务"""
        response = requests.post(
            f'{self.url}/api/projects/{project_id}/import',
            headers=self.headers,
            json=tasks
        )
        response.raise_for_status()
        return response.json()

    def export_annotations(
        self,
        project_id: int,
        export_type: str = 'JSON'
    ) -> List[Dict]:
        """导出标注结果"""
        response = requests.get(
            f'{self.url}/api/projects/{project_id}/export',
            headers=self.headers,
            params={'exportType': export_type}
        )
        response.raise_for_status()
        return response.json()

    def get_project_stats(self, project_id: int) -> Dict:
        """获取项目统计信息"""
        response = requests.get(
            f'{self.url}/api/projects/{project_id}',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# 文本分类标注配置示例
TEXT_CLASSIFICATION_CONFIG = """
<View>
  <Text name="text" value="$text"/>
  <Choices name="sentiment" toName="text" choice="single">
    <Choice value="positive" alias="积极"/>
    <Choice value="negative" alias="消极"/>
    <Choice value="neutral" alias="中性"/>
  </Choices>
</View>
"""

# 命名实体识别标注配置示例
NER_CONFIG = """
<View>
  <Labels name="label" toName="text">
    <Label value="PER" background="red"/>
    <Label value="ORG" background="blue"/>
    <Label value="LOC" background="green"/>
    <Label value="DATE" background="orange"/>
  </Labels>
  <Text name="text" value="$text"/>
</View>
"""

# 图像分类标注配置示例
IMAGE_CLASSIFICATION_CONFIG = """
<View>
  <Image name="image" value="$image"/>
  <Choices name="category" toName="image" choice="single">
    <Choice value="cat"/>
    <Choice value="dog"/>
    <Choice value="bird"/>
    <Choice value="other"/>
  </Choices>
</View>
"""

# 目标检测标注配置示例
OBJECT_DETECTION_CONFIG = """
<View>
  <Image name="image" value="$image"/>
  <RectangleLabels name="label" toName="image">
    <Label value="car" background="blue"/>
    <Label value="person" background="red"/>
    <Label value="bicycle" background="green"/>
  </RectangleLabels>
</View>
"""


def setup_text_classification_project(client: LabelStudioClient):
    """设置文本分类标注项目"""
    # 创建项目
    project = client.create_project(
        title="情感分析标注",
        label_config=TEXT_CLASSIFICATION_CONFIG
    )

    # 准备标注任务
    tasks = [
        {"data": {"text": "这个产品太棒了，强烈推荐！"}},
        {"data": {"text": "质量太差，完全不值这个价格。"}},
        {"data": {"text": "还行吧，中规中矩。"}},
    ]

    # 导入任务
    client.import_tasks(project['id'], tasks)

    return project


def setup_ner_project(client: LabelStudioClient):
    """设置命名实体识别标注项目"""
    project = client.create_project(
        title="命名实体识别标注",
        label_config=NER_CONFIG
    )

    tasks = [
        {"data": {"text": "2024年1月，张三在北京参加了阿里巴巴的面试。"}},
        {"data": {"text": "苹果公司CEO蒂姆·库克将于下周访问上海。"}},
    ]

    client.import_tasks(project['id'], tasks)

    return project
```

### 标注数据格式转换

```python
"""
标注数据格式转换工具
"""
import json
from typing import List, Dict, Tuple
from pathlib import Path


class AnnotationConverter:
    """标注数据格式转换器"""

    @staticmethod
    def labelstudio_to_spacy_ner(
        annotations: List[Dict]
    ) -> List[Tuple[str, Dict]]:
        """
        Label Studio 格式转 spaCy NER 训练格式
        """
        training_data = []

        for item in annotations:
            text = item['data']['text']
            entities = []

            if 'annotations' in item and item['annotations']:
                for annotation in item['annotations']:
                    for result in annotation.get('result', []):
                        if result['type'] == 'labels':
                            value = result['value']
                            entities.append((
                                value['start'],
                                value['end'],
                                value['labels'][0]
                            ))

            training_data.append((text, {'entities': entities}))

        return training_data

    @staticmethod
    def labelstudio_to_huggingface(
        annotations: List[Dict],
        label2id: Dict[str, int]
    ) -> Dict[str, List]:
        """
        Label Studio 格式转 HuggingFace datasets 格式
        """
        texts = []
        labels = []

        for item in annotations:
            texts.append(item['data']['text'])

            if 'annotations' in item and item['annotations']:
                annotation = item['annotations'][0]
                for result in annotation.get('result', []):
                    if result['type'] == 'choices':
                        label = result['value']['choices'][0]
                        labels.append(label2id.get(label, 0))
                        break
                else:
                    labels.append(0)
            else:
                labels.append(0)

        return {'text': texts, 'label': labels}

    @staticmethod
    def coco_to_yolo(
        coco_annotations: Dict,
        output_dir: str
    ):
        """
        COCO 格式转 YOLO 格式
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 创建类别映射
        categories = {
            cat['id']: idx
            for idx, cat in enumerate(coco_annotations['categories'])
        }

        # 创建图像 ID 到文件名的映射
        images = {
            img['id']: img
            for img in coco_annotations['images']
        }

        # 按图像分组标注
        image_annotations = {}
        for ann in coco_annotations['annotations']:
            img_id = ann['image_id']
            if img_id not in image_annotations:
                image_annotations[img_id] = []
            image_annotations[img_id].append(ann)

        # 转换每个图像的标注
        for img_id, anns in image_annotations.items():
            img_info = images[img_id]
            img_width = img_info['width']
            img_height = img_info['height']

            # 生成 YOLO 格式标注文件
            filename = Path(img_info['file_name']).stem + '.txt'

            with open(output_path / filename, 'w') as f:
                for ann in anns:
                    # COCO: [x, y, width, height]
                    bbox = ann['bbox']

                    # 转换为 YOLO: [x_center, y_center, width, height] (归一化)
                    x_center = (bbox[0] + bbox[2] / 2) / img_width
                    y_center = (bbox[1] + bbox[3] / 2) / img_height
                    width = bbox[2] / img_width
                    height = bbox[3] / img_height

                    class_id = categories[ann['category_id']]

                    f.write(
                        f"{class_id} {x_center:.6f} {y_center:.6f} "
                        f"{width:.6f} {height:.6f}\n"
                    )

    @staticmethod
    def yolo_to_coco(
        yolo_dir: str,
        image_dir: str,
        class_names: List[str]
    ) -> Dict:
        """
        YOLO 格式转 COCO 格式
        """
        from PIL import Image

        coco = {
            'images': [],
            'annotations': [],
            'categories': [
                {'id': i, 'name': name}
                for i, name in enumerate(class_names)
            ]
        }

        yolo_path = Path(yolo_dir)
        image_path = Path(image_dir)

        ann_id = 0
        for img_id, txt_file in enumerate(yolo_path.glob('*.txt')):
            # 找到对应的图像文件
            img_name = txt_file.stem
            img_file = None
            for ext in ['.jpg', '.jpeg', '.png', '.bmp']:
                candidate = image_path / (img_name + ext)
                if candidate.exists():
                    img_file = candidate
                    break

            if not img_file:
                continue

            # 获取图像尺寸
            with Image.open(img_file) as img:
                img_width, img_height = img.size

            coco['images'].append({
                'id': img_id,
                'file_name': img_file.name,
                'width': img_width,
                'height': img_height
            })

            # 解析 YOLO 标注
            with open(txt_file) as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) != 5:
                        continue

                    class_id = int(parts[0])
                    x_center = float(parts[1]) * img_width
                    y_center = float(parts[2]) * img_height
                    width = float(parts[3]) * img_width
                    height = float(parts[4]) * img_height

                    # 转换为 COCO 格式
                    x = x_center - width / 2
                    y = y_center - height / 2

                    coco['annotations'].append({
                        'id': ann_id,
                        'image_id': img_id,
                        'category_id': class_id,
                        'bbox': [x, y, width, height],
                        'area': width * height,
                        'iscrowd': 0
                    })
                    ann_id += 1

        return coco
```

## 众包标注

### 众包平台集成

```python
"""
众包标注管理系统
"""
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum
import statistics


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEW = "review"
    REJECTED = "rejected"


@dataclass
class CrowdsourcingConfig:
    """众包配置"""
    min_annotators_per_task: int = 3  # 每个任务最少标注人数
    agreement_threshold: float = 0.7  # 一致性阈值
    quality_threshold: float = 0.8    # 质量阈值
    max_tasks_per_worker: int = 100   # 每人最大任务数
    gold_standard_ratio: float = 0.1  # 金标准数据比例


class CrowdsourcingManager:
    """众包标注管理器"""

    def __init__(self, config: CrowdsourcingConfig):
        self.config = config
        self.tasks = {}
        self.workers = {}
        self.gold_standards = {}

    def create_task_batch(
        self,
        items: List[Dict],
        gold_items: List[Dict] = None
    ) -> str:
        """创建任务批次"""
        import uuid

        batch_id = str(uuid.uuid4())

        # 准备任务
        tasks = []
        for i, item in enumerate(items):
            task = {
                'id': f"{batch_id}_{i}",
                'data': item,
                'status': TaskStatus.PENDING,
                'annotations': [],
                'is_gold': False
            }
            tasks.append(task)

        # 插入金标准数据
        if gold_items:
            import random
            gold_positions = random.sample(
                range(len(tasks) + len(gold_items)),
                len(gold_items)
            )
            for pos, gold in zip(sorted(gold_positions), gold_items):
                gold_task = {
                    'id': f"{batch_id}_gold_{pos}",
                    'data': gold['data'],
                    'status': TaskStatus.PENDING,
                    'annotations': [],
                    'is_gold': True,
                    'gold_answer': gold['answer']
                }
                tasks.insert(pos, gold_task)

        self.tasks[batch_id] = tasks
        return batch_id

    def assign_task(
        self,
        worker_id: str
    ) -> Optional[Dict]:
        """分配任务给标注员"""
        # 初始化标注员记录
        if worker_id not in self.workers:
            self.workers[worker_id] = {
                'completed': 0,
                'accuracy': 1.0,
                'gold_correct': 0,
                'gold_total': 0
            }

        worker = self.workers[worker_id]

        # 检查是否超过最大任务数
        if worker['completed'] >= self.config.max_tasks_per_worker:
            return None

        # 检查质量是否达标
        if (worker['gold_total'] > 5 and
            worker['accuracy'] < self.config.quality_threshold):
            return None

        # 找到可用任务
        for batch_id, tasks in self.tasks.items():
            for task in tasks:
                if task['status'] == TaskStatus.PENDING:
                    # 检查该标注员是否已经标注过
                    if not any(
                        a['worker_id'] == worker_id
                        for a in task['annotations']
                    ):
                        return {
                            'batch_id': batch_id,
                            'task_id': task['id'],
                            'data': task['data']
                        }

        return None

    def submit_annotation(
        self,
        batch_id: str,
        task_id: str,
        worker_id: str,
        annotation: Dict
    ) -> Dict:
        """提交标注结果"""
        task = None
        for t in self.tasks.get(batch_id, []):
            if t['id'] == task_id:
                task = t
                break

        if not task:
            return {'error': '任务不存在'}

        # 记录标注
        task['annotations'].append({
            'worker_id': worker_id,
            'annotation': annotation,
            'timestamp': __import__('datetime').datetime.now().isoformat()
        })

        # 更新标注员统计
        worker = self.workers[worker_id]
        worker['completed'] += 1

        # 检查金标准
        if task['is_gold']:
            worker['gold_total'] += 1
            if annotation == task['gold_answer']:
                worker['gold_correct'] += 1
            worker['accuracy'] = (
                worker['gold_correct'] / worker['gold_total']
            )

        # 检查是否达到所需标注数量
        if len(task['annotations']) >= self.config.min_annotators_per_task:
            task['status'] = TaskStatus.REVIEW
        else:
            task['status'] = TaskStatus.IN_PROGRESS

        return {
            'success': True,
            'worker_accuracy': worker['accuracy']
        }

    def aggregate_annotations(
        self,
        batch_id: str
    ) -> List[Dict]:
        """聚合标注结果"""
        results = []

        for task in self.tasks.get(batch_id, []):
            if task['is_gold']:
                continue

            if task['status'] != TaskStatus.REVIEW:
                continue

            annotations = [
                a['annotation']
                for a in task['annotations']
            ]

            # 多数投票
            result = self._majority_vote(annotations)

            # 计算一致性
            agreement = self._calculate_agreement(annotations)

            results.append({
                'task_id': task['id'],
                'data': task['data'],
                'final_annotation': result,
                'agreement': agreement,
                'confident': agreement >= self.config.agreement_threshold
            })

        return results

    def _majority_vote(self, annotations: List) -> any:
        """多数投票"""
        from collections import Counter

        if isinstance(annotations[0], dict):
            # 对于复杂标注，转为字符串比较
            str_annotations = [
                json.dumps(a, sort_keys=True)
                for a in annotations
            ]
            most_common = Counter(str_annotations).most_common(1)[0][0]
            return json.loads(most_common)
        else:
            return Counter(annotations).most_common(1)[0][0]

    def _calculate_agreement(self, annotations: List) -> float:
        """计算标注一致性（Fleiss' Kappa 简化版）"""
        from collections import Counter

        if isinstance(annotations[0], dict):
            str_annotations = [
                json.dumps(a, sort_keys=True)
                for a in annotations
            ]
        else:
            str_annotations = annotations

        counter = Counter(str_annotations)
        most_common_count = counter.most_common(1)[0][1]

        return most_common_count / len(annotations)

    def get_worker_statistics(self) -> Dict:
        """获取标注员统计信息"""
        stats = []
        for worker_id, data in self.workers.items():
            stats.append({
                'worker_id': worker_id,
                'completed_tasks': data['completed'],
                'accuracy': data['accuracy'],
                'gold_correct': data['gold_correct'],
                'gold_total': data['gold_total']
            })

        return {
            'workers': stats,
            'summary': {
                'total_workers': len(self.workers),
                'avg_accuracy': statistics.mean(
                    [w['accuracy'] for w in self.workers.values()]
                ) if self.workers else 0,
                'total_annotations': sum(
                    w['completed'] for w in self.workers.values()
                )
            }
        }
```

### 标注质量控制

```python
"""
标注质量控制系统
"""
import numpy as np
from typing import List, Dict, Tuple
from sklearn.metrics import cohen_kappa_score, krippendorff_alpha
from collections import defaultdict


class QualityController:
    """标注质量控制器"""

    def __init__(self):
        self.annotations_history = defaultdict(list)

    def calculate_inter_annotator_agreement(
        self,
        annotations: List[List[int]],
        method: str = 'fleiss_kappa'
    ) -> float:
        """
        计算标注者间一致性

        Args:
            annotations: 每行是一个样本，每列是一个标注者的标注
            method: 'cohen_kappa', 'fleiss_kappa', 'krippendorff'
        """
        annotations = np.array(annotations)

        if method == 'cohen_kappa':
            # 只适用于两个标注者
            if annotations.shape[1] != 2:
                raise ValueError("Cohen's Kappa 只适用于两个标注者")
            return cohen_kappa_score(
                annotations[:, 0],
                annotations[:, 1]
            )

        elif method == 'fleiss_kappa':
            return self._fleiss_kappa(annotations)

        elif method == 'krippendorff':
            return self._krippendorff_alpha(annotations)

        else:
            raise ValueError(f"未知方法: {method}")

    def _fleiss_kappa(self, annotations: np.ndarray) -> float:
        """计算 Fleiss' Kappa"""
        n_subjects = annotations.shape[0]
        n_raters = annotations.shape[1]

        # 获取所有类别
        categories = np.unique(annotations)
        n_categories = len(categories)

        # 创建类别计数矩阵
        count_matrix = np.zeros((n_subjects, n_categories))
        for i, cat in enumerate(categories):
            count_matrix[:, i] = np.sum(annotations == cat, axis=1)

        # 计算 P_i (每个样本的一致性)
        P_i = (np.sum(count_matrix ** 2, axis=1) - n_raters) / \
              (n_raters * (n_raters - 1))

        # 计算 P_bar (平均一致性)
        P_bar = np.mean(P_i)

        # 计算 P_e (偶然一致性)
        p_j = np.sum(count_matrix, axis=0) / (n_subjects * n_raters)
        P_e = np.sum(p_j ** 2)

        # 计算 Kappa
        kappa = (P_bar - P_e) / (1 - P_e) if P_e != 1 else 1

        return kappa

    def _krippendorff_alpha(self, annotations: np.ndarray) -> float:
        """计算 Krippendorff's Alpha"""
        # 简化实现，处理缺失值
        n_subjects = annotations.shape[0]
        n_raters = annotations.shape[1]

        # 计算观察到的不一致
        D_o = 0
        n_pairs = 0

        for i in range(n_subjects):
            valid_annotations = annotations[i][annotations[i] != -1]
            n_valid = len(valid_annotations)
            if n_valid < 2:
                continue

            for j in range(n_valid):
                for k in range(j + 1, n_valid):
                    D_o += (valid_annotations[j] != valid_annotations[k])
                    n_pairs += 1

        if n_pairs == 0:
            return 1.0

        D_o = D_o / n_pairs

        # 计算期望的不一致
        all_values = annotations[annotations != -1]
        categories, counts = np.unique(all_values, return_counts=True)
        probs = counts / len(all_values)
        D_e = 1 - np.sum(probs ** 2)

        # 计算 Alpha
        alpha = 1 - D_o / D_e if D_e != 0 else 1

        return alpha

    def detect_annotation_errors(
        self,
        annotations: List[Dict],
        threshold: float = 0.5
    ) -> List[Dict]:
        """检测可能的标注错误"""
        errors = []

        for item in annotations:
            task_id = item['task_id']
            worker_annotations = item['annotations']

            if len(worker_annotations) < 2:
                continue

            # 统计标注分布
            from collections import Counter
            label_counts = Counter(
                a['annotation'] for a in worker_annotations
            )

            total = len(worker_annotations)
            majority_label, majority_count = label_counts.most_common(1)[0]

            # 检测离群标注
            for ann in worker_annotations:
                if ann['annotation'] != majority_label:
                    agreement_ratio = majority_count / total
                    if agreement_ratio >= threshold:
                        errors.append({
                            'task_id': task_id,
                            'worker_id': ann['worker_id'],
                            'annotation': ann['annotation'],
                            'majority_label': majority_label,
                            'agreement_ratio': agreement_ratio
                        })

        return errors

    def calculate_worker_reliability(
        self,
        worker_id: str,
        annotations: List[Dict]
    ) -> Dict:
        """计算标注员可靠性"""
        worker_annotations = []
        majority_labels = []

        for item in annotations:
            worker_ann = None
            all_anns = []

            for ann in item['annotations']:
                all_anns.append(ann['annotation'])
                if ann['worker_id'] == worker_id:
                    worker_ann = ann['annotation']

            if worker_ann is not None and len(all_anns) > 1:
                # 计算不包含该标注员的多数标签
                from collections import Counter
                other_anns = [
                    a for a in all_anns
                    if a != worker_ann or all_anns.count(a) > 1
                ]
                if other_anns:
                    majority = Counter(other_anns).most_common(1)[0][0]
                    worker_annotations.append(worker_ann)
                    majority_labels.append(majority)

        if not worker_annotations:
            return {'worker_id': worker_id, 'reliability': None}

        # 计算与多数标签的一致率
        agreement = sum(
            1 for w, m in zip(worker_annotations, majority_labels)
            if w == m
        ) / len(worker_annotations)

        return {
            'worker_id': worker_id,
            'reliability': agreement,
            'total_annotations': len(worker_annotations)
        }


def quality_control_example():
    """质量控制使用示例"""
    qc = QualityController()

    # 示例：3 个标注者对 10 个样本的标注
    annotations = [
        [1, 1, 1],  # 完全一致
        [1, 1, 2],  # 部分一致
        [1, 2, 2],  # 部分一致
        [1, 1, 1],
        [2, 2, 2],
        [1, 2, 1],
        [2, 2, 2],
        [1, 1, 1],
        [2, 1, 2],
        [1, 1, 1]
    ]

    # 计算一致性
    kappa = qc.calculate_inter_annotator_agreement(
        annotations,
        method='fleiss_kappa'
    )
    print(f"Fleiss' Kappa: {kappa:.3f}")

    # 解释
    if kappa < 0.2:
        print("一致性：极差")
    elif kappa < 0.4:
        print("一致性：较差")
    elif kappa < 0.6:
        print("一致性：中等")
    elif kappa < 0.8:
        print("一致性：较好")
    else:
        print("一致性：极好")
```

## 主动学习标注

### 主动学习策略

```python
"""
主动学习标注系统
通过智能选择最有价值的样本来标注，减少标注成本
"""
import numpy as np
from typing import List, Tuple, Callable
from sklearn.base import BaseEstimator
from scipy.stats import entropy


class ActiveLearner:
    """主动学习器"""

    def __init__(
        self,
        model: BaseEstimator,
        query_strategy: str = 'uncertainty',
        batch_size: int = 10
    ):
        self.model = model
        self.query_strategy = query_strategy
        self.batch_size = batch_size

        self.X_pool = None
        self.X_train = None
        self.y_train = None

    def initialize(
        self,
        X_pool: np.ndarray,
        X_initial: np.ndarray,
        y_initial: np.ndarray
    ):
        """初始化主动学习器"""
        self.X_pool = X_pool.copy()
        self.X_train = X_initial.copy()
        self.y_train = y_initial.copy()

        # 训练初始模型
        self.model.fit(self.X_train, self.y_train)

    def query(self) -> Tuple[np.ndarray, np.ndarray]:
        """选择最有价值的样本进行标注"""
        if len(self.X_pool) == 0:
            return np.array([]), np.array([])

        # 根据策略计算每个样本的分数
        if self.query_strategy == 'uncertainty':
            scores = self._uncertainty_sampling()
        elif self.query_strategy == 'entropy':
            scores = self._entropy_sampling()
        elif self.query_strategy == 'margin':
            scores = self._margin_sampling()
        elif self.query_strategy == 'random':
            scores = np.random.rand(len(self.X_pool))
        else:
            raise ValueError(f"未知策略: {self.query_strategy}")

        # 选择分数最高的样本
        n_select = min(self.batch_size, len(self.X_pool))
        query_indices = np.argsort(scores)[-n_select:]

        return query_indices, self.X_pool[query_indices]

    def _uncertainty_sampling(self) -> np.ndarray:
        """不确定性采样：选择模型最不确定的样本"""
        probs = self.model.predict_proba(self.X_pool)
        # 最高概率越低，不确定性越高
        uncertainty = 1 - np.max(probs, axis=1)
        return uncertainty

    def _entropy_sampling(self) -> np.ndarray:
        """熵采样：选择预测熵最高的样本"""
        probs = self.model.predict_proba(self.X_pool)
        return entropy(probs, axis=1)

    def _margin_sampling(self) -> np.ndarray:
        """边距采样：选择最高和次高概率差距最小的样本"""
        probs = self.model.predict_proba(self.X_pool)
        sorted_probs = np.sort(probs, axis=1)
        margin = sorted_probs[:, -1] - sorted_probs[:, -2]
        return 1 - margin  # 边距越小，分数越高

    def teach(
        self,
        query_indices: np.ndarray,
        labels: np.ndarray
    ):
        """用新标注的数据更新模型"""
        # 添加到训练集
        self.X_train = np.vstack([
            self.X_train,
            self.X_pool[query_indices]
        ])
        self.y_train = np.concatenate([
            self.y_train,
            labels
        ])

        # 从池中移除
        self.X_pool = np.delete(self.X_pool, query_indices, axis=0)

        # 重新训练模型
        self.model.fit(self.X_train, self.y_train)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> float:
        """评估当前模型"""
        return self.model.score(X_test, y_test)


class QueryByCommittee:
    """委员会查询策略"""

    def __init__(
        self,
        models: List[BaseEstimator],
        batch_size: int = 10
    ):
        self.models = models
        self.batch_size = batch_size
        self.X_pool = None

    def initialize(
        self,
        X_pool: np.ndarray,
        X_train: np.ndarray,
        y_train: np.ndarray
    ):
        """初始化"""
        self.X_pool = X_pool.copy()

        # 训练所有委员会成员
        for model in self.models:
            # 使用 bootstrap 采样
            indices = np.random.choice(
                len(X_train),
                size=len(X_train),
                replace=True
            )
            model.fit(X_train[indices], y_train[indices])

    def query(self) -> Tuple[np.ndarray, np.ndarray]:
        """选择委员会成员分歧最大的样本"""
        # 收集所有模型的预测
        predictions = np.array([
            model.predict(self.X_pool)
            for model in self.models
        ])

        # 计算投票熵
        n_samples = len(self.X_pool)
        n_classes = len(np.unique(predictions))

        vote_entropy = np.zeros(n_samples)
        for i in range(n_samples):
            votes = predictions[:, i]
            vote_counts = np.bincount(
                votes,
                minlength=n_classes
            ) / len(self.models)
            vote_entropy[i] = entropy(vote_counts)

        # 选择熵最高的样本
        n_select = min(self.batch_size, len(self.X_pool))
        query_indices = np.argsort(vote_entropy)[-n_select:]

        return query_indices, self.X_pool[query_indices]


def active_learning_example():
    """主动学习示例"""
    from sklearn.datasets import make_classification
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier

    # 生成数据
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_informative=10,
        n_redundant=5,
        random_state=42
    )

    # 划分数据
    X_pool, X_test, y_pool, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 初始标注数据（假设只有 20 个样本已标注）
    initial_indices = np.random.choice(
        len(X_pool),
        size=20,
        replace=False
    )
    X_initial = X_pool[initial_indices]
    y_initial = y_pool[initial_indices]
    X_pool_remaining = np.delete(X_pool, initial_indices, axis=0)

    # 创建主动学习器
    learner = ActiveLearner(
        model=RandomForestClassifier(n_estimators=100, random_state=42),
        query_strategy='uncertainty',
        batch_size=10
    )

    learner.initialize(X_pool_remaining, X_initial, y_initial)

    # 模拟标注循环
    accuracy_history = [learner.evaluate(X_test, y_test)]
    n_labeled_history = [len(y_initial)]

    print(f"初始准确率: {accuracy_history[0]:.3f} (使用 {n_labeled_history[0]} 个标注样本)")

    # 进行 10 轮主动学习
    for round_idx in range(10):
        # 查询需要标注的样本
        query_indices, query_samples = learner.query()

        if len(query_indices) == 0:
            print("没有更多样本可以标注")
            break

        # 模拟人工标注（实际中这里需要人工标注）
        # 在此示例中，我们直接使用真实标签
        pool_remaining_labels = np.delete(
            y_pool, initial_indices, axis=0
        )
        # 这里简化处理，直接获取标签
        new_labels = pool_remaining_labels[query_indices]

        # 更新模型
        learner.teach(query_indices, new_labels)

        # 评估
        accuracy = learner.evaluate(X_test, y_test)
        n_labeled = len(learner.y_train)

        accuracy_history.append(accuracy)
        n_labeled_history.append(n_labeled)

        print(f"第 {round_idx + 1} 轮: 准确率 {accuracy:.3f} "
              f"(使用 {n_labeled} 个标注样本)")

    return accuracy_history, n_labeled_history
```

### 主动学习与标注平台集成

```python
"""
主动学习与 Label Studio 集成
"""
import json
from typing import List, Dict
import numpy as np


class ActiveLearningAnnotationSystem:
    """主动学习标注系统"""

    def __init__(
        self,
        label_studio_client,
        active_learner,
        embedding_model
    ):
        self.ls_client = label_studio_client
        self.learner = active_learner
        self.embedding_model = embedding_model
        self.project_id = None

    def setup_project(
        self,
        project_name: str,
        label_config: str,
        initial_data: List[Dict],
        initial_labels: List
    ):
        """设置标注项目"""
        # 创建 Label Studio 项目
        project = self.ls_client.create_project(
            title=project_name,
            label_config=label_config
        )
        self.project_id = project['id']

        # 计算初始数据的嵌入
        initial_embeddings = self.embedding_model.encode(
            [d['text'] for d in initial_data]
        )

        # 初始化主动学习器
        self.learner.initialize(
            X_pool=np.array([]),  # 后面会添加
            X_initial=initial_embeddings,
            y_initial=np.array(initial_labels)
        )

    def add_unlabeled_data(self, data: List[Dict]):
        """添加未标注数据到池中"""
        # 计算嵌入
        embeddings = self.embedding_model.encode(
            [d['text'] for d in data]
        )

        # 添加到主动学习器的池中
        if self.learner.X_pool is None or len(self.learner.X_pool) == 0:
            self.learner.X_pool = embeddings
        else:
            self.learner.X_pool = np.vstack([
                self.learner.X_pool,
                embeddings
            ])

        # 存储原始数据
        if not hasattr(self, 'pool_data'):
            self.pool_data = []
        self.pool_data.extend(data)

    def create_annotation_batch(self) -> Dict:
        """创建新的标注批次（选择最有价值的样本）"""
        # 使用主动学习选择样本
        query_indices, _ = self.learner.query()

        if len(query_indices) == 0:
            return {'message': '没有更多样本需要标注'}

        # 准备 Label Studio 任务
        tasks = [
            {'data': self.pool_data[i]}
            for i in query_indices
        ]

        # 导入到 Label Studio
        result = self.ls_client.import_tasks(
            self.project_id,
            tasks
        )

        return {
            'batch_size': len(query_indices),
            'task_ids': result.get('task_ids', []),
            'query_indices': query_indices.tolist()
        }

    def process_completed_annotations(self) -> Dict:
        """处理完成的标注并更新模型"""
        # 导出标注
        annotations = self.ls_client.export_annotations(self.project_id)

        # 过滤已完成的标注
        completed = [
            a for a in annotations
            if a.get('annotations') and len(a['annotations']) > 0
        ]

        if not completed:
            return {'message': '没有新的标注'}

        # 提取标签
        new_data = []
        new_labels = []

        for item in completed:
            text = item['data']['text']
            annotation = item['annotations'][0]['result'][0]
            label = annotation['value']['choices'][0]

            new_data.append({'text': text})
            new_labels.append(label)

        # 计算嵌入
        new_embeddings = self.embedding_model.encode(
            [d['text'] for d in new_data]
        )

        # 更新主动学习器
        # 注意：这里简化处理，实际需要正确对应索引
        self.learner.X_train = np.vstack([
            self.learner.X_train,
            new_embeddings
        ])
        self.learner.y_train = np.concatenate([
            self.learner.y_train,
            np.array(new_labels)
        ])

        # 重新训练模型
        self.learner.model.fit(
            self.learner.X_train,
            self.learner.y_train
        )

        return {
            'processed_count': len(completed),
            'total_labeled': len(self.learner.y_train)
        }

    def get_model_performance(self, test_data: List[Dict], test_labels: List) -> Dict:
        """评估当前模型性能"""
        test_embeddings = self.embedding_model.encode(
            [d['text'] for d in test_data]
        )

        predictions = self.learner.model.predict(test_embeddings)
        accuracy = np.mean(predictions == np.array(test_labels))

        return {
            'accuracy': accuracy,
            'n_labeled_samples': len(self.learner.y_train),
            'n_pool_samples': len(self.learner.X_pool) if self.learner.X_pool is not None else 0
        }
```

## 数据质量控制

### 数据验证框架

```python
"""
数据质量验证框架
"""
from dataclasses import dataclass
from typing import List, Dict, Callable, Any, Optional
from enum import Enum
import re
from abc import ABC, abstractmethod


class ValidationSeverity(Enum):
    """验证严重级别"""
    ERROR = "error"      # 错误：必须修复
    WARNING = "warning"  # 警告：建议修复
    INFO = "info"        # 信息：仅供参考


@dataclass
class ValidationResult:
    """验证结果"""
    passed: bool
    severity: ValidationSeverity
    message: str
    field: str
    value: Any = None


class Validator(ABC):
    """验证器基类"""

    @abstractmethod
    def validate(self, data: Dict) -> List[ValidationResult]:
        pass


class SchemaValidator(Validator):
    """模式验证器"""

    def __init__(self, schema: Dict):
        self.schema = schema

    def validate(self, data: Dict) -> List[ValidationResult]:
        results = []

        for field, rules in self.schema.items():
            value = data.get(field)

            # 必填检查
            if rules.get('required', False) and value is None:
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message=f"字段 '{field}' 是必填项",
                    field=field
                ))
                continue

            if value is None:
                continue

            # 类型检查
            expected_type = rules.get('type')
            if expected_type and not isinstance(value, expected_type):
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message=f"字段 '{field}' 类型错误，期望 {expected_type.__name__}",
                    field=field,
                    value=value
                ))

            # 范围检查
            if 'min' in rules and value < rules['min']:
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message=f"字段 '{field}' 值小于最小值 {rules['min']}",
                    field=field,
                    value=value
                ))

            if 'max' in rules and value > rules['max']:
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message=f"字段 '{field}' 值大于最大值 {rules['max']}",
                    field=field,
                    value=value
                ))

            # 正则检查
            if 'pattern' in rules and isinstance(value, str):
                if not re.match(rules['pattern'], value):
                    results.append(ValidationResult(
                        passed=False,
                        severity=ValidationSeverity.ERROR,
                        message=f"字段 '{field}' 不匹配模式 {rules['pattern']}",
                        field=field,
                        value=value
                    ))

            # 枚举检查
            if 'enum' in rules and value not in rules['enum']:
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message=f"字段 '{field}' 值不在允许列表中",
                    field=field,
                    value=value
                ))

        return results


class TextQualityValidator(Validator):
    """文本质量验证器"""

    def __init__(
        self,
        min_length: int = 10,
        max_length: int = 10000,
        min_words: int = 3,
        check_encoding: bool = True
    ):
        self.min_length = min_length
        self.max_length = max_length
        self.min_words = min_words
        self.check_encoding = check_encoding

    def validate(self, data: Dict) -> List[ValidationResult]:
        results = []
        text = data.get('text', '')

        if not text:
            return [ValidationResult(
                passed=False,
                severity=ValidationSeverity.ERROR,
                message="文本为空",
                field='text'
            )]

        # 长度检查
        if len(text) < self.min_length:
            results.append(ValidationResult(
                passed=False,
                severity=ValidationSeverity.WARNING,
                message=f"文本过短 ({len(text)} < {self.min_length})",
                field='text',
                value=len(text)
            ))

        if len(text) > self.max_length:
            results.append(ValidationResult(
                passed=False,
                severity=ValidationSeverity.ERROR,
                message=f"文本过长 ({len(text)} > {self.max_length})",
                field='text',
                value=len(text)
            ))

        # 词数检查
        words = text.split()
        if len(words) < self.min_words:
            results.append(ValidationResult(
                passed=False,
                severity=ValidationSeverity.WARNING,
                message=f"词数过少 ({len(words)} < {self.min_words})",
                field='text',
                value=len(words)
            ))

        # 编码检查
        if self.check_encoding:
            try:
                text.encode('utf-8').decode('utf-8')
            except UnicodeError:
                results.append(ValidationResult(
                    passed=False,
                    severity=ValidationSeverity.ERROR,
                    message="文本包含无效编码",
                    field='text'
                ))

        # 特殊字符检查
        special_ratio = sum(
            1 for c in text if not c.isalnum() and not c.isspace()
        ) / len(text)
        if special_ratio > 0.3:
            results.append(ValidationResult(
                passed=False,
                severity=ValidationSeverity.WARNING,
                message=f"特殊字符比例过高 ({special_ratio:.1%})",
                field='text',
                value=special_ratio
            ))

        return results


class DataQualityPipeline:
    """数据质量检查管道"""

    def __init__(self):
        self.validators: List[Validator] = []

    def add_validator(self, validator: Validator):
        """添加验证器"""
        self.validators.append(validator)
        return self

    def validate_single(self, data: Dict) -> Dict:
        """验证单条数据"""
        all_results = []

        for validator in self.validators:
            results = validator.validate(data)
            all_results.extend(results)

        errors = [r for r in all_results if r.severity == ValidationSeverity.ERROR]
        warnings = [r for r in all_results if r.severity == ValidationSeverity.WARNING]

        return {
            'valid': len(errors) == 0,
            'errors': [
                {'field': r.field, 'message': r.message}
                for r in errors
            ],
            'warnings': [
                {'field': r.field, 'message': r.message}
                for r in warnings
            ],
            'data': data
        }

    def validate_batch(self, data_list: List[Dict]) -> Dict:
        """批量验证"""
        results = [self.validate_single(d) for d in data_list]

        valid_count = sum(1 for r in results if r['valid'])
        error_count = sum(len(r['errors']) for r in results)
        warning_count = sum(len(r['warnings']) for r in results)

        return {
            'total': len(data_list),
            'valid': valid_count,
            'invalid': len(data_list) - valid_count,
            'total_errors': error_count,
            'total_warnings': warning_count,
            'pass_rate': valid_count / len(data_list) if data_list else 0,
            'results': results
        }


# 使用示例
def data_validation_example():
    # 定义验证模式
    schema = {
        'id': {'required': True, 'type': int},
        'text': {'required': True, 'type': str, 'min': 10},
        'label': {'required': True, 'enum': ['positive', 'negative', 'neutral']},
        'score': {'type': float, 'min': 0, 'max': 1}
    }

    # 创建验证管道
    pipeline = DataQualityPipeline()
    pipeline.add_validator(SchemaValidator(schema))
    pipeline.add_validator(TextQualityValidator(min_length=20))

    # 测试数据
    test_data = [
        {'id': 1, 'text': '这是一个很好的产品，推荐购买！', 'label': 'positive', 'score': 0.9},
        {'id': 2, 'text': '太短', 'label': 'negative'},  # 文本过短
        {'id': 3, 'text': '一般般吧', 'label': 'unknown'},  # 标签不在枚举中
        {'text': '缺少 ID 字段的数据', 'label': 'neutral'},  # 缺少必填字段
    ]

    # 执行验证
    result = pipeline.validate_batch(test_data)

    print(f"验证结果: {result['valid']}/{result['total']} 通过")
    print(f"通过率: {result['pass_rate']:.1%}")
    print(f"错误数: {result['total_errors']}, 警告数: {result['total_warnings']}")

    return result
```

### 数据去重与清洗

```python
"""
数据去重与清洗工具
"""
import hashlib
from typing import List, Dict, Set, Tuple
from collections import defaultdict
import re
from difflib import SequenceMatcher


class DataDeduplicator:
    """数据去重器"""

    def __init__(self, similarity_threshold: float = 0.9):
        self.similarity_threshold = similarity_threshold
        self.seen_hashes: Set[str] = set()

    def _compute_hash(self, text: str) -> str:
        """计算文本哈希"""
        # 预处理：转小写、移除空白
        normalized = re.sub(r'\s+', '', text.lower())
        return hashlib.md5(normalized.encode()).hexdigest()

    def _compute_simhash(self, text: str, hash_bits: int = 64) -> int:
        """计算 SimHash（用于近似去重）"""
        features = self._get_features(text)
        v = [0] * hash_bits

        for feature in features:
            feature_hash = int(hashlib.md5(feature.encode()).hexdigest(), 16)
            for i in range(hash_bits):
                if feature_hash & (1 << i):
                    v[i] += 1
                else:
                    v[i] -= 1

        fingerprint = 0
        for i in range(hash_bits):
            if v[i] >= 0:
                fingerprint |= (1 << i)

        return fingerprint

    def _get_features(self, text: str, ngram: int = 3) -> List[str]:
        """提取文本特征（n-gram）"""
        text = re.sub(r'\s+', ' ', text.lower())
        features = []
        for i in range(len(text) - ngram + 1):
            features.append(text[i:i + ngram])
        return features

    def _hamming_distance(self, hash1: int, hash2: int) -> int:
        """计算汉明距离"""
        return bin(hash1 ^ hash2).count('1')

    def exact_dedup(self, data: List[Dict], key: str = 'text') -> List[Dict]:
        """精确去重"""
        unique_data = []

        for item in data:
            text = item.get(key, '')
            text_hash = self._compute_hash(text)

            if text_hash not in self.seen_hashes:
                self.seen_hashes.add(text_hash)
                unique_data.append(item)

        return unique_data

    def fuzzy_dedup(
        self,
        data: List[Dict],
        key: str = 'text',
        max_hamming_distance: int = 3
    ) -> List[Dict]:
        """模糊去重（使用 SimHash）"""
        unique_data = []
        simhashes: List[int] = []

        for item in data:
            text = item.get(key, '')
            simhash = self._compute_simhash(text)

            # 检查是否与已有数据相似
            is_duplicate = False
            for existing_hash in simhashes:
                if self._hamming_distance(simhash, existing_hash) <= max_hamming_distance:
                    is_duplicate = True
                    break

            if not is_duplicate:
                simhashes.append(simhash)
                unique_data.append(item)

        return unique_data

    def find_near_duplicates(
        self,
        data: List[Dict],
        key: str = 'text'
    ) -> List[Tuple[int, int, float]]:
        """查找近似重复对"""
        duplicates = []

        for i in range(len(data)):
            for j in range(i + 1, len(data)):
                text1 = data[i].get(key, '')
                text2 = data[j].get(key, '')

                similarity = SequenceMatcher(None, text1, text2).ratio()

                if similarity >= self.similarity_threshold:
                    duplicates.append((i, j, similarity))

        return duplicates


class DataCleaner:
    """数据清洗器"""

    @staticmethod
    def clean_text(text: str) -> str:
        """文本清洗"""
        if not text:
            return ''

        # 移除 HTML 标签
        text = re.sub(r'<[^>]+>', '', text)

        # 移除 URL
        text = re.sub(r'http[s]?://\S+', '', text)

        # 移除 email
        text = re.sub(r'\S+@\S+', '', text)

        # 规范化空白字符
        text = re.sub(r'\s+', ' ', text)

        # 移除控制字符
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)

        return text.strip()

    @staticmethod
    def normalize_unicode(text: str) -> str:
        """Unicode 规范化"""
        import unicodedata

        # NFKC 规范化
        text = unicodedata.normalize('NFKC', text)

        return text

    @staticmethod
    def fix_encoding(text: str) -> str:
        """修复编码问题"""
        try:
            # 尝试修复常见的编码错误
            if isinstance(text, bytes):
                text = text.decode('utf-8', errors='ignore')

            # 处理 mojibake（乱码）
            text = text.encode('latin-1', errors='ignore').decode('utf-8', errors='ignore')
        except Exception:
            pass

        return text

    def clean_batch(
        self,
        data: List[Dict],
        text_fields: List[str]
    ) -> List[Dict]:
        """批量清洗"""
        cleaned_data = []

        for item in data:
            cleaned_item = item.copy()

            for field in text_fields:
                if field in cleaned_item:
                    text = cleaned_item[field]
                    text = self.fix_encoding(text)
                    text = self.normalize_unicode(text)
                    text = self.clean_text(text)
                    cleaned_item[field] = text

            cleaned_data.append(cleaned_item)

        return cleaned_data


# 完整的数据清洗流程
def data_cleaning_pipeline(raw_data: List[Dict]) -> List[Dict]:
    """完整数据清洗流程"""
    print(f"原始数据量: {len(raw_data)}")

    # 1. 数据清洗
    cleaner = DataCleaner()
    cleaned_data = cleaner.clean_batch(raw_data, ['text', 'title'])
    print(f"清洗后数据量: {len(cleaned_data)}")

    # 2. 精确去重
    deduplicator = DataDeduplicator()
    dedup_data = deduplicator.exact_dedup(cleaned_data, key='text')
    print(f"精确去重后: {len(dedup_data)}")

    # 3. 模糊去重
    final_data = deduplicator.fuzzy_dedup(dedup_data, key='text')
    print(f"模糊去重后: {len(final_data)}")

    # 4. 数据验证
    pipeline = DataQualityPipeline()
    pipeline.add_validator(TextQualityValidator())

    validation_result = pipeline.validate_batch(final_data)

    # 只保留有效数据
    valid_data = [
        r['data'] for r in validation_result['results']
        if r['valid']
    ]
    print(f"验证通过: {len(valid_data)}")

    return valid_data
```

## 隐私合规

### 数据脱敏处理

```python
"""
数据隐私保护与脱敏工具
"""
import re
import hashlib
from typing import List, Dict, Callable
from dataclasses import dataclass
from abc import ABC, abstractmethod


@dataclass
class PIIPattern:
    """PII（个人身份信息）模式"""
    name: str
    pattern: str
    replacement: str


class PIIDetector:
    """个人身份信息检测器"""

    # 中国常见 PII 模式
    PATTERNS = [
        PIIPattern(
            name='phone',
            pattern=r'1[3-9]\d{9}',
            replacement='[手机号]'
        ),
        PIIPattern(
            name='id_card',
            pattern=r'[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]',
            replacement='[身份证号]'
        ),
        PIIPattern(
            name='email',
            pattern=r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
            replacement='[邮箱]'
        ),
        PIIPattern(
            name='bank_card',
            pattern=r'\d{16,19}',
            replacement='[银行卡号]'
        ),
        PIIPattern(
            name='ip_address',
            pattern=r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
            replacement='[IP地址]'
        ),
    ]

    def __init__(self, custom_patterns: List[PIIPattern] = None):
        self.patterns = self.PATTERNS.copy()
        if custom_patterns:
            self.patterns.extend(custom_patterns)

    def detect(self, text: str) -> List[Dict]:
        """检测 PII"""
        findings = []

        for pii in self.patterns:
            matches = re.finditer(pii.pattern, text)
            for match in matches:
                findings.append({
                    'type': pii.name,
                    'value': match.group(),
                    'start': match.start(),
                    'end': match.end()
                })

        return findings

    def mask(self, text: str) -> str:
        """脱敏 PII"""
        masked_text = text

        for pii in self.patterns:
            masked_text = re.sub(pii.pattern, pii.replacement, masked_text)

        return masked_text

    def pseudonymize(self, text: str, salt: str = '') -> str:
        """假名化 PII（保留格式，替换内容）"""
        result = text

        for pii in self.patterns:
            def replace_func(match):
                original = match.group()
                # 使用哈希生成假名
                hash_value = hashlib.sha256(
                    (original + salt).encode()
                ).hexdigest()

                if pii.name == 'phone':
                    # 保留手机号格式
                    return '1' + hash_value[:10]
                elif pii.name == 'email':
                    # 保留邮箱格式
                    return f"{hash_value[:8]}@example.com"
                else:
                    return f"[{pii.name}_{hash_value[:8]}]"

            result = re.sub(pii.pattern, replace_func, result)

        return result


class DataAnonymizer:
    """数据匿名化处理器"""

    def __init__(self):
        self.pii_detector = PIIDetector()

    def anonymize_record(
        self,
        record: Dict,
        sensitive_fields: List[str],
        method: str = 'mask'
    ) -> Dict:
        """匿名化单条记录"""
        anonymized = record.copy()

        for field in sensitive_fields:
            if field in anonymized:
                value = str(anonymized[field])

                if method == 'mask':
                    anonymized[field] = self.pii_detector.mask(value)
                elif method == 'pseudonymize':
                    anonymized[field] = self.pii_detector.pseudonymize(value)
                elif method == 'hash':
                    anonymized[field] = hashlib.sha256(
                        value.encode()
                    ).hexdigest()
                elif method == 'remove':
                    del anonymized[field]

        return anonymized

    def anonymize_batch(
        self,
        data: List[Dict],
        sensitive_fields: List[str],
        method: str = 'mask'
    ) -> List[Dict]:
        """批量匿名化"""
        return [
            self.anonymize_record(record, sensitive_fields, method)
            for record in data
        ]

    def generate_report(self, data: List[Dict]) -> Dict:
        """生成 PII 检测报告"""
        report = {
            'total_records': len(data),
            'records_with_pii': 0,
            'pii_by_type': defaultdict(int),
            'pii_examples': []
        }

        for record in data:
            record_has_pii = False

            for field, value in record.items():
                if isinstance(value, str):
                    findings = self.pii_detector.detect(value)

                    if findings:
                        record_has_pii = True
                        for finding in findings:
                            report['pii_by_type'][finding['type']] += 1

                            if len(report['pii_examples']) < 10:
                                report['pii_examples'].append({
                                    'field': field,
                                    'type': finding['type'],
                                    'masked_value': self.pii_detector.mask(
                                        finding['value']
                                    )
                                })

            if record_has_pii:
                report['records_with_pii'] += 1

        report['pii_by_type'] = dict(report['pii_by_type'])

        return report


class GDPRCompliance:
    """GDPR 合规工具"""

    @staticmethod
    def get_consent_template() -> str:
        """获取同意书模板"""
        return """
数据收集同意书

尊敬的用户：

我们将收集以下数据用于 [目的说明]：
- 数据类型：[数据类型列表]
- 使用目的：[具体用途]
- 保存期限：[保存时间]
- 数据安全：[安全措施说明]

您的权利：
1. 访问权：您有权访问我们持有的您的个人数据
2. 更正权：您有权要求更正不准确的数据
3. 删除权：您有权要求删除您的数据（"被遗忘权"）
4. 数据可移植权：您有权获取可机器读取格式的数据副本
5. 反对权：您有权反对数据处理

如需行使上述权利，请联系：[联系方式]

□ 我已阅读并同意上述条款
"""

    @staticmethod
    def create_data_processing_record(
        purpose: str,
        data_categories: List[str],
        retention_period: str,
        recipients: List[str]
    ) -> Dict:
        """创建数据处理记录"""
        return {
            'purpose': purpose,
            'data_categories': data_categories,
            'legal_basis': 'consent',  # 或 'legitimate_interest', 'contract' 等
            'retention_period': retention_period,
            'recipients': recipients,
            'security_measures': [
                '数据加密',
                '访问控制',
                '定期审计'
            ],
            'created_at': __import__('datetime').datetime.now().isoformat()
        }


# 使用示例
def privacy_compliance_example():
    # 示例数据
    test_data = [
        {
            'name': '张三',
            'phone': '13812345678',
            'email': 'zhangsan@example.com',
            'id_card': '110101199001011234',
            'comment': '我的手机号是13912345678，邮箱是test@test.com'
        },
        {
            'name': '李四',
            'phone': '15987654321',
            'email': 'lisi@company.com',
            'comment': '联系方式：18611112222'
        }
    ]

    anonymizer = DataAnonymizer()

    # 生成 PII 检测报告
    report = anonymizer.generate_report(test_data)
    print("PII 检测报告:")
    print(f"  - 总记录数: {report['total_records']}")
    print(f"  - 包含 PII 的记录: {report['records_with_pii']}")
    print(f"  - PII 类型分布: {report['pii_by_type']}")

    # 数据脱敏
    anonymized_data = anonymizer.anonymize_batch(
        test_data,
        sensitive_fields=['phone', 'email', 'id_card', 'comment'],
        method='mask'
    )

    print("\n脱敏后数据:")
    for record in anonymized_data:
        print(record)

    return anonymized_data
```

## 实战案例

### 电商评论数据收集系统

```python
"""
完整的电商评论数据收集与标注系统
"""
import asyncio
from dataclasses import dataclass
from typing import List, Dict, Optional
import json
from datetime import datetime


@dataclass
class ReviewCollectionConfig:
    """评论收集配置"""
    target_count: int = 10000
    min_review_length: int = 20
    languages: List[str] = None
    date_range: tuple = None

    def __post_init__(self):
        if self.languages is None:
            self.languages = ['zh']


class EcommerceReviewCollector:
    """电商评论收集系统"""

    def __init__(self, config: ReviewCollectionConfig):
        self.config = config
        self.collected_reviews = []
        self.stats = {
            'total_fetched': 0,
            'valid_count': 0,
            'duplicate_count': 0,
            'filtered_count': 0
        }

    async def collect_from_api(
        self,
        api_client,
        product_ids: List[str]
    ) -> List[Dict]:
        """从 API 收集评论"""
        all_reviews = []

        for product_id in product_ids:
            try:
                reviews = await api_client.get_product_reviews(
                    product_id,
                    page_size=100
                )

                for review in reviews:
                    self.stats['total_fetched'] += 1

                    # 验证和清洗
                    cleaned = self._clean_review(review)
                    if cleaned and self._validate_review(cleaned):
                        all_reviews.append(cleaned)
                        self.stats['valid_count'] += 1
                    else:
                        self.stats['filtered_count'] += 1

                    if len(all_reviews) >= self.config.target_count:
                        break

            except Exception as e:
                print(f"收集产品 {product_id} 评论失败: {e}")

        return all_reviews

    def _clean_review(self, review: Dict) -> Optional[Dict]:
        """清洗评论数据"""
        text = review.get('content', '')

        # 基本清洗
        text = DataCleaner.clean_text(text)

        if not text:
            return None

        return {
            'text': text,
            'rating': review.get('rating'),
            'product_id': review.get('product_id'),
            'user_id': hashlib.md5(
                str(review.get('user_id', '')).encode()
            ).hexdigest()[:8],  # 匿名化用户 ID
            'timestamp': review.get('created_at'),
            'helpful_count': review.get('helpful_count', 0)
        }

    def _validate_review(self, review: Dict) -> bool:
        """验证评论"""
        text = review.get('text', '')

        # 长度检查
        if len(text) < self.config.min_review_length:
            return False

        # 去重检查
        review_hash = hashlib.md5(text.encode()).hexdigest()
        if review_hash in self._seen_hashes:
            self.stats['duplicate_count'] += 1
            return False
        self._seen_hashes.add(review_hash)

        return True

    _seen_hashes = set()

    def prepare_for_annotation(
        self,
        reviews: List[Dict]
    ) -> List[Dict]:
        """准备标注数据"""
        annotation_tasks = []

        for i, review in enumerate(reviews):
            task = {
                'id': i,
                'data': {
                    'text': review['text'],
                    'rating': review['rating']
                },
                'meta': {
                    'product_id': review['product_id'],
                    'timestamp': review['timestamp']
                }
            }
            annotation_tasks.append(task)

        return annotation_tasks

    def export_dataset(
        self,
        reviews: List[Dict],
        annotations: List[Dict],
        output_path: str
    ):
        """导出数据集"""
        dataset = []

        for review, annotation in zip(reviews, annotations):
            item = {
                'text': review['text'],
                'label': annotation.get('label'),
                'rating': review['rating'],
                'metadata': {
                    'product_id': review['product_id'],
                    'annotator_agreement': annotation.get('agreement'),
                    'collection_time': datetime.now().isoformat()
                }
            }
            dataset.append(item)

        # 分割数据集
        import random
        random.shuffle(dataset)

        n = len(dataset)
        train_end = int(n * 0.8)
        val_end = int(n * 0.9)

        splits = {
            'train': dataset[:train_end],
            'validation': dataset[train_end:val_end],
            'test': dataset[val_end:]
        }

        for split_name, split_data in splits.items():
            filepath = f"{output_path}/{split_name}.json"
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(split_data, f, ensure_ascii=False, indent=2)

        print(f"数据集导出完成:")
        print(f"  - 训练集: {len(splits['train'])} 样本")
        print(f"  - 验证集: {len(splits['validation'])} 样本")
        print(f"  - 测试集: {len(splits['test'])} 样本")


def complete_pipeline_example():
    """完整数据收集流程示例"""

    # 1. 配置
    config = ReviewCollectionConfig(
        target_count=5000,
        min_review_length=30
    )

    collector = EcommerceReviewCollector(config)

    # 2. 模拟数据（实际中从 API 获取）
    mock_reviews = [
        {
            'content': '这个产品非常好用，质量很棒，推荐购买！物流也很快。',
            'rating': 5,
            'product_id': 'P001',
            'user_id': 'U123',
            'created_at': '2024-01-10',
            'helpful_count': 15
        },
        {
            'content': '一般般，没有想象中那么好，性价比不高。',
            'rating': 3,
            'product_id': 'P001',
            'user_id': 'U456',
            'created_at': '2024-01-11',
            'helpful_count': 8
        },
        # ... 更多数据
    ]

    # 3. 清洗和验证
    cleaned_reviews = []
    for review in mock_reviews:
        cleaned = collector._clean_review(review)
        if cleaned and collector._validate_review(cleaned):
            cleaned_reviews.append(cleaned)

    print(f"收集统计: {collector.stats}")

    # 4. 准备标注任务
    tasks = collector.prepare_for_annotation(cleaned_reviews)

    # 5. 数据质量检查
    pipeline = DataQualityPipeline()
    pipeline.add_validator(TextQualityValidator(min_length=20))

    validation_result = pipeline.validate_batch(
        [{'text': r['text']} for r in cleaned_reviews]
    )
    print(f"质量检查通过率: {validation_result['pass_rate']:.1%}")

    # 6. 隐私检查
    anonymizer = DataAnonymizer()
    pii_report = anonymizer.generate_report(cleaned_reviews)
    print(f"PII 检测: {pii_report['records_with_pii']} 条记录包含敏感信息")

    return cleaned_reviews, tasks
```

## 面试要点

### 常见面试问题

**Q1: 数据收集时如何处理反爬虫机制？**

常用策略包括：
- 设置随机延迟和请求间隔
- 轮换 User-Agent 和代理 IP
- 使用 Selenium/Playwright 模拟真实浏览器
- 遵守 robots.txt 和网站条款
- 必要时使用验证码识别服务

**Q2: 如何保证标注数据的质量？**

关键措施：
- 使用多人标注 + 一致性检查（Kappa 系数）
- 混入金标准数据监控标注员质量
- 建立标注规范和培训机制
- 使用主动学习减少标注量同时提高效果

**Q3: 众包标注的优缺点是什么？**

优点：
- 成本低，规模化能力强
- 可以快速获取大量标注

缺点：
- 质量参差不齐，需要严格质控
- 复杂任务难以外包
- 隐私和数据安全风险

**Q4: 数据收集需要注意哪些法律合规问题？**

主要考虑：
- GDPR/个人信息保护法合规
- 版权和知识产权
- 网站服务条款
- 数据收集目的的合法性
- 用户同意获取

**Q5: 如何选择数据收集方法？**

决策因素：
- 数据规模需求
- 时效性要求
- 预算限制
- 数据质量要求
- 法律合规约束

### 实战技巧总结

1. **先评估再收集**：明确数据需求后再开始收集
2. **质量优先于数量**：高质量小数据集往往优于低质量大数据集
3. **建立数据管道**：自动化数据收集、清洗、验证流程
4. **持续监控质量**：建立数据质量监控和告警机制
5. **文档化一切**：记录数据来源、处理步骤、版本信息
6. **隐私安全第一**：在设计阶段就考虑隐私保护
7. **迭代优化**：根据模型反馈持续改进数据收集策略

## 延伸阅读

### 推荐工具

- **爬虫框架**：Scrapy、Playwright、Selenium
- **标注平台**：Label Studio、Prodigy、CVAT
- **数据验证**：Great Expectations、Pandera
- **隐私工具**：Microsoft Presidio、Google DLP

### 推荐资源

- 《Web Scraping with Python》- Ryan Mitchell
- 《Data Quality: The Accuracy Dimension》- Jack E. Olson
- [Label Studio 官方文档](https://labelstud.io/guide/)
- [Awesome Data Annotation](https://github.com/taivop/awesome-data-annotation)

### 进阶主题

- 合成数据生成（Synthetic Data Generation）
- 弱监督学习（Weak Supervision）
- 数据增强技术（Data Augmentation）
- 联邦学习中的数据收集（Federated Learning）
- 数据版本控制（DVC、LakeFS）

## 总结

数据收集与标注是机器学习项目成功的基石。本文介绍了从数据收集策略、爬虫技术、API 数据获取，到数据标注平台、众包标注、主动学习，再到数据质量控制和隐私合规的完整知识体系。

关键要点：

1. **策略先行**：在动手收集之前，先明确数据需求和收集策略
2. **技术选型**：根据场景选择合适的数据收集方法（爬虫/API/众包）
3. **质量为王**：建立完善的数据质量控制体系
4. **效率优化**：使用主动学习等技术减少标注成本
5. **合规底线**：始终将隐私保护和法律合规放在首位

掌握这些技能，你将能够为机器学习项目构建高质量的数据基础，这是模型成功的关键前提。
