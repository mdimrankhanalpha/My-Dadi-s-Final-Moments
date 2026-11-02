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
      var feat = false, url = '';
      if (f.length > 3 && /^featured$/i.test(f[f.length - 1])) { feat = true; f.pop(); }
      if (f.length > 3 && isUrl(f[f.length - 1])) url = f.pop();   // older "…|URL" style still works
      var d = f.length >= 3 ? parseDate(f[0]) : null;
      var t = f.length >= 3 ? parseTime(f[1]) : null;
      var desc = f.slice(2).join('|').replace(/\|+$/, '').trim();
      var extra = [];
      lines.slice(1).forEach(function (l) { if (isUrl(l)) { if (!url) url = l; } else extra.push(l); });
      if (extra.length) desc = [desc].concat(extra).join('\n');
      if (!d || !t || !desc) { skipped++; console.warn('posts.txt: skipped malformed record #' + (i + 1) + ':', lines[0]); return; }
      var key = [d.iso, t.label, desc, url].join('|');
      if (seen[key]) return;
      seen[key] = 1;
      posts.push({ date: d, time: t, desc: desc, url: url, featured: feat, order: posts.length });
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

  function photo(p) {
    var u = p.url;
    if (!u || u === PLACEHOLDER) return placeholder('Photograph to be added');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo';
    btn.setAttribute('aria-label', 'Enlarge photograph: ' + p.time.label + ', ' + p.date.label);
    var img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = 'Photograph from ' + p.date.label + ', ' + p.time.label;
    img.addEventListener('error', function () { btn.replaceWith(placeholder('Photograph unavailable')); });
    img.src = u;
    btn.appendChild(img);
    btn.addEventListener('click', function () { openLb(u, img.alt, btn); });
    return btn;
  }

  function render(all, order) {
    var posts = order === 'oldest' ? all : all.slice().reverse();
    var frag = document.createDocumentFragment(), cur = '';
    posts.forEach(function (p) {
      if (p.date.iso !== cur) {
        cur = p.date.iso;
        var h = document.createElement('li');
        h.className = 'day';
        h.setAttribute('role', 'presentation');
        h.textContent = p.date.label;
        frag.appendChild(h);
      }
      var li = document.createElement('li');
      li.className = 'post' + (p.featured ? ' featured' : '');
      var tm = document.createElement('time');
      tm.dateTime = p.date.iso;
      tm.textContent = p.time.label;
      var d = document.createElement('p');
      d.className = 'desc';
      d.lang = 'bn';
      d.textContent = p.desc;
      d.style.whiteSpace = 'pre-line';
      li.appendChild(tm); li.appendChild(d); li.appendChild(photo(p));
      frag.appendChild(li);
    });
    timeline.replaceChildren(frag);
  }

  function openLb(src, alt, from) {
    lastFocus = from;
    lbImg.src = src; lbImg.alt = alt;
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add('show'); });
    document.getElementById('lb-close').focus({ preventScroll: true });
  }
  function closeLb() {
    if (lb.hidden) return;
    lb.classList.remove('show'); lb.hidden = true; lbImg.removeAttribute('src');
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
