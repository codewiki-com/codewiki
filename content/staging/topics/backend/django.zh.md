---
title: Django框架
description: Django完全指南，MTV架构、ORM、模板与REST API
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - Django
  - Web框架
  - ORM
status: imported
origin: old/src/content/docs/python/django.zh.md
divergence: 0.245
issues: []
legacy:
  category: Python
  subcategory: Web开发
  order: 24
  lastUpdated: 2026-01-07
---

Django是一个高级Python Web框架，它鼓励快速开发和简洁、务实的设计。由经验丰富的开发者构建，Django解决了Web开发中的许多繁琐问题，使你能够专注于编写应用程序而无需重复造轮子。

---

## Django简介与安装

### 为什么选择Django

Django遵循"电池已包含"（batteries-included）的理念，提供了构建Web应用所需的几乎所有组件：

- **ORM（对象关系映射）**：强大的数据库抽象层
- **管理后台**：自动生成的管理界面
- **URL路由**：灵活的URL配置系统
- **模板引擎**：安全且功能丰富的模板系统
- **表单处理**：表单验证和渲染
- **认证系统**：完整的用户认证框架
- **安全特性**：防止常见Web攻击

### 安装Django

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Linux/macOS
source venv/bin/activate
# Windows
venv\Scripts\activate

# 安装Django
pip install django

# 验证安装
python -m django --version
```

### 创建第一个项目

```bash
# 创建项目
django-admin startproject myproject

# 进入项目目录
cd myproject

# 创建应用
python manage.py startapp blog

# 运行开发服务器
python manage.py runserver
```

---

## 项目结构详解

创建项目后，Django生成以下目录结构：

```
myproject/
├── manage.py                 # 命令行工具
├── myproject/               # 项目配置目录
│   ├── __init__.py
│   ├── settings.py          # 项目设置
│   ├── urls.py              # 主URL配置
│   ├── asgi.py              # ASGI配置
│   └── wsgi.py              # WSGI配置
└── blog/                    # 应用目录
    ├── __init__.py
    ├── admin.py             # 管理后台配置
    ├── apps.py              # 应用配置
    ├── migrations/          # 数据库迁移文件
    │   └── __init__.py
    ├── models.py            # 数据模型
    ├── tests.py             # 测试文件
    └── views.py             # 视图函数
```

### 核心配置文件 settings.py

```python
# myproject/settings.py

import os
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent

# 安全密钥（生产环境应使用环境变量）
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'your-secret-key')

# 调试模式
DEBUG = True

# 允许的主机
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# 已安装的应用
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # 第三方应用
    'rest_framework',
    # 自定义应用
    'blog.apps.BlogConfig',
]

# 中间件
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 根URL配置
ROOT_URLCONF = 'myproject.urls'

# 模板配置
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'myproject_db',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# 密码验证
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# 国际化
LANGUAGE_CODE = 'zh-hans'
TIME_ZONE = 'Asia/Shanghai'
USE_I18N = True
USE_TZ = True

# 静态文件
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# 媒体文件
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 默认主键类型
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

---

## MTV架构模式

Django采用MTV（Model-Template-View）架构模式，这是MVC模式的变体：

| MVC | MTV | 说明 |
|-----|-----|------|
| Model | Model | 数据层，处理数据和业务逻辑 |
| View | Template | 展示层，呈现数据给用户 |
| Controller | View | 控制层，处理用户请求 |

### 请求处理流程

```
用户请求 -> URL配置 -> 视图函数 -> 模型操作 -> 模板渲染 -> 响应返回
```

```python
# URL配置 (urls.py)
from django.urls import path
from . import views

urlpatterns = [
    path('articles/', views.article_list, name='article_list'),
    path('articles/<int:pk>/', views.article_detail, name='article_detail'),
]

# 视图 (views.py)
from django.shortcuts import render, get_object_or_404
from .models import Article

def article_list(request):
    articles = Article.objects.all()
    return render(request, 'blog/article_list.html', {'articles': articles})

def article_detail(request, pk):
    article = get_object_or_404(Article, pk=pk)
    return render(request, 'blog/article_detail.html', {'article': article})

# 模型 (models.py)
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# 模板 (templates/blog/article_list.html)
# {% for article in articles %}
#     <h2>{{ article.title }}</h2>
# {% endfor %}
```

---

## 模型与ORM

Django的ORM（对象关系映射）允许你使用Python代码操作数据库，无需编写SQL语句。

### 定义模型

```python
# blog/models.py

from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone


class Category(models.Model):
    """文章分类"""
    name = models.CharField('分类名称', max_length=100, unique=True)
    slug = models.SlugField('URL别名', max_length=100, unique=True)
    description = models.TextField('描述', blank=True)

    class Meta:
        verbose_name = '分类'
        verbose_name_plural = '分类'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    """文章标签"""
    name = models.CharField('标签名称', max_length=50, unique=True)
    slug = models.SlugField('URL别名', max_length=50, unique=True)

    class Meta:
        verbose_name = '标签'
        verbose_name_plural = '标签'

    def __str__(self):
        return self.name


class Article(models.Model):
    """文章模型"""

    class Status(models.TextChoices):
        DRAFT = 'draft', '草稿'
        PUBLISHED = 'published', '已发布'

    title = models.CharField('标题', max_length=200)
    slug = models.SlugField('URL别名', max_length=200, unique_for_date='publish_date')
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='articles',
        verbose_name='作者'
    )
    content = models.TextField('内容')
    excerpt = models.TextField('摘要', max_length=500, blank=True)

    # 分类和标签
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles',
        verbose_name='分类'
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='articles',
        verbose_name='标签'
    )

    # 时间字段
    publish_date = models.DateTimeField('发布时间', default=timezone.now)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    # 状态
    status = models.CharField(
        '状态',
        max_length=10,
        choices=Status.choices,
        default=Status.DRAFT
    )

    # 统计
    views = models.PositiveIntegerField('浏览量', default=0)

    class Meta:
        verbose_name = '文章'
        verbose_name_plural = '文章'
        ordering = ['-publish_date']
        indexes = [
            models.Index(fields=['-publish_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('blog:article_detail', args=[
            self.publish_date.year,
            self.publish_date.month,
            self.publish_date.day,
            self.slug
        ])

    def save(self, *args, **kwargs):
        if not self.excerpt:
            self.excerpt = self.content[:200]
        super().save(*args, **kwargs)


class Comment(models.Model):
    """评论模型"""
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='文章'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='作者'
    )
    content = models.TextField('内容')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name='父评论'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    is_active = models.BooleanField('是否显示', default=True)

    class Meta:
        verbose_name = '评论'
        verbose_name_plural = '评论'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author.username}评论了{self.article.title}'
```

