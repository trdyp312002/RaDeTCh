import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { historicalUsdThb, isFxApplicable } from "@/lib/fx"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const quantity = Number(body.quantity), price = Number(body.price), fees = Number(body.fees ?? 0), fxFeeThb = body.fxFeeThb == null ? undefined : Number(body.fxFeeThb)
    if (!['BUY', 'SELL'].includes(body.type) || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0 || !Number.isFinite(fees) || fees < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 })
    const suppliedFxRate = body.purchaseFxRate == null || body.purchaseFxRate === '' ? null : Number(body.purchaseFxRate)
    if (suppliedFxRate != null && (!Number.isFinite(suppliedFxRate) || suppliedFxRate <= 0)) return NextResponse.json({ error: 'FX rate must be a positive THB-per-USD value' }, { status: 400 })
    const existingResult = await db.execute({ sql: `SELECT t.fx_fee_thb, h.type holding_type FROM transactions t JOIN holdings h ON h.id = t.holding_id WHERE t.id = ?`, args: [id] })
    const existing = existingResult.rows[0]
    if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    const feeThb = fxFeeThb ?? Number(existing.fx_fee_thb ?? 0)
    let rate: number | null = null, originalCost: number | null = null, status = 'not_applicable'
    if (body.type === 'BUY' && isFxApplicable(String(existing.holding_type))) { rate = suppliedFxRate ?? await historicalUsdThb(body.date); status = rate == null ? 'incomplete' : 'complete'; originalCost = rate == null ? null : (quantity * price + fees) * rate + feeThb }
    await db.execute({ sql: `UPDATE transactions SET type = ?, quantity = ?, price = ?, fees = ?, date = ?, notes = ?, purchase_fx_rate = ?, original_cost_thb = ?, fx_fee_thb = ?, fx_data_status = ? WHERE id = ?`, args: [body.type, quantity, price, fees, body.date, body.notes ?? null, rate, originalCost, feeThb, status, id] })
    const result = await db.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] })
    return NextResponse.json(result.rows[0])
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; await db.execute({ sql: 'DELETE FROM transactions WHERE id = ?', args: [id] }); return NextResponse.json({ ok: true }) }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 }) }
}