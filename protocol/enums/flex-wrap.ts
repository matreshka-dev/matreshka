/**
 * Ключевые значения CSS-свойства `flex-wrap`.
 * Комбинации с `balance` задают перенос и равномерное распределение по строкам.
 * `wrap balance` эквивалентен `balance wrap`;
 * `wrap-reverse balance` эквивалентен `balance wrap-reverse`.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/flex-wrap
 */
export enum FlexWrap {
  Nowrap = "nowrap",
  Wrap = "wrap",
  WrapReverse = "wrap-reverse",
  Balance = "balance",
  WrapBalance = "wrap balance",
  BalanceWrap = "balance wrap",
  WrapReverseBalance = "wrap-reverse balance",
  BalanceWrapReverse = "balance wrap-reverse",
}
