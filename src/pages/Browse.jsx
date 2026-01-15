import React, { useEffect, useState } from 'react';
import { Star, Plus, Play, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export default function Browse() {
    const navigate = useNavigate();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentGames, setRecentGames] = useState([]);
    const [upcomingGames, setUpcomingGames] = useState([]);
    const [topRatedGames, setTopRatedGames] = useState([]);

    // Helper to format dates YYYY-MM-DD
    const getDateString = (date) => {
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        // Fetch General Games (Trending sort)
        fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=50&ordering=-added`)
            .then(res => res.json())
            .then(data => {
                const mappedGames = data.results.map(g => ({
                    id: g.id,
                    title: g.name,
                    year: g.released ? g.released.substring(0, 4) : 'N/A',
                    rating: g.rating,
                    image: g.background_image,
                    genres: g.genres ? g.genres.map(gen => gen.name) : []
                }));
                setGames(mappedGames);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });

        // Fetch Recent Releases (Last 2 months for "New")
        const today = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(today.getMonth() - 2);
        const recentDates = `${getDateString(twoMonthsAgo)},${getDateString(today)}`;

        fetch(`https://api.rawg.io/api/games?key=${API_KEY}&dates=${recentDates}&ordering=-released&page_size=12`)
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    const mappedRecent = data.results.map(g => ({
                        id: g.id,
                        title: g.name,
                        year: g.released ? g.released.substring(0, 4) : 'N/A',
                        rating: g.rating,
                        image: g.background_image,
                        genres: g.genres ? g.genres.map(gen => gen.name) : []
                    }));
                    setRecentGames(mappedRecent);
                }
            })
            .catch(err => console.error("Error fetching recent games:", err));

        // Fetch Upcoming Releases (Next 6 months)
        const nextSixMonths = new Date();
        nextSixMonths.setMonth(today.getMonth() + 6);
        const upcomingDates = `${getDateString(today)},${getDateString(nextSixMonths)}`;

        fetch(`https://api.rawg.io/api/games?key=${API_KEY}&dates=${upcomingDates}&ordering=-added&page_size=12`)
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    const mappedUpcoming = data.results.map(g => ({
                        id: g.id,
                        title: g.name,
                        year: g.released ? g.released.substring(0, 4) : 'N/A',
                        rating: g.rating,
                        image: g.background_image,
                        genres: g.genres ? g.genres.map(gen => gen.name) : []
                    }));
                    setUpcomingGames(mappedUpcoming);
                }
            })
            .catch(err => console.error("Error fetching upcoming games:", err));

        // Fetch Top Rated (Metacritic)
        fetch(`https://api.rawg.io/api/games?key=${API_KEY}&page_size=24&ordering=-metacritic`)
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    const mappedTop = data.results.map(g => ({
                        id: g.id,
                        title: g.name,
                        year: g.released ? g.released.substring(0, 4) : 'N/A',
                        rating: g.rating,
                        image: g.background_image,
                        genres: g.genres ? g.genres.map(gen => gen.name) : []
                    }));
                    setTopRatedGames(mappedTop);
                }
            })
            .catch(err => console.error("Error fetching top rated games:", err));

    }, []);

    // Local sections
    const trending = games.slice(0, 15); // Increased slice for Trending

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '100vh' }}>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Loading news...</p>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '100px' }} className="container">

            {/* Header with Search */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Discover & News</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Latest releases, trending games, and upcoming hits.</p>
                </div>

                {/* Search Bar */}
                <button
                    onClick={() => navigate('/search')}
                    className="btn-primary"
                    style={{
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '1rem',
                        borderRadius: '50px'
                    }}
                >
                    <Search size={20} />
                    Search Games
                </button>
            </div>

            {/* Newly Released - Horizontal Scroll */}
            <section style={{ marginBottom: '4rem' }}>
                <SectionHeader title="Newly Released" />
                <div className="horizontal-scroll" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory'
                }}>
                    {recentGames.map(game => (
                        <GameCard key={`new-${game.id}`} game={game} />
                    ))}
                </div>
            </section>

            {/* Trending Section - Horizontal Scroll */}
            <section style={{ marginBottom: '4rem' }}>
                <SectionHeader title="🔥 Trending Right Now" />
                <div className="horizontal-scroll" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory'
                }}>
                    {trending.map(game => (
                        <GameCard key={game.id} game={game} size="large" />
                    ))}
                </div>
            </section>

            {/* Upcoming Section - Horizontal Scroll */}
            <section style={{ marginBottom: '4rem' }}>
                <SectionHeader title="📅 Upcoming Releases" />
                <div className="horizontal-scroll" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory'
                }}>
                    {upcomingGames.map(game => (
                        <GameCard key={`upcoming-${game.id}`} game={game} />
                    ))}
                </div>
            </section>

            {/* Top Rated - Horizontal Scroll */}
            <section>
                <SectionHeader title="Top Rated by Players" />
                <div className="horizontal-scroll" style={{
                    display: 'flex',
                    gap: '1.5rem',
                    overflowX: 'auto',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory'
                }}>
                    {topRatedGames.map(game => (
                        <GameCard key={`rated-${game.id}`} game={game} size="small" />
                    ))}
                </div>
            </section>
        </div>
    );
}

function SectionHeader({ title }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.5rem'
        }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>{title}</h2>
            <a href="#" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>View all</a>
        </div>
    );
}

function GameCard({ game, size = 'medium' }) {
    let width = '160px';
    if (size === 'large') width = '220px';
    if (size === 'small') width = '140px';

    return (
        <Link to={`/game/${game.id}`} className="game-card" style={{
            minWidth: width,
            scrollSnapAlign: 'start',
            position: 'relative',
            display: 'block',
            color: 'inherit'
        }}>
            {/* Cover Image */}
            <div style={{
                position: 'relative',
                aspectRatio: '3/4',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--bg-card)',
                marginBottom: '0.75rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
            }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                <img
                    src={game.image}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Overlay Actions */}
                <div className="card-overlay" style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <button className="icon-btn" onClick={(e) => e.preventDefault()}><Plus size={20} /></button>
                    <button className="icon-btn" onClick={(e) => e.preventDefault()}><Star size={20} /></button>
                </div>
            </div>

            {/* Info */}
            <h3 style={{
                fontSize: size === 'large' ? '1.1rem' : '0.95rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '2px'
            }}>
                {game.title}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>{game.year}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                    <Star size={12} fill="#fbbf24" /> {game.rating}
                </span>
            </div>
        </Link>
    );
}
