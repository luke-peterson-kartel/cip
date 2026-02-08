import { cn } from '@/lib/cn'

interface MessageRendererProps {
  message: string
  isCurrentUser: boolean
  onMentionClick?: (assetRequestId: string) => void
}

const MENTION_REGEX = /@\[asset-request:([^:]+):([^\]]+)\]/g

export function MessageRenderer({ message, isCurrentUser, onMentionClick }: MessageRendererProps) {
  const parts: Array<{ type: 'text'; content: string } | { type: 'mention'; id: string; title: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  const regex = new RegExp(MENTION_REGEX.source, 'g')
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: message.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'mention', id: match[1], title: match[2] })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < message.length) {
    parts.push({ type: 'text', content: message.slice(lastIndex) })
  }

  if (parts.length === 0) {
    return <>{message}</>
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.content}</span>
        ) : (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              onMentionClick?.(part.id)
            }}
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium transition-colors',
              isCurrentUser
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            )}
          >
            <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="max-w-[160px] truncate">{part.title}</span>
          </button>
        )
      )}
    </>
  )
}
