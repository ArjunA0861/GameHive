import React from 'react';
import { Gamepad2, LogOut } from 'lucide-react';

export default function Navbar({ user, onSignIn, onSignOut }) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Gamepad2 color="#7c3aed" size={32} />
                <span style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                    Game<span className="text-gradient">Hive</span>
                </span>
            </div>

            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {user.displayName}
                        </span>
                        <img
                            src={user.photoURL}
                            alt="Profile"
                            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)' }}
                        />
                        <button
                            onClick={onSignOut}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                padding: '8px',
                                borderRadius: '8px',
                                color: 'white'
                            }}
                            title="Sign Out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                ) : (
                    <button className="btn-primary" onClick={onSignIn}>
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
