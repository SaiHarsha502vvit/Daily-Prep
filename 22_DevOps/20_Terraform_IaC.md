> **Navigation**: [← CI/CD](19_CICD_Pipelines.md) | [Index](00_INDEX.md) | [Next → Monitoring](21_Monitoring_Observability.md)

# 🏗️ Chapter 20: Terraform & Infrastructure as Code — Define Your Cloud in Code

> _"Without IaC, your infrastructure is a snowflake — unique, fragile, unreproducible. With Terraform, your entire cloud setup is version-controlled, peer-reviewed, and re-creatable with one command."_

---

# PART 1: Why IaC? — The Problem with Click-Ops

---

```
CLICK-OPS (manual console):
  Day 1: Admin creates VPC, subnets, security groups via AWS console. Works.
  Day 30: "What settings did I use?" → nobody remembers.
  Day 60: New team member needs similar setup → spends 3 days clicking.
  Day 90: Security audit → "show me all your firewall rules" → 6 hours of screenshots.
  Day 120: DR test → "recreate everything in another region" → impossible.

IaC:
  Day 1: Write Terraform → terraform apply → infrastructure created. Code in Git.
  Day 30: Read the code → know exactly what's deployed.
  Day 60: New setup → terraform apply → identical environment in 10 minutes.
  Day 90: Audit → read the code. Every change has a PR, review, and approval.
  Day 120: DR → terraform apply in us-west-2 → full replica.

TOOLS:
  Terraform (HashiCorp):   Multi-cloud (AWS + GCP + Azure + 3000+ providers). Most popular.
  Pulumi:                  IaC in real languages (Python, TypeScript, Go). Loops, conditionals!
  AWS CloudFormation:      AWS-only. JSON/YAML. Deep AWS integration.
  CDK (AWS):               Write CloudFormation in Python/TypeScript.
  OpenTofu:                Open-source Terraform fork (after HashiCorp license change).
```

---

# PART 2: Terraform Fundamentals

---

```hcl
# ── TERRAFORM BASICS ──

# Provider: which cloud API to talk to
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State storage (NEVER store state locally in team environments!)
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"      # state locking (prevents concurrent applies!)
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Environment = var.environment
      ManagedBy   = "terraform"
      Repository  = "github.com/myorg/infra"
    }
  }
}

# Variables (inputs)
variable "region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region for all resources"
}

variable "environment" {
  type    = string
  default = "production"
  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

# ── CREATE RESOURCES ──

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"
  subnet_id     = aws_subnet.public[0].id

  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = <<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y docker.io
    docker run -d -p 80:8000 myapp:latest
  EOF

  tags = {
    Name = "${var.environment}-web-server"
  }
}

# Outputs (show after apply)
output "web_server_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the web server"
}
```

```
TERRAFORM WORKFLOW:

  terraform init          # download providers, initialize backend
  terraform plan          # show what WILL change (preview!)
  terraform apply         # execute the changes
  terraform destroy       # remove ALL resources

  LIFECYCLE:
  1. Write .tf files (desired state)
  2. terraform plan (diff: current state vs desired)
  3. Review the plan (PR review!)
  4. terraform apply (make changes)
  5. State file updated (records what exists)

STATE FILE:
  terraform.tfstate = record of ALL resources Terraform manages.
  Maps resource IDs in your code → real resource IDs in the cloud.

  CRITICAL: If state is lost → Terraform doesn't know what it created!
  → ALWAYS store state in a remote backend (S3, GCS, Terraform Cloud).
  → ALWAYS enable state locking (DynamoDB) to prevent concurrent writes.
  → NEVER commit terraform.tfstate to Git (contains secrets!).
```

---

# PART 3: Modules — Reusable Infrastructure

---

```hcl
# ── MODULES: group resources into reusable packages ──

# Using a community module (Terraform Registry)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.environment}-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]

  enable_nat_gateway = true
}

# Using YOUR OWN module
module "api_service" {
  source = "./modules/ecs-service"    # local module

  name            = "my-api"
  image           = "ghcr.io/myorg/api:${var.image_tag}"
  cpu             = 1024
  memory          = 2048
  desired_count   = 3
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  listener_arn    = aws_lb_listener.https.arn
}

# ── YOUR MODULE (modules/ecs-service/main.tf) ──
# Encapsulates: ECS task definition, service, target group, security group.
# Teams use: module "service" { source = "./modules/ecs-service" }
# Standardized, tested, peer-reviewed infrastructure.
```

