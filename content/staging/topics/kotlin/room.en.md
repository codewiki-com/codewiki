---
title: Android Room Database
description: "Complete guide to Android Room persistence library: Entity, Dao, Database annotations, relationship mapping, and Flow integration"
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Room
  - Android
  - Database
  - SQLite
  - Jetpack
status: imported
origin: old/src/content/docs/kotlin/room.en.md
divergence: 0.225
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: kotlin
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

Room is a persistence library provided by Android Jetpack that offers an abstraction layer over SQLite, making database operations in Android applications simpler, type-safe, and more efficient. We'll cover Room's core concepts, usage patterns, and best practices comprehensively.

## Concept Explanation

### What is Room

Room is Google's officially recommended local database solution for Android and is a critical component of the Android Jetpack architecture. Room provides:

1. **Compile-time verification**: SQL queries are verified at compile-time, preventing runtime errors
2. **Reduced boilerplate code**: Automatic code generation through annotations
3. **Seamless integration with Jetpack components**: Support for LiveData, Flow, and RxJava
4. **Type safety**: Automatic mapping of database rows to Kotlin/Java objects

### Problems Room Solves

Before Room, Android developers typically used native SQLite APIs or third-party ORM libraries. Native SQLite had several issues:

- **Excessive boilerplate code**: Manual SQL writing and cursor handling required
- **No compile-time checking**: SQL errors only discovered at runtime
- **Error-prone**: Manual database connection and transaction handling
- **Difficult integration with architecture components**

Room addresses these issues through annotation processors and code generation, making database operations simple and safe.

### Three Core Components of Room

1. **Entity (Entity)**: Represents a table in the database
2. **DAO (Data Access Object)**: Contains methods for database access
3. **Database**: Holds the database and serves as the primary access point for application persistence data

## Core Principles

### Architecture Overview

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

### Annotation Processor Workflow

Room uses Kotlin Symbol Processing (KSP) or KAPT to process annotations at compile-time:

1. Scan all classes with Room annotations
2. Validate SQL statement correctness
3. Generate implementation classes (e.g., `UserDao_Impl`)
4. Generate database implementation classes

### Threading Model

Room by default prevents database operations on the main thread, as database operations can be time-consuming. Room provides multiple asynchronous access methods:

- **Suspend functions**: Using Kotlin coroutines
- **Flow**: Reactive data streams
- **LiveData**: Lifecycle-aware observable data
- **RxJava**: Reactive programming support

## Core Points

### Adding Dependencies

```kotlin
// build.gradle.kts (Module)
plugins {
    id("com.google.devtools.ksp") version "1.9.22-1.0.17"
}

dependencies {
    val roomVersion = "2.6.1"

    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion") // Kotlin extensions and coroutine support
    ksp("androidx.room:room-compiler:$roomVersion")

    // Optional: RxJava2 support
    implementation("androidx.room:room-rxjava2:$roomVersion")

    // Optional: RxJava3 support
    implementation("androidx.room:room-rxjava3:$roomVersion")

    // Optional: Guava support
    implementation("androidx.room:room-guava:$roomVersion")

    // Testing
    testImplementation("androidx.room:room-testing:$roomVersion")
}
```

### Entity Definition

Entity classes represent tables in the database:

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

### DAO (Data Access Object)

DAO defines methods for database access:

```kotlin
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    // Insert operations
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: User): Long

    @Insert
    suspend fun insertAll(users: List<User>): List<Long>

    // Update operations
    @Update
    suspend fun update(user: User): Int

    // Delete operations
    @Delete
    suspend fun delete(user: User): Int

    @Query("DELETE FROM users WHERE id = :userId")
    suspend fun deleteById(userId: Long): Int

    @Query("DELETE FROM users")
    suspend fun deleteAll()

    // Query operations
    @Query("SELECT * FROM users")
    suspend fun getAll(): List<User>

    @Query("SELECT * FROM users WHERE id = :userId")
    suspend fun getById(userId: Long): User?

    @Query("SELECT * FROM users WHERE first_name LIKE :name OR last_name LIKE :name")
    suspend fun findByName(name: String): List<User>

    // Flow queries (reactive)
    @Query("SELECT * FROM users ORDER BY first_name ASC")
    fun getAllFlow(): Flow<List<User>>

    @Query("SELECT * FROM users WHERE id = :userId")
    fun getByIdFlow(userId: Long): Flow<User?>

    // Complex queries with parameters
    @Query("""
        SELECT * FROM users
        WHERE created_at BETWEEN :startTime AND :endTime
        ORDER BY created_at DESC
    """)
    suspend fun getUsersInTimeRange(startTime: Long, endTime: Long): List<User>
}
```

