---
title: Entity Framework Core
description: Complete guide to EF Core, ORM, database migrations and LINQ queries
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - EF Core
  - ORM
  - Database
status: imported
origin: old/src/content/docs/csharp/ef-core.en.md
divergence: 0.205
issues:
  - title-lang-zh
  - title-language
legacy:
  category: CSharp
  subcategory: Data Access
  order: 7
  lastUpdated: 2026-01-07
---

Entity Framework Core (EF Core) is a modern, lightweight, extensible, and cross-platform object-relational mapper (ORM) for .NET. It enables developers to work with databases using .NET objects, eliminating the need to write most of the data-access code that would typically be required.

## Introduction and Setup

EF Core is a complete rewrite of Entity Framework, designed for modern .NET applications. It supports multiple database providers and offers improved performance over its predecessor.

### Key Features

- **Cross-platform**: Works on Windows, Linux, and macOS
- **Lightweight**: Smaller footprint and modular design
- **Extensible**: Easy to add custom functionality and providers
- **LINQ Support**: Write strongly-typed queries using C#
- **Change Tracking**: Automatically tracks changes to entities
- **Migrations**: Code-first database schema management
- **Multiple Providers**: SQL Server, PostgreSQL, MySQL, SQLite, Cosmos DB, and more

### Installation

Install EF Core packages via NuGet based on your database provider:

```bash
# Core package
dotnet add package Microsoft.EntityFrameworkCore

# SQL Server provider
dotnet add package Microsoft.EntityFrameworkCore.SqlServer

# PostgreSQL provider (Npgsql)
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# SQLite provider
dotnet add package Microsoft.EntityFrameworkCore.Sqlite

# Design-time tools for migrations
dotnet add package Microsoft.EntityFrameworkCore.Design

# CLI tools (global installation)
dotnet tool install --global dotnet-ef
```

## DbContext

The `DbContext` class is the primary class for interacting with the database. It represents a session with the database and provides APIs for querying, saving, and managing data.

### Basic DbContext Setup

```csharp
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    // DbSet properties represent tables in the database
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }

    // Constructor for dependency injection
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Override OnModelCreating for Fluent API configuration
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Entity configurations go here
    }
}
```

### Configuration with OnConfiguring

For standalone applications or simple scenarios:

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<Customer> Customers { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer(
                @"Server=(localdb)\mssqllocaldb;Database=MyDatabase;Trusted_Connection=True;");
        }
    }
}
```

### Dependency Injection Configuration

For ASP.NET Core applications, configure DbContext in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Read connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Register DbContext with dependency injection
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString)
           .EnableSensitiveDataLogging() // Only in development
           .EnableDetailedErrors());     // Only in development

var app = builder.Build();
```

Configuration in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MyApp;Trusted_Connection=True;MultipleActiveResultSets=true"
  }
}
```

### DbContext Lifetime and Usage

```csharp
// Using statement ensures proper disposal
using (var context = new ApplicationDbContext(options))
{
    var customers = await context.Customers.ToListAsync();
}

// With dependency injection in a service
public class CustomerService
{
    private readonly ApplicationDbContext _context;

    public CustomerService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Customer>> GetActiveCustomersAsync()
    {
        return await _context.Customers
            .Where(c => c.IsActive)
            .ToListAsync();
    }
}
```

### DbContext Options and Logging

```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .EnableSensitiveDataLogging()  // Include parameter values in logs
        .EnableDetailedErrors()         // More detailed error messages
        .LogTo(Console.WriteLine, LogLevel.Information)  // Log to console
        .LogTo(
            message => Debug.WriteLine(message),
            new[] { DbLoggerCategory.Database.Command.Name },
            LogLevel.Information);
}
```

## Entity Configuration

Entities are Plain Old CLR Objects (POCOs) that map to database tables. EF Core provides multiple ways to configure entities.

### Basic Entity Definition

```csharp
public class Customer
{
    public int Id { get; set; }  // Convention: Primary key
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public DateTime CreatedDate { get; set; }
    public bool IsActive { get; set; }

    // Navigation property for related orders
    public List<Order> Orders { get; set; } = new();
}

public class Order
{
    public int Id { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; }

    // Foreign key
    public int CustomerId { get; set; }

    // Navigation properties
    public Customer Customer { get; set; }
    public List<OrderItem> OrderItems { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
}

public class OrderItem
{
    public int Id { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; }

