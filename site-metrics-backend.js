(() => {
  'use strict';

  const API_ORIGIN = 'https://abacus.jasoncameron.dev';
  const NAMESPACE = 'iehovahao-web.github.io-kansai';
  const PRODUCTION_HOST = 'iehovahao-web.github.io';
  const PRODUCTION_PATH = /^\/ludwig529(?:\/|$)/i;
  const REQUEST_TIMEOUT_MS = 4500;
  const DETAIL_SESSION_PREFIX = 'kansai-global-detail-session-v1:';
  const TOTAL_CACHE_KEY = 'kansai-global-metrics-cache-v1';
  const TOTAL_KEYS = Object.freeze({
    visits: 'site-visits',
    music: 'music-listeners',
    video: 'video-viewers'
  });
  const LANGUAGE_CODES = new Set(['zh', 'en', 'ja', 'ko', 'es', 'de', 'it']);
  const SEASONAL_AUDIO_THEMES = new Set(['halloween', 'christmas']);
  const SECTION_TARGETS = ['food', 'sea', 'shopping', 'time-weather', 'seasonal-guides'];
  const DETAIL_KEYS = new Set([
    ...SECTION_TARGETS.flatMap(section => [`section-link-${section}`, `module-${section}-view`]),
    'navigation-brand-top',
    ...SECTION_TARGETS.map(section => `navigation-header-${section}`),
    'navigation-hero-food', 'navigation-footer-top', 'navigation-mobile-seasonal-guides',
    ...Array.from({ length: 12 }, (_, index) => `audio-osaka-track-${String(index + 1).padStart(2, '0')}`),
    ...Array.from({ length: 12 }, (_, index) => `audio-osaka-track-select-${String(index + 1).padStart(2, '0')}`),
    'audio-delicious-in-progress', 'video-yodogawa-light-never-sleeps',
    'control-osaka-previous', 'control-osaka-play-toggle', 'control-osaka-next', 'control-osaka-airplay',
    'control-delicious-rewind', 'control-delicious-play-toggle', 'control-delicious-forward', 'control-delicious-airplay',
    'control-video-yodogawa-play',
    ...[...LANGUAGE_CODES].map(language => `language-${language}`),
    ...[...SEASONAL_AUDIO_THEMES].flatMap(theme => [`seasonal-audio-${theme}-on`, `seasonal-audio-${theme}-off`]),
    'season-guide-sakura-click', 'season-guide-autumn-click', 'season-guide-fireworks-click'
  ]);

  const isProduction = location.protocol === 'https:' &&
    location.hostname === PRODUCTION_HOST && PRODUCTION_PATH.test(location.pathname);
  if (!isProduction) return;
  const isVerification = new URLSearchParams(location.search).has('verify');

  const validKey = value => /^[A-Za-z0-9_.-]{3,64}$/.test(value);
  function endpoint(operation, key) {
    if (!validKey(NAMESPACE) || !validKey(key) || !['get', 'hit'].includes(operation)) throw new Error('Invalid counter identifier');
    return `${API_ORIGIN}/${operation}/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`;
  }

  async function request(operation, key, keepalive = false) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint(operation, key), {
        method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', keepalive, signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Counter request failed: ${response.status}`);
      const body = await response.json();
      const value = Number(body?.value);
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Counter returned an invalid value');
      return value;
    } finally {
      window.clearTimeout(timer);
    }
  }

  function readTotalCache() {
    let value;
    try { value = JSON.parse(localStorage.getItem(TOTAL_CACHE_KEY) || sessionStorage.getItem(TOTAL_CACHE_KEY) || '{}'); }
    catch (_) { value = {}; }
    return value && typeof value === 'object' ? value : {};
  }
  function writeTotalCache(value) {
    try { localStorage.setItem(TOTAL_CACHE_KEY, JSON.stringify(value)); }
    catch (_) {
      try { sessionStorage.setItem(TOTAL_CACHE_KEY, JSON.stringify(value)); }
      catch (_) {}
    }
  }
  async function totals(operationFor = null) {
    const metrics = Object.entries(TOTAL_KEYS);
    const settled = await Promise.allSettled(metrics.map(([name, key]) => request(name === operationFor ? 'hit' : 'get', key)));
    const cached = readTotalCache();
    const values = {};
    let successful = 0;
    let firstFailure;
    metrics.forEach(([name], index) => {
      const result = settled[index];
      if (result.status === 'fulfilled') {
        values[name] = result.value;
        cached[name] = result.value;
        successful += 1;
      } else {
        firstFailure ||= result.reason;
        values[name] = Number.isSafeInteger(cached[name]) && cached[name] >= 0 ? cached[name] : null;
      }
    });
    const operationIndex = operationFor ? metrics.findIndex(([name]) => name === operationFor) : -1;
    const hasCachedValue = Object.values(values).some(value => Number.isSafeInteger(value) && value >= 0);
    // A failed mutating request has an ambiguous outcome. Keep displaying any
    // last-known global values instead of incrementing a second store.
    if (operationIndex >= 0 && settled[operationIndex].status === 'rejected' && !hasCachedValue) throw settled[operationIndex].reason;
    if (!successful && !hasCachedValue) throw firstFailure || new Error('Counter backend unavailable');
    writeTotalCache(cached);
    return values;
  }

  const initialCache = readTotalCache();
  window.KansaiMetricsProvider = Object.freeze({
    scope: 'global',
    readOnly: isVerification,
    initialTotals: Object.freeze({
      visits: Number.isSafeInteger(initialCache.visits) && initialCache.visits >= 0 ? initialCache.visits : 208,
      music: Number.isSafeInteger(initialCache.music) && initialCache.music >= 0 ? initialCache.music : 0,
      video: Number.isSafeInteger(initialCache.video) && initialCache.video >= 0 ? initialCache.video : 0
    }),
    totalKeys: Object.freeze({ ...TOTAL_KEYS }),
    detailKeys: Object.freeze([...DETAIL_KEYS]),
    readAll() { return totals(); },
    increment(name) {
      if (!Object.prototype.hasOwnProperty.call(TOTAL_KEYS, name)) return Promise.reject(new Error('Unknown metric'));
      return totals(isVerification ? null : name);
    }
  });

  // Verification links must never mutate totals or create detailed counters.
  if (isVerification) return;

  const pendingDetails = new Set();
  function detailWasRecorded(key) {
    try { return sessionStorage.getItem(`${DETAIL_SESSION_PREFIX}${key}`) === '1'; }
    catch (_) { return false; }
  }
  function markDetailRecorded(key) {
    try { sessionStorage.setItem(`${DETAIL_SESSION_PREFIX}${key}`, '1'); }
    catch (_) {}
  }
  function recordDetailOnce(key, keepalive = false) {
    if (!DETAIL_KEYS.has(key) || !validKey(key) || detailWasRecorded(key) || pendingDetails.has(key)) return;
    pendingDetails.add(key);
    request('hit', key, keepalive)
      .then(() => markDetailRecorded(key))
      .catch(() => {})
      .finally(() => pendingDetails.delete(key));
  }
  function recordDetails(keys, keepalive = false) {
    [...new Set(keys.filter(Boolean))].forEach(key => recordDetailOnce(key, keepalive));
  }

  const sectionTargets = new Set(SECTION_TARGETS);
  function navigationDetails(link, target) {
    const keys = sectionTargets.has(target) ? [`section-link-${target}`] : [];
    let source = '';
    if (link.matches('.brand') && target === 'top') source = 'navigation-brand-top';
    else if (link.closest('.nav-links') && sectionTargets.has(target)) source = `navigation-header-${target}`;
    else if (link.closest('.hero-actions') && sectionTargets.has(target)) source = `navigation-hero-${target}`;
    else if (link.closest('.footer-links') && target === 'top') source = `navigation-footer-${target}`;
    else if (link.closest('.mobile-bar') && target === 'seasonal-guides') source = 'navigation-mobile-seasonal-guides';
    if (source) keys.push(source);
    return keys;
  }
  function linkDetails(link) {
    const explicit = String(link.dataset.metricsDetail || '').trim().toLowerCase();
    if (DETAIL_KEYS.has(explicit) && validKey(explicit)) return [explicit];
    const raw = link.getAttribute('href') || '';
    if (link.matches('.brand') && new URL(link.href).pathname === '/ludwig529/') return ['navigation-brand-top'];
    if (raw.startsWith('#')) {
      const target = raw.slice(1);
      return navigationDetails(link, target);
    }
    return [];
  }
  const controlKeys = new Map([
    ['osaka-back', 'control-osaka-previous'],
    ['osaka-toggle', 'control-osaka-play-toggle'],
    ['osaka-forward', 'control-osaka-next'],
    ['osaka-airplay', 'control-osaka-airplay'],
    ['delicious-back', 'control-delicious-rewind'],
    ['delicious-toggle', 'control-delicious-play-toggle'],
    ['delicious-forward', 'control-delicious-forward'],
    ['delicious-airplay', 'control-delicious-airplay']
  ]);
  function buttonDetails(button) {
    const keys = [];
    let control = controlKeys.get(button.id) || '';
    if (!control && button.classList.contains('video-play')) {
      if (button.closest('#yodogawa-light-never-sleeps')) control = 'control-video-yodogawa-play';
    }
    if (control) keys.push(control);
    return keys;
  }

  document.addEventListener('kansai-seasonal-audio-toggle', event => {
    const theme = String(event.detail?.theme || '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
    if (!SEASONAL_AUDIO_THEMES.has(theme) || typeof event.detail?.enabled !== 'boolean') return;
    recordDetailOnce(`seasonal-audio-${theme}-${event.detail.enabled ? 'on' : 'off'}`);
  });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest('.seasonal-sound-toggle')) return;
    const link = target.closest('a[href]');
    const button = target.closest('button');
    const keys = link ? linkDetails(link) : button ? buttonDetails(button) : [];
    recordDetails(keys, Boolean(link));
  });

  document.addEventListener('change', event => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    if (event.target.id === 'language-select') {
      const language = String(event.target.value || '').replace(/[^a-z-]/gi, '').toLowerCase();
      if (LANGUAGE_CODES.has(language)) recordDetailOnce(`language-${language}`);
      return;
    }
    if (event.target.id === 'osaka-track-select') {
      const index = Number(event.target.value);
      if (Number.isInteger(index) && index >= 0 && index < 12) recordDetailOnce(`audio-osaka-track-select-${String(index + 1).padStart(2, '0')}`);
    }
  });

  function mediaDetail(media, kind) {
    if (!(media instanceof HTMLMediaElement)) return '';
    if (kind === 'music') {
      if (media.id === 'delicious-audio') return 'audio-delicious-in-progress';
      if (media.id === 'osaka-audio') {
        const source = media.currentSrc || media.src || media.querySelector('source')?.src || '';
        const match = source.match(/\/osaka-tracks\/(\d{2})-/);
        return match ? `audio-osaka-track-${match[1]}` : '';
      }
      return '';
    }
    if (kind === 'video') {
      if (media.closest('#yodogawa-light-never-sleeps')) return 'video-yodogawa-light-never-sleeps';
    }
    return '';
  }
  document.addEventListener('kansai-qualified-media-play', event => {
    const key = mediaDetail(event.detail?.media, event.detail?.kind);
    if (key) recordDetailOnce(key);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
      const id = entry.target.dataset.metricsModule || '';
      if (sectionTargets.has(id)) recordDetailOnce(`module-${id}-view`);
    }), { threshold: [0.5] });
    sectionTargets.forEach(id => {
      const section = document.getElementById(id);
      const marker = section?.querySelector('h2');
      if (!marker) return;
      marker.dataset.metricsModule = id;
      observer.observe(marker);
    });
  }
})();