### Database

The Database class is the main entry point for application access to persistent data:

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
                .fallbackToDestructiveMigration() // For development only
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
```

## Code Examples

### Complete CRUD Example

#### Defining Entity

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

#### Defining DAO

```kotlin
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ArticleDao {
    // Insert
    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(article: Article): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(article: Article): Long

    @Insert
    suspend fun insertAll(articles: List<Article>): List<Long>

    // Update
    @Update
    suspend fun update(article: Article): Int

    @Query("UPDATE articles SET is_published = :published, updated_at = :updatedAt WHERE id = :articleId")
    suspend fun updatePublishStatus(articleId: Long, published: Boolean, updatedAt: Long = System.currentTimeMillis()): Int

    // Delete
    @Delete
    suspend fun delete(article: Article): Int

    @Query("DELETE FROM articles WHERE id = :articleId")
    suspend fun deleteById(articleId: Long): Int

    @Query("DELETE FROM articles WHERE author_id = :authorId")
    suspend fun deleteByAuthor(authorId: Long): Int

    // Query - returning suspend functions
    @Query("SELECT * FROM articles WHERE id = :articleId")
    suspend fun getById(articleId: Long): Article?

    @Query("SELECT * FROM articles WHERE author_id = :authorId ORDER BY created_at DESC")
    suspend fun getByAuthor(authorId: Long): List<Article>

    @Query("SELECT * FROM articles WHERE is_published = 1 ORDER BY created_at DESC")
    suspend fun getPublished(): List<Article>

    @Query("SELECT * FROM articles WHERE title LIKE '%' || :keyword || '%' OR content LIKE '%' || :keyword || '%'")
    suspend fun search(keyword: String): List<Article>

    // Query - returning Flow (reactive)
    @Query("SELECT * FROM articles ORDER BY updated_at DESC")
    fun getAllFlow(): Flow<List<Article>>

    @Query("SELECT * FROM articles WHERE id = :articleId")
    fun getByIdFlow(articleId: Long): Flow<Article?>

    @Query("SELECT COUNT(*) FROM articles WHERE author_id = :authorId")
    fun getCountByAuthorFlow(authorId: Long): Flow<Int>

    // Pagination query
    @Query("SELECT * FROM articles ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    suspend fun getPage(limit: Int, offset: Int): List<Article>

    // Transaction operations
    @Transaction
    suspend fun replaceAll(articles: List<Article>) {
        deleteAll()
        insertAll(articles)
    }

    @Query("DELETE FROM articles")
    suspend fun deleteAll()
}
```

### Type Converters

Room only supports primitive types and their wrapper classes. For other types, use TypeConverter:

```kotlin
import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.Date

class Converters {
    private val gson = Gson()

    // Date conversion
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }

    // List<String> conversion
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

    // Enum conversion
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

### Embedded Objects

Use the `@Embedded` annotation to directly embed object fields into a table:

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

The generated table structure will contain: `id`, `name`, `phone`, `home_street`, `home_city`, `home_province`, `home_postal_code`, `work_street`, `work_city`, `work_province`, `work_postal_code`

### Relationship Mapping

#### One-to-Many Relationship

```kotlin
// Author entity
@Entity(tableName = "authors")
data class Author(
    @PrimaryKey(autoGenerate = true)
    val authorId: Long = 0,
    val name: String,
    val bio: String
)

// Book entity
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

// One-to-many relationship data class
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

#### Many-to-Many Relationship

```kotlin
// Playlist entity
@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey(autoGenerate = true)
    val playlistId: Long = 0,
    val name: String,
    val description: String
)

