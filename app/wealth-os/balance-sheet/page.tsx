"use client"
import React from 'react';
import { Plus, X, Edit2, Trash2, RefreshCw, TrendingUp, TrendingDown, Building2, Wallet, CreditCard, BarChart3 } from 'lucide-react';
import WealthNavbar from '@/components/WealthNavbar';
import { calculateWealth, FALLBACK_FX_RATES } from '@/lib/wealth';

// ─── Types ────────────────────────────────────────────────────────────────────
type FinanceItem = {
  id: string;
  category: 'cash' | 'other_asset' | 'liability';
  label: string;
  amount: number;
  currency: string;
};

type Holding = {
  id: string; symbol: string; name: string; type: string;
  totalValue?: number; totalCost?: number;
};

type ModalMode = 'add' | 'edit' | 'delete' | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur === 'THB' ? 'USD' : cur, maximumFractionDigits: 0 }).format(v);

const THB_TO_USD = 0.028; // approximate — can be replaced with live FX

// `/api/fx` returns the amount of each currency equivalent to 1 USD.
const CATEGORY_META = {
  cash: { label: 'Cash & Liquid Assets', icon: Wallet, color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)' },
  other_asset: { label: 'Investment & Other Assets', icon: Building2, color: '#fcd34d', bg: 'rgba(252,211,77,0.1)' },
  liability: { label: 'Liabilities & Debts', icon: CreditCard, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

// ─── Donut Mini ───────────────────────────────────────────────────────────────
function DonutMini({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  const r = 20, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 26 26)" style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
        {pct.toFixed(0)}%
      </text>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BalanceSheet() {
  const [items, setItems] = React.useState<FinanceItem[]>([]);
  const [holdings, setHoldings] = React.useState<Holding[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [modal, setModal] = React.useState<ModalMode>(null);
  const [selected, setSelected] = React.useState<FinanceItem | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ category: 'cash', label: '', amount: '', currency: 'USD' });
  const [fxRates, setFxRates] = React.useState<Record<string, number>>(FALLBACK_FX_RATES);

  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [fiRes, hRes, fxRes] = await Promise.all([fetch('/api/finance'), fetch('/api/holdings'), fetch('/api/fx', { cache: 'no-store' })]);
      const fiData = await fiRes.json();
      const rawHoldings = await hRes.json();
      const fxData = fxRes.ok ? await fxRes.json() : null;
      let hData = rawHoldings;
      if (Array.isArray(rawHoldings) && rawHoldings.length > 0) {
        try {
          const symbols = [...new Set(rawHoldings.map((h: any) => {
            const symbol = String(h.symbol || '').toUpperCase();
            return h.type === 'crypto' && !symbol.endsWith('-USD') ? symbol + '-USD' : symbol;
          }).filter(Boolean))].join(',');
          const marketRes = symbols ? await fetch('/api/market?symbols=' + encodeURIComponent(symbols) + '&range=1d') : null;
          const market = marketRes?.ok ? await marketRes.json() : {};
          hData = rawHoldings.map((h: any) => {
            const symbol = String(h.symbol || '').toUpperCase();
            const yahoo = h.type === 'crypto' && !symbol.endsWith('-USD') ? symbol + '-USD' : symbol;
            const price = Number(market?.[yahoo]?.currentPrice ?? market?.[symbol]?.currentPrice ?? 0);
            return { ...h, totalValue: price > 0 && Number(h.quantity) > 0 ? price * Number(h.quantity) : Number(h.totalCost || 0) };
          });
        } catch { /* use cost basis if market data is unavailable */ }
      }
      if (Array.isArray(fiData)) setItems(fiData);
      if (Array.isArray(hData)) setHoldings(hData);
      if (fxData?.rates) setFxRates(rates => ({ ...rates, ...fxData.rates, USD: 1 }));
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { loadData(); }, [loadData]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const cashItems = items.filter(i => i.category === 'cash');
  const assetItems = items.filter(i => i.category === 'other_asset');
  const liabItems = items.filter(i => i.category === 'liability');
  const wealth = calculateWealth(items, holdings, fxRates);
  const holdingsVal = wealth.holdingsValue;
  const cashTotal = wealth.cash;
  const otherAssetTotal = wealth.otherAssets;
  const liabTotal = wealth.liabilities;
  const totalAssets = wealth.totalAssets;
  const netWorth = wealth.netWorth;
  const debtRatio = totalAssets > 0 ? (liabTotal / totalAssets) * 100 : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAdd(category: string) {
    setForm({ category, label: '', amount: '', currency: 'USD' });
    setError(''); setModal('add');
  }
  function openEdit(item: FinanceItem) {
    setSelected(item);
    setForm({ category: item.category, label: item.label, amount: String(item.amount), currency: item.currency });
    setError(''); setModal('edit');
  }
  function openDelete(item: FinanceItem) { setSelected(item); setModal('delete'); }
  function closeModal() { setModal(null); setSelected(null); setError(''); }

  async function handleAdd() {
    if (!form.label || !form.amount) { setError('Label and Amount are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/finance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: form.category, label: form.label, amount: parseFloat(form.amount), currency: form.currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      closeModal(); await loadData(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); } finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/finance/${selected.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: form.label, amount: parseFloat(form.amount), currency: form.currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      closeModal(); await loadData(true);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selected) return;
    setSaving(true);
    try { await fetch(`/api/finance/${selected.id}`, { method: 'DELETE' }); closeModal(); await loadData(true); }
    catch { /* silent */ } finally { setSaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bs-page">
      <WealthNavbar />
      <main className="bs-content">

        {/* ── Header ── */}
        <div className="bs-top">
          <div>
            <div className="bs-top-label">Balance Sheet</div>
            <div className="bs-top-date">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <button className="pf-refresh-btn" onClick={() => loadData(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="bs-summary-row">
          {/* Total Assets */}
          <div className="bs-summary-card bs-card-green">
            <div className="bs-summary-icon"><TrendingUp size={20} color="#4ade80" /></div>
            <div>
              <div className="bs-summary-label">Total Assets</div>
              <div className="bs-summary-val">{fmt(totalAssets)}</div>
              <div className="bs-summary-sub">Cash + Investments + Portfolio</div>
            </div>
            <DonutMini value={totalAssets} total={totalAssets + liabTotal} color="#4ade80" />
          </div>

          {/* Total Liabilities */}
          <div className="bs-summary-card bs-card-red">
            <div className="bs-summary-icon"><TrendingDown size={20} color="#f87171" /></div>
            <div>
              <div className="bs-summary-label">Total Liabilities</div>
              <div className="bs-summary-val" style={{ color: '#f87171' }}>{fmt(liabTotal)}</div>
              <div className="bs-summary-sub">Debt ratio: {debtRatio.toFixed(1)}%</div>
            </div>
            <DonutMini value={liabTotal} total={totalAssets} color="#f87171" />
          </div>

          {/* Net Worth */}
          <div className="bs-summary-card bs-card-purple">
            <div className="bs-summary-icon"><BarChart3 size={20} color="#818cf8" /></div>
            <div>
              <div className="bs-summary-label">Net Worth</div>
              <div className="bs-summary-val" style={{ color: netWorth >= 0 ? '#4ade80' : '#f87171' }}>
                {fmt(Math.abs(netWorth))}
              </div>
              <div className="bs-summary-sub">{netWorth >= 0 ? 'Positive net worth ✓' : 'Liabilities exceed assets'}</div>
            </div>
            <DonutMini value={Math.max(netWorth, 0)} total={totalAssets} color="#818cf8" />
          </div>
        </div>

        {/* ── Three Column Layout ── */}
        <div className="bs-columns">

          {/* Cash Column */}
          <div className="bs-column">
            <div className="bs-col-header" style={{ borderColor: '#2dd4bf22' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="bs-col-icon" style={{ background: 'rgba(45,212,191,0.1)' }}><Wallet size={16} color="#2dd4bf" /></div>
                <div>
                  <div className="bs-col-title">Cash & Liquid</div>
                  <div className="bs-col-total" style={{ color: '#2dd4bf' }}>{fmt(cashTotal)}</div>
                </div>
              </div>
              <button className="bs-add-btn" onClick={() => openAdd('cash')} title="Add cash item"><Plus size={14} /></button>
            </div>
            {loading ? <div className="bs-loading">Loading…</div> : (
              <div className="bs-item-list">
                {cashItems.map(item => (
                  <div key={item.id} className="bs-item">
                    <div className="bs-item-label">{item.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="bs-item-amount">{item.currency} {item.amount.toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="pf-action-btn pf-icon-btn" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                        <button className="pf-action-btn pf-icon-btn pf-icon-btn-danger" onClick={() => openDelete(item)}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {cashItems.length === 0 && <div className="bs-empty">No cash items</div>}
              </div>
            )}
          </div>

          {/* Investments Column */}
          <div className="bs-column">
            <div className="bs-col-header" style={{ borderColor: '#fcd34d22' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="bs-col-icon" style={{ background: 'rgba(252,211,77,0.1)' }}><Building2 size={16} color="#fcd34d" /></div>
                <div>
                  <div className="bs-col-title">Investments & Assets</div>
                  <div className="bs-col-total" style={{ color: '#fcd34d' }}>{fmt(otherAssetTotal + holdingsVal)}</div>
                </div>
              </div>
              <button className="bs-add-btn" onClick={() => openAdd('other_asset')} title="Add asset"><Plus size={14} /></button>
            </div>
            <div className="bs-item-list">
              {/* Portfolio holdings group */}
              {holdingsVal > 0 && (
                <div className="bs-item bs-item-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                    <div className="bs-item-label">Investment Portfolio</div>
                  </div>
                  <div className="bs-item-amount" style={{ color: '#818cf8' }}>{fmt(holdingsVal)}</div>
                </div>
              )}
              {/* Manual other assets */}
              {assetItems.map(item => (
                <div key={item.id} className="bs-item">
                  <div className="bs-item-label">{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="bs-item-amount">{item.currency} {item.amount.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="pf-action-btn pf-icon-btn" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                      <button className="pf-action-btn pf-icon-btn pf-icon-btn-danger" onClick={() => openDelete(item)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {assetItems.length === 0 && holdingsVal === 0 && <div className="bs-empty">No investment items</div>}
            </div>
          </div>

          {/* Liabilities Column */}
          <div className="bs-column">
            <div className="bs-col-header" style={{ borderColor: '#f8717122' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="bs-col-icon" style={{ background: 'rgba(248,113,113,0.1)' }}><CreditCard size={16} color="#f87171" /></div>
                <div>
                  <div className="bs-col-title">Liabilities</div>
                  <div className="bs-col-total" style={{ color: '#f87171' }}>{fmt(liabTotal)}</div>
                </div>
              </div>
              <button className="bs-add-btn" onClick={() => openAdd('liability')} title="Add liability"><Plus size={14} /></button>
            </div>
            <div className="bs-item-list">
              {liabItems.map(item => (
                <div key={item.id} className="bs-item">
                  <div className="bs-item-label">{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="bs-item-amount" style={{ color: '#f87171' }}>{item.currency} {item.amount.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="pf-action-btn pf-icon-btn" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                      <button className="pf-action-btn pf-icon-btn pf-icon-btn-danger" onClick={() => openDelete(item)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {liabItems.length === 0 && <div className="bs-empty">No liabilities</div>}
            </div>
          </div>
        </div>

        {/* ── Net Worth Equation ── */}
        <div className="bs-equation">
          <div className="bs-eq-part">
            <div className="bs-eq-label">Total Assets</div>
            <div className="bs-eq-val" style={{ color: '#4ade80' }}>{fmt(totalAssets)}</div>
          </div>
          <div className="bs-eq-op">−</div>
          <div className="bs-eq-part">
            <div className="bs-eq-label">Total Liabilities</div>
            <div className="bs-eq-val" style={{ color: '#f87171' }}>{fmt(liabTotal)}</div>
          </div>
          <div className="bs-eq-op">=</div>
          <div className="bs-eq-part">
            <div className="bs-eq-label">Net Worth</div>
            <div className="bs-eq-val" style={{ color: netWorth >= 0 ? '#4ade80' : '#f87171', fontSize: '1.8rem' }}>
              {fmt(netWorth)}
            </div>
          </div>
        </div>

      </main>

      {/* ── Modal ── */}
      {modal && (
        <div className="pf-modal-overlay" onClick={closeModal}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <div className="pf-modal-header">
              <h3>
                {modal === 'add' && `Add ${CATEGORY_META[form.category as keyof typeof CATEGORY_META]?.label || 'Item'}`}
                {modal === 'edit' && `Edit — ${selected?.label}`}
                {modal === 'delete' && 'Delete Item'}
              </h3>
              <button className="pf-modal-close" onClick={closeModal}><X size={20} /></button>
            </div>

            {(modal === 'add' || modal === 'edit') && (
              <div className="pf-modal-body">
                {modal === 'add' && (
                  <div className="pf-form-row">
                    <label>Category</label>
                    <select className="pf-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      <option value="cash">Cash & Liquid Asset</option>
                      <option value="other_asset">Investment / Other Asset</option>
                      <option value="liability">Liability / Debt</option>
                    </select>
                  </div>
                )}
                <div className="pf-form-row"><label>Label *</label><input className="pf-input" placeholder="e.g. Emergency Fund" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} /></div>
                <div className="pf-form-row"><label>Amount *</label><input className="pf-input" type="number" min="0" step="any" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div className="pf-form-row">
                  <label>Currency</label>
                  <select className="pf-input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">USD</option><option value="THB">THB</option><option value="EUR">EUR</option>
                    <option value="GBP">GBP</option><option value="JPY">JPY</option><option value="SGD">SGD</option>
                  </select>
                </div>
                {error && <div className="pf-error">{error}</div>}
                <div className="pf-modal-actions">
                  <button className="pf-btn-secondary" onClick={closeModal}>Cancel</button>
                  <button className="pf-btn-primary" disabled={saving} onClick={modal === 'add' ? handleAdd : handleEdit}>
                    {saving ? 'Saving…' : modal === 'add' ? 'Add Item' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {modal === 'delete' && (
              <div className="pf-modal-body">
                <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
                  Delete <strong style={{ color: '#fff' }}>{selected?.label}</strong>?
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
