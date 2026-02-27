from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import threading
import time
import os
import platform
import subprocess
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

frontend_origin = os.getenv("FRONTEND_URL")
cors_origins = [frontend_origin] if frontend_origin else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=bool(frontend_origin),
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

from db import get_db_connection

@app.on_event("startup")
def startup_event():
    threading.Thread(target=reminder_loop, daemon=True).start()
    try:
        init_conn = get_db_connection()
        if not init_conn:
            raise RuntimeError("Database unavailable during startup.")
        init_cursor = init_conn.cursor()
        init_cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            task TEXT,
            remind_at TEXT,
            done INTEGER DEFAULT 0
        )
        """)
        init_cursor.close()
        init_conn.close()
        print("✅ Database initialized successfully.")
    except Exception as e:
        print(f"⚠️ Database initialization error: {e}")

# ---------- MODELS ----------
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []

class CommandRequest(BaseModel):
    command: str

# ---------- BACKGROUND REMINDER LOOP ----------
def reminder_loop():
    while True:
        try:
            conn = get_db_connection()
            if not conn:
                time.sleep(60)
                continue
            cursor = conn.cursor()
            now = datetime.now().strftime("%H:%M")
            cursor.execute(
                "SELECT id, task FROM tasks WHERE remind_at=%s AND done=0",
                (now,)
            )
            tasks = cursor.fetchall()

            for task_id, task in tasks:
                print(f"🔔 REMINDER: {task}")
                cursor.execute(
                    "UPDATE tasks SET done=1 WHERE id=%s",
                    (task_id,)
                )
            
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Reminder loop error: {e}")

        time.sleep(60)


@app.get("/health")
def health_check():
    conn = get_db_connection()
    if not conn:
        return {"status": "degraded", "database": "disconnected"}
    conn.close()
    return {"status": "ok", "database": "connected"}


# ---------- AI ENDPOINT ----------
@app.post("/ask")
def ask(req: ChatRequest):
    msg = req.message.lower()

    # SIMPLE REMINDER PARSER
    if "remind me" in msg and "at" in msg:
        try:
            task = msg.split("remind me to")[1].split("at")[0].strip()
            time_part = msg.split("at")[1].strip()

            conn = get_db_connection()
            if not conn:
                raise HTTPException(status_code=503, detail="Database connection is unavailable.")
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks (task, remind_at) VALUES (%s, %s)",
                (task, time_part)
            )
            cursor.close()
            conn.close()

            return {
                "reply": f"✅ Got it. I’ll remind you to **{task}** at **{time_part}**."
            }
        except HTTPException as e:
            return {"reply": f"Database error: {e.detail}"}
        except Exception as e:
            print(f"Remind parser error: {e}")
            return {
                "reply": "⚠️ I couldn't understand the time. Try: *remind me to study at 21:30*"
            }

    # NORMAL CHAT
    try:
        messages = []
        if req.history:
            messages.extend(req.history)
        messages.append({"role": "user", "content": req.message})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"reply": "I am operating in offline fallback mode right now because I could not reach my AI brain (internet or API issue). Your message was received, but I cannot generate a deep AI response until the connection is restored."}

# ---------- OS COMMAND ENDPOINT ----------
@app.post("/command")
def run_command(req: CommandRequest):
    cmd = req.command.lower()
    
    try:
        if "chrome" in cmd:
            if platform.system() == "Windows":
                os.startfile("chrome.exe")
            elif platform.system() == "Darwin":
                subprocess.Popen(["open", "-a", "Google Chrome"])
            else:
                subprocess.Popen(["google-chrome"])
            return {"status": "success", "message": "Opening Chrome"}
        
        elif "brave" in cmd:
            if platform.system() == "Windows":
                os.startfile("brave.exe")
            elif platform.system() == "Darwin":
                subprocess.Popen(["open", "-a", "Brave Browser"])
            else:
                subprocess.Popen(["brave-browser"])
            return {"status": "success", "message": "Opening Brave"}
            
        elif "notepad" in cmd:
            if platform.system() == "Windows":
                os.startfile("notepad.exe")
            else:
                subprocess.Popen(["open", "-a", "TextEdit"])
            return {"status": "success", "message": "Opening Notepad"}
            
        elif "calculator" in cmd or "calc" in cmd:
            if platform.system() == "Windows":
                os.startfile("calc.exe")
            else:
                subprocess.Popen(["open", "-a", "Calculator"])
            return {"status": "success", "message": "Opening Calculator"}

        else:
            # Fallback for dynamic opening in Windows
            if platform.system() == "Windows":
                safe_cmd = req.command.replace("open ", "").strip()
                os.system(f"start {safe_cmd}")
                return {"status": "success", "message": f"Attempting to start {safe_cmd}"}
            else:
                safe_cmd = req.command.replace("open ", "").strip()
                subprocess.Popen(["open", safe_cmd])
                return {"status": "success", "message": f"Attempting to start {safe_cmd}"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
