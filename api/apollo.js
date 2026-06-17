// Vercel Serverless Function — Apollo API Proxy
// Handles CORS and forwards requests to Apollo

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { endpoint, apiKey, payload } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    // Whitelist allowed endpoints for safety
    const allowed = ['mixed_people/search', 'people/match'];
    if (!allowed.includes(endpoint)) {
      return res.status(400).json({ error: 'Endpoint not allowed' });
    }

    const apolloUrl = `https://api.apollo.io/v1/${endpoint}`;

    const apolloRes = await fetch(apolloUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(payload || {})
    });

    const data = await apolloRes.json();

    return res.status(apolloRes.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Proxy failed' });
  }
}
