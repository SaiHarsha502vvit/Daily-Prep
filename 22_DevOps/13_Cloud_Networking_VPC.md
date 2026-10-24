> **Navigation**: [← WiFi & APs](12_WiFi_AP_Enterprise.md) | [Index](00_INDEX.md) | [Next → SSH](14_SSH_Remote_Access.md)

# ☁️ Chapter 13: Cloud Networking (AWS VPC) — Virtual Networks in the Cloud

> _"In the cloud, you don't buy cables and switches — you define networks with code. But the CONCEPTS are identical. Subnets, routing tables, firewalls, NAT — it's all there, just software-defined."_

---

# PART 1: VPC Architecture — Your Private Cloud Network

---

```
AWS VPC (Virtual Private Cloud):
  Your own isolated section of the AWS cloud.
  You choose the CIDR block (e.g., 10.0.0.0/16 = 65,536 IPs).
  Inside the VPC: you create subnets, route tables, gateways, security rules.

  ANALOGY: A VPC is like buying a plot of land.
  You decide: where to put the public parking lot (public subnet),
  where the private offices go (private subnet), where the security gates are (SG/NACL),
  and how visitors get in (Internet Gateway).

VPC COMPONENTS:

  ┌────────────────────────── VPC: 10.0.0.0/16 ──────────────────────────┐
  │                                                                       │
  │  ┌─── PUBLIC SUBNET ──┐     ┌─── PRIVATE SUBNET ─┐                  │
  │  │ 10.0.1.0/24         │     │ 10.0.2.0/24         │                  │
  │  │                     │     │                     │                  │
  │  │ ┌───────────┐       │     │ ┌───────────┐       │                  │
  │  │ │ Web Server│       │     │ │ Database  │       │                  │
  │  │ │ (public IP)│      │     │ │ (no pub IP)│      │                  │
  │  │ └───────────┘       │     │ └───────────┘       │                  │
  │  │                     │     │                     │                  │
  │  │ ┌───────────┐       │     │ ┌───────────┐       │                  │
  │  │ │ NAT GW    │       │     │ │ App Server│       │                  │
  │  │ └───────────┘       │     │ └───────────┘       │                  │
  │  └─────────────────────┘     └─────────────────────┘                  │
  │          ↕                           ↕                                │
  │  ┌─────────────┐           ┌─────────────┐                           │
  │  │ Route Table │           │ Route Table │                           │
  │  │ 0.0.0.0→IGW│           │ 0.0.0.0→NAT│                           │
  │  └─────────────┘           └─────────────┘                           │
  │          ↕                                                            │
  │  ┌─────────────┐                                                     │
  │  │Internet GW  │ ←→ Internet                                        │
  │  └─────────────┘                                                     │
  └───────────────────────────────────────────────────────────────────────┘

PUBLIC SUBNET:
  Route table has: 0.0.0.0/0 → Internet Gateway.
  Instances can have public IPs → reachable from internet.
  For: Web servers, load balancers, bastion hosts.

PRIVATE SUBNET:
  Route table has: 0.0.0.0/0 → NAT Gateway (in public subnet).
  NO Internet Gateway route → instances are NOT reachable from internet.
  Can still reach internet (for updates, API calls) via NAT Gateway.
  For: Databases, app servers, internal services.

SUBNET DESIGN (best practices):
  2+ Availability Zones for redundancy:
  Public-AZ1:  10.0.1.0/24   | Public-AZ2:  10.0.3.0/24
  Private-AZ1: 10.0.2.0/24   | Private-AZ2: 10.0.4.0/24

  If AZ1 goes down → traffic shifts to AZ2 automatically.
```

---

# PART 2: Advanced VPC Features

---

```
VPC PEERING:
  Connect two VPCs → instances can communicate using PRIVATE IPs.
  No internet transit. Traffic stays on AWS backbone.
  Cross-account and cross-region supported!

  Limitation: NOT transitive! VPC-A peers with VPC-B, VPC-B peers with VPC-C.
  VPC-A CANNOT reach VPC-C through VPC-B. Must create separate peering.

TRANSIT GATEWAY:
  Solves the peering problem. Hub-and-spoke model.
  One Transit Gateway → all VPCs connect to it → full mesh connectivity.

  10 VPCs with peering: 10 × 9 / 2 = 45 peering connections!
  10 VPCs with Transit Gateway: 10 connections (one per VPC to the hub).

VPC ENDPOINTS (PrivateLink):
  Access AWS services (S3, DynamoDB, SQS) WITHOUT going through the internet!
  Traffic stays on AWS private network.

  Gateway Endpoint: S3, DynamoDB (free!). Adds route to VPC route table.
  Interface Endpoint: everything else (SQS, Secrets Manager, etc.). Creates ENI in your subnet.

  WHY: security (no internet exposure), latency (AWS backbone), cost (no NAT GW charges).

ELASTIC IP (EIP):
  Static public IPv4 address. Doesn't change when instance stops/starts.
  Cost: free when ATTACHED to a running instance. $3.65/month when idle.
  Use: NAT Gateway, bastion hosts, services that need stable IPs.

ELASTIC NETWORK INTERFACE (ENI):
  Virtual network card. Has: private IP, MAC, security groups.
  Can be detached from one instance and attached to another.
  Use: failover (move ENI with its IP to a healthy instance), multi-homed instances.
```

```hcl
# ── TERRAFORM: Production-Ready VPC (multi-AZ) ──

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  database_subnets = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false    # one NAT GW per AZ (HA!)
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs (network traffic logging)
  enable_flow_log                      = true
  create_flow_log_cloudwatch_log_group = true
  flow_log_max_aggregation_interval    = 60

  # Tags for cost tracking
  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# Database subnet group (for RDS)
resource "aws_db_subnet_group" "database" {
  name       = "production-db"
  subnet_ids = module.vpc.database_subnets
}

# VPC Endpoint for S3 (free, keeps traffic off internet)
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = module.vpc.vpc_id
  service_name = "com.amazonaws.us-east-1.s3"
  route_table_ids = module.vpc.private_route_table_ids
}
```