// Song entity
@Entity(tableName = "songs")
data class Song(
    @PrimaryKey(autoGenerate = true)
    val songId: Long = 0,
    val title: String,
    val artist: String,
    val duration: Int // seconds
)

// Cross-reference table
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

// Playlist with its songs
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

// Song with its playlists
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

    // Add song to playlist
    @Transaction
    suspend fun addSongToPlaylist(playlistId: Long, songId: Long) {
        insertCrossRef(PlaylistSongCrossRef(playlistId, songId))
    }

    // Remove song from playlist
    @Query("DELETE FROM playlist_song_cross_ref WHERE playlistId = :playlistId AND songId = :songId")
    suspend fun removeSongFromPlaylist(playlistId: Long, songId: Long)
}
```

### Database Migrations

When database structure changes, migrations are required:

```kotlin
// Version 1 -> 2: Add new column
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT ''")
    }
}

// Version 2 -> 3: Add new table
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

// Version 3 -> 4: Change column type (requires table rebuild)
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // Create temporary table
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

        // Copy data
        database.execSQL("""
            INSERT INTO users_new (id, first_name, last_name, email, avatar_url)
            SELECT id, first_name, last_name, email, avatar_url FROM users
        """)

        // Drop old table
        database.execSQL("DROP TABLE users")

        // Rename new table
        database.execSQL("ALTER TABLE users_new RENAME TO users")
    }
}

// Apply migrations
val database = Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
    .build()
```

### Auto Migration (Room 2.4+)

Room 2.4 and above support auto migrations:

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

### Flow Integration

Deep integration between Room and Kotlin Flow makes reactive programming straightforward:

```kotlin
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope

class ArticleViewModel(
    private val articleDao: ArticleDao
) : ViewModel() {

    // All articles list (reactive)
    val articles: StateFlow<List<Article>> = articleDao.getAllFlow()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // Search functionality
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val searchResults: Flow<List<Article>> = _searchQuery
        .debounce(300) // Debounce
        .filter { it.isNotBlank() }
        .flatMapLatest { query ->
            flow { emit(articleDao.search(query)) }
        }

    // Single article details
    fun getArticleById(id: Long): Flow<Article?> {
        return articleDao.getByIdFlow(id)
    }

    // Article statistics
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

### Using with Compose

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
        // Search bar
        TextField(
            value = searchQuery,
            onValueChange = { viewModel.updateSearchQuery(it) },
            placeholder = { Text("Search articles...") },
            modifier = Modifier.fillMaxWidth()
        )

        // Article list
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
                text = "Status: ${if (it.isPublished) "Published" else "Draft"}",
                style = MaterialTheme.typography.bodySmall
            )
        }
    } ?: run {
        CircularProgressIndicator()
    }
}
```

## Best Practices

### Use Repository Pattern

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

### Use Dependency Injection (Hilt)

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

### Transaction Operations

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

        // Update stock
        items.forEach { item ->
            decreaseStock(item.productId, item.quantity)
        }
    }
}
```

### Pre-populate Database

```kotlin
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .createFromAsset("database/prepopulated.db") // Pre-populate from assets
    // Or
    .createFromFile(File("path/to/prepopulated.db")) // Pre-populate from file
    .build()

// Use callback to populate initial data
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addCallback(object : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            // Populate initial data
            CoroutineScope(Dispatchers.IO).launch {
                database.categoryDao().insertAll(getDefaultCategories())
            }
        }
    })
    .build()
```

### Export Schema

Configure in `build.gradle.kts`:

```kotlin
ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}
```

This exports schema JSON files for each version, useful for:
- Validating migration correctness
- Writing migration tests
- Documentation reference

## Common Pitfalls

### Database Operations on Main Thread

```kotlin
// Wrong: Throws IllegalStateException
fun getUser(id: Long): User {
    return userDao.getById(id) // Cannot call on main thread
}

// Correct: Use coroutines
suspend fun getUser(id: Long): User? {
    return userDao.getById(id)
}

// Correct: Use Flow
fun getUserFlow(id: Long): Flow<User?> {
    return userDao.getByIdFlow(id)
}
```

