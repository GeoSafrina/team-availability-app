const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SEED_FILE = path.join(__dirname, "data", "seed.json");
const DB_FILE = path.join(__dirname, "data", "db.json");
const STATUSES = ["Available", "Busy", "Away"];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// JSON database, created from the seed data on first run
function loadDb() {
  if (!fs.existsSync(DB_FILE)) fs.copyFileSync(SEED_FILE, DB_FILE);
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function saveDb(list) {
  fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2));
}

// GET /api/members?status=&role=&search=
app.get("/api/members", (req, res) => {
  const { status = "", role = "", search = "" } = req.query;
  const q = search.toString().toLowerCase().trim();
  let list = loadDb();
  if (status) list = list.filter((m) => m.status === status);
  if (role) list = list.filter((m) => m.role === role);
  if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));
  res.json(list);
});

// GET /api/summary - counts for the dashboard badges
app.get("/api/summary", (req, res) => {
  const list = loadDb();
  const summary = { total: list.length, Available: 0, Busy: 0, Away: 0 };
  list.forEach((m) => { summary[m.status] = (summary[m.status] || 0) + 1; });
  res.json(summary);
});

// PATCH /api/members/:id/status  { status: "Available" | "Busy" | "Away" }
app.patch("/api/members/:id/status", (req, res) => {
  const status = req.body.status;
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status must be one of: " + STATUSES.join(", ") });
  }
  const list = loadDb();
  const member = list.find((m) => String(m.id) === req.params.id);
  if (!member) return res.status(404).json({ error: "Member not found." });
  member.status = status;
  member.updatedAt = new Date().toISOString();
  saveDb(list);
  res.json(member);
});

app.listen(PORT, () => console.log(`Team Availability Tracker running on port ${PORT}`));
