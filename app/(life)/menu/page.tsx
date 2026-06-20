"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";

type Ingredient = { name: string; amount: string };

type Difficulty = 1 | 2 | 3;

type MenuItem = {
  id: string;
  name: string;
  image: string | null;
  emoji: string;
  nationality: string;
  tags: string[];
  price: number;
  time: number;
  calories: number;
  servings: number;
  difficulty: Difficulty;
  desc: string;
  ingredients: Ingredient[];
  steps: string[];
};

const NATIONALITIES = [
  { value: "all", label: "ทั้งหมด", flag: "🍽️" },
  { value: "thai", label: "ไทย", flag: "🇹🇭" },
  { value: "japanese", label: "ญี่ปุ่น", flag: "🇯🇵" },
  { value: "korean", label: "เกาหลี", flag: "🇰🇷" },
  { value: "chinese", label: "จีน", flag: "🇨🇳" },
  { value: "italian", label: "อิตาลี", flag: "🇮🇹" },
  { value: "western", label: "ตะวันตก", flag: "🌍" },
];

const INGREDIENT_GROUPS = [
  { label: "แป้ง / ข้าว", icon: "🌾", tags: ["ข้าว", "เส้น", "ขนมปัง"] },
  { label: "โปรตีน", icon: "🥩", tags: ["หมู", "ไก่", "ปลา", "กุ้ง", "ไข่", "เต้าหู้"] },
  { label: "ผัก", icon: "🥦", tags: ["ผักบุ้ง", "กะหล่ำ", "ถั่วฝักยาว", "ข้าวโพด", "กระเทียม", "พริก"] },
  { label: "วิธีปรุง", icon: "🍳", tags: ["ผัด", "ต้ม", "ยำ", "ทอด", "แกง"] },
];

const DIFFICULTY_LABEL: Record<Difficulty, string> = { 1: "ง่าย", 2: "ปานกลาง", 3: "ยาก" };
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  1: "text-emerald-600 bg-emerald-50",
  2: "text-amber-600 bg-amber-50",
  3: "text-rose-600 bg-rose-50",
};

const NAT_COLORS: Record<string, string> = {
  thai: "bg-red-50 text-red-700",
  japanese: "bg-pink-50 text-pink-700",
  korean: "bg-orange-50 text-orange-700",
  chinese: "bg-yellow-50 text-yellow-700",
  italian: "bg-green-50 text-green-700",
  western: "bg-blue-50 text-blue-700",
};

function getNatLabel(value: string) {
  return NATIONALITIES.find((n) => n.value === value) || { label: value, flag: "🍽️" };
}

