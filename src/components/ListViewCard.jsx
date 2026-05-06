import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, Monitor } from 'lucide-react';
import OverlayActions from './OverlayActions';
import useGameStats from '../hooks/useGameStats';

const ListViewCard = React.memo(function ListViewCard({ game, onQuickViewEnter, onQuickViewLeave }) {
    const { addedCount } = useGameStats(game.id);

    // Platform icons helper (simple version)
    const getPlatformIcon = (slug) => {
        if (slug?.includes('pc') || slug?.includes('windows')) return '💻';
        if (slug?.includes('playstation')) return '🎮';
        if (slug?.includes('xbox')) return '❎';
        if (slug?.includes('nintendo') || slug?.includes('switch')) return '🔴';
        return '👾';
    };

    return (
        <div className="list-view-card" style={{
            display: 'flex',
            gap: '1.5rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'transform 0.2s, background 0.2s',
            position: 'relative'
        }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
        >
            {/* Image */}
            <div style={{
                flex: '0 0 160px',
                aspectRatio: '16/9', // Landscape for List View
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <Link to={`/game/${game.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    {game.background_image ? (
                        <img
                            src={game.background_image}
                            alt={game.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: '#333' }} />
                    )}
                </Link>

                {/* Overlay Actions on Image */}
                <div className="list-card-overlay" style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    gap: '10px'
                }}>
                    <button
                        onMouseEnter={() => onQuickViewEnter && onQuickViewEnter(game)}
                        onMouseLeave={() => onQuickViewLeave && onQuickViewLeave()}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            backdropFilter: 'blur(4px)',
                            cursor: 'default',
                            transition: 'background 0.2s'
                        }}
                        title="Hover for Quick View"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <OverlayActions gameId={game.id} gameTitle={game.title} gameCover={game.background_image} />
                </div>
                <style>{`
            .list-view-card:hover .list-card-overlay {
                opacity: 1 !important;
            }
         `}</style>
            </div>

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Link to={`/game/${game.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', fontWeight: '700' }}>{game.name}</h3>
                    </Link>

                    {/* Rating */}
                    {game.rating >= 1 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: '600' }}>
                            <Star size={18} fill="#fbbf24" />
                            <span>{game.rating.toFixed(1)}</span>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> {game.released ? game.released.substring(0, 4) : 'N/A'}
                    </span>
                    {game.genres && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {game.genres.slice(0, 3).map(g => g.name).join(', ')}
                        </span>
                    )}
                </div>

                {/* Interactive / Social Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                    {/* Platforms */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {game.parent_platforms?.map(p => (
                            <span key={p.platform.id} title={p.platform.name} style={{ fontSize: '1.2rem', opacity: 0.7 }}>
                                {getPlatformIcon(p.platform.slug)}
                            </span>
                        ))}
                    </div>

                    {/* Social/Stats */}
                    {addedCount > 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {addedCount} players added
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
});

export default ListViewCard;
