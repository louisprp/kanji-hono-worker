# KanjiVG → PNG (Hono on Cloudflare Workers)

<p align="center">
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-blue"></a>
  <a href="https://hono.dev/"><img alt="Hono" src="https://img.shields.io/badge/Hono-Cloudflare%20Workers-ff7b00"></a>
  <a href="https://kanjivg.tagaini.net/"><img alt="KanjiVG" src="https://img.shields.io/badge/Data-KanjiVG-8a2be2"></a>
</p>

A tiny authenticated HTTP API that composes 1–3 Japanese characters from KanjiVG, styles them for light/dark themes, and renders a crisp PNG using `@resvg/resvg-wasm`. Built with Hono and designed for Cloudflare Workers (works on other runtimes too).

---

## Highlights

* 🔐 **Bearer auth** with a single token (`AUTH_TOKEN`)
* ✅ **Request validation** via `@hono/valibot-validator`
* 🖼️ **SVG → PNG** with `svgson` and `@resvg/resvg-wasm` (no headless browser)
* 🌓 **Light/Dark** theming
* 🧩 **Data** from [KanjiVG](https://kanjivg.tagaini.net/) SVG dataset 

---

## iOS Shortcut Demo (usage example)

> Showcase using an iOS Shortcut that calls the Worker and displays the image response.

https://github.com/user-attachments/assets/1c712e65-f3f5-447a-a797-73cb4597f184

---

## What it does

1. Accepts a POST to `/` with JSON payload:

   ```json
   { "chars": "漢字", "theme": "dark" }
   ```
2. Downloads the corresponding KanjiVG SVGs from the official repo mirror.
3. Parses them with svgson, keeps stroke paths and stroke numbers groups only.
4. Re-colors strokes & numbers based on `theme`, and composes them side-by-side.
5. Feeds the composed SVG to Resvg (WASM), embeds Noto Serif for labels, and returns a PNG.

---

## Quick try (curl)

> Replace `https://your-worker.example.com` and `YOUR_TOKEN`.

```bash
curl -X POST https://your-worker.example.com/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"chars":"日本","theme":"light"}' \
  --output nihon.png
```

---

## API Reference

### `POST /`

**Auth:** `Authorization: Bearer <AUTH_TOKEN>`
**Body:** JSON

```ts
type Payload = {
  chars: string;            // must contain 1–3 Unicode characters
  theme?: 'light' | 'dark'; // optional; default 'light'
};
```

**Responses:**

* `200 OK` → `image/png` (binary)
* `400 Bad Request` → validation error (JSON)
* `401 Unauthorized` → missing/invalid token (JSON)
* `404 Not Found` → any character SVG not found (JSON: `{ "error": "Not Found" }`)

---

## Setup & Development

1. **Install**

   ```bash
   npm install
   ```

2. **Configure auth token**

   Create `.env` or set an env var in your platform:

   ```
   AUTH_TOKEN=change-me
   ```

3. **Run locally**

   ```bash
   npm run dev
   ```

4. **Deploy**

   ```bash
   npm run deploy
   ```

---

## Attribution

* **KanjiVG**: © Ulrich Apel et al., licensed under **CC BY-SA 3.0**. See [https://kanjivg.tagaini.net/](https://kanjivg.tagaini.net/).
  If you publish generated images, ensure attribution as required by the license.
* **resvg / resvg-wasm**
* **Noto Serif**
* **Hono, Valibot, svgson**
