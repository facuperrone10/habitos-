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

/** Campana suave para avisar fin de foco / descanso (3 notas). */
export function playChime() {
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    ;[784, 988, 1175].forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const t = t0 + i * 0.18
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t)
      osc.stop(t + 0.65)
    })
  } catch {
    /* sin audio */
  }
}

/** Desbloquea el audio en iOS: debe llamarse dentro de un toque del usuario. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') ctx.resume()
  } catch {
    /* nada */
  }
}
