/* T1–T10 — quote engine, materials, visualiser, sizing */
(function () {
  const { add, money, num, val, valN, out, bind, svgToPng, dl } = LAB;

  /* ---------------- T1 Universal Quote Engine ---------------- */
  add({
    n: 1, id: 't1', name: 'Universal Quote Engine', family: 'F1 · Quote engine',
    what: 'Walks the visitor through <b>service → size → condition → access</b>, then shows an itemised estimate with a low–high range, a print sheet and a prefilled call/email handoff.',
    config: 'Rate table per service (this demo prices painting per m²), condition and access multipliers, call-out minimum, rounding step, GST on/off.',
    limits: 'A range, never a firm price. It cannot send anything — the contact link opens the visitor’s own phone or email app.',
    body:
      '<div class="grid">' +
      '<label>Service<select data-f="svc"><option value="interior">Interior repaint</option>' +
      '<option value="exterior">Exterior repaint</option><option value="roof">Roof coating</option></select></label>' +
      '<label>Area (m²)<input type="number" data-f="area" value="120" min="1" step="5"></label>' +
      '<label>Condition<select data-f="cond"><option value="good">Good — sound surface</option>' +
      '<option value="average" selected>Average</option><option value="poor">Poor — repairs needed</option></select></label>' +
      '<label>Access<select data-f="acc"><option value="one">Single level</option>' +
      '<option value="two">Two storey / scaffold</option></select></label>' +
      '</div>',
    calc(root) {
      const RATE = { interior: 13, exterior: 19, roof: 27 };
      const COND = { good: 1, average: 1.18, poor: 1.45 };
      const ACC = { one: 1, two: 1.28 };
      bind(root, function () {
        const svc = val(root, 'svc'), area = Math.max(1, valN(root, 'area', 100));
        const labour = area * RATE[svc] * COND[val(root, 'cond')] * ACC[val(root, 'acc')];
        const materials = area * (svc === 'roof' ? 4.2 : 2.4);
        const callout = 95;
        const sub = labour + materials + callout;
        const lo = Math.round(sub * 0.88 / 10) * 10, hi = Math.round(sub * 1.14 / 10) * 10;
        const body = encodeURIComponent('Quote request: ' + svc + ', ' + area + ' m², condition ' +
          val(root, 'cond') + ', access ' + val(root, 'acc'));
        out(root,
          '<table class="tbl"><tr><th>Item</th><th class="r">Estimate</th></tr>' +
          '<tr><td>Labour (' + area + ' m² @ ' + money(RATE[svc]) + '/m² × factors)</td><td class="r">' + money(labour) + '</td></tr>' +
          '<tr><td>Materials</td><td class="r">' + money(materials) + '</td></tr>' +
          '<tr><td>Call-out / setup</td><td class="r">' + money(callout) + '</td></tr>' +
          '<tr class="tot"><td>Estimated total</td><td class="r">' + money(lo) + ' – ' + money(hi) + '</td></tr></table>' +
          '<p class="note">Estimate only, GST inclusive. Final price after a site check.</p>' +
          '<p><a class="btn" href="mailto:hello@example.co.nz?subject=Quote%20request&body=' + body + '">Send these details</a> ' +
          '<button class="btn ghost" onclick="window.print()">Print / save PDF</button></p>');
      });
    }
  });

  /* ---------------- T2 Paint litres ---------------- */
  add({
    n: 2, id: 't2', name: 'Paint & Coating Calculator', family: 'F2 · Materials',
    what: 'Turns room or surface dimensions into <b>litres by coat, primer, tin sizes and labour hours</b>.',
    config: 'Coverage m²/L per product, default coats, labour m²/hour, price per litre.',
    limits: 'Coverage varies with substrate and colour change — always labelled an estimate.',
    body:
      '<div class="grid">' +
      '<label>Area to paint (m²)<input type="number" data-f="area" value="90" min="1"></label>' +
      '<label>Coats<select data-f="coats"><option>1</option><option selected>2</option><option>3</option></select></label>' +
      '<label>Coverage (m² per litre)<input type="number" data-f="cov" value="12" step="0.5"></label>' +
      '<label>Price per litre ($)<input type="number" data-f="price" value="19" step="0.5"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const area = Math.max(1, valN(root, 'area')), coats = valN(root, 'coats', 2);
        const cov = Math.max(1, valN(root, 'cov', 12)), price = valN(root, 'price', 19);
        const litres = area * coats / cov;
        const primer = area / (cov * 1.2);
        const tins = [];
        let left = litres;
        while (left > 0.1) { const t = left >= 10 ? 10 : left >= 4 ? 4 : left >= 1 ? 1 : 0.5; tins.push(t); left -= t; }
        out(root, '<div class="big">' + litres.toFixed(1) + ' L</div>' +
          '<p>topcoat across ' + coats + ' coat' + (coats > 1 ? 's' : '') + ' · primer ' + primer.toFixed(1) + ' L</p>' +
          '<p>Tins to buy: ' + tins.join(' L + ') + ' L<br>Paint cost ≈ <b>' + money(litres * price + primer * price * 0.9) + '</b></p>' +
          '<p class="note">Labour guide: ' + Math.round(area / 8) + '–' + Math.round(area / 5) + ' hours for prep and two coats.</p>');
      });
    }
  });

  /* ---------------- T3 Flooring & tiling ---------------- */
  add({
    n: 3, id: 't3', name: 'Flooring & Tiling Quantities', family: 'F2 · Materials',
    what: 'Room size × tile or board size × laying pattern → <b>m², boxes, tile count, adhesive and grout</b>.',
    config: 'Pack coverage, waste % per pattern, adhesive and grout coverage rates.',
    limits: 'Irregular rooms need a site measure; pattern waste is a rule of thumb.',
    body:
      '<div class="grid">' +
      '<label>Room length (m)<input type="number" data-f="l" value="4.2" step="0.1"></label>' +
      '<label>Room width (m)<input type="number" data-f="w" value="3.1" step="0.1"></label>' +
      '<label>Tile / board size<select data-f="size"><option value="0.09">300 × 300</option>' +
      '<option value="0.36" selected>600 × 600</option><option value="0.72">600 × 1200</option>' +
      '<option value="1.44">1200 × 1200</option></select></label>' +
      '<label>Pattern<select data-f="pat"><option value="0.05">Straight lay (5%)</option>' +
      '<option value="0.10" selected>Diagonal (10%)</option><option value="0.15">Herringbone (15%)</option></select></label>' +
      '<label>Pack coverage (m²)<input type="number" data-f="pack" value="1.44" step="0.01"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const net = valN(root, 'l') * valN(root, 'w');
        const waste = valN(root, 'pat', 0.1);
        const size = valN(root, 'size', 0.36);
        const pack = Math.max(0.01, valN(root, 'pack', 1.44));
        const gross = net * (1 + waste);
        const tiles = Math.ceil(gross / size);
        const packs = Math.ceil(gross / pack);
        out(root, '<div class="big">' + gross.toFixed(2) + ' m²</div>' +
          '<p>Net ' + net.toFixed(2) + ' m² + ' + (waste * 100) + '% pattern waste</p>' +
          '<table class="tbl"><tr><th>Buy</th><th class="r">Qty</th></tr>' +
          '<tr><td>Packs / boxes</td><td class="r">' + packs + '</td></tr>' +
          '<tr><td>Tiles (units)</td><td class="r">' + tiles + '</td></tr>' +
          '<tr><td>Adhesive (kg)</td><td class="r">' + Math.ceil(net * 4) + '</td></tr>' +
          '<tr><td>Grout (kg)</td><td class="r">' + Math.ceil(net * 0.6) + '</td></tr></table>');
      });
    }
  });

  /* ---------------- T4 Colour visualiser ---------------- */
  add({
    n: 4, id: 't4', name: 'Colour & Finish Visualiser', family: 'F3 · Visualiser',
    what: 'Click a swatch and an <b>illustration recolours instantly</b> — house, room, nail, hair. Includes an exportable snapshot.',
    config: 'Swatch list (name + hex), base illustration per trade, optional before/after photo pair.',
    limits: 'Photographic recolour is indicative only — never presented as a paint match.',
    body:
      '<div class="swatches" data-f="sw">' +
      ['#8a6a4f', '#c2410c', '#0f766e', '#1e3a5f', '#7c2d12', '#3f6212', '#6b7280', '#111827']
        .map(c => '<button class="sw" data-c="' + c + '" style="background:' + c + '" aria-label="colour ' + c + '"></button>').join('') +
      '</div>' +
      '<svg id="t4svg" viewBox="0 0 400 240" width="100%" height="auto" role="img" aria-label="House illustration">' +
      '<rect width="400" height="240" fill="#eef2f5"/>' +
      '<rect x="0" y="196" width="400" height="44" fill="#dbe4ea"/>' +
      '<polygon id="t4roof" points="200,38 352,120 48,120" fill="#1e3a5f"/>' +
      '<rect id="t4body" x="70" y="120" width="260" height="78" fill="#ffffff" stroke="#c9d3da"/>' +
      '<rect id="t4trim" x="70" y="120" width="260" height="10" fill="#8a6a4f"/>' +
      '<rect x="176" y="150" width="48" height="48" fill="#c2410c"/>' +
      '<rect x="100" y="140" width="40" height="32" fill="#cdd9e2"/>' +
      '<rect x="260" y="140" width="40" height="32" fill="#cdd9e2"/>' +
      '</svg>' +
      '<p><button class="btn ghost" data-f="dl">Download snapshot (PNG)</button></p>',
    calc(root) {
      const svg = root.querySelector('#t4svg');
      const roof = root.querySelector('#t4roof'), body = root.querySelector('#t4body'), trim = root.querySelector('#t4trim');
      root.querySelectorAll('[data-c]').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = btn.getAttribute('data-c');
          // first click paints the roof, second the body, third the trim — reset cycles
          if (!root.dataset.stage || root.dataset.stage === '3') { roof.setAttribute('fill', c); root.dataset.stage = '1'; }
          else if (root.dataset.stage === '1') { body.setAttribute('fill', c); root.dataset.stage = '2'; }
          else { trim.setAttribute('fill', c); root.dataset.stage = '3'; }
          out(root, '<p class="note">Roof: ' + roof.getAttribute('fill') + ' · Walls: ' + body.getAttribute('fill') +
            ' · Trim: ' + trim.getAttribute('fill') + '. Click again to fill the next surface.</p>');
        });
      });
      const dlBtn = root.querySelector('[data-f="dl"]');
      if (dlBtn) dlBtn.addEventListener('click', () => svgToPng(svg, 'colour-preview.png', 1200, 720));
      out(root, '<p class="note">Click a colour to paint roof → walls → trim.</p>');
    }
  });

  /* ---------------- T5 Fence materials ---------------- */
  add({
    n: 5, id: 't5', name: 'Fence Materials Calculator', family: 'F2 · Materials',
    what: 'Fence length, height and style → <b>posts, rails, palings, concrete and fixings</b>.',
    config: 'Post spacing, standard timber sizes, style presets, per-unit prices.',
    limits: 'Ground conditions, corners and retaining add cost — stated on the page.',
    body:
      '<div class="grid">' +
      '<label>Fence length (m)<input type="number" data-f="len" value="24" step="0.5"></label>' +
      '<label>Height<select data-f="h"><option value="1.2">1.2 m</option><option value="1.8" selected>1.8 m</option></select></label>' +
      '<label>Post spacing (m)<input type="number" data-f="sp" value="2.4" step="0.1"></label>' +
      '<label>Paling width (mm)<input type="number" data-f="pw" value="100" step="5"></label>' +
      '<label>Gap (mm)<input type="number" data-f="gap" value="5" step="1"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const len = Math.max(1, valN(root, 'len')), h = valN(root, 'h', 1.8);
        const sp = Math.max(0.5, valN(root, 'sp', 2.4));
        const pw = Math.max(20, valN(root, 'pw', 100)), gap = valN(root, 'gap', 5);
        const posts = Math.ceil(len / sp) + 1;
        const bays = posts - 1;
        const rails = bays * (h <= 1.2 ? 2 : 3);
        const palings = Math.ceil(len * 1000 / (pw + gap));
        const concrete = posts * 2;
        const cost = posts * 24 + rails * 18 + palings * 3.4 + concrete * 9;
        out(root, '<table class="tbl"><tr><th>Material</th><th class="r">Qty</th></tr>' +
          '<tr><td>Posts (125 × 125)</td><td class="r">' + posts + '</td></tr>' +
          '<tr><td>Rails</td><td class="r">' + rails + '</td></tr>' +
          '<tr><td>Palings</td><td class="r">' + palings + '</td></tr>' +
          '<tr><td>Concrete bags (20 kg)</td><td class="r">' + concrete + '</td></tr>' +
          '<tr class="tot"><td>Materials ≈</td><td class="r">' + money(cost) + '</td></tr></table>');
      });
    }
  });

  /* ---------------- T6 Concrete slab ---------------- */
  add({
    n: 6, id: 't6', name: 'Concrete Slab Estimator', family: 'F2 · Materials',
    what: 'Length × width × depth → <b>m³, bag count or truckloads, mesh and a curing timeline with real dates</b>.',
    config: 'Bag yield, minimum depths, cure days, mesh sheet size.',
    limits: 'Sub-base, access and consents are site-specific.',
    body:
      '<div class="grid">' +
      '<label>Length (m)<input type="number" data-f="l" value="6" step="0.1"></label>' +
      '<label>Width (m)<input type="number" data-f="w" value="4" step="0.1"></label>' +
      '<label>Depth (mm)<input type="number" data-f="d" value="100" step="5"></label>' +
      '<label>Mesh?<select data-f="mesh"><option value="1" selected>Yes — reinforcing mesh</option><option value="0">No</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const l = valN(root, 'l'), w = valN(root, 'w'), d = valN(root, 'd', 100) / 1000;
        const vol = l * w * d;
        const bags = Math.ceil(vol / 0.01);
        const trucks = vol / 6;
        const mesh = valN(root, 'mesh', 1) ? Math.ceil(l * w / 2.88) : 0;
        const day = ms => new Date(Date.now() + ms).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
        out(root, '<div class="big">' + vol.toFixed(2) + ' m³</div>' +
          '<table class="tbl"><tr><th>Option</th><th class="r">Qty</th></tr>' +
          '<tr><td>20 kg bags (DIY)</td><td class="r">' + bags + '</td></tr>' +
          '<tr><td>Ready-mix trucks (6 m³)</td><td class="r">' + trucks.toFixed(2) + '</td></tr>' +
          (mesh ? '<tr><td>Mesh sheets (2.4 × 1.2)</td><td class="r">' + mesh + '</td></tr>' : '') +
          '</table>' +
          '<p class="note">Curing: keep damp ' + day(864e5) + '–' + day(7 * 864e5) + ' · vehicles on it from about ' + day(28 * 864e5) + '.</p>');
      });
    }
  });

  /* ---------------- T7 Roof area & pitch ---------------- */
  add({
    n: 7, id: 't7', name: 'Roof Area & Pitch Estimator', family: 'F2 · Materials',
    what: 'Building footprint + roof form + pitch → <b>true roof area, ridge and gutter runs, coating litres</b>.',
    config: 'Pitch factor table, coating coverage, waste %, gutter prices.',
    limits: 'Complex roofs need per-plane input — the demo says so.',
    body:
      '<div class="grid">' +
      '<label>Footprint length (m)<input type="number" data-f="l" value="12" step="0.1"></label>' +
      '<label>Footprint width (m)<input type="number" data-f="w" value="8" step="0.1"></label>' +
      '<label>Roof form<select data-f="form"><option value="gable" selected>Gable</option><option value="hip">Hip</option></select></label>' +
      '<label>Pitch (°)<input type="number" data-f="p" value="25" step="1"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const l = valN(root, 'l') || 1, w = valN(root, 'w') || 1, pitch = valN(root, 'p', 25);
        const factor = 1 / Math.cos(pitch * Math.PI / 180);
        const plan = l * w;
        const area = plan * factor;
        const ridge = valN(root, 'form') === 'gable' ? l : Math.max(0, l - w);
        const gutter = 2 * l;
        const litres = area * 2 / 8;
        out(root, '<div class="big">' + area.toFixed(1) + ' m²</div>' +
          '<table class="tbl">' +
          '<tr><td>Plan area</td><td class="r">' + plan.toFixed(1) + ' m²</td></tr>' +
          '<tr><td>Pitch factor (' + pitch + '°)</td><td class="r">× ' + factor.toFixed(3) + '</td></tr>' +
          '<tr><td>Ridge length</td><td class="r">' + ridge.toFixed(1) + ' m</td></tr>' +
          '<tr><td>Gutter run (both eaves)</td><td class="r">' + gutter.toFixed(1) + ' m</td></tr>' +
          '<tr class="tot"><td>Coating (2 coats @ 8 m²/L)</td><td class="r">' + litres.toFixed(1) + ' L</td></tr></table>');
      });
    }
  });

  /* ---------------- T8 Heat pump sizing ---------------- */
  add({
    n: 8, id: 't8', name: 'Heat Pump Sizing + Running Cost', family: 'F7/F8 · Sizing · Savings',
    what: 'Room volume, insulation, glazing and region → <b>kW band and unit size</b>, then annual running cost against a plug-in heater and payback.',
    config: 'W/m³ by climate zone, insulation and glazing factors, tariffs, unit price bands.',
    limits: 'Indicative sizing; a site check governs the final unit.',
    body:
      '<div class="grid">' +
      '<label>Room length (m)<input type="number" data-f="l" value="5" step="0.1"></label>' +
      '<label>Room width (m)<input type="number" data-f="w" value="4" step="0.1"></label>' +
      '<label>Ceiling height (m)<input type="number" data-f="h" value="2.4" step="0.1"></label>' +
      '<label>Insulation<select data-f="ins"><option value="1.25">Poor</option><option value="1" selected>Average</option><option value="0.85">Good</option></select></label>' +
      '<label>Glazing<select data-f="g"><option value="1.15">Single, large windows</option><option value="1" selected>Mixed</option><option value="0.9">Double glazed</option></select></label>' +
      '<label>Region<select data-f="z"><option value="45">Auckland / north</option><option value="50" selected>Wellington / central</option><option value="60">Christchurch</option><option value="65">Dunedin / south</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const m3 = (valN(root, 'l') || 0) * (valN(root, 'w') || 0) * (valN(root, 'h', 2.4) || 0);
        const wPerM3 = valN(root, 'z', 50) * valN(root, 'ins', 1) * valN(root, 'g', 1);
        const kw = m3 * wPerM3 / 1000;
        const sizes = [2.5, 3.5, 5.0, 6.0, 7.1, 8.0, 9.4];
        const unit = sizes.find(s => s >= kw * 1.1) || sizes[sizes.length - 1];
        const hours = 1200, tariff = 0.29;
        const hp = unit * hours * 0.45 * tariff;
        const plug = 2.0 * hours * 0.75 * tariff;
        out(root, '<div class="big">' + kw.toFixed(1) + ' kW</div>' +
          '<p>Room volume ' + m3.toFixed(0) + ' m³ · recommended unit <b>' + unit.toFixed(1) + ' kW</b></p>' +
          '<table class="tbl"><tr><th>Heating</th><th class="r">Per year</th></tr>' +
          '<tr><td>Heat pump at ' + unit.toFixed(1) + ' kW</td><td class="r">' + money(hp) + '</td></tr>' +
          '<tr><td>2 kW plug-in heater</td><td class="r">' + money(plug) + '</td></tr>' +
          '<tr class="tot"><td>Saving</td><td class="r">' + money(plug - hp) + '</td></tr></table>' +
          '<p class="note">Assumes ' + hours + ' heating hours at $' + tariff + '/kWh.</p>');
      });
    }
  });

  /* ---------------- T9 Solar sizing ---------------- */
  add({
    n: 9, id: 't9', name: 'Solar Sizing + Payback', family: 'F7/F8 · Sizing · Savings',
    what: 'Power bill and roof direction → <b>suggested kW, modelled generation, savings and payback years</b>.',
    config: 'Yield factors by orientation, tariffs, installed $/kW band, export rate.',
    limits: 'A model, not a promise — shading and wiring need a site check.',
    body:
      '<div class="grid">' +
      '<label>Monthly power bill ($)<input type="number" data-f="bill" value="260" step="10"></label>' +
      '<label>Power price ($/kWh)<input type="number" data-f="tariff" value="0.29" step="0.01"></label>' +
      '<label>Main roof direction<select data-f="dir"><option value="1450">North</option>' +
      '<option value="1300" selected>East / West</option><option value="1150">Split / shaded</option></select></label>' +
      '<label>Installed cost ($/kW)<input type="number" data-f="cost" value="2400" step="100"></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const bill = valN(root, 'bill', 200), tariff = Math.max(0.05, valN(root, 'tariff', 0.29));
        const yieldF = valN(root, 'dir', 1300), costKw = valN(root, 'cost', 2400);
        const annualKwh = bill * 12 / tariff;
        const kw = Math.min(10, Math.max(2, Math.round(annualKwh / yieldF * 10) / 10));
        const gen = kw * yieldF;
        const selfUse = Math.min(annualKwh, gen * 0.45);
        const saving = selfUse * tariff;
        const cost = kw * costKw;
        out(root, '<div class="big">' + kw.toFixed(1) + ' kW</div>' +
          '<table class="tbl">' +
          '<tr><td>Modelled generation</td><td class="r">' + Math.round(gen).toLocaleString('en-NZ') + ' kWh/yr</td></tr>' +
          '<tr><td>Bill covered by self-use</td><td class="r">' + money(saving) + '/yr</td></tr>' +
          '<tr><td>System cost</td><td class="r">' + money(cost) + '</td></tr>' +
          '<tr class="tot"><td>Payback</td><td class="r">' + (cost / Math.max(1, saving)).toFixed(1) + ' years</td></tr></table>' +
          '<p class="note">Assumes 45% self-consumption. Export tariffs and finance would change this.</p>');
      });
    }
  });

  /* ---------------- T10 Insulation ---------------- */
  add({
    n: 10, id: 't10', name: 'Insulation R-Value + Quantity + Savings', family: 'F2/F8 · Materials · Savings',
    what: 'Area, element and region → <b>recommended R-value, bales or segments, cost band and annual heating saving</b>.',
    config: 'R table per zone and element, bale coverage, tariffs.',
    limits: 'Cavity depth and building age constrain the real answer.',
    body:
      '<div class="grid">' +
      '<label>Area (m²)<input type="number" data-f="area" value="110" step="1"></label>' +
      '<label>Where<select data-f="el"><option value="ceiling" selected>Ceiling</option>' +
      '<option value="wall">Walls</option><option value="floor">Underfloor</option></select></label>' +
      '<label>Region zone<select data-f="z"><option value="1">Zone 1–2 (Auckland / north)</option>' +
      '<option value="3" selected>Zone 3–4 (central)</option><option value="5">Zone 5–6 (south)</option></select></label>' +
      '</div>',
    calc(root) {
      bind(root, function () {
        const area = Math.max(1, valN(root, 'area', 100));
        const el = val(root, 'el'), zone = valN(root, 'z', 3);
        const R = { ceiling: { 1: 3.6, 3: 3.6, 5: 3.6 }, wall: { 1: 2.0, 3: 2.6, 5: 2.6 }, floor: { 1: 1.3, 3: 1.8, 5: 1.8 } };
        const rVal = R[el][zone];
        const coverage = el === 'ceiling' ? 7.5 : el === 'wall' ? 6.0 : 8.5;
        const bales = Math.ceil(area / coverage);
        const installed = area * (el === 'ceiling' ? 26 : el === 'wall' ? 38 : 32);
        const savedKwh = area * (el === 'ceiling' ? 14 : el === 'wall' ? 8 : 10) * (zone === 5 ? 1.25 : zone === 3 ? 1 : 0.85);
        out(root, '<div class="big">R ' + rVal.toFixed(1) + '</div>' +
          '<table class="tbl">' +
          '<tr><td>Bales / segments</td><td class="r">' + bales + '</td></tr>' +
          '<tr><td>Installed cost band</td><td class="r">' + money(installed * 0.9) + ' – ' + money(installed * 1.15) + '</td></tr>' +
          '<tr class="tot"><td>Heating saving</td><td class="r">' + money(savedKwh * 0.29) + '/yr</td></tr></table>' +
          '<p class="note">Saving is a heating-energy estimate at $0.29/kWh, not a quote.</p>');
      });
    }
  });
})();
