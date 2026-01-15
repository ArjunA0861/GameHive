import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Compass, BarChart3, ChevronRight } from 'lucide-react';
import backgroundVideo from '../assets/InShot_20251219_110914805.mp4';

export default function LandingPage({ user, onSignIn }) {
    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
            {/* Video Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.7)', // Dark overlay
                    zIndex: 1
                }}></div>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                >
                    {/* Video Source using imported asset */}
                    <source src={backgroundVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

            {/* Main Content */}
            <div style={{ position: 'relative', zIndex: 1, paddingTop: '100px', paddingBottom: '50px' }}>
                {/* Hero Section */}
                <section className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                        Your Ultimate <br />
                        <span className="text-gradient">Gaming Destination</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
                        Discover games, share opinions, and build your personal gaming universe.Where players explore, rate, and talk games together.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        {!user && (
                            <button className="btn-primary" onClick={onSignIn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Join Now <ChevronRight size={20} />
                            </button>
                        )}
                        <Link to="/browse" style={{
                            padding: '0.75rem 1.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '99px',
                            color: 'white',
                            fontWeight: '600',
                            display: 'inline-block'
                        }}>
                            Enter The Hive
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section className="container" style={{ marginTop: '50px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem'
                    }}>
                        <FeatureCard
                            icon={<Users color="#7c3aed" size={32} />}
                            title="Connect"
                            desc="Find teammates and build your squad with our advanced matching system."
                        />
                        <FeatureCard
                            icon={<Compass color="#db2777" size={32} />}
                            title="Explore"
                            desc="Discover new games, genres, reviews, and player-curated lists."
                        />
                        <FeatureCard
                            icon={<BarChart3 color="#3b82f6" size={32} />}
                            title="Track"
                            desc="Real-time analytics for your gameplay performance across all titles."
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="glass-card" style={{ padding: '2rem', transition: '0.3s' }}>
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
            }}>
                {icon}
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>
    );
}
