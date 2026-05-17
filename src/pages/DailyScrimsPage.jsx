import React from 'react';
import { Clock, MessageCircle } from 'lucide-react';

const PRIZE_DISTRIBUTION = [
  { rank: '1ST PLACE',   amount: '2,100 PKR', label: 'Champion'   },
  { rank: '2ND PLACE',   amount: '1,000 PKR', label: 'Runner-Up'  },
  { rank: '3RD PLACE',   amount: '700 PKR',   label: 'Top 3'      },
  { rank: '4TH & 5TH',  amount: 'Retention', label: 'Top 5'      },
  { rank: 'PER CHICKEN', amount: '150 PKR',   label: 'WWCD Bonus' },
];

const SESSIONS = [
  { id: 's1', name: 'SESSION 01', tag: 'EVENING',    time: '8:00',  ampm: 'PM', maps: ['Erangel', 'Miramar', 'Erangel', 'Rondo'] },
  { id: 's2', name: 'SESSION 02', tag: 'NIGHT',      time: '10:30', ampm: 'PM', maps: ['Erangel', 'Miramar', 'Erangel', 'Rondo'] },
  { id: 's3', name: 'SESSION 03', tag: 'LATE NIGHT', time: '12:45', ampm: 'AM', maps: ['Erangel', 'Miramar', 'Erangel', 'Rondo'] },
];

const ADMINS = [
  { name: 'ADMIN 01', phone: '03390715753', wa: '923390715753' },
  { name: 'ADMIN 02', phone: '03140679418', wa: '923140679418' },
  { name: 'ADMIN 03', phone: '923715902051', wa: '923715902051' },
];

const MAPS = ['Erangel', 'Miramar', 'Erangel', 'Rondo'];

