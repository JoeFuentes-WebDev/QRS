'use client'

import { useState } from 'react'

type InfoTooltipProps = {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex shrink-0 group">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((value) => !value)
        }}
        onBlur={() => setOpen(false)}
        className="text-stone-400 hover:text-stone-600 text-xs leading-none ml-1.5"
        aria-label="More information"
      >
        ⓘ
      </button>
      <span
        role="tooltip"
        className={
          'pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-stone-200 bg-stone-900 px-3 py-2 text-xs font-normal normal-case tracking-normal text-white shadow-sm ' +
          (open ? 'block' : 'hidden group-hover:block')
        }
      >
        {text}
      </span>
    </span>
  )
}
