import { redirect } from 'next/navigation'

const DEFAULT_SELLER_SLUG = process.env.DEFAULT_SELLER_SLUG ?? 'test-seller'

export default function LegacySuccessRedirect() {
  redirect(`/${DEFAULT_SELLER_SLUG}/success`)
}
