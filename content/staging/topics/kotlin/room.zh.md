---
title: Room 数据库
description: Android Room 持久化库完全指南，Entity、Dao、Database 注解、关系映射与 Flow 集成
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Room
  - Android
  - 数据库
  - SQLite
  - Jetpack
status: imported
origin: old/src/content/docs/kotlin/room.zh.md
divergence: 0.225
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Kotlin
  subcategory: Android
  order: 15
  lastUpdated: 2026-01-07
---

Room 是 Android Jetpack 提供的持久化库，它在 SQLite 之上提供了一个抽象层，使得在 Android 应用中进行数据库操作变得更加简单、类型安全且高效。本文将深入探讨 Room 的核心概念、使用方法和最佳实践。

## 概念解释

### 什么是 Room

Room 是 Google 官方推荐的 Android 本地数据库解决方案，它是 Android Jetpack 架构组件的重要组成部分。Room 提供了：

1. **编译时验证**：SQL 查询在编译时进行验证，避免运行时错误
2. **减少样板代码**：通过注解自动生成数据库访问代码
3. **与其他 Jetpack 组件无缝集成**：支持 LiveData、Flow、RxJava
4. **类型安全**：自动将数据库行映射到 Kotlin/Java 对象

### Room 解决的问题

在 Room 出现之前，Android 开发者通常使用原生 SQLite API 或第三方 ORM 库。原生 SQLite 存在以下问题：

- 大量样板代码：需要手动编写 SQL 语句、游标处理
- 缺乏编译时检查：SQL 语句错误只能在运行时发现
- 容易出错：手动处理数据库连接、事务容易出错
- 与架构组件集成困难

Room 通过注解处理器和代码生成解决了这些问题，让数据库操作变得简单且安全。

### Room 的三大核心组件

1. **Entity（实体）**：表示数据库中的表
2. **DAO（数据访问对象）**：包含访问数据库的方法
3. **Database（数据库）**：持有数据库并作为应用持久化数据的主要访问点

## 核心原理

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                     Application                          │
├─────────────────────────────────────────────────────────┤
│                     Repository                           │
├─────────────────────────────────────────────────────────┤
│     Room Database                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │    DAO      │  │    DAO      │  │    DAO      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Entity    │  │   Entity    │  │   Entity    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                     SQLite                               │
└─────────────────────────────────────────────────────────┘
```

### 注解处理器工作流程

Room 使用 Kotlin Symbol Processing (KSP) 或 KAPT 在编译时处理注解：

1. 扫描所有带有 Room 注解的类
2. 验证 SQL 语句的正确性
3. 生成实现类（如 `UserDao_Impl`）
4. 生成数据库实现类

### 线程模型

Room 默认禁止在主线程进行数据库操作，因为数据库操作可能是耗时的。Room 提供了多种异步访问方式：

- **挂起函数**：使用 Kotlin 协程
- **Flow**：响应式数据流
- **LiveData**：生命周期感知的可观察数据
- **RxJava**：响应式编程支持

## 核心要点

### 添加依赖

```kotlin
// build.gradle.kts (Module)
plugins {
    id("com.google.devtools.ksp") version "1.9.22-1.0.17"
}

dependencies {
    val roomVersion = "2.6.1"

    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion") // Kotlin 扩展和协程支持
    ksp("androidx.room:room-compiler:$roomVersion")

    // 可选：RxJava2 支持
    implementation("androidx.room:room-rxjava2:$roomVersion")

    // 可选：RxJava3 支持
    implementation("androidx.room:room-rxjava3:$roomVersion")

    // 可选：Guava 支持
    implementation("androidx.room:room-guava:$roomVersion")

    // 测试
    testImplementation("androidx.room:room-testing:$roomVersion")
}
```

### Entity（实体）定义

Entity 类表示数据库中的一张表：

```kotlin
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ColumnInfo

