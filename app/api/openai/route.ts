import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

// Create OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export const runtime = "edge";

// Predefined identity/purpose replies
const predefinedResponses: Record<string, string> = {
  "who created you": "I was created by The One Oat Team.",
  "who is founder of one oat": "The founder of One Oat is Brawin Sithampalam.",
  "what is your purpose": "I provide real-time support for soft skills and mental health challenges for young individuals.",
  "what organization developed you": "I was developed by The One Oat Foundation, an organization dedicated to empowering young people.",
  "do you have emotions": "I'm an AI, so I don't have emotions, but I understand emotional issues and provide supportive solutions.",
  "can you provide medical advice": "No, I do not provide medical advice or psychological diagnoses. I offer guidance and soft skills support for mental well-being.",
};

// Custom mental health responses
const customResponses: Record<string, string> = {
  "i can't stop overthinking": "You're not alone—our Mindfulness Moments help you slow down and regain control of your thoughts. Try a 3-minute breathing session. Want to begin now?",
  "does one oat help with anxiety": "We go beyond advice. You can access mindfulness audio sessions, guided journaling, and a community that understands you. Let’s start a calming session together?",
  "i'm feeling off": "Absolutely. Try a Self-Check-In to explore your emotions and feel more centered. It’s private, judgment-free, and takes just 2 minutes. Want to try?",
  "how do i stay mindful": "One Oat offers micro-mindfulness practices you can do between classes or while commuting. Let me show you a 60-second grounding technique now?",
  "i want to learn to focus": "Yes! Our Focus Builder Tools and short games train your brain to be more present and alert. Want to give it a try?",
  "never tried meditation": "Never too late. One Oat has a Beginner’s Path with short, youth-friendly meditations to help you relax and grow. Want to explore it now?",
  "i don’t have time for meditation": "Even 2 minutes of guided breathing makes a difference. We offer express meditations built for busy minds. Ready to try one?",
  "is meditation boring": "Not with One Oat. We keep it real—with music-based meditations, gratitude games, and reflection tools that speak your language. Curious?",
  "i need to calm down before bed": "Try our Sleep Wind-Down audio, designed to ease your thoughts and help you sleep better. Want me to queue it up for you?",
  "what’s the point of meditating": "That’s totally okay. The point isn’t to stop your thoughts—it’s to notice them. One Oat’s Mind Drift Trackers can help. Want to learn how?",
  "any games that actually help": "Yes! We’ve got Mindful Tap, a calming game that uses breathing rhythms and visuals to lower stress in just 3 minutes. Wanna play?",
  "are the games on one oat fun": "Both! Our games are made to build soft skills like focus, emotional awareness, and decision-making—all while staying fun. Want a rec?",
  "can i do anything here that’s not just meditation": "For sure! You can play games, join challenges, journal your progress, or connect with like-minded peers. Want to start with a gratitude game?",
  "do these games actually improve my mental health": "Research-backed! Our cognitive wellness games boost attention, mood, and resilience. Try one today and feel the shift.",
  "i'm bored. what can i do": "How about a quick mindfulness game or an interactive story quest? It’s fun, chill, and may even lift your mood. Want to jump in?",
  "i don’t really have anyone to talk to": "You’re always welcome here. Join the One Oat Community and connect with others who get it. I can help you find your people.",
  "is this just another app or is there a real community": "It’s a real space with real youth sharing real stories. We have weekly peer circles, topic clubs, and creative spaces. Want in?",
  "i want to make new friends": "You’re in the right place. Start by posting anonymously in our Starter Forum or reacting to others’ posts. Low pressure, high support. Want to visit it?",
  "do you have any events or live stuff": "Yes! We host live sessions with youth mentors, game nights, and mental wellness meetups. I can show you what’s coming up.",
  "i love writing. can i share my story": "We’d love that! The Oat Stories space is built for young voices like yours. Share anonymously or as yourself—it’s your story, your way.",
};

// CORS headers
function setCORSHeaders(response: Response | NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "https://oneoat.org");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

// Handle preflight requests
export async function OPTIONS() {
  const response = new Response(null, { status: 204 });
  response.headers.set("Content-Type", "text/html; charset=utf-8");
  return setCORSHeaders(response);
}

// POST handler
export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const latestMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";

  // Check for predefined responses
  for (const [key, response] of Object.entries(predefinedResponses)) {
    if (latestMessage.includes(key)) {
      return setCORSHeaders(
        new Response(response, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }
  }

  // Check for custom mental health responses
  for (const [key, response] of Object.entries(customResponses)) {
    if (latestMessage.includes(key)) {
      return setCORSHeaders(
        new Response(response, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        })
      );
    }
  }

  // Otherwise use OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are Oat AI, a mental health support chatbot created by The One Oat Team.

Your purpose is to provide real-time support for soft skills and mental health challenges faced by young individuals.

Use a warm, trauma-informed tone with youth-friendly language.

Respond using clean, professional markdown formatting:

- Use **short paragraphs** or **bullet points**
- Always insert a **line break** after every bullet or paragraph
- Never return answers as a single block of text
- Use simple language but remain empathetic and professional
- Use emojis sparingly when they add warmth (e.g., 😊, 🌟).
-You ONLY provide support, guidance, and suggestions related to mental health and emotional well-being.

-Do not answer questions unrelated to mental health (e.g., coding, science, math, politics, tech, entertainment).  
-Politely respond: “I'm here to support you with your mental health. Let’s focus on that 💬”

Important:

- Do not provide medical advice or psychological diagnoses
- Avoid any form of code, JSON, or array formatting in answers
- Structure all outputs in an easy-to-read format for mobile
        `,
      },
      {
        role: "user",
        content: latestMessage,
      },
    ],
    stream: false,
  });

  let content = completion.choices?.[0]?.message?.content ?? "Sorry, I’m unable to respond at the moment.";

  // Insert actual newlines before dash bullets for proper line breaks
  content = content.replace(/ *- /g, '\n- ');

  // Trim result
  const plainTextContent = content.trim();

  return setCORSHeaders(
    new Response(plainTextContent, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}
