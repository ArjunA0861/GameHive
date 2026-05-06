import React from 'react';

export default function GameCardSkeleton() {
    return (
        <div style={{
            minWidth: '160px',
            maxWidth: '160px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        }}>
            {/* Image Skeleton */}
            <div className="skeleton" style={{
                width: '100%',
                aspectRatio: '3/4',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)'
            }} />

            {/* Title Skeleton */}
            <div className="skeleton" style={{
                width: '80%',
                height: '1.2rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)'
            }} />

            {/* Meta Skeleton */}
            <div className="skeleton" style={{
                width: '50%',
                height: '0.8rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.05)'
            }} />

            <style>{`
                .skeleton {
                    position: relative;
                    overflow: hidden;
                }
                .skeleton::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}
