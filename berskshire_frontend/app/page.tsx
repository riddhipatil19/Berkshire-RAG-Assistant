"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react"

interface RagResponse {
  answer: string
}

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

interface Chat {
  id: string
  title: string
  createdAt: number
  messages: ChatMessage[]
}

const STORAGE_KEY = "berkshire-rag-chats"

export default function RagPage() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Load chats from localStorage (or create a default one) on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Chat[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed)
          setActiveChatId(parsed[0]?.id ?? null)
          return
        }
      }
    } catch {
      // If parsing fails, fall back to creating a new chat
    }

    const firstChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    }

    setChats([firstChat])
    setActiveChatId(firstChat.id)
  }, [])

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }, [chats])

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0]
  const messages = activeChat?.messages ?? []

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => {
      const remaining = prev.filter((chat) => chat.id !== chatId)

      if (remaining.length === 0) {
        const freshChat: Chat = {
          id: `chat-${Date.now()}`,
          title: "New Chat",
          createdAt: Date.now(),
          messages: [],
        }
        setActiveChatId(freshChat.id)
        return [freshChat]
      }

      // If we deleted the active chat, move focus to the first remaining chat
      setActiveChatId((currentActiveId) => {
        if (currentActiveId === chatId) {
          return remaining[0]?.id ?? null
        }
        return currentActiveId
      })

      return remaining
    })

    setError(null)
    setQuestion("")
  }

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      createdAt: Date.now(),
      messages: [],
    }
    setChats((prev) => [newChat, ...prev])
    setActiveChatId(newChat.id)
    setQuestion("")
    setError(null)
  }

  const handleAsk = async () => {
    if (!activeChat) return

    const trimmed = question.trim()
    if (!trimmed) {
      setError("Please enter a question")
      return
    }

    const currentQuestion = trimmed

    setLoading(true)
    setError(null)

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: currentQuestion,
    }

    // Add user message to the active chat
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              title:
                chat.title === "New Chat" && !chat.messages.length
                  ? currentQuestion.slice(0, 60)
                  : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat,
      ),
    )

    // Clear input after sending
    setQuestion("")

    try {
      // Call the RAG workflow endpoint directly and use its result
      const res = await fetch(
        "http://localhost:4111/api/workflows/ragWorkflow/start-async",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputData: {
              question: currentQuestion,
            },
          }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to call RAG workflow")
      }

      const data = await res.json()

      // Backend returns: { status, steps, input, result }
      const ragResult = data.result

      if (!ragResult || typeof ragResult.answer !== "string") {
        throw new Error("Unexpected response format from backend")
      }

      const result: RagResponse = {
        answer: ragResult.answer,
      }


      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: result.answer,
      }

      // Add assistant message to the active chat
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat.id
            ? {
                ...chat,
                messages: [...chat.messages, assistantMessage],
              }
            : chat,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch response")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleAsk()
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebar for multiple chats */}
      <aside className="flex w-64 flex-col border-r bg-muted/40">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Chats</p>
            <p className="text-xs text-muted-foreground">
              {chats.length} {chats.length === 1 ? "conversation" : "conversations"}
            </p>
          </div>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={handleNewChat}
            disabled={loading}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {chats.map((chat) => {
            const isActive = chat.id === activeChat?.id
            const lastMessage = chat.messages[chat.messages.length - 1]

            return (
              <div
                key={chat.id}
                className={`group flex items-start gap-2 rounded-lg px-2 py-2 text-xs transition ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/60"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveChatId(chat.id)
                    setError(null)
                  }}
                  className="flex-1 min-w-0 text-left"
                  title={chat.title || "New Chat"}
                >
                  <div className="truncate text-[0.8rem] font-medium">
                    {chat.title || "New Chat"}
                  </div>
                  {lastMessage && (
                    <div className="mt-0.5 line-clamp-2 min-w-0 text-[0.7rem]">
                      {lastMessage.content}
                    </div>
                  )}
                </button>

                <div className="mt-0.5 hidden items-center group-hover:flex">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!loading) {
                        handleDeleteChat(chat.id)
                      }
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete chat"
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          {chats.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No chats yet. Start a new one to begin.
            </p>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex min-h-screen flex-1 flex-col bg-background">
        <header className="border-b bg-background/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col gap-1">
            <h1 className="text-xl font-semibold">Berkshire RAG Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions based on Berkshire Hathaway shareholder letters.
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto flex h-full max-w-4xl flex-col">
            <div className="flex-1 space-y-4">
              {messages.length === 0 && (
                <div className="mt-10 text-center text-sm text-muted-foreground">
                  Ask your first question to start the conversation.
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.role === "user"

                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </main>

        <footer className="border-t bg-background/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col gap-2">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Ask Berkshire about mistakes, risk, or capital allocation..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={handleAsk} disabled={loading || !question.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to send. Your questions stay on this page only.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
