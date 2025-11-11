import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Message } from "@/lib/openrouter";

/**
 * Chat component with streaming support for real-time responses
 * Uses Server-Sent Events (SSE) for streaming LLM responses
 */
export function ChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start streaming");
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is null");
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              // Finalize the assistant message
              const assistantMessage: Message = {
                role: "assistant",
                content: accumulatedContent,
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent("");
              return;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingContent(accumulatedContent);
              }
            } catch {
              // Ignore parse errors for individual chunks
            }
          }
        }
      }
    } catch (error) {
      // Don't show error if request was aborted
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      toast.error(error instanceof Error ? error.message : "Nie udało się wysłać wiadomości. Spróbuj ponownie.");

      // Clear streaming content on error
      setStreamingContent("");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);

      // Save partial response if any
      if (streamingContent) {
        const assistantMessage: Message = {
          role: "assistant",
          content: streamingContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent("");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && input.trim()) {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Chat (Stream)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Rozmawiaj z asystentem AI w czasie rzeczywistym</p>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4">
        {messages.length === 0 && !streamingContent && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p>Rozpocznij rozmowę wpisując wiadomość poniżej</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {message.role === "user" ? "Ty" : "Asystent"}
                </span>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">Asystent</span>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">{streamingContent}</div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">Asystent</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </div>
                <span>Pisze...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Wpisz swoją wiadomość..."
          disabled={loading}
          className="flex-1"
          aria-label="Wiadomość do wysłania"
        />
        {loading ? (
          <Button onClick={stopStreaming} variant="destructive" aria-label="Zatrzymaj generowanie">
            Stop
          </Button>
        ) : (
          <Button onClick={sendMessage} disabled={!input.trim()} aria-label="Wyślij wiadomość">
            Wyślij
          </Button>
        )}
      </div>
    </div>
  );
}
