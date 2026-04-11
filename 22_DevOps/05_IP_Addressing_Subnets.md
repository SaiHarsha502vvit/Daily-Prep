**Navigation**: [← Fundamentals](04_Networking_Complete.md) | [Index](00_INDEX.md) | [Next → TCP/UDP](06_TCP_UDP_Deep_Dive.md)

# 🌍 Chapter 5: IP Addressing, Subnets & Routing — The Internet's Postal System

_"Every device on the internet has an address. Understanding IP addressing is like understanding how the postal system works — without it, you can't send or receive anything."_

---

# PART 1: The History of IP Addressing

---

```
THE PROBLEM (1960s-1970s):
  ARPANET had 4 nodes. Addressing was trivial: "send to node 2."
  By 1981: hundreds of hosts. Need a SCALABLE addressing system.
  
1981 — IPv4 DEFINED (RFC 791):
  32-bit addresses. 2^32 = 4,294,967,296 possible addresses.
  Seemed infinite at the time. The internet was < 1,000 hosts.
  
1993 — CIDR INTRODUCED (classless addressing):
  Original "classful" system (Class A, B, C) wasted addresses.
  CIDR allows variable-length subnets. Saves millions of addresses.
  
1994 — NAT INVENTED:
  Network Address Translation. Multiple devices share ONE public IP.
  Delayed IPv4 exhaustion by decades. Your home router does NAT.
  
2012 — IPv4 EXHAUSTION:
  IANA allocated the LAST blocks of IPv4 addresses.
  Regional registries (ARIN, RIPE) ran out shortly after.
  New IPv4 addresses now cost $40-60 EACH on secondary markets!
  
2017+ — IPv6 ADOPTION GROWING:
  Google: ~45% of traffic is IPv6 (2024).
  Mobile networks: most 4G/5G traffic is IPv6 natively.
  But the enterprise world is still mostly IPv4 with NAT. Transition is slow.
```

---

# PART 2: IPv4 — Binary Math Deep Dive

---

```
AN IPv4 ADDRESS IS 32 BITS. PERIOD.

"192.168.1.100" is just a HUMAN-READABLE representation of 32 bits:

  192     .  168     .  1       .  100
  11000000   10101000   00000001   01100100
  
HOW TO CONVERT:
  192 = 128 + 64 = 2^7 + 2^6 = 11000000
  168 = 128 + 32 + 8 = 2^7 + 2^5 + 2^3 = 10101000
  1   = 2^0 = 00000001
  100 = 64 + 32 + 4 = 2^6 + 2^5 + 2^2 = 01100100

BINARY POSITION VALUES:
  128  64  32  16  8  4  2  1
  2^7  2^6 2^5 2^4 2^3 2^2 2^1 2^0

PRACTICE:
  What is 10.0.3.200 in binary?
  10  = 00001010
  0   = 00000000
  3   = 00000011
  200 = 11001000 (128 + 64 + 8 = 200)
  Answer: 00001010.00000000.00000011.11001000

SPECIAL ADDRESSES:
  0.0.0.0        → "this host" / unspecified (server binds to ALL interfaces)
  127.0.0.1      → loopback (localhost — talks to yourself, never leaves the machine)
  127.0.0.0/8    → entire loopback range (16 million addresses, ALL are localhost)
  255.255.255.255 → limited broadcast (all hosts on local network)
  169.254.x.x     → link-local / APIPA (no DHCP server found → self-assigned)
```

## Subnet Masks & CIDR — The Complete Math

