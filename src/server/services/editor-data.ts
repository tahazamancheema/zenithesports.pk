import 'server-only'
import { utcToZonedInput } from '@/lib/zoned'
import { publishedVersions } from './admin-tournaments'
import { getFormats, getGames, type Tournament } from './catalog'

export async function editorOptions() {
  const [games, formats, versions] = await Promise.all([getGames(), getFormats(), publishedVersions()])
  const name = Object.fromEntries(games.map((g) => [g.id, g.name]))
  return {
    formats: formats.filter((f) => f.enabled).map((f) => ({ ...f, gameName: name[f.gameId] ?? f.gameId })),
    versions,
  }
}

export function tournamentToValues(t: Tournament): Record<string, string> {
  const tz = t.timezone
  const n = (x: number | null) => (x === null || x === undefined ? '' : String(x))
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    formatId: t.formatId,
    summary: t.summary,
    description: t.description,
    rules: t.rules,
    eligibility: t.eligibility,
    prizeInfo: t.prizeInfo,
    timezone: tz,
    startsAt: utcToZonedInput(t.startsAt, tz),
    endsAt: utcToZonedInput(t.endsAt, tz),
    registrationOpensAt: utcToZonedInput(t.registrationOpensAt, tz),
    registrationClosesAt: utcToZonedInput(t.registrationClosesAt, tz),
    capacity: n(t.capacity),
    rosterMin: n(t.rosterMin),
    rosterMax: n(t.rosterMax),
    substitutesMax: n(t.substitutesMax),
    substitutesRequired: n(t.substitutesRequired),
    entryFeePkr: n(t.entryFeePkr),
    feeNotes: t.feeNotes,
    requiresApproval: t.requiresApproval ? 'on' : '',
    waitlistEnabled: t.waitlistEnabled ? 'on' : '',
    uniquePhone: t.uniquePhone ? 'on' : '',
    formVersionId: t.formVersionId ?? '',
    communicationLinks: t.communicationLinks.map((l) => `${l.label} | ${l.url}`).join('\n'),
    broadcastUrl: t.broadcastUrl ?? '',
    resultsNotes: t.resultsNotes,
    adminNotes: t.adminNotes,
  }
}
