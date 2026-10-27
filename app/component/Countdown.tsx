'use client'

import { useEffect, useState } from 'react'

const Countdown = ({ endsAt }: { endsAt: string }) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)

  useEffect(() => {
    const updateCountdown = () => setRemainingTime(Math.max(0, new Date(endsAt).getTime() - Date.now()))
    updateCountdown()
    const interval = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(interval)
  }, [endsAt])

  if (remainingTime === null) {
    return <p className="font-[family-name:var(--font-display)] text-5xl text-[#e4d0a4]">--:--:--:--</p>
  }

  const totalSeconds = Math.floor(remainingTime / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <p className="font-[family-name:var(--font-display)] text-5xl text-[#e4d0a4]" aria-live="off">
      {days}d {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </p>
  )
}

export default Countdown
