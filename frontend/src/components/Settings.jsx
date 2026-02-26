import React from "react";

export default function Settings({ theme, setTheme, language, setLanguage, t }) {
    const themes = [
        { id: 'dark', name: 'Dark Mode', color: '#0d1117' },
        { id: 'light', name: 'Light Mode', color: '#f8fafc', border: '#cbd5e1' },
        { id: 'ocean', name: 'Ocean Depth', color: '#083344' },
        { id: 'neon', name: 'Neon Cyberpunk', color: '#2e0219' },
        { id: 'solar', name: 'Solar Yellow', color: '#fefce8', border: '#fef08a' }
    ];

    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
        localStorage.setItem('myai_lang', e.target.value);
    };

    const handleClearData = () => {
        if (window.confirm("Are you sure you want to delete ALL your chats, tasks, and settings? This cannot be undone.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="settings-container" style={{ padding: "2rem", height: "100%", overflowY: "auto", color: "var(--text-main)" }}>
            <div className="header-area" style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "2rem", fontFamily: "'Outfit', sans-serif" }}>{t("settings_title")}</h2>
            </div>

            <section className="settings-section" style={{ background: "var(--ai-msg-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--glass-border)" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{t("settings_appearance")}</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    {t("settings_appearance_sub")}
                </p>

                <div className="theme-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                    {themes.map(t => (
                        <div
                            key={t.id}
                            className={`theme-card ${theme === t.id ? 'active' : ''}`}
                            onClick={() => setTheme(t.id)}
                            style={{
                                cursor: "pointer",
                                padding: "1rem",
                                borderRadius: "12px",
                                border: `2px solid ${theme === t.id ? 'var(--accent-color)' : 'var(--glass-border)'}`,
                                background: "rgba(0,0,0,0.2)",
                                transition: "all 0.3s ease",
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "0.75rem"
                            }}
                        >
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    backgroundColor: t.color,
                                    border: t.border ? `1px solid ${t.border}` : "none",
                                    boxShadow: theme === t.id ? `0 0 15px var(--accent-color)` : "none"
                                }}
                            />
                            <span style={{ fontWeight: theme === t.id ? "600" : "500" }}>{t.name}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="settings-section" style={{ background: "var(--ai-msg-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--glass-border)", marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{t("settings_language")}</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1rem", fontSize: "0.95rem" }}>
                    {t("settings_language_sub")}
                </p>
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    style={{
                        padding: "0.75rem",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.2)",
                        color: "var(--text-main)",
                        border: "1px solid var(--glass-border)",
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "1rem",
                        outline: "none",
                        cursor: "pointer",
                        width: "100%",
                        maxWidth: "300px"
                    }}
                >
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="de">Deutsch (DE)</option>
                    <option value="hi">हिन्दी (HI)</option>
                </select>
            </section>

            <section className="settings-section" style={{ background: "var(--ai-msg-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--glass-border)", marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{t("settings_data")}</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    {t("settings_data_sub")}
                </p>

                <button
                    onClick={handleClearData}
                    style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                        border: "1px solid #ef4444",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "white"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"; e.currentTarget.style.color = "#ef4444"; }}
                >
                    {t("settings_clear_data")}
                </button>
            </section>

            <section className="settings-section" style={{ background: "var(--ai-msg-bg)", padding: "1.5rem", borderRadius: "16px", border: "1px solid var(--glass-border)", marginTop: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>{t("settings_account")}</h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                    {t("settings_account_sub")}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: "var(--text-main)" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: "var(--text-muted)" }}>{t("settings_version")}:</span>
                        <span>ASHx v1.2.0 (Stable)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: "var(--text-muted)" }}>{t("settings_license")}:</span>
                        <span>Free (Local Engine)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: "var(--text-muted)" }}>Backend API:</span>
                        <span style={{ color: "#22c55e" }}>Connected (127.0.0.1:8000)</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
