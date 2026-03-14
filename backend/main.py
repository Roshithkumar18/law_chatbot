from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os
import json

from tools import (
    search_person, search_ipc, search_legal_qa,
    get_case_stats, generate_er_diagram, get_schema, TOOLS
)

load_dotenv()

app = FastAPI()

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Store chat history
chat_histories = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

# ============================================================
# EXECUTE TOOL
# ============================================================
def execute_tool(name, args):
    if name == "search_person":
        return search_person(args.get("name", ""))
    elif name == "search_ipc":
        return search_ipc(args.get("section", ""))
    elif name == "search_legal_qa":
        return search_legal_qa(args.get("question", ""), args.get("source"))
    elif name == "get_case_stats":
        return get_case_stats()
    elif name == "generate_er_diagram":
        return generate_er_diagram()
    elif name == "get_schema":
        return get_schema()
    return {"error": "Unknown tool"}

# ============================================================
# CHAT ENDPOINT
# ============================================================
@app.post("/chat")
async def chat(request: ChatRequest):
    session_id = request.session_id

    # Initialize history
    if session_id not in chat_histories:
        chat_histories[session_id] = []

    # Add user message
    chat_histories[session_id].append({
        "role": "user",
        "content": request.message
    })

    # System prompt
    system_prompt = """You are a Legal Assistant AI for Indian courts.
You have access to a database with:
- IPC sections and crime statistics
- CrPC, CPC, Constitution, Evidence Act
- Legal Q&A (14,000+ entries)
- Court cases, hearings, judgements
- Person profiles

When user asks about a person → use search_person tool
When user asks about IPC section → use search_ipc tool
When user asks legal questions → use search_legal_qa tool
When user wants charts/stats → use get_case_stats tool
When user wants ER diagram → use generate_er_diagram tool

Always be helpful, accurate and professional.
Explain legal terms in simple language."""

    messages = [{"role": "system", "content": system_prompt}] + chat_histories[session_id]

    chart_data = None
    mermaid = None
    tool_used = None

    try:
        # First call to Groq
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            parallel_tool_calls=False,
            max_tokens=2048
        )

        msg = response.choices[0].message

        # Handle tool calls
        if msg.tool_calls:
            # Build correct assistant message format
            assistant_msg = {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    } for tc in msg.tool_calls
                ]
            }

            tool_results = []
            for tool_call in msg.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments or "{}")
                result = execute_tool(tool_name, tool_args)
                tool_used = tool_name

                if tool_name == "get_case_stats":
                    chart_data = result
                if tool_name == "generate_er_diagram":
                    mermaid = result

                tool_results.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, default=str)
                })

            # Second call with tool results
            follow_up = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages + [assistant_msg] + tool_results,
                max_tokens=2048
            )
            final_text = follow_up.choices[0].message.content

        else:
            final_text = msg.content

    except Exception as e:
        final_text = f"Sorry, error occurred: {str(e)}"

    # Save assistant response
    chat_histories[session_id].append({
        "role": "assistant",
        "content": final_text
    })

    return {
        "response": final_text,
        "chart_data": chart_data,
        "mermaid": mermaid,
        "tool_used": tool_used
    }

# ============================================================
# HEALTH CHECK
# ============================================================
@app.get("/")
def root():
    return {"status": "Legal Chatbot API Running! 🚀"}

# ============================================================
# RUN SERVER
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
