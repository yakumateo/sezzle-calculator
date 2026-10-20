package calculator_test

import (
	"errors"
	"math"
	"testing"

	"github.com/yakumateo/sezzle-calculator/backend/internal/calculator"
)

// binaryCase describes one call to a two-operand operation and its expected outcome.
type binaryCase struct {
	name    string
	a, b    float64
	want    float64
	wantErr error
}

// runBinaryCases runs each case as a named subtest against op.
//
// Results are compared with != on purpose: every expected value in these
// tables is exactly representable in float64, so no tolerance is needed.
func runBinaryCases(t *testing.T, op func(a, b float64) (float64, error), cases []binaryCase) {
	t.Helper()
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := op(tc.a, tc.b)

			if !errors.Is(err, tc.wantErr) {
				t.Fatalf("error = %v, want %v", err, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("result = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestAdd(t *testing.T) {
	runBinaryCases(t, calculator.Add, []binaryCase{
		{name: "positive numbers", a: 2, b: 3, want: 5},
		{name: "negative numbers", a: -2, b: -3, want: -5},
		{name: "decimals", a: 1.5, b: 2.25, want: 3.75},
		// The raw sum is +Inf, which JSON cannot encode, so it must become an error.
		{name: "overflow", a: math.MaxFloat64, b: math.MaxFloat64, wantErr: calculator.ErrResultOutOfRange},
	})
}

func TestSubtract(t *testing.T) {
	runBinaryCases(t, calculator.Subtract, []binaryCase{
		{name: "positive result", a: 5, b: 3, want: 2},
		{name: "negative result", a: 3, b: 5, want: -2},
		{name: "overflow", a: -math.MaxFloat64, b: math.MaxFloat64, wantErr: calculator.ErrResultOutOfRange},
	})
}

func TestMultiply(t *testing.T) {
	runBinaryCases(t, calculator.Multiply, []binaryCase{
		{name: "positive numbers", a: 4, b: 2.5, want: 10},
		{name: "by zero", a: 7, b: 0, want: 0},
		{name: "mixed signs", a: -4, b: 3, want: -12},
		{name: "overflow", a: math.MaxFloat64, b: 2, wantErr: calculator.ErrResultOutOfRange},
	})
}

// In IEEE 754, -1 * 0 is -0. Since -0 == 0 is true, the table in TestMultiply
// cannot catch it, so the sign bit is checked explicitly. Without the
// normalization the API would answer "-0".
func TestMultiplyNormalizesNegativeZero(t *testing.T) {
	got, err := calculator.Multiply(-1, 0)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if math.Signbit(got) {
		t.Errorf("result = -0, want 0")
	}
}

func TestDivide(t *testing.T) {
	runBinaryCases(t, calculator.Divide, []binaryCase{
		{name: "exact division", a: 10, b: 4, want: 2.5},
		{name: "negative divisor", a: 9, b: -3, want: -3},
		{name: "zero dividend", a: 0, b: 5, want: 0},
		{name: "division by zero", a: 1, b: 0, wantErr: calculator.ErrDivisionByZero},
		// 0 / 0 is NaN in float64; it must still be reported as division by zero.
		{name: "zero divided by zero", a: 0, b: 0, wantErr: calculator.ErrDivisionByZero},
		{name: "overflow", a: math.MaxFloat64, b: 0.5, wantErr: calculator.ErrResultOutOfRange},
	})
}
