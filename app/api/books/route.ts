import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"

export const dynamic = "force-dynamic"

// ฟังก์ชันสร้างตารางหากไม่มี
async function ensureTableExists() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'ทั่วไป',
      status TEXT DEFAULT 'wishlist' CHECK(status IN ('wishlist', 'bought', 'reading', 'completed')),
      cover_image TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  try {
    // เพิ่มคอลัมน์ในตารางกรณีที่มีการสร้างตารางไว้ก่อนหน้าแล้ว
    await db.execute(`ALTER TABLE books ADD COLUMN cover_image TEXT`)
  } catch (e) {
    // คอลัมน์อาจจะมีอยู่แล้ว ให้ข้ามข้อผิดพลาดนี้ไป
  }

  // Self-Healing Seeder: ทำการเพิ่มข้อมูลหนังสือตัวอย่าง 9 เล่มพร้อมหน้าปกจริงหากฐานข้อมูลว่างเปล่า
  try {
    const countRes = await db.execute("SELECT COUNT(*) as count FROM books")
    const count = Number(countRes.rows[0]?.count || 0)
    if (count === 0) {
      console.log("Seeding books database with 9 premium entries...")
      const seedBooks = [
        {
          id: "seed-1",
          title: "はじめての日本語能力試験 N1 単語 3000",
          author: "ไม่ระบุ",
          description: "หนังสือรวบรวมคำศัพท์ที่จำเป็น 3000 คำ สำหรับการสอบวัดระดับภาษาญี่ปุ่น (JLPT) ระดับ N1 พร้อมคำแปลภาษาอังกฤษและจีน รวมถึงไฟล์เสียงและแบบทดสอบจำลองบนเว็บไซต์.",
          category: "การเรียน/ภาษา/ภาษาญี่ปุ่น",
          status: "bought",
          cover_image: "https://images-na.ssl-images-amazon.com/images/I/71u9sW-JgML.jpg"
        },
        {
          id: "seed-2",
          title: "はじめての日本語能力試験 N3 単語 2000",
          author: "ไม่ระบุ",
          description: "หนังสือรวมคำศัพท์ภาษาญี่ปุ่น 2,000 คำที่จำเป็นสำหรับการสอบวัดระดับ JLPT N3 พร้อมคำแปลภาษาอังกฤษและเวียดนาม และมีไฟล์เสียงกับแบบทดสอบให้ดาวน์โหลดฟรี",
          category: "การเรียน/ภาษา/ภาษาญี่ปุ่น",
          status: "bought",
          cover_image: "https://images-na.ssl-images-amazon.com/images/I/71c6hN618EL.jpg"
        },
        {
          id: "seed-3",
          title: "はじめての日本語能力試験 N5 単語 1000",
          author: "アークアカデミー",
          description: "หนังสือรวบรวมคำศัพท์ภาษาญี่ปุ่น 1,000 คำที่จำเป็นสำหรับการสอบวัดระดับ JLPT N5 โดยมีคำแปลภาษาไทยและอินโดนีเซีย พร้อมไฟล์เสียงและข้อสอบจำลองฟรีบนเว็บไซต์",
          category: "การเรียน/ภาษา/ภาษาญี่ปุ่น",
          status: "bought",
          cover_image: "https://images-na.ssl-images-amazon.com/images/I/71wK7v+f4CL.jpg"
        },
        {
          id: "seed-4",
          title: "はじめての日本語能力試験 N2単語 2500",
          author: "アークアカデミー",
          description: "หนังสือรวมคำศัพท์ภาษาญี่ปุ่น 2500 คำ สำหรับเตรียมสอบวัดระดับ JLPT N2 พร้อมคำแปลภาษาอังกฤษ จีน และเวียดนาม และสื่อประกอบการเรียนฟรีออนไลน์.",
          category: "การเรียน/ภาษา/ภาษาญี่ปุ่น/JLPT N2",
          status: "bought",
          cover_image: "https://images-na.ssl-images-amazon.com/images/I/71G8gG0h-KL.jpg"
        },
        {
          id: "seed-5",
          title: "はじめての日本語能力試験 N4 単語 1500",
          author: "アークアカデミー",
          description: "หนังสือเล่มนี้รวบรวมคำศัพท์ภาษาญี่ปุ่น 1,500 คำที่จำเป็นสำหรับการสอบ JLPT ระดับ N4 พร้อมคำแปลภาษาอังกฤษและเวียดนาม เพื่อช่วยผู้เรียนเตรียมตัวสอบได้อย่างมีประสิทธิภาพ",
          category: "การเรียน/ภาษา/ภาษาญี่ปุ่น",
          status: "bought",
          cover_image: "https://images-na.ssl-images-amazon.com/images/I/71fBwQW4B1L.jpg"
        },
        {
          id: "seed-6",
          title: "เซเปียนส์: ประวัติย่อมนุษยชาติ",
          author: "ยูวัล โนอาห์ แฮรารี",
          description: "หนังสือเล่มนี้จะพาผู้อ่านไปสำรวจประวัติศาสตร์ของเผ่าพันธุ์มนุษย์อย่างกระชับและน่าสนใจ ตั้งแต่อดีตกาลจนถึงโลกยุคใหม่.",
          category: "ประวัติศาสตร์/สังคมศาสตร์/วิทยาศาสตร์",
          status: "bought",
          cover_image: "https://covers.openlibrary.org/b/id/8634250-L.jpg"
        },
        {
          id: "seed-7",
          title: "สาระแม่งต้องเดือด งี้ดิวะ",
          author: "Flagfrog Team",
          description: "หนังสือที่นำเสนอแนวคิดการสร้างสรรค์เนื้อหาให้มีความน่าสนใจและโดดเด่น ด้วยภาษาที่ตรงไปตรงมาและมีพลัง เพื่อสร้างผลกระทบที่ 'เดือด' อย่างแท้จริง",
          category: "พัฒนาตนเอง/การสื่อสาร/การสร้างสรรค์เนื้อหา",
          status: "bought",
          cover_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80"
        },
        {
          id: "seed-8",
          title: "เพราะชีวิตดีได้กว่าที่เป็น",
          author: "JAMES CLEAR",
          description: "หนังสือที่เสนอแนวคิดการเปลี่ยนแปลงเล็กๆ น้อยๆ (Atomic Habits) เพื่อสร้างนิสัยที่ดีและพัฒนาชีวิตให้ดีขึ้นได้อย่างถาวร.",
          category: "พัฒนาตนเอง/จิตวิทยา/การสร้างนิสัย",
          status: "bought",
          cover_image: "https://covers.openlibrary.org/b/id/12539702-L.jpg"
        },
        {
          id: "seed-9",
          title: "SPY x FAMILY",
          author: "Tatsuya Endo",
          description: "เรื่องราวของสายลับมือฉมังที่ต้องสร้างครอบครัวปลอมๆ เพื่อภารกิจลับ ท่ามกลางความตึงเครียดของยุคสงครามเย็น.",
          category: "การ์ตูน/แอคชั่น/คอมเมดี้",
          status: "bought",
          cover_image: "https://covers.openlibrary.org/b/id/10367471-L.jpg"
        }
      ]

      for (const book of seedBooks) {
        await db.execute({
          sql: "INSERT INTO books (id, title, author, description, category, status, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [
            book.id,
            book.title,
            book.author,
            book.description,
            book.category,
            book.status,
            book.cover_image
          ]
        })
      }
      console.log("Seeding books complete.")
    }
  } catch (e) {
    console.error("Failed to seed books database:", e)
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTableExists()
    const category = new URL(req.url).searchParams.get("category")
    const status = new URL(req.url).searchParams.get("status")
    
    let query = "SELECT * FROM books"
    const args: string[] = []
    const conditions: string[] = []
    
    if (category) {
      conditions.push("category = ?")
      args.push(category)
    }
    if (status) {
      conditions.push("status = ?")
      args.push(status)
    }
    
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ")
    }
    
    query += " ORDER BY created_at DESC"
    
    const rowsRes = await db.execute({ sql: query, args })
    return NextResponse.json(rowsRes.rows)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTableExists()
    const { title, author, description, category, status, cover_image } = await req.json()

    if (!title || !author) {
      return NextResponse.json({ error: "Title and Author are required" }, { status: 400 })
    }

    const id = crypto.randomUUID()
    await db.execute({
      sql: "INSERT INTO books (id, title, author, description, category, status, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [
        id, 
        title, 
        author, 
        description ?? null, 
        category ?? "ทั่วไป", 
        status ?? "wishlist",
        cover_image ?? null
      ]
    })

    const bookRes = await db.execute({
      sql: "SELECT * FROM books WHERE id = ?",
      args: [id]
    })
    return NextResponse.json(bookRes.rows[0], { status: 201 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
