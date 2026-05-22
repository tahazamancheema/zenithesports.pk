import React, { useState } from 'react';
import { MessageCircle, Mail, Clock, MapPin, Send } from 'lucide-react';
import GhostInput from '../components/ui/GhostInput';
import GradientButton from '../components/ui/GradientButton';
import toast from 'react-hot-toast';

const CONTACT_INFO = [
  {
    icon: MessageCircle,
    label: 'WHATSAPP',
    value: '+92 339 0715753',
    sub: 'Fastest response — usually within 1 hour',
    href: 'https://wa.me/923390715753',
    cta: 'Message on WhatsApp',
  },
  {
    icon: MapPin,
    label: 'LOCATION',
    value: 'Pakistan',
    sub: 'Pakistan',
    href: null,
    cta: null,
  },
  {
    icon: Clock,
    label: 'SUPPORT HOURS',
    value: 'Mon – Sun',
    sub: '12:00 PM – 2:00 AM PKT',
    href: null,
    cta: null,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  function setField(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSending(true);
    // WhatsApp fallback — compose a wa.me message
    const text = encodeURIComponent(
      `*ZENITH ESPORTS CONTACT*\n\nName: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject || 'General Inquiry'}\n\nMessage:\n${form.message}`
    );
    window.open(`https://wa.me/923390715753?text=${text}`, '_blank');
    toast.success('Opening WhatsApp with your message!');
    setSending(false);
    setForm({ name: '', email: '', subject: '', message: '' });
  }

  return (
    <div className="min-h-screen bg-[#131313] pt-28 animate-page-enter">

      {/* Hero */}
      <section className="py-24 px-6 md:px-12 bg-[#1b1b1b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-8"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&q=80&fm=webp')", backgroundSize: 'cover' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b] to-transparent" />
        <div className="relative z-10">
          <span className="font-teko text-[#dbb462] text-[20px] tracking-[0.2em] block mb-4 uppercase">GET IN TOUCH</span>
          <h1 className="font-bebas text-7xl md:text-9xl tracking-tight leading-none mb-6 uppercase text-white">
            CONTACT <span className="text-[#dbb462]">US</span>
          </h1>
          <p className="font-body text-[#d1c5b3] opacity-40 max-w-xl text-lg leading-relaxed">
            Questions about registration? Tournament disputes? Business partnerships? We're here — reach us directly on WhatsApp for the fastest response.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">

          {/* Contact info cards */}
          <div className="lg:col-span-4 space-y-4">
            {CONTACT_INFO.map(({ icon: Icon, label, value, sub, href, cta }) => (
              <div key={label} className="bg-[#111] p-8 border-l-4 border-[#dbb462]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#2a2a2a] flex items-center justify-center">
                    <Icon size={16} className="text-[#dbb462]" />
                  </div>
                  <span className="font-teko text-[16px] tracking-widest text-[#dbb462] uppercase">{label}</span>
                </div>
                <p className="font-bebas text-3xl text-white mb-1">{value}</p>
                <p className="font-body text-[#d1c5b3] opacity-40 text-sm mb-4">{sub}</p>
                {href && cta && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-teko text-[14px] tracking-widest text-[#dbb462] hover:opacity-70 transition-opacity flex items-center gap-2 uppercase"
                  >
                    {cta} →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-8">
            <div className="bg-[#111] p-10 border border-white/5">
              <h2 className="font-bebas text-4xl text-white mb-2 uppercase">SEND A MESSAGE</h2>
              <p className="font-teko text-[16px] tracking-widest text-[#d1c5b3] opacity-40 mb-10 uppercase">
                Your message will be sent directly via WhatsApp
              </p>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <GhostInput
                    id="contact-name"
                    label="Your Name"
                    placeholder="Muhammad Ahmed"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    required
                  />
                  <GhostInput
                    id="contact-email"
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                  />
                </div>

                <GhostInput
                  id="contact-subject"
                  label="Subject"
                  placeholder="e.g. Registration Issue / Tournament Query"
                  value={form.subject}
                  onChange={(e) => setField('subject', e.target.value)}
                />

                <div className="space-y-1">
                  <label className="font-teko text-[16px] tracking-widest text-[#dbb462] uppercase block opacity-60">
                    Message <span className="text-[#dbb462]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setField('message', e.target.value)}
                    placeholder="Describe your issue or query in detail..."
                    rows={6}
                    required
                    className="w-full bg-[#0a0a0a] border-b border-white/10 pt-3 pb-2 text-lg text-[#f2f2f2] placeholder:text-white/10 focus:outline-none focus:border-b-[#dbb462] transition-colors resize-none font-body"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={sending}
                  className="btn-obsidian-primary w-full py-5 font-bebas text-3xl tracking-widest uppercase"
                >
                  {sending ? 'PROCESSING...' : 'SEND VIA WHATSAPP'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
