"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2 } from "lucide-react"

interface RagResponse {
  answer: string
  context: string[]
  llmUsed: boolean
}

type ChatRole = "user" | "assistant"

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  context?: string[]
  llmUsed?: boolean
}

export default function RagPage() {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleAsk = async () => {
    const trimmed = question.trim()
    if (!trimmed) {
      setError("Please enter a question")
      return
    }

    const currentQuestion = trimmed

    setLoading(true)
    setError(null)

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: "user",
        content: currentQuestion,
      },
    ])

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
      const ragResult = data.result ?? data

      if (!ragResult || typeof ragResult.answer !== "string" || !Array.isArray(ragResult.context)) {
        throw new Error("Unexpected response format from backend")
      }

      const result = ragResult as RagResponse

      // Add assistant message with answer + context
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: result.answer,
          context: result.context,
          llmUsed: result.llmUsed,
        },
      ])
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
    <div className="flex min-h-screen flex-col bg-background">
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

                    {!isUser && msg.context && msg.context.length > 0 && (
                      <div className="pt-2">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Retrieved Context ({msg.context.length})
                        </p>
                        <Accordion type="single" collapsible className="w-full">
                          {msg.context.map((chunk, index) => (
                            <AccordionItem key={index} value={`item-${msg.id}-${index}`}>
                              <AccordionTrigger className="text-xs">
                                Context Chunk {index + 1}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="rounded-md bg-background/60 p-3 text-xs leading-relaxed">
                                  {chunk}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}

                    {!isUser && msg.llmUsed === false && (
                      <p className="pt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        LLM is disabled – showing retrieved context only.
                      </p>
                    )}
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
  )
}
