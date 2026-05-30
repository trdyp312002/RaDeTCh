"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

type Status = "wishlist" | "bought" | "reading" | "completed";

type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  category: string;
  status: Status;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; border: string; buttonLabel: string; nextStatus: Status | null }> = {
  wishlist: { 
    label: "❤️ อยากซื้อ / เล็งไว้", 
    color: "text-rose-600", 
    bg: "bg-rose-50", 
    border: "border-rose-200",
    buttonLabel: "💳 ซื้อแล้ว (ดอง)",
    nextStatus: "bought"
  },
  bought: { 
    label: "📦 ซื้อแล้ว (ดองอยู่)", 
    color: "text-amber-600", 
    bg: "bg-amber-50/80", 
    border: "border-amber-200",
    buttonLabel: "📖 เริ่มอ่าน",
    nextStatus: "reading"
  },
  reading: { 
    label: "📚 กำลังอ่าน", 
    color: "text-indigo-600", 
    bg: "bg-indigo-50", 
    border: "border-indigo-200",
    buttonLabel: "✅ อ่านจบแล้ว",
    nextStatus: "completed"
  },
  completed: { 
    label: "🎉 อ่านจบแล้ว", 
    color: "text-emerald-600", 
    bg: "bg-emerald-50", 
    border: "border-emerald-200",
    buttonLabel: "อ่านอีกครั้ง",
    nextStatus: "reading"
  },
};

// จับคู่ปกสำหรับหมวดหมู่หลัก (ดึงส่วนหัวมาเทียบ เช่น 'การเงิน/การลงทุน/คริปโต' -> ดึง 'การเงิน' มาจับปก)
const CATEGORY_COVERS: Record<string, string> = {
  "การเงิน": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=80",
  "พัฒนาตนเอง": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80",
  "เทคโนโลยี": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80",
  "การเรียน": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80",
  "นิยาย": "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500&auto=format&fit=crop&q=80",
  "ทั่วไป": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80"
};

