import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import type { PageConfig } from '@shared/types/page-config';
import { SsrService } from '../../../services/ssr.service';
import { RESPONSE } from '../../../tokens/response';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

import { isPlatformServer } from '@angular/common';
import { EntryServerComponent } from '../entry-server-component';
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
  platformId = inject(PLATFORM_ID);
  ssr = inject(SsrService);
  loadingTask = this.ssr.addTask();
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
    if (this.config.properties.title) {
      this.title.setTitle(
        this.contextHub.replacePlaceholders(this.config.properties.title),
      );
    }
  }

  override ngAfterViewInit() {
    super.ngAfterViewInit();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Работает, но не всегда
    this.ssr.cleanupTask(this.loadingTask); // Нужно создать и завершить задачу чтобы отключить соединение к сокету если других задач не будет
  }
}
