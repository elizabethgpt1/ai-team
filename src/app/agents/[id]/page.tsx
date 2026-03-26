"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import { getAgent } from "@/config/agents";
import { Send, Mic } from "lucide-react";

type Message = {
  role: string;
  content: string;
};

export default function AgentChat() {
  const { id } = useParams();
  const agent = getAgent(id as string);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading || !agent) return;

    const newMessages = [...messages, { role: "user", content: input }];

    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: agent.systemPrompt,
        }),
      });

      const data = await res.json();

      setMessages([...newMessages, { role: "assistant", content: data.response }]);
    } finally {
      setLoading(false);
    }
  }

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-white">
        Агент не найден
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0f19] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[-120px] top-[-100px] h-[280px] w-[280px] rounded-full blur-3xl"
          style={{ backgroundColor: `${agent.color}22` }}
        />
        <div className="absolute right-[-100px] top-[120px] h-[260px] w-[260px] rounded-full bg-white/5 blur-3xl" />
        <div
          className="absolute bottom-[-120px] left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: `${agent.color}18` }}
        />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="border-b border-white/10 bg-white/5 backdrop-blur-xl"
          style={{ willChange: "transform" }}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div
                className="rounded-full p-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}, rgba(255,255,255,0.15))`,
                  boxShadow: `0 0 20px ${agent.color}40`,
                }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>

              <div>
                <div className="font-semibold">{agent.name}</div>
                <div className="text-sm text-white/60">{agent.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/60">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: agent.color,
                  boxShadow: `0 0 14px ${agent.color}`,
                }}
              />
              <span>Online</span>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
          <div
            className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            style={{ willChange: "transform" }}
          >
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "text-white"
                        : "border border-white/10 bg-white/[0.05] text-white/85 backdrop-blur-xl"
                    }`}
                    style={
                      message.role === "user"
                        ? {
                            background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)`,
                            boxShadow: `0 0 20px ${agent.color}30`,
                          }
                        : {
                            borderLeft: `4px solid ${agent.color}`,
                            boxShadow: `0 0 18px ${agent.color}15`,
                          }
                    }
                  >
                    <div className="whitespace-pre-wrap leading-7">
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div
                  className="max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white/75 backdrop-blur-xl"
                  style={{
                    borderLeft: `4px solid ${agent.color}`,
                    boxShadow: `0 0 18px ${agent.color}15`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>Агент печатает</span>
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {messages.length === 0 && !loading && (
              <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-center text-white/45">
                Start the conversation with {agent.name}.
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            style={{ willChange: "transform" }}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/70 transition duration-300 hover:bg-white/15 hover:text-white"
                title="Голосовой ввод"
              >
                <Mic size={18} />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/15"
              />

              <button
                type="button"
                onClick={sendMessage}
                className="rounded-2xl p-3 text-white transition duration-300 hover:scale-[1.02]"
                title="Отправить"
                style={{
                  background: `linear-gradient(135deg, ${agent.color}, ${agent.color}cc)`,
                  boxShadow: `0 0 20px ${agent.color}35`,
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}