### 字段类型

Django提供了丰富的字段类型：

```python
from django.db import models

class FieldExample(models.Model):
    # 字符串字段
    char_field = models.CharField(max_length=100)
    text_field = models.TextField()
    slug_field = models.SlugField()
    email_field = models.EmailField()
    url_field = models.URLField()
    uuid_field = models.UUIDField()

    # 数值字段
    integer_field = models.IntegerField()
    positive_int = models.PositiveIntegerField()
    float_field = models.FloatField()
    decimal_field = models.DecimalField(max_digits=10, decimal_places=2)

    # 布尔字段
    boolean_field = models.BooleanField(default=False)
    null_boolean = models.BooleanField(null=True)

    # 日期时间字段
    date_field = models.DateField()
    datetime_field = models.DateTimeField()
    time_field = models.TimeField()
    duration_field = models.DurationField()

    # 文件字段
    file_field = models.FileField(upload_to='files/')
    image_field = models.ImageField(upload_to='images/')

    # 关系字段
    foreign_key = models.ForeignKey('OtherModel', on_delete=models.CASCADE)
    one_to_one = models.OneToOneField('OtherModel', on_delete=models.CASCADE)
    many_to_many = models.ManyToManyField('OtherModel')

    # JSON字段
    json_field = models.JSONField(default=dict)
```

### ORM查询操作

```python
from blog.models import Article, Category, Tag
from django.db.models import Q, F, Count, Avg, Sum
from django.utils import timezone

# ============ 基本查询 ============

# 获取所有对象
articles = Article.objects.all()

# 获取单个对象
article = Article.objects.get(pk=1)
article = Article.objects.get(slug='my-article')

# 过滤查询
published = Article.objects.filter(status='published')
drafts = Article.objects.exclude(status='published')

# 链式查询
recent_published = Article.objects.filter(
    status='published'
).filter(
    publish_date__gte=timezone.now() - timezone.timedelta(days=7)
)

# ============ 字段查找 ============

# 精确匹配
Article.objects.filter(title='Hello')
Article.objects.filter(title__exact='Hello')

# 不区分大小写
Article.objects.filter(title__iexact='hello')

# 包含
Article.objects.filter(title__contains='Django')
Article.objects.filter(title__icontains='django')

# 开头/结尾
Article.objects.filter(title__startswith='How')
Article.objects.filter(title__endswith='?')

# 范围查询
Article.objects.filter(views__gt=100)      # 大于
Article.objects.filter(views__gte=100)     # 大于等于
Article.objects.filter(views__lt=100)      # 小于
Article.objects.filter(views__lte=100)     # 小于等于
Article.objects.filter(views__range=(50, 100))

# 成员查询
Article.objects.filter(status__in=['draft', 'published'])

# 空值查询
Article.objects.filter(category__isnull=True)

# 日期查询
Article.objects.filter(publish_date__year=2024)
Article.objects.filter(publish_date__month=6)
Article.objects.filter(publish_date__day=15)
Article.objects.filter(publish_date__date=timezone.now().date())

# ============ 复杂查询 ============

# Q对象（OR查询）
from django.db.models import Q

Article.objects.filter(
    Q(title__contains='Django') | Q(title__contains='Python')
)

# AND和OR组合
Article.objects.filter(
    Q(status='published') & (Q(views__gt=100) | Q(category__name='教程'))
)

# NOT查询
Article.objects.filter(~Q(status='draft'))

# F对象（字段比较）
from django.db.models import F

# 浏览量大于评论数的文章
Article.objects.filter(views__gt=F('comments__count'))

# 更新浏览量
Article.objects.filter(pk=1).update(views=F('views') + 1)

# ============ 关联查询 ============

# 正向关联
article = Article.objects.get(pk=1)
category_name = article.category.name

# 反向关联
category = Category.objects.get(pk=1)
articles = category.articles.all()

# 跨关联查询
Article.objects.filter(category__name='技术')
Article.objects.filter(author__username='admin')
Article.objects.filter(comments__content__contains='great')

# 预取关联数据（优化性能）
articles = Article.objects.select_related('category', 'author')
articles = Article.objects.prefetch_related('tags', 'comments')

# ============ 聚合查询 ============

from django.db.models import Count, Avg, Sum, Max, Min

# 聚合函数
Article.objects.aggregate(
    total_views=Sum('views'),
    avg_views=Avg('views'),
    max_views=Max('views'),
    article_count=Count('id')
)

# 分组统计
Category.objects.annotate(
    article_count=Count('articles')
).order_by('-article_count')

# 带条件的统计
Category.objects.annotate(
    published_count=Count('articles', filter=Q(articles__status='published'))
)

# ============ 排序与分页 ============

# 排序
Article.objects.order_by('publish_date')    # 升序
Article.objects.order_by('-publish_date')   # 降序
Article.objects.order_by('category', '-publish_date')  # 多字段

# 切片（分页）
Article.objects.all()[:10]      # 前10条
Article.objects.all()[10:20]    # 第11-20条

# ============ 值查询 ============

# 获取字典列表
Article.objects.values('title', 'views')

# 获取元组列表
Article.objects.values_list('title', 'views')

# 获取单字段列表
Article.objects.values_list('title', flat=True)

# 去重
Article.objects.values('category').distinct()

# ============ 创建与更新 ============

# 创建对象
article = Article.objects.create(
    title='New Article',
    content='Content here',
    author=user
)

# 获取或创建
article, created = Article.objects.get_or_create(
    slug='unique-slug',
    defaults={'title': 'Default Title', 'content': 'Default content'}
)

# 更新或创建
article, created = Article.objects.update_or_create(
    slug='unique-slug',
    defaults={'title': 'Updated Title'}
)

# 批量创建
Article.objects.bulk_create([
    Article(title='Article 1', content='...'),
    Article(title='Article 2', content='...'),
])

# 批量更新
Article.objects.filter(status='draft').update(status='published')

# ============ 删除 ============

# 删除单个对象
article = Article.objects.get(pk=1)
article.delete()

# 批量删除
Article.objects.filter(status='draft').delete()

# ============ 原生SQL ============

# 原生查询
articles = Article.objects.raw('SELECT * FROM blog_article WHERE views > 100')

# 执行原生SQL
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute('UPDATE blog_article SET views = views + 1 WHERE id = %s', [1])
```