```
THE SUBNET MASK DIVIDES AN IP INTO TWO PARTS:
  NETWORK part: identifies WHICH network (like a city)
  HOST part:    identifies WHICH device on that network (like a house number)

SUBNET MASK IN BINARY:
  255.255.255.0 = 11111111.11111111.11111111.00000000
                  ←──── network (24 bits) ────→←host→
  
  The 1s = network bits. The 0s = host bits.
  CIDR notation: /24 means "24 network bits, 8 host bits."

CALCULATING THE NETWORK ADDRESS:
  IP AND subnet mask = network address.
  
  IP:        192.168.  1.100 = 11000000.10101000.00000001.01100100
  Mask /24:  255.255.255.  0 = 11111111.11111111.11111111.00000000
  AND RESULT: 192.168.  1.  0 = 11000000.10101000.00000001.00000000
  
  Network address: 192.168.1.0
  This means: "all devices with IP 192.168.1.x are on the SAME network."

AVAILABLE HOST ADDRESSES:
  /24 gives 8 host bits → 2^8 = 256 total addresses.
  But: first address (192.168.1.0) = NETWORK address (identifies the subnet).
       last address (192.168.1.255) = BROADCAST address (reaches all hosts).
  USABLE hosts: 256 - 2 = 254 devices.

CIDR CHEAT SHEET:
  ┌──────┬────────────────┬────────┬──────────┬──────────────────────┐
  │ CIDR │ Subnet Mask    │ Hosts  │ Usable   │ Use Case             │
  ├──────┼────────────────┼────────┼──────────┼──────────────────────┤
  │ /32  │ 255.255.255.255│ 1      │ 1        │ Single host route    │
  │ /31  │ 255.255.255.254│ 2      │ 2*       │ Point-to-point link  │
  │ /30  │ 255.255.255.252│ 4      │ 2        │ Router-to-router     │
  │ /28  │ 255.255.255.240│ 16     │ 14       │ Small office         │
  │ /27  │ 255.255.255.224│ 32     │ 30       │ Small subnet         │
  │ /26  │ 255.255.255.192│ 64     │ 62       │ Medium subnet        │
  │ /25  │ 255.255.255.128│ 128    │ 126      │ Large subnet         │
  │ /24  │ 255.255.255.0  │ 256    │ 254      │ Standard LAN (home)  │
  │ /22  │ 255.255.252.0  │ 1,024  │ 1,022    │ Large office         │
  │ /20  │ 255.255.240.0  │ 4,096  │ 4,094    │ Campus network       │
  │ /16  │ 255.255.0.0    │ 65,536 │ 65,534   │ Large corporate      │
  │ /8   │ 255.0.0.0      │ 16.7M  │ 16.7M    │ AWS VPC, ISP         │
  └──────┴────────────────┴────────┴──────────┴──────────────────────┘

SUBNETTING EXERCISE:
  GIVEN: Network 10.0.0.0/16. You need 4 subnets.
  
  /16 = 65,536 hosts. Dividing into 4 → need 2 extra bits → /18.
  2^2 = 4 subnets. Each has 2^14 = 16,384 addresses (- 2 = 16,382 usable).
  
  Subnet 1: 10.0. 0.0/18  (10.0.0.1   → 10.0.63.254)
  Subnet 2: 10.0.64.0/18  (10.0.64.1  → 10.0.127.254)
  Subnet 3: 10.0.128.0/18 (10.0.128.1 → 10.0.191.254)
  Subnet 4: 10.0.192.0/18 (10.0.192.1 → 10.0.255.254)
  
  HOW? The /18 mask means the first 18 bits are network.
  16 original + 2 new = 18 → those 2 bits create 4 combinations (00, 01, 10, 11).
  
  In the third octet (bits 17-24):
  00xxxxxx = 0-63    → Subnet 1
  01xxxxxx = 64-127  → Subnet 2
  10xxxxxx = 128-191 → Subnet 3
  11xxxxxx = 192-255 → Subnet 4
```

---

# PART 3: Private, Public & Special IP Ranges

---

