import { Gamepad2, LogOut, Home, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

export default function Navbar({ user, isAdmin, onSignIn, onSignOut }) {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';
    const [pendingReports, setPendingReports] = useState(0);

    useEffect(() => {
        if (!user || !isAdmin) return;

        const q = query(
            collection(db, "reported_reviews"),
            where("status", "==", "pending")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingReports(snapshot.size);
        });

        return () => unsubscribe();
    }, [user, isAdmin]);

    const handleSignOut = () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            onSignOut();
        }
    };

    return (
        <nav className="glass-card" style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1200px',
            zIndex: 100,
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/browse" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
                    <Gamepad2 color="#7c3aed" size={32} />
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                        Game<span className="text-gradient">Hive</span>
                    </span>
                </Link>

                {!isLandingPage && (
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        transition: 'all 0.2s',
                        textDecoration: 'none'
                    }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)';
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                        title="Home"
                    >
                        <Home size={20} />
                    </Link>
                )}
            </div>

            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Admin Link */}
                        {isAdmin && (
                            <Link to="/admin" style={{
                                color: 'var(--text-main)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                border: '1px solid rgba(255,255,255,0.2)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                Dashboard
                                {pendingReports > 0 && (
                                    <span style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Bell size={12} /> {pendingReports}
                                    </span>
                                )}
                            </Link>
                        )}
                        <Link to={`/profile/${user.uid}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {user.displayName || user.name || "User"}
                            </span>
                            {user.photoURL ? (
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                border: '2px solid var(--primary)',
                                background: 'rgba(124, 58, 237, 0.2)',
                                color: 'white',
                                display: user.photoURL ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '8px',
                                borderRadius: '8px',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button className="btn-primary" onClick={onSignIn} style={{ border: 'none', cursor: 'pointer' }}>
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
