---
title: Ruby on Rails Rapid Development
description: Use Rails for rapid web application development
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Ruby
  - Rails
  - MVC
  - rapid development
status: imported
origin: old/src/content/docs/backend/ruby-rails.en.md
divergence: 0.145
issues: []
legacy:
  category: Backend
  subcategory: Frameworks
  order: 25
  lastUpdated: 2026-01-07
---

## Introduction

Ruby on Rails, commonly known as Rails, is a full-stack web application framework written in Ruby that emphasizes developer productivity and happiness. Created by David Heinemeier Hansson in 2004, Rails has become one of the most influential web frameworks, pioneering many conventions that are now standard across the industry.

### Why Choose Ruby on Rails?

Rails was designed with the goal of making web development faster and more enjoyable. Its philosophy centers on reducing repetitive tasks and providing sensible defaults that work for most applications out of the box.

Core advantages of Ruby on Rails include:

- **Rapid Development**: Rails provides generators, scaffolding, and conventions that significantly reduce development time
- **Convention over Configuration**: Sensible defaults mean less time configuring and more time building features
- **Don't Repeat Yourself (DRY)**: Built-in abstractions encourage code reuse and maintainability
- **Active Community**: A vibrant ecosystem of gems (libraries) for nearly every common need
- **Full-Stack Framework**: Everything from database to frontend in one cohesive package
- **Battle-Tested**: Powers major applications like GitHub, Shopify, Airbnb, and Basecamp

### Rails vs Other Frameworks

| Feature | Rails | Django | Express | Spring Boot |
|---------|-------|--------|---------|-------------|
| Architecture | Full-stack MVC | Full-stack MTV | Minimal | Full-stack |
| ORM | Active Record | Django ORM | None (Sequelize) | JPA/Hibernate |
| Convention Focus | Very High | High | Low | Medium |
| Learning Curve | Moderate | Moderate | Easy | Steep |
| Scaffolding | Built-in | Limited | None | Spring Initializr |
| Best For | Rapid prototyping | Data-driven apps | APIs | Enterprise |

## The Rails Philosophy

### Convention over Configuration

Rails' most distinctive principle is Convention over Configuration (CoC). Instead of requiring developers to specify every detail, Rails assumes sensible defaults based on naming conventions.

```
┌─────────────────────────────────────────────────────────────┐
│              Convention over Configuration                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Model: User              →  Table: users                   │
│  Controller: UsersController  →  views/users/               │
│  Class: Article           →  Table: articles                │
│  Foreign Key: user_id     →  Belongs to User model          │
│                                                             │
│  Follow conventions = Less configuration = Faster dev       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Examples of Rails conventions:

- Model named `User` maps to table `users`
- Controller `ArticlesController` looks for views in `views/articles/`
- Primary keys are always `id`
- Foreign keys follow the pattern `model_name_id`
- Timestamps use `created_at` and `updated_at`

### Don't Repeat Yourself (DRY)

Rails encourages code reuse through various mechanisms:

- **Partials**: Reusable view components
- **Concerns**: Shared model and controller logic
- **Helpers**: View helper methods
- **Service Objects**: Encapsulated business logic

### Getting Started

Install Rails and create a new project:

```bash
# Install Ruby (using rbenv or rvm recommended)
# On macOS with Homebrew
brew install rbenv ruby-build
rbenv install 3.2.0
rbenv global 3.2.0

# Install Rails
gem install rails

# Create a new Rails application
rails new myapp --database=postgresql

# Navigate to project directory
cd myapp

# Create the database
rails db:create

# Start the development server
rails server
```

### Project Structure

A typical Rails project structure:

```
myapp/
├── app/
│   ├── assets/              # Stylesheets, images
│   ├── channels/            # Action Cable channels
│   ├── controllers/         # Controller classes
│   │   └── application_controller.rb
│   ├── helpers/             # View helpers
│   ├── javascript/          # JavaScript files
│   ├── jobs/                # Background jobs
│   ├── mailers/             # Email mailers
│   ├── models/              # Model classes
│   │   └── application_record.rb
│   └── views/               # View templates
│       └── layouts/
├── bin/                     # Executable scripts
├── config/                  # Configuration files
│   ├── database.yml         # Database configuration
│   ├── routes.rb            # Route definitions
│   ├── environments/        # Environment configs
│   └── initializers/        # Initialization code
├── db/
│   ├── migrate/             # Database migrations
│   ├── schema.rb            # Database schema
│   └── seeds.rb             # Seed data
├── lib/                     # Custom libraries
├── log/                     # Application logs
├── public/                  # Static files
├── test/                    # Test files
├── Gemfile                  # Ruby dependencies
└── Gemfile.lock
```

## MVC Architecture

### Understanding MVC in Rails

Rails implements the Model-View-Controller pattern, providing clear separation of concerns:

- **Model**: Handles data logic, database interactions, and business rules
- **View**: Manages presentation and user interface
- **Controller**: Processes requests, coordinates between Model and View

```
┌─────────────────────────────────────────────────────────────┐
│                     Rails MVC Flow                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Browser ──► Router ──► Controller ──► Model ──► Database  │
│      ▲                      │                               │
│      │                      ▼                               │
│      └──────────────────── View                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

1. Browser sends HTTP request
2. Router matches URL to controller action
3. Controller processes request, interacts with Model
4. Model retrieves/manipulates data from database
5. Controller passes data to View
6. View renders HTML response
7. Response sent back to browser

