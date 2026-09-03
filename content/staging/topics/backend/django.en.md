---
title: Django Framework
description: Complete guide to Django, MTV architecture, ORM, templates and REST API
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - Django
  - Web Framework
  - ORM
status: imported
origin: old/src/content/docs/python/django.en.md
divergence: 0.245
issues: []
legacy:
  category: Python
  subcategory: Web Development
  order: 24
  lastUpdated: 2026-01-07
---

Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, it takes care of much of the hassle of web development, so you can focus on writing your app without needing to reinvent the wheel. Django follows the "batteries-included" philosophy, providing everything you need to build full-featured web applications out of the box.

## Installation and Setup

### Creating a New Django Project

```bash
# Install Django
pip install django

# Create a new project
django-admin startproject myproject
cd myproject

# Create a new app
python manage.py startapp blog

# Run the development server
python manage.py runserver
```

### Initial Project Structure

```
myproject/
├── manage.py                 # Command-line utility for Django
├── myproject/
│   ├── __init__.py
│   ├── settings.py          # Project settings
│   ├── urls.py              # Root URL configuration
│   ├── asgi.py              # ASGI configuration
│   └── wsgi.py              # WSGI configuration
└── blog/
    ├── __init__.py
    ├── admin.py             # Admin configuration
    ├── apps.py              # App configuration
    ├── models.py            # Database models
    ├── tests.py             # Tests
    ├── views.py             # View functions/classes
    └── migrations/          # Database migrations
```

### Registering the App

```python
# myproject/settings.py
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'blog',  # Add your app here
]
```

## MTV Architecture

Django follows the MTV (Model-Template-View) architectural pattern, which is similar to MVC (Model-View-Controller) but with different terminology.

### Understanding MTV

```
              HTTP Request
                   │
                   ▼
┌────────────────────────────────────┐
│           URL Dispatcher           │
│         (urls.py - Routing)        │
└────────────────┬───────────────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│              View                  │
│      (Business Logic Layer)        │
│   - Process request                │
│   - Interact with Model            │
│   - Return response                │
└────────┬───────────────┬───────────┘
         │               │
         ▼               ▼
┌──────────────┐  ┌─────────────────┐
│    Model     │  │    Template     │
│  (Database)  │  │   (HTML/UI)     │
│  - ORM       │  │   - Display     │
│  - Schema    │  │   - Formatting  │
└──────────────┘  └─────────────────┘
                         │
                         ▼
                  HTTP Response
```

### Model (M)

The Model represents the data structure. It defines your data and handles database interactions through Django's ORM.

### Template (T)

Templates define how data is presented to the user. Django's template language is designed to strike a balance between power and ease.

### View (V)

Views contain the business logic. They process requests, interact with models, and return responses.

## Models and ORM

Django's ORM (Object-Relational Mapping) is one of its most powerful features, allowing you to interact with your database using Python code instead of SQL.

### Defining Models

```python
# blog/models.py
from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

class Category(models.Model):
    """Category model for organizing articles"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('category_detail', kwargs={'slug': self.slug})


class Tag(models.Model):
    """Tag model for article tagging"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Article(models.Model):
    """Article model with various field types"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    # Basic fields
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    excerpt = models.TextField(max_length=500, blank=True)

    # Relationships
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='articles'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='articles'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='articles')

    # Status and dates
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    # Statistics
    views = models.PositiveIntegerField(default=0)
    featured = models.BooleanField(default=False)

    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', 'published_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('article_detail', kwargs={'slug': self.slug})

    @property
    def reading_time(self):
        """Calculate estimated reading time"""
        words = len(self.content.split())
        minutes = words // 200
        return max(1, minutes)


class Comment(models.Model):
    """Comment model for articles"""
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username} on {self.article.title}"
```

### Field Types Reference

```python
from django.db import models

class FieldExamples(models.Model):
    # String fields
    char_field = models.CharField(max_length=100)
    text_field = models.TextField()
    slug_field = models.SlugField(max_length=100, unique=True)
    email_field = models.EmailField()
    url_field = models.URLField()

    # Numeric fields
    integer_field = models.IntegerField()
    positive_int = models.PositiveIntegerField()
    float_field = models.FloatField()
    decimal_field = models.DecimalField(max_digits=10, decimal_places=2)

    # Boolean fields
    bool_field = models.BooleanField(default=False)
    null_bool = models.BooleanField(null=True)

    # Date and time fields
    date_field = models.DateField()
    datetime_field = models.DateTimeField()
    time_field = models.TimeField()
    duration_field = models.DurationField()
    auto_now_add = models.DateTimeField(auto_now_add=True)  # Set on create
    auto_now = models.DateTimeField(auto_now=True)  # Set on every save

    # File fields
    file_field = models.FileField(upload_to='files/')
    image_field = models.ImageField(upload_to='images/')

    # Other fields
    uuid_field = models.UUIDField()
    ip_field = models.GenericIPAddressField()
    json_field = models.JSONField(default=dict)
```

## Database Migrations

Migrations are Django's way of propagating changes you make to your models into your database schema.

### Migration Commands

```bash
# Create migrations for model changes
python manage.py makemigrations

# Create migrations for a specific app
python manage.py makemigrations blog

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Show SQL for a migration
python manage.py sqlmigrate blog 0001

# Reverse migrations
python manage.py migrate blog 0001  # Go back to migration 0001

# Create an empty migration for custom operations
python manage.py makemigrations blog --empty --name custom_migration
```

### Custom Migration Operations

