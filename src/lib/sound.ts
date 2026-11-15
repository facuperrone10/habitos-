// "Tic" suave generado con Web Audio (sin archivos). Apagado por defecto (setting soundEnabled).
let ctx: AudioContext | null = null

export function playTick(up = true) {
  try {
    ctx ??= new AudioContext()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(up ? 880 : 520, t)
    osc.frequency.exponentialRampToValueAtTime(up ? 1320 : 400, t + 0.08)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.13)
  } catch {
    /* sin audio: se ignora */
  }
}
