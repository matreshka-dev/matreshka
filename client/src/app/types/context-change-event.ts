export type ContextChangeValue = {
  key: string;
  value: unknown;
};

export type ContextChangeEvent = {
  contextId: string;
  values: ContextChangeValue[];
};
