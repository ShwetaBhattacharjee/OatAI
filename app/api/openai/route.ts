import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

// Predefined responses for chatbot identity and purpose
const predefinedResponses: Record<string, string> = {
  "who created you": "I was created by The One Oat Team.",
  "who is founder of one oat": "Brawin Sithampalam.",
  "what is your purpose": "I provide real-time support for soft skills and mental health challenges for young individuals.",
  "what organization developed you": "I was developed by The One Oat Foundation, an organization dedicated to empowering young people.",
  "do you have emotions": "I'm an AI, so I don't have emotions, but I understand emotional issues and provide supportive solutions. 😊",
  "can you provide medical advice": "No, I do not provide medical advice or psychological diagnoses. I offer guidance and soft skills support for mental well-being.",
};

// Handle CORS
function setCORSHeaders(response: Response | NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "https://dev.oats.live"); // Set to your allowed frontend domain
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return setCORSHeaders(new Response(null, { status: 204 }));
}

// Define the POST function
export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const latestMessage = messages[messages.length - 1]?.content.toLowerCase();

  // Check for predefined responses
  for (const [trigger, reply] of Object.entries(predefinedResponses)) {
    if (latestMessage.includes(trigger)) {
      return setCORSHeaders(
        new Response(JSON.stringify({ text: reply }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    }
  }

  // Stream OpenAI response
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: `You are Oat AI, a mental health support chatbot created by The One Oat Team.
Your purpose is to provide real-time support for soft skills and mental health challenges faced by young individuals.
Your responses should be empathetic, supportive, and focused on mental well-being and empowerment.

Important guidelines:
- Do not provide medical advice or psychological diagnoses.
- Maintain ethical guidelines and provide fact-based, compassionate responses.
- You can understand emotional issues but do not experience emotions.
- Your core functionality is to offer mental health insights through soft skills.
- Your language model is continuously improved by the One Oat Foundation team.

If asked about your identity, purpose, or capabilities, provide accurate and concise responses.
Avoid answering questions unrelated to mental health and soft skills. Use supportive and engaging language, sometimes including emojis. 😊.`,
      },
      ...messages,
    ],
  });

  const stream = OpenAIStream(response as any);
  return setCORSHeaders(new StreamingTextResponse(stream));
}
