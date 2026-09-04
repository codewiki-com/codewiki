---
title: Entity Framework Core
description: EF Core完全指南，ORM、数据库迁移与LINQ查询
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - EF Core
  - ORM
  - 数据库
status: imported
origin: old/src/content/docs/csharp/ef-core.zh.md
divergence: 0.205
issues:
  - title-lang-zh
  - title-language
legacy:
  category: CSharp
  subcategory: 数据访问
  order: 7
  lastUpdated: 2026-01-07
---

Entity Framework Core（EF Core）是 .NET 平台上最流行的对象关系映射（ORM）框架。它允许开发者使用 .NET 对象来操作数据库，无需编写大量的 SQL 语句，极大地提高了开发效率。

## EF Core 简介

### 什么是 ORM？

ORM（Object-Relational Mapping，对象关系映射）是一种编程技术，它在关系数据库和面向对象编程语言之间建立了一座桥梁。通过 ORM，我们可以：

- 使用 C# 类来表示数据库表
- 使用 LINQ 查询来代替 SQL
- 自动处理对象与数据库记录之间的转换
- 追踪对象的变化并自动生成相应的 SQL 语句

### EF Core 的特点

- **跨平台**: 支持 Windows、Linux 和 macOS
- **多数据库支持**: SQL Server、PostgreSQL、MySQL、SQLite 等
- **代码优先（Code First）**: 从 C# 类生成数据库架构
- **数据库优先（Database First）**: 从现有数据库生成 C# 类
- **强大的迁移系统**: 轻松管理数据库架构变更
- **LINQ 支持**: 使用强类型查询语法

## 安装与配置

### 安装 NuGet 包

根据你使用的数据库，安装相应的 NuGet 包：

```bash
# SQL Server
dotnet add package Microsoft.EntityFrameworkCore.SqlServer

# PostgreSQL
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# MySQL
dotnet add package Pomelo.EntityFrameworkCore.MySql

# SQLite
dotnet add package Microsoft.EntityFrameworkCore.Sqlite

# 设计时工具（用于迁移）
dotnet add package Microsoft.EntityFrameworkCore.Design
```

### 安装 EF Core CLI 工具

```bash
dotnet tool install --global dotnet-ef
```

## DbContext 详解

`DbContext` 是 EF Core 的核心类，它代表与数据库的会话，用于查询和保存数据。

### 基本 DbContext 定义

```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    // 定义数据库表对应的 DbSet
    public DbSet<Blog> Blogs { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<Author> Authors { get; set; }

    // 无参构造函数
    public ApplicationDbContext() { }

    // 带选项的构造函数（依赖注入使用）
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // 配置数据库连接
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer(
                "Server=localhost;Database=BloggingDb;Trusted_Connection=True;TrustServerCertificate=True");
        }
    }

    // 配置实体模型
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 在这里配置实体
    }
}
```

### 在 ASP.NET Core 中注册 DbContext

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// 从配置文件读取连接字符串
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

```json
// appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=BloggingDb;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

### DbContext 生命周期

```csharp
// 方式1：使用 using 语句（手动管理）
using (var context = new ApplicationDbContext())
{
    var blogs = context.Blogs.ToList();
}

// 方式2：依赖注入（推荐，ASP.NET Core 自动管理生命周期）
public class BlogService
{
    private readonly ApplicationDbContext _context;

    public BlogService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Blog>> GetAllBlogsAsync()
    {
        return await _context.Blogs.ToListAsync();
    }
}
```

### DbContext 池化

对于高并发场景，使用 DbContext 池化可以显著提升性能：

```csharp
// 使用 DbContext 池化
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString),
    poolSize: 128  // 默认值为 1024
);
```

## 实体配置

EF Core 提供了三种配置实体的方式：约定、数据注解和 Fluent API。

### 定义实体类

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Url { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }

    // 导航属性
    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public int ViewCount { get; set; }

    // 外键
    public int BlogId { get; set; }

    // 导航属性
    public Blog Blog { get; set; } = null!;

    // 多对多关系
    public List<Tag> Tags { get; set; } = new();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<Post> Posts { get; set; } = new();
}

public class Author
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Bio { get; set; }
}
```

