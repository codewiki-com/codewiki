---
title: Django Web框架完全指南
description: 掌握Django全栈Web框架，快速构建Web应用
track: python
section: basics
difficulty: intermediate
tags:
  - Django
  - Python
  - Web框架
  - ORM
status: imported
origin: old/src/content/docs/backend/django.zh.md
divergence: 0.279
issues: []
legacy:
  category: Backend
  subcategory: Python
  order: 12
  lastUpdated: 2026-01-07
---

## 概念解释

Django 是一个高级 Python Web 框架，它鼓励快速开发和简洁、实用的设计。由经验丰富的开发者构建，Django 处理了 Web 开发中的大量繁琐工作，让你可以专注于编写应用程序而无需重新发明轮子。它是免费且开源的。

### 为什么选择 Django？

Django 遵循"不要重复自己"（DRY）原则和"约定优于配置"的设计哲学。它提供了一个全功能的框架，包含了构建现代 Web 应用所需的一切组件。

Django 的核心优势包括：

- **开发速度快**：Django 的设计目标是帮助开发者尽可能快地将应用从概念阶段带到完成阶段
- **安全性高**：Django 认真对待安全问题，帮助开发者避免许多常见的安全错误
- **可扩展性强**：一些流量最大的网站都在使用 Django 的能力来快速灵活地扩展
- **功能全面**：内置 ORM、认证系统、管理后台、表单处理等
- **社区活跃**：拥有庞大的社区和丰富的第三方包生态系统

## MTV 架构模式

### 什么是 MTV？

Django 采用 MTV（Model-Template-View）架构模式，这是对传统 MVC 模式的一种变体。在 Django 的解释中：

- **Model（模型）**：负责数据的存储和业务逻辑，与数据库交互
- **Template（模板）**：负责展示数据，即用户界面的呈现
- **View（视图）**：负责业务逻辑处理，决定展示什么数据

Django 官方对此有独到的解释：在 Django 的概念中，"视图"描述的是呈现给用户的数据内容，而不是数据的外观。视图描述的是"你看到什么数据"，而不是"数据看起来怎么样"。这是一个微妙但重要的区别。

```
用户请求 → URL配置 → View(视图) → Model(模型) → 数据库
                         ↓
                    Template(模板) → 响应给用户
```

### MTV vs MVC 对比

| MVC 模式 | Django MTV | 职责描述 |
|----------|------------|----------|
| Model | Model | 数据模型，处理与数据库的交互 |
| View | Template | 用户界面，负责数据的展示 |
| Controller | View | 业务逻辑，处理用户请求并返回响应 |

Django 中的 URL 配置（URLconf）也可以被视为"控制器"的一部分，它负责将 URL 映射到相应的视图函数。

### 项目结构

一个标准的 Django 项目结构如下：

```
myproject/
├── manage.py                 # Django 命令行工具
├── myproject/                # 项目配置目录
│   ├── __init__.py
│   ├── settings.py          # 项目设置
│   ├── urls.py              # 根 URL 配置
│   ├── asgi.py              # ASGI 配置
│   └── wsgi.py              # WSGI 配置
├── app1/                     # 应用目录
│   ├── __init__.py
│   ├── admin.py             # 管理后台配置
│   ├── apps.py              # 应用配置
│   ├── models.py            # 数据模型
│   ├── views.py             # 视图函数
│   ├── urls.py              # 应用 URL 配置
│   ├── forms.py             # 表单定义
│   ├── tests.py             # 测试代码
│   ├── templates/           # 模板目录
│   │   └── app1/
│   │       └── index.html
│   ├── static/              # 静态文件
│   │   └── app1/
│   │       ├── css/
│   │       └── js/
│   └── migrations/          # 数据库迁移文件
│       └── __init__.py
├── templates/               # 全局模板目录
├── static/                  # 全局静态文件
└── requirements.txt         # 项目依赖
```

### 快速开始

安装 Django 并创建项目：

```bash
# 安装 Django
pip install django

# 创建项目
django-admin startproject myproject

# 进入项目目录
cd myproject

# 创建应用
python manage.py startapp blog

# 运行开发服务器
python manage.py runserver
```

## ORM 数据库操作

### 模型定义

Django 的 ORM（对象关系映射）是其最强大的特性之一。它允许你使用 Python 类来定义数据库表结构：

```python
# blog/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Category(models.Model):
    """文章分类"""
    name = models.CharField('分类名称', max_length=100)
    slug = models.SlugField('URL别名', unique=True)
    description = models.TextField('描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '分类'
        verbose_name_plural = '分类'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    """文章标签"""
    name = models.CharField('标签名', max_length=50)
    slug = models.SlugField('URL别名', unique=True)

    class Meta:
        verbose_name = '标签'
        verbose_name_plural = '标签'

    def __str__(self):
        return self.name


class Article(models.Model):
    """文章模型"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
    ]

    title = models.CharField('标题', max_length=200)
    slug = models.SlugField('URL别名', unique_for_date='publish_date')
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='articles',
        verbose_name='作者'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles',
        verbose_name='分类'
    )
    tags = models.ManyToManyField(
        Tag,
        related_name='articles',
        blank=True,
        verbose_name='标签'
    )
    content = models.TextField('内容')
    excerpt = models.TextField('摘要', max_length=500, blank=True)
    featured_image = models.ImageField(
        '特色图片',
        upload_to='articles/%Y/%m/',
        blank=True
    )
    status = models.CharField(
        '状态',
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    views = models.PositiveIntegerField('浏览量', default=0)
    publish_date = models.DateTimeField('发布时间', default=timezone.now)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

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
        from django.urls import reverse
        return reverse('blog:article_detail', args=[
            self.publish_date.year,
            self.publish_date.month,
            self.publish_date.day,
            self.slug
        ])


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
        verbose_name='评论者'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies',
        verbose_name='父评论'
    )
    content = models.TextField('评论内容')
    is_active = models.BooleanField('是否显示', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '评论'
        verbose_name_plural = '评论'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author.username} 评论了 {self.article.title}'
```

