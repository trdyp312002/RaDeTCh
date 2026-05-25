import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const logs: string[] = []

    logs.push("[*] Checking if tables exist...")
    // Ensure tables exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS holdings (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'stock',
        portfolio TEXT NOT NULL DEFAULT 'long_term',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(symbol, portfolio)
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        holding_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('BUY','SELL')),
        quantity REAL NOT NULL CHECK(quantity > 0),
        price REAL NOT NULL CHECK(price >= 0),
        fees REAL NOT NULL DEFAULT 0 CHECK(fees >= 0),
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (holding_id) REFERENCES holdings(id) ON DELETE CASCADE
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS finance_items (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL CHECK(category IN ('cash','other_asset','liability')),
        label TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)

    // 1. Move BTC-USD to retirement or insert it if missing
    logs.push("[*] Moving or inserting BTC-USD holding in retirement portfolio...")
    const btcCheck = await db.execute({
      sql: "SELECT * FROM holdings WHERE symbol = 'BTC-USD' LIMIT 1",
      args: []
    })
    
    let btcHoldingId = "d9f453c5-78cc-4726-bc15-b19dad1d9d3f"
    if (btcCheck.rows.length > 0) {
      btcHoldingId = btcCheck.rows[0].id as string
      await db.execute({
        sql: "UPDATE holdings SET portfolio = 'retirement' WHERE id = ?",
        args: [btcHoldingId]
      })
      logs.push(`[+] Updated existing BTC holding (ID: ${btcHoldingId}) portfolio to 'retirement'.`)
    } else {
      await db.execute({
        sql: "INSERT INTO holdings (id, symbol, name, type, portfolio) VALUES (?, 'BTC-USD', 'Bitcoin', 'crypto', 'retirement')",
        args: [btcHoldingId]
      })
      logs.push(`[+] Inserted new BTC-USD holding (ID: ${btcHoldingId}) in retirement.`)
    }

    // 2. Ensure BTC-USD transaction exists so it has a positive quantity
    const txCheck = await db.execute({
      sql: "SELECT * FROM transactions WHERE holding_id = ? LIMIT 1",
      args: [btcHoldingId]
    })
    if (txCheck.rows.length === 0) {
      await db.execute({
        sql: "INSERT INTO transactions (id, holding_id, type, quantity, price, fees, date, notes) VALUES ('e61aec7b-f74a-4806-a933-96c2693ccb27', ?, 'BUY', 0.00024486, 67762.96, 0, '2026-02-27', 'Initial retirement seed')",
        args: [btcHoldingId]
      })
      logs.push("[+] Seeded initial BUY transaction for Bitcoin DCA.")
    } else {
      logs.push("[+] Bitcoin transaction already exists.")
    }

    // 3. Insert long_term US stocks
    logs.push("[*] Seeding US Stocks (AAPL, MSFT, NVDA, RKLB)...")
    const usStocks = [
      { id: "aapl-stock-id", symbol: "AAPL", name: "Apple Inc.", type: "stock", portfolio: "long_term" },
      { id: "msft-stock-id", symbol: "MSFT", name: "Microsoft Corporation", type: "stock", portfolio: "long_term" },
      { id: "nvda-stock-id", symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", portfolio: "long_term" },
      { id: "rklb-stock-id", symbol: "RKLB", name: "Rocket Lab USA, Inc.", type: "stock", portfolio: "long_term" }
    ]

    for (const stock of usStocks) {
      try {
        await db.execute({
          sql: "INSERT INTO holdings (id, symbol, name, type, portfolio) VALUES (?, ?, ?, ?, ?)",
          args: [stock.id, stock.symbol, stock.name, stock.type, stock.portfolio]
        })
        logs.push(`[+] Inserted ${stock.symbol} into holdings.`)
      } catch (e: any) {
        if (e.message?.includes("UNIQUE") || e.message?.includes("constraint")) {
          // If already exists, make sure it is in long_term
          await db.execute({
            sql: "UPDATE holdings SET portfolio = 'long_term' WHERE symbol = ?",
            args: [stock.symbol]
          })
          logs.push(`[~] ${stock.symbol} already exists, ensured portfolio is 'long_term'.`)
        } else {
          logs.push(`[!] Failed to insert ${stock.symbol}: ${e.message}`)
        }
      }
    }

    // 4. Delete legacy static rows from finance_items (e.g. static "BTC" or "US STOCK") to avoid duplicates
    logs.push("[*] Cleaning up duplicate static rows in finance_items...")
    const deleteRes = await db.execute(`
      DELETE FROM finance_items 
      WHERE UPPER(label) IN ('BTC', 'BITCOIN', 'US STOCK', 'US STOCKS', 'US_STOCK')
    `)
    logs.push(`[+] Removed ${deleteRes.rowsAffected ?? 0} static investment items from finance_items database to prevent duplicates.`)

    return NextResponse.json({
      success: true,
      message: "Database migrated and seeded successfully!",
      logs
    })
  } catch (e: any) {
    return NextResponse.json({
      success: false,
      error: e.message || "Failed to execute migrations"
    }, { status: 500 })
  }
}