### 使用数据注解（Data Annotations）

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("Blogs")]
public class Blog
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("BlogUrl")]
    public string? Url { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; }

    [NotMapped]  // 不映射到数据库
    public string DisplayName => $"{Name} ({Url})";

    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    [Key]
    public int Id { get; set; }

    [Required]
    [StringLength(300, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Column(TypeName = "datetime2")]
    public DateTime PublishedAt { get; set; }

    [Range(0, int.MaxValue)]
    public int ViewCount { get; set; }

    [ForeignKey("Blog")]
    public int BlogId { get; set; }

    public Blog Blog { get; set; } = null!;
}
```

### 使用 Fluent API（推荐）

Fluent API 提供了最强大和灵活的配置方式：

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // 配置 Blog 实体
    modelBuilder.Entity<Blog>(entity =>
    {
        // 表名
        entity.ToTable("Blogs");

        // 主键
        entity.HasKey(e => e.Id);

        // 属性配置
        entity.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        entity.Property(e => e.Url)
            .HasMaxLength(500)
            .HasColumnName("BlogUrl");

        entity.Property(e => e.CreatedAt)
            .HasDefaultValueSql("GETUTCDATE()");

        // 唯一索引
        entity.HasIndex(e => e.Url)
            .IsUnique()
            .HasDatabaseName("IX_Blog_Url");

        // 忽略属性
        entity.Ignore(e => e.DisplayName);
    });

    // 配置 Post 实体
    modelBuilder.Entity<Post>(entity =>
    {
        entity.ToTable("Posts");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(300);

        entity.Property(e => e.Content)
            .IsRequired();

        entity.Property(e => e.ViewCount)
            .HasDefaultValue(0);

        // 配置一对多关系
        entity.HasOne(e => e.Blog)
            .WithMany(b => b.Posts)
            .HasForeignKey(e => e.BlogId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("FK_Post_Blog");

        // 复合索引
        entity.HasIndex(e => new { e.BlogId, e.PublishedAt })
            .HasDatabaseName("IX_Post_BlogId_PublishedAt");
    });

    // 配置多对多关系
    modelBuilder.Entity<Post>()
        .HasMany(e => e.Tags)
        .WithMany(e => e.Posts)
        .UsingEntity<Dictionary<string, object>>(
            "PostTag",
            j => j.HasOne<Tag>().WithMany().HasForeignKey("TagId"),
            j => j.HasOne<Post>().WithMany().HasForeignKey("PostId")
        );
}
```

### 使用独立配置类

为了保持代码整洁，可以为每个实体创建独立的配置类：

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public class BlogConfiguration : IEntityTypeConfiguration<Blog>
{
    public void Configure(EntityTypeBuilder<Blog> builder)
    {
        builder.ToTable("Blogs");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Url)
            .HasMaxLength(500);

        builder.HasIndex(e => e.Url)
            .IsUnique();
    }
}

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("Posts");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(300);

        builder.HasOne(e => e.Blog)
            .WithMany(b => b.Posts)
            .HasForeignKey(e => e.BlogId);
    }
}

// 在 DbContext 中应用配置
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // 应用单个配置
    modelBuilder.ApplyConfiguration(new BlogConfiguration());
    modelBuilder.ApplyConfiguration(new PostConfiguration());

    // 或者自动应用程序集中的所有配置
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
}
```

### 值对象与复杂类型

```csharp
// 值对象定义
[Owned]
public class Address
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
}

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Address ShippingAddress { get; set; } = new();
    public Address BillingAddress { get; set; } = new();
}

