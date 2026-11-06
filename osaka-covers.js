window.renderOsakaCovers=async function(grid,tracks){
 if(!grid)return;
 const cards=[{cover:'assets/cover.png',title:'OSAKA',album:true},...tracks];
 grid.replaceChildren();
 function syncSelection(){
  const selected=document.getElementById('osaka-audio')?.dataset.selectedCover;
  grid.querySelectorAll('button').forEach((button,index)=>{
   if(selected===String(index))button.setAttribute('aria-current','true');
   else button.removeAttribute('aria-current');
  });
 }
 cards.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='track-cover-option';b.setAttribute('aria-label',t.title);const img=document.createElement('img');img.src=t.cover;img.alt=t.title;img.loading='lazy';const label=document.createElement('span');label.textContent=t.title;b.append(img,label);b.addEventListener('click',()=>{document.dispatchEvent(new CustomEvent('osaka-select-track',{detail:{album:!!t.album,index:i-1}}))});grid.append(b)});
 document.addEventListener('osaka-track-change',syncSelection);
 syncSelection();
};
