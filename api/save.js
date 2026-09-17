/**
 * Save endpoint for the catalog editor.
 *
 * Vercel runs this beside the static files. Nothing else about the site changes:
 * it stays plain HTML and CSS, and this is the one piece with a server behind it.
 *
 * What it does: takes the products.js the editor built, checks the password, and
 * commits the file to GitHub on your behalf. Vercel sees the commit and redeploys,
 * so the change is live in about half a minute, with full history behind it.
 *
 * ENVIRONMENT VARIABLES (Vercel > Project > Settings > Environment Variables)
 *   ADMIN_PASSWORD   what you type in the editor. Nothing else uses it.
 *   GITHUB_TOKEN     a fine-grained personal access token with Contents: Read and
 *                    write, scoped to this one repository and nothing else.
 *   GITHUB_REPO      optional, defaults to amink21/Printing-Portfolio
 *   GITHUB_BRANCH    optional, defaults to main
 *
 * The token lives only here, on the server. It is never sent to the browser.
 */

const DEFAULT_REPO = 'amink21/Printing-Portfolio';
const DEFAULT_BRANCH = 'main';
const FILE_PATH = 'products.js';

// Compares without leaking where two strings differ.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function github(path, token, options) {
  const res = await fetch('https://api.github.com' + path, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'kad-prints-editor',
      ...(options && options.headers),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return res.status(500).json({
      error: 'ADMIN_PASSWORD is not set on the server, so nothing can be saved yet.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { action, password, content, message } = body;

  // A uniform pause so a wrong password cannot be spotted by how fast it fails.
  if (!safeEqual(String(password || ''), configured)) {
    await new Promise((r) => setTimeout(r, 400));
    return res.status(401).json({ error: 'Wrong password.' });
  }

  // The editor calls this on unlock, so the password is checked by the server
  // rather than by a file the browser can read.
  if (action === 'check') {
    return res.status(200).json({ ok: true, canSave: Boolean(process.env.GITHUB_TOKEN) });
  }

  if (typeof content !== 'string' || content.length < 200) {
    return res.status(400).json({ error: 'That does not look like a products.js file.' });
  }
  // Refuse to commit something that would blank the catalog.
  if (content.indexOf('const PRODUCTS = [') === -1) {
    return res.status(400).json({ error: 'The file is missing its PRODUCTS array. Nothing was saved.' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({
      error:
        'GITHUB_TOKEN is not set on the server. Add a fine-grained token with Contents: Read and write for this repo, then redeploy.',
    });
  }

  const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const path = `/repos/${repo}/contents/${FILE_PATH}`;

  try {
    // GitHub needs the current sha to accept a replacement, which is also what
    // stops two edits from silently overwriting each other.
    const current = await github(`${path}?ref=${encodeURIComponent(branch)}`, token, {
      method: 'GET',
    });
    if (!current.ok) {
      return res.status(502).json({
        error:
          current.status === 404
            ? `Could not find ${FILE_PATH} in ${repo} on ${branch}.`
            : `GitHub said ${current.status}: ${current.body.message || 'unknown error'}`,
      });
    }

    const put = await github(path, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: message || 'Update catalog from the editor',
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha: current.body.sha,
        branch,
      }),
    });

    if (!put.ok) {
      return res.status(502).json({
        error: `GitHub refused the commit (${put.status}): ${put.body.message || 'unknown error'}`,
      });
    }

    return res.status(200).json({
      ok: true,
      commit: put.body.commit && put.body.commit.sha ? put.body.commit.sha.slice(0, 7) : null,
      url: put.body.commit && put.body.commit.html_url,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Could not reach GitHub: ' + err.message });
  }
}
