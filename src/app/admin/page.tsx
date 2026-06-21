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

        <p className="text-stone-500 text-center py-16 text-lg">
          Sellers dashboard coming soon.
        </p>
      </div>
    </main>
  )
}
