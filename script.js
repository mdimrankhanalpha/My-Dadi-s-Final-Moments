/* Reads posts.txt and renders the timeline. Format: DATE|TIME|DESCRIPTION|IMAGE_URL[|FEATURED], posts separated by a line containing only $ */
(function () {
  'use strict';
  var POSTS_FILE = 'posts.txt';
  var PLACEHOLDER = 'IMAGE_URL_REQUIRED';
  var timeline = document.getElementById('timeline');
  var statusEl = document.getElementById('status');
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lastFocus = null, all = [], order = 'newest';
  var hero = document.querySelector('.hero');
  var btns = document.querySelectorAll('.seg-btn');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      order = b.getAttribute('data-order');
      btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (all.length) render(all, order);
    });
  });

  // The title section is temporary: it fades as it scrolls out of view. It never moves the page.
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tick = false;
  function fade() {
    tick = false;
    var h = hero.offsetHeight || 1;
    hero.style.opacity = reduce ? '' : String(Math.max(0, 1 - window.scrollY / (h * 0.8)));
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(fade); } }, { passive: true });

  function parseTime(raw) {
    var m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp])\.?[Mm]\.?$/.exec(raw);
    if (!m) return null;
    var h = +m[1], min = +m[2];
    if (h < 1 || h > 12 || min > 59) return null;
    var pm = m[3].toUpperCase() === 'P';
    return { label: h + ':' + (min < 10 ? '0' : '') + min + ' ' + (pm ? 'PM' : 'AM'),
             minutes: (h % 12 + (pm ? 12 : 0)) * 60 + min };
  }

  function parseDate(raw) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return { iso: raw, label: d.getUTCDate() + ' ' + d.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' }) + ' ' + m[1] };
  }

  function isUrl(l) { return /^https?:\/\//i.test(l) || l === PLACEHOLDER; }

  function parse(text) {
    var posts = [], seen = {}, skipped = 0;
    // tolerate stray brackets around the $ separators, e.g. "($" and "$)"
    text = text.replace(/^\uFEFF/, '').replace(/\(\s*\$/g, '$').replace(/\$\s*\)/g, '$');
    text.split(/^[ \t]*\$[ \t]*$/m).forEach(function (rec, i) {
      var lines = rec.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length || lines[0].charAt(0) === '#') return;
      var f = lines[0].split('|').map(function (s) { return s.trim(); });
      while (f.length > 3 && !f[f.length - 1]) f.pop();
      var feat = false, urls = [];
      if (f.length > 3 && /^featured$/i.test(f[f.length - 1])) { feat = true; f.pop(); }
      if (f.length > 3 && isUrl(f[f.length - 1])) urls.push(f.pop());   // older "…|URL" style still works
      var d = f.length >= 3 ? parseDate(f[0]) : null;
      var t = f.length >= 3 ? parseTime(f[1]) : null;
      var desc = f.slice(2).join('|').replace(/\|+$/, '').trim();
      var extra = [];
      lines.slice(1).forEach(function (l) { if (isUrl(l)) urls.push(l); else extra.push(l); });
      if (extra.length) desc = [desc].concat(extra).join('\n');
      if (!d || !t || !desc) { skipped++; console.warn('posts.txt: skipped malformed record #' + (i + 1) + ':', lines[0]); return; }
      urls = urls.filter(function (u, k) { return u !== PLACEHOLDER && urls.indexOf(u) === k; });
      var key = [d.iso, t.label, desc, urls.join(',')].join('|');
      if (seen[key]) return;
      seen[key] = 1;
      posts.push({ date: d, time: t, desc: desc, urls: urls, featured: feat, order: posts.length });
    });
    posts.sort(function (a, b) {
      return a.date.iso < b.date.iso ? -1 : a.date.iso > b.date.iso ? 1 : (a.time.minutes - b.time.minutes) || (a.order - b.order);
    });
    return { posts: posts, skipped: skipped };
  }

  function placeholder(msg) {
    var p = document.createElement('div');
    p.className = 'ph';
    p.textContent = msg;
    return p;
  }

  function isVideo(u) { return /\.(mp4|webm|ogv|mov|m4v)([?#].*)?$/i.test(u); }

  // Loading strategy
  // 1. Nothing is fetched until it is near the screen.
  // 2. Each photo appears first as a tiny low-quality copy, then a medium copy, then your untouched original.
  // 3. Near-screen photos only load the tiny copy; the sharper copies load once the photo is on screen.
  // Small copies come from the free wsrv.nl image service. Set PREVIEW_PROXY to '' to turn this off
  // (photos then load directly from their own link). If the service is unreachable, the original loads normally.
  var PREVIEW_PROXY = 'https://wsrv.nl/?n=-1&url=';

  function stages(u) {
    var abs;
    try { abs = new URL(u, location.href); } catch (e) { return [u]; }
    if (!PREVIEW_PROXY || !/^https?:$/.test(abs.protocol) || abs.origin === location.origin) return [u];
    var enc = encodeURIComponent(abs.href);
    return [PREVIEW_PROXY + enc + '&w=360&q=40&output=jpg',
            PREVIEW_PROXY + enc + '&w=1280&q=72&we&output=jpg',
            u];
  }

  function show(btn, src) {
    btn.firstChild.src = src;
    if (!btn._shown) { btn._shown = true; btn.classList.add('loaded'); }
  }

  function runStages(btn, full) {
    if (full) btn._full = true;
    if (btn._busy) return;
    btn._busy = true;
    (function next() {
      var i = btn._i, list = btn._stages;
      if (i >= list.length || (i > 0 && !btn._full)) { btn._busy = false; return; }
      btn._i = i + 1;
      var pre = new Image();
      if ('fetchPriority' in pre) pre.fetchPriority = btn._full ? 'high' : 'low';
      pre.decoding = 'async';
      pre.onload = function () { show(btn, list[i]); next(); };
      pre.onerror = function () {
        if (i === list.length - 1 && !btn._shown) { btn.replaceWith(placeholder('Photograph unavailable')); return; }
        next();
      };
      pre.src = list[i];
    })();
  }

  var HAS_IO = 'IntersectionObserver' in window;
  var near = HAS_IO ? new IntersectionObserver(onNear, { rootMargin: '1500px 0px' }) : null;
  var onScreen = HAS_IO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      onScreen.unobserve(e.target);
      if (e.target.tagName === 'VIDEO') e.target.preload = 'metadata';
      else runStages(e.target, true);
    });
  }, { rootMargin: '0px' }) : null;

  function onNear(entries) {
    var vh = window.innerHeight;
    entries.filter(function (e) { return e.isIntersecting; })
      .sort(function (a, b) { return Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top); })
      .forEach(function (e) {
        near.unobserve(e.target);
        var r = e.boundingClientRect;
        start(e.target, r.bottom > 0 && r.top < vh);
      });
  }

  function start(el, visible) {
    if (el.tagName === 'VIDEO') { el.preload = 'metadata'; el.src = el.getAttribute('data-src'); }
    else runStages(el, visible);
  }

  function queue(el) {
    if (near) { near.observe(el); if (onScreen) onScreen.observe(el); } else start(el, true);
  }

  function mediaItem(u, p) {
    if (isVideo(u)) {
      var v = document.createElement('video');
      v.controls = true;
      v.preload = 'none';
      v.setAttribute('playsinline', '');
      v.setAttribute('data-src', u);
      v.setAttribute('aria-label', 'Video from ' + p.date.label + ', ' + p.time.label);
      v.addEventListener('error', function () { v.replaceWith(placeholder('Video unavailable')); }, true);
      queue(v);
      return v;
    }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo';
    btn.setAttribute('aria-label', 'Enlarge photograph: ' + p.time.label + ', ' + p.date.label);
    btn._stages = stages(u); btn._i = 0; btn._shown = false; btn._busy = false; btn._full = false;
    var img = document.createElement('img');
    img.decoding = 'async';
    img.alt = 'Photograph from ' + p.date.label + ', ' + p.time.label;
    btn.appendChild(img);
    btn.addEventListener('click', function () { openLb(u, img.alt, btn, img.currentSrc); });
    queue(btn);
    return btn;
  }

  function media(p) {
    if (!p.urls.length) return null;
    var box = document.createElement('div');
    box.className = 'media';
    p.urls.forEach(function (u) { box.appendChild(mediaItem(u, p)); });
    return box;
  }

  function render(all, order) {
    if (near) near.disconnect();       // forget items from the previous render
    if (onScreen) onScreen.disconnect();
    var posts = order === 'oldest' ? all : all.slice().reverse();
    var frag = document.createDocumentFragment();
    posts.forEach(function (p) {
      var li = document.createElement('li');
      li.className = 'post' + (p.featured ? ' featured' : '');
      var tm = document.createElement('time');
      tm.dateTime = p.date.iso;
      tm.textContent = p.date.label + ', ' + p.time.label;
      var d = document.createElement('p');
      d.className = 'desc';
      d.lang = 'bn';
      d.textContent = p.desc;
      d.style.whiteSpace = 'pre-line';
      li.appendChild(tm); li.appendChild(d);
      var ph = media(p);
      if (ph) li.appendChild(ph);
      frag.appendChild(li);
    });
    timeline.replaceChildren(frag);
  }

  function openLb(src, alt, from, quick) {
    lastFocus = from;
    lbImg.alt = alt;
    lbImg.setAttribute('data-full', src);
    lbImg.src = quick || src;
    if (quick && quick !== src) {
      var big = new Image();
      big.onload = function () { if (!lb.hidden && lbImg.getAttribute('data-full') === src) lbImg.src = src; };
      big.src = src;
    }
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('show'); });
    document.getElementById('lb-close').focus({ preventScroll: true });
  }
  function closeLb() {
    if (lb.hidden) return;
    lb.classList.remove('show'); lb.hidden = true; lbImg.removeAttribute('src'); lbImg.removeAttribute('data-full');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  document.getElementById('lb-close').addEventListener('click', closeLb);
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });

  fetch(POSTS_FILE, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function (txt) {
      var res = parse(txt);
      if (!res.posts.length) { statusEl.textContent = 'No memories have been added yet.'; return; }
      statusEl.hidden = true;
      all = res.posts;
      render(all, order);
    })
    .catch(function (err) {
      console.error(err);
      statusEl.className = 'status error';
      statusEl.textContent = location.protocol === 'file:'
        ? 'Memories cannot load when the page is opened as a local file. Please view it through GitHub Pages or a local web server.'
        : 'The memories could not be loaded. Please check your connection and reload the page.';
    });
})();
