import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Shield, ShieldOff, ArrowLeft } from 'lucide-react';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const userList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBan = async (userId, currentStatus) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                banned: !currentStatus
            });
            // Update local state to reflect change immediately
            setUsers(users.map(user =>
                user.id === userId ? { ...user, banned: !currentStatus } : user
            ));
        } catch (error) {
            console.error("Error updating ban status:", error);
            alert("Failed to update status");
        }
    };

    if (loading) {
        return (
            <div style={{ paddingTop: 100, textAlign: 'center', color: 'white' }}>
                <p>Loading users...</p>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: 100, paddingBottom: 100, minHeight: '100vh', color: 'white', position: 'relative' }}>
            <Link to="/browse" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                transition: 'color 0.2s'
            }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
                <ArrowLeft size={18} /> Back to Browse
            </Link>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>User Management</h2>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>{user.name || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        background: user.role === 'admin' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.1)',
                                        color: user.role === 'admin' ? '#a78bfa' : 'var(--text-muted)',
                                        fontSize: '0.85rem'
                                    }}>
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {user.banned ? (
                                        <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldOff size={16} /> Banned
                                        </span>
                                    ) : (
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Shield size={16} /> Active
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {user.role !== 'admin' && (
                                        <button
                                            onClick={() => toggleBan(user.id, user.banned)}
                                            style={{
                                                background: user.banned ? '#10b981' : '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {user.banned ? 'Unban' : 'Ban User'}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminDashboard;
