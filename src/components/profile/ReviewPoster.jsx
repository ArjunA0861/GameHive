import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_KEY = import.meta.env.VITE_RAWG_API_KEY;

export default function ReviewPoster({ review }) {
    const [imageUrl, setImageUrl] = useState(review.gameCover || null);

    useEffect(() => {
        if (!imageUrl && review.gameId) {
            fetch(`https://api.rawg.io/api/games/${review.gameId}?key=${API_KEY}`)
                .then(res => res.json())
                .then(data => {
                    if (data.background_image) setImageUrl(data.background_image);
                })
                .catch(err => console.error(err));
        }
    }, [review, imageUrl]);

    return (
        <div style={{ minWidth: '140px', maxWidth: '140px', flexShrink: 0 }}>
            <Link to={`/game/${review.gameId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div 
                    style={{ 
                        position: 'relative', 
                        aspectRatio: '2/3', 
                        borderRadius: '4px', 
                        overflow: 'hidden', 
                        marginBottom: '8px', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        background: '#1c1c1c' 
                    }}
                >
                    {imageUrl ? (
                        <img src={imageUrl} alt={review.gameTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#445566', fontSize: '10px' }}>{review.gameTitle}</div>
                    )}
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    ></div>
                </div>
            </Link>
            <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: i < review.rating ? '#7c3aed' : '#2c3440', fontSize: '12px' }}>★</span>
                ))}
            </div>
        </div>
    );
}
