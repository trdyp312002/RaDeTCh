import HealthSidebar from "@/components/HealthSidebar";
import HealthMobileNav from "@/components/HealthMobileNav";

export default function LifeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#33302C] font-sans flex flex-col md:flex-row">
      <HealthSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <HealthMobileNav />
        <div className="flex-1 w-full pb-24 md:pb-0">
          {children}
        </div>
      </div>
    </div>
  );
}
