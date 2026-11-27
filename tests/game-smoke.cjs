const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'outputs', 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'game should contain an inline script');
const gameScript = scriptMatch[1];
new vm.Script(gameScript);

assert.match(html, /min-width:44px;min-height:44px/, 'star targets should be at least 44 CSS px');
assert.match(html, /prefers-reduced-motion:reduce/, 'decorative motion should respect reduced-motion');
assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/, 'the viewport must remain zoomable');

function createGame({ storageBlocked = false } = {}) {
  const elements = new Map();
  const intervals = [];
  const listeners = new Map();
  const saved = new Map();
  let now = 0;

  function element() {
    const classes = new Set();
    return {
      textContent: '', innerHTML: '', attrs: {}, style: {}, disabled: false, active: true,
      classList: {
        add: value => classes.add(value),
        remove: value => classes.delete(value),
        contains: value => classes.has(value),
      },
      setAttribute(name, value) { this.attrs[name] = value; },
      remove() { this.active = false; },
    };
  }

  const arena = element();
  const stars = [];
  arena.querySelectorAll = () => stars.filter(star => star.active);
  arena.appendChild = star => stars.push(star);
  elements.set('#arena', arena);
  for (const selector of ['#score', '#time', '#best', '#overlay', '#toast', '#start', '#sound', '#hero', '#ovtitle', '#ovcopy']) {
    elements.set(selector, element());
  }

  const document = {
    visibilityState: 'visible',
    querySelector: selector => elements.get(selector),
    createElement: () => element(),
    addEventListener: (name, callback) => listeners.set(name, callback),
  };

  const audio = {
    currentTime: 0,
    destination: {},
    createOscillator() {
      return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} };
    },
    createGain() {
      return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    },
  };
  class AudioContext { constructor() { Object.assign(this, audio); } }

  const localStorage = storageBlocked
    ? { getItem() { throw Error('storage blocked'); }, setItem() { throw Error('storage blocked'); } }
    : { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;

  vm.runInNewContext(gameScript, {
    document,
    localStorage,
    performance: { now: () => now },
    window: { AudioContext },
    Math: deterministicMath,
    setInterval: callback => { intervals.push(callback); return intervals.length; },
    clearInterval() {},
    setTimeout() {},
  });

  return {
    elements, intervals, listeners, saved, stars, document,
    start: () => elements.get('#start').onclick(),
    setTime: value => { now = value; },
    changeVisibility: state => {
      document.visibilityState = state;
      listeners.get('visibilitychange')();
    },
  };
}

{
  const game = createGame();
  assert.equal(game.elements.get('#best').textContent, 0);
  game.start();
  const star = game.stars.find(item => item.active);
  assert.equal(star.attrs['aria-label'], '收集金色星星');
  star.onclick();
  star.onclick();
  assert.equal(game.elements.get('#score').textContent, 2, 'a star should only score once');

  game.setTime(15_500);
  game.intervals[1]();
  assert.equal(game.elements.get('#time').textContent, 15, 'remaining time should follow elapsed monotonic time');

  game.changeVisibility('hidden');
  assert.equal(game.stars.filter(item => item.active).length, 0, 'hiding the page should clear existing targets');
  game.intervals[0]();
  assert.equal(game.stars.filter(item => item.active).length, 0, 'hidden pages should not spawn targets');

  game.setTime(30_500);
  game.changeVisibility('visible');
  assert.equal(game.elements.get('#ovtitle').textContent, '今天也收穫滿滿');
  assert.equal(game.elements.get('#best').textContent, 2);
  assert.equal(game.saved.get('starBest'), '2');

  const sound = game.elements.get('#sound');
  sound.onclick({ currentTarget: sound });
  assert.equal(sound.attrs['aria-pressed'], 'false');
  assert.equal(sound.attrs['aria-label'], '開啟音效');
  sound.onclick({ currentTarget: sound });
  assert.equal(sound.attrs['aria-pressed'], 'true');
}

{
  const game = createGame();
  game.start();
  const star = game.stars.find(item => item.active);
  game.setTime(30_001);
  star.onclick();
  assert.equal(game.elements.get('#score').textContent, 0, 'a late click must not score after the deadline');
  assert.equal(game.elements.get('#ovtitle').textContent, '今天也收穫滿滿');
}

{
  const game = createGame({ storageBlocked: true });
  game.start();
  game.stars.find(item => item.active).onclick();
  game.setTime(30_500);
  game.changeVisibility('visible');
  assert.equal(game.elements.get('#score').textContent, 2);
  assert.equal(game.elements.get('#best').textContent, 2, 'session best should still display when storage is blocked');
  assert.equal(game.elements.get('#ovtitle').textContent, '今天也收穫滿滿');
}

console.log('PASS: one-shot scoring, deadline clock, visibility changes, storage fallback, sound state, and accessibility markup');
