import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Video, MonitorPlay, Mic2, Server } from "lucide-react";

export const metadata: Metadata = {
  title: "Mark47 Production",
  description: "Industry-leading broadcast production, bespoke graphics packages, and comprehensive tournament management by Zenith Esports.",
};

const services = [
  {
    title: "Live Broadcasting",
    desc: "End-to-end tournament broadcasting with multi-cam setups, live switching, and instant replays. We deliver TV-quality streams to Twitch, YouTube, and Facebook Gaming.",
    icon: Video,
  },
  {
    title: "Observer / In-Game Direction",
    desc: "Expert in-game observers for Valorant, PUBG Mobile, and Free Fire who never miss the critical frags or tactical rotations.",
    icon: MonitorPlay,
  },
  {
    title: "Casting & Talent",
    desc: "Access to a premier roster of shoutcasters, color commentators, and desk hosts who bring the hype and deep analytical knowledge.",
    icon: Mic2,
  },
  {
    title: "Tournament Operations",
    desc: "Complete white-label tournament management. From registration and bracket generation to rule enforcement and prize distribution.",
    icon: Server,
  },
];

export default function Mark47Page() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Mark47 Specific Header (Darker, cinematic) */}
      <section className="pt-24 pb-12 md:pt-40 md:pb-32 border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/assets/mark47-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity grayscale" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Mark47 Production" }]} 
            className="mb-8"
          />
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-16 bg-[var(--color-gold-500)]" />
            <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold-500)]">
              Zenith Esports In-House Production
            </span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-[family-name:var(--font-display)] font-bold mb-8 uppercase tracking-tight leading-none">
            Mark<span className="text-[var(--color-gold-500)]">47</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-300 max-w-3xl font-[family-name:var(--font-body)] leading-relaxed mb-10">
            We don't just stream games. We craft narratives, build hype, and deliver industry-leading broadcasts that set the standard in South Asia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8" iconLeft={<PlayCircle className="h-5 w-5" />}>
              Play Showreel
            </Button>
            <a href="mailto:production@zenithesports.pk">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto h-14 px-8 border-white/20 hover:bg-white/10">
                Request a Quote
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-heading)] font-bold uppercase mb-6">
              Our <span className="text-[var(--color-gold-500)]">Services</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Whether you need a fully white-labeled tournament execution or just an expert observer team to plug into your existing broadcast, Mark47 delivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="bg-[#111] border-white/5 hover:border-[var(--color-gold-600)] transition-colors">
                  <CardContent className="p-8">
                    <div className="p-4 bg-black rounded-lg w-fit mb-6 border border-white/10">
                      <Icon className="h-8 w-8 text-[var(--color-gold-500)]" />
                    </div>
                    <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] uppercase text-white mb-4">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {service.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats/Showcase Strip */}
      <section className="py-20 bg-black border-y border-white/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] text-white mb-2">5M+</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)]">Hours Watched</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] text-white mb-2">4K</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)]">Broadcast Quality</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] text-white mb-2">12+</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)]">LAN Events Produced</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-display)] text-white mb-2">0</div>
              <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)]">Broadcast Interruptions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio / Case Studies Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-heading)] font-bold uppercase mb-6">
              Our <span className="text-[var(--color-gold-500)]">Work</span>
            </h2>
            <p className="text-gray-400 text-lg">
              A selection of our most ambitious and technically complex broadcasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="group relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-[var(--color-gold-500)] transition-colors">
                <div className="absolute inset-0 bg-ze-neutral-900" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[var(--color-gold-500)] text-xs font-bold uppercase tracking-widest mb-2 block">LAN Event</span>
                  <h3 className="text-white text-xl font-bold font-[family-name:var(--font-heading)] uppercase mb-2">PMPL South Asia Finals</h3>
                  <p className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    Full scale production featuring AR stage integration and 12-camera live switching.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form Section */}
      <section className="py-24 bg-black relative border-t border-white/10">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold-500)]/5 blur-[80px] pointer-events-none" />
            
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] font-bold uppercase mb-4 text-white">
                Start Your Production
              </h2>
              <p className="text-gray-400">
                Submit an enquiry and our production team will get back to you within 24 hours.
              </p>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Name</label>
                  <input type="text" className="w-full h-12 bg-black border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-[var(--color-gold-500)] transition-colors" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Company / Organization</label>
                  <input type="text" className="w-full h-12 bg-black border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-[var(--color-gold-500)] transition-colors" placeholder="Acme Esports" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Email Address</label>
                <input type="email" className="w-full h-12 bg-black border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-[var(--color-gold-500)] transition-colors" placeholder="john@example.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Project Details</label>
                <textarea className="w-full h-32 bg-black border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-[var(--color-gold-500)] transition-colors resize-none" placeholder="Describe your event, required services, and dates..." />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Attachments (Optional RFP/Brief)</label>
                <div className="w-full h-24 border-2 border-dashed border-white/10 hover:border-[var(--color-gold-500)] rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-black">
                  <span className="text-sm text-gray-500">Drag & drop files or click to browse</span>
                </div>
              </div>

              <Button variant="primary" size="lg" className="w-full h-14 font-[family-name:var(--font-heading)] uppercase tracking-wider">
                Submit Enquiry
              </Button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
