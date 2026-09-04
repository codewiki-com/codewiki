---
title: Python SQLAlchemy ORM
description: 学习 Python 最流行的 ORM 框架 SQLAlchemy，包括模型定义、查询、关系映射和事务处理
track: backend
section: databases
difficulty: intermediate
tags:
  - Python
  - SQLAlchemy
  - ORM
  - 数据库
status: imported
origin: old/src/content/docs/python/sqlalchemy.zh.md
divergence: 0.084
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Python
  subcategory: 数据库
  order: 35
  lastUpdated: 2026-01-07
---

SQLAlchemy 是 Python 生态系统中最成熟、功能最强大的 ORM（对象关系映射）框架。它提供了一套完整的企业级持久化模式，让开发者能够以 Python 对象的方式操作关系型数据库，同时保持对底层 SQL 的完全控制能力。

## SQLAlchemy 简介

### 什么是 ORM？

ORM（Object-Relational Mapping，对象关系映射）是一种编程技术，用于在面向对象编程语言和关系型数据库之间建立映射关系。通过 ORM，开发者可以：

- **用 Python 类表示数据库表**：每个类对应一张表
- **用对象实例表示行记录**：每个对象实例对应表中的一行
- **用类属性表示列字段**：类的属性对应表的列
- **用方法操作数据库**：通过方法调用执行 CRUD 操作

### SQLAlchemy 的特点

- **双层架构**：Core 层提供 SQL 表达式语言，ORM 层提供对象映射
- **数据库无关**：支持 PostgreSQL、MySQL、SQLite、Oracle 等主流数据库
- **灵活性**：既可以使用纯 ORM，也可以直接执行原生 SQL
- **延迟加载**：智能的查询优化和延迟加载机制
- **事务支持**：完整的事务管理和回滚支持
- **迁移工具**：与 Alembic 无缝集成进行数据库迁移

### 安装 SQLAlchemy

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装 SQLAlchemy
pip install sqlalchemy

# 安装数据库驱动（根据使用的数据库选择）
pip install psycopg2-binary  # PostgreSQL
pip install pymysql          # MySQL
pip install sqlite3          # SQLite（Python 内置）

# 安装 Alembic（数据库迁移工具）
pip install alembic
```

## Engine 与 Session

### 创建数据库引擎（Engine）

Engine 是 SQLAlchemy 的核心组件，负责管理数据库连接池和方言（Dialect）。

```python
from sqlalchemy import create_engine

# SQLite（文件数据库）
engine = create_engine('sqlite:///example.db')

# SQLite（内存数据库）
engine = create_engine('sqlite:///:memory:')

# PostgreSQL
engine = create_engine(
    'postgresql://username:password@localhost:5432/database_name'
)

# MySQL
engine = create_engine(
    'mysql+pymysql://username:password@localhost:3306/database_name'
)

# 带连接池配置的引擎
engine = create_engine(
    'postgresql://user:pass@localhost/db',
    pool_size=10,           # 连接池大小
    max_overflow=20,        # 超出 pool_size 后最多创建的连接数
    pool_timeout=30,        # 等待连接的超时时间
    pool_recycle=1800,      # 连接回收时间（秒）
    echo=True               # 打印 SQL 语句（调试用）
)
```

### 连接字符串格式

```python
# 基本格式
# dialect+driver://username:password@host:port/database

# 带选项的连接字符串
from sqlalchemy import create_engine
from sqlalchemy.engine import URL

# 使用 URL 对象构建（推荐，可避免特殊字符问题）
url = URL.create(
    drivername='postgresql',
    username='user',
    password='p@ssw0rd!',  # 特殊字符会自动处理
    host='localhost',
    port=5432,
    database='mydb',
    query={'sslmode': 'require'}
)
engine = create_engine(url)
```

### Session 会话管理

Session 是 ORM 的核心，负责管理对象的持久化操作。

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

engine = create_engine('sqlite:///example.db')

# 创建 Session 工厂
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False
)

# 方式一：直接创建 session
session = SessionLocal()
try:
    # 执行操作
    session.commit()
except Exception:
    session.rollback()
    raise
finally:
    session.close()

# 方式二：使用上下文管理器（推荐）
from contextlib import contextmanager

@contextmanager
def get_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# 使用上下文管理器
with get_session() as session:
    # 执行数据库操作
    pass

# 方式三：SQLAlchemy 2.0 风格
from sqlalchemy.orm import Session

with Session(engine) as session:
    with session.begin():
        # 自动提交或回滚
        pass
```

## 声明式模型定义

### 基础模型定义

SQLAlchemy 2.0 推荐使用 `DeclarativeBase` 定义模型。

```python
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# 定义基类
class Base(DeclarativeBase):
    pass

# 定义用户模型
class User(Base):
    __tablename__ = 'users'

    # 主键
    id: Mapped[int] = mapped_column(primary_key=True)

    # 必填字段
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)

    # 可选字段
    full_name: Mapped[Optional[str]] = mapped_column(String(100))

    # 带默认值的字段
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow
    )

    # 关系（一对多）
    posts: Mapped[List["Post"]] = relationship(back_populates="author")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"

# 定义文章模型
class Post(Base):
    __tablename__ = 'posts'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    published: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    # 外键
    author_id: Mapped[int] = mapped_column(ForeignKey('users.id'))

    # 关系（多对一）
    author: Mapped["User"] = relationship(back_populates="posts")

    def __repr__(self) -> str:
        return f"<Post(id={self.id}, title='{self.title}')>"
```

### 常用字段类型