// Fluent API 配置
modelBuilder.Entity<Customer>(entity =>
{
    entity.OwnsOne(c => c.ShippingAddress, address =>
    {
        address.Property(a => a.Street).HasColumnName("ShippingStreet");
        address.Property(a => a.City).HasColumnName("ShippingCity");
    });

    entity.OwnsOne(c => c.BillingAddress, address =>
    {
        address.Property(a => a.Street).HasColumnName("BillingStreet");
        address.Property(a => a.City).HasColumnName("BillingCity");
    });
});
```

## 数据库迁移

迁移是 EF Core 管理数据库架构变更的机制。

### 创建迁移

```bash
# 创建初始迁移
dotnet ef migrations add InitialCreate

# 创建新迁移（添加新功能后）
dotnet ef migrations add AddBlogCreatedTimestamp

# 指定输出目录
dotnet ef migrations add AddAuthorTable --output-dir Data/Migrations

# 为特定 DbContext 创建迁移
dotnet ef migrations add InitialCreate --context ApplicationDbContext
```

### 应用迁移

```bash
# 更新到最新迁移
dotnet ef database update

# 更新到指定迁移
dotnet ef database update AddBlogCreatedTimestamp

# 回滚到初始状态
dotnet ef database update 0

# 删除最后一个迁移（未应用时）
dotnet ef migrations remove
```

### 生成 SQL 脚本

```bash
# 生成从初始到最新的 SQL 脚本
dotnet ef migrations script

# 生成指定范围的 SQL 脚本
dotnet ef migrations script InitialCreate AddBlogCreatedTimestamp

# 输出到文件
dotnet ef migrations script -o migration.sql

# 生成幂等脚本（可重复执行）
dotnet ef migrations script --idempotent
```

### 迁移文件结构

```csharp
// Migrations/20260107120000_InitialCreate.cs
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Blogs",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false,
                    defaultValueSql: "GETUTCDATE()")
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Blogs", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Blog_Url",
            table: "Blogs",
            column: "Url",
            unique: true,
            filter: "[Url] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Blogs");
    }
}
```

### 添加列的迁移示例

```csharp
public partial class AddBlogUrl : DbMigration
{
    public override void Up()
    {
        AddColumn("dbo.Blogs", "Url", c => c.String());
    }

    public override void Down()
    {
        DropColumn("dbo.Blogs", "Url");
    }
}
```

### 在代码中应用迁移

```csharp
// Program.cs - 启动时自动迁移（开发环境）
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    // 检查是否有待处理的迁移
    var pendingMigrations = context.Database.GetPendingMigrations();
    if (pendingMigrations.Any())
    {
        context.Database.Migrate();
    }
}

// 或者直接迁移
var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
await context.Database.MigrateAsync();
```

### 数据种子

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // 使用 HasData 添加种子数据
    modelBuilder.Entity<Blog>().HasData(
        new Blog { Id = 1, Name = "技术博客", Url = "https://tech.example.com" },
        new Blog { Id = 2, Name = "生活博客", Url = "https://life.example.com" }
    );

    modelBuilder.Entity<Tag>().HasData(
        new Tag { Id = 1, Name = "C#" },
        new Tag { Id = 2, Name = "EF Core" },
        new Tag { Id = 3, Name = ".NET" }
    );
}
```

## LINQ 查询

EF Core 支持强大的 LINQ 查询，可以将 C# 表达式转换为 SQL。

### 基本查询

