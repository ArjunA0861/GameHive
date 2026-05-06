import React, { useRef, useCallback } from 'react';
import GameCard from './GameCard';
import ListViewCard from './ListViewCard';
import { LayoutGrid, List } from 'lucide-react';

export default function GameGrid({
    games,
    loading,
    viewMode, // 'grid' or 'list'
    onViewModeChange,
    onLoadMore,
    hasMore,
    onQuickViewEnter,
    onQuickViewLeave
}) {

    const observer = useRef();
    const lastGameElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, onLoadMore]);

    return (
        <div style={{ width: '100%' }}>

            {/* View Toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '1.5rem',
                gap: '10px'
            }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: 'auto' }}>
                    {games.length} results found
                </span>

                <button
                    onClick={() => onViewModeChange('grid')}
                    style={{
                        background: viewMode === 'grid' ? '#fff' : 'rgba(255,255,255,0.1)',
                        color: viewMode === 'grid' ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="Grid View"
                >
                    <LayoutGrid size={20} />
                </button>

                <button
                    onClick={() => onViewModeChange('list')}
                    style={{
                        background: viewMode === 'list' ? '#fff' : 'rgba(255,255,255,0.1)',
                        color: viewMode === 'list' ? '#000' : '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                    title="List View"
                >
                    <List size={20} />
                </button>
            </div>

            {/* Grid Content */}
            {viewMode === 'grid' ? (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '2rem 1.5rem',
                    justifyItems: 'center'
                }}>
                    {games.map((game, i) => {
                        if (games.length === i + 1) {
                            return (
                                <div ref={lastGameElementRef} key={`${game.id}-${i}`}>
                                    <GameCard game={game} onQuickViewEnter={onQuickViewEnter} onQuickViewLeave={onQuickViewLeave} />
                                </div>
                            );
                        } else {
                            return <GameCard key={`${game.id}-${i}`} game={game} onQuickViewEnter={onQuickViewEnter} onQuickViewLeave={onQuickViewLeave} />;
                        }
                    })}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {games.map((game, i) => {
                        if (games.length === i + 1) {
                            return (
                                <div ref={lastGameElementRef} key={`${game.id}-${i}`}>
                                    <ListViewCard game={game} onQuickViewEnter={onQuickViewEnter} onQuickViewLeave={onQuickViewLeave} />
                                </div>
                            );
                        } else {
                            return <ListViewCard key={`${game.id}-${i}`} game={game} onQuickViewEnter={onQuickViewEnter} onQuickViewLeave={onQuickViewLeave} />;
                        }
                    })}
                </div>
            )}

            {/* Loading Indicator for Infinite Scroll */}
            <div style={{ marginTop: '2rem', textAlign: 'center', minHeight: '50px' }}>
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Loading more...
                    </div>
                )}
                {!hasMore && games.length > 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You've reached the end!</div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

        </div>
    );
}
