"use client"
import React from 'react';
import { Bot, Globe, Settings, Activity, RefreshCw, Zap, TrendingUp, TrendingDown, Clock, Save } from 'lucide-react';
import WealthNavbar from '@/components/WealthNavbar';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type NWSnapshot = { id?: string; date: string; net_worth: number; total_assets?: number; total_liabilities?: number };
type Holding = { id: string; symbol: string; name: string; type: string; portfolio: string; totalValue?: number; totalCost?: number };
type FinanceItem = { id: string; category: string; label: string; amount: number; currency: string; };

const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
const fmt0 = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const THB_TO_USD = 0.028; // approx
function toUSD(amount: number, currency: string) {
  if (currency === 'USD') return amount;
  if (currency === 'THB') return amount * THB_TO_USD;
  return amount;
}

const PERIOD_LABELS = ['1D', '3M', '6M', '1Y', 'YTD', 'ALL'] as const;
type Period = typeof PERIOD_LABELS[number];

// ─── Filter snapshots by period ───────────────────────────────────────────────
function filterByPeriod(snapshots: NWSnapshot[], period: Period): NWSnapshot[] {
  if (!snapshots.length) return snapshots;
  const now = new Date();
  let cutoff: Date | null = null;
  if (period === '1D') {
    cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 1);
  } else if (period === '3M') {
    cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 3);
  } else if (period === '6M') {
    cutoff = new Date(now); cutoff.setMonth(cutoff.getMonth() - 6);
  } else if (period === '1Y') {
    cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - 1);
  } else if (period === 'YTD') {
    cutoff = new Date(now.getFullYear(), 0, 1);
  }
  if (!cutoff) return snapshots; // ALL
  return snapshots.filter(s => new Date(s.date) >= cutoff!);
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={{ background: 'rgba(13,17,28,0.96)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 10, padding: '0.65rem 1rem' }}>
      <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 2 }}>{label}</div>
      <div style={{ color: '#2dd4bf', fontWeight: 700, fontSize: '1rem' }}>{fmtFull(val)}</div>
    </div>
  );
}

// ─── Pie Colors ───────────────────────────────────────────────────────────────
const PIE_COLORS = ['#2dd4bf', '#fcd34d', '#818cf8', '#34d399', '#f472b6', '#fb923c', '#4ade80'];
const PIE_LABELS: Record<string, string> = {
  stock: 'Stocks', etf: 'ETFs', crypto: 'Crypto', bond: 'Bonds', real_estate: 'Real Estate', cash: 'Cash', other: 'Other',
};

