# CSE402 — Computer Networks

> **Part of:** [Semester 4 (S04)](../README.md) — Systems & Networking  
> **Prerequisite:** [Semester 3 (S03)](../S03/README.md) — Data Structures, Algorithms, Operating Systems  
> **Cross-references:** [Linux CLI & Shell](../S03/CSE301_Software_Engineering/13_Developer_Essentials/02_Linux_CLI_Shell.md), [DevOps](../S05/CSE501_DevOps/), [Enterprise Java](../S03/CSE301_Software_Engineering/07_Modern_Java/), [Microservices](../S05/CSE501_DevOps/20_Enterprise_Microservices/)

---

## Course Description

Computer Networks is the study of how distributed systems communicate — from electrons on a copper wire to HTTP requests between a browser and a cloud service. This course covers the full protocol stack (physical → application), dissects real packet captures, and culminates in building a working TCP proxy and HTTP load balancer from scratch.

**Total estimated time:** ~25 hours (16 weeks, ~1.5h/week lecture + 1h/week lab)  
**Capstone (Week 16):** Build a mini TCP proxy or HTTP load balancer in Python/Java/Go  
→ **Capstone spec:** `projects/CAP02_Network_Stack_Project.md`

---

## Learning Outcomes

After completing this course, you will be able to:

| # | Outcome | Verified By |
|---|---|---|
| LO-1 | Map any protocol to its OSI layer and explain WHY it lives there | Unit 1 exam |
| LO-2 | Decode Ethernet, IPv4, TCP, and HTTP headers from raw bytes | Wireshark Lab 1 |
| LO-3 | Implement a TCP echo server and UDP client in Python using the socket API | Socket Programming Lab |
| LO-4 | Trace a DNS resolution, explain CNAME chains, and configure `resolv.conf` | DNS Lab |
| LO-5 | Explain TCP congestion control phases (slow start → CA → FA) with cwnd values | Congestion Control Lab |
| LO-6 | Design an IPv4 subnetting plan for a /16 CIDR block using VLSM | Subnetting Problem Set |
| LO-7 | Capture and interpret a TLS 1.3 handshake trace with `tcpdump` | Security Lab |
| LO-8 | Build a mini TCP proxy that forwards traffic between two endpoints | **Capstone** |

---

## 🗓️ 16-Week Syllabus

---

## UNIT 1 — Internet Architecture (Weeks 1–2)

**WHY this unit exists:** Every network bug, performance problem, and protocol fight is downstream of a fundamental truth — layers are abstractions built on contracts. If you don't know what each layer guarantees, you can't debug why your HTTPS request times out.

**What problem does this solve?** Before networking, every application reimplemented retransmission, routing, and framing from scratch. The OSI model standardised those solutions so the ecosystem could interoperate.

---

### Week 1 — Layers, Encapsulation & the TCP/IP Stack

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | OSI 7-layer model — WHAT each layer does and WHY | Kurose & Ross §1.3; RFC 1122 intro | Draw the 7 layers on paper from memory, then label one real request |
| 2 | TCP/IP 4-layer model vs OSI; Internet abstraction | Kurose & Ross §1.4; `13_Developer_Essentials/02_Linux_CLI_Shell.md` §Networking | Trace a packet's journey: browser → WiFi → ISP → CDN |
| 3 | Encapsulation: Application → Physical — header stacking | Kurose & Ross §1.5; RFC 792 (ICMP) | Label each header in a Wireshark frame of an HTTP GET |
| 4 | Packet switching vs circuit switching; latency/bandwidth/throughput | Kurose & Ross §1.2 | Compute bandwidth-delay product for a 1 Gbps link with 20ms RTT |
| 5 | Lab — `tcpdump` first capture | — | Run `sudo tcpdump -i any -n -c 20` while loading a website; interpret each line |
| 6–7 | Problem Set NET-PS1 | — | `assignments/PS1_Network_Fundamentals.md` |

**Key equations (Week 1):**

```
Bandwidth-Delay Product (bytes) = bandwidth (bits/s) × round-trip time (s) / 8
Throughput = min(bottleneck_bandwidth, receiver_window / RTT)
Propagation delay = distance / propagation_speed  (≈ 2×10⁸ m/s in fiber)
Transmission delay = packet_size / bandwidth
```

**Production incident — Week 1:**
> **Cloudflare 2021-10-04:** A router firmware bug caused a 30-minute outage affecting 19% of the Internet. Root cause: a BGP routing update loop interacted with the TTL expiry mechanism at Layer 3, causing packets to enter a forwarding loop and exhaust line-card buffers. Had engineers understood the difference between a routing loop and a transient packet loss at the packet-switching layer, the incident would have been diagnosed in minutes instead of 28 minutes.

---

### Week 2 — Performance Metrics & Queuing Theory Basics

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Throughput vs goodput vs bandwidth; FIFO queuing | Kurose & Ross §1.4; `22_DevOps/` §Monitoring | Plot throughput curve for a link with increasing load |
| 2 | Queuing theory: Little's Law, M/M/1 queue model | Stanford CS144 Lecture 1 notes | Compute avg queue depth given λ=100 pkts/s, μ=120 pkts/s |
| 3 | Loss, delay, and jitter — where each comes from | Kurose & Ross §1.4 | Use `ping` and `iperf3` to measure RTT variance on your LAN |
| 4 | `ss`, `netstat`, `/proc/net/` — kernel network stack visibility | `13_Developer_Essentials/02_Linux_CLI_Shell.md` §SystemDiag | Run `ss -s`, `netstat -su`, `cat /proc/net/sockstat` on your machine |
| 5 | Lab — Network simulation with `ns` or `mininet` | — | Simulate 3 flows competing on a 10 Mbps bottleneck link |
| 6–7 | Problem Set NET-PS2 | — | `assignments/PS2_Performance_Metrics.md` |

**Section Challenge 1 (Encapsulation):**
> A client sends a 400-byte HTTP GET over HTTPS on a gigabit Ethernet LAN. Walk the encapsulation process from application layer to physical. How many bytes leave the NIC? Include TCP, IP, and Ethernet headers.

<details>
<summary>Answer</summary>

