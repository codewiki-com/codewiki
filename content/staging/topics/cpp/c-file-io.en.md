---
title: C 语言文件 I/O
description: 掌握 C 文件操作：FILE 指针、fopen/fclose、fread/fwrite、格式化 I/O 与二进制文件处理
track: cpp
section: basics
difficulty: intermediate
tags:
  - C
  - 文件操作
  - FILE
  - fopen
  - fread
  - 二进制文件
status: imported
origin: old/src/content/docs/cpp/c-file-io.en.md
divergence: 0.192
issues:
  - title-lang-en
  - title-language
legacy:
  category: Cpp
  subcategory: C 语言
  order: 3
  lastUpdated: 2026-01-07
---

File I/O is one of the core skills in C programming. Whether reading configuration files, processing logs, storing data, or interacting with external systems, file operations are essential. We'll cover the file input/output mechanisms in C comprehensively.

## Concept Explanation

### What is File I/O

File I/O (Input/Output) refers to the process of data transfer between a program and the file system. The C language provides a complete set of file operation APIs through the standard library `<stdio.h>`.

**Historical Background of C File Operations:**

- 1972: C language was born at Bell Labs
- 1978: K&R C defined the basic file operation functions
- 1989: ANSI C (C89) standardized the `<stdio.h>` library
- 1999: C99 added more security-related functions

### File Classification

In C, files are divided into two major categories:

1. **Text File**
   - Stores data in character form
   - Can be viewed directly with a text editor
   - Each line ends with a newline character
   - Examples: `.txt`, `.c`, `.csv`, `.json`

2. **Binary File**
   - Stores data in raw byte form
   - Writes memory contents directly without conversion
   - More compact, faster to read and write
   - Examples: `.bin`, `.exe`, `.png`, `.dat`

### Basic Steps of File Operations

```
Open file -> Read/Write operations -> Close file
 (fopen)    (fread/fwrite, etc.)    (fclose)
```

## Core Principles

### FILE Pointer and File Stream

C uses the `FILE` structure to represent a file stream. `FILE` is an opaque type that contains all the information needed for file operations:

```c
// Conceptual illustration of FILE structure (actual implementation varies by platform)
typedef struct _FILE {
    char *_ptr;           // Current buffer position
    int _cnt;             // Remaining characters in buffer
    char *_base;          // Buffer base address
    int _flag;            // File status flags
    int _file;            // File descriptor
    int _charbuf;         // Single character buffer
    int _bufsiz;          // Buffer size
    char *_tmpfname;      // Temporary filename
} FILE;
```

**Purpose of File Pointer:**
- Identifies a specific disk file
- Tracks the current read/write position
- Manages the buffer
- Records file status and error information

### Standard File Streams

Three standard file streams are automatically opened when a C program starts:

```c
#include <stdio.h>

// Standard input (keyboard)
extern FILE *stdin;

// Standard output (screen)
extern FILE *stdout;

// Standard error output (screen)
extern FILE *stderr;
```

### Buffering Mechanism

C file I/O uses buffers to boost productivity:

```
+----------+     +---------+     +----------+
| Program  | <-> | Buffer  | <-> |  Disk    |
| (Memory) |     | (Memory)|     | (Storage)|
+----------+     +---------+     +----------+
```

**Three Buffering Modes:**

1. **Full Buffering**
   - Actual I/O occurs only when the buffer is full
   - Used for regular disk files

2. **Line Buffering**
   - Buffer is flushed when a newline character is encountered
   - Used for interactive terminals (such as `stdout`)

3. **Unbuffered**
   - Each I/O operation executes immediately
   - Used for `stderr` to ensure error messages are displayed immediately

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("test.txt", "w");

    // Set full buffering with 1024 byte buffer
    char buffer[1024];
    setvbuf(fp, buffer, _IOFBF, sizeof(buffer));

    // Set line buffering
    // setvbuf(fp, buffer, _IOLBF, sizeof(buffer));

    // Set unbuffered
    // setvbuf(fp, NULL, _IONBF, 0);

    fputs("Hello, World!", fp);

    // Manually flush the buffer
    fflush(fp);

    fclose(fp);
    return 0;
}
```

## Key Points

### fopen() - Opening Files

```c
FILE *fopen(const char *filename, const char *mode);
```

**Detailed Mode Explanation:**

| Mode | Description | If file doesn't exist | If file exists |
|------|------|------------|----------|
| `"r"` | Read-only text | Returns NULL | Read from beginning |
| `"w"` | Write-only text | Create new file | Truncate contents |
| `"a"` | Append text | Create new file | Append to end |
| `"r+"` | Read/write text | Returns NULL | Read/write from beginning |
| `"w+"` | Read/write text | Create new file | Truncate contents |
| `"a+"` | Read/append | Create new file | Read anywhere, write at end |
| `"rb"` | Read-only binary | Returns NULL | Read from beginning |
| `"wb"` | Write-only binary | Create new file | Truncate contents |
| `"ab"` | Append binary | Create new file | Append to end |
| `"rb+"` | Read/write binary | Returns NULL | Read/write from beginning |
| `"wb+"` | Read/write binary | Create new file | Truncate contents |
| `"ab+"` | Read/append binary | Create new file | Read anywhere, write at end |

**Basic Usage:**

```c
#include <stdio.h>

int main() {
    FILE *fp;

    // Open file for reading
    fp = fopen("input.txt", "r");
    if (fp == NULL) {
        perror("Failed to open file");
        return 1;
    }

    // Use the file...

    fclose(fp);
    return 0;
}
```

### fclose() - Closing Files

```c
int fclose(FILE *stream);
```

`fclose()` performs the following operations:
1. Flushes the buffer (writes unwritten data)
2. Releases buffer memory
3. Closes the file descriptor
4. Releases the FILE structure

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("test.txt", "w");
    if (fp == NULL) {
        perror("Failed to open");
        return 1;
    }

    fputs("Hello, World!\n", fp);

    // Close file and check return value
    if (fclose(fp) != 0) {
        perror("Failed to close file");
        return 1;
    }

    // Don't use fp after closing
    fp = NULL;

    return 0;
}
```

