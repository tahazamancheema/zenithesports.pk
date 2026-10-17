export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "name": "Zenith Esports",
    "url": "https://www.zenithesports.pk",
    "logo": "https://www.zenithesports.pk/logo.png",
    "sameAs": [
      "https://twitter.com/zenithesports",
      "https://youtube.com/zenithesports",
      "https://twitch.tv/zenithesports"
    ],
    "description": "Pakistan's premier competitive gaming organization and tournament organizer."
  };
}

export function generateTournamentSchema(tournament: {
  name: string;
  startDate: string;
  endDate?: string;
  game: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": tournament.name,
    "startDate": tournament.startDate,
    "endDate": tournament.endDate || tournament.startDate,
    "sport": "Esports",
    "competitor": {
      "@type": "SportsTeam",
      "name": "Multiple Teams"
    },
    "location": {
      "@type": "VirtualLocation",
      "url": tournament.url
    },
    "organizer": {
      "@type": "SportsOrganization",
      "name": "Zenith Esports",
      "url": "https://www.zenithesports.pk"
    }
  };
}
