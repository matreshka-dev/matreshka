import type { Condition } from "./condition";
export type ServerComponentInteraction = {
    class: string;
    payload: object;
    conditions?: Condition[];
};
