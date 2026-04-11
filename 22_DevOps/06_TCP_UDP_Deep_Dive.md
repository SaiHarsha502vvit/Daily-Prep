**Navigation**: [← IP Addressing](05_IP_Addressing_Subnets.md) | [Index](00_INDEX.md) | [Next → DNS](07_DNS_Complete.md)

# 📡 Chapter 6: TCP & UDP Deep Dive — The Transport Layer Explained

_"TCP is a conversation. UDP is shouting into a crowd. Knowing when to use each — and exactly HOW each works under the hood — is the difference between 'it works on my machine' and 'it works in production at scale.'"_

---

# PART 1: Why Two Protocols? TCP vs UDP Philosophy

---

```
THE FUNDAMENTAL TRADEOFF:
  RELIABILITY vs SPEED.
  
  TCP: "I will deliver every byte, in order, or die trying."
       Reliable. Ordered. Connection-oriented. Slower.
       Used for: HTTP, SSH, databases, email, file transfer.
  
  UDP: "I'll send it. Whether it arrives is your problem."
       Unreliable. Unordered. Connectionless. Fast.
       Used for: DNS, video streaming, gaming, VoIP, QUIC (HTTP/3).
  
  ANALOGY:
  TCP = Registered mail with tracking.
    Post office guarantees delivery. Tracks every step.
    If lost → resend. If out of order → reorder.
    Slower and more expensive.
  
  UDP = Postcard.
    Drop it in the mailbox. Hope it arrives.
    No tracking. No confirmation. No redelivery.
    Fast and cheap.

WHEN DOES "UNRELIABLE" MAKE SENSE?
  Video call: if one frame (33ms) is lost → show the NEXT frame.
    Retransmitting the old frame would arrive too late → useless.
    Better to lose a frame than delay the stream.
  
  Gaming: player position update at 60Hz.
    If one update is lost → the next update (16ms later) has newer position.
    Retransmitting old position = worse than skipping it.
  
  DNS: query is tiny (< 512 bytes). Response is tiny.
    If lost → application just retries. No need for TCP overhead.
    (Though DNS DOES fall back to TCP for large responses > 512 bytes!)
```

---

# PART 2: TCP — The Complete Deep Dive

---

## The TCP Segment Header

```
EVERY TCP SEGMENT HAS THIS HEADER (20 bytes minimum):

 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
├───────────────────────────────┼───────────────────────────────────┤
│       Source Port (16)        │     Destination Port (16)         │
├───────────────────────────────┴───────────────────────────────────┤
│                     Sequence Number (32)                          │
├───────────────────────────────────────────────────────────────────┤
│                  Acknowledgment Number (32)                       │
├──────────┬──────┬─┬─┬─┬─┬─┬─┬───────────────────────────────────==┤
│ Data Off │Resrv │C│E│U│A│P│R│S│F│      Window Size (16)           │
│   (4)    │ (4)  │W│C│R│C│S│S│Y│I│                                 │
│          │      │R│E│G│K│H│T│N│N│                                 │
├──────────┴──────┴─┴─┴─┴─┴─┴─┴─┴─┼───────────────────────────────==┤
│         Checksum (16)             │      Urgent Pointer (16)      │
├───────────────────────────────────┴───────────────────────────────┤
│                    Options (variable, 0-40 bytes)                 │
├───────────────────────────────────────────────────────────────────┤
│                    Data / Payload                                 │
└───────────────────────────────────────────────────────────────────┘

FIELD-BY-FIELD:

SOURCE PORT (16 bits):
  The sender's port. For client connections = random ephemeral (49152-65535).
  Allows the client to have MULTIPLE connections to the same server.

DESTINATION PORT (16 bits):
  The receiver's port. Usually well-known (80, 443, 22, 5432).

SEQUENCE NUMBER (32 bits):
  Position of the FIRST byte of data in this segment within the stream.
  Used for: ordering segments, detecting duplicates.
  
  Example: you send 1000 bytes in 3 segments:
  Segment 1: seq=0, data=bytes 0-499 (500 bytes)
  Segment 2: seq=500, data=bytes 500-799 (300 bytes)
  Segment 3: seq=800, data=bytes 800-999 (200 bytes)
  
  INITIAL SEQUENCE NUMBER (ISN):
  NOT 0! Randomly chosen at connection start.
  WHY random? Prevents old segments from a previous connection being mistaken for new ones.
  Also prevents TCP sequence prediction attacks.

ACKNOWLEDGMENT NUMBER (32 bits):
  "I've received all bytes up to this number. Send me the NEXT byte starting here."
  ACK = 500 means "I have bytes 0-499, send byte 500 next."
  Only valid when ACK flag is set.

FLAGS (9 bits, but 6 main ones):
  SYN: Synchronize sequence numbers (connection establishment)
  ACK: Acknowledgment number is valid
  FIN: Sender is FINISHED sending data (connection close)
  RST: RESET the connection (abort — something went wrong)
  PSH: PUSH data to application immediately (don't buffer)
  URG: Urgent data present (rarely used)
  CWR: Congestion Window Reduced (ECN congestion response)
  ECE: ECN-Echo (ECN congestion notification)

WINDOW SIZE (16 bits):
  "I can accept this many MORE bytes" — flow control.
  Prevents sender from overwhelming receiver.
  With Window Scaling option: up to 1 GB window (for high-bandwidth links).

CHECKSUM (16 bits):
  Error detection. Computed over header + data + pseudo-header (IP info).
  If checksum fails → segment is SILENTLY DISCARDED.

OPTIONS (variable):
  MSS (Maximum Segment Size): "My maximum payload is 1460 bytes" (typical for Ethernet).
  Window Scale: multiplier for window size (enables > 65KB windows).
  Timestamps: for RTT measurement and PAWS (Protection Against Wrapped Sequences).
  SACK (Selective ACK): "I'm missing bytes 1000-1499, but I HAVE 1500-2999."
    Without SACK: sender retransmits everything after the gap.
    With SACK: sender retransmits ONLY the missing range. Much more efficient!
```



