import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// PromptSuggestions Component
interface PromptSuggestionsProps {
  label: string;
  onSuggestionClick: (suggestion: string) => void;
  suggestions: string[];
}

export function PromptSuggestions({
  label,
  onSuggestionClick,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-6 p-4">
      <h2 className="text-center text-2xl font-bold">{label}</h2>
      <div className="flex flex-wrap gap-4 justify-center text-sm">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-1 sm:flex-none rounded-xl border p-4 bg-gray-50 hover:bg-gray-100"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

// Chat Component
const Chat = () => {
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: "/api/openai",
  });
  const responseContainer = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const suggestions = [
    "How can I manage stress effectively?",
    "What are some tips to improve mental well-being?",
    "What are some soft skills I can develop to improve my daily life?",
  ];

  useEffect(() => {
    if (responseContainer.current) {
      responseContainer.current.scrollTop =
        responseContainer.current.scrollHeight;
    }
  }, [messages]);

  const handlePromptClick = (suggestion: string) => {
    append({ role: "user", content: suggestion });
    setShowSuggestions(false);
  };

  const renderResponse = () => (
    <div>
      {messages.map((m) => (
        <div
          key={m.id}
          className={`chat-line ${m.role === "user" ? "user-chat" : "ai-chat"}`}
        >
          {m.role === "user" ? (
            <>
              <div className="message">{m.content}</div>
              <Image
                className="avatar"
                alt="user avatar"
                width={40}
                height={40}
                src="/user-avatar.jpg"
              />
            </>
          ) : (
            <div className="ai-response">
              <Image
                className="avatar ai-avatar"
                alt="AI avatar"
                width={40}
                height={40}
                src="/ai-avatar.png"
              />
              <div className="message">
                {renderMessageWithNewLines(m.content)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMessageWithNewLines = (message: string) => {
    return message.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="main-container">
      <div className="chat">
        {showSuggestions && (
          <PromptSuggestions
            label="Try these prompts ✨"
            onSuggestionClick={handlePromptClick}
            suggestions={suggestions}
          />
        )}

        <div ref={responseContainer} className="response">
          {renderResponse()}
        </div>

        <form onSubmit={handleSubmit} className="chat-form">
          <div className="input-container">
            <input
              name="input-field"
              type="text"
              placeholder="Type your message..."
              onChange={handleInputChange}
              value={input}
              className="input-field"
            />
            <button type="submit" className="send-button">
              <svg
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24px"
                height="24px"
              >
                <path
                  fill="none"
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2 21l21-9L2 3v7l15 2-15 2z"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
