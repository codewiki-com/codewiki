---
title: eBPF 可观测性深度解析
description: 掌握 eBPF 现代可观测性技术 - 从内核追踪到生产环境监控，包括 bpftrace、BCC 和 Cilium 工具
track: devops
section: observability
difficulty: advanced
tags:
  - eBPF
  - 可观测性
  - Linux
  - 内核
  - 追踪
  - 监控
  - 性能
status: imported
origin: old/src/content/docs/devops/ebpf.zh.md
divergence: 0.262
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: DevOps
  subcategory: ""
  order: 60
  lastUpdated: 2026-01-22
---

eBPF（扩展伯克利包过滤器）是一项革命性技术，允许在 Linux 内核中运行沙盒化程序，无需修改内核源码或加载内核模块。最初为包过滤设计，eBPF 已发展成为可观测性、安全性和网络的强大平台。它以极低的性能开销实现对系统行为的前所未有的可见性。

## 概念解释

### 什么是 eBPF？

**eBPF** 是运行在 Linux 内核中的虚拟机，响应内核事件执行用户定义的程序。这些程序在执行前经过安全验证，并在沙盒环境中运行，确保它们不会使内核崩溃或危及系统安全。

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户空间                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  bpftrace   │  │     BCC     │  │   Cilium    │   工具      │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                       系统调用                                   │
├─────────────────────────────────────────────────────────────────┤
│                         内核空间                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    eBPF 验证器                           │   │
│  │  - 安全检查    - 边界检查                                │   │
│  │  - 无无限循环  - 内存访问验证                            │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │                    eBPF 虚拟机                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │  程序   │  │  程序   │  │  程序   │  │  程序   │    │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │   │
│  └───────┼────────────┼────────────┼────────────┼──────────┘   │
│          │            │            │            │               │
│  ┌───────▼────┐ ┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐         │
│  │  kprobes   │ │tracepoints│ │   XDP   │ │ cgroups │  钩子点 │
│  └────────────┘ └───────────┘ └─────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 为什么用 eBPF 做可观测性？

传统可观测性方法的局限性：

| 方法 | 局限性 |
|------|--------|
| 日志 | 高开销、范围有限、需要代码修改 |
| APM 代理 | 语言特定、显著开销 |
| /proc 文件系统 | 指标有限、基于轮询 |
| 内核模块 | 危险、难以维护 |
| SystemTap | 需要调试符号、设置复杂 |

eBPF 优势：
- **零侵入**：无需代码修改
- **低开销**：JIT 编译，以内核速度运行
- **安全**：执行前验证，不会使内核崩溃
- **全面**：访问所有内核事件
- **动态**：运行时加载/卸载程序

### 可观测性钩子点

| 钩子类型 | 描述 | 使用场景 |
|----------|------|----------|
| **kprobes** | 动态内核函数追踪 | 函数入口/出口、参数 |
| **uprobes** | 用户空间函数追踪 | 应用程序函数调用 |
| **tracepoints** | 静态内核插桩 | 调度器、系统调用、网络 |
| **perf events** | 硬件/软件计数器 | CPU 周期、缓存未命中 |
| **XDP** | 网络包处理 | 快速包过滤/路由 |
| **tc** | 流量控制 | 网络 QoS、隧道 |
| **cgroups** | 容器资源控制 | 每容器指标 |
| **LSM** | Linux 安全模块 | 安全监控 |

## 核心原理

### eBPF Maps

Maps 是用于在 eBPF 程序和用户空间之间共享数据的键值数据结构：

```c
// 可观测性常用 map 类型

// Hash map - 通用键值存储
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, u32);           // PID
    __type(value, u64);         // 时间戳或计数
} process_map SEC(".maps");

// Per-CPU array - 高性能计数器
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 256);
    __type(key, u32);
    __type(value, u64);
} counters SEC(".maps");

// Ring buffer - 高效事件流
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);  // 256 KB
} events SEC(".maps");

// 延迟分布直方图
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 64);
    __type(key, u64);           // 桶
    __type(value, u64);         // 计数
} latency_hist SEC(".maps");
```

### eBPF 辅助函数

eBPF 程序可以调用内核辅助函数：