🔬 **Section Challenge — The TCP Segment Header**

**Challenge 1 (Reasoning):** A TCP connection is in TIME_WAIT state. What is it waiting for and why 2×MSL (Maximum Segment Lifetime)?
<details><summary>Answer</summary>

TIME_WAIT: the side that sent the last ACK waits before fully closing. Why 2×MSL (~60-120 seconds): (1) Ensure the final ACK reached the other side (if it was lost, the other side will retransmit FIN — we need to still be listening to send a new ACK). (2) Allow all old segments in the network to expire (segment with old sequence number arriving for a new connection could corrupt data). Fast servers on many short connections: TIME_WAIT exhaustion → `SO_REUSEADDR`, `tcp_time_wait_reuse`, or HTTP keep-alive.
</details>


## The Three-Way Handshake — In Detail

```
CONNECTION ESTABLISHMENT (3 steps, 1.5 round trips):

Client                                Server
  |                                      |
  |-------- SYN (seq=ISN_C) -----------> |  Step 1: Client initiates
  |         flags: SYN                   |  ISN_C = random initial seq number
  |         window: 65535                |
  |         options: MSS=1460            |
  |                                      |
  |<--- SYN-ACK (seq=ISN_S, ack=ISN_C+1) |  Step 2: Server acknowledges + initiates
  |      flags: SYN, ACK                 |  ISN_S = server's random initial seq
  |      window: 65535                   |
  |      options: MSS=1460               |
  |                                      |
  |-------- ACK (ack=ISN_S+1) ---------> |  Step 3: Client acknowledges server's SYN
  |         flags: ACK                   |  Connection ESTABLISHED on both sides
  |         [may include data!]          |  Client can piggyback data with ACK
  |                                      |

WHY 3 STEPS (not 2)?
  2 steps: Client sends SYN. Server sends SYN-ACK.
  But: Client doesn't confirm it received SYN-ACK!
  → Server can't be sure the client is reachable.
  → Vulnerable to half-open connections (SYN flood attack).
  
  3 steps: Both sides confirm they can SEND and RECEIVE.
  Client proves it received SYN-ACK by sending ACK.

SYN FLOOD ATTACK:
  Attacker sends thousands of SYN packets with SPOOFED source IPs.
  Server allocates resources for each half-open connection (SYN queue).
  Server's SYN queue fills up → can't accept legitimate connections → DoS!
  
  DEFENSE: SYN cookies (server encodes state in the ISN → no SYN queue needed).
  When ACK arrives with correct cookie → accept connection.
  No memory allocated until 3-way handshake is complete.
```




## TCP State Machine — The 11 States

```
A TCP connection goes through a FINITE STATE MACHINE:

              ┌──────────┐
              │  CLOSED  │ ← initial state
              └────┬─────┘
                   │
          ┌────────┴────────┐
          │                 │
    passive open        active open
          │                 │
    ┌─────▼─────┐    ┌─────▼─────┐
    │  LISTEN   │    │  SYN_SENT │
    │(server    │    │(client    │
    │waiting)   │    │waiting    │
    └─────┬─────┘    │for SYN-ACK│
          │          └─────┬─────┘
    recv SYN         recv SYN-ACK
    send SYN-ACK     send ACK
          │                │
    ┌─────▼─────┐    ┌─────▼──────┐
    │ SYN_RCVD  │    │ESTABLISHED │ ← DATA TRANSFER HAPPENS HERE
    └─────┬─────┘    └─────┬──────┘
          │               │
    recv ACK           close()
          │               │
    ┌─────▼──────┐  ┌─────▼─────┐
    │ESTABLISHED│  │ FIN_WAIT_1│
    └────────────┘  └─────┬─────┘
                          │
                    recv ACK of FIN
                          │
                    ┌─────▼─────┐
                    │ FIN_WAIT_2│ → waiting for remote FIN
                    └─────┬─────┘
                          │
                    recv FIN, send ACK
                          │
                    ┌─────▼─────┐
                    │ TIME_WAIT │ → wait 2×MSL (60-120s)
                    └─────┬─────┘
                          │
                    timeout expired
                          │
                    ┌─────▼─────┐
                    │  CLOSED   │
                    └───────────┘

TIME_WAIT:
  After closing, the socket stays in TIME_WAIT for 60-120 seconds.
  WHY? To handle delayed packets from the old connection.
  If a stale packet arrives → TCP knows to discard it (connection is closing).
  
  PROBLEM IN PRODUCTION:
  High-traffic servers opening/closing thousands of connections per second
  → thousands of sockets stuck in TIME_WAIT → port exhaustion!
  
  SOLUTIONS:
  1. Connection pooling (reuse connections — don't close them!)
  2. SO_REUSEADDR: allow binding to a port in TIME_WAIT state.
  3. HTTP Keep-Alive: reuse TCP connection for multiple HTTP requests.
  4. Reduce TIME_WAIT duration: net.ipv4.tcp_fin_timeout (Linux sysctl).
```