---

## 数据库迁移

Django的迁移系统允许你以增量方式修改数据库结构。

### 迁移命令

```bash
# 创建迁移文件
python manage.py makemigrations

# 创建特定应用的迁移
python manage.py makemigrations blog

# 查看迁移SQL
python manage.py sqlmigrate blog 0001

# 执行迁移
python manage.py migrate

# 查看迁移状态
python manage.py showmigrations

# 回滚迁移
python manage.py migrate blog 0001

# 回滚所有迁移
python manage.py migrate blog zero

# 创建空迁移（用于数据迁移）
python manage.py makemigrations blog --empty --name populate_data
```

### 数据迁移示例

```python
# blog/migrations/0002_populate_categories.py

from django.db import migrations

def create_categories(apps, schema_editor):
    Category = apps.get_model('blog', 'Category')
    categories = [
        {'name': '技术', 'slug': 'tech'},
        {'name': '生活', 'slug': 'life'},
        {'name': '随笔', 'slug': 'essay'},
    ]
    for cat in categories:
        Category.objects.create(**cat)

def remove_categories(apps, schema_editor):
    Category = apps.get_model('blog', 'Category')
    Category.objects.filter(slug__in=['tech', 'life', 'essay']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_categories, remove_categories),
    ]
```

---

## 视图与URL配置

### URL配置

```python
# myproject/urls.py（主URL配置）

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('blog.urls', namespace='blog')),
    path('api/', include('blog.api.urls', namespace='api')),
    path('accounts/', include('django.contrib.auth.urls')),
]

# 开发环境下提供媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

```python
# blog/urls.py（应用URL配置）

from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # 文章列表
    path('', views.ArticleListView.as_view(), name='article_list'),

    # 文章详情
    path(
        'article/<int:year>/<int:month>/<int:day>/<slug:slug>/',
        views.ArticleDetailView.as_view(),
        name='article_detail'
    ),

    # 分类文章
    path('category/<slug:slug>/', views.CategoryArticleListView.as_view(), name='category'),

    # 标签文章
    path('tag/<slug:slug>/', views.TagArticleListView.as_view(), name='tag'),

    # 搜索
    path('search/', views.SearchView.as_view(), name='search'),

    # 文章操作
    path('article/create/', views.ArticleCreateView.as_view(), name='article_create'),
    path('article/<int:pk>/edit/', views.ArticleUpdateView.as_view(), name='article_edit'),
    path('article/<int:pk>/delete/', views.ArticleDeleteView.as_view(), name='article_delete'),
]
```

### 函数视图

```python
# blog/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q, F
from django.contrib import messages

from .models import Article, Category, Tag
from .forms import ArticleForm, CommentForm


def article_list(request):
    """文章列表视图"""
    articles = Article.objects.filter(status='published').select_related(
        'author', 'category'
    ).prefetch_related('tags')

    # 分页
    paginator = Paginator(articles, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'is_paginated': page_obj.has_other_pages(),
    }
    return render(request, 'blog/article_list.html', context)


def article_detail(request, year, month, day, slug):
    """文章详情视图"""
    article = get_object_or_404(
        Article,
        slug=slug,
        status='published',
        publish_date__year=year,
        publish_date__month=month,
        publish_date__day=day
    )

    # 增加浏览量
    Article.objects.filter(pk=article.pk).update(views=F('views') + 1)

    # 获取评论
    comments = article.comments.filter(is_active=True, parent__isnull=True)

    # 评论表单
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.article = article
            comment.author = request.user
            comment.save()
            messages.success(request, '评论发表成功！')
            return redirect(article.get_absolute_url())
    else:
        form = CommentForm()

    # 相关文章
    related_articles = Article.objects.filter(
        category=article.category,
        status='published'
    ).exclude(pk=article.pk)[:5]

    context = {
        'article': article,
        'comments': comments,
        'form': form,
        'related_articles': related_articles,
    }
    return render(request, 'blog/article_detail.html', context)


@login_required
def article_create(request):
    """创建文章视图"""
    if request.method == 'POST':
        form = ArticleForm(request.POST, request.FILES)
        if form.is_valid():
            article = form.save(commit=False)
            article.author = request.user
            article.save()
            form.save_m2m()  # 保存多对多关系
            messages.success(request, '文章创建成功！')
            return redirect(article.get_absolute_url())
    else:
        form = ArticleForm()

    return render(request, 'blog/article_form.html', {'form': form})


