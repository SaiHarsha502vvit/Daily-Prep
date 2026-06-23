# Chapter 08 — Processes & System Calls

> [← 07 Linking, Loading & the Build Process](07_Linking_Loading_Build_Process.md) | [Course Index](README.md) | [Next → 09 Virtual Memory](09_Virtual_Memory.md)

---

## The Problem: Running Multiple Programs Safely

Your computer runs Chrome, VS Code, Spotify, and a terminal — all simultaneously — on a CPU that can only execute one instruction at a time (per core). Each program thinks it owns the entire machine. If Chrome crashes, VS Code keeps running. Chrome can't read VS Code's memory, even though they're on the same hardware.

How?

The abstraction is the **process** — the OS's unit of isolation and scheduling. Understanding processes explains:
- Why your program can't access another program's memory (even with the right address)
- How `fork()` → `exec()` launches new programs
- What a system call actually is and why it's expensive
- Why `kill -9` always works but `kill -15` might not
- How Node.js / Python implement concurrency despite a single-threaded event loop

---

## What Is a Process?

A **process** is a running program. It has:

1. **Its own virtual address space** — the illusion that it owns all of memory (Ch09 explains how)
2. **CPU register state** — current PC (program counter), stack pointer, general registers
3. **File descriptor table** — open files, sockets, pipes
4. **Process ID (PID)** — unique integer assigned by the OS
5. **Process state** — running, ready, blocked, zombie

```
Process Control Block (PCB) — the OS's record for each process:
┌────────────────────────────────────┐
│  PID: 1234                         │
│  State: RUNNING                    │
│  Parent PID: 1000                  │
│  CPU registers: rax=5, rbx=2...    │
│  Page table pointer: 0x7f...       │
│  File descriptor table: [0,1,2...] │
│  Signal mask: ...                  │
│  Priority / nice value: 0          │
└────────────────────────────────────┘
```

---

## Process Creation: fork()

On Unix/Linux, every process (except PID 1) is born by **cloning** an existing process.

```c
pid_t pid = fork();
```

`fork()` creates an exact copy of the calling process:
- Same code (`text` section)
- **Copy-on-write** copy of memory (parent and child share pages until one writes)
- Same open files (but file positions are shared — careful!)
- Different PID and different return value from `fork()`

```c
#include <unistd.h>
#include <stdio.h>

int main() {
    printf("Before fork: PID=%d\n", getpid());
    
    pid_t pid = fork();
    
    if (pid == 0) {
        // This code runs only in the CHILD
        printf("Child: PID=%d, parent=%d\n", getpid(), getppid());
    } else if (pid > 0) {
        // This code runs only in the PARENT (pid = child's PID)
        printf("Parent: PID=%d, child=%d\n", getpid(), pid);
        wait(NULL);   // wait for child to finish
    } else {
        perror("fork failed");
    }
    
    return 0;
}
```

Output (non-deterministic order):
```
Before fork: PID=1234
Parent: PID=1234, child=1235
Child: PID=1235, parent=1234
```

**The fork() question:** How many times does the printf run? The answer: THREE times. `"Before fork"` runs once (before fork). After fork, TWO processes exist, each printing their respective message.

```c
// Tricky: how many times does this print "hello"?
fork();
fork();
printf("hello\n");
// Answer: 4 times. 
// After first fork: 2 processes.
// Each of those forks again: 4 processes total.
// Each prints "hello".
```

---

## exec(): Replacing the Process Image

`fork()` creates a copy. `exec()` *replaces* the current process image with a new program.

```c
// In the child process, after fork():
execve("/usr/bin/ls", argv, envp);
// If execve succeeds, the current program is GONE.
// The process (same PID!) now runs /usr/bin/ls.
// execve only returns if it FAILS.
perror("exec failed");   // only reached on error
```

**The fork-exec idiom** — how shells launch programs:
```
shell (bash): fork() → child process
              child: exec("ls -la") → child is now ls
              parent: wait() → blocks until ls finishes
              parent: resumes, prints next prompt
```

