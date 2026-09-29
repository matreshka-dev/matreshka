import { describe, expect, it } from "vitest";
import {
  autolink,
  lineBreaks,
  TextOutputAutolinkScheme,
  TextOutputAutolinkTarget,
  TextOutputProcessor,
} from "./text";

describe("text processors helpers", () => {
  it("создаёт конфиг lineBreaks", () => {
    expect(lineBreaks()).toEqual({
      processor: TextOutputProcessor.LineBreaks,
    });
  });

  it("создаёт autolink с дефолтными настройками", () => {
    expect(autolink()).toEqual({
      processor: TextOutputProcessor.Autolink,
      target: TextOutputAutolinkTarget.Blank,
      schemes: [
        TextOutputAutolinkScheme.Http,
        TextOutputAutolinkScheme.Https,
        TextOutputAutolinkScheme.Mailto,
        TextOutputAutolinkScheme.Tel,
      ],
    });
  });

  it("пробрасывает кастомные настройки autolink", () => {
    expect(
      autolink({
        target: TextOutputAutolinkTarget.Self,
        schemes: [TextOutputAutolinkScheme.Https],
      }),
    ).toEqual({
      processor: TextOutputProcessor.Autolink,
      target: TextOutputAutolinkTarget.Self,
      schemes: [TextOutputAutolinkScheme.Https],
    });
  });
});
