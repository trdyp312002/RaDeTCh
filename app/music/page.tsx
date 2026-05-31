"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import playlistData from "@/data/music-playlist.json";

type Song = { title: string; id: string; duration: number; url: string };
type Artist = { name: string; songCount: number; songs: Song[] };
type Language = { id: string; label: string; flag: string; color: string; total: number; artists: Artist[] };
type QueueItem = Song & { artistName: string; lang: Language };

const LANG_COLORS: Record<string, string> = {
  japanese: "bg-pink-50 text-pink-700 border-pink-100",
  korean:   "bg-orange-50 text-orange-700 border-orange-100",
  thai:     "bg-red-50 text-red-700 border-red-100",
  english:  "bg-blue-50 text-blue-700 border-blue-100",
};

const LANG_ACTIVE: Record<string, string> = {
  japanese: "bg-pink-600 text-white border-pink-600",
  korean:   "bg-orange-500 text-white border-orange-500",
  thai:     "bg-red-600 text-white border-red-600",
  english:  "bg-blue-600 text-white border-blue-600",
};


function formatDuration(s: number) {
  if (!s) return "0:00";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function formatTime(s: number) {
  const n = Math.floor(s);
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

// ---- Song Row ----
function SongRow({
  song,
  isActive,
  isPlaying,
  onPlay,
}: {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer select-none transition-colors group ${
        isActive ? "bg-gray-50" : "hover:bg-gray-50"
      }`}
      onClick={onPlay}
    >
      <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
        {isActive && isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : isActive ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
      <span className={`text-sm truncate flex-1 transition-colors ${isActive ? "text-gray-900 font-medium" : "text-gray-600 group-hover:text-gray-900"}`}>
        {song.title}
      </span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-gray-300 font-mono">{formatDuration(song.duration)}</span>
        <a
          href={song.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          aria-label="Open in YouTube Music"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ---- Artist Card ----
function ArtistCard({
  artist,
  langId,
  activeSongId,
  isPlaying,
  onPlay,
}: {
  artist: Artist;
  langId: string;
  activeSongId: string | null;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasActive = artist.songs.some((s) => s.id === activeSongId);
  const colorClass = LANG_COLORS[langId] || "bg-gray-50 text-gray-700 border-gray-100";

  return (
    <div className={`rounded-2xl border overflow-hidden bg-white transition-all ${hasActive ? "border-gray-200" : "border-gray-100 hover:border-gray-200"}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${colorClass}`}>
            {artist.songCount}
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate">{artist.name}</span>
          {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />}
        </div>
        <svg
          width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          className={`flex-shrink-0 text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-50 divide-y divide-gray-50">
          {artist.songs.map((song) => (
            <SongRow
              key={song.id}
              song={song}
              isActive={song.id === activeSongId}
              isPlaying={isPlaying}
              onPlay={() => onPlay(song)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Music Player ----
function MusicPlayer({
  queue,
  currentIndex,
  onIndexChange,
  onClose,
  onPlayingChange,
}: {
  queue: QueueItem[];
  currentIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onPlayingChange: (playing: boolean) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const currentIndexRef = useRef(currentIndex);
  const queueRef = useRef(queue);
  const onIndexChangeRef = useRef(onIndexChange);
  const onPlayingChangeRef = useRef(onPlayingChange);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { onIndexChangeRef.current = onIndexChange; }, [onIndexChange]);
  useEffect(() => { onPlayingChangeRef.current = onPlayingChange; }, [onPlayingChange]);

  const song = queue[currentIndex];

  // Simulated progress ticker + auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 0.5;
        const dur = queueRef.current[currentIndexRef.current]?.duration ?? 0;
        if (dur > 0 && next >= dur) {
          const nextIdx = currentIndexRef.current + 1;
          if (nextIdx < queueRef.current.length) onIndexChangeRef.current(nextIdx);
          return 0;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Reset elapsed + notify parent when song changes
  const prevId = useRef(song?.id);
  useEffect(() => {
    if (!song || song.id === prevId.current) return;
    prevId.current = song.id;
    setElapsed(0);
    setIsPlaying(true);
    onPlayingChangeRef.current(true);
  }, [song?.id]);

  function cmd(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube.com"
    );
  }

  function togglePlay() {
    const next = !isPlaying;
    setIsPlaying(next);
    onPlayingChangeRef.current(next);
    cmd(next ? "playVideo" : "pauseVideo");
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    cmd(next ? "mute" : "unMute");
    if (!next) cmd("setVolume", [100]);
  }

  function handleIframeLoad() {
    // Try early, retry if player wasn't ready yet
    const unmute = () => { cmd("unMute"); cmd("setVolume", [100]); };
    setTimeout(unmute, 200);
    setTimeout(unmute, 800);
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const dur = song.duration;
    if (!dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seconds = ratio * dur;
    setElapsed(seconds);
    cmd("seekTo", [seconds, true]);
  }

  if (!song) return null;

  const dur = song.duration;
  const progress = dur > 0 ? Math.min(1, elapsed / dur) : 0;
  // mute=1 guarantees autoplay works; we unmute programmatically via onLoad
  const embedSrc = `https://www.youtube.com/embed/${song.id}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1`;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#212121] text-white shadow-2xl border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Hidden iframe — key forces remount on song change */}
      <iframe
        key={song.id}
        ref={iframeRef}
        src={embedSrc}
        allow="autoplay; encrypted-media"
        title="music player"
        onLoad={handleIframeLoad}
        style={{ position: "fixed", top: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />

      {/* Seekbar */}
      <div className="h-1 bg-gray-700 cursor-pointer group" onClick={seekTo}>
        <div
          className="h-full bg-gray-400 group-hover:bg-red-500 transition-colors"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="h-16 flex items-center px-4 gap-4">
        {/* Song info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs">
          <img
            src={`https://img.youtube.com/vi/${song.id}/mqdefault.jpg`}
            alt=""
            className="hidden sm:block w-11 h-8 object-cover rounded flex-shrink-0 bg-gray-700"
          />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate leading-tight">{song.title}</p>
            <p className="text-[11px] text-gray-400 truncate leading-tight">{song.artistName}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5 flex-shrink-0">
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style={{ paddingLeft: 2 }}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          <button
            onClick={() => onIndexChange(Math.min(queue.length - 1, currentIndex + 1))}
            disabled={currentIndex === queue.length - 1}
            className="text-gray-400 hover:text-white disabled:opacity-25 transition-colors"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
          </button>
        </div>

        {/* Time + volume + close */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <span className="text-[11px] text-gray-500 font-mono tabular-nums hidden sm:block">
            {formatTime(elapsed)} / {formatTime(dur)}
          </span>
          <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors" title={muted ? "Unmute" : "Mute"}>
            {muted ? (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 19l2 2L21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            )}
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Page ----
export default function MusicPage() {
  const [data, setData] = useState<{ total: number; generatedAt: string; languages: Language[] }>(playlistData as any);
  
  useEffect(() => {
    fetch('/api/music?t=' + Date.now())
      .then(r => r.json())
      .then(d => { if(d.languages) setData(d) });
  }, []);

  const [activeLang, setActiveLang] = useState("japanese");
  const [search, setSearch] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentLang = data.languages.find((l) => l.id === activeLang) || data.languages[0];
  const activeSongId = queue[currentIndex]?.id ?? null;

  function buildQueue(lang: Language) {
    if (!lang) return [];
    return lang.artists.flatMap((a) => a.songs.map((s) => ({ ...s, artistName: a.name, lang })));
  }

  const allSongsWithMeta = useMemo(() => {
    if (!data.languages) return [];
    return data.languages.flatMap((l) => 
      l.artists.flatMap((a) => a.songs.map((s) => ({ ...s, artistName: a.name, lang: l })))
    );
  }, [data]);

  function handlePlay(song: Song) {
    if (!currentLang) return;
    const q = buildQueue(currentLang);
    const idx = q.findIndex((s) => s.id === song.id);
    flushSync(() => {
      setQueue(q);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setIsPlaying(true);
    });
  }

  function handleRandom() {
    if (!allSongsWithMeta.length) return;
    const item = allSongsWithMeta[Math.floor(Math.random() * allSongsWithMeta.length)];
    const q = buildQueue(item.lang);
    const idx = q.findIndex((s) => s.id === item.id);
    flushSync(() => {
      setQueue(q);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setIsPlaying(true);
    });
  }

  const filteredArtists = useMemo(() => {
    if (!currentLang) return [];
    if (!search.trim()) return currentLang.artists;
    const q = search.toLowerCase();
    return currentLang.artists
      .map((a) => ({
        ...a,
        songs: a.songs.filter((s) => s.title.toLowerCase().includes(q)),
      }))
      .filter((a) => a.name.toLowerCase().includes(q) || a.songs.length > 0)
      .map((a) => ({ ...a, songCount: a.songs.length || a.songCount }));
  }, [currentLang, search]);

  return (
    <div className={`min-h-screen bg-white ${currentIndex >= 0 ? "pb-24 sm:pb-20" : ""}`}>
      {/* Header */}
      <div className="pt-10 pb-8 px-6 max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">Playlist</p>
        <div className="flex items-end justify-between gap-4 mb-3">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Music</h1>
          <button
            onClick={handleRandom}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all mb-1"
          >
            <span>🎲</span>
            <span>สุ่มเพลง</span>
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-1">{data?.total || 0} tracks</p>
      </div>

      {/* Language Tabs */}
      <div className="max-w-4xl mx-auto px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data?.languages?.map((lang) => {
            const active = activeLang === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => { setActiveLang(lang.id); setSearch(""); }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  active
                    ? LANG_ACTIVE[lang.id] || "bg-gray-900 text-white border-gray-900"
                    : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 bg-white"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                <span className={`text-[10px] ${active ? "opacity-70" : "text-gray-400"}`}>{lang.total}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-4xl mx-auto px-6 mb-6">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`ค้นหาศิลปินหรือเพลงใน ${currentLang.label}...`}
            className="w-full border border-gray-200 rounded-2xl px-5 py-3 pr-12 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 text-sm bg-white"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-6 mb-4">
        <p className="text-sm text-gray-400">
          <span className="text-gray-900 font-semibold">{filteredArtists.length}</span> ศิลปิน ·{" "}
          <span className="text-gray-900 font-semibold">{filteredArtists.reduce((n, a) => n + a.songs.length, 0)}</span>{" "}
          เพลง
        </p>
      </div>

      {/* Artist list */}
      <div className="max-w-4xl mx-auto px-6 pb-8 space-y-2">
        {filteredArtists.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎵</p>
            <p className="text-gray-500 font-medium">ไม่พบผลลัพธ์</p>
          </div>
        ) : (
          filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.name}
              artist={artist}
              langId={activeLang}
              activeSongId={activeSongId}
              isPlaying={isPlaying}
              onPlay={handlePlay}
            />
          ))
        )}
      </div>

      {/* Player */}
      {currentIndex >= 0 && queue.length > 0 && (
        <MusicPlayer
          queue={queue}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onClose={() => { setCurrentIndex(-1); setQueue([]); setIsPlaying(false); }}
          onPlayingChange={setIsPlaying}
        />
      )}
    </div>
  );
}
