'use client'

type Props = {
  onLike: () => void
  onPin: () => void
  onPass: () => void
}

export function SwipeActions({ onLike, onPin, onPass }: Props) {
  return (
    <div className="flex items-center gap-5 justify-center mt-6">
      {/* Skip - goes back of queue */}
      <button
        onClick={onPass}
        className="w-14 h-14 rounded-full bg-white shadow-lg border-2 border-red-200 text-red-400 text-xl flex items-center justify-center hover:scale-110 hover:border-red-400 transition-all"
        aria-label="Skip"
      >
        ✕
      </button>

      {/* Like - add to cart */}
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-full bg-white shadow-xl border-2 border-green-200 text-green-500 text-3xl flex items-center justify-center hover:scale-110 hover:border-green-400 transition-all"
        aria-label="Like"
      >
        ♥
      </button>

      {/* Pin - save for later */}
      <button
        onClick={onPin}
        className="w-14 h-14 rounded-full bg-white shadow-lg border-2 border-amber-200 text-amber-500 text-xl flex items-center justify-center hover:scale-110 hover:border-amber-400 transition-all"
        aria-label="Save for later"
      >
        📌
      </button>
    </div>
  )
}
