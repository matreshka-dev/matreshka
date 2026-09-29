import {
  componentBaseId,
  componentIdMatchesInstance,
  hasComponentInstanceSuffix,
} from "@matreshka/shared";
import { PlatformId } from "@matreshka/shared/enums/platform-id";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { ForEachSyncComponentsMessage } from "@matreshka/shared/messages/bff-to-client/components/for-each/for-each-sync-components-message";
import { AppDestroyEntryInstanceMessage } from "@matreshka/shared/messages/client-to-bff/app/app-destroy-entry-instance-message";
import { ComponentClickMessage } from "@matreshka/shared/messages/client-to-bff/components/component-click-message";
import { ComponentEnterMessage } from "@matreshka/shared/messages/client-to-bff/components/component-enter-message";
import { ComponentHideMessage } from "@matreshka/shared/messages/client-to-bff/components/component-hide-message";
import { ComponentLeaveMessage } from "@matreshka/shared/messages/client-to-bff/components/component-leave-message";
import { ComponentShowMessage } from "@matreshka/shared/messages/client-to-bff/components/component-show-message";
import { registerCommonClientToBffMessages } from "@matreshka/shared/messages/client-to-bff/register-common-messages";
import type { ForEachConfig } from "@matreshka/shared/types/for-each-config";
import type { PageConfig } from "@matreshka/shared/types/page-config";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Client,
  ComponentInstance,
  ComponentTreeNode,
  Context,
  mobileDevice,
  runWithClient,
  runWithEntry,
} from "../core";
import { ServerAction } from "./actions/server-action";
import { button } from "./aliases/button";
import { Component } from "./component";
import { dialog } from "./dialog";
import { EntryComponent } from "./entry-component";
import { forEach } from "./for-each";
import { text } from "./outputs/text";
import { Page } from "./page";
import { popover } from "./popover";

const INSTANCE_ALREADY_SERIALIZED =
  "Instance already serialized. Create new instance instead.";

class TestPage extends Page {
  constructor(private readonly nodes: ComponentTreeNode[]) {
    super();
  }

  protected title(): string {
    return "Test";
  }

  protected content(): ComponentTreeNode[] {
    return this.nodes;
  }
}

function createClient(): Client {
  return new Client();
}

function serializeInEntry<T>(
  client: Client,
  entryComponent: Page | EntryComponent,
  fn: () => T,
): T {
  return runWithClient(client, () => {
    const entry = entryComponent.beginSerializationContext();
    return runWithEntry(entry as ComponentInstance<EntryComponent>, fn);
  });
}

function serializePage(client: Client, page: Page): PageConfig {
  return runWithClient(client, () => page.serialize());
}

/** Как в boot.ts: serialize страницы и регистрация текущего page instance на client. */
function serializePageWithSwitch(client: Client, page: Page): PageConfig {
  return runWithClient(client, () => {
    const serializedPage = page.serialize();
    const pageInstance = page
      .getInstances({ client })
      .find((instance) => instance.id === serializedPage.id)!;
    client.switchPage(pageInstance);
    return serializedPage;
  });
}

function sendComponentClick(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: ComponentClickMessage.type,
      target: instanceId,
      payload: {},
    }),
  );
}

function sendComponentShow(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: ComponentShowMessage.type,
      target: instanceId,
    }),
  );
}

function sendComponentEnter(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: ComponentEnterMessage.type,
      target: instanceId,
    }),
  );
}

function sendComponentHide(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: ComponentHideMessage.type,
      target: instanceId,
    }),
  );
}

function sendComponentLeave(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: ComponentLeaveMessage.type,
      target: instanceId,
    }),
  );
}

function sendDestroyEntryInstance(client: Client, instanceId: string): void {
  client.newMessage(
    JSON.stringify({
      type: AppDestroyEntryInstanceMessage.type,
      payload: { id: instanceId },
    }),
  );
}

beforeAll(() => {
  registerCommonClientToBffMessages();
});

function forEachConfigsInPage(pageConfig: PageConfig): ForEachConfig[] {
  return pageConfig.properties.content.filter(
    (config) => config.class === ServerComponentClass.ForEach,
  ) as ForEachConfig[];
}

