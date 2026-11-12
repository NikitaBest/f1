'use client'

import { Bell, CalendarDays, Flag, Plus, UserRound } from 'lucide-react'

export type Tab = 'home' | 'calendar' | 'create' | 'alerts' | 'paddock'

const TABS: { id: Tab; label: string; Icon: typeof Flag }[] = [
  { id: 'home', label: 'Уикенд', Icon: Flag },
  { id: 'calendar', label: 'Календарь', Icon: CalendarDays },
  { id: 'alerts', label: 'Алерты', Icon: Bell },
  { id: 'paddock', label: 'Паддок', Icon: UserRound },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const item = ({ id, label, Icon }: (typeof TABS)[number]) => (
    <button
      key={id}
      type="button"
      className="tab"
      aria-current={active === id ? 'page' : undefined}
      onClick={() => onChange(id)}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
      {label}
    </button>
  )
  return (
    <nav className="tabbar" aria-label="Основная навигация">
      {TABS.slice(0, 2).map(item)}
      <button type="button" className="tab-add" aria-label="Добавить этап" onClick={() => onChange('create')}>
        <Plus size={24} strokeWidth={2.8} aria-hidden="true" />
      </button>
      {TABS.slice(2).map(item)}
    </nav>
  )
}
