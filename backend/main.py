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
    execute_query, generate_chart, get_crime_trends,
    generate_dynamic_er, generate_process_flow,
    get_schema, TOOLS
)

try:
    from vector_db import semantic_search_qa, get_vector_db_stats
    VECTOR_DB_ENABLED = True
    print("✅ Vector DB enabled!")
except Exception as e:
    VECTOR_DB_ENABLED = False
    print(f"⚠️ Vector DB not available: {e}")

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ============================================================
# API KEY FALLBACK SYSTEM
# Tries each key in order — if one fails, uses the next!
# ============================================================
GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
    os.getenv("GROQ_API_KEY"),  # fallback to old single key
]
# Filter out None/empty keys
GROQ_API_KEYS = [k for k in GROQ_API_KEYS if k and k.strip()]

if not GROQ_API_KEYS:
    print("❌ No API keys found! Check your .env file!")
else:
    print(f"✅ {len(GROQ_API_KEYS)} API key(s) loaded!")

current_key_index = 0

def get_groq_client():
    """Returns Groq client with current active key"""
    global current_key_index
    if not GROQ_API_KEYS:
        raise Exception("No API keys available!")
    return Groq(api_key=GROQ_API_KEYS[current_key_index])

def call_groq_with_fallback(messages, max_tokens=1024):
    """
    Calls Groq API with automatic fallback to next key if current fails!
    Tries all available keys before giving up.
    """
    global current_key_index
    last_error = None

    for attempt in range(len(GROQ_API_KEYS)):
        try:
            key_index = (current_key_index + attempt) % len(GROQ_API_KEYS)
            client = Groq(api_key=GROQ_API_KEYS[key_index])

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=max_tokens
            )

            # If successful, update current key index
            current_key_index = key_index
            if attempt > 0:
                print(f"✅ Switched to API key #{key_index + 1} successfully!")

            return response

        except Exception as e:
            error_msg = str(e).lower()
            last_error = e

            # Rate limit or auth error — try next key
            if any(err in error_msg for err in ["rate_limit", "429", "quota", "invalid_api_key", "401", "authentication"]):
                print(f"⚠️ API key #{key_index + 1} failed ({str(e)[:50]}), trying next key...")
                continue
            else:
                # Other error — don't try other keys
                raise e

    # All keys exhausted
    raise Exception(f"All {len(GROQ_API_KEYS)} API keys failed! Last error: {last_error}")

