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
origin: old/src/content/docs/cpp/c-file-io.zh.md
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

文件 I/O 是 C 语言编程中的核心技能之一。无论是读取配置文件、处理日志、存储数据还是与外部系统交互，文件操作都是必不可少的。本文将全面介绍 C 语言的文件输入输出机制。

## 概念解释

### 什么是文件 I/O

文件 I/O（Input/Output）是指程序与文件系统之间的数据传输过程。C 语言通过标准库 `<stdio.h>` 提供了一套完整的文件操作 API。

**C 语言文件操作的历史背景：**

- 1972 年：C 语言诞生于贝尔实验室
- 1978 年：K&R C 定义了基本的文件操作函数
- 1989 年：ANSI C (C89) 标准化了 `<stdio.h>` 库
- 1999 年：C99 增加了更多安全相关的函数

### 文件的分类

在 C 语言中，文件分为两大类：

1. **文本文件（Text File）**
   - 以字符形式存储数据
   - 可用文本编辑器直接查看
   - 每行以换行符结束
   - 例如：`.txt`、`.c`、`.csv`、`.json`

2. **二进制文件（Binary File）**
   - 以原始字节形式存储数据
   - 不经转换直接写入内存内容
   - 更紧凑、读写更快
   - 例如：`.bin`、`.exe`、`.png`、`.dat`

### 文件操作的基本步骤

```
打开文件 → 读/写操作 → 关闭文件
 (fopen)    (fread/fwrite等)   (fclose)
```

## 核心原理

### FILE 指针与文件流

C 语言使用 `FILE` 结构体来表示文件流。`FILE` 是一个不透明类型，包含了文件操作所需的所有信息：

```c
// FILE 结构体的概念示意（实际实现因平台而异）
typedef struct _FILE {
    char *_ptr;           // 当前缓冲区位置
    int _cnt;             // 缓冲区剩余字符数
    char *_base;          // 缓冲区基地址
    int _flag;            // 文件状态标志
    int _file;            // 文件描述符
    int _charbuf;         // 单字符缓冲
    int _bufsiz;          // 缓冲区大小
    char *_tmpfname;      // 临时文件名
} FILE;
```

**文件指针的作用：**
- 标识特定的磁盘文件
- 追踪当前读写位置
- 管理缓冲区
- 记录文件状态和错误信息

### 标准文件流

C 程序启动时自动打开三个标准文件流：

```c
#include <stdio.h>

// 标准输入（键盘）
extern FILE *stdin;

// 标准输出（屏幕）
extern FILE *stdout;

// 标准错误输出（屏幕）
extern FILE *stderr;
```

### 缓冲机制

C 语言文件 I/O 使用缓冲区来提高效率：

```
+----------+     +---------+     +----------+
|  程序    | ←→  |  缓冲区  | ←→  |  磁盘    |
| (内存)   |     | (内存)   |     | (存储)   |
+----------+     +---------+     +----------+
```

**三种缓冲模式：**

1. **全缓冲（Full Buffering）**
   - 缓冲区满时才进行实际 I/O
   - 用于普通磁盘文件

2. **行缓冲（Line Buffering）**
   - 遇到换行符时刷新缓冲区
   - 用于交互式终端（如 `stdout`）

3. **无缓冲（Unbuffered）**
   - 每次 I/O 操作立即执行
   - 用于 `stderr`，确保错误信息立即显示

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("test.txt", "w");

    // 设置全缓冲，缓冲区大小 1024 字节
    char buffer[1024];
    setvbuf(fp, buffer, _IOFBF, sizeof(buffer));

    // 设置行缓冲
    // setvbuf(fp, buffer, _IOLBF, sizeof(buffer));

    // 设置无缓冲
    // setvbuf(fp, NULL, _IONBF, 0);

    fputs("Hello, World!", fp);

    // 手动刷新缓冲区
    fflush(fp);

    fclose(fp);
    return 0;
}
```

## 核心要点

### fopen() - 打开文件

```c
FILE *fopen(const char *filename, const char *mode);
```

**打开模式详解：**

| 模式 | 描述 | 文件不存在 | 文件存在 |
|------|------|------------|----------|
| `"r"` | 只读文本 | 返回 NULL | 从头读取 |
| `"w"` | 只写文本 | 创建新文件 | 清空内容 |
| `"a"` | 追加文本 | 创建新文件 | 追加到末尾 |
| `"r+"` | 读写文本 | 返回 NULL | 从头读写 |
| `"w+"` | 读写文本 | 创建新文件 | 清空内容 |
| `"a+"` | 读写追加 | 创建新文件 | 读取任意，写入追加 |
| `"rb"` | 只读二进制 | 返回 NULL | 从头读取 |
| `"wb"` | 只写二进制 | 创建新文件 | 清空内容 |
| `"ab"` | 追加二进制 | 创建新文件 | 追加到末尾 |
| `"rb+"` | 读写二进制 | 返回 NULL | 从头读写 |
| `"wb+"` | 读写二进制 | 创建新文件 | 清空内容 |
| `"ab+"` | 读写追加二进制 | 创建新文件 | 读取任意，写入追加 |

**基本使用：**

```c
#include <stdio.h>

