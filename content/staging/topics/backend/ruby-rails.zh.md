---
title: Ruby on Rails 快速开发
description: 使用Rails进行快速Web应用开发
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Ruby
  - Rails
  - MVC
  - 快速开发
status: imported
origin: old/src/content/docs/backend/ruby-rails.zh.md
divergence: 0.145
issues: []
legacy:
  category: Backend
  subcategory: Frameworks
  order: 25
  lastUpdated: 2026-01-07
---

## 简介

Ruby on Rails（简称 Rails）是一个使用 Ruby 语言编写的开源 Web 应用框架。它遵循 MVC（Model-View-Controller）架构模式，强调"约定优于配置"（Convention over Configuration）和"不要重复自己"（Don't Repeat Yourself，DRY）的核心理念。Rails 的设计目标是让 Web 开发更加简单、高效和愉快。

### 为什么选择 Rails？

Rails 自 2004 年发布以来，一直是最受欢迎的 Web 开发框架之一。许多知名网站如 GitHub、Shopify、Airbnb、Basecamp 等都是使用 Rails 构建的。

Rails 的核心优势包括：

- **开发效率高**：Rails 提供了大量的内置功能和约定，能够显著减少开发时间
- **代码优雅**：Ruby 语言的优雅语法使代码更易读、更易维护
- **成熟的生态系统**：拥有丰富的 Gem（Ruby 包）库，几乎可以找到任何功能的解决方案
- **强大的社区**：活跃的开发者社区提供了大量的教程、插件和技术支持
- **全栈框架**：从数据库到前端，Rails 提供了完整的解决方案
- **测试驱动**：内置测试框架，鼓励编写高质量的测试代码

### Rails 与其他框架对比

| 特性 | Rails | Django | Express.js | Spring Boot |
|------|-------|--------|------------|-------------|
| 语言 | Ruby | Python | JavaScript | Java |
| 架构模式 | MVC | MTV | 灵活 | MVC |
| ORM | Active Record | Django ORM | 无内置 | JPA/Hibernate |
| 学习曲线 | 中等 | 中等 | 简单 | 较陡 |
| 开发速度 | 很快 | 快 | 中等 | 中等 |
| 适用场景 | 全栈应用 | 全栈应用 | API/微服务 | 企业应用 |

## Rails 哲学与核心理念

### 约定优于配置 (Convention over Configuration)

Rails 最重要的设计理念是"约定优于配置"。这意味着 Rails 对应用程序的结构和命名有一套默认约定，开发者只需遵循这些约定，就可以减少大量的配置代码。

```ruby
# 约定示例：模型名与表名的对应关系
# 模型类名（单数，驼峰式）-> 数据库表名（复数，下划线式）

class User < ApplicationRecord
  # Rails 自动关联到 users 表
end

class BlogPost < ApplicationRecord
  # Rails 自动关联到 blog_posts 表
end

class Person < ApplicationRecord
  # Rails 自动关联到 people 表（Rails 懂英语复数规则！）
end
```

### 不要重复自己 (DRY - Don't Repeat Yourself)

DRY 原则要求每一个知识片段在系统中都应该有一个单一、明确、权威的表示。Rails 通过多种方式支持这一原则：

```ruby
# 使用 concerns 提取共享逻辑
# app/models/concerns/searchable.rb
module Searchable
  extend ActiveSupport::Concern

  included do
    scope :search, ->(query) { where("name LIKE ?", "%#{query}%") }
  end

  class_methods do
    def search_by_fields(*fields)
      # 定义动态搜索方法
    end
  end
end

# 在多个模型中使用
class Product < ApplicationRecord
  include Searchable
end

class Article < ApplicationRecord
  include Searchable
end
```

### RESTful 设计

Rails 强调 RESTful 架构风格，通过标准的 HTTP 方法操作资源：

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # 这一行代码会生成完整的 RESTful 路由
  resources :articles

  # 等同于以下路由定义：
  # GET    /articles          -> articles#index   （列表）
  # GET    /articles/new      -> articles#new     （新建表单）
  # POST   /articles          -> articles#create  （创建）
  # GET    /articles/:id      -> articles#show    （详情）
  # GET    /articles/:id/edit -> articles#edit    （编辑表单）
  # PATCH  /articles/:id      -> articles#update  （更新）
  # DELETE /articles/:id      -> articles#destroy （删除）
end
```

## MVC 架构详解

### 架构概览

Rails 的 MVC 架构将应用程序分为三个核心组件：

```
┌─────────────────────────────────────────────────────────────────┐
│                      Rails MVC 请求流程                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   浏览器 ──► 路由(Router) ──► 控制器(Controller)                  │
│      ▲                            │                             │
│      │                            ▼                             │
│      │                      模型(Model) ◄──► 数据库              │
│      │                            │                             │
│      │                            ▼                             │
│      └─────────────────────  视图(View)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 项目结构

