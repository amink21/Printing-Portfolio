/* ============================================================================
   Kad Prints - catalog behaviour
   ----------------------------------------------------------------------------
   No framework and no build step, because the brief asks for a site that stays
   editable by hand. Everything reads from products.js.
   ========================================================================== */

(function () {
  'use strict';

  var grid = document.getElementById('grid');
  var chipsEl = document.getElementById('chips');
  var searchEl = document.getElementById('search');
  var countEl = document.getElementById('resultCount');
  var emptyEl = document.getElementById('empty');
  var clearBtn = document.getElementById('clearFilters');

  var dialog = document.getElementById('detail');
  var dCat = document.getElementById('detailCat');
  var dName = document.getElementById('detailName');
  var dPrice = document.getElementById('detailPrice');
  var dDesc = document.getElementById('detailDesc');
  var dSpecs = document.getElementById('detailSpecs');
  var dStage = document.getElementById('detailStage');
  var dThumbs = document.getElementById('detailThumbs');
  var dCta = document.getElementById('detailCta');
  var dNote = document.getElementById('detailNote');
  var dAlt = document.getElementById('detailAlt');
  var dClose = document.getElementById('detailClose');

  var products = [];
  var activeCategory = 'all';
  var query = '';
  var lastFocused = null;

  // One source of truth for every outbound link. Falls back to Marketplace
  // search so a blank config never produces a dead button.
  var MARKETPLACE_FALLBACK = 'https://www.facebook.com/marketplace/';
  function sellerUrl() {
    return (typeof SELLER === 'object' && SELLER && SELLER.marketplaceProfileUrl) ||
      MARKETPLACE_FALLBACK;
  }
  function contactUrl() {
    return (typeof SELLER === 'object' && SELLER && SELLER.messengerUrl) || sellerUrl();
  }
  function hasSellerProfile() {
    return Boolean(typeof SELLER === 'object' && SELLER && SELLER.marketplaceProfileUrl);
  }

  /* -- helpers ------------------------------------------------------------ */

  function categoryLabel(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i].label;
    }
    return id;
  }

  // Stable per product, so a given item always draws the same placeholder.
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function initials(name) {
    var words = String(name).split(/\s+/).filter(function (w) {
      return /^[a-z0-9]/i.test(w);
    });
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // The placeholder for a product whose photo has not arrived. Light, quiet, and
  // composed so it reads as a shot still to come rather than a broken image. The
  // tint shifts a little per product so a screen of them is not one flat block,
  // staying inside the accent's own blue rather than introducing new colour.
  function placeholderMarkup(product) {
    var h = hash(product.id || product.name);
    var shift = (h % 22) - 11;
    var tint = 'hsl(' + (218 + shift) + ', 68%, 94%)';
    var foot = product.printHours ? product.printHours + ' h print' : 'Photo coming';
    return (
      '<div class="ptile" style="--tint:' + tint + '">' +
      '<span class="ptile-initials">' + esc(initials(product.name)) + '</span>' +
      '<span class="ptile-foot">' + esc(foot) + '</span>' +
      '</div>'
    );
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function firstImage(product) {
    return product.images && product.images.length ? product.images[0] : null;
  }

  /* -- rendering ---------------------------------------------------------- */

  function visible() {
    var q = query.trim().toLowerCase();
    return products.filter(function (p) {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (!q) return true;
      return (p.name + ' ' + (p.description || '')).toLowerCase().indexOf(q) !== -1;
    });
  }

  function renderChips() {
    var counts = { all: products.length };
    products.forEach(function (p) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    var list = [{ id: 'all', label: 'Everything' }].concat(
      // A category nobody has products in yet is not shown, so the filter row
      // never offers a dead end.
      CATEGORIES.filter(function (c) {
        return counts[c.id];
      })
    );

    chipsEl.innerHTML = list
      .map(function (c) {
        var on = c.id === activeCategory;
        return (
          '<button type="button" class="chip" data-cat="' + esc(c.id) + '"' +
          ' aria-pressed="' + on + '">' + esc(c.label) +
          '<span class="n">' + (counts[c.id] || 0) + '</span></button>'
        );
      })
      .join('');
  }

  function renderGrid() {
    var list = visible();

    countEl.textContent =
      list.length === products.length
        ? products.length + ' pieces'
        : list.length + ' of ' + products.length + ' pieces';

    if (!list.length) {
      grid.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    grid.innerHTML = list
      .map(function (p) {
        var img = firstImage(p);
        var media = img
          ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">'
          : placeholderMarkup(p);

        var sub = [];
        if (p.printHours) sub.push(p.printHours + ' h print');
        sub.push(categoryLabel(p.category));

        return (
          '<button type="button" class="card" data-id="' + esc(p.id) + '">' +
          '<span class="card-media">' + media + '</span>' +
          '<span class="card-body">' +
          '<span class="card-price">' + esc(p.price) + '</span>' +
          '<span class="card-name">' + esc(p.name) + '</span>' +
          '<span class="card-sub">' + esc(sub.join(' · ')) + '</span>' +
          '</span>' +
          '</button>'
        );
      })
      .join('');

    reveal();
  }

  // Scroll reveal via IntersectionObserver rather than a scroll listener, which
  // would run on every frame and stutter on a phone.
  var observer = null;
  var revealFallback = null;
  function reveal() {
    var cards = grid.querySelectorAll('.card');
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('in'); });
      return;
    }
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = Number(entry.target.dataset.i || 0);
          entry.target.style.transitionDelay = Math.min(i % 12, 8) * 24 + 'ms';
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '80px' }
    );
    cards.forEach(function (c, i) {
      c.dataset.i = i;
      observer.observe(c);
    });

    // Safety net. A card that never intersects (anchor jump, odd viewport, an
    // observer that misfires) would otherwise sit at opacity 0 forever. Nothing
    // in this grid is ever allowed to stay invisible.
    clearTimeout(revealFallback);
    revealFallback = setTimeout(function () {
      grid.querySelectorAll('.card:not(.in)').forEach(function (c) {
        c.style.transitionDelay = '0ms';
        c.classList.add('in');
      });
    }, 1400);
  }

  /* -- detail sheet ------------------------------------------------------- */

  var current = null;
  var currentIndex = 0;

  function showImage(index) {
    if (!current) return;
    var imgs = current.images || [];
    currentIndex = index;

    dStage.innerHTML = imgs.length
      ? '<img src="' + esc(imgs[index]) + '" alt="' + esc(current.name) + '" decoding="async">'
      : placeholderMarkup(current);

    Array.prototype.forEach.call(dThumbs.children, function (t, i) {
      t.setAttribute('aria-current', String(i === index));
    });
  }

  function openDetail(product) {
    current = product;
    lastFocused = document.activeElement;

    dCat.textContent = categoryLabel(product.category);
    dName.textContent = product.name;
    dPrice.textContent = product.price || '';
    dDesc.textContent = product.description || '';

    // Each spec is one cell holding a stacked label and value. A bare dt/dd
    // sequence in a 2-column grid lands label-left value-right instead.
    var specs = '';
    if (product.printHours) {
      specs += '<div class="spec"><dt>Print time</dt><dd>' + esc(product.printHours) + ' hours</dd></div>';
    }
    specs += '<div class="spec"><dt>Made</dt><dd>To order</dd></div>';
    dSpecs.innerHTML = specs;

    var imgs = product.images || [];
    dThumbs.innerHTML =
      imgs.length > 1
        ? imgs
            .map(function (src, i) {
              return (
                '<button type="button" class="thumb" data-i="' + i + '"' +
                ' aria-current="' + (i === 0) + '"' +
                ' aria-label="Photo ' + (i + 1) + '">' +
                '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></button>'
              );
            })
            .join('')
        : '';

    showImage(0);

    // No live listing means no button, rather than a link that goes nowhere.
    var notes = [];
    if (!imgs.length) notes.push('Photos of this one are coming.');

    if (product.marketplaceUrl) {
      dCta.href = product.marketplaceUrl;
      dCta.hidden = false;
      dAlt.hidden = true;
    } else {
      // No per-product link recorded. That does not mean the piece is unlisted, so
      // send them to the profile rather than claiming it is unavailable.
      dCta.hidden = true;
      dAlt.href = sellerUrl();
      dAlt.hidden = false;
      notes.push(
        hasSellerProfile()
          ? 'Find this one on my Marketplace page, or message me and I will print it.'
          : 'Message me on Marketplace and I will print one.'
      );
    }
    dNote.textContent = notes.join(' ');

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDetail() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  /* -- events ------------------------------------------------------------- */

  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    renderChips();
    renderGrid();
  });

  searchEl.addEventListener('input', function (e) {
    query = e.target.value;
    renderGrid();
  });

  clearBtn.addEventListener('click', function () {
    activeCategory = 'all';
    query = '';
    searchEl.value = '';
    renderChips();
    renderGrid();
  });

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card) return;
    var product = products.filter(function (p) {
      return p.id === card.dataset.id;
    })[0];
    if (product) openDetail(product);
  });

  dThumbs.addEventListener('click', function (e) {
    var thumb = e.target.closest('.thumb');
    if (thumb) showImage(Number(thumb.dataset.i));
  });

  dClose.addEventListener('click', closeDetail);

  // Clicking the backdrop closes. The dialog element itself fills the viewport,
  // so a click that lands on it rather than on its inner panel is a backdrop hit.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDetail();
  });

  dialog.addEventListener('close', function () {
    current = null;
    dStage.innerHTML = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  });

  document.addEventListener('keydown', function (e) {
    if (!dialog.open || !current) return;
    var imgs = current.images || [];
    if (imgs.length < 2) return;
    if (e.key === 'ArrowRight') showImage((currentIndex + 1) % imgs.length);
    if (e.key === 'ArrowLeft') showImage((currentIndex - 1 + imgs.length) % imgs.length);
  });

  /* -- data --------------------------------------------------------------- */

  // Minimal CSV reader: handles quoted fields and embedded commas, which is all
  // a Google Sheet export produces.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
    return rows;
  }

  function fromSheet(text) {
    var rows = parseCsv(text).filter(function (r) {
      return r.some(function (c) { return String(c).trim() !== ''; });
    });
    if (rows.length < 2) return [];

    var headers = rows[0].map(function (h) { return String(h).trim(); });
    return rows.slice(1).map(function (r) {
      var o = {};
      headers.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
      return {
        id: o.id || (o.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: o.name || 'Untitled',
        category: o.category || 'custom',
        price: o.price || '',
        description: o.description || '',
        printHours: o.printHours ? Number(o.printHours) : null,
        images: o.images
          ? o.images.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
          : [],
        marketplaceUrl: o.marketplaceUrl || '',
      };
    }).filter(function (p) { return p.name && p.name !== 'Untitled'; });
  }

  function start(list) {
    products = list;
    renderChips();
    renderGrid();
  }

  // Outbound links, all from the one config block in products.js.
  ['navListings', 'footListings'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.href = sellerUrl();
  });
  var contactCta = document.getElementById('contactCta');
  var contactLabel = document.getElementById('contactCtaLabel');
  if (contactCta) contactCta.href = contactUrl();
  if (contactLabel && hasSellerProfile()) {
    contactLabel.textContent = 'See all my listings';
  }

  // The header lifts off the page once the top of the document leaves view.
  // A sentinel plus an observer, rather than a scroll handler that would run on
  // every frame.
  var sentinel = document.getElementById('scrollSentinel');
  var topbar = document.querySelector('.topbar');
  if (sentinel && topbar && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      topbar.classList.toggle('lifted', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  if (typeof SHEET_CSV_URL === 'string' && SHEET_CSV_URL) {
    fetch(SHEET_CSV_URL)
      .then(function (r) {
        if (!r.ok) throw new Error('sheet unreachable');
        return r.text();
      })
      .then(function (text) {
        var live = fromSheet(text);
        // An empty or broken sheet must not blank the site.
        start(live.length ? live : PRODUCTS);
      })
      .catch(function () {
        start(PRODUCTS);
      });
  } else {
    start(PRODUCTS);
  }
})();
