// Utilidades de animación. Todo respeta "Reducir movimiento" de iOS.

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// "Pop" al marcar: se achica y rebota. Web Animations API (soportada en Safari).
export function pop(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.92)', offset: 0.3 }, { transform: 'scale(1.06)', offset: 0.65 }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' },
  )
}

// Pequeño salto para contadores.
export function bump(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(1)' }],
    { duration: 280, easing: 'ease-out' },
  )
}
