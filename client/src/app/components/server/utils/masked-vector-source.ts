import { RatioMode } from '@shared/enums/ratio-mode';

export type VectorSourceType = 'url' | 'svg' | 'base64';

export function getVectorSourceType(
  value: string | undefined | null,
): VectorSourceType {
  const trimmedValue = value?.trim().toLowerCase();
  if (trimmedValue?.startsWith('<svg')) {
    return 'svg';
  }
  if (trimmedValue?.startsWith('http')) {
    return 'url';
  }
  return 'base64';
}

export function getVectorMaskSize(mode?: RatioMode): string {
  switch (mode) {
    case RatioMode.Fill:
      return 'cover';
    case RatioMode.Stretch:
      return '100% 100%';
    case RatioMode.Fit:
    default:
      return 'contain';
  }
}

export function getVectorCssMask(
  value: string | undefined | null,
  mode?: RatioMode,
): string | null {
  const maskSize = getVectorMaskSize(mode);

  switch (getVectorSourceType(value)) {
    case 'url':
      return `url(${value}) no-repeat center / ${maskSize}`;
    case 'base64':
      return `url(data:image/svg+xml;base64,${value}) no-repeat center / ${maskSize}`;
    case 'svg':
      return `url("data:image/svg+xml,${encodeURIComponent(value ?? '')}") no-repeat center / ${maskSize}`;
  }
}

export function getVectorNativeSrc(value: string | undefined | null): string {
  if (!value) {
    return '';
  }
  switch (getVectorSourceType(value)) {
    case 'url':
      return value;
    case 'base64':
      return `data:image/svg+xml;base64,${value}`;
    case 'svg':
      return `data:image/svg+xml,${encodeURIComponent(value)}`;
  }
}
