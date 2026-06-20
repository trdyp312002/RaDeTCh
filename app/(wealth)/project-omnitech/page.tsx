"use client"
import React from 'react';
import Link from 'next/link';
import '../../wealth-os/styles.css';
import WealthNavbar from '@/components/WealthNavbar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockPerformanceData = Array.from({length: 40}).map((_, i) => {
  const isDip = i > 15 && i < 20;
  return {
    time: `10:${i < 10 ? '0'+i : i}`,
    pnl: isDip ? 5000 + i * 100 : 8000 + Math.random() * 2000 + i * 150
  };
});

export default function OmniTrade() {
  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [positions, setPositions] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setTransactions(data.slice(0, 10)); // keep last 10 logs
    }).catch(console.error);

    fetch("/api/holdings").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPositions(data);
    }).catch(console.error);
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="omnitrade-page">
      {/* Header */}
      <WealthNavbar />

      {/* Grid Content */}
      <main className="ot-grid">
        {/* Performance Overview */}
        <div className="ot-box">
          <div className="ot-box-header">PERFORMANCE OVERVIEW</div>
          <div className="ot-box-content">
            <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>CUMULATIVE PnL (24H)</div>
            <div style={{fontSize: '2.5rem', fontWeight: 700, color: '#4ade80', margin: '0.5rem 0'}}>+$12,450.20 ↑</div>
            <div className="ot-chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformanceData}>
                  <defs>
                    <linearGradient id="ot-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(74,222,128,0.3)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                    itemStyle={{color: '#4ade80'}}
                  />
                  <Area type="monotone" dataKey="pnl" stroke="#4ade80" fill="url(#ot-grad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="ot-stats">
              <div>WIN RATE: <span style={{color: '#e2e8f0'}}>68.5%</span></div>
              <div>DAILY VOL: <span style={{color: '#e2e8f0'}}>$2.5M</span></div>
              <div>OPEN POS: <span style={{color: '#e2e8f0'}}>{positions.length}</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Real-time Trade Logs */}
        <div className="ot-box">
          <div className="ot-box-header">REAL-TIME TRADE LOGS</div>
          <div className="ot-box-content">
            {transactions.length > 0 ? transactions.map((tx, i) => (
              <div key={i} className="ot-log-line">
                <span className="ot-log-time">[{new Date(tx.date || Date.now()).toLocaleTimeString()}] &gt;</span> 
                <span className={tx.type?.toLowerCase() === 'buy' ? 'ot-log-buy' : 'ot-log-sell'}>
                  {tx.type?.toUpperCase() || 'TRADE'} EXECUTED:
                </span> 
                {' '}Asset ID: {tx.holding_id?.slice(0, 6) || 'N/A'} @ {tx.price} (Size: {tx.quantity}) 
                {tx.notes && <span> -&gt; <span style={{color: '#38bdf8'}}>{tx.notes}</span></span>}
              </div>
            )) : (
              <div className="ot-log-line" style={{color: '#94a3b8'}}>&gt; Waiting for new trade events...</div>
            )}
          </div>
        </div>

        {/* Bottom Right: Active Positions */}
        <div className="ot-box">
          <div className="ot-box-header">ACTIVE POSITIONS</div>
          <div className="ot-box-content">
            <table className="ot-table">
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>TYPE</th>
                  <th>ENTRY</th>
                  <th>MARK</th>
                  <th>PnL (USDT)</th>
                  <th>SIZE</th>
                  <th>LIQ. PRICE</th>
                </tr>
              </thead>
              <tbody>
                {positions.length > 0 ? positions.map((p, i) => {
                  const pnl = (p.currentPrice - p.avgPrice) * p.quantity;
                  const isProfit = pnl >= 0;
                  return (
                    <tr key={p.id || i}>
                      <td style={{color: '#e2e8f0'}}>{p.symbol}</td>
                      <td className={isProfit ? "ot-long" : "ot-short"}>{isProfit ? "LONG" : "SHORT"}</td>
                      <td>{p.avgPrice ? p.avgPrice.toFixed(2) : "-"}</td>
                      <td>{p.currentPrice ? p.currentPrice.toFixed(2) : "-"}</td>
                      <td className={isProfit ? "ot-long" : "ot-short"}>{isProfit ? "+" : ""}{formatCurrency(pnl || 0)}</td>
                      <td>{p.quantity?.toFixed(2) || "0.00"}</td>
                      <td>{p.avgPrice ? (p.avgPrice * 0.8).toFixed(2) : "-"}</td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={7} style={{textAlign: 'center', padding: '1rem'}}>No active positions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
