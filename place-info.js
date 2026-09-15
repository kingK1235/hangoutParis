// Vercel serverless function — one Google Places lookup that returns rating,
// review count, and a photo reference together, so we don't pay for two
// separate Google calls per venue. The key never reaches the browser.

export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY is not set in this Vercel project.' });
    return;
  }

  const query = req.query.query;
  if (!query) {
    res.status(400).json({ error: 'Missing "query" parameter.' });
    return;
  }

  try {
    const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=rating,user_ratings_total,photos&key=${apiKey}`;
    const findRes = await fetch(findUrl);
    const findData = await findRes.json();

    const candidate = findData.candidates && findData.candidates[0];
    if (!candidate) {
      res.status(200).json({ rating: null, userRatingsTotal: null, photoRef: null });
      return;
    }

    const photoRef = (candidate.photos && candidate.photos[0] && candidate.photos[0].photo_reference) || null;

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).json({
      rating: candidate.rating || null,
      userRatingsTotal: candidate.user_ratings_total || null,
      photoRef,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Unknown server error' });
  }
}
