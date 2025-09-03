import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 5050;

// Metabase configuration
const METABASE_SITE_URL = process.env.METABASE_SITE_URL || 'http://localhost:3000';
const METABASE_SECRET_KEY = 'ba813cf92951e6eef537e3574838475bf296457b1a49f44fa2797a717ccf5ebb';
const METABASE_QUESTION_ID = 38;

app.get('/', (req, res) => {
  const payload = {
    resource: { question: METABASE_QUESTION_ID },
    params: {},
    exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
  };

  const token = jwt.sign(payload, METABASE_SECRET_KEY);
  const iframeUrl = `${METABASE_SITE_URL}/embed/question/${token}#bordered=true&titled=true`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Metabase Embed Demo</title>
    <style>
      html, body { height: 100%; margin: 0; }
      .wrap { display: grid; place-items: center; height: 100%; background: #0b1021; }
      iframe { width: 100%; height: 100%; border: 0; background: #fff; border-radius: inherit; display: block; }
      .frame { width: min(1200px, 96vw); height: min(800px, 88vh); box-shadow: 0 6px 30px rgba(0,0,0,.35); border-radius: 10px; overflow: hidden; }
      .note { position: fixed; left: 12px; bottom: 12px; color: #c9d1d9; font: 14px/1.4 -apple-system, system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
      .note code { background: rgba(255,255,255,.12); padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="frame">
        <iframe src="${iframeUrl}" allowtransparency></iframe>
      </div>
      <div class="note">Embedding question <code>${METABASE_QUESTION_ID}</code> from <code>${METABASE_SITE_URL}</code></div>
    </div>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Embed server listening on http://localhost:${PORT}`);
});
