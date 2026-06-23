# Chapter 12 — I/O, Files & the Unix Philosophy

> [← 11 Threads & Synchronization](11_Threads_Synchronization.md) | [Course Index](README.md)

---

## Everything Is a File

Unix made one radical design choice in 1969: give every I/O resource the same interface — open, read, write, close.

Files on disk? File descriptors. Terminal keyboard input? File descriptor (fd 0). Network sockets? File descriptors. Pipes between processes? File descriptors. Devices (`/dev/random`, `/dev/null`, `/dev/sda`)? File descriptors. Kernel state (`/proc/1234/maps`)? File descriptors.

This uniformity means:
- One program that reads from stdin can be piped into any source.
- One program that writes to stdout can be piped into any sink.
- Tools compose without knowing about each other.

This is the **Unix Philosophy**: small, focused programs connected by text streams.

---

## The File Descriptor Table

Each process maintains a **file descriptor table** — an array indexed by fd number:

```
Process file descriptor table:
  fd 0 → struct file { → inode of /dev/pts/0 (terminal) }
  fd 1 → struct file { → inode of /dev/pts/0 (same terminal!) }
  fd 2 → struct file { → inode of /dev/pts/0 }
  fd 3 → struct file { → inode of /home/user/data.txt, pos=0 }
  fd 4 → struct file { → socket: TCP conn to 93.184.216.34:80 }
  ...
```

Each `struct file` in the kernel tracks:
- Which inode (actual file on disk) it refers to
- Current file **position** (offset for next read/write)
- Flags (read-only, write-only, read-write, non-blocking, etc.)

After `fork()`, parent and child **share the same struct file**, so they share the file position. Writing from either advances the shared offset. This is intentional — it's how shell piping works.

After `dup2(fd, 1)`, both the original fd and fd 1 point to the same `struct file` → share position and flags.

---

## The Kernel's File Stack

When you call `read(fd, buf, n)`, the kernel traverses a stack of layers:

```
System call: read(fd, buf, n)
       ↓
File descriptor table: fd → struct file
       ↓
VFS (Virtual File System) layer: unified interface for all filesystems
       ↓
Filesystem-specific layer (ext4, NTFS, tmpfs, procfs, sockfs...)
       ↓
Page cache: check if file data is already in RAM
       ↓ (if miss)
Block device layer: issue I/O request to disk driver
       ↓
Disk (SSD, HDD)
```

**The page cache** is critical: every file page read from disk is cached in RAM (same pages used for virtual memory). Reading the same file twice is fast — second read hits the cache. The OS decides when to evict dirty pages to disk.

`fsync(fd)` forces dirty pages for fd to be written to disk immediately (not just to the cache). Critical for databases that need crash-safety.

---

## Buffered vs Unbuffered I/O

**Unbuffered (syscall-level):** Every `read()`/`write()` is a system call.

```c
// Unbuffered: one syscall per byte — 1,000,000 syscalls for 1 MB
char c;
while (read(fd, &c, 1) == 1) process(c);
```

**Buffered (stdio / java.io):** Library accumulates data in a buffer; issues large syscalls.

```c
// C stdio: buffered
FILE* f = fopen("file.txt", "r");
char c;
while ((c = fgetc(f)) != EOF) process(c);
// fgetc reads 8 KB at a time via one read() syscall,
// then serves individual chars from an in-process buffer.
// 1 MB file → ~128 syscalls instead of 1,000,000.
```

```java
// Java: BufferedReader wraps FileReader (which wraps FileInputStream)
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) process(line);
}
// Default buffer: 8 KB. readLine() scans buffer; issues new read() when exhausted.
```

**When to use unbuffered:**
- When you need guaranteed ordering with other I/O (logging to syslog)
- Network sockets where you want to send data immediately (`TCP_NODELAY`)
- Memory-mapped files (where the OS handles buffering at the page cache level)

---

## Filesystem Structure

A filesystem maps filenames to data. The core structure:

```
Disk layout (simplified ext4):
┌──────────┬──────────────┬──────────────────────────────┬──────────────┐
│ Superblock│ Inode table  │     Block groups...          │  Data blocks │
│ (FS meta) │ (file meta)  │                              │  (file data) │
└──────────┴──────────────┴──────────────────────────────┴──────────────┘
```

**Inode:** Metadata record for one file.
```
Inode 1234:
  size:       4096 bytes
  owner:      uid 1000
  permissions: rw-r--r--
  timestamps: created, modified, accessed
  data blocks: [block 5000, block 5001]   ← where the file's bytes are stored
```