def search(request):
    """搜索视图"""
    query = request.GET.get('q', '')
    articles = []

    if query:
        articles = Article.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query),
            status='published'
        )

    return render(request, 'blog/search.html', {
        'query': query,
        'articles': articles
    })
```

### 类视图

Django提供了强大的类视图系统，简化常见操作：

```python
# blog/views.py

from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
)
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.db.models import F, Count

from .models import Article, Category, Tag
from .forms import ArticleForm


class ArticleListView(ListView):
    """文章列表类视图"""
    model = Article
    template_name = 'blog/article_list.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        return Article.objects.filter(
            status='published'
        ).select_related('author', 'category').prefetch_related('tags')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['popular_tags'] = Tag.objects.annotate(
            article_count=Count('articles')
        ).order_by('-article_count')[:10]
        return context


class ArticleDetailView(DetailView):
    """文章详情类视图"""
    model = Article
    template_name = 'blog/article_detail.html'
    context_object_name = 'article'

    def get_queryset(self):
        return Article.objects.filter(status='published')

    def get_object(self):
        obj = super().get_object()
        # 增加浏览量
        Article.objects.filter(pk=obj.pk).update(views=F('views') + 1)
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['comments'] = self.object.comments.filter(
            is_active=True, parent__isnull=True
        )
        context['related_articles'] = Article.objects.filter(
            category=self.object.category,
            status='published'
        ).exclude(pk=self.object.pk)[:5]
        return context


class ArticleCreateView(LoginRequiredMixin, CreateView):
    """创建文章类视图"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


class ArticleUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """更新文章类视图"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'

    def test_func(self):
        article = self.get_object()
        return self.request.user == article.author or self.request.user.is_staff


class ArticleDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """删除文章类视图"""
    model = Article
    template_name = 'blog/article_confirm_delete.html'
    success_url = reverse_lazy('blog:article_list')

    def test_func(self):
        article = self.get_object()
        return self.request.user == article.author or self.request.user.is_staff


class CategoryArticleListView(ListView):
    """分类文章列表"""
    template_name = 'blog/category_articles.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        self.category = get_object_or_404(Category, slug=self.kwargs['slug'])
        return Article.objects.filter(
            category=self.category,
            status='published'
        )

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category'] = self.category
        return context


class SearchView(ListView):
    """搜索视图"""
    template_name = 'blog/search.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        query = self.request.GET.get('q', '')
        if query:
            return Article.objects.filter(
                Q(title__icontains=query) | Q(content__icontains=query),
                status='published'
            )
        return Article.objects.none()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['query'] = self.request.GET.get('q', '')
        return context
```

---

## 模板系统

Django模板引擎提供了强大的模板继承和标签系统。

### 基础模板

```html
<!-- templates/base.html -->

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}我的博客{% endblock %}</title>

    {% load static %}
    <link rel="stylesheet" href="{% static 'css/style.css' %}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    <header>
        <nav>
            <a href="{% url 'blog:article_list' %}">首页</a>
            <a href="{% url 'blog:category' slug='tech' %}">技术</a>

            {% if user.is_authenticated %}
                <a href="{% url 'blog:article_create' %}">写文章</a>
                <span>欢迎, {{ user.username }}</span>
                <a href="{% url 'logout' %}">退出</a>
            {% else %}
                <a href="{% url 'login' %}">登录</a>
                <a href="{% url 'register' %}">注册</a>
            {% endif %}
        </nav>
    </header>

    <main>
        {% if messages %}
            <div class="messages">
                {% for message in messages %}
                    <div class="alert alert-{{ message.tags }}">
                        {{ message }}
                    </div>
                {% endfor %}
            </div>
        {% endif %}

        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; {{ now.year }} 我的博客</p>
    </footer>

    <script src="{% static 'js/main.js' %}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

### 文章列表模板

```html
<!-- templates/blog/article_list.html -->

{% extends 'base.html' %}
{% load static %}

{% block title %}文章列表 - 我的博客{% endblock %}

{% block content %}
<div class="article-list">
    <h1>最新文章</h1>

    {% for article in articles %}
        <article class="article-card">
            <h2>
                <a href="{{ article.get_absolute_url }}">{{ article.title }}</a>
            </h2>

            <div class="meta">
                <span class="author">{{ article.author.username }}</span>
                <span class="date">{{ article.publish_date|date:"Y年m月d日" }}</span>
                <span class="category">
                    {% if article.category %}
                        <a href="{% url 'blog:category' slug=article.category.slug %}">
                            {{ article.category.name }}
                        </a>
                    {% endif %}
                </span>
                <span class="views">{{ article.views }} 次浏览</span>
            </div>

            <div class="excerpt">
                {{ article.excerpt|truncatewords:50 }}
            </div>

            <div class="tags">
                {% for tag in article.tags.all %}
                    <a href="{% url 'blog:tag' slug=tag.slug %}" class="tag">
                        {{ tag.name }}
                    </a>
                {% empty %}
                    <span class="no-tags">暂无标签</span>
                {% endfor %}
            </div>
        </article>
    {% empty %}
        <p>暂无文章</p>
    {% endfor %}

    <!-- 分页 -->
    {% if is_paginated %}
        <nav class="pagination">
            {% if page_obj.has_previous %}
                <a href="?page=1">&laquo; 首页</a>
                <a href="?page={{ page_obj.previous_page_number }}">上一页</a>
            {% endif %}

            <span class="current">
                第 {{ page_obj.number }} 页 / 共 {{ page_obj.paginator.num_pages }} 页
            </span>

            {% if page_obj.has_next %}
                <a href="?page={{ page_obj.next_page_number }}">下一页</a>
                <a href="?page={{ page_obj.paginator.num_pages }}">末页 &raquo;</a>
            {% endif %}
        </nav>
    {% endif %}
</div>
{% endblock %}
```

### 文章详情模板

