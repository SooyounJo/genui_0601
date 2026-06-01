import { createRoot } from 'react-dom/client';
import { createElement, useEffect } from 'react';
import ShinyText from './ShinyText';

var SETTLED_COLOR = '#4C5B17';
var INK_DARK = '#3A4729';
var SHINE_PEAK = '#FFFFFF';
var SHINE_MID = '#E8FFD8';

var PILL_TEXT_SELECTORS = [
  '#test3-weather .dot-w21--party-pill .dot-w21__compact .dot-w21__pillTitle',
  '#test3-weather .dot-w21--party-pill .dot-w21__compact .dot-w21__pillSub',
  '#test3-steps .dot-steps21--pace-pill .dot-steps21__compact .dot-steps21__pillTitle',
  '#test3-steps .dot-steps21--pace-pill .dot-steps21__compact .dot-steps21__pillSub',
];

var SUB_EXTRA_MS = 100;

var rootsByEl = new WeakMap();
var sessionId = 0;
var mountTimerIds = [];

function getPillTiming() {
  var t = typeof window !== 'undefined' && window.__mlpTest3PillTiming;
  if (t && typeof t.textStart === 'number') return t;
  return {
    textStart: 1500,
    emerge: 420,
    shinePassMs: 680,
    shineTitlePasses: 2,
    shineSubPasses: 2,
    shinyActive: 1780,
    settle: 480,
    blackHold: 2000,
    dropAt: 3920,
  };
}

function clearMountTimers() {
  mountTimerIds.forEach(function (id) {
    clearTimeout(id);
  });
  mountTimerIds = [];
}

function msUntilRevealOffset(targetMs) {
  var started =
    typeof window !== 'undefined' && window.__mlpTest3PillRevealStartedAt
      ? window.__mlpTest3PillRevealStartedAt
      : Date.now();
  return Math.max(0, targetMs - (Date.now() - started));
}

function scheduleFromRevealStart(fn, targetMs) {
  var id = setTimeout(fn, msUntilRevealOffset(targetMs));
  mountTimerIds.push(id);
  return id;
}

function readLineText(el) {
  if (!el) return '';
  return (
    el.getAttribute('data-test3-pill-plain') ||
    el.getAttribute('data-test3-shiny-source') ||
    el.textContent ||
    ''
  ).trim();
}

function needsShinyMount() {
  for (var i = 0; i < PILL_TEXT_SELECTORS.length; i++) {
    var el = document.querySelector(PILL_TEXT_SELECTORS[i]);
    if (el && el.getAttribute('data-test3-shiny-mounted') !== '1') return true;
  }
  return false;
}

function stashPlainText() {
  PILL_TEXT_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      var text = readLineText(el);
      if (text) el.setAttribute('data-test3-pill-plain', text);
    });
  });
}

function PillShinyLine(props) {
  var settled = props.settled;
  var isTitle = props.isTitle;
  var emerging = props.emerging;
  var baseColor = settled ? SETTLED_COLOR : INK_DARK;
  return createElement(ShinyText, {
    text: props.text,
    className:
      'test3-pill-shiny-text' +
      (isTitle ? ' test3-pill-shiny-text--title' : ' test3-pill-shiny-text--sub') +
      (emerging ? ' test3-pill-shiny-text--emerge' : '') +
      (settled ? ' test3-pill-shiny-text--settled' : ' test3-pill-shiny-text--active'),
    color: baseColor,
    shineColor: settled ? SETTLED_COLOR : SHINE_MID,
    shinePeakColor: settled ? SETTLED_COLOR : SHINE_PEAK,
    speed: props.shinePassMs / 1000,
    delay: 0,
    spread: isTitle ? 100 : 104,
    shineBandStart: isTitle ? 40 : 42,
    shineBandEnd: isTitle ? 60 : 62,
    backgroundSize: isTitle ? '400% auto' : '360% auto',
    direction: 'left',
    disabled: settled,
    passLimit: settled ? 0 : (isTitle ? props.titlePasses : props.subPasses),
    onPassesComplete: settled ? null : props.onPassesComplete,
  });
}

function mountLine(el, text, timing, opts) {
  if (!el || !text) return;
  var settled = opts.settled;
  var emerging = opts.emerging;

  el.setAttribute('data-test3-pill-plain', text);
  el.setAttribute('data-test3-shiny-source', text);

  var root = rootsByEl.get(el);
  if (!root) {
    root = createRoot(el);
    rootsByEl.set(el, root);
    el.setAttribute('data-test3-shiny-mounted', '1');
  }

  var isTitle = el.classList.contains('dot-w21__pillTitle') ||
    el.classList.contains('dot-steps21__pillTitle');

  function render(next) {
    root.render(createElement(PillShinyLine, {
      text: text,
      settled: next.settled,
      emerging: next.emerging,
      isTitle: isTitle,
      shinePassMs: timing.shinePassMs,
      titlePasses: timing.shineTitlePasses,
      subPasses: timing.shineSubPasses,
      onPassesComplete: next.onPassesComplete,
    }));
    if (next.settled) {
      el.setAttribute('data-test3-shiny-ready', '1');
    }
  }

  render({
    settled: settled,
    emerging: emerging,
    onPassesComplete: opts.onPassesComplete,
  });
  el.__test3ShinyRender = render;
}

function restorePlainFallback(el) {
  var text = readLineText(el);
  if (!text) return;
  var root = rootsByEl.get(el);
  if (root) {
    root.unmount();
    rootsByEl.delete(el);
  }
  el.textContent = text;
  el.style.color = SETTLED_COLOR;
  el.setAttribute('data-test3-shiny-ready', '1');
  el.removeAttribute('data-test3-shiny-mounted');
  delete el.__test3ShinyRender;
}