标准的 Rails 项目结构如下：

```
myapp/
├── app/                      # 应用程序代码
│   ├── assets/              # 静态资源（CSS、JS、图片）
│   ├── channels/            # Action Cable 频道
│   ├── controllers/         # 控制器
│   ├── helpers/             # 视图助手方法
│   ├── javascript/          # JavaScript 代码
│   ├── jobs/                # 后台任务
│   ├── mailers/             # 邮件发送器
│   ├── models/              # 模型
│   └── views/               # 视图模板
├── bin/                      # 可执行脚本
├── config/                   # 配置文件
│   ├── database.yml         # 数据库配置
│   ├── routes.rb            # 路由配置
│   └── environments/        # 环境配置
├── db/                       # 数据库相关
│   ├── migrate/             # 迁移文件
│   ├── schema.rb            # 数据库结构
│   └── seeds.rb             # 种子数据
├── lib/                      # 自定义库
├── log/                      # 日志文件
├── public/                   # 公开静态文件
├── test/                     # 测试文件
├── tmp/                      # 临时文件
├── vendor/                   # 第三方代码
├── Gemfile                   # 依赖管理
└── Gemfile.lock             # 依赖版本锁定
```

## Active Record - 数据模型层

### Active Record 简介

Active Record 是 Rails 的 ORM（对象关系映射）层，它将数据库表映射为 Ruby 类，将表中的行映射为对象。

```ruby
# app/models/user.rb
class User < ApplicationRecord
  # Active Record 自动提供以下功能：
  # - 数据库 CRUD 操作
  # - 数据验证
  # - 关联关系
  # - 回调钩子
  # - 查询接口
end
```

### 模型定义与验证

```ruby
# app/models/article.rb
class Article < ApplicationRecord
  # 关联关系
  belongs_to :user
  has_many :comments, dependent: :destroy
  has_many :taggings
  has_many :tags, through: :taggings
  has_one :featured_image, class_name: 'Image'

  # 数据验证
  validates :title, presence: true, length: { minimum: 5, maximum: 100 }
  validates :content, presence: true
  validates :slug, uniqueness: true, format: { with: /\A[a-z0-9\-]+\z/ }
  validates :status, inclusion: { in: %w[draft published archived] }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }

  # 自定义验证
  validate :publication_date_cannot_be_in_the_past

  # 作用域（Scopes）
  scope :published, -> { where(status: 'published') }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_author, ->(user) { where(user: user) }
  scope :popular, -> { where('views_count > ?', 100) }

  # 回调
  before_save :generate_slug
  after_create :send_notification
  before_destroy :cleanup_associations

  # 枚举
  enum status: { draft: 0, published: 1, archived: 2 }

  private

  def generate_slug
    self.slug ||= title.parameterize
  end

  def publication_date_cannot_be_in_the_past
    if published_at.present? && published_at < Date.today
      errors.add(:published_at, "不能是过去的日期")
    end
  end

  def send_notification
    ArticleNotificationJob.perform_later(self)
  end

  def cleanup_associations
    # 清理相关资源
  end
end
```

### Active Record 查询接口

```ruby
# 基本查询
User.all                              # 所有用户
User.first                            # 第一个用户
User.last                             # 最后一个用户
User.find(1)                          # 通过 ID 查找
User.find_by(email: 'test@example.com')  # 通过条件查找

# 条件查询
Article.where(status: 'published')
Article.where('created_at > ?', 1.week.ago)
Article.where(user_id: [1, 2, 3])
Article.where.not(status: 'draft')

# 排序与限制
Article.order(created_at: :desc)
Article.order(:title)
Article.limit(10)
Article.offset(20)
Article.limit(10).offset(20)          # 分页

# 聚合查询
User.count
Article.average(:views_count)
Order.sum(:total)
Product.maximum(:price)
Product.minimum(:price)

# 分组与统计
Article.group(:status).count
Order.group(:user_id).sum(:total)

# 关联查询
user.articles.published
Article.includes(:user, :comments).where(status: 'published')
Article.joins(:user).where(users: { role: 'admin' })

# 链式查询
Article.published
       .recent
       .includes(:user)
       .where('views_count > ?', 50)
       .limit(10)

# 原生 SQL（谨慎使用）
Article.find_by_sql("SELECT * FROM articles WHERE status = 'published'")
ActiveRecord::Base.connection.execute("UPDATE articles SET views = views + 1")
```

### Active Record 关联