### 数据库迁移

定义模型后，需要创建和应用数据库迁移：

```bash
# 生成迁移文件
python manage.py makemigrations

# 查看 SQL 语句
python manage.py sqlmigrate blog 0001

# 应用迁移
python manage.py migrate

# 查看迁移状态
python manage.py showmigrations
```

### QuerySet 查询

Django ORM 提供了强大的查询 API：

```python
from blog.models import Article, Category, Tag
from django.db.models import Q, F, Count, Avg, Sum
from datetime import datetime, timedelta

# ========== 基础查询 ==========

# 获取所有文章
articles = Article.objects.all()

# 获取单个对象
article = Article.objects.get(id=1)  # 如果不存在会抛出异常
article = Article.objects.filter(id=1).first()  # 不存在返回 None

# 过滤查询
published = Article.objects.filter(status='published')
drafts = Article.objects.exclude(status='published')

# ========== 字段查找 ==========

# 精确匹配
Article.objects.filter(title='Django入门')
Article.objects.filter(title__exact='Django入门')

# 不区分大小写
Article.objects.filter(title__iexact='django入门')

# 包含
Article.objects.filter(title__contains='Django')
Article.objects.filter(title__icontains='django')

# 以...开头/结尾
Article.objects.filter(title__startswith='Django')
Article.objects.filter(title__endswith='教程')

# 范围查询
Article.objects.filter(views__gt=100)       # 大于
Article.objects.filter(views__gte=100)      # 大于等于
Article.objects.filter(views__lt=100)       # 小于
Article.objects.filter(views__lte=100)      # 小于等于
Article.objects.filter(views__range=(50, 200))  # 范围

# 日期查询
Article.objects.filter(publish_date__year=2024)
Article.objects.filter(publish_date__month=1)
Article.objects.filter(publish_date__day=15)
Article.objects.filter(publish_date__date=datetime.date(2024, 1, 15))

# 空值查询
Article.objects.filter(excerpt__isnull=True)
Article.objects.filter(excerpt='')

# 列表查询
Article.objects.filter(id__in=[1, 2, 3])

# ========== 关联查询 ==========

# 正向查询（通过外键）
Article.objects.filter(author__username='admin')
Article.objects.filter(category__name='技术')

# 反向查询（通过 related_name）
user.articles.all()  # 获取用户的所有文章
category.articles.filter(status='published')

# 跨多个关系查询
Article.objects.filter(tags__name='Python')

# 确保多个条件应用于同一关联对象
Article.objects.filter(
    comments__author__username='john',
    comments__is_active=True
)

# ========== Q 对象（复杂查询） ==========

# OR 查询
Article.objects.filter(
    Q(status='published') | Q(author__username='admin')
)

# AND 查询
Article.objects.filter(
    Q(status='published') & Q(views__gt=100)
)

# NOT 查询
Article.objects.filter(~Q(status='draft'))

# 复杂组合
Article.objects.filter(
    Q(status='published'),
    Q(category__name='技术') | Q(tags__name='Python'),
    ~Q(views=0)
)

# ========== F 对象（字段引用） ==========

# 比较两个字段
Article.objects.filter(updated_at__gt=F('created_at'))

# 字段运算
Article.objects.filter(views__gt=F('views') * 2)

# 更新时使用 F 对象
Article.objects.filter(id=1).update(views=F('views') + 1)

# ========== 聚合查询 ==========

from django.db.models import Count, Avg, Max, Min, Sum

# 简单聚合
Article.objects.aggregate(
    total_views=Sum('views'),
    avg_views=Avg('views'),
    max_views=Max('views'),
    article_count=Count('id')
)

# 分组聚合
Category.objects.annotate(
    article_count=Count('articles'),
    total_views=Sum('articles__views')
).order_by('-article_count')

# 带条件的聚合
from django.db.models import Count, Q

Category.objects.annotate(
    published_count=Count(
        'articles',
        filter=Q(articles__status='published')
    )
)

# ========== 排序和切片 ==========

# 排序
Article.objects.order_by('-publish_date')  # 降序
Article.objects.order_by('title', '-created_at')  # 多字段排序

# 切片（分页）
Article.objects.all()[:10]  # 前10条
Article.objects.all()[10:20]  # 第11-20条

# 获取第一条/最后一条
Article.objects.first()
Article.objects.last()

# ========== 其他常用方法 ==========

# 去重
Article.objects.filter(tags__name='Python').distinct()

# 只获取特定字段
Article.objects.values('title', 'author__username')
Article.objects.values_list('title', flat=True)

# 存在性检查
Article.objects.filter(status='published').exists()

# 计数
Article.objects.filter(status='published').count()

# 批量创建
Article.objects.bulk_create([
    Article(title='文章1', ...),
    Article(title='文章2', ...),
])

# 批量更新
Article.objects.filter(status='draft').update(status='published')

# 获取或创建
article, created = Article.objects.get_or_create(
    slug='django-tutorial',
    defaults={'title': 'Django教程', 'content': '...'}
)

# 更新或创建
article, created = Article.objects.update_or_create(
    slug='django-tutorial',
    defaults={'title': 'Django完整教程', 'views': 100}
)
```

