(async()=>{
'use strict';
const audio=document.getElementById('osaka-audio');
const controls=document.getElementById('osaka-controls');
if(!audio||!controls)return;
let tracks;
try{const response=await fetch('audio-tracks.json?v=20261013-kansai-24');if(!response.ok)throw new Error('Track list unavailable');tracks=await response.json();if(!Array.isArray(tracks)||tracks.length!==12)throw new Error('Invalid track list')}catch(_){return}
const picker=document.getElementById('osaka-track-select'),cover=document.getElementById('osaka-cover');
let trackIndex=0,generation=0,hasStarted=false;
function showTrackCover(){const track=tracks[trackIndex];cover.src=track.cover;cover.alt=track.title+' · Ludwig Cheung';}

const get=id=>document.getElementById('osaka-'+id);
const toggle=get('toggle'),seek=get('seek'),volume=get('volume');
const current=get('current'),duration=get('duration'),error=get('error');
const format=n=>{n=Number.isFinite(n)?Math.max(0,n):0;return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')};
let confirmedPlaying=false;
function state(){
 const playing=confirmedPlaying&&!audio.paused&&!audio.ended&&!audio.error;
 for(const kind of ['icon','label']){
  controls.querySelector('[data-play-'+kind+']').toggleAttribute('hidden',playing);
  controls.querySelector('[data-pause-'+kind+']').toggleAttribute('hidden',!playing);
 }
}
function progress(){
 const valid=Number.isFinite(audio.duration)&&audio.duration>0;
 seek.disabled=!valid;get('back').disabled=trackIndex===0;get('forward').disabled=trackIndex===tracks.length-1;
 current.textContent=format(audio.currentTime);
 if(valid){duration.textContent=format(audio.duration);seek.value=String(Math.round(audio.currentTime/audio.duration*1000));seek.style.setProperty('--fill',(audio.currentTime/audio.duration*100)+'%');seek.setAttribute('aria-valuetext',format(audio.currentTime)+' / '+format(audio.duration));}
}
toggle.addEventListener('click',()=>{
 if(audio.paused||audio.ended){error.hidden=true;playCurrent()}
 else audio.pause();
});
seek.addEventListener('input',()=>{
 if(Number.isFinite(audio.duration)&&audio.duration>0){audio.currentTime=Number(seek.value)/1000*audio.duration;progress()}
});
function playCurrent(){
 const currentGeneration=generation;
 audio.play().catch(()=>{if(currentGeneration!==generation)return;confirmedPlaying=false;error.hidden=false;state()});
}
function loadTrack(index,shouldPlay=false){
 if(index<0||index>=tracks.length)return;
 generation++;audio.pause();confirmedPlaying=false;trackIndex=index;
 const track=tracks[index];picker.value=String(index);
 if(hasStarted)showTrackCover();
 document.getElementById('osaka-title').textContent=track.title;
 error.hidden=true;seek.disabled=true;seek.value='0';seek.style.setProperty('--fill','0%');seek.setAttribute('aria-valuetext','0:00');current.textContent='0:00';duration.textContent=format(track.duration);
 audio.src=track.src;audio.load();state();
 get('back').disabled=index===0;get('forward').disabled=index===tracks.length-1;
 if(shouldPlay)playCurrent();
}
document.addEventListener('osaka-select-track',event=>{loadTrack(event.detail.album?0:event.detail.index,true)});
document.addEventListener('guide-language-change',()=>{if(hasStarted)showTrackCover()});
picker.addEventListener('change',()=>loadTrack(Number(picker.value),!audio.paused&&!audio.ended));
get('back').addEventListener('click',()=>loadTrack(trackIndex-1,!audio.paused&&!audio.ended));
get('forward').addEventListener('click',()=>loadTrack(trackIndex+1,!audio.paused&&!audio.ended));
audio.addEventListener('ended',()=>{if(trackIndex+1<tracks.length)loadTrack(trackIndex+1,true)});
const airplay=get('airplay');
if(typeof audio.webkitShowPlaybackTargetPicker==='function'){
 audio.addEventListener('webkitplaybacktargetavailabilitychanged',event=>{airplay.hidden=event.availability!=='available'});
 airplay.addEventListener('click',()=>{try{audio.webkitShowPlaybackTargetPicker()}catch(_){airplay.hidden=true}});
}
// iOS uses hardware/system volume. Detect unsupported setters elsewhere too.
let canSetVolume=!(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
if(canSetVolume){const previous=audio.volume;try{audio.volume=.5;canSetVolume=Math.abs(audio.volume-.5)<.01;audio.volume=previous}catch(_){canSetVolume=false}}
get('volume-group').hidden=!canSetVolume;
get('device-volume').hidden=canSetVolume;
if(canSetVolume){
 volume.value=String(audio.volume);volume.style.setProperty('--fill',(audio.volume*100)+'%');
 volume.addEventListener('input',()=>{audio.volume=Number(volume.value);audio.muted=false});
 audio.addEventListener('volumechange',()=>{volume.value=String(audio.muted?0:audio.volume);volume.style.setProperty('--fill',(Number(volume.value)*100)+'%')});
}
for(const event of ['loadedmetadata','durationchange','timeupdate','seeked','ended'])audio.addEventListener(event,progress);
audio.addEventListener('playing',()=>{hasStarted=true;showTrackCover();confirmedPlaying=true;error.hidden=true;state()});
for(const event of ['play','pause','ended','waiting','loadstart','emptied','abort'])audio.addEventListener(event,()=>{confirmedPlaying=false;state()});
audio.addEventListener('error',()=>{confirmedPlaying=false;error.hidden=false;seek.disabled=true;get('back').disabled=true;get('forward').disabled=true;state()});
state();progress();
loadTrack(0,false);
// Keep native controls available if scripting cannot initialize.
controls.hidden=false;audio.controls=false;audio.hidden=true;
})();