```
PRIVATE IP RANGES (RFC 1918):
  Not routed on the public internet. Free to use internally.
  
  ┌────────────────┬───────────────────────────────┬────────────┐
  │ Range          │ CIDR                          │ # Addresses│
  ├────────────────┼───────────────────────────────┼────────────┤
  │ 10.0.0.0/8     │ 10.0.0.0 → 10.255.255.255     │ 16,777,216 │
  │ 172.16.0.0/12  │ 172.16.0.0 → 172.31.255.255   │ 1,048,576  │
  │ 192.168.0.0/16 │ 192.168.0.0 → 192.168.255.255 │ 65,536     │
  └────────────────┴───────────────────────────────┴────────────┘
  
  Where used:
  10.x.x.x:       Large enterprise networks, AWS VPCs, K8s pod CIDRs.
  172.16-31.x.x:  Docker default bridge (172.17.0.0/16), medium networks.
  192.168.x.x:    Home routers, small offices.

WHY PRIVATE IPs EXIST:
  IPv4 only has 4.3 billion addresses. Earth has 20+ billion connected devices.
  Solution: reuse private IPs behind NAT.
  Every home network uses 192.168.1.x → millions of homes reuse the SAME addresses.
  Each home's router translates (NAT) to its unique public IP.
```

## NAT (Network Address Translation) — The Deep Dive

```
NAT IS THE REASON IPv4 STILL WORKS.

HOW NAT WORKS — Step by Step:

  Your laptop (192.168.1.100) wants to visit google.com (142.250.80.4).
  
  1. OUTGOING PACKET from laptop:
     Source: 192.168.1.100:49872   Destination: 142.250.80.4:443
  
  2. ROUTER performs SNAT (Source NAT):
     Rewrites source IP to router's PUBLIC IP.
     Records the mapping in NAT table.
     
     NAT TABLE:
     ┌────────────────────────┬────────────────────┐
     │ Internal               │ External           │
     ├────────────────────────┼────────────────────┤
     │ 192.168.1.100:49872    │ 203.45.67.89:50001 │
     │ 192.168.1.101:52344    │ 203.45.67.89:50002 │
     │ 192.168.1.102:60122    │ 203.45.67.89:50003 │
     └────────────────────────┴────────────────────┘
     
     Translated packet:
     Source: 203.45.67.89:50001   Destination: 142.250.80.4:443
  
  3. GOOGLE RESPONDS to 203.45.67.89:50001.
  
  4. ROUTER receives response, looks up NAT table:
     "Port 50001 → 192.168.1.100:49872"
     Rewrites destination back to internal IP.
     
     Translated packet:
     Source: 142.250.80.4:443   Destination: 192.168.1.100:49872
  
  5. LAPTOP receives the response.

NAT TYPES:
  SNAT (Source NAT): Rewrite source IP (outgoing — your home router does this).
  DNAT (Destination NAT / Port Forwarding): Rewrite destination IP (incoming).
    → "Port 8080 on my public IP → forward to 192.168.1.50:80 (web server)"
  
  PAT (Port Address Translation / NAT Overload):
    Many-to-one: many internal IPs → one public IP (using different ports).
    THIS is what your home router does. Also called "masquerading."

PROBLEMS WITH NAT:
  1. Breaks peer-to-peer: two devices behind NAT can't directly connect.
     → Solutions: STUN, TURN, ICE (used by WebRTC for video calls).
  2. Performance: router must inspect + rewrite EVERY packet.
  3. Debugging: logs show public IP, not internal IP → need NAT table correlation.
  4. Protocols that embed IP in payload (SIP, FTP active mode) break behind NAT.
     → ALG (Application Layer Gateway) needed for special handling.
```

---



🔬 **Section Challenge — NAT (Network Address Translation) — The Deep Dive**
>

# PART 4: ARP (Address Resolution Protocol) — IP → MAC

---

```
THE PROBLEM:
  You know the IP address (192.168.1.1) but Ethernet needs a MAC address.
  How do you find the MAC address for an IP on your local network?

ARP IS THE ANSWER:

  Step 1: Machine A wants to send to 192.168.1.1.
  Step 2: A checks its ARP cache (maybe it already knows the MAC).
  Step 3: If not cached → A broadcasts an ARP Request to ALL devices:
          "Who has IP 192.168.1.1? Tell 192.168.1.100"
          Destination MAC: FF:FF:FF:FF:FF:FF (broadcast)
  Step 4: The device with IP 192.168.1.1 responds (unicast):
          "192.168.1.1 is at MAC AA:BB:CC:DD:EE:01"
  Step 5: A stores this in ARP cache (typically 5-20 min TTL).
  Step 6: A can now construct the Ethernet frame with correct MAC.

ARP IS LAYER 2 — it does NOT cross routers!
  If destination is on a DIFFERENT subnet → ARP for the default gateway instead.
  The gateway (router) then forwards the packet to the next hop.

ARP SPOOFING / POISONING (SECURITY THREAT):
  Attacker sends fake ARP replies: "I am 192.168.1.1, my MAC is ATTACKER_MAC."
  All traffic to the gateway now goes through the attacker (Man-in-the-Middle).
  Defense: Dynamic ARP Inspection (DAI) on managed switches.
```