```csharp
public class BlogRepository
{
    private readonly ApplicationDbContext _context;

    public BlogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // 获取所有记录
    public async Task<List<Blog>> GetAllAsync()
    {
        return await _context.Blogs.ToListAsync();
    }

    // 根据 ID 获取
    public async Task<Blog?> GetByIdAsync(int id)
    {
        return await _context.Blogs.FindAsync(id);
    }

    // 条件查询
    public async Task<List<Blog>> GetActiveBlogs()
    {
        return await _context.Blogs
            .Where(b => b.IsActive)
            .ToListAsync();
    }

    // 排序
    public async Task<List<Blog>> GetBlogsOrderedByName()
    {
        return await _context.Blogs
            .OrderBy(b => b.Name)
            .ThenByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    // 分页
    public async Task<List<Blog>> GetPagedBlogs(int page, int pageSize)
    {
        return await _context.Blogs
            .OrderBy(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    // 投影（选择特定字段）
    public async Task<List<BlogDto>> GetBlogSummaries()
    {
        return await _context.Blogs
            .Select(b => new BlogDto
            {
                Id = b.Id,
                Name = b.Name,
                PostCount = b.Posts.Count
            })
            .ToListAsync();
    }
}

public class BlogDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PostCount { get; set; }
}
```

### 加载相关数据

EF Core 提供三种加载相关数据的方式：

#### 预先加载（Eager Loading）

```csharp
// 使用 Include 加载相关数据
public async Task<List<Blog>> GetBlogsWithPosts()
{
    return await _context.Blogs
        .Include(b => b.Posts)
        .ToListAsync();
}

// 多层级加载
public async Task<List<Blog>> GetBlogsWithPostsAndTags()
{
    return await _context.Blogs
        .Include(b => b.Posts)
            .ThenInclude(p => p.Tags)
        .ToListAsync();
}

// 加载多个导航属性
public async Task<Post?> GetPostWithDetails(int postId)
{
    return await _context.Posts
        .Include(p => p.Blog)
        .Include(p => p.Tags)
        .FirstOrDefaultAsync(p => p.Id == postId);
}

// 过滤 Include 的数据
public async Task<List<Blog>> GetBlogsWithRecentPosts()
{
    return await _context.Blogs
        .Include(b => b.Posts.Where(p => p.PublishedAt >= DateTime.UtcNow.AddDays(-30)))
        .ToListAsync();
}
```

#### 显式加载（Explicit Loading）

```csharp
public async Task<Blog?> GetBlogAndLoadPosts(int blogId)
{
    var blog = await _context.Blogs.FindAsync(blogId);

    if (blog != null)
    {
        // 显式加载集合导航属性
        await _context.Entry(blog)
            .Collection(b => b.Posts)
            .LoadAsync();

        // 显式加载引用导航属性
        await _context.Entry(post)
            .Reference(p => p.Blog)
            .LoadAsync();
    }

    return blog;
}

// 带过滤条件的显式加载
public async Task LoadPopularPosts(Blog blog)
{
    await _context.Entry(blog)
        .Collection(b => b.Posts)
        .Query()
        .Where(p => p.ViewCount > 1000)
        .LoadAsync();
}
```

#### 延迟加载（Lazy Loading）

```csharp
// 1. 安装代理包
// dotnet add package Microsoft.EntityFrameworkCore.Proxies

// 2. 启用延迟加载
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseLazyLoadingProxies()
        .UseSqlServer(connectionString);
}

// 3. 确保导航属性是 virtual
public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public virtual List<Post> Posts { get; set; } = new();
}

// 使用时自动加载
var blog = await context.Blogs.FindAsync(1);
var posts = blog.Posts; // 自动查询数据库
```

> **注意**：延迟加载可能导致 N+1 查询问题，应谨慎使用。

### 高级查询