@Entity(tableName = "users")
data class User(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "first_name")
    val firstName: String,

    @ColumnInfo(name = "last_name")
    val lastName: String,

    @ColumnInfo(name = "email", defaultValue = "")
    val email: String = "",

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)
```

### DAO（数据访问对象）

DAO 定义了访问数据库的方法：

```kotlin
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    // 插入操作
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User): Long

    @Insert
    suspend fun insertAll(users: List<User>): List<Long>

    // 更新操作
    @Update
    suspend fun update(user: User): Int

    // 删除操作
    @Delete
    suspend fun delete(user: User): Int

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteById(userId: Long): Int

    @Query("DELETE FROM users")
    suspend fun deleteAll()

    // 查询操作
    @Query("SELECT * FROM users")
    suspend fun getAll(): List<User>

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getById(userId: Long): User?

    @Query("SELECT * FROM users WHERE first_name LIKE :name OR last_name LIKE :name")
    suspend fun findByName(name: String): List<User>

    // Flow 查询（响应式）
    @Query("SELECT * FROM users ORDER BY first_name ASC")
    fun getAllFlow(): Flow<List<User>>

    @Query("SELECT * FROM users WHERE id = :userId")
    fun getByIdFlow(userId: Long): Flow<User?>

    // 带参数的复杂查询
    @Query("""
        SELECT * FROM users
        WHERE created_at BETWEEN :startTime AND :endTime
        ORDER BY created_at DESC
    """)
    suspend fun getUsersInTimeRange(startTime: Long, endTime: Long): List<User>
}
```

### Database（数据库）

Database 类是应用访问持久化数据的主入口：

```kotlin
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [User::class, Post::class],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun postDao(): PostDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"
                )
                .fallbackToDestructiveMigration() // 仅用于开发环境
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

## 代码示例

### 完整的 CRUD 示例

#### 定义 Entity

```kotlin
import androidx.room.*

@Entity(
    tableName = "articles",
    indices = [
        Index(value = ["title"], unique = true),
        Index(value = ["author_id"])
    ]
)
data class Article(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "title")
    val title: String,

    @ColumnInfo(name = "content")
    val content: String,

    @ColumnInfo(name = "author_id")
    val authorId: Long,

    @ColumnInfo(name = "is_published", defaultValue = "0")
    val isPublished: Boolean = false,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long = System.currentTimeMillis()
)
```

#### 定义 DAO

```kotlin
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ArticleDao {
    // 插入
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(article: Article): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(article: Article): Long

    @Insert
    suspend fun insertAll(articles: List<Article>): List<Long>

    // 更新
    @Update
    suspend fun update(article: Article): Int

    @Query("UPDATE articles SET is_published = :published, updated_at = :updatedAt WHERE id = :articleId")
    suspend fun updatePublishStatus(articleId: Long, published: Boolean, updatedAt: Long = System.currentTimeMillis()): Int

    // 删除
    @Delete
    suspend fun delete(article: Article): Int

    @Query("DELETE FROM articles WHERE id = :articleId")
    suspend fun deleteById(articleId: Long): Int

    @Query("DELETE FROM articles WHERE author_id = :authorId")
    suspend fun deleteByAuthor(authorId: Long): Int

    // 查询 - 返回挂起函数
    @Query("SELECT * FROM articles WHERE id = :articleId")
    suspend fun getById(articleId: Long): Article?

    @Query("SELECT * FROM articles WHERE author_id = :authorId ORDER BY created_at DESC")
    suspend fun getByAuthor(authorId: Long): List<Article>

    @Query("SELECT * FROM articles WHERE is_published = 1 ORDER BY created_at DESC")
    suspend fun getPublished(): List<Article>

    @Query("SELECT * FROM articles WHERE title LIKE '%' || :keyword || '%' OR content LIKE '%' || :keyword || '%'")
    suspend fun search(keyword: String): List<Article>

    // 查询 - 返回 Flow（响应式）
    @Query("SELECT * FROM articles ORDER BY updated_at DESC")
    fun getAllFlow(): Flow<List<Article>>

    @Query("SELECT * FROM articles WHERE id = :articleId")
    fun getByIdFlow(articleId: Long): Flow<Article?>

    @Query("SELECT COUNT(*) FROM articles WHERE author_id = :authorId")
    fun getCountByAuthorFlow(authorId: Long): Flow<Int>

    // 分页查询
    @Query("SELECT * FROM articles ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getPage(limit: Int, offset: Int): List<Article>

    // 事务操作
    @Transaction
    suspend fun replaceAll(articles: List<Article>) {
        deleteAll()
        insertAll(articles)
    }

    @Query("DELETE FROM articles")
    suspend fun deleteAll()
}
```

