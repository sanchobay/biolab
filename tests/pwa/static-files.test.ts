// O6 (ExecPlan 0007, PRD-0004 §2 and §6): manifest, icons, index.html links and Vercel cache headers.
import { describe, expect, it } from 'vitest';
import indexHtml from '../../index.html?raw';
import manifestText from '../../public/manifest.webmanifest?raw';
import vercelText from '../../vercel.json?raw';
import { PUBLIC_FILES } from '../../src/pwa/serviceWorker';

// Every file shipped from public/, as root-relative URLs ("/icons/icon-192.png").
const publicFiles = Object.keys(import.meta.glob('../../public/**/*', { query: '?url', import: 'default' })).map((path) =>
  path.replace('../../public', ''),
);

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

describe('O6 web app manifest and icons', () => {
  const manifest = JSON.parse(manifestText) as Record<string, unknown> & { icons: ManifestIcon[] };

  it('describes BioLab as a standalone app with the light theme colours', () => {
    expect(manifest).toMatchObject({
      name: 'BioLab',
      short_name: 'BioLab',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#EEF3F9',
      theme_color: '#EEF3F9',
      lang: 'en',
    });
  });

  it('lists 192, 512 and maskable icons that exist in public/', () => {
    const sizes = manifest.icons.map((icon) => `${icon.sizes}${icon.purpose === 'maskable' ? ':maskable' : ''}`);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512', '512x512:maskable']));
    for (const icon of manifest.icons) expect(publicFiles).toContain(icon.src);
    expect(publicFiles).toEqual(expect.arrayContaining(['/icons/icon.svg', '/icons/apple-touch-icon.png']));
  });

  it('precaches exactly the files that public/ contains', () => {
    expect([...PUBLIC_FILES].map((file) => `/${file}`).sort()).toEqual([...publicFiles].sort());
  });

  it('is linked from index.html together with the favicon and the apple-touch icon', () => {
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(indexHtml).toContain('<link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(indexHtml).not.toContain('href="data:,"');
  });
});

describe('O6 Vercel headers', () => {
  const config = JSON.parse(vercelText) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
    rewrites?: unknown;
  };
  const cacheControl = (source: string) =>
    config.headers.find((rule) => rule.source === source)?.headers.find((header) => header.key === 'Cache-Control')?.value;

  it('never caches the worker, manifest or app shell, and caches hashed assets forever', () => {
    for (const source of ['/sw.js', '/manifest.webmanifest', '/', '/index.html']) expect(cacheControl(source)).toBe('no-cache');
    expect(cacheControl('/assets/(.*)')).toBe('public, max-age=31536000, immutable');
    expect(config.rewrites).toBeUndefined();
  });
});
