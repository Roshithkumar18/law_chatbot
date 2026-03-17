import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from "recharts";
import { sendMessage } from "./api";

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#65a30d"];

// ============================================================
// DYNAMIC CHART
// ============================================================
function DynamicChart({ chartData }) {
  if (!chartData || !chartData.data || chartData.data.length === 0) return null;
  const { chart_type, data, x_key, y_key, title } = chartData;
  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>{title}</p>
      <ResponsiveContainer width="100%" height={250}>
        {chart_type === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={x_key} stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Bar dataKey={y_key} radius={[4, 4, 0, 0]}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        ) : chart_type === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey={y_key} nameKey={x_key} cx="50%" cy="50%" outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
          </PieChart>
        ) : chart_type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={x_key} stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
            <Line type="monotone" dataKey={y_key} stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} />
          </LineChart>
        ) : chart_type === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={x_key} stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
            <Tooltip contentStyle={styles.tooltip} />
            <Legend />
            <Area type="monotone" dataKey={y_key} stroke="#2563eb" fill="#dbeafe" fillOpacity={0.6} strokeWidth={2} />
          </AreaChart>
        ) : chart_type === "scatter" ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={x_key} stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} name={x_key} />
            <YAxis dataKey={y_key} stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} name={y_key} />
            <ZAxis range={[60, 60]} />
            <Tooltip contentStyle={styles.tooltip} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={data} fill="#2563eb" />
          </ScatterChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  );
}

function LineChartRenderer({ lineData }) {
  if (!lineData?.crime_by_year?.length) return null;
  const title = lineData.title || "Crime Trends Over Years";
  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={lineData.crime_by_year}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip contentStyle={styles.tooltip} />
          <Legend />
          <Line type="monotone" dataKey={lineData.y_key || "total_crimes"} stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} name={lineData.y_label || "Total Crimes"} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MermaidRenderer({ code, type }) {
  const ref = useRef(null);
  const [rendered, setRendered] = useState(false);
  useEffect(() => {
    if (code && ref.current) {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: 'default',
          themeVariables: {
            primaryColor: '#dbeafe',
            primaryTextColor: '#1e40af',
            primaryBorderColor: '#2563eb',
            lineColor: '#9ca3af',
            secondaryColor: '#f0f9ff',
            background: '#ffffff',
            mainBkg: '#f8fafc',
            nodeBorder: '#2563eb',
            titleColor: '#1e40af',
          }
        });
        const id = `mermaid-${Date.now()}`;
        ref.current.innerHTML = `<div class="mermaid" id="${id}">${code}</div>`;
        mermaid.default.run({ nodes: [ref.current.querySelector('.mermaid')] })
          .then(() => setRendered(true)).catch(() => setRendered(false));
      });
    }
  }, [code]);
  if (!code) return null;
  const title = type === "process_flow" ? "Legal Case Process Flow" : "Database ER Diagram";
  return (
    <div style={styles.chartBox}>
      <p style={styles.chartTitle}>{title}</p>
      <div ref={ref} style={{ background: '#f8fafc', borderRadius: 8, padding: 16, overflow: 'auto', minHeight: 100 }} />
      {!rendered && (
        <pre style={{ color: "#374151", fontSize: 11, fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 280, margin: "8px 0 0 0", overflow: "auto" }}>{code}</pre>
      )}
      <p style={{ color: "#9ca3af", fontSize: 11, marginTop: 8 }}>
        Render at <a href="https://mermaid.live" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>mermaid.live</a>
      </p>
    </div>
  );
}

