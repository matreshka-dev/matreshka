import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { IframeConfig } from '@shared/types/iframe-config';
import { PreparePipe } from '../../../../pipes/prepare.pipe';
import { ServerOutputComponent } from '../server-output-component';

@Component({
  selector: 'app-iframe',
  imports: [PreparePipe],
  templateUrl: './iframe.component.html',
  styleUrl: './iframe.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'iframe-output output' },
})
export class IframeComponent extends ServerOutputComponent<
  IframeConfig,
  string
> {
  private readonly domSanitizer = inject(DomSanitizer);
  private readonly iframeRef =
    viewChild<ElementRef<HTMLIFrameElement>>('iframe');

  src = computed(() => {
    const url = this.value();
    return url
      ? this.domSanitizer.bypassSecurityTrustResourceUrl(url)
      : undefined;
  });

  constructor() {
    super();
    afterNextRender(() => this.syncAllowAttribute());

    effect(() => {
      this.iframeRef();
      this.syncAllowAttribute();
    });
  }

  override default(): string {
    return '';
  }

  private syncAllowAttribute() {
    const iframe = this.iframeRef()?.nativeElement;
    if (!iframe) {
      return;
    }

    const allow = this.config.properties.allow?.join('; ');
    if (allow) {
      iframe.setAttribute('allow', allow);
    } else {
      iframe.removeAttribute('allow');
    }
  }
}