```csharp
// 聚合函数
public async Task<int> GetTotalPostCount()
{
    return await _context.Posts.CountAsync();
}

public async Task<int> GetMaxViewCount()
{
    return await _context.Posts.MaxAsync(p => p.ViewCount);
}

public async Task<double> GetAverageViewCount()
{
    return await _context.Posts.AverageAsync(p => p.ViewCount);
}

// 分组查询
public async Task<Dictionary<int, int>> GetPostCountByBlog()
{
    return await _context.Posts
        .GroupBy(p => p.BlogId)
        .Select(g => new { BlogId = g.Key, Count = g.Count() })
        .ToDictionaryAsync(x => x.BlogId, x => x.Count);
}

// Any 和 All
public async Task<bool> HasActiveBlogs()
{
    return await _context.Blogs.AnyAsync(b => b.IsActive);
}

public async Task<bool> AllBlogsHavePosts()
{
    return await _context.Blogs.AllAsync(b => b.Posts.Any());
}

// First, Single, FirstOrDefault, SingleOrDefault
public async Task<Blog> GetFirstActiveBlog()
{
    return await _context.Blogs
        .FirstAsync(b => b.IsActive);
}

public async Task<Blog?> GetSingleBlogByUrl(string url)
{
    return await _context.Blogs
        .SingleOrDefaultAsync(b => b.Url == url);
}

// 动态查询构建
public async Task<List<Post>> SearchPosts(PostSearchCriteria criteria)
{
    var query = _context.Posts.AsQueryable();

    if (!string.IsNullOrEmpty(criteria.Title))
    {
        query = query.Where(p => p.Title.Contains(criteria.Title));
    }

    if (criteria.MinViewCount.HasValue)
    {
        query = query.Where(p => p.ViewCount >= criteria.MinViewCount.Value);
    }

    if (criteria.PublishedAfter.HasValue)
    {
        query = query.Where(p => p.PublishedAt >= criteria.PublishedAfter.Value);
    }

    return await query
        .OrderByDescending(p => p.PublishedAt)
        .ToListAsync();
}
```

### 原生 SQL 查询

```csharp
// 原生 SQL 查询
public async Task<List<Blog>> GetBlogsWithRawSql()
{
    return await _context.Blogs
        .FromSqlRaw("SELECT * FROM Blogs WHERE IsActive = 1")
        .ToListAsync();
}

// 参数化 SQL 查询（防止 SQL 注入）
public async Task<List<Blog>> SearchBlogs(string searchTerm)
{
    return await _context.Blogs
        .FromSqlInterpolated($"SELECT * FROM Blogs WHERE Name LIKE {'%' + searchTerm + '%'}")
        .ToListAsync();
}

// 执行存储过程
public async Task<List<BlogStatistics>> GetBlogStatistics()
{
    return await _context.Set<BlogStatistics>()
        .FromSqlRaw("EXEC GetBlogStatistics")
        .ToListAsync();
}

// 无实体的 SQL 查询（EF Core 7.0+）
public async Task<List<int>> GetBlogIds()
{
    return await _context.Database
        .SqlQuery<int>($"SELECT Id FROM Blogs")
        .ToListAsync();
}
```

## 关系映射

### 一对多关系

```csharp
// 实体定义
public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // 导航属性（集合）
    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    // 外键
    public int BlogId { get; set; }

    // 导航属性（引用）
    public Blog Blog { get; set; } = null!;
}

// Fluent API 配置
modelBuilder.Entity<Post>()
    .HasOne(p => p.Blog)
    .WithMany(b => b.Posts)
    .HasForeignKey(p => p.BlogId)
    .OnDelete(DeleteBehavior.Cascade);
```

### 一对一关系

```csharp
public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public AuthorProfile? Profile { get; set; }
}

public class AuthorProfile
{
    public int Id { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string? Website { get; set; }

    public int AuthorId { get; set; }
    public Author Author { get; set; } = null!;
}

// Fluent API 配置
modelBuilder.Entity<Author>()
    .HasOne(a => a.Profile)
    .WithOne(p => p.Author)
    .HasForeignKey<AuthorProfile>(p => p.AuthorId);
```

### 多对多关系

#### 简单多对多（EF Core 5.0+）

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    public List<Tag> Tags { get; set; } = new();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<Post> Posts { get; set; } = new();
}

// Fluent API 配置（可选，EF Core 可以自动推断）
modelBuilder.Entity<Post>()
    .HasMany(p => p.Tags)
    .WithMany(t => t.Posts);
