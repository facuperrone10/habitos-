// IMC = peso (kg) / altura (m)². Categorías de la OMS para adultos (no dependen de la edad).
export interface BmiCategory {
  label: string
  color: string // color de estado; siempre va con texto
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100
  return weightKg / (m * m)
}

export function bmiCategory(v: number): BmiCategory {
  if (v < 18.5) return { label: 'Bajo peso', color: '#D6890B' }
  if (v < 25) return { label: 'Normal', color: '#30A46C' }
  if (v < 30) return { label: 'Sobrepeso', color: '#D6890B' }
  return { label: 'Obesidad', color: '#E5484D' }
}

export function ageFrom(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number)
  const [ty, tm, td] = today.split('-').map(Number)
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0)
}
