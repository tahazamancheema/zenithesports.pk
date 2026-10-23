import type { RuleSection } from '@/config/rules'

/** Rule sections as DocPage sections: an optional lead sentence, then the rules as a list. */
export const ruleSections = (sections: RuleSection[]) =>
  sections.map((s) => ({
    id: s.id,
    title: s.title,
    body: (
      <>
        {s.intro && <p>{s.intro}</p>}
        <ul>
          {s.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </>
    ),
  }))
