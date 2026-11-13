/* ============================================================
   MOTOR DA OFICINA: rotas, progresso, exercícios, widgets,
   simulador, explorador e treino de adaptação.
   Tudo é simulação em JavaScript: nenhum C# ou MySQL roda aqui.
   ============================================================ */
(function () {
'use strict';
document.documentElement.lang = 'pt-BR';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- armazenamento local ---------- */
const KEY = 'oficina-crud-v1';
const defaults = () => ({ done: {}, ex: {}, checks: {}, drafts: {}, sim: null, simple: false, step: true, flash: {} });
let S = (() => {
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === 'object') return Object.assign(defaults(), v); } catch (e) { /* sem storage */ }
  return defaults();
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* modo privado */ } updateProgress(); }

/* ---------- utilidades ---------- */
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const br = iso => iso ? iso.split('-').reverse().join('/') : '';
const sqlDate = iso => iso.replace(/-/g, '/');
const qs = s => s === null ? 'null' : `"${s}"`;
const qc = c => c === '\0' ? "'\\0'" : `'${c}'`;
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle(arr, seed) {
  const a = arr.slice(); let x = hash(seed) || 1;
  for (let i = a.length - 1; i > 0; i--) { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; const j = x % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Normaliza código para comparação: ignora diferenças de espaços e quebras de linha.
const norm = s => String(s).replace(/\s+/g, ' ').replace(/ ?([^\w\s]) ?/g, '$1').trim();
const byNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }) || a.id - b.id;

/* ---------- realce de sintaxe (só visual) ---------- */
const CS_KW = new Set('using namespace class internal public private protected static void return new if else try catch finally throw partial override this base int string char bool decimal double object var null true false for foreach while switch case break default typeof'.split(' '));
const CS_TY = new Set('DateTime DataTable Exception MySqlException MySqlConnection MySqlCommand MySqlDataAdapter Form EventArgs DataGridViewCellEventArgs MessageBox Application Aluno Conexao FrmAlunos FrmPrincipal System CultureInfo Convert STAThread'.split(' '));
const sp = (c, t) => `<span class="t-${c}">${esc(t)}</span>`;
function hlCS(s) {
  let out = '', i = 0; const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { out += sp('com', s.slice(i)); break; }
    if (c === '#') { out += sp('kw', s.slice(i)); break; }
    if (c === '$' && s[i + 1] === '"') {
      let j = i + 2; out += '<span class="t-str">$"';
      while (j < n && s[j] !== '"') {
        if (s[j] === '{') {
          let depth = 1, k = j + 1;
          while (k < n && depth > 0) {
            if (s[k] === '"') { k++; while (k < n && s[k] !== '"') { if (s[k] === '\\') k++; k++; } k++; continue; }
            if (s[k] === '{') depth++; else if (s[k] === '}') depth--;
            if (depth > 0) k++;
          }
          out += '</span><span class="t-int">{</span>' + hlCS(s.slice(j + 1, k)) + '<span class="t-int">}</span><span class="t-str">';
          j = k + 1;
        } else if (s[j] === '\\') { out += esc(s.slice(j, j + 2)); j += 2; } else { out += esc(s[j]); j++; }
      }
      out += '"</span>'; i = j + 1; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < n && s[j] !== c) { if (s[j] === '\\') j++; j++; }
      out += sp('str', s.slice(i, j + 1)); i = j + 1; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < n && /\w/.test(s[j])) j++;
      const w = s.slice(i, j);
      out += CS_KW.has(w) ? sp('kw', w) : CS_TY.has(w) ? sp('ty', w) : (s[j] === '(' ? sp('fn', w) : esc(w));
      i = j; continue;
    }
    if (/\d/.test(c)) { let j = i; while (j < n && /[\d.F]/.test(s[j])) j++; out += sp('num', s.slice(i, j)); i = j; continue; }
    out += esc(c); i++;
  }
  return out;
}
const SQL_KW = /^(create|database|use|table|int|not|null|primary|key|auto_increment|varchar|date|char|decimal|tinyint|select|from|where|order|by|insert|into|values|update|set|delete|and|or|boolean)$/i;
function hlSQL(s) {
  let out = '', i = 0; const n = s.length;
  while (i < n) {
    const c = s[i];
    if (c === '-' && s[i + 1] === '-') { out += sp('com', s.slice(i)); break; }
    if (c === "'") { let j = i + 1; while (j < n && s[j] !== "'") j++; out += sp('str', s.slice(i, j + 1)); i = j + 1; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < n && /\w/.test(s[j])) j++; const w = s.slice(i, j); out += SQL_KW.test(w) ? sp('kw', w) : esc(w); i = j; continue; }
    if (/\d/.test(c)) { let j = i; while (j < n && /\d/.test(s[j])) j++; out += sp('num', s.slice(i, j)); i = j; continue; }
    out += esc(c); i++;
  }
  return out;
}
const hlLine = (l, lang) => (lang === 'sql' ? hlSQL(l) : hlCS(l)) || ' ';
function paintPre(pre) {
  const lang = pre.dataset.lang;
  if (pre.dataset.done || !lang) return; // trechos numerados já vêm prontos
  pre.innerHTML = pre.textContent.split('\n').map(l => `<span class="cl"><span class="tx">${hlLine(l, lang)}</span></span>`).join('');
  pre.dataset.done = '1';
  pre.tabIndex = 0;
}
const preCode = (lang, text) => `<pre class="code" data-lang="${lang}">${esc(text)}</pre>`;

/* ---------- trechos do código original ---------- */
const origLines = f => ORIG[f].replace(/\t/g, '    ').split('\n');
function findLine(lines, s, start = 0) { for (let i = start; i < lines.length; i++) if (lines[i].includes(s)) return i; return -1; }
function snipHTML(f, from, to, extra, hl, opts = {}) {
  const lines = origLines(f);
  const i = findLine(lines, from);
  if (i < 0) { console.warn('Trecho não encontrado:', f, from); return `<p class="warn-inline">Trecho não encontrado em ${esc(f)}.</p>`; }
  let j = to ? findLine(lines, to, i) : i; if (j < 0) j = i;
  j = Math.min(lines.length - 1, j + (+extra || 0));
  const hls = Array.isArray(hl) ? hl : (hl ? hl.split(';;') : []);
  const seg = lines.slice(i, j + 1);
  const ind = Math.min(...seg.filter(l => l.trim()).map(l => l.match(/^ */)[0].length));
  const lang = f.endsWith('.sql') ? 'sql' : 'cs';
  const rows = seg.map((l, k) => {
    const on = hls.some(x => x && l.includes(x));
    return `<span class="cl${on ? ' hl' : ''}"><span class="no">${i + k + 1}</span><span class="tx">${hlLine(l.slice(ind), lang)}</span></span>`;
  }).join('');
  const where = i === j ? `linha ${i + 1}` : `linhas ${i + 1}–${j + 1}`;
  return `<div class="codewrap k-orig${opts.cls ? ' ' + opts.cls : ''}"><div class="codebadge"><span>${BADGE.orig}</span><span class="cb-label">${esc(f)} · ${where}</span></div><pre class="code numbered" tabindex="0">${rows}</pre></div>`;
}

/* ---------- montagem de conteúdo dinâmico ---------- */
function mount(root) {
  $$('[data-snip]', root).forEach(el => {
    const [f, from, to, extra, hl] = el.dataset.snip.split('|');
    el.outerHTML = snipHTML(f, from, to, extra, hl);
  });
  $$('[data-ex]', root).forEach(el => renderEx(el.dataset.ex, el));
  $$('[data-widget]', root).forEach(el => { const w = WIDGETS[el.dataset.widget]; if (w) w(el, el.dataset.arg); });
  $$('pre.code[data-lang]', root).forEach(paintPre);
}

/* ---------- modal (substitui MessageBox e diálogos) ---------- */
function modal({ title, html, kind = 'info', ok = 'OK', onClose }) {
  const root = $('#modalRoot');
  const prev = document.activeElement;
  root.innerHTML = `<div class="modal-back"><div class="modal m-${kind}" role="dialog" aria-modal="true" aria-labelledby="mTitle">
    <div class="modal-title" id="mTitle">${title}</div><div class="modal-body">${html}</div>
    <div class="modal-actions"><button class="btn primary" type="button" id="mOk">${ok}</button></div></div></div>`;
  mount(root);
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); onClose && onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); if (e.key === 'Tab') { e.preventDefault(); $('#mOk').focus(); } };
  document.addEventListener('keydown', onKey);
  $('#mOk').onclick = close;
  $('#mOk').focus();
}

/* ============================================================
   EXERCÍCIOS
   ============================================================ */
const ALL_EX = Object.assign({}, EXERCISES, Object.fromEntries(ERRORS.map(r => [r.id, Object.assign({ title: r.title }, r.ex)])));
const TYPE_LABEL = { mc: 'Escolha', match: 'Associação', order: 'Ordenar', fill: 'Lacunas', code: 'Escreva o código', open: 'Resposta aberta' };
const TEXT_NOTE = '<p class="ex-note">A correção compara o texto e aceita diferenças de espaços e quebras de linha. Isso não é um compilador de C#: confira também no Visual Studio.</p>';

function renderEx(id, host, opts = {}) {
  const X = ALL_EX[id]; if (!X) { host.textContent = ''; return; }
  const st = S.ex[id] || (S.ex[id] = { tries: 0, hints: 0 });
  const el = document.createElement('article');
  el.className = 'exr'; el.id = 'ex-' + id;
  el.innerHTML = `
    <header class="ex-head"><span class="ex-type">${TYPE_LABEL[X.type]}</span><h3>${opts.noTitle ? '' : X.title}</h3><span class="ex-status" aria-live="polite"></span></header>
    <div class="ex-q" id="q-${id}">${X.q}</div>
    ${X.codeHtml || ''}
    <div class="ex-body"></div>
    <div class="ex-actions">
      ${X.type === 'open' ? '' : '<button class="btn primary" type="button" data-act="check">Verificar</button>'}
      ${X.hints && X.hints.length ? '<button class="btn" type="button" data-act="hint"></button>' : ''}
      <button class="btn ghost" type="button" data-act="reveal" hidden>${X.type === 'open' ? 'Ver solução comentada' : 'Mostrar resposta'}</button>
    </div>
    <ol class="ex-hints" aria-live="polite"></ol>
    <div class="ex-fb" aria-live="polite"></div>`;
  host.replaceWith(el);
  const body = $('.ex-body', el), fb = $('.ex-fb', el);
  const setFb = (kind, html) => { fb.className = 'ex-fb fb-' + kind; fb.innerHTML = html; mount(fb); };
  const status = () => {
    const s = $('.ex-status', el);
    s.textContent = st.ok ? 'Resolvido' : st.revealed ? 'Resposta vista' : st.tries ? 'Em andamento' : '';
    s.className = 'ex-status ' + (st.ok ? 'ok' : st.revealed ? 'seen' : '');
    const hintBtn = $('[data-act=hint]', el), n = (X.hints || []).length;
    if (hintBtn) { hintBtn.textContent = st.hints >= n ? 'Sem mais dicas' : `Dica ${st.hints + 1} de ${n}`; hintBtn.disabled = st.hints >= n; }
    $('.ex-hints', el).innerHTML = (X.hints || []).slice(0, st.hints).map(h => `<li>${h}</li>`).join('');
    $('[data-act=reveal]', el).hidden = !(X.type === 'open' || st.hints >= n || st.tries >= 2 || st.revealed);
  };
  const commit = ok => { st.tries++; if (ok) st.ok = true; save(); status(); };
  const T = TYPES[X.type];
  const api = T.render(X, id, st, body);
  $('[data-act=check]', el) && ($('[data-act=check]', el).onclick = () => {
    const r = api.check();
    if (r.empty) { setFb('info', r.msg || 'Responda antes de verificar.'); return; }
    commit(r.ok);
    if (r.ok) setFb('ok', `<p><b>Certo!</b> ${r.why || ''}</p>${X.explain ? `<p>${X.explain}</p>` : ''}${X.type === 'code' || X.type === 'fill' ? TEXT_NOTE : ''}`);
    else setFb('bad', `<p><b>Ainda não.</b> ${r.why || ''}</p><p class="muted">Ajuste e verifique de novo${(X.hints || []).length > st.hints ? ', ou peça uma dica' : ''}.</p>`);
  });
  $('[data-act=hint]', el) && ($('[data-act=hint]', el).onclick = () => { st.hints++; save(); status(); });
  $('[data-act=reveal]', el).onclick = () => { st.revealed = true; save(); status(); const html = api.reveal(); setFb('info', html); };
  status();
  if (st.ok && api.restoreOk) api.restoreOk();
  if (st.revealed && X.type === 'open') setFb('info', api.reveal());
}

