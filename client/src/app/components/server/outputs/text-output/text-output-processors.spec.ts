import { TextOutputAutolinkScheme } from '@shared/enums/text-output-autolink-scheme';
import { TextOutputAutolinkTarget } from '@shared/enums/text-output-autolink-target';
import { TextOutputProcessor } from '@shared/enums/text-output-processor';
import { describe, expect, it } from 'vitest';
import { applyTextOutputProcessors } from './text-output-processors';

describe('applyTextOutputProcessors', () => {
  it('возвращает исходный текст одним сегментом без processors', () => {
    expect(applyTextOutputProcessors('plain text', [])).toEqual([
      { kind: 'text', text: 'plain text' },
    ]);
  });

  it('разбивает текст по переводам строк', () => {
    expect(
      applyTextOutputProcessors('a\nb', [
        { processor: TextOutputProcessor.LineBreaks },
      ]),
    ).toEqual([
      { kind: 'text', text: 'a' },
      { kind: 'lineBreak' },
      { kind: 'text', text: 'b' },
    ]);
  });

  it('создаёт link-сегмент с target для autolink', () => {
    expect(
      applyTextOutputProcessors('see https://example.com', [
        {
          processor: TextOutputProcessor.Autolink,
          target: TextOutputAutolinkTarget.Self,
        },
      ]),
    ).toEqual([
      { kind: 'text', text: 'see ' },
      {
        kind: 'link',
        text: 'example.com',
        href: 'https://example.com',
        target: TextOutputAutolinkTarget.Self,
      },
    ]);
  });

  it('корректно применяет lineBreaks перед autolink', () => {
    expect(
      applyTextOutputProcessors('a\nhttps://example.com', [
        { processor: TextOutputProcessor.LineBreaks },
        { processor: TextOutputProcessor.Autolink },
      ]),
    ).toEqual([
      { kind: 'text', text: 'a' },
      { kind: 'lineBreak' },
      {
        kind: 'link',
        text: 'example.com',
        href: 'https://example.com',
        target: TextOutputAutolinkTarget.Blank,
      },
    ]);
  });

  it('учитывает список разрешённых схем', () => {
    expect(
      applyTextOutputProcessors('http://a.test https://b.test', [
        {
          processor: TextOutputProcessor.Autolink,
          schemes: [TextOutputAutolinkScheme.Https],
        },
      ]),
    ).toEqual([
      { kind: 'text', text: 'http://a.test ' },
      {
        kind: 'link',
        text: 'b.test',
        href: 'https://b.test',
        target: TextOutputAutolinkTarget.Blank,
      },
    ]);
  });

  it('линкует только mailto при соответствующей схеме', () => {
    expect(
      applyTextOutputProcessors('mailto:test@example.com https://example.com', [
        {
          processor: TextOutputProcessor.Autolink,
          schemes: [TextOutputAutolinkScheme.Mailto],
        },
      ]),
    ).toEqual([
      {
        kind: 'link',
        text: 'test@example.com',
        href: 'mailto:test@example.com',
        target: TextOutputAutolinkTarget.Blank,
      },
      { kind: 'text', text: ' https://example.com' },
    ]);
  });

  it('убирает tel: из отображаемого текста, сохраняя href без изменений', () => {
    expect(
      applyTextOutputProcessors('call tel:89234118981', [
        {
          processor: TextOutputProcessor.Autolink,
          schemes: [TextOutputAutolinkScheme.Tel],
        },
      ]),
    ).toEqual([
      { kind: 'text', text: 'call ' },
      {
        kind: 'link',
        text: '89234118981',
        href: 'tel:89234118981',
        target: TextOutputAutolinkTarget.Blank,
      },
    ]);
  });

  it('не превращает HTML-подобный текст в разметку', () => {
    expect(
      applyTextOutputProcessors('<script>alert(1)</script>', [
        { processor: TextOutputProcessor.Autolink },
      ]),
    ).toEqual([{ kind: 'text', text: '<script>alert(1)</script>' }]);
  });
});