```

#### 带载荷的多对多（自定义连接实体）

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;

    public List<PostTag> PostTags { get; set; } = new();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<PostTag> PostTags { get; set; } = new();
}

// 连接实体（包含额外数据）
public class PostTag
{
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;

    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;

    // 额外数据
    public DateTime AddedAt { get; set; }
    public string? AddedBy { get; set; }
}

// Fluent API 配置
modelBuilder.Entity<PostTag>(entity =>
{
    entity.HasKey(pt => new { pt.PostId, pt.TagId });

    entity.HasOne(pt => pt.Post)
        .WithMany(p => p.PostTags)
        .HasForeignKey(pt => pt.PostId);

    entity.HasOne(pt => pt.Tag)
        .WithMany(t => t.PostTags)
        .HasForeignKey(pt => pt.TagId);
});
```

### 显式配置多对多导航

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Post>()
        .HasMany(e => e.Tags)
        .WithMany(e => e.Posts)
        .UsingEntity<PostTag>(
            r => r.HasOne<Tag>(e => e.Tag).WithMany(e => e.PostTags),
            l => l.HasOne<Post>(e => e.Post).WithMany(e => e.PostTags));
}
```

### 自引用关系

```csharp
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public List<Category> Children { get; set; } = new();
}

// Fluent API 配置
modelBuilder.Entity<Category>()
    .HasOne(c => c.Parent)
    .WithMany(c => c.Children)
    .HasForeignKey(c => c.ParentId)
    .OnDelete(DeleteBehavior.Restrict);
```

## 性能优化

### 使用 AsNoTracking

对于只读查询，使用 `AsNoTracking` 可以提高性能：

```csharp
// 单次查询禁用跟踪
public async Task<List<Blog>> GetBlogsReadOnly()
{
    return await _context.Blogs
        .AsNoTracking()
        .ToListAsync();
}

// 全局禁用跟踪（适用于只读场景）
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
}

// 临时启用跟踪
var blogs = await _context.Blogs
    .AsTracking()
    .ToListAsync();
```

### 避免 N+1 查询问题

```csharp
// 错误示例：N+1 查询
var blogs = await _context.Blogs.ToListAsync();
foreach (var blog in blogs)
{
    // 每次循环都会执行一次查询！
    var postCount = blog.Posts.Count;
}

// 正确示例：使用 Include
var blogs = await _context.Blogs
    .Include(b => b.Posts)
    .ToListAsync();
foreach (var blog in blogs)
{
    var postCount = blog.Posts.Count; // 不会产生额外查询
}

// 更好的方式：使用投影
var blogSummaries = await _context.Blogs
    .Select(b => new
    {
        b.Id,
        b.Name,
        PostCount = b.Posts.Count
    })
    .ToListAsync();
```

### 分割查询

当加载多个集合导航属性时，使用分割查询可以避免笛卡尔爆炸：

```csharp
var blogs = await _context.Blogs
    .Include(b => b.Posts)
    .Include(b => b.Authors)
    .AsSplitQuery()  // 分成多个 SQL 查询
    .ToListAsync();

// 全局配置
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
}
```

### 批量操作

```csharp
// EF Core 7.0+ 批量更新
await _context.Posts
    .Where(p => p.ViewCount < 100)
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(p => p.IsArchived, true)
        .SetProperty(p => p.ArchivedAt, DateTime.UtcNow));

// EF Core 7.0+ 批量删除
await _context.Posts
    .Where(p => p.PublishedAt < DateTime.UtcNow.AddYears(-5))
    .ExecuteDeleteAsync();

