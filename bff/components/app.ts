import { ServerComponentClass } from "@matreshka/client-bff-protocol/enums/server-component-class";
import { EntryComponent } from "./entry-component";

// Класс-заглушка: entry-корень для глобальных App-оверлеев.
export class App extends EntryComponent {
  class() {
    return ServerComponentClass.App;
  }
}
