(function () {
  'use strict';
  const core = globalThis.DeckCore;
  const deck = JSON.parse(document.getElementById('deck-data').textContent);
  const STORE_KEY = 'deck-review:' + deck.deckId;

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => c != null && el.append(c));
    return el;
  };

  const state = { choices: {}, comments: {}, pos: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) {
      state.choices = saved.choices || {};
      state.comments = saved.comments || {};
      state.pos = Number.isInteger(saved.pos) ? saved.pos : 0;
    }
  } catch (e) {
    // Unreadable saved data is treated as no saved answers.
  }
  state.pos = Math.min(Math.max(state.pos, 0), deck.cards.length - 1);

  let savedTimer;
  let saveDelay;
  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      savedLabel.textContent = 'Saved';
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => { savedLabel.textContent = ''; }, 1500);
    } catch (e) {
      savedLabel.textContent = 'Could not save in this browser';
    }
  }
  function persistSoon() {
    clearTimeout(saveDelay);
    saveDelay = setTimeout(persist, 250);
  }

  const answered = (card) => Boolean(state.choices[card.id] || (state.comments[card.id] || '').trim());

  const savedLabel = h('span', { class: 'saved' });
  const counter = h('span', { class: 'counter' });
  const dots = h('div', { class: 'dots' });
  const stage = h('main', { class: 'stage' });
  const prevBtn = h('button', { class: 'btn', onclick: () => go(state.pos - 1) }, 'Previous');
  const nextBtn = h('button', { class: 'btn', onclick: () => go(state.pos + 1) }, 'Next');
  const clearBtn = h('button', { class: 'btn ghost', onclick: confirmClear }, 'Clear answers');
  const submitBtn = h('button', { class: 'btn primary', onclick: submit }, 'Submit');

  document.body.append(
    h('header', { class: 'bar' },
      h('div', { class: 'bar-left' }, h('h1', {}, deck.title), counter),
      dots,
      h('div', { class: 'bar-right' }, savedLabel, clearBtn, submitBtn)),
    stage,
    h('footer', { class: 'nav' }, prevBtn, nextBtn));

  function go(i) {
    if (i < 0 || i >= deck.cards.length) return;
    state.pos = i;
    persist();
    render();
  }

  function renderDots() {
    dots.replaceChildren(...deck.cards.map((card, i) => h('button', {
      class: 'dot' + (answered(card) ? ' done' : '') + (i === state.pos ? ' current' : ''),
      title: (i + 1) + '. ' + card.title,
      'aria-label': 'Go to card ' + (i + 1),
      onclick: () => go(i),
    })));
  }

  function zoomImage(src) {
    const layer = overlay(h('img', { class: 'zoomed', src, alt: '', onclick: () => layer.remove() }));
  }

  function renderEvidence(ev) {
    if (ev.kind === 'image') {
      return h('details', { class: 'evidence image', open: true },
        h('summary', {}, ev.title),
        h('img', { class: 'shot', src: ev.src, alt: ev.title, title: 'Click to enlarge', onclick: () => zoomImage(ev.src) }),
        ev.caption ? h('p', { class: 'caption' }, ev.caption) : null);
    }
    if (ev.kind === 'link') {
      return h('div', { class: 'evidence link' },
        h('a', { href: ev.url, target: '_blank', rel: 'noopener noreferrer' }, ev.title));
    }
    return h('details', { class: 'evidence' },
      h('summary', {}, ev.title),
      h('pre', {}, h('code', {}, ev.body)));
  }

  function renderCard() {
    const card = deck.cards[state.pos];
    const recPick = card.recommendation && card.recommendation.pick;

    const chips = [card.ref, ...(card.labels || [])].filter(Boolean);
    const body = h('div', { class: 'card-body' },
      chips.length ? h('div', { class: 'chips' }, chips.map((c, i) => h('span', { class: 'chip' + (i === 0 && card.ref ? ' ref' : '') }, c))) : null,
      h('h2', {}, card.title),
      h('p', { class: 'issue' }, card.issue),
      card.context ? h('div', { class: 'context', html: core.renderMarkdown(card.context) }) : null,
      card.recommendation ? h('div', { class: 'recommendation' },
        h('strong', {}, recPick ? 'Recommendation: ' + recPick : 'Recommendation'),
        h('p', {}, card.recommendation.why)) : null,
      card.options ? h('div', { class: 'options', role: 'group', 'aria-label': 'Options' },
        card.options.map((opt) => {
          const on = state.choices[card.id] === opt.id;
          return h('button', {
            class: 'option' + (on ? ' on' : ''),
            'aria-pressed': on ? 'true' : 'false',
            onclick: () => {
              if (state.choices[card.id] === opt.id) delete state.choices[card.id];
              else state.choices[card.id] = opt.id;
              persist();
              render();
            },
          },
          h('span', { class: 'opt-id' }, opt.id),
          h('span', { class: 'opt-text' },
            h('strong', {}, opt.label, opt.id === recPick ? h('em', { class: 'tag' }, 'Recommended') : null),
            opt.detail ? h('small', {}, opt.detail) : null));
        })) : null,
      card.evidence && card.evidence.length ? h('div', { class: 'evidence-list' }, card.evidence.map(renderEvidence)) : null);

    const box = h('textarea', {
      class: 'comment',
      placeholder: 'Your comment',
      'aria-label': 'Comment',
      rows: '4',
    });
    box.value = state.comments[card.id] || '';
    box.addEventListener('input', () => {
      if (box.value.trim()) state.comments[card.id] = box.value;
      else delete state.comments[card.id];
      persistSoon();
      renderDots();
    });

    return h('section', { class: 'card' }, body, h('div', { class: 'card-foot' }, box));
  }

  function render() {
    counter.textContent = (state.pos + 1) + ' of ' + deck.cards.length;
    prevBtn.disabled = state.pos === 0;
    nextBtn.disabled = state.pos === deck.cards.length - 1;
    renderDots();
    stage.replaceChildren(renderCard());
  }

  function toast(msg) {
    const t = h('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), 1800);
  }

  function overlay(content) {
    const layer = h('div', { class: 'overlay', onclick: (e) => { if (e.target === layer) layer.remove(); } }, content);
    document.body.append(layer);
    return layer;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  async function submit() {
    const text = core.buildResponse(deck, state);
    const ok = await copyText(text);
    const box = h('textarea', { class: 'result', readonly: true, rows: '16' });
    box.value = text;
    const layer = overlay(h('div', { class: 'sheet' },
      h('h3', {}, ok ? 'Copied. Paste it to the agent.' : 'Could not copy automatically. Copy the text below.'),
      box,
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', onclick: async () => { toast((await copyText(text)) ? 'Copied' : 'Copy failed'); } }, 'Copy again'),
        h('button', { class: 'btn primary', onclick: () => layer.remove() }, 'Close'))));
    box.focus();
    box.select();
    if (ok) toast('Copied');
  }

  function confirmClear() {
    const layer = overlay(h('div', { class: 'sheet small', role: 'alertdialog', 'aria-label': 'Confirm clear' },
      h('h3', {}, 'Clear all answers?'),
      h('p', {}, 'Every choice and comment in this deck will be removed from this browser. This cannot be undone.'),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn', onclick: () => layer.remove() }, 'Cancel'),
        h('button', {
          class: 'btn danger',
          onclick: () => {
            state.choices = {};
            state.comments = {};
            state.pos = 0;
            persist();
            layer.remove();
            render();
            toast('Cleared');
          },
        }, 'Clear'))));
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('textarea, input') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') go(state.pos + 1);
    if (e.key === 'ArrowLeft') go(state.pos - 1);
  });

  document.title = deck.title;
  render();
})();
