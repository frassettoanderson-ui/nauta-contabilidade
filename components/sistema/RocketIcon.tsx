// Foguete com chama animada — usado no item de menu Onboarding
export default function RocketIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* corpo do foguete */}
      <path d="M12 2.2c2.6 1.7 4.1 4.7 4.1 8.2 0 1.8-.4 3.2-.9 4.2H8.8c-.5-1-.9-2.4-.9-4.2 0-3.5 1.5-6.5 4.1-8.2z"
        fill="currentColor" />
      {/* janela */}
      <circle cx="12" cy="8.2" r="1.5" fill="#0a0918" />
      {/* aletas */}
      <path d="M8 12.4c-1.6.5-2.6 2-2.7 3.7 1.6 0 2.7-.6 3.2-1.6M16 12.4c1.6.5 2.6 2 2.7 3.7-1.6 0-2.7-.6-3.2-1.6"
        fill="currentColor" opacity="0.65" />
      {/* chama (animada) */}
      <path className="rocket-flame" d="M10.4 15.4h3.2c0 2.1-1.1 4.2-1.6 4.8-.5-.6-1.6-2.7-1.6-4.8z" fill="#fb923c" />
    </svg>
  )
}
