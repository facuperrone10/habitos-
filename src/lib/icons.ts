import {
  Bike, BookOpen, Brain, Briefcase, Circle, Code, Coffee, Droplet, Dumbbell, GraduationCap,
  HeartPulse, House, Leaf, Moon, Music, PenLine, Smile, Sun, Target, Users, Utensils, Wallet,
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
  brain: Brain,
  bike: Bike,
  code: Code,
  coffee: Coffee,
  droplet: Droplet,
  home: House,
  leaf: Leaf,
  moon: Moon,
  music: Music,
  pen: PenLine,
  smile: Smile,
  sun: Sun,
  target: Target,
  users: Users,
  food: Utensils,
}

// Colores disponibles para secciones (los 6 originales primero).
export const SECTION_COLORS = [
  '#E5484D', '#F76B15', '#3E63DD', '#12A594', '#8E4EC6', '#30A46C',
  '#D6890B', '#D6409F', '#0090FF', '#A18072', '#6E7781',
]

export function sectionIcon(key: string): LucideIcon {
  return SECTION_ICONS[key] ?? Circle
}
