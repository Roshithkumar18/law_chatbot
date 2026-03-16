from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import json
import re

from tools import (
    search_person, search_ipc, search_legal_qa,
    get_case_stats, get_crime_trends,
    generate_er_diagram, generate_process_flow,
    get_schema
)

# Try to import vector DB
try:
    from vector_db import semantic_search_qa, semantic_search_ipc, get_vector_db_stats
    VECTOR_DB_ENABLED = True
    print("✅ Vector DB enabled!")
except Exception as e:
    VECTOR_DB_ENABLED = False
    print(f"⚠️ Vector DB not available: {e}")

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chat_histories = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# ============================================================
# EXECUTE TOOL
# ============================================================
def execute_tool(name, args):
    try:
        if name == "search_person":
            return search_person(args.get("name", ""))
        elif name == "search_ipc":
            return search_ipc(args.get("section", ""))
        elif name == "search_legal_qa":
            return search_legal_qa(args.get("question", ""), args.get("source"))
        elif name == "get_case_stats":
            return get_case_stats()
        elif name == "get_crime_trends":
            return get_crime_trends()
        elif name == "generate_er_diagram":
            return generate_er_diagram()
        elif name == "generate_process_flow":
            return generate_process_flow()
        elif name == "get_schema":
            return get_schema()
        elif name == "semantic_search":
            if VECTOR_DB_ENABLED:
                return semantic_search_qa(
                    args.get("question", ""),
                    source=args.get("source")
                )
            else:
                return search_legal_qa(args.get("question", ""))
        return {"error": "Unknown tool"}
    except Exception as e:
        return {"error": str(e)}

# ============================================================
# DETECT TOOL FROM MESSAGE
# ============================================================
def detect_tool(message: str):
    msg = message.lower()

    # Person search
    for kw in ["cases for", "show me", "tell me about", "find", "search for", "profile of"]:
        if kw in msg:
            parts = msg.split(kw)
            if len(parts) > 1:
                name = parts[1].strip().title()
                if name and len(name) > 2:
                    return "search_person", {"name": name}

    # IPC Section with number
    if "ipc" in msg and any(char.isdigit() for char in msg):
        nums = re.findall(r'\d+[a-z]?', msg)
        if nums:
            return "search_ipc", {"section": nums[0]}

    # CrPC
    if "crpc" in msg:
        return "search_legal_qa", {"question": message, "source": "crpc"}

    # Constitution / Article
    if "article" in msg or "constitution" in msg:
        if VECTOR_DB_ENABLED:
            return "semantic_search", {"question": message, "source": "constitution"}
        return "search_legal_qa", {"question": message, "source": "constitution"}

    # Process flow
    if any(kw in msg for kw in ["process flow", "flowchart", "case flow", "how does a case", "flow diagram"]):
        return "generate_process_flow", {}

    # ER diagram
    if any(kw in msg for kw in ["er diagram", "erd", "entity", "draw", "diagram", "database structure"]):
        return "generate_er_diagram", {}

    # Line chart
    if any(kw in msg for kw in ["trend", "over year", "year wise", "line chart", "crime trend"]):
        return "get_crime_trends", {}

    # Stats charts
    if any(kw in msg for kw in ["statistics", "stats", "chart", "graph", "how many cases", "cases by"]):
        return "get_case_stats", {}

    # Schema
    if any(kw in msg for kw in ["schema", "tables", "structure"]):
        return "get_schema", {}

    # Vector DB stats
    if "vector" in msg or "semantic" in msg:
        return "get_schema", {}

    # DEFAULT → Semantic search if available, else MySQL search
    if VECTOR_DB_ENABLED:
        return "semantic_search", {"question": message}
    else:
        return "search_legal_qa", {"question": message}

# ============================================================
# CHAT ENDPOINT
# ============================================================
@app.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id

    if session_id not in chat_histories:
        chat_histories[session_id] = []

    chat_histories[session_id].append({
        "role": "user",
        "content": request.message
    })

    chart_data = None
    line_data = None
    mermaid = None
    mermaid_type = None
    tool_used = None
    sql_executed = None
    search_type = None
    tool_result = None

    try:
        # Detect and execute tool
        tool_name, tool_args = detect_tool(request.message)

        if tool_name:
            tool_result = execute_tool(tool_name, tool_args)
            tool_used = tool_name

            # Extract metadata
            if isinstance(tool_result, dict):
                sql_executed = tool_result.get("sql_executed")
                search_type = tool_result.get("search_type")

            # Extract visualizations
            if tool_name == "get_case_stats":
                chart_data = tool_result
            elif tool_name == "get_crime_trends":
                line_data = tool_result
            elif tool_name in ["generate_er_diagram", "generate_process_flow"]:
                if isinstance(tool_result, dict):
                    mermaid = tool_result.get("mermaid")
                    mermaid_type = tool_result.get("diagram_type")

        # Build AI prompt
        system_prompt = """You are a Legal Assistant AI for Indian courts.
You have access to Indian legal data including IPC, CrPC, Constitution, court cases and judgements.
Answer clearly and helpfully. Explain legal terms in simple language.
When you receive database results, summarize them clearly for the user.
Be concise and professional."""

        if tool_result:
            # Limit result size for prompt
            result_str = json.dumps(tool_result, default=str)[:3000]
            user_content = f"""User asked: {request.message}

Database/Search result: {result_str}

Please explain this data clearly in simple English. Be helpful and concise."""
        else:
            user_content = request.message

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            max_tokens=1024
        )

        final_text = response.choices[0].message.content

    except Exception as e:
        final_text = f"Sorry, error occurred: {str(e)}"

    chat_histories[session_id].append({
        "role": "assistant",
        "content": final_text
    })

    return {
        "response": final_text,
        "chart_data": chart_data,
        "line_data": line_data,
        "mermaid": mermaid,
        "mermaid_type": mermaid_type,
        "tool_used": tool_used,
        "sql_executed": sql_executed,
        "search_type": search_type,
        "vector_db_enabled": VECTOR_DB_ENABLED
    }

# ============================================================
# VECTOR DB STATUS ENDPOINT
# ============================================================
@app.get("/vector-status")
def vector_status():
    if VECTOR_DB_ENABLED:
        return get_vector_db_stats()
    return {"status": "Vector DB not enabled"}

# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/")
def root():
    return {
        "status": "Legal Chatbot API Running! 🚀",
        "vector_db": VECTOR_DB_ENABLED
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
