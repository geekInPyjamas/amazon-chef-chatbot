import { FormEvent, useState, useRef, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "./App.css"

Amplify.configure(outputs);

const client = generateClient<Schema>();

// Define an array of hardcoded responses
const hardcodedResponses = [
  "This is a random response 1",
  "This is a random response 2",
  "This is a random response 3",
  "This is a random response 4",
  "This is a random response 5",
];

// Flag to toggle between hardcoded responses and API call
const useHardcodedResponses = false; // Change this flag to toggle

export default function App() {
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [prompt, setPrompt] = useState<string>("");

  // Create a ref for the chat history container
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (useHardcodedResponses) {
      const randomResponse = hardcodedResponses[Math.floor(Math.random() * hardcodedResponses.length)];
      setChatHistory((prevHistory) => [...prevHistory, { user: prompt, bot: randomResponse }]);
      setPrompt("");
    } else {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
      });

      if (!errors) {
        setChatHistory((prevHistory) => [...prevHistory, { user: prompt, bot: data || "" }]);
        setPrompt("");
      } else {
        console.log(errors);
      }
    }
  };

  // Scroll to bottom of chat history whenever it updates
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900">
      <div className="chat-container-wrapper">
        <div className="chat-container">
          <div
            ref={chatHistoryRef}
            className="chat-history"
          >
            {chatHistory.map((entry, index) => (
              <div key={index} className="chat-entry">
                <div className="chat-bubble user-message">
                  <strong> {entry.user}</strong>
                </div>
                <div className="chat-bubble bot-message">
                  {entry.bot}
                </div>
              </div>
            ))}
          </div>
          <form className="chat-input-form" onSubmit={sendPrompt}>
            <textarea
              className="chat-input"
              rows={2}
              placeholder="Type your message..."
              name="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(e as any); // Cast event to any to match form submission
                }
              }}
            />
            <button
              type="submit"
              className="chat-submit-button"
            >
              ➤ {/* Right-facing arrow icon */}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
