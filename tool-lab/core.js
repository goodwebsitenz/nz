/* Good Website Co — Tool Lab
   Shared micro-framework. Vanilla JS, no imports, no external calls.
   Every tool = { id, n, name, family, what, config, limits, body, calc } */

const LAB = (function () {
  const tools = [];

  const money = n => '$' + Math.round(n).toLocaleString('en-NZ');
  const num = (v, d = 0) => { const n = parseFloat(v); return isFinite(n) ? n : d; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function add(t) { tools.push(t); }
  function all() { return tools.slice().sort((a, b) => a.n - b.n); }

  function val(root, name) {
    const e = root.querySelector('[data-f="' + name + '"]');
    if (!e) return null;
    if (e.type === 'checkbox') return e.checked;
    return e.value;
  }
  function valN(root, name, d = 0) { return num(val(root, name), d); }

  function out(root, html) {
    const o = root.querySelector('[data-out]');
    if (o) o.innerHTML = html;
  }

  function bind(root, fn) {
    root.querySelectorAll('[data-f]').forEach(e => {
      e.addEventListener('input', () => fn());
      e.addEventListener('change', () => fn());
    });
    try { fn(); } catch (err) { out(root, '<p class="err">' + esc(err.message) + '</p>'); }
  }

  function dl(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  /* SVG -> PNG download (T4 / T24). No libraries. */
  function svgToPng(svg, filename, w, h) {
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = function () {
      const c = document.createElement('canvas');
      c.width = w || 1200; c.height = h || 800;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png'); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
    };
    img.onerror = function () { URL.revokeObjectURL(url); alert('Could not export — try printing instead.'); };
    img.src = url;
  }

  function ics(entries) {
    const pad = n => String(n).padStart(2, '0');
    const dt = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
      'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GWCo Tool Lab//EN'];
    entries.forEach((e, i) => {
      lines.push('BEGIN:VEVENT', 'UID:lab-' + Date.now() + '-' + i, 'DTSTAMP:' + dt(new Date()),
        'DTSTART:' + dt(e.start), 'DTEND:' + dt(e.end),
        'SUMMARY:' + e.title, 'DESCRIPTION:' + (e.desc || ''), 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  function nextWeekday(dayIndex, hour, minute) {
    const d = new Date();
    d.setHours(hour, minute || 0, 0, 0);
    const diff = (dayIndex - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 && d.getTime() < Date.now() ? 7 : diff));
    return d;
  }

  function card(t) {
    return '<section class="tool" id="' + t.id + '">' +
      '<div class="tool-head"><span class="num">T' + t.n + '</span>' +
      '<div><h2>' + esc(t.name) + '</h2>' +
      '<span class="fam">' + esc(t.family) + '</span></div></div>' +
      '<dl class="meta">' +
      '<div><dt>What it does</dt><dd>' + t.what + '</dd></div>' +
      '<div><dt>Config in a real build</dt><dd>' + t.config + '</dd></div>' +
      '<div><dt>Limits</dt><dd>' + t.limits + '</dd></div>' +
      '</dl>' +
      '<div class="demo"><div class="demo-label">Live demo — change the numbers</div>' +
      t.body + '<div class="result" data-out></div></div>' +
      '</section>';
  }

  function mount(host) {
    host.innerHTML = all().map(card).join('');
    all().forEach(t => {
      const root = document.getElementById(t.id);
      if (root && t.calc) { try { t.calc(root); } catch (e) { console.error(t.id, e); } }
    });
    const nav = document.getElementById('index');
    if (nav) {
      nav.innerHTML = all().map(t =>
        '<a href="#' + t.id + '">T' + t.n + ' ' + esc(t.name) + '</a>').join('');
    }
  }

  return { add, all, money, num, esc, val, valN, out, bind, dl, svgToPng, ics, nextWeekday, mount,
           tools: all };
})();

/* Self-mount — no inline script needed, works whether or not DOMContentLoaded has fired.
   If anything goes wrong the page says so instead of showing a blank screen. */
(function autoMount() {
  function boot() {
    try {
      if (typeof LAB === 'undefined') throw new Error('framework did not load');
      const host = document.getElementById('tools');
      if (!host) throw new Error('mount point #tools missing');
      LAB.mount(host);
      const n = host.querySelectorAll('.tool').length;
      if (!n) throw new Error('no tools registered');
      const badge = document.getElementById('boot-status');
      if (badge) { badge.textContent = n + ' tools loaded'; badge.className = 'boot ok'; }
    } catch (err) {
      const box = document.getElementById('boot-error');
      if (box) {
        box.style.display = 'block';
        box.textContent = 'The page could not start: ' + (err && err.message ? err.message : err);
      }
      console.error(err);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  // watchdog: if nothing rendered after 4 s, say so rather than sit blank
  setTimeout(function () {
    const host = document.getElementById('tools');
    if (host && !host.querySelector('.tool')) {
      const box = document.getElementById('boot-error');
      if (box) {
        box.style.display = 'block';
        box.textContent = 'Still starting after 4 seconds. Your browser may be blocking the ' +
          'JavaScript files, or they failed to download. Try a hard refresh (Ctrl+F5).';
      }
    }
  }, 4000);
})();
