"use client";
import React, { useEffect, useState, useRef } from "react";
import Globe from "react-globe.gl";

export default function TravelMap({ targetCountry, onTargetReached }: { targetCountry?: string | null, onTargetReached?: () => void }) {
  const [countries, setCountries] = useState<any>({ features: [] });
  const [visitedCountries, setVisitedCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    // Load GeoJSON data safely
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load map data");
        return res.json();
      })
      .then((data) => {
        if (isMounted) setCountries(data || { features: [] });
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setError("Failed to load map geometry.");
      });

    // Load visited countries
    fetch("/api/travel/countries")
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) {
          setVisitedCountries(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setVisitedCountries([]);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, []);

  // Separate useEffect for observing dimensions to ensure ref is captured properly
  useEffect(() => {
    if (loading || error) return;

    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener("resize", updateSize);
    
    // Add small delay to ensure layout is complete before initial measure
    const timeoutId = setTimeout(updateSize, 100);

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [loading, error]);

  // Effect to handle rotating to a target country
  useEffect(() => {
    if (targetCountry && globeRef.current && countries.features?.length > 0) {
      const feature = countries.features.find((f: any) => 
        f.properties.ADMIN === targetCountry || 
        f.properties.ISO_A3 === targetCountry ||
        f.properties.NAME === targetCountry
      );

      if (feature && feature.geometry) {
        // Calculate rough center of polygon
        let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
        
        const processCoords = (coords: any[]) => {
          if (typeof coords[0] === 'number') {
            const [lng, lat] = coords;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          } else {
            coords.forEach(processCoords);
          }
        };
        
        processCoords(feature.geometry.coordinates);
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Determine altitude based on bounding box size (rough zoom level)
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;
        const maxDiff = Math.max(latDiff, lngDiff);
        
        let altitude = 1.5; // Default far
        if (maxDiff < 5) altitude = 0.4;
        else if (maxDiff < 15) altitude = 0.8;
        else if (maxDiff < 30) altitude = 1.2;

        globeRef.current.pointOfView({ lat: centerLat, lng: centerLng, altitude }, 1500); // 1.5s animation
        
        // Temporarily stop auto-rotate while focusing
        globeRef.current.controls().autoRotate = false;
        
        // Notify parent that we processed it
        setTimeout(() => {
          if (onTargetReached) onTargetReached();
        }, 1600);
      }
    }
  }, [targetCountry, countries, onTargetReached]);

  const toggleCountry = async (polygon: any) => {
    const id = polygon.properties.ISO_A3;
    if (!id) return;

    let newVisited = [...visitedCountries];
    if (newVisited.includes(id)) {
      newVisited = newVisited.filter((c) => c !== id);
    } else {
      newVisited.push(id);
    }

    setVisitedCountries(newVisited);
    try {
      await fetch("/api/travel/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVisited),
      });
    } catch (e) {
      console.error("Failed to save visited country", e);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-[#FAF6F0] rounded-xl text-[#8C837A]">
        Loading Earth...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-[#FAF6F0] rounded-xl text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden bg-[#FAF6F0] flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        {dimensions.width > 0 && dimensions.height > 0 ? (
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor="rgba(250, 246, 240, 1)" // Match Health OS theme
            showAtmosphere={true}
            atmosphereColor="#A5C6F7"
            atmosphereAltitude={0.15}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-water.png"
            polygonsData={countries?.features || []}
            polygonAltitude={(d: any) => (visitedCountries.includes(d.properties.ISO_A3) ? 0.04 : 0.01)}
            polygonCapColor={(d: any) =>
              visitedCountries.includes(d.properties.ISO_A3) ? "#5A4F43" : "#FFFFFF"
            }
            polygonSideColor={() => "rgba(90, 79, 67, 0.2)"}
            polygonStrokeColor={() => "#E8E1D5"}
            polygonLabel={({ properties: d }: any) => `
              <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); border: 1px solid #E8E1D5; color: #1F1D1A; padding: 8px 12px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <b style="font-size: 14px; display: block; margin-bottom: 2px;">${d.ADMIN || 'Unknown'}</b>
                <span style="font-size: 11px; color: ${visitedCountries.includes(d.ISO_A3) ? '#4CAF50' : '#8C837A'}">
                  ${visitedCountries.includes(d.ISO_A3) ? '✓ Visited' : 'Not Visited'}
                </span>
              </div>
            `}
            onPolygonClick={toggleCountry}
            onPolygonHover={(polygon: any) => {
              if (globeRef.current) {
                globeRef.current.controls().autoRotate = !polygon;
              }
            }}
          />
        ) : (
          <div className="text-[#8C837A] animate-pulse">Building Globe...</div>
        )}
      </div>
      
      {/* Decorative inner shadow */}
      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ boxShadow: 'inset 0 0 50px rgba(250,246,240,1)' }} />
      
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-medium text-[#5A4F43] border border-[#E8E1D5] shadow-sm pointer-events-none flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#5A4F43]" />
        Click a country to mark as visited
      </div>
    </div>
  );
}