```
Application:    400 bytes (HTTP payload, encrypted by TLS before TCP)
Transport:      + 20 bytes (TCP header)         = 420 bytes (segment)
                + 32 bytes (TLS 1.3 record)     = 452 bytes (TLS record)
Network:        + 20 bytes (IPv4 header)        = 472 bytes (IP packet)
Data Link:      + 14 bytes (Ethernet II header) = 486 bytes (Ethernet frame)
                + 4 bytes (FCS CRC)             = 490 bytes (wire)
Preamble/SFD:   + 8 bytes                       = 498 bytes total on wire
```

</details>

---

## UNIT 2 — Application Layer (Weeks 3–5)

**WHY this unit exists:** Application-layer protocols are where engineers spend 90% of their time. You write HTTP clients, parse DNS records, and configure load balancers — all tasks that require deep protocol knowledge, not just library familiarity.

**What problem does this solve?** Raw sockets give you octets. Application protocols define the grammar those octets must follow so clients and servers from different vendors can interoperate.

---

### Week 3 — HTTP/1.1, HTTP/2, and HTTP/3

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | HTTP/1.1 persistent connections, pipelining, chunked transfer | RFC 7230 §6.1; Kurose & Ross §2.2 | Capture a full HTTP/1.1 exchange in Wireshark; label each header |
| 2 | HTTP/2: framing, streams, multiplexing, header compression (HPACK) | RFC 9113; Cloudflare blog (HTTP/2 explained) | Inspect an HTTP/2 capture in Wireshark; count concurrent streams |
| 3 | HTTP/3: QUIC, 0-RTT, head-of-line blocking elimination | IETF RFC 9114; Fastly blog | Capture HTTP/3 traffic to a CDN that advertises it; compare RTT to HTTP/2 |
| 4 | WHY HTTP/3 exists: TCP head-of-line blocking in HTTP/2 | M.nott; Fastly §Head-of-line blocking | Draw a timeline of 3 HTTP/2 streams where Stream 2 packet is lost |
| 5 | Lab — HTTP client in Python (`urllib` + raw `socket`) | — | Send a raw HTTP/1.1 GET using Python `socket`; parse response headers manually |
| 6–7 | Problem Set NET-PS3 | — | `assignments/PS3_HTTP_Protocols.md` |

**HTTP/2 HEAD-OF-LINE BLOCKING — the core WHY:**

When HTTP/2 multiplexes multiple streams onto a single TCP connection, a single lost packet stalls ALL streams — not just the stream whose packet was lost. This is because TCP provides ordered delivery to the application layer; the HTTP/2 framers see the missing byte sequence number and block all stream processors until retransmission completes.

```
Timeline (HTTP/2 on TCP):
t=0:   Stream 1 data sent       [Seq 1-500]
t=5:   Stream 2 data sent       [Seq 501-1000]
t=10:  Stream 3 data sent       [Seq 1001-1500]
t=15:  Packet with Seq 700 lost ← TCP cannot deliver 501-1500 to app
t=15:  Stream 1 ← BLOCKED (waiting for 700)
t=15:  Stream 2 ← BLOCKED (waiting for 700)  ← HOL blocking!
t=15:  Stream 3 ← BLOCKED (waiting for 700)  ← HOL blocking!
t=50:  Retransmission of 700 arrives
t=50:  All 3 streams unblocked simultaneously
```

HTTP/3 fixes this by replacing TCP with QUIC (UDP-based), which provides independent stream-level ordering. Loss of a packet only stalls the stream that packet belonged to.

**Production incident — Week 3:**
> **YouTube HTTP/2 regression (2015):** YouTube switched to HTTP/2 and many users experienced slower page loads. Root cause: HTTP/2 multiplexing over a shared TCP connection meant that a single packet loss on any stream stalled the entire page render. Combined with cellular networks' high packet loss rates, this caused worse performance than HTTP/1.1's multiple connections. YouTube later reverted for mobile clients and moved to HTTP/3/QUIC as the standard approach.

---

### Week 4 — REST Design, gRPC, WebSockets & DNS

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | REST: resources, verbs, status codes, HATEOAS intro | `10_Enterprise_Systems/` §REST; Fielding dissertation §5 | Design REST API for a library management system; audit against Richardson Maturity Model |
| 2 | gRPC: Protobuf, bidirectional streaming, HTTP/2 under the hood | grpc.io/docs; `10_Enterprise_Systems/` §gRPC | Write a `.proto` file for a chat service; generate Python client and server |
| 3 | WebSockets: handshake, frame format, vs HTTP long-polling | RFC 6455; `10_Enterprise_Systems/` §WebSockets | Build a WebSocket echo server in Python; trace the upgrade handshake with Wireshark |
| 4 | DNS: namespace, record types (A, AAAA, CNAME, MX, NS, TXT, SOA) | Kurose & Ross §2.4; RFC 1035 | Trace DNS resolution for `github.com` with `dig +trace` |
| 5 | Lab — DNS resolution trace | — | Use `tcpdump -i any port 53` to capture a DNS query; decode the wire format |
| 6–7 | Problem Set NET-PS4 | — | `assignments/PS4_Application_Protocols.md` |

**DNS resolution trace — raw packet analysis:**

```bash
# Capture DNS query for github.com
$ dig +notcp +noednsignning github.com A

# Equivalent tcpdump output:
16:42:01.234567 IP 192.168.1.100.52341 > 8.8.8.8.53:  47230+ A? github.com.
# 47230 = Transaction ID
# + = Standard query
# A? = Query type A (IPv4 address)

# Response:
16:42:01.267891 IP 8.8.8.8.53 > 192.168.1.100.52341: 47230 1/0/0 A 140.82.121.4
# 1/0/0 = 1 answer, 0 authority, 0 additional
# A = 140.82.121.4
```

**Section Challenge 2 (REST vs gRPC):**
> You are designing a real-time collaborative document editor. List 3 scenarios where WebSockets is strictly better than gRPC streaming, and 2 where gRPC bidirectional streaming is strictly better than WebSockets. Be specific about the constraint that drives each choice.

<details>
<summary>Answer</summary>

**WebSockets strictly better:**
1. **Browser-native clients** — WebSockets requires no library; browsers have native `WebSocket` API. gRPC-Web requires a proxy and generates proxy code.
2. **Firewall/NAT traversal** — WebSockets runs over HTTP port 443; gRPC requires HTTP/2 which many enterprise firewalls still block.
3. **Text-frame debugging** — WebSocket frames can be inspected as UTF-8 text in devtools; gRPC uses Protobuf binary.

