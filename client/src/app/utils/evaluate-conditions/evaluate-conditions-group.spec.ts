import { ArrayLengthCompare } from '@client-bff-protocol/enums/array-length-compare';
import { ConditionGroupOperator } from '@client-bff-protocol/enums/condition-group-operator';
import { ConditionType } from '@client-bff-protocol/enums/condition-type';
import { DeviceType } from '@client-bff-protocol/enums/device-type';
import type { Condition } from '@client-bff-protocol/types/condition';
import { describe, expect, it } from 'vitest';
import { evaluateConditions } from './evaluate-conditions';

const ROLE_REF = 'ctx.role';
const SESSION_REF = 'ctx.session';
const FORMAT_REF = 'ctx.format';
const ROWS_REF = 'ctx.rows';
const TEMPLATE_ID_REF = 'ctx.templateId';

const literal = (value: string | number | boolean | null) =>
  ({ kind: 'literal', value }) as const;

const options = {
  getContextValue: (ref: string) => {
    const values: Record<string, unknown> = {
      [ROLE_REF]: 'admin',
      [SESSION_REF]: 'ok',
      [FORMAT_REF]: 'csv',
      [ROWS_REF]: [1, 2],
      [TEMPLATE_ID_REF]: undefined,
    };
    return values[ref];
  },
  getDeviceType: () => DeviceType.Desktop,
};

describe('evaluateConditions with groups', () => {
  it('when.any — истинно, если выполнено хотя бы одно условие', () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal('moderator') },
                },
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal('admin') },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it('when.any — ложно, если ни одно условие не выполнено', () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal('guest') },
                },
                {
                  type: ConditionType.ContextValueEqual,
                  payload: { ref: ROLE_REF, value: literal('moderator') },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(false);
  });

  it('when.all внутри when.any — одна из двух групп', () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                {
                  type: ConditionType.Group,
                  payload: {
                    operator: ConditionGroupOperator.And,
                    conditions: [
                      {
                        type: ConditionType.ContextValueEqual,
                        payload: { ref: FORMAT_REF, value: literal('csv') },
                      },
                      {
                        type: ConditionType.ContextArrayLength,
                        payload: {
                          ref: ROWS_REF,
                          length: literal(0),
                          operator: ArrayLengthCompare.GreaterThan,
                        },
                      },
                    ],
                  },
                },
                {
                  type: ConditionType.Group,
                  payload: {
                    operator: ConditionGroupOperator.And,
                    conditions: [
                      {
                        type: ConditionType.ContextValueEqual,
                        payload: { ref: FORMAT_REF, value: literal('pdf') },
                      },
                      {
                        type: ConditionType.ContextValueDefined,
                        payload: { ref: TEMPLATE_ID_REF },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it('верхний уровень остаётся AND: группа OR и отдельное условие', () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [
                { type: ConditionType.DesktopDevice },
                { type: ConditionType.MobileDevice },
              ],
            },
          },
          {
            type: ConditionType.ContextValueEqual,
            payload: { ref: ROLE_REF, value: literal('guest') },
          },
        ] satisfies Condition[],
        options,
      ),
    ).toBe(false);
  });

  it('пустая группа any — ложь, пустая группа all — истина', () => {
    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.Or,
              conditions: [],
            },
          },
        ],
        options,
      ),
    ).toBe(false);

    expect(
      evaluateConditions(
        [
          {
            type: ConditionType.Group,
            payload: {
              operator: ConditionGroupOperator.And,
              conditions: [],
            },
          },
        ],
        options,
      ),
    ).toBe(true);
  });

  it('wire JSON: device OR-группа и AND-группа context-условий', () => {
    const conditions: Condition[] = [
      {
        type: ConditionType.Group,
        payload: {
          operator: ConditionGroupOperator.Or,
          conditions: [
            { type: ConditionType.DesktopDevice },
            { type: ConditionType.MobileDevice },
          ],
        },
      },
      {
        type: ConditionType.Group,
        payload: {
          operator: ConditionGroupOperator.And,
          conditions: [
            {
              type: ConditionType.ContextValueEqual,
              payload: { ref: ROLE_REF, value: literal('admin') },
            },
            {
              type: ConditionType.ContextValueEqual,
              payload: { ref: SESSION_REF, value: literal('ok') },
            },
          ],
        },
      },
    ];

    expect(evaluateConditions(conditions, options)).toBe(true);
  });
});
