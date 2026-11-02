import { ArrayLengthCompare } from "../enums/array-length-compare";
import { ConditionGroupOperator } from "../enums/condition-group-operator";
import { ConditionType } from "../enums/condition-type";
import type { SerializedOperand } from "./serialized-operand";

type LeafCondition =
  | {
      type: ConditionType.ContextValueEqual;
      payload: {
        ref: string;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextValueNotEqual;
      payload: {
        ref: string;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextValueIn;
      payload: {
        ref: string;
        value: SerializedOperand[];
      };
    }
  | {
      type: ConditionType.ContextValueDefined;
      payload: {
        ref: string;
      };
    }
  | {
      type: ConditionType.ContextValueUndefined;
      payload: {
        ref: string;
      };
    }
  | {
      type: ConditionType.ContextArrayLength;
      payload: {
        ref: string;
        length: SerializedOperand;
        operator: ArrayLengthCompare;
      };
    }
  | {
      type: ConditionType.ContextArrayIncludes;
      payload: {
        ref: string;
        itemPath: string;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextArrayNotIncludes;
      payload: {
        ref: string;
        itemPath: string;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.MobileDevice;
    }
  | {
      type: ConditionType.TabletDevice;
    }
  | {
      type: ConditionType.DesktopDevice;
    }
  | {
      type: ConditionType.NotTabletDevice;
    }
  | {
      type: ConditionType.NotMobileDevice;
    }
  | {
      type: ConditionType.NotDesktopDevice;
    };

export type Condition =
  | LeafCondition
  | {
      type: ConditionType.Group;
      payload: {
        operator: ConditionGroupOperator;
        conditions: Condition[];
      };
    };
