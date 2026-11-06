(() => {
  'use strict';

  const TIME_ZONE = 'Asia/Tokyo';
  const STORAGE_KEY = 'kansai-device-metrics-v1';
  const SESSION_PREFIX = 'kansai-device-metrics-session-v1:';
  // One-time baseline authorized by the site owner on 2026-10-23 from GitHub's
  // 14-day repository Traffic view. It is not historical GitHub Pages analytics;
  // no historical music-play or video-view totals exist.
  const BASELINE_VISITS = 208;
  const copy = {
    zh: { intro: '從淀川水面到大阪燈火，記下此刻的城市節奏。', visits: '頁面造訪', music: '音樂收聽', video: '影片觀看', loading: '正在讀取', device: '本裝置累計', global: '全站累計', unavailable: '統計暫時無法使用' },
    en: { intro: 'A live note from the Yodogawa waterfront to the lights of Osaka.', visits: 'Site visits', music: 'Music plays', video: 'Video views', loading: 'Loading', device: 'On this device', global: 'Site-wide total', unavailable: 'Counters temporarily unavailable' },
    ja: { intro: '淀川の水面から大阪の灯りまで、いまの街のリズムを記録します。', visits: 'ページ訪問', music: '音楽再生', video: '動画視聴', loading: '読み込み中', device: 'この端末での累計', global: 'サイト全体の累計', unavailable: '統計を一時的に利用できません' },
    ko: { intro: '요도가와 수면에서 오사카의 불빛까지, 지금 이 도시의 리듬을 기록합니다.', visits: '페이지 방문', music: '음악 재생', video: '영상 시청', loading: '불러오는 중', device: '이 기기의 누계', global: '사이트 전체 누계', unavailable: '통계를 일시적으로 사용할 수 없습니다' },
    es: { intro: 'Una nota en vivo, desde el río Yodogawa hasta las luces de Osaka.', visits: 'Visitas', music: 'Escuchas', video: 'Vídeos vistos', loading: 'Cargando', device: 'En este dispositivo', global: 'Total del sitio', unavailable: 'Contadores temporalmente no disponibles' },
    de: { intro: 'Eine Live-Notiz vom Yodogawa bis zu den Lichtern Osakas.', visits: 'Besuche', music: 'Musikwiedergaben', video: 'Videoaufrufe', loading: 'Wird geladen', device: 'Auf diesem Gerät', global: 'Website-Gesamtzahl', unavailable: 'Zähler vorübergehend nicht verfügbar' },
    fr: { intro: 'Une note en direct, des rives du Yodogawa aux lumières d’Osaka.', visits: 'Visites', music: 'Écoutes', video: 'Vues vidéo', loading: 'Chargement', device: 'Sur cet appareil', global: 'Total du site', unavailable: 'Compteurs temporairement indisponibles' },
    it: { intro: 'Una nota dal vivo, dal fiume Yodogawa alle luci di Osaka.', visits: 'Visite', music: 'Ascolti', video: 'Video visti', loading: 'Caricamento', device: 'Su questo dispositivo', global: 'Totale del sito', unavailable: 'Contatori temporaneamente non disponibili' },
    ar: { intro: 'لحظة حية من ضفاف يودوغاوا إلى أضواء أوساكا.', visits: 'زيارات الصفحة', music: 'تشغيل الموسيقى', video: 'مشاهدات الفيديو', loading: 'جارٍ التحميل', device: 'الإجمالي على هذا الجهاز', global: 'إجمالي الموقع', unavailable: 'العدادات غير متاحة مؤقتًا' },
    th: { intro: 'บันทึกสดจากสายน้ำโยโดกาวะถึงแสงไฟของโอซาก้า', visits: 'เข้าชมหน้าเว็บ', music: 'ฟังเพลง', video: 'ชมวิดีโอ', loading: 'กำลังโหลด', device: 'สะสมบนอุปกรณ์นี้', global: 'ยอดรวมทั้งเว็บไซต์', unavailable: 'ตัวนับไม่สามารถใช้งานได้ชั่วคราว' }
  };
  const localeByLanguage = { zh: 'zh-Hant', en: 'en-GB', ja: 'ja-JP', ko: 'ko-KR', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', ar: 'ar', th: 'th-TH' };
  const elements = {
    root: document.getElementById('kansai-observatory'), time: document.getElementById('osaka-time'),
    hourMinute: document.getElementById('osaka-time-hour-minute'), seconds: document.getElementById('osaka-time-seconds'),
    date: document.getElementById('osaka-date'), status: document.getElementById('kansai-counter-status'),
    scope: document.getElementById('kansai-counter-scope'),
    values: { visits: document.getElementById('kansai-visits'), music: document.getElementById('kansai-music-plays'), video: document.getElementById('kansai-video-views') }
  };
  if (!elements.root) return;

  const safeWholeNumber = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
  function createDeviceProvider() {
    function readStored() {
      let value;
      try { value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
      catch (_) { value = {}; }
      return value && typeof value === 'object' ? value : {};
    }
    function normalize(value) {
      return { visits: Math.max(BASELINE_VISITS, safeWholeNumber(value?.visits)), music: safeWholeNumber(value?.music), video: safeWholeNumber(value?.video) };
    }
    function read() {
      const repaired = normalize(readStored());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repaired));
      return repaired;
    }
    function write(value) { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); return value; }
    return {
      scope: 'device',
      async readAll() { return read(); },
      async increment(name) {
        if (!Object.prototype.hasOwnProperty.call(elements.values, name)) throw new Error('Unknown metric');
        const values = normalize(readStored());
        values[name] += 1;
        return write(values);
      }
    };
  }
  const deviceProvider = createDeviceProvider();
  const injected = window.KansaiMetricsProvider;
  const provider = injected && typeof injected.readAll === 'function' && typeof injected.increment === 'function' ? injected : deviceProvider;
  const initialTotals = provider.scope === 'global' ? provider.initialTotals : null;
  let language = languageFromDocument(), state = 'loading', totals = initialTotals ? {
    visits: Number.isSafeInteger(initialTotals.visits) && initialTotals.visits >= 0 ? initialTotals.visits : BASELINE_VISITS,
    music: Number.isSafeInteger(initialTotals.music) && initialTotals.music >= 0 ? initialTotals.music : 0,
    video: Number.isSafeInteger(initialTotals.video) && initialTotals.video >= 0 ? initialTotals.video : 0
  } : { visits: null, music: null, video: null };

  async function providerCall(method, ...args) {
    return provider[method](...args);
  }

  function languageFromDocument() {
    const lang = document.documentElement.lang.toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
    return Object.prototype.hasOwnProperty.call(copy, lang) ? lang : 'en';
  }
  const strings = () => copy[language] || copy.en;
  function applyCopy() {
    elements.root.querySelectorAll('[data-metric-copy]').forEach(node => { const value = strings()[node.dataset.metricCopy]; if (value) node.textContent = value; });
    updateStatus(state); renderTotals();
  }
  function updateStatus(nextState) {
    state = nextState; elements.root.dataset.counterState = nextState;
    if (elements.status) elements.status.textContent = strings()[nextState];
    if (elements.scope) elements.scope.textContent = provider.scope === 'global' ? 'SITE · GLOBAL' : 'DEVICE · LOCAL';
  }
  function renderTotals() {
    const locale = localeByLanguage[language] || localeByLanguage.en;
    Object.entries(elements.values).forEach(([name, node]) => { if (node) node.textContent = Number.isFinite(totals[name]) ? new Intl.NumberFormat(locale).format(totals[name]) : '—'; });
  }
  function wasRecorded(name) { try { return sessionStorage.getItem(`${SESSION_PREFIX}${name}`) === '1'; } catch (_) { return false; } }
  function markRecorded(name) { try { sessionStorage.setItem(`${SESSION_PREFIX}${name}`, '1'); } catch (_) {} }
  async function initialize() {
    updateStatus('loading');
    try {
      if (provider.readOnly) totals = await providerCall('readAll');
      else totals = await providerCall('increment', 'visits');
      renderTotals(); updateStatus(provider.scope === 'global' ? 'global' : 'device');
    } catch (_) { renderTotals(); updateStatus('unavailable'); }
  }
  async function recordQualifiedPlay(name) {
    if (wasRecorded(name)) return;
    try { totals = await providerCall('increment', name); markRecorded(name); renderTotals(); updateStatus(provider.scope === 'global' ? 'global' : 'device'); }
    catch (_) { renderTotals(); updateStatus('unavailable'); }
  }
  const monitoredMedia = new WeakSet();
  function monitorPlayback(media, name) {
    if (!media || monitoredMedia.has(media) || media.matches?.('[data-seasonal-ambience]')) return;
    monitoredMedia.add(media);
    let listened = 0, last = null, identity = '';
    let totalQualified = wasRecorded(name);
    const detailedQualified = new Set();
    const sourceIdentity = () => media.currentSrc || media.src || media.querySelector?.('source')?.src || `${name}:${media.id || 'media'}`;
    function syncIdentity() {
      const next = sourceIdentity();
      if (identity === next) return;
      identity = next; listened = 0; last = null;
    }
    const threshold = () => !Number.isFinite(media.duration) || media.duration <= 0 ? 8 : Math.min(8, Math.max(4, media.duration * .1));
    media.addEventListener('playing', () => { syncIdentity(); last = media.currentTime; }); media.addEventListener('pause', () => { last = null; }); media.addEventListener('seeking', () => { syncIdentity(); last = media.currentTime; });
    media.addEventListener('timeupdate', () => {
      syncIdentity();
      if ((totalQualified && detailedQualified.has(identity)) || media.paused || media.seeking) return;
      const current = media.currentTime, delta = last === null ? 0 : current - last; if (delta > 0 && delta < 2) listened += delta; last = current;
      if (listened < threshold()) return;
      if (!detailedQualified.has(identity)) {
        detailedQualified.add(identity);
        document.dispatchEvent(new CustomEvent('kansai-qualified-media-play', { detail: { kind: name, media } }));
      }
      if (!totalQualified) { totalQualified = true; recordQualifiedPlay(name); }
    });
  }
  document.addEventListener('guide-language-change', event => { const requested = String(event.detail || '').toLowerCase(); language = requested.startsWith('zh') ? 'zh' : (copy[requested] ? requested : 'en'); applyCopy(); });
  function monitorMedia(root = document) {
    if (root.matches?.('audio:not([data-seasonal-ambience])')) monitorPlayback(root, 'music');
    if (root.matches?.('video.feature-video')) monitorPlayback(root, 'video');
    root.querySelectorAll?.('audio:not([data-seasonal-ambience])').forEach(audio => monitorPlayback(audio, 'music'));
    root.querySelectorAll?.('video.feature-video').forEach(video => monitorPlayback(video, 'video'));
  }
  monitorMedia();
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) monitorMedia(node); })))
    .observe(document.body, { childList: true, subtree: true });
  applyCopy(); initialize();
})();