```python
from sqlalchemy import (
    String, Integer, BigInteger, SmallInteger,
    Float, Numeric, Boolean, Date, DateTime, Time,
    Text, LargeBinary, JSON, Enum, UUID
)
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal
from datetime import date, datetime, time
from uuid import UUID as PyUUID
import enum

class Status(enum.Enum):
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'

class Product(Base):
    __tablename__ = 'products'

    id: Mapped[int] = mapped_column(primary_key=True)

    # 字符串类型
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)

    # 数值类型
    quantity: Mapped[int] = mapped_column(Integer)
    views: Mapped[int] = mapped_column(BigInteger, default=0)
    rating: Mapped[float] = mapped_column(Float)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    # 布尔类型
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    # 日期时间类型
    release_date: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    available_time: Mapped[time] = mapped_column(Time)

    # JSON 类型
    metadata_: Mapped[dict] = mapped_column('metadata', JSON, default=dict)

    # 枚举类型
    status: Mapped[Status] = mapped_column(Enum(Status), default=Status.PENDING)

    # UUID 类型
    uuid: Mapped[PyUUID] = mapped_column(UUID(as_uuid=True))

    # 二进制类型
    image: Mapped[bytes] = mapped_column(LargeBinary, nullable=True)
```

### 字段约束与选项

```python
from sqlalchemy import String, Integer, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

class Employee(Base):
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(primary_key=True)

    # 唯一约束
    employee_no: Mapped[str] = mapped_column(String(20), unique=True)

    # 非空约束（Mapped[str] 默认非空，Mapped[Optional[str]] 可空）
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # 索引
    department: Mapped[str] = mapped_column(String(50), index=True)

    # 默认值
    salary: Mapped[int] = mapped_column(Integer, default=50000)

    # 服务器端默认值
    hire_date: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now()
    )

    # 注释
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        comment='员工备注信息'
    )

    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(50))
    age: Mapped[int] = mapped_column(Integer)

    # 表级约束
    __table_args__ = (
        # 复合唯一约束
        UniqueConstraint('first_name', 'last_name', name='unique_full_name'),
        # 检查约束
        CheckConstraint('age >= 18 AND age <= 120', name='valid_age'),
        # 复合索引
        Index('idx_dept_salary', 'department', 'salary'),
        # 表注释
        {'comment': '员工信息表'}
    )
```

### 使用 Mixin 复用字段

```python
from datetime import datetime
from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column, declared_attr

class TimestampMixin:
    """时间戳 Mixin"""
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow
    )

class TableNameMixin:
    """自动生成表名 Mixin"""
    @declared_attr.directive
    def __tablename__(cls) -> str:
        # 将类名转为蛇形命名
        import re
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', cls.__name__)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()

class SoftDeleteMixin:
    """软删除 Mixin"""
    is_deleted: Mapped[bool] = mapped_column(default=False)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

# 使用 Mixin
class Article(Base, TimestampMixin, SoftDeleteMixin, TableNameMixin):
    # __tablename__ 自动生成为 'article'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)

    # 自动继承 created_at, updated_at, is_deleted, deleted_at
```

## 关系映射

### 一对多关系

```python
from typing import List, Optional
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Department(Base):
    __tablename__ = 'departments'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # 一对多：一个部门有多个员工
    employees: Mapped[List["Employee"]] = relationship(
        back_populates="department",
        cascade="all, delete-orphan"  # 级联删除
    )

class Employee(Base):
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # 外键
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('departments.id', ondelete='SET NULL')
    )

    # 多对一：多个员工属于一个部门
    department: Mapped[Optional["Department"]] = relationship(
        back_populates="employees"
    )

# 使用示例
with Session(engine) as session:
    # 创建部门
    dev_dept = Department(name="研发部")

    # 创建员工并分配部门
    emp1 = Employee(name="张三", department=dev_dept)
    emp2 = Employee(name="李四", department=dev_dept)

    # 或者通过部门添加员工
    dev_dept.employees.append(Employee(name="王五"))

    session.add(dev_dept)
    session.commit()

    # 查询
    dept = session.get(Department, 1)
    for emp in dept.employees:
        print(f"{emp.name} 属于 {emp.department.name}")
```

### 一对一关系

```python
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)

    # 一对一关系
    profile: Mapped[Optional["UserProfile"]] = relationship(
        back_populates="user",
        uselist=False,  # 关键：禁用列表，变为单一对象
        cascade="all, delete-orphan"
    )

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[int] = mapped_column(primary_key=True)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))

    # 外键（同时是唯一约束，确保一对一）
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'),
        unique=True
    )

    # 反向关系
    user: Mapped["User"] = relationship(back_populates="profile")

# 使用示例
with Session(engine) as session:
    user = User(
        username="zhangsan",
        profile=UserProfile(
            bio="Python 开发者",
            avatar_url="https://example.com/avatar.jpg"
        )
    )
    session.add(user)
    session.commit()

    # 访问
    print(user.profile.bio)  # 直接访问，不是列表
```

### 多对多关系

```python
from sqlalchemy import Table, Column, ForeignKey

# 关联表（不需要 ORM 模型）
article_tags = Table(
    'article_tags',
    Base.metadata,
    Column('article_id', ForeignKey('articles.id'), primary_key=True),
    Column('tag_id', ForeignKey('tags.id'), primary_key=True)
)

class Article(Base):
    __tablename__ = 'articles'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))

    # 多对多关系
    tags: Mapped[List["Tag"]] = relationship(
        secondary=article_tags,
        back_populates="articles"
    )

class Tag(Base):
    __tablename__ = 'tags'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)

    # 反向关系
    articles: Mapped[List["Article"]] = relationship(
        secondary=article_tags,
        back_populates="tags"
    )

# 使用示例
with Session(engine) as session:
    # 创建标签
    python_tag = Tag(name="Python")
    web_tag = Tag(name="Web开发")

    # 创建文章并关联标签
    article = Article(
        title="Python Web 开发入门",
        tags=[python_tag, web_tag]
    )

    session.add(article)
    session.commit()

    # 查询文章的标签
    for tag in article.tags:
        print(tag.name)

    # 查询标签下的文章
    python = session.query(Tag).filter_by(name="Python").first()
    for article in python.articles:
        print(article.title)
```

### 带额外数据的多对多关系