---

# PART 3: AWS vs GCP vs Azure Comparison

---

```
NETWORKING CONCEPT     │ AWS                │ GCP                 │ AZURE
───────────────────────┼────────────────────┼─────────────────────┼──────────────
Virtual Network        │ VPC                │ VPC Network         │ VNet
Subnet                 │ Subnet (per AZ)    │ Subnet (per region!)│ Subnet (per VNet)
Internet Gateway       │ IGW                │ Default (auto)      │ N/A (auto)
NAT                    │ NAT Gateway        │ Cloud NAT           │ NAT Gateway
Instance Firewall      │ Security Group     │ Firewall Rules      │ NSG
Subnet Firewall        │ NACL               │ Firewall Rules      │ NSG (subnet-level)
Peering                │ VPC Peering        │ VPC Peering         │ VNet Peering
Hub-and-Spoke          │ Transit Gateway    │ Network Connectivity│ Virtual WAN
Private Link           │ PrivateLink        │ Private Service     │ Private Link
Load Balancer (L4)     │ NLB                │ TCP/UDP LB          │ Azure LB
Load Balancer (L7)     │ ALB                │ HTTP(S) LB          │ App Gateway
CDN                    │ CloudFront         │ Cloud CDN           │ Azure CDN
DNS                    │ Route 53           │ Cloud DNS           │ Azure DNS

KEY DIFFERENCE:
  AWS subnets: one per Availability Zone (regional).
  GCP subnets: one per REGION (spans all zones in region automatically).
  GCP is simpler: fewer subnets to manage. But less fine-grained control.
```

---

# PART 4: Multi-VPC Architectures — Why Multiple VPCs Exist

---

## Why Multiple VPCs? The Problem with a Single VPC

```
SINGLE VPC PROBLEM:
  You have ONE VPC: 10.0.0.0/16 shared across ALL environments.
  Prod servers, staging servers, dev servers, databases — all in the same network.

  Problem 1: CIDR COLLISION RISK
    When you acquire a company or merge teams, they might already use 10.0.0.0/16.
    Now you need to re-IP everything. Painful and risky.

  Problem 2: BLAST RADIUS
    A misconfigured Security Group or route in staging could accidentally expose prod data.
    A compromised dev instance has network access to production databases.
    One mistake = company-wide incident.

  Problem 3: PERMISSION ISOLATION
    Dev team shouldn't be able to see production traffic logs.
    Finance team shouldn't have access to engineering network resources.
    Shared network = shared attack surface.

  Problem 4: REGULATORY COMPLIANCE
    PCI-DSS: cardholder data environment MUST be isolated.
    HIPAA: PHI systems must be segmented from general IT.
    FedRAMP: government workloads need hard network isolation.

  SOLUTION: Multiple VPCs, one per environment, team, or compliance boundary.
```

## VPC Peering vs Transit Gateway — The Evolution of Connectivity

```
VPC PEERING (1:1 connections):
  Connect VPC-A directly to VPC-B. Like a dedicated cable between two offices.
  Traffic is direct. No intermediate hops.
  Simple for 2-3 VPCs.

  LIMITATION — THE N² PROBLEM:
    If you have 10 VPCs and they all need to talk to each other:
    Connections needed = n × (n-1) / 2 = 10 × 9 / 2 = 45 peering connections!

    At VPC 11: 11 × 10 / 2 = 55 connections.
    At VPC 20: 20 × 19 / 2 = 190 connections.

    Each connection needs: route table entries, security group references,
    AWS CLI commands or console clicks, monitoring, IAM policies.
    Unmanageable at scale.

    ALSO: Peering is NOT transitive.
      VPC-A ←peers→ VPC-B ←peers→ VPC-C
      VPC-A CANNOT reach VPC-C through VPC-B.
      No "hopping" through intermediate VPCs.

TRANSIT GATEWAY (many-to-many hub):
  One central Transit Gateway. All VPCs connect TO it, not TO each other.

  10 VPCs + Transit Gateway = 10 connections (one per VPC to the hub).
  20 VPCs + Transit Gateway = 20 connections.

  Transit Gateway routes: "VPC-Prod traffic goes to VPC-DB."
  VPCs don't need to know about each other directly.

  WHY this works: Transit Gateway is a ROUTING HUB, not a switch.
  It maintains a routing table. It forwards packets based on DESTINATION.
  VPCs just need a route "0.0.0.0/0 → Transit Gateway" and the TGW handles the rest.
```

## AWS Organizations & Account Boundaries

```
AWS ORGANIZATIONS: Logical container for AWS accounts.

  Root (Management Account)
    ├── production (member account)
    ├── staging (member account)
    ├── development (member account)
    └── security-tools (member account)

WHY separate accounts?
  Billing isolation: Each account gets its own invoice. Track spend by team/project.
  Security isolation: Compromised dev account cannot access prod resources.
  Backup isolation: Prod backups can't be deleted by staging pipelines.
  Compliance: Auditors get read-only access to specific accounts only.
  Service limits: Limits are per-account (e.g., 5 VPCs per region per account).

ORGANIZATIONAL UNITS (OUs): Group accounts by function.

  Root
    ├── Security OU
    │   ├── SecurityTools
    │   └── LoggingAccount
    ├── Production OU
    │   ├── Prod-US
    │   └── Prod-EU
    └── Development OU
        ├── Dev-Team-A
        └── Dev-Team-B

  OU-level Service Control Policies (SCPs):
    "No S3 buckets in the Security OU may be public."
    "Prod OU may NOT delete CloudTrail logs."
    "Dev OU may ONLY use t3.micro and t3.small instances."

Cross-Account Networking:
  Transit Gateway can be shared across accounts using AWS Resource Access Manager (RAM).
  One TGW in the network account, shared with all member accounts.
  Member accounts create attachments to the shared TGW.
```

