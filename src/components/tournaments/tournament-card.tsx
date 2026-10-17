import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TournamentCardProps {
  tournament: {
    slug: string;
    title: string;
    game: string;
    status: "draft" | "registration" | "active" | "completed";
    startDate: string;
    prizePool: string;
    maxTeams: number;
    registeredTeams: number;
    bannerUrl?: string;
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getStatusColor = (status: TournamentCardProps["tournament"]["status"]) => {
    switch (status) {
      case "registration":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "active":
        return "bg-ze-gold-500/10 text-ze-gold-400 border-ze-gold-500/20";
      case "completed":
        return "bg-ze-neutral-500/10 text-ze-neutral-400 border-ze-neutral-500/20";
      default:
        return "bg-ze-neutral-800 text-ze-neutral-400 border-ze-neutral-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "registration":
        return "Registration Open";
      case "active":
        return "Live Now";
      case "completed":
        return "Completed";
      default:
        return "Coming Soon";
    }
  };

  return (
    <Link 
      href={`/tournaments/${tournament.slug}`}
      className="group block relative overflow-hidden rounded-xl border border-ze-neutral-800 bg-ze-neutral-900/50 hover:bg-ze-neutral-900 transition-all duration-300"
    >
      {/* Banner Image Area */}
      <div className="relative h-48 w-full overflow-hidden bg-ze-neutral-950">
        {tournament.bannerUrl ? (
          <img 
            src={tournament.bannerUrl} 
            alt={tournament.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ze-neutral-800 to-ze-neutral-950 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-ze-neutral-700" />
          </div>
        )}
        
        {/* Game Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant={tournament.game as any} className="uppercase font-heading tracking-wider">
            {tournament.game.replace("_", " ")}
          </Badge>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={cn("px-2.5 py-1 text-xs font-mono font-medium rounded-full border backdrop-blur-md", getStatusColor(tournament.status))}>
            {getStatusLabel(tournament.status)}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        <h3 className="text-xl font-heading font-bold text-white mb-4 group-hover:text-ze-gold-400 transition-colors">
          {tournament.title}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center text-sm text-ze-neutral-400">
            <Calendar className="w-4 h-4 mr-2 text-ze-gold-500" />
            {format(new Date(tournament.startDate), "MMM d, yyyy")}
          </div>
          <div className="flex items-center text-sm text-ze-neutral-400">
            <Trophy className="w-4 h-4 mr-2 text-ze-gold-500" />
            {tournament.prizePool}
          </div>
          <div className="flex items-center text-sm text-ze-neutral-400 col-span-2">
            <Users className="w-4 h-4 mr-2 text-ze-gold-500" />
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span>Teams Registered</span>
                <span className="text-white font-mono">{tournament.registeredTeams} / {tournament.maxTeams}</span>
              </div>
              <div className="w-full h-1.5 bg-ze-neutral-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    tournament.registeredTeams >= tournament.maxTeams ? "bg-red-500" : "bg-ze-gold-500"
                  )}
                  style={{ width: `${Math.min(100, (tournament.registeredTeams / tournament.maxTeams) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
