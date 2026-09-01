export type WealthFinanceItem = {
  category: string;
  amount: number;
  currency: string;
};

export type WealthHolding = {
  totalValue?: number;
  totalCost?: number;
};

// `/api/fx` returns how many units of each currency equal 1 USD.
// These values are used only until the live FX response is available.
export const FALLBACK_FX_RATES: Record<string, number> = { USD: 1, THB: 35.5, JPY: 150 };

export function toUSD(amount: number, currency: string, rates: Record<string, number>) {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "USD") return amount;
  const rate = rates[normalized];
  return rate && rate > 0 ? amount / rate : amount;
}

/** The single balance-sheet formula used throughout Wealth OS. */
export function calculateWealth(
  financeItems: WealthFinanceItem[],
  holdings: WealthHolding[],
  fxRates: Record<string, number>,
) {
  const sumFinance = (category: string) => financeItems
    .filter(item => item.category === category)
    .reduce((sum, item) => sum + toUSD(Number(item.amount) || 0, item.currency, fxRates), 0);

  const holdingsValue = holdings
    .reduce((sum, holding) => sum + (Number(holding.totalValue ?? holding.totalCost) || 0), 0);
  const cash = sumFinance("cash");
  const otherAssets = sumFinance("other_asset");
  const liabilities = sumFinance("liability");
  const totalAssets = cash + otherAssets + holdingsValue;

  return {
    holdingsValue,
    cash,
    otherAssets,
    liabilities,
    totalAssets,
    netWorth: totalAssets - liabilities,
  };
}
