import sqlite3

COVERS = {
    "N1": "https://images-na.ssl-images-amazon.com/images/I/71u9sW-JgML.jpg",
    "N2": "https://images-na.ssl-images-amazon.com/images/I/71G8gG0h-KL.jpg",
    "N3": "https://images-na.ssl-images-amazon.com/images/I/71c6hN618EL.jpg",
    "N4": "https://images-na.ssl-images-amazon.com/images/I/71fBwQW4B1L.jpg",
    "N5": "https://images-na.ssl-images-amazon.com/images/I/71wK7v+f4CL.jpg"
}

def main():
    conn = sqlite3.connect("data/portfolio.db")
    cur = conn.cursor()
    
    cur.execute("SELECT id, title FROM books")
    books = cur.fetchall()
    
    updated = 0
    for book_id, title in books:
        for level, url in COVERS.items():
            if level in title:
                cur.execute("UPDATE books SET cover_image = ? WHERE id = ?", (url, book_id))
                conn.commit()
                print(f"Updated cover for {title} to {url}")
                updated += 1
                break
                
    conn.close()
    print(f"Finished! Successfully mapped {updated} stable Japanese covers.")

if __name__ == "__main__":
    main()
