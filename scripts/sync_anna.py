"""Accumulate explicitly tagged Anna-series entries from the owner's public YouTube feed."""
import json, re, unicodedata, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path
CHANNEL='UCH7-Q5WBzE0G4BZdjtjOw-Q'
DEST=Path(__file__).resolve().parents[1]/'anna-videos.json'
NS={'a':'http://www.w3.org/2005/Atom','yt':'http://www.youtube.com/xml/schemas/2015','m':'http://search.yahoo.com/mrss/'}
def matches(text):
    text=unicodedata.normalize('NFKC',text)
    return bool(re.search(r'我[与與和跟]安娜|\b(?:me\s*(?:&|and)\s*anna|anna\s*(?:&|and)\s*me)\b',text,re.I))
def merge(old, xml):
    root=ET.fromstring(xml)
    channel_id=root.findtext('yt:channelId',namespaces=NS)
    author_uri=root.findtext('a:author/a:uri',namespaces=NS)
    if channel_id not in (CHANNEL,CHANNEL[2:]) or author_uri!='https://www.youtube.com/channel/'+CHANNEL: raise ValueError('Unexpected channel; previous list preserved')
    items={x['id']:x for x in old['items']}
    for e in root.findall('a:entry',NS):
        if e.findtext('yt:channelId',namespaces=NS)!=CHANNEL: raise ValueError('Unexpected entry channel; previous list preserved')
        vid=e.findtext('yt:videoId',default='',namespaces=NS)
        title=e.findtext('a:title',default='',namespaces=NS)
        description=e.findtext('m:group/m:description',default='',namespaces=NS)
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}',vid):continue
        if not matches(title+'\n'+description):continue
        published=e.findtext('a:published',default='',namespaces=NS)
        items[vid]={'id':vid,'title':title,'published':published[:10],'published_at':published,'updated_at':e.findtext('a:updated',namespaces=NS),'url':'https://www.youtube.com/watch?v='+vid,'thumb':'https://i.ytimg.com/vi/'+vid+'/hqdefault.jpg'}
    result=dict(old);result['items']=sorted(items.values(),key=lambda x:x['published_at'],reverse=True)
    return result
if __name__=='__main__':
    req=urllib.request.Request('https://www.youtube.com/feeds/videos.xml?channel_id='+CHANNEL,headers={'User-Agent':'LudwigJapanSeriesSync/1.0'})
    with urllib.request.urlopen(req,timeout=30) as response: xml=response.read(2_000_000)
    old=json.loads(DEST.read_text());new=merge(old,xml)
    if new!=old:
        tmp=DEST.with_suffix('.tmp');tmp.write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n');tmp.replace(DEST)
    print('Verified series entries:',len(new['items']))
