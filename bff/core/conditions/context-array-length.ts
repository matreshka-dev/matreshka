import { ArrayLengthCompare } from "@matreshka/shared/enums/array-length-compare";
import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";
import {
  CompatibleArrayContextRef,
  ConditionLengthOperand,
  toWireOperand,
} from "./condition-operand";

/**
 * Условие сравнения длины массива в контексте с операндом
 * (число или значение по `ContextRef`).
 *
 * @internal Используйте фабрики длины массива ({@link contextArrayLengthEqual} и др.).
 */
export abstract class ContextArrayLength<
  R extends ContextRef,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
    operator: ArrayLengthCompare,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator,
    });
  }
}

/**
 * Алиас: длина массива в контексте равна операнду (`===`).
 *
 * @internal Используйте {@link contextArrayLengthEqual} / {@link when.lengthEquals}.
 */
export class ContextArrayLengthEqual<R extends ContextRef> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator: ArrayLengthCompare.Equal,
    });
  }
}

/** Функциональная форма {@link ContextArrayLengthEqual}. */
export function contextArrayLengthEqual<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
  length: ConditionLengthOperand,
): ContextArrayLengthEqual<R> {
  return new ContextArrayLengthEqual(ref, length);
}

/**
 * Алиас: длина массива в контексте строго меньше операнда (`<`).
 *
 * @internal Используйте {@link contextArrayLengthLessThan} / {@link when.lengthLessThan}.
 */
export class ContextArrayLengthLessThan<
  R extends ContextRef,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator: ArrayLengthCompare.LessThan,
    });
  }
}

/** Функциональная форма {@link ContextArrayLengthLessThan}. */
export function contextArrayLengthLessThan<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
  length: ConditionLengthOperand,
): ContextArrayLengthLessThan<R> {
  return new ContextArrayLengthLessThan(ref, length);
}

/**
 * Алиас: длина массива в контексте меньше или равна операнду (`<=`).
 *
 * @internal Используйте {@link contextArrayLengthLessOrEqual} / {@link when.lengthAtMost}.
 */
export class ContextArrayLengthLessOrEqual<
  R extends ContextRef,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator: ArrayLengthCompare.LessOrEqual,
    });
  }
}

/** Функциональная форма {@link ContextArrayLengthLessOrEqual}. */
export function contextArrayLengthLessOrEqual<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
  length: ConditionLengthOperand,
): ContextArrayLengthLessOrEqual<R> {
  return new ContextArrayLengthLessOrEqual(ref, length);
}

/**
 * Алиас: длина массива в контексте строго больше операнда (`>`).
 *
 * @internal Используйте {@link contextArrayLengthGreaterThan} / {@link when.lengthGreaterThan}.
 */
export class ContextArrayLengthGreaterThan<
  R extends ContextRef,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator: ArrayLengthCompare.GreaterThan,
    });
  }
}

/** Функциональная форма {@link ContextArrayLengthGreaterThan}. */
export function contextArrayLengthGreaterThan<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
  length: ConditionLengthOperand,
): ContextArrayLengthGreaterThan<R> {
  return new ContextArrayLengthGreaterThan(ref, length);
}

/**
 * Алиас: длина массива в контексте больше или равна операнду (`>=`).
 *
 * @internal Используйте {@link contextArrayLengthGreaterOrEqual} / {@link when.lengthAtLeast}.
 */
export class ContextArrayLengthGreaterOrEqual<
  R extends ContextRef,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    length: ConditionLengthOperand,
  ) {
    super(ConditionType.ContextArrayLength, {
      ref,
      length: toWireOperand(length),
      operator: ArrayLengthCompare.GreaterOrEqual,
    });
  }
}

/** Функциональная форма {@link ContextArrayLengthGreaterOrEqual}. */
export function contextArrayLengthGreaterOrEqual<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
  length: ConditionLengthOperand,
): ContextArrayLengthGreaterOrEqual<R> {
  return new ContextArrayLengthGreaterOrEqual(ref, length);
}

/**
 * Алиас: массив в контексте пуст (длина равна 0).
 *
 * @internal Используйте {@link contextValueEmpty} / {@link when.isEmpty}.
 */
export class ContextValueEmpty<
  R extends ContextRef,
> extends ContextArrayLengthEqual<R> {
  constructor(ref: CompatibleArrayContextRef<R>) {
    super(ref, 0);
  }
}

/** Функциональная форма {@link ContextValueEmpty}. */
export function contextValueEmpty<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
): ContextValueEmpty<R> {
  return new ContextValueEmpty(ref);
}

/**
 * Алиас: массив в контексте непуст (длина строго больше 0).
 *
 * @internal Используйте {@link contextValueNotEmpty} / {@link when.notEmpty}.
 */
export class ContextValueNotEmpty<
  R extends ContextRef,
> extends ContextArrayLengthGreaterThan<R> {
  constructor(ref: CompatibleArrayContextRef<R>) {
    super(ref, 0);
  }
}

/** Функциональная форма {@link ContextValueNotEmpty}. */
export function contextValueNotEmpty<R extends ContextRef>(
  ref: CompatibleArrayContextRef<R>,
): ContextValueNotEmpty<R> {
  return new ContextValueNotEmpty(ref);
}