## Active Record

### Model Basics

Active Record is Rails' ORM (Object-Relational Mapping), implementing the Active Record pattern. Models inherit from `ApplicationRecord`:

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  # Associations
  belongs_to :author, class_name: 'User'
  has_many :comments, dependent: :destroy
  has_many :taggings, dependent: :destroy
  has_many :tags, through: :taggings
  has_one :featured_image, dependent: :destroy

  # Validations
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :content, presence: true, length: { minimum: 100 }
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft published archived] }

  # Scopes
  scope :published, -> { where(status: 'published') }
  scope :drafts, -> { where(status: 'draft') }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_author, ->(author_id) { where(author_id: author_id) }
  scope :popular, -> { order(views_count: :desc).limit(10) }

  # Callbacks
  before_validation :generate_slug, on: :create
  before_save :update_published_at
  after_create :notify_subscribers

  # Enums
  enum status: { draft: 0, published: 1, archived: 2 }

  # Instance methods
  def reading_time
    words_per_minute = 200
    words = content.split.size
    (words / words_per_minute.to_f).ceil
  end

  def increment_views!
    increment!(:views_count)
  end

  private

  def generate_slug
    self.slug = title.parameterize if title.present? && slug.blank?
  end

  def update_published_at
    self.published_at = Time.current if status_changed? && published?
  end

  def notify_subscribers
    ArticleNotificationJob.perform_later(id) if published?
  end
end
```

```ruby
# app/models/user.rb
class User < ApplicationRecord
  # Secure password handling
  has_secure_password

  # Associations
  has_many :articles, foreign_key: :author_id, dependent: :destroy
  has_many :comments, dependent: :destroy
  has_one :profile, dependent: :destroy

  # Validations
  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :username, presence: true,
                       uniqueness: true,
                       length: { minimum: 3, maximum: 30 }
  validates :password, length: { minimum: 8 }, if: :password_required?

  # Callbacks
  before_save :downcase_email
  after_create :create_default_profile

  # Class methods
  def self.authenticate(email, password)
    user = find_by(email: email.downcase)
    user&.authenticate(password)
  end

  # Instance methods
  def full_name
    "#{first_name} #{last_name}".strip.presence || username
  end

  private

  def downcase_email
    self.email = email.downcase
  end

  def create_default_profile
    create_profile!
  end

  def password_required?
    new_record? || password.present?
  end
end
```

```ruby
# app/models/comment.rb
class Comment < ApplicationRecord
  belongs_to :article, counter_cache: true
  belongs_to :user
  belongs_to :parent, class_name: 'Comment', optional: true
  has_many :replies, class_name: 'Comment', foreign_key: :parent_id, dependent: :destroy

  validates :content, presence: true, length: { minimum: 1, maximum: 1000 }

  scope :approved, -> { where(approved: true) }
  scope :top_level, -> { where(parent_id: nil) }
  scope :recent, -> { order(created_at: :desc) }
end
```

### Active Record Associations

Rails provides powerful association declarations:

```ruby
# One-to-Many
class Author < ApplicationRecord
  has_many :books, dependent: :destroy
end

class Book < ApplicationRecord
  belongs_to :author
end

# Many-to-Many through join table
class Article < ApplicationRecord
  has_many :taggings
  has_many :tags, through: :taggings
end

class Tag < ApplicationRecord
  has_many :taggings
  has_many :articles, through: :taggings
end

class Tagging < ApplicationRecord
  belongs_to :article
  belongs_to :tag
end

# Polymorphic associations
class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
end

class Article < ApplicationRecord
  has_many :comments, as: :commentable
end

class Photo < ApplicationRecord
  has_many :comments, as: :commentable
end

# Self-referential
class Employee < ApplicationRecord
  belongs_to :manager, class_name: 'Employee', optional: true
  has_many :subordinates, class_name: 'Employee', foreign_key: :manager_id
end
```

### Querying with Active Record

Active Record provides an expressive query interface:

```ruby
# Basic queries
Article.all                          # All articles
Article.first                        # First article
Article.last                         # Last article
Article.find(1)                      # Find by ID (raises if not found)
Article.find_by(slug: 'my-article')  # Find by attribute (returns nil)
Article.find_by!(slug: 'my-article') # Raises if not found

# Conditions
Article.where(status: 'published')
Article.where('views_count > ?', 100)
Article.where('title LIKE ?', '%Ruby%')
Article.where(status: 'published', author_id: 1)
Article.where.not(status: 'draft')

# Complex conditions
Article.where('created_at >= :start_date AND created_at <= :end_date',
              start_date: 1.week.ago, end_date: Time.current)

# OR conditions
Article.where(status: 'published').or(Article.where(author_id: current_user.id))

# Ordering
Article.order(created_at: :desc)
Article.order(:title)
Article.order(status: :asc, created_at: :desc)

# Limiting and offsetting
Article.limit(10)
Article.offset(20)
Article.limit(10).offset(20)  # Pagination

# Selecting specific columns
Article.select(:id, :title, :slug)
Article.pluck(:title)  # Returns array of values

# Grouping and aggregating
Article.group(:status).count
Article.average(:views_count)
Article.sum(:views_count)
Article.maximum(:views_count)
Article.minimum(:views_count)

# Eager loading (N+1 prevention)
Article.includes(:author, :tags)           # Preload associations
Article.eager_load(:author)                # LEFT OUTER JOIN
Article.preload(:comments)                 # Separate queries