```c
// 时间和标识
u64 ts = bpf_ktime_get_ns();              // 纳秒时间戳
u64 pid_tgid = bpf_get_current_pid_tgid(); // 获取 PID 和 TGID
u32 pid = pid_tgid >> 32;
u32 tid = pid_tgid;
u32 uid = bpf_get_current_uid_gid();       // 获取 UID

// 进程信息
struct task_struct *task = (struct task_struct *)bpf_get_current_task();
char comm[16];
bpf_get_current_comm(&comm, sizeof(comm)); // 获取进程名

// Map 操作
void *value = bpf_map_lookup_elem(&my_map, &key);
bpf_map_update_elem(&my_map, &key, &value, BPF_ANY);
bpf_map_delete_elem(&my_map, &key);

// 内存访问
bpf_probe_read_kernel(&dest, sizeof(dest), src);     // 内核内存
bpf_probe_read_user(&dest, sizeof(dest), user_ptr); // 用户内存

// Ring buffer 输出
void *data = bpf_ringbuf_reserve(&events, sizeof(struct event), 0);
if (data) {
    // 填充数据...
    bpf_ringbuf_submit(data, 0);
}
```

## 关键概念

### 1. 使用 kprobes 追踪

```c
// 追踪文件打开系统调用
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

struct event {
    u32 pid;
    u32 uid;
    char comm[16];
    char filename[256];
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

SEC("kprobe/do_sys_openat2")
int trace_openat(struct pt_regs *ctx)
{
    struct event *e;

    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e)
        return 0;

    e->pid = bpf_get_current_pid_tgid() >> 32;
    e->uid = bpf_get_current_uid_gid();
    bpf_get_current_comm(&e->comm, sizeof(e->comm));

    // 从用户空间读取文件名
    const char *filename = (const char *)PT_REGS_PARM2(ctx);
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename), filename);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

### 2. 使用 Tracepoints 追踪

```c
// 使用静态 tracepoints（比 kprobes 更稳定）
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

// Tracepoint 格式来自 /sys/kernel/debug/tracing/events/
struct trace_event_raw_sys_enter {
    unsigned long long unused;
    long id;
    unsigned long args[6];
};

SEC("tracepoint/raw_syscalls/sys_enter")
int trace_syscall(struct trace_event_raw_sys_enter *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    long syscall_id = ctx->id;

    // 按 PID 统计系统调用
    u64 *count = bpf_map_lookup_elem(&syscall_count, &pid);
    if (count) {
        __sync_fetch_and_add(count, 1);
    } else {
        u64 init = 1;
        bpf_map_update_elem(&syscall_count, &pid, &init, BPF_ANY);
    }

    return 0;
}
```

### 3. 使用 uprobes 追踪用户空间

```c
// 追踪用户空间函数调用
SEC("uprobe/lib/x86_64-linux-gnu/libc.so.6:malloc")
int trace_malloc(struct pt_regs *ctx)
{
    size_t size = PT_REGS_PARM1(ctx);
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    struct alloc_event e = {
        .pid = pid,
        .size = size,
        .timestamp = bpf_ktime_get_ns(),
    };

    bpf_ringbuf_output(&events, &e, sizeof(e), 0);
    return 0;
}

SEC("uretprobe/lib/x86_64-linux-gnu/libc.so.6:malloc")
int trace_malloc_ret(struct pt_regs *ctx)
{
    void *ret = (void *)PT_REGS_RC(ctx);
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // 存储分配地址用于追踪
    bpf_map_update_elem(&alloc_map, &pid, &ret, BPF_ANY);
    return 0;
}
```

## 代码示例

### 完整 bpftrace 示例

bpftrace 是 eBPF 的高级追踪语言：

```bash
#!/usr/bin/env bpftrace

# 按进程统计系统调用
# bpftrace syscall_count.bt
tracepoint:raw_syscalls:sys_enter
{
    @syscalls[comm] = count();
}

interval:s:5
{
    print(@syscalls);
    clear(@syscalls);
}

---

# read() 系统调用延迟直方图
# bpftrace read_latency.bt
tracepoint:syscalls:sys_enter_read
{
    @start[tid] = nsecs;
}

tracepoint:syscalls:sys_exit_read
/@start[tid]/
{
    $latency = nsecs - @start[tid];
    @latency_us = hist($latency / 1000);
    delete(@start[tid]);
}