**gRPC strictly better:**
1. **Typed contracts across polyglot microservices** — gRPC's Protobuf schema generates type-safe clients in 10+ languages; WebSocket APIs require manual contract maintenance.
2. **High-volume low-latency internal calls** — gRPC over HTTP/2 uses binary framing (HPACK header compression + Protobuf body) vs WebSocket's text/opcode framing. At 100k RPS, this difference is measurable.

</details>

---

### Week 5 — CDN, Load Balancing & Application-Lab Day

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | CDN operation: anycast, geo-DNS, edge caching, cache invalidation | Cloudflare learning center; Fastly docs | Compare `Cache-Control` headers from `cloudfront.net` vs `akamai.net` |
| 2 | Load balancing: round-robin, least-connections, IP hash, weighted | `22_DevOps/` §LoadBalancing; Nginx upstream docs | Configure Nginx upstream block for 3 backend servers |
| 3 | Nginx config deep dive: rate limiting, rewrites, SSL termination | Nginx docs; `22_DevOps/` §Nginx | Write Nginx config that rate-limits `/api/` at 100 req/min per IP |
| 4 | Application-layer performance: keep-alive, pipelining, httpd tunables | Apache MPM docs; `22_DevOps/` §Performance | Tune `keepalive_timeout`, `max_keepalive_requests` for a high-traffic API |
| 5 | Lab — Build an HTTP/1.1 server in Python | — | Implement a basic HTTP server that handles GET, POST, and serves static files |
| 6–7 | Problem Set NET-PS5 | — | `assignments/PS5_Application_Layer_Deep_Dive.md` |

**Nginx upstream configuration example:**

```nginx
upstream backend {
    least_conn;  # Route to server with fewest active connections

    server 10.0.1.10:8080 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 weight=2 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 backup;  # Passive backup

    keepalive 32;  # Keep 32 idle keepalive connections per worker
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/api.example.com.pem;
    ssl_certificate_key /etc/ssl/api.example.com.key;

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

**YAML — Kubernetes NetworkPolicy:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-only-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
      tier: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
              tier: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
              tier: database
      ports:
        - protocol: TCP
          port: 5432
    - to:  # Allow DNS
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53
```

---

## UNIT 3 — Transport Layer (Weeks 6–8)

**WHY this unit exists:** The transport layer is where reliability is engineered. Application developers don't think about retransmission, ordering, or congestion — the transport layer handles it. If you don't understand what's happening here, you can't reason about latency spikes, connection failures, or why your "simple" API call times out at scale.

---

### Week 6 — TCP: 3-Way Handshake, Flow Control & Reliability

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | TCP segment format; flags (SYN, ACK, FIN, RST) | Kurose & Ross §3.4; RFC 9293 §3 | Decode a captured SYN packet: byte offsets for each header field |
| 2 | 3-way handshake: why 3, not 2; simultaneous open | Kurose & Ross §3.5; RFC 9293 §3.5 | Trace handshake in Wireshark: SYN → SYN-ACK → ACK with relative seq numbers |
| 3 | Flow control: sliding window, receiver buffer, window update | Kurose & Ross §3.6; RFC 9293 §3.8 | Capture and graph the receive window size over a long-lived HTTP/1.1 connection |
| 4 | Reliability: cumulative ACKs, selective ACKs (SACK), retransmission | Kurose & Ross §3.4; RFC 2018 (SACK) | Capture a retransmission event in Wireshark; identify duplicate ACKs |
| 5 | Lab — TCP client/server in Python | — | Implement TCP echo server; test with `nc` and capture the full session |
| 6–7 | Problem Set NET-PS6 | — | `assignments/PS6_Transport_Layer.md` |

**TCP 3-way handshake — annotated Wireshark trace:**

```
Frame 1:  192.168.1.100  →  93.184.216.34    TCP  68  [SYN]        seq=0
Frame 2:  93.184.216.34   →  192.168.1.100    TCP  68  [SYN, ACK]   seq=0 ack=1
Frame 3:  192.168.1.100  →  93.184.216.34    TCP  60  [ACK]        seq=1 ack=1

# After handshake:
# Client → Server: seq=1, next expected=1
# Server → Client: seq=0, next expected=1
# Connection established — both sides have confirmed each other's ISN
```

**Python TCP echo server:**

```python
import socket

def tcp_echo_server(host='0.0.0.0', port=9000):
    """Minimal TCP echo server — demonstrates socket API, blocking I/O."""
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port))
    srv.listen(5)
    print(f"Echo server listening on {host}:{port}")

    while True:
        conn, addr = srv.accept()
        print(f"Connection from {addr}")
        try:
            while True:
                data = conn.recv(4096)
                if not data:
                    break
                conn.sendall(data)  # Echo back — demonstrates TCP stream semantics
        except ConnectionResetError:
            pass
        finally:
            conn.close()

if __name__ == "__main__":
    tcp_echo_server()
```

---

### Week 7 — Congestion Control: AIMD, CUBIC & BBR

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Slow start: why it exists (bandwidth probing without prior knowledge) | Kurose & Ross §3.6; RFC 9002 | Trace cwnd growth from Wireshark; label each SS threshold doubling |
| 2 | Congestion avoidance: AIMD (Additive Increase, Multiplicative Decrease) | Kurose & Ross §3.6; RFC 2581 | Simulate AIMD in Python; plot cwnd over 50 RTTs with 2 loss events |
| 3 | TCP CUBIC (default Linux) vs Reno — why CUBIC exists | IETF RFC 8312; Linux kernel `net/ipv4/tcp_cubic.c` | Compare CUBIC and Reno cwnd growth on high-BDP links |
| 4 | TCP BBR (Bottleneck Bandwidth and Round-trip propagation time) | BBR paper (Cardwell et al.); Google BBR site | Explain WHY BBR is different from loss-based congestion control |
| 5 | Lab — Measure congestion control on your machine | — | Use `ss -i`, `nstat -az` to identify which CC algorithm your kernel uses |
| 6–7 | Problem Set NET-PS7 | — | `assignments/PS7_Congestion_Control.md` |

**AIMD Python simulation:**

