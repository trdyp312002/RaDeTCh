const fs = require('fs');
const path = require('path');

const wealthDir = path.join('C:', 'Users', 'trdyp', 'OneDrive', 'Desktop', 'MYWORLD', 'Projects', 'radetch', 'app', '(wealth)');
const stitchDir = path.join(wealthDir, 'stitch_unified_ai_wealth_dashboard');

// Helper to convert HTML to JSX
function htmlToJsx(html) {
    return html
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/<!--[\s\S]*?-->/g, '') // remove comments
        .replace(/<br>/g, '<br/>')
        .replace(/<input([^>]*?[^\/])>/g, '<input$1/>') // close inputs
        .replace(/style="([^"]*)"/g, (match, styleString) => {
            const styleObj = {};
            styleString.split(';').forEach(s => {
                if (!s.trim()) return;
                const [key, value] = s.split(':');
                if (key && value) {
                    const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                    styleObj[camelKey] = value.trim();
                }
            });
            return `style={${JSON.stringify(styleObj)}}`;
        });
}

function extractMain(htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (!mainMatch) return '<main className="flex-1 p-6">Content Not Found</main>';
    const mainHtml = mainMatch[0];
    return htmlToJsx(mainHtml);
}

const dashboardMain = extractMain(path.join(stitchDir, 'dashboard_personal_finance', 'code.html'));
const portfolioMain = extractMain(path.join(stitchDir, 'portfolio_management', 'code.html'));
const healthMain = extractMain(path.join(stitchDir, 'financial_health_dashboard', 'code.html'));
const aiMain = extractMain(path.join(stitchDir, 'ai_trading_terminal', 'code.html'));

// 1. Create Layout with Unified Sidebar
const layoutContent = `"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function WealthLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  
  const navItems = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/portfolio', icon: 'account_balance_wallet', label: 'Portfolio' },
    { href: '/health', icon: 'analytics', label: 'Health' },
    { href: '/ai-terminal', icon: 'smart_toy', label: 'AI Terminal' },
  ]

  return (
    <div className="bg-[#0b1326] text-[#e0e2ec] font-sans flex min-h-screen">
      {/* Global CSS overrides for the theme */}
      <style jsx global>{\`
        :root {
          --color-surface: #0b1326;
          --color-surface-container: #171f32;
          --color-surface-container-high: #212a3d;
          --color-surface-container-highest: #2c3448;
          --color-on-surface: #e0e2ec;
          --color-on-surface-variant: #c0c6dc;
          --color-outline: #8a90a5;
          --color-primary: #bcc3ff;
          --color-on-primary: #242d76;
          --color-primary-container: #3d468e;
          --color-on-primary-container: #dfe0ff;
          --color-secondary: #c3c5dd;
          --color-error: #ffb4ab;
          --color-on-error: #690005;
          --color-background: #0b1326;
          --color-tertiary: #e5bad7;
        }
        .neo-shadow { box-shadow: 6px 6px 0px 0px rgba(138, 144, 165, 0.5); }
        .neo-shadow-sm { box-shadow: 4px 4px 0px 0px rgba(138, 144, 165, 0.5); }
        .neo-border { border: 2px solid var(--color-outline); }
        .brutal-border { border: 3px solid var(--color-on-surface); }
        .brutal-shadow { box-shadow: 6px 6px 0px 0px var(--color-on-surface); }
      \`}</style>

      {/* SideNavBar */}
      <nav className="w-64 h-full border-r-4 border-[var(--color-outline)] fixed left-0 top-0 z-40 flex flex-col bg-[var(--color-surface-container)] hidden md:flex">
        <div className="p-6 border-b-4 border-[var(--color-outline)]">
          <Link href="/">
             <h1 className="text-2xl font-black tracking-tighter text-[var(--color-primary)] uppercase">BAUHAUS.FI</h1>
          </Link>
          <p className="text-xs font-bold uppercase mt-1 text-[var(--color-on-surface-variant)]">V0.1-BETA</p>
        </div>
        <div className="flex-grow py-6 flex flex-col gap-2">
          {navItems.map(item => {
            const active = path.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} 
                className={active 
                  ? "flex items-center gap-3 px-4 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-2 border-[var(--color-primary)] font-bold uppercase translate-x-1 translate-y-1 rounded-lg"
                  : "flex items-center gap-3 px-4 py-3 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)] transition-colors uppercase font-medium"
                }>
                <span className="material-symbols-outlined" style={active ? {fontVariationSettings: "'FILL' 1"} : {}}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
        {/* TopNavBar */}
        <header className="sticky top-0 right-0 z-30 flex justify-between items-center px-6 py-4 w-full border-b-4 border-[var(--color-outline)] bg-[var(--color-surface-container)] hidden md:flex">
          <div className="flex-1"></div>
          <div className="flex items-center gap-6 uppercase font-bold text-sm">
            <span className="text-[var(--color-on-surface)]">BTC: $64,231</span>
            <span className="text-[var(--color-on-surface)]">GOLD: $2,342</span>
            <div className="flex items-center gap-3">
              <button className="p-2 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] neo-border rounded-lg"><span className="material-symbols-outlined">notifications</span></button>
              <button className="p-2 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)] neo-border rounded-lg"><span className="material-symbols-outlined">account_circle</span></button>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}
`;