```bash


🔬 **Section Challenge — TCP State Machine — The 11 States**

**Challenge 1 (Reasoning):** A TCP connection is in TIME_WAIT state. What is it waiting for and why 2×MSL (Maximum Segment Lifetime)?
<details><summary>Answer</summary>

TIME_WAIT: the side that sent the last ACK waits before fully closing. Why 2×MSL (~60-120 seconds): (1) Ensure the final ACK reached the other side (if it was lost, the other side will retransmit FIN — we need to still be listening to send a new ACK). (2) Allow all old segments in the network to expire (segment with old sequence number arriving for a new connection could corrupt data). Fast servers on many short connections: TIME_WAIT exhaustion → `SO_REUSEADDR`, `tcp_time_wait_reuse`, or HTTP keep-alive.
</details>


# ── OBSERVE TCP STATES ON YOUR MACHINE ──

# Show all TCP connections with state
ss -tan                          # Linux
netstat -an | grep TCP           # All platforms

# Example output:
# State       Recv-Q  Send-Q  Local Address:Port  Peer Address:Port
# LISTEN      0       128     0.0.0.0:8080         0.0.0.0:*
# ESTAB       0       0       192.168.1.100:49872  54.123.45.67:443
# TIME-WAIT   0       0       192.168.1.100:49870  54.123.45.67:443
# FIN-WAIT-2  0       0       192.168.1.100:49868  54.123.45.67:443

# Count connections by state (useful for diagnosing issues)
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
#  245 ESTAB
#   89 TIME-WAIT
#   12 LISTEN
#    3 FIN-WAIT-2
#    1 SYN-SENT

# If you see thousands of TIME-WAIT → connection pool problem!
# If you see thousands of CLOSE-WAIT → your app isn't closing connections!
```

## TCP Flow Control — Sliding Window

```
THE PROBLEM:
  Sender can produce data faster than receiver can consume it.
  If sender keeps blasting → receiver's buffer overflows → data lost.

SOLUTION: SLIDING WINDOW PROTOCOL.
  Receiver advertises: "My window size is 65535 bytes."
  Meaning: "I can accept 65535 more bytes before you need to pause."
  
  As receiver processes data → window grows (more space available).
  As sender sends data → window shrinks (less space available).
  If window = 0 → sender STOPS (receiver is overwhelmed).

VISUALIZATION:
                                    Window (receiver can accept)
  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
  │ACK│ACK│ACK│SNT│SNT│SNT│RDY│RDY│RDY│RDY│NOT│NOT│
  │'d │'d │'d │   │   │   │   │   │   │   │YET│YET│
  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  ← confirmed →← in flight →← can send  →← blocked→←─ not available ─→
  
  ACK'd: receiver confirmed receipt. Sender can forget these.
  Sent (in flight): sent but not yet acknowledged.
  Ready to send: within window, can send anytime.
  Not yet available: outside window, must wait.
  
  The window "slides" right as ACKs arrive:
  Receiver ACKs bytes 0-2999 → window slides → sender can now send 3000-5999.

WINDOW SCALING:
  Original window field: 16 bits = max 65535 bytes.
  Modern networks need GB-sized windows (high bandwidth × high latency).
  Window Scale option: shift count up to 14 → max window = 65535 × 2^14 = 1 GB!
  
  THE BANDWIDTH-DELAY PRODUCT:
  10 Gbps link × 50ms RTT = 500,000,000 bits = 62.5 MB in flight.
  Without window scaling (max 64 KB) → link is only 0.1% utilized!
  Window scaling allows filling the pipe → full throughput.
```



🔬 **Section Challenge — TCP Flow Control — Sliding Window**

**Challenge 1 (Reasoning):** Sliding window guarantees O(N). How? Each element is added and removed exactly how many times?
<details><summary>Answer</summary>

