import { TestBed } from '@angular/core/testing';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { ContextInitMessage as BffToClientContextInitMessage } from '@shared/messages/bff-to-client/context/context-init-message';
import { firstValueFrom } from 'rxjs';
import { beforeEach, vi } from 'vitest';
import { ComponentDependencies } from '../../components/server/server-component-config';
import { SERVER_COMPONENTS } from '../../components/server/server-components-injection-token';
import { ComponentHubService } from '../component-hub.service';
import { ContextHubService } from '../context-hub.service';
import { PostmanService } from '../postman.service';
import { SsrService } from '../ssr.service';
import { TestPostmanService } from '../tests/test-postman.service';
import { TestSsrService } from '../tests/test-ssr.service';

export function hubConfigEntry(service: ComponentHubService, configId: string) {
  return (
    service as unknown as { store: { getEntry: (id: string) => any } }
  ).store.getEntry(configId);
}

export type ComponentHubTestEnv = {
  service: ComponentHubService;
  contextHub: ContextHubService;
  postman: TestPostmanService;
  mockServerComponents: Record<string, { dependencies: ComponentDependencies }>;
  initContext: (
    contextId: string,
    values?: Record<string, unknown>,
  ) => Promise<void>;
};

export function useComponentHubTestEnv(): ComponentHubTestEnv {
  const env = {} as ComponentHubTestEnv;

  beforeEach(() => {
    const defaultDependencies: ComponentDependencies = {
      pathsWithPlaceholdersInTemplate: [],
      pathsWithPlaceholdersInCode: [],
      requiredContextsPaths: [],
      getNestedConfigsPaths: vi.fn(() => []),
    };

    env.mockServerComponents = {
      [ServerComponentClass.UnitTest]: { dependencies: defaultDependencies },
      [ServerComponentClass.TextInput]: {
        dependencies: {
          ...defaultDependencies,
          pathsWithPlaceholdersInTemplate: [],
          pathsWithPlaceholdersInCode: ['ref'],
          requiredContextsPaths: ['ref'],
          getNestedConfigsPaths: vi.fn(() => []),
        },
      },
      [ServerComponentClass.Text]: {
        dependencies: {
          ...defaultDependencies,
          pathsWithPlaceholdersInTemplate: ['link.value'],
          pathsWithPlaceholdersInCode: ['ref'],
          requiredContextsPaths: ['ref'],
          getNestedConfigsPaths: vi.fn(() => []),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        ComponentHubService,
        ContextHubService,
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
          useValue: env.mockServerComponents,
        },
      ],
    });

    env.service = TestBed.inject(ComponentHubService);
    env.contextHub = TestBed.inject(ContextHubService);
    env.postman = TestBed.inject(
      PostmanService,
    ) as unknown as TestPostmanService;

    env.initContext = async (
      contextId: string,
      values: Record<string, unknown> = {},
    ) => {
      const init$ = env.contextHub.init$(contextId);
      env.postman.incomingMessage$.next(
        new BffToClientContextInitMessage(contextId, values),
      );
      await firstValueFrom(init$);
    };
  });

  return env;
}
