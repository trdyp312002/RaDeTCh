import { Suspense } from "react"
import { getFinanceData } from "@/lib/googleSheet"
import FinanceDashboard from "@/components/FinanceDashboard"

// Ensure it's dynamically rendered so it always pulls fresh data from Google Sheets
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function FinancePage() {
  const data = await getFinanceData()
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4" />
          <p className="text-gray-550 text-sm">Loading Financial Dashboards...</p>
        </div>
      </div>
    }>
      <FinanceDashboard data={data} />
    </Suspense>
  )
}
