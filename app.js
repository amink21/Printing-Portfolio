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
  var toastEl = document.getElementById('toast');

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
  var dColors = document.getElementById('detailColors');
  var dColorLead = document.getElementById('detailColorLead');
  var dColorNote = document.getElementById('detailColorNote');
  var dSwatches = document.getElementById('detailSwatches');
  var dSave = document.getElementById('detailSave');
  var dSaveLabel = document.getElementById('detailSaveLabel');
  var dShare = document.getElementById('detailShare');

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

  function palette() {
    return (typeof FILAMENT_COLORS !== 'undefined' && FILAMENT_COLORS) || [];
  }

  /* -- delivery ------------------------------------------------------------
     Every sentence about getting the thing to someone comes from here, so
     turning it off in products.js takes it off the whole site. ------------- */

  function delivery() {
    return (typeof DELIVERY === 'object' && DELIVERY) || { offered: false };
  }

  function pickupPlace() {
    return delivery().pickup || 'Montreal';
  }

  // No price set means no number invented. "For a fee" is the honest version.
  function deliveryPhrase() {
    var d = delivery();
    if (!d.offered) return '';
    return d.price
      ? 'delivered for ' + d.price
      : 'delivered for a fee, depending on where you are';
  }

  // "Black or Red", "Black, Red or Silver".
  function joinList(names) {
    if (names.length < 2) return names[0] || '';
    return names.slice(0, -1).join(', ') + ' or ' + names[names.length - 1];
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

  /* -- images -------------------------------------------------------------
     Cloudinary can resize and re-encode from the URL, so a phone is never sent
     a 4000px original. Anything that is not a Cloudinary link is left exactly
     as written, which keeps plain images/whatever.jpg working. -------------- */

  var CLD_MARK = '/image/upload/';

  function isCloudinary(src) {
    return typeof src === 'string' && src.indexOf(CLD_MARK) !== -1;
  }

  function imgUrl(src, width) {
    if (!isCloudinary(src)) return src;
    var at = src.indexOf(CLD_MARK) + CLD_MARK.length;
    var tail = src.slice(at);
    // Already carries a transform, so leave it alone rather than stacking one.
    if (/^(f_|q_|w_|c_|dpr_|e_)/.test(tail)) return src;
    return src.slice(0, at) + 'f_auto,q_auto,c_limit,w_' + width + '/' + tail;
  }

  function srcSet(src, widths) {
    if (!isCloudinary(src)) return '';
    return widths.map(function (w) {
      return imgUrl(src, w) + ' ' + w + 'w';
    }).join(', ');
  }

  // One place that builds an <img>, so every photo on the site gets the same
  // lazy loading, the same srcset and the same alt handling.
  function imgTag(src, alt, opts) {
    opts = opts || {};
    var widths = opts.widths || [320, 640, 960];
    var set = srcSet(src, widths);
    return (
      '<img src="' + esc(imgUrl(src, opts.base || 640)) + '"' +
      (set ? ' srcset="' + esc(set) + '" sizes="' + esc(opts.sizes || '100vw') + '"' : '') +
      ' alt="' + esc(alt) + '"' +
      (opts.eager ? '' : ' loading="lazy"') +
      ' decoding="async">'
    );
  }

  // The placeholder for a product whose photo has not arrived. Light, quiet, and
  // composed so it reads as a shot still to come rather than a broken image.
  function placeholderMarkup(product) {
    var h = hash(product.id || product.name);
    var shift = (h % 22) - 11;
    // Only the hue travels with the product. Saturation and lightness belong to
    // the theme, or a tint mixed for a white page glows on a dark one.
    var foot = product.printHours ? product.printHours + ' h print' : 'Photo coming';
    return (
      '<div class="ptile" style="--h:' + (218 + shift) + '">' +
      '<span class="ptile-initials">' + esc(initials(product.name)) + '</span>' +
      '<span class="ptile-foot">' + esc(foot) + '</span>' +
      '</div>'
    );
  }

  /* -- toast ---------------------------------------------------------------- */

  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2800);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Older browsers, and any context where the clipboard API is blocked.
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy refused'));
      } catch (err) { reject(err); }
    });
  }

  /* -- saved list -----------------------------------------------------------
     Lives in this browser only. Nothing is sent anywhere: the point is to
     collect a few pieces and then send them as one message. ---------------- */

  var SAVED_KEY = 'kadprints.saved';
  var saved = [];

  function loadSaved() {
    try {
      var raw = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      saved = Array.isArray(raw) ? raw.filter(function (x) { return typeof x === 'string'; }) : [];
    } catch (err) { saved = []; }
  }

  function persistSaved() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(saved)); } catch (err) {}
  }

  function isSaved(id) { return saved.indexOf(id) !== -1; }

  function toggleSaved(id) {
    var at = saved.indexOf(id);
    if (at === -1) saved.push(id);
    else saved.splice(at, 1);
    persistSaved();
    syncSaved();
    return at === -1;
  }

  var savedCountEl = document.getElementById('savedCount');
  var savedBar = document.getElementById('savedBar');
  var savedBarText = document.getElementById('savedBarText');
  var savedBtn = document.getElementById('savedBtn');

  function syncSaved() {
    var n = saved.length;

    if (savedCountEl) {
      savedCountEl.textContent = n;
      savedCountEl.hidden = n === 0;
      if (n > 0) {
        savedCountEl.classList.remove('bump');
        // Restart the animation rather than let a second save do nothing.
        void savedCountEl.offsetWidth;
        savedCountEl.classList.add('bump');
      }
    }
    if (savedBtn) savedBtn.classList.toggle('on', n > 0);

    if (savedBar) {
      savedBar.hidden = n === 0;
      if (savedBarText) {
        savedBarText.textContent = n + (n === 1 ? ' piece saved' : ' pieces saved');
      }
    }

    // Every heart on screen, including the one in the open dialog.
    grid.querySelectorAll('.fav').forEach(function (b) {
      var on = isSaved(b.dataset.id);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + (b.dataset.name || 'this piece'));
    });
    if (current && dSaveLabel) {
      dSaveLabel.textContent = isSaved(current.id) ? 'Saved' : 'Save';
      dSave.classList.toggle('on', isSaved(current.id));
    }

    renderList();
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

  function productPath(p) { return '/p/' + p.id; }

  function cardMarkup(p, i, total) {
    var img = firstImage(p);
    // A double-width tile every seventh place, so a long catalog has rhythm.
    // Not worth doing at all on a handful of results.
    var wide = total > 6 && i % 7 === 0 && i !== 0;
    var media = img
      ? imgTag(img, p.name, {
          base: wide ? 900 : 560,
          widths: wide ? [480, 900, 1400] : [280, 560, 840],
          sizes: wide ? '(max-width: 720px) 50vw, 500px' : '(max-width: 720px) 50vw, 260px',
        })
      : placeholderMarkup(p);

    var sub = [];
    if (p.printHours) sub.push(p.printHours + ' h print');
    sub.push(categoryLabel(p.category));

    var on = isSaved(p.id);

    return (
      '<div class="card' + (wide ? ' wide' : '') + '" data-id="' + esc(p.id) + '">' +
      '<span class="card-media' + (img ? ' loading' : '') + '">' + media +
      (isNew(p) ? '<span class="flag">Just listed</span>' : '') +
      '</span>' +
      '<button type="button" class="fav' + (on ? ' on' : '') + '"' +
      ' data-id="' + esc(p.id) + '" data-name="' + esc(p.name) + '"' +
      ' aria-pressed="' + on + '" aria-label="' + (on ? 'Remove ' : 'Save ') + esc(p.name) + '">' +
      '<i class="ph ph-heart" aria-hidden="true"></i></button>' +
      '<span class="card-body">' +
      '<span class="card-price">' + esc(p.price) + '</span>' +
      // A real link, so the tile can be opened in a new tab, copied, and found
      // by a crawler. The click handler turns an ordinary click into the dialog.
      '<a class="card-name" href="' + esc(productPath(p)) + '">' + esc(p.name) + '</a>' +
      '<span class="card-sub">' + esc(sub.join(' · ')) + '</span>' +
      '</span>' +
      '</div>'
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

    grid.innerHTML = list.map(function (p, i) {
      return cardMarkup(p, i, list.length);
    }).join('');
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

  // Anything outside the grid that should arrive rather than simply be there.
  function revealBlocks() {
    var blocks = document.querySelectorAll('.reveal');
    if (reduced() || !('IntersectionObserver' in window)) {
      blocks.forEach(function (b) { b.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    blocks.forEach(function (b, i) {
      b.style.transitionDelay = Math.min(i, 4) * 70 + 'ms';
      io.observe(b);
    });
  }

  /* -- pointer tilt --------------------------------------------------------
     The tile leans a degree or two toward the pointer and the photo drifts the
     other way, which is the whole trick. One listener on the grid, values
     written as custom properties, transform left to the stylesheet. -------- */

  function initTilt() {
    if (reduced() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var pending = null;
    var lastCard = null;

    grid.addEventListener('pointermove', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (!card) return;
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = null;
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        // -1 at one edge, +1 at the other.
        var px = ((e.clientX - r.left) / r.width) * 2 - 1;
        var py = ((e.clientY - r.top) / r.height) * 2 - 1;
        card.style.setProperty('--ry', (px * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 3.2).toFixed(2) + 'deg');
        card.style.setProperty('--px', px.toFixed(3));
        card.style.setProperty('--py', py.toFixed(3));
        lastCard = card;
      });
    }, { passive: true });

    function clear(card) {
      if (!card) return;
      ['--rx', '--ry', '--px', '--py'].forEach(function (k) {
        card.style.removeProperty(k);
      });
    }

    grid.addEventListener('pointerout', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (card && card !== (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.card'))) {
        clear(card);
      }
    });
    // A re-render throws the old nodes away mid-hover, so drop the reference.
    grid.addEventListener('pointerleave', function () {
      clear(lastCard);
      lastCard = null;
    });
  }

  /* -- showcase -------------------------------------------------------------
     The pieces at the top of the page. Real catalog entries, never stock art.
     It stops moving on hover, on focus, when the tab is hidden, and when the
     visitor has asked for less motion. ------------------------------------- */

  var showcase = document.getElementById('showcase');
  var showStage = document.getElementById('showStage');
  var showName = document.getElementById('showName');
  var showPrice = document.getElementById('showPrice');
  var showDots = document.getElementById('showDots');

  var featured = [];
  var showIndex = 0;
  var showTimer = null;
  var showPaused = false;

  function pickFeatured() {
    // Named by hand in products.js, so those are the pieces, photographed or not.
    if (typeof FEATURED !== 'undefined' && FEATURED && FEATURED.length) {
      var chosen = [];
      FEATURED.forEach(function (id) {
        var p = byId(id);
        if (p) chosen.push(p);
      });
      if (chosen.length) return chosen.slice(0, 6);
    }

    // Otherwise only photographed pieces are eligible. A showcase is a claim
    // that something is worth looking at, and a screen-sized placeholder is the
    // opposite of that. With no photos yet there is simply no showcase, and it
    // appears on its own the day the first ones land.
    return products
      .filter(firstImage)
      .sort(function (a, b) {
        return String(b.listed || '').localeCompare(String(a.listed || ''));
      })
      .slice(0, 5);
  }

  function buildShowcase() {
    featured = pickFeatured();
    if (!showcase || featured.length < 2) {
      if (showcase) showcase.hidden = true;
      return;
    }
    showcase.hidden = false;

    // All the slides are built once and then cross-faded, so advancing never
    // waits on a network request.
    showStage.innerHTML = featured.map(function (p, i) {
      var img = firstImage(p);
      var cls = i === 0 ? ' on' : '';
      if (img) {
        return imgTag(img, p.name, {
          base: 1200,
          widths: [640, 1200, 1800],
          sizes: '(max-width: 720px) 100vw, 1100px',
          eager: i === 0,
        }).replace('<img ', '<img class="slide' + cls + '" ');
      }
      return placeholderMarkup(p).replace('class="ptile"', 'class="ptile slide' + cls + '"');
    }).join('');

    showDots.innerHTML = featured.map(function (p, i) {
      return (
        '<button type="button" class="dot" data-i="' + i + '"' +
        ' aria-current="' + (i === 0) + '"' +
        ' aria-label="Show ' + esc(p.name) + '"></button>'
      );
    }).join('');

    showAt(0);
    scheduleShow();
  }

  function showAt(i) {
    if (!featured.length) return;
    showIndex = ((i % featured.length) + featured.length) % featured.length;
    var slides = showStage.querySelectorAll('.slide');
    Array.prototype.forEach.call(slides, function (el, n) {
      el.classList.toggle('on', n === showIndex);
    });
    Array.prototype.forEach.call(showDots.children, function (d, n) {
      d.setAttribute('aria-current', String(n === showIndex));
    });
    var p = featured[showIndex];
    showName.textContent = p.name;
    showPrice.textContent = [p.price, categoryLabel(p.category)].filter(Boolean).join('  ·  ');
    showStage.setAttribute('aria-label', 'Open ' + p.name);
  }

  function scheduleShow() {
    clearTimeout(showTimer);
    if (reduced() || showPaused || featured.length < 2) return;
    if (document.visibilityState !== 'visible') return;
    showTimer = setTimeout(function () {
      showAt(showIndex + 1);
      scheduleShow();
    }, 5200);
  }

  function pauseShow(on) {
    showPaused = on;
    if (on) clearTimeout(showTimer);
    else scheduleShow();
  }

  if (showcase) {
    showcase.addEventListener('pointerenter', function () { pauseShow(true); });
    showcase.addEventListener('pointerleave', function () { pauseShow(false); });
    showcase.addEventListener('focusin', function () { pauseShow(true); });
    showcase.addEventListener('focusout', function () { pauseShow(false); });
    showStage.addEventListener('click', function () {
      var p = featured[showIndex];
      if (p) openDetail(p);
    });
    showDots.addEventListener('click', function (e) {
      var dot = e.target.closest('.dot');
      if (!dot) return;
      showAt(Number(dot.dataset.i));
      scheduleShow();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') scheduleShow();
    else clearTimeout(showTimer);
  });

  /* -- stats ----------------------------------------------------------------- */

  function countUp(el, to) {
    if (!el) return;
    if (reduced()) { el.textContent = String(to); return; }
    var from = 0;
    var dur = 900;
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      // Ease out, so it lands rather than stops.
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(from + (to - from) * eased));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initStats() {
    var pieces = document.getElementById('statPieces');
    var cats = document.getElementById('statCats');

    var used = {};
    products.forEach(function (p) { used[p.category] = true; });

    var targets = [
      [pieces, products.length],
      [cats, Object.keys(used).length],
    ];

    var section = document.querySelector('.stats');
    if (!section || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { if (t[0]) t[0].textContent = String(t[1]); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      targets.forEach(function (t) { countUp(t[0], t[1]); });
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(section);
  }

  /* -- palette and colour choice --------------------------------------------- */

  function colorsFor(product) {
    var all = palette();
    if (!product || !product.colors || !product.colors.length) return all;
    var wanted = product.colors.map(function (c) { return String(c).toLowerCase(); });
    var hit = all.filter(function (c) { return wanted.indexOf(c.name.toLowerCase()) !== -1; });
    return hit.length ? hit : all;
  }

  function renderPalette() {
    var el = document.getElementById('palette');
    if (!el) return;
    el.innerHTML = palette().map(function (c) {
      return '<span class="sw"><i style="--c:' + esc(c.hex) + '"></i>' + esc(c.name) + '</span>';
    }).join('');
  }

  // Which colour the visitor picked, per product. Only used to write the
  // message, never sent anywhere on its own.
  var chosenColor = {};

  function renderSwatches(product) {
    var list = colorsFor(product);
    if (!list.length) { dColors.hidden = true; return; }
    dColors.hidden = false;

    // A product only says "available in" when it genuinely is limited. Every
    // other one can be printed in whatever colour is asked for, and saying so
    // is the point: the dots are a prompt, not a menu.
    var limited = Boolean(product && product.colors && product.colors.length);
    var picked = chosenColor[product.id] || '';

    if (picked) {
      dColorLead.innerHTML = 'Printed in <b>' + esc(picked) + '</b>';
    } else if (limited) {
      dColorLead.innerHTML = 'Available in <b>' +
        esc(joinList(list.map(function (c) { return c.name; }))) + '</b>';
    } else {
      dColorLead.innerHTML = 'Printed in <b>any colour you like</b>';
    }

    dColorNote.textContent = limited
      ? 'This one is only done in those.'
      : 'These are what is usually on the shelf. Ask for anything else, or a mix.';

    dSwatches.innerHTML = list.map(function (c) {
      return (
        '<button type="button" class="swatch" role="radio" data-name="' + esc(c.name) + '"' +
        ' style="--c:' + esc(c.hex) + '"' +
        ' aria-checked="' + (c.name === picked) + '"' +
        ' aria-label="' + esc(c.name) + '" title="' + esc(c.name) + '"></button>'
      );
    }).join('');
  }

  dSwatches.addEventListener('click', function (e) {
    var sw = e.target.closest('.swatch');
    if (!sw || !current) return;
    var name = sw.dataset.name;
    // Tapping the chosen one again clears it, so a colour is never forced.
    chosenColor[current.id] = chosenColor[current.id] === name ? '' : name;
    renderSwatches(current);
  });

  /* -- detail sheet ------------------------------------------------------- */

  var current = null;
  var currentIndex = 0;
  var suppressHash = false;

  function showImage(index) {
    if (!current) return;
    var imgs = current.images || [];
    currentIndex = index;

    dStage.innerHTML = imgs.length
      ? imgTag(imgs[index], current.name, {
          base: 1000,
          widths: [560, 1000, 1500],
          sizes: '(max-width: 900px) 100vw, 520px',
          eager: true,
        })
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
    specs += '<div class="spec"><dt>Getting it</dt><dd>' +
      (delivery().offered ? 'Pickup or delivery' : 'Pickup in ' + esc(pickupPlace())) +
      '</dd></div>';
    if (product.listed) {
      specs += '<div class="spec"><dt>Listed</dt><dd>' + esc(niceDate(product.listed)) + '</dd></div>';
    }
    dSpecs.innerHTML = specs;

    renderSwatches(product);

    var imgs = product.images || [];
    dThumbs.innerHTML =
      imgs.length > 1
        ? imgs.map(function (src, i) {
            return (
              '<button type="button" class="thumb" data-i="' + i + '"' +
              ' aria-current="' + (i === 0) + '"' +
              ' aria-label="Photo ' + (i + 1) + '">' +
              '<img src="' + esc(imgUrl(src, 160)) + '" alt="" loading="lazy" decoding="async"></button>'
            );
          }).join('')
        : '';

    showImage(0);

    dSaveLabel.textContent = isSaved(product.id) ? 'Saved' : 'Save';
    dSave.classList.toggle('on', isSaved(product.id));

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

  function niceDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' });
    } catch (err) { return iso; }
  }

  // pushState is not allowed on a file:// page, and the site is genuinely opened
  // that way sometimes. Everything else still works when this is false.
  var canPush = location.protocol === 'http:' || location.protocol === 'https:';
  var pushedDepth = 0;

  // A view transition name may belong to exactly one rendered element at a time.
  // The detail stage holds "product-media" from the stylesheet, so a tile may
  // only hold it while the dialog is closed. Hand it over at the right moment
  // and the image morphs; hold it in both places and the browser gives up on the
  // transition and warns about a duplicate.
  function claimMedia(id) {
    grid.querySelectorAll('.card-media').forEach(function (el) {
      if (el.style.viewTransitionName) el.style.viewTransitionName = '';
    });
    if (!id) return null;
    var el = grid.querySelector('.card[data-id="' + id + '"] .card-media');
    if (el) el.style.viewTransitionName = 'product-media';
    return el;
  }

  function openDetail(product, pushHistory) {
    lastFocused = document.activeElement;

    // Before the transition starts, so the outgoing frame is the tile.
    var sourceMedia = claimMedia(product.id);

    withTransition(function () {
      // Inside the update, so the incoming frame is the dialog's stage and only
      // one element ever claims the name.
      if (sourceMedia) sourceMedia.style.viewTransitionName = '';
      dStage.style.viewTransitionName = ''; // back to the stylesheet's value
      fillDetail(product);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });

    if (pushHistory !== false && canPush) {
      suppressHash = true;
      try {
        history.pushState({ product: product.id }, '', productPath(product));
        pushedDepth++;
      } catch (err) {}
      suppressHash = false;
    }
  }

  function closeDetail(popHistory) {
    // The return journey, the same handover in reverse: the stage owns the name
    // on the way out, the tile takes it inside the update so the image shrinks
    // back into the grid rather than cross-fading away.
    var backTo = current ? current.id : null;

    withTransition(function () {
      // close() does not un-render the dialog straight away: the stylesheet
      // transitions display and overlay discretely so the panel can animate out,
      // which means the stage is still on screen and still holding the name. It
      // has to give it up explicitly, or the tile taking it makes two.
      dStage.style.viewTransitionName = 'none';
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
      claimMedia(backTo);
    });

    // Released once the transition is over. A name left on a closed dialog's
    // tile is harmless, but the next open would otherwise start from a stale one.
    setTimeout(function () {
      claimMedia(null);
      dStage.style.viewTransitionName = '';
    }, 700);

    if (popHistory !== false && pushedDepth > 0) {
      pushedDepth--;
      history.back();
      return;
    }

    // Landed straight on /p/<id> from a chat link, so there is nothing to go
    // back to. Tidy the address instead of leaving it pointing at a closed piece.
    if (popHistory !== false && canPush && /^\/p\//.test(location.pathname)) {
      try { history.replaceState({}, '', '/'); } catch (err) {}
    }
  }

  /* -- message composing ------------------------------------------------------ */

  function lineFor(p) {
    var bits = [p.name];
    if (p.price) bits.push('(' + p.price + ')');
    var c = chosenColor[p.id];
    if (c) bits.push('in ' + c);
    return '- ' + bits.join(' ');
  }

  function openSeller() {
    window.open(contactUrl(), '_blank', 'noopener');
  }

  function sendMessage(text, note) {
    copyText(text)
      .then(function () { toast(note || 'Message copied. Paste it into the chat.'); })
      .catch(function () { toast('Could not copy automatically. The message is in the box.'); })
      .then(function () { openSeller(); });
  }

  /* -- saved list dialog ------------------------------------------------------ */

  var listDialog = document.getElementById('listDialog');
  var listItems = document.getElementById('listItems');
  var listEmpty = document.getElementById('listEmpty');
  var listFoot = document.getElementById('listFoot');
  var listTotal = document.getElementById('listTotal');

  function savedProducts() {
    return saved.map(byId).filter(Boolean);
  }

  function renderList() {
    if (!listItems) return;
    var list = savedProducts();

    listEmpty.hidden = list.length > 0;
    listFoot.hidden = list.length === 0;

    listItems.innerHTML = list.map(function (p) {
      var img = firstImage(p);
      return (
        '<div class="list-item">' +
        '<span class="list-shot">' +
        (img ? '<img src="' + esc(imgUrl(img, 160)) + '" alt="" loading="lazy">' : placeholderMarkup(p)) +
        '</span>' +
        '<span class="list-text">' +
        '<p class="list-name">' + esc(p.name) + '</p>' +
        '<p class="list-price">' + esc([p.price, chosenColor[p.id]].filter(Boolean).join('  ·  ')) + '</p>' +
        '</span>' +
        '<button type="button" class="list-rm" data-id="' + esc(p.id) + '"' +
        ' aria-label="Remove ' + esc(p.name) + ' from the list">' +
        '<i class="ph ph-x" aria-hidden="true"></i></button>' +
        '</div>'
      );
    }).join('');

    var sum = list.reduce(function (n, p) { return n + priceNumber(p); }, 0);
    listTotal.textContent = sum
      ? list.length + (list.length === 1 ? ' piece' : ' pieces') + ', about $' + sum + ' altogether'
      : list.length + (list.length === 1 ? ' piece' : ' pieces');
  }

  function openList() {
    renderList();
    if (typeof listDialog.showModal === 'function') listDialog.showModal();
    else listDialog.setAttribute('open', '');
  }

  if (listDialog) {
    document.getElementById('listClose').addEventListener('click', function () {
      listDialog.close();
    });
    listDialog.addEventListener('click', function (e) {
      if (e.target === listDialog) listDialog.close();
    });
    listItems.addEventListener('click', function (e) {
      var rm = e.target.closest('.list-rm');
      if (!rm) return;
      toggleSaved(rm.dataset.id);
    });
    document.getElementById('listClear').addEventListener('click', function () {
      saved = [];
      persistSaved();
      syncSaved();
      toast('List cleared');
    });
    document.getElementById('listSend').addEventListener('click', function () {
      var list = savedProducts();
      if (!list.length) return;
      var text =
        'Hi, I am interested in these from your site:\n\n' +
        list.map(lineFor).join('\n') +
        '\n\nAre they available?';
      sendMessage(text, 'List copied. Paste it into the chat.');
    });
  }

  if (savedBtn) savedBtn.addEventListener('click', openList);
  var savedBarOpen = document.getElementById('savedBarOpen');
  if (savedBarOpen) savedBarOpen.addEventListener('click', openList);

  /* -- quote composer --------------------------------------------------------- */

  var quoteForm = document.getElementById('quoteForm');
  var qWhat = document.getElementById('qWhat');
  var qColor = document.getElementById('qColor');
  var qQty = document.getElementById('qQty');
  var qNotes = document.getElementById('qNotes');
  var qPreview = document.getElementById('qPreview');

  var qHow = document.getElementById('qHow');
  var qHowWrap = document.getElementById('qHowWrap');

  function quoteText() {
    var what = (qWhat.value || '').trim();
    var color = (qColor.value || '').trim();
    var qty = Math.max(1, Number(qQty.value) || 1);
    var notes = (qNotes.value || '').trim();

    var lines = ['Hi, I saw your site and I am after something custom.'];
    lines.push('');
    lines.push('What: ' + (what || '(describe the piece here)'));
    lines.push('Colour: ' + (color || 'not fussy, suggest something'));
    lines.push('How many: ' + qty);
    if (qHow && qHowWrap && !qHowWrap.hidden) lines.push('Getting it: ' + qHow.value);
    if (notes) lines.push('Notes: ' + notes);
    lines.push('');
    lines.push('What would that cost?');
    return lines.join('\n');
  }

  function syncQuote() {
    if (qPreview) qPreview.textContent = quoteText();
  }

  if (quoteForm) {
    // Suggestions on a text box, not a dropdown. Typing "racing green" has to
    // work, because that is the actual offer.
    var colourList = document.getElementById('colourList');
    if (colourList) {
      colourList.innerHTML = palette().map(function (c) {
        return '<option value="' + esc(c.name) + '"></option>';
      }).join('');
    }

    var d = delivery();
    if (qHow) {
      var options = ['<option value="Pickup">Pickup in ' + esc(pickupPlace()) + '</option>'];
      if (d.offered) {
        options.push(
          '<option value="Delivery">Delivery' +
          (d.price ? ' (' + esc(d.price) + ')' : ' (for a fee)') + '</option>'
        );
      }
      qHow.innerHTML = options.join('');
    }
    if (qHowWrap && !d.offered) qHowWrap.hidden = true;

    ['input', 'change'].forEach(function (evt) {
      quoteForm.addEventListener(evt, syncQuote);
    });
    syncQuote();

    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage(quoteText(), 'Message copied. Paste it into the chat.');
    });
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
    // The heart is a real button sitting above the tile's link.
    var fav = e.target.closest('.fav');
    if (fav) {
      e.preventDefault();
      var added = toggleSaved(fav.dataset.id);
      fav.classList.remove('pop');
      void fav.offsetWidth;
      fav.classList.add('pop');
      toast(added ? 'Saved to your list' : 'Removed from your list');
      return;
    }

    var link = e.target.closest('a.card-name');
    if (!link) return;
    // A modified click means the visitor asked for a new tab or a download, and
    // the href is a real page, so let the browser do exactly what was asked.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    var card = link.closest('.card');
    var product = card && byId(card.dataset.id);
    if (product) openDetail(product);
  });

  dThumbs.addEventListener('click', function (e) {
    var thumb = e.target.closest('.thumb');
    if (thumb) showImage(Number(thumb.dataset.i));
  });

  dClose.addEventListener('click', function () { closeDetail(); });

  dSave.addEventListener('click', function () {
    if (!current) return;
    var added = toggleSaved(current.id);
    toast(added ? 'Saved to your list' : 'Removed from your list');
  });

  dShare.addEventListener('click', function () {
    if (!current) return;
    var url;
    try { url = new URL(productPath(current), location.href).href; }
    catch (err) { url = location.href; }

    var payload = {
      title: current.name + ' - Kad Prints',
      text: current.name + (current.price ? ', ' + current.price : ''),
      url: url,
    };

    if (navigator.share) {
      navigator.share(payload).catch(function () {}); // a cancelled share is not an error
      return;
    }
    copyText(url)
      .then(function () { toast('Link copied'); })
      .catch(function () { toast('Could not copy the link'); });
  });

  // Clicking the backdrop closes. The dialog element fills the viewport, so a
  // click landing on it rather than on its inner panel is a backdrop hit.
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) closeDetail();
  });

  // Escape closes the dialog natively, which fires this without going through
  // closeDetail, so the history entry has to be dropped here too.
  dialog.addEventListener('cancel', function () {
    if (pushedDepth > 0) {
      pushedDepth--;
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
  // the back button behaves the way people expect. Older links used #id and
  // still work.
  function productFromLocation() {
    var m = location.pathname.match(/^\/p\/([^/]+)\/?$/);
    var id = m ? decodeURIComponent(m[1]) : location.hash.replace('#', '');
    return id ? byId(id) : null;
  }

  window.addEventListener('popstate', function () {
    if (suppressHash) return;
    var product = productFromLocation();
    if (product) {
      if (dialog.open) fillDetail(product);
      else openDetail(product, false);
    } else if (dialog.open) {
      pushedDepth = 0;
      closeDetail(false);
    }
  });

  /* -- theme ------------------------------------------------------------------ */

  var themeBtn = document.getElementById('themeBtn');

  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function paintThemeIcon() {
    if (!themeBtn) return;
    var dark = currentTheme() === 'dark';
    var icon = themeBtn.querySelector('i');
    if (icon) icon.className = dark ? 'ph ph-sun' : 'ph ph-moon';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light' : 'Switch to dark');
  }

  if (themeBtn) {
    paintThemeIcon();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('kadprints.theme', next); } catch (err) {}
      paintThemeIcon();
    });
    // Following the system while no explicit choice has been made.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener
      && window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', function () {
          if (!document.documentElement.getAttribute('data-theme')) paintThemeIcon();
        });
  }

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
      var split = function (v) {
        return v ? v.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
      };
      return {
        id: o.id || (o.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: o.name || 'Untitled',
        category: o.category || 'custom',
        price: o.price || '',
        listed: o.listed || '',
        description: o.description || '',
        printHours: o.printHours ? Number(o.printHours) : null,
        images: split(o.images),
        colors: split(o.colors),
        marketplaceUrl: o.marketplaceUrl || '',
      };
    }).filter(function (p) { return p.name && p.name !== 'Untitled'; });
  }

  function start(list) {
    products = list;
    loadSaved();

    renderChips();
    renderGrid();
    buildShowcase();
    initStats();
    renderPalette();
    revealBlocks();
    initTilt();
    syncSaved();

    // Arriving on a product link opens straight to it.
    var product = productFromLocation();
    if (product) {
      openDetail(product, false);
      return;
    }

    // Arriving on #about or #contact, the browser jumped to that heading before
    // the grid existed, so by now the target has moved a long way down the page.
    // Aim again, once, with the real layout.
    var frag = location.hash.replace('#', '');
    var section = frag && document.getElementById(frag);
    if (section) {
      // Instant, not smooth. The catalog makes this page thirteen thousand
      // pixels long, and animating all of it on arrival is a slow ride to
      // somewhere the visitor already asked to be. Smooth stays for nav clicks.
      requestAnimationFrame(function () {
        section.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
    }
  }

  // How it works and the stats strip both state the pickup and delivery deal,
  // and both are written from the config rather than typed into the markup.
  var factWhen = document.getElementById('factWhen');
  if (factWhen) {
    factWhen.textContent = factWhen.textContent.trim() + ' Pickup in ' + pickupPlace() +
      (delivery().offered ? ', or ' + deliveryPhrase() + '.' : '.');
  }
  var statWhere = document.getElementById('statWhere');
  if (statWhere && !delivery().offered) {
    statWhere.textContent = 'printed and collected in';
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

  // The filter bar gives back a little height once it is stuck under the header,
  // so the grid keeps more of the screen on a phone. Same sentinel trick.
  var filterbar = document.getElementById('filterbar');
  if (filterbar && 'IntersectionObserver' in window) {
    var fMark = document.createElement('span');
    fMark.setAttribute('aria-hidden', 'true');
    filterbar.parentNode.insertBefore(fMark, filterbar);
    new IntersectionObserver(function (entries) {
      filterbar.classList.toggle('stuck', !entries[0].isIntersecting);
    }, { rootMargin: '-61px 0px 0px 0px' }).observe(fMark);
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