function firstSlotLeafId(forEachConfig: ForEachConfig): string {
  const slot = forEachConfig.properties.components?.[0];
  if (!slot) {
    throw new Error("ForEach preload components are missing");
  }
  const first = Array.isArray(slot) ? slot[0] : slot;
  if (!first) {
    throw new Error("ForEach preload components are missing");
  }
  return first.id;
}

function setClientState(client: Client, userAgent: string): void {
  client.state$.next({
    route: {
      visitedAt: Date.now(),
      path: "/",
      query: {},
    },
    storage: {},
    language: "ru",
    userAgent,
    prefersColorScheme: "light",
    platform: {
      id: PlatformId.TestPlatform,
      payload: {},
    },
  });
}

describe("component-id utilities", () => {
  it("разбирает instance id на базовый uuid и суффикс", () => {
    const base = "550e8400-e29b-41d4-a716-446655440000";
    const instanceId = `${base}-3`;

    expect(componentBaseId(instanceId)).toBe(base);
    expect(hasComponentInstanceSuffix(instanceId)).toBe(true);
    expect(hasComponentInstanceSuffix(base)).toBe(false);
  });

  it("сопоставляет scope сообщения с instance id и базовым id", () => {
    const base = "550e8400-e29b-41d4-a716-446655440000";
    const instanceId = `${base}-1`;

    expect(componentIdMatchesInstance(instanceId, instanceId)).toBe(true);
    expect(componentIdMatchesInstance(base, instanceId)).toBe(true);
    expect(componentIdMatchesInstance(`${base}-2`, instanceId)).toBe(false);
  });
});

describe("Component instance: базовые сценарии", () => {
  it("каждый Component.serialize() создаёт новый instance id с растущим суффиксом", () => {
    const client = createClient();
    const page = new TestPage([]);
    const label = text("hello");

    const [first, second] = serializeInEntry(client, page, () => [
      label.serialize(),
      label.serialize(),
    ]);

    expect(first.id).toMatch(/-\d+$/);
    expect(second.id).toMatch(/-\d+$/);
    expect(first.id).not.toBe(second.id);
    expect(componentBaseId(first.id)).toBe(componentBaseId(second.id));
    expect(label.getInstances()).toHaveLength(2);
  });

  it("createInstance() до serialize не привязан к client и entry", () => {
    const client = createClient();
    const page = new TestPage([]);
    const label = text("tracked");

    const instance = serializeInEntry(client, page, () =>
      label.createInstance(),
    );

    expect(instance).toBeInstanceOf(ComponentInstance);
    expect(instance.component).toBe(label);
    expect(instance.client).toBeUndefined();
    expect(instance.entry).toBeUndefined();
    expect(instance.serialized).toBe(false);
    expect(hasComponentInstanceSuffix(instance.id)).toBe(true);
    expect(label.getInstances()).toHaveLength(1);
  });

  it("serialize закрепляет instance за client и entry", () => {
    const client = createClient();
    const label = text("bound");
    const page = new TestPage([label]);

    serializePage(client, page);
    const instance = label.getInstances({ client })[0];
    const pageInstance = page.getInstances({ client })[0];

    expect(instance.serialized).toBe(true);
    expect(instance.client).toBe(client);
    expect(instance.entry).toBe(pageInstance);
    expect(pageInstance.entry).toBeUndefined();
  });

  it("повторная serialize одного instance запрещена", () => {
    const client = createClient();
    const page = new TestPage([]);
    const label = text("once");

    serializeInEntry(client, page, () => label.serialize());
    const instance = label.getInstances({ client })[0];

    expect(() =>
      serializeInEntry(client, page, () => instance.serialize()),
    ).toThrow(INSTANCE_ALREADY_SERIALIZED);
    expect(() =>
      serializeInEntry(client, page, () => label.serialize(instance)),
    ).toThrow(INSTANCE_ALREADY_SERIALIZED);
  });

  it("ComponentInstance в дереве сериализуется один раз через instance.serialize()", () => {
    const client = createClient();
    const label = text("node");
    const page = new TestPage([]);

    const instance = serializeInEntry(client, page, () =>
      label.createInstance(),
    );
    serializePage(client, new TestPage([instance]));

    expect(instance.serialized).toBe(true);
    expect(instance.client).toBe(client);
    expect(instance.entry).toBeDefined();
  });
});

