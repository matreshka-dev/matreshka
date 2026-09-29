import { TextOutputAutolinkScheme } from '@shared/enums/text-output-autolink-scheme';
import { TextOutputAutolinkTarget } from '@shared/enums/text-output-autolink-target';
import { TextOutputProcessor } from '@shared/enums/text-output-processor';
import type {
  TextOutputProcessorAutolinkConfig,
  TextOutputProcessorConfig,
} from '@shared/types/text-output-processor-config';

export type TextOutputSegment =
  | { kind: 'text'; text: string }
  | {
      kind: 'link';
      text: string;
      href: string;
      target: TextOutputAutolinkTarget;
    }
  | { kind: 'lineBreak' };

const DEFAULT_AUTOLINK_SCHEMES = [
  TextOutputAutolinkScheme.Http,
  TextOutputAutolinkScheme.Https,
  TextOutputAutolinkScheme.Mailto,
  TextOutputAutolinkScheme.Tel,
] as const;

const AUTOLINK_PATTERN_BY_SCHEME: Record<TextOutputAutolinkScheme, string> = {
  [TextOutputAutolinkScheme.Http]: String.raw`http:\/\/[^\s<>"']+`,
  [TextOutputAutolinkScheme.Https]: String.raw`https:\/\/[^\s<>"']+`,
  [TextOutputAutolinkScheme.Mailto]: String.raw`mailto:[^\s<>"']+`,
  [TextOutputAutolinkScheme.Tel]: String.raw`tel:\+?[0-9][0-9()\-\s]*[0-9]`,
};

export function applyTextOutputProcessors(
  text: string,
  processors: TextOutputProcessorConfig[],
): TextOutputSegment[] {
  if (processors.length === 0) {
    return [{ kind: 'text', text }];
  }

  let segments: TextOutputSegment[] = [{ kind: 'text', text }];

  for (const processor of processors) {
    switch (processor.processor) {
      case TextOutputProcessor.LineBreaks:
        segments = applyLineBreaks(segments);
        break;
      case TextOutputProcessor.Autolink:
        segments = applyAutolink(segments, processor);
        break;
    }
  }

  return segments;
}

function applyLineBreaks(segments: TextOutputSegment[]): TextOutputSegment[] {
  const nextSegments: TextOutputSegment[] = [];

  for (const segment of segments) {
    if (segment.kind !== 'text' || !segment.text.includes('\n')) {
      nextSegments.push(segment);
      continue;
    }

    const parts = segment.text.split('\n');
    parts.forEach((part, index) => {
      if (part.length > 0) {
        nextSegments.push({ kind: 'text', text: part });
      }
      if (index < parts.length - 1) {
        nextSegments.push({ kind: 'lineBreak' });
      }
    });
  }

  return nextSegments;
}

function applyAutolink(
  segments: TextOutputSegment[],
  config: TextOutputProcessorAutolinkConfig,
): TextOutputSegment[] {
  const schemes = config.schemes ?? [...DEFAULT_AUTOLINK_SCHEMES];
  if (schemes.length === 0) {
    return segments;
  }

  const regex = createAutolinkRegex(schemes);
  if (!regex) {
    return segments;
  }

  const nextSegments: TextOutputSegment[] = [];
  const target = config.target ?? TextOutputAutolinkTarget.Blank;

  for (const segment of segments) {
    regex.lastIndex = 0;
    if (segment.kind !== 'text' || !regex.test(segment.text)) {
      nextSegments.push(segment);
      continue;
    }

    regex.lastIndex = 0;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(segment.text)) !== null) {
      const [href] = match;
      const index = match.index;

      if (index > lastIndex) {
        nextSegments.push({
          kind: 'text',
          text: segment.text.slice(lastIndex, index),
        });
      }

      nextSegments.push({
        kind: 'link',
        text: formatLinkText(href),
        href,
        target,
      });
      lastIndex = index + href.length;
    }

    if (lastIndex < segment.text.length) {
      nextSegments.push({
        kind: 'text',
        text: segment.text.slice(lastIndex),
      });
    }
  }

  return nextSegments;
}

function createAutolinkRegex(
  schemes: TextOutputAutolinkScheme[],
): RegExp | undefined {
  const parts = schemes
    .map((scheme) => AUTOLINK_PATTERN_BY_SCHEME[scheme])
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) {
    return undefined;
  }

  return new RegExp(`(${parts.join('|')})`, 'gi');
}

function formatLinkText(href: string): string {
  return href.replace(/^(https?:\/\/|mailto:|tel:)/i, '');
}
