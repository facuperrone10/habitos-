import { useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { UpdatePrompt } from './components/UpdatePrompt'
import { todayKey } from './lib/date'
import { CalendarScreen } from './screens/CalendarScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen } from './screens/StatsScreen'
import { TodayScreen } from './screens/TodayScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')
  // La fecha vive acá para que el calendario pueda abrir un día en "Hoy".
  const [date, setDate] = useState(todayKey)

  const changeTab = (t: Tab) => {
    if (t === 'hoy' && tab === 'hoy') setDate(todayKey()) // tocar "Hoy" estando en Hoy vuelve a hoy
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <UpdatePrompt />
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {tab === 'hoy' && <TodayScreen date={date} setDate={setDate} />}
        {tab === 'calendario' && (
          <CalendarScreen
            onSelectDay={(d) => {
              setDate(d)
              setTab('hoy')
              window.scrollTo({ top: 0 })
            }}
          />
        )}
        {tab === 'stats' && <StatsScreen />}
        {tab === 'ajustes' && <SettingsScreen />}
      </main>
      <BottomNav tab={tab} onChange={changeTab} />
    </>
  )
}
