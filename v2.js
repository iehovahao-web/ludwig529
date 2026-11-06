(()=>{
 const language=()=>document.querySelector('#language-select').value;
 const grid=document.querySelector('#track-cover-grid');
 const names={zh:'我在日本',en:'My Life in Japan',ja:'日本での暮らし',ko:'나의 일본 생활',es:'Mi vida en Japón',de:'Mein Leben in Japan',it:'La mia vita in Giappone'};
 const play={zh:'播放',en:'Play',ja:'再生',ko:'재생',es:'Reproducir',de:'Abspielen',it:'Riproduci'};
 const failures={
  bio:{zh:'個人簡介暫時無法載入，請重新整理頁面。',en:'The biography could not be loaded. Please reload the page.',ja:'プロフィールを読み込めません。ページを再読み込みしてください。',ko:'소개를 불러오지 못했습니다. 페이지를 새로고침해 주세요.',es:'No se ha podido cargar la biografía. Recarga la página.',de:'Die Biografie konnte nicht geladen werden. Bitte lade die Seite neu.',it:'Impossibile caricare la biografia. Ricarica la pagina.'},
  tracks:{zh:'專輯封面暫時無法載入，請重新整理頁面。',en:'The album covers could not be loaded. Please reload the page.',ja:'アルバムのジャケットを読み込めません。ページを再読み込みしてください。',ko:'앨범 표지를 불러오지 못했습니다. 페이지를 새로고침해 주세요.',es:'No se han podido cargar las portadas. Recarga la página.',de:'Die Albumcover konnten nicht geladen werden. Bitte lade die Seite neu.',it:'Impossibile caricare le copertine. Ricarica la pagina.'}
 };
 let texts={},tracks=[],bioError=null,tracksError=null;
 function apply(){
  const l=language(),d=texts[l]||texts.zh||{};
  document.querySelectorAll('[data-bio]').forEach(e=>{if(d[e.dataset.bio]!==undefined)e.textContent=d[e.dataset.bio]});
  const name=names[l]||names.zh;document.title=name+' | Ludwig Cheung';document.querySelector('.brand strong').textContent=name;document.querySelector('.brand').setAttribute('aria-label',name);document.querySelector('#page-title').textContent=name;
  document.querySelectorAll('.track-cover-option').forEach((b,i)=>b.setAttribute('aria-label',(d.play||play[l]||play.en)+' · '+(i===0?'OSAKA':tracks[i-1].title)));
  if(bioError)bioError.textContent=failures.bio[l]||failures.bio.en;
  if(tracksError)tracksError.textContent=failures.tracks[l]||failures.tracks.en;
  tick();
 }
 function tick(){const l=language()==='zh'?'zh-TW':language();const now=new Date();document.querySelector('#local-osaka-clock').textContent=new Intl.DateTimeFormat(l,{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(now);document.querySelector('#local-osaka-date').textContent=new Intl.DateTimeFormat(l,{timeZone:'Asia/Tokyo',year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(now)}
 function showError(parent){const message=document.createElement('p');message.setAttribute('role','status');parent.append(message);return message}
 async function readJSON(url){const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Resource unavailable');return response.json()}
 document.addEventListener('guide-language-change',apply);apply();setInterval(tick,1000);
 // Each resource initializes independently; a failed album request must not stop the bio or clock.
 readJSON('bio-ui.json').then(data=>{if(!data||!data.zh||typeof data.zh!=='object')throw Error('Invalid biography');texts=data}).catch(()=>{bioError=showError(document.querySelector('.my-bio'))}).finally(apply);
 readJSON('audio-tracks.json').then(async data=>{if(!Array.isArray(data)||data.length!==12||data.some(t=>!t||typeof t.title!=='string'||typeof t.cover!=='string'))throw Error('Invalid tracks');tracks=data;await window.renderOsakaCovers(grid,tracks)}).catch(()=>{grid.replaceChildren();tracksError=showError(grid)}).finally(apply);
})();
