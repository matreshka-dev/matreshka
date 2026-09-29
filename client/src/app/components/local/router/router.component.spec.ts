import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import type { PageConfig } from '@shared/types/page-config';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentHubService } from '../../../services/component-hub.service';
import type { ComponentDependencies } from '../../server/server-component-config';
import { SERVER_COMPONENTS } from '../../server/server-components-injection-token';
import { RouterComponent } from './router.component';

@Component({
  selector: 'app-test-page-root',
  standalone: true,
  template: '',
})
class TestPageRootComponent {
  id = input.required<string>();
}

describe('RouterComponent', () => {
  let routeData$: BehaviorSubject<{ page: PageConfig }>;
  let componentHub: ComponentHubService;

  async function flushNavigationQueue(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await new Promise((resolve) => setTimeout(resolve));
  }

  const defaultDependencies: ComponentDependencies = {
    pathsWithPlaceholdersInTemplate: [],
    pathsWithPlaceholdersInCode: [],
    requiredContextsPaths: [],
    getNestedConfigsPaths: vi.fn(
      (config: PageConfig) => config.properties.content,
    ),
  };

  function createPageConfig(id: string): PageConfig {
    return {
      id,
      class: ServerComponentClass.Page,
      properties: {
        title: id,
        content: [],
        overlays: [],
        statusCode: 200,
      },
    };
  }

  beforeEach(() => {
    routeData$ = new BehaviorSubject({ page: createPageConfig('page-a') });

    TestBed.configureTestingModule({
      imports: [RouterComponent],
      providers: [
        provideRouter([]),
        ComponentHubService,
        {
          provide: ActivatedRoute,
          useValue: {
            data: routeData$.asObservable(),
          },
        },
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.Page]: {
              component: TestPageRootComponent,
              dependencies: defaultDependencies,
            },
          },
        },
      ],
    });

    componentHub = TestBed.inject(ComponentHubService);
  });

  it('оборачивает смену страницы в begin/end entry destroy', async () => {
    const beginSpy = vi.spyOn(componentHub, 'beginEntryDestroy');
    const endSpy = vi.spyOn(componentHub, 'endEntryDestroy');
    const deleteSpy = vi.spyOn(componentHub, 'deleteConfig');
    const setActiveSpy = vi.spyOn(componentHub, 'setActivePageEntryId');

    const fixture = TestBed.createComponent(RouterComponent);
    fixture.detectChanges();
    await flushNavigationQueue();
    fixture.detectChanges();

    routeData$.next({ page: createPageConfig('page-b') });
    await flushNavigationQueue();
    fixture.detectChanges();

    expect(beginSpy).toHaveBeenCalledWith('page-a');
    expect(endSpy).toHaveBeenCalledWith('page-a');
    expect(deleteSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'page-a' }),
    );
    expect(setActiveSpy).toHaveBeenCalledWith('page-b');
  });
});