## Hub-and-Spoke vs Full-Mesh — When to Use Each

```
HUB-AND-SPOKE (Transit Gateway default):
  All spokes (VPCs) connect ONLY to the hub (TGW).
  VPC-A → TGW → VPC-B. VPC-A never talks to VPC-B directly.

  WHEN TO USE:
    Most cases. Especially when most VPCs need to reach a few common services.
    Example: All VPCs need access to shared-services (DNS, LDAP, monitoring).
    Example: Centralized egress (all internet traffic through one NATGW in the hub).

  ADVANTAGES:
    Simple routing: one place to see all traffic flows.
    Easy to add/remove VPCs: just add/remove one attachment.
    Centralized controls: logging, firewall inspection at the hub.
    Scalable: TGW handles 50 Gbps per attachment, thousands of attachments.

  DISADVANTAGES:
    Extra hop: traffic VPC-A → TGW → VPC-B (vs direct peering).
    Latency: ~1ms extra hop (usually negligible).
    Cost: TGW attachment hourly charge + per-GB data processing.

FULL-MESH (VPC Peering):
  Every VPC connects directly to every other VPC.

  WHEN TO USE:
    Small number of VPCs (≤5) where direct connectivity is worth the complexity.
    When you need the LOWEST possible latency (no intermediate hop).
    When you don't want a dependency on a shared service (TGW failure).
    Regulated environments requiring no intermediate routing infrastructure.

  DISADVANTAGES:
    N² connections. Unmanageable at scale.
    Harder to audit: 190 connections means 190 sets of route entries to review.
    Adding a VPC means creating N new connections (N-1 existing VPCs).

HYBRID APPROACH (common in large enterprises):
  Use Transit Gateway as the backbone.
  Within a single VPC, use VPC Peering between subnets for lowest latency.
  Between VPCs: always go through Transit Gateway.
  For critical paths (trading systems, real-time gaming): use dedicated peering.
```

## Real Example: 3 VPCs Connected via Transit Gateway

```
ARCHITECTURE:

  ┌─────────────────────────────────────────────────────────────┐
  │                    TRANSIT GATEWAY                          │
  │             (shared via RAM to all accounts)                │
  └────────────┬────────────────────────────┬───────────────────┘
               │                            │
     ┌─────────┴──────────┐      ┌─────────┴──────────┐
     │ VPC: Shared-Services│      │ VPC: Production    │
     │ CIDR: 10.1.0.0/16  │      │ CIDR: 10.2.0.0/16  │
     │                    │      │                    │
     │ Subnets:           │      │ Subnets:           │
     │  10.1.1.0/24 (AZ1) │      │  10.2.1.0/24 (AZ1) │
     │  10.1.2.0/24 (AZ2) │      │  10.2.2.0/24 (AZ2) │
     │                    │      │                    │
     │ Hosts:             │      │ Hosts:             │
     │  - DNS (Route 53)  │      │  - Web Servers     │
     │  - Active Directory│      │  - App Servers     │
     │  - Monitoring      │      │  - RDS Databases   │
     │  - Artifact Repo   │      │                    │
     └────────────────────┘      └────────────────────┘
               │
     ┌─────────┴──────────┐
     │ VPC: Staging       │
     │ CIDR: 10.3.0.0/16  │
     │                    │
     │ Hosts:             │
     │  - Staging web     │
     │  - Test databases  │
     └────────────────────┘

TRANSIT GATEWAY ROUTE TABLE (Default):
  Destination       → Target (Attachment)
  10.1.0.0/16       → Shared-Services VPC
  10.2.0.0/16       → Production VPC
  10.3.0.0/16       → Staging VPC
  0.0.0.0/0         → NATGW in Shared-Services (centralized internet egress)

RULES:
  - Production CAN reach Shared-Services (for DNS, monitoring).
  - Production CANNOT reach Staging directly.
  - Staging CAN reach Shared-Services.
  - ALL internet traffic → Shared-Services NATGW → Internet.
    (Single point for egress filtering, cost tracking, and logging)

WHY centralized egress matters:
  - One firewall rule set for all outbound traffic.
  - One place to block exfiltration.
  - Cost tracking: all egress logs in one place.
  - Compliance: audit all outbound connections from one location.
```

---

# PART 5: AWS Transit Gateway — The Hub That Replaces Spoke Chaos

---

## Why Transit Gateway Exists — Deriving the N² Problem

```
THE PROBLEM:
  You have 10 VPCs. All need to communicate.
  With VPC Peering: 10 × 9 / 2 = 45 peering connections.

  Each peering connection requires:
    1. Create peering request (requester VPC)
    2. Accept peering request (accepter VPC)
    3. Update requester route table: add accepter CIDR → peering
    4. Update accepter route table: add requester CIDR → peering
    5. Update security groups: allow traffic FROM accepter/requester CIDR
    6. If cross-account: IAM permissions to accept peering
    7. Enable DNS resolution between VPCs (optional but common)

  45 connections × 7 steps = 315 manual configuration items.
  Add one new VPC: 7 more items.
  Remove one VPC: update 9 existing VPCs' route tables and SGs.

  THIS DOESN'T SCALE. Humans make mistakes at this complexity.

TRANSIT GATEWAY SOLUTION:
  Transit Gateway = ONE network object that all VPCs connect to.

  Instead of VPC-A knowing about VPC-B, C, D...
  VPC-A just needs: "0.0.0.0/0 → Transit Gateway"
  The TGW knows the rest via its routing tables.

  10 VPCs = 10 TGW attachments (one per VPC).
  Add one new VPC: create 1 TGW attachment.
  Remove one VPC: delete 1 TGW attachment.
  ZERO changes to existing VPCs.
```

## Transit Gateway Core Concepts

