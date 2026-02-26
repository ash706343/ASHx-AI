import { useState, useRef, useEffect } from "react";

// Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const playAlarmSound = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();

        // rhythmic beeps
        setTimeout(() => oscillator.frequency.setValueAtTime(1108.73, audioCtx.currentTime), 200); // C#6
        setTimeout(() => oscillator.frequency.setValueAtTime(880, audioCtx.currentTime), 400); // A5
        setTimeout(() => oscillator.frequency.setValueAtTime(1108.73, audioCtx.currentTime), 600); // C#6

        setTimeout(() => oscillator.stop(), 1000);
    } catch (e) { console.error("Audio error", e) }
};

export default function Tasks({ t }) {
    const [tasks, setTasks] = useState([
        { text: "Try out the new dark mode", done: false, time: "" },
        { text: "Ask the AI a complex question", done: true, time: "" }
    ]);
    const [text, setText] = useState("");
    const [taskTime, setTaskTime] = useState("");

    // Custom Time Picker State
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [timeFormat, setTimeFormat] = useState('12h');
    const [pickerHour, setPickerHour] = useState('12');
    const [pickerMinute, setPickerMinute] = useState('00');
    const [pickerAmPm, setPickerAmPm] = useState('AM');

    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    }, []);

    const addTask = (forceText = text) => {
        if (!forceText.trim()) return;
        setTasks([{ text: forceText, done: false, time: taskTime }, ...tasks]);
        setText("");
        setTaskTime("");
    };

    const toggleTask = (index) => {
        // Prevent toggle if currently editing this task
        if (editingIndex === index) return;

        const newTasks = [...tasks];
        newTasks[index].done = !newTasks[index].done;
        setTasks(newTasks);
    };

    // Edit and Delete Tasks
    const [editingIndex, setEditingIndex] = useState(null);
    const [editTaskText, setEditTaskText] = useState("");

    const startEditing = (index, currentText, e) => {
        e.stopPropagation();
        setEditingIndex(index);
        setEditTaskText(currentText);
    };

    const saveEdit = (index, e) => {
        if (e) e.stopPropagation();
        if (!editTaskText.trim()) return;
        const newTasks = [...tasks];
        newTasks[index].text = editTaskText;
        setTasks(newTasks);
        setEditingIndex(null);
    };

    const deleteTask = (index, e) => {
        e.stopPropagation();
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
    };

    // Alarms Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();

            tasks.forEach((t, i) => {
                if (!t.done && t.time) {
                    const [th, tm] = t.time.split(':').map(Number);
                    const taskMins = th * 60 + tm;

                    // 1 Minute Warning
                    if (taskMins - currentMins === 1 && !t.warned) {
                        if (Notification.permission === "granted") {
                            new Notification(`🕒 Upcoming Task in 1 Min: ${t.text}`);
                        }
                        setTasks(prev => {
                            const updated = [...prev];
                            updated[i].warned = true;
                            return updated;
                        });
                    }

                    // Actual Alarm
                    if (taskMins === currentMins && t.alarmPlayed !== true) {
                        playAlarmSound();
                        if (Notification.permission === "granted") {
                            new Notification(`⏰ ALARM: It is time to do - ${t.text}`);
                        } else {
                            alert(`⏰ ALARM: It is time to do - ${t.text}`);
                        }

                        setTasks(prev => {
                            const updated = [...prev];
                            updated[i].alarmPlayed = true;
                            return updated;
                        });
                    }
                }
            });
        }, 1000 * 10); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [tasks]);

    // System Commander Logic
    const [commandText, setCommandText] = useState("");
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setCommandText(transcript);
                executeCommand(transcript);
            };

            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = () => setIsListening(false);
        }
    }, []);

    const toggleListen = () => {
        if (!recognitionRef.current) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // Voice to Text for Tasks
    const [isTaskListening, setIsTaskListening] = useState(false);
    const taskRecognitionRef = useRef(null);

    useEffect(() => {
        if (SpeechRecognition) {
            taskRecognitionRef.current = new SpeechRecognition();
            taskRecognitionRef.current.continuous = false;
            taskRecognitionRef.current.interimResults = false;

            taskRecognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setText(transcript);
                // Optionally auto-add: addTask(transcript); 
                // but user might want to pick a time, so leave it in input
            };

            taskRecognitionRef.current.onend = () => setIsTaskListening(false);
            taskRecognitionRef.current.onerror = () => setIsTaskListening(false);
        }
    }, []);

    const toggleTaskListen = () => {
        if (!taskRecognitionRef.current) return;
        if (isTaskListening) {
            taskRecognitionRef.current.stop();
        } else {
            taskRecognitionRef.current.start();
            setIsTaskListening(true);
        }
    };

    const executeCommand = async (textToRun) => {
        const cmd = typeof textToRun === 'string' ? textToRun : commandText;
        if (!cmd.trim()) return;

        try {
            const res = await fetch("http://127.0.0.1:8000/command", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: cmd })
            });
            const data = await res.json();
            if (data.status === "error") {
                console.error("Command Error:", data.message);
            }
            // Clear input after execution if we used the manual text box
            if (cmd === commandText) setCommandText("");
        } catch (err) {
            console.error("Failed executing OS command", err);
            // Fallback UI or log, since backend might not be online yet.
            const isOk = window.confirm(`Backend offline! If python was running, it would run: "${cmd}"\n\nIs your backend running on 127.0.0.1:8000?`);
        }
    };

    return (
        <div className="tasks-container">
            <div className="header-area">
                <h2>{t("tasks_header")}</h2>
                <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>{tasks.filter(tk => !tk.done).length} {t("tasks_pending")}</span>
            </div>

            <div className="task-input">
                <button className={`mic-btn ${isTaskListening ? 'listening' : ''}`} onClick={toggleTaskListen} title="Voice dictate task">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                </button>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t("tasks_speak_type")}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                    className="fidget-btn"
                    onClick={() => setShowTimePicker(true)}
                    title="Set an alarm reminder"
                    style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', borderBottom: '2px solid var(--glass-border)', outline: 'none', padding: '0.25rem 0.5rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
                >
                    {taskTime ? `⏰ ${taskTime}` : `⏰ ${t("tasks_set_time")}`}
                </button>
                <button className="btn-primary" onClick={() => addTask()}>{t("tasks_add")}</button>
            </div>

            <div className="command-bar-container">
                <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem", fontFamily: "'Outfit', sans-serif" }}>{t("tasks_commander_title")}</h3>
                <div className="command-input">
                    <button className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={toggleListen} title="Voice Command">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                    </button>
                    <input
                        value={commandText}
                        onChange={(e) => setCommandText(e.target.value)}
                        placeholder={t("tasks_commander_placeholder")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                executeCommand(commandText);
                            }
                        }}
                    />
                    {/* The run button is removed because enter key auto executes it */}
                </div>
            </div>

            <div className="tasks-list">
                {tasks.map((t, i) => (
                    <div key={i} className={`task-item ${t.done ? "completed" : ""}`} onClick={() => toggleTask(i)}>
                        <div className="check">
                            {t.done && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </div>

                        {editingIndex === i ? (
                            <input
                                value={editTaskText}
                                onChange={(e) => setEditTaskText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(i, e);
                                    if (e.key === "Escape") setEditingIndex(null);
                                }}
                                autoFocus
                                style={{ flex: 1, background: 'var(--ai-msg-bg)', border: '1px solid var(--accent-color)', borderRadius: '4px', color: 'var(--text-main)', padding: '0.25rem 0.5rem', outline: 'none' }}
                            />
                        ) : (
                            <span style={{ flex: 1 }}>{t.text}</span>
                        )}

                        {t.time && editingIndex !== i && (
                            <span style={{ fontSize: "0.85rem", color: "var(--accent-color)", marginRight: '1rem' }}>
                                ⏰ {t.time}
                            </span>
                        )}

                        <div className="task-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                            {editingIndex === i ? (
                                <button className="icon-action-btn" onClick={(e) => saveEdit(i, e)} title="Save" style={{ color: '#22c55e' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                            ) : (
                                <button className="icon-action-btn" onClick={(e) => startEditing(i, t.text, e)} title="Edit Task" style={{ color: 'var(--text-muted)' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                            )}
                            <button className="icon-action-btn" onClick={(e) => deleteTask(i, e)} title="Delete Task" style={{ color: '#ef4444' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CUSTOM TIME PICKER MODAL */}
            {showTimePicker && (
                <div className="time-picker-overlay">
                    <div className="time-picker-modal">
                        <h3>Set Alarm Time</h3>

                        <div className="time-format-toggle">
                            <button className={timeFormat === '12h' ? 'active' : ''} onClick={() => setTimeFormat('12h')}>12 Hour</button>
                            <button className={timeFormat === '24h' ? 'active' : ''} onClick={() => setTimeFormat('24h')}>24 Hour</button>
                        </div>

                        <div className="time-selectors">
                            <select value={pickerHour} onChange={e => setPickerHour(e.target.value)}>
                                {Array.from({ length: timeFormat === '12h' ? 12 : 24 }, (_, i) => {
                                    const val = timeFormat === '12h' ? (i + 1) : i;
                                    const strVal = val.toString().padStart(2, '0');
                                    return <option key={strVal} value={strVal}>{strVal}</option>;
                                })}
                            </select>
                            <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>:</span>
                            <select value={pickerMinute} onChange={e => setPickerMinute(e.target.value)}>
                                {Array.from({ length: 60 }, (_, i) => {
                                    const val = i.toString().padStart(2, '0');
                                    return <option key={val} value={val}>{val}</option>;
                                })}
                            </select>

                            {timeFormat === '12h' && (
                                <select value={pickerAmPm} onChange={e => setPickerAmPm(e.target.value)}>
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            )}
                        </div>

                        <div className="time-picker-actions">
                            <button onClick={() => setShowTimePicker(false)} style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', cursor: 'pointer', padding: '0.5rem 1rem' }}>Cancel</button>
                            <button className="btn-primary" onClick={() => {
                                let finalH = parseInt(pickerHour, 10);
                                if (timeFormat === '12h') {
                                    if (pickerAmPm === 'PM' && finalH !== 12) finalH += 12;
                                    if (pickerAmPm === 'AM' && finalH === 12) finalH = 0;
                                }
                                const finalTimeStr = `${finalH.toString().padStart(2, '0')}:${pickerMinute}`;
                                setTaskTime(finalTimeStr);
                                setShowTimePicker(false);
                            }}>Set Timer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}