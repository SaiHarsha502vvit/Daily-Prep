# Folder Context: 22_DevOps

## Purpose

Teach Linux, networking, Docker, Kubernetes, CI/CD, cloud deployment, observability, SRE, and production operations.

## Writing Style

- Operational mental model first.
- Commands and configs with why they matter.
- Failure modes, debugging, rollout, rollback, monitoring.
- Production tradeoffs over tool memorization.

## Boundaries

Developer tooling basics belong in `13_Developer_Essentials`. Application framework internals belong in `07_Modern_Java` or frontend folders.

## Update Triggers

Update this file when infrastructure ownership, deployment strategy, or operations guidance changes.

## Chapter Spine (every chapter and every new chapter)

1. **Navigation line and 5W1H block** (protected, D014).
2. **The problem, derived.** Start from the pain and ask "what would you have to invent?" — reason forward to the tool before naming it. History only with dated facts you are sure of.
3. **The mechanism.** What actually happens, shown with commands you ran and their real output (state the OS/tool versions). Where it is a kernel or protocol fact, name the syscall/RFC/struct.
4. **Alternatives and when to use or avoid each**, with what each trades away. Include the cases where the alternative is better.
5. **How it fails and how to debug it** — symptom, cause, command that proves it.
6. **Lab** — numbered steps, an *expected result*, and a *check command* so the learner can tell they are right.
7. **Challenges** — `🔬 **Section Challenge — <topic>**` followed by `**Challenge N (Type):**` and a `<details><summary>Answer</summary>` worked answer. Specific to the section, never generic. Numbering restarts per section.
8. **Reality Check** — misconceptions corrected, each with the reason it is wrong.
9. **Books** — pointers from [BOOKS.md](BOOKS.md): title, which chapter or section to read, and one sentence in your own words on what it adds. Never copy passages; at most one short quotation (under 15 words) with attribution.

## Rules for writers and agents

- **Fix what is wrong first.** Run the command or say "not verified here". No invented output, versions, dates or chapter numbers.
- **Voice.** Textbook voice ("run", "you will see"), not the writer's diary ("in my sandbox", "I could not"). State what was verified and on what, in one neutral line.
- **Canonical homes.** The topic table in [00_INDEX.md](00_INDEX.md) says which file teaches what. Deeper mechanism goes in an `internals/` chapter and is linked, never repeated. Do not rename or renumber files (other folders and the registry link to them).
- **Diagrams** only where a picture teaches order or who-does-what; each followed by `**How to read this diagram.**`.
- **Lab environment.** WSL2 Ubuntu 24.04 (kernel 6.6.87). Installed in `~/.local/bin`, checksum-verified: `kubectl` v1.37.2, `kind` v0.33.0, `terraform` v1.17.2, `dig` 9.18.39 (UDP to public resolvers such as 1.1.1.1:53 times out from this WSL network; use the default resolver). Also `openssl`, `ss`, `ip`, `curl`. **Docker is not available inside WSL until Docker Desktop's WSL integration is enabled**, so container and kind labs are "not verified here" until then. Terraform labs can use the `local`/`null` providers; there is no cloud account.
- **Books.** Content from books is *referenced and explained in your own words*, with the free ones (OSTEP, Google SRE books, Pro Git, Beej's guides) linked in full.
