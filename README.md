# ⚖️ The Akashic Array — Legal Intelligence System

> An AI-powered Legal Case Management Chatbot built for iTech AI Innovation Hackathon 2026

---

## 🚀 What It Does

A ChatGPT-like conversational application where an LLM-powered agent can:
- 🔍 Search legal cases by person name
- 📜 Look up IPC, CrPC, Constitution sections
- 📊 Generate dynamic charts and visualizations
- 🗺️ Draw ER diagrams and process flow diagrams
- 💬 Explain legal data in plain English
- 👁️ Show SQL transparency (see the query executed)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Recharts + Mermaid.js |
| Backend | Python FastAPI |
| Database | MySQL |
| AI Brain | Groq + Llama 3.3 70B |
| Styling | Custom CSS |

---

## 📁 Project Structure

```
legal-chatbot/
├── backend/
│   ├── main.py         # FastAPI server + tool routing
│   ├── tools.py        # 8 agent tools
│   ├── database.py     # MySQL connection
│   └── .env            # API keys (not committed)
├── frontend/
│   └── src/
│       ├── App.js      # Chat UI + charts
│       └── api.js      # Backend connector
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/legal-chatbot.git
cd legal-chatbot
```

### 2. Setup Backend
```bash
cd backend
pip install fastapi uvicorn groq mysql-connector-python python-dotenv
```

### 3. Create .env file
```
GROQ_API_KEY=your_groq_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=legal_chatbot_db
```

### 4. Setup MySQL Database
```bash
python import_data.py
```

### 5. Start Backend
```bash
python main.py
```

### 6. Setup Frontend
```bash
cd ../frontend
npm install
npm start
```

### 7. Open Browser
```
http://localhost:3000
```

---

## 🔧 Agent Tools

| Tool | Purpose | Output |
|---|---|---|
| `search_person` | Find person + all their cases | Person profile + cases |
| `search_ipc` | IPC section details | Offense + punishment |
| `search_legal_qa` | Legal Q&A search | Answer from 14K+ Q&A |
| `get_case_stats` | Case statistics | Bar + Pie charts |
| `get_crime_trends` | Crime over years | Line chart |
| `generate_er_diagram` | Database structure | Mermaid ER diagram |
| `generate_process_flow` | Case flow diagram | Mermaid flowchart |
| `get_schema` | DB schema | All tables + columns |

---

## 📊 Visualizations

- ✅ Bar Chart — Cases by status
- ✅ Pie Chart — Cases by type
- ✅ Line Chart — Crime trends over years
- ✅ ER Diagram — Database relationships
- ✅ Process Flow — Legal case workflow

---

## 🗄️ Database

| Table | Rows | Description |
|---|---|---|
| ipc_sections | ~500 | IPC law sections |
| ipc_crime_stats | ~1000 | State-wise crime data |
| crpc_sections | 535 | CrPC sections |
| cpc_sections | 171 | CPC sections |
| constitution_articles | 454 | Constitution articles |
| evidence_act | 34 | Evidence Act |
| legal_qa | 14,543 | Legal Q&A pairs |
| persons | 20 | Mock persons |
| cases | 30 | Mock court cases |
| hearings | 71 | Mock hearings |
| judgements | 10 | Mock judgements |

---

## 💡 Sample Queries

```
"Show cases for Rahul Sharma"
"What is IPC Section 302?"
"Show crime trends over years"
"Draw the ER diagram"
"Show legal case process flow"
"What does Article 21 say?"
"Show case statistics"
"What is CrPC Section 144?"
```

---

## 👥 Team

**The Akashic Array**
- Built for iTech AI Innovation Hackathon 2026
