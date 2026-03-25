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

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| **IP subnetting/CIDR** | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — binary math |
| **Terraform IaC** | [DevOps Advanced](01_DevOps_Advanced.md) — Terraform basics |
| **Firewalls (SG vs NACL)** | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) |
| **NAT mechanics** | [Ch 05: IP Addressing](05_IP_Addressing_Subnets.md) — NAT deep dive |
| **Load balancers** | [Ch 11: Load Balancing](11_Load_Balancing_Proxies.md) — ALB vs NLB |
| **K8s in VPC** | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — EKS networking |
| **Serverless (Lambda VPC)** | [Cloud Native](03_ServiceMesh_CloudNative.md) |

---

> **Navigation**: [← WiFi & APs](12_WiFi_AP_Enterprise.md) | [Index](00_INDEX.md) | [Next → SSH](14_SSH_Remote_Access.md)