```python
# blog/migrations/0002_populate_categories.py
from django.db import migrations

def create_default_categories(apps, schema_editor):
    Category = apps.get_model('blog', 'Category')
    categories = [
        {'name': 'Technology', 'slug': 'technology'},
        {'name': 'Science', 'slug': 'science'},
        {'name': 'Programming', 'slug': 'programming'},
    ]
    for cat_data in categories:
        Category.objects.create(**cat_data)

def reverse_categories(apps, schema_editor):
    Category = apps.get_model('blog', 'Category')
    Category.objects.filter(slug__in=['technology', 'science', 'programming']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('blog', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_categories, reverse_categories),
    ]
```

## ORM Queries

Django's ORM provides a powerful and intuitive way to query your database.

### Basic CRUD Operations

```python
from blog.models import Article, Category, Tag
from django.contrib.auth.models import User

# CREATE
# Method 1: create() - creates and saves in one step
article = Article.objects.create(
    title="Django Tutorial",
    slug="django-tutorial",
    author=User.objects.get(username='admin'),
    content="This is a comprehensive Django tutorial...",
    status='published'
)

# Method 2: instantiate and save
article = Article(
    title="Another Article",
    slug="another-article",
    author=user,
    content="Content here..."
)
article.save()

# READ
# Get all objects
all_articles = Article.objects.all()

# Get single object (raises DoesNotExist if not found)
article = Article.objects.get(id=1)
article = Article.objects.get(slug='django-tutorial')

# Get or create
category, created = Category.objects.get_or_create(
    name='Python',
    defaults={'slug': 'python', 'description': 'Python articles'}
)

# First/last
first_article = Article.objects.first()
last_article = Article.objects.last()

# UPDATE
# Single object
article = Article.objects.get(id=1)
article.title = "Updated Title"
article.save()

# Update specific fields only
article.save(update_fields=['title', 'updated_at'])

# Bulk update
Article.objects.filter(status='draft').update(status='published')

# DELETE
# Single object
article = Article.objects.get(id=1)
article.delete()

# Bulk delete
Article.objects.filter(status='archived').delete()
```

### Filtering and Lookups

```python
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta

# Basic filtering
published = Article.objects.filter(status='published')
drafts = Article.objects.exclude(status='published')

# Field lookups
articles = Article.objects.filter(
    title__icontains='django',      # Case-insensitive contains
    title__startswith='How',        # Starts with
    title__endswith='?',            # Ends with
    views__gte=100,                 # Greater than or equal
    views__lte=1000,                # Less than or equal
    views__range=(100, 1000),       # Range
    created_at__year=2026,          # Year lookup
    created_at__month=1,            # Month lookup
    published_at__isnull=False,     # Not null
    category__name='Technology',    # Related field lookup
    tags__name__in=['Python', 'Django'],  # In list
)

# Date-based filtering
last_week = timezone.now() - timedelta(days=7)
recent_articles = Article.objects.filter(created_at__gte=last_week)

# Complex queries with Q objects
# OR condition
articles = Article.objects.filter(
    Q(status='published') | Q(author=current_user)
)

# AND condition
articles = Article.objects.filter(
    Q(status='published') & Q(category__name='Technology')
)

# NOT condition
articles = Article.objects.filter(~Q(status='archived'))

# Complex combinations
articles = Article.objects.filter(
    Q(status='published') &
    (Q(category__name='Technology') | Q(category__name='Science')) &
    ~Q(author__username='spam')
)
```

### Ordering, Limiting, and Aggregation

```python
from django.db.models import Count, Avg, Sum, Max, Min, F
from django.db.models.functions import Lower, Coalesce

# Ordering
articles = Article.objects.order_by('-created_at')  # Descending
articles = Article.objects.order_by('title', '-views')  # Multiple fields
articles = Article.objects.order_by(Lower('title'))  # Case-insensitive

# Slicing (LIMIT/OFFSET)
first_10 = Article.objects.all()[:10]
next_10 = Article.objects.all()[10:20]
single = Article.objects.all()[0]  # Single object

# Distinct
unique_authors = Article.objects.values('author').distinct()

# Count
total = Article.objects.count()
published_count = Article.objects.filter(status='published').count()

# Aggregation
from django.db.models import Count, Avg, Sum, Max, Min

stats = Article.objects.aggregate(
    total_articles=Count('id'),
    avg_views=Avg('views'),
    max_views=Max('views'),
    min_views=Min('views'),
    total_views=Sum('views')
)
# Returns: {'total_articles': 100, 'avg_views': 150.5, ...}

# Annotation (add calculated fields to each object)
articles = Article.objects.annotate(
    comment_count=Count('comments'),
    approved_comments=Count('comments', filter=Q(comments__is_approved=True))
)
for article in articles:
    print(f"{article.title}: {article.comment_count} comments")

# F expressions (reference field values)
# Increment views without race conditions
Article.objects.filter(id=1).update(views=F('views') + 1)

# Compare fields
# Articles where views exceed a threshold relative to days published
from django.db.models.functions import Now, Extract
articles = Article.objects.annotate(
    days_old=Extract(Now() - F('published_at'), 'day')
).filter(views__gt=F('days_old') * 10)
```

### Query Optimization

```python
# select_related - for ForeignKey and OneToOne (SQL JOIN)
# Reduces queries from N+1 to 1
articles = Article.objects.select_related('author', 'category').all()

# prefetch_related - for ManyToMany and reverse ForeignKey
# Uses separate queries but caches results
articles = Article.objects.prefetch_related('tags', 'comments').all()

# Combine both
articles = Article.objects.select_related(
    'author', 'category'
).prefetch_related(
    'tags', 'comments', 'comments__author'
).filter(status='published')

# Prefetch with custom queryset
from django.db.models import Prefetch

articles = Article.objects.prefetch_related(
    Prefetch(
        'comments',
        queryset=Comment.objects.filter(is_approved=True).select_related('author'),
        to_attr='approved_comments'
    )
)

# only() - load only specified fields
articles = Article.objects.only('title', 'slug', 'created_at')

# defer() - exclude specified fields
articles = Article.objects.defer('content')  # Don't load heavy content field

# values() and values_list() for simple data
titles = Article.objects.values_list('title', flat=True)
data = Article.objects.values('id', 'title', 'author__username')

# exists() - check if any records exist
if Article.objects.filter(status='published').exists():
    print("There are published articles")

# iterator() - for large querysets (doesn't cache)
for article in Article.objects.iterator(chunk_size=1000):
    process_article(article)
```

