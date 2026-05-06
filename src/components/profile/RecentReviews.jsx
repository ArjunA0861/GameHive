import React from 'react';
import ReviewPoster from './ReviewPoster';

export default function RecentReviews({
    panelStyle,
    reviews
}) {
    if (reviews.length === 0) return null;

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ fontSize: '1rem', color: '#a1a1aa', margin: 0 }}>Recent Reviews</h3>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>{reviews.length} total</span>
            </div>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                {reviews.slice(0, 5).map(review => (
                    <ReviewPoster key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
}