chat_histories = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# ============================================================
# ALL VISUALIZATION QUERIES
# ============================================================
VIZ_QUERIES = {
    # Bar Charts
    "case_type":      ("SELECT type, COUNT(*) as count FROM cases GROUP BY type", "type", "count", "Cases by Type", "bar"),
    "case_status":    ("SELECT status, COUNT(*) as count FROM cases GROUP BY status", "status", "count", "Cases by Status", "bar"),
    "judgement":      ("SELECT result, COUNT(*) as count FROM judgements GROUP BY result", "result", "count", "Judgements by Result", "bar"),
    "person_type":    ("SELECT type, COUNT(*) as count FROM persons GROUP BY type", "type", "count", "Persons by Type", "bar"),
    "court":          ("SELECT court_name, COUNT(*) as count FROM hearings GROUP BY court_name ORDER BY count DESC LIMIT 8", "court_name", "count", "Hearings by Court", "bar"),
    "crime_cat":      ("SELECT crime_category, SUM(incidence) as total FROM ipc_crime_stats GROUP BY crime_category ORDER BY total DESC LIMIT 8", "crime_category", "total", "Crime by Category", "bar"),
    "crime_state":    ("SELECT state, SUM(incidence) as total FROM ipc_crime_stats GROUP BY state ORDER BY total DESC LIMIT 10", "state", "total", "Crime by State", "bar"),
    "hearing_status": ("SELECT status, COUNT(*) as count FROM hearings GROUP BY status", "status", "count", "Hearings by Status", "bar"),
    # Line Charts
    "crime_trend":    ("SELECT year, SUM(incidence) as total_crimes FROM ipc_crime_stats GROUP BY year ORDER BY year", "year", "total_crimes", "Crime Trend Over Years", "line"),
    "victim_trend":   ("SELECT year, SUM(victims) as total_victims FROM ipc_crime_stats GROUP BY year ORDER BY year", "year", "total_victims", "Victims Trend Over Years", "line"),
    # Scatter Charts
    "crime_scatter":  ("SELECT state, SUM(incidence) as incidence, SUM(victims) as victims FROM ipc_crime_stats GROUP BY state ORDER BY incidence DESC LIMIT 15", "incidence", "victims", "Crime Incidence vs Victims", "scatter"),
    # Area Charts
    "crime_area":     ("SELECT year, SUM(incidence) as total_crimes FROM ipc_crime_stats GROUP BY year ORDER BY year", "year", "total_crimes", "Crime Area Over Years", "area"),
    # Pie Charts
    "pie_case_type":  ("SELECT type, COUNT(*) as count FROM cases GROUP BY type", "type", "count", "Cases by Type", "pie"),
    "pie_judgement":  ("SELECT result, COUNT(*) as count FROM judgements GROUP BY result", "result", "count", "Judgements Distribution", "pie"),
    "pie_person":     ("SELECT type, COUNT(*) as count FROM persons GROUP BY type", "type", "count", "Person Types", "pie"),
    "pie_hearing":    ("SELECT status, COUNT(*) as count FROM hearings GROUP BY status", "status", "count", "Hearing Status", "pie"),
    # Histogram
    "age_hist":       ("SELECT age, COUNT(*) as count FROM persons GROUP BY age ORDER BY age", "age", "count", "Age Distribution", "bar"),
    # Radar/Multi
    "crime_multi":    ("SELECT state, SUM(incidence) as incidence FROM ipc_crime_stats GROUP BY state ORDER BY incidence DESC LIMIT 8", "state", "incidence", "Top States Crime", "bar"),
}

def detect_viz(msg):
    """Smart detection of what visualization to show"""
    # Pie chart
    if "pie" in msg:
        if "case" in msg and "type" in msg: return "pie_case_type"
        if "judgement" in msg or "verdict" in msg: return "pie_judgement"
        if "person" in msg: return "pie_person"
        if "hearing" in msg: return "pie_hearing"
        return "pie_case_type"  # default pie

    # Scatter plot
    if "scatter" in msg or "correlation" in msg or "vs" in msg:
        return "crime_scatter"

    # Area chart
    if "area" in msg:
        return "crime_area"

    # Line/trend
    if any(k in msg for k in ["line", "trend", "over year", "linear", "non-linear", "growth"]):
        if "victim" in msg: return "victim_trend"
        return "crime_trend"

    # Bar charts
    if "bar" in msg or "graph" in msg or "chart" in msg or "visuali" in msg:
        if "judgement" in msg or "verdict" in msg: return "judgement"
        if "person" in msg: return "person_type"
        if "court" in msg: return "court"
        if "hearing" in msg: return "hearing_status"
        if "status" in msg: return "case_status"
        if "state" in msg: return "crime_state"
        if "category" in msg or "crime type" in msg: return "crime_cat"
        if "age" in msg: return "age_hist"
        return "case_type"  # default bar

    # Stats keywords
    if any(k in msg for k in ["statistics", "stats", "distribution", "count", "how many", "total", "show all"]):
        if "crime" in msg: return "crime_trend"
        if "judgement" in msg: return "pie_judgement"
        if "hearing" in msg: return "pie_hearing"
        return "case_status"

    return None

