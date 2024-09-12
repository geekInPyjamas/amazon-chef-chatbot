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
  "<ul> <li><b>Find recipes</b> based on your preferences and dietary needs</li> <li><b>Suggest grocery items</b> to add to your Amazon Fresh cart</li> <li><b>Answer any questions</b> you have about Amazon Fresh services</li> </ul>",
  "This is a random response 2",
];

const useHardcodedResponses = false; // Change this flag to toggle

export default function App() {
  const [chatHistory, setChatHistory] = useState<{ user: string; bot: string }[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [formData, setFormData] = useState<{ age: string; postCode: string; allergies: string }>({
    age: "",
    postCode: "",
    allergies: ""
  });
  
  // Assuming userData is stored in local storage
  const [userData, setUserData] = useState<{ [key: string]: { age: string; postCode: string; allergies: string } }>({});

  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [typingMessage, setTypingMessage] = useState<string>("");

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (isLoading) {
      simulateStreaming();
    }
  }, [isLoading]);

  const simulateStreaming = () => {
    const latestBotMessage = chatHistory[chatHistory.length - 1]?.bot || "";
    let index = 0;
    const speed = 5; // Reduced speed for faster typing

    const interval = setInterval(() => {
      setTypingMessage(latestBotMessage.substring(0, index));
      index++;

      if (index > latestBotMessage.length) {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, speed);
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const usernameInput = (e.currentTarget.elements[0] as HTMLInputElement).value;
    const isUserNew = !(usernameInput in userData);
  
    setUserName(usernameInput);
    setIsLoggedIn(true);
    setIsNewUser(isUserNew);
  
    setChatHistory(isUserNew ? [
      { user: "", bot: `Welcome to Amazon Fresh, ${usernameInput}. Let's make your first order! \n Would you like me to ask you a few quick questions to explore some recipe options and order groceries?` }
    ] : [
      { user: "", bot: `Welcome back, ${usernameInput}. Would you like me to ask you a few quick questions to explore some recipe options and order groceries?` }
    ]);
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedUserData = { ...userData, [userName]: formData };
    saveUserData(updatedUserData);
    setIsNewUser(false);
    setFormData({ age: "", postCode: "", allergies: "" });
    setChatHistory([
      { user: "", bot: `Welcome to Amazon Fresh, ${userName}. Let's make your first order! \n Would you like me to ask you a few quick questions to explore some recipe options and order groceries?` }
    ]);
  };

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (prompt.trim() === "") return;

    const updatedChatHistory = [...chatHistory, { user: prompt, bot: "" }];
    const chatHistoryForLambda = updatedChatHistory.map(entry => ({
      role: "user",
      content: entry.user
    }));

    setChatHistory(updatedChatHistory);
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
        setTypingMessage(""); // Reset typing message for new animation
        setIsLoading(true); // Trigger animation
      }, 1000);
    } else {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
        chatHistory: JSON.stringify(chatHistoryForLambda)
      });

      if (!errors) {
        setChatHistory((prevHistory) => {
          const newHistory = [...prevHistory];
          newHistory[newHistory.length - 1].bot = data || "";
          return newHistory;
        });
        setTypingMessage(""); // Reset typing message for new animation
        setIsLoading(true); // Trigger animation
      } else {
        console.log(errors);
        setIsLoading(false);
      }
    }
  };

  const saveUserData = (data: { [key: string]: { age: string; postCode: string; allergies: string } }) => {
    // Save data to local storage or a backend service
    localStorage.setItem("userData", JSON.stringify(data));
    setUserData(data);
  };

  const renderNewUserForm = () => (
    <form className="user-form" onSubmit={handleFormSubmit}>
      <label htmlFor="age">Age:</label>
      <input
        id="age"
        type="text"
        placeholder="Age"
        value={formData.age}
        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
      />
      <label htmlFor="postcode">Postcode:</label>
      <input
        id="postcode"
        type="text"
        placeholder="Postcode"
        value={formData.postCode}
        onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
      />
      <label htmlFor="allergies">Allergies:</label>
      <input
        id="allergies"
        type="text"
        placeholder="Allergies"
        value={formData.allergies}
        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
      />
      <button type="submit">Submit</button>
    </form>
  );
  const renderLoginPage = () => (
    <form className="login-form" onSubmit={handleLogin}>
      <label htmlFor="username">Username:</label>
      <input
        id="username"
        type="text"
        placeholder="Enter username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );

  const renderChatWindow = () => (
    <div className="chat-container-wrapper">
      <div className="chat-container">
        <div ref={chatHistoryRef} className="chat-history">
          {chatHistory.map((entry, index) => (
            <div key={index} className="chat-entry">
              <div className="chat-bubble user-message">
                <strong>{entry.user}</strong>
              </div>
              <div className="chat-bubble bot-message">
                <img src="/chef_logo.png" alt="Amazon Chef Logo" className="anthropic-logo" />
                {index === chatHistory.length - 1 && isLoading ? (
                  <div>{typingMessage}</div>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: entry.bot }} />
                )}
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
            disabled={!prompt.trim()}
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
  );

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
          <a href="#" onClick={() => { setIsLoggedIn(false); setIsNewUser(true); }} className="nav-link">Home</a>
          <a href="#recipes" className="nav-link">Recipes</a>
          <a href="#cart" className="nav-link">Cart</a>
        </nav>
      </header>
      <main className="main-content">
        {isLoggedIn ? (
          isNewUser ? renderNewUserForm() : renderChatWindow()
        ) : (
          renderLoginPage()
        )}
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
