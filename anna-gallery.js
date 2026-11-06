(async () => {
  const root = document.querySelector('#anna-videos');
  if (!root) return;
  try {
    const response = await fetch('anna-videos.json');
    if (!response.ok) throw Error();
    const data = await response.json();
    const fragment = document.createDocumentFragment();
    const dates = [];
    for (const v of data.items) {
      if (!/^[\w-]{11}$/.test(v.id)) continue;
      const a = document.createElement('a');
      a.href = 'https://www.youtube.com/watch?v=' + v.id;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'anna-video-card';
      const img = document.createElement('img');
      img.src = 'https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
      img.alt = '';
      img.loading = 'lazy';
      const title = document.createElement('h3');
      title.textContent = v.title;
      const date = document.createElement('time');
      const publishedAt = new Date(v.published_at);
      if (v.published_at && Number.isFinite(publishedAt.getTime())) {
        date.dateTime = v.published_at;
        dates.push({ element: date, value: publishedAt });
      } else {
        date.textContent = v.published || '';
      }
      a.append(img, title, date);
      fragment.append(a);
    }
    root.replaceChildren(fragment);
    function localizeDates() {
      const language = document.querySelector('#language-select').value;
      const locale = language === 'zh' ? 'zh-TW' : language;
      const formatter = new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Tokyo', year: 'numeric', month: 'short', day: 'numeric'
      });
      dates.forEach(({ element, value }) => { element.textContent = formatter.format(value); });
    }
    document.addEventListener('guide-language-change', localizeDates);
    localizeDates();
  } catch (e) {
    // Keep localized unavailable state; never show unrelated channel uploads.
  }
})();
