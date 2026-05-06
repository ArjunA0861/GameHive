import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";

// Lazy load pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Browse = lazy(() => import("./pages/Browse"));
const GameDetails = lazy(() => import("./pages/GameDetails"));
const Search = lazy(() => import("./pages/Search"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));

import AdminRoute from "./routes/AdminRoute";

// firebase
import { auth, db } from "./firebase/config";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

import FloatingBackButton from "./components/FloatingBackButton";

const provider = new GoogleAuthProvider();

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          // Initial fetch to check for ban status and role
          const userRef = doc(db, "users", u.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const userData = snap.data();
            if (userData.banned) {
              await signOut(auth);
              alert("Your account has been banned.");
              setUser(null);
              return;
            }
            setIsAdmin(userData.role === "admin");
          } else {
            // First time login - create default user document
            const defaultUserData = {
              email: u.email,
              displayName: u.displayName || "Anonymous",
              photoURL: u.photoURL || "",
              uid: u.uid,
              role: "user",
              banned: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, defaultUserData);
            setIsAdmin(false);
          }

          // Listen for real-time updates to user data (like photoURL changes)
          unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Merge Auth user with Firestore data
              setUser({ ...u, ...data });
              setIsAdmin(data.role === "admin");
            }
          });

        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(u);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Sign in error:", err);
      // alert("Sign in failed: " + err.message); 
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  return (
    <div className="app-min-h-screen">
      <Navbar
        user={user}
        isAdmin={isAdmin}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      <Suspense fallback={
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'var(--bg-main)',
          color: 'var(--primary)'
        }}>
          <div className="spinner" style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(255,255,255,0.1)', 
            borderTop: '3px solid var(--primary)', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={
            <LandingPage user={user} onSignIn={handleGoogleSignIn} />
          } />
          <Route path="/browse" element={<Browse />} />
          <Route path="/search" element={<Search />} />
          <Route path="/game/:id" element={<GameDetails />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/profile/:uid" element={<Profile />} />
          {/* Add more routes here later */}
        </Routes>
      </Suspense>
      <FloatingBackButton />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
