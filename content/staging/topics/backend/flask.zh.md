---
title: Flask Web框架
description: Python Flask微框架完全指南，路由、模板、蓝图与RESTful API开发
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - Flask
  - Web框架
  - RESTful API
status: imported
origin: old/src/content/docs/python/flask.zh.md
divergence: 0.163
issues: []
legacy:
  category: Python
  subcategory: Web开发
  order: 20
  lastUpdated: 2026-01-07
---

Flask 是一个轻量级的 Python Web 微框架，由 Armin Ronacher 开发。它的设计理念是保持核心简单而可扩展，让开发者能够快速构建 Web 应用，同时保持代码的灵活性和可维护性。

## Flask 简介

### 什么是微框架？

Flask 被称为"微框架"，但这并不意味着它的功能有限。"微"指的是 Flask 的核心保持简单，不强制使用特定的数据库、表单验证或其他组件。开发者可以根据项目需求选择合适的扩展。

### Flask 的特点

- **轻量级**：核心代码简洁，易于理解和学习
- **灵活性**：不强制项目结构，开发者自由度高
- **可扩展**：丰富的扩展生态系统
- **Jinja2 模板**：强大的模板引擎
- **Werkzeug**：底层 WSGI 工具库提供可靠支持
- **RESTful 友好**：天然适合构建 API

### 安装 Flask

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装 Flask
pip install flask
```

## 第一个 Flask 应用

让我们从最简单的 Flask 应用开始：

```python
from flask import Flask

# 创建 Flask 应用实例
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, Flask!'

@app.route('/about')
def about():
    return '这是关于页面'

if __name__ == '__main__':
    app.run(debug=True)
```

运行应用：

```bash
python app.py
# 或使用 Flask CLI
flask run
```

访问 `http://127.0.0.1:5000/` 即可看到结果。

## 路由系统

Flask 的路由系统非常直观，使用装饰器定义 URL 规则。

### 基本路由

```python
from flask import Flask

app = Flask(__name__)

# 静态路由
@app.route('/')
def index():
    return '首页'

# 带斜杠的路由（推荐）
@app.route('/users/')
def users():
    return '用户列表'

# 不带斜杠的路由
@app.route('/about')
def about():
    return '关于我们'
```

### 动态路由

```python
# 字符串参数（默认）
@app.route('/user/<username>')
def show_user(username):
    return f'用户: {username}'

# 整数参数
@app.route('/post/<int:post_id>')
def show_post(post_id):
    return f'文章 ID: {post_id}'

# 浮点数参数
@app.route('/price/<float:amount>')
def show_price(amount):
    return f'价格: {amount}'

# 路径参数（可包含斜杠）
@app.route('/files/<path:filepath>')
def show_file(filepath):
    return f'文件路径: {filepath}'

# UUID 参数
@app.route('/item/<uuid:item_id>')
def show_item(item_id):
    return f'商品 UUID: {item_id}'
```

### HTTP 方法

```python
from flask import Flask, request

app = Flask(__name__)

# 支持多种 HTTP 方法
@app.route('/api/resource', methods=['GET', 'POST', 'PUT', 'DELETE'])
def handle_resource():
    if request.method == 'GET':
        return '获取资源'
    elif request.method == 'POST':
        return '创建资源'
    elif request.method == 'PUT':
        return '更新资源'
    elif request.method == 'DELETE':
        return '删除资源'

# 使用快捷装饰器（Flask 2.0+）
@app.get('/items')
def get_items():
    return '获取所有项目'

@app.post('/items')
def create_item():
    return '创建新项目'

@app.put('/items/<int:id>')
def update_item(id):
    return f'更新项目 {id}'

@app.delete('/items/<int:id>')
def delete_item(id):
    return f'删除项目 {id}'
```

### URL 构建

```python
from flask import Flask, url_for

app = Flask(__name__)

@app.route('/')
def index():
    return '首页'

@app.route('/user/<username>')
def profile(username):
    return f'{username} 的个人主页'

@app.route('/login')
def login():
    return '登录页面'

with app.test_request_context():
    print(url_for('index'))                    # /
    print(url_for('login'))                    # /login
    print(url_for('profile', username='张三'))  # /user/张三
    print(url_for('static', filename='style.css'))  # /static/style.css
```

## 请求与响应