```bash
# ── ARP COMMANDS ──

# Show ARP cache
arp -a                         # All platforms
ip neigh show                  # Linux (modern)

# Example output:
# 192.168.1.1   dev eth0  lladdr AA:BB:CC:DD:EE:01  REACHABLE
# 192.168.1.102 dev eth0  lladdr CC:DD:EE:FF:00:11  STALE

# Manually add a static ARP entry (prevent ARP spoofing for critical hosts)
sudo arp -s 192.168.1.1 AA:BB:CC:DD:EE:01

# Clear ARP cache
sudo ip neigh flush all        # Linux
```

---

# PART 5: MAC Addresses — The Physical Identity

---

```
EVERY NETWORK INTERFACE HAS A MAC ADDRESS:
  48 bits (6 bytes), written in hex:
  AA:BB:CC:DD:EE:FF
  
  STRUCTURE:
  ┌──────────────────┬──────────────────┐
  │ OUI (24 bits)    │ Device ID (24)   │
  │ Manufacturer     │ Unique per device│
  ├──────────────────┼──────────────────┤
  │ AA:BB:CC         │ DD:EE:FF         │
  └──────────────────┴──────────────────┘
  
  OUI (Organizationally Unique Identifier):
  Assigned by IEEE. Each manufacturer gets a unique OUI.
  00:50:56 = VMware
  AC:DE:48 = Apple
  B8:27:EB = Raspberry Pi Foundation
  
  You can look up any MAC address: https://macvendors.com/

IMPORTANT DISTINCTIONS:
  MAC address: Layer 2 — NEVER leaves the local network segment.
  IP address:  Layer 3 — routed across the internet.
  
  When a packet crosses a router:
  → Source and destination MAC addresses CHANGE at each hop.
  → Source and destination IP addresses STAY THE SAME end-to-end.
  
  ANALOGY: A letter traveling through the postal system.
  MAC = the delivery truck's license plate (changes for each leg of the journey).
  IP = the address on the envelope (stays the same from sender to recipient).
```

---

# PART 6: IPv6 — The Future (and Present)

---

```
WHY IPv6?
  IPv4: 4.3 billion addresses. NOT ENOUGH.
  IPv6: 3.4 × 10^38 addresses = 340 undecillion.
  That's enough to give every ATOM on Earth several billion addresses.

IPv6 ADDRESS FORMAT:
  128 bits, written as 8 groups of 4 hex digits:
  2001:0db8:85a3:0000:0000:8a2e:0370:7334
  
  Shortening rules:
  1. Leading zeros can be dropped: 0db8 → db8
  2. One group of consecutive all-zero blocks → ::
     2001:db8:0:0:0:0:0:1 → 2001:db8::1
  
  COMMON ADDRESSES:
  ::1             → loopback (equivalent to 127.0.0.1)
  ::              → unspecified (equivalent to 0.0.0.0)
  fe80::/10       → link-local (auto-configured on every interface)
  fd00::/8        → unique local (equivalent to private IPv4 ranges)
  2000::/3        → global unicast (publicly routable, assigned by ISPs)

KEY DIFFERENCES FROM IPv4:
  1. NO NAT: every device gets a globally unique public IP. End-to-end connectivity!
  2. NO BROADCAST: replaced by multicast (ff02::1 = all nodes).
  3. NO ARP: replaced by NDP (Neighbor Discovery Protocol) — uses ICMPv6.
  4. AUTO-CONFIGURATION: SLAAC (Stateless Address Auto-Configuration).
     Device generates its own IPv6 address from its MAC + network prefix.
     No DHCP needed (though DHCPv6 exists for additional config).
  5. MANDATORY IPsec: encryption built into the protocol (optional in IPv4).
  6. SIMPLIFIED HEADER: fixed 40-byte header (IPv4 has variable-length header).
     Extension headers replace IPv4's options field → faster processing.

DUAL STACK:
  Today, most systems run IPv4 AND IPv6 simultaneously.
  When connecting to a server:
  1. Try IPv6 first (if available).
  2. Fall back to IPv4 if IPv6 fails.
  Called "Happy Eyeballs" algorithm (RFC 8305).
```

