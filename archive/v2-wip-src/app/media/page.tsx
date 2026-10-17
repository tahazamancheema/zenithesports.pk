import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, Image as ImageIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Media & Galleries",
  description: "Explore the Zenith Esports visual archives. Event photography, tournament highlights, and behind-the-scenes content.",
};

const mediaItems = [
  {
    id: "v1",
    type: "video",
    title: "Zenith Cup S3 Grand Finals Highlights",
    category: "Tournament",
    date: "August 2025",
    thumbnail: "/assets/media-thumb-1.jpg",
  },
  {
    id: "v2",
    type: "video",
    title: "Forged in Obsidian: Documentary",
    category: "Behind the Scenes",
    date: "June 2025",
    thumbnail: "/assets/media-thumb-2.jpg",
  },
  {
    id: "p1",
    type: "photo",
    title: "PUBGM Invitational LAN Event",
    category: "Gallery (24 Photos)",
    date: "October 2025",
    thumbnail: "/assets/media-thumb-3.jpg",
  },
  {
    id: "p2",
    type: "photo",
    title: "Valorant Roster Bootcamp",
    category: "Gallery (12 Photos)",
    date: "July 2025",
    thumbnail: "/assets/media-thumb-4.jpg",
  },
  {
    id: "v3",
    type: "video",
    title: "Top 10 Plays of the Month",
    category: "Highlight Reel",
    date: "November 2025",
    thumbnail: "/assets/media-thumb-5.jpg",
  },
  {
    id: "p3",
    type: "photo",
    title: "Mark47 Production Setup",
    category: "Gallery (8 Photos)",
    date: "September 2025",
    thumbnail: "/assets/media-thumb-6.jpg",
  },
];

export default function MediaPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-20 bg-[var(--color-bg-950)] border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] to-[var(--color-bg-900)]" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Media" }]} 
            className="mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold mb-6 text-white uppercase tracking-tight">
            The <span className="text-[var(--color-gold-500)]">Archives</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            Relive the greatest moments in Zenith Esports history. Tournaments, highlights, and behind-the-scenes.
          </p>
        </div>
      </section>

      {/* Media Grid */}
      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mediaItems.map((item) => (
              <Card key={item.id} hover className="bg-[var(--color-bg-800)] border-[var(--color-line-700)] overflow-hidden group cursor-pointer">
                {/* Thumbnail Placeholder */}
                <div className="aspect-video bg-[var(--color-bg-950)] relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
                  
                  {/* Media Icon overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    {item.type === "video" ? (
                      <PlayCircle className="h-16 w-16 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                    )}
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-500)]">
                      {item.category}
                    </span>
                    <span className="text-xs text-[var(--color-text-faint)] whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-[family-name:var(--font-heading)] uppercase text-[var(--color-text-primary)] group-hover:text-[var(--color-gold-400)] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            {/* Simple placeholder for pagination or load more */}
            <button className="px-8 py-3 rounded-md border border-[var(--color-line-700)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-800)] hover:text-[var(--color-gold-400)] transition-colors">
              Load More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
