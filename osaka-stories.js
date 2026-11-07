(async () => {
  'use strict';
  const section = document.getElementById('food');
  const grid = document.getElementById('track-cover-grid');
  const heading = section?.querySelector('.chapter-heading');
  if (!section || !grid || !heading) return;
  const supported = ['zh', 'en', 'ja', 'ko', 'es', 'de', 'it'];
  const language = () => {
    const chosen = document.getElementById('language-select')?.value;
    return supported.includes(chosen) ? chosen : 'en';
  };
  const safeSource = (value, kind) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'suno.com' &&
        new RegExp('^/' + kind + '/[a-f0-9-]{36}$').test(url.pathname) ? url : null;
    } catch (_) { return null; }
  };
  const recoveryCopy = {
    zh: ['故事暫時無法載入，音樂仍可播放。', '重新載入故事'],
    en: ['Stories could not load. You can still play the music.', 'Retry stories'],
    ja: ['物語を読み込めませんでした。音楽は再生できます。', '物語を再読み込み'],
    ko: ['이야기를 불러오지 못했습니다. 음악은 재생할 수 있습니다.', '이야기 다시 불러오기'],
    es: ['No se pudieron cargar las historias. La música sigue disponible.', 'Reintentar'],
    de: ['Die Geschichten konnten nicht geladen werden. Die Musik bleibt verfügbar.', 'Erneut laden'],
    it: ['Impossibile caricare le storie. La musica è ancora disponibile.', 'Riprova']
  };
  const recovery = document.createElement('div');
  recovery.className = 'osaka-stories-recovery';
  recovery.hidden = true;
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'osaka-stories-retry';
  recovery.append(message, retry);
  heading.after(recovery);
  function translateRecovery() {
    const [notice, action] = recoveryCopy[language()];
    message.textContent = notice;
    retry.textContent = action;
  }
  document.addEventListener('guide-language-change', translateRecovery);
  retry.addEventListener('click', load);
  async function load() {
    recovery.hidden = true;
    retry.disabled = true;
    try {
    const responses = await Promise.all([fetch('osaka-stories.json'), fetch('audio-tracks.json')]);
    if (responses.some(r => !r.ok)) throw new Error('Stories unavailable');
    const [copy, tracks] = await Promise.all(responses.map(r => r.json()));
    const albumSource = safeSource(copy.album.source, 'album');
    if (!albumSource || !supported.every(l => copy.album.languages[l]?.intro && copy.album.languages[l]?.story && copy.labels[l])) throw new Error('Incomplete story translations');
    const stories = new Map(copy.tracks.map(t => [t.id, t]));
    const coverStories = new Map();
    for (const track of tracks) {
      const story = stories.get(track.id);
      const source = story && safeSource(story.source, 'song');
      if (!source || source.pathname.split('/').pop() !== track.id ||
          !supported.every(l => typeof story.story[l] === 'string' && story.story[l].trim())) continue;
      coverStories.set(new URL(track.cover, document.baseURI).href, story);
    }
    const localized = [];
    function details(kind, story, source, trackId) {
      const box = document.createElement('details');
      box.className = 'osaka-story-details osaka-' + kind + '-story';
      if (trackId) box.dataset.storyTrack = trackId;
      const summary = document.createElement('summary');
      const text = document.createElement('div');
      text.className = 'osaka-story-body';
      const credit = document.createElement('p');
      credit.className = 'osaka-story-credit';
      const byline = document.createElement('span');
      byline.textContent = copy.artist;
      const link = document.createElement('a');
      link.className = 'osaka-story-source';
      link.href = source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      credit.append(byline, document.createTextNode(' · '), link);
      box.append(summary, text, credit);
      localized.push({ box, summary, text, link, story, kind });
      return box;
    }
    const intro = document.createElement('p');
    intro.className = 'osaka-story-intro';
    const albumStory = Object.fromEntries(supported.map(l => [l, copy.album.languages[l].story]));
    const albumDetails = details('album', albumStory, albumSource.href);
    heading.after(intro, albumDetails);
    function translate() {
      const lang = language();
      const labels = copy.labels[lang];
      intro.textContent = copy.album.languages[lang].intro;
      for (const item of localized) {
        if (!item.box.isConnected) continue;
        item.summary.textContent = labels[item.kind];
        item.text.replaceChildren(...item.story[lang].split(/\n\n+/).map(paragraph => {
          const p = document.createElement('p');
          p.className = 'osaka-story-text';
          p.textContent = paragraph;
          return p;
        }));
        item.link.textContent = labels.source;
      }
    }
    function attachTrackStories() {
      // Cards may arrive after both JSON fetches; match their actual cover to the
      // audio manifest, then the Suno UUID. Never associate a story by list order.
      for (const card of grid.querySelectorAll('.track-cover-card')) {
        if (card.querySelector('.osaka-track-story')) continue;
        const image = card.querySelector('.track-cover-option img');
        const story = image && coverStories.get(image.src);
        if (!story) continue;
        card.append(details('track', story.story, story.source, story.id));
      }
      translate();
    }
    const observer = new MutationObserver(attachTrackStories);
    observer.observe(grid, { childList: true });
    document.addEventListener('guide-language-change', translate);
    attachTrackStories();
    } catch (_) {
      translateRecovery();
      recovery.hidden = false;
    } finally {
      retry.disabled = false;
    }
  }
  await load();
})();
