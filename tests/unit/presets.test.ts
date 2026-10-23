import { describe, expect, it } from 'vitest'
import { GAME_PRESETS, libraryField, presetSchema, QUESTION_LIBRARY } from '@/lib/forms/presets'
import { formSchemaSchema } from '@/lib/forms/schema'

describe('ready-made registration forms', () => {
  it('every game preset is a valid form', () => {
    for (const id of Object.keys(GAME_PRESETS)) {
      const r = formSchemaSchema.safeParse(presetSchema(id))
      expect(r.success, `${id}: ${r.success ? '' : r.error.issues[0]?.message}`).toBe(true)
    }
  })

  it('covers every game Zenith runs', () => {
    expect(Object.keys(GAME_PRESETS).sort()).toEqual(['ea-fc', 'free-fire', 'honor-of-kings', 'pubg-mobile', 'tekken-8', 'valorant'])
  })

  it('library questions never collide with fields already on the form', () => {
    const first = libraryField('city', [])
    const second = libraryField('city', [first])
    expect(first.id).toBe('city')
    expect(second.id).not.toBe(first.id)
    for (const x of QUESTION_LIBRARY) expect(formSchemaSchema.safeParse({ version: 1, fields: [x.field] }).success, x.key).toBe(true)
  })
})
