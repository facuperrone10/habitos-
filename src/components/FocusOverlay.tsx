import { ChevronDown, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { focusState, formatClock, techniqueById, type FocusSession } from '../lib/focus'
import { pop } from '../lib/motion'
import { playChime } from '../lib/sound'
import { keepAwake } from '../lib/wakeLock'

interface Props {
  session: FocusSession
  actionName: string
  color: string
  minimized: boolean
  onMinimize: (m: boolean) => void
  onFinish: (minutes: number) => void
  onCancel: () => void
}

const PHASE_LABEL = { warmup: 'Solo 2 minutos', focus: 'Foco', break: 'Descanso' } as const

/**
 * Sesión en curso. Pantalla completa o "píldora" minimizada sobre la barra inferior.
 * Al cambiar de fase suena una campana (si la app está abierta) y la pantalla queda encendida.
 */
export function FocusOverlay({ session, actionName, color, minimized, onMinimize, onFinish, onCancel }: Props) {
  const t = techniqueById(session.techniqueId)
  const [now, setNow] = useState(Date.now())
  const [confirmCancel, setConfirmCancel] = useState(false)
  const lastPhase = useRef<number | null>(null)
  const clockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500)
    const vis = () => setNow(Date.now())
    document.addEventListener('visibilitychange', vis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  useEffect(() => {
    keepAwake(!minimized)
    return () => keepAwake(false)
  }, [minimized])

  const st = focusState(t, now - session.startedAt)
  const minutes = Math.floor(st.focusMs / 60_000)

  // Aviso de cambio de fase.
  useEffect(() => {
    if (lastPhase.current !== null && st.phaseIndex !== lastPhase.current) {
      playChime()
      pop(clockRef.current)
    }
    lastPhase.current = st.phaseIndex
  }, [st.phaseIndex])

  const finite = Number.isFinite(st.phaseTotalMs)
  const shown = finite ? st.phaseTotalMs - st.phaseElapsedMs : st.phaseElapsedMs
  const progress = finite ? st.phaseElapsedMs / st.phaseTotalMs : (st.phaseElapsedMs % 60_000) / 60_000
  const ringColor = st.phase === 'break' ? '#30A46C' : color
  const R = 112
  const C = 2 * Math.PI * R

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => onMinimize(false)}
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+70px)] z-30 mx-auto flex max-w-md items-center gap-3 rounded-full py-2.5 pr-5 pl-3 text-left text-white shadow-xl"
        style={{ background: ringColor }}
      >
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{PHASE_LABEL[st.phase]} · {actionName}</span>
        <span className="font-mono text-base font-bold tabular-nums">{formatClock(shown)}</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-page px-6 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+20px)]">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Minimizar" onClick={() => onMinimize(true)} className="nav-btn"><ChevronDown size={24} /></button>
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{t.name}</div>
          <div className="text-[15px] font-bold text-neutral-900">{actionName}</div>
        </div>
        <button type="button" aria-label="Cancelar sesión" onClick={() => setConfirmCancel(true)} className="nav-btn"><X size={22} /></button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div ref={clockRef} className="relative">
          <svg width={260} height={260} viewBox="0 0 260 260" aria-hidden>
            <circle cx={130} cy={130} r={R} fill="none" stroke="var(--color-neutral-200)" strokeWidth={10} />
            <circle
              cx={130} cy={130} r={R} fill="none" stroke={ringColor} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 130 130)"
              style={{ transition: 'stroke-dashoffset 500ms linear, stroke 300ms' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-sm font-semibold" style={{ color: ringColor }}>{PHASE_LABEL[st.phase]}</div>
            <div className="font-mono text-[52px] leading-none font-bold tabular-nums text-neutral-900">{formatClock(shown)}</div>
            {t.longEvery || Number.isFinite(t.focusMin) ? (
              <div className="mt-1 text-xs text-neutral-400">Ciclo {st.focusCount}</div>
            ) : null}
          </div>
        </div>
        <div className="mt-6 text-center">
          <div className="text-3xl font-bold tabular-nums text-neutral-900">{minutes} min</div>
          <div className="text-sm text-neutral-500">de foco acumulados</div>
        </div>
        {session.techniqueId === 'two-min' && st.phase === 'focus' && (
          <p className="mt-3 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">¡Arrancaste! Ya cumpliste los 2 minutos</p>
        )}
        <p className="mt-6 max-w-xs text-center text-sm leading-relaxed text-neutral-500">{t.tip}</p>
      </div>

      <button
        type="button"
        onClick={() => onFinish(Math.max(minutes, 0))}
        className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white"
        style={{ background: color }}
      >
        <Square size={16} fill="white" /> Terminar y guardar
      </button>
      <p className="mt-2 text-center text-xs text-neutral-400">La pantalla queda encendida. Si la bloqueás, el tiempo sigue contando.</p>

      {confirmCancel && (
        <ConfirmDialog title="¿Cancelar la sesión?" confirmLabel="Descartar" danger onCancel={() => setConfirmCancel(false)} onConfirm={onCancel}>
          Se pierden los {minutes} min de esta sesión.
        </ConfirmDialog>
      )}
    </div>
  )
}
