"use client";

import React, { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/shared/AppShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fetchBackend } from "@/lib/api";
import { Bot, Send, Sparkles, ShieldCheck, Languages, User, Loader2 } from "lucide-react";

interface Message {
  sender: "user" | "assistant";
  text: string;
}

export default function AssistantPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Hello! I am your **vetogrid AI Assistant**. You can ask me scheduling or venue booking questions in **English** or **Hinglish**.\n\n*Examples:*\n- *'Tell me about room LH-1'* \n- *'Show schedule for Dr. F01'*\n- *'What is the solver status and violation count?'*",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    "What is the status of the solver?",
    "Tell me about room LH-1",
    "Show schedule for faculty F01",
    "Where is CS101 held?",
    "Tell me about Spectra fest venue bookings",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Check URL query parameter on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        handleSend(q);
      }
    }
  }, []);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || prompt).trim();
    if (!query || loading) return;

    setPrompt("");
    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setLoading(true);

    try {
      const res = await fetchBackend("/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: "assistant", text: data.reply }]);
      } else {
        const error = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: typeof error.message === "string" ? error.message : "That request could not be completed. No schedule change was made.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: "Network error connecting to the campus assistant service.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="AI Campus Scheduling Assistant"
        description="Natural language queries over Chitkara campus timetable, rooms, faculty, and venue availability"
        badge="English & Hinglish Prompts"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="cyan" className="flex items-center gap-1">
              <Languages className="w-3 h-3" />
              Multilingual NLP
            </Badge>
            <Badge variant="success" className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Deterministic Guardrails
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Stream */}
        <Card className="lg:col-span-2 flex flex-col h-[580px]">
          <CardHeader className="border-b border-surface-border/50 pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">vetogrid Conversation Session</CardTitle>
                <p className="text-[11px] text-slate-400">Connected to CIT Master Dataset & Schedule</p>
              </div>
            </div>
            <Badge variant="success" className="text-[10px]">
              Schedule Data Connected
            </Badge>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-xl ${
                  m.sender === "user" ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-600/30 border border-blue-500/40 text-blue-300"
                  }`}
                >
                  {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-surface-elevated border border-surface-border text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 text-xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span>Checking campus schedule and venue database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Box */}
          <CardFooter className="p-4 border-t border-surface-border/60 bg-surface-muted/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 w-full"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about timetable, faculty schedules, or room availability..."
                className="flex-1 h-10 px-4 rounded-lg border border-surface-border bg-surface-muted text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button variant="primary" size="md" type="submit" disabled={!prompt.trim() || loading}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Quick Queries & Guardrails */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-400">Sample Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sample)}
                  className="w-full text-left p-2.5 rounded-lg bg-surface-muted/60 hover:bg-surface-elevated border border-surface-border text-xs text-slate-300 transition-colors flex items-start gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>&ldquo;{sample}&rdquo;</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-500/20 bg-blue-950/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Deterministic Guardrails
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Schedule change requests produce proposals. Before an Admin can apply one, the server checks room, faculty, group, availability, capacity, lunch, lab-start, basket, and daily-load constraints.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