```ruby
# 一对一关联
class User < ApplicationRecord
  has_one :profile, dependent: :destroy
end

class Profile < ApplicationRecord
  belongs_to :user
end

# 一对多关联
class User < ApplicationRecord
  has_many :articles, dependent: :destroy
end

class Article < ApplicationRecord
  belongs_to :user
end

# 多对多关联（通过中间表）
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

# 多态关联
class Comment < ApplicationRecord
  belongs_to :commentable, polymorphic: true
end

class Article < ApplicationRecord
  has_many :comments, as: :commentable
end

class Photo < ApplicationRecord
  has_many :comments, as: :commentable
end
```

## 路由系统

### 基础路由

```ruby
# config/routes.rb
Rails.application.routes.draw do
  # 根路由
  root 'home#index'

  # 基本路由
  get '/about', to: 'pages#about'
  post '/contact', to: 'pages#contact'

  # RESTful 资源路由
  resources :articles
  resources :users, only: [:index, :show]
  resources :posts, except: [:destroy]

  # 嵌套路由
  resources :articles do
    resources :comments, only: [:create, :destroy]
    member do
      post 'publish'
      delete 'archive'
    end
    collection do
      get 'search'
      get 'popular'
    end
  end

  # 命名空间路由
  namespace :admin do
    resources :users
    resources :articles
    root 'dashboard#index'
  end

  # 作用域路由
  scope '/api' do
    scope '/v1' do
      resources :articles, defaults: { format: :json }
    end
  end

  # 或使用 API 命名空间
  namespace :api do
    namespace :v1 do
      resources :articles
      resources :users
    end
  end

  # 带约束的路由
  get '/articles/:id', to: 'articles#show', constraints: { id: /\d+/ }

  # 重定向
  get '/old-path', to: redirect('/new-path')

  # 通配路由（放在最后）
  get '*path', to: 'errors#not_found'
end
```

### 路由助手方法

```ruby
# 路由生成的助手方法
articles_path         # => '/articles'
articles_url          # => 'http://localhost:3000/articles'
new_article_path      # => '/articles/new'
edit_article_path(1)  # => '/articles/1/edit'
article_path(@article) # => '/articles/1'

# 嵌套路由助手
article_comments_path(@article)      # => '/articles/1/comments'
new_article_comment_path(@article)   # => '/articles/1/comments/new'

# 命名空间路由助手
admin_users_path      # => '/admin/users'
api_v1_articles_path  # => '/api/v1/articles'
```

## 控制器

### 控制器基础

```ruby
# app/controllers/articles_controller.rb
class ArticlesController < ApplicationController
  # 前置过滤器
  before_action :authenticate_user!, except: [:index, :show]
  before_action :set_article, only: [:show, :edit, :update, :destroy]
  before_action :authorize_article, only: [:edit, :update, :destroy]

  # 列表页
  def index
    @articles = Article.published
                       .includes(:user, :tags)
                       .order(created_at: :desc)
                       .page(params[:page])
                       .per(10)
  end

  # 详情页
  def show
    @article.increment!(:views_count)
    @comments = @article.comments.includes(:user).order(created_at: :desc)
  end

  # 新建表单
  def new
    @article = current_user.articles.build
  end

  # 创建
  def create
    @article = current_user.articles.build(article_params)

    if @article.save
      redirect_to @article, notice: '文章创建成功！'
    else
      render :new, status: :unprocessable_entity
    end
  end

  # 编辑表单
  def edit
  end

  # 更新
  def update
    if @article.update(article_params)
      redirect_to @article, notice: '文章更新成功！'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # 删除
  def destroy
    @article.destroy
    redirect_to articles_path, notice: '文章已删除。', status: :see_other
  end

  # 自定义动作
  def publish
    @article = Article.find(params[:id])
    @article.update(status: 'published', published_at: Time.current)
    redirect_to @article, notice: '文章已发布！'
  end

  def search
    @articles = Article.search(params[:q]).page(params[:page])
    render :index
  end

  private

  def set_article
    @article = Article.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to articles_path, alert: '文章不存在'
  end

  def authorize_article
    unless @article.user == current_user || current_user.admin?
      redirect_to articles_path, alert: '没有权限执行此操作'
    end
  end

  # 强参数（Strong Parameters）
  def article_params
    params.require(:article).permit(:title, :content, :status, :published_at, tag_ids: [])
  end
end
```

### API 控制器

