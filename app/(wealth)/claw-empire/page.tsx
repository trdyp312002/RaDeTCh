"use client"

export default function ClawEmpirePage() {
  const clawEmpireUrl = process.env.NEXT_PUBLIC_CLAW_EMPIRE_URL || "http://localhost:8800";
  
  return (
    <div className="w-full" style={{ height: "calc(100vh - 4rem)" }}>
      <iframe
        src={clawEmpireUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        title="Claw Empire"
      />
    </div>
  )
}
