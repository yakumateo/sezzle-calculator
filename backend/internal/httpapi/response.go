// Package httpapi exposes the calculator over HTTP.
//
// It is the interface layer: it decodes and validates JSON requests, calls the
// calculator domain and translates its results and errors into HTTP responses.
// Errors follow the Problem Details format (RFC 9457, formerly RFC 7807).
package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/yakumateo/sezzle-calculator/backend/internal/calculator"
)

// problem is the body of every error response.
type problem struct {
	Type   string `json:"type"`
	Title  string `json:"title"`
	Status int    `json:"status"`
	Detail string `json:"detail"`
}

// writeJSON writes body as a JSON response with the given status code.
func writeJSON(w http.ResponseWriter, status int, body any) {
	writeBody(w, status, "application/json", body)
}

// writeProblem writes an error response. The type "about:blank" means the
// status code alone describes the error, so the title is its standard text.
func writeProblem(w http.ResponseWriter, status int, detail string) {
	writeBody(w, status, "application/problem+json", problem{
		Type:   "about:blank",
		Title:  http.StatusText(status),
		Status: status,
		Detail: detail,
	})
}

// writeCalculationError maps an error returned by the calculator domain to a
// response: 422 when the request was valid but the result is not defined,
// 500 for anything unexpected.
func writeCalculationError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, calculator.ErrDivisionByZero),
		errors.Is(err, calculator.ErrNegativeSquareRoot),
		errors.Is(err, calculator.ErrUndefinedResult),
		errors.Is(err, calculator.ErrResultOutOfRange):
		writeProblem(w, http.StatusUnprocessableEntity, err.Error())
	default:
		writeProblem(w, http.StatusInternalServerError, "unexpected error")
	}
}

func writeBody(w http.ResponseWriter, status int, contentType string, body any) {
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	// The status line is already sent, so an encoding error cannot be reported
	// to the client; the bodies used here are plain structs that always encode.
	_ = json.NewEncoder(w).Encode(body)
}