```
ATTACHMENTS — What Can Connect to TGW:
  VPC Attachment:    Connect a VPC (one attachment per VPC).
  VPN Attachment:    Connect an on-premises network via IPsec VPN.
  Direct Connect:    Connect on-premises via AWS Direct Connect.
  Transit Gateway    Connect two Transit Gateways (cross-region peering).
  Peering Attachment:

  WHY attachments matter:
    Each attachment is a separate connection. You can route between them.
    VPC → TGW → VPN: VPC instances can reach on-premises.
    VPC → TGW → DX: VPC instances can reach on-premises via dedicated link.
    VPC → TGW → TGW (other region): Cross-region VPC communication.

SINGLE ROUTING DOMAIN:
  All attachments share one routing domain.
  Traffic from any attachment can reach any other attachment (based on route tables).
  No need for complex cross-account IAM for routing — just route table entries.

RAM-SHARED TRANSIT GATEWAYS (Resource Access Manager):
  One team owns the TGW (e.g., Network Team account).
  Share the TGW with other accounts via AWS RAM.
  Member accounts can create their own VPC attachments to the shared TGW.

  Without RAM: TGW must be in every account that needs it.
  With RAM: One TGW, shared with 100 accounts.
  Security: Sharing is opt-in. Accounts must ACCEPT the RAM invitation.
```

## Transit Gateway Route Tables — Segmentation Without Separate VPCs

```
DEFAULT ROUTE TABLE:
  New TGW has ONE default route table. All attachments use it.
  All VPCs can reach each other by default.

CUSTOM ROUTE TABLES (for segmentation):
  Create multiple route tables. Associate each attachment with one table.

  Route Table: "Production"
    Associate: Production-VPC-attachment
    Routes:
      10.2.0.0/16      → Production-VPC      (local)
      10.1.0.0/16      → SharedServices-VPC  (explicit)
      0.0.0.0/0        → NATGW-attachment    (egress)

  Route Table: "Staging"
    Associate: Staging-VPC-attachment
    Routes:
      10.3.0.0/16      → Staging-VPC         (local)
      10.1.0.0/16      → SharedServices-VPC  (explicit)
      0.0.0.0/0        → NATGW-attachment    (egress)

  Route Table: "Isolated"
    Associate: Audit-VPC-attachment
    Routes:
      10.4.0.0/16      → Audit-VPC           (local)
      # NO routes to prod/staging — fully isolated!

PROPAGATION:
  Instead of manually adding routes, attachments can PROPAGATE routes.
  When a VPC attachment propagates → its CIDR is automatically added to the route table.

  Example: Production VPC has CIDR 10.2.0.0/16.
  When you enable propagation on the "Production" route table:
    Route table automatically gets: 10.2.0.0/16 → Production-VPC-attachment.

  BLACKHOLE ROUTES:
    10.5.0.0/16 → blackhole → drops all traffic to that CIDR.
    Use when a CIDR range is under attack: traffic goes to /dev/null.
```

## Transit Gateway Limits and Performance

```
DEFAULT LIMITS:
  50 Gbps per attachment (VPC, VPN, DX).
  5,000 attachments per Transit Gateway.
  10,000 routes per Transit Gateway route table.
  50 Transit Gateways per region.

WHY THE 50 GBPS LIMIT MATTERS:
  Each attachment has a 50 Gbps ceiling.

  Scenario: You have a Transit Gateway connecting 20 VPCs.
  One VPC is a data-processing VPC running ML workloads.
  It needs to send 80 Gbps to S3 (via another VPC with S3 gateway).

  80 Gbps > 50 Gbps limit → TRAFFIC WILL DROP.

  Solutions:
    1. Split the workload across 2 VPCs (each sending 40 Gbps).
    2. Use S3 Gateway Endpoint directly in the processing VPC (avoids TGW).
    3. Use VPC Traffic Mirroring + dedicated processing (offload to separate path).
    4. Request limit increase from AWS support.

COST CONSIDERATIONS:
  TGW attachment: $0.02/hour ($14.40/month per attachment).
  Data processing: $0.02/GB through the TGW.

  Example: 10 VPCs connected to TGW, 10 TB/month total traffic.
    Attachments: 10 × $14.40 = $144/month
    Data: 10 TB × $0.02 = $200/month
    Total: $344/month.

  Compare to VPC Peering: Free for data (same region).
    But at 10+ VPCs, the operational cost of managing peering outpaces the TGW cost.
```

```hcl
# ── TERRAFORM: Transit Gateway with Route Tables ──

resource "aws_ec2_transit_gateway" "main" {
  description = "Main Transit Gateway"
  amazon_side_asn = 64512  # Autonomous System Number for BGP
  auto_accept_shared_attachments = true
  default_route_table_association = "disable"
  default_route_table_propagation  = "disable"

  tags = {
    Name = "main-tgw"
    Environment = "production"
  }
}

# Route Table: Production
resource "aws_ec2_transit_gateway_route_table" "production" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = { Name = "tgw-rt-production" }
}

# Route Table: Staging (no prod access)
resource "aws_ec2_transit_gateway_route_table" "staging" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = { Name = "tgw-rt-staging" }
}

# Attach Production VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "production" {
  transit_gateway_id       = aws_ec2_transit_gateway.main.id
  vpc_id                   = aws_vpc.production.id
  subnet_ids               = aws_subnet.production_private[*].id
  dns_support              = "enable"
  ipv6_support             = "disable"
}

# Attach Staging VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "staging" {
  transit_gateway_id       = aws_ec2_transit_gateway.main.id
  vpc_id                   = aws_vpc.staging.id
  subnet_ids               = aws_subnet.staging_private[*].id
}

# Associate Production attachment with Production route table
resource "aws_ec2_transit_gateway_route_table_association" "production" {
  transit_gateway_attachment_id = aws_ec2_transit_gateway_vpc_attachment.production.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.production.id
}

# Route: Production → Shared Services
resource "aws_ec2_transit_gateway_route" "production_to_shared" {
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.production.id
  destination_cidr_block         = "10.1.0.0/16"  # Shared Services CIDR
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.shared.id
}

# Blackhole: Production → Staging (block prod↔staging)
resource "aws_ec2_transit_gateway_route" "production_block_staging" {
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.production.id
  destination_cidr_block         = "10.3.0.0/16"  # Staging CIDR
  blackhole                      = true
}
```

