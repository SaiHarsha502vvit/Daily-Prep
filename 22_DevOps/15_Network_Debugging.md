> **Navigation**: [← SSH](14_SSH_Remote_Access.md) | [Index](00_INDEX.md)

# 🔬 Chapter 15: Network Debugging & Packet Capture — Finding The Problem

> _"'The network is broken' is the most useless troubleshooting statement ever. WHICH part of the network? DNS? TCP? TLS? Firewall? Load balancer? This chapter gives you the systematic methodology and tools to pinpoint the EXACT layer where things break."_

---

# PART 1: The Debugging Methodology — Layer by Layer

---

```
RULE #1: DEBUG BOTTOM-UP.
  Start at the physical/network layer. Work up to application.
  Don't blame the application until you've proven the network works.

THE SYSTEMATIC APPROACH:

STEP 1 — IS THE NETWORK REACHABLE? (Layer 3 — IP)
  ping 8.8.8.8                          # Can I reach the internet at all?
  ping 192.168.1.1                      # Can I reach my gateway?
  
  ping WORKS:   → IP connectivity is fine. Move up.
  ping FAILS:   → Check: cable/WiFi, interface up?, gateway reachable?
  ping to IP works but hostname fails: → DNS problem (skip to Step 2b).
  
  NOTE: Some servers block ICMP (ping). Failure doesn't ALWAYS mean unreachable.
  → Confirm with: nc -zv or curl.

STEP 2a — IS DNS WORKING? (Application support)
  nslookup api.myapp.com
  dig api.myapp.com +short
  
  Returns IP:  → DNS is fine.
  NXDOMAIN:    → Domain doesn't exist (typo? expired? wrong DNS server?)
  SERVFAIL:    → DNS server had an error (check /etc/resolv.conf)
  Timeout:     → DNS server unreachable (firewall? DNS server down?)
  
  Test different DNS servers:
  dig @8.8.8.8 api.myapp.com            # Google
  dig @1.1.1.1 api.myapp.com            # Cloudflare
  If one works but your default doesn't → your DNS server is the problem.

STEP 2b — WHAT PATH DO PACKETS TAKE? (Layer 3 — Routing)
  traceroute api.myapp.com               # Linux/macOS
  tracert api.myapp.com                  # Windows
  
  Shows every router hop. Look for where the trace STOPS or gets SLOW.
  
  * * * at hop 5:  → router 5 blocks ICMP OR there's a routing problem there.
  Sudden high latency at hop 8: → congestion at that ISP router.
  
  MTR (better than traceroute — continuous monitoring):
  mtr api.myapp.com
  → Shows: packet loss % and latency at EACH hop, updated live.
  → Let it run for 60 seconds for meaningful statistics.

STEP 3 — IS THE PORT OPEN? (Layer 4 — TCP/UDP)
  nc -zv api.myapp.com 443               # netcat: test TCP port
  nc -zvu api.myapp.com 53               # test UDP port
  
  "Connection succeeded":   → Port is open. Service is listening.
  "Connection refused":     → Port is closed. Service not running or wrong port.
  "Connection timed out":   → FIREWALL is blocking the port!
  
  Scan multiple ports:
  nmap -p 22,80,443,5432,8080 api.myapp.com
  
  Show what SERVICE is running on each port:
  nmap -sV api.myapp.com                # version detection
  # PORT    STATE SERVICE  VERSION
  # 22/tcp  open  ssh      OpenSSH 8.9p1
  # 443/tcp open  https    nginx/1.24

STEP 4 — IS TLS WORKING? (Layer 6 — Presentation)
  openssl s_client -connect api.myapp.com:443 -servername api.myapp.com
  
  Look for:
  "Verify return code: 0 (ok)"           → cert is valid
  "Verify return code: 10 (certificate has expired)" → cert expired!
  "certificate verify failed"            → wrong CA, self-signed, or hostname mismatch
  
  Check cert details:
  echo | openssl s_client -connect api.myapp.com:443 2>/dev/null | openssl x509 -text -noout

STEP 5 — IS THE HTTP ENDPOINT RESPONDING? (Layer 7 — Application)
  curl -v https://api.myapp.com/health
  
  Look at the verbose output:
  * Trying 54.123.45.67:443...           → DNS resolved, connecting
  * Connected                            → TCP handshake succeeded
  * SSL connection using TLS1.3          → TLS handshake succeeded
  > GET /health HTTP/2                   → request sent
  < HTTP/2 200                           → SUCCESS!
  
  Common errors:
  "Could not resolve host"  → DNS failure
  "Connection refused"      → port not open
  "Connection timed out"    → firewall blocking
  "SSL certificate problem" → TLS issue
  "HTTP 502 Bad Gateway"    → LB can't reach backend
  "HTTP 504 Gateway Timeout"→ backend too slow
```

