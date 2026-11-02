import type { ServerComponentConfig } from "./server-component-config";

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type OutputConfig<ValueType = unknown> = {
  properties: RequireOnlyOne<{
    value?: ValueType;
    ref?: string;
  }>;
} & ServerComponentConfig;