---

# PART 7: DHCP — Automatic IP Assignment

---

```
WITHOUT DHCP:
  You manually configure each device: IP address, subnet mask, gateway, DNS servers.
  100 devices? = 100 manual configurations. Change the gateway? → 100 updates.

WITH DHCP (Dynamic Host Configuration Protocol):
  Device boots → asks for an IP → DHCP server assigns one automatically.
  Also configures: subnet mask, default gateway, DNS servers, lease time.

THE DORA PROCESS:
  D — DISCOVER: Client broadcasts "any DHCP servers out there?" (who am I?)
  O — OFFER:    Server responds "how about 192.168.1.100 for 24 hours?"
  R — REQUEST:  Client says "yes, I'll take 192.168.1.100"
  A — ACK:      Server confirms "it's yours for 24 hours!"
  
  The client can RENEW the lease at 50% of the lease time.
  If not renewed and lease expires → client must go through DORA again.

DHCP SCOPES:
  Pool: 192.168.1.100 - 192.168.1.200 (100 addresses for dynamic assignment)
  Reserved: 192.168.1.10-99 (for servers, printers — static IPs via DHCP)
  Excluded: 192.168.1.1-9 (network devices — configured manually)
  
  DHCP Reservation: "device with MAC AA:BB:CC:DD:EE:01 ALWAYS gets 192.168.1.50"
  → Combines convenience of DHCP with predictability of static IPs.

SECURITY:
  DHCP Starvation Attack: attacker sends thousands of DISCOVER requests → 
    exhausts all available addresses → legitimate devices can't get IPs.
  Rogue DHCP Server: attacker runs their own DHCP server →
    assigns a gateway IP they control → intercepts all traffic!
  
  Defense: DHCP Snooping on managed switches → only trusted ports can respond.
```

```bash
# ── DHCP COMMANDS ──

# View your DHCP lease (Linux)
cat /var/lib/dhclient/dhclient.leases
# Or:
nmcli connection show "Wired connection 1" | grep DHCP

# Release and renew DHCP lease
sudo dhclient -r eth0          # release current IP
sudo dhclient eth0             # request new IP

# Windows
ipconfig /release
ipconfig /renew
ipconfig /all                  # shows DHCP server, lease times, DNS servers
```

---

# PART 8: Routing — How Packets Navigate the Internet

---

