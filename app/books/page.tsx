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

  return (
    <div className="min-h-screen bg-slate-50/50 pt-10 pb-24 px-6 md:px-10">
      
      {/* 1. Header Banner */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wider uppercase mb-3">
            📚 Hierarchical Bookshelf
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">คลังปัญญาลำดับขั้น</h1>
          <p className="text-emerald-100 max-w-xl text-sm md:text-base leading-relaxed">
            จัดหมวดหมู่หนังสือแบบซ้อนชั้นระดับลึก เช่น **การเรียน &gt; ภาษา &gt; ภาษาอังกฤษ** ค้นหาง่าย สบายตา และจัดระบบการอ่านได้อย่างแม่นยำ
          </p>
        </div>
        
        {/* บอทราฟาเอล Callout */}
        <div className="relative z-10 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 md:max-w-xs text-xs md:text-sm shadow-inner flex gap-3.5">
          <div className="text-3xl leading-none">🛡️</div>
          <div>
            <p className="font-extrabold text-white mb-1.5 leading-none">ราฟาเอลพร้อมบันทึก!</p>
            <p className="text-emerald-100/90 leading-relaxed text-[11px] md:text-xs">
              ท่านสามารถถ่ายรูปปก หรือพิมพ์เพิ่มใน Discord สั่งราฟาเอลให้จัดหมวดหมู่แบบซ้อนกันได้ เช่นการใส่ป้ายแยกด้วยเครื่องหมายทับ `/` ครับคุณท่าน!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* 2. Statistics Grid Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          
          <div className="col-span-2 lg:col-span-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400">อัตราความสำเร็จ</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-gray-900">{completionRate}%</span>
                <span className="text-[10px] font-medium text-gray-400 leading-none">ของที่ซื้อมาแล้ว</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mt-4 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-rose-500">❤️ เล็งไว้ / อยากซื้อ</p>
            </div>
            <p className="text-3xl font-black text-gray-900 mt-3">{wishlistCount}</p>
            <p className="text-xs text-gray-400 mt-1">เป้าหมายของความต้องการ</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500">📦 ซื้อแล้ว (ดองอยู่)</p>
            </div>
            <p className="text-3xl font-black text-gray-900 mt-3">{boughtCount}</p>
            <p className="text-xs text-gray-400 mt-1">คลังหนังสือพร้อมรออ่าน</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">📚 กำลังอ่าน</p>
            </div>
            <p className="text-3xl font-black text-gray-900 mt-3">{readingCount}</p>
            <p className="text-xs text-gray-400 mt-1">เปิดความรู้/ขัดเกลาวินัย</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500">🎉 อ่านจบแล้ว</p>
            </div>
            <p className="text-3xl font-black text-gray-900 mt-3">{completedCount}</p>
            <p className="text-xs text-gray-400 mt-1">หนังสือที่เติมเต็มคุณท่านแล้ว</p>
          </div>

        </div>

        {/* 3. Filter & Add Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all duration-150 ${
                filterStatus === "all"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              <span className="absolute left-3.5 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold tracking-tight shadow-md shadow-emerald-600/10 flex items-center gap-1.5 transition-colors"
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
          
          {/* ซ้ายมือ: กล่องนำทางหมวดหมู่ลำดับขั้น (Hierarchical Category Tree Explorer) */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-extrabold text-gray-800 tracking-tight uppercase border-b border-gray-50 pb-3 block mb-4">
              🗂️ ตัวสำรวจลำดับขั้น (Category Explorer)
            </h3>
            
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {/* ปุ่มเลือกทั้งหมด */}
              <button
                onClick={() => setFilterCategoryPath("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  filterCategoryPath === "all"
                    ? "bg-slate-900 text-white"
                    : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                }`}
              >
                <span>📦 ทั้งหมดในคลัง</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md ${filterCategoryPath === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {totalCount}
                </span>
              </button>

              {/* เรนเดอร์คลังหมวดหมู่แบบซ้อน */}
              {Object.keys(hierarchicalCategories).map((main) => {
                const mainObj = hierarchicalCategories[main];
                const isMainActive = filterCategoryPath === main;
                
                return (
                  <div key={main} className="space-y-1 bg-slate-50/50 rounded-2xl p-2 border border-slate-100/50">
                    
                    {/* หมวดหมู่หลัก Level 1 */}
                    <button
                      onClick={() => setFilterCategoryPath(main)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-between transition-colors ${
                        isMainActive ? "bg-emerald-600 text-white" : "text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <span className="truncate">📂 {main}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${isMainActive ? "bg-white/25 text-white" : "bg-slate-200/60 text-slate-600"}`}>
                        {mainObj.count}
                      </span>
                    </button>

                    {/* หมวดหมู่รอง Level 2 */}
                    {Object.keys(mainObj.subs).length > 0 && (
                      <div className="pl-3.5 space-y-1 mt-1 border-l border-slate-200 ml-3">
                        {Object.keys(mainObj.subs).map((sub) => {
                          const subObj = mainObj.subs[sub];
                          const subPath = `${main}/${sub}`;
                          const isSubActive = filterCategoryPath === subPath;
                          
                          return (
                            <div key={sub} className="space-y-0.5">
                              <button
                                onClick={() => setFilterCategoryPath(subPath)}
                                className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-bold flex items-center justify-between transition-colors ${
                                  isSubActive ? "bg-slate-900 text-white" : "text-gray-500 hover:bg-slate-100 hover:text-gray-900"
                                }`}
                              >
                                <span className="truncate">↳ {sub}</span>
                                <span className={`text-[8px] px-1.5 py-0.2 rounded-full ${isSubActive ? "bg-white/20 text-white" : "bg-slate-200/50 text-gray-500"}`}>
                                  {subObj.count}
                                </span>
                              </button>

                              {/* หมวดหมู่ย่อยสุด Level 3 */}
                              {Object.keys(subObj.subSubs).length > 0 && (
                                <div className="pl-3.5 space-y-0.5 border-l border-slate-200 ml-2.5">
                                  {Object.keys(subObj.subSubs).map((subSub) => {
                                    const subSubCount = subObj.subSubs[subSub];
                                    const subSubPath = `${main}/${sub}/${subSub}`;
                                    const isSubSubActive = filterCategoryPath === subSubPath;
                                    
                                    return (
                                      <button
                                        key={subSub}
                                        onClick={() => setFilterCategoryPath(subSubPath)}
                                        className={`w-full text-left px-2 py-0.5 rounded text-[10px] font-medium flex items-center justify-between transition-colors ${
                                          isSubSubActive ? "bg-emerald-600 text-white font-bold" : "text-gray-400 hover:bg-slate-100 hover:text-gray-700"
                                        }`}
                                      >
                                        <span className="truncate">⋄ {subSub}</span>
                                        <span className={`text-[7px] px-1 py-0.1 ${isSubSubActive ? "text-emerald-100 font-bold" : "text-gray-400"}`}>
                                          {subSubCount}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
            
            {/* คำชี้แนะการค้นหาลำดับขั้น */}
            <p className="text-[10px] text-gray-300 leading-normal mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              💡 **คำแนะนำการค้นหา:** คลิกเลือกหมวดหลักด้านบน ระบบจะกรองและแสดงผลหนังสือทั้งหมดในหมวดลูกลำดับรองลงมาให้โดยอัตโนมัติครับกระผม!
            </p>
          </div>

          {/* ขวามือ: รายการชั้นหนังสือพรีเมียม */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-100 rounded-3xl p-10">
                <span className="text-3xl animate-bounce">📖</span>
                <p className="text-xs text-gray-400 font-medium mt-3">กำลังเรียกอ่านชั้นหนังสือลำดับขั้นของคุณท่าน...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center shadow-sm">
                <span className="text-4xl">📚</span>
                <p className="text-sm font-extrabold text-gray-700 mt-4">ไม่พบชั้นหนังสือที่ตรงตามหมวดหมู่ลำดับขั้นดังกล่าวครับ</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  คุณท่านสามารถเพิ่มหนังสือใหม่ในหมวดหมู่นี้ได้ง่ายๆ หรือกดเลือกตัวกรองเป็น "ทั้งหมดในคลัง" เพื่อดูหนังสือเล่มอื่น ๆ ได้ครับกระผม
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBooks.map((book) => {
                  const statusCfg = STATUS_CONFIG[book.status];
                  const isUpdating = updatingId === book.id;
                  
                  // ดึงปกจากหมวดหมู่หลักชั้นที่ 1
                  const mainCategoryName = book.category ? book.category.split("/")[0] : "ทั่วไป";
                  const coverUrl = CATEGORY_COVERS[mainCategoryName] || DEFAULT_COVER;

                  return (
                    <div 
                      key={book.id} 
                      className={`bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group relative ${
                        isUpdating ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      
                      <div className="h-40 w-full relative overflow-hidden bg-slate-900">
                        <img 
                          src={coverUrl} 
                          alt={book.category}
                          className="object-cover w-full h-full opacity-65 group-hover:scale-105 transition-transform duration-500"
                        />
                        
                        {/* ป้ายแสดงหมวดหมู่ลำดับขั้นทั้งหมด */}
                        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-1">
                          {book.category.split("/").map((part, index) => (
                            <span 
                              key={index} 
                              className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md backdrop-blur-md text-white border border-white/10 ${
                                index === 0 ? "bg-slate-950/85" : index === 1 ? "bg-slate-800/70" : "bg-emerald-600/70"
                              }`}
                            >
                              {index > 0 ? "› " : ""}{part}
                            </span>
                          ))}
                        </div>

                        {/* ปุ่มลบ */}
                        <button
                          onClick={() => deleteBook(book.id)}
                          className="absolute top-3.5 right-3.5 w-7 h-7 flex items-center justify-center rounded-lg bg-gray-950/70 hover:bg-red-600/90 border border-white/10 text-white hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                          title="ลบหนังสือ"
                        >
                          🗑️
                        </button>
                        
                        {/* ป้ายแสดงสถานะซ้อนด้านล่างรูป */}
                        <div className="absolute bottom-4 left-4">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-gray-800 tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                            {book.title}
                          </h4>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">ผู้แต่ง: {book.author}</p>
                          
                          <p className="text-[11px] text-gray-500 mt-3.5 leading-relaxed line-clamp-2">
                            {book.description || "*(ยังไม่ได้จดข้อคิดเห็นหรือเหตุผลที่อยากซื้อเล่มนี้)*"}
                          </p>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between gap-3">
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setEditDesc(book.description || "");
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 transition-colors flex items-center gap-1 shrink-0"
                          >
                            📝 โน้ตสรุป
                          </button>

                          {statusCfg.nextStatus && (
                            <button
                              onClick={() => updateBookStatus(book.id, statusCfg.nextStatus!)}
                              className="text-[10px] font-extrabold tracking-tight px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/10 flex items-center gap-1 transition-colors ml-auto"
                            >
                              {statusCfg.buttonLabel} →
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 7. Notes & Summary thoughts Modal Overlay */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-gray-100 animate-scaleUp">
            
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
              <span className="text-[9px] font-extrabold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-md border border-white/10 block mb-2 w-max">
                📂 {selectedBook.category}
              </span>
              <h3 className="text-base font-extrabold leading-tight">{selectedBook.title}</h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">ผู้แต่ง: {selectedBook.author}</p>
              
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-5 right-5 text-lg text-white/70 hover:text-white hover:bg-white/10 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  📝 บันทึกความในใจ / สรุปประเด็นหลักที่ได้เรียนรู้จากเล่มนี้:
                </label>
                <textarea
                  rows={6}
                  placeholder="พิมพ์สรุปเนื้อหาสำคัญ ข้อคิดสะกิดใจ หรือเหตุผลที่ทำให้ท่านสนใจซื้อหนังสือเล่มนี้..."
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-4 rounded-2xl text-xs border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-[10px] text-gray-300 font-mono">
                  อัปเดตล่าสุด: {selectedBook.updated_at ? selectedBook.updated_at.split(" ")[0] : "—"}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    ปิดหน้าจอ
                  </button>
                  <button
                    onClick={saveBookNote}
                    disabled={savingNote}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/10 transition-colors flex items-center gap-1"
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