```python
class StudentCourse(Base):
    """学生选课关联表（带额外数据）"""
    __tablename__ = 'student_courses'

    student_id: Mapped[int] = mapped_column(
        ForeignKey('students.id'),
        primary_key=True
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey('courses.id'),
        primary_key=True
    )

    # 额外数据
    enrollment_date: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    grade: Mapped[Optional[float]] = mapped_column(Float)

    # 关系
    student: Mapped["Student"] = relationship(back_populates="course_associations")
    course: Mapped["Course"] = relationship(back_populates="student_associations")

class Student(Base):
    __tablename__ = 'students'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # 通过关联对象访问
    course_associations: Mapped[List["StudentCourse"]] = relationship(
        back_populates="student",
        cascade="all, delete-orphan"
    )

    # 便捷属性：直接访问课程
    @property
    def courses(self) -> List["Course"]:
        return [assoc.course for assoc in self.course_associations]

class Course(Base):
    __tablename__ = 'courses'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    student_associations: Mapped[List["StudentCourse"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan"
    )

# 使用示例
with Session(engine) as session:
    student = Student(name="张三")
    course = Course(name="Python 编程")

    # 创建选课记录（带成绩）
    enrollment = StudentCourse(
        student=student,
        course=course,
        grade=95.5
    )

    session.add(enrollment)
    session.commit()

    # 查询学生的课程和成绩
    for assoc in student.course_associations:
        print(f"{assoc.course.name}: {assoc.grade}")
```

### 自关联（Self-Referential）

```python
class Category(Base):
    """分类（支持无限层级）"""
    __tablename__ = 'categories'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # 自关联外键
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('categories.id')
    )

    # 子分类
    children: Mapped[List["Category"]] = relationship(
        back_populates="parent",
        cascade="all, delete-orphan"
    )

    # 父分类
    parent: Mapped[Optional["Category"]] = relationship(
        back_populates="children",
        remote_side=[id]  # 指定远程端
    )

    def get_ancestors(self) -> List["Category"]:
        """获取所有祖先分类"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.append(current)
            current = current.parent
        return ancestors

    def get_descendants(self) -> List["Category"]:
        """获取所有子孙分类"""
        descendants = []
        for child in self.children:
            descendants.append(child)
            descendants.extend(child.get_descendants())
        return descendants

# 使用示例
with Session(engine) as session:
    # 创建分类树
    electronics = Category(name="电子产品")
    phones = Category(name="手机", parent=electronics)
    smartphones = Category(name="智能手机", parent=phones)

    session.add(electronics)
    session.commit()

    # 遍历
    print(f"{smartphones.name} 的祖先:",
          [c.name for c in smartphones.get_ancestors()])
    print(f"{electronics.name} 的子孙:",
          [c.name for c in electronics.get_descendants()])
```

## 查询操作

### 基础查询

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

with Session(engine) as session:
    # SQLAlchemy 2.0 风格查询

    # 查询所有记录
    stmt = select(User)
    users = session.scalars(stmt).all()

    # 查询单条记录
    stmt = select(User).where(User.id == 1)
    user = session.scalar(stmt)

    # 使用 get 查询主键（推荐）
    user = session.get(User, 1)

    # 查询第一条
    stmt = select(User).where(User.is_active == True)
    user = session.scalars(stmt).first()

    # 查询唯一一条（如果多条会报错）
    stmt = select(User).where(User.username == 'admin')
    user = session.scalars(stmt).one()

    # 查询唯一一条或 None
    user = session.scalars(stmt).one_or_none()
```

### 条件过滤

```python
from sqlalchemy import select, and_, or_, not_

with Session(engine) as session:
    # 等于
    stmt = select(User).where(User.username == 'admin')

    # 不等于
    stmt = select(User).where(User.status != 'banned')

    # 大于、小于
    stmt = select(User).where(User.age > 18)
    stmt = select(User).where(User.age >= 18)
    stmt = select(User).where(User.age < 60)
    stmt = select(User).where(User.age <= 60)

    # LIKE 模糊查询
    stmt = select(User).where(User.username.like('%admin%'))
    stmt = select(User).where(User.email.ilike('%@GMAIL.COM'))  # 不区分大小写

    # IN 查询
    stmt = select(User).where(User.status.in_(['active', 'pending']))

    # NOT IN
    stmt = select(User).where(User.status.not_in(['banned', 'deleted']))

    # BETWEEN
    stmt = select(User).where(User.age.between(18, 60))

    # IS NULL / IS NOT NULL
    stmt = select(User).where(User.deleted_at.is_(None))
    stmt = select(User).where(User.email.is_not(None))

    # AND 组合条件
    stmt = select(User).where(
        and_(
            User.is_active == True,
            User.age >= 18
        )
    )
    # 或者链式调用
    stmt = select(User).where(User.is_active == True).where(User.age >= 18)

    # OR 组合条件
    stmt = select(User).where(
        or_(
            User.role == 'admin',
            User.role == 'superuser'
        )
    )

    # NOT 取反
    stmt = select(User).where(not_(User.is_banned))

    # 复杂条件组合
    stmt = select(User).where(
        and_(
            User.is_active == True,
            or_(
                User.role == 'admin',
                and_(
                    User.age >= 18,
                    User.email.like('%@company.com')
                )
            )
        )
    )
```

### 排序与分页

```python
from sqlalchemy import select, desc, asc

with Session(engine) as session:
    # 升序排序（默认）
    stmt = select(User).order_by(User.created_at)
    stmt = select(User).order_by(asc(User.created_at))

    # 降序排序
    stmt = select(User).order_by(desc(User.created_at))

    # 多字段排序
    stmt = select(User).order_by(
        desc(User.is_active),
        asc(User.username)
    )

    # 分页
    page = 1
    page_size = 10
    stmt = select(User).offset((page - 1) * page_size).limit(page_size)

    # 组合使用
    stmt = (
        select(User)
        .where(User.is_active == True)
        .order_by(desc(User.created_at))
        .offset(0)
        .limit(20)
    )

    users = session.scalars(stmt).all()
```

### 聚合查询

```python
from sqlalchemy import select, func, distinct

