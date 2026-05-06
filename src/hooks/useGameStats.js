import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export default function useGameStats(gameId) {
    const [addedCount, setAddedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchCount = async () => {
            if (!gameId) return;

            try {
                const q = query(
                    collection(db, "library"),
                    where("gameId", "==", Number(gameId))
                );

                const snapshot = await getCountFromServer(q);
                if (isMounted) {
                    setAddedCount(snapshot.data().count);
                }
            } catch (err) {
                console.error("Error fetching game stats:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchCount();

        return () => { isMounted = false; };
    }, [gameId]);

    return { addedCount, loading };
}
