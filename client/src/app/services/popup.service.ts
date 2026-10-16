import { DOCUMENT, isPlatformServer } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
  PLATFORM_ID,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { DialogShowMessage } from '@shared/messages/bff-to-client/components/dialog/dialog-show-message';
import { PopoverShowMessage } from '@shared/messages/bff-to-client/components/popover/popover-show-message';
import type { DialogConfig } from '@shared/types/dialog-config';
import type { PopoverConfig } from '@shared/types/popover-config';
import { Subject, take } from 'rxjs';
import { ServerComponent } from '../components/server/server-component';
import { ServerComponentWrapperComponent } from '../components/server/server-component-wrapper/server-component-wrapper.component';
import { ComponentHubService } from './component-hub.service';
import { PostmanService } from './postman.service';

@Injectable({
  providedIn: 'root',
})
export class PopupService {
  private router = inject(Router);
  private dialogStack: string[] = [];
  private popoverStack: string[] = [];
  /** BFF-экземпляр якоря; DOM — {@link ServerComponent.renderRoot}. */
  private popoverAnchorInstances = new Map<string, ServerComponent<any>>();
  private platformId = inject(PLATFORM_ID);
  private componentHub = inject(ComponentHubService);
  private postman = inject(PostmanService);
  private appRef = inject(ApplicationRef);
  private envInjector = inject(EnvironmentInjector);
  private document = inject(DOCUMENT);
  close$ = new Subject<string>(); // parameter: component id
  readonly readyForDestroy$ = new Subject<string>();
  readonly destroyed$ = new Subject<string>();
  constructor() {
    this.postman.incomingMessage$.subscribe((message) => {
      if (message instanceof PopoverShowMessage) {
        const instances = this.componentHub.getInstancesByComponentId(
          message.payload.component_id,
        );
        for (const instance of instances) {
          this.showPopover({
            anchor: instance,
            config: message.payload.popover,
          });
        }
      } else if (message instanceof DialogShowMessage) {
        this.showDialog(message.payload);
      }
    });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.closeAllPopovers();
        this.closeAllDialogs();
      }
    });
  }

  /** {@link ServerComponent.renderRoot} якоря (source, clamp, light dismiss). */
  getPopoverAnchor(popoverConfigId: string): HTMLElement | undefined {
    return this.popoverAnchorInstances.get(popoverConfigId)?.renderRoot();
  }

  isTopPopover(id: string): boolean {
    return this.popoverStack.at(-1) === id;
  }

  /**
   * Popover в `body` под модальным `<dialog>` виден, но inert — клики не доходят.
   * Вкладываем popover в открытый modal dialog, чтобы он оставался интерактивным.
   */
  private getPopoverMountParent(): HTMLElement {
    const topDialogId = this.dialogStack.at(-1);
    if (!topDialogId) {
      return this.document.body;
    }
    const instances = this.componentHub.getInstances(topDialogId);
    const dialogHost = instances[0]?.elementRef.nativeElement;
    if (!dialogHost) {
      return this.document.body;
    }
    const nativeDialog = dialogHost.querySelector('dialog');
    if (
      nativeDialog instanceof HTMLDialogElement &&
      nativeDialog.matches(':modal')
    ) {
      return nativeDialog;
    }
    return this.document.body;
  }

  private closeAllDialogs(): void {
    [...this.dialogStack].reverse().forEach((id) => {
      this.close$.next(id);
    });
  }

  private closeAllPopovers(): void {
    const topFirst = [...this.popoverStack].reverse();
    for (const id of topFirst) {
      this.close$.next(id);
    }
  }

  private destroyEntryRef(
    configId: string,
    ref: ComponentRef<ServerComponentWrapperComponent>,
    cleanup: () => void,
  ): void {
    this.componentHub.beginEntryDestroy(configId);
    try {
      cleanup();
      this.appRef.detachView(ref.hostView);
      ref.destroy();
    } finally {
      this.componentHub.endEntryDestroy(configId);
    }
  }

  showDialog(config: DialogConfig) {
    this.componentHub.registerConfig(config);
    this.componentHub
      //.readySubtree$(config)
      .ready$(config)
      .pipe(take(1))
      .subscribe(() => {
        if (isPlatformServer(this.platformId)) {
          return;
        }
        const ref = createComponent(ServerComponentWrapperComponent, {
          environmentInjector: this.envInjector,
        });
        ref.setInput('id', config.id);
        this.appRef.attachView(ref.hostView);
        this.document.body.appendChild(ref.location.nativeElement);
        this.dialogStack.push(config.id);
        ref.changeDetectorRef.detectChanges();
        this.readyForDestroy$.subscribe((id) => {
          if (id === config.id) {
            this.destroyEntryRef(config.id, ref, () => {
              this.dialogStack = this.dialogStack.filter(
                (x) => x !== config.id,
              );
            });
            this.destroyed$.next(config.id);
          }
        });
      });
  }

  showPopover(properties: {
    anchor: ServerComponent<any>;
    config: PopoverConfig;
  }) {
    const { anchor, config } = properties;

    const showPopover = () => {
      this.popoverAnchorInstances.set(config.id, anchor);
      this.componentHub.registerConfig(config);
      this.componentHub
        .ready$(config)
        .pipe(take(1))
        .subscribe(() => {
          if (isPlatformServer(this.platformId)) {
            this.popoverAnchorInstances.delete(config.id);
            return;
          }
          const ref = createComponent(ServerComponentWrapperComponent, {
            environmentInjector: this.envInjector,
          });
          ref.setInput('id', config.id);
          this.appRef.attachView(ref.hostView);
          this.getPopoverMountParent().appendChild(ref.location.nativeElement);
          ref.changeDetectorRef.detectChanges();
          this.popoverStack.push(config.id);
          this.readyForDestroy$.subscribe((id) => {
            if (id === config.id) {
              this.destroyEntryRef(config.id, ref, () => {
                this.popoverAnchorInstances.delete(config.id);
                this.popoverStack = this.popoverStack.filter(
                  (x) => x !== config.id,
                );
              });
              this.destroyed$.next(config.id);
            }
          });
        });
    };

    const activePopoverId = this.findOpenPopoverIdForAnchor(anchor);
    if (activePopoverId) {
      // Есть активный popover, нужно его закрыть с анимацией, а уже после отобразить новый (иначе потеряется якорь и сломается анимация)
      this.close$.next(activePopoverId);
      this.destroyed$.subscribe((id) => {
        if (id === activePopoverId) {
          showPopover();
        }
      });
    } else {
      showPopover();
    }
  }

  private findOpenPopoverIdForAnchor(
    anchor: ServerComponent<any>,
  ): string | undefined {
    for (let i = this.popoverStack.length - 1; i >= 0; i--) {
      const id = this.popoverStack[i];
      if (this.popoverAnchorInstances.get(id) === anchor) {
        return id;
      }
    }
    return undefined;
  }

  closeActivePopup() {
    if (this.popoverStack.length > 0) {
      const topId = this.popoverStack[this.popoverStack.length - 1];
      this.close$.next(topId);
    }
  }
}
