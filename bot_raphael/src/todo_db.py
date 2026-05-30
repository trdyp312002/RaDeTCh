import sqlite3
import os
import datetime

class TodoDB:
    def __init__(self):
        # ค้นหาไดเรกทอรี data ที่แชร์ร่วมกัน
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        shared_data_dir = os.path.join(base_dir, "data")
        
        if os.path.exists(shared_data_dir):
            self.db_path = os.path.join(shared_data_dir, "raphael.db")
        else:
            # Fallback หากไม่มีโฟลเดอร์ data
            self.db_path = "raphael.db"
            
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # สร้างตารางสำหรับ Todo List
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS todos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    task TEXT NOT NULL,
                    category TEXT DEFAULT 'ทั่วไป',
                    priority TEXT DEFAULT 'ปานกลาง',
                    status TEXT DEFAULT 'pending',
                    due_date TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    completed_at TEXT
                )
            """)
            # สร้างตารางสำหรับการแจ้งเตือน Reminders
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message TEXT NOT NULL,
                    remind_time TEXT NOT NULL,
                    channel_id INTEGER,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    # --- วิธีการจัดการ Todo ---
    def add_todo(self, task, category="ทั่วไป", priority="ปานกลาง", due_date=None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO todos (task, category, priority, due_date) VALUES (?, ?, ?, ?)",
                (task, category, priority, due_date)
            )
            conn.commit()
            return cursor.lastrowid

    def get_todos(self, status="pending"):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            if status == "all":
                cursor.execute("SELECT * FROM todos ORDER BY id DESC")
            else:
                cursor.execute("SELECT * FROM todos WHERE status = ? ORDER BY id DESC", (status,))
            return [dict(row) for row in cursor.fetchall()]

    def complete_todo(self, todo_id):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "UPDATE todos SET status = 'completed', completed_at = ? WHERE id = ?",
                (now, todo_id)
            )
            conn.commit()
            return cursor.rowcount > 0

    def delete_todo(self, todo_id):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
            conn.commit()
            return cursor.rowcount > 0

    # --- วิธีการจัดการ Reminders ---
    def add_reminder(self, message, remind_time, channel_id=None):
        """
        remind_time รูปแบบ: YYYY-MM-DD HH:MM:SS
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO reminders (message, remind_time, channel_id) VALUES (?, ?, ?)",
                (message, remind_time, channel_id)
            )
            conn.commit()
            return cursor.lastrowid

    def get_pending_reminders(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute("SELECT * FROM reminders WHERE status = 'pending' AND remind_time <= ?", (now,))
            return [dict(row) for row in cursor.fetchall()]

    def mark_reminder_sent(self, reminder_id):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE reminders SET status = 'sent' WHERE id = ?", (reminder_id,))
            conn.commit()
            return cursor.rowcount > 0
            
    def get_all_reminders(self):
         with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM reminders ORDER BY remind_time ASC")
            return [dict(row) for row in cursor.fetchall()]
