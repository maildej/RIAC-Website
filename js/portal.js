// The attorney portal (portal/index.html and portal/add.html): sign in by an emailed link, see your referrals, and add
// documents or information to one. The owner's decisions are W4 1, W5 1 ("W5 yes"), W6 1, W58 1, W59 A and W61 a with
// W80 1 in CLAUDE.md.
// The session is kept in this tab only (sessionStorage); the worker ends it after 12 hours at most.
(function () {
  'use strict';

  var D = window.RIAC_REF;
  var CFG = D.CONFIG;
  var app = document.getElementById('portal-app');
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
  var PAGE = app.getAttribute('data-page');
  var SECRET_KEY = 'riac-portal-secret';
  var SESSION_KEY = 'riac_portal';
  var turnstileId = null;

  // ---------- Helpers ------------------------------------------------------------------------------------------------

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
      else if (k === 'value') el.value = v;
      else if (k === 'disabled' || k === 'open') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function symbol(name) {   // one of the site's symbols (images/symbols.svg), for the eye only
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg'), use = document.createElementNS(NS, 'use');
    use.setAttribute('href', '../images/symbols.svg#' + name);
    svg.appendChild(use);
    return h('span', { class: 'tile-sym', 'aria-hidden': 'true' }, [svg]);
  }
  function clear() {
    if (turnstileId !== null && window.turnstile) { try { window.turnstile.remove(turnstileId); } catch (e) { /* gone */ } turnstileId = null; }
    app.textContent = '';
  }
  function fmtDay(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(p[1], 10) - 1];
    return m + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }
  function fmtWhen(iso) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso)); }
    catch (e) { return iso; }
  }
  function fmtBytes(n) { if (n >= 1048576) { var m = n / 1048576; return (Math.abs(m - Math.round(m)) < 0.05 ? String(Math.round(m)) : m.toFixed(1)) + ' MB'; } return Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var x = Array.prototype.map.call(b, function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
    return x.slice(0, 8) + '-' + x.slice(8, 12) + '-' + x.slice(12, 16) + '-' + x.slice(16, 20) + '-' + x.slice(20);
  }

  // ---------- The session ------------------------------------------------------------------------------------------

  // Security review CS5, finding 8: the session is kept in this tab only (sessionStorage), never in a cookie, so it
  // is sent nowhere and ends when the tab closes. A portal page opened in a new tab asks to sign in again.
  function session() { try { return sessionStorage.getItem(SESSION_KEY); } catch (e) { return null; } }
  function setSession(v) { try { sessionStorage.setItem(SESSION_KEY, v); } catch (e) { /* storage blocked: the page asks to sign in */ } }
  function endSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* nothing kept */ } }
  // Until 20 October 2026 the session was a cookie: clear any left behind.
  document.cookie = SESSION_KEY + '=; Path=/portal/; SameSite=Strict; Max-Age=0' + (location.protocol === 'https:' ? '; Secure' : '');

  function api(method, path, body, headers) {
    var hd = body ? { 'Content-Type': 'application/json' } : {};
    var s = session();
    if (s) hd.Authorization = 'Bearer ' + s;
    Object.keys(headers || {}).forEach(function (k) { hd[k] = headers[k]; });
    return fetch(CFG.worker + path, { method: method, headers: hd, body: body ? JSON.stringify(body) : undefined, credentials: 'omit', mode: 'cors' })
      .then(function (res) {
        return res.text().then(function (t) {
          var b = {}; try { b = t ? JSON.parse(t) : {}; } catch (e) { b = {}; }
          if (res.status === 401 && b.error === 'signed-out') { endSession(); }
          return { status: res.status, body: b, retryAfter: parseInt(res.headers.get('Retry-After') || '0', 10) };
        });
      }, function () { return { status: 0, body: {} }; });
  }

  function randomSecret() {
    var b = new Uint8Array(32); crypto.getRandomValues(b);
    return btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function sha256hex(s) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (n) { return ('0' + n.toString(16)).slice(-2); }).join('');
    });
  }
  function loadTurnstile(cb) {
    if (window.turnstile) { cb(); return; }
    var s = document.getElementById('cf-turnstile-js');
    if (!s) {
      s = document.createElement('script');
      s.id = 'cf-turnstile-js';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener('load', function () { cb(); });
  }

  // ---------- Sign in (W4 1) -----------------------------------------------------------------------------------------

  function signInCard(email, message) {
    clear();
    var token = null;
    var input = h('input', { type: 'email', id: 'si-email', autocomplete: 'email', maxlength: '254', value: email || '' });
    var msg = h('p', { class: 'field-err', id: 'si-msg', role: 'alert', text: message || '' });
    var bot = h('div', { class: 'bot-check', id: 'bot-check' });
    var btn = h('button', { type: 'button', class: 'btn btn-navy', on: { click: ask } }, ['Email Me A Sign-In Link']);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(); });
    var card = h('div', { class: 'sign-card ref-q' }, [h('h2', { text: 'Sign in' }),
      h('div', { class: 'field' }, [h('label', { for: 'si-email', text: 'Your email address' }),
        h('span', { class: 'desc', text: 'Use the email address you put on your referrals.' }), input]),   // W53 1
      bot, msg, btn,
      h('p', { class: 'small', text: 'No password needed. We’ll email you a sign-in link: open it on this device, in this same browser, within 15 minutes. Each link works once.' })]);
    app.appendChild(card);
    app.appendChild(h('p', { class: 'under-card' }, ['Not sent us a case yet? ', h('a', { href: '../referral.html', text: 'Send Us A New Case ›' })]));
    var botFailed = false;   // W46 1: the check failed (not merely unfinished), so say so rather than "please wait"
    loadTurnstile(function () {
      if (!document.getElementById('bot-check')) return;
      turnstileId = window.turnstile.render('#bot-check', { sitekey: CFG.turnstileKey, theme: 'light', callback: function (t) { token = t; botFailed = false; },
        'expired-callback': function () { token = null; },
        'error-callback': function () { token = null; botFailed = true; msg.textContent = D.BOT_CHECK_FAILED; } });
    });
    function ask() {
      var e = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { msg.textContent = 'Please enter your email address, like name@example.org.'; input.focus(); return; }
      if (!token) { msg.textContent = botFailed ? D.BOT_CHECK_FAILED : 'Please wait for the check that you are not a robot to finish, then press the button again.'; return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      var secret = randomSecret();
      try { localStorage.setItem(SECRET_KEY, secret); } catch (x) { /* a browser that blocks storage cannot sign in */ }
      sha256hex(secret).then(function (proof) {
        return api('POST', '/v1/portal/sign-in', { email: e, turnstile: token, browserProof: proof });
      }).then(function (r) {
        if (r.status === 202) { checkEmail(e); return; }
        btn.disabled = false; btn.textContent = 'Email Me A Sign-In Link';
        if (r.status === 429) msg.textContent = 'Too many sign-in requests from here. Please wait a few minutes and try again.';
        else if (r.status === 403) msg.textContent = 'The check that you are not a robot did not pass. Please reload the page and try again.';
        else msg.textContent = 'The link could not be sent just now. Please try again in a few minutes.';
        if (window.turnstile && turnstileId !== null) { window.turnstile.reset(turnstileId); token = null; }
      });
    }
  }

  function checkEmail(email) {
    clear();
    app.appendChild(h('div', { class: 'sign-card ref-q' }, [h('h2', { text: 'Check your email' }),
      h('p', null, ['If ', h('strong', { text: email }), ' can see referrals, an email from ', h('strong', { text: 'portal@nyriac.com' }), ' is on its way with your sign-in link.']),
      h('p', { class: 'tinted' }, [h('strong', { text: 'Open the link on this device, in this browser.' }), ' It will not work anywhere else, so that a forwarded email lets nobody in.']),
      h('p', { class: 'small', text: 'It works once, within 15 minutes. Nothing after a few minutes? Look in your junk folder, or send another.' }),
      h('button', { type: 'button', class: 'btn btn-navy', on: { click: function () { signInCard(email); } } }, ['Send Another Link']),
      h('button', { type: 'button', class: 'btn btn-plain', on: { click: function () { signInCard(''); } } }, ['Use A Different Email Address'])]));
  }

  function linkInvalid() {
    clear();
    app.appendChild(h('div', { class: 'sign-card ref-q' }, [h('h2', { text: 'This sign-in link cannot be used' }),
      h('p', { text: 'It has been used already, it is more than 15 minutes old, or it was opened in a different browser from the one that asked for it.' }),
      h('p', { class: 'small', text: 'Ask for a new link in the browser you will use, then open the email on the same device.' }),
      h('button', { type: 'button', class: 'btn btn-navy', on: { click: function () { signInCard(''); } } }, ['Email Me A New Link'])]));
  }

  // The link from the email: https://nyriac.com/portal/#t=<token>
  function fromLink() {
    var m = location.hash.match(/^#t=([A-Za-z0-9_-]+)$/);
    if (!m) return false;
    history.replaceState(null, '', location.pathname);
    var secret = null;
    try { secret = localStorage.getItem(SECRET_KEY); } catch (e) { /* none */ }
    app.textContent = '';
    app.appendChild(h('p', { class: 'under-card', text: 'Signing you in…' }));
    if (!secret) { linkInvalid(); return true; }
    api('POST', '/v1/portal/session', { token: m[1], browserSecret: secret }).then(function (r) {
      try { localStorage.removeItem(SECRET_KEY); } catch (e) { /* none */ }
      if (r.status === 200 && r.body.session) { setSession(r.body.session); list(); }
      else linkInvalid();
    });
    return true;
  }

  // ---------- The list (W5 1, "W5 yes") ----------------------------------------------------------------------------------

  function statusPill(r) {   // a tinted box with a coloured left edge (W58 1): orange when waiting on you, grey when closed
    var g = groupOf(r);
    return h('span', { class: 'status' + (g === 'you' ? ' waiting' : g === 'closed' ? ' closed' : ''), text: (r.isOpen ? '' : 'Closed: ') + (r.status || '') });
  }
  function marked(text, term) {   // the text, with each match of the search term marked (as text, never as HTML)
    var frag = document.createDocumentFragment();
    text = text || '';
    if (!term) { frag.appendChild(document.createTextNode(text)); return frag; }
    var lower = text.toLowerCase(), t = term.toLowerCase(), i = 0, j;
    while ((j = lower.indexOf(t, i)) !== -1) {
      if (j > i) frag.appendChild(document.createTextNode(text.slice(i, j)));
      frag.appendChild(h('mark', { text: text.slice(j, j + t.length) }));
      i = j + t.length;
    }
    if (i < text.length) frag.appendChild(document.createTextNode(text.slice(i)));
    return frag;
  }
  // W74 a: a referral keyed in at RIAC may hold no client name; the card says so rather than starting at Reference
  function clientName(r, term) {
    return r.clientName ? h('div', { class: 'cl' }, [marked(r.clientName, term)]) : h('div', { class: 'cl none', text: 'Client name not recorded' });
  }
  function matches(r, term, staff) {
    if (!term) return true;
    term = term.toLowerCase();
    if ([r.clientName, r.court, r.docket, r.reference, r.caseNumber, staff ? r.attorneyName : null].some(function (v) { return v && String(v).toLowerCase().indexOf(term) !== -1; })) return true;
    // A reference ends in six digits (contract draft 14): read a typed O as 0 and I or L as 1, as the worker does.
    return !!r.reference && String(r.reference).toLowerCase().indexOf(term.replace(/o/g, '0').replace(/[il]/g, '1')) !== -1;
  }
  // W58 1 (22 October 2026): every referral is in one of four groups. A closed one is Closed; an open one is Waiting on
  // you if it needs something from the attorney (the worker's waitingOnYou, contract draft 20; until that is sent, the
  // status that says so), otherwise Case open once RIAC has opened a case, and Received before then.
  var GROUPS = [['received', 'Received'], ['you', 'Waiting on you'], ['case', 'Case open'], ['closed', 'Closed']];
  var SORTS = [['status', 'Status'], ['newest', 'Newest first'], ['oldest', 'Oldest first'], ['client', 'Client name']];
  var VIEW_KEY = 'riac-portal-view';
  function groupOf(r) {
    if (!r.isOpen) return 'closed';
    if (typeof r.waitingOnYou === 'boolean' ? r.waitingOnYou : /waiting for documents/i.test(r.status || '')) return 'you';
    return r.caseNumber ? 'case' : 'received';
  }
  var byName = window.Intl && Intl.Collator ? new Intl.Collator('en', { sensitivity: 'base' }).compare : function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  var SORT_BY = {
    newest: function (a, b) { return (b.receivedOn || '').localeCompare(a.receivedOn || ''); },
    oldest: function (a, b) { return (a.receivedOn || '').localeCompare(b.receivedOn || ''); },
    client: function (a, b) { return byName(a.clientName || '', b.clientName || '') || SORT_BY.newest(a, b); }
  };
  // The view chosen is kept in this tab, so Back from Send RIAC An Update finds the list as it was left.
  function keptView() {
    var v = {};
    try { v = JSON.parse(sessionStorage.getItem(VIEW_KEY) || '{}') || {}; } catch (e) { /* none kept */ }
    var known = function (list, x) { return list.some(function (g) { return g[0] === x; }); };
    return { show: v.show === 'all' || known(GROUPS, v.show) ? v.show : 'all', sort: known(SORTS, v.sort) ? v.sort : 'status' };
  }
  function keepView(v) { try { sessionStorage.setItem(VIEW_KEY, JSON.stringify(v)); } catch (e) { /* storage blocked: not kept */ } }

  function table(rows, term, staff, head) {
    var tb = h('tbody');
    rows.forEach(function (r) {
      // W69 (the owner): under the client's name, each label with its value beside it, lined up from card to card. The
      // date received is one of them, so the court and docket, one over the other, have the room its column had. W84 2b:
      // once a case is open its number leads, and the reference is the quiet "Intake Reference:" row under it.
      var facts = h('dl', { class: 'kv' });
      var fact = function (k, v, cls) { facts.appendChild(h('dt', { class: cls, text: k })); facts.appendChild(h('dd', { class: cls }, [v])); };
      if (r.caseNumber) {
        fact('RIAC Case No:', h('span', { class: 'case-no' }, [marked(String(r.caseNumber), term)]));
        fact('Intake Reference:', marked(r.reference, term), 'was');
      } else fact('Reference:', h('span', { class: 'ref-pill' }, [marked(r.reference, term)]));
      fact('Received:', fmtDay(r.receivedOn));
      if (r.closedOn) fact('Closed:', fmtDay(r.closedOn));
      var client = h('td', null, [clientName(r, term), facts,
        staff && r.attorneyName ? h('div', { class: 'sub' }, ['Attorney: ', marked(r.attorneyName, term)]) : null]);
      var court = h('td', null, [h('div', null, [marked(r.court, term)]), h('div', { class: 'sub' }, [marked(r.docket, term)])]);
      tb.appendChild(h('tr', null, [client, court, h('td', null, [statusPill(r)]),
        h('td', { class: 'act' }, [h('a', { class: 'btn btn-plain', href: 'add.html#' + encodeURIComponent(r.reference), text: 'Send RIAC An Update' })])]));
    });
    return h('table', { class: 'ref-table' }, [head ? h('thead', null, [h('tr', null, ['Client', 'Court', 'Status', ''].map(function (t) {
      return h('th', { scope: 'col', text: t });
    }))]) : null, tb]);
  }

  function list() {
    if (!session()) { signInCard(''); return; }
    clear();
    app.appendChild(h('p', { class: 'under-card', text: 'Loading your referrals…' }));
    api('GET', '/v1/portal/referrals').then(function (r) {
      if (r.status === 401) { signInCard('', 'You have been signed out. Please sign in again.'); return; }
      if (r.status !== 200) { clear(); app.appendChild(h('div', { class: 'empty-note', text: 'Your referrals cannot be shown just now. Please try again in a few minutes.' })); return; }
      drawList(r.body);
    });
  }

  function drawList(data) {
    clear();
    var me = data.me || {};
    // Each row's attorney is named for office staff signing in for an attorney, which is not built yet: until then the
    // worker cannot tell staff from the attorney (isAttorney is always false), so the line stays off (W69).
    var staff = false;
    // W65 A: three short lines. The name (until the worker can supply one, the address) and Sign Out; the office, email
    // and phone; how long the sign-in lasts.
    var name = me.name ? me.name + (me.isAttorney ? ', Esq.' : '') : data.email;
    var card = h('div', { class: 'me-card' }, [h('div', { class: 'top' }, [h('div', { class: 'who', text: name }),
      h('button', { type: 'button', class: 'btn btn-plain', on: { click: signOut } }, ['Sign Out'])])]);
    var contact = (me.name ? [me.email || data.email, me.phone] : [me.phone]).filter(Boolean).join(' · ');
    if (me.office || contact) card.appendChild(h('div', { class: 'line' }, [me.office ? h('b', { text: me.office }) : null, me.office && contact ? ' · ' : null, contact]));
    card.appendChild(h('p', { class: 'notes', text: 'You stay signed in until you close this tab, or for 12 hours at most.' }));
    app.appendChild(card);

    // W58 1: the search and Sort on one line (Sort over the list's last column), then five buttons of one size, All and
    // the four groups, each with its count (of the matches while searching). Sorted by Status, All shows the four groups
    // as their own headings, Closed folded; any other sort shows one list, each status on its row.
    var view = keptView();
    var search = h('input', { type: 'search', id: 'ref-search', 'aria-label': 'Search your referrals by name, court, referral reference or docket number' });
    // The owner's wording; on a phone it does not fit the box, so a shorter form there, and shorter again on the smallest.
    var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
    var narrow = mq('(max-width: 600px)'), tiny = mq('(max-width: 380px)');
    var hint = function () {
      search.placeholder = tiny.matches ? 'Name, court, reference, docket' : narrow.matches ? 'Search: name, court, reference or docket'
        : 'Search by name, court, referral reference or docket number';
    };
    hint();
    [narrow, tiny].forEach(function (m) { if (m.addEventListener) m.addEventListener('change', hint); });
    var sortSel = h('select', { id: 'ref-sort', 'aria-label': 'Sort your referrals' });
    app.appendChild(h('div', { class: 'list-head' }, [h('h2', { text: 'RIAC Referrals:' }), search, sortSel]));
    var buttons = [['all', 'All']].concat(GROUPS).map(function (g) {
      var input = h('input', { type: 'radio', name: 'ref-show', value: g[0] });
      var count = h('span', { class: 'count' });
      input.addEventListener('change', function () { view.show = g[0]; keepView(view); draw(); });
      return { id: g[0], input: input, count: count, label: h('label', { class: 'pill' + (g[0] === 'all' ? ' all' : '') }, [input, h('span', null, [g[1] + ' ', count])]) };
    });
    app.appendChild(h('div', { class: 'list-show', role: 'radiogroup', 'aria-label': 'Show' }, buttons.map(function (b) { return b.label; })));
    app.appendChild(h('p', { class: 'list-note', text: 'A referral sent in the last few minutes may take a little while to appear here.' }));
    var area = h('div', { 'aria-live': 'polite' });
    app.appendChild(area);
    app.appendChild(h('p', { class: 'under-card' }, ['Sending a new one? ', h('a', { href: '../referral.html', text: 'Send Us A New Case ›' })]));

    var all = (data.referrals || []).slice();
    function draw() {
      var term = search.value.trim();
      var hits = all.filter(function (r) { return matches(r, term, staff); });
      var inGroup = function (rows, g) { return rows.filter(function (r) { return g === 'all' || groupOf(r) === g; }); };
      buttons.forEach(function (b) { b.input.checked = b.id === view.show; b.count.textContent = String(inGroup(hits, b.id).length); });
      // Status sorts into the groups, so it is offered under All only; within one group it reads as Newest first.
      var by = view.show !== 'all' && view.sort === 'status' ? 'newest' : view.sort;
      sortSel.textContent = '';
      SORTS.forEach(function (s) { if (s[0] !== 'status' || view.show === 'all') sortSel.appendChild(h('option', { value: s[0], text: 'Sort: ' + s[1] })); });
      sortSel.value = by;
      area.textContent = '';
      var none = term ? 'No referral' + (view.show === 'all' ? '' : ' here') + ' matches “' + term + '”.'
        : !all.length ? 'You have no referrals here yet.' : view.show === 'you' ? 'Nothing is waiting on you.' : 'None at the moment.';
      if (view.show === 'all' && by === 'status') {
        GROUPS.forEach(function (g) {
          var rows = inGroup(hits, g[0]).sort(SORT_BY.newest);
          if (!rows.length) return;
          var total = inGroup(all, g[0]).length;
          area.appendChild(h('details', { class: 'ref-group ' + g[0], open: g[0] !== 'closed' || !!term }, [h('summary', null, [g[1] + ' ',
            h('span', { text: term ? '(' + rows.length + ' of ' + total + ' match' + (rows.length === 1 ? 'es' : '') + ')' : '(' + rows.length + ')' })]),
            table(rows, term, staff, !area.childNodes.length)]));
        });
        if (!area.childNodes.length) area.appendChild(h('div', { class: 'empty-note', text: none }));
        return;
      }
      var rows = inGroup(hits, view.show).sort(SORT_BY[by]);
      area.appendChild(rows.length ? table(rows, term, staff, true) : h('div', { class: 'empty-note', text: none }));
    }
    sortSel.addEventListener('change', function () { view.sort = sortSel.value; keepView(view); draw(); });
    search.addEventListener('input', draw);
    draw();
  }

  function signOut() {
    api('POST', '/v1/portal/sign-out').then(function () { endSession(); signInCard('', 'You are signed out.'); });
  }

  // ---------- Send RIAC An Update (W6 1, once Add To This Referral; W59 A) -------------------------------------------------

  var KINDS = ['rap-sheet', 'charging-documents', 'immigration-documents'];
  var A = { batch: null, files: {}, list: [], pumping: false, key: null, sending: false, about: 'message', kinds: [] };
  function aboutOf(code) { return D.UPDATE_ABOUT.filter(function (a) { return a.code === code; })[0] || D.UPDATE_ABOUT[0]; }

  // W61 a: what RIAC has of each kind of document for this referral (contract draft 22), a kind or state the page does
  // not know ignored. W80 1: a kind RIAC lists that has no box here gets one, in the referral's order; Something else last.
  function knownDocs(r) {
    return (Array.isArray(r.documents) ? r.documents : []).filter(function (d) { return d && d.kind !== 'other' && D.DOCS[d.kind] && D.DOC_STATES[d.state]; });
  }
  function kindsFor(r) {
    var listed = knownDocs(r).map(function (d) { return d.kind; });
    return Object.keys(D.DOCS).filter(function (k) { return k !== 'other' && (KINDS.indexOf(k) !== -1 || listed.indexOf(k) !== -1); }).concat('other');
  }
  function shortDay(iso) {   // "Oct 20"; the year too when it is not this year's
    return iso.slice(0, 4) === String(new Date().getFullYear()) ? fmtDay(iso).replace(/, \d{4}$/, '') : fmtDay(iso);
  }
  function docState(r, kind) {
    var d = knownDocs(r).filter(function (x) { return x.kind === kind; })[0];
    if (!d) return null;
    var s = D.DOC_STATES[d.state], day = /^\d{4}-\d{2}-\d{2}$/.test(d.on || '') ? shortDay(d.on) : '';
    return h('span', { class: 'doc-state' + (s.tone ? ' ' + s.tone : '') }, [h('span', null, [s.tick ? h('span', { 'aria-hidden': 'true', text: '✓ ' }) : null,
      s.text + (d.state === 'received' && day ? ' ' + day : '')]), d.state === 'needed' && day ? h('span', { class: 'also', text: s.also + ' ' + day }) : null]);
  }

  function addPage() {
    if (!session()) { location.replace('./'); return; }
    var ref = decodeURIComponent(location.hash.slice(1));
    clear();
    app.appendChild(h('p', { class: 'under-card', text: 'Loading…' }));
    api('GET', '/v1/portal/referrals').then(function (r) {
      if (r.status === 401) { location.replace('./'); return; }
      var found = r.status === 200 && (r.body.referrals || []).filter(function (x) { return x.reference === ref; })[0];
      clear();
      app.appendChild(h('a', { class: 'back-link', href: './', text: '‹ Back To Your Referrals' }));
      if (!found) { app.appendChild(h('div', { class: 'empty-note', text: 'This referral is not in your list. Go back to Your Referrals and choose it there.' })); return; }
      drawAdd(found);
      api('POST', '/v1/uploads', {}).then(function (b) {
        if (b.status === 201) { A.batch = b.body; showLimits(); pump(); }
        else setLimits('Files cannot be added just now. You can still send a message.');
      });
    });
  }

  function which(r) {   // the referral, its status in a column of its own (full width on a phone: the owner's rule, W58 1)
    var where = [r.court, r.docket].filter(Boolean);
    // W84 2b: once a case is open its number leads, and the reference moves to a quiet line beneath
    var info = r.caseNumber
      ? [h('div', { class: 'sub' }, [h('span', { class: 'case-line', text: 'RIAC Case No ' + r.caseNumber }), where.length ? ' · ' + where.join(' · ') : null]),
        h('div', { class: 'was-ref', text: 'Intake Reference ' + r.reference })]
      : [h('div', { class: 'sub', text: ['Reference ' + r.reference].concat(where).join(' · ') })];
    return h('div', { class: 'which' }, [h('div', null, [clientName(r)].concat(info)), statusPill(r)]);
  }
  function setLimits(t) { var el = document.getElementById('add-limits'); if (el) el.textContent = t; }
  function showLimits() {
    setLimits('Up to ' + A.batch.maxFiles + ' files, ' + fmtBytes(A.batch.maxFileBytes) + ' each, ' + fmtBytes(A.batch.maxTotalBytes) + ' in all — PDF, Word (.docx), JPEG, PNG or HEIC.');
  }

  // W59 A, W83 1: a note to RIAC unless the attorney ticks "Report an offer" or "Report a disposition" (one at most: one
  // update is filed as one kind at RIAC), above the box; the box's question follows the tick. Documents follow.
  function drawAdd(r) {
    var ticks = D.UPDATE_ABOUT.filter(function (a) { return a.code !== 'message' && CFG.updateKinds.indexOf(a.code) !== -1; });
    A.about = 'message';
    var msg = h('textarea', { id: 'add-message', maxlength: '6000', rows: '4' });
    var near = h('p', { class: 'near-limit', 'aria-live': 'polite' });
    msg.addEventListener('input', function () {
      var n = msg.value.length;
      near.textContent = n >= 5000 ? n.toLocaleString('en-US') + ' of 6,000 characters. A longer account can be attached as a file.' : '';
      if (n) { msgField.classList.remove('has-err'); msg.removeAttribute('aria-invalid'); }
    });
    var label = h('label', { for: 'add-message', text: aboutOf('message').box });
    var msgField = h('div', { class: 'field', id: 'add-message-field' }, [label, msg, near]);
    var inputs = [];
    // W87 2b: each tile's symbol and words centred on it, the tick as far from its left as from its top and bottom
    var about = !ticks.length ? null : h('div', { class: 'field' }, [h('fieldset', { class: 'plain-fieldset' }, [
      h('legend', { class: 'visually-hidden', text: 'Does this update report an offer or a disposition? Tick one, or neither for a note.' }),
      h('div', { class: 'about-ticks' }, ticks.map(function (a) {
        var input = h('input', { type: 'checkbox', name: 'add-about', value: a.code });
        inputs.push(input);
        input.addEventListener('change', function () {
          inputs.forEach(function (o) { if (o !== input) o.checked = false; });
          A.about = input.checked ? a.code : 'message';
          label.textContent = aboutOf(A.about).box;
          msgField.classList.remove('has-err'); msg.removeAttribute('aria-invalid');
        });
        return h('label', { class: 'tile' }, [input, h('span', { class: 'box', 'aria-hidden': 'true' }), h('span', { class: 'mid' }, [symbol(a.sym), h('span', { text: a.tile })])]);
      }))])]);
    var docs = h('div');
    A.kinds = kindsFor(r);
    A.kinds.forEach(function (kind) { docs.appendChild(docRow(kind, r)); });
    var err = h('div', { id: 'add-err', role: 'alert' });
    var sendBtn = h('button', { type: 'button', class: 'btn btn-navy', id: 'add-send', on: { click: function () { sendAddition(r); } } }, ['Send To RIAC']);
    var card = h('div', { class: 'add-card' }, [h('h2', { text: 'Send RIAC an update' }), h('div', { class: 'inner ref-q' }, [which(r), about, msgField,
      h('div', { class: 'docs-head' }, [h('span', { class: 'lab', text: 'Documents' }), ' ', h('span', { class: 'opt', text: '(optional)' })]),
      Array.isArray(r.documents) ? h('p', { class: 'doc-key', text: D.DOC_STATES_NOTE }) : null,
      h('p', { class: 'limits', id: 'add-limits', text: 'Checking the file limits…' }), docs, err,
      h('div', { class: 'add-actions' }, [h('a', { class: 'btn btn-plain', href: './', text: 'Cancel' }), sendBtn])])]);
    app.appendChild(card);
  }

  function docRow(kind, r) {
    var info = kind === 'other' ? { name: 'Something else' } : D.DOCS[kind];
    var id = 'a-' + kind;
    var input = h('input', { type: 'file', multiple: true, class: 'visually-hidden', id: id + '-file', accept: '.pdf,.docx,.jpg,.jpeg,.png,.heic,application/pdf,image/jpeg,image/png,image/heic' });
    input.addEventListener('change', function () { addFiles(kind, input.files); input.value = ''; });
    var right = h('div', { id: id + '-files' }, [kind === 'other' ? null : docState(r, kind)]);
    var row = h('div', { class: 'add-doc', id: id }, [h('span', { class: 'nm', text: info.name }), right, h('label', { class: 'btn btn-plain', for: id + '-file', text: 'Choose Files' }), input]);
    if (kind === 'other') {
      right.appendChild(h('div', { class: 'field other-what' }, [h('label', { for: 'a-other-note', text: 'What is it?' }),
        h('input', { type: 'text', id: 'a-other-note', maxlength: '200', placeholder: 'One line: it becomes RIAC’s description of the document' })]));
    }
    return row;
  }
  function addFiles(kind, files) {
    Array.prototype.forEach.call(files, function (file) {
      var id = uuid();
      A.files[id] = file;
      A.list.push({ id: id, kind: kind, name: file.name, size: file.size, state: 'queued', pct: 0, fileId: null, error: '' });
    });
    drawFiles(); pump();
  }
  function drawFiles() {
    A.kinds.forEach(function (kind) {
      var holder = document.getElementById('a-' + kind + '-files');
      if (!holder) return;
      var old = holder.querySelector('.files'); if (old) old.remove();
      var mine = A.list.filter(function (f) { return f.kind === kind; });
      // Beside a state (W61 a), "None chosen" says nothing more, so it is left out (W80 1)
      if (!mine.length) { if (kind !== 'other' && !holder.querySelector('.sub, .doc-state')) holder.appendChild(h('span', { class: 'sub drop-note', text: 'None chosen' })); return; }
      var none = holder.querySelector('.sub'); if (none) none.remove();
      holder.appendChild(h('ul', { class: 'files' }, mine.map(function (f) {
        var st;
        if (f.state === 'done') st = h('span', { class: 'fstate ok', text: '✓ Uploaded' });
        else if (f.state === 'failed') st = h('span', { class: 'fstate bad', text: f.error || 'Did not upload' });
        else { var bar = h('span'); bar.style.width = (f.pct || 0) + '%'; st = h('span', { class: 'fstate' }, [h('span', { class: 'bar', 'aria-hidden': 'true' }, [bar]), ' ' + (f.pct || 0) + '%']); }
        return h('li', null, [h('span', { class: 'fname', text: f.name }), h('span', { class: 'fsize', text: fmtBytes(f.size) }), st,
          h('button', { type: 'button', class: 'link-btn', on: { click: function () { A.list = A.list.filter(function (x) { return x.id !== f.id; }); delete A.files[f.id]; drawFiles(); } } }, ['Remove'])]);
      })));
    });
  }
  function pump() {
    if (A.pumping || !A.batch) return;
    var f = A.list.filter(function (x) { return x.state === 'queued'; })[0];
    if (!f) return;
    var file = A.files[f.id];
    var done = A.list.filter(function (x) { return x.state === 'done'; });
    var total = done.reduce(function (n, x) { return n + x.size; }, 0);
    if (file.size > A.batch.maxFileBytes) { f.state = 'failed'; f.error = 'Over the ' + fmtBytes(A.batch.maxFileBytes) + ' limit for one file.'; drawFiles(); pump(); return; }
    if (done.length >= A.batch.maxFiles || total + file.size > A.batch.maxTotalBytes) { f.state = 'failed'; f.error = 'Over the limit for files in all.'; drawFiles(); pump(); return; }
    A.pumping = true; f.state = 'uploading';
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', CFG.worker + '/v1/uploads/' + encodeURIComponent(A.batch.uploadId) + '/files');
    xhr.setRequestHeader('Authorization', 'Bearer ' + session());
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) { f.pct = Math.round(e.loaded / e.total * 100); drawFiles(); } };
    xhr.onload = function () {
      A.pumping = false;
      var b = {}; try { b = JSON.parse(xhr.responseText || '{}'); } catch (e) { /* */ }
      if (xhr.status === 201 && b.fileId) { f.state = 'done'; f.fileId = b.fileId; }
      else { f.state = 'failed'; f.error = xhr.status === 415 ? 'This kind of file cannot be sent: use PDF, Word (.docx), JPEG, PNG or HEIC.' : xhr.status === 413 ? 'Too large to send.' : 'Did not upload.'; }
      drawFiles(); pump();
    };
    xhr.onerror = function () { A.pumping = false; f.state = 'failed'; f.error = 'Did not upload. Check your connection.'; drawFiles(); pump(); };
    xhr.send(file);
    drawFiles();
  }

  function sendAddition(r) {
    if (A.sending) return;
    var err = document.getElementById('add-err');
    err.textContent = '';
    var message = document.getElementById('add-message').value.trim();
    var about = A.about;
    var msgField = document.getElementById('add-message-field');
    // An offer or a disposition needs its words (contract draft 21): the box turns red, with no words, as on the form
    // (W31); a screen reader is told what is still needed.
    var wordsNeeded = function () {
      msgField.classList.add('has-err');
      err.appendChild(h('p', { class: 'visually-hidden', text: 'The ' + (about === 'offer' ? 'offer' : 'disposition') + ' is still needed.' }));
      document.getElementById('add-message').setAttribute('aria-invalid', 'true');
      document.getElementById('add-message').focus();
    };
    var note = (document.getElementById('a-other-note') || {}).value || '';
    note = note.replace(/[\r\n]+/g, ' ').trim();
    if (A.list.some(function (f) { return f.state === 'queued' || f.state === 'uploading'; })) { err.appendChild(h('div', { class: 'err-summary', text: 'Please wait for every file to finish uploading.' })); return; }
    if (A.list.some(function (f) { return f.state === 'failed'; })) { err.appendChild(h('div', { class: 'err-summary', text: 'Remove the files that did not upload, or choose them again.' })); return; }
    var docs = A.list.filter(function (f) { return f.state === 'done'; }).map(function (f) { return { kind: f.kind, fileField: f.fileId, note: f.kind === 'other' ? note : null }; });
    if (about !== 'message' && !message) { wordsNeeded(); return; }
    if (!message && !docs.length) { err.appendChild(h('div', { class: 'err-summary', text: 'Please write a note to RIAC, or choose at least one file.' })); return; }
    if (docs.some(function (d) { return d.kind === 'other'; }) && !note) { err.appendChild(h('div', { class: 'err-summary', text: 'Please say what the "Something else" file is.' })); return; }
    if (!A.batch) { err.appendChild(h('div', { class: 'err-summary', text: 'Files cannot be added just now. Please try again in a few minutes.' })); return; }
    A.key = A.key || uuid();
    A.sending = true;
    var btn = document.getElementById('add-send'); btn.disabled = true; btn.textContent = 'Sending…';
    api('POST', '/v1/portal/referrals/' + encodeURIComponent(r.reference) + '/additions', { uploadId: A.batch.uploadId, addition: { about: about, message: message || null, documents: docs } }, { 'Idempotency-Key': A.key })
      .then(function (res) {
        A.sending = false;
        if (res.status === 201) { added(r, res.body, message, docs, about); return; }
        btn.disabled = false; btn.textContent = 'Send To RIAC';
        if (res.status === 401) { location.replace('./'); return; }
        if (res.status === 400 && (res.body.fields || []).some(function (f) { return f.key === 'addition.message' && f.problem === 'required'; })) { wordsNeeded(); return; }
        var t = res.status === 404 ? 'This referral is not one you can add to.' : res.status === 0
          ? 'It may not have been sent: the connection failed. Press Send To RIAC again; it will not arrive twice.'
          : 'It could not be sent just now. Please try again in a few minutes; it will not arrive twice.';
        err.appendChild(h('div', { class: 'err-summary', text: t }));
      });
  }

  function added(r, body, message, docs, about) {
    clear();
    app.appendChild(h('a', { class: 'back-link', href: './', text: '‹ Back To Your Referrals' }));
    var names = docs.map(function (d) {
      var f = A.list.filter(function (x) { return x.fileId === d.fileField; })[0];
      return h('li', { text: (d.kind === 'other' ? 'Something else (' + d.note + ')' : D.DOCS[d.kind].name) + ': ' + (f ? f.name : '') });
    });
    app.appendChild(h('div', { class: 'add-card' }, [h('h2', null, [h('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }), 'Sent to RIAC']),
      h('div', { class: 'inner' }, [which(r), h('p', { text: 'Received ' + fmtWhen(body.receivedAt) + '. RIAC sees it with this referral.' }),
        h('p', null, [h('strong', { text: 'What you sent: ' }), h('span', { class: 'about-tag', text: aboutOf(about).sent })]),
        message ? h('p', { class: 'copy-rows' }, [h('span', { class: 'pre', text: message })]) : null,
        names.length ? h('ul', { class: 'added-list' }, names) : null,
        h('div', { class: 'add-actions' }, [h('button', { type: 'button', class: 'btn btn-plain', on: { click: function () { window.print(); } } }, ['Print Or Save As PDF']),
          h('a', { class: 'btn btn-navy', href: './', text: 'Back To Your Referrals' })])])]));
    A = { batch: null, files: {}, list: [], pumping: false, key: null, sending: false, about: 'message', kinds: [] };
  }

  // ---------- Start ------------------------------------------------------------------------------------------------------

  if (PAGE === 'add') addPage();
  else {
    if (!fromLink()) list();
    window.addEventListener('hashchange', fromLink);   // the link opened in a tab already showing this page
  }
})();