END
{
    print(@latency_us);
}

---

# 按进程追踪文件打开
# bpftrace file_opens.bt
tracepoint:syscalls:sys_enter_openat
{
    printf("%s (pid=%d) 打开: %s\n",
           comm, pid, str(args->filename));
}

---

# CPU 离线时间分析
# bpftrace offcpu.bt
kprobe:finish_task_switch
{
    $prev = (struct task_struct *)arg0;
    $prev_pid = $prev->pid;

    if (@start[$prev_pid]) {
        $delta = nsecs - @start[$prev_pid];
        @offcpu_time[comm] = sum($delta);
        delete(@start[$prev_pid]);
    }

    @start[tid] = nsecs;
}

---

# 内存分配追踪
# bpftrace malloc_track.bt
uprobe:/lib/x86_64-linux-gnu/libc.so.6:malloc
{
    @malloc_size[comm] = hist(arg0);
    @malloc_count[comm] = count();
}

uretprobe:/lib/x86_64-linux-gnu/libc.so.6:malloc
{
    @malloc_addr[tid] = retval;
}

uprobe:/lib/x86_64-linux-gnu/libc.so.6:free
/arg0 != 0/
{
    @free_count[comm] = count();
}

---

# 网络包追踪
# bpftrace tcp_connect.bt
kprobe:tcp_v4_connect
{
    $sk = (struct sock *)arg0;
    $daddr = ntop($sk->__sk_common.skc_daddr);
    $dport = $sk->__sk_common.skc_dport;

    printf("%s 连接到 %s:%d\n", comm, $daddr, $dport);
}

kretprobe:tcp_v4_connect
/retval == 0/
{
    @connects[comm] = count();
}
```

### BCC Python 工具

BCC（BPF 编译器集合）用于生产监控：

```python
#!/usr/bin/env python3
# 追踪进程执行及参数

from bcc import BPF
from time import strftime

# eBPF 程序
program = """
#include <uapi/linux/ptrace.h>
#include <linux/sched.h>

struct data_t {
    u32 pid;
    u32 ppid;
    u32 uid;
    char comm[TASK_COMM_LEN];
    char filename[256];
};

BPF_PERF_OUTPUT(events);

int syscall__execve(struct pt_regs *ctx, const char __user *filename)
{
    struct data_t data = {};
    struct task_struct *task;

    data.pid = bpf_get_current_pid_tgid() >> 32;
    data.uid = bpf_get_current_uid_gid();

    task = (struct task_struct *)bpf_get_current_task();
    data.ppid = task->real_parent->tgid;

    bpf_get_current_comm(&data.comm, sizeof(data.comm));
    bpf_probe_read_user_str(&data.filename, sizeof(data.filename), filename);

    events.perf_submit(ctx, &data, sizeof(data));
    return 0;
}
"""

# 加载 BPF 程序
b = BPF(text=program)
b.attach_kprobe(event=b.get_syscall_fnname("execve"), fn_name="syscall__execve")

# 打印表头
print("%-9s %-6s %-6s %-6s %-16s %s" % (
    "时间", "PID", "PPID", "UID", "进程名", "文件名"))

# 处理事件
def print_event(cpu, data, size):
    event = b["events"].event(data)
    print("%-9s %-6d %-6d %-6d %-16s %s" % (
        strftime("%H:%M:%S"),
        event.pid,
        event.ppid,
        event.uid,
        event.comm.decode('utf-8', 'replace'),
        event.filename.decode('utf-8', 'replace')))

b["events"].open_perf_buffer(print_event)
while True:
    try:
        b.perf_buffer_poll()
    except KeyboardInterrupt:
        exit()
```

```python
#!/usr/bin/env python3
# TCP 连接延迟监控

from bcc import BPF
from time import sleep
import argparse

