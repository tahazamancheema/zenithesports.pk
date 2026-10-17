import { describe, expect, it } from 'vitest'
import { validateAnswers, visibleFields } from '@/lib/forms/engine'
import { formSchemaSchema, type FormSchema } from '@/lib/forms/schema'
import { toE164 } from '@/lib/normalize'

const schema: FormSchema = formSchemaSchema.parse({
  fields: [
    { id: 'intro', type: 'heading', label: 'About your team' },
    { id: 'city', type: 'short_text', label: 'City', required: true, maxLength: 30 },
    { id: 'age_ok', type: 'single_choice', label: 'Are all players 16+?', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
      disqualifyWhen: { mode: 'all', rules: [{ field: 'age_ok', op: 'equals', value: 'no' }] }, disqualifyMessage: 'All players must be 16 or older.' },
    { id: 'has_coach', type: 'consent', label: 'We have a coach' },
    { id: 'coach_name', type: 'short_text', label: 'Coach name', required: true, visibleWhen: { mode: 'all', rules: [{ field: 'has_coach', op: 'checked' }] } },
    { id: 'maps', type: 'multi_choice', label: 'Maps', options: [{ value: 'erangel', label: 'Erangel' }, { value: 'miramar', label: 'Miramar' }], maxSelections: 1 },
    { id: 'logo', type: 'file', label: 'Team logo', accept: ['image/png'], maxSizeMB: 1 },
    { id: 'device', type: 'dropdown', label: 'Device', scope: 'player', required: true, options: [{ value: 'phone', label: 'Phone' }, { value: 'tablet', label: 'Tablet' }] },
    { id: 'tag', type: 'short_text', label: 'Tag', pattern: '^[A-Z]{2,4}$', patternMessage: 'Use 2–4 capital letters.' },
  ],
})

describe('form schema validation', () => {
  it('rejects forward references in conditions', () => {
    const r = formSchemaSchema.safeParse({
      fields: [
        { id: 'a', type: 'short_text', label: 'A', visibleWhen: { mode: 'all', rules: [{ field: 'b', op: 'filled' }] } },
        { id: 'b', type: 'short_text', label: 'B' },
      ],
    })
    expect(r.success).toBe(false)
  })
  it('rejects duplicate keys, empty choice lists and bad regex', () => {
    expect(formSchemaSchema.safeParse({ fields: [{ id: 'a', type: 'short_text', label: 'A' }, { id: 'a', type: 'short_text', label: 'B' }] }).success).toBe(false)
    expect(formSchemaSchema.safeParse({ fields: [{ id: 'a', type: 'dropdown', label: 'A', options: [] }] }).success).toBe(false)
    expect(formSchemaSchema.safeParse({ fields: [{ id: 'a', type: 'short_text', label: 'A', pattern: '([' }] }).success).toBe(false)
  })
})

describe('answer validation', () => {
  it('requires visible required fields and drops hidden ones', () => {
    const r = validateAnswers(schema, { city: 'Lahore', age_ok: 'yes', coach_name: 'ignored' }, { scope: 'entry' })
    expect(r.errors).toEqual({})
    expect(r.values.coach_name).toBeUndefined()
    const r2 = validateAnswers(schema, { city: 'Lahore', age_ok: 'yes', has_coach: true }, { scope: 'entry' })
    expect(r2.errors.coach_name).toMatch(/required/)
  })
  it('applies eligibility rules', () => {
    const r = validateAnswers(schema, { city: 'Lahore', age_ok: 'no' }, { scope: 'entry' })
    expect(r.disqualified).toBe('All players must be 16 or older.')
  })
  it('enforces options, limits, patterns and file rules', () => {
    const r = validateAnswers(
      schema,
      { city: 'x'.repeat(31), age_ok: 'maybe', maps: ['erangel', 'miramar'], tag: 'abc', logo: { name: 'a.jpg', size: 2_000_000, type: 'image/jpeg' } },
      { scope: 'entry' },
    )
    expect(Object.keys(r.errors).sort()).toEqual(['age_ok', 'city', 'logo', 'maps', 'tag'])
  })
  it('ignores keys that are not in the schema (no mass assignment)', () => {
    const r = validateAnswers(schema, { city: 'Karachi', age_ok: 'yes', is_admin: true } as never, { scope: 'entry' })
    expect('is_admin' in r.values).toBe(false)
  })
  it('validates player-scope fields separately', () => {
    expect(validateAnswers(schema, {}, { scope: 'player' }).errors.device).toBeTruthy()
    expect(validateAnswers(schema, { device: 'phone' }, { scope: 'player' }).errors).toEqual({})
  })
  it('computes visible fields in order', () => {
    expect(visibleFields(schema, 'entry', { has_coach: true }).map((f) => f.id)).toContain('coach_name')
    expect(visibleFields(schema, 'entry', {}).map((f) => f.id)).not.toContain('coach_name')
  })
})

describe('phone normalisation', () => {
  it.each([
    ['0300 1234567', '+923001234567'],
    ['3001234567', '+923001234567'],
    ['+92 300 1234567', '+923001234567'],
    ['0092-300-1234567', '+923001234567'],
    ['+44 7911 123456', '+447911123456'],
  ])('%s → %s', (raw, out) => expect(toE164(raw)).toBe(out))
  it.each(['123', '0300', '+92 30', 'abc', '+920001234567'])('rejects %s', (raw) => expect(toE164(raw)).toBeNull())
})
