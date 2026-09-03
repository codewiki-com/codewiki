---
title: Flask Web Framework
description: Complete guide to Python Flask micro-framework, routing, templates, blueprints and RESTful API development
track: backend
section: http-apis
difficulty: intermediate
tags:
  - Python
  - Flask
  - Web Framework
  - RESTful API
status: imported
origin: old/src/content/docs/python/flask.en.md
divergence: 0.163
issues: []
legacy:
  category: Python
  subcategory: Web Development
  order: 20
  lastUpdated: 2026-01-07
---

Flask is a lightweight WSGI web application framework written in Python. It is designed to make getting started quick and easy, with the ability to scale up to complex applications. Often referred to as a "micro-framework," Flask provides the core essentials for web development while remaining flexible and extensible.

## Key Features

- **Lightweight**: Minimal core with no database abstraction layer or form validation built-in
- **Flexible**: Easy to extend with numerous extensions available
- **Jinja2 Templates**: Powerful templating engine with template inheritance
- **Werkzeug WSGI**: Built on the robust Werkzeug WSGI toolkit
- **RESTful**: Easy to create RESTful APIs
- **Development Server**: Built-in development server with debugger
- **Unit Testing**: Integrated support for unit testing

## Installation

```bash
pip install Flask
```

Optionally, create a virtual environment first:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install Flask
```

## Basic Application

Create a file named `app.py`:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
```

Run the application:

```bash
python app.py
```

Or using the Flask CLI:

```bash
flask --app app run --debug
```

Visit `http://127.0.0.1:5000/` to see your application.

## Routing

Flask uses decorators to bind functions to URLs. Routes define how your application responds to client requests.

### Basic Routes

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return 'Index Page'

@app.route('/hello')
def hello():
    return 'Hello, World!'

@app.route('/about')
def about():
    return 'About Page'
```

### Dynamic Routes with Variables

```python
@app.route('/user/<username>')
def show_user_profile(username):
    return f'User: {username}'

@app.route('/post/<int:post_id>')
def show_post(post_id):
    return f'Post ID: {post_id}'

@app.route('/path/<path:subpath>')
def show_subpath(subpath):
    return f'Subpath: {subpath}'
```

Available converters:
- `string`: (default) accepts any text without a slash
- `int`: accepts positive integers
- `float`: accepts positive floating point values
- `path`: like string but also accepts slashes
- `uuid`: accepts UUID strings

### HTTP Methods

```python
from flask import request

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        return do_login()
    else:
        return show_login_form()

@app.route('/api/users', methods=['GET'])
def get_users():
    return {'users': ['alice', 'bob']}

@app.route('/api/users', methods=['POST'])
def create_user():
    return {'message': 'User created'}, 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    return {'message': f'User {user_id} updated'}

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    return {'message': f'User {user_id} deleted'}
```

### URL Building

Use `url_for()` to build URLs dynamically:

```python
from flask import url_for

@app.route('/')
def index():
    return 'Index'

@app.route('/user/<username>')
def profile(username):
    return f'{username}\'s profile'

with app.test_request_context():
    print(url_for('index'))                    # /
    print(url_for('profile', username='John')) # /user/John
    print(url_for('static', filename='style.css'))  # /static/style.css
```

## Request and Response Handling

### Accessing Request Data

```python
from flask import Flask, request

app = Flask(__name__)

@app.route('/search')
def search():
    # Query parameters: /search?q=flask&page=1
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    return f'Searching for: {query}, Page: {page}'

@app.route('/login', methods=['POST'])
def login():
    # Form data
    username = request.form.get('username')
    password = request.form.get('password')

    # JSON data
    data = request.get_json()

    # Headers
    auth_header = request.headers.get('Authorization')

    # Cookies
    session_id = request.cookies.get('session_id')

    return {'status': 'success'}

@app.route('/upload', methods=['POST'])
def upload_file():
    # File uploads
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    file = request.files['file']
    if file.filename == '':
        return {'error': 'No file selected'}, 400

    # Save the file
    file.save(f'/uploads/{file.filename}')
    return {'message': 'File uploaded successfully'}
```

### Request Object Properties

```python
@app.route('/info')
def request_info():
    info = {
        'method': request.method,
        'url': request.url,
        'base_url': request.base_url,
        'path': request.path,
        'host': request.host,
        'remote_addr': request.remote_addr,
        'user_agent': str(request.user_agent),
        'content_type': request.content_type,
    }
    return info
```

### Response Objects

```python
from flask import Flask, make_response, jsonify, redirect, url_for

app = Flask(__name__)