### 请求对象

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/search')
def search():
    # 获取查询参数
    keyword = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    return f'搜索: {keyword}, 页码: {page}'

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # 获取表单数据
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False, type=bool)

        # 验证逻辑
        if username and password:
            return f'欢迎, {username}!'
        return '用户名和密码不能为空', 400

    return '''
        <form method="post">
            <input name="username" placeholder="用户名">
            <input name="password" type="password" placeholder="密码">
            <button type="submit">登录</button>
        </form>
    '''

@app.route('/api/data', methods=['POST'])
def receive_data():
    # 获取 JSON 数据
    data = request.get_json()
    if data is None:
        return {'error': '无效的 JSON 数据'}, 400

    name = data.get('name')
    email = data.get('email')
    return {'received': {'name': name, 'email': email}}

@app.route('/upload', methods=['POST'])
def upload_file():
    # 文件上传
    if 'file' not in request.files:
        return '没有文件', 400

    file = request.files['file']
    if file.filename == '':
        return '没有选择文件', 400

    # 保存文件
    file.save(f'./uploads/{file.filename}')
    return f'文件 {file.filename} 上传成功'

@app.route('/info')
def request_info():
    # 获取请求信息
    info = {
        'method': request.method,
        'url': request.url,
        'path': request.path,
        'host': request.host,
        'remote_addr': request.remote_addr,
        'user_agent': str(request.user_agent),
        'content_type': request.content_type,
        'headers': dict(request.headers)
    }
    return info
```

### 响应对象

```python
from flask import Flask, make_response, jsonify, redirect, url_for

app = Flask(__name__)

@app.route('/text')
def text_response():
    # 简单文本响应
    return '纯文本内容'

@app.route('/html')
def html_response():
    # HTML 响应
    return '<h1>HTML 页面</h1><p>这是段落</p>'

@app.route('/json')
def json_response():
    # JSON 响应（推荐使用 jsonify）
    data = {
        'name': '张三',
        'age': 25,
        'skills': ['Python', 'Flask', 'JavaScript']
    }
    return jsonify(data)

@app.route('/custom')
def custom_response():
    # 自定义响应
    response = make_response('自定义响应内容')
    response.status_code = 200
    response.headers['X-Custom-Header'] = 'CustomValue'
    response.headers['Content-Type'] = 'text/plain; charset=utf-8'
    return response

@app.route('/cookie')
def set_cookie():
    # 设置 Cookie
    response = make_response('Cookie 已设置')
    response.set_cookie(
        'user_id',
        '12345',
        max_age=3600,  # 1小时
        httponly=True,
        secure=True
    )
    return response

@app.route('/redirect-example')
def redirect_example():
    # 重定向
    return redirect(url_for('index'))

@app.route('/status')
def status_response():
    # 返回特定状态码
    return '资源已创建', 201

@app.route('/tuple-response')
def tuple_response():
    # 元组形式的响应 (body, status, headers)
    return (
        jsonify({'message': '成功'}),
        200,
        {'X-Request-Id': 'abc123'}
    )
```

## Jinja2 模板引擎

Flask 集成了 Jinja2 模板引擎，用于生成动态 HTML 内容。

### 基本用法

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/profile/<username>')
def profile(username):
    user_data = {
        'username': username,
        'email': f'{username}@example.com',
        'posts': [
            {'title': '第一篇文章', 'date': '2024-01-15'},
            {'title': '第二篇文章', 'date': '2024-01-20'},
            {'title': '第三篇文章', 'date': '2024-01-25'}
        ]
    }
    return render_template('profile.html', user=user_data)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    results = []
    if query:
        # 模拟搜索结果
        results = [f'{query} 相关结果 #{i}' for i in range(1, 6)]
    return render_template('search.html', query=query, results=results)
```

### 模板文件结构

```
my_app/
├── app.py
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── profile.html
│   └── search.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

### 基础模板（base.html）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}我的网站{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    {% block extra_css %}{% endblock %}
</head>
<body>
    <nav>
        <a href="{{ url_for('index') }}">首页</a>
        <a href="{{ url_for('about') }}">关于</a>
        {% if current_user %}
            <a href="{{ url_for('profile', username=current_user.username) }}">
                {{ current_user.username }}
            </a>
            <a href="{{ url_for('logout') }}">退出</a>
        {% else %}
            <a href="{{ url_for('login') }}">登录</a>
            <a href="{{ url_for('register') }}">注册</a>
        {% endif %}
    </nav>

    <main>
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ category }}">{{ message }}</div>
                {% endfor %}
            {% endif %}
        {% endwith %}

        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; 2024 我的网站</p>
    </footer>

    <script src="{{ url_for('static', filename='js/app.js') }}"></script>
    {% block extra_js %}{% endblock %}
</body>
</html>
```

