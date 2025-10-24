import {onRequest} from "firebase-functions/v2/https";
import admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function assertAdmin(uid?:string) {
  if (!uid) throw new Error("Unauthorized");
  const u = await db.doc(`users/${uid}`).get();
  if (!u.exists || u.data()?.role !== "admin") throw new Error("Forbidden");
}

export const adminUsers = onRequest({cors:true}, async (req, res) => {
  try {
    await assertAdmin(req.header("x-user-id") as string);
    const snap = await db.collection("users").limit(200).get();
    res.json(snap.docs.map(d => ({id:d.id, ...d.data()})));
  } catch (e:any) {
    res.status(e.message==="Forbidden"?403:401).json({error:e.message});
  }
});

export const adminAdjustPoints = onRequest({cors:true}, async (req, res) => {
  try {
    await assertAdmin(req.header("x-user-id") as string);
    const {uid, delta} = req.body;
    await db.doc(`users/${uid}`).set({points: admin.firestore.FieldValue.increment(delta)}, {merge:true});
    res.json({ok:true});
  } catch (e:any) {
    res.status(e.message==="Forbidden"?403:401).json({error:e.message});
  }
});
