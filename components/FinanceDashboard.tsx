"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, CartesianGrid
} from "recharts"
import PortfolioTab from "./PortfolioTab"

type FinanceData = Record<string, string[][]>

type DBFinanceItem = {
  id: string
  category: "cash" | "other_asset" | "bond" | "liability"
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
  const clean = val.replace(/[$,฿\s]/g, "")
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
type TooltipPayloadEntry = { name: string; value: number; color: string }
type CustomTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
  prefix?: string
}

function CustomTooltip({ active, payload, label, prefix = "$" }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 text-white px-3.5 py-2.5 rounded-xl border border-gray-800 shadow-2xl backdrop-blur-md text-xs">
        {label && <p className="text-gray-400 font-mono mb-1">{label}</p>}
        {payload.map((entry, index) => (
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

export default function FinanceDashboard() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const tabs = useMemo(() => [
    "Summary",
    "Retirement Portfolio",
    "Long-term Portfolio",
    "Short-term Portfolio",
    "OmniTrade AI Bot",
    "Cash & Safety Net",
    "Monthly Expenses",
    "Personal Financial Statement"
  ], [])
  
  const [activeTab, setActiveTab] = useState("Summary")

  // ─── SQLite DB States ───────────────────────────────────────────────────────
  const [dbFinanceItems, setDbFinanceItems] = useState<DBFinanceItem[]>([])
  const [dbMonthlyItems, setDbMonthlyItems] = useState<DBMonthlyItem[]>([])
  const [savingState, setSavingState] = useState<Record<string, "saved" | "saving" | "error">>({})
  const [fxRates, setFxRates] = useState<Record<string, number>>({ THB: 35.5, JPY: 150 })
  const [displayCurrency, setDisplayCurrency] = useState<"THB" | "USD">("USD")
  const [overviewMetricTab, setOverviewMetricTab] = useState<"payoff" | "goals">("payoff")
  
  // SQLite investment states
  const [allHoldings, setAllHoldings] = useState<any[]>([])
  const [marketQuotes, setMarketQuotes] = useState<Record<string, any>>({})
  const [loadingHoldings, setLoadingHoldings] = useState(true)

  // Payoff simulator inputs
  const [payoffMonthly, setPayoffMonthly] = useState<string>("1500")
  const [payoffInterest, setPayoffInterest] = useState<string>("15")

  const fetchDbHoldings = useCallback(async () => {
    try {
      setLoadingHoldings(true)
      const res = await fetch("/api/holdings")
      if (!res.ok) throw new Error("Failed to fetch holdings")
      const holdingsData = await res.json()
      
      if (Array.isArray(holdingsData)) {
        setAllHoldings(holdingsData)
        
        const symbols = [...new Set(holdingsData.map((h: any) => h.symbol))].filter(Boolean).join(",")
        if (symbols) {
          const qRes = await fetch(`/api/market?symbols=${symbols}`)
          if (qRes.ok) {
            const quotes = await qRes.json()
            setMarketQuotes(quotes)
          }
        }
      } else {
        console.error("Holdings data is not an array:", holdingsData)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHoldings(false)
    }
  }, [])

  // Fetch db items and fx rates on mount
  useEffect(() => {
    fetch("/api/finance")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch finance items")
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) setDbFinanceItems(data)
      })
      .catch(console.error)

    fetch("/api/monthly")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch monthly items")
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) setDbMonthlyItems(data)
      })
      .catch(console.error)

    fetch("/api/fx")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch fx rates")
        return res.json()
      })
      .then(d => {
        if (d?.rates) setFxRates(d.rates)
      })
      .catch(console.error)

    fetchDbHoldings()
  }, [fetchDbHoldings])

  useEffect(() => {
    if (activeTab === "Summary") {
      fetchDbHoldings()
    }
  }, [activeTab, fetchDbHoldings])

  // Currency Converter Helpers
  const convertAmount = (amount: number, from: string, to: string) => {
    if (from === to) return amount
    const thbRate = fxRates.THB || 35.5
    
    // First, convert from original currency to USD
    let usdVal = amount
    if (from === "THB") {
      usdVal = amount / thbRate
    } else if (from === "JPY") {
      usdVal = amount / (fxRates.JPY || 150)
    }
    
    // Then convert from USD to target currency
    if (to === "USD") {
      return usdVal
    } else {
      return usdVal * thbRate
    }
  }

  const formatCurrency = (amount: number, currency: "THB" | "USD") => {
    if (currency === "THB") {
      return "฿" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    } else {
      return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }

  // Dual Currency Renderer Component
  const DualCurrencyValue = ({ amount, from, className = "", subClassName = "", inline = false }: {
    amount: number
    from: "THB" | "USD"
    className?: string
    subClassName?: string
    inline?: boolean
  }) => {
    const primaryVal = convertAmount(amount, from, displayCurrency)
    const secondaryCurrency = displayCurrency === "THB" ? "USD" : "THB"
    const secondaryVal = convertAmount(amount, from, secondaryCurrency)
    
    if (inline) {
      return (
        <span className={className}>
          {formatCurrency(primaryVal, displayCurrency)}{" "}
          <span className={`text-[10px] text-gray-400 font-normal font-mono ${subClassName}`}>
            ({formatCurrency(secondaryVal, secondaryCurrency)})
          </span>
        </span>
      )
    }
    
    return (
      <div className="flex flex-col">
        <span className={className}>{formatCurrency(primaryVal, displayCurrency)}</span>
        <span className={`text-[10px] text-gray-450 font-normal font-mono mt-0.5 ${subClassName}`}>
          ~{formatCurrency(secondaryVal, secondaryCurrency)}
        </span>
      </div>
    )
  }

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

  // 1. SQLite Bitcoin DCA ledger calculation
  const parsedBtc = useMemo(() => {
    const btcHolding = allHoldings.find(h => h.portfolio === "retirement" && (h.symbol === "BTC-USD" || h.symbol.includes("BTC")))
    const btcPrice = marketQuotes["BTC-USD"]?.currentPrice ?? btcHolding?.avgCost ?? 60000
    
    const totalBtc = btcHolding?.quantity ?? 0
    const totalInvested = btcHolding?.totalCost ?? 0
    const portfolioValue = totalBtc * btcPrice
    const profit = portfolioValue - totalInvested
    const avgPnl = totalInvested > 0 ? ((profit / totalInvested) * 100).toFixed(2) + "%" : "0%"
    const avgPrice = btcHolding?.avgCost ?? 0
    
    // Convert transactions to matching shape
    const rawTx = btcHolding?.transactions ?? []
    const transactions = rawTx.map((t: any) => {
      const currentValue = t.quantity * btcPrice
      const pnl = t.price > 0 ? ((btcPrice - t.price) / t.price * 100).toFixed(2) + "%" : "0%"
      return {
        exchange: t.notes || "Exchange",
        date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        btcAmount: t.quantity.toString(),
        priceUsd: t.price.toString(),
        usdPaid: (t.quantity * t.price).toString(),
        currentValue: currentValue.toString(),
        pnl
      }
    })

    return {
      transactions,
      dashboard: {
        totalBtc: totalBtc.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 8 }),
        profit: profit.toFixed(2),
        totalInvested: totalInvested.toString(),
        portfolioValue: portfolioValue.toString(),
        avgPnl,
        avgPrice: avgPrice.toString(),
        btcPrice: btcPrice.toString()
      }
    }
  }, [allHoldings, marketQuotes])

  // 2. Consolidated SQLite master overview data
  const masterOverviewData = useMemo(() => {
    const thbRate = fxRates.THB || 35.5
    
    let ltValue = 0
    let ltCost = 0
    
    let stValue = 0
    let stCost = 0
    
    let btcVal = 0
    let btcCst = 0
    
    allHoldings.forEach(h => {
      const q = marketQuotes[h.symbol]
      const currentPrice = q?.currentPrice ?? h.avgCost ?? 0
      const currentValue = h.quantity * currentPrice
      const totalCost = h.totalCost || 0
      
      if (h.portfolio === "long_term") {
        ltValue += currentValue
        ltCost += totalCost
      } else if (h.portfolio === "short_term") {
        stValue += currentValue
        stCost += totalCost
      } else if (h.portfolio === "retirement") {
        btcVal += currentValue
        btcCst += totalCost
      }
    })

    // Store of Wealth: tangible long-term assets (Gold, Land, Agriculture)
    const storeOfWealthTHB = dbFinanceItems
      .filter(f => f.category === "other_asset")
      .reduce((sum, item) => sum + item.amount, 0)
    const storeOfWealthUSD = storeOfWealthTHB / thbRate

    // Safety Net: cash reserves + government bonds
    const safetyNetTHB = dbFinanceItems
      .filter(f => f.category === "cash" || f.category === "bond")
      .reduce((sum, item) => sum + item.amount, 0)
    const safetyNetUSD = safetyNetTHB / thbRate

    // Combined Pie data in USD
    const pieData = [
      { name: "Long-term (US Stock)", value: ltValue },
      { name: "Short-term (Crypto/Assets)", value: stValue },
      { name: "Retirement Portfolio", value: btcVal + storeOfWealthUSD },
      { name: "Cash & Safety Net", value: safetyNetUSD }
    ].filter(d => d.value > 0)

    const totalPortfolioValue = ltValue + stValue + btcVal + storeOfWealthUSD + safetyNetUSD
    const totalPortfolioCost = ltCost + stCost + btcCst + storeOfWealthUSD + safetyNetUSD
    const totalPnl = totalPortfolioValue - totalPortfolioCost
    const totalPnlPercent = totalPortfolioCost > 0 ? (totalPnl / totalPortfolioCost) * 100 : 0

    const ltPnl = ltValue - ltCost
    const ltPnlPercent = ltCost > 0 ? (ltPnl / ltCost) * 100 : 0

    const stPnl = stValue - stCost
    const stPnlPercent = stCost > 0 ? (stPnl / stCost) * 100 : 0

    return {
      pieData,
      totalPortfolioValue,
      totalPortfolioCost,
      totalPnl,
      totalPnlPercent,
      longTerm: {
        summary: {
          totalValue: ltValue,
          totalCost: ltCost,
          pnl: ltPnl,
          pnlPercent: ltPnlPercent.toFixed(2) + "%"
        }
      },
      shortTerm: {
        summary: {
          totalValue: stValue,
          totalCost: stCost,
          pnl: stPnl,
          pnlPercent: stPnlPercent.toFixed(2) + "%"
        }
      },
      storeWealth: {
        summary: {
          totalValue: storeOfWealthUSD,
          totalCost: storeOfWealthUSD,
          pnl: 0,
          pnlPercent: "0.00%"
        }
      },
      safetyNet: {
        summary: {
          totalValue: safetyNetUSD,
          totalCost: safetyNetUSD,
          pnl: 0,
          pnlPercent: "0.00%"
        }
      }
    }
  }, [allHoldings, marketQuotes, dbFinanceItems, fxRates])

  // 3. Synthesized Personal Financial Statement (Calculated from SQLite DB + Live Portfolio Linkages)
  const parsedPfs = useMemo(() => {
    const thbRate = fxRates.THB || 35.5

    // Group Balance Sheet items
    const cashAssets = dbFinanceItems.filter(f => f.category === "cash")
    
    // Dynamically calculate BTC and US STOCK amounts from portfolios
    const dbOtherAssets = dbFinanceItems.filter(f => f.category === "other_asset" || f.category === "bond").map(f => ({ ...f, isLinked: false }))
    
    const btcValUSD = cleanNum(parsedBtc.dashboard.portfolioValue)
    const btcValTHB = btcValUSD * thbRate

    const ltValueUSD = masterOverviewData.longTerm.summary.totalValue
    const ltValueTHB = ltValueUSD * thbRate

    const otherAssets = [
      ...dbOtherAssets,
      {
        id: "link-btc-id",
        category: "other_asset" as const,
        label: "BTC",
        amount: btcValTHB,
        currency: "THB",
        isLinked: true,
        linkLabel: "Retirement Portfolio (BTC)"
      },
      {
        id: "link-usstock-id",
        category: "other_asset" as const,
        label: "US STOCK",
        amount: ltValueTHB,
        currency: "THB",
        isLinked: true,
        linkLabel: "Long-term Portfolio (US Stocks)"
      }
    ]

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

    // Format THB-based values into displayCurrency
    const fmtDisplay = (thbAmount: number) => {
      const val = displayCurrency === "USD" ? thbAmount / thbRate : thbAmount
      const sym = displayCurrency === "USD" ? "$" : "฿"
      return sym + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

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
      totalAssets: fmtDisplay(totalAssetsVal),
      totalDebt: fmtDisplay(totalDebtVal),
      netWorth: fmtDisplay(netWorthVal),
      totalIncome: fmtDisplay(totalIncomeVal),
      totalFixedExpenses: fmtDisplay(totalFixedVal),
      totalVariableExpenses: fmtDisplay(totalVariableVal),
      remainingMoney: fmtDisplay(remainingMoneyVal),
      totalExpenses: fmtDisplay(totalExpensesVal)
    }
  }, [dbFinanceItems, dbMonthlyItems, fxRates, parsedBtc, masterOverviewData, displayCurrency])

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


  const isPfsTab = activeTab === "Personal Financial Statement"
  const isOverviewTab = activeTab === "Summary"
  const isExpensesTab = activeTab === "Monthly Expenses"
  const isLongTermTab = activeTab === "Long-term Portfolio"
  const isShortTermTab = activeTab === "Short-term Portfolio"
  const isRetirementTab = activeTab === "Retirement Portfolio"
  const isSafetyNetTab = activeTab === "Cash & Safety Net"

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100/80 pt-10 pb-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] font-semibold text-gray-400 mb-2">Unified Wealth Manager</p>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
              📊 {isOverviewTab ? "Summary" : activeTab}
            </h1>
            <p className="text-gray-400 text-xs mt-1.5 max-w-xl">
              {isOverviewTab
                ? "Wealth overview — net worth, portfolio performance, monthly cashflow, and key metrics across all tabs."
                : "SQLite database backed financial records. Dynamic Recharts visualizations, interactive portfolio metrics, and fully editable spreadsheets."
              }
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Base Currency Switcher Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200/80 shadow-sm">
              <button
                onClick={() => setDisplayCurrency("THB")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  displayCurrency === "THB"
                    ? "bg-white text-gray-950 shadow-sm scale-102"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                ฿ THB
              </button>
              <button
                onClick={() => setDisplayCurrency("USD")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  displayCurrency === "USD"
                    ? "bg-white text-gray-950 shadow-sm scale-102"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                $ USD
              </button>
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SQLite Active
            </div>
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
            <div className={`border-2 rounded-3xl p-8 text-white shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden transition-all duration-300 ${
              parsedPfs.netWorthNum >= 0 
                ? "bg-gradient-to-r from-gray-900 via-slate-850 to-slate-800 border-slate-700/50" 
                : "bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/20 border-red-950/10"
            }`}>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-semibold mb-2">Master Net Worth Summary</p>
                <div className={`text-4xl font-extrabold font-mono tracking-tight ${parsedPfs.netWorthNum >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  <DualCurrencyValue amount={parsedPfs.netWorthNum} from="THB" className="text-4xl font-extrabold font-mono tracking-tight" subClassName="text-xs font-semibold font-mono text-gray-400 mt-1.5" />
                </div>
                <p className="text-xs text-gray-300 mt-2.5 max-w-lg leading-relaxed">
                  {parsedPfs.netWorthNum >= 0 
                    ? `ความมั่งคั่งสุทธิสะท้อนในหน่วยหลัก (${displayCurrency}). แสดงมูลค่าสินทรัพย์รวมที่หักลบภาระหนี้สินทั้งหมดแล้ว` 
                    : `⚠️ ความมั่งคั่งสุทธิติดลบ! (Debt Deficit) คุณมีภาระหนี้สินรวมมากกว่าสินทรัพย์ในปัจจุบัน แนะนำให้ชะลอการลงทุนและเร่งปลดหนี้สินก่อน`
                  }
                </p>
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 min-w-[140px] text-right">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">Total Assets</p>
                  <DualCurrencyValue amount={parsedPfs.totalAssetsNum} from="THB" className="text-sm font-bold font-mono text-emerald-400" subClassName="text-[10px] text-gray-400 font-mono mt-0.5" />
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 min-w-[140px] text-right">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5">Total Liabilities</p>
                  <DualCurrencyValue amount={parsedPfs.totalDebtNum} from="THB" className="text-sm font-bold font-mono text-rose-400" subClassName="text-[10px] text-gray-400 font-mono mt-0.5" />
                </div>
              </div>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Investments Summary */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Portfolio Valuation</p>
                  <DualCurrencyValue amount={masterOverviewData.totalPortfolioValue} from="USD" className="text-3xl font-extrabold text-gray-900 font-mono" subClassName="text-xs text-gray-400 font-semibold font-mono mt-1" />
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      masterOverviewData.totalPnl >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {masterOverviewData.totalPnl >= 0 ? "+" : ""}{masterOverviewData.totalPnlPercent.toFixed(2)}% ROI
                    </span>
                    <span className="text-[9.5px] text-gray-400 font-semibold font-mono">
                      (<DualCurrencyValue amount={masterOverviewData.totalPnl} from="USD" inline={true} />)
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab("Long-term Portfolio")}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-4 text-left flex items-center gap-1.5"
                >
                  Explore Holdings →
                </button>
              </div>
 
               {/* Monthly Savings buffer */}
               <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                 <div>
                   <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-1">Monthly Inflow Buffer</p>
                   <DualCurrencyValue amount={parsedPfs.remainingMoneyNum} from="THB" className="text-3xl font-extrabold text-gray-900 font-mono" subClassName="text-xs text-gray-400 font-semibold font-mono mt-1" />
                   {parsedPfs.remainingMoneyNum <= 0 ? (
                     <span className="text-[10px] text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold mt-2.5 inline-block border border-rose-100 animate-pulse">
                       🚨 วิกฤต! งบประมาณติดลบ (Critical Deficit)
                     </span>
                   ) : parsedPfs.remainingMoneyNum < 1500 ? (
                     <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold mt-2.5 inline-block border border-amber-100">
                       ⚠️ ระวัง! งบประมาณกระชั้นชิด (Tight Budget)
                     </span>
                   ) : (
                     <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold mt-2.5 inline-block border border-emerald-100">
                       ✓ ปลอดภัย! งบประมาณคงเหลือดี (Healthy Buffer)
                     </span>
                   )}
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
                   <span className="text-[10px] text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full font-bold mt-2.5 inline-block border border-orange-100">
                     Value: <DualCurrencyValue amount={cleanNum(parsedBtc.dashboard.portfolioValue)} from="USD" inline={true} />
                   </span>
                 </div>
                 <button
                   onClick={() => setActiveTab("Retirement Portfolio")}
                   className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold mt-4 text-left flex items-center gap-1.5"
                 >
                   View DCA Ledger →
                 </button>
              </div>

            </div>

            {/* Split Visuals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Pie Allocation */}
              {/* Pie Allocation or Savings Goal Hub if empty */}
              {masterOverviewData.totalPortfolioValue > 0 ? (
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
              ) : (
                <div className="bg-white border border-gray-150 rounded-3xl p-6.5 shadow-sm flex flex-col justify-between min-h-[420px] lg:col-span-2">
                  <div>
                    <div className="flex justify-between items-center mb-2.5 flex-wrap gap-2">
                      <h4 className="text-sm font-extrabold text-gray-950 flex items-center gap-1.5">
                        🎯 Savings Goals & Interactive Debt Payoff
                      </h4>
                      
                      {/* Sub Tabs */}
                      <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-250">
                        <button
                          onClick={() => setOverviewMetricTab("payoff")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            overviewMetricTab === "payoff"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          💸 Debt Payoff Simulator
                        </button>
                        <button
                          onClick={() => setOverviewMetricTab("goals")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            overviewMetricTab === "goals"
                              ? "bg-white text-indigo-600 shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          🛡️ Safety Net & Goals
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 mb-6 leading-relaxed">
                      {overviewMetricTab === "payoff"
                        ? "เนื่องจากพอร์ตลงทุนหลักยังว่างอยู่ หน้าจำลองปลดหนี้สินนี้จะช่วยแสดงทิศทางและระยะเวลาที่คุณจะปลดแอกหนี้สินทั้งหมดได้สำเร็จ"
                        : "วิเคราะห์เงินสำรองฉุกเฉินปัจจุบัน (Emergency Fund) เปรียบเทียบกับค่าใช้จ่ายรายเดือนคงที่และไม่คงที่ของคุณ"
                      }
                    </p>
                  </div>

                  {overviewMetricTab === "payoff" ? (() => {
                    const totalDebt = parsedPfs.totalDebtNum
                    const monthlyPay = parseFloat(payoffMonthly) || 500
                    const rateVal = parseFloat(payoffInterest) || 0
                    
                    // math logic
                    let payoffMonths = 0
                    let totalInterestAccrued = 0
                    let isNeverEnding = false
                    
                    if (totalDebt > 0) {
                      const monthlyRate = (rateVal / 100) / 12
                      if (monthlyRate === 0) {
                        payoffMonths = Math.ceil(totalDebt / monthlyPay)
                      } else {
                        if (monthlyPay <= totalDebt * monthlyRate) {
                          isNeverEnding = true
                        } else {
                          payoffMonths = Math.ceil(
                            Math.log(monthlyPay / (monthlyPay - totalDebt * monthlyRate)) / Math.log(1 + monthlyRate)
                          )
                          totalInterestAccrued = Math.max(0, (monthlyPay * payoffMonths) - totalDebt)
                        }
                      }
                    }
                    
                    const payoffDate = new Date()
                    if (!isNeverEnding && payoffMonths > 0) {
                      payoffDate.setMonth(payoffDate.getMonth() + payoffMonths)
                    }
                    
                    return (
                      <div className="space-y-5 flex-1 flex flex-col justify-between">
                        {/* Sliders Area */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">ผ่อนชำระต่อเดือน (Monthly Payoff)</span>
                              <span className="font-mono font-bold text-indigo-600">
                                {formatCurrency(convertAmount(monthlyPay, "THB", displayCurrency), displayCurrency)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="500"
                              max="15000"
                              step="250"
                              value={payoffMonthly}
                              onChange={(e) => setPayoffMonthly(e.target.value)}
                              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                              <span>฿500</span>
                              <span>฿15,000</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">อัตราดอกเบี้ยเฉลี่ยรายปี (Est. APR)</span>
                              <span className="font-mono font-bold text-indigo-600">
                                {rateVal}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="0.5"
                              value={payoffInterest}
                              onChange={(e) => setPayoffInterest(e.target.value)}
                              className="w-full h-1.5 bg-gray-250 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                              <span>0% (ไม่มีดอกเบี้ย)</span>
                              <span>30% APR</span>
                            </div>
                          </div>
                        </div>

                        {/* Debts breakdown bars */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4.5 space-y-3.5">
                          <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 mb-1.5">สัดส่วนหนี้สิน (Debt Breakdown)</p>
                          {parsedPfs.debts.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-2">ไม่มีภาระหนี้สินในระบบ</p>
                          ) : (
                            <div className="space-y-3">
                              {parsedPfs.debts.map((debt, index) => {
                                const percentage = totalDebt > 0 ? (debt.amount / totalDebt) * 100 : 0
                                return (
                                  <div key={debt.id} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="text-gray-700">{debt.label}</span>
                                      <span className="font-mono text-gray-900">
                                        <DualCurrencyValue amount={debt.amount} from="THB" inline={true} /> ({percentage.toFixed(1)}%)
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full transition-all duration-500" 
                                        style={{ 
                                          backgroundColor: COLORS[index % COLORS.length],
                                          width: `${percentage}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Payoff Math Results */}
                        <div className={`rounded-2xl p-4.5 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left border transition-all duration-300 ${
                          isNeverEnding 
                            ? "bg-red-50/60 border-red-100 text-red-900" 
                            : "bg-indigo-50/50 border-indigo-100 text-indigo-950"
                        }`}>
                          {isNeverEnding ? (
                            <div className="w-full text-center py-1">
                              <p className="text-xs font-bold text-red-600 animate-pulse mb-1">🚨 ยอดชำระน้อยกว่าดอกเบี้ยสะสม!</p>
                              <p className="text-[10.5px] text-red-500 leading-relaxed font-semibold">ดอกเบี้ยรายเดือนของหนี้มีจำนวนสูงกว่ายอดจ่ายคืน กรุณาเลื่อนแถบสไลด์จ่ายคืนต่อเดือนให้สูงขึ้น</p>
                            </div>
                          ) : (
                            <>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500/80 mb-1">คาดว่าจะหมดหนี้สินภายใน (Payoff Date)</p>
                                <p className="text-lg font-black font-sans text-indigo-900">
                                  {payoffMonths === 0 ? "ไม่มีหนี้สิน" : payoffDate.toLocaleDateString("th-TH", { year: "numeric", month: "long" })}
                                </p>
                                <p className="text-[10px] text-indigo-600 font-semibold font-mono mt-0.5">
                                  ใช้เวลาผ่อนชำระ {payoffMonths} เดือน (ชำระดอกเบี้ยสะสม: <DualCurrencyValue amount={totalInterestAccrued} from="THB" inline={true} />)
                                </p>
                              </div>
                              <div className="bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl text-center shadow-md min-w-[120px] transition-all">
                                <p className="text-[8px] uppercase tracking-widest text-indigo-200">ยอดชำระสุทธิ</p>
                                <p className="text-sm font-extrabold font-mono mt-0.5">
                                  <DualCurrencyValue amount={totalDebt + totalInterestAccrued} from="THB" inline={true} className="text-sm font-extrabold text-white" />
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })() : (() => {
                    const cashTotal = parsedPfs.assets[0]?.items.reduce((sum, item) => sum + item.amount, 0) || 0
                    const monthlyExpenses = parsedPfs.totalFixedNum + parsedPfs.totalVariableNum
                    const coveredMonths = monthlyExpenses > 0 ? (cashTotal / monthlyExpenses) : 0
                    
                    // safety net levels
                    let safetyRating = ""
                    let safetyAdvice = ""
                    let safetyColor = ""
                    
                    if (coveredMonths < 1) {
                      safetyRating = "🔴 ระดับวิกฤต (Critical)"
                      safetyAdvice = "คุณมีเงินสำรองต่ำกว่าค่าใช้จ่าย 1 เดือน ควรเร่งเก็บออมเงินส่วนนี้ด่วนเพื่อเป็นเบาะกันกระแทก"
                      safetyColor = "bg-rose-500"
                    } else if (coveredMonths < 3) {
                      safetyRating = "🟠 ระดับเตือนภัย (Warning)"
                      safetyAdvice = "เงินสำรองฉุกเฉินยังน้อยเกินไป แนะนำให้สะสมเงินสดเพิ่มให้ครอบคลุม 3-6 เดือนของค่าใช้จ่าย"
                      safetyColor = "bg-amber-500"
                    } else if (coveredMonths < 6) {
                      safetyRating = "🟢 ระดับปลอดภัย (Healthy)"
                      safetyAdvice = "ยอดเยี่ยม! คุณมีเกราะป้องกันทางการเงินที่ดีมาก สามารถรับมือเหตุฉุกเฉินได้เป็นอย่างดี"
                      safetyColor = "bg-emerald-500"
                    } else {
                      safetyRating = "✨ ระดับดีเยี่ยม (Excellent)"
                      safetyAdvice = "เงินสำรองแข็งแกร่งมาก! พร้อมขยายการเก็บออมส่วนเกินไปลงทุนเพื่อต่อยอดความมั่งคั่ง"
                      safetyColor = "bg-teal-500"
                    }

                    // savings goal target: ฿5,000 for emergency or payoff
                    const firstGoalTarget = 5000
                    const goalProgress = Math.min(100, (cashTotal / firstGoalTarget) * 100)

                    return (
                      <div className="space-y-5 flex-1 flex flex-col justify-between">
                        {/* Emergency Safety Net Visuals */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 mb-1">ระยะเวลาปลอดภัยทางการเงิน (Safety Net)</p>
                              <h5 className="text-xl font-extrabold text-gray-900 font-sans">
                                {coveredMonths.toFixed(1)} เดือน <span className="text-xs text-gray-400 font-normal font-sans">(Months of Expenses covered)</span>
                              </h5>
                            </div>
                            <span className="text-[10.5px] px-2.5 py-1 rounded-full font-bold bg-white shadow-sm border border-gray-150">
                              {safetyRating}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="w-full bg-gray-250 h-3 rounded-full overflow-hidden relative shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ${safetyColor}`}
                                style={{ width: `${Math.min(100, (coveredMonths / 6) * 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                              <span>0 เดือน</span>
                              <span>เป้าหมายขั้นต่ำ 3 เดือน</span>
                              <span>เป้าหมายสูงสุด 6 เดือน+</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                            💡 **แนะนำ:** {safetyAdvice}
                          </p>
                        </div>

                        {/* First Goal Goal Tracker */}
                        <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-5 space-y-3.5">
                          <div className="flex justify-between items-center font-bold text-xs">
                            <span className="text-indigo-950">🎯 เป้าหมายเก็บเงินสำรองฉุกเฉิน ฿5,000 แรก</span>
                            <span className="font-mono text-indigo-700">
                              {goalProgress.toFixed(0)}%
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="w-full bg-indigo-150 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-indigo-600 transition-all duration-700"
                                style={{ width: `${goalProgress}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9.5px] text-indigo-800 font-semibold font-mono">
                              <span>สะสมแล้ว: <DualCurrencyValue amount={cashTotal} from="THB" inline={true} /></span>
                              <span>เป้าหมาย: <DualCurrencyValue amount={firstGoalTarget} from="THB" inline={true} /></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Jump Sections summary cards */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-950 mb-4">All Tabs Overview</h4>

                  <div className="space-y-2.5">
                    {[
                      {
                        tab: "Long-term Portfolio",
                        emoji: "📈",
                        label: "Long-term (US Stocks)",
                        value: masterOverviewData.longTerm.summary.totalValue,
                        cost: masterOverviewData.longTerm.summary.totalCost,
                        pnl: masterOverviewData.longTerm.summary.pnlPercent,
                        pnlNum: masterOverviewData.longTerm.summary.pnl,
                        color: "bg-indigo-50 text-indigo-700",
                        from: "USD" as const
                      },
                      {
                        tab: "Short-term Portfolio",
                        emoji: "🤖",
                        label: "Short-term (AI Bot)",
                        value: masterOverviewData.shortTerm.summary.totalValue,
                        cost: masterOverviewData.shortTerm.summary.totalCost,
                        pnl: masterOverviewData.shortTerm.summary.pnlPercent,
                        pnlNum: masterOverviewData.shortTerm.summary.pnl,
                        color: "bg-violet-50 text-violet-700",
                        from: "USD" as const
                      },
                      {
                        tab: "Retirement Portfolio",
                        emoji: "₿",
                        label: "Retirement Portfolio",
                        value: cleanNum(parsedBtc.dashboard.portfolioValue) + masterOverviewData.storeWealth.summary.totalValue,
                        cost: cleanNum(parsedBtc.dashboard.totalInvested) + masterOverviewData.storeWealth.summary.totalValue,
                        pnl: parsedBtc.dashboard.avgPnl,
                        pnlNum: cleanNum(parsedBtc.dashboard.profit),
                        color: "bg-orange-50 text-orange-700",
                        from: "USD" as const
                      },
                      {
                        tab: "Cash & Safety Net",
                        emoji: "🛡️",
                        label: "Cash & Safety Net",
                        value: masterOverviewData.safetyNet.summary.totalValue,
                        cost: masterOverviewData.safetyNet.summary.totalValue,
                        pnl: "Stable",
                        pnlNum: 0,
                        color: "bg-emerald-50 text-emerald-700",
                        from: "USD" as const
                      },
                      {
                        tab: "Monthly Expenses",
                        emoji: "💳",
                        label: "Monthly Expenses",
                        value: parsedPfs.totalFixedNum + parsedPfs.totalVariableNum,
                        cost: parsedPfs.totalIncomeNum,
                        pnl: parsedPfs.remainingMoneyNum >= 0 ? "Surplus" : "Deficit",
                        pnlNum: parsedPfs.remainingMoneyNum,
                        color: parsedPfs.remainingMoneyNum >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
                        from: "THB" as const
                      },
                      {
                        tab: "Personal Financial Statement",
                        emoji: "🏦",
                        label: "Balance Sheet",
                        value: parsedPfs.totalAssetsNum,
                        cost: parsedPfs.totalDebtNum,
                        pnl: parsedPfs.netWorthNum >= 0 ? "Positive" : "Deficit",
                        pnlNum: parsedPfs.netWorthNum,
                        color: parsedPfs.netWorthNum >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
                        from: "THB" as const
                      }
                    ].map((sec, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveTab(sec.tab)}
                        className="flex justify-between items-center p-3.5 border border-gray-100 hover:border-indigo-100 hover:bg-gray-50/80 rounded-2xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="text-base shrink-0">{sec.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 leading-tight truncate">{sec.label}</p>
                            <span className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block ${sec.color}`}>
                              {sec.pnl}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <DualCurrencyValue
                            amount={sec.value}
                            from={sec.from}
                            className="font-mono text-xs font-bold text-gray-800"
                            subClassName="text-[9px] text-gray-400 font-normal font-mono mt-0.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 text-center">
                  <span className="text-[10px] text-gray-400 font-medium">Click any row to navigate →</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── B. PORTFOLIO TABS ─── */}
        {isRetirementTab && (
          <div className="space-y-10 animate-fadeIn">
            {/* Bitcoin DCA Portfolio */}
            <PortfolioTab portfolio="retirement" displayCurrency={displayCurrency} fxRates={fxRates} />


          </div>
        )}
        {isLongTermTab && (
          <PortfolioTab portfolio="long_term" displayCurrency={displayCurrency} fxRates={fxRates} />
        )}
        {isShortTermTab && (
          <PortfolioTab portfolio="short_term" displayCurrency={displayCurrency} fxRates={fxRates} />
        )}

        {/* ─── D. OMNITRADE AI BOT TAB ─── */}
        {activeTab === "OmniTrade AI Bot" && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-br from-cyan-900 to-blue-950 border border-cyan-700/50 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-300 font-semibold mb-1">🤖 AI Trading Agents</p>
                <h2 className="text-xl font-bold">BAS OMNITRADE HQ</h2>
              </div>
              <a href="/omnitrade/agents" target="_blank" rel="noreferrer" className="text-xs bg-cyan-500 hover:bg-cyan-400 text-cyan-950 px-4 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)]">
                Open in Fullscreen ↗
              </a>
            </div>
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden h-[800px] w-full relative">
              <iframe 
                src="/omnitrade/agents" 
                className="w-full h-full border-0 absolute inset-0"
                title="OmniTrade AI Agents"
              />
            </div>
          </div>
        )}

        {/* ─── C. CASH & SAFETY NET TAB ─── */}
        {isSafetyNetTab && (() => {
          const cashTotal = dbFinanceItems.filter(f => f.category === "cash").reduce((s, f) => s + f.amount, 0)
          const bondTotal = dbFinanceItems.filter(f => f.category === "bond").reduce((s, f) => s + f.amount, 0)
          const monthlyExpenses = parsedPfs.totalFixedNum + parsedPfs.totalVariableNum
          const months6Target = monthlyExpenses * 6
          const months12Target = monthlyExpenses * 12
          const progress6 = months6Target > 0 ? Math.min(100, (cashTotal / months6Target) * 100) : 0
          const progress12 = months12Target > 0 ? Math.min(100, (cashTotal / months12Target) * 100) : 0
          const coveredMonths = monthlyExpenses > 0 ? cashTotal / monthlyExpenses : 0

          return (
            <div className="space-y-8 animate-fadeIn">

              {/* Allocation Principle Banner */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 border border-slate-700/50 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-blue-300 font-semibold mb-4">🎯 Savings Allocation Principle</p>
                <div className="space-y-2.5 text-sm relative">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span className="text-gray-200"><span className="font-bold text-white">50%</span> ของเงินเดือน → เงินออมทั้งหมด</span>
                  </div>
                  <div className="flex items-start gap-3 ml-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                    <span className="text-gray-300"><span className="font-bold text-orange-300">40%</span> ของเงินออม → Bitcoin (Store of Wealth)</span>
                  </div>
                  <div className="flex items-start gap-3 ml-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span className="text-gray-300"><span className="font-bold text-indigo-300">40%</span> ของเงินออม → Long-term Investment (US Stocks)</span>
                  </div>
                  <div className="flex items-start gap-3 ml-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span className="text-gray-300"><span className="font-bold text-violet-300">5%</span> ของเงินออม → Short-term Investment</span>
                  </div>
                  <div className="flex items-start gap-3 ml-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span className="text-gray-300"><span className="font-bold text-emerald-300">5%</span> ของเงินออม → Emergency Fund (Safety Net)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Emergency Fund + Cash */}
                <div className="space-y-1">
                  <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-gray-900">🛡️ Emergency Fund &amp; Cash</h4>
                        <DualCurrencyValue
                          amount={cashTotal / (fxRates.THB || 35.5)}
                          from="USD"
                          inline={true}
                          className="text-xs font-bold font-mono text-gray-700"
                        />
                      </div>
                      {/* Rule dots */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">ควรมีอย่างน้อย <span className="font-bold text-gray-700">6 เดือน</span> ของค่าใช้จ่ายรายเดือน</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">เป้าหมายอุดมคติ <span className="font-bold text-gray-700">12 เดือน</span> เพื่อรองรับเหตุฉุกเฉินระยะยาว</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">เก็บแยก account ต่างหาก — ห้ามแตะถ้าไม่ฉุกเฉินจริงๆ</span>
                        </div>
                      </div>
                      {/* Progress bars */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span className="text-gray-600">ครอบคลุม <span className="font-bold text-gray-900">{coveredMonths.toFixed(1)} เดือน</span></span>
                            <span className="text-emerald-600">{progress6.toFixed(0)}% of 6-month target</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress6}%` }} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-semibold">
                            <span className="text-gray-500">12-month ideal target</span>
                            <span className="text-blue-600">{progress12.toFixed(0)}% of 12-month target</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${progress12}%` }} />
                          </div>
                        </div>
                        {monthlyExpenses > 0 && (
                          <p className="text-[10px] text-gray-400 font-mono">
                            เป้าหมาย 6 เดือน: <DualCurrencyValue amount={months6Target / (fxRates.THB || 35.5)} from="USD" inline={true} className="text-gray-600 font-mono font-semibold text-[10px]" />
                            {" · "}
                            12 เดือน: <DualCurrencyValue amount={months12Target / (fxRates.THB || 35.5)} from="USD" inline={true} className="text-gray-600 font-mono font-semibold text-[10px]" />
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {dbFinanceItems.filter(f => f.category === "cash").map(item => (
                        <div key={item.id} className="flex items-center px-6 py-3.5 group hover:bg-gray-50 transition-colors gap-4">
                          <input
                            value={item.label}
                            onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === item.id ? {...f, label: v} : f)) }}
                            onBlur={(e) => handleUpdateFinanceItem(item.id, "label", e.target.value)}
                            className="flex-1 bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-mono text-gray-400">฿</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === item.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                              onBlur={(e) => handleUpdateFinanceItem(item.id, "amount", e.target.value)}
                              className="w-28 bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded px-2 py-1 text-sm font-bold font-mono text-right text-gray-800 focus:outline-none"
                            />
                          </div>
                          <div className="w-8 text-center shrink-0">
                            {savingState[item.id] === "saving" && <span className="text-[9px] text-indigo-400 animate-pulse">…</span>}
                            {savingState[item.id] === "saved" && <span className="text-[9px] text-emerald-500 font-bold">✓</span>}
                            {!savingState[item.id] && (
                              <button onClick={() => handleDeleteFinanceItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-xs transition-all" title="Delete">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAddFinanceItem("cash", "New Cash Item", 0)}
                      className="w-full text-[10px] text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 py-3 px-6 text-left font-semibold transition-colors border-t border-gray-50"
                    >
                      + Add Emergency Fund / Cash
                    </button>
                  </div>
                </div>

                {/* Government Bonds */}
                <div className="space-y-1">
                  <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-sm font-bold text-gray-900">📜 Government Bonds (พันธบัตรรัฐบาล)</h4>
                        <DualCurrencyValue
                          amount={bondTotal / (fxRates.THB || 35.5)}
                          from="USD"
                          inline={true}
                          className="text-xs font-bold font-mono text-gray-700"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">ความปลอดภัยสูง ผลตอบแทนสม่ำเสมอ เสี่ยงต่ำสุดในกลุ่มสินทรัพย์</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">เหมาะสำหรับเงินที่ไม่ต้องการใช้ใน 1–3 ปี</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">เสริม Safety Net ร่วมกับ Emergency Fund</span>
                        </div>
                      </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {dbFinanceItems.filter(f => f.category === "bond").map(item => (
                        <div key={item.id} className="flex items-center px-6 py-3.5 group hover:bg-gray-50 transition-colors gap-4">
                          <input
                            value={item.label}
                            onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === item.id ? {...f, label: v} : f)) }}
                            onBlur={(e) => handleUpdateFinanceItem(item.id, "label", e.target.value)}
                            className="flex-1 bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs font-mono text-gray-400">฿</span>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === item.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                              onBlur={(e) => handleUpdateFinanceItem(item.id, "amount", e.target.value)}
                              className="w-28 bg-transparent border-0 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-blue-300 rounded px-2 py-1 text-sm font-bold font-mono text-right text-gray-800 focus:outline-none"
                            />
                          </div>
                          <div className="w-8 text-center shrink-0">
                            {savingState[item.id] === "saving" && <span className="text-[9px] text-indigo-400 animate-pulse">…</span>}
                            {savingState[item.id] === "saved" && <span className="text-[9px] text-emerald-500 font-bold">✓</span>}
                            {!savingState[item.id] && (
                              <button onClick={() => handleDeleteFinanceItem(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-xs transition-all" title="Delete">✕</button>
                            )}
                          </div>
                        </div>
                      ))}
                      {dbFinanceItems.filter(f => f.category === "bond").length === 0 && (
                        <p className="px-6 py-6 text-xs text-gray-400 text-center">ยังไม่มีพันธบัตร — เพิ่มได้เลย</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddFinanceItem("bond", "Government Bond", 0)}
                      className="w-full text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-3 px-6 text-left font-semibold transition-colors border-t border-gray-50"
                    >
                      + Add Government Bond
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )
        })()}

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
                   {parsedPfs.assets[1]?.items.map((asset: any) => (
                    <div key={asset.id} className="flex items-center border-b border-gray-50 group hover:bg-gray-50 transition-colors">
                      <div className="flex-1 flex items-center relative">
                        <input
                          value={asset.label}
                          disabled={asset.isLinked}
                          onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, label: v} : f)) }}
                          onBlur={(e) => handleUpdateFinanceItem(asset.id, "label", e.target.value)}
                          className={`flex-1 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400 ${asset.isLinked ? "text-indigo-600 bg-indigo-50/5 cursor-not-allowed" : ""}`}
                        />
                        {asset.isLinked && (
                          <span className="absolute right-3 flex items-center gap-1 text-[8px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full" title={asset.linkLabel}>
                            🔗 Linked
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={asset.isLinked ? asset.amount.toFixed(2) : asset.amount}
                        disabled={asset.isLinked}
                        onChange={(e) => { const v = e.target.value; setDbFinanceItems(prev => prev.map(f => f.id === asset.id ? {...f, amount: parseFloat(v)||0} : f)) }}
                        onBlur={(e) => handleUpdateFinanceItem(asset.id, "amount", e.target.value)}
                        className={`w-32 px-3 py-2.5 text-xs font-bold font-mono text-right text-gray-800 bg-transparent border-0 border-l border-gray-100 focus:outline-none focus:bg-white focus:ring-inset focus:ring-1 focus:ring-green-400 ${asset.isLinked ? "text-indigo-700 bg-indigo-50/5 cursor-not-allowed font-semibold" : ""}`}
                      />
                      <div className="w-8 flex items-center justify-center">
                        {savingState[asset.id] === "saving" && <span className="text-[8px] text-indigo-400 animate-pulse">…</span>}
                        {savingState[asset.id] === "saved" && <span className="text-[8px] text-emerald-500 font-bold">✓</span>}
                        {!savingState[asset.id] && !asset.isLinked && (
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
                  Debt (หนี้สิน)
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

                {/* Total Debt Row */}
                <div className="flex items-center bg-red-600 text-white">
                  <span className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wide">Total Debt</span>
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
                            <button onClick={() => handleDeleteMonthlyItem(inc.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[9px]" title="Delete">✕</button>
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
                              <button onClick={() => handleDeleteMonthlyItem(fe.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[8px]" title="Delete">✕</button>
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
                              <button onClick={() => handleDeleteMonthlyItem(ve.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 text-[8px]" title="Delete">✕</button>
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
