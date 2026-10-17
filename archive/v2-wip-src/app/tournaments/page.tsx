import { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Browse upcoming and live esports tournaments by Zenith Esports.",
};

// Mock function - to be replaced with Supabase query in M3 when DB is connected
async function getTournaments() {
  return [
    {
      id: "1",
      slug: "zenith-valorant-invitational-2026",
      title: "Zenith Valorant Invitational",
      game: "valorant",
      status: "registration" as const,
      startDate: "2026-10-15T00:00:00Z",
      prizePool: "PKR 500,000",
      maxTeams: 32,
      registeredTeams: 28,
      bannerUrl: "/assets/games/valorant-bg.jpg",
    },
    {
      id: "2",
      slug: "pubgm-pro-league-s4",
      title: "PUBG Mobile Pro League - S4",
      game: "pubg_mobile",
      status: "active" as const,
      startDate: "2026-09-01T00:00:00Z",
      prizePool: "PKR 1,000,000",
      maxTeams: 64,
      registeredTeams: 64,
      bannerUrl: "/assets/games/pubgm-bg.jpg",
    },
    {
      id: "3",
      slug: "freefire-clash-championship",
      title: "Free Fire Clash Championship",
      game: "free_fire",
      status: "draft" as const,
      startDate: "2026-11-20T00:00:00Z",
      prizePool: "PKR 250,000",
      maxTeams: 48,
      registeredTeams: 0,
    }
  ];
}

export default async function TournamentsPage() {
  const tournaments = await getTournaments();

  return (
    <main className="min-h-screen pb-24">
      <PageHeader 
        title="TOURNAMENTS" 
        subtitle="Where legends are forged. Register your team and compete for glory."
      />

      <section className="container mx-auto px-4 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {/* Filter Tabs - Mock UI for now */}
            <button className="px-4 py-2 bg-ze-gold-500 text-ze-neutral-950 font-heading font-bold uppercase rounded-md text-sm whitespace-nowrap">
              All Games
            </button>
            <button className="px-4 py-2 bg-ze-neutral-900 border border-ze-neutral-800 text-ze-neutral-400 hover:text-white font-heading font-bold uppercase rounded-md text-sm transition-colors whitespace-nowrap">
              Valorant
            </button>
            <button className="px-4 py-2 bg-ze-neutral-900 border border-ze-neutral-800 text-ze-neutral-400 hover:text-white font-heading font-bold uppercase rounded-md text-sm transition-colors whitespace-nowrap">
              PUBG Mobile
            </button>
            <button className="px-4 py-2 bg-ze-neutral-900 border border-ze-neutral-800 text-ze-neutral-400 hover:text-white font-heading font-bold uppercase rounded-md text-sm transition-colors whitespace-nowrap">
              Free Fire
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <select className="w-full md:w-[180px] bg-ze-neutral-900 border-ze-neutral-800 text-white rounded-md text-sm h-10 px-3 border outline-none focus:border-ze-gold-500">
               <option>All Statuses</option>
               <option>Registration Open</option>
               <option>Live Now</option>
               <option>Upcoming</option>
               <option>Completed</option>
             </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>
    </main>
  );
}
