"use client";
import { useEffect, useState } from "react";
import { auth } from "./firebaseClient";
import { onAuthStateChanged, User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) localStorage.setItem("uid", u.uid);
      else localStorage.removeItem("uid");
    });
    return () => unsub();
  }, []);
  return { user, loading };
}

export function getUid() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("uid");
}