Each element enters the window exactly ONCE (right pointer advances past it) and leaves exactly ONCE (left pointer advances past it). Total operations: 2N regardless of window size changes. Compare to brute force: for each ending position, scan back to find optimal start = O(N²). The window's state (sum, freq map, etc.) is maintained INCREMENTALLY — O(1) per pointer move.
</details>

**Challenge 2 (Bug Hunt):** Minimum Window Substring: the while loop to shrink the window runs `while(valid) { shrink; }`. What's wrong with this logic?
<details><summary>Answer</summary>

Should shrink `while(valid)` to find the minimum window — this is correct! But the common bug: not updating `left++` BEFORE rechecking validity, or forgetting to update the answer BEFORE shrinking. The answer should be captured at the moment the window first becomes valid, then kept updated as we shrink to find smaller valid windows.
</details>


## TCP Congestion Control — Don't Crash the Internet

```
THE PROBLEM:
  Flow control prevents overwhelming the RECEIVER.
  But what about the NETWORK? (routers between sender and receiver)
  
  If everyone sends at full speed → routers overflow → packets dropped.
  If packets dropped → retransmissions → MORE data → MORE drops → COLLAPSE.
  This actually happened in 1986 (internet congestion collapse).

SOLUTION: TCP Congestion Control (Van Jacobson, 1988).
  Sender maintains a CONGESTION WINDOW (cwnd) in ADDITION to receive window.
  Actual window = min(cwnd, receive_window).
  cwnd adapts based on network conditions.

THE 4 PHASES:

1. SLOW START:
   Initial cwnd = 1 MSS (maximum segment size, typically 1460 bytes).
   For each ACK received → cwnd doubles (exponential growth!).
   
   cwnd: 1 → 2 → 4 → 8 → 16 → 32 → 64 MSS
   "Slow" is misleading — it's actually exponential!
   Called "slow" because it starts from 1 (not from max).
   
   Continues until: cwnd reaches ssthresh (slow start threshold).

2. CONGESTION AVOIDANCE:
   When cwnd ≥ ssthresh → switch to LINEAR growth.
   For each RTT → cwnd increases by 1 MSS.
   cwnd: 64 → 65 → 66 → 67 → 68 → ...
   
   Probes for more bandwidth cautiously. Additive increase.

3. PACKET LOSS DETECTED (congestion signal):
   
   3a. TIMEOUT (worst case):
     No ACK after RTO (retransmission timeout) → assume severe congestion.
     ssthresh = cwnd / 2
     cwnd = 1 MSS (back to slow start!)
     
   3b. TRIPLE DUPLICATE ACK (milder):
     Receiver sends ACK for byte 5000 three times → "I'm missing 5000!"
     This means packets ARE arriving, just one is lost.
     FAST RETRANSMIT: resend the missing segment immediately.
     FAST RECOVERY: ssthresh = cwnd / 2, cwnd = ssthresh + 3
     → Skip slow start, go directly to congestion avoidance.

4. THE SAW-TOOTH PATTERN:
   Over time, TCP's cwnd oscillates:
   
   cwnd
    ^
    |      /\    /\    /\    /\
    |     /  \  /  \  /  \  /
    |    /    \/    \/    \/
    |   /
    |  /  (slow start)
    | /
    └────────────────────────────→ time
   
   Looks like a sawtooth. Each drop = packet loss detected.
   TCP constantly probes for more bandwidth → finds the limit → backs off → repeats.

MODERN ALGORITHMS:
  TCP Reno (1990): the classic. Triple dup ACK → fast recovery.
  TCP New Reno: improved recovery of multiple losses.
  TCP CUBIC (2008): default in Linux. Better for high-bandwidth, high-latency.
    Cubic function: grows aggressively far from last loss, cautiously near it.
  TCP BBR (Google, 2016): model-based. Estimates bandwidth AND RTT.
    Doesn't rely on packet loss as a signal → better for lossy networks (WiFi, 4G).
    Used by: YouTube, Google Cloud. Significantly better than CUBIC for video streaming.
```



🔬 **Section Challenge — TCP Congestion Control — Don't Crash the Internet**

**Challenge 1 (Reasoning):** A TCP connection is in TIME_WAIT state. What is it waiting for and why 2×MSL (Maximum Segment Lifetime)?
<details><summary>Answer</summary>

TIME_WAIT: the side that sent the last ACK waits before fully closing. Why 2×MSL (~60-120 seconds): (1) Ensure the final ACK reached the other side (if it was lost, the other side will retransmit FIN — we need to still be listening to send a new ACK). (2) Allow all old segments in the network to expire (segment with old sequence number arriving for a new connection could corrupt data). Fast servers on many short connections: TIME_WAIT exhaustion → `SO_REUSEADDR`, `tcp_time_wait_reuse`, or HTTP keep-alive.
</details>


## Nagle's Algorithm & Delayed ACKs

