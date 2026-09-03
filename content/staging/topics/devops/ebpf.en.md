---
title: eBPF Observability Deep Dive
description: Master eBPF for modern observability - from kernel tracing to production monitoring with tools like bpftrace, BCC, and Cilium
track: devops
section: observability
difficulty: advanced
tags:
  - eBPF
  - Observability
  - Linux
  - Kernel
  - Tracing
  - Monitoring
  - Performance
status: imported
origin: old/src/content/docs/devops/ebpf.en.md
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

eBPF (extended Berkeley Packet Filter) is a revolutionary technology that allows running sandboxed programs in the Linux kernel without changing kernel source code or loading kernel modules. Originally designed for packet filtering, eBPF has evolved into a powerful platform for observability, security, and networking. It enables unprecedented visibility into system behavior with minimal performance overhead.

## Concept Explanation

### What is eBPF?

**eBPF** is a virtual machine running inside the Linux kernel that executes user-defined programs in response to kernel events. These programs are verified for safety before execution and run in a sandboxed environment, ensuring they cannot crash the kernel or compromise system security.

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Space                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  bpftrace   │  │     BCC     │  │   Cilium    │   Tools     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    System Calls                                  │
├─────────────────────────────────────────────────────────────────┤
│                       Kernel Space                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    eBPF Verifier                         │   │
│  │  - Safety checks    - Bounds checking                    │   │
│  │  - No infinite loops  - Memory access validation         │   │
│  └───────────────────────────┬─────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼─────────────────────────────┐   │
│  │                    eBPF Virtual Machine                  │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │ Program │  │ Program │  │ Program │  │ Program │    │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │   │
│  └───────┼────────────┼────────────┼────────────┼──────────┘   │
│          │            │            │            │               │
│  ┌───────▼────┐ ┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐         │
│  │  kprobes   │ │ tracepoints│ │  XDP    │ │  cgroups │  Hooks │
│  └────────────┘ └───────────┘ └─────────┘ └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Why eBPF for Observability?

Traditional observability approaches have limitations:

| Approach | Limitations |
|----------|-------------|
| Logging | High overhead, limited scope, requires code changes |
| APM Agents | Language-specific, significant overhead |
| /proc filesystem | Limited metrics, polling-based |
| Kernel modules | Dangerous, hard to maintain |
| SystemTap | Requires debug symbols, complex setup |

eBPF advantages:
- **Zero instrumentation**: No code changes required
- **Low overhead**: JIT-compiled, runs at kernel speed
- **Safe**: Verified before execution, cannot crash kernel
- **Comprehensive**: Access to all kernel events
- **Dynamic**: Load/unload programs at runtime

### eBPF Architecture Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    eBPF Program Lifecycle                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. WRITE          2. COMPILE         3. LOAD                   │
│  ┌──────────┐     ┌──────────┐      ┌──────────┐               │
│  │ C/Rust   │────▶│  LLVM    │─────▶│  Verifier│               │
│  │ Source   │     │ Compiler │      │  Check   │               │
│  └──────────┘     └──────────┘      └────┬─────┘               │
│                                          │                       │
│  6. READ           5. EXECUTE        4. ATTACH                  │
│  ┌──────────┐     ┌──────────┐      ┌────▼─────┐               │
│  │  Maps    │◀────│  eBPF    │◀─────│  Hook    │               │
│  │  Output  │     │  Runtime │      │  Point   │               │
│  └──────────┘     └──────────┘      └──────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Hook Points for Observability

| Hook Type | Description | Use Cases |
|-----------|-------------|-----------|
| **kprobes** | Dynamic kernel function tracing | Function entry/exit, arguments |
| **uprobes** | User-space function tracing | Application function calls |
| **tracepoints** | Static kernel instrumentation | Scheduler, syscalls, networking |
| **perf events** | Hardware/software counters | CPU cycles, cache misses |
| **XDP** | Network packet processing | Fast packet filtering/routing |
| **tc** | Traffic control | Network QoS, tunneling |
| **cgroups** | Container resource control | Per-container metrics |
| **LSM** | Linux Security Modules | Security monitoring |

