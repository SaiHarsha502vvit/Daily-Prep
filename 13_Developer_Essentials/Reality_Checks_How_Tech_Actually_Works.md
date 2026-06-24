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
19. [SSL Certificates — You Can Make One Yourself, Free](#19-ssl-certificates--you-can-make-one-yourself-free)
20. [Self-Hosting on Your Own Server — The Full Reality](#20-self-hosting-on-your-own-server--the-full-reality)
21. [Practical Hosting Problems Nobody Warns You About](#21-practical-hosting-problems-nobody-warns-you-about)
22. [Domain Names — How They Actually Work](#22-domain-names--how-they-actually-work)
23. [Ports — What They Are and Why 80 and 443 Are Special](#23-ports--what-they-are-and-why-80-and-443-are-special)

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

## 19. SSL Certificates — You Can Make One Yourself, Free

### The confusion

People think: "I need to buy an SSL certificate from Verisign or GoDaddy for $100/year or my website won't be secure." This was true in 2013. It is completely false today, and was never the full picture even then.

### What a certificate actually is

An SSL/TLS certificate is a file containing three things:
1. **Your public key** (used by visitors to encrypt data sent to you)
2. **Metadata** — your domain name, company name, expiry date, what it's valid for
3. **A digital signature** from a Certificate Authority (CA) certifying that the above is legitimate

The certificate is NOT the thing that encrypts your connection. Your private key + the certificate together enable TLS. The certificate just answers: "Who are you, and can I trust that your public key is really yours?"

### Three types of certificates

**1. Self-signed certificate (you sign it yourself)**

You are both the certificate owner AND the signer. Zero cost, instant creation. The browser will show a scary red warning "Your connection is not private" because your signature is not from a trusted CA.

Create one in one command:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

This generates `key.pem` (private key) and `cert.pem` (self-signed certificate). nginx or Apache can use these immediately. The connection IS encrypted — TLS is working. But the browser has no way to verify YOU own `localhost` vs an attacker intercepting. Hence the warning.

**When to use self-signed:** Local development, internal tools where you trust the cert manually, machine-to-machine communication where you control both sides.

**2. Let's Encrypt (free, browser-trusted)**

Let's Encrypt is a non-profit Certificate Authority launched in 2014 by Mozilla, EFF, Cisco, and Akamai. They issue certificates for FREE and automate the entire process.

**How it works (the ACME protocol):**

You run Certbot (a program) on your server:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot does this automatically:
1. Generates a private key + certificate request on your server
2. Tells Let's Encrypt: "I claim to own yourdomain.com"
3. Let's Encrypt issues a challenge: "Place this specific random string at `http://yourdomain.com/.well-known/acme-challenge/RANDOM_TOKEN`"
4. Let's Encrypt's servers visit that URL and verify the file is there
5. Since only the actual domain owner can place files at that URL, Let's Encrypt is satisfied
6. Let's Encrypt signs your certificate and sends it back
7. Certbot installs it in nginx/Apache automatically
8. Certificate is valid 90 days (auto-renewal runs via cron)

**Result:** Free, browser-trusted, automated HTTPS. After 2016, the majority of new HTTPS certificates come from Let's Encrypt.

**3. Paid certificates (DigiCert, Comodo, GlobalSign)**

Same encryption as Let's Encrypt. The difference:
- **Organization Validation (OV):** CA verifies your company actually exists (checks business registration). Certificate shows company name. Costs ~$100-$300/year.
- **Extended Validation (EV):** Stricter verification process. Previously showed green bar with company name in browser. Browsers removed the green bar in 2019 because research showed users didn't notice it. Now almost pointless.
- **Wildcard:** `*.yourdomain.com` — covers all subdomains. Let's Encrypt supports free wildcards too (DNS challenge required).
- **Multi-domain (SAN):** One cert for `yourdomain.com`, `api.yourdomain.com`, `shop.yourdomain.com`. Let's Encrypt supports this too.

**The real reason people still buy certs:** Compliance requirements in some regulated industries, older systems that don't support automated ACME, or getting OV/EV for the company name display in enterprise contexts.

### The certificate chain of trust

When Let's Encrypt signs your certificate, the chain looks like:

```
Root CA (ISRG Root X1) ← built into your OS/browser by default
  └── Intermediate CA (Let's Encrypt R3) ← signed by Root CA
        └── Your certificate (yourdomain.com) ← signed by Intermediate CA
```

Your browser has ISRG Root X1's public key built in. It verifies:
- Is yourdomain.com cert signed by Let's Encrypt R3? → yes
- Is Let's Encrypt R3 signed by ISRG Root X1? → yes
- Is ISRG Root X1 in my trusted root store? → yes
- Trusted chain! Show green padlock.

Your server must send ALL three certificates (yours + intermediate + sometimes root) in what's called the **certificate chain** or **full chain**. Let's Encrypt's Certbot handles this automatically (`fullchain.pem`).

### Development with mkcert (trusted self-signed for local use)

The problem with standard self-signed certs: the browser warning is annoying in development and some APIs (like webcam/microphone access) require HTTPS even on localhost.

**mkcert** solves this:
```bash
mkcert -install          # installs a local CA into your system trust store ONCE
mkcert localhost 127.0.0.1 ::1   # generates a cert trusted for these addresses
```

Now your browser trusts `https://localhost` with no warning. The CA is only installed on YOUR machine — nobody else trusts it. Perfect for development.

### What happens when a certificate expires

The browser shows an error. Connections are blocked. Your site is effectively down.

Let's Encrypt certs last 90 days. If you use Certbot with the systemd timer or cron job it installs, it auto-renews. If you forget to set up auto-renewal: your site goes down every 90 days.

**The 2021 Let's Encrypt root expiry incident:** Let's Encrypt's root certificate (DST Root CA X3) expired on September 30, 2021. Millions of sites showed certificate errors — but only on old Android phones (≤Android 7.1) and old OpenSSL versions. The root certificate was no longer in their trust store. Modern browsers were unaffected. This highlighted that certificate trust is device-specific.

### Summary

| Certificate type | Cost | Browser trusted | How to get |
|-----------------|------|----------------|-----------|
| Self-signed | Free | No (manual trust only) | `openssl req -x509 ...` |
| Let's Encrypt | Free | Yes | `certbot --nginx -d domain.com` |
| mkcert (dev) | Free | Yes (your machine only) | `mkcert -install && mkcert localhost` |
| Paid OV/EV | $100-$2000/year | Yes | Buy from DigiCert/Comodo, prove identity |
| Wildcard (LE) | Free | Yes | `certbot --nginx -d domain.com -d *.domain.com` |

---

## 20. Self-Hosting on Your Own Server — The Full Reality

### What "self-hosting" means

Self-hosting means running your own server software rather than paying a managed service. Examples:
- Running your own GitLab instead of GitHub
- Running your own Nextcloud instead of Google Drive
- Hosting your own website on a VPS instead of Vercel/Netlify
- Running your own email server instead of Gmail
- Running your own Bitwarden (Vaultwarden) instead of 1Password

### Option 1: VPS (Virtual Private Server)

A VPS is the most common self-hosting setup. You rent a virtual machine from a provider (DigitalOcean, Linode/Akamai, Vultr, Hetzner, AWS EC2).

**What you get:** A root-access Linux server with a public IP address, in a data center, connected to fast internet (1-10 Gbps), running 24/7, starting at $4-6/month.

**What you must set up yourself (nothing is automatic):**
1. Choose a Linux distro (Ubuntu 22.04 LTS is most common)
2. Initial server hardening (disable root SSH, create non-root user, configure firewall)
3. Install your web server (nginx or Apache)
4. Install your application runtime (Node, Python, Java, PHP, etc.)
5. Configure your application as a systemd service (so it restarts on crash/reboot)
6. Point your domain's DNS to this IP address
7. Get a TLS certificate via Certbot
8. Configure firewall rules (ufw on Ubuntu)
9. Set up automated backups (to S3, Backblaze B2, or another server)
10. Set up monitoring (know when the server is down before your users tell you)
11. Keep the server patched (unattended-upgrades on Ubuntu)

**The complete nginx + Node.js + HTTPS stack on a VPS:**

```bash
# 1. Initial setup on fresh Ubuntu 22.04
adduser deploy
usermod -aG sudo deploy
# Copy your SSH key to deploy user, disable root SSH

# 2. Firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# 3. Install nginx
apt install nginx

# 4. Install Node.js (via nvm or NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
apt install -y nodejs

# 5. Deploy your app (git pull, npm install, etc.)
# Your app listens on port 3000 (NOT 80/443 directly)

# 6. Create systemd service for your app
# /etc/systemd/system/myapp.service
[Unit]
Description=My Node App
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/myapp
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target

systemctl enable myapp
systemctl start myapp

# 7. nginx config as reverse proxy
# /etc/nginx/sites-available/yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

# 8. Get HTTPS certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Certbot modifies nginx config automatically, adds HTTPS, sets up auto-renewal
```

After this: visiting `https://yourdomain.com` → nginx → proxies to `localhost:3000` (your Node app). Your app never handles TLS — nginx does.

### Option 2: Home server with port forwarding

You run a server on hardware you own at home (old laptop, Raspberry Pi, mini PC). Problems unique to this setup:

**NAT (Network Address Translation):** Your ISP gives your house ONE public IP address. Your router assigns private IPs (192.168.x.x) to all devices. Your server has a private IP that nobody on the internet can reach directly.

**Port forwarding:** You tell the router: "Any connection arriving on port 80 → forward to 192.168.1.100." Now external connections reach your server.

**Dynamic IP:** Most residential ISPs change your public IP every few days or weeks. Your domain's DNS points to an IP that becomes stale. Fix: Dynamic DNS (DDNS) — a program runs on your router or server, detects IP changes, and updates your DNS record automatically. Cloudflare has a free DDNS API. DuckDNS is a free DDNS service.

**ISP blocking ports 80 and 443:** Many ISPs block inbound connections on ports 80/443 for residential customers. They do not want you running web servers at home (it competes with their commercial hosting). Check your ISP's terms. Workarounds: use a non-standard port (but then your URL looks like `http://yourdomain.com:8080`), or use a tunnel (see below).

**Cloudflare Tunnel (formerly Argo Tunnel):** Free tool that punches through NAT and ISP port blocking entirely. Run a Cloudflare daemon on your home server. It creates an outbound HTTPS connection to Cloudflare. Traffic flows: visitor → Cloudflare → your home server (through the tunnel). You never open any ports on your router. Completely free for personal use.

### Option 3: Running on your own hardware in a data center (colocation)

You buy a physical server (~$500-5000), ship it to a data center ("colo facility"), pay $50-200/month for rack space, power, and internet connection. You own the hardware, they provide the facility and connectivity. Used by companies with very specific hardware requirements or large-scale operations.

### What self-hosting is NOT good for (for most people)

**Email server:** Running your own email server is notoriously painful.
- Getting email delivered (not to spam): requires PTR records, SPF records, DKIM signing, DMARC policy, IP reputation. Takes weeks to build up reputation.
- Gmail/Outlook aggressively reject email from new IPs or misconfigured servers.
- You are responsible for handling spam, virus scanning, queuing, bounce handling.
- Most experienced developers recommend using SendGrid/SES/Postmark for outbound and a paid email host (Fastmail, ProtonMail) for inboxes, rather than running your own.

**High-traffic websites:** A $6/month VPS has 1 vCPU and 1GB RAM. Under heavy traffic, it will struggle. Managed platforms (Vercel, Railway, Render) autoscale for you. Self-hosted scaling requires load balancers, horizontal scaling, database replication — all manageable but significant work.

---

## 21. Practical Hosting Problems Nobody Warns You About

### Problem 1: Your app crashes at 3 AM and you don't know for 8 hours

**What happens:** Node.js app throws an unhandled exception. Process exits. Port 3000 is now empty. nginx returns 502 Bad Gateway to all visitors.

**Why you don't know:** No one told you. Your server has no monitoring.

**Fix:**
1. Systemd with `Restart=always` restarts your process within seconds. Set this up.
2. UptimeRobot (free): pings your URL every 5 minutes, emails you if it gets a bad response. Takes 2 minutes to set up.
3. Structured logging + log shipping so you can see what crashed.

### Problem 2: The disk fills up silently

**What happens:** Your app logs to `/var/log/` or writes data. After weeks, disk is 100% full. Writes fail. App behaves strangely. Database corrupts.

**Fix:**
```bash
# Check disk usage
df -h
# Find what's large
du -sh /* 2>/dev/null | sort -hr | head -20
# Log rotation (should be automatic but check)
cat /etc/logrotate.d/nginx
```

Set up disk usage monitoring. Alert at 80%.

### Problem 3: SSH locked yourself out

**What happens:** You edit `/etc/ssh/sshd_config` incorrectly, restart SSH, disconnect. Now no SSH connections work. You cannot get back in.

**Fix before it happens:** Most VPS providers have a web-based console (DigitalOcean Recovery Console, Linode Lish). This bypasses SSH entirely. Use it to fix the config. Always have this URL bookmarked.

**The mistake:** Restarting sshd from the same SSH session without first testing `sshd -t` (syntax check) and opening a SECOND SSH connection to verify it still works.

### Problem 4: Environment variables in production are wrong

**What happens:** Your app works locally with `.env` file. On the server, the env var is set but the app reads a different one (wrong name, case sensitivity, loading order).

**Debug:**
```bash
systemctl show myapp --property=Environment  # see what envs systemd injects
sudo -u deploy env                            # see env as the deploy user
journalctl -u myapp -n 100                   # last 100 log lines of your service
```

**Fix:** Explicitly set ALL environment variables in the systemd unit file or a `.env` file loaded by your startup script. Never rely on "it's in my shell's .bashrc" — systemd does not source .bashrc.

### Problem 5: "It worked in HTTP but broke in HTTPS"

**What happens:** Your site runs fine on HTTP. After adding HTTPS, some things break.

**Common causes:**
- **Mixed content:** Your HTTPS page loads an image/script/font via `http://`. Browsers block mixed content. Fix: use `//domain.com/path` (protocol-relative) or `https://`.
- **Secure cookies:** If you set cookies without the `Secure` flag, they are not sent over HTTPS by some configs.
- **Hard-coded URLs:** Your app generates links as `http://yourdomain.com/page` — behind a proxy this becomes a problem. Fix: use `X-Forwarded-Proto` header to detect the original scheme, or set `proxy_set_header X-Forwarded-Proto https;` in nginx.
- **WebSocket upgrade:** WebSocket connections (`ws://`) must become `wss://` on HTTPS sites. Fix in nginx: pass the `Upgrade` and `Connection` headers (shown in the nginx config above).

### Problem 6: Database is accessible from the internet

**What happens:** You install PostgreSQL. It listens on port 5432 on all interfaces. Anyone can try to connect and brute-force passwords.

**Fix:**
```bash
# PostgreSQL should only listen on localhost
# In /etc/postgresql/15/main/postgresql.conf:
listen_addresses = 'localhost'

# UFW: do NOT open port 5432 to the internet
# Only allow from specific IPs if you need remote access:
ufw allow from 203.0.113.5 to any port 5432
```

**Connect remotely via SSH tunnel instead of opening port:**
```bash
ssh -L 5432:localhost:5432 user@yourserver.com
# Now psql -h localhost -p 5432 connects to the remote database via SSH tunnel
```

### Problem 7: Your SSL certificate expired because auto-renewal failed

**What happens:** Certbot auto-renewal failed silently because nginx config changed, or the port 80 challenge path is blocked by your nginx config, or the systemd timer was not enabled.

**Test auto-renewal manually:**
```bash
certbot renew --dry-run   # simulates renewal without actually renewing
```

**Check timer:**
```bash
systemctl status certbot.timer
systemctl list-timers | grep certbot
```

**Set up monitoring:** UptimeRobot or certificate monitoring services alert you when a cert expires within 30 days.

### Problem 8: Your server gets hit by a bot scan and CPU spikes

**What happens:** Within hours of setting up a server with a public IP, bots are scanning it. `fail2ban` logs show thousands of SSH login attempts. Your nginx logs show requests for `/wp-admin`, `/phpmyadmin`, `/.env`, `/config.php` — paths that don't exist on your server but attackers scan for.

**This is normal and expected.** The internet is adversarial. Any IP that exists will be scanned within minutes.

**Basic protections:**
```bash
# fail2ban: auto-ban IPs with too many failed SSH logins
apt install fail2ban
# Default config bans IPs after 5 failed attempts

# Change SSH port to something non-standard (stops script-kiddie bots)
# In /etc/ssh/sshd_config:
Port 2222

# Disable password auth entirely (SSH keys only)
PasswordAuthentication no
```

**More protection:**
- Cloudflare as reverse proxy: hides your real IP, provides DDoS protection, bot detection
- Rate limiting in nginx
- ModSecurity WAF (Web Application Firewall)

---

## 22. Domain Names — How They Actually Work

### The history

In the early 1970s ARPANET, each computer had a local text file called `HOSTS.TXT` that listed all known hostnames and their IP addresses. The file was maintained by the Stanford Research Institute and distributed to every host. By 1982, this was unsustainable — hosts were added faster than the file could be distributed.

Paul Mockapetris designed DNS in 1983, published in RFC 882 and 883. The distributed database structure that DNS uses has scaled to handle the entire modern internet without fundamental redesign.

### Who owns the domain name system

**ICANN** (Internet Corporation for Assigned Names and Numbers): Non-profit that coordinates domain names globally. They decide which TLDs exist (.com, .org, .io, .dev, etc.) and who operates them.

**Registry:** The organization that operates a TLD. Verisign operates `.com`. The Public Interest Registry operates `.org`. Each country has its own registry (NIXI for `.in`, DENIC for `.de`).

**Registrar:** A company you buy domain names from (GoDaddy, Namecheap, Google Domains/Squarespace, Cloudflare). They interact with the registry on your behalf. You pay the registrar, who pays the registry. You can transfer between registrars (your domain is locked to the registrar for 60 days after purchase to prevent transfer fraud).

**When you "buy" a domain:** You are renting it, typically 1-10 years. If you stop paying, it expires and anyone can buy it. Companies have lost domains worth millions by forgetting to renew.

### DNS record types

| Record | What it does | Example |
|--------|-------------|---------|
| `A` | Domain → IPv4 address | `yourdomain.com → 93.184.216.34` |
| `AAAA` | Domain → IPv6 address | `yourdomain.com → 2606:2800::1` |
| `CNAME` | Alias → another domain | `www.yourdomain.com → yourdomain.com` |
| `MX` | Mail exchange → where to deliver email | `yourdomain.com → mail.google.com priority 10` |
| `TXT` | Arbitrary text | Used for SPF, DKIM, domain verification |
| `NS` | Nameserver → who answers DNS queries | `yourdomain.com → ns1.cloudflare.com` |
| `SOA` | Start of Authority | Zone metadata, serial number for updates |
| `PTR` | Reverse lookup: IP → domain | `34.216.184.93.in-addr.arpa → yourdomain.com` |
| `SRV` | Service location | Used by SIP, XMPP, game servers |

### Propagation is not magic

When you change a DNS record, the new value does not instantly reach everyone. DNS records have a **TTL (Time To Live)** — a number of seconds that resolvers should cache the answer.

If your A record has TTL 3600 (1 hour), resolvers cache it for up to 1 hour. After you change the IP, some users still get the old IP for up to 1 hour. If you set TTL to 60 seconds before a migration, changes propagate in 1 minute.

**"DNS propagation takes 24-48 hours"** is outdated advice from when TTLs were commonly 86400 (24 hours). With Cloudflare or modern DNS, changes propagate in seconds to minutes if TTL is set low.

---

## 23. Ports — What They Are and Why 80 and 443 Are Special

### What a port is

An IP address identifies a machine. A port identifies a specific process on that machine. When your OS receives a TCP packet addressed to `93.184.216.34:80`, it looks up which process has registered to listen on port 80 and delivers the packet there.

Ports are 16-bit numbers: 0-65535.

**Port ranges:**
- 0-1023: **Well-known/system ports**. Require root/admin privileges to bind on Linux/macOS. HTTP=80, HTTPS=443, SSH=22, FTP=21, SMTP=25, DNS=53.
- 1024-49151: **Registered ports**. Commonly used by applications. PostgreSQL=5432, MySQL=3306, MongoDB=27017, Redis=6379, Node.js convention=3000.
- 49152-65535: **Dynamic/ephemeral ports**. Used by OS for client-side connections.

### Why port 80 and 443 are special

**HTTP=80:** When a browser visits `http://example.com` with no port specified, it uses port 80 by default. This is defined in RFC 2616.

**HTTPS=443:** When visiting `https://example.com`, port 443. Defined in RFC 2818.

Because 80 and 443 are below 1024, only root can start a process that listens on them. This is a Unix security feature — system services like web servers should be started by root, then drop privileges. But best practice for Node.js/Python apps is: run your app on a high port (3000, 8080) and put nginx in front on port 80/443. nginx runs as root briefly, then drops to `nginx` user.

**Why your home ISP blocks 80 and 443:** Preventing customers from running web servers. ISP terms of service typically prohibit running servers on residential connections. Commercial accounts (business internet) usually allow it.

**Why `localhost:3000` in development:** You cannot bind to port 3000 as a non-root user. Port 3000 requires no privileges. It's just a convention that many frameworks use.

**Firewall and ports:** Your server firewall (`ufw`, `iptables`, cloud security groups) controls which ports are reachable from the internet. A service can be running and listening on a port, but if the firewall blocks it, external connections fail. Always check both: is the service running? Is the firewall allowing the port?

```bash
ss -tlnp                   # show all TCP listening ports + which process
ufw status verbose         # show firewall rules
curl -I http://localhost   # test from inside the server
curl -I http://YOUR_IP     # test from outside
```

---

## How to Use This Guide

Read each section when you encounter the term in the wild and realize you only understood the surface. Return to sections when you are about to make a technology choice (section 8 on REST vs GraphQL vs gRPC, section 5 on VMs vs containers, section 15 on licenses).

The goal is not to memorize these — it is to have a mental model accurate enough that when you see a new piece of technology, you can ask the right questions: Who wrote the code that implements this? What layer does this live at? What problem in history was this built to solve? What does it NOT protect or handle?

That is the difference between a developer who uses tools and a developer who understands them.

---

*Related guides: [22_DevOps/](../22_DevOps/) for networking in practice | [14_Mental_Models/](../14_Mental_Models/) for decision frameworks | [13_Developer_Essentials/](.) for professional foundations*