### Character-Level I/O

**fgetc() / getc() - Read a single character:**

```c
int fgetc(FILE *stream);
int getc(FILE *stream);  // May be implemented as a macro, more efficient
```

**fputc() / putc() - Write a single character:**

```c
int fputc(int c, FILE *stream);
int putc(int c, FILE *stream);
```

```c
#include <stdio.h>

int main() {
    FILE *input = fopen("input.txt", "r");
    FILE *output = fopen("output.txt", "w");

    if (input == NULL || output == NULL) {
        perror("Failed to open file");
        return 1;
    }

    int ch;
    // fgetc returns int to distinguish EOF from valid characters
    while ((ch = fgetc(input)) != EOF) {
        // Convert character to uppercase and write
        if (ch >= 'a' && ch <= 'z') {
            ch = ch - 'a' + 'A';
        }
        fputc(ch, output);
    }

    fclose(input);
    fclose(output);

    return 0;
}
```

### Line-Level I/O

**fgets() - Read a line:**

```c
char *fgets(char *str, int n, FILE *stream);
```

- Reads at most `n-1` characters
- Stops at newline or EOF
- Retains the newline character (if read)
- Automatically adds null terminator

**fputs() - Write a string:**

```c
int fputs(const char *str, FILE *stream);
```

```c
#include <stdio.h>
#include <string.h>

#define MAX_LINE 256

int main() {
    FILE *fp = fopen("data.txt", "r");
    if (fp == NULL) {
        perror("Failed to open file");
        return 1;
    }

    char line[MAX_LINE];
    int line_num = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        line_num++;

        // Remove trailing newline
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }

        printf("Line %d: %s\n", line_num, line);
    }

    fclose(fp);
    return 0;
}
```

### Formatted I/O

**fprintf() - Formatted write:**

```c
int fprintf(FILE *stream, const char *format, ...);
```

**fscanf() - Formatted read:**

```c
int fscanf(FILE *stream, const char *format, ...);
```

```c
#include <stdio.h>

typedef struct {
    char name[50];
    int age;
    float salary;
} Employee;

// Write employee data
void write_employees(const char *filename, Employee *emps, int count) {
    FILE *fp = fopen(filename, "w");
    if (fp == NULL) {
        perror("Failed to open file");
        return;
    }

    // Write record count
    fprintf(fp, "%d\n", count);

    // Write each record
    for (int i = 0; i < count; i++) {
        fprintf(fp, "%s %d %.2f\n",
                emps[i].name, emps[i].age, emps[i].salary);
    }

    fclose(fp);
}

// Read employee data
int read_employees(const char *filename, Employee *emps, int max_count) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("Failed to open file");
        return -1;
    }

    int count;
    fscanf(fp, "%d", &count);

    if (count > max_count) {
        count = max_count;
    }

    for (int i = 0; i < count; i++) {
        fscanf(fp, "%49s %d %f",
               emps[i].name, &emps[i].age, &emps[i].salary);
    }

    fclose(fp);
    return count;
}

int main() {
    Employee employees[] = {
        {"Alice", 30, 75000.50},
        {"Bob", 25, 55000.00},
        {"Charlie", 35, 90000.75}
    };

    write_employees("employees.txt", employees, 3);

    Employee loaded[10];
    int count = read_employees("employees.txt", loaded, 10);

    printf("Read %d records:\n", count);
    for (int i = 0; i < count; i++) {
        printf("  %s, age %d, salary: %.2f\n",
               loaded[i].name, loaded[i].age, loaded[i].salary);
    }

    return 0;
}
```

### Block-Level I/O - fread() and fwrite()

**fread() - Read data blocks:**

```c
size_t fread(void *ptr, size_t size, size_t count, FILE *stream);
```

**fwrite() - Write data blocks:**

```c
size_t fwrite(const void *ptr, size_t size, size_t count, FILE *stream);
```

Parameter explanation:
- `ptr`: Data buffer pointer
- `size`: Size of each element (bytes)
- `count`: Number of elements
- `stream`: File pointer
- Return value: Number of elements successfully read/written

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char name[32];
    double score;
} Student;

// Write student records (binary)
int write_students_binary(const char *filename, Student *students, int count) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("Failed to open file");
        return -1;
    }

    // Write record count first
    fwrite(&count, sizeof(int), 1, fp);

    // Write all student records
    size_t written = fwrite(students, sizeof(Student), count, fp);

    fclose(fp);
    return (written == count) ? 0 : -1;
}

// Read student records (binary)
Student* read_students_binary(const char *filename, int *count) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("Failed to open file");
        return NULL;
    }

    // Read record count
    fread(count, sizeof(int), 1, fp);

    // Allocate memory
    Student *students = (Student*)malloc(*count * sizeof(Student));
    if (students == NULL) {
        fclose(fp);
        return NULL;
    }

    // Read all records
    size_t read_count = fread(students, sizeof(Student), *count, fp);

    fclose(fp);

    if (read_count != *count) {
        free(students);
        return NULL;
    }

    return students;
}

int main() {
    // Create test data
    Student students[] = {
        {1, "Zhang San", 85.5},
        {2, "Li Si", 92.0},
        {3, "Wang Wu", 78.5}
    };

    // Write binary file
    if (write_students_binary("students.dat", students, 3) != 0) {
        printf("Write failed\n");
        return 1;
    }
    printf("Successfully wrote 3 records\n");

    // Read binary file
    int count;
    Student *loaded = read_students_binary("students.dat", &count);
    if (loaded == NULL) {
        printf("Read failed\n");
        return 1;
    }

    printf("Successfully read %d records:\n", count);
    for (int i = 0; i < count; i++) {
        printf("  ID: %d, Name: %s, Score: %.1f\n",
               loaded[i].id, loaded[i].name, loaded[i].score);
    }

    free(loaded);
    return 0;
}
```

### File Positioning

**fseek() - Set file position:**

```c
int fseek(FILE *stream, long offset, int whence);
```

`whence` parameter:
- `SEEK_SET`: Calculate offset from beginning of file
- `SEEK_CUR`: Calculate offset from current position
- `SEEK_END`: Calculate offset from end of file

**ftell() - Get current position:**

```c
long ftell(FILE *stream);
```

**rewind() - Return to beginning of file:**

```c
void rewind(FILE *stream);
```

**fgetpos() / fsetpos() - For large files:**

```c
int fgetpos(FILE *stream, fpos_t *pos);
int fsetpos(FILE *stream, const fpos_t *pos);
```

```c
#include <stdio.h>