def detect_tool(message: str):
    msg = message.lower()

    # Person search
    for kw in ["cases for", "tell me about", "find", "search for", "profile of"]:
        if kw in msg:
            parts = msg.split(kw)
            if len(parts) > 1:
                name = parts[1].strip().title()
                if name and len(name) > 2:
                    return "search_person", {"name": name}

    # IPC
    if "ipc" in msg and any(char.isdigit() for char in msg):
        nums = re.findall(r'\d+[a-z]?', msg)
        if nums:
            return "search_ipc", {"section": nums[0]}

    # CrPC
    if "crpc" in msg:
        return "search_legal_qa", {"question": message, "source": "crpc"}

    # Constitution
    if "article" in msg or "constitution" in msg:
        if VECTOR_DB_ENABLED:
            return "semantic_search", {"question": message, "source": "constitution"}
        return "search_legal_qa", {"question": message, "source": "constitution"}

    # ALL visualization keywords
    viz_keywords = ["chart", "graph", "plot", "visual", "pie", "bar", "line", "scatter",
                    "area", "trend", "distribution", "statistics", "stats", "linear",
                    "non-linear", "correlation", "growth", "over year", "how many",
                    "count", "total cases", "show all", "histogram"]

    if any(k in msg for k in viz_keywords):
        viz_key = detect_viz(msg)
        if viz_key and viz_key in VIZ_QUERIES:
            query, x_key, y_key, title, chart_type = VIZ_QUERIES[viz_key]
            # Override chart type if explicitly mentioned
            if "pie" in msg: chart_type = "pie"
            elif "line" in msg or "linear" in msg or "trend" in msg: chart_type = "line"
            elif "scatter" in msg: chart_type = "scatter"
            elif "area" in msg: chart_type = "area"
            elif "bar" in msg: chart_type = "bar"
            return "generate_chart", {"query": query, "chart_type": chart_type, "x_key": x_key, "y_key": y_key, "title": title}

    # Process flow
    if any(k in msg for k in ["process flow", "flowchart", "case flow", "flow"]):
        return "generate_process_flow", {}

    # ER diagram
    if any(k in msg for k in ["er diagram", "erd", "entity", "draw", "diagram", "relationship"]):
        return "generate_dynamic_er", {}

    # Schema
    if any(k in msg for k in ["schema", "tables", "structure"]):
        return "get_schema", {}

    # Default semantic
    if VECTOR_DB_ENABLED:
        return "semantic_search", {"question": message}
    return "search_legal_qa", {"question": message}

