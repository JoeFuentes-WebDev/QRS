export type FaqItem = {
  question: string
  answer: string
}

export const faqItems: FaqItem[] = [
  {
    question: 'How much does it cost?',
    answer:
      'No monthly fee. QRS charges a 2% platform fee per sale through Stripe — you keep 98.5% of every transaction. No setup fee or subscription.',
  },
  {
    question: 'What is QRS?',
    answer:
      'QRS is a storefront platform for craft fair and street market sellers. You get a shop at your own link, a QR code for in-person selling, and Stripe-powered checkout — no monthly fee.',
  },
  {
    question: 'How do customers buy from my shop?',
    answer:
      'Customers scan your QR code or open your shop link, browse products in a swipe-style UI, and check out as guests with a card via Stripe. They do not need an account.',
  },
  {
    question: 'How do I get paid?',
    answer:
      'Connect Stripe from your dashboard. Payments go to your Stripe account. QRS applies a 2% platform fee on each transaction.',
  },
  {
    question: 'What do I need to start selling?',
    answer:
      'Sign up, complete onboarding with your store name and slug, connect Stripe, and add published products with photos. Once Stripe is connected, customers can checkout.',
  },
  {
    question: 'How do I print my QR code?',
    answer:
      'From your dashboard, download your postcard PDF. It includes your chosen product image, store name, and QR code sized for a standard 4×6 print.',
  },
  {
    question: 'How are orders fulfilled?',
    answer:
      'When a customer checks out, you receive an order notification by email (and Telegram if configured). Manage orders from your dashboard — accept, decline, or mark fulfilled.',
  },
  {
    question: 'Is there a monthly subscription?',
    answer: 'No. QRS charges a 2% fee per sale through Stripe. There is no monthly platform fee in V3.',
  },
  {
    question: 'Can I customize my shop design?',
    answer:
      'Your shop uses the QRS swipe experience with your product photos and listings. Postcard layout and platform FAQ content are fixed in V3.',
  },
]