int main() {
    FILE *fp;

    // 打开文件进行读取
    fp = fopen("input.txt", "r");
    if (fp == NULL) {
        perror("打开文件失败");
        return 1;
    }

    // 使用文件...

    fclose(fp);
    return 0;
}
```

### fclose() - 关闭文件

```c
int fclose(FILE *stream);
```

`fclose()` 执行以下操作：
1. 刷新缓冲区（写入未写数据）
2. 释放缓冲区内存
3. 关闭文件描述符
4. 释放 FILE 结构体

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("test.txt", "w");
    if (fp == NULL) {
        perror("打开失败");
        return 1;
    }

    fputs("Hello, World!\n", fp);

    // 关闭文件并检查返回值
    if (fclose(fp) != 0) {
        perror("关闭文件失败");
        return 1;
    }

    // 关闭后不要再使用 fp
    fp = NULL;

    return 0;
}
```

### 字符级 I/O

**fgetc() / getc() - 读取单个字符：**

```c
int fgetc(FILE *stream);
int getc(FILE *stream);  // 可能实现为宏，效率更高
```

**fputc() / putc() - 写入单个字符：**

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
        perror("打开文件失败");
        return 1;
    }

    int ch;
    // fgetc 返回 int，以便区分 EOF 和有效字符
    while ((ch = fgetc(input)) != EOF) {
        // 将字符转换为大写后写入
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

### 行级 I/O

**fgets() - 读取一行：**

```c
char *fgets(char *str, int n, FILE *stream);
```

- 最多读取 `n-1` 个字符
- 遇到换行符或 EOF 停止
- 保留换行符（如果读到的话）
- 自动添加空字符终止

**fputs() - 写入字符串：**

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
        perror("打开文件失败");
        return 1;
    }

    char line[MAX_LINE];
    int line_num = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        line_num++;

        // 移除末尾的换行符
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }

        printf("第 %d 行: %s\n", line_num, line);
    }

    fclose(fp);
    return 0;
}
```

### 格式化 I/O

**fprintf() - 格式化写入：**

```c
int fprintf(FILE *stream, const char *format, ...);
```

**fscanf() - 格式化读取：**

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

// 写入员工数据
void write_employees(const char *filename, Employee *emps, int count) {
    FILE *fp = fopen(filename, "w");
    if (fp == NULL) {
        perror("打开文件失败");
        return;
    }

    // 写入记录数
    fprintf(fp, "%d\n", count);

    // 写入每条记录
    for (int i = 0; i < count; i++) {
        fprintf(fp, "%s %d %.2f\n",
                emps[i].name, emps[i].age, emps[i].salary);
    }

    fclose(fp);
}

// 读取员工数据
int read_employees(const char *filename, Employee *emps, int max_count) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("打开文件失败");
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

    printf("读取了 %d 条记录:\n", count);
    for (int i = 0; i < count; i++) {
        printf("  %s, %d 岁, 薪资: %.2f\n",
               loaded[i].name, loaded[i].age, loaded[i].salary);
    }

    return 0;
}
```

### 块级 I/O - fread() 和 fwrite()

**fread() - 读取数据块：**

```c
size_t fread(void *ptr, size_t size, size_t count, FILE *stream);
```

**fwrite() - 写入数据块：**

```c
size_t fwrite(const void *ptr, size_t size, size_t count, FILE *stream);
```

参数说明：
- `ptr`: 数据缓冲区指针
- `size`: 每个元素的大小（字节）
- `count`: 元素个数
- `stream`: 文件指针
- 返回值: 成功读取/写入的元素个数

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char name[32];
    double score;
} Student;

// 写入学生记录（二进制）
int write_students_binary(const char *filename, Student *students, int count) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("打开文件失败");
        return -1;
    }

    // 先写入记录数
    fwrite(&count, sizeof(int), 1, fp);

    // 写入所有学生记录
    size_t written = fwrite(students, sizeof(Student), count, fp);

    fclose(fp);
    return (written == count) ? 0 : -1;
}

// 读取学生记录（二进制）
Student* read_students_binary(const char *filename, int *count) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("打开文件失败");
        return NULL;
    }

    // 读取记录数
    fread(count, sizeof(int), 1, fp);

    // 分配内存
    Student *students = (Student*)malloc(*count * sizeof(Student));
    if (students == NULL) {
        fclose(fp);
        return NULL;
    }

    // 读取所有记录
    size_t read_count = fread(students, sizeof(Student), *count, fp);

    fclose(fp);

    if (read_count != *count) {
        free(students);
        return NULL;
    }

    return students;
}