with Session(engine) as session:
    # 计数
    stmt = select(func.count()).select_from(User)
    total = session.scalar(stmt)

    # 带条件计数
    stmt = select(func.count()).select_from(User).where(User.is_active == True)
    active_count = session.scalar(stmt)

    # 去重计数
    stmt = select(func.count(distinct(User.department)))
    dept_count = session.scalar(stmt)

    # 求和
    stmt = select(func.sum(Order.amount))
    total_amount = session.scalar(stmt)

    # 平均值
    stmt = select(func.avg(Product.price))
    avg_price = session.scalar(stmt)

    # 最大值、最小值
    stmt = select(func.max(User.age), func.min(User.age))
    max_age, min_age = session.execute(stmt).one()

    # 分组统计
    stmt = (
        select(
            User.department,
            func.count(User.id).label('employee_count'),
            func.avg(User.salary).label('avg_salary')
        )
        .group_by(User.department)
        .having(func.count(User.id) > 5)
        .order_by(desc('employee_count'))
    )

    results = session.execute(stmt).all()
    for dept, count, avg_salary in results:
        print(f"{dept}: {count} 人, 平均工资 {avg_salary:.2f}")
```

### 关联查询（Join）

```python
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload, subqueryload

with Session(engine) as session:
    # 内连接
    stmt = (
        select(User, Post)
        .join(Post, User.id == Post.author_id)
        .where(Post.published == True)
    )
    results = session.execute(stmt).all()
    for user, post in results:
        print(f"{user.username}: {post.title}")

    # 左连接
    stmt = (
        select(User, Post)
        .outerjoin(Post, User.id == Post.author_id)
    )

    # 使用关系进行连接
    stmt = (
        select(User)
        .join(User.posts)
        .where(Post.published == True)
    )

    # 预加载关系 - joinedload（适合一对一、多对一）
    stmt = (
        select(Post)
        .options(joinedload(Post.author))
        .where(Post.published == True)
    )
    posts = session.scalars(stmt).unique().all()
    for post in posts:
        print(f"{post.title} by {post.author.username}")  # 不会产生额外查询

    # 预加载关系 - selectinload（适合一对多、多对多）
    stmt = (
        select(User)
        .options(selectinload(User.posts))
        .where(User.is_active == True)
    )
    users = session.scalars(stmt).all()
    for user in users:
        print(f"{user.username} 有 {len(user.posts)} 篇文章")

    # 嵌套预加载
    stmt = (
        select(User)
        .options(
            selectinload(User.posts)
            .joinedload(Post.comments)
        )
    )

    # 多个预加载
    stmt = (
        select(User)
        .options(
            selectinload(User.posts),
            selectinload(User.comments),
            joinedload(User.profile)
        )
    )
```

### 子查询

```python
from sqlalchemy import select, exists, any_, all_

