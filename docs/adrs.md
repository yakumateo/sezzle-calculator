# Architecture Decision Records

This document records the decisions that shape the Sezzle Calculator. Each record is short and focuses on
why the decision was made and what it costs. New decisions are appended; if a decision changes, a new
record supersedes the old one and both link to each other.

Each record includes:

- **Status**: `Accepted`, `Superseded` or `Deprecated`
- **Date**: when the decision was made
- **Context**: the problem and its constraints
- **Decision**: the chosen approach
- **Consequences**: benefits and trade-offs
- **Alternatives considered**: credible options that were not chosen

| ADR | Decision |
|---|---|
| [ADR-0001](#adr-0001-use-only-the-go-standard-library-for-http) | Use only the Go standard library for HTTP |
| [ADR-0002](#adr-0002-keep-the-calculator-domain-independent-of-http) | Keep the calculator domain independent of HTTP |
| [ADR-0003](#adr-0003-expose-one-rest-endpoint-per-operation) | Expose one REST endpoint per operation |
| [ADR-0004](#adr-0004-report-errors-as-problem-details-with-400-413-and-422) | Report errors as Problem Details with 400, 413 and 422 |
| [ADR-0005](#adr-0005-use-float64-and-reject-results-json-cannot-represent) | Use float64 and reject results JSON cannot represent |
| [ADR-0006](#adr-0006-validate-input-format-in-the-frontend-and-math-rules-in-the-backend) | Validate input format in the frontend and math rules in the backend |
| [ADR-0007](#adr-0007-hand-write-the-openapi-contract-and-serve-swagger-ui-from-the-backend) | Hand-write the OpenAPI contract and serve Swagger UI from the backend |
| [ADR-0008](#adr-0008-use-a-reverse-proxy-instead-of-cors) | Use a reverse proxy instead of CORS |
| [ADR-0009](#adr-0009-no-authentication) | No authentication |

---

## ADR-0001: Use only the Go standard library for HTTP

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

The service exposes ten routes (seven operations plus health and documentation), decodes small JSON bodies
and returns JSON. Since Go 1.22, `net/http.ServeMux` supports method-aware patterns such as
`"POST /api/v1/add"` and answers `405` on its own.

### Decision

Use `net/http`, `encoding/json` and `log/slog` only. The backend has no third-party dependencies.

### Consequences

- No dependencies to update, audit or learn; the binary is small and builds fast.
- The code is plain Go that any Go developer can read.
- Features a framework would give for free, such as JSON `404`/`405` responses, need code (see the
  assumptions in the README).

### Alternatives considered

- Gin, Echo or chi: useful for larger APIs with middleware chains, unnecessary for ten routes.

---

## ADR-0002: Keep the calculator domain independent of HTTP

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

The arithmetic rules (division by zero, square root of a negative number, overflow) are the core of the
service and must be easy to test. A layered, domain-centered structure is the convention used in my
previous projects, but a calculator has no data to persist.

### Decision

Split the backend into two layers:

- `internal/calculator` (domain): pure functions with the signature `func(...) (float64, error)` and
  sentinel errors such as `ErrDivisionByZero`. It does not import `net/http`.
- `internal/httpapi` (interface): decodes and validates requests, calls the domain and maps its errors to
  HTTP responses.

There is no persistence layer and no separate application layer, because each use case is a single
function call. `cmd/server/main.go` is the composition root.

### Consequences

- The domain is tested with plain table-driven tests, with no HTTP involved.
- The HTTP layer depends on a function signature, not on a concrete implementation, which plays the role
  of a port in hexagonal architecture.
- Fewer packages than a full layered architecture; layers can be added if the service grows.

### Alternatives considered

- Everything in one `main` package: simpler at first, but mixes HTTP concerns with math rules.
- Full domain, application, infrastructure and interface layers: structure without a purpose here.

---

## ADR-0003: Expose one REST endpoint per operation

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

The assignment asks to "expose endpoints for calculator operations". Operations take one or two operands.

### Decision

One `POST` endpoint per operation under `/api/v1/`: `add`, `subtract`, `multiply`, `divide`, `power`,
`percentage` and `sqrt`. Two-operand operations take `{"a": ..., "b": ...}`; `sqrt` takes `{"a": ...}`.
Successful responses echo the operands: `{"operation": "divide", "a": 10, "b": 4, "result": 2.5}`.

### Consequences

- Each route is documented and tested on its own, and an unknown operation is a plain `404`.
- All two-operand endpoints share one handler (`binaryHandler`), so exposing a new operation is one line in the router.
- The `/v1` prefix allows breaking changes in a future `/v2` without affecting current clients.

### Alternatives considered

- A single `POST /api/v1/calculate` with `{"operation": "...", ...}`: fewer routes, but it needs a
  `switch` on the operation name and its own validation of that name.
- `GET /api/v1/add?a=1&b=2`: cacheable, but numbers in query strings are harder to validate strictly.

---

## ADR-0004: Report errors as Problem Details with 400, 413 and 422

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

Clients must be able to tell "your request is wrong" from "your request is valid but has no result", and
show a useful message without parsing free text.

### Decision

Errors use Problem Details (RFC 9457, formerly RFC 7807) with the `application/problem+json` media type:

| Status | Meaning | Examples |
|---|---|---|
| `400 Bad Request` | The request could not be understood | Invalid JSON, missing `b`, unknown field, `"a": "2"` |
| `413 Request Entity Too Large` | The body exceeds 1 KiB | Oversized payloads |
| `422 Unprocessable Entity` | Valid request, undefined result | Division by zero, `sqrt` of a negative number, overflow |
| `500 Internal Server Error` | Unexpected error | Never exposes internal details |

### Consequences

- One error format for every endpoint; the frontend shows `detail` directly.
- Request decoding is strict: unknown fields and trailing data are rejected, and `encoding/json` messages
  are rewritten so Go type names never reach the client.

### Alternatives considered

- `400` for everything: simpler, but hides whether the client should fix the request or the numbers.
- A custom `{"error": "..."}` body: works, but is not a standard other tools understand.

---

## ADR-0005: Use float64 and reject results JSON cannot represent

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

The calculator works with decimal numbers. JSON numbers cannot be `Infinity` or `NaN`, and IEEE 754
produces values such as `-0` that look like bugs to a user.

### Decision

- Operands and results are `float64`.
- Every result passes through one function, `checked`, which turns `±Inf` into `ErrResultOutOfRange`,
  `NaN` into `ErrUndefinedResult`, and `-0` into `0`.
- `0` raised to a negative exponent is reported as division by zero, since `0^-n = 1/0^n`.
- `Percentage` multiplies before dividing (`percent * total / 100`) so that whole numbers give exact results.

### Consequences

- The API never returns a value JSON cannot encode.
- Results carry normal binary floating-point error (`0.1 + 0.2 = 0.30000000000000004`). The API returns the
  exact `float64`; the frontend rounds only for display (15 significant digits for non-integers, integers
  shown in full).

### Alternatives considered

- A decimal library such as `shopspring/decimal`: exact decimal arithmetic, which a financial ledger would
  need, but it adds a dependency and does not support square roots or fractional powers directly.

---

## ADR-0006: Validate input format in the frontend and math rules in the backend

- **Status**: Accepted
- **Date**: 2026-10-21

### Context

The assignment asks for input validation in the frontend and edge-case handling in the backend. Duplicating
math rules in both layers would let them drift apart.

### Decision

- The frontend checks the **format** of what a person types: the field is not empty, and it is a plain
  decimal number (`1e3`, `0x10` and `Infinity` are rejected even though JavaScript's `Number()` accepts them).
- The backend owns the **math rules**: division by zero, square root of a negative number and overflow.
  The frontend shows the backend's `detail` message.

### Consequences

- Each rule lives in one place. For example, dividing by zero is accepted by the form and rejected by the API.
- The backend still validates every request on its own, since clients other than this frontend can call it.

### Alternatives considered

- Duplicating the math rules in the frontend: faster feedback, but two implementations to keep in sync.

---

## ADR-0007: Hand-write the OpenAPI contract and serve Swagger UI from the backend

- **Status**: Accepted
- **Date**: 2026-10-20

### Context

The API needs documentation that can be read and tried. The first plan ran Swagger UI in its own container,
but that page would call the API from another origin and be blocked by CORS.

### Decision

- The contract is a hand-written OpenAPI 3 file, `backend/api/openapi.yaml`.
- The backend embeds it with `go:embed` and serves it at `GET /docs/openapi.yaml`, together with the
  official Swagger UI at `GET /docs`, on the same origin as the API.
- A test fails if an operation is missing from the contract.

### Consequences

- "Try it out" works with no CORS setup, and the documentation always matches the running version.
- The same pattern as springdoc in Spring Boot: the application serves its own Swagger UI.
- Swagger UI's assets load from a CDN, so `/docs` needs internet access.

### Alternatives considered

- Generating the spec from code comments with swaggo: adds a dependency and a generation step, not
  justified for seven operations.
- Swagger UI in a separate container: blocked by CORS, as described above.

---

## ADR-0008: Use a reverse proxy instead of CORS

- **Status**: Accepted
- **Date**: 2026-10-21

### Context

The browser loads the frontend from one origin and calls the API. If they are different origins, the
backend must send CORS headers and know which origins to allow.

### Decision

The browser always talks to a single origin, which forwards API calls to the backend:

- In development, the Vite dev server proxies `/api` to `http://localhost:8080`.
- In Docker, nginx serves the React build and proxies `/api` and `/docs` to `http://backend:8080`, adding
  `X-Forwarded-*` headers. The backend publishes no port, so nginx is the only entry point.

### Consequences

- The backend has no CORS code, and its port is not exposed outside the Docker network.
- nginx also handles static files, gzip and long-term caching of hashed assets, and is where TLS, rate
  limiting or an API gateway would go.
- Serving the frontend from another origin without a proxy will not work; this is documented in the README.

### Alternatives considered

- CORS headers in the backend: works, but couples the backend to the frontend's origins.

---

## ADR-0009: No authentication

- **Status**: Accepted
- **Date**: 2026-10-19

### Context

My previous projects used JWT authentication. This service has no users, no stored data and nothing to
protect, and the assignment asks to prioritize correctness and clarity over extra features.

### Decision

The API is public and stateless; there is no authentication.

### Consequences

- Less code and no fake login flow.
- If authentication were needed, it would be an HTTP middleware in `httpapi` or a check in the reverse
  proxy acting as an API gateway, with no change to the domain.

### Alternatives considered

- A fake JWT with a hard-coded user: adds code and a login screen, and gives a false sense of security.
