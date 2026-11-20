# NSIQ 2.0 · Voice dialogue prototype

Interactive prototype of the continuous two-way voice flow (Figma: NSIQ 2.0 Native Mobile, "Continuous two-way voice dialogue").

Home → waveform → **Listening** (orb centred) → user starts talking → **Speaking** (orb moves down, blue edge glow follows the mic) → stop → **Conversation transcript**.

- `src/index.src.html` — layout, styles and flow
- `src/ball-field-background.js` — Murmuration Lab background (Home: Organic, Chat: Ball Action)
- `src/voice-orb.js` — `<voice-orb>` web component (represents the AI voice; it does not listen to the mic)
- `build.py` — inlines everything into `_site/index.html`; the Pages workflow runs it on every push to `main`

The microphone needs HTTPS (GitHub Pages is fine). On iPhone, tap the waveform button and allow mic access.

Local build: `python3 build.py` then open `_site/index.html`.
