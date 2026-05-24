"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, CartesianGrid
} from "recharts"
import InvestmentDashboard from "./InvestmentDashboard"

type FinanceData = Record<string, string[][]>

type DBFinanceItem = {
  id: string
  category: "cash" | "other_asset" | "liability"
  label: string
  amount: number
  currency: string
}

type DBMonthlyItem = {
  id: string
  type: "income_fixed" | "income_variable" | "expense_fixed" | "expense_variable"
  label: string
  amount: number
  currency: string
}

// ─── Numeric Parsing Helpers ──────────────────────────────────────────────────
function cleanNum(val: string): number {
  if (!val) return 0
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
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  // Hardcode unified tab layout: Overview, Investments, Monthly Expenses tab, Statement, and Sheets tabs
  const sheetTabs = Object.keys(data).filter(k => k !== "Personal Financial Statement" && data[k] && data[k].length > 0)
  const tabs = useMemo(() => [
    "Personal Finance", 
    "Investments", 
    "Monthly Expenses", 
    "Personal Financial Statement", 
    ...sheetTabs
  ], [sheetTabs])
  
  const [activeTab, setActiveTab] = useState("Personal Finance")

  // ─── SQLite DB States ───────────────────────────────────────────────────────
  const [dbFinanceItems, setDbFinanceItems] = useState<DBFinanceItem[]>([])
  const [dbMonthlyItems, setDbMonthlyItems] = useState<DBMonthlyItem[]>([])
  const [savingState, setSavingState] = useState<Record<string, "saved" | "saving" | "error">>({})

  // Fetch db items on mount
  useEffect(() => {
    fetch("/api/finance")
      .then(res => res.json())
      .then(setDbFinanceItems)
      .catch(console.error)

    fetch("/api/monthly")
      .then(res => res.json())
      .then(setDbMonthlyItems)
      .catch(console.error)
  }, [])

  // Automatically select parameter tab on mount
  useEffect(() => {
    if (tabParam) {
      const found = tabs.find(t => t.toLowerCase() === tabParam.toLowerCase())
      if (found) setActiveTab(found)
    }
  }, [tabParam, tabs])

  // ─── SQLite Mutation Handlers ──────────────────────────────────────────────

  // 1. Finance Items Mutations
  const handleUpdateFinanceItem = async (id: string, field: "label" | "amount", value: any) => {
    setSavingState(prev => ({ ...prev, [id]: "saving" }))
    try {
      const target = dbFinanceItems.find(f => f.id === id)
      if (!target) return
      
      const payload = {
        label: field === "label" ? value : target.label,
        amount: field === "amount" ? parseFloat(value) || 0 : target.amount,
        currency: target.currency
      }

      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Save failed")
      
      const updated = await res.json()
      setDbFinanceItems(prev => prev.map(item => item.id === id ? updated : item))
      setSavingState(prev => ({ ...prev, [id]: "saved" }))
      
      // Auto clear saved status after 2 seconds
      setTimeout(() => {
        setSavingState(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 2000)
    } catch (err) {
      console.error(err)
      setSavingState(prev => ({ ...prev, [id]: "error" }))
    }
  }

  const handleAddFinanceItem = async (category: DBFinanceItem["category"], label: string, amount: number) => {
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label, amount, currency: "THB" })
      })
      if (!res.ok) throw new Error("Add failed")
      const newItem = await res.json()
      setDbFinanceItems(prev => [...prev, newItem])
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteFinanceItem = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setDbFinanceItems(prev => prev.filter(item => item.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  // 2. Monthly Items Mutations
  const handleUpdateMonthlyItem = async (id: string, field: "label" | "amount", value: any) => {
    setSavingState(prev => ({ ...prev, [id]: "saving" }))
    try {
      const target = dbMonthlyItems.find(m => m.id === id)
      if (!target) return

      const payload = {
        type: target.type,
        label: field === "label" ? value : target.label,
        amount: field === "amount" ? parseFloat(value) || 0 : target.amount,
        currency: target.currency
      }

      const res = await fetch(`/api/monthly/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Save failed")
      const updated = await res.json()
      setDbMonthlyItems(prev => prev.map(item => item.id === id ? updated : item))
      setSavingState(prev => ({ ...prev, [id]: "saved" }))

      setTimeout(() => {
        setSavingState(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 2000)
    } catch (e) {
      console.error(e)
      setSavingState(prev => ({ ...prev, [id]: "error" }))
    }
  }

  const handleAddMonthlyItem = async (type: DBMonthlyItem["type"], label: string, amount: number) => {
    try {
      const res = await fetch("/api/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label, amount, currency: "THB" })
      })
      if (!res.ok) throw new Error("Add failed")
      const newItem = await res.json()
      setDbMonthlyItems(prev => [...prev, newItem])
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteMonthlyItem = async (id: string) => {
    try {
      const res = await fetch(`/api/monthly/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      setDbMonthlyItems(prev => prev.filter(item => item.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  // ─── Data Parsers & Syntheses ────────────────────────────────────────────────

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
    if (activeTab === "Personal Finance" || activeTab === "Investments" || activeTab === "Monthly Expenses" || activeTab === "Personal Financial Statement" || activeTab === "BTC transaction") {
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

    currentData.forEach((row) => {
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

  // 3. Synthesized Personal Financial Statement (Calculated from SQLite DB)
  const parsedPfs = useMemo(() => {
    // Group Balance Sheet items
    const cashAssets = dbFinanceItems.filter(f => f.category === "cash")
    const otherAssets = dbFinanceItems.filter(f => f.category === "other_asset")
    const liabilityItems = dbFinanceItems.filter(f => f.category === "liability")

    const totalAssetsVal = [...cashAssets, ...otherAssets].reduce((sum, item) => sum + item.amount, 0)
    const totalDebtVal = liabilityItems.reduce((sum, item) => sum + item.amount, 0)
    const netWorthVal = totalAssetsVal - totalDebtVal

    // Group Monthly cashflow items
    const monthlyIncomeItems = dbMonthlyItems.filter(m => m.type.startsWith("income"))
    const monthlyFixedExpenses = dbMonthlyItems.filter(m => m.type === "expense_fixed")
    const monthlyVariableExpenses = dbMonthlyItems.filter(m => m.type === "expense_variable")

    const totalIncomeVal = monthlyIncomeItems.reduce((sum, item) => sum + item.amount, 0)
    const totalFixedVal = monthlyFixedExpenses.reduce((sum, item) => sum + item.amount, 0)
    const totalVariableVal = monthlyVariableExpenses.reduce((sum, item) => sum + item.amount, 0)
    const totalExpensesVal = totalFixedVal + totalVariableVal
    const remainingMoneyVal = totalIncomeVal - totalExpensesVal

    // Formatters
    const fmtTHB = (num: number) => "฿" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return {
      assets: [
        { title: "Liquid Assets", items: cashAssets },
        { title: "Investment & Personal Assets", items: otherAssets }
      ],
      debts: liabilityItems,
      income: monthlyIncomeItems,
      fixedExpenses: monthlyFixedExpenses,
      variableExpenses: monthlyVariableExpenses,
      
      // Values
      totalAssetsNum: totalAssetsVal,
      totalDebtNum: totalDebtVal,
      netWorthNum: netWorthVal,
      totalIncomeNum: totalIncomeVal,
      totalFixedNum: totalFixedVal,
      totalVariableNum: totalVariableVal,
      remainingMoneyNum: remainingMoneyVal,
      
      // Strings
      totalAssets: fmtTHB(totalAssetsVal),
      totalDebt: fmtTHB(totalDebtVal),
      netWorth: fmtTHB(netWorthVal),
      totalIncome: fmtTHB(totalIncomeVal),
      totalFixedExpenses: fmtTHB(totalFixedVal),
      totalVariableExpenses: fmtTHB(totalVariableVal),
      remainingMoney: fmtTHB(remainingMoneyVal),
      totalExpenses: fmtTHB(totalExpensesVal)
    }
  }, [dbFinanceItems, dbMonthlyItems])

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

  // ─── Form Submission Local Hooks ───────────────────────────────────────────
  const [newExpenseType, setNewExpenseType] = useState<DBMonthlyItem["type"]>("expense_fixed")
  const [newExpenseLabel, setNewExpenseLabel] = useState("")
  const [newExpenseAmount, setNewExpenseAmount] = useState("")

  const [newAssetCategory, setNewAssetCategory] = useState<DBFinanceItem["category"]>("cash")
  const [newAssetLabel, setNewAssetLabel] = useState("")
  const [newAssetAmount, setNewAssetAmount] = useState("")

  const handleAddNewExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExpenseLabel.trim() || !newExpenseAmount) return
    handleAddMonthlyItem(newExpenseType, newExpenseLabel.trim(), parseFloat(newExpenseAmount) || 0)
    setNewExpenseLabel("")
    setNewExpenseAmount("")
  }

  const handleAddNewAsset = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAssetLabel.trim() || !newAssetAmount) return
    handleAddFinanceItem(newAssetCategory, newAssetLabel.trim(), parseFloat(newAssetAmount) || 0)
    setNewAssetLabel("")
    setNewAssetAmount("")
  }

  // ─── Chart Data Computations ────────────────────────────────────────────────

  // Pie chart data for current sheet's holdings allocation
  const allocationPieData = useMemo(() => {
    return parsedHoldings.holdings
      .map(h => ({ name: h.asset, value: cleanNum(h.currentValue) }))
      .filter(d => d.value > 0)
  }, [parsedHoldings])

  // Bar chart: cost basis vs current value per holding
  const costVsValueBarData = useMemo(() => {
    return parsedHoldings.holdings
      .filter(h => cleanNum(h.costValue) > 0 || cleanNum(h.currentValue) > 0)
      .map(h => ({
        name: h.asset.length > 10 ? h.asset.slice(0, 10) + "…" : h.asset,
        Cost: cleanNum(h.costValue),
        Value: cleanNum(h.currentValue)
      }))
  }, [parsedHoldings])

  // Area chart: BTC DCA cumulative investment vs value
  const btcDcaChartData = useMemo(() => {
    let cumInvested = 0
    let cumValue = 0
    return parsedBtc.transactions.map((t, i) => {
      cumInvested += cleanNum(t.usdPaid)
      cumValue += cleanNum(t.currentValue)
      return { date: t.date, Invested: parseFloat(cumInvested.toFixed(2)), Value: parseFloat(cumValue.toFixed(2)) }
    })
  }, [parsedBtc])

  // ─── Rendering Selectors ────────────────────────────────────────────────────

  const isBtcTab = activeTab === "BTC transaction"
  const isPfsTab = activeTab === "Personal Financial Statement"
  const isInvestmentsTab = activeTab === "Investments"
  const isOverviewTab = activeTab === "Personal Finance"
  const isExpensesTab = activeTab === "Monthly Expenses"

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100/80 pt-10 pb-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-semibold text-gray-400 mb-2">Unified Wealth Manager</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              📊 {isInvestmentsTab ? "Portfolio Tracker" : "Personal Finance Dashboard"}
            </h1>
            <p className="text-gray-400 text-xs mt-1.5 max-w-xl">
              {isInvestmentsTab 
                ? "Real-time pricing tracking, transaction histories, US stock allocations, and local SQLite data ledger."
                : "SQLite database backed financial records. Dynamic Recharts visualizations, interactive portfolio metrics, and fully editable spreadsheets."
              }
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            SQLite Active
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

        {/* ─── B. SQLITE INVESTMENTS TAB ─── */}
        {isInvestmentsTab && (
          <div className="animate-fadeIn" id="sqlite-investments-panel">
            <InvestmentDashboard />
          </div>
        )}

        {/* ─── C. INTERACTIVE EDITABLE MONTHLY EXPENSES TAB ─── */}
        {isExpensesTab && parsedPfs && (
          <div className="space-y-8 animate-fadeIn" id="monthly-expenses-editor">
            
            {/* Headers & Overview */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6.5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manage Monthly Subscriptions & Spending</h3>
                <p className="text-xs text-gray-400 mt-0.5">Directly edit labels or figures below. Click outside to trigger instant database save.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-rose-50 text-rose-700 border border-rose-100 px-4 py-2 rounded-2xl text-right">
                  <p className="text-[9px] uppercase tracking-wider font-semibold">Total Expenses</p>
                  <p className="text-base font-extrabold font-mono">{parsedPfs.totalExpenses}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 rounded-2xl text-right">
                  <p className="text-[9px] uppercase tracking-wider font-semibold">Savings Buffer</p>
                  <p className="text-base font-extrabold font-mono">{parsedPfs.remainingMoney}</p>
                </div>
              </div>
            </div>

            {/* Split Grid: Inputs on Left, New Form on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Ledger Lists */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Fixed Commitment list */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest flex items-center justify-between">
                    <span>📌 Fixed Expenses (ค่าใช้จ่ายคงที่)</span>
                    <span className="font-mono text-gray-400 font-normal normal-case text-[10px]">Total: {parsedPfs.totalFixedExpenses}</span>
                  </h4>
                  
                  <div className="divide-y divide-gray-100">
                    {parsedPfs.fixedExpenses.map((fe) => (
                      <div key={fe.id} className="flex justify-between items-center py-3.5 gap-4">
                        <div className="flex-1 flex items-center gap-3">
                          <input 
                            value={fe.label}
                            onChange={(e) => {
                              const v = e.target.value
                              setDbMonthlyItems(prev => prev.map(m => m.id === fe.id ? { ...m, label: v } : m))
                            }}
                            onBlur={(e) => handleUpdateMonthlyItem(fe.id, "label", e.target.value)}
                            className="bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-2.5 py-1 text-sm font-semibold text-gray-700 w-full focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">฿</span>
                            <input 
                              type="number"
                              value={fe.amount}
                              onChange={(e) => {
                                const v = e.target.value
                                setDbMonthlyItems(prev => prev.map(m => m.id === fe.id ? { ...m, amount: parseFloat(v) || 0 } : m))
                              }}
                              onBlur={(e) => handleUpdateMonthlyItem(fe.id, "amount", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-2.5 py-1 text-sm font-bold font-mono text-right text-gray-800 w-24 focus:outline-none"
                            />
                          </div>

                          {/* Save / Delete status */}
                          <div className="w-14 text-center">
                            {savingState[fe.id] === "saving" && <span className="text-[9px] text-indigo-400 animate-pulse">Saving…</span>}
                            {savingState[fe.id] === "saved" && <span className="text-[9px] text-emerald-500 font-bold">✓ Saved</span>}
                            {savingState[fe.id] === "error" && <span className="text-[9px] text-rose-500 font-bold">⚠️ Error</span>}
                            {!savingState[fe.id] && (
                              <button 
                                onClick={() => handleDeleteMonthlyItem(fe.id)}
                                className="text-gray-300 hover:text-rose-500 text-xs leading-none p-1 rounded hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variable Commitments list */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest flex items-center justify-between">
                    <span>⚡ Variable Expenses (ค่าใช้จ่ายไม่คงที่)</span>
                    <span className="font-mono text-gray-400 font-normal normal-case text-[10px]">Total: {parsedPfs.totalVariableExpenses}</span>
                  </h4>
                  
                  <div className="divide-y divide-gray-100">
                    {parsedPfs.variableExpenses.map((ve) => (
                      <div key={ve.id} className="flex justify-between items-center py-3.5 gap-4">
                        <div className="flex-1 flex items-center gap-3">
                          <input 
                            value={ve.label}
                            onChange={(e) => {
                              const v = e.target.value
                              setDbMonthlyItems(prev => prev.map(m => m.id === ve.id ? { ...m, label: v } : m))
                            }}
                            onBlur={(e) => handleUpdateMonthlyItem(ve.id, "label", e.target.value)}
                            className="bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-2.5 py-1 text-sm font-semibold text-gray-700 w-full focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">฿</span>
                            <input 
                              type="number"
                              value={ve.amount}
                              onChange={(e) => {
                                const v = e.target.value
                                setDbMonthlyItems(prev => prev.map(m => m.id === ve.id ? { ...m, amount: parseFloat(v) || 0 } : m))
                              }}
                              onBlur={(e) => handleUpdateMonthlyItem(ve.id, "amount", e.target.value)}
                              className="bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded px-2.5 py-1 text-sm font-bold font-mono text-right text-gray-800 w-24 focus:outline-none"
                            />
                          </div>

                          {/* Save / Delete status */}
                          <div className="w-14 text-center">
                            {savingState[ve.id] === "saving" && <span className="text-[9px] text-indigo-400 animate-pulse">Saving…</span>}
                            {savingState[ve.id] === "saved" && <span className="text-[9px] text-emerald-500 font-bold">✓ Saved</span>}
                            {savingState[ve.id] === "error" && <span className="text-[9px] text-rose-500 font-bold">⚠️ Error</span>}
                            {!savingState[ve.id] && (
                              <button 
                                onClick={() => handleDeleteMonthlyItem(ve.id)}
                                className="text-gray-300 hover:text-rose-500 text-xs leading-none p-1 rounded hover:bg-rose-50 transition-colors"
                                title="Delete"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Expense & Inflow Insertion Panel */}
              <div className="space-y-6">
                
                {/* Form: Add New Outflow Item */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">➕ Add Outflow Item</h4>
                  <form onSubmit={handleAddNewExpense} className="space-y-4">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block font-semibold">Type</label>
                      <select 
                        value={newExpenseType}
                        onChange={(e) => setNewExpenseType(e.target.value as DBMonthlyItem["type"])}
                        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="expense_fixed">Fixed Expense (ค่าใช้จ่ายคงที่)</option>
                        <option value="expense_variable">Variable Expense (ค่าใช้จ่ายไม่คงที่)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block font-semibold">Description</label>
                      <input 
                        value={newExpenseLabel}
                        onChange={(e) => setNewExpenseLabel(e.target.value)}
                        placeholder="Netflix, Water Bill, Traveling…"
                        required
                        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block font-semibold">Amount (THB)</label>
                      <input 
                        type="number"
                        step="any"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-gray-950 hover:bg-slate-800 text-white rounded-2xl py-3 text-xs font-bold transition-all shadow-md mt-2"
                    >
                      Insert Outflow Row
                    </button>
                  </form>
                </div>

                {/* Form: Add New Monthly Inflow */}
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-xs font-extrabold text-gray-900 mb-4 uppercase tracking-widest">➕ Add Monthly Inflow</h4>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault()
                      const desc = (e.currentTarget.elements.namedItem("inflowDesc") as HTMLInputElement).value
                      const val = (e.currentTarget.elements.namedItem("inflowVal") as HTMLInputElement).value
                      if (!desc.trim() || !val) return
                      handleAddMonthlyItem("income_fixed", desc.trim(), parseFloat(val) || 0)
                      e.currentTarget.reset()
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block font-semibold">Description</label>
                      <input 
                        name="inflowDesc"
                        placeholder="Salary, Part-time, Stocks Dividend…"
                        required
                        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1.5 block font-semibold">Amount (THB)</label>
                      <input 
                        type="number"
                        step="any"
                        name="inflowVal"
                        placeholder="0.00"
                        required
                        className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 text-xs font-bold transition-all shadow-md mt-2"
                    >
                      Insert Inflow Row
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ─── D. INTERACTIVE EDITABLE PERSONAL FINANCIAL STATEMENT TAB ─── */}
        {isPfsTab && parsedPfs && (
          <div className="space-y-6 animate-fadeIn" id="pfs-sheet-view">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-blue-300 font-semibold mb-1">Editable Spreadsheet</p>
                <h2 className="text-2xl font-extrabold tracking-tight">Personal Financial Statement</h2>
                <p className="text-xs text-blue-200 mt-1">Click any label or amount to edit. Changes auto-save on blur.</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl text-center">
                  <p className="text-[9px] uppercase tracking-widest text-blue-300 font-semibold mb-0.5">Net Worth</p>
                  <p className={`text-lg font-extrabold font-mono ${parsedPfs.netWorthNum >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{parsedPfs.netWorth}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-5 py-3 rounded-2xl text-center">
                  <p className="text-[9px] uppercase tracking-widest text-blue-300 font-semibold mb-0.5">Monthly Savings</p>
                  <p className={`text-lg font-extrabold font-mono ${parsedPfs.remainingMoneyNum >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{parsedPfs.remainingMoney}</p>
                </div>
              </div>
            </div>

            {/* Main Spreadsheet Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ──── LEFT: PERSONAL BALANCE SHEET ──── */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Sheet Title */}
                <div className="bg-green-700 text-white py-3 px-4 text-sm font-bold text-center uppercase tracking-widest">
                  Personal Balance Sheet
                </div>

                {/* ASSET Section */}
                <div className="bg-green-600 text-white py-2 px-4 text-xs font-bold text-center uppercase tracking-wider">
                  Asset (สินทรัพย์)
                </div>

                {/* Liquid Assets */}
                <div>
                  <div className="bg-green-50 px-4 py-1.5 text-[10px] font-bold text-green-700 uppercase tracking-widest border-b border-green-100">
                    Liquid Assets
                  </div>
                  {parsedPfs.assets[0]?.items.map((asset) => (
                    <div key={asset.id} className="flex items-center border-b border-gray-50 group hover:bg-gray-50 transition-colors">
                      <input
                        value={asset.label}
                        onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, label: v} : f)) }}
                        onBlur={(e) => handleUpdateFinanceItem(asset.id, "label", e.target.value)}
                        className="flex-1 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400"
                      />
                      <input
                        type="number"
                        value={asset.amount}
                        onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                        onBlur={(e) => handleUpdateFinanceItem(asset.id, "amount", e.target.value)}
                        className="w-32 px-3 py-2.5 text-xs font-bold font-mono text-right text-gray-800 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400"
                      />
                      <div className="w-8 flex items-center justify-center">
                        {savingState[asset.id] === "saving" && <span className="text-[8px] text-indigo-400 animate-pulse">…</span>}
                        {savingState[asset.id] === "saved" && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
                        {!savingState[asset.id] && (
                          <button onClick={() => handleDeleteFinanceItem(asset.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[10px] leading-none transition-all" title="Delete">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddFinanceItem("cash", "New Item", 0)}
                    className="w-full text-[10px] text-green-600 hover:text-green-800 hover:bg-green-50 py-2 px-4 text-left font-semibold transition-colors border-b border-gray-100"
                  >
                    + Add Liquid Asset
                  </button>
                </div>

                {/* Investment & Personal Assets */}
                <div>
                  <div className="bg-green-50 px-4 py-1.5 text-[10px] font-bold text-green-700 uppercase tracking-widest border-b border-green-100">
                    Investment &amp; Personal Assets
                  </div>
                  {parsedPfs.assets[1]?.items.map((asset) => (
                    <div key={asset.id} className="flex items-center border-b border-gray-50 group hover:bg-gray-50 transition-colors">
                      <input
                        value={asset.label}
                        onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, label: v} : f)) }}
                        onBlur={(e) => handleUpdateFinanceItem(asset.id, "label", e.target.value)}
                        className="flex-1 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400"
                      />
                      <input
                        type="number"
                        value={asset.amount}
                        onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                        onBlur={(e) => handleUpdateFinanceItem(asset.id, "amount", e.target.value)}
                        className="w-32 px-3 py-2.5 text-xs font-bold font-mono text-right text-gray-800 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400"
                      />
                      <div className="w-8 flex items-center justify-center">
                        {savingState[asset.id] === "saving" && <span className="text-[8px] text-indigo-400 animate-pulse">…</span>}
                        {savingState[asset.id] === "saved" && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
                        {!savingState[asset.id] && (
                          <button onClick={() => handleDeleteFinanceItem(asset.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[10px] leading-none transition-all" title="Delete">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddFinanceItem("other_asset", "New Asset", 0)}
                    className="w-full text-[10px] text-green-600 hover:text-green-800 hover:bg-green-50 py-2 px-4 text-left font-semibold transition-colors border-b border-gray-100"
                  >
                    + Add Investment/Personal Asset
                  </button>
                </div>

                {/* Total Asset Row */}
                <div className="flex items-center bg-blue-700 text-white">
                  <span className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide">Total Asset</span>
                  <span className="w-32 px-3 py-2.5 text-xs font-extrabold font-mono text-right border-l border-blue-600">{parsedPfs.totalAssets}</span>
                  <div className="w-8" />
                </div>

                {/* DEPT Section */}
                <div className="bg-red-600 text-white py-2 px-4 text-xs font-bold text-center uppercase tracking-wider">
                  Dept (หนี้สิน)
                </div>
                <div className="bg-red-50 px-4 py-1.5 text-[10px] font-bold text-red-700 uppercase tracking-widest border-b border-red-100">
                  Leverage (เงินกู้และหนี้สินคงเหลือ)
                </div>

                {parsedPfs.debts.map((debt) => (
                  <div key={debt.id} className="flex items-center border-b border-gray-50 group hover:bg-red-50/40 transition-colors">
                    <input
                      value={debt.label}
                      onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === debt.id ? {...f, label: v} : f)) }}
                      onBlur={(e) => handleUpdateFinanceItem(debt.id, "label", e.target.value)}
                      className="flex-1 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-red-400"
                    />
                    <input
                      type="number"
                      value={debt.amount}
                      onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === debt.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                      onBlur={(e) => handleUpdateFinanceItem(debt.id, "amount", e.target.value)}
                      className="w-32 px-3 py-2.5 text-xs font-bold font-mono text-right text-red-700 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-red-400"
                    />
                    <div className="w-8 flex items-center justify-center">
                      {savingState[debt.id] === "saving" && <span className="text-[8px] text-indigo-400 animate-pulse">…</span>}
                      {savingState[debt.id] === "saved" && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
                      {!savingState[debt.id] && (
                        <button onClick={() => handleDeleteFinanceItem(debt.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[10px] leading-none transition-all" title="Delete">✕</button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleAddFinanceItem("liability", "New Debt", 0)}
                  className="w-full text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 py-2 px-4 text-left font-semibold transition-colors border-b border-gray-100"
                >
                  + Add Liability
                </button>

                {/* Total Dept Row */}
                <div className="flex items-center bg-red-600 text-white">
                  <span className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide">Total Dept</span>
                  <span className="w-32 px-3 py-2.5 text-xs font-extrabold font-mono text-right border-l border-red-500">{parsedPfs.totalDebt}</span>
                  <div className="w-8" />
                </div>

                {/* Net Worth Footer */}
                <div className="flex items-center bg-gray-900 text-white">
                  <span className="flex-1 px-4 py-3 text-sm font-extrabold uppercase tracking-widest">Net Worth</span>
                  <span className={`w-32 px-3 py-3 text-sm font-extrabold font-mono text-right border-l border-gray-700 ${parsedPfs.netWorthNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{parsedPfs.netWorth}</span>
                  <div className="w-8" />
                </div>

              </div>

              {/* ──── RIGHT: DAILY INCOME AND EXPENSES ──── */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

                {/* Sheet Title */}
                <div className="bg-blue-800 text-white py-3 px-4 text-sm font-bold text-center uppercase tracking-widest">
                  Daily Income and Expenses
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-2 bg-gray-100 border-b border-gray-200">
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest border-r border-gray-200">รายรับ (Income)</div>
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">รายจ่าย (Expenses)</div>
                </div>

                {/* Sub Column Headers */}
                <div className="grid grid-cols-2 border-b border-gray-200">
                  {/* Income sub-header */}
                  <div className="bg-green-600 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-r border-gray-200">
                    รายรับคงที่
                  </div>
                  {/* Expense sub-header */}
                  <div className="grid grid-cols-2">
                    <div className="bg-red-100 text-red-700 px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-r border-gray-200">ค่าใช้จ่ายคงที่</div>
                    <div className="bg-red-200 text-red-800 px-3 py-2 text-[10px] font-bold uppercase tracking-widest">ค่าใช้จ่ายไม่คงที่</div>
                  </div>
                </div>

                {/* Income + Expense rows side by side */}
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {/* LEFT: Income rows */}
                  <div className="divide-y divide-gray-50">
                    {parsedPfs.income.map((inc) => (
                      <div key={inc.id} className="flex items-center group hover:bg-green-50/40 transition-colors">
                        <input
                          value={inc.label}
                          onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === inc.id ? {...m, label: v} : m)) }}
                          onBlur={(e) => handleUpdateMonthlyItem(inc.id, "label", e.target.value)}
                          className="flex-1 px-3 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white"
                          placeholder="Income source..."
                        />
                        <input
                          type="number"
                          value={inc.amount}
                          onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === inc.id ? {...m, amount: parseFloat(v)||0} : m)) }}
                          onBlur={(e) => handleUpdateMonthlyItem(inc.id, "amount", e.target.value)}
                          className="w-24 px-2 py-2.5 text-xs font-bold font-mono text-right text-green-800 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white"
                        />
                        <div className="w-6 flex items-center justify-center shrink-0">
                          {savingState[inc.id] === "saving" && <span className="text-[7px] text-indigo-400">…</span>}
                          {savingState[inc.id] === "saved" && <span className="text-[7px] text-emerald-500">✓</span>}
                          {!savingState[inc.id] && (
                            <button onClick={() => handleDeleteMonthlyItem(inc.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-rose-400 text-[9px]" title="Delete">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddMonthlyItem("income_fixed", "New Income", 0)}
                      className="w-full text-[10px] text-green-600 hover:text-green-800 hover:bg-green-50 py-2 px-3 text-left font-semibold transition-colors"
                    >
                      + Add Income
                    </button>
                  </div>

                  {/* RIGHT: Expense columns (Fixed + Variable) */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100">

                    {/* Fixed Expenses */}
                    <div className="divide-y divide-gray-50">
                      {parsedPfs.fixedExpenses.map((fe) => (
                        <div key={fe.id} className="flex items-center group hover:bg-red-50/40 transition-colors">
                          <input
                            value={fe.label}
                            onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === fe.id ? {...m, label: v} : m)) }}
                            onBlur={(e) => handleUpdateMonthlyItem(fe.id, "label", e.target.value)}
                            className="flex-1 px-2 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white min-w-0"
                            placeholder="Expense..."
                          />
                          <input
                            type="number"
                            value={fe.amount}
                            onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === fe.id ? {...m, amount: parseFloat(v)||0} : m)) }}
                            onBlur={(e) => handleUpdateMonthlyItem(fe.id, "amount", e.target.value)}
                            className="w-20 px-2 py-2.5 text-xs font-bold font-mono text-right text-red-700 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white shrink-0"
                          />
                          <div className="w-5 flex items-center justify-center shrink-0">
                            {savingState[fe.id] === "saving" && <span className="text-[7px] text-indigo-400">…</span>}
                            {savingState[fe.id] === "saved" && <span className="text-[7px] text-emerald-500">✓</span>}
                            {!savingState[fe.id] && (
                              <button onClick={() => handleDeleteMonthlyItem(fe.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-rose-400 text-[8px]" title="Delete">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddMonthlyItem("expense_fixed", "New Expense", 0)}
                        className="w-full text-[9px] text-red-500 hover:text-red-700 hover:bg-red-50 py-2 px-2 text-left font-semibold transition-colors"
                      >
                        + Fixed
                      </button>
                    </div>

                    {/* Variable Expenses */}
                    <div className="divide-y divide-gray-50">
                      {parsedPfs.variableExpenses.map((ve) => (
                        <div key={ve.id} className="flex items-center group hover:bg-orange-50/40 transition-colors">
                          <input
                            value={ve.label}
                            onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === ve.id ? {...m, label: v} : m)) }}
                            onBlur={(e) => handleUpdateMonthlyItem(ve.id, "label", e.target.value)}
                            className="flex-1 px-2 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white min-w-0"
                            placeholder="Variable..."
                          />
                          <input
                            type="number"
                            value={ve.amount}
                            onChange={(e) => { const v = e.target.value; setDbMonthlyItems(prev => prev.map(m => m.id === ve.id ? {...m, amount: parseFloat(v)||0} : m)) }}
                            onBlur={(e) => handleUpdateMonthlyItem(ve.id, "amount", e.target.value)}
                            className="w-20 px-2 py-2.5 text-xs font-bold font-mono text-right text-orange-700 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white shrink-0"
                          />
                          <div className="w-5 flex items-center justify-center shrink-0">
                            {savingState[ve.id] === "saving" && <span className="text-[7px] text-indigo-400">…</span>}
                            {savingState[ve.id] === "saved" && <span className="text-[7px] text-emerald-500">✓</span>}
                            {!savingState[ve.id] && (
                              <button onClick={() => handleDeleteMonthlyItem(ve.id)} className="opacity-0 group-hover:opacity-100 text-gray-200 hover:text-rose-400 text-[8px]" title="Delete">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddMonthlyItem("expense_variable", "New Variable", 0)}
                        className="w-full text-[9px] text-orange-500 hover:text-orange-700 hover:bg-orange-50 py-2 px-2 text-left font-semibold transition-colors"
                      >
                        + Variable
                      </button>
                    </div>

                  </div>
                </div>

                {/* Totals Footer */}
                <div className="grid grid-cols-2 border-t border-gray-200 bg-gray-50 divide-x divide-gray-200">
                  {/* Income Total */}
                  <div className="flex items-center bg-green-700 text-white">
                    <span className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide">รวม</span>
                    <span className="w-28 px-3 py-2.5 text-xs font-extrabold font-mono text-right border-l border-green-600">{parsedPfs.totalIncome}</span>
                    <div className="w-6" />
                  </div>
                  {/* Expense Total */}
                  <div className="grid grid-cols-2 divide-x divide-red-400">
                    <div className="flex items-center bg-red-600 text-white">
                      <span className="flex-1 px-3 py-2.5 text-xs font-bold uppercase">รวม</span>
                      <span className="w-20 px-2 py-2.5 text-xs font-extrabold font-mono text-right border-l border-red-500">{parsedPfs.totalFixedExpenses}</span>
                      <div className="w-5" />
                    </div>
                    <div className="flex items-center bg-red-700 text-white">
                      <span className="flex-1 px-3 py-2.5 text-xs font-bold uppercase">รวม</span>
                      <span className="w-20 px-2 py-2.5 text-xs font-extrabold font-mono text-right border-l border-red-600">{parsedPfs.totalVariableExpenses}</span>
                      <div className="w-5" />
                    </div>
                  </div>
                </div>

                {/* Net Savings Footer */}
                <div className="flex bg-gray-900 text-white">
                  <span className="flex-1 px-4 py-3 text-xs font-extrabold uppercase tracking-widest">เหลือ (Net Monthly Savings)</span>
                  <span className={`px-4 py-3 text-sm font-extrabold font-mono ${parsedPfs.remainingMoneyNum >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{parsedPfs.remainingMoney}</span>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ─── E. STANDARD SHEETS TABS (Long-term, Short-term, Store of Wealth) ─── */}
        {!isBtcTab && !isPfsTab && !isInvestmentsTab && !isOverviewTab && !isExpensesTab && (
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

        {/* ─── F. BTC TRANSACTION DASHBOARD VIEW ─── */}
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