fs.writeFileSync(path.join(wealthDir, 'layout.tsx'), layoutContent);

// 2. Dashboard Page
const dashboardCode = `"use client"
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [totalPortValue, setTotalPortValue] = useState(1420000)
  const [pnl, setPnl] = useState(156230)
  
  useEffect(() => {
    // Fetch data logic
    fetch("/api/networth").then(r => r.json()).then(data => {
        if(data && data.length > 0) {
            setTotalPortValue(data[data.length-1].net_worth || 1420000)
        }
    }).catch(console.error)
  }, [])

  return (
    ${dashboardMain.replace('1.42M', '{$${(totalPortValue/1000000).toFixed(2)}M}').replace('+12.4% YTD', '{((pnl / totalPortValue) * 100).toFixed(1)}% YTD').replace('+$156,230', '+${pnl.toLocaleString()}')}
  )
}
`;
fs.mkdirSync(path.join(wealthDir, 'dashboard'), { recursive: true });
fs.writeFileSync(path.join(wealthDir, 'dashboard', 'page.tsx'), dashboardCode);

// 3. Portfolio Page
const portfolioCode = `"use client"
import { useState, useEffect } from 'react'

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState([])
  
  useEffect(() => {
    fetch("/api/holdings?portfolio=long_term").then(r => r.json()).then(data => {
        if(Array.isArray(data)) setHoldings(data)
    }).catch(console.error)
  }, [])

  return (
    ${portfolioMain}
  )
}
`;
fs.mkdirSync(path.join(wealthDir, 'portfolio'), { recursive: true });
fs.writeFileSync(path.join(wealthDir, 'portfolio', 'page.tsx'), portfolioCode);

// 4. Health Page
const healthCode = `"use client"
import { useState, useEffect } from 'react'

export default function HealthPage() {
  const [netWorth, setNetWorth] = useState(1420000)
  const [assets, setAssets] = useState(1610000)
  
  useEffect(() => {
    fetch("/api/networth").then(r => r.json()).then(data => {
        if(data && data.length > 0) {
            setNetWorth(data[data.length-1].net_worth || 1420000)
            setAssets(data[data.length-1].total_assets || 1610000)
        }
    }).catch(console.error)
  }, [])

  return (
    ${healthMain.replace('$1.42M', '{$${(netWorth/1000000).toFixed(2)}M}').replace('$1,610,000', '{$${assets.toLocaleString()}}')}
  )
}
`;
fs.mkdirSync(path.join(wealthDir, 'health'), { recursive: true });
fs.writeFileSync(path.join(wealthDir, 'health', 'page.tsx'), healthCode);

// 5. AI Terminal Page
const aiTerminalCode = `"use client"
import { useState, useEffect } from 'react'
import LiveStatus from '@/components/LiveStatus'
import LiveMetrics from '@/components/LiveMetrics'
import LiveHUD from '@/components/LiveHUD'

export default function AiTerminalPage() {
  const [agents, setAgents] = useState(null)
  
  useEffect(() => {
    fetch("/api/bot/agents").then(r => r.json()).then(data => setAgents(data)).catch(console.error)
  }, [])

  return (
    ${aiMain}
  )
}
`;
fs.mkdirSync(path.join(wealthDir, 'ai-terminal'), { recursive: true });
fs.writeFileSync(path.join(wealthDir, 'ai-terminal', 'page.tsx'), aiTerminalCode);

console.log("Generated all 4 pages successfully.");
