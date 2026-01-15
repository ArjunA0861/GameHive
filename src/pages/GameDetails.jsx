import { useParams, Link } from 'react-router-dom';
import { Star, Plus, Pencil, Play, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export default function GameDetails() {
    const { id } = useParams();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`https://api.rawg.io/api/games/${id}?key=${API_KEY}`)
            .then(res => res.json())
            .then(data => {
                setGame({
                    id: data.id,
                    title: data.name,
                    year: data.released ? data.released.substring(0, 4) : 'N/A',
                    rating: data.rating,
                    image: data.background_image,
                    genres: data.genres ? data.genres.map(g => g.name) : [],
                    description: data.description_raw || data.description,
                    platforms: data.platforms ? data.platforms.map(p => p.platform.name) : []
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h1>Loading details...</h1>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                <h1>Game not found</h1>
                <Link to="/browse" className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
                    Back to Browse
                </Link>
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '80px', paddingBottom: '100px', position: 'relative' }}>

            <Link to="/browse" style={{
                position: 'absolute',
                top: '100px',
                left: '40px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none',
                fontWeight: 500,
                cursor: 'pointer'
            }}>
                <ArrowLeft size={20} /> Back
            </Link>

            {/* Banner / Cover */}
            <div style={{
                height: '400px',
                position: 'relative',
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}>
                <img
                    src={game.image}
                    alt={game.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                />
            </div>

            <div className="container" style={{ marginTop: '-150px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>

                    {/* Poster Card */}
                    <div className="glass-card" style={{
                        width: '250px',
                        height: '350px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <img
                            src={game.image}
                            alt={game.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, paddingTop: '50px' }}>


                        <h1 style={{ fontSize: '3.5rem', lineHeight: '1', marginBottom: '0.5rem' }}>{game.title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
                            <span>{game.year}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24' }}>
                                <Star fill="#fbbf24" size={20} /> {game.rating}
                            </span>
                            <span>{game.genres.join(', ')}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                            <ActionButton icon={<Star size={20} />} label="Rate" />
                            <ActionButton icon={<Pencil size={20} />} label="Review" />
                            <ActionButton icon={<Plus size={20} />} label="Add to Library" active />
                        </div>

                        <div className="glass-card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Synposis</h3>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
                                {game.description}
                            </p>
                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ color: 'var(--text-muted)', marginRight: '1rem' }}>Platforms:</span>
                                {game.platforms.map(p => (
                                    <span key={p} style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        marginRight: '8px',
                                        fontSize: '0.9rem'
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    );
}

function ActionButton({ icon, label, active }) {
    return (
        <button style={{
            background: active ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            color: active ? 'white' : 'var(--text-main)',
            border: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            transition: '0.2s'
        }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
            {icon} {label}
        </button>
    );
}
