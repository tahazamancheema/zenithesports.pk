/**
 * Site-wide metadata and configuration.
 */
export const siteConfig = {
  name: "Zenith Esports",
  tagline: "Pakistan's Premier Esports Organisation",
  description:
    "Zenith Esports — Pakistan's premier competitive gaming platform. Tournament registration, live streams, Mark47 production, and rankings for Valorant, Free Fire, and PUBG Mobile.",
  url: "https://zenithesports.pk",
  ogImage: "/og-default.png",
  email: {
    noreply: "noreply@zenithesports.pk",
    production: "production@zenithesports.pk",
    contact: "contact@zenithesports.pk",
  },
  socials: {
    discord: "https://discord.gg/zenithesports",
    twitter: "https://twitter.com/zenithesports",
    youtube: "https://youtube.com/@zenithesports.pakistan",
    tiktok: "https://tiktok.com/@zenithesports",
    instagram: "https://instagram.com/zenithesports",
  },
  /** Games supported by the platform */
  games: [
    { slug: "valorant" as const, name: "Valorant", accent: "var(--color-valorant)" },
    { slug: "freefire" as const, name: "Free Fire", accent: "var(--color-freefire)" },
    { slug: "pubgm" as const, name: "PUBG Mobile", accent: "var(--color-pubgm)" },
  ],
} as const;

export type GameSlug = (typeof siteConfig.games)[number]["slug"];
