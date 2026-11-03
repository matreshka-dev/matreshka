import { fetchFromObject } from '@matreshka/shared/utils/fetch-from-object';
import { setObjectProperty } from '@matreshka/shared/utils/set-object-property';

export class BrowserStorage {
  private _values: Record<string, string> = {};

  constructor() {}

  private save() {
    localStorage.setItem('storage', JSON.stringify(this._values));
  }

  setItem(key: string, value: string) {
    setObjectProperty(this._values, key, value);
    this.save();
  }

  values(): Readonly<Record<string, string>> {
    return this._values;
  }

  getItem(key: string) {
    return fetchFromObject(this.values(), key);
  }

  boot(): Promise<void> {
    const serializedValues = localStorage.getItem('storage');
    this._values = serializedValues ? JSON.parse(serializedValues) : {};
    return Promise.resolve();
  }
}
