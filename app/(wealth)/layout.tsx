export default function WealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-w-0 pt-16 md:pt-0 md:pl-64">
      {children}
    </div>
  );
}
