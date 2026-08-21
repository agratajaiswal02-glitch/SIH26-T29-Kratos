// High-Reliability Universal Geocoding Utility using OpenStreetMap with Progressive Fallback

/**
 * Searches for GPS coordinates by address / place name.
 * Uses Nominatim with smart fallback token parsing so even specific store / landmark searches
 * (e.g. "balajee sales raniganj", "Ward 4 Guwahati", "Civil Hospital") succeed instantly without API key restrictions.
 */
export async function searchLocationCoordinates(query) {
  if (!query || !query.trim()) return [];

  const cleanQuery = query.trim();

  // 1. Direct Search with full query
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=5`,
      { headers: { 'Accept': 'application/json' } }
    );
    const osmData = await osmRes.json();
    if (Array.isArray(osmData) && osmData.length > 0) {
      return osmData.map((item) => ({
        lat: Number(parseFloat(item.lat).toFixed(5)),
        lng: Number(parseFloat(item.lon).toFixed(5)),
        display_name: item.display_name,
        source: 'Map Search'
      }));
    }
  } catch (e) {
    console.warn('[Geocoder] Search attempt 1 failed:', e);
  }

  // 2. Progressive Token Splitting
  // e.g. "balajee sales raniganj" -> searches "raniganj" or "sales raniganj"
  const words = cleanQuery.split(/\s+/);
  if (words.length > 1) {
    // Try last word (e.g. city / district / area name)
    const locality = words[words.length - 1];
    try {
      const fallbackRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locality)}&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const fallbackData = await fallbackRes.json();
      if (Array.isArray(fallbackData) && fallbackData.length > 0) {
        return fallbackData.map((item) => ({
          lat: Number(parseFloat(item.lat).toFixed(5)),
          lng: Number(parseFloat(item.lon).toFixed(5)),
          display_name: `${cleanQuery} (${item.display_name.split(',').slice(0, 3).join(', ')})`,
          source: 'Locality Match'
        }));
      }
    } catch (err) {
      console.warn('[Geocoder] Locality fallback search error:', err);
    }
  }

  // 3. Try middle/prefix token combinations if 3+ words
  if (words.length >= 3) {
    const subQuery = words.slice(1).join(' ');
    try {
      const subRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(subQuery)}&limit=5`,
        { headers: { 'Accept': 'application/json' } }
      );
      const subData = await subRes.json();
      if (Array.isArray(subData) && subData.length > 0) {
        return subData.map((item) => ({
          lat: Number(parseFloat(item.lat).toFixed(5)),
          lng: Number(parseFloat(item.lon).toFixed(5)),
          display_name: `${cleanQuery} (${item.display_name.split(',').slice(0, 3).join(', ')})`,
          source: 'Sub-Area Match'
        }));
      }
    } catch (err) {
      console.warn('[Geocoder] Sub-area search error:', err);
    }
  }

  return [];
}
