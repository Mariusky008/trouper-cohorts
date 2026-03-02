import { CMTracker } from "@/components/cm/cm-tracker";

export default function CMDashboardPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <CMTracker />
      </div>
    </div>
  );
}
