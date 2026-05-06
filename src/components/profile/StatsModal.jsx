import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

export default function StatsModal({
    activeStatView,
    setActiveStatView,
    modalLoading,
    modalData,
    panelStyle
}) {
    if (!activeStatView) return null;

    return (
        <div style={{ ...panelStyle, marginTop: '20px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: 0, textTransform: 'capitalize' }}>{activeStatView} Details</h3>
                <button 
                    onClick={() => setActiveStatView(null)} 
                    style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
                >
                    <X size={16} />
                </button>
            </div>
            
            {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#71717a' }}>Loading...</div>
            ) : modalData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#71717a' }}>No {activeStatView} found.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {modalData.map(user => (
                        <Link 
                            key={user.uid} 
                            to={`/profile/${user.uid}`} 
                            onClick={() => setActiveStatView(null)} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                textDecoration: 'none', 
                                color: 'inherit', 
                                background: 'rgba(255,255,255,0.03)', 
                                padding: '12px', 
                                borderRadius: '12px', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                transition: 'all 0.2s' 
                            }} 
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }} 
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#71717a' }}>
                                    {(user.name || user.displayName || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{user.name || user.displayName || 'Anonymous'}</div>
                                <div style={{ fontSize: '0.8rem', color: '#71717a' }}>{user.zone || 'Earth'}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