```html
<!-- templates/blog/article_detail.html -->

{% extends 'base.html' %}
{% load static %}

{% block title %}{{ article.title }} - 我的博客{% endblock %}

{% block extra_css %}
<link rel="stylesheet" href="{% static 'css/article.css' %}">
{% endblock %}

{% block content %}
<article class="article-detail">
    <header>
        <h1>{{ article.title }}</h1>
        <div class="meta">
            <span class="author">
                作者: {{ article.author.username }}
            </span>
            <span class="date">
                发布于: {{ article.publish_date|date:"Y年m月d日 H:i" }}
            </span>
            {% if article.updated_at != article.created_at %}
                <span class="updated">
                    更新于: {{ article.updated_at|date:"Y年m月d日 H:i" }}
                </span>
            {% endif %}
            <span class="views">
                {{ article.views }} 次浏览
            </span>
        </div>

        {% if article.category %}
            <div class="category">
                分类:
                <a href="{% url 'blog:category' slug=article.category.slug %}">
                    {{ article.category.name }}
                </a>
            </div>
        {% endif %}
    </header>

    <div class="content">
        {{ article.content|linebreaks }}
    </div>

    <footer>
        <div class="tags">
            标签:
            {% for tag in article.tags.all %}
                <a href="{% url 'blog:tag' slug=tag.slug %}">{{ tag.name }}</a>
            {% empty %}
                暂无标签
            {% endfor %}
        </div>

        {% if user == article.author or user.is_staff %}
            <div class="actions">
                <a href="{% url 'blog:article_edit' pk=article.pk %}">编辑</a>
                <a href="{% url 'blog:article_delete' pk=article.pk %}">删除</a>
            </div>
        {% endif %}
    </footer>
</article>

<!-- 相关文章 -->
{% if related_articles %}
<section class="related-articles">
    <h3>相关文章</h3>
    <ul>
        {% for related in related_articles %}
            <li>
                <a href="{{ related.get_absolute_url }}">{{ related.title }}</a>
            </li>
        {% endfor %}
    </ul>
</section>
{% endif %}

<!-- 评论区 -->
<section class="comments">
    <h3>评论 ({{ comments.count }})</h3>

    {% for comment in comments %}
        <div class="comment" id="comment-{{ comment.pk }}">
            <div class="comment-header">
                <strong>{{ comment.author.username }}</strong>
                <span class="date">{{ comment.created_at|date:"Y-m-d H:i" }}</span>
            </div>
            <div class="comment-content">
                {{ comment.content|linebreaks }}
            </div>

            <!-- 回复 -->
            {% if comment.replies.exists %}
                <div class="replies">
                    {% for reply in comment.replies.all %}
                        <div class="reply">
                            <strong>{{ reply.author.username }}</strong>
                            <span class="date">{{ reply.created_at|date:"Y-m-d H:i" }}</span>
                            <p>{{ reply.content }}</p>
                        </div>
                    {% endfor %}
                </div>
            {% endif %}
        </div>
    {% empty %}
        <p>暂无评论，快来抢沙发吧！</p>
    {% endfor %}

    <!-- 评论表单 -->
    {% if user.is_authenticated %}
        <form method="post" class="comment-form">
            {% csrf_token %}
            {{ form.as_p }}
            <button type="submit">发表评论</button>
        </form>
    {% else %}
        <p>请<a href="{% url 'login' %}?next={{ request.path }}">登录</a>后发表评论</p>
    {% endif %}
</section>
{% endblock %}
```

### 自定义模板标签和过滤器

```python
# blog/templatetags/blog_tags.py

from django import template
from django.db.models import Count
from django.utils.safestring import mark_safe
import markdown

from blog.models import Article, Category, Tag

register = template.Library()


@register.simple_tag
def total_articles():
    """返回已发布文章总数"""
    return Article.objects.filter(status='published').count()


@register.simple_tag
def get_categories():
    """获取所有分类及文章数"""
    return Category.objects.annotate(
        article_count=Count('articles')
    ).order_by('-article_count')


@register.inclusion_tag('blog/includes/popular_articles.html')
def popular_articles(count=5):
    """热门文章组件"""
    articles = Article.objects.filter(
        status='published'
    ).order_by('-views')[:count]
    return {'popular_articles': articles}


@register.inclusion_tag('blog/includes/tag_cloud.html')
def tag_cloud():
    """标签云组件"""
    tags = Tag.objects.annotate(
        article_count=Count('articles')
    ).filter(article_count__gt=0).order_by('-article_count')
    return {'tags': tags}


@register.filter(name='markdown')
def markdown_format(text):
    """Markdown转HTML过滤器"""
    return mark_safe(markdown.markdown(
        text,
        extensions=['markdown.extensions.fenced_code', 'markdown.extensions.codehilite']
    ))


@register.filter
def reading_time(text):
    """估算阅读时间"""
    word_count = len(text)
    minutes = word_count // 500  # 假设每分钟阅读500字
    return max(1, minutes)
```

使用自定义标签：

```html
{% load blog_tags %}

<p>共有 {% total_articles %} 篇文章</p>

{% popular_articles 5 %}

{{ article.content|markdown }}

<p>预计阅读时间: {{ article.content|reading_time }} 分钟</p>
```

---

## 表单处理

### 定义表单

