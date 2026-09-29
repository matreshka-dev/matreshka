import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { from, map, Observable, of } from 'rxjs';

@Pipe({
  name: 'qrCode',
  pure: true,
})
export class QrCodePipe implements PipeTransform {
  domSanitizer = inject(DomSanitizer);

  transform(value: string | undefined): Observable<SafeResourceUrl> {
    if (!value) {
      return of('' as SafeResourceUrl);
    }
    return from(import('qr')).pipe(
      map(({ default: encodeQR }) =>
        this.domSanitizer.bypassSecurityTrustHtml(encodeQR(value, 'svg')),
      ),
    );
  }
}
