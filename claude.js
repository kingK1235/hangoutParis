// Vercel serverless function — this is the ONLY place the API key ever exists.
// Set ANTHROPIC_API_KEY in the Vercel project's Settings -> Environment Variables.
// Never commit the key itself to GitHub or paste it into the frontend code.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in this Vercel project.' });
    return;
  }

  try {
    const { prompt, tools, max_tokens } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: 'Missing "prompt" in request body.' });
      return;
    }

    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: max_tokens || 1200,
      messages: [{ role: 'user', content: prompt }],
    };
    if (tools) body.tools = tools;

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unknown server error' });
  }
}
