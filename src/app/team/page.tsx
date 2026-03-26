"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { agents, getAgent } from "@/config/agents";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Mic, Square, Volume2, VolumeX } from "lucide-react";

type AgentResponse = {
  agentId: string;
  agentName: string;
  content: string;
};

function TeamPageInner() {
  const [input, setInput] = useState("");
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const teamAgents = agents.filter((agent) => agent.id !== "router");

  const voice = useVoiceChat({
    onTranscript: (text) => {
      setInput(text);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [responses]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;

    if (!voice.audioUnlocked && voice.ttsEnabled) {
      await voice.unlockAudio();
    }

    voice.stopTts();

    setLoading(true);
    setResponses([]);
    setInput("");

    setResponses([
      {
        agentId: "router",
        agentName: "Lukka",
        content: "Choosing the best specialist...",
      },
    ]);

    try {
      const routerRes = await fetch("/api/router", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const routerData = await routerRes.json();
      const selectedAgentId = routerData.agentId;
      const selectedAgent = getAgent(selectedAgentId);

      if (!selectedAgent || selectedAgent.id === "router") {
        setResponses([
          {
            agentId: "router",
            agentName: "Lukka",
            content: "Router could not choose a valid agent.",
          },
        ]);
        setLoading(false);
        return;
      }

      setResponses([
        {
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          content: "Thinking...",
        },
      ]);

      const agentRes = await fetch("/api/agent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          systemPrompt: selectedAgent.systemPrompt,
        }),
      });

      const agentData = await agentRes.json();
      const finalText = agentData.response || "No response";

      setResponses([
        {
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          content: finalText,
        },
      ]);

      voice.queueText(finalText, selectedAgent.id);
    } catch (error) {
      setResponses([
        {
          agentId: "router",
          agentName: "Lukka",
          content: "Something went wrong",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0f19] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-[-100px] top-[120px] h-[280px] w-[280px] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6"
        >
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Team Chat
          </h1>
          <p className="max-w-2xl text-white/70">
            Ask one question and Lukka will choose the best specialist from the
            AI team.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="h-fit rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
            style={{ willChange: "transform" }}
          >
            <p className="mb-4 text-sm font-medium text-white/60">
              Agents in team
            </p>

            <div className="space-y-3">
              {teamAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  style={{ willChange: "transform" }}
                >
                  <Link
                    href={`/agents/${agent.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-300 hover:scale-[1.01] hover:border-white/20 hover:bg-white/[0.07]"
                    style={{
                      boxShadow: `0 0 20px ${agent.color}20`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full p-[2px]"
                        style={{
                          background: `linear-gradient(135deg, ${agent.color}, rgba(255,255,255,0.15))`,
                          boxShadow: `0 0 18px ${agent.color}40`,
                        }}
                      >
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: agent.color,
                              boxShadow: `0 0 14px ${agent.color}`,
                            }}
                          />
                          <div className="truncate font-medium">
                            {agent.name}
                          </div>
                        </div>

                        <div className="mt-1 text-sm text-white/60">
                          {agent.role}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              style={{ willChange: "transform" }}
            >
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask your AI team..."
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-white/20 focus:bg-white/15"
                  disabled={loading}
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={voice.toggleListening}
                    type="button"
                    className={`flex min-w-[56px] items-center justify-center rounded-2xl border px-4 py-3 transition duration-300 ${
                      voice.isListening
                        ? "border-red-400/30 bg-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.35)]"
                        : voice.micDenied
                          ? "border-red-500/20 bg-red-950/50 hover:bg-red-900/60"
                          : "border-white/10 bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    <Mic size={20} />
                  </button>

                  <button
                    onClick={voice.toggleTts}
                    type="button"
                    className={`flex min-w-[56px] items-center justify-center rounded-2xl border px-4 py-3 transition duration-300 ${
                      voice.ttsEnabled
                        ? "border-emerald-400/20 bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                        : "border-white/10 bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {voice.ttsEnabled ? (
                      <Volume2 size={20} />
                    ) : (
                      <VolumeX size={20} />
                    )}
                  </button>

                  <button
                    onClick={voice.stopTts}
                    type="button"
                    className="flex min-w-[56px] items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition duration-300 hover:bg-white/15"
                  >
                    <Square size={18} />
                  </button>

                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500 to-blue-500 px-5 py-3 font-medium text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition duration-300 hover:scale-[1.01] hover:from-indigo-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Thinking..." : "Send"}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <AnimatePresence mode="popLayout">
                  {voice.isListening && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2 text-red-400"
                    >
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
                      </span>
                      Listening... Speak now.
                    </motion.p>
                  )}
                </AnimatePresence>

                {voice.micDenied && (
                  <p className="text-red-500">Microphone access was denied.</p>
                )}

                {!voice.speechSupported && (
                  <p className="text-yellow-400">
                    Speech recognition is not supported in this browser.
                  </p>
                )}

                <p className="text-white/60">
                  Voice output: {voice.ttsEnabled ? "On" : "Off"}
                </p>

                {!voice.audioUnlocked && voice.ttsEnabled && (
                  <p className="text-yellow-400">
                    Click the voice button once to enable audio playback.
                  </p>
                )}

                {voice.audioBlocked && (
                  <p className="text-red-400">
                    Browser blocked audio playback. Click the voice button and
                    try again.
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.1 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              style={{ willChange: "transform" }}
            >
              <p className="mb-4 text-sm font-medium text-white/60">
                Team answers
              </p>

              <div className="space-y-3">
                <AnimatePresence>
                  {responses.map((response, index) => {
                    const currentAgent =
                      response.agentId === "router"
                        ? {
                            id: "router",
                            name: "Lukka",
                            role: "AI Router",
                            avatar: "/avatars/router.jpg",
                            color: "#f59e0b",
                          }
                        : teamAgents.find(
                            (agent) => agent.id === response.agentId
                          );

                    return (
                      <motion.div
                        key={`${response.agentId}-${index}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
                        style={{
                          borderLeft: `4px solid ${
                            currentAgent?.color || "#ffffff"
                          }`,
                          boxShadow: currentAgent
                            ? `0 0 18px ${currentAgent.color}18`
                            : undefined,
                          willChange: "transform",
                        }}
                      >
                        <div className="mb-2 flex items-center gap-3">
                          {currentAgent?.avatar ? (
                            <img
                              src={currentAgent.avatar}
                              alt={response.agentName}
                              className="h-8 w-8 rounded-full object-cover"
                              style={{
                                boxShadow: currentAgent
                                  ? `0 0 14px ${currentAgent.color}40`
                                  : undefined,
                              }}
                            />
                          ) : (
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  currentAgent?.color || "#ffffff",
                                boxShadow: currentAgent
                                  ? `0 0 14px ${currentAgent.color}`
                                  : undefined,
                              }}
                            />
                          )}

                          <div className="font-medium">{response.agentName}</div>
                        </div>

                        {response.content === "Thinking..." ||
                        response.content === "Choosing the best specialist..." ? (
                          <div className="flex items-center gap-2 text-white/70">
                            <span>{response.content.replace("...", "")}</span>
                            <div className="flex gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/70" />
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap leading-7 text-white/85">
                            {response.content}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {responses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-10 text-center text-white/45">
                    Lukka will choose the right specialist and the answer will
                    appear here.
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(TeamPageInner), {
  ssr: false,
});