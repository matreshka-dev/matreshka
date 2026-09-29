import { describe, expect, it } from "vitest";
import { Context } from "../context/context";
import { ContextRef } from "../context/context-ref";
import { setContextValue } from "./set-context-value";
import { setContextValues } from "./set-context-values";
import { toggleContextValue } from "./toggle-context-value";

describe("context LocalActions", () => {
  it("setContextValue сериализует class и payload", async () => {
    const context = new Context({
      data: async () => ({ loading: false as boolean }),
    });
    await context.init();

    const action = setContextValue(context.ref("loading"), true);
    const json = action.toJSON();
    const payload = json.payload as { ref: ContextRef; value: unknown };

    expect(json.class).toBe("set-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("loading");
    expect(payload.ref.context).toBe(context);
    expect(payload.value).toBe(true);
  });

  it("toggleContextValue сериализует class и payload", async () => {
    const context = new Context({
      data: async () => ({ enabled: false as boolean }),
    });
    await context.init();

    const action = toggleContextValue(context.ref("enabled"));
    const json = action.toJSON();
    const payload = json.payload as { ref: ContextRef };

    expect(json.class).toBe("toggle-context-value");
    expect(payload.ref.path).toBe("enabled");
  });

  it("setContextValues сериализует batch payload", async () => {
    const context = new Context({
      data: async () => ({
        loading: false as boolean,
        dirty: false as boolean,
      }),
    });
    await context.init();

    const action = setContextValues([
      { ref: context.ref("loading"), value: true },
      { ref: context.ref("dirty"), value: true },
    ]);
    const json = action.toJSON();
    const payload = json.payload as {
      values: { ref: ContextRef; value: unknown }[];
    };

    expect(json.class).toBe("set-context-values");
    expect(payload.values).toHaveLength(2);
    expect(payload.values[0].ref.path).toBe("loading");
    expect(payload.values[0].value).toBe(true);
    expect(payload.values[1].ref.path).toBe("dirty");
    expect(payload.values[1].value).toBe(true);
  });
});
