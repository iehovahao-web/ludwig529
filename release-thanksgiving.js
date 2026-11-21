(() => {
const copy = {
  "zh": [
    "感恩節專輯 · 24 首",
    "四個篇章，從歸途、相聚，到為彼此留一個位置，再到散席後的餘溫。鄉村、爵士與藍調串起 24 首歌，唱出家的方向、餐桌上的歡迎，以及如家人般相伴的人。",
    "前往收聽",
    "美國站連結；可播放內容依所在地區及訂閱方案而異。"
  ],
  "en": [
    "Thanksgiving album · 24 tracks",
    "Four chapters follow the journey home, a welcoming table, a place for one another, and the warmth that remains. Across 24 songs, country, jazz and blues celebrate homecoming, chosen family and belonging.",
    "Listen on",
    "US store links. Availability varies by region and subscription."
  ],
  "ja": [
    "感謝祭のアルバム · 全24曲",
    "帰り道、迎えてくれる食卓、互いのために空けておく席、そして集いのあとに残るぬくもり。4つの章、全24曲をカントリー、ジャズ、ブルースでつなぎ、家族のように寄り添う人たちとの居場所を描きます。",
    "聴く",
    "米国ストアへのリンクです。再生できる楽曲は地域や契約プランによって異なります。"
  ],
  "ko": [
    "추수감사절 앨범 · 24곡",
    "집으로 향하는 길, 반겨 주는 식탁, 서로를 위해 남겨 둔 자리, 그리고 모임 뒤에도 남는 온기. 네 개의 장에 담긴 24곡이 컨트리, 재즈, 블루스로 가족처럼 함께하는 사람들과 소속감을 노래합니다.",
    "음악 듣기",
    "미국 스토어 링크입니다. 재생 가능 여부는 지역과 구독 요금제에 따라 다릅니다."
  ],
  "es": [
    "Álbum de Acción de Gracias · 24 canciones",
    "Cuatro capítulos recorren el camino a casa, una mesa que nos recibe, un lugar para cada persona y la calidez que perdura. En 24 canciones, el country, el jazz y el blues celebran el reencuentro y la familia que elegimos.",
    "Escuchar en",
    "Enlaces a las tiendas de EE. UU. La disponibilidad depende de la región y la suscripción."
  ],
  "de": [
    "Thanksgiving-Album · 24 Titel",
    "Vier Kapitel erzählen vom Heimweg, einem einladenden Tisch, einem Platz füreinander und der Wärme, die bleibt. In 24 Songs verbinden sich Country, Jazz und Blues zu Geschichten über Heimkehr, Wahlfamilie und Zugehörigkeit.",
    "Anhören auf",
    "Links zu den US-Stores. Die Verfügbarkeit hängt von Region und Abonnement ab."
  ],
  "it": [
    "Album del Ringraziamento · 24 brani",
    "Quattro capitoli raccontano il ritorno a casa, una tavola accogliente, un posto per ciascuno e il calore che rimane. In 24 brani, country, jazz e blues celebrano il ritrovarsi e la famiglia che scegliamo.",
    "Ascolta su",
    "Link agli store statunitensi. La disponibilità varia in base alla regione e all’abbonamento."
  ]
};
function apply(){
 const c=copy[document.querySelector('#language-select').value]||copy.en;
 const root=document.querySelector('#theres-room-for-you');
 ['kind','description','listen','availability'].forEach((key,i)=>{root.querySelector('[data-release="'+key+'"]').textContent=c[i];});
}
document.addEventListener('guide-language-change',apply);apply();
})();