### 类型转换器

Room 只支持基本类型和它们的包装类。对于其他类型，需要使用 TypeConverter：

```kotlin
import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.Date

class Converters {
    private val gson = Gson()

    // Date 转换
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }

    // List<String> 转换
    @TypeConverter
    fun fromStringList(value: List<String>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.let {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(it, type)
        }
    }

    // 枚举转换
    @TypeConverter
    fun fromStatus(status: ArticleStatus): String {
        return status.name
    }

    @TypeConverter
    fun toStatus(value: String): ArticleStatus {
        return ArticleStatus.valueOf(value)
    }
}

enum class ArticleStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED
}
```

### 嵌入对象

使用 `@Embedded` 注解可以将一个对象的字段直接嵌入到表中：

```kotlin
data class Address(
    val street: String,
    val city: String,
    val province: String,
    val postalCode: String
)

@Entity(tableName = "customers")
data class Customer(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    val name: String,
    val phone: String,

    @Embedded(prefix = "home_")
    val homeAddress: Address,

    @Embedded(prefix = "work_")
    val workAddress: Address?
)
```

生成的表结构将包含：`id`, `name`, `phone`, `home_street`, `home_city`, `home_province`, `home_postal_code`, `work_street`, `work_city`, `work_province`, `work_postal_code`

### 关系映射

#### 一对多关系

```kotlin
// 作者实体
@Entity(tableName = "authors")
data class Author(
    @PrimaryKey(autoGenerate = true)
    val authorId: Long = 0,
    val name: String,
    val bio: String
)

// 书籍实体
@Entity(
    tableName = "books",
    foreignKeys = [
        ForeignKey(
            entity = Author::class,
            parentColumns = ["authorId"],
            childColumns = ["author_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("author_id")]
)
data class Book(
    @PrimaryKey(autoGenerate = true)
    val bookId: Long = 0,

    @ColumnInfo(name = "author_id")
    val authorId: Long,

    val title: String,
    val isbn: String
)

// 一对多关系数据类
data class AuthorWithBooks(
    @Embedded
    val author: Author,

    @Relation(
        parentColumn = "authorId",
        entityColumn = "author_id"
    )
    val books: List<Book>
)

// DAO
@Dao
interface AuthorDao {
    @Transaction
    @Query("SELECT * FROM authors")
    suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>

    @Transaction
    @Query("SELECT * FROM authors WHERE authorId = :authorId")
    suspend fun getAuthorWithBooks(authorId: Long): AuthorWithBooks?

    @Transaction
    @Query("SELECT * FROM authors")
    fun getAuthorsWithBooksFlow(): Flow<List<AuthorWithBooks>>
}
```

#### 多对多关系