program = """
#include <uapi/linux/ptrace.h>
#include <net/sock.h>
#include <bcc/proto.h>

struct info_t {
    u64 ts;
    u32 pid;
    char comm[TASK_COMM_LEN];
};

struct ipv4_data_t {
    u64 ts;
    u32 pid;
    u32 saddr;
    u32 daddr;
    u16 dport;
    u64 delta;
    char comm[TASK_COMM_LEN];
};

BPF_HASH(start, struct sock *, struct info_t);
BPF_PERF_OUTPUT(ipv4_events);

int trace_connect(struct pt_regs *ctx, struct sock *sk)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    struct info_t info = {
        .ts = bpf_ktime_get_ns(),
        .pid = pid,
    };
    bpf_get_current_comm(&info.comm, sizeof(info.comm));

    start.update(&sk, &info);
    return 0;
}

int trace_tcp_rcv_state_process(struct pt_regs *ctx, struct sock *sk)
{
    // 检查是否为 TCP_ESTABLISHED 状态
    if (sk->__sk_common.skc_state != TCP_ESTABLISHED)
        return 0;

    struct info_t *infop = start.lookup(&sk);
    if (!infop)
        return 0;

    u64 delta = bpf_ktime_get_ns() - infop->ts;

    struct ipv4_data_t data = {};
    data.ts = infop->ts;
    data.pid = infop->pid;
    data.delta = delta / 1000;  // 转换为微秒
    data.saddr = sk->__sk_common.skc_rcv_saddr;
    data.daddr = sk->__sk_common.skc_daddr;
    data.dport = sk->__sk_common.skc_dport;
    bpf_probe_read_kernel(&data.comm, sizeof(data.comm), infop->comm);

    ipv4_events.perf_submit(ctx, &data, sizeof(data));
    start.delete(&sk);

    return 0;
}
"""

# 加载并附加
b = BPF(text=program)
b.attach_kprobe(event="tcp_v4_connect", fn_name="trace_connect")
b.attach_kprobe(event="tcp_rcv_state_process", fn_name="trace_tcp_rcv_state_process")

# 打印表头
print("%-9s %-6s %-15s %-15s %-5s %-10s %s" % (
    "时间", "PID", "源地址", "目标地址", "端口", "延迟(us)", "进程名"))

def inet_ntoa(addr):
    return f"{addr & 0xff}.{(addr >> 8) & 0xff}.{(addr >> 16) & 0xff}.{(addr >> 24) & 0xff}"

def print_ipv4_event(cpu, data, size):
    event = b["ipv4_events"].event(data)
    print("%-9s %-6d %-15s %-15s %-5d %-10d %s" % (
        strftime("%H:%M:%S"),
        event.pid,
        inet_ntoa(event.saddr),
        inet_ntoa(event.daddr),
        event.dport,
        event.delta,
        event.comm.decode('utf-8', 'replace')))

b["ipv4_events"].open_perf_buffer(print_ipv4_event)
while True:
    try:
        b.perf_buffer_poll()
    except KeyboardInterrupt:
        exit()
```

## 最佳实践

### 1. 高效使用 Map

```c
// 使用 per-CPU map 处理高频计数器
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, u32);
    __type(value, u64);
} packet_count SEC(".maps");

SEC("xdp")
int count_packets(struct xdp_md *ctx)
{
    u32 key = 0;
    u64 *count = bpf_map_lookup_elem(&packet_count, &key);
    if (count)
        __sync_fetch_and_add(count, 1);
    return XDP_PASS;
}

// 使用 ring buffer 替代 perf buffer 获得更好性能
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

// 优先使用 lookup 而非 delete+insert
u64 *value = bpf_map_lookup_elem(&map, &key);
if (value) {
    *value = new_value;  // 原地更新
} else {
    bpf_map_update_elem(&map, &key, &new_value, BPF_NOEXIST);
}
```

### 2. 安全内存访问

```c
// 始终检查返回值
void *value = bpf_map_lookup_elem(&map, &key);
if (!value)
    return 0;  // 处理缺失条目

// 使用有界读取
char buf[256];
int ret = bpf_probe_read_user_str(buf, sizeof(buf), user_ptr);
if (ret < 0)
    return 0;  // 处理错误

// CO-RE 安全结构体访问
struct task_struct *task = (struct task_struct *)bpf_get_current_task();
u32 ppid = BPF_CORE_READ(task, real_parent, tgid);
```

### 3. 性能过滤

```c
// 尽早过滤以减少开销
SEC("tracepoint/syscalls/sys_enter_read")
int trace_read(struct trace_event_raw_sys_enter *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // 按 PID 过滤（如果指定）
    #ifdef FILTER_PID
    if (pid != FILTER_PID)
        return 0;
    #endif

    // 按最小大小过滤
    size_t count = ctx->args[2];
    if (count < MIN_SIZE)
        return 0;

    // 处理事件...
    return 0;
}

