> **Navigation**: [← Cloud VPC](13_Cloud_Networking_VPC.md) | [Index](00_INDEX.md) | [Next → Debugging](15_Network_Debugging.md)

# 🔑 Chapter 14: SSH & Remote Access — Connecting to Machines Securely

> _"SSH replaced Telnet (which sent passwords in plaintext!) and became the universal standard for secure remote access. Every server you'll ever manage — cloud, on-prem, container — you'll access via SSH."_

---

# PART 1: SSH Architecture

---

```
SSH (Secure Shell) — RFC 4251-4254 (2006), originated 1995 (Tatu Ylönen).

WHAT SSH PROVIDES:
  1. Encrypted remote shell (command line access)
  2. Encrypted file transfer (SCP, SFTP)
  3. Port forwarding / tunneling (access internal services securely)
  4. Authentication (password or key-based)

SSH USES TCP PORT 22 (by default).

AUTHENTICATION METHODS (in order of preference):

1. PUBLIC KEY (best — passwordless, most secure):
   Your machine has private key (~/.ssh/id_ed25519).
   Server has your public key (~/.ssh/authorized_keys).

   Handshake: server sends challenge → your SSH client signs with private key →
   server verifies with public key → authenticated!

   NO PASSWORD crosses the network. Private key NEVER leaves your machine.

2. PASSWORD:
   Encrypted by SSH tunnel. But: vulnerable to brute force.
   DISABLE password auth on production servers!

3. CERTIFICATE-BASED (enterprise):
   SSH CA signs your public key → certificate has expiry and permissions.
   Server trusts the CA → automatically trusts any cert signed by it.
   Used by: large organizations, HashiCorp Vault SSH.

KEY TYPES:
  RSA (ssh-rsa):      Most compatible. 4096-bit recommended. Legacy.
  ECDSA (ecdsa):      Elliptic curve. 256-bit = RSA 3072-bit security. Faster.
  Ed25519 (ed25519):  Daniel Bernstein's curve. 256-bit. FASTEST. RECOMMENDED.
                      Small keys, fast verification, high security.

  ALWAYS USE ed25519 for new keys.
```

```bash
# ── SSH KEY MANAGEMENT ──

# Generate an Ed25519 key pair (recommended)
ssh-keygen -t ed25519 -C "your_email@example.com"
# Prompts: file location (~/.ssh/id_ed25519) + passphrase (PROTECT YOUR KEY!)
# Creates: id_ed25519 (PRIVATE — NEVER share!) + id_ed25519.pub (public — copy to servers)

# Generate RSA key (for compatibility with old systems)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to a remote server (easiest method)
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.50
# This adds your public key to the server's ~/.ssh/authorized_keys

# SSH to a server
ssh user@192.168.1.50                       # uses default key
ssh -i ~/.ssh/prod-key.pem ec2-user@54.123.45.67  # specify key (AWS EC2)
ssh -p 2222 user@server.example.com          # non-standard port

# SSH Agent (avoid typing passphrase every time)
eval "$(ssh-agent -s)"                       # start agent
ssh-add ~/.ssh/id_ed25519                    # add key to agent
ssh-add -l                                    # list loaded keys
# Agent keeps decrypted key in memory → SSH uses it automatically.

# SSH Agent Forwarding (use YOUR key on the remote server)
ssh -A user@bastion.myapp.com
# Now on bastion: ssh user@internal-server → uses YOUR local key!
# CAUTION: anyone with root on the bastion can hijack your forwarded agent!
# Only forward to TRUSTED machines.
```

---

# PART 2: SSH Config — Never Type Long Commands Again

---

```bash
# ── ~/.ssh/config — the power-user's best friend ──

# Simple server
Host prod-web
    HostName 54.123.45.67
    User ubuntu
    IdentityFile ~/.ssh/prod-key.pem
    Port 22

# Now just: ssh prod-web   (that's it!)

# Server behind a bastion (jump host)
Host prod-db
    HostName 10.0.2.50           # private IP (not directly reachable)
    User admin
    IdentityFile ~/.ssh/prod-key.pem
    ProxyJump bastion             # jump through bastion first!

Host bastion
    HostName bastion.myapp.com
    User ubuntu
    IdentityFile ~/.ssh/bastion-key.pem
    ForwardAgent yes              # forward SSH agent to bastion

# Wildcard: apply settings to ALL hosts
Host *
    ServerAliveInterval 60        # send keepalive every 60s (prevent timeout)
    ServerAliveCountMax 3         # disconnect after 3 missed keepalives
    AddKeysToAgent yes            # auto-add keys to agent
    Compression yes               # compress SSH data (helps on slow links)

# Multiple bastion hops (hop through 2 servers!)
Host deep-internal
    HostName 10.10.5.100
    User admin
    ProxyJump bastion,internal-gateway

# Pattern matching
Host staging-*
    User deploy
    IdentityFile ~/.ssh/staging-key.pem

# Usage: ssh staging-web1, ssh staging-api2 → all use deploy@staging-key
```

