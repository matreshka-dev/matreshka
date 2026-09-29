import { inject, Pipe, PipeTransform } from '@angular/core';
import { ContextHubService } from '../services/context-hub.service';
import { prepareText } from '../utils/prepare-text';

@Pipe({
  name: 'prepare',
  pure: false,
})
export class PreparePipe implements PipeTransform {
  contextHub = inject(ContextHubService);
  cachedValue?: string;
  transform(valueBefore: string | number | undefined): string {
    if (this.cachedValue && this.cachedValue === valueBefore) {
      // Значение не изменилось, поэтому можно вернуть кэшированное значение
      return this.cachedValue;
    }
    const valueAfter = prepareText(valueBefore, this.contextHub);
    if (valueAfter === valueBefore) {
      // В строке нет плейсхолдеров, поэтому можно кэшировать
      this.cachedValue = valueAfter;
    }
    return valueAfter;
  }
}