### 查询优化

```python
# ========== select_related（一对一、外键优化） ==========

# 未优化：N+1 查询问题
for article in Article.objects.all():
    print(article.author.username)  # 每次循环都查询数据库

# 优化后：使用 JOIN 一次性获取
for article in Article.objects.select_related('author', 'category'):
    print(article.author.username)  # 不再产生额外查询

# ========== prefetch_related（多对多、反向外键优化） ==========

# 未优化
for article in Article.objects.all():
    print(article.tags.all())  # 每次循环都查询

# 优化后
for article in Article.objects.prefetch_related('tags'):
    print(article.tags.all())

# 复杂预取
from django.db.models import Prefetch

Article.objects.prefetch_related(
    Prefetch(
        'comments',
        queryset=Comment.objects.filter(is_active=True).select_related('author'),
        to_attr='active_comments'
    )
)

# ========== only 和 defer ==========

# 只获取特定字段
Article.objects.only('title', 'publish_date')

# 排除特定字段
Article.objects.defer('content')

# ========== 使用索引 ==========

class Article(models.Model):
    # ...
    class Meta:
        indexes = [
            models.Index(fields=['status', '-publish_date']),
            models.Index(fields=['author', 'status']),
        ]
```

## Views 视图

### 函数视图（FBV）

```python
# blog/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.contrib import messages
from .models import Article, Category
from .forms import ArticleForm, CommentForm


def article_list(request):
    """文章列表视图"""
    articles = Article.objects.filter(
        status='published'
    ).select_related('author', 'category')

    # 分类过滤
    category_slug = request.GET.get('category')
    if category_slug:
        articles = articles.filter(category__slug=category_slug)

    # 搜索
    search_query = request.GET.get('q')
    if search_query:
        articles = articles.filter(
            Q(title__icontains=search_query) |
            Q(content__icontains=search_query)
        )

    # 分页
    paginator = Paginator(articles, 10)  # 每页10条
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'categories': Category.objects.all(),
        'search_query': search_query,
    }
    return render(request, 'blog/article_list.html', context)


def article_detail(request, year, month, day, slug):
    """文章详情视图"""
    article = get_object_or_404(
        Article.objects.select_related('author', 'category'),
        slug=slug,
        status='published',
        publish_date__year=year,
        publish_date__month=month,
        publish_date__day=day
    )

    # 增加浏览量
    Article.objects.filter(pk=article.pk).update(views=F('views') + 1)

    # 获取评论
    comments = article.comments.filter(
        is_active=True,
        parent__isnull=True
    ).select_related('author').prefetch_related('replies')

    # 评论表单
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
    """创建文章"""
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


@login_required
def article_update(request, pk):
    """更新文章"""
    article = get_object_or_404(Article, pk=pk, author=request.user)

    if request.method == 'POST':
        form = ArticleForm(request.POST, request.FILES, instance=article)
        if form.is_valid():
            form.save()
            messages.success(request, '文章更新成功！')
            return redirect(article.get_absolute_url())
    else:
        form = ArticleForm(instance=article)

    return render(request, 'blog/article_form.html', {
        'form': form,
        'article': article
    })


@login_required
def article_delete(request, pk):
    """删除文章"""
    article = get_object_or_404(Article, pk=pk, author=request.user)

    if request.method == 'POST':
        article.delete()
        messages.success(request, '文章已删除！')
        return redirect('blog:article_list')

    return render(request, 'blog/article_confirm_delete.html', {
        'article': article
    })


def api_articles(request):
    """API：获取文章列表（JSON）"""
    articles = Article.objects.filter(status='published').values(
        'id', 'title', 'slug', 'excerpt', 'publish_date'
    )[:20]

    return JsonResponse({
        'status': 'success',
        'data': list(articles)
    })
```

### 类视图（CBV）

Django 提供了强大的类视图系统，可以大大减少重复代码：

