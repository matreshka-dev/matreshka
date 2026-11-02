import { ArrayLengthCompare } from '@protocol/enums/array-length-compare';

export function arrayLengthMatches(
  actual: number,
  target: number,
  operator: ArrayLengthCompare,
): boolean {
  switch (operator) {
    case ArrayLengthCompare.Equal:
      return actual === target;
    case ArrayLengthCompare.LessThan:
      return actual < target;
    case ArrayLengthCompare.LessOrEqual:
      return actual <= target;
    case ArrayLengthCompare.GreaterThan:
      return actual > target;
    case ArrayLengthCompare.GreaterOrEqual:
      return actual >= target;
  }

  return false;
}
