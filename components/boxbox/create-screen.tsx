'use client'

import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { actions } from '@/lib/store'
import {
  DAY_SHORT,
  FORMATS,
  REM,
  addDays,
  buildSessions,
  draftFor,
  nextFriday,
  parseISODate,
  toISODate,
  type Format,
  type RemKey,
  type SessionDraft,
} from '@/lib/f1'
import { Brand } from './poster'

export function CreateScreen({ defaultRem, onCreated }: { defaultRem: RemKey; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [place, setPlace] = useState('')
  const [date, setDate] = useState(() => toISODate(addDays(nextFriday(new Date(), 2), 28)))
  const [format, setFormat] = useState<Format>('std')
  const [sessions, setSessions] = useState<SessionDraft>(() => draftFor('std'))
  const [rem, setRem] = useState<RemKey>(defaultRem)
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
      rem,
      sessions: buildSessions(date, format, sessions),
    })
    setName('')
    setPlace('')
    setInvalid(false)
    setToast(true)
    setTimeout(() => {
      setToast(false)
      onCreated()
    }, 1400)
  }

  return (
    <>
      <form className="bb-screen" onSubmit={submit} noValidate>
        <Brand sub="Новое событие" />
        <h1 className="h1 mb-5">Новый этап</h1>

        <label className="fld">
          <span className="lbl">Гран-при</span>
          <input
            ref={nameRef}
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
            <span id="name-error" className="mt-1.5 block text-xs font-semibold text-bull">
              Укажи название Гран-при
            </span>
          )}
        </label>
        <label className="fld">
          <span className="lbl">Место</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="Сузука, Япония" autoComplete="off" />
        </label>
        <label className="fld">
          <span className="lbl">Пятница уикенда</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="text-[22px]" />
          {fridayWarning && (
            <span className="mute mt-1.5 block text-xs">Выбранный день не пятница — сессии начнутся с этой даты.</span>
          )}
        </label>

        <span className="lbl">Формат</span>
        <div className="seg" role="group" aria-label="Формат уикенда">
          <button type="button" aria-pressed={format === 'std'} onClick={() => changeFormat('std')}>
            Обычный
          </button>
          <button type="button" aria-pressed={format === 'sprint'} onClick={() => changeFormat('sprint')}>
            Со спринтом
          </button>
        </div>

        <span className="lbl">Сессии и напоминания</span>
        <ul className="mb-5">
          {FORMATS[format].map((tpl) => {
            const cfg = sessions[tpl.key]
            return (
              <li key={tpl.key} className="flex items-center gap-3 border-b border-[var(--hair)] py-2.5">
                <span className="display flex-1 text-[18px] font-extrabold leading-none">
                  {tpl.label}
                  <small className="mute ml-2 font-sans text-[11px] font-medium normal-case">{DAY_SHORT[tpl.day]}</small>
                </span>
                <input
                  type="time"
                  className="time-in"
                  value={cfg.time}
                  aria-label={`Время: ${tpl.label}`}
                  onChange={(e) =>
                    e.target.value && setSessions((s) => ({ ...s, [tpl.key]: { ...cfg, time: e.target.value } }))
                  }
                />
                <button
                  type="button"
                  role="switch"
                  className="sw"
                  aria-checked={cfg.on}
                  aria-label={`Напоминание: ${tpl.label}`}
                  onClick={() => setSessions((s) => ({ ...s, [tpl.key]: { ...cfg, on: !cfg.on } }))}
                />
              </li>
            )
          })}
        </ul>

        <span className="lbl">Напомнить за</span>
        <div className="seg hot" role="group" aria-label="Напомнить за">
          {(Object.keys(REM) as RemKey[]).map((k) => (
            <button key={k} type="button" aria-pressed={rem === k} onClick={() => setRem(k)}>
              {REM[k].label}
            </button>
          ))}
        </div>

        <button type="submit" className="cta">
          Добавить в календарь
          <ArrowRight size={22} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </form>
      {toast && (
        <div className="toast" role="status">
          Уикенд добавлен в календарь
        </div>
      )}
    </>
  )
}
