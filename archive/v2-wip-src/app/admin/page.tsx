import { Users, Trophy, DollarSign, Activity } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">System Overview</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-ze-neutral-500 text-xs font-mono uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-3xl font-heading font-bold text-white">1,204</h3>
            </div>
            <div className="p-2 bg-ze-neutral-950 rounded-lg">
              <Users className="w-5 h-5 text-ze-gold-500" />
            </div>
          </div>
          <p className="text-xs text-green-400 font-medium">+12% from last month</p>
        </div>

        <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-ze-neutral-500 text-xs font-mono uppercase tracking-wider mb-1">Active Tournaments</p>
              <h3 className="text-3xl font-heading font-bold text-white">3</h3>
            </div>
            <div className="p-2 bg-ze-neutral-950 rounded-lg">
              <Trophy className="w-5 h-5 text-ze-gold-500" />
            </div>
          </div>
          <p className="text-xs text-ze-neutral-500 font-medium">1 in registration phase</p>
        </div>

        <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-ze-neutral-500 text-xs font-mono uppercase tracking-wider mb-1">Pending Verifications</p>
              <h3 className="text-3xl font-heading font-bold text-white">18</h3>
            </div>
            <div className="p-2 bg-ze-neutral-950 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-red-400 font-medium">Requires immediate attention</p>
        </div>

        <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-ze-neutral-500 text-xs font-mono uppercase tracking-wider mb-1">System Health</p>
              <h3 className="text-3xl font-heading font-bold text-white">100%</h3>
            </div>
            <div className="p-2 bg-ze-neutral-950 rounded-lg">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <p className="text-xs text-ze-neutral-500 font-medium">All services operational</p>
        </div>
      </div>

      {/* Recent Activity Table Placeholder */}
      <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-6 mt-8">
        <h2 className="text-lg font-heading font-bold text-white mb-6 uppercase tracking-wider">Recent Registrations</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ze-neutral-800 text-xs uppercase font-mono text-ze-neutral-500">
                <th className="py-3 px-4 font-normal">Team</th>
                <th className="py-3 px-4 font-normal">Tournament</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-sm text-white font-medium">Team Falcons</td>
                <td className="py-3 px-4 text-sm text-ze-neutral-300">PUBGM Pro League</td>
                <td className="py-3 px-4 text-sm"><span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs">Unpaid</span></td>
                <td className="py-3 px-4 text-sm text-ze-neutral-500 text-right">5m ago</td>
              </tr>
              <tr className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                <td className="py-3 px-4 text-sm text-white font-medium">Sentinels</td>
                <td className="py-3 px-4 text-sm text-ze-neutral-300">Valorant Invitational</td>
                <td className="py-3 px-4 text-sm"><span className="text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-xs">Verified</span></td>
                <td className="py-3 px-4 text-sm text-ze-neutral-500 text-right">2h ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
