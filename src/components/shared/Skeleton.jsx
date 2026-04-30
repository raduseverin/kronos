import React from 'react'

/**
 * Loading placeholder. Use while data is being fetched to avoid layout pop-in.
 * Keep dimensions close to the real content's bounding box.
 */
export function Skeleton({ w, h = 14, className = '', rounded = 'md' }) {
  const r = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded] || 'rounded-md'
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-slate-800 animate-pulse-soft ${r} ${className}`}
      style={{ width: typeof w === 'number' ? `${w}px` : w, height: typeof h === 'number' ? `${h}px` : h }}
    />
  )
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/40 ${className}`}>
      <Skeleton w={8} h={8} rounded="full" />
      <Skeleton w="40%" h={12} />
      <span className="flex-1" />
      <Skeleton w={60} h={12} />
    </div>
  )
}
