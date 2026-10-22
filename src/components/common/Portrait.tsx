/** 证件照人像剪影 */
export function Portrait({ className, shirt = '#1F2937' }: { className?: string; shirt?: string }) {
  return (
    <svg viewBox="0 0 100 140" className={className} aria-hidden>
      <path d="M8 140c3-27 19-40 42-40s39 13 42 40z" fill={shirt} />
      <path d="M41 98h18v10l-9 9-9-9z" fill="#E9BFA2" />
      <path d="M38 101l12 16 12-16 6 3-18 22-18-22z" fill="#fff" />
      <ellipse cx="50" cy="62" rx="21" ry="25" fill="#F3CDB2" />
      <path d="M28 60c-2-20 8-33 23-33 14 0 24 11 22 31-4-9-10-14-20-15-9 4-17 8-25 17z" fill="#2A2320" />
    </svg>
  )
}
