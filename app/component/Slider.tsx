'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'

const Slider = ({ lang }: { lang: Lang }) => {
  const slides = [
    { id: 1, title: t(lang, 'slide1'), image: '/2eatingpizza.jpg' },
    { id: 2, title: t(lang, 'slide2'), image: '/22eatingpizza.jpg' },
    { id: 3, title: t(lang, 'slide3'), image: '/groupeatingpizza.avif' },
  ]
  const [currentSlide, setCurrentSlide] = useState(0)
  const slide = slides[currentSlide] ?? slides[0]

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col bg-[#f6f1ea] lg:flex-row">
      <div className="flex min-h-[46vh] w-full flex-col items-center justify-center gap-8 px-6 py-16 text-[#2c241f] lg:min-h-[calc(100vh-8rem)] lg:w-1/2">
        <p className="text-[0.7rem] uppercase tracking-[0.28em] text-[#8a7352]">Massino · Lagos</p>
        <h1 className="max-w-lg text-balance text-center text-5xl leading-[1.05] md:text-6xl">{slide.title}</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-[#d9cbb8]"
            aria-label={t(lang, 'previous')}
            onClick={() => setCurrentSlide((current) => (current + slides.length - 1) % slides.length)}
          >
            ‹
          </button>
          <Link href="/menu" className="bg-red-500 px-8 py-4 text-white">
            {t(lang, 'orderNow')}
          </Link>
          <button
            type="button"
            className="h-11 w-11 rounded-full border border-[#d9cbb8]"
            aria-label={t(lang, 'next')}
            onClick={() => setCurrentSlide((current) => (current + 1) % slides.length)}
          >
            ›
          </button>
        </div>
      </div>
      <div className="relative min-h-[46vh] w-full lg:min-h-[calc(100vh-8rem)] lg:w-1/2">
        <Image src={slide.image} alt={slide.title} fill className="object-cover" priority />
      </div>
    </div>
  )
}

export default Slider
