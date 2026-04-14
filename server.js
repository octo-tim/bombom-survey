const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ─── Data Storage ───
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "responses.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

function readResponses() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveResponses(data) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ─── API: Submit Survey ───
app.post("/api/submit", (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.name || !body.phone) {
      return res.status(400).json({ error: "필수 항목이 누락되었습니다." });
    }

    const responses = readResponses();
    const newEntry = {
      id: responses.length + 1,
      ...body,
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toISOString(),
    };
    responses.push(newEntry);
    saveResponses(responses);

    console.log(`[설문 제출] #${newEntry.id} ${newEntry.name} (${newEntry.region} ${newEntry.subRegion})`);
    res.json({ success: true, id: newEntry.id });
  } catch (e) {
    console.error("설문 저장 오류:", e);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ─── API: Get Responses (admin) ───
app.get("/api/responses", (req, res) => {
  try {
    const responses = readResponses();
    res.json(responses);
  } catch (e) {
    console.error("응답 조회 오류:", e);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ─── Pages ───
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`봄봄매트 설문조사 서버 실행: port ${PORT}`);
  ensureDataDir();
  const count = readResponses().length;
  console.log(`저장된 응답: ${count}건`);
});
