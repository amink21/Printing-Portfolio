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
  var sortEl = document.getElementById('sort');
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
  var sortBy = 'newest';
  var lastFocused = null;

  var NEW_DAYS = 14;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function reduced() { return reduce.matches; }

  // View Transitions where the browser has them, a plain call where it does not.
  // Every caller works either way, so nothing is gated on support.
  var transitioning = false;
  function withTransition(fn) {
    if (
      reduced() ||
      !document.startViewTransition ||
      transitioning ||
      document.visibilityState !== 'visible'
    ) {
      fn();
      return;
    }

    transitioning = true;
    var vt;
    try {
      vt = document.startViewTransition(fn);
    } catch (err) {
      // Some states refuse a transition outright. The update still has to run.
      transitioning = false;
      fn();
      return;
    }

    // An aborted transition rejects these. That is a normal outcome, not a
    // failure worth reporting, but an uncaught rejection would surface as an
    // error in the console.
    var done = function () { transitioning = false; };
    if (vt && vt.finished && vt.finished.then) vt.finished.then(done, done);
    else transitioning = false;
    if (vt && vt.ready && vt.ready.then) vt.ready.then(null, function () {});
    if (vt && vt.updateCallbackDone && vt.updateCallbackDone.then) {
      vt.updateCallbackDone.then(null, function () {});
    }
  }

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

  function byId(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
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

  function priceNumber(p) {
    var n = parseFloat(String(p.price || '').replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function isNew(p) {
    if (!p.listed) return false;
    var then = new Date(p.listed + 'T00:00:00Z').getTime();
    if (isNaN(then)) return false;
    return (Date.now() - then) / 86400000 <= NEW_DAYS;
  }

  // The placeholder for a product whose photo has not arrived. Light, quiet, and
  // composed so it reads as a shot still to come rather than a broken image.
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
    var list = products.filter(function (p) {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (!q) return true;
      return (p.name + ' ' + (p.description || '')).toLowerCase().indexOf(q) !== -1;
    });

    if (sortBy === 'price-asc') list.sort(function (a, b) { return priceNumber(a) - priceNumber(b); });
    else if (sortBy === 'price-desc') list.sort(function (a, b) { return priceNumber(b) - priceNumber(a); });
    else list.sort(function (a, b) { return String(b.listed || '').localeCompare(String(a.listed || '')); });

    return list;
  }

  function renderChips() {
    var counts = { all: products.length };
    products.forEach(function (p) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    var list = [{ id: 'all', label: 'Everything' }].concat(
      // A category nobody has products in yet is not shown, so the filter row
      // never offers a dead end.
      CATEGORIES.filter(function (c) { return counts[c.id]; })
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

  function cardMarkup(p) {
    var img = firstImage(p);
    var media = img
      ? '<img src="' + esc(img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">'
      : placeholderMarkup(p);

    var sub = [];
    if (p.printHours) sub.push(p.printHours + ' h print');
    sub.push(categoryLabel(p.category));

    return (
      '<button type="button" class="card" data-id="' + esc(p.id) + '">' +
      '<span class="card-media' + (img ? ' loading' : '') + '">' + media +
      (isNew(p) ? '<span class="flag">Just listed</span>' : '') +
      '</span>' +
      '<span class="card-body">' +
      '<span class="card-price">' + esc(p.price) + '</span>' +
      '<span class="card-name">' + esc(p.name) + '</span>' +
      '<span class="card-sub">' + esc(sub.join(' · ')) + '</span>' +
      '</span>' +
      '</button>'
    );
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

    grid.innerHTML = list.map(cardMarkup).join('');
    watchImages();
    reveal();
  }

  // Cards that survive a filter change slide to their new position instead of
  // being torn down and rebuilt. Measure before, measure after, play the
  // difference backwards. Works in every browser, unlike a view transition.
  function renderGridFlip() {
    if (reduced()) { renderGrid(); return; }

    var before = {};
    grid.querySelectorAll('.card').forEach(function (c) {
      before[c.dataset.id] = c.getBoundingClientRect();
    });

    renderGrid();

    grid.querySelectorAll('.card').forEach(function (c) {
      var was = before[c.dataset.id];
      if (!was) return; // new to this view, let it fade in normally
      var now = c.getBoundingClientRect();
      var dx = was.left - now.left;
      var dy = was.top - now.top;
      c.classList.add('in'); // it was already on screen, do not re-fade it
      if (!dx && !dy) return;
      c.style.transition = 'none';
      c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(function () {
        c.style.transition = '';
        c.style.transform = '';
      });
    });
  }

  // Real photos get a shimmer until they paint, so a slow connection shows a
  // loading surface rather than an empty hole.
  function watchImages() {
    grid.querySelectorAll('.card-media.loading img').forEach(function (img) {
      if (img.complete) {
        img.parentNode.classList.remove('loading');
        return;
      }
      img.addEventListener('load', function () {
        img.parentNode.classList.remove('loading');
      }, { once: true });
      img.addEventListener('error', function () {
        img.parentNode.classList.remove('loading');
      }, { once: true });
    });
  }

  // Where the browser supports scroll-driven CSS animation the reveal is done
  // entirely in the stylesheet, off the main thread. This observer is the
  // fallback for everything else.
  var cssScrollDriven =
    window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()');
  var observer = null;
  var revealFallback = null;

  function reveal() {
    if (cssScrollDriven || reduced()) return;

    var cards = grid.querySelectorAll('.card:not(.in)');
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

    // Safety net. A card that never intersects would otherwise sit at opacity 0
    // forever. Nothing in this grid is ever allowed to stay invisible.
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
  var suppressHash = false;

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

  function fillDetail(product) {
    current = product;

    dCat.textContent = categoryLabel(product.category);
    dName.textContent = product.name;
    dPrice.textContent = product.price || '';
    dDesc.textContent = product.description || '';

    // Each spec is one cell holding a stacked label and value.
    var specs = '';
    if (product.printHours) {
      specs += '<div class="spec"><dt>Print time</dt><dd>' + esc(product.printHours) + ' hours</dd></div>';
    }
    specs += '<div class="spec"><dt>Made</dt><dd>To order</dd></div>';
    dSpecs.innerHTML = specs;

    var imgs = product.images || [];
    dThumbs.innerHTML =
      imgs.length > 1
        ? imgs.map(function (src, i) {
            return (
              '<button type="button" class="thumb" data-i="' + i + '"' +
              ' aria-current="' + (i === 0) + '"' +
              ' aria-label="Photo ' + (i + 1) + '">' +
              '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async"></button>'
            );
          }).join('')
        : '';

    showImage(0);

    var notes = [];
    if (!imgs.length) notes.push('Photos of this one are coming.');

    if (product.marketplaceUrl) {
      dCta.href = product.marketplaceUrl;
      dCta.hidden = false;
      dAlt.hidden = true;
    } else {
      // No per-product link recorded. That does not mean the piece is unlisted,
      // so send them to the profile rather than claiming it is unavailable.
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
  }

  function openDetail(product, pushHistory) {
    lastFocused = document.activeElement;

    // Name the tapped tile and the detail stage the same thing, and the browser
    // morphs one into the other instead of cross-fading the whole page.
    var sourceMedia = grid.querySelector('.card[data-id="' + product.id + '"] .card-media');
    if (sourceMedia) sourceMedia.style.viewTransitionName = 'product-media';

    withTransition(function () {
      fillDetail(product);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });

    // The name has to be released, or the next open finds two elements claiming it.
    setTimeout(function () {
      if (sourceMedia) sourceMedia.style.viewTransitionName = '';
    }, 600);

    if (pushHistory !== false) {
      suppressHash = true;
      history.pushState({ product: product.id }, '', '#' + product.id);
      suppressHash = false;
    }
  }

  function closeDetail(popHistory) {
    withTransition(function () {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
    if (popHistory !== false && location.hash) history.back();
  }

  /* -- events ------------------------------------------------------------- */

  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    renderChips();
    renderGridFlip();
  });

  searchEl.addEventListener('input', function (e) {
    query = e.target.value;
    renderGridFlip();
  });

  if (sortEl) {
    sortEl.addEventListener('change', function (e) {
      sortBy = e.target.value;
      renderGridFlip();
    });
  }

  clearBtn.addEventListener('click', function () {
    activeCategory = 'all';
    query = '';
    searchEl.value = '';
    renderChips();
    renderGridFlip();
  });

  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card) return;
    var product = byId(card.dataset.id);
    if (product) openDetail(product);
  });

  dThumbs.addEventListener('click', function (e) {
    var thumb = e.target.closest('.thumb');
    if (thumb) showImage(Number(thumb.dataset.i));
  });

  dClose.addEventListener('click', function () { closeDetail(); });

  // Clicking the backdrop closes. The dialog element fills the viewport, so a
  // click landing on it rather than on its inner panel is a backdrop hit.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDetail();
  });

  // Escape closes the dialog natively, which fires this without going through
  // closeDetail, so the history entry has to be dropped here too.
  dialog.addEventListener('cancel', function () {
    if (location.hash) {
      setTimeout(function () { history.back(); }, 0);
    }
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

  // Swipe between photos on a phone, where there is no keyboard and the thumbs
  // are small.
  var touchX = null;
  dStage.addEventListener('touchstart', function (e) {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  dStage.addEventListener('touchend', function (e) {
    if (touchX === null || !current) return;
    var imgs = current.images || [];
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (imgs.length < 2 || Math.abs(dx) < 45) return;
    showImage(dx < 0 ? (currentIndex + 1) % imgs.length
                     : (currentIndex - 1 + imgs.length) % imgs.length);
  }, { passive: true });

  // Every product has its own address, so one piece can be sent into a chat and
  // the back button behaves the way people expect.
  window.addEventListener('popstate', function () {
    if (suppressHash) return;
    var id = location.hash.replace('#', '');
    var product = id ? byId(id) : null;
    if (product) {
      if (dialog.open) fillDetail(product);
      else openDetail(product, false);
    } else if (dialog.open) {
      closeDetail(false);
    }
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
        listed: o.listed || '',
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

    // Arriving on a product link opens straight to it.
    var id = location.hash.replace('#', '');
    var product = id ? byId(id) : null;
    if (product) openDetail(product, false);
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

  // The header lifts off the page once the top of the document leaves view. A
  // sentinel plus an observer, rather than a scroll handler on every frame.
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
      .catch(function () { start(PRODUCTS); });
  } else {
    start(PRODUCTS);
  }
})();
