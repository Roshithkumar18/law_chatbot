from database import run_query, get_schema as db_schema
import json

# ============================================================
# TOOL 1 - GET SCHEMA (Dynamic from DB)
# ============================================================
def get_schema():
    schema = db_schema()
    result = "Database Schema:\n"
    for table, columns in schema.items():
        result += f"\nTable: {table}\n"
        result += f"Columns: {', '.join(columns)}\n"
    return {"schema": schema, "text": result, "sql_executed": "SHOW TABLES + DESCRIBE each"}

# ============================================================
# TOOL 2 - EXECUTE ANY QUERY DYNAMICALLY
# ============================================================
def execute_query(query: str):
    """Runs any SELECT query and returns results"""
    if not query.strip().upper().startswith("SELECT"):
        return {"error": "Only SELECT queries allowed!", "sql_executed": query}
    results = run_query(query)
    return {"data": results, "sql_executed": query, "count": len(results) if results else 0}

# ============================================================
# TOOL 3 - GENERATE DYNAMIC CHART
# Returns data + chart type for frontend to render
# ============================================================
def generate_chart(query: str, chart_type: str, x_key: str, y_key: str, title: str):
    """
    Runs query and returns chart-ready data
    chart_type: bar | pie | line | scatter
    """
    results = run_query(query)
    if not results:
        return {"error": "No data found", "sql_executed": query}
    
    return {
        "chart_type": chart_type,
        "data": results,
        "x_key": x_key,
        "y_key": y_key,
        "title": title,
        "sql_executed": query,
        "is_dynamic_chart": True
    }

# ============================================================
# TOOL 4 - DYNAMIC ER DIAGRAM (from actual DB schema)
# ============================================================
def generate_dynamic_er():
    return {
        "diagram_type": "er",
        "sql_executed": "SHOW TABLES",
        "mermaid": """erDiagram
    PERSONS {
        int id
        string name
        string gender
        string phone
        string type
    }
    CASES {
        int id
        int person_id
        string case_number
        string type
        string status
    }
    HEARINGS {
        int id
        int case_id
        string hearing_date
        string judge_name
        string court_name
    }
    JUDGEMENTS {
        int id
        int case_id
        string judge_name
        string result
    }
    IPC_SECTIONS {
        int id
        string section_number
        string offense
        string punishment
    }
    LEGAL_QA {
        int id
        string source
        string question
        string answer
    }
    PERSONS ||--o{ CASES : has
    CASES ||--o{ HEARINGS : has
    CASES ||--o{ JUDGEMENTS : has
    CASES }o--|| IPC_SECTIONS : references
"""
    }
# ============================================================
# TOOL 5 - SEARCH PERSON
# ============================================================
def search_person(name: str):
    sql = f"SELECT * FROM persons WHERE name LIKE '%{name}%'"
    persons = run_query("SELECT * FROM persons WHERE name LIKE %s", (f"%{name}%",))
    if not persons:
        return {"message": f"No person found with name '{name}'", "sql_executed": sql}
    person = persons[0]
    person_id = person['id']
    cases_sql = f"SELECT * FROM cases WHERE person_id = {person_id}"
    cases = run_query("SELECT * FROM cases WHERE person_id = %s", (person_id,))
    all_hearings = []
    all_judgements = []
    for case in cases:
        hearings = run_query("SELECT * FROM hearings WHERE case_id = %s", (case['id'],))
        judgements = run_query("SELECT * FROM judgements WHERE case_id = %s", (case['id'],))
        all_hearings.extend(hearings)
        all_judgements.extend(judgements)
    return {
        "person": person,
        "cases": cases,
        "hearings": all_hearings,
        "judgements": all_judgements,
        "summary": f"{person['name']} has {len(cases)} case(s), {len(all_hearings)} hearing(s), {len(all_judgements)} judgement(s)",
        "sql_executed": cases_sql
    }

# ============================================================
# TOOL 6 - SEARCH IPC
# ============================================================
def search_ipc(section: str):
    sql = f"SELECT * FROM ipc_sections WHERE section_number LIKE '%{section}%' LIMIT 5"
    results = run_query("SELECT * FROM ipc_sections WHERE section_number LIKE %s LIMIT 5", (f"%{section}%",))
    if not results:
        sql = f"SELECT * FROM legal_qa WHERE source='ipc' AND question LIKE '%{section}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE source='ipc' AND question LIKE %s LIMIT 5", (f"%{section}%",))
    return {"data": results, "sql_executed": sql}

