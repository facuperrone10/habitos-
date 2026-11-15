import { NotebookPen } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAX = 280

interface Props {
  date: string
  note: string | null
  onSave: (note: string) => void
}

export function NoteField({ date, note, onSave }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(note ?? '')
  const timer = useRef<number>(undefined)

  // Al cambiar de día se resetea el campo.
  useEffect(() => {
    setText(note ?? '')
    setOpen(false)
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  // Guardado automático con debounce: no hay botón "Guardar".
  const change = (v: string) => {
    setText(v)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onSave(v), 500)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left shadow-sm ring-1 ring-black/5"
      >
        <NotebookPen size={18} className="shrink-0 text-neutral-400" />
        <span className={`line-clamp-2 text-[15px] ${note ? 'text-neutral-700' : 'text-neutral-400'}`}>
          {note || 'Agregar nota…'}
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <textarea
        autoFocus
        rows={3}
        maxLength={MAX}
        value={text}
        onChange={(e) => change(e.target.value)}
        onBlur={() => {
          window.clearTimeout(timer.current)
          onSave(text)
          setOpen(false)
        }}
        placeholder="¿Algo para recordar de hoy?"
        className="w-full resize-none bg-transparent text-base text-neutral-800 outline-none placeholder:text-neutral-400"
      />
      <div className="text-right text-xs text-neutral-400 tabular-nums">
        {text.length}/{MAX}
      </div>
    </div>
  )
}
