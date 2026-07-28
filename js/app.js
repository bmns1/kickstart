// ============================================================
// SVA Kickstart — app logic
// ============================================================
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------- state ----
let session = null;   // { email, token }
let state = null;     // backend state: students, links, events, config, progress
let progress = null;  // mutable progress object
let steps = [];       // journey step definitions
let saveTimer = null;

const SKEY = 'kickstartSession';

// ---------------------------------------------------------------- toast ----
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ------------------------------------------------------------- confetti ----
const confetti = (() => {
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  let parts = [], raf = null;
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize); resize();
  const COLORS = ['#2b3990', '#7cc5ab', '#f6b93b', '#ff6b6b', '#8e7cc3', '#5bc0eb'];
  function burst(n = 90, big = false) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - .5) * innerWidth * (big ? .9 : .4),
        y: big ? -20 : innerHeight * .35,
        vx: (Math.random() - .5) * 9,
        vy: big ? Math.random() * 3 + 2 : -(Math.random() * 9 + 3),
        s: Math.random() * 8 + 5,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        r: Math.random() * Math.PI,
        vr: (Math.random() - .5) * .3,
        life: 140 + Math.random() * 60,
      });
    }
    if (!raf) tick();
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += .22; p.vx *= .99; p.r += p.vr; p.life--;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6);
      ctx.restore();
    });
    parts = parts.filter(p => p.life > 0 && p.y < canvas.height + 40);
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  return { burst };
})();

// ------------------------------------------------------------ countdown ----
function startCountdown() {
  const target = new Date(((state && state.config.first_day) || '2026-08-17') + 'T08:00:00-07:00');
  const box = $('#countdown');
  function render() {
    let diff = target - new Date();
    if (diff < 0) { $('#cdCaption').textContent = 'School is in session — welcome back!'; box.innerHTML = ''; return; }
    const d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5),
          m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
    box.innerHTML = [[d, 'days'], [h, 'hours'], [m, 'mins'], [s, 'secs']]
      .map(([n, l]) => `<div class="cd-box"><div class="cd-num">${n}</div><div class="cd-lab">${l}</div></div>`).join('');
  }
  render();
  setInterval(render, 1000);
}

// ----------------------------------------------------------------- auth ----
function initAuth() {
  const inpEmail = $('#inpEmail');
  const codeBoxes = $$('#codeInputs input');

  if (API.demo) $('#demoHintEmail').textContent = 'Demo mode — any email works, code is 123456';

  async function sendCode() {
    const email = inpEmail.value.trim().toLowerCase();
    const err = $('#errEmail');
    err.style.display = 'none';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      err.textContent = 'Please enter a valid email address.'; err.style.display = 'block'; return;
    }
    const btn = $('#btnSendCode');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Sending…';
    try {
      const res = await API.requestCode(email);
      if (!res.ok) {
        err.textContent = 'Something went wrong — please try again.';
        err.style.display = 'block';
        return;
      }
      // Note: for privacy, the response never reveals whether the email is
      // registered — the next screen covers both cases.
      session = { email, token: null };
      $('#codeEmailLabel').textContent = email;
      $('#authEmail').classList.add('hidden');
      $('#authCode').classList.remove('hidden');
      codeBoxes[0].focus();
      if (res.demoHint) toast(res.demoHint);
    } catch (e) {
      err.textContent = 'Network error — please check your connection and try again.';
      err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Email my verification code';
    }
  }

  $('#btnSendCode').addEventListener('click', sendCode);
  inpEmail.addEventListener('keydown', e => { if (e.key === 'Enter') sendCode(); });

  codeBoxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g, '').slice(0, 1);
      if (b.value && i < 5) codeBoxes[i + 1].focus();
      if (codeBoxes.every(x => x.value)) verify();
    });
    b.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !b.value && i > 0) codeBoxes[i - 1].focus();
      if (e.key === 'Enter') verify();
    });
    b.addEventListener('paste', e => {
      const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (digits.length) {
        e.preventDefault();
        digits.split('').forEach((d, j) => { if (codeBoxes[j]) codeBoxes[j].value = d; });
        (codeBoxes[digits.length - 1] || codeBoxes[5]).focus();
        if (digits.length === 6) verify();
      }
    });
  });

  async function verify() {
    const code = codeBoxes.map(b => b.value).join('');
    if (code.length < 6) return;
    const err = $('#errCode');
    err.style.display = 'none';
    const btn = $('#btnVerify');
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Checking…';
    try {
      const res = await API.verifyCode(session.email, code);
      if (!res.ok) {
        err.textContent = res.error === 'expired'
          ? 'That code has expired — select "Resend code" to get a new one.'
          : "That code isn't valid. Double-check the digits, or resend a new code.";
        err.style.display = 'block';
        codeBoxes.forEach(b => b.value = ''); codeBoxes[0].focus();
        return;
      }
      session.token = res.token;
      localStorage.setItem(SKEY, JSON.stringify(session));
      enterJourney(res);
      confetti.burst(90, true);
    } catch (e) {
      err.textContent = 'Network error — please try again.'; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'Verify & continue';
    }
  }
  $('#btnVerify').addEventListener('click', verify);

  $('#lnkResend').addEventListener('click', e => { e.preventDefault(); sendCode(); toast('A new code is on its way.'); });
  $('#lnkBack').addEventListener('click', e => {
    e.preventDefault();
    $('#authCode').classList.add('hidden');
    $('#authEmail').classList.remove('hidden');
  });

  $('#btnSignOut').addEventListener('click', () => {
    localStorage.removeItem(SKEY);
    location.reload();
  });
}

