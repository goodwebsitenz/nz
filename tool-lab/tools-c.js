/* T21–T30 — dates, plans, diagnostics, geometry */
(function () {
  const { add, money, val, valN, out, bind, dl, svgToPng } = LAB;

  /* ---------------- T21 Due-date calculator ---------------- */
  add({
    n: 21, id: 't21', name: 'Due-Date Calculator', family: 'F10 · Planner',
    what: 'LMP or scan date → <b>estimated due date, trimester calendar and appointment milestones</b>, printable.',
    config: 'Milestone list, disclaimer wording.',
    limits: 'Confirm with the lead maternity carer — stated on the page.',
    body:
      '<div class="grid">' +
      '<label>Method<select data-f="m"><option value="lmp" selected>Last period (LMP)</option>' +
      '<option value="scan">Scan / dating</option></select></label>' +
      '<label>Date<input type="date" data-f="d"></label>' +
      '</div>',
    calc(root) {
      const inp = root.querySelector('[data-f="d"]');
      if (!inp.value) inp.value = new Date().toISOString().slice(0, 10);
      bind(root, function () {
        const base = new Date(val(root, 'd') || new Date().toISOString().slice(0, 10));
        const isScan = val(root, 'm') === 'scan';
        const edd = new Date(base.getTime() + (isScan ? 224 : 280) * 864e5);
        const fmt = d => d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
        const week = Math.floor((new Date() - base) / (7 * 864e5));
        const marks = [[8, 'First midwife visit'], [12, '12-week scan window'], [20, 'Anatomy scan'], [28, '28-week check'], [36, 'Weekly checks begin']];
        out(root, '<div class="big">' + fmt(edd) + '</div>' +
          '<p>' + (isScan ? '' : 'Approx ' + Math.max(0, Math.min(42, week)) + ' weeks now · ') + 'Trimester 2 starts ' + fmt(new Date(base.getTime() + 98 * 864e5)) + '</p>' +
          '<table class="tbl"><tr><th>Week</th><th>Milestone</th></tr>' +
          marks.map(m => '<tr><td>' + m[0] + '</td><td>' + m[1] + ' — ' + fmt(new Date(base.getTime() + (m[0] * 7 - (isScan ? 56 : 0)) * 864e5)) + '</td></tr>').join('') +
          '</table><p class="note">An estimate. Your midwife or scan confirms the date.</p>');
      });
    }
  });

  /* ---------------- T22 Care-plan / prep sheet ---------------- */
  add({
    n: 22, id: 't22', name: 'Care-Plan & Prep Sheet Generator', family: 'F11 · Document',
    what: 'A short form becomes a <b>printable or downloadable sheet</b> — pet care for a sitter, a pre-visit prep list, aftercare notes or an intake form.',
    config: 'Field list, section headings, business letterhead text, disclaimer.',
    limits: 'No medical advice; wording is the business’s own.',
    body:
      '<div class="grid">' +
      '<label>Pet / client name<input type="text" data-f="who" value="Bella"></label>' +
      '<label>Feeding<select data-f="feed"><option>Morning & night, 1 cup</option><option>Once daily, evening</option>' +
      '<option>Free-feed dry only</option></select></label>' +
      '<label>Medication?<input type="text" data-f="meds" placeholder="e.g. half tablet in breakfast"></label>' +
      '<label>Vet / contact<input type="text" data-f="vet" value="Local Vet Clinic, 03 555 1234"></label>' +
      '<label>Notes<input type="text" data-f="notes" placeholder="e.g. nervous of the vacuum"></label>' +
      '</div><p><button class="btn ghost" data-f="dl">Download care sheet</button> <button class="btn ghost" onclick="window.print()">Print</button></p>',
    calc(root) {
      function build() {
        const who = val(root, 'who') || 'your pet';
        return 'CARE PLAN — ' + who + '\n' + new Date().toLocaleDateString('en-NZ') + '\n\n' +
          'Feeding: ' + val(root, 'feed') + '\n' +
          'Medication: ' + (val(root, 'meds') || 'none') + '\n' +
          'Vet / emergency: ' + (val(root, 'vet') || 'not supplied') + '\n' +
          'Notes: ' + (val(root, 'notes') || 'none') + '\n\n' +
          'Prepared by Good Website Co demo. The business confirms all care instructions.';
      }
      bind(root, function () {
        out(root, '<pre class="doc">' + LAB.esc(build()) + '</pre>');
      });
      root.querySelector('[data-f="dl"]').addEventListener('click', () => dl('care-plan.txt', build()));
    }
  });

  /* ---------------- T23 Training plan ---------------- */
  add({
    n: 23, id: 't23', name: 'Training / Practice Plan Generator', family: 'F10/F11 · Planner · Document',
    what: 'Goal, level and sessions per week → <b>a four-week progressive plan</b> the visitor can print or download.',
    config: 'Exercise or drill library, progression rules, session templates.',
    limits: 'General guidance; no diagnosis, no injury rehabilitation.',
    body:
      '<div class="grid">' +
      '<label>Goal<select data-f="goal"><option value="strength">Strength</option>' +
      '<option value="fitness" selected>General fitness</option><option value="recall">Dog recall / obedience</option></select></label>' +
      '<label>Level<select data-f="lvl"><option value="1">Beginner</option><option value="2" selected>Some experience</option><option value="3">Advanced</option></select></label>' +
      '<label>Sessions per week<input type="number" data-f="n" value="3" min="1" max="6"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const goal = val(root, 'goal'), lvl = valN(root, 'lvl', 2), n = Math.max(1, Math.min(6, valN(root, 'n', 3)));
        const base = goal === 'recall'
          ? ['5 min recall drills in the yard', 'Name response with distractions', 'Lead-walking patterns', 'Short public-place session']
          : goal === 'strength'
            ? ['Main lift + accessories', 'Squat / hinge pattern', 'Push / pull superset', 'Core and mobility']
            : ['Interval cardio', 'Full-body circuit', 'Mobility and walk', 'Long easy session'];
        const weeks = [1, 2, 3, 4].map(w => ({ w, sets: 2 + Math.min(2, Math.floor((w + lvl) / 2)), note: w === 4 ? 'Deload or test week' : 'Add a little each session' }));
        out(root, '<table class="tbl"><tr><th>Week</th><th>Focus</th><th>Sessions</th></tr>' +
          weeks.map(x => '<tr><td>' + x.w + '</td><td>' + base[x.w - 1] + '<br><span class="muted">' + x.note + '</span></td><td class="r">' + n + '</td></tr>').join('') +
          '</table><p class="note">General plan only. A coach adjusts it in person.</p>');
      });
    }
  });

  /* ---------------- T24 Roof colour switcher ---------------- */
  add({
    n: 24, id: 't24', name: 'Roof & Exterior Colour Switcher', family: 'F3 · Visualiser',
    what: 'Roof colour plus trim → <b>live recolour of the house, exportable as a PNG</b> to show the family.',
    config: 'Swatch pairs, house illustration, optional real photo.',
    limits: 'Indicative, not a paint match.',
    body:
      '<div class="swatches">' +
      ['#2f3e46', '#5a189a', '#7f1d1d', '#166534', '#334155', '#b45309', '#0f766e', '#4b5563']
        .map(c => '<button class="sw" data-roof="' + c + '" style="background:' + c + '"></button>').join('') +
      '</div>' +
      '<svg id="t24svg" viewBox="0 0 400 220" width="100%" role="img" aria-label="Roof preview">' +
      '<rect width="400" height="220" fill="#e8eef4"/><rect y="180" width="400" height="40" fill="#d5dfe7"/>' +
      '<polygon id="t24roof" points="200,26 366,116 34,116" fill="#2f3e46"/>' +
      '<rect x="60" y="116" width="280" height="64" fill="#f7f5f1" stroke="#cfd8df"/>' +
      '<rect id="t24trim" x="60" y="116" width="280" height="8" fill="#8a6a4f"/>' +
      '<rect x="180" y="140" width="40" height="40" fill="#7f1d1d"/>' +
      '</svg><p><button class="btn ghost" data-f="dl">Download PNG</button></p>',
    calc(root) {
      const svg = root.querySelector('#t24svg');
      const roof = root.querySelector('#t24roof'), trim = root.querySelector('#t24trim');
      let stage = 0;
      root.querySelectorAll('[data-roof]').forEach(b => b.addEventListener('click', () => {
        const c = b.dataset.roof;
        if (stage % 2 === 0) { roof.setAttribute('fill', c); out(root, '<p class="note">Roof set to ' + c + ' — click again for trim.</p>'); }
        else { trim.setAttribute('fill', c); out(root, '<p class="note">Roof ' + roof.getAttribute('fill') + ' · trim ' + c + '.</p>'); }
        stage++;
      }));
      root.querySelector('[data-f="dl"]').addEventListener('click', () => svgToPng(svg, 'roof-colour.png', 1200, 660));
      out(root, '<p class="note">Click a colour for the roof, then another for the trim.</p>');
    }
  });

  /* ---------------- T25 Tyre size + rotation ---------------- */
  add({
    n: 25, id: 't25', name: 'Tyre Size Finder + Rotation Planner', family: 'F7/F10 · Sizing · Planner',
    what: 'Tyre size decoded, tread readings scored, and a <b>rotation schedule with real dates</b> based on kilometres driven.',
    config: 'Size decoder tables, wear thresholds, rotation intervals.',
    limits: 'No fitment guarantee; alignment is a workshop check.',
    body:
      '<div class="grid">' +
      '<label>Tyre size<input type="text" data-f="size" value="225/45R17"></label>' +
      '<label>Tread depth (mm)<input type="number" data-f="tread" value="4.5" step="0.5"></label>' +
      '<label>Km driven per month<input type="number" data-f="km" value="1200" step="100"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const m = (val(root, 'size') || '').match(/(\d{3})\/(\d{2})R(\d{2})/i);
        const tread = valN(root, 'tread', 4);
        const km = Math.max(1, valN(root, 'km', 1000));
        if (!m) { out(root, '<p class="err">Use a size like 225/45R17.</p>'); return; }
        const [, w, p, r] = m;
        const sidewall = (Number(w) * Number(p) / 100) / 10;
        const diameter = Number(r) * 2.54 + sidewall * 2;
        const verdict = tread <= 1.6 ? 'At the legal limit — replace now' : tread <= 3 ? 'Wearing — plan replacement' : 'Healthy';
        const mmLeft = Math.max(0, tread - 1.6);
        const months = Math.round(mmLeft / 1.5 * 10000 / km);
        const next = new Date(Date.now() + Math.max(1, Math.round(10000 / km)) * 30 * 864e5);
        out(root, '<div class="big">' + diameter.toFixed(1) + ' cm</div>' +
          '<table class="tbl">' +
          '<tr><td>Width / profile / rim</td><td class="r">' + w + ' mm · ' + p + '% · ' + r + '"</td></tr>' +
          '<tr><td>Overall diameter</td><td class="r">' + diameter.toFixed(1) + ' cm</td></tr>' +
          '<tr><td>Tread verdict</td><td class="r">' + verdict + '</td></tr>' +
          '<tr><td>Rotation due</td><td class="r">' + next.toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }) + '</td></tr>' +
          '<tr class="tot"><td>Est. remaining life</td><td class="r">' + months + ' months</td></tr></table>');
      });
    }
  });

  /* ---------------- T26 Security check ---------------- */
  add({
    n: 26, id: 't26', name: 'Security Self-Check + Rekey Decision', family: 'F9/F13 · Quiz · Configurator',
    what: 'Ten quick questions → <b>a score, prioritised weak points</b> and whether rekeying or replacing locks makes more sense.',
    config: 'Question weights, lock types, price bands.',
    limits: 'No alarm or monitoring integration.',
    body:
      '<div class="checks">' +
      ['Deadbolt on every external door', 'Security stays on all windows', 'Locks changed since moving in',
       'Keys given to trades/tenants tracked', 'Sensor light at the main entrance', 'Spare key not hidden outside',
       'Sliding door has a lock', 'Garage connects to house securely', 'Mailbox is lockable', 'Keys not labelled with the address']
        .map((q, i) => '<label class="chk"><input type="checkbox" data-f="q' + i + '"' + (i < 3 ? ' checked' : '') + '> ' + q + '</label>').join('') +
      '</div>' +
      '<label class="wide">Situation<select data-f="sit"><option value="new">Just moved in</option>' +
      '<option value="lost">A key has gone missing</option><option value="old">Locks are old / stiff</option></select></label>',
    calc(root) {
      bind(root, function () {
        let yes = 0;
        root.querySelectorAll('.chk input').forEach(c => { if (c.checked) yes++; });
        const sit = val(root, 'sit');
        const gaps = 10 - yes;
        const advice = sit === 'lost' ? 'Rekey now — replacing every lock is usually unnecessary and costs more.'
          : sit === 'old' ? 'Replace the failing locks only; rekey the rest.'
            : 'Rekey first (cheaper than replacing), then sort the gaps below.';
        out(root, '<div class="big">' + yes + '/10</div>' +
          '<p>' + (gaps === 0 ? 'Nothing obvious missing.' : gaps + ' gap' + (gaps === 1 ? '' : 's') + ' worth closing.') + '</p>' +
          '<p><b>Recommendation:</b> ' + advice + '</p>' +
          '<p class="note">Rekey band $120–$200 · lock replacement $180–$320 per door. A site visit confirms.</p>');
      });
    }
  });

  /* ---------------- T27 Appliance triage ---------------- */
  add({
    n: 27, id: 't27', name: 'Appliance Fault Triage', family: 'F9 · Quiz',
    what: 'Appliance type plus symptom → <b>likely fault category, safe checks to try</b>, and whether a call-out is warranted.',
    config: 'Fault tree per appliance, safety notes.',
    limits: 'Never advises work on gas or fixed wiring.',
    body:
      '<div class="grid">' +
      '<label>Appliance<select data-f="app"><option>Washing machine</option><option>Fridge / freezer</option>' +
      '<option>Oven</option><option>Dishwasher</option><option>Dryer</option></select></label>' +
      '<label>Symptom<select data-f="sym"><option value="power">No power / dead</option>' +
      '<option value="noise" selected>Loud noise</option><option value="leak">Leaking water</option>' +
      '<option value="drain">Not draining</option><option value="cold">Not heating / not cooling</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const app = val(root, 'app'), sym = val(root, 'sym');
        const MAP = {
          power: ['Power supply or control board', 'Check the plug, the socket with another appliance, and the fuse/RCD. If that is fine, it needs a technician.'],
          noise: ['Bearings, drum or motor mount', 'Check the machine is level and not touching the wall; an unbalanced load causes most noise. Persistent grinding needs a call-out.'],
          leak: ['Hose, seal or pump housing', 'Check inlet and drain hoses are seated and not split. Stop using it if water reaches electrical parts.'],
          drain: ['Blocked filter or pump', 'Clean the filter and check the drain hose is not kinked. If it still will not drain, the pump is likely gone.'],
          cold: ['Thermostat, element or refrigerant', 'For a fridge, check door seals and clearances first. Gas work is licensed — book a technician.']
        };
        const [likely, advice] = MAP[sym];
        out(root, '<div class="big">' + likely + '</div>' +
          '<p><b>' + app + ':</b> ' + advice + '</p>' +
          '<p class="note">Safe checks only. Nothing here involves gas or fixed wiring — those get a licensed technician.</p>' +
          '<p><button class="btn ghost" onclick="window.print()">Print prep sheet (make, model, age)</button></p>');
      });
    }
  });

  /* ---------------- T28 Pest identifier ---------------- */
  add({
    n: 28, id: 't28', name: 'Pest Identifier + Prep', family: 'F9/F10 · Quiz · Planner',
    what: 'Evidence questions → <b>likely pest, urgency band and a prep checklist</b> before treatment.',
    config: 'Pest library, evidence mapping, treatment intervals.',
    limits: 'Indicative only; a site inspection confirms.',
    body:
      '<div class="checks">' +
      [['Droppings found', 'rodent'], ['Scratching in the ceiling at night', 'rodent'], ['Small conical holes in soil', 'ant'],
       ['Winged insects near lights', 'ant'], ['Bites on skin after being outdoors', 'flea'], ['Live insects in the kitchen', 'cockroach'],
       ['Webbing on plants', 'spider'], ['Damaged timber or frass', 'borer']]
        .map(([label, key], i) => '<label class="chk"><input type="checkbox" data-f="e' + i + '" data-key="' + key + '"> ' + label + '</label>').join('') +
      '</div>',
    calc(root) {
      bind(root, function () {
        const score = {};
        root.querySelectorAll('.chk input').forEach(c => { if (c.checked) score[c.dataset.key] = (score[c.dataset.key] || 0) + 1; });
        const best = Object.keys(score).sort((a, b) => score[b] - score[a])[0];
        const INFO = {
          rodent: ['Rodents (rats / mice)', 'High — treat within days', 'Clear food sources, seal gaps, and note where you heard or saw activity.'],
          ant: ['Ants', 'Medium — treat within a week', 'Clean trails with vinegar (not bleach), note entry points, and keep pets away during treatment.'],
          flea: ['Fleas', 'High — pets and bedding involved', 'Wash pet bedding hot, treat the pet first, and vacuum daily before the visit.'],
          cockroach: ['Cockroaches', 'High — kitchen area', 'Empty lower cupboards, clean behind appliances, and clear the floor for access.'],
          spider: ['Spiders', 'Low to medium', 'Note webs and entry points; most are harmless and treated as part of a general spray.'],
          borer: ['Borer', 'Medium — structural check needed', 'Note any fresh frass and the timber affected; the technician confirms activity.']
        };
        if (!best) { out(root, '<p class="muted">Tick the evidence you have found.</p>'); return; }
        const [name, urgency, prep] = INFO[best];
        out(root, '<div class="big">' + name + '</div>' +
          '<p><b>Urgency:</b> ' + urgency + '</p>' +
          '<p><b>Before we arrive:</b> ' + prep + '</p>' +
          '<p class="note">Identification is indicative — a site inspection confirms species and treatment.</p>');
      });
    }
  });

  /* ---------------- T29 Drain fall / slope ---------------- */
  add({
    n: 29, id: 't29', name: 'Drain Fall / Slope Calculator', family: 'F7 · Sizing',
    what: 'Run length and gradient → <b>fall in mm, invert levels at each end and trench volume</b>.',
    config: 'Gradient presets, pipe sizes, units.',
    limits: 'Depth, consent and bedding rules are site-specific.',
    body:
      '<div class="grid">' +
      '<label>Run length (m)<input type="number" data-f="len" value="14" step="0.5"></label>' +
      '<label>Gradient<select data-f="g"><option value="1">1:100 (1%)</option>' +
      '<option value="1.5" selected>1:60 (1.67%)</option><option value="2">1:50 (2%)</option></select></label>' +
      '<label>Pipe diameter (mm)<input type="number" data-f="dia" value="100" step="25"></label>' +
      '<label>Start invert depth (mm)<input type="number" data-f="start" value="400" step="50"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const len = Math.max(0.1, valN(root, 'len', 10)), g = valN(root, 'g', 1.5);
        const dia = valN(root, 'dia', 100), start = valN(root, 'start', 400);
        const fall = len * 1000 * (g / 100);
        const end = start + fall;
        const trench = len * (dia / 1000 + 0.3) * 0.6;
        out(root, '<div class="big">' + Math.round(fall) + ' mm fall</div>' +
          '<table class="tbl">' +
          '<tr><td>Start invert</td><td class="r">' + start + ' mm</td></tr>' +
          '<tr><td>End invert</td><td class="r">' + Math.round(end) + ' mm</td></tr>' +
          '<tr><td>Gradient</td><td class="r">1:' + Math.round(100 / (g / 100)) + '</td></tr>' +
          '<tr class="tot"><td>Trench volume ≈</td><td class="r">' + trench.toFixed(1) + ' m³</td></tr></table>' +
          '<p class="note">Minimum gradients and bedding rules depend on the pipe and consent — confirmed on site.</p>');
      });
    }
  });

  /* ---------------- T30 Deck take-off ---------------- */
  add({
    n: 30, id: 't30', name: 'Deck & Framing Take-off', family: 'F2/F10 · Materials · Planner',
    what: 'Deck size and spacings → <b>joists, bearers, decking boards, fixings, footings and a cost band</b>.',
    config: 'Spacing tables, timber sizes, prices.',
    limits: 'Bracing and consent requirements are site-specific.',
    body:
      '<div class="grid">' +
      '<label>Deck length (m)<input type="number" data-f="l" value="6" step="0.1"></label>' +
      '<label>Deck width (m)<input type="number" data-f="w" value="4" step="0.1"></label>' +
      '<label>Joist spacing (mm)<input type="number" data-f="js" value="450" step="50"></label>' +
      '<label>Decking board width (mm)<input type="number" data-f="bw" value="140" step="10"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const l = valN(root, 'l'), w = valN(root, 'w');
        const js = Math.max(200, valN(root, 'js', 450)) / 1000;
        const bw = Math.max(50, valN(root, 'bw', 140)) / 1000;
        const joists = Math.ceil(w / js) + 1;
        const joistLen = joists * l;
        const bearers = Math.ceil(l / 1.8) + 1;
        const bearerLen = bearers * w;
        const boards = Math.ceil(w / (bw + 0.005)) * Math.ceil(l / 4.8);
        const footing = bearers * 2;
        const cost = joistLen * 9 + bearerLen * 14 + boards * 26 + footing * 22;
        out(root, '<div class="big">' + (l * w).toFixed(1) + ' m² deck</div>' +
          '<table class="tbl"><tr><th>Material</th><th class="r">Qty</th></tr>' +
          '<tr><td>Joists @ ' + (js * 1000) + ' mm centres</td><td class="r">' + joists + ' × ' + l + ' m</td></tr>' +
          '<tr><td>Bearers</td><td class="r">' + bearers + ' × ' + w + ' m</td></tr>' +
          '<tr><td>Decking boards (4.8 m)</td><td class="r">' + boards + '</td></tr>' +
          '<tr><td>Footings / piles</td><td class="r">' + footing + '</td></tr>' +
          '<tr class="tot"><td>Materials ≈</td><td class="r">' + money(cost) + '</td></tr></table>' +
          '<p class="note">Bracing, fixings and consent are confirmed after a site check.</p>');
      });
    }
  });
})();
