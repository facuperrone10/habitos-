// Fechas como 'YYYY-MM-DD' en hora local (nunca timestamps, ver riesgo #2 de la fase 1).

const pad = (n: number) => String(n).padStart(2, '0')

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d) // mediodía no necesario: se construye en hora local
}

export function todayKey(): string {
  return toKey(new Date())
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

const fmt = new Intl.DateTimeFormat('es-UY', { weekday: 'long', day: 'numeric', month: 'short' })

export function formatLong(key: string): string {
  const s = fmt.format(fromKey(key)).replace('.', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function relativeLabel(key: string, today: string): string | null {
  if (key === today) return 'Hoy'
  if (key === addDays(today, -1)) return 'Ayer'
  return null
}
