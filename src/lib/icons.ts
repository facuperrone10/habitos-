import {
  BookOpen, Briefcase, Dumbbell, GraduationCap, HeartPulse, Wallet, Circle,
  type LucideIcon,
} from 'lucide-react'

// Registro de íconos para secciones. La base guarda la clave, no el componente.
export const SECTION_ICONS: Record<string, LucideIcon> = {
  heart: HeartPulse,
  dumbbell: Dumbbell,
  graduation: GraduationCap,
  briefcase: Briefcase,
  book: BookOpen,
  wallet: Wallet,
}

export function sectionIcon(key: string): LucideIcon {
  return SECTION_ICONS[key] ?? Circle
}
