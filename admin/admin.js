/* ============================================================================
   Kad Prints - catalog editor
   ----------------------------------------------------------------------------
   Edits a copy of the catalog in your browser and writes out a new products.js.
   It never touches the live site: the site changes when you commit that file.

   Work in progress is kept in localStorage, so closing the tab by accident does
   not lose an afternoon of typing.
   ========================================================================== */

(function () {
  'use strict';

  var STORE = 'kadprints.admin.draft';
  var gate = document.getElementById('gate');
  var app = document.getElementById('app');
  var rowsEl = document.getElementById('rows');
  var countEl = document.getElementById('acount');
  var filterEl = document.getElementById('afilter');
  var dirtyEl = document.getElementById('dirty');
  var warnEl = document.getElementById('warn');
  var toastEl = document.getElementById('toast');

  var items = [];
  var dirty = false;
  var filter = '';
  var toastTimer = null;

  /* -- gate --------------------------------------------------------------- */

  // serverMode means a real Save button backed by the API. When the API is not
  // there, which is the case running this off a plain local file server, the page
  // falls back to the password in config.js and to downloading the file by hand.
  var serverMode = false;
  var password = '';

  function unlock() {
    gate.hidden = true;
    app.hidden = false;
    applyMode();
    paintNudge();
    load();
  }

  function applyMode() {
    var btn = document.getElementById('saveBtn');
    btn.innerHTML = serverMode
      ? '<i class="ph ph-cloud-arrow-up" aria-hidden="true"></i> Save and publish'
      : '<i class="ph ph-download-simple" aria-hidden="true"></i> Download products.js';
    var steps = document.getElementById('steps');
    if (steps) steps.hidden = serverMode;
    var live = document.getElementById('liveNote');
    if (live) live.hidden = !serverMode;
  }

  document.getElementById('gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var value = document.getElementById('gatePass').value;
    var err = document.getElementById('gateErr');
    var btn = e.target.querySelector('button');
    btn.disabled = true;

    function localCheck() {
      btn.disabled = false;
      if (value === ADMIN_PASSWORD) {
        serverMode = false;
        try { sessionStorage.setItem('kadprints.admin.ok', '1'); } catch (e2) {}
        unlock();
      } else {
        err.textContent = 'Wrong password.';
        err.hidden = false;
        document.getElementById('gatePass').value = '';
      }
    }

    function fail(message) {
      btn.disabled = false;
      err.textContent = message;
      err.hidden = false;
      document.getElementById('gatePass').value = '';
    }

    // Ask the server first. It holds the real password; nothing in this page does.
    fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check', password: value }),
    })
      .then(function (r) {
        // 404 or 405 means there is genuinely no function here, which is the
        // local case. Anything else is a real answer and must not be mistaken
        // for a bad password.
        if (r.status === 404 || r.status === 405) return { noApi: true };
        return r.text().then(function (text) {
          var parsed = null;
          try { parsed = JSON.parse(text); } catch (e2) {}
          return { ok: r.ok, status: r.status, body: parsed, raw: text };
        });
      })
      .then(function (res) {
        if (res.noApi) return localCheck();
        btn.disabled = false;

        if (!res.body) {
          // The function is there but did not answer with JSON, so it crashed or
          // is misconfigured. Saying "wrong password" here would send you hunting
          // for the wrong problem.
          return fail(
            'The save function answered with HTTP ' + res.status + ' and not JSON. ' +
            'It is deployed but failing. Check the Vercel function logs.'
          );
        }
        if (!res.ok) return fail(res.body.error || 'Wrong password.');

        serverMode = true;
        password = value;
        try { sessionStorage.setItem('kadprints.admin.pw', value); } catch (e2) {}
        unlock();
      })
      .catch(function () {
        // A genuine network failure. Offline, or no server at all.
        localCheck();
      });
  });

  try {
    var savedPw = sessionStorage.getItem('kadprints.admin.pw');
    if (savedPw) { serverMode = true; password = savedPw; unlock(); }
    else if (sessionStorage.getItem('kadprints.admin.ok') === '1') unlock();
  } catch (err) {}

  /* -- helpers ------------------------------------------------------------ */

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 52);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  function clearDirty() {
    dirty = false;
    dirtyEl.hidden = true;
    try { localStorage.removeItem(STORE); } catch (err) {}
  }

  function markDirty() {
    dirty = true;
    dirtyEl.hidden = false;
    try { localStorage.setItem(STORE, JSON.stringify(items)); } catch (err) {}
    validate();
  }

  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  /* -- data --------------------------------------------------------------- */

  function load() {
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (err) {}

    if (draft && draft.length) {
      items = draft;
      dirty = true;
      dirtyEl.hidden = false;
      toast('Picked up where you left off');
    } else {
      // Deep copy, so editing never mutates the loaded file in place.
      items = JSON.parse(JSON.stringify(typeof PRODUCTS === 'undefined' ? [] : PRODUCTS));
    }
    render();
  }

  function validate() {
    var problems = [];
    var notes = [];
    var ids = {};
    items.forEach(function (p) {
      if (!p.id) problems.push('A product has no id.');
      else if (ids[p.id]) problems.push('Two products share the id "' + p.id + '". Links to them would collide.');
      ids[p.id] = true;
      if (!p.name) problems.push('A product has no name.');
    });

    // Not a problem, just something to finish. An imported listing arrives with
    // no price because the export does not carry one, and it would be wrong to
    // block publishing the other sixty-five over it.
    var unpriced = items.filter(function (p) { return !String(p.price || '').trim(); }).length;
    if (unpriced) {
      notes.push(
        unpriced + (unpriced === 1 ? ' product has' : ' products have') + ' no price yet, ' +
        'and will show without one.'
      );
    }

    var all = problems.concat(notes);
    if (all.length) {
      warnEl.hidden = false;
      warnEl.textContent = all.slice(0, 4).join(' ');
    } else {
      warnEl.hidden = true;
    }
    warnEl.classList.toggle('soft', problems.length === 0);
    return problems.length === 0;
  }

  /* -- rendering ---------------------------------------------------------- */

  function categoryOptions(selected) {
    return (typeof CATEGORIES === 'undefined' ? [] : CATEGORIES)
      .map(function (c) {
        return '<option value="' + esc(c.id) + '"' +
          (c.id === selected ? ' selected' : '') + '>' + esc(c.label) + '</option>';
      }).join('');
  }

  function rowMarkup(p, i) {
    var imgs = p.images || [];
    var shot = imgs.length
      ? '<img src="' + esc(imgs[0]) + '" alt="">'
      : '<span class="none">No photo</span>';

    var chips = imgs.map(function (src, n) {
      return (
        '<span class="chipimg">' +
        '<img src="' + esc(src) + '" alt="">' +
        '<span title="' + esc(src) + '">' + esc(src.split('/').pop()) + '</span>' +
        '<button type="button" data-act="rmimg" data-i="' + i + '" data-n="' + n + '"' +
        ' aria-label="Remove photo">&times;</button></span>'
      );
    }).join('');

    return (
      '<div class="row" data-i="' + i + '">' +
        '<div class="thumbcol">' +
          '<div class="shot">' + shot + '</div>' +
          '<span class="shotcount">' + imgs.length + ' photo' + (imgs.length === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<div class="fields">' +
          '<div class="f c6"><label>Name</label>' +
            '<input data-f="name" data-i="' + i + '" value="' + esc(p.name) + '"></div>' +
          '<div class="f c3"><label>Price</label>' +
            '<input data-f="price" data-i="' + i + '" value="' + esc(p.price) + '"></div>' +
          '<div class="f c3"><label>Category</label>' +
            '<select data-f="category" data-i="' + i + '">' + categoryOptions(p.category) + '</select></div>' +

          '<div class="f c6"><label>Link (id). Changing this breaks links you already sent</label>' +
            '<input data-f="id" data-i="' + i + '" value="' + esc(p.id) + '"></div>' +
          '<div class="f c3"><label>Listed on</label>' +
            '<input type="date" data-f="listed" data-i="' + i + '" value="' + esc(p.listed || '') + '"></div>' +
          '<div class="f c3"><label>Print hours</label>' +
            '<input type="number" step="0.1" min="0" data-f="printHours" data-i="' + i + '" value="' + esc(p.printHours == null ? '' : p.printHours) + '"></div>' +

          '<div class="f c12"><label>Description. One plain sentence, or leave empty</label>' +
            '<textarea data-f="description" data-i="' + i + '" rows="1">' + esc(p.description || '') + '</textarea></div>' +

          '<div class="f c6"><label>Marketplace link for this piece</label>' +
            '<input data-f="marketplaceUrl" data-i="' + i + '" placeholder="https://www.facebook.com/marketplace/item/..." value="' + esc(p.marketplaceUrl || '') + '"></div>' +
          '<div class="f c6"><label>Colours. Empty means every colour you stock</label>' +
            '<input data-f="colors" data-i="' + i + '" placeholder="Black, Red, Silver" value="' + esc((p.colors || []).join(', ')) + '"></div>' +

          (imgs.length ? '<div class="imgs">' + chips + '</div>' : '') +

          '<div class="rowacts">' +
            '<button class="mini" type="button" data-act="upload" data-i="' + i + '">' +
              '<i class="ph ph-upload-simple" aria-hidden="true"></i> Upload photo</button>' +
            '<button class="mini" type="button" data-act="addurl" data-i="' + i + '">Add by filename or URL</button>' +
            '<span class="spacer"></span>' +
            '<button class="mini" type="button" data-act="dup" data-i="' + i + '">Duplicate</button>' +
            '<button class="mini danger" type="button" data-act="del" data-i="' + i + '">Delete</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function render() {
    var q = filter.trim().toLowerCase();
    var shown = 0;
    var html = items.map(function (p, i) {
      if (q && (p.name || '').toLowerCase().indexOf(q) === -1) return '';
      shown++;
      return rowMarkup(p, i);
    }).join('');

    rowsEl.innerHTML = html;
    countEl.textContent = q
      ? shown + ' of ' + items.length + ' products'
      : items.length + ' products';
    validate();
  }

  /* -- editing ------------------------------------------------------------ */

  rowsEl.addEventListener('input', function (e) {
    var el = e.target;
    var f = el.dataset.f;
    if (!f) return;
    var p = items[Number(el.dataset.i)];
    if (!p) return;

    if (f === 'printHours') p[f] = el.value === '' ? null : Number(el.value);
    else if (f === 'colors') {
      p[f] = el.value.split(',').map(function (c) { return c.trim(); }).filter(Boolean);
    } else p[f] = el.value;

    if (f === 'name') {
      // Keep the thumbnail caption honest while typing, without a full re-render
      // that would steal focus out of the field.
      var row = el.closest('.row');
      if (row) row.classList.add('isnew');
    }
    markDirty();
  });

  rowsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var i = Number(btn.dataset.i);
    var p = items[i];
    if (!p) return;

    var act = btn.dataset.act;

    if (act === 'del') {
      if (!confirm('Delete "' + p.name + '"? This only changes your draft.')) return;
      items.splice(i, 1);
      markDirty();
      render();
      toast('Deleted. Download the file to make it real.');
    }

    if (act === 'dup') {
      var copy = JSON.parse(JSON.stringify(p));
      copy.id = uniqueId(copy.id + '-copy');
      copy.name = copy.name + ' (copy)';
      items.splice(i + 1, 0, copy);
      markDirty();
      render();
    }

    if (act === 'rmimg') {
      p.images.splice(Number(btn.dataset.n), 1);
      markDirty();
      render();
    }

    if (act === 'addurl') {
      var v = prompt(
        'Photo filename or full URL.\n\n' +
        'A file you put in the images folder: images/' + p.id + '-1.jpg\n' +
        'Or paste any full https:// link.'
      );
      if (!v) return;
      p.images = p.images || [];
      p.images.push(v.trim());
      markDirty();
      render();
    }

    if (act === 'upload') uploadFor(p, btn);
  });

  function uniqueId(base) {
    var id = slug(base) || 'product';
    var taken = {};
    items.forEach(function (p) { taken[p.id] = true; });
    if (!taken[id]) return id;
    var n = 2;
    while (taken[id + '-' + n]) n++;
    return id + '-' + n;
  }

  /* -- photos ------------------------------------------------------------- */

  function cloudinaryReady() {
    return typeof CLOUDINARY === 'object' && CLOUDINARY &&
      CLOUDINARY.cloudName && CLOUDINARY.uploadPreset;
  }

  function uploadFor(product, btn) {
    if (!cloudinaryReady()) {
      alert(
        'Cloudinary is not set up yet.\n\n' +
        'Open admin/config.js and add your uploadPreset. Make it in Cloudinary under\n' +
        'Settings > Upload > Upload presets, with Signing Mode set to Unsigned.\n\n' +
        'Until then use "Add by filename or URL" and put the file in the images folder.'
      );
      return;
    }

    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      if (!files.length) return;
      btn.disabled = true;
      btn.textContent = 'Uploading...';

      // One at a time, so a slow connection cannot fire twenty parallel uploads.
      var done = 0;
      var failed = 0;
      (function next() {
        var file = files.shift();
        if (!file) {
          btn.disabled = false;
          btn.innerHTML = '<i class="ph ph-upload-simple" aria-hidden="true"></i> Upload photo';
          markDirty();
          render();
          toast(
            failed
              ? done + ' uploaded, ' + failed + ' failed'
              : done + ' photo' + (done === 1 ? '' : 's') + ' added'
          );
          return;
        }

        var form = new FormData();
        form.append('file', file);
        form.append('upload_preset', CLOUDINARY.uploadPreset);
        if (CLOUDINARY.folder) form.append('folder', CLOUDINARY.folder);

        fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY.cloudName + '/image/upload', {
          method: 'POST',
          body: form,
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.secure_url) throw new Error(data.error && data.error.message || 'upload failed');
            product.images = product.images || [];
            product.images.push(data.secure_url);
            done++;
          })
          .catch(function (err) {
            failed++;
            console.error('Cloudinary upload failed:', err);
          })
          .then(next);
      })();
    });
    input.click();
  }

  /* -- add, filter, revert ------------------------------------------------ */

  document.getElementById('addBtn').addEventListener('click', function () {
    var today = new Date().toISOString().slice(0, 10);
    items.unshift({
      id: uniqueId('new-product'),
      name: 'New product',
      category: (typeof CATEGORIES !== 'undefined' && CATEGORIES[0]) ? CATEGORIES[0].id : 'custom',
      price: '$40',
      listed: today,
      description: '',
      printHours: null,
      images: [],
      colors: [],
      marketplaceUrl: '',
    });
    filter = '';
    filterEl.value = '';
    markDirty();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var first = rowsEl.querySelector('input[data-f="name"]');
    if (first) { first.focus(); first.select(); }
  });

  filterEl.addEventListener('input', function (e) {
    filter = e.target.value;
    render();
  });

  document.getElementById('revertBtn').addEventListener('click', function () {
    if (!confirm('Throw away your changes and reload the catalog as it is on the site?')) return;
    try { localStorage.removeItem(STORE); } catch (err) {}
    dirty = false;
    dirtyEl.hidden = true;
    load();
    toast('Back to the published catalog');
  });

  /* -- export ------------------------------------------------------------- */

  function productBlock(p) {
    var lines = ['  {'];
    lines.push("    id: '" + p.id + "',");
    lines.push('    name: ' + JSON.stringify(p.name) + ',');
    lines.push("    category: '" + p.category + "',");
    lines.push('    price: ' + JSON.stringify(p.price || '') + ',');
    if (p.listed) lines.push("    listed: '" + p.listed + "',");
    lines.push('    description: ' + JSON.stringify(p.description || '') + ',');
    if (p.printHours != null && p.printHours !== '') lines.push('    printHours: ' + p.printHours + ',');
    lines.push('    images: [' + (p.images || []).map(function (s) { return JSON.stringify(s); }).join(', ') + '],');
    if (p.colors && p.colors.length) {
      lines.push('    colors: [' + p.colors.map(function (c) { return JSON.stringify(c); }).join(', ') + '],');
    }
    lines.push('    marketplaceUrl: ' + JSON.stringify(p.marketplaceUrl || '') + ',');
    lines.push('  },');
    return lines.join('\n');
  }

  document.getElementById('saveBtn').addEventListener('click', function () {
    if (!validate()) {
      alert('Fix the highlighted problem first. Two products cannot share an id, and every product needs a name.');
      return;
    }

    // Rewrite only the PRODUCTS array inside the real file, so your comments,
    // the SELLER block and the category list all survive exactly as they are.
    fetch('/products.js', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('could not read products.js');
        return r.text();
      })
      .then(function (src) {
        var start = src.indexOf('const PRODUCTS = [');
        if (start === -1) throw new Error('could not find the PRODUCTS array');
        var end = src.indexOf('\n];', start);
        if (end === -1) throw new Error('could not find the end of the PRODUCTS array');

        var body = items.map(productBlock).join('\n');
        var out = src.slice(0, start) + 'const PRODUCTS = [\n' + body + src.slice(end);

        if (!serverMode) {
          var blob = new Blob([out], { type: 'text/javascript' });
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'products.js';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
          clearDirty();
          toast('Downloaded. Now replace products.js in GitHub and commit.');
          return null;
        }

        var btn = document.getElementById('saveBtn');
        btn.disabled = true;
        btn.textContent = 'Publishing...';

        return fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save',
            password: password,
            content: out,
            message: 'Update catalog: ' + items.length + ' products',
          }),
        })
          .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
          .then(function (res) {
            btn.disabled = false;
            applyMode();
            if (!res.ok) { alert(res.b.error || 'Could not save.'); return; }
            clearDirty();
            toast('Published. Live in about half a minute.');
          });
      })
      .catch(function (err) {
        alert(
          'Could not build the file: ' + err.message + '\n\n' +
          'If you opened this page by double clicking the file, run it through a local ' +
          'server instead: python -m http.server 4173'
        );
      });
  });

  /* -- description drafts ---------------------------------------------------
     A first sentence for the products that have none. It fills empty ones only,
     never overwrites what you wrote, and it says out loud that these are drafts,
     because a description that quietly invents a fact is worse than no
     description at all. ---------------------------------------------------- */

  function suggestDescription(p) {
    var byCategory = {
      'key-holders':
        'Printed to order in the colour you pick. Wall mounted, light, and sized ' +
        'for an everyday set of keys.',
      art:
        'A layered piece, printed to order in the colour you pick. It sits flat ' +
        'on a shelf or hangs on a wall.',
      desk:
        'A desk piece, printed to order in the colour you pick. Made to sit next ' +
        'to a monitor without taking over the desk.',
      custom:
        'Printed to order in the colour you pick. Message me if you want it ' +
        'resized or in a different combination.',
    };

    var text = byCategory[p.category] || byCategory.custom;
    if (p.printHours) text += ' About ' + p.printHours + ' hours on the printer.';
    return text;
  }

  var describeBtn = document.getElementById('describeBtn');
  if (describeBtn) {
    describeBtn.addEventListener('click', function () {
      var blank = items.filter(function (p) { return !String(p.description || '').trim(); });
      if (!blank.length) {
        toast('Every product already has a description');
        return;
      }
      if (!confirm(
        'Write a draft description for the ' + blank.length + ' products that have none?\n\n' +
        'It only fills empty ones and never touches what you wrote yourself.\n' +
        'Read them and fix anything that is wrong before you publish.'
      )) return;

      blank.forEach(function (p) { p.description = suggestDescription(p); });
      markDirty();
      render();
      toast(blank.length + ' drafts written. Read them before publishing.');
    });
  }

  /* -- bulk photos ----------------------------------------------------------
     Attaching seventy photos one product at a time is the reason the catalog has
     none. Drop the whole folder in, let the filenames find their own products,
     correct what it got wrong, upload once. ------------------------------- */

  var bulkPanel = document.getElementById('bulk');
  var dropEl = document.getElementById('drop');
  var matchesEl = document.getElementById('matches');
  var bulkFoot = document.getElementById('bulkFoot');
  var bulkSummary = document.getElementById('bulkSummary');
  var bulkBar = document.getElementById('bulkBar');
  var bulkFill = document.getElementById('bulkFill');

  var queue = [];
  var uploading = false;

  // Words that say nothing about which product a file belongs to.
  var STOP = {
    img: 1, image: 1, photo: 1, pic: 1, picture: 1, dsc: 1, dscn: 1, pxl: 1,
    screenshot: 1, final: 1, copy: 1, edit: 1, edited: 1, new: 1, old: 1,
    the: 1, and: 1, for: 1, with: 1, whatsapp: 1,
  };

  function tokenise(str) {
    var parts = String(str)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    // A trailing 1, 2, 3 is almost always "which photo", not "which product".
    while (parts.length > 1 && /^\d{1,2}$/.test(parts[parts.length - 1])) parts.pop();

    return parts.filter(function (t) { return !STOP[t]; });
  }

  function uniq(list) {
    var seen = {};
    return list.filter(function (t) {
      if (seen[t]) return false;
      seen[t] = 1;
      return true;
    });
  }

  // "key" and "holder" are in half the catalog, so matching them means almost
  // nothing. Rare words carry the decision. This is plain inverse document
  // frequency, which is all the situation needs.
  function buildIndex() {
    var df = {};
    var docs = items.map(function (p) {
      var t = uniq(tokenise(p.name + ' ' + p.id));
      t.forEach(function (x) { df[x] = (df[x] || 0) + 1; });
      return t;
    });
    var n = items.length || 1;
    return {
      docs: docs,
      weight: function (t) { return Math.log((n + 1) / ((df[t] || 0) + 1)) + 1; },
    };
  }

  function scoreAll(fileTokens, index) {
    var total = fileTokens.reduce(function (sum, t) { return sum + index.weight(t); }, 0);
    if (!total) return items.map(function (_, i) { return { i: i, score: 0 }; });

    return index.docs.map(function (doc, i) {
      var hit = 0;
      fileTokens.forEach(function (t) {
        if (doc.indexOf(t) !== -1) hit += index.weight(t);
      });
      return { i: i, score: hit / total };
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function confidence(score) {
    if (score >= 0.72) return { label: 'Strong match', cls: 'ok' };
    if (score >= 0.4) return { label: 'Probable, check it', cls: 'maybe' };
    return { label: 'No match, pick one', cls: 'no' };
  }

  function addFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []).filter(function (f) {
      return /^image\//.test(f.type);
    });
    if (!files.length) {
      toast('Those were not image files');
      return;
    }

    // Filename order, so photo 1 of a product lands before photo 2.
    files.sort(function (a, b) {
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    var index = buildIndex();

    files.forEach(function (file) {
      var t = tokenise(file.name);
      var ranked = scoreAll(t, index);
      var best = ranked[0] || { i: -1, score: 0 };
      queue.push({
        file: file,
        preview: URL.createObjectURL(file),
        // Below the floor nothing is pre-selected, so a bad guess is never
        // uploaded just because nobody noticed it.
        pick: best.score >= 0.4 ? items[best.i].id : '',
        score: best.score,
        ranked: ranked,
        state: '',
      });
    });

    renderMatches();
  }

  function renderMatches() {
    if (!queue.length) {
      matchesEl.innerHTML = '';
      bulkFoot.hidden = true;
      return;
    }
    bulkFoot.hidden = false;

    matchesEl.innerHTML = queue.map(function (q, k) {
      var c = confidence(q.pick ? q.score : 0);
      var options = q.ranked.map(function (r) {
        var p = items[r.i];
        if (!p) return '';
        return '<option value="' + esc(p.id) + '"' +
          (p.id === q.pick ? ' selected' : '') + '>' + esc(p.name) + '</option>';
      }).join('');

      return (
        '<div class="m' + (q.state ? ' ' + q.state : '') + '" data-k="' + k + '">' +
          '<img class="m-shot" src="' + esc(q.preview) + '" alt="">' +
          '<div class="m-info">' +
            '<span class="m-file" title="' + esc(q.file.name) + '">' + esc(q.file.name) + '</span>' +
            '<span class="m-score ' + c.cls + '">' + esc(c.label) + '</span>' +
          '</div>' +
          '<select class="m-pick" data-k="' + k + '" aria-label="Product for ' + esc(q.file.name) + '">' +
            '<option value="">Skip this photo</option>' + options +
          '</select>' +
          '<button class="m-rm" type="button" data-k="' + k + '" aria-label="Remove ' + esc(q.file.name) + '">&times;</button>' +
        '</div>'
      );
    }).join('');

    updateSummary();
  }

  function updateSummary() {
    var matched = queue.filter(function (q) { return q.pick; }).length;
    var skipped = queue.length - matched;
    bulkSummary.textContent =
      matched + ' of ' + queue.length + ' photos ready' +
      (skipped ? ', ' + skipped + ' will be skipped' : '');
    var go = document.getElementById('bulkGo');
    if (go) go.disabled = matched === 0 || uploading;
  }

  function resetBulk() {
    queue.forEach(function (q) {
      try { URL.revokeObjectURL(q.preview); } catch (err) {}
    });
    queue = [];
    if (bulkBar) bulkBar.hidden = true;
    if (bulkFill) bulkFill.style.width = '0%';
    renderMatches();
  }

  if (matchesEl) {
    matchesEl.addEventListener('change', function (e) {
      var sel = e.target.closest('.m-pick');
      if (!sel) return;
      var q = queue[Number(sel.dataset.k)];
      if (!q) return;
      q.pick = sel.value;
      // Chosen by hand, so it is as certain as it gets.
      if (sel.value) q.score = 1;
      renderMatches();
    });

    matchesEl.addEventListener('click', function (e) {
      var rm = e.target.closest('.m-rm');
      if (!rm) return;
      var k = Number(rm.dataset.k);
      try { URL.revokeObjectURL(queue[k].preview); } catch (err) {}
      queue.splice(k, 1);
      renderMatches();
    });
  }

  function uploadQueue() {
    if (uploading) return;
    if (!cloudinaryReady()) {
      alert(
        'Cloudinary is not set up yet.\n\n' +
        'Open admin/config.js and add your uploadPreset. Make it in Cloudinary under\n' +
        'Settings > Upload > Upload presets, with Signing Mode set to Unsigned.'
      );
      return;
    }

    var jobs = queue.filter(function (q) { return q.pick; });
    if (!jobs.length) return;

    uploading = true;
    bulkBar.hidden = false;
    updateSummary();

    var done = 0;
    var failed = 0;
    var at = 0;
    var active = 0;
    var LIMIT = 4; // enough to be quick, not enough to choke a home connection

    function paint() {
      var pct = Math.round(((done + failed) / jobs.length) * 100);
      bulkFill.style.width = pct + '%';
      bulkSummary.textContent =
        'Uploading ' + (done + failed) + ' of ' + jobs.length +
        (failed ? ', ' + failed + ' failed' : '');
    }

    function finish() {
      uploading = false;

      // Attached in queue order rather than in the order the uploads happened,
      // so photo 1 of a product stays photo 1.
      var added = 0;
      queue.forEach(function (q) {
        if (!q.url || !q.pick) return;
        var product = null;
        for (var i = 0; i < items.length; i++) {
          if (items[i].id === q.pick) { product = items[i]; break; }
        }
        if (!product) return;
        product.images = product.images || [];
        product.images.push(q.url);
        added++;
      });

      markDirty();
      render();

      if (failed) {
        bulkSummary.textContent =
          added + ' attached, ' + failed + ' failed. The failed ones are still listed, try again.';
        queue = queue.filter(function (q) { return !q.url && q.pick; });
        queue.forEach(function (q) { q.state = 'failed'; });
        renderMatches();
        toast(added + ' photos attached, ' + failed + ' failed');
      } else {
        resetBulk();
        bulkPanel.hidden = true;
        toast(added + ' photos attached. Save to publish them.');
      }
    }

    function next() {
      if (at >= jobs.length) {
        if (active === 0) finish();
        return;
      }
      var q = jobs[at++];
      active++;

      var form = new FormData();
      form.append('file', q.file);
      form.append('upload_preset', CLOUDINARY.uploadPreset);
      if (CLOUDINARY.folder) form.append('folder', CLOUDINARY.folder);

      fetch('https://api.cloudinary.com/v1_1/' + CLOUDINARY.cloudName + '/image/upload', {
        method: 'POST',
        body: form,
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.secure_url) {
            throw new Error((data.error && data.error.message) || 'upload refused');
          }
          q.url = data.secure_url;
          done++;
        })
        .catch(function (err) {
          failed++;
          console.error('Cloudinary upload failed for', q.file.name, err);
        })
        .then(function () {
          active--;
          paint();
          next();
        });

      if (active < LIMIT) next();
    }

    paint();
    next();
  }

  var bulkBtn = document.getElementById('bulkBtn');
  if (bulkBtn && bulkPanel) {
    bulkBtn.addEventListener('click', function () {
      bulkPanel.hidden = !bulkPanel.hidden;
      if (!bulkPanel.hidden) bulkPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('bulkClose').addEventListener('click', function () {
      bulkPanel.hidden = true;
    });
    document.getElementById('bulkReset').addEventListener('click', resetBulk);
    document.getElementById('bulkGo').addEventListener('click', uploadQueue);

    document.getElementById('dropPick').addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.addEventListener('change', function () { addFiles(input.files); });
      input.click();
    });

    ['dragenter', 'dragover'].forEach(function (evt) {
      dropEl.addEventListener(evt, function (e) {
        e.preventDefault();
        dropEl.classList.add('over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (evt) {
      dropEl.addEventListener(evt, function () { dropEl.classList.remove('over'); });
    });
    dropEl.addEventListener('drop', function (e) {
      e.preventDefault();
      dropEl.classList.remove('over');
      addFiles(e.dataTransfer && e.dataTransfer.files);
    });

    // A photo dropped slightly off target would otherwise replace the page with
    // the image, losing the whole draft.
    ['dragover', 'drop'].forEach(function (evt) {
      window.addEventListener(evt, function (e) {
        if (dropEl.contains(e.target)) return;
        if (impDrop && impDrop.contains(e.target)) return;
        e.preventDefault();
      });
    });
  }

  /* -- marketplace import ---------------------------------------------------
     Facebook will hand you an HTML export of your own listings, on request. It
     carries titles, descriptions and dates, and does not carry prices, photos or
     listing links. So this fills what it can and says plainly what it cannot.

     Everything happens in this page. The file is read here and never uploaded.
     ------------------------------------------------------------------------ */

  var IMPORT_KEY = 'kadprints.admin.lastImport';
  var IMPORT_EVERY_DAYS = 14;

  function paintNudge() {
    var el = document.getElementById('impNudge');
    if (!el) return;

    var last = null;
    try { last = localStorage.getItem(IMPORT_KEY); } catch (err) {}

    if (!last) {
      el.hidden = false;
      el.textContent =
        'You have not imported a Marketplace export here yet. It fills in listings the ' +
        'catalog is missing, and the descriptions you already wrote on Facebook.';
      return;
    }

    var days = Math.floor((Date.now() - new Date(last + 'T00:00:00Z').getTime()) / 86400000);
    if (isNaN(days) || days < IMPORT_EVERY_DAYS) { el.hidden = true; return; }

    el.hidden = false;
    el.textContent =
      'Your last Marketplace import was ' + days + ' days ago. Facebook only produces an ' +
      'export when you ask for one, so this cannot run on its own: request a fresh export ' +
      'and drop it in.';
  }

  var MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  // "Sep 15, 2026 10:36:48 am" -> "2026-09-15". Built by hand rather than given
  // to Date(), which parses that string differently from one browser to the next.
  function exportDate(value) {
    var m = /^([A-Za-z]{3})[a-z]*\s+(\d{1,2}),\s*(\d{4})/.exec(String(value || '').trim());
    if (!m) return '';
    var month = MONTHS[m[1].toLowerCase()];
    if (month === undefined) return '';
    var d = new Date(Date.UTC(Number(m[3]), month, Number(m[2])));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  // Each listing is the innermost <section> that holds a Title row. Anchoring on
  // that rather than on Facebook's class names, which are generated and change.
  function parseExport(text) {
    var doc = new DOMParser().parseFromString(text, 'text/html');

    function fieldsOf(section) {
      var out = {};
      var rows = section.querySelectorAll('tr');
      Array.prototype.forEach.call(rows, function (tr) {
        // A two cell row is a field. The location and image-size rows use one
        // cell with colspan and wrap a whole table, so they fall out here.
        if (tr.children.length !== 2) return;
        var key = (tr.children[0].textContent || '').trim();
        var val = (tr.children[1].textContent || '').trim();
        // "Update time" appears twice; the first is the listing's own.
        if (key && !(key in out)) out[key] = val;
      });
      return out;
    }

    function hasTitle(section) {
      return Boolean(fieldsOf(section).Title);
    }

    var blocks = Array.prototype.filter.call(doc.querySelectorAll('section'), function (sec) {
      if (!hasTitle(sec)) return false;
      // Keep only the innermost one, or every ancestor would count as a listing.
      return !Array.prototype.some.call(sec.querySelectorAll('section'), hasTitle);
    });

    return blocks.map(function (sec) {
      var f = fieldsOf(sec);
      return {
        title: f.Title || '',
        description: f.Description || '',
        listed: exportDate(f['Creation time']),
        photos: Number(f['Attached image count'] || 0) || 0,
        group: f.Name || '',
      };
    }).filter(function (r) { return r.title; });
  }

  // Words that say "this is something I bought and am reselling" and words that
  // say "this is something I printed". A resale word wins, so a Tesla charger
  // does not sneak in on the strength of the word "adapter".
  var RESALE_WORDS = [
    'tesla charger', 'mobile charger', 'nema', 'j1772', 'adapter', 'watch',
    'clutch', 'wallet', 'puzzle', 'trimmer', 'curtain motor', 'seiko',
    'armani', 'oris', 'poljot',
  ];
  var PRINT_WORDS = [
    'key holder', 'keyholder', 'key hanger', 'keychain', 'key chain', 'hanger',
    'holder', 'sculpture', 'painting', 'shelf', 'frame', 'statue', 'logo',
    'ashtray', 'organizer', 'organiser',
  ];

  function hasAny(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (text.indexOf(words[i]) !== -1) return true;
    }
    return false;
  }

  function looksPrinted(title) {
    var t = String(title).toLowerCase();
    if (hasAny(t, RESALE_WORDS)) return false;
    return hasAny(t, PRINT_WORDS);
  }

  function guessCategory(title) {
    var t = String(title).toLowerCase();
    if (hasAny(t, ['sculpture', 'painting', 'statue'])) return 'art';
    if (hasAny(t, ['shelf', 'frame', 'logo', 'ashtray', 'organizer', 'organiser'])) return 'desk';
    if (hasAny(t, ['key holder', 'keyholder', 'key hanger', 'keychain', 'key chain', 'hanger', 'holder'])) {
      return 'key-holders';
    }
    return 'custom';
  }

  // The export is all lowercase. A word carrying a digit is a model name and goes
  // up whole: rs6 -> RS6, lc500 -> LC500.
  var UPPER_WORDS = { gt: 1, gtr: 1, svj: 1, amg: 1, bmw: 1, vw: 1, rs: 1, f1: 1 };
  var SMALL_WORDS = {
    a: 1, an: 1, and: 1, the: 1, or: 1, of: 1, for: 1, with: 1, to: 1, in: 1, on: 1,
  };

  function titleCase(text) {
    var first = true;
    // Matched as runs of letters and digits rather than split on spaces, so that
    // "key holder/hanger" and "(custom built)" both come out right. An
    // apostrophe stays inside the word, or "men's" becomes "Men'S".
    return String(text).replace(/[a-z0-9]+(?:['’][a-z]+)?/gi, function (word) {
      var lower = word.toLowerCase();
      var wasFirst = first;
      first = false;
      if (/\d/.test(word) || UPPER_WORDS[lower]) return word.toUpperCase();
      if (!wasFirst && SMALL_WORDS[lower]) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
  }

  function normal(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Works out, for every listing in the export, whether it is new, whether it
  // improves something already in the catalog, or whether it should be left out.
  function planImport(records) {
    var seen = {};
    var unique = [];

    records.forEach(function (r) {
      // Cross-posting the same piece to four groups produces four identical
      // entries. Same title and same words means the same listing.
      var key = normal(r.title) + '|' + normal(r.description);
      if (seen[key]) {
        seen[key].copies++;
        // Keep the earliest date: that is when it first went up.
        if (r.listed && (!seen[key].listed || r.listed < seen[key].listed)) seen[key].listed = r.listed;
        return;
      }
      r.copies = 1;
      seen[key] = r;
      unique.push(r);
    });

    var index = buildIndex();
    var rows = [];

    unique.forEach(function (r) {
      var ranked = scoreAll(tokenise(r.title), index);
      var best = ranked[0] || { i: -1, score: 0 };
      var match = best.score >= 0.72 ? items[best.i] : null;

      if (!looksPrinted(r.title)) {
        rows.push({
          kind: 'skip', on: false, rec: r,
          reason: match ? 'Not a printed piece' : 'Not a printed piece, and not in the catalog',
        });
        return;
      }

      if (match) {
        var fillsDescription = Boolean(r.description) && !String(match.description || '').trim();
        var fillsDate = Boolean(r.listed) && !String(match.listed || '').trim();
        if (!fillsDescription && !fillsDate) {
          rows.push({
            kind: 'skip', on: false, rec: r, match: match,
            reason: 'Already in the catalog, nothing to add',
          });
          return;
        }
        rows.push({
          kind: 'update', on: true, rec: r, match: match,
          fillsDescription: fillsDescription, fillsDate: fillsDate,
          reason: [
            fillsDescription ? 'adds the description' : '',
            fillsDate ? 'adds the date listed' : '',
          ].filter(Boolean).join(' and '),
        });
        return;
      }

      rows.push({
        kind: 'new', on: true, rec: r,
        category: guessCategory(r.title),
        reason: 'Not in the catalog',
      });
    });

    return rows;
  }

  var impPlan = [];

  var impPanel = document.getElementById('imp');
  var impDrop = document.getElementById('impDrop');
  var impOut = document.getElementById('impOut');
  var impSummary = document.getElementById('impSummary');
  var impGroups = document.getElementById('impGroups');

  var GROUP_TITLES = {
    'new': 'New pieces to add',
    update: 'Already here, and the export fills a gap',
    skip: 'Left out',
  };

  function renderPlan() {
    if (!impPlan.length) {
      impOut.hidden = true;
      return;
    }
    impOut.hidden = false;

    var html = '';
    ['new', 'update', 'skip'].forEach(function (kind) {
      var rows = impPlan.map(function (row, k) { return { row: row, k: k }; })
        .filter(function (x) { return x.row.kind === kind; });
      if (!rows.length) return;

      html += '<div class="imp-group"><h3>' + esc(GROUP_TITLES[kind]) +
        ' <span class="n">' + rows.length + '</span></h3>';

      html += rows.map(function (x) {
        var row = x.row;
        var r = row.rec;
        var bits = [row.reason];
        if (r.listed) bits.push('listed ' + r.listed);
        if (r.copies > 1) bits.push(r.copies + ' copies in the export, merged');
        if (r.photos) bits.push(r.photos + ' photo' + (r.photos === 1 ? '' : 's') + ' on Facebook');

        return (
          '<label class="ir">' +
            '<input type="checkbox" data-k="' + x.k + '"' + (row.on ? ' checked' : '') + '>' +
            '<span class="ir-text">' +
              '<span class="ir-title">' + esc(titleCase(r.title)) + '</span>' +
              (r.description
                ? '<span class="ir-desc">' + esc(r.description) + '</span>'
                : '<span class="ir-desc none">no description in the export</span>') +
              '<span class="ir-meta">' + esc(bits.join('  ·  ')) + '</span>' +
            '</span>' +
            (row.kind === 'new'
              ? '<select class="ir-cat" data-k="' + x.k + '">' + categoryOptions(row.category) + '</select>'
              : '') +
          '</label>'
        );
      }).join('');

      html += '</div>';
    });

    impGroups.innerHTML = html;

    var on = impPlan.filter(function (r) { return r.on; });
    var adds = on.filter(function (r) { return r.kind === 'new'; }).length;
    var updates = on.filter(function (r) { return r.kind === 'update'; }).length;
    impSummary.textContent =
      adds + ' to add, ' + updates + ' to fill in, out of ' + impPlan.length +
      ' listings in the export. Nothing changes until you press the button.';
  }

  function readFile(file) {
    if (file.text) return file.text();
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(String(fr.result)); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsText(file);
    });
  }

  function takeExport(file) {
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      alert(
        'That is not the right file.\n\n' +
        'Inside the download, the one you want is your_marketplace_items.html'
      );
      return;
    }

    readFile(file).then(function (text) {
      var records;
      try { records = parseExport(text); }
      catch (err) { records = []; }

      if (!records.length) {
        alert(
          'No listings were found in that file.\n\n' +
          'It should be your_marketplace_items.html from a Marketplace download, ' +
          'requested in HTML rather than JSON.'
        );
        return;
      }

      impPlan = planImport(records);
      renderPlan();
    }).catch(function (err) {
      alert('Could not read that file: ' + err.message);
    });
  }

  if (impGroups) {
    impGroups.addEventListener('change', function (e) {
      var box = e.target.closest('input[type="checkbox"]');
      if (box) {
        var row = impPlan[Number(box.dataset.k)];
        if (row) row.on = box.checked;
        renderPlan();
        return;
      }
      var sel = e.target.closest('.ir-cat');
      if (sel) {
        var r2 = impPlan[Number(sel.dataset.k)];
        if (r2) r2.category = sel.value;
      }
    });
  }

  function applyImport() {
    var chosen = impPlan.filter(function (r) { return r.on; });
    if (!chosen.length) return;

    var added = 0;
    var filled = 0;

    // Added in reverse so they end up at the top in the order they were listed.
    chosen.filter(function (r) { return r.kind === 'new'; }).reverse().forEach(function (row) {
      var r = row.rec;
      items.unshift({
        id: uniqueId(slug(r.title)),
        name: titleCase(r.title),
        category: row.category,
        // The export has no price. Left empty on purpose rather than invented.
        price: '',
        listed: r.listed || new Date().toISOString().slice(0, 10),
        description: r.description || '',
        printHours: null,
        images: [],
        colors: [],
        marketplaceUrl: '',
      });
      added++;
    });

    chosen.filter(function (r) { return r.kind === 'update'; }).forEach(function (row) {
      if (row.fillsDescription) row.match.description = row.rec.description;
      if (row.fillsDate) row.match.listed = row.rec.listed;
      filled++;
    });

    try { localStorage.setItem(IMPORT_KEY, new Date().toISOString().slice(0, 10)); } catch (err) {}

    impPlan = [];
    renderPlan();
    impPanel.hidden = true;
    paintNudge();

    markDirty();
    render();

    var parts = [];
    if (added) parts.push(added + ' added');
    if (filled) parts.push(filled + ' filled in');
    toast(parts.join(', ') + '. Set their prices, then save.');

    if (added) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  var impBtn = document.getElementById('impBtn');
  if (impBtn && impPanel) {
    impBtn.addEventListener('click', function () {
      impPanel.hidden = !impPanel.hidden;
      if (!impPanel.hidden) impPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('impClose').addEventListener('click', function () {
      impPanel.hidden = true;
    });
    document.getElementById('impReset').addEventListener('click', function () {
      impPlan = [];
      renderPlan();
    });
    document.getElementById('impApply').addEventListener('click', applyImport);

    document.getElementById('impPick').addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.html,.htm,text/html';
      input.addEventListener('change', function () { takeExport(input.files[0]); });
      input.click();
    });

    ['dragenter', 'dragover'].forEach(function (evt) {
      impDrop.addEventListener(evt, function (e) {
        e.preventDefault();
        impDrop.classList.add('over');
      });
    });
    ['dragleave', 'dragend'].forEach(function (evt) {
      impDrop.addEventListener(evt, function () { impDrop.classList.remove('over'); });
    });
    impDrop.addEventListener('drop', function (e) {
      e.preventDefault();
      impDrop.classList.remove('over');
      takeExport(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  }
})();
