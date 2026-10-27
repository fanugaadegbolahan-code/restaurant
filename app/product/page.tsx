import { Suspense } from 'react'
import { redirect } from 'next/navigation'

export default function LegacyProductPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  return (
    <Suspense>
      <Legacy searchParams={searchParams} />
    </Suspense>
  )
}

async function Legacy({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  redirect(id ? `/product/${id}` : '/menu')
  return null
}
