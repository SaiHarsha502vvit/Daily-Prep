# CSE603 — DevOps & CI/CD

**Estimated time:** ~20h  
**Prerequisite:** [Semester 4 — Systems & Networking](../S04/README.md)

## Description

End-to-end DevOps pipeline: containerization (Docker), container orchestration (Kubernetes), CI/CD (GitHub Actions / GitLab CI), Infrastructure as Code (Terraform / Pulumi), and observability (Prometheus, Grafana, distributed tracing). Covers deployment strategies, secret management, and cloud-native patterns.

## Learning Outcomes

1. Build and optimize Docker images: multi-stage builds, layer caching, distroless images
2. Orchestrate containers with Kubernetes: Pods, Deployments, Services, ConfigMaps, Ingress
3. Design CI/CD pipelines: lint → test → build → publish → deploy with rollback
4. Implement Infrastructure as Code: Terraform modules, state management, drift detection
5. Set up observability: metrics (Prometheus), logs (Loki), traces (Tempo), dashboards (Grafana)

## Syllabus Outline

| Week | Topic                                                                                    |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | Docker fundamentals: images, containers, networks, volumes, Docker Compose               |
| 2    | Docker optimization: multi-stage builds, distroless, layer caching, security scanning    |
| 3    | Kubernetes core: Pod, Deployment, ReplicaSet, Service, Ingress                           |
| 4    | Kubernetes advanced: ConfigMaps, Secrets, RBAC, NetworkPolicies, HorizontalPodAutoscaler |
| 5    | CI/CD fundamentals: pipeline anatomy, GitHub Actions syntax, matrix builds               |
| 6    | Advanced CI/CD: artifacts, cache optimization, secret management, self-hosted runners    |
| 7    | Infrastructure as Code: Terraform HCL, modules, remote state, workspaces                 |
| 8    | Deployment strategies: blue-green, canary, rolling updates, feature flags                |
| 9    | Observability: Prometheus metrics, Grafana dashboards, alerting rules                    |
| 10   | Distributed tracing: OpenTelemetry instrumentation, Tempo traces, correlation            |
| 11   | GitOps: ArgoCD, declarative deployments, drift reconciliation                            |
| 12   | Capstone: complete CI/CD pipeline with Docker, K8s, and monitoring                       |

## Linked Existing Content

- [DevOps Pipeline](../../22_DevOps/)
- [Developer Essentials (Git, Shell)](../../13_Developer_Essentials/)

## Assessment

- Dockerfile optimization challenge: reduce image size by >70%
- Kubernetes deployment: migrate a multi-container app to K8s
- CI/CD pipeline: end-to-end pipeline with test, build, and deploy stages
- Observability dashboard: Prometheus + Grafana + alerting
