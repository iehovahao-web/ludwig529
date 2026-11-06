(() => {
  'use strict';
  /* Ported from the Kansai site (iehovahao-web/kansai main, 2026-10-24) for the Ludwig Cheung site.
     Changes: official data only (no calculated years), seven-language captions in the intro band,
     effects clipped below the banner, motion toggle, shared holiday loader (js/holiday-data.js). */

  const TIME_ZONE = 'Asia/Tokyo';
  const ASSET_ROOT = 'assets/seasonal/';
  // Each illustration sits in the caption box background, fitted to how it is drawn:
  //   panorama - edge-to-edge landscapes: fill the box (cover), cropped at the given focus point
  //   garland / feature - a garland or a composed group on transparency: shown whole on the right
  const SCENE_LAYOUT = {
    autumnal: ['panorama', '50% 62%'], emperor: ['panorama', '50% 58%'], foundation: ['panorama', '50% 52%'],
    greenery: ['panorama', '50% 72%'], marine: ['panorama', '50% 62%'], mountain: ['panorama', '50% 56%'],
    showa: ['panorama', '50% 60%'],
    citizens: ['garland', '50% 50%'], vernal: ['garland', '50% 50%'],
    constitution: ['feature', '50% 50%'], culture: ['feature', '50% 50%'], comingage: ['feature', '50% 50%'],
    respect: ['feature', '50% 50%'], sports: ['feature', '50% 50%'], substitute: ['feature', '50% 50%'],
    labor: ['feature', '50% 50%'], children: ['feature', '50% 50%']
  };
  const HOLIDAY_DATA_URL = 'assets/data/japan-holidays-official.json';
  const LEAF_ASSETS = [
    'openclipart-autumn-leaf-1.png',
    'openclipart-autumn-leaf-2.png',
    'openclipart-autumn-leaf-3.png',
    'openclipart-autumn-leaf-4.png',
    'openclipart-autumn-leaf-5.png',
    'openclipart-autumn-leaf-6.png'
  ];
  const SETTLED_LEAF_ASSETS = [...LEAF_ASSETS, 'thanksgiving-oak-leaf.svg', 'openclipart-oak-leaf.svg'];
  const LABELS = {
    halloween: {
      title: 'HALLOWEEN', ja: 'ハロウィン', zh: '萬聖夜',
      en: 'A playful night of ghosts, lanterns, and mischief.',
      hintJa: 'おばけと灯りが踊る、いたずらいっぱいの夜。',
      hintZh: '精靈、燈火與惡作劇共舞的夜晚。',
      when: 'OCTOBER 31 · 10月31日'
    },
    thanksgiving: {
      title: 'Thanksgiving', ja: '感謝祭（アメリカ）', zh: '感恩節（美國）',
      en: 'A day to share gratitude, harvest, and time together.',
      hintJa: '実りと感謝を分かち合う日。',
      hintZh: '分享豐收、團聚與感恩的一天。',
      when: 'FOURTH THURSDAY OF NOVEMBER · 11月第4木曜日'
    },
    christmas: {
      title: 'Christmas', ja: 'クリスマス', zh: '聖誕節',
      en: 'May light and joy fill the season.',
      hintJa: '光と喜びに包まれる季節。',
      hintZh: '願這個季節充滿光與喜悅。',
      when: 'DECEMBER 25 · 12月25日'
    },
    newyear: {
      title: 'HAPPY NEW YEAR', ja: '謹賀新年・お正月', zh: '日本新年',
      en: 'Welcome the first light of a new year.',
      hintJa: '新しい年の初光を迎えます。',
      hintZh: '迎接新一年的第一束光。',
      when: 'DEC 29–JAN 7 · 年末年始'
    },
    obon: {
      title: 'OBON · お盆', ja: '盂蘭盆会（関西の盆時期）', zh: '盂蘭盆節（關西常見時段）',
      en: 'Lanterns gently guide a summer evening of remembrance.',
      hintJa: '灯籠の光とともに、ご先祖を静かに迎える夏の夕べ。',
      hintZh: '在燈籠微光中，安靜迎接先人的夏夜。',
      when: 'AUG 13–16 · 国民の祝日ではありません'
    }
  };
  const HOLIDAY_DETAILS = {
    comingage: { title: 'COMING OF AGE DAY', ja: '成人の日', zh: '成人之日', en: 'Celebrate young adults taking their next step.', hintJa: '新たな一歩を踏み出す若者を祝います。', hintZh: '祝福青年踏出人生的新一步。', family: 'celebration', icons: ['扇', '祝'] },
    foundation: { title: 'NATIONAL FOUNDATION DAY', ja: '建国記念の日', zh: '建國紀念之日', en: 'Reflect on the founding of Japan and its future.', hintJa: '建国をしのび、国の未来に思いを寄せる日。', hintZh: '追思建國，寄望國家未來。', family: 'civic', icons: ['日', '結'] },
    emperor: { title: "THE EMPEROR'S BIRTHDAY", ja: '天皇誕生日', zh: '天皇誕辰', en: "Celebrate the Emperor's birthday.", hintJa: '天皇の誕生日を祝う日。', hintZh: '慶祝天皇誕辰。', family: 'civic', icons: ['菊', '寿'] },
    vernal: { title: 'VERNAL EQUINOX DAY', ja: '春分の日', zh: '春分之日', en: 'Welcome spring and cherish living things.', hintJa: '自然をたたえ、生きものをいつくしむ日。', hintZh: '讚頌自然，珍愛生命。', family: 'spring', icons: ['花', '春'] },
    showa: { title: 'SHŌWA DAY', ja: '昭和の日', zh: '昭和之日', en: 'Look back on the Shōwa era and consider the future.', hintJa: '昭和の時代を顧み、国の将来に思いをいたす日。', hintZh: '回望昭和時代，思考國家未來。', family: 'civic', icons: ['昭', '和'] },
    constitution: { title: 'CONSTITUTION MEMORIAL DAY', ja: '憲法記念日', zh: '憲法紀念日', en: 'Commemorate the Constitution and hope for continued growth.', hintJa: '日本国憲法の施行を記念する日。', hintZh: '紀念日本國憲法施行。', family: 'civic', icons: ['法', '平'] },
    greenery: { title: 'GREENERY DAY', ja: 'みどりの日', zh: '綠之日', en: 'Enjoy nature and give thanks for its gifts.', hintJa: '自然に親しみ、その恵みに感謝する日。', hintZh: '親近自然，感謝自然的恩惠。', family: 'green', icons: ['葉', '緑'] },
    children: { title: "CHILDREN'S DAY", ja: 'こどもの日', zh: '兒童之日', en: "Wish for every child's happiness and growth.", hintJa: 'こどもの健やかな成長と幸福を願う日。', hintZh: '祝願孩子健康成長、幸福快樂。', family: 'children', icons: ['鯉', '童'] },
    marine: { title: 'MARINE DAY', ja: '海の日', zh: '海之日', en: 'Give thanks for the sea and celebrate island life.', hintJa: '海の恵みに感謝し、海洋国日本の繁栄を願う日。', hintZh: '感謝海洋恩惠，祝願海洋國家繁榮。', family: 'sea', icons: ['海', '波'] },
    mountain: { title: 'MOUNTAIN DAY', ja: '山の日', zh: '山之日', en: 'Enjoy the mountains and appreciate their gifts.', hintJa: '山に親しみ、その恵みに感謝する日。', hintZh: '親近山林，感謝群山的恩惠。', family: 'mountain', icons: ['山', '峰'] },
    respect: { title: 'RESPECT FOR THE AGED DAY', ja: '敬老の日', zh: '敬老之日', en: 'Honor older people and celebrate long life.', hintJa: '長年社会に尽くした方々を敬い、長寿を祝う日。', hintZh: '敬愛長者，祝福長壽。', family: 'respect', icons: ['寿', '敬'] },
    autumnal: { title: 'AUTUMNAL EQUINOX DAY', ja: '秋分の日', zh: '秋分之日', en: 'Honor ancestors and remember those who have passed.', hintJa: '祖先を敬い、亡くなった人々をしのぶ日。', hintZh: '敬奉祖先，追思故人。', family: 'autumn', icons: ['月', '穂'] },
    sports: { title: 'SPORTS DAY', ja: 'スポーツの日', zh: '體育之日', en: 'Enjoy sport, respect others, and celebrate active living.', hintJa: 'スポーツを楽しみ、互いを尊重する心を育む日。', hintZh: '享受運動，培養尊重他人的精神。', family: 'sport', icons: ['走', '躍'] },
    culture: { title: 'CULTURE DAY', ja: '文化の日', zh: '文化之日', en: 'Celebrate freedom, peace, art, and culture.', hintJa: '自由と平和を愛し、文化をすすめる日。', hintZh: '珍愛自由與和平，推進文化。', family: 'culture', icons: ['文', '芸'] },
    labor: { title: 'LABOR THANKSGIVING DAY', ja: '勤労感謝の日', zh: '勤勞感謝之日', en: 'Honor work, production, and mutual gratitude.', hintJa: '勤労を尊び、生産を祝い、互いに感謝する日。', hintZh: '尊重勞動與生產，彼此感謝。', family: 'harvest', icons: ['実', '謝'] },
    substitute: { title: 'SUBSTITUTE DAY OFF', ja: '休日（祝日法第3条第2項）', zh: '補休日（《國民祝日法》第3條第2項）', en: 'A statutory day off following a national holiday that fell on Sunday.', hintJa: '日曜日の祝日に伴う、祝日法による休日です。', hintZh: '國民祝日逢星期日後，依法律安排的補休日。', family: 'civic', icons: ['休', '振'], status: '祝日法による休日' },
    citizens: { title: 'CITIZENS’ DAY OFF', ja: '休日（祝日法第3条第3項）', zh: '國民休假日（《國民祝日法》第3條第3項）', en: 'A statutory day off between two national holidays.', hintJa: '前後を祝日に挟まれた、祝日法による休日です。', hintZh: '前後均為國民祝日時，依法安排的休假日。', family: 'civic', icons: ['休', '間'], status: '祝日法による休日' }
  };
  const holidayEngine = window.KansaiJapanHolidays;
  let officialHolidayCalendar = null;
  let officialHolidayLoadState = 'pending';
  const LIGHT_LABELS = {
    ko: ['핼러윈 제목 조명 켜기', '핼러윈 제목 조명 끄기'],
    es: ['Encender las luces del título de Halloween', 'Apagar las luces del título de Halloween'],
    de: ['Halloween-Titellichter einschalten', 'Halloween-Titellichter ausschalten'],
    it: ['Accendi le luci del titolo di Halloween', 'Spegni le luci del titolo di Halloween'],
    zh: ['开启万圣节标题彩灯', '关闭万圣节标题彩灯'],
    'zh-hant': ['開啟萬聖節標題彩燈', '關閉萬聖節標題彩燈'],
    ja: ['ハロウィン見出しのライトを点ける', 'ハロウィン見出しのライトを消す'],
    en: ['Turn on the Halloween title lights', 'Turn off the Halloween title lights']
  };

  const assetUrl = file => `${ASSET_ROOT}${file}`;
  const image = (className, file) => {
    const node = document.createElement('img');
    node.className = `seasonal-image ${className}`;
    node.src = assetUrl(file);
    node.alt = '';
    node.draggable = false;
    node.setAttribute('data-seasonal-asset', file);
    return node;
  };
  const accent = className => {
    const node = document.createElement('span');
    node.className = `seasonal-accent ${className}`;
    return node;
  };
  const random = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

  function osakaDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const number = type => Number(parts.find(part => part.type === type)?.value);
    return { year: number('year'), month: number('month'), day: number('day') };
  }

  function daysFrom(parts, target) {
    return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day) - Date.UTC(target.year, target.month - 1, target.day)) / 86400000);
  }

  function fourthThursday(year) {
    const first = new Date(Date.UTC(year, 10, 1));
    return { year, month: 11, day: 1 + ((4 - first.getUTCDay() + 7) % 7) + 21 };
  }

  function holidayForParts(parts) {
    // Personal site rule: only years the Cabinet Office has published; never a calculated year.
    if (!officialHolidayCalendar || !officialHolidayCalendar.years.has(parts.year)) return null;
    const record = holidayEngine?.resolve(parts, officialHolidayCalendar);
    if (!record || record.id === 'newyear' || !HOLIDAY_DETAILS[record.id]) return null;
    const displayDate = record.date.replaceAll('-', '.');
    return {
      id: record.id,
      date: displayDate,
      officialName: record.nameJa,
      legalBasis: record.legalBasis,
      calendarSource: record.source,
      ...HOLIDAY_DETAILS[record.id]
    };
  }

  function newYearCaptionForParts(parts) {
    if (parts.month !== 1 || parts.day !== 1) return null;
    return { ...LABELS.newyear, when: 'JANUARY 1 · 元日 · 日本の国民の祝日' };
  }

  function automaticTheme(parts) {
    if (parts.month === 10 && parts.day >= 20 && parts.day <= 31) return 'halloween';
    if (parts.month === 12 && parts.day >= 15 && parts.day <= 28) return 'christmas';
    // A non-New-Year statutory holiday takes priority inside the Jan 1–7 visual window
    // (for example a Jan 2 substitute holiday when New Year's Day fell on Sunday).
    if (holidayForParts(parts)) return 'japanholiday';
    if ((parts.month === 12 && parts.day >= 29) || (parts.month === 1 && parts.day <= 7)) return 'newyear';
    if (parts.month === 8 && parts.day >= 13 && parts.day <= 16) return 'obon';
    const distance = daysFrom(parts, fourthThursday(parts.year));
    if (distance >= -2 && distance <= 3) return 'thanksgiving';
    return null;
  }

  function localPreviewTheme() {
    const local = location.protocol === 'file:' || !location.hostname || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
    if (!local) return null;
    const value = new URLSearchParams(location.search).get('season');
    return ['halloween', 'thanksgiving', 'christmas', 'newyear', 'obon', 'japanholiday', 'off', 'none'].includes(value) ? (value === 'none' ? 'off' : value) : null;
  }

  function previewHoliday() {
    const local = location.protocol === 'file:' || !location.hostname || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
    if (!local || new URLSearchParams(location.search).get('season') !== 'japanholiday') return null;
    const requested = (new URLSearchParams(location.search).get('holiday') || 'marine').toLowerCase();
    const aliases = { adult: 'comingage', coming: 'comingage', emperorbirthday: 'emperor', spring: 'vernal', autumn: 'autumnal', green: 'greenery', child: 'children', sea: 'marine', aged: 'respect', labour: 'labor', bridge: 'citizens' };
    const id = aliases[requested] || requested;
    return HOLIDAY_DETAILS[id] ? { id, date: id === 'labor' ? '2026.11.23 · PREVIEW' : 'LOCAL QA', ...HOLIDAY_DETAILS[id] } : { id: 'marine', date: 'LOCAL QA', ...HOLIDAY_DETAILS.marine };
  }

  function currentTheme() {
    const preview = localPreviewTheme();
    if (preview === 'off') return null;
    return preview || automaticTheme(osakaDateParts());
  }

  function compactMode() {
    return matchMedia('(max-width: 680px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData === true;
  }

  function updateLightLabel(button) {
    if (!button) return;
    const language = (document.documentElement.lang || 'en').toLowerCase();
    const labels = LIGHT_LABELS[language] || LIGHT_LABELS[language.split('-')[0]] || LIGHT_LABELS.en;
    button.setAttribute('aria-label', labels[button.getAttribute('aria-pressed') === 'true' ? 1 : 0]);
  }

  const lcLang = () => document.querySelector('#language-select')?.value || 'en';
  const lcPick = obj => obj ? (obj[lcLang()] || obj.en) : null;
  const lcHtmlLang = { zh: 'zh-Hant', en: 'en', ja: 'ja', ko: 'ko', es: 'es', de: 'de', it: 'it' };
  let lastCaption = null;

  function addCaption(theme, suppliedCopy) {
    document.querySelector('.seasonal-holiday-note')?.remove();
    lastCaption = [theme, suppliedCopy];
    const C = window.LC_SEASONAL_COPY || { items: {}, kind: {} };
    const copy = suppliedCopy || LABELS[theme];
    const key = copy.id || theme;
    const local = lcPick(C.items[key]) || [copy.title, copy.en];
    const lang = lcLang();
    const caption = document.createElement('aside');
    caption.className = `seasonal-holiday-note lc-in-flow seasonal-caption-${theme}${copy.id ? ` holiday-${copy.id} holiday-family-${copy.family}` : ''}`;
    caption.setAttribute('role', 'note');
    if (theme === 'japanholiday' && copy.id) {
      const [layout, pos] = SCENE_LAYOUT[copy.id] || ['feature', '50% 50%'];
      caption.classList.add('lc-has-art', `lc-art-${layout}`);
      // absolute URL: a relative url() inside a custom property would resolve against the stylesheet folder
      caption.style.setProperty('--lc-art', `url("${new URL(`${ASSET_ROOT}holiday-${copy.id}-v1.webp`, document.baseURI).href}")`);
      caption.style.setProperty('--lc-art-pos', pos);
    }

    const date = document.createElement('span');
    date.className = 'seasonal-label-date';
    date.textContent = copy.id ? `${copy.date} · ${lcPick(C.kind[copy.status ? 'statutory' : 'national'])}` : copy.when;
    caption.append(date);

    const title = document.createElement('strong');
    if (theme === 'halloween') {
      title.className = 'seasonal-halloween-title';
      [...copy.title].forEach((character, index) => {
        const letter = document.createElement('span');
        letter.textContent = character;
        letter.style.setProperty('--letter-delay', `${(index * .11).toFixed(2)}s`);
        letter.style.setProperty('--letter-color', ['#ff784f', '#ffd15c', '#9be36a', '#65ccff', '#bd8cff'][index % 5]);
        title.append(letter);
      });
      const lightSwitch = document.createElement('button');
      lightSwitch.type = 'button';
      lightSwitch.className = 'seasonal-halloween-light-switch';
      lightSwitch.innerHTML = '<span aria-hidden="true">🕷</span>';
      lightSwitch.setAttribute('aria-pressed', 'false');
      lightSwitch.addEventListener('click', () => {
        const lit = !title.classList.contains('is-lit');
        title.classList.toggle('is-lit', lit);
        lightSwitch.classList.toggle('is-lit', lit);
        lightSwitch.setAttribute('aria-pressed', String(lit));
        updateLightLabel(lightSwitch);
      });
      caption.append(lightSwitch);
      updateLightLabel(lightSwitch);
    } else {
      title.textContent = copy.title;
    }

    if (theme === 'christmas') {
      const garland = image('seasonal-caption-christmas-lights', 'openclipart-christmas-garland.svg');
      const bulbs = document.createElement('span');
      bulbs.className = 'seasonal-caption-bulbs';
      for (let index = 0; index < 9; index += 1) bulbs.append(document.createElement('i'));
      const holly = image('seasonal-caption-mistletoe', 'openclipart-holly.svg');
      const bow = image('seasonal-caption-bow', 'openclipart-bow.svg');
      const caneLeft = image('seasonal-caption-candy-cane', 'openclipart-candy-cane.svg');
      const caneRight = image('seasonal-caption-candy-cane is-right', 'openclipart-candy-cane.svg');
      caption.append(garland, bulbs, holly, bow, caneLeft, caneRight);
    }

    const names = document.createElement('span');
    names.className = 'seasonal-label-names';
    const own = document.createElement('i');
    own.lang = lcHtmlLang[lang] || 'en';
    own.textContent = local[0];
    names.append(own);
    if (lang !== 'ja') {
      const ja = document.createElement('i');
      ja.lang = 'ja';
      ja.textContent = copy.officialName || copy.ja;
      names.append(ja);
    }
    const hint = document.createElement('span');
    hint.className = 'seasonal-label-hint';
    hint.lang = own.lang;
    hint.textContent = local[1];
    caption.append(title, names, hint);
    if (!copy.id && theme !== 'newyear' && theme !== 'obon') {
      const kind = document.createElement('span');
      kind.className = 'seasonal-label-hint seasonal-label-hint-secondary lc-kind';
      kind.textContent = lcPick(C.kind.festival);
      caption.append(kind);
    }
    const slot = document.getElementById('theme-badge');
    if (slot) { slot.hidden = false; slot.append(caption); } else document.body.append(caption);
  }

  function addBats(layer, compact) {
    const count = compact ? 12 : 24;
    for (let index = 0; index < count; index += 1) {
      const bat = document.createElement('i');
      bat.className = 'seasonal-bat';
      const direction = index % 2 ? -1 : 1;
      const duration = 24 + (index % 5) * 2.4;
      bat.style.setProperty('--x', direction > 0 ? '-8vw' : '108vw');
      bat.style.setProperty('--y', `${5 + ((index * 19) % 82)}vh`);
      bat.style.setProperty('--delay', `${-((index * 2.37) % 21).toFixed(2)}s`);
      bat.style.setProperty('--duration', `${duration}s`);
      bat.style.setProperty('--travel-half', `${direction * 58}vw`);
      bat.style.setProperty('--travel', `${direction * 116}vw`);
      bat.style.setProperty('--face-forward', direction > 0 ? '-1' : '1');
      bat.style.setProperty('--face-return', direction > 0 ? '1' : '-1');
      bat.style.setProperty('--scale', (0.55 + (index % 7) * .16).toFixed(2));
      bat.style.setProperty('--bat-opacity', (0.55 + (index % 3) * .085).toFixed(2));
      layer.append(bat);
    }
  }

  function addHalloween(layer, compact) {
    addBats(layer, compact);
    ['seasonal-halloween-haze', 'seasonal-web-left', 'seasonal-web-right'].forEach(name => layer.append(accent(name)));

    const spiders = accent('seasonal-spiders');
    for (let index = 0; index < 2; index += 1) {
      const line = document.createElement('i');
      line.className = 'seasonal-spider-line';
      line.append(image('', 'spider@16x.png'));
      spiders.append(line);
    }
    layer.append(spiders);

    const ghosts = accent('seasonal-ghost-pack');
    for (let index = 0; index < (compact ? 2 : 3); index += 1) ghosts.append(image('seasonal-ghost-image', 'ghost@16x.png'));
    layer.append(ghosts);

    const parade = accent('seasonal-monster-parade');
    [
      ['seasonal-zombie', 'openclipart-halloween-zombie.svg'],
      ['seasonal-mummy', 'openclipart_mummy.svg'],
      ['seasonal-vampire', 'openclipart-halloween-vampire.svg'],
      ['seasonal-skeleton', 'openclipart-halloween-skeleton.svg'],
      ['seasonal-monster', 'openclipart-halloween-frankenstein.svg'],
      ['seasonal-werewolf', 'openclipart-halloween-werewolf.svg']
    ].forEach(([className, file]) => parade.append(image(className, file)));
    layer.append(parade);

    const pumpkins = accent('seasonal-pumpkin-corners');
    pumpkins.append(image('', 'jack-o-lantern@16x.png'), image('', 'jack-o-lantern@16x.png'));
    layer.append(pumpkins);
  }

  function makeSettledLeaf(file, index, compact) {
    const leaf = image('seasonal-settled-leaf', file);
    leaf.style.setProperty('--settle-x', `${5 + Math.random() * 90}vw`);
    leaf.style.setProperty('--settle-y', `${Math.round(Math.pow(Math.random(), 1.7) * (compact ? 54 : 82))}px`);
    leaf.style.setProperty('--settle-slide', `${Math.round(Math.random() * 56 - 28)}px`);
    leaf.style.setProperty('--settle-angle', `${Math.round(Math.random() * 120 - 60)}deg`);
    const scale = (compact ? .7 : .78) + Math.random() * .48;
    leaf.style.setProperty('--settle-scale', scale.toFixed(2));
    leaf.style.setProperty('--settle-scale-entry', (scale * .82).toFixed(2));
    leaf.style.setProperty('--settle-delay', `${(index * .13).toFixed(2)}s`);
    return leaf;
  }

  function addThanksgiving(layer, compact) {
    const count = compact ? 10 : 20;
    const fallingLeaves = [];
    for (let index = 0; index < count; index += 1) {
      const file = LEAF_ASSETS[Math.floor(Math.random() * LEAF_ASSETS.length)];
      const leaf = image('seasonal-leaf', file);
      const direction = Math.random() < .5 ? -1 : 1;
      const duration = random(14.5, 27);
      const reach = random(18, compact ? 34 : 66);
      const firstRotation = random(-18, 18);
      const spinStep = random(10, 22) * (Math.random() < .5 ? -1 : 1);
      leaf.style.setProperty('--x', `${random(compact ? 12 : 7, compact ? 88 : 93)}vw`);
      leaf.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      leaf.style.setProperty('--delay', `${-random(0, duration).toFixed(2)}s`);
      leaf.style.setProperty('--scale', random(.84, 1.18).toFixed(2));
      leaf.style.setProperty('--leaf-opacity', random(.65, .9).toFixed(2));
      leaf.style.setProperty('--leaf-drift-a', `${direction * reach}px`);
      leaf.style.setProperty('--leaf-drift-b', `${direction * -random(reach * .35, reach * .92)}px`);
      leaf.style.setProperty('--leaf-drift-c', `${direction * random(reach * .55, reach * 1.38)}px`);
      leaf.style.setProperty('--leaf-drift-d', `${direction * -random(reach * .18, reach * .76)}px`);
      leaf.style.setProperty('--leaf-rotation-0', `${firstRotation}deg`);
      leaf.style.setProperty('--leaf-rotation-1', `${firstRotation + spinStep}deg`);
      leaf.style.setProperty('--leaf-rotation-2', `${firstRotation - spinStep * .65}deg`);
      leaf.style.setProperty('--leaf-rotation-3', `${firstRotation + spinStep * .8}deg`);
      leaf.style.setProperty('--leaf-rotation-4', `${firstRotation - spinStep * .45}deg`);
      leaf.style.setProperty('--leaf-rotation-5', `${firstRotation + spinStep * .25}deg`);
      fallingLeaves.push(leaf);
      layer.append(leaf);
    }

    const tray = document.createElement('span');
    tray.className = 'seasonal-settled-leaves';
    const seedCount = compact ? 22 : 38;
    for (let index = 0; index < seedCount; index += 1) tray.append(makeSettledLeaf(SETTLED_LEAF_ASSETS[index % SETTLED_LEAF_ASSETS.length], index, compact));
    fallingLeaves.forEach((leaf, index) => leaf.addEventListener('animationiteration', () => {
      const current = tray.querySelectorAll('.seasonal-settled-leaf');
      [...current].slice(0, Math.max(0, current.length - (compact ? 58 : 118))).forEach(node => node.remove());
      tray.append(makeSettledLeaf(leaf.dataset.seasonalAsset, 0, compact));
      tray.append(makeSettledLeaf(leaf.dataset.seasonalAsset, 0, compact));
    }));
    layer.append(tray);

    const footer = document.createElement('div');
    footer.className = 'seasonal-thanksgiving-footer-decor';
    footer.setAttribute('aria-hidden', 'true');
    const left = document.createElement('span');
    left.className = 'seasonal-thanksgiving-footer-cluster is-left';
    left.append(image('seasonal-turkey-image', 'openclipart-turkey.webp'));
    left.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    left.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    const right = document.createElement('span');
    right.className = 'seasonal-thanksgiving-footer-cluster is-right';
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    footer.append(left, right);
    document.body.append(footer);
  }

  function addChristmas(layer, compact) {
    const snowCount = compact ? 36 : 96;
    for (let index = 0; index < snowCount; index += 1) {
      const snow = image('seasonal-particle seasonal-snow', 'openclipart-snowflake.svg');
      const direction = index % 2 ? -1 : 1;
      snow.style.setProperty('--x', `${3 + ((index * 37 + 11) % 94)}vw`);
      snow.style.setProperty('--start-y', `${5 + ((index * 19) % 82)}vh`);
      snow.style.setProperty('--delay', `${-((index * 2.37) % 21).toFixed(2)}s`);
      snow.style.setProperty('--duration', `${11 + (index % 7) * 1.6}s`);
      snow.style.setProperty('--scale', `${(0.72 + (index % 5) * 0.11).toFixed(2)}`);
      snow.style.setProperty('--drift-7', `${direction * 7}px`);
      snow.style.setProperty('--drift-11', `${direction * 11}px`);
      snow.style.setProperty('--drift-18', `${direction * 18}px`);
      layer.append(snow);
    }

    layer.append(accent('seasonal-winter-glow'));

    const lights = image('seasonal-accent seasonal-string-lights', 'openclipart-christmas-garland.svg');
    const wreath = image('seasonal-accent seasonal-christmas-wreath', 'openclipart-christmas-wreath.webp');
    layer.append(lights, wreath);

    const trees = accent('seasonal-winter-trees');
    for (let index = 0; index < 2; index += 1) {
      const tree = image(`seasonal-tree-image ${index ? 'is-right' : 'is-left'}`, 'golden-spiral-tree.svg?v=20261022-9');
      trees.append(tree);
    }
    layer.append(trees);

    const gifts = accent('seasonal-gift-row');
    ['is-left', 'is-right'].forEach(side => {
      const cluster = document.createElement('span');
      cluster.className = `seasonal-gift-cluster ${side}`;
      const boxCount = compact ? 3 : 5;
      for (let index = 0; index < boxCount; index += 1) {
        const gift = document.createElement('i');
        gift.className = `seasonal-gift-box gift-${index + 1}`;
        cluster.append(gift);
      }
      cluster.append(image('seasonal-gift-candy-cane', 'openclipart-candy-cane.svg'));
      gifts.append(cluster);
    });
    layer.append(gifts, accent('seasonal-christmas-snowbank'));

    const flight = accent('seasonal-santa-flight');
    flight.append(image('seasonal-santa-flight-art', 'golden-running-reindeer-sleigh-cloud.svg?v=20261022-2'));
    layer.append(flight);
  }

  // Page-wide weather for national holidays, chosen by season (personal site addition, Kansai assets):
  //   Dec-Feb snow (Kansai snowflake) - Mar-Apr cherry petals - May fresh green leaves -
  //   Sep-Nov autumn leaves (Kansai leaf art) - Mountain Day mist. Marine Day keeps the Kansai bubbles.
  function holidayWeather(holiday) {
    if (holiday.id === 'mountain') return 'mist';
    if (holiday.id === 'marine') return null;
    const m = Number(String(holiday.date || '').slice(5, 7)) || osakaDateParts().month;
    if (m === 12 || m <= 2) return 'snow';
    if (m <= 4) return 'petal';
    if (m === 5) return 'green';
    if (m >= 9) return 'leaf';
    return null;
  }
  function addHolidayWeather(layer, compact, holiday) {
    const kind = holidayWeather(holiday);
    if (!kind) return;
    const field = accent(`lc-weather lc-weather-${kind}`);
    if (kind === 'mist') {
      for (let index = 0; index < 4; index += 1) {
        const band = document.createElement('i');
        band.style.setProperty('--y', `${18 + index * 20}vh`);
        band.style.setProperty('--delay', `${-(index * 6)}s`);
        band.style.setProperty('--duration', `${26 + index * 5}s`);
        field.append(band);
      }
      layer.append(field);
      return;
    }
    const count = kind === 'snow' ? (compact ? 34 : 80) : (compact ? 16 : 36);
    for (let index = 0; index < count; index += 1) {
      let piece;
      if (kind === 'snow') piece = image('lc-fall lc-fall-snow', 'openclipart-snowflake.svg');
      else if (kind === 'leaf') piece = image('lc-fall lc-fall-leaf', LEAF_ASSETS[index % LEAF_ASSETS.length]);
      else { piece = document.createElement('i'); piece.className = `lc-fall lc-fall-${kind}`; }
      const dir = index % 2 ? -1 : 1;
      piece.style.setProperty('--x', `${(index * 37 + 7) % 100}vw`);
      piece.style.setProperty('--delay', `${-((index * 1.93) % 18).toFixed(2)}s`);
      piece.style.setProperty('--duration', `${(kind === 'snow' ? 12 : 14) + (index % 6) * 1.7}s`);
      piece.style.setProperty('--scale', `${(0.6 + (index % 5) * 0.14).toFixed(2)}`);
      piece.style.setProperty('--sway', `${dir * (24 + (index % 4) * 14)}px`);
      piece.style.setProperty('--spin', `${dir * (180 + (index % 3) * 120)}deg`);
      field.append(piece);
    }
    layer.append(field);
  }

  function addJapanHoliday(layer, compact, holiday) {
    layer.classList.add(`holiday-${holiday.id}`, `holiday-family-${holiday.family}`);
    layer.append(accent('seasonal-jp-edgewash'));

    // Personal site: the holiday illustration is the background of the holiday caption box (see addCaption).
    addHolidayWeather(layer, compact, holiday);

    const motion = accent('seasonal-jp-motion');
    const motionCount = compact ? 5 : 10;
    for (let index = 0; index < motionCount; index += 1) {
      const particle = document.createElement('i');
      particle.style.setProperty('--motion-x', `${5 + ((index * 37) % 91)}vw`);
      particle.style.setProperty('--motion-y', `${18 + ((index * 29) % 70)}vh`);
      particle.style.setProperty('--motion-delay', `${-(index * .67).toFixed(2)}s`);
      particle.style.setProperty('--motion-scale', `${(.68 + (index % 4) * .16).toFixed(2)}`);
      motion.append(particle);
    }
    layer.append(motion, accent('seasonal-jp-floorlight'));
  }

  function addObon(layer, compact) {
    layer.append(accent('seasonal-obon-haze'));

    const lanterns = accent('seasonal-obon-lantern-row');
    const lanternCount = compact ? 5 : 9;
    for (let index = 0; index < lanternCount; index += 1) {
      const lantern = document.createElement('i');
      lantern.className = 'seasonal-obon-lantern';
      lantern.style.setProperty('--lantern-x', `${5 + index * (90 / Math.max(1, lanternCount - 1))}vw`);
      lantern.style.setProperty('--lantern-delay', `${-(index * .43).toFixed(2)}s`);
      lantern.style.setProperty('--lantern-scale', `${(.76 + (index % 3) * .11).toFixed(2)}`);
      lanterns.append(lantern);
    }
    layer.append(lanterns);

    const fireflies = accent('seasonal-obon-fireflies');
    const fireflyCount = compact ? 10 : 24;
    for (let index = 0; index < fireflyCount; index += 1) {
      const firefly = document.createElement('i');
      firefly.style.setProperty('--firefly-x', `${4 + ((index * 37) % 92)}vw`);
      firefly.style.setProperty('--firefly-y', `${18 + ((index * 29) % 69)}vh`);
      firefly.style.setProperty('--firefly-delay', `${-(index * .61).toFixed(2)}s`);
      fireflies.append(firefly);
    }
    layer.append(fireflies);

    const spirits = accent('seasonal-obon-hitodama-field');
    const spiritCount = compact ? 7 : 15;
    for (let index = 0; index < spiritCount; index += 1) {
      const spirit = document.createElement('i');
      spirit.className = 'seasonal-obon-hitodama';
      spirit.style.setProperty('--spirit-x', `${5 + ((index * 41) % 91)}vw`);
      spirit.style.setProperty('--spirit-y', `${21 + ((index * 23) % 59)}vh`);
      spirit.style.setProperty('--spirit-delay', `${-(index * .73).toFixed(2)}s`);
      spirit.style.setProperty('--spirit-scale', `${(.62 + (index % 4) * .16).toFixed(2)}`);
      spirits.append(spirit);
    }
    layer.append(spirits);

    const procession = accent('seasonal-obon-procession');
    [
      ['is-kappa', 'obon-yokai-kappa-karakasa-v1.webp'],
      ['is-chochin', 'obon-yokai-chochin-hitotsume-v1.webp'],
      ['is-kitsune', 'obon-yokai-kitsune-tengu-v1.webp']
    ].forEach(([className, file], index) => {
      const figure = image(`seasonal-obon-yokai-pair ${className}`, file);
      figure.style.setProperty('--yokai-delay', `${-(index * .31).toFixed(2)}s`);
      procession.append(figure);
    });
    layer.append(procession, accent('seasonal-obon-riverlight'));
  }

  function addNewYear(layer, compact) {
    const paperCount = compact ? 6 : 14;
    for (let index = 0; index < paperCount; index += 1) {
      const paper = document.createElement('i');
      paper.className = 'seasonal-particle seasonal-gold-paper';
      const direction = index % 2 ? -1 : 1;
      paper.style.setProperty('--x', `${3 + ((index * 37 + 11) % 94)}vw`);
      paper.style.setProperty('--start-y', `${5 + ((index * 19) % 82)}vh`);
      paper.style.setProperty('--delay', `${-((index * 2.37) % 21).toFixed(2)}s`);
      paper.style.setProperty('--duration', `${11 + (index % 7) * 1.6}s`);
      paper.style.setProperty('--drift-35', `${direction * 35}px`);
      paper.style.setProperty('--scale', `${(0.72 + (index % 5) * 0.11).toFixed(2)}`);
      layer.append(paper);
    }

    layer.append(accent('seasonal-newyear-glow'));
    layer.append(image('seasonal-accent seasonal-newyear-sunrise', 'newyear-hatsuhinode.svg?v=20261023-1'));
    layer.append(image('seasonal-accent seasonal-newyear-garland', 'newyear-mizuhiki.svg?v=20261023-1'));

    const fireworks = accent('seasonal-fireworks');
    const canvas = document.createElement('canvas');
    canvas.className = 'seasonal-fireworks-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    fireworks.append(canvas);
    layer.append(fireworks);

    layer.append(image('seasonal-accent seasonal-kadomatsu', 'newyear-kadomatsu.svg?v=20261023-1'));
    layer.append(image('seasonal-accent seasonal-kadomatsu-right', 'newyear-kadomatsu.svg?v=20261023-1'));
    layer.append(image('seasonal-accent seasonal-newyear-lanterns', 'newyear-fan.svg?v=20261023-1'));
    layer.append(image('seasonal-accent seasonal-newyear-gifts', 'newyear-kagamimochi.svg?v=20261023-1'));
  }

  let renderedTheme;
  let renderedDate;
  function render(theme) {
    document.querySelector('.seasonal-layer')?.remove();
    document.querySelector('.seasonal-holiday-note')?.remove();
    document.querySelector('.seasonal-thanksgiving-footer-decor')?.remove();
    const slot = document.getElementById('theme-badge');
    if (slot) slot.hidden = true;
    let holiday = null;
    if (theme === 'japanholiday') holiday = previewHoliday() || holidayForParts(osakaDateParts());
    if (theme === 'japanholiday' && !holiday) theme = null;
    document.documentElement.dataset.season = theme || 'off';
    if (holiday) document.documentElement.dataset.holiday = holiday.id;
    else delete document.documentElement.dataset.holiday;
    renderedTheme = theme;
    if (!theme) {
      document.dispatchEvent(new CustomEvent('kansai-season-change', { detail: { theme: null } }));
      return;
    }
    const compact = compactMode();
    const lowData = navigator.connection?.saveData === true;
    const layer = document.createElement('div');
    layer.className = `seasonal-layer seasonal-theme-${theme}${compact ? ' is-compact' : ''}${lowData ? ' is-low-data' : ''}`;
    layer.setAttribute('aria-hidden', 'true');
    if (theme === 'halloween') addHalloween(layer, compact);
    if (theme === 'thanksgiving') addThanksgiving(layer, compact);
    if (theme === 'christmas') addChristmas(layer, compact);
    if (theme === 'newyear') addNewYear(layer, compact);
    if (theme === 'japanholiday') addJapanHoliday(layer, compact, holiday);
    if (theme === 'obon') addObon(layer, compact);
    document.body.append(layer);
    clipBelowBanner();
    addCaption(theme, theme === 'newyear' ? newYearCaptionForParts(osakaDateParts()) : holiday);
    document.dispatchEvent(new CustomEvent('kansai-season-change', { detail: { theme } }));
  }

  function dateKey(parts) {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }
  function sync() {
    const parts = osakaDateParts();
    const theme = currentTheme();
    const today = dateKey(parts);
    if (theme === renderedTheme && today === renderedDate) return;
    renderedDate = today;
    render(theme);
  }
  function useOfficialData(d) {
    try {
      officialHolidayCalendar = d && d.official ? holidayEngine.createOfficialCalendar(d.official) : null;
      officialHolidayLoadState = officialHolidayCalendar ? 'official' : 'unavailable';
    } catch (error) {
      officialHolidayCalendar = null; officialHolidayLoadState = 'unavailable';
    }
    document.documentElement.dataset.holidayCalendar = officialHolidayLoadState;
    renderedDate = null;
    sync();
  }
  window.addEventListener('lc:holidays', event => useOfficialData(event.detail));
  if (window.LC_holidayData !== undefined) useOfficialData(window.LC_holidayData);

  // Keep every decoration below the banner: the banner text and name are never covered.
  // Personal site: the effect layer is cut out (clip-path with holes) around the poster, the header and the key
  // content - name, main buttons, tagline, holiday caption and the control dock - so nothing drawn by the effects,
  // moving particles included, ever lies on top of them. On phones the layer also stays below the poster.
  // Also every link, button and menu on screen (cards, platform links, language buttons in the footer, counters):
  // decorations pass behind them instead of being drawn on top.
  // Every readable thing on screen: headings, paragraphs, labels, the avatar, cards, controls, the footer.
  // Effects keep playing in the gaps between them (and over the plain navy ground).
  const HOLE_TARGETS = '.site-nav,.profile-avatar,.glass-player,.intro h1,.hero-split .tagline,.seasonal-holiday-note.lc-in-flow,.lc-dock>*,' +
    'h1,h2,h3,p,li,.label,.avatar,.bio-panel,.bio-src,.facts,.sec-head,' +
    'main a,main button,main select,footer a,footer button,.stat,.clock,.date-line,.week,.day-tags,.data-line,.foot-bar,.ask';  // I1: whole Q&A box
  function mergeRects(list) {
    const out = list.map(r => ({ l: r.l, t: r.t, r: r.r, b: r.b }));
    for (let changed = true; changed;) {
      changed = false;
      for (let a = 0; a < out.length && !changed; a++) for (let b = a + 1; b < out.length; b++) {
        const A = out[a], B = out[b];
        if (A.l < B.r && B.l < A.r && A.t < B.b && B.t < A.b) {
          out[a] = { l: Math.min(A.l, B.l), t: Math.min(A.t, B.t), r: Math.max(A.r, B.r), b: Math.max(A.b, B.b) };
          out.splice(b, 1); changed = true; break;
        }
      }
    }
    return out;
  }
  function shift(path, dx, dy) {
    return path.replace(/M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H(-?[\d.]+)Z/g, (m, x1, y1, x2, y2, x3) =>
      `M${+x1 + dx} ${+y1 + dy}H${+x2 + dx}V${+y2 + dy}H${+x3 + dx}Z`);
  }
  function clipBelowBanner() {
    // the Thanksgiving footer decoration lives outside the layer (position: fixed) and gets the same cut-out
    const layers = [...document.querySelectorAll('.seasonal-layer,.seasonal-thanksgiving-footer-decor')];
    if (!layers.length) return;
    const W = innerWidth, H = innerHeight, PAD = 6;
    let top = 0; const holes = [];
    const hero = document.querySelector('.hero-art');
    if (hero) {
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0 && r.top < H) {
        if (r.left > 1) holes.push({ l: r.left, t: r.top, r: r.right, b: r.bottom });  // poster beside the intro (desktop)
        else top = Math.max(0, Math.round(r.bottom));                                  // poster on top (phone)
      }
    }
    document.querySelectorAll(HOLE_TARGETS).forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width && r.height && r.bottom > top && r.top < H) holes.push({ l: r.left - PAD, t: r.top - PAD, r: r.right + PAD, b: r.bottom + PAD });
    });
    let d = `M0 ${top}H${W}V${H}H0Z`;
    mergeRects(holes).forEach(h => {
      const l = Math.max(0, Math.round(h.l)), t = Math.max(top, Math.round(h.t)), r = Math.min(W, Math.round(h.r)), b = Math.min(H, Math.round(h.b));
      if (r > l && b > t) d += `M${l} ${t}H${r}V${b}H${l}Z`;
    });
    layers.forEach(layer => {
      // clip-path coordinates are relative to the element's own box; a fixed element not at the top-left needs an offset
      const b = layer.getBoundingClientRect();
      layer.style.clipPath = b.left || b.top ? `path(evenodd, "${shift(d, -b.left, -b.top)}")` : `path(evenodd, "${d}")`;
    });
  }
  // Personal site: decorations pinned to the bottom of the screen (monster parade, gifts, kadomatsu, Obon
  // procession...) step aside while they would sit on the name, the main buttons, the tagline or the holiday
  // caption, and come back as soon as those have scrolled away. The decorations themselves are unchanged.
  const BOTTOM_DECOR = '.seasonal-monster-parade,.seasonal-winter-trees,.seasonal-gift-row,.seasonal-christmas-snowbank,' +
    '.seasonal-kadomatsu,.seasonal-kadomatsu-right,.seasonal-newyear-lanterns,.seasonal-newyear-gifts,' +
    '.seasonal-thanksgiving-footer-decor,.seasonal-obon-procession,.seasonal-obon-riverlight,' +
    '.seasonal-pumpkin-corners img,.seasonal-settled-leaves';
  const KEY_CONTENT = '.intro h1,.hero-split .cta .btn,.hero-split .tagline,.seasonal-holiday-note.lc-in-flow,h2,h3,.avatar,.bio-panel,footer .lang-switch,.foot-bar,.ask';  // I1: + Q&A box
  function yieldToContent() {
    const decor = [...document.querySelectorAll(BOTTOM_DECOR)].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
    const key = [...document.querySelectorAll(KEY_CONTENT)].map(e => e.getBoundingClientRect()).filter(r => r.width && r.bottom > 0 && r.top < innerHeight);
    // vertical bands only: several decorations travel sideways, so any shared height counts as an overlap
    const hit = decor.some(d => key.some(k => !(k.bottom <= d.top || k.top >= d.bottom)));
    document.documentElement.classList.toggle('lc-decor-yield', hit);
  }
  let decorFrame = 0;
  function onViewChange() { if (!decorFrame) decorFrame = requestAnimationFrame(() => { decorFrame = 0; clipBelowBanner(); yieldToContent(); }); }
  window.addEventListener('scroll', onViewChange, { passive: true });
  window.addEventListener('resize', onViewChange);
  document.addEventListener('kansai-season-change', () => { setTimeout(onViewChange, 60); setTimeout(onViewChange, 700); });
  window.addEventListener('load', onViewChange);
  window.addEventListener('lc:dock-moved', onViewChange);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onViewChange);
  document.addEventListener('guide-language-change', () => setTimeout(onViewChange, 60));
  if ('ResizeObserver' in window) new ResizeObserver(onViewChange).observe(document.documentElement);
  document.addEventListener('guide-language-change', () => { if (lastCaption && renderedTheme) addCaption(lastCaption[0], lastCaption[1]); });

  let midnightTimer;
  function scheduleNextOsakaMidnight() {
    clearTimeout(midnightTimer);
    const parts = osakaDateParts();
    const next = Date.UTC(parts.year, parts.month - 1, parts.day, 15, 0, 0);
    midnightTimer = setTimeout(() => { sync(); scheduleNextOsakaMidnight(); }, Math.max(0, next - Date.now()));
  }
  function updateMediaFocus() {
    const layer = document.querySelector('.seasonal-layer');
    if (!layer) return;
    layer.classList.toggle('media-focus', [...document.querySelectorAll('video')].some(video => !video.paused && !video.ended));
    layer.classList.toggle('media-fullscreen', Boolean(document.fullscreenElement));
  }
  document.addEventListener('visibilitychange', () => {
    document.querySelector('.seasonal-layer')?.classList.toggle('is-paused', document.hidden);
    if (!document.hidden) { sync(); scheduleNextOsakaMidnight(); }
  });
  document.addEventListener('play', updateMediaFocus, true);
  document.addEventListener('pause', updateMediaFocus, true);
  document.addEventListener('ended', updateMediaFocus, true);
  document.addEventListener('fullscreenchange', updateMediaFocus);
  document.addEventListener('guide-language-change', () => updateLightLabel(document.querySelector('.seasonal-halloween-light-switch')));
  let lastSnowTrailAt = 0;
  function localSnowShower(x, y, requestedCount) {
    const layer = document.querySelector('.seasonal-layer.seasonal-theme-christmas');
    if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const compact = matchMedia('(max-width: 680px)').matches || navigator.connection?.saveData === true;
    const count = compact ? Math.min(8, requestedCount) : requestedCount;
    const existing = layer.querySelectorAll('.seasonal-snow-burst');
    [...existing].slice(0, Math.max(0, existing.length + count - (compact ? 32 : 72))).forEach(node => node.remove());
    for (let index = 0; index < count; index += 1) {
      const flake = image('seasonal-snow-burst', 'openclipart-snowflake.svg');
      flake.style.setProperty('--burst-x', `${x + (index % 3 - 1) * (13 + index * 2)}px`);
      flake.style.setProperty('--burst-y', `${y - 18 - (index % 4) * 9}px`);
      const drift = ((index * 29) % 90) - 45;
      const scale = 0.62 + (index % 5) * 0.18;
      flake.style.setProperty('--burst-dx', `${drift}px`);
      flake.style.setProperty('--burst-dx-quarter', `${drift * 0.25}px`);
      flake.style.setProperty('--burst-scale', scale.toFixed(2));
      flake.style.setProperty('--burst-scale-end', (scale * 0.75).toFixed(2));
      flake.style.setProperty('--burst-delay', `${-(index % 3) * 0.12}s`);
      layer.append(flake);
      window.setTimeout(() => flake.remove(), 5900);
    }
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(max-width: 680px)').matches) return;
    const now = performance.now();
    if (now - lastSnowTrailAt < 78) return;
    lastSnowTrailAt = now;
    localSnowShower(event.clientX, event.clientY, 9);
  }, { passive: true });
  document.addEventListener('pointerdown', event => localSnowShower(event.clientX, event.clientY, 24), { passive: true });
  matchMedia('(max-width: 680px)').addEventListener?.('change', () => render(currentTheme()));
  window.addEventListener('pageshow', () => { sync(); scheduleNextOsakaMidnight(); });
  sync();
  scheduleNextOsakaMidnight();
  window.KansaiSeasonal = Object.freeze({
    resolve: date => automaticTheme(osakaDateParts(date)),
    holiday: date => holidayForParts(osakaDateParts(date)),
    active: () => renderedTheme,
    holidayCalendar: () => ({
      state: officialHolidayLoadState,
      years: officialHolidayCalendar ? [...officialHolidayCalendar.years] : []
    })
  });
})();
