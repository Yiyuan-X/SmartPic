"use client";
import { useAuth } from "@/lib/authClient";
import { callFunction } from "@/lib/callFn";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [delta, setDelta] = useState(10);

  const refresh = async () => {
    const list = await callFunction("adminUsers");
    setUsers(list);
  };

  const add = async (uid: string) => {
    await callFunction("adminAdjustPoints", { uid, delta });
    await refresh();
  };

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please login.</p>;

  return (
    <main className="card">
      <h1 className="text-2xl font-semibold mb-4">Admin Panel</h1>
      <div className="mb-4 flex items-center gap-3">
        <label className="label">Adjust delta</label>
        <input className="input w-32" type="number" value={delta} onChange={e=>setDelta(parseInt(e.target.value||"0"))} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">UID</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Points</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u:any)=> (
              <tr key={u.id} className="border-b">
                <td className="py-2 pr-4">{u.id}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.points ?? 0}</td>
                <td className="py-2">
                  <button onClick={()=>add(u.id)} className="btn btn-primary">+{delta}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-3">需要在 Firestore 的 users/{your_uid} 文档设置 role: "admin"</p>
    </main>
  );
}
