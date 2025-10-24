import {onRequest} from "firebase-functions/v2/https";
import admin from "firebase-admin";
import fetch from "node-fetch";
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const geminiProxy = onRequest({cors:true}, async (req, res) => {
  try {
    const uid = req.header("x-user-id") as string | undefined;
    if (!uid) return res.status(401).json({error:"Unauthorized"});
    const userRef = db.doc(`users/${uid}`);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(404).json({error:"User not found"});
    const points = snap.data()?.points ?? 0;
    const cost = 5;
    if (points < cost) return res.status(402).json({error:"Insufficient points"});

    const prompt = req.body?.prompt ?? "";
    const apiKey = process.env.GEMINI_API_KEY!;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({contents:[{parts:[{text: prompt}]}]})
    });
    const data = await r.json();
    await userRef.update({points: points - cost, lastUseAt: admin.firestore.FieldValue.serverTimestamp()});
    return res.json({ok:true, data});
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({error:e?.message||"Internal error"});
  }
});
