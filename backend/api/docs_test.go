package api_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/yakumateo/sezzle-calculator/backend/api"
)

func TestSpec(t *testing.T) {
	rec := httptest.NewRecorder()

	api.Spec(rec, httptest.NewRequest(http.MethodGet, "/docs/openapi.yaml", nil))

	if got := rec.Header().Get("Content-Type"); got != "application/yaml" {
		t.Errorf("Content-Type = %q, want application/yaml", got)
	}
	if !strings.HasPrefix(rec.Body.String(), "openapi: 3.0.3") {
		t.Errorf("body does not start with the OpenAPI version line")
	}
}

func TestPage(t *testing.T) {
	rec := httptest.NewRecorder()

	api.Page(rec, httptest.NewRequest(http.MethodGet, "/docs", nil))

	if got := rec.Header().Get("Content-Type"); got != "text/html; charset=utf-8" {
		t.Errorf("Content-Type = %q, want text/html; charset=utf-8", got)
	}
	// The page must load the spec from the route the router registers.
	if !strings.Contains(rec.Body.String(), `url: "/docs/openapi.yaml"`) {
		t.Errorf("page does not point Swagger UI at /docs/openapi.yaml")
	}
}
