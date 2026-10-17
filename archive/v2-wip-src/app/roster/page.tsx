import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { MonitorPlay, Video, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Roster",
  description: "Meet the elite players and content creators representing Zenith Esports on the global stage.",
};

const teams = [
  {
    id: "valorant",
    name: "Valorant Pro Roster",
    game: "valorant",
    players: [
      { id: "p1", alias: "Slayer", role: "Duelist", name: "Ahmed Khan" },
      { id: "p2", alias: "Viper", role: "Controller", name: "Ali Raza" },
      { id: "p3", alias: "Ghost", role: "Initiator", name: "Omar Tariq" },
      { id: "p4", alias: "Sentinel", role: "Sentinel", name: "Zain Abbas" },
      { id: "p5", alias: "Breach", role: "Flex", name: "Hassan Ali" },
    ]
  },
  {
    id: "pubgm",
    name: "PUBG Mobile Elite",
    game: "pubgm",
    players: [
      { id: "p6", alias: "Striker", role: "Assaulter", name: "Saad Malik" },
      { id: "p7", alias: "Scope", role: "Sniper", name: "Fahad Shah" },
      { id: "p8", alias: "IGL_Pro", role: "IGL", name: "Bilal Sheikh" },
      { id: "p9", alias: "SupportX", role: "Support", name: "Hamza Khan" },
    ]
  }
];

const creators = [
  { id: "c1", alias: "NinjaPK", platform: "Twitch", followers: "150K", desc: "Variety streamer and former pro." },
  { id: "c2", alias: "AishaPlays", platform: "YouTube", followers: "300K", desc: "Valorant educational content." },
];

export default function RosterPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-20 bg-[var(--color-bg-950)] border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] to-[var(--color-bg-900)]" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Roster" }]} 
            className="mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold mb-6 text-white uppercase tracking-tight">
            The <span className="text-[var(--color-gold-500)]">Vanguard</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            Meet the elite athletes and creators who wear the black and gold.
          </p>
        </div>
      </section>

      {/* Pro Teams */}
      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="space-y-24">
            {teams.map((team) => (
              <div key={team.id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 border-b border-[var(--color-line-800)] pb-6">
                  <h2 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-text-primary)]">
                    {team.name}
                  </h2>
                  <Badge variant={team.game as any} className="w-fit text-sm px-3 py-1 uppercase tracking-wider">
                    {team.game === "pubgm" ? "PUBG Mobile" : team.game}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {team.players.map((player) => (
                    <Card key={player.id} className="bg-[var(--color-bg-800)] border-[var(--color-line-700)] overflow-hidden group">
                      {/* Player Image Placeholder */}
                      <div className="aspect-[3/4] bg-[var(--color-bg-950)] relative flex items-center justify-center overflow-hidden border-b border-[var(--color-line-800)]">
                        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
                        <span className="text-6xl font-[family-name:var(--font-display)] font-bold text-[var(--color-bg-800)] group-hover:scale-110 transition-transform duration-500">
                          {player.alias.substring(0, 2).toUpperCase()}
                        </span>
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-800)] to-transparent opacity-60" />
                      </div>
                      
                      <CardContent className="p-5 text-center relative z-10 -mt-8 bg-gradient-to-t from-[var(--color-bg-800)] via-[var(--color-bg-800)] to-transparent pt-8">
                        <h3 className="text-2xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-gold-500)] mb-1">
                          {player.alias}
                        </h3>
                        <p className="text-[var(--color-text-primary)] font-medium text-sm mb-3">{player.name}</p>
                        <Badge variant="default" className="bg-[var(--color-bg-900)] text-[var(--color-text-muted)] border-[var(--color-line-700)] text-xs uppercase tracking-widest">
                          {player.role}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Creators */}
      <section className="py-20 bg-[var(--color-bg-950)] border-t border-[var(--color-line-800)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 border-b border-[var(--color-line-800)] pb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)] mb-2">
              Beyond the Arena
            </h2>
            <h3 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-text-primary)]">
              Content Creators
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {creators.map((creator) => (
              <div key={creator.id} className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-[var(--radius-lg)] bg-[var(--color-bg-900)] border border-[var(--color-line-800)] hover:border-[var(--color-gold-600)] transition-colors">
                <Avatar alt={creator.alias} fallback={creator.alias.substring(0, 2)} size="xl" className="ring-2 ring-[var(--color-gold-500)] shrink-0" />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="text-2xl font-[family-name:var(--font-heading)] font-bold uppercase text-[var(--color-gold-500)]">
                      {creator.alias}
                    </h3>
                    <div className="flex items-center gap-3 justify-center sm:justify-start text-[var(--color-text-muted)]">
                      {creator.platform === "Twitch" ? <MonitorPlay className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                      <span className="text-sm font-semibold">{creator.followers}</span>
                    </div>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-4">
                    {creator.desc}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <a href="#" className="p-2 rounded-full bg-[var(--color-bg-800)] text-[var(--color-text-faint)] hover:text-[var(--color-gold-400)] transition-colors">
                      <MessageSquare className="h-4 w-4" />
                    </a>
                    <a href="#" className="p-2 rounded-full bg-[var(--color-bg-800)] text-[var(--color-text-faint)] hover:text-[var(--color-gold-400)] transition-colors">
                      <Video className="h-4 w-4" />
                    </a>
                    <a href="#" className="p-2 rounded-full bg-[var(--color-bg-800)] text-[var(--color-text-faint)] hover:text-[var(--color-gold-400)] transition-colors">
                      <MonitorPlay className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
