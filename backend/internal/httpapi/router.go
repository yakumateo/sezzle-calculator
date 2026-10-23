package httpapi

import (
	"net/http"

	"github.com/yakumateo/sezzle-calculator/backend/api"
	"github.com/yakumateo/sezzle-calculator/backend/internal/calculator"
)

// NewRouter returns the HTTP handler with every route of the service.
//
// It uses the standard library router: since Go 1.22 a pattern can include the
// method ("POST /api/v1/add"), and requests with another method get a 405.
func NewRouter() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", health)
	mux.HandleFunc("GET /docs", api.Page)
	mux.HandleFunc("GET /docs/openapi.yaml", api.Spec)

	mux.HandleFunc("POST /api/v1/add", binaryHandler("add", calculator.Add))
	mux.HandleFunc("POST /api/v1/subtract", binaryHandler("subtract", calculator.Subtract))
	mux.HandleFunc("POST /api/v1/multiply", binaryHandler("multiply", calculator.Multiply))
	mux.HandleFunc("POST /api/v1/divide", binaryHandler("divide", calculator.Divide))
	mux.HandleFunc("POST /api/v1/power", binaryHandler("power", calculator.Power))
	mux.HandleFunc("POST /api/v1/percentage", binaryHandler("percentage", calculator.Percentage))
	mux.HandleFunc("POST /api/v1/sqrt", unaryHandler("sqrt", calculator.SquareRoot))

	return mux
}