const TYPES = {
  mc: {
    render(X, id, st, body) {
      const order = shuffle(X.opts.map((_, i) => i), id);
      body.innerHTML = `<div class="opts" role="radiogroup" aria-labelledby="q-${id}">${order.map(i => `
        <label class="opt"><input type="radio" name="r-${id}" value="${i}" ${st.val === i ? 'checked' : ''}><span>${X.opts[i].t}</span></label>`).join('')}</div>`;
      $$('input', body).forEach(r => r.onchange = () => { st.val = +r.value; save(); });
      const mark = i => $$('.opt', body).forEach(o => { const v = +$('input', o).value; o.classList.toggle('is-ok', X.opts[v].ok && v === i); o.classList.toggle('is-bad', !X.opts[v].ok && v === i); });
      return {
        check() { const c = $('input:checked', body); if (!c) return { empty: true, msg: 'Escolha uma opção.' }; const i = +c.value; mark(i); return { ok: !!X.opts[i].ok, why: X.opts[i].why }; },
        reveal() { const i = X.opts.findIndex(o => o.ok); $(`input[value="${i}"]`, body).checked = true; st.val = i; save(); mark(i); return `<p><b>Resposta:</b> ${X.opts[i].t}</p><p>${X.opts[i].why}</p>`; },
        restoreOk() { const i = X.opts.findIndex(o => o.ok); if (st.val === i) mark(i); }
      };
    }
  },
  match: {
    render(X, id, st, body) {
      const rights = shuffle([...new Set(X.pairs.map(p => p[1]))], id + 'm');
      const val = st.val || [];
      body.innerHTML = `<div class="match">${X.pairs.map((p, i) => `
        <div class="m-row"><label for="m-${id}-${i}" class="m-left">${esc(p[0])}</label>
        <select id="m-${id}-${i}" data-i="${i}"><option value="">Escolha…</option>${rights.map(r => `<option ${val[i] === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select>
        <span class="m-mark" aria-hidden="true"></span></div>`).join('')}</div>`;
      const sels = $$('select', body);
      sels.forEach(s => s.onchange = () => { st.val = sels.map(x => x.value); save(); s.closest('.m-row').className = 'm-row'; });
      const mark = () => sels.forEach((s, i) => { const ok = s.value === X.pairs[i][1]; s.closest('.m-row').className = 'm-row ' + (ok ? 'is-ok' : 'is-bad'); s.setAttribute('aria-invalid', ok ? 'false' : 'true'); });
      return {
        check() { if (sels.some(s => !s.value)) return { empty: true, msg: 'Escolha uma opção em todas as linhas.' }; mark(); const right = sels.filter((s, i) => s.value === X.pairs[i][1]).length; return { ok: right === sels.length, why: right === sels.length ? '' : `${right} de ${sels.length} certas. As linhas marcadas em vermelho ainda não estão certas.` }; },
        reveal() { sels.forEach((s, i) => s.value = X.pairs[i][1]); st.val = sels.map(x => x.value); save(); mark(); return `<p><b>Resposta:</b> ${X.explain || ''}</p>`; },
        restoreOk() { mark(); }
      };
    }
  },
  order: {
    render(X, id, st, body) {
      let cur = st.val;
      if (!cur) { cur = shuffle(X.items.map((_, i) => i), id); if (cur.every((v, i) => v === i)) cur.push(cur.shift()); }
      const draw = (marks) => {
        body.innerHTML = `<ol class="order">${cur.map((v, pos) => `
          <li class="o-item${marks ? (v === pos ? ' is-ok' : ' is-bad') : ''}"><span class="o-txt">${esc(X.items[v])}</span>
          <span class="o-btns"><button type="button" class="ibtn" data-up="${pos}" aria-label="Subir: ${esc(X.items[v])}" ${pos === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="ibtn" data-down="${pos}" aria-label="Descer: ${esc(X.items[v])}" ${pos === cur.length - 1 ? 'disabled' : ''}>↓</button></span></li>`).join('')}</ol>`;
        $$('[data-up]', body).forEach(b => b.onclick = () => move(+b.dataset.up, -1));
        $$('[data-down]', body).forEach(b => b.onclick = () => move(+b.dataset.down, 1));
      };
      const move = (p, d) => { const q = p + d; [cur[p], cur[q]] = [cur[q], cur[p]]; st.val = cur; save(); draw(); const btn = $(`[data-${d < 0 ? 'up' : 'down'}="${q}"]`, body) || $(`[data-${d < 0 ? 'down' : 'up'}="${q}"]`, body); btn && btn.focus(); };
      draw();
      return {
        check() { draw(true); const right = cur.filter((v, i) => v === i).length; return { ok: right === cur.length, why: right === cur.length ? '' : `${right} de ${cur.length} itens na posição certa (verdes).` }; },
        reveal() { cur = X.items.map((_, i) => i); st.val = cur; save(); draw(true); return `<p><b>Ordem correta:</b> ${X.explain || ''}</p>`; },
        restoreOk() { draw(true); }
      };
    }
  },
  fill: {
    render(X, id, st, body) {
      const val = st.val || [];
      const parts = X.code.split(/⟦(\d+)⟧/);
      let html = '';
      parts.forEach((p, k) => {
        if (k % 2 === 0) html += esc(p);
        else { const b = +p; const w = Math.max(...X.blanks[b].map(a => a.length)) + 2; html += `<input class="blank" data-b="${b}" size="${w}" aria-label="Lacuna ${b + 1}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val[b] || '')}">`; }
      });
      body.innerHTML = `<pre class="code fillcode">${html}</pre>`;
      const ins = $$('input', body).sort((a, b) => a.dataset.b - b.dataset.b);
      ins.forEach(i => i.oninput = () => { st.val = ins.map(x => x.value); save(); i.classList.remove('is-ok', 'is-bad'); });
      const okAt = b => X.blanks[b].some(a => norm(a) === norm(ins[b].value));
      const mark = () => ins.forEach((i, b) => { const ok = okAt(b); i.classList.toggle('is-ok', ok); i.classList.toggle('is-bad', !ok); i.setAttribute('aria-invalid', ok ? 'false' : 'true'); });
      return {
        check() { if (ins.some(i => !i.value.trim())) return { empty: true, msg: 'Preencha todas as lacunas.' }; mark(); const right = ins.filter((_, b) => okAt(b)).length; return { ok: right === ins.length, why: right === ins.length ? '' : `${right} de ${ins.length} lacunas certas. Lembre: o C# diferencia maiúsculas e minúsculas.` }; },
        reveal() { ins.forEach((i, b) => i.value = X.blanks[b][0]); st.val = ins.map(x => x.value); save(); mark(); return `<p><b>Resposta:</b> ${X.explain || ''}</p>`; },
        restoreOk() { mark(); }
      };
    }
  },
  code: {
    render(X, id, st, body) {
      body.innerHTML = `<label class="sr" for="c-${id}">Seu código</label><textarea class="codearea" id="c-${id}" rows="${Math.max(6, (X.start || '').split('\n').length + 2)}" spellcheck="false" autocapitalize="off" placeholder="Escreva aqui">${esc(st.val ?? X.start ?? '')}</textarea>`;
      const ta = $('textarea', body);
      ta.oninput = () => { st.val = ta.value; save(); };
      ta.onkeydown = e => { if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey) { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); ta.oninput(); } };
      return {
        check() { if (!ta.value.trim()) return { empty: true, msg: 'Escreva o código antes de verificar.' }; const n = norm(ta.value); const fail = X.checks.filter(c => !c.re.test(n)); return { ok: !fail.length, why: fail.length ? fail[0].msg + (fail.length > 1 ? ` (mais ${fail.length - 1} ponto${fail.length > 2 ? 's' : ''} a revisar)` : '') : 'Seu código tem todas as partes esperadas.' }; },
        reveal() { return `<p><b>Uma solução:</b></p>${code('cs', X.solution, X.id === 'e23' ? 'orig' : 'equiv')}${TEXT_NOTE}`; }
      };
    }
  },
  open: {
    render(X, id, st, body) {
      body.innerHTML = `<label class="sr" for="o-${id}">Sua resposta</label><textarea class="codearea" id="o-${id}" rows="10" spellcheck="false" placeholder="${esc(X.placeholder || '')}">${esc(st.val || '')}</textarea>`;
      const ta = $('textarea', body);
      ta.oninput = () => { st.val = ta.value; save(); };
      return {
        reveal() {
          const c = st.crit || [];
          setTimeout(() => {
            const box = document.getElementById('crit-' + id); if (!box) return;
            $$('input', box).forEach((cb, i) => cb.onchange = () => { c[i] = cb.checked; st.crit = c; st.ok = X.criteria.every((_, k) => c[k]); save(); const s = cb.closest('.exr'); const stEl = s && $('.ex-status', s); if (stEl) { stEl.textContent = st.ok ? 'Resolvido' : 'Resposta vista'; stEl.className = 'ex-status ' + (st.ok ? 'ok' : 'seen'); } });
          });
          return `${X.solution}<fieldset class="crit" id="crit-${id}"><legend>Autoavaliação: compare com a sua resposta</legend>${X.criteria.map((t, i) => `<label><input type="checkbox" ${c[i] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset><p class="muted">Quando todos os critérios estiverem marcados, o exercício conta como resolvido.</p>`;
        }
      };
    }
  }
};

/* ============================================================
   WIDGETS DAS AULAS
   ============================================================ */
const SEED = [
  { id: 1, nome: 'Ana Beatriz Souza', dtnasc: '2009-03-15', unidade: 'B', serie: 1, turma: 'A' },
  { id: 2, nome: 'Carlos Eduardo Lima', dtnasc: '2008-07-22', unidade: 'F', serie: 2, turma: 'B' },
  { id: 3, nome: 'Mariana Costa', dtnasc: '2007-11-05', unidade: 'B', serie: 3, turma: 'A' },
  { id: 4, nome: 'Bruno Henrique Alves', dtnasc: '2008-01-30', unidade: 'F', serie: 2, turma: 'C' },
  { id: 5, nome: 'Larissa Fernandes', dtnasc: '2009-09-12', unidade: 'B', serie: 1, turma: 'B' }
];
const COLS = ['id', 'nome', 'dtnasc', 'unidade', 'serie', 'turma'];
const gridVal = (r, c) => c === 'dtnasc' ? br(r.dtnasc) + ' 00:00:00' : String(r[c]);
const dbVal = (r, c) => c === 'dtnasc' ? r.dtnasc : String(r[c]);

const WIDGETS = {
  crudMini(el) {
    let rows, next, sel = null;
    const reset = () => { rows = [{ id: 1, nome: 'Ana', turma: 'A' }, { id: 2, nome: 'Bruno', turma: 'B' }, { id: 3, nome: 'Davi', turma: 'A' }]; next = 4; sel = null; };
    reset();
    el.innerHTML = `<div class="widget">
      <div class="w-cols"><div class="w-main">
        <div class="tablewrap"><table class="t mini" aria-label="tblAlunos (exemplo)"><thead></thead><tbody></tbody></table></div>
        <p class="w-hint">Próximo id do auto_increment: <b class="nx"></b></p>
      </div>
      <div class="w-side"><div class="anat" aria-live="polite"><b>Clique numa célula</b><span>para ver se é coluna, registro ou chave primária.</span></div></div></div>
      <div class="w-ctrls">
        <label>Nome <input class="in-nome" value="Elisa" maxlength="20"></label>
        <label>Turma <select class="in-turma"><option>A</option><option selected>B</option><option>C</option></select></label>
      </div>
      <div class="w-btns">
        <button type="button" class="btn crud-c" data-op="c"><b>C</b> Cadastrar</button>
        <button type="button" class="btn crud-r" data-op="r"><b>R</b> Listar</button>
        <button type="button" class="btn crud-u" data-op="u"><b>U</b> Alterar turma do selecionado</button>
        <button type="button" class="btn crud-d" data-op="d"><b>D</b> Excluir selecionado</button>
        <button type="button" class="btn ghost" data-op="reset">Restaurar</button>
      </div>
      <div class="w-out" aria-live="polite"></div></div>`;
    const draw = (flash = {}) => {
      $('thead', el).innerHTML = `<tr>${['id', 'nome', 'turma'].map(c => `<th><button type="button" class="cellbtn" data-col="${c}">${c}${c === 'id' ? ' 🔑' : ''}</button></th>`).join('')}</tr>`;
      $('tbody', el).innerHTML = rows.map(r => `<tr class="${sel === r.id ? 'sel' : ''} ${flash[r.id] || ''}">${['id', 'nome', 'turma'].map(c => `<td><button type="button" class="cellbtn" data-id="${r.id}" data-col="${c}">${esc(r[c])}</button></td>`).join('')}</tr>`).join('');
      $('.nx', el).textContent = next;
    };
    const anat = (t, d) => { $('.anat', el).innerHTML = `<b>${t}</b><span>${d}</span>`; };
    const out = (sql, msg) => { $('.w-out', el).innerHTML = `${preCode('sql', sql)}<p>${msg}</p>`; paintPre($('pre', $('.w-out', el))); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.col && !b.dataset.id) { anat(`Coluna “${b.dataset.col}”`, b.dataset.col === 'id' ? 'Coluna de chave primária com auto_increment: cada registro tem um id diferente, gerado pelo MySQL.' : 'Uma coluna é uma característica que todos os registros têm. No C#, vira um atributo da classe.'); return; }
      if (b.dataset.id) {
        sel = +b.dataset.id; const r = rows.find(x => x.id === sel); draw();
        if (b.dataset.col === 'id') anat(`Chave primária: id = ${r.id}`, 'Este número identifica o registro. É ele que vai no WHERE de UPDATE e DELETE.');
        else anat(`Registro (linha) do id ${r.id}`, `Você clicou no valor “${esc(r[b.dataset.col])}” da coluna ${b.dataset.col}. A linha inteira (id ${r.id}, ${esc(r.nome)}, turma ${r.turma}) é um registro. Ele ficou selecionado.`);
        return;
      }
      const op = b.dataset.op, nome = $('.in-nome', el).value.trim() || 'Elisa', turma = $('.in-turma', el).value;
      if (op === 'reset') { reset(); draw(); $('.w-out', el).innerHTML = ''; return; }
      if (op === 'c') { const id = next++; rows.push({ id, nome, turma }); draw({ [id]: 'flash-new' }); out(`INSERT INTO tblAlunos VALUES (null, '${nome}', '${turma}');`, `Registro novo no fim da tabela. O id ${id} veio do auto_increment. (Exemplo simplificado com 3 colunas.)`); }
      if (op === 'r') { const sorted = rows.slice().sort(byNome); rows = sorted; draw(Object.fromEntries(rows.map(r => [r.id, 'flash-read']))); out('SELECT * FROM tblAlunos ORDER BY nome;', 'O SELECT só lê: nada mudou no banco. As linhas vieram em ordem de nome.'); }
      if (op === 'u' || op === 'd') {
        if (sel === null) { $('.w-out', el).innerHTML = '<p class="warn-inline">Clique primeiro numa linha para selecionar o registro. Alterar e excluir precisam saber qual id.</p>'; return; }
        if (op === 'u') { rows.find(r => r.id === sel).turma = turma; draw({ [sel]: 'flash-upd' }); out(`UPDATE tblAlunos SET turma = '${turma}' WHERE id = '${sel}';`, `Só o registro de id ${sel} mudou, por causa do WHERE.`); }
        else { const id = sel; const tr = $(`button[data-id="${id}"]`, el).closest('tr'); tr.classList.add('flash-del'); setTimeout(() => { rows = rows.filter(r => r.id !== id); sel = null; draw(); }, reduced() ? 0 : 450); out(`DELETE FROM tblAlunos WHERE id = '${id}';`, `O registro ${id} saiu. O número ${id} não será reaproveitado: o próximo cadastro recebe ${next}.`); }
      }
    });
    draw();
  },

  fluxo(el) {
    const BOX = [['frm', 'FrmAlunos', 'tela e eventos'], ['obj', 'objAluno', 'Aluno.cs'], ['con', 'db', 'Conexao.cs'], ['db', 'MySQL', 'DB_EscolaCRUD']];
    const SC = {
      cad: { name: 'Cadastrar (ida)', steps: [
        { at: 0, t: 'O clique em Cadastrar roda <code>btnCadastrar_Click</code>, que lê <code>txtNome.Text</code>, <code>dtpNascimento.Value</code>, os RadioButtons e <code>cmbTurma.Text</code>.' },
        { a: 0, dir: 'r', at: 1, carry: 'valores lidos', t: '<code>objAluno.SetNome(nomeAluno)</code> e os outros Set guardam cada valor num atributo do objeto.' },
        { at: 1, t: '<code>objAluno.InserirAluno()</code> monta o texto <code>INSERT INTO tblAlunos VALUES (null, ...)</code> com os atributos.' },
        { a: 1, dir: 'r', at: 2, carry: 'string SQL', t: '<code>db.ExecutarComando(inserir)</code> entrega o texto para a Conexao.' },
        { a: 2, dir: 'r', at: 3, carry: 'INSERT', t: '<code>Conectar()</code> abre a conexão e <code>ExecuteNonQuery()</code> envia o INSERT.' },
        { at: 3, t: 'O MySQL grava a linha e gera o id com o auto_increment.' },
        { a: 2, dir: 'l', at: 2, carry: '1 linha afetada', t: 'O MySQL responde quantas linhas foram afetadas (1). O original ignora esse número. O <code>finally</code> fecha a conexão.' },
        { at: 0, t: 'De volta ao formulário: <code>MostrarDadosAlunos()</code> faz a volta com o SELECT (veja o cenário Listar), aparece a MessageBox e <code>LimparDados()</code> esvazia a tela.' }] },
      lis: { name: 'Listar (ida e volta)', steps: [
        { at: 0, t: 'O evento <code>Load</code> (ou o fim de um Cadastrar/Alterar/Excluir) chama <code>MostrarDadosAlunos()</code>.' },
        { a: 0, dir: 'r', at: 1, carry: 'pedido', t: '<code>objAluno.ListarAlunos()</code> é chamado.' },
        { a: 1, dir: 'r', at: 2, carry: 'string SELECT', t: '<code>db.ExecutarConsulta("SELECT * FROM tblAlunos ORDER BY nome;")</code>' },
        { a: 2, dir: 'r', at: 3, carry: 'SELECT', t: 'A Conexao abre e o <code>MySqlDataAdapter</code> executa o SELECT.' },
        { a: 2, dir: 'l', at: 2, carry: 'linhas', t: 'O MySQL devolve as linhas e <code>dados.Fill(dt)</code> coloca tudo no <code>DataTable</code>.' },
        { a: 1, dir: 'l', at: 1, carry: 'DataTable', t: '<code>return dt;</code> (o finally fecha a conexão antes) devolve o DataTable para o Aluno.' },
        { a: 0, dir: 'l', at: 0, carry: 'DataTable', t: '<code>return db.ExecutarConsulta(consulta);</code> devolve o mesmo DataTable para o formulário.' },
        { at: 0, t: '<code>dtgAlunos.DataSource = ...</code> e a grade mostra as linhas.' }] }
    };
    let sc = 'cad', i = 0;
    el.innerHTML = `<div class="widget"><div class="seg" role="group" aria-label="Cenário">${Object.entries(SC).map(([k, v]) => `<button type="button" class="segb" data-sc="${k}">${v.name}</button>`).join('')}</div>
      <div class="flow"></div><div class="flow-text" aria-live="polite"></div>
      <div class="stepper"><button type="button" class="btn" data-mv="-1">← Voltar</button><span class="stepn"></span><button type="button" class="btn primary" data-mv="1">Avançar →</button></div></div>`;
    const draw = () => {
      const s = SC[sc].steps[i];
      $$('.segb', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.sc === sc));
      let h = '';
      BOX.forEach((b, k) => {
        h += `<div class="fbox${s.at === k ? ' on' : ''}"><b>${b[1]}</b><small>${b[2]}</small></div>`;
        if (k < BOX.length - 1) { const on = s.a === k; h += `<div class="farrow${on ? ' on dir-' + s.dir : ''}" aria-hidden="true"><span>${on ? (s.dir === 'r' ? '→' : '←') : '⇄'}</span>${on ? `<em>${s.carry}</em>` : ''}</div>`; }
      });
      $('.flow', el).innerHTML = h;
      $('.flow-text', el).innerHTML = `<p>${s.t}</p>`;
      $('.stepn', el).textContent = `Passo ${i + 1} de ${SC[sc].steps.length}`;
      $('[data-mv="-1"]', el).disabled = i === 0; $('[data-mv="1"]', el).disabled = i === SC[sc].steps.length - 1;
    };
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.sc) { sc = b.dataset.sc; i = 0; } if (b.dataset.mv) i += +b.dataset.mv; draw(); });
    draw();
  },

  inspetor(el) {
    const C = Object.fromEntries(CONTROLS.map(c => [c.name, c]));
    let showName = false;
    const ctl = (n, cls, inner) => `<button type="button" class="ins ${cls}" data-n="${n}"><span class="ins-tag">${n}</span>${inner}</button>`;
    el.innerHTML = `<div class="widget"><label class="switch"><input type="checkbox" class="sw-name"> Mostrar a propriedade Name em cima de cada controle</label>
      <div class="wf ins-form">
        ${ctl('FrmAlunos', 'wf-title', '<span>FrmAlunos - CARLA CARDOSO GOMES MOREIRA</span>')}
        <div class="wf-body ins-body">
          <div class="ins-col">
            <div class="wf-lbl">ID</div>${ctl('txtID', 'wf-txt dis', '')}
            <div class="wf-lbl">Nome do aluno:</div>${ctl('txtNome', 'wf-txt', '')}
            ${ctl('grpUnidade', 'wf-grp', '<span class="wf-grp-t">Unidade</span>' + ctl('rdbBarroca', 'wf-rdb', '○ Barroca') + ctl('rdbFloresta', 'wf-rdb', '○ Floresta'))}
            ${ctl('grpSerie', 'wf-grp', '<span class="wf-grp-t">Série</span>' + ctl('rdb1Serie', 'wf-rdb', '○ 1ª') + '<span class="wf-rdb faux">○ 2ª</span><span class="wf-rdb faux">○ 3ª</span>')}
            <div class="wf-lbl">Data Nascimento:</div>${ctl('dtpNascimento', 'wf-dtp', '15/03/2009 ▾')}
            <div class="wf-lbl">Turma:</div>${ctl('cmbTurma', 'wf-cmb', 'A ▾')}
          </div>
          <div class="ins-grid">${ctl('dtgAlunos', 'wf-dtg', '<span class="dtg-faux"><i>id</i><i>nome</i><i>dtnasc</i><i>…</i></span><span class="dtg-faux"><i>1</i><i>Ana Beatriz…</i><i>15/03/2009</i><i>…</i></span>')}</div>
          <div class="ins-btns">${['btnCadastrar', 'btnAlterar', 'btnExcluir', 'btnLimpar', 'btnSair'].map(n => ctl(n, 'wf-btn', C[n].text)).join('')}</div>
        </div>
      </div>
      <div class="ins-panel" aria-live="polite"><p class="muted">Clique em um controle da janela acima.</p></div></div>`;
    el.addEventListener('change', e => { if (e.target.classList.contains('sw-name')) { showName = e.target.checked; $('.ins-form', el).classList.toggle('show-names', showName); } });
    el.addEventListener('click', e => {
      const b = e.target.closest('.ins'); if (!b) return; e.stopPropagation();
      $$('.ins', el).forEach(x => x.classList.toggle('picked', x === b));
      const c = C[b.dataset.n];
      $('.ins-panel', el).innerHTML = `<dl class="kv"><dt>Tipo</dt><dd>${c.type}</dd><dt>Name</dt><dd><code>${c.name}</code></dd><dt>Text</dt><dd>${esc(c.text)}</dd><dt>O código usa</dt><dd>${esc(c.prop)}</dd><dt>Evento</dt><dd>${esc(c.ev)}</dd></dl>${c.note ? `<p>${esc(c.note)}</p>` : ''}${snipHTML('FrmAlunos.designer.cs', c.d)}`;
    });
  },

  objeto(el) {
    let obj = null, last = '';
    const DEF = () => ({ id: 0, serie: 0, nome: null, turma: '\0', unidade: '\0', dtnasc: null });
    const fmt = (k, v) => k === 'nome' ? qs(v) : (k === 'turma' || k === 'unidade') ? qc(v) : k === 'dtnasc' ? (v ? br(v) : '01/01/0001 00:00:00') : String(v);
    const types = { id: 'int', serie: 'int', nome: 'string', turma: 'char', unidade: 'char', dtnasc: 'DateTime' };
    el.innerHTML = `<div class="widget"><div class="w-btns"><button type="button" class="btn primary" data-a="new">Aluno objAluno = new Aluno();</button></div>
      <div class="w-cols"><div class="w-main obj-box" aria-live="polite"></div>
      <div class="w-side obj-methods">
        <div class="mrow"><code>setId(</code><input type="number" class="p-id" value="7" aria-label="Parâmetro id"><code>)</code><button type="button" class="btn sm" data-a="setId">chamar</button></div>
        <div class="mrow"><code>SetNome(</code><input class="p-nome" value="Ana" aria-label="Parâmetro nome"><code>)</code><button type="button" class="btn sm" data-a="SetNome">chamar</button></div>
        <div class="mrow"><code>SetSerie(</code><select class="p-serie" aria-label="Parâmetro serie"><option>1</option><option selected>2</option><option>3</option></select><code>)</code><button type="button" class="btn sm" data-a="SetSerie">chamar</button></div>
        <div class="mrow"><code>SetTurma(</code><select class="p-turma" aria-label="Parâmetro turma"><option>A</option><option>B</option><option>C</option></select><code>)</code><button type="button" class="btn sm" data-a="SetTurma">chamar</button></div>
        <div class="mrow"><code>SetUnidade(</code><select class="p-un" aria-label="Parâmetro unidade"><option>B</option><option>F</option></select><code>)</code><button type="button" class="btn sm" data-a="SetUnidade">chamar</button></div>
        <div class="mrow"><code>SetDtNasc(</code><input type="date" class="p-dt" value="2009-03-15" aria-label="Parâmetro dtnasc"><code>)</code><button type="button" class="btn sm" data-a="SetDtNasc">chamar</button></div>
        <div class="mrow gets"><button type="button" class="btn sm" data-a="GetNome">GetNome()</button><button type="button" class="btn sm" data-a="GetSerie">GetSerie()</button><button type="button" class="btn sm" data-a="GetId">GetId()</button></div>
      </div></div><div class="w-out" aria-live="polite"></div></div>`;
    const draw = (changed) => {
      $('.obj-box', el).innerHTML = obj ? `<div class="objcard"><div class="objhead">objAluno <small>: Aluno</small></div>${Object.keys(types).map(k => `<div class="attr${changed === k ? ' chg' : ''}"><span class="a-t">private ${types[k]}</span><span class="a-k">${k}</span><span class="a-v">${esc(fmt(k, obj[k]))}</span></div>`).join('')}</div>`
        : `<div class="objcard empty"><div class="objhead">objAluno = <i>null</i></div><p>Ainda não existe objeto. Sem o <code>new</code>, qualquer chamada como <code>objAluno.SetNome(...)</code> daria <b>NullReferenceException</b>.</p></div>`;
      $$('.obj-methods button', el).forEach(b => b.disabled = !obj);
    };
    const out = html => { $('.w-out', el).innerHTML = html; $$('pre.code', $('.w-out', el)).forEach(paintPre); };
    el.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'new') { obj = DEF(); draw(); out(`<p>Um objeto novo nasceu com os <b>valores padrão</b> do C#: 0 para int, <code>null</code> para string, <code>'\\0'</code> (caractere nulo) para char e 01/01/0001 para DateTime.</p>`); return; }
      const sets = { setId: ['id', () => parseInt($('.p-id', el).value || '0', 10), 'int'], SetNome: ['nome', () => $('.p-nome', el).value, 'string'], SetSerie: ['serie', () => +$('.p-serie', el).value, 'int'], SetTurma: ['turma', () => $('.p-turma', el).value, 'char'], SetUnidade: ['unidade', () => $('.p-un', el).value, 'char'], SetDtNasc: ['dtnasc', () => $('.p-dt', el).value || todayISO(), 'DateTime'] };
      if (sets[a]) {
        const [k, get, t] = sets[a]; const v = get(); obj[k] = v; draw(k);
        const shown = fmt(k, v);
        out(`<p>Chamou <code>objAluno.${a}(${esc(shown)})</code>. Dentro do método, o parâmetro <code>${k}</code> (${t}) vale <code>${esc(shown)}</code> e roda:</p>${preCode('cs', `this.${k} = ${k};   // atributo ${k} recebe o parâmetro ${k}`)}<p class="muted">${a} é <code>void</code>: não devolve nada, só guarda.</p>`);
        return;
      }
      const gets = { GetNome: ['nome', 'string'], GetSerie: ['serie', 'int'], GetId: ['id', 'int'] };
      if (gets[a]) { const [k, t] = gets[a]; out(`<p><code>objAluno.${a}()</code> executou <code>return this.${k};</code> e <b>retornou</b> <code>${esc(fmt(k, obj[k]))}</code>, um valor do tipo ${t}.</p>`); }
    });
    draw();
  },

  connstr(el) {
    const parts = [
      ['Persist security info = false', 'Depois de conectar, a senha não fica guardada na propriedade ConnectionString do objeto. É uma opção de segurança; não muda nada no funcionamento do CRUD.'],
      ['server = localhost', 'Endereço do servidor MySQL. localhost = este mesmo computador (como no XAMPP do laboratório).'],
      ['database = DB_EscolaCRUD', 'Nome do banco, o mesmo do create database do script. Na prova, é o que mais muda.'],
      ['uid = root', 'Usuário do MySQL. root é o administrador padrão.'],
      ['pwd=', 'Senha. Vazia aqui, o padrão do XAMPP. Se o laboratório tiver senha, ela vai depois do =.']
    ];
    el.innerHTML = `<div class="widget"><div class="chips">${parts.map((p, i) => `<button type="button" class="chip" data-i="${i}">${esc(p[0])};</button>`).join('')}</div><div class="w-out chip-out" aria-live="polite"><p class="muted">Clique numa parte da string.</p></div>
      <h4>Monte a sua</h4><div class="w-ctrls"><label>server <input class="c-s" value="localhost"></label><label>database <input class="c-d" value="DB_LojaCRUD"></label><label>uid <input class="c-u" value="root"></label><label>pwd <input class="c-p" value=""></label></div><div class="c-res"></div></div>`;
    const res = () => { $('.c-res', el).innerHTML = preCode('cs', `string dadosConexao = "Persist security info = false; server = ${$('.c-s', el).value}; database = ${$('.c-d', el).value}; uid = ${$('.c-u', el).value}; pwd=${$('.c-p', el).value};";`); paintPre($('.c-res pre', el)); };
    el.addEventListener('input', res);
    el.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', el).forEach(c => c.classList.toggle('on', c === b)); $('.chip-out', el).innerHTML = `<p><b>${esc(parts[b.dataset.i][0])}</b><br>${parts[b.dataset.i][1]}</p>`; });
    res();
  },

  tryflow(el) {
    const L = origLines('Conexao.cs');
    const a = findLine(L, 'private void Conectar()'), b = findLine(L, 'public void ExecutarComando'), c = findLine(L, 'conn.Close();', b) + 2;
    const lines = L.slice(a, c).map((t, k) => ({ t, n: a + k + 1 }));
    const role = t => {
      const R = [['private void Conectar', 'c_head'], ['string dadosConexao', 'c_str'], ['conn = new MySqlConnection', 'c_new'], ['conn.Open()', 'c_open'], ['catch(MySqlException', 'c_catch'], ['throw new Exception($"A conex', 'c_throw'], ['public void ExecutarComando', 'e_head'], ['Conectar();', 'e_con'], ['MySqlCommand comando', 'e_cmd'], ['ExecuteNonQuery', 'e_exec'], ['catch (MySqlException', 'e_catch'], ['throw new Exception($"Instru', 'e_throw'], ['finally', 'e_fin'], ['conn.Close()', 'e_close']];
      const f = R.find(r => t.includes(r[0])); return f ? f[1] : '';
    };
    const SC = {
      ok: { name: 'Tudo certo', run: ['e_head', 'e_con', 'c_head', 'c_str', 'c_new', 'c_open', 'e_cmd', 'e_exec', 'e_fin', 'e_close'], fail: [], out: '<p><b>Resultado:</b> o comando foi executado, o finally fechou a conexão e o método terminou normalmente. O formulário segue para MostrarDadosAlunos e a MessageBox de sucesso.</p>' },
      conn: { name: 'MySQL desligado', run: ['e_head', 'e_con', 'c_head', 'c_str', 'c_new', 'c_catch', 'c_throw'], fail: ['c_open'], out: '<p><b>Resultado:</b> <code>conn.Open()</code> falhou, o catch do Conectar lançou “A conexão não foi estabelecida.” e o erro saiu pela linha <code>Conectar();</code>, que está <b>fora</b> do try do ExecutarComando. Por isso o finally dele não roda (a conexão nem chegou a abrir).</p><p>O erro sobe: ExecutarComando → InserirAluno → btnCadastrar_Click. Sem try/catch no botão, vira exceção não tratada. A MessageBox de sucesso não aparece.</p>' },
      sql: { name: 'SQL com erro', run: ['e_head', 'e_con', 'c_head', 'c_str', 'c_new', 'c_open', 'e_cmd', 'e_catch', 'e_throw', 'e_fin', 'e_close'], fail: ['e_exec'], out: '<p><b>Resultado:</b> <code>ExecuteNonQuery()</code> foi recusado pelo MySQL. O catch lançou “Instrução não executada.” com o SQL e a mensagem do MySQL, mas <b>antes</b> de o erro sair, o finally fechou a conexão.</p><p>Depois, o erro sobe até o botão, como no outro cenário.</p>' }
    };
    let sc = 'ok';
    el.innerHTML = `<div class="widget"><div class="seg" role="group" aria-label="Cenário">${Object.entries(SC).map(([k, v]) => `<button type="button" class="segb" data-sc="${k}">${v.name}</button>`).join('')}</div>
      <div class="legend"><span class="lg run">executou</span><span class="lg fail">falhou aqui</span><span class="lg skip">não executou</span></div><div class="tf-code"></div><div class="w-out" aria-live="polite"></div></div>`;
    const draw = () => {
      const s = SC[sc];
      $$('.segb', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.sc === sc));
      const ind = Math.min(...lines.filter(l => l.t.trim()).map(l => l.t.match(/^ */)[0].length));
      $('.tf-code', el).innerHTML = `<div class="codewrap k-orig"><div class="codebadge"><span>${BADGE.orig}</span><span class="cb-label">Conexao.cs</span></div><pre class="code numbered" tabindex="0">${lines.map(l => { const r = role(l.t); const cls = !r ? '' : s.fail.includes(r) ? ' fail' : s.run.includes(r) ? ' run' : ' skip'; return `<span class="cl${cls}"><span class="no">${l.n}</span><span class="tx">${hlLine(l.t.slice(ind), 'cs')}</span></span>`; }).join('')}</pre></div>`;
      $('.w-out', el).innerHTML = s.out;
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b) { sc = b.dataset.sc; draw(); } });
    draw();
  },

  montaInsert(el) {
    el.innerHTML = `<div class="widget"><div class="w-ctrls grid2">
      <label>txtNome.Text <input class="i-nome" value="Ana Clara"></label>
      <label>dtpNascimento.Value <input type="date" class="i-dt" value="2009-03-15"></label>
      <fieldset><legend>grpUnidade</legend><label><input type="radio" name="mi-u" value="B"> rdbBarroca</label><label><input type="radio" name="mi-u" value="F" checked> rdbFloresta</label><label><input type="radio" name="mi-u" value=""> nenhum</label></fieldset>
      <fieldset><legend>grpSerie</legend><label><input type="radio" name="mi-s" value="1"> rdb1Serie</label><label><input type="radio" name="mi-s" value="2" checked> rdb2Serie</label><label><input type="radio" name="mi-s" value="3"> rdb3Serie</label><label><input type="radio" name="mi-s" value="0"> nenhum</label></fieldset>
      <label>cmbTurma.Text <select class="i-t"><option value="">(nenhuma)</option><option>A</option><option selected>B</option><option>C</option><option>D</option><option>E</option></select></label>
      </div><div class="mi-out" aria-live="polite"></div></div>`;
    const draw = () => {
      const nome = $('.i-nome', el).value, dt = $('.i-dt', el).value || todayISO(), u = $('input[name=mi-u]:checked', el).value, s = $('input[name=mi-s]:checked', el).value, t = $('.i-t', el).value;
      const un = u || ' ';
      let h = `<div class="tablewrap"><table class="t kvt"><thead><tr><th>Variável</th><th>Valor</th><th>De onde veio</th></tr></thead><tbody>
        <tr><td><code>nomeAluno</code></td><td><code>${esc(qs(nome))}</code></td><td>txtNome.Text</td></tr>
        <tr><td><code>dtnascAluno</code></td><td><code>${br(dt)}</code></td><td>dtpNascimento.Value</td></tr>
        <tr><td><code>turmaAluno</code></td><td>${t ? `<code>'${t}'</code>` : '<b class="bad-t">FormatException</b>'}</td><td>char.Parse(cmbTurma.Text)</td></tr>
        <tr><td><code>unidadeAluno</code></td><td><code>'${un}'</code></td><td>${u === 'B' ? 'if (rdbBarroca.Checked)' : u === 'F' ? 'else if (rdbFloresta.Checked)' : 'else (nada marcado)'}</td></tr>
        <tr><td><code>serieAluno</code></td><td><code>${s}</code></td><td>ternário: ${s === '0' ? 'nenhum Checked → 0' : `rdb${s}Serie.Checked → ${s}`}</td></tr>
        </tbody></table></div>`;
      if (!t) h += `<p class="warn-inline">Com a turma vazia, <code>char.Parse("")</code> lança <b>FormatException</b> logo na leitura. O INSERT nem seria montado.</p>`;
      else {
        h += `<p>Texto que <code>InserirAluno()</code> montaria:</p>${preCode('sql', `INSERT INTO tblAlunos VALUES (null, '${nome}','${sqlDate(dt)}','${un}', '${s}', '${t}');`)}`;
        if (/'/.test(nome)) h += `<p class="warn-inline">O apóstrofo no nome fecha o texto do SQL antes da hora: o MySQL recusaria esse comando. Veja <a href="#erros">Erros comuns</a>.</p>`;
      }
      $('.mi-out', el).innerHTML = h; $$('pre.code', el).forEach(p => { delete p.dataset.done; paintPre(p); });
    };
    el.addEventListener('input', draw); el.addEventListener('change', draw); draw();
  },

  gridIndex(el) {
    let ord = 'nome';
    el.innerHTML = `<div class="widget"><div class="seg" role="group" aria-label="Ordenação"><button type="button" class="segb" data-o="nome">ORDER BY nome</button><button type="button" class="segb" data-o="id">ORDER BY id</button></div>
      <div class="tablewrap"><table class="t grid-t" aria-label="dtgAlunos"><thead></thead><tbody></tbody></table></div><div class="w-out" aria-live="polite"><p class="muted">Clique numa linha, no cabeçalho ou na linha * do fim.</p></div></div>`;
    const draw = () => {
      $$('.segb', el).forEach(b => b.setAttribute('aria-pressed', b.dataset.o === ord));
      const rows = SEED.slice().sort(ord === 'nome' ? byNome : (a, b) => a.id - b.id);
      $('thead', el).innerHTML = `<tr><th class="rh"></th>${COLS.map(c => `<th><button type="button" class="cellbtn" data-h="1">${c}</button></th>`).join('')}</tr>`;
      $('tbody', el).innerHTML = rows.map((r, i) => `<tr><td class="rh">${i}</td>${COLS.map(c => `<td><button type="button" class="cellbtn" data-r="${i}" data-id="${r.id}">${esc(gridVal(r, c))}</button></td>`).join('')}</tr>`).join('') + `<tr class="newrow"><td class="rh">*</td>${COLS.map(() => `<td><button type="button" class="cellbtn" data-new="1" aria-label="Linha nova vazia">&nbsp;</button></td>`).join('')}</tr>`;
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const o = $('.w-out', el);
      if (b.dataset.o) { ord = b.dataset.o; draw(); o.innerHTML = `<p>Com <code>ORDER BY ${ord}</code>, as posições (RowIndex) mudam, mas cada aluno continua com o mesmo id.</p>`; return; }
      $$('tr', el).forEach(t => t.classList.remove('sel'));
      if (b.dataset.h) { o.innerHTML = `<p><code>e.RowIndex = -1</code> (cabeçalho).</p><p class="warn-inline">No original, <code>dtgAlunos.Rows[-1]</code> lança <b>ArgumentOutOfRangeException</b>. Melhoria: começar o CellClick com <code>if (e.RowIndex &lt; 0) return;</code></p>`; return; }
      if (b.dataset.new) { b.closest('tr').classList.add('sel'); o.innerHTML = `<p><code>e.RowIndex = ${SEED.length}</code> (a linha nova, marcada com *).</p><p class="warn-inline">As células da linha nova não têm valor: <code>Cells["id"].Value</code> vem vazio (null) e <code>.ToString()</code> lança <b>NullReferenceException</b>.</p>`; return; }
      b.closest('tr').classList.add('sel');
      o.innerHTML = `<p><code>e.RowIndex = ${b.dataset.r}</code> → posição na grade.</p><p><code>dtgAlunos.Rows[${b.dataset.r}].Cells["id"].Value</code> = <b>${b.dataset.id}</b> → id no banco.</p><p><code>txtID.Text</code> recebe <code>"${b.dataset.id}"</code>${+b.dataset.r + 1 !== +b.dataset.id ? `, não ${b.dataset.r}` : ''}.</p>`;
    });
    draw();
  },

  whereLab(el) {
    el.innerHTML = `<div class="widget"><div class="w-ctrls">
      <label>Comando <select class="wl-op"><option value="u">UPDATE ... SET turma = 'C'</option><option value="d">DELETE</option></select></label>
      <label class="switch"><input type="checkbox" class="wl-w" checked> usar WHERE</label>
      <label>id = <select class="wl-id">${SEED.map(r => `<option>${r.id}</option>`).join('')}</select></label></div>
      <div class="wl-out" aria-live="polite"></div></div>`;
    const draw = () => {
      const op = $('.wl-op', el).value, w = $('.wl-w', el).checked, id = +$('.wl-id', el).value;
      $('.wl-id', el).disabled = !w;
      const sql = op === 'u' ? `UPDATE tblalunos SET turma = 'C'${w ? ` where id = '${id}'` : ''};` : `DELETE FROM tblalunos${w ? ` WHERE id = '${id}'` : ''};`;
      const hit = r => !w || r.id === id; const n = SEED.filter(hit).length;
      $('.wl-out', el).innerHTML = `${preCode('sql', sql)}<div class="tablewrap"><table class="t mini"><thead><tr><th>id</th><th>nome</th><th>turma</th></tr></thead><tbody>${SEED.map(r => `<tr class="${hit(r) ? (op === 'u' ? 'hit-u' : 'hit-d') : ''}"><td>${r.id}</td><td>${esc(r.nome)}</td><td>${hit(r) && op === 'u' ? `<s>${r.turma}</s> C` : r.turma}</td></tr>`).join('')}</tbody></table></div>
        <p class="${w ? '' : 'warn-inline'}"><b>${n} linha${n > 1 ? 's' : ''}</b> seria${n > 1 ? 'm' : ''} atingida${n > 1 ? 's' : ''}.${w ? '' : ' Sem WHERE, o comando vale para a tabela inteira.'}</p>`;
      paintPre($('pre', $('.wl-out', el)));
    };
    el.addEventListener('change', draw); draw();
  },

  staleGrid(el) {
    let dbr, grid;
    const reset = () => { dbr = clone(SEED); grid = clone(SEED).sort(byNome); };
    reset();
    el.innerHTML = `<div class="widget"><div class="w-btns">
      <button type="button" class="btn" data-a="upd">objAluno.AlterarAluno(): Mariana → turma C</button>
      <button type="button" class="btn primary" data-a="show">MostrarDadosAlunos()</button>
      <button type="button" class="btn" data-a="clr">LimparDados()</button>
      <button type="button" class="btn ghost" data-a="reset">Restaurar</button></div>
      <div class="two"><div><h4>Banco (tblAlunos)</h4><div class="sg-db"></div></div><div><h4>Tela (dtgAlunos)</h4><div class="sg-grid"></div></div></div>
      <div class="w-out" aria-live="polite"></div></div>`;
    const tbl = (rows, other) => `<div class="tablewrap"><table class="t mini"><thead><tr><th>id</th><th>nome</th><th>turma</th></tr></thead><tbody>${rows.map(r => { const o = other.find(x => x.id === r.id); const diff = o && o.turma !== r.turma; return `<tr><td>${r.id}</td><td>${esc(r.nome)}</td><td class="${diff ? 'diffc' : ''}">${r.turma}</td></tr>`; }).join('')}</tbody></table></div>`;
    const draw = msg => {
      $('.sg-db', el).innerHTML = tbl(dbr.slice().sort((a, b) => a.id - b.id), grid);
      $('.sg-grid', el).innerHTML = tbl(grid, dbr);
      const stale = dbr.some(r => grid.find(g => g.id === r.id).turma !== r.turma);
      $('.w-out', el).innerHTML = (msg ? `<p>${msg}</p>` : '') + (stale ? '<p class="warn-inline">A grade está desatualizada: mostra a turma antiga.</p>' : '');
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
      if (a === 'reset') { reset(); draw(); }
      if (a === 'upd') { dbr.find(r => r.id === 3).turma = 'C'; draw('O UPDATE mudou o banco. A grade não sabe disso.'); }
      if (a === 'show') { grid = clone(dbr).sort(byNome); draw('Um SELECT novo trouxe os dados atuais para a grade.'); }
      if (a === 'clr') draw('LimparDados() só esvaziou os controles da tela. Banco e grade continuam iguais.');
    });
    draw();
  },

  tipoDecisor(el) {
    el.innerHTML = `<div class="widget"><label>Tipo da coluna no MySQL <select class="td-k">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select></label><div class="td-out" aria-live="polite"></div></div>`;
    const draw = () => {
      const k = $('.td-k', el).value, K = KINDS[k], f = SAMPLE[k];
      const E = SAMPLE_E;
      const kind = (k === 'decimal' || k === 'bool') ? 'melhoria' : 'adaptado';
      $('.td-out', el).innerHTML = `<dl class="kv"><dt>Tipo C#</dt><dd><code>${K.cs}</code></dd><dt>Controle</dt><dd>${K.ctl}</dd><dt>Exemplo de coluna</dt><dd><code>${f.col} ${f.sql}</code></dd></dl><p>${K.note}</p>
        ${code('cs', [
          '// Atributo', `private ${K.cs} ${f.col};`, '',
          '// Leitura no btnCadastrar_Click', ...G.read(f, E), '',
          '// Valor dentro do INSERT (string interpolada)', G.sqlv(f), '',
          '// No CellClick', ...G.cell(f, E), '',
          '// No LimparDados', ...G.clear(f)].join('\n'), kind === 'melhoria' ? 'adaptado' : 'adaptado', K.cs)}
        ${kind === 'melhoria' ? note('warn', 'Fora do exemplo da aula', k === 'decimal' ? '<p>O projeto da professora não tem números decimais. O <code>CultureInfo.InvariantCulture</code> é um ajuste necessário para o SQL receber ponto em vez de vírgula. Precisa de <code>using System.Globalization;</code> no topo do arquivo.</p>' : '<p>O projeto da professora não tem CheckBox. A conversão <code>(ativo ? 1 : 0)</code> grava 1 ou 0, que é como o MySQL guarda tinyint(1).</p>') : ''}`;
      mount($('.td-out', el));
    };
    el.addEventListener('change', draw); draw();
  },

  injecao(el) {
    el.innerHTML = `<div class="widget"><label>txtNome.Text <input class="ij-n" value="Joana D'Ávila"></label><div class="w-btns"><button type="button" class="btn sm" data-v="Joana D'Ávila">Nome com apóstrofo</button><button type="button" class="btn sm" data-v="x','2000/01/01','B','1','A'); DELETE FROM tblAlunos; -- ">Texto malicioso</button><button type="button" class="btn sm" data-v="Pedro Henrique">Nome comum</button></div><div class="ij-out" aria-live="polite"></div></div>`;
    const draw = () => {
      const n = $('.ij-n', el).value;
      const sql = `INSERT INTO tblAlunos VALUES (null, '${n}','2009/03/15','B', '1', 'A');`;
      const broken = n.includes("'");
      $('.ij-out', el).innerHTML = `<h4>Como o original monta (interpolação)</h4>${preCode('sql', sql)}
        ${broken ? `<p class="warn-inline">O apóstrofo dentro do nome fecha o texto do SQL antes da hora. Com um nome comum como D'Ávila, o MySQL recusa o comando (erro de sintaxe). Com um texto preparado, o que foi digitado pode virar <b>outro comando SQL</b>, como o DELETE do exemplo: isso é <b>SQL injection</b>.</p>` : '<p>Sem apóstrofo, o texto fica correto.</p>'}
        <h4>Com parâmetros (melhoria)</h4>${preCode('sql', 'INSERT INTO tblAlunos VALUES (null, @nome, @dtnasc, @unidade, @serie, @turma);')}
        <p>O texto do SQL não muda. O valor vai separado, e o MySQL nunca o confunde com código:</p>
        <div class="tablewrap"><table class="t mini"><thead><tr><th>Parâmetro</th><th>Valor enviado</th></tr></thead><tbody><tr><td><code>@nome</code></td><td>${esc(n)}</td></tr><tr><td><code>@dtnasc</code></td><td>15/03/2009</td></tr><tr><td><code>@unidade</code></td><td>B</td></tr><tr><td><code>@serie</code></td><td>1</td></tr><tr><td><code>@turma</code></td><td>A</td></tr></tbody></table></div>`;
      $$('pre.code', el).forEach(paintPre);
    };
    el.addEventListener('input', draw);
    el.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { $('.ij-n', el).value = b.dataset.v; draw(); } });
    draw();
  }
};

/* ============================================================
   GERADOR DE SOLUÇÕES PARA OUTRAS TABELAS
   ============================================================ */
const G = {
  v: (f, E) => f.col + E.E,
  sqlv(f) { return ({ date: `'{${f.col}.ToString("yyyy/MM/dd")}'`, decimal: `'{${f.col}.ToString(CultureInfo.InvariantCulture)}'`, bool: `'{(${f.col} ? 1 : 0)}'` })[f.kind] || `'{${f.col}}'`; },
  read(f, E) {
    const v = G.v(f, E);
    switch (f.kind) {
      case 'string': return [`string ${v} = ${f.ctl}.Text;`];
      case 'int': return [`int ${v} = int.Parse(${f.ctl}.Text);`];
      case 'decimal': return [`decimal ${v} = decimal.Parse(${f.ctl}.Text);   // aceita 12,50 no Windows em português`];
      case 'date': return [`DateTime ${v} = ${f.ctl}.Value;`];
      case 'charCombo': return [`char ${v} = char.Parse(${f.ctl}.Text);`];
      case 'bool': return [`bool ${v} = ${f.ctl}.Checked;`];
      case 'charRadio': return [`char ${v};`, ...f.opts.flatMap((o, i) => [`${i ? 'else if' : 'if'} (${o.ctl}.Checked)`, `    ${v} = '${o.v}';`]), 'else', `    ${v} = ' ';`];
    }
  },
  cell(f, E) {
    const R = c => `${E.grid}.Rows[e.RowIndex].Cells["${c}"].Value`;
    switch (f.kind) {
      case 'string': case 'int': case 'decimal': case 'charCombo': return [`${f.ctl}.Text = ${R(f.col)}.ToString();`];
      case 'date': return [`${f.ctl}.Value = DateTime.Parse(${R(f.col)}.ToString());`];
      case 'bool': return [`${f.ctl}.Checked = Convert.ToBoolean(${R(f.col)});`];
      case 'charRadio': return f.opts.flatMap((o, i) => i === f.opts.length - 1 ? ['else', `    ${o.ctl}.Checked = true;`] : [`${i ? 'else if' : 'if'} (${R(f.col)}.ToString() == "${o.v}")`, `    ${o.ctl}.Checked = true;`]);
    }
  },
  clear(f) {
    switch (f.kind) {
      case 'string': case 'int': case 'decimal': return [`${f.ctl}.Clear();`];
      case 'date': return [`${f.ctl}.Value = DateTime.Now;`];
      case 'charCombo': return [`${f.ctl}.SelectedIndex = -1;`];
      case 'bool': return [`${f.ctl}.Checked = false;`];
      case 'charRadio': return f.opts.map(o => `${o.ctl}.Checked = false;`);
    }
  },
  build(E) {
    E.grid = E.grid || 'dtg' + E.plural;
    const F = E.fields, csT = f => KINDS[f.kind].cs, usesDec = F.some(f => f.kind === 'decimal');
    const all = [{ col: 'id', m: 'Id', cs: 'int' }, ...F.map(f => ({ col: f.col, m: f.m, cs: csT(f) }))];
    const script = [`create database ${E.db};`, '', `use ${E.db};`, '', `create table ${E.table}(`, '   id int not null primary key auto_increment,', F.map(f => `   ${f.col} ${f.sql}`).join(',\n'), ');', '', `select * from ${E.table};`].join('\n');
    const L = []; const w = (d, s) => L.push(s === undefined ? '' : '    '.repeat(d) + s);
    w(0, 'using System;'); w(0, 'using System.Data;');
    if (usesDec) w(0, 'using System.Globalization;   // fora do exemplo: necessário para CultureInfo');
    w(); w(0, 'namespace SeuProjeto   // use o mesmo namespace do seu projeto'); w(0, '{');
    w(1, `internal class ${E.E}`); w(1, '{');
    w(2, `// Atributos: um para cada coluna de ${E.table}`);
    all.forEach(a => w(2, `private ${a.cs} ${a.col};`));
    w(); w(2, '// Encapsulamento: um Set e um Get para cada atributo');
    all.forEach(a => { w(2, `public void Set${a.m}(${a.cs} ${a.col})`); w(2, '{'); w(3, `this.${a.col} = ${a.col};`); w(2, '}'); w(); w(2, `public ${a.cs} Get${a.m}()`); w(2, '{'); w(3, `return this.${a.col};`); w(2, '}'); w(); });
    w(2, '// Métodos do CRUD'); w(2, 'Conexao db = new Conexao();'); w();
    w(2, `public void Inserir${E.E}()`); w(2, '{');
    w(3, '// null no id: o auto_increment escolhe o número. Valores na ordem das colunas.');
    w(3, `string inserir = $"INSERT INTO ${E.table} VALUES (null, ${F.map(G.sqlv).join(', ')});";`);
    w(3, 'db.ExecutarComando(inserir);'); w(2, '}'); w();
    w(2, `public void Alterar${E.E}()`); w(2, '{');
    w(3, '// o WHERE garante que só o registro deste id muda');
    w(3, `string alterar = $"UPDATE ${E.table} SET ${F.map(f => `${f.col} = ${G.sqlv(f)}`).join(', ')} WHERE id = '{this.id}';";`);
    w(3, 'db.ExecutarComando(alterar);'); w(2, '}'); w();
    w(2, `public void Excluir${E.E}()`); w(2, '{');
    w(3, `string deletar = $"DELETE FROM ${E.table} WHERE id = '{this.id}';";`);
    w(3, 'db.ExecutarComando(deletar);'); w(2, '}'); w();
    w(2, `public DataTable Listar${E.plural}()`); w(2, '{');
    w(3, `string consulta = "SELECT * FROM ${E.table} ORDER BY ${E.order};";`);
    w(3, 'return db.ExecutarConsulta(consulta);'); w(2, '}');
    w(1, '}'); w(0, '}');
    const cls = L.join('\n');

    const conn = `// Em Conexao.cs, dentro de Conectar(): só o database muda\nstring dadosConexao = "Persist security info = false; server = localhost; database = ${E.db}; uid = root; pwd=;";`;

    const M = []; const m = (d, s) => M.push(s === undefined ? '' : '    '.repeat(d) + s);
    const id = 'id' + E.E;
    const reads = d => { F.filter(f => f.kind !== 'charRadio').forEach(f => G.read(f, E).forEach(l => m(d, l))); F.filter(f => f.kind === 'charRadio').forEach(f => { m(); G.read(f, E).forEach(l => m(d, l)); }); };
    const sets = d => F.forEach(f => m(d, `${E.obj}.Set${f.m}(${G.v(f, E)});`));
    m(0, `// Em ${E.form}.cs (o Visual Studio já cria os using, o namespace e o construtor)`);
    m(0, `public partial class ${E.form} : Form`); m(0, '{');
    m(1, `public ${E.form}()`); m(1, '{'); m(2, 'InitializeComponent();'); m(1, '}'); m();
    m(1, `// Um objeto ${E.E} compartilhado por todos os eventos do formulário`);
    m(1, `${E.E} ${E.obj} = new ${E.E}();`); m();
    m(1, 'private void btnCadastrar_Click(object sender, EventArgs e)'); m(1, '{');
    m(2, '// 1. Ler os controles e converter para o tipo do atributo'); reads(2); m();
    m(2, '// 2. Preencher o objeto com os Set'); sets(2); m();
    m(2, '// 3. Executar o INSERT e atualizar a tela');
    m(2, `${E.obj}.Inserir${E.E}();`); m(2, `MostrarDados${E.plural}();`); m(2, 'MessageBox.Show("Dados INSERIDOS com sucesso.");'); m(2, 'LimparDados();'); m(1, '}'); m();
    m(1, 'private void btnAlterar_Click(object sender, EventArgs e)'); m(1, '{');
    m(2, `int ${id} = int.Parse(txtID.Text);   // o ID diz qual registro alterar`); reads(2); m();
    m(2, `${E.obj}.SetId(${id});`); sets(2); m();
    m(2, `${E.obj}.Alterar${E.E}();`); m(2, `MostrarDados${E.plural}();`); m(2, 'MessageBox.Show("Dados ALTERADOS com sucesso.");'); m(2, 'LimparDados();'); m(1, '}'); m();
    m(1, 'private void btnExcluir_Click(object sender, EventArgs e)'); m(1, '{');
    m(2, `int ${id} = int.Parse(txtID.Text);   // o ID diz qual registro excluir`);
    m(2, `${E.obj}.SetId(${id});`); m(2, `${E.obj}.Excluir${E.E}();`); m();
    m(2, 'MessageBox.Show("Dados excluídos com sucesso.");'); m(2, 'LimparDados();'); m(2, `MostrarDados${E.plural}();`); m(1, '}'); m();
    m(1, 'private void btnLimpar_Click(object sender, EventArgs e)'); m(1, '{'); m(2, 'LimparDados();'); m(1, '}'); m();
    m(1, 'private void btnSair_Click(object sender, EventArgs e)'); m(1, '{'); m(2, 'this.Close();'); m(1, '}'); m();
    m(1, '// Esvazia os controles. Não executa SQL.'); m(1, 'private void LimparDados()'); m(1, '{'); m(2, 'txtID.Clear();'); F.forEach(f => G.clear(f).forEach(l => m(2, l))); m(1, '}'); m();
    m(1, `private void ${E.form}_Load(object sender, EventArgs e)`); m(1, '{'); m(2, `MostrarDados${E.plural}();`); m(1, '}'); m();
    m(1, `private void MostrarDados${E.plural}()`); m(1, '{'); m(2, `${E.grid}.DataSource = ${E.obj}.Listar${E.plural}();`); m(1, '}'); m();
    m(1, `private void ${E.grid}_CellClick(object sender, DataGridViewCellEventArgs e)`); m(1, '{');
    m(2, '// Cells["..."] usa o nome da coluna no banco');
    m(2, `txtID.Text = ${E.grid}.Rows[e.RowIndex].Cells["id"].Value.ToString();`);
    F.filter(f => f.kind !== 'charRadio').forEach(f => G.cell(f, E).forEach(l => m(2, l)));
    F.filter(f => f.kind === 'charRadio').forEach(f => { m(); G.cell(f, E).forEach(l => m(2, l)); });
    m(1, '}'); m(0, '}');
    const form = M.join('\n');

    const ctrls = [['TextBox', 'txtID', 'Enabled = False', '—']];
    F.forEach(f => {
      if (f.kind === 'charRadio') { ctrls.push(['GroupBox', f.grp, `Text = ${f.label}`, '—']); f.opts.forEach(o => ctrls.push(['RadioButton (dentro do ' + f.grp + ')', o.ctl, `Text = ${o.label}`, '—'])); }
      else ctrls.push([{ string: 'TextBox', int: 'TextBox', decimal: 'TextBox', date: 'DateTimePicker', charCombo: 'ComboBox', bool: 'CheckBox' }[f.kind], f.ctl, f.kind === 'charCombo' ? `DropDownStyle = DropDownList; Items = ${f.items.join(', ')}` : f.kind === 'date' ? 'Format = Short' : f.kind === 'bool' ? `Text = ${f.label}` : '—', '—']);
    });
    ctrls.push(['DataGridView', E.grid, '—', `CellClick → ${E.grid}_CellClick`]);
    ['Cadastrar', 'Alterar', 'Excluir', 'Limpar', 'Sair'].forEach(b => ctrls.push(['Button', 'btn' + b, `Text = ${b}`, `Click → btn${b}_Click`]));
    ctrls.push(['Form', E.form, `Text = ${E.title}`, `Load → ${E.form}_Load`]);

    const map = F.map(f => ({ f, cs: csT(f), ctl: f.kind === 'charRadio' ? `${f.grp}: ${f.opts.map(o => o.ctl).join(', ')}` : f.ctl, read: G.read(f, E).join(' '), sql: G.sqlv(f), cell: G.cell(f, E).join(' ') }));
    return { script, cls, conn, form, ctrls, map };
  }
};
const SAMPLE_E = { E: 'Produto', obj: 'objProduto', grid: 'dtgProdutos' };
const SAMPLE = {
  string: { col: 'descricao', sql: 'varchar(60) not null', kind: 'string', ctl: 'txtDescricao' },
  int: { col: 'estoque', sql: 'int not null', kind: 'int', ctl: 'txtEstoque' },
  decimal: { col: 'preco', sql: 'decimal(10,2) not null', kind: 'decimal', ctl: 'txtPreco' },
  date: { col: 'dtvalidade', sql: 'date not null', kind: 'date', ctl: 'dtpValidade' },
  charCombo: { col: 'setor', sql: 'char(1) not null', kind: 'charCombo', ctl: 'cmbSetor' },
  charRadio: { col: 'categoria', sql: 'char(1) not null', kind: 'charRadio', opts: [{ v: 'A', ctl: 'rdbAlimento' }, { v: 'L', ctl: 'rdbLimpeza' }, { v: 'H', ctl: 'rdbHigiene' }] },
  bool: { col: 'ativo', sql: 'tinyint(1) not null', kind: 'bool', ctl: 'chkAtivo' }
};