with Session(engine) as session:
    # 标量子查询
    subq = (
        select(func.avg(User.salary))
        .where(User.department == 'IT')
        .scalar_subquery()
    )

    stmt = select(User).where(User.salary > subq)
    high_salary_users = session.scalars(stmt).all()

    # EXISTS 子查询
    subq = (
        select(Post.id)
        .where(Post.author_id == User.id)
        .where(Post.published == True)
        .exists()
    )

    stmt = select(User).where(subq)
    authors = session.scalars(stmt).all()

    # 相关子查询
    post_count_subq = (
        select(func.count(Post.id))
        .where(Post.author_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )

    stmt = (
        select(User, post_count_subq.label('post_count'))
        .order_by(desc('post_count'))
    )

    results = session.execute(stmt).all()
    for user, post_count in results:
        print(f"{user.username}: {post_count} 篇文章")
```

### 原生 SQL 查询

```python
from sqlalchemy import text

with Session(engine) as session:
    # 简单原生 SQL
    result = session.execute(text("SELECT * FROM users WHERE is_active = 1"))

    # 带参数的原生 SQL（防止 SQL 注入）
    result = session.execute(
        text("SELECT * FROM users WHERE username = :username"),
        {"username": "admin"}
    )

    # 将结果映射到模型
    stmt = text("SELECT id, username, email FROM users WHERE is_active = :active")
    result = session.execute(stmt.bindparams(active=True).columns(
        User.id, User.username, User.email
    ))

    # 执行原生 SQL 并返回 ORM 对象
    stmt = text("SELECT * FROM users WHERE age > :age")
    users = session.scalars(
        select(User).from_statement(stmt),
        {"age": 18}
    ).all()
```

## CRUD 操作

### 创建（Create）

```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    # 创建单条记录
    user = User(
        username="zhangsan",
        email="zhangsan@example.com",
        full_name="张三"
    )
    session.add(user)
    session.commit()

    # 获取自动生成的 ID
    print(f"新用户 ID: {user.id}")

    # 批量创建
    users = [
        User(username="user1", email="user1@example.com"),
        User(username="user2", email="user2@example.com"),
        User(username="user3", email="user3@example.com"),
    ]
    session.add_all(users)
    session.commit()

    # 创建关联对象
    user = User(
        username="author",
        email="author@example.com",
        posts=[
            Post(title="第一篇文章", content="内容1"),
            Post(title="第二篇文章", content="内容2"),
        ]
    )
    session.add(user)
    session.commit()
```

### 读取（Read）

```python
with Session(engine) as session:
    # 通过主键查询
    user = session.get(User, 1)

    # 条件查询
    stmt = select(User).where(User.username == "admin")
    user = session.scalar(stmt)

    # 查询所有
    stmt = select(User).where(User.is_active == True)
    users = session.scalars(stmt).all()

    # 查询并锁定（SELECT FOR UPDATE）
    stmt = (
        select(User)
        .where(User.id == 1)
        .with_for_update()
    )
    user = session.scalar(stmt)
```

### 更新（Update）

```python
from sqlalchemy import update

with Session(engine) as session:
    # 方式一：查询后修改（适合单条记录）
    user = session.get(User, 1)
    if user:
        user.email = "newemail@example.com"
        user.full_name = "新名字"
        session.commit()

    # 方式二：批量更新（不加载对象到内存）
    stmt = (
        update(User)
        .where(User.is_active == False)
        .where(User.last_login < datetime(2024, 1, 1))
        .values(is_deleted=True)
    )
    result = session.execute(stmt)
    session.commit()
    print(f"更新了 {result.rowcount} 条记录")

    # 方式三：基于当前值更新
    stmt = (
        update(User)
        .where(User.id == 1)
        .values(login_count=User.login_count + 1)
    )
    session.execute(stmt)
    session.commit()

    # 方式四：条件更新
    stmt = (
        update(User)
        .where(User.role == 'guest')
        .values(
            role='member',
            updated_at=datetime.utcnow()
        )
    )
    session.execute(stmt)
    session.commit()
```

### 删除（Delete）

```python
from sqlalchemy import delete

with Session(engine) as session:
    # 方式一：查询后删除
    user = session.get(User, 1)
    if user:
        session.delete(user)
        session.commit()

    # 方式二：批量删除
    stmt = (
        delete(User)
        .where(User.is_deleted == True)
        .where(User.deleted_at < datetime(2024, 1, 1))
    )
    result = session.execute(stmt)
    session.commit()
    print(f"删除了 {result.rowcount} 条记录")

    # 软删除（推荐）
    stmt = (
        update(User)
        .where(User.id == 1)
        .values(
            is_deleted=True,
            deleted_at=datetime.utcnow()
        )
    )
    session.execute(stmt)
    session.commit()
```

### Upsert（插入或更新）

```python
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

# PostgreSQL
with Session(engine) as session:
    stmt = pg_insert(User).values(
        username="admin",
        email="admin@example.com"
    )

    # 如果冲突则更新
    stmt = stmt.on_conflict_do_update(
        index_elements=['username'],  # 冲突判断的列
        set_={
            'email': stmt.excluded.email,
            'updated_at': datetime.utcnow()
        }
    )

    session.execute(stmt)
    session.commit()

# SQLite
with Session(engine) as session:
    stmt = sqlite_insert(User).values(
        username="admin",
        email="admin@example.com"
    )

    stmt = stmt.on_conflict_do_update(
        index_elements=['username'],
        set_={
            'email': stmt.excluded.email
        }
    )

    session.execute(stmt)
    session.commit()

# 通用方式：merge（效率较低，会先查询）
with Session(engine) as session:
    user_data = {
        'username': 'admin',
        'email': 'admin@example.com'
    }

    # 查询或创建
    user = session.query(User).filter_by(username='admin').first()
    if user:
        for key, value in user_data.items():
            setattr(user, key, value)
    else:
        user = User(**user_data)
        session.add(user)

    session.commit()
```

## 事务处理

### 基本事务管理

```python
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

# 方式一：手动管理
session = Session(engine)
try:
    user = User(username="test", email="test@example.com")
    session.add(user)

    # 其他操作...

    session.commit()
except SQLAlchemyError as e:
    session.rollback()
    print(f"事务失败: {e}")
    raise
finally:
    session.close()

# 方式二：上下文管理器（推荐）
with Session(engine) as session:
    with session.begin():  # 自动提交或回滚
        user = User(username="test", email="test@example.com")
        session.add(user)
        # 如果这里抛出异常，会自动回滚
        # 正常结束会自动提交

# 方式三：使用 sessionmaker
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

with SessionLocal() as session:
    try:
        user = User(username="test", email="test@example.com")
        session.add(user)
        session.commit()
    except SQLAlchemyError:
        session.rollback()
        raise
```

### 嵌套事务（Savepoint）

```python
with Session(engine) as session:
    with session.begin():
        # 外层事务
        user = User(username="user1", email="user1@example.com")
        session.add(user)

        try:
            # 嵌套事务（保存点）
            with session.begin_nested():
                post = Post(title="Test", content="Content", author=user)
                session.add(post)
                # 如果这里失败，只回滚到保存点
                raise ValueError("测试回滚")
        except ValueError:
            # 捕获异常，继续外层事务
            pass

        # 外层事务继续
        another_user = User(username="user2", email="user2@example.com")
        session.add(another_user)
        # 正常提交
```

### 事务隔离级别

```python
from sqlalchemy import create_engine

# 设置全局隔离级别
engine = create_engine(
    "postgresql://user:pass@localhost/db",
    isolation_level="REPEATABLE READ"  # 可选: READ COMMITTED, SERIALIZABLE 等
)

# 单个连接设置隔离级别
with engine.connect().execution_options(
    isolation_level="SERIALIZABLE"
) as conn:
    # 使用此连接的所有操作都在 SERIALIZABLE 隔离级别下
    pass

# Session 级别设置
with Session(engine) as session:
    session.connection(execution_options={"isolation_level": "SERIALIZABLE"})
    # 执行操作
```

### 乐观锁

```python
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column

class Product(Base):
    __tablename__ = 'products'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    stock: Mapped[int] = mapped_column(Integer)

    # 版本号字段
    version_id: Mapped[int] = mapped_column(Integer, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }

# 使用乐观锁
from sqlalchemy.orm.exc import StaleDataError

with Session(engine) as session:
    product = session.get(Product, 1)
    product.stock -= 1

    try:
        session.commit()
    except StaleDataError:
        session.rollback()
        print("数据已被其他事务修改，请重试")
```

### 悲观锁

```python
from sqlalchemy import select

with Session(engine) as session:
    # SELECT FOR UPDATE（排他锁）
    stmt = (
        select(Product)
        .where(Product.id == 1)
        .with_for_update()
    )
    product = session.scalar(stmt)

    # 此时其他事务无法修改该行
    product.stock -= 1
    session.commit()

    # SELECT FOR UPDATE NOWAIT（不等待，立即失败）
    stmt = (
        select(Product)
        .where(Product.id == 1)
        .with_for_update(nowait=True)
    )

    # SELECT FOR UPDATE SKIP LOCKED（跳过已锁定的行）
    stmt = (
        select(Product)
        .where(Product.stock > 0)
        .with_for_update(skip_locked=True)
        .limit(1)
    )
```

## 事件与钩子

### 模型事件

```python
from sqlalchemy import event
from sqlalchemy.orm import Session

class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    password_hash: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(100))

