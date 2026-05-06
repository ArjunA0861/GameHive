import React from 'react';

export default function LibrarySection({
    panelStyle,
    library,
    libraryFilter,
    setLibraryFilter,
    handleLibraryGameClick
}) {
    const nonSteamGames = library.filter(g => g.source !== 'steam');

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: 0 }}>Library</h3>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>{nonSteamGames.length} games</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                {['All', 'Playing', 'Completed', 'Wishlist'].map(filter => (
                    <button 
                        key={filter} 
                        onClick={() => setLibraryFilter(filter)} 
                        style={{ 
                            background: libraryFilter === filter ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', 
                            color: libraryFilter === filter ? '#c084fc' : '#a1a1aa', 
                            border: libraryFilter === filter ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.1)', 
                            padding: '4px 12px', 
                            borderRadius: '16px', 
                            fontSize: '0.75rem', 
                            fontWeight: '500', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s' 
                        }}
                    >
                        {filter}
                    </button>
                ))}
            </div>
            {nonSteamGames.length === 0 ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '40px 20px', color: '#71717a', fontSize: '0.9rem' }}>No games added to library yet</div>
            ) : (
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.5) transparent' }}>
                    {library.filter(game => {
                        if (game.source === 'steam') return false;
                        if (libraryFilter === 'All') return true;
                        return game.status === libraryFilter;
                    }).map((game) => (
                        <div 
                            key={game.id} 
                            onClick={(e) => handleLibraryGameClick(e, game)}
                            style={{ 
                                textDecoration: 'none', 
                                color: 'inherit', 
                                minWidth: '150px', 
                                maxWidth: '150px', 
                                flexShrink: 0, 
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <div 
                                style={{ 
                                    position: 'relative', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden', 
                                    transition: 'all 0.2s', 
                                    cursor: 'pointer', 
                                    border: '1px solid rgba(255,255,255,0.1)' 
                                }} 
                                onMouseEnter={e => { 
                                    e.currentTarget.style.transform = 'translateY(-4px)'; 
                                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(124,58,237,0.3)'; 
                                }} 
                                onMouseLeave={e => { 
                                    e.currentTarget.style.transform = 'translateY(0)'; 
                                    e.currentTarget.style.boxShadow = 'none'; 
                                }}
                            >
                                <img src={game.gameCover || game.gameImage || 'https://via.placeholder.com/300x400/1a1a1a/7c3aed?text=No+Image'} alt={game.gameTitle} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                                {game.status && <div style={{ position: 'absolute', top: '8px', right: '8px', background: game.status === 'Playing' ? 'rgba(34,197,94,0.9)' : game.status === 'Completed' ? 'rgba(168,85,247,0.9)' : 'rgba(59,130,246,0.9)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '600' }}>{game.status}</div>}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)', padding: '40px 10px 10px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.gameTitle}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