## Views

Django supports both function-based views (FBVs) and class-based views (CBVs).

### Function-Based Views

```python
# blog/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Article, Category
from .forms import ArticleForm, CommentForm

def article_list(request):
    """List all published articles with search and filtering"""
    articles = Article.objects.filter(
        status='published'
    ).select_related('author', 'category')

    # Search functionality
    query = request.GET.get('q')
    if query:
        articles = articles.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(excerpt__icontains=query)
        )

    # Category filter
    category_slug = request.GET.get('category')
    if category_slug:
        articles = articles.filter(category__slug=category_slug)

    # Pagination
    paginator = Paginator(articles, 10)  # 10 articles per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    context = {
        'page_obj': page_obj,
        'categories': Category.objects.all(),
        'query': query,
    }
    return render(request, 'blog/article_list.html', context)


def article_detail(request, slug):
    """Display a single article"""
    article = get_object_or_404(
        Article.objects.select_related('author', 'category').prefetch_related('tags', 'comments__author'),
        slug=slug,
        status='published'
    )

    # Increment view count
    Article.objects.filter(pk=article.pk).update(views=F('views') + 1)

    context = {
        'article': article,
        'comment_form': CommentForm(),
    }
    return render(request, 'blog/article_detail.html', context)


@login_required
def article_create(request):
    """Create a new article"""
    if request.method == 'POST':
        form = ArticleForm(request.POST)
        if form.is_valid():
            article = form.save(commit=False)
            article.author = request.user
            article.save()
            form.save_m2m()  # Save many-to-many relationships
            messages.success(request, 'Article created successfully!')
            return redirect('article_detail', slug=article.slug)
    else:
        form = ArticleForm()

    return render(request, 'blog/article_form.html', {'form': form})


@login_required
def article_update(request, slug):
    """Update an existing article"""
    article = get_object_or_404(Article, slug=slug, author=request.user)

    if request.method == 'POST':
        form = ArticleForm(request.POST, instance=article)
        if form.is_valid():
            form.save()
            messages.success(request, 'Article updated successfully!')
            return redirect('article_detail', slug=article.slug)
    else:
        form = ArticleForm(instance=article)

    return render(request, 'blog/article_form.html', {'form': form, 'article': article})


@login_required
def article_delete(request, slug):
    """Delete an article"""
    article = get_object_or_404(Article, slug=slug, author=request.user)

    if request.method == 'POST':
        article.delete()
        messages.success(request, 'Article deleted successfully!')
        return redirect('article_list')

    return render(request, 'blog/article_confirm_delete.html', {'article': article})


@login_required
def add_comment(request, slug):
    """Add a comment to an article"""
    article = get_object_or_404(Article, slug=slug, status='published')

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.article = article
            comment.author = request.user
            comment.save()
            messages.success(request, 'Comment added successfully!')

    return redirect('article_detail', slug=slug)
```

### Class-Based Views

```python
# blog/views.py
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView
)
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.db.models import F
from .models import Article, Category
from .forms import ArticleForm

class ArticleListView(ListView):
    """List view for articles"""
    model = Article
    template_name = 'blog/article_list.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        queryset = Article.objects.filter(
            status='published'
        ).select_related('author', 'category')

        # Search
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query)
            )

        # Category filter
        category = self.request.GET.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        context['query'] = self.request.GET.get('q', '')
        return context


class ArticleDetailView(DetailView):
    """Detail view for a single article"""
    model = Article
    template_name = 'blog/article_detail.html'
    context_object_name = 'article'

    def get_queryset(self):
        return Article.objects.filter(
            status='published'
        ).select_related('author', 'category').prefetch_related('tags', 'comments__author')

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        # Increment view count
        Article.objects.filter(pk=obj.pk).update(views=F('views') + 1)
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['comment_form'] = CommentForm()
        context['related_articles'] = Article.objects.filter(
            category=self.object.category,
            status='published'
        ).exclude(pk=self.object.pk)[:5]
        return context


class ArticleCreateView(LoginRequiredMixin, CreateView):
    """Create view for articles"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'
    success_url = reverse_lazy('article_list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        messages.success(self.request, 'Article created successfully!')
        return super().form_valid(form)


class ArticleUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """Update view for articles"""
    model = Article
    form_class = ArticleForm
    template_name = 'blog/article_form.html'

    def test_func(self):
        article = self.get_object()
        return self.request.user == article.author or self.request.user.is_staff

    def form_valid(self, form):
        messages.success(self.request, 'Article updated successfully!')
        return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('article_detail', kwargs={'slug': self.object.slug})


class ArticleDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """Delete view for articles"""
    model = Article
    template_name = 'blog/article_confirm_delete.html'
    success_url = reverse_lazy('article_list')

    def test_func(self):
        article = self.get_object()
        return self.request.user == article.author or self.request.user.is_staff

    def delete(self, request, *args, **kwargs):
        messages.success(request, 'Article deleted successfully!')
        return super().delete(request, *args, **kwargs)


class CategoryArticleListView(ListView):
    """List articles in a specific category"""
    model = Article
    template_name = 'blog/category_articles.html'
    context_object_name = 'articles'
    paginate_by = 10

    def get_queryset(self):
        self.category = get_object_or_404(Category, slug=self.kwargs['slug'])
        return Article.objects.filter(
            category=self.category,
            status='published'
        ).select_related('author')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['category'] = self.category
        return context
```

