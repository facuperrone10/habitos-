import confetti from 'canvas-confetti'

// Confeti de "día completo" con los colores de las secciones.
export function celebrateDay(colors: string[]) {
  const base = { disableForReducedMotion: true, colors, ticks: 180, scalar: 0.9 }
  confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 45, origin: { x: 0.2, y: 0.9 }, angle: 65 })
  confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 45, origin: { x: 0.8, y: 0.9 }, angle: 115 })
}