```
NAGLE'S ALGORITHM:
  PROBLEM: Sending many tiny packets (1-byte payloads) wastes bandwidth.
    Each packet has 40 bytes overhead (20 TCP + 20 IP).
    1 byte data + 40 bytes header = 2.4% efficiency!
  
  SOLUTION (John Nagle, 1984):
    If there's unacknowledged data in flight → BUFFER new data.
    Don't send until either:
    a) Previous data is ACK'd, OR
    b) Buffer reaches MSS (full segment)
  
  EFFECT: Reduces many tiny sends to fewer larger sends.
  
  PROBLEM FOR INTERACTIVE APPS:
    SSH: you type 'l', it buffers. You type 's', it buffers.
    200ms later (after ACK) → sends "ls" as one packet.
    User feels DELAY. Not acceptable!
    
    Solution: TCP_NODELAY socket option.
    Disables Nagle's → every write() sends immediately.
    Used by: SSH, gaming, real-time systems, databases.

DELAYED ACKS:
  PROBLEM: Sending an ACK for every segment = many tiny ACK packets.
  SOLUTION: Wait up to 200ms → maybe more data arrives → ACK both at once.
  Or: if receiver has data to send → piggyback ACK with the data.
  
  NAGLE + DELAYED ACK INTERACTION (the worst case):
    Client sends small request (Nagle holds more data, waiting for ACK).
    Server delays ACK (hoping to piggyback with response).
    Both are waiting for each other → 200ms delay before anything happens!
    
    This is a classic production bug. Fix: disable Nagle (TCP_NODELAY).
```

```python
# ── TCP SOCKET PROGRAMMING (showing all the concepts) ──
import socket

# SERVER SIDE
server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# SO_REUSEADDR: allow reuse of TIME_WAIT sockets
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# TCP_NODELAY: disable Nagle's algorithm (send immediately)
server.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)

# Bind to all interfaces on port 8080
server.bind(("0.0.0.0", 8080))

# Backlog of 128: how many pending connections to queue
# If queue is full → new SYN packets get RST (connection refused)
server.listen(128)

print("Server listening on 0.0.0.0:8080")

while True:
    # accept() blocks until a client completes the 3-way handshake
    client_sock, client_addr = server.accept()
    print(f"New connection from {client_addr}")
    
    # Set receive timeout (don't wait forever for data)
    client_sock.settimeout(30.0)  # 30 seconds
    
    try:
        # recv(): read from the TCP receive buffer
        # TCP is a STREAM: no message boundaries!
        # recv(4096) might return 1 byte or 4096 bytes.
        # You must handle partial reads!
        data = b""
        while True:
            chunk = client_sock.recv(4096)
            if not chunk:  # empty = connection closed by peer (FIN received)
                break
            data += chunk
            if b"\r\n\r\n" in data:  # HTTP: empty line = end of headers
                break
        
        # Send response
        response = b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK"
        client_sock.sendall(response)  # sendall: keeps sending until ALL bytes sent
        
    except socket.timeout:
        print("Client timed out")
    finally:
        client_sock.close()  # sends FIN → 4-way close handshake
```

```python
# ── CLIENT SIDE (showing connection lifecycle) ──
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# Connect timeout: how long to wait for SYN-ACK
sock.settimeout(5.0)

try:
    # connect() = SYN → wait for SYN-ACK → send ACK
    sock.connect(("api.myapp.com", 8080))  # 3-way handshake happens HERE
    print("Connected!")
    
    # TCP_NODELAY for real-time communication
    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
    
    # Send HTTP request
    request = b"GET /users HTTP/1.1\r\nHost: api.myapp.com\r\n\r\n"
    sock.sendall(request)
    
    # Receive response
    response = b""
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            break
        response += chunk
    
    print(response.decode())

except socket.timeout:
    print("Connection timed out (no SYN-ACK received)")
except ConnectionRefusedError:
    print("Connection refused (RST received — server not listening on this port)")
except socket.gaierror:
    print("DNS resolution failed (hostname not found)")
finally:
    sock.close()  # FIN → FIN-ACK → ACK → ACK (4-way close)
```

---

# PART 3: UDP — The Simple Protocol

---

```
UDP HEADER (8 bytes — compare to TCP's 20+ bytes!):

├───────────────────────────┼───────────────────────────┤
│   Source Port (16)        │  Destination Port (16)    │
├───────────────────────────┼───────────────────────────┤
│     Length (16)           │     Checksum (16)         │
├───────────────────────────┴───────────────────────────┤
│                     Data                              │
└───────────────────────────────────────────────────────┘

THAT'S IT. 8 bytes of header. No sequence numbers, no ACKs, no windows.
No connection setup (no handshake). No guarantees.

WHY UDP IS FAST:
  1. No handshake: first packet goes immediately (TCP needs 1.5 RTT setup).
  2. No state: server doesn't track connections (can handle millions of clients).
  3. No congestion control: sends at whatever rate the app wants.
  4. Tiny header: 8 bytes vs TCP's 20-60 bytes.
  5. No retransmission: no waiting for ACKs, no resends.

WHERE UDP IS USED:
  DNS (port 53):      Small query + response. If lost → application retries.
  DHCP (67/68):       Broadcast-based. Can't use TCP (no IP address yet!).
  NTP (port 123):     Time synchronization. 1 packet each way.
  SNMP (161):         Network monitoring. Missing one update is OK.
  Video streaming:    RTP (Real-time Transport Protocol) over UDP.
  Gaming:             Player position updates. Newest data > old retransmission.
  VoIP (SIP/RTP):     Voice calls. Dropped packet = tiny audio blip.
  QUIC (HTTP/3):      Reliable protocol BUILT ON TOP of UDP. See below.
```

