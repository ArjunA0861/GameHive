import React from 'react';
import { Camera, Edit2, MapPin, Star, RefreshCw, ExternalLink } from 'lucide-react';

export default function ProfileHeader({
    userData,
    isOwnProfile,
    isFollowing,
    unfollowUser,
    followUser,
    setIsEditingProfile,
    uploading,
    handleImageSelected,
    syncSteamLibrary,
    isSyncing,
    initiateSteamLogin,
    level,
    rankColor,
    rankTitle,
    progressToNextRank,
    nextRankLevel,
    headerPanelStyle
}) {
    return (
        <div style={{ ...headerPanelStyle, marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                    {userData?.photoURL ? (
                        <img
                            src={userData.photoURL}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', background: '#27272a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#71717a' }}>
                            {userData?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                    {isOwnProfile && (
                        <label htmlFor="profile-upload" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', opacity: 0, transition: 'opacity 0.2s' }} className="avatar-overlay" onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0}>
                            <Camera size={24} color="white" />
                            <input type="file" id="profile-upload" style={{ display: 'none' }} accept="image/*" onChange={handleImageSelected} disabled={uploading} />
                        </label>
                    )}
                </div>

                <div style={{ paddingTop: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '600', letterSpacing: '0.5px' }}>{userData?.name || 'User'}</h1>
                        {!isOwnProfile && (
                            <button onClick={isFollowing ? unfollowUser : followUser} style={{ background: isFollowing ? 'transparent' : 'var(--primary)', border: isFollowing ? '1px solid #52525b' : 'none', padding: '4px 12px', borderRadius: '4px', color: 'white', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '10px' }}>
                                {isFollowing ? 'Unfollow' : 'Follow'}
                            </button>
                        )}
                        {isOwnProfile && (
                            <button onClick={() => setIsEditingProfile(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', marginLeft: '10px' }}>
                                <Edit2 size={12} /> <span>Edit Profile</span>
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a1a1aa', fontSize: '0.9rem' }}>
                        <MapPin size={14} /> <span>{userData?.zone || "Earth, Milky Way"}</span>
                    </div>
                    <div style={{ marginTop: '20px', fontStyle: 'italic', color: '#d4d4d8', fontFamily: 'serif', fontSize: '1.1rem' }}>
                        "{userData?.quote || "How could I have lived without that smile."}"
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Steam Connection Status */}
                {isOwnProfile && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', minWidth: '180px' }}>
                        {userData?.steamConnected ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={userData.steamProfile?.avatar || "https://community.cloudflare.steamstatic.com/public/images/avatars/default.jpg"} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                                    <span style={{ fontSize: '0.85rem', color: '#e4e4e7', fontWeight: 'bold' }}>{userData.steamProfile?.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => syncSteamLibrary(userData.steamId)} 
                                        disabled={isSyncing}
                                        style={{ background: 'rgba(124,58,237,0.2)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#c084fc', fontSize: '0.7rem', cursor: isSyncing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'Syncing...' : 'Sync Library'}
                                    </button>
                                    <a href={userData.steamProfile?.profileurl} target="_blank" rel="noopener noreferrer" style={{ color: '#a1a1aa' }}><ExternalLink size={14} /></a>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={initiateSteamLogin}
                                style={{ width: '100%', background: '#171a21', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <img src="https://community.cloudflare.steamstatic.com/public/images/signinthroughsteam/sits_01.png" alt="Connect Steam" style={{ height: '20px' }} />
                            </button>
                        )}
                    </div>
                )}

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', color: '#e4e4e7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Level <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--primary)', fontSize: '0.9rem', color: 'white', fontWeight: 'bold' }}>{level}</span>
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '4px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', minWidth: '160px' }}>
                    <Star size={24} fill={rankColor} stroke={rankColor} style={{ opacity: 0.8 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Rank</div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: rankColor }}>{rankTitle}</div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                            <div style={{ width: `${progressToNextRank}%`, height: '100%', background: rankColor, borderRadius: '2px', transition: 'width 0.5s ease-out' }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#71717a', marginTop: '2px', textAlign: 'right' }}>{level} / {nextRankLevel} Next Rank</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