// 使用 map 进行动态过滤
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 1024);
    __type(key, u32);
    __type(value, u8);
} filter_pids SEC(".maps");

SEC("kprobe/sys_write")
int trace_write(struct pt_regs *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // 只追踪 filter map 中的 PID
    if (!bpf_map_lookup_elem(&filter_pids, &pid))
        return 0;

    // 处理事件...
    return 0;
}
```

## 常见陷阱

### 1. 验证器错误

```c
// 错误：无界循环
for (int i = 0; ; i++) {  // 验证器拒绝
    // ...
}

// 正确：有界循环
#pragma unroll
for (int i = 0; i < 10; i++) {
    // ...
}

// 错误：未初始化的栈变量
char buf[256];  // 可能包含垃圾数据
bpf_probe_read_kernel(buf, 256, src);

// 正确：零初始化
char buf[256] = {};
bpf_probe_read_kernel(buf, 256, src);

// 错误：越界访问
char *ptr = value;
char c = ptr[1000];  // 验证器拒绝

// 正确：边界检查
if (offset < sizeof(buffer)) {
    char c = buffer[offset];
}
```

### 2. Map 访问问题

```c
// 错误：不检查 lookup 结果
u64 *value = bpf_map_lookup_elem(&map, &key);
*value = 42;  // 如果 key 不存在会崩溃

// 正确：始终检查
u64 *value = bpf_map_lookup_elem(&map, &key);
if (value)
    *value = 42;

// 错误：对已存在的 key 使用 BPF_NOEXIST
bpf_map_update_elem(&map, &key, &val, BPF_NOEXIST);  // 如果存在则失败

// 正确：使用适当的标志
bpf_map_update_elem(&map, &key, &val, BPF_ANY);  // 始终有效
```

### 3. 栈大小限制

```c
// 错误：大栈分配（eBPF 栈是 512 字节）
SEC("kprobe/foo")
int bad_probe(struct pt_regs *ctx)
{
    char buf[1024];  // 太大！
    // ...
}

// 正确：使用 map 存储大数据
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, u32);
    __type(value, struct large_buffer);
} scratch SEC(".maps");

SEC("kprobe/foo")
int good_probe(struct pt_regs *ctx)
{
    u32 key = 0;
    struct large_buffer *buf = bpf_map_lookup_elem(&scratch, &key);
    if (!buf)
        return 0;
    // 使用 buf...
}
```

## 性能考虑

### 开销分析

| 钩子类型 | 典型开销 | 使用场景 |
|----------|----------|----------|
| XDP | < 100 ns | 包处理 |
| tc | 100-500 ns | 流量控制 |
| kprobes | 50-200 ns | 内核函数追踪 |
| tracepoints | 20-100 ns | 静态内核事件 |
| uprobes | 500-2000 ns | 用户空间追踪 |
| perf events | 100-500 ns | 性能分析 |

### 优化策略

```c
// 1. 使用尾调用处理复杂逻辑
struct {
    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);
    __uint(max_entries, 8);
    __type(key, u32);
    __type(value, u32);
} prog_array SEC(".maps");

SEC("xdp")
int main_prog(struct xdp_md *ctx)
{
    // 快速分类
    u32 key = classify(ctx);
    bpf_tail_call(ctx, &prog_array, key);
    return XDP_PASS;
}

// 2. 从用户空间批量读取 map
LIBBPF_OPTS(bpf_map_batch_opts, opts,
    .elem_flags = 0,
    .flags = 0,
);

bpf_map_lookup_batch(map_fd, NULL, &next_key,
                     keys, values, &count, &opts);

// 3. 使用 BPF_MAP_TYPE_LRU_HASH 自动清理
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 10000);
    __type(key, struct flow_key);
    __type(value, struct flow_stats);
} flow_table SEC(".maps");
```

## 实战场景

### 场景 1：Kubernetes Pod 网络监控

```python
#!/usr/bin/env python3
# 按 Kubernetes pod 监控网络连接