**Directory:** A special file containing (name → inode number) mappings.
```
Directory /home/user/:
  "." → inode 100 (this directory)
  ".." → inode 50  (parent directory)
  "data.txt" → inode 1234
  "src" → inode 2000 (a subdirectory)
```

**Hard link:** Two directory entries pointing to the SAME inode. Both `file.txt` and `backup.txt` can refer to inode 1234 — same data, two names. File is deleted only when ALL hard links are removed (inode's link count reaches 0).

**Soft link (symlink):** A file that contains a path string. Following it re-evaluates the path. Can point to non-existent targets ("dangling symlink").

---

## File Permissions (Unix)

```
ls -la data.txt
-rw-r--r-- 1 alice staff 4096 Jun 23 10:00 data.txt

  │││││││││
  │││││││└┘── world: r-- (others can read, not write/execute)
  │││││└┘──── group: r-- (staff group can read)
  ││└┘──────── user:  rw- (alice can read+write)
  │└─────────── file type: - (regular file), d (dir), l (link)
```

Permission bits are 3 groups × 3 bits = 9 bits:
```
r = 4, w = 2, x = 1
rw-r--r-- = 644
rwxr-xr-x = 755
rwx------ = 700
```

`chmod 644 file.txt` sets permissions.
`chown alice:staff file.txt` sets owner and group.

**Execute bit for directories:** `x` on a directory means "can traverse" — needed to `cd` into it or access any file inside. `r` on a directory means "can list contents" (run `ls`).

---

## The Unix Philosophy in Practice

**The Unix Philosophy (Doug McIlroy, 1978):**
1. Write programs that do one thing and do it well.
2. Write programs to work together.
3. Write programs that handle text streams, because that is a universal interface.

```bash
# Count the 10 most common words in a file (5 separate programs composing):
cat file.txt | tr -s '[:space:]' '\n' | sort | uniq -c | sort -rn | head -10

# Each program does one thing:
#   cat:   print file to stdout
#   tr:    translate spaces to newlines (one word per line)
#   sort:  sort lines alphabetically
#   uniq:  count duplicate adjacent lines
#   sort:  sort by count (reverse, numeric)
#   head:  take first 10 lines
```

This composition works because each program reads from stdin, writes to stdout, and doesn't care what came before or after it. The kernel connects them with pipes (in-memory byte streams).

**Why this still matters (2020s):**
- Container systems (Docker) = each container runs one focused process.
- Microservices = each service does one thing; they communicate via network "pipes" (HTTP/gRPC).
- Unix pipes are now distributed message queues (Kafka), but the philosophy is identical.
- The `|` operator in shells inspired the `|>` pipeline operator in Elixir, F#, and Haskell.

---

## Non-Blocking I/O and epoll

Blocking I/O: `read(fd, buf, n)` blocks until data is available. Thread is suspended.

Non-blocking I/O: `read(fd, buf, n)` returns immediately even if no data is ready:
```c
fcntl(fd, F_SETFL, O_NONBLOCK);
int n = read(fd, buf, sizeof(buf));
if (n == -1 && errno == EAGAIN) {
    // No data available right now. Try later.
} else if (n > 0) {
    process(buf, n);
}
```

With 1000 sockets, you don't want to spin-check each one. **epoll** (Linux) efficiently waits on many fds simultaneously:

```c
int epfd = epoll_create1(0);

// Register interest: tell epoll to watch fd for readable events
struct epoll_event ev = { .events = EPOLLIN, .data.fd = sockfd };
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);

// Event loop:
struct epoll_event events[64];
while (1) {
    int nready = epoll_wait(epfd, events, 64, -1);  // block until something is ready
    for (int i = 0; i < nready; i++) {
        handle_event(events[i].data.fd);   // process only ready fds
    }
}
```

`epoll_wait` returns ONLY the file descriptors that have data ready — no polling needed. O(1) per event regardless of how many fds are registered.

**Edge-triggered vs level-triggered:**
- Level-triggered (default): epoll reports a fd as ready as long as data remains unread.
- Edge-triggered (`EPOLLET`): epoll reports only when NEW data arrives. Must read ALL available data in one go, or the event is lost. More efficient but trickier.

---

## io_uring: Modern Linux Async I/O

`epoll` is notification-based: it tells you when an fd is ready, then you make syscalls. Each operation is still a syscall.

`io_uring` (Linux 5.1+) is a true async I/O interface:
- Submit a batch of I/O operations to a ring buffer (shared memory — no syscall!).
- Kernel processes them asynchronously (potentially in kernel threads).
- Completion events arrive in another ring buffer — process without syscalls.

**Performance:** For high-IOPS workloads (databases, storage engines), io_uring can reduce syscall overhead by 30-60% vs epoll. PostgreSQL, RocksDB, and Ceph now use io_uring.

---

## Section Challenge

> ### Unix Pipeline and File Descriptor Tracing
>
> **Scenario:**
> A shell executes: `cat log.txt | grep "ERROR" | wc -l`
>
> This creates three processes connected by two pipes.
>
> **Q1:** Draw the file descriptor layout for all three processes after the shell sets up the pipeline. Which fds are connected by pipes? Which fds point to the terminal?
>
> **Q2:** The shell creates the pipes BEFORE forking. Why must `pipe()` be called before `fork()`, not after?
>
> **Q3:** After setting up the pipeline, the shell closes the write end of the second pipe in the `grep` process and the read end of the first pipe in the `wc` process. Why must these unused ends be explicitly closed?
>
> **Q4:** `grep` exits after finding no ERROR lines. What does `wc -l` read from its stdin (the read end of pipe 2)? What value does it print?
>
> **Q5 (Stretch):** Redesign the same pipeline to use a single process and `epoll` instead of three processes and pipes. Describe the structure of the event loop and what callback each fd triggers. What are the trade-offs compared to the fork/exec/pipe approach?

<details>
<summary>Full answers</summary>

```
Q1: File descriptor layout

Pipe 1: [read_end = p1[0], write_end = p1[1]]   (cat stdout → grep stdin)
Pipe 2: [read_end = p2[0], write_end = p2[1]]   (grep stdout → wc stdin)

After shell sets up pipeline:

  Process cat:
    fd 0 → terminal stdin     (cat reads no stdin from pipe, gets it from terminal)
    fd 1 → p1[1] (write end of pipe 1)   ← redirected
    fd 2 → terminal stderr

  Process grep:
    fd 0 → p1[0] (read end of pipe 1)    ← redirected
    fd 1 → p2[1] (write end of pipe 2)   ← redirected
    fd 2 → terminal stderr

  Process wc:
    fd 0 → p2[0] (read end of pipe 2)    ← redirected
    fd 1 → terminal stdout               (wc's output goes to terminal)
    fd 2 → terminal stderr

──────────────────────────────────────────────────────

Q2: Why pipe() before fork()

pipe() creates a pair of connected fds in the CURRENT process.
fork() copies all fds to the child.

After fork():
  Parent's p1[0] and child's p1[0] refer to the SAME pipe read end.
  Parent's p1[1] and child's p1[1] refer to the SAME pipe write end.

If you called pipe() AFTER fork(), each process would get its OWN, independent
pipe — they would not be connected. The whole point is that parent and child
share the same pipe endpoints so data flows between them.

──────────────────────────────────────────────────────

Q3: Why close unused pipe ends

Each pipe has a "writer count" — the number of open write ends.
  When write count drops to 0: reads from the read end return EOF.

If grep keeps p2[1] (write end of pipe 2) open even when it doesn't use it:
  wc is reading from p2[0].
  Even if grep writes nothing to p2[1], the write end is still open.
  wc's read(p2[0], ...) will BLOCK FOREVER — the pipe is not closed
  because p2[1] is still open somewhere (in grep).
  wc hangs, pipeline hangs.

Similarly, if wc keeps p1[0] (read end of pipe 1) open:
  cat writes to p1[1].
  The read end (p1[0]) is still open in wc.
  When cat finishes and closes p1[1], p1[0] is still open in wc.
  If cat's output fills the pipe buffer, cat's write() blocks (pipe is full).
  BUT: if wc never reads from p1[0], the pipe stays full, cat blocks.
  Deadlock.

Rule: In the child process, immediately close pipe ends it will not use.
  In cat:  close(p1[0]);               // cat doesn't read pipe 1
  In grep: close(p1[1]); close(p2[0]); // grep doesn't write pipe 1 or read pipe 2
  In wc:   close(p2[1]);               // wc doesn't write pipe 2
  In shell (parent): close all pipe ends after fork (it uses neither).

──────────────────────────────────────────────────────

Q4: grep exits with no matches — what wc sees

If grep finds no ERROR lines, it writes nothing to p2[1] and then exits.
When grep exits, its fd p2[1] is closed.
The write end of pipe 2 now has 0 open references.

wc is blocking on read(p2[0], ...).
When the write end closes, read() returns 0 (EOF).
wc sees EOF immediately — it's read 0 lines.
wc prints: 0

──────────────────────────────────────────────────────

Q5: Single-process epoll equivalent

Architecture:
  Open log.txt as fd_file (non-blocking).
  Connect a pair of in-memory buffers: buf1 (cat→grep equivalent),
  buf2 (grep→wc equivalent).
  
  But pure epoll on files is tricky: regular files are always "ready"
  (epoll doesn't work well with disk files — use io_uring for that).
  
  For this analysis, assume log.txt is a socket/pipe source (streaming data):

  epfd = epoll_create1(0);
  epoll_ctl(epfd, EPOLL_CTL_ADD, fd_file, EPOLLIN);   // watch log.txt

  Event loop:
    events = epoll_wait(epfd, ...);
    for each event:
      if event.fd == fd_file:
        data = read(fd_file, ...)
        // "cat" stage: pass data through
        for line in split_lines(data):
          // "grep" stage: filter
          if "ERROR" in line:
            error_count++
      if event.fd == EPOLLHUP on fd_file:  // EOF
        printf("%d\n", error_count);       // "wc -l" stage
        exit(0)

Trade-offs vs fork/exec/pipe:

  Single-process epoll ADVANTAGES:
    No process creation overhead (fork is cheap, exec is not)
    Lower memory usage (one address space)
    Shared state is trivial (no IPC needed)
    Lower latency for small data (no pipe buffer roundtrip)
    Works well when stages are I/O-bound (web server, proxy)

  Single-process epoll DISADVANTAGES:
    No isolation: a bug in any "stage" can corrupt the whole pipeline
    Can't use existing programs (grep, wc) as components
    Cannot parallelize across CPU cores without threads (one event loop = one core)
    Code is more complex: manual state machines instead of linear code flow
    Blocking operation in any callback blocks ALL stages

  Fork/exec/pipe ADVANTAGES:
    Isolation: crash in grep doesn't affect wc
    Composability: any program can be a stage without modification
    Simplicity: each program is written as simple sequential code
    Natural parallelism: OS schedules all three on different cores

  Best practice: the Unix pipe model is superior for correctness and composability.
  epoll/async is superior for high-connection-count servers where threads would
  be too expensive. The two are complementary, not competing.
```

</details>

---

## Common Mistakes

**Mistake 1: Forgetting to flush buffers before exit**
```c
fprintf(outfile, "result: %d\n", 42);
// exit() calls fclose() which flushes. But _exit() does NOT!
_exit(0);   // buffer NOT flushed → output lost!
```
Database crash recovery bugs often trace to "I called _exit() after writing but before fsync()."

**Mistake 2: Assuming `write()` writes everything requested**
```c
write(fd, buf, 1024);   // may return 512 (partial write)!
// Always check return value and loop:
size_t written = 0;
while (written < total) {
    ssize_t n = write(fd, buf + written, total - written);
    if (n < 0) { perror("write"); break; }
    written += n;
}
```

**Mistake 3: `cat file | grep X | head -1` leaves grep running**
- When `head -1` exits after finding 1 match, it closes its stdin (read end of the pipe). `grep` gets SIGPIPE on its next write → terminates. This is correct behavior, but if grep ignores SIGPIPE, it could run forever. Robust pipelines handle SIGPIPE.

**Mistake 4: Java's `PrintWriter` is not thread-safe**
- Multiple threads writing to a shared `PrintWriter` (or `System.out`) interleave output randomly. Use `synchronized(out)` blocks or use `java.util.logging` / SLF4J which provide thread-safe logging. `System.out.println` in Java IS synchronized, but `PrintWriter.print()` + `println()` as two calls is not atomic.

---

## Course Arc: The Full Systems Picture

You've now traced a complete path from physics to programs:

| Chapter | What We Derived |
|---------|----------------|
| 01 — Bits & Bytes | Binary from noise resistance; all data is bits |
| 02 — Two's Complement | Derived force-wrap identity n+(-n)=0 |
| 03 — IEEE 754 | Floating-point layout, why 0.1+0.2≠0.3 |
| 04 — Assembly | How C becomes machine instructions |
| 05 — Pipeline | Why CPUs are fast; Spectre/Meltdown |
| 06 — Cache | Why memory access patterns define performance |
| 07 — Linking | How separate files become one executable |
| 08 — Processes | The OS isolation boundary; fork/exec/signals |
| 09 — Virtual Memory | How every process gets its own address space |
| 10 — Heap | How malloc works; GC fundamentals |
| 11 — Threads | Shared memory concurrency; locks; atomics |
| 12 — I/O & Files | The Unix file abstraction; epoll; philosophy |

**Every abstraction you use as a programmer — functions, objects, threads, async/await, databases, containers — is built on the foundation covered in these 12 chapters.**

---

> [← 11 Threads & Synchronization](11_Threads_Synchronization.md) | [Course Index](README.md)
