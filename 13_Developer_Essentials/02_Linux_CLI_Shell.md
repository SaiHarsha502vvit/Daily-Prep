# 🐧 Linux CLI & Shell — Complete Guide

> **Navigation**: [< Git](01_Git_Version_Control.md) | [Index](00_INDEX.md) | [Next: Docker >](03_Docker_Containers.md)

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
│         │  (Interpreter)│                  │
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

# 6. Check disk space
df -h

# 7. Check network connections
ss -tlnp | grep 8080
```

## Log Analysis One-Liners

```bash
# Count errors per hour
grep "ERROR" app.log | awk '{print $1, $2}' | cut -c1-13 | sort | uniq -c

# Top 10 slowest API calls
grep "response_time" access.log | awk '{print $NF, $7}' | sort -rn | head -10

# Find unique IP addresses attacking your server
grep "401" access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Monitor log in real-time, filtered
tail -f app.log | grep --line-buffered "ERROR"
```

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

## Exercise 3: Write a Backup Script
```
Script that:
1. Takes a directory as argument
2. Creates a timestamped tar.gz backup
3. Deletes backups older than 7 days
4. Logs actions to a log file
```

---

> **Next Chapter**: [Docker & Containers →](03_Docker_Containers.md)


---

> **Navigation**: [< Previous](01_Git_Version_Control.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](03_Docker_Containers.md)