    public int ProductId { get; set; }
    public Product Product { get; set; }
}

public enum OrderStatus
{
    Pending,
    Processing,
    Shipped,
    Delivered,
    Cancelled
}
```

### Data Annotations

Use attributes to configure entity properties:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Product
{
    [Key]  // Explicit primary key
    public int ProductId { get; set; }

    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }

    [MaxLength(500)]
    public string Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }

    [Required]
    public int StockQuantity { get; set; }

    [NotMapped]  // Excluded from database
    public decimal DiscountedPrice => Price * 0.9m;

    [ConcurrencyCheck]  // Used for optimistic concurrency
    public string Version { get; set; }

    [Timestamp]  // Row version for concurrency
    public byte[] RowVersion { get; set; }
}

[Table("CustomerAccounts")]  // Custom table name
public class Customer
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [Column("FirstName", TypeName = "nvarchar(50)")]
    public string FirstName { get; set; }

    [Required]
    [Column("LastName", TypeName = "nvarchar(50)")]
    public string LastName { get; set; }

    [EmailAddress]
    [StringLength(100)]
    public string Email { get; set; }

    [Phone]
    public string PhoneNumber { get; set; }
}
```

### Fluent API Configuration

The Fluent API provides more configuration options and is configured in `OnModelCreating`:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Customer entity configuration
    modelBuilder.Entity<Customer>(entity =>
    {
        entity.ToTable("Customers");

        entity.HasKey(c => c.Id);

        entity.Property(c => c.FirstName)
            .IsRequired()
            .HasMaxLength(50)
            .HasColumnName("FirstName");

        entity.Property(c => c.LastName)
            .IsRequired()
            .HasMaxLength(50);

        entity.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(100);

        entity.HasIndex(c => c.Email)
            .IsUnique()
            .HasDatabaseName("IX_Customers_Email");

        entity.Property(c => c.CreatedDate)
            .HasDefaultValueSql("GETUTCDATE()");
    });

    // Product entity configuration
    modelBuilder.Entity<Product>(entity =>
    {
        entity.ToTable("Products");

        entity.HasKey(p => p.Id);

        entity.Property(p => p.Price)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        entity.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(100);

        entity.HasIndex(p => p.Name);
    });
}
```

### Separate Configuration Classes

Organize configurations using `IEntityTypeConfiguration<T>`:

```csharp
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.FirstName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.LastName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(c => c.Email)
            .IsUnique();

        // Relationship configuration
        builder.HasMany(c => c.Orders)
            .WithOne(o => o.Customer)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.TotalAmount)
            .HasColumnType("decimal(18,2)");

        builder.Property(o => o.Status)
            .HasConversion<string>()  // Store enum as string
            .HasMaxLength(20);
    }
}

// Apply configurations in DbContext
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.ApplyConfiguration(new CustomerConfiguration());
    modelBuilder.ApplyConfiguration(new OrderConfiguration());

    // Or apply all configurations from assembly
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
}
```

## Relationships

EF Core supports various types of relationships between entities.

### One-to-Many Relationship

```csharp
// Entities
public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Url { get; set; }

    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }

    public int BlogId { get; set; }  // Foreign key
    public Blog Blog { get; set; }   // Navigation property
}

// Fluent API configuration
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Blog>()
        .HasMany(b => b.Posts)
        .WithOne(p => p.Blog)
        .HasForeignKey(p => p.BlogId)
        .HasPrincipalKey(b => b.Id)
        .OnDelete(DeleteBehavior.Cascade);
}
```

### Many-to-Many Relationship

EF Core 5.0+ supports implicit many-to-many relationships:

```csharp
// Simple many-to-many (EF Core creates join table automatically)
public class Student
{
    public int Id { get; set; }
    public string Name { get; set; }

    public List<Course> Courses { get; set; } = new();
}

public class Course
{
    public int Id { get; set; }
    public string Title { get; set; }

    public List<Student> Students { get; set; } = new();
}

// Configuration
modelBuilder.Entity<Student>()
    .HasMany(s => s.Courses)
    .WithMany(c => c.Students);
```

Explicit join entity for additional properties:

```csharp
public class Post
{
    public int Id { get; set; }
    public string Title { get; set; }
    public List<Tag> Tags { get; set; } = new();
    public List<PostTag> PostTags { get; set; } = new();
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; }
    public List<Post> Posts { get; set; } = new();
    public List<PostTag> PostTags { get; set; } = new();
}

public class PostTag
{
    public int PostId { get; set; }
    public int TagId { get; set; }
    public DateTime TaggedDate { get; set; }  // Additional property

    public Post Post { get; set; }
    public Tag Tag { get; set; }
}

// Configuration with explicit join entity
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Post>()
        .HasMany(p => p.Tags)
        .WithMany(t => t.Posts)
        .UsingEntity<PostTag>(
            r => r.HasOne<Tag>(pt => pt.Tag).WithMany(t => t.PostTags).HasForeignKey(pt => pt.TagId),
            l => l.HasOne<Post>(pt => pt.Post).WithMany(p => p.PostTags).HasForeignKey(pt => pt.PostId),
            j =>
            {
                j.HasKey(pt => new { pt.PostId, pt.TagId });
                j.ToTable("PostTags");
            });
}
```

### One-to-One Relationship

```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }

    public UserProfile Profile { get; set; }
}

