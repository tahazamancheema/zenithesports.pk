import React from 'react';
import { Megaphone } from 'lucide-react';
import { useSupabaseDB } from '../hooks/useSupabaseDB';

/**
 * AnnouncementsStrip — latest admin-published announcements on the landing
 * page. Renders nothing when there are no active announcements.
 */
export default function AnnouncementsStrip() {
  const { data: announcements } = useSupabaseDB(
    'announcements',
    { field: 'created_at', direction: 'desc' },
    [['is_active', 'eq', true]]
  );

  if (!announcements.length) return null;

  return (
    <section className="relative bg-[#0e0e0e] border-t border-white/[0.04] overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[240px] bg-[#dbb462]/[0.04] blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-14 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-[2px] bg-[#dbb462]" />
          <span className="font-label text-[13px] tracking-[0.3em] text-[#dbb462] uppercase flex items-center gap-2">
            <Megaphone size={13} /> Command Center · Announcements
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[rgba(78,70,56,0.15)]">
          {announcements.slice(0, 3).map((a) => (
            <article
              key={a.id}
              className={`bg-[#131313] p-6 card-hover-glow ${
                a.is_gold ? 'border-l-2 border-[#f9d07a]' : ''
              }`}
            >
              <time className="font-label text-[11px] tracking-[0.25em] text-[#d1c5b3] opacity-40 uppercase block mb-2">
                {new Date(a.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
              <h3 className={`font-display text-2xl tracking-wide leading-tight mb-2 ${a.is_gold ? 'text-[#f9d07a]' : 'text-white'}`}>
                {a.title}
              </h3>
              {a.body && (
                <p className="font-body text-sm text-[#d1c5b3] opacity-50 leading-relaxed">
                  {a.body}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