### 子模板（profile.html）

```html
{% extends "base.html" %}

{% block title %}{{ user.username }} 的个人主页{% endblock %}

{% block content %}
<div class="profile">
    <h1>{{ user.username }}</h1>
    <p>邮箱: {{ user.email }}</p>

    <h2>文章列表</h2>
    {% if user.posts %}
        <ul class="posts">
        {% for post in user.posts %}
            <li>
                <a href="{{ url_for('post_detail', id=post.id) }}">
                    {{ post.title }}
                </a>
                <span class="date">{{ post.date }}</span>
            </li>
        {% endfor %}
        </ul>
    {% else %}
        <p>暂无文章</p>
    {% endif %}
</div>
{% endblock %}
```

### 模板语法详解

```html
{# 这是注释 #}

{# 变量输出 #}
<p>用户名: {{ username }}</p>
<p>{{ user.name }} 或 {{ user['name'] }}</p>

{# 过滤器 #}
<p>{{ name|upper }}</p>           {# 大写 #}
<p>{{ name|lower }}</p>           {# 小写 #}
<p>{{ name|title }}</p>           {# 标题格式 #}
<p>{{ name|capitalize }}</p>      {# 首字母大写 #}
<p>{{ text|truncate(50) }}</p>    {# 截断 #}
<p>{{ list|length }}</p>          {# 长度 #}
<p>{{ list|join(', ') }}</p>      {# 连接 #}
<p>{{ html_content|safe }}</p>    {# 不转义HTML #}
<p>{{ price|round(2) }}</p>       {# 四舍五入 #}
<p>{{ date|default('未知') }}</p>  {# 默认值 #}

{# 条件语句 #}
{% if user.is_admin %}
    <p>管理员面板</p>
{% elif user.is_staff %}
    <p>员工面板</p>
{% else %}
    <p>普通用户</p>
{% endif %}

{# 循环语句 #}
<ul>
{% for item in items %}
    <li>
        {{ loop.index }}: {{ item.name }}
        {% if loop.first %}(第一个){% endif %}
        {% if loop.last %}(最后一个){% endif %}
    </li>
{% else %}
    <li>列表为空</li>
{% endfor %}
</ul>

{# 循环变量 #}
{# loop.index    - 当前迭代次数（从1开始）#}
{# loop.index0   - 当前迭代次数（从0开始）#}
{# loop.first    - 是否是第一次迭代 #}
{# loop.last     - 是否是最后一次迭代 #}
{# loop.length   - 序列长度 #}

{# 宏定义 #}
{% macro input(name, type='text', value='', placeholder='') %}
    <input type="{{ type }}"
           name="{{ name }}"
           value="{{ value }}"
           placeholder="{{ placeholder }}">
{% endmacro %}

{# 使用宏 #}
{{ input('username', placeholder='请输入用户名') }}
{{ input('password', type='password', placeholder='请输入密码') }}

{# 导入宏 #}
{% from "macros.html" import input, textarea %}

{# 包含其他模板 #}
{% include "sidebar.html" %}
{% include "footer.html" ignore missing %}
```

### 自定义过滤器和函数

```python
from flask import Flask
from datetime import datetime

app = Flask(__name__)

# 自定义过滤器
@app.template_filter('datetime_format')
def datetime_format(value, format='%Y年%m月%d日'):
    if isinstance(value, str):
        value = datetime.fromisoformat(value)
    return value.strftime(format)

@app.template_filter('file_size')
def file_size_format(size):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024:
            return f'{size:.1f} {unit}'
        size /= 1024
    return f'{size:.1f} TB'

# 自定义全局函数
@app.context_processor
def utility_processor():
    def format_price(amount, currency='¥'):
        return f'{currency}{amount:,.2f}'

    return dict(format_price=format_price)

# 在模板中使用
# {{ post.created_at|datetime_format }}
# {{ file.size|file_size }}
# {{ format_price(99.99) }}
```

## 蓝图（Blueprints）

蓝图用于组织大型 Flask 应用，将相关功能模块化。

### 创建蓝图