```python
# ── UDP CLIENT AND SERVER ──

# UDP SERVER
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # DGRAM = UDP
server.bind(("0.0.0.0", 5000))

print("UDP server listening on port 5000")
while True:
    # recvfrom: no accept() needed! UDP is connectionless.
    data, client_addr = server.recvfrom(1024)
    print(f"Received from {client_addr}: {data.decode()}")
    
    # Send response back to the client's address
    server.sendto(b"ACK: " + data, client_addr)

# UDP CLIENT
import socket

client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
client.sendto(b"Hello UDP!", ("localhost", 5000))

# No connect() needed. Just sendto().
# If the server isn't running → packet is silently lost. No error!
# (TCP would give ConnectionRefusedError)

response, addr = client.recvfrom(1024)
print(f"Response: {response.decode()}")
```

---

# PART 4: QUIC — The Future of Transport (HTTP/3)

---

```
QUIC = Quick UDP Internet Connections (Google, 2012 → IETF standard 2021).

THE PROBLEM WITH TCP + TLS:
  Step 1: TCP handshake (1 RTT = ~20ms)
  Step 2: TLS handshake (1 RTT = ~20ms)
  Total: 2 RTTs before first byte of data = ~40ms minimum.
  
  For repeated connections: TLS 1.3 has 0-RTT resumption → 1 RTT total.
  But TCP still needs its own handshake. ALWAYS at least 1 RTT for TCP.

QUIC'S SOLUTION:
  Build reliability ON TOP OF UDP. Combine transport + TLS into ONE protocol.
  
  First connection: 1 RTT (TCP handshake + TLS combined into single step).
  Repeated connection: 0 RTT! (cached credentials → data in first packet!)
  
  QUIC OVER UDP (not raw UDP — QUIC adds its own reliability):
  ┌──────────────────────────────────┐
  │ Application (HTTP/3)             │
  ├──────────────────────────────────┤
  │ QUIC (reliability + encryption)  │
  ├──────────────────────────────────┤
  │ UDP (just a thin wrapper)        │
  ├──────────────────────────────────┤
  │ IP                               │
  └──────────────────────────────────┘

KEY INNOVATIONS:

1. NO HEAD-OF-LINE BLOCKING:
   TCP: if packet 3 of 10 is lost → ALL subsequent packets wait for retransmission.
   QUIC: each STREAM is independent. Stream A's loss doesn't block Stream B.
   
   Loading a web page (10 resources): one lost image packet doesn't delay CSS delivery!

2. CONNECTION MIGRATION:
   TCP connection = (src_ip, src_port, dst_ip, dst_port).
   Switch from WiFi to 4G → IP changes → TCP connection BREAKS → reconnect!
   
   QUIC connection = connection ID (independent of IP!).
   Switch from WiFi to 4G → same connection ID → seamless handoff.
   
   This is how your YouTube video doesn't buffer when you walk from WiFi to cellular.

3. BUILT-IN ENCRYPTION:
   All QUIC packets are encrypted (no unencrypted QUIC).
   Even metadata (packet numbers) is encrypted.
   Middleboxes (firewalls, ISPs) CAN'T inspect or modify QUIC headers.
   This is both a benefit (privacy) and a concern (enterprises can't inspect traffic).

WHO USES QUIC / HTTP/3:
  Google (YouTube, Search, Gmail)
  Facebook/Meta (Instagram, WhatsApp)
  Cloudflare (30%+ of their traffic)
  Akamai, Fastly (CDNs)
  Apple (Safari, iCloud)
  
  ~30% of all web traffic is HTTP/3 as of 2024.
```

---

# PART 5: TCP Tuning — Production Linux Kernel Settings

---

