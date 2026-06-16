import {
  Home, Flame, Sparkles, Bot, Dumbbell, Salad, TrendingUp,
  LayoutDashboard, Users, Calendar, UserCheck, MoreHorizontal, Activity,
  ClipboardList, FileQuestion,
} from 'lucide-react'

const ICON_MAP = {
  Home,
  Flame,
  Sparkles,
  Bot,
  Dumbbell,
  Salad,
  TrendingUp,
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  MoreHorizontal,
  Activity,
  ClipboardList,
  FileQuestion,
}

export function getIcon(name) {
  return ICON_MAP[name] || Home
}
