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

    // 1. Move BTC/BTC-USD to retirement, and rename 'BTC' -> 'BTC-USD' if it exists to preserve user transactions
    logs.push("[*] Merging or moving BTC/BTC-USD holding to retirement portfolio...")
    const btcCheck = await db.execute({
      sql: "SELECT * FROM holdings WHERE symbol IN ('BTC', 'BTC-USD') LIMIT 2",
      args: []
    })
    
    let btcHoldingId = "d9f453c5-78cc-4726-bc15-b19dad1d9d3f"
    if (btcCheck.rows.length > 0) {
      const existingBtc = btcCheck.rows.find(r => (r.symbol as string) === "BTC") || btcCheck.rows[0]
      btcHoldingId = existingBtc.id as string
      await db.execute({
        sql: "UPDATE holdings SET symbol = 'BTC-USD', portfolio = 'retirement' WHERE id = ?",
        args: [btcHoldingId]
      })
      logs.push(`[+] Found existing Bitcoin holding (Symbol: ${existingBtc.symbol}, ID: ${btcHoldingId}). Updated symbol to 'BTC-USD' and portfolio to 'retirement'. (All transactions preserved!)`)
    } else {
      await db.execute({
        sql: "INSERT INTO holdings (id, symbol, name, type, portfolio) VALUES (?, 'BTC-USD', 'Bitcoin', 'crypto', 'retirement')",
        args: [btcHoldingId]
      })
      logs.push(`[+] Inserted new BTC-USD holding (ID: ${btcHoldingId}) in retirement.`)
    }

    // 2. Ensure BTC-USD transaction exists so it has a positive quantity (only seeded if the user has 0 transactions)
    const txCheck = await db.execute({
      sql: "SELECT * FROM transactions WHERE holding_id = ? LIMIT 1",
      args: [btcHoldingId]
    })
    if (txCheck.rows.length === 0) {
      await db.execute({
        sql: "INSERT INTO transactions (id, holding_id, type, quantity, price, fees, date, notes) VALUES ('e61aec7b-f74a-4806-a933-96c2693ccb27', ?, 'BUY', 0.00024486, 67762.96, 0, '2026-02-27', 'Initial retirement seed')",
        args: [btcHoldingId]
      })
      logs.push("[+] Seeded initial BUY transaction for Bitcoin DCA (no previous transactions found).")
    } else {
      logs.push("[+] Bitcoin transactions already exist on your database. Skipped seeding to avoid altering your real data.")
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

    // 5. Create diary_entries table and migrate existing .md diary files
    logs.push("[*] Creating diary_entries table...")
    await db.execute(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        date       TEXT PRIMARY KEY,
        morning    TEXT NOT NULL DEFAULT '',
        afternoon  TEXT NOT NULL DEFAULT '',
        evening    TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `)
    logs.push("[+] diary_entries table ready.")

    const diarySeeds = [
      {
        date: "2026-06-08",
        morning: "ช่วงเช้าวันนี้ ตื่น 6 โมง นิดๆ รู้สึกนอนไม่พอเพราะนอน 5 ทุ่ม ต้องมารอ ล้างหน้า แปรงฟันปกติ แล้วก็แต่งตัว เสร็จแล้ว กินไข่ฟองเดียว ทำลายดื่ม Olive Oil กินไปโปรตีน แล้วก็นั่งเล่นในห้องสักพัก ไปทำงานตอนเจ็ดโมงยี่สิบแปด ไปถึง นั่งเล่นสักพักแล้วไปเข้าแถว ราจิโอ ไทโซว ช่วงเช้าประกอบเครื่องจักรรุ่นสองร้อย และวันนี้กังวลเรื่องลา เพราะลาครั้งแรกก็เลยกลัวว่า คุณซึชิมะ จะมองไม่ดี พอบอกไปว่าลาเค้าก็บอกไม่เป็นไร วันนี้คุยกับ ชิมุราซัง นิดเดี่ยว แล้วบอกให้ไปเติมน้ำมันรุ่น 150 ด้วยแค่นั้น และวันนี้ ซึชิมะซัง ให้กระดาษแนะนำการเที่ยวมา และบอกให้มาก่อน 15 นาที ส่วนนากามุระ ให้ช่วยงานเพราะตอนวันศุกร์งานเสร็จไม่ทัน ก็เลยช่วยเยอะหน่อย เพราะผมไปถามว่างานยังไม่เสร็จหรอ ซึ่งแกก็ทำโอต่อทั้งๆที่เป็นวันศุกร์",
        afternoon: "ตอนกินข้าวเสร็จ ลุงที่พูดภาษาไทยไดนิดหน่อย มองตอนเดินสวนกันคิดว่ารู้ว่าลาหลังไปเที่ยววันจันทร์(คิดมากเกิน) แล้วหลังพักก็ท่องศัพท์ ปกติ และทำ 200 ต่อ จนถึง พักรอบ 2 ตอนบ่าย 3 จนทำไปเรื่อยๆ แต่ววันนี้ซึชิมะซังไม่ถามว่า ทำ o ไหม เลยไปถามนากามุระ ว่า มีโอไหม บอกวันนี้ไมเป็นไร",
        evening: "ตอนกลับบ้าน ไปร์ รออยู่ที่จอดจักรยาน แล้วเล่าว่า haradasan โดน อริซาวาซังดุเสียงดัง (น่ากลัวโดนบ่อยตอนทำที่ seikan )ช่วงกลับไม่มีอะไรพิเศษ กลับมาถึงบ้าน กินข้าว ซักผ้า และวันนี้เก็บพวกขวดเพราะเยอะมากสกปรกห้อง และถามเจมิไนว่าทิ้งขวดแก้วยังไง มันตอบว่า เหมือนกับ ขวดกระป๋อง แต่ยังงงอยู่ อาบน้ำ แปรงฟัน และแก้ไข้ โค็ด ลบ claw empire และเพิ่มระบบ finance ให้เหมือนกับ yahoo finance ให้มีตารางเลื่อนไปมาและมีพวกทรัพย์สินต่างๆ ของแต่ละประเทศ และฟังอาจาร์ตั้มเรื่องbitcoin ห้าปีแล้วยังอยู่ที่เดิม ซึ่ง Bitcoin จะมีรอบ Cycle เหมือนเดิมไหมก็ยังเป็นสิ่งที่น่าสนใจ ตอนนี้ Bitcoin อาจจะเป็นสินทรัพย์ที่ดีมากๆ เพราะว่าในเมื่อเราสามารถสร้างอะไรก็ได้ผ่าน AI ก็มีโอกาสที่เราจะสามารถสร้างระบบการจ่ายเงินด้วย Bitcoin ได้ด้วยตนเอง สุดท้าย สร้างระบบ daily และเขียนเป็นครั้งแรก",
      },
      {
        date: "2026-06-09",
        morning: "ตอนเช้าปวดท้องตื่นมาตอนตีห้า ลุก ๆ นอน ๆ จนตื่นมาอีกทีตอนเจ็ดโมงยี่สิบ แล้วก็ไปทำงาน ตอนเช้าก็ทำเครื่องจักรสองร้อยต่อ โดยทำเครื่องหงไตด้านใน ก็คือการใส่แท่งยาวๆ อันเล็กๆ แล้วก็เอา เช็คว่ามีช่องว่างไหม ทําไปถึงเที่ยง",
        afternoon: "ช่วงเข้าวานก็ยังทำหงไตต่อ แต่จะเป็นประกอบอันใหญ่แทน ด้วยตอนเช้า ชิมูระซังไม่ได้ให้ ไม่ได้บอกว่า ต้อง Mentoring ไหม ก็เลยไม่ได้ทำ พอใส่ไปปึ๊บก็มีช่องว่าง เช็คยังไงก็ยังไม่ได้ ก็ต้องไป 面取り อีกรอบหนึ่ง จนถึงบ่ายสาม แล้วก็พัก ช่วงบ่ายสามทำต่อจนถึงสี่โมง แล้วพอทำเสร็จเราก็ได้ไปทำการอุดรูที่ต้องวัดส่วนผสมเก้าต่อสิบ ซึ่งผสมไปสามร้อยก็ยังไม่พอ ก็เลยเพิ่มไปอีกหนึ่งร้อยเป็นสี่ร้อย ซึ่งวันนี้ก็ทำ OT ต่อ แต่จะเป็นการประกอบหงส์ไตอันเล็กๆ ที่อยู่ด้านซ้ายล่าง ของเครื่องหุงไก่ ซึ่งทำไปทำมาก็ต๊าป แล้วอันสุดท้ายอันที่สองเหมือนจะช่องจะเบี้ยวต๊าปไม่ได้ก็เลยไปเรียก ชิมูระสั่งมา แกก็เลยจัดการ สุดท้ายก็ทำต่อ แต่ก็ยังไม่เสร็จ แล้วก็เลิกงาน",
        evening: "หลังจากกลับมาบ้าน  ผมมองไปที่กระดาษอันหนึ่ง แล้วเป้ก็ตอบว่าเขาจะมาตัดต้นไม้ แล้วผมก็ตอบไปว่า จักรยาน ยางแตกเหรอ แล้วก็ให้ล้อในไปเปลี่ยน แล้วก็ไม่มีอะไร กินข้าว อาบน้ำ แล้ววันนี้ก็เช็ค Hermès ว่าสามารถใช้ได้ไหม แต่ก็ติดตั้งไม่สำเร็จ แล้วก็ล้มเลิกไป จนตอนนี้ก็สามทุ่ม ก็มาเขียน Dairy",
      },
      {
        date: "2026-06-20",
        morning: "สวัสดีตอนเช้า",
        afternoon: "",
        evening: "",
      },
    ]

    logs.push("[*] Migrating existing diary entries...")
    let migratedCount = 0
    for (const entry of diarySeeds) {
      try {
        await db.execute({
          sql: `INSERT OR IGNORE INTO diary_entries (date, morning, afternoon, evening) VALUES (?, ?, ?, ?)`,
          args: [entry.date, entry.morning, entry.afternoon, entry.evening],
        })
        migratedCount++
      } catch (e: any) {
        logs.push(`[!] Skipped ${entry.date}: ${e.message}`)
      }
    }
    logs.push(`[+] Migrated ${migratedCount} diary entries.`)

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