---

# PART 6: AWS PrivateLink — Private Access Without Route Table Chaos

---

## Why PrivateLink Exists — The Cross-VPC Service Exposure Problem

```
THE PROBLEM:
  SaaS Provider has a service running in VPC-A (10.0.0.0/16).
  Customer has their workload in VPC-B (172.16.0.0/16).

  Customer wants to use the SaaS service.

  OPTION A: VPC Peering.
    Pros: Direct connection.
    Cons: SaaS must create peering with EVERY customer.
          1000 customers = 1000 peering connections.
          Customer must trust the SaaS's entire VPC CIDR.
          Any future SaaS service in VPC-A gets access too (implicit).

  OPTION B: Public IP + Internet.
    Pros: No VPC changes needed.
    Cons: Traffic goes over public internet.
          Latency, security concerns, data sovereignty issues.
          SaaS must expose a public endpoint.

  OPTION C: NAT Gateway in SaaS VPC + Customer route.
    Pros: Private traffic.
    Cons: NATGW is single-threaded bottleneck.
          SaaS must manage a NATGW just for customer access.
          Customer must know SaaS's NATGW IP.

  PRIVATELINK SOLUTION (the elegant answer):
    "What if the SaaS service appeared as a local network resource in the customer's VPC?"

    PrivateLink creates an ENI (Elastic Network Interface) in the customer's VPC.
    The ENI has a private IP in the customer's subnet.
    The customer accesses the SaaS via this IP — it looks LOCAL to them.
    Under the hood: traffic goes through AWS's private backbone to the SaaS's NLB.
```

## How PrivateLink Works — The ENI Pattern

```
ARCHITECTURE (Provider side):
  SaaS Provider VPC (10.0.0.0/16)
    └── Network Load Balancer (NLB)
        └── Target Group → Actual service (EC2, ECS, Fargate)

ARCHITECTURE (Consumer side):
  Customer VPC (172.16.0.0/16)
    └── Interface VPC Endpoint (ENI)
        └── Private IP in 172.16.X.X range (e.g., 172.16.100.5)
        └── DNS name: vpce-xxxx.service-id.vpce.amazonaws.com

TRAFFIC FLOW:
  Customer app: "Send HTTP request to https://vpce-xxxx.service-id.vpce.amazonaws.com"
  DNS resolves to 172.16.100.5 (the ENI in their VPC)
  Packet: src=172.16.10.10 (customer instance) → dst=172.16.100.5 (PrivateLink ENI)

  AWS backbone intercepts this packet (it's on the VPC network).
  Forwards it to the Provider's NLB in the SaaS VPC.
  NLB forwards to the actual service.

  NO internet transit. NO NAT. NO route table changes.
  The customer just uses a different DNS name.

WHY NO ROUTE TABLE CHANGES?
  The ENI is literally IN the customer's subnet.
  Traffic to the ENI IP stays within the VPC — standard subnet routing.
  Security Group on the ENI controls who can access it.

  Compare to VPC Peering:
    VPC Peering requires route table entries in BOTH VPCs.
    Peering is bidirectional.
    Each VPC must trust the other's entire CIDR range.

  PrivateLink: Customer's VPC doesn't add any routes.
    Only the ENI Security Group needs updating.
    Direction of trust is explicit and controlled by the provider.
```

## PrivateLink for AWS Services — S3 and DynamoDB Endpoints

```
GATEWAY ENDPOINTS (S3, DynamoDB) — Free:
  Not PrivateLink (technically a different feature), but worth understanding.

  When you create an S3 Gateway Endpoint:
    AWS adds a route to your VPC route table:
      Destination: pl-61a54008 (S3 prefix list) → Endpoint ENI.

    pl-61a54008 contains all S3 IP ranges (thousands of IPs).
    Route table entry is automatic — you don't manage it.

    Traffic to S3 stays on AWS backbone.
    No NAT, no IGW, no internet.

  Cost: FREE.

  Terraform:
    resource "aws_vpc_endpoint" "s3" {
      vpc_id         = aws_vpc.main.id
      service_name   = "com.amazonaws.us-east-1.s3"
      vpc_endpoint_type = "Gateway"

      route_table_ids = [aws_route_table.private.id]

      # S3 bucket policy: only allow traffic from specific VPC endpoint
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [{
          Sid    = "RestrictToVPCEndpoint"
          Effect = "Deny"
          Principal = "*"
          Action   = "s3:*"
          Resource = "arn:aws:s3:::my-bucket"
          Condition = {
            StringNotEquals = {
              "aws:sourceVpce" = aws_vpc_endpoint.s3.id
            }
          }
        }]
      })
    }

INTERFACE ENDPOINTS (SQS, SNS, Secrets Manager, etc.) — $0.01/hr:
  Creates an ENI in your subnet.
  Used for services that don't support Gateway endpoints.
  Also supports AWS services across accounts (PrivateLink for SaaS).
```

## SaaS Use Case — Exposing a Service Without VPC Peering

