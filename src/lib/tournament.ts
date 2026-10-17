export type TournamentTiming = {
  status: 'draft' | 'published' | 'archived' | 'cancelled'
  startsAt: Date | string | null
  endsAt: Date | string | null
  registrationOpensAt: Date | string | null
  registrationClosesAt: Date | string | null
}

export type Phase =
  | 'draft'
  | 'cancelled'
  | 'archived'
  | 'announced' // published, registration not yet open
  | 'registration_open'
  | 'registration_closed' // closed, not started
  | 'live'
  | 'completed'

const t = (v: Date | string | null) => (v ? new Date(v).getTime() : null)

export function phaseOf(x: TournamentTiming, now = Date.now()): Phase {
  if (x.status === 'draft') return 'draft'
  if (x.status === 'cancelled') return 'cancelled'
  if (x.status === 'archived') return 'archived'
  const starts = t(x.startsAt)
  const ends = t(x.endsAt)
  const opens = t(x.registrationOpensAt)
  const closes = t(x.registrationClosesAt) ?? starts
  if (ends !== null && now >= ends) return 'completed'
  if (starts !== null && now >= starts) return 'live'
  if (opens !== null && now < opens) return 'announced'
  if (closes !== null && now >= closes) return 'registration_closed'
  return 'registration_open'
}

export const PHASE_LABEL: Record<Phase, string> = {
  draft: 'Draft',
  cancelled: 'Cancelled',
  archived: 'Archived',
  announced: 'Announced',
  registration_open: 'Registration open',
  registration_closed: 'Registration closed',
  live: 'Live now',
  completed: 'Completed',
}

export const REGISTRATION_STATUSES = ['pending', 'approved', 'rejected', 'waitlisted', 'withdrawn', 'disqualified', 'cancelled'] as const
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number]
export const ACTIVE_STATUSES: readonly RegistrationStatus[] = ['pending', 'approved', 'waitlisted']

export const STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  withdrawn: 'Withdrawn',
  disqualified: 'Disqualified',
  cancelled: 'Cancelled',
}

/** Mirrors zenith.registration_status_legal — the database trigger is authoritative. */
export const LEGAL_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  pending: ['approved', 'rejected', 'waitlisted', 'withdrawn', 'cancelled'],
  waitlisted: ['pending', 'approved', 'rejected', 'withdrawn', 'cancelled'],
  approved: ['withdrawn', 'disqualified', 'cancelled'],
  rejected: ['pending'],
  withdrawn: [],
  disqualified: [],
  cancelled: [],
}

export function formatInZone(v: Date | string | null, tz: string, opts: Intl.DateTimeFormatOptions = {}) {
  if (!v) return 'To be announced'
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: tz,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...opts,
  }).format(new Date(v))
}

export function tzAbbrev(tz: string) {
  return tz === 'Asia/Karachi' ? 'PKT' : tz
}

export type RosterRule = { min: number; max: number; subsMax: number; subsRequired: number }

export function rosterLabel(code: string) {
  return { solo: 'Player', duo: 'Duo', squad: 'Squad', team5: 'Team', lft: 'Player' }[code] ?? 'Team'
}
export const isTeamFormat = (code: string) => code === 'squad' || code === 'team5' || code === 'duo'
