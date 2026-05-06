import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Shield, ShieldOff, ArrowLeft, AlertTriangle } from 'lucide-react';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('users');
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        if (view === 'users') {
            fetchUsers();
        } else if (view === 'reports') {
            fetchReports();
        }
    }, [view]);

    const fetchUsers = async () => {
        setLoading(true);
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

    const fetchReports = async () => {
        setLoadingReports(true);
        try {
            const q = query(collection(db, "reported_reviews"), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            const reportsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReports(reportsList);
        } catch (error) {
            console.error("Error fetching reports:", error);
        } finally {
            setLoadingReports(false);
        }
    };

    const handleDismissReport = async (reportId) => {
        try {
            await updateDoc(doc(db, "reported_reviews", reportId), {
                status: 'dismissed'
            });
            setReports(reports.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Error dismissing report:", error);
            alert("Failed to dismiss report.");
        }
    };

    const handleDeleteReviewAndReport = async (reportId, reviewId) => {
        const confirm = window.confirm("Are you sure you want to delete this review and resolve the report?");
        if (!confirm) return;

        try {
            await deleteDoc(doc(db, "reviews", reviewId));
            await updateDoc(doc(db, "reported_reviews", reportId), {
                status: 'resolved'
            });
            setReports(reports.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Failed to delete review.");
        }
    };

    const handleBanAndResolve = async (reportId, reviewId, authorId) => {
        const confirm = window.confirm("Are you sure you want to ban this user, delete their review, and resolve the report?");
        if (!confirm) return;

        try {
            await updateDoc(doc(db, "users", authorId), {
                banned: true
            });
            await deleteDoc(doc(db, "reviews", reviewId));
            await updateDoc(doc(db, "reported_reviews", reportId), {
                status: 'resolved'
            });
            setReports(reports.filter(r => r.id !== reportId));
        } catch (error) {
            console.error("Error banning user:", error);
            alert("Failed to ban user and resolve report.");
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

    if (loading && view === 'users') {
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

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => setView('users')}
                    style={{
                        padding: '10px 20px',
                        background: view === 'users' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'background 0.2s'
                    }}
                >
                    Users
                </button>
                <button
                    onClick={() => setView('reports')}
                    style={{
                        padding: '10px 20px',
                        background: view === 'reports' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s'
                    }}
                >
                    <AlertTriangle size={18} /> Reports
                </button>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                {view === 'users' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>Reported Reviews</h2>

                        {loadingReports ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading reports...</p>
                        ) : reports.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending reports.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reports.map(report => (
                                    <div key={report.id} style={{
                                        padding: '1.5rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                    Game: <Link to={`/game/${report.gameId}`} style={{ color: '#a855f7', textDecoration: 'none' }}>{report.gameTitle}</Link>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Reported by: <Link to={`/profile/${report.reporterId}`} style={{ color: 'white', textDecoration: 'none' }}>{report.reporterName}</Link>
                                                    {' on '}{report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Unknown Date'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Author: <Link to={`/profile/${report.authorId}`} style={{ color: 'white', textDecoration: 'none' }}>{report.authorName}</Link>
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #ef4444',
                                            marginBottom: '1rem'
                                        }}>
                                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>"{report.reviewText}"</p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleDismissReport(report.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                                                onMouseLeave={e => e.target.style.background = 'transparent'}
                                            >
                                                Dismiss Report
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReviewAndReport(report.id, report.reviewId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'rgba(239, 68, 68, 0.2)',
                                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                                    color: '#ef4444',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.target.style.background = 'rgba(239, 68, 68, 0.3)'}
                                                onMouseLeave={e => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            >
                                                Delete Review
                                            </button>
                                            <button
                                                onClick={() => handleBanAndResolve(report.id, report.reviewId, report.authorId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: '#ef4444',
                                                    border: 'none',
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                                            >
                                                Ban User & Delete Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
