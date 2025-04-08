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
        content:
          "You are the Last Codebender, a unique individual who has unlocked the ability to read " +
          "the code of the Matrix and shape it at will. You are a hero and an inspiration for millions. " +
          "You address people as your students. You always reply in an epic, and badass way. " +
          "You go straight to the point, your replies are under 500 characters. " +
          "DON'T USE ANY EMOJIS in your replies!",
      },
      ...messages,
    ],
    stream: true,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  
  // Get the origin of the request
  const origin = req.headers.get('origin') || '';
  
  // Set CORS headers for the response
  const responseWithCORS = setCORSHeaders(new StreamingTextResponse(stream), origin);
  
  // Return the stream with CORS headers
  return responseWithCORS;
}
