import React from 'react';
import { FileText, Users, Gamepad2, Zap, Trophy, MapPin } from 'lucide-react';

export default function OnlineStats({
    panelStyle,
    reviews,
    followersCount,
    followingCount,
    library,
    userData,
    activeStatView,
    handleOpenStatsModal,
    rankColor,
    rankTitle
}) {
    const steamGames = library.filter(g => g.source === 'steam');
    const totalPlaytime = steamGames.reduce((acc, current) => acc + (current.playtime || 0), 0);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={panelStyle}>
                <h3 style={{ fontSize: '1.2rem', color: '#7c3aed', margin: '0 0 20px 0' }}>Online Stats</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Reviews Stat */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px 12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Reviews</span>
                        <span style={{ color: '#a1a1aa' }}>{reviews.length}</span>
                    </div>

                    {/* Followers Stat */}
                    <div 
                        onClick={() => handleOpenStatsModal('followers')} 
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            fontSize: '0.9rem', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s', 
                            background: activeStatView === 'followers' ? 'rgba(124,58,237,0.1)' : 'transparent', 
                            border: activeStatView === 'followers' ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent' 
                        }} 
                        onMouseEnter={e => { if (activeStatView !== 'followers') e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} 
                        onMouseLeave={e => { if (activeStatView !== 'followers') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Followers</span>
                        <span style={{ color: activeStatView === 'followers' ? '#c084fc' : '#a1a1aa' }}>{followersCount}</span>
                    </div>

                    {/* Following Stat */}
                    <div 
                        onClick={() => handleOpenStatsModal('following')} 
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            fontSize: '0.9rem', 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s', 
                            background: activeStatView === 'following' ? 'rgba(124,58,237,0.1)' : 'transparent', 
                            border: activeStatView === 'following' ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent' 
                        }} 
                        onMouseEnter={e => { if (activeStatView !== 'following') e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }} 
                        onMouseLeave={e => { if (activeStatView !== 'following') e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Following</span>
                        <span style={{ color: activeStatView === 'following' ? '#c084fc' : '#a1a1aa' }}>{followingCount}</span>
                    </div>

                    {/* Steam Stats */}
                    {userData?.steamConnected && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px 12px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Gamepad2 size={16} /> Steam Games</span>
                                <span style={{ color: '#a1a1aa' }}>{steamGames.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px 12px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16} /> Total Playtime</span>
                                <span style={{ color: '#a1a1aa' }}>{totalPlaytime}h</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Info Section */}
            <div style={panelStyle}>
                <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: '0 0 15px 0' }}>Quick Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trophy size={14} color={rankColor} /> 
                        <span>Rank: <span style={{ color: rankColor, fontWeight: 'bold' }}>{rankTitle}</span></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} /> 
                        <span>Zone: {userData?.zone || "Earth, Milky Way"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