```python
"""AIMD congestion control simulator — trace cwnd over loss events."""

def aimd_sim(ssthresh=64, cwnd_init=1, max_cwnd=1024, loss_events=3):
    cwnd, ssthresh = cwnd_init, ssthresh
    trace = []

    for rtt in range(50):
        trace.append((rtt, cwnd, ssthresh))
        if cwnd < ssthresh:
            cwnd *= 2          # Slow start: exponential
        else:
            cwnd += 1          # Congestion avoidance: additive increase

        # Simulate loss event
        if rtt in (15, 30, 45) and loss_events > 0:
            ssthresh = max(cwnd // 2, 2)
            cwnd = ssthresh   # Multiplicative decrease
            loss_events -= 1

        cwnd = min(cwnd, max_cwnd)
    return trace

# Output trace:
# RTT  cwnd  ssthresh
#  0    1      64
#  1    2      64
#  ...
#  6    64     64  ← slow start ends
#  7    65     32  ← loss: cwnd halved, ssthresh = 32
#  8    66     32
```

**Section Challenge 3 (Congestion Control):**
> An engineer observes that their application experiences exactly 10-second freezes at high load. After investigation, they find the kernel TCP RTO (Retransmission TimeOut) is 1 second. The freeze is 10× the RTO. What is happening and how would you fix it?

<details>
<summary>Answer</summary>

**What is happening:** Exponential backoff is compounding. When a packet is lost, the sender waits 1× RTO, then retransmits. If that retransmit is also lost, it waits 2× RTO (2 seconds), then 4×, then 8× — doubling each consecutive timeout. After 4 failed retransmissions: 1+2+4+8 = 15 seconds total wait. This is the TCP retransmission backoff mechanism.

The 10-second freeze suggests the application is hitting the **TCP keepalive timeout** or the application's own read timeout is set to 10 seconds, which fires before the retransmission completes.

**Fixes (apply one or more):**
1. Reduce application-level read timeout to something closer to expected RTT (e.g., 2–3 seconds for LAN, 5–10 seconds for WAN).
2. Enable `tcp_fast_open` to reduce handshake latency on repeated connections.
3. Use `tcp_syn_retries` tuning to reduce initial SYN retry intervals.
4. For real-time apps, switch to QUIC (UDP) which has 0-RTT or 1-RTT handshake and independent stream-level retransmission.
5. Profile the network path — if 10-second freezes are regular, the path likely has significant packet loss; address the root cause (congestion, link errors) rather than tuning timeouts.

</details>

---

### Week 8 — UDP, QUIC & Transport-Layer Lab Day

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | UDP: segment format, when to use it (why trade reliability for simplicity) | Kurose & Ross §3.3; RFC 768 | Write a UDP NTP client that reads time from a stratum-2 server |
| 2 | QUIC: stream multiplexing, connection migration, 0-RTT | IETF RFC 9000; RFC 9114 | Compare TLS 1.3 over TCP vs QUIC handshake latencies |
| 3 | DTLS: TLS over UDP — why it exists, when to use it | RFC 6347 | Capture a DTLS handshake with Wireshark; label each flight |
| 4 | QUIC vs TCP+TLS comparison table — know when to pick each | Cloudflare blog (QUIC vs TCP); IETF quic-trace | Make a decision matrix for VoIP, video streaming, and file transfer |
| 5 | Lab — UDP DNS client from scratch | — | Implement a DNS resolver that sends raw bytes and parses the response |
| 6–7 | Problem Set NET-PS8 | — | `assignments/PS8_UDP_QUIC.md` |

**Production incident — Week 8:**
> **Cloudflare DNS outage (2022-06-21):** A poorly deployed regex rule in the BGP route processor caused Cloudflare's network to advertise a more-specific route than intended, black-holing traffic for approximately 1 hour. The transport layer couldn't help — the packets were being dropped at the routing layer before they reached any transport-layer logic. Lesson: reliability at one layer cannot compensate for misconfiguration at another.

---

## UNIT 4 — Network Layer + Routing (Weeks 9–11)

**WHY this unit exists:** The network layer is the Internet's postal service — it figures out how to route any packet from any source to any destination, globally, without any single point of control. If you don't understand IP addressing, routing, and NAT, you can't diagnose why your service is unreachable in production.

---

### Week 9 — IPv4, IPv6 & Subnetting (VLSM)

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | IPv4 header format; TTL, fragmentation, DF bit, options | Kurose & Ross §4.3; RFC 791 §3.1 | Decode an IP header from a Wireshark capture byte-by-byte |
| 2 | IPv6: header format, extension headers, addresses (global unicast, link-local) | RFC 8200; Kurose & Ross §4.6 | Capture an IPv6 Neighbour Discovery exchange; examine ICMPv6 |
| 3 | Subnetting: FLSM and VLSM — the constraint that forces VLSM | Kurose & Ross §4.3; Cisco CCNA §Subnetting | Given `192.168.0.0/24`, subnet for: 120 hosts, 60 hosts, 30 hosts, 10 hosts |
| 4 | CIDR and route aggregation — why 60,000 BGP routes fit in routers | RFC 4632; BGP tutorial | Compute the aggregated route for 8 contiguous /24s |
| 5 | Lab — Python IP subnet calculator | — | Write a program that takes a CIDR and returns: network address, broadcast, first/last usable IP, and number of hosts |
| 6–7 | Problem Set NET-PS9 | — | `assignments/PS9_IP_Subnetting.md` |

**IPv4 header — byte-by-byte decode:**

```
0                   1                   2                   3
0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |   DSCP   |ECN|         Total Length          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Identification       |Flags|      Fragment Offset      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |   Protocol  |        Header Checksum         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (if IHL > 5)                       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**VLSM example:**

```
Network: 192.168.1.0/24  (256 addresses, 254 usable)

Requirement:  A: 120 hosts    B: 60 hosts    C: 30 hosts    D: 10 hosts

VLSM allocation:
  A: 192.168.1.0/25   → 128 addr, usable 126  ← largest block first
  B: 192.168.1.128/26 → 64 addr,  usable 62
  C: 192.168.1.192/27 → 32 addr,  usable 30
  D: 192.168.1.224/28 → 16 addr,  usable 14
  Remaining: 192.168.1.240/28 (reserved)
```

**Python subnet calculator:**

```python
import ipaddress

