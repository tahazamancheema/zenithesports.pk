"use client";

import { useState } from "react";
import { Plus, Settings, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MOCK_TOURNAMENTS = [
  {
    id: "1",
    slug: "zenith-valorant-invitational-2026",
    title: "Zenith Valorant Invitational",
    game: "valorant",
    status: "registration",
    startDate: "2026-10-15T00:00:00Z",
    registeredTeams: 28,
    maxTeams: 32,
  },
  {
    id: "2",
    slug: "pubgm-pro-league-s4",
    title: "PUBG Mobile Pro League - S4",
    game: "pubg_mobile",
    status: "active",
    startDate: "2026-09-01T00:00:00Z",
    registeredTeams: 64,
    maxTeams: 64,
  },
  {
    id: "3",
    slug: "freefire-clash-championship",
    title: "Free Fire Clash Championship",
    game: "free_fire",
    status: "draft",
    startDate: "2026-11-20T00:00:00Z",
    registeredTeams: 0,
    maxTeams: 48,
  }
];

export default function AdminTournamentsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">Tournament Operations</h1>
          <p className="text-sm text-ze-neutral-400">Manage brackets, settings, and lifecycle of events.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-ze-neutral-950 border-b border-ze-neutral-800 text-xs uppercase font-mono text-ze-neutral-500">
                <th className="py-4 px-6 font-medium">Tournament</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Capacity</th>
                <th className="py-4 px-6 font-medium">Start Date</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TOURNAMENTS.map((t) => (
                <tr key={t.id} className="border-b border-ze-neutral-800/50 hover:bg-ze-neutral-800/20 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Badge variant={t.game as any} className="uppercase text-[10px] hidden sm:inline-flex">{t.game.replace("_", " ")}</Badge>
                      <span className="text-sm text-white font-medium">{t.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {t.status === 'registration' && <span className="text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Registration</span>}
                    {t.status === 'active' && <span className="text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Active</span>}
                    {t.status === 'draft' && <span className="text-ze-neutral-400 bg-ze-neutral-400/10 px-2.5 py-1 rounded-full text-xs font-medium">Draft</span>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-ze-neutral-300">
                      <Users className="w-4 h-4 mr-2 text-ze-neutral-500" />
                      {t.registeredTeams} / {t.maxTeams}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-ze-neutral-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-ze-neutral-500" />
                      {new Date(t.startDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-ze-neutral-300 hover:text-white bg-ze-neutral-800/50 hover:bg-ze-neutral-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
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
