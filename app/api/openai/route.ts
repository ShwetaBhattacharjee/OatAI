import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

// Create an OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// IMPORTANT! Set the runtime to edge
export const runtime = "edge";

// Handle CORS
function setCORSHeaders(response: Response, reqOrigin?: string) {
  const allowedOrigins = ['https://oneoat.org'];
  if (reqOrigin && allowedOrigins.includes(reqOrigin)) {
    response.headers.set('Access-Control-Allow-Origin', reqOrigin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

// Define the POST function
export async function POST(req: Request, res: Response) {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();
  console.log("messages:", messages);

  // Ask OpenAI for a streaming chat completion with the provided prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          You are Oat AI, a mental health support chatbot created by The One Oat Team. 
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

  // Handle streaming properly by manually iterating over the response
  const stream = new ReadableStream({
    start(controller) {
      const reader = response[Symbol.asyncIterator]();
      function push() {
        reader.next().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          // Push the stream data into the controller
          controller.enqueue(new TextEncoder().encode(value.choices[0]?.text || ""));
          push();
        });
      }
      push();
    },
  });

  // Get the origin of the request
  const origin = req.headers.get('origin') || '';
  
  // Set CORS headers for the response
  const responseWithCORS = setCORSHeaders(new StreamingTextResponse(stream), origin);
  
  // Return the stream with CORS headers
  return responseWithCORS;
}
