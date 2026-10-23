package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// sample mirrors the shape of a real request body.
type sample struct {
	A *float64 `json:"a"`
}

func TestDecodeJSON(t *testing.T) {
	cases := []struct {
		name       string
		body       string
		wantStatus int
		wantDetail string
	}{
		{"empty body", "", http.StatusBadRequest, "request body is empty"},
		{"malformed JSON", `{"a": 1`, http.StatusBadRequest, "request body is not valid JSON"},
		{"syntax error", `{"a": }`, http.StatusBadRequest, "request body is not valid JSON"},
		{"not an object", `[1, 2]`, http.StatusBadRequest, "request body must be a JSON object"},
		{"string instead of number", `{"a": "2"}`, http.StatusBadRequest, `field "a" must be a valid number`},
		// 1e400 is valid JSON but does not fit in a float64.
		{"number out of float64 range", `{"a": 1e400}`, http.StatusBadRequest, `field "a" must be a valid number`},
		{"unknown field", `{"a": 1, "c": 2}`, http.StatusBadRequest, `unknown field "c"`},
		{"two JSON values", `{"a": 1} {"a": 2}`, http.StatusBadRequest, "request body must contain a single JSON object"},
		{"too large", `{"a": 1, "padding": "` + strings.Repeat("x", maxBodyBytes) + `"}`, http.StatusRequestEntityTooLarge, "request body must not exceed 1024 bytes"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tc.body))
			var dst sample

			err := decodeJSON(rec, req, &dst)
			if err == nil {
				t.Fatal("expected an error, got nil")
			}
			writeRequestError(rec, err)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if got := decodeProblem(t, rec); got.Detail != tc.wantDetail {
				t.Errorf("detail = %q, want %q", got.Detail, tc.wantDetail)
			}
		})
	}
}

func TestDecodeJSONValidBody(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"a": 2.5}`))
	var dst sample

	if err := decodeJSON(httptest.NewRecorder(), req, &dst); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dst.A == nil || *dst.A != 2.5 {
		t.Errorf("a = %v, want 2.5", dst.A)
	}
}
