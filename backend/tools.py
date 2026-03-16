from database import run_query, get_schema as db_schema

def get_schema():
    schema = db_schema()
    result = "Database Schema:\n"
    for table, columns in schema.items():
        result += f"\nTable: {table}\n"
        result += f"Columns: {', '.join(columns)}\n"
    return result

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

def search_ipc(section: str):
    sql = f"SELECT * FROM ipc_sections WHERE section_number LIKE '%{section}%' LIMIT 5"
    results = run_query("SELECT * FROM ipc_sections WHERE section_number LIKE %s LIMIT 5", (f"%{section}%",))
    if not results:
        sql = f"SELECT * FROM legal_qa WHERE source='ipc' AND question LIKE '%{section}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE source='ipc' AND question LIKE %s LIMIT 5", (f"%{section}%",))
    return {"data": results, "sql_executed": sql}

def search_legal_qa(question: str, source: str = None):
    if source:
        sql = f"SELECT * FROM legal_qa WHERE source='{source}' AND question LIKE '%{question}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE source = %s AND question LIKE %s LIMIT 5", (source, f"%{question}%"))
    else:
        sql = f"SELECT * FROM legal_qa WHERE question LIKE '%{question}%' LIMIT 5"
        results = run_query("SELECT * FROM legal_qa WHERE question LIKE %s LIMIT 5", (f"%{question}%",))
    return {"data": results, "sql_executed": sql}

def get_case_stats():
    sql1 = "SELECT status, COUNT(*) as count FROM cases GROUP BY status"
    sql2 = "SELECT type, COUNT(*) as count FROM cases GROUP BY type"
    sql3 = "SELECT state, SUM(incidence) as total FROM ipc_crime_stats GROUP BY state ORDER BY total DESC LIMIT 10"
    return {
        "by_status": run_query(sql1),
        "by_type": run_query(sql2),
        "by_state": run_query(sql3),
        "sql_executed": f"1) {sql1}\n2) {sql2}\n3) {sql3}"
    }

def get_crime_trends():
    sql1 = "SELECT year, SUM(incidence) as total_crimes FROM ipc_crime_stats GROUP BY year ORDER BY year"
    sql2 = "SELECT year, SUM(victims) as total_victims FROM ipc_crime_stats GROUP BY year ORDER BY year"
    return {
        "crime_by_year": run_query(sql1),
        "victims_by_year": run_query(sql2),
        "sql_executed": f"1) {sql1}\n2) {sql2}",
        "chart_type": "line"
    }

def generate_er_diagram():
    return {
        "diagram_type": "er",
        "sql_executed": "SHOW TABLES",
        "mermaid": """erDiagram
    PERSONS {
        int id PK
        string name
        int age
        string gender
        string phone
        string type
    }
    CASES {
        int id PK
        int person_id FK
        string case_number
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
    }

def generate_process_flow():
    return {
        "diagram_type": "process_flow",
        "sql_executed": "No SQL needed - static diagram",
        "mermaid": """flowchart TD
    A[FIR Filed] --> B[Police Investigation]
    B --> C{Enough Evidence?}
    C -->|Yes| D[Charge Sheet Filed]
    C -->|No| E[Case Closed]
    D --> F[Court Accepts Case]
    F --> G[Notice to Accused]
    G --> H[First Hearing]
    H --> I{Bail Application}
    I -->|Granted| J[Accused on Bail]
    I -->|Rejected| K[Accused in Custody]
    J --> L[Trial Begins]
    K --> L
    L --> M[Arguments and Evidence]
    M --> N[Final Arguments]
    N --> O[Judgement]
    O --> P{Verdict}
    P -->|Guilty| Q[Sentencing]
    P -->|Not Guilty| R[Acquitted]
    Q --> S{Appeal?}
    S -->|Yes| T[High Court Appeal]
    S -->|No| U[Sentence Served]
"""
    }

TOOLS = [
    {"type": "function", "function": {"name": "search_person", "description": "Search person by name, get cases hearings judgements", "parameters": {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}}},
    {"type": "function", "function": {"name": "search_ipc", "description": "Search IPC section details", "parameters": {"type": "object", "properties": {"section": {"type": "string"}}, "required": ["section"]}}},
    {"type": "function", "function": {"name": "search_legal_qa", "description": "Search legal QA about IPC CrPC Constitution", "parameters": {"type": "object", "properties": {"question": {"type": "string"}, "source": {"type": "string"}}, "required": ["question"]}}},
    {"type": "function", "function": {"name": "get_case_stats", "description": "Get case statistics for bar and pie charts", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "get_crime_trends", "description": "Get crime trends over years for line chart", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "generate_er_diagram", "description": "Generate ER diagram of database in Mermaid", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "generate_process_flow", "description": "Generate legal case process flow diagram", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "get_schema", "description": "Get full database schema", "parameters": {"type": "object", "properties": {}}}}
]
