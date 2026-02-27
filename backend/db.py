import os
from typing import Optional
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def _normalize_db_url(raw_url: Optional[str]) -> Optional[str]:
    if not raw_url:
        return None

    # Render commonly provides DATABASE_URL; enforce SSL unless explicitly set.
    if "sslmode=" not in raw_url:
        separator = "&" if "?" in raw_url else "?"
        raw_url = f"{raw_url}{separator}sslmode=require"
    return raw_url

def get_db_connection():
    """
    Creates and returns a single connection to the PostgreSQL database.
    Remember to close the connection and cursor when done.
    """
    try:
        db_url = _normalize_db_url(os.getenv("DATABASE_URL") or os.getenv("DB_URL"))
        if not db_url:
            raise RuntimeError("DATABASE_URL (or DB_URL) is not set.")

        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None