describe("Component instance: явная ссылка через createInstance", () => {
  it("createInstance() позволяет сравнивать instance в обработчике", () => {
    const client = createClient();
    const clicked: string[] = [];
    const btn = button(
      {
        onClick: ({ instance }) => {
          if (instance === first) clicked.push("first");
          if (instance === second) clicked.push("second");
        },
      },
      [text("click")],
    );

    const page = new TestPage([]);
    const first = serializeInEntry(client, page, () => btn.createInstance());
    const second = serializeInEntry(client, page, () => btn.createInstance());
    const pageWithButtons = new TestPage([first, second]);

    serializePage(client, pageWithButtons);

    sendComponentClick(client, first.id);
    sendComponentClick(client, second.id);

    expect(clicked).toEqual(["first", "second"]);
  });

  it("один ComponentInstance нельзя положить в дерево дважды", () => {
    const client = createClient();
    const page = new TestPage([]);
    const label = text("dup");
    const instance = serializeInEntry(client, page, () =>
      label.createInstance(),
    );
    const pageWithDuplicate = new TestPage([instance, instance]);

    expect(() => serializePage(client, pageWithDuplicate)).toThrow(
      INSTANCE_ALREADY_SERIALIZED,
    );
  });
});

describe("Component instance: несколько instance в одном client + entry", () => {
  it("один Component в двух местах страницы получает разные instance id", () => {
    const client = createClient();
    const label = text("duplicate");
    const page = new TestPage([label, label]);

    const serialized = serializePage(client, page);
    const configs = serialized.properties.content.filter(
      (config) => config.class === ServerComponentClass.Text,
    );

    expect(configs).toHaveLength(2);
    expect(configs[0].id).not.toBe(configs[1].id);
    expect(label.getInstances({ client, entry: page })).toHaveLength(2);
    expect(
      label.getInstances({ client, entry: page }).every((u) => u.serialized),
    ).toBe(true);
  });

  it("interaction с scope instance id попадает в handler нужного instance", () => {
    const client = createClient();
    const clicked: string[] = [];
    const btn = button(
      { onClick: ({ instance }) => clicked.push(instance.id) },
      [text("click")],
    );
    const page = new TestPage([btn, btn]);

    serializePage(client, page);
    const [firstInstance, secondInstance] = btn.getInstances({
      client,
      entry: page,
    });

    sendComponentClick(client, firstInstance.id);
    sendComponentClick(client, secondInstance.id);

    expect(clicked).toEqual([firstInstance.id, secondInstance.id]);
  });

  it("при снятии entry instance освобождаются дочерние instances без server-action", () => {
    const client = createClient();
    const label = text("child");
    const page = new TestPage([label]);

    serializePage(client, page);
    expect(label.getInstances({ client, entry: page })).toHaveLength(1);

    const pageInstance = page.getInstances({ client })[0];
    page.releaseInstances([pageInstance]);

    expect(page.getInstances({ client })).toHaveLength(0);
    expect(label.getInstances({ client, entry: page })).toHaveLength(0);
  });
});

describe("Component instance: несколько client", () => {
  it("один BFF-компонент на разных client получает изолированные instances", () => {
    const clientA = createClient();
    const clientB = createClient();
    const label = text("shared");
    const page = new TestPage([label]);

    serializePage(clientA, page);
    serializePage(clientB, page);

    const instancesA = label.getInstances({ client: clientA });
    const instancesB = label.getInstances({ client: clientB });

    expect(instancesA).toHaveLength(1);
    expect(instancesB).toHaveLength(1);
    expect(instancesA[0].id).not.toBe(instancesB[0].id);
    expect(instancesA[0].client).toBe(clientA);
    expect(instancesB[0].client).toBe(clientB);
    expect(instancesA[0].serialized).toBe(true);
    expect(instancesB[0].serialized).toBe(true);
  });

  it("interaction с чужого client не обрабатывается и пишет ошибку", () => {
    const clientA = createClient();
    const clientB = createClient();
    const clicked: string[] = [];
    const errors: unknown[] = [];
    const btn = button({ onClick: () => clicked.push("clicked") }, [
      text("btn"),
    ]);
    const page = new TestPage([btn]);

    serializePage(clientA, page);
    serializePage(clientB, page);

    const instanceOnB = btn.getInstances({ client: clientB })[0];

    clientA.error$.subscribe((error) => errors.push(error));

    sendComponentClick(clientA, instanceOnB.id);

    expect(clicked).toHaveLength(0);
    expect(errors).toContain(
      "Component interaction call, component are not using for this client",
    );
  });

  it("destroy client снимает только его instances", () => {
    const clientA = createClient();
    const clientB = createClient();
    const btn = button({ onClick: () => {} }, [text("multi-client")]);
    const page = new TestPage([btn]);

    serializePage(clientA, page);
    serializePage(clientB, page);

    clientA.destroy$.next();

    expect(btn.getInstances({ client: clientA })).toHaveLength(0);
    expect(btn.getInstances({ client: clientB })).toHaveLength(1);
  });
});

