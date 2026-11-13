'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { actions } from '@/lib/store'
import {
  DAY_SHORT,
  FORMATS,
  addDays,
  buildSessions,
  draftFor,
  nextFriday,
  parseISODate,
  toISODate,
  type Format,
  type SessionDraft,
} from '@/lib/f1'
import { Hero } from './art'

export function CreateScreen({ onCreated, onCancel }: { onCreated: () => void; onCancel?: () => void }) {
  const [name, setName] = useState('')
  const [place, setPlace] = useState('')
  const [date, setDate] = useState(() => toISODate(addDays(nextFriday(new Date(), 2), 28)))
  const [format, setFormat] = useState<Format>('std')
  const [sessions, setSessions] = useState<SessionDraft>(() => draftFor('std'))
  const [invalid, setInvalid] = useState(false)
  const [toast, setToast] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  const changeFormat = (f: Format) => {
    setFormat(f)
    setSessions(draftFor(f))
  }

  const fridayWarning = date && parseISODate(date).getDay() !== 5

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const title = name.trim()
    if (!title) {
      setInvalid(true)
      nameRef.current?.focus()
      return
    }
    const fullName = /^гран-при/i.test(title) ? title : `Гран-при ${title}`
    actions.addEvent({
      name: fullName,
      place: place.trim() || 'Место уточняется',
      format,
      start: date,
      sessions: buildSessions(date, format, sessions),
    })
    setInvalid(false)
    setToast(true)
    setTimeout(() => {
      setToast(false)
      onCreated()
    }, 1200)
  }

  return (
    <>
      <form className="scroll solo" onSubmit={submit} noValidate>
        <Hero image="/img/lights.jpg" pos="40%" eyebrow="Свой уикенд" title="Новый этап" />
        {onCancel && (
          <button type="button" className="back" onClick={onCancel} style={{ marginBottom: 12 }}>
            <ArrowLeft size={18} aria-hidden="true" />
            Назад
          </button>
        )}

        <label className="field">
          <span>Гран-при</span>
          <input
            ref={nameRef}
            className="inp"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (invalid) setInvalid(false)
            }}
            placeholder="Японии"
            aria-invalid={invalid}
            aria-describedby={invalid ? 'name-error' : undefined}
            autoComplete="off"
          />
          {invalid && (
            <span id="name-error" className="errmsg">
              Укажи название Гран-при
            </span>
          )}
        </label>
        <label className="field">
          <span>Место</span>
          <input className="inp" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Сузука, Япония" autoComplete="off" />
        </label>
        <label className="field">
          <span>Пятница уикенда</span>
          <input type="date" className="inp" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          {fridayWarning && <span className="hint">Выбранный день не пятница — сессии начнутся с этой даты.</span>}
        </label>

        <div className="field">
          <span>Формат</span>
          <div className="seg" role="group" aria-label="Формат уикенда">
            <button type="button" aria-pressed={format === 'std'} onClick={() => changeFormat('std')}>
              Обычный
            </button>
            <button type="button" aria-pressed={format === 'sprint'} onClick={() => changeFormat('sprint')}>
              Со спринтом
            </button>
          </div>
        </div>

        <div className="field">
          <span>Сессии</span>
          <ul>
            {FORMATS[format].map((tpl) => (
              <li key={tpl.key} className="sesrow">
                <span>{tpl.label}</span>
                <span className="dd">{DAY_SHORT[tpl.day]}</span>
                <input
                  type="time"
                  className="inp"
                  value={sessions[tpl.key].time}
                  aria-label={`Время: ${tpl.label}`}
                  onChange={(e) => e.target.value && setSessions((s) => ({ ...s, [tpl.key]: { time: e.target.value } }))}
                />
              </li>
            ))}
          </ul>
        </div>

        <button type="submit" className="btn">
          Добавить в календарь
          <ArrowRight size={20} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </form>
      {toast && (
        <div className="toast" role="status" style={{ bottom: 'calc(24px + var(--bottom))' }}>
          Уикенд добавлен в календарь
        </div>
      )}
    </>
  )
}
