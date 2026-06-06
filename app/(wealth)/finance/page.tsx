import FinanceDashboard from "@/components/FinanceDashboard"

// Ensure dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function FinancePage() {
  return (
    <FinanceDashboard />
  )
}
