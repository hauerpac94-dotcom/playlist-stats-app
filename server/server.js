require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory cache (playlistId -> { ts, data }), TTL ms
const CACHE_TTL = 1000 * 60 * 5; // 5 min
const cache = new Map();

/* ---------- Spotify token (Client Credentials) ---------- */
let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  cachedToken = resp.data.access_token;
  tokenExpiresAt = Date.now() + (resp.data.expires_in - 60) * 1000;
  return cachedToken;
}

/* ---------- Helper: throttle promises in batches (simple) ---------- */
async function runInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const res = await Promise.all(batch.map(fn));
    results.push(...res);
    // optional small delay to be gentle with rate limits:
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

/* ---------- Paging: alle Tracks einer Playlist holen ---------- */
async function getAllPlaylistTracks(playlistId, token) {
  // cache key per playlist - cache the raw items to save requests
  const ck = `tracks:${playlistId}`;
  const cached = cache.get(ck);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  let items = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
  while (url) {
    const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    items = items.concat(resp.data.items);
    url = resp.data.next; // next page url or null
  }

  cache.set(ck, { ts: Date.now(), data: items });
  return items;
}

/* ---------- Statistiken berechnen (wie besprochen) ---------- */
function computeStatsFromTracks(items) {
  const artistCount = {};
  const yearArtistCount = {};
  const songsPerYear = {};
  let first = null, last = null;
  const artistSet = new Set();
  const albumSet = new Set();
  let totalArtistsPerSong = 0;
  let minDuration = Infinity, maxDuration = -Infinity;
  let minTrack = null, maxTrack = null;

  items.forEach(item => {
    if (!item || !item.track) return;
    const track = item.track;

    // artists
    track.artists.forEach(a => {
      artistCount[a.name] = (artistCount[a.name] || 0) + 1;
      artistSet.add(a.name);
    });

    if (track.album && track.album.name) albumSet.add(track.album.name);

    totalArtistsPerSong += track.artists.length;

    if (item.added_at) {
      const y = new Date(item.added_at).getFullYear();
      songsPerYear[y] = (songsPerYear[y] || 0) + 1;
      yearArtistCount[y] = yearArtistCount[y] || {};
      track.artists.forEach(a => {
        yearArtistCount[y][a.name] = (yearArtistCount[y][a.name] || 0) + 1;
      });
      if (!first || new Date(item.added_at) < new Date(first.added_at)) first = item;
      if (!last || new Date(item.added_at) > new Date(last.added_at)) last = item;
    }

    if (typeof track.duration_ms === 'number') {
      if (track.duration_ms < minDuration) { minDuration = track.duration_ms; minTrack = item; }
      if (track.duration_ms > maxDuration) { maxDuration = track.duration_ms; maxTrack = item; }
    }
  });

  const topArtists = Object.entries(artistCount).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}));
  const topArtistPerYear = {};
  Object.entries(yearArtistCount).forEach(([year, artists])=>{
    const arr = Object.entries(artists).sort((a,b)=>b[1]-a[1]);
    if (arr.length) topArtistPerYear[year] = { name: arr[0][0], count: arr[0][1] };
  });
  const songsPerYearArr = Object.entries(songsPerYear).map(([year,count])=>({year:Number(year), count})).sort((a,b)=>a.year-b.year);

  return {
    topArtists,
    topArtistPerYear,
    songsPerYear: songsPerYearArr,
    firstSong: first ? { added_at: first.added_at, name: first.track.name, artists: first.track.artists.map(a=>a.name) } : null,
    lastSong: last ? { added_at: last.added_at, name: last.track.name, artists: last.track.artists.map(a=>a.name) } : null,
    avgArtistsPerSong: items.length ? (totalArtistsPerSong / items.length) : 0,
    uniqueArtists: artistSet.size,
    uniqueAlbums: albumSet.size,
    longestSong: maxTrack ? { name: maxTrack.track.name, artists: maxTrack.track.artists.map(a=>a.name), duration_ms: maxTrack.track.duration_ms } : null,
    shortestSong: minTrack ? { name: minTrack.track.name, artists: minTrack.track.artists.map(a=>a.name), duration_ms: minTrack.track.duration_ms } : null
  };
}

/* ---------- Endpoint: POST /playlist-stats ---------- */
/*
  Request body:
  {
    "playlistIds": ["id1","id2",...],
    "merge": false    // if true -> return combined/merged stats across playlists as well
  }
*/
app.post('/playlist-stats', async (req, res) => {
  const { playlistIds, merge } = req.body || {};
  if (!Array.isArray(playlistIds) || playlistIds.length === 0) {
    return res.status(400).json({ error: 'playlistIds must be a non-empty array' });
  }

  const token = await getSpotifyToken();
  if (!token) return res.status(500).json({ error: 'Unable to get Spotify token' });

  try {
    // Process playlists in batches to be gentle on rate limits
    const results = [];
    // simple batch size; increase/reduce as needed
    const batchSize = 3;

    await runInBatches(playlistIds, batchSize, async (pid) => {
      try {
        // playlist meta
        const meta = await axios.get(`https://api.spotify.com/v1/playlists/${pid}`, { headers: { Authorization: `Bearer ${token}` } });
        // tracks (paging)
        const items = await getAllPlaylistTracks(pid, token);
        const stats = computeStatsFromTracks(items);
        results.push({ playlistId: pid, meta: {
          name: meta.data.name, description: meta.data.description, owner: meta.data.owner?.display_name || meta.data.owner?.id, totalTracks: meta.data.tracks?.total || items.length
        }, stats });
      } catch (err) {
        // log and return error per playlist
        console.error('Playlist fetch error', pid, err.response?.data || err.message);
        results.push({ playlistId: pid, error: err.response?.data || err.message });
      }
    });

    // Optionally compute merged stats across all successful playlists
    let merged = null;
    if (merge) {
      const successfulIds = results.filter(r=>r.stats).map(r=>r.playlistId);
      const mergedItems = [];
      for (const pid of successfulIds) {
        const its = await getAllPlaylistTracks(pid, token);
        mergedItems.push(...its);
      }
      merged = computeStatsFromTracks(mergedItems);
    }

    res.json({ perPlaylist: results, merged });
  } catch (err) {
    console.error('playlist-stats error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Server error fetching playlist stats' });
  }
});

/* ---------- small root route ---------- */
app.get('/', (_req, res) => res.send('API läuft!'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
