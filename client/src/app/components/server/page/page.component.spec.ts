import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ContextInitMessage as BffToClientContextInitMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/context/context-init-message';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { ServerComponentClass } from '@matreshka/client-bff-protocol/enums/server-component-class';
import type { PageConfig } from '@matreshka/client-bff-protocol/types/page-config';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { PageDependencies } from './page-config';
import { PageComponent } from './page.component';

describe('PageComponent', () => {
  let fixture: ComponentFixture<PageComponent>;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;
  let title: Title;
  const configId = 'page-title-test';

  async function initContext(
    contextId: string,
    values: Record<string, unknown> = {},
  ) {
    const init$ = contextHub.init$(contextId);
    postman.incomingMessage$.next(
      new BffToClientContextInitMessage(contextId, values),
    );
    await firstValueFrom(init$);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageComponent],
      providers: [
        ComponentHubService,
        ContextHubService,
        Title,
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        {
          provide: SsrService,
          useClass: TestSsrService,
        },
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.Page]: {
              component: PageComponent,
              dependencies: PageDependencies,
            },
          },
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
      ],
    });

    contextHub = TestBed.inject(ContextHubService);
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
    title = TestBed.inject(Title);

    const config: PageConfig = {
      id: configId,
      class: ServerComponentClass.Page,
      properties: {
        title: 'Hello @{ctx-user.name}',
        content: [],
        overlays: [],
        statusCode: 200,
      },
    };

    TestBed.inject(ComponentHubService).registerConfig(config);

    fixture = TestBed.createComponent(PageComponent);
    fixture.componentRef.setInput('id', configId);
    fixture.detectChanges();
  });

  it('обновляет document title при изменении контекста в плейсхолдере', async () => {
    await initContext('ctx-user', { name: 'John' });
    expect(title.getTitle()).toBe('Hello John');

    contextHub.setValues('ctx-user', [{ key: 'name', value: 'Alice' }]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(title.getTitle()).toBe('Hello Alice');
  });
});