---

# PART 3: SSH Tunneling — The Swiss Army Knife

---

```
SSH TUNNELING = creating an encrypted connection that allows access
to services that are otherwise unreachable (behind firewalls, in private subnets).

THREE TYPES:

1. LOCAL PORT FORWARDING (-L):
   "Make a remote service available on MY machine."

   Use case: Access a production database that's in a private subnet.
   The database only allows connections from the bastion host.

   ssh -L 5432:db-internal:5432 user@bastion.myapp.com

   Translation:
   "Listen on MY localhost:5432. Send traffic through SSH to bastion.
    Bastion connects to db-internal:5432 and relays data back."

   Now: psql -h localhost -p 5432 → connects to the PRODUCTION DATABASE!

   Traffic flow:
   Your laptop:5432 → [SSH encrypted tunnel] → bastion → db-internal:5432

2. REMOTE PORT FORWARDING (-R):
   "Make a service on MY machine available to the REMOTE server."

   Use case: Show your local dev server to a colleague on the remote network.

   ssh -R 8080:localhost:3000 user@remote-server.com

   Translation:
   "On remote-server, listen on port 8080. Forward to MY localhost:3000."

   Now: curl http://remote-server:8080 → reaches YOUR local dev server!

   Like a reverse ngrok.

3. DYNAMIC PORT FORWARDING (-D / SOCKS proxy):
   "Route ALL my traffic through the SSH server."

   ssh -D 1080 user@remote-server.com

   Creates a SOCKS5 proxy on localhost:1080.
   Configure browser to use SOCKS5 proxy localhost:1080.
   → ALL browser traffic routes through the SSH tunnel → exits at remote-server.

   Use case: Browse internal websites, bypass geographic restrictions.
```

```bash
# ── FILE TRANSFER OVER SSH ──

# SCP (Secure Copy — simple but limited)
scp file.tar.gz user@server:/opt/deploy/       # upload
scp user@server:/var/log/app.log ./            # download
scp -r ./my-project user@server:/home/user/    # recursive directory upload

# RSYNC (better — incremental, resume, compression)
rsync -avz --progress ./build/ user@server:/var/www/html/
# -a: archive mode (preserves permissions, timestamps)
# -v: verbose
# -z: compress during transfer
# --progress: show progress bar
# ONLY transfers files that CHANGED (much faster than scp for updates!)

# SFTP (interactive file transfer)
sftp user@server
sftp> ls                    # list remote files
sftp> get /var/log/app.log  # download
sftp> put ./deploy.tar.gz   # upload
sftp> bye
```

---

# PART 4: VPN — Virtual Private Networks

---

```
VPN = encrypted tunnel between your device and a network.
All your traffic routes through the VPN server.

TYPES:

SITE-TO-SITE VPN:
  Connects two ENTIRE networks through an encrypted tunnel.
  Office A ←→ VPN tunnel ←→ Office B. All devices on both sides can communicate.
  Used by: enterprises connecting offices, AWS VPC to on-premises.
  Protocols: IPsec, AWS Site-to-Site VPN.

REMOTE ACCESS VPN:
  Individual users connect to corporate network from anywhere.
  Laptop → VPN tunnel → corporate network → access internal resources.
  Used by: remote workers, accessing production infrastructure.
  Protocols: OpenVPN, WireGuard, IPsec IKEv2.

WIREGUARD (modern, fast, simple):
  Only ~4,000 lines of code (OpenVPN is 100,000+).
  Uses modern cryptography: Curve25519, ChaCha20, Poly1305, BLAKE2.
  Faster than OpenVPN and IPsec.
  Built into Linux kernel (since 5.6).

  Becoming the default for cloud VPN (Tailscale, Cloudflare WARP use WireGuard).

SPLIT TUNNELING:
  Full tunnel: ALL traffic goes through VPN (secure but slow).
  Split tunnel: only CORPORATE traffic goes through VPN, rest goes direct.

  Split is faster but: personal traffic isn't protected.
  Corporate preference: usually full tunnel for security.
```

