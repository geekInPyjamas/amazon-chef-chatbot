import { FormEvent, useState, useRef, useEffect } from "react";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import "./App.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

const hardcodedResponses = [
  "This is a random response 1",
  "This is a random response 2",
  "This is a random response 3",
  "This is a random response 4",
  "This is a random response 5",
];

const useHardcodedResponses = true; // Change this flag to toggle

export default function App() {
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false); // State for loading animation

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setChatHistory((prevHistory) => [...prevHistory, { user: prompt, bot: "" }]); // Show user input immediately
    setPrompt("");
    setIsLoading(true); // Start loading animation

    if (useHardcodedResponses) {
      const randomResponse = hardcodedResponses[Math.floor(Math.random() * hardcodedResponses.length)];
      setTimeout(() => {
        setChatHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1].bot = randomResponse; // Update latest entry with bot response
          return newHistory;
        });
        setIsLoading(false); // Stop loading animation
      }, 1000);
    } else {
      const { data, errors } = await client.queries.generateHaiku({ prompt });

      if (!errors) {
        setChatHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1].bot = data || ""; // Update latest entry with bot response
          return newHistory;
        });
        setIsLoading(false); // Stop loading animation
      } else {
        console.log(errors);
        setIsLoading(false); // Stop loading animation on error
      }
    }
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-900">
      <div className="chat-container-wrapper">
        <div className="chat-container">
          <div ref={chatHistoryRef} className="chat-history">
            {chatHistory.map((entry, index) => (
              <div key={index} className="chat-entry">
                <div className="chat-bubble user-message">
                  <strong>{entry.user}</strong>
                </div>
                <div className="chat-bubble bot-message">
                  {entry.bot || (isLoading && <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>)}
                </div>
              </div>
            ))}
          </div>
          <form className="chat-input-form" onSubmit={sendPrompt}>
            <textarea
              className="chat-input"
              rows={2}
              placeholder="Amazon Chef at your service...."
              name="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(e as any);
                }
              }}
            />
            <button type="submit" className="chat-submit-button">➤</button>
          </form>
        </div>
      </div>
    </main>
  );
}
