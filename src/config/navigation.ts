import {
  Home,
  Trophy,
  Film,
  Users,
  Info,
  ImageIcon,
  Handshake,
  Mail,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export interface FooterSection {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}

/** Main navbar links (centre) */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Mark47", href: "/mark47", icon: Film },
  { label: "About", href: "/about", icon: Info },
  { label: "Media", href: "/media", icon: ImageIcon },
];

/** Footer navigation sections */
export const footerNav: FooterSection[] = [
  {
    title: "Tournaments",
    links: [
      { label: "All Tournaments", href: "/tournaments" },
      { label: "Valorant", href: "/tournaments?game=valorant" },
      { label: "Free Fire", href: "/tournaments?game=freefire" },
      { label: "PUBG Mobile", href: "/tournaments?game=pubgm" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Roster", href: "/roster" },
      { label: "Media", href: "/media" },
      { label: "Partners", href: "/partners" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Tournament Rules", href: "/legal/rules" },
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Refund Policy", href: "/legal/refunds" },
    ],
  },
];
