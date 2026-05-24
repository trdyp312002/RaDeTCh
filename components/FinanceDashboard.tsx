"use client"

import { useState } from "react"

type FinanceData = Record<string, string[][]>

export default function FinanceDashboard({ data }: { data: FinanceData }) {
  const tabs = Object.keys(data).filter(k => data[k] && data[k].length > 0)
  const [activeTab, setActiveTab] = useState(tabs[0] || "")

  if (tabs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-500">Could not find any data in the Google Sheet.</p>
        </div>
      </div>
    )
  }

  const currentData = data[activeTab] || []
  const header = currentData[0] || []
  const rows = currentData.slice(1)

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="pt-10 pb-12 px-6 border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">Finance</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">Personal Finance</h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
            Live synchronization with Google Sheets. Tracking Long-term, Short-term, BTC, Store of Wealth, and Personal Financial Statement.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-gray-100 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {header.map((col, i) => (
                    <th key={i} className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {col || `Col ${i+1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {/* Ensure row has same number of cells as header */}
                    {header.map((_, colIndex) => {
                      const cellValue = row[colIndex] || ""
                      const isNumeric = !isNaN(Number(cellValue.replace(/,/g, ''))) && cellValue.trim() !== ""
                      return (
                        <td key={colIndex} className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                          {isNumeric ? (
                            <span className="font-mono">{cellValue}</span>
                          ) : (
                            cellValue
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {rows.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">
              No rows found in this sheet.
            </div>
          )}
        </div>
        
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
