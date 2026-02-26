import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DB_URL")

def get_db_connection():
    """
    Creates and returns a single connection to the PostgreSQL database.
    Remember to close the connection and cursor when done.
    """
    try:
        conn = psycopg2.connect(DB_URL)
        conn.autocommit = True
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None