---

# PART 5: Production SSH Hardening

---

```bash
# ── /etc/ssh/sshd_config — Production Server SSH Hardening ──

# Disable password authentication (key-only)
PasswordAuthentication no
ChallengeResponseAuthentication no

# Disable root login
PermitRootLogin no

# Only allow specific users/groups
AllowUsers deploy admin
# Or: AllowGroups ssh-users

# Change default port (security through obscurity — minor but helps)
Port 2222

# Restrict to specific network interface
ListenAddress 10.0.1.0

# Idle timeout (disconnect inactive sessions)
ClientAliveInterval 300       # check every 5 minutes
ClientAliveCountMax 2         # disconnect after 2 missed checks (10 min total)

# Disable forwarding (if not needed)
AllowTcpForwarding no
X11Forwarding no
AllowAgentForwarding no

# Log level
LogLevel VERBOSE               # log authentication details

# Limit authentication attempts
MaxAuthTries 3
MaxSessions 5

# Use only strong algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com

# Restart SSH to apply: sudo systemctl restart sshd
```

```
FAIL2BAN (brute force protection):
  Monitors SSH logs → bans IPs after N failed attempts.

  sudo apt install fail2ban
  # Config: /etc/fail2ban/jail.local
  [sshd]
  enabled = true
  port = 2222
  maxretry = 3
  bantime = 3600        # ban for 1 hour
  findtime = 600        # within 10 minutes

  # Check banned IPs
  sudo fail2ban-client status sshd
```

---

## 🔬 Section Challenges

---

🔬 **Section Challenge — SSH Key Authentication**

**Challenge 1 (Reasoning):** You generate `ssh-keygen -t ed25519`. Your private key stays on your laptop. Your public key is added to `~/.ssh/authorized_keys` on the server. When you connect, the server sends a challenge encrypted with your public key. A passive attacker captures this entire exchange (including the challenge and your signed response). Why can't they impersonate you?

<details><summary>Answer</summary>

**Because the private key never crosses the wire — only the proof (signature) crosses.**

The SSH key auth flow works like this: (1) Client announces "I want to auth with my ed25519 key for user alice." (2) Server looks up alice's `~/.ssh/authorized_keys`, finds the public key, and generates a random challenge. (3) Server encrypts the challenge with the public key and sends it to the client. (4) Client's SSH agent (which holds the decrypted private key in memory) decrypts the challenge, signs it, and returns the signature. (5) Server verifies the signature with the stored public key.

**The attacker's problem:** The captured signature is a one-time proof for that specific challenge. It cannot be replayed because the server generates a fresh random challenge every time. More critically, the attacker has no way to sign NEW challenges — that requires the private key, which they don't have. The public key encrypts; only the private key decrypts and signs. This is the fundamental asymmetry of RSA/Ed25519. The attacker captured the output of the signing algorithm but cannot reverse-engineer the private key from it.

</details>

---

🔬 **Section Challenge — SSH Port Forwarding**

**Challenge 1 (Reasoning):** You run `ssh -L 8080:internal-db:5432 bastion.example.com`. Now you connect to `localhost:8080` and transparently reach `internal-db:5432`. WHY does this work? What does `-L` actually bind, and what is the difference versus `ssh -R` (remote) and `ssh -D` (dynamic)?

<details><summary>Answer</summary>

**`-L` = Local port forwarding: bind on YOUR machine, tunnel through SSH to remote network.**

When you run `-L 8080:internal-db:5432`, SSH on your laptop opens a TCP listener on `127.0.0.1:8080`. When you connect to `localhost:8080`, your SSH client intercepts it, encrypts it, and sends it through the existing SSH connection to `bastion.example.com`. The bastion then resolves `internal-db` from its own network perspective (i.e., within the private subnet) and connects to port 5432. The response travels back through the same tunnel. From the database's perspective, the connection came from the bastion — your laptop's IP is never seen.

**`-R` = Remote port forwarding: bind on the REMOTE machine, tunnel back to your local network.**

`ssh -R 8080:localhost:3000 user@bastion.example.com` makes `bastion` listen on `0.0.0.0:8080` (or `127.0.0.1:8080` depending on `GatewayPorts`). When someone on the bastion's network hits `bastion:8080`, the traffic is tunneled back through SSH and exits on your laptop, reaching your local port 3000. This is how you expose a local dev server to a remote team — like a reverse ngrok. The asymmetry: `-L` is "I reach out and pull a remote service to me." `-R` is "I push my local service to the remote side."

