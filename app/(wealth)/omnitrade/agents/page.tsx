"use client";

import { useEffect, useState, useRef } from "react";

// Agent definitions and initial desk positions (x, y as percentages over the background)
const AGENTS_INFO: Record<string, { deskX: number, deskY: number, color: string, nameTh: string }> = {
  Observer: { deskX: 30, deskY: 55, color: "bg-blue-400", nameTh: "นักวิเคราะห์ข้อมูล" },
  Questioner: { deskX: 45, deskY: 50, color: "bg-purple-400", nameTh: "คนตั้งคำถาม" },
  Advocate: { deskX: 60, deskY: 55, color: "bg-red-400", nameTh: "ทนายปีศาจ" },
  Summarizer: { deskX: 70, deskY: 45, color: "bg-yellow-400", nameTh: "คนสรุป" },
  Executor: { deskX: 40, deskY: 70, color: "bg-green-400", nameTh: "มือลั่นไก" },
  Supervisor: { deskX: 65, deskY: 70, color: "bg-orange-400", nameTh: "หัวหน้างาน" }
};

interface ChatMessage {
  id: number;
  name: string;
  message: string;
  time: string;
  color: string;
}

export default function PixelDashboard() {
  const [agents, setAgents] = useState<Record<string, {status: string, message: string}>>({});
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const lastMessages = useRef<Record<string, string>>({});
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Clock tick
    const clockTimer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const host = window.location.hostname;
        const res = await fetch(`http://${host}:8000/agents/status`);
        if (!res.ok) throw new Error("Bot API is offline");
        const data = await res.json();
        
        setAgents(data);
        setError(null);

        // Check for new messages to add to chat history
        let newChats: ChatMessage[] = [];
        Object.entries(data).forEach(([name, agentData]: [string, any]) => {
          const msg = agentData.message;
          if (msg && msg !== "Zzz..." && msg !== "Monitoring operation loop..." && msg !== lastMessages.current[name]) {
             lastMessages.current[name] = msg;
             newChats.push({
               id: Date.now() + Math.random(),
               name: name,
               message: msg,
               time: new Date().toLocaleTimeString('th-TH', { hour12: false }),
               color: AGENTS_INFO[name]?.color || "text-gray-300"
             });
          }
        });

        if (newChats.length > 0) {
          setChatHistory(prev => {
            const updated = [...prev, ...newChats].slice(-50); // keep last 50
            return updated;
          });
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Scroll chat to bottom
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleForceRun = async () => {
    try {
      const host = window.location.hostname;
      await fetch(`http://${host}:8000/agents/force_run`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  // UI Widget Frame Component
  const WidgetPanel = ({ title, children, className = "" }: any) => (
    <div className={`bg-[#001f3f]/80 backdrop-blur-sm border-2 border-[#0074D9] rounded-lg shadow-[0_0_15px_rgba(0,116,217,0.5)] flex flex-col overflow-hidden ${className}`}>
      <div className="bg-[#0074D9]/40 border-b-2 border-[#0074D9] px-3 py-1 flex justify-between items-center">
        <span className="text-white font-bold text-xs uppercase tracking-widest text-shadow-sm">{title}</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white/50 rounded-sm"></div>
          <div className="w-2 h-2 bg-white/80 rounded-sm flex items-center justify-center text-[6px] font-black leading-none text-blue-900 cursor-pointer">X</div>
        </div>
      </div>
      <div className="p-3 flex-1 overflow-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );

  return (
    <div 
      className="w-full h-full min-h-[600px] bg-black overflow-hidden relative font-mono text-sm"
      style={{
        backgroundImage: "url('/pixel_office_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: "pixelated"
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full h-10 bg-black/70 border-b border-[#0074D9] flex items-center justify-between px-4 z-50 text-cyan-400 text-xs">
        <div className="flex items-center gap-6">
          <span className="text-orange-400 font-bold text-lg tracking-widest drop-shadow-[0_0_5px_rgba(255,165,0,0.8)]">BAS OMNITRADE</span>
          <div className="hidden md:flex gap-4 opacity-80">
            <span className="hover:text-white cursor-pointer bg-cyan-900/50 px-2 py-0.5 rounded">Dashboard</span>
            <span className="hover:text-white cursor-pointer px-2 py-0.5">Projects</span>
            <span className="text-white bg-blue-600/50 px-2 py-0.5 rounded border border-blue-500">AI Agents</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>{now.toLocaleDateString('th-TH')}</span>
          <span className="font-bold text-white">{now.toLocaleTimeString('th-TH')}</span>
        </div>
      </div>

      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-red-600/90 border-2 border-red-400 text-white px-6 py-2 rounded shadow-lg z-50 animate-pulse">
          Connection Error: {error}
        </div>
      )}

      {/* Agents living in the office (Visual Representation) */}
      {Object.entries(agents).map(([name, data]) => {
        const info = AGENTS_INFO[name] || AGENTS_INFO.Observer;
        const isAwake = data.status !== "Sleeping" && data.status !== "Watching" && data.status !== "Offline";
        
        // Dynamic movement based on status
        let targetX = info.deskX;
        let targetY = info.deskY;
        
        if (isAwake) {
          if (data.status === "Observing" || data.status === "Thinking") {
            targetX = 50 + (Math.random() * 10 - 5); // Walk to center
            targetY = 40 + (Math.random() * 5 - 2.5);
          } else if (data.status === "Questioning" || data.status === "Arguing") {
            targetX = 45 + (Math.random() * 15 - 7.5); // Pace around center
            targetY = 45;
          } else if (data.status === "Summarizing") {
            targetX = 50; // Stand middle
            targetY = 50;
          } else if (data.status === "Deciding") {
            targetX = 80; // Walk to right side (Trading Terminal)
            targetY = 60;
          } else if (data.status === "Reviewing") {
            targetX = 75; // Walk near executor
            targetY = 65;
          } else {
            // Default active state: jitter near desk
            targetX += (Math.random() * 6 - 3);
            targetY += (Math.random() * 6 - 3);
          }
        }

        return (
          <div 
            key={`char-${name}`}
            className="absolute z-20 transition-all duration-[2000ms] ease-linear flex flex-col items-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${targetX}%`, top: `${targetY}%`, transform: "translate(-50%, -100%)" }}
          >
            {/* Status Indicator */}
            {isAwake && (
              <div className="bg-white text-black text-[10px] px-2 py-1 rounded shadow-xl mb-2 animate-bounce whitespace-nowrap">
                💬 {data.status}
              </div>
            )}
            {!isAwake && (
              <div className="text-white/50 text-[10px] font-bold mb-2">
                Zzz...
              </div>
            )}
            
            {/* Real Sprite Character */}
            <div className={`relative ${isAwake ? 'animate-[bounce_0.5s_infinite]' : ''}`}>
              <img 
                src="/agent_sprite.png" 
                alt={name}
                className={`w-16 h-24 object-contain ${isAwake ? 'brightness-110 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]' : 'brightness-50 grayscale-[50%]'}`}
                style={{ 
                  filter: `hue-rotate(${Object.keys(AGENTS_INFO).indexOf(name) * 60}deg)`,
                  imageRendering: 'pixelated'
                }}
              />
            </div>
            
            <div className="bg-black/80 text-white text-[9px] px-2 py-0.5 mt-[-10px] rounded border border-gray-600 z-10 font-bold uppercase">
              {name}
            </div>
          </div>
        );
      })}

      {/* Left Panel: AI Agents List */}
      <WidgetPanel title="AI AGENTS STATUS" className="absolute top-16 left-4 w-72 h-[60%] z-40">
        <div className="space-y-2">
          {Object.entries(AGENTS_INFO).map(([name, info]) => {
            const statusData = agents[name] || { status: "Offline", message: "" };
            const isAwake = statusData.status !== "Sleeping" && statusData.status !== "Watching" && statusData.status !== "Offline";
            
            return (
              <div key={name} className="bg-black/40 border border-blue-500/30 rounded p-2 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAwake ? 'bg-green-500 shadow-[0_0_8px_#10B981] animate-pulse' : 'bg-gray-500'}`} />
                <div className="flex-1">
                  <div className="text-white font-bold text-xs">{name}</div>
                  <div className="text-gray-400 text-[10px] truncate">{statusData.status}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-500/30 flex justify-center">
          <button 
            onClick={handleForceRun}
            className="w-full py-2 bg-[#FF4136]/80 hover:bg-[#FF4136] border border-[#FF851B] text-white font-bold rounded shadow-[0_0_10px_rgba(255,65,54,0.5)] active:scale-95 transition-all text-xs"
          >
            ▶ FORCE SIGNAL
          </button>
        </div>
      </WidgetPanel>

      {/* Right Panel: Trading Status (Placeholder matching photo) */}
      <WidgetPanel title="SYSTEM DIAGNOSTICS" className="absolute top-16 right-4 w-64 h-[40%] z-40">
        <div className="space-y-4">
          <div>
             <div className="text-[10px] text-cyan-300">Strategy Model</div>
             <div className="text-white font-bold">EMA 9/21 Cross + 6 AI</div>
          </div>
          <div>
             <div className="text-[10px] text-cyan-300">Live API Connection</div>
             <div className="text-green-400 font-bold">CONNECTED</div>
          </div>
          <div>
             <div className="text-[10px] text-cyan-300">Last Trade Signal</div>
             <div className="text-gray-400">WAITING FOR CROSS...</div>
          </div>
        </div>
      </WidgetPanel>

      {/* Bottom Center: Team Chat */}
      <WidgetPanel title="TEAM CHAT (AI CONSENSUS)" className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] h-48 z-40">
        <div className="flex flex-col gap-2 h-full" ref={chatRef}>
          {chatHistory.length === 0 ? (
             <div className="text-gray-500 text-center mt-10 italic text-xs">Waiting for agent activity...</div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat.id} className="flex gap-2">
                <span className="text-gray-500 text-[10px] shrink-0 mt-0.5">[{chat.time}]</span>
                <span className={`font-bold text-xs shrink-0 ${chat.color.replace('bg-', 'text-')}`}>
                  {chat.name}:
                </span>
                <span className="text-white text-xs leading-tight">
                  {chat.message}
                </span>
              </div>
            ))
          )}
        </div>
      </WidgetPanel>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,116,217,0.5); border-radius: 2px; }
      `}} />
    </div>
  );
}
