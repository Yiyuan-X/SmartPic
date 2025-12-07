/* eslint-disable */
import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const bucket = getStorage().bucket();

export { admin, db, bucket };
