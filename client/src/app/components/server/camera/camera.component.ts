import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CameraSwitchMessage } from '@shared/messages/bff-to-client/components/camera/camera-switch-message';
import { CameraDeviceChangeMessage } from '@shared/messages/client-to-bff/components/camera/camera-device-change-message';
import { CameraQrCodeMessage } from '@shared/messages/client-to-bff/components/camera/camera-qr-code-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import type { CameraConfig } from '@shared/types/camera-config';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

@Component({
  selector: 'app-camera',
  imports: [ServerComponentsListComponent],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'camera stack',
  },
})
export class CameraComponent extends ServerComponent<CameraConfig> {
  private stream?: MediaStream;
  private lastQrCode?: string;
  private lastQrCodeSentAt = 0;
  private qrScanRafId?: number;
  private qrScanLastFrameAt = 0;
  platformId = inject(PLATFORM_ID);
  videoEl = viewChild<ElementRef<HTMLVideoElement>>('video');

  override ngOnInit() {
    super.ngOnInit();
    this.componentCommandMessages$.subscribe((message) => {
      if (message instanceof CameraSwitchMessage) {
        const deviceId = message.payload.deviceId;
        if (deviceId) {
          this.switchToCamera(deviceId);
        }
      }
    });
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (!isPlatformServer(this.platformId)) {
      this.startCamera();
    }
  }

  override ngOnDestroy(): void {
    if (!isPlatformServer(this.platformId)) {
      this.stopQrScanLoop();
      this.stopCamera();
    }
    super.ngOnDestroy();
  }

  private async startCamera(): Promise<void> {
    const video = this.videoEl()!.nativeElement;

    try {
      const facingMode = this.config.properties.facingMode;
      const videoConstraints: MediaStreamConstraints['video'] = facingMode
        ? { facingMode: { ideal: facingMode } }
        : true;

      await this.setStream({ video: videoConstraints, audio: false });
      try {
        await video.play();
      } catch {
        // autoplay может быть заблокирован политиками браузера; видео всё равно должно быть доступно после взаимодействия пользователя
      }

      if (this.hasServerInteraction('qr-code')) {
        this.startQrScanLoop();
      }
    } catch (e: unknown) {
      this.interact(
        'error',
        () =>
          new ErrorMessage(this.id(), {
            message: e instanceof Error ? e.message : String(e),
          }),
      );
    }
  }

  private async setStream(constraints: MediaStreamConstraints): Promise<void> {
    const video = this.videoEl()!.nativeElement;
    // останавливаем предыдущий поток, чтобы камера реально переключилась
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = undefined;
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.stream = stream;
    video.srcObject = stream;

    const deviceId = stream.getVideoTracks()?.[0]?.getSettings()?.deviceId;
    if (deviceId) {
      this.interact(
        'device-change',
        () => new CameraDeviceChangeMessage(this.id(), { deviceId }),
      );
    }
  }

  private async switchToCamera(deviceId: string): Promise<void> {
    if (isPlatformServer(this.platformId)) return;
    try {
      await this.setStream({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });

      try {
        await this.videoEl()!.nativeElement.play();
      } catch {
        // autoplay может быть заблокирован
      }
    } catch {
      // не удалось переключить камеру (нет прав/устройства/поддержки)
    }
  }

  private async startQrScanLoop(): Promise<void> {
    const { default: decodeQR } = await import('qr/decode.js');
    const video = this.videoEl()!.nativeElement;

    const canvas = this.document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

    const scan = async () => {
      if (!this.stream || video.readyState < 2) {
        this.qrScanRafId = window.requestAnimationFrame(scan);
        return;
      }

      // ограничим частоту, чтобы не нагружать CPU
      const now = Date.now();
      if (now - this.qrScanLastFrameAt < 150) {
        this.qrScanRafId = window.requestAnimationFrame(scan);
        return;
      }
      this.qrScanLastFrameAt = now;

      const w = video.videoWidth || video.clientWidth;
      const h = video.videoHeight || video.clientHeight;
      if (w && h) {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        try {
          const imageData = ctx.getImageData(0, 0, w, h);
          const decoded = decodeQR({
            width: w,
            height: h,
            // decodeQR ожидает Uint8Array-like; ImageData.data это Uint8ClampedArray и подходит
            data: imageData.data,
          });
          const qr = (decoded ?? '').trim();
          if (qr) {
            const sentNow = Date.now();
            if (
              qr === this.lastQrCode &&
              sentNow - this.lastQrCodeSentAt < 1200
            ) {
              // noop
            } else {
              this.lastQrCode = qr;
              this.lastQrCodeSentAt = sentNow;
              this.interact(
                'qr-code',
                () => new CameraQrCodeMessage(this.id(), qr),
              );
            }
          }
        } catch {
          // decodeQR бросает исключение, если QR не найден или кадр неподходящий
        }
      }

      this.qrScanRafId = window.requestAnimationFrame(scan);
    };

    this.stopQrScanLoop();
    this.qrScanRafId = window.requestAnimationFrame(scan);
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = undefined;
    }
    const video = this.videoEl()?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  private stopQrScanLoop(): void {
    if (typeof this.qrScanRafId === 'number') {
      window.cancelAnimationFrame(this.qrScanRafId);
      this.qrScanRafId = undefined;
    }
  }
}