```python
# blueprints/auth.py
from flask import Blueprint, render_template, request, redirect, url_for

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # 验证逻辑
        return redirect(url_for('main.index'))
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # 注册逻辑
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')

@auth_bp.route('/logout')
def logout():
    # 登出逻辑
    return redirect(url_for('main.index'))
```

```python
# blueprints/main.py
from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/about')
def about():
    return render_template('about.html')
```

```python
# blueprints/api.py
from flask import Blueprint, jsonify, request

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route('/users')
def get_users():
    users = [
        {'id': 1, 'name': '张三'},
        {'id': 2, 'name': '李四'}
    ]
    return jsonify(users)

@api_bp.route('/users/<int:user_id>')
def get_user(user_id):
    return jsonify({'id': user_id, 'name': f'用户{user_id}'})
```

### 注册蓝图

```python
# app.py
from flask import Flask
from blueprints.auth import auth_bp
from blueprints.main import main_bp
from blueprints.api import api_bp

def create_app():
    app = Flask(__name__)

    # 注册蓝图
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
```

### 带静态文件和模板的蓝图

```python
from flask import Blueprint, render_template, abort
from jinja2 import TemplateNotFound

# 蓝图配置独立的模板和静态文件目录
admin_bp = Blueprint(
    'admin',
    __name__,
    url_prefix='/admin',
    template_folder='templates',
    static_folder='static',
    static_url_path='/admin/static'
)

@admin_bp.route('/', defaults={'page': 'index'})
@admin_bp.route('/<page>')
def show(page):
    try:
        return render_template(f'admin/{page}.html')
    except TemplateNotFound:
        abort(404)
```

## RESTful API 开发

Flask 非常适合构建 RESTful API。

### 基础 API 示例

```python
from flask import Flask, jsonify, request, abort

app = Flask(__name__)

# 模拟数据存储
users = [
    {'id': 1, 'name': '张三', 'email': 'zhangsan@example.com'},
    {'id': 2, 'name': '李四', 'email': 'lisi@example.com'}
]

def find_user(user_id):
    return next((u for u in users if u['id'] == user_id), None)

# 获取所有用户
@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify({
        'users': users,
        'count': len(users)
    })

# 获取单个用户
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = find_user(user_id)
    if user is None:
        abort(404, description='用户不存在')
    return jsonify(user)

# 创建用户
@app.route('/api/users', methods=['POST'])
def create_user():
    if not request.json:
        abort(400, description='请求必须是 JSON 格式')

    if 'name' not in request.json:
        abort(400, description='缺少必填字段: name')

    new_user = {
        'id': max(u['id'] for u in users) + 1 if users else 1,
        'name': request.json['name'],
        'email': request.json.get('email', '')
    }
    users.append(new_user)
    return jsonify(new_user), 201

# 更新用户
@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = find_user(user_id)
    if user is None:
        abort(404, description='用户不存在')

    if not request.json:
        abort(400, description='请求必须是 JSON 格式')

    user['name'] = request.json.get('name', user['name'])
    user['email'] = request.json.get('email', user['email'])
    return jsonify(user)

# 删除用户
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = find_user(user_id)
    if user is None:
        abort(404, description='用户不存在')

    users.remove(user)
    return '', 204

# 自定义错误处理
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': str(error.description)}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': str(error.description)}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500
```

### 使用类视图

```python
from flask import Flask, request, jsonify
from flask.views import MethodView

app = Flask(__name__)

# 模拟数据
books = []

class BookAPI(MethodView):
    def get(self, book_id=None):
        if book_id is None:
            # 返回所有书籍
            return jsonify(books)
        # 返回单本书
        book = next((b for b in books if b['id'] == book_id), None)
        if book is None:
            return jsonify({'error': '书籍不存在'}), 404
        return jsonify(book)

    def post(self):
        data = request.get_json()
        if not data or 'title' not in data:
            return jsonify({'error': '缺少书名'}), 400

        book = {
            'id': len(books) + 1,
            'title': data['title'],
            'author': data.get('author', '未知'),
            'isbn': data.get('isbn', '')
        }
        books.append(book)
        return jsonify(book), 201

    def put(self, book_id):
        book = next((b for b in books if b['id'] == book_id), None)
        if book is None:
            return jsonify({'error': '书籍不存在'}), 404

        data = request.get_json()
        book['title'] = data.get('title', book['title'])
        book['author'] = data.get('author', book['author'])
        book['isbn'] = data.get('isbn', book['isbn'])
        return jsonify(book)

    def delete(self, book_id):
        global books
        book = next((b for b in books if b['id'] == book_id), None)
        if book is None:
            return jsonify({'error': '书籍不存在'}), 404

        books = [b for b in books if b['id'] != book_id]
        return '', 204

# 注册视图
book_view = BookAPI.as_view('book_api')
app.add_url_rule('/api/books', view_func=book_view, methods=['GET', 'POST'])
app.add_url_rule('/api/books/<int:book_id>', view_func=book_view,
                 methods=['GET', 'PUT', 'DELETE'])
```