### URL Configuration

```python
# blog/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Function-based views
    path('', views.article_list, name='article_list'),
    path('article/<slug:slug>/', views.article_detail, name='article_detail'),
    path('create/', views.article_create, name='article_create'),
    path('article/<slug:slug>/edit/', views.article_update, name='article_update'),
    path('article/<slug:slug>/delete/', views.article_delete, name='article_delete'),
    path('article/<slug:slug>/comment/', views.add_comment, name='add_comment'),

    # Or using class-based views
    # path('', views.ArticleListView.as_view(), name='article_list'),
    # path('article/<slug:slug>/', views.ArticleDetailView.as_view(), name='article_detail'),
    # path('create/', views.ArticleCreateView.as_view(), name='article_create'),
    # path('article/<slug:slug>/edit/', views.ArticleUpdateView.as_view(), name='article_update'),
    # path('article/<slug:slug>/delete/', views.ArticleDeleteView.as_view(), name='article_delete'),

    path('category/<slug:slug>/', views.CategoryArticleListView.as_view(), name='category_articles'),
]

# myproject/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
]
```

## Templates

Django's template language is designed to strike a balance between power and ease, providing a way to generate HTML dynamically.

### Base Template

```html
<!-- templates/base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}My Blog{% endblock %}</title>
    {% load static %}
    <link rel="stylesheet" href="{% static 'css/style.css' %}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    <header>
        <nav>
            <a href="{% url 'article_list' %}">Home</a>
            {% if user.is_authenticated %}
                <a href="{% url 'article_create' %}">New Article</a>
                <span>Welcome, {{ user.username }}</span>
                <a href="{% url 'logout' %}">Logout</a>
            {% else %}
                <a href="{% url 'login' %}">Login</a>
                <a href="{% url 'register' %}">Register</a>
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
        <p>&copy; 2026 My Blog. All rights reserved.</p>
    </footer>

    {% block extra_js %}{% endblock %}
</body>
</html>
```

### Article List Template

```html
<!-- templates/blog/article_list.html -->
{% extends 'base.html' %}
{% load static %}

{% block title %}Articles - My Blog{% endblock %}

{% block content %}
<div class="article-list">
    <h1>Articles</h1>

    <!-- Search form -->
    <form method="get" class="search-form">
        <input type="text" name="q" value="{{ query }}" placeholder="Search articles...">
        <button type="submit">Search</button>
    </form>

    <!-- Category filter -->
    <div class="categories">
        <a href="{% url 'article_list' %}" class="{% if not request.GET.category %}active{% endif %}">All</a>
        {% for category in categories %}
        <a href="?category={{ category.slug }}"
           class="{% if request.GET.category == category.slug %}active{% endif %}">
            {{ category.name }}
        </a>
        {% endfor %}
    </div>

    <!-- Articles -->
    {% for article in page_obj %}
    <article class="article-card">
        <h2><a href="{% url 'article_detail' slug=article.slug %}">{{ article.title }}</a></h2>
        <div class="meta">
            <span class="author">By {{ article.author.username }}</span>
            <span class="date">{{ article.published_at|date:"F d, Y" }}</span>
            {% if article.category %}
            <span class="category">{{ article.category.name }}</span>
            {% endif %}
        </div>
        <p class="excerpt">
            {% if article.excerpt %}
                {{ article.excerpt }}
            {% else %}
                {{ article.content|truncatewords:30 }}
            {% endif %}
        </p>
        <a href="{% url 'article_detail' slug=article.slug %}" class="read-more">Read more</a>
    </article>
    {% empty %}
    <p>No articles found.</p>
    {% endfor %}

    <!-- Pagination -->
    {% if page_obj.has_other_pages %}
    <nav class="pagination">
        {% if page_obj.has_previous %}
            <a href="?page=1">&laquo; First</a>
            <a href="?page={{ page_obj.previous_page_number }}">Previous</a>
        {% endif %}

        <span class="current">
            Page {{ page_obj.number }} of {{ page_obj.paginator.num_pages }}
        </span>

        {% if page_obj.has_next %}
            <a href="?page={{ page_obj.next_page_number }}">Next</a>
            <a href="?page={{ page_obj.paginator.num_pages }}">Last &raquo;</a>
        {% endif %}
    </nav>
    {% endif %}
</div>
{% endblock %}
```

### Article Detail Template

```html
<!-- templates/blog/article_detail.html -->
{% extends 'base.html' %}
{% load static %}

{% block title %}{{ article.title }} - My Blog{% endblock %}

{% block content %}
<article class="article-detail">
    <header>
        <h1>{{ article.title }}</h1>
        <div class="meta">
            <span class="author">By {{ article.author.username }}</span>
            <span class="date">{{ article.published_at|date:"F d, Y" }}</span>
            <span class="reading-time">{{ article.reading_time }} min read</span>
            <span class="views">{{ article.views }} views</span>
        </div>

        {% if article.tags.exists %}
        <div class="tags">
            {% for tag in article.tags.all %}
            <span class="tag">{{ tag.name }}</span>
            {% endfor %}
        </div>
        {% endif %}
    </header>

    <div class="content">
        {{ article.content|linebreaks }}
    </div>

    {% if user == article.author or user.is_staff %}
    <div class="article-actions">
        <a href="{% url 'article_update' slug=article.slug %}">Edit</a>
        <a href="{% url 'article_delete' slug=article.slug %}">Delete</a>
    </div>
    {% endif %}

    <!-- Comments section -->
    <section class="comments">
        <h2>Comments ({{ article.comments.count }})</h2>

        {% if user.is_authenticated %}
        <form method="post" action="{% url 'add_comment' slug=article.slug %}">
            {% csrf_token %}
            {{ comment_form.as_p }}
            <button type="submit">Post Comment</button>
        </form>
        {% else %}
        <p><a href="{% url 'login' %}">Login</a> to post a comment.</p>
        {% endif %}

        <div class="comment-list">
            {% for comment in article.comments.all %}
                {% if comment.is_approved or comment.author == user or user.is_staff %}
                <div class="comment">
                    <div class="comment-header">
                        <strong>{{ comment.author.username }}</strong>
                        <span class="date">{{ comment.created_at|timesince }} ago</span>
                        {% if not comment.is_approved %}
                        <span class="pending">(Pending approval)</span>
                        {% endif %}
                    </div>
                    <p>{{ comment.content }}</p>
                </div>
                {% endif %}
            {% empty %}
            <p>No comments yet. Be the first to comment!</p>
            {% endfor %}
        </div>
    </section>
</article>
{% endblock %}
```

