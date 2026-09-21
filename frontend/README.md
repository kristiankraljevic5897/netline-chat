# Netline — Cyberpunk Chat

A cyberpunk-styled chat UI built with React + Vite: neon terminal boot sequence with an ASCII banner, a mock contact ("GHOST_09") that replies after you send a message, and a typing indicator.

## Setup

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
netline-chat/
├── index.html          # Vite entry HTML
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx         # React root
    ├── App.jsx          # Chat UI + boot sequence logic
    └── App.css          # Cyberpunk styling
```

## Customize

- `src/App.jsx` — edit `ASCII_ART`, `BOOT_LINES`, and `REPLIES` to change the banner, boot log, and the mock contact's canned responses.
- `src/App.css` — colors are defined as CSS variables at the top (`--magenta`, `--cyan`, `--amber`, etc.).
