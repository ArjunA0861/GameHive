/**
 * Extracts the Steam App ID from a RAWG store URL.
 * Example URL: https://store.steampowered.com/app/1086940/Baldurs_Gate_3/
 * @param {Array} stores - Array of store objects from RAWG API
 * @returns {string|null} - The Steam App ID or null if not found
 */
export const getSteamAppId = (stores) => {
    if (!stores || !Array.isArray(stores)) return null;

    const steamStore = stores.find(
        (s) => s.store.name === "Steam" || s.store.slug === "steam" || s.store.id === 1
    );

    if (steamStore && steamStore.url) {
        const match = steamStore.url.match(/app\/(\d+)/);
        return match ? match[1] : null;
    }

    return null;
};