### API 认证

```python
from flask import Flask, request, jsonify, g
from functools import wraps

app = Flask(__name__)
app.config['API_KEY'] = 'your-secret-api-key'

# API Key 认证装饰器
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != app.config['API_KEY']:
            return jsonify({'error': '无效的 API Key'}), 401
        return f(*args, **kwargs)
    return decorated

# JWT 认证示例
import jwt
from datetime import datetime, timedelta

app.config['SECRET_KEY'] = 'your-secret-key'

def create_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': '缺少认证令牌'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]
            payload = jwt.decode(
                token,
                app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            g.user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': '令牌已过期'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': '无效的令牌'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    # 验证用户（简化示例）
    if data.get('username') == 'admin' and data.get('password') == 'secret':
        token = create_token(user_id=1)
        return jsonify({'token': token})
    return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/api/protected')
@require_auth
def protected():
    return jsonify({
        'message': '这是受保护的资源',
        'user_id': g.user_id
    })

@app.route('/api/data')
@require_api_key
def api_data():
    return jsonify({'data': 'API Key 验证通过'})
```

## 应用工厂模式

应用工厂是构建可测试、可扩展 Flask 应用的最佳实践。

### 项目结构

```
my_app/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── extensions.py
│   ├── blueprints/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── main.py
│   │   └── api.py
│   ├── templates/
│   │   ├── base.html
│   │   └── ...
│   └── static/
│       ├── css/
│       └── js/
├── config.py
├── requirements.txt
└── run.py
```

### 配置文件

```python
# config.py
import os

class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard-to-guess-string'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///dev.db'

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """生产环境配置"""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### 扩展初始化

```python
# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cors = CORS()

login_manager.login_view = 'auth.login'
login_manager.login_message = '请先登录'
```

### 应用工厂

```python
# app/__init__.py
from flask import Flask
from config import config

def create_app(config_name='default'):
    """应用工厂函数"""
    app = Flask(__name__)

    # 加载配置
    app.config.from_object(config[config_name])

    # 初始化扩展
    from app.extensions import db, migrate, login_manager, cors
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cors.init_app(app)

    # 注册蓝图
    from app.blueprints.main import main_bp
    from app.blueprints.auth import auth_bp
    from app.blueprints.api import api_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # 注册错误处理器
    register_error_handlers(app)

    # 注册 CLI 命令
    register_commands(app)

    return app

def register_error_handlers(app):
    @app.errorhandler(404)
    def page_not_found(e):
        return {'error': '页面不存在'}, 404

    @app.errorhandler(500)
    def internal_error(e):
        return {'error': '服务器内部错误'}, 500

def register_commands(app):
    @app.cli.command()
    def init_db():
        """初始化数据库"""
        from app.extensions import db
        db.create_all()
        print('数据库初始化完成')

    @app.cli.command()
    def seed():
        """填充测试数据"""
        # 添加测试数据
        print('测试数据已添加')
```

### 运行文件

```python
# run.py
import os
from app import create_app

config_name = os.environ.get('FLASK_ENV') or 'development'
app = create_app(config_name)

if __name__ == '__main__':
    app.run()
```

## 常用扩展

### Flask-SQLAlchemy（数据库）

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 模型定义
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # 关系
    posts = db.relationship('Post', backref='author', lazy='dynamic')

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# 数据库操作
with app.app_context():
    # 创建表
    db.create_all()

    # 创建用户
    user = User(username='zhangsan', email='zhangsan@example.com')
    db.session.add(user)
    db.session.commit()

    # 查询
    users = User.query.all()
    user = User.query.filter_by(username='zhangsan').first()
    user = User.query.get(1)

    # 更新
    user.email = 'new@example.com'
    db.session.commit()

    # 删除
    db.session.delete(user)
    db.session.commit()
```

### Flask-Login（用户认证）

