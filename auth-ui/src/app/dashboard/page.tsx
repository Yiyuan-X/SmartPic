"use client";
import { useAuth } from "@/lib/authClient";
import { callFunction } from "@/lib/callFn";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [points, setPoints] = useState<number | null>(null);
  const [modelOut, setModelOut] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { email: user.email ?? "", points: 50, createdAt: Date.now() });
          setPoints(50);
        } else {
          setPoints(snap.data().points ?? 0);
        }
      }
    })();
  }, [user]);

  const runGemini = async () => {
    const res = await callFunction("geminiProxy", { prompt: "Say hello from SmartPicture." });
    setModelOut(JSON.stringify(res.data, null, 2));
    // Refresh points
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      setPoints(snap.exists() ? (snap.data().points ?? 0) : 0);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please login.</p>;

  return (
    <main className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Account</h2>
        <p className="text-sm text-gray-600">Email: {user.email}</p>
        <p className="text-sm text-gray-600">UID: {user.uid}</p>
        <p className="mt-2">Points: <b>{points ?? "-"}</b></p>
        <div className="mt-4 flex gap-3">
          <button onClick={runGemini} className="btn btn-primary">Run Gemini (cost 5)</button>
        </div>
      </div>
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Gemini Output</h2>
        <pre className="text-xs whitespace-pre-wrap">{modelOut}</pre>
      </div>
    </main>
  );
}
