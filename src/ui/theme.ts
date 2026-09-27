// Colour theme (DESIGN_SYSTEM §28): light by default, with the §3 dark palette behind the header control.
export type Theme = 'light' | 'dark';

const THEME_COLOR: Record<Theme, string> = { light: '#EEF3F9', dark: '#07111F' };

/** One document-level attribute, so the CSS tokens, the SVG reactor and Chart.js all read the same theme. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}
