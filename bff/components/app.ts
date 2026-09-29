import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { EntryComponent } from "./entry-component";

// Класс-заглушка: entry-корень для глобальных App-оверлеев.
export class App extends EntryComponent {
  class() {
    return ServerComponentClass.App;
  }
}
