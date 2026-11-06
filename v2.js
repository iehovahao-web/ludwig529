(async()=>{
 const [texts,tracks]=await Promise.all([fetch('bio-ui.json').then(r=>r.json()),fetch('audio-tracks.json').then(r=>r.json())]);
 const language=()=>document.querySelector('#language-select').value;
 const grid=document.querySelector('#track-cover-grid');

 await window.renderOsakaCovers(grid,tracks);
 function apply(){const d=texts[language()]||texts.zh;document.querySelectorAll('[data-bio]').forEach(e=>{if(d[e.dataset.bio]!==undefined)e.textContent=d[e.dataset.bio]});const names={zh:'我在日本',en:'My Life in Japan',ja:'日本での暮らし',ko:'나의 일본 생활',es:'Mi vida en Japón',de:'Mein Leben in Japan',it:'La mia vita in Giappone'};const name=names[language()]||names.zh;document.title=name+' | Ludwig Cheung';document.querySelector('.brand strong').textContent=name;document.querySelector('.brand').setAttribute('aria-label',name);document.querySelector('#page-title').textContent=name;document.querySelectorAll('.track-cover-option').forEach((b,i)=>b.setAttribute('aria-label',d.play+' · '+(i===0?'OSAKA':tracks[i-1].title)));tick()}
 function tick(){const l=language()==='zh'?'zh-TW':language();const now=new Date();document.querySelector('#local-osaka-clock').textContent=new Intl.DateTimeFormat(l,{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);document.querySelector('#local-osaka-date').textContent=new Intl.DateTimeFormat(l,{timeZone:'Asia/Tokyo',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(now)}
 document.addEventListener('guide-language-change',apply);apply();setInterval(tick,1000);
})();