### Template Tags and Filters

```html
<!-- Common template tags and filters -->

<!-- Variables -->
{{ variable }}
{{ object.attribute }}
{{ dictionary.key }}
{{ list.0 }}

<!-- Filters -->
{{ text|lower }}
{{ text|upper }}
{{ text|title }}
{{ text|truncatewords:30 }}
{{ text|truncatechars:100 }}
{{ text|linebreaks }}
{{ text|linebreaksbr }}
{{ text|safe }}
{{ number|floatformat:2 }}
{{ date|date:"Y-m-d" }}
{{ datetime|timesince }}
{{ list|length }}
{{ list|join:", " }}
{{ value|default:"N/A" }}
{{ html|striptags }}
{{ text|slugify }}
{{ number|add:5 }}
{{ price|floatformat:2 }}

<!-- Conditionals -->
{% if condition %}
    Content
{% elif other_condition %}
    Other content
{% else %}
    Default content
{% endif %}

{% if user.is_authenticated and user.is_staff %}
    Admin content
{% endif %}

{% if items %}
    Has items
{% endif %}

<!-- Loops -->
{% for item in items %}
    {{ forloop.counter }}      <!-- 1, 2, 3, ... -->
    {{ forloop.counter0 }}     <!-- 0, 1, 2, ... -->
    {{ forloop.first }}        <!-- True on first iteration -->
    {{ forloop.last }}         <!-- True on last iteration -->
    {{ forloop.revcounter }}   <!-- Reverse counter -->
    {{ item }}
{% empty %}
    No items found.
{% endfor %}

<!-- URL tag -->
{% url 'view_name' %}
{% url 'view_name' arg1 arg2 %}
{% url 'view_name' slug=article.slug %}

<!-- Static files -->
{% load static %}
<img src="{% static 'images/logo.png' %}" alt="Logo">
<link rel="stylesheet" href="{% static 'css/style.css' %}">

<!-- Include templates -->
{% include 'partials/sidebar.html' %}
{% include 'partials/card.html' with item=article %}

<!-- With tag (create local variables) -->
{% with total=items|length %}
    Total: {{ total }}
{% endwith %}

<!-- CSRF token (required in forms) -->
<form method="post">
    {% csrf_token %}
    ...
</form>

<!-- Block and extends -->
{% extends 'base.html' %}
{% block content %}
    Content here
{% endblock %}
```

### Custom Template Tags and Filters

```python
# blog/templatetags/blog_tags.py
from django import template
from django.utils.safestring import mark_safe
from blog.models import Article, Category
import markdown

register = template.Library()

# Simple filter
@register.filter
def reading_time(text):
    """Calculate reading time in minutes"""
    words = len(text.split())
    minutes = words // 200
    return f"{minutes} min read" if minutes > 0 else "< 1 min read"

# Filter with argument
@register.filter
def truncate_smart(text, length=100):
    """Truncate text at word boundary"""
    if len(text) <= length:
        return text
    return text[:length].rsplit(' ', 1)[0] + '...'

# Simple tag
@register.simple_tag
def get_popular_articles(count=5):
    """Get most viewed articles"""
    return Article.objects.filter(
        status='published'
    ).order_by('-views')[:count]

# Simple tag with context
@register.simple_tag(takes_context=True)
def get_user_articles(context, count=5):
    """Get articles by current user"""
    user = context['request'].user
    if user.is_authenticated:
        return Article.objects.filter(author=user)[:count]
    return Article.objects.none()

# Inclusion tag
@register.inclusion_tag('blog/partials/category_list.html')
def show_categories():
    """Display all categories with article counts"""
    categories = Category.objects.all()
    return {'categories': categories}

# Inclusion tag with arguments
@register.inclusion_tag('blog/partials/article_card.html')
def article_card(article, show_excerpt=True):
    """Display an article card"""
    return {
        'article': article,
        'show_excerpt': show_excerpt,
    }

# Markdown filter
@register.filter
def markdown_format(text):
    """Convert markdown to HTML"""
    return mark_safe(markdown.markdown(text, extensions=['fenced_code', 'tables']))
```

Usage in templates:

```html
{% load blog_tags %}

<!-- Filters -->
{{ article.content|reading_time }}
{{ article.content|truncate_smart:150 }}
{{ article.content|markdown_format }}

<!-- Simple tags -->
{% get_popular_articles 10 as popular %}
{% for article in popular %}
    {{ article.title }}
{% endfor %}

<!-- Inclusion tags -->
{% show_categories %}
{% article_card article show_excerpt=True %}
```

## Forms

Django provides powerful form handling capabilities for validation, rendering, and processing user input.

### Form Classes