```python
# blog/views.py
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView,
    TemplateView, FormView
)
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from .models import Article, Category
from .forms import ArticleForm


class ArticleListView(ListView):
    """文章列表"""
    model = Article
    template_name = 'blog/article_list.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        queryset = super().get_queryset().filter(
            status='published'
        ).select_related('author', 'category')

        # 分类过滤
        category_slug = self.request.GET.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # 搜索
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query)
            )

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['search_query'] = self.request.GET.get('q', '')
        return context


class ArticleDetailView(DetailView):
    """文章详情"""
    model = Article
    template_name = 'blog/article_detail.html'
    context_object_name = 'article'

    def get_queryset(self):
        return super().get_queryset().filter(
            status='published'
        ).select_related('author', 'category')

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
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
    """创建文章"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'
    success_url = reverse_lazy('blog:article_list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        messages.success(self.request, '文章创建成功！')
        return super().form_valid(form)


class ArticleUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """更新文章"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'

    def test_func(self):
        """确保只有作者可以编辑"""
        article = self.get_object()
        return self.request.user == article.author

    def form_valid(self, form):
        messages.success(self.request, '文章更新成功！')
        return super().form_valid(form)


class ArticleDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """删除文章"""
    model = Article
    template_name = 'blog/article_confirm_delete.html'
    success_url = reverse_lazy('blog:article_list')

    def test_func(self):
        article = self.get_object()
        return self.request.user == article.author

    def delete(self, request, *args, **kwargs):
        messages.success(request, '文章已删除！')
        return super().delete(request, *args, **kwargs)


class CategoryArticleListView(ListView):
    """分类文章列表"""
    model = Article
    template_name = 'blog/category_article_list.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        self.category = get_object_or_404(
            Category, slug=self.kwargs['slug']
        )
        return Article.objects.filter(
            category=self.category,
            status='published'
        ).select_related('author')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category'] = self.category
        return context
```

### URL 配置

```python
# blog/urls.py
from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # 列表页
    path('', views.ArticleListView.as_view(), name='article_list'),

    # 文章详情
    path(
        '<int:year>/<int:month>/<int:day>/<slug:slug>/',
        views.ArticleDetailView.as_view(),
        name='article_detail'
    ),

    # 创建文章
    path('create/', views.ArticleCreateView.as_view(), name='article_create'),

    # 更新文章
    path('<int:pk>/update/', views.ArticleUpdateView.as_view(), name='article_update'),

    # 删除文章
    path('<int:pk>/delete/', views.ArticleDeleteView.as_view(), name='article_delete'),

    # 分类文章
    path(
        'category/<slug:slug>/',
        views.CategoryArticleListView.as_view(),
        name='category_articles'
    ),

    # API
    path('api/articles/', views.api_articles, name='api_articles'),
]

# myproject/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls', namespace='blog')),
]
```

## Templates 模板

### 模板基础

Django 模板语言（DTL）提供了强大的模板功能：

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
            {% if user.is_authenticated %}
                <a href="{% url 'blog:article_create' %}">写文章</a>
                <span>欢迎，{{ user.username }}</span>
                <a href="{% url 'logout' %}">退出</a>
            {% else %}
                <a href="{% url 'login' %}">登录</a>
                <a href="{% url 'register' %}">注册</a>
            {% endif %}
        </nav>
    </header>

    <main>
        {% if messages %}
            {% for message in messages %}
                <div class="alert alert-{{ message.tags }}">
                    {{ message }}
                </div>
            {% endfor %}
        {% endif %}

        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; 2024 我的博客</p>
    </footer>

    {% block extra_js %}{% endblock %}
</body>
</html>
```

```html
<!-- templates/blog/article_list.html -->
{% extends 'base.html' %}
{% load static %}

{% block title %}文章列表 - {{ block.super }}{% endblock %}

{% block content %}
<div class="container">
    <h1>文章列表</h1>

    <!-- 搜索表单 -->
    <form method="get" class="search-form">
        <input type="text" name="q" value="{{ search_query }}"
               placeholder="搜索文章...">
        <button type="submit">搜索</button>
    </form>

    <!-- 分类导航 -->
    <nav class="categories">
        <a href="{% url 'blog:article_list' %}"
           {% if not request.GET.category %}class="active"{% endif %}>
            全部
        </a>
        {% for category in categories %}
            <a href="?category={{ category.slug }}"
               {% if request.GET.category == category.slug %}class="active"{% endif %}>
                {{ category.name }}
            </a>
        {% endfor %}
    </nav>

    <!-- 文章列表 -->
    {% if page_obj %}
        <div class="article-list">
            {% for article in page_obj %}
                <article class="article-card">
                    {% if article.featured_image %}
                        <img src="{{ article.featured_image.url }}"
                             alt="{{ article.title }}">
                    {% endif %}
                    <div class="article-content">
                        <h2>
                            <a href="{{ article.get_absolute_url }}">
                                {{ article.title }}
                            </a>
                        </h2>
                        <p class="meta">
                            <span class="author">{{ article.author.username }}</span>
                            <span class="date">{{ article.publish_date|date:"Y年m月d日" }}</span>
                            <span class="category">{{ article.category.name }}</span>
                            <span class="views">{{ article.views }} 次浏览</span>
                        </p>
                        <p class="excerpt">
                            {{ article.excerpt|default:article.content|truncatechars:200 }}
                        </p>
                        <div class="tags">
                            {% for tag in article.tags.all %}
                                <span class="tag">{{ tag.name }}</span>
                            {% endfor %}
                        </div>
                    </div>
                </article>
            {% empty %}
                <p>暂无文章</p>
            {% endfor %}
        </div>

        <!-- 分页 -->
        {% if page_obj.has_other_pages %}
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
    {% endif %}
</div>
{% endblock %}
```

### 自定义模板标签和过滤器

```python
# blog/templatetags/blog_tags.py
from django import template
from django.utils.safestring import mark_safe
import markdown

