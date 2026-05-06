const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = '/api/rawg'; // Using the proxy setup in vite.config.js if applicable, or direct URL if not. 
// Note: In the previous Browse.jsx, it was using '/api/rawg'. I should stick to that or use the direct URL if the proxy isn't set up.
// Looking at the previous Browse.jsx, it used '/api/rawg'. I'll stick to that for now, 
// BUT if the user is running locally without a proxy, it might fail. 
// To be safe, I'll check if I can see vite.config.js. 
// For now, I'll assume '/api/rawg' is the correct path as per the existing code.

// However, to be more robust, I can fallback to 'https://api.rawg.io/api' if needed, but CORS might be an issue.
// Let's assume the existing Browse.jsx was working.

// Let's bypass the Vite proxy which seems to be causing 500 Internel Server Errors.
const RAWG_BASE_URL = 'https://api.rawg.io/api';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
    };
};

// In-memory cache for metadata
const cache = {
    genres: null,
    platforms: null,
    gameDetails: {},
    gameStores: {},
};

export const rawgApi = {
    // Fetch games with various filters
    getGames: async ({
        page = 1,
        pageSize = 20,
        search = '',
        genres = '',
        parent_platforms = '', // Changed from platforms to parent_platforms for correct filtering
        ordering = '-added', // default popularity
        dates = '',
        metacritic = ''
    }) => {
        try {
            const params = new URLSearchParams({
                key: API_KEY,
                page: page.toString(),
                page_size: pageSize.toString(),
            });

            if (search) params.append('search', search);
            if (genres) params.append('genres', genres);
            if (parent_platforms) params.append('parent_platforms', parent_platforms);
            if (ordering) params.append('ordering', ordering);
            if (dates) params.append('dates', dates);
            if (metacritic) params.append('metacritic', metacritic);

            const response = await fetch(`${RAWG_BASE_URL}/games?${params.toString()}`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching games:", error);
            throw error;
        }
    },

    // Get list of genres
    getGenres: async () => {
        if (cache.genres) return cache.genres;
        try {
            const response = await fetch(`${RAWG_BASE_URL}/genres?key=${API_KEY}`);
            if (!response.ok) throw new Error("Failed to fetch genres");
            const data = await response.json();
            cache.genres = data;
            return data;
        } catch (error) {
            console.error("Error fetching genres:", error);
            throw error;
        }
    },

    // Get list of platforms
    getPlatforms: async () => {
        if (cache.platforms) return cache.platforms;
        try {
            // Fetching parent platforms usually gives a cleaner list (PC, PlayStation, Xbox, etc.)
            const response = await fetch(`${RAWG_BASE_URL}/platforms/lists/parents?key=${API_KEY}`);
            if (!response.ok) throw new Error("Failed to fetch platforms");
            const data = await response.json();
            cache.platforms = data;
            return data;
        } catch (error) {
            console.error("Error fetching platforms:", error);
            throw error;
        }
    },

    // Get details for a single game
    getGameDetails: async (id) => {
        if (cache.gameDetails[id]) return cache.gameDetails[id];
        try {
            const response = await fetch(`${RAWG_BASE_URL}/games/${id}?key=${API_KEY}`);
            if (!response.ok) throw new Error("Failed to fetch game details");
            const data = await response.json();
            cache.gameDetails[id] = data;
            return data;
        } catch (error) {
            console.error("Error fetching game details:", error);
            throw error;
        }
    },

    // Get actual store links for a single game
    getGameStores: async (id) => {
        if (cache.gameStores[id]) return cache.gameStores[id];
        try {
            const response = await fetch(`${RAWG_BASE_URL}/games/${id}/stores?key=${API_KEY}`);
            if (!response.ok) throw new Error("Failed to fetch game stores");
            const data = await response.json();
            cache.gameStores[id] = data.results;
            return data.results; // Returns array of { id, url, store_id, ... }
        } catch (error) {
            console.error("Error fetching game stores:", error);
            throw error;
        }
    }
};