```python
# blog/forms.py

from django import forms
from django.core.exceptions import ValidationError
from .models import Article, Comment, Tag


class ArticleForm(forms.ModelForm):
    """文章表单"""

    tags_input = forms.CharField(
        label='标签',
        required=False,
        help_text='多个标签用逗号分隔',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Python, Django, Web开发'
        })
    )

    class Meta:
        model = Article
        fields = ['title', 'slug', 'category', 'content', 'excerpt', 'status']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '请输入文章标题'
            }),
            'slug': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'url-friendly-slug'
            }),
            'category': forms.Select(attrs={
                'class': 'form-control'
            }),
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 15
            }),
            'excerpt': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '文章摘要（可选）'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
        }

    def clean_title(self):
        title = self.cleaned_data['title']
        if len(title) < 5:
            raise ValidationError('标题至少需要5个字符')
        return title

    def clean_slug(self):
        slug = self.cleaned_data['slug']
        if Article.objects.filter(slug=slug).exclude(pk=self.instance.pk).exists():
            raise ValidationError('该URL别名已存在')
        return slug

    def save(self, commit=True):
        article = super().save(commit=commit)

        if commit and self.cleaned_data.get('tags_input'):
            tag_names = [t.strip() for t in self.cleaned_data['tags_input'].split(',')]
            tags = []
            for name in tag_names:
                if name:
                    tag, created = Tag.objects.get_or_create(
                        name=name,
                        defaults={'slug': name.lower().replace(' ', '-')}
                    )
                    tags.append(tag)
            article.tags.set(tags)

        return article


class CommentForm(forms.ModelForm):
    """评论表单"""

    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': '请输入评论内容...'
            })
        }

    def clean_content(self):
        content = self.cleaned_data['content']
        if len(content) < 10:
            raise ValidationError('评论内容至少需要10个字符')
        return content


class SearchForm(forms.Form):
    """搜索表单"""

    query = forms.CharField(
        label='搜索',
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '搜索文章...'
        })
    )


class ContactForm(forms.Form):
    """联系表单"""

    name = forms.CharField(
        label='姓名',
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    email = forms.EmailField(
        label='邮箱',
        widget=forms.EmailInput(attrs={'class': 'form-control'})
    )
    subject = forms.CharField(
        label='主题',
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    message = forms.CharField(
        label='内容',
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 5})
    )

    def send_email(self):
        from django.core.mail import send_mail
        send_mail(
            subject=f"[联系表单] {self.cleaned_data['subject']}",
            message=self.cleaned_data['message'],
            from_email=self.cleaned_data['email'],
            recipient_list=['admin@example.com'],
        )
```

### 表单模板

```html
<!-- templates/blog/article_form.html -->

{% extends 'base.html' %}

{% block title %}
    {% if form.instance.pk %}编辑文章{% else %}创建文章{% endif %} - 我的博客
{% endblock %}

{% block content %}
<div class="article-form">
    <h1>{% if form.instance.pk %}编辑文章{% else %}创建文章{% endif %}</h1>

    <form method="post" enctype="multipart/form-data" novalidate>
        {% csrf_token %}

        {% if form.non_field_errors %}
            <div class="alert alert-danger">
                {% for error in form.non_field_errors %}
                    <p>{{ error }}</p>
                {% endfor %}
            </div>
        {% endif %}

        {% for field in form %}
            <div class="form-group {% if field.errors %}has-error{% endif %}">
                <label for="{{ field.id_for_label }}">
                    {{ field.label }}
                    {% if field.field.required %}<span class="required">*</span>{% endif %}
                </label>

                {{ field }}

                {% if field.help_text %}
                    <small class="help-text">{{ field.help_text }}</small>
                {% endif %}

                {% if field.errors %}
                    <div class="error-messages">
                        {% for error in field.errors %}
                            <span class="error">{{ error }}</span>
                        {% endfor %}
                    </div>
                {% endif %}
            </div>
        {% endfor %}

        <div class="form-actions">
            <button type="submit" class="btn btn-primary">
                {% if form.instance.pk %}更新{% else %}发布{% endif %}
            </button>
            <a href="{% url 'blog:article_list' %}" class="btn btn-secondary">取消</a>
        </div>
    </form>
</div>
{% endblock %}
```

---

## 用户认证系统

Django提供了完整的用户认证系统。

### 配置认证URL

```python
# myproject/urls.py

from django.urls import path, include

urlpatterns = [
    # 使用Django内置认证视图
    path('accounts/', include('django.contrib.auth.urls')),
    # 自定义认证视图
    path('accounts/', include('accounts.urls')),
]
```

### 自定义用户模型

```python
# accounts/models.py

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """自定义用户模型"""

    avatar = models.ImageField('头像', upload_to='avatars/', blank=True)
    bio = models.TextField('个人简介', max_length=500, blank=True)
    website = models.URLField('个人网站', blank=True)
    location = models.CharField('所在地', max_length=100, blank=True)
    birth_date = models.DateField('生日', null=True, blank=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.username
```

在settings.py中指定自定义用户模型：

```python
# settings.py

AUTH_USER_MODEL = 'accounts.CustomUser'
```

### 认证视图

```python
# accounts/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import CreateView, UpdateView
from django.urls import reverse_lazy

from .forms import UserRegistrationForm, UserProfileForm
from .models import CustomUser


class RegisterView(CreateView):
    """用户注册视图"""
    model = CustomUser
    form_class = UserRegistrationForm
    template_name = 'accounts/register.html'
    success_url = reverse_lazy('login')

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, '注册成功！请登录。')
        return response


@login_required
def profile(request):
    """用户个人资料"""
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '个人资料已更新！')
            return redirect('accounts:profile')
    else:
        form = UserProfileForm(instance=request.user)

    return render(request, 'accounts/profile.html', {'form': form})


@login_required
def change_password(request):
    """修改密码"""
    from django.contrib.auth.forms import PasswordChangeForm

    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            # 更新会话，防止用户被登出
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
            messages.success(request, '密码已修改！')
            return redirect('accounts:profile')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'accounts/change_password.html', {'form': form})
```

### 认证表单