register = template.Library()


@register.simple_tag
def total_articles():
    """获取已发布文章总数"""
    from blog.models import Article
    return Article.objects.filter(status='published').count()


@register.inclusion_tag('blog/latest_articles.html')
def show_latest_articles(count=5):
    """显示最新文章"""
    from blog.models import Article
    latest = Article.objects.filter(
        status='published'
    ).order_by('-publish_date')[:count]
    return {'latest_articles': latest}


@register.inclusion_tag('blog/popular_tags.html')
def show_popular_tags(count=10):
    """显示热门标签"""
    from blog.models import Tag
    from django.db.models import Count

    tags = Tag.objects.annotate(
        article_count=Count('articles')
    ).order_by('-article_count')[:count]
    return {'tags': tags}


@register.filter(name='markdown')
def markdown_format(text):
    """将 Markdown 转换为 HTML"""
    return mark_safe(markdown.markdown(
        text,
        extensions=['extra', 'codehilite', 'toc']
    ))


@register.filter
def reading_time(text):
    """估算阅读时间"""
    words_per_minute = 200
    word_count = len(text.split())
    minutes = max(1, round(word_count / words_per_minute))
    return f'{minutes} 分钟阅读'


@register.simple_tag(takes_context=True)
def query_transform(context, **kwargs):
    """在保留现有查询参数的同时修改参数"""
    query = context['request'].GET.copy()
    for key, value in kwargs.items():
        query[key] = value
    return query.urlencode()
```

使用自定义标签：

```html
{% load blog_tags %}

<!-- 使用 simple_tag -->
<p>共有 {% total_articles %} 篇文章</p>

<!-- 使用 inclusion_tag -->
{% show_latest_articles 5 %}
{% show_popular_tags 10 %}

<!-- 使用过滤器 -->
<div class="content">
    {{ article.content|markdown }}
</div>

<span class="reading-time">{{ article.content|reading_time }}</span>
```

## Forms 表单

### 表单定义

Django 表单系统提供了强大的表单验证和渲染功能：

```python
# blog/forms.py
from django import forms
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from .models import Article, Comment, Category, Tag


class ArticleForm(forms.ModelForm):
    """文章表单"""

    class Meta:
        model = Article
        fields = ['title', 'slug', 'category', 'tags', 'content',
                  'excerpt', 'featured_image', 'status']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '请输入文章标题'
            }),
            'slug': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'URL别名（留空自动生成）'
            }),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'tags': forms.CheckboxSelectMultiple(),
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 15,
                'placeholder': '请输入文章内容（支持 Markdown）'
            }),
            'excerpt': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '文章摘要（可选）'
            }),
            'status': forms.RadioSelect(),
        }
        labels = {
            'title': '标题',
            'slug': 'URL 别名',
            'category': '分类',
            'tags': '标签',
            'content': '内容',
            'excerpt': '摘要',
            'featured_image': '特色图片',
            'status': '发布状态',
        }
        help_texts = {
            'slug': '用于生成文章 URL，只能包含字母、数字、下划线和连字符',
            'excerpt': '如果留空，将自动从内容中提取',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 设置必填字段
        self.fields['title'].required = True
        self.fields['content'].required = True

    def clean_slug(self):
        """验证和处理 slug"""
        slug = self.cleaned_data.get('slug')
        if not slug:
            # 自动生成 slug
            title = self.cleaned_data.get('title', '')
            slug = slugify(title, allow_unicode=True)

        # 检查唯一性
        exists = Article.objects.filter(slug=slug)
        if self.instance.pk:
            exists = exists.exclude(pk=self.instance.pk)
        if exists.exists():
            raise ValidationError('此 URL 别名已被使用')

        return slug

    def clean_content(self):
        """验证内容"""
        content = self.cleaned_data.get('content')
        if len(content) < 100:
            raise ValidationError('文章内容至少需要 100 个字符')
        return content

    def clean(self):
        """跨字段验证"""
        cleaned_data = super().clean()
        status = cleaned_data.get('status')
        category = cleaned_data.get('category')

        if status == 'published' and not category:
            raise ValidationError('发布的文章必须选择分类')

        return cleaned_data


class CommentForm(forms.ModelForm):
    """评论表单"""

    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': '写下你的评论...'
            })
        }

    def clean_content(self):
        content = self.cleaned_data.get('content')
        if len(content) < 10:
            raise ValidationError('评论内容至少需要 10 个字符')
        # 简单的敏感词过滤
        forbidden_words = ['垃圾', '广告']
        for word in forbidden_words:
            if word in content:
                raise ValidationError('评论包含不允许的内容')
        return content


