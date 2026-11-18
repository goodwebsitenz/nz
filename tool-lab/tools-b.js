/* T11–T20 — volume, frequency, timetable, packages, documents */
(function () {
  const { add, money, num, val, valN, out, bind, dl, ics, nextWeekday } = LAB;

  /* ---------------- T11 Skip bin volume ---------------- */
  add({
    n: 11, id: 't11', name: 'Skip Bin Volume Estimator', family: 'F2/F13 · Materials · Configurator',
    what: 'Tick what is being thrown out, or type a volume → <b>recommended bin size, weight warning and restricted-item block</b>.',
    config: 'Bin sizes, item volume table, restriction list, prices, weight limits.',
    limits: 'Weight limits vary by contractor and council — the demo says so.',
    body:
      '<div class="checks">' +
      [['Old furniture', 1.2], ['Green waste', 1.5], ['Renovation offcuts', 2.0], ['Whiteware', 0.8],
       ['Rubbish bags (x10)', 0.6], ['Soil / concrete (heavy)', 0.5], ['Tyres', 0.3]]
        .map(([n, v], i) => '<label class="chk"><input type="checkbox" data-f="i' + i + '" data-v="' + v + '"> ' + n + '</label>').join('') +
      '</div>' +
      '<label class="wide">Restricted items present?<select data-f="bad"><option value="">No</option>' +
      '<option value="1">Liquid paint / chemicals / asbestos suspected</option></select></label>',
    calc(root) {
      bind(root, function () {
        let vol = 0;
        root.querySelectorAll('input[type=checkbox][data-v]').forEach(c => { if (c.checked) vol += parseFloat(c.dataset.v); });
        const bad = !!val(root, 'bad');
        const bins = [2, 3, 4, 6, 9, 12];
        const bin = bins.find(b => b >= vol * 1.1) || 12;
        if (bad) {
          out(root, '<p class="err">Stop — liquids, chemicals and asbestos cannot go in a skip. The business refers these to a licensed handler.</p>');
          return;
        }
        out(root, '<div class="big">' + vol.toFixed(1) + ' m³</div>' +
          '<p>Recommended bin: <b>' + (bin === 12 && vol > 12 ? 'multiple 12 m³ bins' : bin + ' m³') + '</b> (10% spare)</p>' +
          '<table class="tbl"><tr><td>Indicative hire</td><td class="r">' + money(180 + bin * 45) + '</td></tr>' +
          '<tr><td>Weight caution</td><td class="r">' + (vol > 3 ? 'heavy loads priced by weight' : 'standard') + '</td></tr></table>');
      });
    }
  });

  /* ---------------- T12 Cleaning price band ---------------- */
  add({
    n: 12, id: 't12', name: 'Cleaning Price Band + Frequency', family: 'F1/F5 · Quote · Package',
    what: 'Rooms, bathrooms, condition and frequency → <b>hours, per-visit band, monthly cost and the recurring saving</b>.',
    config: 'Minutes per room type, hourly band, frequency discounts, minimum hours.',
    limits: 'Condition is subjective — the range widens deliberately.',
    body:
      '<div class="grid">' +
      '<label>Bedrooms<input type="number" data-f="beds" value="3" min="0"></label>' +
      '<label>Bathrooms<input type="number" data-f="baths" value="1" min="0"></label>' +
      '<label>Living / kitchen areas<input type="number" data-f="living" value="2" min="0"></label>' +
      '<label>Condition<select data-f="cond"><option value="1">Tidy</option><option value="1.2" selected>Average</option><option value="1.5">Needs a deep clean</option></select></label>' +
      '<label>Frequency<select data-f="freq"><option value="1">One-off</option><option value="0.9" selected>Fortnightly</option><option value="0.85">Weekly</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const mins = valN(root, 'beds') * 25 + valN(root, 'baths') * 35 + valN(root, 'living') * 20;
        const hours = Math.max(2, mins / 60 * valN(root, 'cond', 1.2));
        const rate = 42;
        const freq = valN(root, 'freq', 1);
        const per = hours * rate * freq;
        const monthly = freq === 1 ? per : per * (freq === 0.9 ? 2.17 : 4.33);
        out(root, '<div class="big">' + hours.toFixed(1) + ' hours</div>' +
          '<table class="tbl">' +
          '<tr><td>Per visit (band)</td><td class="r">' + money(per * 0.9) + ' – ' + money(per * 1.15) + '</td></tr>' +
          '<tr><td>Monthly equivalent</td><td class="r">' + money(monthly * 0.9) + ' – ' + money(monthly * 1.15) + '</td></tr>' +
          (freq !== 1 ? '<tr class="tot"><td>Recurring discount</td><td class="r">' + Math.round((1 - freq) * 100) + '%</td></tr>' : '') +
          '</table><p class="note">Minimum booking 2 hours. Deep cleans and ovens priced separately.</p>');
      });
    }
  });

  /* ---------------- T13 Lawn ---------------- */
  add({
    n: 13, id: 't13', name: 'Lawn Area + Mow Planner', family: 'F2/F10 · Materials · Planner',
    what: 'Section dimensions → <b>m², mow time, seasonal frequency, edge length, price band and next-cut date</b>.',
    config: 'm² per minute, minimum charge, season multipliers, rates.',
    limits: 'Access, slope and obstacles change real time.',
    body:
      '<div class="grid">' +
      '<label>Lawn length (m)<input type="number" data-f="l" value="22" step="0.5"></label>' +
      '<label>Lawn width (m)<input type="number" data-f="w" value="14" step="0.5"></label>' +
      '<label>Obstacles (trees, beds, shed)<input type="number" data-f="ob" value="4" min="0"></label>' +
      '<label>Season<select data-f="s"><option value="1">Spring</option><option value="0.85" selected>Summer</option>' +
      '<option value="0.7">Autumn</option><option value="0.5">Winter</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const l = valN(root, 'l'), w = valN(root, 'w');
        const gross = l * w;
        const net = Math.max(0, gross - valN(root, 'ob') * 8);
        const minutes = net / 55 + 6;
        const season = valN(root, 's', 0.85);
        const price = Math.max(60, net * 0.11);
        const days = Math.round(7 / season);
        const next = new Date(Date.now() + days * 864e5).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
        out(root, '<div class="big">' + net.toFixed(0) + ' m²</div>' +
          '<table class="tbl">' +
          '<tr><td>Mow time</td><td class="r">' + Math.round(minutes) + ' min</td></tr>' +
          '<tr><td>Per visit band</td><td class="r">' + money(price * 0.9) + ' – ' + money(price * 1.15) + '</td></tr>' +
          '<tr><td>Recommended cycle</td><td class="r">every ' + days + ' days</td></tr>' +
          '<tr class="tot"><td>Next cut</td><td class="r">' + next + '</td></tr></table>');
      });
    }
  });

  /* ---------------- T14 Pool ---------------- */
  add({
    n: 14, id: 't14', name: 'Pool Volume + Turnover + Maintenance', family: 'F7/F10 · Sizing · Planner',
    what: 'Pool shape and dimensions → <b>litres, filter hours for a full turnover, backwash reminder and seasonal task calendar</b>.',
    config: 'Volume formulas per shape, filter flow rates, target turnover hours, task list.',
    limits: 'No chemical dosing — deliberate safety decision.',
    body:
      '<div class="grid">' +
      '<label>Shape<select data-f="shape"><option value="rect" selected>Rectangle</option>' +
      '<option value="round">Round</option><option value="kidney">Kidney / freeform</option></select></label>' +
      '<label>Length (m)<input type="number" data-f="l" value="8" step="0.1"></label>' +
      '<label>Width / diameter (m)<input type="number" data-f="w" value="4" step="0.1"></label>' +
      '<label>Average depth (m)<input type="number" data-f="d" value="1.5" step="0.1"></label>' +
      '<label>Filter flow (m³/h)<input type="number" data-f="flow" value="12" step="1"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const s = val(root, 'shape'), l = valN(root, 'l'), w = valN(root, 'w'), d = valN(root, 'd', 1.5);
        const flow = Math.max(1, valN(root, 'flow', 12));
        const area = s === 'round' ? Math.PI * Math.pow(w / 2, 2) : s === 'kidney' ? l * w * 0.8 : l * w;
        const m3 = area * d;
        const litres = m3 * 1000;
        const turnover = m3 / flow;
        const run = turnover * 2;
        out(root, '<div class="big">' + Math.round(litres).toLocaleString('en-NZ') + ' litres</div>' +
          '<table class="tbl">' +
          '<tr><td>Volume</td><td class="r">' + m3.toFixed(1) + ' m³</td></tr>' +
          '<tr><td>One full turnover</td><td class="r">' + turnover.toFixed(1) + ' h</td></tr>' +
          '<tr class="tot"><td>Recommended daily run</td><td class="r">' + run.toFixed(0) + ' h</td></tr></table>' +
          '<p class="note">Season plan: filter longer in summer, backwash monthly, and bring a water sample in for testing. Chemical dosing is done in person, never online.</p>');
      });
    }
  });

  /* ---------------- T15 Timetable + ICS ---------------- */
  add({
    n: 15, id: 't15', name: 'Timetable Finder + ICS Export', family: 'F6 · Timetable',
    what: 'Filter classes by day and level, see the <b>next session countdown</b>, and add one to a real calendar file.',
    config: 'Class list (day, time, duration, level), term dates, level labels.',
    limits: 'Must be refreshed each term — a five-minute edit.',
    body:
      '<div class="grid">' +
      '<label>Day<select data-f="day"><option value="">Any day</option>' +
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => '<option value="' + i + '">' + d + '</option>').join('') + '</select></label>' +
      '<label>Level<select data-f="lvl"><option value="">All levels</option><option>Beginner</option><option>Open</option><option>Advanced</option></select></label>' +
      '</div><p><button class="btn ghost" data-f="ics">Add next matching class to calendar</button></p>',
    calc(root) {
      const CLASSES = [
        { d: 1, h: 6, dur: 45, name: 'Reformer — Early', lvl: 'Open' },
        { d: 1, h: 12.25, dur: 45, name: 'Reformer — Lunch', lvl: 'Beginner' },
        { d: 2, h: 17.5, dur: 50, name: 'Mat Pilates', lvl: 'Open' },
        { d: 3, h: 6, dur: 45, name: 'Reformer — Early', lvl: 'Advanced' },
        { d: 4, h: 18, dur: 45, name: 'Reformer — Evening', lvl: 'Beginner' },
        { d: 6, h: 9, dur: 60, name: 'Saturday Flow', lvl: 'Open' }
      ];
      function current() {
        const day = val(root, 'day'), lvl = val(root, 'lvl');
        return CLASSES.filter(c => (day === '' || +day === c.d) && (!lvl || c.lvl === lvl));
      }
      function draw() {
        const list = current();
        const next = list.map(c => {
          const dt = nextWeekday(c.d, Math.floor(c.h), Math.round((c.h % 1) * 60));
          return { c, dt };
        }).sort((a, b) => a.dt - b.dt);
        root.querySelector('[data-out]').innerHTML = next.length          ? '<table class="tbl"><tr><th>Class</th><th>When</th><th>Level</th></tr>' +
            next.map(x => '<tr><td>' + x.c.name + '</td><td>' + x.dt.toLocaleDateString('en-NZ', { weekday: 'short' }) + ' ' +
              String(Math.floor(x.c.h)).padStart(2, '0') + ':' + String(Math.round((x.c.h % 1) * 60)).padStart(2, '0') +
              '</td><td>' + x.c.lvl + '</td></tr>').join('') + '</table>' +
            '<p class="note">Next class in ' + Math.max(0, Math.round((next[0].dt - Date.now()) / 36e5)) + ' hours.</p>'
          : '<p class="muted">No classes match that filter.</p>';
      }
      root.querySelectorAll('[data-f="day"],[data-f="lvl"]').forEach(e => e.addEventListener('change', draw));
      draw();
      root.querySelector('[data-f="ics"]').addEventListener('click', () => {
        const list = current().map(c => {
          const start = nextWeekday(c.d, Math.floor(c.h), Math.round((c.h % 1) * 60));
          return { start, end: new Date(start.getTime() + c.dur * 6e4), title: c.name + ' (' + c.lvl + ')', desc: 'Booked via the studio site' };
        });
        if (!list.length) return;
        dl('class.ics', ics(list), 'text/calendar');
      });
    }
  });

  /* ---------------- T16 Package builder ---------------- */
  add({
    n: 16, id: 't16', name: 'Package Builder', family: 'F5 · Package',
    what: 'Tick services and durations → <b>bundle total, per-visit price and the saving versus booking individually</b>.',
    config: 'Service table (duration + price), package rules, discount logic.',
    limits: 'No invented “was/now” pricing — Fair Trading.',
    body:
      '<div class="checks">' +
      [['Cut & finish', 65, 1], ['Colour — full', 210, 2], ['Colour — regrowth', 120, 1],
       ['Treatment', 30, 0.7], ['Blow-wave', 45, 1], ['Bridal trial', 90, 1.4]]
        .map(([n, m, u], i) => '<label class="chk"><input type="checkbox" data-f="s' + i + '"' + (i === 0 ? ' checked' : '') + '> ' + n + ' <span class="muted">' + m + ' min</span></label>').join('') +
      '</div>' +
      '<label class="wide">Visit every<select data-f="freq"><option value="1">once (no saving)</option>' +
      '<option value="3" selected>3 weeks (5% off)</option><option value="2">2 weeks (8% off)</option></select></label>',
    calc(root) {
      const SVC = [['Cut & finish', 65, 1], ['Colour — full', 210, 2], ['Colour — regrowth', 120, 1],
        ['Treatment', 30, 0.7], ['Blow-wave', 45, 1], ['Bridal trial', 90, 1.4]];
      bind(root, function () {
        let mins = 0, price = 0, count = 0;
        SVC.forEach((s, i) => {
          const c = root.querySelector('[data-f="s' + i + '"]');
          if (c && c.checked) { mins += s[1]; price += s[1] * s[2]; count++; }
        });
        const save = count >= 2 ? (count >= 3 ? 0.10 : 0.05) : 0;
        const total = price * (1 - save);
        out(root, '<div class="big">' + money(total) + '</div>' +
          '<p>' + count + ' service' + (count === 1 ? '' : 's') + ' · ' + mins + ' min in the chair</p>' +
          (save ? '<p>Bundle saving ' + Math.round(save * 100) + '% (−' + money(price - total) + ')</p>' : '') +
          '<p class="note">Indicative pricing — the salon confirms at booking.</p>');
      });
    }
  });

  /* ---------------- T17 Wedding run-sheet + budget ---------------- */
  add({
    n: 17, id: 't17', name: 'Wedding Run-sheet + Budget Splitter', family: 'F10/F11 · Planner · Document',
    what: 'Ceremony time plus the moments that matter → <b>a timed run-sheet with buffers, printable</b>, and a budget split by category.',
    config: 'Moment library with durations, travel allowances, budget bands, letterhead.',
    limits: 'Category percentages are guidance; no vendor pricing.',
    body:
      '<div class="grid">' +
      '<label>Ceremony time<input type="time" data-f="cer" value="15:00"></label>' +
      '<label>Travel to venue (min)<input type="number" data-f="travel" value="20" min="0"></label>' +
      '<label>Total budget ($)<input type="number" data-f="budget" value="30000" step="500"></label>' +
      '</div>' +
      '<div class="checks">' +
      [['First look photos', 30], ['Guests arrive', 30], ['Ceremony', 40], ['Group photos', 30],
       ['Canapés', 45], ['Speeches', 25], ['First dance', 10]]
        .map(([n, m], i) => '<label class="chk"><input type="checkbox" data-f="m' + i + '"' + (i > 0 ? ' checked' : '') + '> ' + n + ' <span class="muted">' + m + ' min</span></label>').join('') +
      '</div><p><button class="btn ghost" data-f="dl">Download run-sheet</button> <button class="btn ghost" onclick="window.print()">Print</button></p>',
    calc(root) {
      const MOMENTS = [['First look photos', 30], ['Guests arrive', 30], ['Ceremony', 40],
        ['Group photos', 30], ['Canapés', 45], ['Speeches', 25], ['First dance', 10]];
      function rows() {
        const picked = [];
        MOMENTS.forEach((m, i) => { const c = root.querySelector('[data-f="m' + i + '"]'); if (c && c.checked) picked.push(m); });
        const travel = valN(root, 'travel', 20);
        const [hh, mm] = (val(root, 'cer') || '15:00').split(':').map(Number);
        let t = hh * 60 + mm - travel - 30;
        return picked.map((m, i) => {
          const s = t, e = t + m[1];
          t = e + (i === picked.length - 1 ? 0 : 5);
          return { name: m[0], s: s, e: e };
        });
      }
      const fmt = t => (Math.floor((t + 1440) % 1440 / 60) + '').padStart(2, '0') + ':' + (t % 60 + '').padStart(2, '0');
      bind(root, function () {
        const r = rows();
        const budget = valN(root, 'budget', 30000);
        const split = [['Venue & catering', 0.45], ['Photography', 0.15], ['Attire', 0.12], ['Flowers', 0.08], ['Celebrant & music', 0.08], ['Stationery & misc', 0.12]];
        out(root, '<table class="tbl"><tr><th>Time</th><th>Moment</th></tr>' +
          r.map(x => '<tr><td>' + fmt(x.s) + '–' + fmt(x.e) + '</td><td>' + x.name + '</td></tr>').join('') +
          '</table>' +
          '<p class="note">Budget split: ' + split.map(s => s[0] + ' ' + money(budget * s[1])).join(' · ') + '</p>');
      });
      root.querySelector('[data-f="dl"]').addEventListener('click', () => {
        const r = rows();
        const txt = 'WEDDING RUN-SHEET\n\n' + r.map(x => fmt(x.s) + '–' + fmt(x.e) + '  ' + x.name).join('\n') +
          '\n\nBudget: ' + money(valN(root, 'budget', 30000)) + '\n';
        dl('wedding-run-sheet.txt', txt);
      });
    }
  });

  /* ---------------- T18 Mortgage ---------------- */
  add({
    n: 18, id: 't18', name: 'Mortgage Repayment + Borrowing', family: 'F7/F8 · Sizing · Savings',
    what: 'Price, deposit, rate and term → <b>repayments per week, fortnight or month, total interest and a +1% stress test</b>.',
    config: 'Default rates with an “as at” date, low-deposit note, currency, disclaimer.',
    limits: 'Indicative only — not financial advice.',
    body:
      '<div class="grid">' +
      '<label>Purchase price ($)<input type="number" data-f="price" value="750000" step="5000"></label>' +
      '<label>Deposit ($)<input type="number" data-f="dep" value="150000" step="5000"></label>' +
      '<label>Interest rate (%)<input type="number" data-f="rate" value="6.15" step="0.05"></label>' +
      '<label>Term (years)<input type="number" data-f="years" value="30" step="1"></label>' +
      '</div>',
    calc(root) {
      const pay = (P, r, n) => r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
      bind(root, function () {
        const price = valN(root, 'price', 0), dep = valN(root, 'dep', 0);
        const rate = valN(root, 'rate', 6) / 100 / 12, years = Math.max(1, valN(root, 'years', 30));
        const loan = Math.max(0, price - dep), n = years * 12;
        const m = pay(loan, rate, n);
        const m2 = pay(loan, rate + 0.01, n);
        const interest = m * n - loan;
        const lvr = price ? dep / price : 0;
        out(root, '<div class="big">' + money(m) + ' / month</div>' +
          '<table class="tbl">' +
          '<tr><td>Loan</td><td class="r">' + money(loan) + '</td></tr>' +
          '<tr><td>Per week / fortnight</td><td class="r">' + money(m * 12 / 52) + ' · ' + money(m * 12 / 26) + '</td></tr>' +
          '<tr><td>Total interest over term</td><td class="r">' + money(interest) + '</td></tr>' +
          '<tr><td>If rates rise 1%</td><td class="r">' + money(m2) + ' (+' + money(m2 - m) + ')</td></tr>' +
          '<tr class="tot"><td>Deposit (LVR)</td><td class="r">' + Math.round(lvr * 100) + '%' + (lvr < 0.2 ? ' — low deposit rules may apply' : '') + '</td></tr>' +
          '</table><p class="note">Illustration only, not financial advice. Rates shown are examples.</p>');
      });
    }
  });

  /* ---------------- T19 GST / hourly / tax dates ---------------- */
  add({
    n: 19, id: 't19', name: 'GST, Hourly Rate & Tax Dates', family: 'F8/F10 · Savings · Planner',
    what: 'Three small tools: <b>GST in/out split, the hourly rate you need to charge, and upcoming provisional tax dates</b>.',
    config: 'GST rate, NZ tax calendar per year, disclaimer.',
    limits: 'Calendar must be reviewed annually.',
    body:
      '<div class="grid">' +
      '<label>Amount ($)<input type="number" data-f="amt" value="1000" step="10"></label>' +
      '<label>GST rate (%)<input type="number" data-f="gst" value="15" step="0.5"></label>' +
      '<label>Target income / yr ($)<input type="number" data-f="inc" value="90000" step="1000"></label>' +
      '<label>Billable hours / week<input type="number" data-f="hrs" value="25" step="1"></label>' +
      '<label>Weeks worked / yr<input type="number" data-f="wks" value="46" step="1"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const amt = valN(root, 'amt', 0), gst = valN(root, 'gst', 15) / 100;
        const ex = amt / (1 + gst), gstPart = amt - ex;
        const rate = valN(root, 'inc', 0) / Math.max(1, valN(root, 'hrs', 25) * valN(root, 'wks', 46));
        const today = new Date();
        const y = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
        const dates = [
          ['GST return (2-monthly)', new Date(y, 7, 28)],
          ['Provisional tax — 28 Aug', new Date(y, 7, 28)],
          ['Provisional tax — 15 Jan', new Date(y + 1, 0, 15)],
          ['Provisional tax — 7 May', new Date(y + 1, 4, 7)],
          ['IR3 income tax return', new Date(y + 1, 6, 7)]
        ].filter(d => d[1] > today).sort((a, b) => a[1] - b[1]).slice(0, 3);
        out(root, '<table class="tbl">' +
          '<tr><td>Excl. GST</td><td class="r">' + money(ex) + '</td></tr>' +
          '<tr><td>GST portion</td><td class="r">' + money(gstPart) + '</td></tr>' +
          '<tr class="tot"><td>Hourly rate needed</td><td class="r">' + money(rate) + '/hr</td></tr></table>' +
          '<p class="note">Next dates: ' + dates.map(d => d[0] + ' — ' + d[1].toLocaleDateString('en-NZ')).join(' · ') + '</p>' +
          '<p class="note">General information only, not tax advice.</p>');
      });
    }
  });

  /* ---------------- T20 Print size on wall ---------------- */
  add({
    n: 20, id: 't20', name: 'Print Size & Wall Visualiser', family: 'F3/F7 · Visualiser · Sizing',
    what: 'Pick a print size and your wall width → <b>the print shown to scale on a wall</b>, plus a resolution warning for the file you have.',
    config: 'Size catalogue, wall illustration, room presets, DPI threshold.',
    limits: 'Illustrative scale only.',
    body:
      '<div class="grid">' +
      '<label>Print size<select data-f="size"><option value="30x40">30 × 40 cm</option>' +
      '<option value="50x70" selected>50 × 70 cm</option><option value="60x90">60 × 90 cm</option>' +
      '<option value="90x120">90 × 120 cm</option></select></label>' +
      '<label>Wall width (m)<input type="number" data-f="wall" value="3" step="0.1"></label>' +
      '<label>Your file width (px)<input type="number" data-f="px" value="4000" step="100"></label>' +
      '</div>' +
      '<svg viewBox="0 0 400 240" width="100%" height="auto" role="img" aria-label="Wall preview">' +
      '<rect width="400" height="240" fill="#f3f0ea"/><rect x="0" y="196" width="400" height="44" fill="#e2dbcf"/>' +
      '<rect x="24" y="150" width="90" height="46" fill="#cfd6da"/><rect x="286" y="140" width="80" height="56" fill="#cfd6da"/>' +
      '<rect id="t20print" x="160" y="60" width="80" height="112" fill="#fff" stroke="#1c1917" stroke-width="2"/></svg>',
    calc(root) {
      bind(root, function () {
        const [wcm, hcm] = val(root, 'size').split('x').map(Number);
        const wall = Math.max(0.5, valN(root, 'wall', 3));
        const px = Math.max(1, valN(root, 'px', 4000));
        const aspect = hcm / wcm;
        const wallPx = (wcm / 100) / wall * 400;
        const hPx = wallPx * aspect;
        const svg = root.querySelector('svg');
        const r = root.querySelector('#t20print');
        r.setAttribute('width', wallPx.toFixed(1));
        r.setAttribute('height', hPx.toFixed(1));
        r.setAttribute('x', (200 - wallPx / 2).toFixed(1));
        r.setAttribute('y', (186 - hPx).toFixed(1));
        const dpi = px / (wcm / 2.54);
        out(root, '<div class="big">' + wcm + ' × ' + hcm + ' cm</div>' +
          '<p>That is <b>' + ((wcm / 100) / wall * 100).toFixed(0) + '%</b> of a ' + wall + ' m wall.</p>' +
          '<p>Your file prints at <b>' + Math.round(dpi) + ' DPI</b> — ' +
          (dpi >= 240 ? 'excellent.' : dpi >= 150 ? 'good at normal viewing distance.' : 'soft — a larger file is better at this size.') + '</p>');
      });
    }
  });
})();
