**Navigation**: [< Previous](15_Cloud_Services_Guide.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](17_Servers_Ports_Networking.md)

# Infrastructure as Code — Terraform & DevOps

## What is Infrastructure as Code (IaC)?


BEFORE IaC:
"Hey admin, can you create a server? 2 CPU, 8 GB RAM, Ubuntu"
→ Email/ticket → wait 3 days → manual setup → no consistency
→ "But it works on MY server!" (configuration drift)

AFTER IaC:
Write code → commit to Git → CI/CD creates infrastructure
→ reproducible, versioned, reviewable, testable
→ identical environments every time

IaC = Treat infrastructure the same way you treat application
code: version it, test it, review it, automate it.


---



🔬 **Section Challenge — What is Infrastructure as Code (IaC)?**

**Challenge 1 (Reasoning):** A company manages 40 AWS EC2 instances with Bash scripts and manual console clicks. A new engineer wants to migrate to Terraform. The manager objects: "Bash works fine." Name three concrete failure modes Terraform solves.

<details><summary>Answer</summary>

1. **Configuration drift**: Over 6 months, engineers add firewall rules via the console. Actual infra no longer matches any documented state. `terraform plan` detects drift immediately — it compares state file against real AWS and shows the diff. 2. **No disaster recovery**: If the account is compromised or deleted, recovering 40 servers requires guessing configurations. `terraform apply` rebuilds everything from code in minutes. 3. **No change review process**: Bash can be run by anyone with no review. A typo runs `aws ec2 terminate-instances --instance-ids i-ALL`. IaC in Git means every infra change is a PR, reviewed, with `terraform plan` showing exact changes before apply. `prevent_destroy = true` prevents accidental deletions.

</details>

**Challenge 2 (Trace):** A `terraform apply` fails mid-run: VPC and subnets were created, EC2 instances failed. What is the state of `terraform.tfstate` and what happens on the next `terraform apply`?

<details><summary>Answer</summary>

Terraform updates state **as resources are created** — not atomically. After the partial failure, `tfstate` contains the VPC and subnets (recorded). EC2 instances are NOT in state (they failed before recording). Second `terraform apply`: Terraform sees VPC/subnets already exist → no action. Sees EC2 missing → creates them. If the root cause is fixed, apply completes. This is **idempotency** — re-running apply is safe. No duplicate VPCs are created because state tracks what exists.

</details>

## IaC Tool Landscape


PROVISIONING (create infrastructure):
- Terraform — multi-cloud, declarative, HCL language
- Pulumi — multi-cloud, use real languages (Java/Python/TS)
- AWS CloudFormation — AWS only, JSON/YAML
- Azure ARM/Bicep — Azure only
- Google Cloud Deployment Manager — GCP only

CONFIGURATION MANAGEMENT (configure existing servers):
- Ansible — agentless, YAML playbooks, push-based
- Chef — Ruby DSL, pull-based, agent on servers
- Puppet — declarative, pull-based, agent on servers

CONTAINERS & ORCHESTRATION:
- Docker / Dockerfile — build container images
- Docker Compose — multi-container local development
- Kubernetes manifests — container orchestration
- Helm — Kubernetes package manager (templated manifests)

Most common combo: Terraform + Ansible + Docker + Kubernetes
For interviews: Know Terraform basics + Docker + K8s concepts


---

## Terraform — Core Concepts

### Declarative vs Imperative


IMPERATIVE (scripting):
"Create a VPC, then create a subnet, then create an EC2..."
→ You describe the STEPS
→ Bash scripts, AWS CLI commands

DECLARATIVE (Terraform):
"I want 3 EC2 instances, a VPC, and an RDS database"
→ You describe the DESIRED STATE
→ Terraform figures out the steps to get there

KEY BENEFIT: Terraform knows current state vs desired state.
It only changes what's DIFFERENT (idempotent).


### The Terraform Workflow



Write (.tf files)
│
▼
terraform init        ← Download providers (AWS, Azure, etc.)
│
▼
terraform plan        ← Preview changes (diff: + add, - remove)
│                    NEVER skip this step!
▼
terraform apply       ← Execute changes (creates/updates)
│
▼
terraform destroy     ← Tear down everything (cleanup)

State file (terraform.tfstate) tracks what exists.
NEVER edit this file manually. NEVER commit it to Git.
Store it remotely (S3 + DynamoDB lock, Terraform Cloud).


