import { useCallback, useEffect, useRef, useState } from 'react'
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
import { useToday } from '../hooks/useToday'
import { celebrateDay } from '../lib/confetti'
import { formatLong } from '../lib/date'
import { isDayComplete, isSectionComplete } from '../lib/progress'
import { playTick } from '../lib/sound'

export function TodayScreen() {
  const today = useToday()
  const [date, setDate] = useState(today)
  const data = useDayData(date)

  const [editing, setEditing] = useState<Action | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
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

  if (!data) return null

  const editingColor = editing ? data.sections.find((s) => s.section.id === editing.sectionId)?.section.color : undefined

  return (
    <div className="space-y-4">
      <DateHeader date={date} today={today} onChange={setDate} />

      {date !== today && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
          <span>Editando {formatLong(date).toLowerCase()}</span>
          <button type="button" className="font-semibold" onClick={() => setDate(today)}>
            Volver a hoy
          </button>
        </div>
      )}

      <MoodPicker mood={data.day?.mood ?? null} onChange={(m) => setMood(date, m)} />

      {data.sections.map((s) => (
        <SectionCard
          key={s.section.id}
          data={s}
          logsByAction={data.logsByAction}
          glowing={glowId === s.section.id}
          onToggle={onToggle}
          onEditValue={setEditing}
          onEditSection={() => setEditingSection(s.section)}
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

      {editingSection && (
        <EditSectionSheet section={editingSection} onClose={() => setEditingSection(null)} />
      )}

      <Toast toast={toast} onDone={clearToast} />
    </div>
  )
}
