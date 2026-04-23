// SessionTimeout.js
import { useEffect } from "react";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

export default function SessionTimeout() {
  useEffect(() => {
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes
    let timer;

    const logout = () => {
      signOut(auth).then(() => {
        window.location.href = "/"; 
      });
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, INACTIVITY_LIMIT);
    };

    // Events to watch for activity
    const events = ["mousedown", "mousemove", "keypress", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer(); // Start timer

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(timer);
    };
  }, []);

  return null; // This component has no UI
}