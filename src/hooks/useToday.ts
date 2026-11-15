import { useEffect, useState } from 'react'
import { todayKey } from '../lib/date'

// Devuelve la fecha de hoy y se actualiza si cambia el día con la app abierta
// o al volver a la app (iOS deja PWAs suspendidas en segundo plano).
export function useToday(): string {
  const [today, setToday] = useState(todayKey)
  useEffect(() => {
    const check = () => setToday(todayKey())
    const id = window.setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}
