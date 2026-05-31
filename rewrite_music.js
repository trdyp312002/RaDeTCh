const fs = require('fs');
let code = fs.readFileSync('app/music/page.tsx', 'utf-8');

// 1. Remove static data constants
code = code.replace(/const data = playlistData as \{[^\}]+\};\n/, '');
code = code.replace(/function buildQueue\(lang: Language\) \{[\s\S]*?\}\n\n/, '');
code = code.replace(/const allSongsWithMeta = data\.languages\.flatMap\([\s\S]*?\);\n/, '');

// 2. Change MusicPage to fetch data
const newPageCode = 
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
    return lang.artists.flatMap((a) => a.songs.map((s) => ({ ...s, artistName: a.name })));
  }

  const allSongsWithMeta = useMemo(() => {
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
;

code = code.replace(/export default function MusicPage\(\) \{[\s\S]*?const filteredArtists = useMemo\(\(\) => \{[\s\S]*?\}, \[currentLang, search\]\);/, newPageCode.trim());

// 3. Fix references to data.total and data.languages in JSX
code = code.replace(/data\.languages/g, '(data?.languages || [])');
code = code.replace(/\{data\.total\}/g, '{data?.total || 0}');

fs.writeFileSync('app/music/page.tsx', code);
