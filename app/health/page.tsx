"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { ArrowLeft, Activity, Heart, Moon, Zap, Flame } from "lucide-react";

export default function HealthDashboard() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/health?t=${new Date().getTime()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Sort logs chronologically
          const sorted = (data.logs || []).sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setHealthData(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch health data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const latestLog = healthData.length > 0 ? healthData[healthData.length - 1] : null;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl backdrop-blur-sm transition-all text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                Health Overview
              </h1>
              <p className="text-gray-400 mt-1">Syncing directly with Raphael 🤖</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium tracking-wider uppercase">Active Tracking</span>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Current Weight" 
                value={latestLog?.weight ? `${latestLog.weight} kg` : "--"}
                icon={<Heart className="w-6 h-6 text-pink-400" />}
                color="from-pink-500/20 to-rose-500/5"
                borderColor="border-pink-500/20"
              />
              <StatCard 
                title="Last Sleep" 
                value={latestLog?.sleep_hours ? `${latestLog.sleep_hours} h` : "--"}
                icon={<Moon className="w-6 h-6 text-indigo-400" />}
                color="from-indigo-500/20 to-blue-500/5"
                borderColor="border-indigo-500/20"
              />
              <StatCard 
                title="Calories Intake" 
                value={latestLog?.calories_in ? `${latestLog.calories_in} kcal` : "--"}
                icon={<Flame className="w-6 h-6 text-orange-400" />}
                color="from-orange-500/20 to-red-500/5"
                borderColor="border-orange-500/20"
              />
              <StatCard 
                title="Calories Burned" 
                value={latestLog?.calories_out ? `${latestLog.calories_out} kcal` : "--"}
                icon={<Zap className="w-6 h-6 text-yellow-400" />}
                color="from-yellow-500/20 to-amber-500/5"
                borderColor="border-yellow-500/20"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Weight Chart */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl hover:bg-white/[0.07] transition-all duration-300 group">
                <h3 className="text-xl font-semibold mb-6 text-gray-200 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  Weight Trend
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthData}>
                      <defs>
                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f472b6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickFormatter={(str) => str.split(' ')[0].substring(5)} stroke="#6b7280" />
                      <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#f472b6" strokeWidth={4} dot={{ r: 4, fill: "#f472b6" }} activeDot={{ r: 8, fill: "#fff", stroke: "#f472b6", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sleep Chart */}
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl hover:bg-white/[0.07] transition-all duration-300 group">
                <h3 className="text-xl font-semibold mb-6 text-gray-200 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  Sleep Duration
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthData}>
                      <defs>
                        <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tickFormatter={(str) => str.split(' ')[0].substring(5)} stroke="#6b7280" />
                      <YAxis domain={[0, 12]} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="sleep_hours" fill="url(#sleepGrad)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Logs Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-semibold text-gray-200">Recent Records</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-sm">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Weight (kg)</th>
                      <th className="p-4 font-medium">Sleep (hrs)</th>
                      <th className="p-4 font-medium">Calories In</th>
                      <th className="p-4 font-medium">Calories Out</th>
                      <th className="p-4 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...healthData].reverse().map((log: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors text-gray-300">
                        <td className="p-4">{log.date.split(' ')[0]}</td>
                        <td className="p-4 text-pink-400 font-medium">{log.weight || '-'}</td>
                        <td className="p-4 text-indigo-400 font-medium">{log.sleep_hours || '-'}</td>
                        <td className="p-4 text-orange-400">{log.calories_in || '-'}</td>
                        <td className="p-4 text-yellow-400">{log.calories_out || '-'}</td>
                        <td className="p-4 text-sm text-gray-500">{log.notes || '-'}</td>
                      </tr>
                    ))}
                    {healthData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No health data found. Send some data via Raphael!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor }: { title: string, value: string, icon: React.ReactNode, color: string, borderColor: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${color} border ${borderColor} p-6 rounded-3xl backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group`}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
            {icon}
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">{value}</h2>
      </div>
      {/* Decorative blurred circle in the background of the card */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
    </div>
  );
}
