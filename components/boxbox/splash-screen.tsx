'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { GiantWord, Signature } from './poster'

export function SplashScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="bb-screen flex flex-col">
      <div className="mb-4 mt-2 flex justify-between">
        <span className="micro mute">Oracle Red Bull Racing</span>
        <span className="micro mute">Сезон {new Date().getFullYear()}</span>
      </div>
      <div className="words rise">
        <GiantWord text="Box" width={302} color="var(--cream)" max={220} />
        <GiantWord text="Box" width={302} color="var(--red)" max={220} />
        <Signature className="top-[30%] h-[60%]" />
      </div>
      <div className="rise relative -mx-[18px] mt-4 h-44" style={{ animationDelay: '120ms' }}>
        <Image
          src="/img/car.jpg"
          alt="Болид Oracle Red Bull Racing в кобальтовой ливрее"
          fill
          priority
          sizes="440px"
          className="car-fade object-cover object-[62%_50%]"
        />
      </div>
      <div className="rise mt-auto pt-4" style={{ animationDelay: '220ms' }}>
        <h1 className="display text-[30px] font-extrabold leading-none text-balance">
          Каждый уикенд
          <br />
          <span className="yel">под твоим контролем</span>
        </h1>
        <p className="mute mb-5 mt-2 max-w-72 text-[13px] leading-relaxed text-pretty">
          Создавай свой календарь Формулы 1, добавляй сессии и получай напоминание до старта.
        </p>
        <button type="button" className="cta paper mt-0" onClick={onStart}>
          Начать сезон
          <ArrowRight size={22} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
