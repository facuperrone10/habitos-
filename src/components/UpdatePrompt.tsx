import { useRegisterSW } from 'virtual:pwa-register/react'

// Aviso cuando hay una versión nueva desplegada (evita quedar con caché vieja).
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 text-white shadow-xl">
      <span className="flex-1 text-sm">Hay una versión nueva.</span>
      <button type="button" className="text-sm font-semibold text-neutral-400" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
      <button type="button" className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
    </div>
  )
}
