"use client";

import { Search, UserX, Shield, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_USERS = [
  {
    id: "usr_1",
    name: "Taha Cheema",
    ign: "TahaZaman",
    email: "taha@zenithesports.pk",
    role: "admin",
    status: "active",
    joinedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "usr_2",
    name: "Ali Hassan",
    ign: "AliH",
    email: "ali@example.com",
    role: "user",
    status: "active",
    joinedAt: "2025-11-20T00:00:00Z",
  },
  {
    id: "usr_3",
    name: "Zain Ahmed",
    ign: "ZainyBoi",
    email: "zain@example.com",
    role: "user",
    status: "suspended",
    joinedAt: "2026-02-10T00:00:00Z",
  }
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Users & Teams</h1>
          <p className="text-sm text-ze-neutral-400">Manage player accounts, roles, and suspensions.</p>
        </div>
        
        <div className="flex items-center bg-ze-neutral-900 border border-ze-neutral-800 rounded-md px-3 py-1.5 w-full md:w-64 focus-within:border-ze-gold-500 transition-colors">
          <Search className="w-4 h-4 text-ze-neutral-500 mr-2" />
          <input 
            type="text" 
            placeholder="Search players..." 
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-ze-neutral-600"
          />
        </div>
      </div>

      <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ze-neutral-950 border-b border-ze-neutral-800 text-xs uppercase font-mono text-ze-neutral-500">
                <th className="py-4 px-6 font-medium">Player</th>
                <th className="py-4 px-6 font-medium">Contact</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Joined</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map((user) => (
                <tr key={user.id} className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ze-neutral-800 flex items-center justify-center text-xs font-bold text-ze-neutral-400 uppercase">
                        {user.name.substring(0,2)}
                      </div>
                      <div>
                        <div className="text-sm text-white font-medium">{user.ign}</div>
                        <div className="text-xs text-ze-neutral-500">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-300">{user.email}</td>
                  <td className="py-4 px-6 text-sm">
                    {user.role === 'admin' ? (
                      <span className="flex items-center text-ze-gold-400">
                        <Shield className="w-3 h-3 mr-1" /> Admin
                      </span>
                    ) : (
                      <span className="text-ze-neutral-400">Player</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {user.status === 'active' && <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Active</span>}
                    {user.status === 'suspended' && <span className="text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Suspended</span>}
                  </td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-400">
                    {new Date(user.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-ze-neutral-400 hover:text-white">
                        <UserX className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 text-ze-neutral-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
