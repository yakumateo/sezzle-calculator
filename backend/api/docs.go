// Package api holds the OpenAPI contract of the service and the Swagger UI page
// that renders it.
//
// Both files are compiled into the binary with go:embed, so the service serves
// its own documentation without reading the file system at runtime.
package api

import (
	_ "embed" // required by the go:embed directives below
	"net/http"
)

//go:embed openapi.yaml
var spec []byte

//go:embed docs.html
var page []byte

// Spec serves the OpenAPI contract.
func Spec(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/yaml")
	_, _ = w.Write(spec)
}

// Page serves Swagger UI. It runs on the same origin as the API, so the
// "Try it out" button can call the endpoints without any CORS setup.
func Page(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write(page)
}
