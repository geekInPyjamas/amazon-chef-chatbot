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

  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Effect to handle scrolling to the bottom of the chat window after every update
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  // Load user data from local storage
  const loadUserData = () => {
    const storedData = localStorage.getItem('userData');
    return storedData ? JSON.parse(storedData) : {};
  };

  const [userData, setUserData] = useState<{ [key: string]: { age: string; postCode: string; allergies: string } }>(loadUserData());

  const saveUserData = (data: { [key: string]: { age: string; postCode: string; allergies: string } }) => {
    localStorage.setItem('userData', JSON.stringify(data));
    setUserData(data);
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const usernameInput = (e.currentTarget.elements[0] as HTMLInputElement).value;
    // Check if user is new or returning
    const isUserNew = !(usernameInput in userData);
  
    setUserName(usernameInput);
    setIsLoggedIn(true);
    setIsNewUser(isUserNew);
  
    // Initialize chat history with a valid user message
    setChatHistory(isUserNew ? [
      { user: "", bot: `Welcome to Amazon Fresh, ${usernameInput}. Let's make your first order!` }
    ] : [
      { user: "", bot: `Welcome back, ${usernameInput}. What do you want to eat today?` }
    ]);
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Save user data
    const updatedUserData = { ...userData, [userName]: formData };
    saveUserData(updatedUserData);
    setIsNewUser(false);
    setFormData({ age: "", postCode: "", allergies: "" }); // Clear form data
    setChatHistory([
      { user: "", bot: `Welcome to Amazon Fresh, ${userName}. Let's make your first order!` }
    ]);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendPrompt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (prompt.trim() === "") {
      return; // Prevent submission if the prompt is empty
    }
  
    // Ensure the first message is from the user
    const updatedChatHistory = [...chatHistory, { user: prompt, bot: "" }];
    
    // Ensure the first message is correctly formatted with the "user" role
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
        setIsLoading(false);
      }, 1000);
    } else {
      const { data, errors } = await client.queries.generateHaiku({
        prompt,
        chatHistory: JSON.stringify(chatHistoryForLambda) // Pass formatted chat history
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

  const renderLoginPage = () => (
    <div className="login-page">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );

  const renderNewUserForm = () => (
    <div className="new-user-form">
      <h2>Welcome!</h2>
      <form onSubmit={handleFormSubmit}>
        <label>
          Age:
          <input
            type="text"
            name="age"
            value={formData.age}
            onChange={handleFormChange}
            required
          />
        </label>
        <label>
          Post Code:
          <input
            type="text"
            name="postCode"
            value={formData.postCode}
            onChange={handleFormChange}
            required
          />
        </label>
        <label>
          Allergies:
          <input
            type="text"
            name="allergies"
            value={formData.allergies}
            onChange={handleFormChange}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
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
                {entry.bot ? (
                  <div dangerouslySetInnerHTML={{ __html: entry.bot }} />
                ) : (
                  isLoading && <div className="loading-dots"><span>.</span><span>.</span><span>.</span></div>
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
          <a href="#" onClick={() => { setIsLoggedIn(false); setIsNewUser(true); }} className="nav-link">Chatbot</a>
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
