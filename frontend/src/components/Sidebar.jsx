import { useState } from "react";

export default function Sidebar({
  theme, setTheme, section, setSection,
  chats, activeChatId, setActiveChatId,
  isChatListOpen, setIsChatListOpen,
  deleteChat, renameChat, exportPDF, t
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const handleRenameSubmit = (e, id) => {
    if (e.key === "Enter" || e.type === "blur") {
      renameChat(e, id, editTitle);
      setEditingId(null);
    }
  };

  const startEditing = (e, chat) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  return (
    <aside className="sidebar fidget-panel">
      <h1 className="logo fidget-logo">ASHx</h1>

      <nav>
        <div className="nav-group">
          <button
            className={`fidget-btn ${section === "chat" ? "active" : ""}`}
            onClick={() => {
              if (section === "chat") {
                setIsChatListOpen(!isChatListOpen);
              } else {
                setSection("chat");
                setIsChatListOpen(true);
              }
            }}
          >
            <div className="btn-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>{t("sidebar_chats")}</span>
            </div>
            <svg className={`chevron ${isChatListOpen && section === "chat" ? "open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <div className={`chat-history-wrapper ${isChatListOpen && section === "chat" ? 'expanded' : ''}`}>
            <div className="chat-history-list">
              {chats.map(c => (
                <div
                  key={c.id}
                  className={`history-item fidget-click ${c.id === activeChatId ? "active" : ""}`}
                  onClick={() => setActiveChatId(c.id)}
                >
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleRenameSubmit(e, c.id)}
                      onBlur={(e) => handleRenameSubmit(e, c.id)}
                      className="edit-chat-input"
                    />
                  ) : (
                    <span className="chat-title-text" title={c.title}>{c.title}</span>
                  )}

                  <div className="history-actions">
                    <button title="Rename" onClick={(e) => startEditing(e, c)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button title="Export PDF" onClick={(e) => exportPDF(e, c)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    <button title="Delete" onClick={(e) => deleteChat(e, c.id)} className="delete-btn">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nav-group task-hover-container">
          <button
            className={`fidget-btn ${section === "tasks" ? "active" : ""}`}
            onClick={() => setSection("tasks")}
          >
            <div className="btn-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span>{t("sidebar_tasks")}</span>
            </div>
          </button>
          <div className="task-preview-tooltip">
            <div className="tooltip-title">Recent Tasks:</div>
            <p>• Try out the new dark mode</p>
            <p className="strikethrough">• Ask the AI a complex question</p>
          </div>
        </div>

        <button
          className={`fidget-btn ${section === "game" ? "active" : ""}`}
          onClick={() => setSection("game")}
        >
          <div className="btn-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>{t("sidebar_game")}</span>
          </div>
        </button>
      </nav>

      <div
        className={`theme-toggle fidget-hover ${section === "settings" ? "active" : ""}`}
        onClick={() => setSection("settings")}
        style={{ cursor: "pointer", flexDirection: "row", gap: "0.5rem", padding: "0.75rem", display: 'flex', alignItems: 'center' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-main)" }}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        <span style={{ fontSize: "0.9rem", fontWeight: "500", color: "var(--text-main)" }}>{t("sidebar_settings")}</span>
      </div>
    </aside>
  );
}