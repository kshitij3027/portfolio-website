import { OWNER } from '../orchestration/copy';
import { h, svgIcon } from './dom';

/** Simple stroke glyphs (original paths — no brand marks). */
const GLYPH = {
  /** share-nodes: the classic "socials live here" affordance */
  share: svgIcon(
    '<circle cx="6" cy="12" r="2.7"/><circle cx="17.5" cy="5.5" r="2.7"/><circle cx="17.5" cy="18.5" r="2.7"/><line x1="8.4" y1="10.7" x2="15.1" y2="6.8"/><line x1="8.4" y1="13.3" x2="15.1" y2="17.2"/>',
  ),
  github: svgIcon('<polyline points="8.5 7.5 4 12 8.5 16.5"/><polyline points="15.5 7.5 20 12 15.5 16.5"/>'),
  linkedin: svgIcon(
    '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><line x1="8" y1="11" x2="8" y2="16.5"/><circle cx="8" cy="7.8" r="0.6"/><path d="M11.6 16.5V11m0 2.2c0-1.5 4.4-2.1 4.4.6v2.7"/>',
  ),
  email: svgIcon('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>'),
};

interface FabLink {
  label: string;
  href: string;
  icon: string;
  external: boolean;
}

const LINKS: FabLink[] = [
  { label: 'GitHub', href: OWNER.github, icon: GLYPH.github, external: true },
  { label: 'LinkedIn', href: OWNER.linkedin, icon: GLYPH.linkedin, external: true },
  { label: 'Email', href: `mailto:${OWNER.email}`, icon: GLYPH.email, external: false },
];

/** Chat-style FAB that fans three social links out on a quarter circle. */
export function mountFab(root: HTMLElement): void {
  const R = 86;
  const angles = [90, 135, 180]; // degrees from +x axis, opening up-left (FAB sits bottom-right)

  const main = h(
    'button',
    {
      class: 'fab__main',
      'aria-label': 'Social links',
      'aria-expanded': 'false',
      'aria-haspopup': 'true',
      html: GLYPH.share,
      onclick: () => toggle(),
    },
    [],
  );

  const items = LINKS.map((l, i) => {
    const a = (angles[i] * Math.PI) / 180;
    const el = h(
      'a',
      {
        class: 'fab__item',
        href: l.href,
        'aria-label': l.label,
        title: l.label,
        html: l.icon,
        tabindex: '-1',
      },
      [],
    );
    if (l.external) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
    el.style.setProperty('--fx', `${Math.cos(a) * R}px`);
    el.style.setProperty('--fy', `${-Math.sin(a) * R}px`);
    el.style.setProperty('--i', String(i));
    return el;
  });

  root.append(main, ...items);

  let open = false;
  function toggle(force?: boolean): void {
    open = force ?? !open;
    root.classList.toggle('is-open', open);
    main.setAttribute('aria-expanded', String(open));
    for (const it of items) it.setAttribute('tabindex', open ? '0' : '-1');
    if (open) items[0].focus({ preventScroll: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      toggle(false);
      main.focus({ preventScroll: true });
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (open && !root.contains(e.target as Node)) toggle(false);
  });
}
