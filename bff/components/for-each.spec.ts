import { describe, expectTypeOf, it } from "vitest";
import { ContextArrayValueRef, ContextRefValueType } from "../core";
import { createContext } from "../core/context/context";
import { ForEach } from "./for-each";
import { Text } from "./outputs/text";

describe("ForEach type inference", () => {
  it("выводит data и ref из ref массива", () => {
    type Message = {
      id: string;
      text: string;
      user: {
        name: string;
        avatar: string;
      };
    };

    const context = createContext<{ messages: Message[] }>({
      data: async () => ({
        messages: [],
      }),
    });

    void new ForEach({
      ref: context.ref("messages"),
      track: (message) => {
        expectTypeOf(message).toEqualTypeOf<Message>();
        return message.id;
      },
      generator: ({ ref }) => {
        const data = ref.get();
        const userNameRef = ref.ref("user.name");
        const textRef = ref.ref("text");
        const userName = userNameRef.get();
        const text = textRef.get();
        type MessageRefValue = ContextRefValueType<typeof ref>;
        type MessageUserNameRefValue = ContextRefValueType<typeof userNameRef>;
        type MessageTextRefValue = ContextRefValueType<typeof textRef>;

        expectTypeOf(data).toEqualTypeOf<Message>();
        expectTypeOf<MessageRefValue>().toEqualTypeOf<Message>();
        expectTypeOf<MessageUserNameRefValue>().toEqualTypeOf<string>();
        expectTypeOf<MessageTextRefValue>().toEqualTypeOf<string>();
        expectTypeOf(userName).toEqualTypeOf<string>();
        expectTypeOf(text).toEqualTypeOf<string>();

        return new Text({ value: "" });
      },
    });
  });

  it("сохраняет тип элемента во вложенном ForEach", () => {
    type Category = {
      id: string;
      name: string;
    };

    type Section = {
      id: string;
      categories: Category[];
    };

    const context = createContext<{ sections: Section[] }>({
      data: async () => ({
        sections: [],
      }),
    });

    void new ForEach({
      ref: context.ref("sections"),
      track: (section) => section.id,
      generator: ({ ref: sectionRef }) => {
        const section = sectionRef.get();
        type SectionRefValue = ContextRefValueType<typeof sectionRef>;

        expectTypeOf(section).toEqualTypeOf<Section>();
        expectTypeOf<SectionRefValue>().toEqualTypeOf<Section>();

        void new ForEach({
          ref: sectionRef.ref("categories"),
          track: (category) => category.id,
          generator: ({ ref }) => {
            const data = ref.get();
            const categoryNameRef = ref.ref("name");
            const categoryName = categoryNameRef.get();
            type CategoryRefValue = ContextRefValueType<typeof ref>;
            type CategoryNameRefValue = ContextRefValueType<typeof categoryNameRef>;

            expectTypeOf(data).toEqualTypeOf<Category>();
            expectTypeOf<CategoryRefValue>().toEqualTypeOf<Category>();
            expectTypeOf<CategoryNameRefValue>().toEqualTypeOf<string>();
            expectTypeOf(categoryName).toEqualTypeOf<string>();

            return new Text({ value: "" });
          },
        });

        return new Text({ value: section.id });
      },
    });
  });

  it("использует внешний ContextArrayValueRef без явного generic у ForEach", () => {
    type Block = {
      id: string;
      type: string;
      value: {
        label: string;
      };
    };

    const context = createContext<{ blocks: Block[] }>({
      data: async () => ({
        blocks: [],
      }),
    });

    const createEditor = (ref: ContextArrayValueRef<Block>) =>
      new ForEach({
        ref,
        track: (block) => block.id,
        generator: ({ ref: blockRef }) => {
          const data = blockRef.get();
          const blockLabelRef = blockRef.ref("value").ref("label");
          const blockLabel = blockLabelRef.get();
          type BlockRefValue = ContextRefValueType<typeof blockRef>;
          type BlockLabelRefValue = ContextRefValueType<typeof blockLabelRef>;

          expectTypeOf(data).toEqualTypeOf<Block>();
          expectTypeOf<BlockRefValue>().toEqualTypeOf<Block>();
          expectTypeOf<BlockLabelRefValue>().toEqualTypeOf<string>();
          expectTypeOf(blockLabel).toEqualTypeOf<string>();

          return new Text({ value: "" });
        },
      });

    void createEditor(context.ref("blocks"));
  });

  it("требует ref на массив", () => {
    const context = createContext<{
      list: { id: string }[];
      single: { id: string };
    }>({
      data: async () => ({
        list: [],
        single: { id: "1" },
      }),
    });

    void new ForEach({
      ref: context.ref("list"),
      track: (item) => item.id,
      generator: () => new Text({ value: "" }),
    });

    void new ForEach({
      // @ts-expect-error ForEach принимает только ref на массив
      ref: context.ref("single"),
      track: () => "single",
      generator: () => new Text({ value: "" }),
    });
  });
});
