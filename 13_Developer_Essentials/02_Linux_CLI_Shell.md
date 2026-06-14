# 🐧 Linux CLI & Shell — Complete Guide

**Navigation**: [< Git](01_Git_Version_Control.md) | [Index](00_INDEX.md) | [Next: Docker >](03_Docker_Containers.md)

---

# WHY: Why Every Developer Needs Linux

## The Reality

```
Fact: 96.3% of the world's top 1 million servers run Linux
Fact: 100% of the world's top 500 supercomputers run Linux
Fact: Every AWS/Azure/GCP instance defaults to Linux
Fact: Android = Linux kernel
Fact: Your Spring Boot app in production = running on Linux

If you can't use Linux CLI → you can't deploy, debug, or
manage ANY production application.
```

## WHO: Origin Story

```
1991: Linus Torvalds (Finnish CS student, age 21)
      "I'm doing a free operating system (just a hobby)"

Inspired by: UNIX (1969, Bell Labs)
             → Expensive, proprietary

GNU Project (1983, Richard Stallman)
             → Free tools but NO KERNEL

Linux = GNU tools + Linux kernel = FREE complete OS

Today: Powers everything from your phone to Mars rovers
```

---

🔬 **Section Challenge — WHO: Origin Story**

**Challenge 1 (Reasoning):** Linux won the server market even though Windows existed and had massive commercial backing. What is the architectural reason Linux is better suited for servers than Windows, beyond cost?

<details><summary>Answer</summary>

Linux's architecture is a **minimal, modular kernel** — a server running Linux can boot into a text-only environment with ~100MB RAM, no GUI process, no unnecessary services. Every running process consumes CPU and memory; Windows ships with a GUI server (Desktop Window Manager), font caching, Windows Update, Cortana, and dozens of other processes that have no value on a server but still consume resources and present attack surface. Linux also follows the **Unix philosophy**: small tools that do one thing well, composable via pipes. This makes automation (shell scripts, cron, systemd) far more expressive than PowerShell for infrastructure tasks. Additionally, Linux's open-source nature means security patches appear within hours, not weeks.

</details>

**Challenge 2 (Reasoning):** The Linux file system has `/etc/`, `/var/`, `/tmp/`, `/opt/`, and `/usr/local/`. A teammate says "just put the config file wherever the app expects it." Why is following the FHS (Filesystem Hierarchy Standard) important in production?

<details><summary>Answer</summary>

The FHS defines where categories of files belong — configs in `/etc/`, runtime data in `/var/`, temporary files in `/tmp/`, optional packages in `/opt/`. Deviating from FHS creates: (1) **Backup failures** — backup scripts targeting `/etc/` for config miss your custom location; (2) **Monitoring gaps** — log aggregators watch `/var/log/`; a custom log path means silent failures; (3) **Deployment breakage** — Ansible, Chef, and Puppet playbooks assume FHS paths; (4) **Security policy violations** — SELinux/AppArmor policies are written for standard paths; a file in `/home/app/config` may be denied read access that `/etc/app/config` would get. FHS is a contract between the application and the system.

</details>

# WHAT: Core Concepts

## The Shell

```
┌────────────────────────────────────────────┐
│              YOU (Human)                   │
│                  │                         │
│           Type commands                    │
│                  ▼                         │
│         ┌──────────────┐                   │
│         │    SHELL     │ ← Bash, Zsh       │
│         │ (Interpreter)│                   │
│         │              │                   │
│         │  Translates  │                   │
│         │  commands to │                   │
│         │  kernel calls│                   │
│         └──────┬───────┘                   │
│                ▼                           │
│         ┌──────────────┐                   │
│         │   KERNEL     │ ← Linux core      │
│         │              │                   │
│         │  Controls:   │                   │
│         │  - CPU       │                   │
│         │  - Memory    │                   │
│         │  - Disk      │                   │
│         │  - Network   │                   │
│         └──────────────┘                   │
│         ┌──────────────┐                   │
│         │  HARDWARE    │                   │
│         └──────────────┘                   │
└────────────────────────────────────────────┘

Shell = text-based interface to the operating system
        Your superpower for automation
```

## File System Hierarchy

