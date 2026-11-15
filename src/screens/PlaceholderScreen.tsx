export function PlaceholderScreen({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-1 text-center">
      <h1 className="text-xl font-bold text-neutral-800">{title}</h1>
      <p className="text-sm text-neutral-400">Llega en la {phase}.</p>
    </div>
  )
}
