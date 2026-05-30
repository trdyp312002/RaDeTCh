import sqlite3
import requests
import urllib.parse
import sys
import os
import time

THAI_TO_ENG = {
    "เซเปียนส์: ประวัติย่อมนุษยชาติ": "Sapiens: A Brief History of Humankind",
    "เพราะชีวิตดีได้กว่าที่เป็น": "Atomic Habits",
    "สาระแม่งต้องเดือด งี้ดิวะ": "Creative Thinking",
    "SPY x FAMILY": "Spy x Family"
}

def load_gemini_key():
    env_path = "bot_raphael/.env"
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        return line.split("=", 1)[1].strip()
        except Exception:
            pass
    return os.environ.get("GEMINI_API_KEY")

def fetch_open_library_cover(title):
    # ปรับชื่อไทยเป็นอังกฤษเพื่อเสิร์ชเจอง่ายขึ้น
    search_title = THAI_TO_ENG.get(title, title)
    # ตัดอักขระหรือคำภาษาไทยสั้นๆ ที่อาจทำให้เสิร์ชไม่พบ
    if title == "สาระแม่งต้องเดือด งี้ดิวะ":
        return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80" # วอลเปเปอร์แนวพัฒนาตนเองสวยๆ
        
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
        print(f"  [OpenLibrary Fallback Error]: {e}")
    return None

def fetch_google_cover(title, author="", api_key=None):
    query = f"intitle:{title}"
    if author and author != "ไม่ระบุ" and author != "ไม่ระบุผู้แต่ง":
        query += f" inauthor:{author}"
        
    url = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(query)}&maxResults=1"
    if api_key:
        url += f"&key={api_key}"
        
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            items = data.get("items", [])
            if items:
                volume_info = items[0].get("volumeInfo", {})
                image_links = volume_info.get("imageLinks", {})
                cover_image = image_links.get("thumbnail") or image_links.get("smallThumbnail")
                if cover_image:
                    if cover_image.startswith("http://"):
                        cover_image = cover_image.replace("http://", "https://")
                    return cover_image
    except Exception as e:
        pass
    return None

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    db_path = "data/portfolio.db"
    
    api_key = load_gemini_key()
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT id, title, author, cover_image FROM books")
    books = cur.fetchall()
    
    updated_count = 0
    for book_id, title, author, cover in books:
        # เพื่อความชัวร์ ให้ล้างข้อมูลเก่าหรือเสิร์ชใหม่ทั้งหมดหากเป็น None
        if not cover:
            print(f"กำลังค้นหาหน้าปกสำหรับ: {title} ...")
            cover_url = None
            
            # 1. ลองดึงผ่าน Google Books API
            if api_key:
                cover_url = fetch_google_cover(title, author, api_key)
                
            # 2. หากพลาด (โควตาเต็ม / บัญชีไม่มีสิทธิ์) -> ดึงผ่าน Open Library API (Zero-Quota)
            if not cover_url:
                print(f"  -> ลองดึงผ่าน Open Library API (โควตาฟรีตลอดชีพ)...")
                cover_url = fetch_open_library_cover(title)
                
            if cover_url:
                cur.execute("UPDATE books SET cover_image = ? WHERE id = ?", (cover_url, book_id))
                conn.commit()
                print(f"  -> สำเร็จ! ได้รับหน้าปก: {cover_url}")
                updated_count += 1
            else:
                print(f"  -> ไม่พบหน้าปกบนระบบฐานข้อมูลใดๆ")
            time.sleep(1) # ป้องกันโดนบล็อก
            
    conn.close()
    print(f"เสร็จสิ้น! อัปเดตหน้าปกเรียบร้อยแล้ว {updated_count} เล่ม")

if __name__ == "__main__":
    main()