int main() {
    // 创建测试数据
    Student students[] = {
        {1, "张三", 85.5},
        {2, "李四", 92.0},
        {3, "王五", 78.5}
    };

    // 写入二进制文件
    if (write_students_binary("students.dat", students, 3) != 0) {
        printf("写入失败\n");
        return 1;
    }
    printf("成功写入 3 条记录\n");

    // 读取二进制文件
    int count;
    Student *loaded = read_students_binary("students.dat", &count);
    if (loaded == NULL) {
        printf("读取失败\n");
        return 1;
    }

    printf("成功读取 %d 条记录:\n", count);
    for (int i = 0; i < count; i++) {
        printf("  ID: %d, 姓名: %s, 分数: %.1f\n",
               loaded[i].id, loaded[i].name, loaded[i].score);
    }

    free(loaded);
    return 0;
}
```

### 文件定位

**fseek() - 设置文件位置：**

```c
int fseek(FILE *stream, long offset, int whence);
```

`whence` 参数：
- `SEEK_SET`: 从文件开头计算偏移
- `SEEK_CUR`: 从当前位置计算偏移
- `SEEK_END`: 从文件末尾计算偏移

**ftell() - 获取当前位置：**

```c
long ftell(FILE *stream);
```

**rewind() - 回到文件开头：**

```c
void rewind(FILE *stream);
```

**fgetpos() / fsetpos() - 用于大文件：**

```c
int fgetpos(FILE *stream, fpos_t *pos);
int fsetpos(FILE *stream, const fpos_t *pos);
```

```c
#include <stdio.h>

// 获取文件大小
long get_file_size(const char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }

    fseek(fp, 0, SEEK_END);  // 移到文件末尾
    long size = ftell(fp);    // 获取位置（即文件大小）
    fclose(fp);

    return size;
}

// 读取文件的指定部分
int read_file_range(const char *filename, long start, long length, char *buffer) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        return -1;
    }

    // 移动到起始位置
    if (fseek(fp, start, SEEK_SET) != 0) {
        fclose(fp);
        return -1;
    }

    // 读取指定长度
    size_t read_count = fread(buffer, 1, length, fp);
    fclose(fp);

    return (int)read_count;
}

int main() {
    const char *filename = "test.txt";

    // 创建测试文件
    FILE *fp = fopen(filename, "w");
    fputs("Hello, World! This is a test file.", fp);
    fclose(fp);

    // 获取文件大小
    long size = get_file_size(filename);
    printf("文件大小: %ld 字节\n", size);

    // 读取文件的一部分
    char buffer[20] = {0};
    int read = read_file_range(filename, 7, 5, buffer);
    printf("从位置 7 读取 %d 字节: '%s'\n", read, buffer);

    return 0;
}
```

### 错误处理

**ferror() - 检查错误：**

```c
int ferror(FILE *stream);
```

**feof() - 检查是否到达文件末尾：**

```c
int feof(FILE *stream);
```

**clearerr() - 清除错误标志：**

```c
void clearerr(FILE *stream);
```

**perror() - 打印错误信息：**

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
        // 方法 1: 使用 perror
        perror("打开文件失败");

        // 方法 2: 使用 errno 和 strerror
        printf("错误码: %d\n", errno);
        printf("错误信息: %s\n", strerror(errno));

        return 1;
    }

    char buffer[100];
    while (fgets(buffer, sizeof(buffer), fp) != NULL) {
        printf("%s", buffer);
    }

    // 检查是否因错误而停止
    if (ferror(fp)) {
        printf("读取时发生错误\n");
        clearerr(fp);  // 清除错误标志
    }

    // 检查是否到达文件末尾
    if (feof(fp)) {
        printf("已到达文件末尾\n");
    }

    fclose(fp);
    return 0;
}
```

## 代码示例

### 示例 1：文件复制程序

```c
#include <stdio.h>
#include <stdlib.h>

#define BUFFER_SIZE 4096

int copy_file(const char *src, const char *dest) {
    FILE *fin = fopen(src, "rb");
    if (fin == NULL) {
        perror("无法打开源文件");
        return -1;
    }

    FILE *fout = fopen(dest, "wb");
    if (fout == NULL) {
        perror("无法创建目标文件");
        fclose(fin);
        return -1;
    }

    char buffer[BUFFER_SIZE];
    size_t bytes_read;
    size_t total_bytes = 0;

    while ((bytes_read = fread(buffer, 1, BUFFER_SIZE, fin)) > 0) {
        size_t bytes_written = fwrite(buffer, 1, bytes_read, fout);
        if (bytes_written != bytes_read) {
            perror("写入错误");
            fclose(fin);
            fclose(fout);
            return -1;
        }
        total_bytes += bytes_written;
    }

    if (ferror(fin)) {
        perror("读取错误");
        fclose(fin);
        fclose(fout);
        return -1;
    }

    printf("成功复制 %zu 字节\n", total_bytes);

    fclose(fin);
    fclose(fout);
    return 0;
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        printf("用法: %s <源文件> <目标文件>\n", argv[0]);
        return 1;
    }

    return copy_file(argv[1], argv[2]);
}
```

### 示例 2：CSV 文件解析器

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

// 解析一行 CSV
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

    // 处理最后一个字段
    if (char_idx > 0) {
        row->fields[field_idx][char_idx] = '\0';
        field_idx++;
    }

    row->field_count = field_idx;
    return field_idx;
}