# 插入前事件
@event.listens_for(User, 'before_insert')
def before_insert_user(mapper, connection, target):
    print(f"即将插入用户: {target.username}")
    # 可以在这里修改 target 的属性

# 插入后事件
@event.listens_for(User, 'after_insert')
def after_insert_user(mapper, connection, target):
    print(f"用户已创建: {target.id}")

# 更新前事件
@event.listens_for(User, 'before_update')
def before_update_user(mapper, connection, target):
    print(f"即将更新用户: {target.id}")

# 删除前事件
@event.listens_for(User, 'before_delete')
def before_delete_user(mapper, connection, target):
    print(f"即将删除用户: {target.id}")

# 加载后事件
@event.listens_for(User, 'load')
def on_load_user(target, context):
    print(f"用户已加载: {target.username}")
```

### Session 事件

```python
from sqlalchemy import event
from sqlalchemy.orm import Session

# Session 提交前
@event.listens_for(Session, 'before_commit')
def before_commit(session):
    print("即将提交事务")
    # 可以在这里做一些验证

# Session 提交后
@event.listens_for(Session, 'after_commit')
def after_commit(session):
    print("事务已提交")

# Session 回滚后
@event.listens_for(Session, 'after_rollback')
def after_rollback(session):
    print("事务已回滚")

# 对象状态变化
@event.listens_for(Session, 'after_flush')
def after_flush(session, flush_context):
    for obj in session.new:
        print(f"新建: {obj}")
    for obj in session.dirty:
        print(f"修改: {obj}")
    for obj in session.deleted:
        print(f"删除: {obj}")
```

### 属性事件

```python
from sqlalchemy import event
from sqlalchemy.orm import attributes

# 监听特定属性的修改
@event.listens_for(User.email, 'set')
def on_email_set(target, value, oldvalue, initiator):
    if value != oldvalue:
        print(f"邮箱从 {oldvalue} 修改为 {value}")
        # 可以在这里发送验证邮件
    return value

# 监听密码设置（自动加密）
import hashlib

@event.listens_for(User.password_hash, 'set', retval=True)
def hash_password(target, value, oldvalue, initiator):
    if value and value != oldvalue:
        # 简单示例，实际应使用 bcrypt 等
        return hashlib.sha256(value.encode()).hexdigest()
    return value
```

## Alembic 数据库迁移

### 初始化 Alembic

```bash
# 在项目目录下初始化
alembic init alembic

# 生成的目录结构
# alembic/
#   ├── env.py           # 环境配置
#   ├── README
#   ├── script.py.mako   # 迁移脚本模板
#   └── versions/        # 迁移脚本目录
# alembic.ini            # Alembic 配置文件
```

### 配置 Alembic

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# 导入你的模型基类
from app.models import Base

# 配置对象
config = context.config

# 日志配置
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 设置 target_metadata
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """离线模式运行迁移"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """在线模式运行迁移"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

```ini
# alembic.ini
[alembic]
script_location = alembic
prepend_sys_path = .

# 数据库连接字符串
sqlalchemy.url = postgresql://user:password@localhost/dbname

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```

### 创建迁移

```bash
# 自动生成迁移（根据模型变化）
alembic revision --autogenerate -m "create users table"

