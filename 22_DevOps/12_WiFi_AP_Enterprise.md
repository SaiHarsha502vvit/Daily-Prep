> **Navigation**: [← Load Balancing](11_Load_Balancing_Proxies.md) | [Index](00_INDEX.md) | [Next → Cloud VPC](13_Cloud_Networking_VPC.md)

# 📡 Chapter 12: WiFi, Access Points & Enterprise Networking

> _"Your home WiFi router is a Swiss Army knife — it does everything but nothing well. Enterprise networking separates each function into specialized hardware, managed centrally, designed for thousands of users."_

---

# PART 1: Home Router vs Enterprise — The Architecture Gap

---

```
YOUR HOME ROUTER IS 7 DEVICES IN ONE:

  ┌────────────────────────────────────┐
  │         HOME ROUTER                 │
  ├────────────────────────────────────┤
  │ 1. MODEM: converts ISP signal      │
  │    (DOCSIS/DSL/fiber) to Ethernet  │
  │ 2. ROUTER: NAT, routes between     │
  │    internal network and internet   │
  │ 3. SWITCH: 4x Ethernet ports       │
  │    (connects wired devices)        │
  │ 4. WIFI AP: broadcasts SSID        │
  │    (WiFi chip + antennas)          │
  │ 5. FIREWALL: basic NAT firewall    │
  │    (blocks unsolicited inbound)    │
  │ 6. DHCP SERVER: assigns IPs        │
  │    to connected devices            │
  │ 7. DNS FORWARDER: forwards DNS     │
  │    queries to ISP resolver         │
  └────────────────────────────────────┘

ENTERPRISE separates EVERY FUNCTION:
  Edge router (Cisco ISR): connects to ISP via BGP.
  Core switch (Cisco Nexus): 10-100 Gbps backbone.
  Distribution switch: per-floor, L3 routing between VLANs.
  Access switch (Cisco Catalyst): per-room, connects endpoints, PoE for APs.
  Access Point (Cisco/Aruba/UniFi): WiFi only, managed by controller.
  WiFi Controller (Cisco WLC/UniFi): centralized AP management.
  Firewall (Palo Alto/FortiGate): security between zones.
  DHCP Server (Windows Server/ISC DHCP): enterprise IP assignment.
  DNS Server (Active Directory DNS/BIND): internal name resolution.
```

---

# PART 2: Access Points — Deep Dive

---

```
AN ACCESS POINT IS A:
  Layer 2 device that bridges wireless clients to the wired network.
  THAT'S IT. No routing. No NAT. No DHCP. Just wireless ↔ wired.

DEPLOYMENT MODELS:

1. STANDALONE (autonomous):
   Each AP is configured individually (SSID, channel, power).
   Works for: 1-5 APs (small office, home).
   Nightmare at scale: 100 APs × individual configs = chaos.

2. CONTROLLER-BASED (centralized):
   WiFi Controller manages ALL APs from one dashboard.
   Pushes config: SSID, channel, power level, security.
   Dynamic adjustments: AP detects interference → controller changes channel.
   Roaming: client moves between APs → controller handles handoff seamlessly.

   Vendors:
   Cisco WLC + Cisco APs (enterprise, expensive)
   Aruba HPE + Aruba APs (enterprise, strong AI optimization)
   UniFi Controller + UniFi APs (prosumer, best value)
   Meraki + Meraki APs (cloud-managed by Cisco, subscription)

3. CLOUD-MANAGED:
   Controller runs in the cloud (vendor-hosted).
   APs connect to vendor's cloud management plane.
   Configure from anywhere via web dashboard.
   Examples: Meraki (Cisco), ExtremeCloud, UniFi Cloud.

PHYSICAL DEPLOYMENT:

  PoE (Power over Ethernet):
  AP needs ONE cable: Ethernet (data + power from PoE switch).
  No separate power adapter! Makes deployment easy.

  Mounting: ceiling-mount (most common), wall-mount, outdoor.
  Coverage: 1 AP per 2,000-5,000 sq ft (depends on walls, density).
  Density: 1 AP per 25-50 users (for active workloads).

  SITE SURVEY:
  Before installing, do a WiFi site survey (tools: Ekahau, NetSpot).
  Map the building → identify dead zones → plan AP placement.
  Consider: walls (especially concrete/brick), metal objects, elevator shafts.

CHANNEL PLANNING:
  2.4 GHz: Only 3 non-overlapping channels: 1, 6, 11.
  If two neighboring APs both use channel 1 → INTERFERENCE.
  Plan: AP1=ch1, AP2=ch6, AP3=ch11, AP4=ch1 (repeat pattern).

  5 GHz: 25 non-overlapping channels. Much easier to plan.
  Use 80 MHz wide channels (4 non-overlapping) or 40 MHz (8+).

  6 GHz: 59 non-overlapping 20 MHz channels. Almost no planning needed.
```

