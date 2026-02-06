import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/cn'

interface ChatSectionProps {
  messages: ChatMessage[]
  currentUserEmail: string
  onSendMessage: (message: string) => Promise<void>
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ChatSection({
  messages,
  currentUserEmail,
  onSendMessage,
}: ChatSectionProps) {
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = newMessage.trim()
    if (!trimmed || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(trimmed)
      setNewMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[300px] min-h-[120px] bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-6">
            <p className="text-xs text-gray-400">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderEmail === currentUserEmail
            return (
              <div
                key={msg.id}
                className={cn('flex gap-2', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold',
                    isCurrentUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  )}
                  title={msg.senderName}
                >
                  {getInitials(msg.senderName)}
                </div>

                {/* Bubble */}
                <div className={cn('max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
                  <div
                    className={cn(
                      'text-xs mb-0.5',
                      isCurrentUser ? 'text-right text-gray-400' : 'text-left text-gray-500'
                    )}
                  >
                    {msg.senderEmail}
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      isCurrentUser
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    )}
                  >
                    {msg.message}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] text-gray-400 mt-0.5',
                      isCurrentUser ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 p-2 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={isSending}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className={cn(
              'flex-shrink-0 rounded-lg p-2 transition-colors',
              newMessage.trim() && !isSending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
