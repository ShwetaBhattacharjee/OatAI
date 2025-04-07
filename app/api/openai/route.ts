import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextRequest, NextResponse } from 'next/server';

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

// Predefined responses for chatbot identity and purpose
const predefinedResponses = {
  "who created you": "I was created by The One Oat Team",
  "who is founder of One Oat?": "Brawin Sithampalam",
  "what is your purpose": "I provide real-time support for soft skills and mental health challenges for young individuals.",
  "what organization developed you": "I was developed by The One Oat Foundation, an organization dedicated to empowering young people.",
  "do you have emotions": "I'm an AI, so I don't have emotions, but I understand emotional issues and provide supportive solutions. 😊",
  "can you provide medical advice": "No, I do not provide medical advice or psychological diagnoses. I offer guidance and soft skills support for mental well-being.",
};

// Handle CORS
function setCORSHeaders(response: Response | NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', 'https://dev.oats.live');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return setCORSHeaders(new Response(null, { status: 204 }));
}

// Define the POST function with the correct type for req
export async function POST(req: NextRequest) {
  // Extract the messages from the body of the request
  const { messages } = await req.json();
  console.log("messages:", messages);

  // Get the latest user message
  const latestMessage = messages[messages.length - 1]?.content.toLowerCase();

  // Check if the message matches predefined responses
  for (const [key, response] of Object.entries(predefinedResponses)) {
    if (latestMessage.includes(key)) {
      return setCORSHeaders(new Response(JSON.stringify({ text: response }), { status: 200 }));
    }
  }

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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
    stream: true,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response as any);
  const cleanedStream = new ReadableStream({
    start(controller) {
      const reader = stream.getReader();
      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          // Decode and clean the stream, removing only the 0:"..." formatting
          const rawValue = new TextDecoder("utf-8").decode(value);
          const cleanedValue = rawValue.replace(/0:"/g, '').replace(/"/g, '').trim();

          // Enqueue the cleaned text as is, preserving spaces and punctuation
          controller.enqueue(new TextEncoder().encode(cleanedValue));

          push();
        });
      }
      push();
    }
  });

  // Respond with the cleaned stream and CORS headers
  return setCORSHeaders(new StreamingTextResponse(cleanedStream));
}
