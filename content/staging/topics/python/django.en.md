---
title: Django Web Framework Complete Guide
description: Master Django full-stack framework for rapid development
track: python
section: basics
difficulty: intermediate
tags:
  - Django
  - Python
  - Web Framework
  - ORM
status: imported
origin: old/src/content/docs/backend/django.en.md
divergence: 0.279
issues: []
legacy:
  category: Backend
  subcategory: Python
  order: 12
  lastUpdated: 2026-01-07
---

## Introduction

Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, it takes care of much of the hassle of web development, so you can focus on writing your app without needing to reinvent the wheel. It's free, open source, and has a thriving community of developers worldwide.

### Why Choose Django?

Django was designed to help developers take applications from concept to completion as quickly as possible. Its "batteries included" philosophy means that it comes with everything you need to build a full-featured web application out of the box.

Core advantages of Django include:

- **Rapid Development**: Django was designed to help developers build applications quickly, reducing time from concept to production
- **Security First**: Django helps developers avoid many common security mistakes by providing built-in protection against SQL injection, XSS, CSRF, and clickjacking
- **Scalability**: Some of the busiest sites on the web leverage Django's ability to quickly and flexibly scale
- **Versatility**: Django can be used to build almost any type of website, from content management systems to social networks
- **Mature Ecosystem**: With over 15 years of development, Django has a vast ecosystem of reusable apps and packages
- **Excellent Documentation**: Django is known for having one of the best documentation sets in the web framework space

### Django vs Other Frameworks

| Feature | Django | Flask | FastAPI |
|---------|--------|-------|---------|
| Architecture | Full-stack MTV | Micro-framework | API-focused |
| ORM | Built-in | SQLAlchemy (ext) | SQLAlchemy (ext) |
| Admin Panel | Built-in | Flask-Admin (ext) | None |
| Authentication | Built-in | Flask-Login (ext) | Custom |
| Learning Curve | Moderate | Easy | Easy |
| Best For | Full applications | Small/Medium apps | APIs |

## MTV Architecture Pattern

### Understanding MTV

Django follows the Model-Template-View (MTV) architectural pattern, which is Django's interpretation of the classic Model-View-Controller (MVC) pattern:

- **Model**: Defines the data structure, handles database interactions, and contains business logic related to data
- **Template**: Handles the presentation layer, defining how data is displayed to users
- **View**: Contains the business logic, processes requests, and returns responses

```
┌─────────────────────────────────────────────────────────────┐
│                        Django MTV Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Browser ──► URL Router ──► View ──► Model ──► Database   │
│      ▲                        │                             │
│      │                        ▼                             │
│      └──────────────────── Template                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Project Setup

First, install Django and create a new project:

```bash
# Install Django
pip install django

# Create a new project
django-admin startproject myproject

# Navigate to project directory
cd myproject

# Create an application
python manage.py startapp blog

# Run development server
python manage.py runserver
```

### Project Structure

A typical Django project structure looks like this:

```
myproject/
├── manage.py                 # Command-line utility
├── myproject/
│   ├── __init__.py
│   ├── settings.py          # Project settings
│   ├── urls.py              # URL configuration
│   ├── asgi.py              # ASGI configuration
│   └── wsgi.py              # WSGI configuration
├── blog/
│   ├── __init__.py
│   ├── admin.py             # Admin configuration
│   ├── apps.py              # App configuration
│   ├── migrations/          # Database migrations
│   ├── models.py            # Data models
│   ├── tests.py             # Tests
│   ├── urls.py              # App URL patterns
│   └── views.py             # View functions/classes
├── templates/               # HTML templates
├── static/                  # Static files
└── requirements.txt
```

### Settings Configuration

Configure your Django project in `settings.py`:

```python
# myproject/settings.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'your-secret-key')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',
    # Local apps
    'blog.apps.BlogConfig',
    'users.apps.UsersConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'myproject'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Template configuration
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
```

## Django ORM (Object-Relational Mapping)

### Defining Models

Django's ORM provides a powerful and intuitive way to define your database schema using Python classes:

```python
# blog/models.py
from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify

