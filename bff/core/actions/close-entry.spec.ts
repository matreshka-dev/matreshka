import { describe, expect, it } from "vitest";
import { button, text } from "../../components";
import { dialog } from "../../components/dialog";
import { Client, runWithClient } from "../index";
import { closeEntry } from "./close-entry";

function createClient(): Client {
  return new Client();
}

describe("close entry local action", () => {
  it("closeEntry вне entry-контекста сериализует базовый id", () => {
    const dlg = dialog({ content: [] });
    const action = closeEntry(dlg);
    expect(action.toJSON()).toEqual({
      class: "close-entry",
      payload: { target: dlg.id },
    });
  });

  it("dialog.local.close в дереве сериализует instance id entry", () => {
    const client = createClient();
    const dlg = dialog({
      content: [
        () => button({ onClick: dlg.local.close() }, [text("Закрыть")]),
      ],
    });
    const config = runWithClient(client, () => dlg.serialize());
    const buttonConfig = config.properties.content[0];
    expect(buttonConfig.interactions?.click?.[0]).toEqual({
      class: "close-entry",
      payload: { target: `${dlg.id}-0` },
    });
  });
});
