import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LineChart } from '../components/LineChart'
import { addMeasurement, deleteMeasurement } from '../db/repo'
import type { Measurement } from '../db/types'
import { setSetting, useSetting } from '../hooks/useSetting'
import { useToday } from '../hooks/useToday'
import { ageFrom, bmi, bmiCategory } from '../lib/bmi'
import { formatLong } from '../lib/date'
import { Card } from './ProgressView'

const fmt1 = (v: number) => v.toLocaleString('es-UY', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const parseNum = (s: string) => Number(s.replace(',', '.'))

export function BodyView({ measurements }: { measurements: Measurement[] }) {
  const today = useToday()
  const heightCm = useSetting<number | null>('heightCm', null)
  const birthDate = useSetting<string | null>('birthDate', null)

  const [heightText, setHeightText] = useState<string | null>(null)
  const [weightText, setWeightText] = useState('')
  const [weightDate, setWeightDate] = useState(today)
  const [error, setError] = useState('')

  const last = measurements.at(-1)
  const prev = measurements.at(-2)
  const currentBmi = last && heightCm ? bmi(last.weightKg, heightCm) : null
  const cat = currentBmi ? bmiCategory(currentBmi) : null

  const saveWeight = async () => {
    const w = parseNum(weightText)
    if (!Number.isFinite(w) || w < 20 || w > 400) {
      setError('Ingresá un peso válido en kg (ej. 74,5).')
      return
    }
    await addMeasurement(weightDate, Math.round(w * 10) / 10)
    setWeightText('')
    setError('')
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Peso actual" value={last ? `${fmt1(last.weightKg)} kg` : '—'}
          hint={last && prev ? `${last.weightKg - prev.weightKg > 0 ? '+' : ''}${fmt1(last.weightKg - prev.weightKg)} kg vs anterior` : undefined} />
        <Tile label="IMC" value={currentBmi ? fmt1(currentBmi) : '—'}
          badge={cat ? { text: cat.label, color: cat.color } : undefined}
          hint={!heightCm ? 'Falta la altura' : undefined} />
      </div>

      {/* Registrar peso */}
      <Card title="Registrar peso">
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); saveWeight() }}>
          <div className="flex flex-1 items-baseline gap-1 rounded-2xl bg-neutral-100 px-4 py-2.5">
            <input
              inputMode="decimal"
              value={weightText}
              onChange={(e) => { setWeightText(e.target.value); setError('') }}
              placeholder="74,5"
              aria-label="Peso en kg"
              className="w-full bg-transparent text-xl font-bold tabular-nums text-neutral-900 outline-none placeholder:text-neutral-300"
            />
            <span className="text-sm font-semibold text-neutral-400">kg</span>
          </div>
          <input
            type="date"
            value={weightDate}
            max={today}
            onChange={(e) => setWeightDate(e.target.value || today)}
            aria-label="Fecha"
            className="w-[124px] rounded-2xl bg-neutral-100 px-3 py-3.5 text-base text-neutral-700 outline-none"
          />
          <button type="submit" className="rounded-2xl px-4 py-3.5 text-[15px] font-semibold text-white" style={{ background: '#30A46C' }}>
            Guardar
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </Card>

      {measurements.length > 0 && (
        <Card title="Evolución del peso" subtitle="kg · tocá el gráfico para ver cada registro">
          <LineChart
            points={measurements.map((m) => ({ date: m.date, value: m.weightKg }))}
            color="var(--ink)"
            format={(v) => `${fmt1(v)} kg`}
            ariaLabel={`Peso: ${measurements.length} registros, último ${fmt1(last!.weightKg)} kg`}
          />
        </Card>
      )}

      {measurements.length > 0 && heightCm && (
        <Card title="Evolución del IMC" subtitle="La franja verde es el rango normal (18,5–25)">
          <LineChart
            points={measurements.map((m) => ({ date: m.date, value: bmi(m.weightKg, heightCm) }))}
            color="#3E63DD"
            format={(v) => `IMC ${fmt1(v)} · ${bmiCategory(v).label}`}
            band={{ from: 18.5, to: 25, label: 'Normal' }}
            ariaLabel={`IMC actual ${currentBmi ? fmt1(currentBmi) : ''}`}
          />
        </Card>
      )}

      {/* Datos personales */}
      <Card title="Tus datos" subtitle="Se cargan una sola vez">
        <div className="grid grid-cols-2 gap-2">
          <label className="rounded-2xl bg-neutral-100 px-4 py-2">
            <span className="block text-xs text-neutral-500">Altura (cm)</span>
            <input
              inputMode="numeric"
              value={heightText ?? (heightCm ? String(heightCm) : '')}
              onChange={(e) => setHeightText(e.target.value)}
              onBlur={() => {
                const h = parseNum(heightText ?? '')
                if (heightText !== null && Number.isFinite(h) && h >= 100 && h <= 250) setSetting('heightCm', Math.round(h))
                setHeightText(null)
              }}
              placeholder="175"
              className="w-full bg-transparent text-lg font-bold text-neutral-900 outline-none placeholder:text-neutral-300"
            />
          </label>
          <label className="rounded-2xl bg-neutral-100 px-4 py-2">
            <span className="block text-xs text-neutral-500">
              Nacimiento{birthDate ? ` · ${ageFrom(birthDate, today)} años` : ''}
            </span>
            <input
              type="date"
              value={birthDate ?? ''}
              max={today}
              onChange={(e) => e.target.value && setSetting('birthDate', e.target.value)}
              className="w-full bg-transparent text-base font-semibold text-neutral-900 outline-none"
            />
          </label>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          IMC = peso ÷ altura². Para adultos no depende de la edad; la edad queda como dato de contexto. Es una referencia general, no un diagnóstico.
        </p>
      </Card>

      {measurements.length > 0 && (
        <Card title="Historial">
          <div className="divide-y divide-neutral-100">
            {[...measurements].reverse().map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-sm text-neutral-600">{formatLong(m.date)}</span>
                <span className="text-sm font-bold tabular-nums text-neutral-900">{fmt1(m.weightKg)} kg</span>
                {heightCm && <span className="w-14 text-right text-xs tabular-nums text-neutral-400">IMC {fmt1(bmi(m.weightKg, heightCm))}</span>}
                <button type="button" aria-label="Borrar registro" onClick={() => deleteMeasurement(m.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 active:bg-neutral-100">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Tile({ label, value, hint, badge }: { label: string; value: string; hint?: string; badge?: { text: string; color: string } }) {
  return (
    <div className="rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-black/5">
      <div className="text-xs font-semibold text-neutral-400">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-neutral-900">{value}</div>
      {badge && (
        <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-neutral-700">
          <span className="h-2 w-2 rounded-full" style={{ background: badge.color }} /> {badge.text}
        </span>
      )}
      {hint && <div className="text-xs text-neutral-400">{hint}</div>}
    </div>
  )
}