```ruby
# app/controllers/api/v1/articles_controller.rb
module Api
  module V1
    class ArticlesController < ApplicationController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_api_user!
      before_action :set_article, only: [:show, :update, :destroy]

      def index
        @articles = Article.published
                          .includes(:user)
                          .order(created_at: :desc)
                          .page(params[:page])

        render json: {
          articles: @articles.as_json(include: :user),
          meta: {
            current_page: @articles.current_page,
            total_pages: @articles.total_pages,
            total_count: @articles.total_count
          }
        }
      end

      def show
        render json: @article.as_json(
          include: [:user, :comments],
          methods: [:formatted_date, :reading_time]
        )
      end

      def create
        @article = current_user.articles.build(article_params)

        if @article.save
          render json: @article, status: :created
        else
          render json: { errors: @article.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def update
        if @article.update(article_params)
          render json: @article
        else
          render json: { errors: @article.errors.full_messages },
                 status: :unprocessable_entity
        end
      end

      def destroy
        @article.destroy
        head :no_content
      end

      private

      def set_article
        @article = Article.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: '文章不存在' }, status: :not_found
      end

      def article_params
        params.require(:article).permit(:title, :content, :status)
      end

      def authenticate_api_user!
        token = request.headers['Authorization']&.split(' ')&.last
        @current_user = User.find_by(api_token: token)

        render json: { error: '未授权' }, status: :unauthorized unless @current_user
      end

      def current_user
        @current_user
      end
    end
  end
end
```

## 视图层

### ERB 模板

```erb
<!-- app/views/articles/index.html.erb -->
<div class="articles-container">
  <h1>文章列表</h1>

  <%= form_with url: search_articles_path, method: :get, class: 'search-form' do |f| %>
    <%= f.text_field :q, placeholder: '搜索文章...', value: params[:q] %>
    <%= f.submit '搜索' %>
  <% end %>

  <% if @articles.any? %>
    <div class="articles-list">
      <% @articles.each do |article| %>
        <%= render partial: 'article', locals: { article: article } %>
      <% end %>
    </div>

    <!-- 分页 -->
    <%= paginate @articles %>
  <% else %>
    <p class="no-results">暂无文章</p>
  <% end %>

  <% if user_signed_in? %>
    <%= link_to '写文章', new_article_path, class: 'btn btn-primary' %>
  <% end %>
</div>
```

```erb
<!-- app/views/articles/_article.html.erb -->
<article class="article-card" id="<%= dom_id(article) %>">
  <header>
    <h2><%= link_to article.title, article %></h2>
    <div class="meta">
      <span class="author">
        <%= image_tag article.user.avatar_url, class: 'avatar' %>
        <%= article.user.name %>
      </span>
      <time datetime="<%= article.created_at.iso8601 %>">
        <%= l article.created_at, format: :long %>
      </time>
      <span class="views"><%= article.views_count %> 次阅读</span>
    </div>
  </header>

  <div class="content">
    <%= truncate(strip_tags(article.content), length: 200) %>
  </div>

  <footer>
    <div class="tags">
      <% article.tags.each do |tag| %>
        <%= link_to tag.name, tag_path(tag), class: 'tag' %>
      <% end %>
    </div>

    <div class="actions">
      <%= link_to '阅读全文', article, class: 'btn' %>
      <% if can_edit?(article) %>
        <%= link_to '编辑', edit_article_path(article), class: 'btn btn-secondary' %>
        <%= button_to '删除', article, method: :delete,
            class: 'btn btn-danger',
            data: { confirm: '确定要删除这篇文章吗？' } %>
      <% end %>
    </div>
  </footer>
</article>
```

### 表单构建

```erb
<!-- app/views/articles/_form.html.erb -->
<%= form_with model: @article, local: true, class: 'article-form' do |f| %>
  <% if @article.errors.any? %>
    <div class="error-messages">
      <h3>保存失败，请检查以下错误：</h3>
      <ul>
        <% @article.errors.full_messages.each do |message| %>
          <li><%= message %></li>
        <% end %>
      </ul>
    </div>
  <% end %>

  <div class="form-group">
    <%= f.label :title, '标题' %>
    <%= f.text_field :title, class: 'form-control', autofocus: true %>
  </div>

  <div class="form-group">
    <%= f.label :content, '内容' %>
    <%= f.text_area :content, class: 'form-control', rows: 15 %>
  </div>

  <div class="form-group">
    <%= f.label :status, '状态' %>
    <%= f.select :status, Article.statuses.keys.map { |s| [t("article.status.#{s}"), s] },
        {}, class: 'form-control' %>
  </div>

  <div class="form-group">
    <%= f.label :tag_ids, '标签' %>
    <%= f.collection_check_boxes :tag_ids, Tag.all, :id, :name do |b| %>
      <div class="checkbox">
        <%= b.check_box %>
        <%= b.label %>
      </div>
    <% end %>
  </div>

  <div class="form-group">
    <%= f.label :published_at, '发布时间' %>
    <%= f.datetime_local_field :published_at, class: 'form-control' %>
  </div>

  <div class="form-actions">
    <%= f.submit @article.persisted? ? '更新文章' : '创建文章',
        class: 'btn btn-primary' %>
    <%= link_to '取消', articles_path, class: 'btn btn-secondary' %>
  </div>
<% end %>
```

### 布局与局部视图