def subnet_info(cidr: str) -> dict:
    net = ipaddress.ip_network(cidr, strict=False)
    usable = list(net.hosts())
    return {
        "network":    str(net.network_address),
        "broadcast":  str(net.broadcast_address),
        "netmask":    str(net.netmask),
        "prefix_len": net.prefixlen,
        "total":      net.num_addresses,
        "usable_range": f"{usable[0]} – {usable[-1]}",
        "count":      len(usable),
    }

# Example:
>>> import json; print(json.dumps(subnet_info("192.168.1.0/24"), indent=2))
{
  "network": "192.168.1.0",
  "broadcast": "192.168.1.255",
  "netmask": "255.255.255.0",
  "prefix_len": 24,
  "total": 256,
  "usable_range": "192.168.1.1 – 192.168.1.254",
  "count": 254
}
```

---

### Week 10 — NAT, VPN (WireGuard) & Network Address Translation

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | NAT: why it exists (IPv4 address exhaustion), types (static, dynamic, PAT) | Kurose & Ross §4.4; RFC 3022 | Trace a PAT translation in Wireshark; map internal port to external port |
| 2 | NAT traversal: hole punching, STUN, TURN, ICE | RFC 5389; RFC 8489 | Explain why P2P UDP in NAT'd environments is hard |
| 3 | WireGuard: cryptographic WireGuard handshake, tunnel interface | WireGuard whitepaper; ArchWiki WireGuard | Set up a WireGuard VPN between two VMs; capture handshake with tcpdump |
| 4 | VPN types: PPTP, L2TP/IPsec, OpenVPN, WireGuard comparison | WireGuard site; OpenVPN docs | Compare WireGuard vs OpenVPN on: handshake latency, throughput, attack surface |
| 5 | Lab — Packet forwarding with `iptables` NAT | — | Configure NAT on a Linux router; verify with `tcpdump` and `ss` |
| 6–7 | Problem Set NET-PS10 | — | `assignments/PS10_NAT_VPN.md` |

**WireGuard handshake — tcpdump trace:**

```bash
# Capture WireGuard UDP traffic (port 51820)
$ sudo tcpdump -i wg0 -n -vv port 51820

# Handshake initiation (MessageType = 1):
# WireGuard sends cookie reply mechanism to prevent DoS
# After authentication, peers exchange session keys
# Traffic: encrypted UDP — Wireshark can decrypt with preshared key

14:23:01.234567 IP 10.0.0.1.51820 > 10.0.0.2.51820: UDP, length 92
    # First message: handshake initiation (timestamp, ephemeral pubkey)
14:23:01.235012 IP 10.0.0.2.51820 > 10.0.0.1.51820: UDP, length 92
    # Response: handshake response (timestamp, encrypted reply)
14:23:01.235123 IP 10.0.0.1.51820 > 10.0.0.2.51820: UDP, length 148
    # Final handshake packet (empty encapsulated message — confirms session)
# Session keys established; data plane begins
```

---

### Week 11 — Routing Algorithms, BGP Basics & SDN Intro

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Routing algorithms taxonomy: link-state vs distance-vector | Kurose & Ross §4.5; RFC 2328 (OSPF) | Implement Dijkstra's algorithm; trace shortest path through a 6-node graph |
| 2 | OSPF: areas, LSA flooding, DR/BDR election | RFC 2328; Kurose & Ross §4.6 | Configure OSPF on two Linux routers using `frr` or `quagga` |
| 3 | BGP: AS numbers, path vector, eBGP vs iBGP | Kurose & Ross §4.7; RFC 4271 | Use `bgpdump` to analyze real BGP MRT data from RIPE RIS |
| 4 | BGP prefix hijacking — real incident analysis (AWS Route 53, 2020) | OracleDyn incident report; BGPalerter docs | Trace how a BGP hijack propagates; write a detection rule |
| 5 | SDN intro: OpenFlow, control plane / data plane separation | Open Networking Foundation; Kurose & Ross §4.8 | Write a simple POX/OpenFlow controller rule that forwards ARP |
| 6–7 | Problem Set NET-PS11 | — | `assignments/PS11_Routing_SDN.md` |

**BGP path vector example:**

```
# BGP route to 8.8.8.0/24 (Google DNS) from AS 64473
$ bgpdump -m -T 202406010000 < routeviews-rv2-20240601-1200.bgp.gz | grep "8.8.8"

TABLE_DUMP_V2|1622534400|B|10.0.0.1|64473|8.8.8.0/24|64473 2914 15169 36040 15169|
AS_PATH: 64473 → 2914 (Telia) → 15169 (Google)    ← path vector
NEXT_HOP: 10.0.0.1
LOCAL_PREF: 100 (default)
MED: 0
ORIGIN: IGP

# BGP policy: prefer shortest AS_PATH (2914 is only 2 hops)
# Contrast: 64473 → 174 → 15169 is longer (3 hops) despite lower local pref
```

**Production incident — Week 11:**
> **Amazon AWS BGP hijack (2018-04-24):** A BGP route leak from a Nigerian ISP (MainOne) caused traffic intended for Amazon's DNS (AWS Route 53) to be misdirected through the leaking ISP for 2 hours. This allowed the ISP to intercept traffic and issue fraudulent SSL certificates via Let's Encrypt. Root cause: MainOne accepted and re-advertised a more-specific prefix they had not been authorized to originate. Lesson: BGP RPKI (Resource Public Key Infrastructure) and ROA (Route Origin Authorisation) validation prevents prefix hijacking.

---

## UNIT 5 — Link Layer + Physical (Weeks 12–13)

**WHY this unit exists:** Every packet eventually travels over a physical link — copper, fiber, or radio. The link layer is where framing, addressing (MAC), collision detection, and error detection live. If you don't know what happens at this layer, you can't diagnose a "network cable problem" vs a "routing problem."

---

### Week 12 — Ethernet, ARP & Switch Operation

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Ethernet II frame format: preamble, SFD, type/length, FCS | Kurose & Ross §5.2; IEEE 802.3 | Decode an Ethernet frame in Wireshark; check FCS correctness |
| 2 | MAC addressing: unicast, broadcast (FF:FF:FF:FF:FF:FF), multicast | Kurose & Ross §5.2 | List all MAC addresses visible on your LAN from `ip neigh show` |
| 3 | ARP: request/reply, ARP cache, gratuitous ARP, ARP spoofing | Kurose & Ross §5.3; RFC 826 | Capture an ARP request in Wireshark; trace ARP cache entry timeout |
| 4 | Switch vs hub vs router — forwarding table, broadcast domain, collision domain | Kurose & Ross §5.4 | Use `ip link`, `bridge` to compare switch-like vs hub-like behaviour |
| 5 | Lab — Ethernet frame crafting with Scapy | — | Use Scapy to craft and send a custom Ethernet frame; verify receipt with tcpdump |
| 6–7 | Problem Set NET-PS12 | — | `assignments/PS12_Link_Layer.md` |

**ARP request — Wireshark decode:**

```
Ethernet II, Src: Dell_AA:BB:CC (00:14:22:AA:BB:CC), Dst: Broadcast (ff:ff:ff:ff:ff:ff)
    Type: ARP (0x0806)
    Padding: 000000000000000000000000000000000000

