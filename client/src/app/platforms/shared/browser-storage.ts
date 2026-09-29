import { fetchFromObject } from '@shared/utils/fetch-from-object';
import { objectSetValue } from '../../utils/object-set-value';

export class BrowserStorage {
  private _values: Record<string, string> = {};

  constructor() {}

  private save() {
    localStorage.setItem('storage', JSON.stringify(this._values));
  }

  setItem(key: string, value: string) {
    objectSetValue(this._values, key, value);
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
