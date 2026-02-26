import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Tasks from "./components/Tasks";
import AsteroidAsh from "./components/AsteroidAsh";
import SpaceBackground from "./components/SpaceBackground";
import Settings from "./components/Settings";
import { translations } from "./translations";
import jsPDF from "jspdf";
import "./App.css";
import "./index.css";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [section, setSection] = useState("chat");
  const [language, setLanguage] = useState(localStorage.getItem('myai_lang') || 'en');

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  // Multiple Chats State
  const [chats, setChats] = useState([
    { id: Date.now(), title: "New Chat", messages: [{ role: "ai", text: "Hello! I am ASHx. How can I assist you today?" }] }
  ]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [isChatListOpen, setIsChatListOpen] = useState(true);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [{ role: "ai", text: "Hello! I am ASHx. Let's start a new conversation." }]
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setSection("chat");
    setIsChatListOpen(true);
  };

  const deleteChat = (e, id) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    if (updated.length === 0) {
      const fresh = { id: Date.now(), title: "New Chat", messages: [{ role: "ai", text: "Hello!" }] };
      setChats([fresh]);
      setActiveChatId(fresh.id);
    } else {
      setChats(updated);
      if (activeChatId === id) setActiveChatId(updated[0].id);
    }
  };

  const renameChat = (e, id, newTitle) => {
    e.stopPropagation();
    if (!newTitle.trim()) return;
    setChats(chats.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const exportPDF = (e, chat) => {
    e.stopPropagation();
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(chat.title, 20, 20);

    let y = 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    chat.messages.forEach(m => {
      const text = `${m.role === 'user' ? 'You' : 'AI'}: ${m.text}`;
      const lines = doc.splitTextToSize(text, 170);
      if (y + (lines.length * 7) > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines, 20, y);
      y += lines.length * 7 + 5;
    });
    doc.save(`${chat.title}.pdf`);
  };

  const addMessage = (chatId, newMessage) => {
    setChats(prevChats => prevChats.map(c => {
      if (c.id === chatId) {
        // Auto rename if it's the first user message and title is still "New Chat"
        let newTitle = c.title;
        if (c.title === "New Chat" && newMessage.role === "user" && c.messages.length === 1) {
          newTitle = newMessage.text.slice(0, 20) + (newMessage.text.length > 20 ? "..." : "");
        }
        return { ...c, title: newTitle, messages: [...c.messages, newMessage] };
      }
      return c;
    }));
  };

  return (
    <div className={`app ${theme}`}>
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        section={section}
        setSection={setSection}
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        isChatListOpen={isChatListOpen}
        setIsChatListOpen={setIsChatListOpen}
        deleteChat={deleteChat}
        renameChat={renameChat}
        exportPDF={exportPDF}
        t={t}
      />

      <main className="main fidget-container">
        <div className="main-content-wrapper" style={{ height: "100%" }}>
          {section === "chat" ? (
            <Chat
              chat={activeChat}
              addMessage={addMessage}
              createNewChat={createNewChat}
              t={t}
            />
          ) : section === "tasks" ? (
            <Tasks t={t} />
          ) : section === "game" ? (
            <AsteroidAsh />
          ) : section === "settings" ? (
            <Settings
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              t={t}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}