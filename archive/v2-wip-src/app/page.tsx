import { Hero, GameSelector, StatsRow, LiveTournaments, Mark47Teaser } from "@/components/home";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <GameSelector />
      <StatsRow />
      <LiveTournaments />
      <Mark47Teaser />
    </div>
  );
}