```bash
# ── LINUX KERNEL TCP PARAMETERS ──
# These are the knobs that SREs turn in production.

# View current settings
sysctl net.ipv4.tcp_fin_timeout          # TIME_WAIT duration (default: 60s)
sysctl net.ipv4.tcp_tw_reuse             # Reuse TIME_WAIT sockets (default: 0)
sysctl net.core.somaxconn                # Max listen backlog (default: 4096)
sysctl net.ipv4.tcp_max_syn_backlog      # Max SYN queue size (default: 1024)
sysctl net.core.rmem_max                 # Max receive buffer (default: 212992)
sysctl net.core.wmem_max                 # Max send buffer (default: 212992)

# HIGH-TRAFFIC SERVER TUNING:
# Reduce TIME_WAIT duration
sudo sysctl -w net.ipv4.tcp_fin_timeout=15

# Allow reuse of TIME_WAIT sockets for new connections
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# Increase listen backlog (for high concurrent connection rate)
sudo sysctl -w net.core.somaxconn=65535

# Increase SYN queue (defense against SYN flood)
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535

# Enable SYN cookies (defense against SYN flood attacks)
sudo sysctl -w net.ipv4.tcp_syncookies=1

# Increase socket buffer sizes (for high-bandwidth connections)
sudo sysctl -w net.core.rmem_max=16777216    # 16 MB
sudo sysctl -w net.core.wmem_max=16777216
sudo sysctl -w net.ipv4.tcp_rmem="4096 87380 16777216"
sudo sysctl -w net.ipv4.tcp_wmem="4096 87380 16777216"

# Enable TCP BBR congestion control (Google's algorithm)
sudo sysctl -w net.core.default_qdisc=fq
sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# Verify BBR is active
sysctl net.ipv4.tcp_congestion_control
# Output: net.ipv4.tcp_congestion_control = bbr

# Increase ephemeral port range (more outgoing connections)
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# Make persistent (survives reboot)
echo "net.ipv4.tcp_fin_timeout = 15" >> /etc/sysctl.conf
sudo sysctl -p  # reload
```