```
SCENARIO: SaaS company "DataPipeline" offers an ETL service.
  Service runs in DataPipeline's AWS account.
  Customer "BigCorp" wants to use it from their VPC.

WITHOUT PRIVATE LINK:
  Option 1: BigCorp creates VPC Peering with DataPipeline.
    DataPipeline must peer with 5000 customers.
    Each peering = configuration, security review, maintenance.
    DataPipeline's VPC CIDR must be trusted by 5000 customer VPCs.

  Option 2: DataPipeline publishes a public endpoint.
    BigCorp firewall team: "We can't send data to a public IP. Policy violation."
    DataPipeline: "We can't open a public endpoint. Compliance."

WITH PRIVATE LINK:
  DataPipeline creates a VPC Endpoint Service (NLB + acceptance required).
  BigCorp creates a VPC Endpoint (Interface type) in their VPC.
  BigCorp gets a private IP: 172.31.100.50.
  BigCorp configures their ETL job to connect to that IP.

  DataPipeline: ONE service, THOUSANDS of consumers via PrivateLink.
  BigCorp: Traffic never leaves their VPC. Looks like a local service.

THE ACCEPTANCE MODEL (for sensitive services):
  DataPipeline can require acceptance for each customer connection.
  Prevents unauthorized customers from connecting.
  Customer must wait for approval — good for enterprise SaaS.
```

---

# PART 7: Network ACLs vs Security Groups — Why Both Exist

---

## Deriving Why We Need Two Layers of Firewall

```
SECURITY GROUP (SG):
  Think of it as the DOORKEEPER at each room (instance).
  "Only people with a VIP pass (security group) may enter this room."

  Instance-LEVEL: Applied to an ENI (network interface) of an EC2 instance.
  STATEFUL: Outbound response traffic is automatically allowed.
  ALLOW-ONLY: Default = deny all inbound, allow all outbound.
  You can only ADD allow rules. No explicit deny (except default deny).

NETWORK ACL (NACL):
  Think of it as the BUILDING SECURITY at each floor (subnet).
  "No one from the marketing floor may enter the server room floor."

  Subnet-LEVEL: Applied to a subnet. ALL instances in the subnet inherit it.
  STATELESS: Both inbound AND outbound rules must be set explicitly.
  ALLOW AND DENY: Can explicitly allow OR deny IP ranges and ports.
  Numbered rules evaluated in order (lowest number first). First match wins.

WHY DO WE NEED BOTH?
  Imagine a hospital. The building security (NACL) blocks all visitors from the ICU floor.
  But doctors (Security Group) need access to all patient rooms.

  SG: "You are a doctor. Here is your access card."
  NACL: "No one from the waiting room may access the ICU."

  The SG says WHO can enter (identity-based). The NACL says WHERE they can go (network-based).

  Real-world analogy: Airport security.
  NACL = TSA checkpoint at the gate. Blocks certain passengers by ID/ticket.
  SG = The flight crew badge. Gets you into the cockpit regardless of passenger rules.
```

## Deep Comparison: When to Use Each

```
SECURITY GROUP USE CASES:
  DEFAULT CHOICE for most instance-level rules.

  When to use SGs:
    - Allow specific traffic to a specific instance.
    - Instance needs to talk to another specific instance.
    - You want stateful tracking (auto-allow return traffic).
    - You want to reference another SG in the rule (e.g., "allow from web-server SG").

  Example Security Group: Web Server
    Inbound:  TCP 80  from 0.0.0.0/0     (HTTP)
    Inbound:  TCP 443 from 0.0.0.0/0     (HTTPS)
    Inbound:  TCP 22  from 10.0.0.0/8    (SSH from internal)
    Outbound: TCP all to 0.0.0.0/0       (all outbound allowed by default)

NETWORK ACL USE CASES:
  Use NACLs for:
    1. DENY specific IPs or CIDRs at the subnet level.
       Example: Block 192.168.1.0/24 from accessing the entire subnet.
    2. Broad subnet-level rules.
       Example: "Entire private subnet may NOT initiate connections to the internet."
    3. Temporary firewall rules during an incident.
       Example: Block a specific attacker IP while investigating (add DENY rule #100).
    4. Compliance requirements for stateless inspection.
       Example: Audit logs must show all denied traffic at the subnet level.

  Example NACL: Private Subnet
    Inbound: 100  TCP 443  from 10.0.0.0/8   (allow HTTPS from inside VPC)
    Inbound: 110  TCP 80   from 10.0.0.0/8   (allow HTTP from inside VPC)
    Inbound: 200  TCP all  from 0.0.0.0/0    (deny all else — last rule is implicit deny)
    Outbound: 100 TCP 443  to 10.0.0.0/8     (allow HTTPS responses)
    Outbound: 110 TCP 80   to 10.0.0.0/8     (allow HTTP responses)
    Outbound: 120 TCP 1024-65535 to 0.0.0.0/0 (ephemeral ports for outbound-initiated)
```

## The Ephemeral Port Trap — Stateless NACLs Gotcha

```
THE PROBLEM:
  Security Group: outbound rule allows ALL.
  NACL: You add an outbound rule for your app's port (e.g., TCP 5432 for PostgreSQL).
  Connection FAILS. Why?

  PostgreSQL client connects FROM ephemeral port 40000 TO server port 5432.

  With Security Groups (STATEFUL):
    Client sends SYN to port 5432. SG checks inbound: port 5432 from client IP? YES.
    Server sends SYN-ACK back on client port 40000.
    SG checks outbound: 40000 is in the "all outbound allowed" range? YES.
    Connection works.

  With NACLs (STATELESS) — Common Mistake:
    You add: Outbound ALLOW TCP 5432 to 0.0.0.0/0.
    Client sends SYN from port 40000 TO port 5432.
    NACL checks INBOUND: port 5432 from client? YES. Passes.
    Server sends SYN-ACK FROM port 5432 TO client port 40000.
    NACL checks OUTBOUND: client IP, port 40000. You only allowed 5432. FAILS!
    Connection breaks because the RETURN traffic uses ephemeral port 40000.

THE FIX:
  NACL outbound rule MUST include ephemeral port range:
    Outbound ALLOW TCP 1024-65535 to 0.0.0.0/0.

  Or use the well-known ephemeral port range:
    Port 32768-61000 for Linux (older, RFC 6056).
    Port 49152-65535 for Windows (modern, IANA recommendation).

  Rule of thumb: Always allow the full ephemeral range for outbound from NACLs.

WHY THIS DOESN'T AFFECT SECURITY GROUPS:
  Because SGs are stateful. The outbound return traffic is AUTOMATICALLY allowed.
  You don't need to explicitly allow it. AWS tracks the connection state.

  This is the #1 NACL mistake in production.
  "But I opened port 5432 in my NACL, why can't my app connect to the database?"
  Answer: Ephemeral ports.
```

