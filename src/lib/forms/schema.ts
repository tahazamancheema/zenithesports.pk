import { z } from 'zod'

export const FIELD_TYPES = [
  'short_text',
  'long_text',
  'number',
  'email',
  'phone',
  'game_uid',
  'ign',
  'single_choice',
  'multi_choice',
  'dropdown',
  'consent',
  'file',
  'heading',
  'paragraph',
] as const
export type FieldType = (typeof FIELD_TYPES)[number]

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  short_text: 'Short answer',
  long_text: 'Paragraph',
  number: 'Number',
  email: 'Email',
  phone: 'Phone / WhatsApp',
  game_uid: 'Game ID',
  ign: 'In-game name',
  single_choice: 'Multiple choice (pick one)',
  multi_choice: 'Checkboxes (pick several)',
  dropdown: 'Dropdown',
  consent: 'Agreement checkbox',
  file: 'Image upload',
  heading: 'Section title',
  paragraph: 'Note for applicants',
}

/** One line on what each question type is for, shown when adding a question. */
export const FIELD_TYPE_HINT: Record<FieldType, string> = {
  short_text: 'A name, tag or short reply.',
  long_text: 'A longer written answer.',
  number: 'Age, level, rank points…',
  email: 'An email address, checked for format.',
  phone: 'A Pakistani mobile number, checked for format.',
  game_uid: 'A game account ID, checked for the game.',
  ign: 'An in-game name.',
  single_choice: 'Choose one option from a short list.',
  multi_choice: 'Tick any number of options.',
  dropdown: 'Choose one option from a longer list.',
  consent: 'A box they must tick to agree.',
  file: 'A screenshot or logo (PNG, JPEG or WebP).',
  heading: 'Splits the form into sections.',
  paragraph: 'Text with instructions, no answer.',
}

export const DISPLAY_ONLY: readonly FieldType[] = ['heading', 'paragraph']
export const CHOICE_TYPES: readonly FieldType[] = ['single_choice', 'multi_choice', 'dropdown']
export const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

export const CONDITION_OPS = [
  'equals',
  'not_equals',
  'includes',
  'not_includes',
  'checked',
  'not_checked',
  'gt',
  'lt',
  'filled',
  'empty',
] as const
export type ConditionOp = (typeof CONDITION_OPS)[number]

const ruleSchema = z.object({
  field: z.string().min(1),
  op: z.enum(CONDITION_OPS),
  value: z.union([z.string(), z.number()]).optional(),
})
export const conditionSchema = z.object({
  mode: z.enum(['all', 'any']).default('all'),
  rules: z.array(ruleSchema).min(1).max(10),
})
export type Condition = z.infer<typeof conditionSchema>

const optionSchema = z.object({
  value: z.string().regex(/^[a-z0-9_-]{1,40}$/, 'Option values use a–z, 0–9, _ or -'),
  label: z.string().min(1).max(120),
})

export const fieldSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_]{1,39}$/, 'Field keys start with a letter and use a–z, 0–9 or _'),
    type: z.enum(FIELD_TYPES),
    label: z.string().min(1).max(300),
    help: z.string().max(600).optional(),
    placeholder: z.string().max(120).optional(),
    required: z.boolean().default(false),
    scope: z.enum(['entry', 'player']).default('entry'),
    minLength: z.number().int().min(0).max(5000).optional(),
    maxLength: z.number().int().min(1).max(5000).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
    options: z.array(optionSchema).max(50).optional(),
    minSelections: z.number().int().min(0).max(50).optional(),
    maxSelections: z.number().int().min(1).max(50).optional(),
    accept: z.array(z.enum(IMAGE_MIME)).min(1).optional(),
    maxSizeMB: z.number().min(0.1).max(4).optional(),
    pattern: z.string().max(200).optional(),
    patternMessage: z.string().max(200).optional(),
    visibleWhen: conditionSchema.optional(),
    disqualifyWhen: conditionSchema.optional(),
    disqualifyMessage: z.string().max(300).optional(),
  })
  .superRefine((f, ctx) => {
    if (CHOICE_TYPES.includes(f.type) && (!f.options || f.options.length < 1)) {
      ctx.addIssue({ code: 'custom', message: 'Choice fields need at least one option', path: ['options'] })
    }
    if (f.options) {
      const seen = new Set<string>()
      for (const o of f.options) {
        if (seen.has(o.value)) ctx.addIssue({ code: 'custom', message: `Duplicate option "${o.value}"`, path: ['options'] })
        seen.add(o.value)
      }
    }
    if (f.minLength !== undefined && f.maxLength !== undefined && f.minLength > f.maxLength) {
      ctx.addIssue({ code: 'custom', message: 'Minimum length is above maximum length', path: ['minLength'] })
    }
    if (f.min !== undefined && f.max !== undefined && f.min > f.max) {
      ctx.addIssue({ code: 'custom', message: 'Minimum is above maximum', path: ['min'] })
    }
    if (f.pattern) {
      try {
        new RegExp(f.pattern)
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Validation pattern is not a valid regular expression', path: ['pattern'] })
      }
    }
    if (DISPLAY_ONLY.includes(f.type) && f.required) {
      ctx.addIssue({ code: 'custom', message: 'Headings and descriptions cannot be required', path: ['required'] })
    }
    if (f.disqualifyWhen && !f.disqualifyMessage) {
      ctx.addIssue({ code: 'custom', message: 'Eligibility rules need a message for the applicant', path: ['disqualifyMessage'] })
    }
  })
export type FormField = z.infer<typeof fieldSchema>

export const formSchemaSchema = z
  .object({
    version: z.literal(1).default(1),
    intro: z.string().max(2000).optional(),
    fields: z.array(fieldSchema).max(80),
  })
  .superRefine((form, ctx) => {
    const seen = new Map<string, FormField>()
    form.fields.forEach((f, i) => {
      if (seen.has(f.id)) ctx.addIssue({ code: 'custom', message: `Duplicate field key "${f.id}"`, path: ['fields', i, 'id'] })
      for (const cond of [f.visibleWhen, f.disqualifyWhen]) {
        for (const rule of cond?.rules ?? []) {
          // Conditions may only look backwards, which rules out cycles.
          const target = seen.get(rule.field) ?? (cond === f.disqualifyWhen && rule.field === f.id ? f : undefined)
          if (!target) {
            ctx.addIssue({
              code: 'custom',
              message: `"${f.label}" depends on "${rule.field}", which must be an earlier field`,
              path: ['fields', i],
            })
          } else if (target.scope === 'player' && f.scope === 'entry') {
            ctx.addIssue({ code: 'custom', message: `"${f.label}" cannot depend on a per-player field`, path: ['fields', i] })
          }
        }
      }
      seen.set(f.id, f)
    })
  })
export type FormSchema = z.infer<typeof formSchemaSchema>

export const EMPTY_FORM: FormSchema = { version: 1, fields: [] }

export function parseFormSchema(input: unknown): FormSchema {
  return formSchemaSchema.parse(input)
}
