import { Metadata } from "next";
import Link from "next/link";
import { 
  LayoutDashboard, Trophy, Users, ShieldAlert, CreditCard, 
  Settings, LogOut, Search, Activity, Mail
} from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Admin Control Panel",
  description: "Zenith Esports central management.",
};

const adminNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Tournaments", href: "/admin/tournaments", icon: Trophy },
  { name: "Registrations", href: "/admin/registrations", icon: ShieldAlert },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Teams & Users", href: "/admin/users", icon: Users },
  { name: "Enquiries", href: "/admin/enquiries", icon: Mail },
  { name: "Audit Log", href: "/admin/audit", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ze-neutral-950 flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-ze-neutral-900 border-r border-ze-neutral-800 flex flex-col shrink-0 sticky top-0 md:h-screen z-40">
        <div className="p-6 border-b border-ze-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-ze-gold-500 rounded flex items-center justify-center font-heading font-bold text-ze-neutral-950">
            Z
          </div>
          <div>
            <h1 className="font-heading font-bold text-white leading-tight uppercase tracking-wider">Control Panel</h1>
            <p className="text-xs text-ze-neutral-500">v2.0.0</p>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto hide-scrollbar">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-ze-neutral-800 text-ze-neutral-400 hover:text-white whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-ze-neutral-800 hidden md:block">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Admin Topbar */}
        <header className="h-16 bg-ze-neutral-900/50 border-b border-ze-neutral-800 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
          <div className="flex items-center bg-ze-neutral-950 border border-ze-neutral-800 rounded-md px-3 py-1.5 w-64 focus-within:border-ze-gold-500 transition-colors">
            <Search className="w-4 h-4 text-ze-neutral-500 mr-2" />
            <input 
              type="text" 
              placeholder="Search ID, email, or team..." 
              className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-ze-neutral-600"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-ze-gold-500">Superadmin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-ze-neutral-800 border border-ze-neutral-700" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0a0a]">
          {children}
        </div>
      </main>

    </div>
  );
}
