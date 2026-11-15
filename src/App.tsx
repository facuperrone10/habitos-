import { useState } from 'react'
import { BottomNav, type Tab } from './components/BottomNav'
import { UpdatePrompt } from './components/UpdatePrompt'
import { PlaceholderScreen } from './screens/PlaceholderScreen'
import { TodayScreen } from './screens/TodayScreen'

export default function App() {
  const [tab, setTab] = useState<Tab>('hoy')

  return (
    <>
      <UpdatePrompt />
      <main className="mx-auto max-w-md px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {tab === 'hoy' && <TodayScreen />}
        {tab === 'calendario' && <PlaceholderScreen title="Calendario" phase="fase 3" />}
        {tab === 'stats' && <PlaceholderScreen title="Estadísticas" phase="fase 4" />}
        {tab === 'ajustes' && <PlaceholderScreen title="Ajustes" phase="fase 5" />}
      </main>
      <BottomNav tab={tab} onChange={setTab} />
    </>
  )
}