**`-D` = Dynamic port forwarding: create a SOCKS proxy, no fixed destination.**

`ssh -D 1080 user@bastion.example.com` creates a SOCKS5 proxy on `localhost:1080`. Instead of hardcoding one destination, you configure your browser or app to use `localhost:1080` as a SOCKS proxy. Your app then sends requests like `CONNECT internal-app:443` through the proxy, and the SSH client on your laptop decides where to forward them based on the SOCKS protocol — effectively routing all traffic through the bastion. This is how you "browse as if you were on the bastion network."

**Key difference summary:** `-L` binds locally (you as client pull remote services to you). `-R` binds remotely (remote side pulls your local service to them). `-D` binds locally and routes arbitrary traffic dynamically.

</details>

---

🔬 **Section Challenge — SSH Agent Forwarding**

**Challenge 1 (Reasoning):** You SSH from laptop to bastion to internal-server. You want to `git pull` on `internal-server` using your laptop's SSH key. `ForwardAgent yes` is set on the bastion config. WHY does this expose your key to the bastion, and what is the actual security tradeoff?

<details><summary>Answer</summary>

**The private key NEVER leaves your machine. But the agent socket IS accessible to root on bastion.**

Agent forwarding doesn't copy your private key to the bastion. Instead, it forwards the SSH agent's Unix socket through the SSH connection. When you're logged into bastion and run `git pull`, Git invokes `ssh -T git@github.com`. SSH looks for an agent socket, finds the forwarded socket pointing to your laptop's agent, and asks your laptop's agent to sign the challenge. Your laptop's agent returns the signature; the key never moved.

**The tradeoff — and the danger:** Anyone with root access on bastion can read your agent socket (`SSH_AUTH_SOCK`). With that socket, they can request signatures for arbitrary challenges — effectively impersonating you for any SSH connection your key is authorized for (GitHub, production servers, etc.). They cannot extract the private key itself, but they can use the agent as a live oracle for as long as the socket is active. This is called agent hijacking.

**When to use it:** Only forward your agent to machines you fully trust (i.e., you control the root account, the machine is isolated, and no untrusted users have sudo). The security model assumes bastion's root is trustworthy — if that assumption is broken, your agent is compromised. For partially trusted environments, use dedicated deploy keys (scoped per repository) instead of agent forwarding.

</details>

---

🔬 **Section Challenge — SSH Jump Hosts & ProxyJump**

**Challenge 1 (Reasoning):** `ssh -J bastion internal-server` works, but requires `internal-server` to allow direct SSH from your IP address — which it doesn't (firewall blocks it). How does `ProxyCommand` with `ssh -W` solve this, and why is `ProxyJump` generally preferred over raw `ProxyCommand`?

<details><summary>Answer</summary>

**The firewall problem:** `internal-server` has a firewall rule allowing SSH only from `bastion`'s IP (same private subnet). Your laptop's public IP is blocked. So you cannot SSH directly to `internal-server` — you MUST tunnel through bastion.

**How `ProxyCommand` solves it:**
```bash
ssh -o "ProxyCommand=ssh -W %h:%p bastion" internal-server
```
Here, your SSH client first spawns a helper connection to bastion. That helper opens a stdio tunnel. Your actual SSH client then uses this tunnel as its transport — connecting to `internal-server` through bastion's stdin/stdout. The traffic flows: laptop → bastion → internal-server. The key insight: from `internal-server`'s perspective, the connection originated from bastion's IP (because bastion opened the outbound connection). The firewall sees this as an allowed connection.

**How ProxyJump (`-J`) is syntactic sugar for this:**
```bash
ssh -J bastion internal-server
```
OpenSSH translates this internally into the equivalent `ProxyCommand` setup. It handles the tunnel lifecycle automatically (starting the helper, keeping it alive, cleaning it up).

**Why ProxyJump is preferred:** (1) Cleaner syntax — no string quoting or `%h:%p` tokens. (2) Automatically handles host key verification for intermediate hops. (3) With OpenSSH 7.3+, supports multiple jump hosts via comma: `-J bastion,jump2,internal-server`. (4) In `~/.ssh/config`, `ProxyJump bastion` is far more readable than the `ProxyCommand` equivalent. (5) Error handling is better — OpenSSH manages the intermediate connection lifecycle for you.

