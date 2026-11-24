// A review link (?review=<token>) is itself a client-rendered SPA route, so
// WhatsApp/iMessage/etc.'s link-preview crawler — which never runs
// JavaScript — only ever sees index.html's generic, site-wide Open Graph
// tags when staff share it. This serves a tiny static page at a stable path
// (/review/<token>) with its own review-specific og:title/og:description
// for the crawler, then immediately sends a real visitor on to the actual
// app route. No database access needed: the text here is fixed for every
// review link, and the token itself is just carried through untouched.
export default function handler(req, res) {
  const { id } = req.query;
  const target = `https://www.sndkqa.com/?review=${encodeURIComponent(id || '')}`;
  const title = 'سندك قطر | قيّم تجربتك';
  const description = 'اكتب ملاحظاتك لكي نستفيد من رأيك، فهو مهم لنا.';
  const image = 'https://www.sndkqa.com/logo-static.png';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="https://www.sndkqa.com/api/review/${encodeURIComponent(id || '')}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>window.location.replace(${JSON.stringify(target)});</script>
</head>
<body>
<p style="font-family:Arial,sans-serif;text-align:center;margin-top:40px">
  جارِ التحويل... <a href="${target}">اضغطي هنا لو لم يتم التحويل تلقائيًا</a>
</p>
</body>
</html>`);
}
