---
title: Data Collection and Labeling
description: "Master ML data collection workflow: web scraping, APIs, and data labeling platforms"
track: data
section: data-engineering
difficulty: intermediate
tags:
  - data collection
  - scraping
  - labeling
  - data engineering
status: imported
origin: old/src/content/docs/datascience/data-collection.en.md
divergence: 0.329
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 4
  lastUpdated: 2026-01-07
---

Data is the foundation of any machine learning project. The quality and quantity of your data directly impact model performance, often more than the choice of algorithm. We'll cover comprehensive strategies for collecting, labeling, and managing data for ML applications.

## Why Data Collection Matters

The success of machine learning projects fundamentally depends on data quality. As the saying goes: "Garbage in, garbage out." Before diving into sophisticated algorithms, you need to establish a robust data collection pipeline.

### The Data Flywheel

```
+------------------+
|   Collect Data   |
+--------+---------+
         |
         v
+--------+---------+
|   Label Data     |
+--------+---------+
         |
         v
+--------+---------+
|   Train Model    |
+--------+---------+
         |
         v
+--------+---------+
|   Deploy Model   |
+--------+---------+
         |
         v
+--------+---------+
|  Collect More    |
|  (From Users)    |
+--------+---------+
         |
         +-------> (back to top)
```

---

## Data Collection Strategies

### Internal Data Sources

Internal data is often the most valuable and accessible source for enterprise ML projects.

```python
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta

class InternalDataCollector:
    """Collect data from internal databases and systems."""

    def __init__(self, db_config: dict):
        self.engine = create_engine(
            f"postgresql://{db_config['user']}:{db_config['password']}"
            f"@{db_config['host']}:{db_config['port']}/{db_config['database']}"
        )

    def collect_user_behavior(
        self,
        start_date: datetime,
        end_date: datetime,
        event_types: list = None
    ) -> pd.DataFrame:
        """Collect user behavior data for ML training."""

        event_filter = ""
        if event_types:
            event_list = ", ".join([f"'{e}'" for e in event_types])
            event_filter = f"AND event_type IN ({event_list})"

        query = f"""
        SELECT
            user_id,
            session_id,
            event_type,
            event_properties,
            page_url,
            device_type,
            created_at
        FROM user_events
        WHERE created_at BETWEEN '{start_date}' AND '{end_date}'
        {event_filter}
        ORDER BY user_id, created_at
        """

        return pd.read_sql(query, self.engine)

    def collect_transaction_data(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """Collect transaction data for fraud detection or recommendation."""

        query = f"""
        SELECT
            t.transaction_id,
            t.user_id,
            t.amount,
            t.currency,
            t.merchant_id,
            t.merchant_category,
            t.transaction_time,
            t.status,
            u.account_age_days,
            u.total_transactions,
            u.avg_transaction_amount
        FROM transactions t
        JOIN user_profiles u ON t.user_id = u.user_id
        WHERE t.transaction_time BETWEEN '{start_date}' AND '{end_date}'
        """

        return pd.read_sql(query, self.engine)


# Usage example
collector = InternalDataCollector({
    'host': 'localhost',
    'port': 5432,
    'database': 'analytics',
    'user': 'ml_pipeline',
    'password': 'secure_password'
})

# Collect last 30 days of user behavior
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
behavior_data = collector.collect_user_behavior(
    start_date,
    end_date,
    event_types=['click', 'purchase', 'add_to_cart']
)
```

### Public Datasets

Leveraging public datasets accelerates development and provides benchmarks.

```python
import os
import requests
import zipfile
from pathlib import Path
from typing import Optional

class PublicDatasetDownloader:
    """Download and manage public datasets."""

    DATASETS = {
        'mnist': {
            'url': 'https://storage.googleapis.com/tensorflow/tf-keras-datasets/mnist.npz',
            'type': 'npz'
        },
        'cifar10': {
            'url': 'https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz',
            'type': 'tar.gz'
        },
        'imdb_reviews': {
            'url': 'https://ai.stanford.edu/~amaas/data/sentiment/aclImdb_v1.tar.gz',
            'type': 'tar.gz'
        }
    }

    def __init__(self, data_dir: str = './datasets'):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def download(
        self,
        dataset_name: str,
        force: bool = False
    ) -> Path:
        """Download a public dataset."""

        if dataset_name not in self.DATASETS:
            raise ValueError(f"Unknown dataset: {dataset_name}")

        dataset_info = self.DATASETS[dataset_name]
        url = dataset_info['url']
        file_type = dataset_info['type']

        # Determine output path
        filename = url.split('/')[-1]
        output_path = self.data_dir / dataset_name / filename

        # Check if already exists
        if output_path.exists() and not force:
            print(f"Dataset already exists: {output_path}")
            return output_path.parent

        # Create directory
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Download with progress
        print(f"Downloading {dataset_name}...")
        response = requests.get(url, stream=True)
        total_size = int(response.headers.get('content-length', 0))

        with open(output_path, 'wb') as f:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size:
                    progress = (downloaded / total_size) * 100
                    print(f"\rProgress: {progress:.1f}%", end='')

        print(f"\nDownloaded to: {output_path}")

        # Extract if compressed
        if file_type in ['tar.gz', 'zip']:
            self._extract(output_path, file_type)

        return output_path.parent

    def _extract(self, file_path: Path, file_type: str):
        """Extract compressed files."""

        extract_dir = file_path.parent

        if file_type == 'tar.gz':
            import tarfile
            with tarfile.open(file_path, 'r:gz') as tar:
                tar.extractall(extract_dir)
        elif file_type == 'zip':
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)

        print(f"Extracted to: {extract_dir}")


# Using Hugging Face datasets
from datasets import load_dataset

def load_huggingface_dataset(dataset_name: str, split: str = 'train'):
    """Load dataset from Hugging Face Hub."""

    dataset = load_dataset(dataset_name, split=split)

    # Convert to pandas DataFrame
    df = dataset.to_pandas()

    print(f"Loaded {len(df)} samples from {dataset_name}")
    print(f"Columns: {df.columns.tolist()}")

    return df


# Example: Load sentiment dataset
sentiment_data = load_huggingface_dataset('imdb', split='train')
```

---

## Web Scraping Techniques

Web scraping is a powerful technique for collecting data from websites. Always respect robots.txt and terms of service.

### Basic Scraping with BeautifulSoup

```python
import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
from typing import List, Dict
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ScrapedArticle:
    """Data class for scraped articles."""
    title: str
    content: str
    url: str
    author: str = None
    date: str = None
    tags: List[str] = None


class WebScraper:
    """Respectful web scraper with rate limiting."""

    def __init__(
        self,
        base_url: str,
        delay: float = 1.0,
        max_retries: int = 3
    ):
        self.base_url = base_url
        self.delay = delay
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'DataCollectionBot/1.0 (Research purposes; contact@example.com)'
        })

    def get_page(self, url: str) -> BeautifulSoup:
        """Fetch and parse a web page."""

        for attempt in range(self.max_retries):
            try:
                response = self.session.get(url, timeout=10)
                response.raise_for_status()

                # Respect rate limiting
                time.sleep(self.delay)

                return BeautifulSoup(response.content, 'html.parser')

            except requests.RequestException as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.delay * (attempt + 1))

        raise Exception(f"Failed to fetch {url} after {self.max_retries} attempts")

    def check_robots_txt(self) -> Dict[str, List[str]]:
        """Check and parse robots.txt."""

        robots_url = urljoin(self.base_url, '/robots.txt')

        try:
            response = self.session.get(robots_url)
            if response.status_code == 200:
                rules = {'allow': [], 'disallow': []}

                for line in response.text.split('\n'):
                    line = line.strip().lower()
                    if line.startswith('disallow:'):
                        path = line.split(':', 1)[1].strip()
                        rules['disallow'].append(path)
                    elif line.startswith('allow:'):
                        path = line.split(':', 1)[1].strip()
                        rules['allow'].append(path)

                return rules
        except Exception as e:
            logger.warning(f"Could not fetch robots.txt: {e}")

        return {'allow': [], 'disallow': []}

    def scrape_article_list(
        self,
        list_url: str,
        article_selector: str,
        link_selector: str
    ) -> List[str]:
        """Scrape article links from a list page."""

        soup = self.get_page(list_url)
        articles = soup.select(article_selector)

        links = []
        for article in articles:
            link_elem = article.select_one(link_selector)
            if link_elem and link_elem.get('href'):
                full_url = urljoin(self.base_url, link_elem['href'])
                links.append(full_url)

        logger.info(f"Found {len(links)} article links")
        return links

    def scrape_article(
        self,
        url: str,
        title_selector: str,
        content_selector: str,
        author_selector: str = None,
        date_selector: str = None,
        tags_selector: str = None
    ) -> ScrapedArticle:
        """Scrape a single article."""

        soup = self.get_page(url)

        # Extract title
        title_elem = soup.select_one(title_selector)
        title = title_elem.get_text(strip=True) if title_elem else ""

        # Extract content
        content_elems = soup.select(content_selector)
        content = "\n".join([elem.get_text(strip=True) for elem in content_elems])

        # Extract optional fields
        author = None
        if author_selector:
            author_elem = soup.select_one(author_selector)
            author = author_elem.get_text(strip=True) if author_elem else None

        date = None
        if date_selector:
            date_elem = soup.select_one(date_selector)
            date = date_elem.get_text(strip=True) if date_elem else None

        tags = None
        if tags_selector:
            tag_elems = soup.select(tags_selector)
            tags = [elem.get_text(strip=True) for elem in tag_elems]

        return ScrapedArticle(
            title=title,
            content=content,
            url=url,
            author=author,
            date=date,
            tags=tags
        )


# Example usage
scraper = WebScraper(
    base_url='https://example-blog.com',
    delay=2.0  # Be respectful, wait 2 seconds between requests
)

# Check robots.txt first
rules = scraper.check_robots_txt()
print(f"Robots.txt rules: {rules}")

# Scrape article links
article_links = scraper.scrape_article_list(
    list_url='https://example-blog.com/articles',
    article_selector='article.post-preview',
    link_selector='a.post-link'
)

# Scrape individual articles
articles = []
for link in article_links[:10]:  # Limit for demonstration
    article = scraper.scrape_article(
        url=link,
        title_selector='h1.article-title',
        content_selector='div.article-content p',
        author_selector='span.author-name',
        date_selector='time.published-date',
        tags_selector='a.tag'
    )
    articles.append(article)

# Convert to DataFrame
df = pd.DataFrame([vars(a) for a in articles])
print(df.head())
```