public class UserProfile
{
    public int Id { get; set; }
    public string Bio { get; set; }
    public string AvatarUrl { get; set; }
    public DateTime DateOfBirth { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }
}

// Configuration
modelBuilder.Entity<User>()
    .HasOne(u => u.Profile)
    .WithOne(p => p.User)
    .HasForeignKey<UserProfile>(p => p.UserId)
    .OnDelete(DeleteBehavior.Cascade);
```

### Self-Referencing Relationship

```csharp
public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; }

    public int? ManagerId { get; set; }
    public Employee Manager { get; set; }

    public List<Employee> DirectReports { get; set; } = new();
}

// Configuration
modelBuilder.Entity<Employee>()
    .HasOne(e => e.Manager)
    .WithMany(e => e.DirectReports)
    .HasForeignKey(e => e.ManagerId)
    .OnDelete(DeleteBehavior.Restrict);
```

## Database Migrations

Migrations allow you to incrementally update your database schema while preserving existing data.

### Creating and Applying Migrations

```bash
# Create initial migration
dotnet ef migrations add InitialCreate

# Create migration with descriptive name
dotnet ef migrations add AddCustomerPhoneNumber

# Apply migrations to database
dotnet ef database update

# Apply specific migration
dotnet ef database update AddCustomerPhoneNumber

# Remove last migration (if not applied to database)
dotnet ef migrations remove

# Generate SQL script
dotnet ef migrations script

# Generate SQL script for specific range
dotnet ef migrations script InitialCreate AddCustomerPhoneNumber

# Generate idempotent script (safe to run multiple times)
dotnet ef migrations script --idempotent
```

### Migration File Structure

A migration consists of three files:

```csharp
// 20260107_AddCustomerPhoneNumber.cs - Main migration file
public partial class AddCustomerPhoneNumber : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PhoneNumber",
            table: "Customers",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "PhoneNumber",
            table: "Customers");
    }
}
```

### Custom Migration Operations

```csharp
public partial class AddIndexAndStoredProcedure : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add column with default value
        migrationBuilder.AddColumn<bool>(
            name: "IsVip",
            table: "Customers",
            type: "bit",
            nullable: false,
            defaultValue: false);

        // Create index
        migrationBuilder.CreateIndex(
            name: "IX_Customers_IsVip",
            table: "Customers",
            column: "IsVip");

        // Execute raw SQL
        migrationBuilder.Sql(@"
            UPDATE Customers
            SET IsVip = 1
            WHERE TotalOrders > 100");

        // Create stored procedure
        migrationBuilder.Sql(@"
            CREATE PROCEDURE GetVipCustomers
            AS
            BEGIN
                SELECT * FROM Customers WHERE IsVip = 1
            END");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP PROCEDURE IF EXISTS GetVipCustomers");

        migrationBuilder.DropIndex(
            name: "IX_Customers_IsVip",
            table: "Customers");

        migrationBuilder.DropColumn(
            name: "IsVip",
            table: "Customers");
    }
}
```

### Applying Migrations at Runtime

```csharp
public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

        var app = builder.Build();

        // Apply migrations at startup
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await context.Database.MigrateAsync();
        }

        app.Run();
    }
}
```

### Seed Data with Migrations

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Seed data (applied through migrations)
    modelBuilder.Entity<Product>().HasData(
        new Product { Id = 1, Name = "Laptop", Price = 999.99m, StockQuantity = 50 },
        new Product { Id = 2, Name = "Mouse", Price = 29.99m, StockQuantity = 200 },
        new Product { Id = 3, Name = "Keyboard", Price = 79.99m, StockQuantity = 150 }
    );

    modelBuilder.Entity<Customer>().HasData(
        new Customer
        {
            Id = 1,
            FirstName = "John",
            LastName = "Doe",
            Email = "john.doe@example.com",
            CreatedDate = new DateTime(2024, 1, 1),
            IsActive = true
        }
    );
}
```

## LINQ Queries

EF Core uses LINQ (Language Integrated Query) to query databases with strongly-typed C# code.

### Basic Queries

```csharp
using var context = new ApplicationDbContext();

// Get all customers
var allCustomers = await context.Customers.ToListAsync();

// Get first customer
var firstCustomer = await context.Customers.FirstAsync();
var firstOrNull = await context.Customers.FirstOrDefaultAsync();

// Get single customer (throws if multiple found)
var singleCustomer = await context.Customers
    .SingleAsync(c => c.Id == 1);
var singleOrNull = await context.Customers
    .SingleOrDefaultAsync(c => c.Id == 1);

// Find by primary key (uses cache if available)
var customer = await context.Customers.FindAsync(1);

// Check existence
bool hasCustomers = await context.Customers.AnyAsync();
bool hasActive = await context.Customers.AnyAsync(c => c.IsActive);

// Count
int totalCount = await context.Customers.CountAsync();
int activeCount = await context.Customers.CountAsync(c => c.IsActive);
```

