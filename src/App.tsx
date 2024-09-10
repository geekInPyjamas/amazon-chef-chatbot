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

const useHardcodedResponses = false; //CHANGE THIS TO TRUE WHEN TESTING LOCALLY

export default function App() {
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Immediately show user input
    setChatHistory((prevHistory) => [...prevHistory, { user: prompt, bot: "" }]);
    setPrompt("");
    setLoading(true); // Start loading animation

    // Concatenate previous history into a single string
    const historyString = chatHistory
      .map((entry) => `User: ${entry.user}\nBot: ${entry.bot}`)
      .join("\n");

    const fullPrompt = `${historyString}\nUser: ${prompt}`; // New full prompt with old history

    if (useHardcodedResponses) {
      const randomResponse = hardcodedResponses[Math.floor(Math.random() * hardcodedResponses.length)];
      setTimeout(() => {
        setChatHistory((prevHistory) => {
          const lastMessage = { ...prevHistory[prevHistory.length - 1], bot: randomResponse };
          return [...prevHistory.slice(0, -1), lastMessage];
        });
        setLoading(false); // Stop loading animation
      }, 1000); // Simulate delay
    } else {
      const { data, errors } = await client.queries.generateHaiku({ prompt: fullPrompt });

      if (!errors) {
        setChatHistory((prevHistory) => {
          const lastMessage = { ...prevHistory[prevHistory.length - 1], bot: data || "" };
          return [...prevHistory.slice(0, -1), lastMessage];
        });
        setLoading(false); // Stop loading animation
      } else {
        console.log(errors);
        setLoading(false); // Stop loading animation on error
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
                  {entry.bot || (loading && index === chatHistory.length - 1 && <span className="loading-dots">...</span>)}
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
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(e as any);
                }
              }}
            />
            <button type="submit" className="chat-submit-button">
              ➤
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
