import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import ActivityForm from "./admin/ActivityForm";
import MemberManagement from "./admin/MemberManagement";
import ActivityList from "./admin/ActivityList";
import QRGenerator from "./admin/QRGenerator";
import BodManagement from "./admin/BodManagement";
import { PlusCircle, Users, List, QrCode, LogOut, Home, Crown } from "lucide-react";

const TABS = [
  { id: "new-activity", label: "New Activity", icon: PlusCircle },
  { id: "members", label: "Members", icon: Users },
  { id: "activities", label: "Activity List", icon: List },
  { id: "bod", label: "Board of Directors", icon: Crown },
  { id: "qr", label: "QR Generator", icon: QrCode },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("new-activity");
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <div className="bg-[#002147] text-white px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center font-bold text-[#002147] text-sm">
            LC
          </div>
          <div>
            <div className="font-bold text-sm">Leo Club of KUSMS</div>
            <div className="text-white/50 text-xs">Admin Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <Home size={15} /> Home
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#002147]">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage members, activities, board of directors, and generate certificates.</p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 shadow-sm overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#002147] text-white shadow-sm"
                    : "text-gray-500 hover:text-[#002147] hover:bg-gray-50"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {activeTab === "new-activity" && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#002147]">Add New Activity</h2>
                <p className="text-sm text-gray-500 mt-1">Record a new service activity and tag participating members.</p>
              </div>
              <ActivityForm onSuccess={() => setActivityRefreshKey((k) => k + 1)} />
            </div>
          )}
          {activeTab === "members" && <MemberManagement />}
          {activeTab === "activities" && (
            <ActivityList
              refreshKey={activityRefreshKey}
              onActivityUpdated={() => setActivityRefreshKey((k) => k + 1)}
            />
          )}
          {activeTab === "bod" && <BodManagement />}
          {activeTab === "qr" && <QRGenerator />}
        </div>
      </div>
    </div>
  );
}
