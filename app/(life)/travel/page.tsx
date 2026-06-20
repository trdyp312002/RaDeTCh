"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import TravelMap to avoid SSR issues with window/leaflet
const TravelMap = dynamic(() => import("../../../components/TravelMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-[#FAF6F0] rounded-3xl animate-pulse">
    <span className="text-[#8C837A] text-sm">Loading Map...</span>
  </div>
});

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

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; icon: string }> = {
  "not-visited": { label: "Not Visited", color: "text-[#8C837A]", bg: "bg-[#FDFBF7]", border: "border-[#E8E1D5]", icon: "location_off" },
  planned: { label: "Planned", color: "text-[#4A90E2]", bg: "bg-[#E6F0FA]", border: "border-[#A5C6F7]", icon: "event" },
  visited: { label: "Visited", color: "text-[#4CAF50]", bg: "bg-[#E8F5E9]", border: "border-[#A5D6A7]", icon: "where_to_vote" },
};

export default function TravelPage() {
  const [spotsData, setSpotsData] = useState<SpotsData | null>(null);
  const [filterCat, setFilterCat] = useState<"all" | Category>("all");
  const [loading, setLoading] = useState(true);
  const [visitedCountriesCount, setVisitedCountriesCount] = useState<number>(0);
  const [targetCountry, setTargetCountry] = useState<string | null>(null);
  
  const TOTAL_MAP_COUNTRIES = 195; // Official UN count

  const fetchAll = useCallback(async () => {
    try {
      const [spotsRes, countriesRes] = await Promise.all([
        fetch('/api/travel/spots?t=' + Date.now()),
        fetch('/api/travel/countries?t=' + Date.now())
      ]);
      
      if(spotsRes.ok) {
        setSpotsData(await spotsRes.json());
      }
      if(countriesRes.ok) {
        const countries = await countriesRes.json();
        setVisitedCountriesCount(Array.isArray(countries) ? countries.length : 0);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allSpots: (Spot & { category: Category })[] = spotsData
    ? [
        ...spotsData.toyama.map((s) => ({ ...s, category: "toyama" as Category })),
        ...spotsData.japan.map((s) => ({ ...s, category: "japan" as Category })),
        ...(spotsData.world || []).map((s) => ({ ...s, category: "world" as Category })),
      ]
    : [];

  const filtered = allSpots.filter((s) => {
    return filterCat === "all" || s.category === filterCat;
  });

  const counts = {
    all: allSpots.length,
    visited: allSpots.filter(s => s.status === "visited").length,
    planned: allSpots.filter(s => s.status === "planned").length
  };

  const explorationPercent = Math.round((visitedCountriesCount / TOTAL_MAP_COUNTRIES) * 100);

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto w-full flex flex-col gap-8">
      
      {/* Header */}
      <header className="flex justify-between items-end animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-serif text-[#1F1D1A] tracking-tight mb-2">Travel & Explore</h1>
          <p className="text-[#8C837A]">The world is waiting. Keep track of your journeys.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white border border-[#E8E1D5] px-4 py-2 rounded-full text-sm text-[#5A4F43] shadow-sm">
          <span className="material-symbols-outlined text-[#4A90E2] text-[20px]">flight_takeoff</span>
          <span>{visitedCountriesCount} Countries Visited</span>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          
          {/* Left Column: Map */}
          <section className="col-span-1 lg:col-span-8 bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5] flex flex-col relative h-[500px]">
            <div className="flex justify-between items-center mb-6 z-10 relative">
              <h3 className="text-lg font-medium text-[#1F1D1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4A90E2]">public</span> 
                Visited Map
              </h3>
              <span className="text-xs font-medium bg-[#FDFBF7] border border-[#E8E1D5] text-[#5A4F43] px-3 py-1 rounded-full">Global View</span>
            </div>
            {/* The TravelMap component itself has rounded borders, but we wrap it in a flex container */}
            <div className="flex-1 w-full h-full relative -mt-4">
               <TravelMap targetCountry={targetCountry} onTargetReached={() => setTargetCountry(null)} />
            </div>
          </section>

          {/* Right Column: Stats & Filters */}
          <section className="col-span-1 lg:col-span-4 bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5] h-[500px] flex flex-col">
            <h3 className="text-lg font-medium text-[#1F1D1A] flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-[#4CAF50]">analytics</span> Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl flex flex-col items-center justify-center border border-[#E8E1D5]">
                <span className="text-3xl font-semibold text-[#4CAF50]">{visitedCountriesCount}</span>
                <span className="text-xs text-[#8C837A] uppercase tracking-wider mt-1 text-center leading-tight">Countries<br/>Visited</span>
              </div>
              <div className="bg-[#F9F9F9] p-4 rounded-2xl flex flex-col items-center justify-center border border-[#E8E1D5]">
                <span className="text-3xl font-semibold text-[#4A90E2]">{counts.planned}</span>
                <span className="text-xs text-[#8C837A] uppercase tracking-wider mt-1 text-center leading-tight">Planned<br/>Spots</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 bg-[#FDFBF7] p-4 rounded-2xl border border-[#E8E1D5]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-[#1F1D1A]">World Exploration</span>
                <span className="text-xs font-bold text-[#4A90E2]">{explorationPercent}%</span>
              </div>
              <div className="w-full h-2.5 bg-[#E8E1D5] rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#4A90E2] to-[#4CAF50] rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, explorationPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium text-[#8C837A]">
                <span>{visitedCountriesCount} Visited</span>
                <span>{TOTAL_MAP_COUNTRIES - visitedCountriesCount} Left</span>
              </div>
            </div>

            <h4 className="font-medium text-[#1F1D1A] mb-3">Filters</h4>
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {(["all", "toyama", "japan", "world"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                    filterCat === c 
                      ? "bg-[#E6F0FA] border-[#A5C6F7] text-[#1F1D1A] shadow-sm" 
                      : "bg-[#FDFBF7] border-[#E8E1D5] text-[#8C837A] hover:bg-[#FAF6F0] hover:text-[#5A4F43]"
                  }`}
                >
                  <span className={`capitalize text-sm ${filterCat === c ? 'font-medium' : ''}`}>
                    {c === "all" ? "All Places" : c}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-md ${filterCat === c ? 'bg-white text-[#4A90E2]' : 'bg-white border border-[#E8E1D5]'}`}>
                    {c === "all" ? counts.all : allSpots.filter(s => s.category === c).length}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Bottom Section: Destinations Grid */}
          <section className="col-span-1 lg:col-span-12 mt-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif text-[#1F1D1A] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#5A4F43]">travel_explore</span> Countries Explored
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from(
                filtered.reduce((acc, spot) => {
                  let country = "";
                  if (spot.category === "toyama" || spot.category === "japan") {
                    country = "Japan";
                  } else {
                    country = spot.region.split(', ').pop() || "Unknown";
                  }

                  if (!acc.has(country)) {
                    acc.set(country, { country, spots: [] });
                  }
                  acc.get(country)!.spots.push(spot);
                  return acc;
                }, new Map<string, { country: string, spots: Spot[] }>())
                .values()
              ).map(c => {
                // Pre-defined signature images for iconic countries
                const COUNTRY_SIGNATURES: Record<string, string> = {
                  "Japan": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&auto=format&fit=crop&q=80", // Mount Fuji
                  "Vietnam": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80", // Ha Long Bay
                  "Thailand": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop&q=80", // Thailand (Chiang Mai / Wat)
                  "Taiwan": "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&auto=format&fit=crop&q=80", // Jiufen
                  "South Korea": "https://images.unsplash.com/photo-1538669715515-5c3789a7f1e4?w=800&auto=format&fit=crop&q=80", // Gyeongju
                  "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80", // Gardens by the Bay
                  "Iceland": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&auto=format&fit=crop&q=80", // Northern Lights
                };

                // Use signature image if available, else fallback to first available spot image
                const coverImage = COUNTRY_SIGNATURES[c.country] || (c.spots.find(s => s.image)?.image);
                const visitedCount = c.spots.filter(s => s.status === "visited").length;
                
                return (
                  <div key={c.country} className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5] flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300">
                    <div className="relative h-48 overflow-hidden group">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={c.country}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FAF6F0] flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-[#D5CEC4] opacity-50">image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                      
                      {/* Top Action Bar */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setTargetCountry(c.country);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-white/90 hover:bg-white backdrop-blur-md text-[#4A90E2] p-2 rounded-full shadow-sm transition-all flex items-center justify-center"
                          title={`View ${c.country} on Map`}
                        >
                          <span className="material-symbols-outlined text-[18px]">location_on</span>
                        </button>
                      </div>

                      <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                        <h4 className="font-serif text-2xl text-white font-medium tracking-wide drop-shadow-md">{c.country}</h4>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-medium border border-white/30 shadow-sm">
                          {visitedCount} / {c.spots.length} Visited
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="text-xs font-semibold text-[#8C837A] mb-3 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#E8E1D5]">
                        <span className="material-symbols-outlined text-[14px]">map</span>
                        Provinces & Places
                      </h4>
                      <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {Array.from(
                          c.spots.reduce((provAcc, spot) => {
                            let province = "";
                            if (c.country === "Japan") {
                              if (spot.region.includes(",")) {
                                province = spot.region.split(",")[1].trim();
                              } else {
                                province = spot.region.replace(" City", "").trim();
                              }
                            } else {
                              if (spot.region.includes(",")) {
                                province = spot.region.split(",")[0].trim();
                              } else {
                                province = spot.region.trim();
                              }
                            }
                            
                            if (!provAcc.has(province)) {
                              provAcc.set(province, []);
                            }
                            provAcc.get(province)!.push(spot);
                            return provAcc;
                          }, new Map<string, Spot[]>())
                        ).map(([province, provinceSpots]) => (
                          <div key={province} className="flex flex-col gap-1.5">
                            <h5 className="text-[11px] font-bold text-[#5A4F43] bg-[#FDFBF7] px-2 py-1 rounded-md border border-[#E8E1D5] w-fit">
                              📍 {province}
                            </h5>
                            <div className="space-y-1 pl-1 border-l-2 border-[#FAF6F0] ml-3 mt-1">
                              {provinceSpots.map(spot => (
                                <div key={spot.id} className="flex justify-between items-center px-2 py-1.5 rounded-lg hover:bg-[#FAF6F0] transition-colors group/item">
                                  <span className="text-[13px] font-medium text-[#1F1D1A] line-clamp-1 mr-2">{spot.name}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap border ${
                                    spot.status === 'visited' 
                                      ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#4CAF50]' 
                                      : 'bg-[#FDFBF7] border-[#E8E1D5] text-[#8C837A]'
                                  }`}>
                                    {spot.status === 'visited' ? 'Visited' : 'Planned'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
