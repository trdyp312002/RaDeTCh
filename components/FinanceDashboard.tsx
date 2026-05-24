"use client"

import { useState, useMemo } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, CartesianGrid
} from "recharts"
import InvestmentDashboard from "./InvestmentDashboard"

type FinanceData = Record<string, string[][]>

// ─── Numeric Parsing Helpers ──────────────────────────────────────────────────
function cleanNum(val: string): number {
  if (!val) return 0
  // Remove currency symbols, commas, spaces
  const clean = val.replace(/[$,฿\s,]/g, "")
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function cleanPercent(val: string): number {
  if (!val) return 0
  const clean = val.replace(/[%\s,]/g, "")
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

// ─── Curated Soft Colors ──────────────────────────────────────────────────────
const COLORS = [
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6"  // Violet
]

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = "$" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 text-white px-3.5 py-2.5 rounded-xl border border-gray-800 shadow-2xl backdrop-blur-md text-xs">
        {label && <p className="text-gray-400 font-mono mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="font-semibold font-mono">
              {prefix}{entry.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function FinanceDashboard({ data }: { data: FinanceData }) {
  // Hardcode unified tab layout: Personal Finance overview, SQLite Investments, and Sheets worksheets
  const sheetTabs = Object.keys(data).filter(k => data[k] && data[k].length > 0)
  const tabs = useMemo(() => ["Personal Finance", "Investments", ...sheetTabs], [sheetTabs])
  const [activeTab, setActiveTab] = useState("Personal Finance")

  // ─── Data Parsers ───────────────────────────────────────────────────────────

  // 1. Long-term / Short-term / Store of Wealth parser helper
  const parseSheetHoldings = (sheetName: string) => {
    const currentData = data[sheetName] || []
    const holdings: any[] = []
    const summary: any = { totalValue: "0", totalCost: "0", pnl: "0", pnlPercent: "0%" }
    const portfolioSummary: any[] = []

    currentData.forEach((row, rowIndex) => {
      const type = row[0]?.trim() || ""
      const portfolio = row[1]?.trim() || ""
      const assetName = row[2]?.trim() || ""

      if (
        type &&
        type !== "ประเภท" &&
        !type.includes("STOCK") &&
        assetName &&
        assetName !== "ชื่อหุ้น/สินทรัพย์" &&
        assetName !== "กำไร/ขาดทุน"
      ) {
        holdings.push({
          type,
          portfolio,
          asset: assetName,
          costPrice: row[3] || "0",
          quantity: row[4] || "0",
          price: row[5] || "0",
          currentValue: row[6] || "0",
          costValue: row[7] || "0",
          pnl: row[8] || "0",
          pnlPercent: row[9] || "0%",
          currentValueUSD: row[10] || "0"
        })
      }

      row.forEach((cell, cellIndex) => {
        const trimmed = cell?.trim()
        if (trimmed === "มูลค่าปัจจุบัน" && cellIndex >= 11) {
          summary.totalValue = row[cellIndex + 1] || "0"
        } else if (trimmed === "ต้นทุน" && cellIndex >= 11) {
          summary.totalCost = row[cellIndex + 1] || "0"
        } else if (trimmed === "กำไร/ขาดทุน" && cellIndex >= 11) {
          summary.pnl = row[cellIndex + 1] || "0"
          summary.pnlPercent = row[cellIndex + 2] || "0%"
        } else if (trimmed === "พอร์ต" && cellIndex >= 11) {
          let idx = rowIndex + 1
          while (currentData[idx] && currentData[idx][cellIndex]?.trim()) {
            portfolioSummary.push({
              portfolio: currentData[idx][cellIndex].trim(),
              currentValue: currentData[idx][cellIndex + 1] || "0",
              cost: currentData[idx][cellIndex + 2] || "0",
              pnl: currentData[idx][cellIndex + 3] || "0",
              pnlPercent: currentData[idx][cellIndex + 4] || "0%"
            })
            idx++
          }
        }
      })
    })

    return { holdings, summary, portfolioSummary }
  }

  // Parse current active sheet holdings dynamically
  const parsedHoldings = useMemo(() => {
    if (activeTab === "Personal Finance" || activeTab === "Investments" || activeTab === "BTC transaction" || activeTab === "Personal Financial Statement") {
      return { holdings: [], summary: { totalValue: "0", totalCost: "0", pnl: "0", pnlPercent: "0%" }, portfolioSummary: [] }
    }
    return parseSheetHoldings(activeTab)
  }, [data, activeTab])

  // 2. BTC transaction parser
  const parsedBtc = useMemo(() => {
    const sheetName = "BTC transaction"
    const currentData = data[sheetName] || []
    const transactions: any[] = []
    const dashboard: any = {
      totalBtc: "0",
      profit: "0",
      totalInvested: "0",
      portfolioValue: "0",
      avgPnl: "0%",
      avgPrice: "0",
      btcPrice: "0"
    }

    currentData.forEach((row, rowIndex) => {
      const exchange = row[0]?.trim() || ""
      const date = row[1]?.trim() || ""
      const btcAmount = row[2]?.trim() || ""

      if (exchange && exchange !== "Exchange" && date && btcAmount && !btcAmount.includes("Exchange") && !btcAmount.includes("BTC Amount")) {
        transactions.push({
          exchange,
          date,
          btcAmount,
          priceUsd: row[3] || "0",
          usdPaid: row[4] || "0",
          currentValue: row[5] || "0",
          pnl: row[6] || "0%"
        })
      }

      row.forEach((cell, cellIndex) => {
        const trimmed = cell?.trim()
        const val = row[cellIndex + 1]?.trim() || "0"

        if (trimmed === "Total BTC to date") {
          dashboard.totalBtc = val
        } else if (trimmed === "Total Invested") {
          dashboard.totalInvested = val
        } else if (trimmed === "Value BTC Portfolio") {
          dashboard.portfolioValue = val
        } else if (trimmed === "Average P/L") {
          dashboard.avgPnl = val
        } else if (trimmed === "Average Price") {
          dashboard.avgPrice = val
        } else if (trimmed === "BTC Price") {
          dashboard.btcPrice = val
        }

        if (trimmed === "Profit/Loss" && cellIndex >= 7) {
          dashboard.profit = val
        }
      })
    })

    return { transactions, dashboard }
  }, [data])

  // 3. Personal Financial Statement parser
  const parsedPfs = useMemo(() => {
    const sheetName = "Personal Financial Statement"
    const currentData = data[sheetName] || []
    const assets: { label: string; amount: string }[] = []
    const debts: { label: string; amount: string }[] = []
    const income: { label: string; amount: string }[] = []
    const fixedExpenses: { label: string; amount: string }[] = []
    const variableExpenses: { label: string; amount: string }[] = []

    let totalAssets = "฿0.00"
    let totalDebt = "฿0.00"
    let netWorth = "฿0.00"

    let totalIncome = "฿0.00"
    let totalFixedExpenses = "฿0.00"
    let totalVariableExpenses = "฿0.00"
    let remainingMoney = "฿0.00"

    currentData.forEach((row) => {
      // Assets
      const assetLabel = row[0]?.trim() || ""
      const assetVal = row[2]?.trim() || ""
      if (assetLabel && assetLabel !== "ASSET" && assetLabel !== "Liquid Assets" && assetLabel !== "Investment Assets" && assetLabel !== "Personal Assets" && assetLabel !== "PERSONAL BALANCE SHEET") {
        if (assetLabel === "Total Asset") {
          totalAssets = assetVal
        } else if (assetLabel === "NET WORTH") {
          netWorth = row[4]?.trim() || assetVal
        } else {
          assets.push({ label: assetLabel, amount: assetVal || "฿0.00" })
        }
      }

      // Debts
      const debtLabel = row[4]?.trim() || ""
      const debtVal = row[6]?.trim() || ""
      if (debtLabel && debtLabel !== "DEPT" && debtLabel !== "Leverage" && debtLabel !== "NET WORTH") {
        if (debtLabel === "Total Dept") {
          totalDebt = debtVal
        } else {
          debts.push({ label: debtLabel, amount: debtVal || "฿0.00" })
        }
      }

      // Income
      const incCategory = row[8]?.trim() || ""
      const incLabel = row[9]?.trim() || ""
      const incVal = row[10]?.trim() || ""
      if (incCategory === "รวม" && incVal) {
        totalIncome = incVal
      } else if (incCategory === "เหลือ" && incVal) {
        remainingMoney = incVal
      } else if (incLabel && incLabel !== "หัวข้อ") {
        income.push({ label: incLabel, amount: incVal || "฿0.00" })
      }

      // Fixed Expenses
      const fixLabel = row[11]?.trim() || ""
      const fixVal = row[12]?.trim() || ""
      if (fixLabel && fixLabel !== "ค่าใช้จ่ายคงที่") {
        if (fixLabel === "รวม") {
          totalFixedExpenses = fixVal
        } else {
          fixedExpenses.push({ label: fixLabel, amount: fixVal || "฿0.00" })
        }
      }

      // Variable Expenses
      const varLabel = row[14]?.trim() || ""
      const varVal = row[15]?.trim() || ""
      if (varLabel && varLabel !== "ค่าใช้จ่ายไม่คงที่") {
        if (varLabel === "รวม") {
          totalVariableExpenses = varVal
        } else {
          variableExpenses.push({ label: varLabel, amount: varVal || "฿0.00" })
        }
      }
    })

    return {
      assets, debts, income, fixedExpenses, variableExpenses,
      totalAssets, totalDebt, netWorth, totalIncome, totalFixedExpenses, totalVariableExpenses, remainingMoney
    }
  }, [data])

  // ─── Master Overview Preparations ──────────────────────────────────────────

  // Consolidated master asset data compiled from all sheets
  const masterOverviewData = useMemo(() => {
    const longTerm = parseSheetHoldings("Long-term")
    const shortTerm = parseSheetHoldings("Short-term")
    const storeWealth = parseSheetHoldings("Store of Wealth")

    const ltValue = cleanNum(longTerm.summary.totalValue)
    const stValue = cleanNum(shortTerm.summary.totalValue)
    const btcValue = cleanNum(parsedBtc.dashboard.portfolioValue)
    const wealthValue = cleanNum(storeWealth.summary.totalValue)

    // Combined Pie data
    const pieData = [
      { name: "Long-term (US Stock)", value: ltValue },
      { name: "Short-term (Crypto/Assets)", value: stValue },
      { name: "Bitcoin Reserve", value: btcValue },
      { name: "Store of Wealth (Gold/Cash)", value: wealthValue }
    ].filter(d => d.value > 0)

    const totalPortfolioValue = ltValue + stValue + btcValue + wealthValue
    const totalPortfolioCost = cleanNum(longTerm.summary.totalCost) + cleanNum(shortTerm.summary.totalCost) + cleanNum(parsedBtc.dashboard.totalInvested) + cleanNum(storeWealth.summary.totalCost)
    const totalPnl = totalPortfolioValue - totalPortfolioCost
    const totalPnlPercent = totalPortfolioCost > 0 ? (totalPnl / totalPortfolioCost) * 100 : 0

    return {
      pieData,
      totalPortfolioValue,
      totalPortfolioCost,
      totalPnl,
      totalPnlPercent,
      longTerm,
      shortTerm,
      storeWealth
    }
  }, [data, parsedBtc])

  // ─── Sheet Tab Data Preparations ────────────────────────────────────────────

  // Pie chart data for Long/Short holdings
  const allocationPieData = useMemo(() => {
    if (activeTab === "Personal Finance" || activeTab === "Investments" || activeTab === "BTC transaction" || activeTab === "Personal Financial Statement") return []
    return parsedHoldings.holdings
      .map(h => ({
        name: h.asset,
        value: cleanNum(h.currentValue)
      }))
      .filter(d => d.value > 0)
  }, [parsedHoldings, activeTab])

  // Bar chart data for Cost vs Value comparison
  const costVsValueBarData = useMemo(() => {
    if (activeTab === "Personal Finance" || activeTab === "Investments" || activeTab === "BTC transaction" || activeTab === "Personal Financial Statement") return []
    return parsedHoldings.holdings
      .map(h => ({
        name: h.asset,
        Cost: cleanNum(h.costValue),
        Value: cleanNum(h.currentValue)
      }))
      .filter(d => d.Cost > 0 || d.Value > 0)
  }, [parsedHoldings, activeTab])

  // Btc historical / transaction cumulative chart data
  const btcDcaChartData = useMemo(() => {
    if (activeTab !== "BTC transaction" || !parsedBtc) return []
    let cumulativeInvested = 0
    let cumulativeBtc = 0

    const sortedTx = [...parsedBtc.transactions].reverse()

    return sortedTx.map(t => {
      const paid = cleanNum(t.usdPaid)
      const btcAmt = cleanNum(t.btcAmount)
      cumulativeInvested += paid
      cumulativeBtc += btcAmt
      
      const btcPrice = cleanNum(parsedBtc.dashboard.btcPrice) || 70000
      const curValue = cumulativeBtc * btcPrice

      return {
        date: t.date,
        Invested: cumulativeInvested,
        Value: curValue,
        BTC: cumulativeBtc
      }
    })
  }, [parsedBtc, activeTab])

  // ─── Rendering Selectors ────────────────────────────────────────────────────

  const isBtcTab = activeTab === "BTC transaction"
  const isPfsTab = activeTab === "Personal Financial Statement"
  const isInvestmentsTab = activeTab === "Investments"
  const isOverviewTab = activeTab === "Personal Finance"

  if (tabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" id="no-data-view">
        <div className="text-center bg-white border border-gray-100 rounded-3xl p-10 max-w-sm shadow-xl">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-400 text-sm">Could not find any data in your Google Sheet. Check connectivity.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100/80 pt-10 pb-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-semibold text-gray-400 mb-2">Unified Wealth Manager</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              📊 {activeTab === "Investments" ? "Portfolio Tracker" : "Personal Finance Dashboard"}
            </h1>
            <p className="text-gray-400 text-xs mt-1.5 max-w-xl">
              {activeTab === "Investments" 
                ? "Real-time pricing tracking, transaction histories, US stock allocations, and local SQLite data ledger."
                : "Automatic sync with Google Sheets Assets. Dynamic Recharts visualizations, interactive portfolio metrics, and a full Balance Sheet analyzer."
              }
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Connected
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        
        {/* Navigation Tabs */}
        <nav className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-gray-200/60 hide-scrollbar" id="dashboard-navigation">
          {tabs.map((tab) => (
            <button
              key={tab}
              id={`tab-btn-${tab.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all shadow-sm ${
                activeTab === tab
                  ? "bg-gray-900 text-white shadow-md scale-102"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-950 border border-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* ─── A. OVERVIEW MASTER DASHBOARD TAB ─── */}
        {isOverviewTab && (
          <div className="space-y-8 animate-fadeIn" id="overview-dashboard">
            
            {/* Master Net Worth Banner */}
            <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-semibold mb-2">Master Net Worth Summary</p>
                <h2 className="text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
                  {parsedPfs.netWorth}
                </h2>
                <p className="text-xs text-gray-300 mt-2 max-w-lg">
                  Reflected in Thai Baht (฿). This represents your net liquidity and investment capital after subtracting your SPaylator, SEasyCash, and bank debt leverages.
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 min-w-[140px] text-right">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">Total Assets</p>
                  <p className="text-sm font-bold font-mono text-emerald-400">{parsedPfs.totalAssets}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 min-w-[140px] text-right">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">Total Liabilities</p>
                  <p className="text-sm font-bold font-mono text-rose-400">{parsedPfs.totalDebt}</p>
                </div>
              </div>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Investments Summary */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Portfolio Valuation</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 font-mono">
                    ${masterOverviewData.totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-2 inline-block ${
                    masterOverviewData.totalPnl >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {masterOverviewData.totalPnl >= 0 ? "+" : ""}{masterOverviewData.totalPnlPercent.toFixed(2)}% ROI
                  </span>
                </div>
                <button 
                  onClick={() => setActiveTab("Long-term")}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-4 text-left flex items-center gap-1.5"
                >
                  Explore Holdings →
                </button>
              </div>

              {/* Monthly Savings buffer */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Monthly Inflow Buffer</p>
                  <h3 className="text-3xl font-extrabold text-gray-900 font-mono">
                    {parsedPfs.remainingMoney}
                  </h3>
                  <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                    Earnings Reserve Left
                  </span>
                </div>
                <button 
                  onClick={() => setActiveTab("Personal Financial Statement")}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-4 text-left flex items-center gap-1.5"
                >
                  View Cashflow Sheet →
                </button>
              </div>

              {/* BTC Dashboard Summary */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">DCA Bitcoin Reserve</p>
                  <h3 className="text-3xl font-extrabold text-orange-500 font-mono">
                    {parsedBtc.dashboard.totalBtc} BTC
                  </h3>
                  <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                    Value: ${parsedBtc.dashboard.portfolioValue}
                  </span>
                </div>
                <button 
                  onClick={() => setActiveTab("BTC transaction")}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-4 text-left flex items-center gap-1.5"
                >
                  View DCA Ledger →
                </button>
              </div>

            </div>

            {/* Split Visuals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Pie Allocation */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[360px] lg:col-span-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 mb-1">Master Portfolio Weight Allocation</h4>
                  <p className="text-[11px] text-gray-400 mb-6">Percentage weighting consolidating all US Stocks, Crypto, Bitcoin, and cash wealth reserves.</p>
                </div>
                <div className="h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={masterOverviewData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {masterOverviewData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        iconSize={10} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: "10px", paddingTop: "15px" }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Jump Sections summary cards */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 mb-4">Financial Sections</h4>
                  
                  <div className="space-y-3">
                    {[
                      { tab: "Long-term", label: "Long-term US Stocks", value: masterOverviewData.longTerm.summary.totalValue, pnl: masterOverviewData.longTerm.summary.pnlPercent, color: "bg-indigo-50 text-indigo-700" },
                      { tab: "Short-term", label: "Short-term Assets", value: masterOverviewData.shortTerm.summary.totalValue, pnl: masterOverviewData.shortTerm.summary.pnlPercent, color: "bg-teal-50 text-teal-700" },
                      { tab: "BTC transaction", label: "DCA Bitcoin Ledger", value: parsedBtc.dashboard.portfolioValue, pnl: parsedBtc.dashboard.avgPnl, color: "bg-orange-50 text-orange-700" },
                      { tab: "Store of Wealth", label: "Gold & Bank Cash", value: masterOverviewData.storeWealth.summary.totalValue, pnl: masterOverviewData.storeWealth.summary.pnlPercent, color: "bg-emerald-50 text-emerald-700" }
                    ].map((sec, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveTab(sec.tab)}
                        className="flex justify-between items-center p-3.5 border border-gray-100 hover:border-indigo-100 hover:bg-gray-50 rounded-2xl cursor-pointer transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">{sec.label}</p>
                          <span className={`text-[8.5px] font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block ${sec.color}`}>
                            {sec.pnl} ROI
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-800">${sec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Click on any section card to view detail sheet</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── B. SQLITE INVESTMENTS TAB integration ─── */}
        {isInvestmentsTab && (
          <div className="animate-fadeIn" id="sqlite-investments-panel">
            <InvestmentDashboard />
          </div>
        )}

        {/* ─── C. STANDARD SHEETS TAB VIEW (Long-term, Short-term, Store of Wealth) ─── */}
        {!isBtcTab && !isPfsTab && !isInvestmentsTab && !isOverviewTab && (
          <div className="space-y-8" id="portfolio-tab-view">
            
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Valuation</p>
                <h3 className="text-3xl font-extrabold text-gray-900 font-mono">
                  ${parsedHoldings.summary.totalValue || "0.00"}
                </h3>
                <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  Current Assets
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Cost Basis</p>
                <h3 className="text-3xl font-extrabold text-gray-900 font-mono">
                  ${parsedHoldings.summary.totalCost || "0.00"}
                </h3>
                <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full font-medium mt-2 inline-block">
                  Principal Cost
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Net Gain / Loss</p>
                <h3 className={`text-3xl font-extrabold font-mono ${
                  cleanNum(parsedHoldings.summary.pnl) >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}>
                  {cleanNum(parsedHoldings.summary.pnl) >= 0 ? "+" : ""}${parsedHoldings.summary.pnl || "0.00"}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-2 inline-block ${
                  cleanNum(parsedHoldings.summary.pnl) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {parsedHoldings.summary.pnlPercent || "0.00%"} ROI
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Unique Holdings</p>
                <h3 className="text-3xl font-extrabold text-gray-900 font-mono">
                  {parsedHoldings.holdings.length}
                </h3>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  Diversified
                </span>
              </div>
            </div>

            {/* Charts Section */}
            {allocationPieData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="portfolio-charts">
                
                {/* Allocation Donut Chart */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                  <div>
                    <h4 className="text-sm font-bold text-gray-950 mb-1">Asset Allocation Weight</h4>
                    <p className="text-[11px] text-gray-400 mb-6">Percentage weighting based on current market valuation.</p>
                  </div>
                  <div className="h-64 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {allocationPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                          verticalAlign="bottom" 
                          iconSize={10} 
                          iconType="circle"
                          wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost vs Value Comparison */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                  <div>
                    <h4 className="text-sm font-bold text-gray-950 mb-1">Asset Cost Basis vs Market Value</h4>
                    <p className="text-[11px] text-gray-400 mb-6">Comparison of primary capital investment vs current valuation.</p>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={costVsValueBarData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Bar dataKey="Cost" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={18} />
                        <Bar dataKey="Value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* Split Data Grid: Asset Table & Portfolio breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Asset Holdings Table */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm lg:col-span-2 overflow-hidden">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Detailed Holdings Grid</h4>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-100">
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset</th>
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Cost</th>
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Qty</th>
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">NAV</th>
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Current Value</th>
                        <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsedHoldings.holdings.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-55 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-gray-850">
                            <div>
                              <span>{h.asset}</span>
                              <span className="text-[10px] font-medium text-gray-400 block mt-0.5">{h.type} • {h.portfolio}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-700 text-right">${h.costPrice}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-700 text-right">{h.quantity}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-700 text-right">${h.price}</td>
                          <td className="px-6 py-4 text-sm font-semibold font-mono text-gray-800 text-right">${h.currentValue}</td>
                          <td className={`px-6 py-4 text-sm font-bold font-mono text-right ${
                            cleanNum(h.pnl) >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}>
                            <div>
                              <span>{cleanNum(h.pnl) >= 0 ? "+" : ""}${h.pnl}</span>
                              <span className="text-[9px] block font-semibold mt-0.5">{h.pnlPercent}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Portfolio Summaries Card */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Portfolio Summaries</h4>
                  
                  {parsedHoldings.portfolioSummary.length > 0 ? (
                    <div className="space-y-4">
                      {parsedHoldings.portfolioSummary.map((p, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-2xl p-4.5 hover:border-gray-200 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">{p.portfolio}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cleanNum(p.pnl) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            }`}>
                              {p.pnlPercent}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Value</p>
                              <p className="font-bold text-gray-850 font-mono mt-0.5">${p.currentValue}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">Invested</p>
                              <p className="font-bold text-gray-850 font-mono mt-0.5">${p.cost}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs">
                      No multi-portfolio summarized segments found.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-5 mt-6">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Performance Target</span>
                    <span>100% Target Met</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ─── D. BTC TRANSACTION DASHBOARD VIEW ─── */}
        {isBtcTab && parsedBtc && (
          <div className="space-y-8" id="btc-dashboard-view">
            
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">BTC Market Rate</p>
                <h3 className="text-2xl font-extrabold text-orange-500 font-mono">
                  {parsedBtc.dashboard.btcPrice}
                </h3>
                <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  Live Index
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Portfolio Valuation</p>
                <h3 className="text-2xl font-extrabold text-gray-900 font-mono">
                  ${parsedBtc.dashboard.portfolioValue}
                </h3>
                <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  Market Value
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total BTC Owned</p>
                <h3 className="text-2xl font-extrabold text-gray-900 font-mono">
                  {parsedBtc.dashboard.totalBtc}
                </h3>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">
                  Accumulated BTC
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Dollars Paid</p>
                <h3 className="text-2xl font-extrabold text-gray-900 font-mono">
                  {parsedBtc.dashboard.totalInvested}
                </h3>
                <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full font-semibold mt-2 inline-block">
                  Capital Principal
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">DCA Average Entry</p>
                <h3 className="text-2xl font-extrabold text-gray-950 font-mono">
                  {parsedBtc.dashboard.avgPrice}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold mt-2 inline-block ${
                  cleanNum(parsedBtc.dashboard.profit) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {parsedBtc.dashboard.avgPnl} Yield
                </span>
              </div>
            </div>

            {/* DCA Area Chart */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-950 mb-1">DCA Investment Accumulation</h4>
                <p className="text-[11px] text-gray-400 mb-6">Visualizing cumulative cash investment (USD) against expanding Bitcoin value over transaction intervals.</p>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={btcDcaChartData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Area type="monotone" dataKey="Invested" name="USD Cumulative Invested" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
                    <Area type="monotone" dataKey="Value" name="BTC Cumulative Value" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transactions History Grid */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm overflow-hidden">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Historical Transactions</h4>
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exchange</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">BTC Amount</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Purchase Price (USD)</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">USD Principal</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Current Value</th>
                      <th className="px-6 py-4.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Performance Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-mono text-xs">
                    {parsedBtc.transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-gray-55 transition-colors">
                        <td className="px-6 py-4 font-sans font-semibold text-gray-800">{t.exchange}</td>
                        <td className="px-6 py-4 text-gray-500">{t.date}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{t.btcAmount}</td>
                        <td className="px-6 py-4 text-right text-gray-700">{t.priceUsd}</td>
                        <td className="px-6 py-4 text-right text-gray-700 font-semibold">{t.usdPaid}</td>
                        <td className="px-6 py-4 text-right text-gray-900 font-bold">{t.currentValue}</td>
                        <td className={`px-6 py-4 text-right font-extrabold ${
                          cleanPercent(t.pnl) >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {cleanPercent(t.pnl) >= 0 ? "+" : ""}{t.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ─── E. PERSONAL FINANCIAL STATEMENT (BALANCE SHEET & DAILY CASHFLOW) ─── */}
        {isPfsTab && parsedPfs && (
          <div className="space-y-10" id="financial-statement-view">
            
            {/* Top Net Worth Card */}
            <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] font-semibold text-gray-400 mb-1">Master Statement</p>
                <h2 className="text-lg font-bold text-gray-950">Net Worth Analysis</h2>
                <p className="text-gray-400 text-xs mt-1">Total Assets subtract Liabilities. Reflected in Thai Baht (฿).</p>
              </div>
              <div className="bg-gray-950 text-white px-8 py-5 rounded-2xl flex flex-col items-end shadow-lg">
                <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Calculated Net Worth</span>
                <span className={`text-3xl font-extrabold font-mono ${
                  cleanNum(parsedPfs.netWorth) >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {parsedPfs.netWorth}
                </span>
              </div>
            </div>

            {/* Three Pillar Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Combined Assets</p>
                <h3 className="text-2xl font-bold text-emerald-600 font-mono">{parsedPfs.totalAssets}</h3>
                <span className="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">Emergency + Investments</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Total Outstanding Debt</p>
                <h3 className="text-2xl font-bold text-rose-600 font-mono">{parsedPfs.totalDebt}</h3>
                <span className="text-[10px] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">Outstanding Liabilities</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Monthly Inflow (Income)</p>
                <h3 className="text-2xl font-bold text-gray-900 font-mono">{parsedPfs.totalIncome}</h3>
                <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-bold mt-2 inline-block">Fixed + Variable Earnings</span>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Cash Reserve Surplus</p>
                <h3 className={`text-2xl font-bold font-mono ${
                  cleanNum(parsedPfs.remainingMoney) >= 0 ? "text-indigo-600" : "text-rose-600"
                }`}>{parsedPfs.remainingMoney}</h3>
                <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full font-medium mt-2 inline-block">End-of-Month Buffer</span>
              </div>
            </div>

            {/* Income vs Expenses Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Assets Allocation Pie Chart */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-xs font-bold text-gray-950 mb-1">Asset Allocation Weight</h4>
                  <p className="text-[10px] text-gray-400 mb-6">Percentage weighting of all liquid and capital asset categories.</p>
                </div>
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={parsedPfs.assets.map(a => ({ name: a.label, value: cleanNum(a.amount) })).filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {parsedPfs.assets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip prefix="฿" />} />
                      <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Allocation Weight */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-xs font-bold text-gray-950 mb-1">Fixed Subscriptions & Expenses</h4>
                  <p className="text-[10px] text-gray-400 mb-6">Breakdown of constant monthly outflows (Netflix, Youtube, TradingView, etc.).</p>
                </div>
                <div className="h-56 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={parsedPfs.fixedExpenses.map(a => ({ name: a.label, value: cleanNum(a.amount) })).filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {parsedPfs.fixedExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip prefix="฿" />} />
                      <Legend verticalAlign="bottom" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Cashflow Bar Comparison */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div>
                  <h4 className="text-xs font-bold text-gray-950 mb-1">Income vs Major Outflow Blocks</h4>
                  <p className="text-[10px] text-gray-400 mb-6">Comparing total earnings against Fixed commitments and Variable spending.</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Monthly Inflows", Amount: cleanNum(parsedPfs.totalIncome), color: "#10b981" },
                        { name: "Fixed Exp.", Amount: cleanNum(parsedPfs.totalFixedExpenses), color: "#f43f5e" },
                        { name: "Variable Exp.", Amount: cleanNum(parsedPfs.totalVariableExpenses), color: "#a855f7" }
                      ]}
                      margin={{ left: -10, right: 10, top: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip prefix="฿" />} />
                      <Bar dataKey="Amount" radius={[4, 4, 0, 0]} barSize={35}>
                        <Cell fill="#10b981" />
                        <Cell fill="#f43f5e" />
                        <Cell fill="#a855f7" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Financial Ledger Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Assets & Liabilities Ledger */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">Liquid & Investment Assets</h4>
                  <div className="space-y-3.5">
                    {parsedPfs.assets.map((a, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{a.label}</span>
                        <span className="font-bold text-gray-900 font-mono">{a.amount}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3.5 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-900">Total Assets</span>
                      <span className="text-emerald-600 font-mono">{parsedPfs.totalAssets}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">Liabilities & Leverage (Debt)</h4>
                  <div className="space-y-3.5">
                    {parsedPfs.debts.map((d, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700">{d.label}</span>
                        <span className="font-bold text-gray-900 font-mono">{d.amount}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3.5 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-900">Total Debts</span>
                      <span className="text-rose-600 font-mono">{parsedPfs.totalDebt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Cashflows List */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                
                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">Monthly Inflows</h4>
                  <div className="space-y-3">
                    {parsedPfs.income.map((i, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-600">{i.label}</span>
                        <span className="font-bold text-gray-900 font-mono">{i.amount}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-800">Total Inflow</span>
                      <span className="text-emerald-600 font-mono">{parsedPfs.totalIncome}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">Fixed Expenses List</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    {parsedPfs.fixedExpenses.map((fe, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="font-semibold text-gray-600">{fe.label}</span>
                        <span className="font-bold text-gray-850 font-mono">{fe.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-50 pt-3 mt-3 flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-800">Total Fixed Commitment</span>
                    <span className="text-rose-600 font-mono">{parsedPfs.totalFixedExpenses}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">Variable Expenses List</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                    {parsedPfs.variableExpenses.map((ve, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="font-semibold text-gray-600">{ve.label}</span>
                        <span className="font-bold text-gray-850 font-mono">{ve.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-50 pt-3 mt-3 flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-800">Total Variable spending</span>
                    <span className="text-rose-600 font-mono">{parsedPfs.totalVariableExpenses}</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
      
      {/* Scrollbar CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scale-102 {
          transform: scale(1.02);
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  )
}
