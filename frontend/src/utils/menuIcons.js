import {
  Home, Flame, Sparkles, Bot, Dumbbell, Salad, TrendingUp,
  LayoutDashboard, Users, Calendar, UserCheck, MoreHorizontal, Activity,
  ClipboardList, FileQuestion, Settings2, Settings, BookOpen,
  MessagesSquare, Trophy, Target, Medal, CreditCard, Receipt, Plug, FileText,
  Road,
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
  Settings2,
  Settings,
  BookOpen,
  MessagesSquare,
  Trophy,
  Target,
  Medal,
  CreditCard,
  Receipt,
  Plug,
  FileText,
  Road,
}

export function getIcon(name) {
  return ICON_MAP[name] || Home
}
