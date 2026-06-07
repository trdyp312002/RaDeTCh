"use client"

export default function ClawEmpirePage() {
  return (
    <div className="w-full" style={{ height: "calc(100vh - 4rem)" }}>
      <iframe
        src="http://localhost:8800"
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        title="Claw Empire"
      />
    </div>
  )
}
