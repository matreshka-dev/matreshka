import { AppPageMessage } from "@matreshka/shared/messages/bff-to-client/app/index";
import { ClientState } from "@matreshka/shared/types/client-state";
import { pairwise } from "rxjs";
import { Client, Matreshka, runWithClient } from "../core";
import { Page } from "./page";

export const bootServerComponents = (matreshka: Matreshka) => {
  const sendRoutePage = async (client: Client) => {
    try {
      const page = (await matreshka.router.findByRoute(
        client,
        client.state$.getValue().route.path,
      )) as Page | undefined;
      if (page) {
        await page.boot();
        runWithClient(client, () => {
          const serializedPage = page.serialize();
          const pageInstance = page
            .getInstances({ client })
            .find((instance) => instance.id === serializedPage.id)!;
          client.switchPage(pageInstance);
          client.outcomingMessage$.next(new AppPageMessage(serializedPage));
        });
      }
    } catch (e) {
      client.error$.next(e);
    }
  };

  matreshka.clientConnect$.subscribe((client) => {
    client.state$
      .pipe(pairwise<ClientState>())
      .subscribe(([prevState, state]) => {
        if (
          !prevState ||
          state.route.visitedAt !== prevState.route.visitedAt // Проверка времени посещения вместо пути, потому что по одному пути может быть несколько страниц
        ) {
          void sendRoutePage(client);
        }
      });
  });
};