---

# PART 2: tcpdump — Packet Capture on the Command Line

---

```bash
# tcpdump is the essential tool for seeing EXACTLY what's on the wire.
# It's like putting a microscope on your network interface.

# ── BASIC CAPTURES ──

# Capture all traffic on eth0
sudo tcpdump -i eth0

# Capture with readable timestamps and don't resolve hostnames
sudo tcpdump -i eth0 -n -tttt

# ── FILTERED CAPTURES ──

# HTTP traffic only (port 80)
sudo tcpdump -i eth0 port 80

# HTTPS traffic (port 443) — headers only (content is encrypted)
sudo tcpdump -i eth0 port 443

# DNS queries (port 53)
sudo tcpdump -i eth0 port 53 -vvv
# Shows: query type, domain name, response IPs

# Traffic to/from a specific IP
sudo tcpdump -i eth0 host 54.123.45.67

# Traffic from a specific SOURCE
sudo tcpdump -i eth0 src 192.168.1.100

# Traffic to a specific DESTINATION on a specific port
sudo tcpdump -i eth0 dst 54.123.45.67 and port 443

# Only SYN packets (new TCP connections)
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0 and tcp[tcpflags] & (tcp-ack) == 0'

# Only RST packets (connection resets — debugging refused connections)
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'

# ICMP (ping) packets
sudo tcpdump -i eth0 icmp

# ── OUTPUT OPTIONS ──

# Show packet content in ASCII (for unencrypted protocols!)
sudo tcpdump -i eth0 port 80 -A
# You'll see raw HTTP: "GET /users HTTP/1.1\r\nHost: api.myapp.com"

# Show packet content in HEX + ASCII
sudo tcpdump -i eth0 port 80 -X

# Save to file (for later analysis in Wireshark)
sudo tcpdump -i eth0 -w /tmp/capture.pcap

# Read from a saved capture file
sudo tcpdump -r /tmp/capture.pcap

# Limit capture to N packets
sudo tcpdump -i eth0 -c 100 port 443

# ── REAL-WORLD DEBUGGING EXAMPLES ──

# "Is the server receiving my request?"
# On the SERVER (run tcpdump on server):
sudo tcpdump -i eth0 port 8080 -n
# If you see SYN from client → packets are arriving. Problem is in the app.
# If you see NOTHING → packets never reach the server. Firewall or routing!

# "Is DNS working?"
sudo tcpdump -i eth0 port 53 -vvv
# Output: 
#   192.168.1.100 > 8.8.8.8: ... api.myapp.com? A
#   8.8.8.8 > 192.168.1.100: ... api.myapp.com A 54.123.45.67

# "Why is the connection being reset?"
sudo tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0' -n
# Shows which IP is sending RST → that's where the problem is.

# "Is the load balancer forwarding my request?"
# On the BACKEND server:
sudo tcpdump -i eth0 port 8000 -n
# Check if X-Forwarded-For header shows the real client IP.
```

---

# PART 3: Wireshark — Visual Packet Analysis

---