// ------------------------------------------------------- progress saving ----
function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await API.saveProgress(session.email, session.token, progress); }
    catch (e) { /* silent; retried on next change */ }
  }, 900);
}

function markDone(stepId) {
  if (progress.doneSteps[stepId]) return;
  progress.doneSteps[stepId] = true;
  queueSave();
  const node = $('#node-' + stepId);
  if (node) {
    node.classList.add('done'); node.classList.remove('open', 'active');
    $('.badge', node).textContent = '✓ Done';
    $('.step-dot', node).textContent = '✓';
  }
  confetti.burst(40);
  updateProgressBar();
  const next = steps.find(s => !progress.doneSteps[s.id]);
  if (next) openStep(next.id, true);
  else {
    $('#finishCard').classList.remove('hidden');
    $('#finishCard').scrollIntoView({ behavior: 'smooth' });
    confetti.burst(140, true);
  }
}

function updateProgressBar() {
  const done = steps.filter(s => progress.doneSteps[s.id]).length;
  const pct = Math.round(done / steps.length * 100);
  $('#progressFill').style.width = pct + '%';
  $('#progressLabel').textContent = pct + '% complete';
}

function openStep(stepId, scroll) {
  $$('.step-node').forEach(n => n.classList.remove('open', 'active'));
  const node = $('#node-' + stepId);
  if (!node) return;
  node.classList.add('open', 'active');
  if (scroll) setTimeout(() => node.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
}

// ------------------------------------------------------- journey builder ----
function enterJourney(newState) {
  state = newState;
  progress = Object.assign({ doneSteps: {}, supplies: {}, rsvp: null, pto: null, signed: {} }, newState.progress || {});

  $('#viewLanding').classList.add('hidden');
  $('#viewJourney').classList.remove('hidden');
  $('#topbar').classList.remove('hidden');
  $('#progressWrap').classList.remove('hidden');

  const names = state.students.map(s => s.name.split(' ')[0]);
  $('#welcomeTitle').textContent = `Welcome, ${names.join(' & ')}'s family`;
  $('#kidChips').innerHTML = state.students.map((s, i) =>
    `<div class="kid-chip" style="animation-delay:${i * .12}s">${esc(s.name)} <span class="g">${esc(gradeLabel(s.grade))}</span></div>`).join('');
  if (state.config.office_email)
    $('#footerContact').innerHTML = `Questions? <a href="mailto:${esc(state.config.office_email)}">${esc(state.config.office_email)}</a>`;

  buildSteps();
  renderJourney();
  updateProgressBar();

  const firstOpen = steps.find(s => !progress.doneSteps[s.id]);
  if (firstOpen) {
    openStep(firstOpen.id, Object.keys(progress.doneSteps).length > 0);
    if (Object.keys(progress.doneSteps).length > 0) toast('Welcome back — picking up right where you left off.');
  } else {
    $('#finishCard').classList.remove('hidden');
  }
}

function link(key) { return (state.links[key] || {}).url || '#'; }
function linkLabel(key) { return (state.links[key] || {}).label || key; }

function buildSteps() {
  const hasPreK = state.students.some(s => isPreK(s.grade));
  const hasK8 = state.students.some(s => isK8(s.grade));
  const hasElem = state.students.some(s => { const b = gradeBand(s.grade); return b === 'kg1' || b === 'g23' || b === 'g45'; });
  const hasMS = state.students.some(s => gradeBand(s.grade) === 'ms');

  steps = [
    { id: 'dates', title: 'Key dates & potluck RSVP', render: renderDates },
    { id: 'dropoff', title: 'Arrival & drop-off', render: renderDropoff },
    { id: 'whatsapp', title: 'Classroom WhatsApp groups', render: renderWhatsapp },
    { id: 'hotlunch', title: 'Hot lunch program', render: renderHotlunch },
    ...(hasK8 ? [{ id: 'uniform', title: 'Uniform guidelines', render: () => renderUniform(hasElem, hasMS) }] : []),
    { id: 'supplies', title: 'Supply checklist', render: renderSupplies },
    { id: 'pto', title: 'PTO & volunteering', render: renderPTO },
    { id: 'policy', title: 'Conduct policy — review & sign', render: () => renderPolicy(hasPreK, hasK8) },
  ];
}

function renderJourney() {
  const journey = $('#journey');
  journey.innerHTML = '';
  steps.forEach((step, i) => {
    const done = !!progress.doneSteps[step.id];
    const node = document.createElement('div');
    node.className = 'step-node' + (done ? ' done' : '');
    node.id = 'node-' + step.id;
    node.innerHTML = `
      <div class="step-rail">
        <div class="step-dot">${done ? '✓' : i + 1}</div>
        ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
      </div>
      <div class="step-body">
        <div class="step-card">
          <div class="step-head">
            <h3>${esc(step.title)}</h3>
            <span class="badge">${done ? '✓ Done' : 'Step ' + (i + 1)}</span>
          </div>
          <div class="step-content"></div>
        </div>
      </div>`;
    $('.step-head', node).addEventListener('click', () => {
      if (node.classList.contains('open')) node.classList.remove('open', 'active');
      else openStep(step.id, false);
    });
    journey.appendChild(node);
    step.render($('.step-content', node));
  });
}

function doneButton(el, stepId, label = 'Mark complete & continue') {
  const btn = document.createElement('button');
  btn.className = 'btn mint mt';
  btn.textContent = label;
  btn.addEventListener('click', () => markDone(stepId));
  el.appendChild(btn);
}

// ------------------------------------------------------------ step: dates ----
function renderDates(el) {
  const today = new Date().toISOString().slice(0, 10);
  const evs = state.events.map(ev => {
    const past = ev.date < today;
    const d = new Date(ev.date + 'T12:00:00');
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return `<div class="event">
      <div class="e-emoji">${ev.emoji || '📌'}</div>
      <div>
        <div class="e-date ${past ? 'past' : ''}">${dateStr}${past ? ' · done ✓' : ''}</div>
        <h4>${esc(ev.title)}</h4>
        <p>${esc(ev.description)}</p>
        ${ev.title.toLowerCase().includes('potluck') ? `<div class="choice-row" id="rsvpRow"></div>` : ''}
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    ${evs}
    <div class="link-grid">
      <a class="link-tile" href="${esc(link('calendar_pdf'))}" target="_blank" rel="noopener"><span class="li-emoji">🗓️</span> Full calendar (PDF)</a>
      <a class="link-tile" href="${esc(link('calendar_gcal'))}" target="_blank" rel="noopener"><span class="li-emoji">📲</span> Google Calendar</a>
    </div>`;

  // RSVP widget
  const row = $('#rsvpRow', el);
  if (row) {
    const opts = [['yes', "Yes, we'll be there"], ['maybe', 'Maybe'], ['no', "Can't make it"]];
    row.innerHTML = opts.map(([v, l]) => `<button class="choice ${progress.rsvp === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('') +
      `<a class="link-tile" style="flex-basis:100%" href="${esc(link('potluck_rsvp'))}" target="_blank" rel="noopener"><span class="li-emoji">🧺</span> Official potluck RSVP page</a>`;
    $$('.choice', row).forEach(b => b.addEventListener('click', () => {
      $$('.choice', row).forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      progress.rsvp = b.dataset.v;
      queueSave();
      API.submit(session.email, session.token, 'potluck_rsvp', { answer: b.dataset.v }).catch(() => {});
      toast(b.dataset.v === 'yes' ? "RSVP recorded — don't forget your dish!" : 'Thank you — your response has been recorded.');
    }));
  }
  doneButton(el, 'dates');
}

// ---------------------------------------------------------- step: dropoff ----
function renderDropoff(el) {
  const hasPreK = state.students.some(s => isPreK(s.grade));
  const hasK8 = state.students.some(s => isK8(s.grade));
  el.innerHTML = `
    <p class="muted">Three quick maps so day one feels familiar:</p>
    <b>1 · Our campus</b>
    <img class="map-img" src="assets/img/campus.jpg" alt="SVA campus aerial view" loading="lazy">
    <b>2 · Enter through the Washington Gate</b>
    <img class="map-img" src="assets/img/gate.jpg" alt="Enter through Washington Gate off W Washington Ave" loading="lazy">
    <div class="callout warn"><b>No SVA parking anytime</b> in the marked area by the gate — enter and keep moving.</div>
    <b>3 · Drop-off & parking</b>
    <img class="map-img" src="assets/img/dropoff.jpg" alt="Parent parking, drop-off lanes and exit-only Leota gate" loading="lazy">
    ${hasK8 ? `<div class="callout"><b>K–8th graders</b> (starting Tue 8/19): use the <b>car drop-off lane</b> adjacent to the gymnasium, then exit via the <b>Leota gate (exit only)</b>.</div>` : ''}
    ${hasPreK ? `<div class="callout"><b>PreK families:</b> drop-off and pick-up are always <b>in person at the classroom</b>. Please park <b>only in the parents parking lot</b>, then walk your child in.</div>` : ''}
    <div class="callout"><b>First day (Mon 8/17):</b> everyone parks and walks their child into the classroom.</div>`;
  doneButton(el, 'dropoff');
}

// --------------------------------------------------------- step: whatsapp ----
function renderWhatsapp(el) {
  const seen = new Set();
  let html = `<p class="muted">Join the WhatsApp group for each of your children's classrooms — announcements, reminders, and parent coordination in one place.</p>`;
  state.students.forEach(s => {
    const key = whatsappKey(s.grade);
    if (seen.has(key)) return;
    seen.add(key);
    const url = link(key);
    const ok = url && url !== '#' && !url.includes('REPLACE_ME');
    html += ok
      ? `<a class="wa-btn" href="${esc(url)}" target="_blank" rel="noopener">${esc(linkLabel(key))} <span style="margin-left:auto">↗</span></a>`
      : `<div class="wa-btn" style="opacity:.6">${esc(gradeLabel(s.grade))} group — link coming soon</div>`;
  });
  el.innerHTML = html;
  doneButton(el, 'whatsapp', "I've joined — continue");
}

// --------------------------------------------------------- step: hotlunch ----
function renderHotlunch(el) {
  el.innerHTML = `
    <div class="callout">${esc(state.config.hotlunch_note || 'Hot lunch starts 8/24, offered all school days.')}</div>
    <a class="link-tile" href="${esc(link('parent_portal'))}" target="_blank" rel="noopener"><span class="li-emoji">🍱</span> Explore the hot lunch menu (parent portal)</a>`;
  doneButton(el, 'hotlunch');
}

// ---------------------------------------------------------- step: uniform ----
function renderUniform(hasElem, hasMS) {
  const el = $('#node-uniform .step-content');
  let html = `<p class="muted">Uniforms apply to K–8 students starting the very first day of school.</p><div class="uni-grid">`;
  const blocks = [];
  if (hasElem) blocks.push(UNIFORM.elementary);
  if (hasMS) blocks.push(UNIFORM.middle);
  blocks.forEach(u => {
    html += `<div class="uni-card"><h4>${esc(u.title)}</h4><p class="muted">${esc(u.intro)}</p>`;
    u.sections.forEach(sec => {
      html += `<b style="font-size:14px">${esc(sec.title)}</b><ul>` + sec.items.map(i => `<li>${esc(i)}</li>`).join('') + '</ul>';
    });
    html += '</div>';
  });
  html += `</div>
    <a class="link-tile mt" style="display:flex" href="${esc(link('uniform_policy'))}" target="_blank" rel="noopener"><span class="li-emoji">📄</span> Full uniform policy (PDF)</a>`;
  el.innerHTML = html;
  doneButton(el, 'uniform');
}

// --------------------------------------------------------- step: supplies ----
function renderSupplies(el) {
  const kids = state.students;
  progress.supplies = progress.supplies || {};

  const supplyDoc = link('supply_list');
  el.innerHTML = `
    <p class="muted">Tap items as you gather them — your checklist saves automatically. Bring everything to Orientation (Fri 8/14) in a labeled bag or box.</p>
    ${supplyDoc !== '#' ? `<a class="link-tile" style="margin-bottom:10px" href="${esc(supplyDoc)}" target="_blank" rel="noopener"><span class="li-emoji">📄</span> ${esc(linkLabel('supply_list') || 'Official supply list document')}</a>` : ''}
    <div class="kid-tabs" id="supTabs"></div>
    <div id="supList"></div>
    <button class="btn ghost mt" id="btnEmailSupplies">Email me the checklist</button>`;

  const tabs = $('#supTabs', el);
  const listBox = $('#supList', el);
  let current = 0;

  function itemsFor(kid) {
    const band = SUPPLY_LISTS[gradeBand(kid.grade)];
    const flat = [];
    band.groups.forEach((g, gi) => g.items.forEach((it, ii) => flat.push({ ...it, key: gi + '.' + ii, group: g.title })));
    return { band, flat };
  }

  function renderTabs() {
    tabs.innerHTML = kids.map((k, i) => {
      const { flat } = itemsFor(k);
      const got = flat.filter(it => (progress.supplies[k.id] || {})[it.key]).length;
      return `<button class="kid-tab ${i === current ? 'on' : ''}" data-i="${i}">${esc(k.name.split(' ')[0])} ${got === flat.length ? '✓' : `(${got}/${flat.length})`}</button>`;
    }).join('');
    $$('.kid-tab', tabs).forEach(b => b.addEventListener('click', () => { current = +b.dataset.i; renderTabs(); renderList(); }));
  }

  function renderList() {
    const kid = kids[current];
    const { band, flat } = itemsFor(kid);
    const kidProg = progress.supplies[kid.id] = progress.supplies[kid.id] || {};
    const got = flat.filter(it => kidProg[it.key]).length;

    let html = `<div class="mini-progress">${esc(band.label)} — ${got}/${flat.length} packed</div>`;
    let lastGroup = null;
    flat.forEach(it => {
      if (it.group !== lastGroup) { html += `<div class="check-group-title">${esc(it.group)}</div>`; lastGroup = it.group; }
      html += `<div class="check-item ${kidProg[it.key] ? 'checked' : ''}" data-k="${it.key}">
        <div class="cbox">✓</div>
        <div><span class="c-name">${esc(it.name)}</span>${it.qty ? ` <span class="c-qty">· Qty: ${esc(it.qty)}</span>` : ''}</div>
      </div>`;
    });
    if (band.note) html += `<div class="callout">${esc(band.note)}</div>`;
    listBox.innerHTML = html;

    $$('.check-item', listBox).forEach(row => row.addEventListener('click', () => {
      const k = row.dataset.k;
      kidProg[k] = !kidProg[k];
      row.classList.toggle('checked', !!kidProg[k]);
      queueSave();
      const gotNow = flat.filter(it => kidProg[it.key]).length;
      $('.mini-progress', listBox).textContent = `${band.label} — ${gotNow}/${flat.length} packed`;
      renderTabs();
      if (gotNow === flat.length) { confetti.burst(50); toast(`${kid.name.split(' ')[0]}'s supply list is complete.`); }
    }));
  }

  renderTabs(); renderList();

  $('#btnEmailSupplies', el).addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.innerHTML = '<span class="spin" style="border-color:rgba(43,57,144,.3);border-top-color:#2b3990"></span> Sending…';
    try {
      const lists = kids.map(k => {
        const { band, flat } = itemsFor(k);
        return {
          student: k.name, grade: k.grade, bandLabel: band.label,
          items: flat.map(it => ({ name: it.name, qty: it.qty || '', done: !!(progress.supplies[k.id] || {})[it.key] })),
        };
      });
      const res = await API.emailSupplies(session.email, session.token, lists);
      toast(res.ok ? 'Checklist sent to ' + session.email : 'Could not send — please try again.');
    } catch (err) { toast('Could not send — please try again.'); }
    finally { btn.disabled = false; btn.textContent = 'Email me the checklist'; }
  });

  doneButton(el, 'supplies');
}

// -------------------------------------------------------------- step: pto ----
function renderPTO(el) {
  const saved = progress.pto || { choices: [], idea: '' };
  el.innerHTML = `
    <p class="muted">Interested in joining our school PTO, or have a project idea you'd like to share? Now is the perfect time — let us know. Select all that apply:</p>
    <div class="choice-row" id="ptoChoices">
      <button class="choice" data-v="join_pto">I'd like to join the PTO</button>
      <button class="choice" data-v="volunteer">I can volunteer occasionally</button>
      <button class="choice" data-v="idea">I have a project idea</button>
      <button class="choice" data-v="cheer">Just cheering you on</button>
    </div>
    <textarea class="field" id="ptoIdea" placeholder="Tell us about your idea, skills you'd like to share, or anything else… (optional)">${esc(saved.idea)}</textarea>
    <button class="btn mt" id="btnPtoSubmit">Send to the school</button>`;

  const chosen = new Set(saved.choices);
  $$('#ptoChoices .choice', el).forEach(b => {
    if (chosen.has(b.dataset.v)) b.classList.add('on');
    b.addEventListener('click', () => {
      b.classList.toggle('on');
      chosen.has(b.dataset.v) ? chosen.delete(b.dataset.v) : chosen.add(b.dataset.v);
    });
  });

  $('#btnPtoSubmit', el).addEventListener('click', async e => {
    const btn = e.currentTarget;
    const data = { choices: [...chosen], idea: $('#ptoIdea', el).value.trim() };
    progress.pto = data;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Sending…';
    try {
      await API.submit(session.email, session.token, 'pto_interest', data);
      queueSave();
      toast('Thank you — your response has been sent to the school.');
      markDone('pto');
    } catch (err) { toast('Could not send — please try again.'); }
    finally { btn.disabled = false; btn.textContent = 'Send to the school'; }
  });
}

// ----------------------------------------------------------- step: policy ----
function renderPolicy(hasPreK, hasK8) {
  const el = $('#node-policy .step-content');
  progress.signed = progress.signed || {};

  const groups = [];
  if (hasPreK) groups.push({
    key: 'conduct_prek',
    label: linkLabel('conduct_prek') || 'PreK Behavior & Support Policy',
    url: link('conduct_prek'),
    students: state.students.filter(s => isPreK(s.grade)),
  });
  if (hasK8) groups.push({
    key: 'conduct_k8',
    label: linkLabel('conduct_k8') || 'Student Conduct & Character Policy',
    url: link('conduct_k8'),
    students: state.students.filter(s => isK8(s.grade)),
  });

  el.innerHTML = `<p class="muted">One last important step: please review the policy for your child's grade level and sign electronically below. The signed record — including the full policy text, your signature, and verification details — will be emailed to you and kept on file by the school.</p><div id="policyGroups"></div>`;
  const box = $('#policyGroups', el);

  groups.forEach(g => {
    const signedInfo = progress.signed[g.key];
    const card = document.createElement('div');
    card.className = 'uni-card mt';
    card.innerHTML = signedInfo ? signedHtml(g, signedInfo) : `
      <h4>${esc(g.label)}</h4>
      <p class="muted">For: <b>${esc(g.students.map(s => s.name).join(', '))}</b></p>
      <a class="link-tile mt" href="${esc(g.url)}" target="_blank" rel="noopener"><span class="li-emoji">📖</span> Open &amp; read the policy</a>
      <label class="check-item agree mt" style="padding-left:0" data-role="agree">
        <div class="cbox">✓</div>
        <div class="c-name">I confirm that I have read, understood, and agree to the ${esc(g.label)} on behalf of my student(s) listed above.</div>
      </label>
      <label class="check-item agree" style="padding-left:0" data-role="consent">
        <div class="cbox">✓</div>
        <div class="c-name">I agree to sign this document electronically, and I understand that my electronic signature is the legal equivalent of my handwritten signature (U.S. ESIGN Act &amp; UETA).</div>
      </label>
      <input class="field mt" placeholder="Parent/guardian full legal name" data-role="signer">
      <div class="sig-wrap mt">
        <canvas height="160"></canvas>
        <div class="sig-hint">Sign here with your finger or mouse</div>
      </div>
      <div class="sig-tools">
        <button class="btn ghost small" data-role="clear">Clear</button>
        <button class="btn small" data-role="sign">Sign &amp; submit</button>
      </div>
      <div class="err" data-role="err"></div>
      <p class="legal-note">By selecting "Sign &amp; submit," a signature record is created containing the full policy text, your typed name and drawn signature, your verified email address, and a timestamp. A copy is emailed to you and retained by the school.</p>`;
    box.appendChild(card);
    if (!signedInfo) wireSignature(card, g);
  });

  function signedHtml(g, info) {
    return `<h4>✓ ${esc(g.label)} — signed</h4>
      <p class="muted">Signed by <b>${esc(info.signer)}</b> for <b>${esc(g.students.map(s => s.name).join(', '))}</b> on ${esc(info.at)}.
      A copy of the signed record was emailed to you.${info.fileUrl && info.fileUrl !== '#demo-signed-pdf' ? ` <a href="${esc(info.fileUrl)}" target="_blank" rel="noopener">View signed PDF</a>` : ''}</p>`;
  }

  function wireSignature(card, g) {
    const canvas = $('canvas', card);
    const wrap = $('.sig-wrap', card);
    const hint = $('.sig-hint', card);
    const ctx = canvas.getContext('2d');
    let drawing = false, hasInk = false;

    function fit() {
      const w = wrap.clientWidth;
      if (w && canvas.width !== w) { canvas.width = w; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1e2a6e'; }
    }
    new ResizeObserver(fit).observe(wrap);
    fit();

    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    }
    canvas.addEventListener('pointerdown', e => {
      drawing = true; hasInk = true; hint.style.display = 'none';
      canvas.setPointerCapture(e.pointerId);
      ctx.beginPath(); ctx.moveTo(...pos(e));
    });
    canvas.addEventListener('pointermove', e => { if (drawing) { ctx.lineTo(...pos(e)); ctx.stroke(); } });
    canvas.addEventListener('pointerup', () => drawing = false);

    $('[data-role=clear]', card).addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); hasInk = false; hint.style.display = 'flex';
    });

    const agree = $('[data-role=agree]', card);
    const consent = $('[data-role=consent]', card);
    agree.addEventListener('click', () => agree.classList.toggle('checked'));
    consent.addEventListener('click', () => consent.classList.toggle('checked'));

    $('[data-role=sign]', card).addEventListener('click', async e => {
      const btn = e.currentTarget;
      const err = $('[data-role=err]', card);
      err.style.display = 'none';
      const signer = $('[data-role=signer]', card).value.trim();
      if (!agree.classList.contains('checked')) { err.textContent = 'Please confirm you have read and agree to the policy.'; err.style.display = 'block'; return; }
      if (!consent.classList.contains('checked')) { err.textContent = 'Please consent to signing electronically.'; err.style.display = 'block'; return; }
      if (!signer) { err.textContent = 'Please type your full legal name.'; err.style.display = 'block'; return; }
      if (!hasInk) { err.textContent = 'Please sign in the box.'; err.style.display = 'block'; return; }

      btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Signing…';
      try {
        const res = await API.signPolicy(session.email, session.token, {
          policyKey: g.key,
          policyLabel: g.label,
          policyUrl: g.url,
          students: g.students.map(s => s.name + ' (' + gradeLabel(s.grade) + ')'),
          signerName: signer,
          signatureDataUrl: canvas.toDataURL('image/png'),
          agreeText: $('.c-name', agree).textContent,
          consentText: $('.c-name', consent).textContent,
          userAgent: navigator.userAgent,
          timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || ''),
        });
        if (!res.ok) throw new Error('server');
        progress.signed[g.key] = { signer, at: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), fileUrl: res.fileUrl || '' };
        queueSave();
        card.innerHTML = signedHtml(g, progress.signed[g.key]);
        confetti.burst(60);
        toast('Signed — a copy of the record is on its way to your inbox.');
        if (groups.every(x => progress.signed[x.key])) markDone('policy');
      } catch (er) {
        err.textContent = 'Could not submit the signature — please try again.'; err.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Sign & submit';
      }
    });
  }
}