class SearchForm(forms.Form):
    """搜索表单"""
    q = forms.CharField(
        label='搜索',
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '搜索文章...'
        })
    )
    category = forms.ModelChoiceField(
        label='分类',
        queryset=Category.objects.all(),
        required=False,
        empty_label='所有分类',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    date_from = forms.DateField(
        label='开始日期',
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )
    date_to = forms.DateField(
        label='结束日期',
        required=False,
        widget=forms.DateInput(attrs={
            'class': 'form-control',
            'type': 'date'
        })
    )

    def clean(self):
        cleaned_data = super().clean()
        date_from = cleaned_data.get('date_from')
        date_to = cleaned_data.get('date_to')

        if date_from and date_to and date_from > date_to:
            raise ValidationError('开始日期不能晚于结束日期')

        return cleaned_data


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
        label='消息',
        widget=forms.Textarea(attrs={
            'class': 'form-control',
            'rows': 5
        })
    )

    def send_email(self):
        """发送邮件"""
        from django.core.mail import send_mail
        send_mail(
            subject=self.cleaned_data['subject'],
            message=self.cleaned_data['message'],
            from_email=self.cleaned_data['email'],
            recipient_list=['admin@example.com'],
        )
```

### 表单渲染

```html
<!-- templates/blog/article_form.html -->
{% extends 'base.html' %}

{% block content %}
<div class="container">
    <h1>{% if article %}编辑文章{% else %}创建文章{% endif %}</h1>

    <form method="post" enctype="multipart/form-data" novalidate>
        {% csrf_token %}

        <!-- 显示非字段错误 -->
        {% if form.non_field_errors %}
            <div class="alert alert-danger">
                {% for error in form.non_field_errors %}
                    <p>{{ error }}</p>
                {% endfor %}
            </div>
        {% endif %}

        <!-- 手动渲染字段 -->
        <div class="mb-3">
            <label for="{{ form.title.id_for_label }}" class="form-label">
                {{ form.title.label }}
                {% if form.title.field.required %}<span class="text-danger">*</span>{% endif %}
            </label>
            {{ form.title }}
            {% if form.title.help_text %}
                <div class="form-text">{{ form.title.help_text }}</div>
            {% endif %}
            {% if form.title.errors %}
                <div class="invalid-feedback d-block">
                    {% for error in form.title.errors %}
                        {{ error }}
                    {% endfor %}
                </div>
            {% endif %}
        </div>

        <div class="mb-3">
            {{ form.slug.label_tag }}
            {{ form.slug }}
            <div class="form-text">{{ form.slug.help_text }}</div>
            {{ form.slug.errors }}
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                {{ form.category.label_tag }}
                {{ form.category }}
                {{ form.category.errors }}
            </div>
            <div class="col-md-6 mb-3">
                {{ form.status.label_tag }}
                {{ form.status }}
                {{ form.status.errors }}
            </div>
        </div>

        <div class="mb-3">
            <label class="form-label">标签</label>
            <div class="tags-wrapper">
                {{ form.tags }}
            </div>
        </div>

        <div class="mb-3">
            {{ form.content.label_tag }}
            {{ form.content }}
            {{ form.content.errors }}
        </div>

        <div class="mb-3">
            {{ form.excerpt.label_tag }}
            {{ form.excerpt }}
            <div class="form-text">{{ form.excerpt.help_text }}</div>
        </div>

        <div class="mb-3">
            {{ form.featured_image.label_tag }}
            {{ form.featured_image }}
            {% if article.featured_image %}
                <img src="{{ article.featured_image.url }}"
                     alt="当前图片" class="img-thumbnail mt-2" width="200">
            {% endif %}
        </div>

        <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
                {% if article %}保存修改{% else %}发布文章{% endif %}
            </button>
            <a href="{% url 'blog:article_list' %}" class="btn btn-secondary">
                取消
            </a>
        </div>
    </form>
</div>
{% endblock %}
```

## Authentication 认证系统

### Django 内置认证

Django 提供了完整的用户认证系统：

```python
# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import (
    UserCreationForm, AuthenticationForm,
    PasswordChangeForm, PasswordResetForm
)
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import CustomUserCreationForm, UserProfileForm


def register(request):
    """用户注册"""
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, '注册成功！欢迎加入！')
            return redirect('home')
    else:
        form = CustomUserCreationForm()

    return render(request, 'accounts/register.html', {'form': form})


def user_login(request):
    """用户登录"""
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'欢迎回来，{username}！')
                next_url = request.GET.get('next', 'home')
                return redirect(next_url)
    else:
        form = AuthenticationForm()

    return render(request, 'accounts/login.html', {'form': form})


@login_required
def user_logout(request):
    """用户退出"""
    logout(request)
    messages.info(request, '您已成功退出登录')
    return redirect('home')


@login_required
def profile(request):
    """用户个人资料"""
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '个人资料已更新')
            return redirect('accounts:profile')
    else:
        form = UserProfileForm(instance=request.user)

    return render(request, 'accounts/profile.html', {'form': form})


@login_required
def change_password(request):
    """修改密码"""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            # 更新会话，防止用户被登出
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
            messages.success(request, '密码修改成功！')
            return redirect('accounts:profile')
    else:
        form = PasswordChangeForm(request.user)

    return render(request, 'accounts/change_password.html', {'form': form})
```

### 自定义用户模型

```python
# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """自定义用户模型"""
    email = models.EmailField('邮箱', unique=True)
    avatar = models.ImageField('头像', upload_to='avatars/', blank=True)
    bio = models.TextField('个人简介', max_length=500, blank=True)
    website = models.URLField('个人网站', blank=True)
    location = models.CharField('所在地', max_length=100, blank=True)
    birth_date = models.DateField('出生日期', null=True, blank=True)

    # 社交账号
    github_username = models.CharField('GitHub', max_length=100, blank=True)
    twitter_username = models.CharField('Twitter', max_length=100, blank=True)

    # 设置
    email_notifications = models.BooleanField('邮件通知', default=True)
    is_verified = models.BooleanField('已验证', default=False)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username