```
WIRESHARK = graphical packet analyzer. The gold standard.
  
  Open a .pcap file captured by tcpdump → full visual analysis.
  Live capture on your local machine.
  
  KEY FEATURES:
  1. Protocol dissection: automatically parses HTTP, TLS, DNS, etc.
  2. Conversation view: see all packets between two endpoints.
  3. Stream following: reconstruct entire TCP conversation.
  4. Coloring: different colors for different protocols.
  5. Export: extract files transmitted over HTTP, images, etc.
  
DISPLAY FILTERS (after capture):
  http                                    # only HTTP packets
  tcp.port == 443                         # only port 443
  ip.addr == 54.123.45.67                # specific host
  dns.qry.name == "api.myapp.com"         # specific DNS query
  tcp.flags.syn == 1 && tcp.flags.ack == 0  # only SYN packets (new connections)
  http.response.code == 500                # only HTTP 500 errors
  tcp.analysis.retransmission             # retransmitted packets (packet loss!)
  frame.time_delta > 1                     # packets with >1s gap (latency analysis)

  COMBINE: ip.addr == 10.0.1.10 && tcp.port == 5432
  → Show only PostgreSQL traffic from/to 10.0.1.10.

ANALYZE TCP PROBLEMS:
  Statistics → TCP Stream Graphs → Time-Sequence:
  Shows sequence number over time. Flat lines = retransmissions/stalls.
  Steep lines = fast data transfer. Staircase = steady.
  
  Analyze → Expert Information:
  Shows all TCP errors: retransmissions, zero windows, resets, out-of-order.
```

---

# PART 4: nmap — Network Exploration & Security Auditing

---

```bash
# nmap = the most powerful network scanning tool.
# Used by: security auditors, sysadmins, penetration testers.

# ── HOST DISCOVERY ──

# Ping scan: which hosts are alive on the network?
nmap -sn 192.168.1.0/24
# Output: lists all responsive IPs and their MAC addresses
# Fast: doesn't scan ports, just checks if host is up.

# ── PORT SCANNING ──

# Default scan (top 1000 common ports)
nmap 54.123.45.67

# Scan specific ports
nmap -p 22,80,443,5432,8080 54.123.45.67

# Scan ALL 65535 ports
nmap -p 1-65535 54.123.45.67               # thorough but slow (~5 min)
nmap -p- 54.123.45.67                       # shorthand for all ports

# Fast scan (top 100 ports)
nmap -F 54.123.45.67

# ── SCAN TYPES ──

# TCP SYN scan (default, stealthy — doesn't complete handshake)
sudo nmap -sS 54.123.45.67

# TCP Connect scan (completes full handshake — no root needed)
nmap -sT 54.123.45.67

# UDP scan (much slower — no handshake, waits for ICMP unreachable)
sudo nmap -sU 54.123.45.67

# ── SERVICE DETECTION ──

# Detect service version
nmap -sV 54.123.45.67
# Output: 
# PORT     STATE SERVICE  VERSION
# 22/tcp   open  ssh      OpenSSH 8.9p1 Ubuntu 3ubuntu0.1
# 443/tcp  open  ssl/http nginx 1.24.0
# 5432/tcp open  postgresql PostgreSQL 15.4

# Detect operating system
sudo nmap -O 54.123.45.67
# Output: OS details: Linux 5.15

# Aggressive scan (service version + OS + traceroute + scripts)
nmap -A 54.123.45.67

# ── VULNERABILITY SCANNING ──

# Run default NSE scripts (safe checks)
nmap --script=default 54.123.45.67

# Check for specific vulnerabilities
nmap --script=vuln 54.123.45.67

# Check SSL/TLS configuration
nmap --script ssl-enum-ciphers -p 443 54.123.45.67
# Shows: which TLS versions and cipher suites the server supports
# Flags weak ciphers and deprecated TLS versions

# ── OUTPUT ──
nmap -oN scan-results.txt 54.123.45.67    # normal output to file
nmap -oX scan-results.xml 54.123.45.67    # XML output (for tools)
nmap -oG scan-results.gnmap 54.123.45.67  # greppable output
```

---

# PART 5: All-In-One Command Reference

---

