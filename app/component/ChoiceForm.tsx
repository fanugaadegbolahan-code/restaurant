'use client'

import type { ReactNode } from 'react'

export function ChoiceForm({
  action,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>
  children: ReactNode
}) {
  return (
    <form action={action} onChange={(event) => event.currentTarget.requestSubmit()}>
      {children}
    </form>
  )
}