</details>

---

## 🔗 Cross-References

| Topic                             | Related Content                                                            |
| --------------------------------- | -------------------------------------------------------------------------- |
| **TLS (SSH uses similar crypto)** | [Ch 09: TLS](09_TLS_Encryption.md) — Diffie-Hellman, Ed25519               |
| **Public/private keys**           | [Ch 09: TLS](09_TLS_Encryption.md) — asymmetric encryption                 |
| **Bastion in VPC**                | [Ch 13: Cloud VPC](13_Cloud_Networking_VPC.md) — public subnet bastion     |
| **Firewall (port 22)**            | [Ch 10: Firewalls](10_Firewalls_Access_Control.md) — allow SSH from subnet |
| **Docker exec (alt to SSH)**      | [DevOps Fundamentals](00_DevOps_Fundamentals.md) — container debugging     |
| **Git over SSH**                  | Uses the same ~/.ssh/id_ed25519 key format                                 |


---

## Reality Check

**"SSH is secure because it's encrypted"** ? SSH's encryption is the easy part; the SECURITY depends on authentication and key management you control: password auth over SSH is brute-forceable (the internet-exposed port 22 with password login is under constant attack � key-only auth is the baseline hardening), host key verification is the defense against man-in-the-middle (the "host key changed" warning everyone reflexively bypasses � the one time it matters is exactly when you ignore it), and the private key is a credential that grants access if stolen (the unencrypted private key on a compromised laptop, the key committed to a repo � [security]'s credential hygiene). Encrypted-in-transit is a given; the real security is key-based auth, verified host keys, and protected private keys.

**"SSH keys are more convenient than passwords"** ? Keys are more SECURE (not brute-forceable, not phishable the same way), but convenience without management is a sprawl risk: keys do not expire (the years-old key still authorized on servers nobody audits � the departed contractor's key still in authorized_keys), they proliferate (the same key reused everywhere, one compromise unlocking everything � versus per-purpose keys), and the private key needs a passphrase (the passphrase-less key that is a plaintext credential the moment the file leaks � ssh-agent exists to make passphrases convenient). The mature model is short-lived certificates or centrally-managed access (SSH certificate authorities, or bastion-with-audit, or replacing SSH with session-manager tools) � long-lived static keys are convenient and quietly accumulate into an unaudited access mess.

**"I need SSH access to debug production"** ? Interactive SSH to production is increasingly an ANTI-PATTERN, not a necessity: it means mutable, un-audited, un-reproducible changes (the config someone SSH-ed in and edited that no IaC knows about � [Terraform]'s drift, the fix nobody can reproduce), a standing access path that is an attack surface, and debugging by shell rather than by observability (the [monitoring] artifacts should answer what SSH is being used to investigate). The modern posture: immutable infrastructure (you do not fix the server, you replace it), rich observability (logs/metrics/traces answer questions without a shell), and break-glass audited access for the rare genuine case (session-recorded, time-limited, alerting). "I need SSH to debug" often means "my observability is insufficient" � the SSH is treating the symptom.

**"Port forwarding is a handy trick"** ? SSH tunneling is powerful and a real SECURITY-POLICY bypass to understand from both sides: it lets you reach internal services through an SSH connection (the developer forwarding a database port to their laptop � useful, and a data-exfiltration path that bypasses network controls), reverse tunnels expose local services outbound through firewalls (the mechanism behind some C2 and also legitimate remote access), and dynamic forwarding turns SSH into a SOCKS proxy. The capability is genuinely handy AND is exactly why SSH access is sensitive (an SSH foothold is often a pivot to everything the bastion can reach � [networking-security]'s lateral movement). Knowing tunneling explains both why it is useful and why unrestricted SSH access is a broad grant.

**"Bastion hosts add security to SSH access"** ? A bastion (jump host) centralizes and audits access, which helps ONLY if the bastion itself is hardened and monitored � otherwise it is a single high-value target that, once compromised, is the pivot to the entire internal network it was meant to protect ([networking-security]): the bastion needs its own strict hardening (minimal software, key-only, MFA, logging every session), and the pattern's real value is the AUDIT and CHOKE POINT (all access through one recorded, controlled path) not encryption. The modern evolution moves past standing bastions to identity-aware, zero-standing-access tools (session manager, just-in-time access) that eliminate the always-on jump host as a target entirely � the bastion improves on direct-SSH-to-everything, but a permanently-listening jump host is itself the thing attackers aim for.
