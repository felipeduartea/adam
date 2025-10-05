"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function MastraChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Adam's orchestrator. Describe the bug, feature, or improvement you have in mind and I'll pull in Linear, GitHub, and Zendesk context for you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/mastra/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: nextMessages.slice(0, -1),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || `Mastra request failed (${response.status})`);
      }

      const data = (await response.json()) as { reply: string };
      const assistantReply = data.reply?.trim()?.length
        ? data.reply
        : "I wasn't able to generate a response. Could you try rephrasing your request?";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantReply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error contacting Mastra.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong reaching Mastra. Please try again in a moment.",
        },
      ]);
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Issue Intake Copilot</h2>
        <p className="text-sm text-muted-foreground">
          Chat with Adam to turn support signals and code context into a triaged issue.
        </p>
      </div>

      <ScrollArea className="h-80 w-full p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-colors ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Describe the issue Adam should analyze..."
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!input.trim() || isSubmitting} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? "Thinking" : "Ask"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
