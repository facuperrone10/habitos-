import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo propio (no usa confirm() del navegador). */
export function ConfirmDialog({ title, children, confirmLabel, danger, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="alertdialog" aria-modal>
      <button type="button" aria-label="Cancelar" className="sheet-backdrop absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="dialog relative w-full max-w-sm rounded-3xl bg-surface p-5 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-neutral-900">{title}</h2>
        <div className="mb-5 text-sm leading-relaxed text-neutral-600">{children}</div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-neutral-100 py-3 text-[15px] font-semibold text-neutral-700">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl py-3 text-[15px] font-semibold text-white"
            style={{ background: danger ? '#E5484D' : '#3E63DD' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