```c
// Simplified shell implementation
while (1) {
    char* cmd = read_user_input();        // e.g., "ls -la"
    char** args = parse_args(cmd);        // ["ls", "-la", NULL]
    
    pid_t pid = fork();
    if (pid == 0) {
        execvp(args[0], args);            // replace child with ls
        perror("exec");                   // not reached on success
        exit(1);
    } else {
        wait(NULL);                       // parent waits for ls to finish
    }
}
```

**Why fork then exec instead of one call?**
Between fork() and exec(), the child can:
- Redirect file descriptors (`dup2(fd, STDOUT_FILENO)` to redirect output)
- Set environment variables
- Change user ID (`setuid`)
- Close files the child shouldn't inherit

This setup phase in the child is only possible because of the fork/exec split.

---

## System Calls: The OS Interface

A **system call** is the mechanism by which a user-space process asks the OS kernel to perform a privileged operation.

```
Why do we need system calls?
  User processes run in "ring 3" (unprivileged mode).
  Only kernel code runs in "ring 0" (privileged mode).
  Only ring 0 can: touch hardware, access other processes' memory, modify page tables.

  User process: "I want to read a file."
  System call: "Ask the kernel to do it for you."
```

### How a System Call Works (x86-64 Linux)

```asm
; Writing "hello" to file descriptor 1 (stdout)
; Linux system call convention: syscall number in rax, args in rdi, rsi, rdx...

mov rax, 1          ; syscall #1 = write
mov rdi, 1          ; fd = 1 (stdout)
mov rsi, hello_addr ; buf = address of "hello\n"
mov rdx, 6          ; count = 6 bytes
syscall             ; trap to kernel!

; Execution jumps to kernel syscall handler:
;   1. Save user-space register state
;   2. Switch from ring 3 to ring 0
;   3. Execute write() in kernel — actually writes to file
;   4. Restore register state
;   5. Switch back to ring 3
;   6. Return here (rax = number of bytes written, or negative error)
```

**The `syscall` instruction** (x86-64) triggers a privileged mode switch. This is a controlled entry point — user programs can ONLY enter the kernel through this gate, at pre-defined entry points. No arbitrary kernel code execution.

### System Call Cost

A system call is 100-1000× more expensive than a regular function call:
- Mode switch (ring 3 → ring 0 → ring 3)
- TLB flushed (or PCID used to avoid flush — optimization)
- CPU pipelines may stall
- Kernel must save/restore context

Cost: ~100 ns per syscall on modern hardware.

**Why this matters:** A tight loop doing one `write(1 byte)` per iteration is catastrophically slow. Use buffered I/O (stdio in C, BufferedWriter in Java) to batch many bytes into one system call.

```c
// SLOW: 1,000,000 syscalls
for (int i = 0; i < 1000000; i++) write(fd, &byte, 1);

// FAST: 1 syscall
write(fd, buffer_of_1M_bytes, 1000000);
```

### Common System Calls

| Syscall | Number | Description |
|---------|--------|-------------|
| `read` | 0 | Read from file descriptor |
| `write` | 1 | Write to file descriptor |
| `open` | 2 | Open a file, returns fd |
| `close` | 3 | Close a file descriptor |
| `fork` | 57 | Create child process |
| `execve` | 59 | Load and run new program |
| `exit` | 60 | Terminate process |
| `wait4` | 61 | Wait for child process |
| `kill` | 62 | Send signal to process |
| `mmap` | 9 | Map file/memory into address space |
| `brk` | 12 | Grow/shrink heap |
| `socket` | 41 | Create network socket |
| `connect` | 42 | Connect to remote host |
| `accept` | 43 | Accept incoming connection |

---

## Process States and Scheduling

A process moves through states during its life:

```
         fork()                exit()
CREATED ──────→ READY ──────→ ZOMBIE ──→ DEAD (parent called wait())
                  │↑             ↑
     scheduler    ││  preempt    │
     picks it     │└────────────┐│
                  ↓             ││
              RUNNING           ││
                  │             ││
    I/O request   │             ││
    sleep()       ↓             ││
              BLOCKED ──────────┘│
              (I/O done)         │
                  └──────────────┘
                  (woken, back to READY)
```