// Get file size
long get_file_size(const char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }

    fseek(fp, 0, SEEK_END);   // Move to end of file
    long size = ftell(fp);     // Get position (i.e., file size)
    fclose(fp);

    return size;
}

// Read a specific part of a file
int read_file_range(const char *filename, long start, long length, char *buffer) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }

    // Move to starting position
    if (fseek(fp, start, SEEK_SET) != 0) {
        fclose(fp);
        return -1;
    }

    // Read specified length
    size_t read_count = fread(buffer, 1, length, fp);
    fclose(fp);

    return (int)read_count;
}

int main() {
    const char *filename = "test.txt";

    // Create test file
    FILE *fp = fopen(filename, "w");
    fputs("Hello, World! This is a test file.", fp);
    fclose(fp);

    // Get file size
    long size = get_file_size(filename);
    printf("File size: %ld bytes\n", size);

    // Read part of the file
    char buffer[20] = {0};
    int read = read_file_range(filename, 7, 5, buffer);
    printf("Read %d bytes from position 7: '%s'\n", read, buffer);

    return 0;
}
```

### Error Handling

**ferror() - Check for errors:**

```c
int ferror(FILE *stream);
```

**feof() - Check if end of file reached:**

```c
int feof(FILE *stream);
```

**clearerr() - Clear error flags:**

```c
void clearerr(FILE *stream);
```

**perror() - Print error message:**

```c
void perror(const char *str);
```

```c
#include <stdio.h>
#include <errno.h>
#include <string.h>

int main() {
    FILE *fp = fopen("nonexistent.txt", "r");

    if (fp == NULL) {
        // Method 1: Use perror
        perror("Failed to open file");

        // Method 2: Use errno and strerror
        printf("Error code: %d\n", errno);
        printf("Error message: %s\n", strerror(errno));

        return 1;
    }

    char buffer[100];
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("%s", buffer);
    }

    // Check if stopped due to error
    if (ferror(fp)) {
        printf("Error occurred while reading\n");
        clearerr(fp);  // Clear error flag
    }

    // Check if end of file reached
    if (feof(fp)) {
        printf("Reached end of file\n");
    }

    fclose(fp);
    return 0;
}
```

## Code Examples

### Example 1: File Copy Program

```c
#include <stdio.h>
#include <stdlib.h>

#define BUFFER_SIZE 4096

int copy_file(const char *src, const char *dest) {
    FILE *fin = fopen(src, "rb");
    if (fin == NULL) {
        perror("Cannot open source file");
        return -1;
    }

    FILE *fout = fopen(dest, "wb");
    if (fout == NULL) {
        perror("Cannot create destination file");
        fclose(fin);
        return -1;
    }

    char buffer[BUFFER_SIZE];
    size_t bytes_read;
    size_t total_bytes = 0;

    while ((bytes_read = fread(buffer, 1, BUFFER_SIZE, fin)) > 0) {
        size_t bytes_written = fwrite(buffer, 1, bytes_read, fout);
        if (bytes_written != bytes_read) {
            perror("Write error");
            fclose(fin);
            fclose(fout);
            return -1;
        }
        total_bytes += bytes_written;
    }

    if (ferror(fin)) {
        perror("Read error");
        fclose(fin);
        fclose(fout);
        return -1;
    }

    printf("Successfully copied %zu bytes\n", total_bytes);

    fclose(fin);
    fclose(fout);
    return 0;
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        printf("Usage: %s <source file> <destination file>\n", argv[0]);
        return 1;
    }

    return copy_file(argv[1], argv[2]);
}
```

### Example 2: CSV File Parser

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX_LINE 1024
#define MAX_FIELDS 20
#define MAX_FIELD_LEN 256

typedef struct {
    char fields[MAX_FIELDS][MAX_FIELD_LEN];
    int field_count;
} CSVRow;

// Parse a CSV line
int parse_csv_line(const char *line, CSVRow *row) {
    row->field_count = 0;

    const char *ptr = line;
    int field_idx = 0;
    int char_idx = 0;
    int in_quotes = 0;

    while (*ptr && field_idx < MAX_FIELDS) {
        if (*ptr == '"') {
            in_quotes = !in_quotes;
            ptr++;
            continue;
        }

        if ((*ptr == ',' && !in_quotes) || *ptr == '\n' || *ptr == '\r') {
            row->fields[field_idx][char_idx] = '\0';
            field_idx++;
            char_idx = 0;
            ptr++;
            continue;
        }

        if (char_idx < MAX_FIELD_LEN - 1) {
            row->fields[field_idx][char_idx++] = *ptr;
        }
        ptr++;
    }

    // Handle the last field
    if (char_idx > 0) {
        row->fields[field_idx][char_idx] = '\0';
        field_idx++;
    }

    row->field_count = field_idx;
    return field_idx;
}

// Read CSV file
void read_csv(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("Failed to open CSV file");
        return;
    }

    char line[MAX_LINE];
    CSVRow row;
    int line_num = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        line_num++;
        parse_csv_line(line, &row);

        printf("Line %d (%d fields): ", line_num, row.field_count);
        for (int i = 0; i < row.field_count; i++) {
            printf("[%s]", row.fields[i]);
            if (i < row.field_count - 1) {
                printf(", ");
            }
        }
        printf("\n");
    }

    fclose(fp);
}

int main() {
    // Create sample CSV file
    FILE *fp = fopen("data.csv", "w");
    fprintf(fp, "Name,Age,City\n");
    fprintf(fp, "Zhang San,25,Beijing\n");
    fprintf(fp, "Li Si,30,Shanghai\n");
    fprintf(fp, "\"Wang Wu, Jr.\",28,Guangzhou\n");  // Field containing comma
    fclose(fp);

    printf("Parsing CSV file:\n");
    read_csv("data.csv");

    return 0;
}
```