// ----------------------------------------------------------- finish card ----
function initFinish() {
  $('#btnReview').addEventListener('click', () => {
    $('#finishCard').classList.add('hidden');
    openStep(steps[0].id, true);
  });
  $('#btnEmailSummary').addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true; btn.innerHTML = '<span class="spin" style="border-color:rgba(30,42,110,.3);border-top-color:#1e2a6e"></span> Sending…';
    try {
      const kidLines = state.students.map(s => `<li><b>${esc(s.name)}</b> — ${esc(gradeLabel(s.grade))}</li>`).join('');
      const stepLines = steps.map(s => `<li>${progress.doneSteps[s.id] ? '✅' : '⬜'} ${esc(s.title)}</li>`).join('');
      const rsvpLine = progress.rsvp ? `<p><b>Potluck RSVP:</b> ${esc(progress.rsvp)}</p>` : '';
      const html = `
        <h2 style="color:#2b3990">Your SVA Kickstart Summary</h2>
        <p>Family: <b>${esc(state.familyId)}</b></p><ul>${kidLines}</ul>
        <h3>Checklist</h3><ul>${stepLines}</ul>${rsvpLine}
        <h3>Key dates</h3><ul>${state.events.map(ev => `<li><b>${esc(ev.date)}</b> — ${esc(ev.title)}</li>`).join('')}</ul>
        <p>See you at Orientation on Friday 8/14.</p>`;
      const res = await API.emailSummary(session.email, session.token, html);
      toast(res.ok ? 'Summary sent to ' + session.email : 'Could not send — please try again.');
    } catch (err) { toast('Could not send — please try again.'); }
    finally { btn.disabled = false; btn.textContent = 'Email me my summary'; }
  });
}

// ----------------------------------------------------------------- boot ----
(async function boot() {
  initAuth();
  initFinish();
  startCountdown();

  // resume a previous session?
  try {
    const saved = JSON.parse(localStorage.getItem(SKEY) || 'null');
    if (saved && saved.email && saved.token) {
      session = saved;
      const res = await API.getState(saved.email, saved.token);
      if (res.ok) { enterJourney(res); return; }
      localStorage.removeItem(SKEY);
    }
  } catch (e) { /* fresh start */ }
})();