export default function Dashboard() {
  const [snapshots, setSnapshots] = React.useState<NWSnapshot[]>([]);
  const [holdings, setHoldings] = React.useState<Holding[]>([]);
  const [financeItems, setFinanceItems] = React.useState<FinanceItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [period, setPeriod] = React.useState<Period>('ALL');
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [nwRes, hRes, fRes] = await Promise.all([
        fetch('/api/networth'),
        fetch('/api/holdings'),
        fetch('/api/finance'),
      ]);
      const nwData = await nwRes.json();
      const hData = await hRes.json();
      const fData = await fRes.json();
      if (Array.isArray(nwData)) setSnapshots(nwData);
      if (Array.isArray(hData)) setHoldings(hData);
      if (Array.isArray(fData)) setFinanceItems(fData);
      setLastUpdated(new Date());
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ── Auto-snapshot today's net worth when data loads ───────────────────────
  const autoSaveRef = React.useRef(false);
  React.useEffect(() => {
    if (autoSaveRef.current || loading || (holdings.length === 0 && financeItems.length === 0)) return;
    autoSaveRef.current = true;

    // Calculate true net worth
    const holdingsVal = holdings.reduce((s, h) => s + (h.totalValue || h.totalCost || 0), 0);
    const cashTotal = financeItems.filter(i => i.category === 'cash').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
    const otherAssetsTotal = financeItems.filter(i => i.category === 'other_asset').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
    const liabTotal = financeItems.filter(i => i.category === 'liability').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
    const totalAssets = cashTotal + otherAssetsTotal + holdingsVal;
    const trueNetWorth = totalAssets - liabTotal;

    if (totalAssets === 0 && liabTotal === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    // Only auto-save if no snapshot today yet
    const hasToday = snapshots.some(s => s.date === today);
    if (!hasToday) {
      fetch('/api/networth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, net_worth: trueNetWorth, total_assets: totalAssets, total_liabilities: liabTotal }),
      }).then(() => loadData(true)).catch(() => {});
    }
  }, [loading, holdings, financeItems, snapshots, loadData]);

  // ── Manual save snapshot ─────────────────────────────────────────────────
  async function saveSnapshot() {
    setSaving(true);
    try {
      const holdingsVal = holdings.reduce((s, h) => s + (h.totalValue || h.totalCost || 0), 0);
      const cashTotal = financeItems.filter(i => i.category === 'cash').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
      const otherAssetsTotal = financeItems.filter(i => i.category === 'other_asset').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
      const liabTotal = financeItems.filter(i => i.category === 'liability').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
      const totalAssets = cashTotal + otherAssetsTotal + holdingsVal;
      const trueNetWorth = totalAssets - liabTotal;

      const today = new Date().toISOString().slice(0, 10);
      await fetch('/api/networth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, net_worth: trueNetWorth, total_assets: totalAssets, total_liabilities: liabTotal }),
      });
      await loadData(true);
    } finally {
      setSaving(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const latestNW = snapshots.length > 0 ? snapshots[snapshots.length - 1].net_worth : 0;
  
  // Real-time calculation
  const totalHoldingsVal = holdings.reduce((s, h) => s + (h.totalValue || h.totalCost || 0), 0);
  const liveCash = financeItems.filter(i => i.category === 'cash').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
  const liveOtherAssets = financeItems.filter(i => i.category === 'other_asset').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
  const liveLiabilities = financeItems.filter(i => i.category === 'liability').reduce((s, i) => s + toUSD(i.amount, i.currency), 0);
  const liveAssets = liveCash + liveOtherAssets + totalHoldingsVal;
  const liveNW = liveAssets - liveLiabilities;

  const displayNW = latestNW || liveNW || totalHoldingsVal;

  const filteredSnaps = filterByPeriod(snapshots, period);
  const chartData = filteredSnaps.length >= 2
    ? filteredSnaps.map(s => ({ date: s.date, value: s.net_worth }))
    : Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: (displayNW || 1200000) * (0.9 + (i / 30) * 0.1 + Math.sin(i * 0.4) * 0.02),
      }));

  const firstVal = chartData[0]?.value ?? 0;
  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const periodChange = lastVal - firstVal;
  const periodChangePct = firstVal > 0 ? (periodChange / firstVal) * 100 : 0;
  const isPos = periodChange >= 0;

  const prevNW = snapshots.length > 1 ? snapshots[snapshots.length - 2].net_worth : 0;
  const nwChange = latestNW - prevNW;
  const nwChangePct = prevNW > 0 ? (nwChange / prevNW) * 100 : 0;

  // Allocation by type
  const allocationMap: Record<string, number> = {};
  holdings.forEach(h => {
    const key = h.type || 'other';
    allocationMap[key] = (allocationMap[key] || 0) + (h.totalValue || h.totalCost || 0);
  });
  const allocationData = Object.entries(allocationMap).map(([name, value]) => ({ name: PIE_LABELS[name] || name, value }));

  const topHoldings = [...holdings]
    .sort((a, b) => (b.totalValue || b.totalCost || 0) - (a.totalValue || a.totalCost || 0))
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <WealthNavbar />
      <main className="db-content">

        {/* ── Left Panel ── */}
        <div className="db-panel-left">
          <div className="db-panel-title">
            <span>AI Financial Insights</span>
            <Zap size={16} color="#fcd34d" />
          </div>
          <div className="db-insight-card active">
            <div className="db-insight-icon"><Bot size={22} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>AI Alert</div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6, lineHeight: 1.5 }}>
                Emerging tech sector rally detected. Portfolio rebalance suggested — reduce bonds by 5%.
              </div>
              <div style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 500 }}>+3.5% potential upside</div>
            </div>
          </div>
          <div className="db-insight-card">
            <div className="db-insight-icon" style={{ color: '#38bdf8' }}><Globe size={22} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Market Pulse</div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6, lineHeight: 1.5 }}>
                Global indices showing positive momentum across major markets.
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                S&amp;P 500 <span style={{ color: '#4ade80' }}>+0.8%</span>&nbsp;|&nbsp;
                NASDAQ <span style={{ color: '#4ade80' }}>+1.2%</span>
              </div>
            </div>
          </div>
          <div className="db-insight-card">
            <div className="db-insight-icon" style={{ color: '#10b981' }}><Settings size={22} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Portfolio Optimization</div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6, lineHeight: 1.5 }}>
                Reduce commodities exposure 8%. Increase clean energy ETF allocation.
              </div>
              <div style={{ color: '#fb923c', fontSize: '0.82rem', fontWeight: 500 }}>-2.1% risk reduction</div>
            </div>
          </div>
          <div className="db-insight-card">
            <div className="db-insight-icon" style={{ color: '#818cf8' }}><Activity size={22} /></div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>Volatility Watch</div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6, lineHeight: 1.5 }}>
                VIX below 15 — low volatility. Good conditions for long-term entry.
              </div>
              <div style={{ color: '#818cf8', fontSize: '0.82rem', fontWeight: 500 }}>Risk: Low</div>
            </div>
          </div>
          {lastUpdated && (
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.78rem' }}>
              <Clock size={12} /> Updated {lastUpdated.toLocaleTimeString('th-TH')}
            </div>
          )}
        </div>

        {/* ── Center Panel ── */}
        <div className="db-panel-center">
          <div className="db-center-bg" />

          {/* Top row: label + buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 1 }}>
            <div className="db-networth-title">NET WORTH</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="db-refresh-btn" onClick={saveSnapshot} disabled={saving} title="Save today's snapshot">
                <Save size={13} className={saving ? 'spin' : ''} />
              </button>
              <button className="db-refresh-btn" onClick={() => loadData(true)} disabled={refreshing} title="Refresh">
                <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Net Worth value */}
          <div className="db-networth-val" style={displayNW < 0 ? { background: 'none', color: '#f87171', WebkitTextFillColor: '#f87171' } : {}}>
            {loading
              ? <span style={{ opacity: 0.3 }}>Loading…</span>
              : displayNW !== 0 || totalHoldingsVal > 0 || financeItems.length > 0 ? fmtFull(displayNW) : '$—'}
          </div>

          {/* Change vs prev snapshot */}
          <div className="db-networth-change">
            {nwChange >= 0
              ? <><TrendingUp size={15} /><span style={{ color: '#4ade80' }}>+{fmtFull(Math.abs(nwChange))}</span></>
              : <><TrendingDown size={15} /><span style={{ color: '#f87171' }}>-{fmtFull(Math.abs(nwChange))}</span></>}
            <span style={{ color: nwChangePct >= 0 ? '#4ade80' : '#f87171' }}>
              ({nwChangePct >= 0 ? '+' : ''}{nwChangePct.toFixed(2)}%)
            </span>
            <span style={{ color: '#475569', fontSize: '0.8rem' }}>vs prev snapshot</span>
          </div>

          {/* Breakdown / Equation Mini */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1rem', borderRadius: 10 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Total Assets</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#4ade80' }}>{fmtFull(liveAssets)}</div>
            </div>
            <div style={{ color: '#475569' }}>−</div>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Liabilities</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f87171' }}>{fmtFull(liveLiabilities)}</div>
            </div>
          </div>

          {/* Period selector */}
          <div className="db-period-bar">
            {PERIOD_LABELS.map(p => (
              <button
                key={p}
                className={`db-period-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Period P&L badge */}
          <div className="db-period-pnl">
            <span style={{ color: isPos ? '#4ade80' : '#f87171' }}>
              {isPos ? '▲' : '▼'} {fmtFull(Math.abs(periodChange))}
            </span>
            <span style={{ color: isPos ? '#4ade80' : '#f87171' }}>
              ({isPos ? '+' : ''}{periodChangePct.toFixed(2)}%)
            </span>
            <span style={{ color: '#475569', fontSize: '0.78rem' }}>
              {filteredSnaps.length >= 2 ? `${filteredSnaps.length} snapshots` : 'estimated'}
            </span>
          </div>

          {/* Chart */}
          <div className="db-chart-section">
            <div className="db-chart-placeholder" style={{ border: 'none', background: 'transparent' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip content={<ChartTooltip />} />
                  {firstVal > 0 && (
                    <ReferenceLine y={firstVal} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 3" />
                  )}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={isPos ? '#2dd4bf' : '#f87171'}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: isPos ? '#2dd4bf' : '#f87171', stroke: 'none' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Snapshot count info */}
          <div style={{ fontSize: '0.72rem', color: '#334155', zIndex: 1, marginTop: '0.5rem' }}>
            {snapshots.length > 0
              ? `${snapshots.length} total snapshots · auto-saved daily`
              : 'No snapshots yet — add assets to begin tracking'}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="db-panel-right">
          <div className="db-panel-title"><span>Asset Allocation</span></div>

          {/* Pie */}
          <div style={{ height: 185, position: 'relative', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData.length > 0 ? allocationData : [
                    { name: 'Stocks', value: 45 }, { name: 'Real Estate', value: 25 },
                    { name: 'Crypto', value: 15 }, { name: 'Bonds', value: 10 }, { name: 'Cash', value: 5 },
                  ]}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value" stroke="none" paddingAngle={2}
                >
                  {(allocationData.length > 0 ? allocationData : [1, 2, 3, 4, 5]).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgba(13,17,28,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569' }}>TOTAL</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{fmt0(totalHoldingsVal || displayNW)}</div>
            </div>
          </div>

          {/* Legend */}
          {allocationData.length > 0 && (
            <div className="db-alloc-legend">
              {allocationData.map((item, i) => {
                const pct = totalHoldingsVal > 0 ? ((item.value / totalHoldingsVal) * 100).toFixed(1) : '0';
                return (
                  <div key={i} className="db-alloc-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <span style={{ color: '#475569', fontSize: '0.76rem' }}>{pct}%</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{fmt0(item.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="db-panel-title" style={{ marginTop: '1rem', flexShrink: 0 }}><span>Top Holdings</span></div>
          <div className="db-asset-list">
            {topHoldings.length > 0 ? (
              topHoldings.map((h, i) => (
                <div key={h.id} className="db-asset-item">
                  <div className="db-asset-label">
                    <div className="db-asset-dot" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{h.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: '#475569', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{fmt0(h.totalValue || h.totalCost || 0)}</div>
                </div>
              ))
            ) : (
              <div style={{ color: '#334155', fontSize: '0.82rem', textAlign: 'center', padding: '0.75rem' }}>
                Add assets in the Portfolio page.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FAB */}
      <div className="db-fab">
        <span>AI Assistant Active</span>
        <div className="db-fab-dot" />
      </div>
    </div>
  );
}
