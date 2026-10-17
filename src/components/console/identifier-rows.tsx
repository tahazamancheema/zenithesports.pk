'use client'

import { useState } from 'react'

/** Repeatable identifier inputs (kind, value, confidence) submitted as parallel arrays. */
export function IdentifierRows({ initial = 1 }: { initial?: number }) {
  const [rows, setRows] = useState(initial)
  return (
    <div className="grid gap-2">
      <p className="field-label !mb-0">Identifiers to match on</p>
      <p className="field-help !mt-0">A phone number or shared ID is an indicator for review, not proof. Use “confirmed” only for identifiers verified by evidence.</p>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[9rem_1fr_9rem]">
          <select name="idKind" className="input" aria-label="Identifier type" defaultValue="game_uid">
            <option value="game_uid">Game UID</option>
            <option value="phone">Phone / WhatsApp</option>
            <option value="team_name">Team name</option>
            <option value="ign">In-game name</option>
          </select>
          <input name="idValue" className="input input-mono" aria-label="Identifier value" />
          <select name="idConfidence" className="input" aria-label="Confidence" defaultValue="confirmed">
            <option value="confirmed">Confirmed</option>
            <option value="strong">Strong</option>
            <option value="indicator">Indicator</option>
          </select>
        </div>
      ))}
      {rows < 12 && (
        <button type="button" className="t-label justify-self-start hover:text-fg" onClick={() => setRows(rows + 1)}>
          + another identifier
        </button>
      )}
    </div>
  )
}
