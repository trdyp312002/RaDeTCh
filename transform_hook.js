const fs = require('fs');
const path = require('path');

const hookPath = path.join('C:', 'Users', 'trdyp', 'OneDrive', 'Desktop', 'MYWORLD', 'Projects', 'radetch', 'hooks', 'useFinance.ts');
let content = fs.readFileSync(hookPath, 'utf8');

// Replace "export default function FinanceDashboard()" with "export function useFinance()"
content = content.replace(/export default function FinanceDashboard\(\) \{/, 'export function useFinance() {');

// Find the start of the return statement
const returnRegex = /  const pnlPct = totalPortValue > 0 \? \(totalPortPnl \/ \(totalPortValue - totalPortPnl\)\) \* 100 : 0\r?\n\r?\n  return \(/;
const returnMatch = content.match(returnRegex);

if (returnMatch) {
    const returnIdx = returnMatch.index;
    const beforeReturn = content.substring(0, returnIdx);
    
    // Create the new return object
    const newReturn = `
  const pnlPct = totalPortValue > 0 ? (totalPortPnl / (totalPortValue - totalPortPnl)) * 100 : 0

  return {
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
    convertAmount, fmtPortValue,
    totals,
    totalPortValue, totalPortPnl, combinedChartData, pieData,
    cashItems, investmentItems, liabilityItems,
    incomeFix, incomeVar, expenseFix, expenseVar
  }
}
`;
    fs.writeFileSync(hookPath, beforeReturn + newReturn, 'utf8');
    console.log("Transformed useFinance.ts successfully.");
} else {
    console.log("Could not find the return statement to replace.");
}
