import { useRegisterSW } from 'virtual:pwa-register/react'

// Aviso cuando hay una versión nueva desplegada (evita quedar con caché vieja).
// Colores fijos: se ve igual en claro y oscuro.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+8px)] z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl" style={{ background: '#1f2328', color: '#fff' }}>
      <span className="flex-1 text-sm">Hay una versión nueva.</span>
      <button type="button" className="text-sm font-semibold" style={{ color: '#9ca3af' }} onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
      <button type="button" className="rounded-xl px-3 py-1.5 text-sm font-semibold" style={{ background: '#fff', color: '#1f2328' }} onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
    </div>
  )
}