### Filtering with Where

```csharp
// Simple filter
var activeCustomers = await context.Customers
    .Where(c => c.IsActive)
    .ToListAsync();

// Multiple conditions
var recentActiveCustomers = await context.Customers
    .Where(c => c.IsActive && c.CreatedDate > DateTime.Now.AddMonths(-6))
    .ToListAsync();

// String operations
var emailFilter = await context.Customers
    .Where(c => c.Email.Contains("@gmail.com"))
    .ToListAsync();

var nameFilter = await context.Customers
    .Where(c => c.LastName.StartsWith("Sm"))
    .ToListAsync();

// Complex conditions
var premiumCustomers = await context.Customers
    .Where(c => c.Orders.Sum(o => o.TotalAmount) > 1000 || c.IsVip)
    .ToListAsync();
```

### Projection with Select

```csharp
// Select specific properties
var customerEmails = await context.Customers
    .Select(c => c.Email)
    .ToListAsync();

// Project to anonymous type
var customerSummary = await context.Customers
    .Select(c => new
    {
        c.Id,
        FullName = c.FirstName + " " + c.LastName,
        c.Email
    })
    .ToListAsync();

// Project to DTO
public class CustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalSpent { get; set; }
}

var customerDtos = await context.Customers
    .Select(c => new CustomerDto
    {
        Id = c.Id,
        FullName = c.FirstName + " " + c.LastName,
        Email = c.Email,
        OrderCount = c.Orders.Count,
        TotalSpent = c.Orders.Sum(o => o.TotalAmount)
    })
    .ToListAsync();
```

### Sorting

```csharp
// Order by ascending
var orderedByName = await context.Customers
    .OrderBy(c => c.LastName)
    .ToListAsync();

// Order by descending
var newestFirst = await context.Customers
    .OrderByDescending(c => c.CreatedDate)
    .ToListAsync();

// Multiple ordering
var sortedCustomers = await context.Customers
    .OrderBy(c => c.LastName)
    .ThenBy(c => c.FirstName)
    .ThenByDescending(c => c.CreatedDate)
    .ToListAsync();
```

### Paging

```csharp
int pageNumber = 1;
int pageSize = 10;

var pagedCustomers = await context.Customers
    .OrderBy(c => c.Id)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

// Total count for pagination UI
int totalCount = await context.Customers.CountAsync();
int totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
```

### Grouping and Aggregation

```csharp
// Group by with aggregation
var ordersByStatus = await context.Orders
    .GroupBy(o => o.Status)
    .Select(g => new
    {
        Status = g.Key,
        Count = g.Count(),
        TotalAmount = g.Sum(o => o.TotalAmount),
        AverageAmount = g.Average(o => o.TotalAmount)
    })
    .ToListAsync();

// Group by with filtering (HAVING clause)
var popularProducts = await context.OrderItems
    .GroupBy(oi => oi.ProductId)
    .Where(g => g.Sum(oi => oi.Quantity) > 100)
    .Select(g => new
    {
        ProductId = g.Key,
        TotalQuantitySold = g.Sum(oi => oi.Quantity)
    })
    .ToListAsync();

// Aggregation functions
var stats = await context.Orders
    .Where(o => o.Status == OrderStatus.Delivered)
    .GroupBy(o => 1)  // Group all into one
    .Select(g => new
    {
        TotalOrders = g.Count(),
        TotalRevenue = g.Sum(o => o.TotalAmount),
        AverageOrder = g.Average(o => o.TotalAmount),
        MaxOrder = g.Max(o => o.TotalAmount),
        MinOrder = g.Min(o => o.TotalAmount)
    })
    .FirstOrDefaultAsync();
```

### Eager Loading with Include

```csharp
// Include related data
var customersWithOrders = await context.Customers
    .Include(c => c.Orders)
    .ToListAsync();

// Multiple includes
var customersWithAll = await context.Customers
    .Include(c => c.Orders)
    .Include(c => c.Address)
    .ToListAsync();

// Nested includes (ThenInclude)
var customersWithOrderDetails = await context.Customers
    .Include(c => c.Orders)
        .ThenInclude(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
    .ToListAsync();

// Filtered include (EF Core 5.0+)
var customersWithRecentOrders = await context.Customers
    .Include(c => c.Orders.Where(o => o.OrderDate > DateTime.Now.AddMonths(-1)))
    .ToListAsync();

// Ordering in include
var customersWithSortedOrders = await context.Customers
    .Include(c => c.Orders.OrderByDescending(o => o.OrderDate).Take(5))
    .ToListAsync();
```

