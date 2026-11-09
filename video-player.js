(() => {
 const words={zh:['播放','暫停','快退 10 秒','快進 10 秒','音量','播放進度','影片暫時無法播放，請重試。'],en:['Play','Pause','Back 10 seconds','Forward 10 seconds','Volume','Playback position','Unable to play. Please try again.'],ja:['再生','一時停止','10秒戻る','10秒進む','音量','再生位置','再生できません。もう一度お試しください。'],ko:['재생','일시 정지','10초 뒤로','10초 앞으로','음량','재생 위치','재생할 수 없습니다. 다시 시도해 주세요.'],es:['Reproducir','Pausar','Retroceder 10 segundos','Avanzar 10 segundos','Volumen','Posición de reproducción','No se puede reproducir. Inténtalo de nuevo.'],de:['Abspielen','Pause','10 Sekunden zurück','10 Sekunden vor','Lautstärke','Wiedergabeposition','Wiedergabe nicht möglich. Bitte erneut versuchen.'],it:['Riproduci','Pausa','Indietro di 10 secondi','Avanti di 10 secondi','Volume','Posizione di riproduzione','Riproduzione non disponibile. Riprova.']};
 const mobile=matchMedia('(pointer:coarse)').matches || /iPhone|iPad|iPod|Android/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const time=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'0:00';
 document.querySelectorAll('.video-section').forEach(section=>{
  const v=section.querySelector('video'), start=section.querySelector('.video-play');if(!v||!start)return;
  const bar=document.createElement('div');bar.className='video-glass';
  bar.innerHTML='<div class="vg-progress"><span class="vg-time">0:00 / 0:00</span><input class="vg-seek" type="range" min="0" max="1000" value="0" disabled></div><div class="vg-buttons"><button type="button" class="vg-back" disabled>↶<small>10</small></button><button type="button" class="vg-toggle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4L20 12L8 20Z"/></svg></button><button type="button" class="vg-forward" disabled>↷<small>10</small></button><label class="vg-volume"><span aria-hidden="true">♪</span><input type="range" min="0" max="1" step="0.05" value="1"></label></div>';
  section.querySelector('.video-stage').append(bar);v.controls=false;
  const toggle=bar.querySelector('.vg-toggle'),back=bar.querySelector('.vg-back'),forward=bar.querySelector('.vg-forward'),seek=bar.querySelector('.vg-seek'),volume=bar.querySelector('.vg-volume input');
  bar.querySelector('.vg-volume').hidden=mobile;
  const error=document.createElement('p');error.className='vg-error';error.setAttribute('role','status');error.hidden=true;section.append(error);
  const wordsNow=()=>words[document.querySelector('#language-select')?.value]||words.en;
  function update(){const w=wordsNow();toggle.setAttribute('aria-label',w[v.paused?0:1]);toggle.querySelector('path').setAttribute('d',v.paused?'M8 4L20 12L8 20Z':'M6 4H10V20H6ZM14 4H18V20H14Z');start.hidden=!v.paused;start.setAttribute('aria-label',w[0]);back.setAttribute('aria-label',w[2]);forward.setAttribute('aria-label',w[3]);volume.setAttribute('aria-label',w[4]);seek.setAttribute('aria-label',w[5]);error.textContent=w[6];const ready=Number.isFinite(v.duration)&&v.duration>0;back.disabled=forward.disabled=seek.disabled=!ready;seek.value=ready?v.currentTime/v.duration*1000:0;bar.querySelector('.vg-time').textContent=time(v.currentTime)+' / '+time(v.duration);}
  async function playPause(){if(!v.paused){v.pause();return;}error.hidden=true;try{await v.play();}catch(e){if(e.name!=='AbortError')error.hidden=false;}update();}
  toggle.addEventListener('click',playPause);start.addEventListener('click',playPause);
  back.addEventListener('click',()=>{v.currentTime=Math.max(0,v.currentTime-10)});forward.addEventListener('click',()=>{v.currentTime=Math.min(v.duration,v.currentTime+10)});
  seek.addEventListener('input',()=>{if(Number.isFinite(v.duration))v.currentTime=Number(seek.value)/1000*v.duration;});volume.addEventListener('input',()=>{v.volume=Number(volume.value);v.muted=false;});
  v.addEventListener('play',()=>{document.querySelectorAll('audio,video').forEach(m=>{if(m!==v)m.pause()});});
  ['play','playing','pause','ended','loadedmetadata','durationchange','timeupdate','emptied'].forEach(e=>v.addEventListener(e,update));
  v.addEventListener('error',()=>{error.hidden=false;update()});document.addEventListener('guide-language-change',update);update();
 });
})();