describe("Component instance: несколько entry", () => {
  it("один компонент в page и dialog получает instance на каждый entry", () => {
    const client = createClient();
    const shared = text("shared-entry");
    const page = new TestPage([shared]);
    const dlg = dialog([shared]);

    serializePage(client, page);
    runWithClient(client, () => dlg.serialize());

    expect(shared.getInstances({ client, entry: page })).toHaveLength(1);
    expect(shared.getInstances({ client, entry: dlg })).toHaveLength(1);
    expect(shared.getInstances({ client })).toHaveLength(2);
  });

  it("снятие page instance не затрагивает dialog instance того же компонента", () => {
    const client = createClient();
    const shared = text("entry-isolated");
    const page = new TestPage([shared]);
    const dlg = dialog([shared]);

    serializePage(client, page);
    runWithClient(client, () => dlg.serialize());

    const pageInstance = page.getInstances({ client })[0];
    page.releaseInstances([pageInstance]);

    expect(shared.getInstances({ client, entry: page })).toHaveLength(0);
    expect(shared.getInstances({ client, entry: dlg })).toHaveLength(1);
  });

  it("снятие одного dialog instance освобождает только его поддерево", () => {
    const client = createClient();
    const shared = text("shared-dialog");
    const dlg = dialog([shared]);

    runWithClient(client, () => dlg.serialize());
    runWithClient(client, () => dlg.serialize());

    const [firstDialogInstance, secondDialogInstance] = dlg.getInstances({
      client,
    });
    expect(shared.getInstances({ client })).toHaveLength(2);
    expect(
      shared
        .getInstances({ client })
        .every((instance) => instance.entry?.component === dlg),
    ).toBe(true);

    dlg.releaseInstances([firstDialogInstance]);

    expect(dlg.getInstances({ client })).toHaveLength(1);
    expect(dlg.getInstances({ client })[0]).toBe(secondDialogInstance);
    expect(shared.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })[0].entry).toBe(secondDialogInstance);
  });

  it("снятие одного popover instance освобождает только его поддерево", () => {
    const client = createClient();
    const shared = text("shared-popover");
    const pop = popover([shared]);

    runWithClient(client, () => pop.serialize());
    runWithClient(client, () => pop.serialize());

    const [firstPopoverInstance, secondPopoverInstance] = pop.getInstances({
      client,
    });
    expect(shared.getInstances({ client })).toHaveLength(2);

    pop.releaseInstances([firstPopoverInstance]);

    expect(pop.getInstances({ client })).toHaveLength(1);
    expect(pop.getInstances({ client })[0]).toBe(secondPopoverInstance);
    expect(shared.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })[0].entry).toBe(
      secondPopoverInstance,
    );
  });
});