---

# PART 4: Terraform Anti-Patterns & Best Practices

---

```
ANTI-PATTERNS:

1. MONOLITH STATE:
   All resources in ONE state file. Any change → locks EVERYTHING.
   Production + staging in same state → scary!

   FIX: Separate state per environment, per component.
   production/vpc/    → state for VPC
   production/app/    → state for application (depends on VPC)
   staging/vpc/       → separate state for staging

2. HARDCODED VALUES:
   region = "us-east-1"    # hardcoded everywhere!
   FIX: Use variables + tfvars files per environment.

3. NO STATE LOCKING:
   Two people run terraform apply simultaneously → state corruption!
   FIX: DynamoDB lock table (AWS), GCS bucket locking (GCP).

4. SECRETS IN CODE:
   db_password = "supersecret"   # IN YOUR CODE!
   FIX: Use aws_secretsmanager_secret data source or environment variables.

BEST PRACTICES:

1. Use workspaces OR directory-per-environment:
   environments/
   ├── production/
   │   ├── main.tf
   │   └── terraform.tfvars
   ├── staging/
   │   ├── main.tf
   │   └── terraform.tfvars
   └── modules/           # shared modules
       ├── vpc/
       ├── ecs-service/
       └── rds/

2. Pin provider versions: aws = "~> 5.30" (not "~> 5.0" for safety).

3. Use terraform plan in CI, terraform apply only after approval.

4. Import existing infrastructure: terraform import aws_instance.web i-1234567890.

5. Use tflint and checkov for static analysis of Terraform code.
```

---

# PART 5: Advanced HCL — Loops, Conditionals, Dynamic Blocks

---

```hcl
# ── FOR_EACH: create multiple resources from a map ──
variable "services" {
  type = map(object({
    cpu    = number
    memory = number
    port   = number
  }))
  default = {
    api     = { cpu = 1024, memory = 2048, port = 8000 }
    worker  = { cpu = 512,  memory = 1024, port = 9000 }
    admin   = { cpu = 256,  memory = 512,  port = 8080 }
  }
}

resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = each.key                    # "api", "worker", "admin"
  task_definition = aws_ecs_task_definition.tasks[each.key].arn
  desired_count   = var.environment == "production" ? 3 : 1

  # Conditional: only attach LB for services with port < 9000
  dynamic "load_balancer" {
    for_each = each.value.port < 9000 ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.tg[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }
}

# ── LOCALS: computed values (avoid repetition) ──
locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Team        = "platform"
  }

  is_production = var.environment == "production"

  # Flatten nested data
  subnet_ids = flatten([
    module.vpc.public_subnets,
    module.vpc.private_subnets
  ])
}

# ── DATA SOURCES: read existing resources (not managed by Terraform) ──
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical (Ubuntu publisher)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Use: ami = data.aws_ami.ubuntu.id  → always gets latest Ubuntu 22.04 AMI!

data "aws_caller_identity" "current" {}
# Use: data.aws_caller_identity.current.account_id → "123456789012"

# ── LIFECYCLE RULES ──
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.large"

  lifecycle {
    create_before_destroy = true    # create new BEFORE destroying old (zero downtime)
    prevent_destroy       = true    # terraform destroy will ERROR (safety!)
    ignore_changes        = [ami]   # don't replace when AMI changes (manual updates)
  }
}
```

---

# PART 6: Terragrunt — DRY Multi-Environment Management

---

