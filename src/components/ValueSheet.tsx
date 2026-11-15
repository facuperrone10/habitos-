import { useEffect, useRef, useState } from 'react'
import type { Action } from '../db/types'

// Atajos por unidad: 1 tap en lugar de tipear.
const QUICK: Record<string, number[]> = {
  min: [15, 30, 45, 60, 90],
  págs: [10, 20, 30, 50],
  km: [3, 5, 10],
}

interface Props {
  action: Action
  color: string
  value: number | null
  onSave: (value: number | null) => void
  onClose: () => void
}

export function ValueSheet({ action, color, value, onSave, onClose }: Props) {
  const [text, setText] = useState(value != null ? String(value) : '')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => inputRef.current?.focus(), [])

  const save = (v: number | null) => {
    onSave(v)
    onClose()
  }
  const parsed = text.trim() === '' ? null : Number(text.replace(',', '.'))
  const valid = parsed === null || (Number.isFinite(parsed) && parsed >= 0)
  const quick = QUICK[action.unit ?? ''] ?? []

  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal>
      <button type="button" aria-label="Cerrar" className="sheet-backdrop absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="sheet relative w-full rounded-t-3xl bg-surface px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
        <div className="mb-3 text-sm font-medium text-neutral-500">{action.name}</div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) save(parsed)
          }}
        >
          <div className="mb-4 flex items-baseline gap-2">
            <input
              ref={inputRef}
              inputMode="decimal"
              enterKeyHint="done"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-5xl font-bold tabular-nums text-neutral-900 outline-none placeholder:text-neutral-200"
            />
            <span className="text-xl font-semibold text-neutral-400">{action.unit}</span>
          </div>
          {quick.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => save(q)}
                  className="rounded-full bg-neutral-100 px-4 py-2.5 text-[15px] font-semibold text-neutral-700 active:bg-neutral-200"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save(null)}
              className="rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-neutral-500 active:bg-neutral-100"
            >
              Sin valor
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="flex-1 rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
              style={{ background: color }}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