ARP, Request who-has 192.168.1.1 tell 192.168.1.105
    Hardware type: Ethernet (1)
    Protocol type: IPv4 (0x0800)
    Hardware size: 6
    Protocol size: 4
    Opcode: request (1)
    Sender MAC: 00:14:22:AA:BB:CC
    Sender IP: 192.168.1.105
    Target MAC: 00:00:00:00:00:00 (unknown — that's what we're asking)
    Target IP: 192.168.1.1
```

**Python ARP with Scapy:**

```python
from scapy.all import ARP, Ether, srp, conf
conf.sniff_promisc = True

def arp_lookup(ip: str, iface: str = "eth0") -> str | None:
    """Send ARP who-has and return the MAC address for `ip`."""
    pkt = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(op=1, pdst=ip)
    ans, _ = srp(pkt, iface=iface, timeout=3, verbose=False)
    if ans:
        return ans[0][1].src  # Get source MAC from response
    return None

# Usage:
>>> arp_lookup("192.168.1.1")
'00:11:22:33:44:55'
```

---

### Week 13 — WiFi (802.11), CSMA/CA & Error Detection

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | 802.11 CSMA/CA: why not CSMA/CD (hidden node problem) | Kurose & Ross §5.5; IEEE 802.11 §11 | Draw the CSMA/CA backoff window for 3 stations competing for one channel |
| 2 | WiFi frame types: management, control, data; beacon frames | IEEE 802.11; Wireshark 802.11 display filter guide | Capture WiFi management frames; identify beacon frames and SSID |
| 3 | Error detection: parity check, checksum, CRC-32 — WHY each has its domain | Kurose & Ross §5.2; RFC 3301 | Compute CRC-32 for a 4-byte frame manually; verify with Python's `binascii` |
| 4 | Error correction vs detection: Hamming distance, FEC vs ARQ trade-off | Kurose & Ross §5.2 | For a code with Hamming distance 4, how many bit errors are detectable? Correctable? |
| 5 | Lab — WiFi capture in monitor mode | — | Use `tcpdump -i wlan0mon` in monitor mode; capture and decrypt a WPA2 handshake |
| 6–7 | Problem Set NET-PS13 | — | `assignments/PS13_WiFi_Physical.md` |

**CRC-32 implementation (Python):**

```python
import binascii

def compute_crc(data: bytes) -> int:
    """Compute CRC-32 (Ethernet polynomial 0x04C11DB7)"""
    return binascii.crc32(data) & 0xFFFFFFFF

def verify_frame(data: bytes, received_crc: int) -> bool:
    """Verify Ethernet frame integrity using CRC-32."""
    return compute_crc(data) == received_crc

# Frame data (excluding CRC field):
payload = b'\x45\x00\x00\x28\x00\x01\x00\x00\x40\x06\x7c\x5e'  # IPv4 header
header  = b'\xca\xfe\xba\xbe\x00\x00'  # Ethernet II (no CRC in frame data)
frame   = header + payload

print(f"CRC-32: {compute_crc(frame):08x}")  # e.g., 0x1a3f5c8e
# Wireshark will show "CRC: OK" when this matches the FCS at end of frame
```

**Section Challenge 4 (CSMA/CA):**
> Two WiFi stations, A and B, are on opposite sides of an access point — the AP can hear both, but A and B cannot hear each other (the hidden node problem). Both have a frame ready to send at t=0. Using CSMA/CA with a slot time of 9μs and CWmin=15:
>
> (a) Show the backoff process for the first successful transmission.  
> (b) If RTS/CTS is used, how does this change the outcome?  
> (c) Why is RTS/CTS not always enabled on modern WiFi?

<details>
<summary>Answer</summary>

(a) **CSMA/CA backoff without RTS/CTS:**
Both stations sense the medium → idle → wait DIFS (50μs) → pick random backoff slots in [0, CWmin=15].
- Station A picks slot 5. Station B picks slot 12.
- A transmits after 5×9μs = 45μs. B detects A's transmission and freezes its backoff counter.
- B resumes counting only after A's transmission ends + DIFS.
- A's frame succeeds if not collided. B will transmit later.

(b) **With RTS/CTS:**
- A sends RTS ( Request to Send) at t=DIFS + backoff.
- AP broadcasts CTS (Clear to Send). Both A and B receive CTS.
- B sets NAV (Network Allocation Vector) = CTS duration → B knows not to transmit.
- A transmits data after SIFS. B can only attempt after NAV expires.
- Result: hidden node problem solved. Data collision only occurs at AP (the node both can reach).

(c) **Why RTS/CTS is not always enabled:**
1. **Overhead** — RTS+CTS exchange adds ~50% overhead for small frames. For frames < 2347 bytes (the RTS threshold), the cost of RTS/CTS exceeds the cost of a data frame collision.
2. **Fairness** — RTS/CTS creates priority for the initiating station; high traffic in both directions can cause unfairness.
3. **Modern deployments** — Dense AP deployments use 802.11ax (MU-MIMO, OFDMA) which reduces collision probability via scheduled access, making RTS/CTS less necessary.
4. **Hidden nodes are rare in practice** — Most WiFi deployments have APs positioned to ensure clients can hear each other.

</details>

---

## UNIT 6 — Security & Debugging (Weeks 14–15)

**WHY this unit exists:** Network security is not a separate discipline — it's a lens applied at every layer. TLS secures the transport, IPsec secures the network layer, and Wireshark is your microscope for both. You cannot design or debug secure systems without understanding both the protocol and its failure modes.

---

### Week 14 — TLS 1.3, Certificate Verification & tcpdump Filters

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | TLS 1.3 handshake: full handshake (1-RTT), PSK, 0-RTT | RFC 8446; Cloudflare TLS 1.3 blog | Capture a TLS 1.3 handshake; annotate ClientHello, ServerHello, certificates |
| 2 | TLS 1.2 vs 1.3: what's removed (RSA key exchange, SHA-1, CBC) | RFC 8446 §1.3; SSL Labs TLS comparison | Capture TLS 1.2 handshake (to an old server) and compare to 1.3 |
| 3 | Certificate chain, CA, browser trust store, self-signed certs | RFC 5280; Let's Encrypt documentation | Inspect certificate chain in Chrome DevTools; trace from leaf to root CA |
| 4 | Certificate pinning, HSTS, CSP — defence in depth | OWASP TLS Cheat Sheet; `22_DevOps/` §Security | Configure HSTS header in Nginx and verify with `curl -I` |
| 5 | Lab — Capture and decrypt TLS traffic with Wireshark | — | Use Wireshark with RSA private key to decrypt a TLS session; inspect HTTP data |
| 6–7 | Problem Set NET-PS14 | — | `assignments/PS14_TLS_Security.md` |

**TLS 1.3 handshake trace (annotated):**

```
TCP SYN →      client_ip:52341  →  server:443     [SYN]
TCP SYN-ACK  ←  server:443     →  client_ip      [SYN, ACK]

