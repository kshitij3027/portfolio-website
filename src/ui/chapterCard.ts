import { TERM, TYPING_MS_PER_CHAR } from '../config';
import { clock } from '../engine/clock';
import { h } from './dom';

/** Viewport-fraction anchor; the card hangs below-right of it. */
export interface Anchor {
  x: number;
  y: number;
}

const MAX_CAPTIONS = 3;

/**
 * The typography overlay that narrates the film: a chapter tab
 * ("01 · AGENTIC RAG"), a serif-italic project description, and short
 * step captions typed char-by-char as the particle scene advances.
 * All timing flows through the shared pausable clock.
 */
export class ChapterCard {
  private root: HTMLElement;
  private tab: HTMLElement;
  private body: HTMLElement;
  private cursor: HTMLElement;
  private anchor: Anchor = { x: 0.05, y: 0.66 };

  constructor(parent: HTMLElement) {
    this.tab = h('div', { class: 'term__tab' });
    this.body = h('div', { class: 'term__body' });
    this.cursor = h('span', { class: 'term__cursor' });
    this.root = h('div', { class: 'term term--dev card is-hidden' }, [this.tab, this.body]);
    parent.append(this.root);
    this.applyPosition();
  }

  private applyPosition(): void {
    const x = innerWidth < 700 ? 0.04 : this.anchor.x;
    this.root.style.left = `${(x * 100).toFixed(2)}vw`;
    this.root.style.top = `${(this.anchor.y * 100).toFixed(2)}vh`;
    this.root.style.setProperty('--t-scale', String(TERM.defaultScale));
  }

  moveTo(a: Anchor): void {
    this.anchor = a;
    this.applyPosition();
  }

  /** New chapter: set tab + description, then fade in. */
  async begin(tabText: string, desc: string, a?: Anchor): Promise<void> {
    if (a) this.moveTo(a);
    this.tab.textContent = tabText;
    this.body.textContent = '';
    this.body.append(h('div', { class: 'card__desc' }, [desc]));
    this.root.classList.remove('is-hidden');
    await clock.wait(TERM.showHideMs);
  }

  /** Type a step caption; keeps at most MAX_CAPTIONS lines (oldest drops). */
  async caption(text: string): Promise<void> {
    const caps = this.body.querySelectorAll('.term__line');
    if (caps.length >= MAX_CAPTIONS) caps[0].remove();

    const line = h('div', { class: 'term__line term__line--bright' });
    const span = h('span');
    line.append(span, this.cursor);
    this.body.append(line);
    for (const ch of text) {
      span.textContent += ch;
      await clock.wait(TYPING_MS_PER_CHAR);
    }
  }

  async hide(): Promise<void> {
    this.root.classList.add('is-hidden');
    await clock.wait(TERM.showHideMs);
  }
}
