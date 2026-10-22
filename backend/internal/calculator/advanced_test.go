package calculator_test

import (
	"errors"
	"math"
	"testing"

	"github.com/yakumateo/sezzle-calculator/backend/internal/calculator"
)

func TestPower(t *testing.T) {
	runBinaryCases(t, calculator.Power, []binaryCase{
		{name: "integer exponent", a: 2, b: 10, want: 1024},
		{name: "zero exponent", a: 7, b: 0, want: 1},
		{name: "negative exponent", a: 2, b: -2, want: 0.25},
		{name: "fractional exponent", a: 9, b: 0.5, want: 3},
		{name: "negative base with odd exponent", a: -2, b: 3, want: -8},
		// 0^-1 equals 1/0: math.Pow would return +Inf, but the real cause is a division by zero.
		{name: "zero to a negative exponent", a: 0, b: -1, wantErr: calculator.ErrDivisionByZero},
		// (-8)^0.5 is the square root of a negative number: math.Pow returns NaN.
		{name: "negative base with fractional exponent", a: -8, b: 0.5, wantErr: calculator.ErrUndefinedResult},
		{name: "overflow", a: 10, b: 400, wantErr: calculator.ErrResultOutOfRange},
	})
}

// SquareRoot takes a single operand, so it uses its own table instead of runBinaryCases.
func TestSquareRoot(t *testing.T) {
	cases := []struct {
		name    string
		x       float64
		want    float64
		wantErr error
	}{
		{name: "perfect square", x: 16, want: 4},
		{name: "zero", x: 0, want: 0},
		{name: "decimal", x: 2.25, want: 1.5},
		{name: "negative number", x: -9, wantErr: calculator.ErrNegativeSquareRoot},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := calculator.SquareRoot(tc.x)

			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("error = %v, want %v", err, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("result = %v, want %v", got, tc.want)
			}
		})
	}
}

// math.Sqrt(-0) is -0, and -0 is not < 0, so it passes the negative check.
// Like TestMultiplyNormalizesNegativeZero, the sign bit is checked explicitly.
func TestSquareRootNormalizesNegativeZero(t *testing.T) {
	got, err := calculator.SquareRoot(math.Copysign(0, -1))

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Signbit(got) {
		t.Errorf("result = -0, want 0")
	}
}

func TestPercentage(t *testing.T) {
	runBinaryCases(t, calculator.Percentage, []binaryCase{
		// Must be exactly 30: Percentage multiplies before dividing to avoid 0.15 * 200 rounding.
		{name: "whole numbers", a: 15, b: 200, want: 30},
		{name: "decimal percent", a: 12.5, b: 80, want: 10},
		{name: "more than one hundred percent", a: 150, b: 40, want: 60},
		{name: "negative total", a: 10, b: -50, want: -5},
		{name: "overflow", a: math.MaxFloat64, b: math.MaxFloat64, wantErr: calculator.ErrResultOutOfRange},
	})
}
