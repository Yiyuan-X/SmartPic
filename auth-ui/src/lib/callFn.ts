export async function callFunction(name: string, body?: any) {
  const base = process.env.NEXT_PUBLIC_FUNCTIONS_BASE;
  const uid = typeof window !== "undefined" ? localStorage.getItem("uid") : null;
  const res = await fetch(`${base}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(uid ? { "x-user-id": uid } : {}),
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
