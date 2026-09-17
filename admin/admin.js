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
    var ids = {};
    items.forEach(function (p) {
      if (!p.id) problems.push('A product has no id.');
      else if (ids[p.id]) problems.push('Two products share the id "' + p.id + '". Links to them would collide.');
      ids[p.id] = true;
      if (!p.name) problems.push('A product has no name.');
    });
    if (problems.length) {
      warnEl.hidden = false;
      warnEl.textContent = problems.slice(0, 4).join(' ');
    } else {
      warnEl.hidden = true;
    }
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

          '<div class="f c12"><label>Marketplace link for this piece</label>' +
            '<input data-f="marketplaceUrl" data-i="' + i + '" placeholder="https://www.facebook.com/marketplace/item/..." value="' + esc(p.marketplaceUrl || '') + '"></div>' +

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
    else p[f] = el.value;

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
    fetch('../products.js', { cache: 'no-store' })
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
})();
