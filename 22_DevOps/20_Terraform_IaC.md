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

## 🔬 Section Challenges

---

🔬 **Section Challenge — State Management & Concurrency**

**Challenge 1 (Reasoning):** Two team members run `terraform apply` at the same time against the same state file stored in a local `terraform.tfstate`. They both modify overlapping resources. What breaks, and why is it worse than a normal merge conflict?
<details><summary>Answer</summary>

**State file corruption and silent data loss.** Unlike Git (which detects and refuses conflicting edits), Terraform's local state file has no locking mechanism. Both applies read the same state, both make a plan, and both write their changes back. The second write clobbers the first — one team's changes are silently dropped. Terraform will believe only the resources the second apply touched; everything the first apply created or updated disappears from Terraform's record.

**Why it's worse than a merge conflict:** Git surfaces conflicts so a human can resolve them. Terraform just overwrites. The infrastructure is now in an inconsistent state — Terraform thinks resource A exists but it was created by the first apply and is now orphaned, or worse, the second apply tried to create resource A again (name conflict, duplicate resource).

**The fix:** Store state in a remote backend with locking. S3 + DynamoDB (AWS) is the standard pattern: DynamoDB row with a unique lock ID is acquired before any state read or write. The second `terraform apply` blocks waiting for the lock. Once the first apply finishes, the lock is released, and the second apply reads the updated state, planning only what actually changed.

**Terraform Cloud** gives you this out of the box, plus workspace-level locking, remote execution, and audit logs. State locking is not optional — it is the mechanism that makes team-based Terraform safe.
</details>

**Challenge 2 (Reasoning):** You store state in S3 with DynamoDB locking. A `terraform apply` acquires the lock, starts making API calls, and then your laptop loses power mid-apply. What happens to the lock? What happens to the infrastructure?
<details><summary>Answer</summary>