### Forgetting @Transaction

```kotlin
// Wrong: Relationship queries without @Transaction may cause data inconsistency
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>

// Correct: Use @Transaction
@Transaction
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>
```

### Incorrect LiveData/Flow Usage

```kotlin
// Wrong: Creates new Flow on each call
fun getArticles(): Flow<List<Article>> {
    return articleDao.getAllFlow()
}

// Correct: Cache Flow in property
val articles: Flow<List<Article>> = articleDao.getAllFlow()
```

### Ignoring Foreign Key Constraints

```kotlin
// If onDelete is not set, deleting Author will fail
@Entity(
    foreignKeys = [
        ForeignKey(
            entity = Author::class,
            parentColumns = ["id"],
            childColumns = ["author_id"],
            onDelete = ForeignKey.CASCADE // Or SET_NULL, NO_ACTION
        )
    ]
)
data class Book(...)
```

### Complex Objects Without TypeConverter

```kotlin
// Wrong: Room doesn't know how to store List<Tag>
@Entity
data class Article(
    val id: Long,
    val tags: List<Tag> // Compile error
)

// Correct: Use TypeConverter
@TypeConverter
fun fromTagList(tags: List<Tag>): String = gson.toJson(tags)

@TypeConverter
fun toTagList(json: String): List<Tag> = gson.fromJson(json, ...)
```

## Performance Considerations

### Use Indexes

```kotlin
@Entity(
    tableName = "articles",
    indices = [
        Index(value = ["title"]),
        Index(value = ["author_id"]),
        Index(value = ["created_at"]),
        Index(value = ["author_id", "is_published"]) // Composite index
    ]
)
data class Article(...)
```

### Pagination Query

Use Paging 3 library for efficient pagination:

```kotlin
@Dao
interface ArticleDao {
    @Query("SELECT * FROM articles ORDER BY created_at DESC")
    fun pagingSource(): PagingSource<Int, Article>
}

// In ViewModel
val articlePager = Pager(
    config = PagingConfig(
        pageSize = 20,
        enablePlaceholders = false
    ),
    pagingSourceFactory = { articleDao.pagingSource() }
).flow.cachedIn(viewModelScope)
```

### Avoid N+1 Queries

```kotlin
// Bad: N+1 problem
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks> {
    val authors = authorDao.getAll()
    return authors.map { author ->
        val books = bookDao.getByAuthor(author.id) // Query for each author
        AuthorWithBooks(author, books)
    }
}

// Good: Use @Relation for single query
@Transaction
@Query("SELECT * FROM authors")
suspend fun getAuthorsWithBooks(): List<AuthorWithBooks>
```

### Query Only Needed Fields

```kotlin
// When only title and ID are needed
data class ArticleSummary(
    val id: Long,
    val title: String
)

@Query("SELECT id, title FROM articles")
suspend fun getArticleSummaries(): List<ArticleSummary>
```

### Use EXPLAIN QUERY PLAN for Analysis

```kotlin
@Query("EXPLAIN QUERY PLAN SELECT * FROM articles WHERE author_id = :authorId")
suspend fun explainQuery(authorId: Long): List<String>
```

## Real-World Scenarios