```hcl
# ── TERRAFORM: Security Groups + NACLs together ──

# Security Group: Web Server
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # Inbound: allow HTTP/HTTPS from anywhere
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound: allow SSH from bastion only (via SG reference)
  ingress {
    description       = "SSH from bastion"
    from_port         = 22
    to_port           = 22
    protocol          = "tcp"
    source_security_group_id = aws_security_group.bastion.id
  }

  # Outbound: allow all (default, but explicit is clearer)
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"  # all protocols
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Network ACL: Private Subnet (deny-by-default with explicit allows)
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Ephemeral port range for outbound (REQUIRED for stateful app communication)
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  tags = { Name = "private-subnet-nacl" }
}

# NACL Rule: Block specific malicious IP at subnet level
# (This can't be done with Security Groups — only NACLs can explicitly DENY)
resource "aws_network_acl_rule" "block_malicious_ip" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 1              # Evaluated FIRST (before all other rules)
  rule_action    = "deny"
  egress         = false
  protocol       = "tcp"
  cidr_block     = "203.0.113.0/24"  # Example: known malicious IP range
  from_port      = 0
  to_port        = 65535
}
```

---

# PART 8: Section Challenges

---

🔬 **Section Challenge — Multi-VPC Architecture**

**Scenario:** You are the network architect at a company with 10 VPCs (prod, staging, dev, and 7 team-specific VPCs). Currently, all inter-VPC communication is handled through VPC Peering. Your team spends 40% of their time managing peering connections.

**Challenge 1:** Calculate exactly how many VPC Peering connections you currently have. Show the formula.

**Challenge 2:** If you add a new team VPC (VPC 11), how many NEW peering connections must you create? What must be updated in each existing VPC?

**Challenge 3:** You migrate to AWS Transit Gateway. How many TGW attachments do you have now? How many route table entries are needed in TOTAL across all VPCs vs the TGW?

**Challenge 4:** Your CISO requires that the `dev` VPC must NEVER be able to reach the `prod` VPC, even if misconfigured. How does Transit Gateway route tables provide this guarantee that VPC Peering cannot?

<details><summary>Answer</summary>

**Challenge 1:**

Formula: n × (n-1) / 2 = 10 × 9 / 2 = **45 VPC Peering connections**.

Each connection requires: route table entry in both VPCs, SG rules referencing the peer, cross-account IAM if applicable, and DNS settings. That is 90+ configuration items just for routing.

**Challenge 2:**
At VPC 11: 11 × 10 / 2 = 55 connections. You need **10 NEW connections** (one from VPC 11 to each existing VPC). For each existing VPC: add a route table entry for 10.11.0.0/16 pointing to the peering connection, update security groups to allow traffic from 10.11.0.0/16, and potentially update DNS resolution settings. **11 VPCs × 10 updates = 110 changes**. With 100% confidence that one misconfiguration will cause an incident.

**Challenge 3:**
With Transit Gateway: **11 attachments** (one per VPC). Total route table entries: 11 (one per VPC route table pointing to TGW), plus TGW route table entries. With VPC Peering: each of 11 VPCs needs route table entries for 10 peerings = 110 route table entries. The TGW consolidates this into 11 route tables + 1 central TGW route table. **Reduction: ~90% fewer route table entries to manage.**

**Challenge 4:**
With VPC Peering: you rely on each VPC's route table to NOT have a route to prod. If a developer misconfigures the dev VPC route table and adds a peering route to prod, traffic WILL flow. There is no central enforcement.

With Transit Gateway: the `dev` VPC attachment is associated with a route table that **does not have a route to the prod CIDR**. There is no blackhole route needed — simply the absence of a route. The TGW does not forward traffic to destinations it has no route for. This is a **centralized, declarative policy** enforced at the hub, not a distributed, error-prone per-VPC configuration.

</details>

---

🔬 **Section Challenge — Stateful vs Stateless Firewall Behavior**

**Scenario A (Security Groups — Stateful):**
An EC2 instance with a Security Group that allows inbound TCP 443 from 0.0.0.0/0. The instance is running a web server on port 443. A client sends a TCP SYN to the instance on port 443. The instance receives the SYN and sends a SYN-ACK back.

**Question 1:** Does the Security Group need an explicit OUTBOUND rule for this SYN-ACK response? Why or why not?

**Question 2:** Now consider a NEW client in the same Security Group that tries to make an outbound connection to an external HTTPS server. Does the Security Group need an explicit OUTBOUND rule? Why or why not?

**Scenario B (Network ACLs — Stateless):**
The same instance is in a subnet protected by a Network ACL. The NACL has:
- Inbound Rule 100: Allow TCP 443 from 0.0.0.0/0
- Outbound Rule 100: **Only allow TCP 443 to 0.0.0.0/0**

**Question 3:** The external HTTPS server sends a SYN-ACK back to the client. Does this response traffic pass the NACL's outbound check? The response goes FROM port 443 TO the client's ephemeral port (say, 50000). Analyze carefully.

**Question 4:** What is the MINIMUM correct NACL outbound rule for HTTPS traffic initiated from instances in this subnet? Explain your answer using the ephemeral port concept.

<details><summary>Answer</summary>

**Question 1:**
No, the Security Group does NOT need an explicit outbound rule for the SYN-ACK. Security Groups are **stateful**: AWS tracks the connection state internally. When the inbound SYN is allowed, AWS records "this is an established connection attempt to port 443." The SYN-ACK response is automatically allowed because the SG knows it is a response to an established inbound connection. You only need inbound rules for established responses.