/* ============================================================
   SIMULADOR DO FORMULÁRIO
   ============================================================ */
const SIM = {
  db() { if (!S.sim) S.sim = { rows: clone(SEED), next: 6 }; return S.sim; },
  obj: null, traces: [], cur: null, idx: 0, closed: false, sel: null,
  newObj() { return { id: 0, nome: null, dtnasc: null, unidade: '\0', serie: 0, turma: '\0' }; }
};
SIM.obj = SIM.newObj();

function simRead() {
  const v = id => document.getElementById(id);
  return { txtID: v('s-id').value, txtNome: v('s-nome').value, dtp: v('s-dt').value || todayISO(), rdbBarroca: v('s-rb').checked, rdbFloresta: v('s-rf').checked, rdb1Serie: v('s-r1').checked, rdb2Serie: v('s-r2').checked, rdb3Serie: v('s-r3').checked, cmbTurma: v('s-t').value };
}
function simWrite(c) {
  const v = id => document.getElementById(id);
  v('s-id').value = c.txtID; v('s-nome').value = c.txtNome; v('s-dt').value = c.dtp;
  v('s-rb').checked = c.rdbBarroca; v('s-rf').checked = c.rdbFloresta; v('s-r1').checked = c.rdb1Serie; v('s-r2').checked = c.rdb2Serie; v('s-r3').checked = c.rdb3Serie; v('s-t').value = c.cmbTurma;
}
const CLEAR = () => ({ txtID: '', txtNome: '', dtp: todayISO(), rdbBarroca: false, rdbFloresta: false, rdb1Serie: false, rdb2Serie: false, rdb3Serie: false, cmbTurma: '' });
const ctlView = c => ({ 'txtID.Text': qs(c.txtID), 'txtNome.Text': qs(c.txtNome), 'dtpNascimento.Value': br(c.dtp), 'rdbBarroca.Checked': String(c.rdbBarroca), 'rdbFloresta.Checked': String(c.rdbFloresta), 'rdb1Serie.Checked': String(c.rdb1Serie), 'rdb2Serie.Checked': String(c.rdb2Serie), 'rdb3Serie.Checked': String(c.rdb3Serie), 'cmbTurma.Text': qs(c.cmbTurma) });
const objView = o => ({ id: String(o.id), nome: qs(o.nome), dtnasc: o.dtnasc ? br(o.dtnasc) : '01/01/0001', unidade: qc(o.unidade), serie: String(o.serie), turma: qc(o.turma) });
// shortcut: simula só os dois erros de MySQL que o formulário provoca com facilidade (apóstrofo/barra e nome longo).
function mysqlCheck(nome) {
  if (/['\\]/.test(nome)) return `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${nome.slice(nome.search(/['\\]/) + 1, nome.search(/['\\]/) + 20)}...' (erro 1064)`;
  if (nome.length > 50) return "Data too long for column 'nome' at row 1 (erro 1406: o varchar(50) aceita até 50 caracteres)";
  return null;
}

function simOp(op, arg) {
  if (SIM.closed && op !== 'reopen') return;
  const db = SIM.db(), c = op === 'reopen' ? CLEAR() : simRead(), before = clone(db.rows);
  const st = []; let obj = clone(SIM.obj), after = null, finalCtl = c, msg = null, err = null, gridAfter = null;
  const P = (title, html, x = {}) => st.push(Object.assign({ title, html, ctl: ctlView(x.c || c), obj: objView(x.o || obj) }, x));
  const ev = (btn, method) => P(`Evento ${btn === 'Load' ? 'Load' : 'Click'} disparado`, `Você clicou em <b>${btn}</b>. O Windows Forms executa o método ligado a esse evento no designer: <code>${method}</code>.`, { code: ['FrmAlunos.designer.cs', `this.${btn === 'Load' ? 'Load' : 'btn' + btn + '.Click'} +=`] });
  const fail = (title, type, text, codeRef) => { err = { type, text }; P(title, `<p class="warn-inline"><b>${type}</b>: ${text}</p><p>O botão do original não tem <code>try/catch</code>, então isso vira uma <b>exceção não tratada</b>. No Visual Studio, a execução pararia nesta linha. Nada foi gravado no banco.</p>`, { code: codeRef, err: true }); };
  const mostrar = () => { gridAfter = (after || db.rows).slice().sort(byNome); P('MostrarDadosAlunos(): SELECT e grade atualizada', '<code>ListarAlunos()</code> monta o SELECT, <code>ExecutarConsulta</code> preenche um DataTable com <code>Fill</code> e o formulário faz <code>dtgAlunos.DataSource = ...</code>. A grade agora mostra o estado atual do banco, em ordem de nome.', { code: ['Aluno.cs', 'public DataTable ListarAlunos()', 'return db.ExecutarConsulta', 0, ['SELECT']], sql: 'SELECT * FROM tblAlunos ORDER BY nome;', grid: gridAfter }); };
  const limpar = () => { finalCtl = CLEAR(); P('LimparDados(): controles vazios', 'Os controles voltam ao estado inicial. Nenhum SQL é executado.', { code: ['FrmAlunos.cs', 'private void LimparDados()', 'cmbTurma.SelectedIndex = -1;', 1], c: finalCtl }); };
  const box = text => { msg = text; P('MessageBox', `Aparece a mensagem <b>“${esc(text)}”</b>. O código só continua depois do OK.`, { code: ['FrmAlunos.cs', `MessageBox.Show("${text.slice(0, 20)}`] }); };
  const readAll = (method, withId) => {
    if (withId) {
      if (c.txtID === '') { fail('int.Parse(txtID.Text) com o campo vazio', 'FormatException', 'txtID.Text é "" e int.Parse não consegue converter um texto vazio em número. Selecione um aluno na grade antes.', ['FrmAlunos.cs', method, 'int', 0, ['int.Parse']]); return null; }
    }
    const vars = {}; if (withId) vars.idAluno = c.txtID;
    vars.nomeAluno = qs(c.txtNome); vars.dtnascAluno = br(c.dtp);
    if (c.cmbTurma === '') { P('Lendo os controles', 'O código começa guardando os valores dos controles em variáveis.', { code: ['FrmAlunos.cs', method, 'char.Parse', 0, ['txtNome.Text', 'dtpNascimento.Value', 'char.Parse']], vars }); fail('char.Parse(cmbTurma.Text) sem turma', 'FormatException', 'cmbTurma.Text é "" (nenhuma turma escolhida) e char.Parse exige exatamente um caractere.', ['FrmAlunos.cs', method, 'char.Parse', 0, ['char.Parse']]); return null; }
    vars.turmaAluno = `'${c.cmbTurma}'`;
    P('Lendo os controles', `<code>txtNome.Text</code> é texto, <code>dtpNascimento.Value</code> já é DateTime e <code>char.Parse(cmbTurma.Text)</code> transforma <code>"${c.cmbTurma}"</code> em <code>'${c.cmbTurma}'</code>.${withId ? ` O ID <code>"${c.txtID}"</code> vira o número ${c.txtID} com <code>int.Parse</code>.` : ''}`, { code: ['FrmAlunos.cs', method, 'char.Parse', 0, ['txtNome.Text', 'dtpNascimento.Value', 'char.Parse', 'int.Parse']], vars: Object.assign({}, vars) });
    const u = c.rdbBarroca ? 'B' : c.rdbFloresta ? 'F' : ' ';
    vars.unidadeAluno = `'${u}'`;
    P('Decidindo a unidade (if/else)', u === ' ' ? 'Nenhum RadioButton de unidade está marcado, então o <code>else</code> grava um espaço <code>\' \'</code>. O original não avisa.' : `<code>${u === 'B' ? 'rdbBarroca' : 'rdbFloresta'}.Checked</code> é true, então <code>unidadeAluno = '${u}'</code>.`, { code: ['FrmAlunos.cs', method, "unidadeAluno = ' ';", 0, [u === 'B' ? "unidadeAluno = 'B'" : u === 'F' ? "unidadeAluno = 'F'" : "unidadeAluno = ' '"]], vars: Object.assign({}, vars) });
    const s = c.rdb1Serie ? 1 : c.rdb2Serie ? 2 : c.rdb3Serie ? 3 : 0;
    vars.serieAluno = String(s);
    P('Decidindo a série (ternário)', s ? `O ternário testa 1ª, 2ª e 3ª nessa ordem. <code>rdb${s}Serie.Checked</code> é true, então <code>serieAluno = ${s}</code>.` : 'Nenhuma série marcada: o ternário chega ao último valor, <code>0</code>.', { code: ['FrmAlunos.cs', method, 'serieAluno = rdb1Serie', 0, ['serieAluno = rdb1Serie']], vars: Object.assign({}, vars) });
    if (withId) obj.id = +c.txtID;
    Object.assign(obj, { nome: c.txtNome, dtnasc: c.dtp, unidade: u, serie: s, turma: c.cmbTurma });
    P('Preenchendo o objeto com os Set', `Cada Set guarda um valor num atributo privado de <code>objAluno</code>.${withId ? ' O <code>setId</code> (com s minúsculo) guarda o ID.' : ' O id não muda: o INSERT nem usa.'}`, { code: ['FrmAlunos.cs', method, 'objAluno.SetTurma(turmaAluno);', 0, ['objAluno.S', 'objAluno.setId']], vars: Object.assign({}, vars), objPrev: objView(SIM.obj) });
    return { u, s };
  };
  const exec = (sqlText, mutate, kind) => {
    const e1 = kind !== 'delete' ? mysqlCheck(c.txtNome) : null;
    if (e1) { fail('ExecutarComando: o MySQL recusou', 'Exception', `Instrução não executada.<br><code>${esc(sqlText)}</code><br>${esc(e1)}`, ['Conexao.cs', 'public void ExecutarComando', 'conn.Close();', 0, ['ExecuteNonQuery', 'throw new Exception', 'conn.Close']]); return false; }
    after = mutate(clone(db.rows));
    const n = kind === 'insert' ? 1 : before.length - after.length || (kind === 'update' ? before.filter(r => r.id === obj.id).length : 0);
    P('ExecutarComando: o MySQL executa', `<code>Conectar()</code> abre a conexão, <code>ExecuteNonQuery()</code> executa e o <code>finally</code> fecha. O MySQL informa <b>${n} linha${n === 1 ? '' : 's'} afetada${n === 1 ? '' : 's'}</b>, número que o original ignora.${kind === 'insert' ? ` O auto_increment gerou o id <b>${db.next}</b>.` : ''}${kind === 'insert' && obj.unidade === ' ' ? ' Repare: o MySQL remove espaços à direita de colunas CHAR, então a unidade volta vazia nas consultas.' : ''}`, { code: ['Conexao.cs', 'public void ExecutarComando', 'conn.Close();', 0, ['Conectar();', 'ExecuteNonQuery', 'conn.Close']], sql: sqlText, before, after });
    return true;
  };

  let title = '';
  if (op === 'cadastrar') {
    title = 'Cadastrar';
    ev('Cadastrar', 'btnCadastrar_Click');
    const r = readAll('private void btnCadastrar_Click', false);
    if (r) {
      const sql = `INSERT INTO tblAlunos VALUES (null, '${obj.nome}','${sqlDate(obj.dtnasc)}','${obj.unidade}', '${obj.serie}', '${obj.turma}');`;
      P('InserirAluno(): o SQL é montado', 'A string interpolada troca cada <code>{...}</code> pelo atributo. O id vai como <code>null</code> e a data sai no formato yyyy/MM/dd.', { code: ['Aluno.cs', 'public void InserirAluno()', 'db.ExecutarComando(inserir);', 1, ['INSERT']], sql });
      if (exec(sql, rows => { rows.push({ id: db.next, nome: obj.nome, dtnasc: obj.dtnasc, unidade: obj.unidade.trim(), serie: obj.serie, turma: obj.turma }); return rows; }, 'insert')) {
        mostrar(); box('Dados do aluno INSERIDOS com sucesso.'); limpar();
      }
    }
  } else if (op === 'alterar') {
    title = 'Alterar';
    ev('Alterar', 'btnAlterar_Click');
    const r = readAll('private void btnAlterar_Click', true);
    if (r) {
      const sql = `UPDATE tblalunos SET nome = '${obj.nome}', dtnasc = '${sqlDate(obj.dtnasc)}', unidade = '${obj.unidade}', serie = '${obj.serie}', turma = '${obj.turma}' where id = '${obj.id}';`;
      P('AlterarAluno(): o SQL é montado', `O UPDATE troca as colunas e o <code>where id = '${obj.id}'</code> limita a mudança a um registro. Repare: aqui o nome da tabela está como <code>tblalunos</code> (minúsculo).`, { code: ['Aluno.cs', 'public void AlterarAluno()', 'db.ExecutarComando(alterar);', 1, ['UPDATE']], sql });
      if (exec(sql, rows => rows.map(x => x.id === obj.id ? { id: x.id, nome: obj.nome, dtnasc: obj.dtnasc, unidade: obj.unidade.trim(), serie: obj.serie, turma: obj.turma } : x), 'update')) {
        mostrar(); box('Dados do aluno ALTERADOS com sucesso.'); limpar();
      }
    }
  } else if (op === 'excluir') {
    title = 'Excluir';
    ev('Excluir', 'btnExcluir_Click');
    if (c.txtID === '') fail('int.Parse(txtID.Text) com o campo vazio', 'FormatException', 'txtID.Text é "" e int.Parse não converte texto vazio. Selecione um aluno na grade antes de excluir.', ['FrmAlunos.cs', 'int idAluno = int.Parse(txtID.Text); //O ID', '', 0, ['int.Parse']]);
    else {
      obj.id = +c.txtID;
      P('Lendo o ID e guardando no objeto', `<code>int.Parse("${c.txtID}")</code> vira ${c.txtID} e <code>objAluno.setId(${c.txtID})</code> guarda no atributo id. Os outros atributos nem são lidos.`, { code: ['FrmAlunos.cs', 'private void btnExcluir_Click', 'objAluno.ExcluirAluno();', 0, ['int.Parse', 'setId']], vars: { idAluno: c.txtID }, objPrev: objView(SIM.obj) });
      const sql = `DELETE FROM tblalunos WHERE id = '${obj.id}';`;
      P('ExcluirAluno(): o SQL é montado', `O WHERE garante que só o registro ${obj.id} seja apagado.`, { code: ['Aluno.cs', 'public void ExcluirAluno()', 'db.ExecutarComando(deletar);', 1, ['DELETE']], sql });
      if (exec(sql, rows => rows.filter(x => x.id !== obj.id), 'delete')) { box('Dados do aluno excluídos com sucesso.'); limpar(); mostrar(); }
    }
  } else if (op === 'limpar') {
    title = 'Limpar';
    ev('Limpar', 'btnLimpar_Click');
    limpar();
    P('E o banco?', 'Continua igual. Limpar só mexe na tela.', { before, after: clone(db.rows) });
  } else if (op === 'cell') {
    title = 'CellClick';
    const sorted = db.rows.slice().sort(byNome);
    P('Evento CellClick disparado', `Você clicou ${arg === -1 ? 'no <b>cabeçalho</b>' : arg === 'new' ? 'na <b>linha nova</b> (*)' : `na linha de <b>${esc(sorted[arg].nome)}</b>`}. O método recebe <code>e.RowIndex = ${arg === 'new' ? sorted.length : arg}</code>.`, { code: ['FrmAlunos.designer.cs', 'this.dtgAlunos.CellClick +='] });
    if (arg === -1) fail('Rows[-1] não existe', 'ArgumentOutOfRangeException', 'e.RowIndex é -1 no cabeçalho, e não existe linha com índice -1. Melhoria: if (e.RowIndex < 0) return;', ['FrmAlunos.cs', 'txtID.Text      = dtgAlunos', '', 0, ['e.RowIndex']]);
    else if (arg === 'new') fail('Célula sem valor', 'NullReferenceException', 'A linha nova não tem dados: Cells["id"].Value vem vazio (null) e .ToString() não pode ser chamado sobre null.', ['FrmAlunos.cs', 'txtID.Text      = dtgAlunos', '', 0, ['.Value.ToString()']]);
    else {
      const r = sorted[arg];
      SIM.sel = r.id;
      const nc = { txtID: String(r.id), txtNome: r.nome, dtp: r.dtnasc, cmbTurma: r.turma, rdbBarroca: r.unidade === 'B', rdbFloresta: r.unidade !== 'B', rdb2Serie: String(r.serie) === '2', rdb3Serie: String(r.serie) === '3', rdb1Serie: !['2', '3'].includes(String(r.serie)) };
      const mid = Object.assign({}, c, { txtID: nc.txtID, txtNome: nc.txtNome, dtp: nc.dtp, cmbTurma: nc.cmbTurma });
      P('Copiando as células para os controles', `<code>Rows[${arg}]</code> é a linha clicada, e <code>Cells["id"]</code> traz o id <b>${r.id}</b> (não o índice ${arg}).`, { code: ['FrmAlunos.cs', 'private void dtgAlunos_CellClick', 'cmbTurma.Text = dtgAlunos', 0, ['Cells["id"]', 'Cells["nome"]', 'Cells["dtnasc"]', 'Cells["turma"]']], c: mid });
      finalCtl = Object.assign({}, c, nc);
      P('Marcando os RadioButtons', `A unidade é <code>"${r.unidade}"</code>, então ${r.unidade === 'B' ? 'marca Barroca' : 'cai no else e marca Floresta'}. A série é <code>"${r.serie}"</code>, então marca ${nc.rdb2Serie ? '2ª' : nc.rdb3Serie ? '3ª' : '1ª (o else final)'}.`, { code: ['FrmAlunos.cs', 'if (dtgAlunos.Rows[e.RowIndex].Cells["unidade"]', 'rdb1Serie.Checked = true;', 1, [r.unidade === 'B' ? 'rdbBarroca.Checked = true' : 'rdbFloresta.Checked = true', nc.rdb2Serie ? 'rdb2Serie.Checked = true' : nc.rdb3Serie ? 'rdb3Serie.Checked = true' : 'rdb1Serie.Checked = true']], c: finalCtl });
    }
  } else if (op === 'sair') {
    title = 'Sair';
    ev('Sair', 'btnSair_Click');
    P('this.Close()', 'O FrmAlunos fecha. O <code>ShowDialog()</code> do FrmPrincipal termina e o menu volta a responder. Os dados continuam no banco.', { code: ['FrmAlunos.cs', 'private void btnSair_Click', 'this.Close();', 1, ['this.Close']] });
  } else if (op === 'reopen' || op === 'load') {
    title = op === 'reopen' ? 'Abrir pelo menu ALUNOS' : 'Load';
    if (op === 'reopen') { obj = SIM.newObj(); P('Menu ALUNOS: um FrmAlunos novo', 'O FrmPrincipal cria <code>new FrmAlunos()</code>. O construtor chama <code>InitializeComponent()</code> e o campo <code>objAluno</code> nasce de novo, com valores padrão.', { code: ['FrmPrincipal.cs', 'private void aLUNOSToolStripMenuItem_Click', 'telaAlunos.ShowDialog();', 1, ['new FrmAlunos', 'ShowDialog']], c: CLEAR(), o: obj }); finalCtl = CLEAR(); }
    P('Evento Load disparado', 'A janela apareceu e o Load chama <code>MostrarDadosAlunos()</code>.', { code: ['FrmAlunos.cs', 'private void FrmAlunos_Load', 'dtgAlunos.DataSource', 1, ['MostrarDadosAlunos();', 'DataSource']], c: finalCtl });
    mostrar();
  }

  // Aplica o resultado UMA vez. Navegar pelos passos depois só redesenha.
  if (!err) {
    if (after && op !== 'limpar') { db.rows = after; if (op === 'cadastrar') db.next++; }
    if (op !== 'sair') SIM.obj = obj;
    if (op === 'reopen') SIM.closed = false;
    if (op === 'sair') SIM.closed = true;
    if (op !== 'cell') SIM.sel = null;
  } else if (op !== 'cell' && op !== 'excluir') SIM.obj = obj; // os Set que rodaram antes do erro continuam valendo
  save();
  const trace = { title, steps: st, err, msg, t: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
  SIM.traces.unshift(trace); SIM.traces = SIM.traces.slice(0, 8);
  SIM.cur = trace; SIM.idx = 0;
  if (!err) simWrite(finalCtl);
  drawSim();
  if (S.step) { drawTrace(); const tr = $('#trace'); tr && tr.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }
  else {
    drawTrace();
    if (err) modal({ title: 'Exceção não tratada (simulação)', kind: 'err', html: `<p><b>${err.type}</b></p><p>${err.text}</p><p class="muted">Ative “Acompanhar passo a passo” para ver onde aconteceu.</p>` });
    else if (msg) modal({ title: 'FrmAlunos', html: `<p>${esc(msg)}</p>` });
  }
}

function drawSim() {
  const db = SIM.db(), rows = db.rows.slice().sort(byNome);
  const g = $('#s-grid'); if (!g) return;
  g.innerHTML = `<table class="dtg"><thead><tr><th class="rh"></th>${COLS.map(c => `<th><button type="button" class="cellbtn" data-h="1">${c}</button></th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr class="${SIM.sel === r.id ? 'sel' : ''}"><td class="rh">${SIM.sel === r.id ? '▸' : ''}</td>${COLS.map(c => `<td><button type="button" class="cellbtn" data-r="${i}">${esc(gridVal(r, c))}</button></td>`).join('')}</tr>`).join('')}<tr class="newrow"><td class="rh">*</td>${COLS.map(() => '<td><button type="button" class="cellbtn" data-new="1" aria-label="Linha nova vazia">&nbsp;</button></td>').join('')}</tr></tbody></table>`;
  $('#s-db').innerHTML = dbTable(db.rows.slice().sort((a, b) => a.id - b.id)) + `<p class="muted">Próximo id do auto_increment: <b>${db.next}</b></p>`;
  $('#s-closed').hidden = !SIM.closed;
  $('#s-win').classList.toggle('is-closed', SIM.closed);
  $('#s-hist').innerHTML = SIM.traces.length ? SIM.traces.map((t, i) => `<li><button type="button" class="linkbtn" data-tr="${i}">${t.t} · ${esc(t.title)}${t.err ? ' · <b class="bad-t">exceção</b>' : ''}</button></li>`).join('') : '<li class="muted">Nenhuma operação ainda.</li>';
}
function dbTable(rows, cmp, mode) {
  const ids = new Set((cmp || []).map(r => r.id));
  return `<div class="tablewrap"><table class="t mini dbt"><thead><tr>${COLS.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => {
    const o = cmp && cmp.find(x => x.id === r.id);
    const cls = cmp ? (!o ? (mode === 'after' ? 'row-new' : 'row-del') : '') : '';
    return `<tr class="${cls}">${COLS.map(c => `<td class="${o && dbVal(o, c) !== dbVal(r, c) ? 'diffc' : ''}">${esc(dbVal(r, c)) || '<i class="muted">vazio</i>'}</td>`).join('')}</tr>`;
  }).join('')}${!rows.length ? `<tr><td colspan="6" class="muted">tabela vazia</td></tr>` : ''}</tbody></table></div>`;
}
function kvTable(title, o, prev) {
  return `<div class="kvbox"><h4>${title}</h4><table class="t kvt"><tbody>${Object.entries(o).map(([k, v]) => `<tr class="${prev && prev[k] !== undefined && prev[k] !== v ? 'chg' : ''}"><td><code>${esc(k)}</code></td><td><code>${esc(v)}</code></td></tr>`).join('')}</tbody></table></div>`;
}
function drawTrace() {
  const box = $('#trace'); if (!box) return;
  const t = SIM.cur;
  if (!t) { box.innerHTML = '<p class="muted">Faça uma operação no formulário (cadastrar, clicar numa linha, alterar...) para ver o passo a passo aqui.</p>'; return; }
  const i = SIM.idx, s = t.steps[i], p = t.steps[i - 1];
  const panels = [];
  panels.push(kvTable('Controles', s.ctl, p && p.ctl));
  if (s.vars) panels.push(kvTable('Variáveis locais', s.vars, p && p.vars));
  panels.push(kvTable('objAluno (atributos)', s.obj, s.objPrev || (p && p.obj)));
  box.innerHTML = `<div class="tr-head"><div><span class="eyebrow">Passo a passo · ${esc(t.title)} · ${t.t}</span><h3>${esc(s.title)}</h3></div>
    <div class="stepper"><button type="button" class="btn" data-mv="-1" ${i === 0 ? 'disabled' : ''}>← Voltar</button><span class="stepn">Passo ${i + 1} de ${t.steps.length}</span><button type="button" class="btn primary" data-mv="1" ${i === t.steps.length - 1 ? 'disabled' : ''}>Avançar →</button></div></div>
    <div class="dots" role="group" aria-label="Ir para o passo">${t.steps.map((x, k) => `<button type="button" class="dot${k === i ? ' on' : ''}${x.err ? ' err' : ''}" data-go="${k}" aria-label="Passo ${k + 1}: ${esc(x.title)}" ${k === i ? 'aria-current="step"' : ''}></button>`).join('')}</div>
    <div class="tr-text">${s.html}</div>
    ${s.code ? snipHTML(s.code[0], s.code[1], s.code[2] || '', s.code[3] || 0, s.code[4] || [s.code[1]]) : ''}
    ${s.sql ? `<div class="codewrap k-sql"><div class="codebadge"><span>SQL que chega ao MySQL</span></div>${preCode('sql', s.sql)}</div>` : ''}
    <div class="panels">${panels.join('')}</div>
    ${s.before ? `<div class="two"><div><h4>tblAlunos antes</h4>${dbTable(s.before.slice().sort((a, b) => a.id - b.id), s.after, 'before')}</div><div><h4>tblAlunos depois</h4>${dbTable(s.after.slice().sort((a, b) => a.id - b.id), s.before, 'after')}</div></div>` : ''}
    ${s.grid ? `<h4>dtgAlunos depois do DataSource</h4>${dbTable(s.grid.map(r => Object.assign({}, r, { dtnasc: br(r.dtnasc) + ' 00:00:00' })))}` : ''}
    <p class="muted tr-foot">A operação foi executada uma vez, quando você clicou. Navegar pelos passos só mostra o que aconteceu.</p>`;
  $$('pre.code', box).forEach(paintPre);
}

/* ============================================================
   PÁGINAS
   ============================================================ */
const LESSON_EX = Object.fromEntries(LESSONS.map(l => [l.id, [...l.html.matchAll(/data-ex="(\w+)"/g)].map(m => m[1])]));
const EX_TOTAL = Object.keys(ALL_EX).length;
const solvedCount = ids => ids.filter(id => S.ex[id] && S.ex[id].ok).length;
function updateProgress() {
  const units = EX_TOTAL + LESSONS.length;
  const got = solvedCount(Object.keys(ALL_EX)) + LESSONS.filter(l => S.done[l.id]).length;
  const pct = Math.round(100 * got / units);
  const lab = $('#tpLabel'), fill = $('#tpFill');
  if (lab) { lab.textContent = `${pct}% concluído`; fill.style.width = pct + '%'; }
  $$('#nav [data-nav]').forEach(a => { const id = a.dataset.nav; const l = LESSONS.find(x => x.id === id); if (l) a.classList.toggle('done', !!S.done[id]); });
  const ec = $('#nav .err-count'); if (ec) ec.textContent = `${solvedCount(ERRORS.map(r => r.id))}/${ERRORS.length}`;
}

function drawNav() {
  const stages = LESSONS.map((l, i) => `<li><a href="#${l.id}" data-nav="${l.id}"><span class="n-num">${i + 1}</span><span class="n-txt"><small>${l.stage}</small>${l.title}</span><span class="n-chk" aria-hidden="true">✓</span></a></li>`).join('');
  $('#nav').innerHTML = `<div class="nav-in">
    <ul class="nav-list"><li><a href="#inicio" data-nav="inicio"><span class="n-ico" aria-hidden="true">⌂</span><span class="n-txt">Início</span></a></li></ul>
    <p class="nav-h">Trilha</p><ol class="nav-list">${stages}</ol>
    <p class="nav-h">Praticar</p><ul class="nav-list">
      <li><a href="#simulador" data-nav="simulador"><span class="n-ico" aria-hidden="true">▣</span><span class="n-txt">Simulador do formulário</span></a></li>
      <li><a href="#codigo" data-nav="codigo"><span class="n-ico" aria-hidden="true">{ }</span><span class="n-txt">Código explicado</span></a></li>
      <li><a href="#adaptar" data-nav="adaptar"><span class="n-ico" aria-hidden="true">⇆</span><span class="n-txt">Treino de adaptação</span></a></li>
      <li><a href="#erros" data-nav="erros"><span class="n-ico" aria-hidden="true">!</span><span class="n-txt">Erros comuns <small class="err-count"></small></span></a></li>
    </ul>
    <p class="nav-h">Revisar</p><ul class="nav-list"><li><a href="#revisao" data-nav="revisao"><span class="n-ico" aria-hidden="true">✦</span><span class="n-txt">Revisão rápida</span></a></li></ul>
  </div>`;
}

const PAGES = {
  inicio() {
    const next = LESSONS.find(l => !S.done[l.id]);
    return `<div class="hero"><p class="eyebrow">C# · Windows Forms · MySQL · .NET Framework 4.7.2</p>
      <h1>Do projeto da aula ao CRUD da prova</h1>
      <p class="lead">Aprenda a lógica do cadastro de alunos da professora, peça por peça, e treine para adaptar o mesmo padrão a uma tabela que você nunca viu.</p>
      <div class="hero-btns"><a class="btn primary lg" href="#${next ? next.id : 'revisao'}">${next ? (Object.keys(S.done).length ? 'Continuar: ' : 'Começar: ') + next.title : 'Ir para a revisão'}</a><a class="btn lg" href="#simulador">Abrir o simulador</a></div></div>
      ${note('info', 'Isto é uma simulação', '<p>Nada de C#, Windows Forms ou MySQL roda no navegador. O simulador e os exercícios reproduzem o comportamento do projeto em JavaScript, para você entender o que acontece. O código mostrado nas abas “Original” é o do projeto, sem alterações.</p>')}
      <h2>Como estudar para amanhã</h2>
      <div class="cards">
        <a class="card" href="#aula-1"><b>1. Faça a trilha</b><span>9 aulas curtas, cada uma com explicação, código real, uma interação e exercícios.</span></a>
        <a class="card" href="#simulador"><b>2. Use o simulador</b><span>Cadastre, selecione, altere e exclua, e acompanhe evento, código, objeto e SQL passo a passo.</span></a>
        <a class="card" href="#adaptar"><b>3. Treine a adaptação</b><span>Times, produtos e livros no modo guiado; tabelas inéditas no modo prova.</span></a>
        <a class="card" href="#erros"><b>4. Conheça os erros</b><span>O que quebra no exemplo e como evitar na hora da prova.</span></a>
        <a class="card" href="#codigo"><b>Código explicado</b><span>Clique em qualquer linha marcada dos arquivos originais.</span></a>
        <a class="card" href="#revisao"><b>Revisão rápida</b><span>Mapa do CRUD, ordem de implementação, flashcards e checklist final.</span></a>
      </div>
      <h2>Seu progresso</h2>
      <div class="prog-list">${LESSONS.map((l, i) => { const ids = LESSON_EX[l.id]; return `<a href="#${l.id}" class="prog-row${S.done[l.id] ? ' done' : ''}"><span class="n-num">${i + 1}</span><span class="pr-t">${l.title}</span><span class="pr-c">${solvedCount(ids)}/${ids.length} exercícios</span></a>`; }).join('')}</div>
      <div class="share">${note('tip', 'Compartilhando com a turma', '<p>Pode mandar o link para os colegas. O progresso e as respostas ficam salvos <b>só no navegador de cada pessoa</b>: não há login nem servidor, e ninguém vê o progresso de ninguém. Trocar de navegador, usar janela anônima ou limpar os dados do site começa do zero.</p>')}</div>
      <div class="reset-zone"><button type="button" class="btn ghost" id="resetAll">Reiniciar meu progresso</button></div>`;
  },
  simulador() {
    return `<p class="eyebrow">Praticar</p><h1>Simulador do FrmAlunos</h1>
      ${note('info', 'Simulação em JavaScript', '<p>O formulário imita o projeto da professora com dados fictícios. Nenhum C#, Windows Forms ou MySQL roda aqui, e o que você digita nunca é executado como código. As regras seguem o código original, inclusive os erros que ele não trata.</p>')}
      <div class="sim-bar"><label class="switch"><input type="checkbox" id="s-step" ${S.step ? 'checked' : ''}> Acompanhar passo a passo</label>
        <button type="button" class="btn" id="s-load">Ver o que o Load faz</button>
        <button type="button" class="btn ghost" id="s-reset">Restaurar demonstração</button></div>
      <div class="wf sim-win" id="s-win">
        <div class="wf-title"><span>FrmAlunos - CARLA CARDOSO GOMES MOREIRA</span><span class="wf-x" aria-hidden="true">✕</span></div>
        <div class="wf-body sim-body">
          <div class="sim-left">
            <div class="wf-panel"><label class="wf-lbl" for="s-id">ID</label><input id="s-id" class="wf-in" disabled></div>
            <div class="wf-pic" aria-hidden="true"><span>pctEscola</span></div>
          </div>
          <div class="sim-mid">
            <div class="sim-row">
              <div class="sim-f grow"><label class="wf-lbl" for="s-nome">Nome do aluno:</label><input id="s-nome" class="wf-in" autocomplete="off"></div>
              <div class="sim-f"><label class="wf-lbl" for="s-dt">Data Nascimento:</label><input id="s-dt" type="date" class="wf-in" value="${todayISO()}"></div>
            </div>
            <div class="sim-row">
              <fieldset class="wf-grp"><legend>Unidade</legend><label><input type="radio" name="s-un" id="s-rb"> Barroca</label><label><input type="radio" name="s-un" id="s-rf"> Floresta</label></fieldset>
              <fieldset class="wf-grp"><legend>Série</legend><label><input type="radio" name="s-se" id="s-r1"> 1ª</label><label><input type="radio" name="s-se" id="s-r2"> 2ª</label><label><input type="radio" name="s-se" id="s-r3"> 3ª</label></fieldset>
              <div class="sim-f"><label class="wf-lbl" for="s-t">Turma:</label><select id="s-t" class="wf-in"><option value=""></option><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select></div>
            </div>
            <div class="sim-gridwrap" id="s-grid" aria-label="dtgAlunos"></div>
          </div>
          <div class="sim-btns">
            <button type="button" class="wf-btn" data-op="cadastrar">Cadastrar</button>
            <button type="button" class="wf-btn" data-op="alterar">Alterar</button>
            <button type="button" class="wf-btn" data-op="excluir">Excluir</button>
            <button type="button" class="wf-btn" data-op="limpar">Limpar</button>
            <button type="button" class="wf-btn" data-op="sair">SAIR</button>
          </div>
        </div>
        <div class="sim-closed" id="s-closed" hidden><p>O FrmAlunos foi fechado com <code>this.Close()</code>. No programa real, você estaria de volta ao menu do FrmPrincipal.</p><button type="button" class="btn primary" id="s-reopen">Menu ALUNOS (abrir de novo)</button></div>
      </div>
      <p class="muted sim-tip">Dica: clique numa linha da grade para selecionar (CellClick). Experimente também o cabeçalho, a linha * e cadastrar sem turma.</p>
      <section class="trace" id="trace" aria-live="polite"></section>
      <div class="two sim-side">
        <div><h2 class="h3">Banco de dados (tblAlunos no MySQL)</h2><p class="muted">Em ordem de id, como está gravado. A grade mostra em ordem de nome.</p><div id="s-db"></div></div>
        <div><h2 class="h3">Últimas operações</h2><ul class="hist" id="s-hist"></ul></div>
      </div>`;
  },
  codigo() {
    return `<p class="eyebrow">Praticar</p><h1>Código explicado</h1>
      <p class="lead">Os arquivos originais do projeto. Linhas com marcador têm explicação: clique ou use Tab e Enter.</p>
      <div class="ce-bar"><div class="tabs" role="tablist" aria-label="Arquivos">${Object.keys(ANN).map((f, i) => `<button type="button" role="tab" class="tab" id="tab-${i}" data-f="${f}" aria-selected="false">${f}</button>`).join('')}</div>
      <label class="switch"><input type="checkbox" id="ce-simple" ${S.simple ? 'checked' : ''}> Em português simples</label></div>
      <div id="ce-info" class="ce-info"></div>
      <div id="ce-code" role="tabpanel"></div>`;
  },
  adaptar() {
    return `<p class="eyebrow">Praticar</p><h1>Treino de adaptação</h1>
      <p class="lead">O objetivo não é decorar nomes: é aprender a transformar o modelo do Aluno para qualquer tabela.</p>
      <div class="seg big" role="tablist" aria-label="Modo"><button type="button" role="tab" class="segb" data-mode="guiado">Modo guiado</button><button type="button" role="tab" class="segb" data-mode="prova">Modo prova simulada</button></div>
      <div id="ad-body"></div>`;
  },
  erros() {
    return `<p class="eyebrow">Praticar</p><h1>Erros comuns e limites do exemplo</h1>
      <p class="lead">O código da professora é ótimo para aprender o padrão, mas não valida as entradas. Saber o que quebra ajuda a testar e a explicar na prova.</p>
      ${note('info', 'Original x melhoria', '<p>Os trechos com selo <b>Original</b> são o código do projeto. Os com selo <b>Melhoria</b> não estão no original: são sugestões. Na prova, siga o padrão pedido pela professora.</p>')}
      ${ERRORS.map(r => `<section class="errcard" id="err-${r.id}"><h2 class="h3">${r.title}</h2>${r.ctx}${ex(r.id)}<details class="fixd"><summary>Como evitar</summary>${r.fix}</details></section>`).join('')}
      <section class="errcard improve" id="sql-injection"><p class="eyebrow">Seção complementar</p><h2 class="h3">Apóstrofos, SQL injection e consultas parametrizadas</h2>
        <p>O original monta o SQL juntando textos (<code>$"... '{nome}' ..."</code>). Qualquer apóstrofo digitado vira parte do comando.</p>
        ${widget('injecao')}
        <h3>Como ficaria com parâmetros</h3><p>Uma versão alternativa. Ela <b>não substitui</b> o padrão da aula; use só se a professora aceitar.</p>
        ${code('cs', `
// Em Conexao.cs: um SEGUNDO ExecutarComando, que recebe um MySqlCommand pronto
public void ExecutarComando(MySqlCommand comando)
{
    Conectar();
    try
    {
        comando.Connection = conn;
        comando.ExecuteNonQuery();
    }
    catch (MySqlException ex)
    {
        throw new Exception($"Instrução não executada.\\n{comando.CommandText}\\n{ex.Message}");
    }
    finally
    {
        conn.Close();
    }
}

// Em Aluno.cs (precisa de: using MySql.Data.MySqlClient;)
public void InserirAluno()
{
    MySqlCommand cmd = new MySqlCommand(
        "INSERT INTO tblAlunos VALUES (null, @nome, @dtnasc, @unidade, @serie, @turma);");
    cmd.Parameters.AddWithValue("@nome", nome);
    cmd.Parameters.AddWithValue("@dtnasc", dtnasc.Date);
    cmd.Parameters.AddWithValue("@unidade", unidade.ToString());
    cmd.Parameters.AddWithValue("@serie", serie);
    cmd.Parameters.AddWithValue("@turma", turma.ToString());
    db.ExecutarComando(cmd);
}`, 'melhoria')}
        <p>Os dois <code>ExecutarComando</code> podem existir juntos porque recebem parâmetros de tipos diferentes (sobrecarga). Com parâmetros, a data e números decimais também deixam de depender do formato do Windows.</p>
      </section>`;
  },
  revisao() {
    return `<p class="eyebrow">Revisar</p><h1>Revisão rápida</h1>
      <h2>Mapa do CRUD</h2>
      <div class="tablewrap"><table class="t map"><thead><tr><th></th><th>Evento</th><th>Lê da tela</th><th>Método do Aluno</th><th>SQL</th><th>Conexao</th><th>Depois</th></tr></thead><tbody>
        <tr><td><b class="crud c">C</b></td><td>btnCadastrar_Click</td><td>todos os campos</td><td>InserirAluno()</td><td>INSERT ... VALUES (null, ...)</td><td>ExecutarComando</td><td>MostrarDados, MessageBox, LimparDados</td></tr>
        <tr><td><b class="crud r">R</b></td><td>FrmAlunos_Load (e após cada operação)</td><td>—</td><td>ListarAlunos()</td><td>SELECT * ... ORDER BY nome</td><td>ExecutarConsulta</td><td>dtgAlunos.DataSource</td></tr>
        <tr><td><b class="crud r">R</b></td><td>dtgAlunos_CellClick</td><td>a linha clicada</td><td>—</td><td>—</td><td>—</td><td>preenche os controles</td></tr>
        <tr><td><b class="crud u">U</b></td><td>btnAlterar_Click</td><td>ID + todos os campos</td><td>setId + AlterarAluno()</td><td>UPDATE ... SET ... where id</td><td>ExecutarComando</td><td>MostrarDados, MessageBox, LimparDados</td></tr>
        <tr><td><b class="crud d">D</b></td><td>btnExcluir_Click</td><td>só o ID</td><td>setId + ExcluirAluno()</td><td>DELETE ... WHERE id</td><td>ExecutarComando</td><td>MessageBox, LimparDados, MostrarDados</td></tr>
      </tbody></table></div>
      <h2>Sequência de implementação</h2>
      <ol class="steps">
        <li>Rodar o script SQL no MySQL (banco + tabela).</li>
        <li>Criar o projeto Windows Forms (.NET Framework) e instalar o NuGet <code>MySql.Data</code>.</li>
        <li>Criar <code>Conexao.cs</code> com Conectar, ExecutarComando e ExecutarConsulta; ajustar o <code>database</code>.</li>
        <li>Criar a classe da entidade: atributos privados, Set/Get e os 4 métodos do CRUD.</li>
        <li>Desenhar o formulário, dando Name a cada controle antes de criar eventos.</li>
        <li>Criar <code>Entidade objX = new Entidade();</code> no formulário.</li>
        <li>Escrever <code>MostrarDados...()</code> e o evento Load.</li>
        <li>Escrever <code>LimparDados()</code> e o Click do Limpar e do Sair.</li>
        <li>Escrever o Cadastrar e testar.</li>
        <li>Escrever o CellClick (associado pelo ⚡) e testar a seleção.</li>
        <li>Escrever Alterar e Excluir, com ID e WHERE, e testar.</li>
      </ol>
      <h2>Trechos essenciais</h2>
      ${snip('Aluno.cs', 'public void SetNome(string nome)', 'return this.nome;', 1)}
      ${snip('Aluno.cs', 'string inserir = $"INSERT')}
      ${snip('Aluno.cs', 'string alterar = $"UPDATE')}
      ${snip('Aluno.cs', 'string deletar = $"DELETE')}
      ${snip('Conexao.cs', 'MySqlCommand comando = new MySqlCommand(sql, conn);', 'comando.ExecuteNonQuery();')}
      ${snip('Conexao.cs', 'MySqlDataAdapter dados = new MySqlDataAdapter(query, conn);', 'return dt;')}
      ${snip('FrmAlunos.cs', 'dtgAlunos.DataSource = objAluno.ListarAlunos();')}
      ${snip('FrmAlunos.cs', 'txtID.Text      = dtgAlunos', 'txtNome.Text    = dtgAlunos')}
      <h2>Flashcards</h2><p class="muted">Tente responder antes de virar o cartão.</p>
      <div class="flash">${FLASH.map((f, i) => `<div class="fc${S.flash[i] ? ' known' : ''}" data-i="${i}"><p class="fc-q">${esc(f[0])}</p><div class="fc-a" id="fca-${i}" hidden><p>${esc(f[1])}</p></div><div class="fc-btns"><button type="button" class="btn sm" data-flip="${i}" aria-expanded="false" aria-controls="fca-${i}">Mostrar resposta</button><button type="button" class="btn sm ghost" data-know="${i}" aria-pressed="${!!S.flash[i]}">${S.flash[i] ? 'Já sei ✓' : 'Marcar como sei'}</button></div></div>`).join('')}</div>
      <h2>Checklist final</h2>
      <fieldset class="crit big"><legend class="sr">Checklist final</legend>${FINAL_CHECK.map((t, i) => `<label><input type="checkbox" data-fc="${i}" ${S.checks['final' + i] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>
      <div class="reset-zone"><button type="button" class="btn ghost" id="resetAll">Reiniciar meu progresso</button></div>`;
  }
};

function lessonPage(l) {
  const i = LESSONS.indexOf(l), prev = LESSONS[i - 1], next = LESSONS[i + 1];
  const ids = LESSON_EX[l.id];
  return `<p class="eyebrow">Aula ${i + 1} de ${LESSONS.length} · ${l.stage} · cerca de ${l.min} min</p>
    <h1>${l.title}</h1>${l.html}
    <div class="lesson-end"><p><b class="les-count">${solvedCount(ids)} de ${ids.length}</b> exercícios desta aula resolvidos.</p>
    <button type="button" class="btn ${S.done[l.id] ? '' : 'primary'}" id="markDone" aria-pressed="${!!S.done[l.id]}">${S.done[l.id] ? 'Aula concluída ✓ (desmarcar)' : 'Marcar aula como concluída'}</button></div>
    <nav class="pager" aria-label="Navegação entre aulas">${prev ? `<a class="btn" href="#${prev.id}">← ${prev.title}</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#${next.id}">${next.title} →</a>` : '<a class="btn primary" href="#adaptar">Treino de adaptação →</a>'}</nav>`;
}

/* ---------- explorador de código ---------- */
const FILE_INFO = {
  'Script_DBEscola.sql': 'Roda no MySQL (não no C#). Cria o banco e a tabela.',
  'Program.cs': 'Ponto de entrada do programa. Gerado pelo Visual Studio.',
  'FrmPrincipal.cs': 'Menu principal. Abre o FrmAlunos.',
  'FrmAlunos.cs': 'Eventos do formulário de alunos. É aqui que você escreve a maior parte do código.',
  'FrmAlunos.designer.cs': 'Gerado pelo Designer. Não edite à mão; está aqui para você entender as ligações dos eventos.',
  'Aluno.cs': 'A entidade: atributos, Get/Set e os métodos do CRUD.',
  'Conexao.cs': 'Abre a conexão com o MySQL e executa os comandos.'
};
function drawExplorer(f) {
  $$('.tab').forEach(t => { const on = t.dataset.f === f; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  const lines = origLines(f), lang = f.endsWith('.sql') ? 'sql' : 'cs', anns = ANN[f] || [];
  const start = {}, member = {};
  anns.forEach((a, k) => {
    let i = -1; const occ = a.o || 0; let seen = 0;
    for (let x = 0; x < lines.length; x++) if (lines[x].includes(a.m)) { if (seen === occ) { i = x; break; } seen++; }
    if (i < 0) { console.warn('Anotação sem linha:', f, a.m); return; }
    start[i] = k; for (let y = i; y < i + (a.n || 1); y++) member[y] = k;
  });
  $('#ce-info').innerHTML = `<p>${FILE_INFO[f]}</p>`;
  let h = '';
  lines.forEach((l, i) => {
    const k = member[i];
    if (start[i] !== undefined) h += `<div class="ann-group" data-k="${k}">`;
    const isStart = start[i] !== undefined;
    h += `<div class="ln${k !== undefined ? ' annl' : ''}"${isStart ? ` role="button" tabindex="0" aria-expanded="false" aria-controls="exp-${k}" data-k="${k}"` : ''}><span class="no">${i + 1}</span><span class="mk" aria-hidden="true">${isStart ? '●' : ''}</span><span class="tx">${hlLine(l, lang)}</span></div>`;
    const endsGroup = k !== undefined && member[i + 1] !== k;
    if (endsGroup) {
      const a = anns[k];
      h += `<div class="simple"${S.simple ? '' : ' hidden'}>≈ ${esc(a.simple || a.what)}</div>`;
      h += `<div class="exp" id="exp-${k}" hidden><dl>${[['O que faz', a.what], ['Por que está aqui', a.why], ['De onde vêm os valores', a.from], ['O que acontece em seguida', a.next], ['Em outro tema', a.adapt]].filter(x => x[1]).map(x => `<dt>${x[0]}</dt><dd>${esc(x[1])}</dd>`).join('')}</dl></div></div>`;
    }
  });
  $('#ce-code').innerHTML = `<div class="codewrap k-orig"><div class="codebadge"><span>${BADGE.orig}</span><span class="cb-label">${esc(f)} · ${lines.length} linhas · ${anns.length} explicações</span></div><div class="ce-lines code">${h}</div></div>`;
  $('#ce-code').setAttribute('aria-labelledby', $(`.tab[data-f="${f}"]`).id);
}

/* ---------- treino de adaptação ---------- */
let adMode = 'guiado', adEnt = 'times', adExam = 'veiculos';
function drawAdapt() {
  $$('[data-mode]').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === adMode));
  const box = $('#ad-body');
  if (adMode === 'guiado') {
    const E = ENTITIES[adEnt], R = G.build(E);
    box.innerHTML = `<div class="seg" role="group" aria-label="Tema">${Object.entries(ENTITIES).map(([k, v]) => `<button type="button" class="segb" data-ent="${k}" aria-pressed="${k === adEnt}">${v.title}</button>`).join('')}</div>
      <h2>A tabela</h2>${code('sql', R.script, 'adaptado', `${E.db}`)}
      <h2>Correspondência com o exemplo Aluno</h2>
      <div class="tablewrap"><table class="t map"><thead><tr><th>Coluna SQL</th><th>Atributo C#</th><th>Controle</th><th>Leitura no clique</th><th>No SQL</th><th>No CellClick</th><th>Em Aluno</th></tr></thead><tbody>
      <tr><td><code>id</code> int PK auto_increment</td><td><code>private int id;</code></td><td><code>txtID</code> (desabilitado)</td><td><code>int.Parse(txtID.Text)</code> só em Alterar/Excluir</td><td><code>null</code> no INSERT; <code>WHERE id</code></td><td><code>txtID.Text = ...</code></td><td>id</td></tr>
      ${R.map.map(m => `<tr><td><code>${m.f.col}</code> ${esc(m.f.sql.replace(' not null', ''))}</td><td><code>private ${m.cs} ${m.f.col};</code></td><td><code>${esc(m.ctl)}</code></td><td><code>${esc(m.read)}</code></td><td><code>${esc(m.sql)}</code></td><td><code>${esc(m.cell)}</code></td><td>${esc(m.f.like)}</td></tr>`).join('')}
      </tbody></table></div>
      <h2>Trechos afetados</h2>
      <div class="tablewrap"><table class="t"><thead><tr><th>No exemplo</th><th>Neste tema</th></tr></thead><tbody>
        <tr><td><code>Aluno.cs</code>, <code>class Aluno</code></td><td><code>${E.E}.cs</code>, <code>class ${E.E}</code></td></tr>
        <tr><td><code>InserirAluno</code> / <code>AlterarAluno</code> / <code>ExcluirAluno</code></td><td><code>Inserir${E.E}</code> / <code>Alterar${E.E}</code> / <code>Excluir${E.E}</code></td></tr>
        <tr><td><code>ListarAlunos</code> / <code>MostrarDadosAlunos</code></td><td><code>Listar${E.plural}</code> / <code>MostrarDados${E.plural}</code></td></tr>
        <tr><td><code>tblAlunos</code> · <code>DB_EscolaCRUD</code></td><td><code>${E.table}</code> · <code>${E.db}</code></td></tr>
        <tr><td><code>FrmAlunos</code> · <code>dtgAlunos</code> · <code>objAluno</code></td><td><code>${E.form}</code> · <code>${E.grid}</code> · <code>${E.obj}</code></td></tr>
      </tbody></table></div>
      ${E.fields.some(f => f.kind === 'decimal' || f.kind === 'bool') ? note('warn', 'Este tema tem algo que o exemplo não tem', E.fields.some(f => f.kind === 'decimal') ? '<p>A coluna decimal precisa de <code>CultureInfo.InvariantCulture</code> ao montar o SQL, para sair com ponto (12.50) e não vírgula (12,50). É um ajuste fora do padrão da aula, marcado no código.</p>' : '<p>A coluna sim/não usa CheckBox: <code>.Checked</code> na leitura, <code>(x ? 1 : 0)</code> no SQL e <code>Convert.ToBoolean</code> no CellClick. Não há equivalente no exemplo.</p>') : ''}
      ${solution(E, R)}`;
  } else {
    const E = EXAMS[adExam], R = G.build(E), open = S.drafts[adExam + '_open'];
    box.innerHTML = `<div class="seg" role="group" aria-label="Tabela da prova">${Object.entries(EXAMS).map(([k, v]) => `<button type="button" class="segb" data-exam="${k}" aria-pressed="${k === adExam}">${v.title}</button>`).join('')}</div>
      <div class="exam-sheet"><p class="eyebrow">Enunciado</p><p>${esc(E.story)}</p><p>Construa, em C# com Windows Forms e MySQL, um CRUD completo para a tabela abaixo seguindo o padrão das aulas: cadastrar, listar no DataGridView ao abrir, selecionar uma linha, alterar, excluir e limpar.</p>${code('sql', R.script, 'adaptado', E.db)}</div>
      <h2>Planeje e escreva antes de abrir a solução</h2><p class="muted">Seus rascunhos ficam salvos neste navegador.</p>
      <div class="drafts">${EXAM_PARTS.map(([k, t]) => `<label class="draft"><span>${t}</span><textarea class="codearea" rows="6" spellcheck="false" data-draft="${adExam}_${k}">${esc(S.drafts[adExam + '_' + k] || '')}</textarea></label>`).join('')}</div>
      <div class="w-btns"><button type="button" class="btn primary" id="examOpen">${open ? 'Esconder a solução' : 'Abrir a solução comentada'}</button></div>
      ${open ? `${solution(E, R)}<h2>Checklist de comparação</h2><fieldset class="crit big"><legend class="sr">Checklist</legend>${EXAM_CHECK.map((t, i) => `<label><input type="checkbox" data-ec="${adExam}_${i}" ${S.checks[adExam + '_' + i] ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>` : ''}`;
  }
  mount(box);
}
function solution(E, R) {
  return `<h2>Solução comentada</h2>
    <details class="sol" open><summary>${E.E}.cs (a classe da entidade)</summary>${code('cs', R.cls, 'adaptado', `${E.E}.cs`)}</details>
    <details class="sol"><summary>Conexao.cs (o que muda)</summary>${code('cs', R.conn, 'adaptado', 'Conexao.cs')}<p>O resto da Conexao fica igual ao da professora.</p></details>
    <details class="sol"><summary>Controles no Designer</summary><div class="tablewrap"><table class="t"><thead><tr><th>Tipo</th><th>Name</th><th>Propriedades</th><th>Evento (⚡)</th></tr></thead><tbody>${R.ctrls.map(c => `<tr><td>${esc(c[0])}</td><td><code>${esc(c[1])}</code></td><td>${esc(c[2])}</td><td>${esc(c[3])}</td></tr>`).join('')}</tbody></table></div><p class="muted">Adicione também os Labels com o texto de cada campo. Labels não precisam de Name especial porque o código não os usa.</p></details>
    <details class="sol"><summary>${E.form}.cs (os eventos)</summary>${code('cs', R.form, 'adaptado', `${E.form}.cs`)}<p class="muted">Melhorias como conferir campos vazios ou <code>e.RowIndex &lt; 0</code> estão em <a href="#erros">Erros comuns</a>. Elas não fazem parte do padrão da aula.</p></details>`;
}

/* ---------- roteador ---------- */
function route() {
  const id = (location.hash || '#inicio').slice(1);
  const lesson = LESSONS.find(l => l.id === id);
  const page = lesson ? 'licao' : (PAGES[id] ? id : 'inicio');
  const main = $('#main');
  main.innerHTML = `<div class="page page-${page}">${lesson ? lessonPage(lesson) : PAGES[page]()}</div>`;
  mount(main);
  $$('#nav [data-nav]').forEach(a => { if (a.dataset.nav === (lesson ? lesson.id : page)) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = (lesson ? lesson.title : { inicio: 'Início', simulador: 'Simulador', codigo: 'Código explicado', adaptar: 'Treino de adaptação', erros: 'Erros comuns', revisao: 'Revisão rápida' }[page]) + ' · Oficina CRUD WinForms';
  closeNav();
  window.scrollTo(0, 0);
  if (route.started) main.focus({ preventScroll: true });
  route.started = true;
  if (page === 'simulador') { drawSim(); drawTrace(); }
  if (page === 'codigo') drawExplorer(route.file || 'FrmAlunos.cs');
  if (page === 'adaptar') drawAdapt();
  updateProgress();
}

/* ---------- eventos globais ---------- */
function closeNav() { document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); }
$('#menuBtn').addEventListener('click', () => { const o = document.body.classList.toggle('nav-open'); $('#menuBtn').setAttribute('aria-expanded', o); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav(); });

document.addEventListener('click', e => {
  const t = e.target;
  // lição
  if (t.id === 'markDone') { const id = location.hash.slice(1); S.done[id] = !S.done[id]; if (!S.done[id]) delete S.done[id]; save(); const b = t; b.textContent = S.done[id] ? 'Aula concluída ✓ (desmarcar)' : 'Marcar aula como concluída'; b.classList.toggle('primary', !S.done[id]); b.setAttribute('aria-pressed', !!S.done[id]); return; }
  // reiniciar com confirmação em duas etapas
  if (t.id === 'resetAll') {
    if (t.dataset.armed) { try { localStorage.removeItem(KEY); } catch (err) { /* ok */ } S = defaults(); SIM.obj = SIM.newObj(); SIM.traces = []; SIM.cur = null; SIM.closed = false; save(); route(); return; }
    t.dataset.armed = '1'; t.textContent = 'Clique de novo para apagar tudo (não dá para desfazer)'; t.classList.add('danger');
    setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = 'Reiniciar meu progresso'; t.classList.remove('danger'); } }, 5000);
    return;
  }
  // simulador
  const op = t.closest('[data-op]'); if (op && op.closest('#s-win')) { simOp(op.dataset.op); return; }
  if (t.closest('#s-grid')) { const b = t.closest('button'); if (b) simOp('cell', b.dataset.h ? -1 : b.dataset.new ? 'new' : +b.dataset.r); return; }
  if (t.id === 's-reset') { S.sim = null; SIM.obj = SIM.newObj(); SIM.traces = []; SIM.cur = null; SIM.closed = false; SIM.sel = null; save(); simWrite(CLEAR()); drawSim(); drawTrace(); return; }
  if (t.id === 's-load') { simOp('load'); return; }
  if (t.id === 's-reopen') { simOp('reopen'); return; }
  const mv = t.closest('#trace [data-mv]'); if (mv) { SIM.idx = Math.max(0, Math.min(SIM.cur.steps.length - 1, SIM.idx + +mv.dataset.mv)); drawTrace(); const nb = $(`#trace [data-mv="${mv.dataset.mv}"]`); (nb && !nb.disabled ? nb : $('#trace [data-mv]:not([disabled])')).focus(); return; }
  const go = t.closest('#trace [data-go]'); if (go) { SIM.idx = +go.dataset.go; drawTrace(); $(`#trace [data-go="${SIM.idx}"]`).focus(); return; }
  const tr = t.closest('[data-tr]'); if (tr) { SIM.cur = SIM.traces[+tr.dataset.tr]; SIM.idx = 0; drawTrace(); $('#trace').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); return; }
  // explorador
  const tab = t.closest('.tab'); if (tab) { route.file = tab.dataset.f; drawExplorer(tab.dataset.f); return; }
  const ln = t.closest('.ln[data-k]'); if (ln) { toggleAnn(ln); return; }
  // adaptação
  const md = t.closest('[data-mode]'); if (md) { adMode = md.dataset.mode; drawAdapt(); return; }
  const en = t.closest('[data-ent]'); if (en) { adEnt = en.dataset.ent; drawAdapt(); return; }
  const exm = t.closest('[data-exam]'); if (exm) { adExam = exm.dataset.exam; drawAdapt(); return; }
  if (t.id === 'examOpen') { S.drafts[adExam + '_open'] = !S.drafts[adExam + '_open']; save(); drawAdapt(); return; }
  // flashcards
  const fl = t.closest('[data-flip]'); if (fl) { const a = document.getElementById('fca-' + fl.dataset.flip); a.hidden = !a.hidden; fl.setAttribute('aria-expanded', !a.hidden); fl.textContent = a.hidden ? 'Mostrar resposta' : 'Esconder resposta'; return; }
  const kn = t.closest('[data-know]'); if (kn) { const i = kn.dataset.know; S.flash[i] = !S.flash[i]; save(); kn.textContent = S.flash[i] ? 'Já sei ✓' : 'Marcar como sei'; kn.setAttribute('aria-pressed', !!S.flash[i]); kn.closest('.fc').classList.toggle('known', !!S.flash[i]); return; }
});
function toggleAnn(ln) {
  const ex = document.getElementById('exp-' + ln.dataset.k); const open = ex.hidden;
  ex.hidden = !open; ln.setAttribute('aria-expanded', open); ln.closest('.ann-group').classList.toggle('open', open);
}
document.addEventListener('keydown', e => {
  const ln = e.target.closest && e.target.closest('.ln[data-k]');
  if (ln && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleAnn(ln); }
  const tab = e.target.closest && e.target.closest('.tab');
  if (tab && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { const tabs = $$('.tab'); const i = tabs.indexOf(tab); const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.click(); n.focus(); }
  const cell = e.target.closest && e.target.closest('#s-grid');
  if (cell && e.key === 'Escape') e.target.blur();
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 's-step') { S.step = t.checked; save(); }
  if (t.id === 'ce-simple') { S.simple = t.checked; save(); $$('.simple').forEach(s => s.hidden = !S.simple); }
  if (t.dataset.fc !== undefined) { S.checks['final' + t.dataset.fc] = t.checked; save(); }
  if (t.dataset.ec !== undefined) { S.checks[t.dataset.ec] = t.checked; save(); }
});
document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.draft) { S.drafts[t.dataset.draft] = t.value; save(); } });
// recalcula contadores das aulas quando um exercício muda
const _save = save;
save = function () { _save(); const lc = $('.les-count'); if (lc) { const ids = LESSON_EX[location.hash.slice(1)] || []; lc.textContent = `${solvedCount(ids)} de ${ids.length}`; } };

window.addEventListener('hashchange', route);
drawNav();
route();

// Autoteste rápido das anotações e trechos (só avisa no console).
(function selfCheck() {
  let bad = 0;
  Object.entries(ANN).forEach(([f, list]) => list.forEach(a => { if (!ORIG[f].includes(a.m)) { bad++; console.warn('ANN sem match', f, a.m); } }));
  console.assert(norm("if (a)\n  x = 1;") === 'if(a)x=1;', 'norm');
  console.assert(G.build(ENTITIES.produtos).cls.includes("'{preco.ToString(CultureInfo.InvariantCulture)}'"), 'gen decimal');
  if (bad) console.warn(bad + ' anotações sem linha');
})();
})();