### Offline-First Application

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
            // Upload local changes
            val pendingChanges = articleDao.getPendingSync()
            pendingChanges.forEach { article ->
                apiService.saveArticle(article.toDto())
                articleDao.markSynced(article.id)
            }

            // Download remote changes
            val lastSyncTime = getLastSyncTime()
            val remoteChanges = apiService.getChangesSince(lastSyncTime)
            articleDao.insertAll(remoteChanges.map { it.toEntity() })

            saveLastSyncTime(System.currentTimeMillis())
            _syncStatus.value = SyncStatus.Success

        } catch (e: Exception) {
            _syncStatus.value = SyncStatus.Error(e.message ?: "Sync failed")
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

### Caching Strategy

```kotlin
class CachedArticleRepository(
    private val articleDao: ArticleDao,
    private val apiService: ApiService
) {
    private val cacheTimeout = 5 * 60 * 1000L // 5 minutes

    fun getArticles(forceRefresh: Boolean = false): Flow<Resource<List<Article>>> = flow {
        emit(Resource.Loading)

        // First emit cached data
        val cachedData = articleDao.getAll()
        if (cachedData.isNotEmpty()) {
            emit(Resource.Success(cachedData))
        }

        // Check if refresh is needed
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
                    emit(Resource.Error(e.message ?: "Failed to load"))
                }
                // If cache exists, already emitted, no need to emit error
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

## Interview Key Points

### Frequently Asked Interview Questions

**1. What are Room's advantages over native SQLite?**

- Compile-time SQL verification, preventing runtime errors
- Reduced boilerplate code through annotation-based generation
- Seamless integration with LiveData, Flow, and other architecture components
- Type-safe queries
- Simplified database migration

**2. What are @Entity, @Dao, and @Database?**

- `@Entity`: Data class that defines database table structure
- `@Dao`: Interface that defines database access methods
- `@Database`: Abstract class that holds database instance and provides DAO access points

**3. How to handle complex types (List, Date)?**

Use `@TypeConverter` annotation to define converters that transform complex types into Room-supported basic types.

**4. How does Room ensure thread safety?**

- Prohibits database operations on main thread by default
- Provides suspend function support for coroutines
- Supports Flow, LiveData, and other reactive return types
- Uses internal locking mechanisms for concurrent safety

**5. How to perform database migrations?**

- Manual migration: Implement `Migration` class and write SQL statements
- Auto migration (Room 2.4+): Use `@AutoMigration` annotation
- Destructive migration: Use `fallbackToDestructiveMigration()` (development only)

**6. What does @Transaction annotation do?**

- Ensures multiple database operations execute within same transaction
- Required for relationship queries (@Relation)
- Guarantees data consistency

**7. What return types does Room support?**

- Plain types (requires suspend function or main thread allowed)
- `Flow<T>`: Reactive data stream
- `LiveData<T>`: Lifecycle-aware
- `PagingSource<Key, Value>`: Pagination
- RxJava types (requires additional dependency)

**8. How to optimize Room query performance?**

- Use indexes to accelerate queries
- Query only needed columns
- Use pagination to avoid loading large datasets
- Avoid N+1 query problem
- Use transactions appropriately

## Further Reading

### Official Resources

- [Room Official Documentation](https://developer.android.com/training/data-storage/room)
- [Room Codelab](https://developer.android.com/codelabs/android-room-with-a-view-kotlin)
- [Android Architecture Components Guide](https://developer.android.com/topic/architecture)

### Recommended Practices

- **Now in Android**: Google's official sample app demonstrating Room best practices
- **Architecture Samples**: Official architecture samples repository

### Related Topics

- **Kotlin Coroutines**: Coroutines combined with Room
- **Kotlin Flow**: Reactive data streams
- **Paging 3**: Pagination library
- **Hilt**: Dependency injection
- **DataStore**: Key-value storage (replacement for SharedPreferences)

### Advanced Topics

- Room with WorkManager for background synchronization
- Multi-process database access
- Encrypted databases (SQLCipher)
- Database debugging tools (Database Inspector)

## Summary

Room is an essential persistence tool in Android development, providing:

1. **Clean API**: Complete database operations through three core annotations: `@Entity`, `@Dao`, `@Database`
2. **Compile-time safety**: SQL statements verified at compile-time, reducing runtime errors
3. **Reactive support**: Deep integration with Flow and LiveData for automatic UI updates on data changes
4. **Relationship mapping**: Support for one-to-one, one-to-many, and many-to-many relationships
5. **Database migration**: Both manual and automatic migration solutions

Mastering Room's usage patterns and best practices enables your Android applications to have reliable and efficient local data storage capabilities. Combined with coroutines and Flow, Room simplifies complex database operations and makes it intuitive. It's an essential skill for modern Android development.
