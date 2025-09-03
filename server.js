import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 5050;

// Metabase configuration
const METABASE_SITE_URL = process.env.METABASE_SITE_URL || 'http://localhost:3000';
const METABASE_SECRET_KEY = '5df1abc31785e1c97d9cd5f06068f3bab4b6ca0099917954b49861826a372cdd';

const METABASE_QUESTION_IDS = [39, 42, 43, 44]; // Array of question IDs to embed

app.get('/', (req, res) => {
  // Generate tokens and iframe URLs for all questions
  const questionFrames = METABASE_QUESTION_IDS.map(questionId => {
    const payload = {
      resource: { question: questionId },
      params: {},
      exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };

    const token = jwt.sign(payload, METABASE_SECRET_KEY);
    const iframeUrl = `${METABASE_SITE_URL}/embed/question/${token}#bordered=true&titled=true`;

    return { questionId, iframeUrl };
  });

  // Generate HTML for all iframes
  const iframesHtml = questionFrames.map(({ questionId, iframeUrl }) => `
    <div class="question-container">
      <h3 class="question-title">Question ${questionId}</h3>
      <div class="frame">
        <iframe src="${iframeUrl}" allowtransparency></iframe>
      </div>
    </div>
  `).join('');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Metabase Embed Demo - Multiple Questions</title>
    <style>
      html, body { height: 100%; margin: 0; padding: 20px; box-sizing: border-box; }
      body { background: #0b1021; font-family: -apple-system, system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
      .container { max-width: 1400px; margin: 0 auto; }
      .questions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(600px, 1fr)); gap: 20px; }
      .question-container { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 30px rgba(0,0,0,.35); }
      .question-title { margin: 0; padding: 15px 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; font-size: 16px; font-weight: 600; color: #333; }
      iframe { width: 100%; height: 400px; border: 0; background: #fff; display: block; }
      .note { position: fixed; left: 12px; bottom: 12px; color: #c9d1d9; font: 14px/1.4 -apple-system, system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
      .note code { background: rgba(255,255,255,.12); padding: 2px 6px; border-radius: 6px; }
      @media (max-width: 768px) {
        .questions-grid { grid-template-columns: 1fr; }
        body { padding: 10px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 style="color: #c9d1d9; text-align: center; margin-bottom: 30px;">Metabase Embedded Questions</h1>
      <div class="questions-grid">
        ${iframesHtml}
      </div>
    </div>
    <div class="note">Embedding ${METABASE_QUESTION_IDS.length} questions from <code>${METABASE_SITE_URL}</code></div>
  </body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`Embed server listening on http://localhost:${PORT}`);
});
