import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from "recharts";
import { sendMessage } from "./api";

const COLORS = ["#c084fc", "#34d399", "#fbbf24", "#f87171", "#818cf8", "#fb7185", "#38bdf8", "#a3e635"];

// ============================================================
// DYNAMIC CHART - Renders ANY chart type with ANY data
// ============================================================
function DynamicChart({ chartData }) {
  if (!chartData || !chartData.data || chartData.data.length === 0) return null;
  const { chart_type, data, x_key, y_key, title } = chartData;

  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>📊 {title}</p>
      <ResponsiveContainer width="100%" height={250}>
        {chart_type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
            <XAxis dataKey={x_key} stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Bar dataKey={y_key} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : chart_type === "pie" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey={y_key}
              nameKey={x_key}
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#6b7280" }}
            >
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
          </PieChart>
        ) : chart_type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
            <XAxis dataKey={x_key} stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
            <Line type="monotone" dataKey={y_key} stroke="#c084fc" strokeWidth={2} dot={{ fill: "#c084fc", r: 4 }} />
          </LineChart>
        ) : chart_type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
            <XAxis dataKey={x_key} stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
            <Area type="monotone" dataKey={y_key} stroke="#c084fc" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2} />
          </AreaChart>
        ) : chart_type === "scatter" ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
            <XAxis dataKey={x_key} stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} name={x_key} />
            <YAxis dataKey={y_key} stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} name={y_key} />
            <ZAxis range={[60, 60]} />
            <Tooltip contentStyle={styles.tooltip} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill="#c084fc" />
          </ScatterChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// LINE CHART for crime trends
// ============================================================
function LineChartRenderer({ lineData }) {
  if (!lineData?.crime_by_year?.length) return null;
  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>📈 Crime Trends Over Years</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={lineData.crime_by_year}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
          <XAxis dataKey="year" stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 11, fill: "#9ca3af" }} />
          <Tooltip contentStyle={styles.tooltip} />
          <Legend />
          <Line type="monotone" dataKey="total_crimes" stroke="#c084fc" strokeWidth={2} dot={{ fill: "#c084fc", r: 4 }} name="Total Crimes" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// MERMAID RENDERER
// ============================================================
function MermaidRenderer({ code, type }) {
  const ref = useRef(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (code && ref.current) {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#7c3aed',
            primaryTextColor: '#e5e7eb',
            primaryBorderColor: '#c084fc',
            lineColor: '#6b7280',
            secondaryColor: '#1a1a2e',
            tertiaryColor: '#0a0a14',
            background: '#0a0a14',
            mainBkg: '#1a1a2e',
            nodeBorder: '#c084fc',
            clusterBkg: '#1a1a2e',
            titleColor: '#c084fc',
            edgeLabelBackground: '#1a1a2e',
            attributeBackgroundColorEven: '#0f0f1a',
            attributeBackgroundColorOdd: '#1a1a2e',
          }
        });
        const id = `mermaid-${Date.now()}`;
        ref.current.innerHTML = `<div class="mermaid" id="${id}">${code}</div>`;
        mermaid.default.run({
          nodes: [ref.current.querySelector('.mermaid')]
        }).then(() => setRendered(true)).catch(() => setRendered(false));
      });
    }
  }, [code]);

  if (!code) return null;
  const title = type === "process_flow" ? "⚖️ Legal Case Process Flow" : "🗺️ Database ER Diagram";

  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>{title}</p>
      <div ref={ref} style={{ background: '#0a0a14', borderRadius: 8, padding: 16, overflow: 'auto', minHeight: 100 }} />
      {!rendered && (
        <pre style={{ color: "#34d399", fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6, overflow: "auto", maxHeight: 280, margin: "8px 0 0 0" }}>
          {code}
        </pre>
      )}
      <p style={{ color: "#4b5563", fontSize: 11, marginTop: 8 }}>
        💡 Also render at <a href="https://mermaid.live" target="_blank" rel="noreferrer" style={{ color: "#c084fc" }}>mermaid.live</a>
      </p>
    </div>
  );
}

