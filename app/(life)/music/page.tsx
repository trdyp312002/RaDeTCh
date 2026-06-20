"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Repeat,
  Shuffle,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Music2,
  ListMusic,
  Library,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Song {
  id: string;
  title: string;
  url: string;
  duration: number;
}
interface Artist {
  name: string;
  songCount: number;
  songs: Song[];
}
interface Language {
  id: string;
  label: string;
  color: string;
  flag: string;
  total: number;
  artists: Artist[];
}
interface MusicData {
  total: number;
  generatedAt: string;
  languages: Language[];
}
interface YTTrack {
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
}
interface YTPlaylist {
  id: string;
  title: string;
  count: number;
  thumbnailUrl: string;
  tracks: YTTrack[];
}
interface PlaylistsData {
  fetchedAt: string;
  total: number;
  playlists: YTPlaylist[];
}
type RepeatMode = "none" | "all" | "one";
type ViewMode = "library" | "playlists";
interface QueueItem {
  song: Song;
  artistName: string;
  color: string;
}

// ── Minimal YouTube IFrame types ───────────────────────────────────────────────
interface YTPlayer {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: object
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const GRAD: Record<string, string> = {
  pink: "from-pink-600 to-pink-900",
  orange: "from-orange-500 to-orange-800",
  red: "from-red-600 to-red-900",
  blue: "from-blue-600 to-blue-900",
  purple: "from-purple-600 to-purple-900",
  violet: "from-violet-600 to-violet-900",
};

// Assign a gradient color to a playlist by its title
const PLAYLIST_COLOR_MAP: Record<string, string> = {
  "ALL SONG":     "from-zinc-600 to-zinc-800",
  "JAPAN SONG":   "from-pink-600 to-pink-900",
  "THAI SONG":    "from-red-600 to-red-900",
  "ENGLISH SONG": "from-blue-600 to-blue-900",
  "DOWNBEAT":     "from-indigo-600 to-indigo-900",
  "UPBEAT":       "from-orange-500 to-orange-800",
  "Anime Movie":  "from-purple-600 to-purple-900",
  "Cover":        "from-teal-600 to-teal-900",
};

function playlistGrad(title: string): string {
  return PLAYLIST_COLOR_MAP[title] ?? "from-zinc-600 to-zinc-800";
}

function fmt(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function MusicLibrary() {
  const [viewMode, setViewMode] = useState<ViewMode>("library");

  // Library state
  const [data, setData] = useState<MusicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState("all");
  const [selectedArtist, setSelectedArtist] = useState<{
    artist: Artist;
    color: string;
  } | null>(null);

  // Playlists state
  const [playlistsData, setPlaylistsData] = useState<PlaylistsData | null>(null);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<YTPlaylist | null>(null);

  // Player UI state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentArtistName, setCurrentArtistName] = useState("");
  const [currentColor, setCurrentColor] = useState("blue");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs used inside YT callbacks to avoid stale closures
  const playerRef = useRef<YTPlayer | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const queueIdxRef = useRef(0);
  const repeatRef = useRef<RepeatMode>("none");
  const shuffleRef = useRef(false);
  const volumeRef = useRef(80);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doNextRef = useRef<() => void>(() => {});

  // Keep refs in sync with state
  repeatRef.current = repeatMode;
  shuffleRef.current = isShuffle;
  volumeRef.current = volume;

  // ── Load library data ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/music")
      .then((r) => r.json())
      .then((d: MusicData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Load YouTube Music playlists (lazy, only when switching to that view) ───
  useEffect(() => {
    if (viewMode !== "playlists" || playlistsData) return;
    setPlaylistsLoading(true);
    fetch("/api/music/playlists")
      .then((r) => r.json())
      .then((d: PlaylistsData) => {
        setPlaylistsData(d);
        setPlaylistsLoading(false);
      })
      .catch(() => setPlaylistsLoading(false));
  }, [viewMode, playlistsData]);

  // ── Core play function ───────────────────────────────────────────────────────
  const doPlay = useCallback((item: QueueItem) => {
    setCurrentSong(item.song);
    setCurrentArtistName(item.artistName);
    setCurrentColor(item.color);
    setCurrentTime(0);
    setIsBuffering(true);
    playerRef.current?.loadVideoById(item.song.id);
    playerRef.current?.setVolume(volumeRef.current);
  }, []);

  // ── Skip next ────────────────────────────────────────────────────────────────
  const doNext = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    let idx = queueIdxRef.current;
    if (repeatRef.current === "one") {
      // replay same index (do nothing to idx)
    } else if (shuffleRef.current) {
      idx = Math.floor(Math.random() * q.length);
    } else {
      idx++;
      if (idx >= q.length) {
        if (repeatRef.current === "all") idx = 0;
        else return;
      }
    }
    queueIdxRef.current = idx;
    doPlay(q[idx]);
  }, [doPlay]);

  // Keep doNextRef current (used inside YT ENDED handler)
  doNextRef.current = doNext;

  // ── Skip previous ────────────────────────────────────────────────────────────
  const doPrev = useCallback(() => {
    const q = queueRef.current;
    if (!q.length) return;
    const ct = playerRef.current?.getCurrentTime() ?? 0;
    if (ct > 3) {
      playerRef.current?.seekTo(0, true);
      setCurrentTime(0);
      return;
    }
    let idx = queueIdxRef.current - 1;
    if (idx < 0) idx = repeatRef.current === "all" ? q.length - 1 : 0;
    queueIdxRef.current = idx;
    doPlay(q[idx]);
  }, [doPlay]);

  // ── Load YouTube IFrame API (once) ───────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById("yt-script")) return;

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setDuration(playerRef.current?.getDuration() ?? 0);
              if (progressRef.current) clearInterval(progressRef.current);
              progressRef.current = setInterval(() => {
                setCurrentTime(playerRef.current?.getCurrentTime() ?? 0);
                setDuration(playerRef.current?.getDuration() ?? 0);
              }, 500);
            } else if (e.data === S.PAUSED) {
              setIsPlaying(false);
              setIsBuffering(false);
              if (progressRef.current) clearInterval(progressRef.current);
            } else if (e.data === S.ENDED) {
              setIsPlaying(false);
              if (progressRef.current) clearInterval(progressRef.current);
              doNextRef.current();
            } else if (e.data === S.BUFFERING) {
              setIsBuffering(true);
            }
          },
        },
      });
    };

    const script = document.createElement("script");
    script.id = "yt-script";
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // ── Toggle play / pause ──────────────────────────────────────────────────────
  const togglePlay = () => {
    if (!currentSong || !playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  // ── Start playing all songs of an artist ────────────────────────────────────
  const startArtist = (artist: Artist, color: string) => {
    if (!artist.songs.length) return;
    const q = artist.songs.map((s) => ({
      song: s,
      artistName: artist.name,
      color,
    }));
    queueRef.current = q;
    queueIdxRef.current = 0;
    doPlay(q[0]);
  };

  // ── Start from a specific song index (library) ──────────────────────────────
  const startFromSong = (artist: Artist, color: string, idx: number) => {
    const q = artist.songs.map((s) => ({
      song: s,
      artistName: artist.name,
      color,
    }));
    queueRef.current = q;
    queueIdxRef.current = idx;
    doPlay(q[idx]);
  };

  // ── Convert a YouTube playlist track to Song + build a queue ────────────────
  const ytTrackToSong = (t: YTTrack): Song => ({
    id: t.videoId,
    title: t.title,
    url: `https://music.youtube.com/watch?v=${t.videoId}`,
    duration: t.duration,
  });

  const startPlaylist = (playlist: YTPlaylist, fromIdx = 0) => {
    if (!playlist.tracks.length) return;
    const grad = playlistGrad(playlist.title);
    const q = playlist.tracks.map((t) => ({
      song: ytTrackToSong(t),
      artistName: t.artist,
      color: grad,
    }));
    queueRef.current = q;
    queueIdxRef.current = fromIdx;
    doPlay(q[fromIdx]);
  };

  // ── Progress bar click ───────────────────────────────────────────────────────
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * duration;
    playerRef.current.seekTo(t, true);
    setCurrentTime(t);
  };

  // ── Volume bar click ─────────────────────────────────────────────────────────
  const handleVolClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.round(
      Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100
    );
    setVolume(v);
    playerRef.current?.setVolume(v);
  };

  // ── Repeat cycle ─────────────────────────────────────────────────────────────
  const cycleRepeat = () =>
    setRepeatMode((m) =>
      m === "none" ? "all" : m === "all" ? "one" : "none"
    );

  // ── Filtered display data ────────────────────────────────────────────────────
  const langs =
    activeLang === "all"
      ? (data?.languages ?? [])
      : (data?.languages.filter((l) => l.id === activeLang) ?? []);

  const artistRows = langs.flatMap((l) =>
    l.artists.map((a) => ({
      artist: a,
      color: l.color,
      flag: l.flag,
      langId: l.id,
    }))
  );

  const nowGrad = GRAD[currentColor] ?? GRAD.blue;
  const selGrad = GRAD[selectedArtist?.color ?? "blue"] ?? GRAD.blue;
  const progressPct =
    duration > 0 ? `${(currentTime / duration) * 100}%` : "0%";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-white pb-28 overflow-x-hidden">
      {/* Hidden YouTube player (1×1 px – keeps Terms of Service happy) */}
      <div className="fixed -bottom-10 -right-10 overflow-hidden opacity-0 pointer-events-none w-px h-px">
        <div id="yt-player" />
      </div>

      {/* ── Main content ── */}
      <div className="px-6 py-8 md:px-10">
        {/* Header */}
        <div className="flex items-baseline gap-3 mb-6">
          <h1 className="text-4xl font-bold">Music Library</h1>
          {data && (
            <span className="text-zinc-500 text-sm">
              {data.total.toLocaleString()} songs
            </span>
          )}
        </div>

        {/* View-mode toggle: Library | Playlists */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setViewMode("library"); setSelectedPlaylist(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === "library"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <Library size={15} />
            Library
          </button>
          <button
            onClick={() => { setViewMode("playlists"); setSelectedArtist(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === "playlists"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            <ListMusic size={15} />
            Playlists
            {playlistsData && (
              <span className={`text-xs ${viewMode === "playlists" ? "text-zinc-600" : "text-zinc-500"}`}>
                {playlistsData.total}
              </span>
            )}
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════
            LIBRARY VIEW
        ════════════════════════════════════════════════════════════ */}
        {viewMode === "library" && (
          <>
            {/* Language tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => {
                  setActiveLang("all");
                  setSelectedArtist(null);
                }}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeLang === "all"
                    ? "bg-white text-black"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                All
              </button>
              {data?.languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setActiveLang(l.id);
                    setSelectedArtist(null);
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    activeLang === l.id
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  <span
                    className={`text-xs ${
                      activeLang === l.id ? "text-zinc-600" : "text-zinc-500"
                    }`}
                  >
                    {l.total}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
              </div>
            ) : selectedArtist ? (
              /* ── Artist songs view ── */
              <div>
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ChevronLeft size={16} /> Back to artists
                </button>

                <div className="flex items-center gap-6 mb-8">
                  <div
                    className={`w-28 h-28 rounded-xl bg-gradient-to-br ${selGrad} flex items-center justify-center shadow-2xl flex-shrink-0`}
                  >
                    <span className="text-5xl font-bold text-white/40 select-none">
                      {selectedArtist.artist.name[0]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">
                      {selectedArtist.artist.name}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      {selectedArtist.artist.songCount} songs
                    </p>
                    <button
                      onClick={() =>
                        startArtist(selectedArtist.artist, selectedArtist.color)
                      }
                      className="mt-3 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-5 py-2 rounded-full text-sm font-bold transition-colors"
                    >
                      <Play fill="currentColor" size={14} />
                      Play All
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {selectedArtist.artist.songs.map((s, i) => {
                    const active = currentSong?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() =>
                          startFromSong(selectedArtist.artist, selectedArtist.color, i)
                        }
                        className={`flex items-center gap-4 py-3 px-3 rounded-lg group cursor-pointer transition-colors ${
                          active ? "bg-zinc-800/40" : "hover:bg-zinc-800/40"
                        }`}
                      >
                        <span
                          className={`w-6 text-center text-sm tabular-nums group-hover:hidden ${
                            active ? "text-green-400" : "text-zinc-500"
                          }`}
                        >
                          {active && isPlaying ? "▶" : i + 1}
                        </span>
                        <Play
                          fill="currentColor"
                          size={13}
                          className="w-6 hidden group-hover:block text-white flex-shrink-0"
                        />
                        <p
                          className={`flex-1 text-sm truncate ${
                            active ? "text-green-400 font-medium" : "text-white"
                          }`}
                        >
                          {s.title}
                        </p>
                        <span className="text-xs text-zinc-500 tabular-nums flex-shrink-0">
                          {fmt(s.duration)}
                        </span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open in YouTube Music"
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity flex-shrink-0"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Artists grid ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {artistRows.map(({ artist, color, flag }) => (
                  <div
                    key={`${artist.name}-${flag}`}
                    onClick={() => setSelectedArtist({ artist, color })}
                    className="bg-zinc-900/50 hover:bg-zinc-800 p-4 rounded-xl group cursor-pointer transition-all duration-200"
                  >
                    <div
                      className={`aspect-square w-full rounded-md bg-gradient-to-br ${
                        GRAD[color] ?? GRAD.blue
                      } shadow-lg mb-4 relative flex items-center justify-center`}
                    >
                      <span className="text-4xl font-bold text-white/30 select-none">
                        {artist.name[0]}
                      </span>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-md transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startArtist(artist, color);
                          }}
                          className="bg-green-500 text-black p-3.5 rounded-full hover:scale-105 hover:bg-green-400 transition-all shadow-xl translate-y-2 group-hover:translate-y-0"
                        >
                          <Play fill="currentColor" size={20} className="ml-0.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate mb-0.5">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {artist.songCount} songs · {flag}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            PLAYLISTS VIEW
        ════════════════════════════════════════════════════════════ */}
        {viewMode === "playlists" && (
          <>
            {playlistsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
                <p className="text-zinc-600 text-sm">Loading playlists from YouTube Music…</p>
              </div>
            ) : !playlistsData || playlistsData.playlists.length === 0 ? (
              /* No data yet — guide user to run the script */
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center max-w-sm mx-auto">
                <ListMusic size={48} className="text-zinc-700" />
                <h2 className="text-lg font-semibold text-zinc-300">No playlist data yet</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Run the fetch script once to sync your YouTube Music playlists:
                </p>
                <code className="bg-zinc-800 text-green-400 px-4 py-2 rounded-lg text-xs text-left w-full">
                  cd Projects/youtube-music-organizer<br />
                  .venv\Scripts\python.exe fetch_for_radetch.py
                </code>
                <button
                  onClick={() => { setPlaylistsData(null); setPlaylistsLoading(true); fetch("/api/music/playlists").then(r => r.json()).then((d: PlaylistsData) => { setPlaylistsData(d); setPlaylistsLoading(false); }).catch(() => setPlaylistsLoading(false)); }}
                  className="text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : selectedPlaylist ? (
              /* ── Playlist songs view ── */
              <div>
                <button
                  onClick={() => setSelectedPlaylist(null)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm mb-6 transition-colors"
                >
                  <ChevronLeft size={16} /> Back to playlists
                </button>

                {/* Playlist header */}
                <div className="flex items-center gap-6 mb-8">
                  <div
                    className={`w-28 h-28 rounded-xl flex-shrink-0 shadow-2xl overflow-hidden bg-gradient-to-br ${playlistGrad(selectedPlaylist.title)}`}
                  >
                    {selectedPlaylist.thumbnailUrl ? (
                      <img
                        src={selectedPlaylist.thumbnailUrl}
                        alt={selectedPlaylist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic size={40} className="text-white/40" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedPlaylist.title}</h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      {selectedPlaylist.count} songs
                    </p>
                    <button
                      onClick={() => startPlaylist(selectedPlaylist)}
                      className="mt-3 flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-5 py-2 rounded-full text-sm font-bold transition-colors"
                    >
                      <Play fill="currentColor" size={14} />
                      Play All
                    </button>
                  </div>
                </div>

                {/* Track rows */}
                <div className="space-y-0.5">
                  {selectedPlaylist.tracks.map((t, i) => {
                    const active = currentSong?.id === t.videoId;
                    return (
                      <div
                        key={`${t.videoId}-${i}`}
                        onClick={() => startPlaylist(selectedPlaylist, i)}
                        className={`flex items-center gap-4 py-3 px-3 rounded-lg group cursor-pointer transition-colors ${
                          active ? "bg-zinc-800/40" : "hover:bg-zinc-800/40"
                        }`}
                      >
                        <span
                          className={`w-6 text-center text-sm tabular-nums group-hover:hidden ${
                            active ? "text-green-400" : "text-zinc-500"
                          }`}
                        >
                          {active && isPlaying ? "▶" : i + 1}
                        </span>
                        <Play
                          fill="currentColor"
                          size={13}
                          className="w-6 hidden group-hover:block text-white flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              active ? "text-green-400 font-medium" : "text-white"
                            }`}
                          >
                            {t.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {t.artist}
                            {t.album ? ` · ${t.album}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums flex-shrink-0">
                          {fmt(t.duration)}
                        </span>
                        <a
                          href={`https://music.youtube.com/watch?v=${t.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open in YouTube Music"
                          className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity flex-shrink-0"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Playlists grid ── */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                {playlistsData.playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylist(pl)}
                    className="bg-zinc-900/50 hover:bg-zinc-800 p-4 rounded-xl group cursor-pointer transition-all duration-200"
                  >
                    <div
                      className={`aspect-square w-full rounded-md shadow-lg mb-4 relative overflow-hidden bg-gradient-to-br ${playlistGrad(pl.title)}`}
                    >
                      {pl.thumbnailUrl ? (
                        <img
                          src={pl.thumbnailUrl}
                          alt={pl.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ListMusic size={32} className="text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 rounded-md transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startPlaylist(pl);
                          }}
                          className="bg-green-500 text-black p-3.5 rounded-full hover:scale-105 hover:bg-green-400 transition-all shadow-xl translate-y-2 group-hover:translate-y-0"
                        >
                          <Play fill="currentColor" size={20} className="ml-0.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate mb-0.5">
                      {pl.title}
                    </h3>
                    <p className="text-xs text-zinc-500">{pl.count} songs</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Fixed player bar ── */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex items-center px-4 md:px-6 z-50 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        {/* Now playing */}
        <div className="flex items-center w-1/3 min-w-[140px] gap-3">
          {currentSong ? (
            <>
              <div
                className={`w-[52px] h-[52px] rounded-md flex-shrink-0 bg-gradient-to-br ${nowGrad} flex items-center justify-center shadow-md`}
              >
                <Music2 size={18} className="text-white/50" />
              </div>
              <div className="overflow-hidden hidden sm:block min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate leading-tight">
                  {currentSong.title}
                </p>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {currentArtistName}
                </p>
              </div>
              <button className="ml-1 text-zinc-500 hover:text-white transition-colors hidden sm:block flex-shrink-0">
                <Heart size={16} />
              </button>
            </>
          ) : (
            <p className="text-zinc-600 text-sm hidden sm:block">
              Nothing playing
            </p>
          )}
        </div>

        {/* Controls + progress */}
        <div className="flex flex-col items-center flex-1 max-w-[480px] mx-auto gap-0">
          {/* Buttons row */}
          <div className="flex items-center gap-4 md:gap-5">
            <button
              onClick={() => setIsShuffle((s) => !s)}
              className={`hidden sm:block transition-colors ${
                isShuffle
                  ? "text-green-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Shuffle size={17} />
            </button>

            <button
              onClick={doPrev}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack fill="currentColor" size={19} />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentSong}
              className="bg-white text-black rounded-full p-2.5 hover:scale-105 transition-transform disabled:opacity-40"
            >
              {isBuffering ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isPlaying ? (
                <Pause fill="currentColor" size={20} />
              ) : (
                <Play fill="currentColor" size={20} className="ml-0.5" />
              )}
            </button>

            <button
              onClick={doNext}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward fill="currentColor" size={19} />
            </button>

            <button
              onClick={cycleRepeat}
              className={`hidden sm:block relative transition-colors ${
                repeatMode !== "none"
                  ? "text-green-400"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Repeat size={17} />
              {repeatMode === "one" && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold leading-none">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full mt-2 flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 tabular-nums w-8 text-right">
              {fmt(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-zinc-700 rounded-full group cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white group-hover:bg-green-500 rounded-full relative transition-colors"
                style={{ width: progressPct }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm" />
              </div>
            </div>
            <span className="text-[11px] text-zinc-500 tabular-nums w-8">
              {fmt(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end w-1/3 min-w-[120px] gap-2 text-zinc-400">
          <Volume2 size={17} />
          <div
            className="w-20 h-1 bg-zinc-700 rounded-full group cursor-pointer hidden md:block"
            onClick={handleVolClick}
          >
            <div
              className="h-full bg-white group-hover:bg-green-500 rounded-full relative transition-colors"
              style={{ width: `${volume}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm" />
            </div>
          </div>
          <span className="text-xs tabular-nums text-zinc-600 hidden md:block w-7 text-right">
            {volume}
          </span>
        </div>
      </div>
    </div>
  );
}
