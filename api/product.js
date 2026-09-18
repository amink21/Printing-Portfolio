/**
 * Server-rendered product page.
 *
 * WHY THIS EXISTS
 * ---------------
 * The catalog is one page that swaps its own contents. That is fine for a person
 * with a browser, and useless for everything else: a link pasted into Messenger
 * shows a generic card, and Google sees one page instead of seventy products.
 *
 * So /p/<id> comes through here. It serves the same index.html, unchanged except
 * for the handful of tags in <head> that describe the piece, plus a block of
 * Product data in the format search engines read. The page itself then notices
 * the address and opens that product, which it already knew how to do.
 *
 * Nothing about the catalog is duplicated here. The one source of truth is still
 * products.js, read straight off disk.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.env.SITE_URL || 'https://kadprints.vercel.app';

// Read once per warm instance rather than once per request.
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

  const shell = projectFile('index.html');
  const src = projectFile('products.js');
  if (!shell || !src) return null;

  // products.js is a plain script, not a module, so it is run in a function
  // scope and asked for what it declared. Its own module.exports guard sees no
  // module here and does nothing.
  const read = new Function(
    src + '\nreturn { PRODUCTS, CATEGORIES, SELLER };'
  );
  const data = read();

  cache = { shell, ...data };
  return cache;
}

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Cloudinary can crop to the exact card size from the URL, so the preview is
// never a 4000px original that a chat app refuses to fetch.
function ogImage(src) {
  if (!src) return null;
  const mark = '/image/upload/';
  const at = src.indexOf(mark);
  if (at === -1) {
    // A local file in images/. Make it absolute, which previews require.
    return src.startsWith('http') ? src : SITE + '/' + src.replace(/^\//, '');
  }
  return src.slice(0, at + mark.length) +
    'c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/' +
    src.slice(at + mark.length);
}

function priceNumber(p) {
  const n = parseFloat(String(p.price || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

// Written out rather than derived from the category label, because "a 3D printed
// art & sculpture" is what deriving it gives you.
const NOUNS = {
  'key-holders': 'key holder',
  art: 'sculpture',
  desk: 'desk piece',
  custom: 'piece',
};

function describe(p) {
  if (p.description) return p.description;
  const noun = NOUNS[p.category] || 'piece';
  const price = p.price ? `${p.price}. ` : '';
  return `${p.name}, a 3D printed ${noun} made to order in Montreal. ${price}Pick your colour and message me on Facebook Marketplace.`;
}

export default function handler(req, res) {
  const data = load();
  const id = String((req.query && req.query.id) || '').trim();

  // If anything at all went wrong reading the files, the catalog is still a
  // perfectly good answer. Never 500 at someone who followed a link.
  if (!data) {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  const product = data.PRODUCTS.find((p) => p.id === id);
  if (!product) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 404;
    return res.end(data.shell);
  }

  const category = (data.CATEGORIES.find((c) => c.id === product.category) || {}).label || '';
  const url = `${SITE}/p/${encodeURIComponent(product.id)}`;
  const title = `${product.name}${product.price ? ' - ' + product.price : ''} | Kad Prints`;
  const description = describe(product);
  const image = ogImage(product.images && product.images[0]);
  const price = priceNumber(product);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    ...(image ? { image: [image] } : {}),
    ...(category ? { category } : {}),
    brand: { '@type': 'Brand', name: 'Kad Prints' },
    material: 'PLA',
    url,
    ...(price
      ? {
          offers: {
            '@type': 'Offer',
            price: String(price),
            priceCurrency: 'CAD',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            url: product.marketplaceUrl || url,
            seller: { '@type': 'Organization', name: 'Kad Prints' },
          },
        }
      : {}),
  };

  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:site_name" content="Kad Prints">`,
    `<meta property="og:title" content="${esc(product.name)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    image ? `<meta property="og:image" content="${esc(image)}">` : '',
    image ? `<meta property="og:image:width" content="1200">` : '',
    image ? `<meta property="og:image:height" content="630">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n');

  // Strip the tags the shell carries for the catalog, so this page does not end
  // up describing itself twice and disagreeing with itself.
  let html = data.shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<meta property="og:(?:type|title|description)"[^>]*>\s*/gi, '')
    .replace(/<meta name="twitter:card"[^>]*>\s*/i, '')
    .replace(/<link rel="canonical"[^>]*>\s*/i, '');

  html = html.replace('</head>', head + '\n</head>');

  // Short shared cache: a listing changes when the catalog is republished, and a
  // stale preview for a minute is better than a cold function on every scrape.
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  res.statusCode = 200;
  return res.end(html);
}