## Core Principles

### eBPF Maps

Maps are key-value data structures for sharing data between eBPF programs and user space:

```c
// Common map types for observability

// Hash map - general purpose key-value storage
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, u32);           // PID
    __type(value, u64);         // Timestamp or count
} process_map SEC(".maps");

// Per-CPU array - high-performance counters
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 256);
    __type(key, u32);
    __type(value, u64);
} counters SEC(".maps");

// Ring buffer - efficient event streaming
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);  // 256 KB
} events SEC(".maps");

// Histogram for latency distribution
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 64);
    __type(key, u64);           // Bucket
    __type(value, u64);         // Count
} latency_hist SEC(".maps");
```

### eBPF Helper Functions

eBPF programs can call kernel helper functions:

```c
// Time and identification
u64 ts = bpf_ktime_get_ns();              // Nanosecond timestamp
u64 pid_tgid = bpf_get_current_pid_tgid(); // Get PID and TGID
u32 pid = pid_tgid >> 32;
u32 tid = pid_tgid;
u32 uid = bpf_get_current_uid_gid();       // Get UID

// Process information
struct task_struct *task = (struct task_struct *)bpf_get_current_task();
char comm[16];
bpf_get_current_comm(&comm, sizeof(comm)); // Get process name

// Map operations
void *value = bpf_map_lookup_elem(&my_map, &key);
bpf_map_update_elem(&my_map, &key, &value, BPF_ANY);
bpf_map_delete_elem(&my_map, &key);

// Memory access
bpf_probe_read_kernel(&dest, sizeof(dest), src);     // Kernel memory
bpf_probe_read_user(&dest, sizeof(dest), user_ptr); // User memory

// Ring buffer output
void *data = bpf_ringbuf_reserve(&events, sizeof(struct event), 0);
if (data) {
    // Fill data...
    bpf_ringbuf_submit(data, 0);
}
```

## Key Concepts

### 1. Tracing with kprobes

```c
// Trace file open syscalls
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

    // Read filename from user space
    const char *filename = (const char *)PT_REGS_PARM2(ctx);
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename), filename);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

### 2. Tracing with Tracepoints

```c
// Using static tracepoints (more stable than kprobes)
#include <linux/bpf.h>
#include <bpf/bpf_helpers.h>

// Tracepoint format from /sys/kernel/debug/tracing/events/
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

    // Count syscalls per PID
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

### 3. User-Space Tracing with uprobes

```c
// Trace user-space function calls
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

    // Store allocation address for tracking
    bpf_map_update_elem(&alloc_map, &pid, &ret, BPF_ANY);
    return 0;
}
```

### 4. Performance Monitoring with perf_events

```c
// CPU profiling with stack traces
struct {
    __uint(type, BPF_MAP_TYPE_STACK_TRACE);
    __uint(max_entries, 10000);
    __type(key, u32);
    __type(value, u64[127]);  // Max stack depth
} stacks SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10000);
    __type(key, struct stack_key);
    __type(value, u64);
} counts SEC(".maps");

SEC("perf_event")
int profile(struct bpf_perf_event_data *ctx)
{
    u64 id = bpf_get_current_pid_tgid();
    u32 pid = id >> 32;

    if (pid == 0)  // Skip kernel threads
        return 0;

    struct stack_key key = {
        .pid = pid,
        .kernel_stack_id = bpf_get_stackid(ctx, &stacks, 0),
        .user_stack_id = bpf_get_stackid(ctx, &stacks, BPF_F_USER_STACK),
    };

    u64 *count = bpf_map_lookup_elem(&counts, &key);
    if (count) {
        __sync_fetch_and_add(count, 1);
    } else {
        u64 init = 1;
        bpf_map_update_elem(&counts, &key, &init, BPF_ANY);
    }

    return 0;
}
```

