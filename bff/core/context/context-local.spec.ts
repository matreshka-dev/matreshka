import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createContext } from "./context";
import { ContextRef } from "./context-ref";

describe("context.local / ref.local", () => {
  it("set-context сериализует patch одного поля", async () => {
    const context = createContext({
      data: async () => ({ loading: false as boolean }),
      schema: z.object({ loading: z.boolean() }),
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
    const context = createContext({
      data: async () => ({
        loading: false as boolean,
        dirty: false as boolean,
      }),
      schema: z.object({
        loading: z.boolean(),
        dirty: z.boolean(),
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
    const context = createContext({
      data: async () => ({ loading: false as boolean }),
      schema: z.object({ loading: z.boolean() }),
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
    const context = createContext({
      data: async () => ({
        loading: false as boolean,
        quantity: 1,
      }),
      schema: z.object({
        loading: z.boolean(),
        quantity: z.number(),
      }),
    });
    const source = createContext({
      data: async () => ({
        enabled: true as boolean,
        step: 2,
      }),
      schema: z.object({
        enabled: z.boolean(),
        step: z.number(),
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
    const context = createContext({
      data: async () => ({ enabled: false as boolean }),
      schema: z.object({ enabled: z.boolean() }),
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
    const context = createContext({
      data: async () => ({ quantity: 2 }),
      schema: z.object({ quantity: z.number() }),
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
    const context = createContext({
      data: async () => ({ quantity: 2 }),
      schema: z.object({ quantity: z.number() }),
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
    const context = createContext({
      data: async () => ({ quantity: 2 }),
      schema: z.object({ quantity: z.number() }),
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
    const context = createContext({
      data: async () => ({
        quantity: 1,
        title: "",
      }),
      schema: z.object({
        quantity: z.number(),
        title: z.string(),
      }),
    });
    await context.init();

    context.local.dec("quantity");

    // @ts-expect-error строковый путь нельзя декрементировать
    context.local.dec("title");
  });

  it("inc принимает только числовой путь", async () => {
    const context = createContext({
      data: async () => ({
        quantity: 1,
        title: "",
        enabled: false as boolean,
      }),
      schema: z.object({
        quantity: z.number(),
        title: z.string(),
        enabled: z.boolean(),
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
    const context = createContext({
      data: async () => ({ quantity: 2 }),
      schema: z.object({ quantity: z.number() }),
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
    const context = createContext({
      data: async () => ({ title: "", quantity: 1 }),
      schema: z.object({
        title: z.string(),
        quantity: z.number(),
      }),
    });
    await context.init();

    context.ref("quantity").local.inc();

    // @ts-expect-error строковый ref нельзя инкрементировать
    context.ref("title").local.inc();
  });

  it("ref.local.dec сериализует class, ref path и шаг", async () => {
    const context = createContext({
      data: async () => ({ quantity: 2 }),
      schema: z.object({ quantity: z.number() }),
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
    const context = createContext({
      data: async () => ({ title: "", quantity: 1 }),
      schema: z.object({
        title: z.string(),
        quantity: z.number(),
      }),
    });
    await context.init();

    context.ref("quantity").local.dec();

    // @ts-expect-error строковый ref нельзя декрементировать
    context.ref("title").local.dec();
  });

  it("ref.local.toggle сериализует class и ref path", async () => {
    const context = createContext({
      data: async () => ({ enabled: false as boolean }),
      schema: z.object({ enabled: z.boolean() }),
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
    const context = createContext({
      data: async () => ({
        enabled: false as boolean,
        quantity: 1,
      }),
      schema: z.object({
        enabled: z.boolean(),
        quantity: z.number(),
      }),
    });
    await context.init();

    context.ref("enabled").local.toggle();

    // @ts-expect-error числовой ref нельзя toggle
    context.ref("quantity").local.toggle();
  });

  it("запрещает writable local API для контекста без schema", () => {
    const context = createContext({
      data: async () => ({ flag: false as boolean }),
    });

    // @ts-expect-error без schema writable пути отсутствуют
    context.local.set({ flag: true });
    // @ts-expect-error без schema writable пути отсутствуют
    context.local.toggle("flag");
    // @ts-expect-error без schema writable пути отсутствуют
    context.ref("flag").local.set(true);
  });

  it("запрещает writable путь вне schema", () => {
    const context = createContext({
      data: async () => ({
        allowed: false as boolean,
        denied: 1,
      }),
      schema: z.object({
        allowed: z.boolean(),
      }),
    });

    context.local.set({ allowed: true });
    // @ts-expect-error путь denied отсутствует в schema
    context.local.set({ denied: 2 });
    // @ts-expect-error ref на denied не writable по schema
    context.ref("denied").local.set(2);
  });
});
