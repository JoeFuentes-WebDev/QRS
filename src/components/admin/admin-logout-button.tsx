'use client'

const STORAGE_KEY = 'qrs-admin-auth'

export function AdminLogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-sm text-stone-600 font-medium hover:text-stone-900"
    >
      Log out
    </button>
  )
}