function SQLBox({ sql, userMessage }) {
  const [show, setShow] = useState(false);
  if (!sql) return null;

  // Highlight SQL keywords
  function highlightSQL(query) {
    const keywords = ["SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY",
      "COUNT", "SUM", "JOIN", "ON", "AND", "OR", "LIKE",
      "LIMIT", "AS", "BY", "DESC", "ASC", "INSERT", "UPDATE"];
    const parts = query.split(/(\s+|,|\(|\))/);
    return parts.map((part, i) => {
      if (keywords.includes(part.trim().toUpperCase())) {
        return <span key={i} style={{ color: "#2563eb", fontWeight: 700 }}>{part}</span>;
      }
      if (part.startsWith("'") || part.startsWith('"')) {
        return <span key={i} style={{ color: "#16a34a" }}>{part}</span>;
      }
      if (/^\d+$/.test(part.trim())) {
        return <span key={i} style={{ color: "#dc2626" }}>{part}</span>;
      }
      return <span key={i} style={{ color: "#374151" }}>{part}</span>;
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setShow(!show)} style={styles.sqlBtn}>
        {show ? "🔼 Hide SQL" : "🔍 View SQL Query"}
      </button>

      {show && (
        <div style={{ marginTop: 8, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>

          {/* Text to SQL Flow Header */}
          <div style={{ background: "#f8fafc", padding: "10px 14px", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>
              TEXT TO SQL CONVERSION
            </div>

            {/* Flow visualization */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>

              {/* Step 1 - User query */}
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>User query</div>
                <div style={{ color: "#1e40af", fontWeight: 600 }}>
                  {userMessage || "Natural language input"}
                </div>
              </div>

              {/* Arrow */}
              <div style={{ color: "#9ca3af", fontSize: 16, fontWeight: 300 }}>→</div>

              {/* Step 2 - detect_tool */}
              <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>Intent detection</div>
                <div style={{ color: "#7c3aed", fontWeight: 600 }}>detect_tool()</div>
              </div>

              {/* Arrow */}
              <div style={{ color: "#9ca3af", fontSize: 16, fontWeight: 300 }}>→</div>

              {/* Step 3 - SQL generated */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>SQL generated</div>
                <div style={{ color: "#15803d", fontWeight: 600 }}>MySQL query</div>
              </div>

              {/* Arrow */}
              <div style={{ color: "#9ca3af", fontSize: 16, fontWeight: 300 }}>→</div>

              {/* Step 4 - Result */}
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                <div style={{ color: "#6b7280", fontSize: 10, marginBottom: 2 }}>AI explains</div>
                <div style={{ color: "#c2410c", fontWeight: 600 }}>Response</div>
              </div>
            </div>
          </div>

          {/* SQL Query with syntax highlighting */}
          <div style={{ background: "#f9fafb", padding: "12px 16px" }}>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>
              EXECUTED SQL
            </div>
            <pre style={{
              margin: 0, fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              lineHeight: 1.8, whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}>
              {sql.split('\n').map((line, i) => (
                <div key={i}>{highlightSQL(line)}</div>
              ))}
            </pre>
          </div>

          {/* Copy SQL button */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid #e5e7eb", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => { navigator.clipboard.writeText(sql); }}
              style={{ ...styles.actionBtn, fontSize: 11 }}>
              📋 Copy SQL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// RESULTS TABLE COMPONENT
// ============================================================
function ResultsTable({ data }) {
  const [show, setShow] = useState(true);
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);

  // Format cell value
  function formatCell(val) {
    if (val === null || val === undefined) return "-";
    const str = String(val);
    if (str.length > 40) return str.substring(0, 40) + "...";
    return str;
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 0.5 }}>
          QUERY RESULTS — {data.length} row{data.length !== 1 ? "s" : ""}
        </div>
        <button onClick={() => setShow(!show)} style={{ ...styles.sqlBtn, padding: "2px 8px", fontSize: 11 }}>
          {show ? "Hide table" : "Show table"}
        </button>
      </div>

      {show && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
              <thead>
                <tr style={{ background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}>
                  {columns.map((col, i) => (
                    <th key={i} style={{
                      padding: "8px 12px", textAlign: "left",
                      color: "#374151", fontWeight: 600,
                      fontSize: 11, whiteSpace: "nowrap",
                      letterSpacing: 0.3,
                      borderRight: i < columns.length - 1 ? "1px solid #e5e7eb" : "none"
                    }}>
                      {col.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#ffffff" : "#fafafa" }}>
                    {columns.map((col, j) => (
                      <td key={j} style={{
                        padding: "7px 12px",
                        color: "#374151",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        borderRight: j < columns.length - 1 ? "1px solid #f3f4f6" : "none",
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ background: "#f9fafb", padding: "6px 12px", borderTop: "1px solid #e5e7eb", fontSize: 11, color: "#9ca3af" }}>
            {data.length} record{data.length !== 1 ? "s" : ""} retrieved · {columns.length} column{columns.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(content) {
  return content.split('\n').map((line, i) => {
    if (line === '') return <div key={i} style={{ height: 6 }} />;

    // Skip dividers
    if (/^[-=*]{3,}$/.test(line.trim())) return null;

    // Process inline bold for any line
    const processBold = (text) => {
      const parts = text.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, j) =>
        j % 2 === 1
          ? <strong key={j} style={{ color: "#111827", fontWeight: 700 }}>{part}</strong>
          : <span key={j}>{part}</span>
      );
    };

    // ### Heading → bold heading
    if (line.startsWith('### ')) {
      return (
        <div key={i} style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginTop: 12, marginBottom: 4, borderBottom: "1px solid #f3f4f6", paddingBottom: 4 }}>
          {processBold(line.replace('### ', ''))}
        </div>
      );
    }
    // ## Heading
    if (line.startsWith('## ')) {
      return (
        <div key={i} style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginTop: 12, marginBottom: 4 }}>
          {processBold(line.replace('## ', ''))}
        </div>
      );
    }
    // # Heading
    if (line.startsWith('# ')) {
      return (
        <div key={i} style={{ fontWeight: 800, fontSize: 16, color: "#111827", marginTop: 12, marginBottom: 6 }}>
          {processBold(line.replace('# ', ''))}
        </div>
      );
    }

    // Bullet * or -
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const text = line.trim().replace(/^[\*\-] /, '');
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 8, alignItems: "flex-start" }}>
          <span style={{ color: "#2563eb", fontWeight: 700, flexShrink: 0, marginTop: 2, fontSize: 12 }}>•</span>
          <span style={{ flex: 1, lineHeight: 1.7 }}>{processBold(text)}</span>
        </div>
      );
    }

    // Numbered list
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4, alignItems: "flex-start" }}>
          <span style={{ color: "#2563eb", fontWeight: 600, flexShrink: 0, minWidth: 22, marginTop: 1 }}>{numberedMatch[1]}.</span>
          <span style={{ flex: 1, lineHeight: 1.7 }}>{processBold(numberedMatch[2])}</span>
        </div>
      );
    }

    // Normal line
    return (
      <div key={i} style={{ marginBottom: 3, lineHeight: 1.75, wordBreak: "break-word" }}>
        {processBold(line)}
      </div>
    );
  });
}

// ============================================================
// COPY + DOWNLOAD BUTTONS
// ============================================================
function MessageActions({ content }) {
  const [copied, setCopied] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JurisAI_Response.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadDoc() {
    // Create HTML that Word can open
    const html = `
      <html>
        <head><meta charset="utf-8"><title>JurisAI Response</title></head>
        <body style="font-family: Arial; font-size: 12pt; margin: 40px;">
          <h2 style="color:#1e40af;">JurisAI Legal Report</h2>
          <hr/>
          <pre style="white-space: pre-wrap; font-family: Arial; font-size: 11pt;">${content}</pre>
          <hr/>
          <p style="color:#9ca3af; font-size: 9pt;">Generated by JurisAI © 2026</p>
        </body>
      </html>`;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JurisAI_Report.doc";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    // Open print dialog for PDF save
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>JurisAI Report</title>
          <style>
            body { font-family: Arial; font-size: 12pt; margin: 40px; color: #111827; }
            h2 { color: #1e40af; } hr { border: 1px solid #e5e7eb; }
            pre { white-space: pre-wrap; font-family: Arial; }
            .footer { color: #9ca3af; font-size: 9pt; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h2>JurisAI Legal Report</h2>
          <hr/>
          <pre>${content}</pre>
          <hr/>
          <div class="footer">Generated by JurisAI © 2026</div>
        </body>
      </html>`);
    win.document.close();
    win.print();
  }

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      <button onClick={copyText} style={styles.actionBtn}>
        {copied ? "✅ Copied" : "📋 Copy"}
      </button>
      <button onClick={downloadTxt} style={styles.actionBtn}>
        📄 TXT
      </button>
      <button onClick={downloadDoc} style={styles.actionBtn}>
        📝 DOC
      </button>
      <button onClick={downloadPdf} style={styles.actionBtn}>
        📑 PDF
      </button>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [sessions, setSessions] = useState(() => {
    try { const s = localStorage.getItem("jurisai_sessions"); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const WELCOME_MSG = {
    role: "assistant",
    content: "Hello! I'm **JurisAI**, your AI-powered Legal Intelligence System.\n\nI can help you with:\n• Search cases by person name\n• Look up IPC, CrPC, Constitution sections\n• Generate charts and visualizations\n• Draw database ER diagrams\n• Show legal process flows\n\nHow can I assist you today?",
    chart_data: null, line_data: null, dynamic_chart: null, mermaid: null, mermaid_type: null, sql_executed: null
  };

  useEffect(() => {
    try { localStorage.setItem("jurisai_sessions", JSON.stringify(sessions)); } catch {}
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

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Use Chrome for voice input!"); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      setInput(e.results[0][0].transcript);
      inputRef.current?.focus();
    };
    recognition.start();
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
        role: "assistant", content: data.response,
        chart_data: data.chart_data, line_data: data.line_data,
        dynamic_chart: data.dynamic_chart, mermaid: data.mermaid,
        mermaid_type: data.mermaid_type, sql_executed: data.sql_executed
      };
      const finalMessages = [...newMessages, assistantMsg];
      setMessages(finalMessages);
      updateSession(currentSession, finalMessages, input);
    } catch {
      const errMsg = { role: "assistant", content: "❌ Connection error! Make sure backend is running at http://localhost:8000", chart_data: null, line_data: null, dynamic_chart: null, mermaid: null, mermaid_type: null, sql_executed: null };
      const finalMessages = [...newMessages, errMsg];
      setMessages(finalMessages);
      updateSession(currentSession, finalMessages, input);
    }
    setLoading(false);
  }

  const suggestions = [
    "Show cases for Rahul Sharma",
    "What is IPC Section 302?",
    "Pie chart for case types",
    "Draw ER diagram",
    "Show crime trends",
    "What are my fundamental rights?"
  ];

  return (
    <div style={styles.root}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? 260 : 0, overflow: "hidden" }}>
        <div style={styles.sidebarInner}>

          {/* Logo */}
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L12 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 21H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 8L12 3L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 8H9L6 14C6 14 3.5 14 3 12C2.5 10 3 8 3 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
                <path d="M21 8H15L18 14C18 14 20.5 14 21 12C21.5 10 21 8 21 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
              </svg>
            </div>
            <div>
              <div style={styles.logoTitle}>JurisAI</div>
              <div style={styles.logoSub}>Legal Intelligence System</div>
            </div>
          </div>

          {/* New Chat */}
          <button onClick={newChat} style={styles.newChatBtn}>
            ✏️ New Chat
          </button>

          {/* History */}
          <div style={styles.historyLabel}>Recent Conversations</div>
          <div style={styles.historyList}>
            {sessions.length === 0 && (
              <div style={styles.emptyHistory}>No conversations yet</div>
            )}
            {sessions.map(session => (
              <div key={session.id} onClick={() => loadSession(session.id)}
                style={{ ...styles.historyItem, background: activeSession === session.id ? "#eff6ff" : "transparent", borderLeft: activeSession === session.id ? "3px solid #2563eb" : "3px solid transparent" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={styles.historyTitle}>{session.title}</div>
                  <div style={styles.historyTime}>{session.timestamp}</div>
                </div>
                <button onClick={(e) => deleteSession(e, session.id)} style={styles.deleteBtn}>🗑</button>
              </div>
            ))}
          </div>

          <div style={styles.sidebarBottom}>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>JurisAI © 2026</div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* Top Bar */}
        <div style={styles.topBar}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>
            {sidebarOpen ? "←" : "→"}
          </button>
          <div style={styles.topTitle}>
            {activeSession ? sessions.find(s => s.id === activeSession)?.title || "JurisAI" : "JurisAI"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: loading ? "#f59e0b" : "#16a34a" }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>{loading ? "Thinking..." : "Online"}</span>
          </div>
        </div>

        {/* Messages or Empty State */}
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3L12 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 21H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5 8L12 3L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 8H9L6 14C6 14 3.5 14 3 12C2.5 10 3 8 3 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.3)"/>
                <path d="M21 8H15L18 14C18 14 20.5 14 21 12C21.5 10 21 8 21 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
            <div style={styles.emptyTitle}>JurisAI</div>
            <div style={styles.emptySubtitle}>Your AI-powered Legal Intelligence System</div>
            <div style={styles.suggestionsGrid}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); inputRef.current?.focus(); }} style={styles.suggestionCard}>
                  <span style={{ fontSize: 18 }}>{["👤", "📜", "📊", "🗺️", "📈", "🏛️"][i]}</span>
                  <span style={{ fontSize: 13, color: "#374151", textAlign: "left" }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.messageArea}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 20 }}>
                <div style={{ maxWidth: "78%", display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>

                  {/* Avatar */}
                  <div style={{ ...styles.avatar, background: msg.role === "user" ? "#2563eb" : "#eff6ff", color: msg.role === "user" ? "white" : "#1e40af", flexShrink: 0, border: msg.role === "user" ? "none" : "1px solid #dbeafe" }}>
                    {msg.role === "user" ? "U" : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L12 21" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 21H19" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 8L12 3L19 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 8H9L6 14C6 14 3.5 14 3 12C2.5 10 3 8 3 8Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(37,99,235,0.15)"/>
                        <path d="M21 8H15L18 14C18 14 20.5 14 21 12C21.5 10 21 8 21 8Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(37,99,235,0.15)"/>
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                      {msg.role === "user" ? "You" : "JurisAI"}
                    </div>
                    <div style={{
                      ...styles.bubble,
                      background: msg.role === "user" ? "#2563eb" : "#f9fafb",
                      color: msg.role === "user" ? "white" : "#111827",
                      border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                      borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                    }}>
                      {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                    </div>
                    {msg.role === "assistant" && <MessageActions content={msg.content} />}
                    {msg.sql_executed && <SQLBox sql={msg.sql_executed} userMessage={messages[i-1]?.content} />}
                    {msg.dynamic_chart && <DynamicChart chartData={msg.dynamic_chart} />}
                    {msg.line_data && <LineChartRenderer lineData={msg.line_data} />}
                    {msg.mermaid && <MermaidRenderer code={msg.mermaid} type={msg.mermaid_type} />}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ ...styles.avatar, background: "#eff6ff", border: "1px solid #dbeafe", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3L12 21" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M5 21H19" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M5 8L12 3L19 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 8H9L6 14C6 14 3.5 14 3 12C2.5 10 3 8 3 8Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(37,99,235,0.15)"/>
                    <path d="M21 8H15L18 14C18 14 20.5 14 21 12C21.5 10 21 8 21 8Z" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(37,99,235,0.15)"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>JurisAI</div>
                  <div style={{ ...styles.bubble, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "4px 18px 18px 18px", display: "flex", gap: 4, padding: "14px 18px" }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{ width: 7, height: 7, borderRadius: "50%", background: "#2563eb", animation: "bounce 1.2s infinite", animationDelay: `${j * 0.3}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Suggestions Strip */}
        {messages.length > 0 && (
          <div style={styles.suggestStrip}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setInput(s)} style={styles.stripBtn}>{s}</button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={styles.inputArea}>
          <div style={styles.inputBox}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask anything about Indian law..."
              style={styles.input} />
            <button onClick={startVoice} disabled={listening} title="Voice Input" style={{
              ...styles.iconBtn,
              background: listening ? "#fee2e2" : "#f3f4f6",
              color: listening ? "#dc2626" : "#6b7280",
              animation: listening ? "pulse 1s infinite" : "none"
            }}>
              {listening ? "🔴" : "🎤"}
            </button>
            <button onClick={handleSend} disabled={loading} style={{
              ...styles.sendBtn,
              background: loading ? "#e5e7eb" : "#2563eb",
              cursor: loading ? "not-allowed" : "pointer"
            }}>
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={styles.inputHint}>
            {listening ? "Listening... speak now" : "Press Enter to send  •  Click mic for voice input  •  JurisAI © 2026"}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#f9fafb} ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
        *{box-sizing:border-box}
        button:hover{opacity:0.85}
      `}</style>
    </div>
  );
}

// ============================================================
// STYLES - Clean White Theme like Claude
// ============================================================
const styles = {
  root: {
    display: "flex", height: "100vh",
    background: "#ffffff",
    fontFamily: "'DM Sans', sans-serif",
    color: "#111827"
  },
  sidebar: {
    background: "#f9fafb",
    borderRight: "1px solid #e5e7eb",
    transition: "width 0.25s ease",
    flexShrink: 0
  },
  sidebarInner: {
    width: 260, height: "100%",
    display: "flex", flexDirection: "column",
    padding: "16px 0"
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 16px 16px",
    borderBottom: "1px solid #e5e7eb"
  },
  logoIcon: {
    width: 36, height: 36,
    background: "#2563eb",
    borderRadius: 10,
    display: "flex", alignItems: "center",
    justifyContent: "center",
    color: "white", fontWeight: 800,
    fontSize: 16, flexShrink: 0
  },
  logoTitle: {
    fontWeight: 700, fontSize: 16,
    color: "#111827", letterSpacing: -0.3
  },
  logoSub: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  newChatBtn: {
    margin: "12px 12px 8px",
    background: "#2563eb",
    border: "none", borderRadius: 10,
    padding: "10px 16px",
    color: "white", fontSize: 13,
    fontWeight: 600, cursor: "pointer",
    display: "flex", alignItems: "center",
    gap: 8, fontFamily: "'DM Sans', sans-serif"
  },
  historyLabel: {
    padding: "12px 16px 6px",
    fontSize: 11, color: "#9ca3af",
    fontWeight: 600, letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  historyList: { flex: 1, overflowY: "auto", padding: "0 8px" },
  historyItem: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 10px", borderRadius: 8,
    cursor: "pointer", transition: "all 0.15s",
    marginBottom: 2, borderLeft: "3px solid transparent"
  },
  historyTitle: {
    fontSize: 13, color: "#374151",
    whiteSpace: "nowrap", overflow: "hidden",
    textOverflow: "ellipsis", fontWeight: 500
  },
  historyTime: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  deleteBtn: {
    background: "none", border: "none",
    cursor: "pointer", fontSize: 12,
    opacity: 0.4, padding: 2
  },
  emptyHistory: {
    fontSize: 12, color: "#d1d5db",
    textAlign: "center", padding: "20px 10px"
  },
  sidebarBottom: {
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb"
  },
  main: {
    flex: 1, display: "flex",
    flexDirection: "column", overflow: "hidden",
    background: "#ffffff"
  },
  topBar: {
    padding: "12px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex", alignItems: "center", gap: 12,
    background: "#ffffff"
  },
  menuBtn: {
    background: "none", border: "1px solid #e5e7eb",
    borderRadius: 8, color: "#6b7280",
    width: 32, height: 32, cursor: "pointer",
    fontSize: 14, display: "flex",
    alignItems: "center", justifyContent: "center"
  },
  topTitle: {
    flex: 1, fontWeight: 600, fontSize: 15,
    color: "#111827", whiteSpace: "nowrap",
    overflow: "hidden", textOverflow: "ellipsis"
  },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "40px 24px"
  },
  emptyIcon: {
    width: 64, height: 64,
    background: "#2563eb",
    borderRadius: 20,
    display: "flex", alignItems: "center",
    justifyContent: "center",
    color: "white", fontWeight: 800,
    fontSize: 28, marginBottom: 16
  },
  emptyTitle: {
    fontSize: 26, fontWeight: 700,
    color: "#111827", marginBottom: 8, letterSpacing: -0.5
  },
  emptySubtitle: {
    fontSize: 14, color: "#6b7280", marginBottom: 36
  },
  suggestionsGrid: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10, maxWidth: 580, width: "100%"
  },
  suggestionCard: {
    background: "#ffffff", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: "14px 16px",
    cursor: "pointer", display: "flex",
    alignItems: "center", gap: 12,
    textAlign: "left", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  },
  messageArea: {
    flex: 1, overflowY: "auto",
    padding: "24px 40px",
    maxWidth: 860,
    width: "100%",
    alignSelf: "center"
  },
  avatar: {
    width: 30, height: 30, borderRadius: "50%",
    display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 13,
    fontWeight: 700
  },
  bubble: {
    padding: "12px 16px", fontSize: 14,
    lineHeight: 1.75, borderRadius: 12,
    wordBreak: "break-word",
    overflowWrap: "break-word",
    maxWidth: "100%"
  },
  suggestStrip: {
    padding: "8px 20px", display: "flex",
    gap: 8, overflowX: "auto",
    borderTop: "1px solid #f3f4f6"
  },
  stripBtn: {
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, color: "#374151",
    cursor: "pointer", whiteSpace: "nowrap",
    fontFamily: "'DM Sans', sans-serif"
  },
  inputArea: {
    padding: "12px 20px 20px",
    borderTop: "1px solid #e5e7eb",
    maxWidth: 820, width: "100%",
    margin: "0 auto", alignSelf: "center"
  },
  inputBox: {
    display: "flex", gap: 8,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 14, padding: "6px 6px 6px 16px",
    alignItems: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
  },
  input: {
    flex: 1, background: "none", border: "none",
    color: "#111827", fontSize: 14, outline: "none",
    fontFamily: "'DM Sans', sans-serif", padding: "6px 0"
  },
  iconBtn: {
    border: "none", borderRadius: 10,
    width: 36, height: 36, cursor: "pointer",
    fontSize: 16, display: "flex",
    alignItems: "center", justifyContent: "center",
    transition: "all 0.2s"
  },
  sendBtn: {
    border: "none", borderRadius: 10,
    width: 36, height: 36,
    color: "white", fontSize: 15,
    display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all 0.2s"
  },
  inputHint: {
    textAlign: "center", fontSize: 11,
    color: "#d1d5db", marginTop: 8
  },
  chartBox: {
    background: "#f9fafb", borderRadius: 12,
    padding: 16, marginTop: 10,
    border: "1px solid #e5e7eb"
  },
  chartTitle: {
    color: "#6b7280", fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    margin: "0 0 12px 0", fontWeight: 500
  },
  tooltip: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 8, color: "#111827",
    fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  sqlBtn: {
    background: "#f3f4f6", border: "1px solid #e5e7eb",
    borderRadius: 8, padding: "4px 12px",
    fontSize: 11, color: "#6b7280",
    cursor: "pointer",
    fontFamily: "'DM Mono', monospace", marginTop: 8
  },
  sqlBox: {
    background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 8, padding: 12, marginTop: 6,
    color: "#374151", fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    whiteSpace: "pre-wrap", margin: "6px 0 0 0"
  },
  actionBtn: {
    background: "#f3f4f6", border: "1px solid #e5e7eb",
    borderRadius: 8, padding: "4px 10px",
    fontSize: 11, color: "#374151",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s"
  }
};