```python
# blog/forms.py
from django import forms
from django.core.exceptions import ValidationError
from .models import Article, Comment, Category

class ArticleForm(forms.ModelForm):
    """Form for creating and editing articles"""

    class Meta:
        model = Article
        fields = ['title', 'content', 'excerpt', 'category', 'tags', 'status', 'featured']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter article title'
            }),
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 15,
                'placeholder': 'Write your article content here...'
            }),
            'excerpt': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Brief summary of the article'
            }),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'tags': forms.CheckboxSelectMultiple(),
            'status': forms.Select(attrs={'class': 'form-control'}),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if len(title) < 5:
            raise ValidationError('Title must be at least 5 characters long.')
        return title

    def clean(self):
        cleaned_data = super().clean()
        status = cleaned_data.get('status')
        content = cleaned_data.get('content')

        if status == 'published' and len(content) < 100:
            raise ValidationError(
                'Published articles must have at least 100 characters of content.'
            )

        return cleaned_data


class CommentForm(forms.ModelForm):
    """Form for adding comments"""

    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Write your comment...'
            }),
        }

    def clean_content(self):
        content = self.cleaned_data.get('content')
        if len(content) < 10:
            raise ValidationError('Comment must be at least 10 characters long.')
        return content


class ContactForm(forms.Form):
    """Non-model form for contact page"""
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control'})
    )
    subject = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 5})
    )

    def clean_message(self):
        message = self.cleaned_data.get('message')
        if len(message) < 20:
            raise ValidationError('Message must be at least 20 characters long.')
        return message


class SearchForm(forms.Form):
    """Form for search functionality"""
    query = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Search...'
        })
    )
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        required=False,
        empty_label='All Categories',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
```

### Form Rendering in Templates

```html
<!-- templates/blog/article_form.html -->
{% extends 'base.html' %}

{% block title %}{% if article %}Edit{% else %}New{% endif %} Article{% endblock %}

{% block content %}
<div class="form-container">
    <h1>{% if article %}Edit Article{% else %}Create New Article{% endif %}</h1>

    <form method="post" enctype="multipart/form-data">
        {% csrf_token %}

        <!-- Display all errors at the top -->
        {% if form.errors %}
        <div class="alert alert-danger">
            <ul>
            {% for field in form %}
                {% for error in field.errors %}
                <li><strong>{{ field.label }}:</strong> {{ error }}</li>
                {% endfor %}
            {% endfor %}
            {% for error in form.non_field_errors %}
                <li>{{ error }}</li>
            {% endfor %}
            </ul>
        </div>
        {% endif %}

        <!-- Render fields individually for more control -->
        <div class="form-group">
            <label for="{{ form.title.id_for_label }}">Title</label>
            {{ form.title }}
            {% if form.title.errors %}
            <div class="error">{{ form.title.errors }}</div>
            {% endif %}
            {% if form.title.help_text %}
            <small class="help-text">{{ form.title.help_text }}</small>
            {% endif %}
        </div>

        <div class="form-group">
            <label for="{{ form.category.id_for_label }}">Category</label>
            {{ form.category }}
        </div>

        <div class="form-group">
            <label for="{{ form.content.id_for_label }}">Content</label>
            {{ form.content }}
        </div>

        <div class="form-group">
            <label for="{{ form.excerpt.id_for_label }}">Excerpt</label>
            {{ form.excerpt }}
        </div>

        <div class="form-group">
            <label>Tags</label>
            {{ form.tags }}
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="{{ form.status.id_for_label }}">Status</label>
                {{ form.status }}
            </div>

            <div class="form-group">
                <label>
                    {{ form.featured }} Featured Article
                </label>
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" class="btn btn-primary">
                {% if article %}Update{% else %}Create{% endif %} Article
            </button>
            <a href="{% url 'article_list' %}" class="btn btn-secondary">Cancel</a>
        </div>
    </form>
</div>
{% endblock %}
```

## Authentication

Django provides a complete authentication system out of the box.

### Built-in Authentication Views

```python
# myproject/urls.py
from django.contrib.auth import views as auth_views

urlpatterns = [
    # Login/Logout
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),

    # Password change
    path('password-change/', auth_views.PasswordChangeView.as_view(
        template_name='accounts/password_change.html',
        success_url='/password-change/done/'
    ), name='password_change'),
    path('password-change/done/', auth_views.PasswordChangeDoneView.as_view(
        template_name='accounts/password_change_done.html'
    ), name='password_change_done'),

    # Password reset
    path('password-reset/', auth_views.PasswordResetView.as_view(
        template_name='accounts/password_reset.html',
        email_template_name='accounts/password_reset_email.html',
        success_url='/password-reset/done/'
    ), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='accounts/password_reset_done.html'
    ), name='password_reset_done'),
    path('password-reset/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='accounts/password_reset_confirm.html',
        success_url='/password-reset/complete/'
    ), name='password_reset_confirm'),
    path('password-reset/complete/', auth_views.PasswordResetCompleteView.as_view(
        template_name='accounts/password_reset_complete.html'
    ), name='password_reset_complete'),
]

# Settings
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'article_list'
LOGOUT_REDIRECT_URL = 'article_list'
```

### Custom User Registration

```python
# accounts/forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class RegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email is already registered.')
        return email


# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib import messages
from .forms import RegistrationForm

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('article_list')
    else:
        form = RegistrationForm()

    return render(request, 'accounts/register.html', {'form': form})
```

### Login Template

```html
<!-- templates/accounts/login.html -->
{% extends 'base.html' %}

{% block title %}Login{% endblock %}

{% block content %}
<div class="auth-form">
    <h1>Login</h1>

    <form method="post">
        {% csrf_token %}

        {% if form.errors %}
        <div class="alert alert-danger">
            Invalid username or password.
        </div>
        {% endif %}

        <div class="form-group">
            <label for="id_username">Username</label>
            {{ form.username }}
        </div>

        <div class="form-group">
            <label for="id_password">Password</label>
            {{ form.password }}
        </div>

        <button type="submit" class="btn btn-primary">Login</button>
    </form>

    <p class="mt-3">
        <a href="{% url 'password_reset' %}">Forgot your password?</a>
    </p>
    <p>
        Don't have an account? <a href="{% url 'register' %}">Register here</a>
    </p>
</div>
{% endblock %}
```