// 读取 CSV 文件
void read_csv(const char *filename) {
    FILE *fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("打开 CSV 文件失败");
        return;
    }

    char line[MAX_LINE];
    CSVRow row;
    int line_num = 0;

    while (fgets(line, sizeof(line), fp) != NULL) {
        line_num++;
        parse_csv_line(line, &row);

        printf("第 %d 行 (%d 个字段): ", line_num, row.field_count);
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
    // 创建示例 CSV 文件
    FILE *fp = fopen("data.csv", "w");
    fprintf(fp, "姓名,年龄,城市\n");
    fprintf(fp, "张三,25,北京\n");
    fprintf(fp, "李四,30,上海\n");
    fprintf(fp, "\"王五, Jr.\",28,广州\n");  // 包含逗号的字段
    fclose(fp);

    printf("解析 CSV 文件:\n");
    read_csv("data.csv");

    return 0;
}
```

### 示例 3：二进制配置文件

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 配置文件魔数和版本
#define CONFIG_MAGIC 0x434F4E46  // "CONF"
#define CONFIG_VERSION 1

// 配置结构
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

// 保存配置
int save_config(const char *filename, const AppConfig *config) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("无法创建配置文件");
        return -1;
    }

    // 创建带有魔数和版本的配置副本
    AppConfig save_config = *config;
    save_config.magic = CONFIG_MAGIC;
    save_config.version = CONFIG_VERSION;

    size_t written = fwrite(&save_config, sizeof(AppConfig), 1, fp);
    fclose(fp);

    return (written == 1) ? 0 : -1;
}

// 加载配置
int load_config(const char *filename, AppConfig *config) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("无法打开配置文件");
        return -1;
    }

    size_t read_count = fread(config, sizeof(AppConfig), 1, fp);
    fclose(fp);

    if (read_count != 1) {
        printf("读取配置失败\n");
        return -1;
    }

    // 验证魔数
    if (config->magic != CONFIG_MAGIC) {
        printf("无效的配置文件格式\n");
        return -1;
    }

    // 检查版本
    if (config->version != CONFIG_VERSION) {
        printf("配置文件版本不兼容: %d (期望 %d)\n",
               config->version, CONFIG_VERSION);
        return -1;
    }

    return 0;
}

// 打印配置
void print_config(const AppConfig *config) {
    printf("应用配置:\n");
    printf("  应用名称: %s\n", config->app_name);
    printf("  窗口大小: %d x %d\n", config->window_width, config->window_height);
    printf("  音量: %.1f%%\n", config->volume * 100);
    printf("  全屏: %s\n", config->fullscreen ? "是" : "否");
    printf("  语言: %s\n", config->language);
}

int main() {
    // 创建默认配置
    AppConfig config = {0};
    strcpy(config.app_name, "MyApplication");
    config.window_width = 1920;
    config.window_height = 1080;
    config.volume = 0.8f;
    config.fullscreen = 0;
    strcpy(config.language, "zh-CN");

    // 保存配置
    if (save_config("app.conf", &config) == 0) {
        printf("配置已保存\n");
    }

    // 加载配置
    AppConfig loaded_config;
    if (load_config("app.conf", &loaded_config) == 0) {
        printf("配置已加载\n");
        print_config(&loaded_config);
    }

    return 0;
}
```

### 示例 4：日志文件系统

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

// 创建日志器
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

// 销毁日志器
void logger_destroy(Logger *logger) {
    if (logger) {
        if (logger->file) {
            fclose(logger->file);
        }
        free(logger);
    }
}

// 获取当前时间字符串
static void get_timestamp(char *buffer, size_t size) {
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    strftime(buffer, size, "%Y-%m-%d %H:%M:%S", tm_info);
}

// 写入日志
void logger_log(Logger *logger, LogLevel level, const char *format, ...) {
    if (logger == NULL || level < logger->min_level) {
        return;
    }

    char timestamp[32];
    get_timestamp(timestamp, sizeof(timestamp));

    // 格式化消息
    va_list args;
    char message[1024];

    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    // 写入文件
    fprintf(logger->file, "[%s] [%s] %s\n",
            timestamp, level_names[level], message);
    fflush(logger->file);  // 立即写入，避免丢失日志

    // 输出到控制台
    if (logger->console_output) {
        printf("[%s] [%s] %s\n",
               timestamp, level_names[level], message);
    }
}

// 便捷宏
#define LOG_DEBUG(logger, ...) logger_log(logger, LOG_DEBUG, __VA_ARGS__)
#define LOG_INFO(logger, ...) logger_log(logger, LOG_INFO, __VA_ARGS__)
#define LOG_WARNING(logger, ...) logger_log(logger, LOG_WARNING, __VA_ARGS__)
#define LOG_ERROR(logger, ...) logger_log(logger, LOG_ERROR, __VA_ARGS__)

