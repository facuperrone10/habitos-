// Mantiene la pantalla encendida durante una sesión de foco (Safari 16.4+).
// Si el sistema la libera (cambio de app), se vuelve a pedir al regresar.
let sentinel: WakeLockSentinel | null = null
let wanted = false

async function request() {
  try {
    if (wanted && document.visibilityState === 'visible' && 'wakeLock' in navigator) {
      sentinel = await navigator.wakeLock.request('screen')
    }
  } catch {
    /* no soportado o denegado: la sesión sigue igual */
  }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible') request()
})

export function keepAwake(on: boolean) {
  wanted = on
  if (on) request()
  else {
    sentinel?.release().catch(() => {})
    sentinel = null
  }
}