### Advanced Scraping with Selenium

For JavaScript-heavy websites, use Selenium:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
import time
from typing import List, Dict


class DynamicScraper:
    """Scraper for JavaScript-rendered content."""

    def __init__(self, headless: bool = True):
        options = Options()
        if headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')

        # Set user agent
        options.add_argument(
            'user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/91.0.4472.124 Safari/537.36'
        )

        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        """Close the browser."""
        self.driver.quit()

    def scrape_infinite_scroll(
        self,
        url: str,
        item_selector: str,
        max_items: int = 100,
        scroll_pause: float = 2.0
    ) -> List[Dict]:
        """Scrape content from infinite scroll pages."""

        self.driver.get(url)

        items = []
        last_height = self.driver.execute_script(
            "return document.body.scrollHeight"
        )

        while len(items) < max_items:
            # Extract current items
            elements = self.driver.find_elements(By.CSS_SELECTOR, item_selector)

            for elem in elements[len(items):]:
                try:
                    item_data = {
                        'text': elem.text,
                        'html': elem.get_attribute('innerHTML')
                    }
                    items.append(item_data)

                    if len(items) >= max_items:
                        break
                except Exception as e:
                    logger.warning(f"Error extracting item: {e}")

            # Scroll down
            self.driver.execute_script(
                "window.scrollTo(0, document.body.scrollHeight);"
            )
            time.sleep(scroll_pause)

            # Check if we've reached the bottom
            new_height = self.driver.execute_script(
                "return document.body.scrollHeight"
            )
            if new_height == last_height:
                break
            last_height = new_height

        return items

    def scrape_with_pagination(
        self,
        url: str,
        item_selector: str,
        next_button_selector: str,
        max_pages: int = 10
    ) -> List[Dict]:
        """Scrape content from paginated pages."""

        self.driver.get(url)
        all_items = []

        for page in range(max_pages):
            # Wait for items to load
            try:
                self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, item_selector))
                )
            except TimeoutException:
                logger.warning(f"Timeout waiting for items on page {page + 1}")
                break

            # Extract items
            elements = self.driver.find_elements(By.CSS_SELECTOR, item_selector)
            for elem in elements:
                all_items.append({
                    'text': elem.text,
                    'page': page + 1
                })

            logger.info(f"Page {page + 1}: Found {len(elements)} items")

            # Try to click next button
            try:
                next_button = self.driver.find_element(
                    By.CSS_SELECTOR, next_button_selector
                )
                if not next_button.is_enabled():
                    break
                next_button.click()
                time.sleep(2)  # Wait for page to load
            except Exception as e:
                logger.info(f"No more pages: {e}")
                break

        return all_items


# Example usage
with DynamicScraper(headless=True) as scraper:
    items = scraper.scrape_infinite_scroll(
        url='https://example.com/feed',
        item_selector='div.post-item',
        max_items=50
    )
    print(f"Scraped {len(items)} items")
```

### Scrapy for Large-Scale Scraping

```python
# scrapy_spider.py
import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy import signals
from typing import List, Dict
import json