@app.route('/custom-response')
def custom_response():
    response = make_response('Custom Response Body')
    response.status_code = 200
    response.headers['X-Custom-Header'] = 'Custom Value'
    response.set_cookie('user_id', '12345', max_age=3600)
    return response

@app.route('/json')
def json_response():
    data = {'name': 'Flask', 'version': '3.0'}
    return jsonify(data)

@app.route('/redirect')
def redirect_example():
    return redirect(url_for('index'))

@app.route('/error')
def error_example():
    return {'error': 'Something went wrong'}, 500
```

### Error Handling

```python
from flask import Flask, abort, render_template

app = Flask(__name__)

@app.route('/user/<int:user_id>')
def get_user(user_id):
    user = find_user(user_id)
    if user is None:
        abort(404)
    return {'user': user}

@app.errorhandler(404)
def not_found(error):
    return {'error': 'Resource not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    return {'error': 'Internal server error'}, 500

# Custom error handler for HTML responses
@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404
```

## Templates with Jinja2

Flask uses Jinja2 as its templating engine. Templates are stored in the `templates` folder by default.

### Basic Template Rendering

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/hello/<name>')
def hello(name):
    return render_template('hello.html', name=name)
```

Create `templates/hello.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hello</title>
</head>
<body>
    <h1>Hello, {{ name }}!</h1>
</body>
</html>
```

### Template Variables and Expressions

```html
<!-- Variables -->
<p>Hello, {{ user.name }}</p>
<p>{{ user['email'] }}</p>

<!-- Filters -->
<p>{{ name|capitalize }}</p>
<p>{{ description|truncate(50) }}</p>
<p>{{ list|join(', ') }}</p>
<p>{{ html_content|safe }}</p>

<!-- Expressions -->
<p>{{ 1 + 2 }}</p>
<p>{{ 'Hello ' ~ name }}</p>
```

### Control Structures

```html
<!-- Conditionals -->
{% if user %}
    <h1>Hello, {{ user.name }}!</h1>
{% elif guest %}
    <h1>Hello, Guest!</h1>
{% else %}
    <h1>Hello, Stranger!</h1>
{% endif %}

<!-- Loops -->
<ul>
{% for item in items %}
    <li>{{ item.name }} - ${{ item.price }}</li>
{% else %}
    <li>No items found</li>
{% endfor %}
</ul>

<!-- Loop variables -->
<ul>
{% for item in items %}
    <li>
        {{ loop.index }}. {{ item }}
        {% if loop.first %}(First!){% endif %}
        {% if loop.last %}(Last!){% endif %}
    </li>
{% endfor %}
</ul>
```

### Template Inheritance

Create a base template `templates/base.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}My Site{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='style.css') }}">
    {% block head %}{% endblock %}
</head>
<body>
    <nav>
        <a href="{{ url_for('index') }}">Home</a>
        <a href="{{ url_for('about') }}">About</a>
    </nav>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        <p>&copy; 2024 My Site</p>
    </footer>

    {% block scripts %}{% endblock %}
</body>
</html>
```

Create a child template `templates/index.html`:

```html
{% extends "base.html" %}

{% block title %}Home - My Site{% endblock %}

{% block content %}
    <h1>Welcome to My Site</h1>
    <p>This is the home page.</p>
{% endblock %}
```

### Macros

Create reusable template components with macros:

```html
<!-- templates/macros.html -->
{% macro input(name, value='', type='text', placeholder='') %}
    <input type="{{ type }}"
           name="{{ name }}"
           value="{{ value }}"
           placeholder="{{ placeholder }}"
           class="form-input">
{% endmacro %}

{% macro render_form_field(field) %}
    <div class="form-group">
        <label>{{ field.label }}</label>
        {{ field }}
        {% if field.errors %}
            <ul class="errors">
            {% for error in field.errors %}
                <li>{{ error }}</li>
            {% endfor %}
            </ul>
        {% endif %}
    </div>
{% endmacro %}
```

Use macros in templates:

```html
{% from "macros.html" import input, render_form_field %}

<form method="post">
    {{ input('username', placeholder='Enter username') }}
    {{ input('password', type='password', placeholder='Enter password') }}
    <button type="submit">Login</button>
</form>
```

### Including Templates

```html
{% include 'header.html' %}
<main>
    Content here
</main>
{% include 'footer.html' %}

<!-- Include with ignore missing -->
{% include 'sidebar.html' ignore missing %}
```

## Static Files

Flask automatically serves static files from the `static` folder.

### Project Structure

```
my_app/
    app.py
    static/
        css/
            style.css
        js/
            main.js
        images/
            logo.png
    templates/
        base.html
```

### Referencing Static Files

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
<script src="{{ url_for('static', filename='js/main.js') }}"></script>
<img src="{{ url_for('static', filename='images/logo.png') }}" alt="Logo">
```

## Blueprints

Blueprints help organize your application into modular components. They are ideal for structuring large applications.

### Creating a Blueprint

```python
# blueprints/auth.py
from flask import Blueprint, render_template, request, redirect, url_for

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Handle login
        return redirect(url_for('main.index'))
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    # Handle logout
    return redirect(url_for('main.index'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Handle registration
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')
```

```python
# blueprints/api.py
from flask import Blueprint, jsonify, request

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route('/users')
def get_users():
    users = [{'id': 1, 'name': 'Alice'}, {'id': 2, 'name': 'Bob'}]
    return jsonify(users)

@api_bp.route('/users/<int:user_id>')
def get_user(user_id):
    user = {'id': user_id, 'name': 'Alice'}
    return jsonify(user)
```

### Registering Blueprints

```python
# app.py
from flask import Flask
from blueprints.auth import auth_bp
from blueprints.api import api_bp

app = Flask(__name__)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(api_bp)

@app.route('/')
def index():
    return 'Welcome!'

if __name__ == '__main__':
    app.run(debug=True)
```

### Blueprint with Templates and Static Files

```python
# blueprints/admin/__init__.py
from flask import Blueprint

admin_bp = Blueprint(
    'admin',
    __name__,
    url_prefix='/admin',
    template_folder='templates',
    static_folder='static',
    static_url_path='/admin/static'
)

from . import routes
```

### Application Factory Pattern

```python
# app/__init__.py
from flask import Flask

def create_app(config_name='default'):
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)

    # Register blueprints
    from app.main import main_bp
    from app.auth import auth_bp
    from app.api import api_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    return app
```

## RESTful API Development

Flask is excellent for building RESTful APIs. Here's a comprehensive example.

### Basic RESTful API

```python
from flask import Flask, jsonify, request, abort

app = Flask(__name__)

# In-memory database
books = [
    {'id': 1, 'title': 'The Great Gatsby', 'author': 'F. Scott Fitzgerald', 'year': 1925},
    {'id': 2, 'title': '1984', 'author': 'George Orwell', 'year': 1949},
]

def find_book(book_id):
    return next((book for book in books if book['id'] == book_id), None)

def get_next_id():
    return max(book['id'] for book in books) + 1 if books else 1

# GET all books
@app.route('/api/books', methods=['GET'])
def get_books():
    # Query parameters for filtering
    author = request.args.get('author')
    year = request.args.get('year', type=int)

    result = books
    if author:
        result = [b for b in result if author.lower() in b['author'].lower()]
    if year:
        result = [b for b in result if b['year'] == year]

    return jsonify({'books': result, 'total': len(result)})

# GET single book
@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    book = find_book(book_id)
    if book is None:
        abort(404)
    return jsonify(book)

# POST create book
@app.route('/api/books', methods=['POST'])
def create_book():
    if not request.json:
        abort(400, description='Request must be JSON')

    required_fields = ['title', 'author', 'year']
    for field in required_fields:
        if field not in request.json:
            abort(400, description=f'Missing required field: {field}')

    book = {
        'id': get_next_id(),
        'title': request.json['title'],
        'author': request.json['author'],
        'year': request.json['year']
    }
    books.append(book)
    return jsonify(book), 201

# PUT update book
@app.route('/api/books/<int:book_id>', methods=['PUT'])
def update_book(book_id):
    book = find_book(book_id)
    if book is None:
        abort(404)

    if not request.json:
        abort(400, description='Request must be JSON')

    book['title'] = request.json.get('title', book['title'])
    book['author'] = request.json.get('author', book['author'])
    book['year'] = request.json.get('year', book['year'])

    return jsonify(book)

# DELETE book
@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = find_book(book_id)
    if book is None:
        abort(404)

    books.remove(book)
    return '', 204

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad Request', 'message': error.description}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found', 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

### API with Authentication

```python
from flask import Flask, jsonify, request, g
from functools import wraps
import hashlib
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

# Simple token storage (use database in production)
tokens = {}
users = {'admin': 'password123'}

def generate_token():
    return secrets.token_hex(32)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401

        token = token.split(' ')[1]
        if token not in tokens:
            return jsonify({'error': 'Invalid token'}), 401

        g.current_user = tokens[token]
        return f(*args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username in users and users[username] == password:
        token = generate_token()
        tokens[token] = username
        return jsonify({'token': token})

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/protected', methods=['GET'])
@require_auth
def protected():
    return jsonify({'message': f'Hello, {g.current_user}!'})

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    token = request.headers.get('Authorization').split(' ')[1]
    del tokens[token]
    return jsonify({'message': 'Logged out successfully'})
```

### API Pagination

```python
from flask import Flask, jsonify, request, url_for

app = Flask(__name__)

items = [{'id': i, 'name': f'Item {i}'} for i in range(1, 101)]

@app.route('/api/items', methods=['GET'])
def get_items():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    per_page = min(per_page, 100)  # Max 100 items per page

    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page

    paginated_items = items[start:end]

    response = {
        'items': paginated_items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
        },
        'links': {
            'self': url_for('get_items', page=page, per_page=per_page, _external=True),
        }
    }

    if page > 1:
        response['links']['prev'] = url_for('get_items', page=page-1, per_page=per_page, _external=True)
    if end < total:
        response['links']['next'] = url_for('get_items', page=page+1, per_page=per_page, _external=True)

    return jsonify(response)
```

## Flask Extensions

Flask has a rich ecosystem of extensions that add functionality to your application.

### Flask-SQLAlchemy (Database)

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    posts = db.relationship('Post', backref='author', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables
with app.app_context():
    db.create_all()

# CRUD operations
@app.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user = User(username=data['username'], email=data['email'])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204
```

### Flask-Migrate (Database Migrations)

```bash
pip install Flask-Migrate
```

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'

db = SQLAlchemy(app)
migrate = Migrate(app, db)
```

```bash
# Initialize migrations
flask db init

# Create a migration
flask db migrate -m "Initial migration"

# Apply migrations
flask db upgrade

# Downgrade
flask db downgrade
```

### Flask-WTF (Forms)

```python
from flask import Flask, render_template, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

class RegistrationForm(FlaskForm):
    username = StringField('Username', validators=[
        DataRequired(),
        Length(min=4, max=25)
    ])
    email = StringField('Email', validators=[
        DataRequired(),
        Email()
    ])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=8)
    ])
    confirm_password = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Register')

class PostForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(max=200)])
    content = TextAreaField('Content', validators=[DataRequired()])
    submit = SubmitField('Create Post')

@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()
    if form.validate_on_submit():
        # Process registration
        flash('Account created successfully!', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)
```

Template for form:

```html
{% extends "base.html" %}

{% block content %}
<form method="POST">
    {{ form.hidden_tag() }}

    <div class="form-group">
        {{ form.username.label }}
        {{ form.username(class="form-control") }}
        {% for error in form.username.errors %}
            <span class="text-danger">{{ error }}</span>
        {% endfor %}
    </div>

    <div class="form-group">
        {{ form.email.label }}
        {{ form.email(class="form-control") }}
        {% for error in form.email.errors %}
            <span class="text-danger">{{ error }}</span>
        {% endfor %}
    </div>

    <div class="form-group">
        {{ form.password.label }}
        {{ form.password(class="form-control") }}
        {% for error in form.password.errors %}
            <span class="text-danger">{{ error }}</span>
        {% endfor %}
    </div>

    <div class="form-group">
        {{ form.confirm_password.label }}
        {{ form.confirm_password(class="form-control") }}
        {% for error in form.confirm_password.errors %}
            <span class="text-danger">{{ error }}</span>
        {% endfor %}
    </div>

    {{ form.submit(class="btn btn-primary") }}
</form>
{% endblock %}
```

### Flask-Login (User Authentication)

```python
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# User model (typically with database)
class User(UserMixin):
    def __init__(self, id, username, password_hash):
        self.id = id
        self.username = username
        self.password_hash = password_hash

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# User storage (use database in production)
users = {
    1: User(1, 'admin', generate_password_hash('password123'))
}

@login_manager.user_loader
def load_user(user_id):
    return users.get(int(user_id))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember', False)

        user = next((u for u in users.values() if u.username == username), None)

        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))

        flash('Invalid username or password', 'danger')

    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)
```

### Flask-CORS (Cross-Origin Resource Sharing)

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Or configure specific origins
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "https://example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

@app.route('/api/data')
def get_data():
    return {'message': 'This endpoint supports CORS'}
```

### Flask-Caching

```python
from flask import Flask
from flask_caching import Cache

app = Flask(__name__)
app.config['CACHE_TYPE'] = 'SimpleCache'
app.config['CACHE_DEFAULT_TIMEOUT'] = 300

cache = Cache(app)

@app.route('/expensive-operation')
@cache.cached(timeout=60)
def expensive_operation():
    # This result will be cached for 60 seconds
    result = perform_expensive_calculation()
    return {'result': result}

@app.route('/user/<int:user_id>')
@cache.cached(timeout=120, key_prefix='user')
def get_user(user_id):
    user = fetch_user_from_database(user_id)
    return {'user': user}

# Clear cache programmatically
@app.route('/clear-cache', methods=['POST'])
def clear_cache():
    cache.clear()
    return {'message': 'Cache cleared'}
```

## Configuration Management

### Configuration Classes

```python
# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### Loading Configuration

```python
from flask import Flask
from config import config

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Additional configuration from file
    app.config.from_pyfile('instance/config.py', silent=True)

    # Environment variables
    app.config.from_envvar('APP_SETTINGS', silent=True)

    return app
```

### Environment Variables

```python
import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['DATABASE_URL'] = os.getenv('DATABASE_URL')
app.config['DEBUG'] = os.getenv('DEBUG', 'False').lower() == 'true'
```

## Testing Flask Applications

### Basic Testing

```python
import pytest
from app import create_app, db

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

def test_home_page(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Welcome' in response.data

def test_create_user(client):
    response = client.post('/api/users',
        json={'username': 'testuser', 'email': 'test@example.com'},
        content_type='application/json'
    )
    assert response.status_code == 201
    assert response.json['username'] == 'testuser'

def test_login(client):
    # Create user first
    client.post('/api/users',
        json={'username': 'testuser', 'password': 'password123'})

    # Test login
    response = client.post('/login',
        data={'username': 'testuser', 'password': 'password123'},
        follow_redirects=True
    )
    assert response.status_code == 200

def test_protected_route_requires_auth(client):
    response = client.get('/api/protected')
    assert response.status_code == 401
```

### Testing with Authentication

```python
@pytest.fixture
def auth_client(client):
    # Login and get token
    response = client.post('/api/login',
        json={'username': 'admin', 'password': 'password'})
    token = response.json['token']

    # Return client with auth header
    class AuthClient:
        def __init__(self, client, token):
            self.client = client
            self.headers = {'Authorization': f'Bearer {token}'}

        def get(self, *args, **kwargs):
            kwargs.setdefault('headers', {}).update(self.headers)
            return self.client.get(*args, **kwargs)

        def post(self, *args, **kwargs):
            kwargs.setdefault('headers', {}).update(self.headers)
            return self.client.post(*args, **kwargs)

    return AuthClient(client, token)

def test_protected_route_with_auth(auth_client):
    response = auth_client.get('/api/protected')
    assert response.status_code == 200
```

## Deployment

### Production WSGI Server with Gunicorn

```bash
pip install gunicorn
```

```bash
# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# With configuration file
gunicorn -c gunicorn.conf.py app:app
```

```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
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
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://user:pass@db/app
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Nginx Configuration

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
        alias /path/to/app/static;
        expires 30d;
    }
}
```

### Production Checklist

```python
# Production configuration
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_POOL_SIZE = 10
    SQLALCHEMY_POOL_RECYCLE = 3600

    # Logging
    LOG_LEVEL = 'INFO'
```

## Best Practices

1. **Use Application Factory Pattern**: Create applications using factory functions for better testing and configuration management.

2. **Organize with Blueprints**: Split large applications into modular blueprints for better maintainability.

3. **Environment Configuration**: Use environment variables for sensitive configuration and different environments.

4. **Error Handling**: Implement comprehensive error handlers for API and web responses.

5. **Input Validation**: Always validate and sanitize user input before processing.

6. **Security Headers**: Add security headers using Flask-Talisman or middleware.

7. **Database Management**: Use Flask-SQLAlchemy with migrations for database operations.

8. **Logging**: Implement proper logging for debugging and monitoring.

9. **Testing**: Write comprehensive tests for routes, models, and utilities.

10. **Documentation**: Document your API using tools like Flask-RESTful or Flask-OpenAPI.

## Conclusion

Flask is a powerful and flexible micro-framework that provides everything needed to build web applications and APIs in Python. Its simplicity makes it easy to learn, while its extensibility allows it to scale to complex applications. Whether you're building a simple website, a REST API, or a full-featured web application, Flask provides the foundation and flexibility to meet your needs.

The rich ecosystem of extensions, combined with Flask's adherence to Python conventions, makes it an excellent choice for developers who want control over their application architecture while still benefiting from well-tested components. By following best practices and leveraging the right extensions, you can build robust, maintainable applications that are ready for production deployment.