// 手动批量插入
public async Task BulkInsertAsync(List<Post> posts)
{
    const int batchSize = 1000;

    for (int i = 0; i < posts.Count; i += batchSize)
    {
        var batch = posts.Skip(i).Take(batchSize);
        _context.Posts.AddRange(batch);
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
    }
}
```

### 编译查询

对于频繁执行的查询，使用编译查询可以提高性能：

```csharp
public class BlogRepository
{
    // 编译查询定义
    private static readonly Func<ApplicationDbContext, int, Task<Blog?>> _getBlogById =
        EF.CompileAsyncQuery((ApplicationDbContext context, int id) =>
            context.Blogs.FirstOrDefault(b => b.Id == id));

    private static readonly Func<ApplicationDbContext, bool, IAsyncEnumerable<Blog>> _getActiveBlogs =
        EF.CompileAsyncQuery((ApplicationDbContext context, bool isActive) =>
            context.Blogs.Where(b => b.IsActive == isActive));

    private readonly ApplicationDbContext _context;

    public BlogRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<Blog?> GetByIdAsync(int id)
    {
        return _getBlogById(_context, id);
    }

    public async Task<List<Blog>> GetActiveBlogsAsync(bool isActive)
    {
        var blogs = new List<Blog>();
        await foreach (var blog in _getActiveBlogs(_context, isActive))
        {
            blogs.Add(blog);
        }
        return blogs;
    }
}
```

### 使用索引

```csharp
modelBuilder.Entity<Post>(entity =>
{
    // 普通索引
    entity.HasIndex(e => e.Title);

    // 唯一索引
    entity.HasIndex(e => e.Slug).IsUnique();

    // 复合索引
    entity.HasIndex(e => new { e.BlogId, e.PublishedAt });

    // 包含列的索引（SQL Server）
    entity.HasIndex(e => e.Title)
        .IncludeProperties(e => new { e.Content, e.PublishedAt });

    // 过滤索引
    entity.HasIndex(e => e.Title)
        .HasFilter("[IsPublished] = 1");
});
```

### 日志与诊断

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .LogTo(Console.WriteLine, LogLevel.Information)
        .EnableSensitiveDataLogging()  // 开发环境，显示参数值
        .EnableDetailedErrors();
}

// 使用 ILoggerFactory
optionsBuilder.UseLoggerFactory(LoggerFactory.Create(builder =>
{
    builder.AddConsole();
    builder.AddFilter(DbLoggerCategory.Database.Command.Name, LogLevel.Information);
}));

// 查看生成的 SQL
var query = _context.Blogs.Where(b => b.IsActive);
var sql = query.ToQueryString();
Console.WriteLine(sql);
```

## 最佳实践

