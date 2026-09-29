import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { PostmanService } from '../../../services/postman.service';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
  let component: GridComponent;
  let fixture: ComponentFixture<GridComponent>;

  beforeEach(async () => {
    const gridConfig = {
      id: 'grid-test-id',
      class: ServerComponentClass.Grid,
      properties: {
        content: [],
        columns: [1],
      },
    };

    await TestBed.configureTestingModule({
      imports: [GridComponent],
      providers: [
        {
          provide: ComponentHubService,
          useValue: {
            config$: () => of(gridConfig),
            addInstance: () => new Subject<void>(),
            deleteInstance: () => undefined,
          },
        },
        {
          provide: ContextHubService,
          useValue: {},
        },
        {
          provide: PostmanService,
          useValue: {
            incomingMessage$: new Subject(),
            outcomingMessage$: new Subject(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GridComponent);
    fixture.componentRef.setInput('id', 'grid-test-id');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