int main() {
    Logger *logger = logger_create("app.log", LOG_DEBUG, 1);
    if (logger == NULL) {
        printf("创建日志器失败\n");
        return 1;
    }

    LOG_INFO(logger, "应用程序启动");
    LOG_DEBUG(logger, "加载配置文件...");
    LOG_INFO(logger, "用户 %s 已登录", "admin");
    LOG_WARNING(logger, "磁盘使用率: %.1f%%", 85.5);
    LOG_ERROR(logger, "数据库连接失败，错误码: %d", 1045);
    LOG_INFO(logger, "应用程序退出");

    logger_destroy(logger);
    return 0;
}
```

### 示例 5：大文件分块处理

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CHUNK_SIZE (1024 * 1024)  // 1MB 块

// 分块处理回调函数类型
typedef int (*ChunkProcessor)(const void *data, size_t size, size_t chunk_index, void *user_data);

// 统计信息结构
typedef struct {
    size_t total_bytes;
    size_t chunk_count;
    unsigned char byte_histogram[256];
} FileStats;

// 统计回调函数
int stats_processor(const void *data, size_t size, size_t chunk_index, void *user_data) {
    FileStats *stats = (FileStats*)user_data;
    const unsigned char *bytes = (const unsigned char*)data;

    stats->total_bytes += size;

    for (size_t i = 0; i < size; i++) {
        stats->byte_histogram[bytes[i]]++;
    }

    printf("处理块 %zu: %zu 字节\n", chunk_index, size);
    return 0;
}

// 分块读取并处理文件
int process_file_in_chunks(const char *filename, ChunkProcessor processor, void *user_data) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) {
        perror("打开文件失败");
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
        perror("读取文件出错");
        free(buffer);
        fclose(fp);
        return -1;
    }

    free(buffer);
    fclose(fp);
    return 0;
}

// 创建测试大文件
void create_test_file(const char *filename, size_t size) {
    FILE *fp = fopen(filename, "wb");
    if (fp == NULL) {
        perror("创建测试文件失败");
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
    printf("创建了 %zu 字节的测试文件\n", size);
}

int main() {
    const char *filename = "large_file.bin";

    // 创建 5MB 测试文件
    create_test_file(filename, 5 * 1024 * 1024);

    // 分块处理
    FileStats stats = {0};
    printf("\n开始分块处理文件...\n");

    if (process_file_in_chunks(filename, stats_processor, &stats) == 0) {
        printf("\n处理完成:\n");
        printf("  总字节数: %zu\n", stats.total_bytes);
        printf("  字符 'A' 出现次数: %zu\n",
               (size_t)stats.byte_histogram[(unsigned char)'A']);
    }

    // 清理
    remove(filename);

    return 0;
}
```

## 最佳实践

### 始终检查返回值

```c
// 错误示例
FILE *fp = fopen("file.txt", "r");
fgets(buffer, size, fp);  // 如果 fp 为 NULL，会崩溃

// 正确示例
FILE *fp = fopen("file.txt", "r");
if (fp == NULL) {
    perror("打开文件失败");
    return -1;
}

if (fgets(buffer, size, fp) == NULL) {
    if (ferror(fp)) {
        perror("读取错误");
    }
    // 或者已到文件末尾
}

fclose(fp);
```

### 使用 RAII 风格的资源管理

```c
// 使用 GCC 的 cleanup 属性实现自动关闭
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

    // 使用文件...
    // 函数结束时自动关闭
}
```

### 二进制模式与文本模式

```c
// Windows 上文本模式会转换换行符
// \n (LF) <-> \r\n (CRLF)

// 读取文本文件
FILE *text_file = fopen("document.txt", "r");

// 读取二进制文件（保持原始字节）
FILE *binary_file = fopen("image.png", "rb");

// 跨平台提示：
// - 文本文件：使用 "r"/"w" 让系统处理换行符
// - 二进制文件：始终使用 "rb"/"wb"
```

### 临时文件处理

```c
#include <stdio.h>
#include <stdlib.h>

void use_temp_file() {
    // 方法 1：使用 tmpfile()
    FILE *tmp1 = tmpfile();
    if (tmp1 != NULL) {
        fputs("临时数据", tmp1);
        rewind(tmp1);
        // 文件在 fclose 时自动删除
        fclose(tmp1);
    }

    // 方法 2：使用 tmpnam() (不推荐，有安全问题)
    // char name[L_tmpnam];
    // tmpnam(name);

    // 方法 3：使用 mkstemp() (POSIX，推荐)
    #ifdef __unix__
    char template[] = "/tmp/myapp_XXXXXX";
    int fd = mkstemp(template);
    if (fd != -1) {
        FILE *tmp2 = fdopen(fd, "w+");
        // 使用文件...
        fclose(tmp2);
        unlink(template);  // 删除文件
    }
    #endif
}
```

### 正确使用 fflush()

```c
#include <stdio.h>

void flush_examples() {
    FILE *fp = fopen("output.txt", "w");

    // 写入数据
    fputs("重要数据", fp);

    // 立即写入磁盘（不等缓冲区满）
    fflush(fp);

    // 刷新所有打开的输出流
    fflush(NULL);

    // 注意：fflush(stdin) 是未定义行为！
    // 不要这样做

    fclose(fp);
}
```