```python
# accounts/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser


class UserRegistrationForm(UserCreationForm):
    """用户注册表单"""

    email = forms.EmailField(
        label='邮箱',
        required=True,
        widget=forms.EmailInput(attrs={'class': 'form-control'})
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs['class'] = 'form-control'
        self.fields['password2'].widget.attrs['class'] = 'form-control'

    def clean_email(self):
        email = self.cleaned_data['email']
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError('该邮箱已被注册')
        return email


class UserProfileForm(forms.ModelForm):
    """用户资料表单"""

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'first_name', 'last_name',
                  'avatar', 'bio', 'website', 'location', 'birth_date']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'first_name': forms.TextInput(attrs={'class': 'form-control'}),
            'last_name': forms.TextInput(attrs={'class': 'form-control'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'website': forms.URLInput(attrs={'class': 'form-control'}),
            'location': forms.TextInput(attrs={'class': 'form-control'}),
            'birth_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
        }


class CustomAuthenticationForm(AuthenticationForm):
    """自定义登录表单"""

    username = forms.CharField(
        label='用户名',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '用户名或邮箱'
        })
    )
    password = forms.CharField(
        label='密码',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '密码'
        })
    )
```

### 权限控制

```python
# 装饰器方式
from django.contrib.auth.decorators import login_required, permission_required, user_passes_test

@login_required
def my_view(request):
    pass

@permission_required('blog.add_article')
def create_article(request):
    pass

@user_passes_test(lambda u: u.is_staff)
def admin_view(request):
    pass

# Mixin方式
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

class ArticleCreateView(LoginRequiredMixin, CreateView):
    login_url = '/accounts/login/'
    redirect_field_name = 'next'

class ArticleDeleteView(PermissionRequiredMixin, DeleteView):
    permission_required = 'blog.delete_article'
```

---

## Django REST Framework

Django REST Framework (DRF) 是构建Web API的强大工具包。

### 安装配置

```bash
pip install djangorestframework
```

```python
# settings.py

INSTALLED_APPS = [
    ...
    'rest_framework',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### 序列化器

```python
# blog/api/serializers.py

from rest_framework import serializers
from blog.models import Article, Category, Tag, Comment
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']
        read_only_fields = ['id']


class TagSerializer(serializers.ModelSerializer):
    """标签序列化器"""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    """分类序列化器"""
    article_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'article_count']


class CommentSerializer(serializers.ModelSerializer):
    """评论序列化器"""
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'replies']
        read_only_fields = ['id', 'created_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.filter(is_active=True), many=True).data
        return []


class ArticleListSerializer(serializers.ModelSerializer):
    """文章列表序列化器"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'author', 'category', 'tags',
            'excerpt', 'publish_date', 'views', 'comment_count'
        ]

    def get_comment_count(self, obj):
        return obj.comments.filter(is_active=True).count()


class ArticleDetailSerializer(serializers.ModelSerializer):
    """文章详情序列化器"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'author', 'category', 'tags',
            'content', 'excerpt', 'publish_date', 'created_at',
            'updated_at', 'views', 'status', 'comments'
        ]

    def get_comments(self, obj):
        comments = obj.comments.filter(is_active=True, parent__isnull=True)
        return CommentSerializer(comments, many=True).data


class ArticleCreateUpdateSerializer(serializers.ModelSerializer):
    """文章创建/更新序列化器"""
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        required=False
    )

    class Meta:
        model = Article
        fields = [
            'title', 'slug', 'category', 'tags',
            'content', 'excerpt', 'status'
        ]

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError('标题至少需要5个字符')
        return value

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        article = Article.objects.create(**validated_data)
        article.tags.set(tags)
        return article

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance
```

### API视图

```python
# blog/api/views.py

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F, Sum

from blog.models import Article, Category, Tag, Comment
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer, ArticleCreateUpdateSerializer,
    CategorySerializer, TagSerializer, CommentSerializer
)
from .permissions import IsAuthorOrReadOnly
from .filters import ArticleFilter


