import stockData from '@/data/stock-discovery.json';
import WealthNavbar from '@/components/WealthNavbar';
import StockDiscovery from './stock-discovery';
export const metadata={title:'Stock Discovery | Wealth OS',description:'Rank and explore stocks in the BRAIN research library.'};
export default function StocksPage(){return <div className="stock-page-shell"><WealthNavbar/><StockDiscovery stocks={stockData.stocks} generatedAt={stockData.generatedAt}/></div>}