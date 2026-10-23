package calculator

import (
	"errors"
	"math"
)

// ErrNegativeSquareRoot is returned when taking the square root of a negative number.
var ErrNegativeSquareRoot = errors.New("square root of a negative number")

// Power returns base raised to exponent.
//
// Zero raised to a negative exponent is reported as ErrDivisionByZero, because
// 0^-n equals 1/0^n. A negative base with a fractional exponent, such as
// (-8)^0.5, has no real result and is reported as ErrUndefinedResult.
func Power(base, exponent float64) (float64, error) {
	if base == 0 && exponent < 0 {
		return 0, ErrDivisionByZero
	}
	return checked(math.Pow(base, exponent))
}

// SquareRoot returns the square root of x, or ErrNegativeSquareRoot when x is negative.
func SquareRoot(x float64) (float64, error) {
	if x < 0 {
		return 0, ErrNegativeSquareRoot
	}
	return checked(math.Sqrt(x))
}

// Percentage returns percent % of total; for example, Percentage(15, 200) is 30.
//
// It multiplies before dividing so that whole-number inputs give exact results
// (15 * 200 / 100 is exactly 30, while 0.15 * 200 is not exact in float64).
func Percentage(percent, total float64) (float64, error) {
	return checked(percent * total / 100)
}
