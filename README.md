# ChatForge AI — Setup Guide

## Project Structure
```
chatforge/
├── frontend/
│   ├── index.html       ← Main page (URL input + generate)
│   └── chat.html        ← Live chat UI
├── netlify/
│   └── functions/
│       ├── analyze.js   ← Scrapes website, returns bot config
│       └── chat.js      ← Claude AI powered chat (real AI!)
├── netlify.toml
└── package.json
```

---

## 🚀 Deploy to Netlify

### Step 1 — Upload to GitHub
1. Create a new GitHub repo (e.g. `chatforge-ai`)
2. Upload all files keeping the folder structure above

### Step 2 — Connect Netlify
1. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from GitHub"
2. Select your repo
3. Build settings (auto-detected from netlify.toml):
   - **Publish directory:** `frontend`
   - **Build command:** `npm install`
   - **Functions directory:** `netlify/functions`

### Step 3 — Add ANTHROPIC_API_KEY ⚠️ REQUIRED
1. In Netlify → Site settings → **Environment variables**
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-...your key...`
3. Get key from: https://console.anthropic.com/

### Step 4 — Deploy!
Click "Deploy site" — done in ~60 seconds.

---

## 🔧 What Was Fixed

| Problem | Fix |
|---------|-----|
| `analyze.js` used `express + serverless-http` | Rewritten as pure `exports.handler` (correct Netlify format) |
| `chat.js` used keyword matching, not real AI | Now uses Claude API (`claude-haiku`) for real responses |
| No multi-turn conversation memory | `chatHistory` array passed with every request |
| index.html had no link to chat.html | Added "Open Chatbot →" button + `sessionStorage` handoff |
| `package.json` had `express`, `serverless-http` | Removed (not needed), kept only `axios` + `cheerio` |
| Missing CORS headers | Added to all function responses |

---

## 💡 Local Development
```bash
npm install -g netlify-cli
npm install
ANTHROPIC_API_KEY=sk-ant-xxx netlify dev
# Open http://localhost:8888
```