from bcc import BPF
from kubernetes import client, config

program = """
#include <uapi/linux/ptrace.h>
#include <net/sock.h>
#include <linux/sched.h>

struct conn_info {
    u32 pid;
    u32 saddr;
    u32 daddr;
    u16 sport;
    u16 dport;
    char comm[TASK_COMM_LEN];
};

BPF_HASH(connections, u64, struct conn_info);
BPF_PERF_OUTPUT(events);

int trace_connect(struct pt_regs *ctx, struct sock *sk)
{
    u64 pid_tgid = bpf_get_current_pid_tgid();
    u32 pid = pid_tgid >> 32;

    struct conn_info info = {};
    info.pid = pid;
    info.saddr = sk->__sk_common.skc_rcv_saddr;
    info.daddr = sk->__sk_common.skc_daddr;
    info.sport = sk->__sk_common.skc_num;
    info.dport = sk->__sk_common.skc_dport;
    bpf_get_current_comm(&info.comm, sizeof(info.comm));

    events.perf_submit(ctx, &info, sizeof(info));
    return 0;
}
"""

def get_pod_for_pid(pid):
    """通过 cgroup 从 PID 获取 Kubernetes pod 名称"""
    try:
        with open(f"/proc/{pid}/cgroup") as f:
            for line in f:
                if "kubepods" in line:
                    # 从 cgroup 路径提取 pod UID
                    parts = line.split("/")
                    for part in parts:
                        if part.startswith("pod"):
                            return part
    except:
        pass
    return None

# 加载并运行...
```

### 场景 2：安全监控

```python
#!/usr/bin/env python3
# 检测可疑进程行为

from bcc import BPF
import json
from datetime import datetime

program = """
#include <uapi/linux/ptrace.h>
#include <linux/sched.h>

struct event {
    u32 pid;
    u32 ppid;
    u32 uid;
    u64 timestamp;
    int event_type;
    char comm[TASK_COMM_LEN];
    char filename[256];
};

#define EVENT_EXEC 1
#define EVENT_SUSPICIOUS_FILE 2
#define EVENT_PRIV_ESCALATION 3

BPF_PERF_OUTPUT(events);

// 追踪 execve 调用
TRACEPOINT_PROBE(syscalls, sys_enter_execve)
{
    struct event e = {};
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();

    e.pid = bpf_get_current_pid_tgid() >> 32;
    e.ppid = task->real_parent->tgid;
    e.uid = bpf_get_current_uid_gid();
    e.timestamp = bpf_ktime_get_ns();
    e.event_type = EVENT_EXEC;
    bpf_get_current_comm(&e.comm, sizeof(e.comm));
    bpf_probe_read_user_str(&e.filename, sizeof(e.filename), args->filename);

    events.perf_submit(args, &e, sizeof(e));
    return 0;
}

// 追踪敏感文件访问
TRACEPOINT_PROBE(syscalls, sys_enter_openat)
{
    char filename[256];
    bpf_probe_read_user_str(&filename, sizeof(filename), args->filename);

    // 检查敏感文件
    if (filename[0] == '/' && filename[1] == 'e' && filename[2] == 't' && filename[3] == 'c') {
        struct event e = {};
        e.pid = bpf_get_current_pid_tgid() >> 32;
        e.uid = bpf_get_current_uid_gid();
        e.timestamp = bpf_ktime_get_ns();
        e.event_type = EVENT_SUSPICIOUS_FILE;
        bpf_get_current_comm(&e.comm, sizeof(e.comm));
        __builtin_memcpy(&e.filename, &filename, sizeof(filename));

        events.perf_submit(args, &e, sizeof(e));
    }
    return 0;
}

// 检测权限提升 (setuid)
TRACEPOINT_PROBE(syscalls, sys_enter_setuid)
{
    u32 uid = bpf_get_current_uid_gid();
    u32 target_uid = args->uid;

    // 非 root 尝试成为 root
    if (uid != 0 && target_uid == 0) {
        struct event e = {};
        e.pid = bpf_get_current_pid_tgid() >> 32;
        e.uid = uid;
        e.timestamp = bpf_ktime_get_ns();
        e.event_type = EVENT_PRIV_ESCALATION;
        bpf_get_current_comm(&e.comm, sizeof(e.comm));

        events.perf_submit(args, &e, sizeof(e));
    }
    return 0;
}
"""

