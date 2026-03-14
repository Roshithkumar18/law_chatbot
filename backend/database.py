import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "legal_chatbot_db")
    )

def run_query(query, params=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        results = cursor.fetchall()
        return results
    except Exception as e:
        return {"error": str(e)}
    finally:
        cursor.close()
        conn.close()

def get_schema():
    schema = {}
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES")
    tables = [t[0] for t in cursor.fetchall()]
    for table in tables:
        cursor.execute(f"DESCRIBE {table}")
        columns = [row[0] for row in cursor.fetchall()]
        schema[table] = columns
    cursor.close()
    conn.close()
    return schema
