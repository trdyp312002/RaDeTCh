import os
import json

# กำหนดเส้นทางไฟล์ travel-spots.json
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
filepath = os.path.join(base_dir, "data", "travel-spots.json")

# แผนที่ URL รูปภาพ Unsplash คุณภาพสูง ตรงกับสถานที่จริง (คงที่ ไม่สุ่มมั่ว)
UNSPLASH_MAP = {
    # Toyama Spots
    "toyama-tateyama": "https://images.unsplash.com/photo-1542640244-7e672d6cef21?w=800&auto=format&fit=crop&q=80",
    "toyama-gokayama": "https://images.unsplash.com/photo-1490806869553-ee7f48ef1f7f?w=800&auto=format&fit=crop&q=80",
    "toyama-castle": "https://images.unsplash.com/photo-1590559899731-a3828dfc395d?w=800&auto=format&fit=crop&q=80",
    "toyama-kurobe-dam": "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&auto=format&fit=crop&q=80",
    "toyama-zuiryuji": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80",
    "toyama-glass-museum": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80",
    "toyama-unazuki": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=80",
    "toyama-himi": "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=800&auto=format&fit=crop&q=80",
    "toyama-tonami": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    "toyama-kurobe-gorge": "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&auto=format&fit=crop&q=80",
    
    # Japan (National) Spots
    "japan-fushimi-inari": "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800&auto=format&fit=crop&q=80",
    "japan-nara": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop&q=80",
    "japan-dotonbori": "https://images.unsplash.com/photo-1590254559677-1ef31994c81a?w=800&auto=format&fit=crop&q=80",
    "japan-arashiyama": "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&auto=format&fit=crop&q=80",
    "japan-sensoji": "https://images.unsplash.com/photo-1490806869553-ee7f48ef1f7f?w=800&auto=format&fit=crop&q=80",
    "japan-fuji": "https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&auto=format&fit=crop&q=80",
    "japan-hiroshima": "https://images.unsplash.com/photo-1557409518-691ebcd96038?w=800&auto=format&fit=crop&q=80",
    "japan-shirakawa": "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&auto=format&fit=crop&q=80",
    "japan-hakone": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop&q=80",
    "japan-kenroku": "https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800&auto=format&fit=crop&q=80",
    
    # World Spots
    "world-vietnam-hoi-an": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
    "world-vietnam-hanoi": "https://images.unsplash.com/photo-1509030118278-447e44b20244?w=800&auto=format&fit=crop&q=80",
    "world-vietnam-halong": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80",
    "world-thailand-chiangmai": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop&q=80",
    "world-taiwan-jiufen": "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=800&auto=format&fit=crop&q=80",
    "world-korea-gyeongju": "https://images.unsplash.com/photo-1538669715515-5c3789a7f1e4?w=800&auto=format&fit=crop&q=80",
    "world-singapore-gardens": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop&q=80",
    "world-iceland-aurora": "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&auto=format&fit=crop&q=80"
}

def main():
    if not os.path.exists(filepath):
        print(f"[Error] ไม่พบไฟล์ที่ {filepath}")
        return

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    # วนลูปแก้รูปภาพ
    updated_count = 0
    for category in ["toyama", "japan", "world"]:
        if category in data:
            for spot in data[category]:
                spot_id = spot.get("id")
                if spot_id in UNSPLASH_MAP:
                    old_img = spot.get("image")
                    new_img = UNSPLASH_MAP[spot_id]
                    if old_img != new_img:
                        spot["image"] = new_img
                        updated_count += 1
                        print(f"[Updated] {spot.get('name')} -> {new_img}")

    if updated_count > 0:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"=== ปรับปรุงรูปภาพเสร็จสิ้น! แก้ไขรูปภาพทั้งสิ้น {updated_count} จุด ===")
    else:
        print("=== ข้อมูลรูปภาพเป็นปัจจุบันและสวยงามแล้ว ไม่จำเป็นต้องแก้ไข ===")

if __name__ == "__main__":
    main()