### Explicit and Lazy Loading

```csharp
// Explicit loading
var customer = await context.Customers.FirstAsync();

await context.Entry(customer)
    .Collection(c => c.Orders)
    .LoadAsync();

// Explicit loading with filter
await context.Entry(customer)
    .Collection(c => c.Orders)
    .Query()
    .Where(o => o.TotalAmount > 100)
    .LoadAsync();

// Load reference navigation
var order = await context.Orders.FirstAsync();
await context.Entry(order)
    .Reference(o => o.Customer)
    .LoadAsync();
```

For lazy loading (use with caution due to N+1 query risk):

```csharp
// Enable lazy loading with proxies
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString)
           .UseLazyLoadingProxies());

// Make navigation properties virtual
public class Customer
{
    public int Id { get; set; }
    public string FirstName { get; set; }

    public virtual List<Order> Orders { get; set; }  // virtual enables lazy loading
}
```

### Raw SQL Queries

```csharp
// Query entities with raw SQL
var customers = await context.Customers
    .FromSqlRaw("SELECT * FROM Customers WHERE IsActive = 1")
    .ToListAsync();

// Parameterized query (prevents SQL injection)
var email = "john@example.com";
var customer = await context.Customers
    .FromSqlInterpolated($"SELECT * FROM Customers WHERE Email = {email}")
    .FirstOrDefaultAsync();

// Combine with LINQ
var activeCustomers = await context.Customers
    .FromSqlRaw("SELECT * FROM Customers WHERE IsActive = 1")
    .Where(c => c.CreatedDate > DateTime.Now.AddYears(-1))
    .OrderBy(c => c.LastName)
    .ToListAsync();

// Execute raw SQL command
var rowsAffected = await context.Database
    .ExecuteSqlRawAsync("UPDATE Customers SET IsActive = 0 WHERE LastLoginDate < {0}",
        DateTime.Now.AddYears(-2));

// Call stored procedure
var vipCustomers = await context.Customers
    .FromSqlRaw("EXEC GetVipCustomers @MinOrderCount = {0}", 10)
    .ToListAsync();
```

## Change Tracking and Saving Data

EF Core automatically tracks changes to entities retrieved from the database.

### Entity States

```csharp
// Entity states
public enum EntityState
{
    Detached,   // Not tracked by context
    Unchanged,  // Tracked, no changes
    Added,      // New entity, will be inserted
    Modified,   // Changed, will be updated
    Deleted     // Will be deleted
}

// Check entity state
var customer = await context.Customers.FirstAsync();
var state = context.Entry(customer).State;  // Unchanged

customer.Email = "newemail@example.com";
context.ChangeTracker.DetectChanges();
state = context.Entry(customer).State;  // Modified
```

### Adding Entities

```csharp
// Add single entity
var newCustomer = new Customer
{
    FirstName = "Jane",
    LastName = "Smith",
    Email = "jane.smith@example.com",
    CreatedDate = DateTime.UtcNow,
    IsActive = true
};

context.Customers.Add(newCustomer);
await context.SaveChangesAsync();

// Entity now has generated ID
Console.WriteLine($"New customer ID: {newCustomer.Id}");

// Add with related entities
var newOrder = new Order
{
    OrderDate = DateTime.UtcNow,
    TotalAmount = 150.00m,
    Status = OrderStatus.Pending,
    Customer = newCustomer,  // Links automatically
    OrderItems = new List<OrderItem>
    {
        new OrderItem { ProductId = 1, Quantity = 2, UnitPrice = 50.00m },
        new OrderItem { ProductId = 2, Quantity = 1, UnitPrice = 50.00m }
    }
};

context.Orders.Add(newOrder);
await context.SaveChangesAsync();

// Add multiple entities
var customers = new List<Customer>
{
    new Customer { FirstName = "Alice", LastName = "Brown", Email = "alice@example.com" },
    new Customer { FirstName = "Bob", LastName = "Wilson", Email = "bob@example.com" }
};

context.Customers.AddRange(customers);
await context.SaveChangesAsync();
```

### Updating Entities

```csharp
// Update tracked entity
var customer = await context.Customers.FindAsync(1);
customer.Email = "updated@example.com";
customer.IsActive = false;
await context.SaveChangesAsync();

// Update disconnected entity
var updatedCustomer = new Customer
{
    Id = 1,
    FirstName = "John",
    LastName = "Doe",
    Email = "john.updated@example.com",
    IsActive = true
};

context.Customers.Update(updatedCustomer);
await context.SaveChangesAsync();

// Update specific properties only
var customerToUpdate = new Customer { Id = 1 };
context.Customers.Attach(customerToUpdate);
customerToUpdate.Email = "specific.update@example.com";
context.Entry(customerToUpdate).Property(c => c.Email).IsModified = true;
await context.SaveChangesAsync();
```