```
WHEN TO TUNE WHAT:

SYMPTOM                      │ LIKELY CAUSE              │ FIX
─────────────────────────────┼───────────────────────────┼────────────────────────
Many TIME_WAIT connections   │ Short-lived connections   │ tcp_tw_reuse=1, connection pooling
"Cannot assign address"      │ Ephemeral port exhaustion │ Increase port range, connection pooling
Connection refused under load│ Listen backlog full       │ Increase somaxconn
Slow large file transfers    │ Small TCP window          │ Increase rmem/wmem_max
High retransmission rate     │ Network congestion        │ Switch to BBR
Latency spikes               │ Nagle + delayed ACK       │ TCP_NODELAY in app code
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **Sliding window pattern** | [Patterns](../04_Patterns_Templates/01_Sliding_Window.md) — the coding pattern inspired by TCP |
| **Algorithms in production** | [Algorithms](../03_Algorithms/12_Algorithms_In_Production.md) — TCP sliding window, Dijkstra routing |
| **Queue (TCP buffers)** | [DS in Production](../02_Data_Structures/05_DS_In_Production.md) — ring buffers |
| **State machine (TCP states)** | [Patterns](../04_Patterns_Templates/) — finite state machines |
| **Python asyncio (non-blocking TCP)** | [Asyncio Internals](../21_Python_ML_DL_NLP/02b_Python_Asyncio_Internals.md) |
| **IP addressing** | [Ch 05: IP & Subnets](05_IP_Addressing_Subnets.md) |
| **HTTP over TCP** | [Ch 08: HTTP Complete](08_HTTP_Complete.md) |
| **K8s service (TCP load balancing)** | [Networking & Security](02_Networking_Security.md) — kube-proxy |
| **SQL connections** | [SQL Internals](../08_SQL/49_SQL_Internals_Deep.md) — connection pooling |

---


---

## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |



---

## 🧠 Deep Conceptual Questions — Algorithm Design & Analysis

**C1. What does O(N log N) "feel like" and why is it the complexity barrier for comparison-based sorting?**
<details><summary>Deep Answer</summary>

O(N log N) for N=1M ≈ 20M operations. O(N²) ≈ 1 trillion. The difference is 50,000x. **Comparison sort lower bound**: any comparison-based sort must distinguish between N! possible orderings. Each comparison has 2 outcomes. A decision tree with N! leaves needs ≥ log₂(N!) height ≈ N log N (Stirling's approximation). Therefore NO comparison sort can beat O(N log N) in the worst case. Non-comparison sorts (counting sort, radix sort, bucket sort) break this bound by using non-comparison operations — but require constraints on input (e.g., integer range bounded by N).
</details>

**C2. Greedy algorithms: when do they work and what must be proven?**
<details><summary>Deep Answer</summary>

A greedy algorithm makes the locally optimal choice at each step. Works when problem has: (1) **Greedy choice property**: local optimal leads to global optimal — the choice never needs to be revised. (2) **Optimal substructure**: optimal solution to the problem contains optimal solutions to subproblems. To PROVE greedy is correct: use "exchange argument" — assume optimal solution differs from greedy, show you can swap greedy's choice in without making it worse, contradiction. Greedy FAILS when: future choices depend on current choice in complex ways (use DP instead). Classic works: interval scheduling, Huffman coding, Dijkstra. Classic fails: 0-1 knapsack (use DP).
</details>

**C3. Dynamic Programming: what is "overlapping subproblems" and why does it matter?**
<details><summary>Deep Answer</summary>

Overlapping subproblems: the same sub-computation appears multiple times. Fibonacci: `fib(5)` calls `fib(4)` and `fib(3)`. `fib(4)` also calls `fib(3)`. Without memoization: `fib(3)` computed exponentially many times → O(2^N). With memoization: each sub-result computed once and stored → O(N). DP is valuable SPECIFICALLY when: (1) problem has optimal substructure AND (2) subproblems overlap. If no overlap: just use divide-and-conquer (merge sort's subproblems don't overlap → no DP needed). DP = "smart recursion" = avoid recomputing.
</details>

**C4. Top-down (memoization) vs Bottom-up (tabulation) DP — when to choose each?**
<details><summary>Deep Answer</summary>

**Top-down (memoization)**: Write natural recursion + cache results. Easy to implement, only computes needed subproblems (sparse computation). Cons: recursion overhead and stack depth risk. Use when: problem is naturally recursive, only a fraction of subproblems needed. **Bottom-up (tabulation)**: Fill DP table iteratively from base cases. No recursion overhead, better cache performance, easier space optimization. Use when: need all subproblems (or most of them), want to optimize space (can often reduce to 1D from 2D). Rule: start with top-down for correctness verification, optimize to bottom-up for performance.
</details>

**C5. Dijkstra's Algorithm: why does it fail on negative weights?**
<details><summary>Deep Answer</summary>

Dijkstra assumes: once a node is "settled" (extracted from the priority queue with its final shortest distance), that distance is optimal. With negative weights: settling node A at distance 5 might not be final — a path through B (distance 7) → C (edge -10) → A gives distance -3. But A was already settled! Dijkstra doesn't revisit settled nodes. Bellman-Ford handles negatives by relaxing ALL edges N-1 times — no "settled" assumption. For graphs with negative cycles: Bellman-Ford detects them (if distances still decrease after N-1 rounds, there's a negative cycle).
</details>

**C6. Union-Find: why is path compression + union by rank/size nearly O(1)?**
<details><summary>Deep Answer</summary>

**Path compression**: when finding the root of element x, make every node on the path point directly to the root. Flattens the tree. Future finds on those paths: O(1). **Union by rank**: always attach the smaller tree under the larger → limits tree height to O(log N). Combined: inverse Ackermann function α(N) amortized — so slow-growing it's practically constant (α(10^80) = 4). Neither alone is optimal: path compression without union by rank → O(log N) amortized. Union by rank without path compression → O(log N). Together → α(N) ≈ O(1) amortized. Used in: Kruskal's MST, cycle detection, connected components.
</details>

**C7. Binary Search on the Answer — what types of problems does it apply to?**
<details><summary>Deep Answer</summary>

When the answer space is **monotone**: "if X is achievable, then all values less extreme than X are also achievable." Problems: minimize the maximum (aggressive cows, split array), find minimum valid threshold (Koko bananas, minimum days to bloom), divide-and-conquer feasibility. Template: binary search on the answer range [lo, hi], for each mid check `isFeasible(mid)` in O(N) or O(N log N). Total: O(N log(answer_range)). Key insight: reframe "find optimal value" as "find smallest X where condition holds" → enables binary search on a non-array space.
</details>

**C8. Why does merge sort guarantee stability while quicksort doesn't?**
<details><summary>Deep Answer</summary>

**Merge sort stability**: during merge, when two elements are equal, we always take from the LEFT array first → preserves original relative order. **QuickSort instability**: the partition step swaps elements across the pivot without regard to original order. Two equal elements may be placed on opposite sides of the pivot, reversing their order. QuickSort CAN be made stable (Lomuto partition with careful implementation) but loses performance. Java uses TimSort for objects (stable), dual-pivot quicksort for primitives (stability irrelevant since primitives without fields).
</details>

**C9. Backtracking: what's the difference from plain DFS and when to use vs DP?**
<details><summary>Deep Answer</summary>

**Backtracking vs DFS**: DFS visits every path. Backtracking prunes paths early when a constraint is violated — avoids exploring infeasible branches. Same asymptotic but drastically different practical performance with good pruning. **Backtracking vs DP**: backtracking for **combinatorial/enumeration** problems (find all solutions, permutations, subsets). DP for **optimization** problems (find optimal single solution). Backtracking produces exponential solutions in worst case but is necessary when you need ALL solutions. DP finds the optimal in polynomial time when overlapping subproblems exist.
</details>

**C10. What is amortized analysis and how does it differ from average-case analysis?**
<details><summary>Deep Answer</summary>

**Amortized**: analyzes the average cost per operation over a SEQUENCE of operations — in the worst case. No probability involved. Guarantees: N operations ALWAYS take O(N·T) total, even if some individual operations are O(N·T). Example: ArrayList append is O(N) when resizing, but amortized O(1) because resizing is rare. **Average-case**: analyzes expected cost of a SINGLE operation assuming random input. QuickSort is O(N log N) average-case (random pivot). Amortized is a stronger guarantee — it holds even for adversarial input sequences.
</details>


**Navigation**: [← IP Addressing](05_IP_Addressing_Subnets.md) | [Index](00_INDEX.md) | [Next → DNS](07_DNS_Complete.md)