```
ROUTING = deciding where to send a packet NEXT.

Every device with IP (your laptop, router, server) has a ROUTING TABLE.
When a packet needs to be sent:

  1. Check destination IP.
  2. Look in routing table for the MOST SPECIFIC match.
  3. Forward to the matching next hop (or directly if local).
  
ROUTING TABLE ON YOUR LAPTOP:
  ┌──────────────────┬──────────────┬────────────┬───────┐
  │ Destination       │ Gateway      │ Interface  │ Metric│
  ├──────────────────┼──────────────┼────────────┼───────┤
  │ 192.168.1.0/24   │ 0.0.0.0      │ eth0       │ 100   │
  │ 10.0.0.0/8       │ 10.0.1.1     │ tun0 (VPN) │ 50    │
  │ 0.0.0.0/0        │ 192.168.1.1  │ eth0       │ 200   │
  └──────────────────┴──────────────┴────────────┴───────┘
  
  Rules:
  → Packet to 192.168.1.50? Matches /24 → send directly on eth0 (local).
  → Packet to 10.5.3.42? Matches 10.0.0.0/8 → send via VPN (tun0).
  → Packet to 142.250.80.4 (Google)? No specific match → default route (0.0.0.0/0)
    → send to gateway 192.168.1.1 (your router) → router handles from here.
  
  LONGEST PREFIX MATCH: more specific = higher priority.
  /24 beats /16 beats /8 beats /0 (default route).

HOW DO ROUTERS LEARN ROUTES?

  STATIC ROUTING: Admin manually adds routes.
    ip route add 10.0.2.0/24 via 10.0.1.2
    Simple but doesn't scale. Used for small networks.
  
  DYNAMIC ROUTING PROTOCOLS:
  Routers TALK TO EACH OTHER and share route information.
  
  IGP (Interior Gateway Protocol — within an organization):
    RIP:  Distance-vector. Counts hops. Max 15 hops. Legacy. Simple. Slow to converge.
    OSPF: Link-state. Dijkstra's algorithm! Builds a complete map of the network.
          Converges fast. Used in enterprises AND ISPs. Most common IGP.
    EIGRP: Cisco proprietary. Hybrid. Fast convergence.
    IS-IS: Link-state. Similar to OSPF. Used by large ISPs.
  
  EGP (Exterior Gateway Protocol — between organizations):
    BGP (Border Gateway Protocol): THE protocol that runs the internet.
    Every ISP, cloud provider, and large enterprise uses BGP.
    "How does AT&T know to route to AWS? BGP."
    "How does AWS know to route to Google? BGP."
    
    BGP: path-vector. Exchanges lists of AS (Autonomous System) paths.
    AS = a collection of IP ranges under one administrative control.
    AWS = AS16509. Google = AS15169. AT&T = AS7018.
    
    BGP announcements:
    "AS16509 (AWS) can reach 54.123.0.0/16.
     To get there from AS7018 (AT&T): AS7018 → AS3356 → AS16509."
    
    BGP is the most critical protocol on the internet.
    A BGP misconfiguration can take down countries (Pakistan, 2008 → YouTube globally offline).
```

```bash
# ── ROUTING COMMANDS ──

# Show routing table
ip route show                  # Linux
route print                    # Windows
netstat -nr                    # macOS

# Add a static route
sudo ip route add 10.0.2.0/24 via 10.0.1.2

# Trace the route a packet takes (see every hop)
traceroute api.myapp.com       # Linux/macOS
tracert api.myapp.com          # Windows

# Example output:
# 1  192.168.1.1      1.234 ms    ← your router
# 2  10.0.0.1         5.678 ms    ← ISP router
# 3  72.14.215.85     12.34 ms    ← backbone router
# ...
# 12 54.123.45.67     45.67 ms    ← destination server
# Each hop = one router the packet passes through.

# MTR: combine traceroute + ping (continuous monitoring)
mtr api.myapp.com
# Shows: each hop, loss %, average latency — live updating!
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Dijkstra in OSPF** | [Algorithms in Production](../03_Algorithms/12_Algorithms_In_Production.md) — shortest path |
| **Hash tables (ARP cache)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) |
| **Binary math** | [Bit Manipulation](../03_Algorithms/06a_Greedy_BitManip.md) — bit operations |
| **AWS VPC subnets** | [Cloud Networking](13_Cloud_Networking_VPC.md) — Terraform VPC |
| **NAT in Docker** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — Docker bridge networking |
| **Kubernetes pod CIDR** | [Networking & Security](02_Networking_Security.md) — K8s networking model |
| **TCP uses IP** | [Ch 06: TCP/UDP Deep Dive](06_TCP_UDP_Deep_Dive.md) |
| **DNS uses IP** | [Ch 07: DNS Complete](07_DNS_Complete.md) |

---


---

## 🏋️ Practice & Interview Questions — DevOps & Networking

### Predict / Trace
**Q1.** What happens when you type `https://google.com` in a browser?
<details><summary>Answer</summary>