---

## Terraform — HCL Language Basics

### Provider Configuration

```hcl
# main.tf — Configure the AWS provider
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state storage (team collaboration)
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
```

### Resources — The Building Blocks

```hcl
# Create a VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name        = "main-vpc"
    Environment = var.environment
  }
}

# Create a subnet inside the VPC
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id    # Reference another resource
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet"
  }
}

# Create an EC2 instance
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"  # Amazon Linux 2
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-server"
  }
}
```

### Variables & Outputs

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "Instance type must be t3.micro, t3.small, or t3.medium."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  # No default — must be provided
}

# outputs.tf
output "instance_public_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}

output "vpc_id" {
  value = aws_vpc.main.id
}
```

### Data Sources — Read Existing Resources

```hcl
# Look up the latest Amazon Linux 2 AMI (don't hardcode!)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id  # Always latest
  instance_type = var.instance_type
}
```

---

## Terraform — Intermediate Patterns

### Modules — Reusable Components

```
Project Structure:

infrastructure/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ec2/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── rds/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   ├── dev/
│   │   ├── main.tf          ← uses modules
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
└── terraform.tfvars
```

🔬 **Section Challenge — Terraform — Intermediate Patterns**

**Challenge 1 (Reasoning):** A team uses `count = var.instance_count` to create 3 web servers (`web[0]`, `web[1]`, `web[2]`). They need to remove the MIDDLE server `web[1]`. What happens when they change `count` to 2 and `terraform apply`?

<details><summary>Answer</summary>

This is the **count index shift problem**. With `count = 3`: `web[0]`, `web[1]`, `web[2]` exist. Changing to `count = 2`: Terraform maps `web[0]` → keep, `web[1]` → keep (was `web[2]`), `web[2]` → **destroy**. Result: the **LAST** instance is destroyed, not the middle one. The existing `web[1]` may be **replaced** if it now maps to different config. Fix: use `for_each` with named keys (`"web-a"`, `"web-b"`, `"web-c"`). Removing `"web-b"` from the map destroys exactly that resource with no index shifting. Rule: never use `count` for resources you might need to remove individually from the middle.

</details>

**Challenge 2 (Design):** A Terraform module creates an RDS database. In prod `multi_az = true` and `deletion_protection = true` are required; in dev both are `false`. How do you implement this correctly in the module?

<details><summary>Answer</summary>

Module `variables.tf`: `variable "multi_az" { type = bool, default = false }` and `variable "deletion_protection" { type = bool, default = false }`. Resource uses `multi_az = var.multi_az`. Prod caller sets `multi_az = true, deletion_protection = true`. Dev caller uses defaults. Add a validation: `validation { condition = var.environment == "prod" ? var.deletion_protection == true : true, error_message = "Prod must have deletion_protection." }` — this enforces the safety constraint at `plan` time, before any apply touches real infrastructure.

</details>

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
  tags       = { Name = "${var.name}-vpc" }
}

resource "aws_subnet" "public" {
  count      = length(var.public_subnets)
  vpc_id     = aws_vpc.this.id
  cidr_block = var.public_subnets[count.index]
}

# modules/vpc/variables.tf
variable "cidr_block" { type = string }
variable "name"       { type = string }
variable "public_subnets" { type = list(string) }

# modules/vpc/outputs.tf
output "vpc_id"     { value = aws_vpc.this.id }
output "subnet_ids" { value = aws_subnet.public[*].id }
```

```hcl
# environments/prod/main.tf — Use the module
module "vpc" {
  source         = "../../modules/vpc"
  name           = "production"
  cidr_block     = "10.0.0.0/16"
  public_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
}

module "web_servers" {
  source        = "../../modules/ec2"
  instance_type = "t3.medium"
  subnet_ids    = module.vpc.subnet_ids    # Connect modules
  instance_count = 3
}
```

### Loops & Conditionals

```hcl
# count — create multiple identical resources
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  tags = { Name = "web-${count.index + 1}" }
}

# for_each — create named resources (better than count)
variable "instances" {
  default = {
    web   = "t3.small"
    api   = "t3.medium"
    worker = "t3.large"
  }
}

resource "aws_instance" "app" {
  for_each      = var.instances
  ami           = data.aws_ami.amazon_linux.id
  instance_type = each.value

  tags = { Name = each.key }
}
# Creates: aws_instance.app["web"], aws_instance.app["api"], aws_instance.app["worker"]

# conditional — ternary
resource "aws_instance" "bastion" {
  count         = var.environment == "prod" ? 1 : 0  # Only in prod
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
}
```

