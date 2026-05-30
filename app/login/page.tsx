"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.replace("/")
      router.refresh()
    } else {
      const j = await res.json().catch(() => ({}))
      setError(j.error || "Login failed")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <form onSubmit={submit} className="w-full max-w-xs">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 mb-3">Private</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">RaDeTCh</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"
        />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-gray-900 text-white text-sm rounded-xl py-3 hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </div>
  )
}
