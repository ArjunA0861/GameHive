import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';

export default function OverlayActions({ gameId, gameTitle, gameCover }) {
    const [inLibrary, setInLibrary] = useState(false);

    useEffect(() => {
        if (auth.currentUser) {
            fetchInitialState();
        } else {
            setLoading(false);
        }
    }, [gameId]);

    const fetchInitialState = async () => {
        try {
            // Check library
            const libQ = query(
                collection(db, "library"),
                where("userId", "==", auth.currentUser.uid),
                where("gameId", "==", Number(gameId))
            );
            const libSnap = await getDocs(libQ);
            setInLibrary(!libSnap.empty);
        } catch (err) {
            console.error("Error fetching overlay state:", err);
        }
    };

    const toggleLibrary = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!auth.currentUser) return alert("Please sign in");

        try {
            if (inLibrary) {
                const q = query(collection(db, "library"), where("userId", "==", auth.currentUser.uid), where("gameId", "==", Number(gameId)));
                const snap = await getDocs(q);
                snap.forEach(async (d) => await deleteDoc(doc(db, "library", d.id)));
                setInLibrary(false);
            } else {
                await addDoc(collection(db, "library"), {
                    userId: auth.currentUser.uid,
                    gameId: Number(gameId),
                    gameTitle: gameTitle || 'Unknown Game',
                    gameCover: gameCover || 'https://via.placeholder.com/300x400?text=No+Image',
                    status: 'Playing',
                    addedAt: Timestamp.now()
                });
                setInLibrary(true);
            }
        } catch (err) {
            console.error("Library sync failed:", err);
            alert("Failed to add to library: " + err.message);
        }
    };

    return (
        <div className="card-overlay-actions" style={{
            display: 'flex',
            gap: '8px',
            pointerEvents: 'auto'
        }}>
            <button
                className="icon-btn"
                onClick={toggleLibrary}
                style={{
                    background: inLibrary ? 'var(--primary)' : 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.2s'
                }}
                onMouseOver={e => !inLibrary && (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                onMouseOut={e => !inLibrary && (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
            >
                {inLibrary ? <Check size={18} /> : <Plus size={18} />}
            </button>
        </div>
    );
}
