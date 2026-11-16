// Temporizador de foco. La sesión guarda solo la hora de inicio: el estado se calcula
// comparando con la hora actual, así funciona aunque iOS suspenda o cierre la app.

export type TechniqueId = 'free' | 'pomodoro' | '52-17' | 'deep90' | 'two-min'

export interface Technique {
  id: TechniqueId
  name: string
  short: string // una línea para elegir
  tip: string // se muestra durante la sesión
  focusMin: number // Infinity = sin límite
  breakMin: number
  longBreakMin?: number
  longEvery?: number // descanso largo cada N focos
  warmupMin?: number // regla de 2 minutos
}

export const TECHNIQUES: Technique[] = [
  {
    id: 'pomodoro', name: 'Pomodoro', short: '25 min de foco · 5 de descanso · cada 4, descanso de 15',
    tip: 'Una sola tarea por pomodoro. Si aparece otra idea, anotala y seguí.',
    focusMin: 25, breakMin: 5, longBreakMin: 15, longEvery: 4,
  },
  {
    id: '52-17', name: '52 / 17', short: '52 min de foco · 17 de descanso real',
    tip: 'En el descanso, alejate de la pantalla: caminar o estirarte rinde más.',
    focusMin: 52, breakMin: 17,
  },
  {
    id: 'deep90', name: 'Bloque profundo', short: '90 min de foco · 20 de descanso',
    tip: 'Ideal para lo más difícil del día. Celular en No molestar y notificaciones fuera.',
    focusMin: 90, breakMin: 20,
  },
  {
    id: 'two-min', name: 'Regla de 2 minutos', short: 'Empezá con solo 2 min; después seguí si querés',
    tip: 'Hábitos atómicos: lo difícil es arrancar. Comprometete solo con 2 minutos.',
    focusMin: Infinity, breakMin: 0, warmupMin: 2,
  },
  {
    id: 'free', name: 'Cronómetro libre', short: 'Iniciar y terminar cuando quieras',
    tip: 'Al terminar, los minutos se suman a la acción de ese día.',
    focusMin: Infinity, breakMin: 0,
  },
]

export const techniqueById = (id: TechniqueId) => TECHNIQUES.find((t) => t.id === id) ?? TECHNIQUES[4]

export interface FocusSession {
  actionId: string
  date: string // día al que se suman los minutos
  techniqueId: TechniqueId
  startedAt: number // ms
}

export interface FocusState {
  phase: 'warmup' | 'focus' | 'break'
  phaseIndex: number // cambia en cada transición (para avisar)
  phaseElapsedMs: number
  phaseTotalMs: number // Infinity si no tiene fin
  focusMs: number // tiempo de foco acumulado (lo que se guarda)
  focusCount: number // focos completos/iniciados
}

const MIN = 60_000

export function focusState(t: Technique, elapsedMs: number): FocusState {
  // Sin ciclos: todo el tiempo cuenta como foco.
  if (!Number.isFinite(t.focusMin)) {
    const warm = (t.warmupMin ?? 0) * MIN
    if (warm && elapsedMs < warm) {
      return { phase: 'warmup', phaseIndex: 0, phaseElapsedMs: elapsedMs, phaseTotalMs: warm, focusMs: elapsedMs, focusCount: 1 }
    }
    return { phase: 'focus', phaseIndex: warm ? 1 : 0, phaseElapsedMs: elapsedMs - warm, phaseTotalMs: Infinity, focusMs: elapsedMs, focusCount: 1 }
  }
  let rest = elapsedMs
  let focusMs = 0
  let index = 0
  let focusCount = 0
  for (let guard = 0; guard < 1000; guard++) {
    // Foco
    const f = t.focusMin * MIN
    focusCount++
    if (rest < f) return { phase: 'focus', phaseIndex: index, phaseElapsedMs: rest, phaseTotalMs: f, focusMs: focusMs + rest, focusCount }
    rest -= f
    focusMs += f
    index++
    // Descanso (largo cada N)
    const long = t.longEvery && focusCount % t.longEvery === 0
    const b = (long ? t.longBreakMin ?? t.breakMin : t.breakMin) * MIN
    if (rest < b) return { phase: 'break', phaseIndex: index, phaseElapsedMs: rest, phaseTotalMs: b, focusMs, focusCount }
    rest -= b
    index++
  }
  return { phase: 'focus', phaseIndex: index, phaseElapsedMs: 0, phaseTotalMs: t.focusMin * MIN, focusMs, focusCount }
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

/** Técnicas de estudio y lectura (guía breve, sin temporizador). */
export const STUDY_TIPS: { title: string; body: string; for: 'estudio' | 'lectura' }[] = [
  { for: 'estudio', title: 'Recuerdo activo', body: 'Cerrá el material e intentá explicar o escribir lo que recordás. Recuperar la información fija más que releerla.' },
  { for: 'estudio', title: 'Repetición espaciada', body: 'Repasá un tema al día siguiente, a los 3 días y a la semana. Menos tiempo total, más memoria a largo plazo.' },
  { for: 'estudio', title: 'Técnica Feynman', body: 'Explicá el tema con palabras simples, como a alguien que no sabe nada. Donde te trabás, ahí está lo que falta estudiar.' },
  { for: 'estudio', title: 'Práctica intercalada', body: 'Mezclá ejercicios de distintos temas en la misma sesión en vez de hacer todos los del mismo tipo seguidos.' },
  { for: 'lectura', title: 'Método SQ3R', body: 'Explorá el texto, hacete preguntas, leé buscando respuestas, recitá lo principal y repasá al final.' },
  { for: 'lectura', title: 'Leer con una pregunta', body: 'Antes de empezar, escribí qué querés sacar del capítulo. Leés con foco y retenés más.' },
  { for: 'lectura', title: 'Resumen de 3 líneas', body: 'Al cerrar el libro, anotá en 3 líneas la idea central. Sirve para la nota del día.' },
]