### Example 3: Binary Configuration File

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Configuration file magic number and version
#define CONFIG_MAGIC 0x434F4E46  // "CONF"
#define CONFIG_VERSION 1

// Configuration structure
typedef struct {
    unsigned int magic;
    unsigned int version;
    char app_name[64];
    int window_width;
    int window_height;
    float volume;
    int fullscreen;
    char language[16];
} AppConfig;

// Save configuration
int save_config(const char *filename, const AppConfig *config) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("Cannot create configuration file");
        return -1;
    }

    // Create a copy of config with magic number and version
    AppConfig save_config = *config;
    save_config.magic = CONFIG_MAGIC;
    save_config.version = CONFIG_VERSION;

    size_t written = fwrite(&save_config, sizeof(AppConfig), 1, fp);
    fclose(fp);

    return (written == 1) ? 0 : -1;
}

// Load configuration
int load_config(const char *filename, AppConfig *config) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("Cannot open configuration file");
        return -1;
    }

    size_t read_count = fread(config, sizeof(AppConfig), 1, fp);
    fclose(fp);

    if (read_count != 1) {
        printf("Failed to read configuration\n");
        return -1;
    }

    // Validate magic number
    if (config->magic != CONFIG_MAGIC) {
        printf("Invalid configuration file format\n");
        return -1;
    }

    // Check version
    if (config->version != CONFIG_VERSION) {
        printf("Incompatible configuration file version: %d (expected %d)\n",
               config->version, CONFIG_VERSION);
        return -1;
    }

    return 0;
}

// Print configuration
void print_config(const AppConfig *config) {
    printf("Application Configuration:\n");
    printf("  App name: %s\n", config->app_name);
    printf("  Window size: %d x %d\n", config->window_width, config->window_height);
    printf("  Volume: %.1f%%\n", config->volume * 100);
    printf("  Fullscreen: %s\n", config->fullscreen ? "Yes" : "No");
    printf("  Language: %s\n", config->language);
}

int main() {
    // Create default configuration
    AppConfig config = {0};
    strcpy(config.app_name, "MyApplication");
    config.window_width = 1920;
    config.window_height = 1080;
    config.volume = 0.8f;
    config.fullscreen = 0;
    strcpy(config.language, "en-US");

    // Save configuration
    if (save_config("app.conf", &config) == 0) {
        printf("Configuration saved\n");
    }

    // Load configuration
    AppConfig loaded_config;
    if (load_config("app.conf", &loaded_config) == 0) {
        printf("Configuration loaded\n");
        print_config(&loaded_config);
    }

    return 0;
}
```

### Example 4: Logging System

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdarg.h>

typedef enum {
    LOG_DEBUG,
    LOG_INFO,
    LOG_WARNING,
    LOG_ERROR
} LogLevel;

typedef struct {
    FILE *file;
    LogLevel min_level;
    int console_output;
} Logger;

static const char *level_names[] = {
    "DEBUG", "INFO", "WARNING", "ERROR"
};

// Create logger
Logger* logger_create(const char *filename, LogLevel min_level, int console) {
    Logger *logger = (Logger*)malloc(sizeof(Logger));
    if (logger == NULL) return NULL;

    logger->file = fopen(filename, "a");
    if (logger->file == NULL) {
        free(logger);
        return NULL;
    }

    logger->min_level = min_level;
    logger->console_output = console;

    return logger;
}

// Destroy logger
void logger_destroy(Logger *logger) {
    if (logger) {
        if (logger->file) {
            fclose(logger->file);
        }
        free(logger);
    }
}

// Get current timestamp string
static void get_timestamp(char *buffer, size_t size) {
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", tm_info);
}

// Write log
void logger_log(Logger *logger, LogLevel level, const char *format, ...) {
    if (logger == NULL || level < logger->min_level) {
        return;
    }

    char timestamp[32];
    get_timestamp(timestamp, sizeof(timestamp));

    // Format message
    va_list args;
    char message[1024];

    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    // Write to file
    fprintf(logger->file, "[%s] [%s] %s\n",
            timestamp, level_names[level], message);
    fflush(logger->file);  // Write immediately to avoid losing logs

    // Output to console
    if (logger->console_output) {
        printf("[%s] [%s] %s\n",
               timestamp, level_names[level], message);
    }
}

// Convenience macros
#define LOG_DEBUG(logger, ...) logger_log(logger, LOG_DEBUG, __VA_ARGS__)
#define LOG_INFO(logger, ...) logger_log(logger, LOG_INFO, __VA_ARGS__)
#define LOG_WARNING(logger, ...) logger_log(logger, LOG_WARNING, __VA_ARGS__)
#define LOG_ERROR(logger, ...) logger_log(logger, LOG_ERROR, __VA_ARGS__)

int main() {
    Logger *logger = logger_create("app.log", LOG_DEBUG, 1);
    if (logger == NULL) {
        printf("Failed to create logger\n");
        return 1;
    }

    LOG_INFO(logger, "Application started");
    LOG_DEBUG(logger, "Loading configuration file...");
    LOG_INFO(logger, "User %s logged in", "admin");
    LOG_WARNING(logger, "Disk usage: %.1f%%", 85.5);
    LOG_ERROR(logger, "Database connection failed, error code: %d", 1045);
    LOG_INFO(logger, "Application exiting");

    logger_destroy(logger);
    return 0;
}
```

### Example 5: Large File Chunked Processing

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHUNK_SIZE (1024 * 1024)  // 1MB chunks

// Chunk processing callback function type
typedef int (*ChunkProcessor)(const void *data, size_t size, size_t chunk_index, void *user_data);

// Statistics structure
typedef struct {
    size_t total_bytes;
    size_t chunk_count;
    unsigned char byte_histogram[256];
} FileStats;

// Statistics callback function
int stats_processor(const void *data, size_t size, size_t chunk_index, void *user_data) {
    FileStats *stats = (FileStats*)user_data;
    const unsigned char *bytes = (const unsigned char*)data;

    stats->total_bytes += size;

    for (size_t i = 0; i < size; i++) {
        stats->byte_histogram[bytes[i]]++;
    }

    printf("Processing chunk %zu: %zu bytes\n", chunk_index, size);
    return 0;
}

