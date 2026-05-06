import React, { useEffect, useState, useCallback } from 'react';
import { rawgApi } from '../services/rawgApi';
import { isSafeGame } from '../utils/filters';
import FeaturedBanner from '../components/FeaturedBanner';
import FilterBar from '../components/FilterBar';
import GameGrid from '../components/GameGrid';
import GameCardSkeleton from '../components/skeletons/GameCardSkeleton';
import GameQuickView from '../components/GameQuickView';

export default function Browse() {
    // Data State
    const [games, setGames] = useState([]);
    const [featuredGames, setFeaturedGames] = useState([]);
    const [genres, setGenres] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);

    // UI State
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filter State
    const [filters, setFilters] = useState({
        search: '',
        genre: '',
        platform: '',
        rating: '', // > value
        year: '',
        sort: '-added' // default: popularity
    });

    // Initial Fetch (Metadata + Featured)
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Calculate past 12 months for "Trending Right Now"
                const today = new Date();
                const endDate = today.toISOString().split('T')[0];
                const startDate = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];

                const [genresData, platformsData, featuredData] = await Promise.all([
                    rawgApi.getGenres(),
                    rawgApi.getPlatforms(),
                    rawgApi.getGames({ pageSize: 5, ordering: '-added', dates: `${startDate},${endDate}` })
                ]);

                if (genresData.results) setGenres(genresData.results);
                if (platformsData.results) setPlatforms(platformsData.results);

                if (featuredData.results && featuredData.results.length > 0) {
                    // Fetch details for each featured game to get the description
                    const detailsPromises = featuredData.results.map(g => rawgApi.getGameDetails(g.id));
                    const detailsResults = await Promise.all(detailsPromises);
                    setFeaturedGames(detailsResults);
                }
            } catch (err) {
                console.error("Failed to fetch metadata:", err);
            }
        };

        fetchMetadata();
    }, []);

    // Main Game Fetch (Resets list on filter change)
    useEffect(() => {
        setPage(1);
        fetchGames(1, true);
    }, [filters]);

    // Fetch Games Helper
    const fetchGames = async (pageNum, reset = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const data = await rawgApi.getGames({
                page: pageNum,
                pageSize: 20,
                search: filters.search,
                genres: filters.genre,
                parent_platforms: filters.platform,
                ordering: filters.sort,
                metacritic: filters.rating ? `${filters.rating},100` : ''
            });

            const mappedGames = data.results
                .filter(isSafeGame)
                .map(g => ({
                    id: g.id,
                    title: g.name,
                    name: g.name,
                    year: g.released ? g.released.substring(0, 4) : 'N/A',
                    released: g.released,
                    rating: g.rating,
                    image: g.background_image,
                    background_image: g.background_image,
                    genres: g.genres ? g.genres.map(gen => gen.name) : [],
                    parent_platforms: g.parent_platforms,
                    playtime: g.playtime
                }));

            if (reset) {
                setGames(mappedGames);
            } else {
                setGames(prev => [...prev, ...mappedGames]);
            }

            setHasMore(!!data.next);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Handlers
    const handleFilterChange = (key, value) => {
        if (key === 'clear') {
            setFilters({
                search: '',
                genre: '',
                platform: '',
                rating: '',
                year: '',
                sort: '-added'
            });
        } else {
            setFilters(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSearch = (term) => {
        setFilters(prev => ({ ...prev, search: term }));
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGames(nextPage, false);
    };

    const handleQuickViewEnter = useCallback((game) => {
        if (window.qvTimeout) clearTimeout(window.qvTimeout);
        setSelectedGame(game);
    }, []);

    const handleQuickViewLeave = useCallback(() => {
        window.qvTimeout = setTimeout(() => {
            setSelectedGame(null);
        }, 300);
    }, []);

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-main)' }} className="container">

            {/* Featured Banner */}
            {featuredGames.length > 0 && <FeaturedBanner games={featuredGames} />}

            {/* Main Content Area */}
            <div style={{ position: 'relative' }}>

                {/* Header */}
                <div style={{ marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Discover Games</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Explore the vast collection of games based on your preferences.</p>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    genres={genres}
                    platforms={platforms}
                    initialFilters={filters}
                />

                {/* Error Banner */}
                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '2rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        color: '#ef4444'
                    }}>
                        Error: {error}
                    </div>
                )}

                {/* Game Grid / List */}
                <div style={{ minHeight: '400px' }}>
                    {loading && games.length === 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '2rem 1.5rem',
                            justifyItems: 'center'
                        }}>
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="skeleton-wrapper">
                                    <GameCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : games.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                            No games found matching your filters.
                        </div>
                    ) : (
                        <GameGrid
                            games={games}
                            loading={loadingMore}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            onLoadMore={handleLoadMore}
                            hasMore={hasMore}
                            onQuickViewEnter={handleQuickViewEnter}
                            onQuickViewLeave={handleQuickViewLeave}
                        />
                    )}
                </div>

            </div>

            {/* Quick View Hover Panel */}
            <GameQuickView
                game={selectedGame}
                onMouseEnter={() => {
                    if (window.qvTimeout) {
                        clearTimeout(window.qvTimeout);
                        window.qvTimeout = null;
                    }
                }}
                onMouseLeave={() => {
                    window.qvTimeout = setTimeout(() => {
                        setSelectedGame(null);
                    }, 300);
                }}
            />
        </div>
    );
}