EVENT_TYPES = {
    1: "执行",
    2: "敏感文件",
    3: "权限提升"
}

def process_event(cpu, data, size):
    event = b["events"].event(data)
    timestamp = datetime.fromtimestamp(event.timestamp / 1e9).isoformat()

    alert = {
        "timestamp": timestamp,
        "event_type": EVENT_TYPES.get(event.event_type, "未知"),
        "pid": event.pid,
        "uid": event.uid,
        "comm": event.comm.decode(),
        "filename": event.filename.decode() if event.filename else ""
    }

    print(json.dumps(alert, ensure_ascii=False))

b = BPF(text=program)
b["events"].open_perf_buffer(process_event)

while True:
    b.perf_buffer_poll()
```

## 面试要点

### 概念问题

**Q: 什么是 eBPF，为什么它对可观测性具有革命性？**
> eBPF 允许在 Linux 内核中运行沙盒化程序，无需修改内核源码或加载模块。它具有革命性是因为它以用户空间的安全性提供内核级的可见性，以最小开销实现深度可观测性。程序在执行前经过验证，确保不会使内核崩溃。

**Q: 解释 kprobes、tracepoints 和 uprobes 的区别。**
> - **kprobes**：任何内核函数的动态探针，灵活但可能因内核更新而失效
> - **tracepoints**：内核开发者定义的静态、稳定探针点，API 更稳定
> - **uprobes**：用户空间应用的动态探针，开销较高但允许无代码修改追踪应用

**Q: eBPF maps 如何工作，何时使用不同类型？**
> Maps 是 eBPF 程序和用户空间之间共享的键值存储。Hash maps 用于通用查找，arrays 用于索引访问，ring buffers 用于流式事件，per-CPU maps 用于无锁争用的高频计数器，LRU maps 用于自动淘汰的有界缓存。

### 快速参考卡片

```
eBPF 核心概念：
├── 钩子点：kprobes, uprobes, tracepoints, XDP, tc
├── Maps：Hash, Array, RingBuf, PerCPU, LRU
├── 辅助函数：bpf_map_*, bpf_probe_read_*, bpf_get_current_*
└── 验证器：安全检查、有界循环、内存访问

性能技巧：
├── 使用 per-CPU maps 处理计数器
├── 在程序中尽早过滤
├── 使用 ring buffers 替代 perf buffers
├── 对高频事件采样
└── 批量用户空间读取

常用工具：
├── bpftrace：高级追踪语言
├── BCC：Python/Lua 绑定
├── libbpf：CO-RE C 库
├── bpftool：BPF 管理 CLI
└── Cilium：Kubernetes 网络
```

## 延伸阅读

### 官方文档

- [eBPF 官方网站](https://ebpf.io/) - 社区资源和文档
- [Linux 内核 BPF 文档](https://www.kernel.org/doc/html/latest/bpf/) - 内核文档
- [libbpf 文档](https://libbpf.readthedocs.io/) - libbpf API 参考

### 书籍和文章

- **"BPF Performance Tools"** by Brendan Gregg - 综合指南
- **"Learning eBPF"** by Liz Rice - 实践入门
- **"Linux Observability with BPF"** by David Calavera - 深入探索

### 工具和项目

| 工具 | 用途 | URL |
|------|------|-----|
| bpftrace | 高级追踪 | github.com/iovisor/bpftrace |
| BCC | Python/Lua 工具 | github.com/iovisor/bcc |
| libbpf | CO-RE C 库 | github.com/libbpf/libbpf |
| Cilium | K8s 网络 | cilium.io |
| Falco | 安全监控 | falco.org |
| Pixie | K8s 可观测性 | px.dev |
| Tetragon | 安全可观测性 | github.com/cilium/tetragon |

---

eBPF 代表了 Linux 可观测性的范式转变，无需内核修改风险即可实现深度系统洞察。从追踪系统调用到监控网络流量，eBPF 为下一代可观测性工具提供了基础。掌握这些概念以构建高效、生产就绪的监控解决方案，随基础设施扩展。
