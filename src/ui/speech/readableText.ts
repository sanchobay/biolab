// Text of a rendered region in reading order (PRD-0005 §5), for regions whose content is assembled in the component,
// such as the Learn sections. Buttons, decorative (aria-hidden) content, graphics and the read-aloud controls themselves
// are skipped. Works from the DOM tree only, without layout, so it behaves the same in the browser and in jsdom.
import type { Messages } from '../../i18n';
import { asSentence, spokenText } from '../../presentation/speech';

const BLOCK = new Set([
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DD',
  'DIV',
  'DL',
  'DT',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'LI',
  'OL',
  'P',
  'SECTION',
  'TABLE',
  'TD',
  'TH',
  'TR',
  'UL',
]);

const SKIPPED = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SCRIPT', 'STYLE', 'SVG', 'CANVAS']);

const isSkipped = (element: Element): boolean =>
  SKIPPED.has(element.tagName.toUpperCase()) || element.getAttribute('aria-hidden') === 'true' || element.hasAttribute('data-speech-skip');

/** One string per visual block (heading, paragraph, list item, term…), in document order. */
export function readableBlocks(root: Element): string[] {
  const blocks: string[] = [];
  let current = '';
  const flush = () => {
    const text = current.replace(/\s+/g, ' ').trim();
    if (text) blocks.push(text);
    current = '';
  };
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.textContent ?? '';
      return;
    }
    if (!(node instanceof Element) || isSkipped(node)) return;
    const block = BLOCK.has(node.tagName.toUpperCase());
    if (block) flush();
    node.childNodes.forEach(walk);
    if (block) flush();
  };
  walk(root);
  flush();
  return blocks;
}

/** The region's text as spoken: each block as a sentence, with symbols and units in words. */
export const regionSpeech = (root: Element | null, m: Messages): string =>
  root ? spokenText(readableBlocks(root).map(asSentence).join(' '), m) : '';