// Read and process file in chunks
int process_file_in_chunks(const char *filename, ChunkProcessor processor, void *user_data) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("Failed to open file");
        return -1;
    }

    void *buffer = malloc(CHUNK_SIZE);
    if (buffer == NULL) {
        fclose(fp);
        return -1;
    }

    size_t chunk_index = 0;
    size_t bytes_read;

    while ((bytes_read = fread(buffer, 1, CHUNK_SIZE, fp)) > 0) {
        int result = processor(buffer, bytes_read, chunk_index, user_data);
        if (result != 0) {
            free(buffer);
            fclose(fp);
            return result;
        }
        chunk_index++;
    }

    if (ferror(fp)) {
        perror("Error reading file");
        free(buffer);
        fclose(fp);
        return -1;
    }

    free(buffer);
    fclose(fp);
    return 0;
}

// Create test large file
void create_test_file(const char *filename, size_t size) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("Failed to create test file");
        return;
    }

    char buffer[4096];
    memset(buffer, 'A', sizeof(buffer));

    size_t written = 0;
    while (written < size) {
        size_t to_write = sizeof(buffer);
        if (written + to_write > size) {
            to_write = size - written;
        }
        fwrite(buffer, 1, to_write, fp);
        written += to_write;
    }

    fclose(fp);
    printf("Created test file of %zu bytes\n", size);
}

int main() {
    const char *filename = "large_file.bin";

    // Create 5MB test file
    create_test_file(filename, 5 * 1024 * 1024);

    // Process in chunks
    FileStats stats = {0};
    printf("\nStarting chunked file processing...\n");

    if (process_file_in_chunks(filename, stats_processor, &stats) == 0) {
        printf("\nProcessing complete:\n");
        printf("  Total bytes: %zu\n", stats.total_bytes);
        printf("  Character 'A' count: %zu\n",
               (size_t)stats.byte_histogram[(unsigned char)'A']);
    }

    // Cleanup
    remove(filename);

    return 0;
}
```

## Best Practices

### Always Check Return Values

```c
// Bad example
FILE *fp = fopen("file.txt", "r");
fgets(buffer, size, fp);  // Will crash if fp is NULL

// Good example
FILE *fp = fopen("file.txt", "r");
if (fp == NULL) {
    perror("Failed to open file");
    return -1;
}

if (fgets(buffer, size, fp) == NULL) {
    if (ferror(fp)) {
        perror("Read error");
    }
    // Or reached end of file
}

fclose(fp);
```

### Use RAII-Style Resource Management

```c
// Use GCC's cleanup attribute for automatic closing
static void auto_fclose(FILE **fp) {
    if (*fp) {
        fclose(*fp);
        *fp = NULL;
    }
}

#define AUTO_FILE __attribute__((cleanup(auto_fclose)))

void process_file(const char *filename) {
    AUTO_FILE FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        return;
    }

    // Use the file...
    // Automatically closes when function ends
}
```

### Binary Mode vs Text Mode

```c
// On Windows, text mode converts newline characters
// \n (LF) <-> \r\n (CRLF)

// Read text file
FILE *text_file = fopen("document.txt", "r");

// Read binary file (preserve original bytes)
FILE *binary_file = fopen("image.png", "rb");

// Cross-platform tip:
// - Text files: Use "r"/"w" to let the system handle newlines
// - Binary files: Always use "rb"/"wb"
```

### Temporary File Handling

```c
#include <stdio.h>
#include <stdlib.h>

void use_temp_file() {
    // Method 1: Use tmpfile()
    FILE *tmp1 = tmpfile();
    if (tmp1 != NULL) {
        fputs("Temporary data", tmp1);
        rewind(tmp1);
        // File is automatically deleted on fclose
        fclose(tmp1);
    }

    // Method 2: Use tmpnam() (not recommended, security issues)
    // char name[L_tmpnam];
    // tmpnam(name);

    // Method 3: Use mkstemp() (POSIX, recommended)
    #ifdef __unix__
    char template[] = "/tmp/myapp_XXXXXX";
    int fd = mkstemp(template);
    if (fd != -1) {
        FILE *tmp2 = fdopen(fd, "w+");
        // Use the file...
        fclose(tmp2);
        unlink(template);  // Delete the file
    }
    #endif
}
```

### Correct Use of fflush()

```c
#include <stdio.h>

void flush_examples() {
    FILE *fp = fopen("output.txt", "w");

    // Write data
    fputs("Important data", fp);

    // Write to disk immediately (don't wait for buffer to fill)
    fflush(fp);

    // Flush all open output streams
    fflush(NULL);

    // Note: fflush(stdin) is undefined behavior!
    // Don't do this

    fclose(fp);
}
```

### Handling Long Lines

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Dynamically read lines of arbitrary length
char* read_line(FILE *fp) {
    size_t capacity = 128;
    size_t length = 0;
    char *line = (char*)malloc(capacity);

    if (line == NULL) return NULL;

    int ch;
    while ((ch = fgetc(fp)) != EOF && ch != '\n') {
        if (length + 1 >= capacity) {
            capacity *= 2;
            char *new_line = (char*)realloc(line, capacity);
            if (new_line == NULL) {
                free(line);
                return NULL;
            }
            line = new_line;
        }
        line[length++] = (char)ch;
    }

    if (length == 0 && ch == EOF) {
        free(line);
        return NULL;
    }

    line[length] = '\0';
    return line;
}
```

## Common Pitfalls

### Pitfall 1: Forgetting to Close Files

```c
// Error: File handle leak
void bad_function() {
    FILE *fp = fopen("file.txt", "r");
    if (fp == NULL) return;

    // Early return, forgot to close
    if (some_condition) {
        return;  // Leak!
    }

    fclose(fp);
}

// Correct: Use goto to ensure cleanup
void good_function() {
    FILE *fp = fopen("file.txt", "r");
    if (fp == NULL) return;

    if (some_condition) {
        goto cleanup;
    }

    // Normal processing...

cleanup:
    fclose(fp);
}
```

