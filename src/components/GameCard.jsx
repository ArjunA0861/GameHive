import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, User } from 'lucide-react';
import OverlayActions from './OverlayActions';
import useGameStats from '../hooks/useGameStats';

const GameCard = React.memo(function GameCard({ game, size = 'medium', onQuickViewEnter, onQuickViewLeave }) {
    let width = '160px';
    if (size === 'large') width = '220px';
    if (size === 'small') width = '140px';

    const [isHovered, setIsHovered] = useState(false);
    const { addedCount } = useGameStats(game.id);

    // Rating Logic
    const hasRating = game.rating && game.rating >= 1;

    return (
        <div
            className="game-card"
            style={{
                minWidth: width,
                maxWidth: width,
                scrollSnapAlign: 'start',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                color: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)', // Enhanced scale
                zIndex: isHovered ? 10 : 1,
                willChange: 'transform' // Optimize animation
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Cover Image Container */}
            <div style={{
                position: 'relative',
                aspectRatio: '3/4',
                borderRadius: '16px', // Slightly rounder
                overflow: 'hidden',
                background: 'var(--bg-card)',
                marginBottom: '0.75rem',
                boxShadow: isHovered ? '0 15px 30px rgba(var(--primary-rgb), 0.3)' : '0 4px 6px rgba(0,0,0,0.3)', // Glow effect
                outline: isHovered ? '1px solid rgba(var(--primary-rgb), 0.5)' : 'none',
                transition: 'all 0.3s',
                willChange: 'transform, box-shadow' // Optimize animation
            }}>
                <Link to={`/game/${game.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                    {game.image ? (
                        <img
                            src={game.image}
                            alt={game.title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.5s ease-out',
                                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                willChange: 'transform' // Optimize animation
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                        }}>
                            No Image
                        </div>
                    )}
                </Link>

                {/* Enhanced Overlay on Hover */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 100%)',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    pointerEvents: 'none'
                }}>
                    {/* Big Rating */}
                    {hasRating && (
                        <div style={{
                            alignSelf: 'center',
                            marginBottom: 'auto',
                            marginTop: '20px',
                            transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                            transition: 'transform 0.3s',
                            textAlign: 'center'
                        }}>
                            <Star size={28} fill="#fbbf24" color="#fbbf24" style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,0.5))' }} />
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginTop: '4px' }}>{game.rating.toFixed(1)}</div>
                        </div>
                    )}

                    {/* Genres */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '12px',
                        justifyContent: 'center'
                    }}>
                        {game.genres?.slice(0, 2).map((g, i) => (
                            <span key={i} style={{
                                fontSize: '0.7rem',
                                background: 'rgba(255,255,255,0.15)',
                                color: '#e5e5e5',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                backdropFilter: 'blur(4px)',
                                fontWeight: '500'
                            }}>
                                {g}
                            </span>
                        ))}
                    </div>

                    {/* Quick View Button */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        pointerEvents: 'auto'
                    }}>
                        <button
                            onMouseEnter={() => onQuickViewEnter && onQuickViewEnter(game)}
                            onMouseLeave={() => onQuickViewLeave && onQuickViewLeave()}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                backdropFilter: 'blur(4px)',
                                transition: 'background 0.2s',
                                cursor: 'default'
                            }}
                            title="Hover for Quick View"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </div>

                {/* Top Right Actions */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s 0.1s'
                }}>
                    <OverlayActions
                        gameId={game.id}
                        gameTitle={game.title}
                        gameCover={game.image}
                    />
                </div>
            </div>

            {/* Info Section */}
            <Link to={`/game/${game.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 style={{
                    fontSize: size === 'large' ? '1.15rem' : '1rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '4px',
                    fontWeight: '700',
                    color: isHovered ? 'var(--primary)' : 'inherit',
                    transition: 'color 0.2s'
                }}>
                    {game.title}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>{game.year}</span>

                    {/* Tiny Rating */}
                    {hasRating ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontWeight: '600' }}>
                            <Star size={12} fill="#fbbf24" /> {game.rating.toFixed(1)}
                        </span>
                    ) : (
                        <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>—</span>
                    )}
                </div>
            </Link>

            {/* Social Activity Layer */}
            {addedCount > 0 && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: 0.9,
                    background: 'rgba(255,255,255,0.03)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    width: 'fit-content'
                }}>
                    <User size={12} fill="currentColor" />
                    <span>{addedCount} players added</span>
                </div>
            )}
        </div>
    );
});

export default GameCard;
