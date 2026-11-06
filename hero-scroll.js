// A shallow perspective retreat follows ordinary scrolling; no pinning or wheel interception.
(function () {
  'use strict';
  var hero = document.querySelector('.hero-scroll-stage');
  if (!hero || !window.matchMedia || !window.requestAnimationFrame) return;
  var header = document.querySelector('.site-nav');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var frame = 0, dirty = true, current = 0, target = 0, lastTime = 0, lastPaint = -1, active = false;
  function setActive(next) {
    if (next !== active) { hero.classList.toggle('hero-motion-active', next); active = next; }
  }
  function write() {
    if (Math.abs(current - lastPaint) > .00001) {
      hero.style.setProperty('--hero-progress', current.toFixed(5));
      lastPaint = current;
    }
  }
  function paint(time) {
    frame = 0;
    // Read geometry only when input/size changes, never on every easing frame.
    if (dirty) {
      dirty = false;
      var box = hero.getBoundingClientRect();
      var top = header ? header.getBoundingClientRect().bottom : 0;
      var visible = box.height > 0 && box.bottom > top && box.top < window.innerHeight;
      if (reduced.matches || document.hidden || !visible) {
        current = target = 0; lastTime = 0; setActive(false); write(); return;
      }
      setActive(true);
      target = Math.min(1, Math.max(0, (-box.top) / Math.max(1, box.height * .85)));
      target = target * target * (3 - 2 * target);
    }
    // A short, time-based response smooths discrete mouse-wheel steps at any refresh rate.
    var dt = lastTime ? Math.min(64, Math.max(1, time - lastTime)) : 16.667;
    lastTime = time;
    current += (target - current) * (1 - Math.exp(-dt / 75));
    if (Math.abs(target - current) < .0002) current = target;
    write();
    if (current !== target) frame = window.requestAnimationFrame(paint);
    else lastTime = 0;
  }
  function schedule() { dirty = true; if (!frame) frame = window.requestAnimationFrame(paint); }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  window.addEventListener('hashchange', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('guide-language-change', schedule);
  document.addEventListener('visibilitychange', schedule);
  if (reduced.addEventListener) reduced.addEventListener('change', schedule);
  else if (reduced.addListener) reduced.addListener(schedule);
  schedule();
})();