### Protecting Views

```python
from django.contrib.auth.decorators import login_required, permission_required
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

# Function-based views
@login_required
def my_view(request):
    pass

@login_required(login_url='/custom-login/')
def another_view(request):
    pass

@permission_required('blog.add_article', raise_exception=True)
def create_article(request):
    pass

# Class-based views
class MyView(LoginRequiredMixin, View):
    login_url = '/login/'
    redirect_field_name = 'next'

class CreateArticleView(PermissionRequiredMixin, CreateView):
    permission_required = 'blog.add_article'
```

## Django Admin

Django's automatic admin interface is one of its most celebrated features. It reads metadata from your models to provide a powerful and production-ready interface.

### Basic Admin Configuration

```python
# blog/admin.py
from django.contrib import admin
from django.utils import timezone
from .models import Article, Category, Comment, Tag

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'article_count', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'description']

    def article_count(self, obj):
        return obj.articles.count()
    article_count.short_description = 'Articles'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ['author', 'content', 'is_approved', 'created_at']
    readonly_fields = ['created_at']
    can_delete = True


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'published_at', 'views', 'comment_count']
    list_filter = ['status', 'category', 'created_at', 'author']
    search_fields = ['title', 'content', 'author__username']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    filter_horizontal = ['tags']  # For ManyToMany fields
    raw_id_fields = ['author']  # For ForeignKey with many options
    readonly_fields = ['views', 'created_at', 'updated_at']
    inlines = [CommentInline]

    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'content', 'excerpt')
        }),
        ('Categorization', {
            'fields': ('author', 'category', 'tags')
        }),
        ('Publishing', {
            'fields': ('status', 'published_at', 'featured')
        }),
        ('Statistics', {
            'fields': ('views', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def comment_count(self, obj):
        return obj.comments.count()
    comment_count.short_description = 'Comments'

    # Custom actions
    actions = ['make_published', 'make_draft', 'mark_featured']

    @admin.action(description='Mark selected articles as published')
    def make_published(self, request, queryset):
        updated = queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{updated} articles marked as published.')

    @admin.action(description='Mark selected articles as draft')
    def make_draft(self, request, queryset):
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} articles marked as draft.')

    @admin.action(description='Mark selected articles as featured')
    def mark_featured(self, request, queryset):
        updated = queryset.update(featured=True)
        self.message_user(request, f'{updated} articles marked as featured.')

    # Override queryset for non-superusers
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(author=request.user)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['article', 'author', 'created_at', 'is_approved']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['content', 'author__username', 'article__title']
    actions = ['approve_comments', 'disapprove_comments']

    @admin.action(description='Approve selected comments')
    def approve_comments(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f'{updated} comments approved.')

    @admin.action(description='Disapprove selected comments')
    def disapprove_comments(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f'{updated} comments disapproved.')


# Customize admin site
admin.site.site_header = "My Blog Administration"
admin.site.site_title = "My Blog Admin"
admin.site.index_title = "Welcome to My Blog Administration"
```

## Django REST Framework

Django REST Framework (DRF) is a powerful toolkit for building Web APIs in Django.

### Installation and Setup

```bash
pip install djangorestframework
pip install django-filter
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'django_filters',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}
```

### Serializers

```python
# blog/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Article, Category, Comment, Tag

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    article_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'article_count']

    def get_article_count(self, obj):
        return obj.articles.filter(status='published').count()


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'article', 'author', 'content', 'created_at', 'is_approved']
        read_only_fields = ['id', 'created_at', 'is_approved']


class ArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    author_name = serializers.CharField(source='author.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'author_name',
            'category_name', 'status', 'published_at', 'views', 'comment_count'
        ]

    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    comments = CommentSerializer(many=True, read_only=True)
    reading_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'content', 'excerpt', 'author',
            'category', 'category_id', 'tags', 'tag_ids', 'status',
            'created_at', 'updated_at', 'published_at', 'views',
            'featured', 'comments', 'reading_time'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'views']

    def validate_title(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long.")
        return value

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        article = Article.objects.create(**validated_data)
        if tag_ids:
            article.tags.set(tag_ids)
        return article

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance
```

### ViewSets

```python
# blog/api_views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F
from .models import Article, Category, Comment, Tag
from .serializers import (
    ArticleListSerializer, ArticleDetailSerializer,
    CategorySerializer, CommentSerializer, TagSerializer
)
from .permissions import IsAuthorOrReadOnly

class ArticleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Article model.
    Provides CRUD operations and custom actions.
    """
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'author', 'featured']
    search_fields = ['title', 'content', 'excerpt']
    ordering_fields = ['created_at', 'published_at', 'views', 'title']
    ordering = ['-created_at']
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Article.objects.select_related(
            'author', 'category'
        ).prefetch_related('tags', 'comments')

        # Only show published articles to non-authenticated users
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status='published')
        elif not self.request.user.is_staff:
            # Non-staff users see published articles and their own
            from django.db.models import Q
            queryset = queryset.filter(
                Q(status='published') | Q(author=self.request.user)
            )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        return ArticleDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        Article.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        """Publish an article"""
        article = self.get_object()
        if article.author != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        article.status = 'published'
        article.save()
        return Response({'status': 'published'})

    @action(detail=True, methods=['get'])
    def comments(self, request, slug=None):
        """Get all comments for an article"""
        article = self.get_object()
        comments = article.comments.filter(is_approved=True)
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured articles"""
        articles = self.get_queryset().filter(
            status='published',
            featured=True
        )[:5]
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most viewed articles"""
        articles = self.get_queryset().filter(
            status='published'
        ).order_by('-views')[:10]
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_articles(self, request):
        """Get current user's articles"""
        articles = Article.objects.filter(author=request.user)
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only ViewSet for categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    @action(detail=True, methods=['get'])
    def articles(self, request, slug=None):
        """Get all published articles in this category"""
        category = self.get_object()
        articles = category.articles.filter(status='published')
        serializer = ArticleListSerializer(articles, many=True)
        return Response(serializer.data)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only ViewSet for tags"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comments"""
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Comment.objects.select_related('author', 'article')

        # Filter by article
        article_slug = self.request.query_params.get('article')
        if article_slug:
            queryset = queryset.filter(article__slug=article_slug)

        # Only show approved comments to non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_approved=True)

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
```