def execute_tool_fn(name, args):
    try:
        if name == "search_person":
            return search_person(args.get("name", ""))
        elif name == "search_ipc":
            return search_ipc(args.get("section", ""))
        elif name == "search_legal_qa":
            return search_legal_qa(args.get("question", ""), args.get("source"))
        elif name == "execute_query":
            return execute_query(args.get("query", ""))
        elif name == "generate_chart":
            return generate_chart(args.get("query",""), args.get("chart_type","bar"), args.get("x_key",""), args.get("y_key",""), args.get("title","Chart"))
        elif name == "get_crime_trends":
            return get_crime_trends()
        elif name == "generate_dynamic_er":
            return generate_dynamic_er()
        elif name == "generate_process_flow":
            return generate_process_flow()
        elif name == "get_schema":
            return get_schema()
        elif name == "semantic_search":
            if VECTOR_DB_ENABLED:
                return semantic_search_qa(args.get("question",""), source=args.get("source"))
            return search_legal_qa(args.get("question",""))
        return {"error": "Unknown tool"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id
    if session_id not in chat_histories:
        chat_histories[session_id] = []
    chat_histories[session_id].append({"role": "user", "content": request.message})

    dynamic_chart = None
    line_data = None
    mermaid = None
    mermaid_type = None
    tool_used = None
    sql_executed = None
    tool_result = None

    try:
        tool_name, tool_args = detect_tool(request.message)

        if tool_name:
            tool_result = execute_tool_fn(tool_name, tool_args)
            tool_used = tool_name
            if isinstance(tool_result, dict):
                sql_executed = tool_result.get("sql_executed")
            if tool_name == "generate_chart" and tool_result and not tool_result.get("error"):
                dynamic_chart = tool_result
            elif tool_name == "get_crime_trends":
                line_data = tool_result
            elif tool_name in ["generate_dynamic_er", "generate_process_flow"]:
                if isinstance(tool_result, dict):
                    mermaid = tool_result.get("mermaid")
                    mermaid_type = tool_result.get("diagram_type")

        system_prompt = """You are JurisAI, a professional Legal Assistant for Indian courts.

STRICT FORMATTING RULES - ALWAYS FOLLOW:
1. NEVER use ### or ## or # for headings - instead write the heading as a plain bold line using **Heading Text**
2. NEVER use --- or === dividers
3. For bullet points use simple format: "- item" on its own line
4. For numbered lists use: "1. item" on its own line  
5. Use **bold** only for: names, case numbers, IPC sections, important legal terms
6. Keep responses clean and readable - no raw markdown symbols visible
7. Always remember full conversation context
8. If user asks follow-up questions refer to previous messages
9. Be concise, professional and formal

EMOJI RULES - use these professional emojis naturally:
⚖️ for legal matters, judgements, laws
📋 for cases, documents, records
👤 for persons, accused, complainant
🏛️ for courts, constitutional matters
📅 for dates, hearings, schedules
📊 for charts, statistics, data
📜 for IPC sections, acts, laws
✅ for completed, success, granted
❌ for dismissed, rejected, closed
⏳ for pending, ongoing matters
🔍 for search results, findings
ℹ️ for general information
📌 for important points
🗂️ for case files, records

EXAMPLE of good response:
**📋 Case Summary for Rahul Sharma**

👤 Rahul Sharma has **1 active case** filed under **📜 IPC Section 302**.

**Case Details**
- 📋 Case Number: CASE/1515/2026
- ⏳ Status: Pending
- 📅 Filed: 2024-10-29

**🏛️ Hearings**
1. 📅 12 September 2025 - Chennai District Court - Adjourned
2. 📅 30 March 2025 - Kolkata Court - ⏳ Postponed

**⚖️ Judgement**
- ✅ Result: Guilty
- 👨‍⚖️ Judge: Hon. Justice Pillai"""

        # Build messages with full conversation history
        history = chat_histories[session_id][:-1]
        recent_history = history[-10:] if len(history) > 10 else history

        if tool_result:
            result_str = json.dumps(tool_result, default=str)[:3000]
            user_content = f"""User asked: {request.message}

Database Result:
{result_str}

Present this data clearly and professionally following the formatting rules.
Use **bold** for names, numbers, sections. Use bullet points and numbered lists.
Do NOT use ### or --- symbols."""
        else:
            user_content = request.message

        all_messages = [{"role": "system", "content": system_prompt}]
        all_messages += recent_history
        all_messages += [{"role": "user", "content": user_content}]

        response = call_groq_with_fallback(all_messages, max_tokens=1024)
        final_text = response.choices[0].message.content

    except Exception as e:
        final_text = f"Sorry, error occurred: {str(e)}"

    chat_histories[session_id].append({"role": "assistant", "content": final_text})

    # Extract raw tabular results for table display
    query_results = None
    if tool_result and isinstance(tool_result, dict):
        if "data" in tool_result and isinstance(tool_result["data"], list):
            query_results = tool_result["data"][:20]  # max 20 rows
        elif "person" in tool_result:
            query_results = [tool_result["person"]] if tool_result.get("person") else None

    return {
        "response": final_text,
        "chart_data": None,
        "line_data": line_data,
        "dynamic_chart": dynamic_chart,
        "mermaid": mermaid,
        "mermaid_type": mermaid_type,
        "tool_used": tool_used,
        "sql_executed": sql_executed,
        "query_results": query_results,
        "vector_db_enabled": VECTOR_DB_ENABLED
    }

@app.get("/vector-status")
def vector_status():
    if VECTOR_DB_ENABLED:
        return get_vector_db_stats()
    return {"status": "Vector DB not enabled"}

@app.get("/api-status")
def api_status():
    return {
        "total_keys": len(GROQ_API_KEYS),
        "active_key_index": current_key_index + 1,
        "status": f"Using key #{current_key_index + 1} of {len(GROQ_API_KEYS)}"
    }

@app.get("/")
def root():
    return {
        "status": "JurisAI API Running! 🚀",
        "vector_db": VECTOR_DB_ENABLED,
        "api_keys_loaded": len(GROQ_API_KEYS)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
