#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const core = require('./runtime/deck-core.js');

const args = process.argv.slice(2);
const outFlag = args.indexOf('-o');
const output = outFlag >= 0 ? args[outFlag + 1] : null;
const input = args.find((a, i) => !a.startsWith('-') && args[i - 1] !== '-o');
if (!input) {
  console.error('usage: node build.mjs cards.json [-o out.html]');
  process.exit(2);
}

const inPath = resolve(input);
let deck;
try {
  deck = JSON.parse(readFileSync(inPath, 'utf8'));
} catch (e) {
  console.error('Cannot read ' + inPath + ': ' + e.message);
  process.exit(1);
}

const errors = core.validateDeck(deck);
if (errors.length) {
  console.error('The deck has ' + errors.length + ' problem' + (errors.length > 1 ? 's' : '') + ':');
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
const imageErrors = [];
deck.cards.forEach((card, ci) => {
  (card.evidence || []).forEach((ev, ei) => {
    if (ev.kind !== 'image' || !ev.path) return;
    const file = resolve(dirname(inPath), ev.path);
    const mime = MIME[extname(file).toLowerCase()];
    if (!mime) {
      imageErrors.push('Card ' + (ci + 1) + ' (' + card.id + '): evidence ' + (ei + 1) + ' image must be png, jpg, gif or webp.');
      return;
    }
    if (!existsSync(file)) {
      imageErrors.push('Card ' + (ci + 1) + ' (' + card.id + '): evidence ' + (ei + 1) + ' image file not found: ' + ev.path);
      return;
    }
    ev.src = 'data:' + mime + ';base64,' + readFileSync(file).toString('base64');
    delete ev.path;
  });
});
if (imageErrors.length) {
  console.error('The deck has ' + imageErrors.length + ' image problem' + (imageErrors.length > 1 ? 's' : '') + ':');
  imageErrors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

const read = (name) => readFileSync(join(here, 'runtime', name), 'utf8');
const data = JSON.stringify(deck)
  .replace(/</g, '\\u003c')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

const parts = {
  TITLE: core.esc(deck.title),
  CSS: read('deck.css'),
  DATA: data,
  CORE: read('deck-core.js'),
  APP: read('deck.js'),
};
const html = read('deck.html').replace(/\{\{(TITLE|CSS|DATA|CORE|APP)\}\}/g, (m, key) => parts[key]);

const outPath = resolve(output || join(dirname(inPath), 'deck.html'));
writeFileSync(outPath, html);
console.log('Wrote ' + outPath + ' (' + deck.cards.length + ' cards)');