```
/ (root)
├── /bin/      → Essential commands (ls, cp, cat)
├── /sbin/     → System admin commands (iptables, mount)
├── /etc/      → Configuration files (ALL config lives here)
│   ├── /etc/nginx/     → Nginx config
│   ├── /etc/ssh/       → SSH config
│   └── /etc/hosts      → hostname→IP mapping
├── /home/     → User home directories
│   └── /home/sai/      → YOUR stuff
├── /var/      → Variable data (logs, databases)
│   ├── /var/log/        → ALL system logs
│   └── /var/www/        → Web server files
├── /tmp/      → Temporary files (cleared on reboot)
├── /opt/      → Optional/third-party software
├── /usr/      → User programs
│   ├── /usr/bin/        → User commands
│   └── /usr/local/      → Locally installed software
├── /dev/      → Device files (disks, terminals)
└── /proc/     → Virtual filesystem (process info)

KEY INSIGHT: Everything in Linux is a FILE
  - Files → files
  - Directories → files
  - Devices → files (/dev/sda)
  - Processes → files (/proc/1234)
  - Network sockets → files
```

---

🔬 **Section Challenge — File System Hierarchy**

**Challenge 1 (Reasoning):** A developer stores a MySQL data directory in `/home/deploy/mysql-data/`. Name three production problems this causes that storing it in `/var/lib/mysql/` would avoid.

<details><summary>Answer</summary>

1. **Backup gap**: Most backup systems (Bacula, Restic, cloud snapshots) are pre-configured to exclude `/home/` for speed and include `/var/lib/`. Your database is silently never backed up. 2. **Disk separation**: Production systems often mount `/var/` on a dedicated high-IOPS disk volume, isolated from the OS disk. Putting data in `/home/` keeps database I/O competing with the OS, causing latency spikes under load. 3. **SELinux/AppArmor policy**: MySQL's AppArmor profile explicitly allows read/write to `/var/lib/mysql/` — a custom path requires a custom policy or running in permissive mode (a security risk).

</details>

**Challenge 2 (Trace):** You `ls -la /proc/1234/` on a running Java app. What are you looking at, and name two specific things you can diagnose from this directory without any other tool?

<details><summary>Answer</summary>

