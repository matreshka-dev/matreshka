import { describe, expect, it } from "vitest";
import { Context } from "./context";
import { ContextRef } from "./context-ref";

describe("context.local / ref.local", () => {
  it("set-context сериализует patch одного поля", async () => {
    const context = new Context({
      data: async () => ({ loading: false as boolean }),
    });
    await context.init();

    const action = context.local.set({ loading: true });
    const json = action.toJSON();
    const payload = json.payload as {
      context: string;
      patch: { loading: { kind: "literal"; value: boolean } };
    };

    expect(json.class).toBe("set-context");
    expect(payload.context).toBe(context.id);
    expect(payload.patch).toEqual({
      loading: { kind: "literal", value: true },
    });
  });

  it("set-context сериализует batch patch", async () => {
    const context = new Context({
      data: async () => ({
        loading: false as boolean,
        dirty: false as boolean,
      }),
    });
    await context.init();

    const action = context.local.set({ loading: true, dirty: true });
    const json = action.toJSON();
    const payload = json.payload as {
      patch: {
        loading: { kind: "literal"; value: boolean };
        dirty: { kind: "literal"; value: boolean };
      };
    };

    expect(payload.patch).toEqual({
      loading: { kind: "literal", value: true },
      dirty: { kind: "literal", value: true },
    });
  });

  it("ref.local.set сериализует patch по path ref", async () => {
    const context = new Context({
      data: async () => ({ loading: false as boolean }),
    });
    await context.init();

    const ref = context.ref("loading");
    const action = ref.local.set(true);
    const json = action.toJSON();
    const payload = json.payload as {
      context: string;
      patch: { loading: { kind: "literal"; value: boolean } };
    };

    expect(json.class).toBe("set-context");
    expect(payload.context).toBe(context.id);
    expect(payload.patch).toEqual({
      loading: { kind: "literal", value: true },
    });
  });

  it("set и inc сериализуют ссылку как ref operand", async () => {
    const context = new Context({
      data: async () => ({
        loading: false as boolean,
        quantity: 1 as number,
      }),
    });
    const source = new Context({
      data: async () => ({
        enabled: true as boolean,
        step: 2 as number,
      }),
    });
    await context.init();
    await source.init();

    const setPayload = context.local
      .set({ loading: source.ref("enabled") })
      .toJSON().payload as {
      patch: {
        loading: { kind: "ref"; ref: ContextRef };
      };
    };
    const incPayload = context
      .ref("quantity")
      .local.inc(source.ref("step"))
      .toJSON().payload as {
      step: { kind: "ref"; ref: ContextRef };
    };

    // @ts-expect-error ссылка должна иметь тип значения поля patch
    context.local.set({ loading: source.ref("step") });
    // @ts-expect-error ссылка шага должна быть числовой
    context.ref("quantity").local.inc(source.ref("enabled"));

    expect(setPayload.patch.loading.kind).toBe("ref");
    expect(setPayload.patch.loading.ref.path).toBe("enabled");
    expect(incPayload.step.kind).toBe("ref");
    expect(incPayload.step.ref.path).toBe("step");
  });

  it("toggle сериализует class и ref path", async () => {
    const context = new Context({
      data: async () => ({ enabled: false as boolean }),
    });
    await context.init();

    const action = context.local.toggle("enabled");
    const json = action.toJSON();
    const payload = json.payload as { ref: ContextRef };

    expect(json.class).toBe("toggle-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("enabled");
  });

  it("inc сериализует class, ref path и шаг 1 по умолчанию", async () => {
    const context = new Context({
      data: async () => ({ quantity: 2 as number }),
    });
    await context.init();

    const action = context.local.inc("quantity");
    const json = action.toJSON();
    const payload = json.payload as {
      ref: ContextRef;
      step: { kind: "literal"; value: number };
    };

    expect(json.class).toBe("inc-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("quantity");
    expect(payload.step).toEqual({ kind: "literal", value: 1 });
  });

  it("inc сериализует заданный шаг", async () => {
    const context = new Context({
      data: async () => ({ quantity: 2 as number }),
    });
    await context.init();

    const action = context.local.inc("quantity", 3);
    const json = action.toJSON();
    const payload = json.payload as {
      step: { kind: "literal"; value: number };
    };

    expect(payload.step).toEqual({ kind: "literal", value: 3 });
  });

  it("dec сериализует class, ref path и шаг 1 по умолчанию", async () => {
    const context = new Context({
      data: async () => ({ quantity: 2 as number }),
    });
    await context.init();

    const action = context.local.dec("quantity");
    const json = action.toJSON();
    const payload = json.payload as {
      ref: ContextRef;
      step: { kind: "literal"; value: number };
    };

    expect(json.class).toBe("dec-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("quantity");
    expect(payload.step).toEqual({ kind: "literal", value: 1 });
  });

  it("dec принимает только числовой путь", async () => {
    const context = new Context({
      data: async () => ({
        quantity: 1 as number,
        title: "" as string,
      }),
    });
    await context.init();

    context.local.dec("quantity");

    // @ts-expect-error строковый путь нельзя декрементировать
    context.local.dec("title");
  });

  it("inc принимает только числовой путь", async () => {
    const context = new Context({
      data: async () => ({
        quantity: 1 as number,
        title: "" as string,
        enabled: false as boolean,
      }),
    });
    await context.init();

    context.local.inc("quantity");

    // @ts-expect-error строковый путь нельзя инкрементировать
    context.local.inc("title");
    // @ts-expect-error boolean путь нельзя инкрементировать
    context.local.inc("enabled");
  });

  it("ref.local.inc сериализует class, ref path и шаг", async () => {
    const context = new Context({
      data: async () => ({ quantity: 2 as number }),
    });
    await context.init();

    const ref = context.ref("quantity");
    const action = ref.local.inc(-1);
    const json = action.toJSON();
    const payload = json.payload as {
      ref: ContextRef;
      step: { kind: "literal"; value: number };
    };

    expect(json.class).toBe("inc-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("quantity");
    expect(payload.step).toEqual({ kind: "literal", value: -1 });
  });

  it("ref.local.inc недоступен для нечислового ref", async () => {
    const context = new Context({
      data: async () => ({ title: "" as string, quantity: 1 as number }),
    });
    await context.init();

    context.ref("quantity").local.inc();

    // @ts-expect-error строковый ref нельзя инкрементировать
    context.ref("title").local.inc();
  });

  it("ref.local.dec сериализует class, ref path и шаг", async () => {
    const context = new Context({
      data: async () => ({ quantity: 2 as number }),
    });
    await context.init();

    const ref = context.ref("quantity");
    const action = ref.local.dec(2);
    const json = action.toJSON();
    const payload = json.payload as {
      ref: ContextRef;
      step: { kind: "literal"; value: number };
    };

    expect(json.class).toBe("dec-context-value");
    expect(payload.ref.path).toBe("quantity");
    expect(payload.step).toEqual({ kind: "literal", value: 2 });
  });

  it("ref.local.dec недоступен для нечислового ref", async () => {
    const context = new Context({
      data: async () => ({ title: "" as string, quantity: 1 as number }),
    });
    await context.init();

    context.ref("quantity").local.dec();

    // @ts-expect-error строковый ref нельзя декрементировать
    context.ref("title").local.dec();
  });

  it("ref.local.toggle сериализует class и ref path", async () => {
    const context = new Context({
      data: async () => ({ enabled: false as boolean }),
    });
    await context.init();

    const ref = context.ref("enabled");
    const action = ref.local.toggle();
    const json = action.toJSON();
    const payload = json.payload as { ref: ContextRef };

    expect(json.class).toBe("toggle-context-value");
    expect(payload.ref).toBeInstanceOf(ContextRef);
    expect(payload.ref.path).toBe("enabled");
  });

  it("ref.local.toggle недоступен для не-boolean ref", async () => {
    const context = new Context({
      data: async () => ({
        enabled: false as boolean,
        quantity: 1 as number,
      }),
    });
    await context.init();

    context.ref("enabled").local.toggle();

    // @ts-expect-error числовой ref нельзя toggle
    context.ref("quantity").local.toggle();
  });
});
