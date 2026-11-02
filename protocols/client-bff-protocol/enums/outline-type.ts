export enum OutlineType {
  Border = "border",
  Shadow = "shadow",
}

export type ComponentOutline =
  | {
      type: OutlineType.Border;
      properties?: {
        width: number;
      };
    }
  | {
      type: OutlineType.Shadow;
    };
