import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnInit,
  PLATFORM_ID,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { DialogConfig } from '@shared/types/dialog-config';
import { OverlaysComponent } from '../../local/overlays/overlays.component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

import { DialogCloseMessage } from '@shared/messages/bff-to-client/components/dialog/dialog-close-message';
import { AppDestroyEntryInstanceMessage } from '@shared/messages/client-to-bff/app';
import { OverlayAnchor } from '@shared/types/container-overlay';
import type { ServerComponentInteraction } from '@shared/types/server-component-interaction';
import { filter } from 'rxjs';
import { PopupService } from '../../../services/popup.service';
import { rem } from '../../../utils/rem';
import { EntryServerComponent } from '../entry-server-component';
import {
  runComponentAnimations,
  type ComponentAnimationPayload,
} from '../utils/run-component-animations';

@Component({
  selector: 'app-dialog',
  imports: [ServerComponentsListComponent, OverlaysComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DialogComponent
  extends EntryServerComponent<DialogConfig>
  implements OnInit, AfterViewInit
{
  private readonly popupService = inject(PopupService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly nativeDialogRef =
    viewChild.required<ElementRef<HTMLDialogElement>>('nativeDialog');

  /** Цель onEnter/onLeave с translateX/translateY — см. dialog.component.html. */
  private readonly animationSurfaceRef =
    viewChild.required<ElementRef<HTMLElement>>('animationSurface');

  private readonly defaultAnchors: readonly OverlayAnchor[] = [
    OverlayAnchor.Center,
    OverlayAnchor.Middle,
  ];

  ariaModal(): 'true' | 'false' {
    return this.config.properties?.modal !== false ? 'true' : 'false';
  }

  anchorFlags(): {
    top: boolean;
    bottom: boolean;
    middle: boolean;
    start: boolean;
    end: boolean;
    center: boolean;
  } {
    const anchors =
      this.config?.properties?.anchors?.slice?.() ?? this.defaultAnchors;
    const has = (a: OverlayAnchor) => anchors.includes(a);

    const top = has(OverlayAnchor.Top);
    const bottom = has(OverlayAnchor.Bottom);
    const start = has(OverlayAnchor.Start);
    const end = has(OverlayAnchor.End);

    // middle/center теряют смысл только если заданы ОБА краевых якоря по оси.
    const middle = !(top && bottom) && has(OverlayAnchor.Middle);
    const center = !(start && end) && has(OverlayAnchor.Center);

    return { top, bottom, middle, start, end, center };
  }

  override ngOnInit() {
    super.ngOnInit();
    this.openNativeDialog();
    this.componentCommandMessages$
      .pipe(
        filter(
          (message): message is DialogCloseMessage =>
            message instanceof DialogCloseMessage,
        ),
      )
      .subscribe(() => {
        this.popupService.close$.next(this.id());
      });
  }

  override ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) {
      super.ngAfterViewInit();
      return;
    }
    const el = this.nativeDialogRef().nativeElement;

    // Escape: без preventDefault браузер закрывает <dialog> сразу и backdrop исчезает
    // до окончания hide-анимации (в отличие от клика по backdrop).
    el.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.popupService.close$.next(this.id());
    });

    this.popupService.close$
      .pipe(
        filter((id) => id === this.id()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (!isPlatformBrowser(this.platformId)) {
          return;
        }
        this.componentHub.destroyEntry(this.id());
        Promise.all([
          this.triggerLifecycle('leave'),
          this.componentHub.animateSubtree(this.id(), 'hide', {
            skipRoot: true,
          }),
        ]).then(() => {
          this.popupService.readyForDestroy$.next(this.id());
        });
      });

    // showModal/show поднимает <dialog> в top layer; enter/leave — на animationSurface, не на хосте app-dialog.
    super.ngAfterViewInit();
  }

  override animationElement(): HTMLElement {
    return this.animationSurfaceRef().nativeElement;
  }

  override triggerLifecycle(
    type: 'show' | 'hide' | 'enter' | 'leave',
  ): Promise<Animation[]> {
    const animations = super.triggerLifecycle(type);
    if (type !== 'enter' && type !== 'leave') {
      return animations;
    }
    if (this.config.properties?.modal === false) {
      return animations;
    }
    const backdropAnimations = this.animateDialogBackdrop(type);
    return Promise.all([animations, backdropAnimations]).then(
      ([dialog, backdrop]) => [...dialog, ...backdrop],
    );
  }

  private animateDialogBackdrop(type: 'enter' | 'leave'): Promise<Animation[]> {
    const key = type === 'enter' ? 'onEnter' : 'onLeave';
    const interactions = this.config.properties?.backdrop?.[key];
    if (!interactions?.length) {
      return Promise.resolve([]);
    }

    const payloads: ComponentAnimationPayload[] = [];
    for (const interaction of interactions) {
      if (
        interaction.class !== 'animate-component' ||
        !this.interactionConditionsMetForBackdrop(interaction)
      ) {
        continue;
      }
      payloads.push(interaction.payload as ComponentAnimationPayload);
    }
    if (payloads.length === 0) {
      return Promise.resolve([]);
    }

    // ::backdrop — псевдоэлемент <dialog>, не animationSurface.
    return runComponentAnimations(
      this.nativeDialogRef().nativeElement,
      payloads,
      type === 'enter' ? 'show' : 'hide',
      { pseudoElement: '::backdrop' },
    );
  }

  private interactionConditionsMetForBackdrop(
    interaction: ServerComponentInteraction,
  ): boolean {
    if (!interaction.conditions?.length) {
      return true;
    }
    return this.componentHub.conditionsMet(interaction.conditions);
  }

  private openNativeDialog(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const el = this.nativeDialogRef().nativeElement;
    const modal = this.config.properties?.modal !== false;
    if (modal) {
      el.showModal();
    } else {
      el.show();
    }
  }

  /** Закрытие по клику на подложку (::backdrop — клик как по самому dialog). */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.popupService.close$.next(this.id());
    }
  }

  override calculateStyles() {
    const fontStyles = this.calculateFontStyles();
    if (this.config.properties?.size) {
      const value = this.config.properties.size;
      if (typeof value === 'number' && value > 1) {
        this.componentStyles = {
          width: rem(value),
          'min-width': rem(value),
          ...fontStyles,
        };
      } else if (typeof value === 'number') {
        this.componentStyles = {
          width: value * 100 + 'vw',
          ...fontStyles,
        };
      } else {
        this.componentStyles = {
          ...fontStyles,
        };
      }
    } else {
      this.componentStyles = {
        ...fontStyles,
      };
    }
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.componentHub.deleteConfig(this.config);
    this.postman.outcomingMessage$.next(
      new AppDestroyEntryInstanceMessage({ id: this.id() }),
    );
  }
}