# Joins
Article.joins(:author).where(users: { active: true })
Article.left_joins(:comments).where(comments: { id: nil })  # Articles without comments

# Distinct
Article.distinct
Article.select(:author_id).distinct

# Chaining
Article.published
       .includes(:author, :tags)
       .where('views_count > ?', 50)
       .order(created_at: :desc)
       .limit(10)

# Existence checks
Article.exists?(slug: 'my-article')
Article.any?
Article.none?

# Find or create
Article.find_or_create_by(slug: 'my-article') do |article|
  article.title = 'My Article'
  article.content = 'Content here'
end

Article.find_or_initialize_by(slug: 'my-article')

# Update operations
Article.find(1).update(title: 'New Title')
Article.where(status: 'draft').update_all(status: 'published')

# Delete operations
Article.find(1).destroy       # Runs callbacks
Article.where(status: 'archived').delete_all  # No callbacks

# Raw SQL when needed
Article.find_by_sql("SELECT * FROM articles WHERE status = 'published'")
ActiveRecord::Base.connection.execute("UPDATE articles SET views_count = 0")
```

### Scopes and Class Methods

Encapsulate common queries as reusable scopes:

```ruby
class Article < ApplicationRecord
  # Simple scopes
  scope :published, -> { where(status: 'published') }
  scope :recent, -> { order(created_at: :desc) }
  scope :featured, -> { where(featured: true) }

  # Scopes with arguments
  scope :by_status, ->(status) { where(status: status) }
  scope :created_after, ->(date) { where('created_at > ?', date) }
  scope :search, ->(query) {
    where('title ILIKE :q OR content ILIKE :q', q: "%#{query}%")
  }

  # Chaining scopes
  scope :published_recently, -> { published.recent.limit(5) }

  # Default scope (use sparingly)
  default_scope { order(created_at: :desc) }

  # Class methods for complex logic
  def self.trending(days: 7)
    where('created_at > ?', days.days.ago)
      .order(views_count: :desc)
      .limit(10)
  end

  def self.statistics
    {
      total: count,
      published: published.count,
      drafts: where(status: 'draft').count,
      average_views: average(:views_count)
    }
  end
end

# Usage
Article.published
Article.by_status('draft')
Article.published.recent.limit(10)
Article.trending(days: 30)
```

## Routing

### Route Configuration

Routes connect URLs to controller actions:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # Root route
  root 'pages#home'

  # Basic routes
  get '/about', to: 'pages#about'
  get '/contact', to: 'pages#contact'
  post '/contact', to: 'pages#submit_contact'

  # RESTful resources
  resources :articles do
    resources :comments, only: [:create, :destroy]

    member do
      post :publish
      post :archive
      get :preview
    end

    collection do
      get :search
      get :drafts
      get :popular
    end
  end

  # Nested resources
  resources :users do
    resources :articles, only: [:index]
    resource :profile, only: [:show, :edit, :update]
  end

  # Shallow nesting
  resources :articles, shallow: true do
    resources :comments
  end

  # Singular resource
  resource :session, only: [:new, :create, :destroy]
  resource :profile, only: [:show, :edit, :update]

  # Namespace for admin panel
  namespace :admin do
    root 'dashboard#index'
    resources :users
    resources :articles
    resources :settings, only: [:index, :update]
  end

  # Scope for API versioning
  namespace :api do
    namespace :v1 do
      resources :articles, only: [:index, :show, :create, :update, :destroy]
      resources :users, only: [:show]
      post '/auth/login', to: 'authentication#login'
      post '/auth/register', to: 'authentication#register'
    end
  end

  # Concerns for reusable routes
  concern :commentable do
    resources :comments, only: [:create, :destroy]
  end

  resources :articles, concerns: :commentable
  resources :photos, concerns: :commentable

  # Constraints
  constraints(lambda { |req| req.host == 'api.example.com' }) do
    resources :articles
  end

  # Catch-all route (must be last)
  get '*path', to: 'errors#not_found'
end
```

### Route Helpers

Rails generates URL helper methods automatically:

```ruby
# Generated helpers for: resources :articles
articles_path          # /articles
article_path(@article) # /articles/:id
new_article_path       # /articles/new
edit_article_path(@article) # /articles/:id/edit

# With format
articles_path(format: :json)  # /articles.json

# With query parameters
articles_path(page: 2, per_page: 10)  # /articles?page=2&per_page=10

# Full URLs
articles_url  # http://example.com/articles

# Named routes
get '/login', to: 'sessions#new', as: :login
login_path  # /login
```

## Controllers

### Controller Basics

Controllers handle incoming requests and orchestrate responses:

