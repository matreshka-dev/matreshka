import type { Json } from "./json";
export type SerializedOperand = {
    kind: "literal";
    value: Json;
} | {
    kind: "ref";
    ref: string;
};
