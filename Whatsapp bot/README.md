# SafarLink WhatsApp Bot 🗺️

A WhatsApp bot that connects to the SafarLink chatbot API and helps users find transit routes — powered by **whatsapp-web.js** (no Twilio, no extra accounts needed).

---

## Prerequisites

| Tool | Version | Link |
|------|---------|------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| SafarLink chatbot | running on port 8000 | `cd ../chatbot && uv run main.py` |

---

## Setup & Run

### 1. Install dependencies
```bash
cd "Whatsapp bot"
npm install
```

### 2. Make sure the chatbot is running
```bash
# In a separate terminal:
cd ../chatbot
uv run main.py
```

### 3. Start the bot
```bash
node index.js
```

A **QR code** will appear in the terminal. Open WhatsApp on your phone → **Settings → Linked Devices → Link a Device** → scan the QR code.

Once connected you'll see:
```
✅ SafarLink WhatsApp Bot is ready!
```

> **The session is saved automatically.** You only need to scan the QR code once. On subsequent runs the bot reconnects without scanning.

---

## Usage

| You send | Bot does |
|----------|----------|
| `hi` / `hello` | Greets you and explains how to use the bot |
| `From Bandra to Andheri` | Returns all available routes (bus, metro, train, driving) |
| `How do I get from Dadar to Churchgate?` | Same — natural language queries work |
| `pdf` | Sends a PDF of the last route query as a file attachment |

---

## File Structure

```
Whatsapp bot/
├── index.js       ← Main bot logic
├── formatter.js   ← Formats route JSON into WhatsApp text
├── package.json   ← Node dependencies
├── .env           ← Chatbot URL config
└── README.md      ← This file
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| QR code not appearing | Delete `.wwebjs_auth/` folder and restart |
| `ECONNREFUSED` error | Make sure `uv run main.py` is running in `../chatbot` |
| Bot stops responding | Restart with `node index.js` |
| Session expired | Delete `.wwebjs_auth/` folder and scan QR again |

---

## How It Works

```
You (WhatsApp) ──▶ whatsapp-web.js ──▶ POST /route ──▶ Gemini + Google Maps ──▶ reply
```

The bot uses the existing chatbot endpoints:
- `POST /route` — get route JSON
- `POST /route/export` — get PDF file
