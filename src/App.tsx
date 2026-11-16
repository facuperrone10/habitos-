import { useCallback, useMemo, useState } from 'react'
import { AchievementToast } from './components/AchievementToast'
import { FocusOverlay } from './components/FocusOverlay'
import { Toast, type ToastData } from './components/Toast'
import { addMinutes } from './db/repo'
import { setSetting, useSetting } from './hooks/useSetting'
import type { FocusSession, TechniqueId } from './lib/focus'
import { BottomNav, type Tab } from './components/BottomNav'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useAchievementWatcher } from './hooks/useAchievementWatcher'
import { useAllData } from './hooks/useAllData'
import { useToday } from './hooks/useToday'
import { computeAchievements } from './lib/achievements'
import { todayKey } from './lib/date'
import { computeIndex } from './lib/onePercent'
import { CalendarScreen } from './screens/CalendarScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen, type StatsView } from './screens/StatsScreen'
import { TodayScreen } from './screens/TodayScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  const [statsView, setStatsView] = useState<StatsView>('progreso')
  // La fecha vive acá para que el calendario pueda abrir un día en "Hoy".
  const [date, setDate] = useState(todayKey)
  const today = useToday()

  // Datos globales: índice 1% y logros se calculan una vez y se comparten.
  const data = useAllData()
  const indexPoints = useMemo(() => (data ? computeIndex(data.actions, data.logs, today) : []), [data, today])
  const achievements = useMemo(
    () => (data ? computeAchievements(data.sections, data.actions, data.logs, indexPoints) : undefined),
    [data, indexPoints],
  )
  const { current: unlock, next: nextUnlock } = useAchievementWatcher(achievements)

  // Sesión de foco: se guarda en la base para sobrevivir si iOS cierra la app.
  const focus = useSetting<FocusSession | null>('focusSession', null)
  const [focusMin, setFocusMin] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const focusAction = focus ? data?.actions.find((a) => a.id === focus.actionId) : undefined
  const focusColor = focusAction ? data?.sections.find((s) => s.id === focusAction.sectionId)?.color ?? '#1f2328' : '#1f2328'

  const startFocus = (actionId: string, techniqueId: TechniqueId) => {
    setFocusMin(false)
    setSetting('focusSession', { actionId, techniqueId, date, startedAt: Date.now() } satisfies FocusSession)
  }
  const finishFocus = async (minutes: number) => {
    if (!focus) return
    await setSetting('focusSession', null)
    if (minutes < 1) {
      setToast({ id: Date.now(), text: 'Menos de 1 minuto: no se guardó', color: '#6E7781' })
      return
    }
    await addMinutes(focus.date, focus.actionId, minutes)
    setToast({ id: Date.now(), text: `+${minutes} min · ${focusAction?.name ?? ''}`, color: focusColor })
  }

  const go = useCallback((t: Tab, view?: StatsView) => {
    if (view) setStatsView(view)
    setTab(t)
    window.scrollTo({ top: 0 })
  }, [])

  const changeTab = (t: Tab) => {
    if (t === 'hoy' && tab === 'hoy') setDate(todayKey()) // tocar "Hoy" estando en Hoy vuelve a hoy
    go(t)
  }

  return (
    <>
      <UpdatePrompt />
      <AchievementToast event={unlock} onDone={nextUnlock} onOpen={() => go('stats', 'logros')} />
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {tab === 'hoy' && <TodayScreen date={date} setDate={setDate} indexPoints={indexPoints} onOpenStats={() => go('stats', 'progreso')} onStartFocus={startFocus} />}
        {tab === 'calendario' && (
          <CalendarScreen
            onSelectDay={(d) => {
              setDate(d)
              go('hoy')
            }}
          />
        )}
        {tab === 'stats' && data && achievements && (
          <StatsScreen view={statsView} setView={setStatsView} data={data} indexPoints={indexPoints} achievements={achievements} />
        )}
        {tab === 'ajustes' && <SettingsScreen />}
      </main>
      <BottomNav tab={tab} onChange={changeTab} />
      {focus && focusAction && (
        <FocusOverlay
          session={focus}
          actionName={focusAction.name}
          color={focusColor}
          minimized={focusMin}
          onMinimize={setFocusMin}
          onFinish={finishFocus}
          onCancel={() => setSetting('focusSession', null)}
        />
      )}
      <Toast toast={toast} onDone={clearToast} />
    </>
  )
}
