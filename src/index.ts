import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import api from "./routes/api";
import auth from "./routes/auth";

const renderLanding = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VibeRate API</title>
  <style>
    :root {
      color-scheme: light;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      background: radial-gradient(circle at 20% 20%, #f5f7ff, #ffffff 40%), radial-gradient(circle at 80% 0%, #f0f7ff, #ffffff 30%), #ffffff;
      color: #0f172a;
    }
    body { margin: 0; padding: 32px; max-width: 960px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { margin: 6px 0 16px; }
    code { background: #e2e8f0; padding: 2px 6px; border-radius: 6px; }
    section { background: #ffffffcc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); backdrop-filter: blur(4px); }
    button { background: #111827; color: #f8fafc; border: none; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-weight: 600; }
    button:hover { background: #0b1222; }
    .grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    textarea { width: 100%; min-height: 180px; border-radius: 12px; border: 1px solid #cbd5e1; padding: 12px; font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; background: #f8fafc; }
    ul { padding-left: 20px; margin: 8px 0; }
  </style>
</head>
<body>
  <h1>VibeRate API</h1>
  <p>Service is running. Use the quick buttons below or hit the REST endpoints directly.</p>

  <section>
    <h2>Public endpoints</h2>
    <ul>
      <li><code>/api/health</code></li>
      <li><code>/api/vibes</code></li>
      <li><code>/api/titles/now-playing</code>, <code>/popular</code>, <code>/top-rated</code>, <code>/trending</code></li>
      <li><code>/api/titles/:id</code></li>
    </ul>
    <p>Protected routes require a Bearer access token from <code>/api/auth/login</code> after registering via <code>/api/auth/register</code>.</p>
  </section>

  <section>
    <h2>Try it</h2>
    <p id="status" style="color:#0f172a; font-weight:600;">Buttons ready.</p>
    <div class="grid">
      <button data-path="/api/health">Health</button>
      <button data-path="/api/vibes">Vibes</button>
      <button data-path="/api/titles/now-playing">Titles: Now Playing</button>
      <button data-path="/api/titles/popular">Titles: Popular</button>
      <button data-path="/api/titles/top-rated">Titles: Top Rated</button>
      <button data-path="/api/titles/trending">Titles: Trending</button>
    </div>
    <p style="margin-top:12px;">Responses:</p>
    <textarea id="output" readonly>Click a button to fetch…</textarea>
  </section>

  <section>
    <h2>Auth notes</h2>
    <p>No API key is required. Protected routes use JWT Bearer tokens. Flow: <code>POST /api/auth/register</code> → <code>POST /api/auth/login</code> → include <code>Authorization: Bearer &lt;accessToken&gt;</code> on rating/status/feed endpoints.</p>
  </section>

  <script>
    const output = document.querySelector('#output');
    const status = document.querySelector('#status');
    const buttons = document.querySelectorAll('button[data-path]');

    function setStatus(msg, color = '#0f172a') {
      if (status) status.textContent = msg, status.style.color = color;
    }

    if (!output) setStatus('Missing output textarea', '#b91c1c');
    if (typeof fetch !== 'function') setStatus('Fetch API not available in this browser', '#b91c1c');

    if (output && buttons.length) {
      for (const btn of buttons) {
        btn.addEventListener('click', async () => {
          const path = btn.getAttribute('data-path') || '';
          output.value = 'Loading ' + path + '…';
          setStatus('Requesting ' + path + ' …');
          try {
            const res = await fetch(path);
            const text = await res.text();
            let formatted = text;
            try {
              formatted = JSON.stringify(JSON.parse(text), null, 2);
            } catch (_) {
              // keep plain text
            }
            output.value = formatted;
            setStatus('Loaded ' + path);
          } catch (err) {
            output.value = 'Request failed: ' + err;
            setStatus('Request failed: ' + err, '#b91c1c');
          }
        });
      }
    }
  </script>
</body>
</html>`;

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
  }),
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.type("html").send(renderLanding());
});

app.get("/api", (_req, res) => {
  res.type("html").send(renderLanding());
});

app.use("/api/auth", auth);
app.use("/api", api);

app.use(errorHandler);

if (require.main === module) {
  const host = process.env.HOST ?? "127.0.0.1";
  app.listen(env.port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`VibeRate API ready on http://${host}:${env.port}`);
  });
}

export default app;