### Deleting Entities

```csharp
// Delete tracked entity
var customer = await context.Customers.FindAsync(1);
context.Customers.Remove(customer);
await context.SaveChangesAsync();

// Delete by ID (without loading)
var customerToDelete = new Customer { Id = 1 };
context.Customers.Remove(customerToDelete);
await context.SaveChangesAsync();

// Delete multiple
var inactiveCustomers = await context.Customers
    .Where(c => !c.IsActive)
    .ToListAsync();
context.Customers.RemoveRange(inactiveCustomers);
await context.SaveChangesAsync();

// Bulk delete (EF Core 7.0+)
await context.Customers
    .Where(c => c.CreatedDate < DateTime.Now.AddYears(-5))
    .ExecuteDeleteAsync();
```

### Transactions

```csharp
// Implicit transaction (SaveChanges wraps in transaction)
await context.SaveChangesAsync();  // All or nothing

// Explicit transaction
using var transaction = await context.Database.BeginTransactionAsync();

try
{
    var customer = new Customer { FirstName = "Test", LastName = "User", Email = "test@example.com" };
    context.Customers.Add(customer);
    await context.SaveChangesAsync();

    var order = new Order { CustomerId = customer.Id, OrderDate = DateTime.UtcNow };
    context.Orders.Add(order);
    await context.SaveChangesAsync();

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}

// Transaction with savepoint
using var transaction = await context.Database.BeginTransactionAsync();

context.Customers.Add(new Customer { FirstName = "A", LastName = "B", Email = "a@b.com" });
await context.SaveChangesAsync();

await transaction.CreateSavepointAsync("BeforeOrder");

try
{
    context.Orders.Add(new Order { /* ... */ });
    await context.SaveChangesAsync();
}
catch
{
    await transaction.RollbackToSavepointAsync("BeforeOrder");
}

await transaction.CommitAsync();
```

### Concurrency Control

```csharp
// Configure concurrency token
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; }
}

// Or with Fluent API
modelBuilder.Entity<Product>()
    .Property(p => p.RowVersion)
    .IsRowVersion();

// Handle concurrency conflicts
try
{
    var product = await context.Products.FindAsync(1);
    product.Price = 29.99m;
    await context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    foreach (var entry in ex.Entries)
    {
        var databaseValues = await entry.GetDatabaseValuesAsync();

        if (databaseValues == null)
        {
            // Entity was deleted
            Console.WriteLine("Entity was deleted by another user");
        }
        else
        {
            // Entity was modified
            var databaseEntity = (Product)databaseValues.ToObject();

            // Option 1: Database wins
            entry.OriginalValues.SetValues(databaseValues);

            // Option 2: Client wins
            // entry.OriginalValues.SetValues(databaseValues);
            // Keep current values and retry save

            // Option 3: Merge values
            // Implement custom merge logic
        }
    }
}
```

## Performance Optimization

### No-Tracking Queries

```csharp
// No tracking for read-only queries (better performance)
var customers = await context.Customers
    .AsNoTracking()
    .ToListAsync();

// Set as default for entire context
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
}

// Track when needed
var customer = await context.Customers
    .AsTracking()
    .FirstAsync(c => c.Id == 1);
```

### Compiled Queries

```csharp
// Define compiled query for frequently used queries
private static readonly Func<ApplicationDbContext, int, Task<Customer>> GetCustomerById =
    EF.CompileAsyncQuery((ApplicationDbContext context, int id) =>
        context.Customers
            .Include(c => c.Orders)
            .FirstOrDefault(c => c.Id == id));

private static readonly Func<ApplicationDbContext, bool, IAsyncEnumerable<Customer>> GetCustomersByStatus =
    EF.CompileAsyncQuery((ApplicationDbContext context, bool isActive) =>
        context.Customers.Where(c => c.IsActive == isActive));

// Use compiled queries
var customer = await GetCustomerById(context, 1);

await foreach (var c in GetCustomersByStatus(context, true))
{
    Console.WriteLine(c.FirstName);
}
```

### Batch Operations (EF Core 7.0+)

```csharp
// Bulk update without loading entities
await context.Customers
    .Where(c => c.CreatedDate < DateTime.Now.AddYears(-1))
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(c => c.IsActive, false)
        .SetProperty(c => c.UpdatedDate, DateTime.UtcNow));

// Bulk delete without loading entities
await context.Orders
    .Where(o => o.Status == OrderStatus.Cancelled && o.OrderDate < DateTime.Now.AddYears(-2))
    .ExecuteDeleteAsync();
```

