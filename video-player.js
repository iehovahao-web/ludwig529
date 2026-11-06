(() => {
  const playLabels = {
    zh: '播放', en: 'Play', ja: '再生', ko: '재생',
    es: 'Reproducir', de: 'Abspielen', it: 'Riproduci'
  };
  document.querySelectorAll('.video-section').forEach(section => {
    const video = section.querySelector('.feature-video');
    const button = section.querySelector('.video-play');
    if (!video || !button) return;
    const title = section.querySelector('.video-caption')?.textContent.trim() || '';
    function localizeButton() {
      const language = document.querySelector('#language-select').value;
      const play = playLabels[language] || playLabels.en;
      button.setAttribute('aria-label', title ? play + ' · ' + title : play);
    }
    document.addEventListener('guide-language-change', localizeButton);
    localizeButton();
    button.addEventListener('click', () => {
      video.play().catch(() => { button.hidden = false; });
    });
    video.addEventListener('playing', () => { button.hidden = true; });
    video.addEventListener('pause', () => { button.hidden = false; });
    video.addEventListener('ended', () => { button.hidden = false; });
  });
})();
