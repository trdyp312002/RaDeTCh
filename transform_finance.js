const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'trdyp', 'OneDrive', 'Desktop', 'MYWORLD', 'Projects', 'radetch', 'components', 'FinanceDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const returnStartIdx = content.indexOf('  return (\n    <div className="flex flex-col gap-6 pb-10">');

if (returnStartIdx === -1) {
    console.error("Could not find the return block.");
    process.exit(1);
}

const beforeReturn = content.substring(0, returnStartIdx);

const newReturnBlock = `  const pnlPct = totalPortValue > 0 ? (totalPortPnl / (totalPortValue - totalPortPnl)) * 100 : 0

  return (
    <div className="bauhaus-theme flex flex-col min-h-screen w-full relative">
      {/* Ticker Bar */}
      <div className="ticker-wrap border-b-4 border-[var(--color-on-background)] bg-[var(--color-primary-container)] z-30 sticky top-0 hidden md:block">
        <div className="ticker text-lg">
          <MarketTicker />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 space-y-10 overflow-y-auto">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-[var(--color-surface)] brutal-border brutal-shadow p-6 flex flex-col relative overflow-hidden text-[var(--color-on-surface)]">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#cbd5e1 2px, transparent 2px)", backgroundSize: "20px 20px" }}></div>
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <h2 className="font-bold text-xl uppercase tracking-tight text-[var(--color-outline-variant)] mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Total Portfolio Value</h2>
                <p className="font-black text-4xl md:text-6xl lg:text-8xl tracking-tighter text-[var(--color-on-surface)]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {fmtPortValue(totalPortValue)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[var(--color-primary)] text-white px-3 py-1 text-sm font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{totalPortPnl >= 0 ? "+" : ""}{pnlPct.toFixed(1)}% YTD</span>
                  <span className="text-[var(--color-tertiary)] font-bold">{totalPortPnl >= 0 ? "+" : ""}{fmtPortValue(totalPortPnl)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 z-20 hidden sm:flex">
                 <button onClick={() => setDisplayCurrency(displayCurrency === "THB" ? "USD" : "THB")} className="bg-[var(--color-primary)] text-white font-bold uppercase px-4 py-2 border-2 border-[var(--color-on-background)] hover:bg-[var(--color-secondary)] transition-colors text-sm text-left flex justify-between items-center w-40 cursor-pointer brutal-shadow-sm active:translate-y-1 active:translate-x-1 active:shadow-none" style={{ fontFamily: "Manrope, sans-serif" }}>
                   {displayCurrency} <span className="material-symbols-outlined text-sm">swap_horiz</span>
                 </button>
                 {PORTFOLIO_KEYS.map(k => (
                   <button key={k} onClick={() => setActiveTab(k)} className={\`\${activeTab === k ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]"} font-bold uppercase px-4 py-2 border-2 border-[var(--color-on-background)] transition-colors text-sm text-left w-40 cursor-pointer brutal-shadow-sm active:translate-y-1 active:translate-x-1 active:shadow-none\`} style={{ fontFamily: "Manrope, sans-serif" }}>
                     {PORTFOLIO_META[k].label}
                   </button>
                 ))}
              </div>
            </div>

            <div className="mt-auto h-64 border-l-4 border-b-4 border-[var(--color-on-background)] p-2 relative z-10 bg-white/5 backdrop-blur-sm">
                {portLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 size={18} className="animate-spin text-stone-400" />
                  </div>
                ) : combinedChartData.length < 2 ? (
                  <div className="flex items-center justify-center h-full text-xs text-stone-400">
                    Add holdings to start tracking combined portfolio value
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        {PORTFOLIO_KEYS.map(k => (
                          <linearGradient key={k} id={\`cgrad-\${k}\`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={PORTFOLIO_META[k].lineColor} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={PORTFOLIO_META[k].lineColor} stopOpacity={0}   />
                          </linearGradient>
                        ))}
                        <linearGradient id="cgrad-total" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--color-primary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fill: "var(--color-outline)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis
                        tick={{ fill: "var(--color-outline)", fontSize: 10 }} axisLine={false} tickLine={false} width={70}
                        tickFormatter={v => prefix + (Math.abs(v) >= 1000 ? (convertAmount(v, "USD", displayCurrency) / 1000).toFixed(1) + "k" : convertAmount(v, "USD", displayCurrency).toFixed(0))}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null
                          return (
                            <div className="bg-[var(--color-surface)] border-2 border-[var(--color-on-background)] shadow-xl p-3 text-xs brutal-shadow-sm">
                              <p className="text-[var(--color-outline)] mb-2 text-[10px] font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>{label}</p>
                              {payload.map((p, i) => (
                                <div key={i} className="flex justify-between gap-4 font-bold" style={{ fontFamily: "Manrope, sans-serif" }}>
                                  <span style={{ color: p.name === "Total" ? "var(--color-primary)" : p.color }} className="text-[10px] uppercase">{p.name}:</span>
                                  <span className="text-[var(--color-on-surface)]">{fmtPortValue(p.value as number)}</span>
                                </div>
                              ))}
                            </div>
                          )
                        }}
                      />
                      {PORTFOLIO_KEYS.map(k => (
                        <Area key={k} type="monotone" dataKey={k} name={PORTFOLIO_META[k].label}
                          stroke={PORTFOLIO_META[k].lineColor} strokeWidth={2}
                          fill={\`url(#cgrad-\${k})\`} dot={false} isAnimationActive={false} />
                      ))}
                      <Area type="monotone" dataKey="total" name="Total"
                        stroke="var(--color-primary)" strokeWidth={3}
                        fill="url(#cgrad-total)" dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
            </div>
          </div>

          {/* Allocation Sidebar */}
          <div className="bg-[var(--color-primary)] text-white brutal-border brutal-shadow p-6 flex flex-col">
            <h2 className="font-bold text-2xl uppercase mb-6 text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] pb-2" style={{ fontFamily: "Manrope, sans-serif" }}>Allocation</h2>
            <div className="space-y-6 flex-1">
              {pieData.map((d, i) => {
                const colors = ["bg-[var(--color-primary-container)]", "bg-[var(--color-tertiary)]", "bg-[var(--color-tertiary-fixed-dim)]", "bg-[var(--color-secondary)]"];
                const borderColors = ["border-[var(--color-primary-container)]", "border-[var(--color-tertiary)]", "border-[var(--color-tertiary-fixed-dim)]", "border-[var(--color-secondary)]"];
                const total = pieData.reduce((acc, curr) => acc + curr.value, 0);
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between font-bold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                      <span className="uppercase text-sm">{d.name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className={\`w-full h-6 bg-[var(--color-surface-variant)] border-2 \${borderColors[i % 4]} overflow-hidden\`}>
                      <div className={\`h-full \${colors[i % 4]}\`} style={{ width: \`\${pct}%\` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="w-full mt-8 bg-transparent text-[var(--color-primary-container)] border-2 border-[var(--color-primary-container)] font-bold uppercase py-3 hover:bg-[var(--color-primary-container)] hover:text-[var(--color-primary)] transition-colors cursor-pointer" style={{ fontFamily: "Manrope, sans-serif" }} onClick={() => setShowBalanceSheet(!showBalanceSheet)}>
              {showBalanceSheet ? "HIDE BALANCE SHEET" : "MANAGE BALANCE SHEET"}
            </button>
          </div>
        </section>

        {/* Portfolio Tab injection */}
        <div className="bg-[var(--color-surface)] brutal-border brutal-shadow p-6 text-[var(--color-on-surface)]">
          <PortfolioTab portfolio={activeTab} displayCurrency={displayCurrency} fxRates={fxRates} />
        </div>

        {/* Balance Sheet conditional */}
        {showBalanceSheet && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border-t-4 border-[var(--color-on-background)] pt-8 text-[var(--color-on-surface)]">
             <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] brutal-shadow p-5 flex flex-col gap-5">
               <h2 className="text-xl font-bold uppercase text-[var(--color-primary)]" style={{ fontFamily: "Manrope, sans-serif" }}>Assets & Liabilities</h2>
               <FinanceSection title="Cash & Liquid" items={cashItems} category="cash" accentColor="text-teal-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                  onDelete={deleteFinance} onAdd={addFinance} />
                <FinanceSection title="Investments & Assets" items={investmentItems} category="other_asset" accentColor="text-indigo-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                  onDelete={deleteFinance} onAdd={addFinance} />
                <div className="border-t-2 border-[var(--color-primary)] pt-4">
                  <FinanceSection title="Liabilities & Debt" items={liabilityItems} category="liability" accentColor="text-[var(--color-error)]"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateFinance(id, "label", v)} onUpdateAmount={(id, v) => updateFinance(id, "amount", v)}
                    onDelete={deleteFinance} onAdd={addFinance} />
                </div>
             </div>

             <div className="bg-[var(--color-surface)] border-2 border-[var(--color-primary)] brutal-shadow p-5 flex flex-col gap-5">
                <h2 className="text-xl font-bold uppercase text-[var(--color-primary)]" style={{ fontFamily: "Manrope, sans-serif" }}>Cash Flow</h2>
                <MonthlySection title="Fixed Income" type="income_fixed" items={incomeFix} accentColor="text-teal-600"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                  onDelete={deleteMonthly} onAdd={addMonthly} />
                <MonthlySection title="Variable Income" type="income_variable" items={incomeVar} accentColor="text-emerald-500"
                  savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                  onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                  onDelete={deleteMonthly} onAdd={addMonthly} />
                <div className="border-t-2 border-[var(--color-primary)] pt-4">
                  <MonthlySection title="Fixed Expenses" type="expense_fixed" items={expenseFix} accentColor="text-rose-500"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                    onDelete={deleteMonthly} onAdd={addMonthly} />
                  <MonthlySection title="Variable Expenses" type="expense_variable" items={expenseVar} accentColor="text-orange-500"
                    savingState={savingState} displayCurrency={displayCurrency} convertAmount={convertAmount}
                    onUpdateLabel={(id, v) => updateMonthly(id, "label", v)} onUpdateAmount={(id, v) => updateMonthly(id, "amount", v)}
                    onDelete={deleteMonthly} onAdd={addMonthly} />
                </div>
             </div>
           </div>
        )}
      </main>
    </div>
  )
}
`;

fs.writeFileSync(filePath, beforeReturn + newReturnBlock, 'utf8');
console.log("Updated FinanceDashboard.tsx successfully.");