```python
from flask import Flask, render_template, redirect, url_for, request, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager, UserMixin, login_user, logout_user,
    login_required, current_user
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = '请先登录'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user, remember=request.form.get('remember'))
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))

        flash('用户名或密码错误', 'error')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    return f'欢迎, {current_user.username}!'
```

### Flask-WTF（表单处理）

```python
from flask import Flask, render_template, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SelectField
from wtforms.validators import DataRequired, Email, Length, EqualTo

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

class LoginForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(message='用户名不能为空'),
        Length(min=3, max=20, message='用户名长度需在3-20个字符之间')
    ])
    password = PasswordField('密码', validators=[
        DataRequired(message='密码不能为空')
    ])

class RegisterForm(FlaskForm):
    username = StringField('用户名', validators=[
        DataRequired(),
        Length(min=3, max=20)
    ])
    email = StringField('邮箱', validators=[
        DataRequired(),
        Email(message='请输入有效的邮箱地址')
    ])
    password = PasswordField('密码', validators=[
        DataRequired(),
        Length(min=6, message='密码至少6个字符')
    ])
    confirm = PasswordField('确认密码', validators=[
        DataRequired(),
        EqualTo('password', message='两次密码输入不一致')
    ])

class PostForm(FlaskForm):
    title = StringField('标题', validators=[DataRequired()])
    category = SelectField('分类', choices=[
        ('tech', '技术'),
        ('life', '生活'),
        ('other', '其他')
    ])
    content = TextAreaField('内容', validators=[
        DataRequired(),
        Length(min=10, message='内容至少10个字符')
    ])

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        # 处理登录
        flash('登录成功!', 'success')
        return redirect(url_for('index'))
    return render_template('login.html', form=form)
```

模板中使用表单：

```html
<form method="POST">
    {{ form.hidden_tag() }}

    <div class="form-group">
        {{ form.username.label }}
        {{ form.username(class="form-control") }}
        {% for error in form.username.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    <div class="form-group">
        {{ form.password.label }}
        {{ form.password(class="form-control") }}
        {% for error in form.password.errors %}
            <span class="error">{{ error }}</span>
        {% endfor %}
    </div>

    <button type="submit" class="btn btn-primary">登录</button>
</form>
```

### Flask-CORS（跨域支持）

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# 允许所有来源
CORS(app)

# 或者指定配置
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# 或者在路由级别使用
from flask_cors import cross_origin

@app.route('/api/data')
@cross_origin(origins=['http://localhost:3000'])
def get_data():
    return {'data': 'some data'}
```

## 中间件与钩子

```python
from flask import Flask, request, g
import time

app = Flask(__name__)

# 请求前钩子
@app.before_request
def before_request():
    g.start_time = time.time()
    g.request_id = request.headers.get('X-Request-Id', 'unknown')

# 请求后钩子
@app.after_request
def after_request(response):
    # 计算请求耗时
    if hasattr(g, 'start_time'):
        elapsed = time.time() - g.start_time
        response.headers['X-Response-Time'] = f'{elapsed:.3f}s'
    return response

# 请求完成后清理
@app.teardown_request
def teardown_request(exception):
    # 清理资源
    if hasattr(g, 'db_connection'):
        g.db_connection.close()

# 应用上下文钩子
@app.teardown_appcontext
def teardown_appcontext(exception):
    # 应用上下文清理
    pass

# 第一次请求前
@app.before_first_request
def before_first_request():
    # 初始化操作，只执行一次
    print('应用启动，执行初始化')

# 上下文处理器
@app.context_processor
def inject_globals():
    return {
        'site_name': '我的网站',
        'current_year': 2024
    }
```

## 错误处理

```python
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# 自定义异常
class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        return rv

@app.errorhandler(APIError)
def handle_api_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

# HTTP 错误处理
@app.errorhandler(400)
def bad_request(error):
    if request_wants_json():
        return jsonify({'error': '错误的请求'}), 400
    return render_template('errors/400.html'), 400