### Custom Permissions

```python
# blog/permissions.py
from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    """Only allow authors to edit their own articles"""

    def has_object_permission(self, request, view, obj):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for author or staff
        return obj.author == request.user or request.user.is_staff


class IsStaffOrReadOnly(permissions.BasePermission):
    """Only allow staff to modify"""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
```

### API URLs

```python
# blog/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from . import api_views

router = DefaultRouter()
router.register(r'articles', api_views.ArticleViewSet, basename='article')
router.register(r'categories', api_views.CategoryViewSet, basename='category')
router.register(r'tags', api_views.TagViewSet, basename='tag')
router.register(r'comments', api_views.CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', obtain_auth_token, name='api_token_auth'),
]

# myproject/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('blog.api_urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('', include('blog.urls')),
]
```

### Testing the API

```bash
# Get all articles
curl http://localhost:8000/api/articles/

# Get a single article
curl http://localhost:8000/api/articles/django-tutorial/

# Search articles
curl "http://localhost:8000/api/articles/?search=django"

# Filter by category
curl "http://localhost:8000/api/articles/?category=1"

# Get popular articles
curl http://localhost:8000/api/articles/popular/

# Get featured articles
curl http://localhost:8000/api/articles/featured/

# Create an article (authenticated)
curl -X POST http://localhost:8000/api/articles/ \
  -H "Authorization: Token your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Article Title",
    "content": "Article content here...",
    "excerpt": "Brief summary",
    "category_id": 1,
    "status": "draft"
  }'

# Update an article
curl -X PATCH http://localhost:8000/api/articles/new-article-title/ \
  -H "Authorization: Token your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'

# Delete an article
curl -X DELETE http://localhost:8000/api/articles/new-article-title/ \
  -H "Authorization: Token your-token-here"

# Get token
curl -X POST http://localhost:8000/api/token/ \
  -d "username=admin&password=password"
```

## Settings and Configuration

### Project Settings Structure

```python
# myproject/settings/base.py - Common settings
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'your-default-secret-key')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'django_filters',
    'blog',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

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

# Static files
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Authentication
LOGIN_URL = 'login'
LOGIN_REDIRECT_URL = 'article_list'
LOGOUT_REDIRECT_URL = 'article_list'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# myproject/settings/development.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# myproject/settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', 'redis://127.0.0.1:6379/1'),
    }
}
```

## Best Practices

### Query Optimization

```python
# Always use select_related and prefetch_related
articles = Article.objects.select_related('author', 'category').prefetch_related('tags')

# Use only() or defer() for large fields
articles = Article.objects.only('title', 'slug', 'created_at')
articles = Article.objects.defer('content')

# Use values() or values_list() for simple data
titles = Article.objects.values_list('title', flat=True)

# Use exists() instead of count() when checking existence
if Article.objects.filter(status='published').exists():
    pass

# Use bulk operations
Article.objects.bulk_create([Article(...) for _ in range(100)])
Article.objects.bulk_update(articles, ['status'])

# Use F() expressions for atomic updates
Article.objects.filter(pk=1).update(views=F('views') + 1)

# Add database indexes for frequently queried fields
class Article(models.Model):
    slug = models.SlugField(db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'published_at']),
        ]
```

### Security Best Practices

```python
# Never commit secrets - use environment variables
SECRET_KEY = os.environ.get('SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Use CSRF protection (enabled by default)
# In forms: {% csrf_token %}

# Always use parameterized queries (ORM does this)
# Never do: Article.objects.raw(f"SELECT * FROM article WHERE id = {user_input}")
# Do: Article.objects.raw("SELECT * FROM article WHERE id = %s", [user_input])

# Validate user input
from django.core.validators import validate_email

# Use permission checks
@login_required
@permission_required('blog.add_article', raise_exception=True)
def create_article(request):
    pass

# Enable security headers in production
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Set proper Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
```

### Project Organization

```
myproject/
├── manage.py
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── myproject/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── development.py
│   │   └── production.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── blog/
│   │   ├── migrations/
│   │   ├── templatetags/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── forms.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       ├── test_models.py
│   │       ├── test_views.py
│   │       └── test_api.py
│   └── accounts/
├── static/
│   ├── css/
│   ├── js/
│   └── images/
├── media/
├── templates/
│   ├── base.html
│   ├── blog/
│   └── accounts/
└── tests/
```

## Conclusion

Django is a comprehensive web framework that provides everything you need to build robust, scalable web applications. Its MTV architecture, powerful ORM, automatic admin interface, and extensive ecosystem make it an excellent choice for projects of any size.

Key takeaways:

- Django's MTV pattern separates concerns and promotes clean, maintainable code
- The ORM provides a Pythonic way to interact with databases without writing SQL
- Migrations make database schema changes trackable and reversible
- Class-based views reduce boilerplate while function-based views offer flexibility
- The admin interface saves significant development time for CRUD operations
- Django REST Framework makes building APIs straightforward and powerful
- Always follow security best practices and optimize queries for performance
- Use proper project structure and settings management for maintainability

Whether you are building a simple blog, a complex e-commerce platform, or a RESTful API, Django provides the tools and flexibility to bring your ideas to life efficiently and securely.
