type Attrs = Record<string, string | number | boolean | ((e: Event) => void)>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'function') {
      el.addEventListener(k.replace(/^on/, ''), v as EventListener);
    } else if (k === 'html') {
      el.innerHTML = String(v);
    } else if (typeof v === 'boolean') {
      if (v) el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    el.append(c instanceof Node ? c : document.createTextNode(c));
  }
  return el;
}

export function svgIcon(paths: string, viewBox = '0 0 24 24'): string {
  return `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