### Pitfall 2: fgets Newline Character

```c
#include <stdio.h>
#include <string.h>

void handle_newline() {
    char buffer[100];

    // fgets retains the newline character
    fgets(buffer, sizeof(buffer), stdin);
    printf("With newline: [%s]\n", buffer);  // May output "[hello\n]"

    // Remove newline character
    buffer[strcspn(buffer, "\n")] = '\0';
    printf("Without newline: [%s]\n", buffer);  // Outputs "[hello]"
}
```

### Pitfall 3: Incorrect Use of feof

```c
// Error: Checking feof before reading
while (!feof(fp)) {
    char buffer[100];
    fgets(buffer, sizeof(buffer), fp);
    printf("%s", buffer);  // Last read may fail
}

// Correct: Check the return value of the read operation
char buffer[100];
while (fgets(buffer, sizeof(buffer), fp) != NULL) {
    printf("%s", buffer);
}
```

### Pitfall 4: Confusing Binary and Text Mode

```c
// On Windows, text mode converts bytes
// Must use "rb" when reading binary files

// Error: May corrupt binary data
FILE *fp = fopen("image.png", "r");  // Text mode

// Correct: Preserve original bytes
FILE *fp = fopen("image.png", "rb");  // Binary mode
```

### Pitfall 5: Buffer Overflow with fscanf

```c
// Error: May overflow
char name[10];
fscanf(fp, "%s", name);  // Overflow if input exceeds 9 characters

// Correct: Limit read length
char name[10];
fscanf(fp, "%9s", name);  // Read at most 9 characters

// Better: Use fgets
fgets(name, sizeof(name), fp);
```

### Pitfall 6: realloc and File Pointers

```c
// Error: buffer address changes, old pointer becomes invalid
char *buffer = malloc(100);
FILE *fp = fopen("file.txt", "r");
setvbuf(fp, buffer, _IOFBF, 100);

buffer = realloc(buffer, 200);  // Dangerous! fp still points to old address

// Correct: Close file first, then adjust buffer
fclose(fp);
buffer = realloc(buffer, 200);
fp = fopen("file.txt", "r");
setvbuf(fp, buffer, _IOFBF, 200);
```

### Pitfall 7: Misunderstanding fread/fwrite Return Values

```c
// fread/fwrite return the number of elements successfully read/written, not bytes
int data[10];
size_t count = fread(data, sizeof(int), 10, fp);

// count is the number of ints read, not the number of bytes
// Actual bytes read = count * sizeof(int)
```

## Performance Considerations

### Buffer Size Optimization

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define FILE_SIZE (100 * 1024 * 1024)  // 100MB

void benchmark_buffer_size(const char *filename) {
    size_t buffer_sizes[] = {512, 4096, 16384, 65536, 262144};
    int num_sizes = sizeof(buffer_sizes) / sizeof(buffer_sizes[0]);

    for (int i = 0; i < num_sizes; i++) {
        FILE *fp = fopen(filename, "rb");
        if (fp == NULL) continue;

        char *buffer = (char*)malloc(buffer_sizes[i]);
        clock_t start = clock();

        size_t total = 0;
        size_t read_count;
        while ((read_count = fread(buffer, 1, buffer_sizes[i], fp)) > 0) {
            total += read_count;
        }

        clock_t end = clock();
        double time_spent = (double)(end - start) / CLOCKS_PER_SEC;

        printf("Buffer %6zu bytes: %.3f sec (%.2f MB/s)\n",
               buffer_sizes[i], time_spent,
               (total / (1024.0 * 1024.0)) / time_spent);

        free(buffer);
        fclose(fp);
    }
}
```

### Batch Operations vs Single Operations

```c
#include <stdio.h>
#include <time.h>

#define NUM_WRITES 100000

