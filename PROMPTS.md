# AI Prompt Log

The assignment allows any AI tooling and asks to share the prompts used. I built this project with
**Claude Code** as a pair programmer. These are excerpts of the prompts that shaped it, in the order the
project was built. Routine prompts ("continue", "commit this") are left out.

## How I worked with the AI

- **I set the rules, the AI paired.** Plan before code, small Conventional Commits that I review before they
  are made, Git Flow with one branch per feature. I made the design calls; the AI proposed and explained.
- **Learn, don't just generate.** Go was new to me, so every Go decision had to be explained until I could
  defend it, mapped to what I already know from Java/Spring Boot and C#/.NET.
- **Reuse what I know.** Layered architecture and ADRs from my university's reference microservice,
  RFC 7807 errors and Swagger from my Spring Boot projects, C4 models from my own projects.
- **Verify myself.** Tests, coverage, curl and the running app, not the AI's word.

> Prompts were written in Spanish; they are translated and shortened here.

---

## How it was built

### 1. Framing the work

> "Before writing code, go through every line of the assignment and give me a short plan… I'll approve it first."
>
> "Go, Sezzle's stack, even though I've never used it… Follow my professor's reference microservice."

→ A plan mapped to every requirement: a domain independent of HTTP, one endpoint per operation,
Problem Details errors, Docker Compose. Nothing was coded until I approved it.

### 2. Keeping it simple, questioning the architecture

> "The UI should be the simplest thing that clearly meets the requirements."

- **Decision:** no JWT. Without users or stored data there is nothing to protect
  ([ADR-0009](docs/adrs.md#adr-0009-no-authentication)).
- **Decision:** a reverse proxy (Vite, then nginx) instead of CORS, so the browser sees a single origin
  ([ADR-0008](docs/adrs.md#adr-0008-use-a-reverse-proxy-instead-of-cors)).

→ A plain form instead of a keypad, and a backend with no authentication or CORS code to maintain.

### 3. Learning Go while building

> "Use the documentation in the code so I learn Go. I know other languages, just not this one…
> following good practices."

→ Idiomatic doc comments in the code; the lessons in the conversation, mapped to what I knew: errors as
values instead of exceptions, `internal/` as compiler-enforced visibility, handlers that depend on a function
signature like a port in hexagonal architecture.

### 4. Controlling the history

> "Work by features: once a branch is merged into develop, delete it."
>
> "Split the commits by parts of the code… each one sustainable and explainable on its own."

→ Every feature in its own branch, and commits ordered from the inside out (domain, API client, state,
components, styles), each one checked to build and pass its own tests.

### 5. Verifying before moving on

> "Before moving on, review and verify this audit."

→ Two bugs confirmed and fixed (large integers displayed with wrong digits, `sqrt(-0)` returning `-0`), one
claim of the audit refuted, and the improvements I chose added: CI, a request timeout and clearer
validation errors.

### 6. Going beyond the assignment

> "It isn't required, but add a C4 model… based on my own projects."

- **Correction:** the Web Application delivers the SPA, as in my projects. The first version was rebuilt
  with my conventions.

→ A [C4 model](docs/c4/README.md) with landscape, context, container, component and deployment views,
tested in the Structurizr Playground.