```bash
# ── ESSENTIAL NETWORK DEBUGGING COMMANDS ──

# ── CONNECTIVITY ──
ping -c 4 8.8.8.8                        # basic connectivity check
ping -c 4 -s 1472 -M do 54.123.45.67     # MTU test (1472 + 28 = 1500)
traceroute -n api.myapp.com              # trace route (numeric, no DNS)
mtr --report api.myapp.com               # MTR report (60 packets)

# ── DNS ──
dig +short api.myapp.com                 # quick IP lookup
dig +trace api.myapp.com                 # full resolution trace
dig @8.8.8.8 api.myapp.com              # query specific DNS server
host -t MX myapp.com                     # mail server lookup

# ── PORT/SERVICE ──
ss -tlnp                                 # local listening TCP ports + process
ss -tanp                                 # all TCP connections + process
lsof -i :8080                            # what process is on port 8080?
nc -zv api.myapp.com 22                  # is SSH port reachable?
nmap -sV -p 22,80,443 api.myapp.com     # service version scan

# ── HTTP ──
curl -v https://api.myapp.com/health     # verbose HTTP request
curl -w "DNS:%{time_namelookup} TCP:%{time_connect} TLS:%{time_appconnect} Total:%{time_total}\n" \
  -o /dev/null -s https://api.myapp.com  # timing breakdown
curl --resolve api.myapp.com:443:54.123.45.67 https://api.myapp.com  # bypass DNS

# ── TLS ──
openssl s_client -connect api.myapp.com:443    # TLS handshake test
echo | openssl s_client -connect api.myapp.com:443 2>/dev/null | openssl x509 -enddate -noout  # cert expiry

# ── PACKETS ──
sudo tcpdump -i eth0 port 443 -n -c 50  # capture 50 packets on port 443
sudo tcpdump -i eth0 -w capture.pcap     # save for Wireshark

# ── BANDWIDTH ──
iperf3 -s                                # start bandwidth test server
iperf3 -c server.myapp.com               # test bandwidth to server
# Output: [ ID] Interval  Transfer  Bitrate
#          [  5]  0.0-10.0  1.09 GBytes  938 Mbits/sec

# ── SYSTEM ──
ip addr show                             # all interfaces and IPs
ip route show                            # routing table
arp -a                                   # ARP cache (IP→MAC mappings)
cat /etc/resolv.conf                     # configured DNS servers
ss -s                                    # socket statistics summary
```

---

# PART 6: Kubernetes Network Debugging

---

```bash
# ── K8S NETWORKING DEBUG ──

# Check pod networking
kubectl get pods -o wide                 # see pod IPs and nodes
kubectl exec -it myapp-pod -- ip addr    # pod's network interfaces
kubectl exec -it myapp-pod -- cat /etc/resolv.conf  # pod DNS config

# Test connectivity BETWEEN pods
kubectl exec -it pod-a -- nc -zv pod-b-service 8080
kubectl exec -it pod-a -- curl http://pod-b-service:8080/health

# Test DNS resolution inside the cluster
kubectl exec -it myapp-pod -- nslookup myservice.default.svc.cluster.local
# Should resolve to the ClusterIP of the service.

# Check services and endpoints
kubectl get svc                          # services and their ClusterIPs
kubectl get endpoints myservice          # which pods are behind the service?
# If endpoints is empty → no healthy pods match the selector!

# Check ingress
kubectl get ingress                      # ingress rules
kubectl describe ingress myapp-ingress   # detailed config + events

# Check network policies
kubectl get networkpolicy -A             # all network policies
kubectl describe networkpolicy deny-all  # specific policy details

# DNS debugging pod (run a debug container with network tools)
kubectl run netshoot --rm -it --image=nicolaka/netshoot -- /bin/bash
# Inside: dig, nslookup, ping, curl, tcpdump, nmap, iperf3 all available!

# Capture packets inside a pod
kubectl exec -it myapp-pod -- tcpdump -i eth0 port 8080 -n -c 20
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **TCP states** | [Ch 06: TCP/UDP](06_TCP_UDP_Deep_Dive.md) — understand what SYN, RST, FIN mean |
| **DNS debugging** | [Ch 07: DNS](07_DNS_Complete.md) — dig +trace, record types |
| **TLS certificates** | [Ch 09: TLS](09_TLS_Encryption.md) — openssl commands |
| **Firewall rules** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — iptables |
| **K8s networking** | [Networking & Security](02_Networking_Security.md) — pods, services, ingress |
| **Load balancer debugging** | [Ch 11: Load Balancing](11_Load_Balancing_Proxies.md) — 502/504 errors |
| **SSH tunneling** | [Ch 14: SSH](14_SSH_Remote_Access.md) — access internal services for debugging |
| **Python sockets** | [Asyncio Internals](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) |

---

> **Navigation**: [← SSH](14_SSH_Remote_Access.md) | [Index](00_INDEX.md)
