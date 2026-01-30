import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const snap = await getDoc(userRef);

                    if (snap.exists() && snap.data().role === "admin") {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } catch (error) {
                    console.error("Error checking admin role:", error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return (
        <div style={{ paddingTop: 100, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Checking access...</p>
        </div>
    );

    if (!isAdmin) {
        return <Navigate to="/browse" />;
    }

    return children;
}

export default AdminRoute;
