import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QrCodePipe } from './qr-code.pipe';

describe('QrCodePipe', () => {
  let pipe: QrCodePipe;
  let bypassSecurityTrustHtmlMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    bypassSecurityTrustHtmlMock = vi.fn((html: string) => `safe:${html}`);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustHtml: bypassSecurityTrustHtmlMock,
          },
        },
      ],
    });

    pipe = TestBed.runInInjectionContext(() => new QrCodePipe());
  });

  it('должен возвращать безопасный HTML при наличии значения', async () => {
    const result = (await firstValueFrom(
      pipe.transform('hello'),
    )) as unknown as string;

    expect(bypassSecurityTrustHtmlMock).toHaveBeenCalledTimes(1);
    expect(bypassSecurityTrustHtmlMock).toHaveBeenCalledWith(
      expect.stringContaining('<svg'),
    );
    expect(result).toContain('safe:<svg');
  });

  it('должен возвращать пустую строку при отсутствии значения', async () => {
    const result = (await firstValueFrom(
      pipe.transform(undefined),
    )) as unknown as string;

    expect(bypassSecurityTrustHtmlMock).not.toHaveBeenCalled();
    expect(result).toBe('');
  });
});
