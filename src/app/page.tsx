"use client";

import { useState } from "react";
import { getAgent } from "@/config/agents";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAgent = selectedAgentId ? getAgent(selectedAgentId) : undefined;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    setResponse("");
    setSelectedAgentId("");

    try {
      const routerRes = await fetch("/api/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const routerData = await routerRes.json();
      const agentId = routerData.agentId;

      const agent = getAgent(agentId);

      if (!agent) {
        setResponse("Router selected an unknown agent.");
        setLoading(false);
        return;
      }

      setSelectedAgentId(agentId);

      const agentRes = await fetch("/api/agent-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: agent.systemPrompt,
          messages: [{ role: "user", content: input }],
        }),
      });

      const agentData = await agentRes.json();
      setResponse(agentData.response || "No response");
    } catch (error) {
      setResponse("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Router Demo</h1>

      <p>Write a message and Lukka will choose the right specialist.</p>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message here"
        style={{ width: 300, marginRight: 10 }}
      />

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>

      {selectedAgent && (
        <div style={{ marginTop: 20 }}>
          <img
            src={selectedAgent.avatar}
            alt={selectedAgent.name}
            width={80}
            height={80}
          />
          <h2>
            Selected agent: {selectedAgent.name} — {selectedAgent.role}
          </h2>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}