class ArticleViewSet(viewsets.ModelViewSet):
    """文章API视图集"""

    queryset = Article.objects.filter(status='published')
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ArticleFilter
    search_fields = ['title', 'content']
    ordering_fields = ['publish_date', 'views', 'created_at']
    ordering = ['-publish_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateUpdateSerializer
        return ArticleDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.select_related('author', 'category').prefetch_related('tags')
        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # 增加浏览量
        Article.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """热门文章"""
        articles = self.get_queryset().order_by('-views')[:10]
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        """当前用户的文章"""
        if not request.user.is_authenticated:
            return Response({'detail': '请先登录'}, status=status.HTTP_401_UNAUTHORIZED)

        articles = Article.objects.filter(author=request.user)
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """添加评论"""
        article = self.get_object()
        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(article=article, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """分类API视图集"""

    queryset = Category.objects.annotate(article_count=Count('articles'))
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        """获取分类下的文章"""
        category = self.get_object()
        articles = Article.objects.filter(
            category=category,
            status='published'
        )

        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """标签API视图集"""

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'


class StatisticsAPIView(APIView):
    """统计API"""

    def get(self, request):
        stats = {
            'total_articles': Article.objects.filter(status='published').count(),
            'total_categories': Category.objects.count(),
            'total_tags': Tag.objects.count(),
            'total_comments': Comment.objects.filter(is_active=True).count(),
            'total_views': Article.objects.aggregate(total=Sum('views'))['total'] or 0,
        }
        return Response(stats)
```

### 自定义权限

```python
# blog/api/permissions.py

from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """只有作者才能修改"""

    def has_object_permission(self, request, view, obj):
        # 读取权限对所有请求开放
        if request.method in permissions.SAFE_METHODS:
            return True

        # 写入权限只限于作者或管理员
        return obj.author == request.user or request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    """只有管理员才能修改"""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
```

### API路由

```python
# blog/api/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'api'

router = DefaultRouter()
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'tags', views.TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', views.StatisticsAPIView.as_view(), name='statistics'),
]
```

### API使用示例

```bash
# 获取文章列表
GET /api/articles/

# 获取单篇文章
GET /api/articles/1/

# 创建文章（需要认证）
POST /api/articles/
Content-Type: application/json
Authorization: Token your-token-here

{
    "title": "新文章标题",
    "slug": "new-article",
    "content": "文章内容...",
    "category": 1,
    "tags": [1, 2, 3],
    "status": "published"
}

# 更新文章
PUT /api/articles/1/

# 部分更新
PATCH /api/articles/1/

# 删除文章
DELETE /api/articles/1/

# 热门文章
GET /api/articles/popular/

# 我的文章
GET /api/articles/my_articles/

# 添加评论
POST /api/articles/1/add_comment/
{
    "content": "很棒的文章！"
}

# 搜索文章
GET /api/articles/?search=Django

# 过滤文章
GET /api/articles/?category=1&status=published

# 排序文章
GET /api/articles/?ordering=-views
```

---

## 最佳实践

### 项目结构建议

```
myproject/
├── config/                  # 项目配置
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py         # 基础配置
│   │   ├── development.py  # 开发环境
│   │   ├── production.py   # 生产环境
│   │   └── testing.py      # 测试环境
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/                    # 应用目录
│   ├── __init__.py
│   ├── blog/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── forms.py
│   │   ├── signals.py
│   │   ├── managers.py
│   │   ├── mixins.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── permissions.py
│   │   ├── templates/
│   │   │   └── blog/
│   │   ├── templatetags/
│   │   ├── tests/
│   │   │   ├── __init__.py
│   │   │   ├── test_models.py
│   │   │   ├── test_views.py
│   │   │   └── test_api.py
│   │   └── migrations/
│   └── accounts/
├── templates/               # 全局模板
│   └── base.html
├── static/                  # 静态文件
│   ├── css/
│   ├── js/
│   └── images/
├── media/                   # 用户上传文件
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── manage.py
├── .env                     # 环境变量
├── .gitignore
└── README.md
```

### 安全建议

```python
# settings/production.py

import os

# 安全设置
DEBUG = False
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# HTTPS设置
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS设置
SECURE_HSTS_SECONDS = 31536000  # 1年
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# 其他安全设置
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# 数据库（使用环境变量）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ.get('DB_PORT', '5432'),
        'CONN_MAX_AGE': 60,
    }
}
```

### 性能优化

```python
# 数据库查询优化
# 使用select_related()预加载ForeignKey
articles = Article.objects.select_related('author', 'category').all()

# 使用prefetch_related()预加载ManyToMany
articles = Article.objects.prefetch_related('tags').all()

# 使用only()或defer()限制字段
articles = Article.objects.only('title', 'slug', 'publish_date')
articles = Article.objects.defer('content')

# 使用values()或values_list()
titles = Article.objects.values_list('title', flat=True)

# 使用iterator()处理大量数据
for article in Article.objects.all().iterator():
    process(article)

# 使用bulk_create()批量创建
Article.objects.bulk_create([Article(...) for _ in range(1000)])

# 使用bulk_update()批量更新
Article.objects.bulk_update(articles, ['status'])

# 缓存设置
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# 视图缓存
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # 缓存15分钟
def article_list(request):
    ...

# 模板片段缓存
# {% load cache %}
# {% cache 500 sidebar %}
#     ... 侧边栏内容 ...
# {% endcache %}

# 低级缓存
from django.core.cache import cache

def get_popular_articles():
    key = 'popular_articles'
    articles = cache.get(key)
    if articles is None:
        articles = list(Article.objects.order_by('-views')[:10])
        cache.set(key, articles, 60 * 60)  # 缓存1小时
    return articles
```

### 测试示例

```python
# blog/tests/test_models.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from blog.models import Article, Category

User = get_user_model()


class ArticleModelTest(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cls.category = Category.objects.create(
            name='测试分类',
            slug='test-category'
        )
        cls.article = Article.objects.create(
            title='测试文章',
            slug='test-article',
            author=cls.user,
            category=cls.category,
            content='这是测试内容',
            status='published'
        )

    def test_article_creation(self):
        self.assertEqual(self.article.title, '测试文章')
        self.assertEqual(self.article.author.username, 'testuser')

    def test_article_str(self):
        self.assertEqual(str(self.article), '测试文章')

    def test_get_absolute_url(self):
        url = self.article.get_absolute_url()
        self.assertIn('test-article', url)


# blog/tests/test_views.py

from django.test import TestCase, Client
from django.urls import reverse


class ArticleViewTest(TestCase):

    def setUp(self):
        self.client = Client()

    def test_article_list_view(self):
        response = self.client.get(reverse('blog:article_list'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'blog/article_list.html')


# blog/tests/test_api.py

from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse


class ArticleAPITest(APITestCase):

    def test_list_articles(self):
        url = reverse('api:article-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

运行测试：

```bash
# 运行所有测试
python manage.py test

# 运行特定应用测试
python manage.py test blog

# 运行特定测试类
python manage.py test blog.tests.test_models.ArticleModelTest

# 运行特定测试方法
python manage.py test blog.tests.test_models.ArticleModelTest.test_article_creation

# 带覆盖率报告
pip install coverage
coverage run manage.py test
coverage report
coverage html
```

---

## 总结

Django是一个功能完善、文档丰富的Python Web框架，适合构建各种规模的Web应用。本文涵盖了Django的核心概念：

1. **MTV架构**：Model处理数据，Template负责展示，View处理请求逻辑
2. **ORM系统**：强大的数据库抽象层，支持多种数据库
3. **模板引擎**：安全、灵活的模板系统
4. **表单处理**：自动验证和渲染
5. **认证系统**：完整的用户认证和权限管理
6. **REST API**：通过DRF快速构建API

Django的"电池已包含"理念让开发者能够快速构建功能完整的Web应用，同时其灵活的架构也支持定制和扩展。无论是小型博客还是大型企业应用，Django都是一个可靠的选择。