TLS ClientHello (TCP segment, TLS record type 0x16):
  Version: TLS 1.2 (legacy, for backwards compat)
  Random: 32 bytes (client randomness)
  Cipher Suites: [TLS_AES_128_GCM_SHA256, TLS_AES_256_GCM_SHA384, ...]
  Supported Versions: [TLS 1.3]  ← actual version negotiation
  Key Share: client key share for X25519
  Signature Algorithms: [rsa_pkcs1_sha256, rsa_pss_rsae_sha256, ...]

TLS ServerHello (TLS record type 0x16, 1-RTT response):
  Version: TLS 1.3
  Random: server randomness
  Key Share: server X25519 key share
  Cipher Suite: TLS_AES_128_GCM_SHA256
  [Encrypted Extensions, Certificates, CertificateVerify, Finished follow]

# 0-RTT (TLS 1.3 early data):
# Client sends ApplicationData with 0-RTT key (derived from PSK)
# Risk: replay attacks — use with idempotency-aware servers
```

**tcpdump filters:**

```bash
# Capture only HTTP (not HTTPS) — inspect plaintext
sudo tcpdump -i eth0 'tcp port 80 and tcp[tcp[((tcp[12:1] & 0xf0) >> 2):2] = 0x4745' -A

# Capture TLS ClientHello with cipher suites
sudo tcpdump -i eth0 'tcp port 443 and tcp[((tcp[12:1] & 0xf0) >> 2)] = 22' -X

# BPF filter: capture only TCP SYN packets
sudo tcpdump -i any 'tcp[tcp[12] >> 4] == 6 and tcp[tcp[13] & 2 != 0]'

# Capture ICMP (ping) only
sudo tcpdump -i any icmp

# Capture DNS (both UDP and TCP/53)
sudo tcpdump -i any "port 53"

# Capture with ring buffer (no disk exhaustion)
sudo tcpdump -i eth0 -W 10 -C 100 -w /tmp/capture_%H.pcap host 192.168.1.100
```

---

### Week 15 — Wireshark Analysis & Network Troubleshooting Matrix

| Day | Topic | Read | Do |
|---|---|---|---|
| 1 | Wireshark display filters: `tcp`, `http`, `frame.len > 1000`, `tcp.analysis.retransmission` | Wireshark docs §DisplayFilters | Write a display filter that shows only TCP retransmissions and their original segments |
| 2 | Wireshark follow modes: TCP stream, HTTP request/response, TLS stream | Wireshark docs §Follow | Use Follow → TCP Stream to reassemble a chunked HTTP response |
| 3 | Expert info: duplicate ACKs, zero window, keep-alive — what each means | Wireshark Wiki §ExpertInfo | Capture and interpret all expert info levels for a slow network connection |
| 4 | Network troubleshooting matrix: 5-tuple, latency, packet loss, jitter | `13_Developer_Essentials/02_Linux_CLI_Shell.md`; `22_DevOps/` §Monitoring | Build a checklist that takes a symptom and maps to root cause |
| 5 | Lab — Full packet capture analysis | — | Analyze a 5-minute pcap; produce a report: top talkers, protocol breakdown, errors |
| 6–7 | Problem Set NET-PS15 | — | `assignments/PS15_Debugging_Lab.md` |

**Network troubleshooting matrix:**

```
Symptom                          Layer   Tools                        Likely Cause
─────────────────────────────────────────────────────────────────────────────────
"Connection refused"             L4      telnet, ss -tlnp             No process listening
"Connection timed out"           L3/L4   ping, traceroute, mtr        Firewall DROP, no route
"High latency, consistent"       L3      traceroute, mtr, iperf3      Path length, queuing delay
"High latency, variable"         L7      ping -i 0.1, jitter calc     Network congestion
"Packet loss > 1%"               L2/L3   ping, tcpdump, iperf3        Congestion, link errors, duplex mismatch
"Throughput << expected"         L2/L4   iperf3, wireshark            Congestion, TCP CC, NIC offload, MTU
"TLS handshake failure"          L6      openssl s_client, Wireshark  Cert expiry, chain broken, cipher mismatch
"DNS resolution slow/fails"      L7      dig, nslookup, tcpdump port53 Root/NS unreachable, recursor misconfig
"HTTP 408 / request timeout"     L7      tcpdump, access log          Server overloaded, keepalive exhaustion
"SSLlabs rating drops to B"      L6      sslyze, openssl              RC4, TLS 1.0/1.1, weak DH param
"ARP cache poisoning suspected"  L2      arp -a, tcpdump arp          MITM, malicious ARP responses
```

**Wireshark display filter cheat sheet:**

```wireshark
# TCP analysis filters
tcp.analysis.retransmission          # Show retransmitted segments only
tcp.analysis.duplicate_ack           # Duplicate ACKs (signals loss)
tcp.analysis.zero_window             # Receiver window full — sender blocked
tcp.analysis.window_full             # Sender window full
tcp.analysis.keep_alive              # Keep-alive probes