class ArticleSpider(scrapy.Spider):
    """Scrapy spider for article collection."""

    name = 'article_spider'

    def __init__(self, start_urls: List[str], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.start_urls = start_urls
        self.collected_data = []

    def parse(self, response):
        """Parse article list page."""

        # Extract article links
        article_links = response.css('article a.article-link::attr(href)').getall()

        for link in article_links:
            yield response.follow(link, callback=self.parse_article)

        # Follow pagination
        next_page = response.css('a.next-page::attr(href)').get()
        if next_page:
            yield response.follow(next_page, callback=self.parse)

    def parse_article(self, response):
        """Parse individual article page."""

        yield {
            'url': response.url,
            'title': response.css('h1.title::text').get(),
            'content': ' '.join(response.css('div.content p::text').getall()),
            'author': response.css('span.author::text').get(),
            'date': response.css('time::attr(datetime)').get(),
            'tags': response.css('a.tag::text').getall()
        }


def run_spider(start_urls: List[str], output_file: str = 'articles.json'):
    """Run the Scrapy spider."""

    process = CrawlerProcess(settings={
        'USER_AGENT': 'ArticleBot/1.0',
        'ROBOTSTXT_OBEY': True,
        'CONCURRENT_REQUESTS': 4,
        'DOWNLOAD_DELAY': 1,
        'FEEDS': {
            output_file: {
                'format': 'json',
                'encoding': 'utf-8',
                'overwrite': True
            }
        }
    })

    process.crawl(ArticleSpider, start_urls=start_urls)
    process.start()

    # Load and return results
    with open(output_file, 'r') as f:
        return json.load(f)
```

---

## API Data Retrieval

APIs provide structured, reliable data access. Here's how to work with them effectively.

### REST API Client

```python
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import time
import json
from functools import wraps
import hashlib


def rate_limited(max_calls: int, period: float):
    """Decorator for rate limiting API calls."""

    calls = []

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            # Remove old calls
            calls[:] = [c for c in calls if now - c < period]

            if len(calls) >= max_calls:
                sleep_time = period - (now - calls[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)
                calls.clear()

            calls.append(time.time())
            return func(*args, **kwargs)
        return wrapper
    return decorator


class APIClient:
    """Generic API client with caching and rate limiting."""

    def __init__(
        self,
        base_url: str,
        api_key: str = None,
        rate_limit: int = 100,
        rate_period: float = 60.0
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.cache = {}
        self.rate_limit = rate_limit
        self.rate_period = rate_period

        if api_key:
            self.session.headers['Authorization'] = f'Bearer {api_key}'

    def _cache_key(self, endpoint: str, params: dict) -> str:
        """Generate cache key."""
        param_str = json.dumps(params, sort_keys=True)
        return hashlib.md5(f"{endpoint}:{param_str}".encode()).hexdigest()

    @rate_limited(max_calls=100, period=60.0)
    def get(
        self,
        endpoint: str,
        params: dict = None,
        use_cache: bool = True,
        cache_ttl: int = 3600
    ) -> Dict:
        """Make GET request with caching."""

        params = params or {}

        # Check cache
        if use_cache:
            cache_key = self._cache_key(endpoint, params)
            if cache_key in self.cache:
                cached_data, cached_time = self.cache[cache_key]
                if time.time() - cached_time < cache_ttl:
                    return cached_data

        # Make request
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.get(url, params=params)
        response.raise_for_status()

        data = response.json()

        # Update cache
        if use_cache:
            self.cache[cache_key] = (data, time.time())

        return data

    def post(self, endpoint: str, data: dict = None, json_data: dict = None) -> Dict:
        """Make POST request."""

        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        response = self.session.post(url, data=data, json=json_data)
        response.raise_for_status()

        return response.json()

    def paginate(
        self,
        endpoint: str,
        params: dict = None,
        page_param: str = 'page',
        limit_param: str = 'limit',
        limit: int = 100,
        max_pages: int = None,
        data_key: str = 'data'
    ) -> List[Dict]:
        """Paginate through API results."""

        params = params or {}
        params[limit_param] = limit

        all_data = []
        page = 1

        while True:
            params[page_param] = page

            try:
                response = self.get(endpoint, params, use_cache=False)
            except requests.HTTPError as e:
                if e.response.status_code == 404:
                    break
                raise

            # Extract data
            if data_key:
                page_data = response.get(data_key, [])
            else:
                page_data = response if isinstance(response, list) else [response]

            if not page_data:
                break

            all_data.extend(page_data)

            # Check for more pages
            if len(page_data) < limit:
                break

            if max_pages and page >= max_pages:
                break

            page += 1

        return all_data


# Example: Twitter-like API client
class SocialMediaAPIClient(APIClient):
    """Client for social media API."""

    def get_user_posts(self, user_id: str, limit: int = 100) -> List[Dict]:
        """Get posts from a user."""

        return self.paginate(
            endpoint=f'/users/{user_id}/posts',
            limit=min(limit, 100),
            max_pages=limit // 100 + 1
        )

    def search_posts(
        self,
        query: str,
        start_date: datetime = None,
        end_date: datetime = None,
        limit: int = 1000
    ) -> List[Dict]:
        """Search posts with filters."""

        params = {'q': query}

        if start_date:
            params['start_date'] = start_date.isoformat()
        if end_date:
            params['end_date'] = end_date.isoformat()

        return self.paginate(
            endpoint='/posts/search',
            params=params,
            limit=min(limit, 100),
            max_pages=limit // 100 + 1
        )

    def get_trending_topics(self, location: str = 'global') -> List[Dict]:
        """Get trending topics."""

        return self.get(
            endpoint='/trends',
            params={'location': location},
            cache_ttl=300  # Cache for 5 minutes
        )


# Example: OpenWeather API
class WeatherAPIClient(APIClient):
    """Client for weather data API."""

    def __init__(self, api_key: str):
        super().__init__(
            base_url='https://api.openweathermap.org/data/2.5',
            api_key=None  # Use query param instead
        )
        self.api_key_param = api_key

    def get_current_weather(self, city: str) -> Dict:
        """Get current weather for a city."""

        return self.get(
            endpoint='/weather',
            params={
                'q': city,
                'appid': self.api_key_param,
                'units': 'metric'
            }
        )

    def get_forecast(self, city: str, days: int = 5) -> List[Dict]:
        """Get weather forecast."""

        response = self.get(
            endpoint='/forecast',
            params={
                'q': city,
                'appid': self.api_key_param,
                'units': 'metric',
                'cnt': days * 8  # 3-hour intervals
            }
        )

        return response.get('list', [])


# Usage example
weather_client = WeatherAPIClient(api_key='your_api_key')
current = weather_client.get_current_weather('London')
forecast = weather_client.get_forecast('London', days=3)
```

### Async API Client for High Performance

```python
import asyncio
import aiohttp
from typing import List, Dict, Callable
from dataclasses import dataclass
import time


@dataclass
class AsyncAPIResponse:
    """Response wrapper for async API calls."""
    url: str
    status: int
    data: Dict
    elapsed: float


class AsyncAPIClient:
    """High-performance async API client."""

    def __init__(
        self,
        base_url: str,
        api_key: str = None,
        max_concurrent: int = 10
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def _get_session(self) -> aiohttp.ClientSession:
        """Create aiohttp session."""

        headers = {}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'

        return aiohttp.ClientSession(headers=headers)

    async def get(
        self,
        session: aiohttp.ClientSession,
        endpoint: str,
        params: dict = None
    ) -> AsyncAPIResponse:
        """Make async GET request."""

        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        async with self.semaphore:
            start = time.time()
            async with session.get(url, params=params) as response:
                data = await response.json()
                elapsed = time.time() - start

                return AsyncAPIResponse(
                    url=url,
                    status=response.status,
                    data=data,
                    elapsed=elapsed
                )

    async def batch_get(
        self,
        endpoints: List[str],
        params_list: List[dict] = None
    ) -> List[AsyncAPIResponse]:
        """Make multiple concurrent GET requests."""

        if params_list is None:
            params_list = [None] * len(endpoints)

        async with await self._get_session() as session:
            tasks = [
                self.get(session, endpoint, params)
                for endpoint, params in zip(endpoints, params_list)
            ]

            return await asyncio.gather(*tasks, return_exceptions=True)

    async def parallel_paginate(
        self,
        endpoint_template: str,
        ids: List[str],
        params: dict = None
    ) -> Dict[str, List[Dict]]:
        """Paginate multiple endpoints in parallel."""

        params = params or {}
        results = {}

        endpoints = [endpoint_template.format(id=id) for id in ids]
        responses = await self.batch_get(endpoints)

        for id, response in zip(ids, responses):
            if isinstance(response, Exception):
                results[id] = []
            else:
                results[id] = response.data.get('data', [])

        return results


# Example usage
async def collect_user_data(user_ids: List[str]):
    """Collect data for multiple users concurrently."""

    client = AsyncAPIClient(
        base_url='https://api.example.com',
        api_key='your_api_key',
        max_concurrent=20
    )

    # Get user profiles
    profile_endpoints = [f'/users/{uid}/profile' for uid in user_ids]
    profile_responses = await client.batch_get(profile_endpoints)

    # Get user posts
    posts = await client.parallel_paginate(
        endpoint_template='/users/{id}/posts',
        ids=user_ids
    )

    # Combine results
    results = []
    for uid, profile_resp in zip(user_ids, profile_responses):
        if not isinstance(profile_resp, Exception):
            results.append({
                'user_id': uid,
                'profile': profile_resp.data,
                'posts': posts.get(uid, [])
            })

    return results


# Run async collection
user_ids = ['user1', 'user2', 'user3', 'user4', 'user5']
data = asyncio.run(collect_user_data(user_ids))
```

---

## Data Labeling Platforms

### Label Studio Integration

Label Studio is an open-source data labeling tool that supports various annotation tasks.

```python
import requests
from typing import List, Dict, Any
import json


class LabelStudioClient:
    """Client for Label Studio API."""

    def __init__(self, url: str, api_key: str):
        self.url = url.rstrip('/')
        self.headers = {
            'Authorization': f'Token {api_key}',
            'Content-Type': 'application/json'
        }

    def create_project(
        self,
        title: str,
        description: str,
        label_config: str
    ) -> Dict:
        """Create a new labeling project."""

        response = requests.post(
            f"{self.url}/api/projects",
            headers=self.headers,
            json={
                'title': title,
                'description': description,
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
        """Import tasks to a project."""

        response = requests.post(
            f"{self.url}/api/projects/{project_id}/import",
            headers=self.headers,
            json=tasks
        )
        response.raise_for_status()
        return response.json()

    def get_annotations(
        self,
        project_id: int,
        task_id: int = None
    ) -> List[Dict]:
        """Get annotations for a project or task."""

        if task_id:
            url = f"{self.url}/api/tasks/{task_id}/annotations"
        else:
            url = f"{self.url}/api/projects/{project_id}/export"

        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def export_annotations(
        self,
        project_id: int,
        export_type: str = 'JSON'
    ) -> List[Dict]:
        """Export all annotations from a project."""

        response = requests.get(
            f"{self.url}/api/projects/{project_id}/export",
            headers=self.headers,
            params={'exportType': export_type}
        )
        response.raise_for_status()
        return response.json()


# Label configurations for different tasks

# Text Classification
TEXT_CLASSIFICATION_CONFIG = """
<View>
  <Text name="text" value="$text"/>
  <Choices name="sentiment" toName="text" choice="single">
    <Choice value="positive"/>
    <Choice value="negative"/>
    <Choice value="neutral"/>
  </Choices>
</View>
"""

# Named Entity Recognition
NER_CONFIG = """
<View>
  <Labels name="label" toName="text">
    <Label value="PER" background="red"/>
    <Label value="ORG" background="blue"/>
    <Label value="LOC" background="green"/>
    <Label value="DATE" background="yellow"/>
  </Labels>
  <Text name="text" value="$text"/>
</View>
"""

# Image Classification
IMAGE_CLASSIFICATION_CONFIG = """
<View>
  <Image name="image" value="$image"/>
  <Choices name="choice" toName="image">
    <Choice value="cat"/>
    <Choice value="dog"/>
    <Choice value="other"/>
  </Choices>
</View>
"""

# Object Detection
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


# Example: Set up a text classification project
def setup_text_classification_project(
    client: LabelStudioClient,
    texts: List[str]
):
    """Set up a complete text classification project."""

    # Create project
    project = client.create_project(
        title="Sentiment Analysis",
        description="Label text sentiment as positive, negative, or neutral",
        label_config=TEXT_CLASSIFICATION_CONFIG
    )

    project_id = project['id']

    # Prepare tasks
    tasks = [{'data': {'text': text}} for text in texts]

    # Import tasks
    import_result = client.import_tasks(project_id, tasks)

    print(f"Created project {project_id} with {import_result['task_count']} tasks")

    return project_id


# Example: Process completed annotations
def process_annotations(
    client: LabelStudioClient,
    project_id: int
) -> List[Dict]:
    """Process and convert annotations to training format."""

    annotations = client.export_annotations(project_id)

    training_data = []
    for item in annotations:
        if item.get('annotations'):
            annotation = item['annotations'][0]
            result = annotation.get('result', [])

            if result:
                label = result[0]['value']['choices'][0]
                training_data.append({
                    'text': item['data']['text'],
                    'label': label
                })

    return training_data
```

### Custom Labeling Interface

```python
import streamlit as st
import pandas as pd
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Callable


class SimpleLabelingApp:
    """Simple Streamlit-based labeling application."""

    def __init__(
        self,
        data_file: str,
        labels: List[str],
        output_dir: str = './annotations'
    ):
        self.data_file = data_file
        self.labels = labels
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Load data
        self.data = self._load_data()
        self.annotations = self._load_annotations()

    def _load_data(self) -> List[Dict]:
        """Load data to be labeled."""

        if self.data_file.endswith('.json'):
            with open(self.data_file) as f:
                return json.load(f)
        elif self.data_file.endswith('.csv'):
            df = pd.read_csv(self.data_file)
            return df.to_dict('records')
        else:
            raise ValueError(f"Unsupported file format: {self.data_file}")

    def _load_annotations(self) -> Dict:
        """Load existing annotations."""

        annotation_file = self.output_dir / 'annotations.json'
        if annotation_file.exists():
            with open(annotation_file) as f:
                return json.load(f)
        return {}

    def _save_annotations(self):
        """Save annotations to file."""

        annotation_file = self.output_dir / 'annotations.json'
        with open(annotation_file, 'w') as f:
            json.dump(self.annotations, f, indent=2)

    def run(self):
        """Run the labeling application."""

        st.title("Data Labeling Interface")

        # Sidebar with statistics
        st.sidebar.header("Progress")
        total = len(self.data)
        labeled = len(self.annotations)
        st.sidebar.progress(labeled / total if total > 0 else 0)
        st.sidebar.write(f"Labeled: {labeled}/{total}")

        # Find next unlabeled item
        current_idx = st.sidebar.number_input(
            "Go to item",
            min_value=0,
            max_value=total - 1,
            value=self._find_next_unlabeled()
        )

        if current_idx < total:
            item = self.data[current_idx]
            item_id = str(current_idx)

            # Display item
            st.header(f"Item {current_idx + 1} of {total}")

            # Display text content
            if 'text' in item:
                st.text_area("Text", item['text'], height=200, disabled=True)

            # Display image if present
            if 'image_url' in item:
                st.image(item['image_url'])

            # Display metadata
            with st.expander("Metadata"):
                st.json(item)

            # Label selection
            st.subheader("Select Label")

            current_label = self.annotations.get(item_id, {}).get('label')

            cols = st.columns(len(self.labels))
            for i, label in enumerate(self.labels):
                with cols[i]:
                    if st.button(
                        label,
                        type="primary" if label == current_label else "secondary",
                        use_container_width=True
                    ):
                        self.annotations[item_id] = {
                            'label': label,
                            'timestamp': datetime.now().isoformat(),
                            'item_index': current_idx
                        }
                        self._save_annotations()
                        st.rerun()

            # Skip button
            if st.button("Skip"):
                st.session_state['current_idx'] = current_idx + 1
                st.rerun()

            # Notes field
            notes = st.text_input(
                "Notes (optional)",
                value=self.annotations.get(item_id, {}).get('notes', '')
            )
            if notes:
                if item_id in self.annotations:
                    self.annotations[item_id]['notes'] = notes
                    self._save_annotations()

        # Export section
        st.sidebar.header("Export")
        if st.sidebar.button("Export Annotations"):
            export_data = self._export_training_data()
            st.sidebar.download_button(
                "Download JSON",
                json.dumps(export_data, indent=2),
                file_name="training_data.json",
                mime="application/json"
            )

    def _find_next_unlabeled(self) -> int:
        """Find index of next unlabeled item."""

        for i in range(len(self.data)):
            if str(i) not in self.annotations:
                return i
        return 0

    def _export_training_data(self) -> List[Dict]:
        """Export annotations in training format."""

        training_data = []
        for idx, annotation in self.annotations.items():
            item = self.data[int(idx)]
            training_data.append({
                **item,
                'label': annotation['label']
            })
        return training_data


# To run: streamlit run labeling_app.py
# if __name__ == "__main__":
#     app = SimpleLabelingApp(
#         data_file='data.json',
#         labels=['positive', 'negative', 'neutral']
#     )
#     app.run()
```

---

## Crowdsourced Labeling

### Amazon Mechanical Turk Integration

```python
import boto3
from typing import List, Dict
import json
from datetime import datetime
import xml.etree.ElementTree as ET


class MTurkManager:
    """Manage crowdsourced labeling via Amazon Mechanical Turk."""

    def __init__(
        self,
        aws_access_key: str,
        aws_secret_key: str,
        sandbox: bool = True
    ):
        endpoint_url = (
            'https://mturk-requester-sandbox.us-east-1.amazonaws.com'
            if sandbox else
            'https://mturk-requester.us-east-1.amazonaws.com'
        )

        self.client = boto3.client(
            'mturk',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name='us-east-1',
            endpoint_url=endpoint_url
        )
        self.sandbox = sandbox

    def get_account_balance(self) -> float:
        """Get account balance."""

        response = self.client.get_account_balance()
        return float(response['AvailableBalance'])

    def create_hit_type(
        self,
        title: str,
        description: str,
        reward: str,
        duration_seconds: int = 3600,
        keywords: str = "data labeling, classification"
    ) -> str:
        """Create a HIT type for reuse."""

        response = self.client.create_hit_type(
            Title=title,
            Description=description,
            Reward=reward,
            AssignmentDurationInSeconds=duration_seconds,
            Keywords=keywords,
            QualificationRequirements=[
                {
                    'QualificationTypeId': '00000000000000000040',  # Worker_NumberHITsApproved
                    'Comparator': 'GreaterThan',
                    'IntegerValues': [100]
                },
                {
                    'QualificationTypeId': '000000000000000000L0',  # Worker_PercentAssignmentsApproved
                    'Comparator': 'GreaterThan',
                    'IntegerValues': [95]
                }
            ]
        )

        return response['HITTypeId']

    def create_classification_hit(
        self,
        hit_type_id: str,
        text: str,
        labels: List[str],
        max_assignments: int = 3
    ) -> str:
        """Create a text classification HIT."""

        # Build question XML
        question_xml = self._build_classification_question(text, labels)

        response = self.client.create_hit_with_hit_type(
            HITTypeId=hit_type_id,
            MaxAssignments=max_assignments,
            LifetimeInSeconds=86400,  # 24 hours
            Question=question_xml
        )

        return response['HIT']['HITId']

    def _build_classification_question(
        self,
        text: str,
        labels: List[str]
    ) -> str:
        """Build HTMLQuestion XML for classification task."""

        options_html = ''.join([
            f'<input type="radio" name="label" value="{label}" required> {label}<br>'
            for label in labels
        ])

        html_content = f"""
        <HTMLQuestion xmlns="http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2011-11-11/HTMLQuestion.xsd">
          <HTMLContent><![CDATA[
            <!DOCTYPE html>
            <html>
            <head>
              <meta http-equiv='Content-Type' content='text/html; charset=UTF-8'/>
              <script type='text/javascript' src='https://s3.amazonaws.com/mturk-public/externalHIT_v1.js'></script>
            </head>
            <body>
              <form name='mturk_form' method='post' id='mturk_form' action='https://www.mturk.com/mturk/externalSubmit'>
                <input type='hidden' value='' name='assignmentId' id='assignmentId'/>

                <h2>Text Classification Task</h2>
                <p>Please read the following text and select the most appropriate label:</p>

                <div style="background-color: #f0f0f0; padding: 10px; margin: 10px 0;">
                  <p>{text}</p>
                </div>

                <h3>Select a label:</h3>
                {options_html}

                <br><br>
                <input type='submit' id='submitButton' value='Submit' />
              </form>

              <script language='Javascript'>
                turkSetAssignmentID();
              </script>
            </body>
            </html>
          ]]></HTMLContent>
          <FrameHeight>500</FrameHeight>
        </HTMLQuestion>
        """

        return html_content

    def get_hit_results(self, hit_id: str) -> List[Dict]:
        """Get results for a HIT."""

        results = []

        response = self.client.list_assignments_for_hit(
            HITId=hit_id,
            AssignmentStatuses=['Submitted', 'Approved', 'Rejected']
        )

        for assignment in response['Assignments']:
            # Parse answer XML
            answer_xml = assignment['Answer']
            root = ET.fromstring(answer_xml)

            # Extract answer
            ns = {'mt': 'http://mechanicalturk.amazonaws.com/AWSMechanicalTurkDataSchemas/2005-10-01/QuestionFormAnswers.xsd'}
            answer = root.find('.//mt:FreeText', ns)

            results.append({
                'assignment_id': assignment['AssignmentId'],
                'worker_id': assignment['WorkerId'],
                'label': answer.text if answer is not None else None,
                'submit_time': assignment['SubmitTime'],
                'status': assignment['AssignmentStatus']
            })

        return results

    def approve_assignment(self, assignment_id: str, feedback: str = None):
        """Approve a completed assignment."""

        params = {'AssignmentId': assignment_id}
        if feedback:
            params['RequesterFeedback'] = feedback

        self.client.approve_assignment(**params)

    def reject_assignment(self, assignment_id: str, reason: str):
        """Reject an assignment."""

        self.client.reject_assignment(
            AssignmentId=assignment_id,
            RequesterFeedback=reason
        )


def aggregate_labels(
    results: List[Dict],
    method: str = 'majority'
) -> str:
    """Aggregate multiple worker labels."""

    labels = [r['label'] for r in results if r['label']]

    if not labels:
        return None

    if method == 'majority':
        from collections import Counter
        counter = Counter(labels)
        return counter.most_common(1)[0][0]

    elif method == 'unanimous':
        if len(set(labels)) == 1:
            return labels[0]
        return None

    else:
        raise ValueError(f"Unknown aggregation method: {method}")
```

### Quality Control for Crowdsourced Labels

```python
import numpy as np
from typing import List, Dict, Tuple
from collections import defaultdict
from scipy import stats


class LabelQualityController:
    """Quality control for crowdsourced labels."""

    def __init__(self, labels: List[str]):
        self.labels = labels
        self.worker_stats = defaultdict(lambda: {'correct': 0, 'total': 0})
        self.gold_standards = {}

    def add_gold_standard(self, item_id: str, correct_label: str):
        """Add a gold standard (known correct) item."""

        self.gold_standards[item_id] = correct_label

    def record_annotation(
        self,
        worker_id: str,
        item_id: str,
        label: str
    ):
        """Record a worker's annotation."""

        # Check against gold standard if available
        if item_id in self.gold_standards:
            self.worker_stats[worker_id]['total'] += 1
            if label == self.gold_standards[item_id]:
                self.worker_stats[worker_id]['correct'] += 1

    def get_worker_accuracy(self, worker_id: str) -> float:
        """Get worker's accuracy on gold standards."""

        stats = self.worker_stats[worker_id]
        if stats['total'] == 0:
            return 0.5  # Default for new workers
        return stats['correct'] / stats['total']

    def compute_inter_annotator_agreement(
        self,
        annotations: List[Dict]
    ) -> Dict[str, float]:
        """Compute inter-annotator agreement metrics."""

        # Group by item
        by_item = defaultdict(list)
        for ann in annotations:
            by_item[ann['item_id']].append(ann['label'])

        # Raw agreement
        agreements = []
        for item_id, labels in by_item.items():
            if len(labels) >= 2:
                # Pairwise agreement
                n_agree = sum(1 for i in range(len(labels))
                             for j in range(i+1, len(labels))
                             if labels[i] == labels[j])
                n_pairs = len(labels) * (len(labels) - 1) / 2
                agreements.append(n_agree / n_pairs)

        raw_agreement = np.mean(agreements) if agreements else 0

        # Cohen's Kappa (for 2 annotators)
        # Fleiss' Kappa (for multiple annotators)
        kappa = self._compute_fleiss_kappa(by_item)

        return {
            'raw_agreement': raw_agreement,
            'fleiss_kappa': kappa,
            'n_items': len(by_item)
        }

    def _compute_fleiss_kappa(
        self,
        by_item: Dict[str, List[str]]
    ) -> float:
        """Compute Fleiss' Kappa for multiple annotators."""

        n_items = len(by_item)
        n_categories = len(self.labels)

        # Build count matrix
        counts = np.zeros((n_items, n_categories))
        n_raters = None

        for i, (item_id, labels) in enumerate(by_item.items()):
            if n_raters is None:
                n_raters = len(labels)

            for label in labels:
                if label in self.labels:
                    j = self.labels.index(label)
                    counts[i, j] += 1

        if n_raters is None or n_raters < 2:
            return 0.0

        # Compute Fleiss' Kappa
        p_j = np.sum(counts, axis=0) / (n_items * n_raters)
        P_bar_e = np.sum(p_j ** 2)

        P_i = (np.sum(counts ** 2, axis=1) - n_raters) / (n_raters * (n_raters - 1))
        P_bar = np.mean(P_i)

        kappa = (P_bar - P_bar_e) / (1 - P_bar_e) if P_bar_e < 1 else 0

        return kappa

    def weighted_vote(
        self,
        annotations: List[Dict]
    ) -> Tuple[str, float]:
        """Get weighted vote based on worker accuracy."""

        label_weights = defaultdict(float)

        for ann in annotations:
            worker_accuracy = self.get_worker_accuracy(ann['worker_id'])
            label_weights[ann['label']] += worker_accuracy

        if not label_weights:
            return None, 0.0

        best_label = max(label_weights.items(), key=lambda x: x[1])
        total_weight = sum(label_weights.values())
        confidence = best_label[1] / total_weight if total_weight > 0 else 0

        return best_label[0], confidence

    def dawid_skene(
        self,
        annotations: List[Dict],
        max_iterations: int = 20
    ) -> Dict[str, str]:
        """
        Apply Dawid-Skene algorithm for label aggregation.
        This method models worker reliability and item difficulty.
        """

        # Initialize
        items = list(set(ann['item_id'] for ann in annotations))
        workers = list(set(ann['worker_id'] for ann in annotations))
        n_labels = len(self.labels)

        # Build annotation matrix
        ann_by_item = defaultdict(dict)
        for ann in annotations:
            ann_by_item[ann['item_id']][ann['worker_id']] = ann['label']

        # Initialize with majority vote
        label_probs = {}
        for item_id, worker_labels in ann_by_item.items():
            counts = defaultdict(int)
            for label in worker_labels.values():
                counts[label] += 1
            total = sum(counts.values())
            label_probs[item_id] = {
                label: counts[label] / total for label in self.labels
            }

        # EM iterations
        for iteration in range(max_iterations):
            # E-step: Estimate worker error rates
            error_rates = {}
            for worker in workers:
                error_rates[worker] = np.zeros((n_labels, n_labels))

                for item_id, worker_labels in ann_by_item.items():
                    if worker in worker_labels:
                        given_label = worker_labels[worker]
                        j = self.labels.index(given_label)

                        for k, true_label in enumerate(self.labels):
                            error_rates[worker][k, j] += label_probs[item_id].get(true_label, 0)

                # Normalize
                for k in range(n_labels):
                    total = np.sum(error_rates[worker][k, :])
                    if total > 0:
                        error_rates[worker][k, :] /= total

            # M-step: Update label probabilities
            new_label_probs = {}
            for item_id, worker_labels in ann_by_item.items():
                probs = np.ones(n_labels)

                for worker, label in worker_labels.items():
                    j = self.labels.index(label)
                    for k in range(n_labels):
                        probs[k] *= error_rates[worker][k, j]

                probs /= np.sum(probs)
                new_label_probs[item_id] = {
                    self.labels[k]: probs[k] for k in range(n_labels)
                }

            label_probs = new_label_probs

        # Get final labels
        final_labels = {}
        for item_id, probs in label_probs.items():
            final_labels[item_id] = max(probs.items(), key=lambda x: x[1])[0]

        return final_labels
```

---

## Active Learning for Efficient Labeling

Active learning reduces labeling costs by selecting the most informative samples.

```python
import numpy as np
from typing import List, Tuple, Callable
from sklearn.base import BaseEstimator
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import entropy
import pandas as pd


class ActiveLearner:
    """Active learning for efficient data labeling."""

    def __init__(
        self,
        model: BaseEstimator = None,
        query_strategy: str = 'uncertainty'
    ):
        self.model = model or RandomForestClassifier(n_estimators=100)
        self.query_strategy = query_strategy
        self.X_labeled = None
        self.y_labeled = None
        self.X_unlabeled = None
        self.labeled_indices = []

    def initialize(
        self,
        X_initial: np.ndarray,
        y_initial: np.ndarray,
        X_pool: np.ndarray
    ):
        """Initialize with seed labeled data and unlabeled pool."""

        self.X_labeled = X_initial.copy()
        self.y_labeled = y_initial.copy()
        self.X_unlabeled = X_pool.copy()
        self.labeled_indices = list(range(len(X_initial)))

        # Train initial model
        self.model.fit(self.X_labeled, self.y_labeled)

    def query(self, n_samples: int = 1) -> List[int]:
        """Select samples to label next."""

        if self.query_strategy == 'uncertainty':
            return self._uncertainty_sampling(n_samples)
        elif self.query_strategy == 'entropy':
            return self._entropy_sampling(n_samples)
        elif self.query_strategy == 'margin':
            return self._margin_sampling(n_samples)
        elif self.query_strategy == 'random':
            return self._random_sampling(n_samples)
        elif self.query_strategy == 'diversity':
            return self._diversity_sampling(n_samples)
        else:
            raise ValueError(f"Unknown strategy: {self.query_strategy}")

    def _uncertainty_sampling(self, n_samples: int) -> List[int]:
        """Select samples with lowest prediction confidence."""

        probs = self.model.predict_proba(self.X_unlabeled)
        confidence = np.max(probs, axis=1)

        # Select least confident
        indices = np.argsort(confidence)[:n_samples]
        return indices.tolist()

    def _entropy_sampling(self, n_samples: int) -> List[int]:
        """Select samples with highest prediction entropy."""

        probs = self.model.predict_proba(self.X_unlabeled)
        entropies = entropy(probs.T)

        # Select highest entropy
        indices = np.argsort(entropies)[-n_samples:][::-1]
        return indices.tolist()

    def _margin_sampling(self, n_samples: int) -> List[int]:
        """Select samples with smallest margin between top two predictions."""

        probs = self.model.predict_proba(self.X_unlabeled)

        # Sort probabilities for each sample
        sorted_probs = np.sort(probs, axis=1)
        margins = sorted_probs[:, -1] - sorted_probs[:, -2]

        # Select smallest margins
        indices = np.argsort(margins)[:n_samples]
        return indices.tolist()

    def _random_sampling(self, n_samples: int) -> List[int]:
        """Random baseline sampling."""

        indices = np.random.choice(
            len(self.X_unlabeled),
            size=min(n_samples, len(self.X_unlabeled)),
            replace=False
        )
        return indices.tolist()

    def _diversity_sampling(self, n_samples: int) -> List[int]:
        """Select diverse samples using k-means clustering."""

        from sklearn.cluster import KMeans

        n_clusters = min(n_samples, len(self.X_unlabeled))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(self.X_unlabeled)

        # Select sample closest to each cluster center
        indices = []
        for i in range(n_clusters):
            cluster_mask = kmeans.labels_ == i
            cluster_indices = np.where(cluster_mask)[0]

            if len(cluster_indices) > 0:
                # Find closest to center
                center = kmeans.cluster_centers_[i]
                distances = np.linalg.norm(
                    self.X_unlabeled[cluster_indices] - center, axis=1
                )
                closest = cluster_indices[np.argmin(distances)]
                indices.append(closest)

        return indices

    def teach(self, indices: List[int], labels: np.ndarray):
        """Add newly labeled samples to training set."""

        # Add to labeled set
        new_X = self.X_unlabeled[indices]
        self.X_labeled = np.vstack([self.X_labeled, new_X])
        self.y_labeled = np.concatenate([self.y_labeled, labels])

        # Remove from unlabeled pool
        self.X_unlabeled = np.delete(self.X_unlabeled, indices, axis=0)

        # Retrain model
        self.model.fit(self.X_labeled, self.y_labeled)

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> float:
        """Evaluate current model."""

        return self.model.score(X_test, y_test)


class BatchActiveLearner(ActiveLearner):
    """Active learner with batch mode for efficiency."""

    def query_batch(
        self,
        n_samples: int,
        batch_size: int = 10
    ) -> List[List[int]]:
        """Query multiple batches of samples."""

        batches = []
        remaining = n_samples

        while remaining > 0 and len(self.X_unlabeled) > 0:
            current_batch_size = min(batch_size, remaining, len(self.X_unlabeled))
            indices = self.query(current_batch_size)
            batches.append(indices)
            remaining -= current_batch_size

            # Note: In practice, you would wait for labels here
            # before querying the next batch

        return batches


# Example usage
def run_active_learning_simulation(
    X_pool: np.ndarray,
    y_pool: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    initial_size: int = 10,
    query_size: int = 5,
    n_iterations: int = 20
):
    """Run active learning simulation."""

    # Split initial labeled set
    initial_indices = np.random.choice(len(X_pool), initial_size, replace=False)
    X_initial = X_pool[initial_indices]
    y_initial = y_pool[initial_indices]

    pool_mask = np.ones(len(X_pool), dtype=bool)
    pool_mask[initial_indices] = False
    X_remaining = X_pool[pool_mask]
    y_remaining = y_pool[pool_mask]  # Simulated oracle

    # Compare strategies
    strategies = ['uncertainty', 'entropy', 'margin', 'random', 'diversity']
    results = {strategy: [] for strategy in strategies}

    for strategy in strategies:
        # Initialize learner
        learner = ActiveLearner(query_strategy=strategy)
        learner.initialize(X_initial.copy(), y_initial.copy(), X_remaining.copy())

        # Track pool labels for simulation
        pool_labels = y_remaining.copy()

        # Initial accuracy
        accuracy = learner.evaluate(X_test, y_test)
        results[strategy].append(accuracy)

        # Active learning loop
        for i in range(n_iterations):
            # Query
            indices = learner.query(query_size)

            # Get labels (simulated oracle)
            labels = pool_labels[indices]

            # Update pool labels array
            pool_labels = np.delete(pool_labels, indices)

            # Teach
            learner.teach(indices, labels)

            # Evaluate
            accuracy = learner.evaluate(X_test, y_test)
            results[strategy].append(accuracy)

        print(f"{strategy}: Final accuracy = {results[strategy][-1]:.4f}")

    return results
```

---

## Data Quality Control

### Automated Quality Checks

```python
import pandas as pd
import numpy as np
from typing import Dict, List, Callable, Any
from dataclasses import dataclass
from enum import Enum


class CheckSeverity(Enum):
    """Severity levels for quality checks."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class QualityCheckResult:
    """Result of a quality check."""
    name: str
    passed: bool
    severity: CheckSeverity
    message: str
    details: Dict[str, Any] = None


class DataQualityChecker:
    """Comprehensive data quality checking framework."""

    def __init__(self):
        self.checks: List[Callable] = []
        self.results: List[QualityCheckResult] = []

    def add_check(self, check_func: Callable, severity: CheckSeverity = CheckSeverity.ERROR):
        """Add a quality check."""
        self.checks.append((check_func, severity))

    def run_checks(self, df: pd.DataFrame) -> List[QualityCheckResult]:
        """Run all quality checks."""

        self.results = []

        for check_func, severity in self.checks:
            try:
                result = check_func(df)
                result.severity = severity
                self.results.append(result)
            except Exception as e:
                self.results.append(QualityCheckResult(
                    name=check_func.__name__,
                    passed=False,
                    severity=severity,
                    message=f"Check failed with error: {str(e)}"
                ))

        return self.results

    def get_summary(self) -> Dict:
        """Get summary of check results."""

        return {
            'total_checks': len(self.results),
            'passed': sum(1 for r in self.results if r.passed),
            'failed': sum(1 for r in self.results if not r.passed),
            'by_severity': {
                severity.value: sum(1 for r in self.results
                                   if not r.passed and r.severity == severity)
                for severity in CheckSeverity
            }
        }

    def has_critical_failures(self) -> bool:
        """Check if any critical checks failed."""

        return any(
            not r.passed and r.severity == CheckSeverity.CRITICAL
            for r in self.results
        )


# Predefined quality checks

def check_no_nulls(column: str):
    """Check that column has no null values."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        null_count = df[column].isnull().sum()
        null_pct = null_count / len(df) * 100

        return QualityCheckResult(
            name=f"no_nulls_{column}",
            passed=null_count == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {null_count} null values ({null_pct:.2f}%)",
            details={'null_count': int(null_count), 'null_percentage': float(null_pct)}
        )

    return _check


def check_unique(column: str):
    """Check that column values are unique."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        duplicate_count = df[column].duplicated().sum()

        return QualityCheckResult(
            name=f"unique_{column}",
            passed=duplicate_count == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {duplicate_count} duplicate values",
            details={'duplicate_count': int(duplicate_count)}
        )

    return _check


def check_value_range(column: str, min_val: float, max_val: float):
    """Check that values are within expected range."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        out_of_range = df[(df[column] < min_val) | (df[column] > max_val)]

        return QualityCheckResult(
            name=f"range_{column}",
            passed=len(out_of_range) == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {len(out_of_range)} values outside [{min_val}, {max_val}]",
            details={
                'out_of_range_count': len(out_of_range),
                'actual_min': float(df[column].min()),
                'actual_max': float(df[column].max())
            }
        )

    return _check


def check_categories(column: str, valid_categories: List[str]):
    """Check that categorical values are in expected set."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        unique_values = set(df[column].dropna().unique())
        invalid_values = unique_values - set(valid_categories)

        return QualityCheckResult(
            name=f"categories_{column}",
            passed=len(invalid_values) == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has invalid categories: {invalid_values}",
            details={'invalid_values': list(invalid_values)}
        )

    return _check


def check_label_distribution(label_column: str, min_ratio: float = 0.1):
    """Check that label distribution is not severely imbalanced."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        distribution = df[label_column].value_counts(normalize=True)
        min_class_ratio = distribution.min()

        return QualityCheckResult(
            name=f"label_distribution_{label_column}",
            passed=min_class_ratio >= min_ratio,
            severity=CheckSeverity.WARNING,
            message=f"Minimum class ratio is {min_class_ratio:.2%} (threshold: {min_ratio:.2%})",
            details={
                'distribution': distribution.to_dict(),
                'min_class': distribution.idxmin(),
                'min_ratio': float(min_class_ratio)
            }
        )

    return _check


def check_text_length(column: str, min_length: int = 1, max_length: int = 10000):
    """Check text length constraints."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        lengths = df[column].str.len()
        too_short = (lengths < min_length).sum()
        too_long = (lengths > max_length).sum()

        passed = too_short == 0 and too_long == 0

        return QualityCheckResult(
            name=f"text_length_{column}",
            passed=passed,
            severity=CheckSeverity.WARNING,
            message=f"Column '{column}': {too_short} too short, {too_long} too long",
            details={
                'too_short_count': int(too_short),
                'too_long_count': int(too_long),
                'avg_length': float(lengths.mean()),
                'min_length': int(lengths.min()),
                'max_length': int(lengths.max())
            }
        )

    return _check


def check_annotation_consistency(
    text_column: str,
    label_column: str,
    min_agreement: float = 0.8
):
    """Check for annotation consistency on duplicate texts."""

    def _check(df: pd.DataFrame) -> QualityCheckResult:
        # Find duplicate texts
        duplicates = df[df.duplicated(subset=[text_column], keep=False)]

        if len(duplicates) == 0:
            return QualityCheckResult(
                name="annotation_consistency",
                passed=True,
                severity=CheckSeverity.INFO,
                message="No duplicate texts to check consistency"
            )

        # Check label agreement for duplicates
        inconsistent = 0
        for text, group in duplicates.groupby(text_column):
            labels = group[label_column].value_counts(normalize=True)
            if labels.max() < min_agreement:
                inconsistent += 1

        total_duplicate_groups = duplicates.groupby(text_column).ngroups
        consistency_rate = 1 - (inconsistent / total_duplicate_groups)

        return QualityCheckResult(
            name="annotation_consistency",
            passed=consistency_rate >= min_agreement,
            severity=CheckSeverity.WARNING,
            message=f"Annotation consistency: {consistency_rate:.2%}",
            details={
                'duplicate_groups': total_duplicate_groups,
                'inconsistent_groups': inconsistent,
                'consistency_rate': float(consistency_rate)
            }
        )

    return _check


# Usage example
def validate_training_data(df: pd.DataFrame) -> bool:
    """Validate training data quality."""

    checker = DataQualityChecker()

    # Add checks
    checker.add_check(check_no_nulls('text'), CheckSeverity.CRITICAL)
    checker.add_check(check_no_nulls('label'), CheckSeverity.CRITICAL)
    checker.add_check(check_unique('id'), CheckSeverity.ERROR)
    checker.add_check(check_categories('label', ['positive', 'negative', 'neutral']), CheckSeverity.ERROR)
    checker.add_check(check_label_distribution('label', min_ratio=0.15), CheckSeverity.WARNING)
    checker.add_check(check_text_length('text', min_length=10, max_length=5000), CheckSeverity.WARNING)

    # Run checks
    results = checker.run_checks(df)

    # Print results
    print("\n=== Data Quality Report ===\n")

    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(f"[{status}] {result.name}: {result.message}")
        if result.details and not result.passed:
            for key, value in result.details.items():
                print(f"       {key}: {value}")

    print(f"\n=== Summary ===")
    summary = checker.get_summary()
    print(f"Total: {summary['total_checks']}, Passed: {summary['passed']}, Failed: {summary['failed']}")

    return not checker.has_critical_failures()
```

---

## Privacy and Compliance

### Data Anonymization

```python
import hashlib
import re
from typing import List, Dict, Callable
import pandas as pd
from faker import Faker


class DataAnonymizer:
    """Anonymize sensitive data for privacy compliance."""

    def __init__(self, seed: int = 42):
        self.faker = Faker()
        Faker.seed(seed)
        self.hash_salt = "your-secret-salt-here"
        self.mapping_cache = {}

    def hash_value(self, value: str, preserve_format: bool = False) -> str:
        """Hash a value consistently."""

        if value in self.mapping_cache:
            return self.mapping_cache[value]

        hashed = hashlib.sha256(
            f"{self.hash_salt}{value}".encode()
        ).hexdigest()[:16]

        self.mapping_cache[value] = hashed
        return hashed

    def anonymize_email(self, email: str) -> str:
        """Anonymize email address."""

        if pd.isna(email):
            return email

        # Hash local part, preserve domain structure
        if '@' in email:
            local, domain = email.split('@', 1)
            hashed_local = self.hash_value(local)[:8]
            return f"{hashed_local}@anonymized.com"

        return self.hash_value(email)

    def anonymize_name(self, name: str) -> str:
        """Replace name with fake name."""

        if pd.isna(name):
            return name

        # Use consistent fake name for same input
        if name not in self.mapping_cache:
            self.mapping_cache[name] = self.faker.name()

        return self.mapping_cache[name]

    def anonymize_phone(self, phone: str) -> str:
        """Anonymize phone number."""

        if pd.isna(phone):
            return phone

        # Keep format, replace digits
        return re.sub(r'\d', 'X', str(phone))

    def anonymize_ip(self, ip: str) -> str:
        """Anonymize IP address (keep first two octets)."""

        if pd.isna(ip):
            return ip

        parts = str(ip).split('.')
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.XXX.XXX"

        return "XXX.XXX.XXX.XXX"

    def anonymize_text(
        self,
        text: str,
        patterns: Dict[str, str] = None
    ) -> str:
        """Anonymize PII in free text."""

        if pd.isna(text):
            return text

        result = text

        # Default patterns
        default_patterns = {
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b': '[EMAIL]',
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b': '[PHONE]',
            r'\b\d{3}-\d{2}-\d{4}\b': '[SSN]',
            r'\b\d{16}\b': '[CARD_NUMBER]',
            r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b': '[IP_ADDRESS]'
        }

        patterns = patterns or default_patterns

        for pattern, replacement in patterns.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return result

    def anonymize_dataframe(
        self,
        df: pd.DataFrame,
        column_handlers: Dict[str, Callable]
    ) -> pd.DataFrame:
        """Anonymize entire DataFrame."""

        result = df.copy()

        for column, handler in column_handlers.items():
            if column in result.columns:
                result[column] = result[column].apply(handler)

        return result


class GDPRCompliance:
    """GDPR compliance utilities."""

    @staticmethod
    def get_consent_record(
        user_id: str,
        purpose: str,
        timestamp: str
    ) -> Dict:
        """Create consent record."""

        return {
            'user_id': user_id,
            'purpose': purpose,
            'consent_given': True,
            'timestamp': timestamp,
            'version': '1.0',
            'method': 'explicit_consent'
        }

    @staticmethod
    def generate_data_inventory(df: pd.DataFrame) -> Dict:
        """Generate data inventory for compliance."""

        inventory = {
            'record_count': len(df),
            'columns': [],
            'potential_pii': []
        }

        pii_indicators = {
            'email': ['email', 'e-mail', 'mail'],
            'name': ['name', 'firstname', 'lastname', 'fullname'],
            'phone': ['phone', 'mobile', 'tel'],
            'address': ['address', 'street', 'city', 'zip', 'postal'],
            'ssn': ['ssn', 'social_security', 'national_id'],
            'ip': ['ip', 'ip_address'],
            'dob': ['dob', 'birth', 'birthday', 'age']
        }

        for col in df.columns:
            col_lower = col.lower()
            col_info = {
                'name': col,
                'dtype': str(df[col].dtype),
                'null_count': int(df[col].isnull().sum()),
                'unique_count': int(df[col].nunique())
            }

            # Check for potential PII
            for pii_type, indicators in pii_indicators.items():
                if any(ind in col_lower for ind in indicators):
                    col_info['potential_pii_type'] = pii_type
                    inventory['potential_pii'].append(col)
                    break

            inventory['columns'].append(col_info)

        return inventory

    @staticmethod
    def handle_deletion_request(
        df: pd.DataFrame,
        user_id_column: str,
        user_id: str
    ) -> pd.DataFrame:
        """Handle GDPR right to erasure request."""

        # Remove user data
        result = df[df[user_id_column] != user_id].copy()

        deleted_count = len(df) - len(result)

        print(f"Deleted {deleted_count} records for user {user_id}")

        return result

    @staticmethod
    def handle_export_request(
        df: pd.DataFrame,
        user_id_column: str,
        user_id: str
    ) -> Dict:
        """Handle GDPR data portability request."""

        user_data = df[df[user_id_column] == user_id]

        export = {
            'user_id': user_id,
            'export_timestamp': pd.Timestamp.now().isoformat(),
            'record_count': len(user_data),
            'data': user_data.to_dict('records')
        }

        return export


# Usage example
def prepare_training_data_for_compliance(df: pd.DataFrame) -> pd.DataFrame:
    """Prepare training data with privacy compliance."""

    anonymizer = DataAnonymizer()

    # Define column handlers
    handlers = {
        'email': anonymizer.anonymize_email,
        'name': anonymizer.anonymize_name,
        'phone': anonymizer.anonymize_phone,
        'ip_address': anonymizer.anonymize_ip,
        'user_text': anonymizer.anonymize_text
    }

    # Anonymize data
    anonymized_df = anonymizer.anonymize_dataframe(df, handlers)

    # Generate compliance report
    inventory = GDPRCompliance.generate_data_inventory(anonymized_df)
    print(f"Data inventory: {len(inventory['columns'])} columns, "
          f"{len(inventory['potential_pii'])} potential PII columns")

    return anonymized_df
```

---

## Complete Data Collection Pipeline

```python
import asyncio
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CollectionConfig:
    """Configuration for data collection pipeline."""

    output_dir: str
    batch_size: int = 100
    quality_threshold: float = 0.8
    anonymize: bool = True
    validate: bool = True


class DataCollectionPipeline:
    """Complete data collection pipeline."""

    def __init__(self, config: CollectionConfig):
        self.config = config
        self.output_path = Path(config.output_dir)
        self.output_path.mkdir(parents=True, exist_ok=True)

        self.collectors = []
        self.processors = []
        self.quality_checker = DataQualityChecker()
        self.anonymizer = DataAnonymizer()

    def add_collector(self, collector: callable):
        """Add a data collector."""
        self.collectors.append(collector)

    def add_processor(self, processor: callable):
        """Add a data processor."""
        self.processors.append(processor)

    def add_quality_check(self, check: callable, severity: CheckSeverity):
        """Add a quality check."""
        self.quality_checker.add_check(check, severity)

    async def collect(self) -> pd.DataFrame:
        """Run all collectors and combine results."""

        all_data = []

        for collector in self.collectors:
            try:
                logger.info(f"Running collector: {collector.__name__}")

                if asyncio.iscoroutinefunction(collector):
                    data = await collector()
                else:
                    data = collector()

                if isinstance(data, pd.DataFrame):
                    all_data.append(data)
                elif isinstance(data, list):
                    all_data.append(pd.DataFrame(data))

                logger.info(f"Collected {len(data)} records")

            except Exception as e:
                logger.error(f"Collector {collector.__name__} failed: {e}")

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def process(self, df: pd.DataFrame) -> pd.DataFrame:
        """Run all processors on data."""

        for processor in self.processors:
            try:
                logger.info(f"Running processor: {processor.__name__}")
                df = processor(df)
                logger.info(f"Processed, {len(df)} records remaining")
            except Exception as e:
                logger.error(f"Processor {processor.__name__} failed: {e}")

        return df

    def validate(self, df: pd.DataFrame) -> bool:
        """Validate data quality."""

        results = self.quality_checker.run_checks(df)
        summary = self.quality_checker.get_summary()

        logger.info(f"Quality checks: {summary['passed']}/{summary['total_checks']} passed")

        return not self.quality_checker.has_critical_failures()

    def anonymize(self, df: pd.DataFrame, columns: Dict[str, callable]) -> pd.DataFrame:
        """Anonymize sensitive columns."""

        return self.anonymizer.anonymize_dataframe(df, columns)

    def save(self, df: pd.DataFrame, filename: str):
        """Save data to file."""

        output_file = self.output_path / filename

        if filename.endswith('.json'):
            df.to_json(output_file, orient='records', indent=2)
        elif filename.endswith('.csv'):
            df.to_csv(output_file, index=False)
        elif filename.endswith('.parquet'):
            df.to_parquet(output_file, index=False)
        else:
            raise ValueError(f"Unsupported format: {filename}")

        logger.info(f"Saved {len(df)} records to {output_file}")

    async def run(
        self,
        output_filename: str = 'collected_data.parquet',
        anonymize_columns: Dict[str, callable] = None
    ) -> pd.DataFrame:
        """Run complete pipeline."""

        logger.info("Starting data collection pipeline")

        # Collect
        df = await self.collect()

        if len(df) == 0:
            logger.warning("No data collected")
            return df

        logger.info(f"Collected {len(df)} total records")

        # Process
        df = self.process(df)

        # Validate
        if self.config.validate:
            if not self.validate(df):
                logger.error("Data validation failed with critical errors")
                # Could raise exception or continue based on requirements

        # Anonymize
        if self.config.anonymize and anonymize_columns:
            df = self.anonymize(df, anonymize_columns)

        # Save
        self.save(df, output_filename)

        # Save metadata
        metadata = {
            'collection_time': datetime.now().isoformat(),
            'record_count': len(df),
            'columns': df.columns.tolist(),
            'quality_summary': self.quality_checker.get_summary()
        }

        metadata_file = self.output_path / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info("Pipeline completed successfully")

        return df


# Example: Build and run pipeline
async def main():
    # Configure pipeline
    config = CollectionConfig(
        output_dir='./collected_data',
        batch_size=100,
        quality_threshold=0.8,
        anonymize=True,
        validate=True
    )

    pipeline = DataCollectionPipeline(config)

    # Add collectors
    async def collect_from_api():
        # Simulated API collection
        return pd.DataFrame({
            'id': range(100),
            'text': [f'Sample text {i}' for i in range(100)],
            'email': [f'user{i}@example.com' for i in range(100)],
            'label': ['positive', 'negative', 'neutral'] * 33 + ['positive']
        })

    pipeline.add_collector(collect_from_api)

    # Add processors
    def clean_text(df):
        df['text'] = df['text'].str.strip()
        return df

    pipeline.add_processor(clean_text)

    # Add quality checks
    pipeline.add_quality_check(check_no_nulls('text'), CheckSeverity.CRITICAL)
    pipeline.add_quality_check(check_no_nulls('label'), CheckSeverity.CRITICAL)
    pipeline.add_quality_check(
        check_categories('label', ['positive', 'negative', 'neutral']),
        CheckSeverity.ERROR
    )

    # Run pipeline
    anonymizer = DataAnonymizer()
    result = await pipeline.run(
        output_filename='training_data.parquet',
        anonymize_columns={
            'email': anonymizer.anonymize_email
        }
    )

    print(f"Final dataset: {len(result)} records")
    print(result.head())


# Run the pipeline
# asyncio.run(main())
```

---

## Interview Questions

### Common Interview Topics

**Q1: How would you design a data collection system for training a sentiment analysis model?**

A: The key considerations are:

1. **Data Sources**: Identify relevant sources (social media APIs, review sites, customer feedback systems)
2. **Volume and Diversity**: Ensure sufficient data volume and domain diversity
3. **Quality Control**: Implement validation, deduplication, and consistency checks
4. **Labeling Strategy**: Choose between manual labeling, crowdsourcing, or semi-supervised approaches
5. **Privacy Compliance**: Anonymize PII, obtain necessary consents
6. **Pipeline Architecture**: Build scalable, reproducible data pipelines

**Q2: What strategies would you use to reduce labeling costs while maintaining quality?**

A: Several strategies can help:

1. **Active Learning**: Prioritize labeling the most informative samples
2. **Semi-Supervised Learning**: Leverage unlabeled data to improve model performance
3. **Weak Supervision**: Use labeling functions and rules to generate noisy labels
4. **Transfer Learning**: Use pre-trained models to reduce required labeled data
5. **Quality Control**: Implement gold standard questions and agreement metrics
6. **Crowdsourcing**: Use platforms like MTurk with quality controls

**Q3: How do you handle class imbalance in collected data?**

A: Multiple approaches:

1. **Collection Phase**: Targeted sampling to collect more minority class examples
2. **Labeling Phase**: Prioritize labeling potential minority class samples
3. **Training Phase**: Use oversampling (SMOTE), undersampling, or class weights
4. **Evaluation**: Use appropriate metrics (F1, AUC-ROC) instead of accuracy

**Q4: What are the key considerations for GDPR-compliant data collection?**

A: Essential requirements:

1. **Lawful Basis**: Obtain explicit consent or establish legitimate interest
2. **Data Minimization**: Collect only necessary data
3. **Purpose Limitation**: Use data only for stated purposes
4. **Storage Limitation**: Define and enforce retention periods
5. **Security**: Implement appropriate technical and organizational measures
6. **Data Subject Rights**: Enable access, portability, and erasure requests

**Q5: How would you measure and improve inter-annotator agreement?**

A: Key approaches:

1. **Metrics**: Calculate Cohen's Kappa or Fleiss' Kappa
2. **Training**: Provide clear labeling guidelines and examples
3. **Calibration**: Regular calibration sessions with annotators
4. **Disagreement Analysis**: Review and resolve systematic disagreements
5. **Iterative Refinement**: Update guidelines based on common errors

---

## Further Reading

### Documentation

- [Label Studio Documentation](https://labelstud.io/guide/) - Open-source data labeling
- [Prodigy Documentation](https://prodi.gy/docs/) - Efficient annotation tool
- [Amazon SageMaker Ground Truth](https://docs.aws.amazon.com/sagemaker/latest/dg/sms.html) - AWS labeling service

### Books

- **"Data Quality" by Carlo Batini and Monica Scannapieco** - Comprehensive data quality guide
- **"Building Machine Learning Pipelines" by Hannes Hapke** - End-to-end ML pipeline design
- **"Human-in-the-Loop Machine Learning" by Robert Munro** - Active learning and annotation

### Online Resources

- [Snorkel](https://www.snorkel.org/) - Weak supervision framework
- [cleanlab](https://cleanlab.ai/) - Finding label errors in datasets
- [Great Expectations](https://greatexpectations.io/) - Data validation framework
- [Scrapy Documentation](https://docs.scrapy.org/) - Web scraping framework

### Tools

- **Data Collection**: Scrapy, Selenium, Beautiful Soup, requests
- **Labeling**: Label Studio, Prodigy, CVAT, Labelbox
- **Quality**: Great Expectations, pandas-profiling, cleanlab
- **Privacy**: Faker, hashlib, presidio

---

Data collection and labeling form the foundation of successful machine learning projects. By implementing robust collection pipelines, quality controls, and efficient labeling strategies, you can build high-quality datasets that lead to better model performance. Remember that investing in data quality early pays dividends throughout the ML lifecycle.