### Lifecycle Rules

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  lifecycle {
    create_before_destroy = true    # Blue-green: new first, then delete old
    prevent_destroy       = true    # Safety net: can't destroy accidentally
    ignore_changes        = [tags]  # Don't update if only tags changed
  }
}
```

---

## Terraform — Real-World Example

### 3-Tier AWS Architecture

```hcl
# Complete example: VPC + ALB + EC2 + RDS

# --- VPC ---
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"
}

# --- Security Groups ---
resource "aws_security_group" "alb" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # Only from ALB
  }
}

resource "aws_security_group" "db" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]  # Only from app servers
  }
}

# --- ALB ---
resource "aws_lb" "main" {
  name               = "app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

# --- RDS ---
resource "aws_db_instance" "main" {
  identifier        = "app-database"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.medium"
  allocated_storage = 20

  db_name  = "appdb"
  username = var.db_username
  password = var.db_password  # Use secrets manager in real life!

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  multi_az               = var.environment == "prod" ? true : false
  skip_final_snapshot    = var.environment != "prod"
}
```

---

## Terraform State Management

```
╔══════════════════════════════════════════════════════════════════════╗
║  STATE FILE — The Most Important Terraform Concept                   ║
║                                                                      ║
║  terraform.tfstate maps your .tf code to real infrastructure.        ║
║                                                                      ║
║  .tf file says: "I want an EC2 instance"                             ║
║  State file says: "That's i-0abc123 in us-east-1"                    ║
║                                                                      ║
║  RULES:                                                              ║
║  1. NEVER edit state manually                                        ║
║  2. NEVER commit state to Git (contains secrets!)                    ║
║  3. ALWAYS use remote state for teams:                               ║
║     • AWS: S3 bucket + DynamoDB table (for locking)                  ║
║     • Azure: Azure Blob Storage                                      ║
║     • Terraform Cloud: built-in                                      ║
║  4. Use terraform state commands for state operations:               ║
║     • terraform state list    — see all resources                    ║
║     • terraform state show    — inspect a resource                   ║
║     • terraform state mv      — rename/move                          ║
║     • terraform state rm      — remove from state (not destroy)      ║
║     • terraform import        — bring existing resource into state   ║
╚══════════════════════════════════════════════════════════════════════╝
```


---

## CI/CD for Infrastructure

```
GitOps Workflow for Terraform:

Developer             Git               CI/CD             Cloud
┌────────┐   push    ┌────────┐  trigger  ┌────────┐    ┌──────┐
│ Write  │──────────▶│ Branch │──────────▶│Pipeline│───▶│ AWS  │
│ .tf    │           │ + PR   │           │        │    │      │
└────────┘           └────────┘           └────────┘    └──────┘

Pipeline Steps:
1. terraform fmt -check     (formatting)
2. terraform validate       (syntax check)
3. terraform plan           (preview) → comment on PR
4. (PR approved) terraform apply -auto-approve

RULE: Only CI/CD applies. Humans don't run apply.
```


### GitHub Actions Example

🔬 **Section Challenge — CI/CD for Infrastructure**

**Challenge 1 (Reasoning):** A GitHub Actions pipeline runs `terraform apply -auto-approve` triggered on every push to `main`. A developer pushes a commit with a typo in an RDS config. What production failure scenarios does this create, and what pipeline change prevents them?

<details><summary>Answer</summary>

Failure scenarios: (1) **Automatic destructive change**: a typo in `engine_version = "16"` (was `"15"`) triggers an RDS engine upgrade or replacement. With `-auto-approve`, no human reviews the plan. The database is modified or recreated automatically. (2) **No break-glass**: if apply fails mid-way (DB update started, failed), the pipeline can't roll back automatically. Infrastructure is in a partial state. (3) **Blast radius is unbounded**: every `.tf` change, even a variable rename or comment addition, triggers a full apply across ALL resources. Fix: (A) **Require PR + `terraform plan` comment on PR**: use `terraform plan -out=tfplan` in CI, post the plan output as a PR comment using `github-script` action. Reviewers see exactly what will change before approving. (B) **Separate plan (PR) and apply (merge)**: apply runs ONLY on merge to main, after human approval. (C) **Add `lifecycle { prevent_destroy = true }` to critical resources** (RDS, ElastiCache): even if someone accidentally writes a config that would destroy the DB, Terraform refuses and exits with an error. `-auto-approve` does not override `prevent_destroy`.

</details>

**Challenge 2 (Design):** Your Terraform pipeline needs AWS credentials to apply changes. A junior engineer suggests storing `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as GitHub Actions secrets. Why is this an anti-pattern and what is the correct approach for a production pipeline?

<details><summary>Answer</summary>

Long-lived static credentials are an anti-pattern: (1) They don't expire — if leaked (via log output, compromised runner), they're valid indefinitely until manually rotated. (2) They're hard to rotate — every place using the secret must be updated. (3) They have no scope — the key holder has whatever permissions the IAM user has, often over-broad. Correct approach: **OIDC (OpenID Connect) federation** between GitHub Actions and AWS. Setup: (1) Create an IAM Identity Provider in AWS for GitHub Actions (`token.actions.githubusercontent.com`). (2) Create an IAM Role with a trust policy that allows only your specific repo/branch to assume it: `Condition: { StringLike: { "token.actions.githubusercontent.com:sub": "repo:myorg/myrepo:ref:refs/heads/main" } }`. (3) In the GitHub Actions workflow: `- uses: aws-actions/configure-aws-credentials@v4` with `role-to-assume: arn:aws:iam::123:role/terraform-role`. GitHub Actions gets a **short-lived token** (1 hour max) via OIDC. No static credentials stored anywhere. If the token is captured, it expires in <1 hour. Principle of least privilege: the role only has the permissions Terraform needs (EC2, RDS, VPC — not IAM or S3 for other buckets).

</details>

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  push:
    branches: [main]
    paths: ['infrastructure/**']
  pull_request:
    branches: [main]
    paths: ['infrastructure/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: infrastructure/

    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Format Check
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve tfplan
```

---

## Common Interview Questions

```
Q: What is Terraform and why use it?
→ Terraform is a declarative IaC tool. You define desired state,
  it figures out how to get there. Benefits: version control,
  reproducibility, multi-cloud support, collaboration, automation.

Q: Explain terraform plan vs apply.
→ Plan shows a preview (diff) without making changes.
  Apply executes the changes. Always plan before apply.

Q: What is Terraform state? How do you manage it?
→ State maps code to real resources. Store remotely (S3 + DynamoDB)
  for team collaboration with locking to prevent conflicts.

Q: How do you handle secrets in Terraform?
→ Never hardcode. Use: environment variables, AWS Secrets Manager,
  HashiCorp Vault, or CI/CD secret injection. Mark sensitive
  variables with `sensitive = true`.

Q: What's the difference between count and for_each?
→ count creates numbered resources (0, 1, 2...) — removing middle
  causes shifts. for_each creates named resources — more stable.

Q: How do you manage multiple environments (dev/staging/prod)?
→ Terraform workspaces, or separate directories per env sharing
  modules. Separate directories is more explicit and preferred.

Q: What happens if you delete a resource from .tf without destroy?
→ terraform apply will destroy it. If you want to keep it but
  stop managing it, use terraform state rm first.
```


---

## IaC Best Practices Summary

```
╔══════════════════════════════════════════════════════════════════════╗
║  1. Version control everything — all .tf files in Git                ║
║  2. Use modules for reusable components                              ║
║  3. Remote state with locking — never local for teams                ║
║  4. Separate environments — don't share state                        ║
║  5. Use variables and outputs — no hardcoded values                  ║
║  6. Pin provider versions — avoid surprise upgrades                  ║
║  7. Run plan in CI — review changes before apply                     ║
║  8. Tag all resources — cost tracking, ownership                     ║
║  9. Use data sources — don't hardcode AMI IDs or ARNs                ║
║  10. Secrets in Vault/SSM — never in .tf files or state              ║
║  11. Small, focused changes — easier to review and debug             ║
║  12. Destroy unused resources — cost awareness                       ║
╚══════════════════════════════════════════════════════════════════════╝
```


---

*Infrastructure as Code isn't optional for modern engineers — it's the standard. Learn Terraform and you can deploy to any cloud.*


---