**ZOMBIE state:** A process has exited, but its parent hasn't called `wait()` yet. The PCB remains, holding the exit code. A zombie consumes almost no resources except a PID slot. When the parent calls `wait()`, the zombie is cleaned up.

**Orphan:** If a parent exits before its child, the child is "orphaned" — adopted by PID 1 (init/systemd), which will call `wait()` on its behalf.

---

## Signals: Asynchronous Events

Signals are software interrupts sent to a process. They can come from:
- The OS (SIGSEGV for invalid memory access, SIGFPE for divide-by-zero)
- Other processes (via `kill(pid, signal)`)
- The terminal (Ctrl+C → SIGINT, Ctrl+Z → SIGTSTP)
- The process itself (`raise(SIGSEGV)`)

**Common signals:**

| Signal | Number | Default | Meaning |
|--------|--------|---------|---------|
| SIGTERM | 15 | Terminate | Polite request to exit |
| SIGKILL | 9 | Terminate | Cannot be caught, blocked, or ignored |
| SIGINT | 2 | Terminate | Ctrl+C from terminal |
| SIGSEGV | 11 | Core dump | Segmentation fault |
| SIGHUP | 1 | Terminate | Terminal closed (or: reload config) |
| SIGCHLD | 17 | Ignore | Child process status changed |
| SIGSTOP | 19 | Stop | Pause process (like Ctrl+Z) |
| SIGCONT | 18 | Continue | Resume stopped process |

**Why `kill -9` always works but `kill -15` might not:**
- SIGTERM (15) CAN be caught by the program. Well-written programs catch SIGTERM, flush buffers, clean up temp files, and exit gracefully.
- SIGKILL (9) CANNOT be caught, blocked, or ignored — the kernel terminates the process immediately. No cleanup happens.

```c
// Catching SIGTERM for graceful shutdown
#include <signal.h>

volatile int shutdown_requested = 0;

void handle_term(int sig) {
    shutdown_requested = 1;   // set flag, exit main loop cleanly
}

int main() {
    signal(SIGTERM, handle_term);   // install handler
    
    while (!shutdown_requested) {
        // do work...
    }
    
    cleanup();   // flush, close files, etc.
    return 0;
}
```

---

## File Descriptors and I/O Redirection

Everything in Unix is a file. Files, sockets, pipes, terminals — all accessed through **file descriptors** (integers).

Every process starts with 3 open file descriptors:
- **0** — stdin (keyboard)
- **1** — stdout (terminal)
- **2** — stderr (terminal, error output)

**How shell redirects work:**

```bash
ls -la > output.txt     # redirect stdout to file
ls -la 2> errors.txt    # redirect stderr to file  
ls -la > out.txt 2>&1   # redirect both stdout and stderr to file
cat < input.txt         # stdin from file
ls | grep ".c"          # pipe: stdout of ls → stdin of grep
```

The shell implements this with `dup2()` BETWEEN fork() and exec():

```c
// Shell implementing: ls > output.txt
pid_t pid = fork();
if (pid == 0) {
    // In child, BEFORE exec:
    int fd = open("output.txt", O_WRONLY | O_CREAT, 0644);
    dup2(fd, STDOUT_FILENO);  // make fd 1 point to output.txt
    close(fd);                // clean up original fd
    execvp("ls", args);       // ls runs — its writes to fd 1 go to output.txt!
}
```

**Pipes:** `pipe(int fds[2])` creates a unidirectional channel — `fds[1]` is the write end, `fds[0]` is the read end. Data written to `fds[1]` can be read from `fds[0]`. The shell uses this for `|` (pipe operator).

---

## Event-Driven I/O: How Node.js Works

Traditional server: one thread per connection. 1000 connections = 1000 threads (expensive).

Node.js: single thread + event loop. How?

