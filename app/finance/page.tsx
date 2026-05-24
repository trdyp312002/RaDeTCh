import { getFinanceData } from "@/lib/googleSheet"
import FinanceDashboard from "@/components/FinanceDashboard"

// Ensure it's dynamically rendered so it always pulls fresh data from Google Sheets
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FinancePage() {
  const data = await getFinanceData()
  return <FinanceDashboard data={data} />
}
