import os
import socket
from urllib.parse import urlparse
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

def _resolve_ipv4(hostname: str) -> Optional[str]:
    try:
        infos = socket.getaddrinfo(hostname, None, socket.AF_INET, socket.SOCK_STREAM)
        if infos:
            return infos[0][4][0]
    except Exception:
        return None
    return None

def get_db_connection():
    """
    Creates and returns a single connection to the PostgreSQL database.
    Remember to close the connection and cursor when done.
    """
    try:
        db_url = _normalize_db_url(os.getenv("DATABASE_URL") or os.getenv("DB_URL"))
        if not db_url:
            raise RuntimeError("DATABASE_URL (or DB_URL) is not set.")

        try:
            conn = psycopg2.connect(db_url, connect_timeout=10)
            conn.autocommit = True
            return conn
        except Exception as primary_error:
            parsed = urlparse(db_url)
            host = parsed.hostname
            ipv4 = _resolve_ipv4(host) if host else None
            if not ipv4:
                raise primary_error

            # Retry with hostaddr to force IPv4 when IPv6 routing is unavailable.
            conn = psycopg2.connect(db_url, hostaddr=ipv4, connect_timeout=10)
            conn.autocommit = True
            return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None
