// Vercel auto-deploys any api/*.js as a serverless function, zero config.
// Every request Vercel's edge routes to a serverless function already
// carries these geo headers — no third-party geo-IP lookup, no API key.
export default function handler(req, res) {
  res.status(200).json({
    country: req.headers['x-vercel-ip-country'] || null,
    city: req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : null,
  });
}
