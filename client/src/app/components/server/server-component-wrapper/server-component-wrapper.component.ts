import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  protected readonly stringIsExternalUrl = stringIsExternalUrl;
  private wrapperStyles: Record<string, string> = {};

  @HostBinding('style')
  get hostStyle(): Record<string, string> {
    return this.wrapperStyles;
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
