'use client'

import { CalendarDays, Flag, Newspaper, Settings2, Trophy } from 'lucide-react'

export type Tab = 'home' | 'news' | 'calendar' | 'season' | 'paddock'

const TABS: { id: Tab; label: string; Icon: typeof Flag }[] = [
  { id: 'home', label: 'Уикенд', Icon: Flag },
  { id: 'news', label: 'Новости', Icon: Newspaper },
  { id: 'calendar', label: 'Календарь', Icon: CalendarDays },
  { id: 'season', label: 'Сезон', Icon: Trophy },
  { id: 'paddock', label: 'Паддок', Icon: Settings2 },
]

export function TabBar({ active, onChange }: { active: Tab | null; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Основная навигация">
      {TABS.map(({ id, label, Icon }) => (
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
      ))}
    </nav>
  )
}
