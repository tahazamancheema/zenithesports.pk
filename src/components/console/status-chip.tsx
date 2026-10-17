const TONES: Record<string, string> = {
  pending: 'chip chip-info',
  approved: 'chip chip-ok',
  waitlisted: 'chip chip-warn',
  rejected: 'chip chip-bad',
  withdrawn: 'chip',
  disqualified: 'chip chip-bad',
  cancelled: 'chip',
  draft: 'chip',
  published: 'chip chip-ok',
  archived: 'chip',
  needs_clarification: 'chip chip-warn',
  open: 'chip chip-bad',
  acknowledged: 'chip chip-warn',
  dismissed: 'chip',
  resolved: 'chip chip-ok',
  active: 'chip chip-ok',
  lifted: 'chip',
  expired: 'chip',
  confirmed: 'chip chip-bad',
  strong: 'chip chip-warn',
  indicator: 'chip chip-info',
  new: 'chip chip-info',
  contacted: 'chip chip-warn',
  qualified: 'chip chip-ok',
  closed: 'chip',
  spam: 'chip',
  requested: 'chip chip-info',
  under_review: 'chip chip-warn',
  needs_info: 'chip chip-warn',
  declined: 'chip',
  replied: 'chip chip-ok',
  matched: 'chip chip-ok',
  hidden: 'chip',
  running: 'chip chip-warn',
  completed: 'chip chip-ok',
  failed: 'chip chip-bad',
}

export function StatusChip({ value }: { value: string }) {
  return <span className={TONES[value] ?? 'chip'}>{value.replace(/_/g, ' ')}</span>
}

export function fmt(d: Date | string | null | undefined) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(d))
}
