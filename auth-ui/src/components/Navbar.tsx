"use client";
import Link from "next/link";
import { useAuth } from "@/lib/authClient";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";

export default function Navbar() {
  const { user } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">SmartPicture</Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/admin" className="nav-link">Admin</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link href="/register" className="btn">Register</Link>
              <Link href="/login" className="btn btn-primary">Login</Link>
            </>
          ) : (
            <button className="btn" onClick={() => signOut(auth)}>Sign out</button>
          )}
        </div>
      </div>
    </header>
  );
}
