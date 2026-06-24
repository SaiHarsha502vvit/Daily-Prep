# Reality Checks: How Technology Actually Works

> This guide exists for one reason: most developers use technologies they do not actually understand. Not because they are not smart — but because nobody ever explained the backstory. Here we fix that. No abstraction. Full history. What runs where. Who wrote what.

---

## Table of Contents

1. [Protocols Are Specifications, Not Code](#1-protocols-are-specifications-not-code)
2. [The Networking Stack — What Actually Lives Where](#2-the-networking-stack--what-actually-lives-where)
3. [How the Internet Actually Works Step by Step](#3-how-the-internet-actually-works-step-by-step)
4. [Standards Bodies — Who Decides What Rules Exist?](#4-standards-bodies--who-decides-what-rules-exist)
5. [VMs, Containers, Docker — The Full Evolution](#5-vms-containers-docker--the-full-evolution)
6. [Browsers Are Not Simple — They Are Compilers for Four Languages](#6-browsers-are-not-simple--they-are-compilers-for-four-languages)
7. [JavaScript Is Not Java — Name Confusions That Mislead](#7-javascript-is-not-java--name-confusions-that-mislead)
8. [REST Is Not a Protocol](#8-rest-is-not-a-protocol)
9. [The Cloud Is Other People's Computers — And Here Is Why That Matters](#9-the-cloud-is-other-peoples-computers--and-here-is-why-that-matters)
10. [Compilation vs Interpretation vs JIT](#10-compilation-vs-interpretation-vs-jit)
11. [Processes vs Threads vs Coroutines](#11-processes-vs-threads-vs-coroutines)
12. [APIs vs Libraries vs SDKs vs Frameworks](#12-apis-vs-libraries-vs-sdks-vs-frameworks)
13. [SQL Is a Standard — Every Database Adds Its Own Dialect](#13-sql-is-a-standard--every-database-adds-its-own-dialect)
14. [Why Does C Run Faster Than Python?](#14-why-does-c-run-faster-than-python)
15. [Open Source Licenses — What They Actually Allow and Forbid](#15-open-source-licenses--what-they-actually-allow-and-forbid)
16. [What "Async" Actually Means at the Hardware Level](#16-what-async-actually-means-at-the-hardware-level)
17. [Encryption — What It Actually Does and Does Not Protect](#17-encryption--what-it-actually-does-and-does-not-protect)
18. [What Happens When You Type a URL and Press Enter](#18-what-happens-when-you-type-a-url-and-press-enter)

---

## 1. Protocols Are Specifications, Not Code

### The confusion

When someone says "TCP/IP" or "HTTP" or "IEEE 802.11," it sounds like something that runs on a computer. Developers often imagine there is a single piece of code called "TCP" somewhere. There is not.

### The history

In the 1960s, ARPA (the US military research agency) wanted to connect computers from different universities and manufacturers. The problem: IBM computers, DEC computers, and Honeywell computers all spoke completely different binary formats. If you connected them directly they could not understand each other.

The solution invented by Vint Cerf and Bob Kahn in 1974: define a **written agreement** about how computers must format their messages. If every machine follows the same written rules, they can all talk to each other regardless of who made them. That agreement is called a **protocol**.

A protocol is a **PDF document** (or in older times, a printed paper). It says things like:

> "A TCP segment MUST begin with a 16-bit source port number, followed by a 16-bit destination port number, followed by a 32-bit sequence number, followed by a 32-bit acknowledgment number..."

That document runs on no computer. It is a contract that computer programmers read and implement.

### Who writes the code

**TCP/IP implementation on Linux:** Written in C by Linux kernel developers. The file `net/ipv4/tcp.c` in the Linux source tree is ~6,800 lines. It was first written by Ross Biro in 1983 and has been modified by thousands of contributors since. When you call `connect()` in Python, your code eventually triggers this kernel code.

**TCP/IP on Windows:** Completely different code, written by Microsoft, in a file called `tcpip.sys`. Same rules (RFC 793), different implementation.

**WiFi (IEEE 802.11):** Part is implemented in **firmware** — code burned onto the WiFi chip by Broadcom or Qualcomm or Intel at the factory. Part is in the **kernel driver** that your OS loads. You never interact with either.

**HTTP in your browser:** Chrome's HTTP client is written in C++ in a folder called `net/http/`. When you call `fetch()` in JavaScript, Chrome's JS engine calls Chrome's HTTP C++ code which calls the OS socket API which calls the kernel TCP code which calls the driver which calls the hardware.

### The mental model

```
RFC 793 (TCP spec document — a PDF)
        │
        ▼ someone reads it and writes code
Linux kernel (net/ipv4/tcp.c)  ← the actual code
        │
        ▼ you call this
socket() connect() send() recv()  ← OS API you use from Python/Java/JS
```

**The rule:** A protocol name tells you the RULES. The operating system/hardware/browser tells you WHO IMPLEMENTED THEM.

### Reality check

When you `import requests` in Python and call `requests.get("http://example.com")`:
- `requests` library handles HTTP for you (Python)
- `requests` uses Python's `urllib3` or `httplib` module
- Which calls Python's `socket` module
- Which calls the OS `connect()` system call
- Which calls Linux kernel TCP code (C)
- Which calls your network card driver (C)
- Which signals your network card hardware (firmware, assembly)
- Which transmits electrical/radio signals (physics)

You wrote Python. Physics happened. Seven layers of other people's code ran in between.

---

## 2. The Networking Stack — What Actually Lives Where

### The confusion

People say "layer 3" or "the transport layer" and treat OSI model layers as if they are separate programs that run. They are not programs. They are conceptual divisions to explain who is responsible for what.

### The real question: who wrote each layer's code?

```
Layer 7 — Application (HTTP, FTP, SMTP, DNS)
│   Who writes this: YOU, or framework authors (Express, Django)
│   Where it runs: your process, in user space

Layer 6 — Presentation (encryption, encoding)
│   Who writes this: TLS library (OpenSSL, BoringSSL), also user space

Layer 5 — Session (connection management)
│   Who writes this: OS or your framework

Layer 4 — Transport (TCP, UDP)
│   Who writes this: OS kernel developers
│   Where it runs: inside the kernel, in kernel space

Layer 3 — Network (IP, routing)
│   Who writes this: OS kernel developers + router firmware writers
│   Where it runs: kernel space AND inside routers

Layer 2 — Data Link (Ethernet, WiFi MAC)
│   Who writes this: OS kernel driver + chip firmware
│   Where it runs: kernel space + hardware chip

Layer 1 — Physical (cables, radio signals)
│   Who writes this: hardware engineers, electrical engineers
│   Where it runs: physical world (voltage levels, radio waves)
```

### What "crossing a layer boundary" actually means in code

When TCP (layer 4) wants to send a packet, it does not call a function called "IP layer." It builds a buffer in memory with a TCP header prepended to your data. Then it calls the IP layer's send function, which prepends an IP header to that buffer. Then the Ethernet driver prepends an Ethernet frame header. This is called **encapsulation**.

```
Your HTTP data: "GET / HTTP/1.1\r\n..."
After TCP wraps it: [TCP header][your data]
After IP wraps it: [IP header][TCP header][your data]
After Ethernet wraps it: [ETH header][IP header][TCP header][your data][ETH tail]
```

This whole thing goes onto the wire. The receiving machine unwraps in reverse. Each layer strips its own header and passes the rest up.

### IP addresses vs MAC addresses — why both?

**MAC address** (Media Access Control): A hardware address burned into your network card at the factory. Like a serial number. Unique worldwide (in theory). `aa:bb:cc:dd:ee:ff`. 48 bits. Assigned by the manufacturer.

**IP address**: A logical address assigned by your network administrator (or DHCP server). Can be reassigned. `192.168.1.5`. 32 bits (IPv4) or 128 bits (IPv6).

**Why both?** MAC addresses are for LOCAL network delivery (same building, same WiFi). IP addresses are for GLOBAL routing (across the internet, across routers). When you send a packet to `8.8.8.8` (Google's DNS), your computer wraps it in an Ethernet frame addressed to your **router's** MAC address. The router unwraps the Ethernet frame, reads the IP address, wraps it in a new Ethernet frame addressed to the NEXT router's MAC, and sends it on. The IP address stays the same the whole trip. The MAC address changes at every hop.

**ARP (Address Resolution Protocol):** When your computer wants to send to an IP on your local network, it does not know the MAC. It broadcasts: "Who has IP 192.168.1.1? Tell me your MAC." The router replies: "That's me, my MAC is xx:xx:xx:xx:xx:xx." Now your computer knows what MAC to address the Ethernet frame to. This is ARP.

### Routers vs Switches vs Firewalls — the difference

| Device | Works at | What it does | Who writes the code |
|--------|----------|-------------|---------------------|
| **Switch** | Layer 2 (MAC) | Forwards frames between devices on the SAME local network | Switch firmware (Cisco, Juniper engineers) |
| **Router** | Layer 3 (IP) | Routes packets between DIFFERENT networks, forwards toward the destination IP | Router firmware — also implements TCP/IP in hardware |
| **Firewall** | Layer 3-7 | Inspects packets, drops ones that violate rules | Specialized firmware + kernel-level packet filtering (iptables on Linux) |
| **Load Balancer** | Layer 4 or 7 | Distributes incoming connections across multiple servers | nginx, HAProxy — regular software running on a server |

**The home router confusion:** What most people call a "router" is actually four things in one box: a router + switch + WiFi access point + NAT (Network Address Translation) device. The router chip runs a stripped-down Linux kernel.

---

## 3. How the Internet Actually Works Step by Step

### What happens when you open a browser and go to `https://github.com`

**Step 1: DNS — turning a name into an IP address**

Your browser does not know where `github.com` is. It only knows IP addresses. So first it asks: "What is the IP address for `github.com`?"

DNS (Domain Name System) is a **distributed phone book** running on thousands of servers worldwide.

1. Browser checks its own cache: "Have I looked up github.com recently?" If yes, use the cached IP.
2. OS checks its cache (`/etc/hosts` on Linux, also OS-level cache).
3. OS asks your **local DNS resolver** — usually your router (192.168.1.1) or your ISP's DNS or a public one like Google's 8.8.8.8.
4. If the local resolver doesn't know, it asks a **root nameserver** (there are 13 root servers worldwide): "Who handles `.com`?"
5. Root server replies: "Verisign handles `.com`. Ask them."
6. Local resolver asks Verisign: "Who handles `github.com`?"
7. Verisign replies: "GitHub's own nameservers. Ask `ns1.p16.dynect.net`."
8. Local resolver asks GitHub's nameserver: "What is the IP for `github.com`?"
9. GitHub's nameserver replies: `140.82.121.4`
10. Your OS now knows. This whole process takes 50-200ms, once.

The result is cached for the TTL (Time To Live) in the DNS record. GitHub sets TTL to 60 seconds.

**Step 2: TCP handshake — establishing a connection**

Your OS now knows to connect to `140.82.121.4` on port 443 (HTTPS).

TCP requires a three-way handshake before any data is sent:

```
Your computer → GitHub: SYN ("I want to start a connection. My sequence number is 1000.")
GitHub → Your computer: SYN-ACK ("OK. My sequence number is 5000. I acknowledge yours.")
Your computer → GitHub: ACK ("I acknowledge yours. Connection established.")
```

This takes one round-trip time (RTT). From a US city to GitHub's US servers: ~10-30ms.

**Step 3: TLS handshake — establishing encryption**

HTTPS means HTTP over TLS. Before any HTTP bytes, TLS must negotiate encryption.

```
Your computer: "I support TLS 1.3. Here are the cipher suites I support."
GitHub: "I'll use TLS 1.3, cipher AES-256-GCM. Here is my certificate."
Your computer: [verifies certificate against trusted Certificate Authorities built into your OS]
Both sides: [perform key exchange using elliptic curve cryptography]
Both sides: Now have a shared encryption key. No one on the wire saw the key.
```

This takes another 1-2 RTTs. Total so far: DNS + TCP + TLS = maybe 100-300ms before any content.

**Step 4: HTTP request**

Now your browser sends:
```
GET / HTTP/2
Host: github.com
Accept: text/html
Cookie: user_session=...
```

GitHub's servers (running on Linux, serving requests via nginx or similar) receive this, look up what to return, run application code (Ruby on Rails in GitHub's case), query a database, build an HTML response, and send it back.

**Step 5: Browser rendering**

The browser receives HTML bytes and starts building the DOM tree. It finds `<link rel="stylesheet">` → fetches CSS (new TCP connection or reuses existing). It finds `<script src="...">` → fetches JavaScript. It finds `<img>` tags → fetches images.

While fetching, it starts **layout**: computing where every element goes on the screen based on CSS rules. Then **paint**: drawing pixels. Then **composite**: assembling layers for GPU rendering.

**Total time for a page load: 100ms to 3 seconds** depending on server speed, number of resources, and network latency.

---

## 4. Standards Bodies — Who Decides What Rules Exist?

### The confusion

"Who decides what HTML is? Who made TCP? Who said WiFi should work this way?" It feels like these things were always there. They were not. People with specific problems invented them, got others to agree, and wrote it down.

### The major organizations

**IETF (Internet Engineering Task Force)**

Founded 1986. Publishes **RFCs (Request for Comments)**. This is the slightly humble-sounding name for internet standards. They are not actually requests — once accepted, they are the law.

RFCs cover: TCP (RFC 793), IP (RFC 791), HTTP/1.1 (RFC 2616), HTTP/2 (RFC 7540), HTTP/3 (RFC 9114), SMTP (email sending, RFC 5321), DNS (RFC 1034), TLS (RFC 8446).

Anyone can submit an RFC. They go through a working group review. The IETF has no government authority — compliance is voluntary but practically mandatory if you want to interoperate with the rest of the internet.

**IEEE (Institute of Electrical and Electronics Engineers)**

Founded 1963. Covers physical and data-link layer standards. Relevant standards:

| Standard | What it is |
|----------|-----------|
| 802.3 | Ethernet |
| 802.11 | WiFi (a/b/g/n/ac/ax/be are all 802.11 variants) |
| 802.15.1 | Bluetooth |
| 802.15.4 | Zigbee (IoT) |

**W3C (World Wide Web Consortium)**

Founded 1994 by Tim Berners-Lee (who invented the Web). Publishes standards for: HTML, CSS, SVG, WebAssembly, accessibility (WCAG), Web Audio, WebRTC, and hundreds more.

**WHATWG (Web Hypertext Application Technology Working Group)**

Founded 2004 by Apple, Mozilla, and Opera — in disagreement with W3C's direction. Publishes the **HTML Living Standard** (continuously updated, no version numbers). The HTML5 spec you actually use is the WHATWG one. W3C and WHATWG merged their HTML efforts in 2019.

**ECMA International**

Publishes **ECMAScript** — the formal specification for JavaScript. When browser developers say "we implement ES2022," they mean they read the ECMA-262 document and coded what it says. TC39 is the committee that proposes and votes on new JavaScript features.

**ISO (International Organization for Standardization)**

General international standards body. Relevant in tech: ISO 8601 (date formats: `2024-01-15`), ISO 3166 (country codes: `US`, `IN`, `DE`), C programming language standard (ISO/IEC 9899), C++ (ISO/IEC 14882), SQL (ISO/IEC 9075).

**Who enforces these standards?** Nobody has a gun. Compliance is enforced by the market: if your browser does not implement CSS correctly, websites look broken and users switch to a browser that does. If your router does not implement TCP correctly, it cannot communicate and no one buys it.

---

## 5. VMs, Containers, Docker — The Full Evolution

### The origin problem (1980s-1990s)

Physical servers were expensive. One server ran one operating system. One OS ran the company's applications. Problems:

1. **Version conflicts:** App A needs Python 2.7. App B needs Python 3.8. You cannot install both system-wide easily. Solution: two servers. Expensive.
2. **Resource waste:** Average server CPU utilization was 5-15%. You bought a $50,000 machine to use 10% of it.
3. **"Works on my machine":** A developer's laptop (macOS) has different library versions than the production server (RHEL). App behaves differently. Impossible to debug.
4. **Slow provisioning:** A new server takes weeks — procurement, shipping, racking, OS installation.

### Virtual Machines — the first fix (1998-2006)

**The key idea:** What if you could run multiple operating systems on one physical machine at the same time?

IBM actually had this in 1967 on their mainframes, but it was expensive and specialized. VMware brought it to commodity x86 hardware in 1998.

**How virtualization works:**

A **hypervisor** sits between the hardware and the guest OS. When a guest OS tries to execute a privileged instruction ("I want to control the real hardware"), the CPU traps it (stops it), hands control to the hypervisor, and the hypervisor simulates what the hardware would have done.

```
Physical Hardware (CPU, RAM, Disk, NIC)
        │
        ▼
Hypervisor (VMware ESXi, Microsoft Hyper-V, KVM)
        ├── VM 1: Ubuntu 20.04 + Java App     ← thinks it owns real hardware
        ├── VM 2: Windows Server + .NET App   ← thinks it owns real hardware
        └── VM 3: CentOS + PHP App            ← thinks it owns real hardware
```

**Results:** One physical server runs 10-50 VMs. CPU utilization goes from 10% to 70%. Huge cost savings.

**AWS launched in 2006** selling exactly this — renting you virtual machines on their physical hardware. The first EC2 instance type was m1.small: 1 virtual CPU, 1.7GB RAM, $0.10/hour.

**Problem with VMs:**

Each VM carries a **full OS copy**. Ubuntu base: ~200MB compressed. Windows Server: ~5GB. When you have 100 VMs, you have 100 copies of the OS kernel in RAM. Boot time: 30-60 seconds minimum.

For a company with thousands of VMs, this overhead is enormous. And if traffic spikes and you need 50 more application instances RIGHT NOW, waiting 60 seconds per VM is too slow.

### What Linux Already Had — Namespaces and cgroups

**Namespaces (2002-2009):**

Linux kernel developers added a feature: you can give a process its own **isolated view** of system resources, without giving it a separate OS.

```
Namespace      What the process sees differently
───────────    ──────────────────────────────────────────────────────
PID            Process thinks it's PID 1. Cannot see processes outside its group.
Network        Process has its own eth0, its own IP, its own routing table.
Mount          Process sees a different filesystem root (/). Its / is not the host's /.
User           Process thinks it is root. On the host, it is an unprivileged user.
UTS            Process thinks the hostname is "myapp-container" not "prod-server-42".
IPC            Process has its own shared memory and message queues.
```

These are implemented as kernel data structures. Creating a new namespace takes microseconds and zero extra memory for the OS kernel code — it shares the same kernel as the host.

**cgroups (Control Groups, 2007):**

cgroups let you attach LIMITS to a group of processes:
- Maximum RAM: 512MB. If exceeded → OOM kill.
- Maximum CPU: 25% of one core.
- Maximum disk I/O: 100MB/s read, 50MB/s write.
- Maximum network bandwidth.

These two features together — namespaces (isolation) and cgroups (resource limits) — are the foundation of containers. The kernel had them. What it lacked was a **user-friendly interface**.

### Docker — the wrapper that changed everything (2013)

Solomon Hykes, a French developer running a PaaS startup called dotCloud, built an internal tool to manage containerized processes. He open-sourced it on March 20, 2013, at PyCon. Within weeks it had thousands of GitHub stars.

Docker added three things on top of Linux namespaces + cgroups:

**1. Layered image format (UnionFS):**

A Docker image is a stack of read-only filesystem layers:
```
Layer 3 (your code): /app/main.py, /app/requirements.txt  [2 MB]
Layer 2 (pip install): /usr/lib/python3/site-packages/...  [120 MB]
Layer 1 (Ubuntu base): /bin, /usr, /lib, /etc, ...          [75 MB]
```

When 100 containers use the same Ubuntu base layer, the OS stores it ONCE. Containers share it read-only. Each container gets a tiny writable layer on top for its own changes.

**Result:** 100 containers that each "have their own Ubuntu" take only slightly more disk than 1 container. This is why `docker pull ubuntu` is 28MB and starting 100 containers from it is near-instant.

**2. Dockerfile — reproducible environment-as-code:**

```dockerfile
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y python3 pip
COPY requirements.txt /app/
RUN pip install -r /app/requirements.txt
COPY . /app/
CMD ["python3", "/app/main.py"]
```

This is a recipe. Anyone running `docker build` on this file, anywhere in the world, gets the exact same environment. The "works on my machine" problem disappears because development and production use the identical image.

**3. Docker Hub — a public image registry:**

Like npm for environments. `docker pull nginx` downloads a working nginx web server in 10 seconds. `docker pull postgres:15` downloads a working PostgreSQL database. You do not install these — you pull a pre-built image.

### Why this was revolutionary

Before Docker (2013): deploying an app meant writing a 40-page "Operations Runbook" — step-by-step instructions for the ops team to manually install all dependencies on the production server. Took hours. Error-prone.

After Docker: `docker run myapp`. Done.

### VMs vs Containers — the full comparison

| Property | VM | Container |
|----------|----|-----------| 
| Has its own OS kernel? | Yes — full copy | No — shares host kernel |
| Boot time | 30-60 seconds | Under 1 second |
| Memory for OS | 200MB-4GB | ~0 MB (shared kernel) |
| Disk for OS | 1-20 GB | ~0 (shared layers) |
| Isolation level | Hardware-enforced | Kernel namespace (slightly weaker) |
| Can run different OS? | Yes (Windows VM on Linux host) | No (must match kernel ABI) |

**When to use VMs:** Need strong isolation between customers (security), need to run Windows on Linux infrastructure, need predictable dedicated resources.

**When to use containers:** Same OS, need fast startup, need to pack many services on one machine, microservices, CI/CD pipelines.

### What came after Docker

**Kubernetes (2014):** Docker solves "run a container on one machine." Kubernetes solves "run 10,000 containers across 500 machines, restart crashed ones, route traffic, roll out updates without downtime." Originally built at Google (who had run containers internally since 2003 with a system called Borg). Open-sourced in 2014.

**Serverless (2014-):** AWS Lambda launched in 2014. You upload a function. AWS runs containers behind the scenes. You never think about containers. You are billed per invocation. Maximum execution time: 15 minutes. This is "serverless" — still runs on servers, you just do not manage them.

---

## 6. Browsers Are Not Simple — They Are Compilers for Four Languages

### The confusion

"A browser is just a program that shows web pages." This vastly undersells what a browser does.

### What a browser actually contains

A modern browser (Chrome, Firefox, Safari) is:

**1. An HTTP/HTTPS client** — downloads HTML, CSS, JavaScript, images. Implements TCP, TLS, HTTP/1.1, HTTP/2, HTTP/3.

**2. An HTML parser** — converts HTML text into a tree of objects (the DOM — Document Object Model). This is a full-specification parser that handles malformed HTML gracefully. The HTML spec has hundreds of pages just on error recovery rules.

**3. A CSS engine** — parses CSS, builds the CSSOM (CSS Object Model), resolves which CSS rules apply to which DOM elements (specificity rules, cascade, inheritance), computes the final `color`, `width`, `font-size`, etc. for every element.

**4. A layout engine** — given every element's style, computes WHERE on screen each element goes. This involves the block formatting context, float rules, flexbox algorithm, grid algorithm, text line-breaking, intrinsic sizing. Arguably the most complex piece.

**5. A JavaScript engine** — a full compiler and runtime for JavaScript. V8 (Chrome/Node.js) compiles JavaScript to machine code JIT (just-in-time). This is not interpretation — it generates x86/ARM assembly.

**6. A rendering pipeline** — takes the computed layout and paints pixels to screen using the GPU. Chrome uses Skia (2D graphics library). Modern browsers use compositing layers so that scrolling and animations happen on the GPU without re-running layout.

**7. A JavaScript API surface** — the `fetch()`, `localStorage`, `canvas`, `WebGL`, `WebAudio`, `WebRTC`, `IndexedDB`, `ServiceWorker` APIs. Each is a separate specification and implementation.

Chrome has approximately **35 million lines of code.** For comparison, Windows NT 3.1 had 4-5 million lines.

### The history of browser engines

**1993:** Mosaic — the first graphical browser. Written by Marc Andreessen and Eric Bina at NCSA. Rendered HTML, showed images inline. Changed the internet forever.

**1994:** Netscape Navigator — Mosaic people left, founded Netscape. Netscape hired Brendan Eich in 1995 to add a scripting language to the browser. He wrote the first version of JavaScript in 10 days. It was originally called Mocha, then LiveScript, then renamed to JavaScript to ride Java's marketing wave. Java had nothing to do with it.

**1995:** Microsoft released Internet Explorer (IE), bundled with Windows. Browser wars began. Netscape and IE implemented DIFFERENT APIs. Developers had to write `if (document.all)` (IE) vs `if (document.layers)` (Netscape) for the same feature.

**1998:** Netscape open-sourced their browser engine as the Mozilla project. Firefox grew from this.

**2003:** Apple launched Safari, using a fork of KHTML (a Linux browser engine). That fork became WebKit.

**2008:** Google launched Chrome, using WebKit at first. In 2013 Chrome forked WebKit to create Blink. V8 (Chrome's JS engine) was new — radically faster than existing JS engines through JIT compilation.

**Today's engines:**

| Engine | Used by | Who makes it |
|--------|---------|-------------|
| Blink + V8 | Chrome, Edge, Opera, Brave, 70% of browsers | Google |
| Gecko + SpiderMonkey | Firefox | Mozilla |
| WebKit + JavaScriptCore | Safari, all iOS browsers (forced by Apple) | Apple |

**Why all iOS browsers use WebKit:** Apple's App Store rules require all browsers on iOS to use WebKit for HTML rendering. Chrome on iPhone is Chrome's UI but WebKit's rendering engine. This is controversial and under regulatory scrutiny.

---

## 7. JavaScript Is Not Java — Name Confusions That Mislead

### JavaScript vs Java

**JavaScript:** Created by Brendan Eich at Netscape in 1995. Dynamic, prototype-based, single-threaded (one event loop), runs in browsers and servers (Node.js). Has nothing to do with Java technically.

**Java:** Created by James Gosling at Sun Microsystems in 1991 (released 1995). Compiled to bytecode, runs on JVM, class-based OOP, statically typed, multi-threaded.

**Why the name?** Pure marketing. Sun and Netscape had a cross-promotion deal. Netscape's language was named JavaScript to capitalize on Java's popularity. Eich has described it as a regrettable decision.

**Real differences:**

| Property | JavaScript | Java |
|----------|-----------|------|
| Type system | Dynamic (types at runtime) | Static (types at compile time) |
| OOP model | Prototype chain | Class-based inheritance |
| Concurrency | Single-threaded + event loop | Multi-threaded + locks |
| Memory management | Garbage collected | Garbage collected (JVM) |
| Compilation | JIT to machine code | Compiled to JVM bytecode |
| Primary use | Browser, server (Node) | Enterprise server, Android |

### Other common name confusions

**TypeScript vs JavaScript:** TypeScript is a SUPERSET of JavaScript — every JS file is valid TypeScript. TypeScript adds static type annotations. The TypeScript compiler (`tsc`) strips types and outputs plain JavaScript. TypeScript doesn't run in browsers; it compiles down to JS first.

**Python 2 vs Python 3:** Incompatible. Python 3 was released in 2008 with breaking changes. Python 2 reached end-of-life in 2020. Code written for one will often fail on the other. `print "hello"` (Python 2) vs `print("hello")` (Python 3).

**MySQL vs MariaDB:** MariaDB is a fork of MySQL created when Oracle bought Sun (which owned MySQL) in 2009. MySQL's original developers feared Oracle would commercialize it. MariaDB is largely compatible with MySQL. Most Linux distributions switched from MySQL to MariaDB as the default.

**node vs Node.js vs npm:** Node.js is the JavaScript runtime. npm (Node Package Manager) is the package manager for Node. They are separate programs. Node was written by Ryan Dahl in 2009 using V8 (Google's JS engine extracted from Chrome). `node` is the CLI command that starts the runtime.

**Git vs GitHub:** Git is the version control system, created by Linus Torvalds in 2005 in two weeks (he was frustrated with the existing tool BitKeeper). GitHub is a website that hosts Git repositories, founded in 2008, acquired by Microsoft in 2018. You can use Git without GitHub. GitLab and Bitbucket are competitors to GitHub, not alternatives to Git.

---

## 8. REST Is Not a Protocol

### The confusion

REST is often listed alongside HTTP, JSON, TCP as if it is a technology in the same category. It is not.

### What REST actually is

REST (Representational State Transfer) is an **architectural style** described in Roy Fielding's PhD dissertation in 2000. Fielding was one of the principal authors of HTTP/1.1. He observed that HTTP's design already embodied certain principles that made the early web scale incredibly well, and he wrote a dissertation describing those principles.

REST is six constraints:
1. **Client-server:** Separate UI from data storage.
2. **Stateless:** Each request contains all info needed to process it. Server stores no session state between requests.
3. **Cacheable:** Responses can be cached. HTTP cache headers implement this.
4. **Uniform interface:** Resources identified by URIs. Representation of resource separate from the resource itself. Self-descriptive messages.
5. **Layered system:** Client cannot tell if it's connected directly to the server or a proxy.
6. **Code on demand (optional):** Server can send executable code (JavaScript) to client.

**There is no REST standard document.** There is no RFC for REST. There is no IETF working group. It is an academic description of design principles.

### "RESTful API" in practice

When developers say "I built a RESTful API," they usually mean:
- Use HTTP verbs meaningfully: GET = read, POST = create, PUT/PATCH = update, DELETE = delete
- Use URLs to represent resources: `/users/123`, `/orders/456/items`
- Return JSON (though REST doesn't mandate JSON — it predates JSON)
- Stateless requests (pass auth token in every request, not in session)

Many "REST APIs" violate REST constraints and are more accurately called "HTTP APIs" or "JSON APIs." Roy Fielding himself has complained about this publicly.

### REST vs GraphQL vs gRPC — when to choose

**REST:** Standard HTTP API. Good for: public APIs, simple CRUD, wide client compatibility. Bad for: deeply nested data (N+1 query problem), clients with very different data needs.

**GraphQL:** Client specifies exactly what data it needs in a query. Server returns exactly that. One endpoint (`/graphql`). Invented by Facebook in 2012 for their mobile apps (which needed different data than their website). Good for: complex data graphs, multiple client types (mobile, web, desktop). Bad for: simple APIs (overkill), caching is harder.

**gRPC:** Uses Protocol Buffers (binary format) over HTTP/2. Strongly typed, fast, generates client code in many languages. Invented by Google. Good for: internal microservice communication, low latency, strongly typed contracts. Bad for: browser clients (gRPC-Web has limitations), human-readable debugging.

---

## 9. The Cloud Is Other People's Computers — And Here Is Why That Matters

### The history

**2002:** Amazon's internal systems were a mess — every team built their own servers, their own databases. Jeff Bezos sent an email (the "Bezos mandate"): all teams must expose their data through service interfaces. All services must communicate through these interfaces. No exceptions.

The side effect: Amazon became excellent at running scalable infrastructure as a service. In 2003, engineers Chris Pinkham and Benjamin Black wrote an internal paper proposing selling this infrastructure externally.

**2006:** AWS launched with S3 (storage) and EC2 (virtual machines). The first major customer: Dropbox. Instead of buying servers, Dropbox stored files on S3. This was controversial — storing customer data on Amazon's computers. But it let Dropbox launch with no upfront hardware cost.

**2008:** Google App Engine launched. Microsoft Azure launched. The cloud market began.

### What "the cloud" actually means

**Infrastructure as a Service (IaaS):** You rent virtual machines, storage, and networking. You install your own OS and software. AWS EC2, Google Compute Engine, Azure VMs. You manage everything above the hypervisor.

**Platform as a Service (PaaS):** You give the cloud provider your code. They run it on managed infrastructure. Heroku, Google App Engine, AWS Elastic Beanstalk. You manage your code and data. They manage the servers, OS, runtime.

**Software as a Service (SaaS):** You use finished software. Gmail, Salesforce, Slack. You manage your data only.

**Function as a Service (FaaS) / Serverless:** You give the cloud a function. It runs when triggered. AWS Lambda, Google Cloud Functions, Azure Functions. You manage only the function code and its trigger logic.

### What "availability zone" and "region" mean

Amazon operates data centers globally. A **region** is a geographic area: `us-east-1` (North Virginia), `eu-west-1` (Ireland), `ap-south-1` (Mumbai). There are ~30 regions.

An **availability zone** (AZ) is a physically separate data center within a region. `us-east-1a`, `us-east-1b`, `us-east-1c` are three separate buildings with separate power, cooling, and networking in Northern Virginia. If one building floods, the others keep running.

Designing for high availability means: run your app in 2+ AZs. Run your database with replicas in 2+ AZs. If one AZ goes down, traffic automatically routes to the other.

**The 2021 AWS us-east-1 outage:** AWS's main US region had an outage that took down Slack, Epic Games, Autodesk, and hundreds of other services. Why? Because everyone deployed to the same region. Services that were deployed across multiple regions stayed up.

### The economic reason cloud won

In 2006: buying a server meant: purchase order approval (weeks), delivery (weeks), racking (days), OS installation (days), network configuration (days). $5,000-$50,000 upfront cost. Total: 2-3 months before the server does anything useful.

On AWS in 2024: `aws ec2 run-instances --instance-type t3.medium --count 10`. 30 seconds. $0.0416/hour per instance. Zero upfront cost. Scale to 1000 instances for one hour and pay $41.60.

Capital expenditure becomes operational expenditure. Startups can launch with no hardware investment. Companies can scale for traffic spikes and scale back down (unlike physical servers which sit idle after Black Friday).

---

## 10. Compilation vs Interpretation vs JIT

### The confusion

"Python is interpreted, Java is compiled, C is compiled." This is oversimplified and increasingly inaccurate.

### What compilation actually means

**Compilation** transforms source code (human-readable text) into a different format. The question is: transformed into WHAT?

**Compiled to machine code (native):** C, C++, Rust, Go. The compiler (`gcc`, `rustc`, `go build`) reads your source file and outputs binary machine code for a specific CPU architecture (x86-64, ARM, etc.). This binary runs directly on the CPU. No other software is needed to run it (other than the OS and linked libraries).

```
main.c → [gcc] → main.exe (x86-64 machine code)
```

Advantage: maximum speed. The CPU executes your instructions directly.
Disadvantage: you must compile separately for each target platform (Windows x86 binary won't run on Linux ARM).

**Compiled to bytecode:** Java, C#, Python. The compiler (`javac`, `csc`, `python`) reads source and outputs bytecode — a compact binary format for a virtual machine, not for a real CPU.

```
Main.java → [javac] → Main.class (JVM bytecode)
```

The JVM (Java Virtual Machine) is a program that reads bytecode and executes it. "Write once, run anywhere" — the same `.class` file runs on any machine that has a JVM, whether Windows x86, Linux ARM, or macOS Apple Silicon.

**Interpreted:** Early JavaScript, early Python, Bash, Ruby (historically). The interpreter reads source code line by line and executes each line immediately.

```
script.py → [python interpreter reads line 1, executes it, reads line 2, executes it, ...]
```

Slower than bytecode because parsing overhead happens at runtime.

### JIT — Just-In-Time Compilation

Modern runtimes do neither pure interpretation nor pure compilation. They **JIT compile**: observe your running code, identify hot paths (code that runs frequently), compile THOSE paths to native machine code at runtime.

**V8 (JavaScript in Chrome/Node.js):**
1. First pass: parse JS, generate simple bytecode. Execute bytecode. Fast startup.
2. While running: V8's profiler notices which functions run thousands of times.
3. Hot functions: V8's Turbofan compiler compiles them to x86-64 machine code.
4. Next time those functions run: native machine code, no interpretation overhead.

**JVM (Java) with HotSpot:**
1. Execute JVM bytecode (fast — bytecode is compact and well-designed).
2. HotSpot profiler identifies hot methods.
3. JIT compiler compiles hot methods to native machine code.
4. Deoptimization: if assumptions made by the JIT turn out wrong, fall back to bytecode.

**Result:** Java and JavaScript performance is often within 2-5× of C for computation-heavy tasks. The 10× "interpreted language is slow" intuition is outdated.

**Python is the exception:** CPython (the standard Python) does not JIT. It executes bytecode in a C interpreter loop. PyPy (an alternative Python) does JIT and is 5-10× faster for compute-heavy code. Mojo (2023) compiles Python-like code to native code and is 35,000× faster for some ML workloads.

---

## 11. Processes vs Threads vs Coroutines

### The confusion

"My app is multi-threaded" is often said without understanding what that means at the OS level.

### Processes

A **process** is an isolated instance of a running program. The OS gives each process:
- Its own **virtual address space** (cannot read other processes' memory)
- Its own **file descriptor table** (open files)
- At least one **thread of execution**
- Its own **resource limits** (CPU time, memory, file handles)

When you run `python app.py`, the OS creates a process with PID 12345. When you run it again, a second process with PID 12346. They cannot access each other's memory without explicit IPC (inter-process communication: pipes, sockets, shared memory, message queues).

**Cost:** Creating a process: ~1-10ms. Switching between processes (context switch): ~1-10µs (microseconds).

### Threads

A **thread** (also called lightweight process) is a unit of execution WITHIN a process. Multiple threads share the same address space — they can read and write each other's variables. Each thread has:
- Its own **stack** (local variables, function call chain)
- Its own **instruction pointer** (where in the code it is executing)
- Its own **registers** (CPU state)

Threads within one process share: heap memory, global variables, open file handles, signal handlers.

**Cost:** Creating a thread: ~100µs-1ms. Context switching between threads: ~1µs.

**The threading problem:** If two threads write to the same variable simultaneously, the result is undefined (data race). You must use locks (mutexes) to coordinate. Locks introduce deadlock risk and performance overhead.

**Python's GIL (Global Interpreter Lock):** CPython has a GIL — a lock that only one thread can hold at a time. This means Python threads cannot truly run in parallel for CPU-bound code. Two Python threads on a 4-core machine still use only 1 core for Python code execution. I/O still benefits from threads (when a thread waits for I/O, it releases the GIL, another thread runs). This is why Python uses multiprocessing (separate processes, no GIL) for CPU parallelism.

### Coroutines (Async/Await)

A **coroutine** is a function that can pause its execution, yield control to other coroutines, and later resume from where it stopped. Unlike threads, coroutines are cooperative (they yield explicitly) and run on a SINGLE thread.

```python
async def fetch_data(url):
    response = await http.get(url)    # "I'm waiting for network, go do something else"
    return response.json()
```

When `fetch_data` hits `await http.get(url)`, it is not blocked — it tells the event loop "I'm waiting for network I/O, run other coroutines until it arrives." When the network data arrives, the event loop resumes this coroutine.

**Cost:** Switching between coroutines: ~1µs or less. Creating a coroutine: microseconds. No OS involvement — it is entirely managed in user space.

**When to use which:**

| Scenario | Use |
|----------|-----|
| CPU-heavy computation (number crunching, image processing) | Multiple processes (or threads if language supports true parallelism) |
| Many concurrent I/O operations (web server handling 10,000 requests) | Async/coroutines (single thread, very low overhead) |
| Isolating fault domains (crash in one should not crash others) | Separate processes |
| Shared data structures needing parallel modification | Threads with careful locking |

Node.js and Python asyncio use coroutines. Nginx uses an event loop (single-threaded coroutine-like model). Apache uses threads (one thread per request). This is why Nginx can handle 10,000 concurrent connections while using less RAM than Apache with 1,000.

---

## 12. APIs vs Libraries vs SDKs vs Frameworks

### The confusion

"Use our API/SDK/library/framework" — these words are used interchangeably but mean different things.

### API (Application Programming Interface)

An API is a **contract** — a defined set of functions/methods/endpoints that a piece of software exposes for others to use. An API defines:
- What inputs are accepted
- What output will be returned
- What errors can occur

APIs exist at multiple levels:
- **OS API:** Linux system calls (`open()`, `read()`, `write()`, `socket()`). Your program calls these to use kernel features.
- **Library API:** The functions a library exposes (`requests.get()`, `numpy.array()`).
- **Web API / HTTP API:** Endpoints on a server (`GET /api/users`, `POST /api/orders`).
- **Hardware API:** Drivers expose APIs for applications to use hardware (GPU API, audio API).

### Library

A library is a **collection of pre-written code** that you incorporate into your own code. It provides APIs. You call it; it does something and returns.

```python
import math
result = math.sqrt(16)   # You called math library's sqrt function
```

The library does NOT control your application flow. You call it when you want. Key distinction: **you are in control.**

### Framework

A framework is code that **calls your code**. You fill in the blanks; the framework calls them at the right time.

```python
# Flask web framework
@app.route("/users")
def get_users():          # Flask calls THIS function when GET /users arrives
    return User.all()
```

You did not write the HTTP server, the routing, the request parsing. Flask did. You wrote the handler. The framework calls it. Key distinction: **the framework is in control (Inversion of Control).**

**The Hollywood Principle:** "Don't call us, we'll call you." Your code sits in callbacks/handlers. The framework handles orchestration.

### SDK (Software Development Kit)

An SDK is a **package of tools** for developing applications for a specific platform. It typically includes:
- Libraries and APIs
- Development tools (compiler, linker, debugger)
- Documentation
- Sample code
- Build tools

Android SDK: Java libraries + Android APIs + `adb` tool + emulator + documentation. iOS SDK: Xcode + Swift/Objective-C libraries + Simulator + Instruments profiler.

AWS SDK for Python (`boto3`): Python library + authentication helpers + retry logic + pagination utilities. Makes calling AWS APIs easier than raw HTTP.

### Module / Package

A module is a single file of code (`math.py`). A package is a collection of modules distributed together (`numpy`, `express`, `spring-boot`). These are implementation terms, not design terms.

---

## 13. SQL Is a Standard — Every Database Adds Its Own Dialect

### The history

IBM researcher Edgar Codd published the relational model in 1970. IBM built a prototype called System R. IBM researchers Donald Chamberlin and Raymond Boyce created SEQUEL (Structured English Query Language) for it in 1974. Renamed SQL.

Oracle was the first commercial SQL database (1979). IBM released DB2 (1983). SQL was standardized by ANSI in 1986, ISO in 1987.

The SQL standard has been updated: SQL-89, SQL-92, SQL:1999, SQL:2003, SQL:2011, SQL:2016, SQL:2023.

### What every SQL database must implement (SQL-92 core)

```sql
SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, DROP TABLE
JOIN (INNER, LEFT, RIGHT, FULL OUTER)
WHERE, GROUP BY, HAVING, ORDER BY
Aggregate functions: COUNT, SUM, AVG, MIN, MAX
Data types: INTEGER, VARCHAR, DATE, DECIMAL
Constraints: PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE
```

### Where they diverge

| Feature | PostgreSQL | MySQL | SQLite | SQL Server |
|---------|-----------|-------|--------|------------|
| Auto-increment primary key | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` | `AUTO_INCREMENT` | `INTEGER PRIMARY KEY` (implicit) | `IDENTITY(1,1)` |
| Current timestamp | `NOW()` | `NOW()` | `datetime('now')` | `GETDATE()` |
| String concatenation | `\|\|` or `concat()` | `concat()` | `\|\|` | `+` |
| Limit rows | `LIMIT 10` | `LIMIT 10` | `LIMIT 10` | `TOP 10` (in SELECT) |
| JSON support | Native JSON/JSONB type, rich operators | JSON type (MySQL 5.7+) | JSON_extract() functions | JSON functions (SQL Server 2016+) |
| Window functions | Full support | Limited (MySQL 8.0+) | Partial | Full support |
| Full text search | Built-in tsvector | Built-in FULLTEXT index | FTS5 extension | Full-Text Search feature |

**ORMs and the abstraction:** This is why ORMs (Object-Relational Mappers like Hibernate, SQLAlchemy, Prisma) exist. They generate SQL that works on multiple databases. But they cannot always use database-specific features (PostgreSQL's JSONB operators, MySQL's FULLTEXT syntax). Sometimes you need raw SQL for performance-critical or database-specific queries.

**The practical rule:** If you are writing raw SQL, know which database you are targeting and check its documentation. Never assume MySQL SQL works on PostgreSQL or vice versa.

---

## 14. Why Does C Run Faster Than Python?

### The common answer (incomplete)

"C compiles to machine code, Python is interpreted." True but not the full story.

### The full picture

**1. Compilation: C → machine code, Python → bytecode + interpreted**

C code is compiled to CPU-native instructions. When `a + b` runs in C, the CPU executes one `ADD` instruction. Python's `a + b` executes: type check on a (is it int? float? string?), type check on b, call the appropriate `__add__` method, box the result in a Python object (heap allocation), return it. Perhaps 100 CPU instructions.

**2. Type information**

C knows at compile time that `a` is `int32_t`. The compiler generates the exact machine instruction for 32-bit integer addition. Python's `a` is a Python object — at runtime, Python must check what type it is before doing anything. This is the cost of dynamic typing.

**3. Memory layout**

In C: an array of 1000 integers is 1000 × 4 bytes = 4,000 bytes, stored contiguously in memory. CPU cache loads it efficiently.

In Python: a list of 1000 integers is 1000 Python objects scattered in the heap, plus a list of 1000 pointers to those objects. Total memory: ~28,000 bytes for the objects alone. Cache-unfriendly.

NumPy arrays fix this by storing actual C integers/floats in contiguous memory, which is why NumPy is 100× faster than Python lists for numerical work.

**4. Overhead per operation**

Python's interpreter loop executes ~10-50 million bytecode operations per second per core. A modern CPU executes ~1-3 BILLION instructions per second. The interpreter loop itself consumes most of those CPU instructions.

**5. When Python is fast enough**

For I/O-bound work (web requests, database queries, reading files): Python's speed does not matter. The bottleneck is the network or disk, not the CPU. Python is entirely adequate for most web applications, which spend >90% of their time waiting for I/O.

For CPU-bound computation: use NumPy (C under the hood), PyTorch (C++/CUDA under the hood), or write the hot loop in Cython/C extension. Python becomes the "glue" — slow parts are in C, Python orchestrates.

---

## 15. Open Source Licenses — What They Actually Allow and Forbid

### The confusion

"It's open source so I can use it for free and do anything with it." This is wrong in specific ways that have gotten companies into legal trouble.

### The spectrum

**Permissive licenses (MIT, Apache 2.0, BSD):**

The MIT license in its entirety (slightly paraphrased):
> "Do whatever you want with this code (use, copy, modify, merge, publish, distribute, sell). Keep this copyright notice in the code. No warranty."

You can take MIT-licensed code, modify it, and ship it in a closed-source commercial product without releasing your changes. React (MIT), Bootstrap (MIT), jQuery (MIT) — all usable in commercial products freely.

Apache 2.0 adds: any patents held by contributors that cover their contribution are licensed to you. Also adds a requirement to list modifications.

**Copyleft licenses (GPL, LGPL, AGPL):**

GPL (GNU General Public License) has a "viral" clause: if you distribute software that includes GPL code, you must release the **entire** combined work under GPL. Your source code must be made available.

This is intentional — Richard Stallman designed GPL in 1989 to prevent corporations from taking open source code, improving it, and not giving back.

Linux kernel is GPL. Any distribution of software that statically links to the Linux kernel must be GPL. (This is why Linux kernel modules have their own rules, and why some companies pay for commercial kernel licenses.)

**LGPL (Lesser GPL):** Like GPL but with a loophole for dynamic linking. You can dynamically link an LGPL library into your proprietary software without releasing your source. This is why many open source libraries use LGPL — they want corporate adoption. glibc (the standard C library) is LGPL, allowing proprietary software to link against it.

**AGPL (Affero GPL):** Closes the "SaaS loophole" in GPL. If you run GPL software over a network (as a service), users never receive the binary, so GPL's distribution clause doesn't trigger. AGPL says: if users interact with your software over a network, they must be able to get the source. MongoDB used AGPL before switching to their own license. This is why companies like Google have a policy of not using AGPL internally.

**Creative Commons:** For content (documentation, images, datasets), not code. CC0 = public domain. CC-BY = credit required. CC-BY-SA = share-alike (copyleft for content). CC-NC = non-commercial use only.

**Practical rules:**

| Scenario | Safe license |
|----------|-------------|
| Build a commercial product | MIT, Apache 2.0, BSD |
| Internal company tool | MIT, Apache 2.0, GPL (no distribution) |
| Build and distribute commercial software with open core | MIT/Apache for libs; avoid GPL unless ready to release |
| Open source everything anyway | Use whatever |

**The dual-licensing model:** MongoDB, MySQL, Qt use this. The library is open source under a copyleft license (GPL/AGPL). If you want to use it in proprietary software without releasing your source, buy a commercial license. Open source for open source projects, paid for commercial use.

---

## 16. What "Async" Actually Means at the Hardware Level

### The confusion

"Async makes things faster by running in parallel." This is partially wrong.

### The hardware reality

Your CPU can only execute one instruction per core at a time. Parallelism (true simultaneity) requires multiple cores.

Async does NOT create parallelism for a single-threaded language. In Node.js (single-threaded), async code runs on ONE thread on ONE core. At any moment, only one piece of JavaScript is executing.

### What async DOES do

Async allows the CPU to do useful work while WAITING for slow I/O.

Without async (blocking):
```
1. Thread starts HTTP request                  ← CPU busy
2. Thread BLOCKS waiting for response (150ms) ← CPU IDLE! Wasted.
3. Thread processes response                   ← CPU busy
4. Thread starts DB query                      ← CPU busy
5. Thread BLOCKS waiting for DB (20ms)        ← CPU IDLE! Wasted.
```

With async:
```
1. Event loop starts HTTP request, registers callback
2. Event loop starts DB query for a different user, registers callback (no waiting!)
3. Event loop handles another request entirely
4. HTTP response arrives → event loop invokes callback
5. DB response arrives → event loop invokes callback
```

The CPU is busy the whole time. It is handling OTHER WORK while waiting for I/O.

This is why Node.js can handle tens of thousands of concurrent connections on one thread: it is never waiting for I/O — it is always processing something while I/O is in flight.

### The kernel's role

The OS kernel has a feature called **I/O multiplexing**: `select()`, `poll()`, `epoll` (Linux), `kqueue` (BSD/macOS), `IOCP` (Windows). These system calls say: "Tell me when ANY of these file descriptors has data ready."

The event loop uses `epoll_wait()` — it hands a list of 10,000 open connections to the kernel and says "wake me when ANY of them have data." The kernel watches them at the hardware interrupt level (no CPU spinning). When a network packet arrives, the NIC raises an interrupt, the kernel processes it, and wakes up the process.

The Node.js event loop, Python asyncio, Nginx's event loop, Go's goroutine scheduler — all built on top of these kernel primitives.

---

## 17. Encryption — What It Actually Does and Does Not Protect

### What encryption IS

Encryption transforms plaintext into ciphertext that only someone with the key can read.

**Symmetric encryption (AES):** Same key encrypts and decrypts. Fast. Problem: how do two strangers on the internet share a key without someone on the wire seeing it?

**Asymmetric encryption (RSA, ECC):** Two keys — public and private. Encrypt with public key, only private key can decrypt. Or: sign with private key, public key verifies signature. The private key never leaves your machine.

**HTTPS uses both:** Asymmetric (RSA/ECDH) to exchange a symmetric key securely. Symmetric (AES) for the actual data — it is much faster.

### What TLS/HTTPS protects

**Protects:**
- Data in transit between your browser and the server
- An attacker on the same WiFi network cannot read the contents of your HTTPS requests
- An attacker cannot modify the content in transit (integrity protection)
- Server identity (the certificate verifies you are talking to real github.com, not an impostor)

**Does NOT protect:**
- Data on the server (if the server is hacked, HTTPS is irrelevant)
- Metadata: an attacker can still see that you are connecting to github.com (the IP address and hostname are visible even with HTTPS — only the path and body are encrypted)
- Anything after the connection (if the server logs your data unencrypted, your data is unencrypted in those logs)
- Against the server itself (the server can see all your data — you trusted it by connecting)

### The certificate trust chain

How does your browser know `github.com`'s certificate is genuine and not an attacker's fake?

**Certificate Authorities (CAs):** Companies that browsers trust by default (DigiCert, Let's Encrypt, Comodo, GlobalSign). Your OS and browsers ship with a list of ~150 trusted CAs.

When GitHub wants a certificate, they prove to DigiCert that they own `github.com` (by serving a specific file at a specific URL, or adding a DNS record). DigiCert then signs GitHub's certificate with DigiCert's private key.

Your browser verifies: "This certificate claims to be for github.com. It is signed by DigiCert. I have DigiCert's public key built into my OS. The signature is valid. I trust this certificate."

**Let's Encrypt** (2014): A non-profit CA that issues certificates for FREE and automates the process. Before 2014, certificates cost $100-$2000/year. Let's Encrypt made HTTPS accessible to everyone, accelerating the web's move from HTTP to HTTPS.

---

## 18. What Happens When You Type a URL and Press Enter

This is one of the most famous interview questions in software engineering. Here is the complete answer as a reference.

```
Browser checks cache: do I have a recent cached version of this page?
  └── If fresh cache exists: display it, done.

DNS Resolution:
  1. Browser cache (just looked this up recently?)
  2. OS cache (/etc/hosts, OS DNS cache)
  3. Router / local DNS resolver
  4. Recursive resolver walks the DNS tree: root → TLD → authoritative NS
  5. Returns IP address (e.g., 93.184.216.34)

TCP Connection:
  SYN → SYN-ACK → ACK (three-way handshake, 1 RTT)

TLS Handshake (for HTTPS):
  Client hello → Server hello + Certificate → Key exchange → Finished
  (1-2 RTTs, TLS 1.3 does it in 1 RTT)

HTTP Request:
  GET /path HTTP/1.1
  Host: example.com
  Accept: text/html
  [headers...]

Server Processing:
  Load balancer routes to application server
  Application server (nginx, Apache, Node, etc.) processes request
  Calls application code (routes request to handler)
  Handler queries database (possibly through cache like Redis first)
  Database returns data
  Handler formats HTML/JSON response

HTTP Response:
  HTTP/1.1 200 OK
  Content-Type: text/html
  [headers...]
  [HTML body...]

Browser Parsing and Rendering:
  Parse HTML → build DOM tree
  Find <link rel="stylesheet"> → fetch CSS (parallel)
  Find <script src="..."> → fetch JS (may block parsing)
  Find <img> → fetch images (parallel)
  Build CSSOM from CSS
  Combine DOM + CSSOM → Render Tree
  Layout: calculate position and size of each element
  Paint: draw pixels for each element
  Composite: assemble layers (GPU-accelerated)

JavaScript Execution:
  Parse JS → compile to bytecode → JIT hot paths
  Modify DOM/CSSOM → trigger layout/repaint as needed
  Make additional API requests (XHR/fetch)

User sees page.
```

Total time: 100ms (fast, nearby server) to 5+ seconds (slow server, many resources, bad network).

---

## How to Use This Guide

Read each section when you encounter the term in the wild and realize you only understood the surface. Return to sections when you are about to make a technology choice (section 8 on REST vs GraphQL vs gRPC, section 5 on VMs vs containers, section 15 on licenses).

The goal is not to memorize these — it is to have a mental model accurate enough that when you see a new piece of technology, you can ask the right questions: Who wrote the code that implements this? What layer does this live at? What problem in history was this built to solve? What does it NOT protect or handle?

That is the difference between a developer who uses tools and a developer who understands them.

---

*Related guides: [22_DevOps/](../22_DevOps/) for networking in practice | [14_Mental_Models/](../14_Mental_Models/) for decision frameworks | [13_Developer_Essentials/](.) for professional foundations*
