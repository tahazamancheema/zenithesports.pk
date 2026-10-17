import { isEmail, toE164 } from '../normalize'
import type { Condition, FormField, FormSchema } from './schema'
import { DISPLAY_ONLY } from './schema'

/** Shape of a file answer before upload (browser) or after sniffing (server). */
export type FileMeta = { name: string; size: number; type: string }
export type AnswerValue = string | number | boolean | string[] | FileMeta | null | undefined
export type Answers = Record<string, AnswerValue>

export type ValidationContext = {
  scope: 'entry' | 'player'
  /** Entry-level answers, visible to player-scoped conditions. */
  entryAnswers?: Answers
  /** The game's UID rule for `game_uid` fields. */
  uidPattern?: string
  uidLabel?: string
}

export type ValidationResult = {
  values: Answers
  errors: Record<string, string>
  disqualified: string | null
}

const isEmpty = (v: AnswerValue) =>
  v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)

function testRule(value: AnswerValue, op: Condition['rules'][number]['op'], expected: string | number | undefined) {
  switch (op) {
    case 'filled':
      return !isEmpty(value)
    case 'empty':
      return isEmpty(value)
    case 'checked':
      return value === true
    case 'not_checked':
      return value !== true
    case 'equals':
      return String(value ?? '') === String(expected ?? '')
    case 'not_equals':
      return String(value ?? '') !== String(expected ?? '')
    case 'includes':
      return Array.isArray(value) ? value.includes(String(expected)) : String(value ?? '') === String(expected)
    case 'not_includes':
      return Array.isArray(value) ? !value.includes(String(expected)) : String(value ?? '') !== String(expected)
    case 'gt':
      return Number(value) > Number(expected)
    case 'lt':
      return Number(value) < Number(expected)
  }
}

export function evaluate(cond: Condition | undefined, own: Answers, entry: Answers = {}): boolean {
  if (!cond) return true
  const results = cond.rules.map((r) => testRule(r.field in own ? own[r.field] : entry[r.field], r.op, r.value))
  return cond.mode === 'any' ? results.some(Boolean) : results.every(Boolean)
}

export function fieldsForScope(schema: FormSchema, scope: 'entry' | 'player') {
  return schema.fields.filter((f) => f.scope === scope)
}

/** Fields currently shown, given the answers so far (in order — conditions look backwards). */
export function visibleFields(schema: FormSchema, scope: 'entry' | 'player', answers: Answers, entry: Answers = {}) {
  const shown: FormField[] = []
  const effective: Answers = {}
  for (const f of fieldsForScope(schema, scope)) {
    if (!evaluate(f.visibleWhen, effective, entry)) continue
    shown.push(f)
    effective[f.id] = answers[f.id]
  }
  return shown
}

