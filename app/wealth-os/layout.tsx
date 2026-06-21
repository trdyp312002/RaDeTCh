import './styles.css';
import WealthMobileNav from '@/components/WealthMobileNav';

export default function WealthOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wealth-os-root">
      <WealthMobileNav />
      <div className="wealth-os-content">
        {children}
      </div>
    </div>
  );
}
