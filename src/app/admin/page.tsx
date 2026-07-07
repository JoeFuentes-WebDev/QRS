'use client'

const STORAGE_KEY = 'qrs-admin-auth'

export default function AdminPage() {
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-stone-50 p-5">
      <div className="max-w-lg mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-stone-900">Sellers</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-stone-600 font-medium hover:text-stone-900"
          >
            Log out
          </button>
        </header>

        <section className="bg-white rounded-2xl p-6 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
            Seller acquisition postcard
          </h2>
          <p className="text-stone-500 text-sm">
            Static 4×6 marketing PDF for recruiting vendors at markets and fairs.
          </p>
          <a
            href="/api/postcard/seller-acquisition"
            className="inline-flex items-center justify-center w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-700 transition-colors"
          >
            Download seller postcard
          </a>
        </section>

        <p className="text-stone-500 text-center py-16 text-lg">
          Sellers dashboard coming soon.
        </p>
      </div>
    </main>
  )
}
