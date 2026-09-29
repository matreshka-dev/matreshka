import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import type { PageConfig } from '@shared/types/page-config';
import { from, map, switchMap, take, timer } from 'rxjs';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ServerComponentWrapperComponent } from '../../server/server-component-wrapper/server-component-wrapper.component';

@Component({
  selector: 'app-router',
  imports: [ServerComponentWrapperComponent],
  templateUrl: './router.component.html',
  styleUrl: './router.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'router',
  },
})
export class RouterComponent implements OnInit {
  destroyRef = inject(DestroyRef);
  route = inject(ActivatedRoute);
  page = signal<PageConfig | undefined>(undefined);
  componentHub = inject(ComponentHubService);
  private registeredPage?: PageConfig;

  ngOnInit() {
    this.route.data
      .pipe(
        map((res) => res['page']),
        switchMap((page: PageConfig) => {
          return from(this.runRegisteredPageLeave()).pipe(
            switchMap(() => {
              if (this.registeredPage) {
                this.componentHub.beginEntryDestroy(this.registeredPage.id);
              }
              // Сначала снимаем страницу с рендера и ждем следующий тик,
              // чтобы Angular успел уничтожить текущий инстанс PageComponent.
              this.page.set(undefined);

              return timer(0).pipe(
                switchMap(() => {
                  if (this.registeredPage) {
                    this.componentHub.endEntryDestroy(this.registeredPage.id);
                    this.componentHub.deleteConfig(this.registeredPage);
                  }

                  this.registeredPage = page;
                  this.componentHub.registerConfig(page);
                  this.componentHub.setActivePageEntryId(page.id);

                  return this.componentHub.ready$(page).pipe(
                    take(1),
                    map(() => page),
                  );
                }),
              );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.page.set(page);
      });
  }

  private runRegisteredPageLeave(): Promise<unknown> {
    if (!this.registeredPage) {
      return Promise.resolve();
    }
    const pageInstance = this.componentHub.getInstances(
      this.registeredPage.id,
    )[0];
    const entryLeave = pageInstance
      ? pageInstance.triggerLifecycle('leave')
      : Promise.resolve([]);

    return Promise.all([
      entryLeave,
      this.componentHub.animateSubtree(this.registeredPage.id, 'hide', {
        skipRoot: true,
      }),
    ]);
  }
}
