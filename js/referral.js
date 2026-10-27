// The referral form (referral.html): nine steps, one at a time, then Send to the worker.
// Questions and wording live in js/referral-data.js; this file draws them, checks them, uploads files and sends.
// The owner's decisions behind it are coded W1 to W30 in CLAUDE.md, "The referral form and the attorney portal".
// Nothing the attorney types is kept by the website: the answers go only to the worker when Send is pressed. While the
// form is open they are held in this browser tab (sessionStorage), so a reload does not lose them; Send clears them.
(function () {
  'use strict';

  var D = window.RIAC_REF;
  var CFG = D.CONFIG;
  var app = document.getElementById('referral-app');
  if (!app || !D) return;

  // Security review CS5, finding 6: this page never works inside another site's frame, where a hidden copy could be
  // used to trick an attorney's clicks. Framed, it draws only a link to open it properly, and loads nothing else.
  if (window.top !== window.self) {
    var out = document.createElement('a');
    out.href = location.href;
    out.target = '_top';
    out.textContent = 'Open this page on nyriac.com';
    var para = document.createElement('p');
    para.appendChild(out);
    app.textContent = '';
    app.appendChild(para);
    return;
  }

  var STEP_IDS = ['county', 'about', 'court', 'client', 'immigration', 'casetype', 'people', 'documents', 'check'];
  var LISTS = null;               // GET /v1/lists
  var FILES = {};                 // File objects by local id; kept in memory only
  var XHRS = {};                  // uploads in progress by local id
  var turnstileId = null;
  var S = load() || fresh();

  // ---------- State --------------------------------------------------------------------------------------------

  function fresh() {
    return { v: 1, step: 0, visited: 0, A: {}, sendAs: 'questions',
      route: { county: null, outside: false, conflict: false, centre: null, note: '' },
      people: [], charges: [], adding: {}, docs: {}, batch: null, send: null, iceAuto: false };
  }
  function load() {
    try {
      var s = JSON.parse(sessionStorage.getItem(CFG.draftKey) || 'null');
      if (!s || s.v !== 1) return null;
      // Some browsers bring a closed tab's storage back (reopening it, or restarting where they left off), so on a shared
      // computer a half-filled referral could reach the next person: a draft untouched for 12 hours is dropped (W-S06)
      if (s.at && Date.now() - s.at > 12 * 3600000) { clearDraft(); return null; }
      s.charges = s.charges || [];
      Object.keys(s.docs || {}).forEach(function (k) {   // files cannot survive a reload unless they had finished
        s.docs[k].files = (s.docs[k].files || []).filter(function (f) { return f.state === 'done'; });
      });
      return s;
    } catch (e) { return null; }
  }
  var saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      S.at = Date.now();
      try { sessionStorage.setItem(CFG.draftKey, JSON.stringify(S)); } catch (e) { /* storage full or blocked: carry on */ }
    }, 250);
  }
  function clearDraft() { try { sessionStorage.removeItem(CFG.draftKey); } catch (e) { /* ignore */ } }

  // ---------- Small DOM helpers (user text always goes in as text, never as HTML) ------------------------------

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;            // static wording from referral-data.js only
      else if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function fid(key, alias) { return 'f-' + key.replace(/[^a-zA-Z0-9]/g, '-') + (alias ? '-b' : ''); }
  function plain(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  function fmtDate(iso) { if (!iso) return ''; var p = iso.split('-'); return p.length === 3 ? p[1] + '/' + p[2] + '/' + p[0] : iso; }
  function fmtBytes(n) { if (n >= 1048576) { var m = n / 1048576; return (Math.abs(m - Math.round(m)) < 0.05 ? String(Math.round(m)) : m.toFixed(1)) + ' MB'; } return Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var x = Array.prototype.map.call(b, function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
    return x.slice(0, 8) + '-' + x.slice(8, 12) + '-' + x.slice(12, 16) + '-' + x.slice(16, 20) + '-' + x.slice(20);
  }
  function centreOf(code) { return D.CENTRES[code] || { name: code, short: code, colour: 'var(--navy)', blocks: [] }; }
  function listCentre(code) { return (LISTS && LISTS.centres || []).filter(function (c) { return c.code === code; })[0] || null; }
  function modeOf(code) { var c = listCentre(code); return c ? c.mode : 'none'; }

  // ---------- The route: which center receives the referral (W1, W7, W8, W10) -----------------------------------

  function countyCentre() {
    if (!S.route.county || !LISTS) return null;
    var c = LISTS.counties.filter(function (x) { return x.name === S.route.county; })[0];
    return c ? c.centre : null;
  }
  function receivingCentre() {
    if (S.route.outside || S.route.conflict) return S.route.centre;
    return countyCentre();
  }
  function routeReady() { var c = receivingCentre(); return !!c && modeOf(c) !== 'none'; }

  // ---------- Which steps apply ---------------------------------------------------------------------------------

  function caseType() { return S.A['case.caseType'] || null; }
  function caseTypeInfo() { return D.CASE_TYPES.filter(function (t) { return t.code === caseType(); })[0] || null; }
  function skipped(id) {
    if (S.sendAs === 'completed-form' && (id === 'immigration' || id === 'casetype' || id === 'people')) return true;
    return false;
  }
  function stopped() {   // the form cannot go on past this step: the center is not online, or private counsel (W7, W12)
    if (!routeReady()) return 0;
    if (S.A['attorney.officeType'] === 'private') return 1;
    return -1;
  }
  function stepName(i) {
    if (STEP_IDS[i] === 'casetype') { var t = caseTypeInfo(); return t ? t.step : 'Case Type'; }
    return ['County', 'About You', 'Court & Case', 'Client', 'Immigration', '', 'Other People', 'Documents', 'Review And Send'][i];
  }
  function nextIndex(i, dir) {
    var j = i + dir;
    while (j >= 0 && j < STEP_IDS.length && skipped(STEP_IDS[j])) j += dir;
    return j;
  }

  // ---------- Visibility of a question ---------------------------------------------------------------------------

  function visible(q) {
    if (q.way && q.way !== S.sendAs) return false;
    if (q.show && !q.show(S.A, { county: S.route.outside ? null : S.route.county })) return false;
    return true;
  }
  function stepQuestions(id) {
    if (id === 'casetype') return D.SECTIONS[caseType()] || [];
    return D.STEPS[id] || [];
  }
  function flat(list) {
    var out = [];
    list.forEach(function (q) { if (q.type === 'group') q.items.forEach(function (x) { out.push(x); }); else out.push(q); });
    return out;
  }

  // ---------- Drawing a question ---------------------------------------------------------------------------------

  function limitOf(q) { return q.max || { name: 100, short: 200, email: 254, tel: 40, long: 6000, note: 1000, search: 200 }[q.type] || 200; }

  function guidanceNode(g) {
    if (!g) return null;
    if (typeof g === 'string') return h('span', { text: g });
    var kids = [];
    if (g.eg) kids.push(h('span', { class: 'eg', text: g.eg }));
    if (g.text) kids.push(h('span', { text: g.text }));
    if (g.html) kids.push(h('span', { html: g.html }));
    return h('span', null, kids);
  }

  function descNode(q) {
    if (q.descList) {
      var box = h('div', { class: 'desc-list', id: fid(q.key) + '-d' });
      var n = 1;
      q.descList.forEach(function (part) {
        box.appendChild(h('p', { text: part[0] }));
        var ol = h('ol', { start: String(n) });
        part[1].forEach(function (t) { ol.appendChild(h('li', { text: t })); n++; });
        box.appendChild(ol);
      });
      return box;
    }
    return q.desc ? h('span', { class: 'desc', id: fid(q.key) + '-d', text: q.desc }) : null;
  }

  function nearLimit(len, max) {
    return len >= Math.round(max * (max >= 6000 ? 5 / 6 : 0.9))
      ? len.toLocaleString('en-US') + ' of ' + max.toLocaleString('en-US') + ' characters. A longer account can be attached as a file at step 8.'
      : '';
  }

  // W103 3: each question is a row of the step's ruled sheet: the question, with its guidance under it, in a grey column
  // on the left, and its answer on the right, centred against the question where the question is the taller (the
  // owner's change); on a phone the question sits over its answer. Guidance is never inside a box (W103 reverses W16 and
  // W17 1), and there is one answer to a row (W14 2). A box for words opens two lines tall, a long answer's three.
  var LENS = '<svg viewBox="0 0 16 16"><circle cx="6.8" cy="6.8" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M10.6 10.6 L14.5 14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICE = '<svg viewBox="0 0 48 42"><path d="M24 4 L45 39 H3 Z" fill="#c22b30" stroke="#c22b30" stroke-width="5" stroke-linejoin="round"/><text x="24" y="35" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#fff">ICE</text></svg>';
  function lens() { return h('span', { class: 'lens', 'aria-hidden': 'true', html: LENS }); }
  function iceSym(small) { return h('span', { class: 'ice-sym' + (small ? ' sm' : ''), 'aria-hidden': 'true', html: ICE }); }

  function hintOf(q) { return q.list === 'courts' ? 'The courts of ' + S.route.county + ' County: type part of the name.' : q.guidance || q.help || null; }
  function describedBy(q, id) {
    var ids = [];
    if (q.desc || q.descList) ids.push(fid(q.key) + '-d');
    if (hintOf(q)) ids.push(id + '-g');
    return ids.join(' ') || null;
  }
  // The question cell: the question, then its description and guidance. A label for a box; for choices, the words the
  // group is named by.
  function qHead(q, id, forId) {
    var lab = forId ? h('label', { class: 'lab', for: forId, id: id + '-l' }) : h('span', { class: 'lab', id: id + '-l' });
    if (q.labelHtml) lab.innerHTML = q.label; else lab.textContent = q.label;
    if (q.required) { lab.appendChild(document.createTextNode('\u00a0')); lab.appendChild(h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })); }   // the star never alone on a line
    var kids = [lab, descNode(q)];
    var g = guidanceNode(hintOf(q));
    if (g) { g.className = 'g'; g.id = id + '-g'; kids.push(g); }
    return kids;
  }
  function qrow(id, head, answer, cls) {
    return h('div', { class: 'qrow' + (cls ? ' ' + cls : ''), id: id ? id + '-w' : null }, [h('div', { class: 'q' }, head), h('div', { class: 'a' }, answer)]);
  }

  function control(q, id) {
    var v = S.A[q.key], by = describedBy(q, id), max = limitOf(q);
    if (q.type === 'date') return [h('input', { type: 'date', id: id, value: v || '', 'data-key': q.key, 'aria-describedby': by })];
    if (q.type === 'search') {
      var opts = q.list === 'offices' ? (LISTS ? LISTS.offices : []) : (LISTS && LISTS.courts[S.route.county]) || [];
      return [h('div', { class: 'srch' }, [lens(), h('input', { type: 'search', id: id, list: id + '-list', value: v || '', autocomplete: 'off', 'data-key': q.key, maxlength: '200', 'aria-describedby': by })]),
        h('datalist', { id: id + '-list' }, opts.map(function (o) { return h('option', { value: o }); }))];
    }
    if (q.type === 'long' || q.type === 'note' || q.area) {
      var ta = h('textarea', { id: id, class: q.type === 'long' ? 'l3' : 'l2', maxlength: String(max), 'data-key': q.key, rows: q.type === 'long' ? '3' : '2', 'aria-describedby': by });
      ta.value = v || '';
      if (q.area) { ta.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); }); return [ta]; }   // one line of words, wrapped
      return [ta, h('p', { class: 'near-limit', id: id + '-n', 'aria-live': 'polite', text: nearLimit((v || '').length, max) })];
    }
    return [h('input', { type: q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'text', id: id, value: v || '', maxlength: String(max), 'data-key': q.key,
      autocomplete: q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'off', 'aria-describedby': by })];
  }

  // Yes / No / Unknown and other short choices: pills of one size; longer lists: tiles with a round box, in groups if
  // the question has them (the custody status, W103 3).
  function radioAnswer(q, id) {
    var A = S.A;
    function opt(c, i, pill) {
      var rid = id + '-' + i;
      var inp = h('input', { type: 'radio', id: rid, name: id, value: c.code, 'data-key': q.key, checked: A[q.key] === c.code });
      if (pill) return h('label', { class: 'pill', for: rid }, [inp, c.label]);
      return h('label', { class: 'tile', for: rid }, [inp, h('span', { class: 'box round', 'aria-hidden': 'true' }), c.ice ? iceSym(true) : null, h('span', { text: c.label })]);
    }
    var grp;
    if (q.inline) {
      grp = h('div', { class: 'seg' + (q.choices.some(function (c) { return c.label.length > 14; }) ? ' long' : '') }, q.choices.map(function (c, i) { return opt(c, i, true); }));
      grp.style.setProperty('--n', q.choices.length);
    } else if (q.groups) {
      grp = h('div', { class: 'cust' }, q.groups.map(function (g, gi) {
        return h('div', { class: 'cg' + (gi ? ' held' : '') }, [h('span', { class: 'cg-h', text: g[0] }),
          h('div', { class: 'tiles across' }, q.choices.map(function (c, i) { return g[1].indexOf(c.code) !== -1 ? opt(c, i) : null; }))]);
      }));
    } else grp = h('div', { class: 'tiles across' + (q.cols === 2 ? '' : ' one') }, q.choices.map(function (c, i) { return opt(c, i); }));
    grp.setAttribute('role', 'radiogroup');
    grp.setAttribute('aria-labelledby', id + '-l');
    var by = describedBy(q, id); if (by) grp.setAttribute('aria-describedby', by);
    var out = [grp];
    if (q.unknownNote && A[q.key] === 'unknown') out.push(subField({ key: q.key + 'UnknownWhy', label: q.unknownNote, type: 'note' }));
    return out;
  }

  function checkAnswer(q, id) {
    var cb = h('input', { type: 'checkbox', id: id, 'data-key': q.key, checked: S.A[q.key] === true, 'aria-describedby': describedBy(q, id) });
    if (!q.ice) return [h('label', { class: 'tick-under', for: id }, [cb, h('span', { text: q.label })])];
    var out = [h('label', { class: 'tile ice-tile', for: id }, [cb, h('span', { class: 'box', 'aria-hidden': 'true' }), iceSym(), h('span', { html: q.tile })])];
    if (S.A[q.key] === true && S.iceAuto) out.push(h('span', { class: 'auto', text: 'Ticked for you: your client is detained in immigration custody.' }));
    return out;
  }

  // Tick lists: tiles read down the first column, then the second (W15 2); the family's in rows coloured by who the
  // family member is (W103 3).
  function ticksAnswer(q, id) {
    var val = S.A[q.key] || [];
    function tile(code, text, who) {
      var tid = id + '-' + code;
      return h('label', { class: 'tile', for: tid }, [h('input', { type: 'checkbox', id: tid, value: code, 'data-key': q.key, 'data-ticks': '1', checked: val.indexOf(code) !== -1 }),
        h('span', { class: 'box', 'aria-hidden': 'true' }), h('span', null, [who ? h('span', { class: 'visually-hidden', text: who + ': ' }) : null, text])]);
    }
    var kids = [];
    if (q.grid) {
      kids.push(h('div', { class: 'fam' }, q.grid.rows.map(function (r) {
        return h('div', { class: 'fr ' + r[1] }, [h('span', { class: 'fr-h', 'aria-hidden': 'true', text: r[0] })].concat(r[2].map(function (code, i) { return tile(code, q.grid.cols[i], r[0]); })));
      })));
    } else {
      var grid = h('div', { class: 'tiles' }, q.choices.map(function (c) { return tile(c.code, c.label); }));
      grid.style.gridTemplateRows = 'repeat(' + Math.ceil(q.choices.length / 2) + ', auto)';
      kids.push(grid);
    }
    if (!q.noApart) kids.push(h('div', { class: 'tiles-apart' }, [tile('none', 'None of these apply'), tile('unknown', 'Unknown')]));
    var out = [h('div', { class: 'ticks', role: 'group', 'aria-labelledby': id + '-l', 'aria-describedby': describedBy(q, id) }, kids)];
    if (!q.noApart && val.indexOf('unknown') !== -1) out.push(subField({ key: q.key + 'UnknownWhy', label: q.unknownNote, type: 'note' }));
    return out;
  }

  function field(q) {
    if (q.type === 'para') return h('div', { class: 'qrow para' }, [h('p', { class: 'desc', text: q.desc })]);   // no key: before fid()
    var id = fid(q.key, q.alias);
    var t = q.type;
    var ans = t === 'radio' ? radioAnswer(q, id) : t === 'ticks' ? ticksAnswer(q, id) : t === 'check' ? checkAnswer(q, id) : t === 'charges' ? chargesAnswer(q, id) : control(q, id);
    return qrow(id, qHead(q, id, ['radio', 'ticks', 'check'].indexOf(t) === -1 ? id : null), ans);
  }
  // A question inside another's answer (a note under Unknown, the court's "not listed"): its own label over its box.
  function subField(q) {
    var id = fid(q.key, q.alias);
    return h('div', { class: 'sub-field', id: id + '-w' }, q.type === 'check' ? checkAnswer(q, id) : qHead(q, id, id).concat(control(q, id)));
  }
  // Several questions in one row: the court (or the office) from the list, "not listed", and its details.
  function groupRow(g) {
    var items = g.items.filter(visible);
    if (!items.length) return null;
    var main = items[0] === g.items[0] ? items[0] : null;
    var id = main ? fid(main.key) : fid(g.items[0].key) + '-grp';
    var ans = main ? control(main, id) : [];
    items.forEach(function (x) { if (x !== main) ans.push(subField(x)); });
    return qrow(id, main ? qHead(main, id, id) : [h('span', { class: 'lab', id: id + '-l', text: g.label })], ans);
  }

  // ---------- Charges (W101 1a) -------------------------------------------------------------------------------------
  // A search over RIAC's list of New York offenses (js/offenses.js, public law only): each charge chosen becomes a line
  // with its class and, on a Penal Law line, an "Attempted" tick; a charge not in the list can be added as typed.
  // Optional. Sent as criminal.charges, the law, statute and tier exactly as the list has them.

  var CH = D.CHARGES;
  var OFFENSES = null;          // the list, read once: { law, statute, tier, name, cls, att, unknown, sk, words }
  var chargeQuery = '';         // what is typed in the search box (not kept after a reload)
  var chargeActive = 0;
  var chargeShown = [];
  var UNKNOWN_SUB = / - SUBSECTION UNKNOWN$/;
  var ORDINALS = { first: '1st', second: '2nd', third: '3rd', fourth: '4th', fifth: '5th', sixth: '6th', seventh: '7th' };

  function offenses() {
    if (OFFENSES) return OFFENSES;
    OFFENSES = [];
    var src = window.RIAC_OFFENSES;
    if (src) Object.keys(src.laws).forEach(function (law) {
      src.laws[law].forEach(function (r) {
        OFFENSES.push({ law: law, statute: r[0], tier: r[1], name: r[2], cls: r[3], att: r[4], unknown: UNKNOWN_SUB.test(r[0]),
          sk: r[0].replace(UNKNOWN_SUB, '').toLowerCase().replace(/[^0-9a-z]/g, ''),
          words: (r[2] + ' ' + (CH.law[law] || '') + ' ' + law).toLowerCase().split(/[^0-9a-z]+/).filter(Boolean) });
      });
    });
    return OFFENSES;
  }
  // By statute number ("120.00(1)", "PL 120", "1192(3)") or by name ("assault 3", "robbery second degree", "dwi").
  function chargeMatches(text) {
    var q = text.toLowerCase().replace(/§/g, ' ').trim(), law = null;
    var m = q.match(/^(p\.?\s?l\.?|penal\s+law|v\.?\s?t\.?\s?l\.?|vehicle\s+(and|&)\s+traffic\s+law)(\s+|$|(?=\d))/);
    if (m) { law = /^p/.test(m[1]) ? 'Penal Law' : 'VTL'; q = q.slice(m[0].length).trim(); }
    if (!q) return [];
    var list = offenses().filter(function (o) { return !law || o.law === law; });
    var out = [];
    if (/^\d/.test(q)) {
      var qk = q.replace(/[^0-9a-z]/g, '');
      out = list.filter(function (o) { return o.sk.indexOf(qk) === 0; });
    }
    if (!out.length) {
      var words = q.split(/[^0-9a-z]+/).filter(function (w) { return w && ['in', 'the', 'of', 'degree'].indexOf(w) === -1; })
        .map(function (w) { return ORDINALS[w] || w; });
      if (!words.length) return [];
      out = list.filter(function (o) { return words.every(function (w) { return o.words.some(function (x) { return x.indexOf(w) === 0; }); }); });
      out.sort(function (a, b) { return (b.words[0].indexOf(words[0]) === 0) - (a.words[0].indexOf(words[0]) === 0); });   // names starting with it first
    }
    return out;
  }
  function chargeStatute(c) { return (CH.law[c.law] || c.law) + ' ' + c.statute.replace(UNKNOWN_SUB, ''); }
  function chargeName(c) { return c.name.replace(/ — /g, ', ') + (UNKNOWN_SUB.test(c.statute) ? ', ' + CH.unknownSub : ''); }
  function canAttempt(c) { return c.law === 'Penal Law' && !!CH.classes[c.att]; }
  function chargeClass(c, attempted) { return attempted ? (CH.classes[c.att] ? CH.classes[c.att] + CH.asAttempt : '') : CH.classes[c.cls] || ''; }
  function chargeLabel(c) {   // the line in words: the copy, and the label sent with it
    if (c.typed) return c.typed + ' (' + CH.typedNote.charAt(0).toLowerCase() + CH.typedNote.slice(1) + ')';
    var at = c.attempted && canAttempt(c), cl = chargeClass(c, at);
    return (at ? CH.attempted + ' ' : '') + chargeStatute(c) + ' ' + chargeName(c) + (cl ? ' (' + cl + ')' : '');
  }
  function chargeOut(c) {
    if (c.typed) return { typed: c.typed };
    return { law: c.law, statute: c.statute, tier: c.tier, attempted: !!c.attempted && canAttempt(c), label: chargeLabel(c).slice(0, 200) };
  }

  function chargeLine(c, i) {
    var wid = 'chg-' + i;
    var what = h('span', { class: 'what', id: wid });
    if (c.typed) {
      what.appendChild(h('span', { class: 'st', text: '“' + c.typed + '”' }));
      what.appendChild(h('span', { class: 'note', text: CH.typedNote }));
    } else {
      what.appendChild(h('span', { class: 'st', text: (c.attempted && canAttempt(c) ? CH.attempted + ' ' : '') + chargeStatute(c) }));
      what.appendChild(document.createTextNode(' ' + chargeName(c)));
      var cl = chargeClass(c, c.attempted && canAttempt(c));
      if (cl) what.appendChild(h('span', { class: 'cls', text: cl }));
    }
    var li = h('li', { class: c.typed || !canAttempt(c) ? 'no-att' : null }, [what]);
    if (!c.typed && canAttempt(c)) {
      li.appendChild(h('label', { class: 'att', for: wid + '-a' }, [h('input', { type: 'checkbox', id: wid + '-a', checked: !!c.attempted, 'aria-describedby': wid,
        on: { change: function (e) { c.attempted = e.target.checked; save(); render(wid + '-a'); } } }), CH.attempted]));
    }
    li.appendChild(h('button', { type: 'button', class: 'link-btn rm', 'aria-describedby': wid,
      on: { click: function () { S.charges.splice(i, 1); save(); render(fid('criminal.charges')); } } }, ['Remove']));
    return li;
  }

  function chargesAnswer(q, id) {
    var out = [];
    if (S.charges.length) out.push(h('ul', { class: 'cp-lines', 'aria-label': q.label }, S.charges.map(chargeLine)));
    if (S.charges.length >= CH.max) { out.push(h('p', { class: 'desc', text: CH.full })); return out; }
    if (S.charges.length) out.push(h('span', { class: 'cp-more', id: id + '-a', text: CH.another }));
    var input = h('input', { type: 'search', id: id, autocomplete: 'off', maxlength: '200', value: chargeQuery,
      role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': id + '-m', 'aria-describedby': [describedBy(q, id), S.charges.length ? id + '-a' : ''].join(' ').trim() });
    var list = h('ul', { class: 'cp-matches', id: id + '-m', role: 'listbox', 'aria-label': 'Offenses that match', hidden: true });
    var status = h('span', { class: 'visually-hidden', role: 'status' });
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
    function draw() {
      list.textContent = '';
      var text = input.value.trim();
      if (!text) { close(); status.textContent = ''; return; }
      var all = chargeMatches(text);
      chargeShown = all.slice(0, 8).concat([{ typed: text.slice(0, 200) }]);
      if (chargeActive >= chargeShown.length || chargeActive < 0) chargeActive = 0;
      chargeShown.forEach(function (o, i) {
        var li;
        if (o.typed) {
          if (all.length > 8 || !all.length) list.appendChild(h('li', { class: 'more', role: 'presentation', text: all.length ? CH.more : CH.none }));
          li = h('li', { class: 'typed-row' }, [h('span', { class: 'what' }, [CH.addTyped[0], h('span', { class: 'q', text: '“' + o.typed + '”' }), CH.addTyped[1]])]);
        } else {
          var w = h('span', { class: 'what' }, [h('span', { class: 'st', text: chargeStatute(o) }), ' ' + o.name.replace(/ — /g, ', ')]);
          if (o.unknown) { w.appendChild(document.createTextNode(', ')); w.appendChild(h('span', { class: 'sub', text: CH.unknownSub })); }
          li = h('li', null, [w, chargeClass(o, false) ? h('span', { class: 'cls', text: chargeClass(o, false) }) : null]);
        }
        li.id = id + '-o' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', i === chargeActive ? 'true' : 'false');
        if (i === chargeActive) li.classList.add('on');
        li.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keeps the box focused
        li.addEventListener('click', function () { pickCharge(o); });
        list.appendChild(li);
      });
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      input.setAttribute('aria-activedescendant', id + '-o' + chargeActive);
      var on = document.getElementById(id + '-o' + chargeActive); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
      status.textContent = (all.length ? (all.length === 1 ? 'One offense matches.' : all.length + ' offenses match.') : CH.none) + ' Use the arrow keys, then Enter.';
    }
    input.addEventListener('input', function () { chargeQuery = input.value; chargeActive = 0; draw(); });
    input.addEventListener('focus', function () { if (input.value.trim()) draw(); });
    input.addEventListener('blur', close);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (list.hidden) { draw(); return; }
        chargeActive = (chargeActive + (e.key === 'ArrowDown' ? 1 : -1) + chargeShown.length) % chargeShown.length;
        draw();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!list.hidden && chargeShown[chargeActive]) pickCharge(chargeShown[chargeActive]);
      } else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); close(); }
    });
    out.push(h('div', { class: 'cp-search' }, [h('div', { class: 'srch' }, [lens(), input]), list, status]));
    return out;
  }
  function pickCharge(o) {
    var c = o.typed ? { typed: o.typed } : { law: o.law, statute: o.statute, tier: o.tier, name: o.name, cls: o.cls, att: o.att, attempted: false };
    var twice = S.charges.some(function (x) { return o.typed ? x.typed === o.typed : x.law === c.law && x.statute === c.statute && x.tier === c.tier; });
    if (!twice && S.charges.length < CH.max) S.charges.push(c);
    chargeQuery = ''; chargeActive = 0; chargeShown = [];
    save();
    render(fid('criminal.charges'));
  }

  // The step's questions as one ruled sheet: a section for each SEC, a navy band with its name (none for a section with
  // no name); a section with nothing to show is left out. Returns the sheet, so a step can add rows of its own.
  function section(title) { return h('section', { class: 'sec' }, title ? [h('h3', { class: 'sec-h', text: title })] : []); }
  function drawList(list, parent) {
    var sheet = h('div', { class: 'sheet' }), sec = null;
    list.forEach(function (q) {
      if (q.type === 'section') { sec = sheet.appendChild(section(typeof q.title === 'function' ? q.title(S.A) : q.title)); return; }
      var row = q.type === 'group' ? groupRow(q) : visible(q) ? field(q) : null;
      if (!row) return;
      if (!sec) sec = sheet.appendChild(section(null));
      sec.appendChild(row);
    });
    Array.prototype.slice.call(sheet.children).forEach(function (x) { if (!x.querySelector('.qrow')) sheet.removeChild(x); });
    if (parent && sheet.firstChild) parent.appendChild(sheet);
    return sheet;
  }

  // ---------- The frame: step bar, heading, buttons --------------------------------------------------------------

  function stepBar() {
    var stop = stopped();
    var wrap = h('div', { class: 'steps-wrap' });
    var ol = h('ol', { class: 'steps' });
    var countable = 0, done = 0;
    STEP_IDS.forEach(function (sid, i) {
      var cls = i === S.step ? 'current' : skipped(sid) ? 'skip' : stop !== -1 && i > stop ? 'off' : i < S.step || i <= S.visited ? 'done' : '';
      if (!skipped(sid) && i < STEP_IDS.length - 1) { countable++; if (i < S.step) done++; }
      var inner = [h('span', { class: 'n', text: cls === 'done' ? '✓' : String(i + 1) }), h('span', { class: 'lbl', text: stepName(i) })];
      var li = h('li', { class: cls });
      if (cls === 'done' && (stop === -1 || i <= stop)) {
        li.appendChild(h('button', { type: 'button', 'aria-label': 'Step ' + (i + 1) + ', ' + stepName(i) + ': go back to it', on: { click: function () { go(i); } } }, inner));
      } else {
        li.setAttribute('aria-current', i === S.step ? 'step' : null);
        inner.forEach(function (n) { li.appendChild(n); });
      }
      ol.appendChild(li);
    });
    wrap.appendChild(ol);
    wrap.appendChild(h('p', { class: 'now', text: 'Step ' + (S.step + 1) + ' of 9 · ' + stepName(S.step) }));
    var bar = h('span'); bar.style.width = (countable ? Math.round(done / countable * 100) : 0) + '%';
    wrap.appendChild(h('div', { class: 'progress', 'aria-hidden': 'true' }, [bar]));
    var note = h('p', { class: 'progress-note' }, [h('span', { text: done + ' of ' + countable + ' sections done' })]);
    if (begun() && !sending) {
      note.appendChild(h('span', { class: 'sep', 'aria-hidden': 'true' }));
      note.appendChild(h('button', { type: 'button', class: 'so-link', id: 'start-over', 'aria-expanded': asking ? 'true' : 'false',
        on: { click: function () { asking = true; render('so-keep'); } } }, ['Start over']));
    }
    wrap.appendChild(note);
    if (asking && begun() && !sending) wrap.appendChild(startOverAsk());
    return wrap;
  }

  // W111 1: "Start over" (the overnight review's W-S06: a half-filled referral can come back after the tab is closed)
  var asking = false;
  function begun() {
    return S.visited > 0 || !!S.route.county || S.route.outside || S.people.length > 0 || S.charges.length > 0 || allFiles().length > 0 ||
      Object.keys(S.A).some(function (k) { var v = S.A[k]; return v !== '' && v !== null && v !== undefined && v !== false && !(Array.isArray(v) && !v.length); });
  }
  function startOverAsk() {
    var keep = function () { asking = false; render('start-over'); };
    return h('div', { class: 'so-ask', role: 'alertdialog', 'aria-labelledby': 'so-q', 'aria-describedby': 'so-d',
      on: { keydown: function (ev) { if (ev.key === 'Escape') keep(); } } }, [
      h('p', { class: 'so-words' }, [h('strong', { id: 'so-q', text: 'Clear every answer and start again?' }),
        h('span', { id: 'so-d', text: 'Every step is emptied, and any files attached are removed. This cannot be undone.' })]),
      h('div', { class: 'so-btns' }, [
        h('button', { type: 'button', class: 'btn so-clear', on: { click: startOver } }, ['Clear Every Answer']),
        h('button', { type: 'button', class: 'btn btn-navy', id: 'so-keep', on: { click: keep } }, ['Keep My Answers'])])]);
  }
  function startOver() {
    Object.keys(XHRS).forEach(function (id) { var x = XHRS[id]; x.onload = x.onerror = x.onabort = null; x.abort(); });
    XHRS = {}; FILES = {}; pumping = false;
    pendingSend = false; pendingNote = null; chargeQuery = ''; asking = false;
    clearTimeout(saveTimer); clearDraft();
    S = fresh();
    go(0);
  }

  function actions(opts) {
    var row = h('div', { class: 'ref-actions' });
    var back = nextIndex(S.step, -1);
    if (back >= 0) row.appendChild(h('button', { type: 'button', class: 'btn btn-plain', on: { click: function () { go(back); } } }, ['‹ Back']));
    else row.appendChild(h('span', { class: 'spacer' }));
    if (opts && opts.noNext) return row;
    var nx = nextIndex(S.step, 1);
    var blocked = stopped() !== -1 && stopped() <= S.step;
    row.appendChild(h('button', { type: 'button', class: 'btn btn-navy', disabled: blocked || (opts && opts.dim), 'aria-disabled': blocked ? 'true' : null,
      on: { click: function () { tryNext(nx); } } }, ['Next: ' + stepName(nx) + ' ›']));
    return row;
  }

  var ERRORS = null;   // [{ id, text, empty }] from the last Next or Send
  var ERRORS_NEW = false;   // true for the one drawing that shows them first

  function render(focusId) {
    var y = window.scrollY;
    if (turnstileId !== null && window.turnstile) { try { window.turnstile.remove(turnstileId); } catch (e) { /* already gone */ } turnstileId = null; }
    app.textContent = '';
    if (!LISTS) { app.appendChild(h('div', { class: 'ref-card' }, [h('div', { class: 'ref-body' }, [h('p', { text: 'Loading the form…' })])])); return; }
    var card = h('div', { class: 'ref-card' });
    card.appendChild(stepBar());
    var body = h('div', { class: 'ref-body' });
    var sid = STEP_IDS[S.step];
    var q = h('div', { class: 'ref-q' + (sid === 'check' ? '' : ' ruled') });
    ({ county: drawCounty, about: drawAbout, court: drawCourt, client: drawClient, immigration: drawImmigration,
      casetype: drawCaseType, people: drawPeople, documents: drawDocuments, check: drawCheck })[sid](q);
    if (ERRORS && !ERRORS_NEW) pruneErrors();
    ERRORS_NEW = false;
    if (ERRORS && ERRORS.length) showErrors(q);
    body.appendChild(q);
    card.appendChild(body);
    app.appendChild(card);
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) { el.focus({ preventScroll: true }); window.scrollTo(0, y); }
    }
  }

  function heading(q, title, hint) {
    q.appendChild(h('h2', { tabindex: '-1', id: 'step-heading', text: title }));
    if (hint) q.appendChild(h('p', { class: 'hint', text: hint }));
  }

  function go(i) {
    ERRORS = null; asking = false;
    S.step = i;
    S.visited = Math.max(S.visited, i);
    save();
    render();
    var hd = document.getElementById('step-heading');
    app.scrollIntoView({ block: 'start' });
    if (hd) hd.focus({ preventScroll: true });
  }

  function tryNext(nx) {
    var errs = validate(STEP_IDS[S.step]);
    if (errs.length) { setErrors(errs); return; }
    go(nx);
  }

  // W31, the owner's change: an answer still to give is outlined in red, with no words; only an answer that is there
  // but cannot be used (an email address, a choice not from the list, a file) says why beside it. No list at the top:
  // the page goes to the first one instead. The red goes as soon as the answer is given.
  function errKey(e) { return e.id + '|' + e.text; }
  function setErrors(errs) {
    ERRORS = errs; ERRORS_NEW = true; render();
    var first = app.querySelector('.has-err');
    if (!first) return;
    var el = first.querySelector('input:not([type="hidden"]), textarea, select');
    first.scrollIntoView({ block: 'center' });
    if (el) el.focus({ preventScroll: true });
  }
  function pruneErrors() {   // drop what has been put right since; never adds one
    if (!ERRORS) return;
    var now = validate(STEP_IDS[S.step], true).map(errKey);
    ERRORS = ERRORS.filter(function (e) { return now.indexOf(errKey(e)) !== -1; });
  }
  function clearErr(w) {   // an answer typed into a box outlined in red: the red goes at once
    var gone = app.querySelectorAll(w.dataset.grp ? '.has-err[data-grp="' + w.dataset.grp + '"]' : '.has-err[data-err="' + w.dataset.err + '"]');
    Array.prototype.forEach.call(gone, function (x) {
      x.classList.remove('has-err', 'err-empty');
      Array.prototype.forEach.call(x.querySelectorAll('[aria-invalid]'), function (i) { i.removeAttribute('aria-invalid'); });
      if (ERRORS) ERRORS = ERRORS.filter(function (e) { return e.id !== x.dataset.err; });
    });
  }

  function showErrors(q) {
    var empty = 0, grps = {};
    ERRORS.forEach(function (e) {
      if (e.grp) { if (grps[e.grp]) empty--; grps[e.grp] = true; }   // either of a group will do: counted once
      var w = document.getElementById((e.wid || e.id) + '-w') || q.querySelector('#' + (e.wid || e.id) + '-w');
      if (!w) { var el = q.querySelector('#' + e.id); w = el && (el.classList.contains('sq-box') ? el : el.closest('.sub-field, .qrow, .field, .sq-box')); }
      if (!w) return;
      w.classList.add('has-err');
      w.setAttribute('data-err', e.id);
      if (e.grp) w.setAttribute('data-grp', e.grp);
      Array.prototype.forEach.call(w.querySelectorAll('input, textarea, select'), function (i) { i.setAttribute('aria-invalid', 'true'); });
      if (e.empty) { w.classList.add('err-empty'); empty++; }
      else (w.querySelector(':scope > .sq-body') || w.querySelector(':scope > .a') || w).appendChild(h('span', { class: 'field-err', text: e.text }));
    });
    // Said to a screen reader only: the red outline is what the page shows.
    var hd = q.querySelector('#step-heading');
    q.insertBefore(h('p', { class: 'visually-hidden', role: 'status', text: empty ? (empty === 1 ? 'One answer is still needed; it is outlined in red.' : empty + ' answers are still needed; they are outlined in red.') : 'Please check the answers marked in red.' }), hd ? hd.nextSibling : q.firstChild);
  }

  // ---------- Step 1: County (W1, W7, W8, W10) --------------------------------------------------------------------

  var OUTSIDE = '__outside__';

  function contactBlock(b) {
    var kids = [];
    if (b.who) kids.push(h('p', { class: 'who', text: b.who }));
    if (b.org) kids.push(h('p', { class: 'org', text: b.org }));
    if (b.address) kids.push(h('p', { text: b.address }));
    if (b.phone) kids.push(h('p', null, [h('a', { href: 'tel:' + b.tel, text: b.phone }), b.ext ? ' ' + b.ext : '']));
    if (b.website) kids.push(h('p', null, ['Website: ', h('a', { href: b.website, target: '_blank', rel: 'noopener', text: b.websiteText })]));
    if (b.email) kids.push(h('p', null, [b.website ? 'Email: ' : '', h('a', { href: 'mailto:' + b.email, text: b.email })]));
    return h('div', { class: 'contact-block' }, kids);
  }
  function pdfButtons() {
    return h('div', { class: 'pdfs' }, D.PDFS.map(function (p) { return h('a', { class: 'btn btn-navy', href: p.href, download: true, text: p.text }); }));
  }
  function notOnlineCard(code) {   // W7 1
    var c = centreOf(code);
    var card = h('div', { class: 'elsewhere' });
    card.style.setProperty('--rc', c.colour);
    if (c.idp) {
      card.appendChild(h('h3', { text: 'New York City: the Immigrant Defense Project' }));
      card.appendChild(h('p', { text: 'Cases in New York City go to the Padilla Support Center at the Immigrant Defense Project, which runs its own intake. Please contact it directly:' }));
      c.blocks.forEach(function (b) { card.appendChild(contactBlock(b)); });
      return card;
    }
    card.appendChild(h('h3', { text: c.name }));
    card.appendChild(h('p', { text: 'This center does not take referrals on this website yet. Please send it the intake form, with the case documents, by email or post:' }));
    c.blocks.forEach(function (b) { card.appendChild(contactBlock(b)); });
    card.appendChild(pdfButtons());
    return card;
  }
  function centreLine(code) {   // W1 1, W10 1
    var c = centreOf(code);
    if (modeOf(code) === 'email') {
      var l = h('div', { class: 'centre-line email' }, [
        h('div', { class: 'row' }, [h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', null, [h('strong', { text: c.name }), ' will receive this referral, by email.'])]),
        h('p', { class: 'sub', text: 'We email it to the center as you send it, and keep no copy. It will not appear in Your Referrals: to add to it later, contact the center directly.' })]);
      l.style.setProperty('--rc', c.colour);
      return l;
    }
    var line = h('div', { class: 'centre-line' }, [h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', null, [h('strong', { text: c.name }), ' will receive this referral.'])]);
    line.style.setProperty('--rc', c.colour);
    return line;
  }
  function centreChoice(exclude) {   // W8 2
    var list = h('div', { class: 'centres', role: 'radiogroup', 'aria-label': 'Which center should receive this referral?' });
    (LISTS.centres || []).forEach(function (lc) {
      if (lc.code === exclude) return;
      var c = centreOf(lc.code);
      var rid = 'centre-' + lc.code;
      var online = lc.mode === 'system' || lc.mode === 'email';
      var lab = h('label', { class: 'centre', for: rid }, [h('input', { type: 'radio', name: 'centre', id: rid, value: lc.code, 'data-route': 'centre', checked: S.route.centre === lc.code }),
        h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'nm', text: c.name }),
        h('span', { class: 'tag ' + (online ? 'online' : 'post'), text: online ? 'Takes referrals here' : c.idp ? 'Its own intake' : 'By email or post' })]);
      lab.style.setProperty('--rc', c.colour);
      list.appendChild(lab);
    });
    return list;
  }

  // W90 2: the case type first, then the county, worded by it: removal defense and USCIS applications have no county
  // court, so their county is the attorney's office's
  function countyWords() {
    return caseType() === 'removal'
      ? { label: 'County where your office is', outside: 'My office is outside New York State' }
      : { label: 'County where the case is pending', outside: 'The court is outside New York State' };
  }
  function drawCounty(q) {
    heading(q, 'Case type and county', 'The kind of case, and the county that decides which regional center receives your referral.');
    var sheet = drawList(D.STEPS.county, q);
    var words = countyWords();
    var sel = h('select', { id: 'f-county', class: 'big', 'data-route': 'county' });
    sel.appendChild(h('option', { value: '', text: 'Choose a county' }));
    LISTS.counties.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (c) {
      sel.appendChild(h('option', { value: c.name, text: c.name, selected: !S.route.outside && S.route.county === c.name }));
    });
    sel.appendChild(h('option', { value: OUTSIDE, text: words.outside, selected: S.route.outside }));
    var head = [h('label', { class: 'lab', for: 'f-county', id: 'f-county-l' }, [words.label, ' ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })])];
    if (caseType() === 'removal') {
      head.push(h('span', { class: 'g', id: 'f-county-d', text: 'For removal defense or a USCIS application, your office location decides which regional center receives your referral.' }));
      sel.setAttribute('aria-describedby', 'f-county-d');
    }
    var ans = [sel];
    var sec = sheet.lastChild;
    var cc = countyCentre();
    if (!S.route.outside && cc && !S.route.conflict) {
      ans.push(modeOf(cc) === 'none' ? notOnlineCard(cc) : centreLine(cc));
      ans.push(h('p', { class: 'instead' }, ['Does this center have a conflict with your client? ', h('button', { type: 'button', class: 'link-btn', on: { click: function () {
        S.route.conflict = true; S.route.centre = null; save(); render();
      } } }, ['Choose another center ›'])]));
    }
    sec.appendChild(qrow('f-county', head, ans));
    if (S.route.outside || (cc && S.route.conflict)) {   // W8 2: which center instead
      var other = [centreChoice(S.route.outside ? null : cc)];
      if (!S.route.outside) other.push(subField({ key: 'outOfRegionNote', label: 'Anything RIAC should know about the conflict? (optional)', type: 'note' }));
      if (S.route.centre) other.push(modeOf(S.route.centre) === 'none' ? notOnlineCard(S.route.centre) : centreLine(S.route.centre));
      if (!S.route.outside) other.push(h('p', { class: 'instead' }, ['No conflict after all? ', h('button', { type: 'button', class: 'link-btn', on: { click: function () {
        S.route.conflict = false; S.route.centre = null; save(); render();
      } } }, ['Use ' + centreOf(cc).short + ' ›'])]));
      sec.appendChild(qrow('f-centre', [h('span', { class: 'lab', id: 'f-centre-l' }, [S.route.outside ? 'Which center should receive this referral?' : 'Choose another center', ' ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })]),
        h('span', { class: 'g', text: S.route.outside ? 'Choose the center nearest to you, or the one you usually work with.' : 'Because ' + centreOf(cc).short + ' has a conflict with your client.' })], other));
    }
    q.appendChild(actions());
  }

  // ---------- Steps 2 to 5 ---------------------------------------------------------------------------------------

  function drawAbout(q) {
    heading(q, 'About you', 'So RIAC knows who is asking, and how to reach you.');
    drawList(D.STEPS.about, q);
    if (S.A['attorney.officeType'] === 'private') {   // W12 1: the form stops here
      var c = centreOf(receivingCentre());
      var card = h('div', { class: 'elsewhere private-stop' }, [h('h3', { text: 'Please contact your RIAC directly' }),
        h('p', { text: 'RIAC gives free advice to public defenders and assigned counsel. If you are privately retained, your RIAC may be able to refer you to private counsel who can help; you do not need to complete this form. ' +
          (S.route.outside ? 'The center you chose:' : 'For ' + S.route.county + ' County:') }),
        h('p', { class: 'centre-name', text: c.name })]);
      c.blocks.forEach(function (b) { card.appendChild(contactBlock(b)); });
      card.style.setProperty('--rc', c.colour);
      q.appendChild(card);
    }
    q.appendChild(actions());
  }

  function drawCourt(q) {
    heading(q, 'Court and case', 'The court, and where things stand.');
    if (S.sendAs === 'completed-form') {   // W13 2
      q.appendChild(h('div', { class: 'upload-on' }, ['You are sending a completed RIAC intake form. Next you give the client’s name, then upload the form at step 8, with any other documents. ',
        h('button', { type: 'button', class: 'link-btn', on: { click: function () { S.sendAs = 'questions'; S.visited = Math.min(S.visited, S.step); save(); render(); } } }, ['Answer the questions here instead ›'])]));
    } else {
      q.appendChild(h('div', { class: 'upload-switch' }, [h('span', { text: 'Already filled in a RIAC intake form (the PDF)?' }),
        h('button', { type: 'button', class: 'link-btn', on: { click: function () { S.sendAs = 'completed-form'; S.visited = Math.min(S.visited, S.step); save(); render(); } } }, ['Upload it instead ›'])]));
    }
    drawList(D.STEPS.court, q);
    q.appendChild(actions());
  }

  function drawClient(q) {
    heading(q, 'Your client', 'Their name as it appears on their documents, if you know it.');
    drawList(D.STEPS.client, q);
    q.appendChild(actions());
  }

  function drawImmigration(q) {
    heading(q, 'Immigration', 'Provide as much detail as possible. If your client does not know the answer, please say so.');
    drawList(D.STEPS.immigration, q);
    q.appendChild(actions());
  }

  function drawCaseType(q) {
    var t = caseTypeInfo();
    if (!t) { heading(q, 'Case details', 'Choose the case type at step 1 first.'); q.appendChild(actions({ noNext: true })); return; }
    heading(q, t.heading, t.code === 'removal' ? null : 'The questions for ' + (t.code === 'appeal' ? 'an appeal' : t.code === 'post-conviction' ? 'post-conviction relief' : t.code === 'family' ? 'family court or a divorce' : 'a ' + t.heading.toLowerCase()) + ', the case type chosen at step 1.');
    drawList(D.SECTIONS[t.code] || [], q);
    q.appendChild(actions());
  }

  // ---------- Step 7: Other People (W27 2) ----------------------------------------------------------------------

  function personLine(p, i) {
    var role = (D.CHOICES.roles.filter(function (r) { return r.code === p.role; })[0] || {}).label || '';
    var bits = [role, p.relationship, p.dob ? 'born ' + fmtDate(p.dob) : ''].filter(Boolean);
    return h('li', null, [h('span', null, [h('b', { text: (p.firstName + ' ' + p.lastName).trim() }), bits.length ? ' · ' + bits.join(' · ') : '']),
      h('span', { class: 'acts' }, [
        h('button', { type: 'button', class: 'link-btn', on: { click: function () { S.adding = Object.assign({}, p); S.people.splice(i, 1); save(); render('p-first'); } } }, ['Change']),
        h('button', { type: 'button', class: 'link-btn', on: { click: function () { S.people.splice(i, 1); save(); render(); } } }, ['Remove'])])]);
  }
  function personComplete(p) { return !!(p.firstName && p.firstName.trim() && p.lastName && p.lastName.trim() && p.role); }
  function personStarted(p) { return ['firstName', 'lastName', 'dob', 'role', 'relationship'].some(function (k) { return p[k] && String(p[k]).trim(); }); }
  function addPerson() {
    var p = S.adding;
    if (!personComplete(p)) { setErrors(personErrors(p)); return false; }
    S.people.push({ firstName: p.firstName.trim(), lastName: p.lastName.trim(), dob: p.dob || null, role: p.role, relationship: (p.relationship || '').trim() });
    S.adding = {}; ERRORS = null; save(); render('p-first');
    return true;
  }
  function personErrors(p) {
    var e = [];
    if (!p.firstName || !p.firstName.trim()) e.push({ id: 'p-first', empty: true, text: 'first name' });
    if (!p.lastName || !p.lastName.trim()) e.push({ id: 'p-last', empty: true, text: 'middle and last names' });
    if (!p.role) e.push({ id: 'p-role', empty: true, text: 'role' });
    return e;
  }

  function drawPeople(q) {
    heading(q, 'Other people', 'Anyone else named in this case.');
    var sheet = drawList([{ key: 'noOtherPeople', label: 'Is Anyone Else Involved In This Case?', type: 'radio', inline: true, required: true,
      choices: D.CHOICES.others, desc: 'Co-defendants, complainants or victims, witnesses, family members, or anyone else named.' }], q);
    if (S.A.noOtherPeople === 'yes') {
      if (S.people.length) sheet.appendChild(h('section', { class: 'sec' }, [h('h3', { class: 'sec-h', text: 'People added' }), h('ul', { class: 'people-list' }, S.people.map(personLine))]));
      var p = S.adding;
      function prow(id, label, req, guidance, ctrl) {   // a row of the "Add a person" box
        var head = [h('label', { class: 'lab', for: id, id: id + '-l' }, req ? [label, ' ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })] : [label])];
        if (guidance) { head.push(h('span', { class: 'g', id: id + '-g', text: guidance })); ctrl.setAttribute('aria-describedby', id + '-g'); }
        return qrow(id, head, [ctrl]);
      }
      var box = h('section', { class: 'sec', id: 'p-box-w' }, [h('h3', { class: 'sec-h', text: 'Add a person' }),
        prow('p-first', 'First Name', true, 'First name only. If in doubt, put a name in the next box.', h('input', { type: 'text', id: 'p-first', maxlength: '100', value: p.firstName || '', autocomplete: 'off', 'data-person': 'firstName' })),
        prow('p-last', 'Middle & Last Names', true, null, h('input', { type: 'text', id: 'p-last', maxlength: '100', value: p.lastName || '', autocomplete: 'off', 'data-person': 'lastName' })),
        prow('p-dob', 'Date Of Birth', false, 'If known', h('input', { type: 'date', id: 'p-dob', value: p.dob || '', 'data-person': 'dob' })),
        prow('p-role', 'Their Role', true, null, h('select', { id: 'p-role', class: 'role', 'data-person': 'role' }, [h('option', { value: '', text: 'Choose one' })].concat(
          D.CHOICES.roles.map(function (r) { return h('option', { value: r.code, text: r.label, selected: p.role === r.code }); })))),
        prow('p-rel', 'Relationship To The Client', false, 'e.g. "former partner"; "brother"; "none"', h('input', { type: 'text', id: 'p-rel', maxlength: '200', value: p.relationship || '', autocomplete: 'off', 'data-person': 'relationship' })),
        h('div', { class: 'sec-foot' }, [h('button', { type: 'button', class: 'btn btn-navy add-person', on: { click: addPerson } }, ['+ Add This Person'])])]);
      sheet.appendChild(box);
      sheet.appendChild(h('section', { class: 'sec' }, [h('h3', { class: 'sec-h', text: 'Names not known' }), field({ key: 'peopleNote', label: 'Anyone Involved Whose Name You Do Not Know', type: 'note',
        guidance: { eg: 'e.g. "Two unidentified co-defendants"; "the complainant’s mother, name unknown"' } })]));
    }
    q.appendChild(actions());
  }

  // ---------- Step 8: Documents (W28) ----------------------------------------------------------------------------

  function docState(kind) { if (!S.docs[kind]) S.docs[kind] = { status: null, note: '', files: [] }; return S.docs[kind]; }
  function batchValid() {
    return S.batch && S.batch.centre === receivingCentre() && new Date(S.batch.expiresAt).getTime() - Date.now() > 60000;
  }

  function drawDocuments(q) {
    heading(q, 'Documents', 'For each document, attach it now or say where it is. Files go only to the center.');
    var bc = h('div', { class: 'bot-check', id: 'bot-check' });
    q.appendChild(bc);
    var lim = S.batch && batchValid() ? S.batch : null;
    q.appendChild(h('p', { class: 'limits', id: 'limits' }, lim ? limitsText(lim) : ['Checking that you are not a robot, then the file limits show here…']));
    if (modeOf(receivingCentre()) === 'email') {
      q.appendChild(h('p', { class: 'desc', text: 'This center receives referrals by email, so the files travel inside the email. Larger files can be sent to the center directly after Send.' }));
    }
    D.docKinds(caseType(), S.sendAs).forEach(function (kind) { q.appendChild(docBox(kind)); });
    var rap = docState('rap-sheet'), more = [];
    if (rap.status === 'attached' || rap.status === 'sent-before') {
      more.push({ type: 'section', title: 'The RAP sheet' }, { key: 'rapSheetComplete', label: 'Does The RAP Sheet Include ALL Of Your Client’s Criminal History?', type: 'radio', inline: true, choices: D.CHOICES.rapComplete });
      if (S.A.rapSheetComplete === 'no' || S.A.rapSheetComplete === 'unsure') {
        more.push({ key: 'rapSheetMore', label: 'Criminal History Not On The RAP Sheet / Further Details', type: 'note', guidance: { eg: 'e.g. "Arrested in New Jersey in 2019 for shoplifting; outcome unknown"' } });
      }
    }
    drawList(more.concat({ type: 'section', title: 'Anything else' }, { key: 'anythingElse', label: 'Anything Else RIAC Needs To Know?', type: 'long' }), q);
    q.appendChild(actions());
    setTimeout(startBotCheck, 0);
  }
  function limitsText(b) {
    return ['You can attach up to ', h('b', { text: b.maxFiles + ' files' }), ': up to ', h('b', { text: fmtBytes(b.maxFileBytes) }), ' each, and ',
      h('b', { text: fmtBytes(b.maxTotalBytes) }), ' in all.'];
  }

  function docBox(kind) {
    var info = D.DOCS[kind];
    var st = docState(kind);
    var id = 'd-' + kind;
    if (info.named) st.status = 'attached';   // W36: no choice to make, only files to add and name
    var statuses = [['attached', 'Attach Now']].concat(info.sentBefore ? [['sent-before', 'Sent Before']] : [], [['to-follow', 'To Follow'], ['unavailable', 'Not Available']]);
    var pills = h('div', { class: 'pills4' + (statuses.length === 3 ? ' three' : ''), role: 'radiogroup', 'aria-label': info.name });
    statuses.forEach(function (s) {
      pills.appendChild(h('label', { class: 'pill' + (s[0] === 'attached' ? ' attach' : ''), for: id + '-' + s[0] }, [h('input', { type: 'radio', name: id, id: id + '-' + s[0], value: s[0], 'data-doc': kind, checked: st.status === s[0] }), s[1]]));
    });
    var body = h('div', { class: 'sq-body' }, info.named ? [] : [pills]);
    if (st.status === 'attached') {
      var input = h('input', { type: 'file', multiple: true, class: 'visually-hidden', id: id + '-file', 'data-file': kind,
        accept: '.pdf,.docx,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic' });
      var drop = h('div', { class: 'drop' }, [h('label', { class: 'btn btn-plain', for: id + '-file', text: 'Choose Files' }), input, h('span', { class: 'drop-note', text: 'or drop them here' })]);
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); addFiles(kind, e.dataTransfer.files); });
      body.appendChild(drop);
      if (st.files.length) body.appendChild(h('ul', { class: 'files', 'aria-live': 'polite' }, st.files.map(function (f) { return fileRow(kind, f); })));
    }
    if (st.status === 'unavailable') {
      var nf = subField({ key: 'doc.' + kind + '.note', label: 'Please explain (we may be able to help)', type: 'note' });
      var ta = nf.querySelector('textarea'); ta.removeAttribute('data-key'); ta.setAttribute('data-docnote', kind); ta.value = st.note || '';
      body.appendChild(nf);
    }
    return h('div', { class: 'sq-box', id: id + '-w' }, [h('div', { class: 'sq-head' }, [h('span', { class: 'nm' }, [info.name, h('span', { class: 'ds', text: info.desc })])]), body]);
  }

  function fileRow(kind, f) {
    var state;
    if (f.state === 'done') state = [h('span', { class: 'fstate ok', text: '✓ Uploaded' })];
    else if (f.state === 'queued' && !batchValid()) state = [h('span', { class: 'fstate', text: 'Waiting for the check above that you are not a robot' })];   // W-Q13
    else if (f.state === 'uploading' || f.state === 'queued') {
      var bar = h('span'); bar.style.width = (f.pct || 0) + '%';
      state = [h('span', { class: 'fstate' }, [h('span', { class: 'bar', 'aria-hidden': 'true' }, [bar]), ' ' + (f.pct || 0) + '%'])];
    } else state = [h('span', { class: 'fstate bad', text: f.error || 'Did not upload' })];
    var act = f.state === 'failed' && FILES[f.id] && f.retry
      ? h('button', { type: 'button', class: 'link-btn', on: { click: function () { f.state = 'queued'; f.error = ''; pump(); render(); } } }, ['Try Again'])
      : h('button', { type: 'button', class: 'link-btn', on: { click: function () { removeFile(kind, f.id); } } }, [f.state === 'uploading' ? 'Cancel' : 'Remove']);
    var li = h('li', null, [h('span', { class: 'fname', text: f.name }), h('span', { class: 'fsize', text: fmtBytes(f.size) })].concat(state, [act]));
    if (D.DOCS[kind].named) li.appendChild(h('div', { class: 'field fnote', id: 'n-' + f.id + '-w' }, [   // W36: what each file is
      h('label', { for: 'n-' + f.id }, ['What is it? ', h('span', { class: 'req', 'aria-hidden': 'true', text: '*' })]),
      h('span', { class: 'g', id: 'n-' + f.id + '-g', text: 'e.g. Notice to Appear; I-213; denial of adjustment' }),
      h('input', { type: 'text', id: 'n-' + f.id, maxlength: '200', value: f.note || '', autocomplete: 'off', 'data-fnote': f.id, 'data-fkind': kind, 'aria-describedby': 'n-' + f.id + '-g' })]));
    return li;
  }

  function addFiles(kind, list) {
    var st = docState(kind);
    Array.prototype.forEach.call(list, function (file) {
      var id = uuid();
      FILES[id] = file;
      st.files.push({ id: id, name: file.name, size: file.size, type: file.type, state: 'queued', pct: 0, fileId: null, error: '' });
    });
    save(); render(); pump();
  }
  function removeFile(kind, id) {
    var st = docState(kind);
    if (XHRS[id]) { XHRS[id].abort(); delete XHRS[id]; }
    delete FILES[id];
    st.files = st.files.filter(function (f) { return f.id !== id; });
    save(); render();
  }
  function allFiles() {
    var out = [];
    Object.keys(S.docs).forEach(function (k) { (S.docs[k].files || []).forEach(function (f) { out.push({ kind: k, f: f }); }); });
    return out;
  }

  // Sends the queued files one at a time (contract C step 2). Without a batch they wait until the bot check makes one.
  var pumping = false;
  function pump() {
    if (pumping) return;
    if (!batchValid()) return;
    var next = allFiles().filter(function (x) { return x.f.state === 'queued'; })[0];
    if (!next) { maybeSend(); return; }
    var f = next.f, file = FILES[f.id];
    if (!file) { f.state = 'failed'; f.error = 'Please attach this file again.'; render(); return; }
    var used = allFiles().filter(function (x) { return x.f.state === 'done'; });
    var total = used.reduce(function (n, x) { return n + x.f.size; }, 0);
    if (file.size > S.batch.maxFileBytes) { f.state = 'failed'; f.error = 'Over the ' + fmtBytes(S.batch.maxFileBytes) + ' limit for one file.'; render(); pump(); return; }
    if (used.length >= S.batch.maxFiles || total + file.size > S.batch.maxTotalBytes) {
      f.state = 'failed'; f.error = 'Over the limit of ' + S.batch.maxFiles + ' files, ' + fmtBytes(S.batch.maxTotalBytes) + ' in all.'; render(); pump(); return;
    }
    pumping = true;
    f.state = 'uploading'; f.pct = 0; renderFiles();
    var xhr = new XMLHttpRequest();
    XHRS[f.id] = xhr;
    xhr.open('PUT', CFG.worker + '/v1/uploads/' + encodeURIComponent(S.batch.uploadId) + '/files');
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) { f.pct = Math.round(e.loaded / e.total * 100); renderFiles(); } };
    xhr.onload = function () {
      delete XHRS[f.id]; pumping = false;
      var body = {}; try { body = JSON.parse(xhr.responseText || '{}'); } catch (e) { /* not JSON */ }
      if (xhr.status === 201 && body.fileId) { f.state = 'done'; f.fileId = body.fileId; f.pct = 100; }
      else if (xhr.status === 400 && expired(body)) { f.state = 'queued'; renewBatch(); return; }
      else {
        f.state = 'failed';
        f.retry = [413, 415, 409].indexOf(xhr.status) === -1;
        f.error = xhr.status === 413 ? 'Too large to send.' : xhr.status === 415 ? 'This kind of file cannot be sent: use PDF, Word (.docx), JPEG, PNG or HEIC.'
          : xhr.status === 409 ? 'Over the limit of ' + S.batch.maxFiles + ' files, ' + fmtBytes(S.batch.maxTotalBytes) + ' in all.'
          : 'Did not upload. Check your connection and try again.';
      }
      save(); render(); pump();
    };
    xhr.onerror = function () { delete XHRS[f.id]; pumping = false; f.state = 'failed'; f.retry = true; f.error = 'Did not upload. Check your connection and try again.'; save(); render(); pump(); };
    xhr.onabort = function () { pumping = false; pump(); };
    xhr.send(file);
  }
  function expired(body) { return body && body.error === 'invalid' && (body.fields || []).some(function (x) { return x.key === 'uploadId' && (x.problem === 'expired' || x.problem === 'used'); }); }
  function renderFiles() {   // redraw only the progress bars, so typing elsewhere is not interrupted
    var ae = document.activeElement, aid = ae && ae.dataset && ae.dataset.fnote ? ae.id : null, s0 = aid ? ae.selectionStart : 0, s1 = aid ? ae.selectionEnd : 0;
    allFiles().forEach(function (x) {
      var ul = document.querySelector('#d-' + x.kind + '-w .files');
      if (!ul) return;
      var st = docState(x.kind);
      ul.textContent = '';
      st.files.forEach(function (f) { ul.appendChild(fileRow(x.kind, f)); });
    });
    if (aid) { var el = document.getElementById(aid); if (el) { el.focus({ preventScroll: true }); try { el.setSelectionRange(s0, s1); } catch (e) { /* not a text box */ } } }   // a name being typed keeps its place
  }

  // Step 1 of the contract: a batch, carrying Cloudflare's bot check (W28: at the top of Documents).
  function loadTurnstile(cb) {
    if (window.turnstile) { cb(); return; }
    if (!document.getElementById('cf-turnstile-js')) {
      var s = document.createElement('script');
      s.id = 'cf-turnstile-js';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.addEventListener('load', function () { cb(); });
      document.head.appendChild(s);
    } else document.getElementById('cf-turnstile-js').addEventListener('load', function () { cb(); });
  }
  // The widget is drawn into the step each time the step is drawn, until a batch exists; then it is not needed.
  var batchInFlight = false;
  function startBotCheck() {
    var box = document.getElementById('bot-check');
    if (!box) return;
    if (batchValid()) { box.classList.add('done'); box.appendChild(h('p', { class: 'desc', text: '✓ Checked that you are not a robot.' })); pump(); return; }
    if (batchInFlight) { box.appendChild(h('p', { class: 'desc', text: 'Checking…' })); return; }
    loadTurnstile(function () {
      var target = document.getElementById('bot-check');
      if (!target || target.childElementCount) return;
      if (turnstileId !== null) { try { window.turnstile.remove(turnstileId); } catch (e) { /* already gone */ } turnstileId = null; }
      turnstileId = window.turnstile.render(target, { sitekey: CFG.turnstileKey, callback: onToken, theme: 'light',
        'error-callback': function () { stopPending(); setLimits([D.BOT_CHECK_FAILED]); } });
    });
  }
  function renewBatch() {   // a batch past its hour, or made for another center: make a new one, and send the files again
    S.batch = null;
    save();
    if (STEP_IDS[S.step] === 'documents' || STEP_IDS[S.step] === 'check') render();
  }
  function busyFiles() { return allFiles().some(function (x) { return x.f.state === 'queued' || x.f.state === 'uploading'; }); }
  function maybeSend() {
    if (pendingSend && batchValid() && !busyFiles()) { pendingSend = false; send(); }
  }
  function setLimits(kids) { var el = document.getElementById('limits'); if (el) { el.textContent = ''; kids.forEach(function (k) { el.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); }); } }

  function onToken(token) {
    if (batchInFlight || batchValid()) return;
    batchInFlight = true;
    var body = { turnstile: token };
    if (S.route.outside || S.route.conflict) body.centre = S.route.centre;
    if (!S.route.outside) body.county = S.route.county;
    api('POST', '/v1/uploads', body).then(function (r) {
      batchInFlight = false;
      if (r.status === 201) {
        S.batch = { uploadId: r.body.uploadId, expiresAt: r.body.expiresAt, maxFiles: r.body.maxFiles, maxFileBytes: r.body.maxFileBytes,
          maxTotalBytes: r.body.maxTotalBytes, centre: receivingCentre() };
        // A new batch: every file must be sent again under it.
        allFiles().forEach(function (x) { if (x.f.state === 'done' || x.f.state === 'uploading') { x.f.state = FILES[x.f.id] ? 'queued' : 'failed'; x.f.fileId = null;
          if (!FILES[x.f.id]) x.f.error = 'Please attach this file again.'; } });
        save();
        render();
        pump();
      } else if (r.status === 503 && r.body.error === 'daily-limit') {
        stopPending(); showDailyLimit();
      } else if (r.status === 403) {
        stopPending(); setLimits(['The check that you are not a robot did not pass. Please reload the page and try again.']);
      } else {
        stopPending(); setLimits(['Files cannot be sent just now. Please try again in a few minutes.']);
      }
    });
  }

  // ---------- Talking to the worker ------------------------------------------------------------------------------

  function api(method, path, body, headers) {
    var h2 = body ? { 'Content-Type': 'application/json' } : {};
    Object.keys(headers || {}).forEach(function (k) { h2[k] = headers[k]; });
    return fetch(CFG.worker + path, { method: method, headers: h2, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', mode: 'cors' })
      .then(function (res) {
        return res.text().then(function (t) {
          var b = {}; try { b = t ? JSON.parse(t) : {}; } catch (e) { b = {}; }
          return { status: res.status, body: b, retryAfter: parseInt(res.headers.get('Retry-After') || '0', 10) };
        });
      }, function () { return { status: 0, body: {} }; });
  }

  // ---------- The referral, as the contract's key list --------------------------------------------------------------

  var KEYS = {
    attorney: ['firstName', 'lastName', 'email', 'phone', 'officeType', 'office', 'officeNotListed', 'officeDetails', 'privateDetails'],
    case: ['caseType', 'urgentBy', 'sendAs'],
    client: ['firstName', 'lastName', 'dob', 'aliases', 'aliasDetails', 'address', 'countryOfBirth', 'english', 'language', 'entryStatus', 'entryDate', 'currentStatus',
      'currentStatusDate', 'aNumber', 'pendingApplications', 'screeningClient', 'screeningClientUnknownWhy', 'screeningIce', 'screeningIceUnknownWhy',
      'screeningImmigration', 'screeningImmigrationUnknownWhy', 'immigrationAttorney', 'familyAny', 'familyAnyUnknownWhy', 'family', 'familyUnknownWhy', 'details'],
    court: ['name', 'notListed', 'notListedDetails', 'docket', 'nextDate', 'iceInvolvement', 'protectionOrder', 'protectionOrderUnknownWhy', 'protectionOrders',
      'protectionOrdersUnknownWhy', 'custody', 'details', 'immigrationOffice'],
    vop: ['underlyingAdvised', 'underlyingAdvisedUnknownWhy', 'underlyingCaseNumber', 'underlyingConvictions', 'originalSentence', 'allegations', 'parallelCharge',
      'parallelChargeUnknownWhy', 'parallelChargeDetails'],
    removal: ['issues'], criminal: ['allegations', 'offer', 'offenceDate', 'screeningIncident', 'screeningIncidentUnknownWhy', 'details'],
    appeal: ['adviceBefore', 'disposition', 'adviceDetails'],
    family: ['matterTypes', 'description', 'offer', 'children', 'marriage', 'spouseSponsored', 'affidavitOfSupport', 'spouseStatus', 'screeningMarriage',
      'screeningMarriageUnknownWhy', 'screeningChildren', 'screeningChildrenUnknownWhy', 'screeningMoney', 'screeningMoneyUnknownWhy', 'details']
  };
  var TICK_KEYS = ['client.screeningClient', 'client.screeningIce', 'client.screeningImmigration', 'client.family', 'court.protectionOrders',
    'criminal.screeningIncident', 'family.matterTypes', 'family.screeningMarriage', 'family.screeningChildren', 'family.screeningMoney'];

  // The answers the attorney can see now, by key (a hidden question's answer is not sent).
  function shownAnswers() {
    var out = {};
    var ids = ['county', 'about', 'court', 'client', 'immigration'];
    if (!skipped('casetype')) ids.push('casetype');
    ids.forEach(function (sid) {
      if (skipped(sid)) return;
      flat(stepQuestions(sid)).forEach(function (q) {
        if (!q.key || q.type === 'para' || q.type === 'charges' || !visible(q)) return;
        var v = S.A[q.key];
        if (q.type === 'ticks') {
          v = Array.isArray(v) ? v.slice() : [];
          if (v.indexOf('unknown') !== -1) out[q.key + 'UnknownWhy'] = clean(S.A[q.key + 'UnknownWhy']);
        } else if (q.type === 'check') v = v === true;
        else if (q.type === 'radio') { v = v || null; if (q.unknownNote && v === 'unknown') out[q.key + 'UnknownWhy'] = clean(S.A[q.key + 'UnknownWhy']); }
        else v = clean(v);
        if (q.alias && out[q.key] !== undefined && v === null) return;
        out[q.key] = v;
      });
    });
    return out;
  }
  function clean(v) { if (v === undefined || v === null) return null; v = String(v).trim(); return v === '' ? null : v; }

  function buildReferral() {
    var A = shownAnswers();
    var ct = caseType();
    var sections = { criminal: ct === 'criminal' || ct === 'post-conviction', vop: ct === 'vop', appeal: ct === 'appeal' || ct === 'post-conviction', family: ct === 'family', removal: ct === 'removal' };
    var up = S.sendAs === 'completed-form';
    function section(name) {
      var o = {};
      KEYS[name].forEach(function (k) {
        var key = name + '.' + k;
        o[k] = A.hasOwnProperty(key) ? A[key] : TICK_KEYS.indexOf(key) !== -1 ? [] : null;
      });
      return o;
    }
    var attorney = section('attorney');
    var cs = section('case'); cs.sendAs = S.sendAs;
    var r = {
      formVersion: 1,
      county: S.route.outside ? null : S.route.county,
      centre: S.route.outside || S.route.conflict ? S.route.centre : null,
      outOfRegionReason: S.route.outside ? 'court-outside-ny' : S.route.conflict ? 'conflict' : null,
      outOfRegionNote: S.route.conflict ? clean(S.A.outOfRegionNote) : null,
      attorney: attorney,
      case: cs,
      client: section('client'),
      court: up ? null : section('court'),
      criminal: !up && sections.criminal ? section('criminal') : null,
      vop: !up && sections.vop ? section('vop') : null,
      appeal: !up && sections.appeal ? section('appeal') : null,
      family: !up && sections.family ? section('family') : null,
      removal: !up && sections.removal ? section('removal') : null,
      people: up ? [] : S.A.noOtherPeople === 'yes' ? S.people.map(function (p) {
        return { firstName: p.firstName, lastName: p.lastName, dob: p.dob || null, role: p.role, relationship: clean(p.relationship) };
      }) : [],
      peopleNote: !up && S.A.noOtherPeople === 'yes' ? clean(S.A.peopleNote) : null,
      noOtherPeople: up || S.A.noOtherPeople === 'yes' || !S.A.noOtherPeople ? null : S.A.noOtherPeople,
      documents: documentsList(),
      rapSheetComplete: null, rapSheetMore: null,
      anythingElse: clean(S.A.anythingElse)
    };
    if (r.criminal && S.charges.length) r.criminal.charges = S.charges.map(chargeOut);   // W101 1a: only when chosen
    var rap = docState('rap-sheet');
    if (rap.status === 'attached' || rap.status === 'sent-before') {
      r.rapSheetComplete = S.A.rapSheetComplete || null;
      if (r.rapSheetComplete === 'no' || r.rapSheetComplete === 'unsure') r.rapSheetMore = clean(S.A.rapSheetMore);
    }
    return r;
  }
  function documentsList() {
    var out = [];
    D.docKinds(caseType(), S.sendAs).forEach(function (kind) {
      var st = docState(kind);
      var named = D.DOCS[kind].named;
      if (st.status === 'attached' || named) st.files.forEach(function (f) { if (f.state === 'done' && f.fileId) out.push({ kind: kind, fileField: f.fileId, status: 'attached', note: named ? clean(f.note) : null }); });
      else if (st.status) out.push({ kind: kind, fileField: null, status: st.status, note: st.status === 'unavailable' ? clean(st.note) : null });
    });
    return out;
  }

  // ---------- Checking answers before Next --------------------------------------------------------------------------

  // dry: only look (used to take away the red once an answer is given); otherwise W27 2's safeguard may add a person.
  function validate(sid, dry) {
    var errs = [];
    if (sid === 'county') {
      if (!caseType()) errs.push({ id: fid('case.caseType') + '-0', wid: fid('case.caseType'), empty: true, text: 'answer' });   // W90 2
      if (!S.route.outside && !S.route.county) errs.push({ id: 'f-county', empty: true, text: 'county' });
      else if ((S.route.outside || S.route.conflict) && !S.route.centre) errs.push({ id: 'f-centre', empty: true, text: 'center' });
      return errs;
    }
    if (sid === 'people') {
      if (!S.A.noOtherPeople) errs.push({ id: fid('noOtherPeople') + '-0', wid: fid('noOtherPeople'), empty: true, text: 'anyone else' });
      if (S.A.noOtherPeople === 'yes') {
        if (personStarted(S.adding)) {   // W27 2's safeguard: details typed but not added are added now, or stopped on
          if (personComplete(S.adding)) { if (!dry) S.people.push({ firstName: S.adding.firstName.trim(), lastName: S.adding.lastName.trim(), dob: S.adding.dob || null, role: S.adding.role, relationship: (S.adding.relationship || '').trim() }); if (!dry) { S.adding = {}; save(); } }
          else return personErrors(S.adding);
        }
        if (!S.people.length && !clean(S.A.peopleNote) && !(dry && personComplete(S.adding))) {   // a person, or the note: either will do
          errs.push({ id: 'p-first', wid: 'p-box', empty: true, grp: 'people', text: 'a person' });
          errs.push({ id: fid('peopleNote'), empty: true, grp: 'people', text: 'a person' });
        }
      }
      return errs;
    }
    if (sid === 'documents') {
      D.docKinds(caseType(), S.sendAs).forEach(function (kind) {
        var st = docState(kind), info = D.DOCS[kind];
        if (info.named) {   // W36: none needed; any file must have finished, and each needs its name
          if (st.files.some(function (f) { return f.state === 'failed'; })) errs.push({ id: 'd-' + kind, text: 'Remove the files that could not be sent; the reason is beside each.' });
          else if (st.files.some(function (f) { return f.state !== 'done'; })) errs.push({ id: 'd-' + kind, text: 'Please wait for every file to finish uploading.' });
          st.files.forEach(function (f) { if (f.state === 'done' && !clean(f.note)) errs.push({ id: 'n-' + f.id, empty: true, text: 'name' }); });
          return;
        }
        if (!st.status) errs.push({ id: 'd-' + kind, empty: true, text: 'status' });
        else if (st.status === 'attached') {
          if (!st.files.length) errs.push({ id: 'd-' + kind, empty: true, text: 'files' });
          else if (st.files.some(function (f) { return f.state === 'failed'; })) errs.push({ id: 'd-' + kind, text: 'Remove the files that could not be sent; the reason is beside each.' });
          else if (st.files.some(function (f) { return f.state !== 'done'; })) errs.push({ id: 'd-' + kind, text: 'Please wait for every file to finish uploading.' });
        }
      });
      return errs;
    }
    if (sid === 'about' && S.A['attorney.officeType'] === 'private') return errs;
    flat(stepQuestions(sid)).forEach(function (q) {
      if (!q.key || !visible(q)) return;
      var v = S.A[q.key];
      var id = q.type === 'ticks' ? fid(q.key) : q.type === 'radio' ? fid(q.key) + '-0' : fid(q.key, q.alias);
      if (q.required) {
        if (q.type === 'ticks' && !(Array.isArray(v) && v.length)) errs.push({ id: fid(q.key) + '-' + q.choices[0].code, wid: fid(q.key), empty: true, text: 'ticks' });
        else if (q.type !== 'ticks' && !clean(v)) errs.push({ id: id, wid: q.type === 'radio' ? fid(q.key) : null, empty: true, text: 'answer' });
      }
      if (q.type === 'email' && clean(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) errs.push({ id: id, text: 'Please enter an email address, like name@example.org.' });
      else if (q.type === 'email' && clean(v) && !/^[A-Za-z0-9._%+-]+@/.test(v.trim())) errs.push({ id: id, text: D.EMAIL_CHARS + '. Please use another address, or send your RIAC the intake form instead.' });
      if (q.type === 'charges' && chargeQuery.trim() && S.charges.length < CH.max) errs.push({ id: id, text: CH.notChosen });
      if (q.type === 'search' && clean(v) && q.list === 'offices' && LISTS && LISTS.offices.indexOf(v.trim()) === -1) {
        errs.push({ id: id, text: 'Please choose your office from the list, or tick Office Not Listed?' });
      }
      if (q.type === 'search' && clean(v) && q.list === 'courts' && LISTS && (LISTS.courts[S.route.county] || []).indexOf(v.trim()) === -1) {
        errs.push({ id: id, text: 'Please choose the court from the list, or tick Court Not Listed / Non-NY Court?' });
      }
    });
    return errs;
  }

  // ---------- Step 9: Review And Send (W29 1, W35) ------------------------------------------------------------------------

  function answerText(q, v) {
    if (q.type === 'charges') return S.charges.length ? S.charges.map(chargeLabel).join('\n') : '—';
    if (q.type === 'ticks') {
      v = Array.isArray(v) ? v : [];
      if (!v.length) return '—';
      return v.map(function (c) { return c === 'none' ? 'None of these apply' : c === 'unknown' ? 'Unknown' : (q.choices.filter(function (x) { return x.code === c; })[0] || {}).label || c; }).join('; ')
        + (v.indexOf('unknown') !== -1 && clean(S.A[q.key + 'UnknownWhy']) ? ': ' + S.A[q.key + 'UnknownWhy'].trim() : '');
    }
    if (q.type === 'radio') {
      var c = (q.choices.filter(function (x) { return x.code === v; })[0] || {}).label;
      if (!c) return '—';
      return c + (q.unknownNote && v === 'unknown' && clean(S.A[q.key + 'UnknownWhy']) ? ': ' + S.A[q.key + 'UnknownWhy'].trim() : '');
    }
    if (q.type === 'check') return v === true ? 'Yes' : 'No';
    if (q.type === 'date') return v ? fmtDate(v) : '—';
    return clean(v) || '—';
  }
  function rowsFor(list) {
    var rows = [];
    flat(list).forEach(function (q) {
      if (!q.key || q.type === 'para' || !visible(q)) return;
      rows.push([q.copy || (q.labelHtml ? plain(q.label) : q.label), answerText(q, S.A[q.key])]);
    });
    return rows;
  }
  function copySections() {
    var secs = [];
    var rc = receivingCentre();
    var words = countyWords();
    var county = rowsFor(D.STEPS.county).concat([[words.label, S.route.outside ? words.outside : S.route.county || '—'], ['Center', centreOf(rc).name]]);
    if (S.route.conflict) { county.push(['Reason for this center', 'The county’s own center has a conflict']); if (clean(S.A.outOfRegionNote)) county.push(['About the conflict', S.A.outOfRegionNote.trim()]); }
    secs.push(['Case Type & County', county, 0]);
    secs.push(['About You', rowsFor(D.STEPS.about), 1]);
    var court = rowsFor(D.STEPS.court);
    court.unshift(['How it is sent', S.sendAs === 'completed-form' ? 'A completed RIAC intake form, attached' : 'Answered on this form']);
    secs.push(['Court & Case', court, 2]);
    secs.push(['Client', rowsFor(D.STEPS.client), 3]);
    if (!skipped('immigration')) secs.push(['Immigration', rowsFor(D.STEPS.immigration), 4]);
    if (!skipped('casetype') && caseTypeInfo()) secs.push([caseTypeInfo().step, rowsFor(D.SECTIONS[caseType()] || []), 5]);
    if (!skipped('people')) {
      var pr = [];
      var oth = (D.CHOICES.others.filter(function (c) { return c.code === S.A.noOtherPeople; })[0] || {}).label || '—';
      if (S.A.noOtherPeople !== 'yes') pr.push(['Anyone else involved?', oth]);
      S.people.forEach(function (p) {
        var role = (D.CHOICES.roles.filter(function (r) { return r.code === p.role; })[0] || {}).label;
        pr.push([(p.firstName + ' ' + p.lastName).trim(), [role, p.relationship, p.dob ? 'born ' + fmtDate(p.dob) : ''].filter(Boolean).join(' · ')]);
      });
      if (S.A.noOtherPeople === 'yes' && clean(S.A.peopleNote)) pr.push(['People whose names are not known', S.A.peopleNote.trim()]);
      secs.push(['Other People', pr, 6]);
    }
    var dr = [];
    D.docKinds(caseType(), S.sendAs).forEach(function (kind) {
      var st = docState(kind);
      var t = D.DOCS[kind].named ? (st.files.length ? st.files.map(function (f) { return (clean(f.note) || '—') + ' (' + f.name + ')'; }).join('; ') : 'None attached')
        : st.status === 'attached' ? 'Attached: ' + st.files.map(function (f) { return f.name; }).join(', ')
        : st.status === 'sent-before' ? 'Sent before' : st.status === 'to-follow' ? 'To follow'
        : st.status === 'unavailable' ? 'Not available' + (clean(st.note) ? ': ' + st.note.trim() : '') : '—';
      dr.push([D.DOCS[kind].name, t]);
    });
    var rap = docState('rap-sheet');
    if (rap.status === 'attached' || rap.status === 'sent-before') {
      var rl = (D.CHOICES.rapComplete.filter(function (c) { return c.code === S.A.rapSheetComplete; })[0] || {}).label || '—';
      dr.push(['RAP sheet complete?', rl + (clean(S.A.rapSheetMore) && (S.A.rapSheetComplete === 'no' || S.A.rapSheetComplete === 'unsure') ? ': ' + S.A.rapSheetMore.trim() : '')]);
    }
    dr.push(['Anything else', clean(S.A.anythingElse) || '—']);
    secs.push(['Documents', dr, 7]);
    return secs;
  }
  function copySheet(opts) {
    opts = opts || {};
    var sheet = h('article', { class: 'copy-sheet' });
    var ref = opts.sent ? [document.createTextNode('Reference'), h('br'), h('strong', { text: opts.sent.reference })] : [document.createTextNode('Not sent yet')];
    sheet.appendChild(h('div', { class: 'copy-head' }, [h('span', { class: 'mark' }, [h('img', { src: 'images/riac-mark.svg', alt: '' })]),
      h('span', { class: 'org' }, ['Regional Immigration Assistance Centers', h('small', { text: 'nyriac.com' })]), h('span', { class: 'ref' }, ref)]));
    var rc = receivingCentre();
    sheet.appendChild(h('h2', { class: 'copy-title', text: (opts.sent && opts.sent.delivery === 'email' ? 'Referral emailed to ' : 'Referral to ') + centreOf(rc).name }));
    sheet.appendChild(h('p', { class: 'copy-sub', text: opts.sent
      ? 'Sent ' + fmtWhen(opts.sent.sentAt) + '.' + (opts.sent.receiptTo ? ' A receipt went to ' + opts.sent.receiptTo + '.' : '')
      : opts.daily ? 'Your answers, to print or save and send with the intake form.'
      : 'Please read every answer. Change any section before you send; this is also the copy you will keep.' }));
    copySections().forEach(function (s) {
      var h3 = h('h3', null, [h('span', { text: s[0] })]);
      if (!opts.sent && !opts.daily) h3.appendChild(h('button', { type: 'button', class: 'link-btn', 'aria-label': 'Change ' + s[0], on: { click: function () { go(s[2]); } } }, ['Change']));
      sheet.appendChild(h('section', { class: 'copy-section' }, [h3, h('dl', { class: 'copy-rows' }, s[1].map(function (r) {
        return h('div', { class: 'row' }, [h('dt', { text: r[0] }), h('dd', { text: r[1] })]);
      }))]));
    });
    if (opts.sent) sheet.appendChild(h('div', { class: 'copy-foot' }, [h('p', { text: 'The attorney’s copy of a referral sent through nyriac.com. The answers went only to the center; the website keeps no copy.' })]));
    return sheet;
  }
  function fmtWhen(iso) {
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
    } catch (e) { return iso; }
  }

  var pendingSend = false, sending = false;

  // W32 1: the paper criminal form's "Before you receive RIAC advice", short, above Send. Each warning carries its
  // advisory's symbol (images/symbols.svg, as on the Practice Advisories page) and opens the PDF in a new tab, so the
  // form is not lost.
  function symbol(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg'), use = document.createElementNS(ns, 'use');
    use.setAttribute('href', 'images/symbols.svg#i-' + name);
    svg.appendChild(use);
    return h('span', { class: 'symbol', 'aria-hidden': 'true' }, [svg]);
  }
  function adviceFirst() {
    var AF = D.ADVICE_FIRST;
    if (AF.caseTypes.indexOf(caseType()) === -1) return null;
    return h('section', { class: 'advice-first', 'aria-labelledby': 'advice-first-h' }, [
      h('h3', { id: 'advice-first-h', text: 'Before You Receive RIAC Advice' }),
      h('ul', null, AF.items.map(function (it) {
        var words = h('span', null, [h('b', { text: it.bold }), it.text]);
        if (it.doc) words.appendChild(h('a', { href: it.doc, target: '_blank', rel: 'noopener', 'aria-label': 'Read the advisory: ' + it.title + ' (PDF, opens in a new tab)' }, ['Read the advisory ›']));
        return h('li', null, [symbol(it.symbol), words]);
      }))]);
  }

  // W77 1: when the upload has lapsed, the robot check and its one note sit beside Send. Pressed before the check is
  // done, Send changes that note's words in place, and the button reads "Sending…" until the referral goes.
  var pendingNote = null;
  function sendWaiting() { return sending || (pendingSend && (!batchValid() || busyFiles())); }
  function stopPending() {   // the check or the batch failed: Send can be pressed again
    pendingSend = false; pendingNote = null;
    var b = document.getElementById('send-btn');
    if (b && !sending) { b.disabled = false; b.textContent = 'Send To ' + centreOf(receivingCentre()).short + ' ›'; }
  }

  function drawCheck(q) {
    heading(q, 'Review and send', null);
    q.appendChild(copySheet({}));
    var check = batchValid() ? [] : [h('div', { class: 'bot-check', id: 'bot-check' }),
      h('p', { class: 'limits', id: 'limits', text: pendingSend && pendingNote ? pendingNote : 'Before Send, one more check that you are not a robot.' })];
    if (check.length) setTimeout(startBotCheck, 0);
    var c = centreOf(receivingCentre());
    var email = modeOf(receivingCentre()) === 'email';
    var waiting = sendWaiting();
    q.appendChild(h('div', { class: 'sendarea' }, [
      adviceFirst(),
      h('p', null, email ? ['Once sent, this referral cannot be changed here. To add to it later, contact the center directly.']
        : ['Once sent, this referral cannot be changed here. To add to it later, use ', h('a', { href: 'portal/', text: 'Your Referrals' }), '.'])]
      .concat(check, [
      h('div', { id: 'send-msg', 'aria-live': 'polite' }),
      h('button', { type: 'button', class: 'btn btn-navy', id: 'send-btn', disabled: waiting, on: { click: send } }, [waiting ? 'Sending…' : 'Send To ' + c.short + ' ›']),
      h('button', { type: 'button', class: 'btn btn-plain', on: { click: function () { go(nextIndex(S.step, -1)); } } }, ['‹ Back'])])));
  }

  function sendMessage(kids, bad) {
    var m = document.getElementById('send-msg');
    if (!m) return;
    m.textContent = '';
    if (kids) m.appendChild(h('div', { class: bad ? 'err-summary' : 'limits', role: bad ? 'alert' : null }, kids));
  }


  function send() {
    if (sending) return;
    // Every earlier step must be complete.
    for (var i = 0; i < STEP_IDS.length - 1; i++) {
      if (skipped(STEP_IDS[i])) continue;
      var errs = validate(STEP_IDS[i]);
      if (errs.length) { S.step = i; save(); setErrors(errs); return; }
    }
    if (!batchValid() || busyFiles()) {
      pendingSend = true;
      if (!batchValid()) { pendingNote = 'One more check that you are not a robot, then the referral is sent.'; renewBatch(); }
      else { render(); sendMessage(['Waiting for the files to finish uploading, then sending…']); }
      return;
    }
    pendingNote = null;
    var referral = buildReferral();
    var bytes = new TextEncoder().encode(JSON.stringify({ uploadId: S.batch.uploadId, referral: referral })).length;
    if (bytes > CFG.maxReferralBytes) { tooLong(); return; }
    var body = JSON.stringify(referral);   // the same answers keep their key, so a retry never sends twice (W-Q12)
    if (!S.send || S.send.body !== body) S.send = { key: uuid(), body: body };
    save();
    sending = true; render();
    post(referral, 0);
  }
  function post(referral, tries) {
    api('POST', '/v1/referrals', { uploadId: S.batch.uploadId, referral: referral }, { 'Idempotency-Key': S.send.key }).then(function (r) {
      if (r.status === 201) { sending = false; sent(r.body); return; }
      if (r.status === 429 && tries < 6) { sendMessage(['Sending…']); setTimeout(function () { post(referral, tries + 1); }, Math.max(1, r.retryAfter || 5) * 1000); return; }
      sending = false; render();
      if (r.status === 0) { sendMessage(['Your referral may not have been sent: the connection failed. Check your connection and press Send again; it will not arrive twice.'], true); return; }
      if (r.status === 400 && expired(r.body)) { pendingSend = true; pendingNote = 'The upload had expired. One more check that you are not a robot, then the files and the referral are sent again.'; renewBatch(); return; }
      if (r.status === 400 && r.body.error === 'invalid') { workerErrors(r.body.fields || []); return; }
      // Two refusals share 413: the files too large for a centre reached by email, and the answers too long (W-Q03)
      if (r.status === 413 && ((r.body.fields || [])[0] || {}).problem === 'too-large-for-email') {
        sendMessage([PROBLEMS['too-large-for-email'] + ' ', h('a', { href: '#', class: 'err-link', on: { click: function (ev) { ev.preventDefault(); go(STEP_IDS.indexOf('documents')); } } },
          ['Remove some at step 8, Documents ›']), ' Larger files can be sent to the center directly after Send.'], true);
        return;
      }
      if (r.status === 413) { tooLong(r.body.fields && r.body.fields[0] && r.body.fields[0].key); return; }
      if (r.status === 503 && r.body.error === 'daily-limit') { showDailyLimit(); return; }
      sendMessage(['The referral could not be sent just now. Please try again in a few minutes; it will not arrive twice.'], true);
    });
  }

  function tooLong(key) {
    var A = shownAnswers(), longest = key, len = 0;
    if (!longest) Object.keys(A).forEach(function (k) { if (typeof A[k] === 'string' && A[k].length > len) { len = A[k].length; longest = k; } });
    var q = findQuestion(longest);
    sendMessage(['This referral is too long to send in one piece. Please shorten ', h('strong', { text: q ? (q.labelHtml ? plain(q.label) : q.label) : longest }),
      ', and attach the full account as a file at step 8.'], true);
  }
  // Answers outside the questions' lists: their words, and their step (the overnight review's W-Q05)
  var OTHER_KEYS = {
    anythingElse: ['Anything Else RIAC Needs To Know?', 'documents'], rapSheetComplete: ['Does The RAP Sheet Include ALL Of Your Client’s Criminal History?', 'documents'],
    rapSheetMore: ['Criminal History Not On The RAP Sheet / Further Details', 'documents'], documents: ['Documents', 'documents'], uploadId: ['The files', 'documents'],
    people: ['Other people', 'people'], peopleNote: ['Anyone Involved Whose Name You Do Not Know', 'people'], noOtherPeople: ['Is Anyone Else Involved In This Case?', 'people'],
    county: ['County', 'county'], centre: ['Center', 'county'], outOfRegionReason: ['Center', 'county'], outOfRegionNote: ['About the conflict', 'county'],
    'Idempotency-Key': ['Sending', 'check'], formVersion: ['The form', 'check']
  };
  function findQuestion(key) {
    if (OTHER_KEYS[key]) return { label: OTHER_KEYS[key][0] };
    var found = null;
    ['county', 'about', 'court', 'client', 'immigration'].forEach(function (sid) { flat(D.STEPS[sid]).forEach(function (q) { if (q.key === key) found = found || q; }); });
    Object.keys(D.SECTIONS).forEach(function (s) { flat(D.SECTIONS[s]).forEach(function (q) { if (q.key === key) found = found || q; }); });
    return found;
  }

  // Draft wording for the worker's refusals; the owner has the last word on it (the error states, still to settle).
  var PROBLEMS = {
    required: 'This needs an answer.', missing: 'This section needs answers.', 'too-long': 'This answer is too long.', email: D.EMAIL_CHARS + '.',
    date: 'This is not a date.', 'not-listed': 'Choose this from the list, or tick Not Listed.', 'not-online': 'This center does not take referrals on this website yet.',
    'test-addresses-only': 'While the form is being tested, only a test email address can be used.', 'no-such-file': 'A file did not arrive. Please attach it again.',
    'too-large-for-email': 'The files are too large for this center, which receives referrals by email.', 'none-or-unknown-alone': 'None or Unknown cannot be ticked with other answers.'
  };
  function stepOfKey(key) {   // which step asks this answer, so a refusal can take the attorney to it
    if (OTHER_KEYS[key]) return STEP_IDS.indexOf(OTHER_KEYS[key][1]);
    var at = -1;
    ['county', 'about', 'court', 'client', 'immigration'].forEach(function (sid) { if (at < 0 && flat(D.STEPS[sid]).some(function (q) { return q.key === key; })) at = STEP_IDS.indexOf(sid); });
    if (at >= 0) return at;
    if (/^doc\./.test(key)) return STEP_IDS.indexOf('documents');
    if (/^(people|noOtherPeople|peopleNote)/.test(key)) return STEP_IDS.indexOf('people');
    if (/^(route\.|outOfRegionNote)/.test(key)) return 0;
    return STEP_IDS.indexOf('casetype');
  }
  function workerErrors(fields) {
    var items = fields.map(function (f) {
      f = { key: String(f.key).replace(/\[\d+\].*$/, ''), problem: f.problem };   // one charge of several: the question itself
      var q = findQuestion(f.key);
      var lab = q ? (q.labelHtml ? plain(q.label) : q.label) : f.key;
      var id = fid(f.key);
      return h('li', null, [h('a', { href: '#' + id, class: 'err-link', on: { click: function (ev) {
        ev.preventDefault();
        go(stepOfKey(f.key));
        var el = document.getElementById(id) || document.querySelector('#' + id + '-w input, #' + id + '-w textarea, #' + id + '-w select');
        if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
      } } }, [lab + ': ' + (PROBLEMS[f.problem] || 'This answer was not accepted (' + f.problem + ').')])]);
    });
    sendMessage([h('strong', { text: 'The center’s system did not accept the referral. Please change these answers and send again:' }), h('ul', null, items)], true);
  }

  function showDailyLimit() {   // RW5 1: the center's details and the PDFs, and the answers kept on screen to print or save
    var code = receivingCentre(), c = centreOf(code);
    app.textContent = '';
    var card = h('div', { class: 'result-card no-print' }, [h('h2', { text: 'Please send this referral to ' + c.name + ' directly' }),
      h('div', { class: 'inner' }, [h('p', { text: 'The website cannot take any more referrals for this center today. Please send it the intake form, with the case documents, by email or post. Your answers are below: print them or save them as a PDF to send with it.' })]
        .concat(c.blocks.map(contactBlock), [pdfButtons(), h('p'), h('button', { type: 'button', class: 'btn btn-plain', on: { click: function () { window.print(); } } }, ['Print Or Save As PDF'])]))]);
    app.appendChild(card);
    app.appendChild(copySheet({ sent: null, daily: true }));
  }

  // ---------- After Send (W1 1, W10 1, W30 1) -----------------------------------------------------------------------

  function sent(r) {
    var code = receivingCentre(), c = centreOf(code);
    var email = r.delivery === 'email';
    var sheetData = { reference: r.reference, sentAt: r.sentAt, receiptTo: r.receiptTo, delivery: r.delivery };
    var sheet = copySheet({ sent: sheetData });
    clearDraft();
    var head = document.getElementById('page-title'), lede = document.getElementById('page-lede');
    if (head) head.textContent = 'Referral Sent';
    if (lede) lede.textContent = 'Your referral has gone to your regional center. Below is the full copy of what you sent.';
    document.title = 'Referral Sent — RIAC';
    app.textContent = '';
    var facts = [h('dt', { text: 'Reference' }), h('dd', { text: r.reference }), h('dt', { text: 'Sent' }), h('dd', { text: fmtWhen(r.sentAt) })];
    if (r.receiptTo) {   // W48 1: where the receipt comes from, and Junk (a new sender's receipts were junked in the trial)
      var junk = D.RECEIPT_JUNK + (r.receiptFrom ? ', and mark it “Not junk”.' : '.');
      facts.push(h('dt', { text: 'Receipt' }), h('dd', null, ['emailed to ' + r.receiptTo,
        h('span', { class: 'receipt-note' }, r.receiptFrom ? ['It comes from ', h('strong', { text: r.receiptFrom }), '. ' + junk] : [junk])]));
    }
    var card = h('div', { class: 'sent-card' }, [h('h2', null, [h('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }), (email ? 'Emailed to ' : 'Sent to ') + c.short]),
      h('dl', { class: 'sent-facts' }, facts),
      h('div', { class: 'only-copy' }, [h('p', null, [h('strong', { text: 'This page is your only copy.' }), ' Nothing is kept on this website, so once you leave or close this page it cannot be shown again.']),
        h('button', { type: 'button', class: 'btn', on: { click: function () { window.print(); } } }, ['Print Or Save As PDF'])])]);
    if (email) {
      var b = c.blocks[0] || {};
      card.appendChild(h('p', { class: 'sent-note' }, ['This center receives referrals by email, so this one will not appear in Your Referrals. To add to it, or to ask where it stands, contact the center: ',
        b.phone ? h('a', { href: 'tel:' + b.tel, text: b.phone }) : '', b.ext ? ' ' + b.ext : '', b.phone ? ', ' : '', h('a', { href: 'mailto:' + b.email, text: b.email }), '.']));
    }
    app.appendChild(card);
    app.appendChild(sheet);
    printFooter(r.reference);
    S = fresh();
    Object.keys(FILES).forEach(function (k) { delete FILES[k]; });
    var hd = card.querySelector('h2'); if (hd) { hd.setAttribute('tabindex', '-1'); hd.focus(); }
  }
  function printFooter(ref) {   // W30 1: "Referral R2-…" at the foot of every printed page
    var sheet = Array.prototype.filter.call(document.styleSheets, function (s) { return s.href && /referral\.css/.test(s.href); })[0];
    if (!sheet) return;
    try {
      sheet.insertRule('@page { @bottom-left { content: "Referral ' + String(ref).replace(/[^A-Za-z0-9-]/g, '') + '"; font: 9pt Inter, sans-serif; color: #5b6878; } }', sheet.cssRules.length);
    } catch (e) { /* a browser without page margin boxes prints without the reference in the footer */ }
  }

  // ---------- Typing and choosing ------------------------------------------------------------------------------------

  app.addEventListener('input', function (e) {
    var t = e.target;
    var ew = t.closest('.err-empty');
    if (ew && t.value && t.value.trim() && t.type !== 'radio' && t.type !== 'checkbox') clearErr(ew);
    if (t.dataset.key && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && ['text', 'email', 'tel', 'search', 'date'].indexOf(t.type) !== -1))) {
      S.A[t.dataset.key] = t.value;
      var n = document.getElementById(t.id + '-n');
      if (n) n.textContent = nearLimit(t.value.length, parseInt(t.getAttribute('maxlength'), 10) || 6000);
      if (t.dataset.key === 'outOfRegionNote') S.A.outOfRegionNote = t.value;
      save();
    } else if (t.dataset.person) { S.adding[t.dataset.person] = t.value; save(); }
    else if (t.dataset.fnote) { var nf = docState(t.dataset.fkind).files.filter(function (x) { return x.id === t.dataset.fnote; })[0]; if (nf) { nf.note = t.value; save(); } }
    else if (t.dataset.docnote) { docState(t.dataset.docnote).note = t.value; save(); }
  });
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.route === 'county') {
      if (t.value === OUTSIDE) { S.route.outside = true; S.route.county = null; S.route.conflict = false; }
      else { S.route.outside = false; S.route.county = t.value || null; S.route.conflict = false; }
      S.route.centre = null;
      save(); render('f-county'); return;
    }
    if (t.dataset.route === 'centre') { S.route.centre = t.value; save(); render(t.id); return; }
    if (t.dataset.file) { addFiles(t.dataset.file, t.files); return; }
    if (t.dataset.doc) { docState(t.dataset.doc).status = t.value; save(); render(t.id); if (t.value === 'attached') pump(); return; }
    if (t.dataset.person === 'role' || t.dataset.person === 'dob') {
      S.adding[t.dataset.person] = t.value; save();
      var ew = t.closest('.err-empty'); if (ew && t.value) clearErr(ew);
      return;
    }
    if (!t.dataset.key) return;
    var k = t.dataset.key;
    if (t.dataset.ticks) {
      var v = Array.isArray(S.A[k]) ? S.A[k].slice() : [];
      if (t.checked) {
        if (t.value === 'none' || t.value === 'unknown') v = [t.value];
        else { v = v.filter(function (c) { return c !== 'none' && c !== 'unknown'; }); v.push(t.value); }
      } else v = v.filter(function (c) { return c !== t.value; });
      S.A[k] = v;
    } else if (t.type === 'checkbox') { S.A[k] = t.checked; if (k === 'court.iceInvolvement') S.iceAuto = false; }
    else if (t.type === 'radio') {
      if (k === 'case.caseType' && S.A[k] && S.A[k] !== t.value) S.visited = Math.min(S.visited, S.step);   // W-Q07
      S.A[k] = t.value;
      if (k === 'court.custody' && t.value === 'ice-detained' && S.A['court.iceInvolvement'] !== true) { S.A['court.iceInvolvement'] = true; S.iceAuto = true; }
      else if (k === 'court.custody' && t.value !== 'ice-detained' && S.iceAuto) { S.A['court.iceInvolvement'] = false; S.iceAuto = false; }
    }
    else { S.A[k] = t.value; save(); return; }   // text boxes: nothing to redraw
    save();
    render(t.id);
  });

  window.addEventListener('beforeunload', function (e) {
    if (Object.keys(XHRS).length) { e.preventDefault(); e.returnValue = ''; }
  });

  // ---------- Start ------------------------------------------------------------------------------------------------

  render();
  api('GET', '/v1/lists').then(function (r) {
    if (r.status !== 200 || !r.body.counties) {
      app.textContent = '';
      app.appendChild(h('div', { class: 'result-card' }, [h('h2', { text: 'The form cannot load just now' }), h('div', { class: 'inner' }, [
        h('p', { text: 'Please try again in a few minutes, or send your regional center the intake form instead.' }), pdfButtons(),
        h('p'), h('a', { href: 'contact.html', text: 'Find your RIAC ›' })])]));
      return;
    }
    LISTS = r.body;
    LISTS.courts = LISTS.courts || {};
    LISTS.offices = LISTS.offices || [];
    if (S.batch && !batchValid()) S.batch = null;
    render();
  });
})();