# 手动创建空迁移
alembic revision -m "add custom index"
```

### 迁移脚本示例

```python
# alembic/versions/xxx_create_users_table.py
"""create users table

Revision ID: abc123
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'abc123'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建表
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('email', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email')
    )

    # 创建索引
    op.create_index('idx_users_username', 'users', ['username'])

def downgrade() -> None:
    # 删除索引
    op.drop_index('idx_users_username', 'users')

    # 删除表
    op.drop_table('users')
```

### 常用迁移操作

```python
from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # 添加列
    op.add_column('users', sa.Column('phone', sa.String(20)))

    # 删除列
    op.drop_column('users', 'phone')

    # 修改列
    op.alter_column(
        'users',
        'email',
        existing_type=sa.String(100),
        type_=sa.String(200),
        nullable=False
    )

    # 重命名列
    op.alter_column('users', 'name', new_column_name='full_name')

    # 添加索引
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

    # 删除索引
    op.drop_index('idx_users_email', 'users')

    # 添加外键
    op.create_foreign_key(
        'fk_posts_user',
        'posts', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

    # 删除外键
    op.drop_constraint('fk_posts_user', 'posts', type_='foreignkey')

    # 添加检查约束
    op.create_check_constraint(
        'ck_users_age',
        'users',
        'age >= 0 AND age <= 150'
    )

    # 重命名表
    op.rename_table('users', 'members')

    # 执行原生 SQL
    op.execute("UPDATE users SET is_active = true WHERE is_active IS NULL")

    # 批量操作（SQLite 需要）
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('phone', sa.String(20)))
        batch_op.drop_column('fax')
```

### 运行迁移

```bash
# 升级到最新版本
alembic upgrade head

# 升级到特定版本
alembic upgrade abc123

# 升级 N 个版本
alembic upgrade +2

# 降级到上一个版本
alembic downgrade -1

# 降级到特定版本
alembic downgrade abc123

# 降级到初始状态
alembic downgrade base

# 查看当前版本
alembic current

# 查看迁移历史
alembic history

# 查看迁移历史（详细）
alembic history --verbose

# 查看待执行的迁移
alembic heads

# 生成 SQL（不执行）
alembic upgrade head --sql > migration.sql
```

### 数据迁移

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session

def upgrade() -> None:
    # 获取连接
    bind = op.get_bind()
    session = Session(bind=bind)

    # 执行数据迁移
    session.execute(
        sa.text("UPDATE users SET status = 'active' WHERE status IS NULL")
    )

    # 复杂数据迁移
    users = session.execute(sa.text("SELECT id, name FROM users")).fetchall()
    for user_id, name in users:
        # 处理数据
        new_name = name.strip().title()
        session.execute(
            sa.text("UPDATE users SET name = :name WHERE id = :id"),
            {"name": new_name, "id": user_id}
        )

    session.commit()
```

## 性能优化

### 批量操作优化

```python
from sqlalchemy.orm import Session

# 批量插入 - 方式一：add_all
with Session(engine) as session:
    users = [User(username=f"user{i}", email=f"user{i}@example.com")
             for i in range(10000)]
    session.add_all(users)
    session.commit()

# 批量插入 - 方式二：bulk_save_objects（更快）
with Session(engine) as session:
    users = [User(username=f"user{i}", email=f"user{i}@example.com")
             for i in range(10000)]
    session.bulk_save_objects(users)
    session.commit()

# 批量插入 - 方式三：bulk_insert_mappings（最快）
with Session(engine) as session:
    users = [{"username": f"user{i}", "email": f"user{i}@example.com"}
             for i in range(10000)]
    session.bulk_insert_mappings(User, users)
    session.commit()

# 批量插入 - 方式四：使用 Core（最快，推荐大数据量）
from sqlalchemy import insert

with engine.connect() as conn:
    users = [{"username": f"user{i}", "email": f"user{i}@example.com"}
             for i in range(10000)]
    conn.execute(insert(User), users)
    conn.commit()

# 批量更新
with Session(engine) as session:
    updates = [
        {"id": 1, "email": "new1@example.com"},
        {"id": 2, "email": "new2@example.com"},
    ]
    session.bulk_update_mappings(User, updates)
    session.commit()
```

### N+1 问题解决

```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload, subqueryload

# 问题：N+1 查询
with Session(engine) as session:
    users = session.scalars(select(User)).all()
    for user in users:
        print(user.posts)  # 每次访问都会产生一次查询！

# 解决方案一：joinedload（JOIN 查询）
with Session(engine) as session:
    stmt = select(User).options(joinedload(User.posts))
    users = session.scalars(stmt).unique().all()
    for user in users:
        print(user.posts)  # 不会产生额外查询

# 解决方案二：selectinload（IN 查询，推荐一对多）
with Session(engine) as session:
    stmt = select(User).options(selectinload(User.posts))
    users = session.scalars(stmt).all()
    for user in users:
        print(user.posts)  # 只产生一次额外 IN 查询

# 解决方案三：subqueryload（子查询）
with Session(engine) as session:
    stmt = select(User).options(subqueryload(User.posts))
    users = session.scalars(stmt).all()
```

### 延迟加载控制

```python
from sqlalchemy.orm import lazyload, noload, raiseload

# 关闭延迟加载（访问时不加载）
stmt = select(User).options(noload(User.posts))

# 访问未加载关系时抛出异常
stmt = select(User).options(raiseload(User.posts))

# 全局禁用延迟加载
class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    posts: Mapped[List["Post"]] = relationship(
        lazy="raise"  # 访问时抛出异常，强制使用预加载
    )
```

### 只读查询优化

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

# 只读查询（跳过 identity map）
with Session(engine, expire_on_commit=False) as session:
    stmt = select(User).execution_options(
        stream_results=True,  # 流式结果
        yield_per=1000        # 每次获取 1000 条
    )

    for user in session.scalars(stmt):
        print(user.username)

# 使用 connection 直接执行（更轻量）
with engine.connect() as conn:
    result = conn.execute(select(User.id, User.username))
    for row in result:
        print(row.username)
```

### 索引优化

```python
from sqlalchemy import Index

class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), index=True)
    email: Mapped[str] = mapped_column(String(100))
    department: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(default=True)

    __table_args__ = (
        # 复合索引
        Index('idx_dept_active', 'department', 'is_active'),

        # 部分索引（仅索引活跃用户）
        Index(
            'idx_active_users',
            'username',
            postgresql_where='is_active = true'
        ),

        # 唯一索引
        Index('idx_unique_email', 'email', unique=True),
    )
```

## 完整项目示例

### 项目结构

```
myproject/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── database.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   └── post.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   └── user.py
│   └── services/
│       ├── __init__.py
│       └── user.py
├── alembic/
│   ├── env.py
│   └── versions/
├── alembic.ini
├── requirements.txt
└── main.py
```

### 配置文件

```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost/mydb"
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### 数据库配置

```python
# app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # 检查连接是否有效
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

@contextmanager
def get_db() -> Generator[Session, None, None]:
    """获取数据库会话的上下文管理器"""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# FastAPI 依赖
def get_db_session() -> Generator[Session, None, None]:
    """FastAPI 依赖注入使用"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
```

### 模型定义

```python
# app/models/base.py
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        onupdate=datetime.utcnow
    )
```

```python
# app/models/user.py
from typing import Optional, List
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    posts: Mapped[List["Post"]] = relationship(
        back_populates="author",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"
```

```python
# app/models/post.py
from typing import Optional
from sqlalchemy import String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

class Post(Base, TimestampMixin):
    __tablename__ = 'posts'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    published: Mapped[bool] = mapped_column(Boolean, default=False)

    author_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    author: Mapped["User"] = relationship(back_populates="posts")

    def __repr__(self) -> str:
        return f"<Post(id={self.id}, title='{self.title}')>"
```

```python
# app/models/__init__.py
from app.models.base import Base
from app.models.user import User
from app.models.post import Post

__all__ = ['Base', 'User', 'Post']
```

### 仓储层（Repository）

```python
# app/repositories/base.py
from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: Session):
        self.model = model
        self.session = session

    def get(self, id: int) -> Optional[ModelType]:
        return self.session.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        stmt = select(self.model).offset(skip).limit(limit)
        return list(self.session.scalars(stmt).all())

    def create(self, obj: ModelType) -> ModelType:
        self.session.add(obj)
        self.session.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.session.flush()
        return obj

    def delete(self, obj: ModelType) -> None:
        self.session.delete(obj)
        self.session.flush()
```

```python
# app/repositories/user.py
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, session: Session):
        super().__init__(User, session)

    def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        return self.session.scalar(stmt)

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        return self.session.scalar(stmt)

    def get_active_users(self) -> List[User]:
        stmt = select(User).where(User.is_active == True)
        return list(self.session.scalars(stmt).all())

    def get_with_posts(self, user_id: int) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.posts))
            .where(User.id == user_id)
        )
        return self.session.scalar(stmt)
