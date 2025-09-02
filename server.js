import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 5050;

// Configure via env or fall back to provided example values
const METABASE_SITE_URL = process.env.METABASE_SITE_URL || 'http://localhost:3000';
const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY || 'a31a49066443d6aaae5e80e5d51efbe02f71a381faef62727131ad71473a4b52';
const METABASE_QUESTION_ID = Number(process.env.METABASE_QUESTION_ID || 48);

app.get('/', (req, res) => {
  const validationErrors = [];
  if (!METABASE_SITE_URL) validationErrors.push('Missing METABASE_SITE_URL');
  if (!METABASE_SECRET_KEY) validationErrors.push('Missing METABASE_SECRET_KEY');
  if (!Number.isFinite(METABASE_QUESTION_ID)) validationErrors.push('Invalid METABASE_QUESTION_ID');

  const renderError = (message, details = []) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Metabase Embed Error</title>
    <style>
      html, body { height: 100%; margin: 0; }
      .wrap { display: grid; place-items: center; height: 100%; background: #0b1021; color: #c9d1d9; }
      .card { width: min(900px, 96vw); background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 24px; box-shadow: 0 6px 30px rgba(0,0,0,.35); }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 8px 0; }
      code { background: rgba(255,255,255,.08); padding: 2px 6px; border-radius: 6px; }
      ul { margin: 8px 0 0 18px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Unable to render embedded Metabase question</h1>
        <p>${message}</p>
        ${details.length ? `<ul>${details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
        <p>Check your environment variables and Metabase setup. Expected site URL: <code>${METABASE_SITE_URL || 'unset'}</code>, question: <code>${String(METABASE_QUESTION_ID)}</code>.</p>
      </div>
    </div>
  </body>
</html>`;

  if (validationErrors.length) {
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(renderError('Configuration error detected.', validationErrors));
  }

  try {
    const payload = {
      resource: { question: METABASE_QUESTION_ID },
      params: {},
      exp: Math.round(Date.now() / 1000) + (10 * 60)
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
  } catch (err) {
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(renderError('Failed to generate embed token.', [String(err && err.message ? err.message : err)]));
  }
});

app.listen(PORT, () => {
  console.log(`Embed server listening on http://localhost:${PORT}`);
});
