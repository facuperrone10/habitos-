// Tema: 'system' sigue al iPhone; 'light' / 'dark' lo fuerzan.
// Se guarda también en localStorage para aplicarlo antes de que cargue React (sin "flash").
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'habitos-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

export function storedTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && media().matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1011' : '#f6f6f4')
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* sin storage: solo dura la sesión */
  }
  applyTheme(theme)
}

/** Reaplica el tema si cambia la apariencia del iPhone (modo 'system'). */
export function watchSystemTheme() {
  media().addEventListener('change', () => applyTheme(storedTheme()))
}
