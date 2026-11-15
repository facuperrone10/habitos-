# Hábitos — PWA de registro diario (fase 2)

## Requisitos
- Node.js 20 o superior (`node -v`)

## Correr en la computadora
```bash
npm install
npm run dev
```
Abrí la URL "Local" que muestra la terminal (ej. http://localhost:5173).
En Chrome/Safari de escritorio usá el modo dispositivo (iPhone 13) de las DevTools.

## Probar en el iPhone (misma red Wi-Fi)
1. `npm run dev` muestra también una URL "Network", ej. `http://192.168.1.20:5173`.
2. Abrila en Safari del iPhone.
3. Opcional: Compartir → "Agregar a pantalla de inicio" para verla a pantalla completa.

Notas de la prueba por red local:
- Por ser http (no https) el service worker no se activa: el modo offline real se prueba
  después del deploy (fase 6). Todo lo demás funciona igual.
- Los datos quedan guardados por dirección: lo que registres en `192.168.x.x` NO pasa a la
  versión final. Usalo solo para probar.
- Si la computadora tiene firewall, permití conexiones entrantes al puerto 5173.

## Build de producción
```bash
npm run build     # chequea tipos + genera dist/
npm run preview   # sirve dist/ para probar
```

## Estructura
```
src/
  db/          types.ts (modelo) · db.ts (Dexie, esquema v1) · seed.ts (secciones y acciones por defecto) · repo.ts (escrituras)
  hooks/       useToday (cambio de día) · useDayData (lectura reactiva del día)
  lib/         date (fechas locales YYYY-MM-DD) · motion (pop/bump) · confetti · sound · progress (sección/día completo) · icons
  components/  ActionChip · SectionCard · MoodPicker · DateHeader · NoteField · ValueSheet · Toast · BottomNav · UpdatePrompt
  screens/     TodayScreen · PlaceholderScreen
```

## Resetear datos (para pruebas)
Safari/Chrome → DevTools → Application/Storage → IndexedDB → borrar `habitos` y recargar:
se vuelven a cargar las secciones por defecto.
