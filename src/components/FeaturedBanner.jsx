import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Info, PlusCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function FeaturedBanner({ games = [] }) {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [inLibrary, setInLibrary] = useState(false);
    const [loadingLibrary, setLoadingLibrary] = useState(false);

    // Auto-play
    useEffect(() => {
        if (games.length <= 1) return;
        const interval = setInterval(() => {
            handleNext();
        }, 8000); // 8 seconds per slide
        return () => clearInterval(interval);
    }, [currentIndex, games.length]);

    const handleNext = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % games.length);
            setIsAnimating(false);
        }, 300); // Wait for fade out
    };

    const handlePrev = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + games.length) % games.length);
            setIsAnimating(false);
        }, 300);
    };

    const game = games[currentIndex];

    // Check library status for current game
    useEffect(() => {
        const checkLibrary = async () => {
            if (!auth.currentUser || !game) {
                setInLibrary(false);
                return;
            }
            try {
                const libQ = query(
                    collection(db, "library"),
                    where("userId", "==", auth.currentUser.uid),
                    where("gameId", "==", Number(game.id))
                );
                const libSnap = await getDocs(libQ);
                setInLibrary(!libSnap.empty);
            } catch (err) {
                console.error("Error checking banner library status:", err);
            }
        };
        checkLibrary();
    }, [game, auth.currentUser]);

    const toggleLibrary = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!auth.currentUser) return alert("Please sign in");
        if (loadingLibrary) return;

        setLoadingLibrary(true);
        try {
            if (inLibrary) {
                const q = query(
                    collection(db, "library"),
                    where("userId", "==", auth.currentUser.uid),
                    where("gameId", "==", Number(game.id))
                );
                const snap = await getDocs(q);
                snap.forEach(async (d) => await deleteDoc(doc(db, "library", d.id)));
                setInLibrary(false);
            } else {
                await addDoc(collection(db, "library"), {
                    userId: auth.currentUser.uid,
                    gameId: Number(game.id),
                    gameTitle: game.name || 'Unknown Game',
                    gameCover: game.background_image || 'https://via.placeholder.com/300x400?text=No+Image',
                    status: 'Playing',
                    addedAt: Timestamp.now()
                });
                setInLibrary(true);
            }
        } catch (err) {
            console.error("Library sync failed:", err);
            alert("Failed to update library: " + err.message);
        } finally {
            setLoadingLibrary(false);
        }
    };

    // Parallax Effect
    const [offset, setOffset] = useState(0);
    useEffect(() => {
        const handleScroll = () => setOffset(window.scrollY * 0.4);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Format Genres
    const genreText = game.genres?.map(g => g.name).slice(0, 3).join(' • ');

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: '600px', // Increased height for cinematic feel
            marginBottom: '3rem',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            marginTop: '20px',
            transform: 'translateZ(0)' // Hardware acceleration
        }}>
            {/* Background Image with Parallax */}
            <div
                key={`bg-${game.id}`}
                style={{
                    position: 'absolute',
                    top: -50, // Buffer for parallax
                    left: 0,
                    right: 0,
                    bottom: -50,
                    backgroundImage: `url(${game.background_image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translateY(${offset}px) scale(1.1)`,
                    transition: 'opacity 0.8s ease-in-out', // Smoother transition
                    opacity: isAnimating ? 0.2 : 1,
                    filter: 'brightness(0.7)'
                }} />

            {/* Cinematic Gradient Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.1) 100%)',
                zIndex: 1
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '4rem 5rem', // More padding
                maxWidth: '850px',
                opacity: isAnimating ? 0 : 1,
                transition: 'opacity 0.4s ease-out',
                transform: isAnimating ? 'translateY(20px)' : 'translateY(0)'
            }}>
                {/* Metadata Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '1rem',
                    color: '#fbbf24',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {game.rating > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={18} fill="#fbbf24" />
                            <span>{game.rating}</span>
                        </div>
                    )}
                    {game.released && (
                        <>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                            <span style={{ color: '#e5e5e5' }}>{game.released.substring(0, 4)}</span>
                        </>
                    )}
                    {genreText && (
                        <>
                            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                            <span style={{ color: '#e5e5e5' }}>{genreText}</span>
                        </>
                    )}
                </div>

                <h1 style={{
                    fontSize: '4.5rem', // Larger title
                    fontWeight: '900',
                    lineHeight: '1',
                    marginBottom: '1.5rem',
                    textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                    color: '#fff',
                    letterSpacing: '-2px',
                    maxWidth: '100%'
                }}>
                    {game.name}
                </h1>

                {/* Short Description */}
                <p style={{
                    fontSize: '1.2rem',
                    lineHeight: '1.6',
                    color: '#d4d4d4',
                    marginBottom: '2rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    maxWidth: '650px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                    {game.description_raw ? game.description_raw : "Join the adventure in this highly acclaimed title. Experience immersive gameplay and stunning visuals."}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => navigate(`/game/${game.id}`)}
                        className="btn-primary"
                        style={{
                            padding: '14px 32px',
                            fontSize: '1.05rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)'
                        }}
                    >
                        <Info size={20} /> View Details
                    </button>

                    <button
                        onClick={toggleLibrary}
                        disabled={loadingLibrary}
                        style={{
                            background: inLibrary ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '14px 32px',
                            fontSize: '1.05rem',
                            borderRadius: '8px',
                            cursor: loadingLibrary ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.2s',
                            opacity: loadingLibrary ? 0.7 : 1
                        }}
                        onMouseOver={e => {
                            if (!inLibrary && !loadingLibrary) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseOut={e => {
                            if (!inLibrary && !loadingLibrary) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {inLibrary ? <><Check size={20} /> In Library</> : <><PlusCircle size={20} /> Add to Library</>}
                    </button>
                </div>
            </div>

            {/* Navigation Arrows */}
            {games.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={handleNext}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Pagination Dots */}
                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        right: '40px',
                        display: 'flex',
                        gap: '8px',
                        zIndex: 10
                    }}>
                        {games.map((_, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    if (isAnimating) return;
                                    setCurrentIndex(idx);
                                }}
                                style={{
                                    width: idx === currentIndex ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: idx === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </>
            )}

        </div>
    );
}