# HTTP-specific
http.request.method == "POST"
http.response.code == 200
http.host contains "api.example.com"
http.content_length > 1000000

# Protocol hierarchy statistics: Statistics → Protocol Hierarchy
# IO graph (for throughput): Statistics → IO Graph

# Follow streams
# Right-click a packet → Follow → TCP Stream  (reassemble entire session)
```

**Production incident — Week 15:**
> **Stack Overflow DDoS (2019-03):** A coordinated DDoS attack peaked at 310 Gbps and used SSDP (Simple Service Discovery Protocol, port 1900) amplification. Attackers sent small requests spoofed with the victim's IP address; SSDP servers responded with large NOTIFY replies. Root cause: many SSDP servers are unpatched IoT devices on consumer networks. Mitigation: upstream ACLs blocking source-address spoofing (RFC 2827), BCP 38). Lesson: application-layer DDoS requires network-layer and application-layer mitigations working together.

---

## UNIT 7 — Capstone (Week 16)

### Build a Mini TCP Proxy or HTTP Load Balancer

**Estimated time:** 8–12 hours  
**Due:** End of Week 16  
→ **Full spec:** `projects/CAP02_Network_Stack_Project.md`

**Choose one:**

---

**Option A — Python TCP Proxy**

Implement a multi-client TCP proxy that:
- Accepts incoming connections on a configurable port
- Forwards traffic to a configurable upstream host:port
- Handles concurrent connections using `select` (no threading required)
- Tracks connection count and bytes transferred
- Logs each connection (source IP, target, bytes, duration)

```python
import socket, select, sys

class TCPProxy:
    """Minimal TCP proxy demonstrating select-based event loop."""

    def __init__(self, listen_port: int, upstream_host: str, upstream_port: int):
        self.listen_port   = listen_port
        self.upstream      = (upstream_host, upstream_port)
        self.buffer_size   = 65536

    def handle(self, client: socket.socket, upstream: socket.socket):
        """Bidirectional copy — stop when either end closes."""
        conns = [client, upstream]
        while conns:
            r, _, err = select.select(conns, [], conns, 1.0)
            for s in err:
                s.close()
                conns.remove(s)
            for s in r:
                data = s.recv(self.buffer_size)
                if not data:
                    s.close()
                    conns.remove(s)
                else:
                    peer = conns[1] if s is conns[0] else conns[0]
                    peer.sendall(data)
```

---

**Option B — HTTP Load Balancer (Python or Java)**

Implement an HTTP/1.1 load balancer that:
- Listens on port 8080
- Maintains a pool of N backend servers (configurable)
- Round-robin distribution
- Adds `X-Forwarded-For`, `X-Forwarded-Host` headers to upstream requests
- Returns `503 Service Unavailable` when no backends are healthy
- Exposes `/health` endpoint returning 200 OK (health check)

**Java (Spring Boot):**

```java
// See full spec: projects/CAP02_Network_Stack_Project.md
// Key components:
// - ServerSocket with thread-per-connection or NIO selector
// - Backend health tracking (Connection: close after each request)
// - Header injection (X-Forwarded-For, X-Forwarded-Host)
// - 503 fallback when all backends report unhealthy
```

**Nginx equivalent for reference:**

```nginx
upstream backend_pool {
    least_conn;  # Alternative: ip_hash for session affinity
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://backend_pool;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host  $host;
        proxy_next_upstream error timeout invalid_header http_500;
        proxy_intercept_errors on;
        error_page 502 503 = @fallback;
    }

    location /health {
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    location @fallback {
        return 503 "No backends available\n";
    }
}
```

---

## 📚 Reference Materials

| Resource | URL | Notes |
|---|---|---|
| Kurose & Ross — Computer Networking (8th ed.) | Library | Primary textbook; chapters referenced above |
| RFC 791 — IPv4 | datatracker.ietf.org/rfc/rfc791 | Canonical IP spec |
| RFC 9293 — TCP | datatracker.ietf.org/rfc/rfc9293 | TCP (obsoletes RFC 793) |
| RFC 9000/9114 — QUIC | datatracker.ietf.org/rfc/rfc9000 | QUIC transport protocol |
| RFC 8446 — TLS 1.3 | datatracker.ietf.org/rfc/rfc8446 | TLS 1.3 spec |
| RFC 826 — ARP | datatracker.ietf.org/rfc/rfc826 | ARP spec |
| Wireshark User Guide | wireshark.org/docs | Display filters, follow modes |
| Cloudflare Blog (Networking) | blog.cloudflare.com/tag/networking | HTTP/3, QUIC, TLS explainers |
| Stanford CS144 | cs144.github.io | Network layers lectures |
| Linux tcp(7) man page | man7.org/linux/man-pages/man7/tcp.7.html | TCP socket options |
| `ss(8)` man page | man7.org/linux/man-pages/man8/ss.8.html | Socket statistics |

---

## 📋 Assessment Breakdown

| Component | Weight | Details |
|---|---|---|
| Problem Sets (NET-PS1 to PS15) | 30% | One per unit; individual work |
| Labs (Wireshark + Socket Programming) | 25% | Submitted as pcap + code |
| Midterm (Weeks 1–8) | 20% | Written exam; OSI layers, TCP/UDP, HTTP, subnetting |
| Capstone (Week 16) | 25% | TCP Proxy or HTTP Load Balancer |

---

## 🔗 Navigation

| Prev | Course | Next |
|---|---|---|
| [S03 README](../S03/README.md) | Semester 3 — DSA, OS, Java | [CSE401 Operating Systems](../CSE401_Operating_Systems/README.md) |
| — | [S04 Overview](../README.md) | [CSE403 Cryptography & Security](../CSE403_Cryptography_And_Security/README.md) |
| — | [S04 Overview](../README.md) | [CSE404 Information Retrieval](../CSE404_Information_Retrieval/README.md) |

---

*Last updated: 2026-06-06*