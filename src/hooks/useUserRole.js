import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config"; // Adjusted import path to match project structure

export default function useUserRole() {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Return early if no user is logged in initially, 
        // but better to listen to auth state to handle page reloads correctly like in AdminRoute
        // For simplicity following user request, but adding a check

        // Actually, onAuthStateChanged is safer if auth isn't ready. 
        // However, the user provided example uses auth.currentUser directly.
        // I'll stick to the user's snippet but wrap it in onAuthStateChanged if needed for reliability.
        // The user's snippet:
        /*
        if (!auth.currentUser) return;
        ...
        */
        // This might fail on refresh if auth isn't ready. 
        // I will improve it slightly to look like this:

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const ref = doc(db, "users", user.uid);
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        setRole(snap.data().role || "user");
                    } else {
                        setRole("user");
                    }
                } catch (e) {
                    console.error("Error fetching role", e);
                    setRole("user");
                }
            } else {
                setRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { role, loading };
}
