import React, { useEffect, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { rawgApi } from "../services/rawgApi";
import {
    SteamIcon,
    XboxIcon,
    PlaystationIcon,
    EpicGamesIcon,
    NintendoIcon,
    GOGIcon
} from "./StoreIcons";
import steamLogo from '../assets/512x512-logo-27129.png';
import xboxLogo from '../assets/xbox-logo-png-2492.png';
import psLogo from '../assets/playstation-logo-png_seeklogo-347961.png';
import nintendoLogo from '../assets/nintendo-7786.png';
import { getSteamAppId } from "../utils/steamUtils";
import { Play } from "lucide-react";
import './GameQuickView.css';

export default function GameQuickView({ game, onMouseEnter, onMouseLeave }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch details when game changes
    useEffect(() => {
        if (!game) return;

        // Reset
        setDetails(null);
        setLoading(true);

        const fetchDetails = async () => {
            try {
                const [detailsData, storesData] = await Promise.all([
                    rawgApi.getGameDetails(game.id),
                    rawgApi.getGameStores(game.id).catch(() => []) // Fallback to empty if store fetch fails
                ]);

                // Merge actual store URLs into details
                if (detailsData.stores && storesData) {
                    detailsData.stores = detailsData.stores.map(s => {
                        const matchingStore = storesData.find(sd => sd.store_id === s.store.id);
                        return matchingStore ? { ...s, url: matchingStore.url } : s;
                    });
                }

                setDetails(detailsData);
            } catch (e) {
                console.error("QV Fetch Error", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [game]);

    if (!game) return null;

    const getSafeStoreUrl = (storeObj) => {
        let url = storeObj.url;
        if (!url) return null;

        // Ensure absolute URL to prevent React Router from treating it as an internal route
        if (url.startsWith('/')) {
            return `https://rawg.io${url}`;
        }
        if (!url.startsWith('http')) {
            return `https://${url}`;
        }
        return url;
    };

    const renderStoreIcon = (storeObj) => {
        const storeId = storeObj.store.id;
        const slug = storeObj.store.slug;
        const storeName = storeObj.store.name;

        if (storeId === 1) {
            return {
                bg: '#171a21',
                icon: <img src={steamLogo} alt="Steam" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            };
        }
        if (storeId === 3 || slug === 'playstation-store') {
            return {
                bg: '#ffffff',
                icon: <img src={psLogo} alt="PlayStation" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            };
        }
        if (storeId === 2 || slug === 'xbox-store') {
            return {
                bg: '#107C10',
                icon: <img src={xboxLogo} alt="Xbox" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            };
        }
        if (storeId === 6 || storeName.includes('Nintendo')) {
            return {
                bg: '#e60012',
                icon: <img src={nintendoLogo} alt="Nintendo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            };
        }

        return {
            bg: 'rgba(255, 255, 255, 0.1)',
            icon: null
        };
    };

    return (
        <div
            className="quickview-container"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="quickview-panel">
                <div className="quickview-image-wrapper">
                    <img src={game.background_image || game.image} alt={game.name} />
                </div>

                <div className="quickview-details">
                    <div className="quickview-header">
                        <div className="title-row">
                            <h3 className="quickview-title">{game.name || game.title}</h3>
                            <div className="quickview-badges">
                                {details?.metacritic && (
                                    <div className={`metacritic-badge ${details.metacritic >= 75 ? 'high' : details.metacritic >= 50 ? 'med' : 'low'}`}>
                                        {details.metacritic}
                                    </div>
                                )}
                                <div className="rating-badge">
                                    <Star size={14} fill="currentColor" />
                                    {game.rating}
                                </div>
                            </div>
                        </div>
                        <div className="quickview-meta-row">
                            <span>{game.released?.split('-')[0] || game.year}</span>
                            <span>•</span>
                            <span>{game.genres?.slice(0, 2).map(g => (typeof g === 'string' ? g : g.name)).join(', ')}</span>
                            {game.playtime > 0 && (
                                <>
                                    <span>•</span>
                                    <span>{game.playtime}h playtime</span>
                                </>
                            )}
                        </div>
                    </div>

                    <p className={`quickview-desc ${loading ? 'loading' : ''}`}>
                        {loading ? "Loading game details..." : (details?.description_raw || "No description available.")}
                    </p>

                    <div className="quickview-footer">
                        <div className="quickview-platforms">
                            {details?.stores?.map(s => {
                                const { bg, icon } = renderStoreIcon(s);
                                const safeUrl = getSafeStoreUrl(s);
                                if (!safeUrl || !icon) return null;
                                
                                const glossyGradient = 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 100%)';

                                return (
                                    <a
                                        key={s.id}
                                        href={safeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="qv-platform-link"
                                        title={s.store.name}
                                        style={{
                                            background: `${glossyGradient}, ${bg}`,
                                            backgroundBlendMode: 'overlay, normal',
                                            padding: '4px',
                                            overflow: 'hidden'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {icon}
                                    </a>
                                );
                            })}
                        </div>

                        <div className="quickview-actions">
                            {getSteamAppId(details?.stores) && (
                                <button
                                    className="qv-btn steam-play"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = `steam://run/${getSteamAppId(details.stores)}`;
                                    }}
                                    style={{
                                        background: '#171a21',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        marginRight: '8px'
                                    }}
                                >
                                    <Play size={14} fill="white" /> Play
                                </button>
                            )}
                            <Link to={`/game/${game.id}`} style={{ textDecoration: 'none' }}>
                                <button className="qv-btn primary">
                                    View Details <ArrowRight size={18} />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
