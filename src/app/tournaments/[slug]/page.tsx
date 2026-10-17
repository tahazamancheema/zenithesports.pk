import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Users, AlertCircle, Info, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data fetcher
async function getTournamentBySlug(slug: string) {
  const tournaments = [
    {
      id: "1",
      slug: "zenith-valorant-invitational-2026",
      title: "Zenith Valorant Invitational",
      game: "valorant",
      status: "registration",
      startDate: "2026-10-15T00:00:00Z",
      endDate: "2026-10-25T00:00:00Z",
      prizePool: "PKR 500,000",
      entryFee: 0,
      maxTeams: 32,
      registeredTeams: 28,
      bannerUrl: "/assets/games/valorant-bg.jpg",
      rulesUrl: "/rules/valorant.pdf",
      description: "The premier Valorant tournament in Pakistan. Gather your squad and compete against the best teams in the country for a massive prize pool and ultimate bragging rights.",
      format: "Single Elimination BO3. Grand Final BO5.",
    }
  ];

  return tournaments.find(t => t.slug === slug) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tournament = await getTournamentBySlug(resolvedParams.slug);
  
  if (!tournament) return { title: "Tournament Not Found" };
  
  return {
    title: tournament.title,
    description: tournament.description,
  };
}

export default async function TournamentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tournament = await getTournamentBySlug(resolvedParams.slug);

  if (!tournament) {
    notFound();
  }

  const isRegistrationOpen = tournament.status === "registration" && tournament.registeredTeams < tournament.maxTeams;

  return (
    <main className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full bg-ze-neutral-950 flex items-end">
        {tournament.bannerUrl && (
          <img 
            src={tournament.bannerUrl} 
            alt={tournament.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ze-neutral-950 via-ze-neutral-950/80 to-transparent" />
        
        <div className="container relative mx-auto px-4 pb-12 z-10">
          <Badge variant={tournament.game as any} className="mb-4 uppercase tracking-widest">
            {tournament.game.replace("_", " ")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
            {tournament.title}
          </h1>
          <p className="text-xl text-ze-neutral-300 max-w-2xl">
            {tournament.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-ze-neutral-900/50 border border-ze-neutral-800 rounded-xl p-8">
              <h2 className="text-2xl font-heading font-bold text-white mb-6 flex items-center">
                <Info className="w-6 h-6 mr-3 text-ze-gold-500" />
                Tournament Details
              </h2>
              <div className="space-y-4 text-ze-neutral-300">
                <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-ze-neutral-800">
                  <span className="text-ze-neutral-500 w-48 font-mono text-sm uppercase">Format</span>
                  <span className="text-white font-medium">{tournament.format}</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-ze-neutral-800">
                  <span className="text-ze-neutral-500 w-48 font-mono text-sm uppercase">Schedule</span>
                  <span className="text-white font-medium">
                    {format(new Date(tournament.startDate), "MMM d")} - {format(new Date(tournament.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center py-3 border-b border-ze-neutral-800">
                  <span className="text-ze-neutral-500 w-48 font-mono text-sm uppercase">Entry Fee</span>
                  <span className="text-white font-medium">
                    {tournament.entryFee === 0 ? (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Free to Enter</Badge>
                    ) : (
                      `PKR ${tournament.entryFee}`
                    )}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center py-3">
                  <span className="text-ze-neutral-500 w-48 font-mono text-sm uppercase">Rulebook</span>
                  <a href={tournament.rulesUrl} target="_blank" rel="noopener noreferrer" className="text-ze-gold-400 hover:text-ze-gold-300 underline flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> View Official Rules
                  </a>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar / Registration Card */}
          <div className="space-y-6">
            <div className="bg-ze-neutral-900 border border-ze-neutral-800 rounded-xl p-6 sticky top-24 shadow-2xl">
              <div className="mb-6 pb-6 border-b border-ze-neutral-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-ze-neutral-400">Prize Pool</span>
                  <Trophy className="w-5 h-5 text-ze-gold-500" />
                </div>
                <div className="text-3xl font-heading font-bold text-ze-gold-400">
                  {tournament.prizePool}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-ze-neutral-400 flex items-center">
                    <Users className="w-4 h-4 mr-2" /> Capacity
                  </span>
                  <span className="text-white font-mono">{tournament.registeredTeams} / {tournament.maxTeams} Teams</span>
                </div>
                
                <div className="w-full h-2 bg-ze-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      tournament.registeredTeams >= tournament.maxTeams ? "bg-red-500" : "bg-ze-gold-500"
                    )}
                    style={{ width: `${Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100)}%` }}
                  />
                </div>
              </div>

              {isRegistrationOpen ? (
                <Link href={`/tournaments/${tournament.slug}/register`} className="block w-full">
                  <Button variant="primary" size="lg" className="w-full font-heading uppercase tracking-wider h-14">
                    Register Your Team
                  </Button>
                </Link>
              ) : (
                <div className="p-4 bg-ze-neutral-800/50 border border-ze-neutral-700 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-ze-neutral-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Registration Closed</h4>
                    <p className="text-sm text-ze-neutral-400 mt-1">
                      {tournament.registeredTeams >= tournament.maxTeams 
                        ? "This tournament has reached maximum capacity."
                        : "Registration for this tournament is currently not open."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
