const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ limit: "200kb", extended: true }));

// Rate limiting: 1 request per 3 seconds per IP
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

// Generate random ID
function generateId() {
  return "lead_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// API: Save lead form submission
app.post("/api/lead", (req, res) => {
  const { industry, problem, tools, message, contact, website, wantsMvp, wantsAutomation } = req.body || {};

  // Validation
  if (!industry || !problem || !message || !contact) {
    return res.status(400).json({ ok: false, error: "Uzupełnij: branża, problem, opis, kontakt." });
  }

  // Sanitize
  const safe = (v, max = 2000) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  const lead = {
    id: generateId(),
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

  // Save to data folder
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "leads.jsonl");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.appendFile(file, JSON.stringify(lead) + "\n", (err) => {
    if (err) {
      console.error("Error writing lead:", err);
      return res.status(500).json({ ok: false, error: "Błąd serwera. Spróbuj później." });
    }
    console.log(`✓ Lead saved: ${lead.id}`);
    res.json({ ok: true });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "running", timestamp: new Date().toISOString() });
});

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback: serve index.html for all unknown routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
