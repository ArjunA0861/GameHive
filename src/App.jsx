import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Browse from "./pages/Browse";

import GameDetails from "./pages/GameDetails";
import Search from "./pages/Search";

// firebase
import { auth } from "./firebase/config";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const provider = new GoogleAuthProvider();

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
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
          {/* Add more routes here later */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
