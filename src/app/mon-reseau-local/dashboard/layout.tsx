"use client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E2D9BC] font-sans text-[#2E130C]">
      <main className="min-h-screen pt-20">
        <div className="container mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
