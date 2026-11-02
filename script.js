/* Reads posts.txt and renders the timeline. Format: DATE|TIME|DESCRIPTION|IMAGE_URL[|FEATURED], posts separated by a line containing only $ */
(function () {
  'use strict';
  var POSTS_FILE = 'posts.txt';
  var PLACEHOLDER = 'IMAGE_URL_REQUIRED';
  var timeline = document.getElementById('timeline');
  var statusEl = document.getElementById('status');
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lastFocus = null;

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

  function parse(text) {
    var posts = [], seen = {}, skipped = 0;
    text.replace(/^\uFEFF/, '').split(/^[ \t]*\$[ \t]*$/m).forEach(function (rec, i) {
      rec = rec.trim();
      if (!rec || rec.charAt(0) === '#') return;
      var f = rec.split('|').map(function (s) { return s.trim(); });
      var feat = false;
      if (f.length >= 5 && /^featured$/i.test(f[f.length - 1])) { feat = true; f.pop(); }
      var d = f.length >= 4 ? parseDate(f[0]) : null;
      var t = f.length >= 4 ? parseTime(f[1]) : null;
      var desc = f.slice(2, f.length - 1).join('|').trim();
      if (!d || !t || !desc) { skipped++; console.warn('posts.txt: skipped malformed record #' + (i + 1) + ':', rec); return; }
      var url = f[f.length - 1];
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

  function render(posts) {
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
      render(res.posts);
    })
    .catch(function (err) {
      console.error(err);
      statusEl.className = 'status error';
      statusEl.textContent = location.protocol === 'file:'
        ? 'Memories cannot load when the page is opened as a local file. Please view it through GitHub Pages or a local web server.'
        : 'The memories could not be loaded. Please check your connection and reload the page.';
    });
})();