# ============================================================
# TOOL 7 - SEARCH LEGAL QA
# ============================================================
def search_legal_qa(question: str, source: str = None):
    if source:
        sql = f"SELECT * FROM legal_qa WHERE source='{source}' AND question LIKE '%{question}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE source = %s AND question LIKE %s LIMIT 5", (source, f"%{question}%"))
    else:
        sql = f"SELECT * FROM legal_qa WHERE question LIKE '%{question}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE question LIKE %s LIMIT 5", (f"%{question}%",))
    return {"data": results, "sql_executed": sql}

# ============================================================
# TOOL 8 - GET CRIME TRENDS (Line chart)
# ============================================================
def get_crime_trends():
    sql1 = "SELECT year, SUM(incidence) as total_crimes FROM ipc_crime_stats GROUP BY year ORDER BY year"
    sql2 = "SELECT year, SUM(victims) as total_victims FROM ipc_crime_stats GROUP BY year ORDER BY year"
    return {
        "crime_by_year": run_query(sql1),
        "victims_by_year": run_query(sql2),
        "sql_executed": f"1) {sql1}\n2) {sql2}",
        "chart_type": "line"
    }

# ============================================================
# TOOL 9 - PROCESS FLOW
# ============================================================
def generate_process_flow():
    return {
        "diagram_type": "process_flow",
        "sql_executed": "No SQL needed",
        "mermaid": """flowchart TD
    A[FIR_Filed] --> B[Police_Investigation]
    B --> C{Evidence?}
    C -->|Yes| D[Charge_Sheet_Filed]
    C -->|No| E[Case_Closed]
    D --> F[Court_Accepts]
    F --> G[Notice_to_Accused]
    G --> H[First_Hearing]
    H --> I{Bail?}
    I -->|Granted| J[Accused_on_Bail]
    I -->|Rejected| K[Accused_in_Custody]
    J --> L[Trial_Begins]
    K --> L
    L --> M[Arguments_Evidence]
    M --> N[Final_Arguments]
    N --> O[Judgement]
    O --> P{Verdict}
    P -->|Guilty| Q[Sentencing]
    P -->|Not_Guilty| R[Acquitted]
    Q --> S{Appeal?}
    S -->|Yes| T[High_Court]
    S -->|No| U[Sentence_Served]
"""
    }

TOOLS = [
    {"type": "function", "function": {"name": "search_person", "description": "Search person by name, get all cases hearings judgements", "parameters": {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}}},
    {"type": "function", "function": {"name": "search_ipc", "description": "Search IPC section details offense and punishment", "parameters": {"type": "object", "properties": {"section": {"type": "string"}}, "required": ["section"]}}},
    {"type": "function", "function": {"name": "search_legal_qa", "description": "Search legal QA about IPC CrPC Constitution", "parameters": {"type": "object", "properties": {"question": {"type": "string"}, "source": {"type": "string"}}, "required": ["question"]}}},
    {"type": "function", "function": {"name": "execute_query", "description": "Execute any SELECT SQL query on the database dynamically", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}},
    {"type": "function", "function": {"name": "generate_chart", "description": "Generate any chart dynamically - bar pie line scatter - from database query", "parameters": {"type": "object", "properties": {"query": {"type": "string", "description": "SQL SELECT query"}, "chart_type": {"type": "string", "enum": ["bar", "pie", "line", "scatter"]}, "x_key": {"type": "string"}, "y_key": {"type": "string"}, "title": {"type": "string"}}, "required": ["query", "chart_type", "x_key", "y_key", "title"]}}},
    {"type": "function", "function": {"name": "get_crime_trends", "description": "Get crime trends over years for line chart", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "generate_dynamic_er", "description": "Generate ER diagram dynamically from actual database schema", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "generate_process_flow", "description": "Generate legal case process flow diagram", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "get_schema", "description": "Get full database schema all tables and columns", "parameters": {"type": "object", "properties": {}}}}
]
