window.renderOsakaCovers=async function(grid,tracks){
 if(!grid)return;
 const audio=document.getElementById('osaka-audio');
 const source=document.getElementById('osaka-controls');
 const cards=[{cover:'assets/cover.png',title:'OSAKA',album:true},...tracks];
 const mirrors=[];
 let activePanel=Number(audio.dataset.selectedCover||0), forwarding=false;
 grid.replaceChildren();
 function sync(){
  const selected=audio.dataset.selectedCover;
  grid.querySelectorAll('.track-cover-option').forEach((button,index)=>{
   button.disabled=audio.dataset.playerReady!=='true';
   button.toggleAttribute('aria-current',selected===String(index));
   if(selected===String(index))button.setAttribute('aria-current','true');
  });
  mirrors.forEach(({panel,index,pairs})=>{
   panel.hidden=activePanel!==index;panel.parentElement.hidden=panel.hidden;
   panel.querySelector('.cover-now-title').textContent=document.getElementById('osaka-title').textContent;
   const message=panel.closest('.track-cover-card').querySelector('.cover-audio-error');
   message.hidden=activePanel!==index||document.getElementById('osaka-error').hidden;message.textContent=document.getElementById('osaka-error').textContent;
   pairs.forEach(([original,copy])=>{
    copy.hidden=original.hidden;
    if('disabled' in original)copy.disabled=original.disabled;
    if(original.tagName==='INPUT'){copy.value=original.value;copy.style.cssText=original.style.cssText;}
    if(original.classList.contains('glass-time')||original.classList.contains('single-accessible')||original.id==='osaka-device-volume')copy.textContent=original.textContent;
    ['aria-label','aria-valuetext','title'].forEach(key=>{if(original.hasAttribute(key))copy.setAttribute(key,original.getAttribute(key));});
   });
  });
 }
 cards.forEach((t,i)=>{
  const card=document.createElement('div');card.className='track-cover-card';
  const b=document.createElement('button');b.type='button';b.className='track-cover-option';b.setAttribute('aria-label',t.title);
  const img=document.createElement('img');img.src=t.cover;img.alt=t.title;img.loading='lazy';
  const label=document.createElement('span');label.textContent=t.title;label.className='track-cover-caption';b.append(img);
  b.addEventListener('click',()=>{activePanel=i;document.dispatchEvent(new CustomEvent('osaka-select-track',{detail:{album:!!t.album,index:i-1}}));queueMicrotask(sync)});
  const panel=source.cloneNode(true);panel.removeAttribute('id');panel.classList.add('cover-glass-controls');panel.hidden=true;
  const originals=Array.from(source.querySelectorAll('*')),copies=Array.from(panel.querySelectorAll('*'));
  const pairs=originals.map((original,j)=>[original,copies[j]]);
  pairs.forEach(([original,copy])=>{
   copy.removeAttribute('id');
   if(original.tagName==='BUTTON')copy.addEventListener('click',()=>{forwarding=true;original.click();forwarding=false;queueMicrotask(sync)});
   if(original.tagName==='INPUT')copy.addEventListener('input',()=>{original.value=copy.value;original.dispatchEvent(new Event('input',{bubbles:true}));sync()});
  });
  const now=document.createElement('p');now.className='cover-now-title';panel.prepend(now);
  const message=document.createElement('p');message.className='cover-audio-error';message.hidden=true;message.setAttribute('role','status');
  const art=document.createElement('div');art.className='track-cover-art';
  const glass=document.createElement('div');glass.className='single-controls cover-glass-overlay';glass.append(panel);
  art.append(b,glass);card.append(art,label,message);grid.append(card);mirrors.push({panel,index:i,pairs});
 });
 document.addEventListener('osaka-track-change',()=>{queueMicrotask(sync)});
 document.getElementById('osaka-track-select').addEventListener('change',()=>{activePanel=Number(audio.dataset.selectedCover);queueMicrotask(sync)});
 document.addEventListener('osaka-player-state',()=>queueMicrotask(sync));
 document.addEventListener('guide-language-change',()=>queueMicrotask(sync));
 ['playing','pause','timeupdate','loadedmetadata','volumechange','ended','error'].forEach(name=>audio.addEventListener(name,()=>queueMicrotask(sync)));
 sync();
};
