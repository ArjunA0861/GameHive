import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FloatingBackButton() {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide on Landing Page and Browse Page
    if (location.pathname === '/' || location.pathname === '/browse') {
        return null;
    }

    return (
        <button
            onClick={() => navigate(-1)}
            style={{
                position: 'fixed',
                top: '27px',
                left: '30px',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '10px 20px',
                borderRadius: '30px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                outline: 'none'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <ArrowLeft size={20} /> Back
        </button>
    );
}
