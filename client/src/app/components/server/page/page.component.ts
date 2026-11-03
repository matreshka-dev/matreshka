import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import type { PageConfig } from '@matreshka/client-bff-protocol/types/page-config';
import { findContextKeys } from '@matreshka/shared/utils/find-context-keys';
import { filter, takeUntil } from 'rxjs';
import { SsrService } from '../../../services/ssr.service';
import { RESPONSE } from '../../../tokens/response';
import {
  contextChangeAffectsRef,
  type ContextChangePayload,
} from '../../../utils/collect-context-ref-dependencies';
import { EntryServerComponent } from '../entry-server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';
import { readWindowVerticalScrollPayload } from '../utils/subscribe-throttled-scroll-report';

@Component({
  selector: 'app-page',
  imports: [ServerComponentsListComponent],
  templateUrl: './page.component.html',
  styleUrl: './page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'page stack surface' },
})
export class PageComponent
  extends EntryServerComponent<PageConfig>
  implements OnInit
{
  title = inject(Title);
  response = inject(RESPONSE, { optional: true });
  ssr = inject(SsrService);
  loadingTask = this.ssr.addTask();

  constructor() {
    super();
    effect(() => {
      this._configSignal();
      this.applyDocumentTitle();
    });
  }

  override ngOnInit() {
    super.ngOnInit();
    if (!isPlatformServer(this.platformId)) {
      this.subscribeThrottledScrollReporting(
        () => {
          if (!this.hasServerInteraction('scroll')) {
            return null;
          }
          return readWindowVerticalScrollPayload(
            window,
            this.document.documentElement,
          );
        },
        window,
        this.document.documentElement,
      );
    }

    if (
      isPlatformServer(this.platformId) &&
      this.config.properties.statusCode
    ) {
      this.response?.status(this.config.properties.statusCode);
    }
    const entryId = this.componentHub.getEntryId(this.id());
    if (entryId) {
      this.contextHub.change$
        .pipe(
          filter((payload) => this.titleContextChangeAffects(payload)),
          takeUntil(this.componentHub.entryDestroy$(entryId)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.applyDocumentTitle());
    }
  }

  private applyDocumentTitle(): void {
    const rawTitle = this._configSignal()?.properties?.title;
    if (!rawTitle) {
      return;
    }
    this.title.setTitle(this.contextHub.replacePlaceholders(rawTitle));
  }

  private titleContextChangeAffects(payload: ContextChangePayload): boolean {
    const rawTitle = this._configSignal()?.properties?.title;
    if (!rawTitle) {
      return false;
    }
    const placeholders = findContextKeys(rawTitle);
    if (!placeholders.length) {
      return false;
    }
    return placeholders.some((key) =>
      contextChangeAffectsRef(payload, key, (path) =>
        this.contextHub.replacePlaceholders(path),
      ),
    );
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Работает, но не всегда
    this.ssr.cleanupTask(this.loadingTask); // Нужно создать и завершить задачу чтобы отключить соединение к сокету если других задач не будет
  }
}
