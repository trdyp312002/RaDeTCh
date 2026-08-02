"use client";

import { useState } from "react";
import { ExternalLink, Mail, MapPin, Search, ShieldCheck } from "lucide-react";
import styles from "./Relationships.module.css";

const contacts = [
  {
    id: "wit-sittivaekin",
    name: "ดร.วิทย์ สิทธิเวคิน",
    shortName: "เฮียวิทย์",
    role: "Host · 8 Minute History & THE STANDARD",
    location: "Bangkok, Thailand",
    summary: "ติดตามมุมมองด้านประวัติศาสตร์ เศรษฐกิจ และการเล่าเรื่องที่ช่วยเชื่อมอดีตกับโลกปัจจุบัน",
    avatar: "https://ui-avatars.com/api/?name=Wit+Sittivaekin&background=5A4F43&color=fff&size=256",
    topics: ["History", "Economics", "Storytelling"],
    channels: [
      { label: "LinkedIn", detail: "โปรไฟล์สาธารณะ", url: "https://th.linkedin.com/in/wit-sittivaekin-096389237" },
      { label: "8 Minute History", detail: "รายการทาง THE STANDARD", url: "https://thestandard.co/podcast/8-minutes-history-ep0/" },
      { label: "ติดต่องาน", detail: "ผ่านทีม THE STANDARD", url: "mailto:marketing@thestandard.co" },
    ],
    contactNote: "สำหรับงานและความร่วมมือ ใช้อีเมลฝ่ายงานของ THE STANDARD ไม่ใช่อีเมลส่วนตัว",
  },
  {
    id: "ck-cheong",
    name: "CK Cheong",
    shortName: "CK Fastwork",
    role: "CEO · Fastwork",
    location: "Bangkok, Thailand",
    summary: "ติดตามแนวคิดด้านธุรกิจ สตาร์ทอัพ เทคโนโลยี และการสร้างโอกาสให้คนทำงานอิสระ",
    avatar: "https://ui-avatars.com/api/?name=CK+Cheong&background=667761&color=fff&size=256",
    topics: ["Startup", "Business", "Technology"],
    channels: [
      { label: "Official links", detail: "รวมทุกช่องทางของ CK", url: "https://linktr.ee/ckcheong" },
      { label: "LinkedIn", detail: "โปรไฟล์สาธารณะ", url: "https://th.linkedin.com/in/ck-cheong-cpa-msacc-42063478" },
      { label: "Fastwork", detail: "แชตและติดต่องานวิทยากร", url: "https://fastwork.co/user/ckfastwork" },
    ],
    contactNote: "หากต้องการเชิญเป็นวิทยากร ให้ติดต่อผ่านหน้า Fastwork ที่ยืนยันตัวตนแล้ว",
  },
  {
    id: "topp-jirayut",
    name: "ท๊อป จิรายุส ทรัพย์ศรีโสภา",
    shortName: "Topp Jirayut",
    role: "Founder & Group CEO · Bitkub",
    location: "Bangkok, Thailand",
    summary: "ติดตามมุมมองด้านสินทรัพย์ดิจิทัล การเงิน ผู้ประกอบการ และการเปลี่ยนผ่านสู่เศรษฐกิจดิจิทัล",
    avatar: "https://ui-avatars.com/api/?name=Topp+Jirayut&background=798B72&color=fff&size=256",
    topics: ["Blockchain", "Finance", "Entrepreneurship"],
    channels: [
      { label: "Official website", detail: "เว็บไซต์ส่วนตัวทางการ", url: "https://www.toppjirayut.com/" },
      { label: "YouTube", detail: "Topp Jirayut Official", url: "https://www.youtube.com/@ToppJirayutOfficial" },
      { label: "Instagram", detail: "@toppjirayutofficial", url: "https://www.instagram.com/toppjirayutofficial/" },
      { label: "Facebook", detail: "Topp Jirayut Official", url: "https://www.facebook.com/toppjirayutofficial" },
      { label: "Bitkub channels", detail: "รายชื่อช่องทางที่ Bitkub ยืนยัน", url: "https://www.bitkub.com/th/blog/bitkub-official-channels-afd3613f161d" },
    ],
    contactNote: "เลือกใช้เฉพาะบัญชีที่เว็บไซต์ Bitkub ระบุว่าเป็น Official เพื่อหลีกเลี่ยงบัญชีแอบอ้าง",
  },
];

export default function RelationshipsPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(contacts[0].id);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredContacts = contacts.filter((contact) =>
    [contact.name, contact.shortName, contact.role, ...contact.topics]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery),
  );
  const selectedContact = contacts.find((contact) => contact.id === selectedId) ?? contacts[0];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>CURATED NETWORK · 3 PEOPLE</p>
          <h1>People worth learning from.</h1>
          <p>รวมคนที่ติดตามเป็นประจำ พร้อมหัวข้อที่สนใจและช่องทางติดต่อสาธารณะที่ตรวจสอบแล้ว</p>
        </div>
        <div className={styles.trustBadge}>
          <ShieldCheck size={16} />
          Official channels only
        </div>
      </header>

      <section className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อหรือหัวข้อที่สนใจ"
            aria-label="ค้นหารายชื่อ"
          />
        </label>
        <span>{filteredContacts.length} people</span>
      </section>

      <div className={styles.workspace}>
        <section className={styles.people} aria-label="รายชื่อที่ติดตาม">
          {filteredContacts.length ? (
            filteredContacts.map((contact, index) => (
              <button
                type="button"
                key={contact.id}
                onClick={() => setSelectedId(contact.id)}
                className={`${styles.personCard} ${selectedContact.id === contact.id ? styles.selected : ""}`}
              >
                <div className={styles.cardIndex}>{String(index + 1).padStart(2, "0")}</div>
                <img src={contact.avatar} alt="" />
                <div className={styles.cardCopy}>
                  <p>{contact.shortName}</p>
                  <h2>{contact.name}</h2>
                  <span>{contact.role}</span>
                  <div className={styles.topics}>
                    {contact.topics.map((topic) => <em key={topic}>{topic}</em>)}
                  </div>
                </div>
                <span className={styles.arrow}>↗</span>
              </button>
            ))
          ) : (
            <div className={styles.empty}>ไม่พบรายชื่อหรือหัวข้อที่ค้นหา</div>
          )}
        </section>

        <aside className={styles.profile}>
          <div className={styles.profileHead}>
            <img src={selectedContact.avatar} alt="" />
            <div>
              <p>{selectedContact.shortName}</p>
              <h2>{selectedContact.name}</h2>
              <span>{selectedContact.role}</span>
            </div>
          </div>

          <p className={styles.summary}>{selectedContact.summary}</p>
          <div className={styles.location}><MapPin size={15} /> {selectedContact.location}</div>

          <div className={styles.divider} />
          <div className={styles.channelHead}>
            <div>
              <p>PUBLIC CONTACT</p>
              <h3>ช่องทางที่ติดต่อได้</h3>
            </div>
            <Mail size={18} />
          </div>

          <div className={styles.channels}>
            {selectedContact.channels.map((channel) => (
              <a
                key={channel.url}
                href={channel.url}
                target={channel.url.startsWith("mailto:") ? undefined : "_blank"}
                rel={channel.url.startsWith("mailto:") ? undefined : "noreferrer"}
              >
                <span><strong>{channel.label}</strong><small>{channel.detail}</small></span>
                <ExternalLink size={15} />
              </a>
            ))}
          </div>

          <div className={styles.note}>
            <ShieldCheck size={16} />
            <p>{selectedContact.contactNote}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