function validateField(f: FormField, raw: AnswerValue, ctx: ValidationContext): { value?: AnswerValue; error?: string } {
  if (DISPLAY_ONLY.includes(f.type)) return {}
  const label = f.label.length > 60 ? 'This field' : f.label

  if (isEmpty(raw)) {
    if (f.required) return { error: f.type === 'consent' ? 'You must agree to continue.' : `${label} is required.` }
    return { value: f.type === 'multi_choice' ? [] : f.type === 'consent' ? false : null }
  }

  switch (f.type) {
    case 'short_text':
    case 'long_text':
    case 'ign':
    case 'game_uid': {
      if (typeof raw !== 'string') return { error: `${label} must be text.` }
      const v = f.type === 'long_text' ? raw.trim() : raw.trim().replace(/\s+/g, ' ')
      const max = f.maxLength ?? (f.type === 'long_text' ? 2000 : f.type === 'ign' ? 40 : 200)
      if (f.minLength !== undefined && v.length < f.minLength) return { error: `${label} needs at least ${f.minLength} characters.` }
      if (v.length > max) return { error: `${label} can be at most ${max} characters.` }
      if (f.type === 'game_uid' && ctx.uidPattern && !new RegExp(ctx.uidPattern).test(v)) {
        return { error: `That doesn't look like a valid ${ctx.uidLabel ?? 'game ID'}.` }
      }
      if (f.pattern && !new RegExp(f.pattern).test(v)) return { error: f.patternMessage ?? `${label} is not in the expected format.` }
      return { value: v }
    }
    case 'number': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
      if (!Number.isFinite(n)) return { error: `${label} must be a number.` }
      if (f.integer && !Number.isInteger(n)) return { error: `${label} must be a whole number.` }
      if (f.min !== undefined && n < f.min) return { error: `${label} must be at least ${f.min}.` }
      if (f.max !== undefined && n > f.max) return { error: `${label} must be at most ${f.max}.` }
      return { value: n }
    }
    case 'email': {
      const v = String(raw).trim().toLowerCase()
      if (!isEmail(v) || v.length > 254) return { error: 'Enter a valid email address.' }
      return { value: v }
    }
    case 'phone': {
      const v = toE164(String(raw))
      if (!v) return { error: 'Enter a valid number, e.g. 03XX XXXXXXX or +92 3XX XXXXXXX.' }
      return { value: v }
    }
    case 'single_choice':
    case 'dropdown': {
      const v = String(raw)
      if (!f.options?.some((o) => o.value === v)) return { error: `Choose one of the listed options.` }
      return { value: v }
    }
    case 'multi_choice': {
      const list = Array.isArray(raw) ? raw.map(String) : [String(raw)]
      const uniq = [...new Set(list)]
      if (uniq.some((v) => !f.options?.some((o) => o.value === v))) return { error: 'Choose from the listed options.' }
      if (f.minSelections !== undefined && uniq.length < f.minSelections) return { error: `Choose at least ${f.minSelections}.` }
      if (f.maxSelections !== undefined && uniq.length > f.maxSelections) return { error: `Choose at most ${f.maxSelections}.` }
      return { value: uniq }
    }
    case 'consent':
      return raw === true || raw === 'true' || raw === 'on' ? { value: true } : { error: 'You must agree to continue.' }
    case 'file': {
      const meta = raw as FileMeta
      if (!meta || typeof meta !== 'object' || typeof meta.size !== 'number') return { error: `${label}: attach a file.` }
      const accept = f.accept ?? ['image/png', 'image/jpeg', 'image/webp']
      if (!accept.includes(meta.type as never)) return { error: `${label}: use ${accept.map((a) => a.split('/')[1].toUpperCase()).join(', ')}.` }
      const max = (f.maxSizeMB ?? 4) * 1024 * 1024
      if (meta.size > max) return { error: `${label}: the file is larger than ${f.maxSizeMB ?? 4} MB.` }
      return { value: meta }
    }
  }
  return { error: 'Unsupported field.' }
}

/**
 * Validate one scope of answers. Hidden fields are dropped; unknown keys are
 * ignored (no mass assignment). Eligibility rules run on the cleaned values.
 */
export function validateAnswers(schema: FormSchema, answers: Answers, ctx: ValidationContext): ValidationResult {
  const values: Answers = {}
  const errors: Record<string, string> = {}
  let disqualified: string | null = null
  const entry = ctx.entryAnswers ?? {}

  for (const f of fieldsForScope(schema, ctx.scope)) {
    if (!evaluate(f.visibleWhen, values, entry)) continue
    const res = validateField(f, answers[f.id], ctx)
    if (res.error) errors[f.id] = res.error
    else if (!DISPLAY_ONLY.includes(f.type)) values[f.id] = res.value
    if (!disqualified && f.disqualifyWhen && !res.error && evaluate(f.disqualifyWhen, values, entry)) {
      disqualified = f.disqualifyMessage ?? 'You are not eligible for this tournament.'
    }
  }
  return { values, errors, disqualified }
}
