import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

function extractIdFromUrlOrId(input) {
  const match = input.match(/playlist\/([a-zA-Z0-9]+)|^([a-zA-Z0-9]{22,})$/);
  return match ? (match[1] || match[2]) : null;
}

function PlaylistCard({ meta, stats }) {
  const topArtists = stats.topArtists.slice(0, 5);
  const songsPerYear = [...stats.songsPerYear].sort((a, b) => a.year - b.year);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      marginBottom: 32,
      padding: 28,
      maxWidth: 700,
      margin: "32px auto"
    }}>
      <h2 style={{ marginBottom: 4, fontWeight: 700, fontSize: 26 }}>{meta.name}</h2>
      <div style={{ color: "#888", marginBottom: 8 }}>
        {meta.owner}
        {meta.owner !== "p434" && (
          <>
            <span style={{ color: "#e74c3c", marginLeft: 8, fontWeight: 700 }}>die playlist sucked</span>
            <br />
            <img src="https://c.tenor.com/FqBcxJasNdEAAAAd/tenor.gif" alt="sucked" style={{ width: 130, marginTop: 8, borderRadius: 8 }} />
          </>
        )}
      </div>
      <div style={{ color: "#aaa", marginBottom: 16 }}>{meta.description}</div>
      <div style={{ marginBottom: 8 }}><b>Tracks:</b> {meta.totalTracks}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 24 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Top 5 Artists</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={topArtists}
              layout="vertical"
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#333" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Songs pro Jahr</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={songsPerYear}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1DB954" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 32 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h4 style={{ fontWeight: 600 }}>Weitere Stats</h4>
          <ul style={{ listStyle: "none", padding: 0, color: "#444" }}>
            <li>⌀ Artists pro Song: <b>{stats.avgArtistsPerSong.toFixed(2)}</b></li>
            <li>Verschiedene Artists: <b>{stats.uniqueArtists}</b></li>
            <li>Verschiedene Alben: <b>{stats.uniqueAlbums}</b></li>
            <li>Erster Song: <b>{stats.firstSong?.name}</b> ({stats.firstSong?.added_at?.slice(0, 10)})</li>
            <li>Letzter Song: <b>{stats.lastSong?.name}</b> ({stats.lastSong?.added_at?.slice(0, 10)})</li>
            <li>Längster Song: <b>{stats.longestSong?.name}</b> ({(stats.longestSong?.duration_ms / 60000).toFixed(2)} min)</li>
            <li>Kürzester Song: <b>{stats.shortestSong?.name}</b> ({(stats.shortestSong?.duration_ms / 60000).toFixed(2)} min)</li>
          </ul>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h4 style={{ fontWeight: 600 }}>Top Artist pro Jahr</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", color: "#222", fontSize: 15 }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ padding: "4px 8px" }}>Jahr</th>
                <th style={{ padding: "4px 8px" }}>Artist</th>
                <th style={{ padding: "4px 8px" }}>Songs</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.topArtistPerYear).map(([year, v]) => (
                <tr key={year}>
                  <td style={{ padding: "4px 8px" }}>{year}</td>
                  <td style={{ padding: "4px 8px" }}>{v.name}</td>
                  <td style={{ padding: "4px 8px" }}>{v.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MergeCard({ stats }) {
  const topArtists = stats.topArtists.slice(0, 5);
  const songsPerYear = [...stats.songsPerYear].sort((a, b) => a.year - b.year);

  return (
    <div style={{
      background: "#fafafa",
      borderRadius: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      marginBottom: 32,
      padding: 28,
      maxWidth: 700,
      margin: "32px auto"
    }}>
      <h2 style={{ marginBottom: 4, fontWeight: 700, fontSize: 26, color: "#1DB954" }}>
        Kombinierte Playlist-Statistiken (Merge)
      </h2>
      <div style={{ marginBottom: 8, color: "#555" }}>
        Beide Playlists gemeinsam analysiert
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 24 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Top 5 Artists (gesamt)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={topArtists}
              layout="vertical"
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="#333" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Songs pro Jahr (gesamt)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={songsPerYear}
              margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1DB954" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 32 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h4 style={{ fontWeight: 600 }}>Weitere Stats (gesamt)</h4>
          <ul style={{ listStyle: "none", padding: 0, color: "#444" }}>
            <li>⌀ Artists pro Song: <b>{stats.avgArtistsPerSong.toFixed(2)}</b></li>
            <li>Verschiedene Artists: <b>{stats.uniqueArtists}</b></li>
            <li>Verschiedene Alben: <b>{stats.uniqueAlbums}</b></li>
            <li>Längster Song: <b>{stats.longestSong?.name}</b> ({(stats.longestSong?.duration_ms / 60000).toFixed(2)} min)</li>
            <li>Kürzester Song: <b>{stats.shortestSong?.name}</b> ({(stats.shortestSong?.duration_ms / 60000).toFixed(2)} min)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [playlistFields, setPlaylistFields] = useState([""]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [merge, setMerge] = useState(false);

  // Responsives, modernes Styling für die Seite
  React.useEffect(() => {
    document.body.style.background = "#f7f7f7";
    document.body.style.fontFamily = "'Inter', Arial, sans-serif";
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  // Buttons und Felder
  const handleFieldChange = (idx, val) => {
    const newFields = [...playlistFields];
    newFields[idx] = val;
    setPlaylistFields(newFields);
  };

  const handleAddField = () => {
    if (playlistFields.length < 2) setPlaylistFields([...playlistFields, ""]);
  };

  const handleRemoveField = (idx) => {
    if (playlistFields.length > 1) {
      setPlaylistFields(playlistFields.filter((_, i) => i !== idx));
    }
  };

  const ids = playlistFields
    .map(x => extractIdFromUrlOrId(x.trim()))
    .filter(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResults(null);
    if (!ids.length) {
      setError("Bitte mindestens eine gültige Playlist-ID oder URL eingeben!");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("ttps://playlist-stats-app.onrender.com/playlist-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistIds: ids, merge })
      });
      const data = await resp.json();
      setResults(data);
    } catch (err) {
      setError("Fehler beim Abrufen der Daten.");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{
        maxWidth: 800, margin: "0 auto", padding: "40px 16px 0 16px"
      }}>
        <h1 style={{
          fontWeight: 800, fontSize: 34, marginBottom: 4, color: "#222", letterSpacing: "-1px"
        }}>
          Spotify Playlist Analyse
        </h1>
        <div style={{ color: "#555", marginBottom: 28, fontSize: 17 }}>
          Gib hier deine Playlist ID ein. Du kannt auch mehrere analysieren oder mergen.
        </div>
        <form onSubmit={handleSubmit} style={{
          background: "#fff", padding: 24, borderRadius: 10,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 34,
          display: "flex", flexDirection: "column", gap: 16
        }}>
          {playlistFields.map((val, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
              <input
                type="text"
                style={{
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: 7,
                  padding: "10px 12px",
                  fontSize: 16,
                  background: "#fafafa",
                  color: "#222"
                }}
                placeholder="Playlist-ID oder -URL"
                value={val}
                onChange={e => handleFieldChange(idx, e.target.value)}
              />
              {playlistFields.length < 2 && idx === playlistFields.length - 1 && (
                <button type="button"
                  onClick={handleAddField}
                  style={{
                    background: "#1DB954", color: "#fff", border: "none",
                    borderRadius: "50%", width: 36, height: 36, fontSize: 22, fontWeight: 700, cursor: "pointer"
                  }}
                  title="Weitere Playlist hinzufügen"
                >+</button>
              )}
              {playlistFields.length > 1 && (
                <button type="button"
                  onClick={() => handleRemoveField(idx)}
                  style={{
                    background: "#eee", color: "#222", border: "none",
                    borderRadius: "50%", width: 36, height: 36, fontSize: 20, fontWeight: 700, cursor: "pointer"
                  }}
                  title="Dieses Feld entfernen"
                >−</button>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {playlistFields.length === 2 && (
              <button
                type="button"
                style={{
                  background: merge ? "#1DB954" : "#eee",
                  color: merge ? "#fff" : "#222",
                  border: "none",
                  borderRadius: 7,
                  padding: "12px 24px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer"
                }}
                onClick={() => setMerge(m => !m)}
                title="Beide Playlists kombinieren"
              >
                {merge ? "Mergen (aktiv)" : "Mergen"}
              </button>
            )}
            <button type="submit" disabled={loading} style={{
              background: "#222", color: "#fff", border: "none",
              borderRadius: 7, padding: "12px 32px", fontWeight: 700, fontSize: 18, cursor: "pointer"
            }}>
              {loading ? "Analysiere..." : "Analysieren"}
            </button>
          </div>
        </form>
        {error && <div style={{ color: "#e74c3c", marginTop: 12 }}>{error}</div>}
        {results && merge && results.merged && (
          <MergeCard stats={results.merged} />
        )}
        {results && !merge && results.perPlaylist?.map((p) =>
          <div key={p.playlistId}>
            {p.error
              ? <div style={{
                  background: "#ffd6d6", color: "#a33", borderRadius: 8, padding: 16, marginBottom: 32
                }}>
                  Fehler für Playlist {p.playlistId}: {JSON.stringify(p.error)}
                </div>
              : <PlaylistCard meta={p.meta} stats={p.stats} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;






