"use client"
import React from 'react';
import { Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Zap, ChevronDown, ChevronUp, BarChart2, TrendingUp, TrendingDown, X } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import WealthNavbar from '@/components/WealthNavbar';

// ─── Types ────────────────────────────────────────────────────────────────────
type NWSnapshot = { id: string; date: string; net_worth: number; total_assets: number; total_liabilities: number };

const PERIOD_LABELS = ['1D', '3M', '6M', '1Y', 'YTD', 'ALL'] as const;
type Period = typeof PERIOD_LABELS[number];

type Holding = {
  id: string;
  symbol: string;
  name: string;
  type: string;
  portfolio: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  totalValue?: number;
  currentPrice?: number;
  transactions?: Transaction[];
};

type Transaction = {
  id: string;
  holding_id: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fees: number;
  date: string;
  notes: string | null;
};

type LivePrice = {
  currentPrice: number;
  changePercent: number;
  currency: string;
  stale?: boolean;
  history?: { date: string; isoDate: string; price: number }[];
};

type ModalMode = 'add-asset' | 'edit-asset' | 'add-tx' | 'delete-confirm' | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  if (!cutoff) return snapshots;
  return snapshots.filter(s => new Date(s.date) >= cutoff!);
}

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

const fmtFull = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
const fmt0 = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
const pct = (val: number) => (val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`);

// Crypto symbol map for Yahoo Finance
function toYahooSymbol(sym: string, type?: string) {
  if (sym.toUpperCase().endsWith('-USD')) return sym;
  if (type === 'crypto' || sym === 'BTC' || sym === 'ETH' || sym === 'SOL') {
    return `${sym}-USD`;
  }
  return sym.toUpperCase();
}

function makeSpark(seed: number) {
  return Array.from({ length: 20 }, (_, i) => ({
    v: 100 + Math.sin(i * 0.5 + seed) * 15 + i * (seed > 5 ? 2 : seed > 2 ? 0.5 : -1),
  }));
}

// ─── HoldingRow ───────────────────────────────────────────────────────────────
function HoldingRow({
  h, idx, livePrices, onEdit, onDelete, onAddTx,
}: {
  h: Holding; idx: number;
  livePrices: Record<string, LivePrice>;
  onEdit: (h: Holding) => void;
  onDelete: (h: Holding) => void;
  onAddTx: (h: Holding) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const yahoo = toYahooSymbol(h.symbol, h.type);
  const live = livePrices[yahoo] || livePrices[h.symbol];
  const livePrice = live?.currentPrice ?? h.currentPrice ?? 0;
  const livePct = live?.changePercent ?? 0;

  // P&L
  const currentVal = livePrice > 0 && h.quantity > 0 ? livePrice * h.quantity : (h.totalValue || h.totalCost || 0);
  const gain = currentVal - (h.totalCost || 0);
  const gainPct = (h.totalCost || 0) > 0 ? (gain / (h.totalCost || 1)) * 100 : 0;
  const isPos = gain >= 0;
  const dayPos = livePct >= 0;

  const spark = makeSpark(idx + 1);
  const hue = (idx * 47) % 360;

  return (
    <>
      <tr className="pf-table-row" onClick={() => setExpanded(!expanded)}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: `hsl(${hue},55%,20%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700, color: `hsl(${hue},80%,70%)`,
            }}>
              {h.symbol.slice(0, 3)}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{h.symbol}</div>
              <div style={{ fontSize: '0.75rem', color: '#475569', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
            </div>
          </div>
        </td>
        <td style={{ textTransform: 'capitalize', color: '#64748b', fontSize: '0.82rem' }}>{h.type}</td>
        <td style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{h.quantity?.toFixed(4) || '—'}</td>
        <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{h.avgCost ? fmt(h.avgCost) : '—'}</td>
        {/* Live Price cell */}
        <td>
          <div style={{ fontSize: '0.87rem', color: '#fff', fontWeight: 500 }}>
            {livePrice > 0 ? fmt(livePrice) : <span style={{ color: '#334155' }}>—</span>}
          </div>
          {live && (
            <div style={{ fontSize: '0.73rem', color: dayPos ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 2 }}>
              {dayPos ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(livePct).toFixed(2)}% today
              {live.stale && <span style={{ color: '#334155', marginLeft: 3 }}>●</span>}
            </div>
          )}
        </td>
        <td style={{ fontWeight: 600, color: '#fff', fontSize: '0.87rem' }}>{fmt0(currentVal)}</td>
        {/* Total P&L */}
        <td>
          <div style={{ color: isPos ? '#4ade80' : '#f87171', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
            {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {pct(gainPct)}
          </div>
          <div style={{ fontSize: '0.75rem', color: isPos ? '#166534' : '#7f1d1d' }}>
            {isPos ? '+' : ''}{fmt(gain)}
          </div>
        </td>
        <td>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button className="pf-action-btn pf-icon-btn" title="Add Transaction" onClick={e => { e.stopPropagation(); onAddTx(h); }}><Plus size={13} /></button>
            <button className="pf-action-btn pf-icon-btn" title="Edit" onClick={e => { e.stopPropagation(); onEdit(h); }}><Edit2 size={13} /></button>
            <button className="pf-action-btn pf-icon-btn pf-icon-btn-danger" title="Delete" onClick={e => { e.stopPropagation(); onDelete(h); }}><Trash2 size={13} /></button>
            {expanded ? <ChevronUp size={13} color="#475569" /> : <ChevronDown size={13} color="#475569" />}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0 }}>
            <div className="pf-expand-panel">
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#64748b', fontSize: '0.78rem', letterSpacing: 1 }}>
                TRANSACTION HISTORY
              </div>
              {h.transactions && h.transactions.length > 0 ? (
                <table className="pf-tx-table">
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Qty</th><th>Price</th><th>Fees</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {h.transactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td><span className={tx.type === 'BUY' ? 'tx-buy' : 'tx-sell'}>{tx.type}</span></td>
                        <td>{Number(tx.quantity).toFixed(4)}</td>
                        <td>{fmt(tx.price)}</td>
                        <td>{fmt(tx.fees || 0)}</td>
                        <td>{fmt(tx.quantity * tx.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ color: '#334155', fontSize: '0.82rem' }}>No transactions yet.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [holdings, setHoldings] = React.useState<Holding[]>([]);
  const [snapshots, setSnapshots] = React.useState<NWSnapshot[]>([]);
  const [period, setPeriod] = React.useState<Period>('ALL');
  const [livePrices, setLivePrices] = React.useState<Record<string, LivePrice>>({});
  const [priceLoading, setPriceLoading] = React.useState(false);
  const [priceError, setPriceError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [modal, setModal] = React.useState<ModalMode>(null);
  const [selectedHolding, setSelectedHolding] = React.useState<Holding | null>(null);
  const [filterPortfolio, setFilterPortfolio] = React.useState<string>('all');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ symbol: '', name: '', type: 'stock', portfolio: 'long_term' });
  const [txForm, setTxForm] = React.useState({ type: 'BUY', quantity: '', price: '', fees: '0', date: new Date().toISOString().slice(0, 10), notes: '' });

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [nwRes, hRes] = await Promise.all([fetch('/api/networth'), fetch('/api/holdings')]);
      const nwData = await nwRes.json();
      const hData = await hRes.json();
      if (Array.isArray(nwData)) setSnapshots(nwData);
      if (Array.isArray(hData)) setHoldings(hData);
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ── Auto-fetch live prices when holdings load ─────────────────────────────
  const fetchPrices = React.useCallback(async (hs: Holding[], p: Period) => {
    if (!hs.length) return;
    setPriceLoading(true);
    setPriceError('');
    try {
      const symbols = [...new Set(hs.map(h => toYahooSymbol(h.symbol, h.type)))].join(',');
      const rangeMap: Record<Period, string> = { '1D': '1d', '3M': '3mo', '6M': '6mo', '1Y': '1y', 'YTD': 'ytd', 'ALL': 'max' };
      const range = rangeMap[p] || '1d';
      const res = await fetch(`/api/market?symbols=${symbols}&range=${range}`);
      const data = await res.json();
      setLivePrices(data || {});
    } catch {
      setPriceError('Unable to fetch live prices');
    } finally {
      setPriceLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (holdings.length > 0) fetchPrices(holdings, period);
  }, [holdings, period, fetchPrices]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const getHoldingValue = (h: Holding) => {
    const yahoo = toYahooSymbol(h.symbol, h.type);
    const live = livePrices[yahoo] || livePrices[h.symbol];
    const livePrice = live?.currentPrice ?? 0;
    return livePrice > 0 && h.quantity > 0 ? livePrice * h.quantity : (h.totalValue || h.totalCost || 0);
  };

  const filtered = filterPortfolio === 'all' ? holdings : holdings.filter(h => h.portfolio === filterPortfolio);
  const retirementHoldings = holdings.filter(h => h.portfolio === 'retirement');
  const longTermHoldings = holdings.filter(h => h.portfolio === 'long_term');
  const shortTermHoldings = holdings.filter(h => h.portfolio === 'short_term');
  const retirementVal = retirementHoldings.reduce((s, h) => s + getHoldingValue(h), 0);
  const longTermVal = longTermHoldings.reduce((s, h) => s + getHoldingValue(h), 0);
  const shortTermVal = shortTermHoldings.reduce((s, h) => s + getHoldingValue(h), 0);
  const totalVal = retirementVal + longTermVal + shortTermVal;
  const displayNetWorth = snapshots.length > 0 ? snapshots[snapshots.length - 1].net_worth : totalVal;

  // Build chart history from filtered holdings
  const historyMap = new Map<string, number>();
  let dates: { date: string; isoDate: string }[] = [];
  
  filtered.forEach(h => {
    const yahoo = toYahooSymbol(h.symbol, h.type);
    const live = livePrices[yahoo] || livePrices[h.symbol];
    if (live?.history && live.history.length > 0) {
      if (dates.length === 0 || live.history.length > dates.length) {
        dates = live.history.map(x => ({ date: x.date, isoDate: x.isoDate }));
      }
      live.history.forEach(hp => {
        const existing = historyMap.get(hp.isoDate) || 0;
        historyMap.set(hp.isoDate, existing + (hp.price * h.quantity));
      });
    }
  });

  const chartData = dates.length > 0 
    ? dates.map(d => ({ date: d.date, value: historyMap.get(d.isoDate) || 0 }))
    : Array.from({ length: 30 }, (_, i) => ({
        date: `Day ${i + 1}`,
        value: (filtered.reduce((s, h) => s + getHoldingValue(h), 0) || 1000) * (0.9 + (i / 30) * 0.1 + Math.sin(i * 0.4) * 0.02),
      }));

  const firstVal = chartData[0]?.value || 0;
  const lastVal = chartData[chartData.length - 1]?.value || 0;
  const periodChange = lastVal - firstVal;
  const periodChangePct = firstVal > 0 ? (periodChange / firstVal) * 100 : 0;
  const isPeriodPos = periodChange >= 0;

  const hasRetirement = retirementHoldings.length > 0;
  const hasLongTerm = longTermHoldings.length > 0;
  const hasShortTerm = shortTermHoldings.length > 0;

  const totalCostAll = holdings.reduce((s, h) => s + (h.totalCost || 0), 0);
  const totalValueAll = holdings.reduce((s, h) => s + getHoldingValue(h), 0);
  const totalGain = totalValueAll - totalCostAll;
  const totalGainPct = totalCostAll > 0 ? (totalGain / totalCostAll) * 100 : 0;

  const sparkData1 = makeSpark(3);
  const sparkData2 = makeSpark(7);
  const sparkData3 = makeSpark(1);
  const sparkDataTotal = makeSpark(5);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAddAsset() { setForm({ symbol: '', name: '', type: 'stock', portfolio: 'long_term' }); setError(''); setModal('add-asset'); }
  function openEdit(h: Holding) { setSelectedHolding(h); setForm({ symbol: h.symbol, name: h.name, type: h.type, portfolio: h.portfolio }); setError(''); setModal('edit-asset'); }
  function openAddTx(h: Holding) { setSelectedHolding(h); setTxForm({ type: 'BUY', quantity: '', price: '', fees: '0', date: new Date().toISOString().slice(0, 10), notes: '' }); setError(''); setModal('add-tx'); }
  function openDelete(h: Holding) { setSelectedHolding(h); setModal('delete-confirm'); }
  function closeModal() { setModal(null); setSelectedHolding(null); setError(''); }

  async function handleAddAsset() {
    if (!form.symbol || !form.name) { setError('Symbol and Name are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/holdings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      closeModal(); await loadData(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); } finally { setSaving(false); }
  }

  async function handleEditAsset() {
    if (!selectedHolding) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/holdings/${selectedHolding.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, type: form.type, portfolio: form.portfolio }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      closeModal(); await loadData(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selectedHolding) return;
    setSaving(true);
    try { await fetch(`/api/holdings/${selectedHolding.id}`, { method: 'DELETE' }); closeModal(); await loadData(true); }
    catch { /* silent */ } finally { setSaving(false); }
  }

  async function handleAddTx() {
    if (!selectedHolding) return;
    if (!txForm.quantity || !txForm.price || !txForm.date) { setError('Quantity, Price, and Date are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdingId: selectedHolding.id, type: txForm.type, quantity: parseFloat(txForm.quantity), price: parseFloat(txForm.price), fees: parseFloat(txForm.fees) || 0, date: txForm.date, notes: txForm.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      closeModal(); await loadData(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); } finally { setSaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="portfolio-page">
      <WealthNavbar />
      <main className="pf-content">

        {/* Top */}
        <div className="pf-top">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2>Total Net Worth</h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <h1>{loading ? <span style={{ opacity: 0.4 }}>Loading…</span> : displayNetWorth !== 0 ? fmt(displayNetWorth) : '$—'}</h1>
                <span className="pf-top-change">↑ +4.5% today</span>
              </div>
              <div className="pf-top-date">
                As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="pf-refresh-btn" onClick={() => fetchPrices(holdings, period)} disabled={priceLoading}>
                <Zap size={14} className={priceLoading ? 'spin' : ''} />
                {priceLoading ? 'Fetching…' : 'Live Prices'}
              </button>
              <button className="pf-refresh-btn" onClick={() => loadData(true)} disabled={refreshing}>
                <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          {priceError && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6, color: '#f97316', fontSize: '0.8rem' }}>
              <AlertCircle size={13} /> {priceError}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="pf-cards">
          {/* Total Portfolio */}
          <div className="pf-card pf-card-total">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
              <div>
                <h3>Total Portfolio</h3>
                <div className="val" style={{ fontSize: '2rem' }}>{fmt(totalValueAll || displayNetWorth)}</div>
                <div className="change" style={{ color: totalGain >= 0 ? '#4ade80' : '#f87171' }}>
                  {totalGain >= 0 ? '▲' : '▼'} {fmt(Math.abs(totalGain))} ({totalGain >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
                </div>
              </div>
              <div style={{ textAlign: 'right', zIndex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#334155', marginBottom: '0.5rem' }}>BREAKDOWN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {hasRetirement && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><span style={{ color: '#facc15' }}>●</span> Retirement: {fmt0(retirementVal)}</div>}
                  {hasLongTerm && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><span style={{ color: '#2dd4bf' }}>●</span> Long-term: {fmt0(longTermVal)}</div>}
                  {hasShortTerm && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}><span style={{ color: '#4ade80' }}>●</span> Short-term: {fmt0(shortTermVal)}</div>}
                  {holdings.length === 0 && <div style={{ fontSize: '0.8rem', color: '#334155' }}>No assets yet</div>}
                </div>
              </div>
            </div>
            <div className="pf-chart pf-chart-total">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkDataTotal}>
                  <defs><linearGradient id="total-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(129,140,248,0.4)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#818cf8" fill="url(#total-grad)" strokeWidth={2} isAnimationActive={false} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Retirement */}
          {hasRetirement && (
            <div className="pf-card pf-card-gold">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div><h3>Retirement Portfolio</h3><div className="val">{fmt0(retirementVal)}</div><div className="change">+8.2% YTD</div></div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(250,204,21,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart2 size={15} color="#facc15" /></div>
              </div>
              <div className="pf-chart pf-chart-gold">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData1}><defs><linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(250,204,21,0.4)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs><Area type="monotone" dataKey="v" stroke="#facc15" fill="url(#gold-grad)" strokeWidth={2} isAnimationActive={false} dot={false} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Long Term */}
          {hasLongTerm && (
            <div className="pf-card pf-card-cyan">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div><h3>Long-term Growth</h3><div className="val">{fmt0(longTermVal)}</div><div className="change">+12.1% YTD</div></div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(45,212,191,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={15} color="#2dd4bf" /></div>
              </div>
              <div className="pf-chart pf-chart-cyan">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData2}><defs><linearGradient id="cyan-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(45,212,191,0.4)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs><Area type="monotone" dataKey="v" stroke="#2dd4bf" fill="url(#cyan-grad)" strokeWidth={2} isAnimationActive={false} dot={false} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Short Term — only shown when has holdings */}
          {hasShortTerm && (
            <div className="pf-card pf-card-green">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <div><h3>Short-term Trading</h3><div className="val">{fmt0(shortTermVal)}</div><div className="change">+2.3% YTD</div></div>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={15} color="#4ade80" /></div>
              </div>
              <div className="pf-chart pf-chart-green">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData3}><defs><linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(74,222,128,0.4)" /><stop offset="100%" stopColor="transparent" /></linearGradient></defs><Area type="monotone" dataKey="v" stroke="#4ade80" fill="url(#green-grad)" strokeWidth={2} isAnimationActive={false} dot={false} /></AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Big Chart Section */}
        <div className="db-chart-section" style={{ marginTop: '1.5rem', background: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.2rem' }}>
                {filterPortfolio === 'all' ? 'Total Portfolio' : filterPortfolio === 'long_term' ? 'Long-term Portfolio' : filterPortfolio === 'short_term' ? 'Short-term Portfolio' : 'Retirement Portfolio'} Value History
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.5rem' }}>
                <span style={{ color: isPeriodPos ? '#4ade80' : '#f87171', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {isPeriodPos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isPeriodPos ? '+' : ''}{fmtFull(Math.abs(periodChange))}
                </span>
                <span style={{ color: isPeriodPos ? '#4ade80' : '#f87171', fontSize: '0.9rem' }}>
                  ({isPeriodPos ? '+' : ''}{periodChangePct.toFixed(2)}%)
                </span>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>in selected period</span>
              </div>
            </div>
            {/* Period selector */}
            <div className="db-period-bar" style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '0.2rem', borderRadius: '8px' }}>
              {PERIOD_LABELS.map(p => (
                <button
                  key={p}
                  style={{
                    background: period === p ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: period === p ? '#fff' : '#64748b',
                    border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ height: 280, width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chart-grad-pf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => '$' + (val / 1000).toFixed(0) + 'k'} width={60} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} fill="url(#chart-grad-pf)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="pf-table-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3>Holdings</h3>
              {priceLoading && <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>⚡ Fetching live prices…</span>}
              {!priceLoading && Object.keys(livePrices).length > 0 && (
                <span style={{ fontSize: '0.75rem', color: '#334155' }}>
                  ● {Object.keys(livePrices).length} prices live
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="pf-filter-group">
                {(['all', 'retirement', 'long_term', 'short_term'] as const).map(p => (
                  <button key={p} className={`pf-filter-btn ${filterPortfolio === p ? 'active' : ''}`} onClick={() => setFilterPortfolio(p)}>
                    {p === 'all' ? 'All' : p === 'long_term' ? 'Long-term' : p === 'short_term' ? 'Short-term' : 'Retirement'}
                  </button>
                ))}
              </div>
              <button className="pf-add-asset-btn" onClick={openAddAsset}><Plus size={15} /> Add Asset</button>
            </div>
          </div>

          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Asset</th><th>Type</th><th>Quantity</th><th>Avg Cost</th>
                  <th>Live Price</th><th>Total Value</th><th>P&amp;L</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#334155' }}>Loading…</td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map((h, i) => (
                    <HoldingRow key={h.id} h={h} idx={i} livePrices={livePrices} onEdit={openEdit} onDelete={openDelete} onAddTx={openAddTx} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                      <div style={{ color: '#334155', marginBottom: '1rem' }}>No assets found.</div>
                      <button className="pf-add-asset-btn" onClick={openAddAsset}><Plus size={14} /> Add your first asset</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="pf-modal-overlay" onClick={closeModal}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-header">
              <h3>
                {modal === 'add-asset' && 'Add New Asset'}
                {modal === 'edit-asset' && `Edit — ${selectedHolding?.symbol}`}
                {modal === 'add-tx' && `Add Transaction — ${selectedHolding?.symbol}`}
                {modal === 'delete-confirm' && 'Delete Asset'}
              </h3>
              <button className="pf-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            {(modal === 'add-asset' || modal === 'edit-asset') && (
              <div className="pf-modal-body">
                {modal === 'add-asset' && (
                  <div className="pf-form-row">
                    <label>Symbol *</label>
                    <input className="pf-input" placeholder="e.g. AAPL, BTC, ETH" value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} />
                  </div>
                )}
                <div className="pf-form-row"><label>Name *</label><input className="pf-input" placeholder="e.g. Apple Inc." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="pf-form-row">
                  <label>Asset Type</label>
                  <select className="pf-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="stock">Stock</option><option value="etf">ETF</option><option value="crypto">Crypto</option>
                    <option value="bond">Bond</option><option value="real_estate">Real Estate</option><option value="cash">Cash</option><option value="other">Other</option>
                  </select>
                </div>
                <div className="pf-form-row">
                  <label>Portfolio</label>
                  <select className="pf-input" value={form.portfolio} onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))}>
                    <option value="long_term">Long-term Growth</option><option value="retirement">Retirement</option><option value="short_term">Short-term Trading</option>
                  </select>
                </div>
                {error && <div className="pf-error">{error}</div>}
                <div className="pf-modal-actions">
                  <button className="pf-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button className="pf-btn-primary" disabled={saving} onClick={modal === 'add-asset' ? handleAddAsset : handleEditAsset}>
                    {saving ? 'Saving…' : modal === 'add-asset' ? 'Add Asset' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {modal === 'add-tx' && (
              <div className="pf-modal-body">
                <div className="pf-form-row">
                  <label>Transaction Type</label>
                  <div className="pf-tx-toggle">
                    <button className={`pf-tx-btn ${txForm.type === 'BUY' ? 'buy-active' : ''}`} onClick={() => setTxForm(f => ({ ...f, type: 'BUY' }))}>BUY</button>
                    <button className={`pf-tx-btn ${txForm.type === 'SELL' ? 'sell-active' : ''}`} onClick={() => setTxForm(f => ({ ...f, type: 'SELL' }))}>SELL</button>
                  </div>
                </div>
                <div className="pf-form-row"><label>Quantity *</label><input className="pf-input" type="number" min="0" step="any" placeholder="0.0000" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                <div className="pf-form-row"><label>Price per unit (USD) *</label><input className="pf-input" type="number" min="0" step="any" placeholder="0.00" value={txForm.price} onChange={e => setTxForm(f => ({ ...f, price: e.target.value }))} /></div>
                {txForm.quantity && txForm.price && (
                  <div className="pf-calc-preview">Total: {fmt(parseFloat(txForm.quantity) * parseFloat(txForm.price))}</div>
                )}
                <div className="pf-form-row"><label>Fees (USD)</label><input className="pf-input" type="number" min="0" step="any" placeholder="0.00" value={txForm.fees} onChange={e => setTxForm(f => ({ ...f, fees: e.target.value }))} /></div>
                <div className="pf-form-row"><label>Date *</label><input className="pf-input" type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div className="pf-form-row"><label>Notes (optional)</label><input className="pf-input" placeholder="e.g. DCA buy" value={txForm.notes} onChange={e => setTxForm(f => ({ ...f, notes: e.target.value }))} /></div>
                {error && <div className="pf-error">{error}</div>}
                <div className="pf-modal-actions">
                  <button className="pf-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button className={`pf-btn-primary ${txForm.type === 'SELL' ? 'sell-btn' : ''}`} disabled={saving} onClick={handleAddTx}>
                    {saving ? 'Saving…' : `Record ${txForm.type}`}
                  </button>
                </div>
              </div>
            )}

            {modal === 'delete-confirm' && (
              <div className="pf-modal-body">
                <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
                  Are you sure you want to delete <strong style={{ color: '#fff' }}>{selectedHolding?.name} ({selectedHolding?.symbol})</strong>?<br />
                  This will also delete all associated transactions.
                </p>
                <div className="pf-modal-actions" style={{ marginTop: '1.5rem' }}>
                  <button className="pf-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button className="pf-btn-danger" disabled={saving} onClick={handleDelete}>{saving ? 'Deleting…' : 'Yes, Delete'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
