import { Trophy, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Section */}
      <div className="bg-ze-neutral-900/50 border border-ze-neutral-800 rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-ze-neutral-800 border-2 border-ze-gold-500 flex items-center justify-center text-2xl font-heading font-bold text-ze-neutral-500 overflow-hidden">
             {/* Fallback to generic avatar */}
             ZE
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-white mb-1">Welcome back, Player</h1>
            <p className="text-ze-neutral-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        
        <Link href="/tournaments">
          <Button variant="primary">Explore Tournaments</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-ze-neutral-950 border border-ze-neutral-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-ze-neutral-400 font-medium text-sm">Active Registrations</h3>
            <Trophy className="w-5 h-5 text-ze-gold-500" />
          </div>
          <p className="text-3xl font-heading font-bold text-white">1</p>
        </div>
        
        <div className="bg-ze-neutral-950 border border-ze-neutral-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-ze-neutral-400 font-medium text-sm">Teams Managed</h3>
            <Users className="w-5 h-5 text-ze-gold-500" />
          </div>
          <p className="text-3xl font-heading font-bold text-white">1</p>
        </div>
        
        <div className="bg-ze-neutral-950 border border-ze-neutral-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-ze-neutral-400 font-medium text-sm">Action Items</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-heading font-bold text-white">0</p>
        </div>
      </div>

      {/* Recent Activity / Active Registrations */}
      <div className="bg-ze-neutral-950 border border-ze-neutral-800 rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-heading font-bold text-white mb-6 uppercase tracking-wider">Current Registrations</h2>
        
        {/* Mock Registration Card */}
        <div className="border border-ze-neutral-800 rounded-lg p-5 bg-ze-neutral-900/50 hover:bg-ze-neutral-900 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Badge variant="valorant" className="mb-2 uppercase text-[10px]">Valorant</Badge>
              <h3 className="text-lg font-heading font-bold text-white">Zenith Valorant Invitational</h3>
              <p className="text-sm text-ze-neutral-400 mt-1">Playing as: <span className="text-ze-gold-400">Sentinels</span></p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-green-400">Approved</p>
                <p className="text-xs text-ze-neutral-500 mt-0.5">Paid & Verified</p>
              </div>
              <Link href="/dashboard/tournaments">
                <Button variant="ghost" size="sm" className="text-ze-neutral-300">View Details</Button>
              </Link>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