```

```python
# settings.py
AUTH_USER_MODEL = 'accounts.CustomUser'
```

### 权限控制

```python
# 视图级别权限控制
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import (
    LoginRequiredMixin, PermissionRequiredMixin, UserPassesTestMixin
)

# 函数视图装饰器
@login_required
def my_view(request):
    pass

@permission_required('blog.add_article')
def add_article(request):
    pass

@permission_required(['blog.add_article', 'blog.change_article'])
def manage_article(request):
    pass


# 类视图混入
class ArticleCreateView(LoginRequiredMixin, PermissionRequiredMixin, CreateView):
    permission_required = 'blog.add_article'
    # 或多个权限
    # permission_required = ('blog.add_article', 'blog.change_article')


class ArticleUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    def test_func(self):
        article = self.get_object()
        return (
            self.request.user == article.author or
            self.request.user.has_perm('blog.change_article')
        )


# 模板中检查权限
"""
{% if perms.blog.add_article %}
    <a href="{% url 'blog:article_create' %}">写文章</a>
{% endif %}

{% if perms.blog.change_article or user == article.author %}
    <a href="{% url 'blog:article_update' article.pk %}">编辑</a>
{% endif %}
"""
```

## Django REST Framework

### 基础配置

Django REST Framework（DRF）是构建 Web API 的强大工具：

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### Serializers 序列化器

```python
# blog/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Article, Category, Tag, Comment

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    articles_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'articles_count']
        read_only_fields = ['id', 'articles_count']

    def get_articles_count(self, obj):
        return obj.articles.filter(status='published').count()


class CategorySerializer(serializers.ModelSerializer):
    """分类序列化器"""
    articles_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'articles_count']


class TagSerializer(serializers.ModelSerializer):
    """标签序列化器"""

    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CommentSerializer(serializers.ModelSerializer):
    """评论序列化器"""
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'replies']
        read_only_fields = ['id', 'author', 'created_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.filter(is_active=True),
                many=True
            ).data
        return []


class ArticleListSerializer(serializers.ModelSerializer):
    """文章列表序列化器"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'author', 'category', 'tags',
            'excerpt', 'featured_image', 'views', 'publish_date',
            'comments_count'
        ]

    def get_comments_count(self, obj):
        return obj.comments.filter(is_active=True).count()


class ArticleDetailSerializer(serializers.ModelSerializer):
    """文章详情序列化器"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'author', 'category', 'tags',
            'content', 'excerpt', 'featured_image', 'status',
            'views', 'publish_date', 'created_at', 'updated_at',
            'comments'
        ]


class ArticleCreateSerializer(serializers.ModelSerializer):
    """文章创建/更新序列化器"""
    category_id = serializers.IntegerField(write_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'category_id', 'tag_ids',
            'content', 'excerpt', 'featured_image', 'status'
        ]
        read_only_fields = ['id']

    def validate_category_id(self, value):
        if not Category.objects.filter(id=value).exists():
            raise serializers.ValidationError('分类不存在')
        return value

    def validate_tag_ids(self, value):
        if value:
            existing_ids = set(Tag.objects.filter(id__in=value).values_list('id', flat=True))
            invalid_ids = set(value) - existing_ids
            if invalid_ids:
                raise serializers.ValidationError(f'标签不存在: {invalid_ids}')
        return value

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        category_id = validated_data.pop('category_id')
        validated_data['category_id'] = category_id

        article = Article.objects.create(**validated_data)
        if tag_ids:
            article.tags.set(tag_ids)
        return article

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        category_id = validated_data.pop('category_id', None)

        if category_id:
            instance.category_id = category_id

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance
```

### ViewSets 视图集

```python
# blog/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from .models import Article, Category, Tag, Comment
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer, ArticleCreateSerializer,
    CategorySerializer, TagSerializer, CommentSerializer
)
from .permissions import IsAuthorOrReadOnly
from .filters import ArticleFilter


class CategoryViewSet(viewsets.ModelViewSet):
    """分类视图集"""
    queryset = Category.objects.annotate(
        articles_count=Count('articles', filter=Q(articles__status='published'))
    )
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