```
TERRAGRUNT = thin wrapper over Terraform that eliminates duplication.

  PROBLEM: with standard Terraform, each environment repeats the backend config,
  provider config, and module calls. 3 environments × 5 components = 15 copies!

  TERRAGRUNT: write the common config ONCE. Inherit everywhere.

DIRECTORY STRUCTURE:
  infrastructure/
  ├── terragrunt.hcl               # ROOT: defines backend + provider
  ├── _envcommon/                   # shared module configs
  │   ├── vpc.hcl
  │   ├── ecs.hcl
  │   └── rds.hcl
  ├── production/
  │   ├── env.hcl                   # environment-specific vars
  │   ├── vpc/
  │   │   └── terragrunt.hcl       # includes _envcommon/vpc.hcl
  │   ├── app/
  │   │   └── terragrunt.hcl
  │   └── database/
  │       └── terragrunt.hcl
  └── staging/
      ├── env.hcl
      ├── vpc/
      │   └── terragrunt.hcl
      └── app/
          └── terragrunt.hcl
```

```hcl
# ── ROOT terragrunt.hcl ──
# Auto-generates backend config for EVERY module!

generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite_terragrunt"
  contents = <<EOF
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
EOF
}

# ── production/vpc/terragrunt.hcl ──
include "root" {
  path = find_in_parent_folders()     # inherits root config
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders())}/_envcommon/vpc.hcl"
}

inputs = {
  environment = "production"
  cidr        = "10.0.0.0/16"
}

# RESULT: NO duplicate backend config. NO duplicate provider config.
# Each environment's terragrunt.hcl is just a few lines of inputs!

# COMMANDS:
# terragrunt run-all plan    → plans ALL modules in the directory tree
# terragrunt run-all apply   → applies ALL, respecting dependencies
```

---

# PART 7: State Operations & Importing Existing Resources

---

```bash
# ── TERRAFORM STATE MANAGEMENT ──

# Import existing cloud resource INTO Terraform management
terraform import aws_instance.web i-0abc123def456
# Now Terraform "knows about" this EC2 instance.
# IMPORTANT: you must write the resource block in .tf FIRST!

# Import block (Terraform 1.5+ — declarative import!)
import {
  to = aws_instance.web
  id = "i-0abc123def456"
}
# Run: terraform plan → Terraform generates the config for you!

# Move a resource (rename without destroying)
# Old: resource "aws_instance" "web" → New: resource "aws_instance" "api"
moved {
  from = aws_instance.web
  to   = aws_instance.api
}
# terraform apply → renames in state, NO infrastructure change!

# Move resource to a module
moved {
  from = aws_instance.api
  to   = module.api.aws_instance.main
}

# State commands (emergency use only!)
terraform state list                          # list all managed resources
terraform state show aws_instance.web         # show resource details
terraform state mv aws_instance.web aws_instance.api  # rename
terraform state rm aws_instance.legacy        # remove from state (doesn't destroy!)
terraform state pull                          # download state as JSON

# ── TERRAFORM IN CI/CD PIPELINE ──

# .github/workflows/terraform.yml:
# on:
#   pull_request:    → terraform plan (comment on PR with changes)
#   push (main):     → terraform apply (after approval)
#
# Key: terraform plan runs on EVERY PR → reviewer sees exact changes.
#      terraform apply only on merge to main → controlled deployment.
#
# Tools: atlantis (automated Terraform PRs), terraform cloud, spacelift.
```

---

## 🔗 Cross-References

| Topic                             | Related Content                                                            |
| --------------------------------- | -------------------------------------------------------------------------- |
| **VPC resources**                 | [Ch 13: Cloud VPC](13_Cloud_Networking_VPC.md) — what Terraform provisions |
| **CI/CD (terraform in pipeline)** | [Ch 19: CI/CD](19_CICD_Pipelines.md) — plan in PR, apply on merge          |
| **K8s cluster provisioning**      | [Ch 18: K8s](18_Kubernetes_Complete.md) — EKS/GKE via Terraform            |
| **Security groups**               | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — SG resources          |
| **DNS records**                   | [Ch 07: DNS](07_DNS_Complete.md) — Route53 records via Terraform           |
| **GitOps**                        | [Ch 23: GitOps](23_GitOps_Deployments.md) — infra changes via Git          |
| **Linux instances**               | [Ch 16: Linux](16_Linux_Administration.md) — user_data scripts             |
| **Docker (ECS tasks)**            | [Ch 17: Docker](17_Docker_Complete.md) — container definitions             |