```
Synchronous I/O (blocking):
  read(fd, buf, size)  →  [process blocks, CPU idle for 100ms while disk reads]
  
Asynchronous I/O (non-blocking via epoll):
  1. Register interest: "wake me when fd is readable" (epoll_ctl)
  2. Process does other work (or serves other requests)
  3. fd becomes readable → kernel puts event in epoll queue
  4. Process calls epoll_wait() → gets list of ready fds
  5. Process reads the ready data — no blocking!
```

**The event loop:**
```javascript
while (true) {
    events = epoll_wait(fds);       // blocks ONLY if nothing is ready
    for (event in events) {
        callback = callbacks[event.fd];
        callback(event.data);        // user's "on data" / "on connection" handler
    }
}
```

Node.js's single thread spends its time running JavaScript callbacks. Network I/O happens in the kernel (non-blocking), and the event loop dispatches callbacks when data arrives. For CPU-heavy tasks (never use Node.js's single thread for these — use worker threads or child processes).

---

## Section Challenge

> ### Process Tree and Signal Tracing
>
> A process (PID 100) runs the following code:
>
> ```c
> #include <unistd.h>
> #include <stdio.h>
> #include <sys/wait.h>
>
> int main() {
>     pid_t a = fork();   // fork 1
>     if (a == 0) {
>         pid_t b = fork();   // fork 2 (in child a)
>         if (b == 0) {
>             printf("C: %d\n", getpid());
>         } else {
>             printf("B: %d\n", getpid());
>             wait(NULL);
>         }
>         exit(0);
>     }
>     
>     printf("A: %d\n", getpid());
>     wait(NULL);
>     return 0;
> }
> ```
>
> **Q1:** Draw the process tree. Label each process with which `printf` it executes.
>
> **Q2:** How many total processes exist after both forks? What are their PIDs (relative to 100)?
>
> **Q3:** What does `wait(NULL)` do? What happens if a process exits without its parent ever calling `wait()`?
>
> **Q4:** If the process at PID 100 receives `SIGKILL` before either `wait()` returns, what happens to the child processes? What happens to the grandchild process?
>
> **Q5 (Stretch):** Modify the code so that process B's `printf` output goes to a file `child.log` instead of stdout, WITHOUT modifying the printf call. Write the necessary lines to insert between fork 2 and the `printf` statement.

<details>
<summary>Full answers</summary>

