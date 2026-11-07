"""Sync the owner's public Anna playlist without credentials or title guessing.

Run from the existing monitoring task. Failures preserve the last good snapshot.
This script does not deploy or modify YouTube.
"""
import concurrent.futures
import datetime as dt
import json
import re
import urllib.request
from pathlib import Path

CHANNEL = 'UCH7-Q5WBzE0G4BZdjtjOw-Q'
PLAYLIST = 'PLEBUD8yO9qkE'
SOURCE = 'https://www.youtube.com/playlist?list=' + PLAYLIST
DEST = Path(__file__).resolve().parents[1] / 'anna-videos.json'


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(8_000_000).decode('utf-8')


def embedded_json(html, name):
    match = re.search(r'(?:var\s+)?' + re.escape(name) + r'\s*=\s*', html)
    if not match:
        raise ValueError('YouTube page data unavailable; previous snapshot preserved')
    return json.JSONDecoder().raw_decode(html[match.end():])[0]


def objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from objects(child)


def playlist_ids(html):
    data = embedded_json(html, 'ytInitialData')
    title = data.get('metadata', {}).get('playlistMetadataRenderer', {}).get('title', '')
    if title != '我和安娜｜Me & Anna':
        raise ValueError('Unexpected playlist title; previous snapshot preserved')
    ids = []
    for obj in objects(data.get('contents', {})):
        endpoint = obj.get('reelWatchEndpoint', obj.get('watchEndpoint', {}))
        if endpoint.get('playlistId') == PLAYLIST:
            video_id = endpoint.get('videoId', '')
            if re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id) and video_id not in ids:
                ids.append(video_id)
    if not ids:
        raise ValueError('Empty or unsupported playlist; previous snapshot preserved')
    # Never silently replace a complete collection with only its first page.
    if any('continuationItemRenderer' in obj for obj in objects(data.get('contents', {}))):
        raise ValueError('Playlist requires pagination; browser verification needed')
    return ids


def public_item(video_id):
    data = embedded_json(fetch('https://www.youtube.com/watch?v=' + video_id), 'ytInitialPlayerResponse')
    status = data.get('playabilityStatus', {}).get('status')
    details = data.get('videoDetails', {})
    meta = data.get('microformat', {}).get('playerMicroformatRenderer', {})
    if status != 'OK':
        raise ValueError('Cannot verify public availability for ' + video_id)
    if details.get('videoId') != video_id or meta.get('externalChannelId') != CHANNEL:
        raise ValueError('Unexpected video owner for ' + video_id)
    if meta.get('isUnlisted') is not False or details.get('isPrivate') or details.get('isUpcoming'):
        raise ValueError('Video is not confirmed public: ' + video_id)
    published = meta.get('publishDate', '')
    instant = dt.datetime.fromisoformat(published)
    if instant.tzinfo is None or instant > dt.datetime.now(dt.timezone.utc):
        raise ValueError('Missing or future publish time for ' + video_id)
    return {'id': video_id, 'title': details['title'], 'published': instant.astimezone(dt.timezone(dt.timedelta(hours=9))).date().isoformat(),
            'published_at': instant.astimezone(dt.timezone.utc).isoformat(),
            'url': 'https://www.youtube.com/watch?v=' + video_id,
            'thumb': 'https://i.ytimg.com/vi/' + video_id + '/hqdefault.jpg',
            'series_source': SOURCE}


def main():
    ids = playlist_ids(fetch(SOURCE))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        verified = list(pool.map(public_item, ids))
    old = json.loads(DEST.read_text())
    # Preserve older verified entries if the public playlist happens to omit them.
    items = {item['id']: item for item in old['items']}
    items.update({item['id']: item for item in verified})
    new = dict(old, items=sorted(items.values(), key=lambda item: item['published_at'], reverse=True),
               fetched_at=dt.datetime.now(dt.timezone.utc).isoformat(), source=SOURCE,
               sync_method='public_playlist_and_public_watch_pages',
               public_playlist_verified_count=len(verified), complete_series_verified=True,
               automatic_updates_enabled=False)
    if new['items'] == old['items'] and old.get('sync_method') == new['sync_method']:
        print('No new or changed public series videos; verified', len(verified))
        return
    temp = DEST.with_suffix('.tmp')
    temp.write_text(json.dumps(new, ensure_ascii=False, indent=2) + '\n')
    temp.replace(DEST)
    print('Verified public playlist:', len(verified), 'Website entries:', len(new['items']))
    print('Added:', ', '.join(sorted(set(items) - {item['id'] for item in old['items']})))


if __name__ == '__main__':
    main()