class Category(models.Model):
    """Blog category model"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    """Tag model for posts"""
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Post(models.Model):
    """Blog post model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique_for_date='publish_date')
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blog_posts'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='posts')
    content = models.TextField()
    excerpt = models.TextField(max_length=500, blank=True)
    featured_image = models.ImageField(
        upload_to='posts/%Y/%m/',
        blank=True,
        null=True
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    publish_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    views = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-publish_date']
        indexes = [
            models.Index(fields=['-publish_date']),
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('blog:post_detail', kwargs={
            'year': self.publish_date.year,
            'month': self.publish_date.month,
            'slug': self.slug
        })

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.excerpt:
            self.excerpt = self.content[:497] + '...'
        super().save(*args, **kwargs)


class Comment(models.Model):
    """Comment model for posts"""
    post = models.ForeignKey(
        Post,
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
    is_approved = models.BooleanField(default=True)
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
        return f'Comment by {self.author.username} on {self.post.title}'
```

### Database Migrations

Django's migration system tracks changes to your models and applies them to the database:

```bash
# Create migrations
python manage.py makemigrations

# View SQL that will be executed
python manage.py sqlmigrate blog 0001

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations
```

### QuerySet API

Django's QuerySet API provides a rich set of methods for querying the database:

```python
from blog.models import Post, Category, Tag
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta

# Basic queries
all_posts = Post.objects.all()
published_posts = Post.objects.filter(status='published')
draft_posts = Post.objects.exclude(status='published')

# Get single object
try:
    post = Post.objects.get(pk=1)
except Post.DoesNotExist:
    post = None

# Or use get_or_create
post, created = Post.objects.get_or_create(
    slug='my-post',
    defaults={'title': 'My Post', 'content': 'Content here'}
)

# Field lookups
recent_posts = Post.objects.filter(
    publish_date__gte=timezone.now() - timedelta(days=30)
)
title_contains = Post.objects.filter(title__icontains='django')
category_posts = Post.objects.filter(category__name='Python')

# Complex queries with Q objects
complex_query = Post.objects.filter(
    Q(status='published') &
    (Q(title__icontains='python') | Q(content__icontains='python'))
)

# Ordering
ordered_posts = Post.objects.order_by('-publish_date', 'title')

# Limiting results
first_five = Post.objects.all()[:5]
sixth_to_tenth = Post.objects.all()[5:10]

# Aggregation
from django.db.models import Count, Avg, Sum, Max, Min

post_count = Post.objects.count()
stats = Post.objects.aggregate(
    total_views=Sum('views'),
    avg_views=Avg('views'),
    max_views=Max('views')
)

# Annotation
categories_with_counts = Category.objects.annotate(
    post_count=Count('posts')
).filter(post_count__gt=0)

# F expressions for field references
Post.objects.filter(pk=1).update(views=F('views') + 1)

# Select related (for ForeignKey - reduces queries)
posts = Post.objects.select_related('author', 'category').all()

# Prefetch related (for ManyToMany and reverse ForeignKey)
posts = Post.objects.prefetch_related('tags', 'comments').all()

# Values and values_list
titles = Post.objects.values_list('title', flat=True)
post_data = Post.objects.values('title', 'author__username', 'publish_date')

# Raw SQL when needed
posts = Post.objects.raw('''
    SELECT * FROM blog_post
    WHERE status = %s
    ORDER BY publish_date DESC
''', ['published'])
```

### Model Managers

Create custom managers to encapsulate common query patterns:

```python
# blog/models.py
class PublishedManager(models.Manager):
    """Manager that returns only published posts"""

    def get_queryset(self):
        return super().get_queryset().filter(status='published')

    def by_category(self, category_slug):
        return self.get_queryset().filter(category__slug=category_slug)

    def popular(self, limit=10):
        return self.get_queryset().order_by('-views')[:limit]

    def recent(self, days=7):
        cutoff = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(publish_date__gte=cutoff)


class Post(models.Model):
    # ... fields ...

    objects = models.Manager()  # Default manager
    published = PublishedManager()  # Custom manager

# Usage
published_posts = Post.published.all()
python_posts = Post.published.by_category('python')
popular_posts = Post.published.popular(5)
```

## Views and URL Routing

### Function-Based Views

Function-based views (FBVs) are simple Python functions that take a request and return a response:

```python
# blog/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse, Http404
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from .models import Post, Category
from .forms import CommentForm, PostForm

def post_list(request):
    """Display list of published posts with pagination"""
    posts_list = Post.published.select_related('author', 'category')

    # Filter by category if provided
    category_slug = request.GET.get('category')
    if category_slug:
        posts_list = posts_list.filter(category__slug=category_slug)

    # Search functionality
    query = request.GET.get('q')
    if query:
        posts_list = posts_list.filter(
            Q(title__icontains=query) | Q(content__icontains=query)
        )

    # Pagination
    paginator = Paginator(posts_list, 10)  # 10 posts per page
    page = request.GET.get('page')

    try:
        posts = paginator.page(page)
    except PageNotAnInteger:
        posts = paginator.page(1)
    except EmptyPage:
        posts = paginator.page(paginator.num_pages)

    context = {
        'posts': posts,
        'categories': Category.objects.annotate(post_count=Count('posts')),
        'query': query,
    }
    return render(request, 'blog/post_list.html', context)


def post_detail(request, year, month, slug):
    """Display a single post with comments"""
    post = get_object_or_404(
        Post.published.select_related('author', 'category'),
        publish_date__year=year,
        publish_date__month=month,
        slug=slug
    )

    # Increment view count
    Post.objects.filter(pk=post.pk).update(views=F('views') + 1)

    # Get comments
    comments = post.comments.filter(
        is_approved=True,
        parent=None
    ).select_related('author')

    # Handle comment form
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.author = request.user
            comment.save()
            messages.success(request, 'Comment added successfully!')
            return redirect(post.get_absolute_url())
    else:
        form = CommentForm()

    # Related posts
    related_posts = Post.published.filter(
        category=post.category
    ).exclude(pk=post.pk)[:4]

    context = {
        'post': post,
        'comments': comments,
        'form': form,
        'related_posts': related_posts,
    }
    return render(request, 'blog/post_detail.html', context)


@login_required
@require_http_methods(['GET', 'POST'])
def post_create(request):
    """Create a new blog post"""
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            form.save_m2m()  # Save many-to-many relationships
            messages.success(request, 'Post created successfully!')
            return redirect(post.get_absolute_url())
    else:
        form = PostForm()

    return render(request, 'blog/post_form.html', {'form': form})
```

### Class-Based Views

Class-based views (CBVs) provide reusable view logic through inheritance:

```python
# blog/views.py
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView
)
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.db.models import Q, F

class PostListView(ListView):
    """List view for published posts"""
    model = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    paginate_by = 10

    def get_queryset(self):
        queryset = Post.published.select_related('author', 'category')

        # Category filter
        category = self.kwargs.get('category_slug')
        if category:
            queryset = queryset.filter(category__slug=category)

        # Search filter
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | Q(content__icontains=query)
            )

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.annotate(
            post_count=Count('posts')
        )
        context['query'] = self.request.GET.get('q', '')
        return context


class PostDetailView(DetailView):
    """Detail view for a single post"""
    model = Post
    template_name = 'blog/post_detail.html'
    context_object_name = 'post'

    def get_queryset(self):
        return Post.published.select_related('author', 'category')

    def get_object(self):
        obj = super().get_object()
        # Increment view count
        Post.objects.filter(pk=obj.pk).update(views=F('views') + 1)
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['comments'] = self.object.comments.filter(
            is_approved=True, parent=None
        )
        context['related_posts'] = Post.published.filter(
            category=self.object.category
        ).exclude(pk=self.object.pk)[:4]
        return context


class PostCreateView(LoginRequiredMixin, CreateView):
    """Create view for new posts"""
    model = Post
    form_class = PostForm
    template_name = 'blog/post_form.html'
    success_url = reverse_lazy('blog:post_list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        messages.success(self.request, 'Post created successfully!')
        return super().form_valid(form)


class PostUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """Update view for existing posts"""
    model = Post
    form_class = PostForm
    template_name = 'blog/post_form.html'

    def test_func(self):
        post = self.get_object()
        return self.request.user == post.author or self.request.user.is_staff

    def form_valid(self, form):
        messages.success(self.request, 'Post updated successfully!')
        return super().form_valid(form)


class PostDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """Delete view for posts"""
    model = Post
    template_name = 'blog/post_confirm_delete.html'
    success_url = reverse_lazy('blog:post_list')

    def test_func(self):
        post = self.get_object()
        return self.request.user == post.author or self.request.user.is_staff

    def delete(self, request, *args, **kwargs):
        messages.success(request, 'Post deleted successfully!')
        return super().delete(request, *args, **kwargs)
```

### URL Configuration

Configure URL patterns to route requests to views:

```python
# blog/urls.py
from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    path('', views.PostListView.as_view(), name='post_list'),
    path('category/<slug:category_slug>/',
         views.PostListView.as_view(), name='post_by_category'),
    path('post/<int:year>/<int:month>/<slug:slug>/',
         views.PostDetailView.as_view(), name='post_detail'),
    path('post/new/', views.PostCreateView.as_view(), name='post_create'),
    path('post/<int:pk>/edit/',
         views.PostUpdateView.as_view(), name='post_edit'),
    path('post/<int:pk>/delete/',
         views.PostDeleteView.as_view(), name='post_delete'),
    path('api/posts/', views.post_api_list, name='api_post_list'),
]

# myproject/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('blog/', include('blog.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
    path('api/', include('api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

## Templates

### Template Basics

Django's template language provides a powerful way to generate HTML dynamically:

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
            <a href="{% url 'blog:post_list' %}">Home</a>
            {% if user.is_authenticated %}
                <a href="{% url 'blog:post_create' %}">New Post</a>
                <a href="{% url 'logout' %}">Logout ({{ user.username }})</a>
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
        <p>&copy; {{ current_year }} My Blog. All rights reserved.</p>
    </footer>

    <script src="{% static 'js/main.js' %}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

```html
<!-- templates/blog/post_list.html -->
{% extends 'base.html' %}
{% load static %}

{% block title %}Blog Posts{% endblock %}

{% block content %}
<div class="container">
    <h1>Blog Posts</h1>

    <!-- Search Form -->
    <form method="get" class="search-form">
        <input type="text" name="q" value="{{ query }}" placeholder="Search posts...">
        <button type="submit">Search</button>
    </form>

    <!-- Category Filter -->
    <div class="categories">
        <a href="{% url 'blog:post_list' %}"
           class="{% if not request.GET.category %}active{% endif %}">All</a>
        {% for category in categories %}
            <a href="{% url 'blog:post_by_category' category.slug %}"
               class="{% if request.GET.category == category.slug %}active{% endif %}">
                {{ category.name }} ({{ category.post_count }})
            </a>
        {% endfor %}
    </div>

    <!-- Post List -->
    <div class="posts">
        {% for post in posts %}
            <article class="post-card">
                {% if post.featured_image %}
                    <img src="{{ post.featured_image.url }}" alt="{{ post.title }}">
                {% endif %}
                <div class="post-content">
                    <h2>
                        <a href="{{ post.get_absolute_url }}">{{ post.title }}</a>
                    </h2>
                    <div class="post-meta">
                        <span>By {{ post.author.get_full_name|default:post.author.username }}</span>
                        <span>{{ post.publish_date|date:"F d, Y" }}</span>
                        <span>{{ post.views }} views</span>
                    </div>
                    <p>{{ post.excerpt|truncatewords:30 }}</p>
                    <div class="tags">
                        {% for tag in post.tags.all %}
                            <span class="tag">{{ tag.name }}</span>
                        {% endfor %}
                    </div>
                </div>
            </article>
        {% empty %}
            <p>No posts found.</p>
        {% endfor %}
    </div>

    <!-- Pagination -->
    {% if posts.has_other_pages %}
        <nav class="pagination">
            {% if posts.has_previous %}
                <a href="?page={{ posts.previous_page_number }}{% if query %}&q={{ query }}{% endif %}">
                    Previous
                </a>
            {% endif %}

            <span>Page {{ posts.number }} of {{ posts.paginator.num_pages }}</span>

            {% if posts.has_next %}
                <a href="?page={{ posts.next_page_number }}{% if query %}&q={{ query }}{% endif %}">
                    Next
                </a>
            {% endif %}
        </nav>
    {% endif %}
</div>
{% endblock %}
```

### Custom Template Tags and Filters

Create reusable template tags and filters:

```python
# blog/templatetags/blog_tags.py
from django import template
from django.db.models import Count
from django.utils.safestring import mark_safe
import markdown

from ..models import Post, Category

register = template.Library()

@register.simple_tag
def total_posts():
    """Return total number of published posts"""
    return Post.published.count()

@register.simple_tag
def get_popular_posts(count=5):
    """Return the most viewed posts"""
    return Post.published.order_by('-views')[:count]

@register.inclusion_tag('blog/includes/category_list.html')
def show_categories():
    """Display list of categories with post counts"""
    categories = Category.objects.annotate(
        post_count=Count('posts')
    ).filter(post_count__gt=0)
    return {'categories': categories}

@register.filter(name='markdown')
def markdown_format(text):
    """Convert markdown text to HTML"""
    return mark_safe(markdown.markdown(text, extensions=['fenced_code', 'codehilite']))

@register.filter
def reading_time(text):
    """Calculate estimated reading time"""
    words_per_minute = 200
    word_count = len(text.split())
    minutes = max(1, round(word_count / words_per_minute))
    return f"{minutes} min read"
```

## Forms

### Django Forms

Django provides a powerful form handling system:

```python
# blog/forms.py
from django import forms
from django.core.exceptions import ValidationError
from .models import Post, Comment, Category

class PostForm(forms.ModelForm):
    """Form for creating and editing blog posts"""

    class Meta:
        model = Post
        fields = ['title', 'category', 'tags', 'content', 'excerpt',
                  'featured_image', 'status']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter post title'
            }),
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 15,
                'placeholder': 'Write your content here...'
            }),
            'excerpt': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Brief summary of the post'
            }),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'tags': forms.SelectMultiple(attrs={'class': 'form-control'}),
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
                'Published posts must have at least 100 characters of content.'
            )

        return cleaned_data


class CommentForm(forms.ModelForm):
    """Form for submitting comments"""

    class Meta:
        model = Comment
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Write your comment...'
            })
        }


class ContactForm(forms.Form):
    """Contact form (not tied to a model)"""
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

    def send_email(self):
        """Send the contact form email"""
        from django.core.mail import send_mail
        send_mail(
            subject=f"Contact: {self.cleaned_data['subject']}",
            message=self.cleaned_data['message'],
            from_email=self.cleaned_data['email'],
            recipient_list=['admin@example.com'],
        )
```

## Authentication System

### Built-in Authentication

Django provides a robust authentication system out of the box:

```python
# users/views.py
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import CustomUserCreationForm, UserProfileForm

def register(request):
    """User registration view"""
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Registration successful!')
            return redirect('blog:post_list')
    else:
        form = CustomUserCreationForm()

    return render(request, 'users/register.html', {'form': form})


def user_login(request):
    """User login view"""
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                next_url = request.GET.get('next', 'blog:post_list')
                return redirect(next_url)
    else:
        form = AuthenticationForm()

    return render(request, 'users/login.html', {'form': form})


@login_required
def profile(request):
    """User profile view"""
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('users:profile')
    else:
        form = UserProfileForm(instance=request.user)

    user_posts = request.user.blog_posts.all()
    return render(request, 'users/profile.html', {
        'form': form,
        'user_posts': user_posts
    })
```

### Custom User Model

For most projects, extending the user model is recommended:

```python
# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """Extended user model with additional fields"""
    email = models.EmailField(unique=True)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)

    # Make email required for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
```

Configure the custom user model in settings:

```python
# settings.py
AUTH_USER_MODEL = 'users.CustomUser'
```

## Django REST Framework

### Setting Up DRF

Django REST Framework provides powerful tools for building APIs:

```bash
pip install djangorestframework
```

```python
# settings.py
INSTALLED_APPS = [
    # ...
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
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
}
```

### Serializers

Serializers convert complex data types to JSON and vice versa:

```python
# api/serializers.py
from rest_framework import serializers
from blog.models import Post, Category, Tag, Comment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user data"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'avatar']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return obj.get_full_name()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    post_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'post_count']


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'replies']
        read_only_fields = ['id', 'created_at']

    def get_replies(self, obj):
        replies = obj.replies.filter(is_approved=True)
        return CommentSerializer(replies, many=True).data


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list view"""
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    url = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'author', 'category', 'tags',
                  'excerpt', 'featured_image', 'publish_date', 'views', 'url']

    def get_url(self, obj):
        return obj.get_absolute_url()


class PostDetailSerializer(PostListSerializer):
    """Serializer for post detail view"""
    comments = CommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()

    class Meta(PostListSerializer.Meta):
        fields = PostListSerializer.Meta.fields + ['content', 'comments',
                                                     'comment_count', 'created_at']

    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating posts"""
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )

    class Meta:
        model = Post
        fields = ['title', 'category', 'tags', 'content', 'excerpt',
                  'featured_image', 'status']

    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)
        return post
```

### API Views

Create API views using ViewSets and generic views:

```python
# api/views.py
from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F

from blog.models import Post, Category, Tag, Comment
from .serializers import (
    PostListSerializer, PostDetailSerializer, PostCreateSerializer,
    CategorySerializer, TagSerializer, CommentSerializer
)
from .permissions import IsAuthorOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post CRUD operations

    list: Get all published posts
    retrieve: Get a single post
    create: Create a new post (authenticated)
    update: Update a post (author only)
    destroy: Delete a post (author only)
    """
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter,
                       filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['publish_date', 'views', 'title']
    ordering = ['-publish_date']

    def get_queryset(self):
        queryset = Post.objects.select_related('author', 'category')
        queryset = queryset.prefetch_related('tags', 'comments')

        if self.action == 'list':
            queryset = queryset.filter(status='published')

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
        return PostDetailSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        Post.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular posts"""
        posts = self.get_queryset().order_by('-views')[:10]
        serializer = PostListSerializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get current user's posts"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        posts = Post.objects.filter(author=request.user)
        serializer = PostListSerializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Add a comment to a post"""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(post=post, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for categories (read-only)"""
    queryset = Category.objects.annotate(post_count=Count('posts'))
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for tags (read-only)"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'
```

### API URL Configuration

```python
# api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'tags', views.TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include('rest_framework.urls')),
]
```

## Admin Interface

### Customizing Django Admin

Django's admin interface is highly customizable:

```python
# blog/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import Post, Category, Tag, Comment

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'post_count', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.annotate(post_count=Count('posts'))

    def post_count(self, obj):
        return obj.post_count
    post_count.admin_order_field = 'post_count'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status',
                    'publish_date', 'views', 'featured_image_preview']
    list_filter = ['status', 'category', 'publish_date', 'author']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    raw_id_fields = ['author']
    filter_horizontal = ['tags']
    date_hierarchy = 'publish_date'
    ordering = ['-publish_date']
    readonly_fields = ['views', 'created_at', 'updated_at']

    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'content', 'excerpt')
        }),
        ('Media', {
            'fields': ('featured_image',)
        }),
        ('Metadata', {
            'fields': ('author', 'category', 'tags', 'status', 'publish_date')
        }),
        ('Statistics', {
            'fields': ('views', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def featured_image_preview(self, obj):
        if obj.featured_image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover;"/>',
                obj.featured_image.url
            )
        return '-'
    featured_image_preview.short_description = 'Image'

    actions = ['make_published', 'make_draft']

    @admin.action(description='Mark selected posts as published')
    def make_published(self, request, queryset):
        updated = queryset.update(status='published')
        self.message_user(request, f'{updated} posts marked as published.')

    @admin.action(description='Mark selected posts as draft')
    def make_draft(self, request, queryset):
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} posts marked as draft.')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['author__username', 'content']
    actions = ['approve_comments']

    @admin.action(description='Approve selected comments')
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
```

## Testing

### Writing Tests

Django provides a robust testing framework:

```python
# blog/tests.py
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Post, Category, Tag

User = get_user_model()

class PostModelTest(TestCase):
    """Tests for the Post model"""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        cls.category = Category.objects.create(
            name='Test Category',
            slug='test-category'
        )
        cls.post = Post.objects.create(
            title='Test Post',
            slug='test-post',
            author=cls.user,
            category=cls.category,
            content='This is test content for the post.',
            status='published'
        )

    def test_post_creation(self):
        self.assertEqual(self.post.title, 'Test Post')
        self.assertEqual(self.post.author.username, 'testuser')
        self.assertEqual(str(self.post), 'Test Post')

    def test_post_absolute_url(self):
        url = self.post.get_absolute_url()
        self.assertIn('test-post', url)

    def test_published_manager(self):
        published = Post.published.all()
        self.assertIn(self.post, published)

        draft = Post.objects.create(
            title='Draft Post',
            author=self.user,
            content='Draft content',
            status='draft'
        )
        self.assertNotIn(draft, Post.published.all())


class PostViewTest(TestCase):
    """Tests for post views"""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.category = Category.objects.create(name='Test', slug='test')
        self.post = Post.objects.create(
            title='Test Post',
            slug='test-post',
            author=self.user,
            category=self.category,
            content='Test content',
            status='published'
        )

    def test_post_list_view(self):
        response = self.client.get(reverse('blog:post_list'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Post')
        self.assertTemplateUsed(response, 'blog/post_list.html')

    def test_post_create_requires_login(self):
        response = self.client.get(reverse('blog:post_create'))
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(
            response,
            f'/accounts/login/?next={reverse("blog:post_create")}'
        )

    def test_post_create_authenticated(self):
        self.client.login(username='testuser', password='testpass123')
        response = self.client.get(reverse('blog:post_create'))
        self.assertEqual(response.status_code, 200)


class PostAPITest(APITestCase):
    """Tests for post API"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.category = Category.objects.create(name='Test', slug='test')
        self.post = Post.objects.create(
            title='Test Post',
            author=self.user,
            category=self.category,
            content='Test content',
            status='published'
        )

    def test_list_posts(self):
        response = self.client.get('/api/posts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_post_unauthenticated(self):
        data = {'title': 'New Post', 'content': 'New content'}
        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_post_authenticated(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'title': 'New Post',
            'content': 'New content',
            'category': self.category.id,
            'status': 'draft'
        }
        response = self.client.post('/api/posts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

Run tests with:

```bash
# Run all tests
python manage.py test

# Run tests with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

## Deployment

### Production Settings

Configure Django for production:

```python
# settings/production.py
from .base import *
import os

DEBUG = False
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Database
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

# Static files with WhiteNoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/error.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
```

### Deployment Checklist

Before deploying to production:

```bash
# Check for potential issues
python manage.py check --deploy

# Collect static files
python manage.py collectstatic

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## Summary

Django is a comprehensive web framework that provides everything needed to build robust, scalable web applications. Its key strengths include:

1. **MTV Architecture**: Clean separation of concerns with Models, Templates, and Views
2. **Powerful ORM**: Intuitive database operations with QuerySet API and migrations
3. **Built-in Security**: Protection against common vulnerabilities out of the box
4. **Admin Interface**: Production-ready administration panel with minimal configuration
5. **Form Handling**: Robust form validation and processing
6. **Authentication System**: Complete user authentication and authorization
7. **REST Framework**: Industry-standard API development with Django REST Framework
8. **Excellent Testing**: Comprehensive testing tools and test client

Django's "batteries included" philosophy means you can focus on building your application rather than reinventing common web development patterns. Whether you're building a simple blog or a complex enterprise application, Django provides the tools and structure to do it efficiently and securely.

For continued learning, explore the official Django documentation, join the Django community, and practice building real-world projects. The framework's maturity and extensive ecosystem make it an excellent choice for Python web development.