```erb
<!-- app/views/layouts/application.html.erb -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><%= content_for?(:title) ? yield(:title) : '我的博客' %></title>
    <meta name="description" content="<%= content_for?(:description) ? yield(:description) : '一个 Rails 博客' %>">

    <%= csrf_meta_tags %>
    <%= csp_meta_tag %>

    <%= stylesheet_link_tag 'application', media: 'all', 'data-turbo-track': 'reload' %>
    <%= javascript_importmap_tags %>
  </head>

  <body class="<%= controller_name %> <%= action_name %>">
    <%= render 'shared/header' %>

    <main class="container">
      <%= render 'shared/flash_messages' %>
      <%= yield %>
    </main>

    <%= render 'shared/footer' %>
  </body>
</html>
```

```erb
<!-- app/views/shared/_flash_messages.html.erb -->
<% flash.each do |type, message| %>
  <div class="alert alert-<%= type == 'notice' ? 'success' : 'danger' %>"
       role="alert"
       data-controller="alert"
       data-alert-dismiss-after-value="5000">
    <%= message %>
    <button type="button" class="close" data-action="alert#dismiss">
      <span>&times;</span>
    </button>
  </div>
<% end %>
```

### 视图助手方法

```ruby
# app/helpers/articles_helper.rb
module ArticlesHelper
  def article_status_badge(article)
    status_classes = {
      'draft' => 'badge-secondary',
      'published' => 'badge-success',
      'archived' => 'badge-warning'
    }

    content_tag :span,
                t("article.status.#{article.status}"),
                class: "badge #{status_classes[article.status]}"
  end

  def reading_time(article)
    words_per_minute = 200
    words = article.content.split.size
    minutes = (words / words_per_minute.to_f).ceil
    "#{minutes} 分钟阅读"
  end

  def markdown_to_html(text)
    return '' if text.blank?

    renderer = Redcarpet::Render::HTML.new(
      hard_wrap: true,
      link_attributes: { target: '_blank', rel: 'noopener' }
    )
    markdown = Redcarpet::Markdown.new(renderer, {
      autolink: true,
      tables: true,
      fenced_code_blocks: true,
      strikethrough: true
    })

    sanitize(markdown.render(text), tags: %w[p br h1 h2 h3 h4 h5 h6 a img ul ol li code pre blockquote strong em])
  end

  def can_edit?(article)
    user_signed_in? && (current_user == article.user || current_user.admin?)
  end
end
```

## 数据库迁移

### 创建迁移

```bash
# 创建模型和迁移
rails generate model Article title:string content:text status:integer user:references

# 只创建迁移
rails generate migration AddViewsCountToArticles views_count:integer

# 创建索引迁移
rails generate migration AddIndexToArticlesTitle

# 运行迁移
rails db:migrate

# 回滚迁移
rails db:rollback
rails db:rollback STEP=3

# 重置数据库
rails db:reset          # drop + create + migrate + seed
rails db:migrate:reset  # drop + create + migrate
```

### 迁移文件示例

```ruby
# db/migrate/20240115000001_create_articles.rb
class CreateArticles < ActiveRecord::Migration[7.1]
  def change
    create_table :articles do |t|
      t.string :title, null: false, limit: 200
      t.text :content, null: false
      t.string :slug, null: false
      t.integer :status, default: 0, null: false
      t.integer :views_count, default: 0, null: false
      t.datetime :published_at
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :articles, :slug, unique: true
    add_index :articles, :status
    add_index :articles, :published_at
    add_index :articles, [:user_id, :created_at]
  end
end
```

```ruby
# db/migrate/20240115000002_create_tags.rb
class CreateTags < ActiveRecord::Migration[7.1]
  def change
    create_table :tags do |t|
      t.string :name, null: false
      t.string :slug, null: false
      t.integer :articles_count, default: 0

      t.timestamps
    end

    add_index :tags, :slug, unique: true

    create_table :taggings do |t|
      t.references :article, null: false, foreign_key: true
      t.references :tag, null: false, foreign_key: true

      t.timestamps
    end

    add_index :taggings, [:article_id, :tag_id], unique: true
  end
end
```

```ruby
# db/migrate/20240115000003_add_fields_to_users.rb
class AddFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :bio, :text
    add_column :users, :avatar_url, :string
    add_column :users, :role, :integer, default: 0, null: false
    add_column :users, :api_token, :string

    add_index :users, :api_token, unique: true
    add_index :users, :role

    # 更改现有列
    change_column :users, :name, :string, limit: 100

    # 重命名列
    rename_column :users, :username, :login
  end

  # 如果需要不可逆的操作，使用 up/down 方法
  def up
    execute <<-SQL
      UPDATE users SET role = 1 WHERE admin = true;
    SQL
    remove_column :users, :admin
  end

  def down
    add_column :users, :admin, :boolean, default: false
    execute <<-SQL
      UPDATE users SET admin = true WHERE role = 1;
    SQL
  end
end
```