describe("Component instance: навигация страницы", () => {
  it("switchPage снимает instances предыдущей страницы и её дочерних компонентов", () => {
    const client = createClient();
    const label = text("nav-child");
    const pageA = new TestPage([label]);
    const pageB = new TestPage([label]);

    serializePageWithSwitch(client, pageA);
    const firstLabelInstance = label.getInstances({ client })[0];
    expect(pageA.getInstances({ client })).toHaveLength(1);
    expect(label.getInstances({ client })).toHaveLength(1);

    serializePageWithSwitch(client, pageB);

    expect(pageA.getInstances({ client })).toHaveLength(0);
    expect(pageB.getInstances({ client })).toHaveLength(1);
    expect(label.getInstances({ client })).toHaveLength(1);
    expect(label.getInstances({ client })[0].id).not.toBe(
      firstLabelInstance.id,
    );
  });

  it("leave страницы вызывает onLeave, пока page instance ещё активен", () => {
    const client = createClient();
    const leaveEvents: string[] = [];

    class LeavePage extends Page {
      constructor(private readonly nodes: ComponentTreeNode[]) {
        super();
      }

      protected title(): string {
        return "Destroy";
      }

      protected content(): ComponentTreeNode[] {
        return this.nodes;
      }

      protected override onLeave() {
        return ({ instance }: { instance: ComponentInstance<Page> }) => {
          const stillTracked = this.getInstances({ client }).includes(
            instance as ComponentInstance<this>,
          );
          leaveEvents.push(`page:${stillTracked ? "tracked" : "released"}`);
        };
      }
    }

    const page = new LeavePage([text("nav-leave")]);
    serializePageWithSwitch(client, page);
    const [pageInstance] = page.getInstances({ client });
    sendComponentLeave(client, pageInstance.id);

    expect(leaveEvents).toEqual(["page:tracked"]);
  });
});

describe("Component instance: destroy-entry-instance", () => {
  it("сообщение клиента снимает dialog instance и его поддерево", () => {
    const client = createClient();
    const shared = text("dialog-destroy");
    const dlg = dialog([shared]);

    runWithClient(client, () => dlg.serialize());
    runWithClient(client, () => dlg.serialize());

    const [firstDialogInstance] = dlg.getInstances({ client });
    expect(shared.getInstances({ client })).toHaveLength(2);

    sendDestroyEntryInstance(client, firstDialogInstance.id);

    expect(dlg.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })[0].entry).toBe(
      dlg.getInstances({ client })[0],
    );
  });

  it("сообщение клиента снимает popover instance и его поддерево", () => {
    const client = createClient();
    const shared = text("popover-destroy");
    const pop = popover([shared]);

    runWithClient(client, () => pop.serialize());
    runWithClient(client, () => pop.serialize());

    const [firstPopoverInstance] = pop.getInstances({ client });
    expect(shared.getInstances({ client })).toHaveLength(2);

    sendDestroyEntryInstance(client, firstPopoverInstance.id);

    expect(pop.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })).toHaveLength(1);
    expect(shared.getInstances({ client })[0].entry).toBe(
      pop.getInstances({ client })[0],
    );
  });

  it("повторный destroy-entry-instance не снимает instance повторно", () => {
    const client = createClient();
    const dlg = dialog([text("dialog-cleanup")]);

    runWithClient(client, () => dlg.serialize());
    const [dialogInstance] = dlg.getInstances({ client });

    sendDestroyEntryInstance(client, dialogInstance.id);
    sendDestroyEntryInstance(client, dialogInstance.id);

    expect(dlg.getInstances({ client })).toHaveLength(0);
  });
});

describe("Component instance: ошибки interaction", () => {
  it("неизвестный scope пишет ошибку", () => {
    const client = createClient();
    const btn = button({ onClick: () => {} }, [text("x")]);
    const errors: unknown[] = [];

    serializePage(client, new TestPage([btn]));
    client.error$.subscribe((error) => errors.push(error));

    sendComponentClick(client, `${btn.id}-999`);

    expect(errors).toContain(
      "Component interaction call, component instance not found",
    );
  });

  it("клик по снятому instance пишет ошибку", () => {
    const client = createClient();
    const clicked: string[] = [];
    const btn = button({ onClick: () => clicked.push("clicked") }, [text("x")]);
    const errors: unknown[] = [];

    serializePageWithSwitch(client, new TestPage([btn]));
    const instance = btn.getInstances({ client })[0];

    serializePageWithSwitch(client, new TestPage([]));
    client.error$.subscribe((error) => errors.push(error));
    sendComponentClick(client, instance.id);

    expect(clicked).toHaveLength(0);
    expect(errors).toContain(
      "Component interaction call, component instance not found",
    );
  });

  it("hide по снятому instance пишет ошибку", () => {
    const client = createClient();
    const btn = button({ onHide: () => {} }, [text("x")]);
    const errors: unknown[] = [];

    serializePageWithSwitch(client, new TestPage([btn]));
    const instance = btn.getInstances({ client })[0];

    serializePageWithSwitch(client, new TestPage([]));
    client.error$.subscribe((error) => errors.push(error));
    sendComponentHide(client, instance.id);

    expect(errors).toContain(
      "Component interaction call, component instance not found",
    );
  });

  it("async onClick reject уходит в client.error$, а не в unhandledRejection", async () => {
    const client = createClient();
    const errors: unknown[] = [];
    const btn = button(
      {
        onClick: async () => {
          throw new Error("async click failed");
        },
      },
      [text("x")],
    );

    serializePage(client, new TestPage([btn]));
    client.error$.subscribe((error) => errors.push(error));

    sendComponentClick(client, btn.getInstances({ client })[0].id);

    await new Promise<void>((resolve) => setImmediate(resolve));

    expect(errors).toHaveLength(1);
    expect(errors[0]).toEqual(new Error("async click failed"));
  });
});

