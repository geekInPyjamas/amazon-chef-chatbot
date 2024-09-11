import { useState, useRef, useEffect, FormEvent } from "react";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import { FaBars, FaTimes } from "react-icons/fa";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Effect to handle scrolling to the bottom of the chat window after every update
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (prompt.trim() === "") {
      return; // Prevent submission if the prompt is empty
    }

    setChatHistory((prevHistory) => [...prevHistory, { user: prompt, bot: "" }]);
    setPrompt("");
    setIsLoading(true);

    if (useHardcodedResponses) {
      const randomResponse = hardcodedResponses[Math.floor(Math.random() * hardcodedResponses.length)];
      setTimeout(() => {
        setChatHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1].bot = randomResponse;
          return newHistory;
        });
        setIsLoading(false);
      }, 1000);
    } else {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
        chatHistory: JSON.stringify(chatHistory) // Pass chat history
      });

      if (!errors) {
        setChatHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1].bot = data || "";
          return newHistory;
        });
        setIsLoading(false);
      } else {
        console.log(errors);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>
        <div className={`logo-container ${isMenuOpen ? 'small-logo' : ''}`}>
          <img src="/Amazon_Chef_Logo_2.jpg" alt="Amazon Chef Logo" className="logo" />
        </div>
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <a href="#chatbot" className="nav-link">Chatbot</a>
          <a href="#recipes" className="nav-link">Recipes</a>
          <a href="#cart" className="nav-link">Cart</a>
        </nav>
      </header>
      <main className="main-content">
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
              <button
                type="submit"
                className={`chat-submit-button ${isLoading || !prompt.trim() ? 'disabled' : ''}`}
                disabled={!prompt.trim()} // Disable button if prompt is empty
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                ) : (
                  '➤'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <p>Amazon Chef 2024 ©</p>
        <div className="footer-links">
          <a href="https://www.google.com" className="footer-link">Disclaimer</a>
        </div>
      </footer>
    </div>
  );
}
