import { HardDriveDownload, X } from 'lucide-react'
import { useState } from 'react'
import { useSetting } from '../hooks/useSetting'
import { exportJSON } from '../lib/backup'
import { addDays, fromKey, todayKey } from '../lib/date'

const SNOOZE_KEY = 'habitos-backup-snooze'

/** Aviso en "Hoy" si pasaron 7+ días sin respaldar. "×" lo pospone 3 días. */
export function BackupBanner({ firstLogDate }: { firstLogDate: string | null }) {
  const enabled = useSetting('backupReminderEnabled', true)
  const lastBackupAt = useSetting<string | null>('lastBackupAt', null)
  const [snoozedUntil, setSnoozedUntil] = useState(() => {
    try { return localStorage.getItem(SNOOZE_KEY) ?? '' } catch { return '' }
  })

  const today = todayKey()
  if (!enabled || !firstLogDate || snoozedUntil > today) return null

  // Referencia: último respaldo, o el primer registro si nunca respaldaste.
  const ref = lastBackupAt ? new Date(lastBackupAt) : fromKey(firstLogDate)
  const days = Math.floor((Date.now() - ref.getTime()) / 86_400_000)
  if (days < 7) return null

  const snooze = () => {
    const until = addDays(today, 3)
    try { localStorage.setItem(SNOOZE_KEY, until) } catch { /* nada */ }
    setSnoozedUntil(until)
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface py-2.5 pr-2 pl-4 shadow-sm ring-1 ring-black/5">
      <HardDriveDownload size={20} className="shrink-0 text-neutral-500" />
      <span className="flex-1 text-sm text-neutral-700">
        {lastBackupAt ? `Hace ${days} días que no respaldás.` : 'Todavía no respaldaste tus datos.'}
      </span>
      <button type="button" onClick={() => exportJSON()} className="rounded-full px-3 py-1.5 text-sm font-semibold text-white" style={{ background: '#3E63DD' }}>
        Respaldar
      </button>
      <button type="button" aria-label="Más tarde" onClick={snooze} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400">
        <X size={18} />
      </button>
    </div>
  )
}
