export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1c]">
      {children}
    </div>
  );
}
