import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, BellRing, ChevronRight, Download, FileSpreadsheet, Plus, Upload } from 'lucide-react'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EditSectionSheet } from '../components/EditSectionSheet'
import { SectionMetaSheet, Switch } from '../components/SectionMetaSheet'
import { Toast, type ToastData } from '../components/Toast'
import { db } from '../db/db'
import { addSection, moveSection } from '../db/repo'
import type { Section } from '../db/types'
import { setSetting, useSetting } from '../hooks/useSetting'
import { exportCSV, exportJSON, readBackup, restoreBackup, type ImportSummary } from '../lib/backup'
import { formatLong, toKey } from '../lib/date'
import { SECTION_COLORS, sectionIcon } from '../lib/icons'
import { setTheme, storedTheme, type Theme } from '../lib/theme'

const THEMES: { id: Theme; label: string }[] = [
  { id: 'system', label: 'Automático' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
]

export function SettingsScreen() {
  const sections = useLiveQuery(() => db.sections.orderBy('order').filter((s) => !s.archivedAt).toArray())
  const sound = useSetting('soundEnabled', false)
  const backupReminder = useSetting('backupReminderEnabled', true)
  const lastBackupAt = useSetting<string | null>('lastBackupAt', null)

  const [theme, setThemeState] = useState<Theme>(storedTheme)
  const [metaId, setMetaId] = useState<string | null>(null)
  const [actionsOf, setActionsOf] = useState<Section | null>(null)
  const [pendingImport, setPendingImport] = useState<ImportSummary | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const clearToast = useCallback(() => setToast(null), [])
  const fileRef = useRef<HTMLInputElement>(null)

  const notify = (text: string, color = '#1f2328') => setToast({ id: Date.now(), text, color })

  const createSection = async () => {
    const used = new Set(sections?.map((s) => s.color))
    const color = SECTION_COLORS.find((c) => !used.has(c)) ?? SECTION_COLORS[0]
    const id = await addSection('Nueva sección', color, 'target')
    setMetaId(id)
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      setPendingImport(await readBackup(f))
    } catch (e) {
      notify((e as Error).message, '#E5484D')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const run = async (fn: () => Promise<boolean>, okText: string) => {
    try {
      if (await fn()) notify(okText, '#30A46C')
    } catch {
      notify('No se pudo exportar', '#E5484D')
    }
  }

  if (!sections) return null
  const metaSection = sections.find((s) => s.id === metaId)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Ajustes</h1>

      {/* ---------- Secciones ---------- */}
      <Group title="Secciones">
        {sections.map((s, i) => {
          const Icon = sectionIcon(s.icon)
          return (
            <div key={s.id} className="flex items-center gap-1 py-1.5 pr-1 pl-3">
              <button type="button" onClick={() => setMetaId(s.id)} className="flex min-w-0 flex-1 items-center gap-3 py-1.5 text-left">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: s.color, opacity: s.hidden ? 0.4 : 1 }}>
                  <Icon size={17} strokeWidth={2.3} />
                </span>
                <span className={`truncate text-[15px] font-semibold ${s.hidden ? 'text-neutral-400' : 'text-neutral-800'}`}>{s.name}</span>
                {s.hidden && <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-500">Oculta</span>}
              </button>
              <IconBtn label="Subir" disabled={i === 0} onClick={() => moveSection(s.id, -1)}><ArrowUp size={18} /></IconBtn>
              <IconBtn label="Bajar" disabled={i === sections.length - 1} onClick={() => moveSection(s.id, 1)}><ArrowDown size={18} /></IconBtn>
              <IconBtn label={`Editar ${s.name}`} onClick={() => setMetaId(s.id)}><ChevronRight size={18} /></IconBtn>
            </div>
          )
        })}
        <button type="button" onClick={createSection} className="flex w-full items-center gap-3 px-3 py-3 text-left">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500"><Plus size={18} /></span>
          <span className="text-[15px] font-semibold text-neutral-500">Nueva sección</span>
        </button>
      </Group>

      {/* ---------- Apariencia ---------- */}
      <Group title="Apariencia">
        <div className="px-3 py-3">
          <div className="mb-2 text-[15px] font-semibold text-neutral-800">Tema</div>
          <div className="flex rounded-xl bg-neutral-100 p-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={theme === t.id}
                onClick={() => { setTheme(t.id); setThemeState(t.id) }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${theme === t.id ? 'bg-surface text-neutral-900 shadow-sm' : 'text-neutral-500'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <ToggleRow label="Sonido al marcar" hint="Un 'tic' suave al marcar una acción." on={sound} onToggle={() => setSetting('soundEnabled', !sound)} />
      </Group>

      {/* ---------- Respaldo ---------- */}
      <Group title="Respaldo" footer={lastBackupAt ? `Último respaldo: ${formatLong(toKey(new Date(lastBackupAt))).toLowerCase()}.` : 'Todavía no hiciste ningún respaldo.'}>
        <ActionRow icon={<Download size={19} />} label="Exportar respaldo" hint="Archivo JSON para restaurar la app" onClick={() => run(exportJSON, 'Respaldo exportado')} />
        <ActionRow icon={<FileSpreadsheet size={19} />} label="Exportar a Excel" hint="CSV con todos tus registros" onClick={() => run(exportCSV, 'CSV exportado')} />
        <ActionRow icon={<Upload size={19} />} label="Importar respaldo" hint="Reemplaza los datos actuales" onClick={() => fileRef.current?.click()} />
        <ToggleRow label="Aviso semanal" hint={'Te avisa en "Hoy" si pasaron 7 días sin respaldar.'} on={backupReminder} onToggle={() => setSetting('backupReminderEnabled', !backupReminder)} />
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </Group>

      {/* ---------- Recordatorio ---------- */}
      <Group title="Recordatorio diario">
        <div className="flex gap-3 px-3 py-3">
          <BellRing size={20} className="mt-0.5 shrink-0 text-neutral-500" />
          <div className="text-sm leading-relaxed text-neutral-600">
            <p className="mb-2">Se configura con la app <b className="text-neutral-800">Recordatorios</b> del iPhone (una sola vez):</p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Abrí <b className="text-neutral-800">Recordatorios</b> y tocá <b className="text-neutral-800">Nuevo recordatorio</b>.</li>
              <li>Escribí "Registrar mi día" y tocá <b className="text-neutral-800">ⓘ</b>.</li>
              <li>Activá <b className="text-neutral-800">Fecha</b> y <b className="text-neutral-800">Hora</b> (ej. 21:30) y en <b className="text-neutral-800">Repetir</b> elegí <b className="text-neutral-800">Diariamente</b>.</li>
            </ol>
            <p className="mt-2 text-xs text-neutral-400">Cuando suene, abrí esta app desde su ícono.</p>
          </div>
        </div>
      </Group>

      <p className="text-center text-xs text-neutral-400">Hábitos · tus datos viven solo en este iPhone</p>

      {metaSection && (
        <SectionMetaSheet
          sectionId={metaSection.id}
          onClose={() => setMetaId(null)}
          onEditActions={() => { setActionsOf(metaSection); setMetaId(null) }}
        />
      )}
      {actionsOf && <EditSectionSheet section={actionsOf} onClose={() => setActionsOf(null)} />}

      {pendingImport && (
        <ConfirmDialog
          title="¿Restaurar este respaldo?"
          confirmLabel="Reemplazar"
          danger
          onCancel={() => setPendingImport(null)}
          onConfirm={async () => {
            const data = pendingImport.file
            setPendingImport(null)
            try {
              await restoreBackup(data)
              notify('Respaldo restaurado', '#30A46C')
            } catch {
              notify('No se pudo restaurar', '#E5484D')
            }
          }}
        >
          <p>
            Respaldo del <b>{formatLong(toKey(new Date(pendingImport.file.exportedAt))).toLowerCase()}</b>:{' '}
            {pendingImport.logs} registros en {pendingImport.days} días.
          </p>
          <p className="mt-2 font-semibold text-red-700">Esto reemplaza todos los datos actuales de la app.</p>
        </ConfirmDialog>
      )}

      <Toast toast={toast} onDone={clearToast} />
    </div>
  )
}

function Group({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</h2>
      <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-black/5">{children}</div>
      {footer && <p className="mt-2 px-1 text-xs text-neutral-400">{footer}</p>}
    </section>
  )
}

function ToggleRow({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onToggle} className="flex w-full items-center gap-3 px-3 py-3 text-left">
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-neutral-800">{label}</span>
        {hint && <span className="block text-xs text-neutral-400">{hint}</span>}
      </span>
      <Switch on={on} />
    </button>
  )
}

function ActionRow({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-neutral-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-neutral-800">{label}</span>
        <span className="block text-xs text-neutral-400">{hint}</span>
      </span>
      <ChevronRight size={18} className="text-neutral-300" />
    </button>
  )
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 active:bg-neutral-100 disabled:opacity-25">
      {children}
    </button>
  )
}