### 处理长行

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 动态读取任意长度的行
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

## 常见陷阱

### 陷阱 1：忘记关闭文件

```c
// 错误：文件句柄泄漏
void bad_function() {
    FILE *fp = fopen("file.txt", "r");
    if (fp == NULL) return;

    // 提前返回，忘记关闭
    if (some_condition) {
        return;  // 泄漏！
    }

    fclose(fp);
}

// 正确：使用 goto 确保清理
void good_function() {
    FILE *fp = fopen("file.txt", "r");
    if (fp == NULL) return;

    if (some_condition) {
        goto cleanup;
    }

    // 正常处理...

cleanup:
    fclose(fp);
}
```

### 陷阱 2：fgets 的换行符

```c
#include <stdio.h>
#include <string.h>

void handle_newline() {
    char buffer[100];

    // fgets 保留换行符
    fgets(buffer, sizeof(buffer), stdin);
    printf("带换行符: [%s]\n", buffer);  // 可能输出 "[hello\n]"

    // 移除换行符
    buffer[strcspn(buffer, "\n")] = '\0';
    printf("无换行符: [%s]\n", buffer);  // 输出 "[hello]"
}
```

### 陷阱 3：feof 的错误使用

```c
// 错误：在读取前检查 feof
while (!feof(fp)) {
    char buffer[100];
    fgets(buffer, sizeof(buffer), fp);
    printf("%s", buffer);  // 最后一次可能读取失败
}

// 正确：检查读取操作的返回值
char buffer[100];
while (fgets(buffer, sizeof(buffer), fp) != NULL) {
    printf("%s", buffer);
}
```

### 陷阱 4：二进制文件与文本模式混淆

```c
// 在 Windows 上，文本模式会转换字节
// 读取二进制文件时必须使用 "rb"

// 错误：可能损坏二进制数据
FILE *fp = fopen("image.png", "r");  // 文本模式

// 正确：保持原始字节
FILE *fp = fopen("image.png", "rb");  // 二进制模式
```

### 陷阱 5：fscanf 的缓冲区溢出

```c
// 错误：可能溢出
char name[10];
fscanf(fp, "%s", name);  // 如果输入超过 9 字符就溢出

// 正确：限制读取长度
char name[10];
fscanf(fp, "%9s", name);  // 最多读取 9 字符

// 更好：使用 fgets
fgets(name, sizeof(name), fp);
```

### 陷阱 6：realloc 与文件指针

```c
// 错误：buffer 地址改变后，旧指针失效
char *buffer = malloc(100);
FILE *fp = fopen("file.txt", "r");
setvbuf(fp, buffer, _IOFBF, 100);

buffer = realloc(buffer, 200);  // 危险！fp 仍然指向旧地址

// 正确：先关闭文件，再调整缓冲区
fclose(fp);
buffer = realloc(buffer, 200);
fp = fopen("file.txt", "r");
setvbuf(fp, buffer, _IOFBF, 200);
```

### 陷阱 7：fread/fwrite 返回值理解错误

```c
// fread/fwrite 返回成功读写的元素个数，不是字节数
int data[10];
size_t count = fread(data, sizeof(int), 10, fp);

// count 是读取的 int 数量，不是字节数
// 实际读取的字节数是 count * sizeof(int)
```

## 性能考量

### 缓冲区大小优化

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

        printf("缓冲区 %6zu 字节: %.3f 秒 (%.2f MB/s)\n",
               buffer_sizes[i], time_spent,
               (total / (1024.0 * 1024.0)) / time_spent);

        free(buffer);
        fclose(fp);
    }
}
```

### 批量操作 vs 单次操作

```c
#include <stdio.h>
#include <time.h>

#define NUM_WRITES 100000

