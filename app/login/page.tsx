import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthForms } from '@/app/component/AuthForms'
import { getPageData } from '@/lib/session'

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <Suspense fallback={<p className="p-4 text-red-500">…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { lang, user }] = await Promise.all([searchParams, getPageData()])
  if (user) redirect('/account')
  const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/account'
  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-4 text-red-500">
      <div className="w-full max-w-xl border border-[#e6d8c8] bg-[#fffdf9] p-8">
        <AuthForms lang={lang} next={destination} />
      </div>
    </div>
  )
}
