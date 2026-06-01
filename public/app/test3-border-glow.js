/**
 * test3 music capsule — BorderGlow intro sweep (vanilla, mirrors components/test3/BorderGlow.js).
 */
(function (global) {
  'use strict';

  var TEST3_BORDER_GLOW_COLORS = ['#FF9030', '#3DA6EC', '#78D2FF'];
  var TEST3_BORDER_GLOW_HSL = '199 76 58';
  var GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  var GRADIENT_KEYS = [
    '--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four',
    '--gradient-five', '--gradient-six', '--gradient-seven',
  ];
  var COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

  function parseHSL(hslStr) {
    var match = String(hslStr).match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 199, s: 76, l: 58 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  function buildGlowVars(glowColor, intensity) {
    var p = parseHSL(glowColor);
    var base = p.h + 'deg ' + p.s + '% ' + p.l + '%';
    var opacities = [100, 60, 50, 40, 30, 20, 10];
    var keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    var vars = {};
    for (var i = 0; i < opacities.length; i++) {
      vars['--glow-color' + keys[i]] =
        'hsl(' + base + ' / ' + Math.min(opacities[i] * intensity, 100) + '%)';
    }
    return vars;
  }

  function buildGradientVars(colors) {
    var vars = {};
    for (var i = 0; i < 7; i++) {
      var c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
      vars[GRADIENT_KEYS[i]] =
        'radial-gradient(at ' + GRADIENT_POSITIONS[i] + ', ' + c + ' 0px, transparent 50%)';
    }
    vars['--gradient-base'] = 'linear-gradient(' + colors[0] + ' 0 100%)';
    return vars;
  }

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInCubic(x) { return x * x * x; }

  function animateValue(opts) {
    var start = opts.start != null ? opts.start : 0;
    var end = opts.end != null ? opts.end : 100;
    var duration = opts.duration != null ? opts.duration : 1000;
    var delay = opts.delay != null ? opts.delay : 0;
    var ease = opts.ease || easeOutCubic;
    var onUpdate = opts.onUpdate;
    var onEnd = opts.onEnd;
    var t0 = performance.now() + delay;
    function tick() {
      var elapsed = performance.now() - t0;
      var t = Math.min(elapsed / duration, 1);
      onUpdate(start + (end - start) * ease(t));
      if (t < 1) requestAnimationFrame(tick);
      else if (onEnd) onEnd();
    }
    setTimeout(function () { requestAnimationFrame(tick); }, delay);
  }

  function applyBorderGlowVars(card) {
    if (!card) return;
    var glowVars = buildGlowVars(TEST3_BORDER_GLOW_HSL, 1.15);
    var gradientVars = buildGradientVars(TEST3_BORDER_GLOW_COLORS);
    var key;
    for (key in glowVars) {
      if (Object.prototype.hasOwnProperty.call(glowVars, key)) {
        card.style.setProperty(key, glowVars[key]);
      }
    }
    for (key in gradientVars) {
      if (Object.prototype.hasOwnProperty.call(gradientVars, key)) {
        card.style.setProperty(key, gradientVars[key]);
      }
    }
  }

  function runIntroSweep(card) {
    if (!card || card.getAttribute('data-test3-border-glow-sweep') === '1') return;
    card.setAttribute('data-test3-border-glow-sweep', '1');
    applyBorderGlowVars(card);

    var angleStart = 110;
    var angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', angleStart + 'deg');
    card.style.setProperty('--edge-proximity', '0');

    animateValue({
      duration: 500,
      onUpdate: function (v) {
        card.style.setProperty('--edge-proximity', String(v));
      },
    });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: function (v) {
        card.style.setProperty(
          '--cursor-angle',
          ((angleEnd - angleStart) * (v / 100) + angleStart) + 'deg'
        );
      },
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: function (v) {
        card.style.setProperty(
          '--cursor-angle',
          ((angleEnd - angleStart) * (v / 100) + angleStart) + 'deg'
        );
      },
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: function (v) {
        card.style.setProperty('--edge-proximity', String(v));
      },
      onEnd: function () {
        card.classList.remove('sweep-active');
      },
    });
  }

  function resetBorderGlowSweep(music) {
    if (!music) return;
    var layer = music.querySelector('.test3-music-border-glow');
    if (!layer) return;
    layer.removeAttribute('data-test3-border-glow-sweep');
    layer.classList.remove('sweep-active');
    layer.style.removeProperty('--edge-proximity');
    layer.style.removeProperty('--cursor-angle');
  }

  function findBorderGlowLayer(music) {
    if (!music) return null;
    return music.querySelector('.test3-music-border-glow.border-glow-card');
  }

  global.runTest3MusicBorderGlowSweep = function (musicOrLayer) {
    var layer = musicOrLayer;
    if (layer && layer.classList && !layer.classList.contains('test3-music-border-glow')) {
      layer = findBorderGlowLayer(musicOrLayer);
    }
    if (!layer) return;
    runIntroSweep(layer);
  };

  global.resetTest3MusicBorderGlowSweep = resetBorderGlowSweep;
})(typeof window !== 'undefined' ? window : global);
