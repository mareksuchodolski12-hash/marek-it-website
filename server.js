const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware: JSON parser
app.use(express.json({ limit: "200kb" }));

// Antyspam: 1 request na 3 sekundy per IP
const lastHitByIp = new Map();
app.use((req, res, next) => {
  if (!req.path.startsWith("/api/")) return next();
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const last = lastHitByIp.get(ip) || 0;
  if (now - last < 3000) {
    return res.status(429).json({ ok: false, error: "Za szybko. Spróbuj za chwilę." });
  }
  lastHitByIp.set(ip, now);
  next();
});

// Helper: crypto-random ID
function cryptoRandomId() {
  return "lead_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Endpoint: POST /api/lead (MUSI być PRZED static middleware!)
app.post("/api/lead", (req, res) => {
  const {
    industry,
    problem,
    tools,
    message,
    contact,
    website,
    wantsMvp,
    wantsAutomation,
  } = req.body || {};

  // Walidacja minimalna
  if (!industry || !problem || !message || !contact) {
    return res.status(400).json({ 
      ok: false, 
      error: "Uzupełnij: branża, problem, opis, kontakt." 
    });
  }

  // Sanitizacja
  const safe = (v, max = 2000) =>
    String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  const lead = {
    id: cryptoRandomId(),
    createdAt: new Date().toISOString(),
    industry: safe(industry, 80),
    problem: safe(problem, 120),
    tools: safe(tools, 200),
    message: safe(message, 2000),
    contact: safe(contact, 120),
    website: safe(website, 200),
    wantsMvp: !!wantsMvp,
    wantsAutomation: !!wantsAutomation,
  };

  // Utwórz folder data/ jeśli nie istnieje
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "leads.jsonl");
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Dopisz do pliku JSONL
  fs.appendFile(file, JSON.stringify(lead) + "\n", (err) => {
    if (err) {
      console.error("Error writing lead:", err);
      return res.status(500).json({ ok: false, error: "Błąd serwera. Spróbuj później." });
    }
    console.log(`✓ Lead saved: ${lead.id}`);
    res.json({ ok: true });
  });
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html for root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Fallback: send index.html for all unknown routes (SPA support)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Server running on http://localhost:${PORT}\n`);
});
