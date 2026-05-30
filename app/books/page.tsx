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

  // หั่นหนังสือออกเป็นชั้นละ 4 เล่มเพื่อสร้างชั้นวางไม้ 3D เสมือนจริง
  const booksPerShelf = 4;
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

        {/* 6. Layout: Sidebar Category Tree + Book List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* ซ้ายมือ: ตู้เก็บเอกสารหมวดหมู่ย้อนยุค 3 มิติ (3D Antique Mahogany Library Card Catalog Cabinet) */}
          <div className="relative bg-gradient-to-b from-[#4a2e1b] via-[#352011] to-[#201007] p-5 rounded-3xl border-[6px] border-[#5c3e21] border-t-[#8c5a32] border-l-[#724a27] border-r-[#4a2e16] border-b-[#2a170a] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.15)] text-amber-100 select-none max-w-sm lg:max-w-none mx-auto w-full z-10">
            
            {/* หมุดเหล็กทองเหลืองยึดมุมตู้เพื่อความสมจริง (Brass Corner Rivets) */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#dfb269] to-[#866027] border border-[#4d3412] shadow-[0_1px_2px_black]" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#dfb269] to-[#866027] border border-[#4d3412] shadow-[0_1px_2px_black]" />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#dfb269] to-[#866027] border border-[#4d3412] shadow-[0_1px_2px_black]" />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-gradient-to-br from-[#dfb269] to-[#866027] border border-[#4d3412] shadow-[0_1px_2px_black]" />

            {/* แผ่นป้ายทองเหลืองสไตล์คลาสสิก (Classic Cabinet Header Plate) */}
            <div className="relative bg-gradient-to-r from-[#1c0f08] via-[#0b0300] to-[#1c0f08] border border-[#dfb269]/40 rounded-xl p-3 mb-6 text-center shadow-[inset_0_1px_3px_black,0_4px_6px_rgba(0,0,0,0.3)]">
              <div className="absolute top-1/2 left-2.5 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#dfb269] opacity-70 shadow-sm" />
              <div className="absolute top-1/2 right-2.5 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#dfb269] opacity-70 shadow-sm" />
              <h3 className="text-xs font-serif font-black tracking-widest text-[#dfb269] uppercase">
                🗄️ CARD CATALOG ARCHIVE
              </h3>
              <span className="text-[8px] text-amber-200/40 uppercase font-mono tracking-widest block mt-0.5">
                ระบบจัดประเภทคลังปัญญา 3 มิติ
              </span>
            </div>
            
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-800/10">
              
              {/* ลิ้นชักทองคำเลือกหนังสือทั้งหมด (Golden Master Drawer) */}
              <button
                onClick={() => setFilterCategoryPath("all")}
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-black tracking-wider flex items-center justify-between transition-all duration-200 border-2 select-none ${
                  filterCategoryPath === "all"
                    ? "bg-gradient-to-r from-[#ffd89b] via-[#dfb269] to-[#c49b5c] text-[#2c1b10] border-[#936d35] border-b-4 border-b-[#7a5720] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.45)]"
                    : "bg-[#25150a] text-amber-100/80 border-[#3d220f] border-b-4 border-b-black/80 hover:bg-[#2e1b10] hover:text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:border-b-2"
                }`}
              >
                <span className="flex items-center gap-1.5">📖 ทั้งหมดในคลังหนังสือ</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${filterCategoryPath === "all" ? "bg-black/15 text-[#2c1b10] font-black" : "bg-black/35 text-amber-200/50"}`}>
                  {totalCount} เล่ม
                </span>
              </button>

              {/* วนลูปสร้างตู้ลิ้นชักแยกประเภทตามหมวดหมู่หลัก (Dynamic Wooden Drawers) */}
              {Object.keys(hierarchicalCategories).map((main) => {
                const mainObj = hierarchicalCategories[main];
                const isMainActive = filterCategoryPath === main || filterCategoryPath.startsWith(main + "/");
                const isMainExpanded = !!expandedMainCats[main];
                const hasSubs = Object.keys(mainObj.subs).length > 0;
                
                return (
                  <div key={main} className="space-y-1">
                    
                    {/* ตัวกรอบฐานลิ้นชัก (Drawer Outer Slot Slot Housing) */}
                    <div className="bg-[#100602] border border-[#2e190d] rounded-2xl shadow-[inset_0_5px_12px_black] p-0.5 overflow-hidden">
                      
                      {/* หน้ากากตู้ไม้ดึงลิ้นชัก (3D Drawer Beveled Front Face) */}
                      <div
                        onClick={() => {
                          setFilterCategoryPath(main);
                          setExpandedMainCats(prev => ({ ...prev, [main]: !prev[main] }));
                        }}
                        className={`group relative z-20 h-20 rounded-xl bg-gradient-to-b from-[#5c351b] via-[#482813] to-[#2e180a] border-t-2 border-t-[#8c5a32]/40 border-b-[5px] border-b-black/85 border-x border-x-[#3a1e0b] shadow-[0_5px_12px_rgba(0,0,0,0.6)] flex items-center justify-between px-4 select-none cursor-pointer transition-all duration-300 hover:brightness-110 ${
                          isMainExpanded 
                            ? "translate-y-2 text-[#dfb269] shadow-[0_1px_2px_black] border-b-[2px] border-b-black/60 brightness-95" 
                            : "hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-[2px]"
                        }`}
                      >
                        {/* กรอบป้ายทองเหลืองยึดหมุดสกรู (Brass Frame with Aged Label) */}
                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          <div className="border border-black/35 rounded-md p-1 bg-black/25 flex items-center relative shrink-0">
                            {/* หมุดสกรูยึดป้าย */}
                            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-yellow-600/60" />
                            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-yellow-600/60" />
                            
                            {/* กระดาษบันทึกสีขาวกระดาษเก่าครีม */}
                            <div className="bg-[#f2e7c9] border border-[#b89f74]/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] text-[#2d1b0d] text-[10px] font-serif font-black px-2 py-0.5 rounded tracking-wide truncate max-w-[120px]">
                              📂 {main}
                            </div>
                          </div>
                          
                          {/* จำนวนหนังสือ */}
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0 ${
                            isMainActive ? "bg-[#dfb269] text-[#2c1b10]" : "bg-black/35 text-amber-200/50 border border-white/5"
                          }`}>
                            {mainObj.count} เล่ม
                          </span>
                        </div>

                        {/* ห่วงดึงลิ้นชักทองเหลืองแท้ 3D (Brass Cup Handle) */}
                        <div className="shrink-0 pl-2">
                          <div className="w-8 h-4 bg-gradient-to-b from-[#dfb269] to-[#9e7333] rounded-b-full border border-[#5a3d14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_3px_black] flex items-center justify-center after:content-[''] after:w-4 after:h-1.5 after:bg-[#1a0f07] after:rounded-b-full group-hover:from-[#fce0ad]" />
                        </div>
                      </div>

                      {/* รางถาดลิ้นชักเลื่อนเปิดออก (Wooden Tray Slide with Parchment Index Cards) */}
                      {isMainExpanded && (
                        <div className="relative z-10 bg-gradient-to-b from-[#160b05] via-[#24130a] to-[#120703] border-t border-[#120702] rounded-b-2xl p-3 shadow-[inset_0_8px_16px_rgba(0,0,0,0.8),0_6px_12px_black/60] flex flex-col gap-2.5 mt-0.5 animate-slideDown overflow-hidden border border-[#dfb269]/10">
                          
                          {/* ข้อมูลแผ่น Index Card */}
                          {hasSubs ? (
                            Object.keys(mainObj.subs).map((sub) => {
                              const subObj = mainObj.subs[sub];
                              const subPath = `${main}/${sub}`;
                              const isSubActive = filterCategoryPath === subPath || filterCategoryPath.startsWith(subPath + "/");
                              const hasSubSubs = Object.keys(subObj.subSubs).length > 0;

                              return (
                                <div
                                  key={sub}
                                  onClick={(e) => {
                                    e.stopPropagation(); // เลี่ยงการปิดหน้ากากลิ้นชัก
                                    setFilterCategoryPath(subPath);
                                  }}
                                  className={`relative bg-[#fcf9f2] text-stone-900 rounded-xl p-3 border-l-4 shadow-[2px_3px_6px_rgba(0,0,0,0.35)] border border-stone-200/60 hover:translate-x-1 hover:bg-white transition-all duration-200 cursor-pointer select-none ${
                                    isSubActive
                                      ? "border-l-[#dfb269] bg-amber-50/70 shadow-[1px_2px_4px_rgba(223,178,105,0.35)]"
                                      : "border-l-[#8c5a32] hover:border-l-[#a87445]"
                                  }`}
                                >
                                  {/* ข้อมูลหมวดหมู่ย่อย Level 2 */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[11px] font-extrabold text-[#4a2e16] truncate flex items-center gap-1.5">
                                      📁 {sub}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 font-extrabold">
                                      {subObj.count}
                                    </span>
                                  </div>

                                  {/* ป้าย Index Tag หมวดหมู่ย่อยสุด Level 3 แบบแนวนอนสุดพรีเมียม */}
                                  {hasSubSubs && (
                                    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-stone-200/40">
                                      {Object.keys(subObj.subSubs).map((subSub) => {
                                        const subSubCount = subObj.subSubs[subSub];
                                        const subSubPath = `${main}/${sub}/${subSub}`;
                                        const isSubSubActive = filterCategoryPath === subSubPath;

                                        return (
                                          <button
                                            key={subSub}
                                            onClick={(e) => {
                                              e.stopPropagation(); // ป้องกันการคัดเลือกการ์ดใบหลัก
                                              setFilterCategoryPath(subSubPath);
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase transition-colors border select-none ${
                                              isSubSubActive
                                                ? "bg-[#dfb269] text-[#2c1b10] border-[#9a6f2b] shadow-sm"
                                                : "bg-[#8c5a32]/10 text-[#8c5a32] border-[#8c5a32]/25 hover:bg-[#8c5a32]/20"
                                            }`}
                                          >
                                            {subSub} ({subSubCount})
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-4 text-amber-200/20 text-[10px] font-medium italic">
                              ไม่มีหมวดหมู่ย่อยในหมวดนี้ครับกระผม
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* คู่มือการกดประเภทลิ้นชัก */}
            <p className="text-[9px] text-amber-200/45 leading-relaxed mt-4 bg-black/25 p-3 rounded-xl border border-[#dfb269]/10 font-medium">
              💡 **คู่มือใช้งานตู้ 3 มิติ:** คลิกตัวลิ้นชักไม้สีเข้มเพื่อ **เลื่อนสไลด์เปิดถาด** และคลิกเลือกการ์ดข้อมูลหรือแท็บภายในลิ้นชักเพื่อคัดกรองหนังสืออย่างละเอียดตามต้องการเลยครับคุณท่าน!
            </p>
          </div>

          {/* ขวามือ: รายการชั้นหนังสือไม้ 3D พรีเมียม */}
          <div className="lg:col-span-3">
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