## Code Examples

### Complete bpftrace Examples

bpftrace is a high-level tracing language for eBPF:

```bash
#!/usr/bin/env bpftrace

# Count syscalls by process
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

# Latency histogram for read() syscalls
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

# Track file opens by process
# bpftrace file_opens.bt
tracepoint:syscalls:sys_enter_openat
{
    printf("%s (pid=%d) opened: %s\n",
           comm, pid, str(args->filename));
}

---

# CPU off-cpu time analysis
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

# Memory allocation tracking
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

# Network packet tracing
# bpftrace tcp_connect.bt
kprobe:tcp_v4_connect
{
    $sk = (struct sock *)arg0;
    $daddr = ntop($sk->__sk_common.skc_daddr);
    $dport = $sk->__sk_common.skc_dport;

    printf("%s connecting to %s:%d\n", comm, $daddr, $dport);
}

kretprobe:tcp_v4_connect
/retval == 0/
{
    @connects[comm] = count();
}
```

### BCC Python Tools

BCC (BPF Compiler Collection) for production monitoring:

```python
#!/usr/bin/env python3
# Trace process execution with arguments

from bcc import BPF
from time import strftime

# eBPF program
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

# Load BPF program
b = BPF(text=program)
b.attach_kprobe(event=b.get_syscall_fnname("execve"), fn_name="syscall__execve")

# Print header
print("%-9s %-6s %-6s %-6s %-16s %s" % (
    "TIME", "PID", "PPID", "UID", "COMM", "FILENAME"))

# Process events
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
# TCP connection latency monitoring

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
    // Check if this is TCP_ESTABLISHED state
    if (sk->__sk_common.skc_state != TCP_ESTABLISHED)
        return 0;

    struct info_t *infop = start.lookup(&sk);
    if (!infop)
        return 0;

    u64 delta = bpf_ktime_get_ns() - infop->ts;

    struct ipv4_data_t data = {};
    data.ts = infop->ts;
    data.pid = infop->pid;
    data.delta = delta / 1000;  // Convert to microseconds
    data.saddr = sk->__sk_common.skc_rcv_saddr;
    data.daddr = sk->__sk_common.skc_daddr;
    data.dport = sk->__sk_common.skc_dport;
    bpf_probe_read_kernel(&data.comm, sizeof(data.comm), infop->comm);

    ipv4_events.perf_submit(ctx, &data, sizeof(data));
    start.delete(&sk);

    return 0;
}
"""

# Load and attach
b = BPF(text=program)
b.attach_kprobe(event="tcp_v4_connect", fn_name="trace_connect")
b.attach_kprobe(event="tcp_rcv_state_process", fn_name="trace_tcp_rcv_state_process")

# Print header
print("%-9s %-6s %-15s %-15s %-5s %-10s %s" % (
    "TIME", "PID", "SADDR", "DADDR", "PORT", "LAT(us)", "COMM"))

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

### libbpf-based C Program

```c
// Modern libbpf-based approach (CO-RE)
// opensnoop.bpf.c

#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>

struct event {
    u32 pid;
    u32 uid;
    int ret;
    char comm[TASK_COMM_LEN];
    char fname[NAME_MAX];
};

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 10240);
    __type(key, u32);
    __type(value, const char *);
} start SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

SEC("tracepoint/syscalls/sys_enter_openat")
int tracepoint__syscalls__sys_enter_openat(struct trace_event_raw_sys_enter *ctx)
{
    u64 id = bpf_get_current_pid_tgid();
    u32 tid = (u32)id;

    const char *fname = (const char *)ctx->args[1];
    bpf_map_update_elem(&start, &tid, &fname, BPF_ANY);

    return 0;
}

