import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import { FormSubmitMessage } from '@shared/messages/client-to-bff/components/form/form-submit-message';
import type { FormConfig } from '@shared/types/form-config';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { FormComponent } from './form.component';

describe('FormComponent', () => {
  let fixture: ComponentFixture<FormComponent>;
  let component: FormComponent;
  let componentHub: ComponentHubService;
  let config: FormConfig;

  const configId = 'form-test-id';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormComponent],
      providers: [
        ComponentHubService,
        EnvironmentService,
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        {
          provide: SsrService,
          useClass: TestSsrService,
        },
        ContextHubService,
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.Form]: {
              component: FormComponent,
              dependencies: {
                pathsWithPlaceholdersInTemplate: [],
                pathsWithPlaceholdersInCode: [],
                requiredContextsPaths: [],
                getNestedConfigsPaths: vi.fn(() => []),
              },
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

    config = {
      id: configId,
      class: ServerComponentClass.Form,
      properties: {
        content: [],
      },
    };

    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(FormComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('должен вызывать interact с FormSubmitMessage при submit', () => {
    const interactSpy = vi.spyOn(component, 'interact');

    component.onSubmit();

    expect(interactSpy).toHaveBeenCalledWith('submit', expect.any(Function));

    const [, factory] = interactSpy.mock.calls[0];
    const message = (factory as () => any)() as FormSubmitMessage;

    expect(message).toBeInstanceOf(FormSubmitMessage);
    // FormSubmitMessage не передаёт payload, идентификатор формы находится в scope
    expect(message.target).toBe(configId);
  });
});
