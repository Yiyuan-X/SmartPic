import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";

// 初始化 Firebase Admin（仅一次）
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const bucket = admin.storage().bucket();

/**
 * ✅ 示例函数：测试访问 Firestore
 */
export const adminUsers = onRequest(async (req, res) => {
  const snapshot = await db.collection("users").get();
  const count = snapshot.size;
  res.json({ message: `Total users: ${count}` });
});
