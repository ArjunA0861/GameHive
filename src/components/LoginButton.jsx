import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase/config";

export default function LoginButton() {
  const provider = new GoogleAuthProvider();

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert("Logged in!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={login} style={{
      padding: "10px 20px",
      background: "white",
      borderRadius: "8px",
      cursor: "pointer"
    }}>
      Sign in with Google
    </button>
  );
}