void benchmark_write_methods(const char *filename) {
    clock_t start, end;

    // Method 1: Write character by character
    FILE *fp1 = fopen("test1.txt", "w");
    start = clock();
    for (int i = 0; i < NUM_WRITES; i++) {
        fputc('A', fp1);
    }
    end = clock();
    printf("Character-by-character write: %.3f sec\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp1);

    // Method 2: Using fputs
    FILE *fp2 = fopen("test2.txt", "w");
    start = clock();
    for (int i = 0; i < NUM_WRITES / 100; i++) {
        fputs("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
              "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", fp2);
    }
    end = clock();
    printf("fputs write:  %.3f sec\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp2);

    // Method 3: Using fwrite
    FILE *fp3 = fopen("test3.txt", "w");
    char buffer[NUM_WRITES];
    for (int i = 0; i < NUM_WRITES; i++) buffer[i] = 'A';
    start = clock();
    fwrite(buffer, 1, NUM_WRITES, fp3);
    end = clock();
    printf("fwrite write: %.3f sec\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp3);
}
```

### Memory-Mapped Files (High-Performance Solution)

```c
#ifdef __unix__
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

// Read file using mmap (faster than standard I/O)
void read_with_mmap(const char *filename) {
    int fd = open(filename, O_RDONLY);
    if (fd == -1) {
        perror("open");
        return;
    }

    struct stat sb;
    if (fstat(fd, &sb) == -1) {
        perror("fstat");
        close(fd);
        return;
    }

    char *addr = mmap(NULL, sb.st_size, PROT_READ, MAP_PRIVATE, fd, 0);
    if (addr == MAP_FAILED) {
        perror("mmap");
        close(fd);
        return;
    }

    // Direct access to file contents
    printf("File size: %ld bytes\n", sb.st_size);
    printf("First 100 bytes: %.100s\n", addr);

    munmap(addr, sb.st_size);
    close(fd);
}
#endif
```

### Asynchronous I/O Tips

```c
// For high-performance applications, consider:
// 1. Using system-specific asynchronous I/O APIs
//    - Linux: aio_read/aio_write, io_uring
//    - Windows: Overlapped I/O
// 2. Using multithreading for parallel read/write
// 3. Using memory-mapped files
// 4. Consider using specialized libraries like libuv
```

## Practical Scenarios

### Scenario 1: Configuration File Parser

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_LINE 256
#define MAX_KEY 64
#define MAX_VALUE 192
#define MAX_ENTRIES 100

typedef struct {
    char key[MAX_KEY];
    char value[MAX_VALUE];
} ConfigEntry;

typedef struct {
    ConfigEntry entries[MAX_ENTRIES];
    int count;
} Config;

// Trim leading and trailing whitespace
static char* trim(char *str) {
    char *end;
    while (isspace((unsigned char)*str)) str++;
    if (*str == 0) return str;
    end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';
    return str;
}

// Load configuration file
Config* config_load(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        return NULL;
    }

    Config *config = (Config*)calloc(1, sizeof(Config));
    if (config == NULL) {
        fclose(fp);
        return NULL;
    }

    char line[MAX_LINE];
    while (fgets(line, sizeof(line), fp) != NULL && config->count < MAX_ENTRIES) {
        // Skip comments and empty lines
        char *trimmed = trim(line);
        if (*trimmed == '#' || *trimmed == '\0') {
            continue;
        }

        // Find equals sign
        char *equals = strchr(trimmed, '=');
        if (equals == NULL) {
            continue;
        }

        // Split key-value
        *equals = '\0';
        char *key = trim(trimmed);
        char *value = trim(equals + 1);

        strncpy(config->entries[config->count].key, key, MAX_KEY - 1);
        strncpy(config->entries[config->count].value, value, MAX_VALUE - 1);
        config->count++;
    }

    fclose(fp);
    return config;
}

// Get configuration value
const char* config_get(Config *config, const char *key) {
    for (int i = 0; i < config->count; i++) {
        if (strcmp(config->entries[i].key, key) == 0) {
            return config->entries[i].value;
        }
    }
    return NULL;
}

// Get integer configuration
int config_get_int(Config *config, const char *key, int default_value) {
    const char *value = config_get(config, key);
    return value ? atoi(value) : default_value;
}

// Free configuration
void config_free(Config *config) {
    free(config);
}

int main() {
    // Create sample configuration file
    FILE *fp = fopen("app.ini", "w");
    fprintf(fp, "# Application configuration file\n");
    fprintf(fp, "server_host = localhost\n");
    fprintf(fp, "server_port = 8080\n");
    fprintf(fp, "debug = true\n");
    fprintf(fp, "max_connections = 100\n");
    fclose(fp);

    // Load and use configuration
    Config *config = config_load("app.ini");
    if (config == NULL) {
        printf("Failed to load configuration\n");
        return 1;
    }

    printf("Server: %s:%d\n",
           config_get(config, "server_host"),
           config_get_int(config, "server_port", 80));
    printf("Debug mode: %s\n", config_get(config, "debug"));
    printf("Max connections: %d\n",
           config_get_int(config, "max_connections", 10));

    config_free(config);
    return 0;
}
```

### Scenario 2: Simple Database Implementation

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define DB_MAGIC 0x53494D44  // "SIMD"
#define MAX_NAME 64

typedef struct {
    int id;
    char name[MAX_NAME];
    double balance;
    int active;
} Record;

typedef struct {
    unsigned int magic;
    int record_count;
    int next_id;
} DBHeader;

typedef struct {
    FILE *file;
    DBHeader header;
    char filename[256];
} Database;

// Open or create database
Database* db_open(const char *filename) {
    Database *db = (Database*)malloc(sizeof(Database));
    if (db == NULL) return NULL;

    strcpy(db->filename, filename);

    // Try to open existing file
    db->file = fopen(filename, "r+b");

    if (db->file != NULL) {
        // Read header
        fread(&db->header, sizeof(DBHeader), 1, db->file);

        if (db->header.magic != DB_MAGIC) {
            printf("Invalid database file\n");
            fclose(db->file);
            free(db);
            return NULL;
        }
    } else {
        // Create new file
        db->file = fopen(filename, "w+b");
        if (db->file == NULL) {
            free(db);
            return NULL;
        }

        // Initialize header
        db->header.magic = DB_MAGIC;
        db->header.record_count = 0;
        db->header.next_id = 1;

        fwrite(&db->header, sizeof(DBHeader), 1, db->file);
        fflush(db->file);
    }

    return db;
}

// Close database
void db_close(Database *db) {
    if (db) {
        if (db->file) {
            // Update header
            fseek(db->file, 0, SEEK_SET);
            fwrite(&db->header, sizeof(DBHeader), 1, db->file);
            fclose(db->file);
        }
        free(db);
    }
}

// Insert record
int db_insert(Database *db, const char *name, double balance) {
    Record record;
    record.id = db->header.next_id++;
    strncpy(record.name, name, MAX_NAME - 1);
    record.name[MAX_NAME - 1] = '\0';
    record.balance = balance;
    record.active = 1;

    // Move to end of file
    fseek(db->file, 0, SEEK_END);
    fwrite(&record, sizeof(Record), 1, db->file);
    fflush(db->file);

    db->header.record_count++;

    return record.id;
}

// Find record
Record* db_find(Database *db, int id) {
    fseek(db->file, sizeof(DBHeader), SEEK_SET);

    Record *record = (Record*)malloc(sizeof(Record));
    if (record == NULL) return NULL;

    while (fread(record, sizeof(Record), 1, db->file) == 1) {
        if (record->id == id && record->active) {
            return record;
        }
    }

    free(record);
    return NULL;
}

// Update record
int db_update(Database *db, int id, const char *name, double balance) {
    fseek(db->file, sizeof(DBHeader), SEEK_SET);

    Record record;
    long pos;

    while ((pos = ftell(db->file)), fread(&record, sizeof(Record), 1, db->file) == 1) {
        if (record.id == id && record.active) {
            if (name) {
                strncpy(record.name, name, MAX_NAME - 1);
            }
            record.balance = balance;

            fseek(db->file, pos, SEEK_SET);
            fwrite(&record, sizeof(Record), 1, db->file);
            fflush(db->file);

            return 1;
        }
    }

    return 0;
}

// Delete record (soft delete)
int db_delete(Database *db, int id) {
    fseek(db->file, sizeof(DBHeader), SEEK_SET);

    Record record;
    long pos;

    while ((pos = ftell(db->file)), fread(&record, sizeof(Record), 1, db->file) == 1) {
        if (record.id == id && record.active) {
            record.active = 0;

            fseek(db->file, pos, SEEK_SET);
            fwrite(&record, sizeof(Record), 1, db->file);
            fflush(db->file);

            return 1;
        }
    }

    return 0;
}

// List all records
void db_list(Database *db) {
    fseek(db->file, sizeof(DBHeader), SEEK_SET);

    Record record;
    printf("ID\tName\t\t\tBalance\n");
    printf("--------------------------------\n");

    while (fread(&record, sizeof(Record), 1, db->file) == 1) {
        if (record.active) {
            printf("%d\t%-16s%.2f\n", record.id, record.name, record.balance);
        }
    }
}

int main() {
    Database *db = db_open("accounts.db");
    if (db == NULL) {
        printf("Failed to open database\n");
        return 1;
    }

    // Insert data
    int id1 = db_insert(db, "Zhang San", 1000.00);
    int id2 = db_insert(db, "Li Si", 2500.50);
    int id3 = db_insert(db, "Wang Wu", 800.75);

    printf("Inserted 3 records\n\n");

    // List all records
    printf("All records:\n");
    db_list(db);

    // Update record
    db_update(db, id2, NULL, 3000.00);
    printf("\nUpdated balance for ID %d\n\n", id2);

    // Delete record
    db_delete(db, id3);
    printf("Deleted ID %d\n\n", id3);

    // List again
    printf("Records after update:\n");
    db_list(db);

    // Find record
    Record *found = db_find(db, id1);
    if (found) {
        printf("\nFound record: ID=%d, Name=%s, Balance=%.2f\n",
               found->id, found->name, found->balance);
        free(found);
    }

    db_close(db);
    return 0;
}
```

## Interview Key Points

### Question 1: What do the return values of fread and fwrite mean?

**Answer:**
`fread` and `fwrite` return the **number of elements** successfully read or written (not the number of bytes).

```c
int array[10];
size_t count = fread(array, sizeof(int), 10, fp);
// count is the number of ints read, ranging from 0 to 10
// Actual bytes read = count * sizeof(int)
```

If the return value is less than the requested `count`, it could be:
- End of file reached (check with `feof()`)
- A read error occurred (check with `ferror()`)

### Question 2: Why does fgetc() return int instead of char?

**Answer:**
Because `fgetc()` needs to be able to return 256 character values (0-255) plus a special EOF value (usually -1). If it returned `char`, there would be no way to distinguish the character with value 255 from EOF.

```c
int ch;  // Must be int
while ((ch = fgetc(fp)) != EOF) {
    // Process character
    char c = (char)ch;  // Safe to convert
}
```

### Question 3: What is the difference between text mode and binary mode?

**Answer:**
- **Text mode**: On some platforms (especially Windows), newline characters are converted
  - On read: `\r\n` -> `\n`
  - On write: `\n` -> `\r\n`
- **Binary mode**: Data is read/written as-is, without any conversion

```c
// Text mode is suitable for text files
FILE *text = fopen("doc.txt", "r");

// Binary mode is suitable for images, audio, executables, etc.
FILE *binary = fopen("image.png", "rb");
```

### Question 4: How to safely use fscanf to read strings?

**Answer:**

```c
char buffer[100];

// Unsafe: May cause buffer overflow
fscanf(fp, "%s", buffer);

// Safe: Limit read length
fscanf(fp, "%99s", buffer);  // Read at most 99 characters + '\0'

// Safer: Use fgets
fgets(buffer, sizeof(buffer), fp);
```

### Question 5: Explain the buffering mechanism of file I/O

**Answer:**
The C standard I/O library uses three buffering modes:

1. **Full buffering**: I/O occurs only when buffer is full, used for regular files
2. **Line buffering**: Flushes when newline is encountered, used for terminal devices
3. **Unbuffered**: I/O occurs immediately, used for stderr

```c
// Set buffering mode
setvbuf(fp, buffer, _IOFBF, size);  // Full buffering
setvbuf(fp, buffer, _IOLBF, size);  // Line buffering
setvbuf(fp, NULL, _IONBF, 0);       // Unbuffered

// Manually flush buffer
fflush(fp);
```

### Question 6: How to get file size?

**Answer:**

```c
// Method 1: Using fseek and ftell
long get_file_size(const char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) return -1;

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fclose(fp);

    return size;
}

// Method 2: Using system call (POSIX)
#include <sys/stat.h>
long get_file_size_stat(const char *filename) {
    struct stat st;
    if (stat(filename, &st) == 0) {
        return st.st_size;
    }
    return -1;
}
```

### Question 7: What happens if fclose fails?

**Answer:**
`fclose` may fail in these situations:
- Buffer flush failure (disk full, network disconnected, etc.)
- Background write errors

```c
if (fclose(fp) != 0) {
    // Error handling
    perror("fclose failed");
    // Data may not have been fully written to disk
}
```

For write operations, you should call `fflush` before `fclose` and check for errors, allowing earlier detection of problems.

## Further Reading

### Official Documentation
- [C11 Standard - stdio.h](https://en.cppreference.com/w/c/io)
- [GNU C Library - I/O](https://www.gnu.org/software/libc/manual/html_node/I_002fO-on-Streams.html)
- [POSIX File Operations](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fopen.html)

### Classic Books
- "The C Programming Language" (K&R) - Chapter 7
- "C Primer Plus" - Chapter 13
- "Advanced Programming in the UNIX Environment" (APUE) - Chapter 5

### Deep Dive
- [Linux Kernel File System](https://www.kernel.org/doc/html/latest/filesystems/index.html)
- [System-Level I/O vs Standard I/O Comparison](https://csapp.cs.cmu.edu/3e/ch10-preview.pdf)
- [High-Performance File I/O Techniques](https://lwn.net/Articles/776703/)

### Useful Tools
- Valgrind - Detect file handle leaks
- strace/dtrace - Trace system calls
- lsof - List open files
