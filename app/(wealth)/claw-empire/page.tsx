"use client"

import { useEffect, useState } from "react";

export default function ClawEmpirePage() {
  const [clawEmpireUrl, setClawEmpireUrl] = useState<string>("http://localhost:8800");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CLAW_EMPIRE_URL) {
      setClawEmpireUrl(process.env.NEXT_PUBLIC_CLAW_EMPIRE_URL);
    } else if (typeof window !== "undefined") {
      setClawEmpireUrl(`http://${window.location.hostname}:8800`);
    }
  }, []);

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
