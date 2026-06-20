import './styles.css';

export default function WealthOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wealth-os-root">
      {children}
    </div>
  );
}
