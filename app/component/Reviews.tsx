import { submitReview } from '@/lib/actions'
import { t, type Lang } from '@/lib/i18n'
import type { Review, SessionUser } from '@/lib/types'

export function Reviews({
  lang,
  reviews,
  dishId = '',
  user,
  returnTo,
  notice,
  heading,
}: {
  lang: Lang
  reviews: Review[]
  dishId?: string
  user: SessionUser | null
  returnTo: string
  notice?: string
  heading: string
}) {
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{heading}</h2>
      {reviews.length > 0 ? (
        <p>{t(lang, 'outOf5', { score: average.toFixed(1), count: reviews.length })}</p>
      ) : (
        <p>{t(lang, 'noReviews')}</p>
      )}
      {notice === 'saved' ? <p role="status">{t(lang, 'reviewSuccess')}</p> : null}
      {notice === 'error' ? (
        <p role="alert" className="rounded-md bg-red-100 px-3 py-2">
          {t(lang, 'reviewError')}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-md bg-fuchsia-50 p-3">
            <p className="font-bold">
              {review.userName} · {review.rating}/5
            </p>
            <p>{review.comment}</p>
          </li>
        ))}
      </ul>
      {user ? (
        <form action={submitReview} className="flex flex-col gap-3">
          <input type="hidden" name="dishId" value={dishId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="flex flex-col gap-1">
            {t(lang, 'ratingLabel')}
            <select className="field" name="rating" defaultValue="5" required>
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            {t(lang, 'commentLabel')}
            <textarea className="field min-h-24" name="comment" required minLength={2} maxLength={500} />
          </label>
          <button type="submit" className="w-fit rounded-md bg-red-500 px-4 py-3 text-white">
            {t(lang, 'submitReview')}
          </button>
        </form>
      ) : (
        <p>
          <a className="underline" href={`/login?next=${encodeURIComponent(returnTo)}`}>
            {t(lang, 'loginToReview')}
          </a>
        </p>
      )}
    </section>
  )
}
