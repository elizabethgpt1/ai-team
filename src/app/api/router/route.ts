import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/config/agents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const routerPrompt = `You are Lukka, the AI Router at KSS Hockey.

Analyze user messages and determine which specialist should handle each request.

Available agents:
- brand-manager: brand positioning, content ideas, communication
- product-assistant: product descriptions, characteristics, catalog texts

RULES:
- Reply with ONLY the agent id
- If the request is about branding, tone of voice, content, or communication, reply: brand-manager
- If the request is about product descriptions, product characteristics, or product cards, reply: product-assistant
- If unclear, reply: product-assistant`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const routerRes = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      system: routerPrompt,
      messages: [{ role: "user", content: message }],
    });

    const agentId = routerRes.content[0].type === "text"
      ? routerRes.content[0].text.trim()
      : "product-assistant";

    const agent = getAgent(agentId);

    return Response.json({
      agentId,
      agentName: agent?.name || "Unknown Agent",
    });
  } catch (error) {
    return Response.json(
      { error: "Router error" },
      { status: 500 }
    );
  }
}