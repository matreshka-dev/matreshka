import { filter, firstValueFrom } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

export function waitForPopupDestroyed(
  popupService: PopupService,
  componentId: string,
): Promise<void> {
  return firstValueFrom(
    popupService.destroyed$.pipe(filter((id) => id === componentId)),
  ).then(() => undefined);
}