```ruby
# app/controllers/articles_controller.rb
class ArticlesController < ApplicationController
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_article, only: [:show, :edit, :update, :destroy, :publish]
  before_action :authorize_article!, only: [:edit, :update, :destroy]

  # GET /articles
  def index
    @articles = Article.published
                       .includes(:author, :tags)
                       .page(params[:page])
                       .per(10)

    # Respond to different formats
    respond_to do |format|
      format.html
      format.json { render json: @articles }
      format.rss { render layout: false }
    end
  end

  # GET /articles/:id
  def show
    @article.increment_views!
    @comments = @article.comments.approved.includes(:user)
    @comment = Comment.new

    # Fresh when for HTTP caching
    fresh_when(@article)
  end

  # GET /articles/new
  def new
    @article = current_user.articles.build
  end

  # POST /articles
  def create
    @article = current_user.articles.build(article_params)

    if @article.save
      redirect_to @article, notice: 'Article was successfully created.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  # GET /articles/:id/edit
  def edit
  end

  # PATCH/PUT /articles/:id
  def update
    if @article.update(article_params)
      redirect_to @article, notice: 'Article was successfully updated.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /articles/:id
  def destroy
    @article.destroy
    redirect_to articles_path, notice: 'Article was successfully deleted.'
  end

  # POST /articles/:id/publish
  def publish
    if @article.update(status: 'published')
      redirect_to @article, notice: 'Article has been published.'
    else
      redirect_to @article, alert: 'Could not publish article.'
    end
  end

  # GET /articles/search
  def search
    @query = params[:q]
    @articles = Article.published.search(@query).page(params[:page])
  end

  private

  def set_article
    @article = Article.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to articles_path, alert: 'Article not found.'
  end

  def authorize_article!
    unless @article.author == current_user || current_user.admin?
      redirect_to articles_path, alert: 'You are not authorized to perform this action.'
    end
  end

  def article_params
    params.require(:article).permit(:title, :content, :excerpt, :status,
                                    :featured_image, tag_ids: [])
  end
end
```

### Application Controller

Base controller with shared functionality:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  # CSRF protection
  protect_from_forgery with: :exception

  # Before actions
  before_action :set_locale
  before_action :configure_permitted_parameters, if: :devise_controller?

  # Helper methods available in views
  helper_method :current_user, :logged_in?

  # Exception handling
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActionController::RoutingError, with: :not_found
  rescue_from Pundit::NotAuthorizedError, with: :forbidden

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) if session[:user_id]
  end

  def logged_in?
    current_user.present?
  end

  def authenticate_user!
    unless logged_in?
      store_location
      redirect_to login_path, alert: 'Please log in to continue.'
    end
  end

  def store_location
    session[:return_to] = request.fullpath if request.get?
  end

  def redirect_back_or(default)
    redirect_to(session.delete(:return_to) || default)
  end

  def set_locale
    I18n.locale = params[:locale] || I18n.default_locale
  end

  def not_found
    render file: Rails.root.join('public/404.html'), status: :not_found, layout: false
  end

  def forbidden
    render file: Rails.root.join('public/403.html'), status: :forbidden, layout: false
  end
end
```

### API Controllers

For JSON API responses:

```ruby
# app/controllers/api/v1/base_controller.rb
module Api
  module V1
    class BaseController < ActionController::API
      include ActionController::HttpAuthentication::Token::ControllerMethods

      before_action :authenticate_with_token!

      rescue_from ActiveRecord::RecordNotFound, with: :not_found
      rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
      rescue_from ActionController::ParameterMissing, with: :bad_request

      private

      def authenticate_with_token!
        authenticate_or_request_with_http_token do |token, options|
          @current_user = User.find_by(api_token: token)
        end
      end

      def current_user
        @current_user
      end

      def not_found(exception)
        render json: { error: exception.message }, status: :not_found
      end

      def unprocessable_entity(exception)
        render json: {
          error: 'Validation failed',
          details: exception.record.errors.full_messages
        }, status: :unprocessable_entity
      end

      def bad_request(exception)
        render json: { error: exception.message }, status: :bad_request
      end
    end
  end
end

