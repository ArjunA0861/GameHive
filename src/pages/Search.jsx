import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Star, Plus, Filter, Loader2 } from 'lucide-react';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const GENRES = [
    { id: 'action', name: 'Action' },
    { id: 'adventure', name: 'Adventure' },
    { id: 'role-playing-games-rpg', name: 'RPG' },
    { id: 'shooter', name: 'Shooter' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'puzzle', name: 'Puzzle' },
    { id: 'racing', name: 'Racing' },
    { id: 'sports', name: 'Sports' }
];

export default function Search() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialQuery = searchParams.get('query') || '';

    const [query, setQuery] = useState(initialQuery);
    const [activeGenre, setActiveGenre] = useState(null);
    const [games, setGames] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Reset when search query or genre changes
    useEffect(() => {
        setGames([]);
        setPage(1);
        setHasMore(true);
        loadGames(1, true);
    }, [searchParams, activeGenre]);

    // Load more when page increases
    useEffect(() => {
        if (page > 1) {
            loadGames(page, false);
        }
    }, [page]);

    // Infinite scroll
    useEffect(() => {
        function handleScroll() {
            const nearBottom =
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 500;

            if (nearBottom && !loading && hasMore) {
                setPage(prev => prev + 1);
            }
        }

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore]);

    async function loadGames(currentPage, isNewSearch) {
        if (loading) return;
        setLoading(true);

        try {
            const searchQuery = searchParams.get('query') || '';
            let url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${currentPage}&page_size=12`;

            if (searchQuery) url += `&search=${searchQuery}`;
            if (activeGenre) url += `&genres=${activeGenre}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.results.length === 0) {
                setHasMore(false);
            } else {
                const mappedGames = data.results.map(g => ({
                    id: g.id,
                    title: g.name,
                    year: g.released ? g.released.substring(0, 4) : 'N/A',
                    rating: g.rating,
                    image: g.background_image,
                }));

                setGames(prev => isNewSearch ? mappedGames : [...prev, ...mappedGames]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/search?query=${query}`);
    };

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>

            {/* Search Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Search Games</h1>

                <form onSubmit={handleSearch} style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '600px',
                    marginBottom: '2rem'
                }}>
                    <SearchIcon color="var(--text-muted)" size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search for games..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '50px',
                            padding: '15px 20px 15px 50px',
                            color: 'white',
                            fontSize: '1.1rem',
                            outline: 'none'
                        }}
                    />
                </form>

                {/* Genres */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginRight: '10px' }}>
                        <Filter size={18} /> Filters:
                    </div>
                    {GENRES.map(g => (
                        <button
                            key={g.id}
                            onClick={() => setActiveGenre(activeGenre === g.id ? null : g.id)}
                            style={{
                                background: activeGenre === g.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: activeGenre === g.id ? 'white' : 'var(--text-muted)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '2rem'
            }}>
                {games.map((game, index) => (
                    <SearchGameCard key={`${game.id}-${index}`} game={game} />
                ))}
            </div>

            {/* Helper State UI */}
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <Loader2 className="animate-spin" /> Loading more games...
                    </div>
                )}
                {!loading && games.length === 0 && (
                    <p>No games found. Try a different search term or genre.</p>
                )}
                {!loading && !hasMore && games.length > 0 && (
                    <p>You've reached the end of the list.</p>
                )}
            </div>

            {/* CSS Animation for Spinner */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

function SearchGameCard({ game }) {
    return (
        <Link to={`/game/${game.id}`} className="game-card" style={{
            display: 'block',
            color: 'inherit',
            textDecoration: 'none'
        }}>
            <div style={{
                position: 'relative',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                marginBottom: '1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
            }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {game.image ? (
                    <img
                        src={game.image}
                        alt={game.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                        No Image
                    </div>
                )}
            </div>
            <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                {game.title}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>{game.year}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                    <Star size={14} fill="#fbbf24" /> {game.rating}
                </span>
            </div>
        </Link>
    );
}
