package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/yakumateo/sezzle-calculator/backend/internal/calculator"
)

// decodeProblem checks that rec holds a Problem Details response and returns its body.
func decodeProblem(t *testing.T, rec *httptest.ResponseRecorder) problem {
	t.Helper()
	if got := rec.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Fatalf("Content-Type = %q, want application/problem+json", got)
	}
	var body problem
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decoding problem body: %v", err)
	}
	return body
}

func TestWriteJSON(t *testing.T) {
	rec := httptest.NewRecorder()

	writeJSON(rec, http.StatusOK, map[string]string{"status": "ok"})

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type = %q, want application/json", got)
	}
	if got, want := rec.Body.String(), "{\"status\":\"ok\"}\n"; got != want {
		t.Errorf("body = %q, want %q", got, want)
	}
}

func TestWriteProblem(t *testing.T) {
	rec := httptest.NewRecorder()

	writeProblem(rec, http.StatusBadRequest, `field "a" is required`)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	want := problem{Type: "about:blank", Title: "Bad Request", Status: 400, Detail: `field "a" is required`}
	if got := decodeProblem(t, rec); got != want {
		t.Errorf("body = %+v, want %+v", got, want)
	}
}

func TestWriteCalculationError(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		wantStatus int
		wantDetail string
	}{
		{"division by zero", calculator.ErrDivisionByZero, http.StatusUnprocessableEntity, "division by zero"},
		{"negative square root", calculator.ErrNegativeSquareRoot, http.StatusUnprocessableEntity, "square root of a negative number"},
		{"undefined result", calculator.ErrUndefinedResult, http.StatusUnprocessableEntity, "result is not a real number"},
		{"out of range", calculator.ErrResultOutOfRange, http.StatusUnprocessableEntity, "result is out of range"},
		// errors.Is also matches a domain error that another layer wrapped with %w.
		{"wrapped domain error", fmt.Errorf("dividing: %w", calculator.ErrDivisionByZero), http.StatusUnprocessableEntity, "dividing: division by zero"},
		// Unknown errors must not leak internal details to the client.
		{"unexpected error", errors.New("database password is wrong"), http.StatusInternalServerError, "unexpected error"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()

			writeCalculationError(rec, tc.err)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if got := decodeProblem(t, rec); got.Detail != tc.wantDetail {
				t.Errorf("detail = %q, want %q", got.Detail, tc.wantDetail)
			}
		})
	}
}
