// Vercel Serverless Function — Instantly.ai API Proxy
// Handles CORS and forwards requests to Instantly API v2

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, apiKey, payload } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'Missing API key' });
    if (!action) return res.status(400).json({ error: 'Missing action' });

    const routes = {
      count: {
        path: '/api/v2/supersearch-enrichment/count-leads-from-supersearch',
        method: 'POST'
      },
      enrich: {
        path: '/api/v2/supersearch-enrichment/enrich-leads-from-supersearch',
        method: 'POST'
      },
      list_leads: {
        path: '/api/v2/leads/list',
        method: 'POST'
      },
      list_lead_lists: {
        path: '/api/v2/lead-lists?limit=20',
        method: 'GET'
      }
    };

    const route = routes[action];
    if (!route) return res.status(400).json({ error: 'Unknown action' });

    const url = `https://api.instantly.ai${route.path}`;
    const fetchOpts = {
      method: route.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (route.method === 'POST') {
      fetchOpts.body = JSON.stringify(payload || {});
    }

    const apiRes = await fetch(url, fetchOpts);
    const text = await apiRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(apiRes.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message || 'Proxy failed' });
  }
}