`/proc/<PID>/` is a **virtual filesystem** — not stored on disk, generated by the kernel on-demand to expose process internals. Two useful diagnoses: (1) **Open file descriptors**: `ls -la /proc/1234/fd/` lists every file, socket, and pipe the process has open — if you see thousands of entries, you likely have a file descriptor leak. (2) **Memory maps**: `/proc/1234/maps` shows every memory region (JVM heap, metaspace, shared libs, mmap'd files) with base addresses — useful for diagnosing memory layout or confirming native library load. Also useful: `/proc/1234/cmdline` (exact startup command) and `/proc/1234/environ` (environment variables at startup).

</details>

# HOW: Essential Commands (Progressive)

## Level 0: Navigation (Day 1)

```bash
# Where am I?
pwd                    # Print Working Directory → /home/sai

# What's here?
ls                     # List files
ls -la                 # Long format + hidden files (THE command you'll use most)
ls -lah                # + Human-readable sizes (1.2G instead of 1234567890)

# Move around
cd /path/to/dir        # Change directory
cd ..                  # Up one level
cd ~                   # Home directory
cd -                   # Previous directory (toggle)

# TAB COMPLETION — press TAB to autocomplete paths!
# This is your BEST FRIEND. Use it constantly.
```

## Level 1: File Operations (Week 1)

```bash
# === CREATE ===
touch file.txt              # Create empty file
mkdir project               # Create directory
mkdir -p a/b/c/d            # Create nested directories

# === READ ===
cat file.txt                # Print entire file
head -20 file.txt           # First 20 lines
tail -20 file.txt           # Last 20 lines
tail -f app.log             # FOLLOW log in real-time (essential for debugging!)
less file.txt               # Scrollable viewer (q to quit, / to search)
wc -l file.txt              # Count lines

# === COPY / MOVE / DELETE ===
cp source.txt dest.txt      # Copy file
cp -r src_dir/ dest_dir/    # Copy directory recursively
mv old.txt new.txt          # Rename (move)
mv file.txt /path/to/       # Move to different location
rm file.txt                 # Delete file (NO TRASH CAN — GONE FOREVER!)
rm -r directory/            # Delete directory recursively
rm -ri directory/           # Delete with confirmation (safer)
```

## Level 2: Text Processing (Week 2)

### grep — Search Inside Files (THE Most Used Command)

```bash
# Basic search
grep "error" app.log              # Lines containing "error"
grep -i "error" app.log           # Case-insensitive
grep -r "TODO" src/               # Recursive search in directory
grep -n "error" app.log           # Show line numbers
grep -c "error" app.log           # Count matches
grep -v "debug" app.log           # Lines NOT containing "debug"

# Regex patterns
grep -E "error|warning" app.log   # Multiple patterns (OR)
grep -E "^2024-01" app.log        # Lines starting with "2024-01"
grep -E "\.java$" filelist.txt    # Lines ending with ".java"

# Real-world: Find all Java files with "NullPointer"
grep -rn "NullPointer" --include="*.java" src/
```

### Piping & Redirection (Linux Superpower)

```bash
# PIPE (|) → Output of command A becomes input of command B
ls -la | grep ".java"              # List → filter Java files
cat log.txt | sort | uniq          # Read → sort → remove duplicates
ps aux | grep "java"               # Running processes → filter Java

# REDIRECT (> >>) → Output to file instead of screen
echo "Hello" > file.txt            # Write (overwrite)
echo "World" >> file.txt           # Append
ls -la > filelist.txt              # Save directory listing to file
command 2> errors.txt              # Redirect ERRORS to file
command > out.txt 2>&1             # Both output AND errors to file

# Real-world pipeline:
cat access.log | grep "POST" | grep "500" | awk '{print $7}' | sort | uniq -c | sort -rn | head -10
# Translation: "Find top 10 endpoints with most 500 errors on POST requests"
```

### sed, awk, cut — Text Transformation

```bash
# sed — Stream Editor (find & replace)
sed 's/old/new/g' file.txt         # Replace all occurrences
sed -i 's/localhost/prod-server/g' config.yml  # In-place edit

# awk — Column Processing
awk '{print $1}' file.txt          # Print first column
awk -F',' '{print $2}' data.csv   # Print 2nd CSV column
awk '$3 > 100' data.txt           # Rows where 3rd column > 100

# cut — Extract columns
cut -d',' -f1,3 data.csv          # Columns 1 and 3 from CSV
```

## Level 3: System Administration (Month 1)

### File Permissions

```bash
# ls -la shows:
# -rw-r--r-- 1 sai staff 1234 Dec 25 10:00 app.java

# Permission breakdown:
# -rw-r--r--
# │├──┤├──┤├──┤
# │ │   │   └── others: r-- (read only)
# │ │   └────── group:  r-- (read only)
# │ └────────── owner:  rw- (read + write)
# └──────────── type:   - (file), d (dir), l (link)

# Change permissions
chmod 755 script.sh       # rwxr-xr-x (owner: rwx, others: rx)
chmod +x script.sh        # Add execute permission
chmod -R 644 config/      # Recursively set files

# Numeric permission system (MUST MEMORIZE):
# r=4, w=2, x=1
# 755 = rwxr-xr-x (owner:7=rwx, group:5=rx, others:5=rx)
# 644 = rw-r--r-- (owner:6=rw, group:4=r, others:4=r)
# 700 = rwx------ (owner only)
```

### Process Management

```bash
# View processes
ps aux                    # All running processes
ps aux | grep java        # Find Java processes
top                       # Real-time process monitor (q to quit)
htop                      # Better version of top (install first)

# Background / Foreground
command &                 # Run in background
nohup command &           # Run even after logout
jobs                      # List background jobs
fg %1                     # Bring job 1 to foreground

# Kill processes
kill PID                  # Graceful stop (SIGTERM)
kill -9 PID               # Force kill (SIGKILL) - last resort
pkill java                # Kill by process name

# Real-world: Your Java app is stuck
ps aux | grep java        # Find PID
kill -3 PID               # Send thread dump (SIGQUIT) → debug
kill PID                  # Graceful stop
```

### Disk & Memory

```bash
df -h                     # Disk space (human-readable)
du -sh /path/             # Size of directory
du -sh * | sort -rh       # Largest items in current dir
free -h                   # RAM usage
```

## Level 4: Networking (Month 2)

```bash
# Network diagnostics
ping google.com            # Test connectivity
curl https://api.example.com  # HTTP request (GET)
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' URL

wget https://example.com/file.zip  # Download file

# Ports & connections
netstat -tlnp              # What's listening on which port?
ss -tlnp                   # Modern alternative to netstat
lsof -i :8080              # What process is using port 8080?

# SSH — Remote Access
ssh user@server.com        # Connect to remote machine
ssh -i key.pem user@ip     # Connect with private key
scp file.txt user@server:/path/  # Copy file TO remote
scp user@server:/path/file.txt . # Copy file FROM remote
```

## Level 5: Shell Scripting (Month 3+)

```bash
#!/bin/bash
# deploy.sh — Example deployment script

set -e  # Exit on any error

echo "=== Starting deployment ==="

# Variables
APP_NAME="my-spring-app"
JAR_FILE="target/${APP_NAME}.jar"
REMOTE="deploy@prod-server"

# Build
echo "Building..."
mvn clean package -DskipTests

# Check if build succeeded
if [ ! -f "$JAR_FILE" ]; then
    echo "ERROR: Build failed — JAR not found"
    exit 1
fi

# Upload
echo "Uploading to production..."
scp "$JAR_FILE" "$REMOTE:/opt/apps/${APP_NAME}.jar"

# Restart on remote server
echo "Restarting application..."
ssh "$REMOTE" "systemctl restart ${APP_NAME}"

# Verify
sleep 5
STATUS=$(ssh "$REMOTE" "systemctl is-active ${APP_NAME}")
if [ "$STATUS" = "active" ]; then
    echo "Deployment successful!"
else
    echo "ERROR: Application failed to start"
    exit 1
fi
```

### Essential Scripting Patterns

```bash
# Conditionals
if [ -f "file.txt" ]; then
    echo "File exists"
elif [ -d "dir" ]; then
    echo "Directory exists"
else
    echo "Neither"
fi

# Loops
for file in *.java; do
    echo "Processing: $file"
    wc -l "$file"
done

# While loop (read file line by line)
while IFS= read -r line; do
    echo "$line"
done < input.txt

# Functions
deploy() {
    local env=$1
    echo "Deploying to $env..."
    # ...
}
deploy "production"
```

---

# WHERE: Real-World Scenarios

## Debugging a Production Issue

```bash
# 1. SSH into server
ssh admin@prod-server-01

# 2. Check if app is running
systemctl status my-app

# 3. Check recent logs
tail -100 /var/log/my-app/app.log

# 4. Search for errors in last hour
grep "ERROR" /var/log/my-app/app.log | grep "$(date +%H:)"

# 5. Check memory/CPU
free -h
top -b -n 1 | head -20

# 6. Check disk space (full disk = silent app failure!)
df -h

# 7. Check what's listening on app port
ss -tlnp | grep 8080
```

🔬 **Section Challenge — Debugging a Production Issue**

**Challenge 1 (Scenario):** You SSH into a production server and run `systemctl status my-app` — status shows `active (running)`. But users report the API returns 502 Bad Gateway. What are the next 3 commands you run and what does each tell you?

<details><summary>Answer</summary>

1. `ss -tlnp | grep 8080` — confirms the app is actually **bound to the port**. `systemctl active` only means the process is alive, not that it's listening. A deadlocked app stays "active" but stops accepting connections. 2. `tail -f /var/log/my-app/app.log | grep -E 'ERROR|WARN'` — reveals whether the app is processing requests and throwing errors (OOM, DB connection pool exhausted, external API timeout). 3. `curl -v http://localhost:8080/health` — tests the app **directly** (bypassing the load balancer/nginx), isolating whether the issue is the app itself or the upstream proxy configuration.

</details>

**Challenge 2 (Senior/Debug):** `df -h` shows `/var` is at 100% usage. Your Java app is suddenly failing to write logs and throwing `IOException: No space left on device`. Walk through the exact commands to diagnose WHERE the space went and recover without restarting the app.

<details><summary>Answer</summary>

1. `du -sh /var/* | sort -rh | head -10` — find the top space consumer in `/var/`. Usually `/var/log/` (unbounded log files) or `/var/lib/docker/` (dangling Docker layers). 2. `ls -lah /var/log/my-app/` — identify the largest log file. If it's a single unbounded log: `truncate -s 0 /var/log/my-app/app.log` clears it **without deleting** the open file descriptor (if you `rm` a file that a running process has open, the kernel keeps the inode until the process closes it — disk space is NOT freed). 3. Verify space freed: `df -h`. 4. Long-term fix: configure logback/log4j **rolling file appender** with max size (e.g., 100MB) and max history (e.g., 30 days), and set up **logrotate** as the OS-level safety net.

</details>

## Log Analysis One-Liners

```bash
# Count errors per hour
grep "ERROR" app.log | awk '{print $1, $2}' | cut -c1-13 | sort | uniq -c

# Top 10 slowest API calls
grep "response_time" access.log | awk '{print $NF, $7}' | sort -rn | head -10

# Find unique IP addresses causing 401s (potential brute force)
grep "401" access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Monitor log in real-time, filtered (--line-buffered prevents grep from buffering)
tail -f app.log | grep --line-buffered "ERROR"
```

🔬 **Section Challenge — Log Analysis One-Liners**

**Challenge 1 (Trace):** Explain what this pipeline does step by step: `cat access.log | grep "POST" | grep "500" | awk '{print $7}' | sort | uniq -c | sort -rn | head -10`

<details><summary>Answer</summary>

Step by step: (1) `cat access.log` — read the entire access log to stdout; (2) `grep "POST"` — keep only lines from POST requests; (3) `grep "500"` — of those, keep only lines with HTTP 500 status; (4) `awk '{print $7}'` — extract the 7th whitespace-delimited field (the URL path in standard nginx/Apache log format); (5) `sort` — alphabetically sort the paths so identical values are adjacent; (6) `uniq -c` — collapse consecutive identical lines and prefix each with a count; (7) `sort -rn` — sort numerically in descending order (highest count first); (8) `head -10` — show only the top 10. **Net result**: The top 10 API endpoints with the most POST 500 errors — your first debug target in a production incident.

</details>

**Challenge 2 (Design):** `tail -f app.log | grep "ERROR"` works but has a subtle problem in practice. What is it, and what flag fixes it?

<details><summary>Answer</summary>

The problem is **grep's output buffering**. By default, grep buffers its output when stdout is not a terminal (i.e., when piped). In a pipe chain, grep accumulates output in an 8KB buffer and only flushes when the buffer is full or the stream ends. In a `tail -f` pipeline, this means error lines appear in bursts (every 8KB of output) rather than immediately — you could miss critical errors for minutes in a low-traffic system. The fix is `grep --line-buffered "ERROR"` — this forces grep to flush after every matching line, giving true real-time output. This is a well-known production gotcha.

</details>

---

# 🧭 CLI Cheat Sheet

```
NAVIGATION:   pwd | ls | cd | find | which
FILES:        cat | head | tail | less | wc | touch | mkdir | cp | mv | rm
SEARCH:       grep | find | locate
TRANSFORM:    sed | awk | cut | sort | uniq | tr
SYSTEM:       ps | top | kill | df | du | free | uname
NETWORK:      ping | curl | wget | ssh | scp | netstat
PERMISSIONS:  chmod | chown | chgrp
COMPRESSION:  tar | gzip | zip | unzip
PIPE/REDIR:   | (pipe) | > (write) | >> (append) | 2> (errors)
```

---

# 🏋️ Practice Exercises

## Exercise 1: File Operations

```
Create directory structure: project/src/main/java/
Create 5 .java files with different content
Find all files larger than 100 bytes
Count total lines across all .java files
```

## Exercise 2: Text Processing Pipeline

```
Download a log file (or create one with random entries)
Find all ERROR lines
Extract the timestamp and error message
Count errors per hour
Find the most common error message
```

🔬 **Section Challenge — Exercise 2: Text Processing Pipeline**

**Challenge 1 (Design):** Write a single pipeline to find the top 5 most frequent ERROR messages in `app.log`, ignoring the timestamp prefix on each line. The log format is: `2024-01-15 14:23:01 ERROR PaymentService - Connection timed out`

<details><summary>Answer</summary>

```bash
grep "ERROR" app.log | awk '{$1=$2=$3=""; print $0}' | sed 's/^ *//' | sort | uniq -c | sort -rn | head -5
```

Explanation: `grep ERROR` filters to error lines → `awk '{$1=$2=$3=""; print $0}'` blanks the first 3 fields (date, time, level) → `sed 's/^ *//'` trims the leading spaces left by awk → `sort` groups identical messages → `uniq -c` counts occurrences → `sort -rn` puts highest count first → `head -5` takes top 5. Alternative: `cut -d' ' -f4-` to remove first 3 space-delimited fields.

</details>

**Challenge 2 (Senior):** You need to monitor a log file in real-time and send an alert (e.g., `curl` to a webhook) the moment an `OutOfMemoryError` appears. Write the shell one-liner.

<details><summary>Answer</summary>

```bash
tail -f /var/log/app/app.log | grep --line-buffered "OutOfMemoryError" | while read line; do
  curl -s -X POST https://hooks.slack.com/services/XXX \
    -H 'Content-type: application/json' \
    -d "{\"text\": \"🚨 OOM detected on $(hostname): $line\"}" &
done
```

Key points: `--line-buffered` prevents grep output buffering (otherwise alerts appear in bursts). The `while read line` loop triggers on every match. The `&` runs the curl in the background so the monitor doesn't block on slow network calls. In production this would be a systemd service or run inside a monitoring agent (Fluentd, Vector, Filebeat).

</details>

## Exercise 3: Write a Backup Script

```
Script that:
1. Takes a directory as argument
2. Creates a timestamped tar.gz backup
3. Deletes backups older than 7 days
4. Logs actions to a log file
```

---

### Production Reality

**Linux CLI and shell operations fail in production in these named ways:**

- **`rm -rf` on wrong path** — `rm -rf /var/log/myapp/*` vs `rm -rf /var/log/myapp` has vastly different consequences. The first deletes files; the second deletes the directory itself, breaking any service that tries to create log files inside it. More severe: `rm -rf $DIR` where `$DIR` is empty expands to `rm -rf` (delete everything). This happens when environment variables are unset in systemd service context. NASA flight software postmortems document rm -rf incidents as a recurring cause of data loss.
- **Permission misconfiguration security incidents** — `chmod -R 777 /opt/myapp` to "fix a permissions issue" exposes all application files (including config files with database credentials) to any process on the system. The 2017 Equifax breach was partly attributed to a misconfigured web application file permission. Conversely, overly restrictive `chmod 000` on a critical binary breaks the service without error messages.
- **Zombie processes leaking file descriptors** — a JVM process that doesn't close `FileInputStream` or `ServerSocket` resources leaks file descriptors. Linux default limit is 1024 fds per process. Under sustained traffic, the process exhausts its fd limit and starts failing with "Too many open files" — requests start queuing, then failing. No OOM, no crash signal, just silent failure. `lsof -p <PID>` shows the leaked descriptors.
- **No disk space monitoring** — `/var/log/` grows unbounded if logrotate is misconfigured or absent. When the disk fills, the application cannot write its current log file, typically throwing an `IOException` and failing silently. Database writes fail. The service appears to be running (process alive) but serves no requests. Real incident pattern: disk at 100% for 6 hours before anyone notices because there was no disk-usage alert.

**Debug workflow:** For fd leaks: `ls /proc/<PID>/fd | wc -l` shows open fd count; `lsof -p <PID>` shows what files/sockets are open. For disk full: `df -h` shows which filesystem; `du -sh /var/* | sort -rh` shows which directory is consuming space.
**Mitigation discipline:** Use `find /path -delete` with explicit filename patterns instead of `rm -rf *` with variable expansion. Set filesystem monitoring alerts at 80% capacity. Configure logrotate with size-based rotation (not just time-based). Set `nofile` ulimit in systemd service definition to catch fd exhaustion early.

---

### Trade-off: Shell Variant Comparison

| Aspect              | Bash              | Zsh               | Fish              | PowerShell        |
|---------------------|-------------------|-------------------|-------------------|-------------------|
| Default on Linux    | yes (most distros)| no (user choice)  | no                | no                |
| Default on macOS    | yes (until 2019)  | yes (Catalina+)   | no                | no                |
| Syntax              | POSIX + bashisms  | POSIX + extensions| non-POSIX         | cmdlet-based      |
| Tab completion      | basic             | excellent         | best-in-class     | medium            |
| Cross-platform      | Unix only         | Unix only         | Unix only         | Windows + Unix    |
| Plugin ecosystem    | small             | oh-my-zsh         | fisher            | PSGallery         |
| Year introduced     | 1989              | 1990              | 2005              | 2006              |
| Best for            | scripting, system | interactive use   | interactive use   | Windows admins    |

**Selection rule:** Bash for portability and scripting; Zsh for daily interactive use; Fish for those who want modern UX out of the box; PowerShell for Windows-centric teams.

**Next Chapter**: [Docker & Containers →](03_Docker_Containers.md)

---
