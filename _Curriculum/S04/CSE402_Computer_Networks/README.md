# CSE402 — Computer Networks

## Description

Computer Networks is the study of how distributed systems communicate. This course covers the full protocol stack from physical to application layer, with hands-on labs using Wireshark packet analysis and socket programming in Python/C — giving you the expertise to design, debug, and secure networked systems.

> **Note:** Networks labs include Wireshark packet dissection and socket programming exercises.

## Learning Outcomes

- Explain the OSI 7-layer model and TCP/IP stack; map protocols to each layer
- Analyze Ethernet, IP, TCP, and UDP headers; interpret Wireshark captures
- Implement client-server applications using BSD sockets (TCP and UDP)
- Understand congestion control, flow control, and reliability mechanisms in TCP
- Design and subnet IPv4/IPv6 networks; understand routing algorithms (Dijkstra, Bellman-Ford)
- Evaluate network performance: throughput, latency, bandwidth-delay product, queuing theory

## Syllabus Outline

- **Unit 1:** Network Fundamentals — Protocol layers, OSI model, TCP/IP stack, network topologies
- **Unit 2:** Physical & Data Link Layer — Encoding, framing, error detection (CRC, checksums), Ethernet, ARP
- **Unit 3:** Network Layer — IP addressing, subnets, routing algorithms, ICMP, IPv6
- **Unit 4:** Transport Layer — TCP/UDP, 3-way handshake, flow control, congestion control, sockets API
- **Unit 5:** Application Layer — HTTP, DNS, DHCP, SMTP, WebSockets, REST APIs
- **Unit 6:** Network Security — TLS basics, symmetric/asymmetric encryption, certificates, MITM attacks
- **Unit 7:** Advanced Topics — SDN, CDN, BGP, wireless (802.11), quality of service

## Existing Content

> **TBD — Phase 3** — No existing content linked yet. This shell is scaffolded for Phase 3 content development.

## Subdirectories

- `lectures/` — Topic-by-topic lecture notes
- `labs/` — Wireshark packet analysis and socket programming labs
- `assignments/` — Graded network analysis and implementation tasks
- `projects/` — Capstone: implement a reliable transport protocol or network diagnostic tool
- `rubrics/` — Grading criteria for all deliverables