import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { requestPersistence } from './db/db'
import './index.css'
import { applyTheme, storedTheme, watchSystemTheme } from './lib/theme'

requestPersistence()
applyTheme(storedTheme())
watchSystemTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
