import { useEffect } from 'react'

export interface ToastData {
  id: number
  text: string
  color: string
}

export function Toast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(onDone, 1800)
    return () => window.clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-30 flex justify-center">
      <div key={toast.id} className="toast rounded-full px-5 py-2.5 text-[15px] font-semibold text-white shadow-lg" style={{ background: toast.color }}>
        {toast.text}
      </div>
    </div>
  )
}
