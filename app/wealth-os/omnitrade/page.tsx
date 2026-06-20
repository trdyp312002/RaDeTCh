"use client"
import React from 'react';
import Link from 'next/link';

export default function OmniTrade() {
  return (
    <div className="omnitrade-page">
      {/* Header */}
      <header className="ot-header">
        <div className="ot-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          OMNITRADE TERMINAL <span>| WEALTH OS</span>
        </div>
        <div className="ot-user-info">
          <div>23:45:12 UTC | OCT 26, 2024</div>
          <div>USER: ELITE_TRADER | STATUS: <span className="ot-status">CONNECTED</span></div>
          <div style={{width: '28px', height: '28px', background: '#1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <main className="ot-grid">
        {/* Top Left: Bot Status Monitor */}
        <div className="ot-box">
          <div className="ot-box-header">BOT STATUS MONITOR</div>
          <div className="ot-box-content ot-bot-grid">
            <div className="ot-bot-card">
              <h4>ALPHABOT-X: [RUNNING] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></h4>
              <p>Uptime: 24h 12m</p>
              <p>Trades: 342</p>
              <p>PnL: <span className="green">+$4,520.50</span></p>
            </div>
            <div className="ot-bot-card">
              <h4>BETA-HEDGE: [RUNNING] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></h4>
              <p>Uptime: 24h 12m</p>
              <p>Trades: 342</p>
              <p>PnL: <span className="green">+$4,520.50</span></p>
            </div>
            <div className="ot-bot-card">
              <h4>GAMMA-ARB: [RUNNING] <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg></h4>
              <p>Uptime: 24h 12m</p>
              <p>Trades: 342</p>
              <p>PnL: <span className="green">+$4,520.50</span></p>
            </div>
            <div className="ot-bot-card paused">
              <h4>DELTA-SNIPE: [PAUSED]</h4>
              <p>Uptime: 24h 12m</p>
              <p>Trades: 342</p>
              <p>PnL: <span className="green">+$4,520.50</span></p>
            </div>
          </div>
        </div>

        {/* Top Right: Performance Overview */}
        <div className="ot-box">
          <div className="ot-box-header">PERFORMANCE OVERVIEW</div>
          <div className="ot-box-content">
            <div style={{color: '#94a3b8', fontSize: '0.85rem'}}>CUMULATIVE PnL (24H)</div>
            <div style={{fontSize: '2.5rem', fontWeight: 700, color: '#4ade80', margin: '0.5rem 0'}}>+$12,450.20 ↑</div>
            <div className="ot-chart-area">
              <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Simulated zig-zag line showing profit (green) and loss (red) dips */}
                <path d="M0,100 L20,80 L30,90 L40,85 L50,110 L60,115 L70,140 L80,120 L90,130 L100,125 L110,140 L120,130 L130,120 L140,140 L150,130 L160,80 L170,90 L180,85 L200,80 L220,90 L240,70 L260,80 L280,60 L300,70 L320,40 L340,50 L360,20 L380,40 L400,60 L420,50 L440,30 L460,20 L480,40 L500,10" 
                      fill="none" stroke="#4ade80" strokeWidth="2" />
                <path d="M40,85 L50,110 L60,115 L70,140 L80,120 L90,130 L100,125 L110,140 L120,130 L130,120 L140,140 L150,130 L160,80" 
                      fill="none" stroke="#ef4444" strokeWidth="2" />
                <path d="M0,100 L20,80 L30,90 L40,85 L50,110 L60,115 L70,140 L80,120 L90,130 L100,125 L110,140 L120,130 L130,120 L140,140 L150,130 L160,80 L170,90 L180,85 L200,80 L220,90 L240,70 L260,80 L280,60 L300,70 L320,40 L340,50 L360,20 L380,40 L400,60 L420,50 L440,30 L460,20 L480,40 L500,10 L500,150 L0,150 Z" 
                      fill="url(#ot-grad)" />
                <defs>
                   <linearGradient id="ot-grad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor="rgba(74,222,128,0.2)" />
                     <stop offset="100%" stopColor="transparent" />
                   </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="ot-stats">
              <div>WIN RATE: <span style={{color: '#e2e8f0'}}>68.5%</span></div>
              <div>DAILY VOL: <span style={{color: '#e2e8f0'}}>$2.5M</span></div>
              <div>OPEN POS: <span style={{color: '#e2e8f0'}}>8</span></div>
            </div>
          </div>
        </div>

        {/* Bottom Left: Real-time Trade Logs */}
        <div className="ot-box">
          <div className="ot-box-header">REAL-TIME TRADE LOGS</div>
          <div className="ot-box-content">
            <div className="ot-log-line"><span className="ot-log-time">[23:44:55] &gt;</span> <span className="ot-log-buy">BUY ORDER EXECUTED:</span> BTC/USDT @ 34520.50 (Size: 0.5) -&gt; <span style={{color: '#38bdf8'}}>PENDING</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:50] &gt;</span> <span className="ot-log-sell">SELL ORDER FILLED:</span> ETH/USDT @ 1820.25 (Size: 10) -&gt; PnL: <span className="ot-long">+$125.00</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:50] &gt;</span> <span className="ot-log-sell">SELL ORDER FILLED:</span> ETH/USDT @ 1820.25 (Size: 10) -&gt; PnL: <span className="ot-long">+$125.00</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:42] &gt;</span> <span className="ot-log-stop">STOP LOSS TRIGGERED:</span> SOL/USDT @ 98.50 (Size: 50) -&gt; PnL: <span className="ot-short">-$45.50</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:55] &gt;</span> <span className="ot-log-buy">BUY ORDER EXECUTED:</span> BTC/USDT @ 34520.50 (Size: 0.5) -&gt; <span style={{color: '#38bdf8'}}>PENDING</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:50] &gt;</span> <span className="ot-log-sell">SELL ORDER FILLED:</span> ETH/USDT @ 1820.25 (Size: 10) -&gt; PnL: <span className="ot-long">+$125.00</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:42] &gt;</span> <span className="ot-log-stop">STOP LOSS TRIGGERED:</span> SOL/USDT @ 98.50 (Size: 50) -&gt; PnL: <span className="ot-short">-$45.50</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:32] &gt;</span> <span className="ot-log-buy">BUY ORDER EXECUTED:</span> BTC/USDT @ 996.50 (Size: 05) -&gt; <span style={{color: '#38bdf8'}}>PENDING</span></div>
            <div className="ot-log-line"><span className="ot-log-time">[23:44:30] &gt;</span> BOT 'ALPHABOT-X' ADJUSTING PARAMS...</div>
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
                <tr>
                  <td style={{color: '#e2e8f0'}}>BTC/USDT</td>
                  <td className="ot-long">LONG</td>
                  <td>34150.00</td>
                  <td>34520.50</td>
                  <td className="ot-long">+$185.25</td>
                  <td>0.50</td>
                  <td>32000.00</td>
                </tr>
                <tr>
                  <td style={{color: '#e2e8f0'}}>ETH/USDT</td>
                  <td className="ot-short">SHORT</td>
                  <td>1830.00</td>
                  <td>1822.50</td>
                  <td className="ot-long">+$75.00</td>
                  <td>10.00</td>
                  <td>1850.00</td>
                </tr>
                <tr>
                  <td style={{color: '#e2e8f0'}}>SOL/USDT</td>
                  <td className="ot-long">LONG</td>
                  <td>100.50</td>
                  <td>99.20</td>
                  <td className="ot-short">-$65.00</td>
                  <td>50.00</td>
                  <td>95.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