SEC("tracepoint/syscalls/sys_exit_openat")
int tracepoint__syscalls__sys_exit_openat(struct trace_event_raw_sys_exit *ctx)
{
    u64 id = bpf_get_current_pid_tgid();
    u32 pid = id >> 32;
    u32 tid = (u32)id;

    const char **fnamep = bpf_map_lookup_elem(&start, &tid);
    if (!fnamep)
        return 0;

    struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) {
        bpf_map_delete_elem(&start, &tid);
        return 0;
    }

    e->pid = pid;
    e->uid = bpf_get_current_uid_gid();
    e->ret = ctx->ret;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    bpf_probe_read_user_str(&e->fname, sizeof(e->fname), *fnamep);

    bpf_ringbuf_submit(e, 0);
    bpf_map_delete_elem(&start, &tid);

    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

```c
// User-space loader (opensnoop.c)
#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include <bpf/libbpf.h>
#include "opensnoop.skel.h"

static volatile bool exiting = false;

static void sig_handler(int sig)
{
    exiting = true;
}

static int handle_event(void *ctx, void *data, size_t data_sz)
{
    const struct event *e = data;

    printf("%-6d %-6d %-4d %-16s %s\n",
           e->pid, e->uid, e->ret, e->comm, e->fname);

    return 0;
}

int main(int argc, char **argv)
{
    struct opensnoop_bpf *skel;
    struct ring_buffer *rb = NULL;
    int err;

    signal(SIGINT, sig_handler);
    signal(SIGTERM, sig_handler);

    // Open and load BPF program
    skel = opensnoop_bpf__open_and_load();
    if (!skel) {
        fprintf(stderr, "Failed to open BPF program\n");
        return 1;
    }

    // Attach BPF program
    err = opensnoop_bpf__attach(skel);
    if (err) {
        fprintf(stderr, "Failed to attach BPF program\n");
        goto cleanup;
    }

    // Set up ring buffer
    rb = ring_buffer__new(bpf_map__fd(skel->maps.events), handle_event, NULL, NULL);
    if (!rb) {
        fprintf(stderr, "Failed to create ring buffer\n");
        err = -1;
        goto cleanup;
    }

    printf("%-6s %-6s %-4s %-16s %s\n", "PID", "UID", "RET", "COMM", "FNAME");

    // Poll for events
    while (!exiting) {
        err = ring_buffer__poll(rb, 100);
        if (err == -EINTR) {
            err = 0;
            break;
        }
        if (err < 0) {
            fprintf(stderr, "Error polling ring buffer: %d\n", err);
            break;
        }
    }

cleanup:
    ring_buffer__free(rb);
    opensnoop_bpf__destroy(skel);

    return err < 0 ? 1 : 0;
}
```

## Best Practices

### 1. Efficient Map Usage

```c
// Use per-CPU maps for high-frequency counters
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

// Use ring buffer instead of perf buffer for better performance
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

// Prefer lookup over delete+insert
u64 *value = bpf_map_lookup_elem(&map, &key);
if (value) {
    *value = new_value;  // Update in place
} else {
    bpf_map_update_elem(&map, &key, &new_value, BPF_NOEXIST);
}
```

### 2. Safe Memory Access

```c
// Always check return values
void *value = bpf_map_lookup_elem(&map, &key);
if (!value)
    return 0;  // Handle missing entry

// Use bounded reads
char buf[256];
int ret = bpf_probe_read_user_str(buf, sizeof(buf), user_ptr);
if (ret < 0)
    return 0;  // Handle error

// CO-RE safe struct access
struct task_struct *task = (struct task_struct *)bpf_get_current_task();
u32 ppid = BPF_CORE_READ(task, real_parent, tgid);
```

### 3. Filtering for Performance

```c
// Filter early to reduce overhead
SEC("tracepoint/syscalls/sys_enter_read")
int trace_read(struct trace_event_raw_sys_enter *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // Filter by PID if specified
    #ifdef FILTER_PID
    if (pid != FILTER_PID)
        return 0;
    #endif

    // Filter by minimum size
    size_t count = ctx->args[2];
    if (count < MIN_SIZE)
        return 0;

    // Process event...
    return 0;
}

// Use map for dynamic filtering
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

    // Only trace PIDs in filter map
    if (!bpf_map_lookup_elem(&filter_pids, &pid))
        return 0;

    // Process event...
    return 0;
}
```