```

### 服务层（Service）

```python
# app/services/user.py
from typing import Optional, List
from sqlalchemy.orm import Session
import hashlib

from app.models.user import User
from app.repositories.user import UserRepository

class UserService:
    def __init__(self, session: Session):
        self.session = session
        self.user_repo = UserRepository(session)

    def create_user(
        self,
        username: str,
        email: str,
        password: str,
        full_name: Optional[str] = None
    ) -> User:
        # 检查用户名是否存在
        if self.user_repo.get_by_username(username):
            raise ValueError(f"用户名 '{username}' 已存在")

        # 检查邮箱是否存在
        if self.user_repo.get_by_email(email):
            raise ValueError(f"邮箱 '{email}' 已被注册")

        # 创建用户
        user = User(
            username=username,
            email=email,
            password_hash=self._hash_password(password),
            full_name=full_name
        )

        return self.user_repo.create(user)

    def get_user(self, user_id: int) -> Optional[User]:
        return self.user_repo.get(user_id)

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.user_repo.get_by_username(username)

    def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.user_repo.get_all(skip, limit)

    def update_user(
        self,
        user_id: int,
        email: Optional[str] = None,
        full_name: Optional[str] = None
    ) -> Optional[User]:
        user = self.user_repo.get(user_id)
        if not user:
            return None

        if email:
            existing = self.user_repo.get_by_email(email)
            if existing and existing.id != user_id:
                raise ValueError(f"邮箱 '{email}' 已被其他用户使用")
            user.email = email

        if full_name is not None:
            user.full_name = full_name

        return self.user_repo.update(user)

    def delete_user(self, user_id: int) -> bool:
        user = self.user_repo.get(user_id)
        if not user:
            return False

        self.user_repo.delete(user)
        return True

    def verify_password(self, user: User, password: str) -> bool:
        return user.password_hash == self._hash_password(password)

    def _hash_password(self, password: str) -> str:
        # 简单示例，实际应使用 bcrypt
        return hashlib.sha256(password.encode()).hexdigest()
```

### 主程序

```python
# main.py
from app.database import get_db, engine
from app.models import Base, User, Post
from app.services.user import UserService

def init_db():
    """初始化数据库表"""
    Base.metadata.create_all(bind=engine)

def main():
    # 初始化数据库
    init_db()

    # 使用服务层
    with get_db() as session:
        user_service = UserService(session)

        # 创建用户
        try:
            user = user_service.create_user(
                username="admin",
                email="admin@example.com",
                password="secret123",
                full_name="管理员"
            )
            print(f"创建用户成功: {user}")
        except ValueError as e:
            print(f"创建用户失败: {e}")

        # 查询用户
        users = user_service.get_all_users()
        print(f"所有用户: {users}")

        # 更新用户
        user = user_service.update_user(
            user_id=1,
            full_name="超级管理员"
        )
        if user:
            print(f"更新后: {user.full_name}")

if __name__ == "__main__":
    main()
```

## 最佳实践

### 使用 Type Hints

```python
# 使用 Mapped 和 mapped_column 明确类型
from sqlalchemy.orm import Mapped, mapped_column

class User(Base):
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
```

### 合理使用 Session

```python
# 推荐：使用上下文管理器
with Session(engine) as session:
    with session.begin():
        # 操作
        pass

# 不推荐：手动管理
session = Session(engine)
try:
    # 操作
    session.commit()
except:
    session.rollback()
finally:
    session.close()
```

### 避免 N+1 查询

```python
# 问题代码
users = session.query(User).all()
for user in users:
    print(user.posts)  # N+1 查询

# 正确做法
users = session.query(User).options(selectinload(User.posts)).all()
for user in users:
    print(user.posts)  # 只有 2 次查询
```

### 使用仓储模式

```python
# 将数据访问逻辑封装到 Repository
class UserRepository:
    def get_active_users(self) -> List[User]:
        return self.session.query(User).filter(User.is_active == True).all()

# 业务逻辑使用 Repository
class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
```

### 事务边界清晰

```python
# 在 Service 层管理事务
class UserService:
    def transfer_points(self, from_user_id: int, to_user_id: int, points: int):
        with self.session.begin():
            from_user = self.user_repo.get(from_user_id)
            to_user = self.user_repo.get(to_user_id)

            if from_user.points < points:
                raise ValueError("积分不足")

            from_user.points -= points
            to_user.points += points
            # 自动提交或回滚
```

### 使用 Alembic 管理迁移

```bash
# 开发环境：自动生成迁移
alembic revision --autogenerate -m "add user table"

# 生产环境：审核后执行
alembic upgrade head
```

### 配置连接池

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,        # 连接池大小
    max_overflow=20,     # 最大溢出连接数
    pool_timeout=30,     # 获取连接超时
    pool_recycle=1800,   # 连接回收时间
    pool_pre_ping=True   # 使用前检查连接
)
```

## 总结

SQLAlchemy 是 Python 生态系统中最强大、最灵活的 ORM 框架。通过本文，我们学习了：

1. **核心概念**：Engine、Session、声明式模型
2. **模型定义**：字段类型、约束、Mixin 复用
3. **关系映射**：一对多、一对一、多对多、自关联
4. **查询操作**：条件过滤、排序分页、聚合、关联查询
5. **CRUD 操作**：创建、读取、更新、删除、Upsert
6. **事务处理**：基本事务、嵌套事务、乐观锁、悲观锁
7. **事件与钩子**：模型事件、Session 事件、属性事件
8. **数据库迁移**：Alembic 初始化、创建迁移、执行迁移
9. **性能优化**：批量操作、N+1 问题、延迟加载控制

掌握 SQLAlchemy 后，你可以：

- 构建高效的数据访问层
- 处理复杂的数据库关系
- 实现可靠的事务管理
- 进行数据库版本控制

建议在实际项目中多加练习，结合具体业务场景深入理解各种功能的应用。
