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
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("wishlist");
  const [mainCatPreset, setMainCatPreset] = useState("ทั่วไป");

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/books?t=' + Date.now());
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

  async function deleteBook(id: string) {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหนังสือเล่มนี้?")) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchBooks();
        if (selectedBook?.id === id) setSelectedBook(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newAuthor) return;
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          description: newDesc,
          category: mainCatPreset,
          status: newStatus,
        }),
      });
      if (res.ok) {
        setNewTitle(""); setNewAuthor(""); setNewDesc("");
        setShowAddForm(false);
        await fetchBooks();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filteredBooks = books.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const matchSearch = 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const currentlyReadingBooks = books.filter(b => b.status === "reading");
  const heroBook = currentlyReadingBooks.length > 0 ? currentlyReadingBooks[0] : null;

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#33302C] font-sans pb-24">
      <div className="max-w-6xl mx-auto px-6 mt-12">
        {/* Add Book Button since we removed the navbar where it was */}
        <div className="flex justify-end mb-8">
           <button className="text-[#33302C] bg-[#E8E1D5] hover:bg-[#D5CCBE] px-4 py-2 rounded-full text-sm font-medium transition-colors" onClick={() => setShowAddForm(!showAddForm)}>+ Add Book</button>
        </div>
        {/* Hero Section: Currently Reading */}
        {heroBook && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 mb-24">
            <div className="relative w-48 h-72 md:w-64 md:h-96 shadow-[0_20px_40px_rgba(0,0,0,0.15)] rounded-r-lg border-l-4 border-black/20 overflow-hidden transform transition-transform hover:scale-105">
              <img 
                src={heroBook.cover_image || CATEGORY_COVERS[heroBook.category.split("/")[0]] || DEFAULT_COVER} 
                className="w-full h-full object-cover" 
                alt={heroBook.title} 
              />
            </div>
            <div className="flex flex-col items-start max-w-md">
              <span className="text-lg text-[#5A4F43] mb-2 font-medium">Currently Reading</span>
              <h2 className="text-4xl md:text-5xl font-serif text-[#1F1D1A] mb-4 leading-tight">{heroBook.title}</h2>
              <span className="text-[#8C837A] mb-4">50% read</span>
              
              <div className="w-full bg-[#E8E1D5] h-2 rounded-full mb-8 overflow-hidden">
                <div className="bg-[#5A4F43] h-full w-1/2 rounded-full"></div>
              </div>

              <button 
                onClick={() => updateBookStatus(heroBook.id, "completed")}
                className="px-6 py-3 bg-[#5A4F43] text-[#FAF6F0] rounded-full text-sm font-medium hover:bg-[#433A31] transition-colors shadow-md"
              >
                Mark as Completed
              </button>
            </div>
          </div>
        )}

        {/* Add Book Form (Toggleable) */}
        {showAddForm && (
          <div className="bg-white border border-[#E8E1D5] rounded-3xl p-8 shadow-sm mb-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-serif text-[#1F1D1A] mb-6">Add New Book</h3>
            <form onSubmit={handleAddBook} className="space-y-4">
              <input type="text" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-[#FAF6F0] focus:outline-none focus:ring-2 focus:ring-[#5A4F43]/30" required />
              <input type="text" placeholder="Author" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-[#FAF6F0] focus:outline-none focus:ring-2 focus:ring-[#5A4F43]/30" required />
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Status)} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-[#FAF6F0] focus:outline-none focus:ring-2 focus:ring-[#5A4F43]/30">
                <option value="wishlist">To Read (Wishlist)</option>
                <option value="bought">Purchased (Bought)</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 rounded-full text-sm font-medium bg-[#E8E1D5] text-[#5A4F43]">Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-full text-sm font-medium bg-[#5A4F43] text-white">Save Book</button>
              </div>
            </form>
          </div>
        )}

        {/* Library Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-[#E8E1D5] pb-4">
          <div className="flex items-center gap-6">
            <h3 className="text-3xl font-serif text-[#1F1D1A]">Your Library</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterStatus("completed")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filterStatus === "completed" ? "bg-[#5A4F43] text-white border-[#5A4F43]" : "bg-transparent text-[#5A4F43] border-[#5A4F43] hover:bg-[#E8E1D5]"}`}
              >
                Read
              </button>
              <button 
                onClick={() => setFilterStatus("wishlist")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filterStatus === "wishlist" ? "bg-[#5A4F43] text-white border-[#5A4F43]" : "bg-transparent text-[#5A4F43] border-[#5A4F43] hover:bg-[#E8E1D5]"}`}
              >
                To Read
              </button>
              <button 
                onClick={() => setFilterStatus("bought")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border ${filterStatus === "bought" ? "bg-[#5A4F43] text-white border-[#5A4F43]" : "bg-transparent text-[#5A4F43] border-[#5A4F43] hover:bg-[#E8E1D5]"}`}
              >
                Purchased
              </button>
              {filterStatus !== "all" && (
                <button onClick={() => setFilterStatus("all")} className="px-4 py-1.5 rounded-full text-sm font-medium text-[#8C837A] hover:text-[#33302C]">Clear</button>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 relative">
             <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 rounded-full border border-[#E8E1D5] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#5A4F43]" />
             <span className="absolute left-3 top-2 text-[#8C837A] text-sm material-symbols-outlined">search</span>
          </div>
        </div>

        {/* Library Grid */}
        {loading ? (
           <div className="text-center py-20 text-[#8C837A]">Loading books...</div>
        ) : filteredBooks.length === 0 ? (
           <div className="text-center py-20 text-[#8C837A]">No books found in this category.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredBooks.map((book) => {
              const progressPercentage = book.status === "completed" ? "100%" : book.status === "reading" ? "50%" : "0%";
              const statusText = book.status === "completed" ? "Read" : book.status === "reading" ? "Reading" : "Not started";
              
              return (
                <div key={book.id} className="bg-white rounded-xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#E8E1D5] flex flex-col group transition-transform hover:-translate-y-1">
                  <div className="relative w-full aspect-[2/3] mb-4 shadow-[0_8px_16px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden">
                    <img 
                      src={book.cover_image || CATEGORY_COVERS[book.category.split("/")[0]] || DEFAULT_COVER} 
                      className="w-full h-full object-cover" 
                      alt={book.title} 
                    />
                    {updatingId === book.id && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-[#5A4F43]">Updating...</div>}
                  </div>
                  <h4 className="font-serif text-[#1F1D1A] text-sm font-medium mb-1 line-clamp-2 leading-tight">{book.title}</h4>
                  <p className="text-[#8C837A] text-xs mb-3 truncate">{book.author}</p>
                  
                  <div className="mt-auto">
                    <div className="text-[10px] text-[#8C837A] mb-1.5">{statusText}</div>
                    <div className="w-full bg-[#E8E1D5] h-1 rounded-full overflow-hidden">
                      <div className="bg-[#5A4F43] h-full rounded-full transition-all duration-500" style={{ width: progressPercentage }}></div>
                    </div>
                  </div>

                  {/* Actions overlay on hover */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-white/95 border-t border-[#E8E1D5] translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all flex justify-between gap-1">
                    <button onClick={() => updateBookStatus(book.id, "reading")} className="text-[10px] py-1 px-2 rounded bg-[#FAF6F0] text-[#5A4F43] font-medium flex-1 text-center hover:bg-[#E8E1D5]">Read</button>
                    <button onClick={() => deleteBook(book.id)} className="text-[10px] py-1 px-2 rounded text-red-600 hover:bg-red-50 font-medium">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
