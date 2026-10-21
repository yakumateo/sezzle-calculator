package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// maxBodyBytes caps request bodies; a valid request is well under 100 bytes.
const maxBodyBytes = 1 << 10 // 1 KiB

// errBodyTooLarge is returned by decodeJSON when the body exceeds maxBodyBytes.
var errBodyTooLarge = fmt.Errorf("request body must not exceed %d bytes", maxBodyBytes)

// decodeJSON reads the request body into dst, which must be a pointer to a struct.
//
// It rejects bodies larger than maxBodyBytes, fields that dst does not declare
// and anything after the first JSON value. Returned errors have messages that
// are safe to show to the client.
func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	if err := dec.Decode(dst); err != nil {
		return describeDecodeError(err)
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request body must contain a single JSON object")
	}
	return nil
}

// describeDecodeError turns an encoding/json error into a client-facing message
// that does not expose Go type names.
func describeDecodeError(err error) error {
	var (
		syntaxErr *json.SyntaxError
		typeErr   *json.UnmarshalTypeError
		tooLarge  *http.MaxBytesError
	)

	switch {
	case errors.Is(err, io.EOF):
		return errors.New("request body is empty")
	case errors.As(err, &syntaxErr), errors.Is(err, io.ErrUnexpectedEOF):
		return errors.New("request body is not valid JSON")
	case errors.As(err, &typeErr) && typeErr.Field == "":
		return errors.New("request body must be a JSON object")
	case errors.As(err, &typeErr):
		return fmt.Errorf("field %q must be a valid number", typeErr.Field)
	case errors.As(err, &tooLarge):
		return errBodyTooLarge
	case strings.HasPrefix(err.Error(), "json: unknown field "):
		return fmt.Errorf("unknown field %s", strings.TrimPrefix(err.Error(), "json: unknown field "))
	default:
		return errors.New("request body is invalid")
	}
}

// writeRequestError responds to an error returned by decodeJSON.
func writeRequestError(w http.ResponseWriter, err error) {
	if errors.Is(err, errBodyTooLarge) {
		writeProblem(w, http.StatusRequestEntityTooLarge, err.Error())
		return
	}
	writeProblem(w, http.StatusBadRequest, err.Error())
}
