'use client'

import { useActionState, useState } from 'react'
import { login, signup, type FormState } from '@/lib/actions'
import { t, type Lang } from '@/lib/i18n'
import { explain } from '@/lib/pricing'

const initial: FormState = { error: '' }

export function AuthForms({ lang, next }: { lang: Lang; next: string }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginState, loginAction, loginPending] = useActionState(login, initial)
  const [signupState, signupAction, signupPending] = useActionState(signup, initial)
  const state = mode === 'login' ? loginState : signupState
  const pending = mode === 'login' ? loginPending : signupPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <button type="button" className={`rounded-md px-3 py-2 ring-1 ring-red-500 ${mode === 'login' ? 'bg-red-500 text-white' : ''}`} onClick={() => setMode('login')}>
          {t(lang, 'showLogin')}
        </button>
        <button type="button" className={`rounded-md px-3 py-2 ring-1 ring-red-500 ${mode === 'signup' ? 'bg-red-500 text-white' : ''}`} onClick={() => setMode('signup')}>
          {t(lang, 'showSignup')}
        </button>
      </div>
      <h1 className="text-3xl font-bold">{mode === 'login' ? t(lang, 'loginTitle') : t(lang, 'signupTitle')}</h1>
      <p>{t(lang, 'socialLater')}</p>
      {state.error ? (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2">
          {explain(lang, state.error)}
        </p>
      ) : null}
      <form action={mode === 'login' ? loginAction : signupAction} className="flex flex-col gap-4">
        {mode === 'login' ? <input type="hidden" name="next" value={next} /> : null}
        {mode === 'signup' ? (
          <label className="flex flex-col gap-1">
            {t(lang, 'name')}
            <input className="field" name="name" required autoComplete="name" />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          {t(lang, 'email')}
          <input className="field" name="email" type="email" required autoComplete="email" />
        </label>
        {mode === 'signup' ? (
          <label className="flex flex-col gap-1">
            {t(lang, 'phone')}
            <input className="field" name="phone" type="tel" required autoComplete="tel" />
          </label>
        ) : null}
        <label className="flex flex-col gap-1">
          {t(lang, 'password')}
          <input className="field" name="password" type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        <button type="submit" disabled={pending} className="rounded-md bg-red-500 px-4 py-3 text-white disabled:opacity-60">
          {mode === 'login' ? t(lang, 'navLogin') : t(lang, 'createAccount')}
        </button>
      </form>
      <details>
        <summary className="cursor-pointer font-bold">{t(lang, 'demoAccounts')}</summary>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>ada@massimo.test / pizza123 — {t(lang, 'customer')}</li>
          <li>admin@massimo.test / admin123 — {t(lang, 'adminStaff')}</li>
          <li>kitchen@massimo.test / kitchen123 — {t(lang, 'kitchenStaff')}</li>
          <li>front@massimo.test / front123 — {t(lang, 'frontStaff')}</li>
        </ul>
        <p className="mt-2 text-sm">{t(lang, 'passwordAgain')}</p>
      </details>
    </div>
  )
}
