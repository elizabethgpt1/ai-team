import Anthropic from "@anthropic-ai/sdk";
import { getAgent } from "@/config/agents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const routerPrompt = `You are Lukka, the AI Router at KSS Hockey.

Analyze user messages and determine which specialist should handle each request.

Available agents:
- brand-manager: brand positioning, tone of voice, communication, messaging
- product-assistant: product descriptions, characteristics, catalog texts
- content-creator: posts, captions, content ideas, short scripts, creative texts
- marketing-strategist: promotion, campaigns, channels, funnels, customer acquisition
- sales-assistant: sales replies, offers, objections, customer communication
- hockey-expert: hockey advice, player needs, product use cases, hockey explanations

RULES:
- Reply with ONLY the agent id
- If the request is about branding, positioning, communication, or tone of voice, reply: brand-manager
- If the request is about product descriptions, product characteristics, or product cards, reply: product-assistant
- If the request is about posts, captions, content ideas, short scripts, or creative texts, reply: content-creator
- If the request is about promotion, channels, campaigns, funnels, or marketing strategy, reply: marketing-strategist
- If the request is about sales replies, offers, objections, or customer communication, reply: sales-assistant
- If the request is about hockey knowledge, player recommendations, or use cases, reply: hockey-expert
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

    const agentId =
      routerRes.content[0].type === "text"
        ? routerRes.content[0].text.trim()
        : "product-assistant";

    const agent = getAgent(agentId);

    return Response.json({
      agentId,
      agentName: agent?.name || "Unknown Agent",
    });
  } catch (error) {
    return Response.json({ error: "Router error" }, { status: 500 });
  }
}