// ============================================================
// SQL BOX
// ============================================================
function SQLBox({ sql }) {
  const [show, setShow] = useState(false);
  if (!sql) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setShow(!show)} style={styles.sqlBtn}>
        {show ? "🙈 Hide SQL" : "👁️ View SQL Query"}
      </button>
      {show && <pre style={styles.sqlBox}>{sql}</pre>}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem("chat_sessions");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const WELCOME_MSG = {
    role: "assistant",
    content: "⚖️ Welcome to The Akashic Array!\n\nYour AI-powered Legal Intelligence System.\n\nTry asking:\n• 'Show pie chart for case types'\n• 'Bar chart for cases by status'\n• 'Show cases for Rahul Sharma'\n• 'What is IPC Section 302?'\n• 'Draw ER diagram'\n• 'Show crime trends'",
    chart_data: null, line_data: null, dynamic_chart: null,
    mermaid: null, mermaid_type: null, sql_executed: null
  };

  useEffect(() => {
    try { localStorage.setItem("chat_sessions", JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function newChat() {
    const id = `session_${Date.now()}`;
    const session = { id, title: "New Chat", timestamp: new Date().toLocaleString(), messages: [WELCOME_MSG] };
    setSessions(prev => [session, ...prev]);
    setActiveSession(id);
    setMessages([WELCOME_MSG]);
    inputRef.current?.focus();
  }

  function loadSession(id) {
    const session = sessions.find(s => s.id === id);
    if (session) { setActiveSession(id); setMessages(session.messages); }
  }

  function deleteSession(e, id) {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession === id) { setActiveSession(null); setMessages([]); }
  }

  function updateSession(id, newMessages, firstUserMsg) {
    setSessions(prev => prev.map(s => s.id === id ? {
      ...s, messages: newMessages,
      title: firstUserMsg?.substring(0, 35) || s.title,
      timestamp: new Date().toLocaleString()
    } : s));
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    let currentSession = activeSession;
    if (!currentSession) {
      const id = `session_${Date.now()}`;
      const session = { id, title: input.substring(0, 35), timestamp: new Date().toLocaleString(), messages: [WELCOME_MSG] };
      setSessions(prev => [session, ...prev]);
      setActiveSession(id);
      currentSession = id;
    }
    const userMsg = { role: "user", content: input, chart_data: null, line_data: null, dynamic_chart: null, mermaid: null, mermaid_type: null, sql_executed: null };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(input, currentSession);
      const assistantMsg = {
        role: "assistant",
        content: data.response,
        chart_data: data.chart_data,
        line_data: data.line_data,
        dynamic_chart: data.dynamic_chart,
        mermaid: data.mermaid,
        mermaid_type: data.mermaid_type,
        sql_executed: data.sql_executed
      };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      updateSession(currentSession, finalMessages, input);
    } catch {
      const errMsg = { role: "assistant", content: "❌ Connection error! Make sure backend is running.", chart_data: null, line_data: null, dynamic_chart: null, mermaid: null, mermaid_type: null, sql_executed: null };
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
      updateSession(currentSession, finalMessages, input);
    }
    setLoading(false);
  }

  const suggestions = [
    "Pie chart for case types",
    "Bar chart cases by status",
    "Show cases for Rahul Sharma",
    "What is IPC Section 302?",
    "Draw ER diagram",
    "Show crime trends"
  ];

  return (
    <div style={styles.root}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? 280 : 0, overflow: "hidden" }}>
        <div style={styles.sidebarInner}>
          <div style={styles.logo}>
            <span style={{ fontSize: 28 }}>⚖️</span>
            <div>
              <div style={styles.logoTitle}>AKASHIC ARRAY</div>
              <div style={styles.logoSub}>Legal Intelligence</div>
            </div>
          </div>
          <button onClick={newChat} style={styles.newChatBtn}>
            <span style={{ fontSize: 16 }}>✏️</span> New Conversation
          </button>
          <div style={styles.historyLabel}>RECENT CHATS</div>
          <div style={styles.historyList}>
            {sessions.length === 0 && <div style={styles.emptyHistory}>No chats yet. Start a new conversation!</div>}
            {sessions.map(session => (
              <div key={session.id} onClick={() => loadSession(session.id)} style={{ ...styles.historyItem, background: activeSession === session.id ? "rgba(192,132,252,0.15)" : "transparent", borderColor: activeSession === session.id ? "rgba(192,132,252,0.4)" : "transparent" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={styles.historyTitle}>{session.title}</div>
                  <div style={styles.historyTime}>{session.timestamp}</div>
                </div>
                <button onClick={(e) => deleteSession(e, session.id)} style={styles.deleteBtn}>🗑️</button>
              </div>
            ))}
          </div>
          <div style={styles.sidebarBottom}>
            <div style={{ color: "#4b5563", fontSize: 11 }}>Powered by Groq + Llama3</div>
            <div style={{ color: "#374151", fontSize: 10, marginTop: 2 }}>iTech Hackathon 2026</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>{sidebarOpen ? "✕" : "☰"}</button>
          <div style={styles.topTitle}>{activeSession ? sessions.find(s => s.id === activeSession)?.title || "Chat" : "The Akashic Array"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? "#fbbf24" : "#34d399", boxShadow: `0 0 8px ${loading ? "#fbbf24" : "#34d399"}` }} />
            <span style={{ fontSize: 11, color: "#6b7280" }}>{loading ? "Processing..." : "Online"}</span>
          </div>
        </div>

        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚖️</div>
            <div style={styles.emptyTitle}>THE AKASHIC ARRAY</div>
            <div style={styles.emptySubtitle}>AI-powered Legal Intelligence System</div>
            <div style={styles.suggestionsGrid}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={styles.suggestionCard}>
                  <span style={{ fontSize: 18 }}>{["🍩", "📊", "👤", "⚖️", "🗺️", "📈"][i]}</span>
                  <span style={{ fontSize: 13, color: "#d1d5db" }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.messageArea}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
                <div style={{ maxWidth: "78%" }}>
                  {msg.role === "assistant" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚖️</div>
                      <span style={{ fontSize: 11, color: "#6b7280", fontFamily: "JetBrains Mono" }}>Legal Assistant</span>
                    </div>
                  )}
                  <div style={{ ...styles.bubble, background: msg.role === "user" ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "#1a1a2e", border: msg.role === "user" ? "none" : "1px solid #2a2a3d", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px" }}>
                    {msg.content}
                  </div>
                  {msg.sql_executed && <SQLBox sql={msg.sql_executed} />}
                  {msg.dynamic_chart && <DynamicChart chartData={msg.dynamic_chart} />}
                  {msg.line_data && <LineChartRenderer lineData={msg.line_data} />}
                  {msg.mermaid && <MermaidRenderer code={msg.mermaid} type={msg.mermaid_type} />}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>⚖️</div>
                <div style={{ ...styles.bubble, background: "#1a1a2e", border: "1px solid #2a2a3d", borderRadius: "4px 18px 18px 18px", display: "flex", gap: 5, padding: "14px 18px" }}>
                  {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#c084fc", animation: "pulse 1.2s infinite", animationDelay: `${j * 0.3}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {messages.length > 0 && (
          <div style={styles.suggestStrip}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={styles.stripBtn}>{s}</button>
            ))}
          </div>
        )}

        <div style={styles.inputArea}>
          <div style={styles.inputBox}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask anything... try 'pie chart for case types' or 'show cases for Rahul Sharma'"
              style={styles.input} />
            <button onClick={handleSend} disabled={loading} style={{ ...styles.sendBtn, background: loading ? "#2a2a3d" : "linear-gradient(135deg,#7c3aed,#a855f7)", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={styles.inputHint}>Press Enter to send • The Akashic Array © 2026</div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#2a2a3d;border-radius:4px}
        *{box-sizing:border-box}
      `}</style>
    </div>
  );
}

const styles = {
  root: { display: "flex", height: "100vh", background: "#0a0a14", fontFamily: "'Syne',sans-serif", color: "#e5e7eb", overflow: "hidden" },
  sidebar: { background: "#0f0f1a", borderRight: "1px solid #1a1a2e", transition: "width 0.3s ease", flexShrink: 0 },
  sidebarInner: { width: 280, height: "100%", display: "flex", flexDirection: "column", padding: "20px 0" },
  logo: { display: "flex", alignItems: "center", gap: 12, padding: "0 20px 20px", borderBottom: "1px solid #1a1a2e" },
  logoTitle: { fontWeight: 800, fontSize: 13, letterSpacing: 3, color: "#c084fc" },
  logoSub: { fontSize: 10, color: "#4b5563", letterSpacing: 1, marginTop: 2 },
  newChatBtn: { margin: "16px 16px 8px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", borderRadius: 12, padding: "12px 16px", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Syne',sans-serif" },
  historyLabel: { padding: "16px 20px 8px", fontSize: 10, color: "#374151", letterSpacing: 2, fontWeight: 600 },
  historyList: { flex: 1, overflowY: "auto", padding: "0 12px" },
  historyItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s", marginBottom: 4 },
  historyTitle: { fontSize: 13, color: "#d1d5db", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 },
  historyTime: { fontSize: 10, color: "#4b5563", marginTop: 2 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.5, padding: 2 },
  emptyHistory: { fontSize: 12, color: "#374151", textAlign: "center", padding: "20px 10px", lineHeight: 1.6 },
  sidebarBottom: { padding: "16px 20px", borderTop: "1px solid #1a1a2e" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topBar: { padding: "14px 24px", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", gap: 16, background: "#0a0a14" },
  menuBtn: { background: "none", border: "1px solid #1a1a2e", borderRadius: 8, color: "#9ca3af", width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, fontWeight: 700, fontSize: 14, letterSpacing: 1, color: "#e5e7eb", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" },
  emptyTitle: { fontSize: 28, fontWeight: 800, letterSpacing: 3, color: "#c084fc", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 40 },
  suggestionsGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, maxWidth: 600, width: "100%" },
  suggestionCard: { background: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left", fontFamily: "'Syne',sans-serif" },
  messageArea: { flex: 1, overflowY: "auto", padding: "24px" },
  bubble: { padding: "13px 17px", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#e5e7eb" },
  suggestStrip: { padding: "8px 24px", display: "flex", gap: 8, overflowX: "auto", borderTop: "1px solid #1a1a2e" },
  stripBtn: { background: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#9ca3af", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Syne',sans-serif" },
  inputArea: { padding: "12px 24px 20px", borderTop: "1px solid #1a1a2e" },
  inputBox: { display: "flex", gap: 10, background: "#0f0f1a", border: "1px solid #2a2a3d", borderRadius: 16, padding: "6px 6px 6px 18px", alignItems: "center" },
  input: { flex: 1, background: "none", border: "none", color: "#e5e7eb", fontSize: 14, outline: "none", fontFamily: "'Syne',sans-serif", padding: "6px 0" },
  sendBtn: { border: "none", borderRadius: 12, padding: "10px 18px", color: "white", fontSize: 16, transition: "all 0.2s" },
  inputHint: { textAlign: "center", fontSize: 11, color: "#374151", marginTop: 8 },
  chartBox: { background: "#0f0f1a", borderRadius: 12, padding: 16, marginTop: 10, border: "1px solid #1a1a2e" },
  chartTitle: { color: "#9ca3af", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", margin: "0 0 12px 0" },
  tooltip: { background: "#0f0f1a", border: "1px solid #c084fc", borderRadius: 8, color: "#e5e7eb", fontSize: 12 },
  sqlBtn: { background: "#0f0f1a", border: "1px solid #1a1a2e", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#6b7280", cursor: "pointer", fontFamily: "'JetBrains Mono',monospace" },
  sqlBox: { background: "#0a0a14", border: "1px solid #1a1a2e", borderRadius: 8, padding: 12, marginTop: 6, color: "#fbbf24", fontSize: 11, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "pre-wrap", margin: "6px 0 0 0" }
};
