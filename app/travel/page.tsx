"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Status = "not-visited" | "planned" | "visited";
type Category = "toyama" | "japan" | "world";

type Spot = {
  id: string;
  name: string;
  nameJP: string;
  region: string;
  desc: string;
  image: string;
  tags: string[];
  status: Status;
  visitedDate: string | null;
  note: string;
};

type SpotsData = { toyama: Spot[]; japan: Spot[]; world: Spot[] };

type Recommendation = {
  spot: Spot;
  category: Category;
  weekKey: string;
  fridayStr: string;
  fridayDay: number;
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  "not-visited": { label: "ยังไม่ได้ไป", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
  planned: { label: "วางแผนแล้ว", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  visited: { label: "ไปมาแล้ว", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const CAT_CONFIG: Record<Category, { label: string; badgeClass: string }> = {
  toyama: { label: "Toyama", badgeClass: "bg-blue-50 text-blue-600" },
  japan: { label: "Japan", badgeClass: "bg-rose-50 text-rose-600" },
  world: { label: "World", badgeClass: "bg-violet-50 text-violet-600" },
};

const ALL_STATUSES: Status[] = ["not-visited", "planned", "visited"];

export default function TravelPage() {
  const [spotsData, setSpotsData] = useState<SpotsData | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [filterCat, setFilterCat] = useState<"all" | Category>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [spotsRes, recRes] = await Promise.all([
      fetch("/api/travel/spots"),
      fetch("/api/travel/recommendation"),
    ]);
    setSpotsData(await spotsRes.json());
    setRec(await recRes.json());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    const visitedDate = status === "visited" ? new Date().toISOString().split("T")[0] : null;
    await fetch(`/api/travel/spots/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, visitedDate }),
    });
    await fetchAll();
    setUpdating(null);
  }

  const allSpots: (Spot & { category: Category })[] = spotsData
    ? [
        ...spotsData.toyama.map((s) => ({ ...s, category: "toyama" as Category })),
        ...spotsData.japan.map((s) => ({ ...s, category: "japan" as Category })),
        ...(spotsData.world || []).map((s) => ({ ...s, category: "world" as Category })),
      ]
    : [];

  const filtered = allSpots.filter((s) => {
    const matchCat = filterCat === "all" || s.category === filterCat;
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchCat && matchStatus;
  });

  const counts = {
    all: allSpots.length,
    toyama: allSpots.filter((s) => s.category === "toyama").length,
    japan: allSpots.filter((s) => s.category === "japan").length,
    world: allSpots.filter((s) => s.category === "world").length,
    "not-visited": allSpots.filter((s) => s.status === "not-visited").length,
    planned: allSpots.filter((s) => s.status === "planned").length,
    visited: allSpots.filter((s) => s.status === "visited").length,
  };

  return (
    <div className="min-h-screen bg-white pt-10 pb-24 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-5">Weekly Pick</p>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
            Travel
          </h1>
          <p className="text-gray-400 text-sm leading-7 max-w-xl">
            ระบบแนะนำสถานที่ท่องเที่ยวอัตโนมัติ — ทุกวันศุกร์ หลังวันที่ 27 แนะนำทั่วญี่ปุ่น, สัปดาห์อื่นแนะนำ Toyama
          </p>
        </div>

        <div className="h-px bg-gray-100 mb-16" />

        {/* This week's recommendation */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400">This Week&apos;s Pick</p>
            {rec && (
              <span className="text-[10px] text-gray-300 font-mono">{rec.weekKey} · {rec.fridayStr}</span>
            )}
          </div>

          {rec ? (
            <div className={`rounded-2xl border-2 overflow-hidden ${rec.category === "toyama" ? "border-blue-100" : rec.category === "world" ? "border-violet-100" : "border-rose-100"}`}>
              {rec.spot.image && (
                <div className="relative h-52 w-full overflow-hidden">
                  <Image
                    src={rec.spot.image}
                    alt={rec.spot.name}
                    fill
                    unoptimized
                    sizes="100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full ${CAT_CONFIG[rec.category].badgeClass}`}>
                      {CAT_CONFIG[rec.category].label}
                    </span>
                  </div>
                </div>
              )}
              {!rec.spot.image && (
                <div className={`px-8 py-3 flex items-center gap-3 ${rec.category === "toyama" ? "bg-blue-50" : rec.category === "world" ? "bg-violet-50" : "bg-rose-50"}`}>
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${CAT_CONFIG[rec.category].badgeClass}`}>
                    {CAT_CONFIG[rec.category].label}
                  </span>
                </div>
              )}
              <div className="px-8 py-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{rec.spot.name}</h2>
                    <p className="text-gray-400 text-sm mb-1 font-mono">{rec.spot.nameJP}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{rec.spot.region}</p>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-xl">{rec.spot.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {rec.spot.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Status</p>
                    <div className="flex flex-col gap-2">
                      {ALL_STATUSES.map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        const active = rec.spot.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(rec.spot.id, s)}
                            disabled={updating === rec.spot.id}
                            className={`text-xs px-4 py-2 rounded-xl border transition-all ${
                              active
                                ? `${cfg.bg} ${cfg.color} ${cfg.border} font-semibold`
                                : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-700"
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-52 rounded-2xl border border-gray-100 animate-pulse bg-gray-50" />
          )}
        </section>

        <div className="h-px bg-gray-100 mb-16" />

        {/* Stats */}
        <section className="mb-10">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "ยังไม่ได้ไป", value: counts["not-visited"], color: "text-gray-700" },
              { label: "วางแผนแล้ว", value: counts.planned, color: "text-indigo-600" },
              { label: "ไปมาแล้ว", value: counts.visited, color: "text-emerald-600" },
            ].map((s) => (
              <div key={s.label} className="border border-gray-100 rounded-2xl p-5 text-center">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="mb-8 flex flex-wrap gap-3">
          <div className="flex border border-gray-100 rounded-xl overflow-hidden text-[10px] uppercase tracking-widest">
            {(["all", "toyama", "japan", "world"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-2 transition-colors ${filterCat === c ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"}`}
              >
                {c === "all" ? `All (${counts.all})` : c === "toyama" ? `Toyama (${counts.toyama})` : c === "japan" ? `Japan (${counts.japan})` : `World (${counts.world})`}
              </button>
            ))}
          </div>
          <div className="flex border border-gray-100 rounded-xl overflow-hidden text-[10px] uppercase tracking-widest">
            {(["all", "not-visited", "planned", "visited"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 transition-colors ${filterStatus === s ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900"}`}
              >
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </section>

        {/* Spots grid */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-6">
            All Destinations — {filtered.length} spots
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((spot) => {
              const cfg = STATUS_CONFIG[spot.status];
              const catCfg = CAT_CONFIG[spot.category];
              const isRec = rec?.spot.id === spot.id;
              return (
                <div
                  key={spot.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isRec ? "border-gray-300 shadow-sm" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-36 bg-gray-50">
                    {spot.image ? (
                      <Image
                        src={spot.image}
                        alt={spot.name}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🗾</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${catCfg.badgeClass}`}>
                        {catCfg.label}
                      </span>
                      {isRec && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                          This Week
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 leading-snug">{spot.name}</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{spot.nameJP}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5 mb-3">{spot.region}</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">{spot.desc}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {spot.tags.map((t) => (
                        <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{t}</span>
                      ))}
                    </div>

                    {spot.visitedDate && (
                      <p className="text-[10px] text-emerald-500 mb-3">ไปเมื่อ {spot.visitedDate}</p>
                    )}

                    <div className="flex gap-1.5 flex-wrap border-t border-gray-50 pt-3">
                      {ALL_STATUSES.map((s) => {
                        const c = STATUS_CONFIG[s];
                        const active = spot.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(spot.id, s)}
                            disabled={updating === spot.id || active}
                            className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
                              active
                                ? `${c.bg} ${c.color} ${c.border} font-semibold cursor-default`
                                : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-700"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🗺️</p>
              <p className="text-gray-400 text-sm">ไม่พบสถานที่ที่ตรงกัน</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
