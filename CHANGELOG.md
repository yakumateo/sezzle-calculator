# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/). Changes are grouped by what a user or maintainer notices;
implementation-only commits are summarized instead of listed one by one.

## [Unreleased]

## [1.0.0] - 2026-10-22

### Added

- **Calculator domain (Go):** addition, subtraction, multiplication, division, power, square root and
  percentage. Results JSON cannot encode (`±Inf`, `NaN`) are reported as errors, and `-0` is normalized to `0`.
- **REST API (Go):** one `POST` endpoint per operation under `/api/v1`, plus `GET /health`. Requests are
  decoded strictly (required fields, no unknown fields, 1 KiB limit), and errors use Problem Details
  (RFC 9457) with `400`, `413` and `422`.
- **Server:** graceful shutdown on `SIGTERM` and `Ctrl+C`, HTTP timeouts and structured JSON logs.
- **API documentation:** a hand-written OpenAPI 3 contract with Swagger UI at `/docs`, both served by the backend.
- **Web client (React + TypeScript):** a form with one button per operation, validation messages per field,
  accessible results and errors, and a responsive mobile-first layout. The API client times out after 10 seconds.
- **Docker:** multi-stage images for both services and Docker Compose, with nginx as the single entry point
  and reverse proxy for the API.
- **Tests and CI:** unit tests with coverage reports in both layers, and a GitHub Actions workflow that
  checks formatting, lint, tests, the production build and the Docker images.
- **Documentation:** README, architecture decision records, a C4 model in Structurizr DSL with PlantUML and
  SVG exports, and the AI prompt log.

[Unreleased]: https://github.com/yakumateo/sezzle-calculator/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yakumateo/sezzle-calculator/releases/tag/v1.0.0