**The lock times out (eventually), and the infrastructure may be partially applied.** Terraform uses a pessimistic lock — it holds the lock for the entire duration of the apply. If the process dies (Ctrl-C, power loss, OOM), the lock is not released by normal means. DynamoDB locks have a TTL (LockTTL in Terraform's internal metadata, defaulting to auto-release after a reasonable window). After the TTL expires, the lock disappears and the next Terraform process can proceed.

**The critical risk:** Infrastructure is only partially applied. API calls that succeeded before the crash are already live in the cloud — the VPC exists, the security group exists, but the RDS instance was never created. Terraform's state reflects only what it successfully recorded. This is a "partial drift" scenario: real infrastructure diverges from state, and the next `terraform plan` will try to create the missing RDS (likely hitting a name conflict or duplicate resource error).

**Best practice:** Use `terraform apply -auto-approve=false` and always review `terraform plan` output first. After a crashed apply, run `terraform refresh` to sync the state file with reality, then `terraform plan` to see what Terraform thinks is missing, then carefully resolve. Never manually delete cloud resources to "fix" a partial apply without understanding what Terraform will do next.
</details>

---

🔬 **Section Challenge — Plan/Apply Workflow & Partial Execution**

**Challenge 1 (Reasoning):** `terraform plan` shows "+5 to add, ~2 to change, -1 to destroy". You review it, it looks good, so you run `terraform apply`. Halfway through (after 3 creates, 1 change), you Ctrl-C to abort. What is the state of the infrastructure? What is the state of Terraform's state file? What happens on the next `terraform plan`?
<details><summary>Answer</summary>

**The state file records only what Terraform managed to apply before you hit Ctrl-C.** After 3 creates and 1 change, the state file reflects those 4 resources as already applied. The 2 remaining creates and the 1 destroy are unexecuted.

**The infrastructure itself is in a mixed state:** 3 resources are live, 1 is modified, and 2 resources that the plan said should be created do not yet exist. The resource slated for destruction still exists (Terraform hasn't gotten to it yet).

**On the next `terraform plan`:** Terraform reads the state file (which says "3 created, 1 changed") and compares it to the desired config (which still says "5 adds, 2 changes, 1 destroy"). The plan will show the remaining 2 resources as needing to be added, the remaining 1 change, and the destroy. It will NOT re-apply the first 3 creates — they are already in state. Terraform treats a partially applied plan as a valid starting point, because it trusts the state file.

**The key insight:** Terraform's plan/apply is NOT atomic (unlike database transactions). There is no rollback on Ctrl-C. This is why `terraform apply` with locking exists and why `-auto-approve` is risky — you want to see each step complete before the next begins. The state file is your source of truth about what exists; it only matches reality if apply completed fully.
</details>

**Challenge 2 (Reasoning):** You run `terraform apply` in a CI/CD pipeline with no manual approval gate. Someone pushes a commit that renames a security group (changing `aws_security_group.web` to `aws_security_group.api`) but forgets the `moved` block. What does Terraform plan, and what actually gets destroyed and recreated?
<details><summary>Answer</summary>

**Terraform sees this as destroy + create, not rename.** When a resource address changes without a `moved` block, Terraform treats it as two separate operations: the old address is marked for destruction, and the new address is marked for creation. Terraform does not know the underlying AWS resource is the same.

**What happens:**
1. `terraform apply` destroys `aws_security_group.web` (the existing security group, with all its rules).
2. `terraform apply` creates `aws_security_group.api` (a brand new security group with no rules).
3. Any resources referencing the old security group ID fail to apply (the ID no longer exists).
4. The entire security group ruleset is lost — any instance or load balancer attached to it loses connectivity.

**Why this is dangerous in CI:** In a real pipeline without human review, this destroy happens immediately and silently, taking down production traffic. The fix is the `moved` block (Terraform 1.1+): `moved { from = aws_security_group.web to = aws_security_group.api }` makes Terraform rename the resource in state with zero infrastructure change. This is why `terraform plan` output must always be reviewed by a human before apply, especially in automated pipelines.
</details>

---

🔬 **Section Challenge — Modules & Source Code Integrity**

**Challenge 1 (Reasoning):** You have a `module "vpc"` block that references a local path `source = "./modules/vpc"`. You run `terraform apply` (Terraform reads the module source code). Later, a team member edits the module's `main.tf` directly (changing instance types or CIDR blocks). They do NOT change anything in the calling config. You run `terraform plan` again. What does Terraform do — and WHY doesn't it catch the change automatically?
<details><summary>Answer</summary>

**Terraform re-reads the module source on every plan.** When you run `terraform plan`, Terraform evaluates the module block (the call site) and then re-reads `./modules/vpc/main.tf` to get the current desired state of all resources inside the module. So the plan WILL detect the change and show it as a diff.

**The actual risk is subtler:** The issue is that editing module source directly (not via the calling module's input variables) is a form of "out-of-band change." Terraform catches it because it re-reads the source. BUT:
- If the module were a remote source (Terraform Registry, Git), the local edits would be ignored — Terraform uses the locked version.
- If the module is a local path, the behavior depends on whether the `.tf` files changed (they did) — so plan WILL catch it.

**The real gotcha:** If the module source is pinned to a Git ref (`ref=v1.2.3`) and someone manually pushes a new commit to that ref, Terraform will NOT notice unless you explicitly run `terraform get -update` or change the version pin. Terraform locks module versions at init time, not plan time, unless told otherwise.

**Best practice:** Treat module source code as immutable once applied. Use version pins for remote modules, use the calling config's variables for all customizable behavior, and add `lifecycle { prevent_destroy = true }` to critical module outputs.
</details>

**Challenge 2 (Reasoning):** You define a module that creates an S3 bucket with versioning enabled. A consumer of your module accidentally passes `versioning_enabled = false`. You do NOT set `lifecycle { prevent_destroy = true }` on the bucket. The consumer applies, versioning is disabled. Later, a developer deletes an object version from the bucket — it is gone forever because versioning was off. Who is responsible — the module author or the consumer? How does Terraform's module contract model handle this?
<details><summary>Answer</summary>

**Both are responsible, and this exposes a fundamental limitation of Terraform's module model.**

**Module author's responsibility:** A module should use `validation` blocks to constrain inputs to safe values, and `lifecycle { prevent_destroy = true }` on resources where destruction is catastrophic. The module author wrote the API contract (the variable definitions); if they allowed `versioning_enabled` to be false by design, they created the hazard.

**Consumer's responsibility:** The consumer chose to pass a value that disabled data protection. In IaC, every input is a decision — passing `false` is the consumer's configuration choice, not the module's bug.

**Terraform's module contract model** is permissive by default: variables accept any value that matches the type constraint. There is no enforcement of "safe defaults" beyond what the module author explicitly encodes. The module author cannot prevent a consumer from passing dangerous values unless they add validation and lifecycle rules.

**The deeper lesson:** Module safety requires defensive coding — input validation, lifecycle locks, and documentation of dangerous parameter combinations. Terraform is infrastructure-as-code, which means your module IS the API contract, and bad inputs can cause real data loss. Always default to safe values (`versioning_enabled = true`) and require explicit override with a comment explaining the risk.
</details>

---

🔬 **Section Challenge — Drift Detection & Resource Lifecycle**

**Challenge 1 (Reasoning):** Someone manually deletes an EC2 instance via the AWS console that Terraform originally created. You run `terraform plan`. Terraform shows `"+1"` (will create). WHY does Terraform not notice the deletion? What is `terraform refresh` doing, and why is this a trap?
<details><summary>Answer</summary>

**Terraform plans against the state file, not against live infrastructure.** The state file still records `aws_instance.web` as existing (because it was created by Terraform and recorded in state). Terraform compares the **desired state** (your `.tf` files) against the **recorded state** (the `.tfstate` file). Since the instance is in the state file but not in the desired state as changed, Terraform sees no diff — and plans nothing about deletion.

**Wait — the instance is gone from the cloud but still in state. Why does plan say "will create"?**
Because the `.tf` file still has `resource "aws_instance" "web" {...}`. Terraform compares the `.tf` file (desired state) against the state file (current recorded state). The `.tf` file says "I want this instance." The state file says "I know about this instance" (even though it's actually gone). The plan should say "no changes" — but that's only because Terraform hasn't checked the cloud yet.

**The drift detection gap:** By default, `terraform plan` does NOT query the cloud. It uses the last known state. The gap between recorded state and real infrastructure is called "drift." To detect it, you need `terraform refresh` (which queries the cloud and updates the state file) or `terraform plan -refresh-only` (which plans drift corrections without applying).

**Why this is a trap:** If you `terraform apply` without running `refresh` first, Terraform will try to create a new instance (because it thinks the old one still exists but needs replacing due to config drift). You now have two instances. Or if Terraform thinks the instance is fine and you have no changes, the deleted instance stays deleted and untracked. **The real risk:** `terraform apply` with a corrupted state file can create duplicate resources, orphan resources, or cause unexpected downtime.

**The fix:** `terraform plan -refresh-only` or `terraform apply -refresh-only` compares desired config against live cloud state and plans only the corrections needed to bring cloud reality back in sync with the `.tf` files. Use this periodically to detect drift.
</details>

**Challenge 2 (Reasoning):** You run `terraform import aws_eip.one "eipalloc-abc123"` for an Elastic IP that already exists in AWS but was never managed by Terraform. The import succeeds. But when you run `terraform plan`, Terraform wants to DELETE the EIP and recreate it. Why? What did the import NOT do?
<details><summary>Answer</summary>

**`terraform import` brings the resource into state but does NOT generate the matching `.tf` configuration.** You imported the ID `eipalloc-abc123` into the address `aws_eip.one`, so Terraform now "knows about" this EIP. But your `.tf` file still has no `resource "aws_eip" "one"` block (or has one with no attributes). When Terraform compares the desired state (empty config or wrong config) against the state (the imported EIP), it sees the EIP is NOT in your `.tf` files.

**Plan output:** "-1 to destroy" (remove the EIP from state) and "+1 to create" (because the `.tf` block might not match). Or more precisely, because the `.tf` file doesn't say the EIP should exist, Terraform plans to delete it.

**What `import` did:** Only step 1 of a two-step process:
1. **State step:** Added the resource ID to state.
2. **Config step:** Still needs manual writing of `resource "aws_eip" "one" {...}` in `.tf`.

**Terraform 1.5+ `import` block** is better: `import { to = aws_eip.one id = "eipalloc-abc123" }` combined with `generate hcl` option can generate the config automatically. But the key insight: import only tells Terraform about existing resources — it does not create the configuration file. You MUST write the `.tf` resource block matching what Terraform imported, or the next plan will try to destroy what you just imported.
</details>

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


---

## Reality Check

**"IaC is infrastructure in code files"** — The model is declarative reconciliation against tracked STATE, and the plan is the product ([13_DE Terraform] covers this fully): you declare desired state, the tool diffs against recorded reality, and the plan-review is where safety lives (applying unreviewed plans is deploying unread code). The DevOps-scale addition: at team scale, the plan runs in CI as a PR check (the plan reviewed like a diff of production itself), and the apply is gated and automated — turning infrastructure change into the same reviewed, versioned, auditable flow as application code, which is the actual point of IaC beyond "config in git."

**"State is a Terraform detail"** — State is the SYSTEM OF RECORD whose corruption modes are the real operational risks ([13_DE Terraform]): it maps declarations to real resource IDs (lose it and Terraform plans to recreate everything it already owns), must be locked against concurrent applies (the two-pipeline race), contains SECRETS in plaintext (state storage is a security boundary — encrypted, access-controlled, never in git), and drifts when humans change things in the console behind its back (every subsequent plan a minefield of surprise reverts). Remote state with locking and encryption is the entry fee for a second engineer, and the state file is the most important, least appreciated artifact in the whole IaC setup.

**"terraform apply does what the code says"** — apply executes what the PLAN computed, and the plan's sharp edges are the incident catalog ([13_DE Terraform]): attribute changes that force REPLACEMENT rather than update (the innocuous rename that plans destroy-and-recreate on a production database — prevent_destroy and create_before_destroy the guardrails), destroy-ordering on dependencies, values unknown-until-apply, and provider-version drift changing semantics under pinned config. The professional reflex is reading every plan for "destroy" and "replace" before anything else — the DevOps-scale version adds automated policy checks (the plan that FAILS CI if it would destroy a protected resource — policy-as-code catching the dangerous plan before a human rubber-stamps it).

**"IaC eliminates configuration drift"** — It eliminates drift only where reconciliation RUNS and COVERS ([13_DE Terraform]): unmanaged resources sit outside the map (the manually-created resource no plan mentions — import discipline and drift-detection runs the audit), out-of-band console changes persist until the next apply surfaces them as surprises, and coverage creep is the real gap (the networking that is coded but the IAM that grew by console — the security-relevant half uncoded). The end-state is console access read-only for humans, every change through the pipeline — drift eliminated by closing the side doors ([networking-security]'s zero-trust applied to infra changes), not by the tool's mere existence. Scheduled plan-in-CI as a drift alarm ([monitoring] applied to infrastructure truth) is the operational practice that keeps it honest.

**"Modules make Terraform reusable and clean"** — Modules are API design with code-abstraction's failure modes ([13_DE Terraform, clean-code]'s wrong-abstraction economics): the god-module with forty variables every consumer configures differently (a framework nobody can upgrade), premature parameterization of coincidental similarity, and version-unpinned module sources (the shared module whose main-branch edit deploys surprise changes to every consumer — pin module versions like any dependency [security's supply chain]). The healthy pattern is small modules with opinionated defaults around genuine reuse, semantic-versioned and consumed by released version, composed in thin environment roots — and the DevOps-scale trap is the internal module registry that becomes an unversioned monolith every team fears to touch, the [Ch62] platform-ownership problem in IaC form.