```kotlin
// 播放列表实体
@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey(autoGenerate = true)
    val playlistId: Long = 0,
    val name: String,
    val description: String
)

// 歌曲实体
@Entity(tableName = "songs")
data class Song(
    @PrimaryKey(autoGenerate = true)
    val songId: Long = 0,
    val title: String,
    val artist: String,
    val duration: Int // 秒
)

// 交叉引用表
@Entity(
    tableName = "playlist_song_cross_ref",
    primaryKeys = ["playlistId", "songId"],
    foreignKeys = [
        ForeignKey(
            entity = Playlist::class,
            parentColumns = ["playlistId"],
            childColumns = ["playlistId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Song::class,
            parentColumns = ["songId"],
            childColumns = ["songId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class PlaylistSongCrossRef(
    val playlistId: Long,
    val songId: Long,
    val addedAt: Long = System.currentTimeMillis()
)

// 播放列表及其歌曲
data class PlaylistWithSongs(
    @Embedded
    val playlist: Playlist,

    @Relation(
        parentColumn = "playlistId",
        entityColumn = "songId",
        associateBy = Junction(PlaylistSongCrossRef::class)
    )
    val songs: List<Song>
)

// 歌曲及其所属播放列表
data class SongWithPlaylists(
    @Embedded
    val song: Song,

    @Relation(
        parentColumn = "songId",
        entityColumn = "playlistId",
        associateBy = Junction(PlaylistSongCrossRef::class)
    )
    val playlists: List<Playlist>
)

// DAO
@Dao
interface PlaylistDao {
    @Insert
    suspend fun insertPlaylist(playlist: Playlist): Long

    @Insert
    suspend fun insertSong(song: Song): Long

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertCrossRef(crossRef: PlaylistSongCrossRef)

    @Delete
    suspend fun deleteCrossRef(crossRef: PlaylistSongCrossRef)

    @Transaction
    @Query("SELECT * FROM playlists")
    suspend fun getPlaylistsWithSongs(): List<PlaylistWithSongs>

    @Transaction
    @Query("SELECT * FROM playlists WHERE playlistId = :playlistId")
    fun getPlaylistWithSongsFlow(playlistId: Long): Flow<PlaylistWithSongs?>

    @Transaction
    @Query("SELECT * FROM songs WHERE songId = :songId")
    suspend fun getSongWithPlaylists(songId: Long): SongWithPlaylists?

    // 添加歌曲到播放列表
    @Transaction
    suspend fun addSongToPlaylist(playlistId: Long, songId: Long) {
        insertCrossRef(PlaylistSongCrossRef(playlistId, songId))
    }

    // 从播放列表移除歌曲
    @Query("DELETE FROM playlist_song_cross_ref WHERE playlistId = :playlistId AND songId = :songId")
    suspend fun removeSongFromPlaylist(playlistId: Long, songId: Long)
}
```

### 数据库迁移

当数据库结构发生变化时，需要进行迁移：

```kotlin
// 版本 1 -> 2：添加新列
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
    }
}

// 版本 2 -> 3：添加新表
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY NOT NULL,
                key TEXT NOT NULL,
                value TEXT NOT NULL,
                UNIQUE(key)
            )
        """)
    }
}

// 版本 3 -> 4：修改列类型（需要重建表）
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 创建临时表
        database.execSQL("""
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL DEFAULT '',
                avatar_url TEXT DEFAULT '',
                age INTEGER NOT NULL DEFAULT 0
            )
        """)

        // 复制数据
        database.execSQL("""
            INSERT INTO users_new (id, first_name, last_name, email, avatar_url)
            SELECT id, first_name, last_name, email, avatar_url FROM users
        """)

        // 删除旧表
        database.execSQL("DROP TABLE users")

        // 重命名新表
        database.execSQL("ALTER TABLE users_new RENAME TO users")
    }
}

// 应用迁移
val database = Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
    .build()
```

### 自动迁移（Room 2.4+）

Room 2.4 及以上版本支持自动迁移：

```kotlin
@Database(
    entities = [User::class, Article::class],
    version = 3,
    autoMigrations = [
        AutoMigration(from = 1, to = 2),
        AutoMigration(from = 2, to = 3, spec = AppDatabase.Migration2To3::class)
    ]
)
abstract class AppDatabase : RoomDatabase() {

    @RenameColumn(tableName = "users", fromColumnName = "name", toColumnName = "full_name")
    @DeleteColumn(tableName = "articles", columnName = "temp_field")
    class Migration2To3 : AutoMigrationSpec

    abstract fun userDao(): UserDao
    abstract fun articleDao(): ArticleDao
}
```