export default function MenuPage() {
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [selectedNat, setSelectedNat] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [detail, setDetail] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetch('/api/menu?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setAllItems(d.items));
  }, []);

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return allItems.filter((item) => {
      const matchNat = selectedNat === "all" || item.nationality === selectedNat;
      const matchSearch = search === "" || item.name.toLowerCase().includes(search.toLowerCase());
      const matchTags = selected.size === 0 || [...selected].every((t) => item.tags.includes(t));
      return matchNat && matchSearch && matchTags;
    });
  }, [allItems, selectedNat, selected, search]);

  const natCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length };
    for (const item of allItems) {
      counts[item.nationality] = (counts[item.nationality] || 0) + 1;
    }
    return counts;
  }, [allItems]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="pt-10 pb-8 px-6 text-center max-w-3xl mx-auto">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-3">เลือกตามวัตถุดิบหรือสัญชาติ</p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">เมนูอาหาร</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          กรองตามวัตถุดิบ สัญชาติ หรือค้นหาชื่อเมนู
        </p>
      </div>

      {/* ── Nationality Tabs ── */}
      <div className="max-w-5xl mx-auto px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {NATIONALITIES.filter((n) => n.value === "all" || (natCounts[n.value] || 0) > 0).map((n) => (
            <button
              key={n.value}
              onClick={() => setSelectedNat(n.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedNat === n.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 bg-white"
              }`}
            >
              <span>{n.flag}</span>
              <span>{n.label}</span>
              {natCounts[n.value] > 0 && (
                <span className={`text-[10px] ${selectedNat === n.value ? "text-gray-300" : "text-gray-400"}`}>
                  {natCounts[n.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + Filter toggle ── */}
      <div className="max-w-5xl mx-auto px-6 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              className="w-full border border-gray-200 rounded-2xl px-5 py-3 pr-12 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:border-gray-300 shadow-none text-sm bg-white"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm transition-all ${
              showFilter || selected.size > 0
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-500 hover:border-gray-400 bg-white"
            }`}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
            </svg>
            <span>กรอง</span>
            {selected.size > 0 && (
              <span className="bg-white text-gray-900 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {selected.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFilter && (
        <div className="max-w-5xl mx-auto px-6 mb-6">
          <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-sm">
            <div className="space-y-5">
              {INGREDIENT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
                    <span>{group.icon}</span>
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggle(tag)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          selected.has(tag)
                            ? "bg-gray-900 text-white border-gray-900"
                            : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 bg-white"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {selected.size > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex flex-wrap gap-2">
                  {[...selected].map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 bg-slate-100 text-gray-600 text-xs px-3 py-1.5 rounded-full font-medium"
                    >
                      {tag}
                      <button onClick={() => toggle(tag)} className="hover:text-gray-900 font-bold leading-none">×</button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Results ── */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-400">
            พบ <span className="text-gray-900 font-semibold">{filtered.length}</span> เมนู
          </p>
          {(selected.size > 0 || search || selectedNat !== "all") && (
            <button
              onClick={() => { setSelected(new Set()); setSearch(""); setSelectedNat("all"); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              รีเซ็ตทั้งหมด
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-28">
            <p className="text-6xl mb-5">🍽️</p>
            <p className="text-gray-500 font-medium mb-1">ไม่พบเมนูที่ตรงกัน</p>
            <p className="text-gray-400 text-sm mb-6">ลองเปลี่ยน filter หรือล้างการค้นหา</p>
            <button
              onClick={() => { setSelected(new Set()); setSearch(""); setSelectedNat("all"); }}
              className="text-sm text-gray-900 font-medium underline underline-offset-4"
            >
              ล้าง filter ทั้งหมด
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => {
              const nat = getNatLabel(item.nationality);
              return (
                <button
                  key={item.id}
                  onClick={() => setDetail(item)}
                  className="text-left rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden bg-white group"
                >
                  {/* Image / Emoji banner */}
                  <div className="h-40 relative overflow-hidden bg-slate-50">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        {item.emoji}
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${NAT_COLORS[item.nationality] || "bg-slate-100 text-gray-600"}`}>
                        {nat.flag} {nat.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-gray-900 leading-snug">{item.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${DIFFICULTY_COLOR[item.difficulty]}`}>
                        {DIFFICULTY_LABEL[item.difficulty]}
                      </span>
                    </div>

                    <p className="text-gray-400 text-xs mb-3 leading-relaxed line-clamp-2">{item.desc}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                            selected.has(tag) ? "bg-gray-900 text-white" : "bg-slate-100 text-gray-400"
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 4 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-gray-300">+{item.tags.length - 4}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                      <span className="text-gray-900 font-bold">฿{item.price}</span>
                      <span className="text-gray-400">⏱ {item.time} นาที</span>
                      <span className="text-gray-400">🔥 {item.calories} cal</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}
        >
          <div className="min-h-full flex items-start justify-center py-8 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              {/* Hero image */}
              <div className="relative h-56 bg-slate-50">
                {detail.image ? (
                  <Image src={detail.image} alt={detail.name} fill unoptimized sizes="100vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl">{detail.emoji}</div>
                )}
                <button
                  onClick={() => setDetail(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-sm text-lg leading-none"
                >
                  ×
                </button>
                <div className="absolute bottom-4 left-4">
                  {(() => {
                    const nat = getNatLabel(detail.nationality);
                    return (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${NAT_COLORS[detail.nationality] || "bg-slate-100 text-gray-600"}`}>
                        {nat.flag} {nat.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="p-6">
                {/* Title + difficulty */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{detail.name}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${DIFFICULTY_COLOR[detail.difficulty]}`}>
                    {DIFFICULTY_LABEL[detail.difficulty]}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{detail.desc}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: "ราคา", value: `฿${detail.price}` },
                    { label: "เวลา", value: `${detail.time} นาที` },
                    { label: "แคลอรี่", value: `${detail.calories}` },
                    { label: "จำนวน", value: `${detail.servings} คน` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-gray-900 font-semibold text-sm">{value}</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Ingredients */}
                {detail.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">ส่วนผสม</h3>
                    <div className="space-y-1.5">
                      {detail.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-700">{ing.name}</span>
                          <span className="text-sm text-gray-400">{ing.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Steps */}
                {detail.steps.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">วิธีทำ</h3>
                    <ol className="space-y-3">
                      {detail.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Tags */}
                {detail.tags.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {detail.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-gray-500">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