const DEFAULT_COVER = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80";

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterCategoryPath, setFilterCategoryPath] = useState<string>("all"); // เก็บพิกัดหมวดหมู่ลำดับขั้น เช่น "การเรียน" หรือ "การเรียน/ภาษา"
  const [expandedMainCats, setExpandedMainCats] = useState<Record<string, boolean>>({});
  const [expandedSubCats, setExpandedSubCats] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // สเตตัสฟอร์มการสร้างใหม่
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("wishlist");
  
  // สเตตัสหมวดหมู่แบบซ้อน (Hierarchical Input)
  const [categoryType, setCategoryType] = useState<"preset" | "custom">("preset");
  const [mainCatPreset, setMainCatPreset] = useState("การเรียน/ภาษา/ภาษาอังกฤษ");
  
  // Custom หมวดหมู่แยกชั้น
  const [customMain, setCustomMain] = useState("");
  const [customSub, setCustomSub] = useState("");
  const [customSubSub, setCustomSubSub] = useState("");

  // สเตตัสการเปิดดู/แก้ไขโน้ตสรุปข้อคิด
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/books");
      if (res.ok) {
        setBooks(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch books", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  async function updateBookStatus(id: string, status: Status) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (selectedBook?.id === id) {
          setSelectedBook(prev => prev ? { ...prev, status } : null);
        }
        await fetchBooks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveBookNote() {
    if (!selectedBook) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/books/${selectedBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDesc }),
      });
      if (res.ok) {
        const updatedBook = await res.json();
        setSelectedBook(updatedBook);
        await fetchBooks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("คุณท่านแน่ใจหรือไม่ครับว่าต้องการลบหนังสือเล่มนี้?")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchBooks();
        if (selectedBook?.id === id) {
          setSelectedBook(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newAuthor) {
      alert("กรุณากรอกชื่อหนังสือและผู้แต่งครับกระผม");
      return;
    }

    // ประกอบโครงสร้างหมวดหมู่แบบซ้อนกันด้วยเครื่องหมาย "/"
    let finalCategory = "ทั่วไป";
    if (categoryType === "preset") {
      finalCategory = mainCatPreset;
    } else {
      const parts = [customMain.trim(), customSub.trim(), customSubSub.trim()].filter(Boolean);
      finalCategory = parts.length > 0 ? parts.join("/") : "ทั่วไป";
    }
    
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          description: newDesc,
          category: finalCategory,
          status: newStatus,
        }),
      });
      
      if (res.ok) {
        setNewTitle("");
        setNewAuthor("");
        setNewDesc("");
        setCustomMain("");
        setCustomSub("");
        setCustomSubSub("");
        setShowAddForm(false);
        await fetchBooks();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- [ระบบโครงสร้างหมวดหมู่แบบซ้อนกัน: Hierarchical Category Tree Parser] ---
  const hierarchicalCategories = useMemo(() => {
    const tree: Record<string, { count: number; subs: Record<string, { count: number; subSubs: Record<string, number> }> }> = {};
    
    books.forEach((b) => {
      const category = b.category || "ทั่วไป";
      const parts = category.split("/").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return;
      
      const main = parts[0];
      const sub = parts[1] || "";
      const subSub = parts[2] || "";
      
      // 1. ระดับหลัก (Main Category)
      if (!tree[main]) {
        tree[main] = { count: 0, subs: {} };
      }
      tree[main].count += 1;
      
      // 2. ระดับรอง (Sub Category)
      if (sub) {
        if (!tree[main].subs[sub]) {
          tree[main].subs[sub] = { count: 0, subSubs: {} };
        }
        tree[main].subs[sub].count += 1;
        
        // 3. ระดับย่อยพิเศษ (Nested Sub Category)
        if (subSub) {
          if (!tree[main].subs[sub].subSubs[subSub]) {
            tree[main].subs[sub].subSubs[subSub] = 0;
          }
          tree[main].subs[sub].subSubs[subSub] += 1;
        }
      }
    });
    
    return tree;
  }, [books]);

  // ตัวกรองคำค้นหา, สถานะ, และหมวดหมู่ลำดับขั้น (Prefix Matching)
  const filteredBooks = books.filter((b) => {
    // กรองสถานะ
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    
    // กรองหมวดหมู่ลำดับขั้น (แบบฉลาด: ถ้าเลือก "การเรียน" จะต้องเจอ "การเรียน/ภาษา" และ "การเรียน/ภาษา/ภาษาอังกฤษ")
    let matchCategory = true;
    if (filterCategoryPath !== "all") {
      const bookCat = b.category || "ทั่วไป";
      // เทียบว่าหมวดหมู่ของหนังสือ ขึ้นต้นด้วยเส้นทางที่เลือกคัดกรองหรือไม่
      matchCategory = bookCat === filterCategoryPath || bookCat.startsWith(filterCategoryPath + "/");
    }
    
    // กรองข้อความค้นหา
    const matchSearch = 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
    return matchStatus && matchCategory && matchSearch;
  });

  // สถิติยอดของหนังสือ
  const totalCount = books.length;
  const wishlistCount = books.filter((b) => b.status === "wishlist").length;
  const boughtCount = books.filter((b) => b.status === "bought").length;
  const readingCount = books.filter((b) => b.status === "reading").length;
  const completedCount = books.filter((b) => b.status === "completed").length;
  
  const purchasedBooksCount = boughtCount + readingCount + completedCount;
  const completionRate = purchasedBooksCount > 0 
    ? Math.round((completedCount / purchasedBooksCount) * 100) 
    : 0;

  // หั่นหนังสือออกเป็นชั้นละ 5 เล่มเพื่อสร้างชั้นวางไม้ 3D เสน่ห์ห้องสมุดยาว
  const booksPerShelf = 5;
  const bookShelves: Book[][] = [];
  for (let i = 0; i < filteredBooks.length; i += booksPerShelf) {
    bookShelves.push(filteredBooks.slice(i, i + booksPerShelf));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3e9d2] via-[#e7d9b8] to-[#d6c397] pt-10 pb-24 px-6 md:px-10 text-stone-900 relative">
      
      {/* 1. Header Banner */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-b from-[#4a2f1b] via-[#352011] to-[#1e1007] border-2 border-[#8c5a32]/30 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle background glow/overlay to feel polished */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfb269]/15 backdrop-blur-md border border-[#dfb269]/30 text-[10px] font-bold tracking-wider uppercase mb-3 text-[#dfb269]">
            📚 Hierarchical Bookshelf • คลังปัญญาลำดับขั้น
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#ebdcb9] via-[#fcd34d] to-[#d8c89f]">
            ห้องสมุดส่วนตัวของราฟาเอล
          </h1>
          <p className="text-amber-100/80 max-w-xl text-xs md:text-sm leading-relaxed">
            ยินดีต้อนรับกลับสู่ห้องสมุดส่วนตัวครับคุณท่าน ที่นี่จัดหมวดหมู่หนังสือแบบซ้อนชั้นระดับลึก ค้นหาง่าย สบายตา และจัดระบบการอ่านได้อย่างครบถ้วนสมบูรณ์แบบ
          </p>
        </div>
        
        {/* บอทราฟาเอล Callout */}
        <div className="relative z-10 bg-black/35 backdrop-blur-md border border-[#8c5a32]/45 rounded-2xl p-5 md:max-w-xs text-xs shadow-2xl flex gap-3.5">
          <div className="text-3xl leading-none">🛡️</div>
          <div>
            <p className="font-extrabold text-[#dfb269] mb-1.5 leading-none">ราฟาเอลพร้อมรับใช้!</p>
            <p className="text-amber-100/70 leading-relaxed text-[11px]">
              ท่านสามารถถ่ายรูปปก หรือส่งข้อมูลในห้อง Discord เพื่อสั่งให้ผมบันทึกข้อมูลปกอย่างละเอียด พร้อมอัปเดตลงชั้นหนังสือบนเว็บไซต์แบบเรียลไทม์ได้ทันทีครับกระผม!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* 2. Statistics Grid Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          <div className="col-span-2 lg:col-span-1 bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:border-[#8c6b53]/40 transition-colors">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">อัตราความสำเร็จ</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-serif font-black text-[#5c3e21]">{completionRate}%</span>
                <span className="text-[10px] font-medium text-stone-400 leading-none">ของที่ซื้อมาแล้ว</span>
              </div>
            </div>
            <div className="w-full bg-[#ebdcb9]/40 border border-[#8c6b53]/15 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#b37d4f] to-[#dfb269] h-2.5 rounded-full transition-all duration-500 shadow-inner" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:border-rose-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-rose-700">❤️ เล็งไว้ / อยากซื้อ</p>
            </div>
            <p className="text-3xl font-serif font-black text-[#5c3e21] mt-3">{wishlistCount}</p>
            <p className="text-[11px] text-stone-500 mt-1">เป้าหมายของความต้องการ</p>
          </div>

          <div className="bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:border-amber-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-700">📦 ซื้อแล้ว (ดองอยู่)</p>
            </div>
            <p className="text-3xl font-serif font-black text-[#5c3e21] mt-3">{boughtCount}</p>
            <p className="text-[11px] text-stone-500 mt-1">คลังหนังสือพร้อมรออ่าน</p>
          </div>

          <div className="bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:border-indigo-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-700">📚 กำลังอ่าน</p>
            </div>
            <p className="text-3xl font-serif font-black text-[#5c3e21] mt-3">{readingCount}</p>
            <p className="text-[11px] text-stone-500 mt-1">เปิดความรู้/ขัดเกลาวินัย</p>
          </div>

          <div className="bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all hover:border-emerald-300">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-700">🎉 อ่านจบแล้ว</p>
            </div>
            <p className="text-3xl font-serif font-black text-[#5c3e21] mt-3">{completedCount}</p>
            <p className="text-[11px] text-stone-500 mt-1">หนังสือที่เติมเต็มคุณท่านแล้ว</p>
          </div>

        </div>

        {/* 3. Filter & Add Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-[#ebdcb9] to-[#dccaa0] border-2 border-[#bca678]/55 rounded-2xl p-4 shadow-md">
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 ${
                filterStatus === "all"
                  ? "bg-[#4a2f1b] text-white shadow-md border border-[#2e190b]"
                  : "text-[#5e4125] hover:text-[#2c1b0e] hover:bg-white/40"
              }`}
            >
              ทั้งหมด ({totalCount})
            </button>
            {(["wishlist", "bought", "reading", "completed"] as Status[]).map((status) => {
              const active = filterStatus === status;
              const config = STATUS_CONFIG[status];
              const countMap = {
                wishlist: wishlistCount,
                bought: boughtCount,
                reading: readingCount,
                completed: completedCount
              };
              
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 ${
                    active
                      ? "bg-[#4a2f1b] text-white shadow-md border border-[#2e190b]"
                      : "text-[#5e4125] hover:text-[#2c1b0e] hover:bg-white/40"
                  }`}
                >
                  {config.label.split(" ")[0]} {config.label.split(" ").slice(1).join(" ")} ({countMap[status]})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 md:w-60">
              <input
                type="text"
                placeholder="ค้นชื่อเรื่อง / ผู้เขียน / หมวด..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border-2 border-[#bca678]/40 bg-white/75 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c5a32] focus:border-transparent transition-all placeholder-[#8c7457] text-[#4a2f1b]"
              />
              <span className="absolute left-3.5 top-2 text-[#8c7457] text-xs">🔍</span>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-[#8c5a32] hover:bg-[#704320] text-white rounded-xl text-xs font-semibold tracking-tight shadow-md shadow-amber-950/20 flex items-center gap-1.5 transition-colors border border-[#59381c]"
            >
              <span>{showAddForm ? "✕ ปิดฟอร์ม" : "➕ บันทึกเล่มใหม่"}</span>
            </button>
          </div>

        </div>

        {/* 4. Add Book Form Box (รองรับจัดลำดับขั้น) */}
        {showAddForm && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-md mb-8 animate-fadeIn">
            <h3 className="text-base font-extrabold text-gray-800 mb-5 flex items-center gap-2">
              📖 จดบันทึกและจัดชั้นหนังสือลำดับขั้นใหม่
            </h3>
            
            <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ชื่อหนังสือ (Title)</label>
                <input
                  type="text"
                  placeholder="ตัวอย่าง: Minna no Nihongo"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">ผู้แต่ง (Author)</label>
                <input
                  type="text"
                  placeholder="ตัวอย่าง: 3A Corporation"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">สถานะจัดซื้อและการอ่าน</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Status)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="wishlist">อยากซื้อ / เล็งไว้ (Wishlist)</option>
                  <option value="bought">ซื้อแล้ว / ยังไม่อ่าน (Bought)</option>
                  <option value="reading">กำลังอ่าน (Reading)</option>
                  <option value="completed">อ่านจบแล้ว (Completed)</option>
                </select>
              </div>

              {/* ส่วนกรอกข้อมูลประเภทจัดเรียงลำดับชั้น */}
              <div className="md:col-span-3 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-gray-700 block">🗂️ รูปแบบเลือกหมวดหมู่:</span>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input 
                        type="radio" 
                        name="catType" 
                        checked={categoryType === "preset"} 
                        onChange={() => setCategoryType("preset")} 
                      />
                      เลือกจากหมวดเด่นที่มีอยู่
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input 
                        type="radio" 
                        name="catType" 
                        checked={categoryType === "custom"} 
                        onChange={() => setCategoryType("custom")} 
                      />
                      สร้างหมวดหมู่ลำดับขั้นย่อยเอง
                    </label>
                  </div>
                </div>

                {categoryType === "preset" ? (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">หมวดลำดับชั้นที่มีความเข้ากัน</label>
                    <select
                      value={mainCatPreset}
                      onChange={(e) => setMainCatPreset(e.target.value)}
                      className="w-full max-w-md px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                    >
                      <option value="การเรียน/ภาษา/ภาษาอังกฤษ">การเรียน &gt; ภาษา &gt; ภาษาอังกฤษ 🇬🇧</option>
                      <option value="การเรียน/ภาษา/ภาษาญี่ปุ่น">การเรียน &gt; ภาษา &gt; ภาษาญี่ปุ่น 🇯🇵</option>
                      <option value="การเงิน/การลงทุน/คริปโต">การเงิน &gt; การลงทุน &gt; คริปโต 🪙</option>
                      <option value="การเงิน/การลงทุน/หุ้น">การเงิน &gt; การลงทุน &gt; หุ้น 📈</option>
                      <option value="พัฒนาตนเอง/จิตวิทยา/ความคิด">พัฒนาตนเอง &gt; จิตวิทยา &gt; ความคิด 🧠</option>
                      <option value="เทคโนโลยี/เขียนโปรแกรม/React">เทคโนโลยี &gt; เขียนโปรแกรม &gt; React 💻</option>
                      <option value="ทั่วไป">ทั่วไป (General)</option>
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">หมวดหมู่หลัก (Level 1)</label>
                      <input
                        type="text"
                        placeholder="เช่น การเรียน, การเงิน"
                        value={customMain}
                        onChange={(e) => setCustomMain(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        required={categoryType === "custom"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">หมวดหมู่รอง (Level 2 - ใส่หรือไม่ใส่ก็ได้)</label>
                      <input
                        type="text"
                        placeholder="เช่น ภาษา, การลงทุน"
                        value={customSub}
                        onChange={(e) => setCustomSub(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">หมวดหมู่ย่อยสุด (Level 3 - ใส่หรือไม่ใส่ก็ได้)</label>
                      <input
                        type="text"
                        placeholder="เช่น ภาษาญี่ปุ่น, คริปโต"
                        value={customSubSub}
                        onChange={(e) => setCustomSubSub(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">เรื่องย่อสั้นๆ / โน้ตความในใจย่อ</label>
                <input
                  type="text"
                  placeholder="ตัวอย่าง: คอร์สภาษาญี่ปุ่นขั้นพื้นฐานสำหรับการจดจำตัวอักษรและการสื่อสาร"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 transition-colors"
                >
                  💾 บันทึกหนังสือลำดับขั้น
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 6. หมวดหมู่แผ่กว้างแบบสันยาวด้านบน (Horizontal 3D Category Bookshelf & Open Index Journal) */}
        <div className="w-full space-y-6 select-none mb-12">
            
            {/* 1. ชั้นวางหนังสือหมวดหมู่ 3 มิติ (3D Category Bookshelf) */}
            <div className="relative bg-gradient-to-b from-[#2e190d] via-[#1c0f08] to-[#0c0502] p-4 rounded-3xl border-4 border-[#3e2413] shadow-[0_20px_40px_rgba(0,0,0,0.65),inset_0_4px_12px_black] overflow-hidden">
              {/* ป้ายทองเหลืองของตู้ (Golden Bookshelf Plaque) */}
              <div className="text-center mb-4">
                <span className="inline-block text-[9px] font-serif font-black tracking-widest text-[#dfb269]/70 uppercase border-b border-[#dfb269]/25 pb-1">
                  📚 CATEGORY BOOKSHELF • ชั้นจัดหมวดหมู่
                </span>
              </div>

              {/* ชั้นแสดงแนวตั้งของสันหนังสือ (Row of 3D Book Spines) */}
              <div className="flex justify-center items-end h-56 pb-2 px-1 gap-2.5 overflow-x-auto scrollbar-none relative z-10">
                
                {/* ที่กั้นหนังสือทองเหลืองซ้าย (Brass Bookend Left) */}
                <div className="w-4 h-40 bg-gradient-to-r from-[#dfb269] to-[#8c6527] rounded-l border border-[#5a3b11] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_8px_black] shrink-0 hidden md:block" />
                
                {/* เล่ม 1: สมุดปกทอง Master Book (All Collection) */}
                {(() => {
                  const isAllActive = filterCategoryPath === "all";
                  return (
                    <div 
                      onClick={() => setFilterCategoryPath("all")}
                      className={`relative cursor-pointer transition-all duration-300 ${
                        isAllActive ? "-translate-y-6 scale-110 z-30" : "hover:-translate-y-4 hover:z-20 z-10"
                      }`}
                      title="หนังสือคลังทั้งหมด"
                    >
                      {/* เล่มหนังสือ 3D */}
                      <div className="relative w-9 h-36 md:w-11 md:h-44 xl:w-12 xl:h-48 rounded-md transition-all duration-300">
                        {/* สันหนังสือ (Spine) */}
                        <div className={`absolute inset-0 bg-gradient-to-b from-[#d97706] via-[#f59e0b] to-[#b45309] rounded-l-md shadow-[2px_5px_10px_black] border-y-4 border-[#9a5d15] flex flex-col items-center justify-between py-5 px-0.5 text-center`}>
                          {/* แสงโค้งของสัน */}
                          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                          <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/45 to-transparent pointer-events-none" />
                          
                          {/* ขอบทองสลักลวดลาย */}
                          <div className="w-[85%] h-[1px] bg-[#5c3e16]/30 shrink-0" />
                          
                          {/* ชื่อหนังสือแนวตั้ง */}
                          <span 
                            style={{ writingMode: "vertical-lr" }} 
                            className="text-[9px] md:text-[10px] font-serif font-black text-[#5c3e16] rotate-180 tracking-widest max-h-[60%] truncate select-none leading-none drop-shadow-[0_0.5px_0_rgba(255,255,255,0.2)]"
                          >
                            คลังหนังสือ
                          </span>
                          
                          {/* สถิติจำนวนรวม */}
                          <div className="w-full flex flex-col gap-1 items-center shrink-0">
                            <span className="text-[7px] font-black bg-[#5c3e16] text-[#dfb269] px-1 py-0.2 rounded font-mono leading-none border border-[#dfb269]/10">
                              {totalCount}
                            </span>
                            <div className="w-[85%] h-[1px] bg-[#5c3e16]/30" />
                          </div>
                        </div>
                        {/* ขอบกระดาษ peeking out ด้านข้างจำลองความหนาปก 3 มิติ */}
                        <div className="absolute inset-y-1.5 right-[-3px] w-[3px] bg-[#fdfaf2] border-r border-t border-b border-black/20 rounded-r shadow-[2px_2px_4px_rgba(0,0,0,0.4)]" />
                      </div>
                    </div>
                  );
                })()}

                {/* เล่มหนังสือหมวดหมู่หลัก dynamic จากระบบคลังปัญญา */}
                {Object.keys(hierarchicalCategories).map((main) => {
                  const mainObj = hierarchicalCategories[main];
                  const isMainActive = filterCategoryPath === main || filterCategoryPath.startsWith(main + "/");
                  
                  // กำหนดสีสันหนังสือแต่ละประเภทให้แตกต่างและสวยงามพรีเมียม
                  const spineColors: Record<string, string> = {
                    "การเรียน": "from-[#7c1d1d] via-[#b91c1c] to-[#7c1d1d] border-[#581010]",
                    "การเงิน": "from-[#064e3b] via-[#047857] to-[#064e3b] border-[#022c22]",
                    "พัฒนาตนเอง": "from-[#312e81] via-[#4338ca] to-[#312e81] border-[#1e1b4b]",
                    "เทคโนโลยี": "from-[#1e3a8a] via-[#1d4ed8] to-[#1e3a8a] border-[#172554]",
                    "นิยาย": "from-[#581c87] via-[#7e22ce] to-[#581c87] border-[#3b0764]",
                    "ทั่วไป": "from-[#78350f] via-[#b45309] to-[#78350f] border-[#451a03]",
                  };
                  const spineColor = spineColors[main] || "from-[#451a03] via-[#78350f] to-[#451a03] border-[#291002]";

                  return (
                    <div 
                      key={main}
                      onClick={() => {
                        setFilterCategoryPath(main);
                        // เซ็ตขยายหมวดหลักนี้
                        setExpandedMainCats(prev => ({
                          ...Object.keys(hierarchicalCategories).reduce((acc, cat) => ({ ...acc, [cat]: false }), {}),
                          [main]: true
                        }));
                      }}
                      className={`relative cursor-pointer transition-all duration-300 ${
                        isMainActive ? "-translate-y-6 scale-110 z-30" : "hover:-translate-y-4 hover:z-20 z-10"
                      }`}
                      title={`หมวด: ${main}`}
                    >
                      {/* เล่มหนังสือ 3D */}
                      <div className="relative w-9 h-36 md:w-11 md:h-44 xl:w-12 xl:h-48 rounded-md transition-all duration-300">
                        {/* สันหนังสือ (Spine) */}
                        <div className={`absolute inset-0 bg-gradient-to-b ${spineColor} rounded-l-md shadow-[2px_5px_10px_black] border-y-4 border-[#dfb269]/25 flex flex-col items-center justify-between py-5 px-0.5 text-center`}>
                          {/* แสงเงาสันหนังสือ */}
                          <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                          <div className="absolute inset-y-0 right-0 w-1.5 bg-gradient-to-l from-black/35 to-transparent pointer-events-none" />
                          
                          {/* แถบทองคาดสลักลายที่หัว */}
                          <div className="w-[85%] h-[1px] bg-[#dfb269]/40 shrink-0" />
                          
                          {/* สลักชื่อหมวดแนวตั้ง */}
                          <span 
                            style={{ writingMode: "vertical-lr" }} 
                            className="text-[9px] md:text-[10px] font-serif font-black text-[#dfb269] rotate-180 tracking-widest max-h-[60%] truncate select-none leading-none drop-shadow-[0_1px_1px_black]"
                          >
                            {main}
                          </span>
                          
                          {/* ป้ายจำนวนเล่ม และแถบทองล่าง */}
                          <div className="w-full flex flex-col gap-1 items-center shrink-0">
                            <span className="text-[7px] font-black bg-black/45 text-amber-200/90 px-1 py-0.2 rounded font-mono leading-none border border-white/5">
                              {mainObj.count}
                            </span>
                            <div className="w-[85%] h-[1px] bg-[#dfb269]/40" />
                          </div>
                        </div>
                        {/* เลียนแบบขอบกระดาษจำลอง 3 มิติ */}
                        <div className="absolute inset-y-1.5 right-[-3px] w-[3px] bg-[#fdfaf2] border-r border-t border-b border-black/20 rounded-r shadow-[2px_2px_4px_rgba(0,0,0,0.4)]" />
                      </div>
                    </div>
                  );
                })}

                {/* ที่กั้นหนังสือทองเหลืองขวา (Brass Bookend Right) */}
                <div className="w-4 h-40 bg-gradient-to-l from-[#dfb269] to-[#8c6527] rounded-r border border-[#5a3b11] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_4px_8px_black] shrink-0 hidden md:block" />

              </div>

              {/* แท่นแผ่นไม้รองใต้สันหนังสือเพื่อมิติ 3D (3D Wooden Shelf Board) */}
              <div className="relative w-full z-20">
                {/* ขอบหน้าแผ่นไม้เอียง */}
                <div className="h-3 w-full bg-gradient-to-b from-[#a88258] via-[#86603a] to-[#5e4125] rounded-b border-b border-black/40 shadow-[0_5px_8px_black]" />
              </div>
            </div>

            {/* 2. สมุดบันทึกสารบัญดัชนีแผ่แบนราบ (Flat Open Parchment Book/Journal) */}
            <div className="relative bg-[#FAF6F0] text-stone-900 rounded-3xl border-4 border-[#8c5a32]/35 shadow-2xl p-5 md:p-6 min-h-[300px] z-10 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] bg-repeat max-w-4xl mx-auto w-full">
              
              {/* แสงโค้งและริบบิ้นสีแดงโบราณพาดกลางหน้าสมุด (Red Silk Bookmark Ribbon) */}
              <div className="absolute top-0 bottom-0 left-[50.2%] w-1 bg-gradient-to-r from-red-700 via-red-500 to-red-800 shadow-[2px_0_4px_black] transform -translate-x-1/2 hidden md:block z-20" />
              <div className="absolute bottom-[-14px] left-[50%] -translate-x-1/2 w-3.5 h-4.5 bg-gradient-to-b from-red-600 to-red-950 rounded-b shadow-md border border-red-900 hidden md:block z-20" />

              {/* การจัดแจงฝั่งหน้าซ้าย & หน้าขวา */}
              {(() => {
                const pathParts = filterCategoryPath.split("/");
                const activeMain = pathParts[0];
                const activeSub = pathParts[1] || "";
                
                // กรณีเลือกชมภาพรวมทั้งหมด (Master Welcoming Page)
                if (activeMain === "all") {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-[#4a2e16]">
                      {/* หน้าสมุดฝั่งซ้าย */}
                      <div className="space-y-4 md:pr-3">
                        <div className="border-b border-[#8c5a32]/25 pb-2">
                          <h4 className="text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1">
                            📖 สารบัญชั้นใหญ่
                          </h4>
                          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">Main Index Journal</span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-serif italic text-stone-600">
                          "คลังปัญญาส่วนตัวของคุณท่าน จัดเก็บระบบจัดประเภทเชิงลึกอย่างเป็นระเบียบ เพื่อขัดเกลาและขยายพูนพูนสติปัญญาครับกระผม"
                        </p>
                        
                        {/* รายการสถิติกระดาษ */}
                        <div className="bg-amber-950/5 border border-stone-200 rounded-xl p-3.5 space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span>📚 คลังหนังสือสะสม:</span>
                            <span className="font-mono text-xs">{totalCount} เล่ม</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span>❤️ อยู่ในลิสต์ดองรออ่าน:</span>
                            <span className="font-mono text-xs">{books.filter(b => b.status === 'wishlist' || b.status === 'bought').length} เล่ม</span>
                          </div>
                        </div>
                      </div>

                      {/* หน้าสมุดฝั่งขวา */}
                      <div className="space-y-4 md:pl-3 border-t border-[#8c5a32]/10 md:border-t-0 pt-4 md:pt-0">
                        <div className="border-b border-[#8c5a32]/25 pb-2">
                          <h4 className="text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1">
                            🛡️ สารจากราฟาเอล
                          </h4>
                          <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">Butler Callout</span>
                        </div>
                        <p className="text-[10px] leading-normal text-stone-500 font-medium">
                          เรียนคุณท่านครับ ที่ชั้นวางหนังสือด้านบนนี้คือ **"สรรหนังสือ"** ของหมวดหมู่หลักทั้งหมดในคลังหนังสือครับ
                        </p>
                        <p className="text-[10px] leading-normal text-stone-500 font-medium">
                          ท่านสามารถ **คลิกเลือกสันหนังสือเล่มใดเล่มหนึ่ง** เพื่อหยิบสมุดของหมวดหลักนั้นขึ้นมาเปิดดูรายละเอียดและหมวดหมู่ย่อยบนหน้ากระดาษหนังสือเล่มนี้ได้ทันทีเลยครับกระผม!
                        </p>
                      </div>
                    </div>
                  );
                }

                // กรณีเลือกหมวดหมู่หลักแบบแยกประเภท
                const mainObj = hierarchicalCategories[activeMain];
                if (!mainObj) return null;
                const hasSubs = Object.keys(mainObj.subs).length > 0;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-[#4a2e16]">
                    {/* หน้าสมุดฝั่งซ้าย: สารบัญหมวดหมู่รอง */}
                    <div className="space-y-3.5 md:pr-3">
                      <div className="border-b border-[#8c5a32]/25 pb-2">
                        <h4 className="text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1 truncate">
                          📂 สมุดจดหมวด: {activeMain}
                        </h4>
                        <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">Category: {activeMain} ({mainObj.count} เล่ม)</span>
                      </div>
                      
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                        {hasSubs ? (
                          Object.keys(mainObj.subs).map((sub) => {
                            const subObj = mainObj.subs[sub];
                            const subPath = `${activeMain}/${sub}`;
                            const isSubActive = filterCategoryPath === subPath || filterCategoryPath.startsWith(subPath + "/");

                            return (
                              <div
                                key={sub}
                                onClick={() => setFilterCategoryPath(subPath)}
                                className={`p-2.5 rounded-xl border text-[11px] font-extrabold cursor-pointer select-none flex items-center justify-between transition-all duration-200 ${
                                  isSubActive
                                    ? "bg-[#dfb269]/15 border-[#dfb269] text-[#5c3e21] shadow-inner"
                                    : "border-stone-200 hover:bg-[#dfb269]/5 hover:border-stone-300 text-stone-700"
                                }`}
                              >
                                <span className="truncate flex items-center gap-1.5">
                                  🔖 {sub}
                                </span>
                                <span className="text-[8px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-mono">
                                  {subObj.count} เล่ม
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-stone-400 text-[10px] italic">
                            ไม่มีสารบัญหมวดย่อยที่จดบันทึกไว้ครับกระผม
                          </div>
                        )}
                      </div>
                    </div>

                    {/* หน้าสมุดฝั่งขวา: ดัชนีย่อยสูงสุด Level 3 หรือ คำชี้แนะจากราฟาเอล */}
                    <div className="space-y-3.5 md:pl-3 border-t border-[#8c5a32]/10 md:border-t-0 pt-4 md:pt-0">
                      {activeSub ? (
                        (() => {
                          const subObj = mainObj.subs[activeSub];
                          if (!subObj) return null;
                          const subSubs = Object.keys(subObj.subSubs);
                          
                          return (
                            <div className="space-y-3">
                              <div className="border-b border-[#8c5a32]/25 pb-2">
                                <h4 className="text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1 truncate">
                                  📌 แท็บแยกหัวข้อ: {activeSub}
                                </h4>
                                <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">Sub Category Level 3</span>
                              </div>
                              
                              <p className="text-[10px] font-medium leading-relaxed text-stone-500">
                                พบประเด็นย่อยที่คุณท่านจดบันทึกยิบไว้บนคลังปัญญา สามารถคลิกแท็บดัชนีย่อยเหล่านี้เพื่อจัดคัดแยกหนังสือเฉพาะหัวข้อนั้น ๆ ได้เลยครับ:
                              </p>
                              
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {subSubs.length > 0 ? (
                                  subSubs.map((subSub) => {
                                    const subSubCount = subObj.subSubs[subSub];
                                    const subSubPath = `${activeMain}/${activeSub}/${subSub}`;
                                    const isSubSubActive = filterCategoryPath === subSubPath;

                                    return (
                                      <button
                                        key={subSub}
                                        onClick={() => setFilterCategoryPath(subSubPath)}
                                        className={`px-2 py-1 rounded text-[9px] font-black tracking-wide uppercase transition-colors border select-none ${
                                          isSubSubActive
                                            ? "bg-[#dfb269] text-[#2c1b10] border-[#9a6f2b] shadow-sm"
                                            : "bg-[#8c5a32]/10 text-[#8c5a32] border-[#8c5a32]/20 hover:bg-[#8c5a32]/20"
                                        }`}
                                      >
                                        🏷️ {subSub} ({subSubCount})
                                      </button>
                                    );
                                  })
                                ) : (
                                  <span className="text-stone-400 text-[10px] italic">
                                    ไม่มีประเด็นย่อยจัดชั้นแยกประเภทไว้เพิ่มเติมครับ
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-3">
                          <div className="border-b border-[#8c5a32]/25 pb-2">
                            <h4 className="text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1">
                              🛡️ ราฟาเอลแนะแนว
                            </h4>
                            <span className="text-[8px] font-mono opacity-50 uppercase tracking-widest block">Raphael Guidance</span>
                          </div>
                          <p className="text-[10px] leading-normal text-stone-500 font-medium italic">
                            "คุณท่านได้ทำการหยิบสมุดบันทึกหมวด **'{activeMain}'** มาเปิดกางแล้วครับ"
                          </p>
                          <p className="text-[10px] leading-relaxed text-stone-500 font-medium">
                            ท่านสามารถคลิกเลือก **หมวดหมู่ย่อย (แผ่นป้ายแท็บกระดาษสีเหลือง)** ทางด้านซ้ายมือ เพื่อคัดกรองหนังสือลงลึกถึงดัชนีย่อยสูงสุดและแสดงบนชั้นไม้ทางขวามือได้ทันทีเลยครับกระผม!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* 7. รายการชั้นหนังสือไม้ 3D พรีเมียม (Grand Library Shelves) */}
          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-3xl p-10 shadow-md">
                <span className="text-3xl animate-bounce">📖</span>
                <p className="text-xs text-stone-500 font-medium mt-3">กำลังจัดเรียงและปัดฝุ่นชั้นหนังสือของท่าน...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-gradient-to-b from-[#fdfcfb] to-[#f5f1ea] border-2 border-[#8c6b53]/25 rounded-3xl p-16 text-center shadow-md">
                <span className="text-4xl">📚</span>
                <p className="text-sm font-extrabold text-stone-700 mt-4">ไม่พบหนังสือในหมวดหมู่ที่ท่านต้องการสำรวจครับ</p>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  ท่านสามารถบันทึกหนังสือเล่มใหม่ลงในหมวดหมู่นี้ได้ง่ายๆ หรือเลือก "ทั้งหมดในคลัง" เพื่อชมคอลเลกชันเล่มโปรดทั้งหมดได้ทันทีครับกระผม
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {bookShelves.map((shelf, shelfIdx) => (
                  <div key={shelfIdx} className="relative">
                    {/* The Backboard wall of the shelf */}
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-900/5 to-stone-900/15 rounded-2xl border border-stone-800/5 shadow-inner -z-10" />
                    
                    {/* The Books standing container */}
                    <div className="flex justify-start items-end px-6 md:px-12 pb-4 pt-12 min-h-[260px] gap-6 md:gap-10 xl:gap-14 overflow-x-auto scrollbar-thin scrollbar-thumb-amber-800/20">
                      {shelf.map((book) => {
                        const statusCfg = STATUS_CONFIG[book.status];
                        const isUpdating = updatingId === book.id;
                        const mainCategoryName = book.category ? book.category.split("/")[0] : "ทั่วไป";
                        const coverUrl = book.cover_image || CATEGORY_COVERS[mainCategoryName] || DEFAULT_COVER;

                        return (
                          <div 
                            key={book.id}
                            className={`relative flex flex-col items-center group cursor-pointer transition-all duration-300 hover:-translate-y-4 shrink-0 pb-1 ${
                              isUpdating ? "opacity-60 pointer-events-none" : ""
                            }`}
                            onClick={() => {
                              setSelectedBook(book);
                              setEditDesc(book.description || "");
                            }}
                          >
                            {/* 3D Book Cover */}
                            <div className="relative w-24 h-36 md:w-32 md:h-48 xl:w-36 xl:h-52 rounded-r overflow-hidden shadow-[4px_8px_16px_rgba(0,0,0,0.55)] group-hover:shadow-[8px_16px_28px_rgba(0,0,0,0.7)] transition-all duration-300 border-l-[4px] border-black/45">
                              <img 
                                src={coverUrl} 
                                alt={book.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                              />
                              {/* Spine curve shadow */}
                              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/55 via-black/10 to-transparent pointer-events-none" />
                              {/* Right page highlight */}
                              <div className="absolute inset-y-0 right-0 w-[1.5px] bg-white/20 pointer-events-none" />
                              {/* Left side book binding lines */}
                              <div className="absolute inset-y-0 left-[5px] w-[1px] bg-white/10 pointer-events-none" />
                              <div className="absolute inset-y-0 left-[6px] w-[1px] bg-black/25 pointer-events-none" />
                              {/* Shiny reflective shine */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/12 pointer-events-none" />

                              {/* Category ribbon badge */}
                              <div className="absolute top-2 left-2 max-w-[85%]">
                                <span className="inline-block truncate bg-black/80 backdrop-blur-[2px] text-white text-[7px] font-black px-1.5 py-0.5 rounded border border-white/10 tracking-wide">
                                  {book.category.split("/")[0]}
                                </span>
                              </div>

                              {/* Reading status badge */}
                              <div className="absolute bottom-2 right-2">
                                <span className={`px-1.5 py-0.5 text-[8px] font-black rounded backdrop-blur-[2px] border ${
                                  book.status === 'completed' ? 'bg-emerald-950/85 text-emerald-400 border-emerald-500/30' :
                                  book.status === 'reading' ? 'bg-indigo-950/85 text-indigo-400 border-indigo-500/30' :
                                  book.status === 'bought' ? 'bg-amber-950/85 text-amber-400 border-amber-500/30' :
                                  'bg-rose-950/85 text-rose-400 border-rose-500/30'
                                }`}>
                                  {statusCfg.label.split(" ")[0]}
                                </span>
                              </div>
                            </div>

                            {/* Book's shadow cast onto the shelf */}
                            <div className="absolute bottom-12 w-20 h-2 bg-black/45 blur-md rounded-full -z-10 group-hover:scale-x-95 group-hover:opacity-40 transition-all duration-300" />

                            {/* Vintage Metal Nameplate */}
                            <div className="mt-4 flex flex-col items-center">
                              <div className="bg-gradient-to-b from-[#2e2d2b] to-[#141312] border border-[#0d0c0c] text-[#dfb269] font-mono text-[9px] py-1 px-3 rounded shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.6)] relative flex items-center gap-1.5 max-w-[110px] md:max-w-[130px]">
                                {/* Rivet Left */}
                                <span className="w-1 h-1 rounded-full bg-[#dfb269] shadow-[inset_-0.5px_-0.5px_1px_black] shrink-0" />
                                
                                <span className="truncate max-w-[65px] md:max-w-[85px] font-sans font-bold leading-none select-none text-center">
                                  {book.title}
                                </span>
                                
                                {/* Rivet Right */}
                                <span className="w-1 h-1 rounded-full bg-[#dfb269] shadow-[inset_-0.5px_-0.5px_1px_black] shrink-0" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 3D Wood Shelf Board */}
                    <div className="relative w-full z-10">
                      {/* Top Face */}
                      <div className="h-4 w-full bg-gradient-to-b from-[#c09e75] via-[#a88258] to-[#86603a] border-b border-black/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]" />
                      
                      {/* Front Bevel */}
                      <div className="h-6 w-full bg-gradient-to-b from-[#86603a] to-[#5e4125] rounded-b shadow-[0_12px_24px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-between px-6">
                        <div className="flex gap-1 items-center">
                          <div className="w-1 h-1 rounded-full bg-[#dfb269] opacity-60 shadow-[1px_1px_1px_black]" />
                          <div className="w-1 h-1 rounded-full bg-[#dfb269] opacity-60 shadow-[1px_1px_1px_black]" />
                        </div>
                        <span className="text-[8px] font-bold text-[#dfb269]/40 font-mono tracking-widest uppercase select-none">
                          Shelf {shelfIdx + 1} • Raphael Library
                        </span>
                        <div className="flex gap-1 items-center">
                          <div className="w-1 h-1 rounded-full bg-[#dfb269] opacity-60 shadow-[1px_1px_1px_black]" />
                          <div className="w-1 h-1 rounded-full bg-[#dfb269] opacity-60 shadow-[1px_1px_1px_black]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      </div>

      {/* 7. Notes & Summary thoughts Modal Overlay (Ledger Details Scroll) */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fcf8f2] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border-2 border-[#8c6b53]/45 animate-scaleUp">
            
            <div className="bg-gradient-to-b from-[#4a2f1b] to-[#25150a] p-6 text-white relative border-b-2 border-[#dfb269]/40">
              <div className="flex gap-4 items-start">
                {/* Large Book Cover in Modal */}
                <div className="w-20 h-28 md:w-24 md:h-36 rounded-md overflow-hidden bg-slate-900 border-l-[3px] border-black/40 shadow-lg shrink-0">
                  <img 
                    src={selectedBook.cover_image || CATEGORY_COVERS[selectedBook.category.split("/")[0]] || DEFAULT_COVER} 
                    alt={selectedBook.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest bg-[#dfb269]/15 text-[#dfb269] px-2 py-0.5 rounded border border-[#dfb269]/30 block mb-2 w-max">
                    📂 {selectedBook.category}
                  </span>
                  <h3 className="text-lg md:text-xl font-serif font-black leading-tight text-[#ebdcb9] truncate">{selectedBook.title}</h3>
                  <p className="text-xs text-amber-200/80 mt-1 font-medium">ผู้แต่ง: {selectedBook.author}</p>
                  <p className="text-[10px] text-amber-200/40 mt-1.5">
                    เพิ่มเมื่อ: {new Date(selectedBook.created_at).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-5 right-5 text-lg text-white/50 hover:text-white hover:bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] bg-repeat">
              
              {/* Section 1: Change Status Inline */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8c6b53] uppercase tracking-wider block font-sans">
                  📌 สถานะการอ่านหนังสือ (Reading Status)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(["wishlist", "bought", "reading", "completed"] as Status[]).map((status) => {
                    const active = selectedBook.status === status;
                    const config = STATUS_CONFIG[status];
                    
                    return (
                      <button
                        key={status}
                        onClick={() => updateBookStatus(selectedBook.id, status)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-center border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                          active
                            ? "bg-[#4a2f1b] text-white border-[#2e190b] shadow-md"
                            : "bg-white/80 border-[#8c6b53]/20 text-[#5e4125] hover:bg-white hover:border-[#8c6b53]/45"
                        }`}
                      >
                        <span>{config.label.split(" ")[0]}</span>
                        <span className="text-[8px] font-medium opacity-85 leading-none">{config.label.split(" ").slice(1).join(" ")}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Edit Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8c6b53] uppercase tracking-wider block font-sans">
                  📝 บันทึกประเด็นสำคัญ / ความรู้สึกส่วนตัวต่อเล่มนี้:
                </label>
                <textarea
                  rows={6}
                  placeholder="พิมพ์ประเด็นหลักที่ได้ศึกษา ข้อคิดเตือนใจ หรือเหตุผลที่ประทับใจหนังสือเล่มนี้..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-4 rounded-2xl text-xs border-2 border-[#8c6b53]/25 bg-white/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8c5a32]/20 focus:border-[#8c5a32] leading-relaxed text-[#4a2f1b] font-medium"
                />
              </div>

              {/* Section 3: Bottom Actions */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#8c6b53]/20">
                
                {/* Delete Button inside modal */}
                <button
                  onClick={async () => {
                    if (confirm("คุณท่านแน่ใจหรือไม่ครับว่าต้องการลบหนังสือเล่มนี้?")) {
                      setSelectedBook(null);
                      await deleteBook(selectedBook.id);
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border-2 border-red-200/50 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-1 bg-white"
                >
                  🗑️ ลบเล่มนี้
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors font-sans"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    onClick={saveBookNote}
                    disabled={savingNote}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8c5a32] hover:bg-[#704320] text-white shadow-md shadow-amber-950/20 transition-all flex items-center gap-1 border border-[#59381c] font-sans"
                  >
                    {savingNote ? "🔄 กำลังบันทึก..." : "💾 บันทึกโน้ตสรุป"}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