void benchmark_write_methods(const char *filename) {
    clock_t start, end;

    // 方法 1：逐字符写入
    FILE *fp1 = fopen("test1.txt", "w");
    start = clock();
    for (int i = 0; i < NUM_WRITES; i++) {
        fputc('A', fp1);
    }
    end = clock();
    printf("逐字符写入: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp1);

    // 方法 2：使用 fputs
    FILE *fp2 = fopen("test2.txt", "w");
    start = clock();
    for (int i = 0; i < NUM_WRITES / 100; i++) {
        fputs("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
              "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", fp2);
    }
    end = clock();
    printf("fputs 写入:  %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp2);

    // 方法 3：使用 fwrite
    FILE *fp3 = fopen("test3.txt", "w");
    char buffer[NUM_WRITES];
    for (int i = 0; i < NUM_WRITES; i++) buffer[i] = 'A';
    start = clock();
    fwrite(buffer, 1, NUM_WRITES, fp3);
    end = clock();
    printf("fwrite 写入: %.3f 秒\n",
           (double)(end - start) / CLOCKS_PER_SEC);
    fclose(fp3);
}
```

### 内存映射文件（高性能方案）

```c
#ifdef __unix__
#include <stdio.h>
#include <stdlib.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

// 使用 mmap 读取文件（比标准 I/O 更快）
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

    // 直接访问文件内容
    printf("文件大小: %ld 字节\n", sb.st_size);
    printf("前 100 字节: %.100s\n", addr);

    munmap(addr, sb.st_size);
    close(fd);
}
#endif
```

### 异步 I/O 提示

```c
// 对于高性能应用，考虑：
// 1. 使用系统特定的异步 I/O API
//    - Linux: aio_read/aio_write, io_uring
//    - Windows: Overlapped I/O
// 2. 使用多线程进行并行读写
// 3. 使用内存映射文件
// 4. 考虑使用专业库如 libuv
```

## 实战场景

### 场景 1：配置文件解析器

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

// 去除字符串首尾空白
static char* trim(char *str) {
    char *end;
    while (isspace((unsigned char)*str)) str++;
    if (*str == 0) return str;
    end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';
    return str;
}

// 加载配置文件
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
        // 跳过注释和空行
        char *trimmed = trim(line);
        if (*trimmed == '#' || *trimmed == '\0') {
            continue;
        }

        // 查找等号
        char *equals = strchr(trimmed, '=');
        if (equals == NULL) {
            continue;
        }

        // 分割键值
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

// 获取配置值
const char* config_get(Config *config, const char *key) {
    for (int i = 0; i < config->count; i++) {
        if (strcmp(config->entries[i].key, key) == 0) {
            return config->entries[i].value;
        }
    }
    return NULL;
}

// 获取整数配置
int config_get_int(Config *config, const char *key, int default_value) {
    const char *value = config_get(config, key);
    return value ? atoi(value) : default_value;
}

// 释放配置
void config_free(Config *config) {
    free(config);
}

int main() {
    // 创建示例配置文件
    FILE *fp = fopen("app.ini", "w");
    fprintf(fp, "# 应用配置文件\n");
    fprintf(fp, "server_host = localhost\n");
    fprintf(fp, "server_port = 8080\n");
    fprintf(fp, "debug = true\n");
    fprintf(fp, "max_connections = 100\n");
    fclose(fp);

    // 加载并使用配置
    Config *config = config_load("app.ini");
    if (config == NULL) {
        printf("加载配置失败\n");
        return 1;
    }

    printf("服务器: %s:%d\n",
           config_get(config, "server_host"),
           config_get_int(config, "server_port", 80));
    printf("调试模式: %s\n", config_get(config, "debug"));
    printf("最大连接数: %d\n",
           config_get_int(config, "max_connections", 10));

    config_free(config);
    return 0;
}
```

### 场景 2：简单数据库实现

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

// 打开或创建数据库
Database* db_open(const char *filename) {
    Database *db = (Database*)malloc(sizeof(Database));
    if (db == NULL) return NULL;

    strcpy(db->filename, filename);

    // 尝试打开现有文件
    db->file = fopen(filename, "r+b");

    if (db->file != NULL) {
        // 读取头部
        fread(&db->header, sizeof(DBHeader), 1, db->file);

        if (db->header.magic != DB_MAGIC) {
            printf("无效的数据库文件\n");
            fclose(db->file);
            free(db);
            return NULL;
        }
    } else {
        // 创建新文件
        db->file = fopen(filename, "w+b");
        if (db->file == NULL) {
            free(db);
            return NULL;
        }

        // 初始化头部
        db->header.magic = DB_MAGIC;
        db->header.record_count = 0;
        db->header.next_id = 1;

        fwrite(&db->header, sizeof(DBHeader), 1, db->file);
        fflush(db->file);
    }

    return db;
}

// 关闭数据库
void db_close(Database *db) {
    if (db) {
        if (db->file) {
            // 更新头部
            fseek(db->file, 0, SEEK_SET);
            fwrite(&db->header, sizeof(DBHeader), 1, db->file);
            fclose(db->file);
        }
        free(db);
    }
}

// 插入记录
int db_insert(Database *db, const char *name, double balance) {
    Record record;
    record.id = db->header.next_id++;
    strncpy(record.name, name, MAX_NAME - 1);
    record.name[MAX_NAME - 1] = '\0';
    record.balance = balance;
    record.active = 1;

    // 移到文件末尾
    fseek(db->file, 0, SEEK_END);
    fwrite(&record, sizeof(Record), 1, db->file);
    fflush(db->file);

    db->header.record_count++;

    return record.id;
}

// 查找记录
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

// 更新记录
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

// 删除记录（软删除）
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

// 列出所有记录
void db_list(Database *db) {
    fseek(db->file, sizeof(DBHeader), SEEK_SET);

    Record record;
    printf("ID\t姓名\t\t余额\n");
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
        printf("打开数据库失败\n");
        return 1;
    }

    // 插入数据
    int id1 = db_insert(db, "张三", 1000.00);
    int id2 = db_insert(db, "李四", 2500.50);
    int id3 = db_insert(db, "王五", 800.75);

    printf("插入了 3 条记录\n\n");

    // 列出所有记录
    printf("所有记录:\n");
    db_list(db);

    // 更新记录
    db_update(db, id2, NULL, 3000.00);
    printf("\n更新 ID %d 的余额\n\n", id2);

    // 删除记录
    db_delete(db, id3);
    printf("删除 ID %d\n\n", id3);

    // 再次列出
    printf("更新后的记录:\n");
    db_list(db);

    // 查找记录
    Record *found = db_find(db, id1);
    if (found) {
        printf("\n找到记录: ID=%d, 姓名=%s, 余额=%.2f\n",
               found->id, found->name, found->balance);
        free(found);
    }

    db_close(db);
    return 0;
}
```

## 面试要点

### 问题 1：fread 和 fwrite 的返回值是什么意思？

**答案：**
`fread` 和 `fwrite` 返回成功读取或写入的**元素个数**（不是字节数）。

```c
int array[10];
size_t count = fread(array, sizeof(int), 10, fp);
// count 是读取的 int 数量，范围是 0 到 10
// 实际读取的字节数 = count * sizeof(int)
```

如果返回值小于请求的 `count`，可能是：
- 到达文件末尾（使用 `feof()` 检查）
- 发生读取错误（使用 `ferror()` 检查）

### 问题 2：为什么 fgetc() 返回 int 而不是 char？

**答案：**
因为 `fgetc()` 需要能够返回 256 种字符值（0-255）以及一个特殊的 EOF 值（通常是 -1）。如果返回 `char`，就无法区分值为 255 的字符和 EOF。

```c
int ch;  // 必须是 int
while ((ch = fgetc(fp)) != EOF) {
    // 处理字符
    char c = (char)ch;  // 可以安全转换
}
```

### 问题 3：文本模式和二进制模式有什么区别？

**答案：**
- **文本模式**：在某些平台（特别是 Windows）上，换行符会被转换
  - 读取时：`\r\n` -> `\n`
  - 写入时：`\n` -> `\r\n`
- **二进制模式**：数据原样读写，不做任何转换

```c
// 文本模式适用于文本文件
FILE *text = fopen("doc.txt", "r");

