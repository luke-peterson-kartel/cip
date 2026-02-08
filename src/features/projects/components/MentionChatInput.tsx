import { useState, useRef, useEffect, useCallback } from 'react'
import type { AssetRequest } from '@/types'
import { cn } from '@/lib/cn'

interface MentionChatInputProps {
  assetRequests: AssetRequest[]
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
}

export function MentionChatInput({ assetRequests, onSendMessage, disabled }: MentionChatInputProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(0)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isMentionOpen = mentionQuery !== null

  const filteredAssets = isMentionOpen
    ? assetRequests.filter((ar) => {
        const q = mentionQuery.toLowerCase()
        return (
          ar.title.toLowerCase().includes(q) ||
          (ar.platform || '').toLowerCase().includes(q) ||
          (ar.creativeType || '').toLowerCase().includes(q)
        )
      })
    : []

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [mentionQuery])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isMentionOpen && dropdownRef.current) {
      const item = dropdownRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isMentionOpen])

  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Search backward from cursor for a standalone @ (not part of @[ mention markup)
    const textBeforeCursor = text.slice(0, cursorPos)

    // Find the last @ that isn't part of an existing mention @[
    let atIndex = -1
    for (let i = textBeforeCursor.length - 1; i >= 0; i--) {
      if (textBeforeCursor[i] === '@') {
        // Check it's not part of @[ mention markup
        if (i + 1 < textBeforeCursor.length && textBeforeCursor[i + 1] === '[') {
          continue
        }
        atIndex = i
        break
      }
      // Stop searching if we hit a space or newline (@ must be "recent")
      if (textBeforeCursor[i] === ' ' || textBeforeCursor[i] === '\n') {
        break
      }
    }

    if (atIndex >= 0) {
      const query = textBeforeCursor.slice(atIndex + 1)
      setMentionQuery(query)
      setMentionStartIndex(atIndex)
    } else {
      setMentionQuery(null)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setMessage(newValue)

    const cursorPos = e.target.selectionStart ?? newValue.length
    detectMention(newValue, cursorPos)

    // Auto-resize
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`
    }
  }

  const insertMention = (asset: AssetRequest) => {
    const before = message.slice(0, mentionStartIndex)
    const after = message.slice(textareaRef.current?.selectionStart ?? message.length)
    const mention = `@[asset-request:${asset.id}:${asset.title}]`
    const newMessage = `${before}${mention} ${after}`
    setMessage(newMessage)
    setMentionQuery(null)

    // Refocus textarea and set cursor after mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const cursorPos = before.length + mention.length + 1
        textareaRef.current.selectionStart = cursorPos
        textareaRef.current.selectionEnd = cursorPos
      }
    })
  }

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return
    setIsSending(true)
    try {
      await onSendMessage(message.trim())
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentionOpen && filteredAssets.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredAssets.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredAssets[highlightedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }

    // Normal send on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey && !isMentionOpen) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      {/* Mention Dropdown */}
      {isMentionOpen && filteredAssets.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg z-10"
        >
          {filteredAssets.map((asset, index) => (
            <button
              key={asset.id}
              onClick={() => insertMention(asset)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                index === highlightedIndex ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{asset.title}</div>
                {asset.platform && (
                  <div className="truncate text-xs text-gray-500">{asset.platform}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... Use @ to mention an asset request"
          disabled={disabled || isSending}
          rows={1}
          className="block max-h-24 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isSending ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
