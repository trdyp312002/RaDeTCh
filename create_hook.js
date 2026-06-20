const fs = require('fs');
const path = require('path');

const originalPath = path.join('C:', 'Users', 'trdyp', 'OneDrive', 'Desktop', 'MYWORLD', 'Projects', 'radetch', 'components', 'FinanceDashboard.tsx');
let content = fs.readFileSync(originalPath, 'utf8');

// Change component to hook
content = content.replace(/export default function FinanceDashboard\(\) \{/, 'export function useFinance() {');

// Export FinanceSection and MonthlySection
content = content.replace(/function FinanceSection\(\{/, 'export function FinanceSection({');
content = content.replace(/function MonthlySection\(\{/, 'export function MonthlySection({');

// Replace the return block
const returnRegex = /  const pnlPct = totalPortValue > 0 \? \(totalPortPnl \/ \(totalPortValue - totalPortPnl\)\) \* 100 : 0\r?\n\r?\n  return \(/;
const returnMatch = content.match(returnRegex);
const returnIdx = returnMatch.index;
const beforeReturn = content.substring(0, returnIdx);

const newReturn = `  const pnlPct = totalPortValue > 0 ? (totalPortPnl / (totalPortValue - totalPortPnl)) * 100 : 0

  return {
    loading: false,
    displayCurrency, setDisplayCurrency,
    dbFinanceItems, setDbFinanceItems,
    dbMonthlyItems, setDbMonthlyItems,
    fxRates,
    networthHistory,
    portLoading, portHoldings, portQuotes,
    activeTab, setActiveTab,
    showBalanceSheet, setShowBalanceSheet,
    savingState,
    addFinance, updateFinance, deleteFinance,
    addMonthly, updateMonthly, deleteMonthly,
    convertAmount, fmtPortValue, prefix,
    totals,
    totalPortValue, totalPortDailyPnl, totalPortPnl, combinedChartData, pieData, pnlPct,
    cashItems, investmentItems, liabilityItems,
    incomeFix, incomeVar, expenseFix, expenseVar
  }
}
`;

fs.writeFileSync(path.join('C:', 'Users', 'trdyp', 'OneDrive', 'Desktop', 'MYWORLD', 'Projects', 'radetch', 'hooks', 'useFinance.ts'), beforeReturn + newReturn, 'utf8');
console.log("Recreated useFinance.ts successfully");