# app/controllers/api/v1/articles_controller.rb
module Api
  module V1
    class ArticlesController < BaseController
      before_action :set_article, only: [:show, :update, :destroy]

      def index
        @articles = Article.published
                           .includes(:author, :tags)
                           .page(params[:page])
                           .per(params[:per_page] || 20)

        render json: {
          articles: @articles.as_json(include: [:author, :tags]),
          meta: pagination_meta(@articles)
        }
      end

      def show
        render json: @article.as_json(
          include: [:author, :tags, :comments],
          methods: [:reading_time]
        )
      end

      def create
        @article = current_user.articles.build(article_params)

        if @article.save
          render json: @article, status: :created
        else
          render json: { errors: @article.errors }, status: :unprocessable_entity
        end
      end

      def update
        if @article.update(article_params)
          render json: @article
        else
          render json: { errors: @article.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @article.destroy
        head :no_content
      end

      private

      def set_article
        @article = Article.find(params[:id])
      end

      def article_params
        params.require(:article).permit(:title, :content, :excerpt, :status, tag_ids: [])
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end
    end
  end
end
```

## Views

### ERB Templates

Rails uses Embedded Ruby (ERB) for view templates:

```erb
<!-- app/views/layouts/application.html.erb -->
<!DOCTYPE html>
<html lang="<%= I18n.locale %>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= content_for?(:title) ? yield(:title) : 'My Blog' %></title>
  <meta name="description" content="<%= content_for?(:description) ? yield(:description) : 'Welcome to my blog' %>">

  <%= csrf_meta_tags %>
  <%= csp_meta_tag %>

  <%= stylesheet_link_tag 'application', media: 'all', 'data-turbo-track': 'reload' %>
  <%= javascript_include_tag 'application', 'data-turbo-track': 'reload', defer: true %>

  <%= yield :head %>
</head>
<body class="<%= controller_name %> <%= action_name %>">
  <header>
    <%= render 'shared/navigation' %>
  </header>

  <main>
    <%= render 'shared/flash_messages' %>
    <%= yield %>
  </main>

  <footer>
    <%= render 'shared/footer' %>
  </footer>
</body>
</html>
```

```erb
<!-- app/views/articles/index.html.erb -->
<% content_for :title, 'Blog Articles' %>

<div class="articles-container">
  <h1>Latest Articles</h1>

  <%= render 'search_form' %>

  <% if @articles.any? %>
    <div class="articles-grid">
      <%= render @articles %>
    </div>

    <%= render 'shared/pagination', collection: @articles %>
  <% else %>
    <p class="no-results">No articles found.</p>
  <% end %>
</div>
```

```erb
<!-- app/views/articles/_article.html.erb -->
<article class="article-card" id="<%= dom_id(article) %>">
  <% if article.featured_image.attached? %>
    <%= image_tag article.featured_image.variant(resize_to_limit: [400, 300]),
                  alt: article.title,
                  loading: 'lazy' %>
  <% end %>

  <div class="article-content">
    <h2>
      <%= link_to article.title, article %>
    </h2>

    <div class="article-meta">
      <span class="author">
        By <%= article.author.full_name %>
      </span>
      <time datetime="<%= article.created_at.iso8601 %>">
        <%= time_ago_in_words(article.created_at) %> ago
      </time>
      <span class="reading-time">
        <%= pluralize(article.reading_time, 'minute') %> read
      </span>
    </div>

    <p class="excerpt">
      <%= truncate(article.excerpt, length: 150) %>
    </p>

    <div class="tags">
      <% article.tags.each do |tag| %>
        <%= link_to tag.name, tag_path(tag), class: 'tag' %>
      <% end %>
    </div>
  </div>
</article>
```

```erb
<!-- app/views/articles/show.html.erb -->
<% content_for :title, @article.title %>
<% content_for :description, @article.excerpt %>

<article class="article-full">
  <header class="article-header">
    <h1><%= @article.title %></h1>

    <div class="article-meta">
      <div class="author-info">
        <%= image_tag @article.author.avatar.variant(resize_to_fill: [50, 50]),
                      alt: @article.author.full_name,
                      class: 'avatar' if @article.author.avatar.attached? %>
        <span><%= @article.author.full_name %></span>
      </div>

      <time datetime="<%= @article.published_at&.iso8601 %>">
        <%= @article.published_at&.strftime('%B %d, %Y') %>
      </time>

      <span><%= @article.views_count %> views</span>
      <span><%= pluralize(@article.reading_time, 'minute') %> read</span>
    </div>
  </header>

  <% if @article.featured_image.attached? %>
    <figure class="featured-image">
      <%= image_tag @article.featured_image.variant(resize_to_limit: [1200, 800]),
                    alt: @article.title %>
    </figure>
  <% end %>

  <div class="article-body">
    <%= simple_format(@article.content) %>
  </div>

  <footer class="article-footer">
    <div class="tags">
      <% @article.tags.each do |tag| %>
        <%= link_to tag.name, tag_path(tag), class: 'tag' %>
      <% end %>
    </div>

    <% if current_user == @article.author %>
      <div class="article-actions">
        <%= link_to 'Edit', edit_article_path(@article), class: 'btn' %>
        <%= button_to 'Delete', article_path(@article),
                      method: :delete,
                      data: { confirm: 'Are you sure?' },
                      class: 'btn btn-danger' %>
      </div>
    <% end %>
  </footer>
</article>

<section class="comments-section">
  <h2><%= pluralize(@comments.count, 'Comment') %></h2>

  <% if logged_in? %>
    <%= render 'comments/form', comment: @comment, article: @article %>
  <% else %>
    <p><%= link_to 'Log in', login_path %> to leave a comment.</p>
  <% end %>

  <div id="comments">
    <%= render @comments %>
  </div>
</section>
```

### Partials and Helpers

Reusable view components:

```erb
<!-- app/views/shared/_flash_messages.html.erb -->
<% flash.each do |type, message| %>
  <div class="alert alert-<%= type %>" role="alert">
    <%= message %>
    <button type="button" class="close" data-dismiss="alert">
      <span>&times;</span>
    </button>
  </div>
<% end %>
```

```erb
<!-- app/views/shared/_pagination.html.erb -->
<% if collection.total_pages > 1 %>
  <nav class="pagination" aria-label="Page navigation">
    <% if collection.first_page? %>
      <span class="page-item disabled">Previous</span>
    <% else %>
      <%= link_to 'Previous', url_for(page: collection.prev_page), class: 'page-item' %>
    <% end %>

    <% collection.total_pages.times do |i| %>
      <% page_num = i + 1 %>
      <% if page_num == collection.current_page %>
        <span class="page-item active"><%= page_num %></span>
      <% else %>
        <%= link_to page_num, url_for(page: page_num), class: 'page-item' %>
      <% end %>
    <% end %>

    <% if collection.last_page? %>
      <span class="page-item disabled">Next</span>
    <% else %>
      <%= link_to 'Next', url_for(page: collection.next_page), class: 'page-item' %>
    <% end %>
  </nav>
<% end %>
```

```ruby
# app/helpers/application_helper.rb
module ApplicationHelper
  def page_title(title = nil)
    base_title = 'My Blog'
    title.present? ? "#{title} | #{base_title}" : base_title
  end

  def active_link_to(text, path, options = {})
    css_class = current_page?(path) ? 'active' : ''
    options[:class] = [options[:class], css_class].compact.join(' ')
    link_to text, path, options
  end

  def format_date(date, format = :long)
    return '' unless date

    case format
    when :short
      date.strftime('%b %d')
    when :long
      date.strftime('%B %d, %Y')
    when :relative
      time_ago_in_words(date) + ' ago'
    else
      date.to_s
    end
  end

  def markdown(text)
    return '' if text.blank?

    renderer = Redcarpet::Render::HTML.new(hard_wrap: true, safe_links_only: true)
    markdown = Redcarpet::Markdown.new(renderer, {
      autolink: true,
      fenced_code_blocks: true,
      tables: true,
      strikethrough: true
    })

    markdown.render(text).html_safe
  end

  def reading_time_text(article)
    minutes = article.reading_time
    "#{minutes} min read"
  end
end
```

### Form Helpers

Rails provides powerful form helpers:

```erb
<!-- app/views/articles/_form.html.erb -->
<%= form_with model: @article, local: true, html: { class: 'article-form' } do |form| %>
  <% if @article.errors.any? %>
    <div class="error-messages">
      <h3><%= pluralize(@article.errors.count, 'error') %> prevented this article from being saved:</h3>
      <ul>
        <% @article.errors.full_messages.each do |message| %>
          <li><%= message %></li>
        <% end %>
      </ul>
    </div>
  <% end %>

  <div class="form-group">
    <%= form.label :title %>
    <%= form.text_field :title, class: 'form-control',
                        placeholder: 'Enter article title',
                        autofocus: true %>
  </div>

  <div class="form-group">
    <%= form.label :excerpt %>
    <%= form.text_area :excerpt, class: 'form-control',
                       rows: 3,
                       placeholder: 'Brief summary of the article' %>
  </div>

  <div class="form-group">
    <%= form.label :content %>
    <%= form.text_area :content, class: 'form-control',
                       rows: 15,
                       placeholder: 'Write your article content here...' %>
  </div>

  <div class="form-group">
    <%= form.label :category_id %>
    <%= form.collection_select :category_id,
                               Category.all,
                               :id, :name,
                               { prompt: 'Select a category' },
                               { class: 'form-control' } %>
  </div>

  <div class="form-group">
    <%= form.label :tags %>
    <%= form.collection_check_boxes :tag_ids, Tag.all, :id, :name do |tag| %>
      <div class="form-check">
        <%= tag.check_box class: 'form-check-input' %>
        <%= tag.label class: 'form-check-label' %>
      </div>
    <% end %>
  </div>

  <div class="form-group">
    <%= form.label :featured_image %>
    <%= form.file_field :featured_image, class: 'form-control-file',
                        accept: 'image/*' %>
    <% if @article.featured_image.attached? %>
      <div class="current-image">
        <%= image_tag @article.featured_image.variant(resize_to_limit: [200, 200]) %>
      </div>
    <% end %>
  </div>

  <div class="form-group">
    <%= form.label :status %>
    <%= form.select :status,
                    Article.statuses.keys.map { |s| [s.humanize, s] },
                    {},
                    { class: 'form-control' } %>
  </div>

  <div class="form-actions">
    <%= form.submit class: 'btn btn-primary' %>
    <%= link_to 'Cancel', articles_path, class: 'btn btn-secondary' %>
  </div>
<% end %>
```

## Database Migrations

### Creating Migrations

Migrations allow you to evolve your database schema over time:

```bash
# Generate a migration
rails generate migration CreateArticles
rails generate migration AddSlugToArticles slug:string:index
rails generate migration RemoveColumnFromTable column:type
rails generate migration AddReferencesToArticles user:references
```

```ruby
# db/migrate/20240115000001_create_articles.rb
class CreateArticles < ActiveRecord::Migration[7.0]
  def change
    create_table :articles do |t|
      t.string :title, null: false
      t.string :slug, null: false
      t.text :content
      t.text :excerpt
      t.string :status, default: 'draft'
      t.integer :views_count, default: 0
      t.datetime :published_at
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.references :category, foreign_key: true

      t.timestamps
    end

    add_index :articles, :slug, unique: true
    add_index :articles, :status
    add_index :articles, :published_at
    add_index :articles, [:author_id, :status]
  end
end

# db/migrate/20240115000002_create_tags.rb
class CreateTags < ActiveRecord::Migration[7.0]
  def change
    create_table :tags do |t|
      t.string :name, null: false
      t.string :slug, null: false

      t.timestamps
    end

    add_index :tags, :name, unique: true
    add_index :tags, :slug, unique: true
  end
end

# db/migrate/20240115000003_create_taggings.rb
class CreateTaggings < ActiveRecord::Migration[7.0]
  def change
    create_table :taggings do |t|
      t.references :article, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end

    add_index :taggings, [:article_id, :tag_id], unique: true
  end
end

# db/migrate/20240115000004_add_comments_count_to_articles.rb
class AddCommentsCountToArticles < ActiveRecord::Migration[7.0]
  def change
    add_column :articles, :comments_count, :integer, default: 0

    # Backfill existing data
    reversible do |dir|
      dir.up do
        Article.find_each do |article|
          Article.reset_counters(article.id, :comments)
        end
      end
    end
  end
end

# db/migrate/20240115000005_change_content_to_text.rb
class ChangeContentToText < ActiveRecord::Migration[7.0]
  def up
    change_column :articles, :content, :text, limit: 16.megabytes - 1
  end

  def down
    change_column :articles, :content, :text
  end
end
```

### Running Migrations

```bash
# Run pending migrations
rails db:migrate

# Rollback last migration
rails db:rollback

# Rollback multiple migrations
rails db:rollback STEP=3

# Migrate to specific version
rails db:migrate VERSION=20240115000001

# Check migration status
rails db:migrate:status

# Reset database (drop, create, migrate)
rails db:reset

# Drop and recreate with seed data
rails db:setup
```

### Seeds

Populate your database with initial data:

```ruby
# db/seeds.rb
puts 'Seeding database...'

# Create admin user
admin = User.find_or_create_by!(email: 'admin@example.com') do |user|
  user.username = 'admin'
  user.password = 'password123'
  user.admin = true
end
puts "Created admin user: #{admin.email}"

# Create categories
categories = %w[Technology Business Lifestyle Health Travel].map do |name|
  Category.find_or_create_by!(name: name) do |category|
    category.slug = name.parameterize
  end
end
puts "Created #{categories.count} categories"

# Create tags
tags = %w[Ruby Rails JavaScript Python DevOps Docker AWS Startup].map do |name|
  Tag.find_or_create_by!(name: name) do |tag|
    tag.slug = name.parameterize
  end
end
puts "Created #{tags.count} tags"

# Create sample articles
10.times do |i|
  article = Article.find_or_create_by!(slug: "sample-article-#{i + 1}") do |a|
    a.title = "Sample Article #{i + 1}"
    a.content = "This is the content for sample article #{i + 1}. " * 50
    a.excerpt = "Brief excerpt for article #{i + 1}"
    a.author = admin
    a.category = categories.sample
    a.status = %w[draft published].sample
    a.published_at = rand(30.days).seconds.ago if a.status == 'published'
  end
  article.tags = tags.sample(rand(1..3))
end
puts 'Created 10 sample articles'

puts 'Seeding completed!'
```

```bash
# Run seeds
rails db:seed

# Reset and seed
rails db:reset  # Includes db:seed
```

## Authentication and Authorization

### Authentication with Devise

Devise is the most popular authentication solution for Rails:

```bash
# Add to Gemfile
gem 'devise'

# Install
bundle install
rails generate devise:install
rails generate devise User
rails db:migrate
```

```ruby
# app/models/user.rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :confirmable, :lockable, :trackable

  has_many :articles, foreign_key: :author_id

  def admin?
    role == 'admin'
  end
end
```

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :first_name, :last_name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:username, :first_name, :last_name, :avatar])
  end
end
```

### Authorization with Pundit

Pundit provides a simple authorization system:

```bash
gem 'pundit'
bundle install
rails generate pundit:install
```

```ruby
# app/policies/application_policy.rb
class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    true
  end

  def show?
    true
  end

  def create?
    user.present?
  end

  def update?
    user.present? && (record.user == user || user.admin?)
  end

  def destroy?
    update?
  end
end

# app/policies/article_policy.rb
class ArticlePolicy < ApplicationPolicy
  def show?
    record.published? || record.author == user || user&.admin?
  end

  def create?
    user.present?
  end

  def update?
    user.present? && (record.author == user || user.admin?)
  end

  def destroy?
    update?
  end

  def publish?
    update? && record.draft?
  end

  class Scope < Scope
    def resolve
      if user&.admin?
        scope.all
      elsif user
        scope.where(status: 'published').or(scope.where(author: user))
      else
        scope.where(status: 'published')
      end
    end
  end
end
```

```ruby
# Using Pundit in controllers
class ArticlesController < ApplicationController
  include Pundit::Authorization

  after_action :verify_authorized, except: [:index]
  after_action :verify_policy_scoped, only: [:index]

  def index
    @articles = policy_scope(Article)
  end

  def show
    @article = Article.find(params[:id])
    authorize @article
  end

  def create
    @article = current_user.articles.build(article_params)
    authorize @article

    if @article.save
      redirect_to @article
    else
      render :new
    end
  end

  def update
    @article = Article.find(params[:id])
    authorize @article

    if @article.update(article_params)
      redirect_to @article
    else
      render :edit
    end
  end
end
```

## Testing

### Model Tests

Rails uses Minitest by default, but RSpec is also popular:

```ruby
# test/models/article_test.rb
require 'test_helper'

class ArticleTest < ActiveSupport::TestCase
  def setup
    @user = users(:admin)
    @article = Article.new(
      title: 'Test Article',
      content: 'This is test content. ' * 10,
      author: @user,
      status: 'draft'
    )
  end

  test 'should be valid' do
    assert @article.valid?
  end

  test 'should require title' do
    @article.title = nil
    assert_not @article.valid?
    assert_includes @article.errors[:title], "can't be blank"
  end

  test 'should require minimum title length' do
    @article.title = 'Hi'
    assert_not @article.valid?
  end

  test 'should generate slug from title' do
    @article.save
    assert_equal 'test-article', @article.slug
  end

  test 'published scope returns only published articles' do
    @article.save
    published_article = Article.create!(
      title: 'Published Article',
      content: 'Content here. ' * 10,
      author: @user,
      status: 'published'
    )

    assert_includes Article.published, published_article
    assert_not_includes Article.published, @article
  end

  test 'reading_time returns correct value' do
    @article.content = 'word ' * 400  # 400 words
    assert_equal 2, @article.reading_time
  end
end
```

### Controller Tests

```ruby
# test/controllers/articles_controller_test.rb
require 'test_helper'

class ArticlesControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:admin)
    @article = articles(:published_article)
  end

  test 'should get index' do
    get articles_url
    assert_response :success
    assert_select 'h1', 'Latest Articles'
  end

  test 'should show published article' do
    get article_url(@article)
    assert_response :success
  end

  test 'should not show draft to anonymous user' do
    draft = articles(:draft_article)
    get article_url(draft)
    assert_redirected_to articles_url
  end

  test 'should require login for new article' do
    get new_article_url
    assert_redirected_to login_url
  end

  test 'should create article when logged in' do
    sign_in @user

    assert_difference('Article.count', 1) do
      post articles_url, params: {
        article: {
          title: 'New Article Title',
          content: 'This is the content. ' * 10,
          status: 'draft'
        }
      }
    end

    assert_redirected_to article_url(Article.last)
  end

  test 'should not create article with invalid data' do
    sign_in @user

    assert_no_difference('Article.count') do
      post articles_url, params: {
        article: { title: '', content: '' }
      }
    end

    assert_response :unprocessable_entity
  end

  test 'should update own article' do
    sign_in @article.author

    patch article_url(@article), params: {
      article: { title: 'Updated Title' }
    }

    assert_redirected_to article_url(@article)
    @article.reload
    assert_equal 'Updated Title', @article.title
  end

  test 'should not update other user article' do
    other_user = users(:regular_user)
    sign_in other_user

    patch article_url(@article), params: {
      article: { title: 'Hacked Title' }
    }

    assert_redirected_to articles_url
    @article.reload
    assert_not_equal 'Hacked Title', @article.title
  end
end
```

### System Tests

```ruby
# test/system/articles_test.rb
require 'application_system_test_case'

class ArticlesTest < ApplicationSystemTestCase
  def setup
    @user = users(:admin)
    @article = articles(:published_article)
  end

  test 'visiting the index' do
    visit articles_url
    assert_selector 'h1', text: 'Latest Articles'
  end

  test 'viewing an article' do
    visit articles_url
    click_on @article.title

    assert_selector 'h1', text: @article.title
    assert_text @article.content
  end

  test 'creating an article' do
    sign_in @user
    visit new_article_url

    fill_in 'Title', with: 'My New Article'
    fill_in 'Content', with: 'This is the content of my new article. ' * 10
    select 'Draft', from: 'Status'

    click_on 'Create Article'

    assert_text 'Article was successfully created'
    assert_selector 'h1', text: 'My New Article'
  end

  test 'searching articles' do
    visit articles_url
    fill_in 'Search', with: @article.title
    click_on 'Search'

    assert_selector 'article', count: 1
    assert_text @article.title
  end
end
```

### Running Tests

```bash
# Run all tests
rails test

# Run specific test file
rails test test/models/article_test.rb

# Run specific test
rails test test/models/article_test.rb:15

# Run system tests
rails test:system

# Run with verbose output
rails test -v

# Run with coverage (using simplecov gem)
COVERAGE=true rails test
```

## Deployment

### Production Configuration

```ruby
# config/environments/production.rb
Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  # Force SSL
  config.force_ssl = true

  # Logging
  config.log_level = :info
  config.log_tags = [:request_id]

  # Use a different cache store in production
  config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }

  # Active Storage
  config.active_storage.service = :amazon

  # Action Mailer
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: ENV['APP_HOST'] }

  # Asset handling
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?
  config.assets.compile = false

  # I18n fallbacks
  config.i18n.fallbacks = true

  # Active Record
  config.active_record.dump_schema_after_migration = false
end
```

### Database Configuration

```yaml
# config/database.yml
production:
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  url: <%= ENV['DATABASE_URL'] %>
```

### Deployment with Docker

```dockerfile
# Dockerfile
FROM ruby:3.2-slim

RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs npm && \
    npm install -g yarn

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

RUN bundle exec rails assets:precompile

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp_production
      - REDIS_URL=redis://redis:6379/0
      - RAILS_ENV=production
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Deployment Checklist

```bash
# Set environment variables
export RAILS_ENV=production
export SECRET_KEY_BASE=$(rails secret)

# Precompile assets
rails assets:precompile

# Run database migrations
rails db:migrate

# Check for potential issues
rails db:migrate:status

# Start the server with Puma
bundle exec puma -C config/puma.rb
```

### Platform Deployment

For Heroku:

```bash
# Create Heroku app
heroku create myapp

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set SECRET_KEY_BASE=$(rails secret)

# Deploy
git push heroku main

# Run migrations
heroku run rails db:migrate
```

## Summary

Ruby on Rails remains one of the most productive frameworks for building web applications. Its key strengths include:

1. **Convention over Configuration**: Sensible defaults reduce boilerplate and speed up development
2. **Active Record ORM**: Intuitive database operations with powerful query interface and migrations
3. **Full MVC Stack**: Complete solution from database to frontend with consistent patterns
4. **Rich Ecosystem**: Thousands of gems for common functionality like authentication, authorization, and file uploads
5. **Developer Happiness**: Expressive Ruby syntax and well-designed APIs make coding enjoyable
6. **Rapid Prototyping**: Generators and scaffolding enable quick iteration on ideas
7. **Testing Built-in**: Comprehensive testing tools from unit tests to system tests
8. **Production Ready**: Battle-tested by major companies handling millions of requests

Rails excels at building content management systems, e-commerce platforms, social networks, and SaaS applications. Its opinionated nature means faster onboarding for teams and consistent codebases across projects.

For continued learning, explore the official Rails Guides, participate in the Rails community, and practice building real-world applications. The framework's maturity and ongoing development ensure it remains a solid choice for modern web development.
