import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import AsteroidAsh from "./AsteroidAsh"; /* Imported to reuse asteroid renderers */

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const TerminalCodeBlock = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || "");
  const [isEditing, setIsEditing] = useState(false);
  const [codeContent, setCodeContent] = useState(String(children).replace(/\n$/, ""));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCodeContent(String(children).replace(/\n$/, ""));
  }, [children]);

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal-code-block">
      <div className="terminal-header">
        <span className="terminal-lang">{match ? match[1] : "code"}</span>
        <div className="terminal-actions">
          <button className="terminal-btn edit-btn" onClick={() => setIsEditing(!isEditing)} title="Edit Code">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            {isEditing ? "Save" : "Edit"}
          </button>
          <button className="terminal-btn copy-btn" onClick={handleCopy} title="Copy Code">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      {isEditing ? (
        <textarea
          className="terminal-editor"
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          spellCheck="false"
        />
      ) : (
        <pre className={className} {...props}>
          <code>{codeContent}</code>
        </pre>
      )}
    </div>
  );
};

export default function Chat({ chat, addMessage, createNewChat, t }) {
  const endRef = useRef(null);
  const [input, setInput] = useState("");
  // Background Toggle
  const [showBackground, setShowBackground] = useState(false);

  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev ? prev + " " + transcript : transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListen = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Track if AI is typing to show a loader
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || !chat) return;

    const currentInput = input;
    addMessage(chat.id, { role: "user", text: currentInput });
    setInput("");
    setIsTyping(true);

    // OFFLINE CAPABILITIES
    if (!navigator.onLine) {
      setTimeout(() => {
        let responseText = `I am currently fully offline and disconnected from my AI brain because there is no internet connection. I need the internet to generate responses, answer questions, or perform commands. I am *only* able to provide emergency contacts while offline. Please connect to Wi-Fi to chat with me properly.`;

        const lowerInput = currentInput.toLowerCase();
        // Regex to catch words like help, emergency, problem, danger, dying, accident, trouble, save me
        if (lowerInput.match(/\b(help|emergency|problem|danger|dying|accident|trouble|save|hurt)\b/) || lowerInput.includes("in a problem") || lowerInput.includes("need help")) {
          responseText = `⚠️ **EMERGENCY OFFLINE MODE INITIATED** ⚠️\n\nIt appears you are offline and in need of immediate assistance. Since I cannot connect to the internet to help you directly, **PLEASE DIAL YOUR LOCAL EMERGENCY NUMBER IMMEDIATELY**:\n\n📞 **USA/Canada**: 911\n📞 **UK**: 999\n📞 **Europe**: 112\n📞 **India**: 112\n📞 **Australia**: 000\n\nPlease find a human or use your phone's cellular network to call for help!`;
        } else if (lowerInput.match(/\b(hi|hello|hey)\b/)) {
          responseText = `Hello! As a reminder, I am currently offline and my AI features are disabled. I can only provide emergency numbers right now. Please reconnect to the internet!`;
        } else if (lowerInput.includes("who are you")) {
          responseText = `I am ASHx, but right now I am disconnected. Reconnect to the internet for my full capabilities!`;
        }

        addMessage(chat.id, { role: "ai", text: responseText });
        setIsTyping(false);
      }, 1000);
      return;
    }

    // ONLINE CAPABILITIES (To backend AI)
    try {
      const formattedHistory = chat.messages.map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.text
      }));

      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, history: formattedHistory })
      });
      const data = await res.json();

      if (data.reply) {
        addMessage(chat.id, { role: "ai", text: data.reply });
      } else {
        addMessage(chat.id, { role: "ai", text: "Something went wrong on the server." });
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // Fallback if backend is not running, but internet might be on
      addMessage(chat.id, { role: "ai", text: "I couldn't reach the AI server. Please make sure the Python backend is running on port 8000!" });
    } finally {
      setIsTyping(false);
    }
  };

  if (!chat) return null;

  return (
    <div className="chat-container" style={{ position: "relative" }}>
      {/* Background Asteroids inside Chat (Fidget Only) */}
      {showBackground && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1, overflow: "hidden" }}>
          <AsteroidAsh isBackgroundOnly={true} />
        </div>
      )}

      <div className="main-content-wrapper" style={{ position: "relative", zIndex: 2, height: "100%" }}>
        {/* HEADER */}
        <div className="header-area fidget-header">
          <h2>{chat.title}</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="fidget-btn"
              onClick={() => setShowBackground(!showBackground)}
              title="Toggle Background Asteroids"
              style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--glass-border)', padding: '0.25rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
            >
              {showBackground ? t("chat_hide_rocks") : t("chat_show_rocks")}
            </button>
            <button className="btn-primary fidget-scale" onClick={createNewChat}>
              {t("sidebar_new_chat")}
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="chat-body" style={{ background: "transparent" }}>
          {chat.messages.length === 0 ? (
            <div className="empty-chat fidget-bounce">
              <h3>{t("chat_welcome")}</h3>
              <p>{t("chat_welcome_sub")}</p>
            </div>
          ) : (
            chat.messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <ReactMarkdown
                  components={{
                    code: TerminalCodeBlock
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            ))
          )}

          {isTyping && (
            <div className="bubble ai typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* INPUT */}
        <div className="chat-input-bar">
          <button className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={toggleListen} title="Voice Dictation" style={{ flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("chat_input_placeholder")}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="fidget-input"
          />
          <button onClick={sendMessage} title={t("chat_send")} className="fidget-scale send-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}