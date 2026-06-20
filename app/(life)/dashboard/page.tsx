"use client";
import { useState } from "react";

export default function DashboardPage() {
  const [selectedMood, setSelectedMood] = useState("calm");
  const [tasks, setTasks] = useState([
    { id: 1, text: "Morning meditation", done: true },
    { id: 2, text: "Drink 2L of water", done: true },
    { id: 3, text: "Grocery shopping", done: false },
  ]);

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto">
      <h1 className="text-3xl font-serif text-[#1F1D1A] tracking-tight mb-8">Health OS Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weather Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5]">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-[#1F1D1A]">Today's Weather</h3>
            <div className="w-8 h-4 bg-[#E6F0FA] rounded-full flex items-center p-1 cursor-pointer">
              <div className="w-2.5 h-2.5 bg-[#4A90E2] rounded-full translate-x-3.5"></div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-6xl">☀️</div>
            <div>
              <div className="text-4xl font-light text-[#1F1D1A]">22°C</div>
              <div className="text-sm text-[#8C837A] mt-1">Partly Cloudy, San Francisco</div>
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <div className="w-8 h-1 rounded-full bg-[#4A90E2]"></div>
            <div className="w-16 h-1 rounded-full bg-[#E8E1D5] ml-1"></div>
          </div>
        </div>

        {/* Top 3 Tasks Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5] row-span-2">
          <h3 className="text-lg font-medium text-[#1F1D1A] mb-6">Top 3 Tasks</h3>
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 cursor-pointer" onClick={() => {
                setTasks(tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
              }}>
                <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${task.done ? 'bg-[#4CAF50] text-white' : 'border-2 border-[#E8E1D5] text-transparent'}`}>
                  ✓
                </div>
                <span className={`text-[#33302C] ${task.done ? '' : ''}`}>{task.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Score Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5]">
          <h3 className="text-lg font-medium text-[#1F1D1A] mb-6">Sleep Score</h3>
          <div className="flex items-center gap-8">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#E8E1D5" strokeWidth="12" fill="transparent" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" stroke="url(#gradient)" strokeWidth="12" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.85)} strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="100%" stopColor="#4CAF50" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute text-2xl font-semibold text-[#1F1D1A]">85%</div>
            </div>
            <div>
              <div className="text-2xl mb-1 text-[#5A4F43]">🌙</div>
              <div className="text-xl font-medium text-[#1F1D1A]">7h 30m</div>
              <div className="text-sm text-[#8C837A]">sleep last night</div>
            </div>
          </div>
        </div>

        {/* Mood Selector Card */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#E8E1D5] md:col-span-2">
          <h3 className="text-lg font-medium text-[#1F1D1A] mb-6">Mood Selector</h3>
          <div className="flex justify-between items-center px-4 md:px-12">
            {[
              { id: 'happy', icon: '😁', label: 'happy' },
              { id: 'calm', icon: '😌', label: 'calm' },
              { id: 'neutral', icon: '😐', label: 'neutral' },
              { id: 'stressed', icon: '😫', label: 'stressed' },
              { id: 'sad', icon: '😢', label: 'sad' },
            ].map(mood => (
              <div key={mood.id} onClick={() => setSelectedMood(mood.id)} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl transition-all ${selectedMood === mood.id ? 'bg-[#4A90E2] shadow-lg scale-110' : 'bg-[#F9F9F9] group-hover:bg-[#E6F0FA]'}`}>
                  <span className={selectedMood === mood.id ? 'opacity-100' : 'opacity-60 grayscale'}>{mood.icon}</span>
                </div>
                <span className={`text-sm ${selectedMood === mood.id ? 'text-[#4A90E2] font-medium' : 'text-[#8C837A]'}`}>{mood.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