### 4. Sampling for High-Volume Events

```c
// Sample 1 in N events
#define SAMPLE_RATE 100

SEC("tracepoint/net/netif_receive_skb")
int sample_packets(struct trace_event_raw_net_dev_template *ctx)
{
    u32 key = 0;
    u64 *count = bpf_map_lookup_elem(&packet_count, &key);
    if (!count)
        return 0;

    u64 c = __sync_fetch_and_add(count, 1);
    if (c % SAMPLE_RATE != 0)
        return 0;  // Skip this event

    // Process sampled event...
    return 0;
}
```

## Common Pitfalls

### 1. Verifier Errors

```c
// BAD: Unbounded loop
for (int i = 0; ; i++) {  // Verifier rejects
    // ...
}

// GOOD: Bounded loop
#pragma unroll
for (int i = 0; i < 10; i++) {
    // ...
}

// BAD: Uninitialized stack variable
char buf[256];  // May contain garbage
bpf_probe_read_kernel(buf, 256, src);

// GOOD: Zero-initialize
char buf[256] = {};
bpf_probe_read_kernel(buf, 256, src);

// BAD: Out-of-bounds access
char *ptr = value;
char c = ptr[1000];  // Verifier rejects

// GOOD: Bounds check
if (offset < sizeof(buffer)) {
    char c = buffer[offset];
}
```

### 2. Map Access Issues

```c
// BAD: Not checking lookup result
u64 *value = bpf_map_lookup_elem(&map, &key);
*value = 42;  // Crash if key doesn't exist

// GOOD: Always check
u64 *value = bpf_map_lookup_elem(&map, &key);
if (value)
    *value = 42;

// BAD: Mixing BPF_NOEXIST with existing key
bpf_map_update_elem(&map, &key, &val, BPF_NOEXIST);  // Fails if exists

// GOOD: Use appropriate flags
bpf_map_update_elem(&map, &key, &val, BPF_ANY);  // Always works
```

### 3. Stack Size Limits

```c
// BAD: Large stack allocation (eBPF stack is 512 bytes)
SEC("kprobe/foo")
int bad_probe(struct pt_regs *ctx)
{
    char buf[1024];  // Too large!
    // ...
}

// GOOD: Use map for large data
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
    // Use buf...
}
```

## Performance Considerations

### Overhead Analysis

| Hook Type | Typical Overhead | Use Case |
|-----------|------------------|----------|
| XDP | < 100 ns | Packet processing |
| tc | 100-500 ns | Traffic control |
| kprobes | 50-200 ns | Kernel function tracing |
| tracepoints | 20-100 ns | Static kernel events |
| uprobes | 500-2000 ns | User-space tracing |
| perf events | 100-500 ns | Profiling |

### Optimization Strategies

```c
// 1. Use tail calls for complex logic
struct {
    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);
    __uint(max_entries, 8);
    __type(key, u32);
    __type(value, u32);
} prog_array SEC(".maps");

SEC("xdp")
int main_prog(struct xdp_md *ctx)
{
    // Quick classification
    u32 key = classify(ctx);
    bpf_tail_call(ctx, &prog_array, key);
    return XDP_PASS;
}

// 2. Batch map operations from user space
LIBBPF_OPTS(bpf_map_batch_opts, opts,
    .elem_flags = 0,
    .flags = 0,
);

bpf_map_lookup_batch(map_fd, NULL, &next_key,
                     keys, values, &count, &opts);

// 3. Use BPF_MAP_TYPE_LRU_HASH for automatic cleanup
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __uint(max_entries, 10000);
    __type(key, struct flow_key);
    __type(value, struct flow_stats);
} flow_table SEC(".maps");
```

