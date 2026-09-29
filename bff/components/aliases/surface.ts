import { Stack, StackInitConfig } from "../stack";

export type SurfaceInitConfig = Omit<StackInitConfig<Surface>, "surface">;

export function surface(content: SurfaceInitConfig["content"]): Surface;
export function surface(
  options: Omit<SurfaceInitConfig, "content">,
  content: SurfaceInitConfig["content"],
): Surface;
export function surface(config: SurfaceInitConfig): Surface;
export function surface(
  arg0:
    | SurfaceInitConfig["content"]
    | Omit<SurfaceInitConfig, "content">
    | SurfaceInitConfig,
  arg1?: SurfaceInitConfig["content"],
): Surface {
  if (arg1 !== undefined) {
    return new Surface({
      ...(arg0 as Omit<SurfaceInitConfig, "content">),
      content: arg1,
    });
  }
  const single = arg0;
  if (
    typeof single === "object" &&
    single !== null &&
    !Array.isArray(single) &&
    "content" in single
  ) {
    return new Surface(single as SurfaceInitConfig);
  }
  return new Surface({ content: single as SurfaceInitConfig["content"] });
}

/**
 * Stack с включённым фоном поверхности (`surface: true`, `--background-color`).
 */
export class Surface extends Stack<StackInitConfig<Surface>> {
  constructor(config: SurfaceInitConfig) {
    super({ ...config, surface: true });
  }
}