function unmountAll() {
  clearMountTimers();
  PILL_TEXT_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      restorePlainFallback(el);
      el.removeAttribute('data-test3-pill-plain');
      el.removeAttribute('data-test3-shiny-source');
    });
  });
}

function ensurePlainTextVisible(canvas) {
  PILL_TEXT_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.querySelector('.test3-pill-shiny-text--settled')) return;
      var text = readLineText(el);
      if (!text) return;
      if (!el.querySelector('.test3-pill-shiny-text')) {
        el.textContent = text;
        el.style.color = SETTLED_COLOR;
        el.style.webkitTextFillColor = SETTLED_COLOR;
        el.setAttribute('data-test3-shiny-ready', '1');
      }
    });
  });
  if (canvas) canvas.setAttribute('data-test3-pills-text-live', '1');
}

export function armTest3PillShinyText(canvas) {
  if (!canvas || canvas.getAttribute('data-test-scope') !== 'test3') return;
  if (canvas.getAttribute('data-test3-pills-reveal') !== '1') return;
  if (!needsShinyMount()) return;

  stashPlainText();

  var timing = getPillTiming();
  var mySession = ++sessionId;
  clearMountTimers();

  canvas.setAttribute('data-test3-pills-text-armed', '1');

  var safetyId = setTimeout(function () {
    if (mySession !== sessionId) return;
    if (canvas.getAttribute('data-test3-pills-reveal') !== '1') return;
    if (canvas.getAttribute('data-test3-pills-revealed') === '1') return;
    if (!needsShinyMount()) return;
    ensurePlainTextVisible(canvas);
  }, timing.dropAt || timing.textStart + timing.emerge + timing.shinePassMs * timing.shineTitlePasses + 400);
  mountTimerIds.push(safetyId);

  PILL_TEXT_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      var isSub = el.classList.contains('dot-w21__pillSub') ||
        el.classList.contains('dot-steps21__pillSub');
      var startMs = timing.textStart + (isSub ? SUB_EXTRA_MS : 0);
      var passCount = isSub ? timing.shineSubPasses : timing.shineTitlePasses;
      var text = readLineText(el);
      if (!text) return;

      function settleLine() {
        if (mySession !== sessionId) return;
        if (el.__test3ShinyRender) {
          el.__test3ShinyRender({ settled: true, emerging: false, onPassesComplete: null });
        } else {
          restorePlainFallback(el);
        }
        el.setAttribute('data-test3-shiny-ready', '1');
      }

      function tryMount() {
        if (mySession !== sessionId) return;
        if (canvas.getAttribute('data-test3-pills-reveal') !== '1') return;
        if (canvas.getAttribute('data-test3-pills-revealed') === '1') {
          restorePlainFallback(el);
          return;
        }
        canvas.setAttribute('data-test3-pills-text-live', '1');
        mountLine(el, text, timing, {
          settled: false,
          emerging: true,
          onPassesComplete: settleLine,
        });
      }

      scheduleFromRevealStart(tryMount, startMs);

      scheduleFromRevealStart(function () {
        if (mySession !== sessionId) return;
        if (el.__test3ShinyRender) {
          el.__test3ShinyRender({ settled: false, emerging: false, onPassesComplete: settleLine });
        }
      }, startMs + timing.emerge);
    });
  });
}

export function snapTest3PillShinyTextSettled() {
  PILL_TEXT_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.__test3ShinyRender) {
        el.__test3ShinyRender({ settled: true, emerging: false, onPassesComplete: null });
      } else {
        restorePlainFallback(el);
      }
      el.setAttribute('data-test3-shiny-ready', '1');
    });
  });
}

export function resetTest3PillShinyText() {
  sessionId++;
  unmountAll();
  var canvas = document.getElementById('canvas');
  if (canvas) {
    canvas.removeAttribute('data-test3-pills-text-live');
    canvas.removeAttribute('data-test3-pills-text-armed');
  }
}

export default function Test3PillShinyTextBridge() {
  useEffect(function () {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;

    window.snapTest3PillShinyTextSettled = snapTest3PillShinyTextSettled;

    function tryArm() {
      if (canvas.getAttribute('data-test3-pills-reveal') === '1' && needsShinyMount()) {
        stashPlainText();
        armTest3PillShinyText(canvas);
      }
    }

    function onRevealed() {
      if (canvas.getAttribute('data-test3-pills-revealed') === '1') {
        clearMountTimers();
        snapTest3PillShinyTextSettled();
      }
    }

    function onAttrChange() {
      tryArm();
      onRevealed();
      if (
        canvas.getAttribute('data-test3-pills-reveal') !== '1' &&
        canvas.getAttribute('data-test3-pills-revealed') !== '1'
      ) {
        resetTest3PillShinyText();
      }
    }

    var attrObs = new MutationObserver(onAttrChange);
    attrObs.observe(canvas, {
      attributes: true,
      attributeFilter: [
        'data-test3-pills-reveal',
        'data-test3-pills-revealed',
        'data-test3-pills-black-hold',
      ],
    });

    var domObs = new MutationObserver(function () {
      tryArm();
    });
    ['test3-weather', 'test3-steps'].forEach(function (id) {
      var host = document.getElementById(id);
      if (host) {
        domObs.observe(host, { childList: true, subtree: true });
      }
    });

    onAttrChange();

    return function () {
      attrObs.disconnect();
      domObs.disconnect();
      delete window.snapTest3PillShinyTextSettled;
      resetTest3PillShinyText();
    };
  }, []);

  return null;
}