### Split Queries

```csharp
// Split query to avoid cartesian explosion
var customers = await context.Customers
    .Include(c => c.Orders)
        .ThenInclude(o => o.OrderItems)
    .AsSplitQuery()  // Executes multiple queries instead of one big join
    .ToListAsync();

// Set as default
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
}
```

### Query Optimization Tips

```csharp
// 1. Project only needed columns
var customerNames = await context.Customers
    .Select(c => new { c.FirstName, c.LastName })
    .ToListAsync();

// 2. Use pagination
var pagedResults = await context.Customers
    .OrderBy(c => c.Id)
    .Skip(0)
    .Take(20)
    .ToListAsync();

// 3. Avoid N+1 queries with eager loading
var customersWithOrders = await context.Customers
    .Include(c => c.Orders)
    .ToListAsync();

// 4. Use filtered includes
var customersWithRecentOrders = await context.Customers
    .Include(c => c.Orders.Where(o => o.OrderDate > DateTime.Now.AddMonths(-1)))
    .ToListAsync();

// 5. Index frequently queried columns
modelBuilder.Entity<Customer>()
    .HasIndex(c => c.Email);

modelBuilder.Entity<Customer>()
    .HasIndex(c => new { c.LastName, c.FirstName });

// 6. Use async operations
var customers = await context.Customers.ToListAsync();
```

### Connection and DbContext Pooling

```csharp
// Enable DbContext pooling
builder.Services.AddDbContextPool<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString),
    poolSize: 128);  // Maximum pool size

// Configure connection string for connection pooling
var connectionString = "Server=myServer;Database=myDb;Trusted_Connection=True;" +
    "Max Pool Size=100;Min Pool Size=5;Connection Timeout=30;";
```

## Advanced Topics

### Global Query Filters

```csharp
// Soft delete implementation
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedDate { get; set; }
}

public class Customer : ISoftDeletable
{
    public int Id { get; set; }
    public string Name { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedDate { get; set; }
}

// Configure global filter
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Customer>()
        .HasQueryFilter(c => !c.IsDeleted);
}

// Queries automatically exclude deleted
var customers = await context.Customers.ToListAsync();  // Only non-deleted

// Bypass filter when needed
var allCustomers = await context.Customers
    .IgnoreQueryFilters()
    .ToListAsync();
```

### Value Conversions

```csharp
// Enum to string conversion
modelBuilder.Entity<Order>()
    .Property(o => o.Status)
    .HasConversion<string>();

// Custom value converter
public class EncryptedStringConverter : ValueConverter<string, string>
{
    public EncryptedStringConverter()
        : base(
            v => Encrypt(v),
            v => Decrypt(v))
    {
    }

    private static string Encrypt(string value) => /* encryption logic */;
    private static string Decrypt(string value) => /* decryption logic */;
}

modelBuilder.Entity<Customer>()
    .Property(c => c.SocialSecurityNumber)
    .HasConversion(new EncryptedStringConverter());

// JSON column conversion (EF Core 7.0+)
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Address Address { get; set; }  // Stored as JSON
}

modelBuilder.Entity<Customer>()
    .OwnsOne(c => c.Address, builder =>
    {
        builder.ToJson();
    });
```

### Owned Entity Types

```csharp
public class Order
{
    public int Id { get; set; }
    public decimal Amount { get; set; }

    public Address ShippingAddress { get; set; }
    public Address BillingAddress { get; set; }
}

public class Address  // Owned type (no separate table)
{
    public string Street { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public string ZipCode { get; set; }
    public string Country { get; set; }
}

// Configuration
modelBuilder.Entity<Order>(entity =>
{
    entity.OwnsOne(o => o.ShippingAddress, address =>
    {
        address.Property(a => a.Street).HasColumnName("ShippingStreet");
        address.Property(a => a.City).HasColumnName("ShippingCity");
        address.Property(a => a.State).HasColumnName("ShippingState");
        address.Property(a => a.ZipCode).HasColumnName("ShippingZipCode");
        address.Property(a => a.Country).HasColumnName("ShippingCountry");
    });

    entity.OwnsOne(o => o.BillingAddress, address =>
    {
        address.Property(a => a.Street).HasColumnName("BillingStreet");
        address.Property(a => a.City).HasColumnName("BillingCity");
        // etc.
    });
});
```

### Interceptors

```csharp
public class AuditInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        UpdateAuditFields(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateAuditFields(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateAuditFields(DbContext context)
    {
        var entries = context.ChangeTracker.Entries<IAuditable>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedDate = DateTime.UtcNow;
                entry.Entity.CreatedBy = GetCurrentUser();
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.ModifiedDate = DateTime.UtcNow;
                entry.Entity.ModifiedBy = GetCurrentUser();
            }
        }
    }
}

// Register interceptor
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
{
    optionsBuilder
        .UseSqlServer(connectionString)
        .AddInterceptors(new AuditInterceptor());
}
```