```
Q1: Process tree

Process 100 (original) calls fork() → creates process 101.

Process 101 (child a, a==0) calls fork() → creates process 102.

Process tree:
     100 (A)
      │
     101 (B)
      │
     102 (C)

Printf mapping:
  Process 100: printf("A: 100\n")   ← a > 0, so A branch
  Process 101: printf("B: 101\n")   ← a == 0, b > 0, so B branch
  Process 102: printf("C: 102\n")   ← a == 0, b == 0, so C branch

──────────────────────────────────────────────────────

Q2: Total processes and PIDs

After fork 1: 2 processes (100, 101).
After fork 2 (only 101 forks): 3 processes total (100, 101, 102).

PID 100 = original (parent, prints A)
PID 101 = child from fork 1 (prints B)
PID 102 = child from fork 2 = grandchild of 100 (prints C)

Note: actual PIDs depend on OS allocation; "101" and "102" are illustrative.
The PID returned by fork() to the parent is the child's actual PID.

──────────────────────────────────────────────────────

Q3: wait() and zombies

wait(NULL) blocks the calling process until ANY child process exits.
Returns the PID of the child that exited.

Flow:
  Process 101 calls wait(NULL) → waits for process 102.
  Process 102 runs printf("C"), then exit(0).
  Process 101's wait() returns (102 is cleaned up).
  Process 101 runs its own exit(0).
  Process 100's wait() returns (101 cleaned up).
  Process 100 returns from main.

If a parent exits WITHOUT calling wait():
  Children that have already exited become ZOMBIES — their PCB stays
  in the process table (holding their exit code) with no parent to
  collect it.
  
  Zombies are eventually inherited by PID 1 (init/systemd), which 
  periodically calls wait() to reap them.

  A zombie consumes minimal resources (just a PID slot), but:
  - PIDs are finite. A bug that creates millions of zombie processes
    exhausts the PID namespace (max ~4 million on Linux).

──────────────────────────────────────────────────────

Q4: SIGKILL to PID 100

SIGKILL cannot be caught, blocked, or ignored.
PID 100 is terminated immediately.

What happens to PID 101 and 102?
  PID 101 and 102 are CHILDREN of PID 100.
  They are NOT automatically killed when the parent dies.
  They become ORPHANS — adopted by PID 1 (init/systemd).
  
  PID 101 and 102 continue running normally.
  When they eventually exit, init reaps them via wait().

  EXCEPTION: Some systems support "subreaper" designation
  (prctl(PR_SET_CHILD_SUBREAPER)) which designates a non-PID-1
  process as the orphan collector for its subtree.

  Also: process groups and sessions can forward signals to all
  members via kill(-pgid, signal).

──────────────────────────────────────────────────────

Q5: Redirect B's printf to child.log

Insert after fork 2 succeeds (b > 0, we are in process 101/B):

  } else {
      // Redirect stdout to child.log BEFORE printf
      int logfd = open("child.log", O_WRONLY | O_CREAT | O_TRUNC, 0644);
      if (logfd < 0) { perror("open"); exit(1); }
      dup2(logfd, STDOUT_FILENO);   // fd 1 now points to child.log
      close(logfd);                  // cleanup duplicate fd
      
      printf("B: %d\n", getpid());   // unchanged — writes to child.log now
      wait(NULL);
  }

Headers needed: #include <fcntl.h>

How it works:
  open() returns e.g., fd=3 pointing to child.log.
  dup2(3, 1): closes the current fd 1 (the terminal stdout),
  makes fd 1 a duplicate of fd 3 (child.log).
  close(3): we no longer need fd 3 (fd 1 still points to child.log).
  Now printf writes to fd 1, which IS child.log.

This is exactly how the shell implements "ls > output.txt".
The printf call itself is completely unmodified.
```

</details>

---

## Common Mistakes

**Mistake 1: Forgetting that fork() duplicates file position**
- Parent and child share the file offset in open files. If both read from the same file after fork(), they'll interleave reads, not each get the full file. Use `O_CLOEXEC` and careful fd management.

**Mistake 2: Not handling SIGCHLD / not calling wait()**
- Processes that don't wait() for children create zombie accumulation. Long-running servers must either `wait()` in a signal handler or use `signal(SIGCHLD, SIG_IGN)` to auto-reap children.

**Mistake 3: Thinking SIGKILL kills the whole process tree**
- `kill -9 <pid>` kills ONE process. Its children become orphans and continue running. Use `kill -9 -<pgid>` (note the negative sign) to kill an entire process group.

**Mistake 4: Underestimating syscall overhead in tight loops**
- Every `printf` (with newline flushing), `fread` of 1 byte, `send` of 1 byte, is expensive. Batch I/O. Use buffered wrappers. Use `writev` for scatter-gather I/O. This is why databases use large buffer pools, not per-row I/O.

---

## Connections

- **Chapter 07 — Linking:** `execve()` is the system call that runs a new program — it's the runtime entry point of the dynamic linker. When exec runs, the dynamic linker (ld.so) runs first, resolves shared library symbols, then calls the program's `main()`.
- **Chapter 09 — Virtual Memory:** `fork()` uses copy-on-write for virtual memory. The child shares the parent's physical pages until it writes, at which point the OS copies the modified page. This makes fork() cheap even for large processes.
- **Chapter 11 — Threads:** Threads are lighter-weight than processes — they share the same address space. `fork()` copies the address space; `pthread_create()` creates a new execution context WITHIN the existing address space.
- **Chapter 12 — I/O:** Everything here (file descriptors, pipes, signals) is the infrastructure that I/O is built on. epoll/kqueue are the kernel mechanisms that make async I/O and event loops possible.

---

> [← 07 Linking, Loading & the Build Process](07_Linking_Loading_Build_Process.md) | [Course Index](README.md) | [Next → 09 Virtual Memory](09_Virtual_Memory.md)
