export function Field({
  label,
  value,
  onChange,
  type = 'text',
  textarea = false,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  textarea?: boolean
  hint?: string
}) {
  const base =
    'w-full border border-stone-200 rounded-xl px-3 py-2 text-stone-900 text-sm focus:outline-none focus:border-stone-800'

  return (
    <div>
      <label className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-1">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
          rows={2}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  )
}
