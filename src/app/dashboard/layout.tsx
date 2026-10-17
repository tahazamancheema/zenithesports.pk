import { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Users, Trophy, Settings, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your Zenith Esports profile, teams, and tournament registrations.",
};

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Teams", href: "/dashboard/teams", icon: Users },
  { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen pb-24">
      <PageHeader 
        title="DASHBOARD" 
        subtitle="Manage your esports career. Track registrations, rosters, and statistics."
      />

      <div className="container mx-auto px-4 mt-12 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 hide-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-ze-neutral-900 text-ze-neutral-400 hover:text-white whitespace-nowrap"
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="hidden md:block mt-8 p-4 bg-ze-gold-500/10 border border-ze-gold-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-ze-gold-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white text-sm font-semibold">Account Status</h4>
                <p className="text-ze-neutral-400 text-xs mt-1">
                  Your profile is fully verified and ready for competitive play.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}