export default function DailyScrimsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">

      {/* ══════════════════════════════════════
          PAGE HERO — with image background
          ══════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-end border-b border-white/[0.07] overflow-hidden">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image-3.webp"
            alt=""
            className="w-full h-full object-cover object-center scale-105"
            style={{ filter: 'saturate(0.5) contrast(1.05)' }}
          />
          {/* Heavy bottom fade so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-[#0a0a0a]/30" />
          {/* Left fade for text column */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/50 to-transparent" />
        </div>

        {/* Gold atmospheric glow */}
        <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-[#dbb462]/[0.07] blur-[150px] pointer-events-none z-[1]" />

        {/* Content */}
        <div className="container mx-auto max-w-7xl px-6 lg:px-16 pt-36 pb-16 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">

            {/* Left — headline */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-[2px] bg-[#dbb462]" />
                <span className="font-teko text-[13px] tracking-[0.3em] text-[#dbb462] uppercase">
                  Zenith Esports · Daily Format
                </span>
              </div>

              <h1 className="font-bebas uppercase leading-[0.85] tracking-tight select-none">
                <span className="block text-[clamp(5rem,13vw,10rem)] text-[#f2f2f2] leading-none">DAILY</span>
                <span className="block text-[clamp(5rem,13vw,10rem)] zenith-gradient-text leading-none">SCRIMS</span>
              </h1>

              <p className="font-teko text-[#d1c5b3] text-[18px] opacity-65 max-w-lg mt-6 tracking-[0.08em] leading-relaxed uppercase">
                No days off. Drop into Pakistan’s fiercest daily arena
                 across four iconic maps and turn your grind into real cash.
              </p>
            </div>

            {/* Right — key numbers */}
            <div className="lg:col-span-5 flex flex-col gap-[1px] bg-white/[0.07]">
              <div className="bg-[#111]/90 backdrop-blur-sm px-8 py-6 hover:bg-[#161616] transition-colors">
                <p className="font-teko text-[11px] tracking-[0.3em] text-[#d1c5b3] opacity-55 uppercase mb-2">
                  Total Prize Pool
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bebas text-[3.5rem] zenith-gradient-text leading-none">5,000</span>
                  <span className="font-teko text-lg text-[#dbb462] opacity-70 tracking-widest">PKR</span>
                </div>
              </div>

              <div className="bg-[#111]/90 backdrop-blur-sm px-8 py-6 hover:bg-[#161616] transition-colors">
                <p className="font-teko text-[11px] tracking-[0.3em] text-[#d1c5b3] opacity-55 uppercase mb-2">
                  Entry Fee
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bebas text-[3.5rem] text-[#f2f2f2] leading-none">300</span>
                  <span className="font-teko text-lg text-white/50 tracking-widest">PKR / SQUAD</span>
                </div>
              </div>

              <div className="bg-[#111]/90 backdrop-blur-sm px-8 py-6 hover:bg-[#161616] transition-colors">
                <p className="font-teko text-[11px] tracking-[0.3em] text-[#d1c5b3] opacity-55 uppercase mb-2">
                  Format
                </p>
                <span className="font-bebas text-[1.75rem] text-[#f2f2f2] leading-none tracking-wider">
                  3 SESSIONS · 4 MATCHES EACH
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SCRIM SESSIONS
          ══════════════════════════════════════ */}
      <section className="border-b border-white/[0.07] relative z-10">
        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-24">
          <SectionHeader label="Scrim Sessions" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.07]">
            {SESSIONS.map((s, i) => (
              <div
                key={s.id}
                className="bg-[#111] p-8 lg:p-10 relative group overflow-hidden hover:bg-[#161616] transition-colors"
              >
                {/* Slide-in top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] zenith-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                {/* Watermark index */}
                <span className="absolute -bottom-5 -right-2 font-bebas text-[8rem] text-white/[0.04] leading-none pointer-events-none select-none">
                  0{i + 1}
                </span>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-teko text-[11px] tracking-[0.3em] text-[#d1c5b3] opacity-55 uppercase">
                      {s.tag}
                    </span>
                    <Clock
                      size={15}
                      className="text-white/25 group-hover:text-[#dbb462]/70 transition-colors"
                    />
                  </div>

                  <div className="mb-8">
                    <span className="font-teko text-[11px] tracking-[0.25em] text-[#d1c5b3] opacity-45 uppercase block mb-1">
                      {s.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bebas text-[4.25rem] text-[#f2f2f2] leading-none">
                        {s.time}
                      </span>
                      <span className="font-teko text-xl text-white/50 tracking-widest">
                        {s.ampm}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.08] pt-6 space-y-2.5">
                    {s.maps.map((map, mi) => (
                      <div key={mi} className="flex items-center gap-4">
                        <span className="font-teko text-[10px] tracking-[0.25em] text-[#d1c5b3] opacity-45 uppercase w-10">
                          M{mi + 1}
                        </span>
                        <span className="font-bebas text-[1.2rem] text-[#f2f2f2] tracking-widest">
                          {map}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          MAP ROTATION + PRIZE POOL
          ══════════════════════════════════════ */}
      <section className="border-b border-white/[0.07] relative z-10">
        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">

            {/* Map Rotation */}
            <div>
              <SectionHeader label="Map Rotation" />

              <div className="grid grid-cols-2 gap-[1px] bg-white/[0.07]">
                {MAPS.map((map, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111] px-7 py-8 group relative overflow-hidden hover:bg-[#161616] transition-colors"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[1px] zenith-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    <span className="font-teko text-[10px] tracking-[0.25em] text-[#d1c5b3] opacity-45 uppercase block mb-3">
                      MATCH 0{idx + 1}
                    </span>
                    <span className="font-bebas text-3xl text-[#f2f2f2] tracking-wider block">
                      {map}
                    </span>
                    <span className="absolute -bottom-4 -right-1 font-bebas text-[5rem] text-white/[0.04] leading-none pointer-events-none select-none">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>

              <p className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase mt-5">
                Each session features the same 4-map lineup.
              </p>
            </div>

            {/* Prize Distribution */}
            <div>
              <SectionHeader label="Prize Pool" />

              <div className="flex flex-col gap-[1px] bg-white/[0.07]">
                {PRIZE_DISTRIBUTION.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111] flex items-center justify-between px-7 py-5 group relative overflow-hidden hover:bg-[#161616] transition-colors"
                  >
                    <div className="absolute bottom-0 left-0 h-[1px] w-0 zenith-gradient group-hover:w-full transition-all duration-500" />

                    <div className="flex items-center gap-5">
                      <span className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase w-6">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-45 uppercase block">
                          {p.label}
                        </span>
                        <span className="font-bebas text-[1.6rem] text-[#f2f2f2] tracking-widest leading-tight">
                          {p.rank}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-bebas text-2xl tracking-wider ${
                        idx === 0 ? 'zenith-gradient-text' : 'text-[#f2f2f2]'
                      }`}
                    >
                      {p.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BOOK A SLOT
          ══════════════════════════════════════ */}
      <section className="relative z-10">
        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 items-start">

            {/* Left copy */}
            <div className="lg:col-span-4">
              <SectionHeader label="Book a Slot" />
              <p className="font-teko text-[18px] text-[#d1c5b3] opacity-60 tracking-[0.07em] leading-relaxed uppercase max-w-xs">
                Contact our official admins on WhatsApp to check availability and secure your squad's slot.
              </p>
              <div className="mt-8 flex items-center gap-3 px-5 py-4 bg-[#111] border border-white/[0.07]">
                <div className="w-2 h-2 bg-emerald-400 flex-shrink-0 animate-pulse" />
                <span className="font-teko text-[11px] tracking-[0.22em] text-[#d1c5b3] opacity-55 uppercase">
                  Available daily · 12 PM – 2 AM PKT
                </span>
              </div>
            </div>

            {/* Admin contact stack */}
            <div className="lg:col-span-8 flex flex-col gap-[1px] bg-white/[0.07]">
              {ADMINS.map((admin, idx) => (
                <a
                  key={idx}
                  href={`https://wa.me/${admin.wa}?text=Hi%2C%20I%20want%20to%20book%20a%20slot%20for%20Daily%20Scrims.`}
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-[#111] flex items-center justify-between px-8 py-7 hover:bg-[#161616] transition-colors relative overflow-hidden"
                >
                  {/* Slide-in top line */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] zenith-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                  <div>
                    <span className="font-teko text-[10px] tracking-[0.3em] text-[#d1c5b3] opacity-50 uppercase block mb-1">
                      {admin.name}
                    </span>
                    <span className="font-bebas text-[2.25rem] text-[#f2f2f2] tracking-widest leading-none">
                      {admin.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-teko text-[11px] tracking-[0.2em] text-[#dbb462] uppercase opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      MESSAGE →
                    </span>
                    <div className="w-11 h-11 flex items-center justify-center border border-white/[0.08] group-hover:border-[#dbb462]/40 group-hover:bg-[#dbb462]/10 transition-all">
                      <MessageCircle
                        size={18}
                        className="text-white/40 group-hover:text-[#dbb462] transition-colors"
                      />
                    </div>
                  </div>
                </a>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Shared section header ── */
function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="w-8 h-[2px] bg-[#dbb462]" />
      <h2 className="font-bebas text-[2.25rem] text-[#f2f2f2] tracking-[0.12em] uppercase leading-none">
        {label}
      </h2>
    </div>
  );
}