// 二进制模式适用于图片、音频、可执行文件等
FILE *binary = fopen("image.png", "rb");
```

### 问题 4：如何安全地使用 fscanf 读取字符串？

**答案：**

```c
char buffer[100];

// 不安全：可能缓冲区溢出
fscanf(fp, "%s", buffer);

// 安全：限制读取长度
fscanf(fp, "%99s", buffer);  // 最多读 99 个字符 + '\0'

// 更安全：使用 fgets
fgets(buffer, sizeof(buffer), fp);
```

### 问题 5：说说文件 I/O 的缓冲机制

**答案：**
C 标准 I/O 库使用三种缓冲模式：

1. **全缓冲**：缓冲区满时才进行 I/O，用于普通文件
2. **行缓冲**：遇到换行符时刷新，用于终端设备
3. **无缓冲**：立即进行 I/O，用于 stderr

```c
// 设置缓冲模式
setvbuf(fp, buffer, _IOFBF, size);  // 全缓冲
setvbuf(fp, buffer, _IOLBF, size);  // 行缓冲
setvbuf(fp, NULL, _IONBF, 0);       // 无缓冲

// 手动刷新缓冲区
fflush(fp);
```

### 问题 6：如何获取文件大小？

**答案：**

```c
// 方法 1：使用 fseek 和 ftell
long get_file_size(const char *filename) {
    FILE *fp = fopen(filename, "rb");
    if (fp == NULL) return -1;

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fclose(fp);

    return size;
}

// 方法 2：使用系统调用（POSIX）
#include <sys/stat.h>
long get_file_size_stat(const char *filename) {
    struct stat st;
    if (stat(filename, &st) == 0) {
        return st.st_size;
    }
    return -1;
}
```

### 问题 7：fclose 失败会发生什么？

**答案：**
`fclose` 在以下情况可能失败：
- 缓冲区刷新失败（磁盘满、网络断开等）
- 后台写入错误

```c
if (fclose(fp) != 0) {
    // 错误处理
    perror("fclose 失败");
    // 数据可能未完全写入磁盘
}
```

对于写入操作，应该在 `fclose` 之前调用 `fflush` 并检查错误，这样可以更早发现问题。

## 延伸阅读

### 官方文档
- [C11 标准 - stdio.h](https://en.cppreference.com/w/c/io)
- [GNU C Library - I/O](https://www.gnu.org/software/libc/manual/html_node/I_002fO-on-Streams.html)
- [POSIX 文件操作](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fopen.html)

### 经典书籍
- 《C 程序设计语言》(K&R) - 第 7 章
- 《C Primer Plus》 - 第 13 章
- 《UNIX 环境高级编程》(APUE) - 第 5 章

### 深入学习
- [Linux 内核文件系统](https://www.kernel.org/doc/html/latest/filesystems/index.html)
- [系统级 I/O 与标准 I/O 比较](https://csapp.cs.cmu.edu/3e/ch10-preview.pdf)
- [高性能文件 I/O 技术](https://lwn.net/Articles/776703/)

### 实用工具
- Valgrind - 检测文件句柄泄漏
- strace/dtrace - 跟踪系统调用
- lsof - 列出打开的文件