### Table-per-Hierarchy (TPH) Inheritance

```csharp
public abstract class Payment
{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
}

public class CreditCardPayment : Payment
{
    public string CardNumber { get; set; }
    public string CardHolderName { get; set; }
}

public class BankTransferPayment : Payment
{
    public string BankName { get; set; }
    public string AccountNumber { get; set; }
}

// Configuration (TPH is default)
modelBuilder.Entity<Payment>()
    .HasDiscriminator<string>("PaymentType")
    .HasValue<CreditCardPayment>("CreditCard")
    .HasValue<BankTransferPayment>("BankTransfer");

// Query specific type
var creditCardPayments = await context.Payments
    .OfType<CreditCardPayment>()
    .ToListAsync();
```

## Best Practices

### DbContext Lifetime Management

```csharp
// Use scoped lifetime (one per request in web apps)
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// Use DbContext factory for background services
services.AddDbContextFactory<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

public class BackgroundWorker : BackgroundService
{
    private readonly IDbContextFactory<ApplicationDbContext> _contextFactory;

    public BackgroundWorker(IDbContextFactory<ApplicationDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var context = await _contextFactory.CreateDbContextAsync(stoppingToken);
        // Use context
    }
}
```

### Repository Pattern (Optional)

```csharp
public interface IRepository<T> where T : class
{
    Task<T> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    void Update(T entity);
    void Remove(T entity);
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

    public async Task<T> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

    public async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        => await _dbSet.Where(predicate).ToListAsync();

    public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

    public void Update(T entity) => _dbSet.Update(entity);

    public void Remove(T entity) => _dbSet.Remove(entity);
}

// Unit of Work
public interface IUnitOfWork : IDisposable
{
    IRepository<Customer> Customers { get; }
    IRepository<Order> Orders { get; }
    Task<int> SaveChangesAsync();
}
```

### Error Handling

```csharp
try
{
    await context.SaveChangesAsync();
}
catch (DbUpdateConcurrencyException ex)
{
    // Handle optimistic concurrency conflicts
    _logger.LogWarning(ex, "Concurrency conflict occurred");
    throw;
}
catch (DbUpdateException ex)
{
    // Handle database update errors (constraints, etc.)
    _logger.LogError(ex, "Database update failed");
    throw;
}
catch (OperationCanceledException)
{
    // Handle cancellation
    _logger.LogInformation("Operation was cancelled");
    throw;
}
```

### Testing with In-Memory Database

```csharp
public class CustomerServiceTests
{
    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);

        // Seed test data
        context.Customers.Add(new Customer
        {
            Id = 1,
            FirstName = "Test",
            LastName = "User",
            Email = "test@example.com"
        });
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task GetCustomer_ReturnsCustomer_WhenExists()
    {
        using var context = CreateContext();
        var service = new CustomerService(context);

        var customer = await service.GetCustomerAsync(1);

        Assert.NotNull(customer);
        Assert.Equal("Test", customer.FirstName);
    }
}
```

### Summary of Best Practices

1. **Use async operations** for all database calls in web applications
2. **Use AsNoTracking()** for read-only queries to improve performance
3. **Use projections (Select)** to retrieve only needed data
4. **Use eager loading (Include)** strategically to avoid N+1 queries
5. **Configure indexes** on frequently queried columns
6. **Use migrations** for all schema changes
7. **Handle concurrency** with optimistic locking when appropriate
8. **Use compiled queries** for frequently executed queries
9. **Configure connection pooling** appropriately
10. **Use DbContext pooling** in high-throughput scenarios
11. **Keep DbContext lifetime short** (scoped in web apps)
12. **Use transactions** for operations that must be atomic
13. **Log queries in development** to identify performance issues
14. **Use value converters** for complex type mappings

## Conclusion

Entity Framework Core is a powerful and flexible ORM that simplifies data access in .NET applications. By understanding the core concepts of DbContext, entity configuration, migrations, LINQ queries, change tracking, and performance optimization, you can build robust and efficient data access layers.

Key takeaways:

- **DbContext** is your gateway to the database, configure it properly for your environment
- **Entity configuration** can be done via conventions, data annotations, or Fluent API
- **Migrations** enable safe and versioned database schema changes
- **LINQ queries** provide strongly-typed, maintainable data access
- **Change tracking** automates detecting and saving changes
- **Performance optimization** requires understanding query patterns and using appropriate strategies

With these concepts mastered, you will be well-equipped to leverage EF Core effectively in your .NET projects, from simple CRUD applications to complex enterprise systems.
