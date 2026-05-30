import os
import json
import random
import datetime
import sqlite3
import urllib.parse

class DataHelper:
    def __init__(self):
        # ค้นหาไดเรกทอรี data ที่แชร์ร่วมกัน
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.data_dir = os.path.join(base_dir, "data")
        
        # โหลดข้อมูลต่างๆ
        self.menu_data = self._load_json("menu.json", {"items": []})
        self.travel_data = self._load_json("travel-spots.json", {"toyama": [], "japan": [], "world": []})
        self.holiday_data = self._load_json("holidays.json", {"holidays": []})
        self.music_data = self._load_json("music-playlist.json", {"total": 0, "languages": []})

    def _load_json(self, filename, fallback):
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[DataHelper Error] ไม่สามารถอ่านไฟล์ {filename}: {e}")
        return fallback

    def _save_json(self, filename, data):
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"[DataHelper Error] ไม่สามารถบันทึกไฟล์ {filename}: {e}")
            return False

    # --- ส่วนการจัดการเมนูอาหาร (Menu Management) ---
    def get_all_menus(self):
        # รีโหลดข้อมูลปัจจุบันก่อนทุกครั้งป้องกันข้อมูลไม่ซิงค์
        self.menu_data = self._load_json("menu.json", {"items": []})
        return self.menu_data.get("items", [])

    def get_random_menu(self, nationality=None, max_calories=None, tag=None):
        items = self.get_all_menus()
        if not items:
            return None
            
        filtered = items
        if nationality:
            filtered = [x for x in filtered if x.get("nationality", "").lower() == nationality.lower()]
        if max_calories:
            filtered = [x for x in filtered if x.get("calories", 9999) <= max_calories]
        if tag:
            filtered = [x for x in filtered if tag in x.get("tags", [])]
            
        if not filtered:
            return random.choice(items) # คืนค่าสุ่มทั่วไปถ้ากรองแล้วไม่เจอ
        return random.choice(filtered)

    def add_menu_item(self, name, description, price=50, calories=500, time=15, nationality="thai", tags=None, ingredients=None, steps=None):
        """
        บันทึกข้อมูลเมนูอาหารลงใน menu.json ของระบบเว็บไซต์โดยตรง
        """
        self.menu_data = self._load_json("menu.json", {"items": []})
        
        # จัดแจงวัตถุดิบและขั้นตอน
        if not tags:
            tags = ["ข้าว", "หมู", "ไข่"]
        if not ingredients:
            ingredients = [{"name": "วัตถุดิบตัวอย่าง", "amount": "ตามสมควร"}]
        if not steps:
            steps = ["เตรียมวัตถุดิบ", "ปรุงรสชาติ", "ตักเสิร์ฟพร้อมทาน"]
            
        new_item = {
            "id": str(int(datetime.datetime.now().timestamp())),
            "name": name,
            "image": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop&auto=format",
            "emoji": "🍳",
            "nationality": nationality,
            "tags": tags,
            "price": int(price),
            "time": int(time),
            "calories": int(calories),
            "servings": 1,
            "difficulty": 1,
            "desc": description,
            "ingredients": ingredients,
            "steps": steps
        }
        
        self.menu_data["items"].append(new_item)
        return self._save_json("menu.json", self.menu_data)

    # --- ส่วนการจัดการสถานที่ท่องเที่ยว (Travel Spots Management) ---
    def get_travel_spots(self, region=None):
        self.travel_data = self._load_json("travel-spots.json", {"toyama": [], "japan": [], "world": []})
        if not self.travel_data:
            return []
            
        if region:
            return self.travel_data.get(region, [])
            
        # คืนค่าทั้งหมดรวมกัน
        all_spots = []
        for reg, spots in self.travel_data.items():
            all_spots.extend(spots)
        return all_spots

    def get_random_travel_spot(self, region=None):
        spots = self.get_travel_spots(region)
        if not spots:
            return None
        return random.choice(spots)

    def add_travel_spot(self, name, description, region="toyama", tags=None, name_jp=None):
        """
        บันทึกสถานที่ท่องเที่ยวลงใน travel-spots.json ของระบบเว็บไซต์โดยตรง
        """
        self.travel_data = self._load_json("travel-spots.json", {"toyama": [], "japan": [], "world": []})
        region = region.lower()
        if region not in self.travel_data:
            self.travel_data[region] = []
            
        if not tags:
            tags = ["nature", "sightseeing"]
            
        new_spot = {
            "id": f"{region}-{int(datetime.datetime.now().timestamp())}",
            "name": name,
            "nameJP": name_jp or name,
            "region": region.upper() + ", Japan" if region in ["toyama", "japan"] else region,
            "desc": description,
            "image": "https://loremflickr.com/800/500/japan,scenery",
            "tags": tags,
            "status": "not-visited",
            "visitedDate": None,
            "note": ""
        }
        
        self.travel_data[region].append(new_spot)
        return self._save_json("travel-spots.json", self.travel_data)

    # --- ส่วนการจัดการเพลง (Music Playlist Management) ---
    def get_all_songs(self):
        self.music_data = self._load_json("music-playlist.json", {"total": 0, "languages": []})
        return self.music_data

    def _extract_yt_id(self, url):
        """แยก Youtube Song ID จาก URL"""
        try:
            parsed = urllib.parse.urlparse(url)
            if "youtube.com" in parsed.netloc:
                query = urllib.parse.parse_qs(parsed.query)
                return query.get("v", [""])[0]
            elif "youtu.be" in parsed.netloc:
                return parsed.path.lstrip("/")
            elif "music.youtube.com" in parsed.netloc:
                query = urllib.parse.parse_qs(parsed.query)
                return query.get("v", [""])[0]
        except Exception:
            pass
        return "song-" + str(int(datetime.datetime.now().timestamp()))

    def add_music_song(self, language_id, artist_name, song_title, url, duration_secs=200):
        """
        บันทึกเพลงใหม่ลงใน music-playlist.json ของหน้าเว็บโดยตรง
        """
        self.music_data = self._load_json("music-playlist.json", {"total": 0, "languages": []})
        language_id = language_id.lower()
        
        # ค้นหาภาษา
        target_lang = None
        for lang in self.music_data.get("languages", []):
            if lang.get("id") == language_id:
                target_lang = lang
                break
                
        # หากไม่พบภาษา ให้สร้างใหม่
        if not target_lang:
            label_map = {"japanese": "ญี่ปุ่น", "korean": "เกาหลี", "thai": "ไทย", "english": "สากล"}
            color_map = {"japanese": "pink", "korean": "orange", "thai": "red", "english": "blue"}
            target_lang = {
                "id": language_id,
                "label": label_map.get(language_id, language_id.upper()),
                "color": color_map.get(language_id, "gray"),
                "total": 0,
                "artists": []
            }
            self.music_data["languages"].append(target_lang)
            
        # ค้นหาศิลปิน
        target_artist = None
        for artist in target_lang.get("artists", []):
            if artist.get("name", "").lower() == artist_name.lower():
                target_artist = artist
                break
                
        # หากไม่พบศิลปิน ให้สร้างใหม่
        if not target_artist:
            target_artist = {
                "name": artist_name,
                "songCount": 0,
                "songs": []
            }
            target_lang["artists"].append(target_artist)
            
        # สร้างเพลงใหม่
        song_id = self._extract_yt_id(url)
        new_song = {
            "duration": int(duration_secs),
            "title": song_title,
            "url": url,
            "id": song_id
        }
        
        # ป้องกันไม่ให้เพลงซ้ำ
        exists = any(s.get("id") == song_id for s in target_artist["songs"])
        if not exists:
            target_artist["songs"].append(new_song)
            target_artist["songCount"] += 1
            target_lang["total"] += 1
            self.music_data["total"] += 1
            
            # บันทึกลงในไฟล์ JSON
            return self._save_json("music-playlist.json", self.music_data)
        return False

    # --- ส่วนการจัดการคลังหนังสือ (Books Database using portfolio.db) ---
    def get_books(self, status=None):
        portfolio_db_path = os.path.join(self.data_dir, "portfolio.db")
        if not os.path.exists(portfolio_db_path):
            print(f"[DataHelper Error] ไม่พบไฟล์ portfolio.db ในพิกัด: {portfolio_db_path}")
            return []
            
        try:
            conn = sqlite3.connect(portfolio_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # ตรวจว่าตารางมีอยู่ไหมก่อนดึงข้อมูล
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='books'")
            if not cursor.fetchone():
                return []
                
            if status:
                cursor.execute("SELECT * FROM books WHERE status = ? ORDER BY created_at DESC", (status,))
            else:
                cursor.execute("SELECT * FROM books ORDER BY created_at DESC")
                
            books = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return books
        except Exception as e:
            print(f"[DataHelper Error] ดึงข้อมูลหนังสือขัดข้อง: {e}")
            return []

    def fetch_book_details_from_google(self, title, author=""):
        """
        ดึงข้อมูลหนังสือจริงและรูปภาพหน้าปกจริงจาก Google Books API
        """
        import requests
        import urllib.parse
        
        api_key = os.getenv("GEMINI_API_KEY")
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
                
                # หากไม่พบ ลองค้นหาแบบชื่อเดี่ยว
                if not items:
                    url_fallback = f"https://www.googleapis.com/books/v1/volumes?q={urllib.parse.quote(title)}&maxResults=1"
                    if api_key:
                        url_fallback += f"&key={api_key}"
                    response = requests.get(url_fallback, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        items = data.get("items", [])
                
                if items:
                    volume_info = items[0].get("volumeInfo", {})
                    real_title = volume_info.get("title")
                    authors = volume_info.get("authors", [])
                    real_author = authors[0] if authors else author
                    desc = volume_info.get("description", "")
                    
                    # ดึงลิงก์รูปภาพปก
                    image_links = volume_info.get("imageLinks", {})
                    cover_image = image_links.get("thumbnail") or image_links.get("smallThumbnail")
                    if cover_image and cover_image.startswith("http://"):
                        cover_image = cover_image.replace("http://", "https://")
                        
                    return {
                        "title": real_title,
                        "author": real_author,
                        "description": desc,
                        "cover_image": cover_image
                    }
        except Exception as e:
            print(f"[DataHelper Error] ดึงข้อมูลจาก Google Books ขัดข้อง: {e}")
        return None

    def add_book(self, title, author, description="", category="ทั่วไป", status="wishlist", cover_image=None):
        """
        บันทึกข้อมูลหนังสือลงใน SQLite Database ตาราง books ของเว็บไซต์โดยตรง
        """
        # หากไม่มีรูปปก หรือไม่มีเรื่องย่อ ให้บอทดึงข้อมูลจริงๆ จาก Google Books API เองโดยอัตโนมัติ
        if not cover_image or not description or description == "":
            google_data = self.fetch_book_details_from_google(title, author)
            if google_data:
                if not cover_image:
                    cover_image = google_data.get("cover_image")
                if not description or description == "":
                    g_desc = google_data.get("description", "")
                    if len(g_desc) > 300:
                        g_desc = g_desc[:297] + "..."
                    description = g_desc

        portfolio_db_path = os.path.join(self.data_dir, "portfolio.db")
        try:
            conn = sqlite3.connect(portfolio_db_path)
            cursor = conn.cursor()
            
            # มั่นใจว่ามีตารางรองรับ (Self-Healing Schema)
            cursor.execute("""
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
            """)
            
            # ลองเพิ่มคอลัมน์ในตารางกรณีสร้างฐานข้อมูลไว้ก่อนหน้าแล้ว
            try:
                cursor.execute("ALTER TABLE books ADD COLUMN cover_image TEXT")
            except sqlite3.OperationalError:
                pass # คอลัมน์มีอยู่แล้ว ข้ามได้เลย
            
            # สุ่ม/สร้าง UUID สำหรับคีย์หลัก
            import uuid
            book_id = str(uuid.uuid4())
            
            cursor.execute(
                "INSERT INTO books (id, title, author, description, category, status, cover_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (book_id, title, author, description, category, status, cover_image)
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"[DataHelper Error] ไม่สามารถเพิ่มหนังสือลง Database: {e}")
            return False

    # --- ส่วนการตรวจสอบวันหยุด (Holidays) ---
    def get_holidays(self):
        return self.holiday_data.get("holidays", [])

    def is_holiday(self, date_str=None):
        if not date_str:
            date_str = datetime.datetime.now().strftime("%Y-%m-%d")
        
        for h in self.get_holidays():
            if h.get("date") == date_str:
                return h.get("name")
        return None

    # --- ส่วนตารางรูทีนชีวิตประจำวัน (Routines) ---
    def get_routine_rules(self):
        return [
            "Anki ห้ามข้าม — ทำทุกวัน ถ้าเหนื่อยให้ทำก่อนนอนก็ได้ แต่ต้องทำ 🧠",
            "Exercise — ข้ามได้ไม่เกิน 2 วัน/สัปดาห์ 🏃‍♂️",
            "OT day: ทำครบ 160 นาที พอดี 22:00 — ไม่มี Free time 💼",
            "Sleep 22:30 — Fixed เวลาไว้ ห้ามเลื่อนเด็ดขาด 😴",
        ]

    def get_schedule(self, mode="normal"):
        if mode == "ot":
            return [
                {"time": "06:30", "block": "Wake up", "duration": "—", "type": "fixed"},
                {"time": "08:00 – 19:00", "block": "Work (OT) 💼", "duration": "—", "type": "work"},
                {"time": "19:20", "block": "Home 🏡", "duration": "—", "type": "fixed"},
                {"time": "19:20 – 19:50", "block": "Exercise 🏃‍♂️", "duration": "30 min", "type": "priority"},
                {"time": "19:50 – 20:15", "block": "กินข้าว 🍽️", "duration": "25 min", "type": "priority"},
                {"time": "20:15 – 20:35", "block": "อาบน้ำ 🚿", "duration": "20 min", "type": "priority"},
                {"time": "20:35 – 21:00", "block": "ซักเสื้อผ้า 🧺", "duration": "25 min", "type": "priority"},
                {"time": "21:00 – 22:00", "block": "Anki (25 words) 🧠", "duration": "60 min", "type": "anki"},
                {"time": "22:00 – 22:30", "block": "Pre-sleep prep 🛌", "duration": "30 min", "type": "fixed"},
                {"time": "22:30", "block": "Sleep 😴", "duration": "8 hours", "type": "sleep"},
            ]
        elif mode == "weekend":
            return [
                {"time": "06:30", "block": "Wake up", "duration": "—", "type": "fixed"},
                {"time": "07:00 – 07:30", "block": "Exercise 🏃‍♂️", "duration": "30 min", "type": "priority"},
                {"time": "07:30 – 07:55", "block": "กินข้าว 🍽️", "duration": "25 min", "type": "priority"},
                {"time": "07:55 – 08:15", "block": "อาบน้ำ 🚿", "duration": "20 min", "type": "priority"},
                {"time": "08:15 – 08:40", "block": "ซักเสื้อผ้า 🧺", "duration": "25 min", "type": "priority"},
                {"time": "08:40 – 09:40", "block": "Anki (25 words) 🧠", "duration": "60 min", "type": "anki"},
                {"time": "09:40 – 22:00", "block": "Free time 🎉", "duration": "12h 20min", "type": "free"},
                {"time": "22:00 – 22:30", "block": "Pre-sleep prep 🛌", "duration": "30 min", "type": "fixed"},
                {"time": "22:30", "block": "Sleep 😴", "duration": "8 hours", "type": "sleep"},
            ]
        else: # normal
            return [
                {"time": "06:30", "block": "Wake up", "duration": "—", "type": "fixed"},
                {"time": "08:00 – 16:45", "block": "Work 💼", "duration": "—", "type": "work"},
                {"time": "17:00", "block": "Home 🏡", "duration": "—", "type": "fixed"},
                {"time": "17:00 – 17:30", "block": "Exercise 🏃‍♂️", "duration": "30 min", "type": "priority"},
                {"time": "17:30 – 17:55", "block": "กินข้าว 🍽️", "duration": "25 min", "type": "priority"},
                {"time": "17:55 – 18:15", "block": "อาบน้ำ 🚿", "duration": "20 min", "type": "priority"},
                {"time": "18:15 – 18:40", "block": "ซักเสื้อผ้า 🧺", "duration": "25 min", "type": "priority"},
                {"time": "18:40 – 19:40", "block": "Anki (25 words) 🧠", "duration": "60 min", "type": "anki"},
                {"time": "19:40 – 22:00", "block": "Free time 🎉", "duration": "2h 20min", "type": "free"},
                {"time": "22:00 – 22:30", "block": "Pre-sleep prep 🛌", "duration": "30 min", "type": "fixed"},
                {"time": "22:30", "block": "Sleep 😴", "duration": "8 hours", "type": "sleep"},
            ]
