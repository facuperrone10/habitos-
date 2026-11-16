import { useCallback, useEffect, useRef, useState } from 'react'
import { BackupBanner } from '../components/BackupBanner'
import { FocusPicker } from '../components/FocusPicker'
import { OnePercentCard } from '../components/OnePercentCard'
import type { TechniqueId } from '../lib/focus'
import { unlockAudio } from '../lib/sound'
import type { IndexPoint } from '../lib/onePercent'
import { DateHeader } from '../components/DateHeader'
import { EditSectionSheet } from '../components/EditSectionSheet'
import { MoodPicker } from '../components/MoodPicker'
import { NoteField } from '../components/NoteField'
import { SectionCard } from '../components/SectionCard'
import { Toast, type ToastData } from '../components/Toast'
import { ValueSheet } from '../components/ValueSheet'
import type { Action, Section } from '../db/types'
import { getSetting, markCelebrated, setLogValue, setMood, setNote, toggleAction } from '../db/repo'
import { useDayData } from '../hooks/useDayData'
import { useHistory } from '../hooks/useHistory'
import { useToday } from '../hooks/useToday'
import { celebrateDay } from '../lib/confetti'
import { formatLong } from '../lib/date'
import { isDayComplete, isSectionComplete } from '../lib/progress'
import { playTick } from '../lib/sound'
import { currentStreak } from '../lib/streaks'

interface Props {
  date: string
  setDate: (date: string) => void
  indexPoints: IndexPoint[]
  onOpenStats: () => void
  onStartFocus: (actionId: string, techniqueId: TechniqueId) => void
}

export function TodayScreen({ date, setDate, indexPoints, onOpenStats, onStartFocus }: Props) {
  const today = useToday()
  const data = useDayData(date)
  const history = useHistory()
  const streakOf = (dates: Set<string> | undefined) => (dates ? currentStreak(dates, date, today) : 0)

  const [editing, setEditing] = useState<Action | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [timerFor, setTimerFor] = useState<Action | null>(null)
  const [glowId, setGlowId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  // Si estabas en "hoy" y pasa la medianoche, se mueve al nuevo hoy.
  const prevToday = useRef(today)
  useEffect(() => {
    if (date === prevToday.current) setDate(today)
    prevToday.current = today
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  const onToggle = async (action: Action) => {
    if (!data) return
    const before = new Set(data.logsByAction.keys())
    const nowDone = await toggleAction(date, action)
    if ((await getSetting('soundEnabled', false))) playTick(nowDone)
    if (!nowDone) return

    const after = new Set(before).add(action.id)
    const section = data.sections.find((s) => s.section.id === action.sectionId)

    // Día completo: confeti, una sola vez por día.
    if (!isDayComplete(data.sections, before) && isDayComplete(data.sections, after) && !data.day?.celebratedAt) {
      await markCelebrated(date)
      celebrateDay(data.sections.map((s) => s.section.color))
      setToast({ id: Date.now(), text: '¡Día completo! 🎉', color: '#1f2328' })
      return
    }

    // Sección completa: brillo + aviso.
    if (section && !isSectionComplete(section, before) && isSectionComplete(section, after)) {
      setGlowId(section.section.id)
      window.setTimeout(() => setGlowId(null), 1200)
      setToast({ id: Date.now(), text: `${section.section.name} completa ✓`, color: section.section.color })
    }
  }

  if (!data || !history) return null
  const firstLogDate = history.byDate.size ? [...history.byDate.keys()].sort()[0] : null

  const editingColor = editing ? data.sections.find((s) => s.section.id === editing.sectionId)?.section.color : undefined

  return (
    <div className="space-y-4">
      <DateHeader date={date} today={today} onChange={setDate} streak={streakOf(history?.general)} />

      {date !== today && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
          <span>Editando {formatLong(date).toLowerCase()}</span>
          <button type="button" className="font-semibold" onClick={() => setDate(today)}>
            Volver a hoy
          </button>
        </div>
      )}

      {date === today && <OnePercentCard points={indexPoints} onOpen={onOpenStats} />}

      {date === today && <BackupBanner firstLogDate={firstLogDate} />}

      <MoodPicker mood={data.day?.mood ?? null} onChange={(m) => setMood(date, m)} />

      {data.sections.map((s) => (
        <SectionCard
          key={`${date}-${s.section.id}`} // remonta al cambiar de día: el "+1" solo aparece al marcar
          data={s}
          logsByAction={data.logsByAction}
          glowing={glowId === s.section.id}
          sectionStreak={streakOf(history?.bySection.get(s.section.id))}
          votes={s.actions.reduce((n, a) => n + (history.byAction.get(a.id)?.size ?? 0), 0)}
          actionStreak={(id) => streakOf(history?.byAction.get(id))}
          onToggle={onToggle}
          onEditValue={setEditing}
          onEditSection={() => setEditingSection(s.section)}
          onStartTimer={setTimerFor}
        />
      ))}

      <NoteField date={date} note={data.day?.note ?? null} onSave={(n) => setNote(date, n)} />

      {editing && (
        <ValueSheet
          action={editing}
          color={editingColor ?? '#1f2328'}
          value={data.logsByAction.get(editing.id)?.value ?? null}
          onSave={(v) => setLogValue(date, editing.id, v)}
          onClose={() => setEditing(null)}
        />
      )}

      {timerFor && (() => {
        const sec = data.sections.find((x) => x.section.id === timerFor.sectionId)?.section
        return (
          <FocusPicker
            action={timerFor}
            color={sec?.color ?? '#1f2328'}
            sectionName={sec?.name ?? ''}
            onClose={() => setTimerFor(null)}
            onStart={(tid) => {
              unlockAudio() // iOS solo habilita el sonido dentro de un toque
              onStartFocus(timerFor.id, tid)
              setTimerFor(null)
            }}
          />
        )
      })()}

      {editingSection && (
        <EditSectionSheet section={editingSection} onClose={() => setEditingSection(null)} />
      )}

      <Toast toast={toast} onDone={clearToast} />
    </div>
  )
}