### 使用仓储模式

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<List<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }
}
```

### 使用工作单元模式

```csharp
public interface IUnitOfWork : IDisposable
{
    IRepository<Blog> Blogs { get; }
    IRepository<Post> Posts { get; }
    Task<int> SaveChangesAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IRepository<Blog> Blogs { get; }
    public IRepository<Post> Posts { get; }

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
        Blogs = new Repository<Blog>(context);
        Posts = new Repository<Post>(context);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

### 审计跟踪

```csharp
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    string? CreatedBy { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}

public class AuditableEntity : IAuditableEntity
{
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

// 在 DbContext 中自动填充审计字段
public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    var entries = ChangeTracker.Entries<IAuditableEntity>();

    foreach (var entry in entries)
    {
        switch (entry.State)
        {
            case EntityState.Added:
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.CreatedBy = GetCurrentUser();
                break;
            case EntityState.Modified:
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedBy = GetCurrentUser();
                break;
        }
    }

    return await base.SaveChangesAsync(cancellationToken);
}

private string GetCurrentUser()
{
    // 从 HttpContext 或其他来源获取当前用户
    return "system";
}
```

### 软删除

```csharp
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}

// 配置全局查询过滤器
modelBuilder.Entity<Post>().HasQueryFilter(p => !p.IsDeleted);

// 软删除实现
public async Task SoftDeleteAsync(Post post)
{
    post.IsDeleted = true;
    post.DeletedAt = DateTime.UtcNow;
    await _context.SaveChangesAsync();
}

// 查询包括已删除的记录
var allPosts = await _context.Posts
    .IgnoreQueryFilters()
    .ToListAsync();
```

### 并发控制

```csharp
public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // 行版本（用于乐观并发控制）
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
}

// Fluent API 配置
modelBuilder.Entity<Blog>()
    .Property(b => b.RowVersion)
    .IsRowVersion();

// 处理并发冲突
try
{
    await _context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    foreach (var entry in ex.Entries)
    {
        var databaseValues = await entry.GetDatabaseValuesAsync();

        if (databaseValues == null)
        {
            // 记录已被删除
            throw new Exception("记录已被其他用户删除");
        }

        // 可以选择使用数据库值覆盖或合并更改
        entry.OriginalValues.SetValues(databaseValues);
    }

    // 重试保存
    await _context.SaveChangesAsync();
}
```

### 事务管理

```csharp
// 显式事务
public async Task TransferFundsAsync(int fromAccountId, int toAccountId, decimal amount)
{
    using var transaction = await _context.Database.BeginTransactionAsync();

    try
    {
        var fromAccount = await _context.Accounts.FindAsync(fromAccountId);
        var toAccount = await _context.Accounts.FindAsync(toAccountId);

        if (fromAccount == null || toAccount == null)
            throw new InvalidOperationException("账户不存在");

        if (fromAccount.Balance < amount)
            throw new InvalidOperationException("余额不足");

        fromAccount.Balance -= amount;
        toAccount.Balance += amount;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}

// 使用 TransactionScope
public async Task ComplexOperationAsync()
{
    using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

    // 多个 DbContext 操作
    await _context1.SaveChangesAsync();
    await _context2.SaveChangesAsync();

    scope.Complete();
}
```

## 常见问题与解决方案

### 连接字符串安全

```csharp
// 不要在代码中硬编码连接字符串
// 使用 User Secrets（开发环境）
// dotnet user-secrets set "ConnectionStrings:DefaultConnection" "your-connection-string"

// 使用环境变量（生产环境）
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

// 使用 Azure Key Vault 或其他密钥管理服务
builder.Configuration.AddAzureKeyVault(
    new Uri("https://your-vault.vault.azure.net/"),
    new DefaultAzureCredential());
```

### 处理空引用

```csharp
// 使用可空引用类型
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }  // 可为空

    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;  // 必须有值，但初始化时可为 null
}
```

### 变更追踪

```csharp
// 检测实体状态
var entry = _context.Entry(entity);
var state = entry.State; // Added, Modified, Deleted, Unchanged, Detached

// 手动设置状态
_context.Entry(entity).State = EntityState.Modified;

// 获取修改的属性
var modifiedProperties = entry.Properties
    .Where(p => p.IsModified)
    .Select(p => new { p.Metadata.Name, p.OriginalValue, p.CurrentValue });

// 清除跟踪
_context.ChangeTracker.Clear();
```

## 总结

Entity Framework Core 是一个功能强大且灵活的 ORM 框架。通过本文，你学习了：

1. **DbContext** 的配置和生命周期管理
2. **实体配置** 的三种方式：约定、数据注解和 Fluent API
3. **数据库迁移** 的创建、应用和管理
4. **LINQ 查询** 的各种用法，包括预先加载、显式加载和延迟加载
5. **关系映射**：一对一、一对多和多对多关系
6. **性能优化** 技巧：AsNoTracking、分割查询、批量操作等
7. **最佳实践**：仓储模式、工作单元、审计跟踪、软删除和并发控制

掌握这些知识后，你将能够在 .NET 项目中高效地使用 EF Core 进行数据访问操作。

## 参考资源

- [Entity Framework Core 官方文档](https://learn.microsoft.com/ef/core/)
- [EF Core GitHub 仓库](https://github.com/dotnet/efcore)
- [EF Core 性能指南](https://learn.microsoft.com/ef/core/performance/)
