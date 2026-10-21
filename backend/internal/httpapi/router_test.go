package httpapi_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/yakumateo/sezzle-calculator/backend/internal/httpapi"
)

// These tests go through NewRouter, exactly like a real client would, so they
// cover routing, decoding, validation, the domain call and the response together.
func TestRouter(t *testing.T) {
	cases := []struct {
		name       string
		method     string
		path       string
		body       string
		wantStatus int
		wantBody   string // empty means the body is not checked
	}{
		// Successful calculations.
		{"add", "POST", "/api/v1/add", `{"a": 2, "b": 3}`, 200, `{"operation":"add","a":2,"b":3,"result":5}`},
		{"subtract", "POST", "/api/v1/subtract", `{"a": 2, "b": 3}`, 200, `{"operation":"subtract","a":2,"b":3,"result":-1}`},
		{"multiply", "POST", "/api/v1/multiply", `{"a": 2.5, "b": 4}`, 200, `{"operation":"multiply","a":2.5,"b":4,"result":10}`},
		{"divide", "POST", "/api/v1/divide", `{"a": 10, "b": 4}`, 200, `{"operation":"divide","a":10,"b":4,"result":2.5}`},
		{"power", "POST", "/api/v1/power", `{"a": 2, "b": 10}`, 200, `{"operation":"power","a":2,"b":10,"result":1024}`},
		{"percentage", "POST", "/api/v1/percentage", `{"a": 15, "b": 200}`, 200, `{"operation":"percentage","a":15,"b":200,"result":30}`},
		{"square root omits b", "POST", "/api/v1/sqrt", `{"a": 16}`, 200, `{"operation":"sqrt","a":16,"result":4}`},
		// An explicit zero is a valid operand, unlike a missing field.
		{"zero operand", "POST", "/api/v1/add", `{"a": 0, "b": 0}`, 200, `{"operation":"add","a":0,"b":0,"result":0}`},

		// Valid requests whose result is undefined: 422.
		{"division by zero", "POST", "/api/v1/divide", `{"a": 1, "b": 0}`, 422,
			`{"type":"about:blank","title":"Unprocessable Entity","status":422,"detail":"division by zero"}`},
		{"square root of negative", "POST", "/api/v1/sqrt", `{"a": -4}`, 422,
			`{"type":"about:blank","title":"Unprocessable Entity","status":422,"detail":"square root of a negative number"}`},

		// Invalid requests: 400.
		{"missing a", "POST", "/api/v1/add", `{"b": 3}`, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"field \"a\" is required"}`},
		{"missing b", "POST", "/api/v1/divide", `{"a": 3}`, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"field \"b\" is required"}`},
		{"missing a in square root", "POST", "/api/v1/sqrt", `{}`, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"field \"a\" is required"}`},
		{"b sent to square root", "POST", "/api/v1/sqrt", `{"a": 4, "b": 2}`, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"unknown field \"b\""}`},
		{"invalid JSON", "POST", "/api/v1/add", `not json`, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"request body is not valid JSON"}`},
		{"empty body in square root", "POST", "/api/v1/sqrt", ``, 400,
			`{"type":"about:blank","title":"Bad Request","status":400,"detail":"request body is empty"}`},

		// Routing.
		{"health", "GET", "/health", ``, 200, `{"status":"ok"}`},
		{"wrong method", "GET", "/api/v1/add", ``, 405, ``},
		{"unknown operation", "POST", "/api/v1/modulo", `{"a": 1, "b": 2}`, 404, ``},
	}

	router := httpapi.NewRouter()

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, tc.wantStatus, rec.Body)
			}
			if tc.wantBody == "" {
				return
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tc.wantBody {
				t.Errorf("body =\n%s\nwant\n%s", got, tc.wantBody)
			}
		})
	}
}

func TestRouterErrorContentType(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/divide", strings.NewReader(`{"a": 1, "b": 0}`))
	rec := httptest.NewRecorder()

	httpapi.NewRouter().ServeHTTP(rec, req)

	if got := rec.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", got)
	}
}
