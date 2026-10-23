package httpapi

import "net/http"

// binaryRequest is the body of the two-operand endpoints. The fields are
// pointers so that a missing field (nil) can be told apart from an explicit 0.
type binaryRequest struct {
	A *float64 `json:"a"`
	B *float64 `json:"b"`
}

// unaryRequest is the body of the one-operand endpoints.
type unaryRequest struct {
	A *float64 `json:"a"`
}

// calculationResponse is the body of every successful calculation.
// B is omitted from the JSON for one-operand operations.
type calculationResponse struct {
	Operation string   `json:"operation"`
	A         float64  `json:"a"`
	B         *float64 `json:"b,omitempty"`
	Result    float64  `json:"result"`
}

// binaryHandler returns a handler that runs a two-operand operation such as
// calculator.Add. Every two-operand endpoint shares this code; only name and op change.
func binaryHandler(name string, op func(a, b float64) (float64, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req binaryRequest
		if err := decodeJSON(w, r, &req); err != nil {
			writeRequestError(w, err)
			return
		}
		if req.A == nil {
			writeProblem(w, http.StatusBadRequest, `field "a" is required`)
			return
		}
		if req.B == nil {
			writeProblem(w, http.StatusBadRequest, `field "b" is required`)
			return
		}

		result, err := op(*req.A, *req.B)
		if err != nil {
			writeCalculationError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, calculationResponse{Operation: name, A: *req.A, B: req.B, Result: result})
	}
}

// unaryHandler returns a handler that runs a one-operand operation such as calculator.SquareRoot.
func unaryHandler(name string, op func(x float64) (float64, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req unaryRequest
		if err := decodeJSON(w, r, &req); err != nil {
			writeRequestError(w, err)
			return
		}
		if req.A == nil {
			writeProblem(w, http.StatusBadRequest, `field "a" is required`)
			return
		}

		result, err := op(*req.A)
		if err != nil {
			writeCalculationError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, calculationResponse{Operation: name, A: *req.A, Result: result})
	}
}

// health reports that the service is up; Docker uses it as a health check.
func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
