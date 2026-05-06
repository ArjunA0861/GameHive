import React from 'react';
import { X } from 'lucide-react';

export default function EditProfileModal({
    isEditingProfile,
    setIsEditingProfile,
    editName,
    setEditName,
    editStatus,
    setEditStatus,
    editQuote,
    setEditQuote,
    editZone,
    setEditZone,
    editFavoriteGame,
    setEditFavoriteGame,
    gameSearchQuery,
    setGameSearchQuery,
    gameSearchResults,
    setGameSearchResults,
    searchGames,
    saveProfileChanges
}) {
    if (!isEditingProfile) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '90%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                <button 
                    onClick={() => setIsEditingProfile(false)} 
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>
                <h2 style={{ margin: '0 0 25px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Profile</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Name */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Display Name</label>
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: '4px', color: 'white' }} />
                    </div>
                    {/* Status */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Status</label>
                        <input type="text" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: '4px', color: 'white' }} />
                    </div>
                    {/* Bio / Quote */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Bio / Quote</label>
                        <textarea value={editQuote} onChange={(e) => setEditQuote(e.target.value)} rows={2} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: '4px', color: 'white', resize: 'vertical' }}></textarea>
                    </div>
                    {/* Zone */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Zone</label>
                        <select value={editZone} onChange={(e) => setEditZone(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: '4px', color: 'white' }}>
                            <option value="EU-West">EU-West</option>
                            <option value="EU-East">EU-East</option>
                            <option value="NA-West">NA-West</option>
                            <option value="NA-East">NA-East</option>
                            <option value="Asia">Asia</option>
                            <option value="Oceania">Oceania</option>
                            <option value="Earth">Earth</option>
                        </select>
                    </div>
                    {/* Favorite Game */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '8px' }}>Favorite Game</label>
                        {editFavoriteGame ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px' }}>
                                {editFavoriteGame.background_image && <img src={editFavoriteGame.background_image} alt="" style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
                                <div style={{ flex: 1, fontSize: '0.9rem' }}>{editFavoriteGame.name}</div>
                                <button onClick={() => setEditFavoriteGame(null)} style={{ color: '#ef4444', background: 'transparent' }}>Remove</button>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" value={gameSearchQuery} onChange={(e) => setGameSearchQuery(e.target.value)} placeholder="Search..." style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #3f3f46', borderRadius: '4px', color: 'white' }} />
                                    <button onClick={searchGames} style={{ background: 'var(--primary)', color: 'white', padding: '0 15px', borderRadius: '4px' }}>Find</button>
                                </div>
                                {gameSearchResults.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#18181b', border: '1px solid #3f3f46', borderRadius: '4px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
                                        {gameSearchResults.map(game => (
                                            <div 
                                                key={game.id} 
                                                onClick={() => { 
                                                    setEditFavoriteGame(game); 
                                                    setGameSearchResults([]); 
                                                    setGameSearchQuery(""); 
                                                }} 
                                                style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                {game.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={saveProfileChanges} style={{ marginTop: '10px', padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
                </div>
            </div>
        </div>
    );
}