**Question 2:**
No, the default Security Group **already allows all outbound traffic**. By default: outbound rules permit all protocols to all destinations. You only need to add an outbound rule if you have **restricted** the default outbound (e.g., changed it to deny). Most SGs in practice rely on the default-allow outbound.

**Question 3:**
The SYN-ACK response FAILS the NACL outbound check. Here is why:
- The SYN-ACK packet: source port = 443, destination port = 50000 (ephemeral).
- The NACL checks: outbound rule 100 allows TCP **443** to **0.0.0.0/0**.
- The destination port is 50000, not 443. **No rule matches.**
- NACLs have an implicit deny as the last rule (rule number 999).
- Result: **Deny**. The SYN-ACK is dropped. The three-way handshake never completes.

The common mistake is thinking "I opened port 443" means "443 in both directions." In NACLs, both directions must be explicitly handled, and the ephemeral port range must be accounted for.

**Question 4:**
The minimum correct NACL outbound rule for HTTPS-initiated connections:

`Outbound: ALLOW TCP 443-65535 to 0.0.0.0/0`

OR more precisely, respecting the ephemeral port range:

`Outbound: ALLOW TCP 1024-65535 to 0.0.0.0/0`

Why 1024-65535? Because the client uses an **ephemeral port** (typically 49152-65535 on modern systems per IANA, or 32768-61000 on older Linux). When the client initiates a connection, the source port is the ephemeral port and the destination port is 443. When the server responds, those are reversed: source = 443, destination = ephemeral port. The outbound rule must accommodate the destination ephemeral port, so it must allow the entire ephemeral range (or at minimum 1024-65535).

This is why NACLs are more complex than Security Groups for outgoing connections: you must think in both directions for every protocol, including ephemeral ports.

</details>

---

## 🔗 Cross-References

| Topic                       | Related Content                                                     |
| --------------------------- | ------------------------------------------------------------------- |
| **IP subnetting/CIDR**      | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — binary math   |
| **Terraform IaC**           | [DevOps Advanced](01_DevOps_Advanced.md) — Terraform basics         |
| **Firewalls (SG vs NACL)**  | [Ch 10: Firewalls](10_Firewalls_Access_Control.md)                  |
| **NAT mechanics**           | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — NAT deep dive |
| **Load balancers**          | [Ch 11: Load Balancing](11_Load_Balancing_Proxies.md) — ALB vs NLB  |
| **K8s in VPC**              | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — EKS networking   |
| **Serverless (Lambda VPC)** | [Cloud Native](03_ServiceMesh_CloudNative.md)                       |


---

## Reality Check

**"A VPC is your private section of the cloud"** — A VPC is a SOFTWARE-DEFINED network you architect, and the architecture decisions are consequential and hard to change later: the CIDR range chosen at creation (too small caps growth, and overlapping ranges block future peering and on-prem connection — [subnets]' collision planning, the mistake you cannot easily undo), subnet layout across availability zones (the single-AZ deployment that a zone outage kills — multi-AZ is a VPC design choice, not automatic), and public-versus-private subnet separation (what is reachable from the internet versus internal-only). "Your private section" undersells that it is a network you DESIGN, with early decisions that constrain everything after.

**"Public and private subnets differ by a setting"** — The distinction is entirely about ROUTING and it is where reachability bugs live: a public subnet has a route to an internet gateway (its instances can be reached from and reach the internet directly), a private subnet routes outbound through a NAT gateway (instances reach out for updates but cannot be reached inbound — the correct place for databases and app servers), and getting the route tables wrong is the classic failure (the "private" database with a public route — exposed; the private instance with no NAT — cannot reach the package repo, the deploy that hangs on dependency download). Public/private is a routing architecture, and the route table is the actual control — a subnet is only as private as its routes make it.

**"Security groups and NACLs are redundant"** — They operate at different levels with different semantics, and using both correctly is defense in depth: security groups are STATEFUL and instance-level (return traffic auto-allowed, attached to instances, allow-rules only — the primary control most teams use), while NACLs are STATELESS and subnet-level (must explicitly allow both directions, support deny rules, a coarse subnet-wide backstop). The stateful/stateless difference bites (the NACL that allowed inbound but not the ephemeral-port outbound return traffic — the connection that establishes and hangs, [servers/ports]). They are complementary layers, not redundant — security groups for the fine-grained instance policy, NACLs for the broad subnet guardrail.

**"VPC peering connects two VPCs like one network"** — Peering connects them with important NON-transitive limits that surprise people: peering is not transitive (A-peered-to-B and B-peered-to-C does NOT let A reach C — the hub-and-spoke that does not work, requiring a transit gateway or a mesh of peerings), overlapping CIDRs cannot peer at all ([subnets]' planning debt come due), and route tables plus security groups on BOTH sides must permit the traffic (peering establishes the possibility; the routes and rules grant the actual access). "Like one network" overstates it — peering is a point-to-point connection with routing and non-transitivity constraints, and at scale the mesh becomes unmanageable, which is why transit gateways and hub architectures exist.

**"Cloud networking is simpler than physical networking"** — Cloud networking ABSTRACTS the physical layer but adds its own complexity and cost surprises: data transfer PRICING is a real architecture constraint (cross-AZ traffic costs money — the chatty service pair spanning zones running up a bill, cross-region worse, internet egress worst — [cloud costs] as a networking decision), the abstractions leak (the connection-tracking limits, the NAT gateway throughput caps, the ENI limits per instance), and the software-defined flexibility enables complexity that physical constraints once prevented (the sprawl of VPCs, peerings, and rules nobody has a full map of). Cloud networking trades physical simplicity for configuration complexity and a bill that scales with your traffic patterns — different, not simpler, and expensive when designed naively.
