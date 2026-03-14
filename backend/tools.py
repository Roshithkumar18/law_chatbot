from database import run_query, get_schema as db_schema

# ============================================================
# TOOL 1 - GET SCHEMA
# ============================================================
def get_schema():
    schema = db_schema()
    result = "Database Schema:\n"
    for table, columns in schema.items():
        result += f"\nTable: {table}\n"
        result += f"Columns: {', '.join(columns)}\n"
    return result

# ============================================================
# TOOL 2 - SEARCH PERSON
# ============================================================
def search_person(name: str):
    # Search person
    persons = run_query(
        "SELECT * FROM persons WHERE name LIKE %s",
        (f"%{name}%",)
    )
    if not persons:
        return {"message": f"No person found with name '{name}'"}

    person = persons[0]
    person_id = person['id']

    # Get their cases
    cases = run_query(
        "SELECT * FROM cases WHERE person_id = %s",
        (person_id,)
    )

    # Get hearings for each case
    all_hearings = []
    all_judgements = []
    for case in cases:
        hearings = run_query(
            "SELECT * FROM hearings WHERE case_id = %s",
            (case['id'],)
        )
        judgements = run_query(
            "SELECT * FROM judgements WHERE case_id = %s",
            (case['id'],)
        )
        all_hearings.extend(hearings)
        all_judgements.extend(judgements)

    return {
        "person": person,
        "cases": cases,
        "hearings": all_hearings,
        "judgements": all_judgements,
        "summary": f"{person['name']} has {len(cases)} case(s), {len(all_hearings)} hearing(s), {len(all_judgements)} judgement(s)"
    }

# ============================================================
# TOOL 3 - SEARCH IPC SECTION
# ============================================================
def search_ipc(section: str):
    # Search in ipc_sections table
    results = run_query(
        "SELECT * FROM ipc_sections WHERE section_number LIKE %s LIMIT 5",
        (f"%{section}%",)
    )
    if not results:
        # Search in legal_qa
        results = run_query(
            "SELECT * FROM legal_qa WHERE source='ipc' AND question LIKE %s LIMIT 5",
            (f"%{section}%",)
        )
    return results

# ============================================================
# TOOL 4 - SEARCH LEGAL QA
# ============================================================
def search_legal_qa(question: str, source: str = None):
    if source:
        results = run_query(
            "SELECT * FROM legal_qa WHERE source = %s AND question LIKE %s LIMIT 5",
            (source, f"%{question}%")
        )
    else:
        results = run_query(
            "SELECT * FROM legal_qa WHERE question LIKE %s LIMIT 5",
            (f"%{question}%",)
        )
    return results

# ============================================================
# TOOL 5 - EXECUTE CUSTOM QUERY
# ============================================================
def execute_query(query: str):
    # Safety check - only allow SELECT
    if not query.strip().upper().startswith("SELECT"):
        return {"error": "Only SELECT queries allowed!"}
    results = run_query(query)
    return results

# ============================================================
# TOOL 6 - GET CASE STATS (for charts)
# ============================================================
def get_case_stats():
    # Cases by status
    by_status = run_query(
        "SELECT status, COUNT(*) as count FROM cases GROUP BY status"
    )
    # Cases by type
    by_type = run_query(
        "SELECT type, COUNT(*) as count FROM cases GROUP BY type"
    )
    # Crime stats by state
    by_state = run_query(
        "SELECT state, SUM(incidence) as total FROM ipc_crime_stats GROUP BY state ORDER BY total DESC LIMIT 10"
    )
    return {
        "by_status": by_status,
        "by_type": by_type,
        "by_state": by_state
    }

# ============================================================
# TOOL 7 - GENERATE ER DIAGRAM
# ============================================================
def generate_er_diagram():
    return """
erDiagram
    PERSONS {
        int id PK
        string name
        int age
        string gender
        string phone
        string aadhaar
        string type
    }
    CASES {
        int id PK
        int person_id FK
        string case_number
        string title
        string type
        string ipc_section
        date filed_date
        string status
    }
    HEARINGS {
        int id PK
        int case_id FK
        date hearing_date
        string judge_name
        string court_name
        date next_date
        string status
    }
    JUDGEMENTS {
        int id PK
        int case_id FK
        string judge_name
        date judgement_date
        string result
    }
    IPC_SECTIONS {
        int id PK
        string section_number
        string offense
        string punishment
    }
    LEGAL_QA {
        int id PK
        string source
        string question
        string answer
    }
    PERSONS ||--o{ CASES : "has"
    CASES ||--o{ HEARINGS : "has"
    CASES ||--o{ JUDGEMENTS : "has"
    CASES }o--|| IPC_SECTIONS : "references"
"""

# ============================================================
# TOOLS LIST FOR GPT
# ============================================================
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_person",
            "description": "Search for a person by name and get all their cases, hearings and judgements",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Person's name to search"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_ipc",
            "description": "Search IPC section details - offense and punishment",
            "parameters": {
                "type": "object",
                "properties": {
                    "section": {"type": "string", "description": "IPC section number like 302, 420"}
                },
                "required": ["section"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_legal_qa",
            "description": "Search legal questions and answers about IPC, CrPC, Constitution",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "Legal question to search"},
                    "source": {"type": "string", "description": "Source: ipc, crpc, or constitution", "enum": ["ipc", "crpc", "constitution"]}
                },
                "required": ["question"],
                "additionalProperties":False
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_case_stats",
            "description": "Get statistics about cases for charts and visualizations",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_er_diagram",
            "description": "Generate ER diagram of the database in Mermaid format",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_schema",
            "description": "Get the full database schema showing all tables and columns",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]
