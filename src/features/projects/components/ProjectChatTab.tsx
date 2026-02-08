import { useState, useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { ChatSection } from './ChatSection'
import { MessageRenderer } from './MessageRenderer'
import { MentionChatInput } from './MentionChatInput'
import { getProjectChatMessages, sendProjectChatMessage } from '@/api/endpoints/projects'
import { useAuthStore } from '@/store/authStore'
import type { Project, ChatMessage } from '@/types'

interface ProjectChatTabProps {
  projectId: string
  project: Project
  onOpenAssetRequest: (assetRequestId: string) => void
}

export function ProjectChatTab({ projectId, project, onOpenAssetRequest }: ProjectChatTabProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await getProjectChatMessages(projectId)
        setMessages(response.items)
      } catch (error) {
        console.error('Failed to load chat messages:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadMessages()
  }, [projectId])

  const handleSend = async (message: string) => {
    const newMsg = await sendProjectChatMessage(projectId, {
      senderEmail: user?.email || '',
      senderName: user?.name || '',
      message,
    })
    setMessages((prev) => [...prev, newMsg])
  }

  const renderMessage = (message: string, isCurrentUser: boolean) => (
    <MessageRenderer
      message={message}
      isCurrentUser={isCurrentUser}
      onMentionClick={onOpenAssetRequest}
    />
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  return (
    <ChatSection
      messages={messages}
      currentUserEmail={user?.email || ''}
      onSendMessage={handleSend}
      renderMessage={renderMessage}
      inputComponent={
        <MentionChatInput
          assetRequests={project.assetRequests || []}
          onSendMessage={handleSend}
        />
      }
    />
  )
}
