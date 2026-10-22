# AI Prompt Log

The assignment allows any AI tooling and asks to share the prompts used. I built this project with
**Claude Code** as a pair programmer. Below are the prompts that shaped the solution. Routine prompts
("continue", "commit this") are omitted.

## How I worked with the AI

- **I set the rules, the AI paired.** Plan before code, small Conventional Commits that I review before they
  are made, Git Flow with one branch per feature. I made the design calls; the AI proposed and explained.
- **Learn, don't just generate.** Go was new to me, so every Go decision had to be explained until I could
  defend it, mapped to what I already know from Java/Spring Boot and C#/.NET.
- **Reuse what I know.** Layered architecture and ADRs from my university's reference microservice,
  RFC 7807 errors and Swagger from my Spring Boot projects, multi-stage Docker builds.
- **Verify myself.** Tests, coverage, curl and Swagger UI, not the AI's word.

> Prompts were written in Spanish; they are translated and shortened here.

---

### 1. Setting up how we would work

Before any code, I framed the work and the constraints:

> We'll do this in Go, Sezzle's stack, even though I've never used it, and React with TypeScript. Before
> writing code, go through every line of the assignment and give me a short plan: architecture, folder
> structure, endpoints, testing strategy and work order. I'll approve it first. Keep it simple, idiomatic and
> testable: what's evaluated is correctness, clarity and maintainability. Base it on the practices from my
> course's reference microservice: layers, ADRs, changelog, Git Flow. Explain every Go decision, because I
> have to defend this code. Before each commit, tell me what it includes so I can check it. Ask me anything.

### 2. Reviewing the plan

> **Me:** The UI should be the simplest thing that clearly meets the requirements. One endpoint per
> operation, with Swagger for documentation. And JWT? I always use it in my projects; does it apply here
> without a database? It could be a fake one.
>
> **AI:** A form maps 1:1 to the API and keeps validation simple. Swagger, yes. JWT, no: there are no users
> or data to protect, and fake authentication would be an extra feature the assignment asks to avoid. If it
> were ever needed, it would fit as HTTP middleware without touching the domain.
>
> **Me:** Approved. Let's start.

### 3. Learning Go while building

> **Me:** Explain everything and use the documentation in the code so I learn Go. I know other languages,
> just not this one, so let's learn it while following good practices.
>
> **AI:** Go's convention is a doc comment on every exported identifier, starting with its name and saying
> what it does and why; `go doc` renders them. Tutorial comments stay out of the code, and the lessons go in
> the conversation, mapped to what you already know: errors are values instead of exceptions (`errors.Is`
> is like catching a specific exception type), `internal/` is package-private visibility enforced by the
> compiler, and handlers depend on a function signature, which plays the role of a port in hexagonal
> architecture.
