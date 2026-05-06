import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, Newspaper, Calendar, Trophy, Zap, Flame, Clock, Trash2, Star, Home } from 'lucide-react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { isSafeGame } from '../utils/filters';
import GameCard from '../components/GameCard';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

const GENRES = [
    { id: 'action', name: 'Action', icon: <Zap size={18} /> },
    { id: 'adventure', name: 'Adventure', icon: <Flame size={18} /> },
    { id: 'role-playing-games-rpg', name: 'RPG', icon: <Trophy size={18} /> },
    { id: 'shooter', name: 'Shooter', icon: <Zap size={18} /> },
    { id: 'strategy', name: 'Strategy', icon: <Clock size={18} /> },
    { id: 'puzzle', name: 'Puzzle', icon: <Zap size={18} /> },
    { id: 'racing', name: 'Racing', icon: <Flame size={18} /> },
    { id: 'sports', name: 'Sports', icon: <Trophy size={18} /> }
];

const formatDate = (date) => date.toISOString().split('T')[0];

const getDateRange = (filter, year) => {
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (filter) {
        case 'last30': {
            const prior = new Date(new Date().setDate(today.getDate() - 30));
            return `${formatDate(prior)},${formatDate(today)}`;
        }
        case 'thisWeek': {
            const curr = new Date();
            const day = curr.getDay() || 7; // Make Sunday 7
            const firstDate = curr.getDate() - day + 1;
            const monday = new Date(curr.setDate(firstDate));
            const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
            return `${formatDate(monday)},${formatDate(sunday)}`;
        }
        case 'nextWeek': {
            const curr = new Date();
            const day = curr.getDay() || 7;
            const firstDate = curr.getDate() - day + 1 + 7; // Next Monday
            const nextMonday = new Date(curr.setDate(firstDate));
            const nextSunday = new Date(new Date(nextMonday).setDate(nextMonday.getDate() + 6));
            return `${formatDate(nextMonday)},${formatDate(nextSunday)}`;
        }
        case 'releaseCalendar': {
            // Use selected year or default to next year
            const targetYear = year || (currentYear + 1);
            return `${targetYear}-01-01,${targetYear}-12-31`;
        }
        case 'bestYear': {
            return `${currentYear}-01-01,${currentYear}-12-31`;
        }
        default: return null;
    }
};