1. DNS lookup: resolve `google.com` → IP (recursive resolver → root → TLD → authoritative NS)
2. TCP connection: 3-way handshake (SYN → SYN-ACK → ACK) to port 443
3. TLS handshake: ClientHello → ServerHello → certificate verification → key exchange → session keys
4. HTTP/2 GET request sent
5. Server responds with HTML (GZIP compressed)
6. Browser parses HTML → fetches CSS/JS → CSSOM + DOM → render tree → paint
</details>

**Q2.** `curl -I https://example.com` returns `Connection: keep-alive`. What does this mean?
<details><summary>Answer</summary>

The TCP connection won't be closed after the response — it stays open for reuse. Avoiding TCP+TLS handshake overhead for subsequent requests. HTTP/1.1 default; HTTP/2 always multiplexes on one connection.
</details>

### Coding / Commands
**Q3.** ⭐ Write a Dockerfile for a Java Spring Boot app — multi-stage build.
<details><summary>Solution</summary>

```dockerfile
# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /app
COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle/
RUN ./gradlew dependencies --no-daemon
COPY src src/
RUN ./gradlew bootJar --no-daemon

# Stage 2: Runtime (smaller image)
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```
</details>

**Q4.** ⭐ Write a Kubernetes deployment with liveness and readiness probes.
<details><summary>Solution</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myapp:1.0
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "500m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5
```
</details>

**Q5.** ⭐⭐ Design a zero-downtime deployment strategy.
<details><summary>Answer</summary>

**Blue-Green**: run two identical envs, switch load balancer. Instant rollback. Double the infra cost.
**Rolling**: replace pods one-by-one. K8s default. Slower, but no extra infra.
**Canary**: route 5% traffic to new version, monitor errors/latency, gradually increase. Most risk-controlled.
**Feature flags**: deploy code but disable feature — decouple deployment from release.
</details>

### Interview Questions
**Q6.** TCP vs UDP — when to use each?
<details><summary>Answer</summary>

**TCP**: reliable (acknowledgments, retransmission), ordered, connection-based. Use for: HTTP, databases, SSH, email — anywhere correctness matters more than speed.
**UDP**: unreliable, unordered, connectionless. Use for: video streaming, gaming, DNS, VoIP — where speed matters more than perfect delivery, or app handles reliability itself.
</details>

**Q7.** What is a memory limit vs memory request in Kubernetes?
<details><summary>Answer</summary>

`request`: guaranteed allocation — K8s won't schedule pod on node with less available. `limit`: maximum usage — if exceeded, pod is OOM-killed. Set requests for scheduling accuracy; set limits to prevent noisy neighbor problems. Best practice: requests=expected P50 usage, limits=expected P99 surge.
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | HTTP status code 429 | Too Many Requests (rate limited) |
| 2 | HTTP status code 503 | Service Unavailable (server down/overloaded) |
| 3 | DNS record type for IP address | A record (IPv4), AAAA record (IPv6) |
| 4 | Load balancer Layer 4 vs 7 | L4: TCP/UDP level; L7: HTTP/application level (content-aware) |
| 5 | TLS/SSL terminates where | At load balancer (termination), or all the way to pod (passthrough) |
| 6 | `docker exec -it container bash` does | Opens interactive shell in running container |
| 7 | Kubernetes etcd stores | Cluster state (all K8s object definitions) |
| 8 | CI/CD — what triggers a pipeline? | Code push, PR, tag, schedule, or manual trigger |



---

## 🧠 Deep Conceptual Questions — Networking & DevOps Internals

**C1. TCP three-way handshake: WHY three steps? Can it be done in two?**
<details><summary>Deep Answer</summary>

Two-way fails: both sides need to confirm the OTHER side can send AND receive. 
- SYN (client→server): "I want to connect, my sequence starts at X"
- SYN-ACK (server→client): "Got your SYN, my sequence starts at Y, ack=X+1"  
- ACK (client→server): "Got your SYN-ACK, ack=Y+1"

Without the third ACK: client knows server is alive, but server doesn't know the client received the SYN-ACK. If SYN-ACK lost: server has allocated resources (TCB) thinking connection established, client doesn't know. The ACK confirms the server's sequence number was received. This asymmetric confirmation requires 3 messages minimum. Four-way teardown: TCP is full-duplex — each direction closed independently, hence 4 steps.
</details>

**C2. What happens when you run `docker run`? Trace the full execution path.**
<details><summary>Deep Answer</summary>

1. **Docker CLI** parses the command, sends REST API request to Docker daemon (`/run`)
2. **Docker daemon** (dockerd) receives the request
3. If image not local: **pull from registry** (Docker Hub → HTTPS, layer downloads)
4. Daemon calls **containerd** (container runtime interface)
5. containerd calls **runc** (OCI runtime)
6. runc creates **Linux namespaces**: PID, NET, MNT, UTS, IPC, USER — isolates the process
7. runc sets up **cgroups**: limits CPU, memory, I/O
8. runc **pivot_root**: changes the filesystem root to the container's overlay filesystem
9. runc executes the entrypoint process (PID 1 in the container)
10. Container stdout/stderr connected through Docker daemon to your terminal
</details>

**C3. Why does Kubernetes use etcd and what would happen if etcd went down?**
<details><summary>Deep Answer</summary>

etcd = distributed key-value store using the Raft consensus algorithm. Stores ALL cluster state: pod specs, deployments, services, secrets, configmaps, RBAC, CRDs. Raft ensures consistency across a cluster of 3-5 etcd nodes (quorum = (N/2)+1). **If etcd goes down**: API server can't read/write state. kubectl commands fail. Scheduler can't schedule new pods. Controller manager can't reconcile state. EXISTING running pods continue running (they don't constantly check etcd — they're managed by kubelet on each node). New pods can't be scheduled. No updates possible. This is why etcd backup + restore is the most critical K8s operation.
</details>

**C4. TLS handshake: what is forward secrecy and why does it matter?**
<details><summary>Deep Answer</summary>

Without forward secrecy: if attacker records encrypted traffic now, and later compromises the server's private key, they can decrypt ALL past traffic retroactively. The server's private key decrypts the session key which decrypts the data. **Forward secrecy** (TLS 1.3 default): each session uses an **ephemeral key pair** (ECDHE). Session keys derived from ephemeral keys + DH exchange. Session key is never stored. If private key compromised later: past sessions can't be decrypted (the ephemeral keys are gone). This is why TLS 1.3 mandates forward secrecy and deprecated non-FS cipher suites. Practically: enables safer long-term data archival.
</details>

**C5. DNS propagation: why does it take "up to 48 hours"?**
<details><summary>Deep Answer</summary>

DNS uses hierarchical caching. Each DNS record has a TTL (time-to-live). When you update a DNS record, authoritative NS serves the new value immediately. But: resolvers worldwide have cached the OLD value until their cache TTL expires. TTL varies: some ISPs set their resolver cache TTL aggressively (override your TTL), some ignore TTL and cache for hours regardless. "48 hours" = worst-case TTL of most records (common: 3600s=1hr, 86400s=1day). Reduce before migration: lower TTL to 60s a week before planned change → faster propagation. After change: most resolvers pick up the new value within minutes. "48 hours" is a legacy conservative estimate.
</details>

**C6. Load balancer: what is the difference between Layer 4 and Layer 7?**
<details><summary>Deep Answer</summary>

**Layer 4 (Transport)**: routes based on TCP/UDP. Sees: IP address, port. Doesn't read HTTP content. Faster (no packet inspection, can be done in-kernel). Can't do URL-based routing, auth injection, session affinity by cookie. Examples: AWS NLB, HAProxy in TCP mode. **Layer 7 (Application)**: reads HTTP headers, URL, body. Can route `/api` to one backend, `/static` to another. Can inject headers (`X-Real-IP`), handle SSL termination, do health checks on HTTP endpoints, session affinity by cookie. More CPU-intensive (full packet inspection). Examples: NGINX, AWS ALB, Envoy. Modern microservices use L7 (Envoy/Istio) for fine-grained traffic control.
</details>


**Navigation**: [← Fundamentals](04_Networking_Complete.md) | [Index](00_INDEX.md) | [Next → TCP/UDP](06_TCP_UDP_Deep_Dive.md)