### 种子数据

```ruby
# db/seeds.rb
puts "清理旧数据..."
Tagging.destroy_all
Comment.destroy_all
Article.destroy_all
Tag.destroy_all
User.destroy_all

puts "创建用户..."
admin = User.create!(
  email: 'admin@example.com',
  password: 'password123',
  name: '管理员',
  role: :admin
)

users = 5.times.map do |i|
  User.create!(
    email: "user#{i + 1}@example.com",
    password: 'password123',
    name: "用户#{i + 1}",
    role: :member
  )
end

puts "创建标签..."
tags = %w[Ruby Rails JavaScript React Vue Python Django].map do |name|
  Tag.create!(name: name, slug: name.downcase)
end

puts "创建文章..."
[admin, *users].each do |user|
  rand(3..8).times do
    article = user.articles.create!(
      title: "#{Faker::Lorem.sentence(word_count: 5)}",
      content: Faker::Lorem.paragraphs(number: 10).join("\n\n"),
      status: %w[draft published published published archived].sample,
      published_at: rand(1..30).days.ago
    )

    article.tags << tags.sample(rand(1..3))

    rand(0..5).times do
      article.comments.create!(
        user: users.sample,
        content: Faker::Lorem.paragraph
      )
    end
  end
end

puts "种子数据创建完成！"
puts "- #{User.count} 个用户"
puts "- #{Article.count} 篇文章"
puts "- #{Tag.count} 个标签"
puts "- #{Comment.count} 条评论"
```

## 测试

### 模型测试

```ruby
# test/models/article_test.rb
require 'test_helper'

class ArticleTest < ActiveSupport::TestCase
  def setup
    @user = users(:john)
    @article = Article.new(
      title: '测试文章',
      content: '这是测试内容',
      user: @user
    )
  end

  test "有效的文章" do
    assert @article.valid?
  end

  test "标题不能为空" do
    @article.title = nil
    assert_not @article.valid?
    assert_includes @article.errors[:title], "can't be blank"
  end

  test "标题长度至少为5个字符" do
    @article.title = "abc"
    assert_not @article.valid?
  end

  test "slug 自动生成" do
    @article.title = "Hello World"
    @article.save
    assert_equal "hello-world", @article.slug
  end

  test "published scope 只返回已发布文章" do
    published = articles(:published_article)
    draft = articles(:draft_article)

    results = Article.published

    assert_includes results, published
    assert_not_includes results, draft
  end
end
```

### 控制器测试

```ruby
# test/controllers/articles_controller_test.rb
require 'test_helper'

class ArticlesControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  def setup
    @user = users(:john)
    @article = articles(:published_article)
  end

  test "获取文章列表" do
    get articles_url
    assert_response :success
    assert_select 'article.article-card'
  end

  test "获取文章详情" do
    get article_url(@article)
    assert_response :success
    assert_select 'h1', @article.title
  end

  test "未登录用户不能创建文章" do
    assert_no_difference 'Article.count' do
      post articles_url, params: {
        article: { title: '新文章', content: '内容' }
      }
    end
    assert_redirected_to new_user_session_url
  end

  test "登录用户可以创建文章" do
    sign_in @user

    assert_difference 'Article.count', 1 do
      post articles_url, params: {
        article: { title: '新的测试文章', content: '这是文章内容' }
      }
    end

    assert_redirected_to article_url(Article.last)
    follow_redirect!
    assert_select '.notice', '文章创建成功！'
  end

  test "只有作者可以编辑文章" do
    other_user = users(:jane)
    sign_in other_user

    patch article_url(@article), params: {
      article: { title: '修改后的标题' }
    }

    assert_redirected_to articles_url
    assert_equal '没有权限执行此操作', flash[:alert]
  end
end
```

### 系统测试（集成测试）

```ruby
# test/system/articles_test.rb
require 'application_system_test_case'

class ArticlesTest < ApplicationSystemTestCase
  include Devise::Test::IntegrationHelpers

  def setup
    @user = users(:john)
  end

  test "浏览文章列表" do
    visit articles_url

    assert_selector 'h1', text: '文章列表'
    assert_selector '.article-card', minimum: 1
  end

  test "创建新文章" do
    sign_in @user
    visit new_article_url

    fill_in '标题', with: 'Capybara 测试文章'
    fill_in '内容', with: '这是使用 Capybara 进行系统测试的文章内容。'
    select '已发布', from: '状态'

    click_on '创建文章'

    assert_text '文章创建成功！'
    assert_text 'Capybara 测试文章'
  end

  test "搜索文章" do
    visit articles_url

    fill_in placeholder: '搜索文章...', with: 'Ruby'
    click_on '搜索'

    assert_current_path search_articles_path(q: 'Ruby')
  end

  test "删除文章需要确认" do
    sign_in @user
    @article = @user.articles.create!(title: '待删除文章', content: '内容')

    visit article_url(@article)

    accept_confirm do
      click_on '删除'
    end

    assert_text '文章已删除'
    assert_current_path articles_path
  end
end
```