### Flow 集成

Room 与 Kotlin Flow 的深度集成让响应式编程变得简单：

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope

class ArticleViewModel(
    private val articleDao: ArticleDao
) : ViewModel() {

    // 所有文章列表（响应式）
    val articles: StateFlow<List<Article>> = articleDao.getAllFlow()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // 搜索功能
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val searchResults: Flow<List<Article>> = _searchQuery
        .debounce(300) // 防抖
        .filter { it.isNotBlank() }
        .flatMapLatest { query ->
            flow { emit(articleDao.search(query)) }
        }

    // 单篇文章详情
    fun getArticleById(id: Long): Flow<Article?> {
        return articleDao.getByIdFlow(id)
    }

    // 文章统计
    val publishedCount: Flow<Int> = articleDao.getAllFlow()
        .map { articles -> articles.count { it.isPublished } }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun createArticle(title: String, content: String, authorId: Long) {
        viewModelScope.launch {
            val article = Article(
                title = title,
                content = content,
                authorId = authorId
            )
            articleDao.insert(article)
        }
    }

    fun publishArticle(articleId: Long) {
        viewModelScope.launch {
            articleDao.updatePublishStatus(articleId, true)
        }
    }

    fun deleteArticle(article: Article) {
        viewModelScope.launch {
            articleDao.delete(article)
        }
    }
}
```

### 在 Compose 中使用

```kotlin
import androidx.compose.runtime.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun ArticleListScreen(
    viewModel: ArticleViewModel
) {
    val articles by viewModel.articles.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()

    Column {
        // 搜索栏
        TextField(
            value = searchQuery,
            onValueChange = { viewModel.updateSearchQuery(it) },
            placeholder = { Text("搜索文章...") },
            modifier = Modifier.fillMaxWidth()
        )

        // 文章列表
        LazyColumn {
            items(
                items = articles,
                key = { it.id }
            ) { article ->
                ArticleItem(
                    article = article,
                    onPublish = { viewModel.publishArticle(article.id) },
                    onDelete = { viewModel.deleteArticle(article) }
                )
            }
        }
    }
}