describe("Component instance: startUsing$ / stopUsing$", () => {
  it("startUsing$ при первом instance, stopUsing$ когда последний снят", () => {
    const client = createClient();
    const btn = button({ onClick: () => {} }, [text("lifecycle")]);
    let startCount = 0;
    let stopCount = 0;

    btn.startUsing$.subscribe(() => startCount++);
    btn.stopUsing$.subscribe(() => stopCount++);

    serializePageWithSwitch(client, new TestPage([btn]));
    expect(startCount).toBe(1);
    expect(stopCount).toBe(0);

    serializePageWithSwitch(client, new TestPage([]));
    expect(stopCount).toBe(1);
  });
});

describe("Component instance: entry lifecycle", () => {
  it("сериализует onEnter и onLeave entry в interactions", () => {
    const client = createClient();
    const lifecycleEvents: string[] = [];
    class LifecyclePage extends Page {
      protected title(): string {
        return "Lifecycle";
      }

      protected content(): ComponentTreeNode[] {
        return [];
      }

      protected override onEnter() {
        return () => {
          lifecycleEvents.push("enter");
        };
      }

      protected override onLeave() {
        return () => {
          lifecycleEvents.push("leave");
        };
      }
    }

    const page = new LifecyclePage();
    const pageConfig = serializePage(client, page);

    expect(pageConfig.interactions?.enter).toHaveLength(1);
    expect(pageConfig.interactions?.leave).toHaveLength(1);

    const [pageInstance] = page.getInstances({ client });
    sendComponentEnter(client, pageInstance.id);
    sendComponentLeave(client, pageInstance.id);

    expect(lifecycleEvents).toEqual(["enter", "leave"]);
  });

  it("выполняет conditions onLeave в контексте client instance", () => {
    const mobileClient = createClient();
    const desktopClient = createClient();
    setClientState(
      mobileClient,
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    );
    setClientState(
      desktopClient,
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)",
    );

    const leaveEvents: string[] = [];

    class ConditionalLeavePage extends Page {
      protected title(): string {
        return "Conditional";
      }

      protected content(): ComponentTreeNode[] {
        return [];
      }

      protected override onLeave() {
        return new ServerAction(
          () => {
            leaveEvents.push("mobile");
          },
          {
            conditions: [mobileDevice()],
          },
        );
      }
    }

    const mobilePage = new ConditionalLeavePage();
    serializePageWithSwitch(mobileClient, mobilePage);
    sendComponentLeave(
      mobileClient,
      mobilePage.getInstances({ client: mobileClient })[0].id,
    );

    const desktopPage = new ConditionalLeavePage();
    serializePageWithSwitch(desktopClient, desktopPage);
    sendComponentLeave(
      desktopClient,
      desktopPage.getInstances({ client: desktopClient })[0].id,
    );

    expect(leaveEvents).toEqual(["mobile"]);
  });
});