## Real-World Scenarios

### Scenario 1: Kubernetes Pod Network Monitoring

```python
#!/usr/bin/env python3
# Monitor network connections per Kubernetes pod

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
    """Get Kubernetes pod name from PID via cgroup"""
    try:
        with open(f"/proc/{pid}/cgroup") as f:
            for line in f:
                if "kubepods" in line:
                    # Extract pod UID from cgroup path
                    parts = line.split("/")
                    for part in parts:
                        if part.startswith("pod"):
                            return part
    except:
        pass
    return None

# Load and run...
```

### Scenario 2: Application Performance Profiling

```python
#!/usr/bin/env python3
# Profile application with flame graph output

from bcc import BPF
import json

program = """
#include <uapi/linux/ptrace.h>

struct key_t {
    u32 pid;
    int user_stack_id;
    int kernel_stack_id;
};

BPF_HASH(counts, struct key_t, u64);
BPF_STACK_TRACE(stack_traces, 16384);

int do_perf_event(struct bpf_perf_event_data *ctx)
{
    u32 pid = bpf_get_current_pid_tgid() >> 32;

    // Filter by target PID
    if (FILTER_PID && pid != FILTER_PID)
        return 0;

    struct key_t key = {};
    key.pid = pid;
    key.user_stack_id = bpf_get_stackid(&ctx->regs, &stack_traces, BPF_F_USER_STACK);
    key.kernel_stack_id = bpf_get_stackid(&ctx->regs, &stack_traces, 0);

    u64 *count = counts.lookup_or_init(&key, &(u64){0});
    (*count)++;

    return 0;
}
"""

def generate_flamegraph(stacks, counts):
    """Generate folded stack format for flamegraph.pl"""
    output = []
    for key, count in counts.items():
        user_stack = stacks.walk(key.user_stack_id)
        kernel_stack = stacks.walk(key.kernel_stack_id)

        frames = []
        for addr in kernel_stack:
            frames.append(b.ksym(addr).decode())
        frames.append("--")
        for addr in user_stack:
            frames.append(b.sym(addr, key.pid).decode())

        output.append(f"{';'.join(frames)} {count}")

    return "\n".join(output)
```

### Scenario 3: Security Monitoring

```python
#!/usr/bin/env python3
# Detect suspicious process behavior

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

// Track execve calls
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

// Track sensitive file access
TRACEPOINT_PROBE(syscalls, sys_enter_openat)
{
    char filename[256];
    bpf_probe_read_user_str(&filename, sizeof(filename), args->filename);

    // Check for sensitive files
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

// Detect privilege escalation (setuid)
TRACEPOINT_PROBE(syscalls, sys_enter_setuid)
{
    u32 uid = bpf_get_current_uid_gid();
    u32 target_uid = args->uid;

    // Non-root trying to become root
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
    1: "EXEC",
    2: "SENSITIVE_FILE",
    3: "PRIV_ESCALATION"
}

def process_event(cpu, data, size):
    event = b["events"].event(data)
    timestamp = datetime.fromtimestamp(event.timestamp / 1e9).isoformat()

    alert = {
        "timestamp": timestamp,
        "event_type": EVENT_TYPES.get(event.event_type, "UNKNOWN"),
        "pid": event.pid,
        "uid": event.uid,
        "comm": event.comm.decode(),
        "filename": event.filename.decode() if event.filename else ""
    }

    print(json.dumps(alert))

b = BPF(text=program)
b["events"].open_perf_buffer(process_event)

while True:
    b.perf_buffer_poll()
```

## Interview Key Points

### Conceptual Questions

**Q: What is eBPF and why is it revolutionary for observability?**
> eBPF allows running sandboxed programs in the Linux kernel without modifying kernel source or loading modules. It's revolutionary because it provides kernel-level visibility with user-space safety, enabling deep observability with minimal overhead. Programs are verified before execution, ensuring they can't crash the kernel.

