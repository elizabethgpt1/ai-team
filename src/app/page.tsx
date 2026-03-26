"use client";

import { useState } from "react";
import { getAgent } from "@/config/agents";

export default function Home() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const agent = getAgent("product-assistant");

  const sendMessage = async () => {
    if (!agent) return;

    const res = await fetch("/api/agent-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt: agent.systemPrompt,
        messages: [{ role: "user", content: input }],
      }),
    });

    const data = await res.json();
    setResponse(data.response);
  };

  return (
    <div style={{ padding: 20 }}>
      {agent && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={agent.avatar}
            alt={agent.name}
            width={80}
            height={80}
          />
        </div>
      )}

      <h1>{agent?.name} — {agent?.role}</h1>

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message here"
        style={{ width: 300, marginRight: 10 }}
      />

      <button onClick={sendMessage}>Send</button>

      <div style={{ marginTop: 20 }}>
        <strong>Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}