---

# PART 3: Enterprise WiFi Security — WPA3 & 802.1X

---

```
WIFI SECURITY EVOLUTION:
  WEP (1997):   BROKEN. Cracked in minutes. Never use.
  WPA (2003):   TKIP. Partially broken. Legacy only.
  WPA2 (2004):  AES-CCMP. Secure for personal use. Standard today.
  WPA3 (2018):  SAE (Simultaneous Authentication of Equals).
                Protected against offline dictionary attacks.
                Individual data encryption (each client has unique key).

WPA2-Personal vs WPA2-Enterprise:
  PERSONAL (PSK):
    One password for everyone. Everyone shares the same key.
    Problem: employee leaves → must change password for EVERYONE.
    Acceptable for: home, small office.

  ENTERPRISE (802.1X):
    Each user has UNIQUE credentials. No shared password.
    Uses RADIUS server for authentication.

    FLOW:
    1. Client connects to SSID.
    2. AP blocks all traffic except 802.1X auth (Extensible Authentication Protocol).
    3. Client sends credentials to AP (via EAP).
    4. AP forwards to RADIUS server (FreeRADIUS, Microsoft NPS, Cisco ISE).
    5. RADIUS verifies:
       - Username/password (EAP-TTLS/PAP)
       - Client certificate (EAP-TLS — most secure)
       - Active Directory lookup (user is in "WiFi-Users" group?)
    6. RADIUS responds: ACCEPT or REJECT.
    7. If ACCEPT: RADIUS tells AP which VLAN to assign the user to!
       Employee → VLAN 10 (full access).
       Guest → VLAN 20 (internet only).
       IoT → VLAN 30 (isolated).
    8. AP generates unique encryption key for this client session.

VLAN ASSIGNMENT VIA RADIUS:
  This is how enterprise WiFi provides NETWORK SEGMENTATION via WiFi:

  One SSID: "CorpWiFi"
  Employee logs in: RADIUS assigns VLAN 10 → full access → internal servers.
  Contractor logs in: RADIUS assigns VLAN 20 → limited access → only specific servers.
  Guest logs in: RADIUS assigns VLAN 30 → internet only → no internal access.

  All on the SAME SSID! RADIUS dynamically segments users.
```

---

# PART 4: Troubleshooting WiFi

---

```bash
# ── WIFI DIAGNOSTICS ──

# Linux: scan for nearby WiFi networks
sudo iwlist wlan0 scan | grep -E "ESSID|Channel|Signal"

# Show your WiFi connection details
iwconfig wlan0
# Output: ESSID:"CorpWiFi"  Frequency:5.18 GHz  Access Point: AA:BB:CC:DD:EE:FF
#         Bit Rate=866.7 Mb/s  Signal level=-55 dBm

# Signal strength guide:
# -30 dBm: excellent (right next to AP)
# -50 dBm: great (typical office)
# -60 dBm: good
# -67 dBm: minimum for reliable video streaming
# -70 dBm: minimum for web browsing
# -80 dBm: weak (disconnection likely)
# -90 dBm: unusable

# macOS: hold Option + click WiFi icon → detailed info
# Or: /System/Library/PrivateFrameworks/Apple80211.framework/.../airport -s

# Windows: show WiFi report
netsh wlan show interfaces     # current connection
netsh wlan show networks mode=bssid  # nearby networks with signal

COMMON WIFI PROBLEMS:
  Slow speed but strong signal → channel interference.
    Fix: change to less crowded channel (or use 5/6 GHz).

  Intermittent drops → AP overloaded or roaming issue.
    Fix: add more APs, enable fast roaming (802.11r).

  Good signal but can't connect → authentication failure.
    Fix: check RADIUS server logs, client certificates.

  Dead zones → physical obstruction.
    Fix: add AP or WiFi extender/mesh node.
```

---

## 🔗 Cross-References

| Topic                | Related Content                                                               |
| -------------------- | ----------------------------------------------------------------------------- |
| **Physical layer**   | [Ch 04: Fundamentals](04_Networking_Complete.md) — WiFi standards, modulation |
| **VLANs**            | [Ch 04: Fundamentals](04_Networking_Complete.md) — VLAN trunking, 802.1Q      |
| **DHCP**             | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — DORA process            |
| **TLS/certificates** | [Ch 09: TLS](09_TLS_Encryption.md) — EAP-TLS client certs                     |
| **Firewall zones**   | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — VLAN firewalling         |
| **Cloud WiFi**       | [Cloud Networking](13_Cloud_Networking_VPC.md) — virtual networks             |