**Q: Explain the difference between kprobes, tracepoints, and uprobes.**
> - **kprobes**: Dynamic probes on any kernel function, flexible but can break with kernel updates
> - **tracepoints**: Static, stable probe points defined by kernel developers, more stable API
> - **uprobes**: Dynamic probes on user-space applications, higher overhead but allows application tracing without code changes

**Q: How do eBPF maps work and when would you use different types?**
> Maps are key-value stores shared between eBPF programs and user space. Hash maps for general lookups, arrays for indexed access, ring buffers for streaming events, per-CPU maps for high-frequency counters without lock contention, LRU maps for bounded caches with automatic eviction.

### Implementation Questions

**Q: How do you handle the 512-byte stack limit in eBPF?**
```c
// Use per-CPU array as scratch space
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, u32);
    __type(value, struct large_buffer);  // Can be much larger
} scratch SEC(".maps");
```

**Q: How do you trace function return values in eBPF?**
```c
// Use kretprobe or fentry/fexit
SEC("kretprobe/sys_read")
int trace_read_return(struct pt_regs *ctx)
{
    long ret = PT_REGS_RC(ctx);
    // Process return value
    return 0;
}

// Or with fentry/fexit (faster, BTF-based)
SEC("fexit/sys_read")
int BPF_PROG(trace_read_exit, int fd, void *buf, size_t count, long ret)
{
    // ret is the return value
    return 0;
}
```

### Quick Reference Card

```
eBPF Key Concepts:
├── Hook Points: kprobes, uprobes, tracepoints, XDP, tc
├── Maps: Hash, Array, RingBuf, PerCPU, LRU
├── Helpers: bpf_map_*, bpf_probe_read_*, bpf_get_current_*
└── Verifier: Safety checks, bounded loops, memory access

Performance Tips:
├── Use per-CPU maps for counters
├── Filter early in the program
├── Use ring buffers over perf buffers
├── Sample high-frequency events
└── Batch user-space reads

Common Tools:
├── bpftrace: High-level tracing language
├── BCC: Python/Lua bindings
├── libbpf: C library for CO-RE
├── bpftool: CLI for BPF management
└── Cilium: Kubernetes networking
```

## Further Reading

### Official Documentation

- [eBPF Official Site](https://ebpf.io/) - Community resources and documentation
- [Linux Kernel BPF Documentation](https://www.kernel.org/doc/html/latest/bpf/) - Kernel documentation
- [libbpf Documentation](https://libbpf.readthedocs.io/) - libbpf API reference

### Books and Articles

- **"BPF Performance Tools"** by Brendan Gregg - Comprehensive guide
- **"Learning eBPF"** by Liz Rice - Practical introduction
- **"Linux Observability with BPF"** by David Calavera - Deep dive

### Tools and Projects

| Tool | Purpose | URL |
|------|---------|-----|
| bpftrace | High-level tracing | github.com/iovisor/bpftrace |
| BCC | Python/Lua tooling | github.com/iovisor/bcc |
| libbpf | CO-RE C library | github.com/libbpf/libbpf |
| Cilium | K8s networking | cilium.io |
| Falco | Security monitoring | falco.org |
| Pixie | K8s observability | px.dev |
| Tetragon | Security observability | github.com/cilium/tetragon |

### Related Topics

- **Linux Performance Analysis** - Understanding system performance
- **Container Networking** - CNI plugins and eBPF
- **Kubernetes Observability** - Monitoring K8s with eBPF
- **Security Monitoring** - Runtime security with eBPF
- **Flame Graphs** - Visualization of CPU profiles

---

eBPF represents a paradigm shift in Linux observability, enabling deep system insights without the risks of kernel modification. From tracing system calls to monitoring network traffic, eBPF provides the foundation for next-generation observability tools. Master these concepts to build efficient, production-ready monitoring solutions that scale with your infrastructure.