@app.errorhandler(404)
def not_found(error):
    if request_wants_json():
        return jsonify({'error': '资源不存在'}), 404
    return render_template('errors/404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    if request_wants_json():
        return jsonify({'error': '服务器内部错误'}), 500
    return render_template('errors/500.html'), 500

def request_wants_json():
    best = request.accept_mimetypes.best_match(
        ['application/json', 'text/html']
    )
    return best == 'application/json'

# 使用自定义异常
@app.route('/api/resource/<int:id>')
def get_resource(id):
    resource = find_resource(id)
    if resource is None:
        raise APIError('资源不存在', status_code=404)
    return jsonify(resource)
```

## 日志配置

```python
from flask import Flask
import logging
from logging.handlers import RotatingFileHandler
import os

app = Flask(__name__)

def configure_logging(app):
    # 创建日志目录
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # 文件处理器
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10240000,  # 10MB
        backupCount=10
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s '
        '[in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    # 添加处理器
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(logging.DEBUG)

configure_logging(app)

@app.route('/test')
def test():
    app.logger.debug('调试信息')
    app.logger.info('普通信息')
    app.logger.warning('警告信息')
    app.logger.error('错误信息')
    return 'OK'
```

## 测试

```python
# tests/conftest.py
import pytest
from app import create_app
from app.extensions import db

@pytest.fixture
def app():
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

# tests/test_api.py
def test_get_users(client):
    response = client.get('/api/v1/users')
    assert response.status_code == 200
    assert 'users' in response.json

def test_create_user(client):
    response = client.post('/api/v1/users', json={
        'name': '测试用户',
        'email': 'test@example.com'
    })
    assert response.status_code == 201
    assert response.json['name'] == '测试用户'

def test_login(client):
    # 先创建用户
    client.post('/auth/register', data={
        'username': 'testuser',
        'password': 'password123'
    })

    # 测试登录
    response = client.post('/auth/login', data={
        'username': 'testuser',
        'password': 'password123'
    }, follow_redirects=True)

    assert response.status_code == 200

def test_protected_route(client):
    # 未登录访问受保护路由
    response = client.get('/dashboard')
    assert response.status_code == 302  # 重定向到登录页
```

## 部署

### 使用 Gunicorn

```bash
# 安装 Gunicorn
pip install gunicorn

# 运行
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"

# 或使用配置文件
gunicorn -c gunicorn.conf.py "app:create_app()"
```

```python
# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"  # 或 "gevent", "eventlet"
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
preload_app = True
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /path/to/your/app/static;
        expires 30d;
    }
}
```

### Docker 部署

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV FLASK_ENV=production
ENV FLASK_APP=app:create_app

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:create_app()"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - SECRET_KEY=your-production-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 最佳实践

### 项目结构规范

```
my_app/
├── app/
│   ├── __init__.py          # 应用工厂
│   ├── extensions.py        # 扩展初始化
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── post.py
│   ├── api/                 # API 蓝图
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── users.py
│   ├── web/                 # Web 蓝图
│   │   ├── __init__.py
│   │   ├── main.py
│   │   └── auth.py
│   ├── services/            # 业务逻辑
│   │   └── user_service.py
│   ├── utils/               # 工具函数
│   │   └── helpers.py
│   ├── templates/
│   └── static/
├── tests/
├── migrations/
├── config.py
├── requirements.txt
└── run.py
```

### 环境变量管理

```python
# 使用 python-dotenv
from dotenv import load_dotenv
load_dotenv()

import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DATABASE_URL = os.environ.get('DATABASE_URL')
```

### 安全注意事项

```python
# 始终设置 SECRET_KEY
app.config['SECRET_KEY'] = os.urandom(24)

# 生产环境关闭调试模式
app.config['DEBUG'] = False

# 使用 HTTPS
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True

# CSRF 保护
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

# 限制请求大小
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# 输入验证
from werkzeug.utils import secure_filename
filename = secure_filename(uploaded_file.filename)
```

## 总结

Flask 作为 Python 生态中最受欢迎的微框架之一，以其简洁、灵活的特点赢得了广大开发者的青睐。本文涵盖了 Flask 开发的核心概念：

- **基础知识**：应用创建、路由系统、请求响应处理
- **模板引擎**：Jinja2 模板语法与继承
- **蓝图模块化**：大型应用的组织方式
- **RESTful API**：构建现代 Web API
- **应用工厂**：可测试、可扩展的应用架构
- **常用扩展**：数据库、认证、表单处理等
- **部署实践**：Gunicorn、Nginx、Docker

Flask 的设计哲学是"让简单的事情保持简单，让复杂的事情成为可能"。掌握了这些核心概念，你就能够构建从简单原型到复杂企业应用的各种 Web 项目。

继续学习的方向：
- Flask 官方文档深入阅读
- Flask-RESTful 或 Flask-RESTX 扩展
- Flask-SocketIO 实时通信
- Celery 异步任务处理
- 微服务架构实践