@Composable
fun ArticleDetailScreen(
    articleId: Long,
    viewModel: ArticleViewModel
) {
    val article by viewModel.getArticleById(articleId)
        .collectAsStateWithLifecycle(initialValue = null)

    article?.let {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = it.title,
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = it.content)
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "发布状态: ${if (it.isPublished) "已发布" else "草稿"}",
                style = MaterialTheme.typography.bodySmall
            )
        }
    } ?: run {
        CircularProgressIndicator()
    }
}
```

## 最佳实践

### 使用 Repository 模式

```kotlin
class ArticleRepository(
    private val articleDao: ArticleDao,
    private val apiService: ArticleApiService,
    private val ioDispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    val articles: Flow<List<Article>> = articleDao.getAllFlow()

    suspend fun refreshArticles() = withContext(ioDispatcher) {
        try {
            val remoteArticles = apiService.getArticles()
            articleDao.replaceAll(remoteArticles.map { it.toEntity() })
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getArticle(id: Long): Article? = withContext(ioDispatcher) {
        articleDao.getById(id)
    }

    suspend fun saveArticle(article: Article): Long = withContext(ioDispatcher) {
        articleDao.upsert(article)
    }

    suspend fun deleteArticle(article: Article) = withContext(ioDispatcher) {
        articleDao.delete(article)
    }
}
```

### 使用依赖注入（Hilt）

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "app_database"
        )
        .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
        .build()
    }

    @Provides
    fun provideUserDao(database: AppDatabase): UserDao {
        return database.userDao()
    }

    @Provides
    fun provideArticleDao(database: AppDatabase): ArticleDao {
        return database.articleDao()
    }
}

@HiltViewModel
class ArticleViewModel @Inject constructor(
    private val repository: ArticleRepository
) : ViewModel() {
    // ...
}
```

### 事务操作

```kotlin
@Dao
interface OrderDao {
    @Insert
    suspend fun insertOrder(order: Order): Long

    @Insert
    suspend fun insertOrderItems(items: List<OrderItem>)

    @Query("UPDATE products SET stock = stock - :quantity WHERE id = :productId")
    suspend fun decreaseStock(productId: Long, quantity: Int)

    @Transaction
    suspend fun createOrderWithItems(order: Order, items: List<OrderItem>) {
        val orderId = insertOrder(order)
        val itemsWithOrderId = items.map { it.copy(orderId = orderId) }
        insertOrderItems(itemsWithOrderId)

        // 更新库存
        items.forEach { item ->
            decreaseStock(item.productId, item.quantity)
        }
    }
}
```

### 预填充数据库

```kotlin
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .createFromAsset("database/prepopulated.db") // 从 assets 预填充
    // 或者
    .createFromFile(File("path/to/prepopulated.db")) // 从文件预填充
    .build()

// 使用回调填充初始数据
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addCallback(object : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            // 填充初始数据
            CoroutineScope(Dispatchers.IO).launch {
                database.categoryDao().insertAll(getDefaultCategories())
            }
        }
    })
    .build()
```

### 导出 Schema

在 `build.gradle.kts` 中配置：

```kotlin
ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}
```

这将导出每个版本的 schema JSON 文件，用于：
- 验证迁移正确性
- 编写迁移测试
- 文档参考

## 常见陷阱

### 在主线程进行数据库操作

```kotlin
// 错误：会抛出 IllegalStateException
fun getUser(id: Long): User {
    return userDao.getById(id) // 不能在主线程调用
}

// 正确：使用协程
suspend fun getUser(id: Long): User? {
    return userDao.getById(id)
}

// 正确：使用 Flow
fun getUserFlow(id: Long): Flow<User?> {
    return userDao.getByIdFlow(id)
}
```

### 忘记使用 @Transaction

```kotlin
// 错误：关系查询没有 @Transaction 可能导致数据不一致
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>

// 正确：使用 @Transaction
@Transaction
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>
```

### LiveData/Flow 的错误使用

```kotlin
// 错误：每次调用都创建新的 Flow
fun getArticles(): Flow<List<Article>> {
    return articleDao.getAllFlow()
}

// 正确：使用属性缓存
val articles: Flow<List<Article>> = articleDao.getAllFlow()
```

### 忽略外键约束

```kotlin
// 如果不设置 onDelete，删除 Author 时会失败
@Entity(
    foreignKeys = [
        ForeignKey(
            entity = Author::class,
            parentColumns = ["id"],
            childColumns = ["author_id"],
            onDelete = ForeignKey.CASCADE // 或 SET_NULL, NO_ACTION
        )
    ]
)
data class Book(...)
```

### 复杂对象未使用 TypeConverter

```kotlin
// 错误：Room 不知道如何存储 List<Tag>
@Entity
data class Article(
    val id: Long,
    val tags: List<Tag> // 编译错误
)

// 正确：使用 TypeConverter
@TypeConverter
fun fromTagList(tags: List<Tag>): String = gson.toJson(tags)

@TypeConverter
fun toTagList(json: String): List<Tag> = gson.fromJson(json, ...)
```

## 性能考量

### 使用索引

```kotlin
@Entity(
    tableName = "articles",
    indices = [
        Index(value = ["title"]),
        Index(value = ["author_id"]),
        Index(value = ["created_at"]),
        Index(value = ["author_id", "is_published"]) // 复合索引
    ]
)
data class Article(...)
```

### 分页查询

使用 Paging 3 库进行高效分页：

```kotlin
@Dao
interface ArticleDao {
    @Query("SELECT * FROM articles ORDER BY created_at DESC")
    fun pagingSource(): PagingSource<Int, Article>
}

// 在 ViewModel 中
val articlePager = Pager(
    config = PagingConfig(
        pageSize = 20,
        enablePlaceholders = false
    ),
    pagingSourceFactory = { articleDao.pagingSource() }
).flow.cachedIn(viewModelScope)
```

### 避免 N+1 查询

```kotlin
// 不好：N+1 问题
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks> {
    val authors = authorDao.getAll()
    return authors.map { author ->
        val books = bookDao.getByAuthor(author.id) // 每个作者都查询一次
        AuthorWithBooks(author, books)
    }
}

// 好：使用 @Relation 一次查询
@Transaction
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>
```

### 只查询需要的字段

```kotlin
// 只需要标题和ID时
data class ArticleSummary(
    val id: Long,
    val title: String
)

@Query("SELECT id, title FROM articles")
suspend fun getArticleSummaries(): List<ArticleSummary>
```

### 使用 EXPLAIN QUERY PLAN 分析

```kotlin
@Query("EXPLAIN QUERY PLAN SELECT * FROM articles WHERE author_id = :authorId")
suspend fun explainQuery(authorId: Long): List<String>
```

## 实战场景

### 离线优先应用

```kotlin
class ArticleRepository(
    private val articleDao: ArticleDao,
    private val apiService: ApiService,
    private val networkMonitor: NetworkMonitor
) {
    val articles: Flow<List<Article>> = articleDao.getAllFlow()

    private val _syncStatus = MutableStateFlow<SyncStatus>(SyncStatus.Idle)
    val syncStatus: StateFlow<SyncStatus> = _syncStatus.asStateFlow()

    suspend fun sync() {
        if (!networkMonitor.isOnline()) {
            _syncStatus.value = SyncStatus.Offline
            return
        }

        _syncStatus.value = SyncStatus.Syncing

        try {
            // 上传本地更改
            val pendingChanges = articleDao.getPendingSync()
            pendingChanges.forEach { article ->
                apiService.saveArticle(article.toDto())
                articleDao.markSynced(article.id)
            }

            // 下载远程更改
            val lastSyncTime = getLastSyncTime()
            val remoteChanges = apiService.getChangesSince(lastSyncTime)
            articleDao.insertAll(remoteChanges.map { it.toEntity() })

            saveLastSyncTime(System.currentTimeMillis())
            _syncStatus.value = SyncStatus.Success

        } catch (e: Exception) {
            _syncStatus.value = SyncStatus.Error(e.message ?: "同步失败")
        }
    }
}

sealed class SyncStatus {
    object Idle : SyncStatus()
    object Syncing : SyncStatus()
    object Offline : SyncStatus()
    object Success : SyncStatus()
    data class Error(val message: String) : SyncStatus()
}
```

### 缓存策略

```kotlin
class CachedArticleRepository(
    private val articleDao: ArticleDao,
    private val apiService: ApiService
) {
    private val cacheTimeout = 5 * 60 * 1000L // 5分钟

    fun getArticles(forceRefresh: Boolean = false): Flow<Resource<List<Article>>> = flow {
        emit(Resource.Loading)

        // 首先发送缓存数据
        val cachedData = articleDao.getAll()
        if (cachedData.isNotEmpty()) {
            emit(Resource.Success(cachedData))
        }

        // 检查是否需要刷新
        val lastFetchTime = getLastFetchTime()
        val shouldFetch = forceRefresh ||
            cachedData.isEmpty() ||
            System.currentTimeMillis() - lastFetchTime > cacheTimeout

        if (shouldFetch) {
            try {
                val remoteData = apiService.getArticles()
                articleDao.replaceAll(remoteData.map { it.toEntity() })
                saveLastFetchTime(System.currentTimeMillis())
                emit(Resource.Success(articleDao.getAll()))
            } catch (e: Exception) {
                if (cachedData.isEmpty()) {
                    emit(Resource.Error(e.message ?: "加载失败"))
                }
                // 如果有缓存，已经发送过了，不需要再次发送错误
            }
        }
    }
}

sealed class Resource<out T> {
    object Loading : Resource<Nothing>()
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val message: String) : Resource<Nothing>()
}
```

## 面试要点

### 高频面试题

**1. Room 相比原生 SQLite 有什么优势？**

- 编译时 SQL 验证，避免运行时错误
- 减少样板代码，通过注解自动生成代码
- 与 LiveData、Flow 等架构组件无缝集成
- 类型安全的查询
- 更简单的数据库迁移

**2. @Entity、@Dao、@Database 分别是什么？**

- `@Entity`：定义数据库表结构的数据类
- `@Dao`：定义数据库访问方法的接口
- `@Database`：抽象类，持有数据库实例并提供 DAO 访问入口

**3. 如何处理复杂类型（如 List、Date）？**

使用 `@TypeConverter` 注解定义类型转换器，将复杂类型转换为 Room 支持的基本类型。

**4. Room 如何保证线程安全？**

- 默认禁止在主线程进行数据库操作
- 提供挂起函数支持协程
- 支持 Flow、LiveData 等响应式返回类型
- 内部使用锁机制保证并发安全

**5. 如何进行数据库迁移？**

- 手动迁移：实现 `Migration` 类，编写 SQL 语句
- 自动迁移（Room 2.4+）：使用 `@AutoMigration` 注解
- 破坏性迁移：使用 `fallbackToDestructiveMigration()`（仅开发环境）

**6. @Transaction 注解有什么作用？**

- 确保多个数据库操作在同一事务中执行
- 关系查询（@Relation）必须使用
- 保证数据一致性

**7. Room 支持哪些返回类型？**

- 普通类型（需要挂起函数或允许主线程查询）
- `Flow<T>`：响应式数据流
- `LiveData<T>`：生命周期感知
- `PagingSource<Key, Value>`：分页
- RxJava 类型（需要额外依赖）

**8. 如何优化 Room 查询性能？**

- 使用索引加速查询
- 只查询需要的列
- 使用分页避免加载大量数据
- 避免 N+1 查询问题
- 合理使用事务

## 延伸阅读

### 官方资源

- [Room 官方文档](https://developer.android.com/training/data-storage/room)
- [Room 代码实验室](https://developer.android.com/codelabs/android-room-with-a-view-kotlin)
- [Android 架构组件指南](https://developer.android.com/topic/architecture)

### 推荐实践

- **Now in Android**：Google 官方示例应用，展示了 Room 的最佳实践
- **Architecture Samples**：官方架构示例仓库

### 相关主题

- **Kotlin Coroutines**：协程与 Room 的配合使用
- **Kotlin Flow**：响应式数据流
- **Paging 3**：分页加载库
- **Hilt**：依赖注入
- **DataStore**：键值对存储（替代 SharedPreferences）

### 进阶主题

- Room 与 WorkManager 配合实现后台同步
- 多进程数据库访问
- 加密数据库（SQLCipher）
- 数据库调试工具（Database Inspector）

## 总结

Room 是 Android 开发中不可或缺的持久化工具，它提供了：

1. **简洁的 API**：通过 `@Entity`、`@Dao`、`@Database` 三个核心注解即可完成数据库操作
2. **编译时安全**：SQL 语句在编译时验证，减少运行时错误
3. **响应式支持**：与 Flow、LiveData 深度集成，实现数据变化自动更新 UI
4. **关系映射**：支持一对一、一对多、多对多关系
5. **数据库迁移**：提供手动和自动迁移方案

掌握 Room 的使用方法和最佳实践，可以让你的 Android 应用具有可靠、高效的本地数据存储能力。结合协程和 Flow，Room 让复杂的数据库操作变得简单直观，是现代 Android 开发的必备技能。