## 部署

### 生产环境配置

```ruby
# config/environments/production.rb
Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  # 静态文件服务（Nginx 通常会处理）
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # 资源编译
  config.assets.compile = false

  # 日志级别
  config.log_level = :info
  config.log_tags = [:request_id]

  # 使用不同的日志格式
  config.log_formatter = ::Logger::Formatter.new

  # 使用 Redis 缓存
  config.cache_store = :redis_cache_store, {
    url: ENV['REDIS_URL'],
    expires_in: 1.hour
  }

  # Action Cable 配置
  config.action_cable.allowed_request_origins = [
    'https://yourdomain.com'
  ]

  # 强制 SSL
  config.force_ssl = true

  # 邮件配置
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.smtp_settings = {
    address: ENV['SMTP_ADDRESS'],
    port: ENV['SMTP_PORT'],
    user_name: ENV['SMTP_USERNAME'],
    password: ENV['SMTP_PASSWORD'],
    authentication: 'plain',
    enable_starttls_auto: true
  }
end
```

### 数据库配置

```yaml
# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: myapp_development

test:
  <<: *default
  database: myapp_test

production:
  <<: *default
  url: <%= ENV['DATABASE_URL'] %>
```

### Docker 部署

```dockerfile
# Dockerfile
FROM ruby:3.2-slim

# 安装依赖
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs npm && \
    npm install -g yarn && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 Gems
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle install

# 复制应用代码
COPY . .

# 预编译资源
RUN SECRET_KEY_BASE=dummy bundle exec rails assets:precompile

# 设置环境变量
ENV RAILS_ENV=production
ENV RAILS_LOG_TO_STDOUT=true

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
      - DATABASE_URL=postgresql://postgres:password@db/myapp_production
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - RAILS_ENV=production
    depends_on:
      - db
      - redis
    command: bundle exec puma -C config/puma.rb

  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp_production

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  sidekiq:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:password@db/myapp_production
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - RAILS_ENV=production
    depends_on:
      - db
      - redis
    command: bundle exec sidekiq

volumes:
  postgres_data:
  redis_data:
```

### Capistrano 部署

```ruby
# Gemfile
group :development do
  gem 'capistrano', '~> 3.17'
  gem 'capistrano-rails', '~> 1.6'
  gem 'capistrano-rbenv', '~> 2.2'
  gem 'capistrano-bundler', '~> 2.1'
  gem 'capistrano3-puma', '~> 5.2'
end
```

```ruby
# config/deploy.rb
lock "~> 3.17"

set :application, "myapp"
set :repo_url, "git@github.com:username/myapp.git"
set :deploy_to, "/var/www/myapp"
set :branch, ENV['BRANCH'] || 'main'

set :rbenv_ruby, '3.2.0'

append :linked_files, 'config/database.yml', 'config/master.key'
append :linked_dirs, 'log', 'tmp/pids', 'tmp/cache', 'tmp/sockets',
                     'public/system', 'storage'

set :keep_releases, 5

set :puma_threads, [4, 16]
set :puma_workers, 2

namespace :deploy do
  desc '重启应用'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      invoke 'puma:restart'
    end
  end

  after :finishing, :cleanup
  after :finishing, :restart
end
```

## 常用 Gems 推荐

### 核心功能

```ruby
# Gemfile

# 用户认证
gem 'devise', '~> 4.9'

# 授权
gem 'pundit', '~> 2.3'
# 或
gem 'cancancan', '~> 3.5'

# 分页
gem 'kaminari', '~> 1.2'
# 或
gem 'pagy', '~> 6.0'

# 后台任务
gem 'sidekiq', '~> 7.1'
gem 'sidekiq-scheduler', '~> 5.0'

# 文件上传
gem 'carrierwave', '~> 3.0'
# 或使用 Active Storage（Rails 内置）

# 全文搜索
gem 'elasticsearch-model', '~> 8.0'
gem 'elasticsearch-rails', '~> 8.0'
# 或
gem 'pg_search', '~> 2.3'

# 状态机
gem 'aasm', '~> 5.5'

# Markdown 解析
gem 'redcarpet', '~> 3.6'

# API 序列化
gem 'active_model_serializers', '~> 0.10'
# 或
gem 'jbuilder', '~> 2.11'

# 软删除
gem 'paranoia', '~> 2.6'

# 版本管理/审计
gem 'paper_trail', '~> 14.0'
```

