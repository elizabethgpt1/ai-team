import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

const voices: Record<string, string> = {
  "brand-manager": "ru-RU-SvetlanaNeural",
  "product-assistant": "ru-RU-DmitryNeural",
  router: "ru-RU-DmitryNeural",
};

function cleanForSpeech(text: string) {
  let t = text;

  t = t.replace(/```[\s\S]*?```/g, "");
  t = t.replace(/[*#~`|>\[\]()]/g, "");
  t = t.replace(/https?:\/\/\S+/g, "");
  t = t.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

export async function POST(req: Request) {
  try {
    const { text, agentId } = await req.json();

    if (!text || !agentId) {
      return Response.json(
        { error: "Text and agentId are required" },
        { status: 400 }
      );
    }

    const voice = voices[agentId] || "ru-RU-DmitryNeural";
    const cleanText = cleanForSpeech(text);

    if (!cleanText) {
      return Response.json(
        { error: "Text is empty after cleaning" },
        { status: 400 }
      );
    }

    const tts = new MsEdgeTTS();

    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
    );

    const { audioStream } = await tts.toStream(cleanText);
    const audioBuffer = await streamToBuffer(audioStream);

    return new Response(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/webm",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);

    return Response.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}