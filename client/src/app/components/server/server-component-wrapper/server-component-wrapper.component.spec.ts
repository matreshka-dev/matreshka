import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { beforeEach, describe, expect, it } from 'vitest';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { ServerComponentWrapperComponent } from './server-component-wrapper.component';

describe('ServerComponentWrapperComponent', () => {
  let component: ServerComponentWrapperComponent;
  let fixture: ComponentFixture<ServerComponentWrapperComponent>;

  @Component({
    selector: 'app-dummy-server-component',
    template: '',
    standalone: true,
  })
  class DummyServerComponent {
    @Input({ required: true }) id!: string;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerComponentWrapperComponent],
      providers: [
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.UnitTestDummy]: {
              component: DummyServerComponent,
              dependencies: {
                pathsWithPlaceholdersInTemplate: [],
                pathsWithPlaceholdersInCode: [],
                requiredContextsPaths: [],
                getNestedConfigsPaths: () => [],
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServerComponentWrapperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '1');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