### 开发与调试

```ruby
group :development, :test do
  # 调试
  gem 'debug', platforms: %i[mri mingw x64_mingw]
  gem 'pry-rails'

  # 测试数据
  gem 'factory_bot_rails'
  gem 'faker'

  # 测试框架
  gem 'rspec-rails', '~> 6.0'
  gem 'capybara'
  gem 'selenium-webdriver'
end

group :development do
  # 代码质量
  gem 'rubocop', require: false
  gem 'rubocop-rails', require: false
  gem 'rubocop-rspec', require: false

  # 安全检查
  gem 'brakeman', require: false

  # 性能分析
  gem 'bullet'
  gem 'rack-mini-profiler'

  # 更好的错误页面
  gem 'better_errors'
  gem 'binding_of_caller'

  # 邮件预览
  gem 'letter_opener'
end
```

## 最佳实践

### 代码组织

```ruby
# 使用 Service Object 处理复杂业务逻辑
# app/services/article_publisher.rb
class ArticlePublisher
  def initialize(article, user)
    @article = article
    @user = user
  end

  def call
    return failure('文章不存在') unless @article
    return failure('没有权限') unless can_publish?

    ActiveRecord::Base.transaction do
      @article.update!(status: 'published', published_at: Time.current)
      notify_subscribers
      update_search_index
    end

    success
  rescue ActiveRecord::RecordInvalid => e
    failure(e.message)
  end

  private

  def can_publish?
    @user == @article.user || @user.admin?
  end

  def notify_subscribers
    @article.user.followers.each do |follower|
      ArticleMailer.new_article_notification(follower, @article).deliver_later
    end
  end

  def update_search_index
    ArticleSearchIndexJob.perform_later(@article.id)
  end

  def success
    OpenStruct.new(success?: true, article: @article)
  end

  def failure(message)
    OpenStruct.new(success?: false, error: message)
  end
end

# 在控制器中使用
def publish
  result = ArticlePublisher.new(@article, current_user).call

  if result.success?
    redirect_to result.article, notice: '文章已发布！'
  else
    redirect_to @article, alert: result.error
  end
end
```

### 性能优化

```ruby
# 使用 includes 避免 N+1 查询
# 差的做法
Article.all.each { |a| puts a.user.name }  # N+1 查询

# 好的做法
Article.includes(:user).each { |a| puts a.user.name }  # 2 次查询

# 使用 counter_cache
class Comment < ApplicationRecord
  belongs_to :article, counter_cache: true
end

# 使用缓存
class Article < ApplicationRecord
  def cached_comments_count
    Rails.cache.fetch("#{cache_key_with_version}/comments_count") do
      comments.count
    end
  end
end

# 片段缓存
<% cache article do %>
  <%= render article %>
<% end %>

# 使用 select 只查询需要的字段
Article.select(:id, :title, :created_at).limit(10)

# 批量处理大数据
Article.find_each(batch_size: 1000) do |article|
  # 处理每篇文章
end
```

### 安全最佳实践

```ruby
# 始终使用强参数
def article_params
  params.require(:article).permit(:title, :content, :status)
end

# 防止 SQL 注入
# 差的做法
Article.where("title = '#{params[:title]}'")  # SQL 注入风险！

# 好的做法
Article.where(title: params[:title])
Article.where("title = ?", params[:title])

# 使用 CSRF 保护（Rails 默认开启）
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end

# 输出转义（Rails 默认开启）
<%= @article.content %>  # 自动转义 HTML
<%== @article.content %> # 不转义（谨慎使用）

# 使用 has_secure_password
class User < ApplicationRecord
  has_secure_password
end

# 限制批量赋值
class User < ApplicationRecord
  # 永远不要通过批量赋值设置 admin 属性
  attr_readonly :admin
end
```

## 总结

Ruby on Rails 是一个功能强大且高效的 Web 开发框架。通过遵循"约定优于配置"和"DRY"原则，Rails 能够帮助开发者快速构建高质量的 Web 应用。

关键要点回顾：

1. **MVC 架构**：清晰分离数据、逻辑和展示层
2. **Active Record**：强大的 ORM，简化数据库操作
3. **RESTful 路由**：标准化的 URL 设计
4. **数据库迁移**：版本化的数据库结构管理
5. **丰富的生态系统**：大量的 Gems 可以扩展功能
6. **内置测试支持**：便于编写高质量的测试代码

Rails 特别适合：
- 快速原型开发
- 中小型 Web 应用
- 内容管理系统
- 电子商务平台
- API 后端服务

开始学习 Rails 的最佳方式是动手实践。创建一个简单的博客或待办事项应用，逐步熟悉 Rails 的各个组件和约定。随着经验的积累，你会发现 Rails 能够让 Web 开发变得更加高效和愉快。
