import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function SteamCollection({
    library,
    handleLibraryGameClick,
    panelStyle
}) {
    const steamGames = library.filter(game => game.source === 'steam');

    if (steamGames.length === 0) return null;

    return (
        <div style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(23, 26, 33, 0.9) 0%, rgba(42, 71, 94, 0.8) 100%)', border: '1px solid rgba(102, 192, 232, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#171a21', padding: '6px', borderRadius: '6px' }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm0 18.25c-3.452 0-6.25-2.798-6.25-6.25s2.798-6.25 6.25-6.25 6.25 2.798 6.25 6.25-2.798 6.25-6.25 6.25zm.022-10.47c-2.32 0-4.2 1.88-4.2 4.2s1.88 4.2 4.2 4.2 4.2-1.88 4.2-4.2-1.88-4.2-4.2-4.2zm0 2.1c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1-2.1-.94-2.1-2.1.94-2.1 2.1-2.1z"/>
                        </svg>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#66c0f4', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Steam Collection</h3>
                </div>
                <span style={{ fontSize: '0.8rem', color: '#c7d5e0', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>{steamGames.length} Games</span>
            </div>
            
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin', scrollbarColor: '#66c0f4 transparent' }}>
                {steamGames.map((game) => (
                    <div 
                        key={game.id} 
                        onClick={(e) => handleLibraryGameClick(e, game)}
                        style={{ 
                            minWidth: '180px', 
                            maxWidth: '180px', 
                            flexShrink: 0, 
                            cursor: 'pointer',
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#1b2838',
                            border: '1px solid rgba(102, 192, 232, 0.1)',
                            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={e => { 
                            e.currentTarget.style.transform = 'scale(1.05)'; 
                            e.currentTarget.style.borderColor = 'rgba(102, 192, 232, 0.5)';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(102, 192, 232, 0.2)';
                        }} 
                        onMouseLeave={e => { 
                            e.currentTarget.style.transform = 'scale(1)'; 
                            e.currentTarget.style.borderColor = 'rgba(102, 192, 232, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{ position: 'relative', height: '110px' }}>
                            <img 
                                src={game.gameCover || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`} 
                                alt={game.gameTitle} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #1b2838 0%, transparent 40%)' }} />
                        </div>
                        <div style={{ padding: '10px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#c7d5e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                                {game.gameTitle}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#66c0f4', fontSize: '0.75rem' }}>
                                <RefreshCw size={10} />
                                <span>{game.playtime || 0} hrs on record</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