class TagViewSet(viewsets.ModelViewSet):
    """标签视图集"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'


class ArticleViewSet(viewsets.ModelViewSet):
    """文章视图集"""
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ArticleFilter
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['publish_date', 'views', 'created_at']
    ordering = ['-publish_date']

    def get_queryset(self):
        queryset = Article.objects.select_related('author', 'category')
        if self.action == 'list':
            queryset = queryset.filter(status='published')
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ArticleCreateSerializer
        return ArticleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """发布文章"""
        article = self.get_object()
        if article.author != request.user:
            return Response(
                {'error': '只有作者可以发布文章'},
                status=status.HTTP_403_FORBIDDEN
            )
        article.status = 'published'
        article.save()
        return Response({'status': '文章已发布'})

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """获取文章评论"""
        article = self.get_object()
        comments = article.comments.filter(is_active=True, parent__isnull=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_comment(self, request, pk=None):
        """添加评论"""
        article = self.get_object()
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(author=request.user, article=article)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_articles(self, request):
        """获取当前用户的文章"""
        if not request.user.is_authenticated:
            return Response(
                {'error': '请先登录'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        articles = self.get_queryset().filter(author=request.user)
        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)
```

### URL 配置

```python
# blog/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'articles', views.ArticleViewSet, basename='article')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'tags', views.TagViewSet, basename='tag')

urlpatterns = [
    path('api/', include(router.urls)),
]
```

### 自定义权限

```python
# blog/permissions.py
from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """只有作者可以编辑"""

    def has_object_permission(self, request, view, obj):
        # 读取权限允许任何请求
        if request.method in permissions.SAFE_METHODS:
            return True
        # 写入权限只允许作者
        return obj.author == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """只有管理员可以编辑"""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
```

## 面试要点

### 基础概念题

**Q1: Django 的 MTV 架构和 MVC 有什么区别？**

A: Django 的 MTV（Model-Template-View）是 MVC 的一种变体：
- Model 对应 MVC 的 Model，负责数据层
- Template 对应 MVC 的 View，负责展示层
- View 对应 MVC 的 Controller，负责业务逻辑
- Django 的 URL 配置也承担了部分 Controller 的职责

**Q2: Django ORM 的 N+1 问题是什么？如何解决？**

A: N+1 问题是指在查询关联对象时，首先执行1次主查询，然后对每个结果再执行N次关联查询。解决方案：
- `select_related()`：用于一对一、外键关系，使用 SQL JOIN
- `prefetch_related()`：用于多对多、反向外键关系，使用两次独立查询

**Q3: Django 中 CSRF 保护是如何工作的？**

A: Django 的 CSRF 保护机制：
1. 服务器生成一个随机的 CSRF token
2. token 存储在用户的 session 中
3. 每个 POST 表单必须包含 `{% csrf_token %}` 模板标签
4. 提交时，Django 验证表单中的 token 与 session 中的 token 是否匹配

### 进阶实践题

**Q4: 如何优化 Django 应用的性能？**

A: 主要优化策略：
- 数据库：使用 `select_related`/`prefetch_related`、添加索引、使用 `only()`/`defer()`
- 缓存：使用 Redis/Memcached 缓存查询结果、模板片段
- 静态文件：使用 CDN、压缩合并 CSS/JS
- 数据库连接池：使用 `django-db-connection-pool`
- 异步任务：使用 Celery 处理耗时任务

**Q5: Django 信号（Signals）的使用场景？**

A: 信号用于解耦应用组件：
- `pre_save/post_save`：模型保存前后
- `pre_delete/post_delete`：模型删除前后
- `m2m_changed`：多对多关系变化
- 使用场景：自动创建用户档案、记录操作日志、清理缓存等

**Q6: 如何实现 Django 的多数据库支持？**

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'primary_db',
    },
    'replica': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'replica_db',
    }
}

# 数据库路由
class PrimaryReplicaRouter:
    def db_for_read(self, model, **hints):
        return 'replica'

    def db_for_write(self, model, **hints):
        return 'default'
```

### 架构设计题

**Q7: 设计一个支持高并发的 Django 应用架构**

推荐架构：
1. **负载均衡**：Nginx 反向代理
2. **应用层**：Gunicorn + Django（多 worker）
3. **缓存层**：Redis 缓存热点数据
4. **数据库**：PostgreSQL 主从复制
5. **异步任务**：Celery + RabbitMQ
6. **静态文件**：CDN 分发
7. **监控**：Prometheus + Grafana

**Q8: Django 项目如何做单元测试？**

```python
from django.test import TestCase, Client
from django.urls import reverse
from .models import Article

class ArticleTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user('testuser', 'test@example.com', 'password')

    def test_article_creation(self):
        article = Article.objects.create(
            title='Test Article',
            content='Test content',
            author=self.user
        )
        self.assertEqual(article.title, 'Test Article')

    def test_article_list_view(self):
        response = self.client.get(reverse('blog:article_list'))
        self.assertEqual(response.status_code, 200)
```

## 总结

Django 作为一个功能完善的全栈 Web 框架，提供了构建现代 Web 应用所需的一切组件。通过本文的学习，你应该掌握了：

1. **MTV 架构**：理解 Django 的设计哲学和项目结构
2. **ORM 系统**：熟练使用 QuerySet API 进行数据库操作
3. **视图开发**：掌握函数视图和类视图的使用
4. **模板系统**：理解模板继承、自定义标签和过滤器
5. **表单处理**：掌握表单验证和渲染
6. **认证系统**：理解 Django 的认证和权限控制
7. **REST API**：使用 Django REST Framework 构建 API

建议在实际项目中多加练习，结合官方文档深入理解各个特性，逐步成为 Django 开发专家。

## 参考资源

- [Django 官方文档](https://docs.djangoproject.com/)
- [Django REST Framework 文档](https://www.django-rest-framework.org/)
- [Django Girls 教程](https://tutorial.djangogirls.org/zh/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)
- [Django 设计模式与最佳实践](https://github.com/cundi/Django-Design-Patterns-and-Best-Practices)