export default function Search() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialQuery = searchParams.get('query') || '';

    const [queryVal, setQueryVal] = useState(initialQuery);
    const [activeGenre, setActiveGenre] = useState(null);
    const [activeTimeFilter, setActiveTimeFilter] = useState(null); // 'last30', 'thisWeek', 'nextWeek', 'bestYear'
    const [releaseYear, setReleaseYear] = useState(new Date().getFullYear() + 1); // Default to next year

    const [games, setGames] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const contentRef = useRef(null);

    // Reviews View State
    const [view, setView] = useState('games');
    const [userReviews, setUserReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // Reset when search query or filters change
    useEffect(() => {
        if (view === 'games') {
            setGames([]);
            setPage(1);
            setHasMore(true);
            loadGames(1, true);
        }
    }, [searchParams, activeGenre, activeTimeFilter, releaseYear, view]);

    // Fetch Reviews when view changes to 'reviews' or auth state changes
    useEffect(() => {
        if (view === 'reviews' && auth.currentUser) {
            fetchUserReviews();
        }
    }, [view, auth.currentUser]);

    async function fetchUserReviews() {
        if (!auth.currentUser) return;
        setLoadingReviews(true);
        try {
            const q = query(collection(db, "reviews"), where("userId", "==", auth.currentUser.uid));
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserReviews(reviewsData);
        } catch (error) {
            console.error("Error fetching user reviews:", error);
        } finally {
            setLoadingReviews(false);
        }
    }

    async function handleDeleteReview(reviewId) {
        if (!window.confirm("Delete this review?")) return;
        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            setUserReviews(prev => prev.filter(r => r.id !== reviewId));
        } catch (error) {
            console.error("Delete review failed:", error);
        }
    }

    // Load more when page increases
    useEffect(() => {
        if (page > 1 && view === 'games') {
            loadGames(page, false);
        }
    }, [page, view]);

    // Infinite scroll
    useEffect(() => {
        const container = contentRef.current;
        if (!container || view !== 'games') return;

        function handleScroll() {
            const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 500;
            if (nearBottom && !loading && hasMore) {
                setPage(prev => prev + 1);
            }
        }

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, [loading, hasMore, view]);

    async function loadGames(currentPage, isNewSearch) {
        if (loading) return;
        setLoading(true);

        try {
            const searchQuery = searchParams.get('query') || '';
            let url = `/api/rawg/games?key=${API_KEY}&page=${currentPage}&page_size=20`;

            if (searchQuery) url += `&search=${searchQuery}`;

            // Genre and Time filters can be combined
            if (activeGenre) url += `&genres=${activeGenre}`;

            if (activeTimeFilter) {
                const dates = getDateRange(activeTimeFilter, releaseYear);
                if (dates) url += `&dates=${dates}`;

                // Specific sorting logic
                if (activeTimeFilter === 'bestYear') {
                    url += `&ordering=-rating`;
                } else if (activeTimeFilter === 'releaseCalendar') {
                    url += `&ordering=-added`; // Most popular/anticipated of that year
                } else {
                    url += `&ordering=-released`; // New releases: newest first
                }
            } else {
                // Default sort if no specific time filter
                if (!searchQuery) url += `&ordering=-added`; // Default trending
            }

            const res = await fetch(url);
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                setHasMore(false);
            } else {
                const mappedGames = data.results
                    .filter(isSafeGame)
                    .map(g => ({
                        id: g.id,
                        title: g.name,
                        year: g.released ? g.released.substring(0, 4) : 'N/A',
                        rating: g.rating,
                        image: g.background_image,
                        genres: g.genres || [],
                        tags: g.tags || [],
                        esrb_rating: g.esrb_rating
                    }));

                setGames(prev => isNewSearch ? mappedGames : [...prev, ...mappedGames]);
            }
        } catch (err) {
            console.error("Search fetch failed:", err);
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (e) => {
        e.preventDefault();
        setView('games');
        navigate(`/search?query=${queryVal}`);
    };

    const handleFilterClick = (filterType, id) => {
        setView('games');
        if (filterType === 'genre') {
            setActiveGenre(activeGenre === id ? null : id);
            // Optional: clear time filter if genre selected? User might want to combine.
            // Keeping them combinable is more powerful.
        } else if (filterType === 'time') {
            setActiveTimeFilter(activeTimeFilter === id ? null : id);
            // Default year logic if needed, but state handles it
        }
    };

    return (
        <div className="container" style={{
            height: 'calc(100vh - 100px)',
            marginTop: '100px',
            display: 'flex',
            gap: '40px',
            overflow: 'hidden'
        }}>

            {/* Sidebar */}
            <aside className="custom-scroll" style={{
                width: '260px',
                flexShrink: 0,
                height: '100%',
                overflowY: 'auto',
                paddingRight: '10px',
                paddingBottom: '2rem'
            }}>
                <SidebarSection title="">
                    <SidebarItem
                        icon={<Home size={22} />}
                        label="Home"
                        active={view === 'games' && !activeGenre && !activeTimeFilter}
                        onClick={() => {
                            setView('games');
                            setActiveGenre(null);
                            setActiveTimeFilter(null);
                            navigate('/search');
                        }}
                    />
                    <SidebarItem
                        icon={<Newspaper size={22} />}
                        label="Reviews"
                        active={view === 'reviews'}
                        onClick={() => setView('reviews')}
                    />
                </SidebarSection>

                <SidebarSection title="New Releases">
                    <SidebarItem
                        icon={<Star size={20} />}
                        label="Last 30 days"
                        active={activeTimeFilter === 'last30'}
                        onClick={() => handleFilterClick('time', 'last30')}
                    />
                    <SidebarItem
                        icon={<Flame size={20} />}
                        label="This week"
                        active={activeTimeFilter === 'thisWeek'}
                        onClick={() => handleFilterClick('time', 'thisWeek')}
                    />
                    <SidebarItem
                        icon={<Zap size={20} />}
                        label="Next week"
                        active={activeTimeFilter === 'nextWeek'}
                        onClick={() => handleFilterClick('time', 'nextWeek')}
                    />
                    <SidebarItem
                        icon={<Calendar size={20} />}
                        label="Release calendar"
                        active={activeTimeFilter === 'releaseCalendar'}
                        onClick={() => handleFilterClick('time', 'releaseCalendar')}
                    />

                    {/* Year Selector for Release Calendar */}
                    {activeTimeFilter === 'releaseCalendar' && (
                        <div style={{ marginLeft: '36px', marginBottom: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            {/* Generate years from currentYear - 5 to currentYear + 3 */}
                            {Array.from({ length: 9 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                <button
                                    key={year}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReleaseYear(year);
                                    }}
                                    style={{
                                        background: releaseYear === year ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: releaseYear === year ? '#fff' : 'var(--text-muted)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    )}
                </SidebarSection>

                <SidebarSection title="Top">
                    <SidebarItem
                        icon={<Trophy size={20} />}
                        label="Best of the year"
                        active={activeTimeFilter === 'bestYear'}
                        onClick={() => handleFilterClick('time', 'bestYear')}
                    />
                </SidebarSection>

                <SidebarSection title="Genres">
                    {GENRES.map(g => (
                        <SidebarItem
                            key={g.id}
                            icon={g.icon}
                            label={g.name}
                            active={view === 'games' && activeGenre === g.id}
                            onClick={() => handleFilterClick('genre', g.id)}
                        />
                    ))}
                </SidebarSection>
            </aside>

            {/* Main Content */}
            <div ref={contentRef} className="custom-scroll" style={{
                flex: 1,
                height: '100%',
                overflowY: 'auto',
                paddingBottom: '100px',
                paddingRight: '10px'
            }}>

                {view === 'games' ? (
                    <>
                        {/* Search Header */}
                        <div style={{ marginBottom: '2.5rem' }}>
                            <form onSubmit={handleSearch} style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '800px'
                            }}>
                                <SearchIcon color="var(--text-muted)" size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="Search games..."
                                    value={queryVal}
                                    onChange={e => setQueryVal(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        padding: '15px 20px 15px 50px',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        outline: 'none'
                                    }}
                                />
                            </form>
                        </div>

                        {/* Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {games.map((game, index) => (
                                <GameCard key={`${game.id}-${index}`} game={game} />
                            ))}
                        </div>

                        {/* Helper State UI */}
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            {loading && (
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                                    <Loader2 className="animate-spin" /> Loading games...
                                </div>
                            )}
                            {!loading && games.length === 0 && (
                                <p>No games found. Try a different search term or genre.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ maxWidth: '900px' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>My Reviews</h1>

                        {!auth.currentUser ? (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Please sign in to view your reviews.</p>
                            </div>
                        ) : loadingReviews ? (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto', marginBottom: '20px' }} />
                                <p>Fetching your reviews...</p>
                            </div>
                        ) : userReviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>You haven't posted any reviews yet.</p>
                                <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setView('games')}>
                                    Start Exploring
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {userReviews.map(review => (
                                    <div key={review.id} className="glass-card" style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        gap: '1.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ width: '80px', height: '110px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                                            <img src={review.gameCover} alt={review.gameTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{review.gameTitle}</h3>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={16} fill={i < review.rating ? "#fbbf24" : "none"} color={i < review.rating ? "#fbbf24" : "gray"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p style={{ color: '#e4e4e7', lineHeight: '1.6', fontSize: '1.05rem', marginBottom: '1rem' }}>{review.review}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <span>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    style={{ background: 'transparent', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                /* Hide global scrollbar for this page */
                body {
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

function SidebarSection({ title, children }) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            {title && <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '1rem', color: 'white' }}>{title}</h3>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {children}
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: active ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                fontSize: '1.05rem',
                fontWeight: active ? '600' : '400'
            }}
            onMouseEnter={e => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = 'white';
                }
            }}
            onMouseLeave={e => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                }
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                {icon}
            </span>
            {label}
        </div>
    );
}

