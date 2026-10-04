import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  HostBinding,
  inject,
  input,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PreparePipe } from '../../../pipes/prepare.pipe';
import { ComponentHubService } from '../../../services/component-hub.service';
import { stringIsExternalUrl } from '../../../utils/string-is-external-url';
import { syncConfigColorsToElement } from '../../../utils/sync-config-colors-to-element';
import { OverlaysComponent } from '../../local/overlays/overlays.component';
import { ServerComponentConfig } from '../server-component-config';
import {
  getOverlaysFromConfig,
  shouldRenderOverlaysInWrapper,
} from '../server-component-overlays';
import { SERVER_COMPONENTS } from '../server-components-injection-token';

@Component({
  selector: 'app-server-component-wrapper',
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
    RouterLink,
    PreparePipe,
    OverlaysComponent,
  ],
  templateUrl: './server-component-wrapper.component.html',
  styleUrl: './server-component-wrapper.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerComponentWrapperComponent implements OnInit {
  id = input.required<string>();

  /** Конфиг с hub; синхронизируется как у {@link ServerComponent}. */
  _configSignal = signal<ServerComponentConfig | undefined>(undefined);

  componentClasses = inject(SERVER_COMPONENTS);
  private readonly componentHub = inject(ComponentHubService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  protected readonly stringIsExternalUrl = stringIsExternalUrl;
  private wrapperStyles: Record<string, string> = {};
  private readonly appliedColorClasses = new Set<string>();

  @HostBinding('style')
  get hostStyle(): Record<string, string> {
    return this.wrapperStyles;
  }

  constructor() {
    effect(() => {
      const config = this._configSignal();
      if (!config) {
        return;
      }
      syncConfigColorsToElement(
        this.document,
        this.elementRef.nativeElement as HTMLElement,
        config.properties?.colors,
        this.appliedColorClasses,
      );
      this.cdr.markForCheck();
    });
  }

  ngOnInit() {
    this.componentHub
      .config$(this.id())
      ?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this._configSignal.set(config);
      });
  }

  overlaysFor(config: ServerComponentConfig) {
    return shouldRenderOverlaysInWrapper(config)
      ? getOverlaysFromConfig(config)
      : [];
  }
}