describe("Component instance: ForEach и несколько placement", () => {
  type Task = { id: string; title: string };

  async function createTaskContext(tasks: Task[]) {
    const context = new Context<{ tasks: Task[] }>({
      data: async () => ({ tasks }),
    });
    await context.init();
    return context;
  }

  it("два placement ForEach на странице дают разные instance id и разные child ids", async () => {
    const client = createClient();
    const context = await createTaskContext([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);

    const list = forEach({
      ref: context.ref("tasks"),
      track: (task) => task.id,
      preload: true,
      generator: () => button([text("task")]),
    });
    const page = new TestPage([list, list]);

    const serialized = serializePage(client, page);
    const forEachConfigs = forEachConfigsInPage(serialized);

    expect(forEachConfigs).toHaveLength(2);
    expect(forEachConfigs[0].id).not.toBe(forEachConfigs[1].id);
    expect(list.getInstances({ client, entry: page })).toHaveLength(2);
    expect(
      list.getInstances({ client, entry: page }).every((u) => u.serialized),
    ).toBe(true);

    const leftChildId = firstSlotLeafId(forEachConfigs[0]);
    const rightChildId = firstSlotLeafId(forEachConfigs[1]);
    expect(leftChildId).not.toBe(rightChildId);
  });

  it("снятие одного instance ForEach не ломает второй placement", async () => {
    const client = createClient();
    const context = await createTaskContext([{ id: "a", title: "A" }]);
    const rowButtons: Component[] = [];

    const list = forEach({
      ref: context.ref("tasks"),
      track: (task) => task.id,
      preload: true,
      generator: () => {
        const rowButton = button([text("row")]);
        rowButtons.push(rowButton as Component);
        return rowButton;
      },
    });
    const page = new TestPage([list, list]);

    serializePage(client, page);
    const [leftInstance, rightInstance] = list.getInstances({
      client,
      entry: page,
    });

    expect(rowButtons).toHaveLength(2);
    expect(rowButtons[0].getInstances({ client })).toHaveLength(1);
    expect(rowButtons[1].getInstances({ client })).toHaveLength(1);

    list.releaseInstances([leftInstance]);

    expect(list.getInstances({ client, entry: page })).toHaveLength(1);
    expect(list.getInstances({ client, entry: page })[0]).toBe(rightInstance);
    expect(rowButtons[0].getInstances({ client })).toHaveLength(0);
    expect(rowButtons[1].getInstances({ client })).toHaveLength(1);
  });

  it("show ForEach синхронизирует все активные instance (по сообщению на каждый placement)", async () => {
    const client = createClient();
    const context = await createTaskContext([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);

    const list = forEach({
      ref: context.ref("tasks"),
      track: (task) => task.id,
      preload: false,
      generator: () => button([text("task")]),
    });
    const page = new TestPage([list, list]);

    serializePage(client, page);
    const [leftInstance, rightInstance] = list.getInstances({
      client,
      entry: page,
    });

    const syncMessages: ForEachSyncComponentsMessage[] = [];
    client.outcomingMessage$.subscribe((message) => {
      if (message instanceof ForEachSyncComponentsMessage) {
        syncMessages.push(message);
      }
    });

    sendComponentShow(client, leftInstance.id);

    expect(syncMessages).toHaveLength(2);
    expect(new Set(syncMessages.map((message) => message.target))).toEqual(
      new Set([leftInstance.id, rightInstance.id]),
    );
  });

  it("повторный sync не накапливает instances дочерних компонентов", async () => {
    const client = createClient();
    const context = await createTaskContext([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);
    const rowButtons: Component[] = [];

    const list = forEach({
      ref: context.ref("tasks"),
      track: (task) => task.id,
      preload: false,
      generator: () => {
        const rowButton = button([text("task")]);
        rowButtons.push(rowButton as Component);
        return rowButton;
      },
    });
    const page = new TestPage([list]);

    serializePage(client, page);
    const forEachInstance = list.getInstances({ client, entry: page })[0];

    sendComponentShow(client, forEachInstance.id);

    expect(rowButtons).toHaveLength(2);
    expect(rowButtons[0].getInstances({ client })).toHaveLength(1);
    expect(rowButtons[1].getInstances({ client })).toHaveLength(1);

    context.data$!.next({
      tasks: [
        { id: "b", title: "B" },
        { id: "a", title: "A" },
      ],
    });

    expect(rowButtons[0].getInstances({ client })).toHaveLength(1);
    expect(rowButtons[1].getInstances({ client })).toHaveLength(1);
    expect(
      rowButtons.flatMap((rowButton) => rowButton.getInstances({ client })),
    ).toHaveLength(2);
  });
});
