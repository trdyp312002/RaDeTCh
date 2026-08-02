"use client"
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, User } from 'lucide-react';

export default function WealthNavbar() {
  const pathname = usePathname();

  const isPortfolio = pathname.includes('portfolio');
  const isBalanceSheet = pathname.includes('balance-sheet');
  const isStocks = pathname.includes('/wealth-os/stocks');
  const isDashboard = pathname.includes('dashboard') && !isPortfolio && !isBalanceSheet;

  return (
    <header className="db-header" style={{background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
      <Link href="/" className="db-logo" style={{textDecoration: 'none'}}>
        <span className="db-logo-w">W</span>
        <span style={{color: '#fff'}}>Wealth</span> <span className="db-logo-os">OS</span>
      </Link>
      <nav className="db-nav">
        <Link href="/wealth-os/dashboard" className={`db-nav-item ${isDashboard ? 'active' : ''}`}>Dashboard</Link>
        <Link href="/wealth-os/portfolio" className={`db-nav-item ${isPortfolio ? 'active' : ''}`}>Portfolio</Link>
        <Link href="/wealth-os/balance-sheet" className={`db-nav-item ${isBalanceSheet ? 'active' : ''}`}>Balance Sheet</Link>
        <Link href="/wealth-os/stocks" className={`db-nav-item ${isStocks ? 'active' : ''}`}>Stock Discovery</Link>
      </nav>
      <div className="db-right">
        <div className="db-search">
          <Search size={16} color="#94a3b8" />
          <input type="text" placeholder="Search" />
        </div>
        <div className="db-profile">
          <User size={18} color="#94a3b8" />
        </div>
      </div>
    </header>
  );
}

