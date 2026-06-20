"use client";

import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, Clock, Phone, Mail, MapPin, MoreHorizontal, UserCircle, Star, Heart, MessageSquare, Video } from 'lucide-react';

const contactsData = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    relation: 'Close Friend',
    lastContacted: '2 days ago',
    birthday: 'Oct 15',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    tags: ['College', 'Travel Buddy'],
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    notes: [
      { id: 1, date: 'Oct 10, 2023', text: 'Caught up over coffee. She is planning a trip to Japan.' },
      { id: 2, date: 'Sep 15, 2023', text: 'Sent birthday gift for her dog.' }
    ]
  },
  {
    id: 2,
    name: 'Michael Chen',
    relation: 'Colleague',
    lastContacted: '1 week ago',
    birthday: 'Jan 22',
    email: 'm.chen@company.com',
    phone: '+1 (555) 987-6543',
    location: 'New York, NY',
    tags: ['Work', 'Engineering'],
    avatar: 'https://i.pravatar.cc/150?u=michael',
    notes: [
      { id: 1, date: 'Oct 4, 2023', text: 'Discussed Q4 project timeline.' }
    ]
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    relation: 'Mentor',
    lastContacted: '3 weeks ago',
    birthday: 'Nov 05',
    email: 'elena.r@design.co',
    phone: '+1 (555) 321-7654',
    location: 'Austin, TX',
    tags: ['Design', 'Career'],
    avatar: 'https://i.pravatar.cc/150?u=elena',
    notes: [
      { id: 1, date: 'Sep 20, 2023', text: 'Reviewed my portfolio. Suggested focusing on more interaction design pieces.' }
    ]
  },
  {
    id: 4,
    name: 'David Kim',
    relation: 'Family',
    lastContacted: 'Yesterday',
    birthday: 'Dec 12',
    email: 'david.kim@family.net',
    phone: '+1 (555) 444-5555',
    location: 'Seattle, WA',
    tags: ['Cousin'],
    avatar: 'https://i.pravatar.cc/150?u=david',
    notes: [
      { id: 1, date: 'Oct 11, 2023', text: 'Called to check in on Aunt Mary.' }
    ]
  },
  {
    id: 5,
    name: 'Chloe Dubois',
    relation: 'Friend',
    lastContacted: '1 month ago',
    birthday: 'Mar 18',
    email: 'chloe.d@gmail.com',
    phone: '+33 6 12 34 56 78',
    location: 'Paris, France',
    tags: ['Language Exchange'],
    avatar: 'https://i.pravatar.cc/150?u=chloe',
    notes: [
      { id: 1, date: 'Sep 10, 2023', text: 'Had a long video call practicing French.' }
    ]
  },
  {
    id: 6,
    name: 'James Wilson',
    relation: 'Network',
    lastContacted: '2 months ago',
    birthday: 'Aug 30',
    email: 'j.wilson@invest.com',
    phone: '+1 (555) 888-9999',
    location: 'Chicago, IL',
    tags: ['Finance', 'Investor'],
    avatar: 'https://i.pravatar.cc/150?u=james',
    notes: [
      { id: 1, date: 'Aug 15, 2023', text: 'Met at the FinTech summit. Exchanged contact info.' }
    ]
  }
];

const filterPills = ['All', 'Family', 'Friends', 'Colleagues', 'Network'];

export default function RelationshipsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState(contactsData[0]);

  const filteredContacts = contactsData.filter(contact => {
    const matchesFilter = activeFilter === 'All' || contact.relation.includes(activeFilter) || (activeFilter === 'Colleagues' && contact.relation === 'Colleague');
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Subtle background gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none"></div>

        {/* Header */}
        <header className="px-8 pt-8 pb-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-md z-10 flex flex-col gap-6 shrink-0">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">Relationship & Connections Manager</h1>
              <p className="text-slate-500 mt-2 font-medium">Nurture and track your most important personal and professional bonds.</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="w-4 h-4" strokeWidth={3} />
              Add Connection
            </button>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div className="relative w-[28rem] group">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or tags..."
                className="w-full pl-12 pr-4 py-3 bg-slate-100/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:bg-white text-sm font-medium transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Filter</span>
              </div>
              <div className="flex gap-2">
                {filterPills.map(pill => (
                  <button
                    key={pill}
                    onClick={() => setActiveFilter(pill)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeFilter === pill 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Grid Area */}
        <main className="flex-1 overflow-y-auto p-8 relative z-0">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <UserCircle className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">No connections found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredContacts.map(contact => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`group relative bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                    selectedContact.id === contact.id 
                      ? 'border-2 border-indigo-500 shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                      : 'border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-4 items-center">
                      <div className="relative">
                        <img src={contact.avatar} alt={contact.name} className="w-14 h-14 rounded-full object-cover shadow-sm" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{contact.name}</h3>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">{contact.relation}</span>
                      </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-3 mt-5 pt-5 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Last contact</span>
                      </div>
                      <span className="text-slate-700 font-semibold">{contact.lastContacted}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Birthday</span>
                      </div>
                      <span className="text-slate-700 font-semibold">{contact.birthday}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className="w-[420px] bg-white border-l border-slate-200/60 flex flex-col h-full shrink-0 shadow-2xl z-20">
        <div className="flex-1 overflow-y-auto">
          {selectedContact ? (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
              {/* Profile Header */}
              <div className="relative px-8 pt-12 pb-8 text-center bg-gradient-to-b from-slate-50 to-white">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="relative inline-block mb-5">
                  <img 
                    src={selectedContact.avatar} 
                    alt={selectedContact.name} 
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-xl" 
                  />
                  <div className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900">{selectedContact.name}</h2>
                <p className="text-sm font-medium text-indigo-600 mt-1">{selectedContact.relation}</p>
                
                <div className="flex justify-center gap-3 mt-6">
                  <button className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors flex justify-center items-center gap-2 font-semibold text-sm">
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors flex justify-center items-center gap-2 font-semibold text-sm">
                    <Video className="w-4 h-4" /> Meet
                  </button>
                </div>
              </div>

              <div className="px-8 pb-8">
                {/* Details Card */}
                <div className="space-y-4 mb-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Email Address</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedContact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Phone Number</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedContact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-500 mb-0.5">Location</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{selectedContact.location}</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Tags & Groups</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                        {tag}
                      </span>
                    ))}
                    <button className="px-3 py-1.5 border border-dashed border-slate-300 text-slate-500 rounded-lg text-xs font-bold hover:border-slate-400 hover:bg-slate-50 transition-colors">
                      + Add Tag
                    </button>
                  </div>
                </div>

                {/* Interaction Notes */}
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-sm font-bold text-slate-900">Interaction Timeline</h3>
                    <button className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <Plus className="w-3 h-3" strokeWidth={3} /> Add Note
                    </button>
                  </div>
                  
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {selectedContact.notes.map((note) => (
                      <div key={note.id} className="relative flex items-start justify-between">
                        <div className="w-5 h-5 absolute left-0 mt-1 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full ring-4 ring-white z-10"></div>
                        </div>
                        <div className="pl-8 w-full">
                          <span className="text-xs font-bold text-slate-400 block mb-1.5">{note.date}</span>
                          <p className="text-sm text-slate-700 leading-relaxed bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            {note.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Select a Connection</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">Choose a contact from the grid to view their detailed profile, upcoming events, and past interaction notes.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
