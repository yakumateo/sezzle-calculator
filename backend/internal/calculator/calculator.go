// Package calculator implements the arithmetic operations offered by the service.
//
// It is the domain layer: it knows nothing about HTTP or JSON, so it can be
// tested and reused on its own. Every operation returns (result, error) so that
// callers handle all of them the same way, and every error is one of the
// exported sentinel values below, which callers compare with errors.Is.
package calculator

import (
	"errors"
	"math"
)

var (
	// ErrDivisionByZero is returned when an operation would divide by zero.
	ErrDivisionByZero = errors.New("division by zero")

	// ErrResultOutOfRange is returned when a result exceeds the float64 range.
	ErrResultOutOfRange = errors.New("result is out of range")

	// ErrUndefinedResult is returned when a result is not a real number.
	ErrUndefinedResult = errors.New("result is not a real number")
)

// Add returns a + b.
func Add(a, b float64) (float64, error) {
	return checked(a + b)
}

// Subtract returns a - b.
func Subtract(a, b float64) (float64, error) {
	return checked(a - b)
}

// Multiply returns a * b.
func Multiply(a, b float64) (float64, error) {
	return checked(a * b)
}

// Divide returns a / b, or ErrDivisionByZero when b is zero.
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return checked(a / b)
}

// checked rejects results that JSON cannot represent (±Inf and NaN) and
// normalizes negative zero, so that -1 * 0 is reported as 0 and not -0.
func checked(result float64) (float64, error) {
	switch {
	case math.IsNaN(result):
		return 0, ErrUndefinedResult
	case math.IsInf(result, 0):
		return 0, ErrResultOutOfRange
	case result == 0:
		return 0, nil
	default:
		return result, nil
	}
}
