/**
 * Service for interacting with the Steam API via proxy.
 */

const STEAM_KEY = "D4645EA5F511AA01A97A2A93CE190AB2";

/**
 * Fetches common player summaries for a SteamID.
 */
export const getPlayerSummaries = async (steamId) => {
  try {
    const response = await fetch(`/api/steam/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${steamId}`);
    const data = await response.json();
    return data.response?.players?.[0] || null;
  } catch (err) {
    console.error("Steam API Error (Summaries):", err);
    return null;
  }
};

/**
 * Fetches owned games for a SteamID.
 */
export const getOwnedGames = async (steamId) => {
  try {
    const response = await fetch(`/api/steam/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamId}&include_appinfo=1&format=json`);
    const data = await response.json();
    return data.response?.games || [];
  } catch (err) {
    console.error("Steam API Error (Games):", err);
    return [];
  }
};

/**
 * Attempts to find a RAWG ID for a Steam AppID.
 */
export const getRawgIdBySteamAppId = async (steamAppId, gameName = "") => {
  const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;
  
  const searchRAWG = async (query) => {
    try {
      console.log(`[RAWG API] Fetching search for: "${query}"`);
      const resp = await fetch(`/api/rawg/games?key=${RAWG_KEY}&search=${encodeURIComponent(query)}&page_size=10`);
      const data = await resp.json();
      console.log(`[RAWG API] Results count for "${query}":`, data.results?.length || 0);
      return data.results || [];
    } catch (e) {
      console.error(`[RAWG API] Request failed for ${query}:`, e);
      return [];
    }
  };

  console.log(`[RAWG Lookup] Game: "${gameName}" | AppID: ${steamAppId}`);

  // Strategy 1: Original Cleaned Name
  if (gameName) {
    const cleanName = gameName.replace(/[®™©]/g, '').replace(/\s*-\s*PC$/i, '').trim();
    console.log(`[RAWG Lookup] Strategy 1: Clean Name -> "${cleanName}"`);
    const results = await searchRAWG(cleanName);
    if (results.length > 0) {
      const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normCleanName = normalize(cleanName);
      
      let match = results.find(r => r.name.toLowerCase() === cleanName.toLowerCase()) || 
                  results.find(r => normalize(r.name) === normCleanName);
                  
      // If no exact match is found, fallback to the top result from RAWG, which is generally closest by relevance
      match = match || results[0];

      console.log(`[RAWG Lookup] Success at Strategy 1: ${match.name} (ID: ${match.id})`);
      return match;
    }

    // Strategy 2: Short Name (Part before colon/dash/bracket)
    const shortName = gameName.split(/[:\-\(\[]/)[0].trim();
    if (shortName && shortName.length > 1 && shortName !== cleanName) {
      console.log(`[RAWG Lookup] Strategy 2: Short Name -> "${shortName}"`);
      const results = await searchRAWG(shortName);
      if (results.length > 0) {
        console.log(`[RAWG Lookup] Success at Strategy 2: ${results[0].name} (ID: ${results[0].id})`);
        return results[0];
      }
    }
  }

  // Strategy 3: AppID Search
  console.log(`[RAWG Lookup] Strategy 3: Steam AppID -> ${steamAppId}`);
  const idResults = await searchRAWG(steamAppId);
  if (idResults.length > 0) {
    console.log(`[RAWG Lookup] Success at Strategy 3: ${idResults[0].name} (ID: ${idResults[0].id})`);
    return idResults[0];
  }

  console.error(`[RAWG Lookup] FAILED: No matches for "${gameName}"`);
  return null;
};
