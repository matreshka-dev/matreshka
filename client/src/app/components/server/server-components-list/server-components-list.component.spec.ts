import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import { ConditionType } from '@shared/enums/condition-type';
import {
  ContextInitMessage as BffContextInitMessage,
  ContextValuesMessage as BffContextValuesMessage,
} from '@shared/messages/bff-to-client/context';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../server-component-config';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { ServerComponentsListComponent } from './server-components-list.component';

describe('ServerComponentsListComponent', () => {
  let fixture: ComponentFixture<ServerComponentsListComponent>;
  let list: ServerComponentsListComponent;
  let componentHub: ComponentHubService;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;

  const entryId = 'entry-list-conditions';
  const contextId = 'ctx-list-conditions';

  const defaultDependencies: ComponentDependencies = {
    pathsWithPlaceholdersInTemplate: [],
    pathsWithPlaceholdersInCode: [],
    requiredContextsPaths: [],
    getNestedConfigsPaths: vi.fn(() => []),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ServerComponentsListComponent],
      providers: [
        ComponentHubService,
        ContextHubService,
        EnvironmentService,
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
            [ServerComponentClass.UnitTest]: {
              dependencies: defaultDependencies,
            },
          },
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
      ],
    });

    componentHub = TestBed.inject(ComponentHubService);
    contextHub = TestBed.inject(ContextHubService);
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;

    componentHub.registerConfig({
      id: entryId,
      class: ServerComponentClass.UnitTest,
    });

    fixture = TestBed.createComponent(ServerComponentsListComponent);
    list = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  function initContext(status: string | undefined): void {
    contextHub.init$(contextId).subscribe();
    postman.incomingMessage$.next(
      new BffContextInitMessage(contextId, { status }),
    );
  }

  function conditionalConfig(): ServerComponentConfig {
    return {
      id: 'row-with-status-condition',
      class: ServerComponentClass.UnitTest,
      conditions: [
        {
          type: ConditionType.ContextValueNotEqual,
          payload: {
            ref: `${contextId}.status`,
            value: { kind: 'literal', value: 'existing' },
          },
        },
      ],
    };
  }

  it('не меняет visibility по conditions, пока config заморожен (forEach ListSync)', () => {
    initContext('existing');

    const config = conditionalConfig();
    componentHub.registerConfig(config, entryId);

    fixture.componentRef.setInput('components', [config]);
    fixture.detectChanges();

    const conditions$ = list.conditions$.get(config);
    expect(conditions$).toBeDefined();

    const values: boolean[] = [];
    const subscription = conditions$!.subscribe((met) => values.push(met));
    expect(values.at(-1)).toBe(false);

    componentHub.freezeConfigSubtree(config);

    postman.incomingMessage$.next(
      new BffContextValuesMessage(contextId, [
        { key: 'status', value: undefined },
      ]),
    );

    expect(values).toEqual([false]);

    subscription.unsubscribe();
  });
});
