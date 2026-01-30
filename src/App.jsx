import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Browse from "./pages/Browse";

import GameDetails from "./pages/GameDetails";
import Search from "./pages/Search";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./routes/AdminRoute";

// firebase
import { auth, db } from "./firebase/config";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Profile from "./pages/Profile";

const provider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
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

            if (userData.role === "admin") {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
          setUser(u);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(u); // Still set user if error, to allow debugging or basic access if acceptable
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsub();
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
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  return (
    <Router>
      <div className="app-min-h-screen">
        <Navbar
          user={user}
          isAdmin={isAdmin}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
        />

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
      </div>
    </Router>
  );
}

export default App;
