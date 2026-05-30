import sqlite3
import requests
import urllib.parse
import sys
import time

def fetch_ol_cover(title):
    search_title = title
    if "はじめての日本語能力試験" in title:
        for level in ["N1", "N2", "N3", "N4", "N5"]:
            if level in title:
                search_title = f"はじめての日本語能力試験 {level}"
                break
                
    url = f"https://openlibrary.org/search.json?q={urllib.parse.quote(search_title)}&limit=1"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            docs = data.get("docs", [])
            if docs:
                cover_i = docs[0].get("cover_i")
                if cover_i:
                    return f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"
    except Exception as e:
        print(f"Error fetching for {title}: {e}")
    return None

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = "data/portfolio.db"
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT id, title FROM books WHERE cover_image IS NULL")
    books = cur.fetchall()
    
    print(f"พบหนังสือที่ไม่มีรูปปก {len(books)} เล่ม")
    updated_count = 0
    for book_id, title in books:
        print(f"กำลังดึงปกสำหรับ: {title} ...")
        cover_url = fetch_ol_cover(title)
        if cover_url:
            cur.execute("UPDATE books SET cover_image = ? WHERE id = ?", (cover_url, book_id))
            conn.commit()
            print(f"  -> สำเร็จ! ได้รูปปก: {cover_url}")
            updated_count += 1
        else:
            print(f"  -> ไม่พบรูปปกบน Open Library")
        time.sleep(1)
        
    conn.close()
    print(f"อัปเดตหน้าปกภาษาญี่ปุ่นเรียบร้อยแล้ว {updated_count} เล่ม")

if __name__ == "__main__":
    main()
