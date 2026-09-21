# Netline Backend

ASP.NET Core (.NET 8) minimal API that sits between the Netline chat frontend and the Claude API. It receives the conversation, forwards it to Claude with a "GHOST_09" persona system prompt, and returns the reply. The frontend never sees your API key.

## Requirements

- .NET 8 SDK
- An Anthropic API key (from console.anthropic.com)

## 1. Set your API key (never commit it)

**Option A — user-secrets (recommended for local dev):**

```bash
cd netline-backend
dotnet user-secrets init
dotnet user-secrets set "Anthropic:ApiKey" "sk-ant-..."
```

**Option B — environment variable:**

```bash
# macOS / Linux
export ANTHROPIC_API_KEY="sk-ant-..."

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

The code checks `Anthropic:ApiKey` (config) first, then falls back to the `ANTHROPIC_API_KEY` environment variable. `appsettings.json` ships with an empty placeholder — do not put a real key there if you plan to commit the repo.

## 2. Run it

```bash
dotnet restore
dotnet run
```

By default it listens on the ports printed in the console (e.g. `http://localhost:5000` / `https://localhost:5001` — check the terminal output, .NET picks these per machine).

## Project structure

```
netline-backend/
├── Program.cs                  # App configuration only: services, CORS, HttpClient, DI, pipeline
├── Endpoints/
│   └── ChatEndpoints.cs        # Route mapping (/api/chat, /api/health) — no HTTP-call logic
├── Services/
│   ├── IClaudeService.cs       # Contract + result type for talking to Claude
│   └── ClaudeService.cs        # The actual POST call to the Anthropic /v1/messages API
├── Models/
│   └── ChatModels.cs           # Request/response DTOs
├── appsettings.json
└── NetlineBackend.csproj
```

If you need to change the persona system prompt, the model name, or how the request to Claude is built, that all lives in `Services/ClaudeService.cs`. Route shape and status-code handling live in `Endpoints/ChatEndpoints.cs`. `Program.cs` stays limited to wiring things together.

## 3. API contract

**POST `/api/chat`**

Request body:

```json
{
  "messages": [
    { "role": "user", "content": "hey, you there?" },
    { "role": "assistant", "content": "signal's clean on my end. go ahead." },
    { "role": "user", "content": "who's watching this line?" }
  ]
}
```

Send the full conversation so far (the backend is stateless — it doesn't store history between requests). Response:

```json
{ "reply": "can't say. keep it short and we're fine." }
```

**GET `/api/health`** → `{ "status": "ok" }`, useful to check the server is up.

## 4. CORS

By default only `http://localhost:5173` (the Vite dev server for the React frontend) is allowed. Add more origins in `appsettings.json` under `Cors:AllowedOrigins`, or set them for production in your hosting environment's config.

## 5. Connecting the React frontend

In the `netline-chat` React project, point the chat's `send()` function at `POST http://localhost:5000/api/chat` (or whatever port is printed) instead of the mock replies. See the updated `App.jsx` provided alongside this backend.

## Note on the published web demo

The chat page you saw as a Claude-hosted link (the "artifact") runs inside a sandbox that only allows it to load a few script/font CDNs — it cannot call an arbitrary backend like this one. This backend is meant to be used with the downloadable React project running on your own machine (or wherever you deploy both together).
