/**
 * sitemap.xml, built from products.js at request time.
 *
 * It is generated rather than written by hand for one reason: a sitemap that has
 * to be maintained alongside the catalog is a sitemap that goes stale. This one
 * cannot disagree with the catalog, because it is the catalog.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.env.SITE_URL || 'https://kadprints.vercel.app';

let cache = null;

function projectFile(name) {
  const tries = [
    join(process.cwd(), name),
    join(process.cwd(), '..', name),
    new URL('../' + name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
  ];
  for (const path of tries) {
    try {
      if (existsSync(path)) return readFileSync(path, 'utf8');
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function load() {
  if (cache) return cache;
  const src = projectFile('products.js');
  if (!src) return null;
  cache = new Function(src + '\nreturn { PRODUCTS };')();
  return cache;
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default function handler(req, res) {
  const data = load();
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: SITE + '/', lastmod: today, priority: '1.0' },
    ...((data && data.PRODUCTS) || []).map((p) => ({
      loc: `${SITE}/p/${encodeURIComponent(p.id)}`,
      lastmod: p.listed || today,
      priority: '0.7',
    })),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          '  <url>\n' +
          `    <loc>${esc(u.loc)}</loc>\n` +
          `    <lastmod>${esc(u.lastmod)}</lastmod>\n` +
          `    <priority>${u.priority}</priority>\n` +
          '  </url>'
      )
      .join('\n') +
    '\n</urlset>\n';

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.statusCode = 200;
  return res.end(xml);
}
